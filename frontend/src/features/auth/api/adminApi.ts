import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse } from '../../../shared/types';

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
};
