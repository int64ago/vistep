import { it, expect } from 'vitest';
import {
  engelmannBacteria,
  oxygenSource,
  hillReaction,
  oxygenIsotope,
  photosynthesisCoupling,
  leafDiscs,
  ACID_BASE_ATP,
  CALVIN_RECORDS,
  protonEnergy,
  gradientCoupling,
  lightGradientEpisode,
  synthaseProton,
  carbonFixation,
  carrierPosition,
  photoDirector,
} from './bio-photosynthesis-evidence';
it('selected light episode stays on the transport path and builds the gradient after excitation', () => {
  let previous = lightGradientEpisode(0);
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000,
      s = lightGradientEpisode(p);
    expect(s.electron.id).toBe('e-transport');
    expect(s.proton.id).toBe('H-pumped');
    // The drawn membrane path is a vertical branch followed by a sloped branch.
    if (s.electron.x === 55) expect(s.electron.y).toBeGreaterThanOrEqual(110);
    else expect(s.electron.y).toBeCloseTo(110 + ((s.electron.x - 55) * 30) / 160, 10);
    if (p <= 0.4) expect(s.proton.y).toBe(205);
    expect(s.proton.y).toBeLessThanOrEqual(previous.proton.y);
    expect(
      Math.hypot(s.electron.x - previous.electron.x, s.electron.y - previous.electron.y),
    ).toBeLessThan(1);
    expect(Math.hypot(s.proton.x - previous.proton.x, s.proton.y - previous.proton.y)).toBeLessThan(
      1,
    );
    previous = s;
  }
  expect(lightGradientEpisode(1).photon.opacity).toBe(0);
  expect(lightGradientEpisode(1).energyState).toBe(0);
  expect(lightGradientEpisode(1).proton.y).toBe(45);
});
it('preserves bacterial identities and limits the indicator to qualitative oxygen response', () => {
  const b = engelmannBacteria(1, 'spot', 0.4);
  expect(new Set(b.map((x) => x.id)).size).toBe(60);
  expect(b.every((x) => x.y < 103 || x.y > 157)).toBe(true);
  expect(b.filter((x) => Math.abs((x.x - 30) / 300 - 0.4) < 0.12).length).toBeGreaterThan(35);
  expect(oxygenSource(0.14, 'spectrum')).toBeGreaterThan(oxygenSource(0.5, 'spectrum'));
  expect(engelmannBacteria(1, 'dark')).toEqual(engelmannBacteria(0, 'dark'));
});
it('requires light and electron acceptor in the isolated Hill system; traces O from water', () => {
  expect(hillReaction(1, false).oxygen).toBe(0);
  expect(hillReaction(1, true, false).oxygen).toBe(0);
  expect(hillReaction(1).reducedAcceptor).toBe(4);
  expect(oxygenIsotope(false, true).oxygenAtoms.every((a) => a.mass === 16)).toBe(true);
  expect(oxygenIsotope(true, false).oxygenAtoms.every((a) => a.mass === 18)).toBe(true);
});
it('keeps independently transcribed historical observations immutable and not zero-subtracted', () => {
  expect(ACID_BASE_ATP.map((x) => [x.acidPH, x.alkalinePH, x.totalATP])).toEqual([
    [3.8, 8, 141],
    [7, 8, 12],
  ]);
  gradientCoupling(80, { leak: 2 });
  expect(ACID_BASE_ATP[0].totalATP).toBe(141);
  expect(Object.isFrozen(ACID_BASE_ATP[0])).toBe(true);
  expect(CALVIN_RECORDS.map((x) => [x.exposureSeconds, x.figure, x.pga, x.triose])).toEqual([
    [5, 6, true, true],
    [30, 5, true, true],
  ]);
});
it('matches an independent thermodynamic benchmark including sign and voltage', () => {
  // RT ln(1000) at 298.15 K = 17.124... kJ/mol; no fitted kinetic constant.
  expect(protonEnergy(4, 7)).toBeCloseTo(17.1240285, 5);
  expect(protonEnergy(7, 4)).toBeCloseTo(-17.1240285, 5);
  expect(protonEnergy(7, 7, 0.1)).toBeCloseTo(9.648533212, 8);
  expect(protonEnergy(7, 7)).toBe(0);
});
it('accounts for finite proton store, chemical work and heat under productive and leak paths', () => {
  for (const deltaPH of [0, 1, 3, 5])
    for (const leak of [0, 0.6, 2])
      for (const time of [0, 0.01, 3, 20, 120]) {
        const s = gradientCoupling(time, { deltaPH, leak });
        expect(s.q + s.passed + s.leaked).toBeCloseTo(s.initialQ, 8);
        expect(s.atp * s.protonsPerATP).toBeCloseTo(s.passed, 8);
        expect(s.storedEnergy + s.chemicalWork + s.dissipated).toBeCloseTo(s.initialEnergy, 7);
        expect(s.dissipated).toBeGreaterThanOrEqual(-1e-8);
        expect(s.atp).toBeLessThanOrEqual(6);
      }
});
it('counterexamples separate substrate, gradient and membrane leakage from a light switch', () => {
  expect(gradientCoupling(20, { deltaPH: 0 }).atp).toBe(0);
  expect(gradientCoupling(20, { deltaPH: 1 }).atp).toBe(0); // insufficient example driving energy
  expect(gradientCoupling(20, { adp: false }).atp).toBe(0);
  expect(gradientCoupling(20, { phosphate: false }).atp).toBe(0);
  expect(gradientCoupling(20).atp).toBeGreaterThan(gradientCoupling(20, { leak: 2 }).atp);
  const leak = gradientCoupling(20, { adp: false, leak: 2 });
  expect(leak.leaked).toBeGreaterThan(0);
  expect(leak.chemicalWork).toBe(0);
});
it('selected proton follows a continuous bound route, never becomes a phosphorus atom', () => {
  let old = synthaseProton(0);
  for (let i = 1; i <= 1000; i++) {
    const s = synthaseProton(i / 1000);
    expect(s.id).toBe('H-tracked');
    expect(Math.hypot(s.x - old.x, s.y - old.y)).toBeLessThan(3);
    old = s;
  }
  expect(synthaseProton(0.5).phase).toBe('bound');
  expect(synthaseProton(1).phase).toBe('exit');
});
it('conserves six named carbon atoms and the independently mapped early carboxyl label', () => {
  for (let i = 0; i <= 200; i++) {
    const s = carbonFixation(i / 200);
    expect(new Set(s.nodes.map((n) => n.id)).size).toBe(6);
    expect(s.nodes.filter((n) => n.labeled)).toHaveLength(1);
    expect(s.nodes.filter((n) => n.product === 'PGA-A')).toHaveLength(3);
    expect(s.nodes.filter((n) => n.product === 'PGA-B')).toHaveLength(3);
  }
  const s = carbonFixation(1);
  expect(s.nodes.find((n) => n.id === 'co2-C')).toMatchObject({
    product: 'PGA-A',
    productPosition: 1,
  });
  expect(s.nodes.find((n) => n.id === 'RuBP-C1')).toMatchObject({
    product: 'PGA-A',
    productPosition: 3,
  });
  expect(s.edges.find((e) => e.a === 'RuBP-C2' && e.b === 'RuBP-C3')?.opacity).toBe(0);
});
it('finite stores permit brief dark continuation, not synthesis without stored resources', () => {
  const before = photosynthesisCoupling(5, 5),
    after = photosynthesisCoupling(7, 5);
  expect(after.triose).toBeGreaterThan(before.triose);
  expect(after.atp).toBeLessThan(before.atp);
  expect(photosynthesisCoupling(10, 0).triose).toBe(0);
  expect(photosynthesisCoupling(10, Infinity, false).triose).toBe(0);
});
it('matched discs expose preexisting air and net oxygen confounders', () => {
  expect(leafDiscs(10, 1).floating).toBeGreaterThan(leafDiscs(10, 0.1).floating);
  expect(leafDiscs(10, 0).floating).toBe(0);
  expect(leafDiscs(0, 0, false).floating).toBe(10);
  expect(leafDiscs(10, 1, true, 0).floating).toBe(0);
  expect(leafDiscs(5, 1).discs.map((x) => x.threshold)).toEqual(
    leafDiscs(5, 0.1).discs.map((x) => x.threshold),
  );
});
it('finite boundaries do not leak NaN into energy, carbon or the director', () => {
  for (const n of [NaN, Infinity, -Infinity, -1e6]) {
    expect(Number.isFinite(protonEnergy(n, n, n, n))).toBe(true);
    expect(Number.isFinite(gradientCoupling(n, { deltaPH: n, leak: n }).atp)).toBe(true);
    expect(carbonFixation(n).nodes.every((x) => Number.isFinite(x.x + x.y))).toBe(true);
    expect(Number.isFinite(photoDirector(n, n).progress)).toBe(true);
  }
});

it('carrier identities follow a closed route without teleporting at loaded-state changes', () => {
  for (let id = 0; id < 2; id++) {
    let old = carrierPosition(0, id);
    for (let i = 1; i <= 2000; i++) {
      const s = carrierPosition(i / 1000, id);
      expect(Math.hypot(s.x - old.x, s.y - old.y)).toBeLessThan(1);
      expect(s.id).toBe(id);
      old = s;
    }
  }
});

it('carbon remapping keeps visible atom identities separated rather than crossing through each other', () => {
  for (let i = 0; i <= 500; i++) {
    const s = carbonFixation(i / 500);
    for (let a = 0; a < 6; a++)
      for (let b = a + 1; b < 6; b++) {
        expect(
          Math.hypot(s.nodes[a].x - s.nodes[b].x, s.nodes[a].y - s.nodes[b].y),
        ).toBeGreaterThan(36);
      }
  }
});

it('the bound proton remains on the same rotor site, with an entry hold before rotation', () => {
  for (let i = 0; i <= 90; i++) {
    const turns = i / 100,
      h = synthaseProton(turns),
      a = -Math.PI / 2 + 0.2 + turns * 2 * Math.PI;
    expect(h.x).toBeCloseTo(135 + 35 * Math.cos(a), 10);
    expect(h.y).toBeCloseTo(120 + 35 * Math.sin(a), 10);
  }
  const first = synthaseProton(0, 0),
    end = synthaseProton(0, 1);
  expect(first.phase).toBe('entry');
  expect(end.phase).toBe('bound');
  expect(first.y).toBe(35);
});

it('measured words reveal the gradient, then the same proton entry, rotor and exit in each language', () => {
  // Cue-relative ASR times plus 0.45 s lead-in; the two languages are not forced
  // onto identical shot cuts. The independent mechanistic functions are sampled.
  for (const [locale, entry, bound, exit, leak] of [
    ['zh', 24.2, 27.8, 30.5, 41.5],
    ['en', 25.8, 29.5, 32.2, 46.5],
  ] as const) {
    const early = photoDirector(4, entry, locale);
    expect(early.atpShot).toBe('motor');
    expect(synthaseProton(0, early.motorTime).phase).toBe('entry');
    const rotating = photoDirector(4, bound, locale);
    const s = gradientCoupling(Math.max(0, rotating.motorTime - 1));
    expect(synthaseProton(s.turns, rotating.motorTime).phase).toBe('bound');
    const left = photoDirector(4, exit, locale);
    expect(synthaseProton(gradientCoupling(left.motorTime - 1).turns, left.motorTime).phase).toBe(
      'exit',
    );
    const comparison = photoDirector(4, leak, locale);
    expect(comparison.atpShot).toBe('leak');
    expect(gradientCoupling(comparison.leakTime, { leak: 2 }).atp).toBeLessThan(
      gradientCoupling(comparison.leakTime).atp,
    );
  }
});
it('actual inference words retain fixed carbon records before introducing the net atom map', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(photoDirector(6, 10, locale).carbonShot).toBe('records');
    expect(photoDirector(6, 18, locale).carbonShot).toBe('identity');
    expect(photoDirector(6, 24, locale).carbonShot).toBe('map');
    expect(photoDirector(6, 31, locale).carbonProgress).toBe(1);
    expect(photoDirector(6, 35, locale).carbonShot).toBe('prediction');
  }
});
it('language-specific switch-off retains a finite pool and fresh prediction cases remain distinct', () => {
  for (const [locale, offAt] of [
    ['zh', 11.6],
    ['en', 12.65],
  ] as const) {
    const at = photosynthesisCoupling(photoDirector(5, offAt, locale).coupleTime, 7);
    const later = photosynthesisCoupling(photoDirector(5, offAt + 3, locale).coupleTime, 7);
    expect(at.light).toBe(false);
    expect(at.atp).toBeGreaterThan(0);
    expect(later.triose).toBeGreaterThan(at.triose);
    expect(later.atp).toBeLessThan(at.atp);
    expect(photoDirector(2, 18, locale).hillAcceptor).toBe(true);
    expect(photoDirector(2, 23, locale).hillAcceptor).toBe(false);
    expect(photoDirector(8, 12, locale).discCase).toBe('baseline');
    expect(photoDirector(8, 16.5, locale).discCase).toBe('no-co2');
    const trapped = photoDirector(8, 19, locale);
    expect(trapped.discCase).toBe('trapped-air');
    expect(trapped.discTime).toBe(0);
  }
});
