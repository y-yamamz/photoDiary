import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider, Chip,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import SyncIcon from '@mui/icons-material/Sync';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';
import type { RecalculateStorageResult, UserStorageInfo } from '../api/adminApi';
import { loginContainerSx, loginCardSx, orbitSx } from '../styles/loginSx';
import { GradientText } from '../../../shared/components/GradientText';
import { alpha } from '@mui/material/styles';

type AdminMode = 'adminReset' | 'adminStorage';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { adminResetPassword, loading, error } = useAuth();

  const [mode, setMode] = useState<AdminMode>('adminReset');

  // 共通
  const [adminSecret, setAdminSecret] = useState('');
  const [username, setUsername] = useState('');
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  // パスワードリセット
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminNew, setShowAdminNew] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState(false);

  // 容量再計算
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageResult, setStorageResult] = useState<RecalculateStorageResult | null>(null);

  // 容量上限変更
  const [limitMb, setLimitMb] = useState('');
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [limitSuccess, setLimitSuccess] = useState(false);
  const [currentUserStorage, setCurrentUserStorage] = useState<UserStorageInfo | null>(null);
  const [currentStorageLoading, setCurrentStorageLoading] = useState(false);

  const adminConfirmError =
    mode === 'adminReset' && adminConfirmPassword && adminNewPassword !== adminConfirmPassword
      ? 'パスワードが一致しません'
      : null;

  const switchMode = (next: AdminMode) => {
    setMode(next);
    setUsername('');
    setAdminNewPassword(''); setAdminConfirmPassword('');
    setAdminResetSuccess(false);
    setStorageError(null); setStorageResult(null);
    setLimitMb(''); setLimitLoading(false); setLimitError(null); setLimitSuccess(false);
    setCurrentUserStorage(null); setCurrentStorageLoading(false);
  };

  // パスワードリセット送信
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminConfirmError) return;
    const ok = await adminResetPassword({ adminSecret, username, newPassword: adminNewPassword });
    if (ok) setAdminResetSuccess(true);
  };

  // 容量再計算送信
  const handleRecalcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  // ユーザーストレージ情報取得（username blur 時）
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

  // 容量上限変更
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

  const isResetBusy = loading;
  const isStorageBusy = storageLoading || limitLoading;

  const canReset = !isResetBusy &&
    !!adminSecret && !!username && !!adminNewPassword && !!adminConfirmPassword && !adminConfirmError;

  const canRecalc = !isStorageBusy && !!adminSecret && !!username;

  return (
    <Box sx={loginContainerSx}>
      {/* 背景オーブ */}
      <Box sx={orbitSx(600, '#dc2626', '-10%', '-15%')} />
      <Box sx={orbitSx(500, '#0369a1', '60%', '70%')} />
      <Box sx={orbitSx(400, '#7c3aed', '30%', '80%')} />

      {/* フローティングパーティクル */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4, height: 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#f87171' : '#38bdf8',
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

      <Box sx={{ ...loginCardSx, maxWidth: 480, border: `1px solid ${alpha('#f87171', 0.2)}`, boxShadow: `0 0 60px ${alpha('#dc2626', 0.15)}, 0 24px 48px rgba(0,0,0,0.5)` }}>

        {/* ヘッダー */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72, borderRadius: '20px',
              background: 'linear-gradient(135deg, #dc2626, #0369a1)',
              boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)',
              mb: 2,
            }}
          >
            <AdminPanelSettingsIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
          <GradientText variant="h4" fontWeight={800} gutterBottom>
            管理者画面
          </GradientText>
          <Typography variant="body2" color="text.secondary">
            ユーザー管理・ストレージ管理
          </Typography>
        </Box>

        {/* タブ */}
        <Box sx={{ display: 'flex', mb: 3, borderRadius: 2, background: alpha('#1e1b4b', 0.6), p: 0.5 }}>
          {([
            { key: 'adminReset', label: 'パスワードリセット', icon: <KeyIcon sx={{ fontSize: 15 }} /> },
            { key: 'adminStorage', label: '容量管理', icon: <StorageIcon sx={{ fontSize: 15 }} /> },
          ] as const).map(({ key, label, icon }) => (
            <Button
              key={key}
              fullWidth
              onClick={() => switchMode(key)}
              startIcon={icon}
              sx={{
                py: 1, borderRadius: 1.5, fontWeight: 600, fontSize: '0.82rem',
                color: mode === key ? '#fff' : 'text.secondary',
                background: mode === key
                  ? key === 'adminReset'
                    ? 'linear-gradient(135deg, #dc2626, #f87171)'
                    : 'linear-gradient(135deg, #0369a1, #38bdf8)'
                  : 'transparent',
                boxShadow: mode === key
                  ? `0 2px 12px ${alpha(key === 'adminReset' ? '#dc2626' : '#0369a1', 0.4)}`
                  : 'none',
                transition: 'all 0.25s ease',
                '&:hover': {
                  background: mode === key
                    ? key === 'adminReset'
                      ? 'linear-gradient(135deg, #dc2626, #f87171)'
                      : 'linear-gradient(135deg, #0369a1, #38bdf8)'
                    : alpha('#ffffff', 0.07),
                },
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* ---- パスワードリセットフォーム ---- */}
        {mode === 'adminReset' && (
          <Box component="form" onSubmit={handleResetSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
            {adminResetSuccess && (
              <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2 }}
                onClose={() => setAdminResetSuccess(false)}>
                パスワードをリセットしました。
              </Alert>
            )}

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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!canReset}
              sx={{
                background: 'linear-gradient(135deg, #dc2626, #f87171)',
                boxShadow: `0 4px 20px ${alpha('#dc2626', 0.4)}`,
                py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem',
                '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              {isResetBusy
                ? <CircularProgress size={22} color="inherit" />
                : <><AdminPanelSettingsIcon sx={{ mr: 1, fontSize: 18 }} />パスワードをリセット</>
              }
            </Button>
          </Box>
        )}

        {/* ---- 容量管理フォーム ---- */}
        {mode === 'adminStorage' && (
          <Box component="form" onSubmit={handleRecalcSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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

            {/* エラー */}
            {storageError && (
              <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setStorageError(null)}>
                {storageError}
              </Alert>
            )}

            {/* 再計算結果 */}
            {storageResult && (
              <Box sx={{ p: 2, borderRadius: 2, background: alpha('#0369a1', 0.12), border: `1px solid ${alpha('#38bdf8', 0.3)}` }}>
                <Typography variant="caption" fontWeight={700} color="#38bdf8" sx={{ display: 'block', mb: 1.5 }}>
                  再計算完了：{storageResult.username}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">対象写真数</Typography>
                    <Typography variant="caption"
                      color={storageResult.photoCount === 0 ? '#f87171' : 'text.secondary'}
                      fontWeight={storageResult.photoCount === 0 ? 700 : 400}>
                      {storageResult.photoCount} 枚{storageResult.photoCount === 0 && '（写真なし／パス不一致）'}
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
                        : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
                      label={`${storageResult.diffBytes >= 0 ? '+' : ''}${(storageResult.diffBytes / (1024 * 1024)).toFixed(2)} MB`}
                      sx={{
                        height: 20, fontSize: '0.7rem',
                        background: storageResult.diffBytes === 0
                          ? alpha('#64748b', 0.2)
                          : storageResult.diffBytes > 0 ? alpha('#f87171', 0.2) : alpha('#34d399', 0.2),
                        color: storageResult.diffBytes === 0
                          ? '#94a3b8'
                          : storageResult.diffBytes > 0 ? '#f87171' : '#34d399',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {/* 再計算ボタン */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!canRecalc}
              sx={{
                background: 'linear-gradient(135deg, #0369a1, #38bdf8)',
                boxShadow: `0 4px 20px ${alpha('#0369a1', 0.4)}`,
                py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem',
                '&:hover': { background: 'linear-gradient(135deg, #075985, #0369a1)' },
                '&:disabled': { opacity: 0.5 },
              }}
            >
              {storageLoading
                ? <CircularProgress size={22} color="inherit" />
                : <><SyncIcon sx={{ mr: 1, fontSize: 18 }} />容量を再計算する</>
              }
            </Button>

            {/* 容量上限変更セクション */}
            <Divider sx={{ opacity: 0.3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" fontWeight={700} color="#38bdf8"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
              <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2, py: 0.5 }}
                onClose={() => setLimitSuccess(false)}>
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
          </Box>
        )}

        {/* 下部リンク */}
        <Divider sx={{ my: 3, opacity: 0.3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5,
              '&:hover': { color: '#a78bfa' }, transition: 'color 0.2s',
            }}
            onClick={() => navigate('/login')}
          >
            <ArrowBackIcon sx={{ fontSize: 13 }} />
            ログイン画面に戻る
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
