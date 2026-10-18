import { it, expect } from 'vitest';
import {
  respirationBalance,
  carbonDestinations,
  carbonGeometry,
  yeastAssay,
  phosphorylTransfer,
  glycolysisLedger,
  carrierCycle,
  respiratoryMembrane,
  oxygenInventory,
  respirationDirector,
  textbookRespirationObservations,
  terminalOxygenEvent,
  synthaseTurnover,
  gasPathPosition,
  respirationGasPaths,
  trioseOxidation,
} from './bio-respiration';
it('accounts for carbon and distinguishes ATP from gas', () => {
  for (const route of ['aerobic', 'ethanol', 'lactate'] as const) {
    const s = respirationBalance(route);
    expect(s.carbonDioxide + 2 * s.ethanol + 3 * s.lactate).toBe(6);
    expect(s.netGlycolyticATP).toBe(2);
  }
  expect(respirationBalance('lactate').carbonDioxide).toBe(0);
});
it('retains original glucose positions through the ethanol branch', () => {
  const s = carbonDestinations('ethanol');
  expect(s.filter((x) => x.product === 'CO₂').map((x) => x.position)).toEqual([3, 4]);
  for (let i = 0; i <= 100; i++) {
    const a = carbonGeometry('ethanol', i / 100);
    expect([...a.map((x) => x.position)].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  }
  const a = carbonGeometry('pyruvate', 1);
  expect(a.filter((x) => x.group === 1).map((x) => x.position)).toEqual([6, 5, 4]);
});
it('records fixed observations independently of interference controls', () => {
  const before = JSON.stringify(textbookRespirationObservations);
  expect(yeastAssay(0.2, false).ethanolColorValid).toBe(false);
  expect(yeastAssay(1, false).ethanolColorValid).toBe(true);
  expect(yeastAssay(1, true, false).detectedCO2).toBeGreaterThan(
    yeastAssay(1, true, true).detectedCO2,
  );
  expect(JSON.stringify(textbookRespirationObservations)).toBe(before);
});
it('retains the beta bridge oxygen and glucose oxygen during a rigid terminal transfer', () => {
  let last = phosphorylTransfer(0);
  for (let i = 0; i <= 200; i++) {
    const s = phosphorylTransfer(i / 200),
      at = (id: string) => s.atoms.find((a) => a.id === id)!;
    expect(s.atoms.map((x) => x.id)).toEqual(last.atoms.map((x) => x.id));
    expect(at('Obridge')).toMatchObject({ x: 104, y: 65, group: 'ADP-core' });
    expect(at('O6')).toMatchObject({ x: 104, y: 175 });
    for (const n of [1, 2, 3])
      expect(
        Math.hypot(at('Pgamma').x - at('Og' + n).x, at('Pgamma').y - at('Og' + n).y),
      ).toBeCloseTo(n === 2 ? 47 : 45);
    expect(s.bonds.find((x) => x.from === 'Pbeta')!.weight).toBe(1);
    expect(
      Math.hypot(at('Pgamma').x - last.atoms[5].x, at('Pgamma').y - last.atoms[5].y),
    ).toBeLessThan(1);
    last = s;
  }
  expect(last.atoms.find((x) => x.id === 'H6')!.group).toBe('buffer');
  expect(phosphorylTransfer(1, 'Pi').g6p).toBe(0);
});
it('keeps the whole glycolytic phosphorus and adenosine accounts', () => {
  for (const p of [0, 0.3, 0.6, 1]) {
    const s = glycolysisLedger(p);
    expect(s.ATP + s.ADP).toBe(4);
    expect(3 * s.ATP + 2 * s.ADP + s.Pi + s.organicP).toBe(12);
  }
  expect(glycolysisLedger(1).net).toBe(2);
});
it('requires return of the same NAD objects for a later batch', () => {
  const a = carrierCycle(22, false),
    b = carrierCycle(22, true);
  expect(a.completed).toBe(1);
  expect(a.waiting).toBe(true);
  expect(b.completed).toBe(2);
  expect(b.netATP).toBe(4);
  expect(a.carriers.map((c) => c.id)).toEqual(b.carriers.map((c) => c.id));
  expect(a.carriers.every((c) => c.reduced === 1)).toBe(true);
  expect(b.carriers.every((c) => c.reduced === 0)).toBe(true);
});
it('keeps the GAP oxidation product distinct from a fresh substrate batch', () => {
  for (let i = 0; i <= 200; i++) {
    const s = trioseOxidation(i / 50);
    expect(s.freePi + s.boundPhosphate).toBeCloseTo(2);
    expect(s.aldehyde + s.acylPhosphate).toBeCloseTo(1);
    expect(s.carbonPositions.flat().sort()).toEqual([1, 2, 3, 4, 5, 6]);
  }
  expect(trioseOxidation(8, true)).toMatchObject({ batch: 1, progress: 1 });
  expect(trioseOxidation(8, false)).toMatchObject({ batch: 2, progress: 0 });
  expect(trioseOxidation(12, true)).toMatchObject({ batch: 2, progress: 0 });
  expect(trioseOxidation(17, true)).toMatchObject({ batch: 2, progress: 1 });
  expect(trioseOxidation(NaN).progress).toBe(0);
});
it('allows glycolytic ATP with homolactate and no carbon dioxide', () => {
  expect(carrierCycle(22, true, 'lactate').carbonDioxide).toBe(0);
  expect(carrierCycle(22, true, 'lactate').netATP).toBe(4);
});
it('uses an independently checked exponential reservoir after oxygen removal', () => {
  const at = respiratoryMembrane(4, 4),
    later = respiratoryMembrane(6, 4);
  expect(at.pump).toBe(0);
  expect(at.synthase).toBeGreaterThan(0);
  expect(later.gradient).toBeCloseTo(at.gradient * Math.exp(-0.53 * 2), 12);
  expect(later.atpWork).toBeGreaterThan(at.atpWork);
  expect(respiratoryMembrane(100, 4).gradient).toBeLessThan(1e-20);
});
it('does not equate sealed with initially oxygen-free', () => {
  expect(oxygenInventory(0).depleted).toBe(false);
  expect(oxygenInventory(11).depleted).toBe(true);
  expect(oxygenInventory(15).laterGas).toBeGreaterThan(0);
});
it('bounds inputs and reconstructs director states without mutable history', () => {
  for (const x of [NaN, Infinity, -Infinity, -1, 0, 1e5]) {
    expect(Object.values(respirationBalance('ethanol', x)).every(Number.isFinite)).toBe(true);
    expect(phosphorylTransfer(x).atoms.every((a) => Number.isFinite(a.x + a.y))).toBe(true);
    expect(Number.isFinite(respiratoryMembrane(x).gradient)).toBe(true);
  }
  expect(respirationDirector('aerobic', 35).shot).toBe('off');
  expect(respirationDirector('fermentation', 27).shot).toBe('lactate');
});
it('keeps the measured Chinese carrier and oxygen events causal at spoken anchors', () => {
  const nad = (t: number) => carrierCycle(respirationDirector('glycolysis', t, 'zh').time, false);
  expect(nad(14).carriers[0].reduced).toBe(0);
  expect(nad(18.7).carriers[0].reduced).toBe(1);
  expect(nad(24.7).waiting).toBe(true);
  const returned = respirationDirector('fermentation', 11.9, 'zh');
  expect(carrierCycle(returned.time).carriers[0].reduced).toBe(0);
  expect(respirationDirector('fermentation', 17.3, 'zh').shot).toBe('noextra');
  const a = respirationDirector('aerobic', 25.2 - 1e-5, 'zh'),
    b = respirationDirector('aerobic', 25.2 + 1e-5, 'zh');
  const before = respiratoryMembrane(a.time),
    after = respiratoryMembrane(b.time, b.cut);
  expect(before.pump).toBeGreaterThan(0);
  expect(after.pump).toBe(0);
  expect(after.synthase).toBeGreaterThan(0);
  expect(Math.abs(before.gradient - after.gradient)).toBeLessThan(1e-4);
  expect(respirationDirector('atp', 22, 'zh').shot).toBe('donor');
  expect(respirationDirector('atp', 30, 'zh').shot).toBe('received');
});
it('aligns the re-recorded English letter-spelled ATP voice independently', () => {
  expect(respirationDirector('atp', 6.8, 'en').shot).toBe('bind');
  expect(respirationDirector('atp', 21.5, 'en').progress).toBe(1);
  expect(respirationDirector('atp', 30, 'en').shot).toBe('donor');
  expect(respirationDirector('atp', 37, 'en').shot).toBe('received');
  expect(respirationDirector('glycolysis', 15.5, 'en').shot).toBe('ledger');
  expect(
    carrierCycle(respirationDirector('glycolysis', 22.5, 'en').time, false).carriers[0].reduced,
  ).toBe(1);
  expect(carrierCycle(respirationDirector('glycolysis', 28, 'en').time, false).waiting).toBe(true);
  const before = respirationDirector('aerobic', 30.9, 'en'),
    after = respirationDirector('aerobic', 31.1, 'en');
  expect(before.shot).toBe('gradient');
  expect(after.shot).toBe('off');
  expect(respiratoryMembrane(after.time, after.cut).synthase).toBeGreaterThan(0);
  expect(respirationDirector('fermentation', 22.5, 'en').shot).toBe('noextra');
  expect(respirationDirector('fermentation', 23.5, 'en').shot).toBe('lactate');
});

it('keeps oxygen and proton identities through the bounded terminal net account', () => {
  let prev = terminalOxygenEvent(0);
  for (let i = 0; i <= 200; i++) {
    const s = terminalOxygenEvent(i / 10);
    expect(s.atoms.map((a) => a.id)).toEqual(prev.atoms.map((a) => a.id));
    expect(s.atoms.filter((a) => a.element === 'O')).toHaveLength(2);
    expect(s.atoms.filter((a) => a.element === 'H')).toHaveLength(4);
    expect(s.electrons).toBe(4);
    prev = s;
  }
  expect(terminalOxygenEvent(10).progress).toBe(1);
});
it('keeps three phosphate identities through each selected synthase turnover', () => {
  for (const t of [0, 1, 3, 7, 15, 30]) {
    const s = synthaseTurnover(t, 12);
    expect(s.phosphates).toHaveLength(3);
    expect(new Set(s.phosphates.map((p) => p.id)).size).toBe(3);
  }
  const a = respiratoryMembrane(22 - 1e-6),
    b = respiratoryMembrane(22 + 1e-6, 22);
  expect(Math.abs(a.gradient - b.gradient)).toBeLessThan(2e-6);
});
it('derives gas tracer endpoints from the rendered inlet and outlet path', () => {
  expect(gasPathPosition(respirationGasPaths.transfer, 0)).toEqual({ x: 78, y: 70 });
  expect(gasPathPosition(respirationGasPaths.transfer, 1)).toEqual({ x: 220, y: 155 });
  for (let i = 0; i <= 100; i++) {
    const p = gasPathPosition(respirationGasPaths.transfer, i / 100);
    expect(p.x === 78 || p.y === 17 || p.x === 220).toBe(true);
  }
});
it('keeps free Pi separate from the ATP donor graph', () => {
  const s = phosphorylTransfer(1, 'Pi');
  expect(s.atoms.filter((a) => a.group === 'free-phosphate')).toHaveLength(5);
  expect(s.atoms.some((a) => a.id === 'Pbeta')).toBe(false);
  expect(s.eligible).toBe(false);
  expect(s.bonds.some((b) => b.from === 'O6' && b.to.includes('P'))).toBe(false);
});
