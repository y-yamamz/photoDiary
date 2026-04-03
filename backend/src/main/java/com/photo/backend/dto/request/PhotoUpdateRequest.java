package com.photo.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

/**
 * 写真単体更新リクエスト（PUT /api/photos/{id}）。
 */
@Getter
@Setter
public class PhotoUpdateRequest {
    private Long groupId;
    private String takenAt;       // ISO 8601形式 (yyyy-MM-dd'T'HH:mm)
    private String location;
    private String description;
}
