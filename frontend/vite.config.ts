import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/* → Spring Boot (localhost:8080)
      '/api': {
        //target: 'http://192.168.0.10:8080',
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 画像ファイル配信
      '/images': {
        //target: 'http://192.168.0.10:8080',
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
