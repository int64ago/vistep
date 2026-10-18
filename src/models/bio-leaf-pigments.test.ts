import { it, expect } from 'vitest';
import {
  chromatography,
  filterTracer,
  mobileFraction,
  partitionPopulation,
  partitionTracer,
  pigmentTransmission,
  spectralColor,
  pigmentDirector,
  originImmersion,
} from './bio-leaf-pigments';
it('derives the mobile fraction from the phase mass balance', () => {
  expect(mobileFraction(3, 2, 1)).toBeCloseTo(1 / 7);
  expect(mobileFraction(0)).toBe(1);
  for (const input of [
    [NaN, 1, 1],
    [-1, 1, 1],
    [1, 0, 1],
    [1, 1, Infinity],
  ])
    expect(() => mobileFraction(...(input as [number, number, number]))).toThrow(RangeError);
});
it('matches the independently expanded binomial after four transfers', () => {
  const p = partitionPopulation(0.25, 4);
  const expected = [81, 108, 54, 12, 1].map((v) => v / 256);
  expected.forEach((v, j) => expect(p.bins[j].mass).toBeCloseTo(v, 14));
  expect(p.mean).toBeCloseTo(1);
  expect(p.variance).toBeCloseTo(0.75);
});
it('conserves mass and analytic mean and variance including broad origins', () => {
  for (const f of [0, 0.26, 0.45, 0.68, 0.93, 1])
    for (const n of [0, 1, 3, 15, 40])
      for (const w of [0, 3, 7]) {
        const p = partitionPopulation(f, n, w);
        expect(p.mass).toBeCloseTo(1, 12);
        expect(p.mean).toBeCloseTo(n * f, 11);
        expect(p.variance).toBeCloseTo(n * f * (1 - f) + (w * (w + 2)) / 12, 10);
      }
});
it('fractional display transfers preserve the same population accounting', () => {
  for (let s = 0; s < 20; s += 0.13) {
    const p = partitionPopulation(0.45, s),
      m = Math.floor(s) + p.transfer;
    expect(p.mass).toBeCloseTo(1, 12);
    expect(p.mean).toBeCloseTo(m * 0.45, 11);
  }
});
it('keeps marker identities and positions continuous across every transfer', () => {
  for (const f of [0, 0.26, 0.93, 1])
    for (let n = 1; n < 40; n++) {
      const a = partitionTracer(7, f, n - 1e-7),
        b = partitionTracer(7, f, n),
        c = partitionTracer(7, f, n + 1e-7);
      expect(a.id).toBe(b.id);
      expect(a.position).toBeCloseTo(b.position, 6);
      expect(c.position).toBeCloseTo(b.position, 6);
      expect(a.phaseBlend).toBeCloseTo(b.phaseBlend, 6);
    }
});
it('selected marker population samples the same law as the exact distribution', () => {
  for (const f of [0.26, 0.45, 0.93]) {
    const values = Array.from({ length: 12000 }, (_, id) => partitionTracer(id, f, 8).position),
      mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(Math.abs(mean - 8 * f)).toBeLessThan(0.04);
  }
});
it('makes genuinely equal partition parameters coelute while conserving pigment', () => {
  const s = chromatography(1, false, 1, true),
    a = s.bands[2],
    b = s.bands[3];
  expect(a.distribution.bins).toEqual(b.distribution.bins);
  const normal = chromatography(1);
  expect(normal.bands[2].distance).toBeGreaterThan(normal.bands[3].distance);
  for (const p of [0, 0.2, 0.6, 1])
    for (const band of chromatography(p, true).bands)
      expect(band.paperMass + band.reservoirMass).toBeCloseTo(band.amount, 14);
  expect(chromatography(1, true).dissolved).toBeGreaterThan(0.99);
});
it('broader initial zones broaden distributions without creating components', () => {
  const narrow = chromatography(0.5, false, 1),
    wide = chromatography(0.5, false, 8);
  expect(wide.bands.map((b) => b.id)).toEqual(narrow.bands.map((b) => b.id));
  wide.bands.forEach((b, j) => {
    expect(b.distribution.variance).toBeGreaterThan(narrow.bands[j].distribution.variance);
    expect(b.distance).toBeCloseTo(narrow.bands[j].distance);
  });
});
it('retains independently verified measured spectrum and nonlinear transmission', () => {
  const green = pigmentTransmission('a', 550, 5);
  expect(green.epsilon).toBeCloseTo(2770, 6);
  expect(green.transmitted).toBeCloseTo(0.9686123453, 9);
  for (const key of ['a', 'b', 'carotene'] as const)
    for (let nm = 400; nm <= 700; nm += 5) {
      const p = pigmentTransmission(key, nm, 5);
      expect(p.transmitted + p.absorbed).toBeCloseTo(1, 14);
      expect(pigmentTransmission(key, nm, 10).transmitted).toBeCloseTo(p.transmitted ** 2, 13);
      expect(pigmentTransmission(key, nm, 0).transmitted).toBe(1);
    }
  expect(pigmentTransmission('a', 430).absorbed).toBeGreaterThan(green.absorbed);
  expect(pigmentTransmission('a', 660).absorbed).toBeGreaterThan(green.absorbed);
});
it('keeps finite deterministic edge states and correct spectral endpoints', () => {
  for (const invalid of [NaN, Infinity, -Infinity]) {
    expect(chromatography(invalid).front).toBe(8);
    expect(Number.isFinite(pigmentTransmission('a', invalid).transmitted)).toBe(true);
    expect(spectralColor(invalid)).toBe(spectralColor(550));
    expect(pigmentDirector(0, invalid).progress).toBe(0);
  }
  expect(spectralColor(700)).toBe('rgb(138,63,65)');
  expect(pigmentTransmission('a', 550, -1).transmitted).toBe(1);
});

it('keeps filtered marker identities inside the drawn funnel stem and receiving liquid', () => {
  for (let id = 0; id < 8; id++)
    for (let j = 0; j <= 300; j++) {
      const p = filterTracer(id, j / 300);
      expect(p.id).toBe(id);
      if (p.y >= 156 && p.y <= 204) expect(p.x).toBe(150);
      if (p.y >= 204) {
        expect(p.x).toBeGreaterThan(91);
        expect(p.x).toBeLessThan(209);
      }
    }
  for (let id = 0; id < 8; id++) {
    expect(filterTracer(id, 1).progress).toBe(1);
    expect(filterTracer(id, 0).progress).toBe(0);
  }
});

it('only loses origin material after the independently raised reservoir reaches it', () => {
  for (const p of [0, 0.1, 0.2, 0.3]) {
    const s = originImmersion(p);
    expect(s.reservoir).toBe(0);
    expect(s.paper).toBe(1);
  }
  expect(originImmersion(0).liquidY).toBe(240);
  expect(originImmersion(0.3).liquidY).toBe(209);
  for (let i = 0; i <= 100; i++) {
    const s = originImmersion(i / 100);
    expect(s.paper + s.reservoir).toBeCloseTo(1, 14);
    if (s.reservoir > 0) expect(s.liquidY).toBeLessThan(225);
  }
});

it('aligns extraction and independent fresh-sample reset to the measured narration', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(pigmentDirector(0, 7, locale)).toMatchObject({ shot: 'release', progress: 0 });
    expect(pigmentDirector(0, 16, locale).shot).toBe('filter');
    expect(pigmentDirector(0, 19, locale).progress).toBe(1);
    expect(pigmentDirector(1, 8, locale).shot).toBe('origin');
    const raised = pigmentDirector(1, 12, locale);
    expect(raised.shot).toBe('immersed');
    expect(originImmersion(raised.progress).reservoir).toBeGreaterThan(0);
    expect(pigmentDirector(1, 16.5, locale)).toMatchObject({ shot: 'restore', progress: 0 });
    expect(pigmentDirector(1, 20, locale).shot).toBe('width');
  }
});
it('holds the same exchange markers until each language returns to the whole paper', () => {
  expect(pigmentDirector(2, 27, 'zh').shot).toBe('exchange');
  expect(pigmentDirector(2, 27, 'en').shot).toBe('resolved');
  expect(pigmentDirector(2, 33, 'zh').shot).toBe('resolved');
  expect(pigmentDirector(2, 33, 'en').shot).toBe('coelute');
  for (const locale of ['zh', 'en'] as const) {
    expect(pigmentDirector(2, 7, locale).progress).toBe(0);
    let previous = 0;
    for (let t = 7.6; t < 26; t += 0.1) {
      const d = pigmentDirector(2, t, locale);
      expect(d.shot).toBe('exchange');
      expect(d.progress).toBeGreaterThanOrEqual(previous);
      previous = d.progress;
    }
  }
});
it('shows both blue and red at their comparison and withholds the numeric doubling answer', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(pigmentDirector(3, 3, locale).shot).toBe('blank');
    expect(pigmentDirector(3, 5, locale)).toMatchObject({ shot: 'selected', nm: 430 });
    expect(pigmentDirector(3, locale === 'zh' ? 14.3 : 16.5, locale).shot).toBe('remaining');
    expect(pigmentDirector(4, 12, locale)).toMatchObject({ shot: 'double', progress: 0 });
    expect(pigmentDirector(4, 22, locale)).toMatchObject({ shot: 'double', progress: 1 });
    expect(pigmentDirector(4, 26, locale)).toMatchObject({ shot: 'reveal', progress: 1 });
  }
  expect(pigmentDirector(4, 25, 'zh').shot).toBe('reveal');
  expect(pigmentDirector(4, 25, 'en').shot).toBe('double');
});
