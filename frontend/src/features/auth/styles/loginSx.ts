import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material';

export const loginContainerSx: SxProps<Theme> = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 50%, #1a0a2e 100%)',
};

export const orbitSx = (size: number, color: string, top: string, left: string): SxProps<Theme> => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${alpha(color, 0.15)}, transparent 70%)`,
  top,
  left,
  filter: 'blur(40px)',
  pointerEvents: 'none',
});

export const loginCardSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: 440,
  mx: { xs: 2, sm: 0 },
  p: { xs: 3, sm: 5 },
  borderRadius: 4,
  background: 'rgba(30, 27, 75, 0.55)',
  backdropFilter: 'blur(32px)',
  border: `1px solid ${alpha('#a78bfa', 0.2)}`,
  boxShadow: `0 0 60px ${alpha('#7c3aed', 0.2)}, 0 24px 48px rgba(0,0,0,0.5)`,
};

export const submitButtonSx: SxProps<Theme> = {
  mt: 1,
  py: 1.5,
  fontSize: '1rem',
  background: 'linear-gradient(135deg, #7c3aed, #a78bfa, #f472b6)',
  backgroundSize: '200% 200%',
  animation: 'gradientShift 4s ease infinite',
  boxShadow: `0 4px 24px ${alpha('#7c3aed', 0.5)}`,
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
  '&:hover': {
    boxShadow: `0 8px 32px ${alpha('#7c3aed', 0.7)}`,
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.3s ease',
};
