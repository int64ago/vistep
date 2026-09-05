import { describe, it, expect } from 'vitest';
import { diffusionField, diffusionValue } from '../../models/diffusion';
import { ConvectionRun, convectionVelocity } from '../../models/convection';
import { diffusionPlotMaximum, diffusionPlotLayout } from './diffusionLayout';
import { convectionOverlay, convectionArrowPath } from './convectionOverlay';

describe('CDB display geometry regressions', () => {
  it('keeps A, B and their conserved sum within a fixed concentration scale at short lengths', () => {
    for (const length of [0.5, 0.6, 0.8, 1, 2])
      for (const mass of [0.1, 0.7, 1, 2]) {
        const maximum = diffusionPlotMaximum(diffusionField({ kind: 'mix', length, mass }));
        expect(maximum).toBeCloseTo(((2 * mass) / length) * 1.06, 12);
        for (const time of [0, 0.01, 1, 40]) {
          const a = diffusionField({ kind: 'mix', length, mass }, time),
            b = diffusionField(a.p, time, 'B');
          expect(diffusionPlotMaximum(a)).toBe(maximum);
          for (let i = 0; i <= 160; i++) {
            const ca = diffusionValue(a, (length * i) / 160),
              cb = diffusionValue(b, (length * i) / 160);
            for (const value of [ca, cb, ca + cb]) {
              expect(value).toBeGreaterThanOrEqual(0);
              expect(value).toBeLessThan(maximum);
            }
          }
        }
      }
  });
  it('uses one time-invariant axis for both comparison members, independent of order', () => {
    for (const kind of ['pulse', 'reservoir', 'mix'] as const) {
      const first = diffusionField({ kind, length: 0.5, mass: kind === 'reservoir' ? 1 : 2 });
      const other = diffusionField({ kind, length: 2, mass: kind === 'reservoir' ? 1 : 0.7 });
      const maximum = diffusionPlotMaximum(first, other);
      expect(diffusionPlotMaximum(other, first)).toBe(maximum);
      for (const time of [0, 0.2, 4, 40]) {
        const a = diffusionField(first.p, time),
          b = diffusionField(other.p, time);
        expect(diffusionPlotMaximum(a, b)).toBe(maximum);
        for (const f of [a, b])
          for (let i = 0; i <= 100; i++)
            expect(diffusionValue(f, (f.p.length * i) / 100)).toBeLessThan(maximum);
      }
    }
  });
  it('keeps phone section arrows, two strips and plot in separate regions at 16px text size', () => {
    for (const view of ['mix', 'variance', 'flux', 'budget', 'reservoir'] as const)
      for (const comparison of [false, true]) {
        const l = diffusionPlotLayout(246, view, comparison, true);
        expect(l.plotY).toBeGreaterThan(l.top + l.barH + 20);
        if (comparison) {
          expect(l.secondTop).toBeGreaterThan(l.top + l.barH + 16);
          expect(l.plotY).toBeGreaterThan(l.secondTop + l.barH + 20);
        }
        if (view === 'flux' && !comparison) expect(l.plotY - l.fluxArrow).toBeGreaterThan(32);
        if (view === 'budget' && !comparison) expect(l.plotY - l.budgetValue).toBeGreaterThan(32);
        if (view === 'reservoir' && !comparison)
          expect(l.plotY - l.boundaryFlux).toBeGreaterThan(32);
        expect(l.height).toBeLessThanOrEqual(326);
      }
  });
  it('projects true velocity endpoints with one isotropic transform for Canvas and SVG', () => {
    const state = new ConvectionRun().at(16);
    for (const width of [236, 246, 660]) {
      const g = convectionOverlay(state, 'plume', width);
      expect(g.arrows.length).toBeGreaterThan(0);
      for (const a of g.arrows) {
        const x = a.start.x / g.scale,
          y = 1 - a.start.y / g.scale;
        const v = convectionVelocity(state.p, state.psi, x, y);
        expect((a.tip.x - a.start.x) / g.scale).toBeCloseTo(0.2 * v.u, 12);
        expect((a.start.y - a.tip.y) / g.scale).toBeCloseTo(0.2 * v.v, 12);
        for (const p of [a.start, a.tip, ...a.wings]) {
          expect(p.x).toBeGreaterThan(0);
          expect(p.x).toBeLessThan(width);
          expect(p.y).toBeGreaterThan(0);
          expect(p.y).toBeLessThan(g.height);
        }
        expect(convectionArrowPath(a)).toContain(`L${a.tip.x},${a.tip.y}`);
      }
    }
  });
  it('keeps the transport section at physical y=.5 and every gridline at a cell face', () => {
    const state = new ConvectionRun({ nx: 42, ny: 28 }).at(0),
      width = 246;
    const g = convectionOverlay(state, 'grid', width);
    expect(g.section).toEqual({ start: { x: 0, y: 82 }, end: { x: 246, y: 82 } });
    expect(g.grid).toHaveLength(42 + 28 - 2);
    g.grid
      .slice(0, 41)
      .forEach((line, i) => expect(line.start.x).toBeCloseTo(((i + 1) * width) / 42, 12));
    expect(convectionOverlay(state, 'transport', width).section).toEqual(g.section);
    expect(convectionOverlay(state, 'conduction', width).section).toBeNull();
  });
  it('does not invent zero-field arrows and reconstructs identical marks after reverse seeking', () => {
    expect(
      convectionOverlay(new ConvectionRun({ seed: 0 }).at(16), 'plume', 246).arrows,
    ).toHaveLength(0);
    const run = new ConvectionRun(),
      first = convectionOverlay(run.at(12), 'plume', 246).arrows;
    run.at(30);
    run.at(3);
    expect(convectionOverlay(run.at(12), 'plume', 246).arrows).toEqual(first);
  });
});
