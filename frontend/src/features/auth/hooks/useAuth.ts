import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, LoginFormValues } from '../types';
import { authApi } from '../api/authApi';
import type { RegisterRequest } from '../api/authApi';
import { extractApiError } from '../../../shared/api/apiClient';

const TOKEN_KEY = 'photo_diary_token';
const USER_KEY  = 'photo_diary_user';

const loadState = (): AuthState => ({
  token: localStorage.getItem(TOKEN_KEY),
  username: localStorage.getItem(USER_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
});

export const useAuth = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>(loadState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(values);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, response.user.username);
      setAuth({ token: response.token, username: response.user.username, isAuthenticated: true });
      navigate('/album');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (values: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(values);
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, response.user.username);
      setAuth({ token: response.token, username: response.user.username, isAuthenticated: true });
      navigate('/album');
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, username: null, isAuthenticated: false });
    navigate('/login');
  }, [navigate]);

  return { auth, loading, error, login, register, logout };
};
