import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDashboardApi } from '../src/lib/api/dashboardApi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('Dashboard API (Red phase)', () => {
  let api: ReturnType<typeof createDashboardApi>;

  beforeEach(() => {
    mockReset(mockPrisma);
    api = createDashboardApi(mockPrisma);
  });

  describe('getSummary', () => {
    it('returns incident summary statistics', async () => {
      const mockIncidents = [
        { id: '1', status: 'open', type: '障害', createdAt: new Date() },
        { id: '2', status: 'open', type: '不具合', createdAt: new Date() },
        { id: '3', status: 'in_progress', type: '障害', createdAt: new Date() },
        { id: '4', status: 'resolved', type: '不具合', createdAt: new Date() },
        { id: '5', status: 'closed', type: '障害', createdAt: new Date() },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.getSummary();

      expect(result).toEqual({
        total: 5,
        open: 2,
        inProgress: 1,
        resolved: 1,
        closed: 1,
        byType: {
          障害: 3,
          不具合: 2,
        },
      });
    });

    it('returns zero counts when no incidents', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);

      const result = await api.getSummary();

      expect(result).toEqual({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        byType: {
          障害: 0,
          不具合: 0,
        },
      });
    });
  });

  describe('getDistribution', () => {
    it('returns urgency and impact distribution', async () => {
      const mockIncidents = [
        { urgency: 'high', impact: 'high' },
        { urgency: 'high', impact: 'medium' },
        { urgency: 'medium', impact: 'medium' },
        { urgency: 'medium', impact: 'low' },
        { urgency: 'low', impact: 'low' },
        { urgency: null, impact: 'high' },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.getDistribution();

      expect(result).toEqual({
        urgency: {
          high: 2,
          medium: 2,
          low: 1,
          null: 1,
        },
        impact: {
          high: 2,
          medium: 2,
          low: 2,
          null: 0,
        },
        matrix: {
          'high-high': 1,
          'high-medium': 1,
          'high-low': 0,
          'medium-high': 0,
          'medium-medium': 1,
          'medium-low': 1,
          'low-high': 0,
          'low-medium': 0,
          'low-low': 1,
        },
      });
    });
  });

  describe('getTrends', () => {
    it('returns daily incident trends for specified period', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-07');

      const mockIncidents = [
        { createdAt: new Date('2024-01-01'), type: '障害' },
        { createdAt: new Date('2024-01-01'), type: '不具合' },
        { createdAt: new Date('2024-01-02'), type: '障害' },
        { createdAt: new Date('2024-01-04'), type: '不具合' },
        { createdAt: new Date('2024-01-04'), type: '不具合' },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.getTrends(from, to);

      expect(result).toEqual({
        daily: [
          { date: '2024-01-01', total: 2, 障害: 1, 不具合: 1 },
          { date: '2024-01-02', total: 1, 障害: 1, 不具合: 0 },
          { date: '2024-01-03', total: 0, 障害: 0, 不具合: 0 },
          { date: '2024-01-04', total: 2, 障害: 0, 不具合: 2 },
          { date: '2024-01-05', total: 0, 障害: 0, 不具合: 0 },
          { date: '2024-01-06', total: 0, 障害: 0, 不具合: 0 },
          { date: '2024-01-07', total: 0, 障害: 0, 不具合: 0 },
        ],
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          createdAt: true,
          type: true,
        },
      });
    });

    it('returns weekly trends when period is longer than 30 days', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-02-15');

      const mockIncidents = [
        { createdAt: new Date('2024-01-01'), type: '障害' },
        { createdAt: new Date('2024-01-08'), type: '不具合' },
        { createdAt: new Date('2024-01-15'), type: '障害' },
        { createdAt: new Date('2024-01-22'), type: '障害' },
        { createdAt: new Date('2024-02-01'), type: '不具合' },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.getTrends(from, to);

      expect(result.weekly).toBeDefined();
      expect(result.weekly?.length).toBeGreaterThan(0);
      expect(result.weekly?.[0]).toHaveProperty('week');
      expect(result.weekly?.[0]).toHaveProperty('total');
    });
  });

  describe('getRecentIncidents', () => {
    it('returns recent incidents with limit', async () => {
      const mockIncidents = [
        {
          id: '1',
          title: 'Recent issue 1',
          type: '障害',
          urgency: 'high',
          impact: 'high',
          status: 'open',
          createdAt: new Date('2024-01-10T10:00:00Z'),
          channel: { name: 'incidents' },
        },
        {
          id: '2',
          title: 'Recent issue 2',
          type: '不具合',
          urgency: 'low',
          impact: 'low',
          status: 'resolved',
          createdAt: new Date('2024-01-09T10:00:00Z'),
          channel: { name: 'bugs' },
        },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.getRecentIncidents(5);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      
      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { channel: true },
      });
    });
  });

  describe('getChannelStats', () => {
    it('returns incident statistics by channel', async () => {
      mockPrisma.incident.groupBy.mockResolvedValue([
        { channelId: 'ch1', _count: { id: 10 } },
        { channelId: 'ch2', _count: { id: 5 } },
        { channelId: 'ch3', _count: { id: 3 } },
      ] as any);

      mockPrisma.channel.findMany.mockResolvedValue([
        { id: 'ch1', name: 'incidents' },
        { id: 'ch2', name: 'alerts' },
        { id: 'ch3', name: 'bugs' },
      ] as any);

      const result = await api.getChannelStats();

      expect(result).toEqual([
        { channelId: 'ch1', channelName: 'incidents', count: 10 },
        { channelId: 'ch2', channelName: 'alerts', count: 5 },
        { channelId: 'ch3', channelName: 'bugs', count: 3 },
      ]);
    });
  });
});
