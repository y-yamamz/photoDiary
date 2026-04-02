import {
  Box, Typography, TextField, Button, IconButton,
  Tooltip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { groupPageSx, groupRowSx, groupIconColors } from '../styles/groupSx';
import { GlassCard } from '../../../shared/components/GlassCard';
import { GradientText } from '../../../shared/components/GradientText';
import { alpha } from '@mui/material/styles';

export const GroupPage = () => {
  const navigate = useNavigate();
  const {
    groups,
    editingId,
    form,
    deleteConfirmId,
    saving,
    error,
    updateForm,
    startEdit,
    cancelEdit,
    save,
    remove,
    setDeleteConfirmId,
  } = useGroups();

  return (
    <Box sx={groupPageSx}>
      <Box sx={{ width: '100%', maxWidth: 640, mt: 2 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => navigate('/album')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <GradientText variant="h5" fontWeight={700}>
            グループ管理
          </GradientText>
          <Chip
            label={`${groups.length} 件`}
            size="small"
            sx={{ background: alpha('#7c3aed', 0.2), color: '#c4b5fd', ml: 'auto' }}
          />
        </Box>

        {/* 新規追加フォーム */}
        {editingId === null && (
          <GlassCard glow sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
              新しいグループを追加
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="グループ名"
                size="small"
                value={form.groupName}
                onChange={(e) => updateForm({ groupName: e.target.value })}
                placeholder="例：旅行、家族、イベント"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && save()}
              />
              <TextField
                label="コメント（任意）"
                size="small"
                value={form.comment}
                onChange={(e) => updateForm({ comment: e.target.value })}
                placeholder="グループの説明"
                fullWidth
              />
              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                onClick={save}
                disabled={saving || !form.groupName.trim()}
                sx={{
                  alignSelf: 'flex-end',
                  px: 3,
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  boxShadow: `0 4px 16px ${alpha('#7c3aed', 0.4)}`,
                }}
              >
                追加する
              </Button>
            </Box>
          </GlassCard>
        )}

        {/* グループ一覧 */}
        <GlassCard sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2, px: 0.5 }}>
            グループ一覧
          </Typography>

          {groups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
              <FolderSpecialIcon sx={{ fontSize: 48, color: '#a78bfa', mb: 1 }} />
              <Typography color="text.secondary">グループがありません</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {groups.map((group, idx) => (
                <Box key={group.groupId} sx={groupRowSx(editingId === group.groupId)}>
                  {/* アイコン */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: alpha(groupIconColors[idx % groupIconColors.length], 0.2),
                      border: `1px solid ${alpha(groupIconColors[idx % groupIconColors.length], 0.3)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FolderSpecialIcon
                      sx={{ fontSize: 18, color: groupIconColors[idx % groupIconColors.length] }}
                    />
                  </Box>

                  {/* 編集中 */}
                  {editingId === group.groupId ? (
                    <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={form.groupName}
                        onChange={(e) => updateForm({ groupName: e.target.value })}
                        sx={{ flex: 1 }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && save()}
                      />
                      <TextField
                        size="small"
                        value={form.comment}
                        onChange={(e) => updateForm({ comment: e.target.value })}
                        placeholder="コメント"
                        sx={{ flex: 1 }}
                      />
                      <Tooltip title="保存">
                        <IconButton
                          size="small"
                          onClick={save}
                          disabled={saving}
                          sx={{ color: '#34d399' }}
                        >
                          {saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="キャンセル">
                        <IconButton size="small" onClick={cancelEdit} sx={{ color: 'text.secondary' }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <>
                      {/* 通常表示 */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {group.groupName}
                        </Typography>
                        {group.comment && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {group.comment}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="編集">
                          <IconButton
                            size="small"
                            onClick={() => startEdit(group)}
                            sx={{ color: '#a78bfa', '&:hover': { background: alpha('#7c3aed', 0.15) } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="削除">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirmId(group.groupId)}
                            sx={{ color: '#f87171', '&:hover': { background: alpha('#ef4444', 0.15) } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </GlassCard>
      </Box>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{
          sx: {
            background: 'rgba(20,15,50,0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#f87171', 0.3)}`,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: '#f87171' }}>グループを削除しますか？</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            「{groups.find((g) => g.groupId === deleteConfirmId)?.groupName}」を削除します。
            この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmId(null)}
            sx={{ color: 'text.secondary' }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && remove(deleteConfirmId)}
            sx={{ background: alpha('#ef4444', 0.8) }}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
