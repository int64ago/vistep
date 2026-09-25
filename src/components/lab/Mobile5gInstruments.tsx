import { useEffect, useId, useMemo, useRef, type ReactElement } from 'react';
import { t } from '../../i18n';
import {
  MODULATION_NAME,
  allocateCells,
  arrayFactor,
  arrayField,
  constellation,
  formatRate,
  fsplDb,
  apertureGainDb,
  elementsOnPanel,
  lteEquivalentRate,
  materialLossDb,
  modulationForSnr,
  nrPeakRate,
  nrResourceBlocks,
  numerology,
  occupiedMHz,
  rbGroups,
  receive,
  shannonBits,
  steeringPhases,
  subcarrierSpectrum,
  thresholdSnrDb,
  waitForSlotMs,
  MODULATIONS,
  type Material,
  type Modulation,
} from '../../models/mobile-5g';

export const INK = '#ebe9f5',
  MUTED = '#a9aac2',
  LINE = '#3d4160',
  FAINT = '#2b2e46',
  NR = '#b4a8f6',
  LTE = '#8ccabf',
  YOU = '#f4bd6c',
  ERR = '#f39191',
  F28 = '#92d5ec';

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mix(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
}
const pts = (list: [number, number][]) =>
  list.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
/** Fixed film stage height (desktop and phone compositions are both built to fit it). */
export const STAGE_HEIGHT = 440;
export function rateText(bps: number) {
  const r = formatRate(bps);
  return `${r.value} ${r.unit}`;
}

// ------------------------------------------------------------------ 01 rate box

export type BoxState = {
  width: number; // 0 LTE → 1 NR bandwidth
  depth: number; // bits 6 → 8
  height: number; // layers 2 → 4
  fill: number;
  ghost: number;
  rate: number;
  lteRate: number;
  /** chip text per dimension (width, depth, height), shown once that step is complete */
  factors: (string | null)[];
  /** exploration overrides */
  mhz?: number;
  nRb?: number;
  bits?: number;
  layers?: number;
};

export function RateBox({ w, s }: { w: number; s: BoxState }) {
  const narrow = w < 600;
  const dx = narrow ? 6.5 : 11,
    dy = narrow ? 5 : 8,
    sz = 42;
  const maxBits = 8;
  // desktop margins hold the layer label (left) and the bits label (right) inside the stage
  const left = narrow ? 18 : 132,
    right = narrow ? 18 : 170;
  const sx = (w - left - right - maxBits * dx) / 98.28;
  const X = s.mhz ?? lerp(18, 98.28, s.width),
    B = s.bits ?? lerp(6, 8, s.depth),
    L = s.layers ?? lerp(2, 4, s.height);
  // The headline, the box and its labels form one block, re-centred in the fixed stage as the box
  // grows, so the opening 4G box never sits under an empty band.
  const head = narrow ? 92 : 86,
    foot = narrow ? 122 : 74;
  const h = STAGE_HEIGHT;
  const block = head + B * dy + L * sz + foot;
  const top = head + Math.max(0, (h - block) / 2) + (narrow ? 0 : 0);
  const oy = top + B * dy + L * sz;
  const hy0 = top - head;
  const ox = left;
  const morph = (k: number) => s.mhz === undefined && k > 0.001 && k < 0.999;
  const nRb = s.nRb ?? Math.round(lerp(100, 273, s.width));
  const p = (x: number, y: number, z: number): [number, number] => [
    ox + x * sx + y * dx,
    oy - z * sz - y * dy,
  ];
  const faceColor = mix(LTE, NR, s.mhz ? 1 : s.width);
  const rbPer10 = X / (nRb / 10);
  const cols: number[] = [];
  for (let x = rbPer10; x < X - 0.01; x += rbPer10) cols.push(x);
  const ghostBox = (
    <g opacity={s.ghost * 0.9} fill="none" stroke={LTE} strokeDasharray="4 5" strokeWidth="1.3">
      <polygon points={pts([p(0, 0, 0), p(18, 0, 0), p(18, 0, 2), p(0, 0, 2)])} />
      <polyline points={pts([p(0, 0, 2), p(0, 6, 2), p(18, 6, 2), p(18, 0, 2)])} />
      <polyline points={pts([p(18, 0, 0), p(18, 6, 0), p(18, 6, 2)])} />
    </g>
  );
  const unitCells: ReactElement[] = [];
  const Bi = Math.round(B),
    Li = Math.round(L);
  for (let b = 0; b < Bi; b++)
    for (let l = 0; l < Li; l++) {
      const inset = 0.12;
      unitCells.push(
        <polygon
          key={`${b}-${l}`}
          points={pts([
            p(X, b + inset, l + inset),
            p(X, b + 1 - inset, l + inset),
            p(X, b + 1 - inset, l + 1 - inset),
            p(X, b + inset, l + 1 - inset),
          ])}
          fill={YOU}
          opacity={b + 1 <= B + 0.02 && l + 1 <= L + 0.02 ? 0.92 : 0.25}
        />,
      );
    }
  const f = s.factors;
  const label = (x: number, y: number, text: string, cls = 'm5g-t', anchor = 'middle') => (
    <text x={x} y={y} className={cls} textAnchor={anchor as 'middle'}>
      {text}
    </text>
  );
  const [bx, by] = p(X / 2, 0, 0);
  const [hx, hy] = p(0, 0, L / 2);
  const [sx2, sy2] = p(X, B, L);
  // During a morph the labels name the transition itself; discrete values appear at each end.
  const widthText = morph(s.width) ? '18 → 98 MHz' : `${X.toFixed(0)} MHz · ${nRb} RB`;
  const bitsText = morph(s.depth)
    ? t('{0} → {1} bit / RE', 6, 8)
    : t('{0} bit / RE', Math.round(B));
  const layersText = morph(s.height) ? t('{0} → {1} 层', 2, 4) : t('{0} 层', Math.round(L));
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('速率盒：宽度是带宽，深度是每个资源单元的比特，高度是并行层数')}
    >
      <g opacity={0.25 + 0.75 * s.fill}>
        {/* front face */}
        <polygon
          points={pts([p(0, 0, 0), p(X, 0, 0), p(X, 0, L), p(0, 0, L)])}
          fill={faceColor}
          fillOpacity="0.2"
          stroke={faceColor}
          strokeWidth="1.5"
        />
        {cols.map((x) => (
          <line
            key={x}
            x1={p(x, 0, 0)[0]}
            y1={p(x, 0, 0)[1]}
            x2={p(x, 0, L)[0]}
            y2={p(x, 0, L)[1]}
            stroke={faceColor}
            strokeOpacity="0.35"
          />
        ))}
        {Array.from({ length: Math.max(0, Math.ceil(L) - 1) }, (_, i) => i + 1)
          .filter((z) => z < L - 0.02)
          .map((z) => (
            <line
              key={z}
              x1={p(0, 0, z)[0]}
              y1={p(0, 0, z)[1]}
              x2={p(X, 0, z)[0]}
              y2={p(X, 0, z)[1]}
              stroke={faceColor}
              strokeOpacity="0.6"
            />
          ))}
        {/* top face: bit planes */}
        <polygon
          points={pts([p(0, 0, L), p(X, 0, L), p(X, B, L), p(0, B, L)])}
          fill={faceColor}
          fillOpacity="0.32"
          stroke={faceColor}
          strokeWidth="1.2"
        />
        {Array.from({ length: Math.max(0, Math.ceil(B) - 1) }, (_, i) => i + 1)
          .filter((y) => y < B - 0.02)
          .map((y) => (
            <line
              key={y}
              x1={p(0, y, L)[0]}
              y1={p(0, y, L)[1]}
              x2={p(X, y, L)[0]}
              y2={p(X, y, L)[1]}
              stroke={faceColor}
              strokeOpacity="0.4"
            />
          ))}
        {/* side face: the content of one resource element — bits × layers */}
        <polygon
          points={pts([p(X, 0, 0), p(X, B, 0), p(X, B, L), p(X, 0, L)])}
          fill="#1b1d2d"
          stroke={YOU}
          strokeWidth="1.2"
        />
        {unitCells}
      </g>
      {ghostBox}
      {/* rate headline */}
      <text x={narrow ? 16 : left} y={hy0 + (narrow ? 30 : 38)} className="m5g-big">
        {rateText(s.rate)}
      </text>
      <text x={narrow ? 16 : left} y={hy0 + (narrow ? 52 : 64)} className="m5g-m">
        {t('近似峰值 · 下行')}
      </text>
      {s.ghost > 0.02 && (s.mhz !== undefined || s.width >= 0.999) && (
        <text
          x={narrow ? 16 : w - right}
          y={hy0 + (narrow ? 76 : 38)}
          className="m5g-l"
          textAnchor={narrow ? 'start' : 'end'}
          opacity={s.ghost}
        >
          {t(narrow ? '4G 虚线：{0}' : '4G 虚线（2 层 64QAM）：{0}', rateText(s.lteRate))}
        </text>
      )}
      {/* width */}
      {/* height */}
      {narrow ? (
        <>
          {label(16, by + 30, widthText, 'm5g-t', 'start')}
          {f[0] && label(16, by + 54, f[0]!, 'm5g-chip', 'start')}
          {label(16, by + 82, bitsText, 'm5g-y', 'start')}
          {f[1] && label(w - 16, by + 82, f[1]!, 'm5g-chip', 'end')}
          {label(16, by + 108, layersText, 'm5g-t', 'start')}
          {f[2] && label(w - 16, by + 108, f[2]!, 'm5g-chip', 'end')}
        </>
      ) : (
        <>
          {label(bx, by + 28, widthText)}
          {f[0] && label(bx, by + 52, f[0]!, 'm5g-chip')}
          {label(hx - 14, hy + 5, layersText, 'm5g-t', 'end')}
          {f[2] && label(hx - 14, hy + 29, f[2]!, 'm5g-chip', 'end')}
          {label(sx2 + 14, sy2 + 8, bitsText, 'm5g-y', 'start')}
          {f[1] && label(sx2 + 14, sy2 + 32, f[1]!, 'm5g-chip', 'start')}
        </>
      )}
    </svg>
  );
}

// ------------------------------------------------------------------ 02 OFDM

const REVEAL = [0, 1, -1, 2, -2, 3, -3];
const carrierColor = (k: number) => mix(NR, '#6f86d8', (k + 3) / 6);

export function OfdmSpectrum({
  w,
  h,
  carriers,
  cursor,
  cursorOn,
}: {
  w: number;
  h: number;
  carriers: number;
  cursor: number;
  cursorOn: number;
}) {
  const pad = 18,
    span = 4.3;
  const xOf = (f: number) => pad + ((f + span) / (2 * span)) * (w - 2 * pad);
  const base = h - 100,
    amp = base - 50;
  const yOf = (v: number) => base - v * amp;
  const shown = REVEAL.slice(0, Math.max(1, Math.min(7, carriers)));
  const curves = useMemo(
    () =>
      REVEAL.map((k) => {
        let d = '';
        for (let i = 0; i <= 260; i++) {
          const f = -span + (i / 260) * 2 * span;
          d += `${i ? 'L' : 'M'}${xOf(f).toFixed(1)},${yOf(subcarrierSpectrum(k, f)).toFixed(1)}`;
        }
        return { k, d };
      }),
    [w, h],
  );
  const nearest = Math.round(cursor);
  const others = shown
    .filter((k) => k !== nearest)
    .reduce((m, k) => Math.max(m, Math.abs(subcarrierSpectrum(k, cursor))), 0);
  const cx = xOf(cursor);
  return (
    <g>
      <line x1={pad} x2={w - pad} y1={base} y2={base} stroke={LINE} />
      {curves.map(({ k, d }) => {
        const idx = shown.indexOf(k);
        return (
          <path
            key={k}
            d={d}
            fill="none"
            stroke={carrierColor(k)}
            strokeWidth={k === 0 ? 2.6 : 1.6}
            opacity={idx < 0 ? 0 : k === 0 ? 1 : 0.8}
            style={{ transition: 'opacity 500ms ease' }}
          />
        );
      })}
      {shown.map((k) => (
        <line
          key={k}
          x1={xOf(k)}
          x2={xOf(k)}
          y1={base + 4}
          y2={base + 11}
          stroke={carrierColor(k)}
          strokeWidth="2"
        />
      ))}
      {shown.length > 1 && (
        <g>
          <path
            d={`M${xOf(0)} ${base + 58}H${xOf(1)}M${xOf(0)} ${base + 52}v12M${xOf(1)} ${base + 52}v12`}
            stroke={MUTED}
          />
          <text x={(xOf(0) + xOf(1)) / 2} y={base + 84} className="m5g-m" textAnchor="middle">
            Δf = 15 kHz
          </text>
        </g>
      )}
      <g opacity={cursorOn}>
        <line x1={cx} x2={cx} y1={yOf(1.12)} y2={base} stroke={INK} strokeDasharray="3 5" />
        {shown.map((k) => (
          <circle
            key={k}
            cx={cx}
            cy={yOf(subcarrierSpectrum(k, cursor))}
            r={k === nearest ? 5 : 3.5}
            fill={k === nearest ? carrierColor(k) : '#15172a'}
            stroke={carrierColor(k)}
            strokeWidth="1.5"
          />
        ))}
        <text
          x={Math.min(Math.max(cx, pad + 90), w - pad - 90)}
          y={yOf(1.12) - 12}
          className="m5g-t"
          textAnchor="middle"
        >
          {t('其他子载波：{0}', others.toFixed(2))}
        </text>
      </g>
    </g>
  );
}

export function ResourceGrid({
  w,
  h,
  filled,
  label = true,
}: {
  w: number;
  h: number;
  filled: number;
  label?: boolean;
}) {
  const rows = 12,
    cols = 14;
  const gx = label ? 26 : 0,
    gy = 8;
  const gw = w - gx - 8,
    gh = h - (label ? 104 : 16);
  const cw = gw / cols,
    ch = gh / rows;
  const count = Math.round(filled * rows * cols);
  const cells: ReactElement[] = [];
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const index = c * rows + r;
      cells.push(
        <rect
          key={index}
          x={gx + c * cw + 1.2 + (c >= 7 ? 3 : 0)}
          y={gy + r * ch + 1.2}
          width={cw - 2.4 - 3 / 14}
          height={ch - 2.4}
          rx="2.5"
          fill={index < count ? YOU : carrierColor(((r % 7) - 3) as number)}
          opacity={index < count ? 0.9 : 0.16}
        />,
      );
    }
  return (
    <g>
      {cells}
      {label && (
        <>
          <text
            x={gx - 12}
            y={gy + gh / 2}
            className="m5g-m"
            textAnchor="middle"
            transform={`rotate(-90 ${gx - 12} ${gy + gh / 2})`}
          >
            {t('频率')}
          </text>
          {/* slot boundary: an LTE resource block is 12 subcarriers × 7 symbols (0.5 ms) */}
          {[0, 7].map((c0) => (
            <g key={c0}>
              <path
                d={`M${gx + c0 * cw + (c0 ? 3 : 0) + 2} ${gy + gh + 8}h${7 * cw - 4}`}
                stroke={MUTED}
                strokeOpacity=".6"
              />
              <text
                x={gx + (c0 + 3.5) * cw + (c0 ? 3 : 0)}
                y={gy + gh + 30}
                className="m5g-m"
                textAnchor="middle"
              >
                {w < 420 ? '0.5 ms' : t('0.5 ms · 7 个符号')}
              </text>
            </g>
          ))}
          <text x={gx} y={gy + gh + 60} className="m5g-t">
            {t(w < 420 ? '时间 → · 每块 12 × 7' : '时间 → · 每块：12 个子载波 × 7 个符号')}
          </text>
          <text x={gx} y={gy + gh + 86} className="m5g-m">
            {t(w < 420 ? '1 ms：两个资源块' : '4G 的 1 ms：两个资源块，共 12 × 14 格')}
          </text>
        </>
      )}
    </g>
  );
}

export function Ofdm({
  w,
  carriers,
  cursor,
  cursorOn,
  grid,
  filled,
}: {
  w: number;
  carriers: number;
  cursor: number;
  cursorOn: number;
  grid: number;
  filled: number;
}) {
  const narrow = w < 640;
  const h = narrow ? 420 : 400;
  if (narrow)
    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        role="img"
        aria-label={t('重叠的子载波频谱与资源网格')}
      >
        <g opacity={1 - grid}>
          <OfdmSpectrum w={w} h={h} carriers={carriers} cursor={cursor} cursorOn={cursorOn} />
        </g>
        {grid > 0.01 && (
          <g opacity={grid} transform={`translate(${Math.max(0, (w - 330) / 2)} 0)`}>
            <ResourceGrid w={Math.min(w, 330)} h={h - 8} filled={filled} />
          </g>
        )}
      </svg>
    );
  const sw = w * 0.6,
    gw = w - sw - 40;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('重叠的子载波频谱与资源网格')}
    >
      <g transform={`translate(${lerp((w - sw) / 2, 0, grid)} 0)`}>
        <OfdmSpectrum w={sw} h={h} carriers={carriers} cursor={cursor} cursorOn={cursorOn} />
      </g>
      {grid > 0.01 && (
        <g opacity={grid} transform={`translate(${sw + 40 + (1 - grid) * 30} 14)`}>
          <ResourceGrid w={gw} h={h - 20} filled={filled} />
        </g>
      )}
    </svg>
  );
}

// ------------------------------------------------------------------ 03 constellation

export function Constellation({
  w,
  modulation,
  snrDb,
  count,
}: {
  w: number;
  modulation: Modulation;
  snrDb: number;
  count: number;
}) {
  const narrow = w < 640;
  const plate = narrow ? Math.min(w - 8, 200) : 330;
  const chartW = narrow ? w - 8 : Math.min(420, w - plate - 70);
  const chartH = narrow ? 158 : 250;
  const h = narrow ? plate + chartH + 82 : 410;
  const px = narrow ? (w - plate) / 2 : Math.max(0, (w - plate - chartW - 70) / 2);
  const py = narrow ? 30 : 36;
  const range = 1.45;
  const map = (v: number) => (plate / 2) * (1 + v / range);
  const ideal = useMemo(() => constellation(modulation), [modulation]);
  const samples = useMemo(() => receive(modulation, snrDb, count, 7), [modulation, snrDb, count]);
  const errors = samples.filter((s) => s.error).length;
  const side = 2 ** (modulation / 2),
    scale = Math.sqrt((2 * (side * side - 1)) / 3);
  const bounds: number[] = [];
  for (let k = 1; k < side; k++) bounds.push((2 * k - side) / scale);
  const tracked = samples[0];
  const plateClip = `m5g-plate-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ringR = [0, 0, 7, 0, 5, 0, 3.4, 0, 2.3][modulation];
  // capacity chart
  const cx0 = narrow ? 4 : px + plate + 70,
    cy0 = narrow ? py + plate + 44 : py + 8;
  const cw = chartW - 44,
    ch = chartH - 50;
  const X = (s: number) => cx0 + 36 + (s / 36) * cw;
  const Y = (b: number) => cy0 + ch - (b / 12) * ch;
  let shannon = '';
  for (let s = 0; s <= 36; s += 0.5)
    shannon += `${s ? 'L' : 'M'}${X(s).toFixed(1)},${Y(shannonBits(s)).toFixed(1)}`;
  let stairs = `M${X(0)},${Y(0)}`;
  for (const m of MODULATIONS) {
    const th = thresholdSnrDb(m);
    stairs += `H${X(th).toFixed(1)}V${Y(m).toFixed(1)}`;
  }
  stairs += `H${X(36)}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('星座图：带噪声的接收点和判决边界')}
    >
      <text x={narrow ? 4 : px} y={py - 12} className="m5g-t">
        {MODULATION_NAME[modulation]} · {t('{0} bit / RE', modulation)}
      </text>
      <text
        x={narrow ? w - 4 : px + plate}
        y={py - 12}
        className={errors > count * 0.01 ? 'm5g-e' : 'm5g-m'}
        textAnchor="end"
      >
        {t('误判 {0}%', ((errors / Math.max(1, count)) * 100).toFixed(1))}
      </text>
      <defs>
        <clipPath id={plateClip}>
          <rect width={plate} height={plate} rx="16" />
        </clipPath>
      </defs>
      <rect x={px} y={py} width={plate} height={plate} rx="16" fill="#121424" stroke={LINE} />
      <g transform={`translate(${px} ${py})`} clipPath={`url(#${plateClip})`}>
        <path d={`M${plate / 2} 10V${plate - 10}M10 ${plate / 2}H${plate - 10}`} stroke={FAINT} />
        {bounds.map((b) => (
          <path
            key={b}
            d={`M${map(b)} 6V${plate - 6}M6 ${plate - map(b)}H${plate - 6}`}
            stroke={LINE}
            strokeOpacity={modulation === 8 ? 0.45 : 0.8}
            strokeDasharray="2 4"
          />
        ))}
        {samples.map((s, i) => (
          <circle
            key={i}
            cx={map(s.i)}
            cy={plate - map(s.q)}
            r={modulation === 8 ? 1.5 : 2}
            fill={s.error ? ERR : NR}
            opacity={s.error ? 0.95 : 0.55}
          />
        ))}
        {ideal.map((pt, i) => (
          <circle
            key={i}
            cx={map(pt.i)}
            cy={plate - map(pt.q)}
            r={ringR}
            fill="none"
            stroke={INK}
            strokeOpacity="0.55"
          />
        ))}
        {tracked && (
          <g>
            <line
              x1={map(ideal[tracked.sent].i)}
              y1={plate - map(ideal[tracked.sent].q)}
              x2={map(tracked.i)}
              y2={plate - map(tracked.q)}
              stroke={YOU}
            />
            <circle
              cx={map(ideal[tracked.sent].i)}
              cy={plate - map(ideal[tracked.sent].q)}
              r={ringR + 3}
              fill="none"
              stroke={YOU}
              strokeWidth="2"
            />
            <circle
              cx={map(tracked.i)}
              cy={plate - map(tracked.q)}
              r="3.5"
              fill={tracked.error ? ERR : YOU}
            />
          </g>
        )}
      </g>
      {tracked && (
        <text x={px + plate / 2} y={py + plate + 26} className="m5g-y" textAnchor="middle">
          {t(narrow ? '你的：{0}' : '你的资源单元：{0}', ideal[tracked.sent].bits)}
          {tracked.error
            ? narrow
              ? ` → ${ideal[tracked.decided].bits}`
              : t(' → 判成 {0}', ideal[tracked.decided].bits)
            : ''}
        </text>
      )}
      {/* bits per RE vs SNR */}
      <g>
        <path d={`M${X(0)} ${Y(0)}H${X(36)}M${X(0)} ${Y(0)}V${Y(12)}`} stroke={LINE} />
        {[0, 10, 20, 30].map((s) => (
          <text key={s} x={X(s)} y={Y(0) + 22} className="m5g-m" textAnchor="middle">
            {s}
          </text>
        ))}
        {(narrow ? [4, 8] : [2, 4, 6, 8]).map((b) => (
          <text key={b} x={X(0) - 10} y={Y(b) + 5} className="m5g-m" textAnchor="end">
            {b}
          </text>
        ))}
        <path d={shannon} fill="none" stroke={MUTED} strokeDasharray="4 4" />
        <path d={stairs} fill="none" stroke={YOU} strokeWidth="2" opacity=".8" />
        <text x={X(0) + 10} y={Y(12) + 12} className="m5g-m">
          bit / RE
        </text>
        <text x={X(0) + 10} y={Y(12) + 36} className="m5g-m">
          {'┄ '}
          {t('香农上限')}
        </text>
        <text x={X(36)} y={Y(0) + 46} className="m5g-m" textAnchor="end">
          {t('信噪比 dB')}
        </text>
        <line
          x1={X(snrDb)}
          x2={X(snrDb)}
          y1={Y(0)}
          y2={Y(12)}
          stroke={INK}
          strokeDasharray="3 5"
          opacity=".6"
        />
        <circle cx={X(snrDb)} cy={Y(modulation)} r="6" fill={errors > count * 0.01 ? ERR : YOU} />
        <text
          display={narrow ? 'none' : undefined}
          x={X(snrDb) + (snrDb > 26 ? -12 : 12)}
          y={Y(12) + 16}
          className="m5g-t"
          textAnchor={snrDb > 26 ? 'end' : 'start'}
        >
          SNR {snrDb.toFixed(0)} dB
        </text>
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------ 04 wider channel

export function Band({
  w,
  widen,
  aggregate,
  bandwidthMHz,
  scsKHz,
}: {
  w: number;
  widen: number;
  aggregate: number;
  /** exploration: an explicit NR configuration */
  bandwidthMHz?: number;
  scsKHz?: number;
}) {
  const narrow = w < 640;
  const pad = narrow ? 6 : 24;
  const X = (mhz: number) => pad + (mhz / 100) * (w - 2 * pad);
  const explore = bandwidthMHz !== undefined && scsKHz !== undefined;
  const k = explore ? 1 : widen;
  const bw = explore ? bandwidthMHz : Math.round(lerp(20, 100, k));
  const scs = explore ? scsKHz : k < 0.5 ? 15 : 30;
  const nRb = explore ? nrResourceBlocks(bandwidthMHz, scsKHz) : k < 0.5 ? 100 : 273;
  // occupied width morphs continuously between 100 RB × 180 kHz and 273 RB × 360 kHz
  const occ = explore ? occupiedMHz(nRb, scs) : lerp(18, occupiedMHz(273, 30), k);
  const chan = explore ? bandwidthMHz : lerp(20, 100, k);
  const x0 = (chan - occ) / 2;
  const rbMHz = explore ? (12 * scs) / 1000 : lerp(0.18, 0.36, k);
  const lteRate = lteEquivalentRate({ bandwidthMHz: 20, layers: 4, modulation: 8 });
  const mainRate = explore
    ? nrPeakRate({ bandwidthMHz, scsKHz, layers: 4, modulation: 8 })
    : k < 0.5
      ? lteRate
      : nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 });
  const laneA = narrow ? 40 : 48,
    gh = narrow ? 170 : 200;
  const topA = narrow ? 56 : 40,
    topB = topA + laneA + (narrow ? 104 : 66);
  const h = topB + gh + 54;
  const rows = explore ? 14 * (scs / 15) : 14;
  const rowsNr = 28;
  const cols: number[] = [];
  for (let m = rbMHz * 10; m < occ - 0.05; m += rbMHz * 10) cols.push(m);
  const hLines = (x: number, width: number, y: number, height: number, n: number, o: number) =>
    o > 0.01 && (
      <path
        d={Array.from(
          { length: n - 1 },
          (_, i) =>
            `M${X(x).toFixed(1)} ${(y + ((i + 1) * height) / n).toFixed(1)}H${X(x + width).toFixed(1)}`,
        ).join('')}
        stroke={INK}
        strokeOpacity={0.13 * o}
      />
    );
  const carrierA = (i: number) => (
    <g key={i} opacity={i === 0 ? 1 : aggregate}>
      <rect
        x={X(20 * i + 1)}
        y={topA}
        width={X(19) - X(1)}
        height={laneA}
        rx="6"
        fill={LTE}
        fillOpacity={i === 0 ? 0.32 : 0.14}
        stroke={LTE}
        strokeOpacity=".7"
        strokeDasharray={i === 0 ? undefined : '4 5'}
      />
      {hLines(20 * i + 1, 18, topA, laneA, 14, 1)}
    </g>
  );
  const moving = !explore && k > 0.02 && k < 0.98;
  const nrLabel = moving
    ? `${Math.round(chan)} MHz …`
    : narrow
      ? t('{0} MHz · {1} RB', explore ? bw : k < 0.5 ? 20 : 100, nRb)
      : t('{0} MHz · {1} RB · {2} kHz', explore ? bw : k < 0.5 ? 20 : 100, nRb, scs);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('同一时间轴上的 4G 与 5G 载波宽度')}
    >
      <text x={pad} y={topA - 14} className="m5g-l">
        {t(
          narrow ? '4G 估算 20 MHz：{0}' : '4G 估算 · 20 MHz · 4 层 256QAM：{0}',
          rateText(lteRate),
        )}
      </text>
      {[0, 1, 2, 3, 4].map((i) => (i === 0 || aggregate > 0.01 ? carrierA(i) : null))}
      {aggregate > 0.01 && !explore && (
        <text
          x={narrow ? pad : X(100)}
          y={topA + laneA + (narrow ? 30 : 28)}
          className="m5g-l"
          textAnchor={narrow ? 'start' : 'end'}
          opacity={aggregate}
        >
          {t('载波聚合 5 × 20 MHz ≈ {0}', rateText(5 * lteRate))}
        </text>
      )}
      <text x={pad} y={topB - (narrow ? 38 : 14)} className="m5g-y">
        {t('你的载波：{0}', nrLabel)}
      </text>
      <text
        x={narrow ? pad : X(100)}
        y={topB - 14}
        className="m5g-n"
        textAnchor={narrow ? 'start' : 'end'}
        opacity={moving ? 0 : 1}
      >
        {rateText(mainRate)}
      </text>
      <path
        d={`M${X(0)} ${topB - 6}V${topB - 2}H${X(chan)}V${topB - 6}`}
        stroke={YOU}
        strokeOpacity=".6"
        fill="none"
      />
      <rect
        x={X(x0)}
        y={topB}
        width={X(x0 + occ) - X(x0)}
        height={gh}
        rx="7"
        fill={YOU}
        fillOpacity=".2"
        stroke={YOU}
        strokeOpacity=".85"
      />
      <path
        d={cols.map((m) => `M${X(x0 + m).toFixed(1)} ${topB}V${topB + gh}`).join('')}
        stroke={YOU}
        strokeOpacity=".4"
      />
      {explore ? (
        hLines(x0, occ, topB, gh, rows, 1)
      ) : (
        <>
          {hLines(x0, occ, topB, gh, 14, 1 - k)}
          {hLines(x0, occ, topB, gh, rowsNr, k)}
        </>
      )}
      <text
        x={X(0) + (narrow ? 0 : -10)}
        y={topB + gh / 2}
        className="m5g-m"
        textAnchor="middle"
        transform={`rotate(-90 ${X(0) - (narrow ? -12 : 10)} ${topB + gh / 2})`}
        opacity={narrow ? 0 : 1}
      >
        1 ms
      </text>
      {(narrow ? [0, 25, 50, 75, 100] : [0, 20, 40, 60, 80, 100]).map((m) => (
        <g key={m}>
          <line x1={X(m)} x2={X(m)} y1={topB + gh + 8} y2={topB + gh + 14} stroke={MUTED} />
          {(!narrow || m % 50 === 0) && (
            <text
              x={X(m)}
              y={topB + gh + 36}
              className="m5g-m"
              textAnchor={m === 0 ? 'start' : m === 100 ? 'end' : 'middle'}
            >
              {m === 100 ? '100 MHz' : m}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ------------------------------------------------------------------ 05 path loss

export function PathLoss({
  w,
  panel,
  material,
  wall,
}: {
  w: number;
  panel: number;
  material: Material | null;
  wall: number;
}) {
  const narrow = w < 640;
  const pad = narrow ? 44 : 60,
    top = narrow ? 70 : 44,
    ph = narrow ? 200 : 230;
  const sceneY = top + ph + 30,
    h = sceneY + (narrow ? 126 : 104);
  const d0 = 5,
    d1 = 300,
    wallAt = 120,
    phoneAt = 280;
  const X = (d: number) => pad + ((d - d0) / (d1 - d0)) * (w - pad - (narrow ? 16 : 40));
  const yMax = 20,
    yMin = -100;
  const Y = (v: number) => top + ((yMax - Math.max(yMin, Math.min(yMax, v))) / (yMax - yMin)) * ph;
  // Curves use the unclamped scale and are clipped at the plot floor: an off-scale level leaves
  // the chart instead of being drawn at a wrong value.
  const Yraw = (v: number) => top + ((yMax - Math.max(yMin - 40, v)) / (yMax - yMin)) * ph;
  const clip = `m5g-plot-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const side = 4 * (299_792_458 / 3.5e9 / 2);
  const area = side * side;
  const gain35 = apertureGainDb(area, 3.5e9) * panel,
    gain28 = apertureGainDb(area, 28e9) * panel;
  const loss = (f: number) => (material ? materialLossDb(material, f) * wall : 0);
  const ref = fsplDb(1, 3.5e9);
  const level = (d: number, f: number, g: number) =>
    ref - fsplDb(d, f * 1e9) + g - (d > wallAt ? loss(f) : 0);
  const curve = (f: number, g: number) => {
    let s = '';
    for (let i = 0; i <= 150; i++) {
      const d = d0 + ((d1 - d0) * i) / 150;
      s += `${i ? 'L' : 'M'}${X(d).toFixed(1)},${Yraw(level(d, f, g)).toFixed(1)}`;
    }
    return s;
  };
  const at35 = level(phoneAt, 3.5, gain35),
    at28 = level(phoneAt, 28, gain28);
  const diffAt = 40;
  const diff = level(diffAt, 3.5, gain35) - level(diffAt, 28, gain28);
  const n35 = elementsOnPanel(side, 3.5e9),
    n28 = elementsOnPanel(side, 28e9);
  const panelPx = narrow ? 30 : 38;
  const mastX = X(d0) - (narrow ? 22 : 30);
  const wallName: Record<Material, string> = {
    glass: '普通玻璃',
    irrGlass: '镀膜节能玻璃',
    concrete: '混凝土墙',
    wood: '木板',
  };
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('3.5 GHz 与 28 GHz 沿路径的接收电平')}
    >
      {[20, 0, -20, -40, -60, -80, -100].map((v) => (
        <g key={v}>
          <line x1={X(d0)} x2={X(d1)} y1={Y(v)} y2={Y(v)} stroke={FAINT} />
          {v % 40 === 0 && (
            <text x={X(d0) - 8} y={Y(v) + 5} className="m5g-m" textAnchor="end">
              {String(v).replace('-', '−')}
            </text>
          )}
        </g>
      ))}
      <text x={X(d0) - 8} y={top + 5} className="m5g-m" textAnchor="end">
        dB
      </text>
      {material && (
        <rect
          x={X(wallAt) - 4}
          y={top}
          width="8"
          height={sceneY - top + 40}
          rx="3"
          fill={material === 'concrete' ? '#6d6e7f' : '#7fb5cf'}
          opacity={0.45 * wall}
        />
      )}
      <defs>
        <clipPath id={clip}>
          <rect x={X(d0) - 4} y={top - 8} width={X(d1) - X(d0) + 8} height={Y(yMin) - top + 9} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <path d={curve(3.5, gain35)} fill="none" stroke={NR} strokeWidth="2.4" />
        <path d={curve(28, gain28)} fill="none" stroke={F28} strokeWidth="2.4" />
      </g>
      {at28 < yMin && (
        <g>
          {/* break marker where the 28 GHz line leaves the chart */}
          <path
            d={`M${X(wallAt) + 3} ${Y(yMin) + 6}l6 -5l6 5l6 -5`}
            stroke={F28}
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d={`M${X(phoneAt) - 6} ${Y(yMin) + 4}l6 8l6 -8`}
            stroke={F28}
            strokeWidth="2"
            fill="none"
          />
        </g>
      )}
      {panel < 0.98 && (
        <g opacity={1 - panel}>
          <path
            d={`M${X(diffAt)} ${Y(level(diffAt, 3.5, gain35)) + 4}V${Y(level(diffAt, 28, gain28)) - 4}`}
            stroke={INK}
          />
          <text x={X(diffAt) + 6} y={Y(level(diffAt, 28, gain28)) + 26} className="m5g-t">
            {`−${diff.toFixed(1)} dB`}
          </text>
        </g>
      )}
      {material && wall > 0.02 && narrow && (
        <text x={X(wallAt) + 10} y={top + 18} className="m5g-m" opacity={wall}>
          {t(wallName[material])}
        </text>
      )}
      {material && wall > 0.02 && !narrow && (
        <g opacity={wall}>
          <text x={X(wallAt) + 12} y={top + (narrow ? 22 : 2)} className="m5g-t">
            {t(wallName[material])}
          </text>
          <text x={X(wallAt) + 12} y={top + (narrow ? 46 : 26)} className="m5g-n">
            {`3.5 GHz −${materialLossDb(material, 3.5).toFixed(0)} dB`}
          </text>
          <text x={X(wallAt) + 12} y={top + (narrow ? 70 : 50)} className="m5g-f">
            {`28 GHz −${materialLossDb(material, 28).toFixed(0)} dB`}
          </text>
        </g>
      )}
      {/* phone levels */}
      <line
        x1={X(phoneAt)}
        x2={X(phoneAt)}
        y1={top}
        y2={sceneY + 10}
        stroke={MUTED}
        strokeDasharray="2 5"
      />
      <circle cx={X(phoneAt)} cy={Y(at35)} r="5" fill={NR} />
      {at28 >= yMin && <circle cx={X(phoneAt)} cy={Y(at28)} r="5" fill={F28} />}
      {at28 < yMin && (
        <text x={X(phoneAt) - 12} y={Y(yMin) - 10} className="m5g-f" textAnchor="end">
          {narrow
            ? `${at28.toFixed(0).replace('-', '−')} dB`
            : t('28 GHz 在图外：{0} dB', at28.toFixed(0).replace('-', '−'))}
        </text>
      )}
      {narrow ? (
        <g>
          <text x={X(d0) + 4} y={top - 40} className="m5g-n">
            {`━ 3.5 GHz${material && wall > 0.5 ? ` · ${t('穿墙 −{0} dB', materialLossDb(material, 3.5).toFixed(0))}` : ''}`}
          </text>
          <text x={X(d0) + 4} y={top - 16} className="m5g-f">
            {`━ 28 GHz${material && wall > 0.5 ? ` · ${t('穿墙 −{0} dB', materialLossDb(material, 28).toFixed(0))}` : ''}`}
          </text>
        </g>
      ) : (
        <text x={X(d1)} y={Y(level(d1, 3.5, gain35)) - 12} className="m5g-n" textAnchor="end">
          3.5 GHz
        </text>
      )}
      <text
        display={
          at28 < yMin || (narrow && Math.abs(level(d1, 28, gain28) - level(d1, 3.5, gain35)) >= 1)
            ? 'none'
            : undefined
        }
        x={X(d1)}
        y={Math.min(Y(yMin) - 8, Y(level(d1, 28, gain28)) + 28)}
        className="m5g-f"
        textAnchor="end"
      >
        {Math.abs(level(d1, 28, gain28) - level(d1, 3.5, gain35)) < 1
          ? t('28 GHz 与之重合')
          : '28 GHz'}
      </text>
      {/* scene strip */}
      <line x1={pad - 30} x2={w - 10} y1={sceneY + 44} y2={sceneY + 44} stroke={LINE} />
      <path d={`M${mastX} ${sceneY + 44}V${sceneY - 4}`} stroke={MUTED} strokeWidth="3" />
      <g transform={`translate(${mastX - panelPx / 2} ${sceneY - 4 - panelPx})`}>
        <rect
          width={panelPx}
          height={panelPx}
          rx="4"
          fill="#20233a"
          stroke={MUTED}
          opacity={panel}
        />
        {/* single antenna → same-size panel: the icon always matches the heading */}
        <circle cx={panelPx / 2} cy={panelPx / 2} r={4} fill={NR} opacity={1 - panel} />
        {Array.from({ length: n35.perSide ** 2 }, (_, i) => (
          <circle
            key={`a${i}`}
            cx={((i % n35.perSide) + 0.5) * (panelPx / n35.perSide)}
            cy={(Math.floor(i / n35.perSide) + 0.5) * (panelPx / n35.perSide)}
            r={2.6}
            fill={NR}
            opacity={panel}
          />
        ))}
        {panel > 0.02 &&
          Array.from({ length: n28.perSide }, (_, i) => (
            <path
              key={`b${i}`}
              d={`M${((i + 0.5) * panelPx) / n28.perSide} 1V${panelPx - 1}`}
              stroke={F28}
              strokeWidth=".5"
              strokeDasharray={`0.6 ${panelPx / n28.perSide - 0.6}`}
              opacity={panel}
            />
          ))}
      </g>
      <text x={mastX - panelPx / 2} y={sceneY + 70} className="m5g-m">
        {panel >= 0.5 ? t('同尺寸面板') : t('单天线')}
      </text>
      {material && (
        <rect
          x={X(wallAt) - 5}
          y={sceneY - 6}
          width="10"
          height="50"
          rx="3"
          fill={material === 'concrete' ? '#8a8b9b' : '#9cd0e6'}
          opacity={wall}
        />
      )}
      <rect
        x={X(phoneAt) - 9}
        y={sceneY + 12}
        width="18"
        height="32"
        rx="5"
        fill="#20233a"
        stroke={INK}
      />
      <text x={X(phoneAt)} y={sceneY + 70} className="m5g-m" textAnchor="middle">
        {`${phoneAt} m`}
      </text>
      {panel > 0.02 &&
        (narrow ? (
          <g opacity={panel}>
            <text x={mastX - panelPx / 2} y={sceneY + 92} className="m5g-n">
              {t('{0} GHz：{1} 个单元', 3.5, n35.total)}
            </text>
            <text x={mastX - panelPx / 2} y={sceneY + 116} className="m5g-f">
              {t('{0} GHz：{1} 个单元', 28, n28.total)}
            </text>
          </g>
        ) : (
          <text x={mastX - panelPx / 2} y={sceneY + 94} className="m5g-m" opacity={panel}>
            {t('{0} 个 3.5 GHz 单元 · {1} 个 28 GHz 单元', n35.total, n28.total)}
          </text>
        ))}
    </svg>
  );
}

// ------------------------------------------------------------------ 06 beam

export function BeamField({
  w,
  elements,
  steerDeg,
  targetDeg,
  wavePhase,
  planar,
}: {
  w: number;
  elements: number;
  steerDeg: number;
  targetDeg: number;
  wavePhase: number;
  planar: number;
}) {
  const narrow = w < 640;
  const h = STAGE_HEIGHT;
  const canvas = useRef<HTMLCanvasElement>(null);
  const lambdaPx = narrow ? 24 : 30;
  const cx = w / 2,
    cy = h - 50;
  const phases = useMemo(() => steeringPhases(elements, steerDeg), [elements, steerDeg]);
  // The complex field depends only on geometry and the element phases; the travelling wave is a
  // global phase rotation, so each animation frame is a cheap per-pixel rotation of this cache.
  const cell = narrow ? 3 : 4;
  const field = useMemo(() => {
    const gw = Math.ceil(w / cell),
      gh = Math.ceil(h / cell);
    const re = new Float32Array(gw * gh),
      im = new Float32Array(gw * gh),
      level = new Float32Array(gw * gh);
    const norm = 1 / Math.sqrt(elements);
    const full = Math.log1p(8);
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i;
        const x = ((i + 0.5) * cell - cx) / lambdaPx,
          y = (cy - (j + 0.5) * cell) / lambdaPx;
        if (y < -0.2) {
          level[k] = -1;
          continue;
        }
        const f = arrayField(x, y, phases, 0);
        const mag = Math.hypot(f.re, f.im) || 1e-9;
        // Equal total radiated power (amplitude 1/√N per element). The √r factor only undoes
        // cylindrical spreading for display, so brightness ∝ log(1 + intensity relative to one
        // isotropic element): one antenna is uniformly dim, a steered lobe of N elements N× brighter.
        const amp = mag * norm * Math.sqrt(Math.hypot(x, y) + 0.5);
        level[k] = Math.min(1, Math.log1p(amp * amp) / full) ** 1.3;
        re[k] = f.re / mag;
        im[k] = f.im / mag;
      }
    return { gw, gh, re, im, level };
  }, [w, h, cell, cx, cy, lambdaPx, phases, elements]);
  const buffers = useRef<{ small: HTMLCanvasElement; img: ImageData } | null>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
    const small = document.createElement('canvas');
    small.width = field.gw;
    small.height = field.gh;
    const sctx = small.getContext('2d');
    buffers.current = sctx ? { small, img: sctx.createImageData(field.gw, field.gh) } : null;
    return () => {
      buffers.current = null;
    };
  }, [w, h, field]);
  useEffect(() => {
    const el = canvas.current,
      buf = buffers.current;
    const ctx = el?.getContext('2d');
    const sctx = buf?.small.getContext('2d');
    if (!el || !buf || !ctx || !sctx) return;
    const c = Math.cos(wavePhase),
      sn = Math.sin(wavePhase),
      data = buf.img.data;
    for (let k = 0; k < field.level.length; k++) {
      const o = k * 4,
        l = field.level[k];
      if (l < 0) {
        data[o + 3] = 0;
        continue;
      }
      const crest = 0.5 + 0.5 * (field.re[k] * c + field.im[k] * sn);
      const b = l * (0.4 + 0.6 * crest);
      data[o] = 22 + 176 * b;
      data[o + 1] = 24 + 162 * b;
      data[o + 2] = 42 + 213 * b;
      data[o + 3] = 255;
    }
    sctx.putImageData(buf.img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.drawImage(
      buf.small,
      0,
      0,
      field.gw * cell * (el.width / w),
      field.gh * cell * (el.height / h),
    );
  }, [field, wavePhase, w, h, cell]);
  const R = narrow ? Math.min(cy - 40, (w / 2 - 24) / 0.5) : Math.min(cy - 40, w / 2 - 30);
  // the main lobe is scaled so it stays inside the stage at any steering angle
  const lobeR = Math.min(
    R * 0.92,
    (w / 2 - 16) / Math.max(0.5, Math.abs(Math.sin((steerDeg * Math.PI) / 180))),
  );
  const lobe = useMemo(() => {
    let d = '';
    for (let a = -90; a <= 90; a += 1) {
      const g = arrayFactor(elements, steerDeg, a);
      const r = lobeR * g;
      const rad = (a * Math.PI) / 180;
      d += `${a === -90 ? 'M' : 'L'}${(cx + r * Math.sin(rad)).toFixed(1)},${(cy - r * Math.cos(rad)).toFixed(1)}`;
    }
    return d;
  }, [elements, steerDeg, lobeR, cx, cy]);
  const tr = (targetDeg * Math.PI) / 180;
  const rt = Math.min(R, (w / 2 - 24) / Math.max(Math.abs(Math.sin(tr)), 1e-3));
  const tx = cx + rt * Math.sin(tr),
    ty = cy - rt * Math.cos(tr);
  const spacing = lambdaPx / 2;
  return (
    <div className="m5g-beam" style={{ width: w, height: h }}>
      <canvas ref={canvas} style={{ width: w, height: h }} aria-hidden="true" />
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        role="img"
        aria-label={t('天线阵列的相位决定波束方向')}
      >
        <path
          d={lobe}
          fill={NR}
          fillOpacity=".08"
          stroke={YOU}
          strokeWidth="1.6"
          strokeOpacity=".85"
        />
        <path
          d={`M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={MUTED}
          strokeOpacity=".35"
          strokeDasharray="2 6"
        />
        <g transform={`translate(${tx} ${ty}) rotate(${targetDeg})`}>
          <rect
            x="-10"
            y="-17"
            width="20"
            height="34"
            rx="5"
            fill="#1d2034"
            stroke={YOU}
            strokeWidth="1.6"
          />
        </g>
        {phases.map((ph, n) => {
          const ex = cx + (n - (elements - 1) / 2) * spacing;
          const a = -ph;
          return (
            <g key={n}>
              <circle
                cx={ex}
                cy={cy + 22}
                r={Math.min(8, spacing * 0.42)}
                fill="#15172a"
                stroke={NR}
              />
              <line
                x1={ex}
                y1={cy + 22}
                x2={ex + Math.min(7, spacing * 0.38) * Math.sin(a)}
                y2={cy + 22 - Math.min(7, spacing * 0.38) * Math.cos(a)}
                stroke={YOU}
                strokeWidth="1.6"
              />
              <rect x={ex - 2} y={cy - 4} width="4" height="10" rx="1.5" fill={INK} />
            </g>
          );
        })}
        {planar > 0.01 && (
          <g opacity={planar} transform={`translate(${narrow ? 16 : 28} ${narrow ? 18 : 26})`}>
            <rect
              x="-10"
              y="-10"
              width={narrow ? w - 12 : 330}
              height="76"
              rx="14"
              fill="#15172a"
              fillOpacity=".85"
              stroke={MUTED}
              strokeOpacity=".5"
              strokeDasharray="4 5"
            />
            {Array.from({ length: 64 }, (_, i) => (
              <rect
                key={i}
                x={(i % 8) * 7}
                y={Math.floor(i / 8) * 7}
                width="5"
                height="5"
                rx="1"
                fill={Math.floor(i / 8) === 3 ? YOU : NR}
                opacity={Math.floor(i / 8) === 3 ? 1 : 0.7}
              />
            ))}
            <text x="68" y="18" className="m5g-t">
              {t('8 × 8 平面阵 · 增益 +{0} dB', (10 * Math.log10(64)).toFixed(1))}
            </text>
            <text x="68" y="42" className="m5g-y">
              {t('画面：其中一行，8 个单元')}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------ 07 layers and slots

const LAYER_TINT = [YOU, '#f0a3a3', '#9fd8c6', '#a9b8f8'];

export function Layers({ w, count, stack }: { w: number; count: number; stack: number }) {
  const narrow = w < 640;
  const h = narrow ? 300 : 330;
  const cx = w / 2,
    sheetW = narrow ? Math.min(170, w - 150) : 250,
    sheetH = narrow ? 58 : 74,
    skew = narrow ? 34 : 50;
  const gap = narrow ? 30 : 38;
  const baseY = h - 60;
  const bsX = narrow ? 24 : 70,
    phX = w - (narrow ? 24 : 70);
  const sheets = Array.from({ length: 4 }, (_, i) => i);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('多个空间层在同一时频资源上并行')}
    >
      {/* antennas */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect
            x={bsX - 4}
            y={baseY - 150 + i * 36}
            width="8"
            height="26"
            rx="3"
            fill={3 - i < count ? INK : LINE}
          />
          <rect
            x={phX - 3}
            y={baseY - 140 + i * 30}
            width="6"
            height="18"
            rx="3"
            fill={3 - i < count ? INK : LINE}
          />
        </g>
      ))}
      <text
        x={narrow ? 8 : bsX}
        y={baseY + 30}
        className="m5g-m"
        textAnchor={narrow ? 'start' : 'middle'}
      >
        {t('基站')}
      </text>
      <text
        x={narrow ? w - 8 : phX}
        y={baseY + 30}
        className="m5g-m"
        textAnchor={narrow ? 'end' : 'middle'}
      >
        {t('手机')}
      </text>
      {sheets.map((i) => {
        const on = i < count;
        const y = baseY - 30 - i * gap;
        const x = cx - sheetW / 2 - skew / 2;
        return (
          <g key={i} opacity={on ? stack : 0} style={{ transition: 'opacity 600ms ease' }}>
            <path
              d={`M${bsX + 8} ${baseY - 137 + (3 - i) * 36}C${x - 30} ${y - sheetH / 2} ${x} ${y - sheetH / 2} ${x + skew / 2} ${y - sheetH / 2}`}
              stroke={LAYER_TINT[i]}
              strokeOpacity=".55"
              fill="none"
            />
            <path
              d={`M${x + sheetW + skew / 2} ${y - sheetH / 2}C${x + sheetW + 40} ${y - sheetH / 2} ${phX - 40} ${baseY - 131 + (3 - i) * 30} ${phX - 5} ${baseY - 131 + (3 - i) * 30}`}
              stroke={LAYER_TINT[i]}
              strokeOpacity=".55"
              fill="none"
            />
            <polygon
              points={pts([
                [x, y],
                [x + sheetW, y],
                [x + sheetW + skew, y - sheetH],
                [x + skew, y - sheetH],
              ])}
              fill={LAYER_TINT[i]}
              fillOpacity=".2"
              stroke={LAYER_TINT[i]}
              strokeWidth="1.3"
            />
            {Array.from({ length: 13 }, (_, c) => (
              <line
                key={c}
                x1={x + ((c + 1) * sheetW) / 14}
                y1={y}
                x2={x + ((c + 1) * sheetW) / 14 + skew}
                y2={y - sheetH}
                stroke={LAYER_TINT[i]}
                strokeOpacity=".3"
              />
            ))}
            <text
              x={narrow ? x + 10 : x + sheetW + skew + 12}
              y={narrow ? y - 9 : y - sheetH / 2 + 5}
              className="m5g-t"
              fill={LAYER_TINT[i]}
              style={{ fill: LAYER_TINT[i] }}
            >
              {t('层 {0}', i + 1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Slots({
  w,
  rows,
  arrivalMs,
  scsList = [15, 30, 120],
  arrival = 1,
}: {
  w: number;
  rows: number[];
  arrivalMs: number;
  scsList?: number[];
  /** 0–1: the arrival marker and waits appear when the narration reaches them */
  arrival?: number;
}) {
  const narrow = w < 640;
  const labelW = narrow ? 0 : 150;
  const x0 = (narrow ? 12 : 24) + labelW,
    x1 = w - (narrow ? 12 : 24);
  const rowH = narrow ? 84 : 86;
  const top = 44;
  const h = top + scsList.length * rowH + 30;
  const X = (ms: number) => x0 + ms * (x1 - x0);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('不同子载波间隔下的时隙长度与等待时间')}
    >
      {scsList.map((scs, r) => {
        const y = top + r * rowH + (narrow ? 30 : 12);
        return (
          <line
            key={scs}
            x1={X(arrivalMs)}
            x2={X(arrivalMs)}
            y1={r === 0 ? top - 14 : y - 6}
            y2={y + 40}
            stroke={YOU}
            strokeDasharray="3 5"
            opacity={Math.min(rows[r] ?? 1, arrival)}
          />
        );
      })}
      <text x={X(arrivalMs)} y={top - 20} className="m5g-y" textAnchor="middle" opacity={arrival}>
        {t('数据到达')}
      </text>
      {scsList.map((scs, r) => {
        const n = numerology(scs);
        const y = top + r * rowH + (narrow ? 30 : 12);
        const wait = waitForSlotMs(arrivalMs, scs);
        const slots = Math.round(1 / n.slotMs);
        const opacity = rows[r] ?? 1;
        const tileW = 10 * (scs / 15) ** 0.5,
          tileH = 10 / (scs / 15) ** 0.5;
        return (
          <g key={scs} opacity={opacity}>
            {narrow ? (
              <text x={x0} y={y - 10} className="m5g-t">
                {`${scs} kHz · ${t('时隙 {0} ms', n.slotMs)}`}
              </text>
            ) : (
              <>
                <text x={24} y={y + 20} className="m5g-t">{`${scs} kHz`}</text>
                <text x={24} y={y + 44} className="m5g-m">
                  {t('时隙 {0} ms', n.slotMs)}
                </text>
                <rect
                  x={labelW - 6 - tileW}
                  y={y + 24 - tileH / 2}
                  width={tileW}
                  height={tileH}
                  fill="none"
                  stroke={NR}
                />
              </>
            )}
            {Array.from({ length: slots }, (_, s) => (
              <rect
                key={s}
                x={X(s * n.slotMs) + 1.5}
                y={y}
                width={X(n.slotMs) - X(0) - 3}
                height="34"
                rx={Math.min(6, (X(n.slotMs) - X(0)) / 4)}
                fill={NR}
                fillOpacity=".16"
                stroke={NR}
                strokeOpacity=".6"
              />
            ))}
            <rect
              x={X(arrivalMs)}
              y={y + 12}
              width={Math.max(2, X(arrivalMs + wait) - X(arrivalMs))}
              height="10"
              rx="5"
              fill={YOU}
              opacity={arrival}
            />
            <text
              opacity={arrival}
              x={Math.min(X(arrivalMs + wait) + 8, x1)}
              y={y + 58}
              className="m5g-y"
              textAnchor={X(arrivalMs + wait) + 8 > x1 - 80 ? 'end' : 'start'}
            >
              {t('等 {0} ms', wait.toFixed(wait < 0.1 ? 3 : 2))}
            </text>
          </g>
        );
      })}
      {[0, 0.5, 1].map((ms) => (
        <text
          key={ms}
          x={X(ms)}
          y={h - 4}
          className="m5g-m"
          textAnchor={ms === 0 ? 'start' : ms === 1 ? 'end' : 'middle'}
        >
          {`${ms} ms`}
        </text>
      ))}
    </svg>
  );
}

// ------------------------------------------------------------------ 08 sharing

const OTHER = ['#565b86', '#4a6d74', '#6a5a80', '#5a6a8e', '#4f5f70'];

export function shareModel({
  users,
  snrDb,
  backhaulBps,
  system,
}: {
  users: number;
  snrDb: number;
  backhaulBps: number;
  system: 'NR' | 'LTE';
}) {
  const nRb = system === 'NR' ? 273 : 100;
  const groups = rbGroups(nRb, system === 'NR' ? 16 : 4);
  const alloc = allocateCells(groups, 14, users);
  const peak =
    system === 'NR'
      ? nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 })
      : lteEquivalentRate({ bandwidthMHz: 20, layers: 4, modulation: 8 });
  const qm = modulationAt(snrDb);
  const ratio = qm / 8;
  const radio = peak * ratio * alloc.share[0];
  const transport = backhaulBps / users;
  return {
    groups,
    alloc,
    peak,
    qm,
    ratio,
    radio,
    transport,
    rate: Math.min(radio, transport),
    nRb,
  };
}
const modulationAt = (snr: number) => modulationForSnr(snr) ?? 0;

export function ShareGrid({
  w,
  users,
  snrDb,
  backhaulBps,
  backhaul,
  lte,
}: {
  w: number;
  users: number;
  snrDb: number;
  backhaulBps: number;
  backhaul: number;
  lte: number;
}) {
  const narrow = w < 640;
  const pad = narrow ? 8 : 24;
  const gw = w - 2 * pad;
  // The 5G grid is taller until the 4G comparison row arrives, then yields its space to it
  // (continuous with the chapter progress, so the stage never has an empty band).
  const lteH = narrow ? 50 : 60;
  const gh = (narrow ? 76 : 140) + (1 - lte) * (lteH + 44);
  const top = 20;
  const nr = shareModel({ users, snrDb, backhaulBps, system: 'NR' });
  const lt = shareModel({ users, snrDb, backhaulBps, system: 'LTE' });
  const occNr = occupiedMHz(273, 30);
  const mhzPx = gw / occNr;
  const grid = (
    m: ReturnType<typeof shareModel>,
    y: number,
    height: number,
    rbKHz: number,
    x = pad,
  ) => {
    const rbPx = (rbKHz / 1000) * mhzPx;
    const G = m.groups.length;
    return m.alloc.owner.map((u, i) => {
      const g = m.groups[i % G],
        s = Math.floor(i / G);
      const cx = x + g.start * rbPx,
        cw = g.size * rbPx;
      const ch = height / 14;
      const mine = u === 0;
      // gaps shrink with the cell so narrow 4G cells stay at least one device pixel wide
      const gap = Math.min(0.8, cw / 6);
      return (
        <g key={i}>
          <rect
            x={cx + gap}
            y={y + s * ch + 0.8}
            width={Math.max(1, cw - 2 * gap)}
            height={ch - 1.6}
            rx="1.5"
            fill={mine ? '#3a3020' : OTHER[u % OTHER.length]}
            opacity={mine ? 1 : 0.55}
          />
          {mine && (
            <rect
              x={cx + gap}
              y={y + s * ch + 0.8}
              width={Math.max(0.6, Math.max(1, cw - 2 * gap) * m.ratio)}
              height={ch - 1.6}
              rx="1.5"
              fill={YOU}
            />
          )}
        </g>
      );
    });
  };
  const infoRows = narrow ? 3 : 2;
  const lteY = top + gh + 26 * infoRows + (narrow ? 36 : 30);
  const barsY = lteY + lte * (lteH + 44);
  const barX = narrow ? pad : pad + 150;
  const barMax = narrow ? gw - 4 : gw - 330;
  const maxBar = Math.max(nr.radio, nr.transport, 1);
  const barW = (v: number) => Math.max(3, (v / maxBar) * barMax);
  const rowGap = narrow ? 44 : 32;
  const h = barsY + rowGap * 2 + (narrow ? 48 : 30);
  const bar = (y: number, label: string, v: number, color: string, strong: boolean) =>
    narrow ? (
      <g>
        <text x={pad} y={y} className="m5g-m">
          {label}
        </text>
        <text x={w - pad} y={y} className="m5g-t" textAnchor="end">
          {rateText(v)}
        </text>
        <rect
          x={barX}
          y={y + 10}
          width={barW(v)}
          height="12"
          rx="6"
          fill={color}
          opacity={strong ? 1 : 0.4}
        />
      </g>
    ) : (
      <g>
        <text x={pad} y={y + 4} className="m5g-m">
          {label}
        </text>
        <rect
          x={barX}
          y={y - 10}
          width={barW(v)}
          height="14"
          rx="7"
          fill={color}
          opacity={strong ? 1 : 0.4}
        />
        <text x={barX + barW(v) + 10} y={y + 4} className="m5g-t">
          {rateText(v)}
        </text>
      </g>
    );
  // until the backhaul is introduced the result is the radio share alone
  const backhaulShown = backhaul >= 0.5;
  const radioWins = !backhaulShown || nr.radio <= nr.transport;
  const result = backhaulShown ? nr.rate : nr.radio;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      role="img"
      aria-label={t('同一个 5G 载波的资源被多个用户分享')}
    >
      {grid(nr, top, gh, 360)}
      <text x={pad} y={top + gh + 28} className="m5g-t">
        {t('5G 100 MHz · {0} 人分享', users)}
      </text>
      <text
        x={narrow ? pad : w - pad}
        y={top + gh + (narrow ? 54 : 28)}
        className="m5g-y"
        textAnchor={narrow ? 'start' : 'end'}
      >
        {t(
          narrow ? '你的份额 {0}%' : '你的份额 {0}%（逐时隙轮换）',
          (nr.alloc.share[0] * 100).toFixed(0),
        )}
      </text>
      <text x={pad} y={top + gh + 26 * infoRows + 2} className="m5g-m">
        {nr.qm
          ? t(
              narrow ? 'SNR {0} dB → {1} · {2}/8' : '信噪比 {0} dB → {1}，每格装 {2}/8',
              snrDb.toFixed(0),
              MODULATION_NAME[nr.qm as Modulation],
              nr.qm,
            )
          : t('信噪比 {0} dB → 无法可靠解调', snrDb.toFixed(0))}
      </text>
      {lte > 0.01 && (
        <g opacity={lte}>
          {grid(lt, lteY, lteH, 180)}
          <text x={pad + 18 * mhzPx + 14} y={lteY + 22} className="m5g-l">
            {t(narrow ? '4G 估算' : '4G 20 MHz 估算，同样条件')}
          </text>
          <text x={pad + 18 * mhzPx + 14} y={lteY + 48} className="m5g-l">
            {rateText(lt.rate)}
          </text>
        </g>
      )}
      <g>
        {bar(barsY, t('无线份额'), nr.radio, YOU, radioWins)}
        <g opacity={backhaul}>
          {bar(barsY + rowGap, t('回传份额'), nr.transport, MUTED, !radioWins)}
        </g>
        {backhaulShown ? (
          narrow ? (
            <>
              <text x={pad} y={barsY + rowGap * 2 + 8} className="m5g-y">
                {t('较小的一段决定速度')}
              </text>
              <text x={pad} y={barsY + rowGap * 2 + 34} className="m5g-y">
                {t(radioWins ? '无线 {0}' : '回传 {0}', rateText(result))}
              </text>
            </>
          ) : (
            <text x={pad} y={barsY + rowGap * 2 + 8} className="m5g-y">
              {t(
                radioWins ? '较小的一段决定速度：无线 {0}' : '较小的一段决定速度：回传 {0}',
                rateText(result),
              )}
            </text>
          )
        ) : (
          <text x={pad} y={barsY + rowGap * 2 + 8} className="m5g-y">
            {t('你分到的无线速率：{0}', rateText(result))}
          </text>
        )}
      </g>
    </svg>
  );
}
