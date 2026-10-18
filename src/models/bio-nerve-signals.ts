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
