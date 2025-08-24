import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSearchApi } from '../src/lib/api/searchApi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockPrisma = mockDeep<PrismaClient>();

describe('Search API (Red phase)', () => {
  let api: ReturnType<typeof createSearchApi>;

  beforeEach(() => {
    mockReset(mockPrisma);
    api = createSearchApi(mockPrisma);
  });

  describe('searchIncidents', () => {
    it('searches incidents by query text', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Database connection error',
          description: 'Connection pool exhausted',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          channel: { name: 'incidents' },
          message: {
            slackTs: '1704103200.123456',
            raw: { text: 'DB connection error occurred in production' },
          },
          searchRank: 0.8,
        },
        {
          id: '2',
          title: 'Login database issue',
          description: 'Users cannot login',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'resolved',
          createdAt: new Date('2024-01-02T10:00:00Z'),
          channel: { name: 'alerts' },
          message: {
            slackTs: '1704189600.234567',
            raw: { text: 'Database query timeout on login' },
          },
          searchRank: 0.6,
        },
      ];

      // PostgreSQL FTSクエリをモック
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockResults) // 検索結果
        .mockResolvedValueOnce([{ count: '2' }]); // カウント結果

      const result = await api.searchIncidents('database error', {
        limit: 10,
        offset: 0,
      });

      expect(result.incidents).toHaveLength(2);
      expect(result.incidents[0].title).toBe('Database connection error');
      expect(result.incidents[0].searchRank).toBe(0.8);
      expect(result.total).toBe(2);

      // ts_rank_cdを使用したクエリが呼ばれることを確認
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('searches with filters', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Critical error',
          urgency: 'high',
          impact: 'high',
          type: '障害',
          status: 'open',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          channel: { name: 'incidents' },
          message: { raw: { text: 'Critical system error' } },
          searchRank: 0.9,
        },
      ];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await api.searchIncidents('error', {
        urgency: ['high'],
        type: '障害',
        status: ['open'],
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        channelId: 'ch1',
        limit: 10,
        offset: 0,
      });

      expect(result.incidents).toHaveLength(1);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('handles empty search results', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      const result = await api.searchIncidents('nonexistent', {
        limit: 10,
        offset: 0,
      });

      expect(result.incidents).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('searches in message threads', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Thread search result',
          message: {
            raw: { 
              text: 'Original message',
              thread_ts: '1704103200.123456',
            },
          },
          threadMessages: [
            { raw: { text: 'Thread reply with search term' } },
          ],
          searchRank: 0.7,
        },
      ];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await api.searchIncidents('search term', {
        includeThreads: true,
        limit: 10,
        offset: 0,
      });

      expect(result.incidents).toHaveLength(1);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('searchMessages', () => {
    it('searches raw Slack messages', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          slackTs: '1704103200.123456',
          channelId: 'ch1',
          channel: { name: 'general' },
          raw: { 
            text: 'Error in production database',
            user: 'U123456',
            ts: '1704103200.123456',
          },
          createdAt: new Date('2024-01-01T10:00:00Z'),
          searchRank: 0.8,
        },
        {
          id: 'msg2',
          slackTs: '1704189600.234567',
          channelId: 'ch2',
          channel: { name: 'alerts' },
          raw: { 
            text: 'Database backup completed',
            user: 'U234567',
            ts: '1704189600.234567',
          },
          createdAt: new Date('2024-01-02T10:00:00Z'),
          searchRank: 0.5,
        },
      ];

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockMessages)
        .mockResolvedValueOnce([{ count: '2' }]);

      const result = await api.searchMessages('database', {
        channelId: 'ch1',
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        limit: 20,
        offset: 0,
      });

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].raw.text).toContain('database');
      expect(result.total).toBe(2);
    });
  });

  describe('getSuggestions', () => {
    it('returns search suggestions based on query', async () => {
      const mockSuggestions = [
        { phrase: 'database error', count: '15' },
        { phrase: 'database connection', count: '10' },
        { phrase: 'database timeout', count: '5' },
      ];

      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockSuggestions);

      const result = await api.getSuggestions('datab');

      expect(result).toHaveLength(3);
      expect(result[0].term).toBe('database error');
      expect(result[0].count).toBe(15);
    });

    it('returns empty array for short queries', async () => {
      const result = await api.getSuggestions('da');

      expect(result).toHaveLength(0);
      expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('updateSearchIndex', () => {
    it('updates search index for a message', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(1);

      await api.updateSearchIndex('msg1');

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
    });

    it('updates search index for all messages', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(100);

      const result = await api.updateSearchIndex();

      expect(result.updated).toBe(100);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
    });
  });
});
