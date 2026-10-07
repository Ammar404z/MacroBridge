package com.macrobridge.friend;

import java.time.Duration;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.macrobridge.common.ApiException;
import com.macrobridge.common.ApiResponse;
import com.macrobridge.friend.FriendService.FriendDay;
import com.macrobridge.friend.FriendService.FriendsResponse;
import com.macrobridge.friend.FriendService.InvitePreview;
import com.macrobridge.profile.AvatarRepository;

@RestController
public class FriendController {

    public record RelationResponse(String relation) {}

    public record RequestCount(int incoming) {}

    private final FriendService friendService;
    private final FriendRepository friends;
    private final AvatarRepository avatars;

    public FriendController(FriendService friendService, FriendRepository friends, AvatarRepository avatars) {
        this.friendService = friendService;
        this.friends = friends;
        this.avatars = avatars;
    }

    /** Invite code, friends with today's totals, pending requests, and the friends' meal feed. */
    @GetMapping("/api/friends")
    ApiResponse<FriendsResponse> overview(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(friendService.overview(userId(jwt)));
    }

    /** Cheap count for the tab bar badge. (Spring matches this literal path before /{id}.) */
    @GetMapping("/api/friends/requests")
    ApiResponse<RequestCount> requestCount(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(new RequestCount(friends.countIncoming(userId(jwt))));
    }

    @GetMapping("/api/friends/{id}")
    ApiResponse<FriendDay> friend(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ApiResponse.ok(friendService.friendDay(userId(jwt), id));
    }

    @PostMapping("/api/friends/{id}/accept")
    ApiResponse<Void> accept(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        friendService.accept(userId(jwt), id);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/api/friends/{id}")
    ApiResponse<Void> remove(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        friendService.remove(userId(jwt), id);
        return ApiResponse.ok(null);
    }

    /** Who an invite link belongs to, and how you're already related. */
    @GetMapping("/api/invites/{code}")
    ApiResponse<InvitePreview> invite(@AuthenticationPrincipal Jwt jwt, @PathVariable String code) {
        return ApiResponse.ok(friendService.preview(userId(jwt), code));
    }

    @PostMapping("/api/invites/{code}")
    ApiResponse<RelationResponse> sendRequest(@AuthenticationPrincipal Jwt jwt, @PathVariable String code) {
        return ApiResponse.ok(new RelationResponse(friendService.sendRequest(userId(jwt), code)));
    }

    /** The raw JPEG. URLs carry ?v=<avatarVersion>, so it can be cached for a long time. */
    @GetMapping("/api/avatars/{id}")
    ResponseEntity<byte[]> avatar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        if (!friendService.canSeeAvatar(userId(jwt), id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No picture");
        }
        byte[] image = avatars.find(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No picture"));
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePrivate())
                .body(image);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
