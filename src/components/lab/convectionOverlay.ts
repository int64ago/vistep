import { convectionVelocity, type ConvectionState } from '../../models/convection';

export type ConvectionMark = { x: number; y: number };
/** Display geometry only. Canvas and SVG use the same physical velocity and isotropic projection. */
export function convectionOverlay(state: ConvectionState, view: string, width: number) {
  const scale = width / state.p.width,
    height = width / state.p.width;
  const project = (x: number, y: number): ConvectionMark => ({ x: x * scale, y: (1 - y) * scale });
  const arrows: { start: ConvectionMark; tip: ConvectionMark; wings: ConvectionMark[] }[] = [];
  if (view === 'seed' || view === 'plume') {
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 6; i++) {
        const x = ((i + 0.5) * state.p.width) / 6,
          y = (j + 0.5) / 4;
        const velocity = convectionVelocity(state.p, state.psi, x, y);
        const start = project(x, y),
          tip = project(x + velocity.u * 0.2, y + velocity.v * 0.2);
        const dx = tip.x - start.x,
          dy = tip.y - start.y,
          length = Math.hypot(dx, dy);
        if (length < 0.6) continue;
        const ux = dx / length,
          uy = dy / length,
          h = Math.min(4, length * 0.4);
        arrows.push({
          start,
          tip,
          wings: [-1, 1].map((sign) => ({
            x: tip.x - h * ux + sign * h * 0.55 * uy,
            y: tip.y - h * uy - sign * h * 0.55 * ux,
          })),
        });
      }
  }
  const section =
    view === 'transport' || view === 'grid'
      ? { start: project(0, 0.5), end: project(state.p.width, 0.5) }
      : null;
  const grid: { start: ConvectionMark; end: ConvectionMark }[] = [];
  if (view === 'grid') {
    for (let i = 1; i < state.p.nx; i++)
      grid.push({ start: project(i * state.p.dx, 0), end: project(i * state.p.dx, 1) });
    for (let j = 1; j < state.p.ny; j++)
      grid.push({ start: project(0, j * state.p.dy), end: project(state.p.width, j * state.p.dy) });
  }
  return { width, height, scale, project, arrows, section, grid };
}

export function convectionArrowPath(arrow: ReturnType<typeof convectionOverlay>['arrows'][number]) {
  const { start, tip, wings } = arrow;
  return `M${start.x},${start.y}L${tip.x},${tip.y}L${wings[0].x},${wings[0].y}M${tip.x},${tip.y}L${wings[1].x},${wings[1].y}`;
}
