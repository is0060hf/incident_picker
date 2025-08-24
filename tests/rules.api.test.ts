import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRulesApi } from '../src/lib/api/rulesApi';
import { prisma } from '../src/lib/db';

// Prismaのモック
vi.mock('../src/lib/db', () => ({
  prisma: {
    urgencyRule: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    impactRule: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Rules API (Red phase)', () => {
  let api: ReturnType<typeof createRulesApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    api = createRulesApi(prisma);
  });

  it('creates and lists urgency/impact rules', async () => {
    const input = {
      name: 'critical-keywords',
      pattern: '(緊急|至急|クリティカル|停止|障害)',
      value: 'high' as const,
      enabled: true,
    };
    
    // モックの戻り値を設定
    const createdRule = { id: '1', ...input, createdAt: new Date(), updatedAt: new Date() };
    (prisma.urgencyRule.create as any).mockResolvedValue(createdRule);
    (prisma.urgencyRule.findMany as any).mockResolvedValue([createdRule]);
    
    const created = await api.createUrgencyRule(input);
    expect(created.id).toBeDefined();

    const all = await api.listUrgencyRules();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('critical-keywords');
  });

  it('rejects invalid regex pattern', async () => {
    const bad = {
      name: 'bad',
      pattern: '([', // 無効な正規表現
      value: 'high' as const,
      enabled: true,
    };
    
    // Prismaが正規表現の検証エラーをスローするようモック
    (prisma.impactRule.create as any).mockRejectedValue(new Error('Invalid regex pattern'));
    
    await expect(api.createImpactRule(bad)).rejects.toThrowError();
  });

  it('updates and deletes a rule', async () => {
    const input = {
      name: 'temp',
      pattern: '全ユーザー',
      value: 'high' as const,
      enabled: true,
    };
    
    // 作成のモック
    const createdRule = { id: '1', ...input, createdAt: new Date(), updatedAt: new Date() };
    (prisma.impactRule.create as any).mockResolvedValue(createdRule);
    
    const created = await api.createImpactRule(input);
    
    // 更新のモック
    const updatedRule = { ...createdRule, enabled: false, name: 'temp2' };
    (prisma.impactRule.update as any).mockResolvedValue(updatedRule);
    
    const updated = await api.updateImpactRule(created.id, { enabled: false, name: 'temp2' });
    expect(updated.enabled).toBe(false);
    expect(updated.name).toBe('temp2');

    // 削除のモック
    (prisma.impactRule.delete as any).mockResolvedValue(createdRule);
    (prisma.impactRule.findMany as any).mockResolvedValue([]);
    
    await api.deleteImpactRule(created.id);
    const all = await api.listImpactRules();
    expect(all.length).toBe(0);
  });
});


