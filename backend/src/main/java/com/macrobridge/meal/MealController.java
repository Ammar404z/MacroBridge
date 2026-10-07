package com.macrobridge.meal;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.macrobridge.common.ApiResponse;
import com.macrobridge.meal.MealDtos.AnalyzeRequest;
import com.macrobridge.meal.MealDtos.Analysis;
import com.macrobridge.meal.MealDtos.LogRequest;
import com.macrobridge.meal.MealDtos.MealDto;
import com.macrobridge.meal.MealDtos.SuggestRequest;
import com.macrobridge.meal.MealDtos.SuggestResponse;
import com.macrobridge.meal.MealDtos.TodayResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/meals")
public class MealController {

    private final MealService mealService;

    public MealController(MealService mealService) {
        this.mealService = mealService;
    }

    /** Estimates macros only; nothing is saved until the user confirms via /log. */
    @PostMapping("/analyze")
    ApiResponse<Analysis> analyze(@Valid @RequestBody AnalyzeRequest req) {
        return ApiResponse.ok(mealService.analyze(req));
    }

    @PostMapping("/log")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<MealDto> log(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody LogRequest req) {
        return ApiResponse.ok(mealService.log(userId(jwt), req));
    }

    @GetMapping("/today")
    ApiResponse<TodayResponse> today(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(mealService.today(userId(jwt)));
    }

    /** Meal ideas for the macros left today; the body is optional, e.g. { "request": "quick, no cooking" }. */
    @PostMapping("/suggest")
    ApiResponse<SuggestResponse> suggest(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody(required = false) SuggestRequest req) {
        return ApiResponse.ok(mealService.suggest(userId(jwt), req == null ? null : req.request()));
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        mealService.delete(userId(jwt), id);
        return ApiResponse.ok(null);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
