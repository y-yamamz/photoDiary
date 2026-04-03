import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { configureLogger } from './shared/utils/logger';

// ロガー設定
// endpoint を指定するとバックエンドへも送信できます (例: '/api/logs')
configureLogger({
  console: true,
  localStorage: import.meta.env.PROD,   // 本番環境のみ localStorage へ保存
  minLevel: import.meta.env.DEV ? 'debug' : 'warn',
  // endpoint: '/api/logs',             // バックエンド送信が必要な場合はコメントを外す
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
