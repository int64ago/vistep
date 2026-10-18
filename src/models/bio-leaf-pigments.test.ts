import { it, expect } from 'vitest';
import { chromatography, pigmentTransmission } from './bio-leaf-pigments';
it('keeps every pigment behind the solvent front and preserves the textbook band order', () => {
  for (const p of [0.01, 0.2, 0.5, 1]) {
    const s = chromatography(p);
    expect(s.bands.map((b) => b.distance)).toEqual(
      [...s.bands.map((b) => b.distance)].sort((a, b) => b - a),
    );
    for (const b of s.bands) expect(b.distance).toBeLessThan(s.front);
  }
  expect(chromatography(1, true).valid).toBe(false);
  expect(chromatography(1, true).bands[0].retained).toBeLessThan(0.01);
  expect(chromatography(1, false, 8).bands[0].width).toBeGreaterThan(
    chromatography(1).bands[0].width,
  );
});
it('uses measured pigment spectra and Beer–Lambert transmission', () => {
  expect(pigmentTransmission('a', 430).absorbed).toBeGreaterThan(
    pigmentTransmission('a', 550).absorbed,
  );
  expect(pigmentTransmission('a', 660).absorbed).toBeGreaterThan(
    pigmentTransmission('a', 550).absorbed,
  );
  expect(pigmentTransmission('carotene', 450).absorbed).toBeGreaterThan(
    pigmentTransmission('carotene', 650).absorbed,
  );
  for (const key of ['a', 'b', 'carotene'] as const)
    for (let nm = 400; nm <= 700; nm += 5) {
      const s = pigmentTransmission(key, nm);
      expect(s.transmitted + s.absorbed).toBeCloseTo(1);
      expect(pigmentTransmission(key, nm, 10).transmitted).toBeCloseTo(s.transmitted ** 2);
      expect(pigmentTransmission(key, nm, 0).transmitted).toBe(1);
    }
});
