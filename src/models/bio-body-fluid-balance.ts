const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
export function extracellularTracer(time: number, lymphOpen = true) {
  const end = clamp(time, 0, 40),
    dt = 0.02,
    volume = [3, 12, 1];
  let amount = [1, 0, 0];
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      c = amount.map((m, i) => m / volume[i]);
    const bt = 0.4 * c[0],
      tb = (lymphOpen ? 0.3 : 0.4) * c[1],
      tl = lymphOpen ? 0.1 * c[1] : 0,
      lb = lymphOpen ? 0.1 * c[2] : 0;
    amount = [
      amount[0] + (-bt + tb + lb) * step,
      amount[1] + (bt - tb - tl) * step,
      amount[2] + (tl - lb) * step,
    ];
  }
  return {
    amount,
    volume,
    concentration: amount.map((m, i) => m / volume[i]),
    total: amount.reduce((a, b) => a + b, 0),
  };
}
export const practiceTemperatureRecords = [36.3, 36.4, 36.5, 36.8, 36.9, 36.7, 36.6];
export const practiceHousehold = [
  practiceTemperatureRecords,
  [36.2, 36.3, 36.5, 36.7, 36.8, 36.6, 36.4],
  [36.5, 36.5, 36.7, 37, 37.1, 36.9, 36.7],
];
export const practiceAirTemperature = [18, 21, 25, 28, 25, 22, 20];
export const temperatureTimes = [6, 9, 12, 15, 18, 21, 23];
export function temperatureSummary(records: (number | null)[]) {
  const valid = records.filter((v): v is number => v !== null && Number.isFinite(v));
  return {
    count: valid.length,
    mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null,
    range: valid.length ? Math.max(...valid) - Math.min(...valid) : null,
  };
}
export function thermalRegulation(time: number, heat = 1, feedback = true) {
  const end = clamp(time, 0, 12),
    dt = 0.02;
  let deviation = 0,
    removed = 0,
    input = 0;
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      drive = clamp(heat, -1, 2) * (t < 4 ? 0.5 : 0),
      response = (feedback ? 0.65 : 0.08) * deviation;
    input += drive * step;
    removed += response * step;
    deviation += (drive - response) * step;
  }
  return {
    deviation,
    removed,
    input,
    drive: clamp(heat, -1, 2) * (end < 4 ? 0.5 : 0),
    response: (feedback ? 0.65 : 0.08) * deviation,
  };
}
export function waterRegulation(time: number, loss = 1, adh = true) {
  const end = clamp(time, 0, 10),
    dt = 0.02;
  let water = 1,
    urineTotal = 0,
    lossTotal = 0,
    intakeTotal = 0;
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      osmolarity = 1 / water,
      signal = adh ? Math.max(0, osmolarity - 1) * 8 : 0,
      urine = 0.025 / (1 + signal),
      external = clamp(loss, 0, 2) * (t < 3 ? 0.04 : 0),
      intake = 0.025;
    water = Math.max(0.1, water + (intake - external - urine) * step);
    urineTotal += urine * step;
    lossTotal += external * step;
    intakeTotal += intake * step;
  }
  const osmolarity = 1 / water,
    signal = adh ? Math.max(0, osmolarity - 1) * 8 : 0;
  return {
    water,
    osmolarity,
    signal,
    urine: 0.025 / (1 + signal),
    urineTotal,
    lossTotal,
    intakeTotal,
  };
}

/** Fixed water volume isolates the sodium ledger. Relative teaching units, not a renal clearance prediction. */
export function sodiumRegulation(time: number, loss = 1, feedback = true) {
  const end = clamp(time, 0, 10),
    dt = 0.02;
  let sodium = 1,
    intake = 0,
    externalLoss = 0,
    urineTotal = 0;
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      signal = feedback ? Math.max(0, 1 - sodium) * 12 : 0,
      urine = 0.025 / (1 + signal),
      external = clamp(loss, 0, 2) * (t < 3 ? 0.04 : 0);
    sodium += (0.025 - external - urine) * step;
    intake += 0.025 * step;
    externalLoss += external * step;
    urineTotal += urine * step;
  }
  const signal = feedback ? Math.max(0, 1 - sodium) * 12 : 0;
  return { sodium, signal, urine: 0.025 / (1 + signal), intake, externalLoss, urineTotal };
}
