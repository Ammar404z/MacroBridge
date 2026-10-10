package com.macrobridge.common;

import java.util.Base64;

import org.springframework.http.HttpStatus;

/** Uploaded pictures (avatars, meal photos) arrive as base64 JPEGs the frontend has already resized. */
public final class Jpeg {

    private Jpeg() {}

    /** The decoded bytes, or a 400 if it isn't base64 or isn't a JPEG. */
    public static byte[] decode(String base64) {
        byte[] image;
        try {
            image = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The picture is not valid base64");
        }
        // JPEG files start with FF D8 FF
        if (image.length < 3 || (image[0] & 0xFF) != 0xFF || (image[1] & 0xFF) != 0xD8 || (image[2] & 0xFF) != 0xFF) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The picture must be a JPEG");
        }
        return image;
    }
}
