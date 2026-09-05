import { describe, it, expect } from 'vitest';
import { escapementEnergy } from '../../models/escapement';
import { ESC_ENERGY_PLOT, escapementEnergyY } from './EscapementEnergyPlot';
describe('escapement energy chart domain', () => {
  it('covers the full allowed drive/length/time domain without clipping or entering the label zone', () => {
    let largest = 0;
    for (let l = 0; l <= 10; l++)
      for (let d = 0; d <= 15; d++)
        for (let i = 0; i <= 520; i++) {
          const e = escapementEnergy(i / 20, d / 10, 0.7 + l * 0.05),
            r = e.energy / e.initial,
            y = escapementEnergyY(r);
          largest = Math.max(largest, r);
          expect(r).toBeLessThanOrEqual(1.5 + 1e-12);
          expect(y).toBeGreaterThan(ESC_ENERGY_PLOT.top);
          expect(y).toBeLessThanOrEqual(ESC_ENERGY_PLOT.bottom + 1e-9);
        }
    expect(largest).toBeGreaterThan(1.3);
  });
  it('keeps the 26s/1.5x regression and high-drive asymptote below the title', () => {
    const s = escapementEnergy(26, 1.5, 1);
    expect(escapementEnergyY(s.energy / s.initial)).toBeGreaterThan(208);
    expect(escapementEnergyY(1.5)).toBeGreaterThan(208);
    // Deliberately no clamp: unexpected model values must not silently become a false plot.
    expect(escapementEnergyY(2)).toBeLessThan(ESC_ENERGY_PLOT.top);
  });
});
