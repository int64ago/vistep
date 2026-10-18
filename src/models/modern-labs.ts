/** SI calculations for textbook experiments. Apparatus drawings use disclosed display scales. */
export const H = 6.62607015e-34;
export const E_CHARGE = 1.602176634e-19;
export const C_LIGHT = 299792458;
export const ELECTRON_MASS = 9.1093837139e-31;
export const BOLTZMANN = 1.380649e-23;
export const finiteClamp = (x: number, lo: number, hi: number) =>
  Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : lo;

export function photoelectric(
  frequencyTHz: number,
  intensity: number,
  voltage: number,
  workEV = 2.1,
) {
  const frequency = finiteClamp(frequencyTHz, 100, 2000) * 1e12;
  const work = finiteClamp(workEV, 1, 8);
  const excessEV = Math.max(0, (H * frequency) / E_CHARGE - work);
  const light = finiteClamp(intensity, 0, 2);
  const emitted = (H * frequency) / E_CHARGE > work && light > 0;
  // A uniform longitudinal kinetic-energy distribution is a teaching approximation.
  const collection = !emitted ? 0 : voltage >= 0 ? 1 : Math.max(0, 1 + voltage / excessEV);
  return {
    frequency,
    thresholdTHz: (work * E_CHARGE) / H / 1e12,
    excessEV,
    stoppingVoltage: excessEV,
    emitted,
    current: light * collection,
    speed: Math.sqrt((2 * excessEV * E_CHARGE) / ELECTRON_MASS),
  };
}

export function oilDrop(radiusMicrometers: number, charges: number, voltage: number) {
  const radius = finiteClamp(radiusMicrometers, 0.4, 2) * 1e-6;
  const q = Math.round(finiteClamp(charges, 1, 12)) * E_CHARGE;
  const densityDifference = 860 - 1.225,
    viscosity = 1.81e-5,
    gap = 0.005;
  const effectiveWeight = (4 / 3) * Math.PI * radius ** 3 * densityDifference * 9.8;
  const electricForce = (q * finiteClamp(voltage, 0, 2000)) / gap;
  const terminalDown = (effectiveWeight - electricForce) / (6 * Math.PI * viscosity * radius);
  return {
    radius,
    q,
    effectiveWeight,
    electricForce,
    terminalDown,
    balanceVoltage: (effectiveWeight * gap) / q,
    fallWithoutField: effectiveWeight / (6 * Math.PI * viscosity * radius),
    gap,
  };
}

export function electronBeam(voltage: number, fieldMT: number) {
  const u = finiteClamp(voltage, 50, 2000),
    b = finiteClamp(fieldMT, 0, 3) / 1000;
  const speed = Math.sqrt((2 * E_CHARGE * u) / ELECTRON_MASS);
  return {
    speed,
    radius: b === 0 ? Infinity : (ELECTRON_MASS * speed) / (E_CHARGE * b),
    chargeMass: E_CHARGE / ELECTRON_MASS,
    magneticField: b,
  };
}

export function comptonShift(angleDegrees: number, incidentPM = 71) {
  const theta = (finiteClamp(angleDegrees, 0, 180) * Math.PI) / 180;
  const shiftPM = (H / (ELECTRON_MASS * C_LIGHT)) * (1 - Math.cos(theta)) * 1e12;
  const incident = Math.max(0.1, incidentPM);
  const scatteredPM = incident + shiftPM;
  const incidentEnergyEV = (H * C_LIGHT) / (incident * 1e-12 * E_CHARGE);
  const scatteredEnergyEV = (H * C_LIGHT) / (scatteredPM * 1e-12 * E_CHARGE);
  const recoilAngle = Math.atan2(
    -Math.sin(theta) / scatteredPM,
    1 / incident - Math.cos(theta) / scatteredPM,
  );
  return {
    theta,
    shiftPM,
    scatteredPM,
    incidentEnergyEV,
    scatteredEnergyEV,
    recoilEnergyEV: incidentEnergyEV - scatteredEnergyEV,
    recoilAngle,
  };
}

export function planckRadiance(wavelengthNM: number, temperature: number) {
  const wavelength = finiteClamp(wavelengthNM, 50, 20000) * 1e-9;
  const kelvin = finiteClamp(temperature, 100, 20000);
  return (
    (2 * H * C_LIGHT ** 2) /
    wavelength ** 5 /
    Math.expm1((H * C_LIGHT) / (wavelength * BOLTZMANN * kelvin))
  );
}
export const wienPeakNM = (temperature: number) =>
  2.897771955e6 / finiteClamp(temperature, 100, 20000);

/** Hydrogen's Balmer wavelengths in vacuum, nonrelativistic infinite-linewidth-free approximation. */
export function balmerWavelength(n: number) {
  const upper = Math.round(finiteClamp(n, 3, 12));
  return 1e9 / (1.0967758e7 * (1 / 4 - 1 / upper ** 2));
}
export function electronWavelengthPM(voltage: number) {
  const u = finiteClamp(voltage, 1, 100000);
  return (
    (H /
      Math.sqrt(
        2 *
          ELECTRON_MASS *
          E_CHARGE *
          u *
          (1 + (E_CHARGE * u) / (2 * ELECTRON_MASS * C_LIGHT ** 2)),
      )) *
    1e12
  );
}
export function braggAngle(wavelengthPM: number, spacingPM: number) {
  const ratio = wavelengthPM / (2 * spacingPM);
  return ratio >= 0 && ratio <= 1 ? Math.asin(ratio) : null;
}

/** Repulsive Coulomb scattering: b and a share the same arbitrary length unit. */
export function rutherfordAngle(impact: number, scale = 1) {
  return 2 * Math.atan2(Math.max(1e-6, scale), Math.max(1e-8, Math.abs(impact)));
}
export function rutherfordTrajectory(impact: number, scale = 1) {
  // Velocity Verlet integrates a repulsive 1/r potential; trajectory and angle use the same a=k/(mv²).
  let x = -35,
    y = finiteClamp(impact, 0.05, 25),
    vx = 1,
    vy = 0;
  const a = finiteClamp(scale, 0.1, 3),
    dt = 0.025,
    points: { x: number; y: number }[] = [];
  const acceleration = (px: number, py: number) => {
    const r = Math.hypot(px, py);
    return [(a * px) / r ** 3, (a * py) / r ** 3];
  };
  let [ax, ay] = acceleration(x, y);
  for (let i = 0; i < 3300; i++) {
    if (i % 8 === 0) points.push({ x, y });
    x += vx * dt + 0.5 * ax * dt * dt;
    y += vy * dt + 0.5 * ay * dt * dt;
    const [nx, ny] = acceleration(x, y);
    vx += 0.5 * (ax + nx) * dt;
    vy += 0.5 * (ay + ny) * dt;
    ax = nx;
    ay = ny;
    if (Math.hypot(x, y) > 38 && i > 1400) break;
  }
  return points;
}

export function decayFraction(halfLives: number) {
  return 2 ** -finiteClamp(halfLives, 0, 20);
}
export function lorentzGamma(beta: number) {
  return 1 / Math.sqrt(1 - finiteClamp(beta, 0, 0.9999) ** 2);
}
export function muonSurvival(heightMeters: number, beta: number) {
  const speed = finiteClamp(beta, 0.01, 0.9999) * C_LIGHT;
  const seconds = finiteClamp(heightMeters, 0, 50000) / speed;
  return {
    classical: Math.exp(-seconds / 2.1969811e-6),
    relativistic: Math.exp(-seconds / (lorentzGamma(beta) * 2.1969811e-6)),
    seconds,
  };
}

/** Nonrelativistic crossed fields in a 6 cm region, followed by a field-free drift.
 * q is negative; +y is upward. A real wall/screen terminates the visible trajectory. */
export function thomsonTrajectory(electricField: number, magneticField: number, voltage = 200) {
  const speed = electronBeam(voltage, 0).speed;
  const e = finiteClamp(electricField, -4000, 4000),
    b = finiteClamp(magneticField, -0.0006, 0.0006);
  const omega = (-E_CHARGE * b) / ELECTRON_MASS;
  const inside = (time: number) => {
    if (Math.abs(b) < 1e-12)
      return {
        x: speed * time,
        y: ((-0.5 * E_CHARGE) / ELECTRON_MASS) * e * time * time,
        vx: speed,
        vy: (-E_CHARGE / ELECTRON_MASS) * e * time,
      };
    const drift = e / b,
      u = speed - drift;
    return {
      x: drift * time + (u * Math.sin(omega * time)) / omega,
      y: (u * (Math.cos(omega * time) - 1)) / omega,
      vx: drift + u * Math.cos(omega * time),
      vy: -u * Math.sin(omega * time),
    };
  };
  let exit: { time: number; x: number; y: number; vx: number; vy: number } | undefined;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 400; i++) {
    const time = (i * 0.15) / speed / 400;
    let point = exit
      ? { x: exit.x + exit.vx * (time - exit.time), y: exit.y + exit.vy * (time - exit.time) }
      : inside(time);
    if (!exit && point.x >= 0.06) {
      let lo = Math.max(0, time - 0.15 / speed / 400),
        hi = time;
      for (let j = 0; j < 30; j++) {
        const mid = (lo + hi) / 2;
        if (inside(mid).x < 0.06) lo = mid;
        else hi = mid;
      }
      exit = { ...inside(hi), time: hi };
      point = { x: exit.x + exit.vx * (time - hi), y: exit.y + exit.vy * (time - hi) };
    }
    if (point.x > 0.1 || Math.abs(point.y) > 0.04) {
      const previous = points.at(-1)!;
      const fraction = Math.min(
        point.x > 0.1 ? (0.1 - previous.x) / (point.x - previous.x) : 1,
        Math.abs(point.y) > 0.04
          ? (Math.sign(point.y) * 0.04 - previous.y) / (point.y - previous.y)
          : 1,
      );
      points.push({
        x: previous.x + fraction * (point.x - previous.x),
        y: previous.y + fraction * (point.y - previous.y),
      });
      break;
    }
    points.push({ x: point.x, y: point.y });
  }
  return { points, speed, electricField: e, magneticField: b };
}

/** Ideal Lorentzian quenching response around the hydrogen Lamb transition.
 * The 100 MHz FWHM and 80% contrast are illustrative instrument parameters. */
export function lambQuenching(frequencyMHz: number) {
  const frequency = finiteClamp(frequencyMHz, 800, 1300);
  const response = 1 / (1 + ((frequency - 1057.8) / 50) ** 2);
  return { frequency, response, survivingFraction: 1 - 0.8 * response };
}
