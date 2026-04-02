import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState } from '../types';
import type { LoginFormValues } from '../types';

const TOKEN_KEY = 'photo_diary_token';
const USER_KEY = 'photo_diary_user';

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
      // モック：実際は authApi.login(values) を使用
      await new Promise((r) => setTimeout(r, 800));
      if (values.username === 'demo' && values.password === 'demo') {
        const token = 'mock-jwt-token-xxx';
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, values.username);
        setAuth({ token, username: values.username, isAuthenticated: true });
        navigate('/album');
      } else {
        setError('ユーザー名またはパスワードが正しくありません');
      }
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

  return { auth, loading, error, login, logout };
};
