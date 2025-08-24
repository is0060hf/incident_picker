export interface RateLimiterOptions {
  /** 時間窓内の最大リクエスト数（デフォルト: 20） */
  maxRequests?: number;
  /** 時間窓のサイズ（ミリ秒、デフォルト: 60000 = 1分） */
  windowMs?: number;
  /** 429エラー時の最大リトライ回数（デフォルト: 3） */
  maxRetries?: number;
}

export interface RateLimiter {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

interface RateLimitError extends Error {
  status: number;
  headers?: Record<string, string>;
}

/**
 * Slack API Tier 2のレート制限（20リクエスト/分）に対応したリミッター
 * 指数バックオフとRetry-Afterヘッダーのサポート付き
 */
export function createRateLimiter(options?: RateLimiterOptions): RateLimiter {
  const {
    maxRequests = 20,
    windowMs = 60000,
    maxRetries = 3,
  } = options || {};

  // スライディングウィンドウ方式でリクエスト時刻を管理
  const requestTimes: number[] = [];

  /**
   * レート制限とリトライ機能付きで関数を実行
   */
  async function executeWithRateLimit<T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    // 古いリクエスト記録を削除
    const now = Date.now();
    const windowStart = now - windowMs;
    while (requestTimes.length > 0 && requestTimes[0] < windowStart) {
      requestTimes.shift();
    }

    // レート制限チェック
    if (requestTimes.length >= maxRequests) {
      const oldestRequest = requestTimes[0];
      const waitTime = oldestRequest + windowMs - now;
      if (waitTime > 0) {
        // レート制限に達した場合は待機
        await delay(waitTime);
        return executeWithRateLimit(fn, retryCount);
      }
    }

    // このリクエストを記録
    requestTimes.push(Date.now());

    try {
      return await fn();
    } catch (error: any) {
      // 429 Too Many Requestsの処理
      if (isRateLimitError(error) && retryCount < maxRetries) {
        const waitTime = calculateBackoffDelay(error, retryCount);
        await delay(waitTime);
        return executeWithRateLimit(fn, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * エラーがレート制限エラーかどうかを判定
   */
  function isRateLimitError(error: any): error is RateLimitError {
    return error?.status === 429;
  }

  /**
   * バックオフ遅延時間を計算
   */
  function calculateBackoffDelay(error: RateLimitError, retryCount: number): number {
    const retryAfter = error.headers?.['retry-after'];
    
    if (retryAfter) {
      // Retry-Afterヘッダーがある場合は優先
      return parseInt(retryAfter) * 1000;
    } else {
      // 指数バックオフ: 1秒, 2秒, 4秒...
      return Math.pow(2, retryCount) * 1000;
    }
  }

  /**
   * 指定時間待機
   */
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    execute: executeWithRateLimit,
  };
}
