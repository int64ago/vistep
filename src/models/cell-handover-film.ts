import {
  CH,
  CH_DEFAULT,
  CH_EAGER,
  chCompareWindow,
  chIdle,
  chNearestNotStrongest,
  chSimulate,
  type ChRun,
} from './cell-handover';
import { CH_LADDER, chLadder } from './cell-handover-ladder';

export type ChView = 'journey' | 'reuse' | 'boundary' | 'listen' | 'compare' | 'ladder' | 'idle';
const views: ChView[] = ['journey', 'reuse', 'boundary', 'listen', 'compare', 'ladder', 'idle'];

const smooth = (v: number) => {
  const p = Math.max(0, Math.min(1, v));
  return p * p * (3 - 2 * p);
};
export const chRamp = (p: number, start: number, end: number) =>
  smooth((p - start) / (end - start));
const linear = (p: number, start: number, end: number) =>
  Math.max(0, Math.min(1, (p - start) / (end - start)));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

let plan: ReturnType<typeof buildPlan> | null = null;
function buildPlan() {
  const tuned = chSimulate(CH_DEFAULT),
    eager = chSimulate(CH_EAGER);
  const window = chCompareWindow(eager, tuned);
  const probe = chNearestNotStrongest(tuned);
  if (!window || !probe) throw new Error('Film plan requires a comparison window and a probe');
  const idle = chIdle(tuned);
  const at = (i: number) => i / (tuned.count - 1);
  const handover = window.tuned[0];
  // Slow motion around the tuned report: time-to-trigger is only 320 ms of real time.
  const report = handover
    ? [...tuned.events].reverse().find((e) => e.kind === 'report' && e.i <= handover.i)
    : undefined;
  const span = window.endIndex - window.startIndex;
  const slow = report
    ? [
        Math.max(
          0.05,
          (report.i - (CH_DEFAULT.tttMs / 1000 + 0.25) / tuned.dt - window.startIndex) / span,
        ),
        Math.min(0.95, (handover!.i + 0.2 / tuned.dt - window.startIndex) / span),
      ]
    : [0.4, 0.6];
  const tau = idle.updates[0];
  // Idle drive, as [chapter progress, route fraction] keyframes: the two silent reselections
  // before the tracking-area update fall under the sentence about reselecting quietly, the update
  // under the sentence about reporting, and the phone then waits for the call.
  const quiet = tau ? idle.reselections.filter((k) => k < tau.i).slice(-2) : [];
  const tauAt = tau ? at(tau.i) : 0.42;
  const r1 = quiet[0] !== undefined ? at(quiet[0]) : tauAt - 0.1,
    r2 = quiet[1] !== undefined ? at(quiet[1]) : tauAt - 0.05;
  const idlePath: [number, number][] = [
    [0.08, r1 - 0.012],
    [0.22, r1 + 0.001],
    [0.31, r2 + 0.001],
    [0.4, tauAt + 0.001],
    [0.54, Math.min(0.97, tauAt + 0.07)],
  ];
  // Handover ladder, as [chapter progress, ms] keyframes that follow the spoken order: report,
  // preparation up to the command, the forwarding gap, then the path switch and release.
  const L = chLadder(),
    msg = (id: string) => L.messages.find((m) => m.id === id)!;
  const ladderPath: [number, number][] = [
    [0.04, CH_LADDER.startMs],
    [0.15, msg('report').send],
    [0.37, msg('command').send],
    [0.7, msg('complete').arrive],
    [0.76, msg('path').send],
    [0.88, msg('release').arrive],
    [0.95, CH_LADDER.endMs],
  ];
  return {
    tuned,
    eager,
    window,
    idle,
    probeFraction: at(probe.i),
    probe,
    /** Where the one tuned handover of the comparison happens: the ladder zooms into it. */
    handoverFraction: handover ? at(handover.i) : (window.start + window.end) / 2,
    handover,
    slow,
    listenEnd: Math.max(0.3, window.start - 0.012),
    idleStart: idlePath[0][1],
    idleEnd: idlePath[idlePath.length - 1][1],
    idlePath,
    ladderPath,
    tauFraction: tau ? at(tau.i) : -1,
  };
}
/** Everything the film shows is derived once from the same two simulations. */
export function chFilmPlan() {
  plan ??= buildPlan();
  return plan;
}

export type ChShot = {
  view: ChView;
  /** Route fraction of the tracked phone, and which simulation it follows. */
  phone: number;
  phoneOpacity: number;
  run: 'tuned' | 'eager';
  /** 0 = full map, 1 = the chapter's close view. */
  zoom: number;
  hex: number;
  field: number;
  /** 0 = propagation without shadowing, 1 = with the seeded shadowing field. */
  shadow: number;
  /** Left-to-right reveal of a freshly computed field. */
  reveal: number;
  users: number;
  dense: number;
  probe: number;
  /** How much of the connected run's trace or the comparison lanes is visible. */
  trace: number;
  compareEager: number;
  compareTuned: number;
  band: number;
  ladderMs: number;
  ta: number;
  /** Progress of the tracking-area update message towards the core (0 before, 1 delivered). */
  update: number;
  paging: number;
  answer: number;
  /** Deterministic motion phase for pulses (seconds of chapter time). */
  pulse: number;
};

/** Chapter-relative and deterministic: a seek reconstructs the entire teaching state. */
export function chShot(chapter: number, progress: number, chapterTime = 0): ChShot {
  if (![chapter, progress, chapterTime].every(Number.isFinite))
    throw new RangeError('Finite film position required');
  const c = Math.max(0, Math.min(6, Math.floor(chapter)));
  const p = Math.max(0, Math.min(1, progress));
  const f = chFilmPlan();
  const shot: ChShot = {
    view: views[c],
    phone: 0,
    phoneOpacity: 1,
    run: 'tuned',
    zoom: 0,
    hex: 0,
    field: 1,
    shadow: 1,
    reveal: 1,
    users: 0,
    dense: 0,
    probe: 0,
    trace: 0,
    compareEager: 0,
    compareTuned: 0,
    band: 0,
    ladderMs: CH_LADDER.startMs,
    ta: 0,
    update: 0,
    paging: 0,
    answer: 0,
    pulse: Math.max(0, chapterTime),
  };
  // The phone fades rather than sliding backwards whenever a chapter starts elsewhere on the route.
  const arrive = (from: number, to: number) => {
    shot.phoneOpacity = p < 0.05 ? 1 - p / 0.05 : Math.min(1, (p - 0.05) / 0.05);
    shot.phone = p < 0.05 ? from : to;
  };
  if (c === 0) {
    shot.hex = 1 - 0.55 * chRamp(p, 0.9, 1);
    shot.field = 0;
    shot.phone = linear(p, 0.06, 0.94);
    shot.trace = shot.phone;
  } else if (c === 1) {
    arrive(1, f.probeFraction);
    shot.hex = 0.45;
    shot.field = 0;
    shot.users = chRamp(p, 0.04, 0.16);
    shot.dense = chRamp(p, 0.5, 0.64);
    shot.zoom = chRamp(p, 0.2, 0.36) * 0.6;
  } else if (c === 2) {
    shot.phone = f.probeFraction;
    shot.hex = 0.9 - 0.9 * chRamp(p, 0.7, 0.8);
    shot.field = chRamp(p, 0.1, 0.16);
    shot.reveal = linear(p, 0.12, 0.42);
    shot.shadow = chRamp(p, 0.48, 0.68);
    shot.probe = chRamp(p, 0.76, 0.84);
  } else if (c === 3) {
    arrive(f.probeFraction, lerp(0, f.listenEnd, linear(p, 0.08, 0.92)));
    shot.trace = shot.phone;
  } else if (c === 4) {
    const { start, end } = f.window;
    shot.zoom = chRamp(p, 0, 0.08);
    const eager = linear(p, 0.08, 0.44),
      u = linear(p, 0.52, 0.9),
      [a, b] = f.slow;
    // 35% of the pass reaches the trigger, 45% plays the trigger slowly, 20% finishes.
    const tuned =
      u < 0.35
        ? (a * u) / 0.35
        : u < 0.8
          ? a + ((b - a) * (u - 0.35)) / 0.45
          : b + ((1 - b) * (u - 0.8)) / 0.2;
    shot.run = p < 0.48 ? 'eager' : 'tuned';
    shot.phone = p < 0.48 ? lerp(start, end, eager) : lerp(start, end, tuned);
    shot.phoneOpacity =
      p < 0.44 ? 1 : p < 0.48 ? 1 - (p - 0.44) / 0.04 : Math.min(1, (p - 0.48) / 0.04);
    shot.compareEager = eager;
    shot.compareTuned = tuned;
    shot.band = chRamp(p, 0.47, 0.53);
  } else if (c === 5) {
    shot.phone = f.handoverFraction;
    shot.ladderMs = chKeyframes(f.ladderPath, p);
  } else {
    shot.ta = chRamp(p, 0, 0.1);
    arrive(f.handoverFraction, chKeyframes(f.idlePath, p));
    // The update is sent the moment the phone camps in the new area; give it two seconds on screen.
    shot.update = f.tauFraction < 0 ? 0 : linear(p, 0.4, 0.5);
    shot.paging = linear(p, 0.56, 0.78);
    shot.answer = chRamp(p, 0.78, 0.84);
  }
  return shot;
}

/** Piecewise-linear interpolation through [x, y] keyframes (clamped at both ends). */
export function chKeyframes(points: readonly (readonly [number, number])[], x: number) {
  if (!points.length || !Number.isFinite(x)) throw new RangeError('Invalid keyframes');
  if (x <= points[0][0]) return points[0][1];
  for (let k = 1; k < points.length; k++)
    if (x <= points[k][0]) {
      const [x0, y0] = points[k - 1],
        [x1, y1] = points[k];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  return points[points.length - 1][1];
}

/** Index into a run for a route fraction. */
export const chSample = (run: ChRun, fraction: number) =>
  Math.max(0, Math.min(run.count - 1, Math.round(fraction * (run.count - 1))));

/** Seconds of real travel represented by a route fraction at the film's speed. */
export const chSeconds = (run: ChRun, fraction: number) => fraction * (run.count - 1) * run.dt;

export const CH_FILM = { speedKmh: CH_DEFAULT.speedKmh, sigmaDb: CH.shadowSigmaDb };
