import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Checkbox, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import FolderIcon from '@mui/icons-material/Folder';
import { alpha } from '@mui/material/styles';
import type { Group } from '../../../shared/types';

interface Props {
  open: boolean;
  selectedCount: number;
  groups: Group[];
  onClose: () => void;
  onApply: (patch: {
    location?: string;
    description?: string;
    groupId?: number;
    takenAt?: string;
  }) => void;
}

export const BulkEditDialog = ({ open, selectedCount, groups, onClose, onApply }: Props) => {
  const [locationEnabled,    setLocationEnabled]    = useState(false);
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [groupEnabled,       setGroupEnabled]       = useState(false);
  const [takenAtEnabled,     setTakenAtEnabled]     = useState(false);

  const [location,    setLocation]    = useState('');
  const [description, setDescription] = useState('');
  const [groupId,     setGroupId]     = useState<number | ''>('');
  const [takenAt,     setTakenAt]     = useState('');

  const canApply =
    (locationEnabled    && location.trim() !== '')  ||
    (descriptionEnabled && description.trim() !== '') ||
    (groupEnabled       && groupId !== '')           ||
    (takenAtEnabled     && takenAt !== '');

  const handleApply = () => {
    const patch: { location?: string; description?: string; groupId?: number; takenAt?: string } = {};
    if (locationEnabled    && location.trim())    patch.location    = location.trim();
    if (descriptionEnabled && description.trim()) patch.description = description.trim();
    if (groupEnabled       && groupId !== '')     patch.groupId     = groupId as number;
    if (takenAtEnabled     && takenAt)            patch.takenAt     = takenAt;
    onApply(patch);
    handleClose();
  };

  const handleClose = () => {
    setLocationEnabled(false);
    setDescriptionEnabled(false);
    setGroupEnabled(false);
    setTakenAtEnabled(false);
    setLocation('');
    setDescription('');
    setGroupId('');
    setTakenAt('');
    onClose();
  };

  const checkboxSx = {
    color: alpha('#a78bfa', 0.5),
    '&.Mui-checked': { color: '#a78bfa' },
  };

  const labelText = (enabled: boolean, text: string) => (
    <Typography variant="body2" fontWeight={600} color={enabled ? '#c4b5fd' : 'text.secondary'}>
      {text}
    </Typography>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          background: 'rgba(20,15,50,0.97)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${alpha('#a78bfa', 0.3)}`,
          borderRadius: 3,
          minWidth: 400,
        },
      }}
    >
      <DialogTitle sx={{ color: '#c4b5fd', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon sx={{ fontSize: 20 }} />
        {selectedCount} 枚を一括編集
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          チェックを入れた項目のみ、選択中の {selectedCount} 枚に上書きされます。
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* グループ */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox checked={groupEnabled} onChange={(e) => setGroupEnabled(e.target.checked)}
                  size="small" sx={checkboxSx} />
              }
              label={labelText(groupEnabled, 'グループを更新する')}
            />
            <FormControl fullWidth size="small" disabled={!groupEnabled} sx={{ mt: 0.5 }}>
              <InputLabel>グループ</InputLabel>
              <Select
                label="グループ"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value as number | '')}
                startAdornment={<FolderIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />}
              >
                {groups.map((g) => (
                  <MenuItem key={g.groupId} value={g.groupId}>{g.groupName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 撮影日時 */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox checked={takenAtEnabled} onChange={(e) => setTakenAtEnabled(e.target.checked)}
                  size="small" sx={checkboxSx} />
              }
              label={labelText(takenAtEnabled, '撮影日時を更新する')}
            />
            <TextField
              label="撮影日時"
              type="datetime-local"
              size="small"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              disabled={!takenAtEnabled}
              InputProps={{
                startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ mt: 0.5 }}
            />
          </Box>

          {/* 撮影場所 */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox checked={locationEnabled} onChange={(e) => setLocationEnabled(e.target.checked)}
                  size="small" sx={checkboxSx} />
              }
              label={labelText(locationEnabled, '撮影場所を更新する')}
            />
            <TextField
              label="撮影場所"
              size="small"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：東京タワー"
              disabled={!locationEnabled}
              InputProps={{
                startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
              }}
              fullWidth
              sx={{ mt: 0.5 }}
            />
          </Box>

          {/* 説明 */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox checked={descriptionEnabled} onChange={(e) => setDescriptionEnabled(e.target.checked)}
                  size="small" sx={checkboxSx} />
              }
              label={labelText(descriptionEnabled, '説明を更新する')}
            />
            <TextField
              label="説明"
              multiline
              rows={3}
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="写真についての説明を入力..."
              disabled={!descriptionEnabled}
              fullWidth
              sx={{ mt: 0.5 }}
            />
          </Box>

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!canApply}
          startIcon={<EditIcon />}
          sx={{
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            boxShadow: `0 4px 16px ${alpha('#7c3aed', 0.4)}`,
            '&:hover': { boxShadow: `0 4px 20px ${alpha('#7c3aed', 0.6)}` },
          }}
        >
          {selectedCount} 枚に適用
        </Button>
      </DialogActions>
    </Dialog>
  );
};
