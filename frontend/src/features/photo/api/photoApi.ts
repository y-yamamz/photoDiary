import axios from 'axios';
import type { Photo, ApiResponse } from '../../../shared/types';

const BASE = '/api';

const axiosWithAuth = () => {
  const token = localStorage.getItem('photo_diary_token');
  return axios.create({ headers: { Authorization: `Bearer ${token}` } });
};

export const photoApi = {
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    axiosWithAuth()
      .post<ApiResponse<Photo>>(`${BASE}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      })
      .then((r) => r.data.data),

  delete: (photoId: number) =>
    axiosWithAuth()
      .delete(`${BASE}/photos/${photoId}`)
      .then((r) => r.data),
};
