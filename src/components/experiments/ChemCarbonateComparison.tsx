import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  aqueousCarbonateState,
  carbonateHeating,
  carbonateDissolving,
  carbonateDirector,
  protonTransferGeometry,
  carbonateThermalAtoms,
  type CarbonateSalt,
  type ProtonRoute,
  type NetAtom,
  type NetBond,
} from '../../models/chem-carbonate-comparison';
import '../../styles/chem-carbonate-comparison.css';
type Say = (zh: string, en: string) => string;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const formula = (s: CarbonateSalt) => (s === 'carbonate' ? 'Na₂CO₃' : 'NaHCO₃');
const atomColor = { C: '#647960', O: '#c28572', H: '#e9ce7e', Na: '#88a9a2' };
function Atoms({ atoms, bonds }: { atoms: NetAtom[]; bonds: NetBond[] }) {
  return (
    <>
      {bonds.map((b, i) => {
        const a = atoms.find((x) => x.id === b.a)!,
          z = atoms.find((x) => x.id === b.b)!;
        return (
          <path
            key={i}
            d={`M${a.x} ${a.y}L${z.x} ${z.y}`}
            stroke="#8f9e86"
            strokeWidth="3"
            opacity={b.opacity}
          />
        );
      })}
      {atoms.map((a) => (
        <g key={a.id} data-atom={a.id} transform={`translate(${a.x} ${a.y})`}>
          {a.tracked && <circle r="18" fill="none" stroke="#b48b33" strokeWidth="2" />}
          <circle
            r={a.element === 'Na' ? 16 : 12}
            fill={atomColor[a.element]}
            stroke="#f7f5e4"
            strokeWidth="1.5"
          />
          <text y="5" textAnchor="middle" className="carb-atom-letter">
            {a.element}
          </text>
        </g>
      ))}
    </>
  );
}
function Samples({
  width,
  stage,
  indicator,
  model,
  say,
  uid,
}: {
  width: number;
  stage: number;
  indicator: boolean;
  model: boolean;
  say: Say;
  uid: string;
}) {
  const compact = width < 560,
    sw = (width - 16) / 2,
    h = compact ? 150 : 200;
  return (
    <>
      <p className="carb-kicker">
        {say(
          model ? '另设比较 · 25°C · 0.010 mol/L' : '教材样品 · 只比较现象',
          model ? 'Separate model · 25°C · 0.010 mol/L' : 'Textbook samples · qualitative',
        )}
      </p>
      <div className="carb-pair">
        {(['carbonate', 'bicarbonate'] as CarbonateSalt[]).map((salt) => {
          const s = carbonateDissolving(salt, stage),
            eq = aqueousCarbonateState(salt, 0.001, 0.1),
            cx = sw * 0.39,
            left = cx - 24,
            right = cx + 24,
            bottom = h - 19,
            level = bottom - 12 - 82 * (s.waterGrams / 5.15),
            t = indicator ? (model ? eq.indicator : s.indicatorTone) : 0;
          return (
            <figure key={salt}>
              <figcaption>{formula(salt)}</figcaption>
              <svg
                viewBox={`0 0 ${sw} ${h}`}
                role="img"
                aria-label={say(
                  salt === 'carbonate'
                    ? '碳酸钠样品，水合并放热；指示剂示碱性'
                    : '碳酸氢钠样品，溶解吸热；显色可能很淡',
                  salt === 'carbonate'
                    ? 'Carbonate: hydration releases heat; alkaline indicator response'
                    : 'Bicarbonate: dissolution absorbs heat; indicator can be faint',
                )}
              >
                <defs>
                  <clipPath id={`${uid}-${salt}`}>
                    <path
                      d={`M${left} 12V${bottom - 17}Q${left} ${bottom} ${cx} ${bottom}T${right} ${bottom - 17}V12Z`}
                    />
                  </clipPath>
                  <linearGradient id={`${uid}-glass-${salt}`}>
                    <stop stopColor="#c6d6c4" stopOpacity=".35" />
                    <stop offset=".5" stopColor="#fff" stopOpacity=".05" />
                    <stop offset="1" stopColor="#88aaa2" stopOpacity=".25" />
                  </linearGradient>
                </defs>
                <path
                  d={`M${left} 12V${bottom - 17}Q${left} ${bottom} ${cx} ${bottom}T${right} ${bottom - 17}V12`}
                  fill={`url(#${uid}-glass-${salt})`}
                  stroke="#8ca99c"
                  strokeWidth="2"
                />
                <g clipPath={`url(#${uid}-${salt})`}>
                  <rect
                    x={left + 1}
                    y={level}
                    width="46"
                    height={bottom - level}
                    fill="#bdd3c4"
                    opacity=".45"
                  />
                  {indicator && (
                    <rect
                      x={left + 1}
                      y={level}
                      width="46"
                      height={bottom - level}
                      fill="#c25f91"
                      opacity={t * 0.7}
                    />
                  )}
                  <ellipse cx={cx} cy={level} rx="23" ry="4" fill="#b8cdbb" opacity=".4" />
                  {!model &&
                    Array.from({ length: 18 }, (_, i) => (
                      <rect
                        key={i}
                        x={left + 3 + (i % 6) * 7}
                        y={bottom - 11 - Math.floor(i / 6) * 6}
                        width={5 + s.hydration * 2}
                        height={5 + s.hydration * 2}
                        rx={s.hydration * 2}
                        fill="#f5f0d8"
                        stroke="#c6c6a8"
                        opacity={i / 18 < s.residualGrams ? 1 : 0}
                      />
                    ))}
                </g>
                <path
                  d={`M${left + 5} 22V${bottom - 20}`}
                  stroke="#fff"
                  strokeWidth="2"
                  opacity=".7"
                />
                {!indicator && (
                  <g transform={`translate(${sw - 22} 0)`}>
                    <rect
                      x="-4"
                      y="32"
                      width="8"
                      height={h - 66}
                      rx="4"
                      fill="#f6f5e6"
                      stroke="#b8bca1"
                    />
                    <circle cy={h - 32} r="8" fill="#d09c75" />
                    <path
                      d={`M0 ${h - 33}V${h * 0.52 - s.heatDirection * 22 * Math.min(1, stage * 3)}`}
                      stroke={salt === 'carbonate' ? '#c18d6d' : '#86a9b2'}
                      strokeWidth="4"
                    />
                  </g>
                )}
              </svg>
              <p>
                {model
                  ? `pH ${eq.pH.toFixed(2)}`
                  : indicator
                    ? say(
                        salt === 'carbonate' ? '显色较深' : '显色可很淡',
                        salt === 'carbonate' ? 'Stronger colour' : 'Can be very faint',
                      )
                    : say(
                        salt === 'carbonate' ? '温度 ↑' : '温度 ↓',
                        salt === 'carbonate' ? 'Warms ↑' : 'Cools ↓',
                      )}
              </p>
            </figure>
          );
        })}
      </div>
    </>
  );
}
function Energy({
  width,
  p,
  salt,
  say,
}: {
  width: number;
  p: number;
  salt: CarbonateSalt;
  say: Say;
}) {
  const compact = width < 560,
    cx = width / 2,
    cy = compact ? 137 : 150,
    spread = ramp(p, 0, 0.28),
    hydrate = ramp(p, 0.28, 0.6),
    net = p >= 0.6,
    r = compact ? 73 : 96;
  const ion: NetAtom[] = [
    { id: 'C', element: 'C', x: cx, y: cy },
    { id: 'O1', element: 'O', x: cx - 25, y: cy - 17 },
    { id: 'O2', element: 'O', x: cx + 25, y: cy - 17 },
    { id: 'O3', element: 'O', x: cx, y: cy + 28 },
  ];
  if (salt === 'bicarbonate') ion.push({ id: 'Hc', element: 'H', x: cx + 23, y: cy + 44 });
  return (
    <>
      <p className="carb-kicker">{say('同一组离子遇到水', 'The same ion meets water')}</p>
      <svg
        viewBox={`0 0 ${width} ${compact ? 295 : 310}`}
        role="img"
        aria-label={say(
          '离子分开需要能量；水的氢端转向阴离子形成水合邻域，释放能量。净热方向定性显示。',
          'Separating ions takes energy; water turns its hydrogen side toward the anion as hydration releases energy. Net heat is qualitative.',
        )}
      >
        <circle cx={cx} cy={cy} r={r + 22} stroke="#c6cbb1" fill="#e9edda" strokeDasharray="3 7" />
        {(salt === 'carbonate' ? [-1, 1] : [-1]).map((sign) => (
          <g
            key={sign}
            transform={`translate(${cx + sign * (45 + spread * (compact ? 55 : 105))} ${cy + sign * 46})`}
            opacity={1 - spread * 0.75}
          >
            <circle r="16" fill="#88a9a2" />
            <text y="5" textAnchor="middle" className="carb-atom-letter">
              Na⁺
            </text>
          </g>
        ))}
        <Atoms
          atoms={ion}
          bonds={[
            ...['O1', 'O2', 'O3'].map((b) => ({ a: 'C', b, opacity: 1 })),
            ...(salt === 'bicarbonate' ? [{ a: 'O3', b: 'Hc', opacity: 1 }] : []),
          ]}
        />
        <text x={cx} y={cy + 86} textAnchor="middle">
          {salt === 'carbonate' ? 'CO₃²⁻' : 'HCO₃⁻'}
        </text>
        {[-135, -45, 45, 135].map((deg, i) => {
          const a = (deg * Math.PI) / 180,
            x = cx + Math.cos(a) * r,
            y = cy + Math.sin(a) * r,
            angle = deg + 180 + (1 - hydrate) * (i % 2 ? 75 : -75);
          return (
            <g
              key={deg}
              transform={`translate(${x} ${y}) rotate(${angle})`}
              opacity={0.2 + 0.8 * hydrate}
            >
              <path d="M0 0L17-10M0 0L17 10" stroke="#b5ae86" strokeWidth="2" />
              <circle r="9" fill="#c28572" />
              <circle cx="17" cy="-10" r="6" fill="#e9ce7e" />
              <circle cx="17" cy="10" r="6" fill="#e9ce7e" />
            </g>
          );
        })}
        <path
          d={
            p < 0.28 || (net && salt === 'bicarbonate')
              ? `M${cx} 38V${cy - 48}m-5-7 5 7 5-7`
              : `M${cx} ${cy - 48}V38m-5 7 5-7 5 7`
          }
          stroke={p < 0.28 || (net && salt === 'bicarbonate') ? '#779da1' : '#c49868'}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {!net && (
          <>
            <text x={cx} y="20" textAnchor="middle">
              {say(
                p < 0.28 ? '分开旧作用：需能' : '形成水合作用：放能',
                p < 0.28 ? 'Separate: energy in' : 'Hydrate: energy out',
              )}
            </text>
          </>
        )}
        {net && (
          <text x={cx} y="22" textAnchor="middle">
            {formula(salt)} ·{' '}
            {say(
              salt === 'carbonate' ? '净放热' : '净吸热',
              salt === 'carbonate' ? 'Net heat out' : 'Net heat in',
            )}
          </text>
        )}
        <text x={cx} y={compact ? 285 : 300} textAnchor="middle" className="carb-muted">
          {say(
            p < 0.28
              ? '水分子尚未定向'
              : p < 0.6
                ? '水的 H 端逐渐转向阴离子'
                : '水的 H 端朝向阴离子',
            p < 0.28
              ? 'Water has not reoriented yet'
              : p < 0.6
                ? 'Water turns its H side inward'
                : 'Water’s H side faces the anion',
          )}
        </text>
      </svg>
    </>
  );
}
function Proton({
  width,
  route,
  progress,
  say,
  showEquation = false,
}: {
  showEquation?: boolean;
  width: number;
  route: ProtonRoute;
  progress: number;
  say: Say;
}) {
  const s = protonTransferGeometry(width, route, progress),
    done = s.progress > 0.5,
    labelOpacity = Math.max(0, 1 - s.progress / 0.12, (s.progress - 0.88) / 0.12);
  const labels =
    route === 'carbonate-accepts'
      ? ['CO₃²⁻', 'HCO₃⁻', 'H₂O', 'OH⁻']
      : route === 'bicarbonate-accepts'
        ? ['HCO₃⁻', 'H₂CO₃', 'H₂O', 'OH⁻']
        : ['HCO₃⁻', 'CO₃²⁻', 'H₂O', 'H₃O⁺'];
  return (
    <>
      <p className="carb-kicker">
        {say(
          route === 'carbonate-accepts'
            ? '标记的 H 来自水'
            : route === 'bicarbonate-accepts'
              ? 'HCO₃⁻ 也能接受质子'
              : 'HCO₃⁻ 也能给出质子',
          route === 'carbonate-accepts'
            ? 'The marked H starts in water'
            : route === 'bicarbonate-accepts'
              ? 'Bicarbonate can accept a proton'
              : 'Bicarbonate can donate a proton',
        )}
      </p>
      <svg
        viewBox={`0 0 ${s.width} ${s.height}`}
        role="img"
        aria-label={say(
          `${s.left}与${s.right}的净质子转移，钠离子不变`,
          `Net proton transfer between ${s.left} and ${s.right}; sodium is unchanged`,
        )}
      >
        <path
          d={s.transferPath.map((a, i) => `${i ? 'L' : 'M'}${a.x} ${a.y}`).join(' ')}
          fill="none"
          stroke="#bca251"
          strokeDasharray="3 5"
          opacity=".4"
        />
        <Atoms atoms={s.atoms} bonds={s.bonds} />
        <text x={s.cx} y={s.cy - 58} textAnchor="middle" opacity={labelOpacity}>
          {done ? labels[1] : labels[0]}
        </text>
        <text x={s.wx} y={s.wy + 62} textAnchor="middle" opacity={labelOpacity}>
          {done ? labels[3] : labels[2]}
        </text>
        <text x="4" y={s.height - 12} className="carb-muted">
          {s.spectatorSodium === 2 ? '2 Na⁺' : 'Na⁺'} · {say('旁观离子', 'spectator')}
        </text>
        <text x={s.width - 4} y={s.height - 12} textAnchor="end" className="carb-muted">
          {say('净变化', 'Net change')}
        </text>
      </svg>
      {showEquation && (
        <div className="carb-net-equation">
          <span>{s.left}</span>
          <b>⇌</b>
          <span>{s.right}</span>
        </div>
      )}
      <p className="carb-footnote">
        {route === 'bicarbonate-accepts' && s.progress >= 0.995 ? (
          'H₂CO₃ ⇌ CO₂(aq) + H₂O'
        ) : (
          <>
            {say('电荷守恒', 'Charge conserved')}: {s.charges.before.join(' + ')} ={' '}
            {s.charges.after.join(' + ')}
          </>
        )}
      </p>
    </>
  );
}
function Equilibrium({ width, say }: { width: number; say: Say }) {
  return (
    <>
      <p className="carb-kicker">
        {say('另设的 0.010 mol/L 稀溶液', 'Separate 0.010 mol/L dilute solutions')}
      </p>
      <div
        className="carb-pool"
        aria-label={say(
          'CO₂溶解态与水和碳酸互相转化；两种含碳形式合并计入平衡',
          'Dissolved CO₂ and water interconvert with carbonic acid; both carbon forms enter the equilibrium account',
        )}
      >
        <span>CO₂(aq) + H₂O</span>
        <b>⇌</b>
        <span>H₂CO₃</span>
        <p>{say('合并计入同一碳酸池', 'One combined carbon pool')}</p>
      </div>
      <div className="carb-equilibrium">
        {(['carbonate', 'bicarbonate'] as CarbonateSalt[]).map((salt) => {
          const s = aqueousCarbonateState(salt, 0.001, 0.1);
          return (
            <div key={salt}>
              <strong>{formula(salt)}</strong>
              <p className="carb-ph">pH {s.pH.toFixed(2)}</p>
              <div className="carb-ph-scale">
                <i style={{ width: `${(s.pH / 14) * 100}%` }} />
                <b style={{ left: '50%' }} />
              </div>
              <p>OH⁻ &gt; H⁺</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
function Dilution({
  width,
  salt,
  factor,
  say,
}: {
  width: number;
  salt: CarbonateSalt;
  factor: number;
  say: Say;
}) {
  const s = aqueousCarbonateState(salt, 0.0001, 0.01 * factor),
    f = Math.log10(factor) / 2,
    cx = width / 2,
    bottom = 231,
    left = cx - (55 + f * 38),
    right = cx + (55 + f * 38),
    top = 95 - f * 50;
  return (
    <>
      <p className="carb-kicker">
        {formula(salt)} · {say('另设稀溶液', 'Separate dilute model')}
      </p>
      <svg
        viewBox={`0 0 ${width} 275`}
        role="img"
        aria-label={say(
          `加水至${factor.toFixed(0)}倍体积，总碳不变，pH${s.pH.toFixed(2)}`,
          `Volume increases ${factor.toFixed(0)} times; carbon is conserved, pH ${s.pH.toFixed(2)}`,
        )}
      >
        <path
          d={`M${cx - 55} 93V220Q${cx - 55} 231 ${cx} 231T${cx + 55} 220V93`}
          fill="none"
          stroke="#b7c5ac"
          strokeDasharray="3 5"
        />
        <path
          d={`M${left} ${top - 13}V219Q${left} ${bottom} ${cx} ${bottom}T${right} 219V${top - 13}`}
          fill="#bfd6c333"
          stroke="#94b4a1"
          strokeWidth="2"
        />
        <path
          d={`M${left + 2} ${top}H${right - 2}V218Q${right - 2} 229 ${cx} 229T${left + 2} 218Z`}
          fill="#c56795"
          opacity={s.indicator * 0.65}
        />
        <ellipse cx={cx} cy={top} rx={(right - left) / 2 - 2} ry="5" fill="#bfd6c3" opacity=".4" />
        {Array.from({ length: 12 }, (_, i) => {
          const u = ((i * 43) % 97) / 97,
            v = ((i * 31) % 83) / 83;
          return (
            <g
              key={i}
              transform={`translate(${left + 15 + u * (right - left - 30)} ${top + 17 + v * (205 - top)})`}
            >
              <circle r="6" fill="#788c65" stroke="#f6f3df" />
              <circle cx="6" cy="-5" r="2.5" fill="#c28572" />
            </g>
          );
        })}
        <text x={cx} y="22" textAnchor="middle">
          {say('体积', 'Volume')} × {factor.toFixed(factor < 10 ? 1 : 0)}
        </text>
        <text x={cx} y="264" textAnchor="middle">
          pH {s.pH.toFixed(2)} ·{' '}
          {say(
            s.indicator < 0.005 ? '近无色' : '淡显色',
            s.indicator < 0.005 ? 'No visible pink' : 'Faint indicator',
          )}
        </text>
      </svg>
      <div className="carb-conserved">
        <span>{say('总碳始终', 'Total carbon stays')}</span>
        <strong>0.100 mmol</strong>
      </div>
      <p className="carb-footnote">{say('粒子和体积均为示意。', 'Volume is schematic.')}</p>
    </>
  );
}
function Heating({
  width,
  salt,
  extent,
  say,
  uid,
}: {
  width: number;
  salt: CarbonateSalt;
  extent: number;
  say: Say;
  uid: string;
}) {
  const compact = width < 560,
    h = 295,
    bodyX = compact ? width * 0.6 : width * 0.54,
    mouthY = 124,
    receiverX = width - (compact ? 43 : 75),
    surface = 218,
    bottom = 273,
    s = carbonateHeating(salt, 1, extent),
    active = s.gasMoles > 0;
  const path = `M${bodyX - 18} ${mouthY}H${receiverX}V250`;
  return (
    <>
      <p className="carb-kicker">
        {formula(salt)} · {say('同一气路与石灰水', 'Same gas path and limewater')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          active
            ? '碳酸氢钠产生气体；连续导管通入液面下，水滴在冷端出现，石灰水浑浊'
            : '碳酸钠在教材条件下无明显分解；相同导管接石灰水，保持澄清',
          active
            ? 'Bicarbonate releases gas through a continuous tube below the limewater surface; droplets form in the cool region and limewater clouds'
            : 'Carbonate shows no appreciable decomposition under lesson conditions; limewater remains clear',
        )}
      >
        <defs>
          <linearGradient id={`${uid}-heatglass`}>
            <stop stopColor="#fff" stopOpacity=".5" />
            <stop offset=".5" stopColor="#c6dac5" stopOpacity=".08" />
            <stop offset="1" stopColor="#a1bcb0" stopOpacity=".3" />
          </linearGradient>
        </defs>
        <path
          d={`M12 253H${bodyX - 20}M27 252V66M27 84H${bodyX * 0.65}`}
          stroke="#8c9e86"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d={`M${bodyX} 104L61 78Q31 74 28 97T52 125L${bodyX} 146`}
          fill={`url(#${uid}-heatglass)`}
          stroke="#96b2a3"
          strokeWidth="2"
        />
        <path
          d={`M45 113Q66 106 ${Math.min(bodyX - 18, 130)} 130L54 122Z`}
          fill="#e6dfbf"
          stroke="#c5c5a8"
        />
        <path
          d={`M${bodyX * 0.55} 84q8-8 13 1v21q-4 8-11 1`}
          stroke="#7f9483"
          strokeWidth="4"
          fill="none"
        />
        <rect
          x={bodyX - 8}
          y="102"
          width="14"
          height="46"
          rx="4"
          fill="#a78d6d"
          transform={`rotate(8 ${bodyX} 124)`}
        />
        <path d={path} stroke="#99b5a6" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d={path} stroke="#edf0df" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path
          d={`M${receiverX - 34} 179V258Q${receiverX - 34} ${bottom} ${receiverX} ${bottom}T${receiverX + 34} 258V179`}
          stroke="#8da999"
          strokeWidth="2"
          fill="#c0d1bf22"
        />
        <path
          d={`M${receiverX - 32} ${surface}H${receiverX + 32}V257Q${receiverX + 32} 271 ${receiverX} 271T${receiverX - 32} 257Z`}
          fill="#fffdf1"
          opacity={active ? 0.15 + 0.75 * s.extent : 0.12}
        />
        <path d={`M${receiverX - 32} ${surface}H${receiverX + 32}`} stroke="#b6c7ad" />
        {active &&
          Array.from({ length: 5 }, (_, i) => {
            const f = (i / 5 + extent * 0.7) % 1;
            return (
              <circle
                key={i}
                cx={receiverX + Math.sin(i) * 4}
                cy={250 - (250 - surface) * f}
                r="3"
                fill="none"
                stroke="#8da995"
                opacity={(1 - f) * s.extent}
              />
            );
          })}
        {active &&
          Array.from({ length: 4 }, (_, i) => {
            const f = (extent + i / 4) % 1,
              L = receiverX - (bodyX - 18) + 126,
              d = f * L;
            return (
              <circle
                key={i}
                cx={d < receiverX - bodyX + 18 ? bodyX - 18 + d : receiverX}
                cy={d < receiverX - bodyX + 18 ? mouthY : mouthY + d - (receiverX - bodyX + 18)}
                r="2.5"
                fill="#a6b68e"
                opacity=".9"
              />
            );
          })}
        {active &&
          [0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${bodyX - 39 + i * 10} ${118 + i * 2}q-3 5 0 7q3-2 0-7`}
              fill="#91b7b2"
              opacity={s.extent}
            />
          ))}
        <path d="M60 202Q43 179 63 139Q60 172 78 180Q84 197 69 204Z" fill="#dab276" />
        <path d="M62 200Q55 184 65 171Q62 188 72 199Z" fill="#f4d797" />
        <rect x="48" y="205" width="36" height="31" rx="9" fill="#a6b79b" />
        <ellipse cx="65" cy="239" rx="27" ry="5" fill="#c4cbb0" />
        <text x="5" y="32">
          {say('加热', 'Heating')}
        </text>
        <text x={width - 3} y="289" textAnchor="end">
          {say(
            active ? '石灰水：浑浊' : '石灰水：澄清',
            active ? 'Limewater: cloudy' : 'Limewater: clear',
          )}
        </text>
      </svg>
    </>
  );
}
function ThermalAtoms({ width, p, say }: { width: number; p: number; say: Say }) {
  const s = carbonateThermalAtoms(width, p),
    end = p > 0.92;
  return (
    <>
      <p className="carb-kicker">{say('同一批原子 · 净分配', 'Net atom account')}</p>
      <svg
        viewBox={`0 0 ${s.width} ${s.height}`}
        role="img"
        aria-label={say(
          '两个钠、两个碳、两个氢、六个氧重新分配到碳酸钠、水与二氧化碳',
          'Two sodium, two carbon, two hydrogen and six oxygen atoms redistribute into carbonate, water and carbon dioxide',
        )}
      >
        <Atoms atoms={s.atoms} bonds={s.bonds} />
        {end && (
          <>
            <text x={s.solid.x} y={s.solid.y + 71} textAnchor="middle">
              Na₂CO₃
            </text>
            <text x={s.carbonDioxide.x} y={s.carbonDioxide.y - 27} textAnchor="middle">
              CO₂ ↑
            </text>
            <text x={s.water.x} y={s.water.y + 38} textAnchor="middle">
              H₂O ↑
            </text>
          </>
        )}
      </svg>
      <p className="carb-footnote">2 Na · 2 C · 2 H · 6 O</p>
    </>
  );
}
function Tray({ amount, id }: { amount: number; id: string }) {
  return (
    <svg viewBox="0 0 200 82" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop stopColor="#bfcab0" />
          <stop offset="1" stopColor="#879e8d" />
        </linearGradient>
      </defs>
      <path d="M20 50Q100 82 180 50L166 67Q100 91 34 67Z" fill={`url(#${id})`} />
      <ellipse cx="100" cy="49" rx="80" ry="19" fill="#e8ead7" stroke="#a3b79e" />
      <path
        d={`M38 49Q56 ${48 - amount * 30} 78 ${49 - amount * 22}Q107 ${48 - amount * 41} 131 ${49 - amount * 26}Q150 ${48 - amount * 13} 162 49Q100 66 38 49`}
        fill="#f9f3d8"
        stroke="#d4cfaf"
      />
    </svg>
  );
}
function Mass({
  width,
  extent,
  grams,
  comparison,
  reheat,
  say,
  uid,
}: {
  width: number;
  extent: number;
  grams: number;
  comparison: boolean;
  reheat: boolean;
  say: Say;
  uid: string;
}) {
  const s = carbonateHeating('bicarbonate', grams, extent);
  return (
    <>
      <p className="carb-kicker">NaHCO₃ · {grams.toFixed(3)} g</p>
      {comparison ? (
        <div className="carb-reheat">
          {[0.5, 1].map((x) => {
            const z = carbonateHeating('bicarbonate', grams, x);
            return (
              <figure key={x}>
                <figcaption>
                  {say(
                    x === 0.5 ? '半反应残渣' : '完全反应残渣',
                    x === 0.5 ? 'Half-converted' : 'Fully converted',
                  )}
                </figcaption>
                <Tray amount={z.residueGrams / (grams || 1)} id={`${uid}-${x}`} />
                <strong>{z.residueGrams.toFixed(3)} g</strong>
                <p>
                  {say(
                    reheat ? '再加热可失去' : '未反应 NaHCO₃',
                    reheat ? 'Further possible loss' : 'Unreacted NaHCO₃',
                  )}
                  <br />
                  {(reheat ? z.furtherLossGrams : z.unreactedGrams).toFixed(3)} g
                </p>
              </figure>
            );
          })}
        </div>
      ) : (
        <>
          <div className="carb-mass-tray">
            <Tray amount={s.residueGrams / (grams || 1)} id={uid} />
            <strong>
              {say('残渣', 'Residue')} {s.residueGrams.toFixed(3)} g
            </strong>
          </div>
          <div
            className="carb-mass-track"
            aria-label={say('质量在四份之间分配', 'Mass is divided into four parts')}
          >
            {[s.unreactedGrams, s.carbonateGrams, s.waterGrams, s.carbonDioxideGrams].map(
              (g, i) => (
                <i key={i} style={{ width: `${grams ? (100 * g) / grams : 0}%` }} />
              ),
            )}
          </div>
          <div className="carb-mass-rows">
            <span>{say('未反应 NaHCO₃', 'Unreacted NaHCO₃')}</span>
            <b>{s.unreactedGrams.toFixed(3)} g</b>
            <span>Na₂CO₃</span>
            <b>{s.carbonateGrams.toFixed(3)} g</b>
            <span>H₂O ↑</span>
            <b>{s.waterGrams.toFixed(3)} g</b>
            <span>CO₂ ↑</span>
            <b>{s.carbonDioxideGrams.toFixed(3)} g</b>
          </div>
        </>
      )}
      <p className="carb-footnote">
        {say(
          reheat
            ? '恒重是完成的线索，不能单独证明纯度。'
            : comparison
              ? '相同初始质量，不同转化程度。'
              : '合计 = 初始质量',
          reheat
            ? 'Constant mass alone does not prove purity.'
            : comparison
              ? 'Same initial mass, different conversion.'
              : 'Total = initial mass',
        )}
      </p>
    </>
  );
}
export default function ChemCarbonateComparison() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    uid = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say: Say = (a, b) => (en ? b : a);
  const [view, setView] = useState(film.variant === 'thermal' ? 'heat' : 'proton'),
    [salt, setSalt] = useState<CarbonateSalt>('bicarbonate'),
    [progress, setProgress] = useState(0.6),
    [mass, setMass] = useState(1),
    [factor, setFactor] = useState(1),
    [route, setRoute] = useState<ProtonRoute>('carbonate-accepts');
  const d = carbonateDirector(
      film.chapter,
      film.chapterProgress,
      film.chapterTime,
      en ? 'en' : 'zh',
    ),
    watch = film.watch;
  const shot = watch
    ? d.chapter === 0
      ? 'samples'
      : d.chapter === 1
        ? 'energy'
        : d.chapter === 2
          ? 'indicator'
          : d.chapter === 3
            ? d.equilibrium
              ? 'equilibrium'
              : 'proton'
            : d.chapter === 4
              ? 'dilution'
              : d.chapter === 6 && d.thermalAtoms
                ? 'atoms'
                : d.chapter === 7
                  ? 'mass'
                  : 'heat'
    : view;
  return (
    <section
      className="chem-carbonate-comparison"
      data-watch={watch}
      data-shot={shot}
      data-compact={width < 560}
    >
      <div ref={host} className="carb-canvas">
        {(shot === 'samples' || shot === 'indicator') && (
          <Samples
            width={width}
            stage={watch ? d.stage : progress}
            indicator={shot === 'indicator'}
            model={watch && d.modelComparison}
            say={say}
            uid={uid}
          />
        )}
        {shot === 'energy' && (
          <Energy
            width={width}
            p={watch ? d.energyProgress : progress}
            salt={watch ? d.energySalt : salt}
            say={say}
          />
        )}
        {shot === 'proton' && (
          <Proton
            width={width}
            showEquation={!watch}
            route={watch ? d.protonRoute : route}
            progress={watch ? d.protonProgress : progress}
            say={say}
          />
        )}
        {shot === 'equilibrium' && <Equilibrium width={width} say={say} />}
        {shot === 'dilution' && (
          <Dilution
            width={width}
            salt={watch ? 'bicarbonate' : salt}
            factor={watch ? d.dilutionFactor : factor}
            say={say}
          />
        )}
        {shot === 'heat' && (
          <Heating
            width={width}
            salt={watch ? d.salt : salt}
            extent={watch ? d.extent : progress}
            say={say}
            uid={uid}
          />
        )}
        {shot === 'atoms' && (
          <ThermalAtoms width={width} p={watch ? d.atomProgress : progress} say={say} />
        )}
        {shot === 'mass' && (
          <Mass
            width={width}
            extent={watch ? d.extent : progress}
            grams={watch ? 1 : mass}
            comparison={watch && d.massComparison}
            reheat={watch && d.reheating}
            say={say}
            uid={uid}
          />
        )}
      </div>
      {!watch && (
        <div className="carb-controls">
          <Segments
            label={say('探索什么', 'Explore')}
            value={view}
            onChange={setView}
            options={[
              { value: 'samples', label: say('教材加水', 'Water') },
              { value: 'energy', label: say('能量收支', 'Energy') },
              { value: 'proton', label: say('质子转移', 'Protons') },
              { value: 'equilibrium', label: say('平衡', 'Equilibrium') },
              { value: 'dilution', label: say('稀释预测', 'Dilution') },
              { value: 'heat', label: say('加热', 'Heating') },
              { value: 'atoms', label: say('原子去向', 'Atoms') },
              { value: 'mass', label: say('质量预测', 'Mass') },
            ]}
          />
          {['energy', 'dilution', 'heat'].includes(view) && (
            <Segments
              label={say('盐类', 'Salt')}
              value={salt}
              onChange={setSalt}
              options={[
                { value: 'carbonate', label: 'Na₂CO₃' },
                { value: 'bicarbonate', label: 'NaHCO₃' },
              ]}
            />
          )}
          {view === 'proton' && (
            <Segments
              label={say('净交换', 'Net transfer')}
              value={route}
              onChange={setRoute}
              options={[
                { value: 'carbonate-accepts', label: say('CO₃²⁻ 接受', 'CO₃²⁻ accepts') },
                { value: 'bicarbonate-accepts', label: say('HCO₃⁻ 接受', 'HCO₃⁻ accepts') },
                { value: 'bicarbonate-donates', label: say('HCO₃⁻ 给出', 'HCO₃⁻ donates') },
              ]}
            />
          )}
          {!['dilution', 'equilibrium'].includes(view) && (
            <Range
              label={say(
                view === 'proton' ? '净转移图进度' : '模型进度',
                view === 'proton' ? 'Net-map progress' : 'Model progress',
              )}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {view === 'dilution' && (
            <Range
              label={say('加水后的体积倍数', 'Volume after dilution')}
              value={factor}
              min={1}
              max={100}
              step={1}
              unit="×"
              onChange={setFactor}
            />
          )}
          {view === 'mass' && (
            <Range
              label={say('初始质量', 'Initial mass')}
              value={mass}
              min={0.2}
              max={2}
              step={0.1}
              unit="g"
              onChange={setMass}
            />
          )}
        </div>
      )}
      <details className="carb-limits">
        <summary>{say('模型与边界', 'Model and limits')}</summary>
        <p>
          {say(
            '教材各约1g固体的加水和显色只作定性对照。pH另设25°C等浓度稀溶液，不是教材配方实测；假定理想活度、封闭体系，计入水、碳酸氢根、碳酸根与CO₂(aq)/H₂CO₃合并池。钠与总碳守恒。',
            'Water and indicator observations for the textbook’s approximately 1 g samples are qualitative. Calculated pH belongs to a separate dilute 25°C model, not measurements of that recipe. Ideal activities and a closed system are assumed, including water, bicarbonate, carbonate and the combined CO₂(aq)/H₂CO₃ pool. Sodium and total carbon are conserved.',
          )}
        </p>
        <p>
          {say(
            '质子路径与热解原子图表示净变化，不是实际分子运动或基元机理；键线只表示原子相邻，省略键级和电子分布。水合能量箭头没有热量刻度；热解程度不是时间或温度模型。碳酸钠稳定限于教材条件；石灰水限定少量CO₂阶段。酚酞色调不是浓度计。',
            'Proton paths and thermal atom maps show net changes, not molecular trajectories or elementary mechanisms; bond lines show adjacency, omitting bond orders and electron distributions. Energy arrows are not calibrated; reaction extent does not predict heating time or temperature. Carbonate stability refers to the textbook conditions; limewater depicts a small CO₂ dose. Indicator colour is not a concentration meter.',
          )}
        </p>
      </details>
    </section>
  );
}
