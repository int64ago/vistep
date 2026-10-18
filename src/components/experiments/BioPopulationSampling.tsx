import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  surveyClamp,
  captureSample,
  animalLocations,
  surveyMeadow,
  countQuadrat,
  selectQuadrats,
  quadratEstimate,
  lightTrapState,
  lightTrapPosition,
  wildlifeRecords,
  wildlifePattern,
  wildlifeAlleles,
  acousticSignature,
  matchWildlife,
  observedIndividuals,
} from '../../models/bio-population-sampling';
import { signalPathPoint } from '../../models/bio-chemical-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-population-sampling.css';
export default function BioPopulationSampling() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = [
    'bio-elective-2-002-1',
    'bio-elective-2-003-1',
    'bio-elective-2-005-1',
    'bio-elective-2-006-1',
  ];
  const [chosen, setChosen] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [time, setTime] = useState(1),
    [weather, setWeather] = useState(1),
    [lamp, setLamp] = useState(true),
    [captureStage, setCaptureStage] = useState(2),
    [loss, setLoss] = useState(0),
    [seed, setSeed] = useState(17),
    [count, setCount] = useState(8),
    [biased, setBiased] = useState(false),
    [close, setClose] = useState(false),
    [own, setOwn] = useState(false),
    [records, setRecords] = useState<(number | null)[]>(Array(20).fill(null)),
    [evidence, setEvidence] = useState(0),
    [different, setDifferent] = useState(false),
    [quality, setQuality] = useState(true);
  const mode = film.watch
      ? film.chapter < 2
        ? 0
        : film.chapter < 5
          ? 1
          : film.chapter < 8
            ? 2
            : 3
      : chosen,
    p = film.watch ? film.chapterProgress : time;
  const wp = film.watch && film.chapter === 1 ? (p < 0.5 ? p * 2 : (p - 0.5) * 2) : p,
    weatherNow = film.watch ? (film.chapter === 1 && p >= 0.5 ? 0.35 : 1) : weather;
  const insects = lightTrapState(wp, weatherNow, film.watch || lamp),
    stage = film.watch ? film.chapter - 2 : captureStage,
    sample = captureSample(26, film.watch ? 0 : loss);
  const biasedNow = film.watch ? film.chapter === 7 && p >= 0.5 : biased,
    plotCount = film.watch ? (film.chapter === 5 ? Math.max(1, Math.ceil(p * 8)) : 8) : count,
    plots = selectQuadrats(plotCount, film.watch ? 17 : seed, biasedNow),
    plants = surveyMeadow(),
    estimate = quadratEstimate(plots, plants),
    zoom = film.watch ? film.chapter === 6 : close;
  const method = film.watch ? film.chapter - 8 : evidence,
    other = film.watch ? (p < 0.55 ? 'A' : 'B') : different ? 'B' : 'A',
    readable = film.watch || quality,
    match = matchWildlife('A', other, readable, method);
  const mapSide = Math.min(w - 40, compact ? 246 : 320),
    mapX = (w - mapSide) / 2,
    zSide = Math.min(w - 84, 240),
    zX = (w - zSide) / 2;
  const labels = [
    s('灯光诱捕记录了什么', 'What does a light trap detect?'),
    s('同一批个体，捕获两次', 'Capture the same population twice'),
    s('把样方放回真实空间', 'Place quadrats in real space'),
    s('记录次数与个体身份', 'Records and individual identity'),
  ];
  const plant = (
    x: number,
    y: number,
    target: boolean,
    large = false,
    included = true,
    key = 0,
  ) => (
    <g key={key} transform={`translate(${x} ${y})`} opacity={included ? 1 : 0.5}>
      {target ? (
        <>
          <path
            d={large ? 'M0 0v-13m0 7q-11-8-9 0m9 1q11-8 9 0' : 'M0 0v-5m0 2-3-1m3 2 3-1'}
            fill="none"
            stroke="#788d60"
            strokeWidth={large ? 1.8 : 1}
          />
          <circle cy={large ? -15 : -6} r={large ? 5 : 2.2} fill="#d5bf6d" />
          <circle r={large ? 2.5 : 1} fill="#6c7959" />
        </>
      ) : (
        <path
          d={large ? 'M0 0l-7-14m7 14 7-17m-7 17v-18' : 'M0 0l-2-5m2 5 2-6'}
          stroke="#acb598"
          fill="none"
          strokeWidth={large ? 1.5 : 1}
        />
      )}
    </g>
  );
  const cat = (x: number, y: number, identity: 'A' | 'B' | 'C', clear = true) => (
    <g
      transform={`translate(${x} ${y}) scale(${Math.min(1, (w * 0.44 - 14) / 148)})`}
      opacity={clear ? 1 : 0.35}
    >
      <path
        d="M-45-12Q-8-27 36-14l12 8 15-4 6 14-13 8-19-7-8 8 3 20h-9l-5-18h-41l-7 18h-9l2-26q-31 8-37-6q-5-13 7-15"
        fill="#c0ae83"
        stroke="#958762"
        strokeWidth="2"
      />
      {wildlifePattern(identity).map((spot, i) => (
        <circle
          key={i}
          cx={spot.x}
          cy={spot.y}
          r={spot.r}
          fill="none"
          stroke="#756c50"
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
  return (
    <div ref={host} className="bio-sampling" data-watch={film.watch}>
      <div className="bio-sampling-head">{labels[mode]}</div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} 360`} role="img" aria-label={labels[0]}>
          <defs>
            <radialGradient id={`${id}-light`}>
              <stop stopColor="#d8d2b3" stopOpacity=".45" />
              <stop offset="1" stopColor="#d8d2b3" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="8" y="10" width={w - 16} height="302" rx="20" fill="#3e514b" />
          <text x={w / 2} y="33" textAnchor="middle" style={{ fill: '#dbe3cd' }}>
            {s('浅色：趋光较强', 'Pale insects: stronger attraction')}
          </text>
          <path d={`M8 288q${w * 0.22}-32 ${w * 0.46}-2t${w * 0.46} 8v18H8Z`} fill="#52604e" />
          <circle
            cx={w * 0.55}
            cy="128"
            r="100"
            fill={`url(#${id}-light)`}
            opacity={film.watch || lamp ? 1 : 0}
          />
          <path d={`M${w * 0.55 - 25} 75h50l-9 11h-32Z`} fill="#a3ab9b" />
          <path
            d={`M${w * 0.55 - 8} 86v75m16-75v75M${w * 0.55 - 21} 102h42v59h-42Z`}
            stroke="#a5b4a2"
            fill="none"
            strokeWidth="2"
          />
          <rect
            x={w * 0.55 - 3}
            y="91"
            width="6"
            height="64"
            rx="3"
            fill={film.watch || lamp ? '#e7dcba' : '#8c9a8b'}
          />
          <path
            d={`M${w * 0.55 - 37} 174h74l-33 45v14h-8v-14Z`}
            fill="#a6b4a0"
            fillOpacity=".4"
            stroke="#b5c1ac"
            strokeWidth="2"
          />
          <path
            d={`M${w * 0.55 - 25} 233h50v52q0 7-7 7h-36q-7 0-7-7Z`}
            fill="#c3c9ae"
            fillOpacity=".3"
            stroke="#bbc6ae"
            strokeWidth="2"
          />
          {insects.map((m) => {
            const start = { x: 15 + m.start.x * (w - 30), y: 35 + m.start.y * 210 },
              pos = lightTrapPosition(m.phase, start, w * 0.55, m.id);
            return (
              <g key={m.id} data-insect={m.id} transform={`translate(${pos.x} ${pos.y})`}>
                <path
                  d={`M0 0q${-pos.wingHalfSpan}-5 ${-pos.wingHalfSpan} 0t${pos.wingHalfSpan} 0q${pos.wingHalfSpan}-5 ${pos.wingHalfSpan} 0t${-pos.wingHalfSpan} 0`}
                  fill={m.stronglyAttracted ? '#e0d2ad' : '#9db2a3'}
                />
                <path d="M0-3v6" stroke="#718071" />
              </g>
            );
          })}
          <text x={w / 2} y="339" textAnchor="middle">
            {s('捕获', 'Caught')} {insects.filter((m) => m.caught).length} ·{' '}
            {weatherNow < 0.5
              ? s('活动条件较差', 'Lower activity')
              : s('活动条件相同', 'Matched activity')}
          </text>
        </svg>
      )}
      {mode === 1 && (
        <svg viewBox={`0 0 ${w} 380`} role="img" aria-label={labels[1]}>
          <path
            d={`M20 67Q${w * 0.35} 57 ${w - 20} 71V231Q${w * 0.6} 245 20 224Z`}
            fill="#e2e9d3"
            stroke="#c3cfaf"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${35 + (i * (w - 70)) / 6} ${100 + (i % 3) * 45}l-6-16m6 16 8-19m-8 19v-21`}
              stroke="#bec9a9"
              fill="none"
            />
          ))}
          <rect x="20" y="264" width={w - 40} height="52" rx="11" fill="#e6e2d3" stroke="#bdb49c" />
          {Array.from({ length: 48 }, (_, i) => {
            const firstIndex = sample.first.indexOf(i),
              secondIndex = sample.second.indexOf(i),
              first = firstIndex >= 0,
              second = secondIndex >= 0,
              a = animalLocations(i),
              b = animalLocations(i, true),
              fieldA = { x: 20 + a.x * (w - 40), y: 62 + a.y * 158 },
              fieldB = { x: 20 + b.x * (w - 40), y: 62 + b.y * 158 },
              tray = (n: number) => ({
                x: 38 + ((n % 8) * (w - 76)) / 7,
                y: 278 + Math.floor(n / 8) * 22,
              });
            let pos = fieldA;
            if (stage === 0 && first) {
              const q = surveyClamp(p / 0.5);
              pos = signalPathPoint([fieldA, tray(firstIndex)], q);
            }
            if (stage === 1) {
              pos = signalPathPoint(
                [first ? tray(firstIndex) : fieldA, fieldB],
                surveyClamp(p / 0.7),
              );
            }
            if (stage === 2) {
              pos = second
                ? signalPathPoint([fieldB, tray(secondIndex)], surveyClamp(p / 0.55))
                : fieldB;
            }
            const marked = first && (stage > 0 || p > 0.5) && !(stage > 0 && sample.lost.has(i));
            return (
              <g key={i} data-animal={i} transform={`translate(${pos.x} ${pos.y})`}>
                <ellipse rx="5" ry="3.5" fill="#a49c80" />
                <circle cx="4" cy="-1" r="2.8" fill="#afa68a" />
                <circle cx="4" cy="-3" r="1.5" fill="#c7b99b" />
                <path d="M-5 0q-5 0-6 4" fill="none" stroke="#b5a989" />
                {marked && <circle cx="0" cy="-2" r="2.3" fill="#b77d63" />}
              </g>
            );
          })}
          <text x={w / 2} y="28" textAnchor="middle">
            {stage === 0
              ? s('首捕 → 标记', 'First capture → mark')
              : stage === 1
                ? s('释放 → 混合', 'Release → mix')
                : s('重捕 → 辨认标记', 'Recapture → recognize marks')}
          </text>
          <text x={w / 2} y="49" textAnchor="middle">
            {s('范围 1 hm² · 模拟', 'Area 1 ha · simulation')}
          </text>
          <text x={w / 2} y="343" textAnchor="middle">
            {stage < 2
              ? stage === 0 && p < 0.5
                ? s('首捕进行中', 'Capture in progress')
                : `M = ${sample.marked}`
              : p < 0.6
                ? s('重捕进行中', 'Recapture in progress')
                : `M=${sample.marked} · n=${sample.caught} · r=${sample.recaught}`}
          </text>
          {stage === 2 && p >= 0.6 && (
            <text x={w / 2} y="371" textAnchor="middle">
              {sample.estimate === null
                ? s('r=0：不能给出有限估计', 'r=0: no finite estimate')
                : `N ≈ M × n / r = ${sample.estimate.toFixed(1)}`}
            </text>
          )}
        </svg>
      )}
      {mode === 2 &&
        (!film.watch && own ? (
          <div className="bio-sampling-records">
            <p>
              {s(
                '实际计数，每个样方1 m²；空白不记为零。',
                'Actual counts in 1 m² quadrats; blank is not zero.',
              )}
            </p>
            <div className="bio-sampling-record-grid">
              {records.slice(0, count).map((n, i) => (
                <label key={i} htmlFor={`${id}-q-${i}`}>
                  {s('样方', 'Quadrat')} {i + 1}
                  <input
                    id={`${id}-q-${i}`}
                    type="number"
                    min="0"
                    value={n ?? ''}
                    onChange={(e) =>
                      setRecords(
                        records.map((v, j) =>
                          i === j
                            ? e.target.value === ''
                              ? null
                              : Math.round(surveyClamp(+e.target.value, 0, 1000000))
                            : v,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <p>
              {s('已记录样方密度', 'Density in recorded quadrats')}{' '}
              {records.slice(0, count).some((v) => v !== null)
                ? (
                    records.slice(0, count).reduce<number>((sum, v) => sum + (v ?? 0), 0) /
                    records.slice(0, count).filter((v) => v !== null).length
                  ).toFixed(2)
                : '—'}{' '}
              {s('株/m²', 'plants/m²')}
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${w} ${zoom ? zSide + 150 : mapSide + 115}`}
            role="img"
            aria-label={labels[2]}
          >
            {zoom ? (
              <>
                <rect
                  x={zX - 35}
                  y="30"
                  width={zSide + 70}
                  height={zSide + 70}
                  rx="12"
                  fill="#e8edda"
                />
                {plants
                  .filter((a) => a.x >= 1.86 && a.x <= 3.14 && a.y >= 1.86 && a.y <= 3.14)
                  .map((a) =>
                    plant(
                      zX + (a.x - 2) * zSide,
                      65 + (a.y - 2) * zSide,
                      a.target,
                      true,
                      countQuadrat([a], { id: 22, x: 2, y: 2, size: 1 }).length > 0,
                      a.id,
                    ),
                  )}
                <path
                  d={`M${zX} ${65 + zSide}V65H${zX + zSide}`}
                  stroke="#7b9472"
                  fill="none"
                  strokeWidth="3"
                />
                <path
                  d={`M${zX + zSide} 65V${65 + zSide}H${zX}`}
                  stroke="#b09b78"
                  strokeDasharray="7 5"
                  fill="none"
                  strokeWidth="3"
                />
                <text x={w / 2} y="28" textAnchor="middle">
                  {s('1 m² · 根基部计数', '1 m² · counted bases')}{' '}
                  {countQuadrat(plants, { id: 22, x: 2, y: 2, size: 1 }).length}
                </text>
                <text x={w / 2} y={zSide + 111} textAnchor="middle">
                  {s('计上、左边界', 'Count top / left edges')}
                </text>
                <text x={w / 2} y={zSide + 135} textAnchor="middle">
                  {s('不计下、右边界', 'Exclude bottom / right edges')}
                </text>
              </>
            ) : (
              <>
                <rect x={mapX} y="43" width={mapSide} height={mapSide} rx="13" fill="#e4ebd6" />
                {plants.map((a) =>
                  plant(
                    mapX + (a.x * mapSide) / 10,
                    43 + (a.y * mapSide) / 10,
                    a.target,
                    false,
                    true,
                    a.id,
                  ),
                )}
                {plots.map((q) => (
                  <rect
                    key={q.id}
                    x={mapX + (q.x * mapSide) / 10}
                    y={43 + (q.y * mapSide) / 10}
                    width={mapSide / 10}
                    height={mapSide / 10}
                    fill="#d7bd71"
                    fillOpacity=".1"
                    stroke="#9b885c"
                    strokeWidth="2"
                  />
                ))}
                <text x={w / 2} y="28" textAnchor="middle">
                  {biasedNow
                    ? s('只挑茂盛位置', 'Choose only dense patches')
                    : s('随机坐标，不按植株选择', 'Random locations, not chosen plants')}
                </text>
                <text x={w / 2} y={mapSide + 74} textAnchor="middle">
                  {plotCount} {s('个1 m²样方', '× 1 m² quadrats')} · {estimate.count}{' '}
                  {s('株', 'plants')}
                </text>
                <text x={w / 2} y={mapSide + 103} textAnchor="middle">
                  {s('估计密度', 'Estimated density')} {estimate.density?.toFixed(2)}{' '}
                  {s('株/m²', 'plants/m²')}
                </text>
              </>
            )}
          </svg>
        ))}
      {mode === 3 && (
        <svg viewBox={`0 0 ${w} 360`} role="img" aria-label={labels[3]}>
          <text x={w / 2} y="28" textAnchor="middle">
            {
              [
                s('同侧花纹 · 影像重建', 'Same-flank pattern comparison'),
                s('多个微卫星位点', 'Multiple microsatellite loci'),
                s('声纹特征示意 · 非录音', 'Illustrative acoustic signatures'),
              ][method]
            }
          </text>
          {(['A', other] as const).map((identity, i) => {
            const x = w * (i ? 0.75 : 0.25);
            return (
              <g key={i}>
                <text x={x} y="65" textAnchor="middle">
                  {s('记录', 'Record')} {i ? (other === 'A' ? '03' : '02') : '01'}
                </text>
                {method === 0 ? (
                  <>
                    <rect
                      x={x - w * 0.22}
                      y="83"
                      width={w * 0.44}
                      height="111"
                      rx="9"
                      fill="#dbe2ce"
                    />
                    {cat(x - 3, 134, identity, readable)}
                  </>
                ) : method === 1 ? (
                  <>
                    {wildlifeAlleles[identity].map((locus, j) => (
                      <text key={j} x={x} y={108 + j * 37} textAnchor="middle">
                        L{j + 1}: {readable ? locus.join('/') : '— / —'}
                      </text>
                    ))}
                  </>
                ) : (
                  <>
                    <path d={`M${x - w * 0.2} 139h${w * 0.4}`} stroke="#c2cbbb" />
                    <path
                      d={Array.from(
                        { length: 141 },
                        (_, j) =>
                          `${j ? 'L' : 'M'}${x - w * 0.2 + (j / 140) * w * 0.4} ${139 - 33 * acousticSignature(identity, j / 140) + (readable ? 0 : 12 * Math.sin(j * 2.7))}`,
                      ).join(' ')}
                      fill="none"
                      stroke="#8c9d80"
                      strokeWidth="2"
                    />
                  </>
                )}
              </g>
            );
          })}
          <text x={w / 2} y="224" textAnchor="middle">
            {match === 'same'
              ? s('同一个体的重复记录', 'Repeated records of one individual')
              : match === 'different'
                ? s('支持不同个体', 'Different individuals supported')
                : s('证据不足，暂不归并', 'Insufficient evidence; unresolved')}
          </text>
          {wildlifeRecords.map((r, i) => {
            const x = (w * (i + 0.5)) / 6;
            return (
              <g key={r.record}>
                <circle
                  cx={x}
                  cy="274"
                  r="16"
                  fill={
                    r.identity === 'A'
                      ? '#d2ddc2'
                      : r.identity === 'B'
                        ? '#d9cdb3'
                        : r.identity === 'C'
                          ? '#c4d5d5'
                          : '#e4e6db'
                  }
                />
                <text x={x} y="280" textAnchor="middle">
                  {r.identity ?? '?'}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="318" textAnchor="middle">
            6 {s('条记录', 'records')} · {s('确认至少', 'at least')} {observedIndividuals()}{' '}
            {s('个体', 'individuals')}
          </text>
          <text x={w / 2} y="346" textAnchor="middle">
            {s('未检测个体仍需估计', 'Detection is incomplete')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-sampling-controls">
          <div className="bio-sampling-buttons">
            {labels.map((x, i) => (
              <button key={i} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
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
            <>
              <button aria-pressed={lamp} onClick={() => setLamp(!lamp)}>
                {s('开启诱捕灯', 'Light trap on')}
              </button>
              <label htmlFor={`${id}-weather`}>
                {s('相对活动条件', 'Relative activity conditions')}
                <input
                  id={`${id}-weather`}
                  type="range"
                  min=".1"
                  max="1"
                  step=".05"
                  value={weather}
                  onChange={(e) => setWeather(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 1 && (
            <>
              <div className="bio-sampling-buttons">
                {[s('首捕标记', 'Mark'), s('释放混合', 'Release'), s('重捕估计', 'Recapture')].map(
                  (x, i) => (
                    <button
                      key={i}
                      aria-pressed={captureStage === i}
                      onClick={() => setCaptureStage(i)}
                    >
                      {x}
                    </button>
                  ),
                )}
              </div>
              <label htmlFor={`${id}-loss`}>
                {s('标记丢失比例', 'Fraction of marks lost')}
                <input
                  id={`${id}-loss`}
                  type="range"
                  min="0"
                  max="1"
                  step=".0625"
                  value={loss}
                  onChange={(e) => setLoss(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 2 && (
            <>
              <div className="bio-sampling-buttons">
                <button aria-pressed={close} onClick={() => setClose(!close)}>
                  {s('检查样方边界', 'Inspect quadrat boundaries')}
                </button>
                <button aria-pressed={biased} onClick={() => setBiased(!biased)}>
                  {s('只挑茂盛位置', 'Choose dense patches')}
                </button>
                <button onClick={() => setSeed(seed + 1)}>
                  {s('重新随机取样', 'Resample randomly')}
                </button>
                <button aria-pressed={own} onClick={() => setOwn(!own)}>
                  {s('录入实地计数', 'Enter field counts')}
                </button>
              </div>
              <label htmlFor={`${id}-n`}>
                {s('样方数量', 'Number of quadrats')} {count}
                <input
                  id={`${id}-n`}
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={count}
                  onChange={(e) => setCount(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 3 && (
            <>
              <div className="bio-sampling-buttons">
                {[
                  s('红外影像', 'Camera'),
                  s('粪便DNA', 'Scat DNA'),
                  s('声音特征', 'Acoustics'),
                ].map((x, i) => (
                  <button key={i} aria-pressed={evidence === i} onClick={() => setEvidence(i)}>
                    {x}
                  </button>
                ))}
              </div>
              <div className="bio-sampling-buttons">
                <button aria-pressed={different} onClick={() => setDifferent(!different)}>
                  {s('换一个体记录', 'Change recorded individual')}
                </button>
                <button aria-pressed={quality} onClick={() => setQuality(!quality)}>
                  {s('证据质量充分', 'Sufficient evidence quality')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <details>
        <summary>{s('取样假设与数据身份', 'Evidence and assumptions')}</summary>
        <p>
          {s(
            '全部生态对象、花纹与信号是原创模拟，不是实地数据。灯诱捕率受对象趋光性、活动、天气和时长影响，捕获量不等于种群总量。标记重捕要求研究范围内种群近似封闭、标记保留且不影响捕获、充分混合，并使用适合的数据模型；零重捕不能给出有限比值估计。样方是10×10 m模拟草地中的1 m²网格，按根基部计入上左边界、排除下右边界，随机抽样不保证单次恰好等于真值。影像、微卫星与声音仅作身份逻辑演示，真实识别需验证误差与检测概率，未知记录不强行分配身份。',
            'All organisms, patterns and signatures are original simulations. Light-trap catches depend on attraction, activity, weather and effort, not only abundance. Mark–recapture requires appropriate closure, mark retention, mixing and capture assumptions; zero recaptures yield no finite ratio estimate. Quadrats are 1 m² grid cells within a 10×10 m meadow; stem bases on top/left edges count and bottom/right edges do not. Random sampling does not guarantee an exact single estimate. Identity illustrations are not validated recognition algorithms; real studies require error and detection modeling, and unresolved records remain unresolved.',
          )}
        </p>
      </details>
    </div>
  );
}
