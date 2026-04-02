import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material';

export const uploadPageSx: SxProps<Theme> = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 50%, #130a1f 100%)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  p: { xs: 2, md: 4 },
};

export const dropzoneSx = (isDragging: boolean): SxProps<Theme> => ({
  border: `2px dashed ${isDragging ? '#a78bfa' : alpha('#a78bfa', 0.3)}`,
  borderRadius: 3,
  background: isDragging ? alpha('#7c3aed', 0.1) : alpha('#1e1b4b', 0.2),
  p: 4,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    border: `2px dashed ${alpha('#a78bfa', 0.6)}`,
    background: alpha('#7c3aed', 0.08),
  },
});

export const progressBarSx: SxProps<Theme> = {
  height: 6,
  borderRadius: 3,
  background: alpha('#a78bfa', 0.15),
  '& .MuiLinearProgress-bar': {
    background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #f472b6)',
    borderRadius: 3,
  },
};
