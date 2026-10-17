/** Saturation over liquid water, IAPWS equation reproduced in NIST Appendix A-I. */
export function dewSaturation(celsius: number) {
  if (!Number.isFinite(celsius) || celsius < 0 || celsius > 100)
    throw new RangeError('Liquid-water domain 0–100 °C');
  const T = celsius + 273.15,
    n = [
      1167.0521452767, -724213.16703206, -17.073846940092, 12020.82470247, -3232555.0322333,
      14.91510861353, -4823.2657361591, 405113.40542057, -0.23855557567849, 650.17534844798,
    ],
    v = T + n[8] / (T - n[9]),
    A = v * v + n[0] * v + n[1],
    B = n[2] * v * v + n[3] * v + n[4],
    C = n[5] * v * v + n[6] * v + n[7];
  return ((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4 * 1e6;
}
export function dewTemperature(vapor: number) {
  if (!Number.isFinite(vapor) || vapor < dewSaturation(0) || vapor > dewSaturation(100))
    throw new RangeError('Dewpoint outside liquid-water range');
  let lo = 0,
    hi = 100;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (dewSaturation(mid) < vapor) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export interface DewOptions {
  air?: number;
  humidity?: number;
  temperature?: number;
  pressure?: number;
}
export function dewState(o: DewOptions = {}) {
  const air = o.air ?? 30,
    humidity = o.humidity ?? 0.5,
    temperature = o.temperature ?? 20,
    pressure = o.pressure ?? 101325;
  if (
    ![air, humidity, temperature, pressure].every(Number.isFinite) ||
    air < 20 ||
    air > 35 ||
    humidity < 0.3 ||
    humidity > 1 ||
    temperature < 0 ||
    temperature > 40 ||
    pressure <= dewSaturation(40)
  )
    throw new RangeError('Air20–35 °C, RH.3–1, target0–40 °C and non-boiling pressure required');
  const vapor = humidity * dewSaturation(air),
    saturation = dewSaturation(temperature),
    point = dewTemperature(vapor),
    ratio = (e: number) => (0.62198 * e) / (pressure - e),
    total = ratio(vapor),
    gas = Math.min(total, ratio(saturation)),
    liquid = Math.max(0, total - gas),
    parcelVapor = (pressure * gas) / (0.62198 + gas),
    parcelHumidity = parcelVapor / saturation;
  return {
    air,
    humidity,
    temperature,
    pressure,
    vapor,
    saturation,
    point,
    total,
    gas,
    liquid,
    parcelVapor,
    parcelHumidity,
    condenses: vapor > saturation + 1e-8,
  };
}
export function dewShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { air: 30, humidity: 0.5, temperature: 30, parcel: false };
  if (chapter === 0) return { ...base, temperature: 30 - 10 * p };
  if (chapter === 1) return { ...base, temperature: 20 - 8 * p };
  if (chapter === 2) return { ...base, humidity: 0.3 + 0.5 * p, temperature: 15 };
  if (chapter === 3) {
    const air = 20 + 15 * p;
    return {
      ...base,
      air,
      humidity: (0.5 * dewSaturation(30)) / dewSaturation(air),
      temperature: 20,
    };
  }
  if (chapter === 4) return { ...base, parcel: true, temperature: 30 * (1 - p) };
  return { ...base, parcel: true, temperature: 30 * p };
}
