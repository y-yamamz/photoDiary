import { Box, Typography, Button, IconButton, Tooltip, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import { bulkActionBarSx } from '../styles/albumSx';

interface Props {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onBulkEdit: () => void;
  onDownload: () => void;
  onExit: () => void;
  downloading?: boolean;
  downloadProgress?: { done: number; total: number } | null;
}

export const BulkActionBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onBulkEdit,
  onDownload,
  onExit,
  downloading = false,
  downloadProgress = null,
}: Props) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /* ── スマホ：底面シート ─────────────────────────── */
  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'linear-gradient(160deg, rgba(15,12,40,0.97) 0%, rgba(20,15,50,0.97) 100%)',
          backdropFilter: 'blur(24px)',
          borderTop: `1px solid ${alpha('#a78bfa', 0.25)}`,
          boxShadow: `0 -8px 40px ${alpha('#000', 0.5)}`,
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* 上段：カウント・全選択・閉じる */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            pt: 1.5,
            pb: 1,
            gap: 1,
            borderBottom: `1px solid ${alpha('#a78bfa', 0.1)}`,
          }}
        >
          {/* 全選択トグル */}
          <IconButton
            onClick={allSelected ? onClearSelection : onSelectAll}
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              color: allSelected ? '#a78bfa' : alpha('#c4b5fd', 0.45),
              background: allSelected ? alpha('#7c3aed', 0.2) : 'transparent',
              '&:hover': { background: alpha('#7c3aed', 0.15) },
            }}
          >
            {allSelected
              ? <CheckBoxIcon sx={{ fontSize: 22 }} />
              : <CheckBoxOutlineBlankIcon sx={{ fontSize: 22 }} />}
          </IconButton>

          {/* カウント */}
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ flex: 1, color: selectedCount > 0 ? '#c4b5fd' : 'text.secondary', fontSize: '0.95rem' }}
          >
            {downloading && downloadProgress ? (
              <><span style={{ color: '#34d399' }}>{downloadProgress.done}</span> / {downloadProgress.total} 枚をZIPに追加中</>
            ) : selectedCount > 0 ? (
              <><span style={{ color: '#a78bfa' }}>{selectedCount}</span> 枚選択中</>
            ) : (
              '写真を選択してください'
            )}
          </Typography>

          {/* 閉じる */}
          <IconButton
            onClick={onExit}
            disabled={downloading}
            sx={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              color: alpha('#c4b5fd', 0.6),
              '&:hover': { background: alpha('#ffffff', 0.08), color: '#e2d9fe' },
            }}
          >
            <CloseIcon sx={{ fontSize: 26 }} />
          </IconButton>
        </Box>

        {/* 下段：3アクションボタン */}
        <Box sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.5 }}>
          {/* 編集 */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<EditIcon sx={{ fontSize: 20 }} />}
            disabled={selectedCount === 0 || downloading}
            onClick={onBulkEdit}
            sx={{
              py: 1.4,
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: selectedCount > 0 && !downloading
                ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                : undefined,
              boxShadow: selectedCount > 0 ? `0 4px 18px ${alpha('#7c3aed', 0.45)}` : 'none',
              '&:hover': { boxShadow: `0 6px 24px ${alpha('#7c3aed', 0.6)}` },
              '&:active': { transform: 'scale(0.97)' },
              transition: 'all 0.2s ease',
            }}
          >
            編集
          </Button>

          {/* ダウンロード */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={downloading
              ? <CircularProgress size={18} color="inherit" />
              : <DownloadIcon sx={{ fontSize: 20 }} />}
            disabled={selectedCount === 0 || downloading}
            onClick={onDownload}
            sx={{
              py: 1.4,
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: selectedCount > 0 && !downloading
                ? 'linear-gradient(135deg, #0369a1, #38bdf8)'
                : undefined,
              boxShadow: selectedCount > 0 ? `0 4px 18px ${alpha('#0369a1', 0.45)}` : 'none',
              '&:hover': { boxShadow: `0 6px 24px ${alpha('#0369a1', 0.6)}` },
              '&:active': { transform: 'scale(0.97)' },
              transition: 'all 0.2s ease',
            }}
          >
            {downloading ? 'ZIP...' : 'DL'}
          </Button>

          {/* 削除 */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<DeleteIcon sx={{ fontSize: 20 }} />}
            disabled={selectedCount === 0 || downloading}
            onClick={onDelete}
            sx={{
              py: 1.4,
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.9rem',
              background: selectedCount > 0 && !downloading
                ? 'linear-gradient(135deg, #dc2626, #f87171)'
                : undefined,
              boxShadow: selectedCount > 0 ? `0 4px 18px ${alpha('#dc2626', 0.45)}` : 'none',
              '&:hover': { boxShadow: `0 6px 24px ${alpha('#dc2626', 0.6)}` },
              '&:active': { transform: 'scale(0.97)' },
              transition: 'all 0.2s ease',
            }}
          >
            削除
          </Button>
        </Box>
      </Box>
    );
  }

  /* ── PC：従来のピル型バー ───────────────────────── */
  return (
    <Box sx={bulkActionBarSx}>
      <Tooltip title={allSelected ? '選択解除' : 'すべて選択'}>
        <IconButton
          size="small"
          onClick={allSelected ? onClearSelection : onSelectAll}
          sx={{ color: allSelected ? '#a78bfa' : 'text.secondary' }}
        >
          {allSelected
            ? <CheckBoxIcon sx={{ fontSize: 20 }} />
            : <CheckBoxOutlineBlankIcon sx={{ fontSize: 20 }} />}
        </IconButton>
      </Tooltip>

      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: selectedCount > 0 ? '#c4b5fd' : 'text.secondary', minWidth: 120 }}
      >
        {downloading && downloadProgress ? (
          <><span style={{ color: '#34d399' }}>{downloadProgress.done}</span> / {downloadProgress.total} 枚をZIPに追加中</>
        ) : selectedCount > 0 ? (
          <><span style={{ color: '#a78bfa' }}>{selectedCount}</span> 枚選択中</>
        ) : (
          '写真を選択してください'
        )}
      </Typography>

      <Button
        variant="contained"
        size="small"
        startIcon={<EditIcon />}
        disabled={selectedCount === 0 || downloading}
        onClick={onBulkEdit}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0 && !downloading ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#7c3aed', 0.4)}` : undefined,
          px: 2,
          '&:hover': { boxShadow: `0 4px 20px ${alpha('#7c3aed', 0.6)}` },
        }}
      >
        一括編集
      </Button>

      <Button
        variant="contained"
        size="small"
        startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
        disabled={selectedCount === 0 || downloading}
        onClick={onDownload}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0 && !downloading ? 'linear-gradient(135deg, #0369a1, #38bdf8)' : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#0369a1', 0.4)}` : undefined,
          px: 2,
          '&:hover': { boxShadow: `0 4px 20px ${alpha('#0369a1', 0.6)}` },
        }}
      >
        {downloading ? 'ZIP作成中...' : 'ZIPダウンロード'}
      </Button>

      <Button
        variant="contained"
        size="small"
        startIcon={<DeleteIcon />}
        disabled={selectedCount === 0 || downloading}
        onClick={onDelete}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0 && !downloading ? 'linear-gradient(135deg, #dc2626, #f87171)' : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#dc2626', 0.4)}` : undefined,
          px: 2,
          '&:hover': { boxShadow: `0 4px 20px ${alpha('#dc2626', 0.6)}` },
        }}
      >
        削除
      </Button>

      <Tooltip title="選択モードを終了">
        <IconButton
          size="small"
          onClick={onExit}
          disabled={downloading}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
