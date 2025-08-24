import { describe, it, expect } from 'vitest';
import { classifyUrgency, classifyImpact } from '@/lib/incidents/classify';
import { determineIncidentType } from '@/lib/incidents/incidentType';

describe('Comprehensive Classification Logic Tests', () => {
  describe('classifyUrgency', () => {
    describe('正常系', () => {
      it('should classify as high urgency with critical keywords', () => {
        const highUrgencyTexts = [
          '至急対応をお願いします',
          'クリティカルなエラーが発生',
          '緊急度が高い問題です',
          '即座に対応が必要',
          'サービスが停止しています',
        ];

        highUrgencyTexts.forEach(text => {
          expect(classifyUrgency(text, [])).toBe('high');
        });
      });

      it('should classify as medium urgency with moderate keywords', () => {
        const mediumUrgencyTexts = [
          'エラーが発生しています',
          '対応をお願いします',
          '不具合が見つかりました',
          '問題が報告されています',
        ];

        mediumUrgencyTexts.forEach(text => {
          expect(classifyUrgency(text, [])).toBe('medium');
        });
      });

      it('should classify as low urgency with non-critical keywords', () => {
        const lowUrgencyTexts = [
          '改善要望があります',
          '質問があります',
          '確認してください',
          '時間があるときに見てください',
        ];

        lowUrgencyTexts.forEach(text => {
          expect(classifyUrgency(text, [])).toBe('low');
        });
      });

      it('should apply custom rules with higher priority', () => {
        const rules = [
          { pattern: 'カスタムキーワード', level: 'high' as const },
          { pattern: '特別な文字列', level: 'medium' as const },
        ];

        expect(classifyUrgency('これはカスタムキーワードを含みます', rules)).toBe('high');
        expect(classifyUrgency('特別な文字列がここにあります', rules)).toBe('medium');
      });
    });

    describe('境界値テスト', () => {
      it('should handle empty text', () => {
        expect(classifyUrgency('', [])).toBe('low');
      });

      it('should handle null or undefined text', () => {
        expect(classifyUrgency(null as any, [])).toBe('low');
        expect(classifyUrgency(undefined as any, [])).toBe('low');
      });

      it('should handle very long text', () => {
        const longText = 'エラー'.repeat(1000);
        expect(classifyUrgency(longText, [])).toBe('medium');
      });

      it('should handle special characters', () => {
        expect(classifyUrgency('至急!@#$%^&*()', [])).toBe('high');
        expect(classifyUrgency('エラー\n\t\r', [])).toBe('medium');
      });
    });

    describe('異常系', () => {
      it('should handle invalid rules gracefully', () => {
        const invalidRules = [
          { pattern: '', level: 'high' as const },
          { pattern: null as any, level: 'medium' as const },
          { pattern: 'test', level: 'invalid' as any },
        ];

        expect(() => classifyUrgency('テスト', invalidRules)).not.toThrow();
      });
    });
  });

  describe('classifyImpact', () => {
    describe('正常系', () => {
      it('should classify as high impact for all users', () => {
        const highImpactTexts = [
          '全ユーザーに影響があります',
          'すべてのお客様で発生',
          '全体的な障害です',
          'サービス全体が停止',
        ];

        highImpactTexts.forEach(text => {
          expect(classifyImpact(text, [])).toBe('high');
        });
      });

      it('should classify as medium impact for multiple users', () => {
        const mediumImpactTexts = [
          '複数のユーザーで発生',
          '一部のお客様に影響',
          '特定の機能で問題',
          '部分的な障害',
        ];

        mediumImpactTexts.forEach(text => {
          expect(classifyImpact(text, [])).toBe('medium');
        });
      });

      it('should classify as low impact for specific users', () => {
        const lowImpactTexts = [
          '特定ユーザーのみ',
          '個別の問題',
          '限定的な影響',
          '一人のお客様から報告',
        ];

        lowImpactTexts.forEach(text => {
          expect(classifyImpact(text, [])).toBe('low');
        });
      });
    });

    describe('境界値テスト', () => {
      it('should handle edge cases', () => {
        expect(classifyImpact('', [])).toBe('low');
        expect(classifyImpact('　', [])).toBe('low'); // 全角スペース
        expect(classifyImpact('123456789', [])).toBe('low');
      });

      it('should handle mixed impact keywords', () => {
        // 複数のレベルのキーワードが含まれる場合、最も高いレベルを返す
        expect(classifyImpact('全ユーザーと特定ユーザーに影響', [])).toBe('high');
        expect(classifyImpact('複数のユーザーと特定ユーザー', [])).toBe('medium');
      });
    });
  });

  describe('determineIncidentType', () => {
    describe('正常系', () => {
      it('should classify as 障害 when urgency is high', () => {
        expect(determineIncidentType('high', 'low')).toBe('障害');
        expect(determineIncidentType('high', 'medium')).toBe('障害');
        expect(determineIncidentType('high', 'high')).toBe('障害');
      });

      it('should classify as 障害 when urgency is medium', () => {
        expect(determineIncidentType('medium', 'low')).toBe('障害');
        expect(determineIncidentType('medium', 'medium')).toBe('障害');
        expect(determineIncidentType('medium', 'high')).toBe('障害');
      });

      it('should classify as 障害 when impact is high regardless of urgency', () => {
        expect(determineIncidentType('low', 'high')).toBe('障害');
      });

      it('should classify as 不具合 when both urgency and impact are low', () => {
        expect(determineIncidentType('low', 'low')).toBe('不具合');
        expect(determineIncidentType('low', 'medium')).toBe('不具合');
      });
    });

    describe('境界値テスト', () => {
      it('should handle null values', () => {
        expect(determineIncidentType(null, null)).toBe(null);  // 両方nullの場合はnull
        expect(determineIncidentType('high', null)).toBe('障害');
        expect(determineIncidentType(null, 'high')).toBe('障害');
      });

      it('should handle undefined values', () => {
        expect(determineIncidentType(undefined as any, undefined as any)).toBe(null);  // 両方undefinedの場合もnull
        expect(determineIncidentType('medium', undefined as any)).toBe('障害');
        expect(determineIncidentType(undefined as any, 'high')).toBe('障害');
      });

      it('should handle invalid values', () => {
        expect(determineIncidentType('invalid' as any, 'low')).toBe('不具合');
        expect(determineIncidentType('low', 'invalid' as any)).toBe('不具合');
        expect(determineIncidentType('invalid' as any, 'invalid' as any)).toBe('不具合');
      });
    });

    describe('ビジネスルールの検証', () => {
      it('should follow the business rule: 緊急度が中以上または影響度が高 => 障害', () => {
        // 緊急度が中以上
        expect(determineIncidentType('medium', 'low')).toBe('障害');
        expect(determineIncidentType('high', 'low')).toBe('障害');
        
        // 影響度が高
        expect(determineIncidentType('low', 'high')).toBe('障害');
        
        // それ以外
        expect(determineIncidentType('low', 'low')).toBe('不具合');
        expect(determineIncidentType('low', 'medium')).toBe('不具合');
      });
    });
  });

  describe('統合テスト', () => {
    it('should classify incident end-to-end', () => {
      const testCases = [
        {
          text: '至急！全ユーザーでサービスが使えません',
          expectedUrgency: 'high',
          expectedImpact: 'high',
          expectedType: '障害',
        },
        {
          text: 'エラーが発生。複数のお客様から報告あり',
          expectedUrgency: 'medium',
          expectedImpact: 'medium',
          expectedType: '障害',
        },
        {
          text: '特定ユーザーAさんのみ、表示がおかしい',
          expectedUrgency: 'low',
          expectedImpact: 'low',
          expectedType: '不具合',
        },
      ];

      testCases.forEach(({ text, expectedUrgency, expectedImpact, expectedType }) => {
        const urgency = classifyUrgency(text, []);
        const impact = classifyImpact(text, []);
        const type = determineIncidentType(urgency, impact);

        expect(urgency).toBe(expectedUrgency);
        expect(impact).toBe(expectedImpact);
        expect(type).toBe(expectedType);
      });
    });

    it('should handle custom rules in classification', () => {
      const urgencyRules = [
        { pattern: 'カスタム緊急', level: 'high' as const },
      ];
      const impactRules = [
        { pattern: 'カスタム影響', level: 'high' as const },
      ];

      const text = 'カスタム緊急: カスタム影響があります';
      const urgency = classifyUrgency(text, urgencyRules);
      const impact = classifyImpact(text, impactRules);
      const type = determineIncidentType(urgency, impact);

      expect(urgency).toBe('high');
      expect(impact).toBe('high');
      expect(type).toBe('障害');
    });
  });
});
