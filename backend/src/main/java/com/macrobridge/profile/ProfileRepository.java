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

    /** avatarVersion is null without a picture; it changes on every upload (use it to bust caches). */
    public record ProfileRow(String displayName, String timezone, int targetCalories,
                             double targetProtein, double targetCarbs, double targetFat,
                             boolean shareMeals, Long avatarVersion) {}

    public Optional<ProfileRow> find(UUID userId) {
        return jdbc.sql("""
                select p.display_name, p.timezone, p.target_calories, p.target_protein, p.target_carbs, p.target_fat,
                       p.share_meals, (extract(epoch from a.updated_at) * 1000)::bigint as avatar_version
                from profiles p
                left join avatars a on a.user_id = p.user_id
                where p.user_id = :userId
                """)
                .param("userId", userId)
                .query(ProfileRow.class)
                .optional();
    }

    /** Creates the profile; null values fall back to the column defaults. */
    public void insert(UUID userId, String displayName, String timezone, Integer calories,
                       BigDecimal protein, BigDecimal carbs, BigDecimal fat) {
        jdbc.sql("insert into profiles (user_id) values (:userId)")
                .param("userId", userId)
                .update();
        update(userId, displayName, timezone, calories, protein, carbs, fat, null);
    }

    /** Changes only the non-null values. */
    public void update(UUID userId, String displayName, String timezone, Integer calories,
                       BigDecimal protein, BigDecimal carbs, BigDecimal fat, Boolean shareMeals) {
        jdbc.sql("""
                update profiles set
                  display_name    = coalesce(:displayName, display_name),
                  timezone        = coalesce(:timezone, timezone),
                  target_calories = coalesce(:calories, target_calories),
                  target_protein  = coalesce(:protein, target_protein),
                  target_carbs    = coalesce(:carbs, target_carbs),
                  target_fat      = coalesce(:fat, target_fat),
                  share_meals     = coalesce(:shareMeals, share_meals)
                where user_id = :userId
                """)
                .param("displayName", displayName)
                .param("timezone", timezone)
                .param("calories", calories)
                .param("protein", protein)
                .param("carbs", carbs)
                .param("fat", fat)
                .param("shareMeals", shareMeals)
                .param("userId", userId)
                .update();
    }
}
