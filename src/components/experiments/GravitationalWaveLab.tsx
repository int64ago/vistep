import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  weberResponse,
  binaryPulsar,
  interferometerStrain,
  michelsonReadout,
  returningFields,
  orbitalEnergyComparison,
  orbitalEnergySequence,
  barTrace,
  gravityShot,
  gravityDirector,
  gravityInitialMode,
  type BarSignal,
} from '../../models/gravitational-wave-lab';
import {
  PULSAR_OBSERVATIONS,
  PULSAR_PUBLISHED_GR,
  LIGO_H,
  LIGO_L,
  LIGO_HALIGNED,
  type GravityRecord,
} from '../../models/gravitational-wave-records';
import '../../styles/gravitational-wave-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#dfebe3',
  gold = '#e8c185',
  blue = '#94c7d3',
  faint = '#86a5a6';
const path = (points: readonly GravityRecord[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
const samples = (fn: (t: number) => GravityRecord, n = 180) =>
  path(Array.from({ length: n + 1 }, (_, i) => fn(i / n)));
function Text({
  x,
  y,
  children,
  anchor = 'start',
  color = ink,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize="16">
      {children}
    </text>
  );
}
function Energy({
  w,
  h,
  ratio,
  phase,
  chirp = false,
}: {
  w: number;
  h: number;
  ratio: number;
  phase: number;
  chirp?: boolean;
}) {
  const n = w < 560,
    e = orbitalEnergyComparison(ratio),
    cx = n ? w * 0.5 : w * 0.3,
    cy = h * 0.43,
    r = n ? 62 : 95,
    a = phase * 2 * Math.PI,
    x = Math.cos(a) * r * ratio,
    y = Math.sin(a) * r * ratio * 0.55;
  return (
    <>
      <ellipse
        cx={cx}
        cy={cy}
        rx={r}
        ry={r * 0.55}
        fill="none"
        stroke={faint}
        strokeDasharray="4 6"
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={r * ratio}
        ry={r * ratio * 0.55}
        fill="none"
        stroke={gold}
        strokeWidth="2"
      />
      <circle cx={cx + x} cy={cy - y} r="9" fill={gold} />
      <circle cx={cx - x} cy={cy + y} r="9" fill={blue} />
      <Text x={cx} y={cy - r * 0.55 - 17} anchor="middle">
        {tr('能量被带走', 'Energy radiates away')}
      </Text>
      <path
        d={`M ${cx + 12} ${cy + 7} Q ${cx + 40} ${cy + 24} ${cx + 67} ${cy + 15}`}
        fill="none"
        stroke={gold}
        strokeDasharray="3 4"
      />
      <Text
        x={n ? w / 2 : w * 0.72}
        y={n ? h - 72 : 95}
        anchor="middle"
      >{`a / a₀ = ${e.aRatio.toFixed(2)}`}</Text>
      <Text
        x={n ? w / 2 : w * 0.72}
        y={n ? h - 45 : 133}
        anchor="middle"
      >{`P / P₀ = ${e.periodRatio.toFixed(3)}`}</Text>
      <Text x={n ? w / 2 : w * 0.72} y={n ? h - 18 : 171} anchor="middle">
        {chirp
          ? `f / f₀ = ${e.frequencyRatio.toFixed(3)}`
          : `|E| / |E₀| = ${e.bindingMagnitudeRatio.toFixed(3)}`}
      </Text>
      {!n && (
        <Text x={w * 0.72} y={222} anchor="middle" color={faint}>
          {tr('等质量关系示例 · 非实时缩轨', 'Illustrative change, not real-time decay')}
        </Text>
      )}
    </>
  );
}
function BeamPaths({
  w,
  h,
  p,
  dx,
  dy,
  power,
  small = false,
}: {
  w: number;
  h: number;
  p: number;
  dx: number;
  dy: number;
  power: number;
  small?: boolean;
}) {
  const n = w < 560,
    bx = n ? w * 0.36 : w * 0.36,
    by = h * 0.57,
    left = 24,
    right = w - 28,
    top = 34,
    bottom = h - (small ? 30 : 48),
    sx = (dx / 66.5e-9) * 9,
    sy = (dy / 66.5e-9) * 9,
    rx = right + sx,
    ty = top - sy;
  const routes: GravityRecord[][] = [
    [
      [left, by],
      [bx, by],
      [rx, by],
      [bx, by],
      [bx, bottom],
    ],
    [
      [left, by],
      [bx, by],
      [bx, ty],
      [bx, by],
      [bx, bottom],
    ],
  ];
  const position = (points: GravityRecord[], t: number) => {
    const lengths = points
      .slice(1)
      .map((pt, i) => Math.hypot(pt[0] - points[i]![0], pt[1] - points[i]![1]));
    let distance = t * lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lengths.length; i++) {
      const l = lengths[i]!;
      if (distance <= l) {
        const a = points[i]!,
          b = points[i + 1]!;
        return [
          a[0] + ((b[0] - a[0]) * distance) / l,
          a[1] + ((b[1] - a[1]) * distance) / l,
        ] as const;
      }
      distance -= l;
    }
    return points.at(-1)!;
  };
  return (
    <>
      <path
        d={`M ${left} ${by} H ${rx} M ${bx} ${ty} V ${bottom}`}
        fill="none"
        stroke="#3d5c62"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {routes.map((r, j) => (
        <g key={j}>
          <path
            data-optical-route={j === 0 ? 'x' : 'y'}
            d={path(r)}
            fill="none"
            stroke={j ? blue : gold}
            strokeWidth="2"
          />
          {[0, 0.22, 0.44].map((offset) => {
            const [x, y] = position(r, (p * 2 + offset) % 1);
            return <circle key={offset} cx={x} cy={y} r="3.5" fill={j ? blue : gold} />;
          })}
        </g>
      ))}
      <rect x={left - 15} y={by - 11} width="22" height="22" rx="7" fill="#a8b7ab" />
      <g stroke="#dce9df" strokeWidth="4" strokeLinecap="round">
        <path
          data-optical-part="beam-splitter"
          d={`M ${bx - 12} ${by + 12} L ${bx + 12} ${by - 12}`}
        />
        <path data-optical-part="end-mirror-x" d={`M ${rx} ${by - 15} V ${by + 15}`} />
        <path data-optical-part="end-mirror-y" d={`M ${bx - 15} ${ty} H ${bx + 15}`} />
      </g>
      <rect
        data-optical-part="detector"
        x={bx - 15}
        y={bottom - 1}
        width="30"
        height="16"
        rx="5"
        fill={gold}
        fillOpacity={0.15 + power * 0.85}
        stroke={gold}
      />
      {!small && (
        <>
          <Text x={bx + 17} y={top + 14} color={blue}>
            y
          </Text>
          <Text x={rx - 12} y={by - 20} color={gold}>
            x
          </Text>
          <Text x={w / 2} y={h - 12} anchor="middle">
            {tr('分束 → 往返 → 合成', 'Split · return · combine')}
          </Text>
        </>
      )}
    </>
  );
}
export function GravitationalArtwork({
  mode = 0,
  phase = 0,
  value: inputValue = 0.5,
  chapterTime,
  frequency = 1660,
  common = true,
  width = 640,
  height = 340,
  watch = false,
  manualShot = 'auto',
  motionNm = 66.5,
  commonMotion = false,
  dark = false,
  signalKind,
  showLater = true,
  alignment = true,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  chapterTime?: number;
  frequency?: number;
  common?: boolean;
  width?: number;
  height?: number;
  watch?: boolean;
  manualShot?: string;
  motionNm?: number;
  commonMotion?: boolean;
  dark?: boolean;
  signalKind?: BarSignal;
  showLater?: boolean;
  alignment?: boolean;
}) {
  const w = width,
    h = height,
    n = w < 560,
    c = mode * 2 + phase,
    d =
      watch && chapterTime !== undefined
        ? gravityDirector(c, chapterTime, browserLocale())
        : gravityShot(c, inputValue),
    value = watch ? d.p : inputValue,
    shot = watch
      ? n && c === 4 && value >= 0.47 && value < 0.65
        ? 'paths'
        : d.shot
      : manualShot === 'auto'
        ? c === 3
          ? 'records'
          : c === 4
            ? 'phase'
            : d.shot
        : manualShot,
    f = watch ? d.frequency : frequency,
    bar = weberResponse(f),
    kind = watch ? d.barKind : (signalKind ?? (common ? 'common' : 'background')),
    binary = binaryPulsar(0, value * 3),
    real = shot === 'scale',
    displacement = watch ? d.displacementNm : motionNm,
    equal = watch ? d.common : commonMotion,
    arms = real
      ? interferometerStrain(1e-21)
      : {
          dx: (watch ? d.motionXNm : displacement) * 1e-9,
          dy: (watch ? d.motionYNm : equal ? displacement : -displacement) * 1e-9,
        },
    optical = michelsonReadout(arms.dx, arms.dy, dark ? 0 : Math.PI / 2),
    both = watch ? d.showBoth : true,
    align = watch ? d.alignmentProgress : alignment ? 1 : 0,
    observationsThrough = watch ? d.observationsThrough : showLater ? 2013 : 1992.5,
    published = watch ? d.publishedCurve : true;
  // Fixed official records and a fixed viewport need only one coordinate projection.
  // Playback changes endpoint visibility, never the data or the sampled path geometry.
  const sitePaths = useMemo(() => {
    const x0 = 38,
      x1 = w - 18,
      top = 43,
      bottom = h - 42,
      xx = (t: number) => x0 + ((t - 0.25) / 0.21) * (x1 - x0),
      yy = (v: number) => (top + bottom) / 2 - (v * (bottom - top)) / 2.6,
      project = (records: readonly GravityRecord[]) =>
        path(records.map(([x, y]) => [xx(x), yy(y)]));
    return {
      L: project(LIGO_L),
      H: project(LIGO_H),
      aligned: project(LIGO_HALIGNED.filter(([x]) => x >= 0.25 && x <= 0.46)),
    };
  }, [w, h]);
  let header: ReactNode;
  if (c === 0) header = `${f} Hz · ${(bar.amplitude * 1e15).toFixed(3)} fm`;
  else if (c === 1)
    header =
      kind === 'local'
        ? tr('教学信号 · 仅 A 受扰动', 'Synthetic · local at A')
        : kind === 'common'
          ? tr('教学信号 · A 与 B 共有', 'Synthetic · shared signal')
          : tr('教学信号 · 只剩背景', 'Synthetic · backgrounds');
  else if (c === 2)
    header = `${tr('射电脉冲间隔', 'Pulse interval')} ${binary.observedPulseMs.toFixed(3)} ms`;
  else if (c === 3)
    header =
      shot === 'energy'
        ? tr('能量损失 → 更紧的轨道', 'Energy loss → tighter orbit')
        : tr('原图记录 · 累计时移 / s', 'Published timing · shift / s');
  else if (c === 4)
    header = real
      ? tr('真实量级示例 · h = 10⁻²¹', 'Physical scale · h = 10⁻²¹')
      : watch && d.prediction
        ? tr('先预测：两臂等量变化呢？', 'Predict equal arm changes')
        : equal
          ? tr('两臂等量变化 · 差分为零', 'Equal changes → zero difference')
          : shot === 'paths'
            ? tr('简化干涉仪 · 完整往返光路', 'Light makes a round trip')
            : tr('教学位移 · 回程相位与读出', 'Round-trip phase → power');
  else
    header =
      shot === 'chirp'
        ? tr('旋近原理 · 与真实记录分开', 'Inspiral · separate model')
        : tr('GW150914 · 真实滤波记录', 'GW150914 · filtered observations');
  return (
    <div
      className="gw-evidence-art"
      data-gravity-chapter={c}
      data-gravity-shot={shot}
      data-optical-phase={c === 4 ? optical.phase : undefined}
      data-optical-power={c === 4 ? optical.power : undefined}
      data-record-until={c === 3 ? observationsThrough : undefined}
      data-alignment={c === 5 ? align : undefined}
    >
      <div className="gw-evidence-readout">{header}</div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '机械响应、脉冲星计时与光学读出',
          'Mechanical response, pulsar timing and optical readout',
        )}
      >
        {c === 0 &&
          (() => {
            const osc = (bar.amplitude / 7.5e-16) * Math.sin(value * Math.PI * 10),
              x = w * 0.17 - osc * 6,
              bw = w * 0.66 + osc * 12,
              y = n ? 28 : h * 0.22;
            return (
              <>
                <path
                  d={`M ${w * 0.32} 20 L ${x + bw * 0.25} ${y} M ${w * 0.68} 20 L ${x + bw * 0.75} ${y}`}
                  stroke={faint}
                  fill="none"
                />
                <rect x={x} y={y} width={bw} height="58" rx="24" fill="#94a9a5" stroke="#d5dfce" />
                <ellipse cx={x + 13} cy={y + 29} rx="13" ry="27" fill="#b7c6bc" />
                <rect x={w / 2 - 4} y={y + 1} width="8" height="56" rx="3" fill={gold} />
                <path
                  d={`M ${w / 2} ${y + 58} V ${y + 80} H ${w * 0.81} V ${y + 95}`}
                  stroke={gold}
                  fill="none"
                />
                <rect
                  x={w * 0.81 - 17}
                  y={y + 95}
                  width="34"
                  height="18"
                  rx="5"
                  fill={gold}
                  fillOpacity={0.25 + 0.7 * Math.abs(osc)}
                />
                <Text x={24} y={h - 83} color={faint}>
                  {tr('形变与响应放大', 'Magnified response')}
                </Text>
                <path d={`M 24 ${h - 48} H ${w - 24}`} stroke="#446268" />
                <path
                  d={samples((t) => [
                    24 + t * (w - 48),
                    h - 48 - 22 * (bar.amplitude / 7.5e-16) * Math.sin(t * 10 * Math.PI),
                  ])}
                  fill="none"
                  stroke={gold}
                  strokeWidth="2"
                />
                <Text x={w - 24} y={h - 13} anchor="end">
                  {tr('相同微弱驱动', 'Same weak drive')}
                </Text>
              </>
            );
          })()}
        {c === 1 && (
          <>
            {[0, 1].map((j) => {
              const y = h * (j ? 0.68 : 0.29);
              return (
                <g key={j}>
                  <Text x={18} y={y + 5} color={j ? blue : gold}>
                    {j ? 'B' : 'A'}
                  </Text>
                  <path d={`M 45 ${y} H ${w - 18}`} stroke="#49666d" />
                  <path
                    d={samples((t) => [
                      45 + t * (w - 63),
                      y - barTrace(t, j as 0 | 1, kind).total * (n ? 42 : 56),
                    ])}
                    fill="none"
                    stroke={j ? blue : gold}
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            <Text x={w / 2} y={h - 12} anchor="middle" color={faint}>
              {tr('相同背景 · 改变共同成分', 'Fixed backgrounds')}
            </Text>
          </>
        )}
        {c === 2 &&
          (() => {
            const cx = n ? 75 : w * 0.29,
              cy = n ? 66 : 82,
              R = n ? 78 : 116,
              a1 = (R * 1.3886) / 2.8284,
              a2 = (R * 1.4398) / 2.8284,
              obs = w - 35,
              bx = cx + binary.x * a1,
              by = cy - binary.y * a1,
              ph = binary.orbitPhase,
              top = n ? 130 : 202,
              bottom = h - 29,
              x0 = 42,
              x1 = w - 20,
              yy = (ms: number) => top + ((59.11 - ms) / 0.14) * (bottom - top);
            return (
              <>
                <ellipse
                  cx={cx - a1 * binary.e}
                  cy={cy}
                  rx={a1}
                  ry={a1 * Math.sqrt(1 - binary.e ** 2)}
                  stroke="#547781"
                  fill="none"
                />
                <ellipse
                  cx={cx + a2 * binary.e}
                  cy={cy}
                  rx={a2}
                  ry={a2 * Math.sqrt(1 - binary.e ** 2)}
                  stroke="#547781"
                  fill="none"
                />
                <circle cx={bx} cy={by} r="7" fill={gold} />
                <circle cx={cx - binary.x * a2} cy={cy + binary.y * a2} r="6" fill={blue} />
                <path
                  d={`M ${bx} ${by} L ${obs} ${cy}`}
                  stroke={gold}
                  strokeDasharray="3 6"
                  fill="none"
                />
                <path
                  d={`M ${obs - 14} ${cy - 14} Q ${obs + 3} ${cy - 4} ${obs + 11} ${cy + 15} Q ${obs - 15} ${cy + 22} ${obs - 14} ${cy - 14} M ${obs + 3} ${cy + 16} V ${cy + 37}`}
                  fill="#5e7e84"
                  stroke={ink}
                />
                <Text x={w / 2} y={n ? 116 : 165} anchor="middle">
                  {binary.recessionVelocity > 0
                    ? tr('远离 → 间隔变长', 'Receding → longer gaps')
                    : tr('靠近 → 间隔变短', 'Approaching → shorter gaps')}
                </Text>
                <path d={`M ${x0} ${top} V ${bottom} H ${x1}`} stroke={faint} fill="none" />
                <Text x={x0 - 5} y={yy(59.1) + 5} anchor="end">
                  59.1
                </Text>
                <Text x={x0 - 5} y={yy(59.0) + 5} anchor="end">
                  59.0
                </Text>
                <path
                  d={samples((t) => [x0 + t * (x1 - x0), yy(binaryPulsar(0, t).observedPulseMs)])}
                  fill="none"
                  stroke={gold}
                  strokeWidth="2"
                />
                <circle cx={x0 + ph * (x1 - x0)} cy={yy(binary.observedPulseMs)} r="4" fill={ink} />
                <Text x={w - 20} y={h - 7} anchor="end">
                  {tr('轨道相位', 'Orbital phase')}
                </Text>
              </>
            );
          })()}
        {(shot === 'energy' || shot === 'chirp') && (
          <Energy
            w={w}
            h={h}
            ratio={watch ? d.energyRatio : orbitalEnergySequence(value).aRatio}
            phase={watch ? d.energyTurns : orbitalEnergySequence(value).turns}
            chirp={shot === 'chirp'}
          />
        )}
        {c === 3 &&
          shot === 'records' &&
          (() => {
            const x0 = 42,
              x1 = w - 19,
              top = 42,
              bottom = h - 35,
              xx = (year: number) => x0 + ((year - 1974) / 40) * (x1 - x0),
              yy = (s: number) => top - (s / 66) * (bottom - top);
            return (
              <>
                <path
                  d={`M ${x0} ${top} V ${bottom} H ${x1} M ${x0} ${top} H ${x1}`}
                  stroke={faint}
                  fill="none"
                />
                {[0, -30, -60].map((v) => (
                  <g key={v}>
                    <Text x={x0 - 7} y={yy(v) + 5} anchor="end">
                      {v}
                    </Text>
                    <path d={`M ${x0} ${yy(v)} H ${x1}`} stroke="#36545c" />
                  </g>
                ))}
                {[1975, 1995, 2013].map((y) => (
                  <Text key={y} x={xx(y)} y={h - 11} anchor="middle">
                    {y}
                  </Text>
                ))}
                <Text x={w - 18} y={24} anchor="end" color={faint}>
                  {tr('零衰减参考', 'Zero-decay reference')}
                </Text>
                {published && (
                  <path
                    data-published-gr="true"
                    d={path(PULSAR_PUBLISHED_GR.map(([x, y]) => [xx(x), yy(y)]))}
                    stroke={gold}
                    fill="none"
                    strokeWidth="2"
                  />
                )}
                {PULSAR_OBSERVATIONS.filter(([x]) => x <= observationsThrough).map(([x, y], i) => (
                  <circle
                    data-fixed-observation={i}
                    key={x}
                    cx={xx(x)}
                    cy={yy(y)}
                    r={n ? 3.3 : 4}
                    fill={ink}
                  />
                ))}
                {published && (
                  <Text x={x0 + 14} y={h - 55} color={gold}>
                    {tr('已发表 GR 预测', 'Published GR curve')}
                  </Text>
                )}
                {!showLater && !watch && (
                  <Text x={w - 18} y={h - 54} anchor="end">
                    {tr('后段记录待揭示', 'Later records hidden')}
                  </Text>
                )}
              </>
            );
          })()}
        {c === 4 && shot === 'paths' && (
          <>
            <BeamPaths w={w} h={h} p={value} dx={arms.dx} dy={arms.dy} power={optical.power} />
            <Text x={w - 18} y={30} anchor="end">{`ΔP/P₀ = ${optical.deltaPower.toFixed(2)}`}</Text>
          </>
        )}
        {c === 4 &&
          shot === 'phase' &&
          (() => {
            const x0 = n ? 70 : w * 0.52,
              x1 = w - 18,
              pw = x1 - x0,
              base = n ? [34, 87, 147] : [76, 160, 244],
              gain = n ? 25 : 39;
            return (
              <>
                {!n && (
                  <g>
                    <BeamPaths
                      w={w * 0.44}
                      h={h - 40}
                      p={value}
                      dx={arms.dx}
                      dy={arms.dy}
                      power={optical.power}
                      small
                    />
                    <Text
                      x={w * 0.22}
                      y={h - 17}
                      anchor="middle"
                    >{`d = ${(optical.difference * 1e9).toFixed(1)} nm`}</Text>
                  </g>
                )}
                {[0, 1, 2].map((j) => (
                  <g key={j}>
                    <path d={`M ${x0} ${base[j]} H ${x1}`} stroke="#3e5d65" />
                    <path
                      d={samples((t) => {
                        const f = returningFields(t * Math.PI * 6, optical.phase, optical.bias);
                        return [
                          x0 + t * pw,
                          base[j]! - gain * (j === 0 ? f.x : j === 1 ? f.y : f.sum),
                        ];
                      })}
                      fill="none"
                      stroke={j === 0 ? gold : j === 1 ? blue : ink}
                      strokeWidth={j === 2 ? 2.5 : 1.8}
                    />
                    <Text
                      x={x0 - 9}
                      y={base[j]! + 5}
                      anchor="end"
                      color={j === 0 ? gold : j === 1 ? blue : ink}
                    >
                      {j === 0 ? 'x' : j === 1 ? 'y' : tr('合成', 'Sum')}
                    </Text>
                  </g>
                ))}
                <Text
                  x={n ? 16 : w * 0.52}
                  y={h - 17}
                >{`Δφ = ${(optical.phase / Math.PI).toFixed(2)}π`}</Text>
                <Text
                  x={w - 18}
                  y={h - 17}
                  anchor="end"
                >{`P/P₀ = ${optical.power.toFixed(2)}`}</Text>
                <rect
                  x={x1 - 8}
                  y={base[2]! - 13}
                  width="12"
                  height="26"
                  rx="4"
                  fill={gold}
                  fillOpacity={0.1 + 0.9 * optical.power}
                />
              </>
            );
          })()}
        {c === 4 && shot === 'scale' && (
          <>
            <g transform={`translate(${n ? 0 : 25} 0)`}>
              <BeamPaths
                w={n ? w : w * 0.46}
                h={n ? 115 : h - 30}
                p={value}
                dx={2e-18}
                dy={-2e-18}
                power={optical.power}
                small
              />
            </g>
            <Text x={n ? w / 2 : w * 0.73} y={n ? h - 76 : 90} anchor="middle">
              ΔL = 4 × 10⁻¹⁸ m
            </Text>
            <Text x={n ? w / 2 : w * 0.73} y={n ? h - 46 : 135} anchor="middle">
              Δφ = 4.72 × 10⁻¹¹ rad
            </Text>
            <Text x={n ? w / 2 : w * 0.73} y={n ? h - 16 : 180} anchor="middle">
              {tr('微小相位 → 微小读出', 'Tiny phase → tiny readout')}
            </Text>
            {!n && (
              <Text x={w * 0.73} y={228} anchor="middle" color={faint}>
                {tr('实际 LIGO 还需腔增强与校准', 'Real LIGO adds cavities and calibration')}
              </Text>
            )}
          </>
        )}
        {c === 5 &&
          shot === 'sites' &&
          (() => {
            const x0 = 38,
              x1 = w - 18,
              top = 43,
              bottom = h - 42,
              xx = (t: number) => x0 + ((t - 0.25) / 0.21) * (x1 - x0),
              yy = (v: number) => (top + bottom) / 2 - (v * (bottom - top)) / 2.6;
            return (
              <>
                <Text x={12} y={22} color={blue}>
                  L1
                </Text>
                <Text x={60} y={22} color={gold}>
                  {align === 0 ? 'H1' : tr('H1：−7 ms、反号', 'H1: −7 ms, inverted')}
                </Text>
                {[-1, 0, 1].map((v) => (
                  <g key={v}>
                    <path d={`M ${x0} ${yy(v)} H ${x1}`} stroke="#3c5d65" />
                    <Text x={x0 - 7} y={yy(v) + 5} anchor="end">
                      {v}
                    </Text>
                  </g>
                ))}
                <path
                  data-ligo-record="L"
                  d={sitePaths.L}
                  fill="none"
                  stroke={blue}
                  strokeWidth="1.4"
                />
                {both && (
                  <>
                    <path
                      data-ligo-record="H-original"
                      d={sitePaths.H}
                      fill="none"
                      stroke={gold}
                      strokeWidth="1.2"
                      opacity={0.82 * (1 - align)}
                    />
                    <path
                      data-ligo-record="H-aligned"
                      d={sitePaths.aligned}
                      fill="none"
                      stroke={gold}
                      strokeWidth="1.2"
                      opacity={0.82 * align}
                    />
                  </>
                )}
                {[0.25, 0.35, 0.45].map((t) => (
                  <Text key={t} x={xx(t)} y={h - 17} anchor="middle">
                    {t.toFixed(2)}
                  </Text>
                ))}
              </>
            );
          })()}
      </svg>
      <div className="gw-evidence-scale">
        {c === 4
          ? shot === 'scale'
            ? tr('简化读出 · 非完整 LIGO 响应', 'Simple model; real LIGO differs')
            : shot === 'paths'
              ? tr('4 km 光臂 · 光路简化', '4 km arms · simplified optics')
              : dark
                ? tr('暗端：功率不区分正负号', 'Dark port loses the sign')
                : tr('教学工作点 π/2 · 非 LIGO 实际偏置', 'Teaching bias, not LIGO’s')
          : c === 3 && shot === 'records'
            ? tr('点：原图观测；线：原图预测', 'Published points and GR curve')
            : c === 5 && shot === 'sites'
              ? tr('h / 10⁻²¹ · 时间 / s', 'h / 10⁻²¹ · time / s')
              : shot === 'energy' || shot === 'chirp'
                ? tr('比例示例 · 非实际实时缩轨', 'Illustrative orbit ratios')
                : c === 2
                  ? tr('轨道与多普勒示例 · 非实测记录', 'Illustrated orbit, not data')
                  : tr('教学响应 · 非历史探测数据', 'Magnified teaching response')}
      </div>
    </div>
  );
}
const names = [
  ['韦伯棒', 'Weber bar'],
  ['双星脉冲', 'Binary pulsar'],
  ['LIGO干涉仪', 'LIGO interferometer'],
];
export default function GravitationalWaveLab() {
  const film = useShowcase(),
    { host, width, compact } = useSignalWidth(),
    [selected, setSelected] = useState(gravityInitialMode(film.variant)),
    [manualPhase, setPhase] = useState(0),
    [manual, setManual] = useState(0.1),
    [freq, setFreq] = useState(1660),
    [kind, setKind] = useState<BarSignal>('common'),
    [motion, setMotion] = useState(66.5),
    [equal, setEqual] = useState(false),
    [dark, setDark] = useState(false),
    [later, setLater] = useState(false),
    [aligned, setAligned] = useState(false),
    [opticalView, setOpticalView] = useState('phase'),
    [pulsarView, setPulsarView] = useState('records'),
    [siteView, setSiteView] = useState('sites'),
    [short, setShort] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-height:700px)'),
      update = () => setShort(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : manualPhase,
    p = film.watch ? film.chapterProgress : manual,
    c = mode * 2 + phase,
    w = Math.min(800, width),
    h = compact ? (short ? 220 : 260) : 340;
  return (
    <div className="gw-evidence-lab" ref={host}>
      {!film.watch && (
        <div className="gw-evidence-controls">
          <div className="gw-evidence-options">
            {names.map((n, j) => (
              <button
                key={j}
                type="button"
                aria-pressed={mode === j}
                onClick={() => setSelected(j)}
              >
                {n[browserLocale() === 'en' ? 1 : 0]}
              </button>
            ))}
          </div>
          <div className="gw-evidence-options">
            {[0, 1].map((j) => (
              <button key={j} type="button" aria-pressed={phase === j} onClick={() => setPhase(j)}>
                {mode === 0
                  ? j
                    ? tr('两站对照', 'Two-detector comparison')
                    : tr('共振响应', 'Resonant response')
                  : mode === 1
                    ? j
                      ? tr('多年记录', 'Multiyear records')
                      : tr('脉冲计时', 'Pulse timing')
                    : j
                      ? tr('两站实测', 'Two-site records')
                      : tr('光学读出', 'Optical readout')}
              </button>
            ))}
          </div>
        </div>
      )}
      <GravitationalArtwork
        mode={mode}
        phase={phase}
        value={p}
        chapterTime={film.watch ? film.chapterTime : undefined}
        frequency={freq}
        width={w}
        height={h}
        watch={film.watch}
        signalKind={kind}
        motionNm={motion}
        commonMotion={equal}
        dark={dark}
        showLater={later}
        alignment={aligned}
        manualShot={
          !film.watch
            ? c === 3
              ? pulsarView
              : c === 4
                ? opticalView
                : c === 5
                  ? siteView
                  : 'auto'
            : 'auto'
        }
      />
      {!film.watch && (
        <div className="gw-evidence-controls">
          {(c === 0 ||
            c === 2 ||
            (c === 3 && pulsarView === 'energy') ||
            (c === 4 && opticalView === 'paths') ||
            (c === 5 && siteView === 'chirp')) && (
            <Range
              label={tr('观察进度', 'Observation progress')}
              value={manual}
              min={0}
              max={1}
              step={0.002}
              onChange={setManual}
            />
          )}
          {mode === 0 && (
            <>
              {phase === 0 && (
                <Range
                  label={tr('驱动频率 / Hz', 'Drive frequency / Hz')}
                  value={freq}
                  min={1600}
                  max={1720}
                  step={1}
                  onChange={setFreq}
                />
              )}
              {phase === 1 && (
                <div className="gw-evidence-options">
                  {(['local', 'common', 'background'] as const).map((k) => (
                    <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
                      {k === 'local'
                        ? tr('仅 A 受扰动', 'Local at A')
                        : k === 'common'
                          ? tr('共同信号', 'Shared signal')
                          : tr('只看背景', 'Backgrounds')}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {c === 3 && (
            <div className="gw-evidence-options">
              <button
                aria-pressed={pulsarView === 'records'}
                onClick={() => setPulsarView('records')}
              >
                {tr('固定计时记录', 'Fixed timing records')}
              </button>
              <button
                aria-pressed={pulsarView === 'energy'}
                onClick={() => setPulsarView('energy')}
              >
                {tr('能量与轨道', 'Energy and orbit')}
              </button>
            </div>
          )}
          {c === 3 && pulsarView === 'records' && (
            <button aria-pressed={later} onClick={() => setLater(!later)}>
              {later
                ? tr('隐藏后段记录', 'Hide later records')
                : tr('揭示后段记录', 'Reveal later records')}
            </button>
          )}
          {c === 4 && (
            <>
              <div className="gw-evidence-options">
                {['paths', 'phase', 'scale'].map((v) => (
                  <button
                    key={v}
                    aria-pressed={opticalView === v}
                    onClick={() => setOpticalView(v)}
                  >
                    {v === 'paths'
                      ? tr('往返光路', 'Round-trip paths')
                      : v === 'phase'
                        ? tr('相位叠加', 'Phase sum')
                        : tr('真实量级', 'Physical scale')}
                  </button>
                ))}
              </div>
              {opticalView !== 'scale' && (
                <>
                  <Range
                    label={tr('教学单臂位移 / nm', 'Teaching arm motion / nm')}
                    value={motion}
                    min={-66.5}
                    max={66.5}
                    step={0.5}
                    onChange={setMotion}
                  />
                  <div className="gw-evidence-options">
                    <button aria-pressed={equal} onClick={() => setEqual(!equal)}>
                      {equal
                        ? tr('两臂同向', 'Common motion')
                        : tr('两臂反向', 'Differential motion')}
                    </button>
                    <button aria-pressed={dark} onClick={() => setDark(!dark)}>
                      {dark
                        ? tr('精确暗端', 'Exact dark port')
                        : tr('教学偏置 π/2', 'Teaching bias π/2')}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          {c === 5 && (
            <div className="gw-evidence-options">
              <button aria-pressed={siteView === 'sites'} onClick={() => setSiteView('sites')}>
                {tr('固定两站记录', 'Fixed site records')}
              </button>
              <button aria-pressed={siteView === 'chirp'} onClick={() => setSiteView('chirp')}>
                {tr('旋近原理模型', 'Inspiral model')}
              </button>
            </div>
          )}
          {c === 5 && siteView === 'sites' && (
            <button aria-pressed={aligned} onClick={() => setAligned(!aligned)}>
              {aligned
                ? tr('显示原始时间轴', 'Show original time axes')
                : tr('应用官方对齐变换', 'Apply official alignment')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function GravitationalCoverArtwork() {
  const optical = michelsonReadout(66.5e-9, -66.5e-9);
  return (
    <svg viewBox="0 0 640 340" role="img" aria-label="Round-trip interferometer paths">
      <defs>
        <radialGradient id="gw-cover-background">
          <stop stopColor="#294852" />
          <stop offset="1" stopColor="#142d36" />
        </radialGradient>
      </defs>
      <rect width="640" height="340" fill="url(#gw-cover-background)" />
      <BeamPaths w={640} h={340} p={0.29} dx={66.5e-9} dy={-66.5e-9} power={optical.power} small />
    </svg>
  );
}
