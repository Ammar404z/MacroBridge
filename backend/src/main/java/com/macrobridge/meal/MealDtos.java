package com.macrobridge.meal;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.macrobridge.gemini.GeminiClient.Suggestion;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class MealDtos {

    private MealDtos() {}

    public record AnalyzeRequest(
            @Size(max = 500) String description,
            // ~7.5 MB decoded; the frontend downscales photos well below this
            @Size(max = 10_000_000) String imageBase64,
            @Pattern(regexp = "image/(jpeg|png|webp|heic|heif)") String mimeType) {}

    public record Macros(int calories, double protein, double carbs, double fat) {}

    public record MealItem(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 100) String portion,
            @Min(0) int calories,
            @DecimalMin("0") double protein,
            @DecimalMin("0") double carbs,
            @DecimalMin("0") double fat) {}

    /** title is a short name for the meal, handy as the default description when logging. */
    public record Analysis(List<MealItem> items, Macros totals, String title, String confidence, String notes) {}

    public record LogRequest(
            @NotBlank @Size(max = 500) String description,
            @Min(0) @Max(20000) int calories,
            @DecimalMin("0") @DecimalMax("9999") double protein,
            @DecimalMin("0") @DecimalMax("9999") double carbs,
            @DecimalMin("0") @DecimalMax("9999") double fat,
            @Pattern(regexp = "breakfast|lunch|dinner|snack") String mealLabel,
            @Pattern(regexp = "text|photo|manual") String source,
            @Valid @Size(max = 50) List<MealItem> items,
            @Pattern(regexp = "low|medium|high") String confidence,
            @Size(max = 1000) String aiNotes,
            // Optional: log to a past day (e.g. a forgotten dinner); defaults to today
            LocalDate logDate) {}

    public record MealDto(
            UUID id, String mealLabel, String description, String source,
            int calories, double protein, double carbs, double fat,
            double servings, UUID customFoodId,
            String confidence, String aiNotes, OffsetDateTime loggedAt, LocalDate logDate) {}

    public record SuggestRequest(@Size(max = 300) String request) {}

    public record SuggestResponse(Macros remaining, List<Suggestion> suggestions) {}

    /** Replaces the editable fields of a logged meal; logDate is optional and moves it to another day. */
    public record EditMealRequest(
            @NotBlank @Size(max = 500) String description,
            @Min(0) @Max(20000) int calories,
            @DecimalMin("0") @DecimalMax("9999") double protein,
            @DecimalMin("0") @DecimalMax("9999") double carbs,
            @DecimalMin("0") @DecimalMax("9999") double fat,
            @Pattern(regexp = "breakfast|lunch|dinner|snack") String mealLabel,
            LocalDate logDate) {}

    public record DayResponse(LocalDate date, List<MealDto> logs, Macros totals, Macros targets) {}

    public record DaySummary(LocalDate date, int meals, Macros totals) {}

    /** Only days with at least one meal are listed, newest first. targets are the current ones. */
    public record HistoryResponse(LocalDate from, LocalDate to, Macros targets, List<DaySummary> days) {}
}
