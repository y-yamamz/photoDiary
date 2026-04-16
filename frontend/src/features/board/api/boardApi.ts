import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse } from '../../../shared/types';
import type {
  Notice,
  Inquiry,
  BoardInquiryRequest,
} from '../types';

/**
 * ユーザー向け掲示板API クライアント。
 *
 * すべてのリクエストは JWT 認証が必要（apiClient インターセプターが自動付与）。
 * エンドポイント：
 *   GET  /api/board/notices          お知らせ一覧取得（取得と同時に既読化）
 *   GET  /api/board/notices/unread   未読件数取得（ヘッダーバッジ用）
 *   GET  /api/board/inquiries        自分の問い合わせ一覧
 *   POST /api/board/inquiries        問い合わせ新規送信
 */
export const boardApi = {
  /**
   * お知らせ一覧を取得する。
   *
   * 取得と同時にサーバー側で全件を既読化する。
   * 返却データには unread フラグが含まれており、
   * 取得時点での未読/既読状態を表示に使用できる。
   */
  getNotices: (): Promise<Notice[]> =>
    apiClient
      .get<ApiResponse<Notice[]>>('/api/board/notices')
      .then((r) => r.data.data),

  /**
   * ヘッダーバッジ用の未読お知らせ件数を取得する。
   *
   * AlbumPage 初期表示時に呼び出す。
   * お知らせ一覧の取得（getNotices）とは独立しており、
   * このAPIでは既読化処理を行わない。
   */
  getUnreadCount: (): Promise<number> =>
    apiClient
      .get<ApiResponse<{ count: number }>>('/api/board/notices/unread')
      .then((r) => r.data.data.count),

  /**
   * 自分の問い合わせ一覧を管理者からの返信込みで取得する。
   *
   * 「管理者へ連絡」タブを開いた際に呼び出す。
   * 各問い合わせには replies（返信リスト）が含まれる。
   */
  getMyInquiries: (): Promise<Inquiry[]> =>
    apiClient
      .get<ApiResponse<Inquiry[]>>('/api/board/inquiries')
      .then((r) => r.data.data),

  /**
   * 問い合わせを新規送信する。
   *
   * 送信後はステータスが「未対応（0）」で登録される。
   */
  submitInquiry: (body: BoardInquiryRequest): Promise<void> =>
    apiClient
      .post<ApiResponse<null>>('/api/board/inquiries', body)
      .then(() => undefined),

  /**
   * 自分の問い合わせを削除する。
   *
   * 紐づく返信（inquiry_replies）も CASCADE DELETE で自動削除される。
   * 他ユーザーの問い合わせを削除しようとすると 403 エラーになる。
   */
  deleteInquiry: (inquiryId: number): Promise<void> =>
    apiClient
      .delete<ApiResponse<null>>(`/api/board/inquiries/${inquiryId}`)
      .then(() => undefined),
};
