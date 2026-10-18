import { it, expect } from 'vitest';
import {
  oxygenColumn,
  zincAcid,
  protectionState,
  sampleTransfer,
  gelZones,
  warmerModel,
  HEMATITE_HEAT,
} from './chem-corrosion-protection';
it('oxygen manometry obeys ideal gas, hydrostatic pressure and transferred-water conservation', () => {
  const a = oxygenColumn(600);
  expect(a.riseMm).toBeGreaterThan(70);
  expect(a.riseMm).toBeLessThan(90);
  expect(a.pressure * a.volume).toBeCloseTo(a.gasMoles * 8.314462618 * 298.15, 10);
  expect(101325 - a.pressure).toBeCloseTo((1000 * 9.80665 * (a.riseMm + a.fallMm)) / 1000, 8);
  expect((a.area * a.riseMm) / 1000).toBeCloseTo((a.reservoirArea * a.fallMm) / 1000, 12);
  expect(oxygenColumn(600, false).riseMm).toBeCloseTo(0, 10);
  expect(oxygenColumn(600, true, true).riseMm).toBe(0);
});
it('copper addition accelerates the modeled rate only after addition while conserving Zn, Cu and acid', () => {
  const a = zincAcid(100, true),
    b = zincAcid(100, false);
  expect(a.hydrogen).toBe(b.hydrogen);
  expect(a.copper).toBe(0);
  const c = zincAcid(200, true),
    d = zincAcid(200, false);
  expect(c.rate).toBeGreaterThan(d.rate);
  expect(c.hydrogen).toBeGreaterThan(d.hydrogen);
  expect(c.zincRemaining + c.zincUsed).toBeCloseTo(0.5 / 65.38, 12);
  expect(c.copper + c.copperRemaining).toBeCloseTo(c.dose, 12);
  expect(c.acidLeft + 2 * c.hydrogen).toBeCloseTo(0.0025, 12);
});
it('sacrificial protection transfers charge and iron-alone control produces ferrous ions', () => {
  const a = protectionState(600),
    b = protectionState(600, false);
  expect(a.Q).toBeCloseTo(1.2);
  expect(a.zincLost).toBeCloseTo(1.2 / (2 * 96485.33212), 12);
  expect(a.ironLost).toBe(0);
  expect(b.ironLost).toBeGreaterThan(0);
  expect(b.I).toBe(0);
  expect(protectionState(600, true, false).hydrogen).toBe(0);
});
it('sampling conserves the aliquot and clears the beaker rim before sideways travel', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = sampleTransfer(i / 1000);
    expect(a.sourceMl + a.pipetteMl + a.sampleMl).toBeCloseTo(50, 10);
    if (a.x > 0 && a.x < 1) expect(a.tipY).toBeLessThan(130);
    if (a.reagentDrops) expect(a.sampleMl).toBe(1);
  }
  expect(sampleTransfer(1).reagentMl).toBe(0.1);
});
it('indicator assignments distinguish ferrous blue from cathodic hydroxide pink and require contact', () => {
  expect(gelZones('zinc', true).blue).toBe(0);
  expect(gelZones('zinc', false).blue).toBe(1);
  expect(gelZones('copper', true).blue).toBe(1);
  expect(gelZones('copper', true, false).pink).toBe(0);
});
it('NIST reaction heat benchmark, energy and oxygen balances hold for the thermal integration', () => {
  expect((5 / 55.845 / 2) * HEMATITE_HEAT).toBeCloseTo(36955.108, 2);
  const a = warmerModel(3600);
  expect(a.generated).toBeCloseTo(a.stored + a.lost, 7);
  expect(a.consumed + a.oxygen).toBeCloseTo(a.initialOxygen + a.supplied, 10);
  expect(((a.initialIron - a.remaining) / 55.845) * 0.75).toBeCloseTo(a.consumed, 10);
  expect(a.peak).toBeGreaterThan(30);
  expect(a.peak).toBeLessThan(90);
  const ad = warmerModel(3600, { loss: 0 });
  expect(ad.lost).toBeCloseTo(0, 6);
  expect(ad.generated).toBeCloseTo(ad.capacity * (ad.temp - 25), 7);
});
it('no iron or no water gives no reaction; sealed air allows only finite initial oxygen', () => {
  expect(warmerModel(3600, { iron: 0 }).generated).toBe(0);
  expect(warmerModel(3600, { water: 0 }).temp).toBe(25);
  const sealed = warmerModel(7200, { air: 0 });
  expect(sealed.consumed).toBeLessThanOrEqual(sealed.initialOxygen + 1e-12);
  expect(sealed.generated).toBeLessThan(28);
  expect(warmerModel(3600, { salt: false }).generated).toBeLessThan(warmerModel(3600).generated);
});
