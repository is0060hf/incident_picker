import { PrismaClient, Prisma } from '@prisma/client';
import { format } from 'date-fns';

export interface ReportFilters {
  urgency?: string[];
  impact?: string[];
  type?: string;
  status?: string[];
  from?: Date;
  to?: Date;
  channelId?: string;
}

export interface ReportResult {
  csv: string;
  filename: string;
}

/**
 * レポート生成API
 */
export function createReportApi(prisma: PrismaClient) {
  /**
   * CSV用の文字列エスケープ
   */
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    
    // ダブルクォート、改行、カンマが含まれる場合はエスケープ
    if (str.includes('"') || str.includes('\n') || str.includes(',')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  };

  /**
   * 日時のフォーマット
   */
  const formatDateTime = (date: Date): string => {
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  };

  /**
   * ファイル名の生成
   */
  const generateFilename = (prefix: string): string => {
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    return `${prefix}-${timestamp}.csv`;
  };

  return {
    /**
     * インシデントレポートの生成
     */
    async generateIncidentReport(filters?: ReportFilters): Promise<ReportResult> {
      // WHERE句の構築
      const where: Prisma.IncidentWhereInput = {};
      
      if (filters) {
        if (filters.urgency && filters.urgency.length > 0) {
          where.urgency = { in: filters.urgency };
        }
        
        if (filters.impact && filters.impact.length > 0) {
          where.impact = { in: filters.impact };
        }
        
        if (filters.type) {
          where.type = filters.type;
        }
        
        if (filters.status && filters.status.length > 0) {
          where.status = { in: filters.status };
        }
        
        if (filters.from || filters.to) {
          where.createdAt = {};
          if (filters.from) where.createdAt.gte = filters.from;
          if (filters.to) where.createdAt.lte = filters.to;
        }
        
        if (filters.channelId) {
          where.channelId = filters.channelId;
        }
      }

      // インシデントの取得
      const incidents = await prisma.incident.findMany({
        where,
        include: {
          channel: true,
          message: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // CSVヘッダー
      const headers = [
        'ID',
        'タイトル',
        '説明',
        '緊急度',
        '影響度',
        'タイプ',
        'ステータス',
        '担当者',
        'チャンネル',
        '作成日時',
        '更新日時',
        'Slackリンク',
        'メモ',
      ];

      // CSV行の生成
      const rows = incidents.map((incident) => {
        const slackUrl = incident.channel && incident.message
          ? `https://slack.com/archives/${incident.channel.slackChannelId}/p${incident.message.slackTs.replace('.', '')}`
          : '';

        return [
          escapeCSV(incident.id),
          escapeCSV(incident.title),
          escapeCSV(incident.description),
          escapeCSV(incident.urgency),
          escapeCSV(incident.impact),
          escapeCSV(incident.type),
          escapeCSV(incident.status),
          escapeCSV(incident.assignee),
          escapeCSV(incident.channel?.name),
          escapeCSV(formatDateTime(incident.createdAt)),
          escapeCSV(formatDateTime(incident.updatedAt)),
          escapeCSV(slackUrl),
          escapeCSV(incident.notes),
        ].join(',');
      });

      // CSV生成
      const csv = [headers.join(','), ...rows].join('\n') + '\n';

      return {
        csv,
        filename: generateFilename('incident-report'),
      };
    },

    /**
     * チャンネル別統計レポートの生成
     */
    async generateChannelReport(): Promise<ReportResult> {
      // チャンネル別の集計
      const stats = await prisma.incident.groupBy({
        by: ['channelId'],
        _count: {
          id: true,
        },
      });

      // チャンネル情報の取得
      const channelIds = stats.map(s => s.channelId);
      const channels = await prisma.channel.findMany({
        where: { id: { in: channelIds } },
      });

      const channelMap = new Map(channels.map(ch => [ch.id, ch]));

      // CSVヘッダー
      const headers = ['チャンネル名', 'SlackチャンネルID', 'インシデント数'];

      // CSV行の生成
      const rows = stats.map((stat) => {
        const channel = channelMap.get(stat.channelId);
        return [
          escapeCSV(channel?.name || 'Unknown'),
          escapeCSV(channel?.slackChannelId || ''),
          escapeCSV(stat._count.id),
        ].join(',');
      });

      // CSV生成
      const csv = [headers.join(','), ...rows].join('\n') + '\n';

      return {
        csv,
        filename: generateFilename('channel-report'),
      };
    },

    /**
     * サマリー統計レポートの生成
     */
    async generateSummaryReport(from: Date, to: Date): Promise<ReportResult> {
      // 期間内のインシデントを取得
      const incidents = await prisma.incident.findMany({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      });

      // 統計の集計
      const stats = {
        total: incidents.length,
        byStatus: {
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
        },
        byType: {
          障害: 0,
          不具合: 0,
          未分類: 0,
        },
        byUrgency: {
          high: 0,
          medium: 0,
          low: 0,
          null: 0,
        },
        byImpact: {
          high: 0,
          medium: 0,
          low: 0,
          null: 0,
        },
      };

      incidents.forEach((incident) => {
        // ステータス別
        if (incident.status in stats.byStatus) {
          stats.byStatus[incident.status as keyof typeof stats.byStatus]++;
        }

        // タイプ別
        if (incident.type === '障害') {
          stats.byType.障害++;
        } else if (incident.type === '不具合') {
          stats.byType.不具合++;
        } else {
          stats.byType.未分類++;
        }

        // 緊急度別
        if (incident.urgency) {
          stats.byUrgency[incident.urgency as keyof typeof stats.byUrgency]++;
        } else {
          stats.byUrgency.null++;
        }

        // 影響度別
        if (incident.impact) {
          stats.byImpact[incident.impact as keyof typeof stats.byImpact]++;
        } else {
          stats.byImpact.null++;
        }
      });

      // CSV生成
      const rows = [
        `期間,${format(from, 'yyyy-MM-dd')} 〜 ${format(to, 'yyyy-MM-dd')}`,
        `合計インシデント数,${stats.total}`,
        '',
        'ステータス別',
        `オープン,${stats.byStatus.open}`,
        `対応中,${stats.byStatus.in_progress}`,
        `解決済み,${stats.byStatus.resolved}`,
        `クローズ,${stats.byStatus.closed}`,
        '',
        'タイプ別',
        `障害,${stats.byType.障害}`,
        `不具合,${stats.byType.不具合}`,
        `未分類,${stats.byType.未分類}`,
        '',
        '緊急度別',
        `高,${stats.byUrgency.high}`,
        `中,${stats.byUrgency.medium}`,
        `低,${stats.byUrgency.low}`,
        `未設定,${stats.byUrgency.null}`,
        '',
        '影響度別',
        `高,${stats.byImpact.high}`,
        `中,${stats.byImpact.medium}`,
        `低,${stats.byImpact.low}`,
        `未設定,${stats.byImpact.null}`,
      ];

      const csv = rows.join('\n') + '\n';

      return {
        csv,
        filename: generateFilename('summary-report'),
      };
    },
  };
}
