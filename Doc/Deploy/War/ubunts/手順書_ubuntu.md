# PhotoDiary WAR デプロイ手順書 [Ubuntu版]
## 対象環境: Ubuntu + Docker Engine（WAR 事前ビルド版・NAS マウント済み）

---

## 概要

WAR ファイルは **Windows 11 上でビルド**し、Ubuntu へ転送して Docker でデプロイします。
写真ファイルの保存先は **Ubuntu ホスト側でマウント済みの NAS（`/mnt/homedir`）をバインドマウント** で使用します。

| 作業場所 | スクリプト | 役割 |
|---|---|---|
| Windows 11 | `create-war.bat` | WAR ファイルをビルド |
| Ubuntu | `build-war.sh` | WAR の確認 → Docker デプロイ |

| コンポーネント | 技術 | 役割 |
|---|---|---|
| frontend | Nginx + React/Vite (WAR展開) | UI 配信・リバースプロキシ (ポート 80) |
| backend | Tomcat + Spring Boot WAR | API・画像配信 (内部ポート 8080) |
| MySQL | 既存サーバー (192.168.0.3) | データ永続化 |
| NAS | /mnt/homedir/PhotoDiary | 写真ファイル保存 |

```
ブラウザ → Nginx (port 80) ─┬─ 静的ファイル (React)
                             ├─ /api/**    → Tomcat (8080)
                             └─ /images/** → Tomcat (8080) → /mnt/homedir/PhotoDiary
```

---

## ファイル構成

### Windows（リポジトリ内）

```
Doc/Deploy/War/ubunts/
├── create-war.bat                 # WAR ビルドスクリプト (Windows 11 用)
├── create-frontend-war.ps1        # frontend.war 作成ヘルパー (Windows 用)
├── backend.war                    # ★ create-war.bat 実行後に生成
└── frontend.war                   # ★ create-war.bat 実行後に生成
```

### Ubuntu（配布・配置先）

```
/var/work/ubunts/                  # 配布先フォルダ（任意のパス可）
├── build-war.sh                   # Ubuntuデプロイスクリプト
├── docker-compose.ubunts.yml      # Docker Compose 定義
├── Dockerfile.backend             # Tomcat + backend.war
├── Dockerfile.frontend            # Nginx + frontend.war
├── nginx.conf                     # Nginx 設定
├── .env                           # ★ Ubuntu上で手動作成（下記参照）
├── backend.war                    # ★ Windows からコピー
└── frontend.war                   # ★ Windows からコピー
```

---

## 前提条件

### Windows 11（WAR ビルド側）

- Java 17 (JDK) が PATH に通っていること（`java -version` で確認）
- Node.js (v20 以上) が PATH に通っていること（`node -v` で確認）
- PowerShell が使用可能であること（Windows 11 標準で同梱）

```cmd
java -version
node -v
```

### Ubuntu（デプロイ側）

- Ubuntu（20.04 以上推奨）
- Docker Engine が起動済み（`docker --version` で確認）
- Docker Compose Plugin がインストール済み（`docker compose version` で確認）
- MySQL が `192.168.0.3:3306/photodb` で稼働中
- NAS が `/mnt/homedir` にマウント済みであること

```bash
docker --version
docker compose version
ls /mnt/homedir
```

---

## 事前準備（初回のみ）

### 1. NAS のマウント確認・設定

```bash
# マウント状態の確認
mount | grep /mnt/homedir

# マウントされていない場合は手動でマウント
sudo mount -t cifs //192.168.0.5/homedir /mnt/homedir \
  -o username=ユーザー名,password=パスワード,vers=2.1
```

OS 起動時に自動マウントする場合は `/etc/fstab` に追記します：

```
//192.168.0.5/homedir  /mnt/homedir  cifs  username=xxx,password=yyy,vers=2.1,_netdev  0  0
```

### 2. 画像保存フォルダの確認・作成

```bash
ls /mnt/homedir/PhotoDiary || mkdir -p /mnt/homedir/PhotoDiary
```

> **バインドマウントはフォルダが存在しないとエラーになります。** 必ず事前に作成してください。

### 3. docker グループへのユーザー追加（sudo なしで docker を使う場合）

```bash
sudo usermod -aG docker $USER
# 反映には再ログインが必要
```

### 4. Ubuntu への配布ファイル配置（初回のみ）

以下のファイルを `/var/work/ubunts/`（任意のパス可）に配置します：

```
build-war.sh
docker-compose.ubunts.yml
Dockerfile.backend
Dockerfile.frontend
nginx.conf
.env.example #ubuntsの配布は不要
```

配置後、CRLF 改行を変換します：

```bash
dos2unix /var/work/ubunts/build-war.sh
```

> `.env.example` は配布不要です。`.env` は Ubuntu 上で直接作成します（Step 3 参照）。

---

## デプロイ手順

### Step 1: Windows で WAR をビルド

```powershell
cd Doc\Deploy\War\ubunts
.\create-war.bat
```

| ステップ | 内容 |
|---|---|
| [1/4] | `backend/` で `gradlew.bat clean bootWar` を実行 |
| [2/4] | `backend.war` を `ubunts/` へコピー |
| [3/4] | `frontend/` で `npm run build` を実行 |
| [4/4] | `frontend/dist/` を `frontend.war` にパッケージ |

完了すると以下が生成されます：
```
Doc/Deploy/War/ubunts/backend.war
Doc/Deploy/War/ubunts/frontend.war
```

### Step 2: WAR ファイルを Ubuntu へ転送

```powershell
scp Doc\Deploy\War\ubunts\backend.war  ユーザー名@Ubuntu-IP:/var/work/ubunts/
scp Doc\Deploy\War\ubunts\frontend.war ユーザー名@Ubuntu-IP:/var/work/ubunts/
```

### Step 3: .env を作成（初回のみ）

```bash
cat > /var/work/ubunts/.env << 'EOF'
MYSQL_URL=jdbc:mysql://192.168.0.3:3306/photodb?useSSL=false&serverTimezone=Asia/Tokyo
MYSQL_USER=yama
MYSQL_PASSWORD=yama
FRONTEND_PORT=80
IMAGE_LOCAL_PATH=/mnt/homedir/PhotoDiary
EOF
```

### Step 4: build-war.sh でデプロイ

```bash
cd /var/work/ubunts
bash build-war.sh
```

**処理内容:**

| ステップ | 内容 |
|---|---|
| [1/4] | `backend.war` の存在確認 |
| [2/4] | `frontend.war` の存在確認 |
| [3/4] | `.env` の存在確認 |
| [4/4] | `docker compose down` → `docker compose up -d --build` |

### Step 5: 起動確認

```bash
docker compose -f docker-compose.ubunts.yml ps
```

```
NAME                   STATUS    PORTS
photodiary-frontend    running   0.0.0.0:80->80/tcp
photodiary-backend     running
```

両コンテナが `running` になれば起動完了です。

> Tomcat の起動完了まで **30〜60 秒**かかります。

### Step 6: ブラウザで動作確認

Ubuntu の IP アドレスを確認します：

```bash
hostname -I
```

ブラウザで以下にアクセスします：

```
http://<UbuntuのIPアドレス>/
```

**この環境の場合:**

```
http://192.168.0.X/
```

> ページが表示されない場合は 30〜60 秒待ってからリロードしてください。
> Tomcat の起動ログは `docker logs photodiary-backend -f` で確認できます。

---

## WAR を更新してデプロイし直す手順

**1. Windows 11 で WAR を再ビルド**

```powershell
.\create-war.bat
```

**2. Ubuntu へ転送**

```powershell
scp Doc\Deploy\War\ubunts\backend.war  ユーザー名@Ubuntu-IP:/var/work/ubunts/
scp Doc\Deploy\War\ubunts\frontend.war ユーザー名@Ubuntu-IP:/var/work/ubunts/
```

**3. Ubuntu でデプロイ**

```bash
cd /var/work/ubunts
bash build-war.sh
```

**片方だけ更新する場合（イメージキャッシュを確実に消す）:**

```bash
# フロントエンドのみ
docker compose -f docker-compose.ubunts.yml down
docker rmi ubunts-frontend
docker compose -f docker-compose.ubunts.yml up -d --build

# バックエンドのみ
docker compose -f docker-compose.ubunts.yml down
docker rmi ubunts-backend
docker compose -f docker-compose.ubunts.yml up -d --build
```

---

## 停止・削除

```bash
# コンテナ停止
docker compose -f docker-compose.ubunts.yml down

# イメージごと削除（次回 up 時に再ビルドが必要）
docker compose -f docker-compose.ubunts.yml down --rmi all
```

---

## トラブルシューティング

### build-war.sh 実行時に `$'\r': コマンドが見つかりません` エラー

`build-war.sh` が CRLF 改行になっています。以下で変換してください：

```bash
dos2unix /var/work/ubunts/build-war.sh
```

`dos2unix` がない場合：

```bash
tr -d '\r' < build-war.sh > /tmp/b.sh && mv /tmp/b.sh build-war.sh
```

### ページが表示されない (502 Bad Gateway)

Tomcat の起動完了まで時間がかかります。ログを確認してください：

```bash
docker logs photodiary-backend -f
```

`Server startup in [XXXX] milliseconds` が表示されれば起動完了です。

### 画面が真っ白になる（JS が読み込まれない）

```bash
docker exec photodiary-frontend ls /usr/share/nginx/html/assets/
```

`assets/` が存在しない場合はイメージを完全削除して再ビルド：

```bash
docker compose -f docker-compose.ubunts.yml down
docker rmi ubunts-frontend
docker compose -f docker-compose.ubunts.yml up -d --build
```

### 写真が表示されない

```bash
docker exec photodiary-backend ls /var/photodiary/images
mount | grep /mnt/homedir
```

マウントされていない場合は再マウントしてから Docker を再起動してください：

```bash
sudo mount -t cifs //192.168.0.5/homedir /mnt/homedir \
  -o username=xxx,password=yyy,vers=2.1
bash build-war.sh
```

### MySQL に接続できない

```bash
docker logs photodiary-backend -f
```

- `.env` の `MYSQL_URL`, `MYSQL_USER`, `MYSQL_PASSWORD` が正しいか確認
- MySQL ユーザーに Docker ホスト IP からのアクセス権があるか確認

```sql
GRANT ALL PRIVILEGES ON photodb.* TO 'yama'@'%' IDENTIFIED BY 'yama';
FLUSH PRIVILEGES;
```

### create-war.bat でビルドエラー

```cmd
cd backend
gradlew.bat bootWar --info
```

```cmd
cd frontend
npm run build
```

### ポート 80 が使用中

`.env` でポートを変更します：

```env
FRONTEND_PORT=8080
```

### docker compose 実行時に permission denied

```bash
sudo docker compose -f docker-compose.ubunts.yml up -d --build
```

---

## ログ確認

```bash
# 全コンテナのログ（リアルタイム）
docker compose -f docker-compose.ubunts.yml logs -f

# バックエンドのみ
docker logs photodiary-backend -f --tail 100

# フロントエンドのみ
docker logs photodiary-frontend -f --tail 100
```
