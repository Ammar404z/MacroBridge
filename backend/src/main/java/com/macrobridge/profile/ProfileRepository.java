package com.macrobridge.profile;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {

    private final JdbcClient jdbc;

    public ProfileRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Creates the profile; null values fall back to the column defaults. */
    public void insert(UUID userId, String timezone, Integer calories,
                       BigDecimal protein, BigDecimal carbs, BigDecimal fat) {
        jdbc.sql("insert into profiles (user_id) values (:userId)")
                .param("userId", userId)
                .update();
        jdbc.sql("""
                update profiles set
                  timezone        = coalesce(:timezone, timezone),
                  target_calories = coalesce(:calories, target_calories),
                  target_protein  = coalesce(:protein, target_protein),
                  target_carbs    = coalesce(:carbs, target_carbs),
                  target_fat      = coalesce(:fat, target_fat)
                where user_id = :userId
                """)
                .param("timezone", timezone)
                .param("calories", calories)
                .param("protein", protein)
                .param("carbs", carbs)
                .param("fat", fat)
                .param("userId", userId)
                .update();
    }
}
