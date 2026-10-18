import { createElement, type ComponentType } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CelestialObservations from './CelestialObservations';
import GravityMeasurements, { GravityArtwork } from './GravityMeasurements';
import RelativityExperiments, { RelativityArtwork } from './RelativityExperiments';
import GravitationalWaveLab, { GravitationalArtwork } from './GravitationalWaveLab';
import CosmologyObservations, { CosmologyArtwork } from './CosmologyObservations';
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
    input: 'Example H₀ / (km/s)/Mpc',
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
      if (c.input) {
        const control = view.root
          .findAllByType('input')
          .find((n) => n.props['aria-label'] === c.input)!;
        await act(() => control.props.onChange(c.value));
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
  it('points the flying-clock aircraft along its actual east or west trajectory', () => {
    for (const direction of [-1, 1])
      for (const value of [0, 0.25, 0.6]) {
        const svg = renderToStaticMarkup(
          createElement(RelativityArtwork, { mode: 3, direction, value }),
        );
        const transform = /translate\(([\d.e+-]+) ([\d.e+-]+)\) rotate\(([\d.e+-]+)\)/.exec(svg)!;
        const a = direction * value * 2 * Math.PI;
        const rotation = (Number(transform[3]) * Math.PI) / 180;
        // The SVG nose points locally upward. Rotate that vector, then compare with dr/dt.
        const nose = { x: Math.sin(rotation), y: -Math.cos(rotation) };
        const velocity = { x: -direction * Math.sin(a), y: -direction * Math.cos(a) };
        expect(nose.x * velocity.x + nose.y * velocity.y).toBeCloseTo(1, 10);
      }
  });
  it('aims the horn at the same 30–90 degree elevation used by its atmospheric model', () => {
    for (const value of [0, 0.5, 1]) {
      const svg = renderToStaticMarkup(
        createElement(CosmologyArtwork, { mode: 1, phase: 0, value }),
      );
      expect(svg).toContain(`rotate(${30 + 60 * value} 142 120)`);
      expect(svg).toContain('M49 66L186 100V140L49 174Z');
      expect(svg).toContain('TΣ');
    }
    const calibration = renderToStaticMarkup(
      createElement(CosmologyArtwork, { mode: 1, phase: 1, value: 1 }),
    );
    expect(calibration).toContain('rotate(60 142 120)');
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
