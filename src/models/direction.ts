/** A chapter-relative clock lets narration windows change without retiming the scientific model. */
export type StoryClock = {
  time: number;
  chapter: number;
  chapterTime: number;
  chapterProgress: number;
  duration: number;
  chapters: { at: number }[];
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export function spanProgress(clock: StoryClock, start: number, end: number) {
  return clamp(
    (clock.time - clock.chapters[start].at) /
      ((clock.chapters[end]?.at ?? clock.duration) - clock.chapters[start].at),
  );
}
export function bicycleShot(clock: StoryClock) {
  const c = clock.chapter,
    q = clock.chapterProgress;
  const rear =
    c < 4
      ? 24
      : c < 6
        ? 12
        : c < 9
          ? 32
          : c === 9
            ? 24
            : c === 10
              ? 12
              : [24, 12, 32][Math.min(2, Math.floor(q * 3))];
  const cadence = c === 8 ? 30 + 50 * q : c === 10 ? 60 : 45;
  let turns = 0;
  for (let i = 0; i <= c; i++) {
    const duration = (clock.chapters[i + 1]?.at ?? clock.duration) - clock.chapters[i].at;
    const elapsed = Math.max(0, Math.min(duration, clock.time - clock.chapters[i].at));
    turns +=
      (i === 8
        ? 30 * elapsed + (25 * elapsed * elapsed) / duration
        : (i === 10 ? 60 : 45) * elapsed) / 60;
  }
  return {
    front: c === 10 ? 50 : 34,
    rear,
    cadence,
    turns,
    slope: c === 7 ? 4 + 6 * smooth(q) : 4,
    closeup: c === 1 || c === 2 || c === 5,
  };
}
export function printerShot(clock: StoryClock) {
  const c = clock.chapter,
    q = smooth(clock.chapterProgress);
  const progress =
    c < 2
      ? 0
      : c === 2
        ? 0.97 * q
        : c === 3
          ? 1 + 0.97 * q
          : c === 4
            ? 2 + 0.85 * q
            : c === 5
              ? 2.85 + 0.12 * q
              : c === 6
                ? 3 + 0.97 * q
                : c === 7
                  ? 4 + 0.97 * q
                  : c === 8
                    ? 5 + 0.97 * q
                    : c === 9
                      ? 5.99 * q
                      : c === 10
                        ? 5 + 0.99 * q
                        : 5.99;
  return {
    progress,
    exploded: c > 0 || q > 0.5,
    view: c === 3 ? ('top' as const) : ('perspective' as const),
    focus: [2, 3, 4, 5, 6, 7].includes(c),
  };
}
export function refrigeratorShot(clock: StoryClock) {
  const c = clock.chapter,
    q = clock.chapterProgress;
  const phase =
    c === 2
      ? q * 0.999
      : c === 3
        ? 1 + q * 0.999
        : c === 4
          ? q < 0.5
            ? 1.45
            : 3.45
          : c === 5
            ? 2 + q * 0.999
            : c === 6
              ? 3 + q * 0.999
              : q * 3.999;
  return { phase, cop: c === 8 ? 2 + 2 * smooth(q) : 2.5, power: 80, cutaway: c > 0 || q > 0.3 };
}
export function noiseShot(clock: StoryClock) {
  const c = clock.chapter,
    q = smooth(clock.chapterProgress);
  return {
    amplitude: c === 0 ? 0 : c === 1 ? q : c === 4 ? 1 - 0.6 * q : c === 5 ? 0.4 + 0.6 * q : 1,
    phase: c < 2 ? 0 : c === 2 ? 90 * q : c === 3 ? 90 + 90 * q : 180,
    delay: c === 6 ? 2 * q : c === 7 || c === 8 ? 2 : c === 9 ? 2 * (1 - q) : 0,
    frequency: c === 7 ? 160 + 240 * q : 160,
  };
}
export function gpsStoryTime(clock: StoryClock) {
  const ranges = [
    [0, 0],
    [0, 6.99],
    [7, 13.99],
    [14, 18],
    [18, 21.99],
    [22, 23.99],
    [24, 24.5],
    [24.5, 24.99],
    [25, 29.99],
    [30, 32],
    [32, 34],
    [34, 38],
  ];
  const [from, to] = ranges[clock.chapter];
  return from + (to - from) * clock.chapterProgress;
}
