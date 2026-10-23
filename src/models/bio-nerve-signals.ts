export const nerveClamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
/** The chapter boundary lies between the two electrodes, so the pulse never restarts. */
export function nerveRecordingTime(chapter: number, progress: number) {
  const p = nerveClamp(progress);
  return chapter === 0 ? p * 2.25 : 2.25 + p * 3.75;
}
/** A translated, explicitly schematic pulse: position in mm, time in ms,
 * speed in mm/ms. It illustrates an electrode difference, not a measured CAP. */
export function nerveSurface(timeMs: number, speed = 20, separation = 20, reverse = false) {
  const t = nerveClamp(timeMs, 0, 8),
    v = nerveClamp(speed, 5, 40),
    a = 35,
    b = a + nerveClamp(separation, 0, 45);
  const center = reverse ? 120 - v * t : v * t;
  const outside = (x: number) => -12 * Math.exp(-(((x - center) / 6) ** 2));
  const membrane = (x: number) =>
    -70 +
    100 * Math.exp(-(((x - center) / 6) ** 2)) -
    12 * Math.exp(-(((x - center + (reverse ? -10 : 10)) / 8) ** 2));
  return {
    timeMs: t,
    speed: v,
    a,
    b,
    center,
    atA: outside(a),
    atB: outside(b),
    difference: outside(a) - outside(b),
    outside,
    membrane,
    sodiumEntry: (x: number) => Math.exp(-(((x - center - (reverse ? -3 : 3)) / 5) ** 2)),
    potassiumExit: (x: number) => Math.exp(-(((x - center + (reverse ? -6 : 6)) / 7) ** 2)),
  };
}
/** A fixed cohort of 18 identity markers. Positions share the renderer's membrane
 * geometry; marker clearance is opacity loss in the cleft, never entry into the cell.
 * Timing and concentration are schematic rather than a measured quantal release. */
export const synapseGeometry = { presynapticY: 165, receptorY: 205, vesicleRadius: 13 };
export function synapseState(progress: number, release = true, receptor = true) {
  const p = nerveClamp(progress);
  const docking = nerveClamp(p / 0.18);
  const fusion = release ? nerveClamp((p - 0.18) / 0.07) : 0;
  const cy = 80 + docking * 72 + fusion * 5;
  const poreHalfWidth = Math.sqrt(Math.max(0, 13 ** 2 - (165 - cy) ** 2));
  const vesicles = [0.3, 0.5, 0.7].map((x, id) => ({
    id,
    x,
    y: cy,
    poreHalfWidth,
    fused: fusion > 0,
  }));
  const molecules = Array.from({ length: 18 }, (_, id) => {
    const vesicle = Math.floor(id / 6),
      slot = id % 6,
      cx = vesicles[vesicle].x;
    const angle = (slot * Math.PI) / 3;
    const startOffset = Math.cos(angle) * 5;
    const startY = cy + Math.sin(angle) * 5;
    const leaveAt = 0.26 + slot * 0.012 + vesicle * 0.008;
    const travel = release ? nerveClamp((p - leaveAt) / 0.19) : 0;
    const exit = nerveClamp(travel / 0.3),
      cleft = nerveClamp((travel - 0.3) / 0.7);
    // First gather through the actual pore; only then spread toward extracellular receptors.
    const offset = travel < 0.3 ? startOffset * (1 - exit) : Math.cos(angle) * 6 * cleft;
    const y =
      travel < 0.3
        ? startY + (171 - startY) * exit
        : 171 + (205 - Math.abs(Math.sin(angle)) * 4 - 171) * cleft;
    const arrivedAt = leaveAt + 0.19;
    const opacity = release && p > arrivedAt ? Math.exp(-(p - arrivedAt) / 0.15) : 1;
    const stage = travel === 0 ? 'vesicle' : travel < 1 ? 'cleft' : receptor ? 'bound' : 'cleft';
    return { id, vesicle, x: cx, offset, y, opacity, stage, arrived: travel === 1 };
  });
  const amount = molecules.reduce((n, m) => n + (m.stage !== 'vesicle' ? m.opacity : 0), 0) / 18;
  const atReceptor = molecules.reduce((n, m) => n + (m.arrived ? m.opacity : 0), 0) / 18;
  const bound = receptor ? atReceptor / (0.35 + atReceptor) : 0;
  return {
    time: p * 12,
    amount,
    atReceptor,
    bound,
    voltage: -70 + 20 * bound,
    vesicleProgress: docking,
    diffusionProgress: nerveClamp((p - 0.26) / 0.27),
    vesicles,
    molecules,
  };
}
export type BioelectricCondition = 'metal' | 'tissue' | 'broken';
export function bioelectricEvidence(condition: BioelectricCondition, progress: number) {
  const connected = condition !== 'broken',
    p = nerveClamp(progress);
  return {
    connected,
    metal: condition === 'metal',
    tissueSource: condition === 'tissue',
    contraction: connected ? Math.sin(Math.PI * nerveClamp((p - 0.15) / 0.7)) ** 2 : 0,
    inference:
      condition === 'metal'
        ? 'ambiguous'
        : condition === 'tissue'
          ? 'metal-not-required'
          : 'path-required',
  };
}

const smoothGate = (x: number) => {
  const p = nerveClamp(x);
  return p * p * (3 - 2 * p);
};
export type MembraneOptions = { sodium?: boolean; potassium?: boolean; capacitance?: number };
/** Local teaching patch, modern V_inside - V_outside convention.
 * Prescribed conductance timing, NOT voltage-dependent HH gating or a propagation model.
 * g: mS/cm²; C: µF/cm²; V: mV; t: ms; integrated inward/outward charge: nC/cm².
 * Reservoir gradients are held fixed over this short interval (ENa=+60, EK=-90).
 * Basal 0.06/0.39 conductances balance at -70mV. No pump reset is used. */
export function membraneConductances(timeMs: number, options: MembraneOptions = {}) {
  const t = nerveClamp(timeMs, 0, 6);
  const sodiumGate = smoothGate((t - 0.6) / 0.25) * (1 - smoothGate((t - 1.25) / 0.35));
  const potassiumGate = smoothGate((t - 1.4) / 0.4) * (1 - smoothGate((t - 2.7) / 0.7));
  return {
    sodiumGate: options.sodium === false ? 0 : sodiumGate,
    potassiumGate: options.potassium === false ? 0 : potassiumGate,
    sodium: options.sodium === false ? 0 : 0.06 + 3.6 * sodiumGate,
    potassium: options.potassium === false ? 0 : 0.39 + 1.6 * potassiumGate,
  };
}
/** Exact linear update while conductances are held constant over one small interval.
 * Both charge integrals use the same exact mean voltage. */
export function membraneChargeStep(
  voltage: number,
  dt: number,
  sodium: number,
  potassium: number,
  capacitance = 1,
) {
  const v = nerveClamp(voltage, -200, 200),
    h = nerveClamp(dt, 0, 6),
    na = nerveClamp(sodium, 0, 20),
    k = nerveClamp(potassium, 0, 20),
    c = nerveClamp(capacitance, 0.5, 2),
    g = na + k;
  if (!g || !h) return { voltage: v, sodiumIn: 0, potassiumOut: 0 };
  const equilibrium = (na * 60 - k * 90) / g;
  const a = (g * h) / c,
    decay = Math.exp(-a),
    factor = a === 0 ? 1 : -Math.expm1(-a) / a;
  const mean = equilibrium + (v - equilibrium) * factor;
  return {
    voltage: equilibrium + (v - equilibrium) * decay,
    sodiumIn: na * (60 - mean) * h,
    potassiumOut: k * (mean + 90) * h,
  };
}
export function membraneCharge(timeMs: number, options: MembraneOptions = {}) {
  const t = nerveClamp(timeMs, 0, 6),
    capacitance = nerveClamp(options.capacitance ?? 1, 0.5, 2);
  let voltage = -70,
    sodiumIn = 0,
    potassiumOut = 0;
  const steps = Math.ceil(t / 0.002);
  for (let i = 0; i < steps; i++) {
    const start = i * 0.002,
      dt = Math.min(0.002, t - start),
      g = membraneConductances(start + dt / 2, options);
    const next = membraneChargeStep(voltage, dt, g.sodium, g.potassium, capacitance);
    sodiumIn += next.sodiumIn;
    potassiumOut += next.potassiumOut;
    // Voltage is reconstructed from the conserved cumulative charge, not a preset wave.
    voltage = -70 + (sodiumIn - potassiumOut) / capacitance;
  }
  const g = membraneConductances(t, options),
    deltaCharge = sodiumIn - potassiumOut;
  return {
    timeMs: t,
    voltage,
    capacitance,
    sodiumIn,
    potassiumOut,
    deltaCharge,
    insideCharge: -70 * capacitance + deltaCharge,
    outsideCharge: 70 * capacitance - deltaCharge,
    sodiumCurrent: g.sodium * (60 - voltage),
    potassiumCurrent: g.potassium * (voltage + 90),
    ...g,
  };
}
/** Two selected identity markers sampled from the charge histories, NOT the entire ionic population.
 * The bounded transit is explanatory geometry, not measured microscopic trajectories.
 * A marker crosses only its own membrane channel; the charge ledger includes many unshown ions. */
export function membraneMarkers(state: ReturnType<typeof membraneCharge>, width: number) {
  const w = nerveClamp(width, 240, 900),
    na = nerveClamp((state.sodiumIn - 20) / 100),
    k = nerveClamp((state.potassiumOut - 30) / 130);
  return [
    { id: 'Na-selected', species: 'Na', x: w * 0.32, y: 54 + 114 * na, progress: na },
    { id: 'K-selected', species: 'K', x: w * 0.68, y: 168 - 114 * k, progress: k },
  ];
}
/** Independent capacitor benchmark for a spherical cell; fraction relative to one selected
 * monovalent intracellular reservoir, not total ionic current per action potential. */
export function capacitiveIonFraction(
  radiusMicrometres = 10,
  concentrationMillimolar = 150,
  deltaMillivolts = 100,
) {
  const r = nerveClamp(radiusMicrometres, 1, 1000) * 1e-6,
    concentration = nerveClamp(concentrationMillimolar, 1, 1000),
    dv = nerveClamp(deltaMillivolts, 0, 200) / 1000;
  const area = 4 * Math.PI * r * r,
    volume = (4 * Math.PI * r ** 3) / 3;
  const capacitance = 0.01 * area,
    charge = capacitance * dv;
  const transferredMoles = charge / 96485.33212,
    reservoirMoles = concentration * volume;
  return {
    chargeCoulomb: charge,
    capacitanceFarad: capacitance,
    transferredMoles,
    reservoirMoles,
    fraction: transferredMoles / reservoirMoles,
  };
}

export function nerveDirector(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const t = nerveClamp(time, 0, 22),
    en = locale === 'en',
    lerp = (a: number, b: number, start: number, end: number) =>
      a + (b - a) * nerveClamp((t - start) / (end - start));
  let surfaceTime = 0,
    membraneTime = 0,
    synapseProgress = 0;
  if (chapter === 0)
    surfaceTime = t < 14 ? lerp(0, 1.75, 7.4, en ? 9.7 : 10.8) : lerp(1.75, 2.25, 18.5, 22);
  if (chapter === 1) surfaceTime = t < 8.5 ? lerp(2.25, 2.75, 1.2, 4.2) : lerp(2.75, 6, 8.5, 12.2);
  if (chapter === 2)
    membraneTime =
      t < (en ? 9.4 : 10.2)
        ? lerp(0, 1.4, en ? 3.7 : 4.5, en ? 8.3 : 9.3)
        : lerp(1.4, 6, en ? 9.4 : 10.2, en ? 11.5 : 13.1);
  if (chapter === 3)
    synapseProgress = t < 6.5 ? lerp(0, 0.28, 2, 6.5) : lerp(0.28, 0.48, 6.5, 10.7);
  if (chapter === 4)
    synapseProgress =
      t < (en ? 7.6 : 9.7) ? lerp(0.48, 0.95, en ? 5.1 : 6.4, en ? 7.3 : 9.3) : 0.48;
  const receptorCounterexample = chapter === 4 && t >= (en ? 12.5 : 14);
  const releaseCounterexample = chapter === 4 && t >= (en ? 7.6 : 9.7) && !receptorCounterexample;
  const history: BioelectricCondition =
    chapter === 5 ? 'metal' : t < (en ? 9.8 : 11.6) ? 'tissue' : 'broken';
  const historicalProgress = chapter === 5 ? lerp(0.15, 0.5, 2.4, 5.5) : lerp(0.15, 0.5, 4.8, 6.4);
  return {
    surfaceTime,
    membraneTime,
    synapseProgress,
    receptorCounterexample,
    releaseCounterexample,
    history,
    historicalProgress,
  };
}
