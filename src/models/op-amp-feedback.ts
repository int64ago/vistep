export interface OpAmpParameters {
  gain: number;
  poleHz: number;
  slewRate: number;
  rail: number;
  feedbackResistance: number;
  groundResistance: number;
  feedback: boolean;
}
export const opAmpDefaults = (): OpAmpParameters => ({
  gain: 1e5,
  poleHz: 10,
  slewRate: 5e5,
  rail: 10,
  feedbackResistance: 90000,
  groundResistance: 10000,
  feedback: true,
});
function validate(p: OpAmpParameters, input: number) {
  if (
    ![p.gain, p.poleHz, p.slewRate, p.rail, p.feedbackResistance, p.groundResistance, input].every(
      Number.isFinite,
    ) ||
    p.gain <= 0 ||
    p.poleHz <= 0 ||
    p.slewRate <= 0 ||
    p.rail <= 0 ||
    p.feedbackResistance < 0 ||
    p.groundResistance <= 0 ||
    Math.abs(input) > 2
  )
    throw new RangeError('Finite positive amplifier parameters required');
}
function quantities(p: OpAmpParameters, input: number, output: number) {
  const beta = p.feedback ? p.groundResistance / (p.groundResistance + p.feedbackResistance) : 0,
    minus = beta * output,
    error = input - minus,
    closedGain = p.gain / (1 + p.gain * beta),
    target = closedGain * input,
    k = 2 * Math.PI * p.poleHz * (1 + p.gain * beta),
    rawRate = k * (target - output),
    rate =
      (output >= p.rail && rawRate > 0) || (output <= -p.rail && rawRate < 0)
        ? 0
        : Math.max(-p.slewRate, Math.min(p.slewRate, rawRate));
  return {
    ...p,
    input,
    output,
    beta,
    minus,
    error,
    closedGain,
    target,
    k,
    rate,
    dividerCurrent: p.feedback ? output / (p.groundResistance + p.feedbackResistance) : 0,
    saturated: Math.abs(output) >= p.rail - 1e-10,
    slewing: Math.abs(rate) >= p.slewRate * (1 - 1e-10),
  };
}
export function opAmpSteady(p: OpAmpParameters, input: number) {
  validate(p, input);
  const beta = p.feedback ? p.groundResistance / (p.groundResistance + p.feedbackResistance) : 0,
    raw = (p.gain * input) / (1 + p.gain * beta),
    output = Math.max(-p.rail, Math.min(p.rail, raw));
  return { ...quantities(p, input, output), time: 0, initial: output };
}
export function opAmpStep(p: OpAmpParameters, input: number, time: number, initial = 0) {
  validate(p, input);
  if (
    !Number.isFinite(time) ||
    time < 0 ||
    time > 1 ||
    !Number.isFinite(initial) ||
    Math.abs(initial) > p.rail
  )
    throw new RangeError('Bounded time and initial output required');
  const q = quantities(p, input, initial),
    distance = q.target - initial,
    direction = Math.sign(distance),
    threshold = p.slewRate / q.k,
    slewTime = Math.max(0, (Math.abs(distance) - threshold) / p.slewRate),
    unlimited =
      time <= slewTime
        ? initial + direction * p.slewRate * time
        : slewTime > 0
          ? q.target - direction * threshold * Math.exp(-q.k * (time - slewTime))
          : q.target - distance * Math.exp(-q.k * time),
    output = Math.max(-p.rail, Math.min(p.rail, unlimited));
  return { ...quantities(p, input, output), time, initial, slewTime };
}
export function opAmpShot(chapter: number, progress: number) {
  const p = opAmpDefaults(),
    u = Math.max(0, Math.min(1, progress));
  if (chapter === 0) {
    p.feedback = false;
    return { state: opAmpStep(p, 0.001, u * 0.003), kind: 'step' as const };
  }
  if (chapter === 1) return { state: opAmpStep(p, 0.5, u * 25e-6), kind: 'step' as const };
  if (chapter === 2) {
    p.feedbackResistance = 10000 + 80000 * u;
    return { state: opAmpSteady(p, 0.5), kind: 'steady' as const };
  }
  if (chapter === 3) {
    p.gain = 20 * 5000 ** u;
    return { state: opAmpSteady(p, 0.5), kind: 'steady' as const };
  }
  if (chapter === 4) return { state: opAmpSteady(p, 0.5 + u), kind: 'steady' as const };
  return { state: opAmpStep(p, 0.8, u * 25e-6), kind: 'step' as const };
}
