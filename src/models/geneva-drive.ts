/** Standard external radial-slot Geneva geometry. Distances normalized by c. */
export function genevaGeometry(slots = 4) {
  if (![4, 5, 6].includes(slots)) throw new RangeError('Four, five or six slots required');
  const halfStep = Math.PI / slots,
    crank = Math.sin(halfStep),
    outer = Math.cos(halfStep) + 0.025;
  return {
    slots,
    centers: 1,
    crank,
    halfStep,
    step: 2 * halfStep,
    entry: Math.PI / 2 - halfStep,
    pinRadius: 0.025,
    slotHalfWidth: 0.0275,
    slotInner: 1 - crank - 0.025,
    outer,
    lockRadius: 0.83 * crank,
    reliefRadius: outer + 0.012,
  };
}
export function genevaState(input: number, slots = 4, rpm = 30) {
  if (!Number.isFinite(input) || !Number.isFinite(rpm) || rpm <= 0 || rpm > 120)
    throw new RangeError('Finite angle and positive input up to 120 rpm required');
  const g = genevaGeometry(slots),
    cycle = Math.floor((input + Math.PI) / (2 * Math.PI)),
    phase = input - cycle * 2 * Math.PI,
    engaged = Math.abs(phase) <= g.entry,
    q = engaged
      ? Math.atan2(-g.crank * Math.sin(phase), 1 - g.crank * Math.cos(phase))
      : phase < 0
        ? g.halfStep
        : -g.halfStep,
    output = q - cycle * g.step,
    ratio = engaged
      ? (g.crank ** 2 - g.crank * Math.cos(phase)) /
        (1 + g.crank ** 2 - 2 * g.crank * Math.cos(phase))
      : 0,
    pin = { x: g.crank * Math.cos(input), y: g.crank * Math.sin(input) };
  return {
    ...g,
    input,
    phase,
    cycle,
    engaged,
    output,
    ratio,
    rpm,
    outputRpm: -ratio * rpm,
    pin,
    activeSlot: ((cycle % slots) + slots) % slots,
    indexed: (g.halfStep - output) / g.step,
    indexFraction: 0.5 - 1 / slots,
    dwellFraction: 0.5 + 1 / slots,
  };
}
/** Membership in the actual wheel solid, including radial slots and concave locks. */
export function genevaWheelContains(x: number, y: number, s: ReturnType<typeof genevaState>) {
  const X = (x - 1) * Math.cos(s.output) + y * Math.sin(s.output),
    Y = -(x - 1) * Math.sin(s.output) + y * Math.cos(s.output);
  if (X * X + Y * Y > s.outer ** 2) return false;
  for (let i = 0; i < s.slots; i++) {
    const a = Math.PI + i * s.step,
      r = X * Math.cos(a) + Y * Math.sin(a),
      h = -X * Math.sin(a) + Y * Math.cos(a);
    if (r >= s.slotInner && Math.abs(h) < s.slotHalfWidth) return false;
    const b = a - s.halfStep;
    if ((X - Math.cos(b)) ** 2 + (Y - Math.sin(b)) ** 2 < s.lockRadius ** 2) return false;
  }
  return true;
}
export function genevaDriverContains(x: number, y: number, s: ReturnType<typeof genevaState>) {
  return (
    x * x + y * y <= s.lockRadius ** 2 &&
    (x - Math.cos(s.input)) ** 2 + (y - Math.sin(s.input)) ** 2 >= s.reliefRadius ** 2
  );
}
export function genevaShot(chapter: number, progress: number) {
  const u = Math.min(1, Math.max(0, progress));
  let slots = 4,
    rpm = 30,
    input = -Math.PI + 2 * Math.PI * u;
  if (chapter === 1) input = -Math.PI / 4 - 0.28 + 0.9 * u;
  if (chapter === 2) input = -Math.PI / 4 + (Math.PI / 2) * u;
  if (chapter === 3) input = Math.PI / 4 + 0.16 + (Math.PI * 1.5 - 0.32) * u;
  if (chapter === 4) {
    slots = u < 0.5 ? 4 : 6;
    input = -Math.PI + (u < 0.5 ? u * 2 : (u - 0.5) * 2) * Math.PI * 2;
  }
  if (chapter === 5) {
    rpm = 30 + 60 * u;
    input = -Math.PI + (u + u * u) * Math.PI * 4;
  }
  return genevaState(input, slots, rpm);
}
