package com.macrobridge.profile;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {

    private final JdbcClient jdbc;

    public ProfileRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record ProfileRow(String displayName, String timezone, int targetCalories,
                             double targetProtein, double targetCarbs, double targetFat) {}

    public Optional<ProfileRow> find(UUID userId) {
        return jdbc.sql("""
                select display_name, timezone, target_calories, target_protein, target_carbs, target_fat
                from profiles where user_id = :userId
                """)
                .param("userId", userId)
                .query(ProfileRow.class)
                .optional();
    }

    /** Creates the profile; null values fall back to the column defaults. */
    public void insert(UUID userId, String timezone, Integer calories,
                       BigDecimal protein, BigDecimal carbs, BigDecimal fat) {
        jdbc.sql("insert into profiles (user_id) values (:userId)")
                .param("userId", userId)
                .update();
        update(userId, null, timezone, calories, protein, carbs, fat);
    }

    /** Changes only the non-null values. */
    public void update(UUID userId, String displayName, String timezone, Integer calories,
                       BigDecimal protein, BigDecimal carbs, BigDecimal fat) {
        jdbc.sql("""
                update profiles set
                  display_name    = coalesce(:displayName, display_name),
                  timezone        = coalesce(:timezone, timezone),
                  target_calories = coalesce(:calories, target_calories),
                  target_protein  = coalesce(:protein, target_protein),
                  target_carbs    = coalesce(:carbs, target_carbs),
                  target_fat      = coalesce(:fat, target_fat)
                where user_id = :userId
                """)
                .param("displayName", displayName)
                .param("timezone", timezone)
                .param("calories", calories)
                .param("protein", protein)
                .param("carbs", carbs)
                .param("fat", fat)
                .param("userId", userId)
                .update();
    }
}
