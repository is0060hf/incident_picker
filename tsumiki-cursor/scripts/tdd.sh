#!/bin/bash

# Tsumiki for Cursor - TDDフロー実行スクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." &> /dev/null && pwd)"
TSUMIKI_DIR="$PROJECT_ROOT/tsumiki-cursor"
DOCS_DIR="$TSUMIKI_DIR/docs"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ヘッダー表示
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Tsumiki for Cursor - TDDフロー${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ディレクトリの作成
mkdir -p "$DOCS_DIR/tests"

# TDDフェーズ選択
echo -e "${GREEN}実行するTDDフェーズを選択してください:${NC}"
echo "1) テスト仕様作成"
echo "2) Red - テスト実装（失敗）"
echo "3) Green - 最小実装（成功）"
echo "4) Refactor - リファクタリング"
echo "5) Verify - 完了確認"
echo "6) 全フェーズ実行"
echo -n "選択 [1-6]: "
read -r phase

case $phase in
    1)
        echo -e "\n${YELLOW}=== テスト仕様作成フェーズ ===${NC}"
        cp "$TSUMIKI_DIR/templates/tests/template.md" "$DOCS_DIR/tests/test_spec.md"
        echo "テスト仕様書テンプレートを作成しました: $DOCS_DIR/tests/test_spec.md"
        echo "Cursorで開いて、AIにテスト仕様の作成を依頼してください。"
        ;;
    2)
        echo -e "\n${RED}=== Red - テスト実装フェーズ ===${NC}"
        echo "テストファイルを作成します。"
        echo "プロンプト例:"
        echo "「テスト仕様書に基づいて、失敗するテストケースを実装してください。」"
        echo ""
        echo "テストが失敗することを確認してください。"
        ;;
    3)
        echo -e "\n${GREEN}=== Green - 最小実装フェーズ ===${NC}"
        echo "テストを通すための最小限の実装を行います。"
        echo "プロンプト例:"
        echo "「テストを通すための最小限の実装を行ってください。」"
        echo ""
        echo "全てのテストが成功することを確認してください。"
        ;;
    4)
        echo -e "\n${BLUE}=== Refactor - リファクタリングフェーズ ===${NC}"
        echo "コードの品質を向上させます。"
        echo "プロンプト例:"
        echo "「テストを維持しながら、コードをリファクタリングしてください。」"
        echo ""
        echo "リファクタリング後もテストが成功することを確認してください。"
        ;;
    5)
        echo -e "\n${GREEN}=== Verify - 完了確認フェーズ ===${NC}"
        echo "TDDサイクルの完了を確認します:"
        echo "- [ ] 全てのテストが成功している"
        echo "- [ ] コードカバレッジが適切である"
        echo "- [ ] コードが読みやすく保守しやすい"
        echo "- [ ] 要件を満たしている"
        ;;
    6)
        echo -e "\n${YELLOW}=== TDD全フェーズ実行 ===${NC}"
        echo "各フェーズを順番に実行します。"
        echo "続行しますか？ [y/N]: "
        read -r confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            for i in {1..5}; do
                "$0" $i
                echo -e "\n${GREEN}フェーズ$iを完了したら、Enterキーを押して次に進んでください。${NC}"
                read -r
            done
        fi
        ;;
    *)
        echo "無効な選択です。"
        exit 1
        ;;
esac

echo -e "\n${GREEN}完了しました。${NC}"
