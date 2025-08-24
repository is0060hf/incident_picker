import { SlackClient, SlackFetchParams, SlackMessage } from './client';

export interface FetchResult {
  messagesCount: number;
  apiCalls: number;
}

export function createSlackFetcher(client: SlackClient) {
  return {
    async fetchRange(params: SlackFetchParams): Promise<FetchResult> {
      let apiCalls: number = 0;

      const history: SlackMessage[] = await client.rateLimitBackoff(async () => {
        apiCalls += 1;
        return client.fetchChannelHistory(params);
      });

      let threadRepliesTotal: number = 0;
      for (const m of history) {
        if (m.has_thread === true) {
          const replies: SlackMessage[] = await client.rateLimitBackoff(async () => {
            apiCalls += 1;
            return client.fetchThreadReplies(params.channelId, m.ts);
          });
          threadRepliesTotal += replies.length;
        }
      }

      return {
        messagesCount: history.length + threadRepliesTotal,
        apiCalls,
      };
    },
  } as const;
}
