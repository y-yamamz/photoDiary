package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * ユーザー向け問い合わせレスポンスDTO。
 *
 * GET /api/board/inquiries で返却する。
 * 自分の問い合わせ一覧（管理者の返信含む）をスレッド形式で表現する。
 */
@Getter
@Builder
public class InquiryResponse {

    /** 問い合わせID */
    private Long inquiryId;

    /** 件名 */
    private String subject;

    /** 本文 */
    private String body;

    /**
     * ステータス。
     *   0 = 未対応（管理者が未返信）
     *   1 = 対応済み（管理者が返信済み）
     */
    private int status;

    /** 送信日時（yyyy-MM-dd HH:mm 形式） */
    private String createdAt;

    /**
     * 管理者からの返信リスト。
     * 1件の問い合わせに対し返信は最大1件だが、
     * 将来の拡張性を考慮してリスト型で保持する。
     */
    private List<InquiryReplyResponse> replies;
}
