/**
 * A deterministic, quasistatic teaching section of keyboard switches.
 *
 * CHERRY MX2A pre-travel, total travel, actuation force and the Brown/Blue
 * pressure-point forces are published nominal specifications. The continuous
 * force curves, reset distances, contact gap, click-jacket trajectory and all
 * internal display dimensions are teaching fits, NOT measurements or CAD.
 * Hall/optical examples are generic mechanisms, not CHERRY MX products.
 *
 * Primary sources:
 * https://www.cherry.de/en-gb/product/mx2a-red (and the named product pages below)
 * https://www.cherry.de/fr-fr/produit/mx2a-brown
 * https://www.cherry.de/fileadmin/media/Industrial/Switch/MX_BLUE/Data_sheet_MX2A_Blue.pdf
 * https://help.wooting.io/article/102-how-to-set-up-rapid-trigger
 * https://wooting.io/post/introducing-the-lekker-switch
 * https://www.razer.com/gb-en/razer-optical-switch
 */
export type KeyboardSwitchVariant =
  'red' | 'black' | 'brown' | 'blue' | 'silver' | 'silent-red' | 'hall' | 'optical';
export type KeyboardSwitchFamily = 'linear' | 'tactile' | 'clicky';
export type KeyboardSwitchDirection = 'press' | 'release';
export type KeyboardSwitchPoint = [number, number, number];
export type KeyboardSwitchSpec = {
  family: KeyboardSwitchFamily;
  detection: 'contact' | 'hall' | 'optical';
  totalTravelMm: number;
  maxTravelMm: number;
  preTravelMm: number;
  actuationMm: number;
  /** Illustrative mechanical reset, or the selected electronic threshold. */
  releaseMm: number;
  actuationForceCn: number;
  pressurePointForceCn: number | null;
  published: boolean;
  sourceUrl: string;
};
const spec = (
  family: KeyboardSwitchFamily,
  totalTravelMm: number,
  preTravelMm: number,
  releaseMm: number,
  actuationForceCn: number,
  product: string,
  pressurePointForceCn: number | null = null,
  detection: KeyboardSwitchSpec['detection'] = 'contact',
): KeyboardSwitchSpec => ({
  family,
  detection,
  totalTravelMm,
  maxTravelMm: totalTravelMm,
  preTravelMm,
  actuationMm: preTravelMm,
  releaseMm,
  actuationForceCn,
  pressurePointForceCn,
  published: detection === 'contact',
  sourceUrl: product.startsWith('https:')
    ? product
    : `https://www.cherry.de/en-gb/product/mx2a-${product}`,
});
export const KEYBOARD_SWITCH_SPECS: Readonly<Record<KeyboardSwitchVariant, KeyboardSwitchSpec>> = {
  red: spec('linear', 4, 2, 1.85, 45, 'red'),
  black: spec('linear', 4, 2, 1.85, 60, 'black'),
  brown: spec('tactile', 4, 2, 1.65, 45, 'brown', 55),
  blue: spec('clicky', 4, 2.2, 1.4, 50, 'blue', 60),
  silver: spec('linear', 3.4, 1.2, 1.05, 45, 'speed-silver'),
  'silent-red': spec('linear', 3.7, 1.9, 1.75, 45, 'silent-red'),
  hall: spec(
    'linear',
    4,
    2,
    2,
    45,
    'https://wooting.io/post/introducing-the-lekker-switch',
    null,
    'hall',
  ),
  optical: spec(
    'linear',
    4,
    2,
    2,
    45,
    'https://www.razer.com/gb-en/razer-optical-switch',
    null,
    'optical',
  ),
};
export const KEYBOARD_SWITCH_VARIANTS = Object.keys(
  KEYBOARD_SWITCH_SPECS,
) as KeyboardSwitchVariant[];
export const KEYBOARD_SWITCH_GEOMETRY = {
  springBottomYmm: 2,
  springRestTopYmm: 11,
  contactMaxGapMm: 0.65,
  contactFixedPoint: [5.35, 6.7, 2.1] as KeyboardSwitchPoint,
  sleeveFloatMm: 0.65,
  hallMagnetRestYmm: 6.7,
  hallSensorYmm: 0.34,
  opticalBeamYmm: 4.5,
  opticalBeamRadiusMm: 0.1,
  opticalApertureHalfHeightMm: 2.1,
};
export type KeyboardSwitchOptions = {
  motion?: 'cycle' | 'rapid';
  /** A partial stroke is useful for showing actuation before bottoming. */
  peakTravelMm?: number;
  hallThresholdMm?: number;
  rapidPressMm?: number;
  rapidReleaseMm?: number;
  /** Default is ordinary RT: crossing above the initial point resets arming. */
  rapidContinuous?: boolean;
};
export type KeyboardRapidState = {
  active: boolean;
  armed: boolean;
  referenceMm: number;
  nextThresholdMm: number;
};
export type KeyboardSwitchState = {
  variant: KeyboardSwitchVariant;
  family: KeyboardSwitchFamily;
  phase: number;
  direction: KeyboardSwitchDirection;
  travelMm: number;
  totalTravelMm: number;
  maxTravelMm: number;
  actuationMm: number;
  releaseMm: number;
  forceCn: number;
  springForceCn: number;
  leafForceCn: number;
  stemOffsetMm: number;
  springCompressionMm: number;
  springLengthMm: number;
  springBottom: KeyboardSwitchPoint;
  springTop: KeyboardSwitchPoint;
  contactGapMm: number;
  contact: {
    present: boolean;
    gapMm: number;
    closed: boolean;
    leafDeflectionMm: number;
    fixedPoint: KeyboardSwitchPoint;
    movingPoint: KeyboardSwitchPoint;
  };
  click: {
    present: boolean;
    sleeveTravelMm: number;
    sleeveOffsetMm: number;
    relativeTravelMm: number;
    event: 'down' | 'up' | null;
    progress: number;
    intensity: number;
  };
  silent: { bottomCompressionMm: number; topCompressionMm: number };
  hall: {
    signal: number;
    distanceMm: number;
    magnetYmm: number;
    sensorYmm: number;
    thresholdMm: number;
    fixedActive: boolean;
    rapidActive: boolean;
    armed: boolean;
    referenceMm: number;
    nextThresholdMm: number;
    pressDistanceMm: number;
    releaseDistanceMm: number;
    continuous: boolean;
  };
  optical: {
    transmission: number;
    active: boolean;
    beamYmm: number;
    beamRadiusMm: number;
    /** Signed aperture-centre offset ABOVE the fixed beam, not absolute y. */
    apertureCenterMm: number;
    apertureHalfHeightMm: number;
  };
  active: boolean;
};

const clamp = (x: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const ramp = (x: number, lo: number, hi: number) => smooth((x - lo) / (hi - lo));

/** Shape-preserving interpolation of an authored quasi-static force path. */
function forcePath(x: number, points: ReadonlyArray<readonly [number, number]>) {
  for (let i = 1; i < points.length; i++) {
    const [a, fa] = points[i - 1],
      [b, fb] = points[i];
    if (x <= b) return fa + (fb - fa) * smooth((x - a) / (b - a));
  }
  return points[points.length - 1][1];
}
function springForce(variant: KeyboardSwitchVariant, travelMm: number) {
  const s = KEYBOARD_SWITCH_SPECS[variant];
  if (variant === 'brown') return 25 + 7.5 * travelMm;
  if (variant === 'blue') return 25 + 7 * travelMm;
  const initial = variant === 'black' ? 40 : 30;
  return initial + ((s.actuationForceCn - initial) / s.preTravelMm) * travelMm;
}

/** Force in cN (1 cN = 0.01 N). Published anchor points; intervening teaching fit.
 * The illustrative return envelope never exceeds the press envelope: even a
 * partial closed travel loop cannot produce net mechanical energy. These are
 * not measured minor hysteresis loops or a dynamic snap-through force solution. */
export function keyboardSwitchForceAt(
  variant: KeyboardSwitchVariant,
  travelMm: number,
  direction: KeyboardSwitchDirection = 'press',
): number {
  const d = clamp(travelMm, 0, KEYBOARD_SWITCH_SPECS[variant].totalTravelMm);
  if (variant === 'brown') {
    return direction === 'press'
      ? forcePath(d, [
          [0, 30],
          [0.9, 39],
          [1.5, 55],
          [1.85, 43],
          [2, 45],
          [4, 65],
        ])
      : Math.min(
          keyboardSwitchForceAt(variant, d, 'press'),
          forcePath(d, [
            [0, 30],
            [0.65, 34],
            [1.15, 47],
            [1.65, 37],
            [2, 41],
            [4, 65],
          ]),
        );
  }
  if (variant === 'blue') {
    return direction === 'press'
      ? forcePath(d, [
          [0, 25],
          [1.4, 42],
          [2.05, 60],
          [2.2, 50],
          [2.4, 47],
          [4, 65],
        ])
      : Math.min(
          keyboardSwitchForceAt(variant, d, 'press'),
          forcePath(d, [
            [0, 25],
            [0.7, 32],
            [1.35, 45],
            [1.6, 34],
            [2.2, 42],
            [4, 65],
          ]),
        );
  }
  const bottomPad = variant === 'silent-red' ? Math.max(0, d - 3.45) : 0;
  return springForce(variant, d) + 100 * bottomPad ** 2;
}
/** Short alias for consumers drawing the two branches. */
export const forceAt = keyboardSwitchForceAt;
export function keyboardSwitchForceCurve(variant: KeyboardSwitchVariant, samples = 81) {
  const count = Math.round(clamp(samples, 2, 1001));
  return Array.from({ length: count }, (_, i) => {
    const travelMm = (i / (count - 1)) * KEYBOARD_SWITCH_SPECS[variant].totalTravelMm;
    return {
      travelMm,
      pressCn: keyboardSwitchForceAt(variant, travelMm, 'press'),
      releaseCn: keyboardSwitchForceAt(variant, travelMm, 'release'),
    };
  });
}

/** Uncalibrated, monotonic dipole-like demonstration, normalized to [0,1].
 * This is not a finite-magnet field solution, sensor voltage, or mT readout. */
export function keyboardHallSignal(travelMm: number) {
  const rest = KEYBOARD_SWITCH_GEOMETRY.hallMagnetRestYmm - KEYBOARD_SWITCH_GEOMETRY.hallSensorYmm;
  const d = clamp(travelMm, 0, 4),
    low = rest ** -3,
    high = (rest - 4) ** -3;
  return ((rest - d) ** -3 - low) / (high - low);
}
export function keyboardHallPosition(signal: number) {
  const rest = KEYBOARD_SWITCH_GEOMETRY.hallMagnetRestYmm - KEYBOARD_SWITCH_GEOMETRY.hallSensorYmm;
  const low = rest ** -3,
    high = (rest - 4) ** -3;
  return rest - (low + clamp(signal) * (high - low)) ** (-1 / 3);
}

function rapidSettings(options: KeyboardSwitchOptions) {
  return {
    threshold: clamp(options.hallThresholdMm ?? 2, 0.2, 3.8),
    press: clamp(options.rapidPressMm ?? 0.3, 0.05, 1),
    release: clamp(options.rapidReleaseMm ?? 0.3, 0.05, 1),
    continuous: options.rapidContinuous ?? false,
  };
}
/** Replay extrema of a piecewise monotonic travel history. Adding samples within
 * any monotonic segment cannot change this result: no timestep or velocity rule.
 * Ordinary RT leaves its operating region above the initial point; optional
 * continuous RT stays armed until fully released. Neither is mechanical feel. */
export function keyboardRapidReplay(
  historyMm: readonly number[],
  options: KeyboardSwitchOptions = {},
): KeyboardRapidState {
  const cfg = rapidSettings(options);
  let active = false,
    armed = false,
    referenceMm = 0;
  for (const raw of historyMm) {
    const d = clamp(raw, 0, 4);
    if (d <= 0.000001 || (!cfg.continuous && d < cfg.threshold)) {
      active = false;
      armed = false;
      referenceMm = d;
    } else if (!armed) {
      if (d >= cfg.threshold) {
        active = true;
        armed = true;
        referenceMm = d;
      }
    } else if (active) {
      referenceMm = Math.max(referenceMm, d);
      if (referenceMm - d >= cfg.release - 1e-10) {
        active = false;
        referenceMm = d;
      }
    } else {
      referenceMm = Math.min(referenceMm, d);
      if (d - referenceMm >= cfg.press - 1e-10) {
        active = true;
        referenceMm = d;
      }
    }
  }
  return {
    active,
    armed,
    referenceMm,
    nextThresholdMm: !armed
      ? cfg.threshold
      : active
        ? Math.max(cfg.continuous ? 0 : cfg.threshold, referenceMm - cfg.release)
        : referenceMm + cfg.press,
  };
}

/** Rate-independent contact-gap hysteresis, including partial strokes. Pressing
 * can only close the gap; releasing can only open it. A reversal preserves the
 * existing gap, so a stroke that never actuated cannot turn on while returning.
 * The two threshold curves are teaching fits, not published reset measurements. */
export function keyboardContactReplay(
  variant: KeyboardSwitchVariant,
  historyMm: readonly number[],
) {
  const s = KEYBOARD_SWITCH_SPECS[variant],
    present = s.detection === 'contact';
  let previous = 0,
    gapMm = present ? KEYBOARD_SWITCH_GEOMETRY.contactMaxGapMm : 0;
  for (const raw of historyMm) {
    const d = clamp(raw, 0, s.totalTravelMm);
    if (d > previous)
      gapMm = Math.min(
        gapMm,
        KEYBOARD_SWITCH_GEOMETRY.contactMaxGapMm * smooth((s.preTravelMm - d) / 0.8),
      );
    else if (d < previous)
      gapMm = Math.max(
        gapMm,
        KEYBOARD_SWITCH_GEOMETRY.contactMaxGapMm * smooth((s.releaseMm - d) / 0.8),
      );
    previous = d;
  }
  return { gapMm: present ? gapMm : 0, closed: present && gapMm === 0 };
}

/** Guided two-piece jacket with return-point memory. Float is the sleeve's
 * height relative to its stem's lower stop. A partial reversal preserves this
 * float; it cannot teleport onto the other full-stroke branch. Only a completed
 * downward snap arms the illustrative upward reset snap. */
export function keyboardBlueJacketReplay(historyMm: readonly number[]) {
  let previous = 0,
    floatMm = 0,
    resetArmed = false,
    downFrontierMm = 0,
    downSnapping = false,
    upSnapping = false;
  for (const raw of historyMm) {
    const d = clamp(raw, 0, 4);
    if (d > previous) {
      downSnapping = upSnapping = false;
      if (resetArmed) {
        // An interrupted reset returns to its existing lower stop; it cannot
        // start a second downward snap before the jacket has actually reset.
        floatMm = Math.max(0, floatMm - (d - previous));
      } else if (d > downFrontierMm) {
        if (d <= 2.05) floatMm = Math.max(floatMm, clamp(d - 1.4, 0, 0.65));
        else {
          if (downFrontierMm <= 2.05) floatMm = 0.65;
          floatMm = Math.min(floatMm, 0.65 * (1 - ramp(d, 2.05, 2.2)));
          downSnapping = d < 2.2;
        }
        downFrontierMm = d;
      }
      if (d >= 2.2) resetArmed = true;
    } else if (d < previous) {
      downSnapping = upSnapping = false;
      if (resetArmed) {
        floatMm = Math.max(floatMm, 0.65 * (1 - ramp(d, 1.4, 1.6)));
        upSnapping = d > 1.4 && d < 1.6;
        if (d <= 1.4) {
          resetArmed = false;
          downFrontierMm = d;
        }
      }
      // Once the sleeve reaches its initial upper seat, a new stroke can begin
      // from here rather than inheriting a no-longer-reachable old frontier.
      if (d < floatMm) downFrontierMm = d;
    }
    floatMm = Math.min(floatMm, d);
    previous = d;
  }
  return { sleeveTravelMm: previous - floatMm, floatMm, resetArmed, downSnapping, upSnapping };
}

export type KeyboardTravelKeyframe = readonly [phase: number, travelMm: number];
function cycleFrames(peak: number): KeyboardTravelKeyframe[] {
  return [
    [0, 0],
    [0.08, 0],
    [0.43, peak],
    [0.55, peak],
    [0.92, 0],
    [1, 0],
  ];
}
export const KEYBOARD_RAPID_TRAJECTORY: readonly KeyboardTravelKeyframe[] = [
  [0, 0],
  [0.1, 0],
  [0.3, 3.25],
  [0.45, 2.65],
  [0.59, 3.2],
  [0.73, 2.45],
  [0.86, 2.95],
  [1, 0],
];
function trajectory(phase: number, frames: readonly KeyboardTravelKeyframe[]) {
  const p = clamp(phase),
    historyMm = [frames[0][1]];
  let direction: KeyboardSwitchDirection = 'press';
  for (let i = 1; i < frames.length; i++) {
    const [a, da] = frames[i - 1],
      [b, db] = frames[i];
    if (db !== da) direction = db > da ? 'press' : 'release';
    if (p <= b) {
      const travelMm = da + (db - da) * smooth((p - a) / (b - a));
      historyMm.push(travelMm);
      return { travelMm, direction, historyMm };
    }
    historyMm.push(db);
  }
  return { travelMm: frames[frames.length - 1][1], direction, historyMm };
}

/** A directly seekable structural state. If a custom history is omitted, the
 * supplied direction implies a complete press branch or a release from bottom. */
export function keyboardSwitchStateAtTravel(
  variant: KeyboardSwitchVariant,
  travelMm: number,
  direction: KeyboardSwitchDirection = 'press',
  options: KeyboardSwitchOptions = {},
  historyMm?: readonly number[],
): KeyboardSwitchState {
  const s = KEYBOARD_SWITCH_SPECS[variant],
    g = KEYBOARD_SWITCH_GEOMETRY;
  const d = clamp(travelMm, 0, s.totalTravelMm),
    contactPresent = s.detection === 'contact';
  const history = historyMm
    ? [...historyMm, d]
    : direction === 'press'
      ? [0, d]
      : [0, s.totalTravelMm, d];
  const { gapMm, closed } = keyboardContactReplay(variant, history);
  const forceCn = keyboardSwitchForceAt(variant, d, direction),
    springForceCn = springForce(variant, d);
  const leafForceCn = variant === 'brown' || variant === 'blue' ? forceCn - springForceCn : 0;
  const jacket = keyboardBlueJacketReplay(history);
  const clickPresent = variant === 'blue',
    sleeveTravelMm = clickPresent ? jacket.sleeveTravelMm : d;
  const clickProgress = direction === 'press' ? clamp((d - 2.05) / 0.15) : clamp((1.6 - d) / 0.2);
  const clickEvent =
    clickPresent &&
    clickProgress > 0 &&
    clickProgress < 1 &&
    (direction === 'press' ? jacket.downSnapping : jacket.upSnapping)
      ? direction === 'press'
        ? 'down'
        : 'up'
      : null;
  const cfg = rapidSettings(options),
    rapid = keyboardRapidReplay(history, options);
  const apertureHalfHeightMm = g.opticalApertureHalfHeightMm;
  const apertureCenterMm = s.preTravelMm + apertureHalfHeightMm - d;
  const overlap = Math.max(
    0,
    Math.min(g.opticalBeamRadiusMm, apertureCenterMm + apertureHalfHeightMm) -
      Math.max(-g.opticalBeamRadiusMm, apertureCenterMm - apertureHalfHeightMm),
  );
  const transmission = clamp(overlap / (2 * g.opticalBeamRadiusMm));
  const opticalActive = transmission >= 0.5 - 1e-10;
  const fixedActive = d >= cfg.threshold;
  const fixedPoint: KeyboardSwitchPoint = [...g.contactFixedPoint];
  return {
    variant,
    family: s.family,
    phase: 0,
    direction,
    travelMm: d,
    totalTravelMm: s.totalTravelMm,
    maxTravelMm: s.totalTravelMm,
    actuationMm: s.preTravelMm,
    releaseMm: s.releaseMm,
    forceCn,
    springForceCn,
    leafForceCn,
    stemOffsetMm: -d,
    springCompressionMm: d,
    springLengthMm: g.springRestTopYmm - g.springBottomYmm - d,
    springBottom: [0, g.springBottomYmm, 0],
    springTop: [0, g.springRestTopYmm - d, 0],
    contactGapMm: gapMm,
    contact: {
      present: contactPresent,
      gapMm,
      closed,
      leafDeflectionMm: gapMm + 0.12 + Math.max(0, leafForceCn) / 100,
      fixedPoint,
      movingPoint: [fixedPoint[0] - gapMm, fixedPoint[1], fixedPoint[2]],
    },
    click: {
      present: clickPresent,
      sleeveTravelMm,
      sleeveOffsetMm: -sleeveTravelMm,
      relativeTravelMm: sleeveTravelMm - d,
      event: clickEvent,
      progress: clickProgress,
      intensity: clickEvent ? Math.sin(Math.PI * clickProgress) : 0,
    },
    silent: {
      bottomCompressionMm:
        variant === 'silent-red' ? clamp(d - (s.totalTravelMm - 0.25), 0, 0.25) : 0,
      topCompressionMm: variant === 'silent-red' ? clamp(0.2 - d, 0, 0.2) : 0,
    },
    hall: {
      signal: keyboardHallSignal(d),
      distanceMm: g.hallMagnetRestYmm - d - g.hallSensorYmm,
      magnetYmm: g.hallMagnetRestYmm - d,
      sensorYmm: g.hallSensorYmm,
      thresholdMm: cfg.threshold,
      fixedActive,
      rapidActive: rapid.active,
      armed: rapid.armed,
      referenceMm: rapid.referenceMm,
      nextThresholdMm: rapid.nextThresholdMm,
      pressDistanceMm: cfg.press,
      releaseDistanceMm: cfg.release,
      continuous: cfg.continuous,
    },
    optical: {
      transmission,
      active: opticalActive,
      beamYmm: g.opticalBeamYmm,
      beamRadiusMm: g.opticalBeamRadiusMm,
      apertureCenterMm,
      apertureHalfHeightMm,
    },
    active: contactPresent ? closed : s.detection === 'hall' ? fixedActive : opticalActive,
  };
}

export function keyboardSwitchState(
  variant: KeyboardSwitchVariant,
  phase: number,
  options: KeyboardSwitchOptions = {},
): KeyboardSwitchState {
  const peak = clamp(
    options.peakTravelMm ?? KEYBOARD_SWITCH_SPECS[variant].totalTravelMm,
    0,
    KEYBOARD_SWITCH_SPECS[variant].totalTravelMm,
  );
  const frames = options.motion === 'rapid' ? KEYBOARD_RAPID_TRAJECTORY : cycleFrames(peak);
  const t = trajectory(phase, frames);
  return {
    ...keyboardSwitchStateAtTravel(variant, t.travelMm, t.direction, options, t.historyMm),
    phase: clamp(phase),
  };
}

export type KeyboardSwitchShot = {
  chapter: number;
  progress: number;
  view:
    | 'anatomy'
    | 'linear'
    | 'tactile'
    | 'click'
    | 'contact'
    | 'speed'
    | 'damping'
    | 'hall'
    | 'optical'
    | 'summary';
  variant: KeyboardSwitchVariant;
  phase: number;
  state: KeyboardSwitchState;
  compareState: KeyboardSwitchState | null;
  states: KeyboardSwitchState[];
};
/** Chapter progression is pure: seeking never requires past render frames. */
export function keyboardSwitchShot(chapter: number, progress: number): KeyboardSwitchShot {
  const c = Math.round(clamp(chapter, 0, 8)),
    p = clamp(progress);
  let variant: KeyboardSwitchVariant = 'red',
    view: KeyboardSwitchShot['view'] = 'anatomy',
    phase = p;
  let options: KeyboardSwitchOptions = {},
    compareState: KeyboardSwitchState | null = null;
  if (c === 1) {
    view = 'linear';
    variant = p < 0.5 ? 'red' : 'black';
    phase = p < 0.5 ? p * 2 : (p - 0.5) * 2;
    compareState = keyboardSwitchState(variant === 'red' ? 'black' : 'red', phase);
  }
  if (c === 2) {
    view = 'tactile';
    variant = 'brown';
  }
  if (c === 3) {
    view = 'click';
    variant = 'blue';
  }
  if (c === 4) {
    view = 'contact';
  }
  if (c === 5) {
    if (p < 0.5) {
      view = 'speed';
      variant = 'silver';
      phase = p * 2;
      options = { peakTravelMm: 1.6 };
      compareState = keyboardSwitchState('red', phase, options);
    } else {
      view = 'damping';
      variant = 'silent-red';
      phase = (p - 0.5) * 2;
    }
  }
  if (c === 6) {
    view = 'hall';
    variant = 'hall';
    options = { motion: 'rapid' };
  }
  if (c === 7) {
    view = 'optical';
    variant = 'optical';
  }
  if (c === 8) {
    view = 'summary';
    const segment = Math.min(2, Math.floor(p * 3));
    variant = (['red', 'brown', 'blue'] as const)[segment];
    phase = p * 3 - segment;
  }
  let state = keyboardSwitchState(variant, phase, options);
  if (c === 3 || c === 4) {
    const frames: KeyboardTravelKeyframe[] =
      c === 3
        ? [
            [0, 0],
            [0.08, 0],
            [0.22, 1.4],
            [0.34, 2.05],
            [0.46, 2.2],
            [0.58, 3.6],
            [0.65, 3.6],
            [0.77, 1.6],
            [0.87, 1.4],
            [1, 0],
          ]
        : [
            [0, 0],
            [0.08, 0],
            [0.25, 2],
            [0.33, 2],
            [0.43, 2.5],
            [0.51, 2.5],
            [0.61, 4],
            [0.69, 4],
            [0.84, 1.85],
            [0.9, 1.5],
            [1, 0],
          ];
    const t = trajectory(p, frames);
    state = {
      ...keyboardSwitchStateAtTravel(variant, t.travelMm, t.direction, options, t.historyMm),
      phase: p,
    };
  }
  const states =
    c === 8
      ? (['red', 'brown', 'blue'] as const).map((v) => keyboardSwitchState(v, p))
      : compareState
        ? [state, compareState]
        : [state];
  return { chapter: c, progress: p, view, variant, phase, state, compareState, states };
}
