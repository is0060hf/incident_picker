import { UrgencyRule, ImpactRule } from '@prisma/client';

type PriorityLevel = 'high' | 'medium' | 'low';

const priorityOrder: Record<PriorityLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * メッセージテキストから緊急度を自動判定
 * @param text 判定対象のテキスト
 * @param rules 有効な緊急度ルール
 * @returns 判定された緊急度、マッチしない場合はnull
 */
export function classifyUrgency(text: string, rules: UrgencyRule[]): PriorityLevel | null {
  // 有効なルールのみフィルタ
  const enabledRules = rules.filter(rule => rule.enabled);
  
  if (enabledRules.length === 0) {
    return null;
  }

  let highestPriority: PriorityLevel | null = null;
  let highestScore = 0;

  for (const rule of enabledRules) {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(text)) {
        const score = priorityOrder[rule.value as PriorityLevel];
        if (score > highestScore) {
          highestScore = score;
          highestPriority = rule.value as PriorityLevel;
        }
      }
    } catch (e) {
      // 不正な正規表現の場合はスキップ
      console.error(`Invalid regex pattern in rule ${rule.id}: ${rule.pattern}`, e);
    }
  }

  return highestPriority;
}

/**
 * メッセージテキストから影響度を自動判定
 * @param text 判定対象のテキスト
 * @param rules 有効な影響度ルール
 * @returns 判定された影響度、マッチしない場合はnull
 */
export function classifyImpact(text: string, rules: ImpactRule[]): PriorityLevel | null {
  // 有効なルールのみフィルタ
  const enabledRules = rules.filter(rule => rule.enabled);
  
  if (enabledRules.length === 0) {
    return null;
  }

  let highestPriority: PriorityLevel | null = null;
  let highestScore = 0;

  for (const rule of enabledRules) {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(text)) {
        const score = priorityOrder[rule.value as PriorityLevel];
        if (score > highestScore) {
          highestScore = score;
          highestPriority = rule.value as PriorityLevel;
        }
      }
    } catch (e) {
      // 不正な正規表現の場合はスキップ
      console.error(`Invalid regex pattern in rule ${rule.id}: ${rule.pattern}`, e);
    }
  }

  return highestPriority;
}
