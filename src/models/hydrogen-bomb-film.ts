import { FUSION_DEFAULT, kelvinToKeV, TEMPERATURES, type FusionParameters } from './hydrogen-bomb';

export type FusionView =
  'approach' | 'binding' | 'distribution' | 'rate' | 'ignition' | 'fuel' | 'confinement';
export const FUSION_VIEWS: FusionView[] = [
  'approach',
  'binding',
  'distribution',
  'rate',
  'ignition',
  'fuel',
  'confinement',
];
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
const ramp = (p: number, a = 0.2, b = 0.8) => smooth((p - a) / (b - a));
const logMix = (a: number, b: number, k: number) =>
  k <= 0 ? a : k >= 1 ? b : Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k);

/** Three approach attempts in the first chapter, each at a named temperature. */
export const APPROACH_ATTEMPTS = [
  { id: 'flame', temperatureKeV: kelvinToKeV(TEMPERATURES.chemicalFlameK) },
  { id: 'sun', temperatureKeV: kelvinToKeV(TEMPERATURES.sunCoreK) },
  { id: 'ignition', temperatureKeV: 10 },
] as const;

export type FusionShot = {
  view: FusionView;
  parameters: FusionParameters;
  /** Approach chapter: which attempt, ball phase (turning point at 0.5) and tunnelling reveal. */
  attempt: number;
  approachPhase: number;
  tunnelReveal: number;
  /** Binding chapter: 0 = mark reactants, 1 = lift to helium, 2 = compare per nucleon. */
  bindingStep: number;
  /** Distribution chapter overlays. */
  showTunnelling: number;
  showProduct: number;
  /** Ignition chapter: 0 chemical flame, 1 fission fireball, 2 compression. */
  ignitionStep: number;
  /** Fuel chapter progress of the tracked neutron, 0..1. */
  fuelProgress: number;
  /** Confinement chapter: how many example points are revealed (0..3). */
  revealed: number;
};

/** Chapter-relative, deterministic director: seeking reproduces the whole teaching state. */
export function hydrogenBombShot(chapter: number, progress: number): FusionShot {
  if (!Number.isFinite(chapter) || !Number.isFinite(progress))
    throw new RangeError('Film position must be finite');
  const c = Math.max(0, Math.min(6, Math.floor(chapter)));
  const p = Math.max(0, Math.min(1, progress));
  const parameters: FusionParameters = { ...FUSION_DEFAULT };
  const shot: FusionShot = {
    view: FUSION_VIEWS[c],
    parameters,
    attempt: 2,
    approachPhase: 0.5,
    tunnelReveal: 0,
    bindingStep: 2,
    showTunnelling: 1,
    showProduct: 1,
    ignitionStep: 2,
    fuelProgress: 1,
    revealed: 3,
  };
  if (c === 0) {
    // Three attempts: 3000 K, the Sun's core, then 10 keV. Each runs out and back.
    const slots: [number, number][] = [
      [0.04, 0.3],
      [0.34, 0.6],
      [0.64, 0.86],
    ];
    const attempt = p < slots[1][0] ? 0 : p < slots[2][0] ? 1 : 2;
    const [start, end] = slots[attempt];
    shot.attempt = attempt;
    shot.approachPhase = Math.max(0, Math.min(1, (p - start) / (end - start)));
    parameters.temperatureKeV = APPROACH_ATTEMPTS[attempt].temperatureKeV;
    shot.tunnelReveal = ramp(p, 0.87, 0.96);
  }
  if (c === 1) shot.bindingStep = p < 0.32 ? 0 : p < 0.66 ? 1 : 2;
  if (c === 2) {
    const flame = APPROACH_ATTEMPTS[0].temperatureKeV,
      sun = APPROACH_ATTEMPTS[1].temperatureKeV;
    parameters.temperatureKeV =
      p < 0.42 ? logMix(flame, sun, ramp(p, 0.1, 0.38)) : logMix(sun, 10, ramp(p, 0.46, 0.7));
    shot.showTunnelling = ramp(p, 0.72, 0.82);
    shot.showProduct = ramp(p, 0.84, 0.94);
  }
  if (c === 3) parameters.temperatureKeV = logMix(1, 30, ramp(p, 0.12, 0.84));
  if (c === 4) {
    shot.ignitionStep = p < 0.3 ? 0 : p < 0.56 ? 1 : 2;
    parameters.temperatureKeV =
      shot.ignitionStep === 0
        ? APPROACH_ATTEMPTS[0].temperatureKeV
        : logMix(APPROACH_ATTEMPTS[0].temperatureKeV, 10, ramp(p, 0.3, 0.44));
    parameters.compression = shot.ignitionStep < 2 ? 1 : logMix(1, 1000, ramp(p, 0.58, 0.9));
  }
  if (c === 5) shot.fuelProgress = ramp(p, 0.06, 0.9);
  if (c === 6) shot.revealed = p < 0.12 ? 0 : p < 0.4 ? 1 : p < 0.68 ? 2 : 3;
  if (c >= 3 && c !== 4) parameters.compression = 1;
  return shot;
}
