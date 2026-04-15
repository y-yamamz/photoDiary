package com.photo.backend.controller;

import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.dto.request.AdminResetPasswordRequest;
import com.photo.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理者専用API（認証不要・管理者シークレットキーで保護）。
 * PUT /api/admin/users/reset-password  ユーザーのパスワード強制リセット
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @PutMapping("/users/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody AdminResetPasswordRequest request) {
        authService.adminResetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
