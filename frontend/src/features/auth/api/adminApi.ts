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
};
