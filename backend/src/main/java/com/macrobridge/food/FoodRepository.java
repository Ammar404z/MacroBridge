package com.macrobridge.food;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.macrobridge.food.FoodController.FoodRequest;

@Repository
public class FoodRepository {

    /** Macros are per serving. */
    public record Food(UUID id, String name, String servingLabel,
                       int calories, double protein, double carbs, double fat) {}

    private static final String COLUMNS = "id, name, serving_label, calories, protein, carbs, fat";

    private final JdbcClient jdbc;

    public FoodRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<Food> findAll(UUID userId) {
        return jdbc.sql("select " + COLUMNS + " from custom_foods where user_id = :userId order by lower(name)")
                .param("userId", userId)
                .query(Food.class)
                .list();
    }

    public Optional<Food> find(UUID userId, UUID id) {
        return jdbc.sql("select " + COLUMNS + " from custom_foods where id = :id and user_id = :userId")
                .param("id", id)
                .param("userId", userId)
                .query(Food.class)
                .optional();
    }

    /** Throws DuplicateKeyException if the user already has a food with this name. */
    public Food insert(UUID userId, FoodRequest req) {
        return params(jdbc.sql("""
                insert into custom_foods (user_id, name, serving_label, calories, protein, carbs, fat)
                values (:userId, :name, coalesce(:servingLabel, '1 serving'), :calories, :protein, :carbs, :fat)
                returning\s""" + COLUMNS), userId, req)
                .query(Food.class)
                .single();
    }

    /** Empty if the food doesn't exist or isn't the user's. Throws DuplicateKeyException on a name clash. */
    public Optional<Food> update(UUID userId, UUID id, FoodRequest req) {
        return params(jdbc.sql("""
                update custom_foods set
                  name = :name, serving_label = coalesce(:servingLabel, '1 serving'),
                  calories = :calories, protein = :protein, carbs = :carbs, fat = :fat
                where id = :id and user_id = :userId
                returning\s""" + COLUMNS), userId, req)
                .param("id", id)
                .query(Food.class)
                .optional();
    }

    /** Past meals logged from this food keep their macros; their link is set to null. */
    public boolean delete(UUID userId, UUID id) {
        return jdbc.sql("delete from custom_foods where id = :id and user_id = :userId")
                .param("id", id)
                .param("userId", userId)
                .update() > 0;
    }

    private static JdbcClient.StatementSpec params(JdbcClient.StatementSpec spec, UUID userId, FoodRequest req) {
        String label = req.servingLabel() == null || req.servingLabel().isBlank() ? null : req.servingLabel().trim();
        return spec.param("userId", userId)
                .param("name", req.name().trim())
                .param("servingLabel", label)
                .param("calories", req.calories())
                .param("protein", req.protein())
                .param("carbs", req.carbs())
                .param("fat", req.fat());
    }
}
