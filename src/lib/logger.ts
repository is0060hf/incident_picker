// ロギングユーティリティ

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }
  
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
    
    // プロダクション環境では外部ロギングサービスに送信
    if (!this.isDevelopment && level !== 'debug') {
      // TODO: 外部ロギングサービスへの送信実装
      // this.sendToExternalService(level, message, context);
    }
  }
  
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }
  
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    this.log('error', message, errorContext);
  }
  
  // API呼び出しのログ
  logApiCall(method: string, path: string, userId?: string, duration?: number): void {
    this.info(`API call: ${method} ${path}`, {
      userId,
      metadata: { duration },
    });
  }
  
  // Slack API呼び出しのログ
  logSlackApiCall(endpoint: string, success: boolean, error?: Error): void {
    if (success) {
      this.info(`Slack API call succeeded: ${endpoint}`);
    } else {
      this.error(`Slack API call failed: ${endpoint}`, error);
    }
  }
  
  // インシデント操作のログ
  logIncidentAction(action: string, incidentId: string, userId: string, details?: any): void {
    this.info(`Incident action: ${action}`, {
      userId,
      action,
      metadata: { incidentId, details },
    });
  }
}

export const logger = new Logger();
