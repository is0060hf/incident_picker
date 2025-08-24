import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSlackClient } from '../src/lib/slack/slackClient';

describe('Slack Client Wrapper (Red phase)', () => {
  const mockToken = 'xoxb-test-token';
  
  // fetchのモック
  const mockFetch = vi.fn();
  global.fetch = mockFetch as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches conversation history', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        messages: [
          { type: 'message', text: 'Hello', ts: '1641038400.000100', user: 'U123' }
        ],
      }),
      headers: new Headers(),
    });

    const client = createSlackClient(mockToken);
    
    const result = await client.getConversationHistory({
      channel: 'C1234567890',
      oldest: '1640995200', // 2022-01-01
      latest: '1641081600', // 2022-01-02
    });

    expect(result.ok).toBe(true);
    expect(result.messages).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages).toHaveLength(1);
  });

  it('fetches thread replies', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        messages: [
          { type: 'message', text: 'Parent', ts: '1641038400.000100', user: 'U123' },
          { type: 'message', text: 'Reply', ts: '1641038401.000100', user: 'U456', thread_ts: '1641038400.000100' }
        ],
      }),
      headers: new Headers(),
    });

    const client = createSlackClient(mockToken);
    
    const result = await client.getThreadReplies({
      channel: 'C1234567890',
      ts: '1641038400.000100',
    });

    expect(result.ok).toBe(true);
    expect(result.messages).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages).toHaveLength(2);
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        ok: false,
        error: 'invalid_auth',
      }),
      headers: new Headers(),
    });

    const client = createSlackClient('invalid-token');
    
    await expect(
      client.getConversationHistory({
        channel: 'C1234567890',
      })
    ).rejects.toThrow('Slack API error: invalid_auth');
  });

  it('provides rate limit information', async () => {
    const headers = new Headers();
    headers.set('retry-after', '60');
    
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        messages: [],
      }),
      headers,
    });

    const client = createSlackClient(mockToken);
    
    const result = await client.getConversationHistory({
      channel: 'C1234567890',
    });

    expect(result.headers).toBeDefined();
    expect(result.headers['retry-after']).toBe('60');
  });
});
