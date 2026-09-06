/** Focused regressions for the promotional artwork, not a full topic revalidation. */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Resvg } from '@resvg/resvg-js';
import {
  ART,
  TAU,
  GEAR,
  CRANK_VIEW,
  LENS,
  CUBE,
  DCT_SOURCE,
  gearGeometry,
  crankGeometry,
  electricGeometry,
  opticalGeometry,
  rayPosition,
  dimensionGeometry,
  imageGeometry,
  waveGeometry,
  frameSVG,
  renderFrame,
  MECHANISMS,
} from './render-showcase.mjs';
import { ENGINE } from '../src/models/four-stroke.ts';
import { involuteOutline } from '../src/models/mechanisms.ts';
import { interferenceEnergy, interferenceAt } from '../src/models/wave-interference.ts';
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const pointClose = (a, b, tolerance = 1e-10) => a.forEach((v, i) => close(v, b[i], tolerance));
const inside = (p, poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      hit = !hit;
  }
  return hit;
};
test('the shown gear pair meshes and its geometry/bolts repeat without a reset', () => {
  const originals = [GEAR.a, GEAR.b].map((n) => involuteOutline(GEAR.module, n));
  const rot = (poly, theta, c) =>
    poly.map((p) => ({
      x: c[0] + p.x * Math.cos(theta) - p.y * Math.sin(theta),
      y: c[1] + p.x * Math.sin(theta) + p.y * Math.cos(theta),
    }));
  for (let i = 0; i < 33; i++) {
    const g = gearGeometry(i / (32 * 16));
    close(Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]), g.distance);
    const a = rot(originals[0], g.angle, g.a),
      b = rot(originals[1], g.other, g.b);
    assert.ok(!a.some((p) => inside(p, b)) && !b.some((p) => inside(p, a)));
  }
  const a = gearGeometry(0),
    b = gearGeometry(1);
  for (const [turn, symmetry] of [
    [(b.angle - a.angle) / TAU, 32],
    [(b.other - a.other) / TAU, 20],
    [(b.angle - a.angle) / TAU, 8],
    [(b.other - a.other) / TAU, 5],
  ])
    close(turn * symmetry, Math.round(turn * symmetry));
  close((b.other - a.other) / (b.angle - a.angle), -GEAR.a / GEAR.b);
});
test('the complete crank sweep preserves rod length, guide clearance and both joints', () => {
  for (let i = 0; i <= 160; i++) {
    const g = crankGeometry(i / 160);
    close(Math.hypot(g.crankX, g.pinY - g.crankY), ENGINE.rod);
    close(Math.hypot(g.crankX, g.crankY), ENGINE.crank);
    assert.ok(g.down >= -1e-12 && g.down <= 2 * ENGINE.crank + 1e-12);
    const head =
      CRANK_VIEW.axis - (ENGINE.rod + ENGINE.crank) * CRANK_VIEW.scale - CRANK_VIEW.headClearance;
    const pistonTop = CRANK_VIEW.axis - g.pinY * CRANK_VIEW.scale - CRANK_VIEW.pistonHalfHeight;
    assert.ok(pistonTop - (head + 6) >= 6 - 1e-10);
  }
  const a = crankGeometry(0),
    b = crankGeometry(1);
  for (const key of ['crankX', 'crankY', 'pinY', 'down']) close(a[key], b[key]);
});
test('generator conductor, rotating leads, contacts and load preserve the actual model topology', () => {
  for (let i = 0; i <= 64; i++) {
    const g = electricGeometry(i / 64),
      s = g.state;
    pointClose(g.conductor[0], g.leads[0][0]);
    pointClose(g.conductor.at(-1), g.leads[1][0]);
    pointClose(g.circuit.feed[0], g.contacts[1].lead);
    pointClose(g.circuit.return.at(-1), g.contacts[0].lead);
    close(s.shaftPower, s.loadPower + s.internalPower);
    close(s.emf, -s.dFlux);
    for (const p of [...g.conductor, ...g.leads.flat()]) assert.ok(p.every(Number.isFinite));
    for (const p of g.conductor) assert.ok(Math.abs(p[0]) <= 1.2 + 1e-10); // within ±1.7 field faces
  }
  pointClose(electricGeometry(0).conductor[31], electricGeometry(1).conductor[31]);
});
test('lens rays converge at the thin-lens image and equal travel distances do not fake equal arrivals', () => {
  const rays = opticalGeometry();
  for (const r of rays) {
    close(r.ray.at(r.target[0]), r.target[1]);
    pointClose(rayPosition(r, 0), r.source);
    pointClose(rayPosition(r, r.lengths[0]), r.corner);
    pointClose(rayPosition(r, r.length), r.target);
    assert.equal(rayPosition(r, r.length + 1), null);
    close(Math.hypot(...rayPosition(r, 30).map((v, i) => v - r.source[i])), 30);
    assert.ok(r.length / LENS.speed < ART.seconds);
  }
  assert.ok(Math.max(...rays.map((r) => r.length)) - Math.min(...rays.map((r) => r.length)) > 10);
  close((LENS.speed * ART.seconds) / LENS.spacing, 4); // periodic source train, finite ray domains
});
test('the 16 vertices / 32 edges stay finite and inside their fixed, label-safe frame', () => {
  assert.equal(CUBE.vertices.length, 16);
  assert.equal(CUBE.edges.length, 32);
  for (let i = 0; i <= 360; i++)
    for (const [x, y, z] of dimensionGeometry(i / 360)) {
      assert.ok([x, y, z].every(Number.isFinite));
      assert.ok(x > 110 && x < 310 && y > 548 && y < 753);
    }
  dimensionGeometry(0).forEach((p, i) => pointClose(p, dimensionGeometry(1)[i]));
});
test('DCT reconstruction uses computed coefficients with a continuous periodic selection', () => {
  for (let i = 0; i < 160; i++) {
    const state = imageGeometry(i / 160);
    assert.ok(state.weights.every((w) => w >= 0 && w <= 1));
    assert.ok(state.values.every(Number.isFinite));
  }
  const full = imageGeometry((Math.PI - 0.65) / TAU);
  DCT_SOURCE.forEach((v, i) => close(v, full.values[i], 1e-9));
  imageGeometry(0).values.forEach((v, i) => close(v, imageGeometry(1).values[i]));
});
test('the visible string is the sum, with stationary nodes and conserved window energy', () => {
  const energies = [];
  for (let i = 0; i < 16; i++) {
    const g = waveGeometry(i / 16);
    for (const s of g.points) close(s.y, s.first.y + s.second.y);
    for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) close(interferenceAt(g.input, x).y, 0);
    energies.push(interferenceEnergy(g.input).total);
  }
  assert.ok(Math.max(...energies) - Math.min(...energies) < 1e-12);
  waveGeometry(0).points.forEach((p, i) => close(p.y, waveGeometry(1).points[i].y));
});
test('every frame contains all seven mechanisms, is deterministic, and closes exactly', () => {
  assert.equal(Object.keys(MECHANISMS).length, 7);
  for (let i = 0; i < ART.fps * ART.seconds; i++) {
    const svg = frameSVG(i / ART.fps);
    assert.equal((svg.match(/id="mechanism-/g) || []).length, 7);
    assert.ok(!/NaN|Infinity|undefined/.test(svg));
  }
  assert.equal(frameSVG(0), frameSVG(ART.seconds));
  assert.deepEqual(renderFrame(0), renderFrame(ART.seconds));
  assert.equal(frameSVG(2.35), frameSVG(2.35));
  assert.throws(() => frameSVG(NaN), RangeError);
});

test('the actual export marker points along a left-going wave in Resvg', () => {
  // Resvg 2.6.2 treats auto-start-reverse differently; only end markers are needed.
  const marker = frameSVG(0).match(/<marker id="goldArrow"[\s\S]*?<\/marker>/)[0];
  const raster = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><defs>${marker}</defs><path d="M90 25L30 25" fill="none" stroke="white" marker-end="url(#goldArrow)"/></svg>`,
  ).render();
  const pixels = raster.pixels,
    xs = [];
  for (let y = 0; y < 50; y++)
    for (let x = 0; x < 100; x++) {
      if (Math.abs(y - 25) > 1 && pixels[(y * 100 + x) * 4 + 3] > 64) xs.push(x);
    }
  assert.ok(xs.length > 0);
  assert.ok(Math.min(...xs) >= 30 && Math.max(...xs) <= 35);
});
