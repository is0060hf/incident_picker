// アプリケーション全体のエラー定義

/**
 * カスタムエラーの基底クラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends AppError {
  constructor(message = '認証が必要です', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends AppError {
  constructor(message = 'アクセス権限がありません', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message = '入力内容に誤りがあります', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends AppError {
  constructor(message = 'リソースが見つかりません', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Slack APIエラー
 */
export class SlackApiError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'SLACK_API_ERROR', 500, details);
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends AppError {
  constructor(
    message = 'レート制限に達しました',
    public retryAfter?: number,
    details?: any
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * エラーレスポンスの生成
 */
export function createErrorResponse(error: Error): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      }),
      {
        status: error.statusCode || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 未知のエラーの場合
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * エラーハンドリングのラッパー関数
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error as Error);
    }
  }) as T;
}
