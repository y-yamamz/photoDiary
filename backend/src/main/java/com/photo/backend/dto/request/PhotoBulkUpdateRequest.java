package com.photo.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 写真一括更新リクエスト（PUT /api/photos/bulk）。
 * チェックONの項目のみ更新するため、各フィールドは null で「更新しない」を表す。
 */
@Getter
@Setter
public class PhotoBulkUpdateRequest {
    private List<Long> photoIds;
    private String location;      // null = 更新しない
    private String description;   // null = 更新しない
}
