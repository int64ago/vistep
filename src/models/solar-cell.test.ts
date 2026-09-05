import { describe, expect, it } from 'vitest';
import {
  solarCellDefaults as defaults,
  solarCellReference as ref,
  solarCellParameters as parameters,
  solarCellAtVoltage as atVoltage,
  solarCellAtJunction as atJunction,
  solarCellOpenVoltage as openVoltage,
  solarCellOperating as operating,
  solarCellMaximum as maximum,
  solarCellCurve as curve,
  solarCellBudget as budget,
  solarCellOptical as optical,
  solarCellPhotonEnergy as photonEnergy,
  solarCellThreshold as threshold,
  solarCellEpisode as episode,
  solarCellGeometry as geometry,
  solarCellAlong as along,
  solarCellShot as shot,
  type SolarCellConfig,
} from './solar-cell';

describe('solar-cell: independent electrical and accounting checks', () => {
  it('matches six published pvlib Lambert-W reference cases after 96-cell scaling', () => {
    // Official plot_singlediode example: G,T,Isc,Voc,Imp,Vmp,Pmp. Rounded source data.
    const cases = [
      [1000, 55, 5.235561, 52.129783, 4.742475, 39.614016, 187.868473],
      [800, 55, 4.190781, 51.483033, 3.805721, 39.867811, 151.725757],
      [600, 55, 3.144837, 50.649228, 2.861983, 39.956701, 114.35538],
      [400, 25, 2.043319, 56.987478, 1.886789, 47.278408, 89.204377],
      [400, 40, 2.070523, 53.238567, 1.901044, 43.490203, 82.676791],
      [400, 55, 2.097727, 49.474044, 1.912108, 39.735026, 75.977656],
    ];
    for (const [irradiance, temperature, isc, voc, imp, vmp, pmp] of cases) {
      const p = parameters({ ...defaults, irradiance, temperature }),
        m = maximum(p);
      expect(Math.abs(atVoltage(p, 0).current - isc)).toBeLessThan(1e-6);
      expect(Math.abs(openVoltage(p) * 96 - voc)).toBeLessThan(2e-6);
      expect(Math.abs(m.current - imp)).toBeLessThan(1e-6);
      expect(Math.abs(m.voltage * 96 - vmp)).toBeLessThan(3e-6);
      expect(Math.abs(m.power * 96 - pmp)).toBeLessThan(3e-6);
    }
  });
  it('recovers the ideal diode analytical intercepts and forward relation', () => {
    const p = { ...parameters(defaults), rs: 0, rsh: Infinity };
    expect(atVoltage(p, 0).current).toBe(p.il);
    expect(openVoltage(p)).toBeCloseTo(p.a * Math.log(1 + p.il / p.i0), 12);
    for (const v of [0.1, 0.3, 0.5])
      expect(atVoltage(p, v).current).toBeCloseTo(p.il - p.i0 * (Math.exp(v / p.a) - 1), 12);
  });
  it('satisfies KCL, terminal voltage and Ohm law including open and short circuits', () => {
    for (const mode of ['load', 'open', 'short'] as const)
      for (const resistance of [0, 0.001, 0.1, 1, 10]) {
        const c = { ...defaults, mode, resistance },
          p = parameters(c),
          o = operating(c, p);
        expect(p.il - o.current - o.diode - o.shunt).toBeCloseTo(0, 11);
        expect(o.u - o.current * p.rs).toBeCloseTo(o.voltage, 11);
        expect(o.power).toBeCloseTo(o.voltage * o.current, 12);
        if (mode === 'open') {
          expect(o.current).toBe(0);
          expect(o.power).toBe(0);
        } else expect(o.voltage).toBeCloseTo(o.current * (mode === 'short' ? 0 : resistance), 12);
        if (mode === 'short') {
          expect(o.voltage).toBe(0);
          expect(o.power).toBe(0);
        }
      }
  });
  it('darkness supplies no passive load power but accepts externally applied forward current', () => {
    for (const mode of ['load', 'open', 'short'] as const) {
      const c = { ...defaults, irradiance: 0, mode };
      expect(operating(c).power).toBe(0);
      expect(operating(c).current).toBe(0);
      expect(maximum(parameters(c)).power).toBe(0);
    }
    expect(atVoltage(parameters({ ...defaults, irradiance: 0 }), 0.6).current).toBeLessThan(0);
  });
  it('returns a monotone curve and a maximum bracketing a separate voltage sweep', () => {
    const p = parameters(defaults),
      points = curve(p),
      m = maximum(p),
      voc = openVoltage(p);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].voltage).toBeGreaterThanOrEqual(points[i - 1].voltage - 1e-12);
      expect(points[i].current).toBeLessThanOrEqual(points[i - 1].current + 1e-12);
    }
    const sampled = Array.from({ length: 1001 }, (_, i) => atVoltage(p, (voc * i) / 1000).power);
    expect(m.power).toBeGreaterThanOrEqual(Math.max(...sampled) - 1e-12);
    expect(m.power - Math.max(...sampled)).toBeLessThan(1e-4);
    expect(operating({ ...defaults, resistance: m.resistance }).power).toBeCloseTo(m.power, 10);
  });
  it('balances every energy channel with nonnegative passive losses over the supported extremes', () => {
    for (const irradiance of [0, 1, 400, 1200])
      for (const temperature of [-10, 25, 75])
        for (const mode of ['load', 'short', 'open'] as const)
          for (const series of [0, 5]) {
            const b = budget({
              ...defaults,
              irradiance,
              temperature,
              mode,
              series,
              collection: 0.5,
            });
            expect(b.total).toBeCloseTo(b.incident, 10);
            expect(b.currentResidual).toBeCloseTo(0, 10);
            for (const value of Object.values(b.items)) {
              expect(Number.isFinite(value)).toBe(true);
              expect(value).toBeGreaterThanOrEqual(-1e-10);
            }
            expect(b.items.series).toBeCloseTo(b.point.current ** 2 * b.p.rs, 12);
          }
  });
  it('keeps the bandgap threshold exact and assigns one pair rather than extra pairs to excess photon energy', () => {
    expect(threshold(ref.eg - 1e-8, 1).pairs).toBe(0);
    expect(threshold(ref.eg, 1).pairs).toBe(1);
    expect(threshold(2.55, 1).pairs).toBe(1);
    expect(threshold(2.55, 1).thermalized).toBeCloseTo(2.55 - ref.eg, 12);
    const sub = optical({ ...defaults, spectrum: 'mono', wavelength: 1400 });
    expect(sub.il).toBe(0);
    expect(sub.absorbed).toBe(0);
    const blue = optical({ ...defaults, spectrum: 'mono', wavelength: 450 });
    expect(blue.il).toBeLessThan(blue.generated);
    expect(blue.thermalization).toBeCloseTo(blue.absorbed * (1 - blue.eg / photonEnergy(450)), 12);
  });
  it('accounts for rejected photons and collected charge without exceeding pair generation', () => {
    for (const wavelength of [350, 800, 1100, 1400]) {
      const o = optical({ ...defaults, spectrum: 'mono', wavelength });
      expect(o.reflected + o.transmitted + o.absorbed).toBeCloseTo(o.incident, 12);
      expect(o.collectionEfficiency).toBeGreaterThan(0);
      expect(o.collectionEfficiency).toBeLessThan(1);
      expect(o.il).toBeLessThanOrEqual(o.generated);
      for (const b of o.bands) {
        expect(b.pairRate).toBeLessThanOrEqual(b.photonRate);
        expect(b.pairRate * ref.q).toBeCloseTo(b.generated, 12);
      }
      const b = budget({ ...defaults, spectrum: 'mono', wavelength });
      expect(b.total).toBeCloseTo(b.incident, 10);
    }
  });
  it('separates linear light response, hot-cell voltage loss, collection loss and series heating', () => {
    const p = parameters(defaults),
      half = parameters({ ...defaults, irradiance: 500 }),
      hot = parameters({ ...defaults, temperature: 65 });
    expect(half.il).toBeCloseTo(p.il / 2, 12);
    expect(hot.il).toBeGreaterThan(p.il);
    expect(openVoltage(hot)).toBeLessThan(openVoltage(p));
    expect(maximum(hot).power).toBeLessThan(maximum(p).power);
    const resistive = parameters({ ...defaults, series: 4 }),
      recomb = parameters({ ...defaults, collection: 0.7 });
    expect(resistive.il).toBe(p.il);
    expect(maximum(resistive).power).toBeLessThan(maximum(p).power);
    expect(recomb.il).toBeCloseTo(p.il * 0.7, 12);
    expect(recomb.rs).toBe(p.rs);
  });
});

describe('solar-cell: continuous identifiable paths and director', () => {
  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  it('creates equal opposite charges at the absorption point and keeps net charge zero', () => {
    expect(distance(episode(0.2 - 1e-9).photon!, geometry.absorption)).toBeLessThan(1e-7);
    for (const c of episode(0.2).carriers) expect(c.position).toEqual(geometry.absorption);
    for (const route of ['external', 'recombine'] as const)
      for (let i = 0; i <= 1000; i++) {
        const e = episode(i / 1000, route);
        expect(e.carriers.reduce((s, c) => s + c.charge, 0)).toBe(0);
        if (e.carriers.length)
          expect(e.carriers.map((c) => c.id)).toEqual(['selected-electron', 'selected-hole']);
      }
  });
  it('connects internal transport to the real wire and closes only where both charges meet', () => {
    expect(episode(0.52).carriers[0].position).toEqual(geometry.front);
    expect(
      distance(
        episode(0.52 - 1e-9).carriers[0].position,
        episode(0.52 + 1e-9).carriers[0].position,
      ),
    ).toBeLessThan(1e-7);
    for (const route of ['external', 'recombine'] as const) {
      const end = episode(0.98 - 1e-10, route).carriers;
      expect(distance(end[0].position, end[1].position)).toBeLessThan(1e-8);
      expect(episode(0.98, route).carriers).toHaveLength(0);
    }
    for (const p of [0.6, 0.7, 0.8, 0.9])
      expect(episode(p).carriers[0].position).toEqual(along(geometry.external, (p - 0.52) / 0.46));
    expect(episode(0.7).carriers[1].position).toEqual(geometry.rear);
  });
  it('lets a subgap photon cross the interface continuously with no pair', () => {
    const a = threshold(0.9, 0.6 - 1e-9),
      b = threshold(0.9, 0.6 + 1e-9);
    expect(distance(a.photon!, b.photon!)).toBeLessThan(1e-7);
    expect(b.pairs).toBe(0);
    expect(b.thermalized).toBe(0);
  });
  it('reconstructs every authored chapter backwards with no frame history or invalid energy', () => {
    const states = Array.from({ length: 8 * 41 }, (_, i) => ({
      chapter: Math.floor(i / 41),
      progress: (i % 41) / 40,
    }));
    const forward = states.map((s) => shot(s.chapter, s.progress));
    for (let i = states.length - 1; i >= 0; i--) {
      const now = shot(states[i].chapter, states[i].progress);
      expect(now).toEqual(forward[i]);
      expect(now.total).toBeCloseTo(now.incident, 9);
      expect(now.point.power).toBeGreaterThanOrEqual(-1e-10);
    }
    expect(shot(5, 0).incident).toBe(0);
    expect(shot(5, 1).config.irradiance).toBe(1000);
    expect(shot(4, 0).point.current).toBe(0);
    expect(shot(4, 1).point.voltage).toBe(0);
    expect(shot(1, 1).episode).toEqual(shot(2, 0).episode);
  });
  it('rejects unsupported electrical inputs instead of inventing extrapolations', () => {
    for (const change of [
      { irradiance: -1 },
      { temperature: 100 },
      { collection: 1.1 },
      { series: -1 },
      { resistance: Infinity },
      { wavelength: 0 },
    ])
      expect(() => parameters({ ...defaults, ...change } as SolarCellConfig)).toThrow(RangeError);
    expect(() => atJunction(parameters(defaults), -1)).toThrow(RangeError);
  });
});
