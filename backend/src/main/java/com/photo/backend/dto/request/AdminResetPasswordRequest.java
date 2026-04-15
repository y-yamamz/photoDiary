package com.photo.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminResetPasswordRequest {
    private String adminSecret;
    private String username;
    private String newPassword;
}
