/**
 * Original, simultaneous README motion artwork. Native SVG → Resvg → GIF.
 * No website capture, browser, independent simulation history, or topic edits.
 *
 * node scripts/render-showcase.mjs --frame 0 --output /tmp/showcase-first.png
 * node scripts/render-showcase.mjs --poster
 * node scripts/render-showcase.mjs --keep-frames
 * node --test scripts/render-showcase.test.mjs
 *
 * Artistic scales / deliberately slowed clocks are documented in the companion
 * docs/media/vistep-showcase-provenance.md. Geometry always comes from the models.
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { involuteOutline, meshedAngle } from '../src/models/mechanisms.ts';
import { pistonGeometry, ENGINE } from '../src/models/four-stroke.ts';
import {
  GENERATOR,
  generatorDefaults,
  generatorState,
  generatorConductorPoint,
  generatorRotorLeads,
  generatorContacts,
  generatorExternalCircuit,
  rotateGeneratorPoint,
} from '../src/models/electric-generator.ts';
import { thinLens, lensRay } from '../src/models/optics.ts';
import { dct, idct, frequencyOrder, sampleBlock } from '../src/models/jpeg.ts';
import { hypercube, projectVertex } from '../src/models/dimensions.ts';
import {
  interferenceAt,
  INTERFERENCE_STRING,
  stringSpeed,
} from '../src/models/wave-interference.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ART = { width: 1280, height: 860, fps: 20, seconds: 8 };
export const TAU = 2 * Math.PI;
const C = {
  paper: '#e9eedc',
  muted: '#a8b9a9',
  green: '#bbd8ad',
  gold: '#e1bd80',
  blue: '#95c9db',
  purple: '#c2aed5',
  ink: '#152c25',
};
const fmt = (v) => (Math.abs(v) < 0.005 ? 0 : Number(v.toFixed(2)));
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const wrap = (v, period = 1) => ((v % period) + period) % period;
const smooth = (v) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const path = (points, close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${fmt(p[0])},${fmt(p[1])}`).join('') + (close ? 'Z' : '');
const mix = (a, b, t) => {
  const rgb = (s) =>
    s
      .replace('#', '')
      .match(/../g)
      .map((n) => parseInt(n, 16));
  return (
    '#' +
    rgb(a)
      .map((n, i) =>
        Math.round(n + (rgb(b)[i] - n) * clamp(t))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
const circle = (p, r, fill, stroke = 'none', sw = 1) =>
  `<circle cx="${fmt(p[0])}" cy="${fmt(p[1])}" r="${fmt(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line = (points, color, width = 1, extra = '') =>
  `<path d="${path(points)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const text = (x, y, value, size = 22, fill = C.paper, anchor = 'start', extra = '') =>
  `<text x="${fmt(x)}" y="${fmt(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${value}</text>`;
const label = (x, y, title, detail, anchor = 'start') =>
  text(x, y, title, 24, C.paper, anchor) + text(x, y + 28, detail, 18, C.muted, anchor);
const shadow = (x, y, rx, ry, opacity = 0.5) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#shadow)" opacity="${opacity}"/>`;

/** Fixed orthographic presentation: one physical unit shares one linear transform. */
export function project3([x, y, z], center, scale, yaw = -0.35, pitch = 0.55) {
  const xx = x * Math.cos(yaw) + z * Math.sin(yaw);
  const zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [
    center[0] + scale * xx,
    center[1] + scale * (-y * Math.cos(pitch) + zz * Math.sin(pitch)),
    y * Math.sin(pitch) + zz * Math.cos(pitch),
  ];
}

export const GEAR = { module: 0.08, a: 32, b: 20, bearing: Math.PI / 6, scale: 77 };
const gearOutline = new Map([GEAR.a, GEAR.b].map((n) => [n, involuteOutline(GEAR.module, n)]));
export function gearGeometry(phase) {
  const distance = (GEAR.module * (GEAR.a + GEAR.b)) / 2;
  const a = [-0.85, -0.16],
    b = [a[0] + distance * Math.cos(GEAR.bearing), a[1] + distance * Math.sin(GEAR.bearing)];
  const angle = Math.PI * phase + 0.12;
  return { a, b, angle, other: meshedAngle(angle, GEAR.a, GEAR.b, GEAR.bearing), distance };
}
function gears(phase) {
  const center = [224, 240],
    scale = GEAR.scale,
    g = gearGeometry(phase);
  const proj = (p) => project3(p, center, scale, -0.22, 0.4);
  const ring = (c, r, z, count = 64) =>
    Array.from({ length: count }, (_, i) =>
      proj([c[0] + r * Math.cos((TAU * i) / count), c[1] + r * Math.sin((TAU * i) / count), z]),
    );
  let svg = shadow(241, 332, 196, 34);
  for (const [n, c, angle, warm] of [
    [GEAR.a, g.a, g.angle, false],
    [GEAR.b, g.b, g.other, true],
  ]) {
    const r = (n * GEAR.module) / 2;
    const transform = (p, z) =>
      proj([
        c[0] + p.x * Math.cos(angle) - p.y * Math.sin(angle),
        c[1] + p.x * Math.sin(angle) + p.y * Math.cos(angle),
        z,
      ]);
    const front = gearOutline.get(n).map((p) => transform(p, 0.16));
    const back = gearOutline.get(n).map((p) => transform(p, -0.2));
    const faces = front
      .map((p, i) => {
        const j = (i + 1) % front.length;
        const light = clamp(0.42 + (front[j][0] - p[0]) / 8);
        const fill = mix(warm ? '#6f5b3c' : '#3b5d4e', warm ? C.gold : C.green, light);
        return {
          z: (p[2] + front[j][2]) / 2,
          svg: `<path d="${path([back[i], back[j], front[j], p], true)}" fill="${fill}" stroke="${fill}" stroke-width=".3"/>`,
        };
      })
      .sort((a, b) => a.z - b.z);
    svg += faces.map((f) => f.svg).join('');
    svg += `<path d="${path(front, true)}${path(ring(c, r * 0.22, 0.16), true)}" fill="url(#${warm ? 'brass' : 'alloy'})" fill-rule="evenodd" stroke="${warm ? '#f0dba9' : '#dcebcf'}" stroke-width=".8"/>`;
    svg += `<path d="${path(ring(c, r * 0.78, 0.165), true)}${path(ring(c, r * 0.71, 0.165), true)}" fill="${warm ? '#b49461' : '#7f9f84'}" fill-rule="evenodd" opacity=".55"/>`;
    const bolts = n === 32 ? 8 : 5;
    for (let i = 0; i < bolts; i++) {
      const a = angle + (TAU * i) / bolts;
      const pos = [c[0] + r * 0.51 * Math.cos(a), c[1] + r * 0.51 * Math.sin(a)];
      svg += `<path d="${path(ring(pos, r * 0.065, 0.17, 20), true)}" fill="#2b4538" stroke="${warm ? '#d6bd85' : '#abc3a2'}" stroke-width="1"/>`;
    }
    // Fixed shafts occupy the modeled central bores, behind the moving wheel.
    svg += `<path d="${path(ring(c, r * 0.21, 0.17), true)}" fill="url(#steel)" stroke="#a6baaa"/>`;
    svg += circle(proj([...c, 0.18]), 3, '#294338');
  }
  svg += label(76, 381, 'Gears', 'Meshed teeth. Opposite turns.');
  return svg;
}

export function crankGeometry(phase) {
  const angle = TAU * phase + 0.8;
  return { angle, ...pistonGeometry(angle) };
}
export const CRANK_VIEW = {
  scale: 970,
  x: 1070,
  axis: 320,
  headClearance: 30,
  pistonHalfHeight: 18,
};
function crank(phase) {
  const s = crankGeometry(phase),
    { scale, x, axis } = CRANK_VIEW;
  const p = ([xx, yy]) => [x + xx * scale, axis - yy * scale];
  const pin = p([0, s.pinY]),
    crankPin = p([s.crankX, s.crankY]);
  const r = ENGINE.crank * scale,
    half = (ENGINE.bore * scale) / 2;
  const top = axis - (ENGINE.rod + ENGINE.crank) * scale - CRANK_VIEW.headClearance;
  let svg = shadow(x, 370, 145, 28);
  // The transparent guide is a kinematic section, not a running combustion model.
  svg += `<path d="M${x - half - 10} ${axis - 60}V${top}H${x + half + 10}V${axis - 60}" fill="none" stroke="#81a59a" stroke-width="10" stroke-linejoin="round" opacity=".5"/>`;
  svg += `<path d="M${x - half - 4} ${axis - 62}V${top + 6}H${x + half + 4}V${axis - 62}" fill="none" stroke="#c4d8c4" stroke-width="1.4" opacity=".6"/>`;
  svg += circle([x, axis], r + 12, '#1a362b', '#819b7e', 1.5);
  svg += circle([x, axis], r + 3, 'none', '#486a53', 2);
  svg += line([[x, axis], crankPin], '#98815a', 21);
  svg += line([[x, axis], crankPin], C.gold, 13);
  svg += line([pin, crankPin], '#496f67', 18);
  svg += line([pin, crankPin], '#c6d3c1', 11);
  svg += `<rect x="${x - half}" y="${fmt(pin[1] - 18)}" width="${half * 2}" height="40" rx="5" fill="url(#steel)" stroke="#d8e1cc" stroke-width="1.2"/>`;
  for (const dy of [-11, -5])
    svg += line(
      [
        [x - half + 2, pin[1] + dy],
        [x + half - 2, pin[1] + dy],
      ],
      '#4b6659',
      2.1,
    );
  svg += circle(pin, 6.5, '#365249', '#d6dfc6', 1.5);
  svg += circle(crankPin, 7.5, '#c8ba91', '#eaddb6', 1.2);
  svg += circle([x, axis], 10, 'url(#steel)', '#bbccb5');
  svg += circle([x, axis], 3, '#274537');
  // Both travel limits use the same geometry and physical scale as the slider.
  svg += line(
    [
      [1150, top + 30],
      [1150, top + 30 + 2 * r],
    ],
    '#7f9d8b',
    1,
  );
  for (const yy of [top + 30, top + 30 + 2 * r])
    svg += line(
      [
        [1145, yy],
        [1155, yy],
      ],
      '#adc3aa',
      1,
    );
  svg += circle([1150, pin[1]], 3.5, C.gold);
  svg += label(984, 408, 'Slider–crank', 'Rotation becomes translation.');
  return svg;
}

export const generatorProject = (p) => project3(p, [645, 238], 33, -0.56, 0.54);
export function electricGeometry(phase) {
  const angle = TAU * phase + 0.45;
  const state = generatorState({ ...generatorDefaults, angle, connected: true });
  return {
    angle,
    state,
    conductor: Array.from({ length: 129 }, (_, i) =>
      rotateGeneratorPoint(generatorConductorPoint(i / 128), angle),
    ),
    leads: generatorRotorLeads().map((ps) => ps.map((p) => rotateGeneratorPoint(p, angle))),
    contacts: generatorContacts(),
    circuit: generatorExternalCircuit(false),
  };
}
function generator(phase) {
  const { angle, state, conductor, leads, contacts, circuit } = electricGeometry(phase),
    p = generatorProject;
  let svg = shadow(641, 325, 161, 28);
  const poly = (ps, fill, stroke = '#91b9a6', opacity = 1) =>
    `<path d="${path(ps.map(p), true)}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" opacity="${opacity}"/>`;
  // Cutaway field poles: translucent faces intentionally keep the whole coil visible.
  for (const side of [-1, 1]) {
    const xx = side * 1.7,
      outer = side * 2.45;
    svg += poly(
      [
        [xx, -1.35, -1.85],
        [xx, 1.35, -1.85],
        [xx, 1.35, 1.85],
        [xx, -1.35, 1.85],
      ],
      side < 0 ? '#668b76' : '#856c50',
      side < 0 ? '#9abb92' : '#d2b482',
      0.34,
    );
    svg += poly(
      [
        [xx, 1.35, -1.85],
        [outer, 1.35, -1.85],
        [outer, 1.35, 1.85],
        [xx, 1.35, 1.85],
      ],
      side < 0 ? '#789783' : '#a1875f',
      'none',
      0.5,
    );
    const mark = p([side * 2.1, 1.56, 0]);
    svg += text(mark[0], mark[1], side < 0 ? 'N' : 'S', 18, side < 0 ? C.green : C.gold, 'middle');
  }
  for (const z of [-1.25, 0, 1.25])
    svg += line(
      [p([-1.65, 0, z]), p([1.55, 0, z])],
      '#95bba0',
      1.2,
      'opacity=".4" marker-end="url(#fieldArrow)"',
    );
  svg += line([p([0, 0, -2.3]), p([0, 0, 3.75])], '#718e79', 5);
  const wire = (ps) => line(ps.map(p), '#5c4934', 6) + line(ps.map(p), '#e0b880', 3.6);
  svg += wire(conductor);
  for (const lead of leads) svg += wire(lead);
  for (const z of GENERATOR.ringZ) {
    const ring = Array.from({ length: 65 }, (_, i) =>
      p([
        GENERATOR.ringRadius * Math.cos((TAU * i) / 64),
        GENERATOR.ringRadius * Math.sin((TAU * i) / 64),
        z,
      ]),
    );
    svg += line(ring, '#594837', 7) + line(ring, '#d6b881', 4);
  }
  for (const contact of contacts) svg += line([p(contact.touch), p(contact.lead)], '#a6bdab', 5);
  // Feed → closed switch → resistor → return, no ornamental disconnected leads.
  const feed = [...circuit.feed, circuit.switchBottom],
    bottom = circuit.return[0];
  svg += line(feed.map(p), '#9bb8a3', 2.7);
  svg += line(circuit.return.map(p), '#9bb8a3', 2.7);
  svg += line([p(circuit.switchBottom), p(bottom)], '#566f5e', 10);
  svg += line(
    [p(circuit.switchBottom), p(bottom)],
    mix('#a49365', '#f3d596', state.loadPower / (2 * state.meanLoadPower)),
    7,
  );
  // A local meter shares the computed angle/EMF; this is not a second clock.
  const meter = [680, 329],
    meterWidth = 116,
    amp = 17;
  svg += line(
    [
      [meter[0], meter[1]],
      [meter[0] + meterWidth, meter[1]],
    ],
    '#486959',
    1,
  );
  const trace = Array.from({ length: 81 }, (_, i) => {
    const s = generatorState({
      ...generatorDefaults,
      angle: angle + TAU * (i / 80 - 1),
      connected: true,
    });
    return [meter[0] + (meterWidth * i) / 80, meter[1] - (amp * s.emf) / s.emfPeak];
  });
  svg += line(trace, '#86a990', 1.5);
  svg += circle([meter[0] + meterWidth, meter[1] - (amp * state.emf) / state.emfPeak], 3.7, C.gold);
  svg += label(532, 381, 'Induction', 'A turning loop makes current.');
  return svg;
}

export const LENS = {
  focal: 60,
  object: 180,
  sourceHeight: 24,
  heights: [-38, 0, 38],
  scale: 1.5,
  center: [696, 489],
  speed: 75,
  spacing: 150,
};
export function opticalGeometry() {
  const image = thinLens(LENS.focal, LENS.object);
  const source = [-LENS.object, LENS.sourceHeight],
    target = [image.image, image.magnification * LENS.sourceHeight];
  return LENS.heights.map((h) => {
    const ray = lensRay(LENS.focal, LENS.object, LENS.sourceHeight, h);
    const corner = [0, h];
    const lengths = [Math.hypot(LENS.object, h - source[1]), Math.hypot(target[0], target[1] - h)];
    return { ray, source, corner, target, lengths, length: lengths[0] + lengths[1] };
  });
}
export function rayPosition(ray, distance) {
  if (distance < 0 || distance > ray.length) return null;
  const leg = distance < ray.lengths[0] ? 0 : 1;
  const u = (distance - (leg ? ray.lengths[0] : 0)) / ray.lengths[leg];
  const a = leg ? ray.corner : ray.source,
    b = leg ? ray.target : ray.corner;
  return a.map((v, i) => v + u * (b[i] - v));
}
function optics(phase) {
  const rays = opticalGeometry(),
    p = ([x, y]) => [LENS.center[0] + x * LENS.scale, LENS.center[1] - y * LENS.scale];
  const [cx, cy] = LENS.center;
  let svg = label(76, 472, 'Light', 'Different paths. One focus.');
  svg += line([p([-199, 0]), p([115, 0])], '#698875', 1, 'stroke-dasharray="3 7" opacity=".6"');
  svg += `<path d="M${cx} ${cy - 65}Q${cx - 23} ${cy} ${cx} ${cy + 65}Q${cx + 23} ${cy} ${cx} ${cy - 65}Z" fill="url(#glass)" stroke="#b4d5cf" stroke-width="1.4"/>`;
  for (const r of rays) {
    const points = [r.source, r.corner, r.target].map(p);
    svg += `<path d="${path(points)}" fill="none" stroke="#9fc6cb" stroke-width="7" opacity=".045"/>`;
    svg += line(points, C.blue, 1.45, 'opacity=".48"');
    for (let i = 0; i < 4; i++) {
      // Same speed on every ray; no equal-transit-time fiction.
      const s = wrap(LENS.speed * ART.seconds * phase + i * LENS.spacing, LENS.speed * ART.seconds);
      const pos = rayPosition(r, s);
      if (!pos) continue;
      const opacity = smooth(s / 9) * smooth((r.length - s) / 9);
      svg += `<g opacity="${fmt(opacity)}">${circle(p(pos), 5, '#a8dce1', 'none')}${circle(p(pos), 2.2, '#edf9e9')}</g>`;
    }
  }
  const source = p(rays[0].source),
    target = p(rays[0].target);
  svg += line([[source[0], cy], source], '#c4d6bd', 2.5) + circle(source, 4, C.paper);
  svg += line([[target[0], cy], target], '#a5c5c7', 2.5) + circle(target, 4, C.blue);
  return svg;
}

export const CUBE = hypercube(4);
export function dimensionGeometry(phase) {
  return CUBE.vertices.map((v) =>
    project3(projectVertex(v, TAU * phase + 0.36), [209, 651], 44, -0.58, 0.47),
  );
}
function dimensions(phase) {
  const points = dimensionGeometry(phase);
  let svg = shadow(209, 764, 141, 27, 0.38);
  for (const bit of [0, 8]) {
    const ids = [bit, bit + 1, bit + 3, bit + 2];
    svg += `<path d="${path(
      ids.map((i) => points[i]),
      true,
    )}" fill="${bit ? '#a8c5ad' : '#719e90'}" opacity=".07"/>`;
  }
  for (const [a, b] of [...CUBE.edges].sort(
    ([a, b], [c, d]) => points[a][2] + points[b][2] - points[c][2] - points[d][2],
  )) {
    const inner = Boolean(a & 8) && Boolean(b & 8);
    svg += line(
      [points[a], points[b]],
      inner ? '#d5eac4' : '#7aa79a',
      inner ? 2.2 : 1.5,
      `opacity="${fmt(clamp(0.58 + (points[a][2] + points[b][2]) / 14, 0.23, 0.95))}"`,
    );
  }
  for (let i = 0; i < points.length; i++)
    svg += circle(points[i], i & 8 ? 3.4 : 2.5, i & 8 ? '#e3edcf' : '#91b8a4');
  return svg + label(76, 786, 'A fourth dimension', 'Rotation reveals a new view.');
}

export const DCT_SOURCE = sampleBlock('edge');
export const DCT_COEFFICIENTS = dct(DCT_SOURCE);
export function imageGeometry(phase) {
  // An explicit periodic coefficient-selection control, not JPEG file-size animation.
  const keep = 1 + 63 * (0.5 - 0.5 * Math.cos(TAU * phase + 0.65));
  const weights = Array.from({ length: 64 }, (_, i) => smooth(keep - frequencyOrder.indexOf(i)));
  const coefficients = DCT_COEFFICIENTS.map((c, i) => c * weights[i]);
  return { keep, weights, coefficients, values: idct(coefficients) };
}
function information(phase) {
  const image = imageGeometry(phase);
  const p = (x, y, z) => project3([x, y, z], [641, 682], 36, -0.52, 0.64);
  const faces = [];
  for (let z = 0; z < 8; z++)
    for (let x = 0; x < 8; x++) {
      const v = clamp(image.values[z * 8 + x] / 255),
        h = 0.12 + v * 1.28;
      const xx = (x - 3.5) * 0.63,
        zz = (z - 3.5) * 0.63,
        w = 0.285;
      const base = [
        p(xx - w, 0, zz - w),
        p(xx + w, 0, zz - w),
        p(xx + w, 0, zz + w),
        p(xx - w, 0, zz + w),
      ];
      const top = [
        p(xx - w, h, zz - w),
        p(xx + w, h, zz - w),
        p(xx + w, h, zz + w),
        p(xx - w, h, zz + w),
      ];
      const color = mix('#426b63', '#e3e7bc', v);
      faces.push({
        z: p(xx, h / 2, zz)[2],
        svg: `<path d="${path([base[1], base[2], top[2], top[1]], true)}" fill="${mix('#213e32', color, 0.48)}"/><path d="${path([base[2], base[3], top[3], top[2]], true)}" fill="${mix('#213e32', color, 0.66)}"/><path d="${path(top, true)}" fill="${color}" stroke="#d0ddbb" stroke-opacity=".28" stroke-width=".6"/>`,
      });
    }
  let svg =
    shadow(641, 752, 153, 29, 0.4) +
    faces
      .sort((a, b) => a.z - b.z)
      .map((f) => f.svg)
      .join('');
  return svg + label(531, 786, 'Image reconstruction', 'DCT basis → an image');
}

export function waveGeometry(phase) {
  const period = INTERFERENCE_STRING.wavelength / stringSpeed();
  const input = { mode: 'standing', time: phase * period + 0.013, ratio: 1, phase: 0, probe: 0.4 };
  const points = Array.from({ length: 161 }, (_, i) =>
    interferenceAt(input, -1.6 + (3.2 * i) / 160),
  );
  return { input, points };
}
function waves(phase) {
  const { input, points } = waveGeometry(phase);
  const left = 898,
    width = 300,
    y = 674,
    amp = 5200;
  const p = (s, component = 'sum') => [
    left + ((s.x + 1.6) / 3.2) * width,
    y - amp * (component === 'sum' ? s.y : s[component].y),
  ];
  let svg = line(
    [
      [left, y],
      [left + width, y],
    ],
    '#50705f',
    1,
  );
  svg += line(
    points.map((s) => p(s, 'first')),
    C.blue,
    1.35,
    'opacity=".44"',
  );
  svg += line(
    points.map((s) => p(s, 'second')),
    C.gold,
    1.35,
    'opacity=".44"',
  );
  svg += line(
    points.map((s) => p(s)),
    C.green,
    3,
  );
  for (const xx of [-1.6, -0.8, 0, 0.8, 1.6])
    svg += circle(p(interferenceAt(input, xx)), 3, '#dbe6c9');
  for (const xx of [-1.2, 0.4])
    svg += circle(p(interferenceAt(input, xx)), 4, '#d6e8c2', '#6c9678', 1);
  svg += line(
    [
      [left, 616],
      [left + 59, 616],
    ],
    C.blue,
    1.3,
    'marker-end="url(#blueArrow)"',
  );
  svg += line(
    [
      [left + width, 616],
      [left + width - 59, 616],
    ],
    C.gold,
    1.3,
    'marker-end="url(#goldArrow)"',
  );
  return svg + label(898, 786, 'Waves add', 'Moving waves. Still nodes.');
}

export const MECHANISMS = { gears, generator, crank, optics, dimensions, information, waves };
export function frameSVG(seconds) {
  if (!Number.isFinite(seconds)) throw new RangeError('Frame time must be finite.');
  const phase = wrap(seconds, ART.seconds) / ART.seconds;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ART.width}" height="${ART.height}" viewBox="0 0 ${ART.width} ${ART.height}">
  <defs>
    <radialGradient id="ambient" cx="51%" cy="43%" r="79%"><stop stop-color="#213e31"/><stop offset=".68" stop-color="#142c23"/><stop offset="1" stop-color="#0f211c"/></radialGradient>
    <linearGradient id="alloy" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#eef1d4"/><stop offset=".4" stop-color="#c2d0b2"/><stop offset=".7" stop-color="#d8e1c3"/><stop offset="1" stop-color="#91ac93"/></linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#f5ddb0"/><stop offset=".55" stop-color="#d4b17c"/><stop offset="1" stop-color="#a38960"/></linearGradient>
    <linearGradient id="steel"><stop stop-color="#c9d7bf"/><stop offset=".35" stop-color="#a0b69e"/><stop offset=".63" stop-color="#e0e6ca"/><stop offset="1" stop-color="#91aa94"/></linearGradient>
    <linearGradient id="glass"><stop stop-color="#a9ddd8" stop-opacity=".06"/><stop offset=".45" stop-color="#9acac6" stop-opacity=".23"/><stop offset=".65" stop-color="#e0f0db" stop-opacity=".08"/><stop offset="1" stop-color="#9acac6" stop-opacity=".12"/></linearGradient>
    <radialGradient id="shadow"><stop stop-color="#07170f" stop-opacity=".8"/><stop offset="1" stop-color="#07170f" stop-opacity="0"/></radialGradient>
    ${[
      ['field', '#9abb9b'],
      ['blue', C.blue],
      ['gold', C.gold],
    ]
      .map(
        ([name, color]) =>
          `<marker id="${name}Arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L6 4L1 7" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
      )
      .join('')}
    <style>text{font-family:Manrope,'Noto Sans Symbols 2',sans-serif;font-weight:500;letter-spacing:-.25px}</style>
  </defs>
  <rect width="1280" height="860" fill="url(#ambient)"/>
  ${text(76, 70, 'vistep.ai', 40, '#eef2de', 'start', 'letter-spacing="-1.7"')}
  ${text(1203, 65, 'See what makes it work.', 25, '#d0ddc2', 'end')}
  ${line(
    [
      [76, 95],
      [1204, 95],
    ],
    '#74907c',
    1,
    'opacity=".24"',
  )}
  ${Object.entries(MECHANISMS)
    .map(([name, render]) => `<g id="mechanism-${name}">${render(phase)}</g>`)
    .join('')}
  ${text(76, 843, 'Visualize Every Step with AI', 17, '#9eb29e')}
  ${text(1204, 843, 'Motion slowed · idealized models', 17, '#9eb29e', 'end')}
  </svg>`;
}
export function renderFrame(seconds) {
  return new Resvg(frameSVG(seconds), {
    font: {
      fontFiles: ['Manrope.ttf', 'ManropeGreek.ttf', 'NotoArrow.ttf'].map((f) =>
        join(ROOT, 'scripts/assets', f),
      ),
      loadSystemFonts: false,
      defaultFontFamily: 'Manrope',
    },
  })
    .render()
    .asPng();
}
function ffmpegExecutable() {
  if (process.env.VISTEP_FFMPEG) return process.env.VISTEP_FFMPEG;
  if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0) return 'ffmpeg';
  const python = join(ROOT, '.venv-voice/bin/python');
  if (existsSync(python)) {
    const found = spawnSync(
      python,
      ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],
      { encoding: 'utf8' },
    ).stdout?.trim();
    if (found) return found;
  }
  throw new Error('Set VISTEP_FFMPEG to an FFmpeg executable; no browser is used.');
}
function save(filename, bytes) {
  mkdirSync(dirname(filename), { recursive: true });
  writeFileSync(filename, bytes);
}
function main() {
  const args = process.argv.slice(2),
    frame = args.indexOf('--frame'),
    output = args.indexOf('--output');
  if (frame >= 0) {
    const time = Number(args[frame + 1]);
    if (!Number.isFinite(time) || time < 0 || time > ART.seconds)
      throw new Error(`Frame time must be in [0,${ART.seconds}].`);
    const filename =
      output >= 0 ? resolve(args[output + 1]) : join(ROOT, 'docs/media/vistep-showcase-poster.png');
    save(filename, renderFrame(time));
    console.log(filename);
    return;
  }
  const poster = join(ROOT, 'docs/media/vistep-showcase-poster.png');
  save(poster, renderFrame(0));
  if (args.includes('--poster')) {
    console.log(poster);
    return;
  }
  const temporary = mkdtempSync(join(tmpdir(), 'vistep-showcase-frames-'));
  try {
    for (let i = 0; i < ART.fps * ART.seconds; i++) {
      save(join(temporary, `${String(i).padStart(4, '0')}.png`), renderFrame(i / ART.fps));
      if (i % ART.fps === 0) console.log(`Rendered ${i / ART.fps} / ${ART.seconds} seconds`);
    }
    const gif = join(ROOT, 'docs/media/vistep-showcase.gif');
    const encoded = spawnSync(
      ffmpegExecutable(),
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-framerate',
        String(ART.fps),
        '-i',
        join(temporary, '%04d.png'),
        '-filter_complex',
        'split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
        '-gifflags',
        '+transdiff',
        '-loop',
        '0',
        gif,
      ],
      { stdio: 'inherit' },
    );
    if (encoded.status !== 0) throw new Error('GIF encoding failed.');
    console.log(gif);
  } finally {
    if (args.includes('--keep-frames')) console.log(`Frames: ${temporary}`);
    else rmSync(temporary, { recursive: true, force: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
