import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material';

export const groupPageSx: SxProps<Theme> = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 50%, #130a1f 100%)',
  p: { xs: 2, md: 4 },
  display: 'flex',
  justifyContent: 'center',
};

export const groupRowSx = (editing: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  p: 1.5,
  borderRadius: 2,
  background: editing ? alpha('#7c3aed', 0.1) : alpha('#1e1b4b', 0.3),
  border: `1px solid ${editing ? alpha('#a78bfa', 0.4) : alpha('#a78bfa', 0.08)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha('#7c3aed', 0.08),
    border: `1px solid ${alpha('#a78bfa', 0.2)}`,
  },
});

export const groupIconColors = [
  '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c',
];
