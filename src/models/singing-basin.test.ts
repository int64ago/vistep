import { describe, expect, it } from 'vitest';
import {
  BASIN_DEFAULT,
  BASIN_LOSS,
  BASIN_SEED_ENERGY,
  basinAntinodes,
  basinDroplets,
  basinEnergy,
  basinEnergyAfter,
  basinFrequency,
  basinModeValue,
  basinState,
} from './singing-basin';

describe('friction-excited bronze basin', () => {
  it('agrees with independently integrated modal-energy balance', () => {
    const dt = 0.0001;
    for (const strength of [0, 0.2, BASIN_LOSS / 1.05, 1, 1.5]) {
      let energy = BASIN_SEED_ENERGY;
      for (let i = 0; i < 80000; i++)
        energy +=
          dt *
          (2 * (1.05 * strength - BASIN_LOSS) * energy - 2 * 1.05 * strength * energy * energy);
      expect(basinEnergy(8, { ...BASIN_DEFAULT, strength })).toBeCloseTo(energy, 4);
    }
  });
  it('requires net gain and approaches finite amplitude without changing frequency', () => {
    expect(basinState(15, { ...BASIN_DEFAULT, strength: 0.2 }).amplitude).toBeLessThan(0.02);
    const s = basinState(30);
    expect(s.energy).toBeCloseTo((1.05 - BASIN_LOSS) / 1.05, 10);
    expect(s.inputPower).toBeCloseTo(s.lossPower, 9);
    expect(basinState(5, { ...BASIN_DEFAULT, strength: 1.5 }).frequency).toBe(s.frequency);
    expect(basinEnergyAfter(0.2, 10, BASIN_LOSS / 1.05)).toBeCloseTo(
      0.2 / (1 + 2 * BASIN_LOSS * 0.2 * 10),
    );
  });
  it('has continuous release and amplitude decays at the independent loss rate', () => {
    const input = { ...BASIN_DEFAULT, stopAt: 8 };
    expect(basinEnergy(8, input)).toBe(basinEnergy(8));
    expect(basinState(13, input).amplitude / basinState(8, input).amplitude).toBeCloseTo(
      Math.exp(-BASIN_LOSS * 5),
      12,
    );
    expect(basinState(8, input).inputPower).toBe(0);
    expect(basinDroplets(15, input)).toHaveLength(0);
  });
  it('places four or six antinodes separated by the corresponding zero-displacement nodes', () => {
    for (const mode of [2, 3] as const) {
      const points = basinAntinodes(mode);
      expect(points).toHaveLength(mode * 2);
      points.forEach((p, i) => {
        expect(basinModeValue(p.theta, mode)).toBeCloseTo(i % 2 ? -1 : 1, 12);
        expect(basinModeValue(p.theta + Math.PI / (2 * mode), mode)).toBeCloseTo(0, 12);
      });
    }
  });
  it('distinguishes added water mass from friction supply and never sprays a dry basin', () => {
    expect(basinFrequency(2, 0.5)).toBe(100);
    expect(basinFrequency(3, 0.5)).toBe(300);
    expect(basinFrequency(2, 1)).toBeLessThan(basinFrequency(2, 0));
    expect(basinDroplets(0)).toHaveLength(0);
    expect(basinDroplets(10).length).toBeGreaterThan(0);
    expect(basinDroplets(10, { ...BASIN_DEFAULT, fill: 0 })).toHaveLength(0);
    expect(basinState(10, { ...BASIN_DEFAULT, fill: 0 }).spraySites).toBe(0);
    for (const t of [0, 0.001, 2, 8, 30])
      for (const strength of [0, 1.5]) {
        const s = basinState(t, { ...BASIN_DEFAULT, strength });
        expect(Number.isFinite(s.energy)).toBe(true);
        expect(s.energy).toBeGreaterThanOrEqual(0);
        expect(s.energy).toBeLessThan(1);
      }
    expect(() => basinState(-1)).toThrow(RangeError);
  });
});
