package com.photo.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    private String username;
    private String currentPassword;
    private String newPassword;
}
