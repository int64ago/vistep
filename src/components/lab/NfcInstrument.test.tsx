import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NfcInduction, NfcLoad, NfcPacket, NfcPower } from '../experiments/Nfc';
import { NFC_DEFAULT, nfcLink } from '../../models/nfc';
import { nfcRectifierTrace, nfcShot } from '../../models/nfc-film';

type Node = { tag: string; attrs: Record<string, string>; children: Node[]; text: string };

function parse(markup: string) {
  const root: Node = { tag: 'root', attrs: {}, children: [], text: '' },
    stack = [root];
  for (const match of markup.matchAll(/<(\/?)([A-Za-z][\w:-]*)\b([^>]*)>|([^<]+)/g)) {
    if (match[4]) {
      stack.at(-1)!.text += match[4];
      continue;
    }
    if (match[1]) {
      expect(stack.pop()?.tag).toBe(match[2]);
      continue;
    }
    const node: Node = {
      tag: match[2],
      attrs: Object.fromEntries(
        [...match[3].matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
      ),
      children: [],
      text: '',
    };
    stack.at(-1)!.children.push(node);
    if (!match[0].endsWith('/>')) stack.push(node);
  }
  expect(stack).toHaveLength(1);
  return root;
}
const all = (n: Node): Node[] => [n, ...n.children.flatMap(all)];
const number = (n: Node, key: string) => Number(n.attrs[key]);
const numeric = '[-+]?(?:\\d*\\.)?\\d+(?:e[-+]?\\d+)?';
const points = (d: string) =>
  [...d.matchAll(new RegExp(`[ML](${numeric}),(${numeric})`, 'g'))].map((p) => [
    Number(p[1]),
    Number(p[2]),
  ]);

/** Extract actual straight wires; no knowledge of the component's layout constants. */
function straightSegments(d: string) {
  const tokens = d.match(new RegExp(`[MLHV]|${numeric}`, 'g')) ?? [];
  const segments: [number[], number[]][] = [];
  let current = [0, 0];
  for (let i = 0; i < tokens.length;) {
    const command = tokens[i++];
    const next =
      command === 'M' || command === 'L'
        ? [Number(tokens[i++]), Number(tokens[i++])]
        : command === 'H'
          ? [Number(tokens[i++]), current[1]]
          : [current[0], Number(tokens[i++])];
    if (command !== 'M') segments.push([current, next]);
    current = next;
  }
  return segments;
}
function pointOnWire(x: number, y: number, svg: Node) {
  return all(svg)
    .filter((n) => n.tag === 'path' && /^[MLHV0-9e+.,\s-]+$/.test(n.attrs.d ?? ''))
    .flatMap((n) => straightSegments(n.attrs.d))
    .some(
      ([a, b]) =>
        Math.abs((x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0])) < 1e-7 &&
        x >= Math.min(a[0], b[0]) &&
        x <= Math.max(a[0], b[0]) &&
        y >= Math.min(a[1], b[1]) &&
        y <= Math.max(a[1], b[1]),
    );
}

describe('NFC actual instrument drawing: independent renderer checks', () => {
  it('draws induced voltage as the negative time derivative of the drawn flux linkage', () => {
    for (const width of [288, 860])
      for (const envelope of [0, 1]) {
        const state = nfcLink(NFC_DEFAULT, envelope).unloaded,
          phase = (19 / 128) * Math.PI * 2;
        const root = parse(
          renderToStaticMarkup(createElement(NfcInduction, { state, phase, width })),
        );
        const svgs = all(root).filter((n) => n.tag === 'svg');
        const curves = svgs.map((svg) => {
          const curve = all(svg).find(
            (n) => n.tag === 'path' && points(n.attrs.d ?? '').length > 100,
          )!;
          return points(curve.attrs.d).map((p) => (25 - p[1]) / 19);
        });
        const [flux, voltage] = curves;
        const angleStep = (2 * Math.PI) / (flux.length - 1);
        for (let i = 1; i < flux.length - 1; i++)
          expect(voltage[i]).toBeCloseTo(
            -(flux[i + 1] - flux[i - 1]) / (2 * Math.sin(angleStep)),
            11,
          );
        svgs.forEach((svg, row) => {
          const dot = all(svg).find((n) => n.tag === 'circle')!;
          expect((25 - number(dot, 'cy')) / 19).toBeCloseTo(curves[row][19], 11);
        });
        if (!envelope) expect(curves.flat().every((v) => v === 0)).toBe(true);
      }
  });

  it('connects both physical AC source terminals to the drawn bridge wires', () => {
    for (const width of [288, 860]) {
      const root = parse(renderToStaticMarkup(createElement(NfcPower, { width, progress: 0.1 })));
      const svg = all(root).find((n) => n.tag === 'svg')!,
        source = all(svg).find((n) => n.tag === 'circle')!;
      for (const sign of [-1, 1])
        expect(
          pointOnWire(number(source, 'cx'), number(source, 'cy') + sign * number(source, 'r'), svg),
        ).toBe(true);
    }
  });

  it('turns bridge diodes off while stored capacitor voltage exceeds the AC magnitude', () => {
    for (const progress of [0, 1 / 12, 1 / 6, 1 / 4, 1 / 3]) {
      const root = parse(renderToStaticMarkup(createElement(NfcPower, { width: 500, progress })));
      const symbols = all(root).filter((n) => n.tag === 'path' && n.attrs.d?.includes('M-7 -6'));
      expect(symbols).toHaveLength(4);
      const lit = symbols.filter((n) => n.attrs.fill === '#edc39b');
      const atPeak = progress === 1 / 12 || progress === 1 / 4;
      expect(lit).toHaveLength(atPeak ? 2 : 0);
    }
  });

  it('routes either AC polarity through the bridge in the same output direction', () => {
    for (const width of [288, 860])
      for (const [progress, positive] of [
        [1 / 12, true],
        [1 / 4, false],
      ] as const) {
        const root = parse(renderToStaticMarkup(createElement(NfcPower, { width, progress })));
        const diodes = all(root)
          .filter(
            (n) =>
              n.tag === 'g' &&
              n.children.some(
                (child) =>
                  child.tag === 'g' && all(child).some((p) => p.attrs.d?.includes('M-7 -6')),
              ),
          )
          .map((n) => {
            const wire = n.children.find((child) => child.tag === 'path')!;
            const ends = points(wire.attrs.d);
            const symbol = all(n).find((p) => p.attrs.d?.includes('M-7 -6'))!;
            return { from: ends[0], to: ends[1], lit: symbol.attrs.fill === '#edc39b' };
          });
        expect(diodes).toHaveLength(4);
        const endpoints = diodes.flatMap((d) => [d.from, d.to]),
          top = endpoints.reduce((a, b) => (a[1] < b[1] ? a : b)),
          bottom = endpoints.reduce((a, b) => (a[1] > b[1] ? a : b)),
          left = endpoints.reduce((a, b) => (a[0] < b[0] ? a : b)),
          right = endpoints.reduce((a, b) => (a[0] > b[0] ? a : b));
        const active = diodes.filter((d) => d.lit);
        expect(active.map((d) => [d.from, d.to])).toEqual(
          expect.arrayContaining([
            [positive ? left : right, top],
            [bottom, positive ? right : left],
          ]),
        );
        // Every diode points from an AC terminal into +, or from − to an AC terminal.
        for (const d of diodes) expect(d.to[1] === top[1] || d.from[1] === bottom[1]).toBe(true);
      }
  });

  it('connects the load switch return contact to its added resistance', () => {
    const link = nfcLink(NFC_DEFAULT);
    for (const width of [288, 860])
      for (const on of [false, true]) {
        const root = parse(
          renderToStaticMarkup(
            createElement(NfcLoad, { width, on, state: on ? link.loaded : link.unloaded }),
          ),
        );
        const svg = all(root).find((n) => n.tag === 'svg')!,
          contacts = all(svg).filter((n) => n.tag === 'circle' && number(n, 'r') === 3),
          lower = contacts.reduce((a, b) => (number(a, 'cy') > number(b, 'cy') ? a : b)),
          resistor = all(svg).find((n) => n.tag === 'rect' && n.attrs.stroke)!;
        const cx = number(lower, 'cx'),
          y = number(resistor, 'y');
        expect(pointOnWire(cx, y, svg)).toBe(true);
        expect(pointOnWire(cx, (number(lower, 'cy') + y) / 2, svg)).toBe(true);
        const switchPath = all(svg).find((n) => 'data-nfc-switch' in n.attrs)!;
        expect(switchPath.attrs['data-nfc-switch']).toBe(on ? 'closed' : 'open');
        expect(
          renderToStaticMarkup(
            createElement(NfcLoad, { width, on, state: on ? link.loaded : link.unloaded }),
          ),
        ).toContain(((on ? link.loaded : link.unloaded).readerCurrentRmsA * 1000).toFixed(2));
      }
  });

  it('shows a flat zero reader field when a manual request has no RF source', () => {
    const link = nfcLink(NFC_DEFAULT, 0);
    const root = parse(
      renderToStaticMarkup(
        createElement(NfcPacket, {
          width: 500,
          progress: 1,
          bits: '10110010',
          link,
          request: true,
        }),
      ),
    );
    const paths = all(root).filter(
      (n) =>
        n.tag === 'path' && n.attrs.d?.includes('H') && (n.attrs.d.match(/H/g)?.length ?? 0) > 10,
    );
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const y = points(p.attrs.d).map((v) => v[1]);
      expect(new Set(y).size).toBe(1);
    }
  });

  it('renders actual decoded bits from the current envelope and leaves a powerless reply blank', () => {
    for (const width of [288, 860])
      for (const bits of ['10110010', '00000000', '11111111', '01010101'])
        for (const powered of [false, true]) {
          const link = nfcLink(NFC_DEFAULT, powered ? 1 : 0);
          for (const progress of [0, 0.5, 1]) {
            const root = parse(
              renderToStaticMarkup(createElement(NfcPacket, { width, progress, bits, link })),
            );
            const decoded = all(root).filter((n) => n.tag === 'b' && 'data-complete' in n.attrs);
            expect(decoded).toHaveLength(8);
            decoded.forEach((n, index) => {
              expect(n.text).toBe(
                index < Math.floor(progress * 8) ? (powered ? bits[index] : '—') : '·',
              );
            });
          }
        }
  });

  it('keeps one physical current magnification across different antenna poses', () => {
    const scales: number[] = [];
    for (const pose of [NFC_DEFAULT, { gapM: 0.025, tiltDeg: 0 }, { gapM: 0.004, tiltDeg: 40 }]) {
      const link = nfcLink(pose);
      expect(link.powered).toBe(true);
      const root = parse(
        renderToStaticMarkup(
          createElement(NfcPacket, {
            width: 500,
            progress: 1,
            bits: '10110010',
            link,
          }),
        ),
      );
      const curve = all(root).find(
        (n) =>
          n.tag === 'path' &&
          n.attrs.stroke === '#236f72' &&
          (n.attrs.d?.match(/H/g)?.length ?? 0) > 100,
      )!;
      const y = points(curve.attrs.d).map((p) => p[1]);
      scales.push((Math.max(...y) - Math.min(...y)) / link.currentDifferenceA);
    }
    for (const scale of scales) expect(scale).toBeCloseTo(scales[0], 9);
  });
});

describe('NFC director and isolated supply inset: independent review', () => {
  it('restores baseline geometry between distance and orientation comparisons', () => {
    const baseline = { gapMm: 8, tiltDeg: 0 };
    for (let i = 0; i <= 200; i++) {
      const progress = i / 200,
        shot = nfcShot(6, progress, 144 + progress * 24);
      expect(shot.gapMm).toBeGreaterThanOrEqual(8);
      expect(shot.gapMm).toBeLessThanOrEqual(60);
      expect(shot.tiltDeg).toBeGreaterThanOrEqual(0);
      expect(shot.tiltDeg).toBeLessThanOrEqual(80);
      if (shot.gapMm !== baseline.gapMm) expect(shot.tiltDeg).toBe(baseline.tiltDeg);
      if (shot.tiltDeg !== baseline.tiltDeg) expect(shot.gapMm).toBe(baseline.gapMm);
    }
    for (const progress of [0, 1]) {
      const shot = nfcShot(6, progress, 144 + progress * 24);
      expect({ gapMm: shot.gapMm, tiltDeg: shot.tiltDeg }).toEqual(baseline);
    }
    const comparisons = Array.from({ length: 201 }, (_, i) =>
      nfcShot(6, i / 200, 144 + (i / 200) * 24),
    );
    const lastDistance = comparisons.findLastIndex((shot) => shot.gapMm !== 8),
      firstTilt = comparisons.findIndex((shot) => shot.tiltDeg !== 0);
    expect(firstTilt - lastDistance).toBeGreaterThan(2);
    const saved = nfcShot(5, 0.36, 128.64);
    nfcShot(6, 1, 168);
    nfcShot(0, 0, 0);
    expect(nfcShot(5, 0.36, 128.64)).toEqual(saved);
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(() => nfcShot(bad, 0, 0)).toThrow(RangeError);
      expect(() => nfcShot(0, bad, 0)).toThrow(RangeError);
      expect(() => nfcShot(0, 0, bad)).toThrow(RangeError);
    }
  });

  it('keeps supply charge through both zero crossings and converges under smaller steps', () => {
    const coarse = nfcRectifierTrace(361),
      refined = nfcRectifierTrace(3601);
    for (let i = 0; i < coarse.length; i++) {
      const p = coarse[i];
      expect(p.stored).toBeGreaterThanOrEqual(Math.abs(p.ac));
      expect(p.stored).toBeLessThanOrEqual(1);
      expect(Math.abs(p.stored - refined[10 * i].stored)).toBeLessThan(0.001);
    }
    for (const i of [60, 120, 180, 240, 300, 360]) {
      expect(Math.abs(coarse[i].ac)).toBeLessThan(1e-14);
      expect(coarse[i].stored).toBeGreaterThan(0.7);
    }
  });
});
