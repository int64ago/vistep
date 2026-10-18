import { describe, it, expect } from 'vitest';
import { conditioningEvidence, motorMapping, languageEvidence } from './bio-neural-evidence';
describe('neural research and case evidence', () => {
  it('matches an independent learning recurrence solution', () => {
    expect(conditioningEvidence(8, 0, true, 0.25).association).toBeCloseTo(1 - 0.75 ** 8, 12);
    expect(conditioningEvidence(8, 4, true, 0.25).association).toBeCloseTo(
      (1 - 0.75 ** 8) * 0.75 ** 4,
      12,
    );
  });
  it('separates food response from acquired sound response and extinction', () => {
    expect(conditioningEvidence(20, 0, false).soundResponse).toBe(0);
    expect(conditioningEvidence(20, 0, false).foodResponse).toBe(1);
    expect(conditioningEvidence(0).association).toBe(0);
    expect(conditioningEvidence(12, 24).association).toBeLessThan(0.002);
    expect(conditioningEvidence(24, 0, true, 0).association).toBe(0);
  });
  it('keeps cortical position and contralateral side consistent', () => {
    expect(motorMapping('leg').cortex.y).toBeLessThan(motorMapping('face').cortex.y);
    expect(motorMapping('hand', 'left').bodySide).toBe('right');
    expect(motorMapping('hand', 'right').bodySide).toBe('left');
  });
  it('preserves normal hearing and vocal organs while contrasting functions', () => {
    expect(languageEvidence('S')).toMatchObject({
      fluentProduction: false,
      spokenComprehension: true,
      hearing: true,
      vocalOrgans: true,
    });
    expect(languageEvidence('H')).toMatchObject({
      fluentProduction: true,
      spokenComprehension: false,
      hearing: true,
      vocalOrgans: true,
    });
  });
});
