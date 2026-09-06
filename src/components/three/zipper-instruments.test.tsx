import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ZipperComparison, ZipperLoad } from './ZipperDiagram';
import { zipperTooth } from '../../models/zipper';

const mode = vi.hoisted(() => ({ compact: true }));
vi.mock('../lab/useCompact', () => ({ useCompact: () => mode.compact }));

function textPosition(html: string, content: string) {
  const tag = [...html.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].find((m) => m[2] === content)!;
  return {
    x: Number(/\bx="([^"]+)"/.exec(tag[1])![1]),
    y: Number(/\by="([^"]+)"/.exec(tag[1])![1]),
  };
}

it('leaves an em-sized reading zone below L7, clear of the load arrow at every force', () => {
  for (const compact of [true, false]) {
    mode.compact = compact;
    const width = compact ? 280 : 560,
      scale = compact ? 83 : 116;
    const marked = zipperTooth(6, -1, 8);
    const bottom = Math.max(...marked.outline.map((p) => 180 - (p[1] - 6) * scale));
    for (const force of [0, 0.01, 0.5, 1]) {
      const html = renderToStaticMarkup(createElement(ZipperLoad, { force }));
      const font = Number(/font-size:([\d.]+)/.exec(html)![1]);
      const label = textPosition(html, 'L7');
      expect(label.x).toBeCloseTo(width / 2 + marked.root[0] * scale, 10);
      expect(label.y - font).toBeGreaterThan(bottom);
      expect(label.y - font).toBeGreaterThan(180 + 2.5 / 2);
      expect(label.y + font * 0.3).toBeLessThan(280 - font);
    }
  }
});

it('keeps comparison labels above actual shifted outlines, including broad and narrow heads', () => {
  for (const compact of [true, false]) {
    mode.compact = compact;
    for (const trial of [0, 0.005, 0.225, 0.45]) {
      const html = renderToStaticMarkup(createElement(ZipperComparison, { trial }));
      const font = Number(/font-size:([\d.]+)/.exec(html)![1]);
      for (const [index, shoulder] of [true, false].entries()) {
        const cy = compact ? (index ? 260 : 120) : 192,
          scale = compact ? 58 : 78;
        const top = Math.min(
          ...([-1, 1] as const).flatMap((side) =>
            (side === -1 ? [6] : [5, 6]).flatMap((i) =>
              zipperTooth(i, side, 8, shoulder).outline.map((p) => cy - (p[1] - 6) * scale),
            ),
          ),
        );
        const label = textPosition(html, shoulder ? '宽肩：不许横移' : '削去宽肩：可横移');
        expect(top - (label.y + font * 0.3)).toBeGreaterThanOrEqual(font * 0.69);
        expect(label.y - font).toBeGreaterThan(25 + font * 0.3);
      }
    }
  }
});
