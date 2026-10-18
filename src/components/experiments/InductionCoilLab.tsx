import { useEffect, useId, useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  coilInduction,
  magnetMotion,
  fallingMagnet,
  fallTrace,
  discGenerator,
  discRadial,
  ringResponse,
  ringGeometry,
  coilPoint,
  inductionDirector,
  initialInduction,
  TEXTBOOK_DIRECTIONS,
  RING,
  type InductionExperiment,
  type InductionView,
} from '../../models/induction-coil-lab';
import '../../styles/induction-coil-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#395851',
  green = '#467f72',
  copper = '#ad7d46',
  pale = '#e9eee3',
  red = '#ac6754';
type Shot = ReturnType<typeof inductionDirector>;
const labels = () => ({
  coil: tr('磁体与线圈', 'Magnet and coil'),
  ring: tr('闭合与断开铝环', 'Closed and split rings'),
  fall: tr('落磁电压测量', 'Falling-magnet voltage'),
  disc: tr('圆盘发电机', 'Disc generator'),
});
const viewLabel = (v: InductionView) =>
  ({
    apparatus: tr('装置与读数', 'Apparatus'),
    flux: tr('磁通与变化', 'Flux and change'),
    directions: tr('四种方向记录', 'Four direction records'),
    response: tr('电流与受力', 'Current and force'),
    trace: tr('同轴电压曲线', 'Voltage traces'),
    radial: tr('半径处的运动', 'Motion at each radius'),
    power: tr('功率去向', 'Power transfer'),
  })[v];
const views = (e: InductionExperiment): InductionView[] =>
  e === 'coil'
    ? ['apparatus', 'flux', 'directions']
    : e === 'ring'
      ? ['apparatus', 'response']
      : e === 'fall'
        ? ['apparatus', 'trace']
        : ['apparatus', 'radial', 'power'];
const path = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
const mv = (v: number) =>
  v !== 0 && Math.abs(v) < 1e-5 ? `${(v * 1e6).toFixed(2)} µV` : `${(v * 1000).toFixed(2)} mV`;
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = green,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}) {
  const a = Math.atan2(y2 - y1, x2 - x1),
    s = 6;
  return (
    <g stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round">
      <path d={`M${x1} ${y1}L${x2} ${y2}`} />
      <path
        d={`M${x2 - s * Math.cos(a - 0.5)} ${y2 - s * Math.sin(a - 0.5)}L${x2} ${y2}L${x2 - s * Math.cos(a + 0.5)} ${y2 - s * Math.sin(a + 0.5)}`}
      />
    </g>
  );
}
function Route({
  d,
  current = 0,
  time = 0,
  kind,
}: {
  d: string;
  current?: number;
  time?: number;
  kind: string;
}) {
  return (
    <g data-induction-route={kind} data-current={current}>
      <path d={d} fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round" />
      {Math.abs(current) > 1e-12 && (
        <path
          d={d}
          fill="none"
          stroke={copper}
          strokeWidth="3.6"
          strokeDasharray="2 13"
          strokeDashoffset={-time * 25 * Math.sign(current)}
        />
      )}
    </g>
  );
}
function Magnet({
  x,
  y,
  pole,
  horizontal = false,
}: {
  x: number;
  y: number;
  pole: number;
  horizontal?: boolean;
}) {
  return (
    <g
      data-induction-magnet="true"
      transform={`translate(${x} ${y})${horizontal ? ' rotate(-90)' : ''}`}
    >
      <rect x="-10" y="-20" width="20" height="40" rx="4" fill="#94b7a8" stroke="#6c9884" />
      <path d="M-10 0H10V16Q10 20 6 20H-6Q-10 20-10 16Z" fill="#c6a373" />
      <text x="0" y="-5" textAnchor="middle">
        {pole > 0 ? 'S' : 'N'}
      </text>
      <text x="0" y="16" textAnchor="middle">
        {pole > 0 ? 'N' : 'S'}
      </text>
    </g>
  );
}
function Winding({
  cx,
  cy,
  front,
  id,
  current,
  time,
}: {
  cx: number;
  cy: number;
  front: boolean;
  id: string;
  current: number;
  time: number;
}) {
  return (
    <g data-induction-winding={front ? 'front' : 'back'}>
      {Array.from({ length: 7 }, (_, j) => {
        const a = (j + (front ? 0.5 : 0)) / 7,
          b = (j + (front ? 1 : 0.5)) / 7,
          d = path(
            Array.from({ length: 33 }, (_, i) =>
              coilPoint(a + ((b - a) * i) / 32, cx, cy, 40, 10, 32),
            ),
          );
        return (
          <g key={j}>
            <path d={d} fill="none" stroke={`url(#${id}-copper)`} strokeWidth="3" />
            {Math.abs(current) > 1e-12 && (
              <path
                d={d}
                fill="none"
                stroke={green}
                strokeWidth="2"
                strokeDasharray="2 13"
                strokeDashoffset={-time * 25 * Math.sign(current)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
function Loop({
  x,
  y,
  rx = 25,
  ry = 42,
  closed,
  current,
  time,
}: {
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  closed: boolean;
  current: number;
  time: number;
}) {
  const start = closed ? 0 : 0.24,
    end = closed ? Math.PI * 2 : Math.PI * 2 - 0.24,
    d = path(
      Array.from({ length: 129 }, (_, i) => {
        const a = start + ((end - start) * i) / 128;
        return { x: x + rx * Math.cos(a), y: y - ry * Math.sin(a) };
      }),
    );
  return (
    <g data-induction-loop={closed ? 'closed' : 'split'}>
      <path d={d} fill="none" stroke="#a4afa5" strokeWidth="7" strokeLinecap="round" />
      {Math.abs(current) > 1e-12 && (
        <path
          d={d}
          fill="none"
          stroke={green}
          strokeWidth="3"
          strokeDasharray="2 13"
          strokeDashoffset={-time * 25 * Math.sign(current)}
        />
      )}
    </g>
  );
}
export function InductionArtwork({
  shot = inductionDirector(1, 0.35, 9),
  width = 640,
  id: externalId,
  cover = false,
}: {
  shot?: Shot;
  width?: number;
  id?: string;
  cover?: boolean;
}) {
  const uid = useId().replace(/:/g, ''),
    id = externalId ?? `icl-${uid}`,
    w = Math.max(260, width),
    h = w < 440 ? 232 : 264,
    cy = h - (shot.experiment === 'fall' ? 103 : 87),
    cx = w < 440 ? 88 : w * 0.32,
    meter = w - 47;
  const motion = magnetMotion(shot.time),
    s =
      shot.experiment === 'fall'
        ? fallingMagnet(shot.time, shot.height, shot.turns)
        : shot.experiment === 'ring'
          ? ringResponse(shot.time, shot.closed, shot.polarity)
          : coilInduction({
              z: motion.z,
              velocity: motion.velocity,
              moment: -0.03 * shot.polarity,
            }),
    disc = discGenerator(shot.omega, 0.3, 0.08, 5, shot.closed),
    v = shot.view;
  const read = (left: string, right: string) => (
    <g>
      <text x="12" y={h - 13}>
        {left}
      </text>
      <text x={w - 12} y={h - 13} textAnchor="end">
        {right}
      </text>
    </g>
  );
  const coilScene = () => {
    const fall = shot.experiment === 'fall',
      scale = fall ? 320 : 800,
      my = cy - s.z * scale,
      top = cy - 16,
      bottom = cy + 16,
      mt = cy - 2;
    const needle = fall ? s.emf * 65 : (s.current / 5e-6) * 0.8,
      a = Math.max(-0.9, Math.min(0.9, needle));
    return (
      <>
        {fall && (
          <rect
            x={cx - 18}
            y="17"
            width="36"
            height={h - 47}
            rx="10"
            fill="#f4f5ed"
            stroke="#b8c9c4"
          />
        )}
        <path
          d={
            fall
              ? `M${cx - 47} ${cy + 47}H${cx - 25}M${cx + 25} ${cy + 47}H${cx + 47}M${cx - 35} ${cy + 47}V${bottom}M${cx + 35} ${cy + 47}V${bottom}`
              : `M${cx - 47} ${cy + 47}H${cx + 47}M${cx - 35} ${cy + 47}V${bottom}M${cx + 35} ${cy + 47}V${bottom}`
          }
          stroke="#a3b6a5"
          strokeWidth="4"
          fill="none"
        />
        <Winding cx={cx} cy={top} front={false} id={id} current={s.current} time={shot.time} />
        <Magnet x={cx} y={my} pole={shot.polarity} />
        {fall && (
          <rect
            data-induction-part="lower-catch"
            x={cx - 18}
            y={cy + 0.12 * scale + 20}
            width="36"
            height="5"
            rx="2"
            fill="#aab7a7"
          />
        )}
        <Winding cx={cx} cy={top} front id={id} current={s.current} time={shot.time} />
        <Route
          kind="coil-upper"
          d={`M${cx + 40} ${top}H${meter}V${mt - 27}`}
          current={-s.current}
          time={shot.time}
        />
        <Route
          kind="coil-lower"
          d={`M${cx + 40} ${bottom}H${meter - 36}V${mt + 43}H${meter}V${mt + 27}`}
          current={s.current}
          time={shot.time}
        />
        <circle
          data-induction-part="meter"
          cx={meter}
          cy={mt}
          r="27"
          fill="#f6f4e9"
          stroke="#9ead9e"
          strokeWidth="2"
        />
        <path
          d={`M${meter - 19} ${mt + 6}Q${meter} ${mt - 27} ${meter + 19} ${mt + 6}`}
          stroke="#b7c5b5"
          fill="none"
        />
        {shot.predict && !cover ? (
          <text data-induction-prediction="true" x={meter} y={mt + 8} textAnchor="middle">
            ?
          </text>
        ) : (
          <>
            {' '}
            <path
              data-induction-part="needle"
              d={`M${meter} ${mt + 10}L${meter + Math.sin(a) * 23} ${mt + 10 - Math.cos(a) * 23}`}
              stroke={copper}
              strokeWidth="2.5"
            />
          </>
        )}
        <circle cx={meter} cy={mt + 10} r="2.5" fill={ink} />
        <text x={meter} y={mt - 37} textAnchor="middle">
          {fall ? 'V' : 'G ±5µA'}
        </text>
        {Math.abs(s.velocity) > 1e-10 && (
          <Arrow
            x1={cx - 30}
            y1={my - 8 * Math.sign(s.velocity)}
            x2={cx - 30}
            y2={my + 12 * -Math.sign(s.velocity)}
          />
        )}
        <text x="12" y="20">
          {fall ? `N = ${shot.turns}` : tr('同一线圈', 'Same coil')}
        </text>
        <text x={w - 12} y="20" textAnchor="end">
          {fall
            ? `h = ${shot.height.toFixed(2)} m`
            : Math.abs(s.velocity) < 1e-8
              ? tr('磁体静止', 'Magnet still')
              : s.velocity < 0
                ? tr('靠近线圈', 'Approaching')
                : tr('远离线圈', 'Withdrawing')}
        </text>
        {read(
          `ε = ${shot.predict ? '?' : mv(s.emf)}`,
          fall
            ? `t = ${shot.time.toFixed(2)} s`
            : `I = ${shot.predict ? '?' : (s.current * 1e6).toFixed(1)} µA`,
        )}
      </>
    );
  };
  const fluxScene = () => {
    const x = w < 440 ? 63 : 140,
      y = 110,
      plotX = w < 440 ? 132 : w * 0.48,
      pw = w - plotX - 18,
      ph = 76,
      fluxMax = Math.abs(coilInduction({ z: 0.025, moment: -0.03 }).flux),
      fy = (f: number) => 120 - (f / fluxMax) * ph * 0.65;
    const pts = Array.from({ length: 161 }, (_, i) => {
      const m = magnetMotion(i / 20);
      return {
        x: plotX + (pw * i) / 160,
        y: fy(
          coilInduction({ z: shot.chapter === 0 ? 0.08 : m.z, moment: -0.03 * shot.polarity }).flux,
        ),
      };
    });
    return (
      <>
        <text x={w / 2} y="22" textAnchor="middle">
          ε = −N ΔΦ/Δt
        </text>
        <ellipse cx={x} cy={y} rx="39" ry="14" fill="#dce6dc" stroke={copper} strokeWidth="3" />
        <Arrow x1={x - 14} y1={s.flux > 0 ? 164 : 56} x2={x - 14} y2={s.flux > 0 ? 56 : 164} />
        <text x={x - 14} y="191" textAnchor="middle">
          Φ
        </text>
        {Math.abs(s.current) > 1e-12 ? (
          <Arrow
            x1={x + 14}
            y1={s.current > 0 ? 157 : 63}
            x2={x + 14}
            y2={s.current > 0 ? 63 : 157}
            color={copper}
          />
        ) : (
          <text x={x + 16} y="82" textAnchor="middle">
            0
          </text>
        )}
        <text x={x + 15} y="191" textAnchor="middle">
          Bᵢ
        </text>
        <path d={`M${plotX} 48V183H${w - 14}`} stroke="#a6b6a9" fill="none" />
        <path d={path(pts)} stroke={green} strokeWidth="2.5" fill="none" />
        <path d={`M${plotX} 120H${w - 14}`} stroke="#c4cec1" strokeDasharray="3 4" />
        {(() => {
          const times = [Math.max(0, shot.time - 0.5), Math.min(8, shot.time + 0.5)],
            points = times.map((q) => ({
              x: plotX + (pw * q) / 8,
              y: fy(
                coilInduction({
                  z: shot.chapter === 0 ? 0.08 : magnetMotion(q).z,
                  moment: -0.03 * shot.polarity,
                }).flux,
              ),
            }));
          return (
            <path
              data-induction-part="flux-time-chord"
              d={path(points)}
              stroke={copper}
              strokeWidth="4"
              fill="none"
            />
          );
        })()}
        <circle cx={plotX + (pw * shot.time) / 8} cy={fy(s.flux)} r="4.5" fill={copper} />
        <text x={plotX + 7} y="49">
          Φ(t)
        </text>
        <text x={w - 14} y="201" textAnchor="end">
          t / s
        </text>
        <text x={plotX} y="201">
          0
        </text>
        {read(`Φ = ${(s.flux * 1e6).toFixed(2)} µWb`, `ε = ${mv(s.emf)}`)}
      </>
    );
  };
  const directions = () => (
    <>
      {TEXTBOOK_DIRECTIONS.map((r, i) => {
        const cell = w / 2,
          x = (i % 2) * cell + cell / 2,
          y = 46 + Math.floor(i / 2) * 100,
          rx = 23;
        return (
          <g key={i}>
            <text x={x} y={y - 27} textAnchor="middle">
              {r.pole > 0 ? 'N' : 'S'} ·{' '}
              {r.velocity < 0 ? tr('靠近', 'approach') : tr('远离', 'withdraw')}
            </text>
            <circle cx={x - 27} cy={y + 8} r={rx} fill={pale} stroke={copper} strokeWidth="2" />
            <path
              d={`M${x - 49} ${y + 7}A22 22 0 1 0 ${x - 25} ${y - 14}`}
              fill="none"
              stroke={green}
              strokeWidth="2"
            />
            <Arrow x1={x - 27} y1={y - 14} x2={x - 27 - r.current * 11} y2={y - 14} />
            <text x={x + 7} y={y + 13}>
              {r.current > 0 ? tr('逆时针', 'CCW') : tr('顺时针', 'CW')}
            </text>
            <text x={x} y={y + 49} textAnchor="middle">
              {r.velocity < 0 ? '|Φ| ↑' : '|Φ| ↓'} · Bᵢ {r.current > 0 ? '↑' : '↓'}
            </text>
          </g>
        );
      })}
      <text x={w / 2} y={h - 8} textAnchor="middle">
        {tr('教材记录 · 从上方看', 'Textbook · top view')}
      </text>
    </>
  );
  const ringScene = () => {
    const detailed = v === 'response',
      g = ringGeometry(shot.time, shot.closed, shot.polarity, detailed ? RING.viewGain : 1),
      x = detailed ? (w < 440 ? 73 : 180) : w * 0.7,
      py = 20,
      center = { x: x + g.center.x, y: py + g.center.y };
    return (
      <>
        <path
          d={`M${x - 26} ${py}H${x + 26}`}
          stroke="#b4bda9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          data-induction-part="suspension"
          d={`M${x} ${py}L${x + g.top.x} ${py + g.top.y}`}
          stroke="#8d9c8e"
          strokeWidth="1.8"
        />
        <g transform={`rotate(${(-g.angle * 180) / Math.PI} ${center.x} ${center.y})`}>
          <Loop
            x={center.x}
            y={center.y}
            rx={detailed ? 15 : 12}
            ry={g.radius}
            closed={shot.closed}
            current={g.current}
            time={shot.time}
          />
        </g>
        {!detailed && (
          <Magnet
            x={x - (g.magnetZ * 118) / RING.length}
            y={py + 118}
            pole={shot.polarity}
            horizontal
          />
        )}
        {Math.abs(g.force) > 1e-8 && (
          <Arrow
            x1={center.x}
            y1={center.y + 45}
            x2={center.x + 27 * Math.sign(g.force)}
            y2={center.y + 45}
            color={copper}
          />
        )}
        {detailed ? (
          <>
            <text x={w - 12} y="65" textAnchor="end">
              ε = {mv(g.emf)}
            </text>
            <text x={w - 12} y="97" textAnchor="end">
              I = {(g.current * 1000).toFixed(2)} mA
            </text>
            <text x={w - 12} y="129" textAnchor="end">
              F = {(g.force * 1e6).toFixed(2)} µN
            </text>
            <text x={w - 12} y={h - 57} textAnchor="end">
              θ × {RING.viewGain}
            </text>
          </>
        ) : (
          <text x="12" y="44">
            {shot.closed
              ? tr('闭合电流路径', 'Closed current path')
              : tr('断口仍在', 'A gap remains')}
          </text>
        )}
        {read(
          shot.closed ? tr('环路闭合', 'Closed ring') : tr('环路断开', 'Split ring'),
          detailed ? `x = ${(g.x * 1e6).toFixed(0)} µm` : `ε = ${mv(g.emf)}`,
        )}
      </>
    );
  };
  const traceScene = () => {
    const turnTest = shot.chapter === 6,
      base = fallTrace(turnTest ? shot.height : 0.1, 80),
      test = fallTrace(turnTest ? shot.height : 0.26, turnTest ? shot.turns : 80),
      span = test.at(-1)!.time,
      max =
        Math.max(...base.map((p) => Math.abs(p.emf)), ...test.map((p) => Math.abs(p.emf))) * 1.12,
      px = 48,
      pw = w - px - 15,
      zero = 109,
      scale = 62 / max,
      X = (t: number) => px + (pw * t) / span,
      Y = (e: number) => zero - e * scale;
    const prior = turnTest || shot.height > 0.1,
      active = turnTest ? test : shot.height > 0.1 ? test : base,
      shown = shot.reveal
        ? [...active.filter((p) => p.time <= shot.time), { time: shot.time, emf: s.emf }]
        : [];
    return (
      <>
        <text x="12" y="20">
          {tr('计算电压 · 同一纵轴', 'Model voltage · one scale')}
        </text>
        <path d={`M${px} 37V179H${w - 12}M${px} ${zero}H${w - 12}`} fill="none" stroke="#b4c2b4" />
        {prior && (
          <path
            d={path(base.map((p) => ({ x: X(p.time), y: Y(p.emf) })))}
            stroke="#b4c4b2"
            strokeWidth="3"
            fill="none"
          />
        )}
        <path
          data-induction-part="active-voltage-trace"
          d={path(shown.map((p) => ({ x: X(p.time), y: Y(p.emf) })))}
          stroke={green}
          strokeWidth="2.8"
          fill="none"
        />
        {shot.reveal && (
          <g>
            <circle
              data-induction-part="voltage-current-point"
              cx={X(Math.min(shot.time, span))}
              cy={Y(s.emf)}
              r="4"
              fill={copper}
            />
            {turnTest && shot.compare && (
              <>
                <path
                  data-induction-part="same-time-comparison"
                  d={`M${X(shot.time)} ${Y(s.emf)}V${Y(fallingMagnet(shot.time, shot.height, 80).emf)}`}
                  stroke={copper}
                  strokeDasharray="3 3"
                />
                <circle
                  data-induction-part="baseline-at-same-time"
                  cx={X(shot.time)}
                  cy={Y(fallingMagnet(shot.time, shot.height, 80).emf)}
                  r="4"
                  fill="#b4c4b2"
                  stroke={green}
                />
              </>
            )}
          </g>
        )}
        <text x={px - 8} y={Y(max / 1.12) + 5} textAnchor="end">
          {((max / 1.12) * 1000).toFixed(0)}
        </text>
        <text x={px - 8} y={zero + 5} textAnchor="end">
          0
        </text>
        <text x={px - 8} y={Y(-max / 1.12) + 5} textAnchor="end">
          −{((max / 1.12) * 1000).toFixed(0)}
        </text>
        <text x="4" y="36">
          mV
        </text>
        <text x={px} y="198">
          0
        </text>
        <text x={w - 12} y="198" textAnchor="end">
          {span.toFixed(2)} s
        </text>
        {read(
          turnTest ? `80 → ${shot.turns}` : `h: 0.10 → 0.26 m`,
          shot.predict
            ? tr('先预测', 'Predict first')
            : turnTest
              ? `ε / ε₈₀ = ${(shot.turns / 80).toFixed(1)}`
              : tr('同为80匝', 'Both: 80 turns'),
        )}
      </>
    );
  };
  const discScene = () => {
    const x = w < 440 ? 85 : w * 0.36,
      y = 113,
      r = 65,
      lx = w - 27;
    return (
      <>
        <circle cx={x} cy={y} r={r} fill={`url(#${id}-copper)`} stroke="#a27a49" strokeWidth="2" />
        <g transform={`rotate(${(-shot.discAngle * 180) / Math.PI / 20} ${x} ${y})`}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3;
            return (
              <path
                key={i}
                d={`M${x + 12 * Math.cos(a)} ${y + 12 * Math.sin(a)}L${x + (r - 6) * Math.cos(a)} ${y + (r - 6) * Math.sin(a)}`}
                stroke="#eed8b8"
                strokeWidth="1.5"
              />
            );
          })}
        </g>
        {[-1, 0, 1].flatMap((j) =>
          [-1, 0, 1]
            .filter((k) => j !== 0 || k !== 0)
            .map((k) => (
              <g key={`${j}:${k}`}>
                <circle cx={x + j * 31} cy={y + k * 31} r="6" fill="#dfdac3" stroke={green} />
                <circle cx={x + j * 31} cy={y + k * 31} r="1.7" fill={green} />
              </g>
            )),
        )}
        <Route
          kind="disc-radial"
          d={`M${x} ${y}H${x + r}`}
          current={disc.current}
          time={shot.chapterTime}
        />
        <Route
          kind="disc-rim-return"
          d={`M${x + r + 7} ${y}H${lx - 18}V172H${lx}V151`}
          current={disc.current}
          time={shot.chapterTime}
        />
        <Route
          kind="disc-axis-return"
          d={`M${lx} 117V35H${x + 43}M${x + 24} 35H${x}V${y}`}
          current={disc.current}
          time={shot.chapterTime}
        />
        <path
          data-induction-part="disc-switch"
          d={`M${x + 24} 35L${x + 43} ${shot.closed ? 35 : 22}`}
          stroke={green}
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          data-induction-part="disc-load"
          x={lx - 7}
          y="117"
          width="14"
          height="34"
          rx="3"
          fill="#efe6ce"
          stroke={copper}
        />
        <circle data-induction-part="axis-brush" cx={x} cy={y} r="6" fill="#58685f" />
        <rect
          data-induction-part="rim-brush"
          x={x + r - 4}
          y={y - 6}
          width="12"
          height="12"
          rx="2"
          fill="#58685f"
        />
        <text x={x} y="24" textAnchor="middle">
          {tr('轴电刷', 'Axle brush')}
        </text>
        <text x={x + r - 5} y={y + 29} textAnchor="middle">
          {disc.emf > 0 ? '+' : disc.emf < 0 ? '−' : '0'}
        </text>
        <text x={x + r + 14} y={y - 16} textAnchor="middle">
          {tr('边缘', 'Rim')}
        </text>
        <text x="12" y="193">
          B ⊙
        </text>
        <text x={w - 12} y="193" textAnchor="end">
          ω = {disc.omega} rad/s
        </text>
        {read(`ε = ${mv(disc.emf)}`, `I = ${(disc.current * 1000).toFixed(2)} mA`)}
      </>
    );
  };
  const radialScene = () => {
    const a = 30,
      b = w - 60,
      len = b - a,
      y = 115,
      velocityScale = disc.omega / Math.max(40, Math.abs(disc.omega));
    return (
      <>
        <text x="12" y="23">
          {disc.omega === 0
            ? tr('磁场仍在，导体静止', 'Field present, conductor still')
            : tr('稳恒磁场中，导体在动', 'Fixed field, moving conductor')}
        </text>
        <rect x={a - 3} y={y - 7} width={len + 6} height="14" rx="7" fill="#c8a06d" />
        {[0.5, 1].map((f) => {
          const x = a + len * f,
            r = disc.radius * f,
            p = discRadial(disc.omega, disc.field, r);
          return (
            <g
              key={f}
              data-induction-radius={r}
              data-induction-speed={p.speed}
              data-induction-force-per-charge={p.forcePerCharge}
            >
              {Math.abs(p.speed) > 1e-12 && (
                <>
                  <g data-induction-vector="velocity">
                    <Arrow x1={x} y1={y} x2={x} y2={y - 55 * velocityScale * f} />
                  </g>
                  <g data-induction-vector="force">
                    <Arrow x1={x} y1={y} x2={x + 38 * velocityScale * f} y2={y} color={red} />
                  </g>
                </>
              )}
              <circle cx={x} cy={y} r="5" fill="#f4f2e6" stroke={ink} />
              <text x={x} y={y + 5} textAnchor="middle">
                +
              </text>
              <text x={x} y="191" textAnchor="middle">
                {f === 0.5 ? 'r/2' : 'r'}
              </text>
            </g>
          );
        })}
        <text x="12" y="67">
          v = ωr
        </text>
        <text x="12" y="99" fill={red}>
          F/q = vB
        </text>
        <text x="12" y="161">
          B ⊙
        </text>
        <text x={a} y="191" textAnchor="middle">
          0
        </text>
        {read('ε = Bωr²/2', mv(disc.emf))}
      </>
    );
  };
  const powerScene = () => {
    const p = disc.mechanicalPower * 1000,
      bw = (w - 36) / 2;
    return (
      <>
        <text x="12" y="26">
          {disc.omega === 0
            ? tr('圆盘停转，功率为零', 'Disc stopped: zero power')
            : !disc.closed
              ? tr('外回路断开，负载功率为零', 'Open circuit: zero load power')
              : tr('磁场恒定，仍需做功', 'Fixed field; work is still needed')}
        </text>
        <rect x="12" y="58" width={bw} height="82" rx="14" fill={pale} />
        <rect x={24 + bw} y="58" width={bw} height="82" rx="14" fill="#f0e6d3" />
        <text x={12 + bw / 2} y="87" textAnchor="middle">
          {tr('机械输入', 'Mechanical')}
        </text>
        <text x={12 + bw / 2} y="118" textAnchor="middle">
          {p.toFixed(3)} mW
        </text>
        <text x={24 + bw * 1.5} y="87" textAnchor="middle">
          {tr('电阻发热', 'Resistor heat')}
        </text>
        <text x={24 + bw * 1.5} y="118" textAnchor="middle">
          {(disc.loadPower * 1000).toFixed(3)} mW
        </text>
        <text x={w / 2} y="178" textAnchor="middle">
          −τₘω = I²R
        </text>
        {read(`ω = ${disc.omega} rad/s`, `ε = ${mv(disc.emf)}`)}
      </>
    );
  };
  return (
    <svg
      className="icl-art"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={viewLabel(v)}
      data-induction-experiment={shot.experiment}
      data-induction-view={v}
      data-emf={shot.experiment === 'disc' ? disc.emf : s.emf}
      data-current={shot.experiment === 'disc' ? disc.current : s.current}
      data-predict={shot.predict}
      data-time={shot.time}
    >
      <defs>
        <linearGradient id={`${id}-copper`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e1c091" />
          <stop offset=".5" stopColor="#b78a55" />
          <stop offset="1" stopColor="#d6b483" />
        </linearGradient>
      </defs>
      <g>
        {v === 'directions'
          ? directions()
          : shot.experiment === 'coil'
            ? v === 'flux'
              ? fluxScene()
              : coilScene()
            : shot.experiment === 'ring'
              ? ringScene()
              : shot.experiment === 'fall'
                ? v === 'trace'
                  ? traceScene()
                  : coilScene()
                : v === 'radial'
                  ? radialScene()
                  : v === 'power'
                    ? powerScene()
                    : discScene()}
      </g>
    </svg>
  );
}
export default function InductionCoilLab() {
  const film = useShowcase(),
    ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(268),
    [experiment, setExperiment] = useState<InductionExperiment>(() =>
      initialInduction(film.variant),
    ),
    [view, setView] = useState<InductionView>('apparatus'),
    [time, setTime] = useState(2),
    [polarity, setPolarity] = useState('north'),
    [ringClosed, setRingClosed] = useState('closed'),
    [discClosed, setDiscClosed] = useState('closed'),
    [height, setHeight] = useState(0.26),
    [turns, setTurns] = useState(80),
    [omega, setOmega] = useState(20);
  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return;
    const el = ref.current,
      measure = () => setWidth(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const shot: Shot = film.watch
    ? inductionDirector(film.chapter, film.chapterProgress, film.chapterTime, browserLocale())
    : {
        ...inductionDirector(
          experiment === 'coil' ? 1 : experiment === 'ring' ? 3 : experiment === 'fall' ? 6 : 7,
          0,
        ),
        experiment,
        view,
        chapterTime: time,
        discAngle: time * omega,
        progress: time / 8,
        time: experiment === 'fall' ? (time / 8) * Math.sqrt((2 * (height + 0.12)) / 9.8) : time,
        polarity: polarity === 'north' ? 1 : -1,
        closed:
          experiment === 'ring'
            ? ringClosed === 'closed'
            : experiment === 'disc'
              ? discClosed === 'closed'
              : true,
        height,
        turns,
        omega,
        predict: false,
        reveal: true,
      };
  return (
    <div className="icl-scene" data-watch={film.watch} ref={ref}>
      <div className="icl-heading">
        <span>{labels()[shot.experiment]}</span>
        <span>{shot.replay ? tr('慢放回看', 'Slowed replay') : viewLabel(shot.view)}</span>
      </div>
      <InductionArtwork shot={shot} width={width} />
      {!film.watch && (
        <div className="icl-controls">
          <Segments
            label={tr('选择感应实验', 'Choose an induction experiment')}
            value={experiment}
            options={(Object.keys(labels()) as InductionExperiment[]).map((value) => ({
              value,
              label: labels()[value],
            }))}
            onChange={(v) => {
              setExperiment(v as InductionExperiment);
              setView('apparatus');
            }}
          />
          <Segments
            label={tr('观察视图', 'Observation view')}
            value={view}
            options={views(experiment).map((value) => ({ value, label: viewLabel(value) }))}
            onChange={(v) => setView(v as InductionView)}
          />
          {experiment !== 'disc' ? (
            <>
              <Range
                label={tr('同一运动时钟', 'One motion clock')}
                value={time}
                min={0}
                max={8}
                step={0.02}
                onChange={setTime}
              />
              {experiment !== 'fall' && (
                <Segments
                  label={tr('朝向线圈的磁极', 'Pole facing the loop')}
                  value={polarity}
                  options={[
                    { value: 'north', label: 'N' },
                    { value: 'south', label: 'S' },
                  ]}
                  onChange={setPolarity}
                />
              )}
            </>
          ) : (
            <Range
              label={tr('圆盘角速度', 'Disc angular velocity')}
              value={omega}
              min={-40}
              max={40}
              step={1}
              onChange={setOmega}
              unit="rad/s"
            />
          )}
          {(experiment === 'ring' || experiment === 'disc') && (
            <Segments
              label={
                experiment === 'ring'
                  ? tr('铝环连接', 'Ring connection')
                  : tr('电流路径', 'Current path')
              }
              value={experiment === 'ring' ? ringClosed : discClosed}
              options={[
                { value: 'closed', label: tr('闭合', 'Closed') },
                { value: 'open', label: tr('断开', 'Open') },
              ]}
              onChange={experiment === 'ring' ? setRingClosed : setDiscClosed}
            />
          )}
          {experiment === 'fall' && (
            <>
              <Range
                label={tr('释放高度', 'Release height')}
                value={height}
                min={0.06}
                max={0.3}
                step={0.01}
                onChange={setHeight}
                unit="m"
              />
              <Range
                label={tr('线圈匝数', 'Coil turns')}
                value={turns}
                min={40}
                max={160}
                step={40}
                onChange={setTurns}
              />
            </>
          )}
          <details>
            <summary>{tr('模型、方向与放大边界', 'Model, directions and enlargement')}</summary>
            <p>
              {tr(
                '曲线是点磁偶极与纯电阻模型的计算，不是采集的实验记录。正电流从磁体一侧看为逆时针。铝环动力学使用真实微小位移；局部响应镜头只把转角放大200倍，不把放大值带回磁通计算。落磁采用近似开路的高阻电压测量。圆盘内画出代表性的径向电流路径，电刷为理想接触。',
                'Curves are point-dipole and resistive-model calculations, not acquired data. Positive current is counterclockwise viewed from the magnet side. Ring dynamics uses its physical displacement; the local response view enlarges angle 200 times without feeding that gain into flux. Falling-magnet voltage uses a high-impedance sensor. The disc shows a representative radial current path and ideal brushes.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
