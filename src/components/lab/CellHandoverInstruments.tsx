import { useId } from 'react';
import { t } from '../../i18n';
import { CH, type ChEvent, type ChLayout, type ChRun } from '../../models/cell-handover';
import { CH_GLOW_STOPS, CH_PALETTE } from './CellHandoverMap';

const ink = '#ece6da',
  muted = '#a9b2bf',
  grid = '#8d99ad33';
export const chCellColor = (colors: number[], cell: number) =>
  cell < 0 ? '#e0786c' : CH_PALETTE[colors[cell] ?? 0];
/** Approximate rendered width of 16 px text (CJK ≈ 16.5 px, Latin ≈ 8.6 px). */
export const textWidth = (text: string) =>
  [...text].reduce((w, ch) => w + (/[\u2e80-\uffff]/.test(ch) ? 16.5 : 8.6), 0);
/** Ride time in seconds since the start of the street; deliberately not a clock like the player's. */
const fmtS = (s: number) => `${Math.round(s)} s`;

/** Runs of a constant cell between two sample indices (serving or idle camping). */
export function chSegments(cells: Int16Array, from: number, to: number) {
  const out: { cell: number; a: number; b: number }[] = [];
  for (let i = Math.max(0, from); i <= Math.min(cells.length - 1, to); i++) {
    const cell = cells[i],
      last = out[out.length - 1];
    if (last && last.cell === cell) last.b = i;
    else out.push({ cell, a: i, b: i });
  }
  return out;
}
export type ChMark = { i: number; tone: 'handover' | 'return' | 'failure' | 'quiet' | 'update' };
const markColor = {
  handover: '#1d2433',
  return: '#fff3da',
  failure: '#e0786c',
  quiet: '#1d2433',
  update: '#f6e7c8',
};

/** A cell ribbon over time: the journey's log, the comparison lanes and idle camping. */
export function ChLane({
  cells,
  marks,
  layout,
  colors,
  width,
  from,
  to,
  upto,
  label,
  note,
  labels = true,
  emphasis = 1,
  thin = false,
}: {
  cells: Int16Array;
  marks: ChMark[];
  layout: ChLayout;
  colors: number[];
  width: number;
  from: number;
  to: number;
  upto: number;
  label?: string;
  note?: string;
  labels?: boolean;
  emphasis?: number;
  thin?: boolean;
}) {
  const pad = 4,
    x = (i: number) => pad + ((i - from) / Math.max(1, to - from)) * (width - 2 * pad);
  const end = Math.min(to, upto);
  const segments = end >= from ? chSegments(cells, from, end) : [];
  const shown = marks.filter((m) => m.i > from && m.i <= end);
  const h = thin ? 14 : 22,
    y0 = 6;
  return (
    <div className="ch-lane" style={{ opacity: 0.4 + 0.6 * emphasis }}>
      {(label || note) && (
        <div className="ch-lane-head">
          {label && <span>{label}</span>}
          {note && <b>{note}</b>}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${h + 12}`} aria-hidden="true">
        <rect x={pad} y={y0} width={width - 2 * pad} height={h} rx={h / 2} fill="#8d99ad1f" />
        {segments.map((s) => {
          const x0 = x(s.a),
            x1 = Math.max(x0 + 1.5, x(s.b + 1));
          return (
            <g key={s.a}>
              <rect
                x={x0}
                y={y0}
                width={x1 - x0}
                height={h}
                fill={chCellColor(colors, s.cell)}
                opacity={s.cell < 0 ? 0.9 : 0.82}
              />
              {labels && !thin && x1 - x0 > 36 && (
                <text
                  x={(x0 + x1) / 2}
                  y={y0 + h / 2 + 5.5}
                  textAnchor="middle"
                  className="ch-lane-cell"
                >
                  {s.cell < 0 ? t('断线') : layout.cells[s.cell].label}
                </text>
              )}
            </g>
          );
        })}
        {shown.map((m) => (
          <path
            key={`${m.tone}${m.i}`}
            d={`M${x(m.i)} ${y0 - 4}V${y0 + h + 4}`}
            stroke={markColor[m.tone]}
            strokeWidth={m.tone === 'return' || m.tone === 'update' ? 2.4 : 1.6}
          />
        ))}
      </svg>
    </div>
  );
}
/** Handover marks of a connected run. */
export const chRunMarks = (run: ChRun): ChMark[] =>
  run.events.flatMap((e): ChMark[] =>
    e.kind === 'handover'
      ? [{ i: e.i, tone: e.pingPong ? 'return' : 'handover' }]
      : e.kind === 'failure'
        ? [{ i: e.i, tone: 'failure' }]
        : [],
  );

export type ChTraceLane = {
  cells: Int16Array;
  marks: ChMark[];
  upto: number;
  label: string;
  note: string;
  emphasis: number;
};

/**
 * Layer-3 filtered RSRP of the leading cells along the route. Each cell is drawn only while it is
 * among the three strongest, which keeps the picture to the cells the handset actually weighs; the
 * serving cell is overlaid in bold. Optional lanes share the same time axis.
 */
export function ChTraces({
  run,
  layout,
  colors,
  width,
  height,
  from,
  to,
  upto,
  range,
  band = 0,
  ticks = true,
  compact,
  lanes = [],
  cursorAt,
}: {
  run: ChRun;
  layout: ChLayout;
  colors: number[];
  width: number;
  height: number;
  from: number;
  to: number;
  upto: number;
  range: [number, number];
  band?: number;
  ticks?: boolean;
  compact: boolean;
  lanes?: ChTraceLane[];
  /** Sample to mark with the cursor (defaults to the last drawn sample). */
  cursorAt?: number;
}) {
  const clip = useId().replace(/:/g, '');
  const left = compact ? 42 : 50,
    right = compact ? 30 : 44,
    top = 24,
    bottom = 26,
    laneH = 44;
  const w = width - left - right,
    h = height - top - bottom - lanes.length * laneH;
  const [hi, lo] = range;
  const x = (i: number) => left + ((i - from) / Math.max(1, to - from)) * w;
  const y = (dbm: number) => top + ((hi - Math.max(lo - 6, Math.min(hi + 6, dbm))) / (hi - lo)) * h;
  const last = Math.max(from, Math.min(to, upto));
  const columns = Math.max(2, Math.round(w / (compact ? 2 : 1.5)));
  const sampleAt = (k: number) => Math.round(from + (k / (columns - 1)) * (to - from));
  const F = (i: number, c: number) => run.filtered[i * run.cells + c];
  // Top three cells per drawn column.
  const tops: number[][] = [];
  for (let k = 0; k < columns; k++) {
    const i = sampleAt(k);
    if (i > last) break;
    const best = [-1, -1, -1];
    for (let c = 0; c < run.cells; c++) {
      const v = F(i, c);
      if (best[0] < 0 || v > F(i, best[0])) best.splice(0, 0, c);
      else if (best[1] < 0 || v > F(i, best[1])) best.splice(1, 0, c);
      else if (best[2] < 0 || v > F(i, best[2])) best.splice(2, 0, c);
      best.length = 3;
    }
    tops.push(best);
  }
  const traces = new Map<number, string>();
  tops.forEach((list, k) => {
    const i = sampleAt(k);
    for (const c of list) {
      const inPrev = k > 0 && tops[k - 1].includes(c);
      const pt = `${x(i).toFixed(1)},${y(F(i, c)).toFixed(1)}`;
      traces.set(c, (traces.get(c) ?? '') + `${inPrev ? 'L' : 'M'}${pt}`);
    }
  });
  const serving: { cell: number; d: string }[] = [];
  let bandUpper: string[] = [],
    bandLower: string[] = [];
  const bands: string[] = [];
  tops.forEach((_, k) => {
    const i = sampleAt(k),
      cell = run.serving[i];
    if (cell < 0) {
      if (bandUpper.length > 1) bands.push(`M${bandUpper.join('L')}L${bandLower.join('L')}Z`);
      bandUpper = [];
      bandLower = [];
      return;
    }
    const v = F(i, cell),
      pt = `${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    const cur = serving[serving.length - 1];
    if (cur && cur.cell === cell) cur.d += `L${pt}`;
    else serving.push({ cell, d: `M${pt}` });
    if (band > 0) {
      // The A3 threshold above whichever cell is serving: a neighbour must clear it.
      bandUpper.push(
        `${x(i).toFixed(1)},${y(v + run.params.hysDb + run.params.offsetDb).toFixed(1)}`,
      );
      bandLower.unshift(pt);
    }
  });
  if (bandUpper.length > 1) bands.push(`M${bandUpper.join('L')}L${bandLower.join('L')}Z`);
  const step = hi - lo > 40 ? 20 : hi - lo > 20 ? 10 : 5;
  const dbTicks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) dbTicks.push(v);
  const seconds = (to - from) * run.dt,
    every = [2, 5, 10, 20, 30, 60].find((s) => seconds / s <= (compact ? 3.2 : 7)) ?? 60;
  const ride = t('行程');
  const tTicks: number[] = [];
  for (let s = Math.ceil((from * run.dt) / every) * every; s <= to * run.dt + 1e-6; s += every)
    tTicks.push(s);
  const events = run.events.filter(
    (e) => (e.kind === 'handover' || e.kind === 'failure') && e.i >= from && e.i <= last,
  );
  const mark = Math.max(from, Math.min(last, cursorAt ?? last));
  const cursor = x(mark),
    cursorCell = run.serving[mark];
  // Tags for the current top cells, nudged apart but kept beside their own traces.
  const markColumn = Math.min(
    tops.length - 1,
    Math.round(((mark - from) / Math.max(1, to - from)) * (columns - 1)),
  );
  const tagCells = (tops[markColumn] ?? []).slice(0, compact || lanes.length || !ticks ? 2 : 3);
  const tagY: number[] = [];
  tagCells
    .map((c) => y(F(mark, c)) + 5)
    .forEach((v, k) => tagY.push(k ? Math.max(v, tagY[k - 1] + 18) : Math.max(top + 12, v)));
  const tagRight = cursor + 8 + 34 <= width;
  const axisY = height - 6;
  return (
    <svg
      className="ch-traces"
      viewBox={`0 0 ${width} ${height}`}
      style={{ height }}
      role="img"
      aria-label={t('手机测得的各小区信号强度随时间变化')}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={left} y={top - 4} width={w} height={h + 8} />
        </clipPath>
      </defs>
      <text x={left - 8} y={14} textAnchor="end" className="ch-axis">
        dBm
      </text>
      {dbTicks.map((v) => (
        <g key={v}>
          <path d={`M${left} ${y(v)}H${left + w}`} stroke={grid} />
          <text x={left - 8} y={y(v) + 5} textAnchor="end" className="ch-axis">
            {String(v).replace('-', '−')}
          </text>
        </g>
      ))}
      <text x={left - 8} y={axisY} textAnchor="end" className="ch-axis">
        {ride}
      </text>
      {tTicks.map((s) => {
        const tx = x(s / run.dt),
          edge = tx - left < 18;
        return (
          <text
            key={s}
            x={edge ? left : tx}
            y={axisY}
            textAnchor={edge ? 'start' : 'middle'}
            className="ch-axis"
          >
            {fmtS(s)}
          </text>
        );
      })}
      <g clipPath={`url(#${clip})`}>
        {bands.map((d, k) => (
          <path key={k} d={d} fill="#f3dcab" opacity={0.24 * band} />
        ))}
        {[...traces.entries()].map(([c, d]) => (
          <path
            key={c}
            d={d}
            fill="none"
            stroke={chCellColor(colors, c)}
            strokeWidth="1.5"
            opacity=".7"
          />
        ))}
        {serving.map((s, k) => (
          <path
            key={k}
            d={s.d}
            fill="none"
            stroke={chCellColor(colors, s.cell)}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        ))}
        {ticks &&
          events.map((e: ChEvent) => (
            <path
              key={`${e.kind}${e.i}`}
              d={`M${x(e.i)} ${top - 4}V${top + h + 4}`}
              stroke={e.kind === 'failure' ? '#e0786c' : '#f6e7c8'}
              strokeDasharray="2 4"
              opacity=".45"
            />
          ))}
      </g>
      <path
        d={`M${cursor} ${top - 6}V${top + h + lanes.length * laneH}`}
        stroke={ink}
        opacity=".5"
      />
      {cursorCell >= 0 && (
        <circle
          cx={cursor}
          cy={y(F(mark, cursorCell))}
          r="4.5"
          fill={chCellColor(colors, cursorCell)}
          stroke="#1d2433"
          strokeWidth="2"
        />
      )}
      {tagCells.map((c, k) => (
        <text
          key={c}
          x={tagRight ? cursor + 8 : cursor - 8}
          y={Math.min(top + h + 4, tagY[k])}
          textAnchor={tagRight ? 'start' : 'end'}
          className="ch-trace-tag"
          style={{ fill: chCellColor(colors, c) }}
        >
          {layout.cells[c].label}
        </text>
      ))}
      {lanes.map((lane, k) => {
        const y0 = top + h + 10 + k * laneH;
        const end = Math.min(to, lane.upto);
        const segments = end >= from ? chSegments(lane.cells, from, end) : [];
        return (
          <g key={k} opacity={0.4 + 0.6 * lane.emphasis}>
            {textWidth(lane.label) + textWidth(lane.note) + 24 > w ? (
              // Too narrow for two columns: one line, setting then count.
              <text x={left} y={y0 + 14} className="ch-lane-note">
                <tspan className="ch-lane-label">{lane.label}</tspan> {lane.note}
              </text>
            ) : (
              <>
                <text x={left} y={y0 + 14} className="ch-lane-label">
                  {lane.label}
                </text>
                <text x={left + w} y={y0 + 14} textAnchor="end" className="ch-lane-note">
                  {lane.note}
                </text>
              </>
            )}
            <rect x={left} y={y0 + 21} width={w} height="12" rx="6" fill="#8d99ad1f" />
            {segments.map((sg) => (
              <rect
                key={sg.a}
                x={x(sg.a)}
                y={y0 + 21}
                width={Math.max(1.5, x(sg.b + 1) - x(sg.a))}
                height="12"
                fill={chCellColor(colors, sg.cell)}
                opacity=".85"
              />
            ))}
            {lane.marks
              .filter((m) => m.i > from && m.i <= end)
              .map((m) => (
                <path
                  key={m.i}
                  d={`M${x(m.i)} ${y0 + 18}V${y0 + 36}`}
                  stroke={markColor[m.tone]}
                  strokeWidth={m.tone === 'return' ? 2.4 : 1.6}
                />
              ))}
          </g>
        );
      })}
    </svg>
  );
}

/** One carrier, shared inside each cell: fifty resource blocks split among its users. */
export function ChSpectrum({
  width,
  rows,
}: {
  width: number;
  rows: { label: string; users: number; phoneIndex: number; opacity: number; color: string }[];
}) {
  const gap = 2,
    cell = (width - gap * (CH.prbs - 1)) / CH.prbs;
  return (
    <div className="ch-spectrum">
      {rows.map((row, r) => {
        const per = CH.prbs / Math.max(1, row.users);
        return (
          <div key={r} className="ch-spectrum-row" style={{ opacity: row.opacity }}>
            <div className="ch-lane-head">
              <span>{row.label}</span>
              <b>{t('每人约 {0} 块', per.toFixed(1))}</b>
            </div>
            <svg viewBox={`0 0 ${width} 30`} aria-hidden="true">
              {Array.from({ length: CH.prbs }, (_, k) => {
                const owner = Math.min(row.users - 1, Math.floor(k / per));
                const mine = owner === row.phoneIndex;
                return (
                  <rect
                    key={k}
                    x={k * (cell + gap)}
                    y="3"
                    width={cell}
                    height="24"
                    rx={Math.min(3, cell / 3)}
                    fill={mine ? '#f6e7c8' : row.color}
                    opacity={mine ? 1 : owner % 2 ? 0.5 : 0.78}
                  />
                );
              })}
            </svg>
          </div>
        );
      })}
      <div className="ch-spectrum-axis">
        <span>{t('同一段 10 MHz 载波 · 50 个资源块')}</span>
        <span>{t('频率 →')}</span>
      </div>
    </div>
  );
}

/** dBm ruler whose colours are the map's glow scale; markers read the probe from the model. */
export function ChRuler({
  width,
  marks,
}: {
  width: number;
  marks: { dbm: number; label: string; color: string; opacity: number }[];
}) {
  const id = useId().replace(/:/g, '');
  const lo = -122,
    hi = -52,
    pad = 14,
    x = (d: number) => pad + ((d - lo) / (hi - lo)) * (width - 2 * pad);
  return (
    <svg
      className="ch-ruler"
      viewBox={`0 0 ${width} 116`}
      role="img"
      aria-label={t('信号强度标尺与两个小区在手机处的读数')}
    >
      <defs>
        <linearGradient id={id}>
          {CH_GLOW_STOPS.map((s) => (
            <stop key={s.dbm} offset={(s.dbm - lo) / (hi - lo)} stopColor={s.color} />
          ))}
          <stop offset="1" stopColor={CH_GLOW_STOPS[CH_GLOW_STOPS.length - 1].color} />
        </linearGradient>
      </defs>
      <rect x={pad} y="48" width={width - 2 * pad} height="14" rx="7" fill={`url(#${id})`} />
      {[-120, -100, -80, -60].map((d) => (
        <text key={d} x={x(d)} y="84" textAnchor="middle" className="ch-axis">
          {String(d).replace('-', '−')}
        </text>
      ))}
      <text
        x={pad}
        y="30"
        className="ch-axis"
        opacity={marks.some((m) => m.opacity > 0.01) ? 0 : 1}
      >
        RSRP · dBm
      </text>
      {marks.map((m, k) => {
        const mx = x(Math.max(lo, Math.min(hi, m.dbm)));
        const anchor = mx < width * 0.25 ? 'start' : mx > width * 0.75 ? 'end' : 'middle';
        return (
          <g key={k} opacity={m.opacity}>
            <path d={`M${mx} ${k ? 64 : 46}V${k ? 70 : 40}`} stroke={m.color} strokeWidth="2" />
            <circle cx={mx} cy="55" r="7" fill="none" stroke={m.color} strokeWidth="2.5" />
            <text
              x={mx}
              y={k ? 108 : 30}
              textAnchor={anchor}
              style={{ fill: m.color }}
              className="ch-ruler-label"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const CH_INK = { ink, muted };
