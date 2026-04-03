import { Box, Typography, Chip, Checkbox } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { Photo } from '../types';
import { photoCardSx, photoCardSelectedSx } from '../styles/albumSx';
import { formatDate } from '../../../shared/utils';
import { toChipStyle } from '../utils/mockData';
import { alpha } from '@mui/material/styles';
import { HeicSafeImage } from '../../../shared/components/HeicSafeImage';

interface Props {
  photo: Photo;
  isSelectMode: boolean;
  isSelected: boolean;
  onClick: (photo: Photo) => void;
  onToggleSelect: (photoId: number) => void;
}

export const PhotoCard = ({ photo, isSelectMode, isSelected, onClick, onToggleSelect }: Props) => {
  const handleClick = () => {
    if (isSelectMode) {
      onToggleSelect(photo.photoId);
    } else {
      onClick(photo);
    }
  };

  return (
    <Box
      sx={isSelected ? photoCardSelectedSx : photoCardSx}
      onClick={handleClick}
    >
      {/* 写真 */}
      <Box sx={{ position: 'relative', paddingTop: '66%', overflow: 'hidden' }}>
        <HeicSafeImage
          src={photo.filePath}
          alt={photo.description ?? photo.fileName}
          className="photo-img"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
            filter: isSelected ? 'brightness(0.75)' : 'none',
          }}
        />

        {/* ホバーオーバーレイ（通常モード） */}
        {!isSelectMode && (
          <Box
            className="photo-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,5,30,0.9) 0%, rgba(10,5,30,0.2) 50%, transparent 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: 1.5,
            }}
          >
            <Typography variant="body2" fontWeight={600} color="white" noWrap>
              {photo.description}
            </Typography>
            {photo.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.3 }}>
                <LocationOnIcon sx={{ fontSize: 12, color: '#a78bfa' }} />
                <Typography variant="caption" color="#c4b5fd" noWrap>
                  {photo.location}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* 選択モード：チェックボックス */}
        {isSelectMode && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              p: 0.8,
            }}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(photo.photoId); }}
          >
            <Checkbox
              checked={isSelected}
              icon={<RadioButtonUncheckedIcon sx={{ fontSize: 26, color: alpha('#fff', 0.8) }} />}
              checkedIcon={
                <CheckCircleIcon sx={{ fontSize: 26, color: '#a78bfa', filter: 'drop-shadow(0 0 6px #7c3aed)' }} />
              }
              sx={{ p: 0 }}
            />
          </Box>
        )}

        {/* 選択済みハイライト枠 */}
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              border: `3px solid ${alpha('#a78bfa', 0.8)}`,
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      {/* 情報 */}
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {formatDate(photo.takenAt ?? photo.createdAt, 'YYYY/MM/DD HH:mm')}
        </Typography>
        {photo.tags && photo.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.8 }}>
            {photo.tags.slice(0, 3).map((tag) => {
              const style = toChipStyle(tag.tagName);
              return (
                <Chip
                  key={tag.tagId}
                  label={tag.tagName}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    background: style.bg,
                    color: style.color,
                    border: 'none',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};
