package com.photo.backend.controller;

import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.db.entity.Users;
import com.photo.backend.db.mapper.UsersMapper;
import com.photo.backend.dto.request.ChangePasswordRequest;
import com.photo.backend.dto.request.RegisterRequest;
import com.photo.backend.dto.response.LoginResponse;
import com.photo.backend.dto.response.StorageResponse;
import com.photo.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ユーザー管理API。
 * POST /api/users/register       新規ユーザー登録（認証不要）
 * PUT  /api/users/password       パスワード変更（認証不要）
 * GET  /api/users/me/storage     自分のストレージ使用量取得（要認証）
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UsersMapper usersMapper;

    public UserController(AuthService authService, UsersMapper usersMapper) {
        this.authService = authService;
        this.usersMapper = usersMapper;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 自分のストレージ使用量・上限を取得する（要認証）。 */
    @GetMapping("/me/storage")
    public ResponseEntity<ApiResponse<StorageResponse>> getMyStorage(HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        Users user = usersMapper.selectByPrimaryKey(userId);

        int limitMb = user.getStorageLimitMb() != null ? user.getStorageLimitMb() : 500;
        long limitBytes = (long) limitMb * 1024 * 1024;
        long usedBytes = user.getStorageUsedBytes() != null ? user.getStorageUsedBytes() : 0;
        double usagePercent = limitBytes > 0 ? (double) usedBytes / limitBytes * 100.0 : 0.0;

        StorageResponse response = StorageResponse.builder()
                .usedBytes(usedBytes)
                .limitMb(limitMb)
                .limitBytes(limitBytes)
                .usagePercent(Math.round(usagePercent * 10.0) / 10.0)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
