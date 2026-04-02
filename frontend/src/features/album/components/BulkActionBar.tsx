import { Box, Typography, Button, IconButton, Tooltip, CircularProgress } from '@mui/material';
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

  return (
    <Box sx={bulkActionBarSx}>
      {/* 全選択トグル */}
      <Tooltip title={allSelected ? '選択解除' : 'すべて選択'}>
        <IconButton
          size="small"
          onClick={allSelected ? onClearSelection : onSelectAll}
          sx={{ color: allSelected ? '#a78bfa' : 'text.secondary' }}
        >
          {allSelected ? (
            <CheckBoxIcon sx={{ fontSize: 20 }} />
          ) : (
            <CheckBoxOutlineBlankIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Tooltip>

      {/* カウント / ダウンロード進捗 */}
      <Typography variant="body2" fontWeight={600} sx={{ color: selectedCount > 0 ? '#c4b5fd' : 'text.secondary', minWidth: 120 }}>
        {downloading && downloadProgress ? (
          <><span style={{ color: '#34d399' }}>{downloadProgress.done}</span> / {downloadProgress.total} 枚をZIPに追加中</>
        ) : selectedCount > 0 ? (
          <><span style={{ color: '#a78bfa' }}>{selectedCount}</span> 枚選択中</>
        ) : (
          '写真を選択してください'
        )}
      </Typography>

      {/* 一括編集ボタン */}
      <Button
        variant="contained"
        size="small"
        startIcon={<EditIcon />}
        disabled={selectedCount === 0 || downloading}
        onClick={onBulkEdit}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0 && !downloading
            ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
            : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#7c3aed', 0.4)}` : undefined,
          px: 2,
          '&:hover': { boxShadow: `0 4px 20px ${alpha('#7c3aed', 0.6)}` },
        }}
      >
        一括編集
      </Button>

      {/* ダウンロードボタン */}
      <Button
        variant="contained"
        size="small"
        startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
        disabled={selectedCount === 0 || downloading}
        onClick={onDownload}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0 && !downloading
            ? 'linear-gradient(135deg, #0369a1, #38bdf8)'
            : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#0369a1', 0.4)}` : undefined,
          px: 2,
          '&:hover': { boxShadow: `0 4px 20px ${alpha('#0369a1', 0.6)}` },
        }}
      >
        {downloading ? 'ZIP作成中...' : 'ZIPダウンロード'}
      </Button>

      {/* 削除ボタン */}
      <Button
        variant="contained"
        size="small"
        startIcon={<DeleteIcon />}
        disabled={selectedCount === 0 || downloading}
        onClick={onDelete}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0 && !downloading
            ? 'linear-gradient(135deg, #dc2626, #f87171)'
            : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#dc2626', 0.4)}` : undefined,
          px: 2,
          '&:hover': { boxShadow: `0 4px 20px ${alpha('#dc2626', 0.6)}` },
        }}
      >
        削除
      </Button>

      {/* 終了 */}
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
