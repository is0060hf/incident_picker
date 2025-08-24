import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createIncidentsApi } from '../src/lib/api/incidentsApi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('Incidents API (Red phase)', () => {
  let api: ReturnType<typeof createIncidentsApi>;

  beforeEach(() => {
    mockReset(mockPrisma);
    api = createIncidentsApi(mockPrisma);
  });

  describe('listIncidents', () => {
    it('returns paginated incidents list', async () => {
      const mockIncidents = [
        {
          id: '1',
          channelId: 'ch1',
          messageId: 'msg1',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          title: 'Production outage',
          description: 'System is down',
          urgencyManual: false,
          impactManual: false,
          assignee: null,
          notes: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents);
      mockPrisma.incident.count.mockResolvedValue(1);

      const result = await api.listIncidents({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        incidents: mockIncidents,
        total: 1,
        page: 1,
        totalPages: 1,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by search query', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.incident.count.mockResolvedValue(0);

      await api.listIncidents({
        q: 'error',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'error', mode: 'insensitive' } },
            { description: { contains: 'error', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by date range', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.incident.count.mockResolvedValue(0);

      await api.listIncidents({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by urgency and impact', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.incident.count.mockResolvedValue(0);

      await api.listIncidents({
        urgency: ['high', 'medium'],
        impact: ['high'],
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          urgency: { in: ['high', 'medium'] },
          impact: { in: ['high'] },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by incident type', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.incident.count.mockResolvedValue(0);

      await api.listIncidents({
        type: '障害',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          type: '障害',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by status', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.incident.count.mockResolvedValue(0);

      await api.listIncidents({
        status: ['open', 'in_progress'],
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['open', 'in_progress'] },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('handles complex filters combination', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);
      mockPrisma.incident.count.mockResolvedValue(0);

      await api.listIncidents({
        q: 'production',
        urgency: ['high'],
        impact: ['high', 'medium'],
        type: '障害',
        status: ['open'],
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        page: 2,
        limit: 20,
      });

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: 'production', mode: 'insensitive' } },
                { description: { contains: 'production', mode: 'insensitive' } },
              ],
            },
            { urgency: { in: ['high'] } },
            { impact: { in: ['high', 'medium'] } },
            { type: '障害' },
            { status: { in: ['open'] } },
            {
              createdAt: {
                gte: new Date('2024-01-01'),
                lte: new Date('2024-01-31'),
              },
            },
          ],
        },
        skip: 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getIncident', () => {
    it('retrieves single incident with relations', async () => {
      const mockIncident = {
        id: '1',
        channelId: 'ch1',
        messageId: 'msg1',
        urgency: 'high',
        impact: 'high',
        type: '障害',
        status: 'open',
        title: 'Production issue',
        description: 'Critical error',
        urgencyManual: false,
        impactManual: false,
        assignee: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: { id: 'ch1', name: 'general' },
        message: { id: 'msg1', slackTs: '1234567890.123456' },
      };

      mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);

      const result = await api.getIncident('1');

      expect(result).toEqual(mockIncident);
      expect(mockPrisma.incident.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          channel: true,
          message: true,
        },
      });
    });
  });

  describe('updateIncident', () => {
    it('updates incident fields', async () => {
      const existing = {
        id: '1',
        urgency: 'high',
        impact: 'high',
      };
      
      const updated = {
        id: '1',
        urgency: 'low',
        impact: 'low',
        type: '不具合',
        status: 'resolved',
        urgencyManual: true,
        impactManual: true,
      };

      mockPrisma.incident.findUnique.mockResolvedValue(existing as any);
      mockPrisma.incident.update.mockResolvedValue(updated as any);

      await api.updateIncident('1', {
        urgency: 'low',
        impact: 'low',
        status: 'resolved',
      });

      expect(mockPrisma.incident.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          urgency: 'low',
          impact: 'low',
          status: 'resolved',
          urgencyManual: true,
          impactManual: true,
          type: '不具合',
        },
      });
    });
  });
});
