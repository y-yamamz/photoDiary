import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse, LoginRequest, LoginResponse } from '../../../shared/types';

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface AdminResetPasswordRequest {
  adminSecret: string;
  username: string;
  newPassword: string;
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

  changePassword: (body: ChangePasswordRequest) =>
    apiClient
      .put<ApiResponse<null>>('/api/users/password', body)
      .then((r) => r.data),

  adminResetPassword: (body: AdminResetPasswordRequest) =>
    apiClient
      .put<ApiResponse<null>>('/api/admin/users/reset-password', body)
      .then((r) => r.data),
};
