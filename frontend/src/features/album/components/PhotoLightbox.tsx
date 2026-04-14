import { useState, useEffect } from 'react';
import {
  Box, IconButton, Typography, Chip, Divider, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, CircularProgress, useTheme, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ImageIcon from '@mui/icons-material/Image';
import NotesIcon from '@mui/icons-material/Notes';
import type { Photo, Group } from '../types';
import { lightboxOverlaySx } from '../styles/albumSx';
import { formatDate } from '../../../shared/utils';
import { toChipStyle } from '../utils/mockData';
import { GlassCard } from '../../../shared/components/GlassCard';
import { HeicSafeImage } from '../../../shared/components/HeicSafeImage';
import { alpha } from '@mui/material/styles';

interface EditForm {
  description: string;
  location: string;
  takenAt: string;
  groupId: number | '';
}

interface Props {
  photos: Photo[];
  currentIndex: number;
  groups: Group[];
  onClose: () => void;
  onUpdate: (updated: Photo) => void;
  onDelete: (photoId: number) => void;
}

export const PhotoLightbox = ({ photos, currentIndex, groups, onClose, onUpdate, onDelete }: Props) => {
  const [idx, setIdx] = useState(currentIndex);
  const photo = photos[idx];
  const group = groups.find((g) => g.groupId === photo?.groupId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<EditForm>({
    description: photo?.description ?? '',
    location: photo?.location ?? '',
    takenAt: photo?.takenAt ? photo.takenAt.slice(0, 16) : '',
    groupId: photo?.groupId ?? '',
  });

  // idx が変わったら編集状態をリセット
  useEffect(() => {
    setIsEditing(false);
    setForm({
      description: photo?.description ?? '',
      location: photo?.location ?? '',
      takenAt: photo?.takenAt ? photo.takenAt.slice(0, 16) : '',
      groupId: photo?.groupId ?? '',
    });
  }, [idx]); // eslint-disable-line

  // キーボード操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(photos.length - 1, i + 1));
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photos.length, onClose]);

  if (!photo) return null;

  const startEdit = () => {
    setForm({
      description: photo.description ?? '',
      location: photo.location ?? '',
      takenAt: photo.takenAt ? photo.takenAt.slice(0, 16) : '',
      groupId: photo.groupId ?? '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onUpdate({
      ...photo,
      description: form.description || undefined,
      location: form.location || undefined,
      takenAt: form.takenAt ? `${form.takenAt}:00` : photo.takenAt,
      groupId: form.groupId !== '' ? form.groupId : undefined,
    });
    setIsEditing(false);
    setSaving(false);
  };

  const handleDelete = () => {
    onDelete(photo.photoId);
    setDeleteOpen(false);
    onClose();
  };

  return (
    <>
      <Box sx={lightboxOverlaySx} onClick={onClose}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 0, md: 2 },
            width: { xs: '100%', md: 'auto' },
            maxWidth: { xs: '100%', md: '90vw' },
            maxHeight: { xs: '100dvh', md: '90vh' },
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 画像エリア */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: { xs: 0, md: 3 },
              overflow: 'hidden',
              boxShadow: `0 24px 64px ${alpha('#000', 0.7)}`,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              minHeight: { xs: '40dvh', md: 'auto' },
            }}
          >
            <HeicSafeImage
              src={photo.filePath}
              alt={photo.description}
              sx={{
                maxHeight: { xs: '50dvh', md: '85vh' },
                maxWidth: { xs: '100vw', md: '60vw' },
                objectFit: 'contain',
                display: 'block',
              }}
            />

            {/* 閉じるボタン */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: alpha('#000', 0.5),
                color: 'white',
                '&:hover': { background: alpha('#7c3aed', 0.7) },
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* 前へボタン */}
            {idx > 0 && (
              <IconButton
                onClick={() => setIdx((i) => i - 1)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: alpha('#000', 0.5),
                  color: 'white',
                  '&:hover': { background: alpha('#7c3aed', 0.7) },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            )}

            {/* 次へボタン */}
            {idx < photos.length - 1 && (
              <IconButton
                onClick={() => setIdx((i) => i + 1)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: alpha('#000', 0.5),
                  color: 'white',
                  '&:hover': { background: alpha('#7c3aed', 0.7) },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            )}

            {/* 枚数インジケーター */}
            {photos.length > 1 && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: alpha('#000', 0.55),
                  color: 'white',
                  px: 1.5,
                  py: 0.3,
                  borderRadius: 10,
                  pointerEvents: 'none',
                }}
              >
                {idx + 1} / {photos.length}
              </Typography>
            )}
          </Box>

          {/* 詳細パネル */}
          <GlassCard
            sx={{
              width: { xs: '100%', md: 300 },
              maxHeight: { xs: '50dvh', md: 'none' },
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              flexShrink: 0,
              borderRadius: { xs: '0 0 0 0', md: 4 },
            }}
          >
            {/* パネルヘッダー */}
            <Box
              sx={{
                p: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${alpha('#a78bfa', 0.12)}`,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                {isEditing ? '写真を編集' : '写真の詳細'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!isEditing ? (
                  <>
                    <Tooltip title="編集">
                      <IconButton
                        size="small"
                        onClick={startEdit}
                        sx={{ color: '#a78bfa', '&:hover': { background: alpha('#7c3aed', 0.15) } }}
                      >
                        <EditIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteOpen(true)}
                        sx={{ color: '#f87171', '&:hover': { background: alpha('#ef4444', 0.15) } }}
                      >
                        <DeleteIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                    {/* スマホ：閉じるボタンをパネルヘッダーにも配置 */}
                    {isMobile && (
                      <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{ color: 'text.secondary', ml: 0.5 }}
                      >
                        <CloseIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    )}
                  </>
                ) : (
                  <>
                    <Tooltip title="保存">
                      <IconButton
                        size="small"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ color: '#34d399', '&:hover': { background: alpha('#10b981', 0.15) } }}
                      >
                        {saving ? <CircularProgress size={15} color="inherit" /> : <CheckIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="キャンセル">
                      <IconButton size="small" onClick={cancelEdit} sx={{ color: 'text.secondary' }}>
                        <CloseIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>

            {/* パネルボディ */}
            <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isEditing ? (
                /* ── 編集フォーム ── */
                <>
                  <TextField
                    label="説明"
                    multiline
                    rows={3}
                    size="small"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="撮影場所"
                    size="small"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="例：東京タワー"
                    fullWidth
                    InputProps={{
                      startAdornment: <LocationOnIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />,
                    }}
                  />
                  <TextField
                    label="撮影日時"
                    type="datetime-local"
                    size="small"
                    value={form.takenAt}
                    onChange={(e) => setForm((f) => ({ ...f, takenAt: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>グループ</InputLabel>
                    <Select
                      label="グループ"
                      value={form.groupId}
                      onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value as number | '' }))}
                    >
                      <MenuItem value="">なし</MenuItem>
                      {groups.map((g) => (
                        <MenuItem key={g.groupId} value={g.groupId}>{g.groupName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ opacity: 0.2 }} />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      onClick={handleSave}
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                        boxShadow: `0 4px 16px ${alpha('#7c3aed', 0.4)}`,
                      }}
                    >
                      保存
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={cancelEdit}
                      sx={{ borderColor: alpha('#a78bfa', 0.3), color: 'text.secondary', minWidth: 64 }}
                    >
                      戻る
                    </Button>
                  </Box>
                </>
              ) : (
                /* ── 詳細表示 ── */
                <>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <NotesIcon sx={{ fontSize: 18, color: '#fbbf24', flexShrink: 0, mt: 0.3 }} />
                    <Typography variant="h6" fontWeight={700} color={photo.description ? 'text.primary' : 'text.disabled'} sx={{ lineHeight: 1.4 }}>
                      {photo.description ?? '未設定'}
                    </Typography>
                  </Box>

                  <Divider sx={{ opacity: 0.3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: '#a78bfa', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(photo.takenAt ?? photo.createdAt, 'YYYY年MM月DD日 HH:mm')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon sx={{ fontSize: 16, color: '#f472b6', flexShrink: 0 }} />
                      <Typography variant="body2" color={photo.location ? 'text.secondary' : 'text.disabled'}>
                        {photo.location ?? '未設定'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderSpecialIcon sx={{ fontSize: 16, color: '#34d399', flexShrink: 0 }} />
                      <Typography variant="body2" color={group ? 'text.secondary' : 'text.disabled'}>
                        {group ? group.groupName : '未設定'}
                      </Typography>
                    </Box>
                  </Box>

                  {photo.tags && photo.tags.length > 0 && (
                    <>
                      <Divider sx={{ opacity: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          タグ
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {photo.tags.map((tag) => {
                            const style = toChipStyle(tag.tagName);
                            return (
                              <Chip
                                key={tag.tagId}
                                label={tag.tagName}
                                size="small"
                                sx={{
                                  background: style.bg,
                                  color: style.color,
                                  border: `1px solid ${alpha(style.color, 0.3)}`,
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </>
                  )}

                  {photo.fileName && (
                    <>
                      <Divider sx={{ opacity: 0.3 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ImageIcon sx={{ fontSize: 16, color: '#60a5fa', flexShrink: 0 }} />
                        <Typography variant="caption" color="text.disabled">
                          {photo.fileName}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {/* 下部アクションボタン */}
                  <Box sx={{ mt: 'auto', pt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={startEdit}
                      sx={{
                        borderColor: alpha('#a78bfa', 0.4),
                        color: '#c4b5fd',
                        '&:hover': { borderColor: '#a78bfa', background: alpha('#7c3aed', 0.1) },
                      }}
                    >
                      編集
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteOpen(true)}
                      sx={{
                        borderColor: alpha('#f87171', 0.4),
                        color: '#f87171',
                        '&:hover': { borderColor: '#f87171', background: alpha('#ef4444', 0.1) },
                      }}
                    >
                      削除
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </GlassCard>
        </Box>
      </Box>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            background: 'rgba(20,15,50,0.97)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${alpha('#f87171', 0.3)}`,
            borderRadius: 3,
            minWidth: { xs: 'calc(100vw - 48px)', sm: 340 },
            mx: { xs: 3, sm: 'auto' },
          },
        }}
      >
        <DialogTitle sx={{ color: '#f87171', pb: 1 }}>この写真を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2">
            「{photo.description ?? photo.fileName ?? '無題'}」を削除します。
            この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: 'text.secondary' }}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
            sx={{
              background: 'linear-gradient(135deg, #dc2626, #f87171)',
              boxShadow: `0 4px 16px ${alpha('#dc2626', 0.4)}`,
            }}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
