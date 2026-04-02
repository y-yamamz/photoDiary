import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../../../shared/types';

const BASE = '/api';

export const authApi = {
  login: (body: LoginRequest) =>
    axios.post<LoginResponse>(`${BASE}/login`, body).then((r) => r.data),

  logout: () =>
    axios.post(`${BASE}/logout`).then((r) => r.data),
};
