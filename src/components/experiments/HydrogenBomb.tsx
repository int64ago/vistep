import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import { Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import {
  BINDING_CURVE,
  CONFINEMENT_EXAMPLES,
  COULOMB_MEV_FM,
  DT_ALPHA_MEV,
  DT_BARRIER_MEV,
  DT_CONTACT_FM,
  DT_MEV_PER_NUCLEON,
  DT_NEUTRON_MEV,
  DT_Q_MEV,
  FISSION_MEV_PER_NUCLEON,
  FUSION_DEFAULT,
  FUSION_LIMITS,
  IGNITION_TRIPLE_PRODUCT,
  LI6_BREEDING_Q_MEV,
  REACTIVITY_RANGE_KEV,
  TEMPERATURES,
  approachSeparationFm,
  compressedFuel,
  coulombPotentialMeV,
  gamowIntegrand,
  gamowPeak,
  keVToKelvin,
  kelvinToKeV,
  maxwellEnergyDensity,
  maxwellTailFraction,
  reactivity,
  reactivityIsExtrapolated,
  tripleProduct,
  tunnellingProbability,
  turningPointFm,
  type FusionParameters,
  type FusionReaction,
} from '../../models/hydrogen-bomb';
import {
  hydrogenBombShot,
  type FusionShot,
  type FusionView,
} from '../../models/hydrogen-bomb-film';
import '../../styles/hydrogen-bomb.css';

const deuterium = '#8fd3ff',
  tritium = '#f7a1dc',
  helium = '#ffd27a',
  neutron = '#f2f4ff',
  hot = '#fff1d6',
  muted = '#a9a6d6',
  grid = '#5b5892';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const superscript = (n: number) =>
  (n < 0 ? '⁻' : '') + [...String(Math.abs(n))].map((d) => SUP[Number(d)]).join('');
/** 1.2×10⁸ style, language-neutral. */
export function sci(value: number, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  let mantissa = value / 10 ** exponent;
  let e = exponent;
  if (Number(mantissa.toFixed(digits)) >= 10) {
    mantissa /= 10;
    e += 1;
  }
  return `${mantissa.toFixed(digits)}×10${superscript(e)}`;
}
const kelvinLabel = (keV: number) => `${sci(keVToKelvin(keV), 1)} K`;
const keVLabel = (keV: number) =>
  keV >= 10
    ? `${keV.toFixed(0)} keV`
    : keV >= 1
      ? `${keV.toFixed(1)} keV`
      : keV >= 0.01
        ? `${keV.toFixed(2)} keV`
        : `${(keV * 1000).toFixed(2)} eV`;
const percent = (f: number) =>
  f >= 0.1 ? `${(f * 100).toFixed(0)}%` : f >= 0.001 ? `${(f * 100).toFixed(1)}%` : sci(f, 1);
const log = (v: number) => Math.log10(v);
const mult = (v: number) =>
  v >= 1e4 ? sci(v, 1) : v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '');
const burnLabel = (f: number) => (f < 1e-6 ? '≈ 0' : percent(f));

/** Footnote shown as wrapping HTML under the stage; SVG text cannot wrap on phones. */
export function fusionFootnote(
  view: FusionView,
  q: FusionParameters,
  shot: FusionShot,
  compact: boolean,
): string {
  switch (view) {
    case 'approach':
      return '横轴对数：1 fm 到 10⁷ fm';
    case 'distribution':
      return compact ? '虚线：隧穿概率；分布按峰值归一' : '分布形状已按峰值归一，不比较总核数';
    case 'rate':
      return reactivityIsExtrapolated(q.temperatureKeV)
        ? '当前温度在拟合范围之外，读数为外推'
        : '3000 K 的火焰远在左侧图外，反应率实际为零';
    case 'ignition':
      return shot.ignitionStep === 0
        ? '火焰的温度不够，反应率为零'
        : shot.ignitionStep === 1
          ? '裂变火球的辐射加热并压缩燃料'
          : '压缩后，同样的时间里烧掉更多';
    case 'fuel':
      return '快中子也能让周围的铀核裂变，再释放能量';
    case 'confinement':
      return '太阳靠引力与极慢的质子链，不按 D–T 点火线比较';
    default:
      return '';
  }
}
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};

function Arrow({
  from,
  to,
  stroke,
  width = 2,
  dashed = false,
  opacity = 1,
}: {
  from: [number, number];
  to: [number, number];
  stroke: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}) {
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    len = Math.hypot(dx, dy) || 1,
    ux = dx / len,
    uy = dy / len;
  return (
    <path
      d={`M${from[0]},${from[1]}L${to[0]},${to[1]}m${-ux * 8 - uy * 4.5},${-uy * 8 + ux * 4.5}L${to[0]},${to[1]}l${-ux * 8 + uy * 4.5},${-uy * 8 - ux * 4.5}`}
      stroke={stroke}
      strokeWidth={width}
      fill="none"
      strokeDasharray={dashed ? '4 5' : undefined}
      opacity={opacity}
      strokeLinecap="round"
    />
  );
}

function Nucleus({
  x,
  y,
  r,
  fill,
  glow,
  label,
  labelDy = 0,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  glow?: string;
  label?: string;
  labelDy?: number;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.9} fill={glow ?? fill} opacity=".16" />
      <circle cx={x} cy={y} r={r} fill={fill} />
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.32} fill="#fff" opacity=".55" />
      {label && (
        <text x={x} y={y + r + 19 + labelDy} textAnchor="middle" fill={fill}>
          {label}
        </text>
      )}
    </g>
  );
}

export type InstrumentProps = {
  parameters: FusionParameters;
  view: FusionView;
  width: number;
  shot: FusionShot;
  time: number;
};

export function FusionInstrument({ parameters: q, view, width, shot }: InstrumentProps) {
  const gradientId = useId();
  const compact = width < 600,
    height = compact ? 372 : 440,
    pad = compact ? 16 : 40;
  const T = q.temperatureKeV;

  const approach = () => {
    const railY = compact ? 60 : 62,
      top = compact ? 108 : 114,
      bottom = height - 66,
      left = pad + 8,
      right = width - pad - 8;
    const rMin = 1,
      rMax = 1e7;
    const x = (rFm: number) =>
      left + ((log(rFm) - log(rMin)) / (log(rMax) - log(rMin))) * (right - left);
    const energyKeV = 1.5 * T;
    // Keep the energy line in the lower third so the climb stays visible; the barrier top
    // (444 keV) then usually lies above the frame and is labelled as such.
    const eMax = Math.max(60, 3.2 * energyKeV);
    const y = (keV: number) => bottom - (Math.max(-60, keV) / eMax) * (bottom - top);
    const wellDepthPx = 34;
    const turning = turningPointFm(energyKeV);
    const rBall = approachSeparationFm(shot.approachPhase, energyKeV, rMax * 0.9);
    const regime =
      T < 0.01
        ? '化学火焰'
        : T < kelvinToKeV(TEMPERATURES.fissionFireballK)
          ? '太阳核心'
          : '一亿度以上';
    const rTop = Math.max(DT_CONTACT_FM, (COULOMB_MEV_FM * 1000) / eMax);
    const barrierInside = rTop <= DT_CONTACT_FM * (1 + 1e-9);
    const curve = Array.from({ length: 200 }, (_, i) => {
      const r = Math.exp(Math.log(rTop) + (Math.log(rMax) - Math.log(rTop)) * (i / 199));
      return `${i ? 'L' : 'M'}${x(r).toFixed(2)},${y(Math.min(eMax, coulombPotentialMeV(r) * 1000)).toFixed(2)}`;
    }).join('');
    const wellX = x(DT_CONTACT_FM),
      wellLeft = x(rMin);
    const ballY = y(Math.min(energyKeV, coulombPotentialMeV(rBall) * 1000));
    const P = tunnellingProbability(energyKeV);
    const dLabel = compact ? 8 : 10;
    const nearEnd = x(rBall) > right - 70;
    return (
      <g>
        <text x={left} y="20" className="hb-muted">
          {t('距离 r（对数）')}
        </text>
        <text x={right} y="20" textAnchor="end" fill={hot}>
          {compact ? kelvinLabel(T) : `${t(regime)} · ${kelvinLabel(T)}`}
        </text>
        <path d={`M${left},${railY}H${right}`} stroke={grid} strokeOpacity=".55" />
        <Nucleus x={x(rMin) + 2} y={railY} r={dLabel} fill={deuterium} />
        <text x={x(rMin) + 16} y={railY + 5} fill={deuterium}>
          D
        </text>
        <Nucleus x={x(rBall)} y={railY} r={dLabel} fill={tritium} />
        <text
          x={x(rBall) + (nearEnd ? -15 : 15)}
          y={railY + 5}
          textAnchor={nearEnd ? 'end' : 'start'}
          fill={tritium}
        >
          T
        </text>
        <text
          x={x(rBall)}
          y={railY - 16}
          textAnchor={nearEnd ? 'end' : x(rBall) < left + 60 ? 'start' : 'middle'}
          fill={tritium}
        >
          r ≈ {rBall >= 1e4 ? sci(rBall, 1) : rBall.toFixed(0)} fm
        </text>
        {/* Potential landscape */}
        <path
          d={`M${wellLeft},${y(0) + wellDepthPx}V${top}H${wellX}V${y(0) + wellDepthPx}Z`}
          fill="#2b2760"
          opacity=".55"
        />
        <path d={`M${wellLeft},${y(0)}H${right}`} stroke={grid} strokeOpacity=".4" />
        <path
          d={`M${wellLeft},${y(0) + wellDepthPx}H${wellX}V${barrierInside ? y(DT_BARRIER_MEV * 1000) : top}`}
          stroke="#c7b5ff"
          strokeWidth="2"
          fill="none"
        />
        {!barrierInside && (
          <path
            d={`M${wellX},${top}H${x(rTop)}`}
            stroke="#c7b5ff"
            strokeWidth="2"
            strokeDasharray="3 5"
            fill="none"
          />
        )}
        <path d={curve} stroke="#c7b5ff" strokeWidth="2.2" fill="none" />
        <text
          x={x(rTop) + 8}
          y={barrierInside ? y(DT_BARRIER_MEV * 1000) - 8 : top + 18}
          fill="#c7b5ff"
        >
          {t('势垒顶')} ≈ {(DT_BARRIER_MEV * 1000).toFixed(0)} keV
          {barrierInside || compact ? '' : t('，在图外上方')}
        </text>
        {!barrierInside && compact && (
          <text x={x(rTop) + 8} y={top + 40} fill="#c7b5ff">
            {t('在图外上方')}
          </text>
        )}
        {!compact && (
          <text x={wellLeft + 4} y={top + 18} className="hb-muted">
            {t('核力阱')}
          </text>
        )}
        {/* Energy line */}
        <path
          d={`M${x(turning)},${y(energyKeV)}H${right}`}
          stroke={hot}
          strokeDasharray="4 6"
          strokeOpacity=".7"
        />
        <text x={right} y={y(energyKeV) - 8} textAnchor="end" fill={hot}>
          E ≈ {keVLabel(energyKeV)}
        </text>
        {/* Turning point */}
        <path
          d={`M${x(turning)},${y(energyKeV) + 4}V${y(0) + 14}`}
          stroke={tritium}
          strokeDasharray="2 4"
          strokeOpacity=".8"
        />
        <text
          x={Math.min(x(turning), right - 130)}
          y={y(0) + 30}
          textAnchor="middle"
          fill={tritium}
        >
          {t('折返')} {turning >= 1e4 ? sci(turning, 1) : turning.toFixed(0)} fm
        </text>
        {/* Ball on the hill */}
        <circle cx={x(rBall)} cy={ballY} r="14" fill={tritium} opacity=".2" />
        <circle cx={x(rBall)} cy={ballY} r="7" fill={tritium} />
        {shot.tunnelReveal > 0 && (
          <g opacity={shot.tunnelReveal}>
            <Arrow
              from={[x(turning) - 4, y(energyKeV)]}
              to={[wellX + 4, y(energyKeV)]}
              stroke={hot}
              dashed
              opacity={0.8}
            />
            <circle
              cx={(wellLeft + wellX) / 2}
              cy={y(0) + wellDepthPx - 10}
              r="7"
              fill={tritium}
              opacity=".45"
            />
            <text x={Math.max(wellX + 8, left)} y={y(energyKeV) + 22} fill={hot}>
              {t('隧穿概率')} ≈ {sci(P, 1)}
            </text>
          </g>
        )}
      </g>
    );
  };

  const binding = () => {
    const top = 48,
      bottom = compact ? height - 118 : height - 48,
      left = pad + 34,
      right = compact ? width - pad - 6 : width - pad - 190;
    const x = (A: number) => left + (log(A) / log(260)) * (right - left);
    const y = (b: number) => bottom - (b / 9.2) * (bottom - top);
    const line = BINDING_CURVE.filter((n) => n.symbol !== '³He')
      .map((n, i) => `${i ? 'L' : 'M'}${x(n.A).toFixed(2)},${y(n.perNucleon).toFixed(2)}`)
      .join('');
    const pick = (s: string) => BINDING_CURVE.find((n) => n.symbol === s)!;
    const d = pick('²H'),
      tr = pick('³H'),
      he = pick('⁴He'),
      fe = pick('⁵⁶Fe'),
      u = pick('²³⁵U');
    const step = shot.bindingStep;
    const barsX = compact ? left : right + 30,
      barsY = compact ? bottom + 42 : top + 20,
      barW = compact ? right - left : 130;
    const bar = (label: string, value: number, color: string, i: number) => {
      const scale = barW / 4;
      const bx = barsX,
        by = compact ? barsY + i * 50 : barsY + i * 78;
      return (
        <g key={label} opacity={step >= 2 ? 1 : 0.15}>
          <text x={bx} y={by} fill={color}>
            {label}
            {compact ? ` · ${value.toFixed(2)} MeV / ${t('核子')}` : ''}
          </text>
          <rect
            x={bx}
            y={by + 10}
            width={value * scale}
            height="14"
            rx="7"
            fill={color}
            opacity=".85"
          />
          {!compact && (
            <text x={bx} y={by + 44} fill={hot}>
              {value.toFixed(2)} MeV / {t('核子')}
            </text>
          )}
        </g>
      );
    };
    return (
      <g>
        <text x={left} y="20" className="hb-muted">
          {t(compact ? 'B/A（MeV）' : '每个核子的结合能')}
        </text>
        <text x={right} y="20" textAnchor="end" className="hb-muted">
          {t(compact ? 'A（对数）' : '核子数 A（对数）')}
        </text>
        {[2, 4, 8, 16, 56, 235].map((A) => (
          <text key={A} x={x(A)} y={bottom + 20} textAnchor="middle" className="hb-muted">
            {A}
          </text>
        ))}
        {[0, 3, 6, 9].map((b) => (
          <g key={b}>
            <path d={`M${left},${y(b)}H${right}`} stroke={grid} strokeOpacity=".35" />
            <text x={left - 8} y={y(b) + 5} textAnchor="end" className="hb-muted">
              {b}
            </text>
          </g>
        ))}
        <path d={line} stroke="#c7b5ff" strokeWidth="2" fill="none" opacity=".9" />
        {BINDING_CURVE.map((n) => (
          <circle
            key={n.symbol}
            cx={x(n.A)}
            cy={y(n.perNucleon)}
            r="3"
            fill="#c7b5ff"
            opacity=".7"
          />
        ))}
        <text x={x(fe.A)} y={y(fe.perNucleon) - 10} textAnchor="middle" className="hb-muted">
          ⁵⁶Fe
        </text>
        <text x={x(u.A)} y={y(u.perNucleon) + 22} textAnchor="middle" className="hb-muted">
          ²³⁵U
        </text>
        {step >= 1 && (
          <g>
            <Arrow
              from={[x(d.A), y(d.perNucleon) - 8]}
              to={[x(he.A) - 6, y(he.perNucleon) + 10]}
              stroke={deuterium}
            />
            <Arrow
              from={[x(tr.A), y(tr.perNucleon) - 8]}
              to={[x(he.A) - 2, y(he.perNucleon) + 12]}
              stroke={tritium}
            />
            <text x={x(he.A) + 14} y={y(he.perNucleon) + 30} fill={hot}>
              {t('放出')} {DT_Q_MEV.toFixed(1)} MeV
            </text>
          </g>
        )}
        <Nucleus x={x(d.A)} y={y(d.perNucleon)} r={7} fill={deuterium} label="D" labelDy={-2} />
        <Nucleus x={x(tr.A)} y={y(tr.perNucleon)} r={8} fill={tritium} label="T" labelDy={-2} />
        <Nucleus x={x(he.A)} y={y(he.perNucleon)} r={9} fill={helium} label="⁴He" labelDy={-46} />
        {bar(t('聚变 D + T'), DT_MEV_PER_NUCLEON, helium, 0)}
        {bar(t('裂变 ²³⁵U'), FISSION_MEV_PER_NUCLEON, '#c9a8ff', 1)}
      </g>
    );
  };

  const distribution = () => {
    const top = 40,
      bottom = height - 46,
      left = pad + 10,
      right = width - pad - (compact ? 10 : 46);
    const eMax = 100;
    const x = (e: number) => left + (e / eMax) * (right - left);
    const yLin = (v: number) => bottom - v * (bottom - top);
    const logMin = -12;
    const yLog = (p: number) =>
      bottom - ((Math.max(logMin, log(p)) - logMin) / -logMin) * (bottom - top);
    const samples = 240;
    const energies = Array.from({ length: samples }, (_, i) => (i / (samples - 1)) * eMax);
    const needle = T < 0.05;
    const maxwell = energies.map((e) => maxwellEnergyDensity(e, T));
    const maxwellPeak = Math.max(...maxwell, 1e-300);
    const maxwellPath = energies
      .map(
        (e, i) => `${i ? 'L' : 'M'}${x(e).toFixed(2)},${yLin(maxwell[i] / maxwellPeak).toFixed(2)}`,
      )
      .join('');
    const tunnelPath = energies
      .map(
        (e, i) =>
          `${i ? 'L' : 'M'}${x(e).toFixed(2)},${yLog(tunnellingProbability(Math.max(e, 0.2))).toFixed(2)}`,
      )
      .join('');
    const product = energies.map((e) => gamowIntegrand(e, T));
    const productPeak = Math.max(...product, 1e-300);
    const productPath = energies
      .map(
        (e, i) =>
          `${i ? 'L' : 'M'}${x(e).toFixed(2)},${yLin((product[i] / productPeak) * 0.8).toFixed(2)}`,
      )
      .join('');
    const peak = gamowPeak(T);
    const tail = maxwellTailFraction(peak.energyKeV, T);
    return (
      <g>
        <defs>
          <linearGradient id={`${gradientId}-m`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={tritium} stopOpacity=".5" />
            <stop offset="1" stopColor={tritium} stopOpacity="0" />
          </linearGradient>
        </defs>
        <text x={left} y="20" fill={tritium}>
          {t(compact ? '相对动能分布' : '核对的相对动能分布')}
        </text>
        <text x={right} y="20" textAnchor="end" fill={tritium}>
          {kelvinLabel(T)}
        </text>
        {!compact && (
          <text x={right} y="42" textAnchor="end" fill="#c7b5ff" opacity={shot.showTunnelling}>
            {t('隧穿概率（右轴，对数）')}
          </text>
        )}
        {(compact ? [0, 50, 100] : [0, 25, 50, 75, 100]).map((e) => (
          <g key={e}>
            <path d={`M${x(e)},${top}V${bottom}`} stroke={grid} strokeOpacity=".28" />
            <text
              x={x(e)}
              y={bottom + 20}
              textAnchor={e === 100 ? 'end' : 'middle'}
              className="hb-muted"
            >
              {e} keV
            </text>
          </g>
        ))}
        {[-12, -8, -4, 0].map((p) => (
          <text
            key={p}
            x={right + 6}
            y={yLog(10 ** p) + 5}
            fill="#c7b5ff"
            opacity={shot.showTunnelling * 0.9}
          >
            {compact ? '' : `10${superscript(p)}`}
          </text>
        ))}
        <path d={`M${left},${bottom}H${right}`} stroke={grid} strokeOpacity=".6" />
        {needle ? (
          <g>
            <path d={`M${x(0) + 1.5},${bottom}V${top}`} stroke={tritium} strokeWidth="3" />
            <text x={x(0) + 12} y={top + 18} fill={tritium}>
              {t('全部核对都在 0.01 keV 以下')}
            </text>
          </g>
        ) : (
          <g>
            <path
              d={`${maxwellPath}L${x(eMax)},${bottom}L${x(0)},${bottom}Z`}
              fill={`url(#${gradientId}-m)`}
            />
            <path d={maxwellPath} stroke={tritium} strokeWidth="2.2" fill="none" />
          </g>
        )}
        <g opacity={shot.showTunnelling}>
          <path d={tunnelPath} stroke="#c7b5ff" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        </g>
        <g opacity={shot.showProduct * (needle ? 0 : 1)}>
          <path d={productPath} stroke={hot} strokeWidth="2.6" fill="none" />
          <path
            d={`M${x(peak.energyKeV)},${yLin(0.8)}V${bottom}`}
            stroke={hot}
            strokeOpacity=".5"
            strokeDasharray="3 4"
          />
          <text x={Math.min(x(peak.energyKeV) + 8, right - 170)} y={top + 18} fill={hot}>
            {t('伽莫夫峰')} ≈ {peak.energyKeV.toFixed(0)} keV
          </text>
          <text
            x={Math.min(x(peak.energyKeV) + 8, right - 170)}
            y={top + 40}
            fill={hot}
            opacity=".85"
          >
            {t('高于此能量的核对')} {percent(tail)}
          </text>
        </g>
      </g>
    );
  };

  const rate = () => {
    const top = 36,
      bottom = compact ? height - 48 : height - 70,
      left = pad + 52,
      right = width - pad - 8;
    const [tMin, tMax] = REACTIVITY_RANGE_KEV;
    const x = (keV: number) =>
      left + ((log(keV) - log(tMin)) / (log(tMax) - log(tMin))) * (right - left);
    const yMin = -26,
      yMax = -15;
    const y = (v: number) =>
      bottom - ((Math.max(yMin, log(v)) - yMin) / (yMax - yMin)) * (bottom - top);
    const curve = (reaction: FusionReaction) =>
      Array.from({ length: 160 }, (_, i) => {
        const keV = Math.exp(Math.log(tMin) + (Math.log(tMax) - Math.log(tMin)) * (i / 159));
        return `${i ? 'L' : 'M'}${x(keV).toFixed(2)},${y(reactivity(keV, reaction)).toFixed(2)}`;
      }).join('');
    const clampedT = Math.max(tMin, Math.min(tMax, T));
    const sv = reactivity(T, q.reaction);
    const references = [
      { keV: kelvinToKeV(TEMPERATURES.sunCoreK), label: t('太阳核心') },
      { keV: kelvinToKeV(TEMPERATURES.fissionFireballK), label: '10⁸ K' },
    ];
    return (
      <g>
        <text x={left} y="20" className="hb-muted">
          ⟨σv⟩ cm³/s
        </text>
        <text x={right} y="20" textAnchor="end" className="hb-muted">
          {compact ? `${t('温度')} · keV` : t('温度（对数）')}
        </text>
        {[-25, -20, -15].map((p) => (
          <g key={p}>
            <path d={`M${left},${y(10 ** p)}H${right}`} stroke={grid} strokeOpacity=".35" />
            <text x={left - 8} y={y(10 ** p) + 5} textAnchor="end" className="hb-muted">
              10{superscript(p)}
            </text>
          </g>
        ))}
        {[0.2, 1, 10, 100].map((keV) => (
          <g key={keV}>
            <path d={`M${x(keV)},${top}V${bottom}`} stroke={grid} strokeOpacity=".28" />
            {(!compact || keV !== 0.2) && (
              <text
                x={x(keV)}
                y={bottom + 20}
                textAnchor={keV === 100 ? 'end' : keV === 0.2 ? 'start' : 'middle'}
                className="hb-muted"
              >
                {compact ? keV : `${keV} keV`}
              </text>
            )}
            {!compact && (
              <text
                x={x(keV)}
                y={bottom + 40}
                textAnchor={keV === 100 ? 'end' : keV === 0.2 ? 'start' : 'middle'}
                className="hb-muted"
              >
                {sci(keVToKelvin(keV), 1)} K
              </text>
            )}
          </g>
        ))}
        {references.map((ref, i) => (
          <g key={ref.label}>
            <path
              d={`M${x(ref.keV)},${top}V${bottom}`}
              stroke={hot}
              strokeOpacity=".35"
              strokeDasharray="3 5"
            />
            <text x={x(ref.keV) + 6} y={top + 16 + (compact ? i * 22 : 0)} fill={hot} opacity=".8">
              {ref.label}
            </text>
          </g>
        ))}
        <path
          d={curve('dd')}
          stroke="#c7b5ff"
          strokeWidth={q.reaction === 'dd' ? 2.6 : 1.4}
          fill="none"
          opacity={q.reaction === 'dd' ? 1 : 0.45}
        />
        <path
          d={curve('dt')}
          stroke={tritium}
          strokeWidth={q.reaction === 'dt' ? 2.6 : 1.4}
          fill="none"
          opacity={q.reaction === 'dt' ? 1 : 0.45}
        />
        <text x={x(0.7) + 12} y={y(reactivity(0.7, 'dt')) + 26} fill={tritium}>
          D + T
        </text>
        <text x={x(40)} y={y(reactivity(40, 'dd')) + 22} fill="#c7b5ff">
          D + D
        </text>
        <circle cx={x(clampedT)} cy={y(sv)} r="14" fill={hot} opacity=".22" />
        <circle cx={x(clampedT)} cy={y(sv)} r="6" fill={hot} />
      </g>
    );
  };

  const ignition = () => {
    const fuel = compressedFuel(q.compression, T);
    const base = compressedFuel(1, T);
    const ladderTop = compact ? 52 : 46,
      ladderBottom = compact ? 52 : height - 60,
      ladderX = compact ? pad + 8 : pad + 24,
      ladderRight = compact ? width - pad - 8 : ladderX;
    const kMin = 3,
      kMax = 9;
    const along = (k: number) =>
      compact
        ? ladderX + ((log(k) - kMin) / (kMax - kMin)) * (ladderRight - ladderX)
        : ladderBottom - ((log(k) - kMin) / (kMax - kMin)) * (ladderBottom - ladderTop);
    const marks = [
      { k: TEMPERATURES.chemicalFlameK, label: t('化学火焰') },
      { k: TEMPERATURES.sunCoreK, label: t('太阳核心') },
      { k: TEMPERATURES.fissionFireballK, label: t('裂变火球') },
    ];
    const currentK = keVToKelvin(T);
    const sphereCx = compact ? width * 0.28 : width * 0.52,
      sphereCy = compact ? 196 : height * 0.48,
      r0 = compact ? 54 : 90,
      radius = r0 / Math.cbrt(q.compression);
    const glowScale = Math.min(
      1,
      Math.max(0, (log(fuel.ratePerCm3 / Math.max(base.ratePerCm3, 1e-300)) + 0.5) / 6.5),
    );
    const barX = compact ? width * 0.56 : width * 0.72,
      barW = compact ? width - pad - 8 - width * 0.56 : width * 0.22,
      barY = compact ? 130 : height * 0.3;
    const burnY = compact ? 306 : barY + 112,
      burnX = compact ? pad + 8 : barX,
      burnW = compact ? width - 2 * pad - 16 : barW;
    const step = shot.ignitionStep;
    return (
      <g>
        <defs>
          <radialGradient id={`${gradientId}-s`}>
            <stop offset="0" stopColor={hot} />
            <stop offset=".45" stopColor={tritium} stopOpacity=".9" />
            <stop offset="1" stopColor="#5a3f9a" stopOpacity=".15" />
          </radialGradient>
        </defs>
        <text x={pad + 8} y="20" className="hb-muted">
          {t('温度（对数）')}
        </text>
        <text x={width - pad - 8} y="20" textAnchor="end" fill={hot}>
          {kelvinLabel(T)}
        </text>
        <path
          d={
            compact
              ? `M${ladderX},${ladderTop}H${ladderRight}`
              : `M${ladderX},${ladderTop}V${ladderBottom}`
          }
          stroke={grid}
          strokeOpacity=".7"
          strokeWidth="2"
        />
        {marks.map((m, i) => (
          <g key={m.label} opacity={step >= i || i < 2 ? 1 : 0.35}>
            {compact ? (
              <g>
                <path d={`M${along(m.k)},${ladderTop - 6}v12`} stroke={muted} />
                <text
                  x={i === 2 ? ladderRight : along(m.k)}
                  y={ladderTop + (i === 1 ? 52 : 30)}
                  textAnchor={i === 2 ? 'end' : i === 0 ? 'start' : 'middle'}
                  className="hb-muted"
                >
                  {m.label}
                </text>
              </g>
            ) : (
              <g>
                <path d={`M${ladderX - 6},${along(m.k)}h12`} stroke={muted} />
                <text x={ladderX + 14} y={along(m.k) + 5} className="hb-muted">
                  {m.label} · {sci(m.k, 1)} K
                </text>
              </g>
            )}
          </g>
        ))}
        {compact ? (
          <g>
            <circle cx={along(currentK)} cy={ladderTop} r="12" fill={hot} opacity=".25" />
            <circle cx={along(currentK)} cy={ladderTop} r="5" fill={hot} />
          </g>
        ) : (
          <g>
            <circle cx={ladderX} cy={along(currentK)} r="12" fill={hot} opacity=".25" />
            <circle cx={ladderX} cy={along(currentK)} r="5" fill={hot} />
          </g>
        )}
        {/* Fuel sphere */}
        <circle
          cx={sphereCx}
          cy={sphereCy}
          r={r0}
          stroke={grid}
          strokeDasharray="3 6"
          fill="none"
          opacity=".7"
        />
        <circle
          cx={sphereCx}
          cy={sphereCy}
          r={radius * 1.35}
          fill={`url(#${gradientId}-s)`}
          opacity={0.25 + 0.75 * glowScale}
        />
        <circle cx={sphereCx} cy={sphereCy} r={radius} fill="#d4c6ff" opacity={0.75} />
        <text
          x={sphereCx}
          y={sphereCy + r0 + (compact ? 24 : 46)}
          textAnchor="middle"
          className="hb-muted"
        >
          {t('同一团燃料')} · ×{mult(q.compression)}
        </text>
        {step >= 1 && !compact && (
          <g opacity={step >= 2 ? 1 : 0.9}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              const rr = r0 + 26;
              return (
                <Arrow
                  key={i}
                  from={[sphereCx + Math.cos(a) * rr, sphereCy + Math.sin(a) * rr]}
                  to={[
                    sphereCx + Math.cos(a) * (radius + 8),
                    sphereCy + Math.sin(a) * (radius + 8),
                  ]}
                  stroke={hot}
                  opacity={0.65}
                />
              );
            })}
          </g>
        )}
        {/* Readouts */}
        <g>
          <text x={barX} y={barY} className="hb-muted">
            {t('密度')}
          </text>
          <text x={barX} y={barY + 22} fill={hot}>
            ×{mult(q.compression)}
          </text>
          <text x={barX} y={barY + 56} className="hb-muted">
            {t('反应率 ∝ n²')}
          </text>
          <text x={barX} y={barY + 78} fill={hot}>
            ×{mult(q.compression ** 2)}
          </text>
          <text x={burnX} y={burnY} className="hb-muted">
            {t('飞散前烧掉')}
          </text>
          <text x={burnX + burnW} y={burnY} textAnchor="end" fill={helium}>
            {burnLabel(fuel.burn)}
          </text>
          <rect x={burnX} y={burnY + 10} width={burnW} height="12" rx="6" fill="#2b2760" />
          <rect
            x={burnX}
            y={burnY + 10}
            width={burnW * Math.min(1, fuel.burn)}
            height="12"
            rx="6"
            fill={helium}
          />
        </g>
      </g>
    );
  };

  const fuelChain = () => {
    const p = shot.fuelProgress;
    const cy = compact ? 170 : 200,
      colA = compact ? width * 0.16 : width * 0.13,
      colB = compact ? width * 0.5 : width * 0.42,
      colC = compact ? width * 0.84 : width * 0.72,
      rowGap = compact ? 60 : 78;
    const rN = compact ? 9 : 11;
    // Tracked neutron: emitted at the D–T star, travels to lithium, which then yields T + He.
    const star = [colB, cy] as [number, number],
      li = [colC, cy] as [number, number];
    const emitted = smooth((p - 0.12) / 0.32),
      nx = star[0] + (li[0] - star[0]) * emitted,
      ny = star[1] - 30 * Math.sin(Math.PI * emitted);
    const bred = smooth((p - 0.55) / 0.3);
    return (
      <g>
        <text x={pad + 8} y="20" className="hb-muted">
          {t('燃料里自带下一份氚')}
        </text>
        {/* Reactants */}
        <Nucleus x={colA} y={cy - rowGap / 2} r={rN} fill={deuterium} label="D" labelDy={-4} />
        <Nucleus x={colA} y={cy + rowGap / 2} r={rN + 1} fill={tritium} label="T" labelDy={-4} />
        <Arrow
          from={[colA + 24, cy - rowGap / 2]}
          to={[star[0] - 26, star[1] - 6]}
          stroke={deuterium}
          opacity={0.8}
        />
        <Arrow
          from={[colA + 24, cy + rowGap / 2]}
          to={[star[0] - 26, star[1] + 6]}
          stroke={tritium}
          opacity={0.8}
        />
        {/* Reaction */}
        <circle
          cx={star[0]}
          cy={star[1]}
          r={rN * 2.6}
          fill={hot}
          opacity={0.12 + 0.25 * Math.max(0, 1 - Math.abs(p - 0.12) * 6)}
        />
        <Nucleus
          x={star[0]}
          y={star[1] + rowGap * 0.9}
          r={rN + 2}
          fill={helium}
          label="⁴He"
          labelDy={-4}
        />
        <text x={star[0]} y={star[1] + rowGap * 0.9 + 44} textAnchor="middle" fill={helium}>
          {DT_ALPHA_MEV.toFixed(1)} MeV
        </text>
        {compact ? (
          <text x={pad + 8} y="46" fill={hot}>
            D + T → ⁴He + n · {DT_Q_MEV.toFixed(1)} MeV
          </text>
        ) : (
          <g>
            <text x={star[0]} y={star[1] - rowGap * 0.9} textAnchor="middle" fill={hot}>
              D + T → ⁴He + n
            </text>
            <text
              x={star[0]}
              y={star[1] - rowGap * 0.9 + 24}
              textAnchor="middle"
              fill={hot}
              opacity=".85"
            >
              {DT_Q_MEV.toFixed(1)} MeV
            </text>
          </g>
        )}
        {/* Neutron path */}
        <path
          d={`M${star[0]},${star[1]}Q${(star[0] + li[0]) / 2},${star[1] - 60} ${li[0]},${li[1]}`}
          stroke={neutron}
          strokeOpacity=".35"
          strokeDasharray="3 6"
          fill="none"
        />
        <g opacity={emitted > 0 ? 1 : 0.35}>
          <circle cx={nx} cy={ny} r={rN * 1.8} fill={neutron} opacity=".18" />
          <circle cx={nx} cy={ny} r={rN * 0.75} fill={neutron} />
          <text x={nx} y={emitted < 0.5 ? ny - 20 : ny + 30} textAnchor="middle" fill={neutron}>
            n · {DT_NEUTRON_MEV.toFixed(1)} MeV
          </text>
        </g>
        {/* Lithium */}
        <Nucleus
          x={li[0]}
          y={li[1]}
          r={rN + 3}
          fill="#b9b3ff"
          label="⁶Li"
          labelDy={-(2 * (rN + 3) + 27)}
        />
        <g opacity={bred}>
          <Nucleus
            x={li[0] - 26}
            y={li[1] + rowGap}
            r={rN + 1}
            fill={tritium}
            label="T"
            labelDy={-4}
          />
          <Nucleus
            x={li[0] + 26}
            y={li[1] + rowGap}
            r={rN + 2}
            fill={helium}
            label="⁴He"
            labelDy={-4}
          />
          {compact ? (
            <text x={width - pad - 8} y={height - 40} textAnchor="end" fill="#d6d0ff">
              n + ⁶Li → T + ⁴He · {LI6_BREEDING_Q_MEV.toFixed(2)} MeV
            </text>
          ) : (
            <g>
              <text x={li[0]} y={li[1] - rowGap * 0.9} textAnchor="middle" fill="#d6d0ff">
                n + ⁶Li → T + ⁴He
              </text>
              <text
                x={li[0]}
                y={li[1] - rowGap * 0.9 + 24}
                textAnchor="middle"
                fill="#d6d0ff"
                opacity=".85"
              >
                {LI6_BREEDING_Q_MEV.toFixed(2)} MeV
              </text>
            </g>
          )}
          <path
            d={`M${li[0] - 26},${li[1] + rowGap + 34}Q${(li[0] + colA) / 2},${cy + rowGap * 1.9} ${colA + 6},${cy + rowGap / 2 + 30}`}
            stroke={tritium}
            strokeDasharray="4 6"
            strokeOpacity=".7"
            fill="none"
          />
        </g>
      </g>
    );
  };

  const confinement = () => {
    const top = 36,
      bottom = height - 50,
      left = pad + 56,
      right = width - pad - 8;
    const nMin = 18,
      nMax = 34,
      tMin = -12,
      tMax = 18;
    const x = (n: number) => left + ((log(n) - nMin) / (nMax - nMin)) * (right - left);
    const y = (tau: number) => bottom - ((log(tau) - tMin) / (tMax - tMin)) * (bottom - top);
    const isoAt = 10; // keV reference for the drawn ignition line
    const nTau = IGNITION_TRIPLE_PRODUCT / isoAt;
    const lineEndN = nTau / 10 ** (tMin + 0.7);
    const line = `M${x(10 ** nMin)},${y(nTau / 10 ** nMin)}L${x(lineEndN)},${y(nTau / lineEndN)}`;
    const labels: Record<string, string> = {
      sun: t('太阳核心 · 引力，pp 链'),
      tokamak: t('托卡马克 · 磁场'),
      inertial: t('惯性约束 · 压缩'),
    };
    const order = ['tokamak', 'inertial', 'sun'] as const;
    return (
      <g>
        <text x={pad + 8} y="20" className="hb-muted">
          {t(compact ? 'τ（秒）' : '约束时间 τ（秒，对数）')}
        </text>
        <text x={right} y="20" textAnchor="end" className="hb-muted">
          {t(compact ? 'n（每立方米）' : '密度 n（每立方米，对数）')}
        </text>
        {[18, 22, 26, 30, 34].map((p) => (
          <g key={p}>
            <path d={`M${x(10 ** p)},${top}V${bottom}`} stroke={grid} strokeOpacity=".28" />
            {(!compact || p % 8 === 2) && (
              <text
                x={x(10 ** p)}
                y={bottom + 20}
                textAnchor={p === 34 ? 'end' : p === 18 ? 'start' : 'middle'}
                className="hb-muted"
              >
                10{superscript(p)}
              </text>
            )}
          </g>
        ))}
        {[-12, -6, 0, 6, 12, 18].map((p) => (
          <g key={p}>
            <path d={`M${left},${y(10 ** p)}H${right}`} stroke={grid} strokeOpacity=".28" />
            <text x={left - 8} y={y(10 ** p) + 5} textAnchor="end" className="hb-muted">
              10{superscript(p)}
            </text>
          </g>
        ))}
        <path d={line} stroke={hot} strokeOpacity=".7" strokeWidth="2" strokeDasharray="8 6" />
        <text
          x={x(compact ? 1e25 : 1e27) + 8}
          y={y(nTau / (compact ? 1e25 : 1e27)) - 12}
          fill={hot}
          opacity=".9"
          className="hb-halo"
        >
          {compact ? t('点火线 · 10 keV') : 'nTτ ≈ 3×10²¹ keV·s/m³ · 10 keV'}
        </text>
        {order.map((id, i) => {
          const point = CONFINEMENT_EXAMPLES.find((e) => e.id === id)!;
          const shown = shot.revealed > i;
          const px = x(point.densityPerM3),
            py = y(point.confinementS);
          const color = id === 'sun' ? helium : id === 'tokamak' ? deuterium : tritium;
          const anchor = id === 'sun' ? 'end' : id === 'inertial' ? 'end' : 'start';
          const lx = id === 'tokamak' ? px + 14 : px - 14;
          const ly = id === 'sun' ? py + 26 : py - 34;
          return (
            <g key={id} opacity={shown ? 1 : 0}>
              <circle cx={px} cy={py} r="14" fill={color} opacity=".22" />
              <circle cx={px} cy={py} r="6" fill={color} />
              <text x={lx} y={ly} textAnchor={anchor} fill={color} className="hb-halo">
                {labels[id]}
              </text>
              <text
                x={lx}
                y={ly + 22}
                textAnchor={anchor}
                className="hb-halo"

                fill={color}
                opacity=".85"
              >
                {keVLabel(point.temperatureKeV)} · nTτ{' '}
                {sci(
                  tripleProduct(point.densityPerM3, point.temperatureKeV, point.confinementS),
                  0,
                )}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="hb-instrument"
      role="img"
      aria-label={t('热核聚变仪器画面')}
      data-view={view}
    >
      {view === 'approach' && approach()}
      {view === 'binding' && binding()}
      {view === 'distribution' && distribution()}
      {view === 'rate' && rate()}
      {view === 'ignition' && ignition()}
      {view === 'fuel' && fuelChain()}
      {view === 'confinement' && confinement()}
    </svg>
  );
}

function LogRange({
  label,
  value,
  min,
  max,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const steps = 200;
  const position = Math.round(((log(value) - log(min)) / (log(max) - log(min))) * steps);
  return (
    <label className="control hb-log">
      <span className="control-top">
        <span>{label}</span>
        <output>{format(value)}</output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={0}
        max={steps}
        step={1}
        value={position}
        style={{ '--range-fill': `${(position / steps) * 100}%` } as CSSProperties}
        onChange={(e) =>
          onChange(10 ** (log(min) + ((log(max) - log(min)) * Number(e.target.value)) / steps))
        }
      />
    </label>
  );
}

const MANUAL_VIEWS: FusionView[] = [
  'approach',
  'binding',
  'distribution',
  'rate',
  'ignition',
  'fuel',
  'confinement',
];

export default function HydrogenBomb() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800),
    [manual, setManual] = useState<FusionParameters>({ ...FUSION_DEFAULT }),
    [mode, setMode] = useState<FusionView>('distribution');
  useEffect(() => {
    if (!host.current) return;
    const obs = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    obs.observe(host.current);
    return () => obs.disconnect();
  }, []);
  const shot = useMemo(
    () => hydrogenBombShot(film.chapter, film.chapterProgress),
    [film.chapter, film.chapterProgress],
  );
  const q = film.watch ? shot.parameters : manual;
  const view = film.watch ? shot.view : mode;
  const manualShot: FusionShot = {
    ...shot,
    view,
    parameters: q,
    attempt: 2,
    approachPhase: 0.5,
    tunnelReveal: 1,
    bindingStep: 2,
    showTunnelling: 1,
    showProduct: 1,
    ignitionStep: 2,
    fuelProgress: 1,
    revealed: 3,
  };
  const footnote = fusionFootnote(view, q, film.watch ? shot : manualShot, width < 600);
  const T = q.temperatureKeV,
    sv = reactivity(T, q.reaction),
    peak = gamowPeak(T, q.reaction),
    fuel = compressedFuel(q.compression, T);
  const set = <K extends keyof FusionParameters>(key: K, value: FusionParameters[K]) =>
    setManual((v) => ({ ...v, [key]: value }));
  const reading = () => {
    switch (view) {
      case 'approach':
        return (
          <>
            <span>
              {t('典型动能')} <b>{keVLabel(1.5 * T)}</b>
            </span>
            <span>
              {t('隧穿概率')} <b>{sci(tunnellingProbability(1.5 * T, q.reaction), 1)}</b>
            </span>
          </>
        );
      case 'binding':
        return (
          <>
            <span>
              D + T → ⁴He + n <b>{DT_Q_MEV.toFixed(2)} MeV</b>
            </span>
            <span>
              {t('每核子')} <b>{DT_MEV_PER_NUCLEON.toFixed(2)} MeV</b>
            </span>
          </>
        );
      case 'distribution':
        return (
          <>
            <span>
              {t('温度')} <b>{keVLabel(T)}</b>
            </span>
            <span>
              {t('伽莫夫峰')} <b>{keVLabel(peak.energyKeV)}</b>
            </span>
          </>
        );
      case 'rate':
        return (
          <>
            <span>
              {t('温度')} <b>{keVLabel(T)}</b>
            </span>
            <span>
              ⟨σv⟩ <b>{sci(sv, 2)} cm³/s</b>
            </span>
          </>
        );
      case 'ignition':
        return (
          <>
            <span>
              ρR <b>{fuel.rhoR.toFixed(2)} g/cm²</b>
            </span>
            <span>
              {t('飞散前烧掉')} <b>{burnLabel(fuel.burn)}</b>
            </span>
          </>
        );
      case 'fuel':
        return (
          <>
            <span>
              {t('中子带走')} <b>{DT_NEUTRON_MEV.toFixed(1)} MeV</b>
            </span>
            <span>
              n + ⁶Li <b>{LI6_BREEDING_Q_MEV.toFixed(2)} MeV</b>
            </span>
          </>
        );
      default:
        return (
          <span>
            {t('点火线')} <b>nTτ ≈ {sci(IGNITION_TRIPLE_PRODUCT, 0)} keV·s/m³</b>
          </span>
        );
    }
  };
  const context: Record<FusionView, string> = {
    approach: '两核都带正电，库仑力把它们推开',
    binding: '氦-4 绑得更紧，多出的能量被释放',
    distribution: '只有分布尾巴上的少数核对能穿过势垒',
    rate: '温度提高几倍，反应率提高几千倍',
    ignition: '只有裂变火球能提供这样的温度',
    fuel: '氘化锂在燃烧中补给自己的氚',
    confinement: '同一反应，三种留住高温的办法',
  };
  return (
    <section className="hb-study" data-watch={film.watch} data-view={view}>
      <div className="hb-heading">
        <span>THERMONUCLEAR FUSION</span>
        <b>{t('两个轻核，一道势垒')}</b>
      </div>
      <div className="hb-stage" ref={host}>
        <FusionInstrument
          parameters={q}
          view={view}
          width={width}
          shot={film.watch ? shot : manualShot}
          time={film.watch ? film.time : 0}
        />
      </div>
      {footnote && <p className="hb-footnote">{t(footnote)}</p>}
      <div className="hb-reading">{reading()}</div>
      <p className="hb-context">{t(context[view])}</p>
      {!film.watch && (
        <div className="hb-controls">
          <Segments
            label={t('聚变观察方式')}
            value={mode}
            onChange={setMode}
            options={MANUAL_VIEWS.map((v) => ({
              value: v,
              label: t(
                v === 'approach'
                  ? '势垒'
                  : v === 'binding'
                    ? '结合能'
                    : v === 'distribution'
                      ? '分布'
                      : v === 'rate'
                        ? '反应率'
                        : v === 'ignition'
                          ? '压缩'
                          : v === 'fuel'
                            ? '燃料'
                            : '约束',
              ),
            }))}
          />
          <Segments
            label={t('反应')}
            value={q.reaction}
            onChange={(reaction) => set('reaction', reaction)}
            options={[
              { value: 'dt', label: 'D + T' },
              { value: 'dd', label: 'D + D' },
            ]}
          />
          <LogRange
            label={t('温度')}
            value={T}
            min={FUSION_LIMITS.temperatureKeV[0]}
            max={FUSION_LIMITS.temperatureKeV[1]}
            onChange={(v) => set('temperatureKeV', v)}
            format={(v) => `${kelvinLabel(v)} · ${keVLabel(v)}`}
          />
          <LogRange
            label={t('压缩倍数')}
            value={q.compression}
            min={FUSION_LIMITS.compression[0]}
            max={FUSION_LIMITS.compression[1]}
            onChange={(v) => set('compression', v)}
            format={(v) => `×${mult(v)}`}
          />
          <button
            className="hb-reset"
            onClick={() => {
              setManual({ ...FUSION_DEFAULT });
              setMode('distribution');
            }}
          >
            {t('恢复初始条件')}
          </button>
          <details className="hb-notes">
            <summary>{t('聚变模型边界')}</summary>
            <p>
              {t(
                '反应率使用 Bosch–Hale 1992 拟合，有效范围 0.2–100 keV；更低温度按非共振形式外推，只表示数量级。势垒画面用裸库仑势加示意核力阱。',
              )}
            </p>
            <p>
              {t(
                '压缩画面固定同一团燃料的质量，燃烧比例 f = ρR/(ρR + H_B) 忽略自加热、辐射损失和点火过程；它说明密度与约束时间的作用，不描述任何装置。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
