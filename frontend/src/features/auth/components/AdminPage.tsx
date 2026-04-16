import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip,
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
import PeopleIcon from '@mui/icons-material/People';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';
import type { RecalculateStorageResult, UserStorageInfo, UserManageInfo } from '../api/adminApi';
import { loginContainerSx, orbitSx } from '../styles/loginSx';
import { GradientText } from '../../../shared/components/GradientText';
import { alpha } from '@mui/material/styles';

type AdminMode = 'adminReset' | 'adminStorage' | 'adminUsers';

// ユーザー管理タブ用カードスタイル（幅広）
const adminCardSx = {
  width: '100%',
  maxWidth: { xs: '95vw', sm: 680 },
  mx: { xs: 1, sm: 0 },
  p: { xs: 2.5, sm: 4 },
  borderRadius: 4,
  background: 'rgba(30, 27, 75, 0.55)',
  backdropFilter: 'blur(32px)',
  border: `1px solid ${alpha('#f87171', 0.2)}`,
  boxShadow: `0 0 60px ${alpha('#dc2626', 0.15)}, 0 24px 48px rgba(0,0,0,0.5)`,
};

// 標準カードスタイル（通常幅）
const standardCardSx = {
  ...adminCardSx,
  maxWidth: 480,
};

export const AdminPage = () => {
  const navigate = useNavigate();
  const { adminResetPassword, loading, error, clearError } = useAuth();

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

  // ユーザー管理
  const [userList, setUserList] = useState<UserManageInfo[]>([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState<string | null>(null);
  const [toggleLoadingUser, setToggleLoadingUser] = useState<string | null>(null);
  // 削除ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<UserManageInfo | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setUserListError(null);
    clearError();
  };

  // ─── パスワードリセット ───────────────────────────────
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminConfirmError) return;
    const ok = await adminResetPassword({ adminSecret, username, newPassword: adminNewPassword });
    if (ok) setAdminResetSuccess(true);
  };

  // ─── 容量再計算 ────────────────────────────────────────
  const handleRecalcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStorageLoading(true); setStorageError(null); setStorageResult(null);
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

  const handleFetchUserStorage = async () => {
    if (!adminSecret || !username) return;
    setCurrentStorageLoading(true); setCurrentUserStorage(null);
    try {
      const info = await adminApi.getUserStorage(adminSecret, username);
      setCurrentUserStorage(info);
    } catch { /* silent */ }
    finally { setCurrentStorageLoading(false); }
  };

  const handleUpdateStorageLimit = async () => {
    const mb = parseInt(limitMb, 10);
    if (!adminSecret || !username || !limitMb || isNaN(mb) || mb <= 0) return;
    setLimitLoading(true); setLimitError(null); setLimitSuccess(false);
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

  // ─── ユーザー管理 ──────────────────────────────────────
  const handleFetchUsers = async () => {
    if (!adminSecret) return;
    setUserListLoading(true); setUserListError(null);
    try {
      const list = await adminApi.listUsers(adminSecret);
      setUserList(list);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUserListError(msg ?? 'ユーザー一覧の取得に失敗しました');
    } finally {
      setUserListLoading(false);
    }
  };

  const handleToggleActive = async (user: UserManageInfo) => {
    setToggleLoadingUser(user.username);
    const next: 0 | 1 = user.activeFlag === 1 ? 0 : 1;
    try {
      await adminApi.updateActiveFlag(adminSecret, user.username, next);
      setUserList((prev) =>
        prev.map((u) => u.username === user.username ? { ...u, activeFlag: next } : u)
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUserListError(msg ?? '有効フラグの更新に失敗しました');
    } finally {
      setToggleLoadingUser(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteConfirmInput !== deleteTarget.username) return;
    setDeleteLoading(true); setDeleteError(null);
    try {
      await adminApi.deleteUser(adminSecret, deleteTarget.username);
      setUserList((prev) => prev.filter((u) => u.username !== deleteTarget.username));
      setDeleteTarget(null);
      setDeleteConfirmInput('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(msg ?? '削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fmtBytes = (b: number) => {
    if (b >= 1024 * 1024 * 1024) return (b / (1024 ** 3)).toFixed(1) + ' GB';
    if (b >= 1024 * 1024) return (b / (1024 ** 2)).toFixed(0) + ' MB';
    return (b / 1024).toFixed(0) + ' KB';
  };

  const barColor = (pct: number) =>
    pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#a78bfa';

  const tabs: { key: AdminMode; label: string; icon: React.ReactNode }[] = [
    { key: 'adminReset',   label: 'パスワードリセット', icon: <KeyIcon sx={{ fontSize: 15 }} /> },
    { key: 'adminStorage', label: '容量管理',           icon: <StorageIcon sx={{ fontSize: 15 }} /> },
    { key: 'adminUsers',   label: 'ユーザー管理',       icon: <PeopleIcon sx={{ fontSize: 15 }} /> },
  ];

  const tabColor: Record<AdminMode, string> = {
    adminReset:   '#dc2626',
    adminStorage: '#0369a1',
    adminUsers:   '#7c3aed',
  };
  const tabGradient: Record<AdminMode, string> = {
    adminReset:   'linear-gradient(135deg, #dc2626, #f87171)',
    adminStorage: 'linear-gradient(135deg, #0369a1, #38bdf8)',
    adminUsers:   'linear-gradient(135deg, #7c3aed, #a78bfa)',
  };

  const currentCardSx = mode === 'adminUsers' ? adminCardSx : standardCardSx;

  return (
    <Box sx={loginContainerSx}>
      <Box sx={orbitSx(600, '#dc2626', '-10%', '-15%')} />
      <Box sx={orbitSx(500, '#0369a1', '60%', '70%')} />
      <Box sx={orbitSx(400, '#7c3aed', '30%', '80%')} />

      {[...Array(6)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute', width: 4, height: 4, borderRadius: '50%',
          background: i % 2 === 0 ? '#f87171' : '#38bdf8',
          top: `${15 + i * 14}%`, left: `${10 + i * 13}%`, opacity: 0.6,
          animation: `float${i} ${3 + i}s ease-in-out infinite`,
          [`@keyframes float${i}`]: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: `translateY(${i % 2 === 0 ? '-' : ''}12px)` },
          },
        }} />
      ))}

      <Box sx={currentCardSx}>
        {/* ヘッダー */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '18px',
            background: 'linear-gradient(135deg, #dc2626, #0369a1)',
            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.4)', mb: 1.5,
          }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <GradientText variant="h4" fontWeight={800} gutterBottom>管理者画面</GradientText>
          <Typography variant="body2" color="text.secondary">ユーザー管理・ストレージ管理</Typography>
        </Box>

        {/* タブ */}
        <Box sx={{ display: 'flex', mb: 3, borderRadius: 2, background: alpha('#1e1b4b', 0.6), p: 0.5, gap: 0.5 }}>
          {tabs.map(({ key, label, icon }) => (
            <Button key={key} fullWidth onClick={() => switchMode(key)} startIcon={icon}
              sx={{
                py: 0.9, borderRadius: 1.5, fontWeight: 600, fontSize: '0.78rem',
                color: mode === key ? '#fff' : 'text.secondary',
                background: mode === key ? tabGradient[key] : 'transparent',
                boxShadow: mode === key ? `0 2px 12px ${alpha(tabColor[key], 0.4)}` : 'none',
                transition: 'all 0.25s ease',
                '&:hover': { background: mode === key ? tabGradient[key] : alpha('#ffffff', 0.07) },
              }}>
              {label}
            </Button>
          ))}
        </Box>

        {/* ══ パスワードリセット ══════════════════════════════════ */}
        {mode === 'adminReset' && (
          <Box component="form" onSubmit={handleResetSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
            {adminResetSuccess && (
              <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2 }}
                onClose={() => setAdminResetSuccess(false)}>
                パスワードをリセットしました。
              </Alert>
            )}
            <TextField label="管理者シークレットキー" type={showAdminSecret ? 'text' : 'password'}
              value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} fullWidth autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start"><AdminPanelSettingsIcon sx={{ color: '#f87171', fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowAdminSecret((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>{showAdminSecret ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              }} />
            <TextField label="リセット対象のユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
            <TextField label="新しいパスワード" type={showAdminNew ? 'text' : 'password'}
              value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} fullWidth helperText="6文字以上"
              InputProps={{
                startAdornment: <InputAdornment position="start"><KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowAdminNew((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>{showAdminNew ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              }} />
            <TextField label="新しいパスワード（確認）" type={showAdminConfirm ? 'text' : 'password'}
              value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)}
              fullWidth error={!!adminConfirmError} helperText={adminConfirmError ?? undefined}
              InputProps={{
                startAdornment: <InputAdornment position="start"><KeyIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowAdminConfirm((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>{showAdminConfirm ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              }} />
            <Button type="submit" variant="contained" fullWidth
              disabled={loading || !adminSecret || !username || !adminNewPassword || !adminConfirmPassword || !!adminConfirmError}
              sx={{ background: tabGradient.adminReset, boxShadow: `0 4px 20px ${alpha('#dc2626', 0.4)}`, py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem', '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' }, '&:disabled': { opacity: 0.5 } }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : <><AdminPanelSettingsIcon sx={{ mr: 1, fontSize: 18 }} />パスワードをリセット</>}
            </Button>
          </Box>
        )}

        {/* ══ 容量管理 ════════════════════════════════════════════ */}
        {mode === 'adminStorage' && (
          <Box component="form" onSubmit={handleRecalcSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="管理者シークレットキー" type={showAdminSecret ? 'text' : 'password'}
              value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} fullWidth autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start"><AdminPanelSettingsIcon sx={{ color: '#38bdf8', fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowAdminSecret((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>{showAdminSecret ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              }} />
            <TextField label="対象ユーザー名" value={username}
              onChange={(e) => { setUsername(e.target.value); setStorageResult(null); setCurrentUserStorage(null); }}
              onBlur={handleFetchUserStorage} fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: currentStorageLoading ? <InputAdornment position="end"><CircularProgress size={16} sx={{ color: '#38bdf8' }} /></InputAdornment> : undefined,
              }} />
            {storageError && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setStorageError(null)}>{storageError}</Alert>}
            {storageResult && (
              <Box sx={{ p: 2, borderRadius: 2, background: alpha('#0369a1', 0.12), border: `1px solid ${alpha('#38bdf8', 0.3)}` }}>
                <Typography variant="caption" fontWeight={700} color="#38bdf8" sx={{ display: 'block', mb: 1.5 }}>再計算完了：{storageResult.username}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {[
                    { label: '対象写真数', value: <Typography variant="caption" color={storageResult.photoCount === 0 ? '#f87171' : 'text.secondary'} fontWeight={storageResult.photoCount === 0 ? 700 : 400}>{storageResult.photoCount} 枚{storageResult.photoCount === 0 && '（写真なし／パス不一致）'}</Typography> },
                    { label: '変更前', value: <Typography variant="caption" color="text.secondary">{(storageResult.oldUsedBytes / (1024 * 1024)).toFixed(2)} MB</Typography> },
                    { label: '変更後', value: <Typography variant="caption" color="#38bdf8" fontWeight={700}>{(storageResult.newUsedBytes / (1024 * 1024)).toFixed(2)} MB</Typography> },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      {value}
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">差分</Typography>
                    <Chip size="small"
                      icon={storageResult.diffBytes >= 0 ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
                      label={`${storageResult.diffBytes >= 0 ? '+' : ''}${(storageResult.diffBytes / (1024 * 1024)).toFixed(2)} MB`}
                      sx={{ height: 20, fontSize: '0.7rem', background: storageResult.diffBytes === 0 ? alpha('#64748b', 0.2) : storageResult.diffBytes > 0 ? alpha('#f87171', 0.2) : alpha('#34d399', 0.2), color: storageResult.diffBytes === 0 ? '#94a3b8' : storageResult.diffBytes > 0 ? '#f87171' : '#34d399' }} />
                  </Box>
                </Box>
              </Box>
            )}
            <Button type="submit" variant="contained" fullWidth disabled={storageLoading || !adminSecret || !username}
              sx={{ background: tabGradient.adminStorage, boxShadow: `0 4px 20px ${alpha('#0369a1', 0.4)}`, py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem', '&:hover': { background: 'linear-gradient(135deg, #075985, #0369a1)' }, '&:disabled': { opacity: 0.5 } }}>
              {storageLoading ? <CircularProgress size={22} color="inherit" /> : <><SyncIcon sx={{ mr: 1, fontSize: 18 }} />容量を再計算する</>}
            </Button>
            <Divider sx={{ opacity: 0.3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" fontWeight={700} color="#38bdf8" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TuneIcon sx={{ fontSize: 14 }} />容量上限の変更
              </Typography>
              {currentUserStorage && (
                <Typography variant="caption" color="text.secondary">
                  現在:&nbsp;<Typography component="span" variant="caption" color="#38bdf8" fontWeight={700}>{currentUserStorage.limitMb} MB</Typography>
                  &nbsp;({(currentUserStorage.usedBytes / (1024 * 1024)).toFixed(0)} MB 使用中)
                </Typography>
              )}
            </Box>
            {limitError && <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }} onClose={() => setLimitError(null)}>{limitError}</Alert>}
            {limitSuccess && <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2, py: 0.5 }} onClose={() => setLimitSuccess(false)}>容量上限を変更しました。</Alert>}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="新しい上限 (MB)" type="number" value={limitMb}
                onChange={(e) => { setLimitMb(e.target.value); setLimitSuccess(false); }}
                size="small" inputProps={{ min: 1 }} sx={{ flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><StorageIcon sx={{ color: '#38bdf8', fontSize: 18 }} /></InputAdornment> }} />
              <Button type="button" variant="outlined" onClick={handleUpdateStorageLimit}
                disabled={limitLoading || !adminSecret || !username || !limitMb || parseInt(limitMb, 10) <= 0}
                sx={{ borderColor: '#38bdf8', color: '#38bdf8', '&:hover': { borderColor: '#0369a1', background: alpha('#38bdf8', 0.08) }, '&:disabled': { opacity: 0.4 }, whiteSpace: 'nowrap', height: 40 }}>
                {limitLoading ? <CircularProgress size={18} color="inherit" /> : '上限を変更'}
              </Button>
            </Box>
          </Box>
        )}

        {/* ══ ユーザー管理 ════════════════════════════════════════ */}
        {mode === 'adminUsers' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* シークレット入力 + 取得ボタン */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField label="管理者シークレットキー" type={showAdminSecret ? 'text' : 'password'}
                value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} size="small" sx={{ flex: 1 }} autoFocus
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AdminPanelSettingsIcon sx={{ color: '#a78bfa', fontSize: 18 }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowAdminSecret((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>{showAdminSecret ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                }} />
              <Button variant="contained" onClick={handleFetchUsers}
                disabled={userListLoading || !adminSecret}
                startIcon={userListLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                sx={{ background: tabGradient.adminUsers, whiteSpace: 'nowrap', height: 40, borderRadius: 2, fontWeight: 600, '&:disabled': { opacity: 0.5 } }}>
                一覧を取得
              </Button>
            </Box>

            {userListError && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setUserListError(null)}>{userListError}</Alert>}

            {/* ユーザー一覧テーブル */}
            {userList.length > 0 && (
              <Box sx={{ borderRadius: 2, border: `1px solid ${alpha('#a78bfa', 0.2)}`, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: alpha('#1e1b4b', 0.6) }}>
                      <TableCell sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.75rem', borderBottom: `1px solid ${alpha('#a78bfa', 0.2)}` }}>ユーザー名</TableCell>
                      <TableCell sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.75rem', borderBottom: `1px solid ${alpha('#a78bfa', 0.2)}` }}>容量使用状況</TableCell>
                      <TableCell align="center" sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.75rem', borderBottom: `1px solid ${alpha('#a78bfa', 0.2)}` }}>有効</TableCell>
                      <TableCell align="center" sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.75rem', borderBottom: `1px solid ${alpha('#a78bfa', 0.2)}` }}>削除</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userList.map((user) => (
                      <TableRow key={user.userId}
                        sx={{ opacity: user.activeFlag === 0 ? 0.5 : 1, '&:last-child td': { border: 0 }, '&:hover': { background: alpha('#a78bfa', 0.05) } }}>
                        {/* ユーザー名 */}
                        <TableCell sx={{ borderBottom: `1px solid ${alpha('#a78bfa', 0.1)}` }}>
                          <Typography variant="body2" fontWeight={600} color={user.activeFlag === 0 ? 'text.disabled' : 'text.primary'}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                            {user.createdAt ?? ''}
                          </Typography>
                        </TableCell>
                        {/* 容量バー */}
                        <TableCell sx={{ minWidth: 160, borderBottom: `1px solid ${alpha('#a78bfa', 0.1)}` }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {fmtBytes(user.usedBytes)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {user.limitMb} MB
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(user.usagePercent, 100)}
                            sx={{ height: 5, borderRadius: 3, background: alpha('#334155', 0.5), '& .MuiLinearProgress-bar': { background: barColor(user.usagePercent), borderRadius: 3 } }} />
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                            {user.usagePercent.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        {/* 有効フラグ トグル */}
                        <TableCell align="center" sx={{ borderBottom: `1px solid ${alpha('#a78bfa', 0.1)}` }}>
                          <Tooltip title={user.activeFlag === 1 ? '無効にする' : '有効にする'}>
                            <span>
                              <Switch
                                checked={user.activeFlag === 1}
                                onChange={() => handleToggleActive(user)}
                                disabled={toggleLoadingUser === user.username}
                                size="small"
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a78bfa' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#7c3aed' } }}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                        {/* 削除ボタン */}
                        <TableCell align="center" sx={{ borderBottom: `1px solid ${alpha('#a78bfa', 0.1)}` }}>
                          <Tooltip title="ユーザーと全写真を削除">
                            <IconButton size="small" onClick={() => { setDeleteTarget(user); setDeleteConfirmInput(''); setDeleteError(null); }}
                              sx={{ color: alpha('#f87171', 0.6), '&:hover': { color: '#f87171', background: alpha('#f87171', 0.1) } }}>
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* 件数表示 */}
            {userList.length > 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
                {userList.filter((u) => u.activeFlag === 1).length} / {userList.length} 人が有効
              </Typography>
            )}
          </Box>
        )}

        {/* 下部リンク */}
        <Divider sx={{ my: 3, opacity: 0.3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary"
            sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { color: '#a78bfa' }, transition: 'color 0.2s' }}
            onClick={() => navigate('/login')}>
            <ArrowBackIcon sx={{ fontSize: 13 }} />ログイン画面に戻る
          </Typography>
        </Box>
      </Box>

      {/* ══ 削除確認ダイアログ ══════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)}
        PaperProps={{ sx: { background: 'rgba(15, 12, 41, 0.95)', border: `1px solid ${alpha('#f87171', 0.3)}`, borderRadius: 3, backdropFilter: 'blur(20px)', minWidth: 340 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f87171', fontWeight: 700 }}>
          <WarningAmberIcon /> 本当に削除しますか？
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>「{deleteTarget?.username}」</Typography>
            <Typography variant="caption">
              ユーザーと全ての写真データが完全に削除されます。<br />この操作は取り消せません。
            </Typography>
          </Alert>
          {deleteError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{deleteError}</Alert>}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            確認のためユーザー名を入力してください：
          </Typography>
          <TextField fullWidth size="small" value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            placeholder={deleteTarget?.username}
            error={!!deleteConfirmInput && deleteConfirmInput !== deleteTarget?.username}
            helperText={!!deleteConfirmInput && deleteConfirmInput !== deleteTarget?.username ? 'ユーザー名が一致しません' : undefined}
            sx={{ '& input': { fontFamily: 'monospace' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
            sx={{ color: 'text.secondary', '&:hover': { color: '#fff' } }}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleDeleteConfirm}
            disabled={deleteLoading || deleteConfirmInput !== deleteTarget?.username}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
            sx={{ background: 'linear-gradient(135deg, #dc2626, #f87171)', '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' }, '&:disabled': { opacity: 0.5 } }}>
            完全削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
