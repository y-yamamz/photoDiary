package com.photo.backend.common.exception;

import org.springframework.http.HttpStatus;

/**
 * アプリケーション共通例外。
 * HTTPステータスとメッセージを保持し、GlobalExceptionHandlerで処理される。
 */
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
