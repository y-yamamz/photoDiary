import axios from 'axios';
import type { Photo, Group, PhotoFilter, ApiResponse } from '../../../shared/types';

const BASE = '/api';

const axiosWithAuth = () => {
  const token = localStorage.getItem('photo_diary_token');
  return axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const albumApi = {
  getPhotos: (filter?: PhotoFilter) =>
    axiosWithAuth()
      .get<ApiResponse<Photo[]>>(`${BASE}/photos`, { params: filter })
      .then((r) => r.data.data),

  getGroups: () =>
    axiosWithAuth()
      .get<ApiResponse<Group[]>>(`${BASE}/photo-groups`)
      .then((r) => r.data.data),
};
