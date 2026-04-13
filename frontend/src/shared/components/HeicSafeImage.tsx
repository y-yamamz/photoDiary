import { Box, CircularProgress } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useHeicUrl } from '../hooks/useHeicUrl';

interface Props {
  src: string;
  alt?: string;
  sx?: SxProps<Theme>;
  className?: string;
}

/**
 * HEIC 画像を自動でブラウザ表示可能な JPEG に変換して描画する。
 * HEIC 以外はそのまま <img> で表示する。
 */
export const HeicSafeImage = ({ src, alt, sx, className }: Props) => {
  const { url, loading } = useHeicUrl(src);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx as object }}>
        <CircularProgress size={24} sx={{ color: '#a78bfa' }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={url}
      alt={alt}
      sx={sx}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
};
