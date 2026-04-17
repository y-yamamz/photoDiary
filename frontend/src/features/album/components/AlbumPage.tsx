import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, Drawer, Chip, Checkbox, FormControlLabel,
  useTheme, useMediaQuery,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';
import { alpha } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import CollectionsIcon from '@mui/icons-material/Collections';
import { useAlbum } from '../hooks/useAlbum';
import { useAuth } from '../../auth/hooks/useAuth';
import { useStorage } from '../../../shared/hooks/useStorage';
import { AlbumHeader } from './AlbumHeader';
import { DateTree } from './DateTree';
import { PhotoCard } from './PhotoCard';
import { PhotoLightbox } from './PhotoLightbox';
import { BulkActionBar } from './BulkActionBar';
import { BulkEditDialog } from './BulkEditDialog';
import { downloadPhotosAsZip } from '../utils/downloadUtils';
import { sidebarSx, photoGridSx } from '../styles/albumSx';
import { boardApi } from '../../board/api/boardApi';

export const AlbumPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { storage, refresh: refreshStorage } = useStorage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ done: number; total: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  /** ヘッダーバッジ用：未読お知らせ件数 */
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);

  // アルバムページ初期表示時に未読お知らせ件数を取得する
  useEffect(() => {
    boardApi.getUnreadCount()
      .then(setUnreadNoticeCount)
      .catch(() => { /* バッジ取得失敗は無視（本体機能に影響させない） */ });
  }, []);

  const {
    photos,
    filteredPhotos,
    groups,
    filter,
    dateTree,
    selectedDate,
    expandedYears,
    expandedMonths,
    selectedPhoto,
    setSelectedPhoto,
    toggleYear,
    toggleMonth,
    selectDate,
    updateFilter,
    clearFilter,
    isSelectMode,
    selectedIds,
    enterSelectMode,
    exitSelectMode,
    toggleSelect,
    selectAll,
    clearSelection,
    deletePhotos,
    updatePhoto,
    bulkUpdatePhotos,
    loading,
    error,
  } = useAlbum();

  const handleBulkDelete = async () => {
    await deletePhotos(selectedIds);
    setBulkDeleteOpen(false);
    refreshStorage();
  };

  const handleBulkDownload = useCallback(async () => {
    const targets = filteredPhotos.filter((p) => selectedIds.has(p.photoId));
    if (targets.length === 0) return;
    setDownloading(true);
    setDownloadProgress({ done: 0, total: targets.length });
    await downloadPhotosAsZip(targets, (done, total) => {
      setDownloadProgress({ done, total });
    });
    setDownloading(false);
    setDownloadProgress(null);
  }, [filteredPhotos, selectedIds]);

  /** selectedDate を日本語ラベルに変換する */
  const formatDateLabel = (d: typeof selectedDate): string | null => {
    if (!d.year) return null;
    if (d.day)   return `${d.year}年${d.month}月${d.day}日`;
    if (d.month) return `${d.year}年${d.month}月`;
    return `${d.year}年`;
  };
  const dateLabel = formatDateLabel(selectedDate);

  // 日付ツリーの中身（PC サイドバー / スマホ Drawer 共用）
  const dateTreeContent = (
    <>
      {/* ヘッダー行：タイトル + 選択中の日付 Chip */}
      <Box sx={{ px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}
        >
          日付で絞り込み
        </Typography>
        {dateLabel && (
          <Chip
            size="small"
            icon={<CalendarMonthIcon sx={{ fontSize: 12, color: '#a78bfa !important' }} />}
            label={dateLabel}
            onDelete={() => selectDate()}
            deleteIcon={<ClearIcon sx={{ fontSize: 11 }} />}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              background: alpha('#7c3aed', 0.2),
              color: '#c4b5fd',
              border: `1px solid ${alpha('#a78bfa', 0.4)}`,
              '& .MuiChip-deleteIcon': { color: alpha('#c4b5fd', 0.6), '&:hover': { color: '#f87171' } },
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        )}
      </Box>
      <Box sx={{ mt: 0.5 }}>
        <DateTree
          dateTree={dateTree}
          selectedDate={selectedDate}
          expandedYears={expandedYears}
          expandedMonths={expandedMonths}
          onSelectDate={(y, m, d) => { selectDate(y, m, d); if (isMobile) setDrawerOpen(false); }}
          onToggleYear={toggleYear}
          onToggleMonth={toggleMonth}
        />
      </Box>
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 50%, #130a1f 100%)' }}>
      {/* ヘッダー */}
      <AlbumHeader
        groups={groups}
        filter={filter}
        totalCount={photos.length}
        filteredCount={filteredPhotos.length}
        isSelectMode={isSelectMode}
        selectedDate={selectedDate}
        storage={storage}
        unreadNoticeCount={unreadNoticeCount}
        onFilterChange={updateFilter}
        onClearFilter={clearFilter}
        onClearDate={() => selectDate()}
        onLogout={logout}
        onNavigateUpload={() => navigate('/upload')}
        onNavigateGroups={() => navigate('/photo-groups')}
        onNavigateBoard={() => navigate('/board')}
        onEnterSelectMode={enterSelectMode}
        onToggleDateDrawer={() => setDrawerOpen((o) => !o)}
      />

      {/* メインコンテンツ */}
      <Box sx={{ display: 'flex' }}>
        {/* PC：固定サイドバー */}
        {!isMobile && (
          <Box sx={sidebarSx}>
            {dateTreeContent}
          </Box>
        )}

        {/* スマホ：Drawer サイドバー */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{
              sx: {
                width: 260,
                background: 'rgba(10,10,26,0.97)',
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${alpha('#a78bfa', 0.15)}`,
                p: 1,
              },
            }}
          >
            {dateTreeContent}
          </Drawer>
        )}

        {/* 写真グリッド */}
        <Box sx={photoGridSx}>
          {/* ローディング・エラー表示 */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#a78bfa' }} />
            </Box>
          )}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          {/* 選択モード：全選択バー */}
          {isSelectMode && !loading && filteredPhotos.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.5,
                px: 1,
                py: 0.75,
                borderRadius: 2,
                background: alpha('#1e1b4b', 0.6),
                border: `1px solid ${alpha('#a78bfa', 0.2)}`,
                flexWrap: 'wrap',
              }}
            >
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedIds.size === filteredPhotos.length}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredPhotos.length}
                    onChange={(e) =>
                      e.target.checked
                        ? selectAll(filteredPhotos.map((p) => p.photoId))
                        : clearSelection()
                    }
                    sx={{
                      color: alpha('#a78bfa', 0.5),
                      '&.Mui-checked': { color: '#a78bfa' },
                      '&.MuiCheckbox-indeterminate': { color: '#a78bfa' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color={selectedIds.size > 0 ? '#c4b5fd' : 'text.secondary'}>
                    {selectedIds.size > 0
                      ? `${selectedIds.size} / ${filteredPhotos.length} 枚選択中`
                      : `${filteredPhotos.length} 枚`}
                  </Typography>
                }
              />
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button
                  size="small"
                  startIcon={<SelectAllIcon sx={{ fontSize: 16 }} />}
                  onClick={() => selectAll(filteredPhotos.map((p) => p.photoId))}
                  disabled={selectedIds.size === filteredPhotos.length}
                  sx={{
                    color: '#a78bfa',
                    borderColor: alpha('#a78bfa', 0.4),
                    fontSize: '0.75rem',
                    '&:hover': { background: alpha('#a78bfa', 0.1) },
                    '&.Mui-disabled': { color: alpha('#a78bfa', 0.3) },
                  }}
                  variant="outlined"
                >
                  全て選択
                </Button>
                <Button
                  size="small"
                  startIcon={<DeselectIcon sx={{ fontSize: 16 }} />}
                  onClick={clearSelection}
                  disabled={selectedIds.size === 0}
                  sx={{
                    color: 'text.secondary',
                    borderColor: alpha('#ffffff', 0.15),
                    fontSize: '0.75rem',
                    '&:hover': { background: alpha('#ffffff', 0.05) },
                    '&.Mui-disabled': { color: alpha('#ffffff', 0.2) },
                  }}
                  variant="outlined"
                >
                  全て解除
                </Button>
              </Box>
            </Box>
          )}

          {!loading && filteredPhotos.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: 2,
                opacity: 0.5,
              }}
            >
              <CollectionsIcon sx={{ fontSize: 64, color: '#a78bfa' }} />
              <Typography variant="h6" color="text.secondary">
                写真が見つかりません
              </Typography>
            </Box>
          ) : !loading && (
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {filteredPhotos.map((photo) => (
                <Grid key={photo.photoId} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
                  <PhotoCard
                    photo={photo}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(photo.photoId)}
                    onClick={setSelectedPhoto}
                    onToggleSelect={toggleSelect}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* フッター余白 */}
          <Box
            sx={{
              mt: 4,
              py: 2,
              textAlign: 'center',
              borderTop: `1px solid ${alpha('#a78bfa', 0.08)}`,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              {filteredPhotos.length} 枚の写真
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ライトボックス */}
      {selectedPhoto && !isSelectMode && (
        <PhotoLightbox
          photos={filteredPhotos}
          currentIndex={filteredPhotos.findIndex((p) => p.photoId === selectedPhoto.photoId)}
          groups={groups}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={updatePhoto}
          onDelete={async (id) => { await deletePhotos(new Set([id])); refreshStorage(); }}
        />
      )}

      {/* マルチ選択バー */}
      {isSelectMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredPhotos.length}
          onSelectAll={() => selectAll(filteredPhotos.map((p) => p.photoId))}
          onClearSelection={clearSelection}
          onDelete={() => setBulkDeleteOpen(true)}
          onBulkEdit={() => setBulkEditOpen(true)}
          onDownload={handleBulkDownload}
          onExit={exitSelectMode}
          downloading={downloading}
          downloadProgress={downloadProgress}
        />
      )}

      {/* 一括編集ダイアログ */}
      <BulkEditDialog
        open={bulkEditOpen}
        selectedCount={selectedIds.size}
        groups={groups}
        onClose={() => setBulkEditOpen(false)}
        onApply={(patch) => bulkUpdatePhotos(selectedIds, patch)}
      />

      {/* 一括削除確認ダイアログ */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
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
        <DialogTitle sx={{ color: '#f87171', pb: 1 }}>
          {selectedIds.size} 枚の写真を削除しますか？
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2">
            選択した {selectedIds.size} 枚の写真を削除します。
            この操作は元に戻せません。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setBulkDeleteOpen(false)} sx={{ color: 'text.secondary' }}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkDelete}
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
    </Box>
  );
};
