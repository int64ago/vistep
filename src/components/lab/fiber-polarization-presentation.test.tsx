import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { traceFiber, fiberShot, acceptance } from '../../models/fiber';
import { polarizationShot } from '../../models/polarization';
import { FiberDrawing, fiberDrawingLayout } from './FiberDrawing';
import { PolarizationFocus, PolarizationReceiverComparison } from './PolarizationOptics';

const widths = [200, 246, 250, 358, 619, 620, 840, 1320];
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
const screenValues = (html: string) =>
  [...html.matchAll(/<circle\b[^>]*data-screen-intensity="[^"]+"[^>]*>/g)].map(([tag]) => ({
    intensity: Number(attr(tag, 'data-screen-intensity')),
    opacity: Number(attr(tag, 'opacity')),
  }));

describe('fiber and polarization presentation bounds', () => {
  it('fits every model segment across the full reachable angle/index grid with one isotropic scale', () => {
    let smallestMargin = Infinity;
    let longestTail = 0;
    for (const compact of [true, false]) {
      const layouts = widths.map(fiberDrawingLayout).filter((l) => l.compact === compact);
      for (let a = 0; a <= 350; a++) {
        for (let n = 1440; n <= 1480; n++) {
          const ray = traceFiber(a / 10, n / 1000, layouts[0].length);
          for (const segment of ray.segments) {
            if (segment.escaped) {
              longestTail = Math.max(
                longestTail,
                Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y),
              );
            }
            for (const layout of layouts) {
              for (const p of [segment.a, segment.b]) {
                const x = layout.start + p.x * layout.scale;
                const y = layout.center - p.y * layout.scale;
                smallestMargin = Math.min(
                  smallestMargin,
                  x,
                  layout.width - x,
                  y,
                  layout.height - y,
                );
              }
            }
          }
        }
      }
    }
    // Every straight segment and all its moving markers lie in this convex box;
    // the 3.5px marker radius still leaves at least 10.5px at the nearest edge.
    expect(smallestMargin).toBeGreaterThanOrEqual(14 - 1e-9);
    expect(longestTail).toBeCloseTo(100, 10);
  });

  it('keeps geometry fixed across all film chapters instead of reframing for each ray', () => {
    for (const width of widths) {
      const layout = fiberDrawingLayout(width);
      for (let chapter = 0; chapter < 8; chapter++) {
        for (const p of [0, 0.125, 0.25, 0.5, 0.75, 1]) {
          const shot = fiberShot(chapter, p);
          const html = renderToStaticMarkup(
            <FiberDrawing
              width={width}
              angle={shot.angle}
              cladding={shot.cladding}
              time={shot.packetTime}
              reveal={shot.layerReveal}
              digital={chapter === 7}
            />,
          );
          const svg = html.match(/<svg\b[^>]*>/)![0];
          const body = html.match(/<rect\b[^>]*fill="#7b80a0"[^>]*>/)![0];
          expect(Number(attr(svg, 'width'))).toBe(width);
          expect(Number(attr(svg, 'height'))).toBe(layout.height);
          expect(Number(attr(body, 'x'))).toBe(layout.start);
          expect(Number(attr(body, 'width'))).toBeCloseTo(layout.length * layout.scale, 12);
          expect(Number(attr(body, 'height'))).toBeCloseTo(250 * layout.scale, 12);
          expect(attr(svg, 'viewBox')).toBe(`0 0 ${width} ${layout.height}`);
        }
      }
    }
  });

  it('preserves actual refracted segment directions and dimensions in the rendered SVG', () => {
    const critical = (acceptance().angle * 180) / Math.PI;
    for (const width of [200, 250, 358, 840]) {
      const layout = fiberDrawingLayout(width);
      for (const angle of [0, 4.8, 9, critical - 1e-5, critical + 1e-5, 14.2, 35]) {
        for (const cladding of [1.44, 1.46, 1.48]) {
          const ray = traceFiber(angle, cladding, layout.length);
          const html = renderToStaticMarkup(
            <FiberDrawing
              width={width}
              angle={angle}
              cladding={cladding}
              time={0}
              reveal={1}
              digital={false}
            />,
          );
          const paths = [...html.matchAll(/<path\b[^>]*>/g)]
            .map(([tag]) => tag)
            .filter(
              (tag) =>
                ['#ead09f', '#de9b9c'].includes(attr(tag, 'stroke') ?? '') &&
                attr(tag, 'fill') === 'none',
            );
          expect(paths).toHaveLength(ray.segments.length);
          paths.forEach((tag, i) => {
            const xy = attr(tag, 'd')!.slice(1).split(/[ L]/).map(Number);
            const physical = [
              (xy[0] - layout.start) / layout.scale,
              (layout.center - xy[1]) / layout.scale,
              (xy[2] - layout.start) / layout.scale,
              (layout.center - xy[3]) / layout.scale,
            ];
            const s = ray.segments[i];
            [s.a.x, s.a.y, s.b.x, s.b.y].forEach((expected, j) =>
              expect(physical[j]).toBeCloseTo(expected, 9),
            );
          });
        }
      }
    }
  });

  it('retains the reported 24.85 percent escaped branch entirely within the phone drawing', () => {
    const l = fiberDrawingLayout(250);
    const segment = traceFiber(14.2, 1.46, l.length)
      .segments.filter((s) => s.escaped)
      .at(-1)!;
    expect(segment.power).toBeCloseTo(0.24847654598774732, 12);
    const x = l.start + segment.b.x * l.scale;
    expect(x + 3.5).toBeLessThan(250 - 10);
    expect(l.start + l.length * l.scale).toBe(l.end);
  });

  it('keeps a lit reference while the current receiver follows the actual crossed-filter output to darkness', () => {
    const initial = polarizationShot(4, 0).state;
    const reference = initial.output.intensity / initial.input.intensity;
    let previous = Infinity;
    for (let i = 0; i <= 100; i++) {
      const state = polarizationShot(4, i / 100).state;
      const html = renderToStaticMarkup(<PolarizationReceiverComparison state={state} />);
      const [start, current] = screenValues(html);
      expect(start.intensity).toBeCloseTo(reference, 12);
      expect(start.opacity).toBeCloseTo(Math.sqrt(reference), 12);
      expect(current.intensity).toBeCloseTo(state.output.intensity / state.input.intensity, 12);
      expect(current.opacity).toBeCloseTo(Math.sqrt(current.intensity), 12);
      expect(current.intensity).toBeLessThanOrEqual(previous);
      previous = current.intensity;
    }
    expect(previous).toBe(0);
    expect(reference).toBeCloseTo(0.125, 12);
  });

  it('reconstructs the receiver immediately on out-of-order chapter seeks without an exposure history', () => {
    const render = (p: number) =>
      renderToStaticMarkup(
        <PolarizationFocus {...polarizationShot(4, p)} time={89 + 22 * p} width={246} />,
      );
    const first = render(0.35);
    render(1);
    render(0);
    expect(render(0.35)).toBe(first);
    const dark = render(1);
    expect(dark).toContain('polarization-crossed-observation');
    expect(dark).toContain('polarization-receiver-comparison');
    expect(dark).toContain('polarization-curve');
    expect(screenValues(dark).map((s) => s.intensity)).toEqual([
      polarizationShot(4, 0).state.output.intensity,
      0,
    ]);
    for (let chapter = 0; chapter < 8; chapter++) {
      const html = renderToStaticMarkup(
        <PolarizationFocus
          {...polarizationShot(chapter, 0.5)}
          time={chapter * 22 + 11}
          width={246}
        />,
      );
      expect(html.includes('polarization-receiver-comparison')).toBe(chapter === 4);
    }
  });
});
