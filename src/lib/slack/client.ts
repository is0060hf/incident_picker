export interface SlackMessage {
  ts: string;
  text: string;
  has_thread?: boolean;
}

export interface SlackFetchParams {
  channelId: string;
  fromIso: string;
  toIso: string;
}

export interface SlackClient {
  fetchChannelHistory(params: SlackFetchParams): Promise<SlackMessage[]>;
  fetchThreadReplies(channelId: string, parentTs: string): Promise<SlackMessage[]>;
  rateLimitBackoff<T>(fn: () => Promise<T>): Promise<T>;
}
