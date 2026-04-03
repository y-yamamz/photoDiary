package com.photo.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 写真一括削除リクエスト（DELETE /api/photos）。
 */
@Getter
@Setter
public class PhotoBulkDeleteRequest {
    private List<Long> photoIds;
}
