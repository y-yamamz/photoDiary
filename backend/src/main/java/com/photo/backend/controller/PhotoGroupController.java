package com.photo.backend.controller;

import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.dto.request.PhotoGroupRequest;
import com.photo.backend.dto.response.PhotoGroupResponse;
import com.photo.backend.service.PhotoGroupService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * グループ管理API。
 * GET    /api/photo-groups
 * POST   /api/photo-groups
 * PUT    /api/photo-groups/{id}
 * DELETE /api/photo-groups/{id}
 */
@RestController
@RequestMapping("/api/photo-groups")
public class PhotoGroupController {

    private final PhotoGroupService photoGroupService;

    public PhotoGroupController(PhotoGroupService photoGroupService) {
        this.photoGroupService = photoGroupService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhotoGroupResponse>>> getAll(HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        return ResponseEntity.ok(ApiResponse.success(photoGroupService.getAll(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PhotoGroupResponse>> create(
            HttpServletRequest req, @RequestBody PhotoGroupRequest request) {
        Long userId = (Long) req.getAttribute("userId");
        PhotoGroupResponse response = photoGroupService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PhotoGroupResponse>> update(
            HttpServletRequest req,
            @PathVariable Long id,
            @RequestBody PhotoGroupRequest request) {
        Long userId = (Long) req.getAttribute("userId");
        return ResponseEntity.ok(ApiResponse.success(photoGroupService.update(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(HttpServletRequest req, @PathVariable Long id) {
        Long userId = (Long) req.getAttribute("userId");
        photoGroupService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "グループを削除しました"));
    }
}
