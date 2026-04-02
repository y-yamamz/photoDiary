export interface LoginFormValues {
  username: string;
  password: string;
}

export interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
}
