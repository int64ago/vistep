import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AtomicBombInstrument, chainTreeLayout } from '../experiments/AtomicBomb';
import {
  NUCLIDES,
  bindingPerNucleon,
  chainAt,
  criticalRadius,
  multiplication,
} from '../../models/atomic-bomb';
import {
  ATOMIC_BOMB_FILM,
  ATOMIC_BOMB_VIEWS,
  atomicBombChains,
  atomicBombShot,
  chainFor,
  chainHorizon,
  type AtomicBombShot,
} from '../../models/atomic-bomb-film';

type Node = { tag: string; attrs: Record<string, string>; children: Node[]; text: string };
function parse(markup: string) {
  const root: Node = { tag: 'root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const re = /<(\/?)([A-Za-z][\w:-]*)\b([^>]*)>|([^<]+)/g;
  for (const match of markup.matchAll(re)) {
    if (match[4] !== undefined) {
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
const all = (node: Node): Node[] => [node, ...node.children.flatMap(all)];
const num = (node: Node, key: string) => {
  const value = Number(node.attrs[key]);
  expect(Number.isFinite(value)).toBe(true);
  return value;
};
const part = (root: Node, name: string) =>
  all(root).find((n) => n.attrs['data-part'] === name || n.attrs['data-nuclide'] === name);
const textOf = (node: Node): string => node.text + node.children.map(textOf).join('');
const render = (shot: AtomicBombShot, width = 860) =>
  parse(
    renderToStaticMarkup(
      createElement(AtomicBombInstrument, { shot, chain: chainFor(shot.chain), width }),
    ),
  );
const base = (): AtomicBombShot => atomicBombShot(1, 1);

describe('fission instrument markup', () => {
  it('tracks the incoming neutron, the excited drop and the two labelled fragments', () => {
    const before = render({ ...base(), view: 'capture', approach: 0.4, deformation: 0, flight: 0 });
    expect(part(before, 'incoming-neutron')).toBeTruthy();
    expect(part(before, 'drop')).toBeTruthy();
    expect(textOf(before)).toContain('U-235');
    const excited = render({
      ...base(),
      view: 'capture',
      approach: 1,
      deformation: 0.5,
      flight: 0,
    });
    expect(part(excited, 'incoming-neutron')).toBeUndefined();
    expect(textOf(excited)).toContain('U-236*');
    const split = render({ ...base(), view: 'capture', approach: 1, deformation: 1, flight: 0.8 });
    const fragments = part(split, 'fragments')!;
    expect(fragments).toBeTruthy();
    const circles = fragments.children.filter((n) => n.tag === 'circle');
    expect(circles).toHaveLength(2);
    expect(num(circles[0], 'r') / num(circles[1], 'r')).toBeCloseTo(Math.cbrt(141 / 92), 6);
    expect(all(split).filter((n) => n.attrs['data-part'] === 'prompt-neutron')).toHaveLength(3);
    expect(textOf(split)).toContain('Ba-141');
    expect(textOf(split)).toContain('Kr-92');
    expect(textOf(split)).toContain('173 MeV');
  });

  it('places binding markers by measured energy and brackets the fragment gain', () => {
    const svg = render({ ...base(), view: 'binding' });
    const cy = (name: string) => num(part(svg, name)!.children[0], 'cy');
    expect(cy('Fe-56')).toBeLessThan(cy('Kr-92'));
    expect(cy('Kr-92')).toBeLessThan(cy('Ba-141'));
    expect(cy('Ba-141')).toBeLessThan(cy('U-235'));
    // Pixel spacing must be proportional to measured MeV differences.
    const perPixel =
      (cy('U-235') - cy('Fe-56')) /
      (bindingPerNucleon(NUCLIDES.fe56) - bindingPerNucleon(NUCLIDES.u235));
    expect((cy('U-235') - cy('Kr-92')) / perPixel).toBeCloseTo(
      bindingPerNucleon(NUCLIDES.kr92) - bindingPerNucleon(NUCLIDES.u235),
      6,
    );
    const bracket = part(svg, 'difference')!.children.find(
      (n) => n.tag === 'path' && n.attrs['stroke-width'] === '3',
    )!;
    const [, , y1, y2] = bracket.attrs.d
      .match(/M([\d.]+),([\d.]+)V([\d.]+)/)!
      .map(Number)
      .slice(0);
    expect(Math.abs(y1 - cy('U-235'))).toBeLessThan(1e-6);
    expect(y2).toBeGreaterThan(cy('Kr-92'));
    expect(y2).toBeLessThan(cy('Ba-141'));
    expect(part(svg, 'binding-curve')!.attrs['stroke-dashoffset']).toBe('0');
    expect(textOf(svg)).toContain('4.1 eV');
  });

  it('draws the ideal family tree with every shown neutron joined to its parent', () => {
    const chain = atomicBombChains().ideal;
    for (const vertical of [false, true]) {
      const layout = chainTreeLayout(chain, 5, 480, 300, vertical);
      expect(layout.nodes).toHaveLength(chain.generations.slice(0, 5).reduce((s, c) => s + c, 0));
      expect(layout.edges).toHaveLength(layout.nodes.length - 1);
      for (const edge of layout.edges) {
        expect(edge.to.generation).toBe(edge.from.generation + 1);
        expect(vertical ? edge.to.y : edge.to.x).toBeGreaterThan(
          vertical ? edge.from.y : edge.from.x,
        );
      }
      for (const n of layout.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x).toBeLessThanOrEqual(480);
        expect(n.y).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeLessThanOrEqual(300);
      }
    }
    const svg = render({ ...base(), view: 'chain', generations: 4, growth: 0.5 });
    const tree = part(svg, 'tree')!;
    expect(tree.children.filter((n) => n.tag === 'circle')).toHaveLength(
      chain.generations.slice(0, 4).reduce((s, c) => s + c, 0),
    );
    expect(part(svg, 'growth-curve')!.attrs.d.startsWith('M')).toBe(true);
  });

  it('reads the multiplication gauge and walk counters from the same models', () => {
    for (const [chapter, progress] of [
      [3, 0.9],
      [4, 0.95],
      [6, 0.99],
    ] as const) {
      const shot = atomicBombShot(chapter, progress),
        chain = chainFor(shot.chain)!,
        svg = render(shot);
      const k = multiplication(shot.radius);
      expect(textOf(part(svg, 'k-value')!)).toContain(`k ≈ ${k.toFixed(2)}`);
      const state = chainAt(chain, shot.walkTime);
      const counter = textOf(part(svg, 'walk-counter')!);
      expect(counter).toContain(`${state.generation}`);
      expect(counter).toContain(`${state.fissions}`);
      expect(textOf(svg)).toContain(`R꜀ ≈ ${criticalRadius().toFixed(1)}`);
    }
    const small = render(atomicBombShot(3, 0.9)),
      large = render(atomicBombShot(4, 0.95));
    expect(num(part(small, 'k-marker')!, 'cx')).toBeLessThan(num(part(large, 'k-marker')!, 'cx'));
    expect(num(part(small, 'k-marker')!, 'cy')).toBeGreaterThan(
      num(part(large, 'k-marker')!, 'cy'),
    );
    const canvas = all(large).find((n) => n.tag === 'canvas')!;
    expect(canvas.attrs.role).toBe('img');
    expect(canvas.attrs['aria-label']).toBeTruthy();
  });

  it('shows all three growth regimes with the explosive curve climbing first', () => {
    const svg = render({ ...base(), view: 'compare', compare: 1 });
    const regimes = ['reactor-prompt', 'reactor-delayed', 'explosive'].map((id) =>
      all(svg).find((n) => n.attrs['data-regime'] === id)!,
    );
    for (const r of regimes) expect(r.attrs.d.startsWith('M')).toBe(true);
    const lastX = (n: Node) => Number(n.attrs.d.split('L').at(-1)!.split(',')[0]);
    // The explosive curve stops at the 10^20 cap long before the reactor curves do.
    expect(lastX(regimes[2])).toBeLessThan(lastX(regimes[1]));
    expect(lastX(regimes[2])).toBeLessThan(lastX(regimes[0]));
  });

  it('never sets an inline SVG font size below the 16 px body text', () => {
    for (const chapter of [0, 1, 2, 3, 4, 5, 6])
      for (const width of [320, 860]) {
        const svg = render(atomicBombShot(chapter, 0.9), width);
        for (const node of all(svg)) {
          expect(node.attrs['font-size']).toBeUndefined();
          if (node.tag === 'text') {
            expect(num(node, 'x')).toBeGreaterThanOrEqual(0);
            expect(num(node, 'x')).toBeLessThanOrEqual(width);
          }
        }
      }
  });
});

describe('fission film direction', () => {
  it('keeps every sampled chapter state finite, in bounds and on the announced view', () => {
    const rc = criticalRadius();
    for (let chapter = 0; chapter < 7; chapter++)
      for (let i = 0; i <= 1000; i++) {
        const shot = atomicBombShot(chapter, i / 1000);
        expect(shot.view).toBe(ATOMIC_BOMB_VIEWS[chapter]);
        for (const value of Object.values(shot))
          if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
        expect(shot.radius).toBeGreaterThan(0);
        expect(shot.walkTime).toBeGreaterThanOrEqual(0);
        expect(shot.scale).toBeGreaterThanOrEqual(1);
        if (shot.chain) {
          const chain = chainFor(shot.chain)!;
          expect(shot.walkTime).toBeLessThanOrEqual(chainHorizon(chain, 1) + 1e-9);
          if (shot.chain !== 'large')
            expect(Math.abs(chain.radius - shot.radius)).toBeLessThan(1e-9);
        }
        if (chapter === 3) expect(multiplication(shot.radius)).toBeLessThan(1);
        if (chapter === 4 && i === 1000) expect(shot.radius).toBeGreaterThan(rc);
        if (chapter === 6 && i === 1000) expect(multiplication(shot.radius)).toBeLessThan(1);
      }
    expect(atomicBombShot(4, 0).radius).toBeCloseTo(ATOMIC_BOMB_FILM.smallRadius, 9);
    expect(atomicBombShot(4, 1).radius).toBeCloseTo(ATOMIC_BOMB_FILM.largeRadius, 9);
    expect(() => atomicBombShot(NaN, 0)).toThrow(RangeError);
  });
  it('prepares walks whose outcomes match the chapter claims', () => {
    const chains = atomicBombChains();
    expect(chains.small.truncated).toBe(false);
    expect(chains.small.generations.length).toBeLessThanOrEqual(4);
    expect(chains.large.generations.length).toBeGreaterThanOrEqual(8);
    expect(chains.large.neutrons.length).toBeGreaterThanOrEqual(300);
    expect(chains.ideal.leaked).toBe(0);
    expect(chains.expanded.truncated).toBe(false);
    expect(chains.expanded.generations.length).toBeLessThanOrEqual(4);
    expect(multiplication(chains.expanded.radius)).toBeLessThan(1);
  });
});
