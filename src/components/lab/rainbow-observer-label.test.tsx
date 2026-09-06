import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { RainbowObserver } from './RainbowDrawing';
import { rainbowColor, rainbowShot } from '../../models/rainbow';

afterEach(() => vi.unstubAllGlobals());

function render(compact: boolean, sunAltitude: number, twoDrops: boolean, revealSecond = 1) {
  const html = renderToStaticMarkup(
    createElement(RainbowObserver, { compact, sunAltitude, twoDrops, revealSecond }),
  );
  const tag = [...html.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].find((m) => m[2] === '42.4°')!;
  return {
    html,
    x: Number(/\bx="([^"]+)"/.exec(tag[1])![1]),
    y: Number(/\by="([^"]+)"/.exec(tag[1])![1]),
    centered: tag[1].includes('text-anchor="middle"'),
  };
}

/** Segment/slab intersection, independent of the renderer's angular placement. */
function crossesReadingBox(a: number[], b: number[], x: number, y: number) {
  // Manrope Variable400, 24-unit “42.4°” ink is x[-28.23,27.99], y[-17.64,0].
  // This larger box includes font clearance plus the 2-unit ray stroke.
  const box = [
    [x - 34, x + 34],
    [y - 22, y + 5],
  ];
  let enter = 0,
    leave = 1;
  for (let axis = 0; axis < 2; axis++) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-12) {
      if (a[axis] < box[axis][0] || a[axis] > box[axis][1]) return false;
    } else {
      const first = (box[axis][0] - a[axis]) / delta,
        second = (box[axis][1] - a[axis]) / delta;
      enter = Math.max(enter, Math.min(first, second));
      leave = Math.min(leave, Math.max(first, second));
      if (enter > leave) return false;
    }
  }
  return true;
}

it('keeps the phone angle reading clear of both rays, the antisolar axis and arc in both languages', () => {
  for (const lang of ['zh', 'en']) {
    vi.stubGlobal('document', { documentElement: { lang } });
    for (let altitude = 0; altitude <= 55; altitude += 0.5)
      for (const twoDrops of [false, true]) {
        const label = render(true, altitude, twoDrops);
        expect(label.centered).toBe(true);
        expect(label.x - 34).toBeGreaterThan(8);
        expect(label.x + 34).toBeLessThan(332);
        expect(label.y - 22).toBeGreaterThan(8);
        expect(label.y + 5).toBeLessThan(342);
        for (const match of label.html.matchAll(/<path\b([^>]*)>/g)) {
          const attrs = match[1],
            stroke = /\bstroke="([^"]+)"/.exec(attrs)?.[1];
          if (![rainbowColor(700), rainbowColor(400), '#bac9c1', '#b9c7bb'].includes(stroke ?? ''))
            continue;
          const points = [
            ...(/\bd="([^"]+)"/.exec(attrs)?.[1] ?? '').matchAll(/([\d.e+-]+),([\d.e+-]+)/g),
          ].map((p) => [Number(p[1]), Number(p[2])]);
          for (let i = 1; i < points.length; i++)
            expect(crossesReadingBox(points[i - 1], points[i], label.x, label.y)).toBe(false);
        }
      }
  }
});

it('follows adjacent sun states smoothly and does not jump when the second droplet appears', () => {
  let previous: ReturnType<typeof render> | undefined;
  for (let altitude = 0; altitude <= 55; altitude += 0.5) {
    const label = render(true, altitude, false);
    for (const reveal of [0, 0.01, 0.5, 1]) {
      const both = render(true, altitude, true, reveal);
      expect([both.x, both.y]).toEqual([label.x, label.y]);
    }
    if (previous) expect(Math.hypot(label.x - previous.x, label.y - previous.y)).toBeLessThan(0.88);
    previous = label;
  }
  for (const chapter of [5, 6])
    for (const progress of [0, 0.12, 0.5, 0.62, 1]) {
      const shot = rainbowShot(chapter, progress);
      const direct = render(true, shot.sunAltitude, shot.twoDrops, shot.revealSecond);
      render(true, 55, true);
      expect(render(true, shot.sunAltitude, shot.twoDrops, shot.revealSecond)).toEqual(direct);
    }
});

it('retains the desktop annotation anchor and its existing placement', () => {
  for (const altitude of [0, 11.5, 12, 12.5, 55])
    for (const twoDrops of [false, true]) {
      const label = render(false, altitude, twoDrops);
      expect(label.centered).toBe(false);
      expect(label.x).toBe(230);
      const eyeY = Number(/<circle cx="148" cy="([^"]+)" r="3.7"/.exec(label.html)![1]);
      expect(label.y).toBe(eyeY - 23);
    }
});
