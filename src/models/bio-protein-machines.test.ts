import { expect, it } from 'vitest';
import {
  insulinResidues,
  insulinGeometry,
  insulinDisulfides,
  insulinSidechains,
  disulfideEdges,
  peptideAccounting,
  peptideNet,
  insulinPeptideEdges,
  sequenceStrip,
  sequenceCandidate,
  connectivityState,
  insulinFunctionReport,
  proteinDirector,
  proteinProjection,
} from './bio-protein-machines';
it('counts adjacency independently across two nonempty open chains', () => {
  const edges = insulinPeptideEdges();
  expect(insulinResidues.filter((a) => a.chain === 'A')).toHaveLength(21);
  expect(insulinResidues.filter((a) => a.chain === 'B')).toHaveLength(30);
  expect(edges.filter((e) => e.chain === 'A')).toHaveLength(20);
  expect(edges.filter((e) => e.chain === 'B')).toHaveLength(29);
  expect(edges.every((e) => e.from[0] === e.to[0])).toBe(true);
  expect(peptideAccounting(51, 2)).toEqual({
    residues: 51,
    chains: 2,
    peptideBonds: 49,
    water: 49,
  });
  expect(peptideAccounting(5, 1).peptideBonds).toBe(4);
});
it('normalizes invalid domains to nonempty chains without claiming a cyclic chain', () => {
  for (const [n, c] of [
    [0, 0],
    [51, 0],
    [51, 100],
    [51, NaN],
    [NaN, 1],
    [-4, -8],
    [Infinity, 2],
    [5.8, 1.9],
  ]) {
    const a = peptideAccounting(n, c);
    expect(Object.values(a).every(Number.isFinite)).toBe(true);
    expect(a.peptideBonds).toBe(a.residues - a.chains);
    if (a.residues > 0) expect(a.chains).toBeGreaterThanOrEqual(1);
    else expect(a.chains).toBe(0);
  }
});
it('tracks all seven explicit atoms, including retained nitrogen hydrogen, through the net composition', () => {
  const initial = peptideNet(0),
    last = peptideNet(1);
  for (let i = 0; i <= 100; i++) {
    const s = peptideNet(i / 100);
    expect(s.atoms.map((a) => a.id)).toEqual(initial.atoms.map((a) => a.id));
    expect(s.atoms.map((a) => a.element).sort()).toEqual(
      ['C', 'N', 'O', 'O', 'H', 'H', 'H'].sort(),
    );
    expect(s.atoms.every((a) => Number.isFinite(a.x) && Number.isFinite(a.y))).toBe(true);
  }
  const valence = (id: string) =>
    last.bonds.reduce((n, b) => n + (b.from === id || b.to === id ? b.order * b.opacity : 0), 0);
  expect(
    last.atoms
      .filter((a) => a.water)
      .map((a) => a.element)
      .sort(),
  ).toEqual(['H', 'H', 'O']);
  expect(valence('carboxyl-O')).toBe(2);
  expect(valence('amino-H')).toBe(1);
  expect(valence('retained-H')).toBe(1);
  expect(valence('amino-N')).toBe(2); // + one collapsed carbon substituent
  expect(last.newPeptideBonds).toBe(1);
  expect(last.netWater).toBe(1);
  for (const p of [NaN, -5, Infinity, 5])
    expect(peptideNet(p).atoms.every((a) => Number.isFinite(a.x))).toBe(true);
});
it('uses sulfur atoms from the measured side chains, not C-alpha endpoints', () => {
  expect(new Set(insulinDisulfides.flat()).size).toBe(6);
  const lengths = [2.0304782687829968, 2.026464162031986, 2.031429545910959];
  for (const angle of [-180, -30, 0, 79, 180]) {
    const ss = disulfideEdges(angle);
    ss.forEach((e, i) => {
      expect(e.from.atom).toBe('SG');
      expect(e.to.atom).toBe('SG');
      expect(Math.hypot(e.from.x - e.to.x, e.from.y - e.to.y, e.from.z - e.to.z)).toBeCloseTo(
        lengths[i],
        10,
      );
    });
  }
  const s = insulinSidechains(0);
  for (const id of insulinDisulfides.flat())
    expect(s.filter((a) => a.id.startsWith(id + '-')).map((a) => a.atom)).toEqual([
      'CA',
      'CB',
      'SG',
    ]);
});
it('preserves all 51 native residue identities and distances through rotation', () => {
  const original = insulinGeometry(1, 0);
  for (const angle of [-180, 37, 90, 180, NaN, 1e308]) {
    const p = insulinGeometry(1, angle);
    expect(new Set(p.map((a) => a.id)).size).toBe(51);
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        const d = (a: typeof p) => Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y, a[i].z - a[j].z);
        expect(d(p)).toBeCloseTo(d(original), 9);
      }
  }
});
it('permutes two distinct non-cysteine IDs while preserving the residue multiset and count', () => {
  const start = sequenceStrip('A', 0),
    end = sequenceStrip('A', 1);
  expect(start.find((a) => a.id === 'A2')?.name).toBe('ILE');
  expect(start.find((a) => a.id === 'A3')?.name).toBe('VAL');
  expect(end.find((a) => a.id === 'A2')?.slot).toBe(3);
  expect(end.find((a) => a.id === 'A3')?.slot).toBe(2);
  expect(end.map((a) => a.id + ':' + a.name)).toEqual(start.map((a) => a.id + ':' + a.name));
  for (const swapped of [true, false])
    expect(sequenceCandidate(swapped)).toMatchObject({
      residueCount: 51,
      peptideBonds: 49,
      activity: null,
    });
});
it('removes only disulfide constraints without changing peptide bonds or inferring function', () => {
  expect(connectivityState(false)).toEqual({
    residues: 51,
    chains: 2,
    peptideBonds: 49,
    disulfides: 3,
    activity: null,
  });
  expect(connectivityState(true)).toEqual({
    residues: 51,
    chains: 2,
    peptideBonds: 49,
    disulfides: 0,
    activity: null,
  });
});
it('keeps the qualitative source result fixed and numerically unquantified under all model interventions', () => {
  const before = JSON.stringify(insulinFunctionReport);
  for (let i = 0; i < 100; i++) {
    insulinGeometry(i / 100, i * 10);
    sequenceCandidate(i % 2 === 0);
    connectivityState(i % 2 === 0);
    proteinDirector(i % 4, i);
  }
  expect(JSON.stringify(insulinFunctionReport)).toBe(before);
  expect(insulinFunctionReport.numericalValues).toBeNull();
  expect(Object.isFrozen(insulinFunctionReport.synthetic)).toBe(true);
  expect(insulinFunctionReport.reference.id).not.toBe(insulinFunctionReport.synthetic.id);
});
it('reconstructs decisive causal shots on seek with stable finite boundary states', () => {
  expect(proteinDirector(0, 14)).toMatchObject({ shot: 'net', net: 1 });
  expect(proteinDirector(0, 32)).toMatchObject({ shot: 'five', joins: 1 });
  expect(proteinDirector(2, 12).shot).toBe('sulfur');
  expect(proteinDirector(2, 32).removed).toBe(true);
  expect(proteinDirector(3, 28)).toMatchObject({ candidate: true, reveal: 2 });
  for (let c = 0; c < 4; c++) expect(proteinDirector(c, NaN)).toEqual(proteinDirector(c, 0));
});

it('moves the camera continuously from true sulfur detail to the unchanged native coordinates', () => {
  const a = proteinProjection(30, 0),
    b = proteinProjection(30, 1);
  expect(a.scale).toBeGreaterThan(b.scale);
  for (let i = 0; i <= 100; i++) {
    const c = proteinProjection(30, i / 100);
    expect(Object.values(c).every(Number.isFinite)).toBe(true);
    if (i > 0)
      expect(Math.abs(c.scale - proteinProjection(30, (i - 1) / 100).scale)).toBeLessThan(0.5);
  }
  expect(proteinProjection(NaN, NaN)).toEqual(proteinProjection(0, 0));
});

it('keeps the retained O-H group attached and sulfur labels separated in the selected projection', () => {
  for (let i = 0; i <= 100; i++) {
    const a = peptideNet(i / 100).atoms,
      o = a.find((a) => a.id === 'carboxyl-O')!,
      h = a.find((a) => a.id === 'carboxyl-H')!;
    expect(Math.hypot(o.x - h.x, o.y - h.y)).toBeCloseTo(Math.sqrt(1800), 10);
  }
  const a = insulinSidechains(-61).filter((a) => a.id.startsWith('A7-') || a.id.startsWith('B7-')),
    c = proteinProjection(-61, 0);
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++)
      expect(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y) * c.scale).toBeGreaterThan(52);
});

it('aligns recorded object references while preserving the same causal states across languages', () => {
  // Word times include a 0.45 s cue lead. Identification precedes net atom movement.
  expect(proteinDirector(0, 9.5, 'zh').net).toBe(0);
  expect(proteinDirector(0, 11.5, 'en').net).toBe(0);
  for (const locale of ['zh', 'en'] as const) {
    expect(proteinDirector(0, 18, locale)).toMatchObject({ shot: 'net', net: 1 });
    expect(proteinDirector(0, 32, locale)).toMatchObject({ shot: 'five', joins: 1 });
    expect(proteinDirector(1, 7, locale).joins).toBeCloseTo(20 / 49);
    expect(proteinDirector(1, 11, locale).joins).toBe(1);
    expect(proteinDirector(1, 16, locale).swap).toBe(0);
    expect(proteinDirector(1, 20, locale).swap).toBe(1);
    expect(proteinDirector(2, 6.5, locale)).toMatchObject({ shot: 'topology', selected: 0 });
    expect(proteinDirector(2, 10, locale)).toMatchObject({ shot: 'topology', selected: 2 });
    expect(proteinDirector(2, 15, locale)).toMatchObject({ shot: 'sulfur', removed: false });
    expect(proteinDirector(2, 27, locale)).toMatchObject({
      shot: 'native',
      fold: 1,
      removed: false,
    });
    expect(proteinDirector(2, 33, locale).removed).toBe(true);
    expect(proteinDirector(3, 10.5, locale).reveal).toBe(0);
    expect(proteinDirector(3, 14, locale)).toMatchObject({ reveal: 2, candidate: false });
    expect(proteinDirector(3, 41, locale)).toMatchObject({ reveal: 2, candidate: true });
  }
  expect(proteinDirector(2, 30, 'zh').removed).toBe(false);
  expect(proteinDirector(2, 30, 'en').removed).toBe(true);
  expect(proteinDirector(3, 27, 'zh').candidate).toBe(true);
  expect(proteinDirector(3, 27, 'en').candidate).toBe(false);
});
