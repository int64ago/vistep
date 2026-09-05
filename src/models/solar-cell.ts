/** Single equivalent cell from the published pvlib CS5P-220M example (96 equal
 * series cells). Electrical parameters use De Soto temperature/irradiance rules.
 * The three-bin spectrum, optical fractions and slow carrier paths are declared
 * teaching models, calibrated to the published reference photocurrent.
 */
export type SolarCellConfig = {
  irradiance: number;
  temperature: number;
  resistance: number;
  mode: 'load' | 'open' | 'short';
  spectrum: 'sun' | 'mono';
  wavelength: number;
  collection: number;
  series: number;
};
export const solarCellDefaults: SolarCellConfig = {
  irradiance: 1000,
  temperature: 25,
  resistance: 0.1042,
  mode: 'load',
  spectrum: 'sun',
  wavelength: 800,
  collection: 1,
  series: 1,
};
export const solarCellReference = {
  cells: 96,
  area: 1.7 / 96,
  il: 5.114,
  i0: 8.196e-10,
  a: 2.6373 / 96,
  rs: 1.065 / 96,
  rsh: 381.68 / 96,
  alpha: 0.004539,
  kelvin: 298.15,
  eg: 1.121,
  kEV: 8.617333262145e-5,
  q: 1.602176634e-19,
  hc: 1239.841984332,
  reflection: 0.04,
  absorption: 0.9,
};
export const solarCellClamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function validateSolarCell(c: SolarCellConfig) {
  if (
    ![c.irradiance, c.temperature, c.resistance, c.wavelength, c.collection, c.series].every(
      Number.isFinite,
    ) ||
    c.irradiance < 0 ||
    c.irradiance > 1200 ||
    c.temperature < -10 ||
    c.temperature > 75 ||
    c.resistance < 0 ||
    c.resistance > 10 ||
    c.wavelength < 350 ||
    c.wavelength > 1400 ||
    c.collection < 0.5 ||
    c.collection > 1 ||
    c.series < 0 ||
    c.series > 5 ||
    !['load', 'open', 'short'].includes(c.mode) ||
    !['sun', 'mono'].includes(c.spectrum)
  )
    throw new RangeError('Outside the supported single-cell domain');
}
export const solarCellBandgap = (temperature: number) =>
  solarCellReference.eg * (1 - 0.0002677 * (temperature - 25));
export const solarCellPhotonEnergy = (wavelength: number) => solarCellReference.hc / wavelength;
const sunBands = [
  { energy: 0.9, fraction: 0.22 },
  { energy: 1.55, fraction: 0.46 },
  { energy: 2.55, fraction: 0.32 },
];
const referenceGeneration =
  1000 *
  solarCellReference.area *
  (1 - solarCellReference.reflection) *
  solarCellReference.absorption *
  (0.46 / 1.55 + 0.32 / 2.55);
export function solarCellOptical(config: SolarCellConfig) {
  validateSolarCell(config);
  const incident = config.irradiance * solarCellReference.area,
    eg = solarCellBandgap(config.temperature);
  const bands = (
    config.spectrum === 'sun'
      ? sunBands
      : [{ energy: solarCellPhotonEnergy(config.wavelength), fraction: 1 }]
  ).map((b) => {
    const power = incident * b.fraction,
      reflected = power * solarCellReference.reflection;
    const absorbed = b.energy >= eg ? (power - reflected) * solarCellReference.absorption : 0;
    const generated = absorbed / b.energy;
    return {
      ...b,
      wavelength: solarCellReference.hc / b.energy,
      power,
      reflected,
      absorbed,
      transmitted: power - reflected - absorbed,
      generated,
      photonRate: power / (b.energy * solarCellReference.q),
      pairRate: generated / solarCellReference.q,
      thermalization: absorbed - generated * eg,
    };
  });
  const generated = bands.reduce((s, b) => s + b.generated, 0);
  const collectionEfficiency =
    ((solarCellReference.il + solarCellReference.alpha * (config.temperature - 25)) /
      referenceGeneration) *
    config.collection;
  return {
    incident,
    eg,
    bands,
    generated,
    collectionEfficiency,
    reflected: bands.reduce((s, b) => s + b.reflected, 0),
    transmitted: bands.reduce((s, b) => s + b.transmitted, 0),
    absorbed: bands.reduce((s, b) => s + b.absorbed, 0),
    thermalization: bands.reduce((s, b) => s + b.thermalization, 0),
    il: generated * collectionEfficiency,
  };
}
export function solarCellParameters(config: SolarCellConfig) {
  const optical = solarCellOptical(config),
    temperature = config.temperature + 273.15,
    ref = solarCellReference;
  return {
    il: optical.il,
    i0:
      ref.i0 *
      (temperature / ref.kelvin) ** 3 *
      Math.exp((ref.eg / ref.kelvin - optical.eg / temperature) / ref.kEV),
    a: (ref.a * temperature) / ref.kelvin,
    rs: ref.rs * config.series,
    rsh: config.irradiance === 0 ? Infinity : (ref.rsh * 1000) / config.irradiance,
    optical,
    temperature,
  };
}
export type SolarCellParameters = ReturnType<typeof solarCellParameters>;
/** Junction voltage U parameterizes the implicit terminal relation without
 * hand-shifting an I–V curve. KCL holds at every solved point. */
export function solarCellAtJunction(p: SolarCellParameters, u: number) {
  if (!Number.isFinite(u) || u < 0 || u > 2) throw new RangeError('Unsupported junction voltage');
  const diode = p.i0 * Math.expm1(u / p.a),
    shunt = u / p.rsh;
  const current = p.il - diode - shunt,
    voltage = u - current * p.rs;
  return {
    u,
    current,
    voltage,
    diode,
    shunt,
    power: voltage * current,
    seriesLoss: current * current * p.rs,
  };
}
function bisect(f: (x: number) => number, lo: number, hi: number) {
  if (f(lo) === 0) return lo;
  if (f(hi) === 0) return hi;
  if (f(lo) > 0 || f(hi) < 0) throw new RangeError('Root must be bracketed');
  for (let k = 0; k < 70; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
export function solarCellOpenVoltage(p: SolarCellParameters) {
  if (p.il === 0) return 0;
  // The no-shunt analytical root is a rigorous upper bound on Uoc.
  const upper = p.a * Math.log1p(p.il / p.i0);
  return bisect((u) => -solarCellAtJunction(p, u).current, 0, upper * (1 + 1e-12));
}
export function solarCellAtVoltage(p: SolarCellParameters, voltage: number) {
  if (!Number.isFinite(voltage) || voltage < 0 || voltage > 1)
    throw new RangeError('Voltage outside supported forward range');
  if (p.rs === 0) return { ...solarCellAtJunction(p, voltage), voltage };
  const upper = Math.min(2, voltage + p.rs * p.il + 1e-12);
  const u = bisect((u) => solarCellAtJunction(p, u).voltage - voltage, 0, upper);
  const point = solarCellAtJunction(p, u);
  return { ...point, voltage, power: voltage * point.current };
}
export function solarCellOperating(config: SolarCellConfig, p = solarCellParameters(config)) {
  const uoc = solarCellOpenVoltage(p);
  if (p.il === 0) return { ...solarCellAtJunction(p, 0), current: 0, voltage: 0, power: 0 };
  if (config.mode === 'open')
    return { ...solarCellAtJunction(p, uoc), current: 0, voltage: uoc, power: 0, seriesLoss: 0 };
  const load = config.mode === 'short' ? 0 : config.resistance;
  const u = bisect((u) => u - (load + p.rs) * solarCellAtJunction(p, u).current, 0, uoc);
  const point = solarCellAtJunction(p, u),
    voltage = load * point.current;
  return { ...point, voltage, power: voltage * point.current };
}
export function solarCellMaximum(p: SolarCellParameters) {
  if (p.il === 0) return { ...solarCellAtJunction(p, 0), resistance: 0 };
  const voc = solarCellOpenVoltage(p),
    start = solarCellAtVoltage(p, 0).u;
  let lo = start,
    hi = voc;
  const ratio = (Math.sqrt(5) - 1) / 2;
  let a = hi - ratio * (hi - lo),
    b = lo + ratio * (hi - lo);
  for (let i = 0; i < 65; i++) {
    if (solarCellAtJunction(p, a).power > solarCellAtJunction(p, b).power) {
      hi = b;
      b = a;
      a = hi - ratio * (hi - lo);
    } else {
      lo = a;
      a = b;
      b = lo + ratio * (hi - lo);
    }
  }
  const point = solarCellAtJunction(p, (lo + hi) / 2);
  return { ...point, resistance: point.voltage / point.current };
}
export function solarCellCurve(p: SolarCellParameters, count = 121) {
  if (!Number.isInteger(count) || count < 2 || count > 500)
    throw new RangeError('Invalid curve sample count');
  const voc = solarCellOpenVoltage(p),
    usc = solarCellAtVoltage(p, 0).u;
  return Array.from({ length: count }, (_, i) => {
    if (p.il === 0) return { ...solarCellAtJunction(p, 0), current: 0, voltage: 0, power: 0 };
    const point = solarCellAtJunction(p, usc + ((voc - usc) * i) / (count - 1));
    return { ...point, voltage: Math.max(0, point.voltage), current: Math.max(0, point.current) };
  });
}
export function solarCellBudget(config: SolarCellConfig) {
  const p = solarCellParameters(config),
    point = solarCellOperating(config, p),
    o = p.optical;
  // A complete steady-state energy ledger. Voltage deficit is a lumped residual
  // of band-edge energy versus junction free energy, NOT a measured heat map.
  const items = {
    reflection: o.reflected,
    transmission: o.transmitted,
    thermalization: o.thermalization,
    collectionRecombination: (o.generated - p.il) * o.eg,
    voltageDeficit: (o.eg - point.u) * p.il,
    junctionRecombination: point.u * point.diode,
    shunt: point.u * point.shunt,
    series: point.seriesLoss,
    output: point.power,
  };
  return {
    p,
    point,
    items,
    incident: o.incident,
    total: Object.values(items).reduce((s, v) => s + v, 0),
    currentResidual: p.il - point.current - point.diode - point.shunt,
  };
}

export type SolarCellXY = { x: number; y: number };
export const solarCellGeometry = {
  source: { x: 0.17, y: -0.64 },
  absorption: { x: 0.38, y: 0.58 },
  front: { x: 0.9, y: 0 },
  rear: { x: 0.4, y: 0.97 },
  depletion: [0.2, 0.32] as const,
  external: [
    { x: 0.9, y: 0 },
    { x: 1.33, y: 0 },
    { x: 1.33, y: 0.35 },
    { x: 1.27, y: 0.4 },
    { x: 1.39, y: 0.45 },
    { x: 1.27, y: 0.5 },
    { x: 1.39, y: 0.55 },
    { x: 1.27, y: 0.6 },
    { x: 1.33, y: 0.65 },
    { x: 1.33, y: 1 },
    { x: 0.4, y: 1 },
    { x: 0.4, y: 0.97 },
  ],
};
export function solarCellAlong(path: SolarCellXY[], fraction: number) {
  if (path.length < 2 || !Number.isFinite(fraction)) throw new RangeError('Invalid carrier path');
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
  const total = lengths.reduce((s, v) => s + v, 0);
  let remaining = solarCellClamp(fraction, 0, 1) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] ? remaining / lengths[i] : 0;
      return {
        x: path[i].x + (path[i + 1].x - path[i].x) * q,
        y: path[i].y + (path[i + 1].y - path[i].y) * q,
      };
    }
    remaining -= lengths[i];
  }
  return path.at(-1)!;
}
/** One deliberately selected absorbed photon and its two identifiable carriers.
 * Paths are diffusion/drift/contact SCHEMATICS, not microscopic transport time.
 * Both charges appear together, remain present (including a waiting contact hole)
 * and disappear together only at their common recombination position.
 */
export function solarCellEpisode(progress: number, route: 'external' | 'recombine' = 'external') {
  const p = solarCellClamp(Number.isFinite(progress) ? progress : 0, 0, 1),
    g = solarCellGeometry;
  const photonPath = [g.source, g.absorption];
  const electronInternal = [
    g.absorption,
    { x: 0.44, y: 0.32 },
    { x: 0.44, y: 0.2 },
    { x: 0.75, y: 0.08 },
    g.front,
  ];
  const electronPath =
    route === 'external'
      ? [...electronInternal, ...g.external.slice(1)]
      : [g.absorption, { x: 0.44, y: 0.32 }, { x: 0.52, y: 0.43 }, { x: 0.49, y: 0.65 }];
  const holePath =
    route === 'external'
      ? [g.absorption, { x: 0.4, y: 0.85 }, g.rear]
      : [g.absorption, { x: 0.4, y: 0.8 }, { x: 0.49, y: 0.65 }];
  const carriers: { id: string; charge: number; position: SolarCellXY }[] = [];
  if (p >= 0.2 && p < 0.98) {
    let electron: SolarCellXY;
    if (route === 'external')
      electron =
        p < 0.52
          ? solarCellAlong(electronInternal, (p - 0.2) / 0.32)
          : solarCellAlong(g.external, (p - 0.52) / 0.46);
    else electron = solarCellAlong(electronPath, (p - 0.2) / 0.78);
    const hole = solarCellAlong(
      holePath,
      route === 'external' ? (p - 0.2) / 0.3 : (p - 0.2) / 0.78,
    );
    carriers.push(
      { id: 'selected-electron', charge: -1, position: electron },
      { id: 'selected-hole', charge: 1, position: hole },
    );
  }
  return {
    progress: p,
    route,
    photon: p < 0.2 ? solarCellAlong(photonPath, p / 0.2) : null,
    carriers,
    absorbed: p >= 0.2,
    complete: p >= 0.98,
    photonPath,
    electronPath,
    holePath,
    thermalizedEV: solarCellPhotonEnergy(800) - solarCellReference.eg,
  };
}
export function solarCellThreshold(energy: number, progress: number, temperature = 25) {
  if (!Number.isFinite(energy) || energy <= 0)
    throw new RangeError('Positive photon energy required');
  const p = solarCellClamp(progress, 0, 1),
    eg = solarCellBandgap(temperature),
    eligible = energy >= eg;
  return {
    energy,
    eg,
    eligible,
    progress: p,
    photon:
      p < 0.6
        ? { x: 0.5, y: -0.5 + (p / 0.6) * 0.8 }
        : eligible
          ? null
          : { x: 0.5, y: 0.3 + ((p - 0.6) / 0.4) * 0.9 },
    pairs: eligible && p >= 0.6 ? 1 : 0,
    thermalized: eligible && p >= 0.6 ? energy - eg : 0,
    transmitted: !eligible && p >= 0.6 ? energy : 0,
  };
}

export type SolarCellFocus =
  'threshold' | 'pair' | 'circuit' | 'load' | 'limits' | 'light' | 'temperature' | 'losses';
const focusNames: SolarCellFocus[] = [
  'threshold',
  'pair',
  'circuit',
  'load',
  'limits',
  'light',
  'temperature',
  'losses',
];
export function solarCellShot(chapter: number, progress: number) {
  const c = solarCellClamp(Math.floor(Number.isFinite(chapter) ? chapter : 0), 0, 7);
  const q = solarCellClamp(((Number.isFinite(progress) ? progress : 0) - 0.05) / 0.9, 0, 1),
    p = q * q * (3 - 2 * q);
  const config = { ...solarCellDefaults };
  let episode = 0.2;
  if (c === 1) episode = 0.52 * p;
  if (c === 2) episode = 0.52 + 0.48 * p;
  if (c === 3) config.resistance = 10 ** (-2 + 2 * p);
  if (c === 4) config.mode = p < 0.5 ? 'open' : 'short';
  if (c === 5) config.irradiance = 1000 * p;
  if (c === 6) config.temperature = 25 + 40 * p;
  if (c === 7) {
    config.collection = 1 - 0.3 * Math.min(1, 2 * p);
    config.series = 1 + 3 * Math.max(0, 2 * p - 1);
  }
  const budget = solarCellBudget(config);
  return {
    config,
    ...budget,
    focus: focusNames[c],
    progress: p,
    episode: solarCellEpisode(episode),
    threshold: [0.9, 1.55, 2.55].map((energy, i) =>
      solarCellThreshold(energy, solarCellClamp(p * 1.8 - i * 0.22, 0, 1)),
    ),
    curve: solarCellCurve(budget.p),
    maximum: solarCellMaximum(budget.p),
  };
}
export type SolarCellShot = ReturnType<typeof solarCellShot>;
