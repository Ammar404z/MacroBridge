package com.macrobridge.food;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.macrobridge.common.ApiException;
import com.macrobridge.common.ApiResponse;
import com.macrobridge.food.FoodRepository.Food;
import com.macrobridge.meal.MealDtos.MealDto;
import com.macrobridge.meal.MealService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** The user's own food/recipe library, for meals they eat again and again. */
@RestController
@RequestMapping("/api/foods")
public class FoodController {

    public record FoodRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 50) String servingLabel,
            @Min(0) @Max(20000) int calories,
            @DecimalMin("0") @DecimalMax("9999") double protein,
            @DecimalMin("0") @DecimalMax("9999") double carbs,
            @DecimalMin("0") @DecimalMax("9999") double fat) {}

    public record LogFoodRequest(
            @DecimalMin(value = "0", inclusive = false) @DecimalMax("100") double servings,
            @Pattern(regexp = "breakfast|lunch|dinner|snack") String mealLabel,
            LocalDate logDate) {}

    private final FoodRepository foods;
    private final MealService mealService;

    public FoodController(FoodRepository foods, MealService mealService) {
        this.foods = foods;
        this.mealService = mealService;
    }

    @GetMapping
    ApiResponse<List<Food>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(foods.findAll(userId(jwt)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<Food> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody FoodRequest req) {
        try {
            return ApiResponse.ok(foods.insert(userId(jwt), req));
        } catch (DuplicateKeyException e) {
            throw duplicate();
        }
    }

    @PutMapping("/{id}")
    ApiResponse<Food> update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                             @Valid @RequestBody FoodRequest req) {
        try {
            return ApiResponse.ok(foods.update(userId(jwt), id, req).orElseThrow(FoodController::notFound));
        } catch (DuplicateKeyException e) {
            throw duplicate();
        }
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        if (!foods.delete(userId(jwt), id)) throw notFound();
        return ApiResponse.ok(null);
    }

    /** Logs the food to today's meals, scaled by servings. */
    @PostMapping("/{id}/log")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<MealDto> log(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                             @Valid @RequestBody LogFoodRequest req) {
        UUID userId = userId(jwt);
        Food food = foods.find(userId, id).orElseThrow(FoodController::notFound);
        return ApiResponse.ok(mealService.logFood(userId, food, req.servings(), req.mealLabel(), req.logDate()));
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "Food not found");
    }

    private static ApiException duplicate() {
        return new ApiException(HttpStatus.CONFLICT, "You already have a food with this name");
    }
}
