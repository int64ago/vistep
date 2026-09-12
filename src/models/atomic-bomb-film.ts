import {
  chooseSeed,
  expandedRadius,
  fissionChain,
  multiplication,
  stoppingScale,
  type FissionChain,
} from './atomic-bomb';

export type AtomicBombView =
  'capture' | 'binding' | 'chain' | 'leak' | 'critical' | 'compare' | 'expansion';
export const ATOMIC_BOMB_VIEWS: AtomicBombView[] = [
  'capture',
  'binding',
  'chain',
  'leak',
  'critical',
  'compare',
  'expansion',
];
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
export const ramp = (p: number, a = 0.2, b = 0.8) => smooth((p - a) / (b - a));

/** Film geometry in mean free paths. The small sphere leaks most neutrons; the large one is
 * well past the diffusion critical radius; the expanded sphere returns below it. */
export const ATOMIC_BOMB_FILM = {
  smallRadius: 1.6,
  largeRadius: 4.5,
  expansionScale: 1.6,
  chainGenerations: 7,
} as const;

/** Walk time by which the given share of neutrons has been born; long stragglers are excluded. */
export function chainHorizon(chain: FissionChain, share = 0.95) {
  if (!Number.isFinite(share) || share <= 0 || share > 1)
    throw new RangeError('Share must be within (0, 1]');
  const last = Math.max(...chain.neutrons.map((n) => n.end));
  if (share === 1) return last;
  const births = chain.neutrons.map((n) => n.born).sort((a, b) => a - b);
  const index = Math.min(births.length - 1, Math.max(0, Math.ceil(share * births.length) - 1));
  return Math.max(births[index], Math.min(last, births[index] + 2));
}

/** The three deterministic walks the film shows; seeds are searched once so the chapter's claim
 * (dies out / grows / dies out after expansion) is what the reader actually sees. */
export const atomicBombChains = (() => {
  let cache: {
    small: FissionChain;
    large: FissionChain;
    ideal: FissionChain;
    expanded: FissionChain;
  } | null = null;
  return () => {
    if (cache) return cache;
    const small = chooseSeed(
      ATOMIC_BOMB_FILM.smallRadius,
      (c) =>
        !c.truncated &&
        c.generations.length >= 3 &&
        c.generations.length <= 4 &&
        c.neutrons.length >= 5 &&
        c.neutrons.length <= 12,
    ).chain;
    const large = chooseSeed(
      ATOMIC_BOMB_FILM.largeRadius,
      (c) =>
        c.generations.length >= 8 &&
        c.neutrons.length >= 300 &&
        c.generations.slice(0, 6).every((g, i, a) => !i || g >= a[i - 1]),
    ).chain;
    const ideal = chooseSeed(
      Infinity,
      (c) =>
        c.generations.length >= ATOMIC_BOMB_FILM.chainGenerations &&
        c.generations[ATOMIC_BOMB_FILM.chainGenerations - 1] >= 20 &&
        c.generations[ATOMIC_BOMB_FILM.chainGenerations - 1] <= 60 &&
        c.neutrons.length <= 200,
      { maxGenerations: ATOMIC_BOMB_FILM.chainGenerations },
    ).chain;
    const expanded = chooseSeed(
      expandedRadius(ATOMIC_BOMB_FILM.largeRadius, ATOMIC_BOMB_FILM.expansionScale),
      (c) =>
        !c.truncated &&
        c.generations.length >= 2 &&
        c.generations.length <= 4 &&
        c.neutrons.length >= 4 &&
        c.neutrons.length <= 12,
    ).chain;
    cache = { small, large, ideal, expanded };
    return cache;
  };
})();

export type AtomicBombShot = {
  view: AtomicBombView;
  /** 0 → neutron approaching, 1 → absorbed. */
  approach: number;
  /** Liquid-drop deformation 0…1; scission at 1. */
  deformation: number;
  /** Fragment and prompt-neutron flight after scission, 0…1. */
  flight: number;
  /** Binding-curve reveal, marker reveal and difference bar, 0…1 each. */
  curve: number;
  markers: number;
  difference: number;
  /** Generations of the ideal tree to show, and how far the log growth graph extends (0…1). */
  generations: number;
  growth: number;
  /** Bare-sphere radius in mean free paths, and the walk time to draw for the current sphere. */
  radius: number;
  walkTime: number;
  /** Which prepared chain the walk views draw. */
  chain: 'small' | 'large' | 'expanded' | null;
  /** Time-axis reveal for the reactor/explosive comparison, 0…1. */
  compare: number;
  /** Uniform expansion factor of the sphere at fixed mass. */
  scale: number;
};
/** Chapter-relative, deterministic direction. */
export function atomicBombShot(chapter: number, progress: number): AtomicBombShot {
  if (!Number.isFinite(chapter) || !Number.isFinite(progress))
    throw new RangeError('Film position must be finite');
  const c = Math.max(0, Math.min(6, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress)),
    chains = atomicBombChains();
  const shot: AtomicBombShot = {
    view: ATOMIC_BOMB_VIEWS[c],
    approach: 1,
    deformation: 0,
    flight: 0,
    curve: 1,
    markers: 1,
    difference: 1,
    generations: ATOMIC_BOMB_FILM.chainGenerations,
    growth: 1,
    radius: ATOMIC_BOMB_FILM.largeRadius,
    walkTime: 0,
    chain: null,
    compare: 1,
    scale: 1,
  };
  if (c === 0) {
    shot.approach = ramp(p, 0.03, 0.2);
    shot.deformation = ramp(p, 0.32, 0.68);
    shot.flight = ramp(p, 0.68, 0.96);
  }
  if (c === 1) {
    shot.curve = ramp(p, 0.04, 0.34);
    shot.markers = ramp(p, 0.36, 0.56);
    shot.difference = ramp(p, 0.6, 0.8);
  }
  if (c === 2) {
    shot.generations = Math.min(
      ATOMIC_BOMB_FILM.chainGenerations,
      Math.floor(ramp(p, 0.04, 0.62) * (ATOMIC_BOMB_FILM.chainGenerations + 0.999)),
    );
    shot.growth = ramp(p, 0.66, 0.94);
  }
  if (c === 3) {
    shot.radius = ATOMIC_BOMB_FILM.smallRadius;
    shot.chain = 'small';
    shot.walkTime = ramp(p, 0.12, 0.72) * chainHorizon(chains.small, 1);
  }
  if (c === 4) {
    const grow = ramp(p, 0.06, 0.42);
    shot.radius =
      ATOMIC_BOMB_FILM.smallRadius +
      (ATOMIC_BOMB_FILM.largeRadius - ATOMIC_BOMB_FILM.smallRadius) * grow;
    shot.chain = 'large';
    shot.walkTime = ramp(p, 0.48, 0.97) * chainHorizon(chains.large);
  }
  // All three curves are on screen before the narration names the grey line.
  if (c === 5) shot.compare = ramp(p, 0.04, 0.42);
  if (c === 6) {
    shot.scale = 1 + (ATOMIC_BOMB_FILM.expansionScale - 1) * ramp(p, 0.22, 0.62);
    shot.radius = expandedRadius(ATOMIC_BOMB_FILM.largeRadius, shot.scale);
    if (p < 0.62) {
      // The finished walk stays on the expanding material until the new, sparser walk begins.
      shot.chain = 'large';
      shot.walkTime = chainHorizon(chains.large);
    } else {
      shot.chain = 'expanded';
      shot.walkTime = ramp(p, 0.64, 0.95) * chainHorizon(chains.expanded, 1);
    }
  }
  return shot;
}
/** Readouts every walk view shares, derived from the same diffusion model. */
export function sphereReadout(radius: number) {
  return {
    k: multiplication(radius),
    stopScale: stoppingScale(radius),
  };
}
export const chainFor = (name: AtomicBombShot['chain']) => (name ? atomicBombChains()[name] : null);
/** Exploration: a fresh walk in the chosen sphere for a chosen seed. */
export const exploreChain = (radius: number, seed: number) =>
  fissionChain(radius, seed, { maxNeutrons: 320, maxGenerations: 12 });
