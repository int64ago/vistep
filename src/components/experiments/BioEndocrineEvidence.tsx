import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  pancreaticEvidence,
  graftEvidence,
  embryoEvidence,
  glucoseFeedback,
  thyroidFeedback,
  type ThyroidIntervention,
} from '../../models/bio-endocrine-evidence';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-endocrine-evidence.css';
const ids = [
  'bio-elective-1-046-1',
  'bio-elective-1-047-1',
  'bio-elective-1-049-1',
  'bio-elective-1-mechanism-16',
  'bio-elective-1-053-1',
];
export default function BioEndocrineEvidence() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    en = browserLocale() === 'en',
    s = (a: string, b: string) => (en ? b : a);
  const [chosen, setChosen] = useState(Math.max(0, ids.indexOf(film.variant ?? ''))),
    [progress, setProgress] = useState(0.8),
    [treatment, setTreatment] = useState(2),
    [gonads, setGonads] = useState(false),
    [androgen, setAndrogen] = useState(false),
    [meal, setMeal] = useState(1),
    [feedback, setFeedback] = useState(true),
    [fasting, setFasting] = useState(false),
    [thyroid, setThyroid] = useState<ThyroidIntervention>('normal');
  const mode = film.watch ? Math.min(4, Math.floor(film.chapter / 2)) : chosen,
    p = film.watch ? film.chapterProgress : progress,
    second = film.chapter % 2 === 1;
  const treat = film.watch ? (second ? 2 : 1) : treatment,
    gl = glucoseFeedback(
      p * 12,
      film.watch ? 1 : meal,
      film.watch ? true : feedback,
      film.watch ? second : fasting,
    );
  const ti: ThyroidIntervention = film.watch
      ? ((['remove-pituitary', 'replace-tsh', 'add-trh', 'extra-thyroid'] as const)[
          Math.max(0, film.chapter - 8)
        ] ?? 'normal')
      : thyroid,
    th = thyroidFeedback(p * 15, ti);
  const thyroidLabels = {
    normal: s('正常', 'Normal'),
    'remove-pituitary': s('垂体缺失', 'Pituitary absent'),
    'replace-tsh': s('垂体缺失 + TSH', 'Absent pituitary + TSH'),
    'add-trh': s('补充 TRH', 'Add TRH'),
    'extra-thyroid': s('增加甲状腺激素', 'Extra thyroid hormone'),
  };
  const labels = [
    s('胰岛与血糖', 'Islets and blood glucose'),
    s('摘除与移植', 'Removal and grafting'),
    s('兔胚胎的证据', 'Rabbit-embryo evidence'),
    s('血糖反馈', 'Glucose feedback'),
    s('甲状腺轴', 'Thyroid axis'),
  ];
  const trace = (values: number[], top: number, height: number, max: number) =>
    values
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${28 + ((w - 56) * i) / (values.length - 1)},${top + height - (height * v) / max}`,
      )
      .join(' ');
  const graphTop = compact ? 235 : 250;
  return (
    <div ref={host} className="bio-endocrine" data-watch={film.watch}>
      <div className="bio-endocrine-heading">
        <span>{labels[mode]}</span>
        <small>
          {mode === 3 ? s('机制模型', 'Mechanism model') : s('证据重建', 'Evidence reconstruction')}
        </small>
      </div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} ${compact ? 390 : 365}`} role="img" aria-label={labels[0]}>
          <defs>
            <clipPath id={`${id}-pancreas`}>
              <path
                d={`M${w * 0.12} 94Q${w * 0.25} 54 ${w * 0.5} 78Q${w * 0.7} 70 ${w * 0.88} 108Q${w * 0.7} 139 ${w * 0.49} 124Q${w * 0.25} 146 ${w * 0.12} 94Z`}
              />
            </clipPath>
          </defs>
          <text x={w / 2} y="28" textAnchor="middle">
            {s('供体：结扎胰管', 'Donor: duct ligated')}
          </text>
          <path
            d={`M${w * 0.12} 94Q${w * 0.25} 54 ${w * 0.5} 78Q${w * 0.7} 70 ${w * 0.88} 108Q${w * 0.7} 139 ${w * 0.49} 124Q${w * 0.25} 146 ${w * 0.12} 94Z`}
            fill="#e3d4bc"
            stroke="#ae9779"
          />
          <g clipPath={`url(#${id}-pancreas)`}>
            {Array.from({ length: 24 }, (_, i) => (
              <ellipse
                key={i}
                cx={w * (0.18 + ((i * 17) % 66) / 100)}
                cy={80 + ((i * 23) % 51)}
                rx="9"
                ry="8"
                fill="#bc9774"
                opacity={0.15 + 0.5 * Math.exp(-4 * p)}
              />
            ))}
          </g>
          {[0.29, 0.49, 0.69].map((q) => (
            <circle key={q} cx={w * q} cy="106" r="10" fill="#91a776" />
          ))}
          <path
            d={`M${w * 0.24} 114H${w * 0.79}m-15-8 7 16m-3-16 7 16`}
            stroke="#a48668"
            strokeWidth="2"
            fill="none"
          />
          <text x={w * 0.49} y="155" textAnchor="middle">
            {s('腺泡退化 · 胰岛保留', 'Acini regress · islets remain')}
          </text>
          <path
            d={`M${w * 0.49} 164v25m-6-8 6 8 6-8`}
            stroke="#91a776"
            strokeWidth="3"
            fill="none"
            opacity={treat === 2 ? (p >= 0.45 ? 1 : 0.25) : 0.15}
          />
          <text x={w / 2} y="215" textAnchor="middle">
            {treat === 0
              ? s('对照：胰腺完整', 'Control: intact pancreas')
              : treat === 1
                ? s('受体：去胰腺', 'Recipient: pancreas absent')
                : s('去胰腺 + 提取物', 'Absent pancreas + extract')}
          </text>
          <rect x="25" y="231" width={w - 50} height="32" rx="16" fill="#ecd5c7" stroke="#bda18b" />
          {Array.from(
            {
              length: Math.round(
                pancreaticEvidence(p, (['intact', 'removed', 'extract'] as const)[treat]).glucose *
                  12,
              ),
            },
            (_, i) => (
              <circle
                key={i}
                cx={37 + ((i * 37) % (w - 74))}
                cy={241 + (i % 2) * 11}
                r="3"
                fill="#ad8961"
              />
            ),
          )}
          {(['intact', 'removed', 'extract'] as const).map((c, i) => (
            <path
              key={c}
              d={trace(
                Array.from({ length: 81 }, (_, n) => pancreaticEvidence(n / 80, c).glucose),
                278,
                compact ? 65 : 42,
                2.5,
              )}
              stroke={['#8ca080', '#bf9881', '#8d9fb0'][i]}
              strokeWidth={i === treat ? 3 : 1.5}
              opacity={i === treat ? 1 : 0.3}
              fill="none"
            />
          ))}
          <text x={w / 2} y={compact ? 376 : 350} textAnchor="middle">
            {s('相对血糖', 'Relative glucose')}{' '}
            {pancreaticEvidence(
              p,
              (['intact', 'removed', 'extract'] as const)[treat],
            ).glucose.toFixed(2)}
          </text>
        </svg>
      )}
      {mode === 1 && (
        <svg viewBox={`0 0 ${w} 340`} role="img" aria-label={labels[1]}>
          {(['intact', 'removed', 'graft'] as const).map((c, i) => {
            const f = graftEvidence(film.watch ? (second ? 0.5 + p * 0.5 : p * 0.5) : p, c),
              x = (w * (i + 0.5)) / 3,
              scale = Math.min(1, w / 470);
            return (
              <g key={c} transform={`translate(${x} 150)`}>
                <g transform={`scale(${scale})`}>
                  <path
                    d="M-33 26Q-55-11-22-24Q0-50 22-24Q41-2 22 31L30 54H-24Z"
                    fill="#e8e0ca"
                    stroke="#b5aa8a"
                    strokeWidth="2"
                  />
                  <path
                    d="M-9-25Q-20-66-9-65Q1-80 8-61Q20-77 25-49Q34-43 20-22Z"
                    transform={`translate(0 ${-25 * (1 - f.combSize)}) scale(1 ${f.combSize})`}
                    fill="#b78277"
                  />
                  <circle cx="13" cy="-9" r="3" fill="#554f46" />
                  <path d="m24-8 19 6-17 6" fill="#c5a469" />
                  <path
                    d="M-14 54v19m20-19v19m-23 0h11m9 0h11"
                    stroke="#ab946b"
                    strokeWidth="3"
                    fill="none"
                  />
                </g>
                <text y="119" textAnchor="middle">
                  {[s('正常', 'Intact'), s('摘除', 'Removed'), s('移植', 'Graft')][i]}
                </text>
                <circle cy="-112" r="6" fill="#9eaf78" opacity={f.glandPresent ? 1 : 0.15} />
              </g>
            );
          })}
        </svg>
      )}
      {mode === 2 && (
        <>
          <table>
            <thead>
              <tr>
                <th>{s('染色体', 'XX / XY')}</th>
                <th>{s('保留性腺', 'Gonads intact')}</th>
                <th>
                  {film.watch
                    ? second
                      ? s('预测：补雄激素', 'Predict: androgen')
                      : s('去性腺', 'Gonads removed')
                    : gonads
                      ? s('保留性腺', 'Gonads intact')
                      : androgen
                        ? s('预测：补雄激素', 'Predict: androgen')
                        : s('去性腺', 'Gonads removed')}
                </th>
              </tr>
            </thead>
            <tbody>
              {(['XX', 'XY'] as const).map((c) => {
                const f = embryoEvidence(
                  c,
                  film.watch ? false : gonads,
                  film.watch ? second : androgen,
                );
                return (
                  <tr key={c}>
                    <td>{c}</td>
                    <td>{c === 'XY' ? s('雄性', 'Male') : s('雌性', 'Female')}</td>
                    <td>
                      {f.externalPattern === 'male' ? s('雄性', 'Male') : s('雌性', 'Female')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!film.watch && (
            <p className="bio-endocrine-note">
              {s(
                '表中只记录该兔胚胎比较的外生殖器发育表现；不能推广为所有性分化过程只需一种激素。',
                'The table records external genital development in this rabbit comparison; it does not reduce all sexual differentiation to one hormone.',
              )}
            </p>
          )}
        </>
      )}
      {mode === 3 && (
        <svg viewBox={`0 0 ${w} 360`} role="img" aria-label={labels[3]}>
          <rect x="25" y="75" width={w - 50} height="44" rx="22" fill="#edd9cc" stroke="#c1a490" />
          {Array.from({ length: Math.round(gl.glucose * 24) }, (_, i) => (
            <circle
              key={i}
              cx={39 + ((i * 37) % (w - 78))}
              cy={87 + (i % 2) * 17}
              r="4"
              fill="#ab8651"
            />
          ))}
          <text x={w / 2} y="45" textAnchor="middle">
            {(film.watch ? second : fasting)
              ? s('禁食条件', 'Fasting condition')
              : s('进食条件', 'Fed condition')}{' '}
            · {gl.glucose.toFixed(2)}
          </text>
          <ellipse
            cx={w * 0.27}
            cy="174"
            rx={Math.min(55, w * 0.18)}
            ry="30"
            fill="#c9d3b3"
            stroke="#9bac84"
          />
          <text x={w * 0.27} y="180" textAnchor="middle">
            {s('胰岛', 'Islets')}
          </text>
          <path
            d={`M${w * 0.65} 145q${w * 0.22}-3 ${w * 0.17} 45q-${w * 0.25} 27-${w * 0.22}-12Z`}
            fill="#ba9c85"
          />
          <text x={w * 0.71} y="181" textAnchor="middle">
            {s('肝', 'Liver')}
          </text>
          <path
            d={`M${w * 0.27} 126v15m-5-6 5 6 5-6M${w * 0.41} 174H${w * 0.53}m-7-5 7 5-7 5M${w * 0.72} 145v-20m-5 6 5-6 5 6`}
            stroke="#8b9b78"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={gl.points
              .map(
                (f, i) =>
                  `${i ? 'L' : 'M'}${28 + ((w - 56) * f.time) / 12},${315 - f.glucose * 35}`,
              )
              .join(' ')}
            stroke="#b39062"
            strokeWidth="3"
            fill="none"
          />
          <text x={w / 2} y="323" textAnchor="middle">
            {s('相对基线的调节增量', 'Response above baseline')}
          </text>
          <text x={w / 2} y="348" textAnchor="middle">
            {s('胰岛素', 'Insulin')} {gl.insulin.toFixed(2)} · {s('胰高血糖素', 'Glucagon')}{' '}
            {gl.glucagon.toFixed(2)}
          </text>
        </svg>
      )}
      {mode === 4 && (
        <svg viewBox={`0 0 ${w} 385`} role="img" aria-label={labels[4]}>
          <text x={w / 2} y="20" textAnchor="middle">
            {thyroidLabels[ti]}
          </text>
          <g transform="translate(0 18)">
            {[s('下丘脑', 'Hypothalamus'), s('垂体', 'Pituitary'), s('甲状腺', 'Thyroid')].map(
              (label, i) => (
                <g key={label}>
                  <ellipse
                    cx={w * 0.42}
                    cy={55 + i * 93}
                    rx={Math.min(90, w * 0.3)}
                    ry="28"
                    fill={['#ddd3bd', '#d8debf', '#c6d8cb'][i]}
                    stroke="#a7b19a"
                    opacity={
                      i === 1 && (ti === 'remove-pituitary' || ti === 'replace-tsh') ? 0.2 : 1
                    }
                  />
                  <text x={w * 0.42} y={60 + i * 93} textAnchor="middle">
                    {label}
                  </text>
                  {i === 1 && (ti === 'remove-pituitary' || ti === 'replace-tsh') && (
                    <path d={`M${w * 0.18} 166L${w * 0.65} 130`} stroke="#bc8e78" strokeWidth="2" />
                  )}
                  <text x={w * 0.87} y={49 + i * 93} textAnchor="middle">
                    <tspan x={w * 0.87}>{['TRH', 'TSH', 'TH'][i]}</tspan>
                    <tspan x={w * 0.87} dy="21">
                      {[th.h, th.s, th.t][i].toFixed(2)}
                    </tspan>
                  </text>
                  {i < 2 && (
                    <>
                      <path
                        d={`M${w * 0.42} ${86 + i * 93}v28m-6-8 6 8 6-8`}
                        stroke="#9ba982"
                        strokeWidth="2"
                        fill="none"
                      />
                      <text x={w * 0.42 + 12} y={106 + i * 93}>
                        {i === 0 ? 'TRH' : 'TSH'}
                      </text>
                    </>
                  )}
                </g>
              ),
            )}
            <path
              d={`M${w * 0.16} 241H${w * 0.08}V55H${w * 0.16}`}
              stroke="#bc8e78"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M${w * 0.16} 48v14M${w * 0.16} 141v14M${w * 0.08} 148H${w * 0.16}`}
              stroke="#bc8e78"
              strokeWidth="2"
            />
            <text x={w / 2} y="307" textAnchor="middle">
              {s('下游抑制上游', 'Downstream inhibits upstream')}
            </text>
            <text x={w / 2} y="338" textAnchor="middle">
              {s('相对激素水平', 'Relative hormone levels')}
            </text>
          </g>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-endocrine-controls">
          <div className="bio-endocrine-buttons">
            {labels.map((label, i) => (
              <button key={label} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {label}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-p`}>
            {s('过程时刻', 'Sequence position')}
            <input
              id={`${id}-p`}
              type="range"
              min="0"
              max="1"
              step=".01"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 ? (
            <div className="bio-endocrine-buttons">
              {[s('保留', 'Intact'), s('摘除', 'Removed'), s('补回信号', 'Restore signal')].map(
                (label, i) => (
                  <button
                    key={label}
                    aria-pressed={treatment === i}
                    onClick={() => setTreatment(i)}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          ) : mode === 1 ? null : mode === 2 ? (
            <div className="bio-endocrine-buttons">
              <button aria-pressed={gonads} onClick={() => setGonads(!gonads)}>
                {s('保留性腺', 'Gonads intact')}
              </button>
              <button aria-pressed={androgen} onClick={() => setAndrogen(!androgen)}>
                {s('补充雄激素信号', 'Add androgen signal')}
              </button>
            </div>
          ) : mode === 3 ? (
            <>
              <label htmlFor={`${id}-meal`}>
                {s('营养输入幅度', 'Nutrient-input amplitude')}
                <input
                  id={`${id}-meal`}
                  type="range"
                  min="0"
                  max="2"
                  step=".1"
                  value={meal}
                  onChange={(e) => setMeal(+e.target.value)}
                />
              </label>
              <button aria-pressed={fasting} onClick={() => setFasting(!fasting)}>
                {s('改为禁食条件', 'Use fasting condition')}
              </button>
              <button aria-pressed={feedback} onClick={() => setFeedback(!feedback)}>
                {s('反馈调节开启', 'Feedback enabled')}
              </button>
            </>
          ) : (
            <div className="bio-endocrine-buttons">
              {(
                ['normal', 'remove-pituitary', 'replace-tsh', 'extra-thyroid', 'add-trh'] as const
              ).map((key, i) => (
                <button key={key} aria-pressed={thyroid === key} onClick={() => setThyroid(key)}>
                  {
                    [
                      s('正常', 'Normal'),
                      s('垂体缺失', 'Pituitary absent'),
                      s('补充TSH', 'Add TSH'),
                      s('甲状腺激素增加', 'Extra thyroid hormone'),
                      s('补充TRH', 'Add TRH'),
                    ][i]
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <details>
        <summary>{s('干预与证据边界', 'Interventions and evidence')}</summary>
        <p>
          {s(
            '胰岛与移植图重建历史结论，变化曲线和速度均为归一化教学选值，不是原始实验数据。血糖与甲状腺轴采用明确的源汇和负反馈模型，不能用于临床预测。兔胚胎表格限于教材条件和外生殖器观察，不代表性染色体被改变，也没有描述完整的生殖系统分化。',
            'Islet and graft views reconstruct historical conclusions with normalized teaching curves, not original data. Glucose and thyroid views use source–sink and negative-feedback models, not clinical predictions. The rabbit table concerns the stated conditions and external development; chromosomes do not change, and complete reproductive differentiation is outside scope.',
          )}
        </p>
      </details>
    </div>
  );
}
