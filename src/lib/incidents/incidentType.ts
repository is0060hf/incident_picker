/**
 * 緊急度と影響度からインシデントタイプを決定
 * 
 * 判定ルール:
 * - 緊急度が「中」以上 → 障害
 * - 影響度が「高」 → 障害
 * - それ以外 → 不具合
 * - 両方null → null
 * 
 * @param urgency 緊急度
 * @param impact 影響度
 * @returns インシデントタイプ
 */
export function determineIncidentType(
  urgency: 'high' | 'medium' | 'low' | null,
  impact: 'high' | 'medium' | 'low' | null
): '障害' | '不具合' | null {
  // 両方nullの場合は分類不可
  if (!urgency && !impact) {
    return null;
  }

  // 緊急度が中以上、または影響度が高の場合は「障害」
  if (
    urgency === 'high' || 
    urgency === 'medium' || 
    impact === 'high'
  ) {
    return '障害';
  }

  // それ以外は「不具合」
  return '不具合';
}
