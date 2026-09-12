import { keyboardSwitchState } from './keyboard-switch';
import {
  keyboardSwitchSolids,
  keyboardSwitchView,
  type KeyboardSwitchVisual,
  type SwitchPoint,
} from './keyboard-switch-geometry';
const dot = (a: SwitchPoint, b: SwitchPoint) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: SwitchPoint, b: SwitchPoint): SwitchPoint => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v: SwitchPoint): SwitchPoint => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l) as SwitchPoint;
};
const shade = (hex: string, f: number) =>
  '#' +
  hex
    .slice(1)
    .match(/.{2}/g)!
    .map((c) =>
      Math.round(Math.min(255, parseInt(c, 16) * f))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
export const keyboardSwitchCoverVisual = (): KeyboardSwitchVisual => ({
  state: keyboardSwitchState('brown', 0.16),
  chapter: 0,
  chapterProgress: 0,
  active: false,
});
/** Project the exact same closed surfaces as WebGL, including springs, moving
 * contacts, click jacket, Hall package and optical aperture in their own chapters. */
export function keyboardSwitchArtwork(
  width: number,
  height: number,
  visual = keyboardSwitchCoverVisual(),
  cover = false,
) {
  const view = keyboardSwitchView(visual.chapter, width / height < 1.25, visual.state.variant),
    eye = unit(cover ? [6.1, 4.2, 12] : view.direction),
    right = unit(cross([0, 1, 0], eye)),
    up = unit(cross(eye, right));
  const origin = cover ? ([0, 8.7, 0] as SwitchPoint) : view.focus,
    span = cover ? 26 : view.span,
    high = cover ? 25 : view.height;
  const scale = Math.min(width / (span + 3), height / (high + 2.5)),
    project = (p: SwitchPoint): SwitchPoint => {
      const d = p.map((x, i) => x - origin[i]) as SwitchPoint;
      return [width / 2 + dot(d, right) * scale, height / 2 - dot(d, up) * scale, dot(d, eye)];
    };
  const paths: { d: string; fill: string; part: string; opacity: number; depth: number }[] = [];
  for (const s of keyboardSwitchSolids(visual.state, 'reduced'))
    for (const face of s.faces) {
      const world = face.map((i) => s.vertices[i]);
      if (world.length < 3) continue;
      // Newell's normal remains valid for a concave molding outline and for
      // rounded cut edges whose first three vertices may be nearly collinear.
      const sum: SwitchPoint = [0, 0, 0];
      for (let i = 0; i < world.length; i++) {
        const a = world[i],
          b = world[(i + 1) % world.length];
        sum[0] += (a[1] - b[1]) * (a[2] + b[2]);
        sum[1] += (a[2] - b[2]) * (a[0] + b[0]);
        sum[2] += (a[0] - b[0]) * (a[1] + b[1]);
      }
      const n = unit(sum);
      if (dot(n, eye) < -0.01) continue;
      const p = world.map(project),
        light = 0.72 + 0.25 * Math.max(0, dot(n, unit([-3, 8, 7])));
      paths.push({
        d: p.map((v, i) => `${i ? 'L' : 'M'}${v[0].toFixed(2)},${v[1].toFixed(2)}`).join('') + 'Z',
        fill: shade(s.color, light),
        part: s.id,
        opacity: s.material === 'housing' ? 0.84 : (s.opacity ?? 1),
        depth: p.reduce((n, v) => n + v[2], 0) / p.length,
      });
    }
  paths.sort((a, b) => a.depth - b.depth);
  return { width, height, paths };
}
