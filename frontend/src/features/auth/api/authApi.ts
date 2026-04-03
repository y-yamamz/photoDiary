import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse, LoginRequest, LoginResponse } from '../../../shared/types';

export interface RegisterRequest {
  username: string;
  password: string;
}

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient
      .post<ApiResponse<LoginResponse>>('/api/login', body)
      .then((r) => r.data.data),

  register: (body: RegisterRequest) =>
    apiClient
      .post<ApiResponse<LoginResponse>>('/api/users/register', body)
      .then((r) => r.data.data),
};
