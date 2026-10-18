import { describe, expect, it } from 'vitest';
import {
  fusedChromosomes,
  genomeAssembly,
  genomeSegmentPoints,
  continuousFusion,
  foldedFusion,
  expressionState,
  yeastGrowth,
  visibleGrowth,
  genomesDirector,
  genomeChapters,
  genomeDurations,
  rnaGeometry,
  proteinGeometry,
  genomeEvidence,
  genomeMeasuredAnchors,
} from './bio-engineered-genomes';
describe('retained chromosome geometry', () => {
  it('keeps material segment IDs and closes every ring join continuously', () => {
    for (let id = 0; id < 12; id++) {
      for (let p = 0; p < 1; p += 0.005) {
        const a = genomeSegmentPoints(id, p),
          b = genomeSegmentPoints(id, p + 0.005);
        expect(Math.max(...a.map((q, i) => Math.hypot(q.x - b[i].x, q.y - b[i].y)))).toBeLessThan(
          6,
        );
      }
      const end = genomeSegmentPoints(id, 1).at(-1)!,
        next = genomeSegmentPoints((id + 1) % 12, 1)[0];
      expect(end.x).toBeCloseTo(next.x);
      expect(end.y).toBeCloseTo(next.y);
    }
    expect(genomeAssembly(1).complete).toBe(true);
  });
  it('preserves every representative region as grouping changes, without claiming every base is retained', () => {
    for (let f = 0; f <= 15; f++) {
      expect(fusedChromosomes(f)).toHaveLength(16 - f);
      expect(
        fusedChromosomes(f)
          .flatMap((g) => g.blocks)
          .sort((a, b) => a - b),
      ).toEqual(Array.from({ length: 16 }, (_, i) => i));
      expect(continuousFusion(f).blocks).toHaveLength(16);
      expect(foldedFusion(f).blocks.map((b) => b.id)).toEqual(
        Array.from({ length: 16 }, (_, i) => i),
      );
    }
  });
  it('keeps folded material length and continuous routes across phone turns and fusion thresholds', () => {
    for (let f = 0; f < 15; f += 0.017) {
      const a = foldedFusion(f),
        b = foldedFusion(f + 0.001);
      for (let i = 0; i < 16; i++) {
        const ps = a.blocks[i].points;
        const length = ps
          .slice(1)
          .reduce((s, p, j) => s + Math.hypot(p.x - ps[j].x, p.y - ps[j].y), 0);
        expect(length).toBeCloseTo(33, 0);
        expect(
          Math.max(
            ...ps.map((p, j) =>
              Math.hypot(p.x - b.blocks[i].points[j].x, p.y - b.blocks[i].points[j].y),
            ),
          ),
        ).toBeLessThan(0.1);
      }
    }
    const s = foldedFusion(15);
    expect(s.chromosomes).toBe(1);
    for (let i = 0; i < 15; i++)
      expect(s.blocks[i].points.at(-1)).toEqual(s.blocks[i + 1].points[0]);
    expect(s.blocks.filter((b) => b.centromereOpacity > 0)).toHaveLength(1);
  });
});
describe('information is not material conversion or a viability oracle', () => {
  it('retains DNA and machine identities while creating distinct RNA/protein identities', () => {
    const a = expressionState(0),
      b = expressionState(30);
    expect(a.dnaId).toBe(b.dnaId);
    expect(a.machineryIds).toEqual(b.machineryIds);
    expect(new Set([b.dnaId, b.rnaId, b.proteinId]).size).toBe(3);
    expect(b.rnaFraction).toBe(1);
    expect(b.proteinFraction).toBe(1);
    expect(b.predictsViability).toBeNull();
  });
  it('separates missing transcription, missing translation, and preexisting RNA', () => {
    const bare = expressionState(30, { polymerase: false, ribosome: false });
    expect(bare.rnaFraction).toBe(0);
    expect(bare.proteinFraction).toBe(0);
    const noRibo = expressionState(30, { ribosome: false });
    expect(noRibo.rnaFraction).toBe(1);
    expect(noRibo.proteinFraction).toBe(0);
    const previous = expressionState(30, { polymerase: false, preexistingRna: true });
    expect(previous.proteinFraction).toBe(1);
    expect(previous.rnaId).toBe('existing-RNA-1');
  });
  it('does not confuse enzyme with colored product and keeps two released precursors before pigment', () => {
    expect(expressionState(30, { substrate: false }).proteinFraction).toBe(1);
    expect(expressionState(30, { substrate: false }).pigment).toBe(0);
    for (let q = 0; q < 30; q += 0.013) {
      const s = expressionState(q);
      if (s.pigment > 0) expect(s.events.every((e) => e.cut === 1 && e.release === 1)).toBe(true);
      expect(s.events.map((e) => e.intermediateId)).toEqual(['indoxyl-unit-0', 'indoxyl-unit-1']);
      expect(s.predictsViability).toBeNull();
    }
    expect(expressionState(30).pigment).toBe(1);
  });
  it('adds amino acids at the ribosome exit and retains older residues as they emerge', () => {
    const early = proteinGeometry(1 / 16, 0),
      later = proteinGeometry(2 / 16, 0);
    expect(early[0]).toMatchObject({ attached: true, x: 159, y: 119 });
    expect(later[1]).toMatchObject({ attached: true, x: 159, y: 119 });
    expect(later[0].y).toBeGreaterThan(early[0].y);
    expect(early.map((p) => p.id)).toEqual(later.map((p) => p.id));
    for (let f = 0; f < 1; f += 0.0007) {
      const a = proteinGeometry(f, 0),
        b = proteinGeometry(f + 0.00001, 0);
      expect(Math.max(...a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y)))).toBeLessThan(
        0.05,
      );
    }
  });
  it('does not draw a new RNA or protein before its material exists', () => {
    expect(rnaGeometry(0).some((p) => p.visible)).toBe(false);
    expect(proteinGeometry(0, 0).some((p) => p.visible)).toBe(false);
    const a = proteinGeometry(1, 0),
      b = proteinGeometry(1, 1);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    expect(rnaGeometry(1).map((p) => p.id)).toEqual(rnaGeometry(1, true).map((p) => p.id));
  });
});
describe('independent historical evidence', () => {
  it('uses distinct source and activity evidence', () => {
    expect(genomeEvidence.control.markers).toEqual([false, false, false, false]);
    expect(genomeEvidence.synthetic.markers).toEqual([true, true, true, true]);
    expect(genomeEvidence.synthetic.blueColony).toBe(true);
    expect(genomeEvidence.control.blueColony).toBe(false);
  });
  it('matches independently digitized plotted points and never generates a growth result', () => {
    expect(yeastGrowth.map((s) => s.points.length)).toEqual([10, 10]);
    expect(yeastGrowth[0].points[6].od600).toBeCloseTo(3.8736, 4);
    expect(yeastGrowth[1].points[6].od600).toBeCloseTo(2.8197, 4);
    expect(yeastGrowth[1].points[9].od600).toBeCloseTo(5.1797, 4);
    const before = JSON.stringify(yeastGrowth);
    for (let h = 0; h <= 26; h += 0.25) {
      visibleGrowth(h);
      expressionState(h, { ribosome: false });
    }
    expect(JSON.stringify(yeastGrowth)).toBe(before);
    expect(Object.isFrozen(yeastGrowth[0].points[0])).toBe(true);
  });
  it('preserves four IDs and holds the one-chromosome state throughout the growth chapter', () => {
    expect(genomeChapters).toEqual(['assembly', 'recipient', 'fusion', 'function']);
    expect(genomeDurations.reduce((a, b) => a + b, 0)).toBe(156);
    for (let q = 0; q <= 38; q++) expect(genomesDirector(3, q).fusions).toBe(15);
    expect(visibleGrowth(0).flatMap((s) => s.points)).toHaveLength(2);
    expect(visibleGrowth(26).flatMap((s) => s.points)).toHaveLength(20);
  });
  it('handles nonfinite and negative teaching inputs without invented values or invalid geometry', () => {
    for (const q of [NaN, Infinity, -Infinity, -100]) {
      expect(genomeAssembly(q).assembledBlocks).toBe(0);
      expect(expressionState(q).rnaFraction).toBe(0);
      expect(genomesDirector(NaN, q).chapter).toBe(0);
      expect(visibleGrowth(q).flatMap((s) => s.points)).toHaveLength(2);
      expect(JSON.stringify(foldedFusion(q))).not.toContain('null');
    }
  });
  it('waits for spoken references and keeps measurable states continuous in each language', () => {
    for (const locale of ['zh', 'en'] as const) {
      const a = genomeMeasuredAnchors[locale];
      expect(genomesDirector(0, a.markers - 0.01, locale).shot).toBe('colonies');
      expect(genomesDirector(0, a.markers + 0.01, locale).shot).toBe('markers');
      expect(genomesDirector(0, a.assembly, locale).assembly).toBe(0);
      expect(genomesDirector(0, a.ringComplete, locale).assembly).toBe(1);
      expect(genomesDirector(1, a.transcription - 0.01, locale).shot).toBe('cell');
      expect(
        expressionState(genomesDirector(1, a.translation, locale).expressionTime).rnaFraction,
      ).toBe(1);
      expect(
        expressionState(genomesDirector(1, a.reporter, locale).expressionTime).proteinRelease,
      ).toBe(1);
      expect(
        expressionState(genomesDirector(1, locale === 'zh' ? 29.5 : 28.4, locale).expressionTime)
          .pigment,
      ).toBe(1);
      expect(genomesDirector(3, a.revealStart - 0.1, locale).revealHours).toBe(6);
      expect(genomesDirector(3, a.revealEnd, locale).revealHours).toBe(26);
      expect(genomesDirector(3, a.answer - 0.01, locale).shot).toBe('predict');
      expect(genomesDirector(3, a.answer, locale).shot).toBe('answer');
      let previous = 0;
      for (let q = 0; q < a.counterexample - 0.01; q += 0.001) {
        const now = genomesDirector(1, q, locale).expressionTime;
        expect(now).toBeGreaterThanOrEqual(previous);
        expect(now - previous).toBeLessThan(0.01);
        previous = now;
      }
    }
  });
});
