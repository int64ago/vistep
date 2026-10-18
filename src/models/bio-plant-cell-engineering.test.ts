import { it, expect } from 'vitest';
import {
  fusionOutline,
  fusionGeometry,
  insideFusion,
  tissueState,
  hormoneResponse,
  explantRate,
  hybridEvidence,
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
