## incident_picker

### 概要
Next.js(App Router) と Prisma(PostgreSQL/Neon) を基盤としたインシデント管理・検索・監査ログ可視化システムです。Slack 連携によるメッセージ収集、ルールベースの分類、WCAG 2.2 AA 準拠のUI、Vitest による包括的テストを備えています。

### 主な機能
- 検索・サジェスト: インシデント/メッセージの検索と候補提示
- 監査ログ: 操作履歴の集計・可視化
- Slack 連携: conversations.history / conversations.replies を考慮した取得、429対応のレートリミット/バックオフ
- ルールベース分類: 緊急度・影響度・タイプの自動判定
- ダッシュボード: 最新状況、分布、推移などの可視化

### 技術スタック
- Next.js 14 (App Router)
- TypeScript
- Prisma 5 / PostgreSQL (Neon 推奨)
- NextAuth.js
- Vitest / React Testing Library / jest-axe
- Tailwind CSS 4（`@tailwindcss/postcss`）
- Zod（入力バリデーション）

---

## 始め方

### 前提条件
- Node.js 18.17 以上（Next.js 14 の要件）
- npm
- PostgreSQL 接続先（Neon など）

### 環境変数の設定（.env）
プロジェクト直下に `.env` を作成してください。`.gitignore` によりコミット対象外です。

```env
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>/<DB>?sslmode=require"
AUTH_SECRET="<32bytes以上のランダム文字列>"
SLACK_BOT_TOKEN="xoxb-xxxxxxxxxxxxxxxxxxxxxxxx"
```

#### AUTH_SECRET の生成例
- OpenSSL: `openssl rand -base64 32`
- Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

#### Slack Bot Token について
- Slack App を作成し、Bot User を有効化して `xoxb-` で始まるトークンを取得します。
- conversations.history / conversations.replies を呼び出すために必要な権限を付与してください（実運用の最小権限原則に従って設定）。

### インストールとDB初期化
```bash
npm install
npm run db:generate   # Prisma Client 生成
npm run db:migrate    # マイグレーションを適用（開発）
npm run db:seed       # 任意: サンプルデータ投入（存在する場合）
```

### 開発サーバー
```bash
npm run dev
# http://localhost:3000 を開く
```

### テスト（Vitest）
```bash
npm test         # すべてのテスト + カバレッジ
npm run test:watch
npm run typecheck
npm run lint
```

macOS/zsh 等で環境変数を読み込んでからテストする場合:
```bash
set -a; source .env; set +a; npm test
```

### 本番ビルドと起動
```bash
npm run build
npm start
```

---

## ディレクトリ概要
- `src/app/**`: App Router 構成（ページ/サーバーアクション/API Routes）
- `src/app/api/**`: Next.js API Routes（サーバーサイドからのみ呼び出し）
- `src/lib/api/**`: アプリ内のAPIロジック（検索/監査/Slack取得/レポート 等）
- `src/lib/incidents/**`:
  - 分類ロジック（緊急度/影響度/タイプ）
  - パターン/ルール関連
- `src/lib/slack/**`: Slackクライアント、レートリミット、バックオフ
- `src/lib/db/**`: Prisma Client とDBユーティリティ
- `prisma/schema.prisma` / `prisma/migrations/**`: Prisma スキーマ/マイグレーション
- `tests/**`: Vitest による単体/統合/アクセシビリティ/E2Eテスト

---

## アクセシビリティ
- 主要画面で WCAG 2.2 AA に準拠するよう実装（`aria-*` 属性、`aria-live`、フォーカストラップ等）
- `jest-axe` によるアクセシビリティ検証テスト

## セキュリティ/運用
- `.env` を絶対にコミットしない（`.gitignore` 登録済み）
- サニタイズとZodでの検証により基本的なXSS/入力不正を軽減
- Slack 429 に対する指数バックオフと `Retry-After` をサポート

## よくあるトラブル
- `PrismaClientInitializationError: DATABASE_URL not found`
  - `.env` の `DATABASE_URL` を設定し、再実行
- `vitest: command not found`
  - `npm install` を再実行
- jsdom の `Not implemented: navigation` 警告
  - ブラウザAPI未実装による通知です（テスト側で考慮済み）

---

## ライセンス
本リポジトリのライセンスは別途明示がない限り、社内/プロジェクトポリシーに準拠します。


