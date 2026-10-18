import { describe, it, expect } from 'vitest';
import {
  pairEvidence,
  captureRecoil,
  captureTransmission,
  invariantPair,
  parityCounts,
  resonanceBins,
} from './particle-evidence';
describe('particle evidence', () => {
  it('respects pair creation threshold and energy partition', () => {
    expect(pairEvidence(1, 1).pairTerm).toBe(0);
    expect(pairEvidence(2, 1).kineticEach).toBeCloseTo(0.48900105);
    expect(pairEvidence(2, 1).transmission).toBeLessThan(pairEvidence(2, 1).baseline);
  });
  it('gives the expected 7Li ground-branch recoil scale', () => {
    expect(captureRecoil()).toBeCloseTo(56.95, 1);
  });
  it('reconstructs invariant mass and collinear limits', () => {
    expect(invariantPair(62.5, 62.5, Math.PI)).toBeCloseTo(125);
    expect(invariantPair(62.5, 62.5, 0)).toBe(0);
    expect(invariantPair(1.5485, 1.5485, Math.PI, 0.000511)).toBeCloseTo(3.097);
  });
  it('normalizes parity counts and restores symmetry when unpolarized', () => {
    const x = parityCounts(0.9);
    expect(x.up + x.down).toBe(1);
    expect(x.down).toBeGreaterThan(x.up);
    expect(parityCounts(0).up).toBe(0.5);
    expect(x.angular(-1)).toBeGreaterThan(x.angular(1));
  });
  it('separates background-only and signal models', () => {
    const a = resonanceBins('higgs', 1, false);
    expect(a.every((x) => x.total === x.background)).toBe(true);
    expect(
      resonanceBins('jpsi', 1).reduce((s, x) => Math.max(s, x.total - x.background), 0),
    ).toBeGreaterThan(30);
  });
});

it('filters longitudinal recoil energy in a planar retarding field', () => {
  expect(captureTransmission(0)).toBe(1);
  expect(captureTransmission(captureRecoil())).toBe(0);
  expect(captureTransmission(captureRecoil() / 4)).toBeCloseTo(0.5);
});
