import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  coleoptileGrowth,
  coleoptileOutline,
  auxinDoseResponse,
  agarLoading,
  agarTracerMarkers,
  auxinTransportAssay,
  type ColeoptileTreatment,
  type LightSide,
} from '../../models/bio-auxin-evidence';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-auxin-evidence.css';
const targets = ['090-1', '091-1', '091-2', '091-3', '094-1', '095-1'].map(
  (t) => 'bio-elective-1-' + t,
);
export default function BioAuxinEvidence() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [chosen, setChosen] = useState(Math.max(0, targets.indexOf(film.variant ?? ''))),
    [time, setTime] = useState(0.9),
    [treatment, setTreatment] = useState<ColeoptileTreatment>('tip-covered'),
    [light, setLight] = useState<LightSide>('left'),
    [prep, setPrep] = useState(false),
    [barrier, setBarrier] = useState(false),
    [logC, setLogC] = useState(-7),
    [hypothesis, setHypothesis] = useState<'polar' | 'both'>('polar');
  const mode = film.watch ? Math.min(5, Math.floor(film.chapter / 2)) : chosen,
    p = film.watch ? film.chapterProgress : time,
    second = film.chapter % 2 === 1;
  const l: LightSide = mode === 2 || mode === 3 ? 'dark' : film.watch ? 'left' : light;
  const pair: ColeoptileTreatment[] =
    mode === 0
      ? film.watch
        ? second
          ? ['tip-covered', 'base-covered']
          : ['intact', 'removed']
        : ['intact', treatment]
      : mode === 1
        ? (film.watch ? second : barrier)
          ? ['agar', 'barrier']
          : ['intact', 'agar']
        : mode === 2
          ? film.watch && !second
            ? ['intact', 'tip-left']
            : ['tip-left', 'tip-right']
          : ['agar-left', 'agar-clean'];
  const preparation = mode === 3 && (film.watch ? !second : prep),
    loading = agarLoading(p),
    concentration = 10 ** (film.watch ? (second ? -7 + p * 5 : -12 + p * 5) : logC),
    hyp = film.watch ? 'polar' : hypothesis;
  const labels = [
    s('尖端感光，下部弯曲', 'Tip sensing and lower growth'),
    s('影响能否跨过间隔', 'Can the influence cross a gap?'),
    s('黑暗中的偏置来源', 'An off-center source in darkness'),
    s('从尖端到琼脂块', 'From tip to agar block'),
    s('浓度与器官敏感度', 'Dose and organ sensitivity'),
    s('一个阳性结果够吗', 'Is one positive result enough?'),
  ];
  const treatmentName = (key: ColeoptileTreatment) =>
    ({
      intact: s('完整', 'Intact'),
      removed: s('去尖端', 'Tip removed'),
      'tip-covered': s('尖端遮光', 'Tip shaded'),
      'base-covered': s('下段遮光', 'Base shaded'),
      agar: s('琼脂间隔', 'Agar gap'),
      barrier: s('阻隔对照', 'Barrier control'),
      'tip-left': s('尖端偏左', 'Tip on left'),
      'tip-right': s('尖端偏右', 'Tip on right'),
      'agar-left': s('接触过尖端', 'Tip-conditioned'),
      'agar-clean': s('空白琼脂', 'Blank agar'),
    })[key];
  const plant = (key: ColeoptileTreatment, index: number) => {
    const frame = coleoptileGrowth(key, p, l),
      tip = frame.point(1),
      x = (w * (index + 0.5)) / 2,
      y = 245,
      angle = (tip.angle * 180) / Math.PI,
      offset = key === 'tip-left' ? -12 : key === 'tip-right' ? 12 : 0;
    return (
      <g key={key}>
        <path d={`M${x - 44} 257h88l-10 43h-68Z`} fill="#d6c9ae" stroke="#b1a48a" />
        <ellipse cx={x} cy="257" rx="44" ry="8" fill="#bcac89" />
        <path
          d={`M${x} 250q-13 18-8 37m8-37q15 23 7 39m-7-36v39`}
          fill="none"
          stroke="#ded9b8"
          strokeWidth="2"
        />
        {l !== 'dark' && (
          <path
            d={l === 'left' ? `M${x - 65} 126h32m-7-5 7 5-7 5` : `M${x + 65} 126h-32m7-5-7 5 7 5`}
            stroke="#c7b275"
            strokeWidth="3"
            fill="none"
          />
        )}
        <g transform={`translate(${x} ${y})`}>
          <path d={coleoptileOutline(key, p, l)} fill="#bacba0" stroke="#8da878" strokeWidth="2" />
          {[0.2, 0.4, 0.6, 0.8].map((t) => {
            const a = frame.point(t, -1),
              b = frame.point(t, 1);
            return <path key={t} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="#9fb88d" />;
          })}
          {[0, 1].map((side) =>
            Array.from({ length: 6 }, (_, i) => {
              const pos = frame.point(0.15 + i * 0.12, side ? 0.55 : -0.55);
              return (
                <circle
                  key={`${side}-${i}`}
                  cx={pos.x}
                  cy={pos.y}
                  r="2.3"
                  fill="#ac8950"
                  opacity={(side ? frame.rightSignal : frame.leftSignal) * p}
                />
              );
            }),
          )}
          {key === 'base-covered' && (
            <path
              d={coleoptileOutline(key, p, l, 0.2, 0.72)}
              fill="#acb0a5"
              stroke="#7e8b81"
              strokeWidth="2"
            />
          )}
          <g transform={`translate(${tip.x} ${tip.y}) rotate(${angle})`}>
            {['agar', 'barrier'].includes(key) && (
              <rect
                x="-15"
                y="-8"
                width="30"
                height="8"
                rx="2"
                fill={key === 'agar' ? '#c9d8cd' : '#8c9691'}
                stroke="#9baea1"
              />
            )}
            {frame.tipPresent && (
              <path
                d="M-12 0Q-9-23 0-27Q9-23 12 0Z"
                transform={`translate(${offset} ${['agar', 'barrier'].includes(key) ? -8 : 0})`}
                fill="#b4c797"
                stroke="#8aa472"
                strokeWidth="2"
              />
            )}
            {key === 'tip-covered' && (
              <path d="M-15 7V-18Q0-42 15-18V7Z" fill="#a7aea3" stroke="#7f8c81" strokeWidth="2" />
            )}
            {['agar-left', 'agar-clean'].includes(key) && (
              <>
                <rect
                  x="-24"
                  y="-12"
                  width="24"
                  height="12"
                  rx="2"
                  fill="#d9e1cf"
                  stroke="#aab99e"
                />
                {key === 'agar-left' &&
                  [0, 1, 2].map((i) => (
                    <circle key={i} cx={-20 + i * 7} cy="-6" r="2.2" fill="#ad8951" />
                  ))}
              </>
            )}
          </g>
        </g>
        <text x={x} y="327" textAnchor="middle">
          {treatmentName(key)}
        </text>
      </g>
    );
  };
  return (
    <div ref={host} className="bio-auxin" data-watch={film.watch}>
      <div className="bio-auxin-head">{labels[mode]}</div>
      {mode < 4 && !preparation && (
        <svg viewBox={`0 0 ${w} 355`} role="img" aria-label={labels[mode]}>
          <text x={w / 2} y="29" textAnchor="middle">
            {l === 'dark'
              ? s('黑暗条件', 'Dark conditions')
              : l === 'left'
                ? s('单侧光：从左进入', 'Light enters from the left')
                : s('单侧光：从右进入', 'Light enters from the right')}
          </text>
          {pair.map(plant)}
        </svg>
      )}
      {preparation && (
        <svg viewBox={`0 0 ${w} 330`} role="img" aria-label={labels[3]}>
          <rect
            x={w * 0.18}
            y="154"
            width={w * 0.64}
            height="72"
            rx="8"
            fill="#d7e1cc"
            stroke="#a6b99c"
            strokeWidth="2"
          />
          <path
            d={`M${w / 2 - 25} 154Q${w / 2 - 20} 73 ${w / 2} 64Q${w / 2 + 20} 73 ${w / 2 + 25} 154Z`}
            fill="#b5c895"
            stroke="#87a56f"
            strokeWidth="2"
          />
          {agarTracerMarkers(p, w * 0.64).map((m) => (
            <circle key={m.id} data-tracer={m.id} cx={w / 2 + m.x} cy={m.y} r="3" fill="#ab8750" />
          ))}
          <text x={w / 2} y="37" textAnchor="middle">
            {s('尖端接触琼脂', 'Tip in contact with agar')}
          </text>
          <text x={w / 2} y="270" textAnchor="middle">
            {s('琼脂中的相对量', 'Relative amount in agar')} {loading.agarAmount.toFixed(2)}
          </text>
          <text x={w / 2} y="307" textAnchor="middle">
            {s('总量', 'Total')} {loading.total}
          </text>
        </svg>
      )}
      {mode === 4 && (
        <svg viewBox={`0 0 ${w} 350`} role="img" aria-label={labels[4]}>
          <path d={`M35 235H${w - 25}M35 65V287`} fill="none" stroke="#bbc8ae" />
          {(['root', 'bud', 'stem'] as const).map((organ, i) => (
            <path
              key={organ}
              d={Array.from({ length: 121 }, (_, n) => {
                const log = -12 + n / 12;
                return `${n ? 'L' : 'M'}${35 + ((w - 60) * n) / 120},${235 - auxinDoseResponse(10 ** log, organ) * 145}`;
              }).join(' ')}
              fill="none"
              stroke={['#8da68e', '#b5a076', '#809cab'][i]}
              strokeWidth="2.5"
            />
          ))}
          <path
            d={`M${35 + ((w - 60) * (Math.log10(concentration) + 12)) / 10} 65V286`}
            stroke="#a48b72"
            strokeDasharray="4 5"
          />
          <text x="35" y="35">
            {compact
              ? s('相对生长变化', 'Relative growth change')
              : s('相对无外加生长素的生长变化', 'Growth change from untreated reference')}
          </text>
          <text x="35" y="57">
            {concentration.toExponential(1)} mol/L
          </text>
          <text x="11" y="240">
            0
          </text>
          <text x="35" y="313">
            10⁻¹²
          </text>
          <text x={w - 25} y="313" textAnchor="end">
            10⁻²
          </text>
          {(['root', 'bud', 'stem'] as const).map((organ, i) => (
            <text
              key={organ}
              x={(w * (i + 0.5)) / 3}
              y="343"
              textAnchor="middle"
              style={{ fill: ['#66846a', '#8b7147', '#56798e'][i] }}
            >
              {[s('根', 'Root'), s('芽', 'Bud'), s('茎', 'Stem')][i]}{' '}
              {auxinDoseResponse(concentration, organ).toFixed(2)}
            </text>
          ))}
        </svg>
      )}
      {mode === 5 && (
        <svg viewBox={`0 0 ${w} 360`} role="img" aria-label={labels[5]}>
          <text x={w / 2} y="30" textAnchor="middle">
            {hyp === 'polar'
              ? s('假说：仅向形态学下端', 'Hypothesis: baseward only')
              : s('假说：两个方向均能', 'Hypothesis: both directions')}
          </text>
          {[0, 1, 2].map((i) => {
            const x = (w * (i + 0.5)) / 3,
              f = auxinTransportAssay(p, i === 1 ? 'tipward' : 'baseward', hyp, i !== 2),
              visible = film.watch && !second && i > 0 ? 0.18 : 1;
            return (
              <g key={i} opacity={visible}>
                <rect
                  x={x - 17}
                  y="103"
                  width="34"
                  height="114"
                  rx="4"
                  fill="#b9cca0"
                  stroke="#8fa877"
                />
                {[0, 1, 2].map((n) => (
                  <path key={n} d={`M${x - 17} ${132 + n * 28}h34`} stroke="#98b284" />
                ))}
                <rect
                  x={x - 25}
                  y="79"
                  width="50"
                  height="24"
                  rx="3"
                  fill="#d4e0ca"
                  stroke="#9cb293"
                />
                <rect
                  x={x - 25}
                  y="217"
                  width="50"
                  height="24"
                  rx="3"
                  fill="#d4e0ca"
                  stroke="#9cb293"
                />
                {[f.donor, f.tissue, f.receiver].map((amount, j) =>
                  Array.from({ length: 8 }, (_, k) => (
                    <circle
                      key={`${j}-${k}`}
                      cx={x - 15 + (k % 4) * 10}
                      cy={
                        j === 0
                          ? 87 + Math.floor(k / 4) * 8
                          : j === 1
                            ? 143 + Math.floor(k / 4) * 29
                            : 224 + Math.floor(k / 4) * 9
                      }
                      r="2.3"
                      fill="#aa864d"
                      opacity={amount}
                    />
                  )),
                )}
                <path
                  d={`M${x} 132v24m-4-5 4 5 4-5`}
                  fill="none"
                  stroke="#7e9a6d"
                  strokeWidth="2"
                />
                <text x={x} y="64" textAnchor="middle">
                  {i === 1 ? s('形态下端', 'Base end') : s('形态上端', 'Tip end')}
                </text>
                <text x={x} y="270" textAnchor="middle">
                  {i === 1
                    ? s('反向', 'Reverse')
                    : i === 2
                      ? s('无供体', 'No donor')
                      : s('正向', 'Forward')}
                </text>
                <text x={x} y="301" textAnchor="middle">
                  {f.receiver.toFixed(2)}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="343" textAnchor="middle">
            {s('接收块：条件预测', 'Receiver: predicted amount')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-auxin-controls">
          <div className="bio-auxin-buttons">
            {labels.map((label, i) => (
              <button key={i} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {label}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-time`}>
            {s('过程时刻', 'Sequence time')}
            <input
              id={`${id}-time`}
              type="range"
              min="0"
              max="1"
              step=".01"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          {mode === 0 && (
            <div className="bio-auxin-buttons">
              {(['removed', 'tip-covered', 'base-covered'] as const).map((key) => (
                <button
                  key={key}
                  aria-pressed={treatment === key}
                  onClick={() => setTreatment(key)}
                >
                  {treatmentName(key)}
                </button>
              ))}
            </div>
          )}
          {mode === 1 && (
            <button aria-pressed={barrier} onClick={() => setBarrier(!barrier)}>
              {barrier
                ? s('恢复完整对照', 'Restore intact control')
                : s('改用阻隔对照', 'Use a barrier control')}
            </button>
          )}
          {mode < 2 && (
            <div className="bio-auxin-buttons">
              {(['left', 'right', 'dark'] as const).map((key) => (
                <button key={key} aria-pressed={light === key} onClick={() => setLight(key)}>
                  {
                    {
                      left: s('左侧光', 'Left light'),
                      right: s('右侧光', 'Right light'),
                      dark: s('黑暗', 'Dark'),
                    }[key]
                  }
                </button>
              ))}
            </div>
          )}
          {mode === 3 && (
            <button aria-pressed={prep} onClick={() => setPrep(!prep)}>
              {prep
                ? s('比较处理后生长', 'Compare subsequent growth')
                : s('先看琼脂接触尖端', 'Observe tip-to-agar loading')}
            </button>
          )}
          {mode === 4 && (
            <label htmlFor={`${id}-dose`}>
              {s('教学浓度', 'Teaching concentration')} · {concentration.toExponential(1)} mol/L
              <input
                id={`${id}-dose`}
                type="range"
                min="-12"
                max="-2"
                step=".1"
                value={logC}
                onChange={(e) => setLogC(+e.target.value)}
              />
            </label>
          )}
          {mode === 5 && (
            <div className="bio-auxin-buttons">
              {(['polar', 'both'] as const).map((key) => (
                <button
                  key={key}
                  aria-pressed={hypothesis === key}
                  onClick={() => setHypothesis(key)}
                >
                  {key === 'polar'
                    ? s('仅向下端', 'Baseward only')
                    : s('双向均能', 'Both directions')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <details>
        <summary>{s('历史推断与教学模型', 'Evidence and model')}</summary>
        <p>
          {s(
            '生长段两侧的长度由同一模型决定，弯曲和尖端、琼脂、遮光罩的位置从这两条边的圆弧几何导出。棕色标记表示影响的相对分布，不是历史上已经直接看见了IAA分子。根芽茎曲线为声明的示意函数，不是某品种的剂量推荐。运输视图比较两个假说的条件预测；一个正向阳性不能排除反向也能运输。极性以形态学方向定义，不能等同于重力向下；实际根内存在不同组织中的循环运输。',
            'Both side lengths determine the curved growth segment and the connected tip, agar and cap geometry. Brown markers show relative influence, not a claim that historical investigators saw IAA molecules directly. Organ-response curves are declared illustrations, not dose recommendations. Transport views compare conditional predictions: one forward positive cannot exclude reverse transport. Polarity refers to morphology rather than gravity; real roots contain distinct tissue-specific transport routes.',
          )}
        </p>
      </details>
    </div>
  );
}
