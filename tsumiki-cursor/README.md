# Tsumiki for Cursor - AI駆動開発支援フレームワーク

TsumikiのAITDD（AI-assisted Test-Driven Development）概念をCursor向けにアレンジしたフレームワークです。

## 概要

Cursor環境でTsumikiの開発フローを実現するため、以下の構成で実装します：

1. **Markdownテンプレート群** - 各開発フェーズの文書テンプレート
2. **シェルスクリプト** - 開発フローの自動化
3. **プロンプトテンプレート** - AIへの指示を標準化

## ディレクトリ構造

```
tsumiki-cursor/
├── templates/           # 文書テンプレート
│   ├── requirements/   # 要件定義
│   ├── design/        # 設計文書
│   ├── tasks/         # タスク管理
│   └── tests/         # テスト仕様
├── scripts/           # 自動化スクリプト
├── prompts/          # AIプロンプト集
└── docs/             # プロジェクト文書
```

## 開発フロー

### 1. Kairo（回路）フロー
```
要件定義 → 設計 → タスク分割 → TDD実装
```

### 2. TDDフロー
```
要件定義 → テストケース作成 → Red → Green → Refactor → 検証
```

### 3. リバースエンジニアリング
```
既存コード分析 → タスク逆生成 → 設計逆生成 → 仕様逆生成 → 要件逆生成
```

## 使用方法

1. プロジェクトルートで初期化
```bash
./tsumiki-cursor/scripts/init.sh
```

2. 開発フローの選択
- Kairoフロー: `./tsumiki-cursor/scripts/kairo.sh`
- TDDフロー: `./tsumiki-cursor/scripts/tdd.sh`
- リバース: `./tsumiki-cursor/scripts/reverse.sh`

## 特徴

- **Cursor最適化**: Cursorの機能を最大限活用
- **マークダウン中心**: 全ての文書をMarkdownで管理
- **AI支援**: 各フェーズでAIが文書生成を支援
- **品質保証**: TDDによる品質担保
