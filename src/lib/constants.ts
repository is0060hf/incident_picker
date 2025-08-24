// アプリケーション全体の定数定義

// インシデント関連の定数
export const URGENCY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const IMPACT_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const INCIDENT_TYPES = {
  OUTAGE: '障害',
  BUG: '不具合',
} as const;

export const INCIDENT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

// 日本語ラベル
export const URGENCY_LABELS = {
  [URGENCY_LEVELS.HIGH]: '高',
  [URGENCY_LEVELS.MEDIUM]: '中',
  [URGENCY_LEVELS.LOW]: '低',
} as const;

export const IMPACT_LABELS = {
  [IMPACT_LEVELS.HIGH]: '高',
  [IMPACT_LEVELS.MEDIUM]: '中',
  [IMPACT_LEVELS.LOW]: '低',
} as const;

export const STATUS_LABELS = {
  [INCIDENT_STATUS.OPEN]: 'オープン',
  [INCIDENT_STATUS.IN_PROGRESS]: '対応中',
  [INCIDENT_STATUS.RESOLVED]: '解決済み',
  [INCIDENT_STATUS.CLOSED]: 'クローズ',
} as const;

// API関連の定数
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  CHANNELS: '/api/channels',
  INCIDENTS: '/api/incidents',
  RULES: '/api/rules',
  DASHBOARD: '/api/dashboard',
  REPORTS: '/api/reports',
  SEARCH: '/api/search',
  AUDIT: '/api/audit',
  SLACK: '/api/slack',
} as const;

// ページネーション
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Slack API関連
export const SLACK_API = {
  RATE_LIMIT: 20, // requests per minute
  MAX_MESSAGES_PER_REQUEST: 1000,
  RETRY_DELAY: 1000, // milliseconds
  MAX_RETRIES: 3,
} as const;

// 日付フォーマット
export const DATE_FORMAT = {
  DISPLAY: 'yyyy/MM/dd HH:mm',
  API: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  FILE_NAME: 'yyyyMMdd_HHmmss',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK: 'ネットワークエラーが発生しました',
  UNAUTHORIZED: '認証が必要です',
  FORBIDDEN: 'アクセス権限がありません',
  NOT_FOUND: 'リソースが見つかりません',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  VALIDATION: '入力内容に誤りがあります',
} as const;
