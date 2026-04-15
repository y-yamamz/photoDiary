import { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../hooks/useAuth';
import { loginContainerSx, loginCardSx, submitButtonSx, orbitSx } from '../styles/loginSx';
import { GradientText } from '../../../shared/components/GradientText';
import { alpha } from '@mui/material/styles';

export const LoginPage = () => {
  const { login, register, changePassword, loading, error } = useAuth();

  // ログイン / 新規登録 / パスワード変更 の切り替え
  const [mode, setMode] = useState<'login' | 'register' | 'changePassword'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);

  // 確認パスワードの不一致チェック
  const confirmError = mode === 'register' && confirmPassword && password !== confirmPassword
    ? 'パスワードが一致しません'
    : null;
  const confirmNewError = mode === 'changePassword' && confirmNewPassword && newPassword !== confirmNewPassword
    ? 'パスワードが一致しません'
    : null;

  const switchMode = (next: 'login' | 'register' | 'changePassword') => {
    setMode(next);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangeSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      login({ username, password });
    } else if (mode === 'register') {
      if (confirmError) return;
      register({ username, password });
    } else {
      if (confirmNewError) return;
      const ok = await changePassword({ username, currentPassword: password, newPassword });
      if (ok) setChangeSuccess(true);
    }
  };

  const canSubmit = !loading && !!username && !!password && (
    mode === 'login' ||
    (mode === 'register' && !!confirmPassword && !confirmError) ||
    (mode === 'changePassword' && !!newPassword && !!confirmNewPassword && !confirmNewError)
  );

  return (
    <Box sx={loginContainerSx}>
      {/* 背景オーブ */}
      <Box sx={orbitSx(600, '#7c3aed', '-10%', '-15%')} />
      <Box sx={orbitSx(500, '#db2777', '60%', '70%')} />
      <Box sx={orbitSx(400, '#3b82f6', '30%', '80%')} />

      {/* フローティングパーティクル */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#a78bfa' : '#f472b6',
            top: `${15 + i * 14}%`,
            left: `${10 + i * 13}%`,
            opacity: 0.6,
            animation: `float${i} ${3 + i}s ease-in-out infinite`,
            [`@keyframes float${i}`]: {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: `translateY(${i % 2 === 0 ? '-' : ''}12px)` },
            },
          }}
        />
      ))}

      <Box sx={loginCardSx}>
        {/* ロゴ */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              boxShadow: '0 8px 32px rgba(124, 58, 237, 0.5)',
              mb: 2,
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
          <GradientText variant="h4" fontWeight={800} gutterBottom>
            PhotoDiary
          </GradientText>
          <Typography variant="body2" color="text.secondary">
            あなたの思い出を、美しく。
          </Typography>
        </Box>

        {/* モード切替タブ */}
        <Box
          sx={{
            display: 'flex',
            mb: 3,
            borderRadius: 2,
            background: alpha('#1e1b4b', 0.6),
            p: 0.5,
          }}
        >
          {(['login', 'register', 'changePassword'] as const).map((m) => (
            <Button
              key={m}
              fullWidth
              onClick={() => switchMode(m)}
              sx={{
                py: 1,
                borderRadius: 1.5,
                fontWeight: 600,
                fontSize: '0.8rem',
                minWidth: 0,
                color: mode === m ? '#fff' : 'text.secondary',
                background: mode === m
                  ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                  : 'transparent',
                boxShadow: mode === m ? `0 2px 12px ${alpha('#7c3aed', 0.4)}` : 'none',
                transition: 'all 0.25s ease',
                '&:hover': {
                  background: mode === m
                    ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                    : alpha('#a78bfa', 0.1),
                },
              }}
            >
              {m === 'login' ? 'ログイン' : m === 'register' ? '新規登録' : 'ﾊﾟｽﾜｰﾄﾞ変更'}
            </Button>
          ))}
        </Box>

        {/* エラー表示（バックエンドエラーはここに表示） */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* パスワード変更成功メッセージ */}
        {changeSuccess && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon />}
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setChangeSuccess(false)}
          >
            パスワードを変更しました。新しいパスワードでログインしてください。
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* ユーザー名 */}
          <TextField
            label="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            autoFocus
            helperText={mode === 'register' ? '3〜100文字' : undefined}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* パスワード（ログイン・新規登録）または 現在のパスワード（PW変更） */}
          <TextField
            label={mode === 'changePassword' ? '現在のパスワード' : 'パスワード'}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            helperText={mode === 'register' ? '6文字以上' : undefined}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 新規登録時：確認パスワード */}
          {mode === 'register' && (
            <TextField
              label="パスワード（確認）"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              error={!!confirmError}
              helperText={confirmError ?? undefined}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((s) => !s)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* パスワード変更時：新しいパスワード＋確認 */}
          {mode === 'changePassword' && (
            <>
              <TextField
                label="新しいパスワード"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                helperText="6文字以上"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((s) => !s)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="新しいパスワード（確認）"
                type={showConfirmNew ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                fullWidth
                error={!!confirmNewError}
                helperText={confirmNewError ?? undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmNew((s) => !s)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showConfirmNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={submitButtonSx}
            disabled={!canSubmit}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : mode === 'login' ? (
              <><AutoAwesomeIcon sx={{ mr: 1, fontSize: 18 }} />ログイン</>
            ) : mode === 'register' ? (
              <><PersonAddIcon sx={{ mr: 1, fontSize: 18 }} />アカウントを作成</>
            ) : (
              <><KeyIcon sx={{ mr: 1, fontSize: 18 }} />パスワードを変更</>
            )}
          </Button>
        </Box>

        {mode === 'login' && (
          <>
            <Divider sx={{ my: 3, opacity: 0.3 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                アカウントをお持ちでない方は「新規登録」からご登録ください
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
