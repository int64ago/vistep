import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  CH,
  chTextbookHex,
  mulberry32,
  type ChField,
  type ChLayout,
  type ChRect,
} from '../../models/cell-handover';

/** Identity colours on the dusk map; colour marks a cell, never a frequency. */
export const CH_PALETTE = ['#f2a383', '#8cc4ea', '#b1d895', '#c7abf0', '#eed17f', '#86d8c9'];
export const chRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** RSRP → glow colour: the brighter the pool, the stronger the long-term signal. */
const ramp: [number, [number, number, number], number][] = [
  [-106, [40, 48, 66], 0.05],
  [-96, [58, 72, 94], 0.32],
  [-86, [98, 110, 124], 0.5],
  [-76, [172, 154, 122], 0.62],
  [-62, [240, 208, 152], 0.8],
];
export function chGlow(dbm: number): [number, number, number, number] {
  if (dbm <= ramp[0][0]) return [...ramp[0][1], ramp[0][2]];
  for (let k = 1; k < ramp.length; k++)
    if (dbm <= ramp[k][0]) {
      const [d0, c0, a0] = ramp[k - 1],
        [d1, c1, a1] = ramp[k];
      const u = (dbm - d0) / (d1 - d0);
      return [
        c0[0] + (c1[0] - c0[0]) * u,
        c0[1] + (c1[1] - c0[1]) * u,
        c0[2] + (c1[2] - c0[2]) * u,
        a0 + (a1 - a0) * u,
      ];
    }
  const last = ramp[ramp.length - 1];
  return [...last[1], last[2]];
}
export const CH_GLOW_STOPS = ramp.map(([d, c]) => ({ dbm: d, color: `rgb(${c.join(',')})` }));

export type ChCamera = { cx: number; cy: number; scale: number };
export type ChProject = (x: number, y: number) => [number, number];

export type ChLayer = {
  field: ChField | null;
  opacity: number;
  reveal?: number;
  /** Cell → [tint colour, strength 0–1]. */
  highlight?: Map<number, [string, number]>;
  /** 'glow' shows signal strength; 'flat' shows only regions (idle-mode tracking areas). */
  paint?: 'glow' | 'flat';
  /** Vector boundaries (x1, y1, x2, y2 segments in metres) stroked over the fill. */
  edges?: { segments: Float32Array; width: number; alpha: number }[];
  /** A region left to a finer layer drawn later (so translucent layers never stack). */
  exclude?: ChRect;
};

/**
 * Paint a best-server field's fill once per highlight set: glow from the strongest cell's RSRP, or
 * flat regions. Boundaries are drawn separately as vector contours, so zoom never shows pixels.
 */
function paintField(layer: ChLayer) {
  const field = layer.field!;
  const canvas = document.createElement('canvas');
  canvas.width = field.cols;
  canvas.height = field.rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const image = ctx.createImageData(field.cols, field.rows),
    data = image.data;
  const tints = new Map(
    [...(layer.highlight ?? new Map()).entries()].map(([c, [hex, w]]) => [c, [...chRgb(hex), w]]),
  );
  const flat = layer.paint === 'flat';
  for (let k = 0; k < field.best.length; k++) {
    let [r, g, b, a] = flat ? [50, 60, 82, 0.5] : chGlow(field.bestDbm[k]);
    const t = tints.get(field.best[k]);
    if (t) {
      const h = t[3],
        w = (flat ? 0.55 : 0.42) * h;
      r += (t[0] - r) * w;
      g += (t[1] - g) * w;
      b += (t[2] - b) * w;
      a = Math.max(a, (flat ? 0.7 : 0.55) * h + a * (1 - h));
    }
    data[k * 4] = r;
    data[k * 4 + 1] = g;
    data[k * 4 + 2] = b;
    data[k * 4 + 3] = a * 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

const edgePaths = new WeakMap<Float32Array, Path2D>();
function edgePath(segments: Float32Array) {
  let path = edgePaths.get(segments);
  if (!path) {
    path = new Path2D();
    for (let k = 0; k + 3 < segments.length; k += 4) {
      path.moveTo(segments[k], segments[k + 1]);
      path.lineTo(segments[k + 2], segments[k + 3]);
    }
    edgePaths.set(segments, path);
  }
  return path;
}

/** Deterministic dusk city: blocks between streets, drawn crisply at any zoom. */
function cityBlocks() {
  const rand = mulberry32(CH.seed + 3);
  const blocks: [number, number, number, number][] = [];
  let y = -40;
  while (y < CH.heightM + 40) {
    const h = 70 + rand() * 70;
    let x = -40 + rand() * 30;
    while (x < CH.widthM + 40) {
      const w = 60 + rand() * 90;
      if (rand() > 0.06) blocks.push([x + 7, y + 7, w - 14, h - 14]);
      x += w;
    }
    y += h;
  }
  return blocks;
}

export default function CellHandoverMap({
  width,
  height,
  camera,
  layout,
  fields,
  hex = 0,
  hexLayout,
  hexMix = 0,
  label,
  children,
}: {
  width: number;
  height: number;
  camera: ChCamera;
  layout: ChLayout;
  /** Layers drawn in order; each can crossfade and reveal from the west. */
  fields: ChLayer[];
  hex?: number;
  /** A second textbook layout to crossfade to (denser sites). */
  hexLayout?: ChLayout;
  hexMix?: number;
  label: string;
  children: (project: ChProject) => ReactNode;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const blocks = useMemo(cityBlocks, []);
  const painted = useRef(new WeakMap<ChField, Map<string, HTMLCanvasElement>>());
  const layers = fields.map((raw) => {
    if (!raw.field || raw.opacity <= 0.001) return null;
    // Quantise tint strengths so a fading highlight repaints a handful of times, not every frame.
    const highlight = new Map(
      [...(raw.highlight ?? new Map()).entries()]
        .map(([c, [hex, h]]) => [c, [hex, Math.round(h * 10) / 10]] as [number, [string, number]])
        .filter(([, [, h]]) => h > 0),
    );
    const layer = { ...raw, highlight };
    const key = `${layer.paint ?? 'glow'}|${[...highlight.entries()]
      .map(([c, [hex, h]]) => `${c}:${hex}:${h}`)
      .join(',')}`;
    let byField = painted.current.get(raw.field);
    if (!byField) painted.current.set(raw.field, (byField = new Map()));
    let image = byField.get(key);
    if (!image && typeof document !== 'undefined') {
      image = paintField(layer);
      byField.set(key, image);
      if (byField.size > 12) byField.delete(byField.keys().next().value!);
    }
    return image ? { ...layer, image } : null;
  });

  const project: ChProject = (x, y) => [
    (x - camera.cx) * camera.scale + width / 2,
    (y - camera.cy) * camera.scale + height / 2,
  ];
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (el.width !== Math.round(width * dpr)) el.width = Math.round(width * dpr);
    if (el.height !== Math.round(height * dpr)) el.height = Math.round(height * dpr);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    const s = camera.scale * dpr;
    ctx.setTransform(
      s,
      0,
      0,
      s,
      (width / 2 - camera.cx * camera.scale) * dpr,
      (height / 2 - camera.cy * camera.scale) * dpr,
    );
    ctx.fillStyle = '#20283a';
    ctx.fillRect(-200, -200, CH.widthM + 400, CH.heightM + 400);
    ctx.fillStyle = '#262f42';
    const r = 6;
    ctx.beginPath();
    // Manual rounded rectangles: CanvasRenderingContext2D.roundRect is newer than Safari 15.4.
    for (const [x, y, w, h] of blocks) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    ctx.fill();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    for (const layer of layers) {
      if (!layer || layer.opacity <= 0.001) continue;
      const f = layer.field!;
      const reveal = layer.reveal ?? 1;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      if (reveal < 1) {
        ctx.beginPath();
        ctx.rect(f.rect.x - 1, f.rect.y - 1, f.rect.w * reveal + 1, f.rect.h + 2);
        ctx.clip();
      }
      if (layer.exclude) {
        const e = layer.exclude;
        ctx.beginPath();
        ctx.rect(-400, -400, CH.widthM + 800, CH.heightM + 800);
        ctx.rect(e.x, e.y, e.w, e.h);
        ctx.clip('evenodd');
      }
      ctx.drawImage(layer.image, f.rect.x, f.rect.y, f.cols * f.step, f.rows * f.step);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const e of layer.edges ?? []) {
        ctx.strokeStyle = `rgba(240, 232, 216, ${e.alpha})`;
        ctx.lineWidth = e.width / camera.scale;
        ctx.stroke(edgePath(e.segments));
      }
      ctx.restore();
    }
  });
  const hexPaths = (l: ChLayout) =>
    l.cells
      .map((c) => {
        const pts = chTextbookHex(l, c).map(([x, y]) => project(x, y));
        return `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L')}Z`;
      })
      .join('');
  return (
    <div className="ch-map" style={{ height }}>
      <canvas ref={canvas} style={{ width, height }} aria-hidden="true" />
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {hex > 0.001 && (
          <g className="ch-hex" opacity={hex}>
            <path d={hexPaths(layout)} opacity={1 - hexMix} />
            {hexLayout && hexMix > 0.001 && <path d={hexPaths(hexLayout)} opacity={hexMix} />}
          </g>
        )}
        {children(project)}
      </svg>
    </div>
  );
}
