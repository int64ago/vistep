import { jellyFrame, jellyRun, jellyVortices } from './jellyfish';
import {
  jellyGonadPoint,
  jellyOralPoint,
  jellyOutline,
  jellyTentaclePoint,
} from './jellyfish-geometry';
const line = (points: number[][]) =>
  'M' + points.map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' L');
export function jellyCover() {
  const frame = jellyFrame(jellyRun(), 1.55),
    scale = 78,
    cx = 200,
    cy = 86,
    r = frame.radius / 0.02;
  const project = (p: number[]) => [cx + p[0] * scale, cy - p[1] * scale + p[2] * scale * 0.3];
  return {
    bell: jellyOutline(frame, scale, cx, cy) + ' Z',
    rimRadius: (r + 0.025) * scale,
    baseline: cy,
    recovery: frame.recoveryForce > 0,
    vortices: jellyVortices(frame).map((v) => ({
      type: v.type,
      cx,
      cy: cy - v.y * scale,
      rx: v.radius * scale,
      ry: v.radius * scale * 0.15,
      strength: v.strength,
    })),
    gonads: Array.from({ length: 4 }, (_, arm) =>
      line(
        Array.from({ length: 33 }, (_, i) => {
          const p = jellyGonadPoint(arm, i / 32);
          return project([p[0] * r, (p[1] * frame.height) / 0.009, p[2] * r]);
        }),
      ),
    ),
    arms: Array.from({ length: 4 }, (_, arm) =>
      line(Array.from({ length: 33 }, (_, i) => project(jellyOralPoint(arm, i / 32, 0, frame)))),
    ),
    tentacles: Array.from({ length: 48 }, (_, j) =>
      line(Array.from({ length: 12 }, (_, i) => project(jellyTentaclePoint(j, i / 11, frame, 48)))),
    ),
  };
}
