import { PrismaClient, UrgencyRule, ImpactRule } from '@prisma/client';

export interface RuleInput {
  name: string;
  pattern: string;
  value: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface RuleUpdateInput {
  name?: string;
  pattern?: string;
  value?: 'high' | 'medium' | 'low';
  enabled?: boolean;
}

export interface ListRulesOptions {
  enabled?: boolean;
}

/**
 * ルール管理API
 * 緊急度・影響度の自動判定ルールのCRUD操作を提供
 */
export function createRulesApi(prisma: PrismaClient) {
  /**
   * フィルタ条件からwhereクエリを構築
   */
  function buildWhereClause(options?: ListRulesOptions) {
    return options?.enabled !== undefined ? { enabled: options.enabled } : undefined;
  }

  return {
    // 緊急度ルール
    /**
     * 緊急度ルール一覧を取得
     */
    async listUrgencyRules(options?: ListRulesOptions): Promise<UrgencyRule[]> {
      return await prisma.urgencyRule.findMany({
        where: buildWhereClause(options),
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * 緊急度ルールを作成
     */
    async createUrgencyRule(input: RuleInput): Promise<UrgencyRule> {
      return await prisma.urgencyRule.create({
        data: input,
      });
    },

    /**
     * 緊急度ルールを更新
     */
    async updateUrgencyRule(id: string, input: RuleUpdateInput): Promise<UrgencyRule> {
      return await prisma.urgencyRule.update({
        where: { id },
        data: input,
      });
    },

    /**
     * 緊急度ルールを削除
     */
    async deleteUrgencyRule(id: string): Promise<void> {
      await prisma.urgencyRule.delete({
        where: { id },
      });
    },

    // 影響度ルール
    /**
     * 影響度ルール一覧を取得
     */
    async listImpactRules(options?: ListRulesOptions): Promise<ImpactRule[]> {
      return await prisma.impactRule.findMany({
        where: buildWhereClause(options),
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * 影響度ルールを作成
     */
    async createImpactRule(input: RuleInput): Promise<ImpactRule> {
      return await prisma.impactRule.create({
        data: input,
      });
    },

    /**
     * 影響度ルールを更新
     */
    async updateImpactRule(id: string, input: RuleUpdateInput): Promise<ImpactRule> {
      return await prisma.impactRule.update({
        where: { id },
        data: input,
      });
    },

    /**
     * 影響度ルールを削除
     */
    async deleteImpactRule(id: string): Promise<void> {
      await prisma.impactRule.delete({
        where: { id },
      });
    },
  } as const;
}
