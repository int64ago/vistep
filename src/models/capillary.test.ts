import { describe, it, expect } from 'vitest';
import {
  capillaryDefault,
  capillaryEquilibrium,
  capillaryFrame,
  capillaryMeniscus,
  capillaryShot,
} from './capillary';
describe('capillary', () => {
  it('balances surface force and relative weight', () => {
    const f = capillaryEquilibrium(capillaryDefault);
    expect(f.capillaryForce).toBeCloseTo(f.columnWeight, 12);
  });
  it('has inverse-radius equilibrium', () =>
    expect(
      capillaryEquilibrium({ ...capillaryDefault, radius: capillaryDefault.radius / 2 }).height,
    ).toBeCloseTo(2 * capillaryEquilibrium(capillaryDefault).height));
  it('changes sign across 90 degrees', () => {
    expect(capillaryEquilibrium({ ...capillaryDefault, angle: 90 }).height).toBeCloseTo(0, 12);
    expect(capillaryEquilibrium({ ...capillaryDefault, angle: 110 }).height).toBeLessThan(0);
  });
  it('has the contact-angle tangent on the meniscus', () => {
    const p = capillaryMeniscus(1, 30, 10001),
      slope = (p[1].z - p[0].z) / (p[1].x - p[0].x);
    expect(Math.abs(slope)).toBeCloseTo(1 / Math.tan(Math.PI / 6), 2);
  });
  it('converges to the static rise without overshoot', () => {
    const a = capillaryFrame(capillaryDefault, 30);
    expect(a.height).toBeLessThanOrEqual(a.equilibriumHeight);
    expect(a.height).toBeCloseTo(a.equilibriumHeight, 4);
  });
  it('reconstructs all chapters', () => {
    for (let i = 0; i < 8; i++) expect(capillaryShot(i, 0.72)).toEqual(capillaryShot(i, 0.72));
  });
});
