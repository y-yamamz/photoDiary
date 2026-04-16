package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * ユーザーのストレージ使用量・上限情報レスポンス。
 */
@Getter
@Builder
public class StorageResponse {
    /** ユーザー名（管理者APIレスポンス用。自分のストレージ取得時は null） */
    private String username;
    /** 使用済み容量（bytes） */
    private long usedBytes;
    /** 容量上限（MB） */
    private int limitMb;
    /** 容量上限（bytes） */
    private long limitBytes;
    /** 使用率（%）。上限が 0 の場合は 0.0 */
    private double usagePercent;
}
