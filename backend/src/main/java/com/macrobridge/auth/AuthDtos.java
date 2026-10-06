package com.macrobridge.auth;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 254) String email,
            // BCrypt only looks at the first 72 bytes
            @NotBlank @Size(min = 8, max = 72) String password,
            @Size(max = 64) String timezone,
            @Min(0) @Max(20000) Integer targetCalories,
            @DecimalMin("0") @Digits(integer = 5, fraction = 1) BigDecimal targetProtein,
            @DecimalMin("0") @Digits(integer = 5, fraction = 1) BigDecimal targetCarbs,
            @DecimalMin("0") @Digits(integer = 5, fraction = 1) BigDecimal targetFat) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record UserDto(UUID id, String email) {}

    public record AuthResponse(String token, UserDto user) {}
}
