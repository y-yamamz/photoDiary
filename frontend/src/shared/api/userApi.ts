import { apiClient } from './apiClient';
import type { ApiResponse, StorageInfo } from '../types';

export const userApi = {
  /** 自分のストレージ使用量・上限を取得する */
  getMyStorage: () =>
    apiClient
      .get<ApiResponse<StorageInfo>>('/api/users/me/storage')
      .then((r) => r.data.data),
};
