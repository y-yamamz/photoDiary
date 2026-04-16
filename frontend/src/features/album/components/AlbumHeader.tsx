import {
  Box, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Typography, IconButton, Badge, Tooltip, InputAdornment,
  Chip, useTheme, useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LogoutIcon from '@mui/icons-material/Logout';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ClearIcon from '@mui/icons-material/Clear';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CampaignIcon from '@mui/icons-material/Campaign';
import { alpha } from '@mui/material/styles';
import type { Group, PhotoFilter } from '../types';
import type { StorageInfo } from '../../../shared/types';
import { headerBarSx } from '../styles/albumSx';
import { GradientText } from '../../../shared/components/GradientText';
import { StorageBar } from '../../../shared/components/StorageBar';

interface Props {
  groups: Group[];
  filter: PhotoFilter;
  totalCount: number;
  filteredCount: number;
  isSelectMode: boolean;
  selectedDate: { year?: number; month?: number; day?: number };
  storage?: StorageInfo | null;
  /** 未読お知らせ件数（バッジ表示用） */
  unreadNoticeCount?: number;
  onFilterChange: (patch: Partial<PhotoFilter>) => void;
  onClearFilter: () => void;
  onClearDate: () => void;
  onLogout: () => void;
  onNavigateUpload: () => void;
  onNavigateGroups: () => void;
  /** 掲示板ページへ遷移するコールバック */
  onNavigateBoard: () => void;
  onEnterSelectMode: () => void;
  onToggleDateDrawer: () => void;
}

/** selectedDate を日本語ラベルに変換する */
const formatSelectedDate = (d: { year?: number; month?: number; day?: number }): string | null => {
  if (!d.year) return null;
  if (d.day)   return `${d.year}年${d.month}月${d.day}日`;
  if (d.month) return `${d.year}年${d.month}月`;
  return `${d.year}年`;
};

export const AlbumHeader = ({
  groups,
  filter,
  totalCount,
  filteredCount,
  isSelectMode,
  selectedDate,
  storage,
  unreadNoticeCount = 0,
  onFilterChange,
  onClearFilter,
  onClearDate,
  onLogout,
  onNavigateUpload,
  onNavigateGroups,
  onNavigateBoard,
  onEnterSelectMode,
  onToggleDateDrawer,
}: Props) => {
  const isFiltered = !!filter.keyword || !!filter.groupId;
  const dateLabel = formatSelectedDate(selectedDate);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={headerBarSx}>
      {/* スマホ：日付ツリーDrawerトグル */}
      {isMobile && (
        <Tooltip title="日付で絞り込み">
          <IconButton
            size="small"
            onClick={onToggleDateDrawer}
            sx={{
              color: dateLabel ? '#a78bfa' : 'text.secondary',
              flexShrink: 0,
              // 日付選択中はリング強調
              ...(dateLabel && {
                background: alpha('#7c3aed', 0.15),
                '&:hover': { background: alpha('#7c3aed', 0.25) },
              }),
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* ロゴ */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 0, sm: 1 }, flexShrink: 0 }}>
        <PhotoCameraIcon sx={{ color: '#a78bfa', fontSize: 22 }} />
        <GradientText variant="h6" fontWeight={800} sx={{ whiteSpace: 'nowrap' }}>
          PhotoDiary
        </GradientText>
      </Box>

      {/* 選択中の日付フィルタ Chip */}
      {dateLabel && (
        <Chip
          size="small"
          icon={<CalendarMonthIcon sx={{ fontSize: 14, color: '#a78bfa !important' }} />}
          label={dateLabel}
          onDelete={onClearDate}
          deleteIcon={<ClearIcon sx={{ fontSize: 13 }} />}
          sx={{
            background: alpha('#7c3aed', 0.2),
            color: '#c4b5fd',
            border: `1px solid ${alpha('#a78bfa', 0.4)}`,
            flexShrink: 0,
            maxWidth: { xs: 130, sm: 200 },
            '& .MuiChip-deleteIcon': { color: alpha('#c4b5fd', 0.6), '&:hover': { color: '#f87171' } },
          }}
        />
      )}

      {/* 検索 */}
      <TextField
        size="small"
        placeholder="写真を検索..."
        value={filter.keyword ?? ''}
        onChange={(e) => onFilterChange({ keyword: e.target.value || undefined })}
        sx={{ width: { xs: 110, sm: 200 } }}
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
      <FormControl size="small" sx={{ minWidth: { xs: 90, sm: 140 } }}>
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

      {/* キーワード・グループフィルタークリア */}
      {isFiltered && (
        <Tooltip title="キーワード・グループをクリア">
          <Badge badgeContent="!" color="warning">
            <IconButton size="small" onClick={onClearFilter} sx={{ color: '#fbbf24' }}>
              <FilterListIcon />
            </IconButton>
          </Badge>
        </Tooltip>
      )}

      {/* カウント（PC のみ表示） */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}
      >
        {(isFiltered || dateLabel) ? (
          <>{filteredCount} / {totalCount} 件</>
        ) : (
          <>{totalCount} 件</>
        )}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* 選択モードボタン */}
      <Tooltip title="複数選択">
        <Button
          size="small"
          variant={isSelectMode ? 'contained' : 'outlined'}
          startIcon={<CheckBoxOutlineBlankIcon />}
          onClick={onEnterSelectMode}
          sx={isSelectMode ? {
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            whiteSpace: 'nowrap',
            minWidth: 0,
          } : {
            borderColor: alpha('#a78bfa', 0.35),
            color: '#a78bfa',
            whiteSpace: 'nowrap',
            minWidth: 0,
            '&:hover': { borderColor: '#a78bfa', background: alpha('#7c3aed', 0.08) },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>選択</Box>
        </Button>
      </Tooltip>

      {/* 写真追加ボタン */}
      <Tooltip title="写真を追加">
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={onNavigateUpload}
          sx={{
            borderColor: alpha('#a78bfa', 0.4),
            color: '#c4b5fd',
            whiteSpace: 'nowrap',
            minWidth: 0,
            '&:hover': { borderColor: '#a78bfa', background: alpha('#7c3aed', 0.1) },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>写真追加</Box>
        </Button>
      </Tooltip>

      {/* グループボタン */}
      <Tooltip title="グループ管理">
        <Button
          size="small"
          variant="outlined"
          startIcon={<FolderOpenIcon />}
          onClick={onNavigateGroups}
          sx={{
            borderColor: alpha('#34d399', 0.4),
            color: '#6ee7b7',
            whiteSpace: 'nowrap',
            minWidth: 0,
            '&:hover': { borderColor: '#34d399', background: alpha('#10b981', 0.1) },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>グループ</Box>
        </Button>
      </Tooltip>

      {/* お知らせボタン（未読件数バッジ付き） */}
      <Tooltip title="お知らせ・管理者へ連絡">
        <Badge badgeContent={unreadNoticeCount > 0 ? unreadNoticeCount : undefined} color="error"
          sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CampaignIcon />}
            onClick={onNavigateBoard}
            sx={{
              borderColor: alpha('#fbbf24', 0.4),
              color: '#fcd34d',
              whiteSpace: 'nowrap',
              minWidth: 0,
              '&:hover': { borderColor: '#fbbf24', background: alpha('#f59e0b', 0.1) },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>お知らせ</Box>
          </Button>
        </Badge>
      </Tooltip>

      {/* ストレージ使用量（コンパクト表示） */}
      {storage && (
        <StorageBar storage={storage} compact />
      )}

      {/* ログアウト */}
      <Tooltip title="ログアウト">
        <IconButton size="small" onClick={onLogout} sx={{ color: 'text.secondary', '&:hover': { color: '#f87171' } }}>
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
