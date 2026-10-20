import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  nitrogenReaction,
  neutronRecoil,
  recoilCollision,
  recoilMass,
  recoilCandidate,
  missingFragment,
  emulsionTracks,
  trackFocus,
  chainAccount,
  chainEvent,
  chainExpectation,
  nuclearDirector,
  type NuclearMode,
  type NuclearShot,
  type NuclearView,
} from '../../models/nuclear-evidence';
import {
  RECOIL_RECORDS,
  BARIUM_RECORDS,
  BLACKETT_RECORD,
} from '../../models/nuclear-evidence-records';
import '../../styles/nuclear-evidence-lab.css';
const palette = {
  ink: '#405e52',
  muted: '#667b6e',
  green: '#7c9e8d',
  copper: '#b48660',
  paper: '#e7eddf',
  line: '#b4c2af',
  gold: '#c4ad6e',
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
function Text({
  x,
  y,
  children,
  anchor = 'middle',
  fill = palette.ink,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={16}>
      {children}
    </text>
  );
}
function Arrow({
  x,
  y,
  dx,
  dy,
  color = palette.green,
  dashed = false,
  label,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  dashed?: boolean;
  label?: string;
}) {
  const l = Math.hypot(dx, dy),
    ux = l ? dx / l : 1,
    uy = l ? dy / l : 0;
  return (
    <g data-vector={label}>
      <path
        d={`M${x} ${y}l${dx} ${dy}`}
        stroke={color}
        strokeWidth={2.4}
        strokeDasharray={dashed ? '5 5' : undefined}
        fill="none"
      />
      {l > 3 && (
        <path
          d={`M${x + dx - 7 * ux + 3 * uy} ${y + dy - 7 * uy - 3 * ux}L${x + dx} ${y + dy}l${-7 * ux - 3 * uy} ${-7 * uy + 3 * ux}`}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
        />
      )}
    </g>
  );
}
function Nucleus({
  x,
  y,
  a,
  z,
  label,
  r = 20,
}: {
  x: number;
  y: number;
  a: number;
  z: number;
  label?: string;
  r?: number;
}) {
  return (
    <g data-nucleus={label} data-a={a} data-z={z}>
      <circle cx={x} cy={y} r={r} fill={palette.paper} stroke={palette.line} />
      <ellipse
        cx={x - r * 0.15}
        cy={y - r * 0.2}
        rx={r * 0.6}
        ry={r * 0.45}
        fill={palette.green}
        opacity={0.34}
      />
      <path
        d={`M${x - r * 0.65} ${y + r * 0.15}Q${x} ${y + r * 0.65} ${x + r * 0.6} ${y - r * 0.05}`}
        fill="none"
        stroke={palette.copper}
        opacity={0.45}
      />
      {label && (
        <Text x={x} y={y + r + 21}>
          {label}
        </Text>
      )}
    </g>
  );
}
function Observation({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const neutron = s.mode === 'neutron',
    screen = w - 22,
    source = 30,
    target = neutron ? w * 0.4 : w * 0.47,
    collector = neutron ? w * 0.66 : screen - 30;
  const p = s.progress,
    hit = p > 0.45,
    withWax = s.stage > 0,
    detected = withWax && p >= 0.99;
  return (
    <>
      <Text x={w / 2} y={20}>
        {neutron
          ? en
            ? 'Neutral path → charged recoil'
            : '中性路径 → 带电反冲'
          : en
            ? 'Beyond the α range'
            : '超出α粒子的射程'}
      </Text>
      <rect
        x={12}
        y={42}
        width={w - 24}
        height={100}
        rx={14}
        fill={palette.paper}
        stroke={palette.line}
      />
      <rect x={source - 9} y={77} width={18} height={28} rx={5} fill={palette.green} />
      <Text x={source} y={64}>
        α
      </Text>
      <Arrow x={source + 9} y={91} dx={target - source - 17} dy={0} color={palette.copper} />
      {neutron ? (
        <>
          <rect x={target - 6} y={64} width={12} height={54} rx={3} fill={palette.green} />
          <Text x={target} y={137}>
            Be
          </Text>
          <Arrow x={target + 6} y={91} dx={collector - target - 17} dy={0} dashed />
          {withWax && (
            <rect x={collector - 10} y={65} width={20} height={52} rx={4} fill="#c8c6a7" />
          )}
          <Text x={collector} y={161}>
            {en ? (withWax ? 'Paraffin' : 'No paraffin') : withWax ? '石蜡' : '无石蜡'}
          </Text>
          <rect
            x={screen - 9}
            y={65}
            width={18}
            height={52}
            rx={4}
            fill="#f3efdc"
            stroke={palette.line}
          />
          {withWax && (
            <Arrow
              x={collector + 10}
              y={91}
              dx={screen - collector - 19}
              dy={0}
              color={palette.copper}
            />
          )}
          <circle
            data-particle="neutral-inferred"
            cx={target + (collector - target) * Math.min(1, p / 0.45)}
            cy={91}
            r={3}
            fill={palette.green}
            opacity={0.5}
          />
          {withWax && hit && (
            <circle
              data-particle="recoil-proton"
              cx={collector + ((screen - collector) * (p - 0.45)) / 0.55}
              cy={91}
              r={4}
              fill={palette.copper}
            />
          )}
        </>
      ) : (
        <>
          <Text x={target} y={69}>
            N₂
          </Text>
          <path d={`M${target} 91H${screen - 32}`} stroke={palette.copper} strokeWidth={2} />
          <rect x={screen - 33} y={64} width={6} height={55} fill={palette.line} />
          <rect x={screen - 2} y={65} width={4} height={53} fill={palette.green} />
          <circle cx={screen} cy={91} r={s.stage > 0 ? 5 : 0} fill={palette.gold} />
          <Text x={screen - 28} y={163}>
            {en ? 'Absorber' : '吸收层'}
          </Text>
          <Text x={8} y={163} anchor="start">
            {en ? 'Illustration' : '观察重构'}
          </Text>
        </>
      )}
      {neutron ? (
        <>
          <path d={`M28 200H${w - 28}`} stroke={palette.line} />
          <path
            d={`M28 200H${w * 0.48}l8 ${detected ? -27 : -4}l8 ${detected ? 27 : 4}H${w - 28}`}
            stroke={palette.copper}
            fill="none"
            strokeWidth={2}
          />
          <Text x={w / 2} y={234}>
            {en
              ? detected
                ? 'Ionization increases'
                : 'Weak background'
              : detected
                ? '电离信号增加'
                : '背景信号较弱'}
          </Text>
        </>
      ) : (
        <>
          <Text x={w / 2} y={195}>
            {s.stage < 2
              ? en
                ? 'Signal ≠ nucleus seen directly'
                : '闪烁 ≠ 直接看见核内部'
              : en
                ? 'Later reaction interpretation'
                : '后来的反应解释'}
          </Text>
          {s.stage >= 2 ? (
            <Text x={w / 2} y={232}>
              ¹⁴N + ⁴He → ¹⁷O + p
            </Text>
          ) : (
            <Text x={w / 2} y={232}>
              {en ? 'Range + absorption comparisons' : '结合射程与吸收比较'}
            </Text>
          )}
        </>
      )}
    </>
  );
}
function NitrogenBalance({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const r = nitrogenReaction(s.angle),
    x = w * 0.38,
    y = 123,
    scale = Math.min(15, (w - x - 24) / 10, (x - 18) / r.incoming),
    p = r.proton,
    o = r.oxygen;
  return (
    <>
      <Text x={w / 2} y={20}>
        {s.stage === 0
          ? en
            ? 'Eight historical forks: two outgoing'
            : '八个历史异常叉：两条出射'
          : en
            ? 'One selected two-body event'
            : '一个所选的二体事件'}
      </Text>
      {s.stage === 0 ? (
        <>
          <path
            d={`M24 120H${w * 0.43}l${w * 0.36} -42M${w * 0.43} 120l${-w * 0.14} 57`}
            stroke={palette.green}
            strokeWidth={3}
            fill="none"
          />
          <Text x={w * 0.79} y={61}>
            p
          </Text>
          <Text x={w * 0.29} y={202}>
            ¹⁷O
          </Text>
          <Text x={w / 2} y={236}>
            {en ? 'Blackett: fixed count, not a fit' : '布莱克特记录：固定计数'}
          </Text>
        </>
      ) : (
        <>
          <Arrow
            x={x - r.incoming * scale}
            y={y}
            dx={r.incoming * scale}
            dy={0}
            color={palette.copper}
            label="incoming"
          />
          <Nucleus x={x} y={y} a={14} z={7} r={12} />
          <Arrow
            x={x}
            y={y}
            dx={p.x * scale}
            dy={-p.y * scale}
            color={palette.copper}
            label="proton"
          />
          <Arrow x={x} y={y} dx={o.x * scale} dy={-o.y * scale} label="oxygen" />
          <Text x={Math.min(w - 18, Math.max(18, x + p.x * scale))} y={y - p.y * scale - 12}>
            p
          </Text>
          <Text x={Math.min(w - 24, x + o.x * scale + 18)} y={y - o.y * scale + 5}>
            ¹⁷O
          </Text>
          <Text x={w - 14} y={61} anchor="end">
            θ = {s.angle.toFixed(0)}°
          </Text>
          <Text x={w / 2} y={190}>
            18 = 17 + 1　·　9 = 8 + 1
          </Text>
          <Text x={w / 2} y={214}>
            Eₚ = {r.protonEnergy.toFixed(2)} MeV
          </Text>
          <Text x={w / 2} y={238}>
            {en ? 'pα = pₚ + pO · one arrow scale' : 'pα = pₚ + pO · 同一动量尺度'}
          </Text>
        </>
      )}
    </>
  );
}
function Collision({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const M = s.target,
    c = recoilCollision(s.candidateMass, M),
    t = s.progress,
    impact = 0.38,
    cx = w * 0.44,
    scale = w * 0.27;
  const targetRadius = M === 1 ? 12 : 22,
    contact = cx - targetRadius - 8;
  const incoming =
    t < impact
      ? contact - (impact - t) * scale * 2
      : contact + (t - impact) * c.projectileSpeed * scale;
  const target = t < impact ? cx : cx + (t - impact) * c.targetSpeed * scale;
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'Head-on upper bound' : '正碰的能量传递上限'}
      </Text>
      <path d={`M20 95H${w - 20}`} stroke={palette.line} />
      <circle data-projectile-x={incoming} cx={incoming} cy={95} r={8} fill={palette.green} />
      <circle data-recoil-x={target} cx={target} cy={95} r={targetRadius} fill={palette.copper} />
      <Text x={w / 2} y={147}>
        m : M = {s.candidateMass.toFixed(1)} : {M}
      </Text>
      {[1, 4, 14].map((m, i) => {
        const yy = 179 + i * 27,
          f = recoilCollision(s.candidateMass, m).fraction;
        return (
          <g key={m}>
            <Text x={30} y={yy + 5}>
              A={m}
            </Text>
            <rect
              x={65}
              y={yy - 10}
              width={(w - 136) * f}
              height={15}
              rx={4}
              fill={palette.green}
            />
            <Text x={w - 10} y={yy + 5} anchor="end">
              {(100 * f).toFixed(1)}%
            </Text>
          </g>
        );
      })}
    </>
  );
}
function Inference({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const record = RECOIL_RECORDS[s.record],
    fit = recoilMass(record.hydrogen, record.nitrogen)!,
    candidate = recoilCandidate(s.candidateMass, record.hydrogen),
    max = 4e7;
  return (
    <>
      <Text x={w / 2} y={20}>
        {s.record === 'textbook'
          ? en
            ? 'Textbook exercise · fixed inputs'
            : '教材练习 · 固定输入'
          : en
            ? 'Chadwick 1935 · range estimates'
            : '查德威克1935 · 射程估计'}
      </Text>
      {[
        ['H', record.hydrogen, candidate.hydrogen],
        ['N', record.nitrogen, candidate.nitrogen],
      ].map(([label, value, pred], i) => {
        const yy = 65 + i * 51,
          v = Number(value),
          pr = Number(pred),
          left = 37,
          span = w - 78;
        return (
          <g key={i}>
            <Text x={15} y={yy + 5}>
              {label}
            </Text>
            <path d={`M${left} ${yy}H${left + span}`} stroke={palette.line} />
            <circle
              data-fixed-recoil={label}
              data-velocity={v}
              cx={left + (span * v) / max}
              cy={yy}
              r={5}
              fill={palette.ink}
            />
            <path
              d={`M${left + (span * pr) / max} ${yy - 12}v24`}
              stroke={palette.copper}
              strokeWidth={3}
            />
            <Text x={w - 8} y={yy + 29} anchor="end">
              {(v / 1e6).toFixed(1)} ×10⁶ m/s
            </Text>
          </g>
        );
      })}
      <Text x={w / 2} y={169}>
        {en ? '● fixed record　│ candidate' : '● 固定记录　│ 候选预测'}
      </Text>
      <Text x={w / 2} y={197}>
        {s.stage === 0
          ? `m/mH = ${s.candidateMass.toFixed(2)} ?`
          : `${en ? 'Fit: ' : '反求：'}m/mH ≈ ${fit.mass.toFixed(2)}`}
      </Text>
      <Text x={w / 2} y={224}>
        {s.stage < 2
          ? en
            ? 'UH/UN = (m+14)/(m+1)'
            : 'UH/UN = (m+14)/(m+1)'
          : s.reveal
            ? `${en ? 'He prediction' : '氦靶预测'} ${(recoilCandidate(s.candidateMass, record.hydrogen).helium / 1e6).toFixed(1)} ×10⁶ m/s`
            : en
              ? 'Predict a helium target'
              : '预测换成氦靶会怎样'}
      </Text>
    </>
  );
}
function ChemistryEvidence({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const rows = [
    { y: 83, kind: 'artificial', name: en ? 'Unknown product' : '待鉴定产物', enriched: false },
    {
      y: 159,
      kind: 'radium-control',
      name: en ? 'Known Ra tracer' : '已知Ra示踪物',
      enriched: true,
    },
  ];
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'Same Ba carrier · same separation' : '相同钡载体 · 相同分离'}
      </Text>
      {rows.map((r) => (
        <g
          key={r.kind}
          data-fixed-separation={r.kind}
          data-result={BARIUM_RECORDS.find((a) => a.id === r.kind)!.result}
        >
          <Text x={12} y={r.y - 30} anchor="start">
            {r.name}
          </Text>
          {[0, 1, 2].map((i) => {
            const x = 35 + (i * (w - 70)) / 2;
            return (
              <g key={i}>
                <path
                  d={`M${x - 15} ${r.y - 12}v26q0 13 15 13q15 0 15-13v-26`}
                  fill={palette.paper}
                  stroke={palette.line}
                  strokeWidth={1.5}
                />
                <path d={`M${x - 11} ${r.y + 13}h22`} stroke={palette.green} strokeWidth={6} />
                {s.stage > 0 && (
                  <circle
                    cx={x}
                    cy={r.y + 5}
                    r={r.enriched ? (i === 0 ? 8 : 2.5) : 4.5}
                    fill={r.enriched ? palette.copper : palette.green}
                  />
                )}
              </g>
            );
          })}
          <Text x={w - 5} y={r.y - 30} anchor="end">
            {s.stage > 0
              ? r.enriched
                ? en
                  ? 'Enriches'
                  : '首级富集'
                : en
                  ? 'Stays with Ba'
                  : '始终随Ba'
              : '?'}
          </Text>
        </g>
      ))}
      <Text x={w / 2} y={218}>
        {s.reveal
          ? en
            ? 'Different from Ra → supports Ba'
            : '与Ra行为不同 → 支持Ba'
          : en
            ? 'Would a true Ra product separate?'
            : '若它是Ra，也应被分开吗？'}
      </Text>
      <Text x={w / 2} y={242}>
        {en ? 'Published qualitative comparison' : '原文定性对照 · 非计数比例'}
      </Text>
    </>
  );
}
function FissionChannel({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const p = s.progress,
    split = clamp((p - 0.5) / 0.5),
    cx = w / 2,
    cy = 96,
    distance = (46 + 24 * split) * Math.min(1, w / 300),
    other = missingFragment();
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'Selected textbook channel' : '教材所选通道'}
      </Text>
      {p < 0.2 ? (
        <>
          <Arrow x={25} y={cy} dx={cx - 62} dy={0} dashed />
          <circle
            data-neutron-id="incoming"
            cx={25 + ((cx - 45) * p) / 0.2}
            cy={cy}
            r={4}
            fill={palette.green}
          />
          <Nucleus x={cx} y={cy} a={235} z={92} label="²³⁵U" r={29} />
        </>
      ) : p < 0.5 ? (
        <>
          <ellipse
            cx={cx}
            cy={cy}
            rx={30 + (25 * (p - 0.2)) / 0.3}
            ry={29 - (9 * (p - 0.2)) / 0.3}
            fill={palette.paper}
            stroke={palette.line}
          />
          <Text x={cx} y={cy + 6}>
            ²³⁶U*
          </Text>
          <Text x={cx} y={143}>
            {en ? 'After neutron capture' : '吸收中子后的复合核'}
          </Text>
        </>
      ) : (
        <>
          <Nucleus x={cx - (distance * 89) / 144} y={cy} a={144} z={56} r={24} />
          <Text x={cx - (distance * 89) / 144} y={cy - 38}>
            ¹⁴⁴Ba
          </Text>
          <Nucleus x={cx + distance} y={cy} a={89} z={36} r={20} />
          <Text x={cx + distance} y={cy - 38}>
            {s.reveal ? '⁸⁹Kr' : '?'}
          </Text>
          {[0, 1, 2].map((i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
            return (
              <circle
                key={i}
                data-neutron-id={`emitted-${i}`}
                cx={cx + Math.cos(a) * (12 + split * 47)}
                cy={cy + Math.sin(a) * (12 + split * 47)}
                r={4}
                fill={palette.green}
              />
            );
          })}
        </>
      )}
      <Text x={w / 2} y={184}>
        236 = 144 + {s.reveal ? other.a : '?'} + 3
      </Text>
      <Text x={w / 2} y={211}>
        92 = 56 + {s.reveal ? other.z : '?'}
      </Text>
      <Text x={w / 2} y={239}>
        {s.reveal
          ? en
            ? 'Kr: both ledgers agree'
            : '氪核：两本账同时闭合'
          : en
            ? 'Predict the missing fragment'
            : '用两种守恒预测另一碎片'}
      </Text>
    </>
  );
}
function Emulsion({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const tracks = emulsionTracks(s.count, s.unrelated),
    cx = w * 0.5,
    cy = 126,
    scale = Math.min(82, w * 0.32);
  return (
    <>
      <Text x={w / 2} y={20}>
        {s.unrelated
          ? en
            ? 'Same projection; different depth'
            : '投影重合，深度却不同'
          : en
            ? 'Tracks from one vertex'
            : '共同顶点伸出的径迹'}
      </Text>
      <rect x={9} y={38} width={w - 18} height={166} rx={14} fill="#e5e4d6" stroke={palette.line} />
      {tracks.map((a, i) => (
        <g
          key={a.id}
          data-track-id={a.id}
          data-origin-z={a.origin.z}
          opacity={trackFocus(a.origin.z, s.focus)}
        >
          {Array.from({ length: 31 }, (_, j) => {
            const t = j / 30;
            return t <= s.progress ? (
              <circle
                key={j}
                cx={cx + Math.cos(a.direction) * scale * a.range * t}
                cy={cy - Math.sin(a.direction) * scale * a.range * t}
                r={a.mass > 10 ? 2.4 : 1.1}
                fill={a.mass > 10 ? '#6d7864' : '#a08d69'}
              />
            ) : null;
          })}
          {s.focus === a.origin.z && (
            <Text
              x={cx + Math.cos(a.direction) * (scale * a.range + 15)}
              y={cy - Math.sin(a.direction) * (scale * a.range + 15) + 5}
            >
              {i + 1}
            </Text>
          )}
        </g>
      ))}
      <circle cx={cx} cy={cy} r={8} stroke={palette.copper} fill="none" />
      <Text x={w / 2} y={228}>
        {s.unrelated
          ? en
            ? `Focus depth ${s.focus.toFixed(1)} · schematic`
            : `焦平面 ${s.focus.toFixed(1)} · 示意`
          : en
            ? 'Constructed example; not a photo'
            : '构造例子，不是历史照片'}
      </Text>
    </>
  );
}
function Momentum({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const source = emulsionTracks(s.count),
    tracks = s.count === 4 ? [source[0]!, source[2]!, source[1]!, source[3]!] : source,
    scale = Math.min(70, w * 0.23);
  let x = w * 0.26,
    y = 133;
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'A momentum polygon closes' : '动量向量首尾闭合'}
      </Text>
      {tracks.map((a, i) => {
        const xx = x,
          yy = y;
        x += a.px * scale;
        y -= a.py * scale;
        return (
          <g key={a.id}>
            <Arrow
              x={xx}
              y={yy}
              dx={a.px * scale}
              dy={-a.py * scale}
              color={a.mass > 10 ? palette.green : palette.copper}
              label={a.id}
            />
            <Text x={xx + (a.px * scale) / 2} y={yy - (a.py * scale) / 2 - 10}>
              {Number(a.id.split('-')[1]) + 1}
            </Text>
          </g>
        );
      })}
      <circle cx={w * 0.26} cy={133} r={5} fill={palette.gold} />
      <Text x={w / 2} y={200}>
        Σp = 0
      </Text>
      <Text x={w / 2} y={232}>
        {en ? 'Model check ≠ particle identification' : '模型自洽 ≠ 已鉴定核素'}
      </Text>
    </>
  );
}
function ChainRoutes({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const events = chainEvent(s.escape, s.absorb, s.progress),
    start = { x: 35, y: 122 };
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'Follow the same three neutron IDs' : '跟踪同一组三个中子身份'}
      </Text>
      <g opacity={0.4}>
        {Array.from({ length: 12 }, (_, j) => (
          <rect
            key={j}
            x={12 + (j % 3) * 12}
            y={89 + Math.floor(j / 3) * 15}
            width={10}
            height={12}
            rx={2}
            fill={palette.line}
          />
        ))}
      </g>
      <Nucleus x={start.x} y={start.y} a={236} z={92} r={15} />
      {events.map((a, i) => {
        const to = { x: w - 34, y: 65 + i * 62 },
          p = a.progress,
          x = (1 - p) ** 2 * start.x + 2 * (1 - p) * p * w * 0.5 + p * p * to.x,
          y = (1 - p) ** 2 * start.y + 2 * (1 - p) * p * to.y + p * p * to.y;
        return (
          <g key={a.id} data-chain-neutron={a.id} data-fate={a.fate}>
            <path
              d={`M${start.x + 15} ${start.y}Q${w * 0.5} ${to.y} ${to.x} ${to.y}`}
              fill="none"
              stroke={palette.line}
              strokeDasharray="4 4"
            />
            {a.fate === 'fission' ? (
              <Nucleus x={to.x} y={to.y} a={235} z={92} r={12} />
            ) : a.fate === 'absorb' ? (
              <rect
                x={to.x - 8}
                y={to.y - 14}
                width={16}
                height={28}
                rx={4}
                fill={palette.copper}
              />
            ) : (
              <path d={`M${to.x} ${to.y - 14}v28`} stroke={palette.green} strokeDasharray="3 3" />
            )}
            <Text x={w * 0.61} y={to.y - 18}>
              {a.fate === 'escape'
                ? en
                  ? 'Escape'
                  : '逃逸'
                : a.fate === 'absorb'
                  ? en
                    ? 'Absorb'
                    : '吸收'
                  : en
                    ? 'Next fission'
                    : '下次裂变'}
            </Text>
            <circle
              cx={x}
              cy={y}
              r={5}
              fill={p === 1 && a.fate !== 'escape' ? palette.paper : palette.green}
              stroke={palette.green}
            />
            <Text x={x - 10} y={y + 17}>
              {i + 1}
            </Text>
            {a.children.map((id, j) => (
              <circle
                key={id}
                data-child-id={id}
                cx={to.x - 15 - j * 8}
                cy={to.y + 15 + (j - 1) * 7}
                r={3}
                fill={palette.gold}
              />
            ))}
          </g>
        );
      })}
      <Text x={w / 2} y={241}>
        {en ? 'Constructed, not measured' : '构造路径，非实测事件'}
      </Text>
    </>
  );
}
function Generations({ s, w, en }: { s: NuclearShot; w: number; en: boolean }) {
  const a = chainAccount(s.escape, s.absorb),
    left = 25,
    right = w - 12,
    bottom = 185,
    scale = 110 / 6;
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'Losses determine the average' : '损失决定下一代的平均规模'}
      </Text>
      <Text x={w / 2} y={49}>
        k ≈ 3 × (1 − {a.escape.toFixed(2)} − {a.absorb.toFixed(2)})
      </Text>
      <Text x={left} y={72} anchor="start">
        log₁₀(1+N)
      </Text>
      <path d={`M${left} 78V${bottom}H${right}`} fill="none" stroke={palette.line} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => {
        const x = left + 10 + (g * (right - left - 12)) / 9,
          expected = chainExpectation(a.k, g),
          h = Math.log10(1 + expected) * scale,
          reveal = s.reveal || g <= 3;
        return (
          <g key={g} data-generation={g} data-expectation={chainExpectation(a.k, g)}>
            {reveal ? (
              <rect
                x={x}
                y={bottom - h}
                width={(right - left) / 13}
                height={h}
                rx={3}
                fill={palette.green}
              />
            ) : (
              <Text x={x + 5} y={bottom - 20}>
                ?
              </Text>
            )}
            <Text x={x + 5} y={bottom + 21}>
              {g}
            </Text>
          </g>
        );
      })}
      <Text x={w / 2} y={233}>
        {s.reveal
          ? `k = ${a.k.toFixed(2)}　N₈ = ${chainExpectation(a.k, 8).toPrecision(3)}`
          : en
            ? 'Predict generations 4–8'
            : '先预测第4—8代'}
      </Text>
    </>
  );
}
export function NuclearArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  progress = 0.6,
  shot,
  width = 340,
  locale,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  progress?: number;
  shot?: NuclearShot;
  width?: number;
  locale?: 'zh' | 'en';
}) {
  const w = Math.max(260, Math.min(720, width)),
    en = (locale ?? browserLocale()) === 'en',
    s = shot ?? {
      ...nuclearDirector(mode * 2 + phase, progress),
      candidateMass: 0.5 + value,
      target: phase ? 14 : 1,
    };
  return (
    <svg
      className="nel-art"
      width={w}
      height={252}
      viewBox={`0 0 ${w} 252`}
      role="img"
      aria-label={en ? 'Nuclear evidence and model predictions' : '核反应证据与模型预测'}
      data-nuclear-mode={s.mode}
      data-nuclear-view={s.view}
      data-reveal={s.reveal}
      data-stage={s.stage}
    >
      {s.view === 'apparatus' ? (
        <Observation s={s} w={w} en={en} />
      ) : s.view === 'balance' ? (
        <NitrogenBalance s={s} w={w} en={en} />
      ) : s.view === 'collision' ? (
        <Collision s={s} w={w} en={en} />
      ) : s.view === 'inference' ? (
        <Inference s={s} w={w} en={en} />
      ) : s.view === 'chemistry' ? (
        <ChemistryEvidence s={s} w={w} en={en} />
      ) : s.view === 'channel' ? (
        <FissionChannel s={s} w={w} en={en} />
      ) : s.view === 'emulsion' ? (
        <Emulsion s={s} w={w} en={en} />
      ) : s.view === 'momentum' ? (
        <Momentum s={s} w={w} en={en} />
      ) : s.view === 'routes' ? (
        <ChainRoutes s={s} w={w} en={en} />
      ) : (
        <Generations s={s} w={w} en={en} />
      )}
    </svg>
  );
}
const views: Record<NuclearMode, NuclearView[]> = {
  nitrogen: ['apparatus', 'balance'],
  neutron: ['apparatus', 'collision', 'inference'],
  fission: ['chemistry', 'channel'],
  tracks: ['emulsion', 'momentum'],
  chain: ['routes', 'generations'],
};
export default function NuclearEvidenceLab() {
  const film = useShowcase(),
    locale = browserLocale(),
    en = locale === 'en',
    say = (zh: string, english: string) => (en ? english : zh);
  const [chosen, setMode] = useState<NuclearMode | null>(null),
    [chosenView, setView] = useState<NuclearView | null>(null),
    [angleOverride, setAngle] = useState<number | null>(null),
    [targetOverride, setTarget] = useState<number | null>(null),
    [massOverride, setMass] = useState<number | null>(null),
    [recordOverride, setRecord] = useState<string | null>(null),
    [progressOverride, setProgress] = useState<number | null>(null),
    [countOverride, setCount] = useState<string | null>(null),
    [unrelatedOverride, setUnrelated] = useState<string | null>(null),
    [focusOverride, setFocus] = useState<number | null>(null),
    [escapeOverride, setEscape] = useState<number | null>(null),
    [absorbOverride, setAbsorb] = useState<number | null>(null),
    [width, setWidth] = useState(340);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !host.current) return;
    const element = host.current,
      update = () => setWidth(Math.max(260, Math.min(680, element.clientWidth)));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(element);
    return () => ro.disconnect();
  }, []);
  const authored = nuclearDirector(film.chapter, film.chapterProgress, film.chapterTime, locale),
    mode = chosen ?? authored.mode,
    view =
      chosenView && views[mode].includes(chosenView)
        ? chosenView
        : mode === authored.mode
          ? authored.view
          : views[mode][0]!,
    angle = angleOverride ?? authored.angle,
    target = targetOverride ?? authored.target,
    mass = massOverride ?? authored.candidateMass,
    record = recordOverride ?? authored.record,
    progress = progressOverride ?? authored.progress,
    count = countOverride ?? String(authored.count),
    unrelated = unrelatedOverride ?? (authored.unrelated ? 'yes' : 'no'),
    focus = focusOverride ?? authored.focus,
    escape = escapeOverride ?? authored.escape,
    absorb = absorbOverride ?? authored.absorb;
  const shot = film.watch
    ? authored
    : {
        ...authored,
        mode,
        view,
        angle,
        target,
        candidateMass: mass,
        record: record === 'chadwick' ? ('chadwick' as const) : ('textbook' as const),
        progress,
        count: count === '4' ? (4 as const) : (3 as const),
        unrelated: unrelated === 'yes',
        focus,
        escape,
        absorb,
        reveal: progressOverride === null ? authored.reveal : progress >= 0.5,
        stage:
          progressOverride === null ? authored.stage : progress < 0.25 ? 0 : progress < 0.5 ? 1 : 2,
      };
  const names: Record<NuclearMode, string> = {
    nitrogen: say('质子证据', 'Proton'),
    neutron: say('中子反冲', 'Neutron'),
    fission: say('裂变鉴定', 'Fission'),
    tracks: say('相关径迹', 'Tracks'),
    chain: say('中子代际', 'Generations'),
  };
  const titles: Record<NuclearView, string> = {
    apparatus: say('观察装置', 'Apparatus'),
    balance: say('守恒解释', 'Conservation'),
    collision: say('碰撞模型', 'Collision'),
    inference: say('固定证据', 'Fixed evidence'),
    chemistry: say('分离对照', 'Separation'),
    channel: say('核反应账目', 'Reaction ledger'),
    emulsion: say('焦平面', 'Focus'),
    momentum: say('动量闭合', 'Momentum'),
    routes: say('中子去向', 'Neutron paths'),
    generations: say('期望计数', 'Expected counts'),
  };
  return (
    <div className="nel-lab" data-watch={film.watch} ref={host}>
      <NuclearArtwork width={width} shot={shot} locale={locale} />
      {!film.watch && (
        <div className="nel-controls">
          <Segments
            label={say('核反应证据', 'Nuclear evidence')}
            value={mode}
            options={(Object.keys(names) as NuclearMode[]).map((value) => ({
              value,
              label: names[value],
            }))}
            onChange={(v) => {
              setMode(v);
              setView(null);
            }}
          />
          <Segments
            label={say('观察视图', 'Observation view')}
            value={view}
            options={views[mode].map((value) => ({ value, label: titles[value] }))}
            onChange={setView}
          />
          {mode === 'nitrogen' && view === 'balance' && (
            <Range
              label={say('质子出射角', 'Proton emission angle')}
              value={angle}
              min={0}
              max={160}
              step={5}
              unit="°"
              onChange={setAngle}
            />
          )}
          {mode === 'neutron' && (
            <>
              <Range
                label={say('候选入射粒子质量', 'Candidate incident mass')}
                value={mass}
                min={0.2}
                max={4}
                step={0.1}
                unit="mH"
                onChange={setMass}
              />
              {view === 'collision' ? (
                <Segments
                  label={say('反冲靶', 'Recoil target')}
                  value={String(target)}
                  options={[1, 4, 14].map((m) => ({ value: String(m), label: `A=${m}` }))}
                  onChange={(v) => setTarget(Number(v))}
                />
              ) : view === 'inference' ? (
                <Segments
                  label={say('固定记录来源', 'Fixed record source')}
                  value={record}
                  options={[
                    { value: 'textbook', label: say('教材练习', 'Textbook') },
                    { value: 'chadwick', label: say('1935原讲稿', '1935 lecture') },
                  ]}
                  onChange={setRecord}
                />
              ) : null}
            </>
          )}
          {mode === 'tracks' && (
            <>
              <Segments
                label={say('带电径迹数', 'Charged-track count')}
                value={count}
                options={[
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                ]}
                onChange={setCount}
              />
              {view === 'emulsion' && (
                <>
                  <Segments
                    label={say('顶点对照', 'Vertex comparison')}
                    value={unrelated}
                    options={[
                      { value: 'no', label: say('同一深度', 'Same depth') },
                      { value: 'yes', label: say('投影交叉', 'Projected crossing') },
                    ]}
                    onChange={setUnrelated}
                  />
                  <Range
                    label={say('示意焦平面', 'Illustrative focus depth')}
                    value={focus}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={setFocus}
                  />
                </>
              )}
            </>
          )}
          {mode === 'chain' && (
            <>
              <Range
                label={say('抽象逃逸份额', 'Abstract escape fraction')}
                value={escape}
                min={0}
                max={0.6}
                step={0.05}
                onChange={(v) => {
                  setEscape(v);
                  setAbsorb((a) => Math.min(a ?? authored.absorb, 1 - v));
                }}
              />
              <Range
                label={say('抽象非裂变吸收份额', 'Abstract non-fission absorption')}
                value={absorb}
                min={0}
                max={1 - escape}
                step={0.01}
                onChange={setAbsorb}
              />
            </>
          )}
          <Range
            label={say('观察进度', 'Observation progress')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          <details>
            <summary>{say('模型与历史证据边界', 'Model and historical limits')}</summary>
            <p>
              {say(
                '固定史料不随控件改变；轨迹、分离标记与中子路径是明确的教学示意。代际图是平均期望，不是随机事件记录；未由实际材料或几何计算再生数。',
                'Source records do not change with controls. Tracks, separation marks and neutron routes are explicit teaching diagrams. Generation bars are expectations, not random observations; reproduction is not derived from real materials or geometry.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
