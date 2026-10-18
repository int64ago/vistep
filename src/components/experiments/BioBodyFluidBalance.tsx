import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  extracellularTracer,
  practiceTemperatureRecords,
  practiceHousehold,
  practiceAirTemperature,
  sodiumRegulation,
  temperatureTimes,
  temperatureSummary,
  thermalRegulation,
  waterRegulation,
} from '../../models/bio-body-fluid-balance';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-body-fluid-balance.css';
export default function BioBodyFluidBalance() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId(),
    en = browserLocale() === 'en',
    s = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState(
      film.variant === 'bio-elective-1-012-1'
        ? 1
        : film.variant === 'bio-elective-1-mechanism-17'
          ? 2
          : 0,
    ),
    [p, setP] = useState(0.7),
    [lymph, setLymph] = useState(true),
    [household, setHousehold] = useState<(number | null)[][]>(
      practiceHousehold.map((row) => [...row]),
    ),
    [person, setPerson] = useState(0),
    [recordIndex, setRecordIndex] = useState(0),
    [feedback, setFeedback] = useState(true),
    [waterView, setWaterView] = useState(false),
    [saltView, setSaltView] = useState(false),
    [disturbance, setDisturbance] = useState(1);
  const active = film.watch ? Math.min(2, Math.floor(film.chapter / 2)) : mode,
    progress = film.watch ? film.chapterProgress : p,
    water = film.watch ? film.chapter >= 5 : waterView,
    salt = film.watch ? film.chapter === 6 : saltView,
    records = household[person],
    setRecords = (next: (number | null)[]) =>
      setHousehold(household.map((row, i) => (i === person ? next : row)));
  const tracer = extracellularTracer(
      film.watch ? (film.chapter === 0 ? progress * 10 : 10 + progress * 30) : progress * 40,
      film.watch ? true : lymph,
    ),
    shown = film.watch
      ? practiceTemperatureRecords.map((v, i) =>
          film.chapter === 2 && i > Math.floor(progress * 6) ? null : v,
        )
      : records,
    summary = temperatureSummary(shown);
  const heat = thermalRegulation(
      progress * 12,
      film.watch ? 1 : disturbance,
      film.watch ? true : feedback,
    ),
    fluid = waterRegulation(
      progress * 10,
      film.watch ? 1 : disturbance,
      film.watch ? true : feedback,
    );
  const sodium = sodiumRegulation(
    progress * 10,
    film.watch ? 1 : disturbance,
    film.watch ? true : feedback,
  );
  const series = film.watch ? (film.chapter === 2 ? [shown] : practiceHousehold) : household;
  const labels = [
    s('血浆 · 组织液 · 淋巴液', 'Plasma · interstitial fluid · lymph'),
    s('一天中的体温记录', 'Temperature records through a day'),
    s('体温与水盐调节', 'Temperature and water regulation'),
  ];
  const plotY = (temp: number) => 203 - (temp - 35.5) * 45,
    plotX = (i: number) => 35 + ((w - 70) * i) / 6;
  return (
    <div ref={host} className="bio-fluid">
      <div className="bio-fluid-heading">{labels[active]}</div>
      {active === 0 && (
        <svg viewBox={`0 0 ${w} 365`} role="img" aria-label={labels[0]}>
          <rect x="20" y="47" width={w - 40} height="45" rx="22" fill="#ecd7d0" stroke="#b78f87" />
          <path
            d={`M35 286H${w - 35}q15 0 15-18v-19H20v19q0 18 15 18Z`}
            fill="#e3eacd"
            stroke="#a3b58b"
          />
          <text x={w / 2} y="26" textAnchor="middle">
            {s('血浆', 'Plasma')}
          </text>
          <text x="20" y="235">
            {s('组织液', 'Interstitial fluid')}
          </text>
          <text x={w / 2} y="315" textAnchor="middle">
            {s('淋巴液', 'Lymph')}
          </text>
          {[0.2, 0.47, 0.73].map((q, i) => (
            <g key={q}>
              <ellipse
                cx={w * q}
                cy={147 + (i % 2) * 13}
                rx={Math.min(42, w * 0.12)}
                ry="30"
                fill="#d7e1cf"
                stroke="#a7bba2"
              />
              <ellipse cx={w * q + 8} cy={146 + (i % 2) * 13} rx="10" ry="8" fill="#afc3aa" />
            </g>
          ))}
          {[0.335, 0.87].map((q, i) => (
            <path
              key={q}
              d={i ? `M${w * q} 203V102m-5 7 5-7 5 7` : `M${w * q} 100v101m-5-7 5 7 5-7`}
              stroke="#b4947c"
              strokeWidth="2"
              fill="none"
            />
          ))}
          <path
            d={`M${w * 0.6} 220v25m-5-7 5 7 5-7M${w - 25} 267h17V69h-10m5-5-5 5 5 5`}
            stroke="#8ca67a"
            strokeWidth="2"
            fill="none"
          />
          {tracer.amount.map((amount, i) =>
            Array.from({ length: Math.round(amount * 45) }, (_, n) => (
              <circle
                key={`${i}-${n}`}
                cx={31 + ((n * 37) % (w - 62))}
                cy={i === 0 ? 62 + (n % 2) * 14 : i === 1 ? 202 + (n % 2) * 12 : 262 + (n % 2) * 12}
                r="3"
                fill="#92784e"
              />
            )),
          )}
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx={38 + (i * (w - 76)) / 7} cy="69" rx="6" ry="4" fill="#c28d83" />
          ))}
          <text x={w / 2} y="350" textAnchor="middle">
            {s('示踪物总量', 'Total tracer')} = {tracer.total.toFixed(3)}
          </text>
        </svg>
      )}
      {active === 1 && (
        <>
          <svg
            viewBox={`0 0 ${w} ${series.length > 1 ? 340 : 240}`}
            role="img"
            aria-label={s(
              '家庭成员体温与环境记录',
              'Household temperature and ambient observations',
            )}
          >
            {[36, 37, 38].map((v) => (
              <g key={v}>
                <path d={`M32 ${plotY(v)}H${w - 20}`} stroke="#dfe6e0" />
                <text x="28" y={plotY(v) + 5} textAnchor="end">
                  {v}
                </text>
              </g>
            ))}
            {series.map((row, personIndex) =>
              row.map(
                (v, i) =>
                  v !== null && (
                    <g key={`${personIndex}-${i}`}>
                      {i > 0 && row[i - 1] !== null && (
                        <path
                          d={`M${plotX(i - 1)} ${plotY(row[i - 1]!)}L${plotX(i)} ${plotY(v)}`}
                          stroke={['#789a83', '#ac987c', '#889fba'][personIndex]}
                          strokeWidth="2"
                        />
                      )}
                      <circle
                        cx={plotX(i)}
                        cy={plotY(v)}
                        r="4"
                        fill={['#789a83', '#ac987c', '#889fba'][personIndex]}
                      />
                    </g>
                  ),
              ),
            )}
            <text x={w / 2} y="26" textAnchor="middle">
              {s('练习记录 · 非实测样本', 'Practice records · not measured')}
            </text>
            {series.map((_, i) => (
              <text
                key={i}
                x={(w * (i + 0.5)) / series.length}
                y="55"
                textAnchor="middle"
                style={{ fill: ['#789a83', '#ac987c', '#889fba'][i] }}
              >
                {[s('母亲', 'Mother'), s('父亲', 'Father'), s('自己', 'Self')][i]}
              </text>
            ))}
            {temperatureTimes.map((time, i) => (
              <text key={i} x={plotX(i)} y="227" textAnchor="middle">
                {i === 6 ? s('睡前', 'Bed') : time}
              </text>
            ))}
            {series.length > 1 && (
              <>
                <text x="28" y="258">
                  {s('气温（另用刻度）', 'Air (separate scale)')}
                </text>
                <path
                  d={practiceAirTemperature
                    .map((v, i) => `${i ? 'L' : 'M'}${plotX(i)},${316 - (v - 18) * 3.4}`)
                    .join(' ')}
                  fill="none"
                  stroke="#b7ac91"
                  strokeWidth="2"
                />
                <text x="28" y="333">
                  18–28 ℃
                </text>
              </>
            )}
          </svg>
          <table>
            <tbody>
              <tr>
                <th>{s('记录数', 'Count')}</th>
                <td>{summary.count}</td>
                <th>{s('变幅', 'Range')}</th>
                <td>{summary.range === null ? '—' : summary.range.toFixed(2)} ℃</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
      {active === 2 && (
        <svg viewBox={`0 0 ${w} 350`} role="img" aria-label={labels[2]}>
          <path
            d={`M${w * 0.44} 68q-${w * 0.14} 25-${w * 0.11} 71l-${w * 0.06} 86h${w * 0.15}l${w * 0.03} 80h${w * 0.08}l${w * 0.03}-80h${w * 0.15}l-${w * 0.06}-86q${w * 0.03}-46-${w * 0.11}-71Z`}
            fill="#e6dfcd"
            stroke="#b7b098"
            strokeWidth="2"
          />
          <ellipse cx={w / 2} cy="48" rx="27" ry="31" fill="#e4d9c7" stroke="#b7aa92" />
          {!salt && <circle cx={w / 2} cy="48" r="8" fill="#b5c6a4" />}
          {water ? (
            <>
              <path
                d={`M${w * 0.42} 153q-23-23-28 7t28 22M${w * 0.58} 153q23-23 28 7t-28 22`}
                fill="#b68f7f"
                stroke="#997766"
              />
              <path
                d={`M${w * 0.42} 174v53q0 13 ${w * 0.08} 13q${w * 0.08} 0 ${w * 0.08}-13v-53`}
                fill="none"
                stroke="#a89974"
                strokeWidth="3"
              />
              {salt ? (
                <g>
                  {[0.42, 0.58].map((fraction) => (
                    <g key={fraction}>
                      <path
                        d={`M${w * fraction - 13} 140q13-12 26 0`}
                        fill="#b5c6a4"
                        stroke="#93a97f"
                      />
                      <path
                        d={`M${w * fraction} 142v19`}
                        stroke="#93a97f"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    </g>
                  ))}
                </g>
              ) : (
                <path
                  d={`M${w * 0.5} 57V133`}
                  stroke="#93a97f"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                />
              )}
              <text x={w / 2} y="334" textAnchor="middle">
                {salt ? s('相对钠量', 'Relative sodium') : s('相对水量', 'Relative water')}{' '}
                {salt ? sodium.sodium.toFixed(3) : fluid.water.toFixed(3)}
              </text>
              <text x="20" y="135">
                {salt ? s('醛固酮', 'Aldosterone') : 'ADH'}{' '}
                {(salt ? sodium.signal : fluid.signal).toFixed(2)}
              </text>
              <text x={w - 20} y="279" textAnchor="end">
                {salt ? s('尿钠', 'Urine Na⁺') : s('尿水', 'Urine water')}{' '}
                {(salt ? sodium.urine : fluid.urine).toFixed(3)}
              </text>
            </>
          ) : (
            <>
              <path
                d={`M20 134H${w * 0.31}m-8-6 8 6-8 6`}
                opacity={Math.abs(heat.drive) > 0 ? 1 : 0.15}
                stroke="#bd8c67"
                strokeWidth="3"
                fill="none"
              />
              <path
                d={`M${w * 0.69} 140H${w - 20}m-8-6 8 6-8 6`}
                stroke="#bd8c67"
                strokeWidth="3"
                fill="none"
              />
              {[0, 1, 2].map((i) => (
                <path
                  key={i}
                  d={`M${w * 0.66 + i * 9} 97q-6 10 0 13q6-3 0-13`}
                  fill="#87abb7"
                  opacity={Math.min(1, Math.abs(heat.response) * 3)}
                />
              ))}
              <text x={w / 2} y="334" textAnchor="middle">
                {s('温差示意', 'Temperature deviation')} {heat.deviation.toFixed(2)}
              </text>
              <text x="20" y="116">
                {heat.drive ? s('热输入', 'Heat in') : s('输入停止', 'Input stopped')}
              </text>
              <text x={w - 20} y="173" textAnchor="end">
                {s('散热响应', 'Heat loss')}
              </text>
            </>
          )}
        </svg>
      )}
      {!film.watch && (
        <div className="bio-fluid-controls">
          <div className="bio-fluid-buttons">
            {labels.map((l, i) => (
              <button key={l} aria-pressed={mode === i} onClick={() => setMode(i)}>
                {l}
              </button>
            ))}
          </div>
          {active === 1 ? (
            <>
              <div className="bio-fluid-buttons">
                {[s('母亲', 'Mother'), s('父亲', 'Father'), s('自己', 'Self')].map((label, i) => (
                  <button key={label} aria-pressed={person === i} onClick={() => setPerson(i)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="bio-fluid-buttons">
                {temperatureTimes.map((t, i) => (
                  <button
                    key={t}
                    aria-pressed={recordIndex === i}
                    onClick={() => setRecordIndex(i)}
                  >
                    {i === 6 ? s('睡前', 'Bedtime') : `${t}:00`}
                  </button>
                ))}
              </div>
              <label htmlFor={`${id}-record`}>
                {s('替换这一时刻的记录', 'Replace the observation at this time')} ·{' '}
                {records[recordIndex]?.toFixed(1) ?? '—'} ℃
                <input
                  id={`${id}-record`}
                  type="range"
                  min="35.5"
                  max="38.5"
                  step=".1"
                  value={records[recordIndex] ?? 36.5}
                  onChange={(e) =>
                    setRecords(records.map((v, i) => (i === recordIndex ? +e.target.value : v)))
                  }
                />
              </label>
              <div className="bio-fluid-buttons">
                <button
                  onClick={() => setRecords(records.map((v, i) => (i === recordIndex ? null : v)))}
                >
                  {s('标记为缺测', 'Mark missing')}
                </button>
                <button onClick={() => setHousehold(practiceHousehold.map((row) => [...row]))}>
                  {s('恢复练习记录', 'Restore practice records')}
                </button>
              </div>
            </>
          ) : (
            <>
              <label htmlFor={`${id}-p`}>
                {s('观察时刻', 'Observation time')}
                <input
                  id={`${id}-p`}
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={p}
                  onChange={(e) => setP(+e.target.value)}
                />
              </label>
              {active === 0 ? (
                <button aria-pressed={lymph} onClick={() => setLymph(!lymph)}>
                  {s('允许淋巴路径交换', 'Lymph-route exchange')}
                </button>
              ) : (
                <>
                  <div className="bio-fluid-buttons">
                    <button aria-pressed={!waterView} onClick={() => setWaterView(false)}>
                      {s('体温', 'Temperature')}
                    </button>
                    <button
                      aria-pressed={waterView && !saltView}
                      onClick={() => {
                        setWaterView(true);
                        setSaltView(false);
                      }}
                    >
                      {s('水量', 'Water balance')}
                    </button>
                    <button
                      aria-pressed={waterView && saltView}
                      onClick={() => {
                        setWaterView(true);
                        setSaltView(true);
                      }}
                    >
                      {s('钠盐', 'Sodium balance')}
                    </button>
                    <button aria-pressed={feedback} onClick={() => setFeedback(!feedback)}>
                      {s('调节响应开启', 'Regulation enabled')}
                    </button>
                  </div>
                  <label htmlFor={`${id}-disturbance`}>
                    {s('扰动大小', 'Disturbance size')}
                    <input
                      id={`${id}-disturbance`}
                      type="range"
                      min="0"
                      max="2"
                      step=".1"
                      value={disturbance}
                      onChange={(e) => setDisturbance(+e.target.value)}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>
      )}
      <details>
        <summary>{s('记录与模型的边界', 'Records and model limits')}</summary>
        <p>
          {s(
            '体温图是可编辑的练习记录，缺测时不补值，不把观察点当成固定的生物规律。体液图用三个充分混合、固定体积的隔室计算可交换示踪物；红细胞始终留在血管中。体温、水与钠采用归一化收支与反馈；水模型固定溶质量，钠模型固定水量。ADH与醛固酮分别改变水和钠的排出，不能凭空创造物质。这些教学参数不用于健康判断。',
            'Temperature points are editable practice observations; missing data remain missing. Fluid exchange uses three well-mixed compartments of fixed volume, with red cells retained in blood. Heat, water and sodium use normalized balances. The water model holds solute fixed; the sodium model holds water fixed. ADH and aldosterone reduce their respective losses without creating matter. These teaching parameters are not health assessments.',
          )}
        </p>
      </details>
    </div>
  );
}
