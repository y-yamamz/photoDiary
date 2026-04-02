import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Grid } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import CollectionsIcon from '@mui/icons-material/Collections';
import { useAlbum } from '../hooks/useAlbum';
import { useAuth } from '../../auth/hooks/useAuth';
import { AlbumHeader } from './AlbumHeader';
import { DateTree } from './DateTree';
import { PhotoCard } from './PhotoCard';
import { PhotoLightbox } from './PhotoLightbox';
import { BulkActionBar } from './BulkActionBar';
import { BulkEditDialog } from './BulkEditDialog';
import { sidebarSx, photoGridSx } from '../styles/albumSx';
import { alpha } from '@mui/material/styles';

export const AlbumPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const {
    photos,
    filteredPhotos,
    groups,
    groupById,
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
  } = useAlbum();

  const handleBulkDelete = () => {
    deletePhotos(selectedIds);
    setBulkDeleteOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 50%, #130a1f 100%)' }}>
      {/* ヘッダー */}
      <AlbumHeader
        groups={groups}
        filter={filter}
        totalCount={photos.length}
        filteredCount={filteredPhotos.length}
        isSelectMode={isSelectMode}
        onFilterChange={updateFilter}
        onClearFilter={clearFilter}
        onLogout={logout}
        onNavigateUpload={() => navigate('/upload')}
        onNavigateGroups={() => navigate('/photo-groups')}
        onEnterSelectMode={enterSelectMode}
      />

      {/* メインコンテンツ */}
      <Box sx={{ display: 'flex' }}>
        {/* 左：日付ツリー */}
        <Box sx={sidebarSx}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ px: 1.5, py: 0.5, display: 'block', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            日付で絞り込み
          </Typography>
          <Box sx={{ mt: 1 }}>
            <DateTree
              dateTree={dateTree}
              selectedDate={selectedDate}
              expandedYears={expandedYears}
              expandedMonths={expandedMonths}
              onSelectDate={selectDate}
              onToggleYear={toggleYear}
              onToggleMonth={toggleMonth}
            />
          </Box>
        </Box>

        {/* 右：写真グリッド */}
        <Box sx={photoGridSx}>
          {filteredPhotos.length === 0 ? (
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
          ) : (
            <Grid container spacing={2}>
              {filteredPhotos.map((photo) => (
                <Grid key={photo.photoId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
          photo={selectedPhoto}
          group={selectedPhoto.groupId ? groupById[selectedPhoto.groupId] : undefined}
          groups={groups}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={updatePhoto}
          onDelete={(id) => deletePhotos(new Set([id]))}
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
          onExit={exitSelectMode}
        />
      )}

      {/* 一括編集ダイアログ */}
      <BulkEditDialog
        open={bulkEditOpen}
        selectedCount={selectedIds.size}
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
            minWidth: 340,
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
