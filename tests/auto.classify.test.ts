import { describe, it, expect, vi } from 'vitest';
import { classifyUrgency, classifyImpact } from '../src/lib/incidents/autoClassify';
import { UrgencyRule, ImpactRule } from '@prisma/client';

describe('Auto Classification Logic (Red phase)', () => {
  describe('classifyUrgency', () => {
    it('classifies message based on urgency rules', () => {
      const rules: UrgencyRule[] = [
        {
          id: '1',
          name: 'Critical Error',
          pattern: 'critical|fatal|emergency',
          value: 'high',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Warning',
          pattern: 'warning|alert',
          value: 'medium',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Info',
          pattern: 'info|notice',
          value: 'low',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 高優先度
      expect(classifyUrgency('System critical error occurred', rules)).toBe('high');
      expect(classifyUrgency('Fatal exception in production', rules)).toBe('high');
      
      // 中優先度
      expect(classifyUrgency('Warning: Memory usage high', rules)).toBe('medium');
      expect(classifyUrgency('Alert: Response time increased', rules)).toBe('medium');
      
      // 低優先度
      expect(classifyUrgency('Info: Deployment completed', rules)).toBe('low');
      
      // ルールにマッチしない場合はnull
      expect(classifyUrgency('Normal operation', rules)).toBeNull();
    });

    it('ignores disabled rules', () => {
      const rules: UrgencyRule[] = [
        {
          id: '1',
          name: 'Disabled Rule',
          pattern: 'error',
          value: 'high',
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(classifyUrgency('error in system', rules)).toBeNull();
    });

    it('returns highest urgency when multiple rules match', () => {
      const rules: UrgencyRule[] = [
        {
          id: '1',
          name: 'Low Priority',
          pattern: 'error',
          value: 'low',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'High Priority',
          pattern: 'error',
          value: 'high',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(classifyUrgency('error occurred', rules)).toBe('high');
    });

    it('handles regex special characters', () => {
      const rules: UrgencyRule[] = [
        {
          id: '1',
          name: 'Special Chars',
          pattern: '\\[ERROR\\]|\\(critical\\)',
          value: 'high',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(classifyUrgency('[ERROR] Something went wrong', rules)).toBe('high');
      expect(classifyUrgency('(critical) System failure', rules)).toBe('high');
    });
  });

  describe('classifyImpact', () => {
    it('classifies message based on impact rules', () => {
      const rules: ImpactRule[] = [
        {
          id: '1',
          name: 'All Users',
          pattern: 'all users|全ユーザー|システム全体',
          value: 'high',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Multiple Users',
          pattern: 'multiple users|複数ユーザー|some users',
          value: 'medium',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Single User',
          pattern: 'single user|特定ユーザー|one user',
          value: 'low',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // 高影響度
      expect(classifyImpact('全ユーザーに影響があります', rules)).toBe('high');
      expect(classifyImpact('System affecting all users', rules)).toBe('high');
      
      // 中影響度
      expect(classifyImpact('複数ユーザーから報告', rules)).toBe('medium');
      
      // 低影響度
      expect(classifyImpact('特定ユーザーのみの問題', rules)).toBe('low');
      
      // ルールにマッチしない場合はnull
      expect(classifyImpact('通常のメッセージ', rules)).toBeNull();
    });

    it('works with thread context', () => {
      const rules: ImpactRule[] = [
        {
          id: '1',
          name: 'Production',
          pattern: 'production|本番環境',
          value: 'high',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mainMessage = 'Issue detected';
      const threadMessages = [
        'This is happening in production environment',
        'Need immediate attention',
      ];

      const combinedText = [mainMessage, ...threadMessages].join(' ');
      expect(classifyImpact(combinedText, rules)).toBe('high');
    });
  });

  describe('Integration with database', () => {
    it('loads rules from database and classifies', async () => {
      // This would use actual Prisma client in implementation
      const mockPrisma = {
        urgencyRule: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: '1',
              name: 'Test Rule',
              pattern: 'urgent',
              value: 'high',
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        },
      };

      const rules = await mockPrisma.urgencyRule.findMany({
        where: { enabled: true },
      });

      expect(classifyUrgency('This is urgent!', rules)).toBe('high');
    });
  });
});
