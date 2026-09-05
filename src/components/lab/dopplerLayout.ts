import type { DopplerFocus, DopplerFrame, DopplerVector } from '../../models/doppler';

/** Fit physical positions together with fixed-size symbols. No trajectory is clamped. */
export function dopplerFieldLayout(frame: DopplerFrame, focus: DopplerFocus, compact: boolean) {
  const width = compact ? 320 : 900,
    height = compact ? 306 : 370,
    cx = width / 2,
    cy = height * (focus === 'bearing' ? 0.65 : 0.54);
  // A speed arrow reaches at most 30.5 units, plus its stroke and a 12-unit gutter.
  const side = 44,
    top = 64,
    bottom = 51;
  const bodies = [frame.source, frame.observer];
  let scale = width / (2 * 5.3);
  for (const p of bodies) {
    if (p.x !== 0) scale = Math.min(scale, (cx - side) / Math.abs(p.x));
    if (p.y > 0) scale = Math.min(scale, (cy - top) / p.y);
    if (p.y < 0) scale = Math.min(scale, (height - bottom - cy) / -p.y);
  }
  const project = (p: DopplerVector) => ({ x: cx + p.x * scale, y: cy - p.y * scale });
  return { width, height, cx, cy, scale, halfWidth: width / (2 * scale), project };
}

export function dopplerVelocityArrow(p: DopplerVector, speed: number) {
  const sign = Math.sign(speed);
  return {
    start: { x: p.x - sign * 16, y: p.y - 25 },
    tip: { x: p.x + sign * (8 + 25 * Math.abs(speed)), y: p.y - 25 },
    sign,
  };
}
