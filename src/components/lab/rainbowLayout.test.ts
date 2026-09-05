import { describe, expect, it } from 'vitest';
import { rainbowShot, traceRainbow } from '../../models/rainbow';
import { rainbowContactLabels, rainbowDropLayout } from './rainbowLayout';

describe('rainbow contact annotation layout', () => {
  it('merges coincident entry/exit events without moving either physical contact', () => {
    const ray = traceRainbow(0),
      layout = rainbowDropLayout(true, false);
    const original = structuredClone(ray);
    const labels = rainbowContactLabels(ray, layout, 4);
    expect(labels.map((l) => l.contacts)).toEqual([[1, 3], [2]]);
    expect(labels[0].anchors[0]).toEqual(labels[0].anchors[1]);
    expect(labels[1].center.x + labels[1].width / 2).toBeLessThanOrEqual(layout.width - 8);
    expect(ray).toEqual(original);
  });
  it('never announces a contact before its phase reaches that event', () => {
    for (const progress of [0, 0.99, 1, 1.65, 2, 2.7, 3, 4]) {
      const labels = rainbowContactLabels(
        traceRainbow(0),
        rainbowDropLayout(true, false),
        progress,
      );
      expect(labels.flatMap((l) => l.contacts).sort()).toEqual(
        [1, 2, 3].filter((i) => i <= progress),
      );
    }
  });
  it('keeps labels outside the droplet, inside the viewport and mutually separated over the supported inputs', () => {
    for (const compact of [true, false])
      for (const fan of [true, false]) {
        const layout = rainbowDropLayout(compact, fan);
        for (const wavelength of [400, 550, 700])
          for (let i = 0; i <= 333; i++) {
            const ray = traceRainbow(i * 0.003, wavelength);
            const labels = rainbowContactLabels(ray, layout, 4);
            for (const label of labels) {
              const { center: p, width: w, height: h } = label;
              expect(p.x - w / 2).toBeGreaterThanOrEqual(8 - 1e-9);
              expect(p.x + w / 2).toBeLessThanOrEqual(layout.width - 8 + 1e-9);
              expect(p.y - h / 2).toBeGreaterThanOrEqual(8 - 1e-9);
              expect(p.y + h / 2).toBeLessThanOrEqual(layout.height - 8 + 1e-9);
              const dx = Math.max(0, Math.abs(p.x - layout.cx) - w / 2);
              const dy = Math.max(0, Math.abs(p.y - layout.cy) - h / 2);
              expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(layout.radius + 5 - 1e-8);
              label.anchors.forEach((a, j) => {
                const contact = [ray.entry, ray.reflection, ray.exit][label.contacts[j] - 1];
                expect(a.x).toBeCloseTo(layout.cx + contact.x * layout.radius, 11);
                expect(a.y).toBeCloseTo(layout.cy - contact.y * layout.radius, 11);
                expect(
                  (p.x - a.x) * (a.x - layout.cx) + (p.y - a.y) * (a.y - layout.cy),
                ).toBeGreaterThanOrEqual(-1e-8);
              });
            }
            for (let a = 0; a < labels.length; a++)
              for (let b = a + 1; b < labels.length; b++) {
                const p = labels[a],
                  q = labels[b];
                expect(
                  Math.abs(p.center.x - q.center.x) >= (p.width + q.width) / 2 + 7 - 1e-8 ||
                    Math.abs(p.center.y - q.center.y) >= (p.height + q.height) / 2 + 7 - 1e-8,
                ).toBe(true);
              }
          }
      }
  });
  it('reconstructs contact annotations in reverse seek order', () => {
    const frames = Array.from({ length: 101 }, (_, i) => {
      const s = rainbowShot(3, i / 100);
      return rainbowContactLabels(s.ray, rainbowDropLayout(true, true), s.reveal);
    });
    for (let i = 100; i >= 0; i--) {
      const s = rainbowShot(3, i / 100);
      expect(rainbowContactLabels(s.ray, rainbowDropLayout(true, true), s.reveal)).toEqual(
        frames[i],
      );
    }
  });
});
