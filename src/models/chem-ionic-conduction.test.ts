import { describe, expect, it } from 'vitest';
import { ionicConduction, ionicParticle, ionicDirector } from './chem-ionic-conduction';
describe('ionic conductivity evidence', () => {
  it('retains water autoionization below the detector threshold', () => {
    const s = ionicConduction('water');
    expect(s.conductivityMicroSiemensPerCm).toBeCloseTo(0.05478, 6);
    expect(s.currentMicroAmp).toBeGreaterThan(0);
    expect(s.detected).toBe(false);
  });
  it('matches dilute-ion conductance and Ohm law in an independent 1 cm cell', () => {
    const s = ionicConduction('nacl', 1, 3);
    expect(s.currentMicroAmp).toBeCloseTo(379.36434, 5);
    expect(ionicConduction('kno3').conductivityMicroSiemensPerCm).toBeCloseTo(144.95478, 5);
    expect(ionicConduction('nacl', 1, -3).currentMicroAmp).toBeCloseTo(-s.currentMicroAmp);
  });
  it('needs mobile ions and a closed circuit', () => {
    expect(ionicConduction('nacl-solid').currentMicroAmp).toBe(0);
    expect(ionicConduction('nacl', 1, 3, false).currentMicroAmp).toBe(0);
    expect(ionicConduction('nacl', 0).conductivityMicroSiemensPerCm).toBe(
      ionicConduction('water').conductivityMicroSiemensPerCm,
    );
  });
  it('moves opposite charges oppositely without changing ion identity', () => {
    expect(ionicParticle(0, 1, 1).x - ionicParticle(0, 1, 0).x).toBe(14);
    expect(ionicParticle(1, 1, 1).x - ionicParticle(1, 1, 0).x).toBe(-14);
    expect(ionicParticle(0, 0, 1)).toEqual(ionicParticle(0, 0, 0));
    expect(ionicDirector(3, 0.1).connected).toBe(false);
  });
  it('dissociates before connection and starts drift without a position jump', () => {
    expect(ionicDirector(2, 0.4).dissolved).toBe(1);
    expect(ionicDirector(2, 0.4).connected).toBe(false);
    expect(ionicDirector(3, 0.25).drift).toBe(0);
    expect(ionicDirector(3, 0.250001).drift).toBeLessThan(0.00001);
    expect(ionicDirector(3, 1).drift).toBe(1);
  });
});
