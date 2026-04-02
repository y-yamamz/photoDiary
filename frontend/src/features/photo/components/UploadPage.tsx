import { useRef, useState } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, LinearProgress, Alert, Chip,
  IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import ImageIcon from '@mui/icons-material/Image';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { uploadPageSx, dropzoneSx, progressBarSx } from '../styles/uploadSx';
import { GlassCard } from '../../../shared/components/GlassCard';
import { GradientText } from '../../../shared/components/GradientText';
import { formatFileSize } from '../utils/fileUtils';
import { alpha } from '@mui/material/styles';

export const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { form, state, groups, setFile, updateField, submit, reset } = usePhotoUpload();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  };

  return (
    <Box sx={uploadPageSx}>
      <Box sx={{ width: '100%', maxWidth: 900, mt: 2 }}>
        {/* 戻るボタン */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate('/album')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <GradientText variant="h5" fontWeight={700}>
            写真アップロード
          </GradientText>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* 左：ファイル選択 */}
          <GlassCard sx={{ flex: '1 1 320px', p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
              ファイルを選択
            </Typography>

            {/* ドロップゾーン */}
            {!state.preview ? (
              <Box
                sx={dropzoneSx(isDragging)}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: alpha('#a78bfa', 0.6), mb: 1 }} />
                <Typography variant="body1" fontWeight={600} color="text.secondary">
                  クリックまたはドラッグ＆ドロップ
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                  JPEG / PNG / WebP / HEIC（最大 20MB）
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ImageIcon />}
                  sx={{ mt: 2, borderColor: alpha('#a78bfa', 0.4), color: '#c4b5fd' }}
                >
                  ファイルを参照
                </Button>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={state.preview}
                  alt="preview"
                  sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block', borderRadius: 2 }}
                />
                <Tooltip title="削除">
                  <IconButton
                    size="small"
                    onClick={() => setFile(null)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: alpha('#000', 0.6),
                      color: '#f87171',
                      '&:hover': { background: alpha('#dc2626', 0.7) },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {form.file && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      p: 1.5,
                    }}
                  >
                    <Chip
                      label={form.file.name}
                      size="small"
                      icon={<ImageIcon />}
                      sx={{ background: alpha('#1e1b4b', 0.8), color: '#c4b5fd', maxWidth: '100%' }}
                    />
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                      {formatFileSize(form.file.size)}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            {/* プログレスバー */}
            {state.uploading && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">アップロード中...</Typography>
                  <Typography variant="caption" color="#a78bfa">{state.progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={state.progress} sx={progressBarSx} />
              </Box>
            )}

            {state.error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{state.error}</Alert>
            )}
            {state.success && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ mt: 2, borderRadius: 2, background: alpha('#10b981', 0.15) }}
              >
                アップロード完了！
              </Alert>
            )}
          </GlassCard>

          {/* 右：メタ情報 */}
          <GlassCard sx={{ flex: '1 1 320px', p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
              写真情報
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>グループ</InputLabel>
                <Select
                  label="グループ"
                  value={form.groupId}
                  onChange={(e) => updateField('groupId', e.target.value as number | '')}
                >
                  <MenuItem value="">なし</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.groupId} value={g.groupId}>{g.groupName}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="撮影日時"
                type="datetime-local"
                size="small"
                value={form.takenAt}
                onChange={(e) => updateField('takenAt', e.target.value)}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="撮影場所"
                size="small"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="例：東京タワー"
                InputProps={{
                  startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                }}
                fullWidth
              />

              <TextField
                label="説明"
                multiline
                rows={4}
                size="small"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="写真についての説明を入力..."
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={submit}
                  disabled={!form.file || state.uploading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    boxShadow: `0 4px 24px ${alpha('#7c3aed', 0.4)}`,
                    '&:hover': { boxShadow: `0 6px 32px ${alpha('#7c3aed', 0.6)}` },
                  }}
                  startIcon={state.uploading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                >
                  {state.uploading ? 'アップロード中...' : '登録する'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={reset}
                  sx={{ borderColor: alpha('#a78bfa', 0.3), color: 'text.secondary', minWidth: 80 }}
                >
                  リセット
                </Button>
              </Box>
            </Box>
          </GlassCard>
        </Box>
      </Box>
    </Box>
  );
};
