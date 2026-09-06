import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const language = vi.hoisted(() => ({ en: false }));
vi.mock('../../i18n', async () => {
  const { default: translations } = await import('../../i18n/en.json');
  return {
    t: (text: string) =>
      language.en ? ((translations as Record<string, string>)[text] ?? text) : text,
  };
});
import ExcavatorCircuit from './ExcavatorCircuit';

type Attributes = Record<string, string>;
type Point = [number, number];
type Segment = [Point, Point];
const valves = ['extend', 'retract', 'hold', 'relief'] as const;
const ports = {
  A: [145, 172],
  B: [175, 172],
  P: [145, 224],
  T: [175, 224],
} satisfies Record<string, Point>;

function render(piston = 0.5, valve: string = 'extend', flow = 40) {
  return renderToStaticMarkup(createElement(ExcavatorCircuit, { piston, valve, flow }));
}

function elements(html: string, tag: string): Attributes[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'g'))].map((match) =>
    Object.fromEntries([...match[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  );
}

// Only straight SVG centerlines are relevant to these hydraulic connections.
// Separate M subpaths remain separate at unmarked line crossings.
function segments(d: string): Segment[] {
  const parts = [...d.matchAll(/([MLHV])([^MLHV]*)/g)];
  const result: Segment[] = [];
  let current: Point = [0, 0];
  for (const [, command, values] of parts) {
    const n = values.trim().split(/[ ,]+/).map(Number);
    const next: Point =
      command === 'H' ? [n[0], current[1]] : command === 'V' ? [current[0], n[0]] : [n[0], n[1]];
    if (command !== 'M') result.push([current, next]);
    current = next;
  }
  return result;
}

function onSegment([x, y]: Point, [[ax, ay], [bx, by]]: Segment) {
  const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
  return (
    Math.abs(cross) < 1e-8 &&
    x >= Math.min(ax, bx) - 1e-8 &&
    x <= Math.max(ax, bx) + 1e-8 &&
    y >= Math.min(ay, by) - 1e-8 &&
    y <= Math.max(ay, by) + 1e-8
  );
}

function connected(lines: Segment[], from: Point, to: Point) {
  const reached = new Set<number>();
  const pending = lines.flatMap((line, i) => (onSegment(from, line) ? [i] : []));
  while (pending.length) {
    const i = pending.pop()!;
    if (reached.has(i)) continue;
    reached.add(i);
    if (onSegment(to, lines[i])) return true;
    for (let j = 0; j < lines.length; j++) {
      const a = lines[i],
        b = lines[j];
      // A terminating branch joins the other line; two mid-line crossings do not.
      if (a.some((p) => onSegment(p, b)) || b.some((p) => onSegment(p, a))) pending.push(j);
    }
  }
  return false;
}

function valveLines(html: string) {
  const path = elements(html, 'path').find((p) => p.stroke === '#4a686b');
  expect(path).toBeDefined();
  return segments(path!.d);
}

function assembly(html: string) {
  const rects = elements(html, 'rect');
  const [housing, rod] = rects
    .filter((r) => r.fill === 'url(#cylinder-steel)')
    .sort((a, b) => Number(b.height) - Number(a.height));
  const piston = rects.find(
    (r) =>
      Number(r.width) < Number(r.height) / 2 &&
      Number(r.y) < Number(housing.y) + Number(housing.height),
  )!;
  const chambers = rects.filter((r) => Number(r.opacity) > 0 && Number(r.opacity) < 1);
  return { housing, rod, piston, chambers };
}

describe('excavator cylinder and hydraulic circuit', () => {
  it('translates a rigid rod with the piston while retaining positive chambers and frame clearance', () => {
    const initial = assembly(render(0));
    const initialRodEnd = Number(initial.rod.x) + Number(initial.rod.width);
    const initialCavity = initial.chambers.reduce((sum, r) => sum + Number(r.width), 0);
    for (let step = 0; step <= 40; step++) {
      const html = render(step / 40);
      const { housing, rod, piston, chambers } = assembly(html);
      const viewBox = elements(html, 'svg')[0].viewBox.split(' ').map(Number);
      expect(housing).toEqual(initial.housing);
      expect(Number(rod.width)).toBe(Number(initial.rod.width));
      expect(Number(rod.height)).toBe(Number(initial.rod.height));
      expect(Number(rod.x)).toBeCloseTo(Number(piston.x) + Number(piston.width), 10);
      const translation = Number(piston.x) - Number(initial.piston.x);
      const rodEnd = Number(rod.x) + Number(rod.width);
      expect(rodEnd - initialRodEnd).toBeCloseTo(translation, 10);
      expect(rodEnd).toBeGreaterThan(Number(housing.x) + Number(housing.width));
      expect(rodEnd).toBeLessThan(viewBox[0] + viewBox[2]);
      expect(chambers).toHaveLength(2);
      for (const chamber of chambers) {
        expect(Number(chamber.width)).toBeGreaterThan(0);
        expect(Number(chamber.x)).toBeGreaterThan(Number(housing.x));
        expect(Number(chamber.x) + Number(chamber.width)).toBeLessThan(
          Number(housing.x) + Number(housing.width),
        );
      }
      expect(chambers.reduce((sum, r) => sum + Number(r.width), 0)).toBeCloseTo(initialCavity, 10);
      expect(Number(chambers[0].x) + Number(chambers[0].width)).toBeCloseTo(Number(piston.x), 10);
      expect(Number(chambers[1].x)).toBeCloseTo(Number(piston.x) + Number(piston.width), 10);
    }
    expect(assembly(render(-10))).toEqual(initial);
    expect(assembly(render(10))).toEqual(assembly(render(1)));
  });

  it('closes all four work-valve ports and removes flow arrows during holding', () => {
    const html = render(0.5, 'hold');
    const lines = valveLines(html);
    for (const [name, point] of Object.entries(ports))
      for (const [other, destination] of Object.entries(ports))
        if (name !== other)
          expect(connected(lines, point, destination), `${name} → ${other}`).toBe(false);
    expect(elements(html, 'path').filter((p) => p['marker-end'])).toHaveLength(0);
  });

  it('connects the correct chamber and return in both travel directions without joining crossed lines', () => {
    for (const [valve, supply, drain] of [
      ['extend', 'A', 'B'],
      ['retract', 'B', 'A'],
    ] as const) {
      const html = render(0.5, valve);
      const lines = valveLines(html);
      expect(connected(lines, ports.P, ports[supply])).toBe(true);
      expect(connected(lines, ports[drain], ports.T)).toBe(true);
      expect(connected(lines, ports.P, ports.T)).toBe(false);
      expect(connected(lines, ports.A, ports.B)).toBe(false);
      expect(elements(html, 'path').filter((p) => p['marker-end'])).toHaveLength(2);
    }
  });

  it('keeps the lift command connected during relief and routes the sole flow arrow through the pump bypass', () => {
    const html = render(0.5, 'relief');
    const paths = elements(html, 'path');
    const lines = valveLines(html);
    expect(connected(lines, ports.P, ports.A)).toBe(true);
    expect(connected(lines, ports.B, ports.T)).toBe(true);
    expect(connected(lines, ports.P, ports.T)).toBe(false);
    const bypass = paths.find((p) => {
      if (!p.stroke || p['marker-end'] || !p.d.includes('239')) return false;
      const route = segments(p.d);
      return connected(route, [105, 233], [240, 246]);
    });
    expect(bypass).toBeDefined();
    const holdBypass = elements(render(0.5, 'hold'), 'path').find((p) => p.d === bypass!.d)!;
    expect(bypass!.stroke).not.toBe(holdBypass.stroke);
    const arrows = paths.filter((p) => p['marker-end']);
    expect(arrows).toHaveLength(1);
    for (const line of segments(arrows[0].d))
      for (const point of line)
        expect(segments(bypass!.d).some((part) => onSegment(point, part))).toBe(true);
    expect(arrows[0].stroke).toBe(bypass!.stroke);
  });

  it('shows no flowing-oil arrow when supplied flow is zero, including an overloaded lift command', () => {
    for (const valve of valves)
      expect(
        elements(render(0.5, valve, 0), 'path').filter((p) => p['marker-end']),
        valve,
      ).toHaveLength(0);
  });

  it('states that the section is one of two cylinders sharing total flow in both languages', () => {
    for (const en of [false, true]) {
      language.en = en;
      const html = render();
      expect(html).toContain(
        en ? 'One of two boom cylinders · Q/2 each' : '两支动臂缸中的一支 · 每支流量 Q/2',
      );
    }
    language.en = false;
  });
});
