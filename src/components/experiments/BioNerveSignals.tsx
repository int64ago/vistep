import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  bioelectricEvidence,
  nerveSurface,
  nerveRecordingTime,
  synapseState,
  type BioelectricCondition,
} from '../../models/bio-nerve-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-nerve-signals.css';
export default function BioNerveSignals() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    en = browserLocale() === 'en',
    s = (a: string, b: string) => (en ? b : a);
  const initial =
    film.variant === 'bio-elective-1-mechanism-15'
      ? 1
      : film.variant === 'bio-elective-1-032-1'
        ? 2
        : 0;
  const [chosen, setChosen] = useState(initial),
    [time, setTime] = useState(2),
    [speed, setSpeed] = useState(20),
    [gap, setGap] = useState(20),
    [release, setRelease] = useState(true),
    [receptor, setReceptor] = useState(true),
    [membraneSelected, setMembraneSelected] = useState(false),
    [condition, setCondition] = useState<BioelectricCondition>('metal');
  const mode = film.watch ? (film.chapter < 2 ? 0 : film.chapter < 5 ? 1 : 2) : chosen;
  const progress = film.watch ? film.chapterProgress : time / 6;
  const surface = nerveSurface(
    film.watch ? nerveRecordingTime(film.chapter, progress) : time,
    film.watch ? 20 : speed,
    film.watch ? 20 : gap,
  );
  const sy = synapseState(
    film.watch
      ? film.chapter === 2
        ? progress * 0.25
        : film.chapter === 3
          ? progress * 0.65
          : 0.65 + progress * 0.35
      : progress,
    film.watch ? true : release,
    film.watch ? true : receptor,
  );
  const historical = film.watch
    ? film.chapter === 5
      ? 'metal'
      : progress < 0.65
        ? 'tissue'
        : 'broken'
    : condition;
  const hist = bioelectricEvidence(
      historical,
      film.watch && film.chapter === 6
        ? progress < 0.65
          ? progress / 0.65
          : (progress - 0.65) / 0.35
        : progress,
    ),
    left = 28,
    right = w - 28,
    x = (mm: number) => left + ((right - left) * mm) / 120;
  const axonY = compact ? 116 : 138;
  const membraneView = mode === 1 && (film.watch ? film.chapter === 2 : membraneSelected),
    mem = nerveSurface((film.watch ? progress : time / 6) * 4),
    vm = mem.membrane(35);
  const titles = [
    s('两个电极，同一束兴奋', 'Two electrodes, one traveling signal'),
    s('从电信号到化学信号', 'From voltage to transmitter'),
    s('改变接触，检验解释', 'Change the contact; test the explanation'),
  ];
  return (
    <div ref={host} className="bio-nerve" data-watch={film.watch}>
      <div className="bio-nerve-head">
        <span>{titles[mode]}</span>
        <b>
          {mode === 0
            ? `${surface.timeMs.toFixed(2)} ms`
            : mode === 1
              ? `${(membraneView ? vm : sy.voltage).toFixed(1)} mV`
              : s('历史证据', 'Historical evidence')}
        </b>
      </div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} ${compact ? 350 : 390}`} role="img" aria-label={titles[0]}>
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
          <text x={x(surface.a) - 8} y={axonY - 33} textAnchor="end">
            a
          </text>
          <text x={x(surface.b) + 8} y={axonY - 33}>
            b
          </text>
          <text x={w / 2} y={axonY + 53} textAnchor="middle">
            Vₐ − Vᵦ = {surface.difference.toFixed(1)} {s('相对单位', 'relative units')}
          </text>
          <path d={`M28 ${axonY + 115}H${w - 28}`} stroke="#d4dee2" />
          <path
            d={Array.from({ length: 181 }, (_, i) => {
              const t = i / 30;
              return `${i ? 'L' : 'M'}${28 + ((w - 56) * t) / 6},${axonY + 115 - nerveSurface(t, film.watch ? 20 : speed, film.watch ? 20 : gap).difference * 2.8}`;
            }).join(' ')}
            fill="none"
            stroke="#7896ab"
            strokeWidth="2.5"
          />
          <path
            d={`M${28 + ((w - 56) * surface.timeMs) / 6} ${axonY + 75}v80`}
            stroke="#c28b67"
            strokeDasharray="3 5"
          />
          <text x="28" y={axonY + 172}>
            0 ms
          </text>
          <text x={w - 28} y={axonY + 172} textAnchor="end">
            6 ms
          </text>
        </svg>
      )}
      {membraneView && (
        <svg
          viewBox={`0 0 ${w} 340`}
          role="img"
          aria-label={s('局部膜电位变化', 'Local membrane-potential change')}
        >
          <rect x="25" y="112" width={w - 50} height="75" rx="30" fill="#e0e8cf" stroke="#a8b993" />
          <path d={`M25 117H${w - 25}M25 182H${w - 25}`} stroke="#9faf85" strokeWidth="4" />
          <path
            d={`M${w * 0.4} 80v58m-7-9 7 9 7-9`}
            stroke="#7995ae"
            strokeWidth="3"
            fill="none"
            opacity={mem.sodiumEntry(35)}
          />
          <path
            d={`M${w * 0.65} 150v65m-7-9 7 9 7-9`}
            stroke="#a78e6a"
            strokeWidth="3"
            fill="none"
            opacity={mem.potassiumExit(35)}
          />
          <text x={w * 0.4} y="65" textAnchor="middle">
            Na⁺
          </text>
          <text x={w * 0.65} y="238" textAnchor="middle">
            K⁺
          </text>
          <text x={w / 2} y="158" textAnchor="middle">
            {s('V膜', 'Vₘ')} = {vm.toFixed(1)} mV
          </text>
          <path
            d={Array.from(
              { length: 101 },
              (_, i) =>
                `${i ? 'L' : 'M'}${25 + ((w - 50) * i) / 100},${302 - (nerveSurface(i * 0.04).membrane(35) + 70) * 0.45}`,
            ).join(' ')}
            fill="none"
            stroke="#bd8c63"
            strokeWidth="2.5"
          />
          <circle
            cx={25 + ((w - 50) * mem.timeMs) / 4}
            cy={302 - (vm + 70) * 0.45}
            r="5"
            fill="#bd8c63"
          />
        </svg>
      )}
      {mode === 1 && !membraneView && (
        <svg viewBox={`0 0 ${w} ${compact ? 340 : 365}`} role="img" aria-label={titles[1]}>
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
          <text x={w / 2} y="28" textAnchor="middle">
            {s('突触前末梢', 'Presynaptic terminal')}
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
          <text x={w / 2} y="316" textAnchor="middle">
            {s('递质受体改变通道状态', 'Receptors alter ion-channel state')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg viewBox={`0 0 ${w} 290`} role="img" aria-label={titles[2]}>
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
                ? s('无金属的组织接触', 'Tissue contact without metal')
                : s('断开接触', 'Contact interrupted')}
          </text>
          <text x="35" y="202">
            {s('神经', 'Nerve')}
          </text>
          <text x={w - 35} y="202" textAnchor="end">
            {s('肌肉', 'Muscle')}
          </text>
          <text x={w / 2} y="253" textAnchor="middle">
            {hist.connected
              ? s('出现收缩', 'Contraction observed')
              : s('本条件下不收缩', 'No contraction in this condition')}
          </text>
        </svg>
      )}
      <p className="bio-nerve-note">
        {mode === 0
          ? s(
              '表面两点的差值，不等于跨膜电位。',
              'A surface difference is not a transmembrane voltage.',
            )
          : mode === 1
            ? s(
                '递质小点表示身份与路径，非真实分子比例。',
                'Transmitter markers show identity and route, not molecular scale.',
              )
            : s(
                '比较历史条件；画面不演示动物操作步骤。',
                'Compare historical conditions; animal procedures are not demonstrated.',
              )}
      </p>
      {!film.watch && (
        <>
          <div className="bio-nerve-tabs">
            {[
              s('表面电位', 'Surface recording'),
              s('突触', 'Synapse'),
              s('生物电证据', 'Bioelectric evidence'),
            ].map((label, i) => (
              <button key={label} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {label}
              </button>
            ))}
          </div>
          <div className="bio-nerve-controls">
            <label htmlFor={`${id}-time`}>
              {s('观察时刻', 'Observation time')}
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
            {mode === 0 ? (
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
            ) : mode === 1 ? (
              <div className="bio-nerve-tabs">
                <button
                  aria-pressed={membraneSelected}
                  onClick={() => setMembraneSelected(!membraneSelected)}
                >
                  {membraneSelected
                    ? s('观察突触', 'Observe synapse')
                    : s('观察膜电位', 'Observe membrane voltage')}
                </button>
                <button aria-pressed={release} onClick={() => setRelease(!release)}>
                  {s('释放递质', 'Release transmitter')}
                </button>
                <button aria-pressed={receptor} onClick={() => setReceptor(!receptor)}>
                  {s('受体可响应', 'Receptors responsive')}
                </button>
              </div>
            ) : (
              <div className="bio-nerve-tabs">
                {(['metal', 'tissue', 'broken'] as const).map((c, i) => (
                  <button key={c} aria-pressed={c === condition} onClick={() => setCondition(c)}>
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
          </div>
        </>
      )}
      <details>
        <summary>{s('模型与证据边界', 'Model and evidence limits')}</summary>
        <p>
          {s(
            '表面负脉冲以固定形状平移，速度和幅度为教学参数，不是蛙神经实测波形。突触使用单次释放、指数清除与饱和受体模型，不计算完整离子通道动力学。历史比较说明金属并非必要条件，不表示所有组织接触均必然引起收缩。',
            'The translated negative pulse has a chosen teaching shape and speed; it is not a measured frog-nerve trace. A single release, exponential clearance and saturating receptor represent the synapse, without full channel kinetics. Historical comparisons show metal is unnecessary, not that arbitrary tissue contact always contracts muscle.',
          )}
        </p>
      </details>
    </div>
  );
}
