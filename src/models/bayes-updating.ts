/** A synthetic paper-ticket population, not measured performance of a real test. */
export type BayesInputs = {
  prior: number;
  hit: number;
  otherHit: number;
  observations?: number;
  conditionallyIndependent?: boolean;
  population?: number;
};
export function bayesUpdate({
  prior,
  hit,
  otherHit,
  observations = 1,
  conditionallyIndependent = true,
  population = 10000,
}: BayesInputs) {
  if (
    [prior, hit, otherHit].some((p) => !Number.isFinite(p) || p < 0 || p > 1) ||
    !Number.isInteger(observations) ||
    observations < 1 ||
    observations > 8 ||
    !Number.isFinite(population) ||
    population <= 0
  )
    throw new RangeError('Invalid probability, observation count or population');
  // Seeing the very same mark again supplies no additional likelihood factor.
  const independentFactors = conditionallyIndependent ? observations : 1;
  const blueLikelihood = hit ** independentFactors,
    otherLikelihood = otherHit ** independentFactors;
  const blue = population * prior,
    other = population * (1 - prior);
  const blueMarked = blue * blueLikelihood,
    otherMarked = other * otherLikelihood;
  const selected = blueMarked + otherMarked,
    probability = selected / population;
  return {
    prior,
    hit,
    otherHit,
    observations,
    independentFactors,
    population,
    blue,
    other,
    blueLikelihood,
    otherLikelihood,
    blueMarked,
    otherMarked,
    selected,
    probability,
    posterior: selected > 0 ? blueMarked / selected : null,
  };
}
