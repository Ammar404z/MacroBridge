package com.macrobridge.meal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.macrobridge.common.ApiException;
import com.macrobridge.common.Jpeg;
import com.macrobridge.food.FoodRepository;
import com.macrobridge.food.FoodRepository.Food;
import com.macrobridge.gemini.AiQuota;
import com.macrobridge.gemini.GeminiClient;
import com.macrobridge.meal.MealDtos.AnalyzeRequest;
import com.macrobridge.meal.MealDtos.Analysis;
import com.macrobridge.meal.MealDtos.LogRequest;
import com.macrobridge.meal.MealDtos.Macros;
import com.macrobridge.meal.MealDtos.MealDto;
import com.macrobridge.meal.MealDtos.SuggestResponse;
import com.macrobridge.meal.MealDtos.DayResponse;
import com.macrobridge.meal.MealDtos.DaySummary;
import com.macrobridge.meal.MealDtos.EditMealRequest;
import com.macrobridge.meal.MealDtos.HistoryResponse;
import com.macrobridge.profile.ProfileRepository;
import com.macrobridge.profile.ProfileRepository.ProfileRow;

import tools.jackson.databind.json.JsonMapper;

@Service
public class MealService {

    private final MealRepository meals;
    private final ProfileRepository profiles;
    private final FoodRepository foods;
    private final GeminiClient gemini;
    private final AiQuota quota;
    private final JsonMapper json;

    public MealService(MealRepository meals, ProfileRepository profiles, FoodRepository foods,
                       GeminiClient gemini, AiQuota quota, JsonMapper json) {
        this.meals = meals;
        this.profiles = profiles;
        this.foods = foods;
        this.gemini = gemini;
        this.quota = quota;
        this.json = json;
    }

    public Analysis analyze(UUID userId, AnalyzeRequest req) {
        boolean hasText = req.description() != null && !req.description().isBlank();
        boolean hasImage = req.imageBase64() != null && !req.imageBase64().isBlank();
        if (!hasText && !hasImage) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Describe the meal or add a photo");
        }
        if (hasImage && req.mimeType() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "mimeType is required with an image");
        }
        quota.use(userId);
        var result = gemini.analyze(req.description(), hasImage ? req.imageBase64() : null, req.mimeType());
        if (result.items() == null || result.items().isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Couldn't recognize any food, try describing it");
        }
        // Sum ourselves rather than trusting the model's arithmetic
        var totals = sum(result.items().stream()
                .map(i -> new Macros(i.calories(), i.protein(), i.carbs(), i.fat())).toList());
        return new Analysis(result.items(), totals, result.title(), result.confidence(), result.notes());
    }

    @Transactional
    public MealDto log(UUID userId, LogRequest req) {
        String items = req.items() == null || req.items().isEmpty() ? null : json.writeValueAsString(req.items());
        byte[] photo = req.photoBase64() == null || req.photoBase64().isBlank() ? null : Jpeg.decode(req.photoBase64());
        MealDto meal = meals.insert(userId, logDate(userId, req.logDate()), req, items, null, 1);
        if (photo == null) return meal;
        meals.savePhoto(meal.id(), photo);
        return find(userId, meal.id());
    }

    /** logDate is optional (null = today), like for /log. */
    public MealDto logFood(UUID userId, Food food, double servings, String mealLabel, LocalDate logDate) {
        var req = new LogRequest(
                servings == 1 ? food.name() : food.name() + " × " + BigDecimal.valueOf(servings).stripTrailingZeros().toPlainString(),
                (int) Math.round(food.calories() * servings),
                round1(food.protein() * servings),
                round1(food.carbs() * servings),
                round1(food.fat() * servings),
                mealLabel, "custom_food", null, null, null, null, null);
        return meals.insert(userId, logDate(userId, logDate), req, null, food.id(), servings);
    }

    public DayResponse today(UUID userId) {
        ProfileRow p = profile(userId);
        return day(userId, p, today(p));
    }

    public DayResponse day(UUID userId, LocalDate date) {
        return day(userId, profile(userId), date);
    }

    private DayResponse day(UUID userId, ProfileRow p, LocalDate date) {
        List<MealDto> logs = meals.findByDate(userId, date);
        var totals = sum(logs.stream().map(m -> new Macros(m.calories(), m.protein(), m.carbs(), m.fat())).toList());
        var targets = new Macros(p.targetCalories(), p.targetProtein(), p.targetCarbs(), p.targetFat());
        return new DayResponse(date, logs, totals, targets);
    }

    public SuggestResponse suggest(UUID userId, String request) {
        DayResponse today = today(userId);
        Macros t = today.targets(), e = today.totals();
        var remaining = new Macros(Math.max(0, t.calories() - e.calories()),
                round1(Math.max(0, t.protein() - e.protein())),
                round1(Math.max(0, t.carbs() - e.carbs())),
                round1(Math.max(0, t.fat() - e.fat())));
        List<String> eaten = today.logs().stream().map(MealDto::description).toList();
        List<String> myFoods = foods.findAll(userId).stream()
                .map(f -> "%s (%s): %d kcal, P %.1f, C %.1f, F %.1f".formatted(
                        f.name(), f.servingLabel(), f.calories(), f.protein(), f.carbs(), f.fat()))
                .toList();
        quota.use(userId);
        return new SuggestResponse(remaining, gemini.suggest(remaining, eaten, myFoods, request));
    }

    /** The last `days` days up to and including the user's today. */
    public HistoryResponse history(UUID userId, int days) {
        ProfileRow p = profile(userId);
        LocalDate to = today(p);
        LocalDate from = to.minusDays(days - 1);
        var targets = new Macros(p.targetCalories(), p.targetProtein(), p.targetCarbs(), p.targetFat());
        var summaries = meals.summarize(userId, from, to).stream()
                .map(s -> new DaySummary(s.date(), s.meals(), new Macros(s.totals().calories(),
                        round1(s.totals().protein()), round1(s.totals().carbs()), round1(s.totals().fat()))))
                .toList();
        return new HistoryResponse(from, to, targets, summaries);
    }

    public MealDto find(UUID userId, UUID mealId) {
        return meals.find(userId, mealId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Meal not found"));
    }

    public byte[] photo(UUID viewer, UUID mealId) {
        return meals.findPhoto(viewer, mealId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No photo"));
    }

    public MealDto edit(UUID userId, UUID mealId, EditMealRequest req) {
        if (req.logDate() != null) logDate(userId, req.logDate());
        return meals.update(userId, mealId, req)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Meal not found"));
    }

    public void delete(UUID userId, UUID mealId) {
        if (!meals.delete(userId, mealId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Meal not found");
        }
    }

    private ProfileRow profile(UUID userId) {
        return profiles.find(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }

    /** The day a meal goes on: the requested one (today or earlier), or today when none is given. */
    private LocalDate logDate(UUID userId, LocalDate requested) {
        LocalDate today = today(profile(userId));
        if (requested == null) return today;
        if (requested.isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "logDate can't be in the future");
        }
        return requested;
    }

    /** "Today" is the user's local date, so a late dinner doesn't land on tomorrow's log. */
    private static LocalDate today(ProfileRow p) {
        return LocalDate.now(ZoneId.of(p.timezone()));
    }

    private static Macros sum(List<Macros> list) {
        int calories = 0;
        double protein = 0, carbs = 0, fat = 0;
        for (Macros m : list) {
            calories += m.calories();
            protein += m.protein();
            carbs += m.carbs();
            fat += m.fat();
        }
        return new Macros(calories, round1(protein), round1(carbs), round1(fat));
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
