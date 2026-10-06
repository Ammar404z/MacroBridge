package com.macrobridge.common;

/** Every endpoint responds with { data, error }: exactly one of them is non-null. */
public record ApiResponse<T>(T data, String error) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(null, message);
    }
}
