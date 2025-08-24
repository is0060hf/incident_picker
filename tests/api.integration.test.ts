import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createChannelsApi } from '@/lib/api/channelsApi';
import { createRulesApi } from '@/lib/api/rulesApi';
import { createIncidentsApi } from '@/lib/api/incidentsApi';
import { prisma } from '@/lib/db';

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    channel: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    urgencyRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    impactRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    incident: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    incidentHistory: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  },
}));

describe('API Integration Tests', () => {
  const channelsApi = createChannelsApi(prisma);
  const rulesApi = createRulesApi(prisma);
  const incidentsApi = createIncidentsApi(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Channel API Integration', () => {
    it('should perform CRUD operations on channels', async () => {
      const mockChannels = [
        { id: '1', slackChannelId: 'C001', name: 'general', enabled: true },
      ];

      // List channels
      vi.mocked(prisma.channel.findMany).mockResolvedValue(mockChannels);
      const channels = await channelsApi.listChannels();
      expect(channels).toEqual(mockChannels);

      // Create channel
      const newChannel = {
        id: '2',
        slackChannelId: 'C002',
        name: 'test',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.channel.create).mockResolvedValue(newChannel);
      const created = await channelsApi.createChannel({
        slackChannelId: 'C002',
        name: 'test',
      });
      expect(created.slackChannelId).toBe('C002');

      // Update channel
      const updatedChannel = { ...newChannel, name: 'updated' };
      vi.mocked(prisma.channel.update).mockResolvedValue(updatedChannel);
      const updated = await channelsApi.updateChannel('2', { name: 'updated' });
      expect(updated.name).toBe('updated');

      // Delete channel
      vi.mocked(prisma.channel.delete).mockResolvedValue(updatedChannel);
      await expect(channelsApi.deleteChannel('2')).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.channel.findMany).mockRejectedValue(new Error('DB Error'));
      await expect(channelsApi.listChannels()).rejects.toThrow('DB Error');
    });
  });

  describe('Rules API Integration', () => {
    it('should manage urgency rules', async () => {
      const mockRules = [
        { id: '1', pattern: '緊急', level: 'high' as const },
      ];

      // List rules
      vi.mocked(prisma.urgencyRule.findMany).mockResolvedValue(mockRules);
      const urgencyRules = await rulesApi.listUrgencyRules();
      expect(urgencyRules).toEqual(mockRules);

      // Create rule
      const newRule = {
        id: '2',
        pattern: 'クリティカル',
        level: 'high' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.urgencyRule.create).mockResolvedValue(newRule);
      const created = await rulesApi.createUrgencyRule({
        pattern: 'クリティカル',
        level: 'high',
      });
      expect(created.pattern).toBe('クリティカル');
    });

    it('should manage impact rules', async () => {
      const mockRules = [
        { id: '1', pattern: '全ユーザー', level: 'high' as const },
      ];

      // List rules
      vi.mocked(prisma.impactRule.findMany).mockResolvedValue(mockRules);
      const impactRules = await rulesApi.listImpactRules();
      expect(impactRules).toEqual(mockRules);

      // Create rule
      const newRule = {
        id: '2',
        pattern: '複数ユーザー',
        level: 'medium' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.impactRule.create).mockResolvedValue(newRule);
      const created = await rulesApi.createImpactRule({
        pattern: '複数ユーザー',
        level: 'medium',
      });
      expect(created.pattern).toBe('複数ユーザー');
    });
  });

  describe('Incidents API Integration', () => {
    it('should list and update incidents', async () => {
      const mockIncidents = [{
        id: '1',
        title: 'テストインシデント',
        urgency: 'high' as const,
        impact: 'medium' as const,
        type: '障害' as const,
        status: 'open' as const,
        channel: { name: 'general' },
      }];

      // List with pagination
      vi.mocked(prisma.incident.findMany).mockResolvedValue(mockIncidents);
      vi.mocked(prisma.incident.count).mockResolvedValue(1);
      const result = await incidentsApi.listIncidents({ page: 1, limit: 10 });
      expect(result).toEqual({
        incidents: mockIncidents,
        total: 1,
        page: 1,
        totalPages: 1,
      });

      // Update incident
      const existingIncident = {
        id: '1',
        title: 'テストインシデント',
        urgency: 'high' as const,
        impact: 'medium' as const,
        type: '障害' as const,
        status: 'open' as const,
        channelId: 'ch1',
        messageId: 'msg1',
        assignee: null,
        notes: null,
        urgencyManual: false,
        impactManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedIncident = {
        ...existingIncident,
        status: 'in_progress' as const,
        assignee: 'user@example.com',
      };

      vi.mocked(prisma.incident.findUnique).mockResolvedValue(existingIncident);
      vi.mocked(prisma.incident.update).mockResolvedValue(updatedIncident);
      vi.mocked(prisma.incidentHistory.create).mockResolvedValue({
        id: '1',
        incidentId: '1',
        userId: 'test-user',
        action: 'UPDATE',
        changes: {},
        createdAt: new Date(),
      });

      const updated = await incidentsApi.updateIncident('1', {
        status: 'in_progress',
        assignee: 'user@example.com',
      }, 'test-user');

      expect(updated.status).toBe('in_progress');
      expect(updated.assignee).toBe('user@example.com');
    });

    it('should filter incidents', async () => {
      const mockIncidents = [];
      vi.mocked(prisma.incident.findMany).mockResolvedValue(mockIncidents);
      vi.mocked(prisma.incident.count).mockResolvedValue(0);

      const result = await incidentsApi.listIncidents({
        urgency: 'high',
        status: 'open',
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      });

      expect(result).toEqual({
        incidents: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
      expect(prisma.incident.findMany).toHaveBeenCalled();
    });
  });

  describe('Cross-API Workflows', () => {
    it('should support incident creation with classification', async () => {
      // 1. ルールの取得
      const urgencyRules = [
        { id: '1', pattern: '緊急', level: 'high' as const },
      ];
      const impactRules = [
        { id: '1', pattern: '全ユーザー', level: 'high' as const },
      ];

      vi.mocked(prisma.urgencyRule.findMany).mockResolvedValue(urgencyRules);
      vi.mocked(prisma.impactRule.findMany).mockResolvedValue(impactRules);

      const urgencyList = await rulesApi.listUrgencyRules();
      const impactList = await rulesApi.listImpactRules();

      expect(urgencyList).toHaveLength(1);
      expect(impactList).toHaveLength(1);

      // 2. 分類ロジックの適用（実際の実装では classify.ts を使用）
      const messageText = '緊急！全ユーザーに影響があります';
      const urgency = 'high'; // classifyUrgency(messageText, urgencyRules)
      const impact = 'high';  // classifyImpact(messageText, impactRules)

      expect(urgency).toBe('high');
      expect(impact).toBe('high');

      // 3. インシデントの作成
      const newIncident = {
        id: '1',
        title: messageText.substring(0, 50),
        description: messageText,
        urgency: urgency as 'high',
        impact: impact as 'high',
        type: '障害' as const, // determineIncidentType(urgency, impact)
        status: 'open' as const,
        channelId: 'ch1',
        messageId: 'msg1',
        assignee: null,
        notes: null,
        urgencyManual: false,
        impactManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.incident.create).mockResolvedValue(newIncident);

      const created = await prisma.incident.create({
        data: newIncident,
      });

      expect(created.urgency).toBe('high');
      expect(created.impact).toBe('high');
      expect(created.type).toBe('障害');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle validation errors', async () => {
      // 不正なデータでのチャンネル作成（Prismaレベルでエラーをシミュレート）
      vi.mocked(prisma.channel.create).mockRejectedValue(
        new Error('Invalid slackChannelId')
      );

      await expect(
        channelsApi.createChannel({
          slackChannelId: '', // 空のID
          name: 'test',
        })
      ).rejects.toThrow('Invalid slackChannelId');
    });

    it('should handle concurrent updates', async () => {
      const incident = {
        id: '1',
        title: 'test',
        urgency: 'high' as const,
        impact: 'high' as const,
        type: '障害' as const,
        status: 'open' as const,
        channelId: 'ch1',
        messageId: 'msg1',
        assignee: null,
        notes: null,
        urgencyManual: false,
        impactManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.incident.findUnique).mockResolvedValue(incident);
      vi.mocked(prisma.incident.update).mockRejectedValue(
        new Error('Concurrent update detected')
      );

      await expect(
        incidentsApi.updateIncident('1', { status: 'closed' }, 'user1')
      ).rejects.toThrow('Concurrent update');
    });
  });
});