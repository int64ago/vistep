import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  BFS,
  BFS_DEFAULT,
  BFS_TEACHING_K,
  bfsImpedance,
  bfsShot,
  bfsState,
  bfsWave,
} from './body-fat-scale';
import {
  BFS_GEOMETRY as G,
  bfsCurrentPath,
  bfsSensePaths,
  bfsPathPoint,
  bfsFootEllipsoids,
  bfsMarkerFraction,
} from './body-fat-scale-geometry';
import { bfsCoverProject, bodyFatScaleCover } from './body-fat-scale-cover';

describe('body-fat scale physical and estimation boundaries', () => {
  it('matches an independent parallel complex-admittance calculation across the whole teaching domain', () => {
    for (const waterDeltaL of [-3, 0, 3])
      for (const frequencyHz of [1000, 2000, 10000, 50000, 200000, 250000]) {
        const water = BFS.waterL + waterDeltaL;
        const re = (BFS.extracellularOhm * BFS.waterL) / water;
        const ri = (BFS.intracellularOhm * BFS.waterL) / water;
        const x = -1 / (2 * Math.PI * frequencyHz * BFS.membraneF);
        const yr = 1 / re + ri / (ri * ri + x * x);
        const yi = -x / (ri * ri + x * x);
        const result = bfsImpedance(frequencyHz, water);
        expect(result.resistance).toBeCloseTo(yr / (yr * yr + yi * yi), 10);
        expect(result.reactance).toBeCloseTo(-yi / (yr * yr + yi * yi), 10);
        expect(result.phaseDegrees).toBeLessThan(0);
        expect(result.magnitude).toBeCloseTo(Math.hypot(result.resistance, result.reactance), 10);
      }
  });

  it('recovers the same amplitude ratio and negative phase from independently integrated wave samples', () => {
    for (const frequencyHz of [1000, 50000, 250000]) {
      const state = bfsState({ ...BFS_DEFAULT, frequencyHz });
      const n = 1024;
      let irms = 0,
        vrms = 0,
        inPhase = 0,
        quadrature = 0;
      for (let i = 0; i < n; i++) {
        const sample = (i + 0.5) / n;
        const w = bfsWave(state, sample);
        irms += w.currentMicroA ** 2 / n;
        vrms += w.voltageMilliV ** 2 / n;
        inPhase += (w.voltageMilliV * Math.sin(4 * Math.PI * sample)) / n;
        quadrature += (w.voltageMilliV * Math.cos(4 * Math.PI * sample)) / n;
      }
      expect(Math.sqrt(irms)).toBeCloseTo(BFS.currentRmsA * 1e6, 9);
      expect(Math.sqrt(vrms / irms) * 1000).toBeCloseTo(state.body.magnitude, 9);
      expect(Math.atan2(quadrature, inPhase)).toBeCloseTo(state.body.phaseRad, 10);
    }
  });

  it('balances four load-cell reactions and their moments even when one foot is lifted', () => {
    for (const contact of [true, false])
      for (const waterDeltaL of [-3, 0, 3]) {
        const s = bfsState({ ...BFS_DEFAULT, contact, waterDeltaL });
        const total = s.cells.reduce((v, c) => v + c.forceN, 0);
        const xMoment = s.cells.reduce((v, c) => v + c.x * c.forceN, 0);
        const zMoment = s.cells.reduce((v, c) => v + c.z * c.forceN, 0);
        expect(total).toBeCloseTo(s.massKg * BFS.gravity, 10);
        expect(xMoment / total).toBeCloseTo(contact ? 0 : -0.82, 10);
        expect(zMoment).toBeCloseTo(0, 10);
        expect(s.cells.every((c) => c.forceN > 0 && c.resistanceMinus > 0)).toBe(true);
      }
  });

  it('loads the same mass without moving the deck away from its physical supports', () => {
    for (const p of [0, 0.2, 0.5, 1, 0.2, 0]) {
      const shot = bfsShot(1, p);
      expect(shot.massKg).toBe(70);
      expect(shot.explode).toBe(0);
      expect(shot.cells.reduce((s, c) => s + c.forceN, 0)).toBeCloseTo(
        70 * BFS.gravity * shot.loadFraction,
        10,
      );
      for (const c of shot.cells) {
        const v =
          (BFS.bridgeExcitationV * (c.resistancePlus - c.resistanceMinus)) /
          (c.resistancePlus + c.resistanceMinus);
        expect(c.bridgeV).toBeCloseTo(v, 12);
        expect(c.strain).toBeCloseTo(c.forceN * BFS.strainPerNewton, 12);
      }
    }
    expect(bfsShot(1, 0).cells.every((c) => c.bridgeV === 0)).toBe(true);
    expect(bfsShot(1, 1).loadFraction).toBe(1);
  });

  it('has no impedance or estimated fat output with an open current contact, and restricts its coefficient to 50 kHz', () => {
    const open = bfsState({ ...BFS_DEFAULT, contact: false });
    expect(open.massKg).toBe(70);
    expect(open.measured).toBeNull();
    expect(open.estimate).toBeNull();
    expect(
      [open.currentA, open.voltageV, open.currentRmsA, open.voltageRmsV].every(
        (v) => Math.abs(v) === 0,
      ),
    ).toBe(true);
    const otherFrequency = bfsState({ ...BFS_DEFAULT, frequencyHz: 10000 });
    expect(otherFrequency.measured).not.toBeNull();
    expect(otherFrequency.estimate).toBeNull();
    expect(otherFrequency.status).toBe('frequency');
  });

  it('keeps fat mass and dry mass fixed, changes the percentage denominator, and exposes estimation error', () => {
    const states = [-3, 0, 3].map((waterDeltaL) => bfsState({ ...BFS_DEFAULT, waterDeltaL }));
    expect(states.map((s) => s.massKg)).toEqual([67, 70, 73]);
    expect(states.map((s) => s.fatKg)).toEqual([15, 15, 15]);
    states.forEach((s) => {
      expect(s.leanKg - s.waterL).toBeCloseTo(BFS.dryLeanKg, 12);
      expect(s.trueFatPercent).toBeCloseTo((100 * 15) / s.massKg, 12);
    });
    expect(states[0].trueFatPercent).toBeGreaterThan(states[2].trueFatPercent);
    expect(states[0].estimate!.fatKg).toBeGreaterThan(15);
    expect(states[2].estimate!.fatKg).toBeLessThan(15);
    expect(states[1].estimate!.fatKg).toBeCloseTo(15, 12);
    expect((BFS_TEACHING_K * BFS.heightM ** 2) / states[1].body.resistance).toBeCloseTo(
      BFS.waterL,
      12,
    );
  });

  it('rejects nonfinite/out-of-domain inputs and reconstructs exactly after a backwards seek', () => {
    for (const frequencyHz of [NaN, Infinity, 999, 250001])
      expect(() => bfsState({ ...BFS_DEFAULT, frequencyHz })).toThrow(RangeError);
    for (const waterDeltaL of [NaN, Infinity, -3.01, 3.01])
      expect(() => bfsState({ ...BFS_DEFAULT, waterDeltaL })).toThrow(RangeError);
    for (const phaseCycles of [NaN, Infinity, -0.01, 6.01])
      expect(() => bfsState({ ...BFS_DEFAULT, phaseCycles })).toThrow(RangeError);
    for (const chapter of [-1, 7, 0.2]) expect(() => bfsShot(chapter, 0.3)).toThrow(RangeError);
    for (let chapter = 0; chapter < 7; chapter++) {
      const first = bfsShot(chapter, 0.37);
      bfsShot(chapter, 0.99);
      expect(bfsShot(chapter, 0.37)).toEqual(first);
      expect(bfsShot(chapter, -0.2)).toEqual(bfsShot(chapter, 0));
      expect(bfsShot(chapter, 1.2)).toEqual(bfsShot(chapter, 1));
    }
  });
});

describe('shared scale routes and native cover', () => {
  it('closes the AC source loop and leaves both voltage sense paths at separate high-impedance ports', () => {
    const current = bfsCurrentPath(),
      sense = bfsSensePaths();
    expect(current[0]).toEqual(G.sourcePorts[0]);
    expect(current.at(-2)).toEqual(G.sourcePorts[1]);
    expect(current.at(-1)).toEqual(current[0]);
    for (const e of G.electrodes.filter((e) => e.role === 'current'))
      expect(current).toContainEqual(e.at);
    G.electrodes
      .filter((e) => e.role === 'voltage')
      .forEach((e, i) => {
        expect(sense[i][0]).toEqual(e.at);
        expect(sense[i].at(-1)).toEqual(G.voltagePorts[i]);
      });
    expect(bfsPathPoint(current, 0)).toEqual(current[0]);
    bfsPathPoint(current, 1).forEach((v, i) => expect(v).toBeCloseTo(current[0][i], 12));
  });

  it('reverses slowed signal marker velocity with the actual alternating current', () => {
    const step = 1e-5;
    for (const phaseCycles of [0.125, 0.25, 0.375, 0.625, 0.75, 0.875]) {
      const velocity =
        bfsMarkerFraction(5, 12, phaseCycles + step) - bfsMarkerFraction(5, 12, phaseCycles - step);
      const current = bfsState({ ...BFS_DEFAULT, phaseCycles }).currentA;
      expect(Math.sign(velocity)).toBe(Math.sign(current));
    }
    expect(bfsMarkerFraction(5, 12, 0)).toBeCloseTo(bfsMarkerFraction(5, 12, 1), 12);
  });

  it('places heel and toe contact tangencies on the corresponding metal pad', () => {
    for (const side of [-1, 1]) {
      const feet = bfsFootEllipsoids(side),
        heel = feet[1],
        toe = feet[2];
      for (const [f, index] of [
        [heel, side === -1 ? 2 : 3],
        [toe, side === -1 ? 0 : 1],
      ] as const) {
        const e = G.electrodes[index];
        expect(f.at[1] - f.size[1]).toBeCloseTo(e.at[1], 12);
        expect(Math.abs(side * 0.82 + f.at[0] - e.at[0])).toBeLessThan(G.padSize[0] / 2);
        expect(Math.abs(f.at[2] - e.at[2])).toBeLessThan(G.padSize[2] / 2);
      }
    }
  });

  it('keeps a lightweight cover inside its viewport and only shows outward-facing box surfaces', () => {
    const paths = bodyFatScaleCover(),
      eye = [-504, 848, -2226];
    expect(paths.length).toBeLessThan(70);
    expect(JSON.stringify(paths).length).toBeLessThan(50000);
    for (const path of paths) {
      expect(path.d).not.toMatch(/NaN|Infinity/);
      if (path.normal && path.points) {
        expect(path.normal.reduce((s, v, i) => s + v * eye[i], 0)).toBeGreaterThan(0);
        const [a, b, c] = path.points;
        const u = b.map((v, i) => v - a[i]),
          v = c.map((v, i) => v - a[i]);
        const cross = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0],
        ];
        expect(cross.reduce((s, v, i) => s + v * path.normal![i], 0)).toBeGreaterThan(0);
      }
      for (const point of path.points ?? []) {
        const [x, y] = bfsCoverProject(point);
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(400);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(230);
      }
    }
    expect(paths.filter((p) => p.part === 'equivalent-tissue').map((p) => p.d)).toEqual(
      [bfsCurrentPath().slice(4, 9), bfsCurrentPath().slice(8, 14)].map(
        (points) =>
          'M' +
          points
            .map(bfsCoverProject)
            .map((p) => p.map((v) => v.toFixed(2)).join(','))
            .join(' L'),
      ),
    );
  });

  it('paints opaque physical faces in actual eye-ray order across the projected scale', () => {
    const faces = bodyFatScaleCover().filter((p) => p.points && (p.opacity ?? 1) === 1);
    const eye = new THREE.Vector3(-504, 848, -2226).normalize();
    const triangles = faces.map((p) => {
      const v = p.points!.map((p) => new THREE.Vector3(...p));
      return [
        [v[0], v[1], v[2]],
        [v[0], v[2], v[3]],
      ];
    });
    let samples = 0;
    for (let x = 100.5; x < 310; x += 3)
      for (let y = 140.5; y < 210; y += 3) {
        // Independently invert the projection at z=0, then cast through the
        // actual solid face vertices. Projection metadata never supplies depth.
        const start = new THREE.Vector3((x - 205) / 53, (191 - y) / 42, 0).addScaledVector(
          eye,
          100,
        );
        const ray = new THREE.Ray(start, eye.clone().negate()),
          hit = new THREE.Vector3();
        let closest = Infinity,
          painted = Infinity;
        triangles.forEach((list) => {
          let distance = Infinity;
          for (const [a, b, c] of list)
            if (ray.intersectTriangle(a, b, c, false, hit))
              distance = Math.min(distance, start.distanceTo(hit));
          if (Number.isFinite(distance)) {
            closest = Math.min(closest, distance);
            painted = distance;
          }
        });
        if (Number.isFinite(closest)) {
          samples++;
          expect(painted - closest).toBeLessThan(1e-7);
        }
      }
    expect(samples).toBeGreaterThan(200);
  });
});
