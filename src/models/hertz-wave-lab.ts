const finite = (...values: number[]) => {
  if (!values.every(Number.isFinite)) throw new RangeError('Finite wave inputs required');
};
const positive = (x: number) => {
  finite(x);
  if (x <= 0) throw new RangeError('Positive wave scale required');
};
export const LIGHT_SPEED = 299792458;
export function hertzPulse(time: number, distance = 0, angle = 0, frequency = 1e8) {
  finite(time, distance, angle);
  positive(frequency);
  const delay = Math.max(0, distance) / LIGHT_SPEED,
    local = time - delay;
  const emitted = (u: number) =>
    u < 0 ? 0 : Math.exp(-u / 25e-9) * Math.sin(2 * Math.PI * frequency * u);
  const result = {
    source: emitted(time),
    received: (emitted(local) * Math.cos(angle)) / (1 + Math.max(0, distance)),
    delay,
    wavelength: LIGHT_SPEED / frequency,
    local,
  };
  finite(...Object.values(result));
  return result;
}
export function standingField(x: number, time: number, wall = 6, frequency = 1e8) {
  finite(x, time, wall);
  positive(frequency);
  const k = (2 * Math.PI * frequency) / LIGHT_SPEED,
    w = 2 * Math.PI * frequency;
  const result = Math.sin(w * time - k * x) - Math.sin(w * time + k * x - 2 * k * wall);
  finite(result);
  return result;
}
export function snellAngle(incident: number, index = 1.5) {
  finite(incident, index);
  return Math.asin(Math.sin(incident) / Math.max(1, index));
}
export function slitIntensity(angle: number, width = 1.2, wavelength = 1) {
  finite(angle, width);
  positive(wavelength);
  if (width < 0) throw new RangeError('Nonnegative aperture required');
  const b = (Math.PI * width * Math.sin(angle)) / wavelength;
  finite(b);
  return Math.abs(b) < 1e-8 ? 1 : (Math.sin(b) / b) ** 2;
}
export function hertzShot(chapter: number, progress: number) {
  finite(chapter, progress);
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: Math.min(5, chapter),
    time: p * 120e-9,
    angle: chapter === 4 ? (p * Math.PI) / 2 : 0,
    incident: ((20 + p * 35) * Math.PI) / 180,
    width: chapter === 5 ? (p < 0.5 ? 2 : 0.7) : 1.2,
  };
}

export type HertzState = {
  mode: number;
  time: number;
  angle: number;
  incident: number;
  width: number;
  view: 'apparatus' | 'signal' | 'projection';
  measure: boolean;
};
const fraction = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/** These are editorial clocks in seconds. The original physical functions are unchanged. */
export function hertzFilmState(
  chapter: number,
  chapterTime: number,
  locale: 'zh' | 'en' = 'zh',
): HertzState {
  finite(chapter, chapterTime);
  const c = Math.max(0, Math.min(5, Math.floor(chapter))),
    t = Math.max(0, chapterTime),
    en = locale === 'en';
  const s: HertzState = {
    mode: c,
    time: 12.506922856e-9,
    angle: 0,
    incident: (35 * Math.PI) / 180,
    width: 2,
    view: 'apparatus',
    measure: false,
  };
  if (c === 0) {
    s.time = (t < 7 ? fraction(t, 0, 7) * 8 : 8 + fraction(t, 7, 15) * 5) * 1e-9;
  }
  if (c === 1) {
    s.time = (t < 7 ? fraction(t, 0, 7) * 12.5 : 12.5 + fraction(t, 7, 18) * 12.5) * 1e-9;
    s.view = t < (en ? 7.5 : 7.7) ? 'apparatus' : 'signal';
  }
  if (c === 2) {
    s.time = (13 + t * 0.3) * 1e-9;
    s.measure = t >= (en ? 8 : 9.85);
  }
  if (c === 3) {
    s.incident = ((20 + 35 * fraction(t, en ? 11.73 : 12.15, en ? 14.57 : 15.39)) * Math.PI) / 180;
  }
  if (c === 4) {
    s.angle = (fraction(t, en ? 2.51 : 2.57, 9.67) * Math.PI) / 2;
    s.view = t < 2.4 ? 'apparatus' : 'projection';
  }
  if (c === 5) {
    s.width = 2 - 1.3 * fraction(t, 4.5, 9.5);
    s.measure = t >= 9.5;
  }
  return s;
}
/** Same point of one received packet is held while the loop orientation is changed. */
export function hertzProjection(angle: number, time = 3 / LIGHT_SPEED + 2.5e-9) {
  finite(angle, time);
  const aligned = hertzPulse(time, 3, 0).received,
    received = hertzPulse(time, 3, angle).received;
  return { aligned, received, power: Math.cos(angle) ** 2 };
}
