import { PrismaClient, Channel } from '@prisma/client';

export interface ChannelInput {
  slackChannelId: string;
  name: string;
  enabled: boolean;
}

export interface ChannelUpdateInput {
  name?: string;
  enabled?: boolean;
}

/**
 * チャンネル管理API
 * Slackチャンネル情報のCRUD操作を提供
 */
export function createChannelsApi(prisma: PrismaClient) {
  return {
    /**
     * チャンネル一覧を取得（作成日時の降順）
     */
    async listChannels(): Promise<Channel[]> {
      return await prisma.channel.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    /**
     * チャンネルを作成
     * @throws {PrismaClientKnownRequestError} 重複するslackChannelIdの場合
     */
    async createChannel(input: ChannelInput): Promise<Channel> {
      return await prisma.channel.create({
        data: input,
      });
    },

    /**
     * チャンネルを更新
     * @throws {PrismaClientKnownRequestError} 存在しないIDの場合
     */
    async updateChannel(id: string, input: ChannelUpdateInput): Promise<Channel> {
      return await prisma.channel.update({
        where: { id },
        data: input,
      });
    },

    /**
     * チャンネルを削除
     * @throws {PrismaClientKnownRequestError} 存在しないIDの場合
     */
    async deleteChannel(id: string): Promise<void> {
      await prisma.channel.delete({
        where: { id },
      });
    },
  } as const;
}
