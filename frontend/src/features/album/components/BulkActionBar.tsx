import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
  onExit: () => void;
}

export const BulkActionBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onExit,
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

      {/* カウント */}
      <Typography variant="body2" fontWeight={600} sx={{ color: selectedCount > 0 ? '#c4b5fd' : 'text.secondary' }}>
        {selectedCount > 0 ? (
          <><span style={{ color: '#a78bfa' }}>{selectedCount}</span> 枚選択中</>
        ) : (
          '写真を選択してください'
        )}
      </Typography>

      {/* 削除ボタン */}
      <Button
        variant="contained"
        size="small"
        startIcon={<DeleteIcon />}
        disabled={selectedCount === 0}
        onClick={onDelete}
        sx={{
          borderRadius: 99,
          background: selectedCount > 0
            ? 'linear-gradient(135deg, #dc2626, #f87171)'
            : undefined,
          boxShadow: selectedCount > 0 ? `0 4px 16px ${alpha('#dc2626', 0.4)}` : undefined,
          px: 2,
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha('#dc2626', 0.6)}`,
          },
        }}
      >
        削除
      </Button>

      {/* 終了 */}
      <Tooltip title="選択モードを終了">
        <IconButton size="small" onClick={onExit} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
