import { it, expect } from 'vitest';
import {
  mitoticState,
  animalCytokinesis,
  cubeExchange,
  fixedRootField,
  stageCounts,
  syntheticStage,
  FIXED_FEATURES,
  LIVE_DIVISION_RECORD,
  liveRecordAt,
  divisionDirector,
} from './bio-cell-division';
it('conserves replicated chromatid identity while each daughter receives one copy', () => {
  const before = mitoticState(2.9),
    after = mitoticState(4);
  expect(before.chromosomesPerCell).toBe(4);
  expect(after.chromosomesPerCell).toBe(8);
  expect(mitoticState(5.5).chromosomesPerCell).toBe(4);
  expect(after.dnaInWholeSystem).toBe(8);
  for (const side of [0, 1])
    expect(after.chromatids.filter((c) => c.sister === side).map((c) => c.chromosome)).toEqual([
      0, 1, 2, 3,
    ]);
  for (let p = 0; p < 5.99; p += 0.01) {
    const a = mitoticState(p),
      b = mitoticState(p + 0.01);
    for (let i = 0; i < 8; i++)
      expect(
        Math.hypot(a.chromatids[i].x - b.chromatids[i].x, a.chromatids[i].y - b.chromatids[i].y),
      ).toBeLessThan(1);
  }
});
it('matches independent cube surface/volume and shell-volume calculations', () => {
  expect(cubeExchange(2, 0.5)).toMatchObject({
    area: 24,
    volume: 8,
    areaPerVolume: 3,
    fraction: 0.875,
  });
  expect(cubeExchange(4, 0.5).fraction).toBeCloseTo(37 / 64);
  expect(cubeExchange(8, 0.5).fraction).toBeCloseTo(169 / 512);
  expect(cubeExchange(2, 0).fraction).toBe(0);
  expect(cubeExchange(2, 10).fraction).toBe(1);
});
it('fixed root preparations do not change with a playback clock and counting does not double-count cells', () => {
  expect(fixedRootField(0)).toEqual(fixedRootField(0));
  expect(new Set(fixedRootField(1).map((c) => c.id)).size).toBe(50);
  expect(Object.values(stageCounts()).reduce((a, b) => a + b, 0)).toBe(50);
  expect(stageCounts().interphase).toBe(34);
  expect(fixedRootField(0)[0].id).not.toBe(fixedRootField(1)[0].id);
});

it('keeps chromosome count scope distinct across completed cytokinesis', () => {
  expect(mitoticState(4.99).cellCount).toBe(1);
  expect(mitoticState(4.99).chromosomesPerCell).toBe(8);
  expect(mitoticState(5).cellCount).toBe(2);
  expect(mitoticState(5).chromosomesInWholeSystem).toBe(8);
  expect(mitoticState(5).chromosomesPerCell).toBe(4);
  expect(mitoticState(5).dnaInWholeSystem).toBe(8);
  expect(mitoticState(4.3).division).toBe(0);
  expect(mitoticState(5).division).toBe(1);
});
it('handles invalid model inputs without undefined stages or nonfinite geometry', () => {
  for (const n of [NaN, Infinity, -Infinity, -1e6]) {
    const s = mitoticState(n);
    expect(s.phase).toBeDefined();
    expect(s.chromatids.every((c) => Number.isFinite(c.x + c.y + c.visible))).toBe(true);
    expect(Object.values(cubeExchange(n, n)).every(Number.isFinite)).toBe(true);
    expect(fixedRootField(n).every((c) => c.stage !== undefined)).toBe(true);
  }
});

it('a synchronized snapshot changes observed fractions without changing the period or stage boundaries', () => {
  const mixed = stageCounts(0, false),
    synchronized = stageCounts(0, true);
  expect(mixed.metaphase).toBe(4);
  expect(synchronized.metaphase).toBe(50);
  expect(Object.values(mixed).reduce((a, b) => a + b, 0)).toBe(50);
  expect(Object.values(synchronized).reduce((a, b) => a + b, 0)).toBe(50);
  expect(stageCounts(1)).not.toEqual(stageCounts(0));
  const fixed = fixedRootField(0);
  for (const f of FIXED_FEATURES) expect(fixed[f.cell].stage).toBe(f.stage);
  for (let t = 0; t < 46; t += 0.5) {
    divisionDirector(6, t);
    expect(fixedRootField(0)).toEqual(fixed);
  }
});
it('published time points and same-cell identity remain fixed, without fabricated intermediate recordings', () => {
  expect(LIVE_DIVISION_RECORD.map((r) => r.minute)).toEqual([0, 20, 33, 38, 69]);
  expect(new Set(LIVE_DIVISION_RECORD.map((r) => r.cellId)).size).toBe(1);
  for (let i = 0; i < 5; i++) expect(liveRecordAt(i)).toBe(LIVE_DIVISION_RECORD[i]);
  expect(liveRecordAt(NaN)).toBe(LIVE_DIVISION_RECORD[0]);
  expect(liveRecordAt(8)).toBe(LIVE_DIVISION_RECORD[4]);
});
it('the alignment chapter ends before the sister-separation chromosome-count transition', () => {
  expect(mitoticState(divisionDirector(1, 22).mitosis).chromosomesPerCell).toBe(4);
  expect(mitoticState(divisionDirector(2, 0).mitosis).chromosomesPerCell).toBe(8);
  expect(mitoticState(divisionDirector(3, 22).mitosis).cellCount).toBe(2);
});

it('classifies exact synthetic boundaries without a positive-input modulo roundoff shift', () => {
  expect(syntheticStage(0.68)).toBe('prophase');
  expect(syntheticStage(0.8)).toBe('metaphase');
  expect(syntheticStage(0.88)).toBe('anaphase');
  expect(syntheticStage(0.94)).toBe('telophase');
  expect(syntheticStage(1)).toBe('interphase');
  expect(syntheticStage(-0.5)).toBe('interphase');
});

it('aligns published frame selection and statistical reveal with the independently measured words', () => {
  for (const [locale, recordAt, statisticsAt, syncAt] of [
    ['zh', 10.43, 20.29, 29.2],
    ['en', 11.19, 25.49, 36.2],
  ] as const) {
    expect(divisionDirector(6, recordAt, locale).fixedShot).toBe('live-record');
    expect(divisionDirector(6, recordAt, locale).recordIndex).toBe(0);
    expect(divisionDirector(6, statisticsAt - 0.01, locale).recordIndex).toBe(4);
    expect(divisionDirector(6, statisticsAt, locale).fixedShot).toBe('counterexample');
    expect(divisionDirector(6, syncAt - 0.01, locale).synchronized).toBe(false);
    expect(divisionDirector(6, syncAt, locale).synchronized).toBe(true);
  }
  expect(divisionDirector(6, 15, 'zh').recordIndex).toBe(1);
  expect(divisionDirector(6, 18.2, 'en').recordIndex).toBe(1);
});
it('finishes replication and cell-plate growth before the spoken outcome, without changing biological equations', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(mitoticState(divisionDirector(0, 7.5, locale).mitosis).dnaInWholeSystem).toBe(8);
    const before = divisionDirector(3, locale === 'en' ? 4.2 : 6.3, locale),
      after = divisionDirector(3, locale === 'en' ? 8 : 11.7, locale);
    expect(mitoticState(before.mitosis).division).toBe(0);
    expect(mitoticState(after.mitosis).division).toBe(1);
  }
});

it('keeps nuclear outlines inside the animal membrane and closes both daughters at cytokinesis', () => {
  for (let j = 0; j <= 400; j++) {
    const p = 4 + (1.999 * j) / 400,
      a = animalCytokinesis(p);
    for (const n of a.nuclei)
      for (let k = 0; k < 180; k++) {
        const q = (k * Math.PI) / 90,
          x = n.cx + n.rx * Math.cos(q),
          y = n.cy + n.ry * Math.sin(q);
        expect(
          a.lobes.some((l) => ((x - l.cx) / l.rx) ** 2 + ((y - l.cy) / l.ry) ** 2 <= 1 + 1e-10),
        ).toBe(true);
      }
    expect(a.split).toBe(p >= 5);
    expect(a.path).not.toContain('NaN');
  }
  const before = animalCytokinesis(4.999999),
    closed = animalCytokinesis(5),
    end = animalCytokinesis(5.999);
  expect(before.neckHalfHeight).toBeLessThan(0.3);
  expect(closed.neckHalfHeight).toBe(0);
  expect(closed.path.match(/Z/g)).toHaveLength(2);
  expect(end.gap).toBeGreaterThan(7.9);
  expect(end.nuclei.map((n) => n.cx)).toEqual([115, 255]);
});
