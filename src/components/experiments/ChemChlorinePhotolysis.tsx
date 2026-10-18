import { useEffect, useId, useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  chlorinePhotolysis,
  photolysisTrace,
  photolysisHeadspaces,
  photolysisEvent,
  photolysisNet,
  photolysisFilm,
  TEXTBOOK_PHOTOLYSIS_DIRECTIONS,
  type PhotoAtom,
  type PhotoBond,
} from '../../models/chem-chlorine-photolysis';
import '../../styles/chem-chlorine-photolysis.css';
const ink = '#42594c',
  oxygen = '#b37948',
  chloride = '#718e67',
  hydrogen = '#c2aa83';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const atomColour = { H: hydrogen, O: oxygen, Cl: chloride };
function PhotoAtoms({
  atoms,
  bonds,
  id,
  hydrated = false,
}: {
  atoms: PhotoAtom[];
  bonds: PhotoBond[];
  id: string;
  hydrated?: boolean;
}) {
  return (
    <>
      <defs>
        {(['H', 'O', 'Cl'] as const).map((element) => (
          <radialGradient key={element} id={`${id}-${element}`} cx="30%" cy="22%">
            <stop stopColor="#fff9e5" />
            <stop offset=".45" stopColor={atomColour[element]} stopOpacity=".48" />
            <stop offset="1" stopColor={atomColour[element]} stopOpacity=".8" />
          </radialGradient>
        ))}
      </defs>
      {bonds.map((b) => {
        const a = atoms.find((a) => a.id === b.a)!,
          z = atoms.find((a) => a.id === b.b)!;
        return (
          <path
            key={`${b.a}/${b.b}`}
            data-bond={`${b.a}/${b.b}`}
            d={`M${a.x} ${a.y}L${z.x} ${z.y}`}
            stroke="#9ca88a"
            strokeWidth="7"
            strokeLinecap="round"
            opacity={b.opacity}
          />
        );
      })}
      {atoms.map((a) => (
        <g
          key={a.id}
          data-atom={a.id}
          data-element={a.element}
          data-charge={a.charge}
          transform={`translate(${a.x} ${a.y})`}
        >
          {hydrated && a.element === 'H' && (
            <circle r={a.radius + 7} fill="none" stroke="#a4c7c0" strokeWidth="6" opacity=".45" />
          )}
          <circle
            r={a.radius}
            fill={`url(#${id}-${a.element})`}
            stroke={atomColour[a.element]}
            strokeWidth="1.3"
          />
          <path
            d={`M${-a.radius * 0.55} ${-a.radius * 0.35}Q${-a.radius * 0.3} ${-a.radius * 0.7} ${a.radius * 0.1} ${-a.radius * 0.66}`}
            fill="none"
            stroke="#fffced"
            strokeOpacity=".65"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text x="0" y="5.6" textAnchor="middle">
            {a.element}
            {a.charge > 0 ? '⁺' : a.charge < 0 ? '⁻' : ''}
          </text>
        </g>
      ))}
    </>
  );
}
function PhotoElectrons({
  electrons,
}: {
  electrons: ReturnType<typeof photolysisEvent>['electrons'];
}) {
  return (
    <>
      {electrons.map((e) => (
        <g key={e.id} data-electron={e.id} data-electron-owner={e.owner}>
          <circle cx={e.x} cy={e.y} r="6" fill="#f8f4de" opacity=".85" />
          <circle cx={e.x} cy={e.y} r="3.1" fill="#425e70" />
        </g>
      ))}
    </>
  );
}
export function PhotoSensors({ width, probe = 3 }: { width: number; probe?: number }) {
  const narrow = width < 500,
    bw = narrow ? width : 330,
    h = narrow ? 224 : 250,
    left = bw * 0.13,
    right = bw * 0.75,
    neckLeft = bw * 0.2,
    neckRight = bw * 0.68,
    top = 47,
    liquidY = 119,
    bottom = 195,
    probes = [
      { x: bw * 0.26, end: 161, c: '#a17c78', label: 'pH' },
      { x: bw * 0.43, end: 178, c: chloride, label: 'Cl⁻' },
      { x: bw * 0.59, end: 87, c: oxygen, label: 'O₂ / %' },
    ];
  return (
    <div className="cpl-sensors">
      <div className="cpl-kicker">{say('教材观察方向', 'Textbook observed trends')}</div>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={say(
          '两支探头在液体中，一支在气相中；固定教材观察为pH下降、氯离子增加、氧气比例增加',
          'Two probes in liquid and one in headspace; fixed textbook trends are falling pH, rising chloride and rising oxygen fraction',
        )}
      >
        <defs>
          <linearGradient id="cpl-glass" x1="0" x2="1">
            <stop stopColor="#a2b6a8" stopOpacity=".18" />
            <stop offset=".35" stopColor="#fffef0" stopOpacity=".55" />
            <stop offset="1" stopColor="#90a891" stopOpacity=".16" />
          </linearGradient>
        </defs>
        <path
          d={`M${neckLeft} ${top}V66Q${neckLeft} 74 ${left} 84V${bottom - 16}Q${left} ${bottom} ${left + 17} ${bottom}H${right - 17}Q${right} ${bottom} ${right} ${bottom - 16}V84Q${neckRight} 74 ${neckRight} 66V${top}`}
          fill="url(#cpl-glass)"
          stroke="#94a48c"
          strokeWidth="2"
        />
        <path
          d={`M${left + 2} ${liquidY}H${right - 2}V${bottom - 16}Q${right - 2} ${bottom - 2} ${right - 17} ${bottom - 2}H${left + 17}Q${left + 2} ${bottom - 2} ${left + 2} ${bottom - 16}Z`}
          fill="#b2c481"
          opacity=".28"
        />
        <ellipse
          cx={(left + right) / 2}
          cy={liquidY}
          rx={(right - left) / 2 - 2}
          ry="5"
          fill="#acbd84"
          opacity=".28"
        />
        <rect
          x={neckLeft - 4}
          y={top - 6}
          width={neckRight - neckLeft + 8}
          height="12"
          rx="4"
          fill="#99ac91"
        />
        <path
          d={`M${left + 11} 90V177`}
          stroke="#fffdf1"
          strokeOpacity=".6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {probes.map((p, i) => {
          const active = probe === i || probe === 3,
            recorderX = bw - 42;
          return (
            <g key={p.label} data-probe={i} data-phase={TEXTBOOK_PHOTOLYSIS_DIRECTIONS[i].phase}>
              <path
                d={`M${p.x} ${top}V${p.end}`}
                stroke={p.c}
                strokeWidth="7"
                strokeLinecap="round"
                opacity={active ? 1 : 0.45}
              />
              <path
                d={`M${p.x} ${top - 5}V${15 + i * 8}Q${p.x} ${10 + i * 8} ${p.x + 8} ${10 + i * 8}H${recorderX + i * 9}V${50 + i * 13}`}
                stroke={p.c}
                strokeWidth={active ? 2.3 : 1.3}
                fill="none"
                opacity={active ? 1 : 0.45}
              />
              <circle cx={p.x} cy={p.end} r="5.5" fill="#f6f3dd" stroke={p.c} strokeWidth="2" />
              {active && (
                <circle cx={p.x} cy={p.end} r="10" fill="none" stroke={p.c} opacity=".45" />
              )}
              <text x={p.x} y={i === 2 ? 108 : 219} textAnchor="middle" fill={p.c}>
                {p.label}
              </text>
              {!narrow && (
                <g transform={`translate(${width * 0.58} ${35 + i * 68})`}>
                  <text y="0" fill={p.c}>
                    {p.label} {probe >= i ? (i === 0 ? '↓' : '↑') : '—'}
                  </text>
                  <path d={`M0 19H${width * 0.34}`} stroke="#9eaa94" opacity=".35" />
                  {probe >= i && (
                    <path
                      d={`M0 ${i === 0 ? 9 : 28}C${width * 0.1} ${i === 0 ? 10 : 24} ${width * 0.18} ${i === 0 ? 29 : 9} ${width * 0.34} ${i === 0 ? 30 : 7}`}
                      stroke={p.c}
                      strokeWidth="2.4"
                      fill="none"
                    />
                  )}
                </g>
              )}
            </g>
          );
        })}
        <rect x={bw - 49} y="49" width="39" height="49" rx="7" fill="#c9d2bd" stroke="#94a48c" />
        <path
          d={`M${bw - 42} 87l7-9 5 4 8-18 5 5`}
          fill="none"
          stroke="#6e8870"
          strokeWidth="1.8"
        />
        <path d={`M8 111L${left - 6} 124V161L8 173Z`} fill="#cad0b5" stroke="#9ca78b" />
        <path
          d={`M${left - 6} 124L${left + 18} 105V181L${left - 6} 161Z`}
          fill="#e6d89b"
          opacity=".4"
        />
      </svg>
      {narrow && (
        <div className="cpl-trends">
          {probes.map((p, i) => (
            <span key={p.label} style={{ color: p.c }}>
              {p.label} <b>{probe >= i ? (i === 0 ? '↓' : '↑') : '—'}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
export function PhotoEvent({
  width,
  time,
  absorbed = true,
}: {
  width: number;
  time: number;
  absorbed?: boolean;
}) {
  const s = photolysisEvent(time, width),
    state = absorbed ? s : photolysisEvent(time, width, false),
    id = useId().replace(/:/g, '');
  return (
    <div className="cpl-event" data-photo-event={state.radicals ? 'radicals' : 'molecule'}>
      <div className="cpl-kicker">
        {say('紫外 · 不可见 · 选定事件', 'UV · invisible · selected event')}
      </div>
      <svg
        viewBox={`0 0 ${state.width} ${state.height}`}
        style={{ height: state.height }}
        role="img"
        aria-label={
          state.radicals
            ? say(
                '氧氯键已均裂，氢氧仍相连，两个中性片段各保留一个选定电子',
                'The oxygen–chlorine bond has split homolytically; hydrogen remains joined to oxygen, and each neutral fragment retains one selected electron',
              )
            : say(
                '六原子样本，追踪一条氧氯键及其两个成键电子',
                'A six-atom sample; track one oxygen–chlorine bond and its two bonding electrons',
              )
        }
      >
        <ellipse
          cx={width * 0.52}
          cy={state.height * 0.64}
          rx={width * 0.46}
          ry={state.height * 0.34}
          fill="#e0e6d2"
          opacity=".45"
        />
        {state.photon.absorptionHalo > 0 && (
          <circle
            cx={state.photon.targetX}
            cy={state.photon.targetY}
            r={20 + 13 * state.photon.absorptionHalo}
            fill="none"
            stroke="#586d79"
            strokeWidth="2"
            strokeDasharray="3 5"
            opacity={state.photon.absorptionHalo}
          />
        )}
        <PhotoAtoms atoms={state.atoms} bonds={state.bonds} id={id} />
        <PhotoElectrons electrons={state.electrons} />
        {state.photon.visible && (
          <g
            data-uv-photon="invisible-representation"
            transform={`translate(${state.photon.x} ${state.photon.y}) rotate(28)`}
          >
            <path
              d="M-18 0q3-8 6 0t6 0t6 0t6 0t6 0"
              fill="none"
              stroke="#516a77"
              strokeWidth="2.3"
            />
            <path d="M-14-9l5 3m4-6l5 3m4-6l5 3" stroke="#71818a" opacity=".65" />
          </g>
        )}
        {state.radicals && (
          <>
            <text x={width * 0.25} y={state.atoms[0].y + 40} textAnchor="middle">
              HO·
            </text>
            <text x={state.atoms[2].x} y={state.atoms[2].y + 40} textAnchor="middle">
              Cl·
            </text>
          </>
        )}
        <text x={width * 0.6} y={state.height - 6} textAnchor="middle">
          HOCl
        </text>
      </svg>
      <div className="cpl-evidence">
        {!absorbed
          ? say('未吸收：这条键未变', 'Unabsorbed: this bond stays intact')
          : state.radicals
            ? say(
                '两个中性片段 · 各有一个未成对电子',
                'Neutral fragments · one unpaired electron each',
              )
            : state.photon.absorbed
              ? say('先吸收，再分开', 'Absorb first, then separate')
              : say('氢—氧仍相连', 'Hydrogen stays joined to oxygen')}
      </div>
    </div>
  );
}
export function PhotoNet({
  width,
  time,
  ratio = false,
}: {
  width: number;
  time: number;
  ratio?: boolean;
}) {
  const s = photolysisNet(time, width),
    id = useId().replace(/:/g, ''),
    O = s.atoms.filter((a) => a.element === 'O');
  return (
    <div className="cpl-net" data-net-lens={s.lens} data-headspace-oxygen={s.oxygen.headspace}>
      <div className="cpl-kicker">
        {s.lens === 'initial-channel'
          ? say('后续多步反应', 'Further reactions')
          : say('净变化 · 中间步骤省略', 'Net change · steps merged')}
      </div>
      <svg
        viewBox={`0 0 ${s.width} ${s.height}`}
        style={{ height: s.height }}
        role="img"
        aria-label={say(
          '同一批六原子的净去向，氧气全部越过液面后才计入顶空；液相氢离子和氯离子总电荷为零',
          'Net destinations of the same six atoms: oxygen counts in the headspace only after its entire drawing clears the surface; aqueous hydrogen and chloride ions have zero total charge',
        )}
      >
        {s.showPhase && (
          <>
            <path
              d={`M8 ${s.liquidY}Q${width / 2} ${s.liquidY - 5} ${width - 8} ${s.liquidY}V${s.height - 2}H8Z`}
              fill="#b7c7ad"
              opacity=".2"
            />
            <path
              d={`M8 ${s.liquidY}H${width - 8}`}
              stroke="#9cb9ad"
              opacity=".55"
              strokeDasharray="3 4"
            />
          </>
        )}
        <PhotoAtoms atoms={s.atoms} bonds={s.bonds} id={id} hydrated={s.productReady} />
        {s.showSelectedElectrons && <PhotoElectrons electrons={s.electrons} />}
        {s.productReady && (
          <text x={O[1].x + O[1].radius + 10} y={O[1].y + 6}>
            O₂
          </text>
        )}
        {s.showPhase && (
          <text x="10" y={s.liquidY - 10}>
            {say('气', 'Gas')}
          </text>
        )}
      </svg>
      {ratio ? (
        <div className="cpl-ratio">
          Δn(Cl⁻) : Δn(O₂) = <strong>2 : 1</strong>
        </div>
      ) : (
        <>
          <div className="cpl-atom-inventory">
            H 2 · O 2 · Cl 2 <span>{say('总电荷', 'Charge')} 0</span>
          </div>
          {s.productReady && (
            <div className="cpl-transit-ledger">
              <span>
                {say('O₂ 生成', 'O₂ formed')} <b>{s.oxygen.produced}</b>
              </span>
              <span>
                {say('未入气相', 'Not in gas')} <b>{s.oxygen.notHeadspace}</b>
              </span>
              <span>
                {say('气相', 'Gas')} <b>{s.oxygen.headspace}</b>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
type ScaleChannel = 'pH' | 'chloride' | 'oxygen';
export function PhotoScale({
  width,
  channel,
  extent = 1,
  illuminated = true,
}: {
  width: number;
  channel: ScaleChannel;
  extent?: number;
  illuminated?: boolean;
}) {
  const m = chlorinePhotolysis(extent, 500, illuminated),
    trace = photolysisTrace(extent, 500, illuminated),
    config =
      channel === 'pH'
        ? { key: 'pH' as const, min: 1.4, max: 2.2, label: 'pH', decimals: 2, c: '#9b706c' }
        : {
            key: 'chlorideMgL' as const,
            min: 200,
            max: 1000,
            label: 'Cl⁻ / mg·L⁻¹',
            decimals: 0,
            c: chloride,
          },
    x0 = 42,
    x1 = width - 14,
    top = 30,
    bottom = width < 500 ? 142 : 180,
    yy = (v: number) => bottom - ((v - config.min) / (config.max - config.min)) * (bottom - top);
  if (channel === 'oxygen') {
    const all = m.finalGasMoles,
      initial = m.initialOxygen,
      fresh = m.oxygen;
    return (
      <div className="cpl-scale cpl-fraction">
        <div className="cpl-kicker">
          {say('算例 · 氧气比例的分母', 'Calculated example · the denominator')}
        </div>
        <div className="cpl-fraction-row">
          <span>O₂</span>
          <b>{((initial + fresh) * 1000).toFixed(2)} mmol</b>
        </div>
        <div className="cpl-amount-bar">
          <i style={{ width: `${(100 * initial) / all}%`, background: '#bd9a6a' }} />
          <i style={{ width: `${(100 * fresh) / all}%`, background: oxygen }} />
        </div>
        <div className="cpl-fraction-rule" />
        <div className="cpl-fraction-row">
          <span>{say('全部气体', 'All gas')}</span>
          <b>{(all * 1000).toFixed(2)} mmol</b>
        </div>
        <div className="cpl-amount-bar">
          <i style={{ width: `${(100 * m.initialGasMoles) / all}%`, background: '#a8b5a3' }} />
          <i style={{ width: `${(100 * fresh) / all}%`, background: oxygen }} />
        </div>
        <div className="cpl-fraction-result">
          = <strong>{m.oxygenPercent.toFixed(2)}%</strong>
        </div>
        <div className="cpl-evidence">
          <i className="cpl-key-dot" />
          {say('新增 O₂ 同时进入分子与分母', 'New O₂ enters both counts')}
        </div>
      </div>
    );
  }
  return (
    <div className="cpl-scale">
      <div className="cpl-kicker">
        {say('算例 · 非实测', 'Calculated example · not measurements')}
      </div>
      <div className="cpl-reading">
        <span>{config.label}</span>
        <strong style={{ color: config.c }}>{m[config.key].toFixed(config.decimals)}</strong>
      </div>
      <svg
        viewBox={`0 0 ${width} ${bottom + 29}`}
        style={{ height: bottom + 29 }}
        role="img"
        aria-label={`${config.label}; ${say('横轴为归一化净反应进程，不是时间', 'the horizontal axis is normalized net extent, not time')}`}
      >
        <path d={`M${x0} ${top - 8}V${bottom}H${x1}`} stroke="#8ea18d" fill="none" />
        {[config.min, (config.min + config.max) / 2, config.max].map((v) => (
          <g key={v}>
            <path d={`M${x0} ${yy(v)}H${x1}`} stroke="#9eae96" opacity=".3" />
            <text x={x0 - 7} y={yy(v) + 5} textAnchor="end">
              {channel === 'pH' ? v.toFixed(1) : v}
            </text>
          </g>
        ))}
        <path
          d={trace
            .map(
              (q, i) => `${i ? 'L' : 'M'}${x0 + ((x1 - x0) * m.p * i) / 60} ${yy(q[config.key])}`,
            )
            .join(' ')}
          stroke={config.c}
          strokeWidth="2.8"
          fill="none"
        />
        <circle cx={x0 + (x1 - x0) * m.p} cy={yy(m[config.key])} r="5" fill={config.c} />
        <text x={x0} y={bottom + 23}>
          0
        </text>
        <text x={x1} y={bottom + 23} textAnchor="end">
          1
        </text>
      </svg>
      <div className="cpl-evidence">
        {channel === 'pH'
          ? 'pH = −log₁₀[H⁺]'
          : say('横轴：归一化净反应进程', 'Axis: normalized net extent')}
      </div>
    </div>
  );
}
export function PhotoComparison({
  width,
  extent = 1,
  secondMl = 1000,
  mixing = 1,
  revealGas = true,
  revealLiquid = true,
}: {
  width: number;
  extent?: number;
  secondMl?: number;
  mixing?: number;
  revealGas?: boolean;
  revealLiquid?: boolean;
}) {
  const { A, B } = photolysisHeadspaces(extent, secondMl),
    narrow = width < 500,
    bottom = narrow ? 149 : 224,
    liquidY = bottom - 36,
    bottleWidth = narrow ? 92 : 180,
    h = narrow ? 163 : 240,
    mixP = Math.max(0, Math.min(1, mixing));
  return (
    <div className="cpl-comparison" data-gas-answer={revealGas} data-liquid-answer={revealLiquid}>
      <div className="cpl-kicker">
        {say('两份独立样品 · 等量新增 O₂', 'Separate samples · equal new O₂')}
      </div>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={say(
          'A与B独立样品的液体相同，新增氧气相同；比较不同初始气体体积',
          'Independent A and B samples have equal liquid volumes and equal newly generated oxygen; compare different initial gas volumes',
        )}
      >
        {[A, B].map((s, i) => {
          const cx = width * (i ? 0.75 : 0.25),
            gasHeight = ((narrow ? 64 : 130) * s.headspaceMl) / 1000,
            top = liquidY - gasHeight,
            left = cx - bottleWidth / 2,
            right = cx + bottleWidth / 2,
            cy = liquidY + 17 + (top + gasHeight / 2 - liquidY - 17) * mixP,
            rows = Math.max(1, Math.round(gasHeight / 24));
          return (
            <g key={i} data-independent-sample={i ? 'B' : 'A'}>
              <text x={cx} y="18" textAnchor="middle">
                {i ? 'B' : 'A'}
              </text>
              <text x={cx} y="40" textAnchor="middle">
                {s.headspaceMl.toFixed(0)} mL
              </text>
              <path
                d={`M${left + 7} ${top}Q${left} ${top} ${left} ${top + 9}V${bottom - 13}Q${left} ${bottom} ${left + 13} ${bottom}H${right - 13}Q${right} ${bottom} ${right} ${bottom - 13}V${top + 9}Q${right} ${top} ${right - 7} ${top}Z`}
                fill="#d1dccc"
                fillOpacity=".2"
                stroke="#9aab91"
                strokeWidth="1.5"
              />
              <path
                d={`M${left + 2} ${liquidY}H${right - 2}V${bottom - 13}Q${right - 2} ${bottom - 2} ${right - 13} ${bottom - 2}H${left + 13}Q${left + 2} ${bottom - 2} ${left + 2} ${bottom - 13}Z`}
                fill="#b4c49e"
                opacity=".3"
              />
              {Array.from({ length: rows * 3 }, (_, j) => (
                <circle
                  key={j}
                  cx={left + 16 + ((j % 3) * (bottleWidth - 32)) / 2}
                  cy={top + 12 + (Math.floor(j / 3) * (gasHeight - 24)) / Math.max(1, rows - 1)}
                  r="2"
                  fill="#849b89"
                  opacity=".3"
                />
              ))}
              {s.oxygen > 0 && (
                <path d={`M${cx - 12} ${cy}H${cx + 12}`} stroke={oxygen} strokeWidth="4" />
              )}
              {s.oxygen > 0 &&
                [-1, 1].map((side, j) => (
                  <g key={side} data-comparison-atom={`sample-${i ? 'B' : 'A'}-O${j}`}>
                    <circle cx={cx + side * 12} cy={cy} r="11" fill="#d1ad7e" stroke={oxygen} />
                    <text x={cx + side * 12} y={cy + 5.5} textAnchor="middle">
                      O
                    </text>
                  </g>
                ))}
            </g>
          );
        })}
      </svg>
      <div className="cpl-comparison-values">
        <span>
          {narrow ? 'A · ' : 'A · O₂ '}
          <b>{revealGas ? `${A.oxygenPercent.toFixed(2)}%` : '?'}</b>
        </span>
        <span>
          {narrow ? 'B · ' : 'B · O₂ '}
          <b>{revealGas ? `${B.oxygenPercent.toFixed(2)}%` : '?'}</b>
        </span>
      </div>
      <div className="cpl-comparison-liquid">
        {revealLiquid ? (
          <span>
            {say('同值', 'Both')}: pH {A.pH.toFixed(2)} · Cl⁻ {A.chlorideMgL.toFixed(1)} mg/L
          </span>
        ) : (
          <span>pH · Cl⁻ : ?</span>
        )}
      </div>
      <div className="cpl-evidence">
        {say('各 100 mL', 'Each 100 mL')} · +{(A.oxygen * 1000).toFixed(2)} mmol O₂
      </div>
    </div>
  );
}
export default function ChemChlorinePhotolysis() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(258),
    [view, setView] = useState('sensors'),
    [progress, setProgress] = useState(1),
    [absorbed, setAbsorbed] = useState(true),
    [extent, setExtent] = useState(1),
    [light, setLight] = useState(true),
    [headspace, setHeadspace] = useState(1000),
    [answer, setAnswer] = useState(false),
    [channel, setChannel] = useState<ScaleChannel>('pH');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const update = () => setWidth(Math.max(250, Math.min(760, el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const d = photolysisFilm(film.chapter, film.chapterTime, browserLocale()),
    active = film.watch ? ['sensors', 'event', 'net', 'scales', 'compare'][d.chapter] : view,
    time = film.watch
      ? active === 'event'
        ? d.eventTime
        : d.netTime
      : progress * (active === 'event' ? 32 : 34),
    scaleChannel = film.watch
      ? d.shot === 'pH-scale'
        ? 'pH'
        : d.shot === 'chloride-scale'
          ? 'chloride'
          : 'oxygen'
      : channel;
  return (
    <section
      className="cpl"
      data-watch={film.watch}
      data-photo-view={active}
      data-photo-shot={film.watch ? d.shot : 'explore'}
    >
      <div className="cpl-stage" ref={host}>
        {active === 'sensors' && <PhotoSensors width={width} probe={film.watch ? d.probe : 3} />}
        {active === 'event' && (
          <PhotoEvent width={width} time={time} absorbed={film.watch || absorbed} />
        )}
        {active === 'net' && <PhotoNet width={width} time={time} />}
        {active === 'scales' &&
          (film.watch && d.shot === 'count-ratio' ? (
            <PhotoNet width={width} time={34} ratio />
          ) : (
            <PhotoScale
              width={width}
              channel={scaleChannel}
              extent={film.watch ? 1 : extent}
              illuminated={film.watch || light}
            />
          ))}
        {active === 'compare' && (
          <PhotoComparison
            width={width}
            extent={film.watch ? 1 : extent}
            secondMl={film.watch ? 1000 : headspace}
            mixing={film.watch ? d.comparisonMix : answer ? 1 : 0}
            revealGas={film.watch ? d.revealGas : answer}
            revealLiquid={film.watch ? d.revealLiquid : answer}
          />
        )}
      </div>
      {!film.watch && (
        <div className="cpl-controls">
          <Segments
            label={say('探索视角', 'Explore')}
            value={view}
            options={[
              { value: 'sensors', label: say('探头', 'Probes') },
              { value: 'event', label: say('断键', 'Bond') },
              { value: 'net', label: say('去向', 'Atoms') },
              { value: 'scales', label: say('读数', 'Scales') },
              { value: 'compare', label: say('预测', 'Predict') },
            ]}
            onChange={setView}
          />
          {['event', 'net'].includes(active) && (
            <Range
              label={say('逐步追踪', 'Follow the steps')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {active === 'event' && (
            <Segments
              label={say('选择一个事件', 'Select an event')}
              value={absorbed ? 'absorbed' : 'pass'}
              options={[
                { value: 'absorbed', label: say('吸收并解离', 'Absorb and dissociate') },
                { value: 'pass', label: say('未吸收', 'Unabsorbed') },
              ]}
              onChange={(v) => setAbsorbed(v === 'absorbed')}
            />
          )}
          {active === 'scales' && (
            <>
              <Segments
                label={say('测量量', 'Measurement')}
                value={channel}
                options={[
                  { value: 'pH', label: 'pH' },
                  { value: 'chloride', label: 'Cl⁻' },
                  { value: 'oxygen', label: 'O₂ / %' },
                ]}
                onChange={(v) => setChannel(v as ScaleChannel)}
              />
              <Segments
                label={say('独立模型样品', 'Independent model sample')}
                value={light ? 'light' : 'dark'}
                options={[
                  { value: 'light', label: say('光照净模型', 'Illuminated net model') },
                  { value: 'dark', label: say('理想避光对照', 'Ideal dark control') },
                ]}
                onChange={(v) => setLight(v === 'light')}
              />
            </>
          )}
          {['scales', 'compare'].includes(active) && (
            <Range
              label={say('净分解进程', 'Net decomposition extent')}
              value={extent}
              min={0}
              max={1}
              step={0.01}
              onChange={setExtent}
            />
          )}
          {active === 'compare' && (
            <>
              <Range
                label={say('B 初始顶空', 'Initial headspace B')}
                value={headspace}
                min={500}
                max={1000}
                step={50}
                unit="mL"
                onChange={setHeadspace}
              />
              <button className="cpl-answer-button" onClick={() => setAnswer(!answer)}>
                {answer ? say('重新预测', 'Predict again') : say('揭晓读数', 'Reveal readings')}
              </button>
            </>
          )}
          <details>
            <summary>{say('模型怎样简化？', 'What does the model simplify?')}</summary>
            <p>
              {say(
                '教材记录只保留固定观察方向。254 nm紫外是单独选定的吸收解离事件，不代表教材光源、完整光谱、量子产率或反应速率。图中只追踪选定O—Cl键的两个电子，H—O不断。',
                'The textbook observations retain fixed directions. The selected 254 nm absorption/dissociation event is not the textbook source spectrum, an absorption spectrum, a quantum yield or a rate law. Only the two electrons of the selected O–Cl bond are tracked; H–O stays joined.',
              )}
            </p>
            <p>
              {say(
                '初始自由基与后续净反应是两个描述层次。净原子路径合并中间步骤，H⁺表示水合的酸性氢离子；图中不展开水合结构和后续电子网络。氧气在完整越过液面前不计入顶空。',
                'Initial radicals and the later net reaction are different descriptive levels. Atom paths combine intermediate steps; H⁺ stands for hydrated acidic hydrogen. Solvent structure and subsequent electron transfers are not expanded. The tracked oxygen enters the headspace account only after its whole drawing crosses the surface.',
              )}
            </p>
            <p>
              {say(
                '算例取100 mL液体、初始HOCl 0.018 mol/L、H⁺及Cl⁻各0.008 mol/L；初始气相298.15 K、1 atm、O₂比例18%。使用浓度近似pH，忽略溶解、平衡、竞争反应与传质；终态假设生成O₂全进入顶空。横轴是净进程，不是教材150秒实测。改变顶空比较独立样品，避光模型省略缓慢暗反应。',
                'The example uses 100 mL liquid, initially 0.018 mol/L HOCl and 0.008 mol/L each of H⁺ and Cl⁻; initial gas is at 298.15 K and 1 atm with 18% O₂. Concentration approximates pH; dissolution, equilibria, competing reactions and transport are omitted. At the endpoint all generated O₂ is in the headspace. The axis is net extent, not the textbook 150-second record. Changing headspace compares separate samples; the dark model omits slow dark chemistry.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
