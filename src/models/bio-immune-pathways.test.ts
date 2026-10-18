import { describe, it, expect } from 'vitest';
import {
  adaptiveImmunity,
  cytotoxicResponse,
  immuneRecall,
  meningealLymphEvidence,
} from './bio-immune-pathways';
describe('immune pathway evidence', () => {
  it('orders presentation, activation, clonal expansion and antibody output', () => {
    expect(adaptiveImmunity(0.15).activation).toBe(0);
    expect(adaptiveImmunity(0.4).cloneCount).toBe(1);
    expect(adaptiveImmunity(0.64).antibodies.every((a) => a.progress === 0)).toBe(true);
    expect(adaptiveImmunity(1).bound).toBe(6);
  });
  it('does not activate an unmatched selected clone or remove the helper signal silently', () => {
    for (const f of [adaptiveImmunity(1, false), adaptiveImmunity(1, true, false)]) {
      expect(f.activation).toBe(0);
      expect(f.bound).toBe(0);
      expect(f.entryFraction).toBe(1);
    }
  });
  it('requires contact and recognition before target-cell death', () => {
    expect(cytotoxicResponse(0.2).recognition).toBe(false);
    expect(cytotoxicResponse(0.4).apoptosis).toBe(0);
    expect(cytotoxicResponse(1, false).apoptosis).toBe(0);
    expect(cytotoxicResponse(1).apoptosis).toBe(1);
  });
  it('distinguishes antigen-specific recall from a primary response to a different antigen', () => {
    expect(immuneRecall(0.2, true, true)).toBeCloseTo(1 - Math.exp(-0.8), 12);
    expect(immuneRecall(0.2, false, true)).toBe(0);
    expect(immuneRecall(0.9, false, true)).toBeGreaterThan(0);
    expect(immuneRecall(0.6, true, false)).toBe(immuneRecall(0.6, false, true));
  });
  it('does not infer functional transport from a fluorescent identity marker alone', () => {
    expect(meningealLymphEvidence(1, true, false)).toMatchObject({
      identitySupported: true,
      transportSupported: false,
    });
    expect(meningealLymphEvidence(1, false, true)).toMatchObject({
      identitySupported: false,
      transportSupported: true,
    });
    expect(meningealLymphEvidence(0.2, true, true).transportSupported).toBe(false);
  });
});
