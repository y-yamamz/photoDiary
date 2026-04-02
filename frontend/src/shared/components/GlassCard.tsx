import { Paper, PaperProps } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface Props extends PaperProps {
  glow?: boolean;
}

export const GlassCard = ({ glow, sx, ...props }: Props) => (
  <Paper
    sx={{
      background: 'rgba(30, 27, 75, 0.5)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(167, 139, 250, 0.15)',
      boxShadow: glow
        ? `0 0 40px ${alpha('#7c3aed', 0.25)}, 0 8px 32px rgba(0,0,0,0.4)`
        : '0 8px 32px rgba(0,0,0,0.3)',
      transition: 'box-shadow 0.3s ease',
      ...sx,
    }}
    {...props}
  />
);
