import { createElement, type ComponentType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CelestialObservations from './CelestialObservations';
import GravityMeasurements, { GravityArtwork } from './GravityMeasurements';
import RelativityExperiments, { RelativityArtwork } from './RelativityExperiments';
import GravitationalWaveLab, { GravitationalArtwork } from './GravitationalWaveLab';
import CosmologyObservations, { CosmologyArtwork } from './CosmologyObservations';
import { cosmologyDirector } from '../../models/cosmology-observations';
import ImpulseContactLab from './ImpulseContactLab';

const film = vi.hoisted(() => ({
  watch: true,
  chapter: 0,
  chapterProgress: 0.63,
  chapterTime: 24,
  variant: '',
}));
vi.mock('../lab/FilmContext', () => ({ useShowcase: () => film }));
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
vi.mock('../lab/Controls', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lab/Controls')>()),
  Range: (props: { label: string; value: number; onChange: (value: number) => void }) =>
    createElement('input', { ...props, 'aria-label': props.label }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounted: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const view of mounted.splice(0)) await act(() => view.unmount());
});

const cases: {
  Scene: ComponentType;
  variant: string;
  chapter: number;
  input?: string;
  select?: string;
  value?: number;
  button?: string;
  buttons?: string[];
}[] = [
  {
    Scene: CelestialObservations,
    variant: 'required-2-neptune',
    chapter: 4,
    button: '0',
  },
  {
    Scene: GravityMeasurements,
    variant: 'required-2-cavendish',
    chapter: 2,
    input: 'Model attractor mass / kg',
    value: 79,
  },
  {
    Scene: RelativityExperiments,
    variant: 'required-2-muons',
    chapter: 4,
    input: 'Muon speed / c',
    value: 0.9,
  },
  {
    Scene: RelativityExperiments,
    variant: 'required-2-atomic-clocks',
    chapter: 6,
    input: 'Flight altitude / m',
    value: 0,
  },
  {
    Scene: GravitationalWaveLab,
    variant: 'required-1-weber-bar',
    chapter: 1,
    buttons: ['Two-detector comparison', 'Backgrounds'],
  },
  {
    Scene: CosmologyObservations,
    variant: 'required-2-hubble',
    chapter: 1,
    select: 'prediction',
    input: 'Separate model H / (km/s)/Mpc',
    value: 90,
  },
  {
    Scene: ImpulseContactLab,
    variant: 'e1-balloon-inertia',
    chapter: 0,
    input: 'Speed before contact / m/s',
    value: 4,
  },
];
describe('authored astronomy and impulse films remain deterministic after exploration', () => {
  for (const c of cases)
    it(`${c.Scene.name} restores ${c.variant}`, async () => {
      Object.assign(film, {
        watch: true,
        chapter: c.chapter,
        chapterProgress: 0.63,
        variant: c.variant,
      });
      let view!: ReactTestRenderer;
      await act(() => {
        view = create(createElement(c.Scene));
      });
      mounted.push(view);
      const authored = view.toJSON();
      film.watch = false;
      await act(() => view.update(createElement(c.Scene)));
      if (c.select) {
        await act(() =>
          view.root.findByType('select').props.onChange({ target: { value: c.select } }),
        );
      }
      if (c.input) {
        const control = view.root
          .findAllByType('input')
          .find((n) => n.props['aria-label'] === c.input)!;
        expect(control, `Missing actual exploration control: ${c.input}`).toBeDefined();
        await act(() => control.props.onChange(c.value));
        if (c.Scene === CosmologyObservations) {
          const artwork = view.root.findByType(CosmologyArtwork);
          expect(artwork.props.direction.shot).toBe('prediction');
          expect(artwork.props.H0).toBe(90);
          const labels = view.root.findAllByType('text').map((n) => n.children.join(''));
          expect(labels).toContain('50 Mpc → 4500 km/s');
        }
      } else {
        for (const label of c.buttons ?? [c.button!]) {
          const control = view.root
            .findAllByType('button')
            .find((n) => n.children.join('') === label)!;
          expect(control, `Missing actual exploration control: ${label}`).toBeDefined();
          await act(() => control.props.onClick());
        }
      }
      film.watch = true;
      await act(() => view.update(createElement(c.Scene)));
      expect(view.toJSON()).toEqual(authored);
      if (c.Scene === CosmologyObservations) {
        expect(view.root.findByType(CosmologyArtwork).props.H0).toBe(70);
        film.watch = false;
        await act(() => view.update(createElement(c.Scene)));
        expect(view.root.findByType('select').props.value).toBe('prediction');
        expect(view.root.findByType(CosmologyArtwork).props.H0).toBe(90);
      }
    });
});

describe('actual apparatus geometry preserves the model', () => {
  it('returns both optical routes from their actual end mirrors to the same detector', () => {
    const geometry = (motionNm: number, commonMotion: boolean) => {
      const svg = renderToStaticMarkup(
        createElement(GravitationalArtwork, {
          mode: 2,
          manualShot: 'paths',
          motionNm,
          commonMotion,
        }),
      );
      const element = (attribute: string, value: string) =>
        [...svg.matchAll(/<(?:path|rect)\b[^>]*>/g)]
          .map((m) => m[0])
          .find((tag) => tag.includes(`${attribute}="${value}"`))!;
      const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]+)"`).exec(tag)![1]!;
      const numbers = (tag: string) =>
        attr(tag, 'd')
          .match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)!
          .map(Number);
      const points = (route: string) => {
        const n = numbers(element('data-optical-route', route));
        return Array.from({ length: n.length / 2 }, (_, i) => [n[i * 2]!, n[i * 2 + 1]!] as const);
      };
      const x = points('x'),
        y = points('y');
      expect(x).toHaveLength(5);
      expect(y).toHaveLength(5);
      expect(x[0]).toEqual(y[0]);
      expect(x[1]).toEqual(y[1]);
      expect(x[3]).toEqual(x[1]);
      expect(y[3]).toEqual(y[1]);
      expect(x[4]).toEqual(y[4]);
      const mx = numbers(element('data-optical-part', 'end-mirror-x'));
      const my = numbers(element('data-optical-part', 'end-mirror-y'));
      expect(mx[0]).toBeCloseTo(x[2]![0]);
      expect((mx[1]! + mx[2]!) / 2).toBeCloseTo(x[2]![1]);
      expect(my[1]).toBeCloseTo(y[2]![1]);
      expect((my[0]! + my[2]!) / 2).toBeCloseTo(y[2]![0]);
      const detector = element('data-optical-part', 'detector');
      expect(Number(attr(detector, 'x')) + Number(attr(detector, 'width')) / 2).toBeCloseTo(
        x[4]![0],
      );
      expect(x[4]![1]).toBeGreaterThanOrEqual(Number(attr(detector, 'y')));
      expect(x[4]![1]).toBeLessThanOrEqual(
        Number(attr(detector, 'y')) + Number(attr(detector, 'height')),
      );
      return [x[2]![0] - x[1]![0], y[1]![1] - y[2]![1]] as const;
    };
    const baseline = geometry(0, false);
    for (const common of [false, true])
      for (const motion of [-66.5, 66.5]) {
        const lengths = geometry(motion, common);
        const dx = lengths[0] - baseline[0],
          dy = lengths[1] - baseline[1];
        expect(Math.sign(dx)).toBe(Math.sign(motion));
        expect(dy).toBeCloseTo(common ? dx : -dx);
      }
  });
  it('draws ground and flying-clock speeds in one geocentric frame, including westbound subtraction', () => {
    for (const direction of [-1, 1])
      for (const value of [0, 0.25, 0.6]) {
        const svg = renderToStaticMarkup(
          createElement(RelativityArtwork, { mode: 3, direction, value }),
        );
        const vectors = [
          ...svg.matchAll(/data-vector-dx="([\d.e+-]+)" data-vector-dy="([\d.e+-]+)"/g),
        ].map((m) => [Number(m[1]), Number(m[2])]);
        expect(vectors).toHaveLength(3);
        const [ground, air, relative] = vectors;
        // The westbound aircraft still moves east in this frame, just more slowly than Earth.
        expect(ground[0]).toBeGreaterThan(0);
        expect(air[0]).toBeGreaterThan(0);
        expect(relative[0] / ground[0]).toBeCloseTo((direction * 250) / 465.1, 12);
        expect(ground[0] + relative[0]).toBeCloseTo(air[0], 12);
        expect(vectors.every((v) => v[1] === 0)).toBe(true);
        const endpoints = (kind: string) => {
          const path = new RegExp(
            `data-clock-vector="${kind}"[^>]*><path d="M([\\d.e+-]+) ([\\d.e+-]+)L([\\d.e+-]+) ([\\d.e+-]+)"`,
          ).exec(svg)!;
          expect(path).not.toBeNull();
          return path.slice(1).map(Number);
        };
        const g = endpoints('ground'),
          a = endpoints('flying'),
          r = endpoints('relative-air-speed');
        expect(a[0]).toBe(g[0]);
        expect(r[0]).toBeCloseTo(g[2], 12);
        expect(a[2]).toBeCloseTo(r[2], 12);
      }
  });
  it('aims the physical horn and its connected receiver at the same elevation used by the atmospheric model', () => {
    const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]+)"`).exec(tag)![1]!;
    for (const width of [268, 640])
      for (const elevation of [30, 60, 90])
        for (const reference of [false, true]) {
          const direction = { ...cosmologyDirector(2, 0), elevation, reference };
          const svg = renderToStaticMarkup(createElement(CosmologyArtwork, { width, direction }));
          const element = (attribute: string, value = 'true') => {
            const tag = [...svg.matchAll(/<(?:path|rect|circle)\b[^>]*>/g)]
              .map((m) => m[0])
              .find((t) => t.includes(`${attribute}="${value}"`));
            expect(tag, `${attribute}=${value}`).toBeDefined();
            return tag!;
          };
          const points = (tag: string) => {
            const values = attr(tag, 'd')
              .match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)!
              .map(Number);
            return Array.from(
              { length: values.length / 2 },
              (_, i) => [values[2 * i]!, values[2 * i + 1]!] as const,
            );
          };
          const axis = points(element('data-horn-axis'));
          expect(axis).toHaveLength(4);
          const [incoming, mouth, throat, port] = axis;
          const dx = mouth![0] - port![0],
            dy = mouth![1] - port![1];
          expect((Math.atan2(-dy, -dx) * 180) / Math.PI).toBeCloseTo(elevation, 10);
          // The incoming ray, mouth, throat and output share one straight axis.
          for (const point of [incoming!, throat!])
            expect((point[0] - port![0]) * dy - (point[1] - port![1]) * dx).toBeCloseTo(0, 9);
          const outline = points(element('data-horn-outline'));
          expect(outline).toHaveLength(6);
          expect((outline[0]![0] + outline[5]![0]) / 2).toBeCloseTo(mouth![0], 10);
          expect((outline[0]![1] + outline[5]![1]) / 2).toBeCloseTo(mouth![1], 10);
          expect((outline[2]![0] + outline[3]![0]) / 2).toBeCloseTo(port![0], 10);
          expect((outline[2]![1] + outline[3]![1]) / 2).toBeCloseTo(port![1], 10);
          const output = element('data-horn-output'),
            selector = element('data-horn-selector');
          expect([Number(attr(output, 'cx')), Number(attr(output, 'cy'))]).toEqual(port);
          const sky = points(element('data-horn-route', 'sky'));
          const ref = points(element('data-horn-route', 'reference'));
          const active = points(element('data-horn-route', 'active'));
          expect(sky[0]).toEqual(port);
          const selected = [Number(attr(selector, 'cx')), Number(attr(selector, 'cy'))];
          expect(sky.slice(-2)[0]).toEqual(selected);
          expect(ref.slice(-2)[0]).toEqual(selected);
          expect(active).toEqual(reference ? ref : sky);
          const receiver = element('data-horn-receiver');
          const receiverCentre = [
            Number(attr(receiver, 'x')) + Number(attr(receiver, 'width')) / 2,
            Number(attr(receiver, 'y')) + Number(attr(receiver, 'height')) / 2,
          ];
          expect(sky.at(-1)).toEqual(receiverCentre);
          expect(ref.at(-1)).toEqual(receiverCentre);
          const atmosphere = renderToStaticMarkup(
            createElement(CosmologyArtwork, {
              width,
              direction: { ...direction, shot: 'airmass' },
            }),
          ).replace(/<[^>]*>/g, '');
          const contribution = 2.3 / Math.sin((elevation * Math.PI) / 180);
          expect(atmosphere).toContain(`${elevation}°`);
          expect(atmosphere).toContain(`Atmosphere: ${contribution.toFixed(1)} K`);
          expect(atmosphere).toContain(`Total antenna: ${(3.5 + 0.9 + contribution).toFixed(1)} K`);
        }
  });
  it('uses one mirror angle for the real reflected ray and enlarged ruler', () => {
    for (const mass of [79, 158, 200])
      for (const side of [-1, 1])
        for (const value of [0, 0.05, 0.125, 0.25, 0.5, 1]) {
          const svg = renderToStaticMarkup(
            createElement(GravityArtwork, { mode: 1, mass, side, value }),
          );
          const theta = Number(/data-optical-theta="([^"]+)"/.exec(svg)![1]);
          const distance = Number(/data-optical-distance="([^"]+)"/.exec(svg)![1]);
          const displacement = Number(/data-optical-screen-m="([^"]+)"/.exec(svg)![1]);
          expect(displacement / distance).toBeCloseTo(Math.tan(2 * theta), 12);
          const ray =
            /data-optical-part="reflected" d="M([\d.e+-]+) ([\d.e+-]+)L([\d.e+-]+) ([\d.e+-]+)"/.exec(
              svg,
            )!;
          expect(ray).not.toBeNull();
          const [x0, y0, x1, y1] = ray.slice(1).map(Number);
          expect((y0 - y1) / (x1 - x0)).toBeCloseTo(Math.tan(2 * theta), 12);
          const pointer =
            /data-optical-part="ruler-spot" data-scale="([^"]+)" d="M([\d.e+-]+) ([\d.e+-]+)v15"/.exec(
              svg,
            )!;
          const ruler = /data-optical-part="ruler" d="M28 [\d.e+-]+H([\d.e+-]+)"/.exec(svg)!;
          const centre = (28 + Number(ruler[1])) / 2;
          expect(Number(pointer[2]) - centre).toBeCloseTo(displacement * Number(pointer[1]), 9);
          expect(Number(pointer[2])).toBeGreaterThanOrEqual(28);
          expect(Number(pointer[2])).toBeLessThanOrEqual(Number(ruler[1]));
        }
  });
  it('shows a larger Neptune perturbation on a fixed axis without moving observation points', async () => {
    Object.assign(film, {
      watch: false,
      chapter: 4,
      chapterTime: 24,
      variant: 'required-2-neptune',
    });
    let view!: ReactTestRenderer;
    await act(() => {
      view = create(createElement(CelestialObservations));
    });
    mounted.push(view);
    const snapshot = () => {
      const svg = view.root.findByProps({
        'aria-label': 'Fixed synthetic residuals and an extra-gravity candidate',
      });
      const d = svg.findByProps({ className: 'celestial-evidence-model-line' }).props.d as string;
      const y0 = Number(/^M[\d.e+-]+ ([\d.e+-]+)/.exec(d)![1]);
      const end = Number(/L[\d.e+-]+ ([\d.e+-]+)$/.exec(d)![1]);
      return {
        displacement: Math.abs(end - y0),
        records: svg
          .findAll((n) => n.props['data-record-id'])
          .map((n) => [n.props['data-record-id'], n.props.cx, n.props.cy]),
      };
    };
    const zero = snapshot();
    const atMass = async (mass: string) => {
      const button = view.root.findAllByType('button').find((n) => n.children.join('') === mass)!;
      await act(() => button.props.onClick());
      return snapshot();
    };
    const half = await atMass('0.5'),
      full = await atMass('1');
    expect(full.displacement / half.displacement).toBeGreaterThan(1.9);
    expect(full.displacement / half.displacement).toBeLessThan(2.1);
    expect(zero.displacement).toBeLessThan(0.1);
    expect(half.records).toEqual(zero.records);
    expect(full.records).toEqual(zero.records);
  });
});
