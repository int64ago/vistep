import { describe, expect, it } from 'vitest';
import {
  chargedHair,
  conductorChargeSplit,
  electroscopeState,
  foilAngle,
  inductionProtocol,
  ELECTROSTATIC_K,
} from './electrostatic-induction';
describe('electrostatic apparatus', () => {
  it('uses equal potentials and conserves charge in the connected pair', () => {
    const s = conductorChargeSplit(0.3e-9, 1e-9, 0.1, 0.27);
    const va = s.a / 0.045 + s.b / 0.17 + 1e-9 / 0.1,
      vb = s.b / 0.045 + s.a / 0.17 + 1e-9 / 0.27;
    expect(va).toBeCloseTo(vb, 18);
    expect(s.a + s.b).toBe(0.3e-9);
    const neutral = conductorChargeSplit(0.4e-9, 0, 0.1, 0.27);
    expect(neutral.a).toBeCloseTo(0.2e-9, 20);
  });
  it('retains separated induced charges and neutralizes only after recontact', () => {
    const separated = inductionProtocol(2),
      withdrawn = inductionProtocol(3),
      rejoined = inductionProtocol(4);
    expect(separated.a).toBeLessThan(0);
    expect(separated.a).toBe(withdrawn.a);
    expect(inductionProtocol(3.5).a).toBe(withdrawn.a);
    expect(rejoined.a).toBe(0);
    for (let p = 0; p <= 4; p += 0.1) {
      const s = inductionProtocol(p);
      expect(s.a + s.b).toBe(0);
    }
    expect(inductionProtocol(1, -1).a).toBeGreaterThan(0);
  });
  it('opens a neutral electroscope without adding net charge and distinguishes known polarity', () => {
    expect(electroscopeState(0, 0).angle).toBe(0);
    const induced = electroscopeState(1, 0);
    expect(induced.angle).toBeGreaterThan(0);
    expect(induced.top + induced.leaves).toBe(0);
    expect(electroscopeState(0.4, -0.2e-9).angle).toBeLessThan(electroscopeState(0, -0.2e-9).angle);
    expect(electroscopeState(0.4, 0.2e-9).angle).toBeGreaterThan(
      electroscopeState(0, 0.2e-9).angle,
    );
  });
  it('preserves the neutral point when the demonstration source and precharge scale together', () => {
    for (const proximity of [0, 0.1, 0.3, 0.6, 1]) {
      const reference = electroscopeState(proximity, -0.1e-9, 1e-9);
      const visible = electroscopeState(proximity, -2e-9, 20e-9);
      expect(visible.leaves).toBeCloseTo(reference.leaves * 20, 20);
      expect(visible.top + visible.leaves).toBeCloseTo(-2e-9, 20);
      expect(visible.angle).toBe(foilAngle(visible.leaves));
    }
    const angle = electroscopeState(1, 0, 20e-9).angle;
    expect((angle * 180) / Math.PI).toBeCloseTo(7.7736, 3);
    expect(2 * 60 * Math.sin(angle)).toBeGreaterThan(16);
  });
  it('balances foil Coulomb force against gravity', () => {
    const q = 0.3e-9,
      a = foilAngle(q),
      force = (ELECTROSTATIC_K * (q / 2) ** 2) / (2 * 0.06 * Math.sin(a)) ** 2;
    expect(force).toBeCloseTo(0.00001 * 9.8 * Math.tan(a), 12);
    expect(foilAngle(-q)).toBe(a);
  });
  it('preserves hair charge and mirror symmetry with a real spreading response', () => {
    const zero = chargedHair(0),
      charged = chargedHair(1.6e-9);
    expect(charged.reduce((s, h) => s + h.charge, 0)).toBeCloseTo(1.6e-9, 20);
    expect(charged[7].tip.x - charged[0].tip.x).toBeGreaterThan(zero[7].tip.x - zero[0].tip.x);
    for (let i = 0; i < 8; i++) expect(charged[i].tip.x).toBeCloseTo(-charged[7 - i].tip.x, 9);
  });
});
