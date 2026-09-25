import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import { useCompact } from '../lab/useCompact';
import CellHandoverMap, {
  type ChLayer,
  CH_PALETTE,
  type ChCamera,
  type ChProject,
} from '../lab/CellHandoverMap';
import CellHandoverLadder, { chLadderLayout } from '../lab/CellHandoverLadder';
import {
  ChLane,
  ChRuler,
  ChSpectrum,
  ChTraces,
  chCellColor,
  chRunMarks,
  type ChMark,
} from '../lab/CellHandoverInstruments';
import { useCellHandoverField, useCellHandoverRun } from '../lab/useCellHandoverField';
import {
  CH,
  CH_DEFAULT,
  CH_TTT_MS,
  chAssign,
  chCellColors,
  chLayout,
  chRoute,
  chUsers,
  type ChField,
  type ChFieldSet,
  type ChLayout,
  type ChRun,
} from '../../models/cell-handover';
import { chFilmPlan, chSample, chShot, type ChShot } from '../../models/cell-handover-film';
import { chLadder } from '../../models/cell-handover-ladder';
import '../../styles/cell-handover.css';

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** Count phrases: a separate source string for one keeps English singular ("1 handover"). */
const handovers = (n: number) => (n === 1 ? t('切换 1 次') : t('切换 {0} 次', n));
/** Approximate 16 px label width (CJK ≈ 16 px, Latin ≈ 8.4 px) plus padding, for chips. */
const chipWidth = (text: string) =>
  [...text].reduce((w, ch) => w + (/[\u2e80-\uffff]/.test(ch) ? 16.5 : 8.6), 0) + 28;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const fmt = (v: number) => (Number.isFinite(v) ? Math.round(v).toString().replace('-', '−') : '—');
const speeds = [
  { value: '5', label: '步行' },
  { value: '15', label: '骑车' },
  { value: '30', label: '公交' },
  { value: '60', label: '汽车' },
] as const;
type Speed = (typeof speeds)[number]['value'];

function mixCamera(a: ChCamera, b: ChCamera, u: number): ChCamera {
  return {
    cx: lerp(a.cx, b.cx, u),
    cy: lerp(a.cy, b.cy, u),
    scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), u)),
  };
}

type Assignments = {
  users: ReturnType<typeof chUsers>;
  macro: ReturnType<typeof chAssign>;
  dense: ReturnType<typeof chAssign>;
  denseLayout: ChLayout;
};

export default function CellHandover() {
  const film = useShowcase(),
    compact = useCompact();
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([e]) =>
      setWidth(Math.max(240, Math.floor(e.contentRect.width))),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const plan = useMemo(chFilmPlan, []);
  const layout = plan.tuned.layout;
  const colors = useMemo(() => chCellColors(layout), [layout]);
  const ladder = useMemo(() => chLadder(), []);
  // Exploration inputs, all of which rerun the same route through the model.
  const [hys, setHys] = useState<number>(CH_DEFAULT.hysDb),
    [tttIndex, setTttIndex] = useState(CH_TTT_MS.indexOf(320)),
    [speed, setSpeed] = useState<Speed>('30'),
    [sigma, setSigma] = useState<number>(CH.shadowSigmaDb),
    [position, setPosition] = useState(0.62);
  // The route is re-simulated in the Worker once the slider settles; the last run stays on screen.
  const { run: exploreRun, pending: explorePending } = useCellHandoverRun(
    {
      hysDb: hys,
      offsetDb: 0,
      tttMs: CH_TTT_MS[tttIndex],
      speedKmh: Number(speed),
      sigmaDb: sigma,
    },
    plan.tuned,
  );
  const [assign, setAssign] = useState<Assignments | null>(null);
  useEffect(() => {
    // Users and the denser layout are only needed from chapter 2; prepare them after first paint.
    const id = setTimeout(() => {
      // Person 0 is the tracked phone, standing where chapters 2 and 3 pause it.
      const at = plan.tuned.route.at(plan.probeFraction * plan.tuned.route.length);
      const users = chUsers().map((u) => (u.id ? u : { id: 0, x: at.x, y: at.y })),
        denseLayout = chLayout(CH.isdM / 2);
      setAssign({
        users,
        macro: chAssign(layout, users),
        dense: chAssign(denseLayout, users),
        denseLayout,
      });
    }, 400);
    return () => clearTimeout(id);
  }, [layout, plan]);

  const shot: ChShot = chShot(film.chapter, film.chapterProgress, film.chapterTime);
  const watch = film.watch;
  const view = watch ? shot.view : 'explore';
  const run: ChRun = watch ? (shot.run === 'eager' ? plan.eager : plan.tuned) : exploreRun;
  const fraction = watch ? shot.phone : position;
  const i = chSample(run, fraction);
  const here = run.route.at(fraction * run.route.length);
  const serving = run.serving[i];

  // ——— composition ———
  // One stage height for every chapter (the ladder's); the map takes what the instrument leaves.
  const zone = plan.window;
  const inner = width;
  const mapW = inner;
  const stageH = Math.max(
    chLadderLayout(compact, ladder.messages.length, width).height,
    compact ? 0 : 678,
  );
  const tight = compact && width < 360;
  const instrumentFor = (v: string) =>
    tight && (v === 'journey' || v === 'idle')
      ? 214
      : tight && v === 'reuse'
        ? 292
        : v === 'journey' || v === 'idle'
          ? compact
            ? 150
            : 92
          : v === 'reuse'
            ? compact
              ? 216
              : 150
            : v === 'boundary'
              ? compact
                ? 206
                : 150
              : v === 'compare'
                ? compact
                  ? 232
                  : 214
                : v === 'explore'
                  ? 200
                  : 212;
  const mapHFor = (v: string) => stageH - instrumentFor(v) - 14;
  const instrumentH = instrumentFor(view);
  const mapH = mapHFor(view);
  // Keep every camera inside the drawn city, centring it when the view is larger than the city.
  const bound = (camera: ChCamera): ChCamera => {
    // Never show beyond the modelled city: zoom in until it fills the frame.
    const c = { ...camera, scale: Math.max(camera.scale, mapW / CH.widthM, mapH / CH.heightM) };
    const halfW = mapW / 2 / c.scale,
      halfH = mapH / 2 / c.scale,
      m = 0;
    return {
      scale: c.scale,
      cx:
        halfW * 2 > CH.widthM + 2 * m
          ? CH.widthM / 2
          : clamp(c.cx, halfW - m, CH.widthM + m - halfW),
      cy:
        halfH * 2 > CH.heightM + 2 * m
          ? CH.heightM / 2
          : clamp(c.cy, halfH - m, CH.heightM + m - halfH),
    };
  };
  const full: ChCamera = bound({ cx: 1000, cy: 590, scale: mapW / 2000 });
  const follow = (span: number, x = here.x, y = here.y): ChCamera => {
    return bound({ cx: x, cy: y, scale: mapW / span });
  };
  const fit = (pts: [number, number][], margin: number): ChCamera => {
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs) - margin,
      x1 = Math.max(...xs) + margin,
      y0 = Math.min(...ys) - margin,
      y1 = Math.max(...ys) + margin;
    return bound({
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
      scale: Math.min(mapW / (x1 - x0), mapH / (y1 - y0)),
    });
  };
  const base = compact ? follow(760) : full;
  const probe = plan.probe,
    probeCells = [probe.strongest, probe.nearestCell];
  const probePoint = plan.tuned.route.at(plan.probeFraction * plan.tuned.route.length);
  const zoneEnds = [zone.startIndex, zone.endIndex].map((k) => {
    const p = plan.tuned.route.at(k * plan.tuned.speed * plan.tuned.dt);
    return [p.x, p.y] as [number, number];
  });
  const pairSites = zone.pair.map((c) => {
    const st = layout.sites[layout.cells[c].site];
    return [st.x, st.y] as [number, number];
  });
  const zoneCam = (() => {
    const h = mapHFor('compare'),
      pts = compact ? zoneEnds : [...zoneEnds, ...pairSites];
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs) - 70,
      x1 = Math.max(...xs) + 70,
      y0 = Math.min(...ys) - 70,
      y1 = Math.max(...ys) + 70;
    return {
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
      scale: Math.min(mapW / (x1 - x0), h / (y1 - y0)),
    };
  })();
  // Fields: the shadowed map and the ideal (no shadowing) map at 2 m, and the close-up window of
  // chapter 5 computed at the display's own resolution.
  const dpr = typeof window === 'undefined' ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const zoneRect = (() => {
    const h = mapHFor('compare'),
      halfW = mapW / 2 / zoneCam.scale + 30,
      halfH = h / 2 / zoneCam.scale + 30,
      r = (v: number) => Math.round(v / 10) * 10;
    return { x: r(zoneCam.cx - halfW), y: r(zoneCam.cy - halfH), w: r(2 * halfW), h: r(2 * halfH) };
  })();
  const zoneStep = Math.max(0.5, Math.round(10 / (zoneCam.scale * dpr)) / 10);
  const main = useCellHandoverField({
    isdM: CH.isdM,
    sigmaDb: watch ? CH.shadowSigmaDb : sigma,
    step: 2,
  });
  const ideal = useCellHandoverField(
    watch && film.chapter >= 1 ? { isdM: CH.isdM, sigmaDb: 0, step: 2 } : null,
  );
  const patch = useCellHandoverField(
    watch && film.chapter >= 3 && film.chapter <= 4
      ? { isdM: CH.isdM, sigmaDb: CH.shadowSigmaDb, step: zoneStep, rect: zoneRect }
      : null,
  );
  let camera = base;
  if (view === 'reuse')
    camera = mixCamera(base, compact ? follow(560) : follow(1150), shot.zoom / 0.6);
  else if (view === 'boundary' && compact)
    camera = fit(
      [
        [probePoint.x, probePoint.y],
        [layout.sites[probe.nearest].x, layout.sites[probe.nearest].y],
        [
          layout.sites[layout.cells[probe.strongest].site].x,
          layout.sites[layout.cells[probe.strongest].site].y,
        ],
      ],
      70,
    );
  else if (view === 'compare') camera = mixCamera(base, zoneCam, shot.zoom);
  else if (view === 'idle' && compact) camera = follow(900);

  // ——— per-view state ———
  const cellColor = (c: number) => chCellColor(colors, c);
  const highlight = new Map<number, [string, number]>();
  if (view === 'listen' || view === 'explore' || view === 'journey') {
    if (serving >= 0) highlight.set(serving, [cellColor(serving), 1]);
  }
  if (view === 'compare') for (const c of zone.pair) highlight.set(c, [cellColor(c), 0.9]);
  if (view === 'boundary' && shot.probe > 0)
    for (const c of probeCells) highlight.set(c, [cellColor(c), shot.probe]);
  if (view === 'idle')
    for (const c of layout.cells)
      highlight.set(c.id, [layout.sites[c.site].ta ? '#86d8c9' : '#c7abf0', 0.6 * shot.ta]);
  const fieldOpacity = view === 'journey' || view === 'reuse' ? 0 : watch ? shot.field : 1;
  const cellLines = (set: ChFieldSet | null) =>
    set ? [{ segments: set.cellEdges, width: 1.1, alpha: 0.5 }] : [];
  // The close-up patch replaces the base map inside its window (bounds included for its edges).
  const patchRect = patch.field?.rect;
  const layers: ChLayer[] =
    view === 'boundary'
      ? [
          {
            field: ideal.field,
            opacity: fieldOpacity * (1 - shot.shadow),
            reveal: shot.reveal,
            highlight,
            edges: cellLines(ideal.set),
          },
          {
            field: main.field,
            opacity: fieldOpacity * shot.shadow,
            highlight,
            edges: cellLines(main.set),
          },
        ]
      : view === 'idle'
        ? [
            {
              field: main.field,
              opacity: fieldOpacity,
              highlight,
              paint: 'flat',
              edges: main.set
                ? [
                    { segments: main.set.cellEdges, width: 0.8, alpha: 0.3 },
                    { segments: main.set.taEdges, width: 2.6, alpha: 0.92 },
                  ]
                : [],
            },
          ]
        : [
            {
              field: main.field,
              opacity: fieldOpacity,
              highlight,
              edges: cellLines(main.set),
              exclude: view === 'compare' && patchRect ? patchRect : undefined,
            },
            ...(view === 'compare'
              ? [
                  {
                    field: patch.field,
                    opacity: fieldOpacity,
                    highlight,
                    edges: cellLines(patch.set),
                  },
                ]
              : []),
          ];

  const idle = plan.idle;
  const idleCell = idle.camped[i];
  const pagedCells = layout.cells.filter(
    (c) => layout.sites[c.site].ta === (idle.registeredTa[i] ?? 0),
  );
  const status = statusLine();
  function statusLine() {
    const label = (c: number) => (c >= 0 ? layout.cells[c].label : '—');
    const F = (c: number) => (c >= 0 ? run.filtered[i * run.cells + c] : NaN);
    if (view === 'journey') {
      const done = run.events.filter((e) => e.kind === 'handover' && e.i <= i).length;
      return t('服务小区 {0} · {1} dBm · 已切换 {2} 次', label(serving), fmt(F(serving)), done);
    }
    if (view === 'reuse') {
      if (!assign) return t('同一段频率，每个小区都在用');
      const me = shot.dense > 0.5 ? assign.dense : assign.macro,
        cell = me.cellOf[0];
      const l = shot.dense > 0.5 ? assign.denseLayout : layout;
      return t('{0} 小区 · {1} 人共用同一段频率', l.cells[cell].label, me.members[cell].length);
    }
    if (view === 'boundary') {
      if (film.chapterProgress < 0.12) return t('课本里的蜂窝：整齐的六边形');
      if (film.chapterProgress < 0.46) return t('只按距离和天线朝向计算最强小区');
      if (film.chapterProgress < 0.74) return t('加入楼房与地形造成的阴影衰落');
      return t(
        '最近的基站 {0}，最强的却是 {1}',
        layout.sites[probe.nearest].name,
        label(probe.strongest),
      );
    }
    if (view === 'listen') {
      const ranked = Array.from({ length: run.cells }, (_, c) => c)
        .filter((c) => c !== serving)
        .sort((a, b) => F(b) - F(a));
      return t(
        '服务 {0} {1} dBm · 最强邻区 {2} {3} dBm',
        label(serving),
        fmt(F(serving)),
        label(ranked[0]),
        fmt(F(ranked[0])),
      );
    }
    if (view === 'compare') {
      const eager = shot.run === 'eager';
      if (
        !eager &&
        run.trigger[i] > 0 &&
        run.candidate[i] >= 0 &&
        !zone.tuned.some((e) => e.i <= i)
      )
        return t(
          '慢放：{0} 领先超过 3 dB 已 {1} / 320 ms',
          label(run.candidate[i]),
          Math.round(run.trigger[i] * 320),
        );
      const n = (eager ? zone.eager : zone.tuned).filter((e) => e.i <= i).length;
      const setting = eager ? '0 dB · 0 ms' : '3 dB · 320 ms';
      return `${setting} · ${handovers(n)}`;
    }
    if (view === 'ladder') {
      const ms = shot.ladderMs;
      if (ms < 0) return t('手机仍连在源基站，数据照常');
      if (ms < ladder.detachAt) return t('两座基站在准备，数据照常送达');
      if (ms < ladder.attachAt) return t('手机离开旧小区，数据在转发');
      if (ms < ladder.switchAt) return t('已接入目标基站，先送转发的数据');
      return t('核心网改走新路径，旧资源释放');
    }
    if (view === 'idle') {
      if (shot.paging > 0)
        return shot.answer > 0.5
          ? t('手机在 {0} 应答，通话建立', label(idleCell))
          : t('来电：在 TA {0} 的 {1} 个小区同时寻呼', idle.registeredTa[i] + 1, pagedCells.length);
      if (shot.update > 0 && shot.update < 1) return t('进入新位置区，发一次位置更新');
      return t('待机：驻留 {0} · 位置区 TA {1}', label(idleCell), idle.registeredTa[i] + 1);
    }
    const s = exploreRun;
    return t('切换 {0} 次 · 来回 {1} 次 · 掉线 {2} 次', s.handovers, s.pingPongs, s.failures);
  }

  // ——— map overlay ———
  const overlay = (project: ChProject) => {
    const px = project(here.x, here.y);
    const scale = camera.scale;
    const petal = compact ? 11 : 13;
    const antenna = (c: number): [number, number] => {
      const cell = layout.cells[c],
        s = layout.sites[cell.site];
      const [sx, sy] = project(s.x, s.y),
        a = (cell.azimuth * Math.PI) / 180;
      return [sx + Math.cos(a) * petal * 0.8, sy + Math.sin(a) * petal * 0.8];
    };
    // Road along the whole route.
    const routePath = (() => {
      let d = '';
      run.route.points.forEach(([x, y], k) => {
        const [a, b] = project(x, y);
        d += `${k ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`;
      });
      return d;
    })();
    // Ribbon of serving cells up to the phone.
    const ribbonRuns: { cell: number; d: string }[] = [];
    const showRibbon =
      view === 'journey' || view === 'listen' || view === 'compare' || view === 'explore';
    if (showRibbon) {
      const from = view === 'compare' ? zone.startIndex : 0;
      const stepK = Math.max(1, Math.round(4 / (scale * run.speed * run.dt)));
      for (let k = from; k <= i; k += stepK) {
        const cell = run.serving[k];
        const p = run.route.at(k * run.speed * run.dt),
          [a, b] = project(p.x, p.y);
        const pt = `${a.toFixed(1)},${b.toFixed(1)}`;
        const cur = ribbonRuns[ribbonRuns.length - 1];
        if (cur && cur.cell === cell) cur.d += `L${pt}`;
        else {
          if (cur) cur.d += `L${pt}`;
          ribbonRuns.push({ cell, d: `M${pt}` });
        }
      }
      const cur = ribbonRuns[ribbonRuns.length - 1];
      if (cur) cur.d += `L${px[0].toFixed(1)},${px[1].toFixed(1)}`;
    }
    const recent = run.events.filter(
      (e) =>
        (e.kind === 'handover' || e.kind === 'failure') && e.i <= i && (i - e.i) * run.dt < 1.6,
    );
    const neighbours =
      (view === 'listen' || view === 'explore') && serving >= 0
        ? Array.from({ length: run.cells }, (_, c) => c)
            .filter((c) => c !== serving)
            .sort((a, b) => run.filtered[i * run.cells + b] - run.filtered[i * run.cells + a])
            .slice(0, 3)
        : [];
    const linkCell =
      view === 'idle'
        ? shot.answer > 0.5
          ? idleCell
          : -1
        : view === 'reuse' || view === 'boundary'
          ? -1
          : serving;
    const denseSites = assign && view === 'reuse' ? assign.denseLayout.sites : [];
    const sitesToLabel = new Set<number>();
    // A cell chip already names its site; the mast letter would sit under it.
    const chipSites = new Set<number>();
    if (linkCell >= 0) chipSites.add(layout.cells[linkCell].site);
    if (view === 'idle' && shot.answer <= 0.5 && idleCell >= 0)
      chipSites.add(layout.cells[idleCell].site);
    if (view === 'boundary' && shot.probe > 0.3) chipSites.add(layout.cells[probe.strongest].site);
    if (linkCell >= 0) sitesToLabel.add(layout.cells[linkCell].site);
    if (view === 'boundary' && shot.probe > 0) {
      sitesToLabel.add(probe.nearest);
      sitesToLabel.add(layout.cells[probe.strongest].site);
    }
    if (view === 'compare') zone.pair.forEach((c) => sitesToLabel.add(layout.cells[c].site));
    if (!compact && (view === 'journey' || view === 'idle'))
      layout.sites.forEach((s) => sitesToLabel.add(s.id));
    return (
      <g>
        <path d={routePath} className="ch-road" />
        <path d={routePath} className="ch-road-line" />
        {ribbonRuns.map((r, k) => (
          <path key={k} d={r.d} stroke={cellColor(r.cell)} className="ch-ribbon" />
        ))}
        {view === 'reuse' && assign && (
          <Users assign={assign} project={project} shot={shot} layout={layout} />
        )}
        {view === 'idle' && (
          <IdleSignals
            project={project}
            shot={shot}
            layout={layout}
            pagedCells={pagedCells}
            here={px}
            tau={shot.update}
            mapW={mapW}
            mapH={mapH}
            field={main.field}
            camera={camera}
          />
        )}
        {/* Sites: a mast with three sector petals. */}
        {layout.sites.map((s) => {
          const [sx, sy] = project(s.x, s.y);
          if (sx < -40 || sy < -40 || sx > mapW + 40 || sy > mapH + 40) return null;
          const fade = view === 'reuse' ? 1 - 0.35 * shot.dense : 1;
          return (
            <g key={s.id} opacity={fade}>
              {layout.cells
                .filter((c) => c.site === s.id)
                .map((c) => {
                  const a = (c.azimuth * Math.PI) / 180,
                    w = (32 * Math.PI) / 180;
                  const p1 = [sx + petal * Math.cos(a - w), sy + petal * Math.sin(a - w)],
                    p2 = [sx + petal * Math.cos(a + w), sy + petal * Math.sin(a + w)];
                  const active = c.id === linkCell || highlight.has(c.id);
                  return (
                    <path
                      key={c.id}
                      d={`M${sx},${sy}L${p1[0]},${p1[1]}A${petal},${petal} 0 0 1 ${p2[0]},${p2[1]}Z`}
                      fill={cellColor(c.id)}
                      opacity={active ? 0.95 : 0.42}
                    />
                  );
                })}
              <circle cx={sx} cy={sy} r="3.2" fill="#f4efe6" />
              {sitesToLabel.has(s.id) &&
                !chipSites.has(s.id) &&
                sy > 34 &&
                sy < mapH - 6 &&
                sx > -4 &&
                sx < mapW + 4 && (
                  <text
                    x={clamp(sx, 8, mapW - 8)}
                    y={sy - petal - 6}
                    textAnchor={sx < 16 ? 'start' : sx > mapW - 16 ? 'end' : 'middle'}
                    className="ch-site-label"
                  >
                    {s.name}
                  </text>
                )}
            </g>
          );
        })}
        {denseSites
          .filter((s) => !layout.sites.some((m) => Math.hypot(m.x - s.x, m.y - s.y) < 1))
          .map((s) => {
            const [sx, sy] = project(s.x, s.y);
            if (sx < -30 || sy < -30 || sx > mapW + 30 || sy > mapH + 30) return null;
            const g = shot.dense;
            return (
              <g
                key={`d${s.id}`}
                opacity={g}
                transform={`translate(${sx} ${sy}) scale(${0.4 + 0.6 * g})`}
              >
                {[0, 120, 240].map((az) => {
                  const a = (az * Math.PI) / 180,
                    w = (32 * Math.PI) / 180,
                    r = petal * 0.85;
                  return (
                    <path
                      key={az}
                      d={`M0,0L${r * Math.cos(a - w)},${r * Math.sin(a - w)}A${r},${r} 0 0 1 ${r * Math.cos(a + w)},${r * Math.sin(a + w)}Z`}
                      fill="#eed17f"
                      opacity=".55"
                    />
                  );
                })}
                <circle r="2.8" fill="#f4efe6" />
              </g>
            );
          })}
        {neighbours.map((c) => {
          const [ax, ay] = antenna(c);
          return (
            <path
              key={c}
              d={`M${px[0]},${px[1]}L${ax},${ay}`}
              stroke={cellColor(c)}
              className="ch-listen"
              style={{ strokeDashoffset: -shot.pulse * 18 } as CSSProperties}
            />
          );
        })}
        {view === 'idle' && shot.answer <= 0.5 && idleCell >= 0 && (
          <>
            <path
              d={`M${px[0]},${px[1]}L${antenna(idleCell).join(',')}`}
              stroke={cellColor(idleCell)}
              className="ch-camp"
            />
            <CellTag
              box={[mapW, mapH]}
              at={antenna(idleCell)}
              text={layout.cells[idleCell].label}
              color={cellColor(idleCell)}
              away={px}
            />
          </>
        )}
        {linkCell >= 0 && (
          <>
            <path
              d={`M${px[0]},${px[1]}L${antenna(linkCell).join(',')}`}
              stroke={cellColor(linkCell)}
              className="ch-link"
              style={{ strokeDashoffset: -(watch ? shot.pulse : 0) * 26 } as CSSProperties}
            />
            <CellTag
              box={[mapW, mapH]}
              at={antenna(linkCell)}
              text={layout.cells[linkCell].label}
              color={cellColor(linkCell)}
              away={px}
            />
          </>
        )}
        {view === 'boundary' && shot.probe > 0 && (
          <Probe
            project={project}
            shot={shot}
            layout={layout}
            probe={probe}
            here={px}
            colors={colors}
            run={plan.tuned}
            probeIndex={chSample(plan.tuned, plan.probeFraction)}
            antenna={antenna}
            box={[mapW, mapH]}
          />
        )}
        {view === 'compare' &&
          shot.run === 'tuned' &&
          run.trigger[i] > 0 &&
          run.candidate[i] >= 0 && (
            <g>
              <circle cx={px[0]} cy={px[1]} r="21" className="ch-ttt-track" />
              <circle
                cx={px[0]}
                cy={px[1]}
                r="21"
                className="ch-ttt"
                stroke={cellColor(run.candidate[i])}
                strokeDasharray={`${run.trigger[i] * 132} 132`}
                transform={`rotate(-90 ${px[0]} ${px[1]})`}
              />
            </g>
          )}
        {recent.map((e) => {
          const age = ((i - e.i) * run.dt) / 1.6;
          return (
            <circle
              key={e.i}
              cx={px[0]}
              cy={px[1]}
              r={10 + age * 34}
              fill="none"
              stroke={e.kind === 'failure' ? '#e0786c' : '#f6e7c8'}
              strokeWidth="2"
              opacity={(1 - age) * 0.8}
            />
          );
        })}
        <Phone
          at={px}
          heading={here.heading}
          opacity={watch ? shot.phoneOpacity : 1}
          idle={view === 'idle' && shot.answer < 0.5}
        />
      </g>
    );
  };

  // ——— instrument under the map ———
  const allMarks = chRunMarks(run);
  let instrument: ReactNode = null;
  if (view === 'journey')
    instrument = (
      <div className="ch-instrument-journey">
        <ChLane
          cells={run.serving}
          marks={allMarks}
          layout={layout}
          colors={colors}
          width={inner}
          from={0}
          to={run.count - 1}
          upto={i}
          label={t('一路上的服务小区')}
          note={t(
            '行程 {0} 秒 · {1} 米',
            Math.round(i * run.dt),
            Math.round(fraction * run.route.length),
          )}
        />
        <p className="ch-note">{t('每条竖线是一次切换；颜色只区分小区，它们用的是同一段频率。')}</p>
      </div>
    );
  else if (view === 'reuse' && assign) {
    const macroCell = assign.macro.cellOf[0],
      denseCell = assign.dense.cellOf[0];
    const macroUsers = assign.macro.members[macroCell],
      denseUsers = assign.dense.members[denseCell];
    instrument = (
      <ChSpectrum
        width={inner}
        rows={[
          {
            label: t(
              '站距 500 米 · {0} 小区 {1} 人',
              layout.cells[macroCell].label,
              macroUsers.length,
            ),
            users: macroUsers.length,
            phoneIndex: macroUsers.indexOf(0),
            opacity: shot.users,
            color: '#c7abf0',
          },
          {
            label: t(
              '站距 250 米 · {0} 小区 {1} 人',
              assign.denseLayout.cells[denseCell].label,
              denseUsers.length,
            ),
            users: denseUsers.length,
            phoneIndex: denseUsers.indexOf(0),
            opacity: shot.dense,
            color: '#eed17f',
          },
        ]}
      />
    );
  } else if (view === 'boundary') {
    const pi = chSample(plan.tuned, plan.probeFraction),
      truth = (c: number) => plan.tuned.truth[pi * plan.tuned.cells + c];
    instrument = (
      <div className="ch-instrument-ruler">
        <ChRuler
          width={inner}
          marks={[
            {
              dbm: truth(probeCells[1]),
              label: t(
                '最近的基站 {0}：{1} dBm',
                layout.sites[probe.nearest].name,
                fmt(truth(probeCells[1])),
              ),
              color: cellColor(probeCells[1]),
              opacity: shot.probe,
            },
            {
              dbm: truth(probe.strongest),
              label: t(
                '最强的小区 {0}：{1} dBm',
                layout.cells[probe.strongest].label,
                fmt(truth(probe.strongest)),
              ),
              color: cellColor(probe.strongest),
              opacity: shot.probe,
            },
          ]}
        />
        <p className="ch-note">
          {t('地图越亮，最强小区的长期信号越强；细线是两个小区打成平手的地方。')}
        </p>
      </div>
    );
  } else if (view === 'listen')
    instrument = (
      <ChTraces
        run={run}
        layout={layout}
        colors={colors}
        width={inner}
        height={instrumentH}
        from={0}
        to={run.count - 1}
        upto={i}
        range={[-45, -105]}
        compact={compact}
      />
    );
  else if (view === 'compare') {
    const values: number[] = [];
    for (let k = zone.startIndex; k <= zone.endIndex; k++)
      for (const c of zone.pair) values.push(plan.tuned.filtered[k * plan.tuned.cells + c]);
    const hi = Math.ceil((Math.max(...values) + 4) / 5) * 5,
      lo = Math.floor((Math.min(...values) - 1) / 5) * 5;
    const eagerUpto = Math.round(lerp(zone.startIndex, zone.endIndex, shot.compareEager)),
      tunedUpto = Math.round(lerp(zone.startIndex, zone.endIndex, shot.compareTuned));
    const count = (r: ChRun, upto: number) =>
      r.events.filter((e) => e.kind === 'handover' && e.i >= zone.startIndex && e.i <= upto).length;
    instrument = (
      <ChTraces
        run={run}
        layout={layout}
        colors={colors}
        width={inner}
        height={instrumentH}
        from={zone.startIndex}
        to={zone.endIndex}
        upto={i}
        range={[hi, lo]}
        band={shot.band}
        compact={compact}
        lanes={[
          {
            cells: plan.eager.serving,
            marks: chRunMarks(plan.eager),
            upto: eagerUpto,
            label: compact ? '0 dB · 0 ms' : t('迟滞 0 dB · 0 ms'),
            note: handovers(count(plan.eager, eagerUpto)),
            emphasis: shot.run === 'eager' ? 1 : 0.55,
          },
          {
            cells: plan.tuned.serving,
            marks: chRunMarks(plan.tuned),
            upto: tunedUpto,
            label: compact ? '3 dB · 320 ms' : t('迟滞 3 dB · 320 ms'),
            note: handovers(count(plan.tuned, tunedUpto)),
            emphasis: shot.run === 'tuned' ? 1 : 0.55,
          },
        ]}
      />
    );
  } else if (view === 'idle') {
    const marks: ChMark[] = [
      ...idle.reselections.map((k): ChMark => ({ i: k, tone: 'quiet' })),
      ...idle.updates.map((u): ChMark => ({ i: u.i, tone: 'update' })),
    ];
    const reselected = idle.reselections.filter((k) => k <= i).length;
    instrument = (
      <div className="ch-instrument-idle">
        <ChLane
          cells={idle.camped}
          marks={marks}
          layout={layout}
          colors={colors}
          width={inner}
          from={chSample(run, plan.idleStart)}
          to={chSample(run, plan.idleEnd)}
          upto={i}
          label={t('待机时驻留的小区')}
          note={t(
            '重选 {0} 次，只上报 {1} 次',
            reselected - idle.reselections.filter((k) => k < chSample(run, plan.idleStart)).length,
            idle.updates.filter((u) => u.i <= i).length,
          )}
        />
        <p className="ch-note">{t('驻留小区换了也不通知网络；只有跨进新的位置区才报到。')}</p>
      </div>
    );
  } else if (view === 'explore')
    instrument = (
      <div className="ch-instrument-explore">
        <ChTraces
          run={run}
          layout={layout}
          colors={colors}
          width={inner}
          height={instrumentH - 44}
          from={0}
          to={run.count - 1}
          upto={run.count - 1}
          cursorAt={i}
          range={[-45, -105]}
          compact={compact}
          ticks={false}
        />
        <ChLane
          cells={run.serving}
          marks={allMarks}
          layout={layout}
          colors={colors}
          width={inner}
          from={0}
          to={run.count - 1}
          upto={run.count - 1}
          labels={!compact}
          thin
        />
      </div>
    );

  const ladderView = view === 'ladder';
  const source = plan.handover ? layout.cells[plan.handover.from].label : '',
    target = plan.handover ? layout.cells[plan.handover.to].label : '';
  return (
    <section className="ch-study" data-view={view} data-watch={watch}>
      <header className="ch-heading">
        <span>{t('LTE · 2 GHz · {0} km/h', watch ? 30 : speed)}</span>
        <b>{status}</b>
      </header>
      <div ref={host} className="ch-stage" style={{ minHeight: mapH + instrumentH + 14 }}>
        {ladderView ? (
          <div className="ch-ladder-wrap">
            <CellHandoverLadder
              ladder={ladder}
              ms={shot.ladderMs}
              width={inner}
              compact={compact}
              sourceLabel={source}
              targetLabel={target}
            />
          </div>
        ) : (
          <>
            <CellHandoverMap
              width={mapW}
              height={mapH}
              camera={camera}
              layout={layout}
              fields={layers}
              hex={view === 'journey' || view === 'reuse' || view === 'boundary' ? shot.hex : 0}
              hexLayout={view === 'reuse' ? assign?.denseLayout : undefined}
              hexMix={view === 'reuse' ? shot.dense : 0}
              label={t('城区地图：基站、手机的路线和由信号强弱算出的小区')}
            >
              {overlay}
            </CellHandoverMap>
            <div className="ch-instrument" style={{ height: instrumentH }}>
              {instrument}
            </div>
          </>
        )}
      </div>
      {!watch && (
        <div className="ch-controls">
          <Range
            label={t('沿路位置')}
            value={Math.round(position * 100)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => setPosition(v / 100)}
          />
          <Range
            label={t('迟滞（邻区需强出）')}
            value={hys}
            min={0}
            max={10}
            step={0.5}
            unit="dB"
            onChange={setHys}
          />
          <label className="control">
            <span className="control-top">
              <span>{t('触发时间 TTT')}</span>
              <output>{CH_TTT_MS[tttIndex]} ms</output>
            </span>
            <input
              aria-label={t('触发时间 TTT')}
              type="range"
              min={0}
              max={CH_TTT_MS.length - 1}
              step={1}
              value={tttIndex}
              style={
                { '--range-fill': `${(tttIndex / (CH_TTT_MS.length - 1)) * 100}%` } as CSSProperties
              }
              onChange={(e) => setTttIndex(Number(e.target.value))}
            />
          </label>
          <Range
            label={t('阴影衰落强度 σ')}
            value={sigma}
            min={0}
            max={10}
            step={1}
            unit="dB"
            onChange={setSigma}
          />
          <Segments
            label={t('移动速度')}
            value={speed}
            onChange={setSpeed}
            options={speeds.map((s) => ({ value: s.value, label: `${t(s.label)} ${s.value}` }))}
          />
          <p
            className="ch-verdict"
            data-pending={explorePending}
            data-tone={exploreRun.failures ? 'late' : exploreRun.pingPongs ? 'eager' : 'ok'}
          >
            {exploreRun.failures
              ? t('门槛太高或等得太久：邻区早已更强，旧小区撑不住而掉线。')
              : exploreRun.pingPongs
                ? t('门槛太低：在边界附近切过去又切回来。')
                : t('每段路只切换一次，没有来回，也没有掉线。')}
          </p>
          <button
            className="ch-reset"
            onClick={() => {
              setHys(CH_DEFAULT.hysDb);
              setTttIndex(CH_TTT_MS.indexOf(320));
              setSpeed('30');
              setSigma(CH.shadowSigmaDb);
              setPosition(0.62);
            }}
          >
            {t('恢复默认设置')}
          </button>
          <details className="ch-notes">
            <summary>{t('模型边界')}</summary>
            <p>
              {t(
                '13 座三扇区基站按 500 米六边形排布，路径损耗、天线方向图与阴影衰落参数取自 3GPP 系统评估设定；阴影衰落是一张固定种子的随机地形，同一条路每次都一样。',
              )}
            </p>
            <p>
              {t(
                '手机测量加入小幅起伏并做第 3 层滤波；切换按 A3 事件判断，执行固定 60 毫秒。信干比假设所有小区满负荷；掉线用简化的失步门限和 1 秒计时器。',
              )}
            </p>
            <p>
              {t(
                '没有模拟快衰落本身、垂直天线方向图、多频点、负载均衡和运营商的专有算法，数字只用于比较。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

function Phone({
  at,
  heading,
  opacity,
  idle,
}: {
  at: [number, number];
  heading: number;
  opacity: number;
  idle: boolean;
}) {
  const deg = (heading * 180) / Math.PI + 90;
  return (
    <g transform={`translate(${at[0]} ${at[1]})`} opacity={opacity} className="ch-phone">
      <circle r="17" className="ch-phone-halo" />
      <g transform={`rotate(${deg})`}>
        <rect x="-6.5" y="-11" width="13" height="22" rx="3.5" fill="#f7f2e8" />
        <rect x="-4.5" y="-8" width="9" height="15" rx="1.5" fill={idle ? '#5b6477' : '#3e6f8f'} />
      </g>
    </g>
  );
}

function CellTag({
  at,
  text,
  color,
  away,
  box,
}: {
  at: [number, number];
  text: string;
  color: string;
  away: [number, number];
  box: [number, number];
}) {
  // Place the tag on the side of the antenna facing away from the phone so it never covers it,
  // and keep it inside the map.
  const dx = at[0] - away[0],
    dy = at[1] - away[1],
    d = Math.hypot(dx, dy) || 1;
  // Push the chip out along the same direction until it also clears the phone by 56 px.
  let k = 36;
  while (
    k < 120 &&
    Math.hypot(at[0] + (dx / d) * k - away[0], at[1] + (dy / d) * k * 0.75 - away[1]) < 56
  )
    k += 6;
  const x = clamp(at[0] + (dx / d) * k, 26, box[0] - 26),
    y = clamp(at[1] + (dy / d) * k * 0.75, 17, box[1] - 17);
  return (
    <g className="ch-cell-tag">
      <rect
        x={x - 22}
        y={y - 13}
        width="44"
        height="26"
        rx="13"
        fill="#1d2433"
        stroke={color}
        strokeWidth="1.5"
      />
      <text x={x} y={y + 5.5} textAnchor="middle" style={{ fill: color }}>
        {text}
      </text>
    </g>
  );
}

function Users({
  assign,
  project,
  shot,
  layout,
}: {
  assign: Assignments;
  project: ChProject;
  shot: ChShot;
  layout: ChLayout;
}) {
  const dense = shot.dense;
  const macroCell = assign.macro.cellOf[0],
    denseCell = assign.dense.cellOf[0];
  const antennaOf = (l: ChLayout, c: number) => {
    const cell = l.cells[c],
      s = l.sites[cell.site];
    return project(s.x, s.y);
  };
  return (
    <g opacity={shot.users}>
      {assign.users.map((u) => {
        const [x, y] = project(u.x, u.y);
        const inMacro = assign.macro.cellOf[u.id] === macroCell,
          inDense = assign.dense.cellOf[u.id] === denseCell;
        const w = lerp(inMacro ? 1 : 0, inDense ? 1 : 0, dense);
        const [ax, ay] =
          inDense && dense > 0.5
            ? antennaOf(assign.denseLayout, denseCell)
            : antennaOf(layout, macroCell);
        return (
          <g key={u.id}>
            {w > 0.02 && u.id !== 0 && (
              <path
                d={`M${x},${y}L${ax},${ay}`}
                stroke={dense > 0.5 ? '#eed17f' : '#c7abf0'}
                strokeWidth="1"
                opacity={0.55 * w}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={u.id === 0 ? 0 : 3.4}
              fill={w > 0.5 ? (dense > 0.5 ? '#eed17f' : '#c7abf0') : '#8d99ad'}
              opacity={0.5 + 0.5 * w}
            />
          </g>
        );
      })}
    </g>
  );
}

function Probe({
  project,
  shot,
  layout,
  probe,
  here,
  colors,
  antenna,
  box,
  run,
  probeIndex,
}: {
  project: ChProject;
  shot: ChShot;
  layout: ChLayout;
  probe: { nearest: number; nearestCell: number; strongest: number };
  here: [number, number];
  colors: number[];
  run: ChRun;
  probeIndex: number;
  antenna: (c: number) => [number, number];
  box: [number, number];
}) {
  const near = layout.sites[probe.nearest];
  const [nx, ny] = project(near.x, near.y);
  const [ax, ay] = antenna(probe.strongest);
  const nearCell = probe.nearestCell;
  // Ground distances from the phone to both masts, straight from the model geometry.
  const pos = run.route.at(probeIndex * run.speed * run.dt);
  const far = layout.sites[layout.cells[probe.strongest].site];
  const [fx, fy] = project(far.x, far.y);
  const tag = (x0: number, y0: number, x1: number, y1: number, metres: number, color: string) => {
    const mx = (x0 + x1) / 2,
      my = (y0 + y1) / 2,
      len = Math.hypot(x1 - x0, y1 - y0) || 1;
    // Offset to the side of the line so the label never sits on it.
    const ox = (-(y1 - y0) / len) * 16,
      oy = ((x1 - x0) / len) * 16;
    const text = `${Math.round(metres)} m`;
    return (
      <text
        x={mx + (oy < 0 ? ox : -ox)}
        y={my + (oy < 0 ? oy : -oy) + 5}
        textAnchor="middle"
        className="ch-distance"
        style={{ fill: color }}
      >
        {text}
      </text>
    );
  };
  return (
    <g opacity={shot.probe}>
      {tag(
        here[0],
        here[1],
        nx,
        ny,
        Math.hypot(near.x - pos.x, near.y - pos.y),
        chCellColor(colors, nearCell),
      )}
      {tag(
        here[0],
        here[1],
        fx,
        fy,
        Math.hypot(far.x - pos.x, far.y - pos.y),
        chCellColor(colors, probe.strongest),
      )}
      <path
        d={`M${here[0]},${here[1]}L${nx},${ny}`}
        stroke={chCellColor(colors, nearCell)}
        strokeWidth="2"
        strokeDasharray="5 6"
        fill="none"
      />
      <path
        d={`M${here[0]},${here[1]}L${ax},${ay}`}
        stroke={chCellColor(colors, probe.strongest)}
        strokeWidth="3"
        fill="none"
      />
      <CellTag
        box={box}
        at={[ax, ay]}
        text={layout.cells[probe.strongest].label}
        color={chCellColor(colors, probe.strongest)}
        away={here}
      />
    </g>
  );
}

function IdleSignals({
  project,
  shot,
  layout,
  pagedCells,
  here,
  tau,
  mapW,
  mapH,
  field,
  camera,
}: {
  project: ChProject;
  shot: ChShot;
  layout: ChLayout;
  pagedCells: ChLayout['cells'];
  here: [number, number];
  tau: number;
  mapW: number;
  mapH: number;
  field: ChField | null;
  camera: ChCamera;
}) {
  // Put the core-network pill in whichever top/bottom corner is clearest of masts and the phone.
  const coreHalf = chipWidth(t('核心网')) / 2;
  const siteScreens = layout.sites.map((st) => project(st.x, st.y));
  const coreSpots: [number, number][] = [];
  for (const y of [32, mapH - 30])
    for (let x = mapW - coreHalf - 14; x >= coreHalf + 14; x -= 16) coreSpots.push([x, y]);
  const clearance = (c: [number, number]) =>
    Math.min(
      ...siteScreens.map(([x, y]) => Math.hypot((x - c[0]) / (coreHalf + 16), (y - c[1]) / 30)),
      Math.hypot((here[0] - c[0]) / (coreHalf + 30), (here[1] - c[1]) / 40),
    );
  // First spot (from the top right) that clears every mast; otherwise the clearest one.
  const core =
    coreSpots.find((c) => clearance(c) > 1.2) ??
    coreSpots.reduce((best, c) => (clearance(c) > clearance(best) ? c : best));
  const sites = [...new Set(pagedCells.map((c) => c.site))];
  // Name each tracking area at a spot well inside its own region on screen: sample the view, keep
  // positions where the whole chip (plus a margin) lies in that area, away from the phone, the
  // road and the core pill, and prefer the upper part of the map.
  const route = chRoute();
  const roadPts: [number, number][] = [];
  for (let d = 0; d <= route.length; d += 15) {
    const p = route.at(d);
    roadPts.push(project(p.x, p.y));
  }
  const taLabels = [0, 1].map((ta) => {
    const text = t('位置区 TA {0}', ta + 1),
      half = chipWidth(text) / 2;
    const taAt = (sx: number, sy: number) => {
      if (!field) return -1;
      const wx = (sx - mapW / 2) / camera.scale + camera.cx,
        wy = (sy - mapH / 2) / camera.scale + camera.cy;
      const col = Math.floor((wx - field.rect.x) / field.step),
        row = Math.floor((wy - field.rect.y) / field.step);
      if (col < 0 || row < 0 || col >= field.cols || row >= field.rows) return -1;
      return layout.sites[layout.cells[field.best[row * field.cols + col]].site].ta;
    };
    let best: { at: [number, number]; score: number } | null = null;
    for (let sy = 30; sy < mapH - 24; sy += 16)
      for (let sx = half + 8; sx < mapW - half - 8; sx += 16) {
        const inside = [-half - 8, 0, half + 8].every((dx) =>
          [-22, 0, 22].every((dy) => taAt(sx + dx, sy + dy) === ta),
        );
        if (!inside) continue;
        if (Math.hypot(sx - here[0], sy - here[1]) < 70) continue;
        if (siteScreens.some(([x, y]) => Math.abs(x - sx) < half + 16 && Math.abs(y - sy) < 30))
          continue;
        if (Math.abs(sx - core[0]) < half + 60 && Math.abs(sy - core[1]) < 44) continue;
        if (roadPts.some(([rx, ry]) => Math.abs(rx - sx) < half + 10 && Math.abs(ry - sy) < 26))
          continue;
        const score = -Math.abs(sy - mapH * 0.22) - 0.25 * Math.abs(sx - mapW * (ta ? 0.72 : 0.28));
        if (!best || score > best.score) best = { at: [sx, sy], score };
      }
    return { ta, at: best?.at ?? null, half };
  });
  // If both chips would share a row, keep them apart.
  const [a, b] = taLabels;
  if (
    a.at &&
    b.at &&
    Math.abs(a.at[0] - b.at[0]) < a.half + b.half + 8 &&
    Math.abs(a.at[1] - b.at[1]) < 36
  )
    b.at = null;
  return (
    <g>
      {taLabels.map(({ ta, at }) =>
        at ? (
          <g key={ta} className="ch-ta-label" opacity={shot.ta}>
            <rect
              x={at[0] - chipWidth(t('位置区 TA {0}', ta + 1)) / 2}
              y={at[1] - 16}
              width={chipWidth(t('位置区 TA {0}', ta + 1))}
              height="32"
              rx="16"
            />
            <text x={at[0]} y={at[1] + 5.5} textAnchor="middle">
              {t('位置区 TA {0}', ta + 1)}
            </text>
          </g>
        ) : null,
      )}
      <g className="ch-core">
        <rect
          x={core[0] - chipWidth(t('核心网')) / 2}
          y={core[1] - 17}
          width={chipWidth(t('核心网'))}
          height="34"
          rx="17"
        />
        <text x={core[0]} y={core[1] + 5.5} textAnchor="middle">
          {t('核心网')}
        </text>
      </g>
      {tau > 0 && tau < 1 && (
        <g>
          <path
            d={`M${here[0]},${here[1]}Q${(here[0] + core[0]) / 2},${Math.min(here[1], core[1]) - 30} ${core[0]},${core[1] + 17}`}
            className="ch-signal"
          />
          <circle
            cx={lerp(here[0], core[0], tau)}
            cy={lerp(here[1], core[1] + 17, tau) - Math.sin(tau * Math.PI) * 30}
            r="5"
            fill="#f6e7c8"
          />
        </g>
      )}
      {shot.paging > 0 &&
        sites.map((id) => {
          const s = layout.sites[id],
            [x, y] = project(s.x, s.y);
          const u = shot.paging;
          return (
            <g key={id}>
              {u < 0.35 && (
                <path
                  d={`M${core[0]},${core[1] + 17}L${x},${y}`}
                  className="ch-signal"
                  opacity={1 - u / 0.35}
                />
              )}
              {[0, 0.33, 0.66].map((o) => {
                const r = ((u * 3 + o) % 1) * 64;
                return (
                  <circle
                    key={o}
                    cx={x}
                    cy={y}
                    r={r}
                    fill="none"
                    stroke="#86d8c9"
                    strokeWidth="2"
                    opacity={(1 - r / 64) * 0.8 * (1 - shot.answer)}
                  />
                );
              })}
            </g>
          );
        })}
    </g>
  );
}

export { CH_PALETTE };
