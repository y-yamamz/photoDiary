import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip,
  Collapse, Radio, RadioGroup, FormControlLabel, FormControl as MuiFormControl,
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
import CampaignIcon from '@mui/icons-material/Campaign';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ReplyIcon from '@mui/icons-material/Reply';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../api/adminApi';
import type { RecalculateStorageResult, UserStorageInfo, UserManageInfo } from '../api/adminApi';
import type { Notice, AdminInquiry } from '../../board/types';
import { loginContainerSx, orbitSx } from '../styles/loginSx';
import { GradientText } from '../../../shared/components/GradientText';
import { alpha } from '@mui/material/styles';

type AdminMode = 'adminReset' | 'adminStorage' | 'adminUsers' | 'adminBoard';
/** 掲示板タブ内のサブタブ */
type BoardSubTab = 'noticePost' | 'inquiryList';

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

  // ─── 掲示板管理 ───────────────────────────────────────────
  const [boardSubTab, setBoardSubTab] = useState<BoardSubTab>('noticePost');
  // お知らせ投稿・編集
  const [noticeList, setNoticeList]           = useState<Notice[]>([]);
  const [noticeListLoading, setNoticeListLoading] = useState(false);
  const [noticeListError, setNoticeListError]   = useState<string | null>(null);
  const [noticeTitle, setNoticeTitle]           = useState('');
  const [noticeBody, setNoticeBody]             = useState('');
  const [noticePostLoading, setNoticePostLoading] = useState(false);
  const [noticePostError, setNoticePostError]   = useState<string | null>(null);
  const [noticePostSuccess, setNoticePostSuccess] = useState(false);
  /** 編集対象のお知らせ（nullは新規投稿モード） */
  const [editingNotice, setEditingNotice]       = useState<Notice | null>(null);
  // 問い合わせ一覧
  const [inquiryList, setInquiryList]               = useState<AdminInquiry[]>([]);
  const [inquiryListLoading, setInquiryListLoading]   = useState(false);
  const [inquiryListError, setInquiryListError]       = useState<string | null>(null);
  const [expandedInquiryId, setExpandedInquiryId]     = useState<number | null>(null);
  // 返信フォーム
  const [replyTarget, setReplyTarget]               = useState<AdminInquiry | null>(null);
  const [replyBody, setReplyBody]                   = useState('');
  const [replyTargetType, setReplyTargetType]       = useState<0 | 1>(0);
  const [replyNoticeTitle, setReplyNoticeTitle]     = useState('');
  const [replyLoading, setReplyLoading]             = useState(false);
  const [replyError, setReplyError]                 = useState<string | null>(null);
  const [replySuccess, setReplySuccess]             = useState(false);
  // 返信削除確認ダイアログ
  /** 削除対象の返信ID（nullでダイアログ非表示） */
  const [deleteReplyId, setDeleteReplyId]           = useState<number | null>(null);
  const [deleteReplyLoading, setDeleteReplyLoading] = useState(false);
  const [deleteReplyError, setDeleteReplyError]     = useState<string | null>(null);

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
    // 掲示板タブのリセット
    setNoticeListError(null); setNoticePostError(null); setNoticePostSuccess(false);
    setInquiryListError(null); setReplyError(null); setReplySuccess(false);
    setReplyTarget(null); setEditingNotice(null);
    clearError();
  };

  // ─── 掲示板：お知らせ一覧取得 ─────────────────────────────
  const handleFetchNotices = useCallback(async () => {
    if (!adminSecret) return;
    setNoticeListLoading(true); setNoticeListError(null);
    try {
      const list = await adminApi.getAdminNotices(adminSecret);
      setNoticeList(list);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setNoticeListError(msg ?? 'お知らせ一覧の取得に失敗しました');
    } finally {
      setNoticeListLoading(false);
    }
  }, [adminSecret]);

  // ─── 掲示板：お知らせ投稿/編集 ────────────────────────────
  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret || !noticeTitle.trim() || !noticeBody.trim()) return;
    setNoticePostLoading(true); setNoticePostError(null); setNoticePostSuccess(false);
    try {
      if (editingNotice) {
        // 編集モード
        await adminApi.updateNotice(editingNotice.noticeId, {
          adminSecret, title: noticeTitle.trim(), body: noticeBody.trim(),
        });
      } else {
        // 新規投稿モード
        await adminApi.createNotice({ adminSecret, title: noticeTitle.trim(), body: noticeBody.trim() });
      }
      setNoticePostSuccess(true);
      setNoticeTitle(''); setNoticeBody(''); setEditingNotice(null);
      // 投稿後に一覧を再取得
      handleFetchNotices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setNoticePostError(msg ?? '投稿に失敗しました');
    } finally {
      setNoticePostLoading(false);
    }
  };

  /** お知らせ編集ボタン押下時：フォームに既存内容をセット */
  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeBody(notice.body);
    setNoticePostError(null); setNoticePostSuccess(false);
  };

  /** お知らせ削除 */
  const handleDeleteNotice = async (noticeId: number) => {
    if (!adminSecret) return;
    try {
      await adminApi.deleteNotice(adminSecret, noticeId);
      setNoticeList((prev) => prev.filter((n) => n.noticeId !== noticeId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setNoticeListError(msg ?? '削除に失敗しました');
    }
  };

  // ─── 掲示板：問い合わせ一覧取得 ───────────────────────────
  const handleFetchInquiries = useCallback(async () => {
    if (!adminSecret) return;
    setInquiryListLoading(true); setInquiryListError(null);
    try {
      const list = await adminApi.getAdminInquiries(adminSecret);
      setInquiryList(list);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setInquiryListError(msg ?? '問い合わせ一覧の取得に失敗しました');
    } finally {
      setInquiryListLoading(false);
    }
  }, [adminSecret]);

  // ─── 掲示板：問い合わせへ返信 ─────────────────────────────
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyBody.trim()) return;
    if (replyTargetType === 1 && !replyNoticeTitle.trim()) return;
    setReplyLoading(true); setReplyError(null); setReplySuccess(false);
    try {
      await adminApi.replyToInquiry(replyTarget.inquiryId, {
        adminSecret,
        body: replyBody.trim(),
        targetType: replyTargetType,
        noticeTitle: replyTargetType === 1 ? replyNoticeTitle.trim() : undefined,
      });
      setReplySuccess(true);
      setReplyBody(''); setReplyNoticeTitle(''); setReplyTargetType(0);
      // 返信後に一覧を再取得して対応済みへの更新を反映
      handleFetchInquiries();
      setReplyTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setReplyError(msg ?? '返信に失敗しました');
    } finally {
      setReplyLoading(false);
    }
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

  // ─── 掲示板：返信削除確定 ──────────────────────────────
  const handleDeleteReplyConfirm = async () => {
    if (deleteReplyId == null) return;
    setDeleteReplyLoading(true); setDeleteReplyError(null);
    try {
      await adminApi.deleteReply(adminSecret, deleteReplyId);
      // 削除成功：一覧を再取得してステータス変化を反映
      setDeleteReplyId(null);
      setReplySuccess(false);
      handleFetchInquiries();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteReplyError(msg ?? '返信の削除に失敗しました');
    } finally {
      setDeleteReplyLoading(false);
    }
  };

  const fmtBytes = (b: number) => {
    if (b >= 1024 * 1024 * 1024) return (b / (1024 ** 3)).toFixed(1) + ' GB';
    if (b >= 1024 * 1024) return (b / (1024 ** 2)).toFixed(0) + ' MB';
    return (b / 1024).toFixed(0) + ' KB';
  };

  const barColor = (pct: number) =>
    pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#a78bfa';

  const tabs: { key: AdminMode; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'adminReset',   label: 'パスワード', icon: <KeyIcon sx={{ fontSize: 15 }} /> },
    { key: 'adminStorage', label: '容量管理',   icon: <StorageIcon sx={{ fontSize: 15 }} /> },
    { key: 'adminUsers',   label: 'ユーザー',   icon: <PeopleIcon sx={{ fontSize: 15 }} /> },
    {
      key: 'adminBoard', label: '掲示板',
      icon: <CampaignIcon sx={{ fontSize: 15 }} />,
      // 未対応の問い合わせ件数をバッジ表示
      badge: inquiryList.filter((i) => i.status === 0).length || undefined,
    },
  ];

  const tabColor: Record<AdminMode, string> = {
    adminReset:   '#dc2626',
    adminStorage: '#0369a1',
    adminUsers:   '#7c3aed',
    adminBoard:   '#059669',
  };
  const tabGradient: Record<AdminMode, string> = {
    adminReset:   'linear-gradient(135deg, #dc2626, #f87171)',
    adminStorage: 'linear-gradient(135deg, #0369a1, #38bdf8)',
    adminUsers:   'linear-gradient(135deg, #7c3aed, #a78bfa)',
    adminBoard:   'linear-gradient(135deg, #059669, #34d399)',
  };

  const currentCardSx = (mode === 'adminUsers' || mode === 'adminBoard') ? adminCardSx : standardCardSx;

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
          {tabs.map(({ key, label, icon, badge }) => (
            <Button key={key} fullWidth onClick={() => switchMode(key)} startIcon={icon}
              sx={{
                py: 0.9, borderRadius: 1.5, fontWeight: 600, fontSize: '0.72rem',
                color: mode === key ? '#fff' : 'text.secondary',
                background: mode === key ? tabGradient[key] : 'transparent',
                boxShadow: mode === key ? `0 2px 12px ${alpha(tabColor[key], 0.4)}` : 'none',
                transition: 'all 0.25s ease',
                position: 'relative',
                '&:hover': { background: mode === key ? tabGradient[key] : alpha('#ffffff', 0.07) },
              }}>
              {label}
              {/* 未対応件数バッジ（掲示板タブに表示） */}
              {badge != null && badge > 0 && (
                <Box sx={{
                  position: 'absolute', top: 3, right: 3,
                  width: 15, height: 15, borderRadius: '50%',
                  background: '#f87171', fontSize: '0.58rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700,
                }}>
                  {badge}
                </Box>
              )}
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

        {/* ══ 掲示板管理 ══════════════════════════════════════════ */}
        {mode === 'adminBoard' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* シークレット入力 */}
            <TextField
              label="管理者シークレットキー" type={showAdminSecret ? 'text' : 'password'}
              value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} size="small" fullWidth autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start"><AdminPanelSettingsIcon sx={{ color: '#34d399', fontSize: 18 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowAdminSecret((s) => !s)} edge="end" size="small" sx={{ color: 'text.secondary' }}>{showAdminSecret ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              }}
            />

            {/* サブタブ：お知らせ投稿 / 問い合わせ一覧 */}
            <Box sx={{ display: 'flex', borderRadius: 2, background: alpha('#1e1b4b', 0.5), p: 0.5, gap: 0.5 }}>
              <Button fullWidth size="small" startIcon={<CampaignIcon sx={{ fontSize: 14 }} />}
                onClick={() => setBoardSubTab('noticePost')}
                sx={{
                  py: 0.7, borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem',
                  color: boardSubTab === 'noticePost' ? '#fff' : 'text.secondary',
                  background: boardSubTab === 'noticePost' ? 'linear-gradient(135deg, #059669, #34d399)' : 'transparent',
                  '&:hover': { background: boardSubTab === 'noticePost' ? 'linear-gradient(135deg, #059669, #34d399)' : alpha('#fff', 0.06) },
                }}>
                お知らせ投稿
              </Button>
              <Button fullWidth size="small" startIcon={<MailOutlineIcon sx={{ fontSize: 14 }} />}
                onClick={() => { setBoardSubTab('inquiryList'); handleFetchInquiries(); }}
                sx={{
                  py: 0.7, borderRadius: 1.5, fontWeight: 600, fontSize: '0.75rem',
                  color: boardSubTab === 'inquiryList' ? '#fff' : 'text.secondary',
                  background: boardSubTab === 'inquiryList' ? 'linear-gradient(135deg, #0369a1, #38bdf8)' : 'transparent',
                  position: 'relative',
                  '&:hover': { background: boardSubTab === 'inquiryList' ? 'linear-gradient(135deg, #0369a1, #38bdf8)' : alpha('#fff', 0.06) },
                }}>
                問い合わせ一覧
                {inquiryList.filter((i) => i.status === 0).length > 0 && (
                  <Box sx={{ ml: 0.5, px: 0.7, borderRadius: 1, background: '#f87171', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                    {inquiryList.filter((i) => i.status === 0).length}
                  </Box>
                )}
              </Button>
            </Box>

            {/* ── サブタブ①：お知らせ投稿 ─────────────────── */}
            {boardSubTab === 'noticePost' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 投稿フォーム */}
                <Box
                  component="form" onSubmit={handlePostNotice}
                  sx={{ p: 2, borderRadius: 2, background: alpha('#1e1b4b', 0.5), border: `1px solid ${alpha('#34d399', 0.2)}` }}
                >
                  <Typography variant="caption" fontWeight={700} color="#34d399" sx={{ display: 'block', mb: 1.5 }}>
                    {editingNotice ? '✏️ お知らせを編集' : '📢 全ユーザーへお知らせを投稿'}
                  </Typography>
                  {noticePostError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setNoticePostError(null)}>{noticePostError}</Alert>}
                  {noticePostSuccess && <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setNoticePostSuccess(false)}>{editingNotice ? '更新しました。' : '投稿しました。'}</Alert>}
                  <TextField
                    label="タイトル" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)}
                    fullWidth size="small" sx={{ mb: 1.5 }} inputProps={{ maxLength: 255 }}
                  />
                  <TextField
                    label="本文" value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)}
                    fullWidth multiline rows={4} sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    {editingNotice && (
                      <Button size="small" onClick={() => { setEditingNotice(null); setNoticeTitle(''); setNoticeBody(''); }}
                        sx={{ color: 'text.secondary' }}>キャンセル</Button>
                    )}
                    <Button type="submit" variant="contained" size="small"
                      disabled={noticePostLoading || !adminSecret || !noticeTitle.trim() || !noticeBody.trim()}
                      startIcon={noticePostLoading ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                      sx={{ background: 'linear-gradient(135deg, #059669, #34d399)', '&:hover': { background: 'linear-gradient(135deg, #047857, #059669)' }, '&:disabled': { opacity: 0.5 }, borderRadius: 2, fontWeight: 700 }}>
                      {editingNotice ? '更新する' : '全員に投稿'}
                    </Button>
                  </Box>
                </Box>

                {/* 投稿済み一覧 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight={700} color="#34d399">投稿済み一覧</Typography>
                  <Button size="small" startIcon={<RefreshIcon sx={{ fontSize: 14 }} />} onClick={handleFetchNotices}
                    disabled={noticeListLoading || !adminSecret}
                    sx={{ color: '#34d399', fontSize: '0.72rem', '&:disabled': { opacity: 0.4 } }}>
                    {noticeListLoading ? <CircularProgress size={12} color="inherit" /> : '取得'}
                  </Button>
                </Box>
                {noticeListError && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setNoticeListError(null)}>{noticeListError}</Alert>}
                {noticeList.length > 0 && (
                  <Box sx={{ borderRadius: 2, border: `1px solid ${alpha('#34d399', 0.2)}`, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: alpha('#1e1b4b', 0.6) }}>
                          <TableCell sx={{ color: '#34d399', fontWeight: 700, fontSize: '0.73rem', borderBottom: `1px solid ${alpha('#34d399', 0.2)}` }}>日時</TableCell>
                          <TableCell sx={{ color: '#34d399', fontWeight: 700, fontSize: '0.73rem', borderBottom: `1px solid ${alpha('#34d399', 0.2)}` }}>タイトル</TableCell>
                          <TableCell align="center" sx={{ color: '#34d399', fontWeight: 700, fontSize: '0.73rem', borderBottom: `1px solid ${alpha('#34d399', 0.2)}`, whiteSpace: 'nowrap' }}>操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {noticeList.map((n) => (
                          <TableRow key={n.noticeId} sx={{ '&:last-child td': { border: 0 }, '&:hover': { background: alpha('#34d399', 0.04) } }}>
                            <TableCell sx={{ borderBottom: `1px solid ${alpha('#34d399', 0.1)}`, fontSize: '0.7rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>{n.createdAt}</TableCell>
                            <TableCell sx={{ borderBottom: `1px solid ${alpha('#34d399', 0.1)}`, fontSize: '0.78rem' }}>{n.title}</TableCell>
                            <TableCell align="center" sx={{ borderBottom: `1px solid ${alpha('#34d399', 0.1)}` }}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title="編集">
                                  <IconButton size="small" onClick={() => handleEditNotice(n)}
                                    sx={{ color: alpha('#34d399', 0.7), '&:hover': { color: '#34d399', background: alpha('#34d399', 0.1) } }}>
                                    <EditIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="削除">
                                  <IconButton size="small" onClick={() => handleDeleteNotice(n.noticeId)}
                                    sx={{ color: alpha('#f87171', 0.6), '&:hover': { color: '#f87171', background: alpha('#f87171', 0.1) } }}>
                                    <DeleteForeverIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}

            {/* ── サブタブ②：問い合わせ一覧 ───────────────── */}
            {boardSubTab === 'inquiryList' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {inquiryListLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress sx={{ color: '#38bdf8' }} size={24} /></Box>}
                {inquiryListError && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setInquiryListError(null)}>{inquiryListError}</Alert>}
                {replySuccess && <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2 }} onClose={() => setReplySuccess(false)}>返信し、対応済みにしました。</Alert>}

                {!inquiryListLoading && inquiryList.length === 0 && (
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>問い合わせはありません</Typography>
                )}

                {/* 問い合わせ一覧 */}
                {inquiryList.map((inq) => (
                  <Box key={inq.inquiryId} sx={{ borderRadius: 2, border: `1px solid ${alpha('#38bdf8', 0.15)}`, overflow: 'hidden' }}>
                    {/* 行ヘッダー */}
                    <Box
                      onClick={() => setExpandedInquiryId(expandedInquiryId === inq.inquiryId ? null : inq.inquiryId)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1, p: 1.5, cursor: 'pointer',
                        background: alpha('#1e1b4b', 0.5),
                        '&:hover': { background: alpha('#1e1b4b', 0.8) }, transition: 'background 0.2s',
                      }}
                    >
                      {expandedInquiryId === inq.inquiryId
                        ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      }
                      {/* ユーザー名 */}
                      <Chip size="small" label={inq.username}
                        sx={{ height: 18, fontSize: '0.68rem', background: alpha('#7c3aed', 0.2), color: '#a78bfa', border: `1px solid ${alpha('#a78bfa', 0.3)}` }} />
                      {/* 件名 */}
                      <Typography variant="body2" fontWeight={600} sx={{ flex: 1, fontSize: '0.8rem' }}>{inq.subject}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', fontSize: '0.68rem' }}>{inq.createdAt}</Typography>
                      {/* ステータス */}
                      <Chip size="small"
                        icon={inq.status === 1
                          ? <CheckCircleOutlineIcon sx={{ fontSize: '12px !important', color: '#34d399 !important' }} />
                          : <HourglassEmptyIcon sx={{ fontSize: '12px !important', color: '#fbbf24 !important' }} />
                        }
                        label={inq.status === 1 ? '対応済み' : '未対応'}
                        sx={{
                          height: 18, fontSize: '0.68rem', fontWeight: 600,
                          background: inq.status === 1 ? alpha('#34d399', 0.12) : alpha('#fbbf24', 0.12),
                          color: inq.status === 1 ? '#34d399' : '#fbbf24',
                          border: `1px solid ${inq.status === 1 ? alpha('#34d399', 0.3) : alpha('#fbbf24', 0.3)}`,
                        }}
                      />
                    </Box>

                    {/* 展開：問い合わせ本文 + 既存の返信 */}
                    <Collapse in={expandedInquiryId === inq.inquiryId}>
                      <Box sx={{ p: 2, background: alpha('#0a0a1a', 0.3) }}>
                        {/* ユーザーの投稿 */}
                        <Box sx={{ p: 1.5, mb: 1.5, borderRadius: 2, background: alpha('#7c3aed', 0.1), border: `1px solid ${alpha('#a78bfa', 0.2)}` }}>
                          <Typography variant="caption" color="#a78bfa" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                            [{inq.username}] {inq.createdAt}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.82rem' }}>{inq.body}</Typography>
                        </Box>

                        {/* 既存の返信 */}
                        {inq.replies.map((r) => (
                          <Box key={r.replyId} sx={{ p: 1.5, mb: 1, borderRadius: 2, background: alpha('#0369a1', 0.1), border: `1px solid ${alpha('#38bdf8', 0.2)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <Typography variant="caption" color="#38bdf8" fontWeight={600}>[管理者] {r.createdAt}</Typography>
                              {r.targetType === 1 && (
                                <Chip label="全体投稿" size="small" sx={{ height: 14, fontSize: '0.58rem', background: alpha('#38bdf8', 0.12), color: '#38bdf8' }} />
                              )}
                              {/* 返信削除ボタン */}
                              <Tooltip title={r.targetType === 1 ? '返信とお知らせを削除・未対応に戻す' : '返信を削除・未対応に戻す'}>
                                <IconButton
                                  size="small"
                                  onClick={() => { setDeleteReplyId(r.replyId); setDeleteReplyError(null); }}
                                  sx={{ ml: 'auto', color: alpha('#f87171', 0.5), '&:hover': { color: '#f87171', background: alpha('#f87171', 0.1) } }}
                                >
                                  <DeleteForeverIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.82rem' }}>{r.body}</Typography>
                          </Box>
                        ))}

                        {/* 返信フォーム（未対応のみ表示） */}
                        {inq.status === 0 && (
                          <Box>
                            {replyTarget?.inquiryId === inq.inquiryId ? (
                              <Box component="form" onSubmit={handleReply}
                                sx={{ mt: 1.5, p: 2, borderRadius: 2, background: alpha('#1e1b4b', 0.6), border: `1px solid ${alpha('#38bdf8', 0.25)}` }}>
                                <Typography variant="caption" fontWeight={700} color="#38bdf8" sx={{ display: 'block', mb: 1.5 }}>返信を作成</Typography>
                                {replyError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }} onClose={() => setReplyError(null)}>{replyError}</Alert>}
                                <TextField label="返信内容" value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
                                  fullWidth multiline rows={3} size="small" sx={{ mb: 1.5 }} />
                                {/* 配信先ラジオボタン */}
                                <MuiFormControl sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>配信先を選択</Typography>
                                  <RadioGroup row value={replyTargetType} onChange={(e) => setReplyTargetType(Number(e.target.value) as 0 | 1)}>
                                    <FormControlLabel value={0} control={<Radio size="small" sx={{ color: '#a78bfa', '&.Mui-checked': { color: '#a78bfa' } }} />}
                                      label={<Typography variant="caption">{inq.username} にのみ返信（個別）</Typography>} />
                                    <FormControlLabel value={1} control={<Radio size="small" sx={{ color: '#38bdf8', '&.Mui-checked': { color: '#38bdf8' } }} />}
                                      label={<Typography variant="caption">全ユーザーへお知らせとして投稿</Typography>} />
                                  </RadioGroup>
                                </MuiFormControl>
                                {/* 全体投稿時のタイトル入力 */}
                                {replyTargetType === 1 && (
                                  <TextField label="お知らせタイトル" value={replyNoticeTitle} onChange={(e) => setReplyNoticeTitle(e.target.value)}
                                    fullWidth size="small" sx={{ mb: 1.5 }} inputProps={{ maxLength: 255 }} />
                                )}
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Button size="small" onClick={() => { setReplyTarget(null); setReplyBody(''); setReplyNoticeTitle(''); setReplyTargetType(0); }}
                                    sx={{ color: 'text.secondary' }}>キャンセル</Button>
                                  <Button type="submit" variant="contained" size="small"
                                    disabled={replyLoading || !replyBody.trim() || (replyTargetType === 1 && !replyNoticeTitle.trim())}
                                    startIcon={replyLoading ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
                                    sx={{ background: 'linear-gradient(135deg, #0369a1, #38bdf8)', borderRadius: 2, fontWeight: 700, fontSize: '0.78rem', '&:disabled': { opacity: 0.5 } }}>
                                    返信して対応済みにする
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button size="small" variant="outlined" startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
                                  onClick={() => { setReplyTarget(inq); setReplyBody(''); setReplyNoticeTitle(''); setReplyTargetType(0); setReplyError(null); }}
                                  sx={{ borderColor: alpha('#38bdf8', 0.4), color: '#38bdf8', fontSize: '0.75rem', '&:hover': { borderColor: '#38bdf8', background: alpha('#38bdf8', 0.08) } }}>
                                  返信する
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                ))}

                {/* 未対応件数フッター */}
                {inquiryList.length > 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
                    未対応: {inquiryList.filter((i) => i.status === 0).length} / {inquiryList.length} 件
                  </Typography>
                )}
              </Box>
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

      {/* ══ 返信削除確認ダイアログ ════════════════════════════════ */}
      <Dialog
        open={deleteReplyId != null}
        onClose={() => !deleteReplyLoading && setDeleteReplyId(null)}
        PaperProps={{ sx: { background: 'rgba(15, 12, 41, 0.95)', border: `1px solid ${alpha('#f87171', 0.3)}`, borderRadius: 3, backdropFilter: 'blur(20px)', minWidth: 340 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f87171', fontWeight: 700 }}>
          <WarningAmberIcon /> 返信を削除しますか？
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="caption">
              この返信を削除すると、問い合わせのステータスが「未対応」に戻ります。<br />
              全体お知らせとして投稿した返信の場合、お知らせ一覧からも削除されます。<br />
              この操作は取り消せません。
            </Typography>
          </Alert>
          {deleteReplyError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{deleteReplyError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteReplyId(null)}
            disabled={deleteReplyLoading}
            sx={{ color: 'text.secondary', '&:hover': { color: '#fff' } }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteReplyConfirm}
            disabled={deleteReplyLoading}
            startIcon={deleteReplyLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
            sx={{ background: 'linear-gradient(135deg, #dc2626, #f87171)', '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' }, '&:disabled': { opacity: 0.5 } }}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
