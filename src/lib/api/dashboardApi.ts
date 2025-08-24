import { PrismaClient } from '@prisma/client';
import { format, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export interface DashboardSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byType: {
    障害: number;
    不具合: number;
  };
}

export interface DistributionData {
  urgency: {
    high: number;
    medium: number;
    low: number;
    null: number;
  };
  impact: {
    high: number;
    medium: number;
    low: number;
    null: number;
  };
  matrix: Record<string, number>;
}

export interface TrendData {
  daily?: Array<{
    date: string;
    total: number;
    障害: number;
    不具合: number;
  }>;
  weekly?: Array<{
    week: string;
    total: number;
    障害: number;
    不具合: number;
  }>;
}

export interface ChannelStat {
  channelId: string;
  channelName: string;
  count: number;
}

/**
 * ダッシュボード用API
 */
export function createDashboardApi(prisma: PrismaClient) {
  return {
    /**
     * インシデントのサマリー統計を取得
     */
    async getSummary(): Promise<DashboardSummary> {
      const incidents = await prisma.incident.findMany({
        select: {
          status: true,
          type: true,
        },
      });

      const summary: DashboardSummary = {
        total: incidents.length,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        byType: {
          障害: 0,
          不具合: 0,
        },
      };

      incidents.forEach((incident) => {
        // ステータス別カウント
        switch (incident.status) {
          case 'open':
            summary.open++;
            break;
          case 'in_progress':
            summary.inProgress++;
            break;
          case 'resolved':
            summary.resolved++;
            break;
          case 'closed':
            summary.closed++;
            break;
        }

        // タイプ別カウント
        if (incident.type === '障害') {
          summary.byType.障害++;
        } else if (incident.type === '不具合') {
          summary.byType.不具合++;
        }
      });

      return summary;
    },

    /**
     * 緊急度・影響度の分布を取得
     */
    async getDistribution(): Promise<DistributionData> {
      const incidents = await prisma.incident.findMany({
        select: {
          urgency: true,
          impact: true,
        },
      });

      const distribution: DistributionData = {
        urgency: {
          high: 0,
          medium: 0,
          low: 0,
          null: 0,
        },
        impact: {
          high: 0,
          medium: 0,
          low: 0,
          null: 0,
        },
        matrix: {
          'high-high': 0,
          'high-medium': 0,
          'high-low': 0,
          'medium-high': 0,
          'medium-medium': 0,
          'medium-low': 0,
          'low-high': 0,
          'low-medium': 0,
          'low-low': 0,
        },
      };

      incidents.forEach((incident) => {
        // 緊急度カウント
        if (incident.urgency === 'high') {
          distribution.urgency.high++;
        } else if (incident.urgency === 'medium') {
          distribution.urgency.medium++;
        } else if (incident.urgency === 'low') {
          distribution.urgency.low++;
        } else {
          distribution.urgency.null++;
        }

        // 影響度カウント
        if (incident.impact === 'high') {
          distribution.impact.high++;
        } else if (incident.impact === 'medium') {
          distribution.impact.medium++;
        } else if (incident.impact === 'low') {
          distribution.impact.low++;
        } else {
          distribution.impact.null++;
        }

        // マトリクスカウント
        if (incident.urgency && incident.impact) {
          const key = `${incident.urgency}-${incident.impact}`;
          if (key in distribution.matrix) {
            distribution.matrix[key]++;
          }
        }
      });

      return distribution;
    },

    /**
     * 期間内のトレンドデータを取得
     */
    async getTrends(from: Date, to: Date): Promise<TrendData> {
      const incidents = await prisma.incident.findMany({
        where: {
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          createdAt: true,
          type: true,
        },
      });

      // 期間の日数を計算
      const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (days <= 30) {
        // 日別トレンド
        const dailyMap = new Map<string, { total: number; 障害: number; 不具合: number }>();
        
        // 全ての日付を初期化
        eachDayOfInterval({ start: from, end: to }).forEach((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyMap.set(dateStr, { total: 0, 障害: 0, 不具合: 0 });
        });

        // インシデントをカウント
        incidents.forEach((incident) => {
          const dateStr = format(incident.createdAt, 'yyyy-MM-dd');
          const data = dailyMap.get(dateStr);
          if (data) {
            data.total++;
            if (incident.type === '障害') {
              data.障害++;
            } else if (incident.type === '不具合') {
              data.不具合++;
            }
          }
        });

        return {
          daily: Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            ...data,
          })),
        };
      } else {
        // 週別トレンド
        const weeklyMap = new Map<string, { total: number; 障害: number; 不具合: number }>();
        
        // 全ての週を初期化
        eachWeekOfInterval({ start: from, end: to }).forEach((weekStart) => {
          const weekStr = format(weekStart, 'yyyy-MM-dd');
          weeklyMap.set(weekStr, { total: 0, 障害: 0, 不具合: 0 });
        });

        // インシデントをカウント
        incidents.forEach((incident) => {
          const weekStart = startOfWeek(incident.createdAt);
          const weekStr = format(weekStart, 'yyyy-MM-dd');
          const data = weeklyMap.get(weekStr);
          if (data) {
            data.total++;
            if (incident.type === '障害') {
              data.障害++;
            } else if (incident.type === '不具合') {
              data.不具合++;
            }
          }
        });

        return {
          weekly: Array.from(weeklyMap.entries()).map(([week, data]) => ({
            week,
            ...data,
          })),
        };
      }
    },

    /**
     * 最近のインシデントを取得
     */
    async getRecentIncidents(limit: number = 10) {
      return await prisma.incident.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { channel: true },
      });
    },

    /**
     * チャンネル別の統計を取得
     */
    async getChannelStats(): Promise<ChannelStat[]> {
      const grouped = await prisma.incident.groupBy({
        by: ['channelId'],
        _count: {
          id: true,
        },
      });

      const channelIds = grouped.map(g => g.channelId);
      const channels = await prisma.channel.findMany({
        where: { id: { in: channelIds } },
      });

      const channelMap = new Map(channels.map(ch => [ch.id, ch.name]));

      return grouped.map(g => ({
        channelId: g.channelId,
        channelName: channelMap.get(g.channelId) || 'Unknown',
        count: g._count.id,
      }));
    },
  };
}
