package com.macrobridge.common;

import org.springframework.http.HttpStatus;

/** Thrown from services to return a specific status and message to the client. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
