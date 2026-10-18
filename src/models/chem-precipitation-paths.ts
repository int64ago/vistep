/** Dilute ideal equilibria at 25 C; activities replaced by concentrations. */
export function bariumSulfate(bariumMilliMoles: number) {
  const ba = Math.max(0, Math.min(2, bariumMilliMoles)) / 1000,
    so4 = 0.001,
    volume = 0.1,
    ksp = 1.1e-10;
  let lo = 0,
    hi = Math.min(ba, so4);
  const initialQ = (ba * so4) / volume ** 2;
  if (initialQ > ksp) {
    for (let i = 0; i < 80; i++) {
      const x = (lo + hi) / 2,
        q = ((ba - x) * (so4 - x)) / volume ** 2;
      if (q > ksp) lo = x;
      else hi = x;
    }
  } else hi = 0;
  const precipitated = (lo + hi) / 2;
  return {
    precipitate: precipitated * 1000,
    barium: (ba - precipitated) * 1000,
    sulfate: (so4 - precipitated) * 1000,
    sodium: 2,
    chloride: ba * 2000,
    ksp,
    initialQ,
    equilibriumQ: ((ba - precipitated) * (so4 - precipitated)) / volume ** 2,
  };
}
export function magnesiumAcid(acidMolar: number) {
  const total = 0.01,
    ksp = 1.5e-11,
    kw = 1e-14,
    acid = Math.max(0, Math.min(0.04, acidMolar));
  let lo = -14,
    hi = 0;
  for (let i = 0; i < 100; i++) {
    const logH = (lo + hi) / 2,
      h = 10 ** logH,
      oh = kw / h,
      mg = Math.min(total, ksp / oh ** 2);
    if (2 * mg + h - oh - acid > 0) hi = logH;
    else lo = logH;
  }
  const h = 10 ** ((lo + hi) / 2),
    oh = kw / h,
    dissolved = Math.min(total, ksp / oh ** 2);
  return {
    pH: -Math.log10(h),
    dissolved,
    solid: total - dissolved,
    hydrogen: h,
    hydroxide: oh,
    acid,
    ksp,
    chargeResidual: 2 * dissolved + h - oh - acid,
  };
}
/** Near-complete exchange approximation for the textbook reagent order, in mmol. */
export function silverExchange(iodideAdded: number, sulfideAdded: number, initialSilver = 1) {
  const total = Math.max(0, Math.min(1, initialSilver));
  const iodide = Math.max(0, Math.min(total, iodideAdded)),
    sulfide = Math.max(0, Math.min(0.5, sulfideAdded));
  const silverToSulfide = Math.min(total, sulfide * 2),
    fromI = Math.min(iodide, silverToSulfide),
    fromCl = silverToSulfide - fromI;
  const agI = iodide - fromI,
    agCl = total - iodide - fromCl,
    ag2S = silverToSulfide / 2;
  return {
    agCl,
    agI,
    ag2S,
    chlorideReleased: iodide + fromCl,
    iodideReleased: fromI,
    silverTotal: agCl + agI + 2 * ag2S,
  };
}
/** Distinguishes Fe(OH)3 from free OH- and from hydroxide released by Mg(OH)2. */
export function magnesiumIron(
  ironMilliMoles: number,
  freeHydroxide: number,
  preparedMagnesium = 1,
) {
  const magnesium = Math.max(0, Math.min(1, preparedMagnesium));
  const iron = Math.max(0, Math.min(1, ironMilliMoles)),
    oh = Math.max(0, Math.min(3, freeHydroxide));
  const direct = Math.min(iron, oh / 3),
    exchange = Math.min(iron - direct, (2 * magnesium) / 3);
  return {
    ironHydroxide: direct + exchange,
    magnesiumHydroxide: magnesium - 1.5 * exchange,
    dissolvedMagnesium: 1.5 * exchange,
    direct,
    exchange,
    freeHydroxide: oh - 3 * direct,
    freeIron: iron - direct - exchange,
  };
}
export type PrecipitationMode = 'barium' | 'acid' | 'silver' | 'iron';
export function precipitationDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: (chapter < 2
      ? 'barium'
      : chapter < 4
        ? 'acid'
        : chapter < 7
          ? 'silver'
          : 'iron') as PrecipitationMode,
    dose: chapter === 0 ? p : 1,
    acid: chapter === 3 ? 0.024 * p : 0,
    iodide: chapter === 5 ? p : chapter >= 6 ? 1 : 0,
    sulfide: chapter === 6 ? p * 0.5 : 0,
    iron: chapter === 8 ? p * 0.5 : 0,
    freeOH: 0,
    spectators: chapter === 1,
    silverAmount: chapter === 4 ? p : 1,
    magnesiumAmount: chapter === 7 ? p : 1,
  };
}
