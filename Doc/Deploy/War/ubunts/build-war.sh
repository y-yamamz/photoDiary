#!/bin/bash
# =============================================================
# PhotoDiary WAR Build Script (Linux / Ubuntu 用)
#
# このスクリプトは Doc/Deploy/War/ubunts/ から実行してください
#   cd Doc/Deploy/War/ubunts
#   bash build-war.sh
# =============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
WAR_DIR="$SCRIPT_DIR"

echo "=============================================="
echo " photoDiary WAR Build Start"
echo "=============================================="
echo " ROOT    : $ROOT_DIR"
echo " WAR OUT : $WAR_DIR"
echo "=============================================="

# ------------------------------------------
# [1/4] Backend WAR ビルド
# ------------------------------------------
echo ""
echo "[1/4] Building Backend WAR..."
cd "$BACKEND_DIR"
if [ ! -f "gradlew" ]; then
    echo "[ERROR] gradlew not found: $BACKEND_DIR"
    exit 1
fi
chmod +x gradlew
./gradlew clean bootWar --no-daemon

# ------------------------------------------
# [2/4] backend.war をコピー
# ------------------------------------------
echo ""
echo "[2/4] Copying backend.war to ubunts folder..."
BACKEND_WAR=$(find "$BACKEND_DIR/build/libs" -name "backend.war" | head -1)
if [ -z "$BACKEND_WAR" ]; then
    echo "[ERROR] backend.war not found in $BACKEND_DIR/build/libs"
    exit 1
fi
cp "$BACKEND_WAR" "$WAR_DIR/backend.war"
echo "       -> $WAR_DIR/backend.war"

# ------------------------------------------
# [3/4] Frontend ビルド
# ------------------------------------------
echo ""
echo "[3/4] Building Frontend..."
cd "$FRONTEND_DIR"
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found: $FRONTEND_DIR"
    exit 1
fi
if [ ! -d "node_modules" ]; then
    echo "       node_modules not found. Running npm install..."
    npm install
fi
npm run build

# ------------------------------------------
# [4/4] frontend.war を作成
# ------------------------------------------
echo ""
echo "[4/4] Creating frontend.war..."
DIST_DIR="$FRONTEND_DIR/dist"
if [ ! -d "$DIST_DIR" ]; then
    echo "[ERROR] dist folder not found: $DIST_DIR"
    exit 1
fi

# jar コマンドで WAR を作成（JDK 付属、フォワードスラッシュで格納される）
jar cf "$WAR_DIR/frontend.war" -C "$DIST_DIR" .
echo "       -> $WAR_DIR/frontend.war"

echo ""
echo "=============================================="
echo " Build Complete! Run to deploy:"
echo "   cd Doc/Deploy/War/ubunts"
echo "   docker compose -f docker-compose.ubunts.yml up -d --build"
echo "=============================================="
