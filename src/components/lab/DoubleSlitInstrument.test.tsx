import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DoubleSlitInstrument } from '../experiments/DoubleSlit';
import {
  DOUBLE_SLIT_DEFAULT,
  doubleSlitAt,
  type DoubleSlitParameters,
} from '../../models/double-slit';
import { doubleSlitShot, type DoubleSlitView } from '../../models/double-slit-film';

type SvgNode = { tag: string; attrs: Record<string, string>; children: SvgNode[] };

// Read the actual server-rendered SVG without a browser or a DOM dependency.
function parseSvg(markup: string) {
  const root: SvgNode = { tag: 'root', attrs: {}, children: [] };
  const stack = [root];
  for (const match of markup.matchAll(/<(\/?)([A-Za-z][\w:-]*)\b([^>]*)>/g)) {
    if (match[1]) {
      expect(stack.pop()?.tag).toBe(match[2]);
      continue;
    }
    const node: SvgNode = {
      tag: match[2],
      attrs: Object.fromEntries(
        [...match[3].matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
      ),
      children: [],
    };
    stack.at(-1)!.children.push(node);
    if (!match[0].endsWith('/>')) stack.push(node);
  }
  expect(stack).toHaveLength(1);
  return root.children[0];
}
const all = (node: SvgNode): SvgNode[] => [node, ...node.children.flatMap(all)];
const number = (node: SvgNode, key: string) => {
  const value = Number(node.attrs[key]);
  expect(Number.isFinite(value)).toBe(true);
  return value;
};
const tagged = (svg: SvgNode, key: string, value?: string) =>
  all(svg).filter(
    (node) => key in node.attrs && (value === undefined || node.attrs[key] === value),
  );

function render(
  parameters: DoubleSlitParameters = { ...DOUBLE_SLIT_DEFAULT },
  view: DoubleSlitView = 'phase',
  width = 860,
  probeM = 0,
  time = 0,
  detections = 0,
) {
  return parseSvg(
    renderToStaticMarkup(
      createElement(DoubleSlitInstrument, { parameters, view, width, probeM, time, detections }),
    ),
  );
}

const numeric = '([-+]?(?:\\d*\\.)?\\d+(?:e[-+]?\\d+)?)';
function vector(group: SvgNode) {
  const path = group.children.find((node) => node.tag === 'path');
  if (!path) {
    const dot = group.children.find((node) => node.tag === 'circle')!;
    return { x: number(dot, 'cx'), y: number(dot, 'cy'), dx: 0, dy: 0 };
  }
  const match = path.attrs.d.match(new RegExp(`^M${numeric},${numeric}L${numeric},${numeric}`))!;
  expect(match).not.toBeNull();
  const [x, y, endX, endY] = match.slice(1).map(Number);
  return { x, y, dx: endX - x, dy: endY - y };
}

// Independent midpoint integration over the physical aperture. It does not call
// the production sinc or intensity functions to construct its expected result.
function apertureIntensity(parameters: DoubleSlitParameters, yM: number) {
  const sine = yM / Math.hypot(parameters.distanceM, yM);
  let real = 0,
    imaginary = 0;
  for (const center of parameters.slit === 'both'
    ? [-parameters.separationM / 2, parameters.separationM / 2]
    : [-parameters.separationM / 2]) {
    for (let i = 0; i < 2048; i++) {
      const position = center + parameters.slitWidthM * ((i + 0.5) / 2048 - 0.5);
      const phase = (2 * Math.PI * position * sine) / parameters.wavelengthM;
      real += Math.cos(phase) / 2048;
      imaginary += Math.sin(phase) / 2048;
    }
  }
  return real * real + imaginary * imaginary;
}

function detector(svg: SvgNode) {
  const marks = tagged(svg, 'data-detection');
  const group = all(svg).find(
    (node) => node.tag === 'g' && node.children.some((child) => 'data-detection' in child.attrs),
  )!;
  const frame = group.children.find((node) => node.tag === 'rect')!;
  const x = number(frame, 'x'),
    width = number(frame, 'width');
  return {
    frame,
    marks: marks.map((node) => ({
      index: number(node, 'data-detection'),
      x: number(node, 'cx'),
      y: number(node, 'cy'),
      radius: number(node, 'r'),
      physicalM: ((number(node, 'cx') - x) / width - 0.5) * 0.02,
    })),
  };
}

describe('double-slit instrument rendered geometry', () => {
  it('adds only the open-slit fields, head to tail, and squares the rendered resultant', () => {
    for (const width of [360, 860])
      for (const slit of ['one', 'both'] as const)
        for (const slitWidthM of [35e-6, 70e-6]) {
          const parameters = { ...DOUBLE_SLIT_DEFAULT, slit, slitWidthM };
          const envelopeSine = parameters.wavelengthM / slitWidthM;
          const zeroM = envelopeSine / Math.sqrt(1 - envelopeSine ** 2);
          for (const probeM of [-0.0009, 0, 0.001527779560777727, 0.003, zeroM]) {
            const svg = render(parameters, 'phase', width, probeM, 3.7);
            const first = vector(tagged(svg, 'data-field', 'first')[0]);
            const sum = vector(tagged(svg, 'data-field', 'sum')[0]);
            const unitCircle = all(svg).find(
              (node) => node.tag === 'circle' && node.attrs.fill === 'none',
            )!;
            const unit = number(unitCircle, 'r');
            const secondGroups = tagged(svg, 'data-field', 'second');
            expect(secondGroups).toHaveLength(slit === 'both' ? 1 : 0);
            const second = secondGroups.length
              ? vector(secondGroups[0])
              : { x: first.x + first.dx, y: first.y + first.dy, dx: 0, dy: 0 };
            expect(second.x).toBeCloseTo(first.x + first.dx, 10);
            expect(second.y).toBeCloseTo(first.y + first.dy, 10);
            expect(sum.x).toBeCloseTo(first.x, 10);
            expect(sum.y).toBeCloseTo(first.y, 10);
            expect(sum.dx).toBeCloseTo(first.dx + second.dx, 10);
            expect(sum.dy).toBeCloseTo(first.dy + second.dy, 10);
            if (slit === 'both') {
              // S2 has extra path for positive screen y, hence a phase lag.
              // SVG's downward y reverses the usual Cartesian cross-product sign.
              const phase =
                (2 * Math.PI * parameters.separationM * probeM) /
                (parameters.wavelengthM * Math.hypot(parameters.distanceM, probeM));
              const expectedCross =
                apertureIntensity({ ...parameters, slit: 'one' }, probeM) * Math.sin(phase);
              expect((first.dx * second.dy - first.dy * second.dx) / unit ** 2).toBeCloseTo(
                expectedCross,
                5,
              );
            }
            const renderedIntensity = (sum.dx ** 2 + sum.dy ** 2) / unit ** 2;
            expect(renderedIntensity).toBeCloseTo(apertureIntensity(parameters, probeM), 5);
            expect(renderedIntensity).toBeCloseTo(doubleSlitAt(parameters, probeM).intensity, 10);
            if (slit === 'one' && probeM === 0) expect(renderedIntensity).toBeCloseTo(1, 12);
            if (slit === 'both' && probeM === 0) expect(renderedIntensity).toBeCloseTo(4, 12);
          }
        }
  });

  it('uses the same single-slit reference in the gradient actually attached to the screen', () => {
    for (const slit of ['one', 'both'] as const) {
      const parameters = { ...DOUBLE_SLIT_DEFAULT, slit };
      const svg = render(parameters, 'width');
      const gradient = all(svg).find((node) => node.tag === 'linearGradient')!;
      expect(
        all(svg).some(
          (node) => node.tag === 'rect' && node.attrs.fill === `url(#${gradient.attrs.id})`,
        ),
      ).toBe(true);
      const stops = gradient.children.filter((node) => node.tag === 'stop');
      const centre = stops.find((node) => number(node, 'offset') === 0.5)!;
      expect(number(centre, 'stop-opacity')).toBe(slit === 'one' ? 0.25 : 1);
      for (const stop of stops.filter((_, i) => i % 40 === 0)) {
        const physicalM = (number(stop, 'offset') - 0.5) * 0.02;
        expect(4 * number(stop, 'stop-opacity')).toBeCloseTo(
          apertureIntensity(parameters, physicalM),
          5,
        );
      }
    }
  });

  it('draws slit width and centre separation on one scale in both aperture views', () => {
    for (const width of [360, 860])
      for (const separationM of [120e-6, 180e-6, 300e-6])
        for (const slitWidthM of [20e-6, 70e-6]) {
          const parameters = { ...DOUBLE_SLIT_DEFAULT, separationM, slitWidthM };
          const comparison = render(parameters, 'width', width);
          const slits = tagged(comparison, 'data-slit');
          expect(slits).toHaveLength(2);
          const centres = slits.map((node) =>
            Number(node.attrs.d.match(new RegExp(`^M${numeric},`))![1]),
          );
          const slitWidth = number(slits[0], 'stroke-width');
          expect(number(slits[1], 'stroke-width')).toBe(slitWidth);
          expect(Math.abs(centres[1] - centres[0]) / slitWidth).toBeCloseTo(
            separationM / slitWidthM,
            12,
          );

          const bench = render(parameters, 'paths', width);
          const wallSegments = all(bench)
            .filter((node) => node.tag === 'path')
            .map((node) => [
              ...node.attrs.d.matchAll(new RegExp(`M${numeric},${numeric}V${numeric}`, 'g')),
            ])
            .find((segments) => segments.length === 3)!;
          expect(wallSegments).toBeDefined();
          const segments = wallSegments.map((match) => match.slice(1).map(Number));
          const gap1 = segments[1][1] - segments[0][2],
            gap2 = segments[2][1] - segments[1][2];
          const centre1 = (segments[1][1] + segments[0][2]) / 2,
            centre2 = (segments[2][1] + segments[1][2]) / 2;
          expect(gap1).toBeGreaterThan(0);
          expect(gap2).toBeCloseTo(gap1, 12);
          expect((centre2 - centre1) / gap1).toBeCloseTo(separationM / slitWidthM, 11);
          for (const [, start, end] of segments) expect(end).toBeGreaterThan(start);
        }
  });

  it('marks the blocked opening and removes the double-slit spacing bracket in single-slit mode', () => {
    for (const width of [360, 860])
      for (const view of ['spacing', 'wavelength', 'width'] as const)
        for (const slit of ['one', 'both'] as const) {
          const svg = render({ ...DOUBLE_SLIT_DEFAULT, slit }, view, width);
          expect(tagged(svg, 'data-slit', 'first')[0].attrs['data-open']).toBe('true');
          expect(tagged(svg, 'data-slit', 'second')[0].attrs['data-open']).toBe(
            slit === 'one' ? 'false' : 'true',
          );
          expect(tagged(svg, 'data-fringe-spacing')).toHaveLength(slit === 'one' ? 0 : 1);
        }
  });

  it('reconstructs the same detection prefix after forward and backward seeks on either layout', () => {
    const early = doubleSlitShot(6, 0.25),
      late = doubleSlitShot(6, 1);
    const samplesByWidth: number[][] = [];
    for (const width of [360, 860]) {
      const earlySvg = () =>
        render(early.parameters, 'detections', width, 0, 151, early.detections);
      const before = detector(earlySvg()).marks;
      const complete = detector(
        render(late.parameters, 'detections', width, 0, 168, late.detections),
      );
      expect(complete.marks.slice(0, before.length)).toEqual(before);
      expect(detector(earlySvg()).marks).toEqual(before);
      expect(tagged(render(late.parameters, 'detections', width), 'data-detection')).toHaveLength(
        0,
      );
      const frame = complete.frame;
      complete.marks.forEach((mark, index) => {
        expect(mark.index).toBe(index);
        expect(mark.physicalM).toBeGreaterThanOrEqual(-0.01);
        expect(mark.physicalM).toBeLessThanOrEqual(0.01);
        expect(mark.y - mark.radius).toBeGreaterThan(number(frame, 'y'));
        expect(mark.y + mark.radius).toBeLessThan(number(frame, 'y') + number(frame, 'height'));
      });
      samplesByWidth.push(complete.marks.map((mark) => mark.physicalM));
    }
    samplesByWidth[0].forEach((position, i) =>
      expect(position).toBeCloseTo(samplesByWidth[1][i], 14),
    );
  });

  it('distributes rendered detections according to screen intensity, including the envelope', () => {
    const final = doubleSlitShot(6, 1).parameters;
    for (const slit of ['one', 'both'] as const) {
      const parameters = { ...final, slit };
      const marks = detector(render(parameters, 'detections', 860, 0, 0, 1200)).marks;
      // A separate screen integral of the analytic aperture factor. This does
      // not reuse the production CDF, random generator, or inverse sampler.
      const intensity = (y: number) => {
        const sine = y / Math.hypot(parameters.distanceM, y);
        const beta = (Math.PI * parameters.slitWidthM * sine) / parameters.wavelengthM;
        const single = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2;
        const phase = (2 * Math.PI * parameters.separationM * sine) / parameters.wavelengthM;
        return single * (slit === 'one' ? 1 : 2 + 2 * Math.cos(phase));
      };
      const integrate = (end: number) => {
        const step = (end + 0.01) / 8192;
        let area = 0;
        for (let i = 0; i < 8192; i++) area += intensity(-0.01 + step * (i + 0.5)) * step;
        return area;
      };
      const total = integrate(0.01);
      for (const boundary of [-0.007, -0.004, -0.001, 0, 0.001, 0.004, 0.007]) {
        const observed = marks.filter((mark) => mark.physicalM <= boundary).length / marks.length;
        expect(Math.abs(observed - integrate(boundary) / total)).toBeLessThan(0.05);
      }
    }
  });
});

describe('double-slit film causal continuity', () => {
  it('changes one input per comparison and retains the final pattern for detections', () => {
    const controlled = ['separationM', 'wavelengthM', 'slitWidthM'] as const;
    for (let chapter = 3; chapter <= 6; chapter++) {
      const previous = doubleSlitShot(chapter - 1, 1).parameters;
      const start = doubleSlitShot(chapter, 0).parameters;
      for (const key of controlled) expect(start[key]).toBeCloseTo(previous[key], 15);
      for (let frame = 0; frame <= 40; frame++) {
        const current = doubleSlitShot(chapter, frame / 40).parameters;
        for (const key of controlled)
          if (chapter === 6 || key !== controlled[chapter - 3])
            expect(current[key]).toBe(start[key]);
        expect(current.slit).toBe('both');
        expect(current.distanceM).toBe(1);
        expect(current.coherence).toBe(1);
      }
    }
    const final = doubleSlitShot(6, 1).parameters;
    expect(final.separationM).toBeCloseTo(300e-6, 15);
    expect(final.wavelengthM).toBeCloseTo(650e-9, 15);
    expect(final.slitWidthM).toBeCloseTo(70e-6, 15);
  });

  it('holds the narrated bright/dark conditions and is deterministic under seeking and clamping', () => {
    const condition = (chapter: number, progress: number) => {
      const shot = doubleSlitShot(chapter, progress);
      return doubleSlitAt(shot.parameters, shot.probeM);
    };
    expect(condition(1, 0).phaseDifference).toBe(0);
    expect(condition(1, 0.5).intensity).toBeLessThan(1e-25);
    expect(condition(1, 0.75).phaseDifference).toBeCloseTo(2 * Math.PI, 12);
    expect(condition(2, 0).intensity).toBeGreaterThan(3);
    expect(condition(2, 0.5).intensity).toBeLessThan(1e-25);
    const saved = doubleSlitShot(6, 0.4);
    doubleSlitShot(6, 1);
    doubleSlitShot(0, 0);
    expect(doubleSlitShot(6, 0.4)).toEqual(saved);
    expect(doubleSlitShot(-2, -1)).toEqual(doubleSlitShot(0, 0));
    expect(doubleSlitShot(10, 3)).toEqual(doubleSlitShot(6, 1));
    for (const invalid of [NaN, Infinity, -Infinity]) {
      expect(() => doubleSlitShot(invalid, 0)).toThrow(RangeError);
      expect(() => doubleSlitShot(0, invalid)).toThrow(RangeError);
    }
  });
});
