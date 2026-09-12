import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import {
  CHEMICAL_EV_PER_ATOM,
  FISSION,
  GROWTH_REGIMES,
  NUCLIDES,
  bindingCurve,
  bindingPerNucleon,
  chainAt,
  criticalRadius,
  dropOutline,
  fissionQMeV,
  infiniteMultiplication,
  multiplication,
  populationAt,
  type FissionChain,
} from '../../models/atomic-bomb';
import {
  ATOMIC_BOMB_FILM,
  atomicBombChains,
  atomicBombShot,
  chainFor,
  chainHorizon,
  exploreChain,
  type AtomicBombShot,
  type AtomicBombView,
} from '../../models/atomic-bomb-film';
import '../../styles/atomic-bomb.css';

const amber = '#f5b054',
  ember = '#e8734a',
  hot = '#fff4de',
  muted = '#b9a693',
  cool = '#8fc4e8',
  frame = '#5a4636';
const fmt = (v: number, places = 2) => v.toFixed(places);
const sup = (n: number) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);

/** Tree layout of the ideal (no-leakage) chain: generation bands, nodes ordered by identity. */
export function chainTreeLayout(
  chain: FissionChain,
  generations: number,
  width: number,
  height: number,
  vertical: boolean,
) {
  const shown = chain.neutrons.filter((n) => n.generation < generations);
  const perGeneration = chain.generations.slice(0, generations);
  const bands = Math.max(1, perGeneration.length);
  const along = (g: number) =>
    bands === 1 ? 0.5 : g / (ATOMIC_BOMB_FILM.chainGenerations - 1 || 1);
  const nodes = shown.map((n) => {
    const index = shown.filter((m) => m.generation === n.generation && m.id < n.id).length,
      count = perGeneration[n.generation] ?? 1,
      across = (index + 0.5) / count,
      a = along(n.generation);
    return {
      id: n.id,
      generation: n.generation,
      fate: n.fate,
      parent: n.parent,
      x: vertical ? 34 + across * (width - 48) : 26 + a * (width - 52),
      y: vertical ? 40 + a * (height - 60) : 14 + across * (height - 28),
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = nodes
    .filter((n) => n.parent !== null && byId.has(n.parent))
    .map((n) => ({ from: byId.get(n.parent!)!, to: n }));
  return { nodes, edges, counts: perGeneration };
}

function Nucleus({
  shot,
  width,
  compact,
}: {
  shot: AtomicBombShot;
  width: number;
  compact: boolean;
}) {
  const height = compact ? 300 : 380,
    unit = compact ? 44 : 62,
    cx = width / 2,
    cy = height / 2 - (compact ? 6 : 0);
  const absorbed = shot.approach >= 1,
    drop = dropOutline(shot.deformation),
    axis = -0.36,
    cos = Math.cos(axis),
    sin = Math.sin(axis);
  const place = (x: number, y: number) => ({
    x: cx + (x * cos - y * sin) * unit,
    y: cy + (x * sin + y * cos) * unit,
  });
  const path =
    drop.outline
      .map((p, i) => {
        const q = place(p.x, p.y);
        return `${i ? 'L' : 'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;
      })
      .join('') + 'Z';
  const flight = shot.flight,
    spread = compact ? 1.3 : 1.8,
    heavy = place(drop.heavy.x - flight * spread, 0),
    light = place(drop.light.x + flight * spread, 0);
  const neutronStart = place(-3.4 + 2.15 * shot.approach, 0.55 - 0.5 * shot.approach);
  const prompt = [-1.15, 0.35, 1.9].map((angle) => {
    const d = 0.55 + flight * (compact ? 1.9 : 1.9);
    return place(0.1 + Math.cos(angle) * d, Math.sin(angle) * d);
  });
  const excited = absorbed && shot.deformation < 1 ? 1 : 0;
  const wobble = absorbed && shot.deformation < 0.08 ? 1 : 0;
  return (
    <svg
      className="ab-instrument"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={t('一个中子被铀-235 吸收，液滴状的核变形、颈缩并裂成两块碎片')}
    >
      <text x={20} y={22} className="ab-muted">
        {t(absorbed ? (drop.separated ? '裂变碎片飞离' : '受激的 U-236*') : '慢中子靠近 U-235')}
      </text>
      {excited > 0 && (
        <circle cx={cx} cy={cy} r={unit * (1.7 + wobble * 0.1)} fill="url(#ab-halo)" />
      )}
      {!drop.separated ? (
        <g data-part="drop">
          <path d={path} fill="url(#ab-drop)" stroke={amber} strokeWidth="1.5" />
        </g>
      ) : (
        <g data-part="fragments">
          <circle
            cx={heavy.x}
            cy={heavy.y}
            r={drop.heavy.r * unit}
            fill="url(#ab-drop)"
            stroke={amber}
            strokeWidth="1.5"
          />
          <circle
            cx={light.x}
            cy={light.y}
            r={drop.light.r * unit}
            fill="url(#ab-drop)"
            stroke={amber}
            strokeWidth="1.5"
          />
          <text x={heavy.x} y={heavy.y + 6} textAnchor="middle" fill={hot}>
            {NUCLIDES.ba141.name}
          </text>
          <text x={light.x} y={light.y + 6} textAnchor="middle" fill={hot}>
            {NUCLIDES.kr92.name}
          </text>
          {prompt.map((p, i) => (
            <g key={i} data-part="prompt-neutron">
              <circle cx={p.x} cy={p.y} r="5" fill={cool} />
              <text x={p.x + 9} y={p.y + 5} fill={cool}>
                n
              </text>
            </g>
          ))}
          <text x={cx} y={height - 26} textAnchor="middle" fill={hot} opacity={flight}>
            ≈ {fmt(fissionQMeV(), 0)} MeV {t('主要成为碎片的动能')}
          </text>
        </g>
      )}
      {!absorbed && (
        <g data-part="incoming-neutron">
          <circle cx={neutronStart.x} cy={neutronStart.y} r="5" fill={cool} />
          <text x={neutronStart.x - 10} y={neutronStart.y - 10} fill={cool} textAnchor="end">
            n
          </text>
        </g>
      )}
      {!drop.separated && (
        <text x={cx} y={cy + unit * 1.55 + 22} textAnchor="middle" fill={hot}>
          {absorbed ? 'U-236*' : NUCLIDES.u235.name}
        </text>
      )}
      <defs>
        <radialGradient id="ab-halo">
          <stop offset="0" stopColor={ember} stopOpacity=".18" />
          <stop offset="1" stopColor={ember} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ab-drop" cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#ffd9a3" />
          <stop offset=".55" stopColor="#d9843f" />
          <stop offset="1" stopColor="#7a3a1f" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function BindingCurve({
  shot,
  width,
  compact,
}: {
  shot: AtomicBombShot;
  width: number;
  compact: boolean;
}) {
  const height = compact ? 300 : 380,
    left = compact ? 40 : 58,
    right = width - (compact ? 14 : 30),
    top = 34,
    base = height - 46;
  const x = (A: number) => left + (A / 250) * (right - left),
    y = (b: number) => base - (b / 9) * (base - top);
  const curve = useMemo(() => bindingCurve(250, 2), []);
  const d = curve
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.A).toFixed(1)},${y(p.perNucleon).toFixed(1)}`)
    .join('');
  const markers = [
    {
      n: NUCLIDES.fe56,
      color: muted,
      dy: -12,
      anchor: (compact ? 'end' : 'middle') as 'end' | 'middle',
    },
    { n: NUCLIDES.u235, color: amber, dy: 22 },
    { n: NUCLIDES.ba141, color: ember, dy: -12 },
    { n: NUCLIDES.kr92, color: ember, dy: compact ? 24 : -12 },
  ];
  const uPer = bindingPerNucleon(NUCLIDES.u235),
    fragmentsPer =
      (bindingPerNucleon(NUCLIDES.ba141) * 141 + bindingPerNucleon(NUCLIDES.kr92) * 92) / 233;
  const bx = x(200);
  return (
    <svg
      className="ab-instrument"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={t('每核子结合能随质量数变化的曲线，标出铁-56、铀-235 和两块裂变碎片')}
    >
      <text x={right} y={20} textAnchor="end" className="ab-muted">
        {t('每个核子的结合能')} (MeV)
      </text>
      {!compact && (
        <text x={right} y={base + 36} textAnchor="end" className="ab-muted">
          {t('质量数 A')}
        </text>
      )}
      {[0, 3, 6, 9].map((b) => (
        <g key={b}>
          <path d={`M${left},${y(b)}H${right}`} stroke={frame} strokeWidth="1" opacity=".5" />
          <text x={left - 6} y={y(b) + 5} textAnchor="end" className="ab-muted">
            {b}
          </text>
        </g>
      ))}
      {(compact ? [50, 100, 150, 200] : [50, 100, 150, 200, 250]).map((A) => (
        <text key={A} x={x(A)} y={base + 18} textAnchor="middle" className="ab-muted">
          {compact && A === 50 ? 'A = 50' : A}
        </text>
      ))}
      <path
        d={d}
        fill="none"
        stroke={hot}
        strokeWidth="2"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - shot.curve}
        data-part="binding-curve"
      />
      <g opacity={shot.markers} data-part="markers">
        {markers.map(({ n, color, dy, anchor }) => (
          <g key={n.name} data-nuclide={n.name}>
            <circle
              cx={x(n.A)}
              cy={y(bindingPerNucleon(n))}
              r="5"
              fill={color}
              stroke="#1a100b"
              strokeWidth="1.5"
            />
            <text
              x={x(n.A) + (n.A > 200 || anchor === 'end' ? -8 : 0)}
              y={y(bindingPerNucleon(n)) + dy}
              textAnchor={n.A > 200 ? 'end' : (anchor ?? 'middle')}
              fill={color}
            >
              {n.name}
            </text>
          </g>
        ))}
      </g>
      <g opacity={shot.difference} data-part="difference">
        <path d={`M${x(235)},${y(uPer)}H${bx}`} stroke={amber} strokeDasharray="3 4" opacity=".7" />
        <path
          d={`M${x(141)},${y(fragmentsPer)}H${bx}`}
          stroke={ember}
          strokeDasharray="3 4"
          opacity=".7"
        />
        <path
          d={`M${bx},${y(uPer)}V${y(fragmentsPer)}`}
          stroke={hot}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text x={bx - 8} y={y(uPer) + 52} textAnchor="end" fill={hot}>
          {compact
            ? `≈ ${fmt(fragmentsPer - uPer, 2)} MeV`
            : `${t('每核子多出')} ≈ ${fmt(fragmentsPer - uPer, 2)} MeV`}
        </text>
        <text x={left} y={height - 8} className="ab-muted">
          {compact
            ? t('化学键：每个原子约 {0} eV', CHEMICAL_EV_PER_ATOM)
            : t('化学反应每个原子约 {0} eV：在这张图上不到千分之一像素', CHEMICAL_EV_PER_ATOM)}
        </text>
      </g>
    </svg>
  );
}

function ChainTree({
  shot,
  width,
  compact,
}: {
  shot: AtomicBombShot;
  width: number;
  compact: boolean;
}) {
  const chain = atomicBombChains().ideal,
    height = compact ? 360 : 380,
    treeW = compact ? width : Math.round(width * 0.56),
    treeH = compact ? 170 : height,
    graphX = compact ? 0 : treeW + 24,
    graphY = compact ? 184 : 0,
    graphW = compact ? width : width - graphX,
    graphH = compact ? height - graphY : height;
  const tree = useMemo(
    () => chainTreeLayout(chain, shot.generations, treeW, treeH, compact),
    [chain, shot.generations, treeW, treeH, compact],
  );
  const kInf = infiniteMultiplication(),
    maxGen = 80,
    gl = graphX + (compact ? 40 : 54),
    gr = graphX + graphW - 12,
    gt = graphY + 30,
    gb = graphY + graphH - 40;
  const gx = (g: number) => gl + (g / maxGen) * (gr - gl),
    gy = (log10: number) => gb - (log10 / 30) * (gb - gt);
  const shownGen = Math.max(1, shot.growth * maxGen);
  const growthPath = Array.from({ length: 81 }, (_, g) => g)
    .filter((g) => g <= shownGen)
    .map((g, i) => `${i ? 'L' : 'M'}${gx(g).toFixed(1)},${gy(g * Math.log10(kInf)).toFixed(1)}`)
    .join('');
  const shown = tree.counts.reduce((s, c) => s + c, 0);
  return (
    <svg
      className="ab-instrument"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={t('一个中子引发的裂变家族树，以及中子数随代数的对数增长')}
    >
      <g data-part="tree">
        {tree.edges.map((e) => (
          <path
            key={e.to.id}
            d={
              compact
                ? `M${e.from.x},${e.from.y}C${e.from.x},${(e.from.y + e.to.y) / 2} ${e.to.x},${(e.from.y + e.to.y) / 2} ${e.to.x},${e.to.y}`
                : `M${e.from.x},${e.from.y}C${(e.from.x + e.to.x) / 2},${e.from.y} ${(e.from.x + e.to.x) / 2},${e.to.y} ${e.to.x},${e.to.y}`
            }
            stroke={amber}
            strokeWidth="1"
            opacity=".55"
            fill="none"
          />
        ))}
        {tree.nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.fate === 'fission' ? 4 : 3}
            fill={n.fate === 'fission' ? hot : n.fate === 'capture' ? frame : amber}
            data-fate={n.fate}
          />
        ))}
        {tree.counts.map((count, g) => (
          <text
            key={g}
            x={compact ? 8 : 26 + (g / (ATOMIC_BOMB_FILM.chainGenerations - 1)) * (treeW - 52)}
            y={
              compact
                ? 40 + (g / (ATOMIC_BOMB_FILM.chainGenerations - 1)) * (treeH - 60) + 4
                : treeH - 2
            }
            textAnchor={compact ? 'start' : 'middle'}
            className="ab-muted"
            data-generation={g}
          >
            {count}
          </text>
        ))}
      </g>
      <g data-part="growth" opacity={shot.growth > 0 ? 1 : 0.35}>
        <text x={gl} y={graphY + 18} className="ab-muted">
          {t('中子数（对数）')}
        </text>
        {(compact ? [0, 15, 30] : [0, 10, 20, 30]).map((e) => (
          <g key={e}>
            <path d={`M${gl},${gy(e)}H${gr}`} stroke={frame} opacity=".5" />
            <text x={gl - 5} y={gy(e) + 4} textAnchor="end" className="ab-muted">
              10{sup(e)}
            </text>
          </g>
        ))}
        {[0, 20, 40, 60, 80].map((g) => (
          <text key={g} x={gx(g)} y={gb + 18} textAnchor="middle" className="ab-muted">
            {g}
          </text>
        ))}
        <text x={gr} y={gb + 34} textAnchor="end" className="ab-muted">
          {t('代数，每代约 10 ns')}
        </text>
        <path d={growthPath} fill="none" stroke={hot} strokeWidth="2" data-part="growth-curve" />
        <circle
          cx={gx(Math.min(shownGen, shot.generations - 1))}
          cy={gy(Math.min(shownGen, shot.generations - 1) * Math.log10(kInf))}
          r="4"
          fill={amber}
        />
      </g>
      <text
        x={compact ? width - 8 : 8}
        y={compact ? 16 : 18}
        textAnchor={compact ? 'end' : 'start'}
        className="ab-muted"
      >
        {t('已画 {0} 代，{1} 个中子', shot.generations, shown)}
      </text>
    </svg>
  );
}

/** Canvas for the walk plus SVG for the multiplication gauge. Both read the same radius. */
function Sphere({
  shot,
  chain,
  walkTime,
  radius,
  scale,
  width,
  compact,
}: {
  shot: AtomicBombShot;
  chain: FissionChain | null;
  walkTime: number;
  radius: number;
  scale: number;
  width: number;
  compact: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const height = 380,
    discW = compact ? width : Math.round(width * 0.55),
    discH = compact ? 226 : height,
    // Two status lines sit above the disc; the disc must clear them even at full expansion.
    maxPx = Math.min(discW * 0.42, (discH - 66) / 2),
    discCy = 56 + maxPx,
    pxRadius = Math.min(
      maxPx,
      (0.5 + (0.5 * radius) / ATOMIC_BOMB_FILM.largeRadius) * maxPx * 0.85 * scale ** 3,
    ),
    lambdaPx = pxRadius / (chain?.radius ?? radius),
    dim = shot.view === 'expansion' && scale > 1.001 && chain?.radius !== radius ? 0.45 : 1;
  const k = multiplication(radius),
    rc = criticalRadius();
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2),
      w = discW,
      h = discH;
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2,
      cy = discCy;
    const glow = ctx.createRadialGradient(
      cx - pxRadius * 0.3,
      cy - pxRadius * 0.35,
      pxRadius * 0.1,
      cx,
      cy,
      pxRadius,
    );
    glow.addColorStop(0, k >= 1 ? '#6a3a22' : '#4a3226');
    glow.addColorStop(0.75, '#2c1b13');
    glow.addColorStop(1, '#1b110c');
    ctx.beginPath();
    ctx.arc(cx, cy, pxRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = k >= 1 ? 'rgba(245,176,84,.9)' : 'rgba(185,166,147,.55)';
    ctx.stroke();
    if (!chain) return;
    const state = chainAt(chain, walkTime);
    const project = (p: readonly [number, number, number]) => ({
      x: cx + p[0] * lambdaPx,
      y: cy - p[1] * lambdaPx,
      depth: (p[2] + radius) / (2 * radius),
    });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const path of state.paths) {
      if (!path) continue;
      const first = project(path.points[0]);
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < path.points.length; i++) {
        const q = project(path.points[i]);
        ctx.lineTo(q.x, q.y);
      }
      const last = project(path.points.at(-1)!);
      ctx.strokeStyle = `rgba(245,176,84,${(0.35 + 0.5 * last.depth) * dim})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      if (!path.finished) {
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = hot;
        ctx.fill();
        continue;
      }
      if (path.fate === 'fission') {
        const pulse = Math.max(0, 1 - path.since / 1.4);
        const burst = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 6 + 10 * pulse);
        burst.addColorStop(0, `rgba(255,244,222,${0.95})`);
        burst.addColorStop(1, 'rgba(232,115,74,0)');
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6 + 10 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = burst;
        ctx.fill();
      } else if (path.fate === 'leak') {
        const prev = project(path.points.at(-2) ?? path.points[0]),
          len = Math.hypot(last.x - prev.x, last.y - prev.y) || 1;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(last.x + ((last.x - prev.x) / len) * 9, last.y + ((last.y - prev.y) / len) * 9);
        ctx.strokeStyle = 'rgba(143,196,232,.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(143,196,232,${Math.max(0.35, 1 - path.since / 6)})`;
        ctx.fill();
      } else if (path.fate === 'capture') {
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(185,166,147,.7)';
        ctx.fill();
      }
    }
  }, [chain, walkTime, radius, scale, discW, discH, discCy, pxRadius, lambdaPx, k, dim]);
  const state = chain ? chainAt(chain, walkTime) : null;
  const gaugeX = compact ? 0 : discW + 18,
    gaugeY = compact ? discH + 8 : 0,
    gaugeW = compact ? width : width - gaugeX,
    gaugeH = compact ? height - gaugeY : height;
  const gl = gaugeX + (compact ? 40 : 46),
    gr = gaugeX + gaugeW - 14,
    gt = gaugeY + 34,
    gb = gaugeY + gaugeH - 40,
    maxR = 6;
  const gx = (r: number) => gl + (r / maxR) * (gr - gl),
    gy = (v: number) => gb - (v / 2.2) * (gb - gt);
  const curve = Array.from({ length: 61 }, (_, i) => 0.2 + (i / 60) * (maxR - 0.2))
    .map((r, i) => `${i ? 'L' : 'M'}${gx(r).toFixed(1)},${gy(multiplication(r)).toFixed(1)}`)
    .join('');
  const kLabel = compact
    ? t(k >= 1 ? '超临界' : '次临界')
    : t(k >= 1 ? '超临界：链自己延续' : '次临界：链会熄灭');
  return (
    <div className="ab-sphere" style={{ height }}>
      <canvas
        ref={canvas}
        className="ab-canvas"
        style={{ width: discW, height: discH }}
        role="img"
        aria-label={t('球形裂变材料的截面，中子径迹从中心出发，漏出、被吸收或引发新的裂变')}
      />
      <svg
        className="ab-instrument ab-gauge"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-hidden="true"
      >
        <text x={compact ? 10 : 12} y={20} className="ab-muted">
          {t('半径 R = {0} λ', fmt(radius, 2))}
          {scale > 1.001 ? ` · ${t('膨胀')} ×${fmt(scale, 2)}` : ''}
        </text>
        {state && (
          <text
            x={compact ? 10 : 12}
            y={42}
            textAnchor="start"
            className="ab-muted"
            data-part="walk-counter"
          >
            {compact
              ? t('第 {0} 代 · 漏出 {1} · 裂变 {2}', state.generation, state.leaked, state.fissions)
              : t(
                  '第 {0} 代 · 存活 {1} · 漏出 {2} · 裂变 {3}',
                  state.generation,
                  state.alive.length,
                  state.leaked,
                  state.fissions,
                )}
          </text>
        )}
        <g data-part="gauge">
          {!compact && (
            <text x={gl} y={gaugeY + 20} className="ab-muted">
              {t('增殖因子 k 随半径')}
            </text>
          )}
          {[0, 1, 2].map((v) => (
            <g key={v}>
              <path
                d={`M${gl},${gy(v)}H${gr}`}
                stroke={v === 1 ? amber : frame}
                strokeDasharray={v === 1 ? '4 4' : undefined}
                opacity={v === 1 ? 0.8 : 0.5}
              />
              <text x={gl - 6} y={gy(v) + 5} textAnchor="end" className="ab-muted">
                {v}
              </text>
            </g>
          ))}
          {[0, 2, 4, 6].map((r) => (
            <text key={r} x={gx(r)} y={gb + 18} textAnchor="middle" className="ab-muted">
              {r}
            </text>
          ))}
          <text x={gr} y={gb + 36} textAnchor="end" className="ab-muted">
            {t('半径，单位：平均自由程 λ')}
          </text>
          <path d={curve} fill="none" stroke={hot} strokeWidth="2" data-part="k-curve" />
          <path
            d={`M${gx(rc)},${gy(0)}V${gy(1)}`}
            stroke={amber}
            strokeDasharray="2 4"
            opacity=".8"
          />
          <text
            x={gx(rc) + (compact ? -6 : 6)}
            y={compact ? gy(1.7) + 5 : gb - 8}
            textAnchor={compact ? 'end' : 'start'}
            fill={amber}
          >
            R꜀ ≈ {fmt(rc, 1)} λ
          </text>
          <circle
            cx={gx(Math.min(maxR, radius))}
            cy={gy(k)}
            r="6"
            fill={k >= 1 ? amber : cool}
            stroke="#1a100b"
            strokeWidth="2"
            data-part="k-marker"
          />
          {!compact && (
            <text
              x={gx(Math.min(maxR, radius)) + (radius > 3.2 ? -12 : 12)}
              y={gy(k) + (radius > 3.2 ? -14 : 24)}
              textAnchor={radius > 3.2 ? 'end' : 'start'}
              fill={hot}
              data-part="k-value"
            >
              k ≈ {fmt(k, 2)}
            </text>
          )}
          <text
            x={compact ? gl : gr}
            y={gaugeY + 20}
            textAnchor={compact ? 'start' : 'end'}
            fill={k >= 1 ? amber : cool}
          >
            {kLabel}
          </text>
        </g>
      </svg>
    </div>
  );
}

function Compare({
  shot,
  width,
  compact,
}: {
  shot: AtomicBombShot;
  width: number;
  compact: boolean;
}) {
  const height = compact ? 320 : 380,
    left = compact ? 44 : 60,
    right = width - (compact ? 14 : 30),
    top = 36,
    base = height - 50;
  const logT = (s: number) => Math.log10(s),
    x = (s: number) => left + ((logT(s) + 8) / 10) * (right - left),
    y = (n: number) => base - (Math.min(20, Math.log10(Math.max(1, n))) / 20) * (base - top);
  const tMax = 10 ** (-8 + 10 * shot.compare);
  const lines = GROWTH_REGIMES.map((regime) => {
    const points: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const s = 10 ** (-8 + (i / 200) * 10);
      if (s > tMax) break;
      const n = populationAt(regime.k, regime.generationS, s);
      points.push(`${points.length ? 'L' : 'M'}${x(s).toFixed(1)},${y(n).toFixed(1)}`);
      if (n >= 1e20) break;
    }
    return { regime, d: points.join('') };
  });
  const labels: Record<string, { text: string; color: string }> = {
    'reactor-prompt': {
      text: t(compact ? 'k = 1.001，仅瞬发' : 'k = 1.001，只有瞬发中子'),
      color: muted,
    },
    'reactor-delayed': {
      text: t(compact ? 'k = 1.001，含缓发' : 'k = 1.001，含缓发中子'),
      color: cool,
    },
    explosive: { text: t(compact ? 'k = 1.5，10 ns 一代' : 'k = 1.5，每代 10 ns'), color: amber },
  };
  return (
    <svg
      className="ab-instrument"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={t('中子数随时间的对数图：反应堆的缓慢增长与瞬发链式反应的爆发式增长')}
    >
      <text x={left} y={20} className="ab-muted">
        {t('中子数（对数）')}
      </text>
      {[0, 5, 10, 15, 20].map((e) => (
        <g key={e}>
          <path d={`M${left},${y(10 ** e)}H${right}`} stroke={frame} opacity=".5" />
          <text x={left - 6} y={y(10 ** e) + 4} textAnchor="end" className="ab-muted">
            10{sup(e)}
          </text>
        </g>
      ))}
      {(compact ? [1e-8, 1e-5, 1e-2, 10] : [1e-8, 1e-6, 1e-4, 1e-2, 1, 1e2]).map((s) => (
        <text key={s} x={x(s)} y={base + 18} textAnchor="middle" className="ab-muted">
          {s >= 1
            ? `${s} s`
            : s >= 1e-3
              ? `${s * 1e3} ms`
              : s >= 1e-6
                ? `${s * 1e6} μs`
                : `${s * 1e9} ns`}
        </text>
      ))}
      <text x={right} y={base + 36} textAnchor="end" className="ab-muted">
        {t('时间（对数）')}
      </text>
      {lines.map(({ regime, d }) => (
        <path
          key={regime.id}
          d={d}
          fill="none"
          stroke={labels[regime.id].color}
          strokeWidth={regime.id === 'explosive' ? 2.4 : 2}
          data-regime={regime.id}
        />
      ))}
      {lines.map(({ regime }, i) => (
        <g
          key={regime.id}
          transform={`translate(${left + (right - left) * (compact ? 0.33 : 0.34)},${top + 14 + i * 22})`}
        >
          <path d="M0,0H18" stroke={labels[regime.id].color} strokeWidth="2.5" />
          <text x={24} y={5} fill={labels[regime.id].color}>
            {labels[regime.id].text}
          </text>
        </g>
      ))}
    </svg>
  );
}

export type AtomicBombInstrumentProps = {
  shot: AtomicBombShot;
  chain: FissionChain | null;
  width: number;
};
export function AtomicBombInstrument({ shot, chain, width }: AtomicBombInstrumentProps) {
  const compact = width < 600;
  if (shot.view === 'capture') return <Nucleus shot={shot} width={width} compact={compact} />;
  if (shot.view === 'binding') return <BindingCurve shot={shot} width={width} compact={compact} />;
  if (shot.view === 'chain') return <ChainTree shot={shot} width={width} compact={compact} />;
  if (shot.view === 'compare') return <Compare shot={shot} width={width} compact={compact} />;
  return (
    <Sphere
      shot={shot}
      chain={chain}
      walkTime={shot.walkTime}
      radius={shot.radius}
      scale={shot.scale}
      width={width}
      compact={compact}
    />
  );
}

type ExploreView = 'capture' | 'binding' | 'chain' | 'walk' | 'compare';
export default function AtomicBomb() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(860);
  const [mode, setMode] = useState<ExploreView>('walk'),
    [radius, setRadius] = useState(3),
    [scale, setScale] = useState(1),
    [seed, setSeed] = useState(1),
    [walkShare, setWalkShare] = useState(60),
    [deformation, setDeformation] = useState(0.5);
  useEffect(() => {
    if (!host.current) return;
    const obs = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, Math.round(entry.contentRect.width))),
    );
    obs.observe(host.current);
    return () => obs.disconnect();
  }, []);
  const filmShot = atomicBombShot(film.chapter, film.chapterProgress);
  const manualChain = useMemo(
    () => (!film.watch && mode === 'walk' ? exploreChain(radius / scale ** 2, seed) : null),
    [film.watch, mode, radius, scale, seed],
  );
  const shot: AtomicBombShot = film.watch
    ? filmShot
    : {
        ...filmShot,
        view: mode === 'walk' ? (scale > 1 ? 'expansion' : 'leak') : mode,
        approach: deformation > 0.12 ? 1 : deformation / 0.12,
        deformation: Math.max(0, Math.min(1, (deformation - 0.12) / 0.6)),
        flight: Math.max(0, Math.min(1, (deformation - 0.72) / 0.28)),
        curve: 1,
        markers: 1,
        difference: 1,
        generations: ATOMIC_BOMB_FILM.chainGenerations,
        growth: 1,
        compare: 1,
        radius: radius / scale ** 2,
        scale,
        chain: null,
        walkTime: manualChain ? (walkShare / 100) * chainHorizon(manualChain, 1) : 0,
      };
  const chain = film.watch ? chainFor(filmShot.chain) : manualChain;
  const walkView = ['leak', 'critical', 'expansion'].includes(shot.view);
  const state = chain && walkView ? chainAt(chain, shot.walkTime) : null;
  const k = multiplication(shot.radius);
  const reading = () => {
    if (shot.view === 'capture')
      return (
        <>
          <span>
            {t('一次裂变释放')} <b>≈ {fmt(fissionQMeV(), 0)} MeV</b>
          </span>
          <span>
            {t('放出的中子')} <b>{shot.flight > 0 ? 3 : '—'}</b>
          </span>
        </>
      );
    if (shot.view === 'binding')
      return (
        <>
          <span>
            U-235 <b>{fmt(bindingPerNucleon(NUCLIDES.u235))} MeV</b>
          </span>
          <span>
            {t('碎片平均')}{' '}
            <b>
              {fmt(
                (bindingPerNucleon(NUCLIDES.ba141) * 141 + bindingPerNucleon(NUCLIDES.kr92) * 92) /
                  233,
              )}{' '}
              MeV
            </b>
          </span>
        </>
      );
    if (shot.view === 'chain')
      return (
        <>
          <span>
            {t('无泄漏时')} <b>k∞ ≈ {fmt(infiniteMultiplication())}</b>
          </span>
          <span>
            {t('每代中子')} <b>ν ≈ {FISSION.nu}</b>
          </span>
        </>
      );
    if (shot.view === 'compare')
      return (
        <>
          <span>
            {t('缓发中子份额')} <b>β ≈ {(FISSION.delayedFraction * 100).toFixed(2)}%</b>
          </span>
          <span>
            {t('平均代时间')} <b>10 ns → {fmt(GROWTH_REGIMES[1].generationS, 2)} s</b>
          </span>
        </>
      );
    return (
      <>
        <span>
          {t('增殖因子')} <b>k ≈ {fmt(k)}</b>
        </span>
        <span>
          {t('本次行走')}{' '}
          <b>{state ? t('{0} 代 · {1} 次裂变', state.generation, state.fissions) : '—'}</b>
        </span>
      </>
    );
  };
  const context =
    shot.view === 'capture'
      ? '液滴模型示意；碎片和中子的方向、速度不按比例。'
      : shot.view === 'binding'
        ? '曲线来自半经验质量公式，标记点用实测原子质量。'
        : shot.view === 'chain'
          ? '理想无限介质：没有中子漏出，只有少数被俘获。'
          : shot.view === 'compare'
            ? '同一个 k，代时间不同；纵轴是相对中子数。'
            : width < 600
              ? '径迹是三维行走的投影，蓝点是漏出位置。'
              : '截面里的径迹是三维行走的投影；蓝点是中子离开球面的位置。长度单位是平均自由程 λ。';
  return (
    <section
      className="ab-study"
      data-watch={film.watch}
      data-view={shot.view}
      data-compact={width < 600}
    >
      <div className="ab-heading">
        <span>FISSION CHAIN</span>
        <b>{t('一个中子，一场链式反应')}</b>
      </div>
      <div className="ab-stage" ref={host}>
        <AtomicBombInstrument shot={shot} chain={chain} width={width} />
      </div>
      <div className="ab-reading">{reading()}</div>
      <p className="ab-context">{t(context)}</p>
      {!film.watch && (
        <div className="ab-controls">
          <Segments
            label={t('观察方式')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'capture', label: t('裂开') },
              { value: 'binding', label: t('结合能') },
              { value: 'chain', label: t('家族树') },
              { value: 'walk', label: t('中子行走') },
              { value: 'compare', label: t('堆与弹') },
            ]}
          />
          {mode === 'capture' && (
            <Range
              label={t('裂变进程')}
              value={deformation}
              min={0}
              max={1}
              step={0.01}
              onChange={setDeformation}
            />
          )}
          {mode === 'walk' && (
            <>
              <Range
                label={t('球体半径')}
                value={radius}
                min={0.8}
                max={6}
                step={0.1}
                unit="λ"
                onChange={setRadius}
                help={t('临界半径约 {0} λ', fmt(criticalRadius(), 1))}
              />
              <Range
                label={t('均匀膨胀')}
                value={scale}
                min={1}
                max={2}
                step={0.01}
                unit="×"
                onChange={setScale}
                help={t('质量不变，λ 随密度下降而变长')}
              />
              <Range
                label={t('行走时间')}
                value={walkShare}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={setWalkShare}
              />
              <button className="ab-button" onClick={() => setSeed((s) => s + 1)}>
                {t('换一组随机数')}
              </button>
            </>
          )}
          <button
            className="ab-button ab-reset"
            onClick={() => {
              setMode('walk');
              setRadius(3);
              setScale(1);
              setSeed(1);
              setWalkShare(60);
              setDeformation(0.5);
            }}
          >
            {t('恢复初始设置')}
          </button>
          <details className="ab-notes">
            <summary>{t('裂变模型边界')}</summary>
            <p>
              {t(
                '结合能曲线用 Bethe–Weizsäcker 半经验公式，标记点用实测质量；裂变能量取 n + U-235 → Ba-141 + Kr-92 + 3n 这一条通道的即时释放，约 173 MeV。',
              )}
            </p>
            <p>
              {t(
                '中子行走与 k 曲线共用同一组示意碰撞概率：每次碰撞 72% 散射、25% 裂变、3% 俘获，每次裂变平均 2.4 个中子。单群扩散是教学近似，随机行走是有限样本；两者都不是任何材料或装置的数据。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
