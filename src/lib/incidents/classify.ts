export type Urgency = 'high' | 'medium' | 'low';
export type Impact = 'high' | 'medium' | 'low';
export type IncidentLevel = 'outage' | 'bug';

/**
 * 緊急度を判定する簡易ルール（ハードコード版）。
 * 後にDB管理のルール（urgency_rules）に置換可能な構成。
 */
export function classifyUrgency(messageText: string): Urgency {
  const HIGH_URGENCY_PATTERNS: readonly RegExp[] = [
    /緊急/,
    /至急/,
    /クリティカル/,
    /停止/,
    /障害/,
  ];

  if (matchesAnyPattern(messageText, HIGH_URGENCY_PATTERNS)) {
    return 'high';
  }

  // TODO: medium相当の語彙を定義（例: "遅延", "不安定" など）。現状テスト要件外のため未導入。
  return 'low';
}

/**
 * 影響度を文言から推定（簡易ルール）。
 */
export function classifyImpact(messageText: string): Impact {
  if (messageText.includes('全ユーザー')) {
    return 'high';
  }
  if (messageText.includes('複数ユーザー')) {
    return 'medium';
  }
  if (messageText.includes('特定ユーザー')) {
    return 'low';
  }
  return 'low';
}

export function determineIncidentLevel(urgency: Urgency, impact: Impact): IncidentLevel {
  const isUrgencyAtLeastMedium: boolean = urgency === 'high' || urgency === 'medium';
  if (isUrgencyAtLeastMedium || impact === 'high') {
    return 'outage';
  }
  return 'bug';
}

/** パターンのいずれかに一致するか */
function matchesAnyPattern(text: string, patterns: readonly RegExp[]): boolean {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}


