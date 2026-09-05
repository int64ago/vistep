import { describe, expect, it } from 'vitest';
import {
  GENERATOR as G,
  GENERATOR_AREA,
  generatorDefaults,
  generatorState,
  generatorWork,
  generatorLoopPoint,
  generatorConductorPoint,
  generatorRotorLeads,
  generatorContacts,
  generatorExternalCircuit,
  generatorShot,
  rotateGeneratorPoint,
  type GeneratorPoint,
} from './electric-generator';
const cross = (a: GeneratorPoint, b: GeneratorPoint): GeneratorPoint => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: GeneratorPoint, b: GeneratorPoint) => a.reduce((s, v, i) => s + v * b[i], 0);

describe('single-turn generator physics', () => {
  it('matches signed flux and Faraday law by independent time differentiation', () => {
    for (const rpm of [-720, -360, 0, 360, 720])
      for (const angle of [0, 0.3, Math.PI / 2, 2.4, Math.PI, 4.8]) {
        const input = { ...generatorDefaults, rpm, angle },
          s = generatorState(input),
          h = 1e-7;
        const derivative =
          (generatorState({ ...input, angle: angle + s.omega * h }).flux -
            generatorState({ ...input, angle: angle - s.omega * h }).flux) /
          (2 * h);
        expect(s.emf).toBeCloseTo(-derivative, 8);
        expect(s.flux).toBeCloseTo(G.fieldTesla * GENERATOR_AREA * Math.cos(angle), 12);
      }
    expect(generatorState({ ...generatorDefaults, rpm: 0, angle: Math.PI / 2 }).emf).toBe(0);
    expect(generatorState(generatorDefaults).emf).toBe(0);
  });
  it('integrates motional emf and magnetic force on the actual rounded conductor', () => {
    for (const angle of [0.2, 1.1, 2.6, 4.8])
      for (const rpm of [360, -360]) {
        const s = generatorState({ ...generatorDefaults, angle, rpm, connected: true });
        let emf = 0,
          torque = 0;
        for (let i = 0; i < 9600; i++) {
          const p = rotateGeneratorPoint(generatorLoopPoint(i / 9600), angle).map(
            (v) => v * G.metresPerUnit,
          ) as GeneratorPoint;
          const q = rotateGeneratorPoint(generatorLoopPoint((i + 1) / 9600), angle).map(
            (v) => v * G.metresPerUnit,
          ) as GeneratorPoint;
          const dl = q.map((v, j) => v - p[j]) as GeneratorPoint,
            center = q.map((v, j) => (v + p[j]) / 2) as GeneratorPoint;
          const velocity: GeneratorPoint = [-s.omega * center[1], s.omega * center[0], 0];
          emf += dot(cross(velocity, [s.input.field, 0, 0]), dl);
          const force = cross(dl, [s.input.field, 0, 0]).map(
            (v) => v * s.current,
          ) as GeneratorPoint;
          torque += cross(center, force)[2];
        }
        expect(emf).toBeCloseTo(s.emf, 6);
        expect(torque).toBeCloseTo(s.torque, 8);
      }
  });
  it('reverses voltage with rotation and keeps electromagnetic torque braking', () => {
    for (const angle of [0.3, 1.7, 3.8, 5.1]) {
      const a = generatorState({ ...generatorDefaults, angle, connected: true }),
        b = generatorState({ ...a.input, rpm: -a.input.rpm });
      expect(a.emf).toBeCloseTo(-b.emf, 12);
      expect(a.torque).toBeCloseTo(-b.torque, 12);
      expect(a.torque * a.omega).toBeLessThan(0);
      expect(b.torque * b.omega).toBeLessThan(0);
      expect(a.shaftPower).toBeCloseTo(b.shaftPower, 12);
    }
  });
  it('has open-circuit voltage without load current or electromagnetic drag', () => {
    const a = generatorState({ ...generatorDefaults, angle: 1.3 });
    expect(a.voltage).toBe(a.emf);
    expect(a.current).toBe(0);
    expect(a.torque).toBeCloseTo(0, 12);
    expect(a.shaftPower).toBeCloseTo(0, 12);
    const b = generatorState({ ...a.input, connected: true });
    expect(Math.abs(b.voltage)).toBeLessThan(Math.abs(a.voltage));
    expect(b.emf).toBe(a.emf);
    expect(b.current).toBeGreaterThan(0);
  });
  it('conserves instantaneous and integrated energy including internal loss', () => {
    for (const load of [2, 8, 32])
      for (const rpm of [120, 360, -720])
        for (const field of [0, 0.4, 0.8]) {
          const input = { ...generatorDefaults, load, rpm, field, connected: true };
          let loadSum = 0,
            shaftSum = 0;
          const totalAngle = Math.sign(rpm) * Math.PI * 2,
            dt = 60 / Math.abs(rpm) / 600;
          for (let j = 0; j < 600; j++) {
            const s = generatorState({ ...input, angle: ((j + 0.5) / 600) * totalAngle });
            expect(s.shaftPower).toBeCloseTo(s.loadPower + s.internalPower, 12);
            expect(s.emf * s.current).toBeCloseTo(s.shaftPower, 12);
            loadSum += s.loadPower * dt;
            shaftSum += s.shaftPower * dt;
          }
          const w = generatorWork(input, 0, totalAngle);
          expect(w.shaft).toBeCloseTo(w.load + w.internal, 12);
          expect(w.load).toBeCloseTo(loadSum, 10);
          expect(w.shaft).toBeCloseTo(shaftSum, 10);
        }
  });
  it('scales speed, field and loading without hiding invalid inputs', () => {
    const a = generatorState({ ...generatorDefaults, connected: true, angle: 1.2 });
    const twice = generatorState({ ...a.input, rpm: 720 });
    expect(twice.emfPeak).toBeCloseTo(a.emfPeak * 2, 12);
    expect(twice.period).toBeCloseTo(a.period! / 2, 12);
    expect(twice.meanLoadPower).toBeCloseTo(a.meanLoadPower * 4, 12);
    expect(generatorState({ ...a.input, field: 0 }).shaftPower).toBe(0);
    expect(generatorState({ ...a.input, rpm: 0 }).period).toBeNull();
    for (const change of [
      { load: 0 },
      { internal: -1 },
      { angle: NaN },
      { rpm: Infinity },
      { field: NaN },
    ])
      expect(() => generatorState({ ...a.input, ...change })).toThrow(RangeError);
    expect(() => generatorWork(a.input, 1, 0)).toThrow(RangeError);
  });
});

describe('generator conductor, contacts and deterministic direction', () => {
  it('derives its area from a continuous rounded loop and leaves a shaft-clear terminal gap', () => {
    let area = 0;
    expect(generatorLoopPoint(0)).toEqual(generatorLoopPoint(1));
    for (let i = 0; i < 16000; i++) {
      const p = generatorLoopPoint(i / 16000),
        q = generatorLoopPoint((i + 1) / 16000);
      expect(Math.hypot(...p.map((v, j) => v - q[j]))).toBeLessThan(0.004);
      area += ((p[1] * q[2] - q[1] * p[2]) / 2) * G.metresPerUnit ** 2;
    }
    expect(area).toBeCloseTo(GENERATOR_AREA, 8);
    expect(generatorConductorPoint(0)[1]).toBeCloseTo(-G.terminalGap, 12);
    expect(generatorConductorPoint(1)[1]).toBeCloseTo(G.terminalGap, 12);
    expect(G.terminalGap - G.wireRadius).toBeGreaterThan(G.shaftRadius);
  });
  it('keeps rotating lead ends on their own rings and stationary brushes touching both rings', () => {
    const leads = generatorRotorLeads(),
      contacts = generatorContacts();
    for (let j = 0; j < 2; j++) {
      expect(leads[j][0]).toEqual(generatorConductorPoint(j));
      const end = leads[j].at(-1)!;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.19) {
        const p = rotateGeneratorPoint(end, angle);
        expect(Math.hypot(p[0], p[1])).toBeCloseTo(G.ringRadius, 12);
        expect(p[2]).toBe(G.ringZ[j]);
      }
      expect(Math.hypot(...contacts[j].touch.slice(0, 2))).toBeCloseTo(
        G.ringRadius + G.ringTube,
        12,
      );
      expect(contacts[j].center[0] - 0.13).toBe(contacts[j].touch[0]);
    }
    // The B lead passes through the first ring's insulated bore, clear of ring and shaft.
    expect(0.16 + G.wireRadius).toBeLessThan(G.ringRadius - G.ringTube);
    expect(0.16 - G.wireRadius).toBeGreaterThan(G.shaftRadius);
    for (const narrow of [false, true]) {
      const circuit = generatorExternalCircuit(narrow);
      expect(circuit.feed[0]).toEqual(contacts[1].lead);
      expect(circuit.return.at(-1)).toEqual(contacts[0].lead);
      expect(circuit.feed.at(-1)).toEqual(circuit.switchTop);
    }
  });
  it('reconstructs all shots in reverse order and makes the final turn an energy audit', () => {
    const shots = Array.from({ length: 8 * 81 }, (_, i) =>
      generatorShot(Math.floor(i / 81), (i % 81) / 80),
    );
    for (let i = shots.length - 1; i >= 0; i--) {
      expect(generatorShot(Math.floor(i / 81), (i % 81) / 80)).toEqual(shots[i]);
      const s = shots[i].state;
      expect(s.shaftPower).toBeCloseTo(s.loadPower + s.internalPower, 12);
    }
    expect(generatorShot(0, 0).state.emf).toBe(0);
    expect(generatorShot(1, 0.5).state.flux).toBeCloseTo(0, 12);
    expect(generatorShot(5, 0.1).state.current).toBe(0);
    expect(generatorShot(6, 1).state.omega).toBeLessThan(0);
    expect(generatorShot(7, 1).work.shaft).toBeGreaterThan(0);
    expect(generatorShot(7, 1).work.shaft).toBeCloseTo(
      generatorShot(7, 1).work.load + generatorShot(7, 1).work.internal,
      12,
    );
  });
});
