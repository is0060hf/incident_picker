import { PrismaClient, Prisma } from '@prisma/client';
import { determineIncidentType } from '../incidents/incidentType';
import { createAuditApi } from './auditApi';

export interface ListIncidentsParams {
  page?: number;
  limit?: number;
  q?: string;
  from?: Date;
  to?: Date;
  urgency?: Array<'high' | 'medium' | 'low'>;
  impact?: Array<'high' | 'medium' | 'low'>;
  type?: '障害' | '不具合';
  status?: Array<'open' | 'in_progress' | 'resolved' | 'closed'>;
}

export interface ListIncidentsResult {
  incidents: any[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UpdateIncidentInput {
  urgency?: 'high' | 'medium' | 'low' | null;
  impact?: 'high' | 'medium' | 'low' | null;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee?: string | null;
  notes?: string | null;
}

/**
 * インシデント管理API
 */
export function createIncidentsApi(prisma: PrismaClient) {
  return {
    /**
     * インシデント一覧を取得
     */
    async listIncidents(params: ListIncidentsParams): Promise<ListIncidentsResult> {
      const {
        page = 1,
        limit = 10,
        q,
        from,
        to,
        urgency,
        impact,
        type,
        status,
      } = params;

      // WHERE句の構築
      const where: Prisma.IncidentWhereInput = {};

      // 検索クエリがある場合はAND条件を使用
      if (q || from || to || (urgency && urgency.length > 0) || (impact && impact.length > 0) || type || (status && status.length > 0)) {
        const conditions: Prisma.IncidentWhereInput[] = [];

        // 検索クエリ
        if (q) {
          conditions.push({
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          });
        }

        // 緊急度フィルタ
        if (urgency && urgency.length > 0) {
          conditions.push({ urgency: { in: urgency } });
        }

        // 影響度フィルタ
        if (impact && impact.length > 0) {
          conditions.push({ impact: { in: impact } });
        }

        // タイプフィルタ
        if (type) {
          conditions.push({ type });
        }

        // ステータスフィルタ
        if (status && status.length > 0) {
          conditions.push({ status: { in: status } });
        }

        // 日付範囲（最後に追加）
        if (from || to) {
          const dateFilter: any = {};
          if (from) dateFilter.gte = from;
          if (to) dateFilter.lte = to;
          conditions.push({ createdAt: dateFilter });
        }

        // 条件を結合
        if (conditions.length === 1) {
          Object.assign(where, conditions[0]);
        } else if (conditions.length > 1) {
          // 検索クエリまたは日付範囲がある場合はAND配列を使用
          if (q || from || to) {
            where.AND = conditions;
          } else {
            // それ以外は個別のプロパティとして適用
            conditions.forEach(condition => {
              Object.assign(where, condition);
            });
          }
        }
      }

      // ページネーション計算
      const skip = (page - 1) * limit;

      // データ取得
      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.incident.count({ where }),
      ]);

      return {
        incidents,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    },

    /**
     * 単一のインシデントを取得
     */
    async getIncident(id: string) {
      return await prisma.incident.findUnique({
        where: { id },
        include: {
          channel: true,
          message: true,
        },
      });
    },

    /**
     * インシデントを更新
     */
    async updateIncident(
      id: string, 
      input: UpdateIncidentInput,
      userId?: string,
      ipAddress?: string,
      userAgent?: string
    ) {
      const { urgency, impact, status, assignee, notes } = input;
      
      // 既存の値を取得
      const existing = await prisma.incident.findUnique({
        where: { id },
        select: { 
          urgency: true, 
          impact: true, 
          status: true,
          assignee: true,
          notes: true,
          title: true,
        },
      });
      
      if (!existing) {
        throw new Error('Incident not found');
      }

      // 緊急度・影響度が変更された場合、タイプを再計算
      let type = undefined;
      const urgencyManual = urgency !== undefined;
      const impactManual = impact !== undefined;
      
      if (urgencyManual || impactManual) {
        const finalUrgency = urgency !== undefined ? urgency : existing.urgency;
        const finalImpact = impact !== undefined ? impact : existing.impact;
        type = determineIncidentType(
          finalUrgency as 'high' | 'medium' | 'low' | null, 
          finalImpact as 'high' | 'medium' | 'low' | null
        );
      }

      const updateData: any = {};
      const changes: Record<string, any> = {};

      if (urgency !== undefined && urgency !== existing.urgency) {
        updateData.urgency = urgency;
        updateData.urgencyManual = true;
        changes.urgency = { from: existing.urgency, to: urgency };
      }
      if (impact !== undefined && impact !== existing.impact) {
        updateData.impact = impact;
        updateData.impactManual = true;
        changes.impact = { from: existing.impact, to: impact };
      }
      if (type !== undefined) {
        updateData.type = type;
      }
      if (status !== undefined && status !== existing.status) {
        updateData.status = status;
        changes.status = { from: existing.status, to: status };
      }
      if (assignee !== undefined && assignee !== existing.assignee) {
        updateData.assignee = assignee;
        changes.assignee = { from: existing.assignee, to: assignee };
      }
      if (notes !== undefined && notes !== existing.notes) {
        updateData.notes = notes;
        changes.notes = { from: existing.notes, to: notes };
      }

      const updated = await prisma.incident.update({
        where: { id },
        data: updateData,
      });

      // 監査ログを記録
      if (userId && Object.keys(changes).length > 0) {
        const auditApi = createAuditApi(prisma);
        await auditApi.logAction({
          userId,
          action: 'UPDATE_INCIDENT',
          targetType: 'incident',
          targetId: id,
          changes,
          metadata: {
            incidentTitle: existing.title,
            manual: urgencyManual || impactManual,
          },
          ipAddress,
          userAgent,
        });
      }

      return updated;
    },
  };
}
