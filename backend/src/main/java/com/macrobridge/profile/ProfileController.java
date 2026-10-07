package com.macrobridge.profile;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.macrobridge.common.ApiException;
import com.macrobridge.common.ApiResponse;
import com.macrobridge.common.Timezones;
import com.macrobridge.profile.ProfileRepository.ProfileRow;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
public class ProfileController {

    /** Every field is optional; only the ones sent are changed. */
    public record UpdateProfileRequest(
            @Size(max = 100) String displayName,
            @Size(max = 64) String timezone,
            @Min(0) @Max(20000) Integer targetCalories,
            @DecimalMin("0") @Digits(integer = 5, fraction = 1) BigDecimal targetProtein,
            @DecimalMin("0") @Digits(integer = 5, fraction = 1) BigDecimal targetCarbs,
            @DecimalMin("0") @Digits(integer = 5, fraction = 1) BigDecimal targetFat,
            Boolean shareMeals) {}

    /** A square JPEG, already resized by the frontend (256 px is plenty). */
    public record AvatarRequest(@NotBlank @Size(max = 400_000) String imageBase64) {}

    private final ProfileRepository profiles;
    private final AvatarRepository avatars;

    public ProfileController(ProfileRepository profiles, AvatarRepository avatars) {
        this.profiles = profiles;
        this.avatars = avatars;
    }

    @GetMapping("/api/profile")
    ApiResponse<ProfileRow> get(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(find(UUID.fromString(jwt.getSubject())));
    }

    @PutMapping("/api/profile")
    ApiResponse<ProfileRow> update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateProfileRequest req) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String name = req.displayName() == null ? null : req.displayName().trim();
        profiles.update(userId, name, Timezones.validOrNull(req.timezone()), req.targetCalories(),
                req.targetProtein(), req.targetCarbs(), req.targetFat(), req.shareMeals());
        return ApiResponse.ok(find(userId));
    }

    @PutMapping("/api/profile/avatar")
    ApiResponse<ProfileRow> uploadAvatar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AvatarRequest req) {
        byte[] image;
        try {
            image = Base64.getDecoder().decode(req.imageBase64());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "imageBase64 is not valid base64");
        }
        // JPEG files start with FF D8 FF
        if (image.length < 3 || (image[0] & 0xFF) != 0xFF || (image[1] & 0xFF) != 0xD8 || (image[2] & 0xFF) != 0xFF) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The picture must be a JPEG");
        }
        UUID userId = UUID.fromString(jwt.getSubject());
        avatars.save(userId, image);
        return ApiResponse.ok(find(userId));
    }

    @DeleteMapping("/api/profile/avatar")
    ApiResponse<ProfileRow> deleteAvatar(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        avatars.delete(userId);
        return ApiResponse.ok(find(userId));
    }

    private ProfileRow find(UUID userId) {
        return profiles.find(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
    }
}
