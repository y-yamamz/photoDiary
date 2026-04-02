import { Typography, TypographyProps } from '@mui/material';

interface Props extends TypographyProps {
  gradient?: string;
}

export const GradientText = ({
  gradient = 'linear-gradient(135deg, #a78bfa, #f472b6)',
  sx,
  ...props
}: Props) => (
  <Typography
    sx={{
      background: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...sx,
    }}
    {...props}
  />
);
