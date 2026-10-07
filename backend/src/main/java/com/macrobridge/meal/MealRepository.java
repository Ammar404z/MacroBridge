package com.macrobridge.meal;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.macrobridge.meal.MealDtos.DaySummary;
import com.macrobridge.meal.MealDtos.EditMealRequest;
import com.macrobridge.meal.MealDtos.LogRequest;
import com.macrobridge.meal.MealDtos.Macros;
import com.macrobridge.meal.MealDtos.MealDto;

@Repository
public class MealRepository {

    private final JdbcClient jdbc;

    public MealRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    private static final String COLUMNS = """
            id, meal_label, description, source, calories, protein, carbs, fat,
            servings, custom_food_id, confidence, ai_notes, logged_at
            """;

    /**
     * itemsJson may be null; it's stored as jsonb for the per-item breakdown.
     * customFoodId is only set when the meal was logged from the user's food library.
     */
    public MealDto insert(UUID userId, LocalDate logDate, LogRequest req, String itemsJson,
                          UUID customFoodId, double servings) {
        return jdbc.sql("""
                insert into meals (user_id, log_date, meal_label, description, source,
                                   calories, protein, carbs, fat, items, confidence, ai_notes,
                                   custom_food_id, servings)
                values (:userId, :logDate, coalesce(:mealLabel, 'snack'), :description, coalesce(:source, 'text'),
                        :calories, :protein, :carbs, :fat, cast(:items as jsonb), :confidence, :aiNotes,
                        :customFoodId, :servings)
                """ + " returning " + COLUMNS)
                .param("userId", userId)
                .param("logDate", logDate)
                .param("mealLabel", req.mealLabel())
                .param("description", req.description().trim())
                .param("source", req.source())
                .param("calories", req.calories())
                .param("protein", req.protein())
                .param("carbs", req.carbs())
                .param("fat", req.fat())
                .param("items", itemsJson)
                .param("confidence", req.confidence())
                .param("aiNotes", req.aiNotes())
                .param("customFoodId", customFoodId)
                .param("servings", servings)
                .query(MealDto.class)
                .single();
    }

    public List<MealDto> findByDate(UUID userId, LocalDate logDate) {
        return jdbc.sql("select " + COLUMNS + " from meals where user_id = :userId and log_date = :logDate order by logged_at")
                .param("userId", userId)
                .param("logDate", logDate)
                .query(MealDto.class)
                .list();
    }

    /** Empty if the meal doesn't exist or belongs to someone else. A null logDate keeps the current day. */
    public Optional<MealDto> update(UUID userId, UUID id, EditMealRequest req) {
        return jdbc.sql("""
                update meals set
                  description = :description, calories = :calories, protein = :protein, carbs = :carbs, fat = :fat,
                  meal_label = coalesce(:mealLabel, meal_label), log_date = coalesce(:logDate, log_date)
                where id = :id and user_id = :userId
                """ + " returning " + COLUMNS)
                .param("description", req.description().trim())
                .param("calories", req.calories())
                .param("protein", req.protein())
                .param("carbs", req.carbs())
                .param("fat", req.fat())
                .param("mealLabel", req.mealLabel())
                .param("logDate", req.logDate())
                .param("id", id)
                .param("userId", userId)
                .query(MealDto.class)
                .optional();
    }

    /** Per-day totals between two dates (inclusive), newest first; days without meals are left out. */
    public List<DaySummary> summarize(UUID userId, LocalDate from, LocalDate to) {
        return jdbc.sql("""
                select log_date, count(*) as meals, sum(calories) as calories,
                       sum(protein) as protein, sum(carbs) as carbs, sum(fat) as fat
                from meals
                where user_id = :userId and log_date between :from and :to
                group by log_date
                order by log_date desc
                """)
                .param("userId", userId)
                .param("from", from)
                .param("to", to)
                .query((rs, n) -> new DaySummary(rs.getObject("log_date", LocalDate.class), rs.getInt("meals"),
                        new Macros(rs.getInt("calories"), rs.getDouble("protein"),
                                rs.getDouble("carbs"), rs.getDouble("fat"))))
                .list();
    }

    /** Returns false if the meal doesn't exist or belongs to someone else. */
    public boolean delete(UUID userId, UUID id) {
        return jdbc.sql("delete from meals where id = :id and user_id = :userId")
                .param("id", id)
                .param("userId", userId)
                .update() > 0;
    }
}
