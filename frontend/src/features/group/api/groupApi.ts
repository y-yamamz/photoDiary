import { apiClient } from '../../../shared/api/apiClient';
import type { Group, GroupRequest, ApiResponse } from '../../../shared/types';

export const groupApi = {
  getAll: () =>
    apiClient
      .get<ApiResponse<Group[]>>('/api/photo-groups')
      .then((r) => r.data.data),

  create: (body: GroupRequest) =>
    apiClient
      .post<ApiResponse<Group>>('/api/photo-groups', body)
      .then((r) => r.data.data),

  update: (groupId: number, body: GroupRequest) =>
    apiClient
      .put<ApiResponse<Group>>(`/api/photo-groups/${groupId}`, body)
      .then((r) => r.data.data),

  delete: (groupId: number) =>
    apiClient
      .delete<ApiResponse<void>>(`/api/photo-groups/${groupId}`)
      .then((r) => r.data),
};
