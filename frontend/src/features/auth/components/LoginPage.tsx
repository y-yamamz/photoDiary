import { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '../hooks/useAuth';
import { loginContainerSx, loginCardSx, submitButtonSx, orbitSx } from '../styles/loginSx';
import { GradientText } from '../../../shared/components/GradientText';

export const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <Box sx={loginContainerSx}>
      {/* 背景オーブ */}
      <Box sx={orbitSx(600, '#7c3aed', '-10%', '-15%')} />
      <Box sx={orbitSx(500, '#db2777', '60%', '70%')} />
      <Box sx={orbitSx(400, '#3b82f6', '30%', '80%')} />

      {/* フローティングパーティクル */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#a78bfa' : '#f472b6',
            top: `${15 + i * 14}%`,
            left: `${10 + i * 13}%`,
            opacity: 0.6,
            animation: `float${i} ${3 + i}s ease-in-out infinite`,
            [`@keyframes float${i}`]: {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: `translateY(${i % 2 === 0 ? '-' : ''}12px)` },
            },
          }}
        />
      ))}

      <Box sx={loginCardSx}>
        {/* ロゴ */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              boxShadow: '0 8px 32px rgba(124, 58, 237, 0.5)',
              mb: 2,
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
          <GradientText variant="h4" fontWeight={800} gutterBottom>
            PhotoDiary
          </GradientText>
          <Typography variant="body2" color="text.secondary">
            あなたの思い出を、美しく。
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={submitButtonSx}
            disabled={loading || !username || !password}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <>
                <AutoAwesomeIcon sx={{ mr: 1, fontSize: 18 }} />
                ログイン
              </>
            )}
          </Button>
        </Box>

        <Divider sx={{ my: 3, opacity: 0.3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            デモ用：ユーザー名 <b style={{ color: '#a78bfa' }}>demo</b> / パスワード <b style={{ color: '#a78bfa' }}>demo</b>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
