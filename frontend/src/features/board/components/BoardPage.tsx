import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Alert, CircularProgress,
  Chip, Divider, Collapse, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ReplyIcon from '@mui/icons-material/Reply';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { alpha } from '@mui/material/styles';
import { boardApi } from '../api/boardApi';
import { GradientText } from '../../../shared/components/GradientText';
import { loginContainerSx, orbitSx } from '../../auth/styles/loginSx';
import type { Notice, Inquiry } from '../types';

// ─── スタイル定数 ─────────────────────────────────────────

/** ページカードのスタイル */
const cardSx = {
  width: '100%',
  maxWidth: { xs: '95vw', sm: 660 },
  mx: { xs: 1, sm: 0 },
  p: { xs: 2.5, sm: 4 },
  borderRadius: 4,
  background: 'rgba(30, 27, 75, 0.55)',
  backdropFilter: 'blur(32px)',
  border: `1px solid ${alpha('#a78bfa', 0.2)}`,
  boxShadow: `0 0 60px ${alpha('#7c3aed', 0.15)}, 0 24px 48px rgba(0,0,0,0.5)`,
};

/** タブのグラデーション定義 */
const TAB_GRADIENT = {
  notices:  'linear-gradient(135deg, #0369a1, #38bdf8)',
  inquiries: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
} as const;

type Tab = 'notices' | 'inquiries';

/**
 * ユーザー向け掲示板ページ（/board）。
 *
 * 2タブ構成：
 *   📢 お知らせ：管理者からの全体配信メッセージ一覧（既読/未読表示）
 *   ✉️ 管理者へ連絡：問い合わせ送信フォーム + 過去の問い合わせスレッド
 */
export const BoardPage = () => {
  const navigate = useNavigate();

  // ─── タブ制御 ─────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('notices');

  // ─── お知らせ ─────────────────────────────────────────
  const [notices, setNotices]           = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticesError, setNoticesError]   = useState<string | null>(null);

  // ─── 問い合わせ一覧 ────────────────────────────────────
  const [inquiries, setInquiries]           = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiriesError, setInquiriesError]   = useState<string | null>(null);
  /** 展開中の問い合わせID（クリックでスレッドを開閉） */
  const [expandedInquiry, setExpandedInquiry] = useState<number | null>(null);

  // ─── 問い合わせ送信フォーム ────────────────────────────
  const [subject, setSubject]     = useState('');
  const [body, setBody]           = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ─── 問い合わせ削除 ────────────────────────────────────
  /** 削除確認ダイアログの対象（nullで非表示） */
  const [deleteTarget, setDeleteTarget]   = useState<Inquiry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // ─── お知らせ取得 ─────────────────────────────────────

  /** お知らせ一覧を取得する（タブ切り替え時 or 初回表示時に呼び出す） */
  const loadNotices = useCallback(async () => {
    setNoticesLoading(true);
    setNoticesError(null);
    try {
      const data = await boardApi.getNotices();
      setNotices(data);
    } catch {
      setNoticesError('お知らせの取得に失敗しました');
    } finally {
      setNoticesLoading(false);
    }
  }, []);

  // ─── 問い合わせ一覧取得 ────────────────────────────────

  /** 問い合わせ一覧を取得する */
  const loadInquiries = useCallback(async () => {
    setInquiriesLoading(true);
    setInquiriesError(null);
    try {
      const data = await boardApi.getMyInquiries();
      setInquiries(data);
    } catch {
      setInquiriesError('問い合わせ一覧の取得に失敗しました');
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

  /** タブが切り替わった際に対応するデータを取得する */
  useEffect(() => {
    if (activeTab === 'notices') {
      loadNotices();
    } else {
      loadInquiries();
    }
  }, [activeTab, loadNotices, loadInquiries]);

  // ─── 問い合わせ送信 ────────────────────────────────────

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await boardApi.submitInquiry({ subject: subject.trim(), body: body.trim() });
      setSubmitSuccess(true);
      setSubject('');
      setBody('');
      // 送信後に一覧を再取得して最新状態に更新
      loadInquiries();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? '送信に失敗しました');
    } finally {
      setSubmitLoading(false);
    }
  };

  /** 問い合わせ削除確定（確認ダイアログ「削除する」押下時） */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await boardApi.deleteInquiry(deleteTarget.inquiryId);
      // 削除成功：一覧から除去してダイアログを閉じる
      setInquiries((prev) => prev.filter((i) => i.inquiryId !== deleteTarget.inquiryId));
      if (expandedInquiry === deleteTarget.inquiryId) setExpandedInquiry(null);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(msg ?? '削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── 未読件数（タブバッジ用） ─────────────────────────
  const unreadCount = notices.filter((n) => n.unread).length;

  // ─── レンダリング ─────────────────────────────────────

  return (
    <Box sx={loginContainerSx}>
      {/* 背景オービット */}
      <Box sx={orbitSx(600, '#7c3aed', '-10%', '-15%')} />
      <Box sx={orbitSx(500, '#0369a1', '60%', '70%')} />
      <Box sx={orbitSx(400, '#a78bfa', '30%', '80%')} />

      {/* 背景パーティクル */}
      {[...Array(6)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute', width: 4, height: 4, borderRadius: '50%',
          background: i % 2 === 0 ? '#a78bfa' : '#38bdf8',
          top: `${15 + i * 14}%`, left: `${10 + i * 13}%`, opacity: 0.6,
          animation: `float${i} ${3 + i}s ease-in-out infinite`,
          [`@keyframes float${i}`]: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: `translateY(${i % 2 === 0 ? '-' : ''}12px)` },
          },
        }} />
      ))}

      <Box sx={cardSx}>
        {/* ─── ヘッダー ──────────────────────────────────── */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '18px',
            background: 'linear-gradient(135deg, #0369a1, #7c3aed)',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)', mb: 1.5,
          }}>
            <CampaignIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <GradientText variant="h4" fontWeight={800} gutterBottom>掲示板</GradientText>
          <Typography variant="body2" color="text.secondary">お知らせ・管理者への連絡</Typography>
        </Box>

        {/* ─── タブ切り替え ──────────────────────────────── */}
        <Box sx={{
          display: 'flex', mb: 3, borderRadius: 2,
          background: alpha('#1e1b4b', 0.6), p: 0.5, gap: 0.5,
        }}>
          {/* お知らせタブ */}
          <Button
            fullWidth
            startIcon={<CampaignIcon sx={{ fontSize: 15 }} />}
            onClick={() => setActiveTab('notices')}
            sx={{
              py: 0.9, borderRadius: 1.5, fontWeight: 600, fontSize: '0.78rem',
              color: activeTab === 'notices' ? '#fff' : 'text.secondary',
              background: activeTab === 'notices' ? TAB_GRADIENT.notices : 'transparent',
              boxShadow: activeTab === 'notices' ? `0 2px 12px ${alpha('#0369a1', 0.4)}` : 'none',
              transition: 'all 0.25s ease',
              '&:hover': { background: activeTab === 'notices' ? TAB_GRADIENT.notices : alpha('#ffffff', 0.07) },
              position: 'relative',
            }}
          >
            お知らせ
            {/* 未読バッジ（お知らせタブ非表示中のみ表示） */}
            {activeTab !== 'notices' && unreadCount > 0 && (
              <Box sx={{
                position: 'absolute', top: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#f87171', fontSize: '0.6rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700,
              }}>
                {unreadCount}
              </Box>
            )}
          </Button>

          {/* 管理者へ連絡タブ */}
          <Button
            fullWidth
            startIcon={<MailOutlineIcon sx={{ fontSize: 15 }} />}
            onClick={() => setActiveTab('inquiries')}
            sx={{
              py: 0.9, borderRadius: 1.5, fontWeight: 600, fontSize: '0.78rem',
              color: activeTab === 'inquiries' ? '#fff' : 'text.secondary',
              background: activeTab === 'inquiries' ? TAB_GRADIENT.inquiries : 'transparent',
              boxShadow: activeTab === 'inquiries' ? `0 2px 12px ${alpha('#7c3aed', 0.4)}` : 'none',
              transition: 'all 0.25s ease',
              '&:hover': { background: activeTab === 'inquiries' ? TAB_GRADIENT.inquiries : alpha('#ffffff', 0.07) },
            }}
          >
            管理者へ連絡
          </Button>
        </Box>

        {/* ─── お知らせタブ ──────────────────────────────── */}
        {activeTab === 'notices' && (
          <Box>
            {noticesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#38bdf8' }} size={28} />
              </Box>
            )}
            {noticesError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{noticesError}</Alert>
            )}
            {!noticesLoading && !noticesError && notices.length === 0 && (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
                お知らせはありません
              </Typography>
            )}
            {/* お知らせ一覧 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {notices.map((notice) => (
                <Box
                  key={notice.noticeId}
                  sx={{
                    p: 2, borderRadius: 2,
                    background: notice.unread
                      ? alpha('#0369a1', 0.15)     // 未読：青みがかった背景
                      : alpha('#1e1b4b', 0.4),    // 既読：暗めの背景
                    border: `1px solid ${notice.unread ? alpha('#38bdf8', 0.35) : alpha('#a78bfa', 0.12)}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    {/* 未読ドット */}
                    {notice.unread && (
                      <FiberManualRecordIcon sx={{ fontSize: 10, color: '#38bdf8', flexShrink: 0 }} />
                    )}
                    {/* タイトル */}
                    <Typography
                      variant="subtitle2"
                      fontWeight={notice.unread ? 700 : 500}
                      color={notice.unread ? '#e0f2fe' : 'text.primary'}
                      sx={{ flex: 1 }}
                    >
                      {notice.title}
                    </Typography>
                    {/* 返信ありバッジ（個人宛通知） */}
                    {notice.personal && (
                      <Chip
                        icon={<ReplyIcon sx={{ fontSize: '12px !important', color: '#a78bfa !important' }} />}
                        label="返信あり"
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.65rem', fontWeight: 700,
                          background: alpha('#7c3aed', 0.2),
                          color: '#a78bfa',
                          border: `1px solid ${alpha('#a78bfa', 0.4)}`,
                        }}
                      />
                    )}
                    {/* 未読バッジ */}
                    {notice.unread && (
                      <Chip
                        label="NEW"
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.65rem', fontWeight: 700,
                          background: alpha('#38bdf8', 0.2),
                          color: '#38bdf8',
                          border: `1px solid ${alpha('#38bdf8', 0.4)}`,
                        }}
                      />
                    )}
                  </Box>
                  {/* 本文 */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 1 }}
                  >
                    {notice.body}
                  </Typography>
                  {/* 日時 */}
                  <Typography variant="caption" color="text.disabled">
                    {notice.createdAt}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ─── 管理者へ連絡タブ ──────────────────────────── */}
        {activeTab === 'inquiries' && (
          <Box>
            {/* 新規問い合わせフォーム */}
            <Box
              component="form"
              onSubmit={handleSubmitInquiry}
              sx={{
                mb: 3, p: 2.5, borderRadius: 2,
                background: alpha('#1e1b4b', 0.5),
                border: `1px solid ${alpha('#a78bfa', 0.2)}`,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="#a78bfa" sx={{ mb: 2 }}>
                新規問い合わせ
              </Typography>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              )}
              {submitSuccess && (
                <Alert
                  severity="success"
                  icon={<CheckCircleOutlineIcon />}
                  sx={{ mb: 2, borderRadius: 2 }}
                  onClose={() => setSubmitSuccess(false)}
                >
                  送信しました。管理者からの返信をお待ちください。
                </Alert>
              )}
              <TextField
                label="件名"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1.5 }}
                inputProps={{ maxLength: 255 }}
              />
              <TextField
                label="内容"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                fullWidth
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitLoading || !subject.trim() || !body.trim()}
                  startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  sx={{
                    background: TAB_GRADIENT.inquiries,
                    boxShadow: `0 4px 16px ${alpha('#7c3aed', 0.4)}`,
                    borderRadius: 2, fontWeight: 700,
                    '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #7c3aed)' },
                    '&:disabled': { opacity: 0.5 },
                  }}
                >
                  送信する
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2, opacity: 0.3 }}>
              <Typography variant="caption" color="text.disabled">過去の問い合わせ</Typography>
            </Divider>

            {/* 問い合わせ一覧 */}
            {inquiriesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#a78bfa' }} size={28} />
              </Box>
            )}
            {inquiriesError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{inquiriesError}</Alert>
            )}
            {!inquiriesLoading && !inquiriesError && inquiries.length === 0 && (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                問い合わせ履歴はありません
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {inquiries.map((inq) => (
                <Box
                  key={inq.inquiryId}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha('#a78bfa', 0.18)}`,
                    overflow: 'hidden',
                  }}
                >
                  {/* 問い合わせヘッダー行（クリックで展開/折りたたみ） */}
                  <Box
                    onClick={() => setExpandedInquiry(
                      expandedInquiry === inq.inquiryId ? null : inq.inquiryId
                    )}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5, cursor: 'pointer',
                      background: alpha('#1e1b4b', 0.5),
                      '&:hover': { background: alpha('#1e1b4b', 0.8) },
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* 展開アイコン */}
                    {expandedInquiry === inq.inquiryId
                      ? <ExpandLessIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      : <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    }
                    {/* 件名 */}
                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                      {inq.subject}
                    </Typography>
                    {/* 日時 */}
                    <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                      {inq.createdAt}
                    </Typography>
                    {/* ステータスチップ */}
                    <Chip
                      size="small"
                      icon={
                        inq.status === 1
                          ? <CheckCircleOutlineIcon sx={{ fontSize: '14px !important', color: '#34d399 !important' }} />
                          : <HourglassEmptyIcon sx={{ fontSize: '14px !important', color: '#fbbf24 !important' }} />
                      }
                      label={inq.status === 1 ? '対応済み' : '返信待ち'}
                      sx={{
                        height: 20, fontSize: '0.7rem', fontWeight: 600,
                        background: inq.status === 1 ? alpha('#34d399', 0.15) : alpha('#fbbf24', 0.15),
                        color: inq.status === 1 ? '#34d399' : '#fbbf24',
                        border: `1px solid ${inq.status === 1 ? alpha('#34d399', 0.35) : alpha('#fbbf24', 0.35)}`,
                      }}
                    />
                    {/* 削除ボタン（クリックでダイアログを開く。行の展開は行わない） */}
                    <Tooltip title="問い合わせを削除">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(inq); setDeleteError(null); }}
                        sx={{ color: alpha('#f87171', 0.5), '&:hover': { color: '#f87171', background: alpha('#f87171', 0.1) } }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* 展開時：問い合わせ詳細 + 返信スレッド */}
                  <Collapse in={expandedInquiry === inq.inquiryId}>
                    <Box sx={{ p: 2, background: alpha('#0a0a1a', 0.3) }}>
                      {/* 自分の投稿 */}
                      <Box sx={{
                        p: 1.5, mb: 1.5, borderRadius: 2,
                        background: alpha('#7c3aed', 0.12),
                        border: `1px solid ${alpha('#a78bfa', 0.2)}`,
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                          <PersonOutlineIcon sx={{ fontSize: 14, color: '#a78bfa' }} />
                          <Typography variant="caption" color="#a78bfa" fontWeight={600}>あなた</Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                            {inq.createdAt}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                          {inq.body}
                        </Typography>
                      </Box>

                      {/* 管理者からの返信 */}
                      {inq.replies.map((reply) => (
                        <Box
                          key={reply.replyId}
                          sx={{
                            p: 1.5, mb: 1, borderRadius: 2,
                            background: alpha('#0369a1', 0.12),
                            border: `1px solid ${alpha('#38bdf8', 0.2)}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                            <AdminPanelSettingsIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                            <Typography variant="caption" color="#38bdf8" fontWeight={600}>管理者</Typography>
                            {/* 全体お知らせとして投稿された場合はバッジを表示 */}
                            {reply.targetType === 1 && (
                              <Tooltip title="全体お知らせとして投稿されました">
                                <Chip
                                  label="全体投稿"
                                  size="small"
                                  sx={{
                                    height: 16, fontSize: '0.6rem',
                                    background: alpha('#38bdf8', 0.15),
                                    color: '#38bdf8',
                                  }}
                                />
                              </Tooltip>
                            )}
                            <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                              {reply.createdAt}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {reply.body}
                          </Typography>
                        </Box>
                      ))}

                      {/* 返信がない場合 */}
                      {inq.replies.length === 0 && (
                        <Typography variant="caption" color="text.disabled">
                          管理者からの返信をお待ちください...
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ─── 戻るリンク ────────────────────────────────── */}
        <Divider sx={{ my: 3, opacity: 0.3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              '&:hover': { color: '#a78bfa' }, transition: 'color 0.2s',
            }}
            onClick={() => navigate('/album')}
          >
            <ArrowBackIcon sx={{ fontSize: 13 }} />アルバムに戻る
          </Typography>
        </Box>
      </Box>

      {/* ─── 問い合わせ削除確認ダイアログ ──────────────── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        PaperProps={{
          sx: {
            background: 'rgba(15, 12, 41, 0.97)',
            border: `1px solid ${alpha('#f87171', 0.3)}`,
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f87171', fontWeight: 700 }}>
          <WarningAmberIcon />問い合わせを削除しますか？
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
              「{deleteTarget?.subject}」
            </Typography>
            <Typography variant="caption">
              この問い合わせと管理者からの返信がすべて削除されます。<br />
              この操作は取り消せません。
            </Typography>
          </Alert>
          {deleteError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{deleteError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
            sx={{ color: 'text.secondary', '&:hover': { color: '#fff' } }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{
              background: 'linear-gradient(135deg, #dc2626, #f87171)',
              '&:hover': { background: 'linear-gradient(135deg, #b91c1c, #dc2626)' },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
