/** Measurement/statistics demonstration; all displayed samples are explicitly synthetic. */
export const RAIN_REFERENCE_PH = 5.6;
const clamp = (x: number, a: number, b: number) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export function hydrogenActivity(ph: number) {
  return 10 ** -clamp(ph, 0, 14);
}
export function nernstSlope(temperatureC = 25) {
  return (
    (1000 * 8.31446261815324 * (clamp(temperatureC, 0, 60) + 273.15) * Math.LN10) / 96485.33212
  );
}
export function rainMeter(ph: number, calibrated = true, temperatureC = 25) {
  const truePH = clamp(ph, 0, 14),
    ideal = nernstSlope(temperatureC),
    gain = 0.96,
    offset = 12;
  const e = (x: number) => offset - gain * ideal * x;
  const voltage = e(truePH),
    buffer4 = e(4),
    buffer7 = e(7);
  const recoveredSlope = (buffer4 - buffer7) / 3,
    recoveredOffset = buffer4 + 4 * recoveredSlope;
  const indicated = calibrated ? (recoveredOffset - voltage) / recoveredSlope : -voltage / ideal;
  return {
    truePH,
    voltage,
    idealSlope: ideal,
    buffer4,
    buffer7,
    recoveredSlope,
    recoveredOffset,
    indicated,
    display: Math.round(indicated * 100) / 100,
    uncertainty: 0.15,
  };
}
export function rainPaper(ph: number) {
  const display = Math.round(clamp(ph, 1, 13));
  return { display, low: display - 0.5, high: display + 0.5 };
}
export function rainClassification(low: number, high: number) {
  if (high < RAIN_REFERENCE_PH) return 'below';
  if (low >= RAIN_REFERENCE_PH) return 'above';
  return 'unresolved';
}
export type RainRecord = { event: number; ph: number | null; amount: number; valid: boolean };
export const syntheticRainRecords: RainRecord[] = [
  { event: 1, ph: 5.8, amount: 7, valid: true },
  { event: 2, ph: 4.6, amount: 15, valid: true },
  { event: 3, ph: null, amount: 0, valid: false },
  { event: 4, ph: 5.4, amount: 3, valid: true },
  { event: 5, ph: 5.9, amount: 11, valid: true },
  { event: 6, ph: 4.9, amount: 6, valid: true },
  { event: 7, ph: 5.6, amount: 8, valid: true },
];
export function aggregateRain(records: RainRecord[]) {
  const valid = records.filter(
    (x) =>
      x.valid &&
      x.ph !== null &&
      Number.isFinite(x.ph) &&
      x.ph >= 0 &&
      x.ph <= 14 &&
      Number.isFinite(x.amount) &&
      x.amount > 0,
  );
  const amount = valid.reduce((a, b) => a + b.amount, 0);
  if (!amount) return { count: 0, amount: 0, meanPH: null, weightedPH: null, activity: null };
  const meanPH = valid.reduce((a, b) => a + b.ph!, 0) / valid.length;
  const activity = valid.reduce((a, b) => a + b.amount * hydrogenActivity(b.ph!), 0) / amount;
  return { count: valid.length, amount, meanPH, weightedPH: -Math.log10(activity), activity };
}
export function rainMeanExample(acidicFraction = 0.1) {
  const f = clamp(acidicFraction, 0, 1);
  return aggregateRain([
    { event: 1, ph: 4, amount: f * 100, valid: true },
    { event: 2, ph: 6, amount: (1 - f) * 100, valid: true },
  ]);
}
export function rainDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 4)),
    p = clamp(progress, 0, 1);
  return {
    chapter: c,
    progress: p,
    samplePH: c === 2 ? 5.55 : 4.8,
    calibrated: c !== 2 || p > 0.45,
    visibleEvents: c === 3 ? Math.min(7, 1 + Math.floor(p * 7)) : 7,
    acidicFraction: c === 4 ? 0.5 - 0.4 * p : 0.1,
  };
}
