import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  tapeDots,
  tapeAverageBeat,
  tickerNeedleAt,
  tapeMotion,
  tapeInterval,
  tapeSegments,
  localTapeEstimate,
  uniformTape,
  tickerCartRig,
  tickerEvidenceShot,
  tickerNarratedProgress,
  predictTapePoint,
  type TapePath,
} from '../../models/ticker-tape-lab';
import '../../styles/ticker-tape-lab.css';

type Say = (zh: string, en: string) => string;
const INK = '#386958',
  GOLD = '#a36b35',
  BLUE = '#426e91';
const colors = [INK, BLUE, '#a36b35', '#8c6685', '#446f76'];
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => {
  const q = clamp(p);
  return q * q * (3 - 2 * q);
};

function Paper({
  x,
  y,
  width,
  height = 24,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={Math.max(0, width)}
        height={height}
        rx="3"
        fill="#f1e8d0"
        stroke="#d7c7a5"
        strokeWidth=".8"
      />
      <path d={`M ${x + 3} ${y + height - 3} H ${x + Math.max(3, width - 3)}`} stroke="#e2d3b4" />
    </g>
  );
}
function Bracket({
  x1,
  x2,
  y,
  label,
  labelX,
  color = GOLD,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  labelX?: number;
  color?: string;
}) {
  return (
    <g stroke={color} fill="none">
      <path d={`M ${x1} ${y - 5} V ${y} H ${x2} V ${y - 5}`} />
      <text x={labelX ?? (x1 + x2) / 2} y={y + 21} textAnchor="middle" stroke="none" fill={color}>
        {label}
      </text>
    </g>
  );
}
function Timer({
  x,
  y,
  id,
  instrument,
  time = 0,
}: {
  x: number;
  y: number;
  id: string;
  instrument: string;
  time?: number;
}) {
  const needle = tickerNeedleAt(time);
  return (
    <g>
      <rect
        x={x - 20}
        y={y - 46}
        width="42"
        height="37"
        rx="8"
        fill={`url(#${id}-metal)`}
        stroke="#81978c"
      />
      {instrument === 'spark' ? (
        <>
          <rect x={x - 13} y={y - 39} width="27" height="16" rx="3" fill="#b9c5b9" />
          <path
            d={`M ${x - 5} ${y - 30} V ${y - 2} M ${x + 6} ${y - 30} V ${y + 3}`}
            fill="none"
            stroke="#65786b"
            strokeWidth="2"
          />
          <path d={`M ${x - 4} ${y - 2} l 6 3 -6 3`} stroke="#bc8645" fill="none" />
        </>
      ) : (
        <>
          <rect x={x - 13} y={y - 36} width="27" height="15" rx="3" fill="#b98e61" />
          {[0, 1, 2, 3, 4].map((n) => (
            <path
              key={n}
              d={`M ${x - 10 + n * 5} ${y - 35} v 13`}
              stroke="#88694d"
              strokeWidth="1.5"
            />
          ))}
          <path d={`M ${x} ${y - 43} V ${y - needle.lift}`} stroke="#536b5f" strokeWidth="2" />
        </>
      )}
      <circle cx={x} cy={y} r="3.3" fill={GOLD} opacity={needle.contactOpacity} />
    </g>
  );
}

function Acquisition({
  mode,
  time,
  a,
  w,
  id,
  instrument,
  say,
  doubleMass = false,
}: {
  mode: TapePath;
  time: number;
  a: number;
  w: number;
  id: string;
  instrument: string;
  say: Say;
  doubleMass?: boolean;
}) {
  const motion = tapeMotion(mode, time, a),
    dots = tapeDots(mode, time, 50, a);
  if (mode === 'fall') {
    const scale = doubleMass ? 80 : 90,
      travel = motion.x * scale,
      centers = doubleMass ? [w * 0.28, w * 0.72] : [w * 0.52];
    return (
      <svg
        viewBox={`0 0 ${w} 222`}
        role="img"
        aria-label={say(
          '竖直纸带随重物下落，新点留在固定针尖处',
          'Vertical tape moves with the falling mass; new marks form at the fixed needle',
        )}
      >
        {centers.map((x, i) => (
          <g key={i}>
            <path
              d={`M ${x - 44} 207 V 17 H ${x + 23}`}
              fill="none"
              stroke="#a4b5a7"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Paper x={x - 7} y={9} width={14} height={86 + travel} />
            {dots.map((d) => (
              <circle
                key={d.index}
                data-dot-id={d.index}
                cx={x}
                cy={52 + (motion.x - d.x) * scale}
                r={d.index % 5 === 0 ? 2.2 : 1}
                fill={INK}
              />
            ))}
            <g transform={`translate(${x - 52} 0) rotate(-90 52 52)`}>
              <Timer x={52} y={52} id={id} instrument={instrument} time={time} />
            </g>
            <path d={`M ${x} ${95 + travel} v 7`} stroke="#698173" strokeWidth="2" />
            <rect
              x={x - 17}
              y={102 + travel}
              width="34"
              height={doubleMass ? (i === 1 ? 36 : 18) : 22}
              rx="5"
              fill={`url(#${id}-metal)`}
              stroke="#778d80"
            />
            <text x={x} y={doubleMass ? 27 : 197} textAnchor="middle">
              {doubleMass ? (i === 1 ? '2m' : 'm') : say('重物', 'Mass')}
            </text>
          </g>
        ))}
        {!doubleMass && (
          <text x="10" y="28">
            {time.toFixed(2)} s
          </text>
        )}
        {doubleMass && (
          <text x={w / 2} y="219" textAnchor="middle">
            {(motion.x * 100).toFixed(1)} cm · {say('理想无阻力', 'Ideal, no drag')}
          </text>
        )}
        {!doubleMass && (
          <>
            <path
              d={`M ${w - 30} 76 v 42 l -4 -7 m 4 7 4 -7`}
              fill="none"
              stroke={GOLD}
              strokeWidth="2"
            />
            <text x={12} y={230}>
              {say('固定节拍', 'Fixed ticks')} · 0.02 s
            </text>
          </>
        )}
      </svg>
    );
  }
  const cart = mode === 'cart';
  const rig = tickerCartRig(w, cart ? motion.x : 0),
    scale = cart ? rig.scale : (w - 145) / (mode === 'timer' ? 0.03 : 0.32);
  const travel = motion.x * scale,
    needleX = 28,
    end = cart ? rig.paperEnd : 87 + travel;
  const y = cart ? 91 : 116;
  return (
    <svg
      viewBox={`0 0 ${w} ${cart ? (w < 500 ? 222 : 250) : 205}`}
      role="img"
      aria-label={say(
        '固定计时器记录移动纸带，同一条纸带连接运动物体',
        'A stationary timer marks one tape connected to the moving object',
      )}
    >
      <text x="10" y="22">
        {time.toFixed(2)} s · {dots.length} {say('点', 'dots')}
      </text>
      <Paper x={needleX - 10} y={y - 6} width={end - needleX + 10} height={12} />
      {dots.map((d) => (
        <circle
          key={d.index}
          data-dot-id={d.index}
          cx={needleX + (motion.x - d.x) * scale}
          cy={y}
          r={d.index % 5 === 0 ? 2.3 : 1.2}
          fill={INK}
        />
      ))}
      <Timer x={needleX} y={y} id={id} instrument={instrument} time={time} />
      {cart ? (
        <>
          <path d={`M 14 118 H ${w - 24}`} stroke="#a2b09e" strokeWidth="4" strokeLinecap="round" />
          <g transform={`translate(${rig.cartX} 0)`}>
            <rect
              x="-25"
              y="79"
              width="50"
              height="23"
              rx="6"
              fill={`url(#${id}-cart)`}
              stroke="#759080"
            />
            <circle cx="-15" cy="110" r="8" fill="#557163" />
            <circle cx="15" cy="110" r="8" fill="#557163" />
            <circle cx="-15" cy="110" r="3" fill="#c9d5c5" />
            <circle cx="15" cy="110" r="3" fill="#c9d5c5" />
            <circle cx="25" cy={rig.hook.y} r="2" fill={GOLD} />
          </g>
          <path d={`M ${rig.pulley.x} 118 V ${rig.pulley.y}`} stroke="#8ca38f" strokeWidth="3" />
          <circle
            cx={rig.pulley.x}
            cy={rig.pulley.y}
            r={rig.pulley.r}
            fill="#dde3d4"
            stroke="#829884"
            strokeWidth="2"
          />
          <circle cx={rig.pulley.x} cy={rig.pulley.y} r="3" fill="#92a48e" />
          <path d={rig.rope} fill="none" stroke="#8e7658" strokeWidth="1.6" />
          <rect
            x={rig.hanger.x - 8}
            y={rig.hanger.y}
            width="16"
            height="24"
            rx="3"
            fill={`url(#${id}-metal)`}
            stroke="#738b79"
          />
          <text x="12" y="196">
            {say('相邻点', 'Neighboring dots')} · 0.02 s
          </text>
          <text x="12" y="219">
            {say('每 5 个间隔取一段', 'Group every 5 gaps')} · 0.10 s
          </text>
        </>
      ) : (
        <>
          <path
            d={`M ${end + 25} ${y + 33} C ${end + 9} ${y + 25}, ${end + 3} ${y + 9}, ${end - 1} ${y + 5} C ${end - 8} ${y - 2}, ${end - 4} ${y - 12}, ${end + 2} ${y - 10} L ${end + 10} ${y} L ${end + 6} ${y - 28} Q ${end + 6} ${y - 37} ${end + 12} ${y - 31} L ${end + 19} ${y - 8} L ${end + 24} ${y - 23} Q ${end + 28} ${y - 29} ${end + 31} ${y - 20} L ${end + 36} ${y + 8} L ${end + 41} ${y + 24}`}
            fill="#e3c7a6"
            stroke="#ac8d6f"
            strokeWidth="1.5"
          />
          <path
            d={`M ${Math.min(w - 65, end + 5)} 164 h 40 l -7 -4 m 7 4 -7 4`}
            fill="none"
            stroke={GOLD}
            strokeWidth="2"
          />
          <text x="10" y="201">
            50 Hz · {say('针尖固定，纸带移动', 'Fixed needle, moving tape')}
          </text>
        </>
      )}
    </svg>
  );
}

function SteadyRecords({
  w,
  say,
  countOnly = false,
}: {
  w: number;
  say: Say;
  countOnly?: boolean;
}) {
  const scale = (w - 50) / 0.065;
  return (
    <svg
      viewBox={`0 0 ${w} ${countOnly ? 205 : 214}`}
      role="img"
      aria-label={say(
        '等时间点距比较：更快但仍然匀速',
        'Equal-time marks: faster motion can still be uniform',
      )}
    >
      {(countOnly ? [0.3] : [0.3, 0.6]).map((v, row) => {
        const y = countOnly ? 69 : 48 + row * 102,
          dots = uniformTape(v, 0.1);
        return (
          <g key={v}>
            <text x="14" y={y - 12}>
              {v.toFixed(1)} m/s {countOnly ? '' : say('匀速', 'constant')}
            </text>
            <Paper x={12} y={y} width={w - 24} height={28} />
            {dots.map((d) => (
              <g key={d.index}>
                <circle
                  data-dot-id={d.index}
                  cx={24 + d.x * scale}
                  cy={y + 14}
                  r="3.5"
                  fill={row ? BLUE : INK}
                />
                {countOnly && (
                  <text x={24 + d.x * scale} y={y + 52} textAnchor="middle">
                    {d.index}
                  </text>
                )}
              </g>
            ))}
            {!countOnly && (
              <Bracket
                x1={24}
                x2={24 + dots[5].x * scale}
                y={y + 35}
                label="5 × 0.02 s = 0.10 s"
                labelX={w / 2}
                color={row ? BLUE : INK}
              />
            )}
            {countOnly && (
              <Bracket
                x1={24}
                x2={24 + dots[5].x * scale}
                y={y + 67}
                label="5 × 0.02 s = 0.10 s"
                labelX={w / 2}
              />
            )}
          </g>
        );
      })}
      {countOnly && (
        <text x={w / 2} y="194" textAnchor="middle">
          {say('6 个点 · 5 个间隔', '6 dots · 5 intervals')}
        </text>
      )}
    </svg>
  );
}

function SpeedReading({
  w,
  say,
  local,
  progress,
  halfTicks,
  later,
}: {
  w: number;
  say: Say;
  local: boolean;
  progress: number;
  halfTicks: number;
  later: boolean;
}) {
  const beat = tapeAverageBeat(local ? 1 : progress);
  const estimate = localTapeEstimate(halfTicks),
    measure = local ? estimate : tapeInterval('velocity', later ? 0.6 : 0.2, later ? 0.8 : 0.4);
  const total = tapeMotion('velocity', 1).x,
    scale = (w - 36) / total,
    x = (d: number) => 18 + d * scale;
  const dots = tapeDots('velocity', 1),
    left = x(measure.start.x),
    right = x(measure.end.x);
  const center = x(tapeMotion('velocity', 0.5).x);
  return (
    <svg
      viewBox={`0 0 ${w} 222`}
      role="img"
      aria-label={say(
        '同一纸带上用实际采样端点测位移和时间',
        'Displacement and time are read between sampled endpoints on one tape',
      )}
    >
      <text x="12" y="22">
        {local ? 't = 0.50 s' : say('同一条纸带', 'One recorded tape')}
      </text>
      <Paper x={8} y={46} width={w - 16} height={29} />
      <rect x={left} y="46" width={right - left} height="29" rx="2" fill="#d7b678" opacity=".38" />
      {dots.map((d) => (
        <circle
          key={d.index}
          data-dot-id={d.index}
          cx={x(d.x)}
          cy="60"
          r={d.index % 5 === 0 ? 2.8 : 1.1}
          fill={INK}
        />
      ))}
      <path d={`M ${left} 40 V 86 M ${right} 40 V 86`} stroke={GOLD} strokeWidth="1.8" />
      {local && (
        <>
          <path d={`M ${center} 29 V 78`} stroke={BLUE} strokeWidth="2" />
          <circle cx={center} cy="60" r="4" fill={BLUE} />
        </>
      )}
      <g opacity={beat.distanceVisible ? 1 : 0}>
        <Bracket x1={left} x2={right} y={88} label={`${(measure.dx * 100).toFixed(2)} cm`} />
      </g>
      {!local && beat.timeVisible && !beat.averageVisible && (
        <circle
          cx={x(tapeMotion('velocity', measure.start.t + beat.countedGaps / 50).x)}
          cy="60"
          r="4"
          fill={GOLD}
        />
      )}
      <text x="12" y="132" opacity={beat.timeVisible ? 1 : 0}>
        {!local && beat.countedGaps < 10 ? (
          <>
            {beat.countedGaps} / 10 {say('个间隔', 'gaps')}
          </>
        ) : (
          <>
            Δt = {Math.round(measure.dt * 50)} × 0.02 = {measure.dt.toFixed(2)} s
          </>
        )}
      </text>
      <text x="12" y="163" fill={GOLD} opacity={beat.averageVisible ? 1 : 0}>
        v̄ = Δx / Δt = {measure.average.toFixed(local ? 6 : 3)} m/s
      </text>
      {local ? (
        <>
          <text x="12" y="194" fill={BLUE}>
            v(0.50 s) = 0.300000 m/s
          </text>
          <text x="12" y="219">
            {say('蓝色值：模型瞬时速度', 'Blue: model instant velocity')}
          </text>
        </>
      ) : (
        <text x="12" y="210">
          {measure.start.t.toFixed(2)} → {measure.end.t.toFixed(2)} s ·{' '}
          {say('这一段的平均值', 'interval average')}
        </text>
      )}
    </svg>
  );
}

function IntervalEvidence({
  mode,
  w,
  a,
  p,
  say,
  graph = false,
  predict = false,
  reveal = false,
  predictionKnown = false,
}: {
  mode: 'cart' | 'fall';
  w: number;
  a: number;
  p: number;
  say: Say;
  graph?: boolean;
  predict?: boolean;
  reveal?: boolean;
  predictionKnown?: boolean;
}) {
  const known = mode === 'cart' ? 4 : 3,
    segments = tapeSegments(mode, known + 1, a);
  const last = segments[known - 1],
    previous = segments[known - 2];
  const prediction = predictTapePoint([previous.from, previous.to, last.to]);
  const align = predict || graph ? 1 : smooth((p - 0.24) / 0.16),
    speed = mode === 'cart' && !predict && p >= 0.46;
  const physicalMax = mode === 'cart' ? 0.24 : 0.9,
    segmentMax = mode === 'cart' ? 0.08 : 0.46;
  const tapeScale = (w - 38) / physicalMax,
    barScale = (w - 136) / segmentMax;
  const count = predict ? known + 1 : known;
  const increment = (last.dx - previous.dx) * 100;
  if (graph) {
    const xmax = 0.5,
      ymax = 0.8,
      x = (t: number) => 39 + (t / xmax) * (w - 56),
      y = (v: number) => 174 - (v / ymax) * 126;
    return (
      <svg
        viewBox={`0 0 ${w} 222`}
        role="img"
        aria-label={say(
          '等时位移得到的速度标在区间中点，等速度增量形成直线',
          'Velocities from equal-time displacements lie at interval midpoints and have equal increments',
        )}
      >
        <text x="12" y="21">
          v / (m/s)
        </text>
        <path d={`M 39 35 V 174 H ${w - 8}`} stroke="#b0c1af" fill="none" />
        {[0, 0.2, 0.4, 0.6].map((v) => (
          <g key={v}>
            <path d={`M 39 ${y(v)} H ${w - 9}`} stroke="#dfe6d9" />
            <text x="31" y={y(v) + 5} textAnchor="end">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <path
          d={segments
            .slice(0, known)
            .map((s, i) => `${i ? 'L' : 'M'} ${x(s.midpoint)} ${y(s.average)}`)
            .join(' ')}
          fill="none"
          stroke={INK}
          strokeWidth="2"
        />
        {segments.slice(0, known).map((s, i) => (
          <g key={s.index}>
            <circle
              data-segment-id={s.index}
              cx={x(s.midpoint)}
              cy={y(s.average)}
              r="5"
              fill={colors[i]}
            />
            <text x={x(s.midpoint)} y="195" textAnchor="middle">
              {s.midpoint.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={w - 8} y="219" textAnchor="end">
          t / s
        </text>
        <text x="12" y="219" fill={GOLD}>
          a = {prediction.acceleration.toFixed(2)} m/s²
        </text>
      </svg>
    );
  }
  const rowY = (i: number) => (predict ? 45 + i * 28 : 55 + i * 34);
  return (
    <svg
      viewBox={`0 0 ${w} 222`}
      role="img"
      aria-label={
        predict
          ? say(
              '只用已见的点距推算下一段，随后核对新点',
              'Predict the next gap from the known gaps, then reveal the new mark',
            )
          : say(
              '同一纸带的等时段移到共同起点，长度成为速度证据',
              'Equal-time sections of the same tape align at a common origin; length gives velocity',
            )
      }
    >
      <text x="12" y="21">
        {predict
          ? say('下一段还会加多少？', 'How much longer next?')
          : speed
            ? 'v̄ = Δx / 0.10 s'
            : 'T = 0.10 s = 5 × 0.02 s'}
      </text>
      {Array.from({ length: count }, (_, i) => {
        const s = segments[i],
          future = i === known,
          displayDx = future ? prediction.nextGap : s.dx;
        const sx = 18 + s.from.x * tapeScale,
          ex = 18 + s.to.x * tapeScale;
        const bx = mix(sx, 60, align),
          by = mix(57, rowY(i), align),
          bw = mix(ex - sx, displayDx * barScale, align);
        return (
          <g key={s.index} data-segment-id={s.index}>
            <g opacity={future && !reveal ? 0.6 : 1}>
              <rect
                x={bx}
                y={by}
                width={bw}
                height="17"
                rx="2"
                fill={future && !reveal ? 'none' : '#eee2c5'}
                stroke={colors[i]}
                strokeDasharray={future && !reveal ? '4 3' : undefined}
              />
              {Array.from({ length: 6 }, (_, j) => {
                const sample = tapeMotion(mode, s.from.t + j * 0.02, a),
                  fraction = (sample.x - s.from.x) / s.dx;
                if (future && !reveal) return null;
                return (
                  <circle
                    key={j}
                    data-dot-id={s.from.index + j}
                    cx={bx + fraction * bw}
                    cy={by + 8.5}
                    r={j === 0 || j === 5 ? 2.5 : 1.1}
                    fill={colors[i]}
                  />
                );
              })}
            </g>
            {align > 0.5 && (
              <g opacity={clamp((align - 0.5) * 2)}>
                <text x="7" y={by + 14} fill={colors[i]}>
                  {s.from.index}–{s.to.index}
                </text>
                <text x={w - 5} y={by + 14} textAnchor="end" fill={colors[i]}>
                  {future && !reveal && !predictionKnown
                    ? '?'
                    : speed
                      ? s.average.toFixed(2)
                      : (displayDx * 100).toFixed(1)}
                  {future && !reveal && !predictionKnown ? '' : speed ? ' m/s' : ' cm'}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {align < 0.4 && (
        <text x="12" y="117" fill={INK}>
          {say('原来的点：0、5、10…', 'Same marks: 0, 5, 10…')}
        </text>
      )}
      {align > 0.95 && (
        <>
          <text x="12" y={197} fill={GOLD}>
            {predict
              ? `${(previous.dx * 100).toFixed(1)} → ${(last.dx * 100).toFixed(1)} → ${reveal || predictionKnown ? (prediction.nextGap * 100).toFixed(1) : '?'} cm`
              : speed
                ? `Δv = ${(last.average - previous.average).toFixed(2)} m/s`
                : `Δx${say(' 每段增加', ' increases by')} ${increment.toFixed(1)} cm`}
          </text>
          <text x="12" y="220">
            {predict
              ? reveal
                ? say('预测与模型新点吻合', 'Prediction matches the model mark')
                : say('假设下一段仍匀加速', 'Assume constant acceleration')
              : speed
                ? `a = Δv / T = ${prediction.acceleration.toFixed(2)} m/s²`
                : `a = Δ(Δx) / T² = ${prediction.acceleration.toFixed(2)} m/s²`}
          </text>
        </>
      )}
    </svg>
  );
}

export default function TickerTapeLab() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId().replaceAll(':', '');
  const say: Say = (zh, en) => (browserLocale() === 'en' ? en : zh);
  const [path, setPath] = useState<TapePath>(() =>
    film.variant?.includes('free-fall-tape')
      ? 'fall'
      : film.variant?.includes('cart-velocity')
        ? 'cart'
        : film.variant?.includes('tape-speed')
          ? 'velocity'
          : 'timer',
  );
  const [view, setView] = useState('acquire'),
    [time, setTime] = useState(0.4),
    [a, setA] = useState(0.6),
    [halfTicks, setHalfTicks] = useState(10),
    [later, setLater] = useState(false),
    [revealed, setRevealed] = useState(false),
    [instrument, setInstrument] = useState('magnetic');
  const shot = tickerEvidenceShot(
      film.chapter,
      tickerNarratedProgress(film.chapter, film.chapterTime, browserLocale()),
    ),
    mode = film.watch
      ? film.chapter === 0
        ? 'timer'
        : film.chapter < 3
          ? 'velocity'
          : film.chapter === 3
            ? 'cart'
            : 'fall'
      : path;
  const active = film.watch ? shot.view : view,
    acceleration = film.watch ? 0.6 : a;
  const now = film.watch
    ? shot.time
    : Math.min(time, mode === 'fall' ? 0.4 : mode === 'cart' ? 0.5 : mode === 'timer' ? 0.1 : 1);
  const ticks = film.watch
    ? Math.max(1, 20 - Math.floor(clamp((shot.p - 0.22) / 0.57) * 19))
    : halfTicks;
  const readingLater = film.watch ? shot.reveal : later,
    predictionRevealed = film.watch ? shot.reveal : revealed;
  const stage =
    active === 'acquire'
      ? say('运动留下记录', 'Motion leaves a record')
      : active === 'steady' || active === 'count'
        ? say('时间相同，看点距', 'Same time, different gaps')
        : active === 'local'
          ? say('盯住同一个时刻', 'Keep the target time fixed')
          : active === 'graph'
            ? say('速度增量 / 时间', 'Velocity change / time')
            : active === 'masses'
              ? say('质量改变，再预测', 'Change mass, predict again')
              : active === 'predict'
                ? say('先预测，再看新点', 'Predict, then reveal')
                : active === 'segments'
                  ? say('同一纸带：早 → 晚', 'Same tape: early → late')
                  : say('让纸带回答问题', 'Read the evidence in the tape');
  const viewOptions =
    mode === 'timer'
      ? [
          ['acquire', '记录过程', 'Recording'],
          ['steady', '快慢对比', 'Compare speeds'],
          ['count', '数时间间隔', 'Count intervals'],
        ]
      : mode === 'velocity'
        ? [
            ['acquire', '记录过程', 'Recording'],
            ['average', '平均速度', 'Average velocity'],
            ['local', '局部测速', 'Local velocity'],
          ]
        : [
            ['acquire', '记录过程', 'Recording'],
            ['segments', '等时段', 'Equal-time strips'],
            ...(mode === 'cart' ? [['graph', '速度图', 'Velocity plot']] : []),
            ['predict', '下一段', 'Next strip'],
            ...(mode === 'fall' ? [['masses', '换质量', 'Change mass']] : []),
          ];
  return (
    <section className="ticker-tape-scene" data-view={active} data-path={mode}>
      <div className="ticker-tape-eyebrow">
        <span>{stage}</span>
        <span>50 Hz</span>
      </div>
      <div className="ticker-tape-figure" ref={host}>
        <svg className="ticker-tape-defs" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-metal`}>
              <stop stopColor="#799183" />
              <stop offset=".45" stopColor="#d4dfd0" />
              <stop offset="1" stopColor="#9aac96" />
            </linearGradient>
            <linearGradient id={`${id}-cart`} x2="0" y2="1">
              <stop stopColor="#b6c3a7" />
              <stop offset="1" stopColor="#819e88" />
            </linearGradient>
          </defs>
        </svg>
        {active === 'acquire' && (
          <Acquisition
            mode={mode}
            time={now}
            a={acceleration}
            w={w}
            id={id}
            instrument={instrument}
            say={say}
          />
        )}
        {(active === 'steady' || active === 'count') && (
          <SteadyRecords w={w} say={say} countOnly={active === 'count'} />
        )}
        {(active === 'average' || active === 'local') && (
          <SpeedReading
            w={w}
            say={say}
            local={active === 'local'}
            progress={film.watch ? shot.p : 1}
            halfTicks={ticks}
            later={readingLater}
          />
        )}
        {(active === 'segments' || active === 'graph' || active === 'predict') &&
          (mode === 'cart' || mode === 'fall') && (
            <IntervalEvidence
              mode={mode}
              w={w}
              a={acceleration}
              p={film.watch ? shot.p : 0.58}
              say={say}
              graph={active === 'graph'}
              predict={active === 'predict'}
              reveal={predictionRevealed}
              predictionKnown={film.watch ? shot.predictionKnown : revealed}
            />
          )}
        {active === 'masses' && (
          <Acquisition
            mode="fall"
            time={0.4}
            a={acceleration}
            w={w}
            id={id}
            instrument={instrument}
            say={say}
            doubleMass
          />
        )}
      </div>
      {!film.watch && (
        <div className="ticker-tape-controls">
          <Segments
            label={say('运动记录', 'Motion record')}
            value={path}
            onChange={(v) => {
              setPath(v);
              setView('acquire');
              setRevealed(false);
            }}
            options={[
              { value: 'timer', label: say('固定节拍', 'Fixed ticks') },
              { value: 'velocity', label: say('测量速度', 'Measure velocity') },
              { value: 'cart', label: say('小车加速', 'Accelerating cart') },
              { value: 'fall', label: say('自由落体', 'Free fall') },
            ]}
          />
          <Segments
            label={say('观察视图', 'Evidence view')}
            value={active}
            onChange={(v) => {
              setView(v);
              setRevealed(false);
            }}
            options={viewOptions.map(([value, zh, en]) => ({ value, label: say(zh, en) }))}
          />
          {active === 'acquire' && (
            <Range
              label={say('记录时刻', 'Recording time')}
              value={now}
              min={0}
              max={mode === 'fall' ? 0.4 : mode === 'cart' ? 0.5 : mode === 'timer' ? 0.1 : 1}
              step={0.02}
              unit="s"
              onChange={setTime}
            />
          )}
          {active === 'average' && (
            <Segments
              label={say('同样长的时间', 'Same time interval')}
              value={later ? 'later' : 'earlier'}
              onChange={(v) => setLater(v === 'later')}
              options={[
                { value: 'earlier', label: '0.20–0.40 s' },
                { value: 'later', label: '0.60–0.80 s' },
              ]}
            />
          )}
          {active === 'local' && (
            <Range
              label={say('目标时刻两侧的间隔数', 'Ticks on each side of the target')}
              value={halfTicks}
              min={1}
              max={20}
              step={1}
              onChange={setHalfTicks}
            />
          )}
          {mode === 'cart' && (
            <Range
              label={say('模型加速度', 'Model acceleration')}
              value={a}
              min={0.2}
              max={1.2}
              step={0.1}
              unit="m/s²"
              onChange={(v) => {
                setA(v);
                setRevealed(false);
              }}
            />
          )}
          {active === 'predict' && (
            <button className="ticker-tape-reveal" onClick={() => setRevealed(!revealed)}>
              {revealed
                ? say('再预测一次', 'Predict again')
                : say('显示下一段', 'Reveal the next strip')}
            </button>
          )}
          {active === 'acquire' && mode === 'timer' && (
            <Segments
              label={say('记录方式', 'Marking mechanism')}
              value={instrument}
              onChange={setInstrument}
              options={[
                { value: 'magnetic', label: say('电磁打点', 'Electromagnetic') },
                { value: 'spark', label: say('电火花打点', 'Spark timer') },
              ]}
            />
          )}
          <details>
            <summary>
              {say('模型条件与真实实验', 'Model conditions and the real experiment')}
            </summary>
            <p>
              {say(
                '所有点来自同一个理想运动模型，不是独立实测数据。图中慢放，读数使用真实秒。小车给定加速度，不把槽码重力当作绳张力；自由落体忽略空气和纸带阻力。',
                'Every dot comes from one ideal motion model, not an independent measurement. Playback is slowed; readings use physical seconds. Cart acceleration is prescribed: hanger weight is not identified with string tension. Free fall neglects air and tape resistance.',
              )}
            </p>
            <p>
              {say(
                '真实测量需检查打点频率、舍去模糊点迹并重复记录。缩短区间会放大读尺误差；两侧最近的已记录点相隔 0.04 s，不能把屏幕插值当成更密的采样。',
                'Check the real marking frequency, discard unclear marks and repeat recordings. Shorter intervals magnify ruler error. The nearest recorded dots on either side span 0.04 s; screen interpolation does not create finer measurements.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
