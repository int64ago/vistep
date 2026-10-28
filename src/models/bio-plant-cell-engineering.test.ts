import { it, expect } from 'vitest';
import {
  fusionOutline,
  fusionGeometry,
  insideFusion,
  tissueState,
  hormoneResponse,
  explantRate,
  hybridEvidence,
  plantCellMeasuredDirector,
} from './bio-plant-cell-engineering';
it('contacts membranes before joining and conserves depicted area', () => {
  expect(fusionOutline(0.24).connected).toBe(false);
  expect(fusionOutline(0.25).d).toBe(68);
  for (let i = 0; i <= 1000; i++) {
    const f = fusionOutline(i / 1000);
    expect(f.area).toBeCloseTo(2 * Math.PI * 34 ** 2, 7);
  }
  expect(fusionOutline(1).r).toBeCloseTo(34 * Math.SQRT2);
});

it('holds the measured prediction until its question ends and preserves old shoots during new growth', () => {
  for (const en of [false, true]) {
    const at = (chapter: number, time: number) => plantCellMeasuredDirector(chapter, 0, time, en);
    expect(regenerationSequence(at(0, en ? 5.3 : 6.3).progress).root).toBe(1);
    const question = at(3, en ? 12.31 : 11.95);
    expect(question.progress).toBeLessThan(0.45);
    const reveal = at(3, en ? 12.6 : 12.5);
    expect(reveal.progress).toBeCloseTo(0.45);
    const oldShoot = regenerationIntervention(3, 0.5, 0).shoot;
    let previous = 0;
    for (let t = 0; t <= 28; t += 0.05) {
      const d = at(3, t);
      expect(d.progress).toBeGreaterThanOrEqual(previous);
      previous = d.progress;
      const r = regenerationIntervention(d.aux, d.cyt, Math.max(0, (d.progress - 0.45) / 0.55));
      expect(r.shoot).toBeGreaterThanOrEqual(oldShoot);
      expect(r.information).toEqual(['I1', 'I2', 'I3']);
    }
    expect(at(3, en ? 17.5 : 17.8).progress).toBe(1);
    expect(at(7, 15).progress).toBe(0);
    for (const chapter of [0, 1, 2, 3]) {
      expect(at(chapter, NaN).progress).toBe(0);
      expect(at(chapter, -1).progress).toBe(0);
    }
  }
});
it('preserves all four nuclear identities and twelve organelles inside the drawn membrane', () => {
  for (const w of [240, 320, 800])
    for (let i = 0; i <= 200; i++) {
      const g = fusionGeometry(w, i / 200);
      expect(g.markers.map((a) => a.id)).toEqual(['A1', 'A2', 'B1', 'B2']);
      for (const a of [...g.markers, ...g.organelles])
        expect(insideFusion(a.localX, a.localY, g.body, 3)).toBe(true);
    }
});
it('nuclear fusion happens within the already fused cytoplasm', () => {
  for (let i = 0; i <= 200; i++) {
    const g = fusionGeometry(240, 1, i / 200);
    for (const a of g.markers) expect(insideFusion(a.localX, a.localY, g.body, 3)).toBe(true);
  }
  expect(fusionGeometry(240, 1, 0).nuc.connected).toBe(false);
  expect(fusionGeometry(240, 1, 1).nuc.connected).toBe(true);
});
it('uses genuinely different narrow and wide arrangements', () => {
  expect(fusionGeometry(320, 0).vertical).toBe(true);
  expect(fusionGeometry(800, 0).vertical).toBe(false);
});
it('keeps shoot and root emergence downstream of the explant', () => {
  expect(tissueState(0, 1).shoot).toBe(0);
  expect(tissueState(1, 0.5).callus).toBe(1);
  expect(tissueState(1, 0.5).root).toBe(0);
  expect(tissueState(2, 0.5).shoot).toBe(1);
  expect(tissueState(3, 1, true).acclimatized).toBe(0);
});
it('ratio alone does not determine response; zero external hormone is a separate case', () => {
  const low = hormoneResponse(0.1, 0.1),
    mid = hormoneResponse(1, 1),
    high = hormoneResponse(10, 10);
  expect(low.ratio).toBe(mid.ratio);
  expect(mid.callus).toBeGreaterThan(low.callus);
  expect(mid.callus).toBeGreaterThan(high.callus);
  expect(hormoneResponse(3, 0.5).root).toBeGreaterThan(hormoneResponse(0.5, 3).root);
  expect(hormoneResponse(0.5, 3).shoot).toBeGreaterThan(hormoneResponse(3, 0.5).shoot);
  expect(hormoneResponse(0, 0).ratio).toBeNull();
});
it('keeps own records absent and distinguishes nuclear from organelle evidence', () => {
  expect(explantRate('', '10')).toBeNull();
  expect(explantRate('11', '10')).toBeNull();
  expect(explantRate('3', '10')).toBe(0.3);
  expect(hybridEvidence.hybrid.nuclear).toEqual(['A', 'B']);
  expect(hybridEvidence.hybrid.plastid).toBe('one-parent');
});
import {
  plantCellDirector,
  regenerationSequence,
  regenerationResponse,
  regenerationIntervention,
} from './bio-plant-cell-engineering';
it('retains information while signals change illustrative expression and organ direction', () => {
  const shoots = regenerationResponse(0.5, 3),
    roots = regenerationResponse(3, 0.5);
  expect(shoots.information).toEqual(roots.information);
  expect(shoots.response.total).toBe(roots.response.total);
  expect(shoots.shoot).toBeGreaterThan(shoots.root);
  expect(roots.root).toBeGreaterThan(roots.shoot);
  expect(shoots.expression[1]).toBe(shoots.shoot);
  expect(roots.expression[2]).toBe(roots.root);
  const unresponsive = regenerationResponse(3, 0.5, 1, 0);
  expect(unresponsive.information).toEqual(roots.information);
  expect([unresponsive.shoot, unresponsive.root, unresponsive.callus]).toEqual([0, 0, 0]);
});
it('changes new growth without erasing shoots already present before intervention', () => {
  const initial = regenerationResponse(0.5, 3),
    control = regenerationIntervention(0.5, 3, 1),
    changed = regenerationIntervention(3, 0.5, 1);
  for (const rates of [
    [0, 0],
    [0.5, 3],
    [3, 0.5],
    [10, 10],
  ])
    for (const t of [0, 0.001, 0.25, 0.5, 0.999, 1]) {
      const r = regenerationIntervention(rates[0], rates[1], t);
      expect(r.shoot).toBeGreaterThanOrEqual(initial.shoot);
      expect(r.information).toEqual(initial.information);
      expect(r.shoot).toBeLessThanOrEqual(1);
    }
  expect(changed.root).toBeGreaterThan(control.root);
  expect(regenerationIntervention(3, 0.5, 0).shoot).toBe(initial.shoot);
  expect(regenerationIntervention(3, 0.5, 0).root).toBe(0);
  expect(regenerationIntervention(3, 0.5, 1, 0).shoot).toBe(initial.shoot);
});
it('keeps a connected successful route distinct from guaranteed regeneration', () => {
  expect(regenerationSequence(0.3).shoot).toBe(0);
  expect(regenerationSequence(0.65).root).toBe(0);
  expect(regenerationSequence(1)).toMatchObject({ lineage: 'L1', callus: 1, shoot: 1, root: 1 });
  expect(regenerationSequence(1, 0)).toMatchObject({ lineage: 'L1', callus: 0, shoot: 0, root: 0 });
  expect(plantCellDirector(3, 0.3)).toMatchObject({
    chapter: 3,
    progress: 0.3,
    aux: 3,
    cyt: 0.5,
    total: '',
    prediction: 'none',
  });
  expect(plantCellDirector(10, 0.8)).toMatchObject({ aux: 10, cyt: 10 });
  for (const p of [-1, NaN, Infinity, 2])
    expect(Number.isFinite(regenerationSequence(p).root)).toBe(true);
});
