import { describe, it, expect } from 'vitest';
import {
  VACUUM_PERMITTIVITY as e0,
  capacitorFieldDefaults,
  capacitorFields,
} from './capacitor-fields';
describe('capacitor fields and layered dielectric', () => {
  it('matches independent vacuum parallel-plate capacitance and field', () => {
    const s = capacitorFields(capacitorFieldDefaults());
    expect(s.capacitance).toBeCloseTo(17.7083756256e-12, 22);
    expect(s.airField).toBeCloseTo(2400, 10);
    expect(s.energy).toBeCloseTo(0.5 * s.capacitance * 144, 20);
  });
  it('isolated charge gives lower voltage and field in a fully filled dielectric', () => {
    const p = capacitorFieldDefaults(),
      a = capacitorFields({ ...p, connection: 'charge' }),
      b = capacitorFields({ ...p, connection: 'charge', fraction: 1 });
    expect(b.charge).toBe(a.charge);
    expect(b.voltage).toBeCloseTo(a.voltage / 4, 12);
    expect(b.dielectricField).toBeCloseTo(a.airField / 4, 10);
    expect(b.energy).toBeCloseTo(a.energy / 4, 20);
  });
  it('voltage source holds field while supplying more free charge for full fill', () => {
    const p = capacitorFieldDefaults(),
      a = capacitorFields(p),
      b = capacitorFields({ ...p, fraction: 1 });
    expect(b.voltage).toBeCloseTo(12, 12);
    expect(b.dielectricField).toBeCloseTo(a.airField, 10);
    expect(b.charge).toBeCloseTo(4 * a.charge, 20);
  });
  it('same isolated charge keeps air field while gap changes voltage', () => {
    const p = { ...capacitorFieldDefaults(), connection: 'charge' as const },
      a = capacitorFields({ ...p, gap: 0.003 }),
      b = capacitorFields({ ...p, gap: 0.007 });
    expect(a.airField).toBe(b.airField);
    expect(b.voltage / a.voltage).toBeCloseTo(7 / 3, 12);
  });
  it('layered fields satisfy displacement continuity and potential drops', () => {
    const s = capacitorFields({ ...capacitorFieldDefaults(), fraction: 0.5 });
    expect(e0 * s.airField).toBeCloseTo(e0 * 4 * s.dielectricField, 20);
    expect(s.airField * 0.0025 + s.dielectricField * 0.0025).toBeCloseTo(12, 12);
    expect(s.potential(0)).toBeCloseTo(12, 12);
    expect(s.potential(0.005)).toBeCloseTo(0, 12);
    expect(s.polarization).toBeCloseTo(s.displacement * 0.75, 20);
  });
  it('field energy density integrates to half QV and local slope equals minus E', () => {
    for (const fraction of [0, 0.5, 1]) {
      const s = capacitorFields({ ...capacitorFieldDefaults(), fraction }),
        U =
          0.5 * e0 * s.airField ** 2 * s.area * (s.gap - s.thickness) +
          0.5 * e0 * s.relativePermittivity * s.dielectricField ** 2 * s.area * s.thickness;
      expect(U).toBeCloseTo(s.energy, 20);
    }
    const s = capacitorFields({ ...capacitorFieldDefaults(), fraction: 0.5 }),
      h = 1e-8;
    expect(-(s.potential(0.0025 + h) - s.potential(0.0025 - h)) / (2 * h)).toBeCloseTo(
      s.dielectricField,
      5,
    );
  });
});
