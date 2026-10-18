export function photoResistance(lux: number, ordinary = false) {
  return ordinary ? 10000 : 10000 * (Math.max(0.1, lux) / 10) ** -0.75;
}
export function ntcResistance(celsius: number, r25 = 10000, beta = 3950) {
  const kelvin = Math.max(1, celsius + 273.15);
  return r25 * Math.exp(beta * (1 / kelvin - 1 / 298.15));
}
export function reedSensor(distance: number) {
  const d = Math.max(0, distance),
    field = 0.02 / (1 + (d / 0.012) ** 3);
  return { field, closed: field >= 0.004 };
}
export function lightControl(lux: number, r1 = 30000, relay = false) {
  const resistance = photoResistance(lux),
    voltage = 6,
    baseVoltage = 0.7,
    beta = 120;
  const openVoltage = (voltage * resistance) / (r1 + resistance),
    baseCurrent = Math.max(0, (voltage - baseVoltage) / r1 - baseVoltage / resistance);
  const maximum = relay ? (voltage - 0.2) / 120 : (voltage - 0.2 - 1.8) / 330;
  const collectorCurrent = Math.min(maximum, beta * baseCurrent),
    on = relay ? collectorCurrent >= 0.025 : collectorCurrent > 0.001;
  return { resistance, openVoltage, baseCurrent, collectorCurrent, on };
}
export function bimetalState(celsius: number) {
  const curvature = (1.5 * (19e-6 - 10e-6) * (celsius - 20)) / 0.0004;
  const length = 0.04,
    angle = curvature * length;
  const deflection = Math.abs(curvature) < 1e-12 ? 0 : (1 - Math.cos(angle)) / curvature;
  return { curvature, angle, deflection, contact: celsius >= 60, heater: celsius < 60 };
}
/** Printed textbook example data, Elective2 p112. No claim of a new measurement. */
export const PRESSURE_DATA = [
  55.52, 34.63, 27.17, 25.26, 24.14, 22.12, 20.77, 18.96, 18.32, 17.65, 17, 15.33, 15.09, 14.74,
  13.98, 13.58,
].map((kohms, i) => ({ force: (i + 1) * 0.5, resistance: kohms * 1000 }));
export function pressureResistance(force: number) {
  const f = Math.max(0.5, Math.min(8, force)),
    index = Math.min(14, Math.floor((f - 0.5) / 0.5)),
    a = PRESSURE_DATA[index],
    b = PRESSURE_DATA[index + 1],
    q = (f - a.force) / 0.5;
  return {
    force: f,
    resistance: a.resistance + (b.resistance - a.resistance) * q,
    slope: (b.resistance - a.resistance) / 0.5,
  };
}
export type SensorApparatus =
  'reed' | 'light' | 'temperature' | 'alarm' | 'control' | 'bimetal' | 'pressure';
export function sensorShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    sweep = 0.5 - 0.5 * Math.cos(p * 2 * Math.PI);
  return {
    apparatus: (chapter === 0
      ? 'reed'
      : chapter < 3
        ? 'light'
        : chapter < 5
          ? 'temperature'
          : chapter === 5
            ? 'alarm'
            : chapter < 8
              ? 'control'
              : chapter === 8
                ? 'bimetal'
                : 'pressure') as SensorApparatus,
    distance: 0.004 + 0.04 * sweep,
    lux: 10 ** (3 - 3 * sweep),
    temperature: chapter === 3 ? 10 + 25 * sweep : 20 + 60 * sweep,
    ordinary: chapter === 2,
    water: chapter === 4,
    relay: chapter === 7,
    force:
      chapter === 11
        ? p < 0.5
          ? 0.8
          : 1.2
        : chapter === 10
          ? p < 0.5
            ? 1
            : 5
          : 0.5 + Math.floor(p * 15) * 0.5,
    sort: chapter === 11,
    stage: chapter,
    progress: p,
  };
}
