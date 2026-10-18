import { finiteClamp } from './modern-labs';
import plottedObservations from './gravity-measurements-records.json';
export const TORSION_OBSERVATIONS = Object.freeze(
  plottedObservations.points.map((p) =>
    Object.freeze({ id: p[0]!, run: p[1]!, timeMinutes: p[2]!, positionMm: p[3]! }),
  ),
);
export const TORSION_FITTED_EQUILIBRIA = Object.freeze(
  plottedObservations.fittedEquilibriumLines.map((line) => Object.freeze(line)),
);
export const GRAVITY_G = 6.6743e-11,
  EARTH_RADIUS = 6.371e6,
  EARTH_MU = 3.986004418e14;
/** Fixed compiled orbital references; controls never rewrite the reference Moon. */
export const MOON_REFERENCE = Object.freeze({
  g: 9.8,
  radius: 384400e3,
  earthRadius: 6371e3,
  period: 27.3217 * 86400,
});
export function moonEarthTest(ratio = MOON_REFERENCE.radius / MOON_REFERENCE.earthRadius) {
  const r = finiteClamp(ratio, 1, 100),
    g = MOON_REFERENCE.g;
  return {
    ratio: r,
    g,
    predicted: g / r ** 2,
    observed: (4 * Math.PI ** 2 * MOON_REFERENCE.radius) / MOON_REFERENCE.period ** 2,
  };
}
export function moonPrediction(exponent = 2, radiusRatio = 1) {
  const p = finiteClamp(exponent, 1, 3),
    multiple = finiteClamp(radiusRatio, 0.5, 2),
    r = MOON_REFERENCE.radius * multiple;
  return MOON_REFERENCE.g * (MOON_REFERENCE.earthRadius / r) ** p;
}
export function moonTangentDeparture(seconds = 60) {
  const t = finiteClamp(seconds, 0, 120);
  return 2 * MOON_REFERENCE.radius * Math.sin((Math.PI * t) / MOON_REFERENCE.period) ** 2;
}

/** Andrews–Bobowski (2019), Table 1. omega, decay and shift are published fit estimates. */
export const TORSION_RECORD = Object.freeze({
  smallRadius: 0.00756,
  separation: 0.0464,
  halfRod: 0.0499,
  screenDistance: 2.435,
  largeMass: 1.5,
  omega: 0.0216111,
  decay: 1068.6,
  shift: 0.0187,
  shiftUncertainty: 0.0014,
});
/** Paper Eq. 8: nearest-pair constant-torque approximation, NOT the four-force inverse. */
export function publishedTorsionInference() {
  const r = TORSION_RECORD,
    frequencySquared = r.omega ** 2 + r.decay ** -2,
    inertiaPerMass = 2 * (r.halfRod ** 2 + (2 * r.smallRadius ** 2) / 5),
    G =
      (r.shift * r.separation ** 2 * (inertiaPerMass / 2) * frequencySquared) /
      (4 * r.largeMass * r.halfRod * r.screenDistance),
    J = inertiaPerMass / 2,
    relativeVariance =
      (r.shiftUncertainty / r.shift) ** 2 +
      ((2 * 0.0001) / r.separation) ** 2 +
      ((0.8 * r.smallRadius * 0.00005) / J) ** 2 +
      (((2 * r.halfRod) / J - 1 / r.halfRod) * 0.0005) ** 2 +
      (0.001 / r.largeMass) ** 2 +
      (0.01 / r.screenDistance) ** 2 +
      ((2 * r.omega * 0.0000012) / frequencySquared) ** 2 +
      ((2 * 1.4) / (r.decay ** 3 * frequencySquared)) ** 2;
  return {
    G,
    frequencySquared,
    inertiaPerMass,
    period: (2 * Math.PI) / r.omega,
    theta: 0.5 * Math.atan(r.shift / (2 * r.screenDistance)),
    uncertainty: G * Math.sqrt(relativeVariance),
  };
}
/** Incoming ray (0,-1), baseline mirror normal at pi/4. All distances are metres. */
export function torsionOpticalLever(angle: number, distance = 2.435) {
  const theta = finiteClamp(angle, -0.08, 0.08),
    L = finiteClamp(distance, 0.2, 5),
    normal = { x: Math.cos(Math.PI / 4 + theta), y: Math.sin(Math.PI / 4 + theta) },
    outgoing = { x: 2 * normal.y * normal.x, y: -1 + 2 * normal.y ** 2 };
  return { theta, L, normal, outgoing, screen: { x: L, y: (L * outgoing.y) / outgoing.x } };
}
/** Linear constant-torque transfer, separate from the full four-pair dynamics. */
export function calibratedFibreComparison(stiffness = 1) {
  const factor = finiteClamp(stiffness, 0.5, 2),
    original = publishedTorsionInference(),
    theta = original.theta / factor,
    kappaPerMass = original.inertiaPerMass * original.frequencySquared * factor;
  return { factor, theta, kappaPerMass, torquePerMass: kappaPerMass * theta, G: original.G };
}
/** Force and torque from both external masses on both test masses, in SI. */
export function torsionGeometry(theta: number, side = 1, bigMass = 158) {
  theta = finiteClamp(theta, -0.08, 0.08);
  side = side < 0 ? -1 : 1;
  bigMass = finiteClamp(bigMass, 0, 316);
  const density = 11340;
  return {
    theta,
    side,
    small: [-1, 1].map((sign) => ({
      id: sign,
      x: sign * 0.9 * Math.cos(theta),
      y: sign * 0.9 * Math.sin(theta),
      mass: 0.73,
      radius: Math.cbrt((3 * 0.73) / (4 * Math.PI * density)),
    })),
    large: [-1, 1].map((sign) => ({
      id: sign,
      x: sign * 0.9,
      y: sign * 0.23 * side,
      mass: bigMass,
      radius: Math.cbrt((3 * bigMass) / (4 * Math.PI * density)),
    })),
  };
}
export function torsionTorque(theta: number, side = 1, bigMass = 158) {
  const geometry = torsionGeometry(theta, side, bigMass);
  let torque = 0;
  for (const small of geometry.small) {
    const { x, y } = small;
    for (const large of geometry.large) {
      const dx = large.x - x,
        dy = large.y - y,
        r = Math.hypot(dx, dy),
        f = (GRAVITY_G * small.mass * large.mass) / r ** 3;
      torque += x * f * dy - y * f * dx;
    }
  }
  return torque;
}
export function torsionBalance(side = 1, mass = 158, seconds = 0, stiffness = 1) {
  const k = 2.5e-5 * finiteClamp(stiffness, 0.5, 2),
    I = 2 * 0.73 * 0.9 ** 2,
    b = 2 * Math.sqrt(k * I) * 0.35;
  let equilibrium = 0;
  for (let i = 0; i < 20; i++) equilibrium = torsionTorque(equilibrium, side, mass) / k;
  const t = finiteClamp(seconds, 0, 10000),
    steps = Math.max(1, Math.ceil(t / 3)),
    dt = t / steps;
  let theta = 0,
    omega = 0;
  for (let i = 0; i < steps; i++) {
    const accel = (q: number, w: number) => (torsionTorque(q, side, mass) - k * q - b * w) / I;
    const a = accel(theta, omega),
      midQ = theta + (omega * dt) / 2,
      midW = omega + (a * dt) / 2;
    theta += midW * dt;
    omega += accel(midQ, midW) * dt;
  }
  return {
    theta,
    equilibrium,
    torque: torsionTorque(theta, side, mass),
    k,
    period: 2 * Math.PI * Math.sqrt(I / k),
  };
}
/** Central gravity at 300 km, velocity Verlet, stopped on the spherical surface. */
export function cannonOrbit(speedKm = 7.73) {
  let x = 0,
    y = EARTH_RADIUS + 3e5,
    vx = finiteClamp(speedKm, 0, 11) * 1000,
    vy = 0;
  const dt = 2,
    r0 = y,
    points = [];
  const accel = (x: number, y: number) => {
    const r = Math.hypot(x, y);
    return { x: (-EARTH_MU * x) / r ** 3, y: (-EARTH_MU * y) / r ** 3 };
  };
  let a = accel(x, y);
  let hit = false;
  for (let i = 0; i <= 3000; i++) {
    if (i % 5 === 0)
      points.push({ x, y, time: i * dt, r: Math.hypot(x, y), speed: Math.hypot(vx, vy) });
    x += vx * dt + 0.5 * a.x * dt ** 2;
    y += vy * dt + 0.5 * a.y * dt ** 2;
    const b = accel(x, y);
    vx += 0.5 * (a.x + b.x) * dt;
    vy += 0.5 * (a.y + b.y) * dt;
    a = b;
    if (Math.hypot(x, y) <= EARTH_RADIUS) {
      const r = Math.hypot(x, y);
      points.push({
        x: (x * EARTH_RADIUS) / r,
        y: (y * EARTH_RADIUS) / r,
        time: (i + 1) * dt,
        r: EARTH_RADIUS,
        speed: Math.hypot(vx, vy),
      });
      hit = true;
      break;
    }
  }
  return {
    points,
    hit,
    circularSpeed: Math.sqrt(EARTH_MU / r0) / 1000,
    escapeSpeed: Math.sqrt((2 * EARTH_MU) / r0) / 1000,
  };
}

/** Actual chapter-relative word cuts, including the 0.45 s lead-in.
 * ASR files: batch-9-timed-speech/gravity-measurements-{zh,en}-{0..5}.json.
 * These cuts direct evidence reveals; they never change any fixed observations. */
export function gravityMeasurementsDirector(chapter: number, seconds: number, locale: 'zh' | 'en') {
  const t = finiteClamp(seconds, 0, 60),
    en = locale === 'en';
  let shot = 'orbit',
    motionProgress = 0,
    revealPrediction = true,
    revealOrbital = true,
    revealG = false,
    run = 0,
    torsionSeconds = 0,
    fibreFactor = 1;
  if (chapter === 0) {
    const prediction = en ? 9.99 : 8.19,
      lock = en ? 19.73 : 18.25,
      tangent = en ? 21.15 : 20.39;
    shot = t < prediction ? 'surface' : t < lock ? 'prediction' : t < tangent ? 'lock' : 'tangent';
    revealPrediction = t >= (en ? 17.47 : 15.37);
    motionProgress =
      shot === 'surface'
        ? 0.2 * finiteClamp(t / (prediction - 1), 0, 1)
        : finiteClamp((t - tangent) / 10, 0, 1);
  } else if (chapter === 1) {
    const acceleration = en ? 4.91 : 6.33,
      compare = en ? 17.33 : 18.39,
      question = en ? 24.55 : 25.35,
      answer = en ? 29.19 : 31.97;
    shot =
      t < acceleration
        ? 'records'
        : t < compare
          ? 'acceleration'
          : t < question
            ? 'compare'
            : t < answer
              ? 'distance-question'
              : 'distance-answer';
    revealOrbital = t >= (en ? 13.05 : 15.35);
    motionProgress = finiteClamp((t - acceleration) / (compare - acceleration), 0, 1);
  } else if (chapter === 2) {
    shot = t < (en ? 16.45 : 18.11) ? 'force' : 'optical';
    torsionSeconds = finiteClamp((t - (en ? 8.93 : 9.51)) * 70, 0, 2200);
  } else if (chapter === 3) {
    const swap = en ? 5.53 : 5.55,
      shift = en ? 9.49 : 9.21,
      calibration = en ? 12.73 : 11.89,
      inverse = en ? 18.21 : 17.65,
      question = en ? 38.21 : 34.61,
      answer = en ? 39.91 : 37.15,
      half = en ? 41.09 : 38.15;
    shot =
      t < shift
        ? 'published'
        : t < calibration
          ? 'fit-shift'
          : t < inverse
            ? 'calibration'
            : t < question
              ? 'inverse'
              : t < answer
                ? 'fibre-question'
                : 'fibre-answer';
    run = t < swap ? 0 : 1;
    revealG = t >= (en ? 29.05 : 27.59);
    fibreFactor = 1 + finiteClamp((t - answer) / (half - answer), 0, 1);
  } else if (chapter === 4) {
    // The actual surface contact is reached as the retained voice states it.
    motionProgress = finiteClamp((t - 0.45) / ((en ? 7.85 : 8.59) - 0.45), 0, 1);
  } else {
    motionProgress = finiteClamp((t - 0.45) / 20, 0, 1);
  }
  return {
    shot,
    motionProgress,
    revealPrediction,
    revealOrbital,
    revealG,
    run,
    torsionSeconds,
    fibreFactor,
  };
}
