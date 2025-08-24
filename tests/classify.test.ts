import { describe, it, expect } from 'vitest';
import { classifyUrgency, classifyImpact, determineIncidentLevel } from '../src/lib/incidents/classify';

describe('Incident classification (Red phase)', () => {
  it('classifyUrgency: detects high urgency with critical keywords', () => {
    const result = classifyUrgency('至急確認お願いします。クリティカルな障害が発生しています。');
    expect(result).toBe('high');
  });

  it('classifyImpact: maps phrases to impact scope', () => {
    expect(classifyImpact('全ユーザーに影響があります')).toBe('high');
    expect(classifyImpact('複数ユーザーで発生しています')).toBe('medium');
    expect(classifyImpact('特定ユーザーAのみ')).toBe('low');
  });

  it('determineIncidentLevel: outage when urgency>=medium or impact=high', () => {
    expect(determineIncidentLevel('medium', 'low')).toBe('outage');
    expect(determineIncidentLevel('low', 'high')).toBe('outage');
    expect(determineIncidentLevel('low', 'low')).toBe('bug');
  });
});


