package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * 管理者向けユーザー一覧レスポンス。
 * ユーザー基本情報・有効フラグ・ストレージ使用状況を含む。
 */
@Getter
@Builder
public class UserManageResponse {
    private Long userId;
    private String username;
    /** 有効フラグ（1=有効, 0=無効） */
    private Integer activeFlag;
    private long usedBytes;
    private int limitMb;
    private long limitBytes;
    private double usagePercent;
    private String createdAt;
}
