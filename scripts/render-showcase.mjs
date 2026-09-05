/** Original README motion artwork. No webpage capture or browser renderer is used. */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { involuteOutline, meshedAngle } from '../src/models/mechanisms.ts';
import { dct, idct, frequencyOrder, sampleBlock } from '../src/models/jpeg.ts';
import { hypercube, projectVertex } from '../src/models/dimensions.ts';

const W = 1080,
  H = 600,
  FPS = 15,
  DURATION = 15;
const tau = Math.PI * 2;
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const fmt = (v) => Number(v.toFixed(2));
const path = (points, close = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${fmt(p[0])},${fmt(p[1])}`).join('') + (close ? 'Z' : '');
const mixColor = (a, b, t) => {
  const c = (s) => s.match(/\w\w/g).map((x) => parseInt(x, 16));
  return (
    '#' +
    c(a)
      .map((n, i) =>
        Math.round(n + (c(b)[i] - n) * clamp(t))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
function project(p, t, scale = 100, center = [787, 300], kind = 'gear') {
  const yaw = (kind === 'gear' ? -0.27 : -0.6) + 0.05 * Math.sin((tau * t) / DURATION);
  const pitch = kind === 'gear' ? 0.4 : 0.64;
  // Gear faces lie in XY; image columns stand on XZ.
  const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
  const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
  return [
    center[0] + scale * x,
    center[1] + scale * (-p[1] * Math.cos(pitch) + z * Math.sin(pitch)),
    p[1] * Math.sin(pitch) + z * Math.cos(pitch),
  ];
}
function ring(cx, cy, r, z, t, scale, count = 96) {
  return Array.from({ length: count }, (_, i) =>
    project(
      [cx + r * Math.cos((tau * i) / count), cy + r * Math.sin((tau * i) / count), z],
      t,
      scale,
    ),
  );
}
const outlines = new Map([32, 20].map((n) => [n, involuteOutline(0.08, n)]));
function cog(n, center, angle, t, warm = false) {
  const scale = 119;
  const r = n * 0.04;
  const transform = (p, z) =>
    project(
      [
        center[0] + p.x * Math.cos(angle) - p.y * Math.sin(angle),
        center[1] + p.x * Math.sin(angle) + p.y * Math.cos(angle),
        z,
      ],
      t,
      scale,
    );
  const outline = outlines.get(n);
  const front = outline.map((p) => transform(p, 0.13));
  const back = outline.map((p) => transform(p, -0.24));
  const faces = [];
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length;
    const a = outline[i],
      b = outline[j];
    const normal = Math.atan2(b.y - a.y, b.x - a.x) + angle - Math.PI / 2;
    const light = 0.25 + 0.65 * Math.max(0, Math.cos(normal - 2.2));
    const shade = mixColor(warm ? '685a3d' : '384f48', warm ? 'ddc28c' : 'b8c6ae', light);
    faces.push({
      depth: (front[i][2] + front[j][2]) / 2,
      svg: `<path d="${path([back[i], back[j], front[j], front[i]])}" fill="${shade}" stroke="${shade}" stroke-width=".25"/>`,
    });
  }
  faces.sort((a, b) => a.depth - b.depth);
  let svg = faces.map((f) => f.svg).join('');
  const hole = ring(...center, r * 0.25, 0.13, t, scale);
  svg += `<path d="${path(front)}${path(hole)}" fill="url(#${warm ? 'brass' : 'alloy'})" fill-rule="evenodd" stroke="${warm ? '#eddcb4' : '#dfebcf'}" stroke-width=".65"/>`;
  const outer = ring(...center, r * 0.77, 0.135, t, scale),
    inner = ring(...center, r * 0.69, 0.14, t, scale);
  svg += `<path d="${path(outer)}${path(inner)}" fill="${warm ? '#cfb884' : '#9aac98'}" fill-rule="evenodd" opacity=".65"/>`;
  svg += `<path d="${path(ring(...center, r * 0.38, 0.16, t, scale))}${path(ring(...center, r * 0.26, 0.16, t, scale))}" fill="url(#steel)" fill-rule="evenodd" stroke="#d8dfca" stroke-width=".5"/>`;
  const bolts = n === 32 ? 8 : 5;
  for (let i = 0; i < bolts; i++) {
    const a = angle + (tau * i) / bolts;
    const c = [center[0] + r * 0.52 * Math.cos(a), center[1] + r * 0.52 * Math.sin(a)];
    svg += `<path d="${path(ring(...c, r * 0.052, 0.14, t, scale, 16))}" fill="#223c34" stroke="#8d9d82" stroke-width=".7"/>`;
  }
  return svg;
}
function mechanics(t) {
  const bearing = Math.PI / 6,
    distance = ((32 + 20) * 0.08) / 2;
  const a = [-1.02, -0.15],
    b = [a[0] + distance * Math.cos(bearing), a[1] + distance * Math.sin(bearing)];
  const angle = (tau * t) / DURATION / 2;
  let svg = cog(32, a, angle, t) + cog(20, b, meshedAngle(angle, 32, 20, bearing), t, true);
  const p = project(
    [a[0] + 1.28 * Math.cos(bearing), a[1] + 1.28 * Math.sin(bearing), 0.16],
    t,
    119,
  );
  svg += `<circle cx="${fmt(p[0])}" cy="${fmt(p[1])}" r="10" fill="#d5ffc4" opacity=".12"/><circle cx="${fmt(p[0])}" cy="${fmt(p[1])}" r="3.5" fill="#edffdf"/>`;
  svg += `<text x="986" y="486" text-anchor="end" class="detail">32 : 20</text>`;
  return svg;
}
const coefficients = dct(sampleBlock('edge'));
const reconstructions = Array.from({ length: 65 }, (_, k) =>
  idct(coefficients.map((v, i) => (frequencyOrder.indexOf(i) < k ? v : 0))),
);
function information(t) {
  const keep = 1 + 63 * ease((t - 5) / 3.5),
    k = Math.floor(keep);
  const values = reconstructions[k].map(
    (v, i) => v + (reconstructions[Math.min(64, k + 1)][i] - v) * (keep - k),
  );
  const faces = [];
  const p = (x, y, z) => project([x, y, z], t, 83, [794, 341], 'grid');
  for (let z = 0; z < 8; z++)
    for (let x = 0; x < 8; x++) {
      const v = clamp(values[z * 8 + x] / 255),
        h = 0.16 + v * 1.24;
      const xx = (x - 3.5) * 0.47,
        zz = (z - 3.5) * 0.47,
        w = 0.22;
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
      const depth = p(xx, h / 2, zz)[2];
      const color = mixColor('476961', 'e3eac0', v);
      faces.push({
        depth,
        svg: `<path d="${path([base[1], base[2], top[2], top[1]])}" fill="${mixColor('19322d', color, 0.55)}"/><path d="${path([base[2], base[3], top[3], top[2]])}" fill="${mixColor('19322d', color, 0.72)}"/><path d="${path(top)}" fill="${color}" stroke="#d8f0c5" stroke-width=".3"/>`,
      });
    }
  faces.sort((a, b) => a.depth - b.depth);
  let svg = faces.map((f) => f.svg).join('');
  // A real DCT basis remains recognizable as its samples rise from a common plane.
  svg += `<text x="986" y="486" text-anchor="end" class="detail">${Math.round(keep)} / 64 frequencies</text>`;
  return svg;
}
const cube = hypercube(4);
function dimensions(t) {
  const angle = (tau * t) / DURATION;
  const points = cube.vertices.map((v) =>
    project(projectVertex(v, angle), t, 79, [790, 288], 'grid'),
  );
  let svg = '';
  for (let fixed = 0; fixed < 4; fixed++)
    for (let other = fixed + 1; other < 4; other++) {
      const free = [0, 1, 2, 3].filter((d) => d !== fixed && d !== other);
      for (let s = 0; s < 4; s++) {
        const base = (s & 1 ? 1 << fixed : 0) | (s & 2 ? 1 << other : 0);
        const ids = [
          base,
          base | (1 << free[0]),
          base | (1 << free[0]) | (1 << free[1]),
          base | (1 << free[1]),
        ];
        svg += `<path d="${path(ids.map((i) => points[i]))}" fill="#99d6b5" opacity=".028"/>`;
      }
    }
  const edges = cube.edges
    .map(([a, b]) => ({ a, b, depth: (points[a][2] + points[b][2]) / 2 }))
    .sort((a, b) => a.depth - b.depth);
  for (const { a, b, depth } of edges) {
    const active = a & 8 && b & 8,
      opacity = 0.24 + clamp((depth + 2) / 4) * 0.6;
    svg += `<path d="${path([points[a], points[b]], false)}" fill="none" stroke="${active ? '#dff3c2' : '#8db49f'}" opacity="${fmt(opacity)}" stroke-width="${active ? 2 : 1}"/>`;
  }
  points.forEach((p, i) => {
    svg += `<circle cx="${fmt(p[0])}" cy="${fmt(p[1])}" r="${i & 8 ? 3.3 : 2.1}" fill="${i & 8 ? '#f2ffe0' : '#92bea9'}"/>`;
  });
  svg += '<text x="986" y="486" text-anchor="end" class="detail">4D → 3D</text>';
  return svg;
}
const scenes = [mechanics, information, dimensions];
const chapters = [
  ['MECHANICS', 'Follow the force.', 'See what changes.'],
  ['INFORMATION', 'Watch an image emerge.', 'One frequency at a time.'],
  ['DIMENSIONS', 'A fourth dimension.', 'A new point of view.'],
];
function shot(index, t, opacity) {
  const c = chapters[index];
  return `<g opacity="${fmt(opacity)}"><g clip-path="url(#stage)">${scenes[index](t)}</g><text x="56" y="429" class="copy">${c[1]}</text><text x="56" y="458" class="copy">${c[2]}</text><text x="1024" y="557" text-anchor="end" class="chapter">0${index + 1} / ${c[0]}</text></g>`;
}
export function frameSVG(t) {
  const index = Math.floor(t / 5) % 3,
    fade = ease(((t % 5) - 4.05) / 0.95);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="ambient" cx="74%" cy="46%" r="66%"><stop stop-color="#203d34"/><stop offset=".62" stop-color="#11261f"/><stop offset="1" stop-color="#0b1b17"/></radialGradient>
    <linearGradient id="alloy" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1f3d9"/><stop offset=".48" stop-color="#b5c4ab"/><stop offset=".72" stop-color="#d5ddc4"/><stop offset="1" stop-color="#91a895"/></linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#f1dfb2"/><stop offset=".53" stop-color="#c9ab76"/><stop offset="1" stop-color="#9a875d"/></linearGradient>
    <linearGradient id="steel"><stop stop-color="#e7ebd8"/><stop offset=".4" stop-color="#78917f"/><stop offset=".7" stop-color="#bdceae"/><stop offset="1" stop-color="#91a792"/></linearGradient>
    <radialGradient id="shadow"><stop stop-color="#020d09" stop-opacity=".68"/><stop offset="1" stop-color="#020d09" stop-opacity="0"/></radialGradient>
    <clipPath id="stage"><rect x="447" y="92" width="601" height="413"/></clipPath>
    <style>text {font-family:Manrope,sans-serif;font-weight:500}.copy{font-size:19px;fill:#abc0ad;letter-spacing:-.25px}.detail{font-size:14px;fill:#a6c4ae;letter-spacing:.3px}.chapter{font-size:12px;fill:#a0bca7;letter-spacing:1.8px}</style>
  </defs>
  <rect width="${W}" height="${H}" rx="22" fill="url(#ambient)"/>
  <text x="56" y="75" font-size="35" fill="#ebf3df" letter-spacing="-1.5">vistep.ai</text>
  <text x="1024" y="67" font-size="11" fill="#93af9e" text-anchor="end" letter-spacing="2.8">A WORLD WORTH OPENING</text>
  <text x="52" y="207" font-size="73" fill="#f1f3df" letter-spacing="-4">See what</text>
  <text x="52" y="285" font-size="73" fill="#f1f3df" letter-spacing="-4">makes it</text>
  <text x="52" y="363" font-size="73" fill="#cbe5b4" letter-spacing="-4">work.</text>
  <ellipse cx="786" cy="422" rx="255" ry="71" fill="url(#shadow)"/>
  ${shot(index, t, 1 - fade)}${fade > 0 ? shot((index + 1) % 3, t, fade) : ''}
  <path d="M56 511 H1024" stroke="#b6d1b2" stroke-opacity=".15"/>
  <text x="56" y="557" font-size="17" fill="#c8d6bf" letter-spacing="-.3">Visualize Every Step with AI</text>
  </svg>`;
}
function render(t) {
  return new Resvg(frameSVG(t), {
    font: {
      fontFiles: ['Manrope.ttf', 'NotoArrow.ttf'].map((f) => resolve('scripts/assets', f)),
      loadSystemFonts: false,
      defaultFontFamily: 'Manrope',
    },
  })
    .render()
    .asPng();
}
const args = process.argv.slice(2),
  sample = args.indexOf('--frame');
if (sample >= 0) {
  const t = Number(args[sample + 1]);
  if (!Number.isFinite(t) || t < 0 || t >= DURATION)
    throw new Error('Frame time must be in [0,15).');
  mkdirSync('artifacts/showcase', { recursive: true });
  writeFileSync(`artifacts/showcase/frame-${t}.png`, render(t));
  console.log(resolve(`artifacts/showcase/frame-${t}.png`));
} else {
  const temporary = mkdtempSync(join(tmpdir(), 'vistep-showcase-'));
  try {
    for (let i = 0; i < FPS * DURATION; i++) {
      writeFileSync(join(temporary, `${String(i).padStart(4, '0')}.png`), render(i / FPS));
      if (i % FPS === 0) console.log(`Rendered ${i / FPS} / ${DURATION} seconds`);
    }
    const python = resolve('.venv-voice/bin/python');
    const executable =
      process.env.VISTEP_FFMPEG ||
      spawnSync(python, ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], {
        encoding: 'utf8',
      }).stdout?.trim() ||
      'ffmpeg';
    mkdirSync('docs/media', { recursive: true });
    const result = spawnSync(
      executable,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-framerate',
        String(FPS),
        '-i',
        join(temporary, '%04d.png'),
        '-filter_complex',
        'scale=900:500:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
        '-loop',
        '0',
        join(temporary, 'raw.gif'),
      ],
      { stdio: 'inherit' },
    );
    if (result.status !== 0)
      throw new Error('GIF encoding failed. Set VISTEP_FFMPEG to an FFmpeg executable.');
    const optimized = spawnSync(
      process.env.VISTEP_GIFSICLE || 'gifsicle',
      ['--optimize=3', join(temporary, 'raw.gif'), '--output', 'docs/media/vistep-showcase.gif'],
      { stdio: 'inherit' },
    );
    if (optimized.status !== 0)
      throw new Error('GIF optimization failed. Set VISTEP_GIFSICLE to a Gifsicle executable.');
    writeFileSync('docs/media/vistep-showcase-poster.png', render(1));
    console.log(resolve('docs/media/vistep-showcase.gif'));
  } finally {
    if (args.includes('--keep-frames')) console.log('Frames: ' + temporary);
    else rmSync(temporary, { recursive: true, force: true });
  }
}
