import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NFC, nfcTagPoint } from './nfc';
import {
  NFC_ART,
  nfcArtTagPoint,
  nfcConnections,
  nfcSpiralPoint,
  nfcFluxArrow,
  type NfcVisual,
} from './nfc-geometry';
import { createNfcApparatus } from '../components/three/NfcStudio';

const base: NfcVisual = {
  gapMm: 8,
  tiltDeg: 0,
  phase: 0,
  powered: true,
  fieldOn: true,
  loadOn: false,
  showInternals: 1,
};
const vectorDistance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

describe('connected NFC artwork geometry', () => {
  it('winds continuously with a series reader capacitor and a parallel tag capacitor', () => {
    for (const which of ['reader', 'tag'] as const) {
      const count = which === 'reader' ? NFC.readerTurns : NFC.tagTurns;
      let angle = 0,
        previous = nfcSpiralPoint(which, 0);
      for (let i = 1; i <= 1024; i++) {
        const next = nfcSpiralPoint(which, i / 1024);
        angle += Math.atan2(
          previous[0] * next[2] - previous[2] * next[0],
          previous[0] * next[0] + previous[2] * next[2],
        );
        expect(vectorDistance(previous, next)).toBeLessThan(0.6);
        previous = next;
      }
      expect(angle).toBeCloseTo(count * 2 * Math.PI, 9);
      const wire = nfcConnections(which);
      expect(vectorDistance(wire.inner[0], nfcSpiralPoint(which, 0))).toBeLessThan(1e-12);
      expect(vectorDistance(wire.outer[0], nfcSpiralPoint(which, 1))).toBeLessThan(1e-12);
      expect(wire.inner.at(-1)).toEqual(wire.right);
      expect(wire.outer.at(-1)).toEqual(which === 'tag' ? wire.left : wire.capLeft);
      const nodes = new Set<string>(),
        edges = new Set<string>();
      const connection = (a: number[], b: number[]) => {
        const ids = [JSON.stringify(a), JSON.stringify(b)];
        ids.forEach((id) => nodes.add(id));
        edges.add(ids.sort().join('|'));
      };
      for (const path of [wire.inner, wire.outer, ...wire.capWires])
        for (let i = 1; i < path.length; i++) connection(path[i - 1], path[i]);
      connection(wire.left, wire.right);
      connection(wire.inner[0], wire.outer[0]);
      connection(wire.capLeft, wire.capRight);
      // Cycle rank: one series current loop vs two loops sharing the tag load.
      expect(edges.size - nodes.size + 1).toBe(which === 'reader' ? 1 : 2);
      // All winding crossings are on an insulated layer with material clearance.
      expect(
        wire.insulation[0][1] - nfcSpiralPoint(which, 0)[1] - 0.42 - NFC_ART.wireRadiusMm,
      ).toBeGreaterThan(0.45);
    }
  });

  it('shows local flux through the actual coil normal, reverses sign and vanishes at zero', () => {
    const positive = nfcFluxArrow(1),
      negative = nfcFluxArrow(-1),
      half = nfcFluxArrow(0.5);
    expect(positive.tip[1] - positive.from[1]).toBe(-16);
    expect(negative.tip[1] - negative.from[1]).toBe(16);
    expect(half.length).toBe(positive.length / 2);
    expect(nfcFluxArrow(0).visible).toBe(false);
    expect(nfcFluxArrow(0.01).visible).toBe(false);
    for (const tiltDeg of [0, 37, 80]) {
      const p = nfcArtTagPoint(positive.tip, { gapMm: 8, tiltDeg }),
        q = nfcArtTagPoint(positive.from, { gapMm: 8, tiltDeg }),
        angle = (tiltDeg * Math.PI) / 180;
      expect((p[0] - q[0]) / 16).toBeCloseTo(Math.sin(angle), 12);
      expect((p[1] - q[1]) / 16).toBeCloseTo(-Math.cos(angle), 12);
    }
  });

  it('keeps round substrate clearance and transforms identically to the SI model', () => {
    for (const gapMm of [4, 8, 60])
      for (let tiltDeg = 0; tiltDeg <= 80; tiltDeg += 4) {
        const visual = { ...base, gapMm, tiltDeg },
          radius = NFC_ART.tagRadiusMm;
        const low = nfcArtTagPoint([-radius, -NFC_ART.tagHalfThicknessMm, 0], visual);
        expect(low[1]).toBeCloseTo(gapMm, 10);
        for (const local of [
          [13, 0.7, -4],
          [-6, 1.8, 11],
          [0, -0.5, 22],
        ] as [number, number, number][]) {
          const actual = nfcArtTagPoint(local, visual),
            expected = nfcTagPoint(local.map((v) => v / 1000) as [number, number, number], {
              gapM: gapMm / 1000,
              tiltDeg,
            }).map((v) => v * 1000);
          expect(vectorDistance(actual, expected)).toBeLessThan(1e-12);
        }
      }
  });

  it('fits the actual buffer vertices across extreme poses, viewport ratios and orbit angles', () => {
    const root = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100),
      target = new THREE.Vector3(0, 2, 0);
    camera.position.set(3.5, 12, 13);
    const controls = {
      target,
      enabled: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as OrbitControls;
    const live = { current: { visual: { ...base }, narrow: true } };
    const renderer = createNfcApparatus(live, {
      root,
      camera,
      controls,
      scene: new THREE.Scene(),
      reducedMotion: { matches: true } as MediaQueryList,
    });
    let vertices = 0,
      maximum = 0;
    const p = new THREE.Vector3();
    for (const aspect of [254 / 330, 324 / 220, 680 / 420])
      for (const gapMm of [4, 8, 60])
        for (const tiltDeg of [0, 37, 80])
          for (const yaw of [0, 0.8, 2.7])
            for (const closeup of [0, 1])
              for (const fluxNormalized of [-1, 0, 1]) {
                camera.aspect = aspect;
                camera.updateProjectionMatrix();
                camera.position
                  .copy(target)
                  .add(
                    new THREE.Vector3(-6.8, 12, 13).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw),
                  );
                live.current.visual = { ...base, gapMm, tiltDeg, closeup, fluxNormalized };
                renderer.update();
                root.updateMatrixWorld(true);
                root.traverse((object) => {
                  if (!(object instanceof THREE.Mesh)) return;
                  const positions = object.geometry.getAttribute('position');
                  for (let k = 0; k < positions.count; k++) {
                    p.fromBufferAttribute(positions, k)
                      .applyMatrix4(object.matrixWorld)
                      .project(camera);
                    if (!Number.isFinite(p.x + p.y + p.z) || Math.abs(p.z) >= 1)
                      throw new Error('Vertex is outside the camera depth range');
                    maximum = Math.max(maximum, Math.abs(p.x), Math.abs(p.y));
                    vertices++;
                  }
                });
              }
    expect(vertices).toBeGreaterThan(1_000_000);
    expect(maximum).toBeLessThanOrEqual(0.880001);
    renderer.dispose();
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) =>
          m.dispose(),
        );
      }
    });
  });
});
