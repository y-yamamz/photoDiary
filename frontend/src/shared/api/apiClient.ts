import axios from 'axios';

const TOKEN_KEY = 'photo_diary_token';
const USER_KEY  = 'photo_diary_user';

/**
 * 全機能で共通利用するAxiosインスタンス。
 *
 * - ベースURLは環境変数 VITE_API_BASE_URL で切り替え可能
 *   （未設定時は相対パス → Vite dev proxy が /api/* を localhost:8080 へ転送）
 * - リクエストインターセプター: localStorage のトークンを Authorization ヘッダーに自動付与
 * - レスポンスインターセプター: 401 はトークンを削除してログイン画面へリダイレクト
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
