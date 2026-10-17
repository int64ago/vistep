/** A reproducible basic Bloom filter. Seeded FNV-1a + avalanche is a teaching hash, not cryptographic. */
export function bloomHash(text: string, seed: number) {
  let x = (0x811c9dc5 ^ Math.imul(seed + 1, 0x9e3779b9)) >>> 0;
  for (const byte of new TextEncoder().encode(text)) {
    x ^= byte;
    x = Math.imul(x, 0x01000193) >>> 0;
  }
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}
export function bloomPositions(text: string, m = 32, k = 3) {
  if (!Number.isInteger(m) || m < 8 || m > 256 || !Number.isInteger(k) || k < 1 || k > 8)
    throw new RangeError('Invalid Bloom dimensions');
  return Array.from({ length: k }, (_, i) => bloomHash(text, i) % m);
}
export function bloomBuild(items: readonly string[], m = 32, k = 3) {
  if (items.length > 128) throw new RangeError('Teaching set limit');
  const bits = Array<number>(m).fill(0),
    snapshots: number[][] = [[...bits]];
  for (const word of items) {
    for (const i of bloomPositions(word, m, k)) bits[i] = 1;
    snapshots.push([...bits]);
  }
  return {
    bits,
    m,
    k,
    items: [...new Set(items)],
    snapshots,
    occupied: bits.reduce((a, b) => a + b, 0),
  };
}
export function bloomQuery(filter: ReturnType<typeof bloomBuild>, word: string) {
  const positions = bloomPositions(word, filter.m, filter.k),
    missing = positions.filter((i) => !filter.bits[i]);
  return { positions, missing, maybe: missing.length === 0, actual: filter.items.includes(word) };
}
export const BLOOM_WORDS = ['apple', 'pear', 'plum'];
export function bloomFind(filter: ReturnType<typeof bloomBuild>, positive: boolean) {
  for (let i = 0; i < 100000; i++) {
    const key = `item-${i}`,
      q = bloomQuery(filter, key);
    if (q.maybe === positive && !q.actual) return key;
  }
  return '';
}
export function bloomNaiveDelete(filter: ReturnType<typeof bloomBuild>, word: string) {
  const bits = [...filter.bits];
  for (const pos of bloomPositions(word, filter.m, filter.k)) bits[pos] = 0;
  return {
    ...filter,
    bits,
    items: filter.items.filter((s) => s !== word),
    occupied: bits.reduce((a, b) => a + b, 0),
  };
}
export function bloomDeleteWitness(filter: ReturnType<typeof bloomBuild>) {
  for (const removed of filter.items) {
    const broken = bloomNaiveDelete(filter, removed);
    for (const victim of broken.items)
      if (!bloomQuery(broken, victim).maybe) return { removed, victim, broken };
  }
  return undefined;
}
/** Classical approximation assumes independent uniform hashes; not measured error probability. */
export function bloomApprox(m: number, k: number, n: number) {
  return (1 - Math.exp((-k * n) / m)) ** k;
}
