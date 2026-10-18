import { expect, it } from 'vitest';
import {
  dnaResidues,
  dnaSequence,
  complement,
  pairedSequence,
  basePair,
  dnaCounts,
  verifyDuplex,
  backboneSegments,
  pairHydrogenBonds,
  scatteringIntensity,
  projectDna,
} from './bio-dna-structure';
import diffraction from './bio-dna-diffraction.json';
it('retains the real 12-bp duplex, opposite chemical directions and valid phosphodiester links', () => {
  expect(dnaResidues).toHaveLength(24);
  expect(dnaSequence).toBe('CGCGAATTCGCG');
  for (let i = 0; i < 12; i++)
    expect(dnaResidues[23 - i].base).toBe(complement(dnaResidues[i].base));
  const bridges = backboneSegments().filter((b) => b.id.endsWith('bridge'));
  expect(bridges).toHaveLength(22);
  expect(bridges.filter((b) => b.chain === 'A')).toHaveLength(11);
  expect(bridges.filter((b) => b.chain === 'B')).toHaveLength(11);
  for (const b of bridges) {
    const origin = dnaResidues.find((r) => b.id === r.id + '-bridge')!;
    const next = dnaResidues.find((r) => r.chain === origin.chain && r.index === origin.index + 1)!;
    expect(b.b).toEqual(next.atoms.P);
    const distance = Math.hypot(...b.a.map((v, i) => v - b.b[i]));
    expect(distance).toBeGreaterThan(1.3);
    expect(distance).toBeLessThan(1.9);
  }
  for (let i = 0; i < 12; i++)
    for (const b of pairHydrogenBonds(i)) {
      expect(b.distance).toBeGreaterThan(2.4);
      expect(b.distance).toBeLessThan(3.5);
    }
  const a = projectDna(dnaResidues[0].atoms["C1'"], 0),
    aEnd = projectDna(dnaResidues[11].atoms["C1'"], 0),
    b = projectDna(dnaResidues[12].atoms["C1'"], 0),
    bEnd = projectDna(dnaResidues[23].atoms["C1'"], 0);
  expect((aEnd.y - a.y) * (bEnd.y - b.y)).toBeLessThan(0);
});
it('distinguishes matching composition from correct complementarity and orientation', () => {
  expect(pairedSequence('GATACC')).toBe('CTATGG');
  expect(pairedSequence('GATACC').split('').reverse().join('')).toBe('GGTATC');
  expect(basePair('A', 'T').hydrogenBonds).toBe(2);
  expect(basePair('G', 'C').hydrogenBonds).toBe(3);
  expect(basePair('A', 'G').valid).toBe(false);
  expect(dnaCounts('ATGC')).toEqual(dnaCounts('TAGC'));
  expect(verifyDuplex('ATGC', 'TAGC', true).valid).toBe(false);
  expect(verifyDuplex('ATGC', 'TACG', false).valid).toBe(false);
  expect(verifyDuplex('ATGC', 'TACG', true).valid).toBe(true);
});
it('reproduces cached diffraction from the same finite-scatterer model and preserves inversion symmetry', () => {
  expect(scatteringIntensity(0, 0)).toBeCloseTo(1);
  const n = diffraction.size;
  for (const pattern of diffraction.patterns)
    for (const [x, y] of [
      [12, 25],
      [55, 61],
      [36, 36],
    ]) {
      const qx = (x / (n - 1) - 0.5) * 0.66,
        qz = (y / (n - 1) - 0.5) * 0.66;
      const exact = scatteringIntensity(qx, qz, pattern.twist);
      expect(pattern.intensity[y * n + x]).toBeCloseTo(exact, 7);
      expect(scatteringIntensity(-qx, -qz, pattern.twist)).toBeCloseTo(exact, 10);
    }
  expect(scatteringIntensity(0.06, 0.03, 0)).not.toBeCloseTo(
    scatteringIntensity(0.06, 0.03, 36),
    5,
  );
});

import {
  canonicalContactGraph,
  compositionState,
  helixConstraint,
  historicalDnaConstraints,
  idealDuplex,
  retainedStrandPrediction,
  dnaDirector,
  dnaChapters,
  nucleotideTrace,
  nucleotideTraceNodes,
} from './bio-dna-structure';
it('derives canonical contacts from neutral N/O donor–acceptor roles, not ring count', () => {
  const at = canonicalContactGraph('A', 'T'),
    gc = canonicalContactGraph('G', 'C'),
    ac = canonicalContactGraph('A', 'C'),
    gt = canonicalContactGraph('G', 'T');
  expect(at.contacts.filter((c) => c.compatible).map((c) => [c.left.atom, c.right.atom])).toEqual([
    ['N6', 'O4'],
    ['N1', 'N3'],
  ]);
  expect(gc.contacts.filter((c) => c.compatible).map((c) => [c.left.atom, c.right.atom])).toEqual([
    ['O6', 'N4'],
    ['N1', 'N3'],
    ['N2', 'O2'],
  ]);
  expect([at.standard, gc.standard]).toEqual([true, true]);
  expect(ac.rings).toEqual(at.rings);
  expect(ac.contacts.slice(0, 2).map((c) => [c.left.role, c.right.role])).toEqual([
    ['donor', 'donor'],
    ['acceptor', 'acceptor'],
  ]);
  expect(ac.contactCount).toBe(0);
  expect(ac.standard).toBe(false);
  // A fixed canonical alignment does not model the displaced G–T wobble geometry.
  expect(gt.contactCount).toBe(1);
  expect(gt.standard).toBe(false);
  expect(canonicalContactGraph('A', 'G').contactCount).toBe(2);
  expect(canonicalContactGraph('A', 'G').standard).toBe(false);
});
it('keeps each H attached to its original donor at every successful contact', () => {
  for (const a of ['A', 'G', 'T', 'C'] as const)
    for (const b of ['A', 'G', 'T', 'C'] as const) {
      const g = canonicalContactGraph(a, b);
      for (const s of g.sites.flat()) {
        if (s.hydrogen) {
          expect(s.role).toBe('donor');
          expect(s.element).toBe('N');
          expect(s.hydrogen.attachedTo).toBe(s.id);
          expect(Math.hypot(s.hydrogen.x - s.x, s.hydrogen.y - s.y)).toBe(26);
        }
      }
      for (const c of g.contacts.filter((c) => c.compatible)) {
        expect(c.from).not.toBeNull();
        expect(c.to?.role).toBe('acceptor');
        expect(c.from?.attachedTo).toBe(c.donorAtomId);
      }
    }
});
it('permutes six stable identities continuously without changing the counts', () => {
  const initial = compositionState(0),
    last = compositionState(1);
  expect(last.finalBottom).toBe('TGTACG');
  expect(last.mismatchSlots).toEqual([1, 2, 3, 4]);
  for (let i = 0; i <= 1000; i++) {
    const s = compositionState(i / 1000);
    expect(s.counts).toEqual({ A: 3, T: 3, G: 3, C: 3 });
    expect(s.tokens.map((t) => [t.id, t.base])).toEqual(initial.tokens.map((t) => [t.id, t.base]));
    for (let a = 0; a < 6; a++)
      for (let b = a + 1; b < 6; b++) {
        const dx = 49 * Math.abs(s.tokens[a].slot - s.tokens[b].slot);
        const dy = Math.abs(s.tokens[a].travel - s.tokens[b].travel);
        expect(dx >= 43 - 1e-8 || dy >= 53 - 1e-8).toBe(true);
      }
    if (i) {
      const prev = compositionState((i - 1) / 1000);
      expect(
        Math.max(...s.tokens.map((t, j) => Math.abs(t.slot - prev.tokens[j].slot))),
      ).toBeLessThan(0.061);
    }
  }
  expect(compositionState(1, true).counts).toEqual({ A: 2, T: 1, G: 1, C: 2 });
});
it('holds reference evidence fixed while candidate twist changes the repeat', () => {
  const a = helixConstraint(36),
    b = helixConstraint(24);
  expect(a.repeatNm).toBeCloseTo(3.4);
  expect(b.repeatNm).toBeCloseTo(5.1);
  expect(a.agreesWithRepeat).toBe(true);
  expect(b.agreesWithRepeat).toBe(false);
  expect(a.reference).toBe(b.reference);
  expect(Object.isFrozen(historicalDnaConstraints)).toBe(true);
  expect(helixConstraint(0).repeatNm).toBeNull();
  expect(helixConstraint(NaN).repeatNm).toBeCloseTo(3.4);
});
it('keeps pair IDs, axial rise and finite complete geometry through ideal assembly', () => {
  const initial = idealDuplex(0);
  for (const a of [0, 0.01, 0.25, 0.5, 0.99, 1, NaN]) {
    const frame = idealDuplex(a);
    expect(frame).toHaveLength(12);
    expect(frame.map((p) => p.id)).toEqual(initial.map((p) => p.id));
    for (let i = 0; i < 12; i++) {
      expect(frame[i].partner).toBe(complement(frame[i].base));
      for (const s of [frame[i].first, frame[i].second])
        expect(Object.values(s).every(Number.isFinite)).toBe(true);
      if (i) expect(frame[i].first.y - frame[i - 1].first.y).toBe(17);
    }
  }
});
it('predicts measured partners without replacing the retained strand or reversing its identity order', () => {
  const hidden = retainedStrandPrediction(0, 0),
    shown = retainedStrandPrediction(0, 6);
  expect(hidden.every((p) => !p.revealed)).toBe(true);
  expect(shown.every((p) => p.revealed)).toBe(true);
  expect(hidden.map((p) => p.id)).toEqual(dnaResidues.slice(0, 6).map((p) => p.id));
  for (const u of shown) {
    expect(u.partner).toBe(complement(u.base));
    expect(u.partnerId).toBe(dnaResidues[23 - u.index].id);
    expect(u.firstDirection).not.toBe(u.partnerDirection);
  }
});
it('traces the same contiguous intrachain O3–P–O5 path, including boundaries', () => {
  expect(nucleotideTrace(0).x).toBe(nucleotideTraceNodes[0].x);
  expect(nucleotideTrace(1).x).toBe(nucleotideTraceNodes.at(-1)!.x);
  const nodes = nucleotideTraceNodes.map((p) => p.id);
  for (let i = 0; i <= 1000; i++) {
    const p = nucleotideTrace(i / 100);
    expect(
      nodes.indexOf(p.toId as (typeof nodes)[number]) -
        nodes.indexOf(p.fromId as (typeof nodes)[number]),
    ).toBe(1);
    if (i) {
      const q = nucleotideTrace((i - 1) / 100);
      expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThan(1.3);
    }
  }
  for (const p of [NaN, Infinity, -1, 2]) expect(Number.isFinite(nucleotideTrace(p).x)).toBe(true);
});
it('closes the history window inside geometry and reconstructs every paused causal shot', () => {
  expect(dnaDirector(2, 17).shot).toBe('contact-ac');
  expect(dnaDirector(2, 25).pair).toEqual(['G', 'C']);
  expect(dnaDirector(2, 35).shot).toBe('whole-ideal');
  expect(dnaDirector(2, 42).shot).toBe('predict-partner');
  expect(dnaDirector(2, 45).predictionReveal).toBe(1);
  expect(dnaDirector(5, 20).predictionReveal).toBe(0);
  expect(dnaDirector(5, 30).predictionReveal).toBe(6);
  for (const c of [0, 1, 2, 3, 4, 5, NaN, Infinity])
    for (const t of [0, 10, 1000, NaN, -1]) {
      const d = dnaDirector(c, t);
      expect(Number.isFinite(d.t)).toBe(true);
      expect(dnaChapters.includes(d.mode)).toBe(true);
    }
});

it('aligns semantic cuts to both measured recordings without changing the shared chapter clock', () => {
  expect(dnaDirector(0, 5.8).shot).toBe('fixed-evidence');
  expect(dnaDirector(0, 8).pattern).toBe(0);
  expect(dnaDirector(0, 12).pattern).toBe(1);
  expect(dnaDirector(0, 15).pattern).toBe(2);
  expect(dnaDirector(1, 19, 'en').single).toBe(true);
  expect(dnaDirector(1, 19, 'zh').single).toBe(false);
  expect(dnaDirector(2, 16.7, 'zh').pair).toEqual(['A', 'C']);
  expect(dnaDirector(2, 16.7, 'en').pair).toEqual(['A', 'T']);
  expect(dnaDirector(2, 26, 'zh').pair).toEqual(['G', 'C']);
  expect(dnaDirector(2, 26, 'en').pair).toEqual(['A', 'T']);
  expect(dnaDirector(2, 33, 'zh').assembly).toBe(1);
  expect(dnaDirector(2, 33, 'en').assembly).toBe(1);
  expect(dnaDirector(3, 19, 'en').shot).toBe('backbone-versus-pair');
  expect(dnaDirector(3, 19, 'zh').shot).toBe('backbone-trace');
  const phosphate = nucleotideTrace(dnaDirector(3, 13.75).trace);
  expect(phosphate.x).toBeCloseTo(55, 8);
  expect(phosphate.y).toBeCloseTo(139, 8);
  expect(dnaDirector(4, 9).parallel).toBe(true);
  expect(dnaDirector(4, 12).parallel).toBe(false);
  expect(dnaDirector(5, 8).molecularRotation).toBe(0.3);
  expect(dnaDirector(5, 20).shot).toBe('measured-1bna');
  expect(dnaDirector(5, 22).shot).toBe('retained-strand');
  expect(dnaDirector(5, 24).predictionReveal).toBe(0);
  expect(dnaDirector(5, 30).predictionReveal).toBe(6);
});
