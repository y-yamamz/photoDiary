import axios from 'axios';
import type { Group, GroupRequest, ApiResponse } from '../../../shared/types';

const BASE = '/api';

const axiosWithAuth = () => {
  const token = localStorage.getItem('photo_diary_token');
  return axios.create({ headers: { Authorization: `Bearer ${token}` } });
};

export const groupApi = {
  getAll: () =>
    axiosWithAuth()
      .get<ApiResponse<Group[]>>(`${BASE}/photo-groups`)
      .then((r) => r.data.data),

  create: (body: GroupRequest) =>
    axiosWithAuth()
      .post<ApiResponse<Group>>(`${BASE}/photo-groups`, body)
      .then((r) => r.data.data),

  update: (groupId: number, body: GroupRequest) =>
    axiosWithAuth()
      .put<ApiResponse<Group>>(`${BASE}/photo-groups/${groupId}`, body)
      .then((r) => r.data.data),

  delete: (groupId: number) =>
    axiosWithAuth()
      .delete(`${BASE}/photo-groups/${groupId}`)
      .then((r) => r.data),
};
