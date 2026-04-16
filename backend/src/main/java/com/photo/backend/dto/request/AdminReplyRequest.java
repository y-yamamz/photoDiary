package com.photo.backend.dto.request;

/**
 * 管理者が問い合わせに返信する際のリクエストDTO。
 *
 * POST /api/admin/board/inquiries/{inquiryId}/reply で受け取る。
 *
 * 返信後は対象問い合わせのステータスを「対応済み（1）」に自動更新する。
 */
public class AdminReplyRequest {

    /** 管理者シークレットキー（認証用） */
    private String adminSecret;

    /** 返信本文 */
    private String body;

    /**
     * 配信先種別。
     *   0 = 問い合わせユーザーのみへの個別返信
     *   1 = 全ユーザーへお知らせとして投稿（notices テーブルにも INSERT する）
     */
    private int targetType;

    /**
     * targetType=1（全体お知らせ）の場合に設定するお知らせタイトル。
     * targetType=0 の場合は使用しない。
     */
    private String noticeTitle;

    public String getAdminSecret() { return adminSecret; }
    public void setAdminSecret(String adminSecret) { this.adminSecret = adminSecret; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public int getTargetType() { return targetType; }
    public void setTargetType(int targetType) { this.targetType = targetType; }

    public String getNoticeTitle() { return noticeTitle; }
    public void setNoticeTitle(String noticeTitle) { this.noticeTitle = noticeTitle; }
}
