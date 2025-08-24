import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import { createRulesApi } from '../src/lib/api/rulesApi';

describe('Rules CRUD API (Red phase)', () => {
  const api = createRulesApi(prisma);

  beforeEach(async () => {
    // Clean up before each test
    await prisma.urgencyRule.deleteMany();
    await prisma.impactRule.deleteMany();
  });

  describe('Urgency Rules', () => {
    it('creates and lists urgency rules', async () => {
      const input = {
        name: 'Critical Error Rule',
        pattern: 'critical|fatal|emergency',
        value: 'high' as const,
        enabled: true,
      };

      const created = await api.createUrgencyRule(input);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Critical Error Rule');
      expect(created.pattern).toBe('critical|fatal|emergency');
      expect(created.value).toBe('high');
      expect(created.enabled).toBe(true);

      const rules = await api.listUrgencyRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe(created.id);
    });

    it('updates urgency rule', async () => {
      const created = await api.createUrgencyRule({
        name: 'Test Rule',
        pattern: 'test',
        value: 'low',
        enabled: true,
      });

      const updated = await api.updateUrgencyRule(created.id, {
        name: 'Updated Rule',
        pattern: 'test|updated',
        value: 'medium',
        enabled: false,
      });

      expect(updated.name).toBe('Updated Rule');
      expect(updated.pattern).toBe('test|updated');
      expect(updated.value).toBe('medium');
      expect(updated.enabled).toBe(false);
    });

    it('deletes urgency rule', async () => {
      const created = await api.createUrgencyRule({
        name: 'To Delete',
        pattern: 'delete',
        value: 'low',
        enabled: true,
      });

      await api.deleteUrgencyRule(created.id);

      const rules = await api.listUrgencyRules();
      expect(rules).toHaveLength(0);
    });

    it('filters enabled urgency rules', async () => {
      await api.createUrgencyRule({
        name: 'Enabled Rule',
        pattern: 'enabled',
        value: 'high',
        enabled: true,
      });

      await api.createUrgencyRule({
        name: 'Disabled Rule',
        pattern: 'disabled',
        value: 'low',
        enabled: false,
      });

      const enabledRules = await api.listUrgencyRules({ enabled: true });
      expect(enabledRules).toHaveLength(1);
      expect(enabledRules[0].name).toBe('Enabled Rule');
    });
  });

  describe('Impact Rules', () => {
    it('creates and lists impact rules', async () => {
      const input = {
        name: 'All Users Rule',
        pattern: 'all.*users|everyone|全ユーザー',
        value: 'high' as const,
        enabled: true,
      };

      const created = await api.createImpactRule(input);
      expect(created.id).toBeDefined();
      expect(created.name).toBe('All Users Rule');
      expect(created.pattern).toBe('all.*users|everyone|全ユーザー');
      expect(created.value).toBe('high');
      expect(created.enabled).toBe(true);

      const rules = await api.listImpactRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe(created.id);
    });

    it('updates impact rule', async () => {
      const created = await api.createImpactRule({
        name: 'Test Rule',
        pattern: 'test',
        value: 'low',
        enabled: true,
      });

      const updated = await api.updateImpactRule(created.id, {
        name: 'Updated Rule',
        pattern: 'test|updated',
        value: 'medium',
        enabled: false,
      });

      expect(updated.name).toBe('Updated Rule');
      expect(updated.pattern).toBe('test|updated');
      expect(updated.value).toBe('medium');
      expect(updated.enabled).toBe(false);
    });

    it('deletes impact rule', async () => {
      const created = await api.createImpactRule({
        name: 'To Delete',
        pattern: 'delete',
        value: 'low',
        enabled: true,
      });

      await api.deleteImpactRule(created.id);

      const rules = await api.listImpactRules();
      expect(rules).toHaveLength(0);
    });
  });
});
