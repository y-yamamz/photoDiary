# PhotoDiary 公開手順書 [Cloudflare Tunnel + Access 案]
## 特定ユーザーへの限定公開・費用最小構成

---

## 概要

自宅 Ubuntu サーバーをそのまま使い、**Cloudflare Tunnel** でインターネットに安全に公開、
**Cloudflare Access** で特定のメールアドレスのみアクセスを許可する構成です。

| 項目 | 内容 |
|---|---|
| コード変更 | **不要** |
| ルーターのポート開放 | **不要** |
| アクセス制限 | メールアドレス単位で指定可能 |
| 認証方式 | ワンタイムパスワード（メール送信） |

### 費用

| 項目 | 費用 |
|---|---|
| Cloudflare Tunnel | **無料** |
| Cloudflare Access（50 ユーザーまで） | **無料** |
| ドメイン（例: .com） | **約 1,200 円/年** |
| Ubuntu サーバー（自宅） | **電気代のみ** |

**年間 約 1,200 円** で特定ユーザー向けの安全な公開が実現できます。

---

## 全体構成

```
特定ユーザー（許可したメールアドレスのみ）
     ↓  https://photodiary.example.com へアクセス
Cloudflare Access（メール OTP 認証）
     ↓  認証済みリクエストのみ通過
Cloudflare Tunnel（暗号化トンネル）
     ↓  自宅ネットワーク内へ転送
Ubuntu（Docker: Nginx port 80）
     ├─ React フロントエンド
     └─ Spring Boot バックエンド → MySQL (192.168.0.10) / NAS (/mnt/homedir)
```

---

## 前提条件

- Cloudflare アカウントが作成済みであること
- 独自ドメインが Cloudflare で管理されていること（ネームサーバーが Cloudflare）
- Ubuntu サーバーが起動済みで Docker コンテナ（Nginx port 80）が動作中であること
- Ubuntu サーバーがインターネットに接続されていること（外向き通信のみ必要）

---

## Step 1: ドメインを Cloudflare に登録

### 新規ドメインを取得する場合

1. [cloudflare.com](https://cloudflare.com) にログイン
2. 左メニュー **Domain Registration** → **Register Domains**
3. 希望のドメイン名を検索して購入（例: `photodiary-yama.com`）
   - Cloudflare Registrar は仲介手数料なしの実費価格（最安水準）

### 既存ドメインを使う場合

1. ドメイン管理会社のコントロールパネルでネームサーバーを変更
2. Cloudflare ダッシュボード → **Add a Site** → ドメインを入力
3. 表示された Cloudflare のネームサーバー 2 つをドメイン管理会社に設定
4. 反映まで最大 24 時間かかる場合がある

---

## Step 2: cloudflared を Ubuntu にインストール

Ubuntu サーバーで作業します。

```bash
# 最新の cloudflared をダウンロード・インストール
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
  -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# バージョン確認
cloudflared --version
```

---

## Step 3: Cloudflare にログイン

```bash
cloudflared tunnel login
```

- コマンド実行後にブラウザの URL が表示される
- そのURLをブラウザで開き、Cloudflare アカウントでログイン
- 対象ドメインを選択して認証を許可
- 認証後 `~/.cloudflared/cert.pem` が自動生成される

---

## Step 4: トンネルを作成

```bash
# トンネルの作成（名前は任意）
cloudflared tunnel create photodiary
```

実行後に以下が表示される（メモしておく）：
```
Created tunnel photodiary with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

認証情報ファイルが自動生成される：
```
~/.cloudflared/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json
```

---

## Step 5: トンネル設定ファイルを作成

```bash
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <Step4 で表示されたトンネル ID>
credentials-file: /root/.cloudflared/<トンネル ID>.json

ingress:
  - hostname: photodiary.example.com
    service: http://localhost:80
  - service: http_status:404
EOF
```

> `photodiary.example.com` は実際のドメインに置き換えてください。

---

## Step 6: DNS レコードを登録

```bash
cloudflared tunnel route dns photodiary photodiary.example.com
```

Cloudflare の DNS に `CNAME` レコードが自動追加される。

---

## Step 7: cloudflared をサービスとして登録（自動起動）

```bash
# システムサービスとして登録
sudo cloudflared service install

# サービス開始
sudo systemctl start cloudflared

# OS 起動時に自動起動する設定
sudo systemctl enable cloudflared

# 状態確認
sudo systemctl status cloudflared
```

`Active: active (running)` と表示されれば起動完了。

---

## Step 8: Cloudflare Access でアクセス制限を設定

Cloudflare ダッシュボードで操作します。

### 8-1. Zero Trust ダッシュボードを開く

1. [dash.cloudflare.com](https://dash.cloudflare.com) にログイン
2. 左メニュー **Zero Trust** をクリック
3. チーム名を設定（初回のみ、任意の名前で OK）

### 8-2. アプリケーションを追加

1. 左メニュー **Access** → **Applications** → **Add an application**
2. **Self-hosted** を選択
3. 以下を入力：

   | 項目 | 値 |
   |---|---|
   | Application name | PhotoDiary |
   | Session Duration | 24 hours（任意） |
   | Application domain | `photodiary.example.com` |

4. **Next** をクリック

### 8-3. アクセスポリシーを設定

1. Policy name: `許可ユーザー`（任意）
2. Action: **Allow**
3. **Configure rules** → **Include** → ルールを追加：

   | Selector | Value |
   |---|---|
   | Emails | `friend1@gmail.com` |

   複数人許可する場合は **Add require** でメールアドレスを追加

4. **Next** → **Add application** をクリック

### 8-4. 認証方式の確認

- デフォルトで **One-time PIN**（メール OTP）が有効
- ユーザーは追加アプリ不要、メールアドレスだけでログイン可能

---

## Step 9: 動作確認

1. ブラウザで `https://photodiary.example.com` にアクセス
2. Cloudflare Access の認証画面が表示される
3. 許可したメールアドレスを入力
4. 届いたコード（6 桁）を入力
5. PhotoDiary が表示される

---

## 許可ユーザーの追加・削除

Cloudflare ダッシュボードで随時変更できます。

**Zero Trust** → **Access** → **Applications** → `PhotoDiary` → **Edit** → **Policies** → メールアドレスを追加・削除

---

## トラブルシューティング

### cloudflared が起動しない

```bash
# ログを確認
sudo journalctl -u cloudflared -f
```

よくある原因：
- `config.yml` のトンネル ID が間違っている
- 認証情報ファイル（`.json`）のパスが間違っている

### アクセスしても Cloudflare のエラー画面になる

```bash
# Docker コンテナが起動しているか確認
docker compose -f /var/work/ubunts/docker-compose.ubunts.yml ps

# ポート 80 でリッスンしているか確認
curl http://localhost:80
```

### 認証メールが届かない

- 迷惑メールフォルダを確認
- メールアドレスの入力ミスがないか確認
- Cloudflare Access の Policy でそのメールアドレスが許可されているか確認

---

## サービス管理コマンド

```bash
# cloudflared の状態確認
sudo systemctl status cloudflared

# 再起動
sudo systemctl restart cloudflared

# 停止（公開を一時停止したい場合）
sudo systemctl stop cloudflared

# トンネル一覧確認
cloudflared tunnel list

# トンネルのログ確認
cloudflared tunnel info photodiary
```

---

## 注意事項

- 自宅の Ubuntu サーバーが**常時起動**している必要がある
- Ubuntu のインターネット接続が切れると外からアクセス不可になる
- 写真データは NAS に残るため、クラウドへの移行は不要
- Cloudflare Zero Trust Free プランは **50 ユーザーまで無料**

#一時的なお試しランダムURL
cloudflared tunnel --url http://192.168.0.10:80
