import { describe, it, expect } from 'vitest';
import {
  wireState,
  seriesWireComparison,
  wireMeasurement,
  fitWireSamples,
  heatedFilament,
  inferResistivity,
} from './resistivity-lab';
describe('resistivity experiments', () => {
  it('matches independent copper 1m / 1mm² resistance', () => {
    expect(wireState(1, 2 / Math.sqrt(Math.PI), 'copper').resistance).toBeCloseTo(0.017, 13);
  });
  it('uses equal current to turn resistance ratios into voltage ratios', () => {
    const { wires: w } = seriesWireComparison();
    expect(w[1].voltage / w[0].voltage).toBeCloseTo(2, 12);
    expect(w[2].voltage / w[0].voltage).toBeCloseTo(0.5, 12);
    expect(w[3].voltage / w[0].voltage).toBeCloseTo(2, 12);
  });
  it('accounts for voltmeter current and ammeter voltage in different topologies', () => {
    const w = wireState(),
      outer = wireMeasurement(w),
      inner = wireMeasurement(w, 3, 10, 'internal');
    expect(outer.apparentResistance).toBeCloseTo((w.resistance * 1000) / (w.resistance + 1000), 12);
    expect(inner.apparentResistance).toBeCloseTo(w.resistance + 0.2, 12);
    expect(outer.ammeterCurrent).toBeCloseTo(outer.wireCurrent + outer.voltmeterCurrent, 14);
    expect(inner.totalCurrent).toBeCloseTo(inner.ammeterCurrent + inner.voltmeterCurrent, 14);
  });
  it('recovers rho from ideal-meter samples and exposes finite-meter bias', () => {
    const w = wireState();
    expect(fitWireSamples(w, 'internal', 0, 1e12).rho).toBeCloseTo(w.rho, 18);
    expect(fitWireSamples(w).rho).toBeLessThan(w.rho);
    expect(fitWireSamples(w, 'internal').rho).toBeGreaterThan(w.rho);
  });
  it('exposes the squared diameter error in the inferred resistivity', () => {
    expect(inferResistivity(10, 0.5, 0.22) / inferResistivity(10, 0.5, 0.2)).toBeCloseTo(1.21, 12);
  });
  it('dims the series indicator when the separate filament is heated', () => {
    const cold = heatedFilament(20),
      hot = heatedFilament(300);
    expect(hot.filamentResistance).toBeGreaterThan(cold.filamentResistance);
    expect(hot.current).toBeLessThan(cold.current);
    expect(hot.relativeLampPower).toBeLessThan(1);
  });
});
