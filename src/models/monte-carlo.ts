export type MonteSampling = 'uniform' | 'biased';
export type MontePoint = { x: number; y: number; hit: boolean };
export type MonteSample = { points: MontePoint[]; hits: number[]; sampling: MonteSampling };

export function monteInside(x: number, y: number) {
  if (![x, y].every((v) => Number.isFinite(v) && v >= 0 && v <= 1))
    throw new RangeError('Unit-square coordinates required');
  return x * x + y * y <= 1;
}

/** Reproducible pseudorandom demonstration, not a certified random source. */
export function monteSample(
  count = 4096,
  seed = 7,
  sampling: MonteSampling = 'uniform',
): MonteSample {
  if (
    !Number.isInteger(count) ||
    count < 0 ||
    count > 8192 ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    !['uniform', 'biased'].includes(sampling)
  )
    throw new RangeError('Invalid sampling input');
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = Math.imul(state ^ (state >>> 15), 1 | state);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
  const points: MontePoint[] = [],
    hits = [0];
  for (let i = 0; i < count; i++) {
    const u = random(),
      y = random(),
      x = sampling === 'biased' ? u * u : u,
      hit = monteInside(x, y);
    points.push({ x, y, hit });
    hits.push(hits[i] + Number(hit));
  }
  return { points, hits, sampling };
}

/** Wilson score interval, no continuity correction, nominal 95%, under i.i.d. Bernoulli sampling. */
export function monteWilson(hits: number, count: number): [number, number] | null {
  if (
    !Number.isInteger(count) ||
    count < 0 ||
    count > 8192 ||
    !Number.isInteger(hits) ||
    hits < 0 ||
    hits > count
  )
    throw new RangeError('Invalid binomial counts');
  if (count === 0) return null;
  const z = 1.959963984540054,
    z2 = z * z,
    p = hits / count,
    denominator = 1 + z2 / count;
  const center = (p + z2 / (2 * count)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / count + z2 / (4 * count * count))) / denominator;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

export function monteSummary(sample: MonteSample, count: number) {
  if (!Number.isInteger(count) || count < 0 || count > sample.points.length)
    throw new RangeError('Invalid prefix');
  const hits = sample.hits[count],
    estimate = count ? (4 * hits) / count : null;
  const interval =
    sample.sampling === 'uniform'
      ? (monteWilson(hits, count)?.map((v) => 4 * v) as [number, number] | undefined)
      : undefined;
  return { count, hits, estimate, interval: interval ?? null };
}

export function monteStandardError(count: number) {
  if (!Number.isInteger(count) || count < 1 || count > 8192)
    throw new RangeError('Positive sample count required');
  const p = Math.PI / 4;
  return 4 * Math.sqrt((p * (1 - p)) / count);
}
