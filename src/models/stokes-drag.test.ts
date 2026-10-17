import { describe, expect, it } from 'vitest';
import { stokesDrag, stokesField, stokesStreamline, stokesMarker } from './stokes-drag';
describe('Rigid sphere creeping-flow drag and self-consistency', () => {
  it('matches the independent 10µm sand settling benchmark from MIT notes', () => {
    const s = stokesDrag({ radius: 1e-5, viscosity: 0.001, terminal: true });
    expect(s.terminalSpeed).toBeCloseTo(0.000327, 12);
    expect(s.reynolds).toBeCloseTo(0.00654, 12);
    expect(s.valid).toBe(true);
  });
  it('satisfies no-slip on the full spherical boundary and uniform flow far away', () => {
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI) / 10,
        p = stokesField(0.0003 * Math.cos(a), 0.0003 * Math.sin(a));
      expect(p.ux).toBeCloseTo(0, 12);
      expect(p.uy).toBeCloseTo(0, 12);
    }
    expect(stokesField(1, 1).uy / 0.0005).toBeCloseTo(1, 3);
  });
  it('independently integrates pressure and shear tractions to recover 6πμaU', () => {
    const s = stokesDrag(),
      n = 20000,
      dtheta = Math.PI / n;
    let pressure = 0,
      shear = 0;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) * dtheta,
        element = 2 * Math.PI * s.radius ** 2 * Math.sin(a) * dtheta,
        normal = ((1.5 * s.viscosity * s.speed) / s.radius) * Math.cos(a),
        tangent = ((-1.5 * s.viscosity * s.speed) / s.radius) * Math.sin(a);
      pressure += normal * Math.cos(a) * element;
      shear -= tangent * Math.sin(a) * element;
    }
    expect(pressure + shear).toBeCloseTo(s.drag, 13);
    expect(shear / pressure).toBeCloseTo(2, 7);
  });
  it('preserves the streamfunction and advects actual markers at local speed', () => {
    for (const impact of [0.00005, 0.0003]) {
      const line = stokesStreamline(impact),
        a = 0.0003;
      for (const p of line.points) {
        const r = Math.hypot(p.x, p.y),
          psi = p.x * p.x * (1 - (1.5 * a) / r + 0.5 * (a / r) ** 3);
        expect(psi).toBeCloseTo(impact ** 2, 12);
        expect(r).toBeGreaterThan(a);
      }
      const dt = 1e-5,
        p = stokesMarker(line, 0.0005, 0, 0.25),
        q = stokesMarker(line, 0.0005, dt, 0.25),
        u = stokesField(p.x, p.y);
      expect(Math.abs((q.y - p.y) / dt / u.uy - 1)).toBeLessThan(0.04);
    }
  });
  it('keeps prescribed-speed drag linear but terminal settling quadratic in radius, with density/sign limits', () => {
    const a = stokesDrag(),
      b = stokesDrag({ radius: 0.0006 });
    expect(b.drag / a.drag).toBeCloseTo(2, 12);
    expect(b.terminalSpeed / a.terminalSpeed).toBeCloseTo(4, 12);
    const s = stokesDrag({ terminal: true });
    expect(s.drag + s.buoyancy).toBeCloseTo(s.weight, 14);
    expect(stokesDrag({ terminal: true, sphereDensity: 800 }).speed).toBeLessThan(0);
    expect(stokesDrag({ speed: 0 }).drag).toBe(0);
  });
  it('flags rather than silently certifies a high-Re terminal trial', () => {
    const s = stokesDrag({ viscosity: 0.001, terminal: true });
    expect(s.reynolds).toBeGreaterThan(100);
    expect(s.valid).toBe(false);
    for (const o of [{ radius: 0 }, { viscosity: -1 }, { speed: NaN }])
      expect(() => stokesDrag(o)).toThrow(RangeError);
  });
});
