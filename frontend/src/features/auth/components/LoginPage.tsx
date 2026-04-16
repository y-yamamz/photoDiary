import { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider, Chip,
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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import SyncIcon from '@mui/icons-material/Sync';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';
import type { RecalculateStorageResult, UserStorageInfo } from '../api/adminApi';
import TuneIcon from '@mui/icons-material/Tune';
import { loginContainerSx, loginCardSx, submitButtonSx, orbitSx } from '../styles/loginSx';
import { GradientText } from '../../../shared/components/GradientText';
import { alpha } from '@mui/material/styles';

type Mode = 'login' | 'register' | 'changePassword' | 'adminReset' | 'adminStorage';

export const LoginPage = () => {
  const { login, register, changePassword, adminResetPassword, loading, error } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [showAdminNew, setShowAdminNew] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState(false);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageResult, setStorageResult] = useState<RecalculateStorageResult | null>(null);
  const [limitMb, setLimitMb] = useState('');
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [limitSuccess, setLimitSuccess] = useState(false);
  const [currentUserStorage, setCurrentUserStorage] = useState<UserStorageInfo | null>(null);
  const [currentStorageLoading, setCurrentStorageLoading] = useState(false);

  const confirmError = mode === 'register' && confirmPassword && password !== confirmPassword
    ? 'パスワードが一致しません' : null;
  const confirmNewError = mode === 'changePassword' && confirmNewPassword && newPassword !== confirmNewPassword
    ? 'パスワードが一致しません' : null;
  const adminConfirmError = mode === 'adminReset' && adminConfirmPassword && adminNewPassword !== adminConfirmPassword
    ? 'パスワードが一致しません' : null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setUsername(''); setPassword(''); setConfirmPassword('');
    setNewPassword(''); setConfirmNewPassword('');
    setAdminSecret(''); setAdminNewPassword(''); setAdminConfirmPassword('');
    setChangeSuccess(false); setAdminResetSuccess(false);
    setStorageError(null); setStorageResult(null);
    setLimitMb(''); setLimitLoading(false); setLimitError(null); setLimitSuccess(false);
    setCurrentUserStorage(null); setCurrentStorageLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      login({ username, password });
    } else if (mode === 'register') {
      if (confirmError) return;
      register({ username, password });
    } else if (mode === 'changePassword') {
      if (confirmNewError) return;
      const ok = await changePassword({ username, currentPassword: password, newPassword });
      if (ok) setChangeSuccess(true);
    } else if (mode === 'adminReset') {
      if (adminConfirmError) return;
      const ok = await adminResetPassword({ adminSecret, username, newPassword: adminNewPassword });
      if (ok) setAdminResetSuccess(true);
    } else if (mode === 'adminStorage') {
      setStorageLoading(true);
      setStorageError(null);
      setStorageResult(null);
      try {
        const result = await adminApi.recalculateStorage({ adminSecret, username });
        setStorageResult(result);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setStorageError(msg ?? 'エラーが発生しました');
      } finally {
        setStorageLoading(false);
      }
    }
  };

  const handleFetchUserStorage = async () => {
    if (!adminSecret || !username) return;
    setCurrentStorageLoading(true);
    setCurrentUserStorage(null);
    try {
      const info = await adminApi.getUserStorage(adminSecret, username);
      setCurrentUserStorage(info);
    } catch {
      setCurrentUserStorage(null);
    } finally {
      setCurrentStorageLoading(false);
    }
  };

  const handleUpdateStorageLimit = async () => {
    const mb = parseInt(limitMb, 10);
    if (!adminSecret || !username || !limitMb || isNaN(mb) || mb <= 0) return;
    setLimitLoading(true);
    setLimitError(null);
    setLimitSuccess(false);
    try {
      await adminApi.updateStorageLimit({ adminSecret, username, limitMb: mb });
      setLimitSuccess(true);
      setCurrentUserStorage((prev) => prev ? { ...prev, limitMb: mb, limitBytes: mb * 1024 * 1024 } : null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLimitError(msg ?? 'エラーが発生しました');
    } finally {
      setLimitLoading(false);
    }
  };

  const canSubmit = !loading && !storageLoading && (
    (mode === 'login' && !!username && !!password) ||
    (mode === 'register' && !!username && !!password && !!confirmPassword && !confirmError) ||
    (mode === 'changePassword' && !!username && !!password && !!newPassword && !!confirmNewPassword && !confirmNewError) ||
    (mode === 'adminReset' && !!adminSecret && !!username && !!adminNewPassword && !!adminConfirmPassword && !adminConfirmError) ||
    (mode === 'adminStorage' && !!adminSecret && !!username)
  );

  const isAdminMode = mode === 'adminReset' || mode === 'adminStorage';

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
            width: 4, height: 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#a78bfa' : '#f472b6',
            top: `${15 + i * 14}%`, left: `${10 + i * 13}%`,
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
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72, borderRadius: '20px',
              background: mode === 'adminStorage'
                ? 'linear-gradient(135deg, #0369a1, #38bdf8)'
                : isAdminMode
                  ? 'linear-gradient(135deg, #dc2626, #f87171)'
                  : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              boxShadow: mode === 'adminStorage'
                ? '0 8px 32px rgba(3, 105, 161, 0.5)'
                : isAdminMode
                  ? '0 8px 32px rgba(220, 38, 38, 0.5)'
                  : '0 8px 32px rgba(124, 58, 237, 0.5)',
              mb: 2,
              transition: 'all 0.3s ease',
            }}
          >
            {mode === 'adminStorage'
              ? <StorageIcon sx={{ fontSize: 36, color: '#fff' }} />
              : isAdminMode
                ? <AdminPanelSettingsIcon sx={{ fontSize: 36, color: '#fff' }} />
                : <PhotoCameraIcon sx={{ fontSize: 36, color: '#fff' }} />
            }
          </Box>
          <GradientText variant="h4" fontWeight={800} gutterBottom>
            {mode === 'adminStorage' ? '容量管理' : isAdminMode ? '管理者メニュー' : 'PhotoDiary'}
          </GradientText>
          <Typography variant="body2" color="text.secondary">
            {mode === 'adminStorage'
              ? '使用済み容量を再計算して更新します'
              : isAdminMode
                ? 'ユーザーのパスワードをリセットします'
                : 'あなたの思い出を、美しく。'}
          </Typography>
        </Box>

        {/* モード切替タブ（通常モードのみ表示） */}
        {!isAdminMode && (
          <Box sx={{ display: 'flex', mb: 3, borderRadius: 2, background: alpha('#1e1b4b', 0.6), p: 0.5 }}>
            {(['login', 'register', 'changePassword'] as const).map((m) => (
              <Button
                key={m}
                fullWidth
                onClick={() => switchMode(m)}
                sx={{
                  py: 1, borderRadius: 1.5, fontWeight: 600, fontSize: '0.8rem', minWidth: 0,
                  color: mode === m ? '#fff' : 'text.secondary',
                  background: mode === m ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'transparent',
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
        )}

        {/* エラー表示 */}
        {(error || storageError) && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error || storageError}</Alert>
        )}

        {/* 成功メッセージ */}
        {changeSuccess && (
          <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setChangeSuccess(false)}>
            パスワードを変更しました。新しいパスワードでログインしてください。
          </Alert>
        )}
        {adminResetSuccess && (
          <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setAdminResetSuccess(false)}>
            パスワードをリセットしました。
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* 容量再計算フォーム */}
          {mode === 'adminStorage' ? (
            <>
              <TextField
                label="管理者シークレットキー"
                type={showAdminSecret ? 'text' : 'password'}
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                fullWidth autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AdminPanelSettingsIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminSecret((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                        {showAdminSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="対象ユーザー名"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setStorageResult(null); setCurrentUserStorage(null); }}
                onBlur={handleFetchUserStorage}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: currentStorageLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} sx={{ color: '#38bdf8' }} />
                    </InputAdornment>
                  ) : undefined,
                }}
              />

              {/* 再計算結果 */}
              {storageResult && (
                <Box
                  sx={{
                    p: 2, borderRadius: 2,
                    background: alpha('#0369a1', 0.12),
                    border: `1px solid ${alpha('#38bdf8', 0.3)}`,
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="#38bdf8" sx={{ display: 'block', mb: 1.5 }}>
                    再計算完了：{storageResult.username}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">対象写真数</Typography>
                      <Typography variant="caption" color={storageResult.photoCount === 0 ? '#f87171' : 'text.secondary'} fontWeight={storageResult.photoCount === 0 ? 700 : 400}>
                        {storageResult.photoCount} 枚
                        {storageResult.photoCount === 0 && '（写真なし／パス不一致）'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">変更前</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(storageResult.oldUsedBytes / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">変更後</Typography>
                      <Typography variant="caption" color="#38bdf8" fontWeight={700}>
                        {(storageResult.newUsedBytes / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">差分</Typography>
                      <Chip
                        size="small"
                        icon={storageResult.diffBytes >= 0
                          ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} />
                          : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />
                        }
                        label={`${storageResult.diffBytes >= 0 ? '+' : ''}${(storageResult.diffBytes / (1024 * 1024)).toFixed(2)} MB`}
                        sx={{
                          height: 20, fontSize: '0.7rem',
                          background: storageResult.diffBytes === 0
                            ? alpha('#64748b', 0.2)
                            : storageResult.diffBytes > 0
                              ? alpha('#f87171', 0.2)
                              : alpha('#34d399', 0.2),
                          color: storageResult.diffBytes === 0
                            ? '#94a3b8'
                            : storageResult.diffBytes > 0
                              ? '#f87171'
                              : '#34d399',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* 容量上限変更セクション */}
              <Divider sx={{ opacity: 0.3 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" fontWeight={700} color="#38bdf8" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TuneIcon sx={{ fontSize: 14 }} />
                  容量上限の変更
                </Typography>
                {currentUserStorage && (
                  <Typography variant="caption" color="text.secondary">
                    現在:&nbsp;
                    <Typography component="span" variant="caption" color="#38bdf8" fontWeight={700}>
                      {currentUserStorage.limitMb} MB
                    </Typography>
                    &nbsp;({(currentUserStorage.usedBytes / (1024 * 1024)).toFixed(0)} MB 使用中)
                  </Typography>
                )}
              </Box>
              {limitError && (
                <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }} onClose={() => setLimitError(null)}>
                  {limitError}
                </Alert>
              )}
              {limitSuccess && (
                <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2, py: 0.5 }} onClose={() => setLimitSuccess(false)}>
                  容量上限を変更しました。
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label="新しい上限 (MB)"
                  type="number"
                  value={limitMb}
                  onChange={(e) => { setLimitMb(e.target.value); setLimitSuccess(false); }}
                  size="small"
                  inputProps={{ min: 1 }}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <StorageIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleUpdateStorageLimit}
                  disabled={limitLoading || !adminSecret || !username || !limitMb || parseInt(limitMb, 10) <= 0}
                  sx={{
                    borderColor: '#38bdf8', color: '#38bdf8',
                    '&:hover': { borderColor: '#0369a1', background: alpha('#38bdf8', 0.08) },
                    '&:disabled': { opacity: 0.4 },
                    whiteSpace: 'nowrap', height: 40,
                  }}
                >
                  {limitLoading ? <CircularProgress size={18} color="inherit" /> : '上限を変更'}
                </Button>
              </Box>
            </>
          ) : isAdminMode ? (
          /* 管理者リセットフォーム */
            <>
              <TextField
                label="管理者シークレットキー"
                type={showAdminSecret ? 'text' : 'password'}
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                fullWidth autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AdminPanelSettingsIcon sx={{ color: '#f87171', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminSecret((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                        {showAdminSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="リセット対象のユーザー名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="新しいパスワード"
                type={showAdminNew ? 'text' : 'password'}
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
                fullWidth helperText="6文字以上"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminNew((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                        {showAdminNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="新しいパスワード（確認）"
                type={showAdminConfirm ? 'text' : 'password'}
                value={adminConfirmPassword}
                onChange={(e) => setAdminConfirmPassword(e.target.value)}
                fullWidth error={!!adminConfirmError} helperText={adminConfirmError ?? undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminConfirm((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                        {showAdminConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          ) : (
          /* 通常フォーム（ログイン・新規登録・PW変更） */
            <>
              <TextField
                label="ユーザー名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth autoFocus
                helperText={mode === 'register' ? '3〜100文字' : undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
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
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {mode === 'register' && (
                <TextField
                  label="パスワード（確認）"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth error={!!confirmError} helperText={confirmError ?? undefined}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              {mode === 'changePassword' && (
                <>
                  <TextField
                    label="新しいパスワード"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth helperText="6文字以上"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowNewPassword((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
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
                    fullWidth error={!!confirmNewError} helperText={confirmNewError ?? undefined}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmNew((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                            {showConfirmNew ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              )}
            </>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={mode === 'adminStorage' ? {
              background: 'linear-gradient(135deg, #0369a1, #38bdf8)',
              boxShadow: `0 4px 20px ${alpha('#0369a1', 0.4)}`,
              py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem',
              '&:hover': { background: 'linear-gradient(135deg, #075985, #0369a1)' },
              '&:disabled': { opacity: 0.5 },
            } : mode === 'adminReset' ? {
              background: 'linear-gradient(135deg, #dc2626, #f87171)',
              boxShadow: `0 4px 20px ${alpha('#dc2626', 0.4)}`,
              py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem',
              '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' },
              '&:disabled': { opacity: 0.5 },
            } : submitButtonSx}
            disabled={!canSubmit}
          >
            {(loading || storageLoading) ? (
              <CircularProgress size={22} color="inherit" />
            ) : mode === 'login' ? (
              <><AutoAwesomeIcon sx={{ mr: 1, fontSize: 18 }} />ログイン</>
            ) : mode === 'register' ? (
              <><PersonAddIcon sx={{ mr: 1, fontSize: 18 }} />アカウントを作成</>
            ) : mode === 'changePassword' ? (
              <><KeyIcon sx={{ mr: 1, fontSize: 18 }} />パスワードを変更</>
            ) : mode === 'adminStorage' ? (
              <><SyncIcon sx={{ mr: 1, fontSize: 18 }} />容量を再計算する</>
            ) : (
              <><AdminPanelSettingsIcon sx={{ mr: 1, fontSize: 18 }} />パスワードをリセット</>
            )}
          </Button>
        </Box>

        {/* 下部リンク */}
        <Divider sx={{ my: 3, opacity: 0.3 }} />
        <Box sx={{ textAlign: 'center' }}>
          {isAdminMode ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {mode !== 'adminStorage' && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    '&:hover': { color: '#38bdf8' }, transition: 'color 0.2s',
                  }}
                  onClick={() => switchMode('adminStorage')}
                >
                  <StorageIcon sx={{ fontSize: 12 }} />
                  容量再計算へ
                </Typography>
              )}
              {mode !== 'adminReset' && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    '&:hover': { color: '#f87171' }, transition: 'color 0.2s',
                  }}
                  onClick={() => switchMode('adminReset')}
                >
                  <AdminPanelSettingsIcon sx={{ fontSize: 12 }} />
                  パスワードリセットへ
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { color: '#a78bfa' }, transition: 'color 0.2s' }}
                onClick={() => switchMode('login')}
              >
                ← ログイン画面に戻る
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5,
                  '&:hover': { color: '#f87171' }, transition: 'color 0.2s',
                }}
                onClick={() => switchMode('adminReset')}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 12 }} />
                管理者用パスワードリセット
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5,
                  '&:hover': { color: '#38bdf8' }, transition: 'color 0.2s',
                }}
                onClick={() => switchMode('adminStorage')}
              >
                <StorageIcon sx={{ fontSize: 12 }} />
                管理者用容量管理
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
