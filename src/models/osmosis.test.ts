import { describe, it, expect } from 'vitest';
import {
  osmosisDefault,
  osmosisFrame,
  osmosisVolume,
  osmosisEquilibrium,
  osmosisWaterTracers,
  osmosisShot,
} from './osmosis';
describe('osmosis', () => {
  it('conserves total volume', () => {
    const f = osmosisFrame(osmosisDefault, 50);
    expect(f.left + f.right).toBeCloseTo(2 * osmosisVolume, 12);
    expect(f.transfer).toBeGreaterThan(0);
  });
  it('leaves identical pure-water columns unchanged', () => {
    expect(osmosisFrame({ ...osmosisDefault, molesRight: 0 }, 50).transfer).toBe(0);
  });
  it('equilibrates pressure including dilution', () => {
    const a = osmosisEquilibrium(osmosisDefault),
      b = osmosisFrame(osmosisDefault, 120);
    expect(a.drive).toBeCloseTo(0, 8);
    expect(b.transfer).toBeCloseTo(a.transfer, 8);
  });
  it('reverses under sufficient external pressure', () =>
    expect(osmosisFrame({ ...osmosisDefault, external: 500 }, 40).transfer).toBeLessThan(0));
  it('retains fixed tracer identities', () =>
    expect(osmosisWaterTracers(0.00003).map((x) => x.id)).toEqual(
      osmosisWaterTracers(-0.00003).map((x) => x.id),
    ));
  it('reconstructs every chapter', () => {
    for (let i = 0; i < 8; i++) expect(osmosisShot(i, 0.65)).toEqual(osmosisShot(i, 0.65));
  });
});
