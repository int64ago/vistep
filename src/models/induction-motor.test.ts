import { describe, it, expect } from 'vitest';
import {
  MOTOR,
  motorPhases,
  motorField,
  motorCircuit,
  motorBreakdownSlip,
  motorBreakdownTorque,
  motorSteadySlip,
  motorStartup,
  motorSyncOmega,
  motorSample,
  motorShot,
  motorBarPoint,
  motorRingPoint,
  motorWindingPoint,
  motorWindingLead,
  motorTerminal,
  motorStatorBore,
} from './induction-motor';
describe('induction motor: coupled circuit, field and cage', () => {
  it('balanced phase currents make a constant-magnitude field with the chosen sequence', () => {
    for (const direction of [1, -1] as const)
      for (let k = 0; k < 120; k++) {
        const a = (k * Math.PI) / 60,
          currents = motorPhases({ re: 3, im: -4 }, a, direction),
          field = motorField(currents);
        expect(currents.reduce((s, i) => s + i, 0)).toBeCloseTo(0, 11);
        expect(Math.hypot(field.x, field.y)).toBeCloseTo(1.5 * Math.SQRT2 * 5, 11);
        expect(field.x).toBeCloseTo(1.5 * Math.SQRT2 * (3 * Math.cos(a) + 4 * Math.sin(a)), 11);
        expect(field.y).toBeCloseTo(
          direction * 1.5 * Math.SQRT2 * (3 * Math.sin(a) - 4 * Math.cos(a)),
          11,
        );
      }
  });
  it('has finite synchronous and locked-rotor limits, with magnetization at s=0', () => {
    const zero = motorCircuit(0),
      locked = motorCircuit(1);
    expect(zero.rotorCurrent).toBe(0);
    expect(zero.torque).toBe(0);
    expect(zero.rotorFrequency).toBe(0);
    expect(zero.statorCurrent).toBeGreaterThan(0);
    expect(zero.rpm).toBeCloseTo(3000);
    expect(locked.converted).toBe(0);
    expect(locked.rotorCopper).toBeCloseTo(locked.gapPower, 10);
    expect(locked.rotorFrequency).toBe(50);
    expect(locked.torque).toBeGreaterThan(1);
    expect(motorCircuit(1e-9).rotorCurrent).toBeLessThan(1e-5);
  });
  it('closes real input, gap, copper and mechanical power independently across the motoring domain', () => {
    for (let k = 0; k <= 1000; k++)
      for (const direction of [1, -1] as const) {
        const s = motorCircuit(k / 1000, direction);
        expect(s.inputPower).toBeCloseTo(s.statorCopper + s.rotorCopper + s.converted, 8);
        expect(s.rotorCopper).toBeCloseTo(s.slip * s.gapPower, 8);
        expect(s.torque * s.omega).toBeCloseTo(s.converted, 8);
        expect(s.efficiency).toBeGreaterThanOrEqual(0);
        expect(s.efficiency).toBeLessThan(1);
      }
  });
  it('matches a separate Thevenin torque expression rather than a fitted speed curve', () => {
    const { r1, x1, xm, r2, x2, voltage } = MOTOR;
    const den = r1 * r1 + (x1 + xm) ** 2;
    const rth = (xm * xm * r1) / den,
      xth = (xm * (r1 * r1 + x1 * (x1 + xm))) / den;
    const vth2 = (voltage * voltage * xm * xm) / den;
    for (const slip of [0.0001, 0.01, 0.04, 0.1, 0.3, 0.7, 1]) {
      const torque =
        (3 * vth2 * (r2 / slip)) / (motorSyncOmega * ((rth + r2 / slip) ** 2 + (xth + x2) ** 2));
      expect(motorCircuit(slip).torque).toBeCloseTo(torque, 10);
    }
  });
  it('selects stable low-slip load roots and rejects demands beyond breakdown', () => {
    let previous = 0;
    for (const load of [1, 2, 4, 6]) {
      const slip = motorSteadySlip(load)!;
      expect(slip).toBeGreaterThan(previous);
      expect(slip).toBeLessThan(motorBreakdownSlip);
      expect(motorCircuit(slip).torque).toBeCloseTo(load, 10);
      expect(motorCircuit(slip + 0.00001).torque).toBeGreaterThan(
        motorCircuit(slip - 0.00001).torque,
      );
      previous = slip;
    }
    expect(motorSteadySlip(motorBreakdownTorque)).toBeNull();
    expect(motorSteadySlip(-1)).toBeNull();
    expect(motorCircuit(motorBreakdownSlip - 0.01).torque).toBeLessThan(motorBreakdownTorque);
    expect(motorCircuit(motorBreakdownSlip + 0.01).torque).toBeLessThan(motorBreakdownTorque);
  });
  it('enforces KCL around both closed end rings and reverses bar polarity with phase order', () => {
    for (const direction of [1, -1] as const)
      for (const slip of [0, 0.025, 0.2, 1]) {
        const s = motorSample(slip, 0.76, 1.21, direction),
          c = s.cage;
        expect(c.bars.reduce((sum, i) => sum + i, 0)).toBeCloseTo(0, 12);
        for (let k = 0; k < MOTOR.bars; k++) {
          const prev = (k + MOTOR.bars - 1) % MOTOR.bars;
          expect(c.front[k] - c.front[prev]).toBeCloseTo(c.bars[k], 12);
          expect(c.back[k] - c.back[prev]).toBeCloseTo(-c.bars[k], 12);
        }
        const torqueProxy = c.bars.reduce(
          (sum, i, k) =>
            sum + i * Math.cos((k * 2 * Math.PI) / MOTOR.bars + s.rotorAngle - s.fieldAngle),
          0,
        );
        expect(torqueProxy * direction).toBeGreaterThanOrEqual(0);
      }
  });
  it('makes every bar meet both rings and gives each continuous winding two wired terminals', () => {
    for (let k = 0; k < MOTOR.bars; k++)
      for (const side of [-1, 1])
        motorBarPoint(k, side * MOTOR.ringZ).forEach((v, i) =>
          expect(v).toBeCloseTo(motorRingPoint(k / MOTOR.bars, side * MOTOR.ringZ)[i], 13),
        );
    for (let phase = 0; phase < 3; phase++) {
      expect(motorWindingPoint(phase, 0)).not.toEqual(motorWindingPoint(phase, 1));
      for (const end of [0, 1]) {
        expect(motorWindingLead(phase, end)[0]).toEqual(motorWindingPoint(phase, end));
        expect(motorWindingLead(phase, end).at(-1)).toEqual(motorTerminal(phase, end));
      }
      let prev = motorWindingPoint(phase, 0);
      for (let k = 1; k <= 6000; k++) {
        const p = motorWindingPoint(phase, k / 6000);
        expect(Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2])).toBeLessThan(0.014);
        expect(Math.hypot(p[0], p[1])).toBeGreaterThan(MOTOR.cageRadius + 0.2);
        prev = p;
      }
    }
  });
  it('startup obeys inertia and integrated work, converging to the stable loaded speed', () => {
    let mechanicalWork = 0,
      loadWork = 0,
      prev = motorStartup(0);
    for (let k = 1; k <= 1000; k++) {
      const s = motorStartup(k * 0.002);
      expect(s.omega).toBeGreaterThanOrEqual(prev.omega - 1e-10);
      expect(s.omega).toBeLessThan(motorSyncOmega);
      expect(s.state.converted - s.loadPower).toBeCloseTo(
        MOTOR.inertia * s.omega * s.acceleration,
        8,
      );
      mechanicalWork += (s.state.converted + prev.state.converted) * 0.001;
      loadWork += (s.loadPower + prev.loadPower) * 0.001;
      prev = s;
    }
    expect(
      Math.abs(mechanicalWork - loadWork - prev.kineticEnergy) / prev.kineticEnergy,
    ).toBeLessThan(0.0003);
    expect(prev.state.slip).toBeCloseTo(motorSteadySlip(1)!, 7);
  });
  it('cuts real stator slots that clear the copper instead of burying windings in solid iron', () => {
    for (let phase = 0; phase < 3; phase++)
      for (let k = 0; k <= 3600; k++) {
        const p = motorWindingPoint(phase, k / 3600);
        if (Math.abs(p[2]) < 1)
          expect(Math.hypot(p[0], p[1]) + 0.023).toBeLessThan(
            motorStatorBore(Math.atan2(p[1], p[0])),
          );
      }
  });
  it('integrates changing inspection speed without creating a false rotor slip', () => {
    for (const chapter of [4, 5, 7])
      for (const p of [0.11, 0.34, 0.56, 0.89]) {
        const h = 0.0005,
          a = motorShot(chapter, p - h),
          b = motorShot(chapter, p + h),
          s = motorShot(chapter, p);
        const ratio = (b.state.rotorAngle - a.state.rotorAngle) / (b.state.phase - a.state.phase);
        expect(ratio).toBeCloseTo(1 - s.state.slip, 4);
      }
  });
  it('reconstructs every directed sample after arbitrary seek order without evolving frame state', () => {
    const samples = Array.from({ length: 97 }, (_, i) => motorShot(i % 8, (i % 13) / 12));
    for (let i = 96; i >= 0; i--) expect(motorShot(i % 8, (i % 13) / 12)).toEqual(samples[i]);
    expect(motorShot(3, 0).state.rpm).toBe(0);
    expect(motorShot(6, 0).state.rpm).toBeCloseTo(0);
    expect(motorShot(6, 0.9).state.rpm).toBeLessThan(0);
    expect(motorShot(4, 1).state.rotorCurrent).toBe(0);
    expect(motorShot(4, 1).state.torque).toBe(0);
  });
  it('bounds input errors and deenergization to finite, honest states', () => {
    for (const slip of [NaN, Infinity, -1, 2]) {
      const s = motorCircuit(slip);
      expect(Number.isFinite(s.torque)).toBe(true);
      expect(s.slip).toBeGreaterThanOrEqual(0);
      expect(s.slip).toBeLessThanOrEqual(1);
    }
    const s = motorSample(0.05, 1, 2, -1, false);
    expect(s.inputPower).toBe(0);
    expect(s.torque).toBeCloseTo(0);
    expect(s.rotorCurrent).toBe(0);
    expect(s.field.x).toBe(0);
    expect(s.field.y).toBe(0);
  });
});
