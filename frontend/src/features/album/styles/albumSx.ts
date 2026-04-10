import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material';

export const headerBarSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 0.75, sm: 1.5 },
  p: { xs: '8px 10px', sm: '10px 20px' },
  background: 'rgba(15, 13, 40, 0.85)',
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha('#a78bfa', 0.12)}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  flexWrap: 'wrap',
};

export const sidebarSx: SxProps<Theme> = {
  width: 220,
  minWidth: 200,
  flexShrink: 0,
  height: 'calc(100vh - 60px)',
  overflowY: 'auto',
  borderRight: `1px solid ${alpha('#a78bfa', 0.1)}`,
  p: 1,
  '&::-webkit-scrollbar': { width: 4 },
  '&::-webkit-scrollbar-thumb': {
    background: alpha('#a78bfa', 0.3),
    borderRadius: 2,
  },
};

export const photoGridSx: SxProps<Theme> = {
  flex: 1,
  height: 'calc(100vh - 60px)',
  overflowY: 'auto',
  p: 2,
  '&::-webkit-scrollbar': { width: 6 },
  '&::-webkit-scrollbar-thumb': {
    background: alpha('#a78bfa', 0.3),
    borderRadius: 3,
  },
};

export const photoCardSx: SxProps<Theme> = {
  borderRadius: 3,
  overflow: 'hidden',
  cursor: 'pointer',
  position: 'relative',
  background: 'rgba(30,27,75,0.5)',
  border: `1px solid ${alpha('#a78bfa', 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&:hover': {
    transform: 'scale(1.03) translateY(-4px)',
    border: `1px solid ${alpha('#a78bfa', 0.4)}`,
    boxShadow: `0 20px 40px ${alpha('#7c3aed', 0.3)}`,
    '& .photo-overlay': { opacity: 1 },
    '& .photo-img': { transform: 'scale(1.08)' },
  },
};

export const treeItemSx = (active: boolean): SxProps<Theme> => ({
  px: 1.5,
  py: 0.5,
  borderRadius: 2,
  cursor: 'pointer',
  background: active ? alpha('#7c3aed', 0.25) : 'transparent',
  border: active ? `1px solid ${alpha('#a78bfa', 0.4)}` : '1px solid transparent',
  color: active ? '#c4b5fd' : 'text.secondary',
  '&:hover': {
    background: alpha('#7c3aed', 0.15),
    color: '#e2d9fe',
  },
  transition: 'all 0.2s ease',
  userSelect: 'none',
});

export const photoCardSelectedSx: SxProps<Theme> = {
  borderRadius: 3,
  overflow: 'hidden',
  cursor: 'pointer',
  position: 'relative',
  background: 'rgba(30,27,75,0.5)',
  border: `1px solid ${alpha('#a78bfa', 0.6)}`,
  boxShadow: `0 0 0 2px ${alpha('#7c3aed', 0.5)}, 0 8px 24px ${alpha('#7c3aed', 0.25)}`,
  transition: 'all 0.2s ease',
  '& .photo-overlay': { opacity: 1 },
};

export const bulkActionBarSx: SxProps<Theme> = {
  position: 'fixed',
  bottom: { xs: 16, sm: 32 },
  left: { xs: 8, sm: '50%' },
  right: { xs: 8, sm: 'auto' },
  transform: { xs: 'none', sm: 'translateX(-50%)' },
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 0.75, sm: 1.5 },
  px: { xs: 1.5, sm: 3 },
  py: 1.5,
  borderRadius: 99,
  background: 'rgba(20,15,50,0.92)',
  backdropFilter: 'blur(24px)',
  border: `1px solid ${alpha('#a78bfa', 0.3)}`,
  boxShadow: `0 8px 40px ${alpha('#000', 0.5)}, 0 0 0 1px ${alpha('#a78bfa', 0.1)}`,
  whiteSpace: 'nowrap',
};

export const lightboxOverlaySx: SxProps<Theme> = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  backdropFilter: 'blur(8px)',
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
