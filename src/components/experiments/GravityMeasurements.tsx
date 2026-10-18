import { useId, useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import { browserLocale } from '../../i18n';
import {
  MOON_REFERENCE,
  gravityMeasurementsDirector,
  TORSION_OBSERVATIONS,
  TORSION_FITTED_EQUILIBRIA,
  moonEarthTest,
  moonPrediction,
  moonTangentDeparture,
  torsionBalance,
  torsionGeometry,
  torsionOpticalLever,
  publishedTorsionInference,
  calibratedFibreComparison,
  cannonOrbit,
  EARTH_RADIUS,
  EARTH_MU,
} from '../../models/gravity-measurements';
import '../../styles/gravity-measurements.css';
const CIRCULAR_SPEED = Math.sqrt(EARTH_MU / (EARTH_RADIUS + 3e5)) / 1000;
const C = {
  ink: '#35574f',
  green: '#43796c',
  gold: '#b57745',
  blue: '#547f9c',
  muted: '#748d80',
  pale: '#e6eadb',
};
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
const path = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
function Arrow({
  x,
  y,
  dx,
  dy,
  color = C.green,
  dashed = false,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  dashed?: boolean;
}) {
  const l = Math.hypot(dx, dy),
    ux = l ? dx / l : 0,
    uy = l ? dy / l : 0;
  return (
    <g stroke={color} fill="none" strokeWidth="2" opacity={l ? 1 : 0}>
      <path d={`M${x} ${y}l${dx} ${dy}`} strokeDasharray={dashed ? '4 4' : undefined} />
      <path
        d={`M${x + dx - ux * 7 - uy * 3} ${y + dy - uy * 7 + ux * 3}L${x + dx} ${y + dy}L${x + dx - ux * 7 + uy * 3} ${y + dy - uy * 7 - ux * 3}`}
      />
    </g>
  );
}
function MoonView({
  width,
  compact,
  shot,
  p,
  exponent = 2,
  multiple = 1,
  reveal = true,
}: {
  width: number;
  compact: boolean;
  shot: string;
  p: number;
  exponent?: number;
  multiple?: number;
  reveal?: boolean;
}) {
  const h = compact ? 218 : 290,
    mid = width / 2,
    baseline = compact ? 165 : 220,
    m = moonEarthTest();
  if (shot === 'surface') {
    const t = clamp(p / 0.2),
      cy = 45 + 105 * t * t;
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '一秒自由落体，用给定的地面加速度作参照',
          'One-second free fall with the given surface acceleration',
        )}
      >
        <path d={`M${mid - 65} 45H${mid + 70}M${mid - 65} 150H${mid + 70}`} stroke="#b8c3af" />
        <path d={`M${mid - 50} 45V150m-5-105h10m-10 105h10`} stroke={C.muted} />
        <text x={mid - 60} y="112" textAnchor="end">
          4.9 m
        </text>
        <path d={`M${mid + 21} ${cy - 11}q7-10 12-9`} fill="none" stroke={C.green} />
        <circle cx={mid + 20} cy={cy} r="11" fill={C.gold} />
        <text x={mid + 48} y={cy + 6}>
          {t.toFixed(2)} s
        </text>
        <text x={mid} y={h - 20} textAnchor="middle">
          g = 9.8 m/s²
        </text>
      </svg>
    );
  }
  if (
    shot === 'prediction' ||
    shot === 'lock' ||
    shot === 'distance-question' ||
    shot === 'distance-answer'
  ) {
    const doubled = shot.startsWith('distance'),
      answer = shot === 'distance-answer',
      left = 35,
      distanceMultiple = doubled ? 2 : multiple,
      right = left + ((width - 65) / 2) * distanceMultiple,
      y = 88;
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '固定地面参照，预测不同距离处的引力加速度',
          'Predict acceleration at a different distance from a fixed surface reference',
        )}
      >
        <circle cx={left} cy={y} r="25" fill="#9bb6ab" />
        <path
          d={`M${left - 15} ${y - 17}q27 5 9 23t14 13`}
          stroke="#dce5cd"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={right}
          cy={y}
          r="8"
          fill="#c7b995"
          data-hypothetical-distance={distanceMultiple}
        />
        <path d={`M${left + 30} ${y}H${right - 16}`} stroke={C.muted} strokeDasharray="3 4" />
        <text x={mid} y="45" textAnchor="middle">
          {doubled
            ? 'r → 2r'
            : `r / R = ${((MOON_REFERENCE.radius / MOON_REFERENCE.earthRadius) * multiple).toFixed(2)}`}
        </text>
        <Arrow x={right - 12} y={y + 28} dx={-35 * (doubled && answer ? 0.25 : 1)} dy={0} />
        <text x={mid} y="147" textAnchor="middle">
          {doubled
            ? answer
              ? 'a(2r) = a(r) / 4'
              : 'a(2r) = ?'
            : `a = g (R/r)${exponent === 1 ? '' : exponent === 2 ? '²' : '³'}`}
        </text>
        <text x={mid} y="183" textAnchor="middle" fill={C.gold} data-gravity-prediction="true">
          {doubled
            ? answer
              ? tr('预测：四分之一', 'Prediction: one quarter')
              : tr('先留出一个预测', 'Make a prediction')
            : reveal
              ? `${moonPrediction(exponent, multiple).toPrecision(4)} m/s²`
              : 'a = ?'}
        </text>
        {!compact && (
          <text x={mid} y="250" textAnchor="middle">
            {tr('距离与天体大小分别示意', 'Body sizes and distances use separate display scales')}
          </text>
        )}
      </svg>
    );
  }
  if (shot === 'compare') {
    const left = width * 0.31,
      right = width * 0.72,
      top = 55,
      bottom = h - 51;
    const Y = (v: number) => top + ((v - 4.7) / 0.3) * (bottom - top),
      pred = moonPrediction() * 1800,
      observed = moonTangentDeparture(60);
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        data-reference-values={`${pred},${observed}`}
        role="img"
        aria-label={tr(
          '同一局部米尺上比较预测和轨道估计，差异保留',
          'Prediction and orbital estimate on one enlarged metre scale; the difference is retained',
        )}
      >
        <text x={mid} y="24" textAnchor="middle">
          {tr('60 s · 局部刻度放大', '60 s · enlarged ruler')}
        </text>
        {[4.7, 4.8, 4.9, 5].map((v) => (
          <g key={v}>
            <path
              d={`M${left - 23} ${Y(v)}H${right + 15}`}
              stroke="#d0d8c7"
              strokeDasharray="2 4"
            />
            <text x={left - 32} y={Y(v) + 5} textAnchor="end">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={left} y="47" textAnchor="middle" fill={C.gold}>
          {tr('预测', 'Predicted')}
        </text>
        <text x={right} y="47" textAnchor="middle" fill={C.blue}>
          {tr('轨道估计', 'Orbital')}
        </text>
        <path d={`M${left} ${top}V${Y(pred)}`} stroke={C.gold} strokeWidth="3" />
        <path d={`M${right} ${top}V${Y(observed)}`} stroke={C.blue} strokeWidth="3" />
        <circle
          cx={left}
          cy={Y(pred)}
          r="6"
          fill="#f6f4e9"
          stroke={C.gold}
          strokeWidth="2"
          data-prediction-mark="true"
        />
        <circle cx={right} cy={Y(observed)} r="6" fill={C.blue} data-reference-mark="true" />
        <text x={left} y={h - 27} textAnchor="middle">
          {pred.toFixed(3)} m
        </text>
        <text x={right} y={h - 27} textAnchor="middle">
          {observed.toFixed(3)} m
        </text>
      </svg>
    );
  }
  if (shot === 'records')
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '固定的月球参考距离与恒星周期',
          'Fixed lunar reference distance and sidereal period',
        )}
      >
        <path d={`M${mid - 105} 38H${mid + 105}M${mid - 105} 163H${mid + 105}`} stroke="#c7d1be" />
        <text x={mid} y="69" textAnchor="middle">
          r = 384 400 km
        </text>
        <text x={mid} y="114" textAnchor="middle">
          T = 27.3217 d
        </text>
        <text x={mid} y="195" textAnchor="middle">
          {tr('NASA 参考值 · 固定', 'NASA reference · fixed')}
        </text>
      </svg>
    );
  const radius = compact ? 64 : 85,
    cy = compact ? 100 : 130,
    theta = 0.2 + clamp(p) * 0.7;
  const q = (a: number) => ({ x: mid + radius * Math.cos(a), y: cy - radius * Math.sin(a) }),
    moon = q(theta),
    prior = q(theta - 0.45);
  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      style={{ height: h }}
      role="img"
      aria-label={tr(
        '月球速度方向持续改变，由距离和周期得到向心加速度',
        'Changing lunar velocity direction gives centripetal acceleration from distance and period',
      )}
    >
      <circle cx={mid} cy={cy} r="20" fill="#97b7a9" />
      <circle cx={mid} cy={cy} r={radius} fill="none" stroke="#c4cdb9" />
      <circle cx={prior.x} cy={prior.y} r="6" fill="#cbd4c3" />
      <circle cx={moon.x} cy={moon.y} r="8" fill="#b89a6f" />
      <Arrow
        x={prior.x}
        y={prior.y}
        dx={-Math.sin(theta - 0.45) * 28}
        dy={-Math.cos(theta - 0.45) * 28}
        color={C.muted}
      />
      <Arrow
        x={moon.x}
        y={moon.y}
        dx={-Math.sin(theta) * 28}
        dy={-Math.cos(theta) * 28}
        color={C.blue}
      />
      <Arrow x={moon.x} y={moon.y} dx={-Math.cos(theta) * 35} dy={Math.sin(theta) * 35} />
      <text x={mid} y={baseline + 16} textAnchor="middle">
        {shot === 'acceleration'
          ? 'a = 4π²r / T²'
          : tr('引力改变速度方向', 'Gravity turns velocity')}
      </text>
      {shot === 'acceleration' && (
        <text x={mid} y={h - 8} textAnchor="middle" fill={C.blue}>
          {reveal ? `${m.observed.toFixed(6)} m/s²` : 'a = ?'}
        </text>
      )}
    </svg>
  );
}
function TorsionForces({
  width,
  compact,
  theta,
  side,
  restoring = 0,
  mass = 158,
}: {
  width: number;
  compact: boolean;
  theta: number;
  side: number;
  restoring?: number;
  mass?: number;
}) {
  const uid = useId().replaceAll(':', '');
  const h = compact ? 218 : 290,
    mid = width / 2,
    cy = compact ? 133 : 172,
    scale = Math.min((width - 50) / 2.2, 145),
    sy = 1;
  const P = (x: number, y: number) => ({ x: mid + x * scale, y: cy - y * scale * sy });
  const { small, large: big } = torsionGeometry(theta, side, mass);
  const mirror = (3 * Math.PI) / 4 + theta;
  const restoringEnd = -0.15 + side * Math.min(1.4, Math.abs(restoring)) * 1.3;
  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      style={{ height: h }}
      role="img"
      aria-label={tr(
        '四组引力与反向恢复力矩驱动同一根杆和细丝',
        'Four pairwise attractions and restoring torque drive one rod and fibre',
      )}
    >
      <defs>
        <radialGradient id={`${uid}-mass`} cx=".32" cy=".25">
          <stop stopColor="#d5ddd4" />
          <stop offset=".55" stopColor="#a2b0a5" />
          <stop offset="1" stopColor="#6b8072" />
        </radialGradient>
      </defs>
      <ellipse
        cx={mid}
        cy={cy}
        rx={1.06 * scale}
        ry={0.57 * scale * sy}
        fill="#e4e8db"
        stroke="#ccd4c3"
      />
      <path d={`M${mid - 25} 18H${mid + 25}M${mid} 18V${cy}`} stroke="#8e9b8b" strokeWidth="2" />
      <path d={`M${mid - 1} 30V${cy}M${mid + 1} 30V${cy}`} stroke="#c5c8b4" strokeWidth=".7" />
      <text x={mid + 14} y="53">
        {tr('细丝', 'Fibre')}
      </text>
      {big.map((a, i) => {
        const b = P(a.x, a.y);
        return (
          <g key={i}>
            <ellipse cx={b.x + 2} cy={b.y + 13} rx={17} ry="5" fill="#b6bfac" opacity=".5" />
            <circle
              cx={b.x}
              cy={b.y}
              r={scale * a.radius}
              data-large-mass={a.id}
              data-model-x={a.x}
              data-model-y={a.y}
              data-model-radius={a.radius}
              fill={`url(#${uid}-mass)`}
              stroke="#61796b"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
      {small.flatMap((a, i) =>
        big.map((b, j) => {
          const p = P(a.x, a.y),
            d = P(b.x, b.y),
            len = Math.hypot(d.x - p.x, d.y - p.y);
          return (
            <Arrow
              key={`${i}-${j}`}
              x={p.x}
              y={p.y}
              dx={((d.x - p.x) / len) * (i === j ? 19 : 28)}
              dy={((d.y - p.y) / len) * (i === j ? 19 : 28)}
              color={i === j ? C.gold : C.muted}
              dashed={i !== j}
            />
          );
        }),
      )}
      <path
        d={`M${P(small[0]!.x, small[0]!.y).x} ${P(small[0]!.x, small[0]!.y).y}L${P(small[1]!.x, small[1]!.y).x} ${P(small[1]!.x, small[1]!.y).y}`}
        stroke="#6c8072"
        strokeWidth="4"
      />
      {small.map((a, i) => {
        const p = P(a.x, a.y);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={scale * a.radius}
            data-small-mass={a.id}
            data-model-x={a.x}
            data-model-y={a.y}
            data-model-radius={a.radius}
            fill="#b78450"
            stroke="#7f6345"
          />
        );
      })}
      <path
        data-torsion-mirror={theta}
        d={`M${mid - 10 * Math.cos(mirror)} ${cy - 18 + 10 * Math.sin(mirror)}L${mid + 10 * Math.cos(mirror)} ${cy - 18 - 10 * Math.sin(mirror)}`}
        stroke="#748f88"
        strokeWidth="4"
      />
      {Math.abs(restoring) > 0.01 && (
        <g>
          <path
            d={Array.from({ length: 30 }, (_, i) => {
              const a = -0.15 + (side * Math.min(1.4, Math.abs(restoring)) * 1.3 * i) / 29;
              return `${i ? 'L' : 'M'}${mid + 32 * Math.cos(a)} ${cy + 32 * Math.sin(a) * sy}`;
            }).join(' ')}
            fill="none"
            stroke={C.blue}
            strokeWidth="2"
            data-restoring-torque={restoring}
          />
          <Arrow
            x={mid + 32 * Math.cos(restoringEnd) + 7 * side * Math.sin(restoringEnd)}
            y={cy + 32 * Math.sin(restoringEnd) - 7 * side * Math.cos(restoringEnd)}
            dx={-7 * side * Math.sin(restoringEnd)}
            dy={7 * side * Math.cos(restoringEnd)}
            color={C.blue}
          />
        </g>
      )}
      <text x={mid} y={h - 14} textAnchor="middle">
        {tr('四对受力 · 箭头仅示方向', 'Four pairs · arrows show direction')}
      </text>
    </svg>
  );
}
function OpticalView({
  width,
  compact,
  theta,
  scope = 'model',
  result,
}: {
  width: number;
  compact: boolean;
  theta: number;
  scope?: string;
  result?: string;
}) {
  const h = compact ? 218 : 290,
    optical = torsionOpticalLever(theta),
    mx = width * 0.24,
    my = compact ? 83 : 110,
    sx = width * 0.83,
    scale = (sx - mx) / optical.L,
    spotY = my - optical.screen.y * scale,
    tangent = { x: -optical.normal.y, y: optical.normal.x },
    rulerY = compact ? (result ? 158 : 177) : result ? 213 : 232,
    extent = scope === 'comparison' ? 0.025 : 0.12,
    insetScale = (width - 56) / (2 * extent),
    rulerX = width / 2 + optical.screen.y * insetScale;
  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      style={{ height: h }}
      data-optical-theta={optical.theta}
      data-optical-distance={optical.L}
      data-optical-screen-m={optical.screen.y}
      role="img"
      aria-label={tr(
        '镜面真实转角决定反射光路和远处光点，下面单独放大刻度尺',
        'Actual mirror rotation determines the ray and screen spot; the ruler detail below is separately enlarged',
      )}
    >
      <rect x={mx - 11} y="13" width="22" height="25" rx="5" fill="#aebdb0" stroke="#688174" />
      <path d={`M${mx - 7} 18v14`} stroke="#d6dfd3" strokeWidth="3" />
      <circle cx={mx} cy="38" r="2" fill={C.gold} />
      <path
        d={`M${mx} ${my}V${my + 18}M${mx - 22 * Math.cos(theta)} ${my + 18 + 22 * Math.sin(theta)}L${mx + 22 * Math.cos(theta)} ${my + 18 - 22 * Math.sin(theta)}`}
        stroke="#9aab9c"
        strokeWidth="3"
      />
      <circle cx={mx} cy={my + 18} r="4" fill="#7d9486" />

      <path data-optical-part="incoming" d={`M${mx} 38V${my}`} stroke={C.gold} strokeWidth="2" />
      <path
        data-optical-part="mirror"
        d={`M${mx - tangent.x * 15} ${my + tangent.y * 15}L${mx + tangent.x * 15} ${my - tangent.y * 15}`}
        stroke="#7e9e97"
        strokeWidth="5"
      />
      <path
        data-optical-part="reflected"
        d={`M${mx} ${my}L${sx} ${spotY}`}
        stroke={C.gold}
        strokeWidth="2"
      />
      <path
        data-optical-part="screen"
        d={`M${sx} ${my - 27}V${my + 27}`}
        stroke="#9b9e87"
        strokeWidth="5"
      />
      <circle data-optical-part="spot" cx={sx} cy={spotY} r="4" fill={C.gold} />
      <path d={`M${mx} ${my}H${sx}`} stroke={C.muted} strokeDasharray="2 4" />
      <text x={(mx + sx) / 2} y={my + 29} textAnchor="middle">
        L = 2.435 m
      </text>
      {!result && (
        <text x={width / 2} y={my + 52} textAnchor="middle">
          θ {(theta * 1000).toFixed(1)} · 2θ {(theta * 2000).toFixed(1)} mrad
        </text>
      )}
      <text x={sx} y={my - 36} textAnchor="middle">
        {tr('屏', 'Screen')}
      </text>
      <text x={width / 2} y={rulerY - 22} textAnchor="middle">
        {tr('刻度尺局部放大 / mm', 'Enlarged ruler / mm')}
      </text>
      <path data-optical-part="ruler" d={`M28 ${rulerY}H${width - 28}`} stroke={C.muted} />
      {[-1, -0.5, 0, 0.5, 1]
        .map((f) => f * extent * 1000)
        .map((v) => (
          <g key={v}>
            <path d={`M${width / 2 + (v / 1000) * insetScale} ${rulerY}v7`} stroke={C.muted} />
            <text x={width / 2 + (v / 1000) * insetScale} y={rulerY + 26} textAnchor="middle">
              {v}
            </text>
          </g>
        ))}
      <path
        data-optical-part="ruler-spot"
        data-scale={insetScale}
        d={`M${rulerX} ${rulerY - 11}v15`}
        stroke={C.gold}
        strokeWidth="3"
      />
      {result && (
        <text x={width / 2} y={h - 7} textAnchor="middle">
          {result}
        </text>
      )}
      {scope === 'comparison' && (
        <circle
          cx={
            width / 2 + torsionOpticalLever(publishedTorsionInference().theta).screen.y * insetScale
          }
          cy={rulerY - 3}
          r="4"
          fill="none"
          stroke={C.blue}
        />
      )}
    </svg>
  );
}
function PublishedPlot({
  width,
  compact,
  run,
  calibration = false,
}: {
  width: number;
  compact: boolean;
  run: number;
  calibration?: boolean;
}) {
  const h = compact ? 218 : 290,
    left = 40,
    right = width - 17,
    top = 37,
    bottom = h - 42;
  const data = useMemo(() => TORSION_OBSERVATIONS.filter((p) => p.run === run), [run]);
  const start = Math.floor(data[0]!.timeMinutes / 5) * 5,
    end = Math.ceil(data[data.length - 1]!.timeMinutes / 5) * 5;
  const X = (t: number) => left + ((t - start) / (end - start)) * (right - left),
    Y = (v: number) => bottom - (v / 360) * (bottom - top);
  const marks = useMemo(
    () =>
      data
        .map((p) => {
          const x = X(p.timeMinutes),
            y = Y(p.positionMm),
            r = compact ? 0.8 : 1.25;
          return run % 2
            ? `M${x - r} ${y - r}h${2 * r}v${2 * r}h${-2 * r}Z`
            : `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
        })
        .join(' '),
    [data, width, compact],
  );
  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      style={{ height: h }}
      role="img"
      aria-label={tr(
        '原论文图5的固定光点位置记录，没有使用模型生成观测点',
        'Fixed laser-spot observations from published Figure5, not model-generated points',
      )}
    >
      <text x={left} y="20">
        {tr('光点位置 / mm', 'Spot position / mm')}
      </text>
      {[0, 150, 300].map((v) => (
        <g key={v}>
          <path d={`M${left} ${Y(v)}H${right}`} stroke="#d9dfd0" />
          <text x={left - 8} y={Y(v) + 5} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {[start, (start + end) / 2, end].map((t) => (
        <text key={t} x={X(t)} y={bottom + 24} textAnchor="middle">
          {t.toFixed(0)}
        </text>
      ))}
      {TORSION_FITTED_EQUILIBRIA.map((line, i) => (
        <path
          key={line.sourcePathIndex}
          data-published-fit={line.sourcePathIndex}
          d={`M${left} ${Y(line.positionMm)}H${right}`}
          stroke={i ? C.blue : C.green}
          strokeDasharray={i ? '2 4' : '6 4'}
          strokeWidth="1.2"
        />
      ))}
      <path
        data-published-observations={run}
        data-point-count={data.length}
        d={marks}
        fill="none"
        stroke={run % 2 ? C.blue : C.ink}
        strokeWidth={compact ? 0.65 : 1}
      />
      <text x={(left + right) / 2} y={h - 7} textAnchor="middle">
        {tr('时间 / min', 'Time / min')}
      </text>
      {calibration && (
        <text x={right} y="20" textAnchor="end">
          T ≈ 4.85 min
        </text>
      )}
    </svg>
  );
}
function RecordView({
  width,
  compact,
  shot,
  reveal = true,
  run = 0,
}: {
  width: number;
  compact: boolean;
  shot: string;
  reveal?: boolean;
  run?: number;
}) {
  const h = compact ? 218 : 290,
    mid = width / 2,
    inference = publishedTorsionInference();
  if (shot === 'fit-shift') {
    const Y = (v: number) => 45 + ((180 - v) / 35) * (h - 87),
      x = width * 0.7;
    const [first, second] = TORSION_FITTED_EQUILIBRIA;
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '原图发表的两条拟合平衡线，保留独立的18.7毫米间距',
          'Two published fitted equilibrium lines retain their independent18.7millimetre separation',
        )}
      >
        <text x={mid} y="23" textAnchor="middle">
          {tr('拟合位置 / mm', 'Fitted position / mm')}
        </text>
        {TORSION_FITTED_EQUILIBRIA.map((line, i) => (
          <g key={line.sourcePathIndex} data-fixed-fit={line.sourcePathIndex}>
            <path
              d={`M35 ${Y(line.positionMm)}H${width - 25}`}
              stroke={i ? C.blue : C.green}
              strokeDasharray={i ? '2 4' : '6 4'}
            />
            <text x="40" y={Y(line.positionMm) - 9}>
              {i ? 'S₂' : 'S₁'} = {line.positionMm.toFixed(1)}
            </text>
          </g>
        ))}
        <path
          d={`M${x} ${Y(first!.positionMm)}V${Y(second!.positionMm)}m-5 0h10M${x - 5} ${Y(first!.positionMm)}h10`}
          stroke={C.gold}
          fill="none"
        />
        <text x={mid} y={h - 7} textAnchor="middle">
          ΔS ≈ 18.7 mm
        </text>
      </svg>
    );
  }
  if (shot === 'inverse')
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '从发表的位移和振动校准反求G，明确采用近邻恒力矩近似',
          'Infer G from published displacement and calibration under the nearest-pair constant-torque approximation',
        )}
      >
        <text x={mid} y="34" textAnchor="middle">
          ΔS = 1.87 ± 0.14 cm
        </text>
        <path d={`M${mid} 48v16m-5-5 5 5 5-5`} stroke={C.muted} fill="none" />
        <text x={mid} y="91" textAnchor="middle">
          θ₀ ≈ ΔS / 4L
        </text>
        <text x={mid} y="132" textAnchor="middle">
          κθ₀ ≈ 2d · GMm / b²
        </text>
        <text x={mid} y="181" textAnchor="middle" fill={C.gold} data-inferred-g-visible={reveal}>
          {reveal ? 'G ≈ (6.5 ± 0.5) × 10⁻¹¹' : 'G = ?'}
        </text>
        <text x={mid} y={compact ? 211 : 238} textAnchor="middle">
          N·m²/kg²
        </text>
      </svg>
    );
  if (shot === 'calibration')
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '发表拟合的周期和衰减共同给出恢复系数除以惯量',
          'Published fitted period and decay give restoring stiffness per inertia',
        )}
      >
        <text x={mid} y="33" textAnchor="middle">
          T = {inference.period.toFixed(1)} s
        </text>
        <text x={mid} y="70" textAnchor="middle">
          τ = 1068.6 s
        </text>
        <path d={`M${mid - 90} 92H${mid + 90}`} stroke="#c7d1be" />
        <text x={mid} y="124" textAnchor="middle">
          κ / I = ω² + 1/τ²
        </text>
        <text x={mid} y="166" textAnchor="middle">
          {inference.frequencySquared.toPrecision(4)} s⁻²
        </text>
        <text x={mid} y="205" textAnchor="middle">
          {tr('论文的恒力矩近似', 'Paper: constant-torque model')}
        </text>
      </svg>
    );
  return <PublishedPlot width={width} compact={compact} run={run} />;
}

function OrbitView({
  width = 340,
  compact = false,
  value = 0.5,
  speed = 7.73,
}: {
  width?: number;
  compact?: boolean;
  value?: number;
  speed?: number;
}) {
  const orbit = useMemo(() => cannonOrbit(speed), [speed]),
    h = compact ? 218 : 290,
    cy = compact ? 102 : 130,
    mid = width / 2,
    scale = (compact ? 78 : 100) / Math.max(EARTH_RADIUS, ...orbit.points.map((p) => p.r)),
    P = (x: number, y: number) => ({ x: mid + x * scale, y: cy - y * scale }),
    index = Math.floor(clamp(value) * (orbit.points.length - 1)),
    point = orbit.points[index]!,
    a = P(point.x, point.y);
  const full = useMemo(() => path(orbit.points.map((p) => P(p.x, p.y))), [orbit, width, compact]);
  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      style={{ height: h }}
      role="img"
      aria-label={tr(
        '同一个中心引力模型下，水平发射可能落地或绕行',
        'One central-gravity model gives either surface impact or orbital motion',
      )}
      data-orbit-time={point.time}
      data-orbit-contact={orbit.hit && index === orbit.points.length - 1}
    >
      <circle cx={mid} cy={cy} r={EARTH_RADIUS * scale} fill="#a0bbb1" />
      <path d={full} stroke="#c4d0be" fill="none" />
      <path
        d={path(orbit.points.slice(0, index + 1).map((p) => P(p.x, p.y)))}
        stroke={C.gold}
        fill="none"
        strokeWidth="2.5"
      />
      <circle cx={a.x} cy={a.y} r="5" fill={C.gold} />
      <Arrow x={a.x} y={a.y} dx={(mid - a.x) * 0.3} dy={(cy - a.y) * 0.3} />
      <path
        d={`M${mid - 2} ${cy - (EARTH_RADIUS + 3e5) * scale}h14`}
        stroke="#8a8c70"
        strokeWidth="4"
      />
      <text x={mid} y={h - 15} textAnchor="middle">
        v₀ = {speed.toFixed(2)} km/s · 300 km
      </text>
    </svg>
  );
}
/** Export retained for covers and geometry review. Mode1 is the same real optical geometry. */
export function GravityArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  speed = 7.73,
  mass = 158,
  side = 1,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  speed?: number;
  mass?: number;
  side?: number;
}) {
  if (mode === 2) return <OrbitView value={value} speed={speed} />;
  if (mode === 1)
    return (
      <OpticalView
        width={340}
        compact={false}
        theta={torsionBalance(side, mass, clamp(value) * 6000).theta}
      />
    );
  return <MoonView width={340} compact={false} shot={phase ? 'compare' : 'prediction'} p={value} />;
}
export function GravityMeasurementsCoverArtwork() {
  const state = torsionBalance(1, 158, 500);
  return (
    <TorsionForces
      width={340}
      compact={false}
      theta={state.theta}
      side={1}
      restoring={state.theta / state.equilibrium}
      mass={158}
    />
  );
}
const ids = ['required-2-moon-earth-test', 'required-2-cavendish', 'required-2-newton-cannon'];
export default function GravityMeasurements() {
  const film = useShowcase(),
    { host, width, compact } = useSignalWidth(),
    [selected, setSelected] = useState(String(Math.max(0, ids.indexOf(film.variant ?? '')))),
    [modeChosen, setModeChosen] = useState(false),
    [progress, setProgress] = useState(0),
    [exponent, setExponent] = useState(2),
    [multiple, setMultiple] = useState(1),
    [side, setSide] = useState(1),
    [mass, setMass] = useState(158),
    [speed, setSpeed] = useState(7.73),
    [subview, setSubview] = useState('force'),
    [fibre, setFibre] = useState(1),
    [recordRun, setRecordRun] = useState('0');
  const manualMode = modeChosen
    ? Number(selected)
    : film.variant
      ? Math.max(0, ids.indexOf(film.variant))
      : Math.floor(film.chapter / 2);
  const ch = film.watch ? film.chapter : manualMode * 2,
    p = film.watch ? film.chapterProgress : progress,
    mode = film.watch ? Math.floor(ch / 2) : manualMode;
  const director = gravityMeasurementsDirector(
    ch,
    film.chapterTime,
    browserLocale() === 'en' ? 'en' : 'zh',
  );
  let shot = mode === 2 ? 'orbit' : mode === 1 ? subview : 'prediction';
  if (film.watch) shot = director.shot;
  else if (mode === 0)
    shot =
      p < 0.35
        ? 'prediction'
        : p < 0.65
          ? 'acceleration'
          : p < 0.85
            ? 'compare'
            : 'distance-answer';
  const effectiveSide = film.watch ? 1 : side,
    effectiveMass = film.watch ? 158 : mass;
  const time = film.watch ? director.torsionSeconds : p * 6000,
    mechanics = useMemo(
      () =>
        torsionBalance(
          effectiveSide,
          effectiveMass,
          mode === 1 && (shot === 'force' || shot === 'optical') ? time : 0,
        ),
      [effectiveSide, effectiveMass, time, mode, shot],
    ),
    transfer = calibratedFibreComparison(film.watch ? director.fibreFactor : fibre),
    velocity = film.watch ? (ch === 4 ? 4 : CIRCULAR_SPEED) : speed;
  const title =
    shot === 'surface'
      ? tr('先用地面自由落体作参照', 'Begin with surface free fall')
      : shot === 'prediction' || shot === 'lock'
        ? tr('预测，还未用轨道核对', 'A prediction, not yet checked')
        : shot === 'records'
          ? tr('距离与周期：另一条证据', 'Distance and period: another route')
          : shot === 'acceleration' || shot === 'tangent'
            ? tr('速度方向改变，需要加速度', 'Turning velocity needs acceleration')
            : shot === 'compare'
              ? tr('平方反比检验 · 差约1.16%', 'Square-law check · 1.16% apart')
              : shot.startsWith('distance')
                ? tr('离地心更远一倍，会怎样？', 'What if the distance doubles?')
                : shot === 'force'
                  ? tr('四对引力，让同一根杆扭转', 'Four pairs turn one suspended rod')
                  : shot === 'optical'
                    ? tr('镜面转角 → 同一束反射光', 'Mirror angle → one reflected beam')
                    : shot === 'published'
                      ? tr('发表观测 · 虚线为拟合', 'Observed points · dashed lines are fits')
                      : shot === 'fit-shift'
                        ? tr('两种位置，两个平衡点', 'Two positions, two equilibria')
                        : shot === 'calibration'
                          ? tr('先确定细丝的恢复作用', 'Calibrate the restoring action')
                          : shot === 'inverse'
                            ? tr('近邻两对近似：由读数反求G', 'Nearest-pair model: infer G')
                            : shot === 'fibre-question'
                              ? tr('细丝刚度加倍，G也会变吗？', 'Twice-stiff fibre: does G change?')
                              : shot === 'fibre-answer'
                                ? tr(
                                    '转角变小，校准后的G不变',
                                    'Less twist; calibrated G unchanged',
                                  )
                                : tr(
                                    '持续落下，是否撞上地表？',
                                    'Falling: does the path hit Earth?',
                                  );
  return (
    <section
      ref={host}
      className="gravitymeasure-lab"
      data-gravity-mode={mode}
      data-gravity-shot={shot}
      data-gravity-progress={p}
      data-model-time={time}
      data-evidence-revealed={
        film.watch
          ? ch === 0
            ? director.revealPrediction
            : ch === 1
              ? director.revealOrbital
              : director.revealG
          : true
      }
      data-angle={mechanics.theta}
      data-reference={JSON.stringify(MOON_REFERENCE)}
    >
      <div className="gravitymeasure-header">{title}</div>
      {mode === 0 ? (
        <MoonView
          width={width}
          compact={compact}
          shot={shot}
          p={film.watch ? director.motionProgress : p}
          reveal={!film.watch || (ch === 0 ? director.revealPrediction : director.revealOrbital)}
          exponent={film.watch ? 2 : exponent}
          multiple={film.watch ? 1 : multiple}
        />
      ) : mode === 2 ? (
        <OrbitView
          width={width}
          compact={compact}
          value={film.watch ? director.motionProgress : p}
          speed={velocity}
        />
      ) : shot === 'force' ? (
        <TorsionForces
          width={width}
          compact={compact}
          theta={mechanics.theta}
          side={effectiveSide}
          restoring={mechanics.equilibrium ? mechanics.theta / mechanics.equilibrium : 0}
          mass={effectiveMass}
        />
      ) : shot === 'optical' ? (
        <OpticalView width={width} compact={compact} theta={mechanics.theta} />
      ) : shot.startsWith('fibre') ? (
        <>
          <OpticalView
            width={width}
            compact={compact}
            theta={transfer.theta}
            scope="comparison"
            result={
              shot === 'fibre-question'
                ? 'κ → 2κ · θ → ?'
                : `κ ×${transfer.factor.toFixed(1)} · θ = ${(transfer.theta * 1000).toFixed(2)} mrad`
            }
          />
        </>
      ) : (
        <RecordView
          width={width}
          compact={compact}
          shot={shot}
          reveal={!film.watch || director.revealG}
          run={film.watch ? director.run : Number(recordRun)}
        />
      )}
      {!film.watch && (
        <div className="gravitymeasure-controls">
          {mode === 1 && shot === 'published' && (
            <Segments
              label={tr('固定记录段', 'Fixed record run')}
              value={recordRun}
              onChange={setRecordRun}
              options={[0, 1, 2, 3].map((i) => ({
                value: String(i),
                label: `${i + 1} · ${i % 2 ? 'S₂' : 'S₁'}`,
              }))}
            />
          )}

          <Segments
            label={tr('选择观察对象', 'Choose a system')}
            value={String(mode)}
            onChange={(v) => {
              setModeChosen(true);
              setSelected(v);
              setProgress(0);
            }}
            options={[
              { value: '0', label: tr('月地检验', 'Moon–Earth') },
              { value: '1', label: tr('扭秤', 'Torsion balance') },
              { value: '2', label: tr('绕地飞行', 'Orbital flight') },
            ]}
          />
          {mode === 1 && (
            <Segments
              label={tr('扭秤视图', 'Torsion view')}
              value={subview}
              onChange={setSubview}
              options={[
                { value: 'force', label: tr('受力', 'Forces') },
                { value: 'optical', label: tr('光路', 'Optical path') },
                { value: 'published', label: tr('发表记录', 'Published results') },
                { value: 'fit-shift', label: tr('平衡间距', 'Equilibrium shift') },
                { value: 'calibration', label: tr('校准', 'Calibration') },
                { value: 'inverse', label: tr('反求G', 'Infer G') },
                { value: 'fibre-answer', label: tr('换细丝', 'Change fibre') },
              ]}
            />
          )}
          {(mode !== 1 || shot === 'force' || shot === 'optical') && (
            <Range
              label={tr('观察进度', 'Observation progress')}
              value={progress}
              min={0}
              max={1}
              step={0.005}
              onChange={setProgress}
            />
          )}
          {mode === 0 && shot === 'prediction' && (
            <>
              <Segments
                label={tr('预测的距离指数', 'Prediction exponent')}
                value={String(exponent)}
                onChange={(v) => {
                  setExponent(Number(v));
                  setProgress(0);
                }}
                options={[
                  { value: '1', label: '1/r' },
                  { value: '2', label: '1/r²' },
                  { value: '3', label: '1/r³' },
                ]}
              />
              <Range
                label={tr('假想距离 / 月地距离', 'Hypothetical distance / lunar distance')}
                value={multiple}
                min={0.5}
                max={2}
                step={0.1}
                onChange={(v) => {
                  setMultiple(v);
                  setProgress(0);
                }}
              />
            </>
          )}
          {mode === 1 && (shot === 'force' || shot === 'optical') && (
            <>
              <Range
                label={tr('教学模型大球质量 / kg', 'Model attractor mass / kg')}
                value={mass}
                min={79}
                max={200}
                step={1}
                onChange={setMass}
              />
              <button
                type="button"
                onClick={() => {
                  setSide(-side);
                  setProgress(0);
                }}
              >
                {tr('对称换位，重新从静止释放', 'Swap sides; release again from rest')}
              </button>
            </>
          )}
          {shot === 'fibre-answer' && (
            <Range
              label={tr('细丝刚度倍数', 'Fibre stiffness factor')}
              value={fibre}
              min={0.5}
              max={2}
              step={0.1}
              onChange={setFibre}
            />
          )}
          {mode === 2 && (
            <Range
              label={tr('初速度 / km/s', 'Initial speed / km/s')}
              value={speed}
              min={0}
              max={10.5}
              step={0.01}
              onChange={setSpeed}
            />
          )}
          <details>
            <summary>{tr('数据、模型与近似', 'Data, models and approximations')}</summary>
            <p>
              {tr(
                '月球参考数据固定；四对受力是教学模型。发表实验的G计算采用论文近邻两对恒力矩近似，不能把两种模型混为一套精确反演。',
                'The lunar references stay fixed. Four-force dynamics are a teaching model. Published G uses the paper’s nearest-pair constant-torque approximation; these are different inference models.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
