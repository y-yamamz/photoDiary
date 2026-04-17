import { useRef, useState } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, LinearProgress, Alert, Chip,
  IconButton, Tooltip, CircularProgress, Checkbox, FormControlLabel,
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
import { StorageBar } from '../../../shared/components/StorageBar';
import { formatFileSize } from '../utils/fileUtils';
import { alpha } from '@mui/material/styles';

export const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { form, state, groups, storage, setFiles, removeFile, updateField, submit, reset } = usePhotoUpload();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) setFiles(selected);
    // 同じファイルを再選択できるようリセット
    e.target.value = '';
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
            {/* ストレージ使用量 */}
            {storage && (
              <Box sx={{ mb: 2.5 }}>
                <StorageBar storage={storage} />
              </Box>
            )}

            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
              ファイルを選択（複数可）
            </Typography>

            {/* ドロップゾーン */}
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
                JPEG / PNG / WebP / HEIC（最大 20MB / 枚）・複数選択可
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* 選択済みファイル一覧 */}
            {form.files.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  選択中: {form.files.length} 枚
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: 1,
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {state.previews.map((src, i) => (
                    <Box key={i} sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', aspectRatio: '1' }}>
                      <Box
                        component="img"
                        src={src}
                        alt={form.files[i]?.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 20,
                            height: 20,
                            background: alpha('#000', 0.7),
                            color: '#f87171',
                            '&:hover': { background: alpha('#dc2626', 0.8) },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Tooltip>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                          px: 0.5,
                          pb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: '#e2e8f0', fontSize: 9, lineHeight: 1.2, display: 'block', wordBreak: 'break-all' }}
                        >
                          {formatFileSize(form.files[i]?.size ?? 0)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* ファイル名チップ一覧 */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                  {form.files.map((f, i) => (
                    <Chip
                      key={i}
                      label={f.name}
                      size="small"
                      icon={<ImageIcon />}
                      onDelete={() => removeFile(i)}
                      sx={{ background: alpha('#1e1b4b', 0.8), color: '#c4b5fd', maxWidth: 180 }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* フォーマット変換中プログレスバー */}
            {state.converting && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="#c4b5fd">
                    {form.outputFormat.toUpperCase()} に変換中... ({state.convertDone}/{state.convertTotal}枚)
                  </Typography>
                  <Typography variant="caption" color="#a78bfa">{state.convertProgress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={state.convertProgress} sx={progressBarSx} />
              </Box>
            )}

            {/* プログレスバー */}
            {state.uploading && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">アップロード中... ({form.files.length} 枚)</Typography>
                  <Typography variant="caption" color="#a78bfa">{state.progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={state.progress} sx={progressBarSx} />
              </Box>
            )}

            {state.error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2, whiteSpace: 'pre-line' }}>{state.error}</Alert>
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

          {/* 右：メタ情報（一括適用） */}
          <GlassCard sx={{ flex: '1 1 320px', p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              写真情報
            </Typography>
            {form.files.length > 1 && (
              <Typography variant="caption" color="#a78bfa" sx={{ display: 'block', mb: 2 }}>
                選択した {form.files.length} 枚すべてに適用されます
              </Typography>
            )}
            {form.files.length <= 1 && <Box sx={{ mb: 2 }} />}

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

              {form.files.length > 1 && (
                <FormControlLabel
                  sx={{ ml: 0, mt: -1 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.overrideTakenAt}
                      onChange={(e) => updateField('overrideTakenAt', e.target.checked)}
                      sx={{ color: alpha('#a78bfa', 0.5), '&.Mui-checked': { color: '#a78bfa' } }}
                    />
                  }
                  label={
                    <Typography variant="caption" color={form.overrideTakenAt ? '#c4b5fd' : 'text.disabled'}>
                      日付を一括指定する（チェックOFFは各写真のEXIF日付を使用）
                    </Typography>
                  }
                />
              )}

              <TextField
                label="撮影日時"
                type="datetime-local"
                size="small"
                value={form.takenAt}
                onChange={(e) => updateField('takenAt', e.target.value)}
                disabled={form.files.length > 1 && !form.overrideTakenAt}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText={
                  form.files.length > 1 && !form.overrideTakenAt
                    ? '各写真のEXIF日付を個別に使用します'
                    : undefined
                }
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

              {/* 保存フォーマット選択（バックエンド変換） */}
              <FormControl fullWidth size="small">
                <InputLabel>保存フォーマット</InputLabel>
                <Select
                  label="保存フォーマット"
                  value={form.outputFormat}
                  onChange={(e) => updateField('outputFormat', e.target.value as 'jpeg' | 'webp')}
                  startAdornment={<ImageIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />}
                >
                  <MenuItem value="jpeg">JPEG（標準・推奨）</MenuItem>
                  <MenuItem value="webp">WebP（高圧縮）</MenuItem>
                </Select>
              </FormControl>


              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={submit}
                  disabled={form.files.length === 0 || state.uploading || state.converting}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    boxShadow: `0 4px 24px ${alpha('#7c3aed', 0.4)}`,
                    '&:hover': { boxShadow: `0 6px 32px ${alpha('#7c3aed', 0.6)}` },
                  }}
                  startIcon={state.uploading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                >
                  {state.uploading
                    ? 'アップロード中...'
                    : form.files.length > 1
                      ? `${form.files.length} 枚を一括登録`
                      : '登録する'}
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
