import { PrismaClient } from '@prisma/client';
import { SlackClient, SlackMessage } from '../slack/slackClient';
import { createRateLimiter } from '../slack/rateLimiter';

export interface FetchChannelMessagesParams {
  channelId: string;
  startDate: Date;
  endDate: Date;
}

export interface FetchResult {
  fetchedCount: number;
  status: 'completed' | 'failed' | 'partial';
  error?: string;
}

/**
 * Slack取得APIファクトリ
 * チャンネルのメッセージとスレッドを期間指定で取得
 */
export function createSlackFetchApi(
  prisma: PrismaClient,
  slackClient: SlackClient
) {
  const rateLimiter = createRateLimiter();
  /**
   * タイムスタンプ文字列をDateオブジェクトに変換
   */
  function timestampToDate(ts: string): Date {
    return new Date(parseFloat(ts) * 1000);
  }

  /**
   * メッセージを保存（重複はスキップ）
   */
  async function saveMessage(channelId: string, message: SlackMessage): Promise<boolean> {
    try {
      await prisma.slackMessage.create({
        data: {
          channelId,
          slackTs: message.ts,
          raw: message as any,
          postedAt: timestampToDate(message.ts),
        },
      });
      return true;
    } catch (e: any) {
      // 重複エラーの場合はスキップ
      if (e.code === 'P2002') {
        return false;
      }
      throw e;
    }
  }

  return {
    /**
     * チャンネルのメッセージを期間指定で取得
     */
    async fetchChannelMessages(params: FetchChannelMessagesParams): Promise<FetchResult> {
      const { channelId, startDate, endDate } = params;
      let fetchedCount = 0;
      let apiCalls = 0;

      try {
        // チャンネル情報取得
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
        });

        if (!channel) {
          throw new Error('Channel not found');
        }

        // 取得履歴レコード作成
        const fetchHistory = await prisma.fetchHistory.create({
          data: {
            channelId,
            rangeFrom: startDate,
            rangeTo: endDate,
            status: 'in_progress',
            fetchedCount: 0,
            apiCalls: 0,
          },
        });

        // 日付をUNIXタイムスタンプに変換
        const oldest = Math.floor(startDate.getTime() / 1000).toString();
        const latest = Math.floor(endDate.getTime() / 1000).toString();

        // Fetch messages with pagination
        let cursor: string | undefined;
        const allMessages: any[] = [];

        do {
          const response = await rateLimiter.execute(() =>
            slackClient.getConversationHistory({
              channel: channel.slackChannelId,
              oldest,
              latest,
              limit: 100,
              cursor,
            })
          );
          apiCalls++;

          // Slack APIレスポンスのエラーチェック
          if (!response || !response.ok) {
            throw new Error(response?.error || 'Slack API error');
          }

          if (response.messages) {
            allMessages.push(...response.messages);
          }

          cursor = response.response_metadata?.next_cursor;
        } while (cursor);



        // Process messages and fetch threads
        for (const message of allMessages) {
          // Save message
          const saved = await saveMessage(channelId, message);
          if (saved) {
            fetchedCount++;
          }

          // Fetch thread replies if exists
          if (message.thread_ts && message.reply_count && message.reply_count > 0) {
            const threadResponse = await rateLimiter.execute(() =>
              slackClient.getThreadReplies({
                channel: channel.slackChannelId,
                ts: message.thread_ts,
              })
            );
            apiCalls++;

            // Slack APIレスポンスのエラーチェック
            if (!threadResponse || !threadResponse.ok) {
              console.error(`Failed to fetch thread: ${threadResponse?.error || 'No response'}`);
              // スレッドの取得失敗は全体の失敗にはしない
              continue;
            }

            if (threadResponse.messages) {
              // Skip the first message (parent) as it's already saved
              for (const reply of threadResponse.messages.slice(1)) {
                const saved = await saveMessage(channelId, reply);
                if (saved) {
                  fetchedCount++;
                }
              }
            }
          }
        }

        // Update fetch history
        await prisma.fetchHistory.update({
          where: { id: fetchHistory.id },
          data: {
            status: 'completed',
            fetchedCount,
            apiCalls,
          },
        });

        return {
          fetchedCount,
          status: 'completed',
        };
      } catch (error: any) {
        // Update fetch history on error
        await prisma.fetchHistory.updateMany({
          where: {
            channelId,
            status: 'in_progress',
          },
          data: {
            status: 'failed',
            fetchedCount,
            errorMessage: error.message,
          },
        });

        return {
          fetchedCount,
          status: 'failed',
          error: error.message,
        };
      }
    },
  };
}
