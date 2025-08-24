import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuditApi } from '../src/lib/api/auditApi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('Audit API (Red phase)', () => {
  let api: ReturnType<typeof createAuditApi>;

  beforeEach(() => {
    mockReset(mockPrisma);
    api = createAuditApi(mockPrisma);
  });

  describe('logAction', () => {
    it('logs a user action', async () => {
      const mockAudit = {
        id: '1',
        userId: 'user1',
        action: 'UPDATE_INCIDENT',
        targetType: 'incident',
        targetId: 'inc1',
        changes: {
          urgency: { from: 'low', to: 'high' },
          impact: { from: 'medium', to: 'high' },
        },
        metadata: {
          incidentTitle: 'Database connection error',
          manual: true,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockAudit as any);

      const result = await api.logAction({
        userId: 'user1',
        action: 'UPDATE_INCIDENT',
        targetType: 'incident',
        targetId: 'inc1',
        changes: {
          urgency: { from: 'low', to: 'high' },
          impact: { from: 'medium', to: 'high' },
        },
        metadata: {
          incidentTitle: 'Database connection error',
          manual: true,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      });

      expect(result.id).toBe('1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          action: 'UPDATE_INCIDENT',
          targetType: 'incident',
          targetId: 'inc1',
        }),
      });
    });

    it('logs rule changes', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        id: '2',
        action: 'UPDATE_RULE',
        targetType: 'rule',
      } as any);

      await api.logAction({
        userId: 'user1',
        action: 'UPDATE_RULE',
        targetType: 'rule',
        targetId: 'rule1',
        changes: {
          pattern: { from: 'error', to: 'critical error' },
          urgency: { from: 'medium', to: 'high' },
        },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('logs deletion actions', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        id: '3',
        action: 'DELETE_CHANNEL',
        targetType: 'channel',
      } as any);

      await api.logAction({
        userId: 'user1',
        action: 'DELETE_CHANNEL',
        targetType: 'channel',
        targetId: 'ch1',
        metadata: {
          channelName: 'incidents',
          reason: 'No longer used',
        },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('retrieves audit logs with filters', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: 'user1',
          user: { email: 'user@example.com' },
          action: 'UPDATE_INCIDENT',
          targetType: 'incident',
          targetId: 'inc1',
          changes: { urgency: { from: 'low', to: 'high' } },
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          userId: 'user1',
          user: { email: 'user@example.com' },
          action: 'CREATE_RULE',
          targetType: 'rule',
          targetId: 'rule1',
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs as any);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const result = await api.getAuditLogs({
        userId: 'user1',
        action: ['UPDATE_INCIDENT', 'CREATE_RULE'],
        targetType: 'incident',
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user1',
          targetType: 'incident',
        }),
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('retrieves logs for specific target', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await api.getAuditLogs({
        targetType: 'incident',
        targetId: 'inc1',
        limit: 20,
        offset: 0,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          targetType: 'incident',
          targetId: 'inc1',
        }),
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
    });
  });

  describe('getActionSummary', () => {
    it('returns summary of actions by type', async () => {
      const mockSummary = [
        { action: 'UPDATE_INCIDENT', _count: { id: 25 } },
        { action: 'CREATE_RULE', _count: { id: 10 } },
        { action: 'DELETE_CHANNEL', _count: { id: 3 } },
      ];

      mockPrisma.auditLog.groupBy.mockResolvedValue(mockSummary as any);

      const result = await api.getActionSummary({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('UPDATE_INCIDENT');
      expect(result[0].count).toBe(25);
    });
  });

  describe('getUserActivity', () => {
    it('returns user activity summary', async () => {
      const mockActivity = [
        {
          userId: 'user1',
          email: 'user1@example.com',
          actionCount: '50',
          lastAction: new Date('2024-01-31T23:59:59Z'),
        },
        {
          userId: 'user2',
          email: 'user2@example.com',
          actionCount: '30',
          lastAction: new Date('2024-01-30T15:00:00Z'),
        },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockActivity);

      const result = await api.getUserActivity({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      });

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[0].actionCount).toBe(50);
      expect(result[0].email).toBe('user1@example.com');
    });
  });

  describe('getRecentActions', () => {
    it('returns recent actions for a target', async () => {
      const mockActions = [
        {
          id: '1',
          action: 'UPDATE_INCIDENT',
          user: { email: 'user@example.com' },
          createdAt: new Date('2024-01-01T10:00:00Z'),
          changes: { status: { from: 'open', to: 'resolved' } },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockActions as any);

      const result = await api.getRecentActions('incident', 'inc1', 5);

      expect(result).toHaveLength(1);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          targetType: 'incident',
          targetId: 'inc1',
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });
});
