export type MarkovDistribution = readonly [number, number];
const probabilities = (alpha: number, beta: number) => {
  if (![alpha, beta].every((v) => Number.isFinite(v) && v >= 0 && v <= 1))
    throw new RangeError('Transition probabilities0–1');
};
const distribution = (p: MarkovDistribution) => {
  if (
    p.length !== 2 ||
    p.some((v) => !Number.isFinite(v) || v < 0 || v > 1) ||
    Math.abs(p[0] + p[1] - 1) > 1e-12
  )
    throw new RangeError('Distribution must sum to one');
};
export function markovStep(p: MarkovDistribution, alpha = 0.2, beta = 0.3): [number, number] {
  probabilities(alpha, beta);
  distribution(p);
  return [p[0] * (1 - alpha) + p[1] * beta, p[0] * alpha + p[1] * (1 - beta)];
}
export function markovStationary(alpha = 0.2, beta = 0.3) {
  probabilities(alpha, beta);
  return alpha + beta === 0
    ? { unique: false, distribution: null }
    : {
        unique: true,
        distribution: [beta / (alpha + beta), alpha / (alpha + beta)] as [number, number],
      };
}
export function markovTrace(
  alpha = 0.2,
  beta = 0.3,
  steps = 20,
  initial: MarkovDistribution = [1, 0],
) {
  probabilities(alpha, beta);
  distribution(initial);
  if (!Number.isInteger(steps) || steps < 0 || steps > 128) throw new RangeError('Step limit');
  const points: [number, number][] = [[...initial]];
  for (let i = 0; i < steps; i++) points.push(markovStep(points[points.length - 1], alpha, beta));
  return points;
}
export function markovPath(alpha = 0.2, beta = 0.3, steps = 20, start: 0 | 1 = 0, seed = 7) {
  probabilities(alpha, beta);
  if (
    !Number.isInteger(steps) ||
    steps < 0 ||
    steps > 128 ||
    ![0, 1].includes(start) ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff
  )
    throw new RangeError('Invalid path input');
  let state = start,
    random = seed >>> 0;
  const states: (0 | 1)[] = [state],
    transitions: { from: 0 | 1; to: 0 | 1; u: number; threshold: number }[] = [];
  for (let i = 0; i < steps; i++) {
    random = (random + 0x6d2b79f5) >>> 0;
    let z = Math.imul(random ^ (random >>> 15), 1 | random);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    const u = ((z ^ (z >>> 14)) >>> 0) / 4294967296,
      from = state,
      threshold = from === 0 ? alpha : beta;
    if (u < threshold) state = from === 0 ? 1 : 0;
    transitions.push({ from, to: state, u, threshold });
    states.push(state);
  }
  return { states, transitions };
}
