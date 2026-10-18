import { signalPathPoint } from './bio-chemical-signals';
export const stableClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export function pheromoneGeometry(width: number, opaque = false) {
  const source = { x: width * 0.2, y: 163 },
    mesh = width * 0.35,
    exit = { x: opaque ? width * 0.45 : mesh, y: opaque ? 191 : 163 };
  return {
    source,
    mesh,
    exit,
    points: opaque
      ? [source, { x: mesh - 8, y: 163 }, { x: mesh - 8, y: 191 }, exit, { x: width - 24, y: 191 }]
      : [source, { x: mesh, y: 163 }, { x: width - 24, y: 163 }],
  };
}
export function pheromoneState(
  progress: number,
  width = 320,
  sourcePresent = true,
  opaque = false,
) {
  const p = stableClamp(progress),
    g = pheromoneGeometry(width, opaque),
    length = g.points
      .slice(1)
      .reduce((sum, pt, i) => sum + Math.hypot(pt.x - g.points[i].x, pt.y - g.points[i].y), 0),
    arrival = (length - 28) / length / 1.8,
    response = sourcePresent ? stableClamp((p - arrival) / (1 - arrival)) : 0;
  const male = {
    x: width - 38 - (width - 38 - (opaque ? g.exit.x + 23 : g.mesh + 24)) * response,
    y: opaque ? 191 : 163,
  };
  const dots = Array.from({ length: 18 }, (_, id) => {
    const q = (p - id * 0.027) * 1.8,
      pos = signalPathPoint(g.points, stableClamp(q));
    return { id, ...pos, visible: sourcePresent && q > 0 && q < 1 };
  });
  return { ...g, male, dots, response };
}
export function feedbackState(progress: number) {
  const t = stableClamp(progress) * 18,
    dt = 0.015;
  let herb = 0.6,
    pred = 0;
  for (let x = 0; x < t; x += dt) {
    const h = Math.min(dt, t - x),
      dh = -0.3 * herb - 0.7 * pred,
      dp = 0.45 * herb - 0.28 * pred;
    herb += h * dh;
    pred += h * dp;
  }
  return { herb, pred, grass: 1 - 0.4 * herb, herbIndex: 1 + herb, predIndex: 1 + pred };
}
export function stabilityResponse(
  time: number,
  disturbance = 0.7,
  resistance = 1,
  recovery = 0.45,
  threshold = false,
) {
  const t = stableClamp(time, 0, 50),
    initial = stableClamp(
      1 - stableClamp(disturbance, 0, 1.2) / (1 + stableClamp(resistance, 0, 4)),
    );
  if (!threshold)
    return { initial, value: 1 - (1 - initial) * Math.exp(-stableClamp(recovery, 0, 2) * t) };
  let value = initial;
  const r = stableClamp(recovery, 0, 2);
  for (let x = 0; x < t; x += 0.02) {
    const h = Math.min(0.02, t - x),
      fn = (v: number) => r * 4 * v * (1 - v) * (v - 0.25),
      a = fn(value),
      b = fn(value + (a * h) / 2),
      c = fn(value + (b * h) / 2),
      d = fn(value + c * h);
    value = stableClamp(value + (h * (a + 2 * b + 2 * c + d)) / 6);
  }
  return { initial, value };
}
export type TankState = {
  hours: number;
  waterO: number;
  airO: number;
  inorganicC: number;
  organicC: number;
  photoTotal: number;
  respTotal: number;
  light: number;
  photo: number;
  resp: number;
  exchange: number;
};
export function tankState(hours: number, lightScale = 1, consumers = 2, plants = 1) {
  const end = stableClamp(hours, 0, 168),
    lum = stableClamp(lightScale, 0, 1.5),
    load = stableClamp(consumers, 0, 8),
    plant = stableClamp(plants, 0, 3);
  let waterO = 8,
    airO = 84,
    inorganicC = 32,
    organicC = 100,
    photoTotal = 0,
    respTotal = 0,
    light = 0,
    photo = 0,
    resp = 0,
    exchange = 0;
  for (let t = 0; t < end; t += 0.04) {
    const dt = Math.min(0.04, end - t);
    light = lum * Math.max(0, Math.sin((Math.PI * ((t + dt / 2) % 24)) / 12));
    const gas = 0.16 * ((9 * airO) / 84 - waterO) * dt;
    exchange = stableClamp(gas, -waterO, airO);
    waterO += exchange;
    airO -= exchange;
    photo = Math.min(1.3 * plant * light * dt, inorganicC / 0.375);
    resp = Math.min(
      (0.1 * plant + 0.09 * load + 0.06) * dt,
      waterO + photo,
      (organicC + 0.375 * photo) / 0.375,
    );
    waterO += photo - resp;
    inorganicC += 0.375 * (resp - photo);
    organicC += 0.375 * (photo - resp);
    photoTotal += photo;
    respTotal += resp;
  }
  return {
    hours: end,
    waterO,
    airO,
    inorganicC,
    organicC,
    photoTotal,
    respTotal,
    light,
    photo,
    resp,
    exchange,
  };
}
export function tankLayout(width: number) {
  const left = 14,
    right = width - 14,
    landEdge = width * 0.3,
    slopeEnd = width * 0.6,
    waterY = 190,
    soilY = 242,
    landY = 166,
    cross = landEdge + ((slopeEnd - landEdge) * (waterY - landY)) / (soilY - landY);
  return {
    left,
    right,
    landEdge,
    slopeEnd,
    waterY,
    soilY,
    landY,
    cross,
    waterPath: `M${cross} ${waterY}H${right}V${soilY}H${slopeEnd}Z`,
  };
}
export function trialRate(responding: string, total: string) {
  if (responding.trim() === '' || total.trim() === '') return null;
  const r = Number(responding),
    n = Number(total);
  return Number.isInteger(r) && Number.isInteger(n) && n > 0 && r >= 0 && r <= n ? r / n : null;
}
