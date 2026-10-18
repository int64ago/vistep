export const corrosionClamp = (v: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
const F = 96485.33212,
  R = 8.314462618,
  T = 298.15,
  P0 = 101325;
/** Closed, isothermal headspace plus finite reservoir. The uptake law is illustrative. */
export function oxygenColumn(time: number, wet = true, leak = false) {
  const t = corrosionClamp(time, 0, 900),
    V0 = 50e-6,
    A = Math.PI * 0.0015 ** 2,
    B = 0.0005,
    n0 = (P0 * V0) / (R * T),
    used = wet ? 4e-5 * (1 - Math.exp(-t / 120)) : 0;
  let lo = 0,
    hi = 0.15;
  for (let i = 0; i < 70; i++) {
    const h = (lo + hi) / 2,
      left = (P0 - 1000 * 9.80665 * h * (1 + A / B)) * (V0 - A * h),
      right = (n0 - used) * R * T;
    if (left > right) lo = h;
    else hi = h;
  }
  const rise = leak ? 0 : (lo + hi) / 2,
    fall = (A * rise) / B,
    pressure = P0 - 1000 * 9.80665 * (rise + fall),
    volume = V0 - A * rise;
  return {
    riseMm: rise * 1000,
    fallMm: fall * 1000,
    pressure,
    volume,
    initialVolume: V0,
    usedOxygen: used,
    initialMoles: n0,
    gasMoles: n0 - used + (leak ? used : 0),
    waterMoved: A * rise,
    area: A,
    reservoirArea: B,
  };
}
/** Two 0.25g granules in 5mL 0.5M HCl. Added design, not measured textbook data. */
export function zincAcid(time: number, addedCopper = true) {
  const t = corrosionClamp(time, 0, 1200),
    ages = [Math.max(0, t - 120), Math.max(0, t - 130)];
  const dose = addedCopper ? ages.filter((_, i) => t >= 120 + i * 10).length * 5e-6 : 0;
  const copper = addedCopper ? ages.reduce((a, d) => a + 5e-6 * (1 - Math.exp(-d / 10)), 0) : 0;
  const integrated =
    0.001 *
    (t + (addedCopper ? 3.5 * ages.reduce((a, d) => a + d - 10 * (1 - Math.exp(-d / 10)), 0) : 0));
  const h2 = 0.00125 * (1 - Math.exp(-integrated)),
    rate = 0.001 * 0.00125 * Math.exp(-integrated) * (1 + (7 * copper) / 1e-5);
  return {
    hydrogen: h2,
    rate,
    copper,
    copperRemaining: dose - copper,
    zincUsed: h2 + copper,
    zincRemaining: 0.5 / 65.38 - h2 - copper,
    acidLeft: 0.0025 - 2 * h2,
    dose,
    volumeMl: 5 + (dose / 1e-5) * 0.1,
  };
}
export function protectionState(time: number, connected = true, wet = true) {
  const t = corrosionClamp(time, 0, 1200),
    I = connected && wet ? 0.002 : 0,
    Q = I * t,
    localIron = wet && !connected ? (0.001 * t) / (2 * F) : 0;
  return {
    I,
    Q,
    zincLost: Q / (2 * F),
    ironLost: localIron,
    hydrogen: Q / (2 * F) + localIron,
    ironConcentration: localIron / 0.05,
  };
}
export function sampleTransfer(progress: number) {
  const p = corrosionClamp(progress),
    aspirated = corrosionClamp(p / 0.15),
    lift = corrosionClamp((p - 0.15) / 0.15),
    travel = corrosionClamp((p - 0.3) / 0.2),
    dispense = corrosionClamp((p - 0.5) / 0.12),
    reagentDrops = (p >= 0.72 ? 1 : 0) + (p >= 0.84 ? 1 : 0);
  return {
    x: travel,
    tipY: 210 - 110 * lift,
    sourceMl: 50 - aspirated,
    pipetteMl: aspirated - dispense,
    sampleMl: dispense,
    reagentMl: reagentDrops * 0.05,
    reagentDrops,
  };
}
export type GelMetal = 'zinc' | 'copper';
/** Localized indicator zones, not calibrated concentrations or predicted diffusion coefficients. */
export function gelZones(metal: GelMetal, contact = true, wet = true, progress = 1) {
  const p = corrosionClamp(progress),
    amount = wet ? p : 0;
  return {
    blue: metal === 'zinc' && contact ? 0 : amount,
    pink: amount,
    protected: metal === 'zinc' && contact && wet,
    zincWhite: metal === 'zinc' ? amount : 0,
    blueSites: [-37, 37],
    pinkSites: metal === 'zinc' && contact ? [-35, 35] : [0],
    radius: 4 + 18 * Math.sqrt(p),
    electronDirection: metal === 'zinc' ? 'metal-to-iron' : 'iron-to-metal',
  };
}
export const HEMATITE_HEAT = 825503.2; // NIST-JANAF J/mol Fe2O3, reference scale only for hydrated real products.
export type WarmerInputs = {
  iron?: number;
  water?: number;
  salt?: boolean;
  carbon?: boolean;
  air?: number;
  loss?: number;
  capacity?: number;
};
export function warmerModel(seconds: number, options: WarmerInputs = {}) {
  const iron = corrosionClamp(options.iron ?? 5, 0, 10),
    water = corrosionClamp(options.water ?? 3, 0, 6),
    air = corrosionClamp(options.air ?? 1, 0, 2),
    loss = corrosionClamp(options.loss ?? 0.08, 0, 0.3),
    C = corrosionClamp(options.capacity ?? 40, 10, 150),
    duration = corrosionClamp(seconds, 0, 7200),
    ambient = 25,
    oxygenCapacity = 5e-5;
  const moisture = water / (0.8 + water),
    airFlux = 6e-6 * air * Math.exp(-Math.max(0, water - 3) * 0.6),
    kinetic =
      (1 / 3000) *
      moisture *
      (options.salt === false ? 0.2 : 1) *
      (options.carbon === false ? 0.6 : 1);
  let remaining = iron,
    oxygen = oxygenCapacity,
    temp = ambient,
    generated = 0,
    lost = 0,
    supplied = 0,
    consumed = 0,
    peak = ambient,
    time = 0;
  const trace = [{ time: 0, temp: ambient, remaining, generated: 0, lost: 0, oxygen }];
  while (time < duration) {
    const dt = Math.min(2, duration - time),
      entry = airFlux * (1 - oxygen / oxygenCapacity) * dt;
    oxygen += entry;
    supplied += entry;
    const dm = Math.min(
        remaining,
        ((kinetic * remaining * oxygen) / (oxygenCapacity * 0.2 + oxygen)) * dt,
        ((oxygen * 4) / 3) * 55.845,
      ),
      dO2 = (dm / 55.845) * 0.75,
      heat = (dm / 55.845 / 2) * HEMATITE_HEAT;
    oxygen -= dO2;
    consumed += dO2;
    remaining -= dm;
    const before = C * (temp - ambient) + heat;
    temp = ambient + (temp - ambient + heat / C) * Math.exp((-loss * dt) / C);
    generated += heat;
    lost += before - C * (temp - ambient);
    peak = Math.max(peak, temp);
    time += dt;
    if (time % 30 === 0 || time === duration)
      trace.push({ time, temp, remaining, generated, lost, oxygen });
  }
  return {
    temp,
    peak,
    remaining,
    generated,
    lost,
    stored: C * (temp - ambient),
    oxygen,
    supplied,
    consumed,
    initialOxygen: oxygenCapacity,
    capacity: C,
    initialIron: iron,
    trace,
  };
}
