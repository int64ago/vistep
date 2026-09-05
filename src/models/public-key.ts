/** Deliberately insecure, tiny textbook RSA. No text encryption, padding or signing API.
 * Independently authored from RFC 8017 §§3,5.1 and Rivest–Shamir–Adleman (1978).
 * All modular products use BigInt; number conversion is only within this bounded lesson.
 */
export const PK_DEFAULT_MESSAGE = 42;
export const PK_PRIME_LIMIT = 97;
export type PublicKey = { n: number; e: number };
export type TeachingKey = PublicKey & {
  p: number;
  q: number;
  phi: number;
  lambda: number;
  d: number;
  inverse: { quotient: number; remainder: number; dividend: number; divisor: number }[];
  bezout: { x: number; y: number };
};
export type PowerStep = {
  index: number;
  power: number;
  selected: boolean;
  factor: number;
  squareFrom: number | null;
  squareProduct: number | null;
  squareQuotient: number | null;
  before: number;
  product: number;
  quotient: number;
  after: number;
};
export type PowerTrace = {
  base: number;
  exponent: number;
  modulus: number;
  steps: PowerStep[];
  result: number;
};
function integer(value: number, min: number, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new RangeError('integer out of teaching range');
}
export function pkGcd(a: number, b: number) {
  integer(a, 0);
  integer(b, 0);
  while (b) [a, b] = [b, a % b];
  return a;
}
export function pkPrime(n: number) {
  if (!Number.isSafeInteger(n) || n < 2 || n > PK_PRIME_LIMIT) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}
export function pkInverse(e: number, modulus: number) {
  integer(e, 1, 10000);
  integer(modulus, 2, 10000);
  let a = e,
    b = modulus,
    x0 = 1,
    x1 = 0,
    y0 = 0,
    y1 = 1;
  const rows: TeachingKey['inverse'] = [];
  while (b) {
    const quotient = Math.floor(a / b),
      remainder = a % b;
    rows.push({ dividend: a, divisor: b, quotient, remainder });
    [a, b] = [b, remainder];
    [x0, x1] = [x1, x0 - quotient * x1];
    [y0, y1] = [y1, y0 - quotient * y1];
  }
  if (a !== 1) throw new RangeError('public exponent has no inverse');
  return { d: ((x0 % modulus) + modulus) % modulus, rows, x: x0, y: y0 };
}
export function pkKey(p: number, q: number, e: number): TeachingKey {
  if (!pkPrime(p) || !pkPrime(q) || p === 2 || q === 2 || p === q)
    throw new RangeError('use two distinct odd teaching primes, at most 97');
  const n = p * q,
    phi = (p - 1) * (q - 1),
    lambda = phi / pkGcd(p - 1, q - 1);
  integer(e, 3, n - 1);
  const inv = pkInverse(e, lambda);
  return { p, q, n, e, phi, lambda, d: inv.d, inverse: inv.rows, bezout: { x: inv.x, y: inv.y } };
}
export const PK_KEYS = [pkKey(11, 17, 7), pkKey(13, 19, 5), pkKey(17, 23, 3)] as const;
/** General bounded modular exponentiation trace, including exponent zero. */
export function pkPower(base: number, exponent: number, modulus: number): PowerTrace {
  integer(modulus, 2, PK_PRIME_LIMIT ** 2);
  integer(base, 0, modulus - 1);
  integer(exponent, 0, 10000);
  const n = BigInt(modulus);
  let factor = BigInt(base),
    accumulator = 1n,
    remaining = exponent,
    power = 1;
  const steps: PowerStep[] = [];
  while (remaining > 0) {
    const selected = remaining % 2 === 1,
      product = selected ? accumulator * factor : accumulator;
    const previous = steps.at(-1)?.factor ?? null;
    const square = previous === null ? null : BigInt(previous) ** 2n;
    steps.push({
      index: steps.length,
      power,
      selected,
      factor: Number(factor),
      squareFrom: previous,
      squareProduct: square === null ? null : Number(square),
      squareQuotient: square === null ? null : Number(square / n),
      before: Number(accumulator),
      product: Number(product),
      quotient: Number(product / n),
      after: Number(product % n),
    });
    accumulator = product % n;
    factor = (factor * factor) % n;
    remaining = Math.floor(remaining / 2);
    power *= 2;
  }
  return { base, exponent, modulus, steps, result: Number(accumulator) };
}
function validatePublic(key: PublicKey) {
  integer(key.n, 9, PK_PRIME_LIMIT ** 2);
  integer(key.e, 3, key.n - 1);
}
export function pkEncrypt(message: number, key: PublicKey) {
  validatePublic(key);
  return pkPower(message, key.e, key.n);
}
export function pkDecrypt(cipher: number, key: TeachingKey) {
  const valid = pkKey(key.p, key.q, key.e);
  if (
    key.n !== valid.n ||
    key.lambda !== valid.lambda ||
    !Number.isSafeInteger(key.d) ||
    key.d < 1 ||
    key.d >= key.n ||
    (BigInt(key.e) * BigInt(key.d)) % BigInt(valid.lambda) !== 1n
  )
    throw new RangeError('invalid private key');
  return pkPower(cipher, key.d, key.n);
}
export function pkExchange(message: number, key: TeachingKey = PK_KEYS[0]) {
  const encryption = pkEncrypt(message, key),
    decryption = pkDecrypt(encryption.result, key);
  return {
    message,
    cipher: encryption.result,
    recovered: decryption.result,
    encryption,
    decryption,
    gcd: pkGcd(message, key.n),
    residues: [key.p, key.q].map((prime) => ({
      prime,
      original: message % prime,
      recovered: decryption.result % prime,
    })),
  };
}
/** Exhausts the small representative domain; public input only, no private factor access. */
export function pkGuess(cipher: number, key: PublicKey) {
  integer(cipher, 0, key.n - 1);
  validatePublic(key);
  const attempts: { message: number; cipher: number; matches: boolean }[] = [];
  for (let message = 0; message < key.n; message++) {
    const encrypted = pkEncrypt(message, key).result,
      matches = encrypted === cipher;
    attempts.push({ message, cipher: encrypted, matches });
    if (matches) break;
  }
  return attempts;
}
export function pkDomain(key: TeachingKey) {
  const rows = Array.from({ length: key.n }, (_, m) => pkExchange(m, key));
  return {
    count: rows.length,
    correct: rows.filter((r) => r.message === r.recovered).length,
    distinct: new Set(rows.map((r) => r.cipher)).size,
    nonCoprime: rows.filter((r) => r.gcd !== 1).length,
  };
}
export function pkParse(value: string, n: number): number | null {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) return null;
  const m = Number(value);
  return Number.isSafeInteger(m) && m >= 0 && m < n ? m : null;
}
/** State after exactly `completed` factors; returned rows are copied. No frame history. */
export function pkAt(trace: PowerTrace, completed: number) {
  integer(completed, 0, trace.steps.length);
  const current = completed ? { ...trace.steps[completed - 1] } : null;
  return {
    completed,
    accumulator: current?.after ?? 1,
    current,
    done: completed === trace.steps.length,
  };
}
/** Conceptual secure-use diagram: no OAEP, randomness, AEAD or identity verification is simulated. */
export const PK_SECURE_FLOW = [
  { id: 'key', from: 'random-key', to: 'recipient-public-key' },
  { id: 'wrap', from: 'recipient-public-key', to: 'recipient-private-key' },
  { id: 'content', from: 'random-key', to: 'authenticated-symmetric-encryption' },
  { id: 'identity', from: 'recipient-identity', to: 'verified-public-key' },
] as const;
export function pkShot(chapter: number, progress: number) {
  if (!Number.isFinite(progress) || !Number.isInteger(chapter))
    throw new RangeError('invalid director');
  const c = Math.max(0, Math.min(7, chapter)),
    p = Math.max(0, Math.min(1, progress));
  return {
    chapter: c,
    progress: p,
    phase: Math.min(3, Math.floor(p * 4.6)),
    encryptionSteps: Math.min(3, Math.floor(p * 4.6)),
    decryptionSteps: Math.min(5, Math.floor(p * 6.6)),
    caseIndex: Math.min(3, Math.floor(p * 4)),
    guesses: Math.min(43, 1 + Math.floor(p * 53)),
    secureStage: PK_SECURE_FLOW[Math.min(3, Math.floor(p * 4))],
    travel: Math.max(0, Math.min(1, (p - 0.18) / 0.65)),
  };
}
