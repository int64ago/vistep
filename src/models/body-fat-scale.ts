/** A disclosed RC + two-compartment teaching model, not a calibrated BIA
 * equation or a measurement of a reader. Electrical units are SI. Water
 * litres are treated as kg in this controlled, fixed-dry-mass experiment. */
export const BFS = {
  heightM: 1.7,
  waterL: 40.15,
  dryLeanKg: 14.85,
  fatKg: 15,
  extracellularOhm: 750,
  intracellularOhm: 1000,
  membraneF: 8e-9,
  referenceHz: 50000,
  currentRmsA: 250e-6,
  hydrationAssumption: 0.73,
  gravity: 9.80665,
  bridgeExcitationV: 1.7,
  gaugeFactor: 2,
  strainPerNewton: 3e-6,
} as const;
export type BfsInput = {
  waterDeltaL: number;
  frequencyHz: number;
  contact: boolean;
  phaseCycles: number;
};
export const BFS_DEFAULT: BfsInput = {
  waterDeltaL: 0,
  frequencyHz: BFS.referenceHz,
  contact: true,
  phaseCycles: 0,
};
export type BfsView = 'object' | 'weight' | 'route' | 'wave' | 'cell' | 'estimate' | 'compare';
export type BfsImpedance = {
  resistance: number;
  reactance: number;
  magnitude: number;
  phaseRad: number;
  phaseDegrees: number;
  re: number;
  ri: number;
  capacitorOhm: number;
  extracellularFraction: number;
  intracellularFraction: number;
};
export function bfsImpedance(frequencyHz: number, waterL: number = BFS.waterL): BfsImpedance {
  if (
    !Number.isFinite(frequencyHz) ||
    frequencyHz < 1000 ||
    frequencyHz > 250000 ||
    !Number.isFinite(waterL) ||
    waterL < BFS.waterL - 3 ||
    waterL > BFS.waterL + 3
  )
    throw new RangeError('BIA teaching domain');
  // More ionic fluid lowers both resistive paths. Membrane capacitance is
  // held fixed, not inferred as a clinical indicator of cellular integrity.
  const ratio = BFS.waterL / waterL,
    re = BFS.extracellularOhm * ratio,
    ri = BFS.intracellularOhm * ratio;
  const capacitorOhm = 1 / (2 * Math.PI * frequencyHz * BFS.membraneF);
  const denominator = (re + ri) ** 2 + capacitorOhm ** 2;
  const resistance = (re * (ri * (re + ri) + capacitorOhm ** 2)) / denominator;
  const reactance = (-(re ** 2) * capacitorOhm) / denominator;
  const magnitude = Math.hypot(resistance, reactance),
    phaseRad = Math.atan2(reactance, resistance);
  // Branch magnitudes do not sum to the input magnitude: their phases differ.
  // These are complex-admittance magnitudes normalized only for line emphasis.
  const ye = 1 / re,
    yi = 1 / Math.hypot(ri, capacitorOhm);
  return {
    resistance,
    reactance,
    magnitude,
    phaseRad,
    phaseDegrees: (phaseRad * 180) / Math.PI,
    re,
    ri,
    capacitorOhm,
    extracellularFraction: ye / (ye + yi),
    intracellularFraction: yi / (ye + yi),
  };
}
const referenceR = bfsImpedance(BFS.referenceHz).resistance;
/** Chosen to reproduce this invented subject's reference water at 50 kHz.
 * This coefficient has no population validation or product provenance. */
export const BFS_TEACHING_K = (BFS.waterL * referenceR) / BFS.heightM ** 2;
export function bfsState(input: BfsInput = BFS_DEFAULT) {
  if (
    !Number.isFinite(input.waterDeltaL) ||
    input.waterDeltaL < -3 ||
    input.waterDeltaL > 3 ||
    !Number.isFinite(input.phaseCycles) ||
    input.phaseCycles < 0 ||
    input.phaseCycles > 6 ||
    typeof input.contact !== 'boolean'
  )
    throw new RangeError('BIA teaching input');
  const waterL = BFS.waterL + input.waterDeltaL,
    leanKg = BFS.dryLeanKg + waterL,
    massKg = leanKg + BFS.fatKg;
  const body = bfsImpedance(input.frequencyHz, waterL);
  const measured = input.contact ? body : null;
  const estimate =
    measured && input.frequencyHz === BFS.referenceHz
      ? (() => {
          const waterL = (BFS_TEACHING_K * BFS.heightM ** 2) / measured.resistance;
          const leanKg = waterL / BFS.hydrationAssumption,
            fatKg = massKg - leanKg;
          return { waterL, leanKg, fatKg, fatPercent: (fatKg / massKg) * 100 };
        })()
      : null;
  // The four corner reactions balance the force and its first moments.
  // Lifting the right foot shifts the centre of pressure onto the left foot.
  const centerX = input.contact ? 0 : -0.82,
    centerZ = 0;
  const cells = ([-1, 1] as const).flatMap((sx) =>
    ([-1, 1] as const).map((sz) => {
      const fraction = ((1 + (sx * centerX) / 1.42) * (1 + (sz * centerZ) / 1.1)) / 4;
      const forceN = massKg * BFS.gravity * fraction,
        strain = forceN * BFS.strainPerNewton;
      const bridgeV = BFS.bridgeExcitationV * BFS.gaugeFactor * strain;
      return {
        x: sx * 1.42,
        z: sz * 1.1,
        forceN,
        strain,
        bridgeV,
        resistancePlus: 1000 * (1 + BFS.gaugeFactor * strain),
        resistanceMinus: 1000 * (1 - BFS.gaugeFactor * strain),
      };
    }),
  );
  const currentRmsA = input.contact ? BFS.currentRmsA : 0,
    voltageRmsV = currentRmsA * body.magnitude;
  const phase = 2 * Math.PI * input.phaseCycles;
  return {
    ...input,
    waterL,
    leanKg,
    massKg,
    fatKg: BFS.fatKg,
    trueFatPercent: (BFS.fatKg / massKg) * 100,
    body,
    measured,
    estimate,
    cells,
    currentRmsA,
    voltageRmsV,
    currentA: Math.SQRT2 * currentRmsA * Math.sin(phase),
    voltageV: Math.SQRT2 * voltageRmsV * Math.sin(phase + body.phaseRad),
    status: !input.contact
      ? ('open' as const)
      : input.frequencyHz !== BFS.referenceHz
        ? ('frequency' as const)
        : ('valid' as const),
  };
}
export type BfsState = ReturnType<typeof bfsState>;
const smooth = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
export function bfsShot(chapter: number, progress: number) {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter > 6 || !Number.isFinite(progress))
    throw new RangeError('BIA chapter');
  const p = Math.max(0, Math.min(1, progress));
  const view: BfsView = (
    ['object', 'weight', 'route', 'wave', 'cell', 'estimate', 'compare'] as const
  )[chapter];
  const waterDeltaL = chapter === 6 ? -3 + 6 * smooth(p) : 0;
  const frequencyHz = chapter === 4 ? 2000 * 100 ** smooth(p) : BFS.referenceHz;
  const input: BfsInput = {
    waterDeltaL,
    frequencyHz,
    contact: true,
    phaseCycles: p * (chapter === 2 ? 4 : 2),
  };
  const state = bfsState(input);
  const loadFraction = chapter === 1 ? smooth(Math.min(1, p * 1.7)) : 1;
  const cells = state.cells.map((c) => {
    const forceN = c.forceN * loadFraction,
      strain = forceN * BFS.strainPerNewton;
    return {
      ...c,
      forceN,
      strain,
      bridgeV: BFS.bridgeExcitationV * BFS.gaugeFactor * strain,
      resistancePlus: 1000 * (1 + BFS.gaugeFactor * strain),
      resistanceMinus: 1000 * (1 - BFS.gaugeFactor * strain),
    };
  });
  return {
    ...state,
    cells,
    loadFraction,
    view,
    reveal: smooth(p) * 4,
    explode: 0,
    routeReveal: chapter === 2 ? smooth(p) : 1,
    progress: p,
  };
}
export type BfsShot = ReturnType<typeof bfsShot>;
export function bfsWave(state: BfsState, sample: number) {
  const phase = sample * 4 * Math.PI;
  return {
    currentMicroA: Math.SQRT2 * state.currentRmsA * Math.sin(phase) * 1e6,
    voltageMilliV: Math.SQRT2 * state.voltageRmsV * Math.sin(phase + state.body.phaseRad) * 1000,
  };
}
