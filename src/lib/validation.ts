// バリデーション関連の関数

import { z } from 'zod';
import { URGENCY_LEVELS, IMPACT_LEVELS, INCIDENT_TYPES, INCIDENT_STATUS } from './constants';

/**
 * 共通のバリデーションスキーマ
 */
export const validationSchemas = {
  // ID
  id: z.string().uuid('無効なIDです'),
  
  // ページネーション
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // 日付
  dateString: z.string().datetime('無効な日付形式です'),
  
  // 緊急度
  urgency: z.enum([URGENCY_LEVELS.HIGH, URGENCY_LEVELS.MEDIUM, URGENCY_LEVELS.LOW]),
  urgencyOptional: z.enum([URGENCY_LEVELS.HIGH, URGENCY_LEVELS.MEDIUM, URGENCY_LEVELS.LOW]).optional(),
  
  // 影響度
  impact: z.enum([IMPACT_LEVELS.HIGH, IMPACT_LEVELS.MEDIUM, IMPACT_LEVELS.LOW]),
  impactOptional: z.enum([IMPACT_LEVELS.HIGH, IMPACT_LEVELS.MEDIUM, IMPACT_LEVELS.LOW]).optional(),
  
  // インシデントタイプ
  incidentType: z.enum([INCIDENT_TYPES.OUTAGE, INCIDENT_TYPES.BUG]),
  incidentTypeOptional: z.enum([INCIDENT_TYPES.OUTAGE, INCIDENT_TYPES.BUG]).optional(),
  
  // ステータス
  status: z.enum([
    INCIDENT_STATUS.OPEN,
    INCIDENT_STATUS.IN_PROGRESS,
    INCIDENT_STATUS.RESOLVED,
    INCIDENT_STATUS.CLOSED,
  ]),
  
  // 検索クエリ
  searchQuery: z.string().min(1).max(100),
  
  // Slackチャンネル
  slackChannelId: z.string().regex(/^C[A-Z0-9]+$/, 'Invalid Slack channel ID format'),
};

/**
 * インシデント作成/更新用のスキーマ
 */
export const incidentSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().max(2000, '説明は2000文字以内で入力してください').optional(),
  urgency: validationSchemas.urgencyOptional,
  impact: validationSchemas.impactOptional,
  status: validationSchemas.status,
  assignee: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * ルール作成/更新用のスキーマ
 */
export const ruleSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  pattern: z.string().min(1, 'パターンは必須です').max(200, 'パターンは200文字以内で入力してください'),
  value: z.enum([URGENCY_LEVELS.HIGH, URGENCY_LEVELS.MEDIUM, URGENCY_LEVELS.LOW]),
  enabled: z.boolean().default(true),
});

/**
 * フィルタ用のスキーマ
 */
export const filterSchema = z.object({
  urgency: z.array(validationSchemas.urgency).optional(),
  impact: z.array(validationSchemas.impact).optional(),
  type: validationSchemas.incidentTypeOptional,
  status: z.array(validationSchemas.status).optional(),
  channelId: validationSchemas.id.optional(),
  from: validationSchemas.dateString.optional(),
  to: validationSchemas.dateString.optional(),
  q: validationSchemas.searchQuery.optional(),
});

/**
 * URLパラメータから配列を取得するヘルパー
 */
export function parseArrayParam(param: string | null): string[] | undefined {
  if (!param) return undefined;
  return param.split(',').filter(Boolean);
}

/**
 * バリデーションエラーをユーザーフレンドリーなメッセージに変換
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
}
