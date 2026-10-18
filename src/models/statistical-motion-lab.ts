export function randomUnit(index: number, seed = 31) {
  let n = (Math.imul(index + 1, 2654435761) ^ seed) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 2246822507);
  n ^= n >>> 13;
  return (n >>> 0) / 4294967296;
}
export function bernoulliTrial(index: number, choices = 8, seed = 31) {
  return Array.from({ length: choices }, (_, i) =>
    randomUnit(index * choices + i, seed) < 0.5 ? 0 : 1,
  );
}
export function trialHistogram(count: number, choices = 8, seed = 31) {
  const bins = Array(choices + 1).fill(0) as number[];
  for (let i = 0; i < Math.max(0, Math.floor(count)); i++)
    bins[bernoulliTrial(i, choices, seed).reduce<number>((a, b) => a + b, 0)]++;
  return bins;
}
export function binomialProbabilities(n: number) {
  let choose = 1;
  return Array.from({ length: n + 1 }, (_, k) => {
    if (k) choose *= (n - k + 1) / k;
    return choose / 2 ** n;
  });
}
export function galtonBall(index: number, progress: number) {
  const steps = bernoulliTrial(index),
    p = Math.max(0, Math.min(0.999999, progress)),
    row = Math.min(7, Math.floor(p * 9)),
    q = p * 9 - row,
    previous = steps.slice(0, row).reduce<number>((a, b) => a + b, 0),
    direction = steps[row] ? 1 : -1,
    x = 180 + (2 * previous - row) * 9,
    y = 58 + row * 17;
  if (p * 9 >= 8) {
    const bin = steps.reduce<number>((a, b) => a + b, 0),
      prior = trialHistogram(index)[bin],
      u = p * 9 - 8;
    return {
      x: 180 + (2 * bin - 8) * 9 + ((prior % 3) - 1) * 4.8 * u,
      y: 189.4 + (282 - Math.floor(prior / 3) * 4.8 - 189.4) * u * u,
      row: 8,
    };
  }
  if (q < 0.3) {
    const a = -Math.PI / 2 + ((q / 0.3) * Math.PI) / 2;
    return { x: x + direction * 4.6 * Math.cos(a), y: y + 4.6 * Math.sin(a), row };
  }
  const r = (q - 0.3) / 0.7;
  return { x: x + direction * (4.6 + 4.4 * r), y: y + 12.4 * r * r, row };
}
export function beansOnScale(
  time: number,
  {
    count = 100,
    rate = 20,
    height = 0.2,
    mass = 0.0005,
    tau = 0.08,
  }: { count?: number; rate?: number; height?: number; mass?: number; tau?: number } = {},
) {
  const flight = Math.sqrt((2 * height) / 9.8),
    speed = Math.sqrt(2 * 9.8 * height),
    t = Math.max(0, time),
    arrivals = Array.from({ length: count }, (_, i) => i / Math.max(1, rate) + flight).filter(
      (hit) => hit <= t,
    );
  const impact = arrivals.reduce(
      (sum, hit) => sum + ((mass * speed) / tau) * Math.exp(-(t - hit) / tau),
      0,
    ),
    weight = arrivals.reduce((sum, hit) => sum + mass * 9.8 * (1 - Math.exp(-(t - hit) / tau)), 0);
  return {
    flight,
    speed,
    landed: arrivals.length,
    impact,
    weight,
    reading: impact + weight,
    meanImpact: mass * speed * rate,
  };
}
