// データベース関連のユーティリティ関数
import { Prisma } from '@prisma/client';

/**
 * ページネーション用のオフセットを計算
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * 総ページ数を計算
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Prismaのクエリビルダー用のヘルパー
 */
export const prismaHelpers = {
  /**
   * 日付範囲のフィルタを生成
   */
  dateRangeFilter(field: string, from?: Date | string, to?: Date | string) {
    const filter: any = {};
    
    if (from) {
      filter.gte = typeof from === 'string' ? new Date(from) : from;
    }
    
    if (to) {
      filter.lte = typeof to === 'string' ? new Date(to) : to;
    }
    
    return Object.keys(filter).length > 0 ? { [field]: filter } : {};
  },

  /**
   * IN句用のフィルタを生成
   */
  inFilter<T>(field: string, values?: T[]) {
    return values && values.length > 0 ? { [field]: { in: values } } : {};
  },

  /**
   * LIKE検索用のフィルタを生成
   */
  searchFilter(fields: string[], query?: string) {
    if (!query) return {};
    
    return {
      OR: fields.map(field => ({
        [field]: {
          contains: query,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      })),
    };
  },
};

/**
 * トランザクションの再試行ロジック
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // P2034: トランザクションコンフリクトの場合のみリトライ
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * バッチ処理用のヘルパー
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}
