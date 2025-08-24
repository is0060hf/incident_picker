import { PrismaClient } from '@prisma/client';

// グローバル変数の型定義
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prismaクライアントの生成（拡張なし・最小構成）
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// 開発環境ではグローバル変数を使用してホットリロード時の接続数増加を防ぐ
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
