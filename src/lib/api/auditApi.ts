import { PrismaClient, Prisma } from '@prisma/client';

export interface AuditLogInput {
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string[];
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export interface AuditLogResult {
  logs: any[];
  total: number;
}

export interface ActionSummary {
  action: string;
  count: number;
}

export interface UserActivitySummary {
  userId: string;
  email: string;
  actionCount: number;
  lastAction?: Date;
}

/**
 * 監査ログAPI
 */
export function createAuditApi(prisma: PrismaClient) {
  return {
    /**
     * アクションをログに記録
     */
    async logAction(input: AuditLogInput) {
      return await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          changes: input.changes || undefined,
          metadata: input.metadata || undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    },

    /**
     * 監査ログを取得
     */
    async getAuditLogs(filters: AuditLogFilter): Promise<AuditLogResult> {
      const where: Prisma.AuditLogWhereInput = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.action && filters.action.length > 0) {
        where.action = { in: filters.action };
      }

      if (filters.targetType) {
        where.targetType = filters.targetType;
      }

      if (filters.targetId) {
        where.targetId = filters.targetId;
      }

      if (filters.from || filters.to) {
        where.createdAt = {};
        if (filters.from) {
          where.createdAt.gte = filters.from;
        }
        if (filters.to) {
          where.createdAt.lte = filters.to;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: filters.limit,
          skip: filters.offset,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return { logs, total };
    },

    /**
     * アクションのサマリーを取得
     */
    async getActionSummary(filters: {
      from?: Date;
      to?: Date;
    }): Promise<ActionSummary[]> {
      const where: Prisma.AuditLogWhereInput = {};

      if (filters.from || filters.to) {
        where.createdAt = {};
        if (filters.from) {
          where.createdAt.gte = filters.from;
        }
        if (filters.to) {
          where.createdAt.lte = filters.to;
        }
      }

      const summary = await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return summary.map(item => ({
        action: item.action,
        count: item._count.id,
      }));
    },

    /**
     * ユーザーアクティビティのサマリーを取得
     */
    async getUserActivity(filters: {
      from?: Date;
      to?: Date;
    }): Promise<UserActivitySummary[]> {
      const whereClause = (filters.from || filters.to) 
        ? `WHERE ${[
            filters.from ? `al."createdAt" >= $1` : '',
            filters.to ? `al."createdAt" <= $${filters.from ? 2 : 1}` : ''
          ].filter(Boolean).join(' AND ')}`
        : '';

      const params: any[] = [];
      if (filters.from) params.push(filters.from);
      if (filters.to) params.push(filters.to);

      const query = `
        SELECT 
          al."userId",
          u.email,
          COUNT(al.id) as "actionCount",
          MAX(al."createdAt") as "lastAction"
        FROM "AuditLog" al
        JOIN "User" u ON al."userId" = u.id
        ${whereClause}
        GROUP BY al."userId", u.email
        ORDER BY "actionCount" DESC
      `;

      const results = await prisma.$queryRawUnsafe(query, ...params);

      return (results as any[]).map(row => ({
        userId: row.userId,
        email: row.email,
        actionCount: parseInt(row.actionCount),
        lastAction: row.lastAction,
      }));
    },

    /**
     * 特定のターゲットの最近のアクションを取得
     */
    async getRecentActions(
      targetType: string,
      targetId: string,
      limit: number = 10
    ) {
      return await prisma.auditLog.findMany({
        where: {
          targetType,
          targetId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    },
  };
}
