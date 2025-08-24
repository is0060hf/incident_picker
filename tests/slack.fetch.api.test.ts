import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from './setup/prisma-mock';
import '../tests/setup/prisma-mock';
import { createSlackFetchApi } from '../src/lib/api/slackFetchApi';

// rateLimiterをモック
vi.mock('../src/lib/slack/rateLimiter', () => ({
  createRateLimiter: () => ({
    execute: vi.fn((fn) => fn()), // 即座に実行
  }),
}));

describe('Slack Fetch API (Red phase)', () => {
  const mockSlackClient = {
    getConversationHistory: vi.fn(),
    getThreadReplies: vi.fn(),
  };

  const api = createSlackFetchApi(prismaMock as any, mockSlackClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches messages for a channel within date range', async () => {
    // Setup test channel
    const channel = { 
      id: '1',
      slackChannelId: 'C123456',
      name: 'test-channel',
      enabled: true,
    };
    
    prismaMock.channel.findUnique.mockResolvedValue(channel);

    // Mock Slack API response
    mockSlackClient.getConversationHistory.mockResolvedValue({
      ok: true,
      messages: [
        {
          type: 'message',
          text: 'Hello world',
          ts: '1641038400.000100',
          user: 'U123',
        },
        {
          type: 'message',
          text: 'Test message',
          ts: '1641038500.000100',
          user: 'U456',
          thread_ts: '1641038500.000100',
          reply_count: 2,
        },
      ],
    });

    // Mock thread replies
    mockSlackClient.getThreadReplies.mockResolvedValue({
      ok: true,
      messages: [
        {
          type: 'message',
          text: 'Test message',
          ts: '1641038500.000100',
          user: 'U456',
          thread_ts: '1641038500.000100',
        },
        {
          type: 'message',
          text: 'Reply 1',
          ts: '1641038600.000100',
          user: 'U789',
          thread_ts: '1641038500.000100',
        },
        {
          type: 'message',
          text: 'Reply 2',
          ts: '1641038700.000100',
          user: 'U999',
          thread_ts: '1641038500.000100',
        },
      ],
    });
    
    // Mock DB operations
    const mockFetchHistory = { id: 'fh1', channelId: channel.id, status: 'in_progress' };
    prismaMock.fetchHistory.create.mockResolvedValue(mockFetchHistory);
    prismaMock.fetchHistory.update.mockResolvedValue({ ...mockFetchHistory, status: 'completed', fetchedCount: 4 });
    
    // Mock message creation - return success for each message
    prismaMock.slackMessage.create.mockResolvedValue({ id: 'msg1' });

    const result = await api.fetchChannelMessages({
      channelId: channel.id,
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-02'),
    });

    expect(result.fetchedCount).toBe(4); // 2 messages + 2 replies
    expect(result.status).toBe('completed');
    
    // Verify DB operations were called
    expect(prismaMock.fetchHistory.create).toHaveBeenCalled();
    expect(prismaMock.fetchHistory.update).toHaveBeenCalled();
    expect(prismaMock.slackMessage.create).toHaveBeenCalledTimes(4); // 2 messages + 2 replies
  });

  it('fetches thread replies for messages with threads', async () => {
    const channel = {
      id: '1',
      slackChannelId: 'C123456',
      name: 'test-channel',
      enabled: true,
    };
    
    prismaMock.channel.findUnique.mockResolvedValue(channel);

    mockSlackClient.getConversationHistory.mockResolvedValue({
      ok: true,
      messages: [
        {
          type: 'message',
          text: 'Thread parent',
          ts: '1641038500.000100',
          user: 'U456',
          thread_ts: '1641038500.000100',
          reply_count: 2,
        },
      ],
    });

    mockSlackClient.getThreadReplies.mockResolvedValue({
      ok: true,
      messages: [
        {
          type: 'message',
          text: 'Thread parent',
          ts: '1641038500.000100',
          user: 'U456',
          thread_ts: '1641038500.000100',
        },
        {
          type: 'message',
          text: 'Reply 1',
          ts: '1641038600.000100',
          user: 'U789',
          thread_ts: '1641038500.000100',
        },
        {
          type: 'message',
          text: 'Reply 2',
          ts: '1641038700.000100',
          user: 'U999',
          thread_ts: '1641038500.000100',
        },
      ],
    });
    
    // Mock DB operations
    const mockFetchHistory = { id: 'fh1', channelId: channel.id, status: 'in_progress' };
    prismaMock.fetchHistory.create.mockResolvedValue(mockFetchHistory);
    prismaMock.fetchHistory.update.mockResolvedValue({ ...mockFetchHistory, status: 'completed', fetchedCount: 3 });
    prismaMock.slackMessage.create.mockResolvedValue({ id: 'msg1' });

    const result = await api.fetchChannelMessages({
      channelId: channel.id,
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-02'),
    });

    expect(mockSlackClient.getThreadReplies).toHaveBeenCalledWith({
      channel: 'C123456',
      ts: '1641038500.000100',
    });

    // Verify all messages including replies were saved
    expect(prismaMock.slackMessage.create).toHaveBeenCalledTimes(3); // Parent + 2 replies
  });

  it('records fetch history', async () => {
    const channel = {
      id: '1',
      slackChannelId: 'C123456',
      name: 'test-channel',
      enabled: true,
    };
    
    prismaMock.channel.findUnique.mockResolvedValue(channel);

    mockSlackClient.getConversationHistory.mockResolvedValue({
      ok: true,
      messages: [],
    });
    
    // Mock DB operations
    const mockFetchHistory = { 
      id: 'fh1', 
      channelId: channel.id, 
      status: 'completed',
      rangeFrom: new Date('2022-01-01'),
      rangeTo: new Date('2022-01-02'),
    };
    prismaMock.fetchHistory.create.mockResolvedValue(mockFetchHistory);
    prismaMock.fetchHistory.update.mockResolvedValue(mockFetchHistory);
    prismaMock.fetchHistory.findFirst.mockResolvedValue(mockFetchHistory);

    const startDate = new Date('2022-01-01');
    const endDate = new Date('2022-01-02');

    await api.fetchChannelMessages({
      channelId: channel.id,
      startDate,
      endDate,
    });

    const history = await prismaMock.fetchHistory.findFirst({
      where: { channelId: channel.id },
    });

    expect(history).toBeDefined();
    expect(history?.rangeFrom).toEqual(startDate);
    expect(history?.rangeTo).toEqual(endDate);
    expect(history?.status).toBe('completed');
  });

  it('handles pagination with cursor', { timeout: 30000 }, async () => {
    const channel = {
      id: '1',
      slackChannelId: 'C123456',
      name: 'test-channel',
      enabled: true,
    };
    
    prismaMock.channel.findUnique.mockResolvedValue(channel);

    // First page - 実運用想定の100メッセージ
    mockSlackClient.getConversationHistory.mockResolvedValueOnce({
      ok: true,
      messages: Array(100).fill(null).map((_, i) => ({
        type: 'message',
        text: `Message ${i}`,
        ts: `1641038400.${String(i).padStart(6, '0')}`,
        user: 'U123',
      })),
      response_metadata: {
        next_cursor: 'cursor123',
      },
    });

    // Second page - 50メッセージ
    mockSlackClient.getConversationHistory.mockResolvedValueOnce({
      ok: true,
      messages: Array(50).fill(null).map((_, i) => ({
        type: 'message',
        text: `Message ${100 + i}`,
        ts: `1641038500.${String(i).padStart(6, '0')}`,
        user: 'U123',
      })),
    });

    // Mock thread replies to return empty (no threads in pagination test)
    mockSlackClient.getThreadReplies.mockResolvedValue({
      ok: true,
      messages: [],
    });
    
    // Mock DB operations
    const mockFetchHistory = { id: 'fh1', channelId: channel.id, status: 'in_progress' };
    prismaMock.fetchHistory.create.mockResolvedValue(mockFetchHistory);
    prismaMock.fetchHistory.update.mockResolvedValue({ ...mockFetchHistory, status: 'completed', fetchedCount: 150 });
    prismaMock.slackMessage.create.mockResolvedValue({ id: 'msg1' });

    const result = await api.fetchChannelMessages({
      channelId: channel.id,
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-02'),
    });

    expect(result.fetchedCount).toBe(150); // 100 + 50 messages
    expect(mockSlackClient.getConversationHistory).toHaveBeenCalledTimes(2);
    expect(mockSlackClient.getConversationHistory).toHaveBeenNthCalledWith(2, 
      expect.objectContaining({
        cursor: 'cursor123',
      })
    );
  });
});