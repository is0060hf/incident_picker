export type Urgency = 'high' | 'medium' | 'low';
export type Impact = 'high' | 'medium' | 'low';
export type IncidentLevel = 'outage' | 'bug';

export interface ClassificationRule {
  pattern: string;
  level: 'high' | 'medium' | 'low';
}

/**
 * 緊急度を判定する。カスタムルールも適用可能。
 */
export function classifyUrgency(messageText: string | null | undefined, customRules: ClassificationRule[] = []): Urgency {
  if (!messageText) {
    return 'low';
  }

  // カスタムルールを優先的に適用
  for (const rule of customRules) {
    if (rule.pattern && messageText.includes(rule.pattern)) {
      return rule.level;
    }
  }

  const HIGH_URGENCY_PATTERNS: readonly RegExp[] = [
    /緊急/,
    /至急/,
    /クリティカル/,
    /停止/,
    /即座/,
  ];

  const MEDIUM_URGENCY_PATTERNS: readonly RegExp[] = [
    /エラー/,
    /不具合/,
    /問題/,
    /対応/,
  ];

  if (matchesAnyPattern(messageText, HIGH_URGENCY_PATTERNS)) {
    return 'high';
  }

  if (matchesAnyPattern(messageText, MEDIUM_URGENCY_PATTERNS)) {
    return 'medium';
  }

  return 'low';
}

/**
 * 影響度を文言から推定。カスタムルールも適用可能。
 */
export function classifyImpact(messageText: string | null | undefined, customRules: ClassificationRule[] = []): Impact {
  if (!messageText) {
    return 'low';
  }

  // カスタムルールを優先的に適用
  for (const rule of customRules) {
    if (rule.pattern && messageText.includes(rule.pattern)) {
      return rule.level;
    }
  }

  const HIGH_IMPACT_PATTERNS: readonly RegExp[] = [
    /全ユーザー/,
    /すべて.*お客様/,
    /全体/,
    /サービス全体/,
  ];

  const MEDIUM_IMPACT_PATTERNS: readonly RegExp[] = [
    /複数のお客様/,
    /複数.*ユーザー/,
    /一部.*お客様/,
    /特定.*機能/,
    /部分的/,
  ];

  const LOW_IMPACT_PATTERNS: readonly RegExp[] = [
    /特定ユーザー.*のみ/,
    /個別/,
    /限定的/,
    /一人.*お客様/,
  ];

  // 低→中→高の順で評価し、最も高いレベルを返す
  if (matchesAnyPattern(messageText, LOW_IMPACT_PATTERNS)) {
    // 他の高いレベルのパターンもチェック
    if (matchesAnyPattern(messageText, MEDIUM_IMPACT_PATTERNS)) {
      if (matchesAnyPattern(messageText, HIGH_IMPACT_PATTERNS)) {
        return 'high';
      }
      return 'medium';
    }
    return 'low';
  }
  
  if (matchesAnyPattern(messageText, MEDIUM_IMPACT_PATTERNS)) {
    if (matchesAnyPattern(messageText, HIGH_IMPACT_PATTERNS)) {
      return 'high';
    }
    return 'medium';
  }
  
  if (matchesAnyPattern(messageText, HIGH_IMPACT_PATTERNS)) {
    return 'high';
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


