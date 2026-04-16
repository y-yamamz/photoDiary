package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 管理者向け問い合わせレスポンスDTO。
 *
 * GET /api/admin/board/inquiries で返却する。
 * InquiryResponse に加えて送信ユーザー名を付与した管理者専用DTO。
 */
@Getter
@Builder
public class AdminInquiryResponse {

    /** 問い合わせID */
    private Long inquiryId;

    /** 送信ユーザーID */
    private Long userId;

    /** 送信ユーザー名（users テーブルから JOIN して取得） */
    private String username;

    /** 件名 */
    private String subject;

    /** 本文 */
    private String body;

    /**
     * ステータス。
     *   0 = 未対応
     *   1 = 対応済み
     */
    private int status;

    /** 送信日時（yyyy-MM-dd HH:mm 形式） */
    private String createdAt;

    /** 管理者からの返信リスト */
    private List<InquiryReplyResponse> replies;
}
