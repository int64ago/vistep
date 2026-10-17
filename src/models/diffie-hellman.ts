export const DH_GROUP = { p: 23, q: 11, g: 2 };
export function dhPow(base: number, exponent: number) {
  if (
    !Number.isSafeInteger(base) ||
    !Number.isSafeInteger(exponent) ||
    exponent < 0 ||
    exponent > 1000
  )
    throw new RangeError('Invalid modular exponent');
  let result = 1,
    b = ((base % 23) + 23) % 23,
    e = exponent;
  while (e) {
    if (e % 2) result = (result * b) % 23;
    b = (b * b) % 23;
    e = Math.floor(e / 2);
  }
  return result;
}
const scalar = (x: number) => Number.isInteger(x) && x >= 1 && x < 11;
export function dhPublic(privateExponent: number) {
  if (!scalar(privateExponent)) throw new RangeError('Private exponent1–10');
  return dhPow(2, privateExponent);
}
export function dhShared(received: number, privateExponent: number) {
  if (
    !scalar(privateExponent) ||
    !Number.isInteger(received) ||
    received <= 1 ||
    received >= 23 ||
    dhPow(received, 11) !== 1
  )
    throw new RangeError('Invalid subgroup public value');
  return dhPow(received, privateExponent);
}
export function dhExchange(a = 6, b = 7) {
  const A = dhPublic(a),
    B = dhPublic(b);
  return { a, b, A, B, alice: dhShared(B, a), bob: dhShared(A, b) };
}
export function dhMitm(a = 6, b = 7, m = 3, n = 4) {
  const honest = dhExchange(a, b),
    toAlice = dhPublic(m),
    toBob = dhPublic(n);
  return {
    ...honest,
    toAlice,
    toBob,
    alice: dhShared(toAlice, a),
    bob: dhShared(toBob, b),
    attackerAlice: dhShared(honest.A, m),
    attackerBob: dhShared(honest.B, n),
  };
}
export function dhBrute(publicValue: number) {
  const rows = Array.from({ length: 10 }, (_, i) => ({ exponent: i + 1, value: dhPublic(i + 1) }));
  return { rows, recovered: rows.find((row) => row.value === publicValue)?.exponent ?? null };
}
