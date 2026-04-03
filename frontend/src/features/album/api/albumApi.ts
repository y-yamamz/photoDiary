import { apiClient } from '../../../shared/api/apiClient';
import type { Photo, Group, PhotoFilter, ApiResponse } from '../../../shared/types';

export const albumApi = {
  /** 写真一覧取得（フィルター対応） */
  getPhotos: (filter?: PhotoFilter) =>
    apiClient
      .get<ApiResponse<Photo[]>>('/api/photos', { params: filter })
      .then((r) => r.data.data),

  /** グループ一覧取得 */
  getGroups: () =>
    apiClient
      .get<ApiResponse<Group[]>>('/api/photo-groups')
      .then((r) => r.data.data),

  /** 写真単体更新 */
  updatePhoto: (photoId: number, body: {
    groupId?: number | null;
    takenAt?: string;
    location?: string;
    description?: string;
  }) =>
    apiClient
      .put<ApiResponse<Photo>>(`/api/photos/${photoId}`, body)
      .then((r) => r.data.data),

  /** 写真単体削除 */
  deletePhoto: (photoId: number) =>
    apiClient
      .delete<ApiResponse<void>>(`/api/photos/${photoId}`)
      .then((r) => r.data),

  /** 写真一括削除 */
  bulkDeletePhotos: (photoIds: number[]) =>
    apiClient
      .delete<ApiResponse<string>>('/api/photos', { data: { photoIds } })
      .then((r) => r.data),

  /** 写真一括更新（場所・説明） */
  bulkUpdatePhotos: (photoIds: number[], patch: { location?: string; description?: string }) =>
    apiClient
      .put<ApiResponse<string>>('/api/photos/bulk', { photoIds, ...patch })
      .then((r) => r.data),
};
