import { it, expect } from 'vitest';
import {
  textbookCultureLifespans,
  cultureRemaining,
  observedRegeneration,
  regenerationHypothesis,
  differentiationProgram,
  cultureComparison,
  textbookNuclearSwap,
  cytoplastEvidence,
  wormCellFates,
  lineageFrame,
  executionComparison,
  FATES_CHAPTERS,
  FATES_SECONDS,
  fatesDirector,
} from './bio-cell-fates';
it('keeps published textbook records immutable when an alternative condition is considered', () => {
  const records = JSON.stringify(textbookCultureLifespans);
  for (const same of [true, false]) {
    const s = cultureComparison(same);
    expect(s.rows.map((r) => [r.min, r.max])).toEqual([
      [50, 50],
      [20, 20],
      [2, 4],
    ]);
    expect(s.individualLifespan).toBeNull();
    expect(s.deathMeasured).toBe(false);
    expect(s.causalAgingMechanismIdentified).toBe(false);
    expect(s.directlyComparable).toBe(same);
  }
  expect(JSON.stringify(textbookCultureLifespans)).toBe(records);
  expect(cultureRemaining(3)[2]).toMatchObject({ remainingMin: 0, remainingMax: 1 });
  expect(cultureRemaining(NaN)).toEqual(cultureRemaining(0));
});
it('compares an information-loss hypothesis without synthesizing a regeneration success rate', () => {
  for (const lost of [true, false]) {
    const h = regenerationHypothesis(lost);
    expect(h.observedRegeneration).toBe(true);
    expect(h.compatibleWithObservedResult).toBe(!lost);
    expect(h.provesEveryCellRegenerates).toBe(false);
    expect(h.measuredGeneExpression).toBe(false);
  }
  expect(observedRegeneration(1)).toMatchObject({
    sampleId: 'carrot-phloem-culture',
    root: 1,
    shoot: 1,
    conditional: true,
    evidence: 'textbook-reconstruction',
  });
  for (const p of [NaN, -3, 0, Infinity]) expect(observedRegeneration(p).progress).toBe(0);
  expect(observedRegeneration(5).progress).toBe(1);
});
it('retains all DNA programs and produces distinct RNA and protein identities from the selected template', () => {
  for (const role of ['root', 'shoot'] as const)
    for (const p of [0, 0.1, 0.69, 0.7, 0.79, 0.8, 1]) {
      const s = differentiationProgram(role, p);
      expect(s.programs.map((g) => g.id)).toEqual(['growth', 'root', 'shoot']);
      expect(s.programs.every((g) => g.present)).toBe(true);
      expect(s.programs.filter((g) => g.selected).map((g) => g.id)).toEqual([role]);
      expect(s.transcript.templateId).toBe(role);
      expect(s.protein.templateId).toBe(role);
      expect(s.transcript.id).not.toBe(s.protein.id);
      expect(s.programs.some((g) => String(g.id) === s.transcript.id)).toBe(false);
      if (s.protein.visible) {
        expect(s.transcript.visible).toBe(true);
        expect(s.transcript.x).toBe(170);
        expect(s.transcript.y).toBe(88);
      }
    }
  expect(differentiationProgram('root', 0).transcript).toMatchObject({
    x: 84,
    y: 80,
    visible: false,
  });
  expect(differentiationProgram('shoot', 0).transcript).toMatchObject({
    x: 84,
    y: 120,
    visible: false,
  });
});
it('keeps lineage births and identities unchanged under either execution-gene intervention', () => {
  for (let k = 0; k <= 100; k++) {
    const p = k / 100,
      normal = lineageFrame(p);
    for (const gene of [
      [false, true],
      [true, false],
      [false, false],
    ]) {
      const changed = lineageFrame(p, ...(gene as [boolean, boolean]));
      expect(changed.map((n) => [n.cellId, n.birth, n.parent])).toEqual(
        normal.map((n) => [n.cellId, n.birth, n.parent]),
      );
      expect(changed.every((n) => n.death === 0)).toBe(true);
    }
    for (const n of normal) {
      if (n.parent !== null) expect(normal[n.parent].birth).toBeGreaterThanOrEqual(n.birth);
      if (n.death > 0) expect(n.birth).toBe(1);
    }
  }
  expect(
    lineageFrame(1)
      .filter((n) => !n.retained)
      .map((n) => n.cellId),
  ).toEqual(['local-10', 'local-13']);
});
it('separates canonical somatic totals from the illustrative local branch', () => {
  expect(lineageFrame(1)).toHaveLength(15);
  expect(wormCellFates(1)).toMatchObject({
    formed: 1090,
    scheduled: 131,
    dead: 131,
    retained: 959,
  });
  for (const p of [NaN, -1, 0, 0.4, 1, 10]) {
    const s = wormCellFates(p);
    expect(s.dead + s.retained).toBe(1090);
    expect(s.dead).toBeGreaterThanOrEqual(0);
    expect(s.dead).toBeLessThanOrEqual(131);
  }
});
it('reports nuclear findings with their scope and the 1983 bound rather than an invented mean', () => {
  expect(textbookNuclearSwap(true, false)).toMatchObject({
    textbookProliferation: 'vigorous',
    generalizes: false,
  });
  const e = cytoplastEvidence();
  expect(e.fusionUpperBound).toBe(0.6);
  expect(e.control - e.inhibitionLowerBound).toBe(e.fusionUpperBound);
  expect(e.rawData).toBe(false);
});
it('preserves all six chapter IDs, resets each nuclear transfer and leaves an under-five-minute plan', () => {
  expect(FATES_CHAPTERS).toEqual(['culture', 'age', 'nuclear', 'limits', 'lineage', 'genes']);
  expect(FATES_SECONDS.reduce((a, b) => a + b, 0)).toBeLessThan(300);
  expect(fatesDirector(2, 2).swapProgress).toEqual([0, 0]);
  expect(fatesDirector(2, 6.3).swapProgress).toEqual([1, 0]);
  expect(fatesDirector(2, 11).swapProgress).toEqual([1, 1]);
  expect(fatesDirector(NaN, NaN).chapter).toBe('culture');
});

it('starts the intervention comparison with the same cell already born', () => {
  for (const p of [0, 0.2, 0.6, 1]) {
    const s = executionComparison(p, false, true);
    expect(s.normal.birth).toBe(1);
    expect(s.intervention.birth).toBe(1);
    expect(s.normal.cellId).toBe(s.intervention.cellId);
    expect(s.intervention.death).toBe(0);
  }
  expect(executionComparison(0).normal.death).toBe(0);
  expect(executionComparison(1).normal.death).toBe(1);
});
