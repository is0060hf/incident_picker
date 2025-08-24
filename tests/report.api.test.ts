import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReportApi } from '../src/lib/api/reportApi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('Report API (Red phase)', () => {
  let api: ReturnType<typeof createReportApi>;

  beforeEach(() => {
    mockReset(mockPrisma);
    api = createReportApi(mockPrisma);
  });

  describe('generateIncidentReport', () => {
    it('generates CSV report with all incidents', async () => {
      const mockIncidents = [
        {
          id: '1',
          title: 'Database connection error',
          description: 'Connection pool exhausted',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          assignee: 'john@example.com',
          notes: 'Under investigation',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          channel: { name: 'incidents', slackChannelId: 'C123456' },
          message: {
            slackTs: '1704103200.123456',
            raw: { user: 'U123456', text: 'DB error occurred' },
          },
        },
        {
          id: '2',
          title: 'UI rendering issue',
          description: 'Button not clickable',
          urgency: 'low',
          impact: 'low',
          type: '不具合',
          status: 'resolved',
          assignee: null,
          notes: null,
          createdAt: new Date('2024-01-02T10:00:00Z'),
          updatedAt: new Date('2024-01-02T15:00:00Z'),
          channel: { name: 'bugs', slackChannelId: 'C234567' },
          message: {
            slackTs: '1704189600.234567',
            raw: { user: 'U234567', text: 'Button issue' },
          },
        },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.generateIncidentReport();

      expect(result.csv).toContain('ID,タイトル,説明,緊急度,影響度,タイプ,ステータス,担当者,チャンネル,作成日時,更新日時,Slackリンク,メモ');
      expect(result.csv).toContain('1,Database connection error,Connection pool exhausted,high,high,障害,open,john@example.com,incidents');
      expect(result.csv).toContain('2,UI rendering issue,Button not clickable,low,low,不具合,resolved,,bugs');
      expect(result.filename).toMatch(/^incident-report-\d{8}-\d{6}\.csv$/);
    });

    it('generates CSV report with filters', async () => {
      const mockIncidents = [
        {
          id: '1',
          title: 'Critical issue',
          description: '',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          assignee: null,
          notes: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          channel: { name: 'incidents', slackChannelId: 'C123456' },
          message: { slackTs: '1704103200.123456' },
        },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const filters = {
        urgency: ['high'],
        type: '障害',
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };

      const result = await api.generateIncidentReport(filters);

      expect(mockPrisma.incident.findMany).toHaveBeenCalledWith({
        where: {
          urgency: { in: ['high'] },
          type: '障害',
          createdAt: {
            gte: filters.from,
            lte: filters.to,
          },
        },
        include: {
          channel: true,
          message: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result.csv).toContain('Critical issue');
    });

    it('escapes special characters in CSV', async () => {
      const mockIncidents = [
        {
          id: '1',
          title: 'Title with "quotes"',
          description: 'Description\nwith\nnewlines',
          notes: 'Notes, with, commas',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          assignee: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          channel: { name: 'test', slackChannelId: 'C345678' },
          message: { slackTs: '1704103200.123456' },
        },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.generateIncidentReport();

      // CSVの特殊文字がエスケープされていることを確認
      expect(result.csv).toContain('"Title with ""quotes"""');
      expect(result.csv).toContain('"Description\nwith\nnewlines"');
      expect(result.csv).toContain('"Notes, with, commas"');
    });

    it('handles empty results', async () => {
      mockPrisma.incident.findMany.mockResolvedValue([]);

      const result = await api.generateIncidentReport();

      expect(result.csv).toContain('ID,タイトル,説明,緊急度,影響度,タイプ,ステータス,担当者,チャンネル,作成日時,更新日時,Slackリンク,メモ');
      expect(result.csv.split('\n')).toHaveLength(2); // ヘッダーと空行
    });
  });

  describe('generateChannelReport', () => {
    it('generates channel statistics CSV', async () => {
      const mockStats = [
        { channelId: 'ch1', _count: { id: 30 } },
        { channelId: 'ch2', _count: { id: 15 } },
        { channelId: 'ch3', _count: { id: 5 } },
      ];

      const mockChannels = [
        { id: 'ch1', name: 'incidents', slackChannelId: 'C123456' },
        { id: 'ch2', name: 'alerts', slackChannelId: 'C234567' },
        { id: 'ch3', name: 'bugs', slackChannelId: 'C345678' },
      ];

      mockPrisma.incident.groupBy.mockResolvedValue(mockStats as any);
      mockPrisma.channel.findMany.mockResolvedValue(mockChannels as any);

      const result = await api.generateChannelReport();

      expect(result.csv).toContain('チャンネル名,SlackチャンネルID,インシデント数');
      expect(result.csv).toContain('incidents,C123456,30');
      expect(result.csv).toContain('alerts,C234567,15');
      expect(result.csv).toContain('bugs,C345678,5');
      expect(result.filename).toMatch(/^channel-report-\d{8}-\d{6}\.csv$/);
    });
  });

  describe('generateSummaryReport', () => {
    it('generates summary statistics CSV', async () => {
      const mockIncidents = [
        { status: 'open', urgency: 'high', impact: 'high', type: '障害' },
        { status: 'open', urgency: 'medium', impact: 'medium', type: '障害' },
        { status: 'in_progress', urgency: 'low', impact: 'low', type: '不具合' },
        { status: 'resolved', urgency: 'high', impact: 'medium', type: '不具合' },
        { status: 'closed', urgency: null, impact: null, type: null },
      ];

      mockPrisma.incident.findMany.mockResolvedValue(mockIncidents as any);

      const result = await api.generateSummaryReport(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.csv).toContain('期間,2024-01-01 〜 2024-01-31');
      expect(result.csv).toContain('合計インシデント数,5');
      expect(result.csv).toContain('ステータス別');
      expect(result.csv).toContain('オープン,2');
      expect(result.csv).toContain('対応中,1');
      expect(result.csv).toContain('解決済み,1');
      expect(result.csv).toContain('クローズ,1');
      expect(result.csv).toContain('タイプ別');
      expect(result.csv).toContain('障害,2');
      expect(result.csv).toContain('不具合,2');
      expect(result.csv).toContain('緊急度別');
      expect(result.csv).toContain('高,2');
      expect(result.csv).toContain('中,1');
      expect(result.csv).toContain('低,1');
      expect(result.csv).toContain('未設定,1');
    });
  });
});
