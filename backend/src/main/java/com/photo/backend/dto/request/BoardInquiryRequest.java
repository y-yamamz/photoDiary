package com.photo.backend.dto.request;

/**
 * ユーザーが管理者へ問い合わせを送信する際のリクエストDTO。
 *
 * POST /api/board/inquiries で受け取る。
 * JWT認証済みユーザーのIDはリクエスト属性から取得するため、
 * このDTOにはユーザーIDを含まない。
 */
public class BoardInquiryRequest {

    /** 問い合わせの件名 */
    private String subject;

    /** 問い合わせの本文 */
    private String body;

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
