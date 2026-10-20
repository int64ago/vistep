export function movingPaper(time: number, duration = 0.35) {
  if (![time, duration].every(Number.isFinite) || duration < 0.05 || duration > 5)
    throw new RangeError('Finite time and positive pull duration required.');
  const t = Math.max(0, Math.min(time, duration)),
    u = (Math.PI * t) / duration;
  return {
    position: 0.25 * (1 - Math.cos(u)),
    velocity: time < 0 || time >= duration ? 0 : ((0.25 * Math.PI) / duration) * Math.sin(u),
    acceleration: time < 0 || time >= duration ? 0 : 0.25 * (Math.PI / duration) ** 2 * Math.cos(u),
  };
}
/** Coulomb contact with static sticking of a solid sphere's contact point. Units m, s. */
export function paperBall(time: number, duration = 0.35, coefficient = 0.03) {
  if (
    ![time, duration, coefficient].every(Number.isFinite) ||
    time < 0 ||
    time > 5 ||
    duration < 0.05 ||
    duration > 5 ||
    coefficient < 0 ||
    coefficient > 0.2
  )
    throw new RangeError('Finite bounded pull conditions required.');
  const steps = Math.max(1, Math.ceil(time / 0.0005));
  let position = 0,
    velocity = 0,
    spinSpeed = 0,
    angle = 0,
    acceleration = 0,
    onPaper = true;
  const inertiaRatio = 0.4,
    radius = 0.03;
  for (let i = 0; i < steps; i++) {
    const current = i * 0.0005,
      dt = Math.max(0, Math.min(0.0005, time - current)),
      paper = movingPaper(current, duration),
      next = movingPaper(current + dt, duration);
    onPaper = position >= paper.position - 0.3 && position <= paper.position + 0.3;
    const surfaceVelocity = onPaper ? next.velocity : 0,
      mu = onPaper ? coefficient : 0.1,
      needed = (surfaceVelocity - (velocity - spinSpeed)) / (1 + 1 / inertiaRatio),
      limit = mu * 1.3 * 9.8 * dt;
    const impulse = Math.abs(needed) <= limit ? needed : Math.sign(needed) * mu * 9.8 * dt,
      previous = velocity,
      oldSpin = spinSpeed;
    velocity += impulse;
    spinSpeed -= impulse / inertiaRatio;
    position += ((previous + velocity) * dt) / 2;
    angle += ((oldSpin + spinSpeed) * dt) / (2 * radius);
    acceleration = dt ? impulse / dt : 0;
  }
  const paper = movingPaper(time, duration);
  return {
    position,
    velocity,
    acceleration,
    angle,
    spinSpeed,
    paper,
    onPaper: position >= paper.position - 0.3 && position <= paper.position + 0.3,
    relativePosition: position - paper.position,
    relativeVelocity: velocity - paper.velocity,
    relativeAcceleration: acceleration - paper.acceleration,
  };
}

/** Retained replays: compare one same event in two translated coordinate systems. */
export function inertiaDirector(
  chapter: number,
  progress: number,
  chapterTime?: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Number.isFinite(chapter) ? Math.max(0, Math.min(3, Math.floor(chapter))) : 0;
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const seconds =
    chapterTime === undefined
      ? p * ([28, 28, 29, 28.5][c] ?? 28)
      : Number.isFinite(chapterTime)
        ? Math.max(0, chapterTime)
        : 0;
  const duration = c === 3 ? 2 : 0.35,
    coefficient = c === 2 ? 0 : 0.03,
    en = locale === 'en';
  const start = c === 0 ? 0.45 : c === 1 ? (en ? 3.27 : 4.79) : c === 2 ? (en ? 3.87 : 4.69) : 0.45;
  const end =
    c === 0
      ? en
        ? 8.43
        : 10.05
      : c === 1
        ? en
          ? 8.5
          : 10.8
        : c === 2
          ? en
            ? 11.29
            : 12.61
          : en
            ? 12.7
            : 13.8;
  return {
    duration,
    coefficient,
    time: Math.max(0, Math.min(1, (seconds - start) / (end - start))) * (duration + 0.2),
    focus: c === 1 ? 'paper' : c === 0 ? 'lab' : 'both',
  } as const;
}
/** Zero-thickness contact surface, shared by paper, bare table and sphere. */
export function inertiaGeometry(
  s: ReturnType<typeof paperBall>,
  frame: 'lab' | 'paper',
  width: number,
) {
  if (!Number.isFinite(width) || width < 240 || width > 1600)
    throw new RangeError('Bounded view width required.');
  if (![s.position, s.paper.position, s.angle].every(Number.isFinite))
    throw new RangeError('Finite physical state required.');
  const scale = (width - 32) / 1.5,
    origin = 16 + 0.6 * scale,
    offset = frame === 'paper' ? s.paper.position : 0;
  return {
    scale,
    origin,
    surfaceY: 36,
    ballRadius: 0.03 * scale,
    ballX: origin + (s.position - offset) * scale,
    ballY: 36 - 0.03 * scale,
    paperX: origin + (s.paper.position - offset - 0.3) * scale,
    paperWidth: 0.6 * scale,
    displacement: frame === 'lab' ? s.position : s.relativePosition,
    gridOffset: offset * scale,
  };
}
