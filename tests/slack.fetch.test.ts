import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlackClient, SlackMessage, SlackFetchParams } from '../src/lib/slack/client';
import { createSlackFetcher } from '../src/lib/slack/fetch';

describe('Slack fetch (Red phase)', () => {
  let client: SlackClient;
  let fetcher: ReturnType<typeof createSlackFetcher>;

  beforeEach(() => {
    const mockFetchChannelHistory: SlackClient['fetchChannelHistory'] = vi.fn(
      async (_params: SlackFetchParams): Promise<SlackMessage[]> => []
    );
    const mockFetchThreadReplies: SlackClient['fetchThreadReplies'] = vi.fn(
      async (_channelId: string, _parentTs: string): Promise<SlackMessage[]> => []
    );
    const mockRateLimitBackoff: SlackClient['rateLimitBackoff'] = vi.fn(async <T>(fn: () => Promise<T>) => fn());

    client = {
      fetchChannelHistory: mockFetchChannelHistory,
      fetchThreadReplies: mockFetchThreadReplies,
      rateLimitBackoff: mockRateLimitBackoff,
    };
    fetcher = createSlackFetcher(client);
  });

  it('fetches messages and threads within range, returns counts', async () => {
    const params: SlackFetchParams = {
      channelId: 'C123',
      fromIso: '2025-08-24T00:00:00Z',
      toIso: '2025-08-24T23:59:59Z',
    };
    (client.fetchChannelHistory as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ts: '1.0', text: 'hello' },
      { ts: '2.0', text: 'world', has_thread: true },
    ] as SlackMessage[]);
    (client.fetchThreadReplies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ts: '2.1', text: 'reply' },
    ] as SlackMessage[]);

    const result = await fetcher.fetchRange(params);
    expect(result.messagesCount).toBe(3);
    expect(result.apiCalls).toBeGreaterThan(0);
  });
});


