export type BirdState = {
  time: number;
  headTemperature: number;
  column: number;
  angle: number;
  velocity: number;
  venting: boolean;
  surface: number;
  moment: number;
  pressureDifference: number;
  wet: boolean;
};
const density = 1320,
  tubeArea = 8e-6,
  bodyRadius = 0.022,
  initialSurface = -0.006;
function sphereFill(z: number) {
  const h = z + bodyRadius;
  return Math.PI * h * h * (bodyRadius - h / 3);
}
const initialVolume = sphereFill(initialSurface);
export function birdSurface(column: number) {
  const target = initialVolume - tubeArea * column;
  let lo = -bodyRadius,
    hi = bodyRadius;
  for (let i = 0; i < 35; i++) {
    const m = (lo + hi) / 2;
    if (sphereFill(m) > target) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}
export function birdVapourPressure(temperature: number) {
  return 50000 * Math.exp((-28000 / 8.314) * (1 / temperature - 1 / 293.15));
}
export function birdMoment(column: number) {
  return -1.8e-5 + density * tubeArea * column * (column / 2 - 0.004);
}
export function drinkingBirdHistory(duration = 180, humidity = 0.4, wet = true) {
  const dt = 0.02,
    states: BirdState[] = [];
  let head = 293.15,
    column = 0,
    angle = 0.045,
    velocity = 0,
    venting = false;
  for (let i = 0; i <= Math.ceil(duration / dt); i++) {
    const surface = birdSurface(column),
      difference = venting ? 0 : 50000 - birdVapourPressure(head),
      moment = birdMoment(column);
    states.push({
      time: i * dt,
      headTemperature: head,
      column,
      angle,
      velocity,
      venting,
      surface,
      moment,
      pressureDifference: difference,
      wet,
    });
    head += ((0.08 * (293.15 - head) - (wet ? 0.14 * (1 - humidity) : 0)) / 1.2) * dt;
    const uncovered = -0.012 * Math.cos(angle) >= surface;
    if (uncovered) venting = true;
    if (venting && angle < 0.25 && column < 0.007) venting = false;
    const equilibrium = Math.min(
      0.145,
      Math.max(0, difference / (density * 9.8 * Math.max(0.2, Math.cos(angle)))),
    );
    column += (venting ? -column / 1.2 : (equilibrium - column) / 1.6) * dt;
    const acceleration = (9.8 * moment * Math.sin(angle) - 0.000035 * velocity) / 0.00006;
    velocity += acceleration * dt;
    angle += velocity * dt;
    if (angle > 1.4) {
      angle = 1.4;
      velocity = Math.min(0, velocity);
    }
    if (angle < 0.035) {
      angle = 0.035;
      velocity = Math.max(0, velocity);
    }
  }
  return states;
}
export function birdStateAt(states: BirdState[], time: number) {
  return states[Math.max(0, Math.min(states.length - 1, Math.round(time / 0.02)))];
}
export function birdMilestones(states: BirdState[]) {
  const find = (predicate: (s: BirdState) => boolean, after = 0) =>
    states.find((s) => s.time >= after && predicate(s))?.time ?? after + 10;
  const rise = find((s) => s.column > 0.03),
    tilt = find((s) => s.angle > 0.5, rise),
    dip = find((s) => s.angle > 1.39, tilt),
    reset = find((s) => s.angle < 0.1 && s.column < 0.015, dip),
    nextDip = find((s) => s.angle > 1.39, reset);
  return { rise, tilt, dip, reset, nextDip };
}
