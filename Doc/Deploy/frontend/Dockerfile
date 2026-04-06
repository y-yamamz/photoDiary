# =============================================================
# Frontend Dockerfile
# React + Vite をビルドし Nginx で配信する
# /api, /images はバックエンドコンテナへリバースプロキシ
# =============================================================

# =====================
# Stage 1: Reactビルド
# =====================
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係を先にインストール（キャッシュ活用）
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# ソース全体をコピーしてビルド
COPY frontend/ .
RUN npm run build

# =====================
# Stage 2: Nginxで配信
# =====================
FROM nginx:1.27-alpine

# ビルド成果物をNginxの公開ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx設定ファイルを配置
COPY Doc/Deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
