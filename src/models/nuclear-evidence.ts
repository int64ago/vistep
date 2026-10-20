export const nuclearClamp = (v: number, lo: number, hi: number, fallback = lo) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : fallback));
const unit = (v: number) => nuclearClamp(v, 0, 1);
export type NuclearMode = 'nitrogen' | 'neutron' | 'fission' | 'tracks' | 'chain';
export type NuclearView =
  | 'apparatus'
  | 'balance'
  | 'collision'
  | 'inference'
  | 'chemistry'
  | 'channel'
  | 'emulsion'
  | 'momentum'
  | 'routes'
  | 'generations';
/** Nonrelativistic teaching kinematics: masses in u, kinetic energies in MeV,
 * momentum in sqrt(u MeV). Q includes rest-energy change; exact mass defects are not reconstructed. */
export function nitrogenReaction(angleDegrees: number, alphaEnergy = 7.7) {
  const a = (nuclearClamp(angleDegrees, 0, 160) * Math.PI) / 180,
    ea = nuclearClamp(alphaEnergy, 2, 10),
    q = -1.191,
    pi = Math.sqrt(8 * ea);
  const A = 0.5 + 0.5 / 17,
    B = (-pi * Math.cos(a)) / 17,
    C = (pi * pi) / 34 - ea - q;
  const p = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A),
    proton = { x: p * Math.cos(a), y: p * Math.sin(a) },
    oxygen = { x: pi - proton.x, y: -proton.y };
  return {
    proton,
    oxygen,
    incoming: pi,
    protonEnergy: (p * p) / 2,
    oxygenEnergy: (oxygen.x ** 2 + oxygen.y ** 2) / 34,
    q,
    alphaEnergy: ea,
  };
}
/** Elastic head-on collision against a stationary target. Signed velocities retain recoil direction. */
export function recoilCollision(projectileMass = 1, targetMass = 1, incidentSpeed = 1) {
  const m = nuclearClamp(projectileMass, 0.05, 10, 1),
    M = nuclearClamp(targetMass, 1, 40, 1),
    u = nuclearClamp(incidentSpeed, 0, 1e8, 1);
  const projectileSpeed = ((m - M) / (m + M)) * u,
    targetSpeed = ((2 * m) / (m + M)) * u,
    fraction = (4 * m * M) / (m + M) ** 2;
  return {
    projectileMass: m,
    targetMass: M,
    incidentSpeed: u,
    projectileSpeed,
    targetSpeed,
    fraction,
    initialMomentum: m * u,
    finalMomentum: m * projectileSpeed + M * targetSpeed,
    initialEnergy: 0.5 * m * u * u,
    finalEnergy: 0.5 * m * projectileSpeed ** 2 + 0.5 * M * targetSpeed ** 2,
  };
}
export function neutronRecoil(targetMass: number, energyMeV = 5) {
  const s = recoilCollision(1, targetMass);
  return { fraction: s.fraction, maximumEnergy: s.fraction * nuclearClamp(energyMeV, 0.1, 10, 5) };
}
/** Ratio removes unknown common incident speed. Physical inference requires 1<UH/UN<14. */
export function recoilMass(hydrogenSpeed: number, nitrogenSpeed: number) {
  if (
    !Number.isFinite(hydrogenSpeed) ||
    !Number.isFinite(nitrogenSpeed) ||
    hydrogenSpeed <= 0 ||
    nitrogenSpeed <= 0
  )
    return null;
  const ratio = hydrogenSpeed / nitrogenSpeed;
  if (!(ratio > 1 && ratio < 14)) return null;
  const mass = (14 - ratio) / (ratio - 1),
    incidentSpeed = (hydrogenSpeed * (mass + 1)) / (2 * mass);
  return Number.isFinite(incidentSpeed) ? { ratio, mass, incidentSpeed } : null;
}
export function recoilCandidate(mass: number, hydrogenSpeed: number) {
  const m = nuclearClamp(mass, 0.05, 10, 1),
    uH = nuclearClamp(hydrogenSpeed, 0, 1e8, 3.3e7),
    incidentSpeed = (uH * (m + 1)) / (2 * m);
  return {
    mass: m,
    hydrogen: uH,
    nitrogen: (uH * (m + 1)) / (m + 14),
    helium: (uH * (m + 1)) / (m + 4),
    incidentSpeed,
  };
}
/** Selected channel printed in PEP elective3 pp119–120. No yield or energy is inferred from this ledger. */
export function fissionBalance() {
  return {
    input: [
      { a: 235, z: 92 },
      { a: 1, z: 0 },
    ],
    output: [
      { a: 144, z: 56 },
      { a: 89, z: 36 },
      { a: 1, z: 0 },
      { a: 1, z: 0 },
      { a: 1, z: 0 },
    ],
  };
}
export function missingFragment(bariumA = 144, neutrons = 3) {
  const a = nuclearClamp(Math.round(bariumA), 130, 150, 144),
    n = nuclearClamp(Math.round(neutrons), 0, 6, 3);
  return { a: 236 - a - n, z: 92 - 56, bariumA: a, neutrons: n };
}
/** Projected momentum examples: arbitrary momentum scale; mass labels only control illustrative speed.
 * These are not original emulsion photographs, nuclide assignments, ranges or probabilities. */
export function fragmentEvent(count: 3 | 4) {
  return count === 3
    ? [
        { x: 1, y: 0, mass: 110 },
        { x: -1.15, y: -0.4, mass: 122 },
        { x: 0.15, y: 0.4, mass: 4 },
      ]
    : [
        { x: 1, y: 0, mass: 110 },
        { x: -1, y: 0, mass: 118 },
        { x: 0.15, y: 0.4, mass: 4 },
        { x: -0.15, y: -0.4, mass: 4 },
      ];
}
export function emulsionTracks(count: 3 | 4, unrelated = false) {
  return fragmentEvent(count).map((p, i) => ({
    id: `fragment-${i}`,
    px: p.x,
    py: p.y,
    mass: p.mass,
    origin: { x: 0, y: 0, z: unrelated && i === count - 1 ? 1 : 0 },
    direction: Math.atan2(p.y, p.x),
    range: p.mass > 10 ? 1 : 0.84,
    charged: true,
  }));
}
/** Schematic depth focus, not an optical PSF or calibrated emulsion thickness. */
export function trackFocus(z: number, focus: number) {
  const dz = nuclearClamp(z, -2, 2) - nuclearClamp(focus, -2, 2);
  return 0.09 + 0.91 / (1 + (dz / 0.18) ** 4);
}
export function chainExpectation(k: number, generation: number, initial = 32) {
  return (
    nuclearClamp(initial, 0, 1e6, 32) * nuclearClamp(k, 0, 3, 1) ** nuclearClamp(generation, 0, 12)
  );
}
/** Abstract losses per emitted neutron; no geometry, material inventory or reactor parameters. */
export function chainAccount(escape = 0.2, absorb = 0.4) {
  const e = unit(escape),
    a = Math.min(1 - e, unit(absorb)),
    f = 1 - e - a;
  return { escape: e, absorb: a, fission: f, multiplicity: 3, k: 3 * f };
}
export function chainEvent(escape: number, absorb: number, progress: number) {
  const account = chainAccount(escape, absorb),
    p = unit(progress),
    seeds = [0.12, 0.48, 0.84];
  return seeds.map((u, i) => ({
    id: `n-${i}`,
    quantile: u,
    fate:
      u < account.escape ? 'escape' : u < account.escape + account.absorb ? 'absorb' : 'fission',
    progress: p,
    children: p === 1 && u >= account.escape + account.absorb ? [`${i}.0`, `${i}.1`, `${i}.2`] : [],
  }));
}
export type NuclearShot = {
  mode: NuclearMode;
  view: NuclearView;
  progress: number;
  angle: number;
  target: number;
  candidateMass: number;
  record: 'textbook' | 'chadwick';
  reveal: boolean;
  count: 3 | 4;
  unrelated: boolean;
  focus: number;
  escape: number;
  absorb: number;
  generation: number;
  stage: number;
};
export function nuclearVariant(variant: string): NuclearMode {
  return variant.includes('chadwick')
    ? 'neutron'
    : variant.includes('multifragment')
      ? 'tracks'
      : variant.includes('chain')
        ? 'chain'
        : variant.includes('fission')
          ? 'fission'
          : 'nitrogen';
}
/** Cue-local cuts from independent bilingual ASR, including the 0.45 s lead-in.
 * These drive explanatory views, not physical flight times. Immutable records remain independent. */
export const NUCLEAR_CUTS = {
  zh: {
    flash: 3.7,
    reaction: 18.03,
    balance: 7.69,
    angle: 20.49,
    wax: 5.07,
    recoil: 7.63,
    ionization: 9.47,
    heavy: 1.43,
    similar: 8.15,
    inference: 11.95,
    fit: 14.05,
    upper: 17.01,
    separation: 4.27,
    barium: 6.25,
    model: 17.87,
    capture: 3.81,
    split: 5.37,
    emitted: 8.75,
    unknown: 9.23,
    answer: 14.07,
    depth: 15.65,
    refocus: 17.77,
    polygon: 9.11,
    generations: 5.77,
    below: 12.35,
    controlled: 7.03,
    equal: 9.87,
    histories: 16.91,
  },
  en: {
    flash: 3.59,
    reaction: 14.81,
    balance: 8.09,
    angle: 20.75,
    wax: 4.75,
    recoil: 7.29,
    ionization: 9.19,
    heavy: 1.21,
    similar: 8.79,
    inference: 12.17,
    fit: 15.35,
    upper: 17.51,
    separation: 1.61,
    barium: 5.95,
    model: 16.65,
    capture: 3.27,
    split: 4.85,
    emitted: 9.15,
    unknown: 9.43,
    answer: 13.61,
    depth: 15.91,
    refocus: 17.83,
    polygon: 6.41,
    generations: 4.67,
    below: 11.75,
    controlled: 4.21,
    equal: 7.33,
    histories: 13.95,
  },
} as const;
export function nuclearDirector(
  chapter: number,
  progress: number,
  time?: number,
  locale: 'zh' | 'en' = 'zh',
): NuclearShot {
  const c = nuclearClamp(Math.floor(chapter), 0, 9),
    t = time === undefined ? unit(progress) * 28 : nuclearClamp(time, 0, 600),
    p = unit(t / 28),
    k = NUCLEAR_CUTS[locale],
    travel = (start: number, end: number) => unit((t - start) / (end - start));
  const s: NuclearShot = {
    mode: 'nitrogen',
    view: 'apparatus',
    progress: p,
    angle: 40,
    target: 1,
    candidateMass: 1,
    record: 'textbook',
    reveal: true,
    count: 3,
    unrelated: false,
    focus: 0,
    escape: 0.2,
    absorb: 0.4,
    generation: 8,
    stage: 0,
  };
  if (c === 0) {
    s.stage = t < k.flash ? 0 : t < k.reaction ? 1 : 2;
    s.progress = travel(0.45, k.flash);
  }
  if (c === 1) {
    s.view = 'balance';
    s.stage = t < k.balance ? 0 : t < k.angle ? 1 : 2;
    // One continuous angle change; both product momenta come from the same event.
    s.angle = 40 + 60 * travel(k.angle, k.angle + 1.8);
  }
  if (c === 2) {
    s.mode = 'neutron';
    s.stage = t < k.wax ? 0 : t < k.ionization ? 1 : 2;
    // Neutral packet reaches the paraffin as the recoil is named, then the charged recoil reaches the detector.
    s.progress =
      t < k.recoil
        ? 0.45 * travel(k.wax, k.recoil)
        : 0.45 + 0.55 * travel(k.recoil, k.ionization + 0.5);
  }
  if (c === 3) {
    s.mode = 'neutron';
    const late = t >= 23.0;
    s.view = (t >= k.inference && t < k.upper) || late ? 'inference' : 'collision';
    s.target = t < k.heavy || (t >= k.similar && t < k.inference) ? 1 : 14;
    s.progress =
      t < k.heavy
        ? travel(0, k.heavy)
        : t < k.similar
          ? travel(k.heavy, k.heavy + 3.2)
          : t < k.inference
            ? travel(k.similar, k.similar + 2.2)
            : 1;
    s.candidateMass = s.view === 'inference' && t < k.fit ? 0.5 : 1;
    // Fixed H/N inputs and mass inference precede the explicitly spoken upper-bound bars.
    // The final silent hold asks for a new He target before revealing the prediction.
    s.stage = late ? 2 : t < k.fit ? 0 : 1;
    s.reveal = late && t >= 26.0;
  }
  if (c === 4) {
    s.mode = 'fission';
    s.view = t < k.model ? 'chemistry' : 'channel';
    s.stage = t < k.separation ? 0 : t < k.barium ? 1 : 2;
    s.reveal = t < k.model && t >= k.barium;
    s.progress = travel(k.model, k.model + 5.5);
  }
  if (c === 5) {
    s.mode = 'fission';
    s.view = 'channel';
    s.progress =
      t < k.capture
        ? 0.2 * travel(0.45, k.capture)
        : t < k.split
          ? 0.2 + 0.3 * travel(k.capture, k.split)
          : 0.5 + 0.5 * travel(k.split, k.emitted);
    s.stage = t < k.unknown ? 0 : t < k.answer ? 1 : 2;
    s.reveal = t >= k.answer;
  }
  if (c === 6 || c === 7) {
    s.mode = 'tracks';
    s.count = c === 6 ? 3 : 4;
    s.view = c === 7 && t >= k.polygon ? 'momentum' : 'emulsion';
    s.unrelated = c === 6 && t >= k.depth;
    s.focus = c === 6 ? travel(k.depth, k.refocus) : 0;
    s.progress = travel(0.45, c === 6 ? 4.2 : 2.6);
    s.stage = s.unrelated || s.view === 'momentum' ? 1 : 0;
  }
  if (c === 8) {
    s.mode = 'chain';
    s.view = t < k.generations ? 'routes' : 'generations';
    s.progress = travel(0.45, locale === 'zh' ? 3.29 : 2.55);
    s.absorb = t < k.below ? 0.4 : 0.55;
    s.stage = t < k.generations ? 0 : t < k.below ? 1 : 2;
  }
  if (c === 9) {
    s.mode = 'chain';
    s.view = t < k.controlled || t >= k.histories ? 'routes' : 'generations';
    s.progress = travel(0.45, 3.0);
    s.absorb = 7 / 15;
    s.stage = t < k.controlled ? 0 : t < k.equal ? 1 : 2;
    s.reveal = t >= k.equal;
  }
  return s;
}
