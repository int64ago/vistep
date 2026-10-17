import { hashDigest, hashUtf8 } from './hash';
/** Insecure tiny prime-order Schnorr group, exclusively for inspectable teaching. */
export const SIGN_GROUP = { p: 1019, q: 509, g: 4 };
export const SIGN_PRIVATE = 137,
  SIGN_NONCE = 123,
  SIGN_MESSAGE = 'HELLO';
export type TeachingSignature = { R: number; s: number };
const mod = (n: number, m: number) => ((n % m) + m) % m;
export function signaturePow(base: number, exponent: number, modulus = SIGN_GROUP.p) {
  if (
    !Number.isSafeInteger(base) ||
    !Number.isSafeInteger(exponent) ||
    exponent < 0 ||
    !Number.isSafeInteger(modulus) ||
    modulus < 2 ||
    modulus > 65535
  )
    throw new RangeError('Invalid modular power');
  let result = 1,
    b = mod(base, modulus),
    e = exponent;
  while (e) {
    if (e % 2) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e = Math.floor(e / 2);
  }
  return result;
}
const scalar = (x: number) => Number.isInteger(x) && x > 0 && x < SIGN_GROUP.q;
const member = (x: number) =>
  Number.isInteger(x) && x > 1 && x < SIGN_GROUP.p && signaturePow(x, SIGN_GROUP.q) === 1;
export function signaturePublic(privateKey: number) {
  if (!scalar(privateKey)) throw new RangeError('Private scalar1–508');
  return signaturePow(SIGN_GROUP.g, privateKey);
}
export function signatureChallenge(message: string, R: number, publicKey: number) {
  if (hashUtf8(message).length > 96) throw new RangeError('Message byte limit');
  const digest = hashDigest(
    hashUtf8(JSON.stringify(['vistep-demo-schnorr-v1', R, publicKey, message])),
  );
  return Number(BigInt(`0x${digest}`) % BigInt(SIGN_GROUP.q));
}
export function signatureSign(message: string, privateKey = SIGN_PRIVATE, nonce = SIGN_NONCE) {
  if (!scalar(nonce)) throw new RangeError('Nonce scalar1–508');
  const publicKey = signaturePublic(privateKey),
    R = signaturePow(SIGN_GROUP.g, nonce),
    e = signatureChallenge(message, R, publicKey),
    s = mod(nonce + e * privateKey, SIGN_GROUP.q);
  return { signature: { R, s }, publicKey, challenge: e };
}
export function signatureVerify(message: string, signature: TeachingSignature, publicKey: number) {
  if (
    !member(publicKey) ||
    !member(signature.R) ||
    !Number.isInteger(signature.s) ||
    signature.s < 0 ||
    signature.s >= SIGN_GROUP.q
  )
    return { valid: false, left: null, right: null, challenge: null };
  const challenge = signatureChallenge(message, signature.R, publicKey),
    left = signaturePow(SIGN_GROUP.g, signature.s),
    right = (signature.R * signaturePow(publicKey, challenge)) % SIGN_GROUP.p;
  return { valid: left === right, left, right, challenge };
}
function inverse(value: number) {
  let a = mod(value, SIGN_GROUP.q),
    b = SIGN_GROUP.q,
    x = 1,
    y = 0;
  while (b) {
    const q = Math.floor(a / b);
    [a, b] = [b, a - q * b];
    [x, y] = [y, x - q * y];
  }
  if (a !== 1) throw new RangeError('Challenge difference is not invertible');
  return mod(x, SIGN_GROUP.q);
}
export function signatureRecoverReusedNonce(
  first: { message: string; signature: TeachingSignature },
  second: { message: string; signature: TeachingSignature },
  publicKey: number,
) {
  if (
    first.signature.R !== second.signature.R ||
    !signatureVerify(first.message, first.signature, publicKey).valid ||
    !signatureVerify(second.message, second.signature, publicKey).valid
  )
    throw new RangeError('Two valid signatures with the same commitment required');
  const e1 = signatureChallenge(first.message, first.signature.R, publicKey),
    e2 = signatureChallenge(second.message, second.signature.R, publicKey);
  return mod((first.signature.s - second.signature.s) * inverse(e1 - e2), SIGN_GROUP.q);
}
