// インシデント分類用のパターン定義

/**
 * 緊急度判定用のパターン
 */
export const URGENCY_PATTERNS = {
  HIGH: [
    /緊急/,
    /至急/,
    /クリティカル/,
    /停止/,
    /即座/,
  ] as const,
  
  MEDIUM: [
    /エラー/,
    /不具合/,
    /問題/,
    /対応/,
  ] as const,
} as const;

/**
 * 影響度判定用のパターン
 */
export const IMPACT_PATTERNS = {
  HIGH: [
    /全ユーザー/,
    /すべて.*お客様/,
    /全体/,
    /サービス全体/,
  ] as const,
  
  MEDIUM: [
    /複数のお客様/,
    /複数.*ユーザー/,
    /一部.*お客様/,
    /特定.*機能/,
    /部分的/,
  ] as const,
  
  LOW: [
    /特定ユーザー.*のみ/,
    /個別/,
    /限定的/,
    /一人.*お客様/,
  ] as const,
} as const;

/**
 * パターンマッチングのユーティリティ関数
 */
export function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text));
}
