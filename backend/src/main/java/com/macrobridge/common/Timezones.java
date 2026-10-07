package com.macrobridge.common;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.springframework.http.HttpStatus;

public final class Timezones {

    private Timezones() {}

    /** Null/blank stays null (keep the current value); anything else must be a valid IANA zone. */
    public static String validOrNull(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return null;
        }
        try {
            return ZoneId.of(timezone).getId();
        } catch (DateTimeException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "timezone is not a valid IANA time zone");
        }
    }
}
