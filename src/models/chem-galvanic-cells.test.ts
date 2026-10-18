import { it, expect } from 'vitest';
import {
  FARADAY,
  acidCell,
  simpleCell,
  daniell,
  saltBridge,
  bridgeIon,
  fuelCycle,
  alongWire,
} from './chem-galvanic-cells';
it('separates local acid attack from external current and cathode material', () => {
  expect(acidCell('Zn', 'Cu', false, true, 60).current).toBe(0);
  expect(acidCell('Zn', 'Cu', false, true, 60).localHydrogen).toBe(1);
  expect(acidCell('Zn', 'C', true, true, 60).current).toBeGreaterThan(0);
  expect(acidCell('Cu', 'C', true, true, 60).current).toBe(0);
  expect(acidCell('Zn', 'Cu', true, false, 60).current).toBe(0);
});
it('series EMF and internal resistance both add; identical/absent active electrodes do not power the load', () => {
  const a = simpleCell(1, 'fruit', true, true, 1000),
    b = simpleCell(3, 'fruit', true, true, 1000);
  expect(b.emf).toBeCloseTo(3 * a.emf);
  expect(b.internal).toBe(3 * a.internal);
  expect(b.current).toBeLessThan(3 * a.current);
  expect(a.ledCurrent).toBe(0);
  expect(b.ledCurrent).toBeGreaterThan(0);
  expect(simpleCell(3, 'fruit', true, false, 1000).current).toBe(0);
  expect(simpleCell(2, 'paper', false, true, 1000).current).toBe(0);
});
it('Daniell benchmark is1.10V at equal ideal activities and conserves charge and metal', () => {
  expect(daniell(0, true, true, 1, 1).emf).toBeCloseTo(1.1);
  const a = daniell(1000, true, true, 1, 1);
  expect(a.zn + a.cu).toBeCloseTo(2);
  expect(a.zincLoss / 65.38).toBeCloseTo(a.copperGain / 63.546);
  expect(a.clMoles).toBeCloseTo(2 * a.extent);
  expect(a.kMoles).toBeCloseTo(2 * a.extent);
  expect(a.q).toBeCloseTo(2 * FARADAY * a.extent);
  expect(daniell(100, true, false, 1, 1).current).toBe(0);
  expect(daniell(100, true, false, 1, 1).emf).toBeGreaterThan(0);
});
it('salt bridge conductivity requires actual liquid contact, ions follow its arms', () => {
  for (const w of [240, 320, 800]) {
    const a = saltBridge(w, 0),
      b = saltBridge(w, 1);
    expect(a.conducting).toBe(true);
    expect(b.conducting).toBe(false);
    for (const direction of ['left', 'right'] as const)
      for (let i = 0; i <= 100; i++) {
        const p = bridgeIon(w, i / 100, direction);
        expect(p.x).toBeGreaterThanOrEqual(a.armLeft);
        expect(p.x).toBeLessThanOrEqual(a.armRight);
        expect(p.y).toBeGreaterThanOrEqual(92);
        expect(p.y).toBeLessThanOrEqual(190);
      }
  }
});
it('electrolysis and finite gas discharge preserve2:1 ratio, electron equivalents and mutually exclusive switches', () => {
  for (let i = 0; i <= 1000; i++) {
    const f = fuelCycle(60, i / 10, 'discharge');
    expect(f.hydrogen).toBeCloseTo(2 * f.oxygen, 12);
    expect(f.qLeft + f.released).toBeCloseTo(f.storedQ, 12);
    expect(f.waterProduced).toBeCloseTo(f.released / (2 * FARADAY), 12);
    expect(f.K1 && f.K2).toBe(false);
    expect(f.ohRemaining).toBeGreaterThan(0);
  }
  expect(fuelCycle(0, 10, 'discharge').current).toBe(0);
  expect(fuelCycle(60, 0, 'isolated').current).toBe(0);
  expect(fuelCycle(60, 40, 'discharge').current).toBeLessThan(
    fuelCycle(60, 0, 'discharge').current,
  );
});
it('wire markers stay on the connected geometric route', () => {
  const p = [
    { x: 10, y: 20 },
    { x: 10, y: 0 },
    { x: 40, y: 0 },
    { x: 40, y: 20 },
  ];
  expect(alongWire(p, 0)).toEqual(p[0]);
  expect(alongWire(p, 1)).toEqual(p[3]);
  for (let i = 0; i <= 100; i++) {
    const a = alongWire(p, i / 100);
    expect(a.x === 10 || a.x === 40 || a.y === 0).toBe(true);
  }
});
