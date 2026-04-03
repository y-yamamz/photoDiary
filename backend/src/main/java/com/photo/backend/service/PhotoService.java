package com.photo.backend.service;

import com.photo.backend.common.exception.AppException;
import com.photo.backend.db.entity.Photos;
import com.photo.backend.db.mapper.PhotosCustomMapper;
import com.photo.backend.db.mapper.PhotosMapper;
import com.photo.backend.dto.request.PhotoBulkDeleteRequest;
import com.photo.backend.dto.request.PhotoBulkUpdateRequest;
import com.photo.backend.dto.request.PhotoUpdateRequest;
import com.photo.backend.dto.response.PhotoResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * 写真のCRUD・一括操作・ファイルストレージ管理サービス。
 */
@Service
public class PhotoService {

    private static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    private final PhotosMapper photosMapper;
    private final PhotosCustomMapper photosCustomMapper;
    private final String storagePath;

    public PhotoService(PhotosMapper photosMapper,
                        PhotosCustomMapper photosCustomMapper,
                        @Value("${storage.base-path}") String storagePath) {
        this.photosMapper = photosMapper;
        this.photosCustomMapper = photosCustomMapper;
        this.storagePath = storagePath;
    }

    // ── 一覧取得 ────────────────────────────────────────────────

    public List<PhotoResponse> getPhotos(Long userId, Integer year, Integer month,
                                         Integer day, Long groupId, String keyword) {
        return photosCustomMapper.selectPhotosWithTags(userId, year, month, day, groupId, keyword);
    }

    // ── 単体登録 ────────────────────────────────────────────────

    public PhotoResponse upload(Long userId, MultipartFile file,
                                Long groupId, String takenAt,
                                String location, String description) {
        String filePath = saveFile(file, userId);
        Photos photo = buildPhoto(userId, file.getOriginalFilename(), filePath,
                groupId, takenAt, location, description);
        photosMapper.insertSelective(photo);
        // タグなしで返却
        return toSimpleResponse(photosMapper.selectByPrimaryKey(photo.getPhotoId()));
    }

    // ── 一括登録 ────────────────────────────────────────────────

    public List<PhotoResponse> bulkUpload(Long userId, List<MultipartFile> files,
                                          Long groupId, String takenAt,
                                          String location, String description) {
        List<PhotoResponse> results = new ArrayList<>();
        for (MultipartFile file : files) {
            String filePath = saveFile(file, userId);
            Photos photo = buildPhoto(userId, file.getOriginalFilename(), filePath,
                    groupId, takenAt, location, description);
            photosMapper.insertSelective(photo);
            results.add(toSimpleResponse(photosMapper.selectByPrimaryKey(photo.getPhotoId())));
        }
        return results;
    }

    // ── 単体更新 ────────────────────────────────────────────────

    public PhotoResponse update(Long userId, Long photoId, PhotoUpdateRequest request) {
        Photos photo = getOwnedPhoto(userId, photoId);
        photo.setGroupId(request.getGroupId());
        photo.setLocation(request.getLocation());
        photo.setDescription(request.getDescription());
        if (request.getTakenAt() != null && !request.getTakenAt().isBlank()) {
            photo.setTakenAt(parseDatetime(request.getTakenAt()));
        }
        photosMapper.updateByPrimaryKeyWithBLOBs(photo);
        return toSimpleResponse(photosMapper.selectByPrimaryKey(photoId));
    }

    // ── 単体削除 ────────────────────────────────────────────────

    public void delete(Long userId, Long photoId) {
        getOwnedPhoto(userId, photoId); // 所有確認
        photosMapper.deleteByPrimaryKey(photoId);
    }

    // ── 一括削除 ────────────────────────────────────────────────

    public int bulkDelete(Long userId, PhotoBulkDeleteRequest request) {
        if (request.getPhotoIds() == null || request.getPhotoIds().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "削除対象のIDが指定されていません");
        }
        return photosCustomMapper.bulkDeleteByIds(userId, request.getPhotoIds());
    }

    // ── 一括更新 ────────────────────────────────────────────────

    public int bulkUpdate(Long userId, PhotoBulkUpdateRequest request) {
        if (request.getPhotoIds() == null || request.getPhotoIds().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "更新対象のIDが指定されていません");
        }
        if (request.getLocation() == null && request.getDescription() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "更新するフィールドを指定してください");
        }
        return photosCustomMapper.bulkUpdateByIds(
                userId, request.getPhotoIds(),
                request.getLocation(), request.getDescription());
    }

    // ── private ─────────────────────────────────────────────────

    /**
     * ファイルをストレージに保存し、DBに登録するパス（/images/...）を返す。
     */
    private String saveFile(MultipartFile file, Long userId) {
        try {
            LocalDateTime now = LocalDateTime.now();
            String year  = String.format("%04d", now.getYear());
            String month = String.format("%02d", now.getMonthValue());
            String ext   = getExtension(file.getOriginalFilename());
            String uuid  = UUID.randomUUID().toString();

            // 保存先ディレクトリ: {storagePath}/{userId}/{yyyy}/{MM}/
            Path dir = Paths.get(storagePath, userId.toString(), year, month);
            Files.createDirectories(dir);

            Path dest = dir.resolve(uuid + ext);
            file.transferTo(dest);

            // クライアントからアクセスするURLパス
            return "/images/" + userId + "/" + year + "/" + month + "/" + uuid + ext;
        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "ファイルの保存に失敗しました");
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return ".jpg";
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    private Photos buildPhoto(Long userId, String originalName, String filePath,
                              Long groupId, String takenAt, String location, String description) {
        Photos photo = new Photos();
        photo.setUserId(userId);
        photo.setFilePath(filePath);
        photo.setFileName(originalName);
        photo.setGroupId(groupId);
        photo.setLocation(location);
        photo.setDescription(description);
        photo.setCreatedAt(new Date());
        if (takenAt != null && !takenAt.isBlank()) {
            photo.setTakenAt(parseDatetime(takenAt));
        }
        return photo;
    }

    private Date parseDatetime(String takenAt) {
        try {
            // datetime-local形式: yyyy-MM-dd'T'HH:mm
            return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").parse(takenAt);
        } catch (ParseException e) {
            return null;
        }
    }

    private Photos getOwnedPhoto(Long userId, Long photoId) {
        Photos photo = photosMapper.selectByPrimaryKey(photoId);
        if (photo == null || !photo.getUserId().equals(userId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "写真が見つかりません");
        }
        return photo;
    }

    private PhotoResponse toSimpleResponse(Photos p) {
        return PhotoResponse.builder()
                .photoId(p.getPhotoId())
                .userId(p.getUserId())
                .groupId(p.getGroupId())
                .filePath(p.getFilePath())
                .fileName(p.getFileName())
                .takenAt(p.getTakenAt() != null ? SDF.format(p.getTakenAt()) : null)
                .location(p.getLocation())
                .description(p.getDescription())
                .sortOrder(p.getSortOrder())
                .createdAt(p.getCreatedAt() != null ? SDF.format(p.getCreatedAt()) : null)
                .tags(List.of())
                .build();
    }
}
