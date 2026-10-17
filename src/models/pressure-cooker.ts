/** IAPWS-IF97 region 4, Eq.30, coefficients Table34. Output Pa. */
export function cookerSaturation(celsius: number) {
  const T = celsius + 273.15;
  if (!Number.isFinite(T) || T < 273.15 || T > 647.096)
    throw new RangeError('IAPWS saturation temperature outside region4');
  const n = [
      1167.0521452767, -724213.16703206, -17.073846940092, 12020.82470247, -3232555.0322333,
      14.91510861353, -4823.2657361591, 405113.40542057, -0.23855557567849, 650.17534844798,
    ],
    v = T + n[8] / (T - n[9]),
    A = v * v + n[0] * v + n[1],
    B = n[2] * v * v + n[3] * v + n[4],
    C = n[5] * v * v + n[6] * v + n[7];
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4 * 1e6;
}
export function cookerBoiling(pressure: number) {
  if (!Number.isFinite(pressure) || pressure < cookerSaturation(0) || pressure > 22.064e6)
    throw new RangeError('Pressure outside saturation range');
  let lo = 0,
    hi = 373.946;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (cookerSaturation(mid) < pressure) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
/** Explicit approximate phase properties, internally consistent rigid-volume energy bookkeeping. */
export function cookerMixture(temperature: number, mass = 1) {
  if (
    ![temperature, mass].every(Number.isFinite) ||
    temperature < 80 ||
    temperature > 140 ||
    mass <= 0
  )
    throw new RangeError('Approximate mixture domain80–140 °C and positive mass');
  const pressure = cookerSaturation(temperature),
    volume = 0.002,
    vl = 0.001,
    vg = (461.526 * (temperature + 273.15)) / pressure,
    latent = 2.2564e6 - 2715 * (temperature - 100),
    vapor = (volume - mass * vl) / (vg - vl),
    liquid = mass - vapor,
    ul = 4180 * temperature,
    uv = ul + latent - pressure * (vg - vl),
    energy = liquid * ul + vapor * uv,
    hv = ul + latent + pressure * vl;
  if (vapor < 0 || liquid < 0)
    throw new RangeError('Mixture must retain both phases in 2 L vessel');
  return {
    pressure,
    volume,
    vl,
    vg,
    latent,
    vapor,
    liquid,
    energy,
    hv,
    dUdM: ul - (vl * latent) / (vg - vl) + pressure * vl,
  };
}
export interface CookerOptions {
  ambient?: number;
  weight?: number;
  power?: number;
  time?: number;
  sealed?: boolean;
}
export function cookerParameters(o: CookerOptions = {}) {
  const ambient = o.ambient ?? 101325,
    weight = o.weight ?? 0.033,
    power = o.power ?? 600,
    time = o.time ?? 0,
    sealed = o.sealed ?? true;
  if (
    ![ambient, weight, power, time].every(Number.isFinite) ||
    ambient < 70000 ||
    ambient > 105000 ||
    weight < 0.02 ||
    weight > 0.04 ||
    power < 0 ||
    power > 900 ||
    time < 0
  )
    throw new RangeError('Ambient70–105kPa, weight20–40g, power0–900W and nonnegative time');
  const radius = 0.001,
    area = Math.PI * radius ** 2,
    gauge = sealed ? (weight * 9.81) / area : 0,
    setPressure = ambient + gauge,
    startTemperature = cookerBoiling(ambient),
    setTemperature = cookerBoiling(setPressure),
    start = cookerMixture(startTemperature),
    set = cookerMixture(setTemperature),
    heatToSet = set.energy - start.energy;
  return {
    ambient,
    weight,
    power,
    time,
    sealed,
    radius,
    area,
    gauge,
    setPressure,
    startTemperature,
    setTemperature,
    start,
    set,
    heatToSet,
  };
}
/** Ideal-gas isentropic nozzle mass flux. Includes subcritical and choked branches. */
export function cookerNozzle(upstream: number, downstream: number, temperature: number) {
  if (
    ![upstream, downstream, temperature].every(Number.isFinite) ||
    upstream <= 0 ||
    downstream < 0 ||
    downstream > upstream ||
    temperature <= -273.15
  )
    throw new RangeError('Invalid nozzle state');
  const gamma = 1.3,
    R = 461.526,
    Cd = 0.7,
    r = downstream / upstream,
    critical = (2 / (gamma + 1)) ** (gamma / (gamma - 1)),
    factor =
      r <= critical
        ? Math.sqrt(gamma) * (2 / (gamma + 1)) ** ((gamma + 1) / (2 * (gamma - 1)))
        : Math.sqrt(
            Math.max(
              0,
              ((2 * gamma) / (gamma - 1)) * (r ** (2 / gamma) - r ** ((gamma + 1) / gamma)),
            ),
          );
  return ((Cd * upstream) / Math.sqrt(R * (temperature + 273.15))) * factor;
}
export function cookerState(o: CookerOptions = {}) {
  const p = cookerParameters(o),
    input = p.power * p.time,
    atSet = input >= p.heatToSet,
    regulated = p.sealed && atSet && p.power > 0;
  let temperature = p.startTemperature,
    mass = 1,
    out = 0,
    flow = 0;
  if (atSet) {
    temperature = p.setTemperature;
    const effective = p.set.hv - p.set.dUdM;
    out = Math.max(0, input - p.heatToSet) / effective;
    mass -= out;
    flow = p.power / effective;
  } else {
    let lo = p.startTemperature,
      hi = p.setTemperature;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (cookerMixture(mid).energy < p.start.energy + input) lo = mid;
      else hi = mid;
    }
    temperature = (lo + hi) / 2;
  }
  const mixture = cookerMixture(temperature, mass),
    gauge = mixture.pressure - p.ambient,
    upForce = gauge * p.area,
    weightForce = p.weight * 9.81,
    massFlux = regulated ? cookerNozzle(mixture.pressure, p.ambient, temperature) : 0,
    lift = regulated ? flow / (massFlux * 2 * Math.PI * p.radius) : 0;
  if (lift > p.radius / 2 + 1e-12) throw new RangeError('Ideal regulator throat capacity exceeded');
  return {
    ...p,
    ...mixture,
    temperature,
    mass,
    input,
    out,
    flow,
    regulated,
    atSet,
    gauge,
    upForce,
    weightForce,
    contact: Math.max(0, weightForce - upForce),
    lift,
  };
}
export function cookerShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { ambient: 101325, weight: 0.033, power: 600, sealed: true };
  const at = (o: typeof base) => ({ ...o, time: cookerParameters(o).heatToSet / o.power + 120 });
  if (chapter === 0) return { ...base, sealed: false, time: 120 * p };
  if (chapter === 1)
    return { ...base, time: (cookerParameters(base).heatToSet / base.power) * 0.95 * p };
  if (chapter === 2)
    return { ...base, time: cookerParameters(base).heatToSet / base.power + 120 * p };
  if (chapter === 3) return at({ ...base, power: 300 + 600 * p });
  if (chapter === 4) return at({ ...base, weight: 0.02 + 0.02 * p });
  return at({ ...base, ambient: 101325 - 31325 * p });
}
