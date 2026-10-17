import { describe, it, expect } from 'vitest';
import { rollingPixel, rowWindow, rollingPosition, ROLLING_DEFAULT } from './rolling-shutter';
describe('row-integrated rolling shutter', () => {
  it('global windows coincide, rolling start times span readout', () => {
    expect(rowWindow(1, ROLLING_DEFAULT).start - rowWindow(0, ROLLING_DEFAULT).start).toBe(
      ROLLING_DEFAULT.readout,
    );
    expect(rowWindow(0, ROLLING_DEFAULT, true)).toEqual(rowWindow(1, ROLLING_DEFAULT, true));
  });
  it('short exposure reduces blur without eliminating row skew', () => {
    const s = { ...ROLLING_DEFAULT, exposure: 0.0001 },
      a = rowWindow(0, s),
      b = rowWindow(1, s);
    expect(rollingPosition(b.mid, s) - rollingPosition(a.mid, s)).toBeCloseTo(
      s.velocity * s.readout,
      12,
    );
    expect(rollingPixel(rollingPosition(a.mid, s), 0, s).occupancy).toBeCloseTo(1);
  });
  it('exact integral matches numerical exposure and flash lights only overlapping rows', () => {
    let sum = 0;
    const s = ROLLING_DEFAULT,
      x = 0.48,
      r = 0.25,
      win = rowWindow(r, s);
    for (let i = 0; i < 10000; i++)
      sum +=
        Math.abs(x - rollingPosition(win.start + ((i + 0.5) / 10000) * s.exposure, s)) <= 0.038
          ? 1 / 10000
          : 0;
    expect(rollingPixel(x, r, s).occupancy).toBeCloseTo(sum, 3);
    const flash = { ...s, flash: true };
    expect(rollingPixel(0.5, 0, flash).light).toBe(0);
    expect(rollingPixel(0.5, 0.5, flash).light).toBeGreaterThan(0);
    expect(() => rowWindow(-1, s)).toThrow();
  });
  it('integrates illumination jointly with the moving bar for both directions', () => {
    for (const velocity of [-12, 0, 12]) {
      const s = { ...ROLLING_DEFAULT, exposure: 0.012, flash: true, velocity };
      for (const row of [0.25, 0.5, 0.75])
        for (const x of [0.43, 0.5, 0.57]) {
          const win = rowWindow(row, s),
            steps = 20000;
          let integrated = 0;
          for (let i = 0; i < steps; i++) {
            const time = win.start + ((i + 0.5) / steps) * s.exposure;
            const illuminated = time >= s.readout * 0.52 && time < s.readout * 0.52 + 0.0015;
            if (illuminated && Math.abs(x - rollingPosition(time, s)) <= 0.038)
              integrated += 1 / steps;
          }
          expect(rollingPixel(x, row, s).litOccupancy).toBeCloseTo(integrated, 3);
        }
    }
    const s = { ...ROLLING_DEFAULT, exposure: 0.012, flash: true };
    const pixel = rollingPixel(0.57, 0.5, s);
    expect(pixel.occupancy).toBeGreaterThan(0.25);
    expect(pixel.light).toBeGreaterThan(0.1);
    expect(pixel.litOccupancy).toBe(0);
  });
});
