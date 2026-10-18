import { useEffect, useId, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  centralFlashEvents,
  etherFringes,
  flightClock,
  lightClock,
  muonFlight,
  relativityDirector,
  trainFlashState,
  type RelativityDirection,
  type RelativityShot,
  type TrainFrame,
} from '../../models/relativity-experiments';
import { CLOCK_RECORDS, MUON_RECORDS } from '../../models/relativity-experiments-records';
import '../../styles/relativity-experiments.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#35534f',
  green = '#487f79',
  gold = '#aa773c',
  blue = '#517d9e',
  pale = '#e2ebe5';
function Arrow({
  x,
  y,
  dx,
  dy,
  color = green,
  dashed = false,
  kind,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  dashed?: boolean;
  kind?: string;
}) {
  const a = Math.atan2(dy, dx),
    l = Math.hypot(dx, dy),
    ex = x + dx,
    ey = y + dy;
  return (
    <g
      stroke={color}
      fill={color}
      strokeWidth="2"
      data-vector-dx={dx}
      data-vector-dy={dy}
      data-clock-vector={kind}
    >
      <path d={`M${x} ${y}L${ex} ${ey}`} strokeDasharray={dashed ? '5 5' : undefined} />
      {l > 2 && (
        <path
          d={`M${ex} ${ey}L${ex - 7 * Math.cos(a - 0.4)} ${ey - 7 * Math.sin(a - 0.4)}L${ex - 7 * Math.cos(a + 0.4)} ${ey - 7 * Math.sin(a + 0.4)}Z`}
          stroke="none"
        />
      )}
    </g>
  );
}
function lines(text: string, width: number) {
  const units = text.match(/[A-Za-z0-9′+−±./]+|\s+|./gu) ?? [],
    result: string[] = [];
  let row = '',
    length = 0;
  for (const unit of units) {
    const n = /^[\x00-\x7F′−±]+$/.test(unit) ? unit.length * 8.1 : unit.length * 17;
    if (length + n > width && row) {
      result.push(row.trim());
      row = '';
      length = 0;
    }
    row += unit;
    length += n;
  }
  if (row) result.push(row.trim());
  return result;
}
function Label({
  x,
  y,
  text,
  width = 130,
  anchor = 'middle',
  color = ink,
}: {
  x: number;
  y: number;
  text: string;
  width?: number;
  anchor?: 'middle' | 'start' | 'end';
  color?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color}>
      {lines(text, width).map((s, i) => (
        <tspan x={x} dy={i ? 21 : 0} key={i}>
          {s}
        </tspan>
      ))}
    </text>
  );
}
function Ether({
  w,
  h,
  p,
  reveal,
  id,
}: {
  w: number;
  h: number;
  p: number;
  reveal: boolean;
  id: string;
}) {
  const phone = w < 400,
    cx = phone ? w * 0.32 : 175,
    cy = phone ? 88 : 120,
    arm = phone ? 47 : 75,
    angle = (p * Math.PI) / 2,
    shift = etherFringes(angle) - etherFringes(0),
    stripX = phone ? 12 : 346,
    stripW = phone ? w - 24 : 280,
    firstY = phone ? 172 : 78,
    gap = phone ? 60 : 105,
    stripH = 20;
  const routes = [
    `M${cx - arm - 18} ${cy}L${cx} ${cy}L${cx + arm} ${cy}L${cx} ${cy}L${cx} ${cy + arm + 10}`,
    `M${cx - arm - 18} ${cy}L${cx} ${cy}L${cx} ${cy - arm}L${cx} ${cy}L${cx} ${cy + arm + 10}`,
  ];
  return (
    <g data-ether-shift={shift} data-null-revealed={reveal}>
      <defs>
        <pattern id={`${id}-fringe`} width="25" height="22" patternUnits="userSpaceOnUse">
          <rect width="25" height="22" fill="#f3efe2" />
          <rect x="5" width="10" height="22" rx="5" fill={gold} opacity=".65" />
        </pattern>
        <clipPath id={`${id}-strip1`}>
          <rect x={stripX} y={firstY} width={stripW} height={stripH} rx="6" />
        </clipPath>
        <clipPath id={`${id}-strip2`}>
          <rect x={stripX} y={firstY + gap} width={stripW} height={stripH} rx="6" />
        </clipPath>
      </defs>
      <g transform={`rotate(${p * 90} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={arm + 20} fill="#eef0e6" stroke="#cad6cc" />
        <path
          d={`M${cx - arm - 18} ${cy}H${cx + arm}M${cx} ${cy - arm}V${cy + arm + 10}`}
          stroke="#a6b9b2"
          strokeWidth="7"
          fill="none"
        />
        {routes.map((d, i) => (
          <path
            key={i}
            data-relativity-optical-route={i}
            d={d}
            fill="none"
            stroke={i ? blue : gold}
            strokeWidth="2"
            opacity=".82"
          />
        ))}
        <path
          d={`M${cx - 9} ${cy + 9}L${cx + 9} ${cy - 9}`}
          stroke="#4f777f"
          strokeWidth="5"
          data-relativity-optical-part="splitter"
        />
        <path
          d={`M${cx + arm} ${cy - 12}v24M${cx - 12} ${cy - arm}h24`}
          stroke="#6a898c"
          strokeWidth="5"
        />
        <rect x={cx - arm - 26} y={cy - 8} width="17" height="16" rx="5" fill={gold} />
        <rect
          x={cx - 10}
          y={cy + arm + 5}
          width="20"
          height="12"
          rx="4"
          fill={green}
          data-relativity-optical-part="detector"
        />
        <circle cx={cx} cy={cy} r="4" fill="#fff4bd" />
      </g>
      <Label
        x={phone ? w - 48 : 180}
        y={phone ? 72 : 244}
        width={phone ? 80 : 240}
        text={`${Math.round(p * 90)}°`}
      />
      <Label
        x={phone ? w - 48 : 180}
        y={phone ? 100 : 271}
        width={phone ? 80 : 240}
        text={`${shift.toFixed(2)}`}
        color={gold}
      />
      <Label
        x={stripX}
        y={firstY - 9}
        anchor="start"
        width={stripW}
        text={tr('模型条纹', 'Model fringes')}
      />
      <g clipPath={`url(#${id}-strip1)`}>
        <rect
          x={stripX - 30 + shift * 25}
          y={firstY}
          width={stripW + 60}
          height={stripH}
          fill={`url(#${id}-fringe)`}
        />
      </g>
      <path d={`M${stripX + stripW / 2} ${firstY - 3}v26`} stroke={ink} strokeWidth="1.5" />
      <Label
        x={stripX}
        y={firstY + gap - 9}
        anchor="start"
        width={stripW}
        text={
          reveal ? tr('理想零结果', 'Idealized null result') : tr('等待检验', 'Awaiting comparison')
        }
      />
      {reveal ? (
        <g clipPath={`url(#${id}-strip2)`}>
          <rect
            x={stripX - 30}
            y={firstY + gap}
            width={stripW + 60}
            height={stripH}
            fill={`url(#${id}-fringe)`}
          />
        </g>
      ) : (
        <rect x={stripX} y={firstY + gap} width={stripW} height={stripH} rx="6" fill={pale} />
      )}
      <path d={`M${stripX + stripW / 2} ${firstY + gap - 3}v26`} stroke={ink} strokeWidth="1.5" />
    </g>
  );
}
function Train({
  w,
  h,
  p,
  beta,
  frame,
  prediction,
  cover = false,
}: {
  w: number;
  h: number;
  p: number;
  beta: number;
  frame: TrainFrame;
  prediction: boolean;
  cover?: boolean;
}) {
  const model = trainFlashState(beta, frame, p),
    phone = w < 400,
    scale = cover ? w * 0.6 : phone ? 118 : 210,
    origin = w / 2 - (frame === 'ground' ? (model.beta * model.endGround * scale) / 2 : 0),
    X = (v: number) => origin + v * scale,
    cy = cover ? 110 : phone ? 116 : 150,
    left = X(model.center - model.length / 2),
    right = X(model.center + model.length / 2),
    center = X(model.center),
    trainWidth = right - left;
  return (
    <g
      data-frame={frame}
      data-beta={beta}
      data-coordinate-time={model.time}
      data-rest-length={model.restLength}
    >
      <Label
        x={w / 2}
        y={24}
        width={w - 20}
        text={
          prediction
            ? tr('预测：向左行呢？', 'Predict: moving left?')
            : frame === 'train'
              ? tr('车厢参考系', 'Train frame')
              : tr('地面参考系', 'Ground frame')
        }
      />
      <text x={w / 2} y={50} textAnchor="middle">
        β = {beta.toFixed(1)} · {frame === 'train' ? 't′' : 't'} = {model.time.toFixed(2)}
      </text>
      <path d={`M12 ${cy + 57}H${w - 12}`} stroke="#94afa5" strokeWidth="2" />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={i} d={`M${12 + (i * (w - 24)) / 12} ${cy + 57}v6`} stroke="#b7c8be" />
      ))}
      <rect
        x={left - 6}
        y={cy - 40}
        width={trainWidth + 12}
        height="87"
        rx="17"
        fill="#e7ede7"
        stroke="#8fa9a3"
      />
      <path d={`M${left + 4} ${cy - 28}H${right - 4}`} stroke="#a8bcb6" strokeWidth="3" />
      {[-0.25, 0.25].map((f) => (
        <rect
          key={f}
          x={center + f * trainWidth - 12}
          y={cy - 24}
          width="24"
          height="29"
          rx="7"
          fill="#c4d9d8"
          stroke="#a1bfc0"
        />
      ))}
      <path
        d={`M${left} ${cy - 23}V${cy + 30}M${right} ${cy - 23}V${cy + 30}`}
        stroke="#5d7878"
        strokeWidth="5"
      />
      <circle cx={center} cy={cy + 15} r="6" fill="#f3c66a" stroke={gold} />
      <path d={`M${center} ${cy + 21}v17`} stroke={gold} strokeWidth="3" />
      {[left + trainWidth * 0.2, right - trainWidth * 0.2].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={cy + 48} r="9" fill="#778d87" />
          <circle cx={x} cy={cy + 48} r="4" fill="#d5e0d8" />
        </g>
      ))}
      {model.pulses.map((e) => (
        <g
          key={e.id}
          data-wall-side={e.side}
          data-arrived={e.received}
          data-wall-x={e.wallX}
          data-light-x={e.lightX}
          data-arrival-time={e.arrival}
        >
          {e.received ? (
            <path
              d={`M${X(e.wallX)} ${cy - 20}v47`}
              stroke={e.side < 0 ? blue : gold}
              strokeWidth="6"
              opacity=".8"
            />
          ) : (
            <>
              <path
                d={`M${X(0)} ${cy + 15}H${X(e.lightX)}`}
                stroke={e.side < 0 ? blue : gold}
                strokeWidth="2"
                opacity=".65"
              />
              <circle cx={X(e.lightX)} cy={cy + 15} r="4" fill={e.side < 0 ? blue : gold} />
            </>
          )}
          <text
            x={X(e.wallX) + e.side * 14}
            y={cy + 12}
            textAnchor="middle"
            fill={e.side < 0 ? blue : gold}
          >
            {e.side < 0 ? 'A' : 'B'}
          </text>
          <text
            x={e.side < 0 ? 22 : w - 22}
            y={cy + 100}
            textAnchor={e.side < 0 ? 'start' : 'end'}
            fill={e.side < 0 ? blue : gold}
          >
            {e.side < 0 ? 'A' : 'B'}: {e.received ? e.arrival.toFixed(2) : '—'}
          </text>
        </g>
      ))}
      {frame === 'ground' && beta !== 0 && (
        <Arrow x={w / 2 - Math.sign(beta) * 30} y={cy - 50} dx={Math.sign(beta) * 60} dy={0} />
      )}
      <Label x={w / 2} y={h - 13} width={w - 20} text={tr('归一化时间', 'Normalized time')} />
    </g>
  );
}
function TrainEvents({ w, h, beta }: { w: number; h: number; beta: number }) {
  const m = centralFlashEvents(beta),
    phone = w < 400,
    xA = phone ? 105 : 370,
    xB = phone ? 209 : 560;
  return (
    <g data-event-source="central-flash">
      <text x={w / 2} y={24} textAnchor="middle">
        β = {beta.toFixed(1)} · L₀ = c = 1
      </text>
      <text x={xA} y={64} textAnchor="middle" fill={blue}>
        A
      </text>
      <text x={xB} y={64} textAnchor="middle" fill={gold}>
        B
      </text>
      <path d={`M12 76H${w - 12}M12 135H${w - 12}M12 194H${w - 12}`} stroke="#d2dfd6" />
      <Label
        x={12}
        y={102}
        anchor="start"
        width={phone ? 75 : 260}
        text={tr('地面参考系', 'Ground frame')}
      />
      <Label
        x={12}
        y={161}
        anchor="start"
        width={phone ? 75 : 260}
        text={tr('车厢参考系', 'Train frame')}
      />
      {m.events.map((e, i) => (
        <g key={e.id} data-event-id={e.id} data-t={e.t} data-t-prime={e.tPrime}>
          <text x={i ? xB : xA} y={111} textAnchor="middle">
            {e.t.toFixed(2)}
          </text>
          <text x={i ? xB : xA} y={170} textAnchor="middle">
            {e.tPrime.toFixed(2)}
          </text>
        </g>
      ))}
      <text x={w / 2} y={h - 45} textAnchor="middle">
        t′ = γ(t − βx)
      </text>
      <Label x={w / 2} y={h - 14} width={w - 20} text={tr('归一化时间', 'Normalized time')} />
    </g>
  );
}
function MuonRecords({ w, h, reveal }: { w: number; h: number; reveal: boolean }) {
  const phone = w < 400,
    x1 = w * 0.36,
    x2 = w * 0.77,
    bottom = h - 43,
    top = 49,
    Y = (n: number) => bottom - (n / 650) * (bottom - top),
    means = MUON_RECORDS.reportedMeans,
    sets = [MUON_RECORDS.summit, MUON_RECORDS.cambridge];
  return (
    <g data-fixed-muon-records="table-I" data-records-revealed={reveal}>
      <text x={12} y={23}>
        1963 · h⁻¹
      </text>
      <path d={`M36 ${top}V${bottom}H${w - 10}`} stroke="#a9bbb2" fill="none" />
      {[0, 300, 600].map((n) => (
        <g key={n}>
          <path d={`M34 ${Y(n)}H${w - 12}`} stroke="#e0e8df" />
          <text x={29} y={Y(n) + 5} textAnchor="end">
            {n}
          </text>
        </g>
      ))}
      {[x1, x2].map((x, j) =>
        j === 1 && !reveal ? (
          <text key={j} x={x} y={top + 70} textAnchor="middle">
            ?
          </text>
        ) : (
          <g key={j}>
            <rect
              x={x - 23}
              y={Y(means[j]!)}
              width="46"
              height={bottom - Y(means[j]!)}
              rx="6"
              fill={j ? blue : green}
              opacity=".16"
            />
            {sets[j]!.map((n, i) => (
              <circle
                key={i}
                data-record-count={n}
                cx={x + (i - (sets[j]!.length - 1) / 2) * 6}
                cy={Y(n)}
                r="3.2"
                fill={j ? blue : green}
              />
            ))}
            <path d={`M${x - 25} ${Y(means[j]!)}h50`} stroke={j ? blue : green} strokeWidth="2" />
            <text x={x} y={Y(means[j]!) - 12} textAnchor="middle">
              {j === 1 && !reveal ? '?' : `${means[j]} ± ${MUON_RECORDS.reportedErrors[j]}`}
            </text>
          </g>
        ),
      )}
      <Label x={x1} y={bottom + 23} width={phone ? 90 : 160} text={tr('山顶', 'Summit')} />
      <Label x={x2} y={bottom + 23} width={phone ? 90 : 160} text={tr('海平面', 'Sea level')} />
    </g>
  );
}
function Cohort({
  w,
  h,
  p,
  beta,
  prediction,
  height,
}: {
  w: number;
  h: number;
  p: number;
  beta: number;
  prediction: boolean;
  height: number;
}) {
  const m = muonFlight(beta, height, p),
    phone = w < 400,
    cols = [w * 0.25, w * 0.75],
    dotGap = phone ? 10 : 17,
    gridWidth = dotGap * 9,
    top = 83,
    gridH = dotGap * 9,
    base = top + gridH;
  return (
    <g
      data-muon-beta={m.beta}
      data-muon-progress={p}
      data-proper-seconds={m.properTime}
      data-muon-classical-count={m.classicalCount}
      data-muon-relative-count={m.relativeCount}
      data-muon-prediction={prediction}
    >
      <text x={w / 2} y={23} textAnchor="middle">
        β = {beta.toFixed(3)} · {(height / 1000).toFixed(0)} km
      </text>
      {cols.map((x, j) => (
        <g key={j}>
          <Label
            x={x}
            y={52}
            width={w / 2 - 16}
            text={j ? tr('固有计时', 'Proper time') : tr('经典计时', 'Classical time')}
          />
          {(j ? m.relativeCohort : m.classicalCohort).map((dot) => (
            <circle
              key={dot.id}
              data-cohort={j ? 'proper' : 'classical'}
              data-particle-id={dot.id}
              data-alive={dot.alive}
              cx={x - gridWidth / 2 + (dot.id % 10) * dotGap}
              cy={top + Math.floor(dot.id / 10) * dotGap}
              r={phone ? 3 : 4.3}
              fill={dot.alive ? (j ? gold : blue) : '#dce4df'}
              opacity={prediction ? 0.25 : 1}
            />
          ))}
          <text x={x} y={base + 30} textAnchor="middle" fill={j ? gold : blue}>
            {prediction ? '?' : `${j ? m.relativeCount : m.classicalCount} / 100`}
          </text>
          <text x={x} y={base + 56} textAnchor="middle">
            {j ? 'τ' : 't'} = {prediction ? '?' : ((j ? m.properTime : m.labTime) * 1e6).toFixed(2)}{' '}
            μs
          </text>
        </g>
      ))}
      <g data-flight-height={m.height}>
        <path
          d={`M${w / 2} ${top}V${base}m-9 7h18`}
          stroke="#a9bbb2"
          strokeDasharray="3 3"
          fill="none"
        />
        <path d={`M${w / 2 - 6} ${top + gridH * p}h12`} stroke={green} strokeWidth="3" />
        <text x={w / 2} y={h - 10} textAnchor="middle">
          h = {(m.height / 1000).toFixed(1)} km
        </text>
      </g>
    </g>
  );
}
function LightClockView({ w, h, p }: { w: number; h: number; p: number }) {
  const m = lightClock(0.6, p),
    phone = w < 400,
    s = phone ? 76 : 105,
    leftX = phone ? 43 : 125,
    rightX = phone ? 132 : 378,
    bottom = h - 64,
    top = bottom - s;
  return (
    <g data-light-clock-time={m.groundTime} data-light-clock-proper={m.properTime}>
      <Label x={w * 0.25} y={24} width={w * 0.48 - 10} text={tr('随钟观察', 'With the clock')} />
      <Label x={w * 0.75} y={24} width={w * 0.48 - 10} text={tr('地面观察', 'From the ground')} />
      <path d={`M${leftX} ${bottom}V${top}V${bottom}`} stroke={gold} strokeWidth="2" fill="none" />
      <path
        d={`M${rightX} ${bottom}L${rightX + m.bounceX * s} ${top}L${rightX + m.endX * s} ${bottom}`}
        stroke={blue}
        strokeWidth="2"
        fill="none"
      />
      {[
        { x: leftX, moving: false },
        { x: rightX + m.x * s, moving: true },
      ].map((a, i) => (
        <g key={i}>
          <path
            d={`M${a.x - 9} ${bottom}h18M${a.x - 9} ${top}h18`}
            stroke="#587c83"
            strokeWidth="5"
          />
          <path d={`M${a.x - 12} ${bottom + 4}V${top - 4}`} stroke="#bdcfca" strokeWidth="2" />
          <circle cx={a.x} cy={bottom - m.y * s} r="4.5" fill={i ? blue : gold} />
        </g>
      ))}
      <text x={w * 0.25} y={h - 30} textAnchor="middle">
        τ = {m.properTime.toFixed(2)}
      </text>
      <text x={w * 0.75} y={h - 30} textAnchor="middle">
        t = {m.groundTime.toFixed(2)}
      </text>
      <text x={w / 2} y={h - 7} textAnchor="middle">
        c²t² = v²t² + c²τ²
      </text>
    </g>
  );
}
function MuonFrame({
  w,
  h,
  p,
  beta,
  height,
}: {
  w: number;
  h: number;
  p: number;
  beta: number;
  height: number;
}) {
  const m = muonFlight(beta, height, p),
    phone = w < 400,
    x = phone ? 74 : 200,
    top = 72,
    span = phone ? 120 : 160,
    groundY = top + span * (1 - p),
    gridX = phone ? 170 : 440,
    gap = phone ? 8 : 14;
  return (
    <g
      data-frame="muon"
      data-proper-seconds={m.properTime}
      data-muon-relative-count={m.relativeCount}
    >
      <Label x={w / 2} y={23} width={w - 10} text={tr('μ子参考系', 'Muon frame')} />
      <path d={`M${x} ${top}V${top + span}`} stroke="#b5c8bf" strokeDasharray="4 5" />
      <circle cx={x} cy={top} r="6" fill={gold} />
      <path d={`M${x - 38} ${groundY + 17}l13 -10 14 7 15 -10 13 13H${x - 38}Z`} fill="#a7c0ad" />
      <rect x={x - 25} y={groundY} width="50" height="9" rx="3" fill={green} />
      <Arrow x={x - 42} y={groundY + 20} dx={0} dy={-40} color={green} />
      <text x={x} y={top + span + 32} textAnchor="middle">
        L′ = {(m.contractedHeight / 1000).toFixed(3)} km
      </text>
      {m.relativeCohort.map((dot) => (
        <circle
          key={dot.id}
          data-cohort="rest-frame"
          data-particle-id={dot.id}
          data-alive={dot.alive}
          cx={gridX + (dot.id % 10) * gap}
          cy={top + Math.floor(dot.id / 10) * gap}
          r={phone ? 2.7 : 4}
          fill={dot.alive ? gold : '#dce4df'}
        />
      ))}
      <text x={phone ? 208 : 500} y={top + gap * 9 + 30} textAnchor="middle">
        {m.relativeCount} / 100
      </text>
      <text x={w / 2} y={h - 12} textAnchor="middle">
        τ = {(m.properTime * 1e6).toFixed(2)} μs
      </text>
    </g>
  );
}
function ClockRack({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-clock-rack="120 361 408 447">
      <rect x="0" y="0" width="110" height="118" rx="10" fill="#dce5de" stroke="#a7b9b0" />
      {CLOCK_RECORDS.clockSerials.map((serial, i) => (
        <g key={serial} data-clock-id={serial}>
          <rect
            x="6"
            y={7 + i * 27}
            width="98"
            height="23"
            rx="4"
            fill="#f6f5ec"
            stroke="#b9c6bc"
          />
          <text x="30" y={25 + i * 27} textAnchor="middle" fill="#6f8e89">
            ID
          </text>
          <text x="79" y={25 + i * 27} fontSize="17" textAnchor="middle">
            {serial}
          </text>
        </g>
      ))}
    </g>
  );
}
function ClockVectors({
  w,
  h,
  direction,
  p,
  prediction,
}: {
  w: number;
  h: number;
  direction: number;
  p: number;
  prediction: boolean;
}) {
  const phone = w < 400,
    m = flightClock(direction),
    x = phone ? 22 : 220,
    scale = phone ? 0.25 : 0.48,
    rowY = phone ? 87 : 98,
    airY = rowY + 60,
    groundLen = m.groundSpeed * scale,
    airLen = m.airSpeed * scale;
  return (
    <g
      data-clock-reference-speed={m.groundSpeed}
      data-clock-air-speed={m.airSpeed}
      data-clock-direction={direction}
    >
      <Label
        x={w / 2}
        y={22}
        width={w - 20}
        text={tr('地心非旋转系', 'Nonrotating geocentric frame')}
      />
      {!phone && <ClockRack x={36} y={66} />}
      <text x={x} y={rowY - 20}>
        {tr('地面钟', 'Ground clock')}
      </text>
      <Arrow kind="ground" x={x} y={rowY} dx={groundLen} dy={0} color={green} />
      <text x={x + groundLen + 10} y={rowY + 5}>
        465
      </text>
      <text x={x} y={airY - 20}>
        {tr('飞行钟', 'Flying clock')}
      </text>
      <Arrow kind="flying" x={x} y={airY} dx={airLen} dy={0} color={blue} />
      <text x={x + airLen + 10} y={airY + 5}>
        {Math.round(m.airSpeed)}
      </text>
      <Arrow
        kind="relative-air-speed"
        x={x + groundLen}
        y={airY + 22}
        dx={direction * 250 * scale}
        dy={0}
        color={gold}
      />
      <text x={x + groundLen + (direction * 250 * scale) / 2} y={airY + 46} textAnchor="middle">
        {direction > 0 ? '+250' : '−250'}
      </text>
      <text x={w - 10} y={rowY - 20} textAnchor="end">
        m/s
      </text>
      <Label
        x={w / 2}
        y={h - 34}
        width={w - 18}
        text={
          prediction
            ? tr('先预测西行结果', 'Predict the westbound result')
            : direction > 0
              ? tr('东行速度相加', 'Eastbound speeds add')
              : tr('西行速度相减', 'Westbound speeds subtract')
        }
      />
      {!prediction && p > 0.45 && (
        <text x={w / 2} y={h - 8} textAnchor="middle" fill={gold}>
          {tr('高度贡献', 'Height contribution')}: +
        </text>
      )}
    </g>
  );
}
function ClockHeight({ w, h, height }: { w: number; h: number; height: number }) {
  const phone = w < 400,
    rackX = phone ? 145 : 430,
    rackY = 53,
    groundY = h - 73,
    x = phone ? 20 : 100,
    m = flightClock(1, height);
  return (
    <g data-height-metres={height} data-gravity-contribution={m.gravity}>
      <path d={`M12 ${groundY + 25}H${w - 12}`} stroke="#97b69e" strokeWidth="3" />
      <rect
        x={x - 8}
        y={groundY - 4}
        width="116"
        height="29"
        rx="5"
        fill="#e1e9de"
        stroke="#9fb3a5"
      />
      <Label x={x + 50} y={groundY + 16} width={112} text={tr('地面钟', 'Ground clock')} />
      <ClockRack x={rackX} y={rackY} />
      <Label x={rackX + 55} y={29} width={110} text={tr('飞行钟组', 'Flying clocks')} />
      <Arrow x={phone ? 134 : 300} y={groundY + 8} dx={0} dy={rackY - groundY + 45} color={gold} />
      <text x={phone ? 63 : 185} y={98} textAnchor="middle">
        {Math.round(height)} m
      </text>
      <Label
        x={phone ? 63 : 185}
        y={126}
        width={phone ? 106 : 200}
        text={tr('高度贡献', 'Height contribution')}
      />
      <text x={phone ? 63 : 185} y={177} textAnchor="middle" fill={gold}>
        +{m.gravity.toFixed(0)} ns
      </text>
      <text x={w / 2} y={h - 9} textAnchor="middle">
        40 h · {tr('恒高教学模型', 'Constant-height model')}
      </text>
    </g>
  );
}
function ClockRecords({
  w,
  h,
  direction,
  reveal,
}: {
  w: number;
  h: number;
  direction: number;
  reveal: boolean;
}) {
  const phone = w < 400,
    east = direction > 0,
    observed = east ? CLOCK_RECORDS.observedEast : CLOCK_RECORDS.observedWest,
    mean = east ? CLOCK_RECORDS.publishedMeanEast : CLOCK_RECORDS.publishedMeanWest,
    sd = east ? CLOCK_RECORDS.publishedSDEast : CLOCK_RECORDS.publishedSDWest,
    pred = east ? CLOCK_RECORDS.predicted.east : CLOCK_RECORDS.predicted.west,
    left = phone ? 76 : 250,
    right = w - 24,
    min = east ? -100 : 220,
    max = east ? 0 : 310,
    X = (n: number) => left + ((n - min) / (max - min)) * (right - left),
    startY = phone ? 105 : 90;
  return (
    <g data-fixed-clock-records={east ? 'east' : 'west'} data-records-revealed={reveal}>
      <Label
        x={w / 2}
        y={23}
        width={w - 20}
        text={`1971 · ${east ? tr('向东飞行', 'Fly east') : tr('向西飞行', 'Fly west')}`}
      />
      {!phone && <ClockRack x={55} y={85} />}
      <Label
        x={phone ? 12 : left}
        y={50}
        width={w - 24}
        anchor="start"
        text={tr('航线预言', 'Route prediction')}
      />
      <path
        d={`M${X(pred.net - pred.netError)} 70H${X(pred.net + pred.netError)}`}
        stroke={green}
        strokeWidth="9"
        strokeLinecap="round"
        opacity=".3"
      />
      <circle cx={X(pred.net)} cy={70} r="4" fill={green} />
      <text x={phone ? w - 12 : right} y={50} textAnchor="end">
        {pred.net > 0 ? '+' : ''}
        {pred.net} ± {pred.netError}
      </text>
      {CLOCK_RECORDS.clockSerials.map((serial, i) => (
        <g key={serial} data-clock-id={serial} data-offset-ns={observed[i]}>
          <text
            x={phone ? 9 : left - 72}
            y={startY + i * 25 + 5}
            aria-label={`${tr('钟编号', 'Clock ID')} ${serial}`}
          >
            ID {serial}
          </text>
          <path d={`M${left} ${startY + i * 25}H${right}`} stroke="#dde5de" />
          {reveal ? (
            <circle cx={X(observed[i]!)} cy={startY + i * 25} r="4.2" fill={gold} />
          ) : (
            <text x={(left + right) / 2} y={startY + i * 25 + 5} textAnchor="middle" fill="#8da29a">
              ?
            </text>
          )}
        </g>
      ))}
      {[min, (min + max) / 2, max].map((n) => (
        <g key={n}>
          <path d={`M${X(n)} ${h - 83}v5`} stroke="#a9bbb2" />
          <text x={X(n)} y={h - 64} textAnchor="middle">
            {n}
          </text>
        </g>
      ))}
      <text x={phone ? w / 2 : (left + right) / 2} y={h - 42} textAnchor="middle" fill={gold}>
        {reveal ? `${mean > 0 ? '+' : ''}${mean} ± ${sd} ns` : tr('尚未揭晓', 'Not revealed yet')}
      </text>
      <Label
        x={phone ? w / 2 : (left + right) / 2}
        y={h - 14}
        width={phone ? w - 10 : right - left + 30}
        text={tr('分析后钟差', 'Analyzed clock offset')}
      />
    </g>
  );
}
function ClockModel({
  w,
  h,
  direction,
  height,
  p,
}: {
  w: number;
  h: number;
  direction: number;
  height: number;
  p: number;
}) {
  const m = flightClock(direction, height, 40 * p),
    phone = w < 400,
    base = phone ? 125 : 360,
    scale = phone ? 0.29 : 0.75,
    rows = [
      { name: tr('高度贡献', 'Height contribution'), v: m.gravity, color: gold },
      { name: tr('运动贡献', 'Motion contribution'), v: m.kinetic, color: blue },
      { name: tr('模型结果', 'Model result'), v: m.total, color: green },
    ];
  return (
    <g data-model-clock-height={height} data-model-clock-total={m.total}>
      <text x={w / 2} y={23} textAnchor="middle">
        {Math.round(height)} m · {(40 * p).toFixed(1)} h
      </text>
      {rows.map((r, i) => (
        <g key={i}>
          <Label x={12} y={57 + i * 69} anchor="start" width={w * 0.65} text={r.name} />
          <text x={w - 12} y={57 + i * 69} textAnchor="end" fill={r.color}>
            {r.v.toFixed(0)} ns
          </text>
          <path d={`M${base} ${68 + i * 69}v20`} stroke="#9fb5aa" />
          <rect
            x={base + Math.min(0, r.v * scale)}
            y={72 + i * 69}
            width={Math.max(0.5, Math.abs(r.v * scale))}
            height="12"
            rx="6"
            fill={r.color}
          />
        </g>
      ))}
      <text x={w / 2} y={h - 9} textAnchor="middle">
        {direction > 0 ? tr('向东飞行', 'Fly east') : tr('向西飞行', 'Fly west')}
      </text>
    </g>
  );
}
export function RelativityArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  beta = 0.995,
  height = 10000,
  direction = 1,
  shot,
  width = 340,
  prediction = false,
  reveal,
  frame = 'ground',
  cover = false,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  beta?: number;
  height?: number;
  direction?: number;
  shot?: RelativityShot;
  width?: number;
  prediction?: boolean;
  reveal?: boolean;
  frame?: TrainFrame;
  cover?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    phone = width < 400,
    h = cover ? 230 : phone ? 278 : 330,
    current =
      shot ?? (['ether', 'train', 'muon-cohort', 'clock-vectors'] as const)[mode] ?? 'ether',
    visible = reveal ?? phase === 1;
  return (
    <svg
      className="relatlab-art"
      viewBox={`0 0 ${width} ${h}`}
      role="img"
      aria-label={tr(
        '往返光路与固定实验记录',
        'Returning light paths and fixed experimental records',
      )}
      data-relativity-art={current}
    >
      {current === 'ether' && <Ether w={width} h={h} p={value} reveal={visible} id={id} />}
      {current === 'train' && (
        <Train
          w={width}
          h={h}
          p={value}
          beta={Math.abs(beta) > 0.8 ? 0.6 : beta}
          frame={frame}
          prediction={prediction}
          cover={cover}
        />
      )}
      {current === 'events' && (
        <TrainEvents w={width} h={h} beta={Math.abs(beta) > 0.8 ? 0.6 : beta} />
      )}
      {current === 'muon-records' && <MuonRecords w={width} h={h} reveal={visible} />}
      {current === 'muon-cohort' && (
        <Cohort w={width} h={h} p={value} beta={beta} prediction={prediction} height={height} />
      )}
      {current === 'light-clock' && <LightClockView w={width} h={h} p={value} />}
      {current === 'muon-frame' && (
        <MuonFrame w={width} h={h} p={value} beta={beta} height={height} />
      )}
      {current === 'clock-vectors' && (
        <ClockVectors w={width} h={h} direction={direction} p={value} prediction={prediction} />
      )}
      {current === 'clock-height' && <ClockHeight w={width} h={h} height={height} />}
      {current === 'clock-records' && (
        <ClockRecords w={width} h={h} direction={direction} reveal={visible} />
      )}
      {current === 'clock-model' && (
        <ClockModel w={width} h={h} direction={direction} height={height} p={value} />
      )}
    </svg>
  );
}
const ids = [
  'required-2-michelson-morley',
  'required-2-simultaneity',
  'required-2-muons',
  'required-2-atomic-clocks',
];
export default function RelativityExperiments() {
  const film = useShowcase(),
    [phone, setPhone] = useState(false),
    [selected, setSelected] = useState<number | null>(null),
    [manual, setManual] = useState(0.6),
    [beta, setBeta] = useState(0.99),
    [trainBeta, setTrainBeta] = useState(0.6),
    [height, setHeight] = useState(10000),
    [direction, setDirection] = useState(1),
    [view, setView] = useState<RelativityShot | null>(null),
    [frame, setFrame] = useState<TrainFrame>('ground');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = window.matchMedia('(max-width:640px)'),
      update = () => setPhone(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  const mode = film.watch
      ? Math.floor(film.chapter / 2)
      : (selected ??
        (ids.includes(film.variant ?? '')
          ? ids.indexOf(film.variant!)
          : Math.floor(film.chapter / 2))),
    watch = relativityDirector(film.chapter, film.chapterTime, browserLocale()),
    defaults: RelativityShot[] = ['ether', 'train', 'muon-cohort', 'clock-vectors'];
  const d: RelativityDirection = film.watch
    ? watch
    : {
        shot: view ?? defaults[mode] ?? 'ether',
        progress: manual,
        beta: mode === 1 ? trainBeta : beta,
        frame,
        reveal: true,
        prediction: false,
        direction,
        height,
      };
  const titles: Record<RelativityShot, string> = {
    ether: tr('以太风假说', 'Ether hypothesis'),
    train: tr('同一发射事件', 'One emission event'),
    events: tr('到壁事件记录', 'Wall-arrival records'),
    'muon-records': tr('原论文计数', 'Published counts'),
    'muon-cohort': d.prediction
      ? tr('预测：会剩更多吗？', 'Predict: more survivors?')
      : tr('教学粒子群', 'Teaching population'),
    'light-clock': tr('光钟类比', 'Light-clock analogy'),
    'muon-frame': tr('同一批幸存者', 'Same survivors'),
    'clock-vectors': tr('速度与高度', 'Speed and height'),
    'clock-height': tr('高处引力势较大', 'Higher gravitational potential'),
    'clock-records': tr('原论文原子钟', 'Published clock results'),
    'clock-model': tr('恒高教学模型', 'Constant-height model'),
  };
  const views: RelativityShot[][] = [
    ['ether'],
    ['train', 'events'],
    ['muon-records', 'muon-cohort', 'light-clock', 'muon-frame'],
    ['clock-vectors', 'clock-height', 'clock-records', 'clock-model'],
  ];
  const modeNames = [
    tr('干涉仪', 'Interferometer'),
    tr('列车闪光', 'Train flash'),
    tr('μ子存活', 'Muon survival'),
    tr('原子钟', 'Atomic clocks'),
  ];
  return (
    <div
      className="relatlab"
      data-relativity-mode={mode}
      data-relativity-shot={d.shot}
      data-watch={film.watch}
    >
      <div className="relatlab-heading">{titles[d.shot]}</div>
      <RelativityArtwork
        mode={mode}
        shot={d.shot}
        value={d.progress}
        beta={d.beta}
        height={d.shot.startsWith('muon') ? 10000 : d.height}
        direction={d.direction}
        prediction={d.prediction}
        reveal={d.reveal}
        frame={d.frame}
        width={phone ? 268 : 660}
      />
      {!film.watch && (
        <div className="relatlab-controls">
          <div className="relatlab-buttons" aria-label={tr('演示视图', 'View')}>
            {modeNames.map((name, i) => (
              <button
                type="button"
                key={name}
                aria-pressed={mode === i}
                onClick={() => {
                  setSelected(i);
                  setView(null);
                }}
              >
                {name}
              </button>
            ))}
          </div>
          {views[mode]!.length > 1 && (
            <div className="relatlab-buttons">
              {views[mode]!.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={d.shot === v}
                  onClick={() => setView(v)}
                >
                  {titles[v]}
                </button>
              ))}
            </div>
          )}
          <Range
            label={tr('观察进度', 'Observation progress')}
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
          {mode === 1 && (
            <>
              <Range
                label={tr('列车速度 / c', 'Train velocity / c')}
                value={trainBeta}
                min={-0.8}
                max={0.8}
                step={0.1}
                onChange={(n) => {
                  setTrainBeta(n);
                  setView('train');
                }}
              />
              <div className="relatlab-buttons">
                {(['ground', 'train'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={frame === f}
                    onClick={() => {
                      setFrame(f);
                      setView('train');
                    }}
                  >
                    {f === 'ground'
                      ? tr('地面参考系', 'Ground frame')
                      : tr('车厢参考系', 'Train frame')}
                  </button>
                ))}
              </div>
            </>
          )}
          {mode === 2 && (
            <Range
              label={tr('μ子速度 / c', 'Muon speed / c')}
              value={beta}
              min={0.9}
              max={0.999}
              step={0.001}
              onChange={(n) => {
                setBeta(n);
                setView('muon-cohort');
              }}
            />
          )}
          {mode === 3 && (
            <>
              <Range
                label={tr('飞行高度 / m', 'Flight altitude / m')}
                value={height}
                min={0}
                max={15000}
                step={100}
                onChange={(n) => {
                  setHeight(n);
                  setView('clock-model');
                }}
              />
              <div className="relatlab-buttons">
                {[1, -1].map((s) => (
                  <button
                    type="button"
                    key={s}
                    aria-pressed={direction === s}
                    onClick={() => setDirection(s)}
                  >
                    {s > 0 ? tr('向东飞行', 'Fly east') : tr('向西飞行', 'Fly west')}
                  </button>
                ))}
              </div>
            </>
          )}
          <details>
            <summary>{tr('数据与模型边界', 'Data and model limits')}</summary>
            <p>
              {mode === 0
                ? tr(
                    '以太风条纹来自经典模型；零结果为示意，不是历史噪声数据。',
                    'The ether fringes come from a classical model; the null panel is illustrative, not historical noise data.',
                  )
                : mode === 1
                  ? tr(
                      '标注的是墙壁处的到达事件坐标，不是远处观察者收到消息的时刻。',
                      'Times label events at the walls, not the later receipt of a message by a distant observer.',
                    )
                  : mode === 2
                    ? tr(
                        '两种算法使用相同的100个指数分位，不是真实随机样本。',
                        'Both calculations use the same 100 exponential quantiles, not a random experimental sample.',
                      )
                    : tr(
                        '历史表格不随控件变化；钟差已做速率变化分析。',
                        'Historical tables do not change with controls; clock offsets include rate-change analysis.',
                      )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
