package com.macrobridge.auth;

import java.util.Locale;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.macrobridge.auth.AuthDtos.AuthResponse;
import com.macrobridge.auth.AuthDtos.ChangePasswordRequest;
import com.macrobridge.auth.AuthDtos.LoginRequest;
import com.macrobridge.auth.AuthDtos.RegisterRequest;
import com.macrobridge.auth.AuthDtos.UserDto;
import com.macrobridge.common.ApiException;
import com.macrobridge.common.Timezones;
import com.macrobridge.profile.ProfileRepository;

@Service
public class AuthService {

    private final UserRepository users;
    private final ProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    // Compared against when the email doesn't exist, so a wrong email takes as long as a wrong password
    private final String dummyHash;

    public AuthService(UserRepository users, ProfileRepository profiles,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyHash = passwordEncoder.encode("dummy-password");
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        String timezone = Timezones.validOrNull(req.timezone());
        UUID id;
        try {
            id = users.insert(email, passwordEncoder.encode(req.password()));
        } catch (DuplicateKeyException e) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        String name = req.displayName() == null || req.displayName().isBlank() ? null : req.displayName().trim();
        profiles.insert(id, name, timezone, req.targetCalories(),
                req.targetProtein(), req.targetCarbs(), req.targetFat());
        return new AuthResponse(jwtService.issue(id, email), new UserDto(id, email));
    }

    public AuthResponse login(LoginRequest req) {
        var user = users.findByEmail(normalize(req.email()));
        String hash = user.map(UserRepository.UserRow::passwordHash).orElse(dummyHash);
        if (!passwordEncoder.matches(req.password(), hash) || user.isEmpty()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        var u = user.get();
        return new AuthResponse(jwtService.issue(u.id(), u.email()), new UserDto(u.id(), u.email()));
    }

    public void changePassword(UUID userId, ChangePasswordRequest req) {
        var user = users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        if (!passwordEncoder.matches(req.currentPassword(), user.passwordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is wrong");
        }
        users.updatePassword(userId, passwordEncoder.encode(req.newPassword()));
    }

    public UserDto me(UUID userId) {
        return users.findById(userId)
                .map(u -> new UserDto(u.id(), u.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
