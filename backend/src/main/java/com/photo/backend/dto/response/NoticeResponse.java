package com.photo.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * ユーザー向けお知らせレスポンスDTO。
 *
 * GET /api/board/notices で返却する。
 * notice_reads テーブルを参照して未読フラグ（unread）を付与する。
 */
@Getter
@Builder
public class NoticeResponse {

    /** お知らせID */
    private Long noticeId;

    /** タイトル */
    private String title;

    /** 本文 */
    private String body;

    /** 作成日時（yyyy-MM-dd HH:mm 形式） */
    private String createdAt;

    /**
     * 未読フラグ。
     * notice_reads に対象ユーザーの既読レコードが存在しない場合 true。
     * フロント側でのバッジ表示・NEW ラベル表示に使用する。
     */
    private boolean unread;

    /**
     * 個人宛通知フラグ。
     * 管理者が問い合わせに個別返信した際に生成される通知の場合 true。
     * フロント側で「返信あり」バッジの表示に使用する。
     */
    private boolean personal;
}
