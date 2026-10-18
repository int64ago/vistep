/** Illustrative, dimensionless reaction/transport accounts; no experimental rate or yield claim. */
const limit = (n: number, max = 1) => (Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0);
export function esterPreparation(progress: number, heated = true, catalyst = true, collect = true) {
  let acid = 1,
    alcohol = 1,
    ester = 0,
    water = 0.2,
    extent = 0;
  const receiver = { acid: 0, alcohol: 0, ester: 0, water: 0 };
  const steps = Math.round(limit(progress) * 1600),
    dt = 0.005,
    rate = (heated ? 1 : 0.12) * (catalyst ? 1 : 0.18);
  for (let i = 0; i < steps; i++) {
    const delta = Math.max(
      -Math.min(ester, water),
      Math.min(acid, alcohol, (0.7 * acid * alcohol - 0.175 * ester * water) * rate * dt),
    );
    acid -= delta;
    alcohol -= delta;
    ester += delta;
    water += delta;
    extent += delta;
    if (collect) {
      const k = heated ? 1 : 0.02;
      const a = 0.01 * acid * k * dt,
        e = 0.03 * alcohol * k * dt,
        p = 0.25 * ester * k * dt,
        w = 0.03 * water * k * dt;
      acid -= a;
      alcohol -= e;
      ester -= p;
      water -= w;
      receiver.acid += a;
      receiver.alcohol += e;
      receiver.ester += p;
      receiver.water += w;
    }
  }
  const neutralized = Math.min(receiver.acid, 0.6),
    carbonateUsed = neutralized / 2;
  return {
    acid,
    alcohol,
    ester,
    water,
    extent,
    receiver,
    washed: {
      acid: receiver.acid - neutralized,
      acetate: neutralized,
      carbonate: 0.3 - carbonateUsed,
      carbonDioxide: carbonateUsed,
      water: receiver.water + carbonateUsed,
      alcohol: receiver.alcohol,
      oil: receiver.ester * 0.93,
      dissolvedEster: receiver.ester * 0.07,
    },
    rate,
  };
}
export type HydrolysisMedium = 'neutral' | 'acid' | 'base';
export function esterHydrolysis(
  progress: number,
  medium: HydrolysisMedium = 'acid',
  temperature = 75,
  base = 1.2,
) {
  const p = limit(progress),
    temp = 25 + limit(temperature - 25, 55),
    b = limit(base, 3);
  const factor = Math.exp((30000 / 8.314) * (1 / 298.15 - 1 / (temp + 273.15)));
  let x = 0;
  const steps = Math.round(p * 1000),
    dt = 0.005;
  for (let i = 0; i < steps; i++) {
    const rate =
      medium === 'base'
        ? 0.24 * (1 - x) * (b - x)
        : (medium === 'acid' ? 0.08 : 0.004) * (((1 - x) * (10 - x)) / 10 - 0.25 * x * x);
    const max = medium === 'base' ? Math.min(1, b) : 1;
    x = Math.max(0, Math.min(max, x + rate * factor * dt));
  }
  return {
    medium,
    temperature: temp,
    extent: x,
    ester: 1 - x,
    alcohol: x,
    acid: medium === 'base' ? 0 : x,
    acetate: medium === 'base' ? x : 0,
    hydroxide: medium === 'base' ? b - x : b,
    water: medium === 'base' ? 10 : 10 - x,
    initialBase: b,
    oilLayer: Math.max(0, 1 - x - 0.08) / 0.92,
    temperatureFactor: factor,
  };
}
export function ethanolBurn(progress: number, amount = 0.2) {
  const used = limit(progress) * limit(amount, 3);
  return {
    used,
    oxygen: 3 * used,
    water: 3 * used,
    carbonDioxide: 2 * used,
    calciumCarbonate: Math.min(0.3, 2 * used),
  };
}
export function aceticCarbonate(progress: number, acid = 2, carbonate = 1) {
  const a = limit(acid, 10),
    c = limit(carbonate, 10);
  const extent = Math.min(a / 2, c) * limit(progress);
  return {
    extent,
    acid: a - 2 * extent,
    carbonate: c - extent,
    acetate: 2 * extent,
    water: extent,
    carbonDioxide: extent,
  };
}
export function esterDirector(chapter: number, progress: number) {
  const c = Math.floor(limit(chapter, 9)),
    p = limit(progress);
  return {
    chapter: c,
    progress: p,
    preparation: c === 3 ? p * 0.55 : c === 4 ? 0.55 + 0.45 * p : 1,
    hydrolysis: c === 6 ? p : c === 9 ? p : 1,
  };
}
