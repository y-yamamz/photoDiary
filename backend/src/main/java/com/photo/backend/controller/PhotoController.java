package com.photo.backend.controller;

import com.photo.backend.common.response.ApiResponse;
import com.photo.backend.dto.request.PhotoBulkDeleteRequest;
import com.photo.backend.dto.request.PhotoBulkUpdateRequest;
import com.photo.backend.dto.request.PhotoUpdateRequest;
import com.photo.backend.dto.response.PhotoResponse;
import com.photo.backend.service.PhotoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 写真API。
 *
 * GET    /api/photos               写真一覧（フィルター対応）
 * POST   /api/photos               写真単体登録（multipart）
 * PUT    /api/photos/{id}          写真単体更新
 * DELETE /api/photos/{id}          写真単体削除
 * DELETE /api/photos               写真一括削除
 * POST   /api/photos/bulk          写真一括登録（multipart）
 * PUT    /api/photos/bulk          写真一括更新（場所・説明）
 */
@RestController
@RequestMapping("/api/photos")
public class PhotoController {

    private final PhotoService photoService;

    public PhotoController(PhotoService photoService) {
        this.photoService = photoService;
    }

    // ── 一覧取得 ─────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhotoResponse>>> getPhotos(
            HttpServletRequest req,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer day,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String keyword) {
        Long userId = (Long) req.getAttribute("userId");
        List<PhotoResponse> photos = photoService.getPhotos(userId, year, month, day, groupId, keyword);
        return ResponseEntity.ok(ApiResponse.success(photos));
    }

    // ── 単体登録 ─────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<PhotoResponse>> upload(
            HttpServletRequest req,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String takenAt,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String description) {
        Long userId = (Long) req.getAttribute("userId");
        PhotoResponse response = photoService.upload(userId, file, groupId, takenAt, location, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // ── 一括登録 ─────────────────────────────────────────────

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<PhotoResponse>>> bulkUpload(
            HttpServletRequest req,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String takenAt,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String description) {
        Long userId = (Long) req.getAttribute("userId");
        List<PhotoResponse> responses = photoService.bulkUpload(userId, files, groupId, takenAt, location, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(responses));
    }

    // ── 単体更新 ─────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PhotoResponse>> update(
            HttpServletRequest req,
            @PathVariable Long id,
            @RequestBody PhotoUpdateRequest request) {
        Long userId = (Long) req.getAttribute("userId");
        return ResponseEntity.ok(ApiResponse.success(photoService.update(userId, id, request)));
    }

    // ── 一括更新（場所・説明） ───────────────────────────────

    @PutMapping("/bulk")
    public ResponseEntity<ApiResponse<String>> bulkUpdate(
            HttpServletRequest req,
            @RequestBody PhotoBulkUpdateRequest request) {
        Long userId = (Long) req.getAttribute("userId");
        int count = photoService.bulkUpdate(userId, request);
        return ResponseEntity.ok(ApiResponse.success(count + " 枚の写真を更新しました"));
    }

    // ── 単体削除 ─────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(HttpServletRequest req, @PathVariable Long id) {
        Long userId = (Long) req.getAttribute("userId");
        photoService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "写真を削除しました"));
    }

    // ── 一括削除 ─────────────────────────────────────────────

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> bulkDelete(
            HttpServletRequest req,
            @RequestBody PhotoBulkDeleteRequest request) {
        Long userId = (Long) req.getAttribute("userId");
        int count = photoService.bulkDelete(userId, request);
        return ResponseEntity.ok(ApiResponse.success(count + " 枚の写真を削除しました"));
    }
}
