package com.macrobridge.gemini;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.macrobridge.common.ApiException;
import com.macrobridge.meal.MealDtos.Macros;
import com.macrobridge.meal.MealDtos.MealItem;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/** Gemini calls: per-item macro estimates for a meal, and meal ideas for the macros left today. */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    private static final String PROMPT = """
            You are a nutrition estimator. You get a text description of a meal, a photo of it, or both.
            With both, they describe the same meal together: include every food visible in the photo AND every food
            mentioned in the text. The text may add things the photo doesn't show (a drink, a sauce, cooking oil,
            a second helping, something already eaten) and may clarify what is visible (what a food is, its portion,
            how it was cooked). When text and photo disagree, trust the text. Never count the same food twice.
            List each food item with its estimated portion and macros (calories in kcal; protein, carbs, fat in grams).
            Assume typical portions when none are given. If there is no food, return an empty items list.
            title: a short name for the whole meal, e.g. "Eggs, toast and coffee".
            confidence: "high" if items and portions are clear, "medium" if portions are guessed, "low" if the food itself is unclear.
            notes: one short sentence on the main assumptions.
            """;

    private static final String SCHEMA = """
            {
              "type": "object",
              "properties": {
                "items": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": {"type": "string"},
                      "portion": {"type": "string"},
                      "calories": {"type": "integer"},
                      "protein": {"type": "number"},
                      "carbs": {"type": "number"},
                      "fat": {"type": "number"}
                    },
                    "required": ["name", "portion", "calories", "protein", "carbs", "fat"]
                  }
                },
                "title": {"type": "string"},
                "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
                "notes": {"type": "string"}
              },
              "required": ["items", "title", "confidence", "notes"]
            }
            """;

    private static final String SUGGEST_PROMPT = """
            You are a practical meal planner. Suggest 3 different ideas for the user's NEXT meal or snack.
            Each idea is one normal sitting, not the rest of the day: size it to roughly a third to a half of the
            calories left (a light snack if little is left), never more than what is left, and lean on protein
            when protein left is high relative to calories.
            Prefer simple, realistic meals. You may reuse the user's saved foods when they fit, by their exact name.
            Respect the user's request if there is one.
            name: a short, plain dish name, e.g. "Turkey and rice skillet". No marketing words.
            description: one short sentence with the main portions, e.g. "250 g skyr, a banana, 40 g oats and honey."
            Macros are your estimate for the whole idea (calories in kcal; protein, carbs, fat in grams).
            """;

    private static final String SUGGEST_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "suggestions": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": {"type": "string"},
                      "description": {"type": "string"},
                      "calories": {"type": "integer"},
                      "protein": {"type": "number"},
                      "carbs": {"type": "number"},
                      "fat": {"type": "number"}
                    },
                    "required": ["name", "description", "calories", "protein", "carbs", "fat"]
                  }
                }
              },
              "required": ["suggestions"]
            }
            """;

    public record Result(List<MealItem> items, String title, String confidence, String notes) {}

    public record Suggestion(String name, String description, int calories, double protein, double carbs, double fat) {}

    record SuggestResult(List<Suggestion> suggestions) {}

    record Response(List<Candidate> candidates) {}
    record Candidate(Content content) {}
    record Content(List<Part> parts) {}
    record Part(String text) {}

    private final RestClient http;
    private final JsonMapper json;
    private final Object analyzeSchema;
    private final Object suggestSchema;
    private final boolean configured;

    public GeminiClient(JsonMapper json,
                        @Value("${gemini.api-key}") String apiKey,
                        @Value("${gemini.model}") String model) {
        var timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(Duration.ofSeconds(5));
        timeouts.setReadTimeout(Duration.ofSeconds(60));
        this.http = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent")
                .defaultHeader("x-goog-api-key", apiKey)
                .requestFactory(timeouts)
                .build();
        this.json = json;
        this.analyzeSchema = json.readValue(SCHEMA, Map.class);
        this.suggestSchema = json.readValue(SUGGEST_SCHEMA, Map.class);
        // Missing key shouldn't stop the rest of the app from starting
        this.configured = !apiKey.isBlank();
    }

    public Result analyze(String description, String imageBase64, String mimeType) {
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", PROMPT));
        boolean hasText = description != null && !description.isBlank();
        if (imageBase64 != null) {
            parts.add(Map.of("inline_data", Map.of("mime_type", mimeType, "data", imageBase64)));
            if (hasText) parts.add(Map.of("text", "The user's note about this photo: " + description));
        } else if (hasText) {
            parts.add(Map.of("text", "Meal: " + description));
        }
        Result result = generate(parts, analyzeSchema, Result.class, 0.2);
        if (result == null) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Couldn't recognize any food, try describing it");
        }
        return result;
    }

    /**
     * Meal ideas that fit the macros left today. myFoods lines are the user's saved foods,
     * so ideas can reuse what they actually eat.
     */
    public List<Suggestion> suggest(Macros remaining, List<String> eatenToday, List<String> myFoods, String request) {
        String context = """
                Macros left for today: %d kcal, %.1f g protein, %.1f g carbs, %.1f g fat.
                Already eaten today: %s
                The user's saved foods (per serving): %s
                Request: %s
                """.formatted(remaining.calories(), remaining.protein(), remaining.carbs(), remaining.fat(),
                eatenToday.isEmpty() ? "nothing yet" : String.join("; ", eatenToday),
                myFoods.isEmpty() ? "none" : String.join("; ", myFoods),
                request == null || request.isBlank() ? "none" : request);
        SuggestResult result = generate(
                List.of(Map.of("text", SUGGEST_PROMPT), Map.of("text", context)),
                suggestSchema, SuggestResult.class, 0.7);
        if (result == null || result.suggestions() == null || result.suggestions().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Couldn't come up with suggestions, try again");
        }
        return result.suggestions();
    }

    /** Returns null when Gemini declined to answer. */
    private <T> T generate(List<Map<String, Object>> parts, Object schema, Class<T> type, double temperature) {
        if (!configured) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI isn't set up: GEMINI_API_KEY is missing");
        }
        var body = Map.of(
                "contents", List.of(Map.of("role", "user", "parts", parts)),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseJsonSchema", schema,
                        "temperature", temperature));

        Response res;
        try {
            res = http.post().body(body).retrieve().body(Response.class);
        } catch (HttpClientErrorException.TooManyRequests e) {
            // The shared Gemini quota (per project, per day) is used up
            log.warn("Gemini quota exceeded: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The AI has hit its daily limit. Try again later, or enter macros manually.");
        } catch (RestClientException e) {
            log.warn("Gemini request failed", e);
            throw unavailable();
        }

        String text = firstText(res);
        if (text == null) return null;
        try {
            return json.readValue(text, type);
        } catch (JacksonException e) {
            log.warn("Gemini returned unparseable JSON: {}", text);
            throw unavailable();
        }
    }

    private static ApiException unavailable() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "The AI couldn't answer right now, try again");
    }

    /** Null when Gemini declined to answer (e.g. a safety block returns no candidates or parts). */
    private static String firstText(Response res) {
        if (res == null || res.candidates() == null || res.candidates().isEmpty()) return null;
        Content content = res.candidates().get(0).content();
        if (content == null || content.parts() == null) return null;
        return content.parts().stream().map(Part::text).filter(t -> t != null).findFirst().orElse(null);
    }
}
