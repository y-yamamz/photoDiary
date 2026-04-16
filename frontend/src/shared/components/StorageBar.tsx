import { Box, LinearProgress, Typography, Tooltip } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { alpha } from '@mui/material/styles';
import type { StorageInfo } from '../types';

interface Props {
  storage: StorageInfo;
  /** compact=true のときはアイコン + Tooltip のみ表示（AlbumHeader用） */
  compact?: boolean;
}

/** 使用率に応じたバーの色を返す */
const barColor = (pct: number): string => {
  if (pct >= 90) return '#f87171';   // 赤
  if (pct >= 70) return '#fbbf24';   // 黄
  return '#a78bfa';                   // 紫（通常）
};

const formatMb = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return mb >= 1000
    ? `${(mb / 1024).toFixed(1)} GB`
    : `${mb.toFixed(1)} MB`;
};

/** フル表示（UploadPage用） */
const StorageBarFull = ({ storage }: { storage: StorageInfo }) => {
  const { usedBytes, limitMb, usagePercent } = storage;
  const color = barColor(usagePercent);
  const isWarning = usagePercent >= 70;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <StorageIcon sx={{ fontSize: 14, color }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            ストレージ使用量
          </Typography>
          {isWarning && (
            <WarningAmberIcon sx={{ fontSize: 14, color }} />
          )}
        </Box>
        <Typography variant="caption" sx={{ color }} fontWeight={600}>
          {usagePercent.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(usagePercent, 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha('#fff', 0.08),
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            background: usagePercent >= 90
              ? 'linear-gradient(90deg, #dc2626, #f87171)'
              : usagePercent >= 70
                ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.disabled">
          使用: {formatMb(usedBytes)}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          上限: {limitMb} MB
        </Typography>
      </Box>
    </Box>
  );
};

/** コンパクト表示（AlbumHeader用） */
const StorageBarCompact = ({ storage }: { storage: StorageInfo }) => {
  const { usedBytes, limitMb, usagePercent } = storage;
  const color = barColor(usagePercent);

  const tooltipContent = (
    <Box sx={{ p: 0.5, minWidth: 160 }}>
      <Typography variant="caption" display="block" fontWeight={700} sx={{ mb: 0.5 }}>
        ストレージ
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(usagePercent, 100)}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: alpha('#fff', 0.15),
          mb: 0.5,
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            backgroundColor: color,
          },
        }}
      />
      <Typography variant="caption" display="block" color="text.secondary">
        {formatMb(usedBytes)} / {limitMb} MB ({usagePercent.toFixed(1)}%)
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="bottom">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'default',
          px: 1,
          py: 0.25,
          borderRadius: 1.5,
          border: `1px solid ${alpha(color, 0.35)}`,
          background: alpha(color, 0.08),
        }}
      >
        <StorageIcon sx={{ fontSize: 14, color }} />
        <Typography variant="caption" sx={{ color, fontWeight: 600, lineHeight: 1 }}>
          {usagePercent.toFixed(0)}%
        </Typography>
        {usagePercent >= 70 && (
          <WarningAmberIcon sx={{ fontSize: 12, color }} />
        )}
      </Box>
    </Tooltip>
  );
};

export const StorageBar = ({ storage, compact = false }: Props) => {
  if (compact) return <StorageBarCompact storage={storage} />;
  return <StorageBarFull storage={storage} />;
};
