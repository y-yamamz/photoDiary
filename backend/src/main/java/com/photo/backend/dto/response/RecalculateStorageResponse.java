package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * ストレージ使用量再計算結果レスポンス。
 */
@Getter
@Builder
public class RecalculateStorageResponse {
    /** 対象ユーザー名 */
    private String username;
    /** DBから取得した写真レコード件数 */
    private int photoCount;
    /** 再計算前の使用量（bytes） */
    private long oldUsedBytes;
    /** 再計算後の使用量（bytes） */
    private long newUsedBytes;
    /** 差分（bytes）。正=増加、負=減少 */
    private long diffBytes;
}
