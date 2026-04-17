import { apiClient } from '../../../shared/api/apiClient';
import type { Photo, ApiResponse } from '../../../shared/types';
import type { OutputFormat } from '../types';

export const photoApi = {
  /** 写真単体アップロード */
  upload: (formData: FormData, outputFormat: OutputFormat, onProgress?: (pct: number) => void) =>
    apiClient
      .post<ApiResponse<Photo>>(`/api/photos?outputFormat=${outputFormat}`, formData, {
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data.data),

  /** 写真一括アップロード */
  bulkUpload: (formData: FormData, outputFormat: OutputFormat, onProgress?: (pct: number) => void) =>
    apiClient
      .post<ApiResponse<Photo[]>>(`/api/photos/bulk?outputFormat=${outputFormat}`, formData, {
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data.data),
};
