/** Gravimetric teaching model; masses in g, coordinates are layout units. */
export const atomicMass = { C: 12.01, H: 1.008, O: 16 };
export const molar = { water: 18.016, co2: 44.01, ethanol: 46.068 };
export function combustion(sampleMass: number) {
  const n = Math.max(0, sampleMass) / molar.ethanol;
  return {
    water: 3 * n * molar.water,
    co2: 2 * n * molar.co2,
    carbon: 2 * n * atomicMass.C,
    hydrogen: 6 * n * atomicMass.H,
    oxygen: n * atomicMass.O,
    oxygenFromCuO: 6 * n * atomicMass.O,
  };
}
export function inferComposition(
  sample: number,
  waterGain: number,
  co2Gain: number,
  onlyCHO = true,
) {
  const carbon = (co2Gain * atomicMass.C) / molar.co2,
    hydrogen = (waterGain * 2 * atomicMass.H) / molar.water,
    oxygen = onlyCHO ? sample - carbon - hydrogen : null;
  const amounts = [
    carbon / atomicMass.C,
    hydrogen / atomicMass.H,
    oxygen === null ? null : oxygen / atomicMass.O,
  ];
  const valid =
    sample > 0 &&
    waterGain >= 0 &&
    co2Gain >= 0 &&
    oxygen !== null &&
    oxygen > 0 &&
    amounts.every((x) => x !== null && x > 0);
  const min = valid ? Math.min(...(amounts as number[])) : 1;
  const ratio = valid ? (amounts as number[]).map((x) => x / min) : null;
  const integerRatio =
    ratio && ratio.every((x) => Math.abs(x - Math.round(x)) < 0.04) ? ratio.map(Math.round) : null;
  return { carbon, hydrogen, oxygen, amounts, ratio, integerRatio, valid };
}
export function fromMassPercent(c: number, h: number) {
  return inferComposition(
    100,
    h / ((2 * atomicMass.H) / molar.water),
    c / (atomicMass.C / molar.co2),
  );
}
export type Point = { x: number; y: number };
export function layout(narrow: boolean) {
  const points = narrow
    ? [
        [65, 65],
        [210, 65],
        [270, 65],
        [270, 160],
        [235, 160],
        [150, 160],
        [95, 160],
        [95, 250],
        [130, 250],
        [160, 285],
        [195, 320],
        [230, 285],
        [260, 250],
        [285, 250],
      ]
    : [
        [80, 90],
        [265, 90],
        [315, 90],
        [335, 90],
        [410, 90],
        [440, 90],
        [470, 90],
        [495, 130],
        [535, 170],
        [575, 130],
        [605, 90],
        [650, 90],
      ];
  const path = points.map(([x, y]) => ({ x, y }));
  return {
    path,
    dryPoint: narrow ? { x: 195, y: 160 } : { x: 370, y: 90 },
    capturePoint: narrow ? { x: 195, y: 320 } : { x: 535, y: 170 },
    furnace: narrow ? { x: 45, y: 65, width: 165 } : { x: 45, y: 90, width: 220 },
    bulbs: narrow
      ? [
          { x: 130, y: 250, r: 18 },
          { x: 160, y: 285, r: 20 },
          { x: 195, y: 320, r: 23 },
          { x: 230, y: 285, r: 20 },
          { x: 260, y: 250, r: 18 },
        ]
      : [
          { x: 470, y: 90, r: 18 },
          { x: 495, y: 130, r: 20 },
          { x: 535, y: 170, r: 23 },
          { x: 575, y: 130, r: 20 },
          { x: 605, y: 90, r: 18 },
        ],
  };
}
export function pointAlong(points: Point[], fraction: number) {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let d = Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i]) {
      const u = d / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * u,
        y: points[i].y + (points[i + 1].y - points[i].y) * u,
      };
    }
    d -= lengths[i];
  }
  return points.at(-1)!;
}
function pathFraction(points: Point[], target: Point) {
  let before = 0,
    total = 0,
    found = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      l = Math.hypot(b.x - a.x, b.y - a.y),
      at = Math.hypot(target.x - a.x, target.y - a.y),
      end = Math.hypot(target.x - b.x, target.y - b.y);
    if (Math.abs(at + end - l) < 1e-8) found = before + at;
    before += l;
    total += l;
  }
  return found / total;
}
export const packets = [
  { id: 'C1', species: 'co2' },
  { id: 'H1H2', species: 'water' },
  { id: 'C2', species: 'co2' },
  { id: 'H3H4', species: 'water' },
  { id: 'H5H6', species: 'water' },
] as const;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function transport(time: number, narrow: boolean, dryer = true) {
  const l = layout(narrow);
  return packets.map((a, i) => {
    const end = a.species === 'water' && dryer ? l.dryPoint : l.capturePoint,
      endF = pathFraction(l.path, end),
      dryF = pathFraction(l.path, l.dryPoint),
      travel = Math.max(0, (time - i * 0.035) / 0.75),
      fraction = Math.min(
        endF,
        travel < 0.45
          ? (dryF * travel) / 0.45
          : dryF + ((pathFraction(l.path, l.capturePoint) - dryF) * (travel - 0.45)) / 0.55,
      ),
      capture = clamp((travel - (a.species === 'water' && dryer ? 0.45 : 1)) / 0.07);
    return {
      ...a,
      point: pointAlong(l.path, fraction),
      capture,
      destination: a.species === 'water' && dryer ? 'water' : 'co2',
    };
  });
}
export function absorbed(sample: number, time: number, narrow: boolean, dryer = true) {
  const products = combustion(sample),
    state = transport(time, narrow, dryer);
  let water = 0,
    co2 = 0;
  for (const p of state) {
    const m = (p.species === 'water' ? products.water / 3 : products.co2 / 2) * p.capture;
    if (p.destination === 'water') water += m;
    else co2 += m;
  }
  return { water, co2, inferred: inferComposition(sample, water, co2), state };
}
