export interface ConversationHistoryParams {
  channel: string;
  oldest?: string;
  latest?: string;
  limit?: number;
  cursor?: string;
}

export interface ThreadRepliesParams {
  channel: string;
  ts: string;
  cursor?: string;
}

export interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users?: string[];
  reply_users_count?: number;
  latest_reply?: string;
}

export interface SlackApiResponse<T = SlackMessage[]> {
  ok: boolean;
  messages?: T;
  error?: string;
  headers?: Record<string, string>;
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface SlackClient {
  getConversationHistory(params: ConversationHistoryParams): Promise<SlackApiResponse>;
  getThreadReplies(params: ThreadRepliesParams): Promise<SlackApiResponse>;
}

/**
 * Slack Web APIクライアントのファクトリ関数
 * @param token Slack Bot Token (xoxb-...)
 */
export function createSlackClient(token: string): SlackClient {
  const baseUrl = 'https://slack.com/api';
  
  /**
   * Slack APIへのリクエストを送信
   * @throws {Error} Slack APIがエラーを返した場合
   */
  async function makeRequest<T = any>(
    endpoint: string,
    params: Record<string, any>
  ): Promise<SlackApiResponse<T>> {
    // URLパラメータの構築
    const url = new URL(`${baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    // APIリクエスト
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // レスポンスの解析
    const data = await response.json();
    
    // エラーチェック
    if (!data.ok) {
      const errorMessage = data.error || 'Unknown error';
      throw new Error(`Slack API error: ${errorMessage}`);
    }

    // レート制限情報をヘッダーから取得
    const headers: Record<string, string> = {};
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      headers['retry-after'] = retryAfter;
    }

    return {
      ...data,
      headers,
    };
  }

  return {
    /**
     * チャンネルの投稿履歴を取得
     * @see https://api.slack.com/methods/conversations.history
     */
    async getConversationHistory(params: ConversationHistoryParams): Promise<SlackApiResponse> {
      return makeRequest<SlackMessage[]>('conversations.history', params);
    },

    /**
     * スレッドの返信を取得
     * @see https://api.slack.com/methods/conversations.replies
     */
    async getThreadReplies(params: ThreadRepliesParams): Promise<SlackApiResponse> {
      return makeRequest<SlackMessage[]>('conversations.replies', params);
    },
  };
}
