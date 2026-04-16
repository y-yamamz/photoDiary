package com.photo.backend.dto.request;

/**
 * 管理者がお知らせを投稿・編集する際のリクエストDTO。
 *
 * POST /api/admin/board/notices（新規投稿）
 * PUT  /api/admin/board/notices/{noticeId}（編集）
 * で受け取る。管理者シークレットキーによる認証を行う。
 */
public class AdminNoticeRequest {

    /** 管理者シークレットキー（認証用） */
    private String adminSecret;

    /** お知らせのタイトル */
    private String title;

    /** お知らせの本文 */
    private String body;

    public String getAdminSecret() { return adminSecret; }
    public void setAdminSecret(String adminSecret) { this.adminSecret = adminSecret; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
