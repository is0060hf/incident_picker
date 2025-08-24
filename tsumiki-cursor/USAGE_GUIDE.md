# Tsumiki for Cursor 使用ガイド

## インシデント管理システム開発での活用方法

### 1. 現在の状況
- ✅ 要件定義書作成済み（`tsumiki-cursor/docs/requirements/requirements.md`）
- 次のステップ: 設計フェーズ

### 2. Kairoフローの実行手順

#### ステップ1: 設計フェーズ
```bash
./tsumiki-cursor/scripts/kairo.sh
# オプション2（設計）を選択
```

設計文書作成時のプロンプト例：
```
要件定義書（tsumiki-cursor/docs/requirements/requirements.md）を基に、
インシデント管理システムの詳細設計を行ってください。

特に以下の点を重視してください：
1. Next.js App Routerを使用したアーキテクチャ
2. Neon PostgreSQLのデータベース設計
3. Slack API連携の詳細設計
4. WCAG2.2準拠のUI設計
5. セキュリティ設計（認証・認可）
```

#### ステップ2: タスク分割フェーズ
```bash
./tsumiki-cursor/scripts/kairo.sh
# オプション3（タスク分割）を選択
```

#### ステップ3: TDD実装フェーズ
```bash
./tsumiki-cursor/scripts/kairo.sh
# オプション4（TDD実装）を選択
```

### 3. 各フェーズでのCursor活用方法

#### 設計フェーズ
1. `tsumiki-cursor/docs/design/design.md`を開く
2. 要件定義書を参照しながらAIに設計を依頼
3. 生成された設計をレビュー・修正

#### タスク分割フェーズ
1. `tsumiki-cursor/docs/tasks/tasks.md`を開く
2. 設計文書を基にタスクを細分化
3. 依存関係と優先順位を設定

#### TDD実装フェーズ
1. タスクごとにTDDサイクルを実行
2. Red → Green → Refactorの順序を厳守
3. 各フェーズでテストを実行

### 4. 推奨されるプロジェクト構造

```
incident_picker/
├── tsumiki-cursor/          # Tsumikiフレームワーク
│   ├── docs/               # プロジェクト文書
│   │   ├── requirements/   # 要件定義
│   │   ├── design/        # 設計文書
│   │   ├── tasks/         # タスク管理
│   │   └── tests/         # テスト仕様
│   └── ...
├── src/                    # ソースコード
│   ├── app/               # Next.js App Router
│   ├── components/        # UIコンポーネント
│   ├── lib/              # ライブラリ・ユーティリティ
│   └── ...
├── tests/                 # テストコード
└── ...
```

### 5. 次のアクション

1. **設計フェーズの実行**
   ```bash
   ./tsumiki-cursor/scripts/kairo.sh
   # オプション2を選択
   ```

2. **設計文書の作成**
   - Cursorで`tsumiki-cursor/docs/design/design.md`を開く
   - プロンプトを使用してAIに設計を依頼

3. **設計レビュー**
   - 生成された設計をレビュー
   - 必要に応じて修正

### 6. Tips

- 各フェーズは順番に実行することを推奨
- 文書は常にMarkdown形式で管理
- AIへのプロンプトは具体的に
- テストファーストの原則を守る
- WCAG2.2準拠を常に意識する
