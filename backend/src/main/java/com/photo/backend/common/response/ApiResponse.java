package com.photo.backend.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * API共通レスポンスラッパー。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private T data;
    private String message;

    private ApiResponse(T data, String message) {
        this.data = data;
        this.message = message;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(data, message);
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(null, message);
    }

    public T getData() { return data; }
    public String getMessage() { return message; }
}
