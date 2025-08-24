// ドメイン: ルール（緊急度・影響度）

export type RuleKind = 'urgency' | 'impact';

export type UrgencyValue = 'high' | 'medium' | 'low';
export type ImpactValue = 'high' | 'medium' | 'low';

export interface RuleInput {
  name: string;
  kind: RuleKind;
  pattern: string; // 正規表現文字列
  value: UrgencyValue | ImpactValue;
  enabled: boolean;
}

export interface RuleRecord extends RuleInput {
  id: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}
