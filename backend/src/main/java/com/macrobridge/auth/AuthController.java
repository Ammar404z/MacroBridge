package com.macrobridge.auth;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.macrobridge.auth.AuthDtos.AuthResponse;
import com.macrobridge.auth.AuthDtos.LoginRequest;
import com.macrobridge.auth.AuthDtos.RegisterRequest;
import com.macrobridge.auth.AuthDtos.UserDto;
import com.macrobridge.common.ApiResponse;

import jakarta.validation.Valid;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/api/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ApiResponse.ok(authService.register(req));
    }

    @PostMapping("/api/auth/login")
    ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req));
    }

    /** Requires a valid token; the frontend uses it to check a stored token on startup. */
    @GetMapping("/api/me")
    ApiResponse<UserDto> me(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(authService.me(UUID.fromString(jwt.getSubject())));
    }
}
