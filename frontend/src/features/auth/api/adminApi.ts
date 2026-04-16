import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse } from '../../../shared/types';
import type { Notice, AdminInquiry, AdminNoticeRequest, AdminReplyRequest } from '../../board/types';

export interface RecalculateStorageRequest {
  adminSecret: string;
  username: string;
}

export interface RecalculateStorageResult {
  username: string;
  photoCount: number;
  oldUsedBytes: number;
  newUsedBytes: number;
  diffBytes: number;
}

export interface UpdateStorageLimitRequest {
  adminSecret: string;
  username: string;
  limitMb: number;
}

export interface UserStorageInfo {
  username: string;
  usedBytes: number;
  limitMb: number;
  limitBytes: number;
  usagePercent: number;
}

export interface UserManageInfo {
  userId: number;
  username: string;
  activeFlag: number;
  usedBytes: number;
  limitMb: number;
  limitBytes: number;
  usagePercent: number;
  createdAt: string | null;
}

export const adminApi = {
  /** ユーザーの使用済みストレージを物理ファイルから再計算して更新する */
  recalculateStorage: (body: RecalculateStorageRequest) =>
    apiClient
      .post<ApiResponse<RecalculateStorageResult>>('/api/admin/storage/recalculate', body)
      .then((r) => r.data.data),

  /** ユーザーの容量上限を変更する */
  updateStorageLimit: (body: UpdateStorageLimitRequest) =>
    apiClient
      .put<ApiResponse<null>>('/api/admin/users/storage-limit', body)
      .then((r) => r.data),

  /** 指定ユーザーのストレージ使用状況を取得する */
  getUserStorage: (adminSecret: string, username: string) =>
    apiClient
      .get<ApiResponse<UserStorageInfo>>(`/api/admin/users/${encodeURIComponent(username)}/storage`, {
        params: { adminSecret },
      })
      .then((r) => r.data.data),

  /** ユーザー管理一覧を取得する */
  listUsers: (adminSecret: string) =>
    apiClient
      .get<ApiResponse<UserManageInfo[]>>('/api/admin/users', { params: { adminSecret } })
      .then((r) => r.data.data),

  /** 有効フラグを変更する */
  updateActiveFlag: (adminSecret: string, username: string, activeFlag: 0 | 1) =>
    apiClient
      .put<ApiResponse<null>>(
        `/api/admin/users/${encodeURIComponent(username)}/active`,
        null,
        { params: { adminSecret, activeFlag } },
      )
      .then((r) => r.data),

  /** ユーザーと全写真を物理削除する */
  deleteUser: (adminSecret: string, username: string) =>
    apiClient
      .delete<ApiResponse<null>>(
        `/api/admin/users/${encodeURIComponent(username)}`,
        { params: { adminSecret } },
      )
      .then((r) => r.data),

  // ─── 掲示板管理 ──────────────────────────────────────────

  /**
   * お知らせ一覧を全件取得する（管理者向け）。
   * 管理者画面「お知らせ投稿」タブの投稿済み一覧表示に使用する。
   */
  getAdminNotices: (adminSecret: string): Promise<Notice[]> =>
    apiClient
      .get<ApiResponse<Notice[]>>('/api/admin/board/notices', { params: { adminSecret } })
      .then((r) => r.data.data),

  /**
   * 全ユーザーへのお知らせを新規投稿する。
   * 投稿後すぐに全ユーザーのお知らせ一覧に表示される。
   */
  createNotice: (body: AdminNoticeRequest): Promise<void> =>
    apiClient
      .post<ApiResponse<null>>('/api/admin/board/notices', body)
      .then(() => undefined),

  /**
   * 既存のお知らせを編集する。
   */
  updateNotice: (noticeId: number, body: AdminNoticeRequest): Promise<void> =>
    apiClient
      .put<ApiResponse<null>>(`/api/admin/board/notices/${noticeId}`, body)
      .then(() => undefined),

  /**
   * お知らせを削除する。
   * notice_reads の紐づきレコードは CASCADE で自動削除される。
   */
  deleteNotice: (adminSecret: string, noticeId: number): Promise<void> =>
    apiClient
      .delete<ApiResponse<null>>(`/api/admin/board/notices/${noticeId}`, { params: { adminSecret } })
      .then(() => undefined),

  /**
   * 全ユーザーの問い合わせ一覧をユーザー名・返信込みで取得する。
   * 未対応件数はフロント側で status=0 のものをカウントして表示する。
   */
  getAdminInquiries: (adminSecret: string): Promise<AdminInquiry[]> =>
    apiClient
      .get<ApiResponse<AdminInquiry[]>>('/api/admin/board/inquiries', { params: { adminSecret } })
      .then((r) => r.data.data),

  /**
   * 問い合わせに返信し、ステータスを「対応済み」に更新する。
   * targetType=0（個別返信）または targetType=1（全体お知らせとして投稿）を選択する。
   */
  replyToInquiry: (inquiryId: number, body: AdminReplyRequest): Promise<void> =>
    apiClient
      .post<ApiResponse<null>>(`/api/admin/board/inquiries/${inquiryId}/reply`, body)
      .then(() => undefined),

  /**
   * 返信を削除する。
   *
   * targetType=1（全体お知らせ）として投稿されていた場合、notices からも削除される。
   * 対象の問い合わせステータスは「未対応（0）」に戻る。
   */
  deleteReply: (adminSecret: string, replyId: number): Promise<void> =>
    apiClient
      .delete<ApiResponse<null>>(`/api/admin/board/replies/${replyId}`, { params: { adminSecret } })
      .then(() => undefined),
};
