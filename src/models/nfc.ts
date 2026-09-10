/**
 * A passive NFC-A link at fc/128 (usually called 106 kbit/s).
 * Source basis: ST TN1216 §§3.4–3.5, NXP PN7150 Rev.4.2 §12.7.1.1/Table16 and MFRC531 §9.11.
 * The two resonant circuits are linear, sinusoidal steady-state equivalents;
 * the chip is an RF resistance plus an explicitly assumed rectifier efficiency.
 * This is not a chip, RF compliance, storage-capacitor or payment simulation.
 */
export const NFC = {
  carrierHz: 13.56e6,
  bitRate: 13.56e6 / 128,
  subcarrierHz: 13.56e6 / 16,
  readerRadiusM: 0.024,
  tagRadiusM: 0.016,
  readerTurns: 3,
  tagTurns: 4,
  tagHalfWidthM: 0.022,
  tagHalfThicknessM: 0.0005,
  readerInductanceH: 1.4e-6,
  tagInductanceH: 1.7e-6,
  sourceRmsV: 1,
  readerResistanceOhm: 15,
  tagResistanceOhm: 2,
  chipResistanceOhm: 2000,
  switchedResistanceOhm: 2500,
  rectifierEfficiency: 0.45,
  // Teaching thresholds, NOT an NFC standard or an IC specification.
  logicPowerW: 0.0006,
  receiverCurrentThresholdA: 0.00015,
} as const;

export type NfcPose = { gapM: number; tiltDeg: number };
export type NfcPoint = [number, number, number];
export type NfcComplex = { re: number; im: number };
export const NFC_DEFAULT: NfcPose = { gapM: 0.008, tiltDeg: 0 };
/** Left to right is transmission order; this is not a framed NFC command/byte. */
export const NFC_EXAMPLE_BITS = '10110010';

const tau = 2 * Math.PI;
const omega = tau * NFC.carrierHz;
export const NFC_READER_CAPACITANCE_F = 1 / (omega ** 2 * NFC.readerInductanceH);
export const NFC_TAG_CAPACITANCE_F = 1 / (omega ** 2 * NFC.tagInductanceH);

function finite(value: number, name: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}
function validatePose(p: NfcPose) {
  finite(p.gapM, 'gapM');
  finite(p.tiltDeg, 'tiltDeg');
  if (p.gapM < 0.004 || p.gapM > 0.06 || p.tiltDeg < 0 || p.tiltDeg > 80)
    throw new RangeError('NFC pose must stay within 4–60 mm clearance and 0–80 degrees');
}
function validateBits(bits: string) {
  if (!/^[01]{1,256}$/.test(bits)) throw new RangeError('Expected 1–256 binary symbols');
}

/**
 * Reader antenna lies in y=0; tag rotates about z. gapM is the minimum
 * clearance of a 44 mm diameter, 1 mm thick tag body above that plane,
 * not the distance between antenna centres. Raising the centre on tilt keeps
 * the material from passing through the reader. The equivalent antenna is
 * on the tag body's middle plane; copper-layer offsets are neglected.
 */
export function nfcGeometry(p: NfcPose) {
  validatePose(p);
  const tiltRad = (p.tiltDeg * Math.PI) / 180;
  const tagCenterM: NfcPoint = [
    0,
    p.gapM + NFC.tagHalfWidthM * Math.sin(tiltRad) + NFC.tagHalfThicknessM * Math.cos(tiltRad),
    0,
  ];
  return { tagCenterM, tiltRad, minimumClearanceM: p.gapM };
}

export function nfcTagPoint(localPoint: NfcPoint, p: NfcPose): NfcPoint {
  localPoint.forEach((v) => finite(v, 'localPoint'));
  const { tagCenterM, tiltRad } = nfcGeometry(p);
  const [x, y, z] = localPoint;
  return [
    x * Math.cos(tiltRad) - y * Math.sin(tiltRad),
    tagCenterM[1] + x * Math.sin(tiltRad) + y * Math.cos(tiltRad),
    z,
  ];
}

/** Equivalent mean-radius loop. Multiply mutual inductance by Nreader·Ntag. */
export function nfcCoilPoint(which: 'reader' | 'tag', angleRad: number, p: NfcPose): NfcPoint {
  finite(angleRad, 'angleRad');
  validatePose(p);
  const radius = which === 'reader' ? NFC.readerRadiusM : NFC.tagRadiusM;
  const point: NfcPoint = [radius * Math.cos(angleRad), 0, radius * Math.sin(angleRad)];
  return which === 'reader' ? point : nfcTagPoint(point, p);
}

/**
 * Neumann M = μ0 N1 N2/(4π) ∮∮ (dr1·dr2)/|r1−r2|.
 * Midpoint quadrature uses analytic circle tangents, not straight-chord lengths.
 * Equal-radius multi-turn equivalents neglect spiral pitch, lead fields,
 * finite conductor thickness, ferrite, nearby metal and electric coupling.
 * segments is exposed for independent convergence checks; 64 is sufficient
 * for the bounded, nonintersecting geometry offered by the scene.
 */
export function nfcMutualInductance(p: NfcPose, segments = 64): number {
  const { tagCenterM, tiltRad } = nfcGeometry(p);
  if (!Number.isInteger(segments) || segments < 8 || segments > 512)
    throw new RangeError('Neumann quadrature requires 8–512 segments');
  const step = tau / segments,
    c = Math.cos(tiltRad),
    s = Math.sin(tiltRad),
    r1 = NFC.readerRadiusM,
    r2 = NFC.tagRadiusM;
  const nodes = Array.from({ length: segments }, (_, i) => {
    const a = (i + 0.5) * step;
    return { c: Math.cos(a), s: Math.sin(a) };
  });
  let sum = 0;
  for (const a of nodes)
    for (const b of nodes) {
      const dx = r1 * a.c - r2 * b.c * c,
        dy = -tagCenterM[1] - r2 * b.c * s,
        dz = r1 * a.s - r2 * b.s;
      const tangentDot = r1 * r2 * (a.s * b.s * c + a.c * b.c);
      sum += tangentDot / Math.hypot(dx, dy, dz);
    }
  return 1e-7 * NFC.readerTurns * NFC.tagTurns * step ** 2 * sum;
}

const add = (a: NfcComplex, b: NfcComplex): NfcComplex => ({ re: a.re + b.re, im: a.im + b.im });
const multiply = (a: NfcComplex, b: NfcComplex): NfcComplex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const divide = (a: NfcComplex, b: NfcComplex): NfcComplex => {
  const d = b.re ** 2 + b.im ** 2;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const nfcMagnitude = (a: NfcComplex) => Math.hypot(a.re, a.im);
/** RMS phasors require √2 when turned into an instantaneous sine wave. */
export function nfcInstant(a: NfcComplex, phaseRad: number) {
  finite(phaseRad, 'phaseRad');
  return Math.SQRT2 * (a.re * Math.cos(phaseRad) - a.im * Math.sin(phaseRad));
}

function solveAtMutual(mutualH: number, loadOn: boolean, carrierEnvelope: number) {
  finite(carrierEnvelope, 'carrierEnvelope');
  if (carrierEnvelope < 0 || carrierEnvelope > 1)
    throw new RangeError('Carrier envelope must be in [0, 1]');
  const secondaryAdmittance = {
    re: 1 / NFC.chipResistanceOhm + (loadOn ? 1 / NFC.switchedResistanceOhm : 0),
    im: omega * NFC_TAG_CAPACITANCE_F,
  };
  const terminalImpedance = divide({ re: 1, im: 0 }, secondaryAdmittance);
  const secondaryImpedance = add(
    { re: NFC.tagResistanceOhm, im: omega * NFC.tagInductanceH },
    terminalImpedance,
  );
  const reflectedImpedance = divide({ re: (omega * mutualH) ** 2, im: 0 }, secondaryImpedance);
  const primaryImpedance = {
    re: NFC.readerResistanceOhm,
    im: omega * NFC.readerInductanceH - 1 / (omega * NFC_READER_CAPACITANCE_F),
  };
  const inputImpedance = add(primaryImpedance, reflectedImpedance);
  const sourceRmsV = NFC.sourceRmsV * carrierEnvelope;
  const readerCurrent = divide({ re: sourceRmsV, im: 0 }, inputImpedance);
  const tagCurrent = divide(
    multiply({ re: 0, im: -omega * mutualH }, readerCurrent),
    secondaryImpedance,
  );
  const tagVoltage = multiply(tagCurrent, terminalImpedance);
  const readerCurrentRmsA = nfcMagnitude(readerCurrent),
    tagCurrentRmsA = nfcMagnitude(tagCurrent),
    tagVoltageRmsV = nfcMagnitude(tagVoltage);
  const inputPowerW = sourceRmsV * readerCurrent.re;
  const readerLossW = readerCurrentRmsA ** 2 * NFC.readerResistanceOhm;
  const tagCoilLossW = tagCurrentRmsA ** 2 * NFC.tagResistanceOhm;
  const chipRfPowerW = tagVoltageRmsV ** 2 / NFC.chipResistanceOhm;
  const switchPowerW = loadOn ? tagVoltageRmsV ** 2 / NFC.switchedResistanceOhm : 0;
  const dcPowerW = chipRfPowerW * NFC.rectifierEfficiency;
  return {
    mutualH,
    coupling: mutualH / Math.sqrt(NFC.readerInductanceH * NFC.tagInductanceH),
    loadOn,
    carrierEnvelope,
    sourceRmsV,
    primaryImpedance,
    secondaryImpedance,
    terminalImpedance,
    reflectedImpedance,
    inputImpedance,
    readerCurrent,
    tagCurrent,
    tagVoltage,
    readerCurrentRmsA,
    tagCurrentRmsA,
    tagVoltageRmsV,
    inputPowerW,
    readerLossW,
    tagCoilLossW,
    chipRfPowerW,
    switchPowerW,
    dcPowerW,
    rectifierLossW: chipRfPowerW - dcPowerW,
    powerResidualW: inputPowerW - readerLossW - tagCoilLossW - chipRfPowerW - switchPowerW,
    // A steady-state power test, not storage/POR dynamics across ASK field gaps.
    powered: dcPowerW >= NFC.logicPowerW,
  };
}

/** Steady-state electrical solution with an externally requested load switch. */
export function nfcSolve(p: NfcPose, loadOn = false, carrierEnvelope = 1) {
  return solveAtMutual(nfcMutualInductance(p), loadOn, carrierEnvelope);
}
export type NfcSolution = ReturnType<typeof nfcSolve>;

/** Solve the geometry once for both switch states; reuse these in waveform plots. */
export function nfcLink(p: NfcPose, carrierEnvelope = 1) {
  const mutualH = nfcMutualInductance(p);
  const unloaded = solveAtMutual(mutualH, false, carrierEnvelope),
    loaded = solveAtMutual(mutualH, true, carrierEnvelope);
  const currentDifferenceA = loaded.readerCurrentRmsA - unloaded.readerCurrentRmsA;
  const signalAmplitudeA = Math.abs(currentDifferenceA);
  const powered = unloaded.powered && loaded.powered;
  const detectable = signalAmplitudeA >= NFC.receiverCurrentThresholdA;
  return {
    unloaded,
    loaded,
    currentDifferenceA,
    signalAmplitudeA,
    powered,
    detectable,
    readable: powered && detectable,
  };
}
export type NfcLink = ReturnType<typeof nfcLink>;

/** NFC-A 106k modified Miller: ideal quarter-bit holes, no framing/edge shaping. */
export function nfcMillerQuarters(bits = NFC_EXAMPLE_BITS, previousBit: 0 | 1 = 0) {
  validateBits(bits);
  if (previousBit !== 0 && previousBit !== 1) throw new RangeError('Invalid previous bit');
  return [...bits].map((bit, index) => {
    const preceding = index ? Number(bits[index - 1]) : previousBit;
    if (bit === '1') return [1, 1, 0, 1] as const;
    return preceding === 0 ? ([0, 1, 1, 1] as const) : ([1, 1, 1, 1] as const);
  });
}

export function nfcDownlinkState(timeS: number, bits = NFC_EXAMPLE_BITS) {
  finite(timeS, 'timeS');
  const symbols = nfcMillerQuarters(bits);
  const position = timeS * NFC.bitRate;
  if (position < 0 || position >= bits.length)
    return { bitIndex: -1, bit: null, bitPhase: 0, carrierEnvelope: 1 };
  const bitIndex = Math.floor(position),
    bitPhase = position - bitIndex;
  return {
    bitIndex,
    bit: Number(bits[bitIndex]) as 0 | 1,
    bitPhase,
    carrierEnvelope: symbols[bitIndex][Math.floor(bitPhase * 4)],
  };
}

/**
 * NFC-A 106k reply: 1 gates four subcarrier cycles in the first half-bit;
 * 0 gates four in the second. Carrier remains supplied by the reader.
 * The square load switch runs at fc/16, not at the information bit rate.
 * Time is seconds since this example's first data bit, excluding framing.
 */
export function nfcReplyState(timeS: number, bits = NFC_EXAMPLE_BITS) {
  finite(timeS, 'timeS');
  validateBits(bits);
  const position = timeS * NFC.bitRate;
  if (position < 0 || position >= bits.length)
    return { bitIndex: -1, bit: null, bitPhase: 0, subcarrierOn: false, loadOn: false };
  const bitIndex = Math.floor(position),
    bitPhase = position - bitIndex,
    bit = Number(bits[bitIndex]) as 0 | 1;
  const subcarrierOn = bit === 1 ? bitPhase < 0.5 : bitPhase >= 0.5;
  return {
    bitIndex,
    bit,
    bitPhase,
    subcarrierOn,
    loadOn: subcarrierOn && (bitPhase * 8) % 1 < 0.5,
  };
}

/**
 * Midpoint samples of the reader's RMS envelope. Both electrical levels come
 * from one circuit, with no per-state renormalization. This is a quasi-static
 * envelope, not the resonator's transient/sideband impulse response.
 */
export function nfcReplyTrace(link: NfcLink, samplesPerBit = 128, bits = NFC_EXAMPLE_BITS) {
  validateBits(bits);
  if (
    !Number.isInteger(samplesPerBit) ||
    samplesPerBit < 32 ||
    samplesPerBit > 1024 ||
    samplesPerBit % 16
  )
    throw new RangeError('Use 32–1024 samples per bit, in multiples of 16');
  return Array.from({ length: bits.length * samplesPerBit }, (_, i) => {
    const timeS = (i + 0.5) / (samplesPerBit * NFC.bitRate),
      reply = nfcReplyState(timeS, bits),
      loadOn = link.powered && reply.loadOn;
    return {
      timeS,
      ...reply,
      loadOn,
      readerCurrentRmsA: (loadOn ? link.loaded : link.unloaded).readerCurrentRmsA,
    };
  });
}

/**
 * Known bit timing, independent half-window envelope-variance detector.
 * Invalid/absent/ambiguous symbols return null instead of inventing a reply.
 * Synchronization, AGC, noise statistics, framing and error correction are omitted.
 */
export function nfcDecodeReply(samplesA: readonly number[], samplesPerBit = 128) {
  if (
    !Number.isInteger(samplesPerBit) ||
    samplesPerBit < 32 ||
    samplesPerBit % 16 ||
    samplesA.length % samplesPerBit ||
    samplesA.length > 256 * samplesPerBit
  )
    throw new RangeError('Expected complete, uniformly sampled data bits');
  samplesA.forEach((v) => finite(v, 'current sample'));
  const half = samplesPerBit / 2;
  const amplitude = (start: number) => {
    const window = samplesA.slice(start, start + half),
      mean = window.reduce((sum, x) => sum + x, 0) / half;
    return 2 * Math.sqrt(window.reduce((sum, x) => sum + (x - mean) ** 2, 0) / half);
  };
  return Array.from({ length: samplesA.length / samplesPerBit }, (_, bit): 0 | 1 | null => {
    const first = amplitude(bit * samplesPerBit),
      second = amplitude(bit * samplesPerBit + half),
      floor = NFC.receiverCurrentThresholdA;
    if (first >= floor && first > 2 * second) return 1;
    if (second >= floor && second > 2 * first) return 0;
    return null;
  });
}
