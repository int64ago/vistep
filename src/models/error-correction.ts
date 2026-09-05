/** Binary, even-parity Hamming codes. Array index i always means position i + 1.
 * Data order is d1,d2,d3,d4 at positions 3,5,6,7. No channel knowledge enters decode.
 */
export type EcBit = 0 | 1;
export type EcMode = 'hamming' | 'extended';
export const EC_DATA_POSITIONS = [3, 5, 6, 7] as const;
export const EC_CHECK_POSITIONS = [1, 2, 4] as const;
/** The seven Venn regions correspond exactly to the three parity memberships. */
export const EC_WEAVE_NODES = [
  [70, 88],
  [230, 88],
  [150, 64],
  [150, 242],
  [104, 175],
  [196, 175],
  [150, 128],
  [239, 234],
] as const;
export const EC_WEAVE_LOOPS = [
  [108, 110],
  [192, 110],
  [150, 181],
] as const;
export const EC_WEAVE_RADIUS = 80;

export const EC_GROUPS = [
  [1, 3, 5, 7],
  [2, 3, 6, 7],
  [4, 5, 6, 7],
] as const;
export const EC_H = [
  [1, 0, 1, 0, 1, 0, 1],
  [0, 1, 1, 0, 0, 1, 1],
  [0, 0, 0, 1, 1, 1, 1],
] as const;
/** c = d G, over GF(2). Data columns form an identity matrix. */
export const EC_G = [
  [1, 1, 1, 0, 0, 0, 0],
  [1, 0, 0, 1, 1, 0, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [1, 1, 0, 1, 0, 0, 1],
] as const;

function assertBits(bits: readonly number[], length: number) {
  if (bits.length !== length || bits.some((b) => b !== 0 && b !== 1))
    throw new RangeError(`Expected ${length} binary digits`);
}
export function ecXor(bits: readonly number[]): EcBit {
  return bits.reduce((a, b) => a ^ b, 0) as EcBit;
}
export function ecData(value: number): EcBit[] {
  if (!Number.isInteger(value) || value < 0 || value > 15)
    throw new RangeError('A message is an integer from 0 to 15');
  return [3, 2, 1, 0].map((s) => ((value >> s) & 1) as EcBit);
}
export function ecEncode(data: readonly EcBit[], mode: EcMode = 'hamming'): EcBit[] {
  assertBits(data, 4);
  const word = Array.from({ length: 7 }, (_, col) =>
    ecXor(EC_G.map((row, i) => row[col] & data[i])),
  );
  return mode === 'extended' ? [...word, ecXor(word)] : word;
}
export function ecExtract(word: readonly EcBit[]): EcBit[] {
  if (word.length !== 7 && word.length !== 8) throw new RangeError('Expected 7 or 8 bits');
  assertBits(word, word.length);
  return EC_DATA_POSITIONS.map((pos) => word[pos - 1]);
}
export function ecFlip(word: readonly EcBit[], positions: readonly number[]): EcBit[] {
  assertBits(word, word.length);
  if (
    new Set(positions).size !== positions.length ||
    positions.some((p) => !Number.isInteger(p) || p < 1 || p > word.length)
  )
    throw new RangeError('Flip positions must be distinct, one-based positions in the word');
  return word.map((bit, i) => (positions.includes(i + 1) ? 1 - bit : bit) as EcBit);
}
export type EcDecode = {
  checks: EcBit[];
  syndrome: number;
  overall: EcBit | null;
  status: 'accepted' | 'corrected' | 'overall-corrected' | 'detected';
  correction: number | null;
  corrected: EcBit[] | null;
  payload: EcBit[] | null;
};
export function ecDecode(received: readonly EcBit[], mode: EcMode = 'hamming'): EcDecode {
  assertBits(received, mode === 'extended' ? 8 : 7);
  const checks = EC_H.map((row) => ecXor(row.map((v, i) => v & received[i])));
  const syndrome = checks.reduce<number>((n, bit, i) => n + bit * (1 << i), 0);
  const overall = mode === 'extended' ? ecXor(received) : null;
  let status: EcDecode['status'] = 'accepted';
  let correction: number | null = null;
  if (mode === 'extended' && syndrome !== 0 && overall === 0) status = 'detected';
  else if (syndrome !== 0) {
    status = 'corrected';
    correction = syndrome;
  } else if (overall === 1) {
    status = 'overall-corrected';
    correction = 8;
  }
  const corrected = status === 'detected' ? null : ecFlip(received, correction ? [correction] : []);
  return {
    checks,
    syndrome,
    overall,
    status,
    correction,
    corrected,
    payload: corrected ? ecExtract(corrected) : null,
  };
}
export function ecDistance(a: readonly EcBit[], b: readonly EcBit[]): number {
  assertBits(a, b.length);
  assertBits(b, a.length);
  return a.reduce<number>((n, bit, i) => n + Number(bit !== b[i]), 0);
}
export function ecCase(value: number, mode: EcMode, flips: readonly number[]) {
  const data = ecData(value),
    encoded = ecEncode(data, mode),
    received = ecFlip(encoded, flips);
  const decoded = ecDecode(received, mode);
  return {
    data,
    mode,
    encoded,
    received,
    flips: [...flips],
    decoded,
    recovered: decoded.payload !== null && ecDistance(data, decoded.payload) === 0,
  };
}
export type EcCase = ReturnType<typeof ecCase>;
const unit = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
export type EcShot = {
  chapter: number;
  progress: number;
  sample: EcCase;
  focus: number;
  built: number;
  revealed: number;
  corrected: boolean;
  decision: boolean;
};
/** All teaching events are a pure function of the shared director, including backwards seeks. */
export function ecShot(chapter: number, progress: number): EcShot {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(7, Math.floor(chapter))) : 0;
  const p = unit(progress);
  let mode: EcMode = c >= 6 ? 'extended' : 'hamming';
  let flips: number[] = [],
    focus = -1,
    built = 3,
    revealed = 3,
    corrected = false,
    decision = false;
  if (c === 0) {
    built = Math.min(3, Math.floor(p * 4));
    focus = Math.min(2, built);
  }
  if (c === 1) focus = Math.min(2, Math.floor(p * 3));
  if (c === 2) {
    flips = p >= 0.28 ? [6] : [];
    revealed = 0;
  }
  if (c === 3) {
    flips = [6];
    revealed = Math.min(3, Math.floor(p * 4));
    focus = Math.min(2, revealed);
    decision = revealed === 3;
  }
  if (c === 4) {
    flips = [6];
    corrected = p >= 0.35;
    decision = true;
  }
  if (c === 5) {
    flips = p >= 0.18 ? [3, 5] : [];
    corrected = p >= 0.6;
    decision = p >= 0.18;
  }
  if (c === 6) {
    flips = p >= 0.28 ? [3, 5] : [];
    decision = p >= 0.28;
  }
  if (c === 7) {
    const cases = [[], [6], [8], [3, 5]];
    flips = cases[Math.min(3, Math.floor(p * 4))];
    corrected = true;
    decision = true;
  }
  return {
    chapter: c,
    progress: p,
    sample: ecCase(11, mode, flips),
    focus,
    built,
    revealed,
    corrected,
    decision,
  };
}
