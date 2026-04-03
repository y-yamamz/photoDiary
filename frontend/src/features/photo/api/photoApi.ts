import { apiClient } from '../../../shared/api/apiClient';
import type { Photo, ApiResponse } from '../../../shared/types';

export const photoApi = {
  /** 写真単体アップロード */
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient
      .post<ApiResponse<Photo>>('/api/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data.data),

  /** 写真一括アップロード */
  bulkUpload: (formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient
      .post<ApiResponse<Photo[]>>('/api/photos/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data.data),
};
