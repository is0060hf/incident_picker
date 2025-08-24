import { PrismaClient, Prisma } from '@prisma/client';
import { determineIncidentType } from '../incidents/incidentType';
import { createAuditApi } from './auditApi';

export interface IncidentDetailResult {
  incident: any;
  slackUrl: string;
  threadMessages: any[];
}

export interface UpdateIncidentInput {
  urgency?: 'high' | 'medium' | 'low' | null;
  impact?: 'high' | 'medium' | 'low' | null;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee?: string | null;
  notes?: string | null;
}

/**
 * インシデント詳細管理API
 */
export function createIncidentDetailApi(prisma: PrismaClient) {
  const api = {
    /**
     * インシデントの詳細情報を取得
     */
    async getIncidentDetail(id: string): Promise<IncidentDetailResult | null> {
      const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
          channel: true,
          message: true,
        },
      });

      if (!incident) {
        return null;
      }

      // Slack URLの生成
      const slackUrl = `https://slack.com/archives/${incident.channel.slackChannelId}/p${incident.message.slackTs.replace('.', '')}`;

      // スレッドメッセージの取得
      let threadMessages: any[] = [];
      if (incident.message.raw && (incident.message.raw as any).thread_ts) {
        threadMessages = await prisma.slackMessage.findMany({
          where: {
            channelId: incident.channelId,
            raw: {
              path: ['thread_ts'],
              equals: (incident.message.raw as any).thread_ts,
            },
            NOT: {
              slackTs: incident.message.slackTs,
            },
          },
          orderBy: { slackTs: 'asc' },
        });
      }

      return {
        incident,
        slackUrl,
        threadMessages: threadMessages || [],
      };
    },

    /**
     * インシデントの更新履歴を取得
     */
    async getIncidentHistory(incidentId: string) {
      return await prisma.incidentHistory.findMany({
        where: { incidentId },
        orderBy: { changedAt: 'desc' },
      });
    },

    /**
     * インシデントの詳細を更新
     */
    async updateIncidentDetails(
      id: string,
      input: UpdateIncidentInput,
      changedBy: string
    ) {
      return await prisma.$transaction(async (tx) => {
        // 既存のインシデント情報を取得
        const existing = await tx.incident.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new Error('Incident not found');
        }

        // 変更履歴を記録
        const historyData: Prisma.IncidentHistoryCreateManyInput[] = [];

        if (input.urgency !== undefined && input.urgency !== existing.urgency) {
          historyData.push({
            incidentId: id,
            field: 'urgency',
            oldValue: existing.urgency,
            newValue: input.urgency,
            changedBy,
          });
        }

        if (input.impact !== undefined && input.impact !== existing.impact) {
          historyData.push({
            incidentId: id,
            field: 'impact',
            oldValue: existing.impact,
            newValue: input.impact,
            changedBy,
          });
        }

        if (input.status !== undefined && input.status !== existing.status) {
          historyData.push({
            incidentId: id,
            field: 'status',
            oldValue: existing.status,
            newValue: input.status,
            changedBy,
          });
        }

        if (input.assignee !== undefined && input.assignee !== existing.assignee) {
          historyData.push({
            incidentId: id,
            field: 'assignee',
            oldValue: existing.assignee,
            newValue: input.assignee,
            changedBy,
          });
        }

        if (input.notes !== undefined && input.notes !== existing.notes) {
          historyData.push({
            incidentId: id,
            field: 'notes',
            oldValue: existing.notes,
            newValue: input.notes,
            changedBy,
          });
        }

        // 履歴を保存
        if (historyData.length > 0) {
          await tx.incidentHistory.createMany({ data: historyData });
        }

        // インシデントを更新
        const updateData: any = {};
        
        if (input.urgency !== undefined) {
          updateData.urgency = input.urgency;
          updateData.urgencyManual = true;
        }
        
        if (input.impact !== undefined) {
          updateData.impact = input.impact;
          updateData.impactManual = true;
        }

        // タイプを再計算
        if (input.urgency !== undefined || input.impact !== undefined) {
          const finalUrgency = input.urgency !== undefined ? input.urgency : existing.urgency;
          const finalImpact = input.impact !== undefined ? input.impact : existing.impact;
          updateData.type = determineIncidentType(
            finalUrgency as 'high' | 'medium' | 'low' | null, 
            finalImpact as 'high' | 'medium' | 'low' | null
          );
        }

        if (input.status !== undefined) {
          updateData.status = input.status;
        }
        
        if (input.assignee !== undefined) {
          updateData.assignee = input.assignee;
        }
        
        if (input.notes !== undefined) {
          updateData.notes = input.notes;
        }

        return await tx.incident.update({
          where: { id },
          data: updateData,
        });
      });
    },

    /**
     * インシデントデータをエクスポート
     */
    async exportIncidentData(id: string) {
      // インシデント詳細を取得
      const detail = await api.getIncidentDetail(id);
      
      if (!detail) {
        return null;
      }

      // 履歴を取得
      const history = await api.getIncidentHistory(id);

      // Slackスレッドデータを整形
      const slackThread = {
        original: detail.incident.message.raw,
        replies: detail.threadMessages.map((m: any) => m.raw),
      };

      return {
        incident: detail.incident,
        slackThread,
        history,
      };
    },
  };
  
  return api;
}
