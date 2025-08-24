import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSlackFetchApi } from '@/lib/api/slackFetchApi';
import { createSlackClient } from '@/lib/slack/slackClient';
import { createRateLimiter } from '@/lib/slack/rateLimiter';
import { prisma } from '@/lib/db';

// モック設定
vi.mock('@/lib/db', () => ({
  prisma: {
    channel: {
      findUnique: vi.fn(),
    },
    fetchHistory: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    slackMessage: {
      create: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
    },
    incident: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Slack Integration Tests', () => {
  let slackClient: ReturnType<typeof createSlackClient>;
  let slackFetchApi: ReturnType<typeof createSlackFetchApi>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Slack クライアントのモック
    slackClient = {
      getConversationHistory: vi.fn(),
      getThreadReplies: vi.fn(),
    };

    // 依存関係の初期化
    slackFetchApi = createSlackFetchApi(prisma, slackClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Normal Flow', () => {
    it('should fetch messages successfully', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      // モックレスポンス
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(slackClient.getConversationHistory).mockResolvedValue({
        ok: true,
        messages: [
          {
            ts: '1234567890.123456',
            user: 'U123456',
            text: '緊急！サービスが停止しています',
            thread_ts: undefined,
          },
          {
            ts: '1234567891.123456',
            user: 'U123457',
            text: 'エラーが発生しています',
            thread_ts: '1234567891.123456',
            reply_count: 2,
          },
        ],
        has_more: false,
      });

      vi.mocked(slackClient.getThreadReplies).mockResolvedValue({
        ok: true,
        messages: [
          {
            ts: '1234567891.123456',
            user: 'U123457',
            text: 'エラーが発生しています',
            thread_ts: '1234567891.123456',
          },
          {
            ts: '1234567892.123456',
            user: 'U123458',
            text: '確認します',
            thread_ts: '1234567891.123456',
          },
        ],
      });

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        return await fn(prisma);
      });

      // 実行
      const result = await slackFetchApi.fetchChannelMessages({
        channelId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      // 検証
      expect(result.status).toBe('completed');
      expect(result.fetchedCount).toBe(3); // 2 messages + 1 reply
      expect(slackClient.getConversationHistory).toHaveBeenCalledWith({
        channel: slackChannelId,
        oldest: '1704067200',
        latest: '1706659200',
        limit: 100,
        cursor: undefined,
      });
      expect(slackClient.getThreadReplies).toHaveBeenCalled();
    });

    it('should handle pagination', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 最初のページ
      vi.mocked(slackClient.getConversationHistory).mockResolvedValueOnce({
        ok: true,
        messages: Array(1000).fill(null).map((_, i) => ({
          ts: `123456789${i}.123456`,
          user: 'U123456',
          text: `メッセージ ${i}`,
        })),
        has_more: true,
        response_metadata: {
          next_cursor: 'cursor-1',
        },
      });

      // 2ページ目
      vi.mocked(slackClient.getConversationHistory).mockResolvedValueOnce({
        ok: true,
        messages: Array(500).fill(null).map((_, i) => ({
          ts: `123456889${i}.123456`,
          user: 'U123456',
          text: `メッセージ ${i + 1000}`,
        })),
        has_more: false,
      });

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        return await fn(prisma);
      });

      const result = await slackFetchApi.fetchChannelMessages({
        channelId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.fetchedCount).toBe(1500);
      expect(slackClient.getConversationHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle 429 rate limit errors with retry', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 最初は429エラー
      vi.mocked(slackClient.getConversationHistory)
        .mockRejectedValueOnce({
          status: 429,
          headers: { 'retry-after': '2' },
        })
        .mockResolvedValueOnce({
          ok: true,
          messages: [
            {
              ts: '1234567890.123456',
              user: 'U123456',
              text: 'テストメッセージ',
            },
          ],
          has_more: false,
        });

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.fetchHistory.updateMany).mockResolvedValue({
        count: 1,
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        return await fn(prisma);
      });

      const result = await slackFetchApi.fetchChannelMessages({
        channelId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      // rateLimiterが組み込まれているため、429エラーは内部で処理され、リトライ後に成功する
      expect(result.status).toBe('completed');
    });

    it('should handle 5xx server errors', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(slackClient.getConversationHistory).mockRejectedValue(
        new Error('Internal Server Error')
      );

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await slackFetchApi.fetchChannelMessages({
        channelId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Internal Server Error');
    });

    it('should handle thread fetch failures gracefully', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(slackClient.getConversationHistory).mockResolvedValue({
        ok: true,
        messages: [
          {
            ts: '1234567891.123456',
            user: 'U123457',
            text: 'スレッドのあるメッセージ',
            thread_ts: '1234567891.123456',
            reply_count: 2,
          },
        ],
        has_more: false,
      });

      // スレッド取得でエラー（APIレスポンスとして）
      vi.mocked(slackClient.getThreadReplies).mockResolvedValue({
        ok: false,
        error: 'thread_not_found',
      });

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.slackMessage.create).mockResolvedValue({
        id: '1',
        channelId,
        slackTs: '1234567891.123456',
        raw: {},
        postedAt: new Date(),
        fetchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.fetchHistory.update).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'completed',
        fetchedCount: 1,
        apiCalls: 2,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        return await fn(prisma);
      });

      const result = await slackFetchApi.fetchChannelMessages({
        channelId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      // メインメッセージは保存されるが、スレッドは無視される
      expect(result.status).toBe('completed');
      expect(result.fetchedCount).toBe(1); // メインメッセージのみ
    });
  });

  describe('Data Integrity', () => {
    it('should avoid duplicate messages', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const message = {
        ts: '1234567890.123456',
        user: 'U123456',
        text: '重複テスト',
        type: 'message',
      };

      vi.mocked(slackClient.getConversationHistory).mockResolvedValue({
        ok: true,
        messages: [message, message], // 同じメッセージが2つ
        has_more: false,
      });

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        return await fn(prisma);
      });

      // 重複エラーをシミュレート
      vi.mocked(prisma.slackMessage.create)
        .mockRejectedValueOnce({ code: 'P2002' }) // 最初の保存は重複エラー
        .mockResolvedValueOnce({ // 2回目の保存は成功
          id: '1',
          channelId,
          slackTs: '1234567890.123456',
          raw: {},
          postedAt: new Date(),
          fetchedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await slackFetchApi.fetchChannelMessages({
        channelId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      // 重複は排除される（2つのメッセージのうち1つだけ保存）
      expect(result.fetchedCount).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle concurrent requests', async () => {
      const channelId = 'channel-1';
      const slackChannelId = 'C123456789';
      
      vi.mocked(prisma.channel.findUnique).mockResolvedValue({
        id: channelId,
        slackChannelId,
        name: 'general',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(slackClient.getConversationHistory).mockResolvedValue({
        ok: true,
        messages: [],
        has_more: false,
      });

      vi.mocked(prisma.fetchHistory.create).mockResolvedValue({
        id: 'fetch-1',
        channelId,
        rangeFrom: new Date(),
        rangeTo: new Date(),
        status: 'in_progress',
        fetchedCount: 0,
        apiCalls: 0,
        errorMessage: null,
        createdAt: new Date(),
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        return await fn(prisma);
      });

      // 3つのリクエストを並行実行
      const promises = [
        slackFetchApi.fetchChannelMessages({
          channelId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        }),
        slackFetchApi.fetchChannelMessages({
          channelId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        }),
        slackFetchApi.fetchChannelMessages({
          channelId,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        }),
      ];

      const results = await Promise.all(promises);

      // すべてのリクエストが成功する
      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'completed')).toBe(true);
    });
  });
});
