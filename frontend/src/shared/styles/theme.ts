import { createTheme, alpha } from '@mui/material/styles';

// ============================================================
// グローバルテーマ（Dark Glassmorphism）
// ============================================================

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a78bfa',      // violet-400
      light: '#c4b5fd',
      dark: '#7c3aed',
    },
    secondary: {
      main: '#f472b6',      // pink-400
      light: '#f9a8d4',
      dark: '#db2777',
    },
    background: {
      default: '#0a0a1a',
      paper: alpha('#1e1b4b', 0.7),
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: alpha('#a78bfa', 0.15),
    error: { main: '#f87171' },
    success: { main: '#34d399' },
    warning: { main: '#fbbf24' },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 40%, #130a1f 100%)',
          minHeight: '100vh',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: alpha('#a78bfa', 0.4),
            borderRadius: 3,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha('#a78bfa', 0.12)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontSize: '0.95rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          boxShadow: `0 4px 24px ${alpha('#7c3aed', 0.4)}`,
          '&:hover': {
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            boxShadow: `0 6px 32px ${alpha('#7c3aed', 0.6)}`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha('#a78bfa', 0.5),
          '&:hover': { borderColor: '#a78bfa' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: alpha('#1e1b4b', 0.4),
            '& fieldset': { borderColor: alpha('#a78bfa', 0.25) },
            '&:hover fieldset': { borderColor: alpha('#a78bfa', 0.5) },
            '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          background: alpha('#1e1b4b', 0.95),
          border: `1px solid ${alpha('#a78bfa', 0.2)}`,
        },
      },
    },
  },
});

// ============================================================
// グラスカード用 sx ヘルパー
// ============================================================
export const glassCard = (opacity = 0.06) => ({
  background: `rgba(30, 27, 75, ${opacity + 0.4})`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#a78bfa', 0.15)}`,
  boxShadow: `0 8px 32px ${alpha('#000', 0.3)}`,
});
