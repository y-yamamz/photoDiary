package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * 問い合わせ返信レスポンスDTO。
 *
 * InquiryResponse / AdminInquiryResponse の replies リストに含まれる。
 * 管理者が送信した返信1件を表す。
 */
@Getter
@Builder
public class InquiryReplyResponse {

    /** 返信ID */
    private Long replyId;

    /** 返信本文 */
    private String body;

    /**
     * 配信先種別。
     *   0 = 個別返信（問い合わせユーザーのみに表示）
     *   1 = 全体お知らせとして投稿（notices テーブルにも登録済み）
     */
    private int targetType;

    /** 返信日時（yyyy-MM-dd HH:mm 形式） */
    private String createdAt;
}
