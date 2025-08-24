import { PrismaClient } from '@prisma/client';
import { classifyUrgency, classifyImpact } from './autoClassify';
import { determineIncidentType } from './incidentType';

export interface ClassificationResult {
  urgency: 'high' | 'medium' | 'low' | null;
  impact: 'high' | 'medium' | 'low' | null;
  type: '障害' | '不具合' | null;
  autoClassified: boolean;
}

/**
 * インシデント分類器
 * Slackメッセージから緊急度・影響度を判定し、インシデントタイプを決定
 */
export class IncidentClassifier {
  constructor(private prisma: PrismaClient) {}

  /**
   * メッセージとスレッドからインシデントを分類
   * @param messageText メインメッセージ
   * @param threadTexts スレッドメッセージの配列
   * @returns 分類結果
   */
  async classify(messageText: string, threadTexts: string[] = []): Promise<ClassificationResult> {
    // 全テキストを結合（スレッドも含めて判定）
    const combinedText = [messageText, ...threadTexts].join(' ');

    // ルールを取得
    const [urgencyRules, impactRules] = await Promise.all([
      this.prisma.urgencyRule.findMany({ where: { enabled: true } }),
      this.prisma.impactRule.findMany({ where: { enabled: true } }),
    ]);

    // 自動分類
    const urgency = classifyUrgency(combinedText, urgencyRules);
    const impact = classifyImpact(combinedText, impactRules);

    // インシデントタイプを決定
    const type = determineIncidentType(urgency, impact);

    return {
      urgency,
      impact,
      type,
      autoClassified: true,
    };
  }



  /**
   * 既存のインシデントに手動で分類を上書き
   * @param incidentId インシデントID
   * @param urgency 緊急度（nullで自動分類値を使用）
   * @param impact 影響度（nullで自動分類値を使用）
   */
  async updateManualClassification(
    incidentId: string,
    urgency?: 'high' | 'medium' | 'low' | null,
    impact?: 'high' | 'medium' | 'low' | null
  ) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    // 手動で指定された値を優先、なければ既存の値を使用
    const finalUrgency = urgency !== undefined ? urgency : incident.urgency;
    const finalImpact = impact !== undefined ? impact : incident.impact;
    const type = determineIncidentType(
      finalUrgency as 'high' | 'medium' | 'low' | null,
      finalImpact as 'high' | 'medium' | 'low' | null
    );

    await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        urgency: finalUrgency,
        impact: finalImpact,
        type,
        urgencyManual: urgency !== undefined,
        impactManual: impact !== undefined,
      },
    });
  }
}
