const g = 9.8,
  rho = 1000;
export function besselI(order: 0 | 1, x: number) {
  let term = order ? x / 2 : 1,
    sum = term;
  for (let k = 1; k < 70; k++) {
    term *= (x * x) / (4 * k * (k + order));
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
  }
  return sum;
}
/** Linearized axisymmetric Young–Laplace meniscus, pinned at the brim. */
export function fullGlass(clips: number, gamma = 0.072) {
  const radius = 0.022,
    lc = Math.sqrt(gamma / (rho * g)),
    q = radius / lc,
    i0 = besselI(0, q),
    i1 = besselI(1, q),
    factor = Math.PI * radius * radius * (1 - (((2 * lc) / radius) * i1) / i0),
    clipVolume = 0.00035 / 7800,
    addedVolume = clips * clipVolume;
  const maxH = (Math.tan(Math.PI / 9) * lc * i0) / i1,
    h = Math.min(addedVolume / factor, maxH),
    heldVolume = factor * h;
  return {
    radius,
    lc,
    h,
    centerHeight: h * (1 - 1 / i0),
    addedVolume,
    heldVolume,
    overflow: Math.max(0, addedVolume - heldVolume),
    maxClips: (factor * maxH) / clipVolume,
    profile: (r: number) => h * (1 - besselI(0, Math.abs(r) / lc) / i0),
  };
}
export function tautThread(progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    a = 100,
    target = 230;
  let lo = 0.0001,
    hi = Math.PI / 2;
  for (let i = 0; i < 50; i++) {
    const theta = (lo + hi) / 2;
    if (Math.sin(theta) / theta > (2 * a) / target) lo = theta;
    else hi = theta;
  }
  const theta = (lo + hi) / 2,
    R = a / Math.sin(theta);
  const raw = Array.from({ length: 101 }, (_, i) => {
    const u = i / 100,
      x = -a + 2 * a * u,
      arc = Math.sqrt(R * R - x * x) - R * Math.cos(theta),
      wave = 22 * Math.sin(3 * Math.PI * u) + 9 * Math.sin(7 * Math.PI * u);
    return { x, y: (1 - p) * wave + p * arc };
  });
  const length = (scale: number) =>
    raw.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - raw[i].x, (q.y - raw[i].y) * scale), 0);
  let low = 0,
    high = 4;
  for (let i = 0; i < 45; i++) {
    const m = (low + high) / 2;
    if (length(m) > target) high = m;
    else low = m;
  }
  return raw.map((q) => ({ x: q.x, y: (q.y * (low + high)) / 2 }));
}
export function threadLoop(progress: number) {
  const amplitude = 0.25 * (1 - Math.max(0, Math.min(1, progress))),
    raw = Array.from({ length: 96 }, (_, i) => {
      const a = (i * Math.PI * 2) / 96,
        r = 1 + amplitude * Math.cos(3 * a);
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
  const length = raw.reduce((s, q, i) => {
      const next = raw[(i + 1) % raw.length];
      return s + Math.hypot(q.x - next.x, q.y - next.y);
    }, 0),
    scale = (2 * Math.PI * 40) / length;
  return raw.map((q) => ({ x: q.x * scale, y: q.y * scale }));
}
export function sessileDrop(angleDegrees: number, volume = 5e-9) {
  const theta = (Math.max(5, Math.min(175, angleDegrees)) * Math.PI) / 180,
    c = Math.cos(theta),
    radius = Math.cbrt((3 * volume) / (Math.PI * (2 - 3 * c + c * c * c)));
  return { theta, radius, base: radius * Math.sin(theta), height: radius * (1 - c), volume };
}
export function floatingNeedle(gamma = 0.072, broken = false, time = 0) {
  const radius = 0.00045,
    length = 0.03,
    volume = Math.PI * radius * radius * length,
    mass = 7800 * volume,
    weight = mass * g,
    maximum = 2 * gamma * length,
    ratio = weight / maximum,
    stable = !broken && ratio <= 1,
    angle = stable ? Math.asin(ratio) : 0,
    lc = Math.sqrt(gamma / (rho * g)),
    depression = stable ? lc * Math.sqrt(2 * (1 - Math.cos(angle))) : 0,
    t = Math.max(0, time),
    acc = g * (1 - rho / 7800),
    sink = stable ? 0 : (acc / 5) * (t - (1 - Math.exp(-5 * t)) / 5);
  return { weight, maximum, stable, angle, depression, buoyancy: rho * volume * g, sink };
}
