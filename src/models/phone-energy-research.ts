export type PhoneTask = 'browse' | 'chat' | 'call' | 'video' | 'audio' | 'game';
export interface PhoneTrial {
  task: PhoneTask;
  brightness: number;
  volume: number;
  radioFactor: number;
}
/** Synthetic teaching profiles in watts, not measurements of a phone model. */
export const PHONE_TASKS: Record<PhoneTask, { cpu: number; radio: number; audible: boolean }> = {
  browse: { cpu: 0.5, radio: 0.4, audible: false },
  chat: { cpu: 0.25, radio: 0.25, audible: false },
  call: { cpu: 0.12, radio: 0.45, audible: true },
  video: { cpu: 0.35, radio: 0.25, audible: true },
  audio: { cpu: 0.08, radio: 0.03, audible: true },
  game: { cpu: 1.6, radio: 0.45, audible: true },
};
function setup(p: PhoneTrial) {
  if (
    !PHONE_TASKS[p.task] ||
    ![p.brightness, p.volume, p.radioFactor].every(Number.isFinite) ||
    p.brightness < 0 ||
    p.brightness > 1 ||
    p.volume < 0 ||
    p.volume > 1 ||
    p.radioFactor < 1 ||
    p.radioFactor > 3
  )
    throw new RangeError('Valid synthetic phone settings required');
  return PHONE_TASKS[p.task];
}
export function phonePower(p: PhoneTrial, time = 0) {
  const task = setup(p);
  if (!Number.isFinite(time) || time < 0) throw new RangeError('Nonnegative finite time required');
  const idle = 0.18,
    display = 0.2 + 1.5 * p.brightness ** 1.4,
    cpu = task.cpu * (1 + 0.4 * Math.sin((2 * Math.PI * time) / 20)),
    radio = task.radio * p.radioFactor * (1 + 0.7 * Math.sin((2 * Math.PI * time) / 35)),
    audio = task.audible ? 0.02 + 0.6 * p.volume * p.volume : 0;
  return { idle, display, cpu, radio, audio, total: idle + display + cpu + radio + audio };
}
export function phoneEnergy(p: PhoneTrial, seconds: number) {
  const task = setup(p);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 900)
    throw new RangeError('Teaching duration from 0 to 900 seconds required');
  const fixed = phonePower(p, 0),
    oscillation = (amp: number, period: number) =>
      ((amp * period) / (2 * Math.PI)) * (1 - Math.cos((2 * Math.PI * seconds) / period)),
    components = {
      idle: fixed.idle * seconds,
      display: fixed.display * seconds,
      cpu: task.cpu * (seconds + oscillation(0.4, 20)),
      radio: task.radio * p.radioFactor * (seconds + oscillation(0.7, 35)),
      audio: fixed.audio * seconds,
    },
    joules = Object.values(components).reduce((a, b) => a + b, 0),
    wattHours = joules / 3600,
    capacityWh = 15,
    remaining = 80 - (100 * wattHours) / capacityWh;
  return {
    components,
    joules,
    wattHours,
    capacityWh,
    remaining,
    percentDisplay: Math.round(remaining),
    averagePower: seconds ? joules / seconds : 0,
  };
}
export function changedPhoneFactors(a: PhoneTrial, b: PhoneTrial) {
  return (['task', 'brightness', 'volume', 'radioFactor'] as const).filter(
    (key) => a[key] !== b[key],
  );
}
