import {
  Box, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Typography, IconButton, Badge, Tooltip, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LogoutIcon from '@mui/icons-material/Logout';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ClearIcon from '@mui/icons-material/Clear';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { alpha } from '@mui/material/styles';
import type { Group, PhotoFilter } from '../types';
import { headerBarSx } from '../styles/albumSx';
import { GradientText } from '../../../shared/components/GradientText';

interface Props {
  groups: Group[];
  filter: PhotoFilter;
  totalCount: number;
  filteredCount: number;
  isSelectMode: boolean;
  onFilterChange: (patch: Partial<PhotoFilter>) => void;
  onClearFilter: () => void;
  onLogout: () => void;
  onNavigateUpload: () => void;
  onNavigateGroups: () => void;
  onEnterSelectMode: () => void;
}

export const AlbumHeader = ({
  groups,
  filter,
  totalCount,
  filteredCount,
  isSelectMode,
  onFilterChange,
  onClearFilter,
  onLogout,
  onNavigateUpload,
  onNavigateGroups,
  onEnterSelectMode,
}: Props) => {
  const isFiltered = !!filter.keyword || !!filter.groupId;

  return (
    <Box sx={headerBarSx}>
      {/* ロゴ */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
        <PhotoCameraIcon sx={{ color: '#a78bfa', fontSize: 22 }} />
        <GradientText variant="h6" fontWeight={800} sx={{ whiteSpace: 'nowrap' }}>
          PhotoDiary
        </GradientText>
      </Box>

      {/* 検索 */}
      <TextField
        size="small"
        placeholder="写真を検索..."
        value={filter.keyword ?? ''}
        onChange={(e) => onFilterChange({ keyword: e.target.value || undefined })}
        sx={{ width: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: filter.keyword ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onFilterChange({ keyword: undefined })} sx={{ p: 0.3 }}>
                <ClearIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />

      {/* グループフィルター */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>グループ</InputLabel>
        <Select
          label="グループ"
          value={filter.groupId ?? ''}
          onChange={(e) => onFilterChange({ groupId: e.target.value ? Number(e.target.value) : undefined })}
          sx={{ borderRadius: 2 }}
        >
          <MenuItem value="">すべて</MenuItem>
          {groups.map((g) => (
            <MenuItem key={g.groupId} value={g.groupId}>{g.groupName}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* フィルタークリア */}
      {isFiltered && (
        <Tooltip title="フィルターをクリア">
          <Badge badgeContent="!" color="warning">
            <IconButton size="small" onClick={onClearFilter} sx={{ color: '#fbbf24' }}>
              <FilterListIcon />
            </IconButton>
          </Badge>
        </Tooltip>
      )}

      {/* カウント */}
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {isFiltered ? (
          <>{filteredCount} / {totalCount} 件</>
        ) : (
          <>{totalCount} 件</>
        )}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* 選択モードボタン */}
      <Tooltip title="複数選択して削除">
        <Button
          size="small"
          variant={isSelectMode ? 'contained' : 'outlined'}
          startIcon={<CheckBoxOutlineBlankIcon />}
          onClick={onEnterSelectMode}
          sx={isSelectMode ? {
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            whiteSpace: 'nowrap',
          } : {
            borderColor: alpha('#a78bfa', 0.35),
            color: '#a78bfa',
            whiteSpace: 'nowrap',
            '&:hover': { borderColor: '#a78bfa', background: alpha('#7c3aed', 0.08) },
          }}
        >
          選択
        </Button>
      </Tooltip>

      {/* アクションボタン */}
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddPhotoAlternateIcon />}
        onClick={onNavigateUpload}
        sx={{
          borderColor: alpha('#a78bfa', 0.4),
          color: '#c4b5fd',
          whiteSpace: 'nowrap',
          '&:hover': { borderColor: '#a78bfa', background: alpha('#7c3aed', 0.1) },
        }}
      >
        写真追加
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={onNavigateGroups}
        sx={{
          borderColor: alpha('#34d399', 0.4),
          color: '#6ee7b7',
          whiteSpace: 'nowrap',
          '&:hover': { borderColor: '#34d399', background: alpha('#10b981', 0.1) },
        }}
      >
        グループ
      </Button>
      <Tooltip title="ログアウト">
        <IconButton size="small" onClick={onLogout} sx={{ color: 'text.secondary', '&:hover': { color: '#f87171' } }}>
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
