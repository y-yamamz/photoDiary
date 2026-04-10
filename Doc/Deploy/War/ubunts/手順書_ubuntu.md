# PhotoDiary WAR デプロイ手順書 [Ubuntu版]
## 対象環境: Ubuntu + Docker Engine（WAR 事前ビルド版・NAS マウント済み）

---

## 概要

ソースコードのビルドを Docker 外（Ubuntu 上）で行い、生成した WAR ファイルを Docker コンテナにデプロイする方式です。
写真ファイルの保存先は **Ubuntu ホスト側でマウント済みの NAS（`/mnt/homedir`）をバインドマウント** で使用します。

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

> **バインドマウントの仕組み**
> Ubuntu ホスト側で NAS が `/mnt/homedir` にマウント済みであるため、
> `docker-compose.ubunts.yml` ではそのパスをコンテナ内の `/var/photodiary/images` に直接バインドマウントします。
> Docker Desktop の CIFS named volume は不要です。

---

## ファイル構成

```
Doc/Deploy/War/ubunts/
├── 手順書_ubuntu.md               # 本ファイル
├── docker-compose.ubunts.yml      # Docker Compose 定義
├── Dockerfile.backend             # Tomcat + backend.war
├── Dockerfile.frontend            # Nginx + frontend.war
├── nginx.conf                     # Nginx 設定
├── .env.example                   # 環境変数テンプレート
├── build-war.sh                   # WAR ビルドスクリプト (Linux)
├── backend.war                    # ★ build-war.sh 実行後に生成
└── frontend.war                   # ★ build-war.sh 実行後に生成
```

---

## 前提条件

- Ubuntu（20.04 以上推奨）
- Docker Engine が起動済み（`docker --version` で確認）
- Docker Compose Plugin がインストール済み（`docker compose version` で確認）
- Java 17 (JDK) が PATH に通っていること（`java -version` で確認）
- Node.js (v20 以上) が PATH に通っていること（`node -v` で確認）
- MySQL が `192.168.0.3:3306/photodb` で稼働中
- NAS が `/mnt/homedir` にマウント済みであること

```bash
# 事前確認コマンド
java -version
node -v
docker --version
docker compose version

# NAS マウント確認
ls /mnt/homedir
```

---

## 事前準備（初回のみ）

### 1. NAS のマウント確認・設定

NAS が `/mnt/homedir` にマウントされていることを確認します。

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
# フォルダ確認（なければ作成）
ls /mnt/homedir/PhotoDiary || mkdir -p /mnt/homedir/PhotoDiary
```

> **バインドマウントはフォルダが存在しないとエラーになります。** 必ず事前に作成してください。

### 3. docker グループへのユーザー追加（sudo なしで docker を使う場合）

```bash
sudo usermod -aG docker $USER
# 反映には再ログインが必要
```

---

## デプロイ手順

### Step 1: ubunts フォルダへ移動

```bash
cd ~/photoDiary/Doc/Deploy/War/ubunts
```

### Step 2: 環境変数ファイルを作成

```bash
cp .env.example .env
```

`.env` を開いて接続情報を確認・編集します：

```env
MYSQL_URL=jdbc:mysql://192.168.0.3:3306/photodb?useSSL=false&serverTimezone=Asia/Tokyo
MYSQL_USER=yama
MYSQL_PASSWORD=yama
FRONTEND_PORT=80
IMAGE_LOCAL_PATH=/mnt/homedir/PhotoDiary
```

> `IMAGE_LOCAL_PATH` は Ubuntu ホスト上の実際のパスを指定します。
> NAS 直下に保存する場合は `/mnt/homedir` に変更してください。

### Step 3: WAR ファイルをビルド

```bash
bash build-war.sh
```

**処理内容:**

| ステップ | 内容 |
|---|---|
| [1/4] | `backend/` で `./gradlew clean bootWar` を実行 |
| [2/4] | `backend/build/libs/backend.war` を `ubunts/` へコピー |
| [3/4] | `frontend/` で `npm run build` を実行 |
| [4/4] | `jar cf` で `frontend/dist/` を `frontend.war` にパッケージ |

完了すると以下が生成されます：
```
Doc/Deploy/War/ubunts/backend.war
Doc/Deploy/War/ubunts/frontend.war
```

> **初回は時間がかかります**
> Gradle の依存ライブラリダウンロード: 5〜10 分
> npm install（node_modules がない場合）: 2〜5 分

> **`jar` コマンドがない場合**
> JDK が未インストールの可能性があります。
> ```bash
> sudo apt install default-jdk
> ```
> または `zip` コマンドで代替できます（`build-war.sh` 内の `jar cf` 行を書き換え）：
> ```bash
> cd frontend/dist && zip -r ../../Doc/Deploy/War/ubunts/frontend.war . && cd ../..
> ```

### Step 4: MySQL のテーブルを確認

MySQL が稼働中で `photodb` のテーブルが作成済みであることを確認します。
未作成の場合は `Doc/DB/` 配下の SQL ファイルを実行してください。

```bash
mysql -h 192.168.0.3 -u yama -p photodb
```

### Step 5: Docker でデプロイ（初回）

```bash
# ubunts/ フォルダにいることを確認してから実行
docker compose -f docker-compose.ubunts.yml up -d --build
```

初回はイメージのビルドがあるため 1〜3 分かかります。

### Step 6: 起動確認

```bash
docker compose -f docker-compose.ubunts.yml ps
```

```
NAME                   STATUS    PORTS
photodiary-frontend    running   0.0.0.0:80->80/tcp
photodiary-backend     running
```

両コンテナが `running` になれば起動完了です。

### Step 7: ブラウザで動作確認

```
http://サーバーのIPアドレス/
```

> Tomcat の起動完了まで **30〜60 秒**かかります。
> ページが表示されない場合は少し待ってからリロードしてください。

---

## WAR を更新してデプロイし直す手順

ソースコードを変更した場合は以下の手順を繰り返します。

```bash
cd ~/photoDiary/Doc/Deploy/War/ubunts

# 1. WAR を再ビルド
bash build-war.sh

# 2. コンテナを再ビルド・再起動
docker compose -f docker-compose.ubunts.yml down
docker compose -f docker-compose.ubunts.yml up -d --build
```

> **注意: `docker compose up -d --build` だけでは古いキャッシュが残る場合があります。**
> 画面が更新されない場合は `docker compose down` を先に実行してください。

**片方だけ更新する場合:**

```bash
# フロントエンドのみ（確実に再ビルドする場合）
docker compose -f docker-compose.ubunts.yml down
docker rmi ubunts-frontend
docker compose -f docker-compose.ubunts.yml up -d --build

# バックエンドのみ（確実に再ビルドする場合）
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

### ページが表示されない (502 Bad Gateway)

Tomcat の起動完了まで時間がかかります。ログを確認してください：

```bash
docker logs photodiary-backend -f
```

`Server startup in [XXXX] milliseconds` が表示されれば起動完了です。

### 画面が真っ白になる（JS が読み込まれない）

frontend コンテナ内の `assets/` ディレクトリが正しく展開されているか確認します：

```bash
docker exec photodiary-frontend ls /usr/share/nginx/html/
docker exec photodiary-frontend ls /usr/share/nginx/html/assets/
```

`assets/` が存在しない場合、イメージを完全に削除して再ビルドします：

```bash
docker compose -f docker-compose.ubunts.yml down
docker rmi ubunts-frontend
docker compose -f docker-compose.ubunts.yml up -d --build
```

### 写真が表示されない

```bash
# コンテナ内に NAS フォルダが見えるか確認
docker exec photodiary-backend ls /var/photodiary/images
```

何も表示されない場合は以下を確認します：

**1. NAS がマウントされているか**
```bash
mount | grep /mnt/homedir
ls /mnt/homedir/PhotoDiary
```
マウントされていない場合は再マウントしてから Docker を再起動してください：
```bash
sudo mount -t cifs //192.168.0.5/homedir /mnt/homedir \
  -o username=xxx,password=yyy,vers=2.1
docker compose -f docker-compose.ubunts.yml down
docker compose -f docker-compose.ubunts.yml up -d --build
```

**2. `.env` の `IMAGE_LOCAL_PATH` が正しいか**
```env
IMAGE_LOCAL_PATH=/mnt/homedir/PhotoDiary
```

**3. フォルダのパーミッションを確認**
```bash
ls -la /mnt/homedir/PhotoDiary
# コンテナ（Tomcat）からの書き込みが必要な場合
sudo chmod 777 /mnt/homedir/PhotoDiary
```

### MySQL に接続できない

```bash
docker logs photodiary-backend -f
```

- `.env` の `MYSQL_URL`, `MYSQL_USER`, `MYSQL_PASSWORD` が正しいか確認
- MySQL ユーザーに Docker ホスト IP からのアクセス権があるか確認

```sql
-- MySQL 側で権限付与（必要な場合）
GRANT ALL PRIVILEGES ON photodb.* TO 'yama'@'%' IDENTIFIED BY 'yama';
FLUSH PRIVILEGES;
```

### build-war.sh でビルドエラー

**Backend (Gradle) のエラー:**
```bash
cd ~/photoDiary/backend
./gradlew bootWar --info
```

**Frontend (npm) のエラー:**
```bash
cd ~/photoDiary/frontend
npm run build
```

### ポート 80 が使用中

`.env` でポートを変更します：
```env
FRONTEND_PORT=8080
```

使用中のプロセス確認：
```bash
sudo ss -tlnp | grep :80
```

### docker compose 実行時に permission denied

Docker グループへの追加が反映されていない場合は `sudo` を付けて実行するか、再ログインしてください：

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
