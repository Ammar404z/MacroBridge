package com.macrobridge.gemini;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import com.macrobridge.common.ApiException;

/** Per-user daily cap on AI calls, because everyone shares one Gemini key and its quota. */
@Component
public class AiQuota {

    private final JdbcClient jdbc;
    private final int dailyLimit;

    public AiQuota(JdbcClient jdbc, @Value("${ai.daily-limit}") int dailyLimit) {
        this.jdbc = jdbc;
        this.dailyLimit = dailyLimit;
    }

    /** Counts one call for today (UTC day); throws 429 once the user is past the limit. */
    public void use(UUID userId) {
        int calls = jdbc.sql("""
                insert into ai_usage (user_id, calls) values (:userId, 1)
                on conflict (user_id, day) do update set calls = ai_usage.calls + 1
                returning calls
                """)
                .param("userId", userId)
                .query(Integer.class)
                .single();
        if (calls > dailyLimit) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "You've used today's " + dailyLimit + " AI requests. Try again tomorrow, or enter macros manually.");
        }
    }
}
