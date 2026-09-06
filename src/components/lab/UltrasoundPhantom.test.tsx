import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translate } from '../../i18n';
import {
  ultrasoundColumn,
  ultrasoundDefaults,
  ultrasoundLine,
  ultrasoundPackets,
  ultrasoundShot,
  type UltrasoundShot,
} from '../../models/ultrasound';
import { UltrasoundPhantom } from './UltrasoundBench';

function manualShot(x: number, time: number): UltrasoundShot {
  const config = { ...ultrasoundDefaults };
  const line = ultrasoundLine(ultrasoundColumn(x, config), config);
  return { ...ultrasoundShot(1, 0), x, time, config, line, packets: ultrasoundPackets(line, time) };
}

function packets(svg: string) {
  return [...svg.matchAll(/<g\b[^>]*\bopacity="[^"]+"[^>]*>([\s\S]*?)<\/g>/g)].map((group) => {
    const rect = group[1].match(/<rect\b[^>]*>/)![0];
    const path = group[1].match(/<path\b[^>]*>/)![0];
    const number = (attribute: string) => +rect.match(new RegExp(`${attribute}="([^"]+)"`))![1];
    const d = path.match(/\bd="([^"]+)"/)![1];
    const [, arrowX, arrowY, travel] = d.match(/^M (\S+) (\S+) v (\S+)/)!;
    return {
      x: number('x'),
      y: number('y'),
      width: number('width'),
      height: number('height'),
      arrowX: +arrowX,
      arrowY: +arrowY,
      travel: +travel,
      d,
    };
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('ultrasound packet direction arrows at the phantom edges', () => {
  for (const locale of ['zh', 'en'] as const)
    for (const compact of [true, false])
      for (const x of [-18, 0, 18])
        for (const time of [10, 18, 60])
          it(`${locale}, ${compact ? 'narrow' : 'wide'}, x=${x} mm, t=${time} µs`, () => {
            vi.stubGlobal('document', { documentElement: { lang: locale } });
            const shot = manualShot(x, time);
            const svg = renderToStaticMarkup(createElement(UltrasoundPhantom, { shot, compact }));
            const rendered = packets(svg);
            const left = compact ? 35 : 40,
              right = compact ? 304 : 424,
              bottom = compact ? 249 : 337;
            const probe = left + ((x + 20) / 40) * (right - left);
            const depthY = (depth: number) => 70 + (depth / 64) * (bottom - 70);

            expect(svg).toContain(
              `aria-label="${translate('已知体模与探头：脉冲按真实传播时刻经过界面并返回。', locale)}"`,
            );
            expect(rendered).toHaveLength(shot.packets.length);
            expect(rendered.length).toBeGreaterThan(0);
            if (time === 10) expect(shot.packets.map((packet) => packet.direction)).toContain('up');
            if (time === 18) expect(shot.packets[0].direction).toBe('down');
            if (time === 60)
              expect(shot.packets.every((packet) => packet.direction === 'up')).toBe(true);

            rendered.forEach((packet, index) => {
              const physical = shot.packets[index];
              // Four-unit arrowhead plus half the 1.6-unit stroke: the entire
              // arrow, not just its anchor, needs clear space inside the clip.
              expect(packet.arrowX - 4.8 - left).toBeGreaterThanOrEqual(6);
              expect(right - packet.arrowX - 4.8).toBeGreaterThanOrEqual(6);
              expect(packet.arrowX - probe).toBeCloseTo(x === 18 ? -24 : 24, 10);

              // Moving the annotation sideways must not move or widen the pulse,
              // alter its model depth, or turn a returning packet into a transmit.
              expect(packet.x).toBeCloseTo(probe - 16, 10);
              expect(packet.width).toBe(32);
              expect(packet.y).toBeCloseTo(depthY(physical.top), 10);
              expect(packet.height).toBeCloseTo(depthY(physical.bottom) - depthY(physical.top), 10);
              expect(packet.arrowY + packet.travel / 2).toBeCloseTo(depthY(physical.center), 10);
              expect(packet.travel).toBe(physical.direction === 'down' ? 12 : -12);
              expect(packet.d).toMatch(
                physical.direction === 'down' ? /m -4 -4 4 4 4 -4$/ : /m -4 4 4 -4 4 4$/,
              );
            });
          });

  it('reconstructs the same geometry after other probe/time states and clears expired packets', () => {
    const render = (x: number, time: number) =>
      packets(
        renderToStaticMarkup(
          createElement(UltrasoundPhantom, { shot: manualShot(x, time), compact: true }),
        ),
      );
    const initial = render(0, 18);
    render(18, 60);
    render(-18, 10);
    expect(render(0, 18)).toEqual(initial);
    expect(render(18, 86)).toEqual([]);
    expect(render(0, 18)).toEqual(initial);
  });
});
