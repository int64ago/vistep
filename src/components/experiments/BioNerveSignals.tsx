import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  bioelectricEvidence,
  nerveSurface,
  synapseState,
  nerveDirector,
  membraneCharge,
  membraneMarkers,
  type BioelectricCondition,
} from '../../models/bio-nerve-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-nerve-signals.css';
type Theme = 'surface' | 'membrane' | 'synapse' | 'history';
const themeOf = (ch: number): Theme =>
  ch < 2 ? 'surface' : ch === 2 ? 'membrane' : ch < 5 ? 'synapse' : 'history';
export default function BioNerveSignals() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    w = Math.max(240, Math.min(680, width)),
    id = useId(),
    en = browserLocale() === 'en',
    s = (a: string, b: string) => (en ? b : a);
  const [chosen, setChosen] = useState<Theme | null>(null),
    [manualTime, setTime] = useState<number | null>(null),
    [speed, setSpeed] = useState(20),
    [gap, setGap] = useState(20),
    [release, setRelease] = useState<boolean | null>(null),
    [receptor, setReceptor] = useState<boolean | null>(null),
    [condition, setCondition] = useState<BioelectricCondition | null>(null),
    [sodium, setSodium] = useState(true),
    [potassium, setPotassium] = useState(true),
    [capacitance, setCapacitance] = useState(1);
  const d = nerveDirector(film.chapter, film.chapterTime, en ? 'en' : 'zh'),
    theme = film.watch ? themeOf(film.chapter) : (chosen ?? themeOf(film.chapter)),
    inheritsCurrentShot = theme === themeOf(film.chapter),
    defaults = !inheritsCurrentShot
      ? 0
      : theme === 'surface'
        ? d.surfaceTime
        : theme === 'membrane'
          ? d.membraneTime
          : theme === 'synapse'
            ? d.synapseProgress * 6
            : d.historicalProgress * 6,
    time = film.watch ? defaults : (manualTime ?? defaults);
  const activeSpeed = film.watch ? 20 : speed,
    activeGap = film.watch ? 20 : gap,
    surface = nerveSurface(time, activeSpeed, activeGap),
    options = {
      sodium: film.watch ? true : sodium,
      potassium: film.watch ? true : potassium,
      capacitance: film.watch ? 1 : capacitance,
    },
    mem = membraneCharge(time, options),
    markers = membraneMarkers(mem, w);
  const curve = useMemo(
    () => Array.from({ length: 151 }, (_, i) => membraneCharge(i / 25, options)),
    [options.sodium, options.potassium, options.capacitance],
  );
  const activeRelease = film.watch
      ? !d.releaseCounterexample
      : (release ?? (inheritsCurrentShot ? !d.releaseCounterexample : true)),
    activeReceptor = film.watch
      ? !d.receptorCounterexample
      : (receptor ?? (inheritsCurrentShot ? !d.receptorCounterexample : true)),
    sy = synapseState(time / 6, activeRelease, activeReceptor),
    historical = film.watch
      ? d.history
      : (condition ?? (inheritsCurrentShot ? d.history : 'metal')),
    hist = bioelectricEvidence(historical, theme === 'history' ? time / 6 : 0),
    left = 28,
    right = w - 28,
    x = (mm: number) => left + ((right - left) * mm) / 120,
    axonY = 95;
  const titles = [
    s('两个电极，同一束兴奋', 'One signal, two electrodes'),
    s('膜内相对膜外', 'Inside relative to outside'),
    s('改变接触，检验解释', 'Change contact; test the source'),
  ];
  const line =
    theme === 'membrane'
      ? mem.sodiumGate > 0.01 && mem.sodiumCurrent - mem.potassiumCurrent > 1
        ? s('钠流入，电荷增加', 'Na enters; charge rises')
        : mem.potassiumGate > 0.01 && mem.potassiumCurrent - mem.sodiumCurrent > 1
          ? s('钾流出，电位回落', 'K exits; voltage falls')
          : Math.abs(mem.sodiumCurrent - mem.potassiumCurrent) > 1
            ? s('背景电流恢复', 'Basal currents restore')
            : s('少量电荷差形成电压', 'A small charge imbalance')
      : theme === 'synapse'
        ? film.watch && d.releaseCounterexample
          ? s('另一对照：不释放', 'New trial: no release')
          : film.watch && d.receptorCounterexample
            ? s('另一对照：受体不响应', 'New trial: receptor off')
            : s('递质跨过间隙', 'Transmitter crosses the cleft')
        : theme === 'history'
          ? titles[2]
          : titles[0];
  return (
    <div
      ref={host}
      className="bns18"
      data-watch={film.watch}
      data-theme={theme}
      data-counter={
        film.watch
          ? d.releaseCounterexample
            ? 'release'
            : d.receptorCounterexample
              ? 'receptor'
              : 'none'
          : 'explore'
      }
    >
      <div className="bns18-head">
        <span>{line}</span>
        {theme === 'membrane' ? (
          <b data-voltage>{mem.voltage.toFixed(1)} mV</b>
        ) : theme === 'synapse' ? (
          <b>{sy.voltage.toFixed(1)} mV</b>
        ) : null}
      </div>
      {theme === 'surface' && (
        <svg viewBox={`0 0 ${w} 260`} role="img" aria-label={titles[0]}>
          <defs>
            <linearGradient id={`${id}-axon`} x2="0" y2="1">
              <stop stopColor="#eff2dc" />
              <stop offset=".5" stopColor="#d2dcb8" />
              <stop offset="1" stopColor="#b7c999" />
            </linearGradient>
          </defs>
          <rect
            x={left}
            y={axonY - 22}
            width={right - left}
            height="44"
            rx="22"
            fill={`url(#${id}-axon)`}
            stroke="#9cad86"
          />
          {Array.from({ length: 55 }, (_, i) => {
            const mm = ((i + 0.5) * 120) / 55,
              amp = -surface.outside(mm) / 12;
            return (
              <rect
                key={i}
                x={x(mm) - 2}
                y={axonY - 21}
                width="4"
                height="42"
                rx="2"
                fill="#c48960"
                opacity={amp * 0.85}
              />
            );
          })}
          <path
            d={`M${x(surface.a)} ${axonY - 20}V35H${w / 2 - 31}M${x(surface.b)} ${axonY - 20}V78H${Math.max(x(surface.b), w / 2 + 54)}V35H${w / 2 + 31}`}
            fill="none"
            stroke="#7d8c93"
            strokeWidth="2"
          />
          <circle cx={w / 2} cy="35" r="31" fill="#f4f7f7" stroke="#a8b8be" />
          <path
            d={`M${w / 2} 50L${w / 2 + Math.sin((surface.difference / 12) * 0.8) * 23} ${50 - Math.cos((surface.difference / 12) * 0.8) * 23}`}
            stroke="#b06e53"
            strokeWidth="2"
          />
          <text x={x(surface.a) - 8} y={axonY + 7} textAnchor="end">
            a
          </text>
          <text x={x(surface.b) + 8} y={axonY + 7}>
            b
          </text>
          <text x={w / 2} y={axonY + 42} textAnchor="middle">
            Vₐ − Vᵦ = {surface.difference.toFixed(1)} {s('相对量', 'relative')}
          </text>
          <path d={`M28 ${axonY + 99}H${w - 28}`} stroke="#d4dee2" />
          <path
            d={Array.from({ length: 181 }, (_, i) => {
              const t = i / 30;
              return `${i ? 'L' : 'M'}${28 + ((w - 56) * t) / 6},${axonY + 99 - nerveSurface(t, activeSpeed, activeGap).difference * 2.8}`;
            }).join(' ')}
            fill="none"
            stroke="#7896ab"
            strokeWidth="2.5"
          />
          <path
            d={`M${28 + ((w - 56) * surface.timeMs) / 6} ${axonY + 63}v72`}
            stroke="#c28b67"
            strokeDasharray="3 5"
          />
          <text x="28" y={axonY + 151}>
            0 ms
          </text>
          <text x={w - 28} y={axonY + 151} textAnchor="end">
            6 ms
          </text>
        </svg>
      )}
      {theme === 'membrane' && (
        <>
          <svg
            viewBox={`0 0 ${w} 250`}
            role="img"
            aria-label={s('通道、电荷与膜电位', 'Channels, charge and voltage')}
          >
            <rect x="12" y="30" width={w - 24} height="68" rx="18" fill="#edf2f2" />
            <rect x="12" y="116" width={w - 24} height="70" rx="18" fill="#e4ebd8" />
            <text x="18" y="22">
              {s('膜外', 'Outside')}
            </text>
            <text x="18" y="182">
              {s('膜内', 'Inside')}
            </text>
            {[0, 1, 2, 3].map((i) => (
              <g key={i} opacity=".4">
                <text x={22 + i * 13} y="65">
                  {i % 2 ? '+' : '−'}
                </text>
                <text x={w - 22 - i * 13} y="151">
                  {i % 2 ? '−' : '+'}
                </text>
              </g>
            ))}
            <path
              d={`M12 98H${w * 0.32 - 24}M${w * 0.32 + 24} 98H${w * 0.68 - 24}M${w * 0.68 + 24} 98H${w - 12}M12 116H${w * 0.32 - 24}M${w * 0.32 + 24} 116H${w * 0.68 - 24}M${w * 0.68 + 24} 116H${w - 12}`}
              stroke="#9cad91"
              strokeWidth="5"
              fill="none"
            />
            {[
              { x: w * 0.32, open: mem.sodiumGate, enabled: options.sodium, label: 'Na' },
              { x: w * 0.68, open: mem.potassiumGate, enabled: options.potassium, label: 'K' },
            ].map((g) => (
              <g key={g.label} data-channel={g.label} data-open={g.open.toFixed(4)}>
                <rect x={g.x - 26} y="88" width="8" height="38" rx="5" fill="#7e9ca1" />
                <rect x={g.x + 18} y="88" width="8" height="38" rx="5" fill="#7e9ca1" />
                <path
                  d={`M${g.x - 18} 107H${g.x - 18 * g.open}M${g.x + 18 * g.open} 107H${g.x + 18}`}
                  stroke="#6d858a"
                  strokeWidth="6"
                />
              </g>
            ))}
            {markers.map((m) => (
              <g
                key={m.id}
                data-ion={m.id}
                data-progress={m.progress.toFixed(5)}
                transform={`translate(${m.x},${m.y})`}
              >
                <circle
                  r="17"
                  fill={m.species === 'Na' ? '#dae8ef' : '#e8dcc1'}
                  stroke={m.species === 'Na' ? '#7496a7' : '#a28e67'}
                />
                <text textAnchor="middle" y="5">
                  {m.species}⁺
                </text>
              </g>
            ))}
            {[
              { y: 83, q: mem.outsideCharge },
              { y: 137, q: mem.insideCharge },
            ].map(({ y, q }) => (
              <g key={y} data-surface-charge={q}>
                <rect
                  x={w / 2 - 14}
                  y={y - 5}
                  width={Math.min(28, Math.abs(q) / 3)}
                  height="5"
                  rx="2.5"
                  fill={q < 0 ? '#7398a8' : '#b68c70'}
                />
                <text x={w / 2 + 20} y={y + 2} textAnchor="middle">
                  {Math.abs(q) < 1 ? '0' : q < 0 ? '−' : '+'}
                </text>
              </g>
            ))}
            <path d={`M38 226H${w - 22}`} stroke="#b8c2bc" />
            <path
              d={curve
                .map(
                  (q, i) =>
                    `${i ? 'L' : 'M'}${38 + ((w - 60) * q.timeMs) / 6},${226 - (q.voltage + 70) * 0.31}`,
                )
                .join(' ')}
              fill="none"
              stroke="#ae7d5e"
              strokeWidth="2"
            />
            <circle
              cx={38 + ((w - 60) * mem.timeMs) / 6}
              cy={226 - (mem.voltage + 70) * 0.31}
              r="4"
              fill="#ae7d5e"
            />
            <text x="0" y="230">
              −70
            </text>
            <text x="38" y="248">
              0
            </text>
            <text x={w - 22} y="248" textAnchor="end">
              6 ms
            </text>
          </svg>
          <p className="bns18-state">
            {s('给定门控，电压由电荷算出', 'Given gating; voltage from charge')}
          </p>
        </>
      )}
      {theme === 'synapse' && (
        <svg
          className="bns18-synapse-close"
          viewBox={`0 34 ${w} 266`}
          role="img"
          aria-label={s('突触前后膜', 'Pre- and postsynaptic membranes')}
        >
          <path
            d={`M${w * 0.19} 0V55Q${w * 0.06} 84 ${w * 0.1} 145Q${w * 0.15} 165 ${w * 0.22} 165H${w * 0.78}Q${w * 0.85} 165 ${w * 0.9} 145Q${w * 0.94} 84 ${w * 0.81} 55V0`}
            fill="#dce5c8"
          />
          <path
            d={`M${w * 0.19} 0V55Q${w * 0.06} 84 ${w * 0.1} 145Q${w * 0.15} 165 ${w * 0.22} 165H${w * 0.3 - sy.vesicles[0].poreHalfWidth}M${w * 0.3 + sy.vesicles[0].poreHalfWidth} 165H${w * 0.5 - sy.vesicles[1].poreHalfWidth}M${w * 0.5 + sy.vesicles[1].poreHalfWidth} 165H${w * 0.7 - sy.vesicles[2].poreHalfWidth}M${w * 0.7 + sy.vesicles[2].poreHalfWidth} 165H${w * 0.78}Q${w * 0.85} 165 ${w * 0.9} 145Q${w * 0.94} 84 ${w * 0.81} 55V0`}
            fill="none"
            stroke="#a4b68c"
            strokeWidth="2"
          />
          <path
            d={`M${w * 0.08} 218H${w * 0.92}V294H${w * 0.08}Z`}
            fill="#d8e8eb"
            stroke="#90afb8"
            strokeWidth="2"
          />
          <text x={w / 2} y="60" textAnchor="middle">
            {s('突触前', 'Presynaptic')}
          </text>
          {sy.vesicles.map((v) =>
            v.fused ? (
              <path
                key={v.id}
                d={`M${w * v.x - v.poreHalfWidth} 165A13 13 0 1 1 ${w * v.x + v.poreHalfWidth} 165`}
                stroke="#a2b084"
                strokeWidth="2"
                fill="#edf1e1"
              />
            ) : (
              <circle key={v.id} cx={w * v.x} cy={v.y} r="13" stroke="#a2b084" fill="#edf1e1" />
            ),
          )}
          {sy.molecules.map((m) => (
            <circle
              key={m.id}
              data-molecule={m.id}
              cx={w * m.x + m.offset}
              cy={m.y}
              r="2.7"
              fill="#bd8958"
              opacity={m.opacity}
            />
          ))}
          {[0.3, 0.5, 0.7].map((q, i) => (
            <g key={q}>
              <path
                d={`M${w * q - 9} 218v24h18v-24M${w * q - 13} 211l4 7m22-7-4 7`}
                fill={sy.bound > 0.2 ? '#b7cbb6' : '#eff3e7'}
                stroke="#658d95"
                strokeWidth="3"
              />
              {sy.bound > 0.2 && (
                <path
                  d={`M${w * q} 245v25m-5-6 5 6 5-6`}
                  fill="none"
                  stroke="#a77c54"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}
          <text x={w / 2} y="292" textAnchor="middle">
            {s('突触后', 'Postsynaptic')}
          </text>
        </svg>
      )}
      {theme === 'history' && (
        <svg viewBox={`0 0 ${w} 240`} role="img" aria-label={titles[2]}>
          <path
            d={`M35 120Q${w * 0.35} 80 ${w * 0.57} 135`}
            stroke="#b6b987"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${w * 0.55} 135Q${w * 0.68} ${90 + hist.contraction * 25} ${w - 35} 135Q${w * 0.68} ${180 - hist.contraction * 25} ${w * 0.55} 135Z`}
            fill="#cba19b"
            stroke="#a77d77"
            strokeWidth="2"
          />
          <path
            d={`M45 113V54H${w - 50}V${historical === 'broken' ? 92 : 125}`}
            stroke={hist.metal ? '#8294a3' : '#b8be92'}
            strokeWidth={hist.metal ? 6 : 10}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="45" cy="113" r="5" fill="#7f8f7b" />
          <text x={w / 2} y="32" textAnchor="middle">
            {historical === 'metal'
              ? s('金属连接', 'Metal bridge')
              : historical === 'tissue'
                ? s('组织连接', 'Tissue bridge')
                : s('断开接触', 'Contact interrupted')}
          </text>
          <text x="35" y="202">
            {s('神经', 'Nerve')}
          </text>
          <text x={w - 35} y="202" textAnchor="end">
            {s('肌肉', 'Muscle')}
          </text>
          <text x={w / 2} y="232" textAnchor="middle">
            {hist.connected
              ? hist.contraction > 0.02
                ? s('出现收缩', 'Contraction observed')
                : s('观察接触条件', 'Observe the contact')
              : s('本条件不收缩', 'No contraction')}
          </text>
        </svg>
      )}

      {!film.watch && (
        <div className="bns18-controls">
          <div className="bns18-tabs">
            {(['surface', 'membrane', 'synapse', 'history'] as const).map((t, i) => (
              <button
                key={t}
                aria-pressed={theme === t}
                onClick={() => {
                  setChosen(t);
                  setTime(null);
                }}
              >
                {
                  [
                    s('表面记录', 'Surface record'),
                    s('膜电荷', 'Membrane charge'),
                    s('突触', 'Synapse'),
                    s('生物电证据', 'Bioelectric evidence'),
                  ][i]
                }
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-time`}>
            {s('观察时刻', 'Observation time')} · {time.toFixed(2)}
            <input
              id={`${id}-time`}
              type="range"
              min="0"
              max="6"
              step=".02"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          {theme === 'surface' && (
            <>
              <label htmlFor={`${id}-speed`}>
                {s('传播速度', 'Conduction speed')} · {speed} mm/ms
                <input
                  id={`${id}-speed`}
                  type="range"
                  min="5"
                  max="40"
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                />
              </label>
              <label htmlFor={`${id}-gap`}>
                {s('电极间距', 'Electrode separation')} · {gap} mm
                <input
                  id={`${id}-gap`}
                  type="range"
                  min="0"
                  max="45"
                  value={gap}
                  onChange={(e) => setGap(+e.target.value)}
                />
              </label>
            </>
          )}
          {theme === 'membrane' && (
            <>
              <div className="bns18-tabs">
                <button aria-pressed={sodium} onClick={() => setSodium(!sodium)}>
                  {s('钠通路', 'Na pathway')}
                </button>
                <button aria-pressed={potassium} onClick={() => setPotassium(!potassium)}>
                  {s('钾通路', 'K pathway')}
                </button>
              </div>
              <label htmlFor={`${id}-cap`}>
                {s('膜电容', 'Capacitance')} · {capacitance.toFixed(1)} μF/cm²
                <input
                  id={`${id}-cap`}
                  type="range"
                  min=".5"
                  max="2"
                  step=".1"
                  value={capacitance}
                  onChange={(e) => setCapacitance(+e.target.value)}
                />
              </label>
              <p>
                {s('内侧净电荷', 'Inner charge')} {mem.insideCharge.toFixed(1)} nC/cm²
                <br />
                {s('内流 − 外流', 'Inward − outward')} = {mem.deltaCharge.toFixed(1)} nC/cm²
              </p>
            </>
          )}
          {theme === 'synapse' && (
            <div className="bns18-tabs">
              <button aria-pressed={activeRelease} onClick={() => setRelease(!activeRelease)}>
                {s('释放递质', 'Release transmitter')}
              </button>
              <button aria-pressed={activeReceptor} onClick={() => setReceptor(!activeReceptor)}>
                {s('受体可响应', 'Receptors responsive')}
              </button>
            </div>
          )}
          {theme === 'history' && (
            <div className="bns18-tabs">
              {(['metal', 'tissue', 'broken'] as const).map((c, i) => (
                <button key={c} aria-pressed={historical === c} onClick={() => setCondition(c)}>
                  {
                    [
                      s('金属', 'Metal'),
                      s('组织接触', 'Tissue contact'),
                      s('断开', 'Disconnected'),
                    ][i]
                  }
                </button>
              ))}
            </div>
          )}
          <details>
            <summary>{s('模型与证据边界', 'Model and evidence limits')}</summary>
            <p>
              {s(
                '表面脉冲是教学形状，不是实测复合动作电位。局部膜模型给定门控时序，用离子电流积分和膜电容计算电压，不求解完整电压门控、阈值或不应期。两个标记是选定离子，不表示总数；体相仍近似电中性。背景漏流另计，短时浓度库固定，未用泵把波形复位。突触及历史图保持各自证据边界。',
                'The surface pulse is schematic, not a measured compound action potential. Given gate timing, integrated ionic current and capacitance determine local voltage; full voltage gating, threshold and refractoriness are not solved. Two selected ions do not represent all charge; bulk fluids remain nearly neutral. Basal currents are included separately, reservoirs stay fixed briefly, and no pump resets the wave. Synapse and history retain their separate limits.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
