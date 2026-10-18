/** Ideal reaction extents and illustrative transport; no food-safety prediction. */
export const fermentClamp = (x: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : lo));
export function fermentationState(wine = 0, vinegar = 0, oxygen = true) {
  const x = fermentClamp(wine),
    y = Math.min(x, fermentClamp(vinegar)) * (oxygen ? 1 : 0);
  // Start with one mol glucose. Oxygen is supplied externally in stage two.
  const glucose = 1 - x,
    ethanol = 2 * (x - y),
    co2 = 2 * x,
    acetate = 2 * y,
    oxygenUsed = 2 * y,
    water = 2 * y;
  return {
    glucose,
    ethanol,
    co2,
    acetate,
    oxygenUsed,
    water,
    carbon: glucose * 6 + ethanol * 2 + co2 + acetate * 2,
    massIn: 180 + oxygenUsed * 32,
    massOut: glucose * 180 + ethanol * 46 + co2 * 44 + acetate * 60 + water * 18,
  };
}
export function pickleState(days: number, salt = 5, sealed = true) {
  const t = fermentClamp(days, 0, 30),
    inhibition = Math.exp(-Math.max(0, salt - 5) / 5);
  // Selected homofermentative pathway, normalized carbon pools; not calibrated growth.
  const extent = 1 - Math.exp(-0.16 * t * inhibition);
  return {
    sugar: 1 - extent,
    lactate: extent,
    oxygenExposure: sealed ? 0 : 1,
    relativeRate: inhibition,
  };
}
export function jarGeometry(w: number) {
  const cx = w / 2,
    half = Math.min(78, w * 0.3),
    left = cx - half,
    right = cx + half;
  return {
    cx,
    half,
    left,
    right,
    water: 142,
    bottom: 252,
    neckLeft: cx - 30,
    neckRight: cx + 30,
    body: `M${cx - 30} 87V110Q${left} 115 ${left} 151V230Q${left} 252 ${left + 22} 252H${right - 22}Q${right} 252 ${right} 230V151Q${right} 115 ${cx + 30} 110V87`,
    gas: [
      { x: cx, y: 220 },
      { x: cx, y: 102 },
      { x: cx, y: 64 },
      { x: cx + 30, y: 64 },
      { x: cx + 30, y: 88 },
      { x: cx + 49, y: 88 },
      { x: cx + 49, y: 49 },
    ],
  };
}
export function nitriteResult(
  absorbance: string,
  blank = 0.02,
  slope = 0.04,
  volumeMl = 50,
  massG = 10,
  dilution = 2,
) {
  if (
    absorbance.trim() === '' ||
    !Number.isFinite(Number(absorbance)) ||
    slope <= 0 ||
    massG <= 0 ||
    volumeMl <= 0 ||
    dilution < 1
  )
    return null;
  const a = Number(absorbance);
  if (a < blank || a > 0.42) return null;
  const extractMgL = (a - blank) / slope;
  return { extractMgL, foodMgKg: ((extractMgL * volumeMl) / massG) * dilution };
}
export function sampleMotion(progress: number, w: number) {
  const p = fermentClamp(progress),
    x0 = w * 0.24,
    x1 = w * 0.76,
    amount = 5;
  const removed = amount * fermentClamp(p / 0.25),
    delivered = amount * fermentClamp((p - 0.75) / 0.25);
  let x = x0,
    y = 184;
  if (p >= 0.25 && p < 0.4) y = 184 - (84 * (p - 0.25)) / 0.15;
  if (p >= 0.4 && p < 0.65) {
    x = x0 + ((x1 - x0) * (p - 0.4)) / 0.25;
    y = 100;
  }
  if (p >= 0.65 && p < 0.75) {
    x = x1;
    y = 100 + (56 * (p - 0.65)) / 0.1;
  }
  if (p >= 0.75) {
    x = x1;
    y = 156;
  }
  return { x, y, source: 50 - removed, pipette: removed - delivered, sample: delivered, total: 50 };
}
export function reactorState(time: number, aeration = 1, stir = 1, cooling = true) {
  const t = fermentClamp(time, 0, 20),
    air = fermentClamp(aeration),
    mix = fermentClamp(stir),
    kla = air * (0.08 + 0.52 * mix);
  let oxygen = 6,
    temp = 28,
    transferred = 0,
    consumed = 0,
    heatRemoved = 0;
  const dt = t / 400;
  for (let i = 0; i < 400; i++) {
    const transfer = kla * (8 - oxygen) * dt,
      use = Math.min(oxygen + transfer, ((0.65 * oxygen) / (0.5 + oxygen)) * dt);
    oxygen += transfer - use;
    transferred += transfer;
    consumed += use;
    const loss = (cooling ? 0.32 : 0.025) * (temp - 26) * dt;
    temp += 0.7 * dt - loss;
    heatRemoved += loss;
  }
  return {
    oxygen,
    temp,
    kla,
    transferred,
    consumed,
    heatRemoved,
    heatInput: 0.7 * t,
    air,
    mix,
    cooling,
  };
}
export function scaleGeometry(length: number) {
  const l = fermentClamp(length, 0.1, 10);
  return { area: 6 * l * l, volume: l * l * l, areaPerVolume: 6 / l };
}
