# PhotoDiary WAR デプロイ手順書 [NAS版]
## 対象環境: Windows 11 + Docker Desktop（WAR 事前ビルド版）

---

## 概要

ソースコードのビルドを Docker 外（Windows 上）で行い、生成した WAR ファイルを Docker コンテナにデプロイする方式です。
写真ファイルの保存先は **NAS（CIFS/SMB マウント）** を使用します。

| コンポーネント | 技術 | 役割 |
|---|---|---|
| frontend | Nginx + React/Vite (WAR展開) | UI 配信・リバースプロキシ (ポート 80) |
| backend | Tomcat + Spring Boot WAR | API・画像配信 (内部ポート 8080) |
| MySQL | 既存サーバー (192.168.0.10) | データ永続化 |
| NAS | \\192.168.0.5\homedir\PhotoDiary | 写真ファイル保存 |

```
ブラウザ → Nginx (port 80) ─┬─ 静的ファイル (React)
                             ├─ /api/**    → Tomcat (8080)
                             └─ /images/** → Tomcat (8080) → NAS (\\192.168.0.5\homedir\PhotoDiary)
```

> **NAS マウントの仕組み**
> Docker Desktop は WSL2 上で動作するため UNC パス (`\\...`) を直接マウントできません。
> `docker-compose.nas.yml` では CIFS named volume を使い、Docker が直接 NAS に SMB 接続します。

---

## ファイル構成

```
Doc/Deploy/War/nas/
├── 手順書_nas.md              # 本ファイル
├── docker-compose.nas.yml     # Docker Compose 定義 (NAS版)
├── Dockerfile.backend         # Tomcat + backend.war
├── Dockerfile.frontend        # Nginx + frontend.war
├── nginx.conf                 # Nginx 設定
├── .env.example               # 環境変数テンプレート
├── build-war.bat              # WAR ビルドスクリプト (Windows)
├── create-frontend-war.ps1    # frontend.war 作成ヘルパー (build-war.bat から呼び出し)
├── backend.war                # ★ build-war.bat 実行後に生成
└── frontend.war               # ★ build-war.bat 実行後に生成
```

---

## 前提条件

- Windows 11
- Docker Desktop for Windows（WSL2 バックエンド）が起動済み
- Java 17 が PATH に通っていること（`java -version` で確認）
- Node.js (v20 以上) が PATH に通っていること（`node -v` で確認）
- MySQL が `192.168.0.10:3306/photodb` で稼働中
- NAS `\\192.168.0.5\homedir` へネットワーク疎通があること

```cmd
:: 事前確認コマンド
java -version
node -v
docker --version
docker compose version

:: NAS への疎通確認
dir \\192.168.0.5\homedir\PhotoDiary
```

---

## デプロイ手順

### Step 1: nas フォルダへ移動

```cmd
cd D:\WORK\study\vscode\gitHub\photoDiary\Doc\Deploy\War\nas
```

### Step 2: 環境変数ファイルを作成

```cmd
copy .env.example .env
```

`.env` を開いて接続情報を確認・編集します：

```env
MYSQL_URL=jdbc:mysql://192.168.0.10:3306/photodb?useSSL=false&serverTimezone=Asia/Tokyo
MYSQL_USER=yama
MYSQL_PASSWORD=yama
FRONTEND_PORT=80
IMAGE_VOLUME_PATH=//192.168.0.5/homedir/PhotoDiary
NAS_ADDR=192.168.0.5
NAS_USER=
NAS_PASSWORD=
```

> **NAS 認証について**
> ゲストアクセス可能な場合は `NAS_USER` / `NAS_PASSWORD` は空のままで構いません。
> 認証が必要な場合は NAS のユーザー名とパスワードを設定してください。

### Step 3: WAR ファイルをビルド

`build-war.bat` をダブルクリック、または以下をコマンドプロンプトで実行します：

```cmd
D:\WORK\study\vscode\gitHub\photoDiary\Doc\Deploy\War\nas\build-war.bat
```

**処理内容:**

| ステップ | 内容 |
|---|---|
| [1/4] | `backend/` で `gradlew clean bootWar` を実行 |
| [2/4] | `backend/build/libs/backend.war` を `nas/` フォルダへコピー |
| [3/4] | `frontend/` で `npm run build` を実行 |
| [4/4] | `create-frontend-war.ps1` を呼び出し `frontend/dist/` を `frontend.war` にパッケージ |

完了すると以下が生成されます：
```
Doc/Deploy/War/nas/backend.war
Doc/Deploy/War/nas/frontend.war
```

> **初回は時間がかかります**
> Gradle の依存ライブラリダウンロード: 5〜10 分
> npm install（node_modules がない場合）: 2〜5 分

### Step 4: MySQL のテーブルを確認

MySQL が稼働中で `photodb` のテーブルが作成済みであることを確認します。
未作成の場合は `Doc/DB/` 配下の SQL ファイルを実行してください。

```cmd
mysql -h 192.168.0.10 -u yama -p photodb
```

### Step 5: Docker Desktop でデプロイ（初回）

```cmd
cd D:\WORK\study\vscode\gitHub\photoDiary\Doc\Deploy\War\nas
docker compose -f docker-compose.nas.yml up -d --build
```

初回はイメージのビルドがあるため 1〜3 分かかります。

### Step 6: 起動確認

```cmd
docker compose -f docker-compose.nas.yml ps
```

```
NAME                   STATUS    PORTS
photodiary-frontend    running   0.0.0.0:80->80/tcp
photodiary-backend     running
```

両コンテナが `running` になれば起動完了です。

### Step 7: ブラウザで動作確認

```
http://localhost/
```

> Tomcat の起動完了まで **30〜60 秒**かかります。
> ページが表示されない場合は少し待ってからリロードしてください。

---

## WAR を更新してデプロイし直す手順

ソースコードを変更した場合は以下の手順を繰り返します。

```cmd
:: 1. WAR を再ビルド
D:\WORK\study\vscode\gitHub\photoDiary\Doc\Deploy\War\nas\build-war.bat

:: 2. コンテナを再ビルド・再起動
cd D:\WORK\study\vscode\gitHub\photoDiary\Doc\Deploy\War\nas
docker compose -f docker-compose.nas.yml down
docker compose -f docker-compose.nas.yml up -d --build
```

> **注意: `docker compose up -d --build` だけでは古いキャッシュが残る場合があります。**
> 画面が更新されない場合は `docker compose down` を先に実行してください。

**片方だけ更新する場合:**

```cmd
:: フロントエンドのみ（確実に再ビルドする場合）
docker compose -f docker-compose.nas.yml down
docker rmi nas-frontend
docker compose -f docker-compose.nas.yml up -d --build

:: バックエンドのみ（確実に再ビルドする場合）
docker compose -f docker-compose.nas.yml down
docker rmi nas-backend
docker compose -f docker-compose.nas.yml up -d --build
```

---

## 停止・削除

```cmd
:: コンテナ停止
docker compose -f docker-compose.nas.yml down

:: イメージごと削除（次回 up 時に再ビルドが必要）
docker compose -f docker-compose.nas.yml down --rmi all
```

---

## トラブルシューティング

### ページが表示されない (502 Bad Gateway)

Tomcat の起動完了まで時間がかかります。ログを確認してください：

```cmd
docker logs photodiary-backend -f
```

`Server startup in [XXXX] milliseconds` が表示されれば起動完了です。

### 画面が真っ白になる（JS が読み込まれない）

frontend コンテナ内の `assets/` ディレクトリが正しく展開されているか確認します：

```cmd
docker exec photodiary-frontend ls /usr/share/nginx/html/
docker exec photodiary-frontend ls /usr/share/nginx/html/assets/
```

`assets/` が存在しない場合、イメージを完全に削除して再ビルドします：

```cmd
cd D:\WORK\study\vscode\gitHub\photoDiary\Doc\Deploy\War\nas
docker compose -f docker-compose.nas.yml down
docker rmi nas-frontend
docker compose -f docker-compose.nas.yml up -d --build
```

### 写真が表示されない

```cmd
:: コンテナ内に NAS フォルダが見えるか確認
docker exec photodiary-backend ls /var/photodiary/images
```

何も表示されない場合は NAS への疎通・マウントを確認します：

```cmd
:: Windows から NAS への疎通確認
dir \\192.168.0.5\homedir\PhotoDiary

:: CIFS volume の状態確認
docker volume ls
docker volume inspect nas_nas_photos
```

`.env` の `IMAGE_VOLUME_PATH` / `NAS_ADDR` / `NAS_USER` / `NAS_PASSWORD` が正しいか確認し、再起動します：

```cmd
docker compose -f docker-compose.nas.yml down
docker volume rm nas_nas_photos
docker compose -f docker-compose.nas.yml up -d --build
```

> **volume を削除してから up し直すと CIFS マウントを再作成します。**

### MySQL に接続できない

```cmd
docker logs photodiary-backend -f
```

- `.env` の `MYSQL_URL`, `MYSQL_USER`, `MYSQL_PASSWORD` が正しいか確認
- MySQL ユーザーに Docker ホスト IP からのアクセス権があるか確認

```sql
-- MySQL 側で権限付与（必要な場合）
GRANT ALL PRIVILEGES ON photodb.* TO 'yama'@'%' IDENTIFIED BY 'yama';
FLUSH PRIVILEGES;
```

### build-war.bat でビルドエラー

**Backend (Gradle) のエラー:**
```cmd
cd D:\WORK\study\vscode\gitHub\photoDiary\backend
gradlew.bat bootWar --info
```

**Frontend (npm) のエラー:**
```cmd
cd D:\WORK\study\vscode\gitHub\photoDiary\frontend
npm run build
```

### ポート 80 が使用中

`.env` でポートを変更します：
```env
FRONTEND_PORT=8080
```

使用中のプロセス確認：
```cmd
netstat -ano | findstr :80
```

---

## ログ確認

```cmd
:: 全コンテナのログ（リアルタイム）
docker compose -f docker-compose.nas.yml logs -f

:: バックエンドのみ
docker logs photodiary-backend -f --tail 100

:: フロントエンドのみ
docker logs photodiary-frontend -f --tail 100
```
