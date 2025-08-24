import { describe, it, expect } from 'vitest';
import { determineIncidentType } from '../src/lib/incidents/incidentType';

describe('Incident Type Determination (Red phase)', () => {
  describe('determineIncidentType', () => {
    it('classifies as 障害 when urgency is high', () => {
      expect(determineIncidentType('high', 'low')).toBe('障害');
      expect(determineIncidentType('high', 'medium')).toBe('障害');
      expect(determineIncidentType('high', 'high')).toBe('障害');
      expect(determineIncidentType('high', null)).toBe('障害');
    });

    it('classifies as 障害 when urgency is medium', () => {
      expect(determineIncidentType('medium', 'low')).toBe('障害');
      expect(determineIncidentType('medium', 'medium')).toBe('障害');
      expect(determineIncidentType('medium', 'high')).toBe('障害');
      expect(determineIncidentType('medium', null)).toBe('障害');
    });

    it('classifies as 障害 when impact is high regardless of urgency', () => {
      expect(determineIncidentType('low', 'high')).toBe('障害');
      expect(determineIncidentType(null, 'high')).toBe('障害');
    });

    it('classifies as 不具合 when urgency is low and impact is not high', () => {
      expect(determineIncidentType('low', 'low')).toBe('不具合');
      expect(determineIncidentType('low', 'medium')).toBe('不具合');
      expect(determineIncidentType('low', null)).toBe('不具合');
    });

    it('classifies as 不具合 when only impact is medium or low', () => {
      expect(determineIncidentType(null, 'medium')).toBe('不具合');
      expect(determineIncidentType(null, 'low')).toBe('不具合');
    });

    it('returns null when both urgency and impact are null', () => {
      expect(determineIncidentType(null, null)).toBeNull();
    });
  });

  describe('Integration with classification', () => {
    it('correctly determines incident type after auto-classification', () => {
      // 緊急度: high, 影響度: low → 障害
      const classification1 = {
        urgency: 'high' as const,
        impact: 'low' as const,
      };
      expect(determineIncidentType(classification1.urgency, classification1.impact)).toBe('障害');

      // 緊急度: low, 影響度: high → 障害
      const classification2 = {
        urgency: 'low' as const,
        impact: 'high' as const,
      };
      expect(determineIncidentType(classification2.urgency, classification2.impact)).toBe('障害');

      // 緊急度: low, 影響度: medium → 不具合
      const classification3 = {
        urgency: 'low' as const,
        impact: 'medium' as const,
      };
      expect(determineIncidentType(classification3.urgency, classification3.impact)).toBe('不具合');
    });
  });
});
