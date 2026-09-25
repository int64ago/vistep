/**
 * MILENAGE (3GPP TS 35.206) on top of a small AES-128 encryption routine (FIPS-197), plus the
 * EPS key derivation for K_ASME (3GPP TS 33.401 Annex A.2, HMAC-SHA-256 per TS 33.220 B.2).
 * Teaching implementation: correct outputs for the published test sets, no side-channel hardening.
 */
import { hashDigest } from './hash';

export type Bytes = Uint8Array;

// ---------- hex / byte helpers ----------
export function mrHex(bytes: Bytes): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
export function mrBytes(hex: string): Bytes {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2 || /[^0-9a-f]/i.test(clean)) throw new RangeError('Invalid hex string');
  return Uint8Array.from({ length: clean.length / 2 }, (_, i) =>
    parseInt(clean.slice(i * 2, i * 2 + 2), 16),
  );
}
export const mrXor = (a: Bytes, b: Bytes): Bytes => {
  if (a.length !== b.length) throw new RangeError('XOR operands differ in length');
  return a.map((v, i) => v ^ b[i]);
};
/** Number of differing bits between equal-length byte strings. */
export function mrBitDistance(a: Bytes, b: Bytes): number {
  let n = 0;
  for (const v of mrXor(a, b)) for (let x = v; x; x &= x - 1) n++;
  return n;
}
/** Flip bit `index` counted from the most significant bit of byte 0. */
export function mrFlipBit(bytes: Bytes, index: number): Bytes {
  if (!Number.isInteger(index) || index < 0 || index >= bytes.length * 8)
    throw new RangeError('Bit index outside the value');
  const out = Uint8Array.from(bytes);
  out[index >> 3] ^= 0x80 >> (index & 7);
  return out;
}
const need = (b: Bytes, n: number, name: string) => {
  if (!(b instanceof Uint8Array) || b.length !== n)
    throw new RangeError(`${name} must be ${n} bytes`);
};

// ---------- AES-128 (encryption only) ----------
const SBOX = (() => {
  const box = new Uint8Array(256);
  // Build from the multiplicative inverse in GF(2^8) followed by the affine transform.
  let p = 1,
    q = 1;
  do {
    p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0); // p *= 3
    q ^= q << 1;
    q ^= q << 2;
    q ^= q << 4;
    q &= 0xff;
    if (q & 0x80) q ^= 0x09; // q /= 3
    const x = q ^ rotl8(q, 1) ^ rotl8(q, 2) ^ rotl8(q, 3) ^ rotl8(q, 4);
    box[p] = x ^ 0x63;
  } while (p !== 1);
  box[0] = 0x63;
  return box;
})();
function rotl8(x: number, s: number) {
  return ((x << s) | (x >> (8 - s))) & 0xff;
}
const xtime = (b: number) => ((b << 1) ^ (b & 0x80 ? 0x1b : 0)) & 0xff;

function expandKey(key: Bytes): Uint8Array[] {
  need(key, 16, 'AES key');
  const words: number[][] = [];
  for (let i = 0; i < 4; i++)
    words.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
  let rcon = 1;
  for (let i = 4; i < 44; i++) {
    let t = [...words[i - 1]];
    if (i % 4 === 0) {
      t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]];
      rcon = xtime(rcon);
    }
    words.push(words[i - 4].map((v, j) => v ^ t[j]));
  }
  return Array.from({ length: 11 }, (_, r) =>
    Uint8Array.from(words.slice(r * 4, r * 4 + 4).flat()),
  );
}

/** AES-128 single-block encryption, state in column-major byte order as in FIPS-197. */
export function aes128Encrypt(key: Bytes, block: Bytes): Bytes {
  need(block, 16, 'AES block');
  const rounds = expandKey(key);
  let s = mrXor(block, rounds[0]);
  for (let r = 1; r <= 10; r++) {
    const sub = s.map((v) => SBOX[v]);
    const shifted = new Uint8Array(16);
    for (let c = 0; c < 4; c++)
      for (let row = 0; row < 4; row++) shifted[c * 4 + row] = sub[((c + row) % 4) * 4 + row];
    let mixed = shifted;
    if (r < 10) {
      mixed = new Uint8Array(16);
      for (let c = 0; c < 4; c++) {
        const [a0, a1, a2, a3] = shifted.slice(c * 4, c * 4 + 4);
        const all = a0 ^ a1 ^ a2 ^ a3;
        mixed[c * 4] = a0 ^ all ^ xtime(a0 ^ a1);
        mixed[c * 4 + 1] = a1 ^ all ^ xtime(a1 ^ a2);
        mixed[c * 4 + 2] = a2 ^ all ^ xtime(a2 ^ a3);
        mixed[c * 4 + 3] = a3 ^ all ^ xtime(a3 ^ a0);
      }
    }
    s = mrXor(mixed, rounds[r]);
  }
  return s;
}

// ---------- MILENAGE ----------
/** Cyclic left rotation of a 128-bit value by a multiple of 8 bits (all MILENAGE r_i are). */
function rot(x: Bytes, bits: number): Bytes {
  const n = (bits / 8) % 16;
  return Uint8Array.from({ length: 16 }, (_, i) => x[(i + n) % 16]);
}
const constant = (last: number) => {
  const c = new Uint8Array(16);
  c[15] = last;
  return c;
};
// TS 35.206 §4.1 default constants: r1..r5 = 64, 0, 32, 64, 96; c1..c5 = 0, 1, 2, 4, 8.
const R = [64, 0, 32, 64, 96];
const C = [0, 1, 2, 4, 8].map(constant);

export function milenageOpc(k: Bytes, op: Bytes): Bytes {
  need(op, 16, 'OP');
  return mrXor(aes128Encrypt(k, op), op);
}

export type MilenageOutput = {
  opc: Bytes;
  /** f1: network authentication code carried in AUTN. */
  macA: Bytes;
  /** f1*: resynchronisation code. */
  macS: Bytes;
  /** f2: the user's response. */
  res: Bytes;
  /** f3 / f4: cipher and integrity keys. */
  ck: Bytes;
  ik: Bytes;
  /** f5 / f5*: anonymity keys that hide SQN. */
  ak: Bytes;
  akStar: Bytes;
};

export function milenage(input: {
  k: Bytes;
  rand: Bytes;
  sqn: Bytes;
  amf: Bytes;
  op?: Bytes;
  opc?: Bytes;
}): MilenageOutput {
  const { k, rand, sqn, amf } = input;
  need(k, 16, 'K');
  need(rand, 16, 'RAND');
  need(sqn, 6, 'SQN');
  need(amf, 2, 'AMF');
  const opc = input.opc ?? (input.op ? milenageOpc(k, input.op) : null);
  if (!opc) throw new RangeError('OP or OPc required');
  need(opc, 16, 'OPc');
  const temp = aes128Encrypt(k, mrXor(rand, opc));
  const in1 = Uint8Array.from([...sqn, ...amf, ...sqn, ...amf]);
  const out1 = mrXor(aes128Encrypt(k, mrXor(mrXor(temp, rot(mrXor(in1, opc), R[0])), C[0])), opc);
  const out = (i: number) => mrXor(aes128Encrypt(k, mrXor(rot(mrXor(temp, opc), R[i]), C[i])), opc);
  const out2 = out(1),
    out3 = out(2),
    out4 = out(3),
    out5 = out(4);
  return {
    opc,
    macA: out1.slice(0, 8),
    macS: out1.slice(8, 16),
    res: out2.slice(8, 16),
    ck: out3,
    ik: out4,
    ak: out2.slice(0, 6),
    akStar: out5.slice(0, 6),
  };
}

// ---------- HMAC-SHA-256 and the EPS K_ASME derivation ----------
export function hmacSha256(key: Bytes, message: Bytes): Bytes {
  let k = key;
  if (k.length > 64) k = mrBytes(hashDigest(k));
  const block = new Uint8Array(64);
  block.set(k);
  const inner = mrBytes(hashDigest(Uint8Array.from([...block.map((b) => b ^ 0x36), ...message])));
  return mrBytes(hashDigest(Uint8Array.from([...block.map((b) => b ^ 0x5c), ...inner])));
}

/** PLMN identity octets as in TS 24.008 §10.5.1.13 (BCD digits, filler F for a 2-digit MNC). */
export function plmnIdBytes(mcc: string, mnc: string): Bytes {
  if (!/^\d{3}$/.test(mcc) || !/^\d{2,3}$/.test(mnc)) throw new RangeError('Invalid PLMN digits');
  const d = (s: string, i: number) => Number(s[i]);
  const mnc3 = mnc.length === 3 ? d(mnc, 2) : 0xf;
  return Uint8Array.from([
    (d(mcc, 1) << 4) | d(mcc, 0),
    (mnc3 << 4) | d(mcc, 2),
    (d(mnc, 1) << 4) | d(mnc, 0),
  ]);
}

/** K_ASME = KDF(CK‖IK, FC=0x10, P0=SN id, L0, P1=SQN⊕AK, L1): binds the vector to one serving network. */
export function deriveKasme(ck: Bytes, ik: Bytes, servingNetwork: Bytes, sqnXorAk: Bytes): Bytes {
  need(ck, 16, 'CK');
  need(ik, 16, 'IK');
  need(servingNetwork, 3, 'SN id');
  need(sqnXorAk, 6, 'SQN⊕AK');
  const s = Uint8Array.from([0x10, ...servingNetwork, 0x00, 0x03, ...sqnXorAk, 0x00, 0x06]);
  return hmacSha256(Uint8Array.from([...ck, ...ik]), s);
}
