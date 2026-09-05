import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  tidesState as state,
  tidesConstants as C,
  tidesDefaults as defaults,
  tidesBodies as bodies,
  tidesField as field,
  tidesPotential as potential,
  tidesHeight as height,
  tidesProfile as profile,
  tidesDirection as direction,
  tidesScale as scale,
  tidesAdd as add,
  tidesDot as dot,
  tidesNorm as norm,
  tidesSurface as surface,
  tidesShot as shot,
  tidesGrid as grid,
  tidesCamera as camera,
  tidesProject as project,
  tidesBounds as bounds,
  tidesGlyphs as glyphs,
  type TidesVector,
} from './tides';
const moon = bodies(defaults)[0],
  R = C.radius,
  D = C.moonDistance;
const closeVector = (a: TidesVector, b: TidesVector, tolerance = 1e-13) => {
  expect(norm(add(a, scale(b, -1)))).toBeLessThan(tolerance);
};
describe('tides: freely falling frame and equilibrium ocean', () => {
  it('subtracts the center acceleration and recovers independent collinear near/far equations', () => {
    const near = field({ x: R, y: 0, z: 0 }, [moon]),
      far = field({ x: -R, y: 0, z: 0 }, [moon]);
    expect(near.local.x).toBeCloseTo(C.moonGM / (D - R) ** 2, 16);
    expect(far.local.x).toBeCloseTo(C.moonGM / (D + R) ** 2, 16);
    expect(near.center.x).toBeCloseTo(C.moonGM / D ** 2, 16);
    expect(near.differential.x).toBeCloseTo(C.moonGM * ((D - R) ** -2 - D ** -2), 16);
    expect(far.differential.x).toBeCloseTo(C.moonGM * ((D + R) ** -2 - D ** -2), 16);
    expect(near.local.x).toBeGreaterThan(0);
    expect(far.local.x).toBeGreaterThan(0);
    expect(near.differential.x).toBeGreaterThan(0);
    expect(far.differential.x).toBeLessThan(0);
    expect(near.radial).toBeGreaterThan(0);
    expect(far.radial).toBeGreaterThan(0);
  });
  it('compresses transversely rather than pointing outward everywhere', () => {
    const f = field({ x: 0, y: R, z: 0 }, [moon]);
    expect(f.radial).toBeLessThan(0);
    expect(f.differential.y).toBeLessThan(0);
    expect(f.quadrupole.y).toBeCloseTo((-C.moonGM * R) / D ** 3, 17);
    closeVector(field({ x: 0, y: 0, z: 0 }, [moon]).differential, { x: 0, y: 0, z: 0 });
  });
  it('returns zero everywhere when both external source terms are off', () => {
    const b = bodies({ ...defaults, moon: 0, sun: 0 });
    for (const u of [direction(0, 0), direction(35, 84), direction(-70, 253)]) {
      closeVector(field(scale(u, R), b).differential, { x: 0, y: 0, z: 0 });
      expect(potential(scale(u, R), b)).toBe(0);
      expect(surface(u, b).radius).toBe(1);
    }
  });
  it('matches exact collinear potential residuals without subtractive cancellation', () => {
    expect(potential({ x: R, y: 0, z: 0 }, [moon])).toBeCloseTo(
      (C.moonGM * R * R) / (D * D * (D - R)),
      12,
    );
    expect(potential({ x: -R, y: 0, z: 0 }, [moon])).toBeCloseTo(
      (C.moonGM * R * R) / (D * D * (D + R)),
      12,
    );
    expect(potential({ x: 0, y: 0, z: 0 }, [moon])).toBe(0);
    expect(height(direction(0, 0), [moon])).toBeGreaterThan(height(direction(0, 180), [moon]));
  });
  it('has the exact differential acceleration as its numerical gradient, including the distant Sun', () => {
    const b = bodies({ ...defaults, sun: 1, alignment: 73, declination: 17 });
    for (const chosen of [[b[0]], [b[1]], b]) {
      const p = scale(direction(37, 43), R),
        step = 500,
        gradient = { x: 0, y: 0, z: 0 };
      for (const axis of ['x', 'y', 'z'] as const) {
        const dp = { x: 0, y: 0, z: 0 };
        dp[axis] = step;
        gradient[axis] =
          (potential(add(p, dp), chosen) - potential(add(p, scale(dp, -1)), chosen)) / (2 * step);
      }
      closeVector(gradient, field(p, chosen).differential, 2e-14);
    }
  });
  it('retains rigid rotation and origin-translation covariance of vector subtraction', () => {
    const rotate = (p: TidesVector) => ({ x: p.z, y: p.x, z: p.y }),
      p = scale(direction(23, 57), R),
      f = field(p, [moon]);
    const rotated = { ...moon, position: rotate(moon.position) };
    closeVector(field(rotate(p), [rotated]).differential, rotate(f.differential));
    expect(potential(rotate(p), [rotated])).toBeCloseTo(potential(p, [moon]), 12);
    // Independent inertial-origin calculation with center translated by v.
    const v = { x: 7e7, y: -2e7, z: 9e7 },
      worldMoon = add(v, moon.position),
      worldP = add(v, p);
    const gravity = (r: TidesVector) => {
      const d = add(worldMoon, scale(r, -1));
      return scale(d, moon.mu / norm(d) ** 3);
    };
    closeVector(add(gravity(worldP), scale(gravity(v), -1)), f.differential);
  });
  it('has exact inverse-cube leading-order scaling and bounded finite-size corrections', () => {
    const twice = { ...moon, position: scale(moon.position, 2) },
      p = scale(direction(18, 15), R);
    expect(potential(p, [twice], true) / potential(p, [moon], true)).toBeCloseTo(1 / 8, 14);
    closeVector(field(p, [twice]).quadrupole, scale(field(p, [moon]).quadrupole, 1 / 8), 1e-18);
    expect(Math.abs(potential(p, [moon]) / potential(p, [moon], true) - 1)).toBeLessThan(0.03);
    expect(Math.abs(potential(p, [twice]) / potential(p, [moon]) - 1 / 8)).toBeLessThan(0.003);
  });
  it('has zero spherical mean height to first order, rather than creating ocean volume', () => {
    const nodes = [
      -0.932469514203152, -0.661209386466265, -0.238619186083197, 0.238619186083197,
      0.661209386466265, 0.932469514203152,
    ];
    const weights = [
      0.17132449237917, 0.360761573048139, 0.467913934572691, 0.467913934572691, 0.360761573048139,
      0.17132449237917,
    ];
    const b = bodies({ ...defaults, sun: 1, alignment: 67, declination: 23 });
    let mean = 0;
    for (let j = 0; j < 6; j++)
      for (let i = 0; i < 48; i++) {
        const z = nodes[j],
          a = (2 * Math.PI * i) / 48;
        mean +=
          (weights[j] *
            height(
              {
                x: Math.sqrt(1 - z * z) * Math.cos(a),
                y: z,
                z: Math.sqrt(1 - z * z) * Math.sin(a),
              },
              b,
            )) /
          96;
      }
    expect(Math.abs(mean)).toBeLessThan(2e-11);
  });
  it('adds aligned quadrupole potentials and weakens the equatorial range at right angles', () => {
    const aligned = bodies({ ...defaults, sun: 1 }),
      opposed = bodies({ ...defaults, sun: 1, alignment: 180 }),
      square = bodies({ ...defaults, sun: 1, alignment: 90 });
    const A = (C.moonGM * R ** 2) / (C.g * D ** 3),
      B = (C.sunGM * R ** 2) / (C.g * C.sunDistance ** 3),
      x = direction(0, 0),
      z = direction(0, 90);
    expect(height(x, aligned, true)).toBeCloseTo(A + B, 12);
    expect(height(x, opposed, true)).toBeCloseTo(A + B, 12);
    expect(height(x, square, true)).toBeCloseTo(A - B / 2, 12);
    expect(height(z, square, true)).toBeCloseTo(B - A / 2, 12);
    expect(height(x, square, true) - height(z, square, true)).toBeCloseTo(1.5 * (A - B), 12);
    expect(profile({ ...defaults, sun: 1, alignment: 90 }).range).toBeLessThan(
      profile({ ...defaults, sun: 1 }).range,
    );
    expect(Math.abs(height(x, aligned) - height(x, opposed))).toBeLessThan(2e-5);
  });
  it('distinguishes the Sun’s larger bulk attraction from its smaller tidal strength', () => {
    const b = bodies({ ...defaults, sun: 1 });
    expect(
      norm(field({ x: 0, y: 0, z: 0 }, [b[1]]).center) /
        norm(field({ x: 0, y: 0, z: 0 }, [b[0]]).center),
    ).toBeGreaterThan(100);
    const ratio = b[1].mu / norm(b[1].position) ** 3 / (b[0].mu / norm(b[0].position) ** 3);
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.47);
  });
  it('relates the horizontal acceleration to the slope of equilibrium height', () => {
    const b = bodies({ ...defaults, declination: 21, sun: 1, alignment: 41 }),
      lat = 32,
      lon = 63,
      eps = 0.001,
      phi = (lat * Math.PI) / 180,
      lambda = (lon * Math.PI) / 180;
    const tangent = {
      x: -Math.sin(phi) * Math.cos(lambda),
      y: Math.cos(phi),
      z: -Math.sin(phi) * Math.sin(lambda),
    };
    const derivative =
      (height(direction(lat + eps, lon), b) - height(direction(lat - eps, lon), b)) /
      ((2 * eps * Math.PI) / 180);
    expect(dot(field(scale(direction(lat, lon), R), b).tangential, tangent)).toBeCloseTo(
      (C.g * derivative) / R,
      15,
    );
  });
  it('shows two equatorial maxima but permits one at high latitude in the stated equilibrium example', () => {
    const maxima = (c: typeof defaults) => {
      const p = profile(c, 721).points.slice(0, -1);
      return p.filter(
        (v, i) =>
          v.height > p[(i + p.length - 1) % p.length].height &&
          v.height > p[(i + 1) % p.length].height,
      ).length;
    };
    expect(maxima(defaults)).toBe(2);
    expect(maxima({ ...defaults, latitude: 45, declination: 25 })).toBe(2);
    expect(maxima({ ...defaults, latitude: 75, declination: 25 })).toBe(1);
    const p = profile({ ...defaults, latitude: 45, declination: 25 });
    expect(p.points[0].height).not.toBeCloseTo(p.points[90].height, 2);
    expect(p.points[0].height).toBeCloseTo(p.points.at(-1)!.height, 13);
  });
});
describe('tides: deterministic display and actual perspective bounds', () => {
  it('changes only displayed magnification while retaining physical metre values', () => {
    const b = bodies(defaults),
      u = direction(0, 0),
      a = surface(u, b, 0),
      z = surface(u, b, C.exaggeration);
    expect(a.height).toBe(z.height);
    expect(a.radius).toBe(1);
    expect(z.radius - 1).toBeCloseTo((z.height * C.exaggeration) / R, 13);
  });
  it('reconstructs all chapters and fixed sample identities after reverse seeks and reset', () => {
    const original = { ...defaults },
      states = Array.from({ length: 8 * 31 }, (_, i) => shot(Math.floor(i / 31), (i % 31) / 30));
    for (let i = states.length - 1; i >= 0; i--)
      expect(shot(Math.floor(i / 31), (i % 31) / 30)).toEqual(states[i]);
    const first = grid(bodies(defaults), C.exaggeration);
    grid(bodies({ ...defaults, sun: 1, latitude: 64, alignment: 90 }), 123456, 170);
    expect(grid(bodies({ ...original }), C.exaggeration)).toEqual(first);
    expect(defaults).toEqual(original);
    expect(new Set(first.map((r) => r.id)).size).toBe(first.length);
  });
  it('projects actual deformed vertices, Moon box corners and force tips through the rendering camera with margin', () => {
    for (const compact of [false, true])
      for (let chapter = 0; chapter < 8; chapter++)
        for (const phase of [0, 0.5, 1]) {
          const s = shot(chapter, phase),
            w = compact ? 268 : 591.43,
            h = compact ? (chapter < 2 ? 233 : 263) : 420,
            c = camera(s, w, h, compact),
            real = new THREE.PerspectiveCamera(c.fov, c.aspect, c.near, c.far);
          real.position.set(c.position.x, c.position.y, c.position.z);
          real.lookAt(c.target.x, c.target.y, c.target.z);
          real.updateMatrixWorld();
          real.updateProjectionMatrix();
          const points = [
            ...bounds(s, compact),
            ...grid(s.bodies, s.gain).flatMap((r) => r.points.map((p) => p.position)),
            glyphs(s, compact).marker,
          ];
          for (const p of points) {
            const ndc = new THREE.Vector3(p.x, p.y, p.z).project(real),
              ours = project(p, c);
            expect(Math.abs(ndc.x)).toBeLessThan(0.93);
            expect(Math.abs(ndc.y)).toBeLessThan(0.93);
            expect(ndc.z).toBeGreaterThan(-1);
            expect(ndc.z).toBeLessThan(1);
            expect(ndc.x).toBeCloseTo(ours.x, 12);
            expect(ndc.y).toBeCloseTo(ours.y, 12);
          }
        }
  });
  it('keeps manual solar-force and maximum deformation cases inside the supported camera bounds', () => {
    for (const compact of [false, true])
      for (const focus of ['gravity', 'subtract', 'equilibrium'] as const) {
        const s = state(
            { ...defaults, sun: 1, moonDistance: 0.8, declination: 30, alignment: 0 },
            focus,
          ),
          c = camera(s, compact ? 268 : 591.43, compact ? 233 : 420, compact);
        for (const p of bounds(s, compact)) {
          const v = project(p, c);
          expect(Math.abs(v.x)).toBeLessThan(0.94);
          expect(Math.abs(v.y)).toBeLessThan(0.94);
          expect(v.visible).toBe(true);
        }
      }
    expect(state({ ...defaults, sun: 1, declination: 30, alignment: 0 }).separation).toBeCloseTo(
      30,
      10,
    );
    expect(state({ ...defaults, sun: 1, declination: 30, alignment: 90 }).separation).toBeCloseTo(
      90,
      10,
    );
  });
  it('rejects unsupported inputs and singular configurations', () => {
    for (const patch of [
      { moonDistance: 0.7 },
      { latitude: 90 },
      { sun: 2 },
      { rotation: Infinity },
      { declination: 40 },
    ])
      expect(() => bodies({ ...defaults, ...patch })).toThrow(RangeError);
    expect(() => potential(scale(moon.position, 2), [moon])).toThrow(RangeError);
    expect(() => potential({ x: NaN, y: 0, z: 0 }, [moon])).toThrow(RangeError);
    expect(() => potential({ x: 0, y: 0, z: 0 }, [{ ...moon, mu: NaN }])).toThrow(RangeError);
    expect(() => surface(direction(0, 0), [moon], 3e6)).toThrow(RangeError);
  });
});
