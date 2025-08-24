import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createIncidentDetailApi } from '../src/lib/api/incidentDetailApi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('Incident Detail API (Red phase)', () => {
  let api: ReturnType<typeof createIncidentDetailApi>;

  beforeEach(() => {
    mockReset(mockPrisma);
    api = createIncidentDetailApi(mockPrisma);
  });

  describe('getIncidentDetail', () => {
    it('retrieves full incident details with Slack data', async () => {
      const mockIncident = {
        id: '1',
        channelId: 'ch1',
        messageId: 'msg1',
        urgency: 'high',
        impact: 'high',
        urgencyManual: false,
        impactManual: false,
        type: '障害',
        status: 'open',
        title: 'Database connection error',
        description: 'Connection pool exhausted',
        assignee: null,
        notes: null,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        channel: {
          id: 'ch1',
          slackChannelId: 'C123456',
          name: 'incidents',
          enabled: true,
        },
        message: {
          id: 'msg1',
          channelId: 'ch1',
          slackTs: '1704103200.123456',
          raw: {
            type: 'message',
            text: 'Database connection error occurred',
            user: 'U123456',
            ts: '1704103200.123456',
            thread_ts: '1704103200.123456',
            reply_count: 3,
          },
          postedAt: new Date('2024-01-01T10:00:00Z'),
          fetchedAt: new Date('2024-01-01T10:05:00Z'),
        },
      };

      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident as any);

      const result = await api.getIncidentDetail('1');

      expect(result).toEqual({
        incident: mockIncident,
        slackUrl: 'https://slack.com/archives/C123456/p1704103200123456',
        threadMessages: [],
      });

      expect(mockPrisma.incident.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          channel: true,
          message: true,
        },
      });
    });

    it('includes thread messages if available', async () => {
      const mockIncident = {
        id: '1',
        channelId: 'ch1',
        message: {
          slackTs: '1704103200.123456',
          channelId: 'ch1',
          raw: {
            thread_ts: '1704103200.123456',
          },
        },
        channel: {
          slackChannelId: 'C123456',
        },
      };

      const mockThreadMessages = [
        {
          id: 'msg2',
          slackTs: '1704103210.234567',
          raw: {
            type: 'message',
            text: 'Looking into this issue',
            user: 'U234567',
            ts: '1704103210.234567',
            thread_ts: '1704103200.123456',
          },
          postedAt: new Date('2024-01-01T10:00:10Z'),
        },
        {
          id: 'msg3',
          slackTs: '1704103220.345678',
          raw: {
            type: 'message',
            text: 'Found the root cause',
            user: 'U234567',
            ts: '1704103220.345678',
            thread_ts: '1704103200.123456',
          },
          postedAt: new Date('2024-01-01T10:00:20Z'),
        },
      ];

      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident as any);
      mockPrisma.slackMessage.findMany.mockResolvedValue(mockThreadMessages as any);

      const result = await api.getIncidentDetail('1');

      expect(result.threadMessages).toHaveLength(2);
      expect(result.threadMessages[0].raw.text).toBe('Looking into this issue');

      expect(mockPrisma.slackMessage.findMany).toHaveBeenCalledWith({
        where: {
          channelId: 'ch1',
          raw: {
            path: ['thread_ts'],
            equals: '1704103200.123456',
          },
          NOT: {
            slackTs: '1704103200.123456',
          },
        },
        orderBy: { slackTs: 'asc' },
      });
    });

    it('returns null for non-existent incident', async () => {
      mockPrisma.incident.findUnique.mockResolvedValue(null);

      const result = await api.getIncidentDetail('999');

      expect(result).toBeNull();
    });
  });

  describe('getIncidentHistory', () => {
    it('retrieves update history for incident', async () => {
      const mockHistory = [
        {
          id: 'h1',
          incidentId: '1',
          field: 'status',
          oldValue: 'open',
          newValue: 'in_progress',
          changedBy: 'user@example.com',
          changedAt: new Date('2024-01-01T11:00:00Z'),
        },
        {
          id: 'h2',
          incidentId: '1',
          field: 'urgency',
          oldValue: 'high',
          newValue: 'medium',
          changedBy: 'user@example.com',
          changedAt: new Date('2024-01-01T12:00:00Z'),
        },
      ];

      mockPrisma.incidentHistory.findMany.mockResolvedValue(mockHistory);

      const result = await api.getIncidentHistory('1');

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.incidentHistory.findMany).toHaveBeenCalledWith({
        where: { incidentId: '1' },
        orderBy: { changedAt: 'desc' },
      });
    });
  });

  describe('updateIncidentDetails', () => {
    it('updates manual fields and records history', async () => {
      const existingIncident = {
        id: '1',
        urgency: 'high',
        impact: 'high',
        status: 'open',
        assignee: null,
        notes: null,
      };

      const updateData = {
        urgency: 'medium',
        status: 'in_progress',
        assignee: 'john@example.com',
        notes: 'Working on fix',
      };

      mockPrisma.incident.findUnique.mockResolvedValue(existingIncident as any);
      mockPrisma.incident.update.mockResolvedValue({
        ...existingIncident,
        ...updateData,
        urgencyManual: true,
      } as any);

      // $transaction モックの設定
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        return await fn(mockPrisma);
      });

      await api.updateIncidentDetails('1', updateData, 'user@example.com');

      // 履歴の記録を確認
      expect(mockPrisma.incidentHistory.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            incidentId: '1',
            field: 'urgency',
            oldValue: 'high',
            newValue: 'medium',
            changedBy: 'user@example.com',
          }),
          expect.objectContaining({
            incidentId: '1',
            field: 'status',
            oldValue: 'open',
            newValue: 'in_progress',
            changedBy: 'user@example.com',
          }),
        ]),
      });
    });

    it('recalculates incident type when urgency/impact changes', async () => {
      const existingIncident = {
        id: '1',
        urgency: 'high',
        impact: 'high',
        type: '障害',
      };

      const updateData = {
        urgency: 'low',
        impact: 'low',
      };

      mockPrisma.incident.findUnique.mockResolvedValue(existingIncident as any);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        return await fn(mockPrisma);
      });

      await api.updateIncidentDetails('1', updateData, 'user@example.com');

      expect(mockPrisma.incident.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          urgency: 'low',
          impact: 'low',
          urgencyManual: true,
          impactManual: true,
          type: '不具合', // 自動的に再計算される
        }),
      });
    });
  });

  describe('exportIncidentData', () => {
    it('exports incident data with full Slack raw data', async () => {
      const mockIncident = {
        id: '1',
        title: 'Test incident',
        channelId: 'ch1',
        message: {
          slackTs: '1704103200.123456',
          raw: { text: 'Original message' },
        },
        channel: {
          slackChannelId: 'C123456',
          name: 'incidents',
        },
      };

      const mockThreadMessages = [
        { raw: { text: 'Reply 1' } },
        { raw: { text: 'Reply 2' } },
      ];

      const mockHistory = [
        { field: 'status', oldValue: 'open', newValue: 'closed' },
      ];

      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident as any);
      mockPrisma.slackMessage.findMany.mockResolvedValue([]);
      mockPrisma.incidentHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await api.exportIncidentData('1');

      expect(result).toEqual({
        incident: mockIncident,
        slackThread: {
          original: { text: 'Original message' },
          replies: [],
        },
        history: mockHistory,
      });
    });
  });
});
