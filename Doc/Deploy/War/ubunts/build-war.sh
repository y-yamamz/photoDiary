#!/bin/bash
# =============================================================
# PhotoDiary Deploy Script (Ubuntu)
#
# 事前に以下のファイルを同じフォルダに配置してください:
#   backend.war            (Windows の create-war.bat で生成)
#   frontend.war           (Windows の create-war.bat で生成)
#   docker-compose.ubunts.yml
#   Dockerfile.backend
#   Dockerfile.frontend
#   nginx.conf
#   .env                   (.env.example をコピーして編集)
#
# 実行方法:
#   bash build-war.sh
# =============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================="
echo " photoDiary Deploy Start"
echo "=============================================="

# ------------------------------------------
# [1/4] backend.war の確認
# ------------------------------------------
echo ""
echo "[1/4] Checking backend.war..."
if [ ! -f "backend.war" ]; then
    echo "[ERROR] backend.war not found."
    echo "        Run create-war.bat on Windows and transfer the file here."
    exit 1
fi
echo "       OK: backend.war"

# ------------------------------------------
# [2/4] frontend.war の確認
# ------------------------------------------
echo ""
echo "[2/4] Checking frontend.war..."
if [ ! -f "frontend.war" ]; then
    echo "[ERROR] frontend.war not found."
    echo "        Run create-war.bat on Windows and transfer the file here."
    exit 1
fi
echo "       OK: frontend.war"

# ------------------------------------------
# [3/4] .env の確認
# ------------------------------------------
echo ""
echo "[3/4] Checking .env..."
if [ ! -f ".env" ]; then
    echo "[ERROR] .env not found."
    echo "        Create .env in the same directory with the following contents:"
    echo ""
    echo "          MYSQL_URL=jdbc:mysql://192.168.0.10:3306/photodb?useSSL=false&serverTimezone=Asia/Tokyo"
    echo "          MYSQL_USER=yama"
    echo "          MYSQL_PASSWORD=yama"
    echo "          FRONTEND_PORT=80"
    echo "          IMAGE_LOCAL_PATH=/mnt/homedir/PhotoDiary"
    echo ""
    exit 1
fi
echo "       OK: .env"

# ------------------------------------------
# [4/4] Docker Compose でデプロイ
# ------------------------------------------
echo ""
echo "[4/4] Deploying with Docker Compose..."
docker compose -f docker-compose.ubunts.yml down 2>/dev/null || true
docker compose -f docker-compose.ubunts.yml up -d --build

echo ""
echo "=============================================="
echo " Deploy Complete!"
echo " Access: http://$(hostname -I | awk '{print $1}')/"
echo "=============================================="
