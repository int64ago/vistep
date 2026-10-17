export function cltNormalDensity(z: number) {
  return Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
}
export function cltDistribution(n = 8, p = 0.5, copied = false) {
  if (!Number.isInteger(n) || n < 1 || n > 64 || !Number.isFinite(p) || p < 0 || p > 1)
    throw new RangeError('Invalid Bernoulli sum');
  const probabilities = Array<number>(n + 1).fill(0);
  if (copied) {
    probabilities[0] = 1 - p;
    probabilities[n] = p;
  } else {
    // Repeated independent convolution, including p=0 and p=1 without singular recurrence.
    probabilities[0] = 1;
    for (let j = 1; j <= n; j++)
      for (let k = j; k >= 0; k--)
        probabilities[k] = probabilities[k] * (1 - p) + (k > 0 ? probabilities[k - 1] * p : 0);
  }
  const mean = n * p,
    variance = (copied ? n * n : n) * p * (1 - p),
    sigma = Math.sqrt(variance);
  const items = probabilities.map((probability, k) => ({
    k,
    probability,
    z: sigma > 0 ? (k - mean) / sigma : null,
  }));
  return { n, p, copied, mean, variance, sigma, items, meanVariance: variance / (n * n) };
}
