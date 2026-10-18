import { useEffect, useId, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import { browserLocale } from '../../i18n';
import {
  pairEvidence,
  captureRecoil,
  captureTransmission,
  parityCounts,
  photonEvent,
  magneticTrack,
  spectrometerPair,
  ANTI_SIGMA_RECORD,
  antiSigmaReconstruction,
  ATLAS_RECORDS,
  ATLAS_BACKGROUND,
  ATLAS_TOTAL_FIT,
  atlasFitAt,
  atlasResiduals,
  TING_RECORDS,
  RICHTER_RECORDS,
  particleShot,
  particleFilmProgress,
  particleFilmPolarization,
  type ParticlePoint,
} from '../../models/particle-evidence';
import { finiteClamp } from '../../models/modern-labs';
import '../../styles/modern-labs.css';
import '../../styles/particle-evidence-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const path = (points: ParticlePoint[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
const ramp = (p: number, a: number, b: number) => finiteClamp((p - a) / (b - a), 0, 1);
const ink = '#dce7df',
  green = '#9bc6b4',
  gold = '#e8bd7a',
  dim = '#8ca7a8',
  blue = '#9dc9dd';
export function ParticleArtwork({
  mode = 0,
  phase = 0,
  value = 0.6,
  progress = 0.6,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  progress?: number;
  signal?: boolean;
}) {
  const pair = pairEvidence(0.5 + value * 3, 1.5),
    parity = parityCounts(value);
  if (mode === 0 || mode === 3 || mode === 5)
    return (
      <ParticleEvidenceArtwork
        chapter={mode * 2 + phase}
        progress={progress}
        width={340}
        height={276}
        beta={value * 0.6}
        field={0.9}
        fitTotal={true}
        neutralAnti={true}
      />
    );
  return (
    <svg
      className="modern-apparatus"
      viewBox="0 0 340 276"
      role="img"
      aria-label={tr(
        '粒子物理实验的观测、重建和对照',
        'Particle observations, reconstruction and comparisons',
      )}
    >
      {mode === 1 && (
        <>
          <rect x="24" y="43" width="49" height="38" rx="10" fill="#8ca28d" />
          <path d="M73 62H153M177 62H291" stroke="#bfad83" strokeWidth="3" />
          <rect x="151" y="27" width="27" height="76" rx="7" fill="#a3ad9b" />
          <rect x="286" y="35" width="28" height="55" rx="8" fill="#899f87" />
          <text x="38" y="118" fontSize="18" fill="#667e67">
            T = {pair.transmission.toFixed(2)}
          </text>
          {phase === 0 ? (
            <>
              <text x="29" y="163" fontSize="18" fill="#677e68">
                {tr('仅基线 / 额外吸收', 'Baseline / extra absorption')}
              </text>
              <rect x="33" y="181" width={270 * pair.baseline} height="21" rx="8" fill="#b7bba2" />
              <rect
                x="33"
                y="219"
                width={270 * pair.transmission}
                height="21"
                rx="8"
                fill="#97ad92"
              />
              <text x="29" y="270" fontSize="18" fill="#677e68">
                {tr('相对透射 · 示意模型', 'Transmission · model')}
              </text>
            </>
          ) : (
            <>
              {' '}
              <path d="M31 205H145" fill="none" stroke="#c1ad81" strokeWidth="2" />
              <circle cx="145" cy="205" r="13" fill="#a6b59b" />
              {pair.pairTerm > 0 ? (
                <>
                  <path
                    d="M145 205L282 165M145 205L282 245"
                    stroke="#a78c70"
                    fill="none"
                    strokeWidth="2"
                  />
                  <circle
                    cx={145 + progress * 120}
                    cy={205 - progress * (120 / 137) * 40}
                    r="4"
                    fill="#ab896b"
                  />
                  <circle
                    cx={145 + progress * 120}
                    cy={205 + progress * (120 / 137) * 40}
                    r="4"
                    fill="#879e91"
                  />
                  <text x="291" y="176" fontSize="18" fill="#8b755e">
                    e⁻
                  </text>
                  <text x="291" y="244" fontSize="18" fill="#6c8c7a">
                    e⁺
                  </text>
                </>
              ) : (
                <text x="174" y="210" fontSize="18" fill="#6c8068">
                  E &lt; 2mc²
                </text>
              )}
              <text x="28" y="270" fontSize="18" fill="#677e68">
                {tr('核场成对产生 · 后来解释', 'Nuclear-field pair creation')}
              </text>
            </>
          )}
        </>
      )}
      {mode === 2 && (
        <>
          <circle cx="105" cy="87" r="39" fill="none" stroke="#bbc9b0" />
          <circle cx="105" cy="87" r="17" fill="#9eb192" />
          <circle cx="144" cy="87" opacity={1 - progress} r="4" fill="#809b91" />
          <path d="M125 87H286" stroke="#8da996" strokeDasharray="5 5" strokeWidth="2" />
          <text x="278" y="75" fontSize="22" fill="#708a74">
            ν
          </text>
          <path d="M83 87H45" stroke="#ad9172" strokeWidth="3" />
          <text x="37" y="130" fontSize="18" fill="#698069">
            ⁷Be + e⁻ → ⁷Li + ν
          </text>
          <rect x="39" y="164" width="263" height="71" rx="15" fill="#e4eade" stroke="#a7b99e" />
          <circle cx="74" cy="198" r="8" fill="#9cb08f" />
          <path
            d={phase === 1 && value * 80 > captureRecoil() ? 'M82 198H148L118 205' : 'M82 198H258'}
            stroke="#baa37b"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M147 175V221M174 175V221"
            stroke="#9bac93"
            strokeWidth="3"
            strokeDasharray="3 3"
          />
          <rect x="266" y="180" width="18" height="36" rx="5" fill="#819d83" />
          <text x="41" y="264" fontSize="18" fill="#677f68">
            {phase === 0
              ? tr('反冲离子 → 计数', 'Recoil ion → Count')
              : `U = ${(value * 80).toFixed(1)} V · T = ${captureTransmission(value * 80).toFixed(2)}`}
          </text>
        </>
      )}
      {mode === 4 && (
        <>
          <rect x="62" y="26" width="99" height="216" rx="28" fill="#e1e9dc" stroke="#a4b89d" />
          <rect x="88" y="43" width="47" height="30" rx="9" fill="#839f82" />
          <rect x="88" y="195" width="47" height="30" rx="9" fill="#839f82" />
          {[95, 109, 123, 137, 151, 165].map((y) => (
            <ellipse
              key={y}
              cx="111"
              cy={y}
              rx="37"
              ry="8"
              fill="none"
              stroke="#b9ac86"
              strokeWidth="2"
            />
          ))}
          <rect x="98" y="112" width="27" height="44" rx="8" fill="#a7ba98" />
          <path
            d="M111 145V118M105 125L111 118L117 125"
            fill="none"
            stroke="#607f60"
            strokeWidth="2"
          />
          <path
            d="M111 108V79M111 160V188"
            stroke="#b69371"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {phase === 0 ? (
            <>
              {' '}
              <text x="191" y="74" fontSize="18" fill="#678267">
                I ↑
              </text>
              <text x="189" y="103" fontSize="18" fill="#678267">
                {tr('同向', 'Along')} {(parity.up * 100).toFixed(0)}%
              </text>
              <text x="189" y="175" fontSize="18" fill="#678267">
                {tr('反向', 'Opposite')} {(parity.down * 100).toFixed(0)}%
              </text>
              <rect x="188" y="114" width={115 * parity.up} height="17" rx="7" fill="#a3b696" />
              <rect x="188" y="186" width={115 * parity.down} height="17" rx="7" fill="#b4a07b" />
            </>
          ) : (
            <>
              <text x="186" y="67" fontSize="18" fill="#678267">
                {tr('原过程', 'Observed')}
              </text>
              <text x="186" y="101" fontSize="24" fill="#678267">
                I ↑ p ↓
              </text>
              <path d="M189 132H297" stroke="#c6cfbc" strokeDasharray="4 4" />
              <text x="186" y="168" fontSize="18" fill="#678267">
                {tr('空间反演', 'Parity image')}
              </text>
              <text x="186" y="202" fontSize="24" fill="#9b8668">
                I ↑ p ↑
              </text>
            </>
          )}
          <text x="39" y="270" fontSize="18" fill="#677e68">
            {tr('极化与计数分布', 'Polarization and counts')}
          </text>
        </>
      )}
    </svg>
  );
}
function Arrow({
  a,
  b,
  color = blue,
  dashed = false,
}: {
  a: ParticlePoint;
  b: ParticlePoint;
  color?: string;
  dashed?: boolean;
}) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x),
    length = Math.hypot(b.x - a.x, b.y - a.y),
    head = Math.min(7, length * 0.35);
  return (
    <g>
      <path
        d={path([a, b])}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeDasharray={dashed ? '5 5' : undefined}
      />
      {length > 1 && (
        <path
          d={path([
            { x: b.x - head * Math.cos(angle - 0.5), y: b.y - head * Math.sin(angle - 0.5) },
            b,
            { x: b.x - head * Math.cos(angle + 0.5), y: b.y - head * Math.sin(angle + 0.5) },
          ])}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
        />
      )}
    </g>
  );
}
function Label({
  x,
  y,
  children,
  color = ink,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize="16">
      {children}
    </text>
  );
}
function PhotonView({
  w,
  h,
  p,
  beta,
  shot,
}: {
  w: number;
  h: number;
  p: number;
  beta: number;
  shot: string;
}) {
  const state = photonEvent(beta),
    compact = w < 560,
    detector = shot === 'photons' || !compact,
    dw = compact ? w : w * 0.5,
    cx = dw / 2,
    cy = h * 0.48,
    r = Math.min(dw * 0.33, h * 0.34),
    theta = -Math.PI / 4,
    deposits = [
      { angle: theta, energy: state.e1, color: gold },
      { angle: theta + Math.PI, energy: state.e2, color: green },
    ],
    showLedger = shot !== 'photons',
    lx = compact ? w / 2 : w * 0.75;
  return (
    <g
      data-photon-mass={state.mass}
      data-photon-energy={state.energy}
      data-photon-momentum={state.momentumC}
    >
      {detector && (
        <g>
          <circle cx={cx} cy={cy} r={r * 0.63} fill="none" stroke="#3e5d66" />
          <circle cx={cx} cy={cy} r={r * 0.38} fill="none" stroke="#3e5d66" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12,
              b = a + Math.PI / 12 - 0.025;
            const pts = [
              { x: cx + r * 0.86 * Math.cos(a), y: cy + r * 0.86 * Math.sin(a) },
              { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) },
              { x: cx + r * Math.cos(b), y: cy + r * Math.sin(b) },
              { x: cx + r * 0.86 * Math.cos(b), y: cy + r * 0.86 * Math.sin(b) },
            ];
            return <path key={i} d={path(pts) + ' Z'} fill="#49666b" stroke="#233d47" />;
          })}
          <circle cx={cx} cy={cy} r="4" fill={ink} />
          {deposits.map((d, i) => {
            const end = {
                x: cx + r * 0.93 * Math.cos(d.angle),
                y: cy + r * 0.93 * Math.sin(d.angle),
              },
              travel = shot === 'photons' ? ramp(p, 0, 0.22) : 1;
            return (
              <g key={i}>
                <path
                  d={path([{ x: cx, y: cy }, end])}
                  fill="none"
                  stroke={d.color}
                  strokeDasharray="3 6"
                  opacity={travel >= 1 ? 0.6 : 0.2}
                />
                <circle
                  cx={cx + (end.x - cx) * travel}
                  cy={cy + (end.y - cy) * travel}
                  r="4"
                  fill={d.color}
                />
                {travel >= 1 && (
                  <circle
                    cx={end.x}
                    cy={end.y}
                    r={5 + Math.sqrt(d.energy) / 2}
                    fill={d.color}
                    opacity=".75"
                  />
                )}
              </g>
            );
          })}
          <Label x={cx} y={h - 31}>
            {state.e1.toFixed(1)} + {state.e2.toFixed(2)} GeV
          </Label>
          <Label x={cx} y={h - 9} color={dim}>
            {tr('量能器沉积 · 双光子示例', 'Calorimeter · example photons')}
          </Label>
        </g>
      )}
      {showLedger ? (
        <g>
          <Label x={lx} y={24}>
            {tr('能量与矢量动量一起算', 'Combine energy and momentum')}
          </Label>
          <Arrow
            a={{ x: lx, y: 63 }}
            b={{ x: lx + (state.e1 / 125) * (compact ? w * 0.35 : w * 0.18), y: 63 }}
            color={gold}
          />
          <Arrow
            a={{ x: lx, y: 92 }}
            b={{ x: lx - (state.e2 / 125) * (compact ? w * 0.35 : w * 0.18), y: 92 }}
            color={green}
          />
          <Label x={lx - (compact ? w * 0.42 : w * 0.18)} y={51} anchor="start" color={gold}>
            E₁ = {state.e1.toFixed(1)}
          </Label>
          <Label x={lx + (compact ? w * 0.42 : w * 0.18)} y={80} anchor="end" color={green}>
            E₂ = {state.e2.toFixed(1)}
          </Label>
          <Label x={lx} y={126}>
            ΣE = {state.energy.toFixed(2)} GeV
          </Label>
          <Label x={lx} y={151}>
            |Σpc| = {state.momentumC.toFixed(2)} GeV
          </Label>
          <Label x={lx} y={h - 48}>
            m = √(ΣE² − |Σpc|²) / c²
          </Label>
          <text x={lx} y={h - 18} textAnchor="middle" fill={gold} fontSize="23">
            {state.mass.toFixed(0)} GeV/c²
          </text>
        </g>
      ) : (
        !compact && (
          <g>
            <Label x={lx} y={h * 0.4}>
              {tr('只加能量，就得到质量？', 'Does energy sum give mass?')}
            </Label>
            <Label x={lx} y={h * 0.55} color={gold}>
              m = ?
            </Label>
            <Label x={lx} y={h * 0.7} color={dim}>
              {tr('先看两束动量是否抵消', 'First check momentum cancellation')}
            </Label>
          </g>
        )
      )}
    </g>
  );
}
function HiggsRecords({
  w,
  h,
  shot,
  total,
}: {
  w: number;
  h: number;
  shot: string;
  total: boolean;
}) {
  const residual = shot === 'residual',
    compare = shot === 'cms' || shot === 'cms-predict',
    left = 48,
    right = w - 17,
    top = 33,
    bottom = h - 49;
  if (compare) {
    const x = (m: number) => left + ((m - 120) / 10) * (right - left),
      y1 = h * 0.36,
      y2 = h * 0.65;
    return (
      <g data-fixed-source="reported-masses">
        <Label x={w / 2} y={23}>
          {tr('另一台探测器，也会出现吗？', 'Will another detector see it?')}
        </Label>
        <path d={`M ${left} ${bottom} H ${right}`} stroke={dim} />
        {[120, 125, 130].map((v) => (
          <Label key={v} x={x(v)} y={bottom + 23}>
            {v}
          </Label>
        ))}
        <Label x={14} y={y1} anchor="start">
          ATLAS
        </Label>
        <circle cx={x(126)} cy={y1 - 5} r="5" fill={gold} />
        <Label x={x(126)} y={y1 + 23}>
          126.0
        </Label>
        <Label x={14} y={y2} anchor="start">
          CMS
        </Label>
        {shot === 'cms' ? (
          <g data-cms-revealed="true">
            <circle cx={x(125.3)} cy={y2 - 5} r="5" fill={green} />
            <Label x={x(125.3)} y={y2 + 23}>
              125.3
            </Label>
          </g>
        ) : (
          <g data-cms-pending="true">
            <rect
              x={x(124)}
              y={y2 - 17}
              width={x(128) - x(124)}
              height="26"
              rx="12"
              fill="none"
              stroke={green}
              strokeDasharray="4 4"
            />
            <Label x={x(126)} y={y2 + 5}>
              ?
            </Label>
          </g>
        )}
        <Label x={w - 15} y={bottom - 9} anchor="end" color={dim}>
          GeV/c²
        </Label>
      </g>
    );
  }
  const lo = residual ? 110 : 100,
    hi = residual ? 140 : 160,
    x = (m: number) => left + ((m - lo) / (hi - lo)) * (right - left),
    y = (v: number) =>
      bottom - ((v - (residual ? -100 : 0)) / (residual ? 300 : 4000)) * (bottom - top);
  const records = residual
    ? atlasResiduals()
        .filter((r) => r.mass >= lo && r.mass <= hi)
        .map((r) => ({ mass: r.mass, events: r.residual }))
    : ATLAS_RECORDS;
  const curve = (total ? ATLAS_TOTAL_FIT : ATLAS_BACKGROUND)
    .filter((r) => r.mass >= lo && r.mass <= hi)
    .map((r) => ({ x: x(r.mass), y: y(r.events - (residual ? atlasFitAt(r.mass) : 0)) }));
  return (
    <g data-fixed-source="ATLAS-2012-fig4a">
      <Label x={w / 2} y={20}>
        {residual
          ? tr('ATLAS · 相对背景的差值', 'ATLAS · excess over background')
          : tr('ATLAS · 事件 / 2 GeV', 'ATLAS · events / 2 GeV')}
      </Label>
      {(residual ? [-100, 0, 100] : [0, 2000, 4000]).map((n) => (
        <g key={n}>
          <path d={`M ${left} ${y(n)} H ${right}`} stroke="#3d5962" />
          <Label x={left - 8} y={y(n) + 5} anchor="end" color={dim}>
            {n}
          </Label>
        </g>
      ))}
      <path
        d={path(curve)}
        fill="none"
        stroke={blue}
        strokeWidth="2"
        strokeDasharray={total ? undefined : '5 4'}
      />
      {records.map((r) => (
        <circle
          key={r.mass}
          data-fixed-mass={r.mass}
          data-fixed-value={r.events}
          cx={x(r.mass)}
          cy={y(r.events)}
          r="3.2"
          fill={gold}
        />
      ))}
      {[lo, (lo + hi) / 2, hi].map((n) => (
        <Label key={n} x={x(n)} y={h - 27}>
          {n}
        </Label>
      ))}
      <Label x={w / 2} y={h - 7} color={dim}>
        GeV/c²
      </Label>
    </g>
  );
}
function AntiTracks({ w, h, shot }: { w: number; h: number; shot: string }) {
  const a = antiSigmaReconstruction(),
    r = ANTI_SIGMA_RECORD;
  if (shot === 'curvature') {
    const A = { x: w * 0.58, y: h * 0.43 },
      scale = (w * 0.42) / 0.65,
      track = magneticTrack(1.104, 1.37, 1, -0.65),
      pts = track.points.map((p) => ({ x: A.x + p.x * scale, y: A.y + p.y * scale }));
    return (
      <g>
        <Label x={w / 2} y={23}>
          {tr('曲率方向判电荷 · B ⊙', 'Curvature identifies charge · B ⊙')}
        </Label>
        <path d={path(pts)} stroke={gold} strokeWidth="3" fill="none" />
        {pts
          .filter((_, i) => i % 5 === 0)
          .map((p, i) => (
            <circle key={i} {...{ cx: p.x, cy: p.y }} r="2.8" fill={gold} />
          ))}
        <Arrow a={{ x: A.x - 30, y: A.y }} b={{ x: A.x + 35, y: A.y }} />
        <Arrow a={{ x: A.x, y: A.y }} b={{ x: A.x, y: A.y + 45 }} color={green} />
        <Label x={A.x + 25} y={A.y - 17}>
          v
        </Label>
        <Label x={A.x + 25} y={A.y + 48}>
          F
        </Label>
        <Label x={w / 2} y={h - 64} color={gold}>
          {tr('母粒子：+e', 'Parent: +e')}
        </Label>
        <Label x={w / 2} y={h - 36}>
          {tr('实测曲率：1104 ± 600 MeV/c', 'Measured: 1104 ± 600 MeV/c')}
        </Label>
        <Label x={w / 2} y={h - 11} color={dim}>
          {tr('曲率原理示意 · 非原图比例', 'Curvature illustration')}
        </Label>
      </g>
    );
  }
  if (shot === 'missing' || shot === 'triangle') {
    const conditional = shot === 'triangle',
      pParent = conditional ? a.parentMomentum : r.measuredParentMomentum,
      scale = (w - 50) / 1900,
      A = { x: 25, y: h * 0.4 },
      P = { x: A.x + pParent * scale, y: A.y },
      pi = { x: A.x + a.pion.x * scale, y: A.y + a.pion.y * scale };
    return (
      <g>
        <Label x={w / 2} y={23}>
          {conditional
            ? tr('用实测 AB 方向重建', 'Reconstruct using measured AB')
            : tr('正电介子带不走全部动量', 'The pion leaves missing momentum')}
        </Label>
        {!conditional && (
          <path
            d={`M ${A.x + (pParent - r.parentUncertainty) * scale} ${A.y + 10} H ${A.x + (pParent + r.parentUncertainty) * scale}`}
            stroke={blue}
            strokeWidth="7"
            opacity=".22"
          />
        )}
        <Arrow a={A} b={P} />
        <Arrow a={A} b={pi} color={gold} />
        <Label x={pi.x + 8} y={pi.y - 12} color={gold}>
          π⁺
        </Label>
        <Arrow a={pi} b={P} color={green} dashed={!conditional} />
        <Label x={w / 2} y={h - 80}>
          {conditional ? 'pN ≈ 1629 MeV/c' : tr('虚线：缺失的动量', 'Dashed: missing momentum')}
        </Label>
        <Label x={w / 2} y={h - 53}>
          pπ = 244 ± 10 MeV/c
        </Label>
        <Label x={w / 2} y={h - 25} color={conditional ? gold : ink}>
          {conditional ? 'm ≈ 1183 MeV/c²' : '+1 = +1 + 0'}
        </Label>
      </g>
    );
  }
  const A = { x: w * 0.24, y: h * 0.45 },
    B = { x: w * 0.77, y: h * 0.45 + w * 0.53 * Math.tan((r.neutralAngleDegrees * Math.PI) / 180) },
    pionLength = Math.min(w * 0.4, (h * 0.22) / Math.sin((r.pionAngleDegrees * Math.PI) / 180)),
    pi = {
      x: A.x + pionLength * Math.cos((r.pionAngleDegrees * Math.PI) / 180),
      y: A.y - pionLength * Math.sin((r.pionAngleDegrees * Math.PI) / 180),
    };
  return (
    <g>
      <Label x={w / 2} y={22}>
        {tr('中性路径没有连续气泡', 'A neutral path leaves no bubble trail')}
      </Label>
      <path d={path([{ x: 18, y: A.y }, A, pi])} stroke={gold} strokeWidth="2" fill="none" />
      <path d={path([A, B])} stroke={green} strokeDasharray="5 5" fill="none" />
      <circle cx={A.x} cy={A.y} r="4" fill={ink} />
      {Array.from({ length: 6 }, (_, i) => {
        const t = (i * Math.PI) / 3;
        return (
          <path
            key={i}
            d={path([B, { x: B.x + 24 * Math.cos(t), y: B.y + 24 * Math.sin(t) }])}
            fill="none"
            stroke={i === 5 ? blue : gold}
          />
        );
      })}
      <Label x={A.x - 11} y={A.y + 24}>
        A
      </Label>
      <Label x={B.x} y={B.y + 45}>
        B
      </Label>
      <Label x={pi.x + 5} y={pi.y - 9} color={gold}>
        π⁺
      </Label>
      <Label x={(A.x + B.x) / 2} y={A.y + 50}>
        AB = 7.7 mm
      </Label>
      <Label x={w / 2} y={h - 34}>
        {tr('两个顶点之间：推断连线', 'Between A and B: inferred')}
      </Label>
      <Label x={w / 2} y={h - 10} color={dim}>
        {tr('局部拓扑 · 靶核残余未画', 'Target residue not shown')}
      </Label>
    </g>
  );
}
function AntiBudget({ w, h, anti }: { w: number; h: number; anti: boolean }) {
  const r = antiSigmaReconstruction(),
    left = 20,
    right = w - 20,
    scale = (right - left) / 3000,
    y1 = 75,
    y2 = 149;
  return (
    <g data-neutral-hypothesis={anti ? 'antineutron' : 'neutron'}>
      <Label x={w / 2} y={24}>
        {tr('B 顶点：能量从哪里来？', 'B: where does energy come from?')}
      </Label>
      <Label x={left} y={y1 - 12} anchor="start">
        {tr('产物已测下限', 'Measured product minimum')}
      </Label>
      <rect x={left} y={y1} width={r.minimumProductEnergy * scale} height="21" rx="7" fill={gold} />
      <Label x={right} y={y1 + 44} anchor="end">
        1483 ± 60 MeV
      </Label>
      <Label x={left} y={y2 - 12} anchor="start">
        {anti
          ? tr('反中子 + 核子静能', 'n̄ + nucleon: rest energy')
          : tr('普通中子的动能', 'Ordinary neutron kinetic energy')}
      </Label>
      <rect x={left} y={y2} width={r.neutralKinetic * scale} height="21" rx="7" fill={blue} />
      {anti && (
        <rect
          x={left + r.neutralKinetic * scale}
          y={y2}
          width={(r.annihilationAvailable - r.neutralKinetic) * scale}
          height="21"
          rx="6"
          fill={green}
        />
      )}
      <Label x={right} y={y2 + 44} anchor="end">
        {anti ? '941 + 1879 ≈ 2820' : '≈ 941'} MeV
      </Label>
      <Label x={w / 2} y={h - 9} color={anti ? green : gold}>
        {anti
          ? 'anti(Σ⁻) → n̄ + π⁺'
          : tr('中性和质量相同，还不足以区分', 'Charge and mass do not decide')}
      </Label>
    </g>
  );
}
function Spectrometer({
  w,
  h,
  field,
  shot,
}: {
  w: number;
  h: number;
  field: number;
  shot: string;
}) {
  const e = spectrometerPair(field),
    normal = spectrometerPair(1),
    compact = w < 560,
    plotWidth = compact ? w : w * 0.55,
    cy = h * (compact ? 0.43 : 0.48),
    s = Math.min(
      (plotWidth - 56) / 8,
      (h * (compact ? 0.18 : 0.27)) / Math.abs(spectrometerPair(1).electron.end.y),
    ),
    x0 = (plotWidth - normal.detectorX * s) / 2,
    lx = compact ? w / 2 : w * 0.77;
  return (
    <g data-spectrometer-field={e.electron.fieldT}>
      <Label x={w / 2} y={22}>
        {tr('同一示例电子对 · B ⊙', 'Same example pair · B ⊙')} {field.toFixed(2)} T
      </Label>
      {shot === 'field-test' && compact ? (
        <g data-detector-closeup="true">
          <Label x={w / 2} y={49} color={dim}>
            {tr('固定探测面 · 放大落点差', 'Fixed detector · enlarged hit shift')}
          </Label>
          <path d={`M ${w * 0.72} 61 V ${h * 0.64}`} stroke={ink} strokeWidth="5" />
          {[normal.electron, e.electron].map((track, i) => {
            const pts = track.points.slice(-5).map((p) => ({
              x: w * 0.72 + (p.x - 8) * 190,
              y: 83 + (p.y - normal.electron.end.y) * 190,
            }));
            return (
              <g key={i}>
                <path
                  d={path(pts)}
                  stroke={i ? green : dim}
                  strokeWidth="2"
                  strokeDasharray={i ? undefined : '4 4'}
                  fill="none"
                />
                <circle
                  cx={w * 0.72}
                  cy={83 + (track.end.y - normal.electron.end.y) * 190}
                  r="5"
                  fill={i ? green : 'none'}
                  stroke={i ? green : dim}
                />
              </g>
            );
          })}
          <Label x={w * 0.35} y={h * 0.61}>
            Δy = {((e.electron.end.y - normal.electron.end.y) * 100).toFixed(1)} cm
          </Label>
        </g>
      ) : (
        <g>
          <rect
            x="20"
            y="40"
            width={plotWidth - 40}
            height={h * (compact ? 0.59 : 0.78)}
            rx="20"
            fill="#29444e"
          />
          <path d={`M 5 ${cy} H ${x0}`} stroke={dim} strokeWidth="3" />
          <circle cx={x0} cy={cy} r="5" fill={gold} />
          <path
            data-fixed-detector-x={normal.detectorX}
            d={`M ${x0 + normal.detectorX * s + 2} ${cy - Math.abs(normal.electron.end.y) * s - 14} V ${cy + Math.abs(normal.electron.end.y) * s + 14}`}
            stroke={ink}
            strokeWidth="5"
          />
          {[e.electron, e.positron].map((track, i) => {
            const pts = track.points.map((p) => ({ x: x0 + p.x * s, y: cy + p.y * s })),
              end = pts.at(-1)!;
            return (
              <g key={i}>
                <path d={path(pts)} stroke={i ? gold : green} strokeWidth="2.5" fill="none" />
                {pts
                  .filter((_, j) => j % 8 === 0)
                  .map((p, j) => (
                    <circle key={j} cx={p.x} cy={p.y} r="2.3" fill={i ? gold : green} />
                  ))}
                <Label x={end.x - 18} y={end.y + (i ? 25 : -16)} color={i ? gold : green}>
                  {i ? 'e⁺' : 'e⁻'}
                </Label>
              </g>
            );
          })}
        </g>
      )}
      <Label x={lx} y={compact ? h - 57 : h * 0.35}>
        p = 0.2998 |q/e| Br
      </Label>
      <Label x={lx} y={compact ? h - 32 : h * 0.5}>
        p = {e.momentumEach.toFixed(0)} GeV/c · r ≈ {e.electron.radiusM!.toFixed(2)} m
      </Label>
      <Label x={lx} y={compact ? h - 9 : h * 0.65} color={gold}>
        m(e⁺e⁻) ≈ {e.mass.toFixed(1)} GeV/c²
      </Label>
    </g>
  );
}
function TingPlot({
  w,
  h,
  revealed,
  hatch,
}: {
  w: number;
  h: number;
  revealed: boolean;
  hatch: string;
}) {
  const left = 36,
    right = w - 16,
    top = 59,
    bottom = h - 49,
    x = (v: number) => left + ((v - 2.7) / 0.55) * (right - left),
    y = (v: number) => bottom - (v / 90) * (bottom - top),
    step = (key: 'shaded' | 'envelope') =>
      TING_RECORDS.map(
        (r, i) => `${i ? 'L' : 'M'} ${x(r.lo)} ${y(r[key])} L ${x(r.hi)} ${y(r[key])}`,
      ).join(' '),
    fill = step('shaded') + ` L ${x(3.25)} ${bottom} L ${x(2.7)} ${bottom} Z`;
  return (
    <g data-fixed-source="Ting-1976-fig12a" data-lower-field-revealed={revealed}>
      <Label x={w / 2} y={20}>
        {tr('历史记录 · 事件 / 25 MeV', 'Ting · events / 25 MeV')}
      </Label>
      {revealed ? (
        <>
          <Label x={w * 0.27} y={43} color={gold}>
            {tr('斜纹：原设定', 'Hatched: normal')}
          </Label>
          <Label x={w * 0.77} y={43} color={blue}>
            {tr('上方：−10%', 'Above: −10%')}
          </Label>
        </>
      ) : (
        <Label x={w / 2} y={43} color={dim}>
          {tr('磁场减小后，峰会移动吗？', 'Lower B: will the peak move?')}
        </Label>
      )}
      {[0, 40, 80].map((n) => (
        <g key={n}>
          <path d={`M ${left} ${y(n)} H ${right}`} stroke="#3d5962" />
          <Label x={left - 8} y={y(n) + 5} anchor="end">
            {n}
          </Label>
        </g>
      ))}
      <path d={fill} fill={`url(#${hatch})`} stroke={gold} strokeWidth="1.5" />
      {revealed && <path d={step('envelope')} fill="none" stroke={blue} strokeWidth="2" />}
      {[2.7, 3, 3.2].map((n) => (
        <Label key={n} x={x(n)} y={bottom + 22}>
          {n.toFixed(1)}
        </Label>
      ))}
      <Label x={w / 2} y={h - 7} color={dim}>
        m / GeV/c²
      </Label>
    </g>
  );
}
function Collider({ w, h, p, shot }: { w: number; h: number; p: number; shot: string }) {
  const scanIndex = Math.min(
      RICHTER_RECORDS.length - 1,
      Math.floor(ramp(p, 0.3, 0.78) * RICHTER_RECORDS.length),
    ),
    record = RICHTER_RECORDS[scanIndex];
  if (shot === 'beams') {
    const E = 1.55,
      cx = w / 2,
      cy = h * 0.43;
    return (
      <g>
        <Label x={cx} y={25}>
          {tr('等能量，迎面相撞', 'Equal energies, head-on collision')}
        </Label>
        <Arrow a={{ x: 25, y: cy }} b={{ x: cx - 10, y: cy }} color={green} />
        <Arrow a={{ x: w - 25, y: cy }} b={{ x: cx + 10, y: cy }} color={gold} />
        <circle cx={cx} cy={cy} r="5" fill={ink} />
        <Label x={w * 0.25} y={cy - 24}>
          e⁻
        </Label>
        <Label x={w * 0.75} y={cy - 24}>
          e⁺
        </Label>
        <Label x={w * 0.25} y={cy + 33}>
          {E.toFixed(2)} GeV
        </Label>
        <Label x={w * 0.75} y={cy + 33}>
          {E.toFixed(2)} GeV
        </Label>
        <Label x={cx} y={h - 50}>
          Σp = 0
        </Label>
        <Label x={cx} y={h - 17} color={gold}>
          √s = 2E = 3.10 GeV
        </Label>
      </g>
    );
  }
  if (shot === 'compare')
    return (
      <g>
        <Label x={w / 2} y={25}>
          {tr('两种测量，接近同一尺度', 'Two methods, same scale')}
        </Label>
        <Label x={w / 2} y={h * 0.35}>
          {tr('固定靶：重建质量', 'Fixed target: reconstructed mass')}
        </Label>
        <text x={w / 2} y={h * 0.35 + 31} textAnchor="middle" fontSize="22" fill={gold}>
          ≈ 3.1 GeV/c²
        </text>
        <Label x={w / 2} y={h * 0.65}>
          {tr('对撞机：质心能量', 'Collider: center-of-mass energy')}
        </Label>
        <text x={w / 2} y={h * 0.65 + 31} textAnchor="middle" fontSize="22" fill={green}>
          ≈ 3.1 GeV
        </text>
        <Label x={w / 2} y={h - 8} color={dim}>
          {tr('观测峰宽 ≠ 自然线宽', 'Observed width ≠ natural width')}
        </Label>
      </g>
    );
  const left = 42,
    right = w - 16,
    top = 45,
    bottom = h - 49,
    axisStart = left + 27,
    x = (e: number) => (e < 3.08 ? left : axisStart + ((e - 3.085) / 0.045) * (right - axisStart)),
    y = (v: number) => bottom - ((Math.log10(v) - 1) / 2.5) * (bottom - top);
  return (
    <g data-fixed-source="Richter-1976-fig5">
      <Label x={w / 2} y={20}>
        {tr('强子截面 · nb（对数）', 'Hadronic cross section · nb (log)')}
      </Label>
      {[10, 100, 1000].map((n) => (
        <g key={n}>
          <path d={`M ${left} ${y(n)} H ${right}`} stroke="#3d5962" />
          <Label x={left - 7} y={y(n) + 5} anchor="end">
            {n}
          </Label>
        </g>
      ))}
      {RICHTER_RECORDS.map((r, i) => (
        <circle
          key={i}
          data-fixed-energy={r.energy}
          data-fixed-cross-section={r.crossSection}
          cx={x(r.energy)}
          cy={y(r.crossSection)}
          r={i === scanIndex ? 5 : 2.6}
          fill={i === scanIndex ? gold : green}
        />
      ))}
      <path d={`M ${left + 9} ${bottom + 2} l 5 -5 l 5 5 l 5 -5`} fill="none" stroke={dim} />
      <Label x={left} y={bottom + 23}>
        3.05
      </Label>
      <Label x={x(3.1)} y={bottom + 23}>
        3.10
      </Label>
      <Label x={right} y={bottom + 23}>
        3.13
      </Label>
      <Label x={w / 2} y={h - 7} color={gold}>
        √s = {record.energy.toFixed(4)} GeV
      </Label>
    </g>
  );
}
export function ParticleEvidenceArtwork({
  chapter,
  progress,
  width: w,
  height: h,
  beta,
  field,
  fitTotal,
  neutralAnti,
}: {
  chapter: number;
  progress: number;
  width: number;
  height: number;
  beta: number;
  field: number;
  fitTotal: boolean;
  neutralAnti: boolean;
}) {
  const shot = particleShot(chapter, progress),
    hatch = useId().replaceAll(':', '') + '-particle-hatch';
  return (
    <svg
      className="particle-proof-art"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={tr('从可见产物推断粒子性质', 'Infer particle properties from visible products')}
      data-particle-shot={shot}
    >
      <defs>
        <pattern id={hatch} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M -2 2 L 2 -2 M 0 8 L 8 0 M 6 10 L 10 6" stroke={gold} strokeWidth="1.4" />
        </pattern>
      </defs>
      {chapter === 0 && <PhotonView w={w} h={h} p={progress} beta={beta} shot={shot} />}
      {chapter === 1 && <HiggsRecords w={w} h={h} shot={shot} total={fitTotal} />}
      {chapter === 6 && <AntiTracks w={w} h={h} shot={shot} />}
      {chapter === 7 &&
        (shot === 'triangle' ? (
          <AntiTracks w={w} h={h} shot={shot} />
        ) : (
          <AntiBudget w={w} h={h} anti={neutralAnti} />
        ))}
      {chapter === 10 &&
        (shot === 'spectrometer' || shot === 'field-test' ? (
          <Spectrometer w={w} h={h} field={field} shot={shot} />
        ) : (
          <TingPlot w={w} h={h} revealed={shot === 'ting'} hatch={hatch} />
        ))}
      {chapter === 11 && <Collider w={w} h={h} p={progress} shot={shot} />}
    </svg>
  );
}
const variants = [
  'e3-higgs-discovery',
  'e3-gamma-anomalous-absorption',
  'e3-electron-capture-recoil',
  'e3-antisigma-event',
  'e3-wu-parity',
  'e3-jpsi-discovery',
];
export default function ParticleEvidenceLab() {
  const film = useShowcase(),
    { host, width: measured, compact } = useSignalWidth(),
    [modeManual, setMode] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [phaseManual, setPhase] = useState(0),
    [manual, setManual] = useState(0.1),
    [betaManual, setBeta] = useState(0),
    [fieldManual, setField] = useState(1),
    [fitTotal, setFit] = useState(true),
    [neutralAnti, setNeutral] = useState(false),
    [short, setShort] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-height:700px)'),
      fn = () => setShort(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  const mode = film.watch ? Math.floor(film.chapter / 2) : modeManual,
    phase = film.watch ? film.chapter % 2 : phaseManual,
    chapter = film.watch ? film.chapter : mode * 2 + phase,
    revised = mode === 0 || mode === 3 || mode === 5,
    p = film.watch
      ? revised
        ? particleFilmProgress(chapter, film.chapterTime, browserLocale())
        : film.chapterProgress
      : manual,
    shot = particleShot(chapter, p),
    w = Math.min(800, measured),
    h = compact ? (short ? 238 : 280) : 340,
    beta = film.watch ? (chapter === 0 ? 0.6 * ramp(p, 0.62, 0.88) : 0) : betaManual,
    field = film.watch ? 1 - 0.1 * ramp(p, 0.42, 0.58) : fieldManual,
    value = film.watch
      ? mode === 4
        ? phase === 0
          ? particleFilmPolarization(film.chapterTime, browserLocale())
          : 0.9
        : mode === 1
          ? 0.15 + 0.7 * p
          : p
      : manual,
    names = [
      ['希格斯', 'Higgs'],
      ['反常吸收', 'Anomalous absorption'],
      ['K俘获', 'Electron capture'],
      ['反超子', 'Antihyperon'],
      ['宇称检验', 'Parity test'],
      ['J/Ψ', 'J/ψ'],
    ],
    provenance =
      mode === 0
        ? phase === 0
          ? tr('运动学示例 · 非观测事例', 'Kinematic example · not an observed event')
          : tr('2012 原图近似转录 · 记录固定', '2012 figure readings · fixed records')
        : mode === 3
          ? tr('1960 原记录约束 · 示意重建', '1960 record constraints · reconstruction')
          : tr('示例轨迹 · 历史记录另列', 'Example tracks; separate historical records');
  return (
    <div
      ref={host}
      className={revised ? 'particle-proof' : 'particle-proof-retained modern-lab modern-series'}
      data-particle-chapter={chapter}
    >
      {!film.watch && (
        <div className="particle-proof-tabs">
          {names.map((n, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={i === mode}
              onClick={() => {
                setMode(i);
                setPhase(0);
                setManual(0.1);
                setNeutral(false);
              }}
            >
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      {revised ? (
        <>
          <p className="particle-proof-provenance">{provenance}</p>
          <div className="particle-proof-surface">
            <ParticleEvidenceArtwork
              chapter={chapter}
              progress={p}
              width={w}
              height={h}
              beta={beta}
              field={field}
              fitTotal={film.watch ? shot === 'residual' && p >= 0.46 : fitTotal}
              neutralAnti={film.watch ? shot === 'annihilation' : neutralAnti}
            />
          </div>
        </>
      ) : (
        <>
          <div className="modern-readout">
            {mode === 1
              ? `Eγ = ${(0.5 + value * 3).toFixed(2)} MeV · ${tr('阈值', 'threshold')} 1.022 MeV`
              : mode === 2
                ? `${tr('所选基态支反冲', 'Selected ground-branch recoil')} ≈ ${captureRecoil().toFixed(1)} eV`
                : `P = ${value.toFixed(2)} · ${tr('计数不对称', 'Count asymmetry')} ${parityCounts(value).asymmetry.toFixed(2)}`}
          </div>
          <ParticleArtwork mode={mode} phase={phase} value={value} progress={p} />
        </>
      )}
      {!film.watch && (
        <div className="particle-proof-controls">
          <div className="particle-proof-tabs">
            <button
              type="button"
              aria-pressed={phase === 0}
              onClick={() => {
                setPhase(0);
                setManual(0.1);
              }}
            >
              {tr('第一段证据', 'First evidence')}
            </button>
            <button
              type="button"
              aria-pressed={phase === 1}
              onClick={() => {
                setPhase(1);
                setManual(0.1);
              }}
            >
              {tr('第二段检验', 'Second test')}
            </button>
          </div>
          <Range
            label={
              revised
                ? tr('推理进度', 'Reasoning progress')
                : mode === 4
                  ? tr('极化程度', 'Polarization')
                  : mode === 1
                    ? tr('光子能量', 'Photon energy')
                    : tr('观察进度', 'Observation progress')
            }
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
          {mode === 0 && phase === 0 && (
            <Range
              label={tr('母粒子速度 β = v/c', 'Parent speed β = v/c')}
              value={betaManual}
              min={0}
              max={0.6}
              step={0.01}
              onChange={setBeta}
            />
          )}
          {mode === 0 && phase === 1 && (
            <button type="button" aria-pressed={fitTotal} onClick={() => setFit(!fitTotal)}>
              {fitTotal
                ? tr('发表联合拟合：总曲线', 'Published joint fit: total')
                : tr('发表联合拟合：背景分量', 'Published joint fit: background')}
            </button>
          )}
          {mode === 3 && phase === 1 && (
            <button
              type="button"
              aria-pressed={neutralAnti}
              onClick={() => setNeutral(!neutralAnti)}
            >
              {neutralAnti
                ? tr('假设：反中子', 'Hypothesis: antineutron')
                : tr('假设：普通中子', 'Hypothesis: ordinary neutron')}
            </button>
          )}
          {mode === 5 && phase === 0 && (
            <Range
              label={tr('磁谱仪场强 B（T）', 'Spectrometer field B (T)')}
              value={fieldManual}
              min={0.9}
              max={1}
              step={0.01}
              onChange={setField}
            />
          )}
          <details>
            <summary>{tr('记录来源与模型边界', 'Sources and model limits')}</summary>
            <p>
              {tr(
                '金色实点与历史箱边界是预先固定的原图近似读数，不随控件重新生成。拟合曲线来自原论文联合拟合；它的背景分量不是独立背景拟合。示例运动学不冒充原始事例。',
                'Observed points and historical bin boundaries are fixed approximate figure readings. Controls do not regenerate them. Curves come from the published joint fit, whose background component is not a separate background-only fit. Example kinematics are not original event tracks.',
              )}
            </p>
            <p>
              {tr(
                '反超子质量重建使用实测 AB 方向作为输入；B 处最低能量仅计已测带电产物，靶核残余与未见中性产物未画出。谱宽受仪器或束流影响，不能直接当作自然线宽。',
                'Antihyperon reconstruction uses the measured AB direction as input. The B energy minimum includes measured charged products; target residue and unseen neutral products are omitted. Detector and beam spread affect plotted widths, which are not directly natural widths.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
