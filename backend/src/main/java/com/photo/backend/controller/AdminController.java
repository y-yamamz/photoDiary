package com.photo.backend.controller;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.db.entity.Users;
import com.photo.backend.db.entity.UsersExample;
import com.photo.backend.db.mapper.UsersCustomMapper;
import com.photo.backend.db.mapper.UsersMapper;
import com.photo.backend.dto.request.AdminResetPasswordRequest;
import com.photo.backend.dto.request.RecalculateStorageRequest;
import com.photo.backend.dto.request.StorageLimitRequest;
import com.photo.backend.dto.response.RecalculateStorageResponse;
import com.photo.backend.dto.response.StorageResponse;
import com.photo.backend.dto.response.UserManageResponse;
import com.photo.backend.service.AuthService;
import com.photo.backend.service.PhotoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 管理者専用API（認証不要・管理者シークレットキーで保護）。
 * PUT    /api/admin/users/reset-password          ユーザーのパスワード強制リセット
 * PUT    /api/admin/users/{userId}/storage-limit  ユーザーの容量上限変更（userId指定・旧）
 * PUT    /api/admin/users/storage-limit           ユーザーの容量上限変更（username指定）
 * GET    /api/admin/users/storage                 全ユーザーの容量使用状況一覧
 * GET    /api/admin/users/{username}/storage      指定ユーザーの容量使用状況
 * POST   /api/admin/storage/recalculate           ユーザーの使用済み容量を再計算して更新
 * GET    /api/admin/users                         ユーザー管理一覧（有効フラグ・容量含む）
 * PUT    /api/admin/users/{username}/active        有効フラグ変更
 * DELETE /api/admin/users/{username}              ユーザーと写真を物理削除
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final UsersCustomMapper usersCustomMapper;
    private final UsersMapper usersMapper;
    private final PhotoService photoService;

    @Value("${admin.secret}")
    private String adminSecret;

    public AdminController(AuthService authService,
                           UsersCustomMapper usersCustomMapper,
                           UsersMapper usersMapper,
                           PhotoService photoService) {
        this.authService = authService;
        this.usersCustomMapper = usersCustomMapper;
        this.usersMapper = usersMapper;
        this.photoService = photoService;
    }

    @PutMapping("/users/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody AdminResetPasswordRequest request) {
        authService.adminResetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 指定ユーザーの容量上限を変更する。 */
    @PutMapping("/users/{userId}/storage-limit")
    public ResponseEntity<ApiResponse<Void>> updateStorageLimit(
            @PathVariable Long userId,
            @RequestBody StorageLimitRequest request) {
        if (!adminSecret.equals(request.getAdminSecret())) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        if (request.getLimitMb() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "容量上限は1MB以上で指定してください");
        }
        int updated = usersCustomMapper.updateStorageLimit(userId, request.getLimitMb());
        if (updated == 0) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** ユーザー名でユーザーを特定して容量上限を変更する。 */
    @PutMapping("/users/storage-limit")
    public ResponseEntity<ApiResponse<Void>> updateStorageLimitByUsername(
            @RequestBody StorageLimitRequest request) {
        if (!adminSecret.equals(request.getAdminSecret())) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ユーザー名を入力してください");
        }
        if (request.getLimitMb() <= 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "容量上限は1MB以上で指定してください");
        }
        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(request.getUsername().trim());
        List<Users> users = usersMapper.selectByExample(example);
        if (users.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }
        usersCustomMapper.updateStorageLimit(users.get(0).getUserId(), request.getLimitMb());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 全ユーザーのストレージ使用状況一覧を返す。 */
    @GetMapping("/users/storage")
    public ResponseEntity<ApiResponse<List<StorageResponse>>> getAllUsersStorage(
            @org.springframework.web.bind.annotation.RequestParam String adminSecret) {
        if (!this.adminSecret.equals(adminSecret)) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }

        List<StorageResponse> list = usersCustomMapper.selectAllWithStorage().stream()
                .map(user -> toStorageResponse(user))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /** 指定ユーザーのストレージ使用状況を返す。 */
    @GetMapping("/users/{username}/storage")
    public ResponseEntity<ApiResponse<StorageResponse>> getUserStorage(
            @PathVariable String username,
            @org.springframework.web.bind.annotation.RequestParam String adminSecret) {
        if (!this.adminSecret.equals(adminSecret)) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(username.trim());
        List<Users> users = usersMapper.selectByExample(example);
        if (users.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }
        return ResponseEntity.ok(ApiResponse.success(toStorageResponse(users.get(0))));
    }

    /** ユーザー管理一覧を返す（有効フラグ・容量・作成日含む）。 */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserManageResponse>>> listUsers(
            @RequestParam String adminSecret) {
        if (!this.adminSecret.equals(adminSecret)) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        List<UserManageResponse> list = usersCustomMapper.selectAllWithStorage().stream()
                .map(user -> {
                    int limitMb = user.getStorageLimitMb() != null ? user.getStorageLimitMb() : 500;
                    long limitBytes = (long) limitMb * 1024 * 1024;
                    long usedBytes = user.getStorageUsedBytes() != null ? user.getStorageUsedBytes() : 0;
                    double usagePercent = limitBytes > 0 ? (double) usedBytes / limitBytes * 100.0 : 0.0;
                    return UserManageResponse.builder()
                            .userId(user.getUserId())
                            .username(user.getUsername())
                            .activeFlag(user.getActiveFlag() != null ? user.getActiveFlag() : 1)
                            .usedBytes(usedBytes)
                            .limitMb(limitMb)
                            .limitBytes(limitBytes)
                            .usagePercent(Math.round(usagePercent * 10.0) / 10.0)
                            .createdAt(user.getCreatedAt() != null ? sdf.format(user.getCreatedAt()) : null)
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /** 指定ユーザーの有効フラグを変更する。 */
    @PutMapping("/users/{username}/active")
    public ResponseEntity<ApiResponse<Void>> updateActiveFlag(
            @PathVariable String username,
            @RequestParam String adminSecret,
            @RequestParam int activeFlag) {
        if (!this.adminSecret.equals(adminSecret)) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        if (activeFlag != 0 && activeFlag != 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "activeFlag は 0 または 1 で指定してください");
        }
        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(username.trim());
        List<Users> users = usersMapper.selectByExample(example);
        if (users.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }
        usersCustomMapper.updateActiveFlag(users.get(0).getUserId(), activeFlag);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 指定ユーザーと全写真を物理削除する。 */
    @DeleteMapping("/users/{username}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String username,
            @RequestParam String adminSecret) {
        if (!this.adminSecret.equals(adminSecret)) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(username.trim());
        List<Users> users = usersMapper.selectByExample(example);
        if (users.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }
        Long userId = users.get(0).getUserId();
        // 写真（物理ファイル + DB）を先に削除してからユーザーを削除する
        photoService.deleteAllPhotosByUser(userId);
        usersCustomMapper.deleteUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private StorageResponse toStorageResponse(Users user) {
        int limitMb = user.getStorageLimitMb() != null ? user.getStorageLimitMb() : 500;
        long limitBytes = (long) limitMb * 1024 * 1024;
        long usedBytes = user.getStorageUsedBytes() != null ? user.getStorageUsedBytes() : 0;
        double usagePercent = limitBytes > 0 ? (double) usedBytes / limitBytes * 100.0 : 0.0;
        return StorageResponse.builder()
                .username(user.getUsername())
                .usedBytes(usedBytes)
                .limitMb(limitMb)
                .limitBytes(limitBytes)
                .usagePercent(Math.round(usagePercent * 10.0) / 10.0)
                .build();
    }

    /**
     * 指定ユーザーの storage_used_bytes を物理ファイルから再集計して上書きする。
     * DB上のファイルパスをもとに実ファイルサイズを合算するため、
     * アップロード/削除の不整合を修正できる。
     */
    @PostMapping("/storage/recalculate")
    public ResponseEntity<ApiResponse<RecalculateStorageResponse>> recalculateStorage(
            @RequestBody RecalculateStorageRequest request) {
        if (!adminSecret.equals(request.getAdminSecret())) {
            throw new AppException(HttpStatus.FORBIDDEN, "管理者シークレットキーが正しくありません");
        }
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "ユーザー名を入力してください");
        }

        UsersExample example = new UsersExample();
        example.createCriteria().andUsernameEqualTo(request.getUsername().trim());
        java.util.List<Users> users = usersMapper.selectByExample(example);
        if (users.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "ユーザーが見つかりません");
        }

        Users user = users.get(0);
        RecalculateStorageResponse result =
                photoService.recalculateUserStorage(user.getUserId(), user.getUsername());

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
