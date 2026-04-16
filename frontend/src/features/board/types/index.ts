// ============================================================
// 掲示板機能の型定義
// ============================================================

/**
 * お知らせ1件の型。
 * GET /api/board/notices で取得する。
 * unread=true の場合はフロントで「NEW」バッジを表示する。
 */
export interface Notice {
  noticeId: number;
  title: string;
  body: string;
  createdAt: string;
  /** 未読フラグ（notice_reads に存在しない場合 true） */
  unread: boolean;
}

/**
 * 問い合わせへの返信1件の型。
 * InquiryResponse / AdminInquiryResponse の replies に含まれる。
 */
export interface InquiryReply {
  replyId: number;
  body: string;
  /**
   * 配信先種別。
   *   0 = 個別返信（問い合わせユーザーのみに表示）
   *   1 = 全体お知らせとして投稿
   */
  targetType: 0 | 1;
  createdAt: string;
}

/**
 * ユーザー向け問い合わせ1件の型。
 * GET /api/board/inquiries で取得する。
 */
export interface Inquiry {
  inquiryId: number;
  subject: string;
  body: string;
  /**
   * ステータス。
   *   0 = 未対応
   *   1 = 対応済み
   */
  status: 0 | 1;
  createdAt: string;
  replies: InquiryReply[];
}

/**
 * 管理者向け問い合わせ1件の型。
 * GET /api/admin/board/inquiries で取得する。
 * ユーザー名が付与されている。
 */
export interface AdminInquiry {
  inquiryId: number;
  userId: number;
  username: string;
  subject: string;
  body: string;
  status: 0 | 1;
  createdAt: string;
  replies: InquiryReply[];
}

// ─── リクエスト型 ─────────────────────────────────────────

/** ユーザーの問い合わせ送信リクエスト */
export interface BoardInquiryRequest {
  subject: string;
  body: string;
}

/** 管理者のお知らせ投稿・編集リクエスト */
export interface AdminNoticeRequest {
  adminSecret: string;
  title: string;
  body: string;
}

/**
 * 管理者の問い合わせ返信リクエスト。
 * targetType=1（全体投稿）の場合は noticeTitle も必須。
 */
export interface AdminReplyRequest {
  adminSecret: string;
  body: string;
  /** 0=個別返信, 1=全体お知らせとして投稿 */
  targetType: 0 | 1;
  noticeTitle?: string;
}
