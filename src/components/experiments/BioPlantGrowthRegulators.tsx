import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  gibberellinEvidence,
  filtrateTracers,
  preliminaryDoses,
  refinedDoses,
  rootTrialCounts,
  rootTrialSummary,
  cuttingRootGeometry,
  ethyleneRipening,
} from '../../models/bio-plant-growth-regulators';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-plant-growth-regulators.css';
export default function BioPlantGrowthRegulators() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [chosen, setChosen] = useState(
      film.variant === 'bio-elective-1-103-1' ? 1 : film.variant === 'bio-elective-1-104-1' ? 2 : 0,
    ),
    [time, setTime] = useState(0.9),
    [preparation, setPreparation] = useState(false),
    [filtrate, setFiltrate] = useState(true),
    [refined, setRefined] = useState(false),
    [group, setGroup] = useState(2),
    [table, setTable] = useState(false),
    [own, setOwn] = useState(false),
    [records, setRecords] = useState<(number | null)[][]>(
      Array.from({ length: 4 }, () => [null, null, null]),
    ),
    [acid, setAcid] = useState(false),
    [sameStart, setSameStart] = useState(true);
  const mode = film.watch ? (film.chapter < 2 ? 0 : film.chapter < 5 ? 1 : 2) : chosen,
    p = film.watch ? film.chapterProgress : time;
  const prep = film.watch ? film.chapter === 0 : preparation,
    activeFiltrate = film.watch || filtrate;
  const fine = film.watch ? film.chapter >= 3 && film.chapter < 5 : refined,
    doses = fine ? refinedDoses : preliminaryDoses;
  const shown = film.watch ? Math.min(3, Math.floor(p * 4)) : group,
    rootP = film.watch ? (p === 1 ? 1 : (p * 4) % 1) : p;
  const rows = !film.watch && own ? records : doses.map(rootTrialCounts),
    summary = rootTrialSummary(rows, doses);
  const showTable = film.watch ? film.chapter === 4 : table;
  const releaseView = film.watch ? film.chapter === 5 : acid;
  const matched = film.watch ? film.chapter !== 7 || p < 0.5 : sameStart;
  const fruitTime = film.watch && film.chapter === 7 ? 1 : p;
  const labels = [
    s('赤霉菌滤液的证据', 'Evidence from fungal filtrate'),
    s('从插条到原始记录', 'From cuttings to observations'),
    s('乙烯释放与水果变化', 'Ethylene release and fruit change'),
  ];
  const rice = (identity: string, x: number, length: number, label: string) => (
    <g key={identity}>
      <path d={`M${x - 38} 280h76l-8 35h-60Z`} fill="#c6b79d" stroke="#ac9d83" />
      <ellipse cx={x} cy="280" rx="38" ry="7" fill="#b29f7a" />
      <path d={`M${x} 282V${282 - length}`} stroke="#8fa16e" strokeWidth="5" />
      {[0.3, 0.6, 0.86].map((t, i) => {
        const y = 282 - length * t,
          side = i % 2 ? -1 : 1;
        return (
          <path
            key={i}
            d={`M${x} ${y}q${side * 31}-${length * 0.34} ${side * 39}-${length * 0.29}q${-side * 13} ${length * 0.25} ${-side * 39} ${length * 0.29}`}
            fill="#a8bc81"
            stroke="#819d65"
          />
        );
      })}
      <text x={x} y="341" textAnchor="middle">
        {label}
      </text>
    </g>
  );
  return (
    <div ref={host} className="bio-regulators" data-watch={film.watch}>
      <div className="bio-regulators-head">{labels[mode]}</div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} 365`} role="img" aria-label={labels[0]}>
          {prep ? (
            <>
              <path
                d={`M${w / 2 - 43} 80H${w / 2 + 43}L${w / 2 + 4} 200V220H${w / 2 - 4}V200Z`}
                fill="#e0e6d4"
                fillOpacity=".5"
                stroke="#a2b29b"
                strokeWidth="2"
              />
              <path d={`M${w / 2 - 32} 110h64`} stroke="#cabda0" strokeWidth="5" />
              {[-20, 0, 20].map((x, i) => (
                <path
                  key={i}
                  d={`M${w / 2 + x - 7} 106q8-15 16-3m-8-3-4-12m7 14 7-10`}
                  stroke="#969d7b"
                  strokeWidth="2"
                  fill="none"
                />
              ))}
              <path
                d={`M${w / 2 - 45} 233V277q0 8 8 8h74q8 0 8-8v-44`}
                fill="#eef2e7"
                stroke="#b2bea8"
                strokeWidth="2"
              />
              <path
                d={`M${w / 2 - 41} 247h82v29q0 5-5 5h-72q-5 0-5-5Z`}
                fill="#d6ddab"
                opacity=".7"
              />
              {filtrateTracers(p).map((m) => (
                <circle key={m.id} cx={w / 2 + m.x} cy={m.y} r="3" fill="#b18c52" />
              ))}
              <text x={w / 2} y="37" textAnchor="middle">
                {s('菌丝留在滤层', 'Hyphae retained in the filter')}
              </text>
              <text x={w / 2} y="324" textAnchor="middle">
                {s('无菌体滤液 · 重建示意', 'Cell-free filtrate · reconstruction')}
              </text>
            </>
          ) : (
            <>
              <text x={w / 2} y="33" textAnchor="middle">
                {s('同龄水稻 · 相同培养条件', 'Matched rice · same conditions')}
              </text>
              {rice(
                'control',
                w * 0.27,
                gibberellinEvidence(p, false).shootLength,
                s('培养基对照', 'Medium control'),
              )}
              {rice(
                'comparison',
                w * 0.73,
                gibberellinEvidence(p, activeFiltrate).shootLength,
                activeFiltrate
                  ? s('无菌体滤液', 'Cell-free filtrate')
                  : s('培养基对照', 'Medium control'),
              )}
              <circle cx={w * 0.73} cy="76" r="4" fill="#b18c52" opacity={activeFiltrate ? 1 : 0} />
              <path
                d={`M${w * 0.73} 86v26m-4-5 4 5 4-5`}
                stroke="#b18c52"
                fill="none"
                opacity={activeFiltrate ? 1 : 0}
              />
            </>
          )}
        </svg>
      )}
      {mode === 1 && (
        <>
          {!showTable ? (
            <svg viewBox={`0 0 ${w} 335`} role="img" aria-label={labels[1]}>
              <text x={w / 2} y="28" textAnchor="middle">
                {s('浓度组', 'Dose group')} {doses[shown]} · {s('任意单位', 'arbitrary units')}
              </text>
              {rows[shown].map((n, i) => {
                const x = (w * (i + 0.5)) / 3,
                  roots = cuttingRootGeometry(n ?? 0, rootP),
                  count = roots.filter((r) => r.grown > 0.01).length;
                return (
                  <g key={i}>
                    <path
                      d={`M${x - 35} 148v121q0 9 9 9h52q9 0 9-9V148`}
                      fill="#f1f4e9"
                      stroke="#b6c3a8"
                      strokeWidth="2"
                    />
                    <path
                      d={`M${x - 31} 176h62v91q0 7-7 7h-48q-7 0-7-7Z`}
                      fill="#d8e3d1"
                      opacity=".7"
                    />
                    <path d={`M${x} 191V77`} stroke="#8da278" strokeWidth="6" />
                    {[0, 1].map((j) => (
                      <path
                        key={j}
                        d={`M${x} ${102 + j * 34}q${j ? 28 : -28}-24 ${j ? 27 : -27}-6q${j ? -8 : 8} 10 ${j ? -27 : 27} 6`}
                        fill="#a6bc8d"
                        stroke="#8ca373"
                      />
                    ))}
                    <g transform={`translate(${x} 191)`}>
                      {roots.map((r) => (
                        <path
                          key={r.id}
                          d={r.path}
                          fill="none"
                          stroke="#b4a17a"
                          strokeWidth="1.5"
                        />
                      ))}
                    </g>
                    <text x={x} y="306" textAnchor="middle">
                      {s('根数', 'Roots')} {n === null ? '—' : count}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="bio-regulators-record">
              <p>
                {!film.watch && own
                  ? s('实际记录：缺失不当作零。', 'Your records: missing is not zero.')
                  : s(
                      '模拟记录：先看每根，再比较均值。',
                      'Simulated records: individuals before means.',
                    )}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>{s('浓度', 'Dose')}</th>
                    <th>{s('三根插条', 'Three cuttings')}</th>
                    <th>{s('均值', 'Mean')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r) => (
                    <tr key={r.dose}>
                      <td>{r.dose}</td>
                      <td>{r.values.map((v) => v ?? '—').join(' / ')}</td>
                      <td>{r.mean?.toFixed(1) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                {s('已测试组中较高：', 'Highest among tested groups: ')}
                {summary.best.join(' / ') || '—'}
              </p>
            </div>
          )}
          <div className="bio-regulators-key">
            {film.watch || !own
              ? s('模拟观察 · 同材龄、同时长', 'Simulated · matched conditions')
              : s('你的观察记录', 'Your observations')}
          </div>
        </>
      )}
      {mode === 2 && (
        <svg viewBox={`0 0 ${w} 370`} role="img" aria-label={labels[2]}>
          <text x={w / 2} y="29" textAnchor="middle">
            {releaseView
              ? s('乙烯利的分解条件', 'Ethephon decomposition')
              : matched
                ? s('相同初始成熟度', 'Matched initial maturity')
                : s('初始成熟度不一致', 'Different initial maturity')}
          </text>
          {[0, 1].map((i) => {
            const x = w * (i ? 0.74 : 0.26),
              treated = releaseView || i === 1,
              ph = releaseView ? (i ? 6 : 3) : 6,
              f = ethyleneRipening(fruitTime, treated, ph, !matched && i === 0 ? 0.45 : 0.08),
              m = releaseView ? 0.08 : f.maturity;
            return (
              <g key={i}>
                <path
                  d={`M${x - 42} 91h84v113q0 16-16 16h-52q-16 0-16-16Z`}
                  stroke="#c3cbb7"
                  strokeDasharray="5 7"
                  fill="#edf1e7"
                  fillOpacity=".4"
                />
                <path
                  d={`M${x} 141C${x - 56} 108 ${x - 57} 191 ${x - 22} 203Q${x} 219 ${x + 22} 203C${x + 57} 191 ${x + 56} 108 ${x} 141Z`}
                  fill={`rgb(${Math.round(145 + 75 * m)},${Math.round(171 - 60 * m)},${Math.round(99 - 29 * m)})`}
                  stroke="#9da47b"
                  strokeWidth="2"
                />
                <path d={`M${x} 143l-17-9 13 2 4-12 4 12 13-2Z`} fill="#789564" />
                {treated && (
                  <>
                    <path d={`M${x - 6} 50h12v25l-6 8-6-8Z`} fill="#d9c5a1" stroke="#a69a7e" />
                    <path d={`M${x} 86v31`} stroke="#c5ab75" strokeDasharray="3 8" />
                  </>
                )}
                {Array.from({ length: 6 }, (_, j) => {
                  const q = Math.max(0, Math.min(1, (f.external - j * 0.02) / 0.7));
                  return (
                    <circle
                      key={j}
                      cx={x + (-20 + (j % 3) * 20) * q}
                      cy={132 - q * (35 + (j % 2) * 16)}
                      r="3"
                      fill="#b7955e"
                      opacity={q > 0 ? 0.65 : 0}
                    />
                  );
                })}
                <text x={x} y="249" textAnchor="middle">
                  {releaseView
                    ? `pH ${ph}`
                    : treated
                      ? s('乙烯利组', 'Ethephon')
                      : s('对照组', 'Control')}
                </text>
                <text x={x} y="280" textAnchor="middle">
                  {releaseView ? s('释放量', 'Released') : s('相对硬度', 'Firmness')}
                </text>
                <path
                  d={`M${x - 38} 300h76`}
                  stroke="#e0e5d7"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d={`M${x - 38} 300h${76 * (releaseView ? f.external : f.firmness)}`}
                  stroke="#a5b58c"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <text x={x} y="332" textAnchor="middle">
                  {(releaseView ? f.external : f.firmness).toFixed(2)}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="364" textAnchor="middle">
            {s('归一化模拟 · 不是实测数据', 'Normalized simulation')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-regulators-controls">
          <div className="bio-regulators-buttons">
            {labels.map((x, i) => (
              <button key={x} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {x}
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
            <div className="bio-regulators-buttons">
              <button aria-pressed={preparation} onClick={() => setPreparation(!preparation)}>
                {preparation
                  ? s('看水稻比较', 'Compare rice')
                  : s('看滤液准备', 'Prepare filtrate')}
              </button>
              <button aria-pressed={filtrate} onClick={() => setFiltrate(!filtrate)}>
                {s('加入无菌体滤液', 'Add cell-free filtrate')}
              </button>
            </div>
          )}
          {mode === 1 && (
            <>
              <div className="bio-regulators-buttons">
                <button
                  aria-pressed={refined}
                  onClick={() => {
                    setRefined(!refined);
                    setOwn(false);
                  }}
                >
                  {refined
                    ? s('已细化梯度', 'Refined doses')
                    : s('预实验梯度', 'Preliminary doses')}
                </button>
                <button aria-pressed={table} onClick={() => setTable(!table)}>
                  {s('记录表', 'Record table')}
                </button>
                <button aria-pressed={own} onClick={() => setOwn(!own)}>
                  {s('录入实际观察', 'Enter observations')}
                </button>
              </div>
              <div className="bio-regulators-buttons">
                {doses.map((dose, i) => (
                  <button key={dose} aria-pressed={group === i} onClick={() => setGroup(i)}>
                    {dose}
                  </button>
                ))}
              </div>
              {own && (
                <div className="bio-regulators-inputs">
                  {records[group].map((n, i) => (
                    <label key={i} htmlFor={`${id}-root-${i}`}>
                      {s('插条', 'Cutting')} {i + 1}
                      <input
                        id={`${id}-root-${i}`}
                        type="number"
                        min="0"
                        max="30"
                        value={n ?? ''}
                        onChange={(e) =>
                          setRecords(
                            records.map((r, j) =>
                              j === group
                                ? r.map((v, k) =>
                                    k === i
                                      ? e.target.value === ''
                                        ? null
                                        : Math.max(0, Math.min(30, +e.target.value))
                                      : v,
                                  )
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
          {mode === 2 && (
            <div className="bio-regulators-buttons">
              <button aria-pressed={acid} onClick={() => setAcid(!acid)}>
                {s('比较分解条件', 'Compare decomposition')}
              </button>
              <button aria-pressed={sameStart} onClick={() => setSameStart(!sameStart)}>
                {s('匹配初始成熟度', 'Match initial maturity')}
              </button>
            </div>
          )}
        </div>
      )}
      <details>
        <summary>{s('模型、观察与限制', 'Evidence and model')}</summary>
        <p>
          {s(
            '滤液视图重建无菌体但仍有可溶性生长作用的证据，不把生长变化等同于菌体感染。插条记录默认是生成的教学样本，所有浓度为任意单位；录入后用你的计数计算，不把平滑理论曲线当成实验记录。比较必须匹配材料、处理方法、时长及观察日。水果模型只示范乙烯利分解、乙烯及成熟度的关系，pH响应不是精确阈值，颜色不能独自代表全部成熟指标；不提供食用水果处理配方。',
            'The cell-free filtrate reconstruction separates soluble growth effects from infection. Cutting counts default to generated examples in arbitrary concentration units; entered counts replace those examples. Match material, method, exposure and observation time. Fruit kinetics illustrate decomposition, ethylene and maturity; the pH response is not a precise threshold and color alone is not a complete maturity measure. This is not a food-treatment recipe.',
          )}
        </p>
      </details>
    </div>
  );
}
