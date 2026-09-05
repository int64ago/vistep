import { describe, expect, it } from 'vitest';
import { dopplerExperiment, dopplerFrame, dopplerShot } from '../../models/doppler';
import { dopplerFieldLayout, dopplerVelocityArrow } from './dopplerLayout';

describe('Doppler display-space margins', () => {
  it('contains symbols and both arrowheads over every manual endpoint and intermediate time', () => {
    for (const compact of [true, false])
      for (const source of [-0.9, 0, 0.9])
        for (const observer of [-0.8, 0, 0.8])
          for (const offset of [0.6, 3.5])
            for (let time = 0; time <= 12; time += 0.5) {
              const frame = dopplerFrame(dopplerExperiment(source, observer, offset), time);
              const layout = dopplerFieldLayout(frame, 'bearing', compact);
              for (const [body, speed] of [
                [frame.source, source],
                [frame.observer, observer],
              ] as const) {
                const p = layout.project(body),
                  arrow = dopplerVelocityArrow(p, speed);
                expect(p.x - 23).toBeGreaterThan(8);
                expect(p.x + 23).toBeLessThan(layout.width - 8);
                expect(p.y - 29).toBeGreaterThan(8);
                expect(p.y + 41).toBeLessThan(layout.height - 8);
                for (const x of [arrow.start.x, arrow.tip.x, arrow.tip.x - arrow.sign * 6]) {
                  expect(x).toBeGreaterThan(8);
                  expect(x).toBeLessThan(layout.width - 8);
                }
              }
            }
  });
  it('fits all authored shots and preserves the model geometry with one isotropic scale', () => {
    for (let chapter = 0; chapter < 8; chapter++)
      for (let i = 0; i <= 100; i++) {
        const { frame, focus } = dopplerShot(chapter, i / 100);
        const l = dopplerFieldLayout(frame, focus, true);
        const s = l.project(frame.source),
          o = l.project(frame.observer);
        expect(Math.hypot(o.x - s.x, o.y - s.y)).toBeCloseTo(
          Math.hypot(frame.observer.x - frame.source.x, frame.observer.y - frame.source.y) *
            l.scale,
          10,
        );
        for (const [body, speed] of [
          [frame.source, frame.config.source.velocity.x],
          [frame.observer, frame.config.observer.velocity.x],
        ] as const) {
          const arrow = dopplerVelocityArrow(l.project(body), speed);
          expect(arrow.tip.x).toBeGreaterThan(8);
          expect(arrow.tip.x).toBeLessThan(l.width - 8);
        }
      }
  });
});
