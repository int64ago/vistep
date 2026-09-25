import { describe, expect, it } from 'vitest';
import {
  LTE_EQUIVALENT_OVERHEAD,
  LTE_TBS_PEAK,
  MODULATIONS,
  R_MAX,
  allocateCells,
  apertureGainDb,
  arrayFactor,
  arrayGainDb,
  constellation,
  decide,
  elementsOnPanel,
  fsplDb,
  halfPowerBeamwidth,
  lteEquivalentRate,
  materialLossDb,
  modulationForSnr,
  nrPeakRate,
  nrPeakRateAggregate,
  nrResourceBlocks,
  numerology,
  occupiedMHz,
  pathProfile,
  peakSidelobeDb,
  rbGroups,
  receive,
  shannonBits,
  steeringPhases,
  subcarrierCorrelation,
  subcarrierSpectrum,
  symbolErrorRate,
  thresholdSnrDb,
  usableLayers,
  userThroughput,
  waitForSlotMs,
} from './mobile-5g';

describe('TS 38.306 approximate peak rate', () => {
  it('reproduces the 100 MHz, 30 kHz, 4-layer 256QAM FR1 downlink value', () => {
    const r = nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 });
    // 4·8·(948/1024)·(273·12)/(1e-3/28)·0.86 = 2 337.0 Mbit/s
    expect(r / 1e6).toBeCloseTo(2337.0, 0);
  });
  it('uses the exact constants', () => {
    expect(R_MAX).toBe(948 / 1024);
    expect(numerology(30).symbolS).toBeCloseTo(1e-3 / 28, 15);
    expect(numerology(120).slotMs).toBe(0.125);
  });
  it('is linear in layers, Q_m and scaling factor', () => {
    const base = { bandwidthMHz: 100, scsKHz: 30, layers: 2, modulation: 4 as const };
    const r = nrPeakRate(base);
    expect(nrPeakRate({ ...base, layers: 4 })).toBeCloseTo(2 * r, 3);
    expect(nrPeakRate({ ...base, modulation: 8 })).toBeCloseTo(2 * r, 3);
    expect(nrPeakRate({ ...base, scaling: 0.75 })).toBeCloseTo(0.75 * r, 3);
  });
  it('applies FR2 and uplink overheads and sums aggregated carriers', () => {
    const fr2 = nrPeakRate({
      bandwidthMHz: 400,
      scsKHz: 120,
      layers: 2,
      modulation: 6,
      range: 'FR2',
    });
    expect(fr2 / 1e9).toBeCloseTo((2 * 6 * R_MAX * 264 * 12 * 14 * 8 * 1000 * (1 - 0.18)) / 1e9, 6);
    const ul = nrPeakRate({
      bandwidthMHz: 100,
      scsKHz: 30,
      layers: 1,
      modulation: 8,
      direction: 'UL',
    });
    expect(ul / 1e6).toBeCloseTo((8 * R_MAX * 273 * 12 * 28000 * 0.92) / 1e6, 3);
    const c = { bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 as const };
    expect(nrPeakRateAggregate([c, c])).toBeCloseTo(2 * nrPeakRate(c), 0);
  });
  it('reads N_RB from the 38.101 tables and rejects invalid combinations', () => {
    expect(nrResourceBlocks(100, 30)).toBe(273);
    expect(nrResourceBlocks(20, 15)).toBe(106);
    expect(nrResourceBlocks(100, 120, 'FR2')).toBe(66);
    expect(() => nrResourceBlocks(100, 15)).toThrow(RangeError);
    expect(() => nrResourceBlocks(5, 60)).toThrow(RangeError);
    expect(() => nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 0, modulation: 8 })).toThrow(
      RangeError,
    );
    expect(() =>
      nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 2, modulation: 5 as 4 }),
    ).toThrow(RangeError);
  });
  it('keeps occupied bandwidth inside the channel', () => {
    expect(occupiedMHz(273, 30)).toBeCloseTo(98.28, 6);
    expect(occupiedMHz(100, 15)).toBeCloseTo(18, 6);
    for (const bw of [10, 20, 40, 50, 100])
      expect(occupiedMHz(nrResourceBlocks(bw, 30), 30)).toBeLessThan(bw);
  });
});

describe('LTE equivalent', () => {
  it('matches the 150.752 Mbit/s TBS peak by construction', () => {
    expect(lteEquivalentRate({ bandwidthMHz: 20, layers: 2, modulation: 6 })).toBeCloseTo(
      LTE_TBS_PEAK['2x64QAM'],
      0,
    );
    expect(LTE_EQUIVALENT_OVERHEAD).toBeGreaterThan(0.14);
    expect(LTE_EQUIVALENT_OVERHEAD).toBeLessThan(0.25);
  });
  it('stays within 3% of the 4-layer 256QAM TBS peak it was not fitted to', () => {
    const r = lteEquivalentRate({ bandwidthMHz: 20, layers: 4, modulation: 8 });
    expect(Math.abs(r / LTE_TBS_PEAK['4x256QAM'] - 1)).toBeLessThan(0.03);
  });
  it('5G 100 MHz beats one 20 MHz LTE carrier by about 5.8× at identical layers and modulation', () => {
    const lte = lteEquivalentRate({ bandwidthMHz: 20, layers: 4, modulation: 8 });
    const nr = nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 });
    expect(nr / lte).toBeGreaterThan(5.5);
    expect(nr / lte).toBeLessThan(6);
  });
});

describe('OFDM orthogonality', () => {
  it('each subcarrier is zero at every other centre', () => {
    for (let k = -3; k <= 3; k++)
      for (let l = -3; l <= 3; l++)
        expect(Math.abs(subcarrierSpectrum(k, l))).toBeCloseTo(k === l ? 1 : 0, 12);
  });
  it('overlaps between centres', () => {
    expect(subcarrierSpectrum(0, 0.5)).toBeGreaterThan(0.6);
    expect(subcarrierSpectrum(1, 0.5)).toBeGreaterThan(0.6);
  });
  it('correlates only with itself over one symbol, and leaks with a frequency offset', () => {
    expect(subcarrierCorrelation(2, 2)).toBeCloseTo(1, 12);
    expect(subcarrierCorrelation(2, 3)).toBeCloseTo(0, 12);
    expect(subcarrierCorrelation(2, 3, 256, 0.3)).toBeGreaterThan(0.1);
  });
  it('numerology keeps Δf × useful symbol = 1 and 14 symbols per slot', () => {
    for (const scs of [15, 30, 60, 120]) {
      const n = numerology(scs);
      expect((n.usefulSymbolUs * scs) / 1000).toBeCloseTo(1, 12);
      expect(n.symbolS * 14 * 1000).toBeCloseTo(n.slotMs, 12);
      expect(n.cyclicPrefixUs).toBeGreaterThan(0);
    }
    expect(() => numerology(20)).toThrow(RangeError);
  });
});

describe('QAM and noise', () => {
  it('constellations have unit average energy, Gray neighbours and unique labels', () => {
    for (const m of MODULATIONS) {
      const pts = constellation(m);
      expect(pts).toHaveLength(2 ** m);
      expect(pts.reduce((s, p) => s + p.i * p.i + p.q * p.q, 0) / pts.length).toBeCloseTo(1, 12);
      expect(new Set(pts.map((p) => p.bits)).size).toBe(pts.length);
      const side = 2 ** (m / 2);
      for (let a = 0; a < side; a++)
        for (let b = 0; b + 1 < side; b++) {
          const x = pts[a * side + b].bits,
            y = pts[a * side + b + 1].bits;
          expect([...x].filter((c, i) => c !== y[i])).toHaveLength(1);
        }
    }
  });
  it('decides every ideal point as itself', () => {
    for (const m of MODULATIONS)
      constellation(m).forEach((p, i) => expect(decide(m, p.i, p.q)).toBe(i));
  });
  it('is deterministic and uses the same noise draw at every SNR', () => {
    const a = receive(6, 20, 50, 3),
      b = receive(6, 20, 50, 3);
    expect(a).toEqual(b);
    const lo = receive(6, 10, 50, 3);
    expect(lo.map((s) => s.sent)).toEqual(a.map((s) => s.sent));
    const pts = constellation(6);
    const ratio = (lo[4].i - pts[lo[4].sent].i) / (a[4].i - pts[a[4].sent].i);
    expect(ratio).toBeCloseTo(Math.sqrt(10), 6);
  });
  it('measured error rate agrees with the analytic symbol error rate', () => {
    const r = receive(4, 14, 8000, 11);
    const measured = r.filter((s) => s.error).length / r.length;
    const theory = symbolErrorRate(4, 14);
    expect(Math.abs(measured - theory)).toBeLessThan(0.012);
  });
  it('teaching thresholds increase about 6 dB per extra 2 bits and stay below Shannon', () => {
    const th = MODULATIONS.map((m) => thresholdSnrDb(m));
    for (let i = 1; i < th.length; i++) {
      expect(th[i] - th[i - 1]).toBeGreaterThan(5.5);
      expect(th[i] - th[i - 1]).toBeLessThan(7.5);
    }
    MODULATIONS.forEach((m, i) => expect(shannonBits(th[i])).toBeGreaterThan(m));
    expect(modulationForSnr(30)).toBe(8);
    expect(modulationForSnr(16)).toBe(4);
    expect(modulationForSnr(0)).toBeNull();
  });
  it('rejects invalid noise inputs', () => {
    expect(() => receive(4, NaN, 10)).toThrow(RangeError);
    expect(() => receive(4, 10, -1)).toThrow(RangeError);
  });
});

describe('propagation', () => {
  it('28 GHz loses 20·log10(8) ≈ 18.06 dB more than 3.5 GHz between isotropic antennas', () => {
    expect(fsplDb(100, 28e9) - fsplDb(100, 3.5e9)).toBeCloseTo(20 * Math.log10(8), 9);
    expect(fsplDb(200, 3.5e9) - fsplDb(100, 3.5e9)).toBeCloseTo(20 * Math.log10(2), 9);
  });
  it('a fixed aperture at one end cancels the frequency dependence exactly', () => {
    const area = 0.03;
    const at = (f: number) => apertureGainDb(area, f) - fsplDb(150, f);
    expect(at(28e9)).toBeCloseTo(at(3.5e9), 9);
    const side = 4 * (299_792_458 / 3.5e9 / 2);
    expect(elementsOnPanel(side, 28e9).total / elementsOnPanel(side, 3.5e9).total).toBe(64);
  });
  it('uses TR 38.901 material losses', () => {
    expect(materialLossDb('concrete', 3.5)).toBeCloseTo(19, 9);
    expect(materialLossDb('concrete', 28)).toBeCloseTo(117, 9);
    expect(materialLossDb('glass', 28)).toBeCloseTo(7.6, 9);
    expect(materialLossDb('irrGlass', 3.5)).toBeCloseTo(24.05, 9);
    expect(() => materialLossDb('wood', 200)).toThrow(RangeError);
  });
  it('path profile steps down by the wall loss exactly after the wall', () => {
    const free = pathProfile({ frequencyGHz: 28 }),
      walled = pathProfile({ frequencyGHz: 28, material: 'glass' });
    free.distanceM.forEach((d, i) =>
      expect(free.levelDb[i] - walled.levelDb[i]).toBeCloseTo(d > 120 ? 7.6 : 0, 9),
    );
  });
});

describe('arrays', () => {
  it('points the main lobe at the steering angle with unit normalised gain', () => {
    for (const n of [2, 4, 16])
      for (const s of [-40, 0, 30]) expect(arrayFactor(n, s, s)).toBeCloseTo(1, 12);
    expect(arrayFactor(1, 0, 70)).toBeCloseTo(1, 12);
  });
  it('gain is 10·log10(N) and beamwidth shrinks roughly as 1/N', () => {
    expect(arrayGainDb(64)).toBeCloseTo(18.06, 2);
    const b8 = halfPowerBeamwidth(8, 0),
      b16 = halfPowerBeamwidth(16, 0);
    expect(b8).toBeCloseTo(12.8, 0);
    expect(b8 / b16).toBeGreaterThan(1.9);
    expect(b8 / b16).toBeLessThan(2.1);
    expect(halfPowerBeamwidth(16, 30)).toBeGreaterThan(b16);
  });
  it('first sidelobe approaches −13.3 dB', () => {
    expect(peakSidelobeDb(16)).toBeGreaterThan(-13.6);
    expect(peakSidelobeDb(16)).toBeLessThan(-12.8);
  });
  it('steering phases are a progressive ramp of π·sinθ per half-wavelength', () => {
    const p = steeringPhases(4, 30);
    expect(p[1] - p[0]).toBeCloseTo(-Math.PI * 0.5, 12);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 12);
    expect(() => steeringPhases(0, 0)).toThrow(RangeError);
  });
});

describe('layers, slots and sharing', () => {
  it('limits layers by antennas and rank', () => {
    expect(usableLayers(4, 4)).toBe(4);
    expect(usableLayers(64, 4)).toBe(4);
    expect(usableLayers(4, 4, 2)).toBe(2);
  });
  it('waits for the next slot boundary', () => {
    expect(waitForSlotMs(0.3, 15)).toBeCloseTo(0.7, 12);
    expect(waitForSlotMs(0.3, 30)).toBeCloseTo(0.2, 12);
    expect(waitForSlotMs(0.3, 120)).toBeCloseTo(0.075, 12);
    expect(waitForSlotMs(0.5, 30)).toBeCloseTo(0, 12);
  });
  it('allocations cover every RB once and shares sum to one', () => {
    const groups = rbGroups(273, 16);
    expect(groups).toHaveLength(18);
    expect(groups.reduce((s, g) => s + g.size, 0)).toBe(273);
    for (const users of [1, 3, 10, 64]) {
      const a = allocateCells(groups, 14, users);
      expect(a.owner).toHaveLength(18 * 14);
      expect(a.share.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12);
      expect(a.slotShare.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12);
      // rotating the start user every slot makes the long-run share exactly equal
      for (const v of a.share) expect(v).toBeCloseTo(1 / users, 12);
      expect(Math.abs(a.slotShare[0] - 1 / users)).toBeLessThan(0.04);
    }
  });
  it('caps the radio share by the shared backhaul', () => {
    const r = userThroughput({
      peakBitsPerSecond: 2.337e9,
      users: 10,
      modulationRatio: 1,
      backhaulBitsPerSecond: 1e9,
    });
    expect(r.limitedBy).toBe('backhaul');
    expect(r.rate).toBeCloseTo(1e8, 0);
    const edge = userThroughput({
      peakBitsPerSecond: 2.337e9,
      users: 10,
      modulationRatio: 0.25,
      backhaulBitsPerSecond: 1e9,
    });
    expect(edge.limitedBy).toBe('radio');
    expect(edge.rate).toBeCloseTo(2.337e9 * 0.025, 0);
    expect(() =>
      userThroughput({
        peakBitsPerSecond: 1,
        users: 0,
        modulationRatio: 1,
        backhaulBitsPerSecond: 1,
      }),
    ).toThrow(RangeError);
  });
});
