import { PrismaClient } from '@prisma/client';
import { withRetry } from './utils';

// グローバル変数の型定義
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prismaクライアントの拡張
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  }).$extends({
    // カスタムメソッドの追加
    model: {
      incident: {
        // インシデントの統計情報を取得
        async getStats() {
          const stats = await prisma.incident.groupBy({
            by: ['status', 'type', 'urgency', 'impact'],
            _count: true,
          });
          return stats;
        },
      },
      channel: {
        // アクティブなチャンネルのみ取得
        async findManyActive() {
          return prisma.channel.findMany({
            where: { enabled: true },
            orderBy: { name: 'asc' },
          });
        },
      },
    },
    // クエリの拡張
    query: {
      // 自動リトライ機能
      $allOperations({ operation, args, query }) {
        if (operation.includes('create') || operation.includes('update') || operation.includes('delete')) {
          return withRetry(() => query(args));
        }
        return query(args);
      },
    },
  });
};

// 開発環境ではグローバル変数を使用してホットリロード時の接続数増加を防ぐ
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
