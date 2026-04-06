import axios from 'axios';
import { logger } from '../utils/logger';

const TOKEN_KEY = 'photo_diary_token';
const USER_KEY  = 'photo_diary_user';

/**
 * 全機能で共通利用するAxiosインスタンス。
 *
 * - ベースURLは環境変数 VITE_API_BASE_URL で切り替え可能
 *   （未設定時は相対パス → Vite dev proxy が /api/* を localhost:8080 へ転送）
 * - リクエストインターセプター: sessionStorage のトークンを Authorization ヘッダーに自動付与
 * - レスポンスインターセプター: 401 はトークンを削除してログイン画面へリダイレクト
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const url: string = error.config?.url ?? '';
    const method: string = (error.config?.method ?? '').toUpperCase();

    logger.error(
      `API ${method} ${url} → ${status ?? 'network error'}`,
      'apiClient',
      {
        status,
        message: error.response?.data?.message,
        stack: error.stack,
      },
    );

    // ログイン・登録エンドポイント自体の 401 はリダイレクトしない
    // （認証失敗メッセージを画面に表示させるため）
    const isAuthEndpoint = url.includes('/api/login') || url.includes('/api/users/register');
    if (status === 401 && !isAuthEndpoint) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/**
 * Axios エラーからバックエンドのメッセージを抽出するヘルパー。
 * バックエンドの ApiResponse<Void>.message を返す。
 */
export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message as string | undefined;
    if (msg) return msg;
    if (error.response?.status === 404) return 'リソースが見つかりません';
    if (error.response?.status === 403) return 'アクセス権がありません';
    if (error.response?.status === 500) return 'サーバーエラーが発生しました';
  }
  return 'エラーが発生しました';
};
