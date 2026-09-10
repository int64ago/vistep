import { describe, expect, it } from 'vitest';
import {
  NFC,
  NFC_DEFAULT,
  NFC_EXAMPLE_BITS,
  NFC_READER_CAPACITANCE_F,
  NFC_TAG_CAPACITANCE_F,
  nfcCoilPoint,
  nfcDecodeReply,
  nfcDownlinkState,
  nfcGeometry,
  nfcInstant,
  nfcLink,
  nfcMillerQuarters,
  nfcMutualInductance,
  nfcReplyState,
  nfcReplyTrace,
  nfcSolve,
  nfcTagPoint,
} from './nfc';

/** Complete elliptic integrals, independently integrated by Simpson's rule. */
function ellipticPair(modulus: number) {
  const n = 4096,
    step = Math.PI / (2 * n);
  let first = 0,
    second = 0;
  for (let i = 0; i <= n; i++) {
    const q = Math.sqrt(1 - modulus ** 2 * Math.sin(i * step) ** 2),
      weight = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    first += weight / q;
    second += weight * q;
  }
  return { K: (first * step) / 3, E: (second * step) / 3 };
}

describe('NFC antenna geometry and mutual inductance', () => {
  it('agrees with the closed elliptic-integral solution for coaxial circular loops', () => {
    const a = NFC.readerRadiusM,
      b = NFC.tagRadiusM;
    for (const gapM of [0.004, 0.008, 0.016, 0.03, 0.06]) {
      const p = { gapM, tiltDeg: 0 },
        z = gapM + NFC.tagHalfThicknessM,
        k = Math.sqrt((4 * a * b) / ((a + b) ** 2 + z ** 2)),
        { K, E } = ellipticPair(k);
      const reference =
        4 *
        Math.PI *
        1e-7 *
        NFC.readerTurns *
        NFC.tagTurns *
        Math.sqrt(a * b) *
        ((2 / k - k) * K - (2 / k) * E);
      expect(Math.abs(nfcMutualInductance(p) / reference - 1)).toBeLessThan(2e-9);
    }
  });

  it('converges under independent quadrature refinement through the control domain', () => {
    for (const gapM of [0.004, 0.008, 0.02, 0.04, 0.06])
      for (const tiltDeg of [0, 20, 45, 65, 80]) {
        const p = { gapM, tiltDeg },
          normal = nfcMutualInductance(p, 64),
          refined = nfcMutualInductance(p, 256);
        expect(Math.abs(normal / refined - 1)).toBeLessThan(2e-9);
        expect(normal).toBeGreaterThan(0);
        // Positive-definite magnetic energy: L1*L2 − M² > 0.
        expect(normal ** 2).toBeLessThan(NFC.readerInductanceH * NFC.tagInductanceH);
      }
  });

  it('keeps every point of the finite-thickness tag above the reader plane', () => {
    for (const gapM of [0.004, 0.008, 0.06])
      for (const tiltDeg of [0, 20, 45, 80]) {
        const p = { gapM, tiltDeg };
        let minimum = Infinity;
        for (const height of [-NFC.tagHalfThicknessM, NFC.tagHalfThicknessM])
          for (let i = 0; i < 256; i++) {
            const angle = (i * 2 * Math.PI) / 256;
            const point = nfcTagPoint(
              [NFC.tagHalfWidthM * Math.cos(angle), height, NFC.tagHalfWidthM * Math.sin(angle)],
              p,
            );
            minimum = Math.min(minimum, point[1]);
          }
        expect(minimum).toBeCloseTo(gapM, 15);
        expect(nfcGeometry(p).minimumClearanceM).toBe(gapM);
        expect(nfcCoilPoint('tag', 0, p)).toEqual(nfcTagPoint([NFC.tagRadiusM, 0, 0], p));
        expect(nfcCoilPoint('reader', 0, p)).toEqual([NFC.readerRadiusM, 0, 0]);
      }
  });

  it('does not replace finite-coil geometry with an arbitrary distance falloff or cosine', () => {
    const near = nfcMutualInductance({ gapM: 0.008, tiltDeg: 0 }),
      far = nfcMutualInductance({ gapM: 0.06, tiltDeg: 0 }),
      tilted = nfcMutualInductance({ gapM: 0.008, tiltDeg: 60 });
    expect(near / far).toBeGreaterThan(15);
    expect(tilted / near).toBeLessThan(0.25);
    // Tilting also raises the centre to preserve body clearance.
    expect(tilted / near).not.toBeCloseTo(Math.cos(Math.PI / 3), 1);
  });
});

describe('passive resonant NFC network', () => {
  it('balances cycle-averaged source power against every physical dissipative branch', () => {
    for (const gapM of [0.004, 0.008, 0.02, 0.04, 0.06])
      for (const tiltDeg of [0, 20, 50, 80])
        for (const loadOn of [false, true]) {
          const state = nfcSolve({ gapM, tiltDeg }, loadOn);
          let source = 0,
            readerHeat = 0,
            tagHeat = 0,
            chip = 0,
            switched = 0;
          const n = 512;
          for (let i = 0; i < n; i++) {
            const phase = (i * 2 * Math.PI) / n,
              vSource = Math.SQRT2 * state.sourceRmsV * Math.cos(phase),
              iReader = nfcInstant(state.readerCurrent, phase),
              iTag = nfcInstant(state.tagCurrent, phase),
              vTag = nfcInstant(state.tagVoltage, phase);
            source += (vSource * iReader) / n;
            readerHeat += (iReader ** 2 * NFC.readerResistanceOhm) / n;
            tagHeat += (iTag ** 2 * NFC.tagResistanceOhm) / n;
            chip += vTag ** 2 / NFC.chipResistanceOhm / n;
            switched += loadOn ? vTag ** 2 / NFC.switchedResistanceOhm / n : 0;
          }
          expect(source).toBeCloseTo(readerHeat + tagHeat + chip + switched, 13);
          expect(source).toBeCloseTo(state.inputPowerW, 14);
          expect(chip).toBeCloseTo(state.chipRfPowerW, 14);
          expect(state.powerResidualW).toBeCloseTo(0, 14);
          expect(state.reflectedImpedance.re).toBeGreaterThan(0);
          expect(state.dcPowerW + state.rectifierLossW).toBeCloseTo(chip, 14);
          expect(state.dcPowerW).toBeLessThan(source);
        }
  });

  it('tunes both uncoupled antennas at the same carrier but exposes loading and matching', () => {
    const w = 2 * Math.PI * NFC.carrierHz;
    expect(
      1 / (2 * Math.PI * Math.sqrt(NFC.readerInductanceH * NFC_READER_CAPACITANCE_F)),
    ).toBeCloseTo(NFC.carrierHz, 7);
    expect(1 / (2 * Math.PI * Math.sqrt(NFC.tagInductanceH * NFC_TAG_CAPACITANCE_F))).toBeCloseTo(
      NFC.carrierHz,
      7,
    );
    const link = nfcLink(NFC_DEFAULT);
    expect(link.loaded.readerCurrentRmsA).toBeGreaterThan(link.unloaded.readerCurrentRmsA);
    expect(link.loaded.dcPowerW).toBeLessThan(link.unloaded.dcPowerW);
    expect(link.loaded.switchPowerW).toBeGreaterThan(0);
    expect(link.unloaded.switchPowerW).toBe(0);
    expect(link.readable).toBe(true);
    const s = link.loaded;
    // Check the secondary KVL directly in Cartesian phasors, including −dΦ/dt.
    expect(
      s.secondaryImpedance.re * s.tagCurrent.re - s.secondaryImpedance.im * s.tagCurrent.im,
    ).toBeCloseTo(w * s.mutualH * s.readerCurrent.im, 13);
    expect(
      s.secondaryImpedance.re * s.tagCurrent.im + s.secondaryImpedance.im * s.tagCurrent.re,
    ).toBeCloseTo(-w * s.mutualH * s.readerCurrent.re, 13);
    // A fixed voltage source need not harvest more power at the closest separation.
    expect(nfcSolve({ gapM: 0.012, tiltDeg: 0 }).dcPowerW).toBeGreaterThan(
      nfcSolve({ gapM: 0.004, tiltDeg: 0 }).dcPowerW,
    );
  });

  it('requires both usable power and a detectable return, and cannot reply with no field', () => {
    const near = nfcLink(NFC_DEFAULT),
      far = nfcLink({ gapM: 0.06, tiltDeg: 0 }),
      edge = nfcLink({ gapM: 0.008, tiltDeg: 80 }),
      off = nfcLink(NFC_DEFAULT, 0);
    expect(near.powered && near.detectable).toBe(true);
    expect(far.powered).toBe(false);
    expect(edge.powered).toBe(false);
    expect(far.readable || edge.readable || off.readable).toBe(false);
    for (const s of [off.loaded, off.unloaded]) {
      expect(s.inputPowerW).toBe(0);
      expect(s.dcPowerW).toBe(0);
      expect(s.readerCurrentRmsA).toBe(0);
      expect(s.tagVoltageRmsV).toBe(0);
    }
    for (const link of [far, edge, off]) {
      const trace = nfcReplyTrace(link);
      expect(trace.every((s) => !s.loadOn)).toBe(true);
      expect(nfcDecodeReply(trace.map((s) => s.readerCurrentRmsA))).toEqual(Array(8).fill(null));
    }
    const quarter = nfcSolve(NFC_DEFAULT, false, 0.25);
    expect(quarter.dcPowerW).toBeCloseTo(near.unloaded.dcPowerW / 16, 15);
  });
});

describe('NFC-A 106k data symbols, excluding framing', () => {
  it('uses the actual fc/128 bit timing and fc/16 load subcarrier', () => {
    expect(NFC.bitRate).toBe(105937.5);
    expect(NFC.subcarrierHz).toBe(847500);
    expect(NFC.subcarrierHz / NFC.bitRate).toBe(8);
    const getHalfCycles = (bit: string) =>
      Array.from({ length: 16 }, (_, i) =>
        Number(nfcReplyState((i + 0.5) / (16 * NFC.bitRate), bit).loadOn),
      ).join('');
    // Sequence D = 1, E = 0, using NFC-A's convention (not a generic Manchester polarity).
    expect(getHalfCycles('1')).toBe('1010101000000000');
    expect(getHalfCycles('0')).toBe('0000000010101010');
    expect(nfcReplyState(-1).bitIndex).toBe(-1);
    expect(nfcReplyState(8 / NFC.bitRate).loadOn).toBe(false);
  });

  it('uses modified Miller field holes instead of treating raw zero bits as field-off', () => {
    const quarters = nfcMillerQuarters('01001');
    expect(quarters).toEqual([
      [0, 1, 1, 1],
      [1, 1, 0, 1],
      [1, 1, 1, 1],
      [0, 1, 1, 1],
      [1, 1, 0, 1],
    ]);
    const read = Array.from(
      { length: 20 },
      (_, i) => nfcDownlinkState((i + 0.5) / (4 * NFC.bitRate), '01001').carrierEnvelope,
    );
    expect(read).toEqual(quarters.flat());
    expect(nfcDownlinkState(-0.1).carrierEnvelope).toBe(1);
    expect(nfcDownlinkState(1).carrierEnvelope).toBe(1);
  });

  it('independently recovers all 256 data patterns from the computed reader-current envelope', () => {
    const link = nfcLink(NFC_DEFAULT);
    for (let value = 0; value < 256; value++) {
      const bits = value.toString(2).padStart(8, '0'),
        trace = nfcReplyTrace(link, 64, bits),
        observed = trace.map((p, i) => p.readerCurrentRmsA + 0.00001 * Math.sin(i * 1.71));
      expect(nfcDecodeReply(observed, 64).join('')).toBe(bits);
    }
    expect(nfcDecodeReply(Array(128).fill(0.1))).toEqual([null]);
    // Modulation in BOTH halves is an ambiguous/collision-like symbol, not a 0 or 1.
    const ambiguous = Array.from({ length: 128 }, (_, i) => 0.02 + (i % 16 < 8 ? 0.003 : 0));
    expect(nfcDecodeReply(ambiguous)).toEqual([null]);
  });

  it('reconstructs the same visible samples under replay and reverse-time inspection', () => {
    const link = nfcLink(NFC_DEFAULT),
      trace = nfcReplyTrace(link);
    expect(nfcReplyTrace(link)).toEqual(trace);
    for (let i = trace.length - 1; i >= 0; i -= 13) {
      const symbol = nfcReplyState(trace[i].timeS);
      expect(symbol.bitIndex).toBe(trace[i].bitIndex);
      expect(symbol.loadOn).toBe(trace[i].loadOn);
    }
    expect(trace.slice(0, 128)).toEqual(nfcReplyTrace(link, 128, NFC_EXAMPLE_BITS[0]));
  });

  it('rejects invalid geometry, electrical inputs and signal samples without returning NaN', () => {
    for (const gapM of [NaN, Infinity, -1, 0.003, 0.061])
      expect(() => nfcSolve({ gapM, tiltDeg: 0 })).toThrow(RangeError);
    for (const tiltDeg of [NaN, Infinity, -1, 81])
      expect(() => nfcSolve({ gapM: 0.008, tiltDeg })).toThrow(RangeError);
    for (const envelope of [NaN, Infinity, -0.1, 1.1])
      expect(() => nfcSolve(NFC_DEFAULT, false, envelope)).toThrow(RangeError);
    expect(() => nfcMutualInductance(NFC_DEFAULT, 513)).toThrow(RangeError);
    expect(() => nfcReplyState(NaN)).toThrow(RangeError);
    expect(() => nfcReplyState(0, '102')).toThrow(RangeError);
    expect(() => nfcReplyTrace(nfcLink(NFC_DEFAULT), 17)).toThrow(RangeError);
    expect(() => nfcDecodeReply([NaN])).toThrow(RangeError);
    expect(() => nfcDecodeReply(Array(128).fill(Infinity))).toThrow(RangeError);
  });
});
