import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  wetlandBirds,
  coreState,
  soilExtraction,
  extractionCounts,
  aspiratorState,
  aspiratorPath,
  aspiratorAirPath,
  successionState,
  surveyClamp,
  groupedRecord,
  type SoilGroup,
} from '../../models/bio-community-survey';
import { signalPathPoint } from '../../models/bio-chemical-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-community-survey.css';
export default function BioCommunitySurvey() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-2-028-1', 'bio-elective-2-030-1', 'bio-elective-2-mechanism-20'];
  const [chosen, setChosen] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(1),
    [bird, setBird] = useState(0),
    [lamp, setLamp] = useState(true),
    [pump, setPump] = useState(true),
    [secondary, setSecondary] = useState(false),
    [water, setWater] = useState(0.85),
    [own, setOwn] = useState(false),
    [counts, setCounts] = useState<(number | null)[]>([null, null, null]),
    [notes, setNotes] = useState(['', '', '']);
  const mode = film.watch ? (film.chapter < 3 ? 0 : film.chapter < 7 ? 1 : 2) : chosen,
    local = film.watch ? film.chapter - [0, 3, 7][mode] : Math.min(view, mode === 1 ? 3 : 2),
    p = film.watch ? film.chapterProgress : progress;
  const birdIndex = film.watch
      ? local === 0
        ? Math.min(3, Math.floor(p * 4))
        : p < 0.5
          ? 0
          : 2
      : bird,
    b = wetlandBirds[birdIndex],
    light = film.watch || lamp;
  const extraction = soilExtraction(local === 3 ? 1 : p, light),
    stats = extractionCounts(local === 3 ? 1 : p, light),
    core = coreState(p),
    bug = aspiratorState(p, film.watch || pump),
    personal = !film.watch && own;
  const sec = film.watch ? local === 1 : secondary,
    moisture = film.watch ? (local === 2 ? 0.25 : 0.85) : water,
    life = successionState(p, sec, moisture),
    soilDepth = life.soil * 46;
  const titles = [
    s('从观察描述生态位', 'Describe a niche from observations'),
    s('土样里的小动物', 'Small animals in a soil sample'),
    s('同一地点，群落更替', 'Community change at one site'),
  ];
  const groups = [s('螨类', 'Mites'), s('跳虫类', 'Springtails'), s('待鉴定A', 'Unresolved A')];
  const insect = (x: number, y: number, type: SoilGroup, scale = 1, key: string | number = 0) => (
    <g key={key} transform={`translate(${x} ${y}) scale(${scale})`}>
      {type === 'mite' ? (
        <>
          <ellipse rx="1.7" ry="2" fill="#8d7867" />
          {[-1.4, -0.5, 0.5, 1.4].map((a) => (
            <path key={a} d={`M-1 ${a}l-2-1m4 1 2-1`} stroke="#8d7867" strokeWidth=".5" />
          ))}
        </>
      ) : type === 'springtail' ? (
        <>
          <ellipse rx="1.1" ry="2.6" fill="#7e8770" />
          <path
            d="M-1-1l-2-1m4 1 2-1m-4 2-2 1m4-1 2 1m-4 0-2 2m4-2 2 2M0-2l-2-2m2 2 2-2"
            stroke="#7e8770"
            strokeWidth=".5"
            fill="none"
          />
        </>
      ) : (
        <>
          <path d="M0-3q-2 1-1 3q3 1 1 3" stroke="#a99d71" strokeWidth="2" fill="none" />
        </>
      )}
    </g>
  );
  const duck = (x: number, y: number, kind: number) => (
    <g transform={`translate(${x} ${y})`}>
      {kind < 2 ? (
        <>
          <ellipse rx="24" ry="13" fill={kind === 1 ? '#b9b1a0' : '#a4a38a'} />
          <path d="M12-5q0-25 16-18q10 3 3 17l-8 9" fill={kind === 1 ? '#708c73' : '#8b8070'} />
          <path d="M31-16l14 3-13 4" fill="#c2b27c" />
          <path d="M-16 1q15-10 30 1" stroke="#738675" fill="none" />
          <circle cx="28" cy="-17" r="1.4" fill="#445b4f" />
        </>
      ) : (
        <>
          <ellipse rx="20" ry="10" fill="#a4a59b" />
          <path d="M9-3q9-6 8-17q11-9 17-1l-1 7-13 2-5 11" fill="#a1a69c" />
          <path d="M33-19l24 4-25-1" fill="#7f826f" />
          <path
            d="M-4 8l-1 21m8-21 4 21m-12 0h-7m19 0h7"
            stroke={kind === 2 ? '#b28b77' : '#81957b'}
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
    </g>
  );
  return (
    <div ref={host} className="bio-survey" data-watch={film.watch}>
      <div className="bio-survey-head">{titles[mode]}</div>
      {mode === 0 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 306`}
          role="img"
          aria-label={s('教材水鸟生境出现率', 'Textbook waterbird habitat occurrence')}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {s(b.zh, b.en)}
          </text>
          {[
            s('盐沼—光滩', 'Salt marsh / mudflat'),
            s('藨草带', 'Sedge marsh'),
            s('鱼塘—芦苇', 'Ponds / reedbeds'),
          ].map((label, i) => {
            const y = 45 + i * 76;
            return (
              <g key={i}>
                <rect
                  x="12"
                  y={y}
                  width={w - 24}
                  height="58"
                  rx="13"
                  fill={['#e0dfca', '#dce4ce', '#d5e4df'][i]}
                />
                {i === 0 ? (
                  <path
                    d={`M18 ${y + 45}q${w * 0.25}-10 ${w * 0.5} 0t${w * 0.42} 0`}
                    stroke="#bbc7bb"
                    fill="none"
                  />
                ) : (
                  Array.from({ length: 8 }, (_, j) => (
                    <path
                      key={j}
                      d={`M${24 + j * 18} ${y + 50}v-20m0 7-5-7m5 11 5-7`}
                      stroke={i === 1 ? '#a7b68c' : '#9cad88'}
                      fill="none"
                    />
                  ))
                )}
                <rect
                  x="12"
                  y={y + 50}
                  width={((w - 24) * b.habitat[i]) / 100}
                  height="8"
                  rx="4"
                  fill="#91a57a"
                />
                <text x="23" y={y + 25}>
                  {label}
                </text>
                <text x={w - 23} y={y + 46} textAnchor="end">
                  {b.habitat[i]}%
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="295" textAnchor="middle">
            {s('出现率 · 非生境面积比例', 'Occurrence, not habitat area')}
          </text>
        </svg>
      )}
      {mode === 0 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 299`}
          role="img"
          aria-label={s('教材胃内容物比例', 'Textbook stomach-content composition')}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {s(b.zh, b.en)}
          </text>
          <text x={w / 2} y="51" textAnchor="middle">
            {s('胃中检出物（教材资料）', 'Stomach contents (textbook)')}
          </text>
          {[
            s('小坚果', 'Nutlets'),
            s('茎类', 'Stems'),
            s('草屑', 'Plant fragments'),
            s('螺类', 'Snails'),
            s('贝壳沙砾', 'Shells / grit'),
            s('甲壳类', 'Crustaceans'),
            s('其他', 'Other'),
          ].map((label, i) => {
            const y = 65 + i * 29;
            return (
              <g key={i}>
                <rect
                  x="12"
                  y={y}
                  width={((w - 24) * b.contents[i]) / 100}
                  height="25"
                  rx="5"
                  fill={i === 4 ? '#ddd9c9' : '#e0e7d5'}
                />
                <text x="20" y={y + 18}>
                  {label}
                </text>
                <text x={w - 20} y={y + 18} textAnchor="end">
                  {b.contents[i]}%
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="291" textAnchor="middle">
            {s('沙砾不等于营养食物', 'Grit is not nutritional food')}
          </text>
        </svg>
      )}
      {mode === 0 && local === 2 && (
        <div className="bio-survey-journal">
          <svg
            viewBox={`0 0 ${w} 103`}
            role="img"
            aria-label={s('不干扰地观察觅食行为', 'Observe foraging without disturbance')}
          >
            <path
              d={`M14 85q${w * 0.3}-25 ${w * 0.6} 0t${w * 0.35} 0`}
              fill="none"
              stroke="#b4c8b9"
              strokeWidth="5"
            />
            {duck(w * 0.45, 65, 2)}
            <circle cx={w * 0.75} cy="43" r="18" fill="none" stroke="#a5b5a1" />
            <path d={`M${w * 0.75 + 13} 56l16 15`} stroke="#a5b5a1" strokeWidth="4" />
          </svg>
          <p className="bio-survey-journal-label">
            {film.watch
              ? s('观察记录示例', 'Example observation record')
              : s('我的观察记录', 'My observation record')}
          </p>
          {[
            s('地点、时间', 'Place and time'),
            s('栖息与觅食', 'Habitat and foraging'),
            s('种间关系线索', 'Interaction evidence'),
          ].map((label, i) => (
            <label key={i}>
              {label}
              {film.watch ? (
                <span style={{ opacity: p > i * 0.22 ? 1 : 0.2 }}>
                  {
                    [
                      s('样点A · 低潮时', 'Site A · low tide'),
                      s('浅水中反复探喙', 'Repeated probing in shallow water'),
                      s('邻近鸟也在同一区觅食', 'Other birds forage nearby'),
                    ][i]
                  }
                </span>
              ) : (
                <input
                  value={notes[i]}
                  placeholder={s('尚未记录', 'Not recorded')}
                  onChange={(e) => {
                    const n = [...notes];
                    n[i] = e.target.value;
                    setNotes(n);
                  }}
                />
              )}
            </label>
          ))}
        </div>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 292`}
          role="img"
          aria-label={s('已知尺寸的土壤取样', 'Soil sampling with known dimensions')}
        >
          <defs>
            <pattern id={`${id}-soil`} width="19" height="15" patternUnits="userSpaceOnUse">
              <rect width="19" height="15" fill="#b3a58a" />
              <path d="M2 4h3m7 7h4" stroke="#958971" />
            </pattern>
          </defs>
          <path d={`M12 110h${w - 24}v146H12Z`} fill={`url(#${id}-soil)`} />
          <path d={`M12 110h${w - 24}`} stroke="#8d9273" strokeWidth="4" />
          {core.lift > 0 && <rect x={w / 2 - 31} y="110" width="62" height="65" fill="#e8eadd" />}
          <g transform={`translate(${w / 2} ${core.top})`}>
            <rect
              x="-31"
              width="62"
              height="65"
              fill={core.insert >= 1 ? `url(#${id}-soil)` : 'transparent'}
            />
            <path d="M-33 65V0q33-10 66 0v65" stroke="#98a6a0" strokeWidth="3" fill="none" />
            <ellipse rx="33" ry="9" fill="#d4dfd5" stroke="#98a6a0" />
            <path d="M-33 65q33 10 66 0" stroke="#98a6a0" fill="none" />
          </g>
          <text x="18" y="30">
            {s('直径5 cm · 深5 cm', 'Diameter 5 cm · depth 5 cm')}
          </text>
          <text x={w / 2} y="283" textAnchor="middle">
            V = π × 2.5² × 5 ≈ {core.volumeMl.toFixed(1)} mL
          </text>
        </svg>
      )}
      {mode === 1 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 340`}
          role="img"
          aria-label={s(
            '热与干燥驱动小动物向下通过网孔',
            'Heat and drying drive animals through mesh openings',
          )}
        >
          <defs>
            <linearGradient id={`${id}-dry`} x2="0" y2="1">
              <stop stopColor={light ? '#bd9c6d' : '#a5a17f'} />
              <stop offset="1" stopColor="#9c9479" />
            </linearGradient>
          </defs>
          <g transform={`translate(${w / 2} 0)`}>
            <path d="M-39 44q39-39 78 0Z" fill="#a7b9ac" stroke="#8ca093" />
            <ellipse cy="47" rx="8" ry="7" fill={light ? '#e3d89a' : '#c3cdbb'} />
            <path d="M0 7v-7" stroke="#8ca093" />
            {light &&
              [-1, 0, 1].map((i) => (
                <path
                  key={i}
                  d={`M${i * 17} 65q-4 12 0 22`}
                  stroke="#d9c48c"
                  strokeWidth="2"
                  opacity={0.3 + p * 0.5}
                  fill="none"
                />
              ))}
            <path
              d="M-58 94l14 62h88l14-62"
              fill="#c4ad90"
              fillOpacity=".4"
              stroke="#ab9276"
              strokeWidth="2"
            />
            <ellipse cy="94" rx="58" ry="8" fill="none" stroke="#ab9276" />
            <path d="M-34 110h68v40h-68Z" fill={`url(#${id}-dry)`} />
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={`M${-28 + i * 8} 150v6`} stroke="#8b9285" strokeWidth="1.3" />
            ))}
            <path
              d="M-50 156L-7 218v31h14v-31l43-62"
              fill="#c9d9cf"
              fillOpacity=".3"
              stroke="#9eb4a4"
              strokeWidth="2"
            />
            <path
              d="M-20 242v44q0 13 20 13t20-13v-44"
              fill="#e3eae0"
              stroke="#9eb4a4"
              strokeWidth="2"
            />
            <path d="M-18 277h36v9q0 11-18 11t-18-11Z" fill="#b6d1cb" />
            {extraction.map((c) => insect(c.x, c.y, c.group, 1, c.id))}
          </g>
          <text x={w / 2} y="332" textAnchor="middle">
            {s('示意样本 · 收集', 'Example · collected')} {stats.total}/18
          </text>
        </svg>
      )}
      {mode === 1 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s('吸虫管和带滤网的出气管分开', 'Separate intake and filtered air outlet')}
        >
          <g transform={`translate(${w / 2} 0)`}>
            <path
              d="M-35 126v106q0 16 35 16t35-16V126"
              fill="#edf2e8"
              stroke="#a5b6a5"
              strokeWidth="2"
            />
            <rect x="-39" y="118" width="78" height="14" rx="5" fill="#bcaa8d" />
            <path
              d={aspiratorPath
                .slice(0, -1)
                .map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`)
                .join(' ')}
              stroke="#a5b49f"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={aspiratorPath
                .slice(0, -1)
                .map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`)
                .join(' ')}
              stroke="#edf1dc"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 145v-45l57-30"
              stroke="#a7bbb0"
              strokeWidth="10"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M18 145v-45l57-30"
              stroke="#eef4ef"
              strokeWidth="6"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M11 142h14m-14 3h14m-14 3h14m-12-8v10m4-10v10m4-10v10"
              stroke="#7f9486"
              strokeWidth="1"
            />
            <ellipse
              cx="85"
              cy="65"
              rx={film.watch || pump ? 13 - 2 * Math.sin(p * Math.PI) : 13}
              ry="21"
              fill="#a7ba9e"
              transform="rotate(60 85 65)"
            />
            {insect(bug.x, bug.y, 'springtail', 1, 'specimen')}
            {(film.watch || pump) &&
              [0, 1, 2, 3].map((i) => {
                const pt = signalPathPoint(
                  aspiratorAirPath.map(([x, y]) => ({ x, y })),
                  (p + i * 0.25) % 1,
                );
                return <circle key={i} cx={pt.x} cy={pt.y} r="1.7" fill="#7ca6a8" />;
              })}
            <path d="M-110 253h42" stroke="#b4a68a" strokeWidth="4" strokeLinecap="round" />
          </g>
          <text x={w / 2} y="26" textAnchor="middle">
            {s('手动气源 · 出气口有纱网', 'Hand pump · screened outlet')}
          </text>
          <text x={w / 2} y="285" textAnchor="middle">
            {s('动物留在瓶内，空气通过纱网', 'Specimen stays · air exits')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 290`}
          role="img"
          aria-label={s('统计类群与个体数', 'Count groups and individuals')}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {personal
              ? s('输入的土样记录', 'Entered sample records')
              : s('同一土样的采集结果', 'Collected from the same sample')}
          </text>
          {(['mite', 'springtail', 'unknown'] as SoilGroup[]).map((type, i) => {
            const n = personal ? counts[i] : stats.counts[type],
              y = 67 + i * 64;
            return (
              <g key={type}>
                {insect(36, y, type, 4, type)}
                <text x="61" y={y - 7}>
                  {groups[i]}
                </text>
                <text x={w - 18} y={y - 7} textAnchor="end">
                  {n === null ? '—' : n}
                </text>
                {!personal &&
                  Array.from({ length: stats.counts[type] }, (_, j) =>
                    insect(69 + j * 16, y + 14, type, 1.4, j),
                  )}
              </g>
            );
          })}
          <text x={w / 2} y="269" textAnchor="middle">
            {personal ? groupedRecord(counts).groups : stats.groups}
            {s('个记录类群 ≠ 已知物种', ' groups ≠ species')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '土壤与植物改变同一地点的演替条件',
            'Soil and plants change conditions at one site',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {moisture <= 0.5
              ? s('较干燥条件', 'Drier conditions')
              : sec
                ? s('土壤与繁殖体保留', 'Soil and propagules retained')
                : s('从裸岩开始', 'Start with bare rock')}
          </text>
          <path d={`M12 225h${w - 24}v43H12Z`} fill="#b8baaa" />
          <path d={`M12 225h${w - 24}v${soilDepth}H12Z`} fill="#b29d79" />
          {Array.from({ length: 11 }, (_, i) => {
            const x = 20 + (i * (w - 40)) / 10;
            return (
              <g key={i}>
                <ellipse
                  cx={x}
                  cy="224"
                  rx={7 * life.pioneer}
                  ry={3 * life.pioneer}
                  fill="#a7ad71"
                />
                {sec && <ellipse cx={x} cy={230 + (i % 3) * 7} rx="2" ry="1.5" fill="#dac391" />}
              </g>
            );
          })}
          {[0.15, 0.3, 0.48, 0.65, 0.84].map((f, i) => {
            const x = w * f,
              h = life.herb * (22 + (i % 2) * 9);
            return (
              <path
                key={f}
                d={`M${x} 225q-5 ${-h * 0.7}-9 ${-h}m9 ${h}q5 ${-h * 0.8} 11 ${-h * 0.9}m-11 ${h * 0.9}v${-h}`}
                fill="none"
                stroke="#93a16d"
                strokeWidth="2"
              />
            );
          })}
          {[0.28, 0.7].map((f, i) => {
            const x = w * f,
              h = life.shrub * (52 + i * 8);
            return (
              <g key={f}>
                <path
                  d={`M${x} 225v${-h}m0 ${h * 0.4}l-14 ${-h * 0.3}m14 ${h * 0.15}l15 ${-h * 0.35}`}
                  stroke="#9c8d69"
                  fill="none"
                  strokeWidth="3"
                />
                <ellipse
                  cx={x}
                  cy={225 - h * 0.78}
                  rx={24 * life.shrub}
                  ry={20 * life.shrub}
                  fill="#a1b184"
                />
              </g>
            );
          })}
          {[0.2, 0.52, 0.82].map((f, i) => {
            const x = w * f,
              h = life.tree * (130 + (i % 2) * 15),
              root = Math.max(0, Math.min(soilDepth - 2, h * 0.18));
            return (
              <g key={f}>
                <path
                  d={`M${x} ${225 - h}v${h}m0 0l${-root * 0.6} ${root}m${root * 0.6} ${-root}l${root * 0.65} ${root * 0.9}`}
                  fill="none"
                  stroke="#8c8067"
                  strokeWidth={2 + life.tree * 3}
                />
                <path
                  d={`M${x} ${225 - h}l${-30 * life.tree} ${h * 0.58}h${60 * life.tree}Z`}
                  fill="#829875"
                />
                <path
                  d={`M${x} ${225 - h * 0.8}l${-34 * life.tree} ${h * 0.57}h${68 * life.tree}Z`}
                  fill="#8ca17b"
                />
              </g>
            );
          })}
          <text x={w / 2} y="292" textAnchor="middle">
            {s('示意过程，不是统一年限', 'Model, not a timetable')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-survey-controls">
          <div className="bio-survey-buttons">
            {titles.map((t, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setChosen(i);
                  setView(0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bio-survey-buttons">
            {Array.from({ length: mode === 1 ? 4 : 3 }, (_, i) => (
              <button
                key={i}
                aria-pressed={local === i}
                onClick={() => {
                  setView(i);
                  if (mode === 2) {
                    setSecondary(i === 1);
                    setWater(i === 2 ? 0.25 : 0.85);
                  }
                }}
              >
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          {((mode === 1 && local < 3) || mode === 2) && (
            <label>
              {s('过程位置', 'Progress')}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={progress}
                onChange={(e) => setProgress(+e.target.value)}
              />
            </label>
          )}
          {mode === 0 && local < 2 && (
            <div className="bio-survey-buttons">
              {wetlandBirds.map((b, i) => (
                <button key={i} aria-pressed={bird === i} onClick={() => setBird(i)}>
                  {s(b.zh, b.en)}
                </button>
              ))}
            </div>
          )}
          {mode === 1 && (local === 1 || local === 3) && (
            <button aria-pressed={lamp} onClick={() => setLamp(!lamp)}>
              {s('诱虫灯', 'Extraction lamp')}
            </button>
          )}
          {mode === 1 && local === 2 && (
            <button aria-pressed={pump} onClick={() => setPump(!pump)}>
              {s('手动气源', 'Hand pump')}
            </button>
          )}
          {mode === 1 && local === 3 && (
            <>
              <button aria-pressed={own} onClick={() => setOwn(!own)}>
                {s('输入我的类群记录', 'Enter my group records')}
              </button>
              {own && (
                <div className="bio-survey-records">
                  {groups.map((g, i) => (
                    <label key={i}>
                      {g}
                      <input
                        type="number"
                        min="0"
                        value={counts[i] ?? ''}
                        placeholder={s('未记录', 'Not recorded')}
                        onChange={(e) => {
                          const n = [...counts];
                          n[i] =
                            e.target.value === '' ? null : surveyClamp(+e.target.value, 0, 1e6);
                          setCounts(n);
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
          {mode === 2 && (
            <>
              <button aria-pressed={secondary} onClick={() => setSecondary(!secondary)}>
                {s('保留土壤与繁殖体', 'Retain soil and propagules')}
              </button>
              <label>
                {s('水分适宜程度', 'Moisture suitability')} {water.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={water}
                  onChange={(e) => setWater(+e.target.value)}
                />
              </label>
            </>
          )}
          <details>
            <summary>{s('取样、分类与模型说明', 'Sampling, classification and models')}</summary>
            <p>
              {s(
                '水鸟表按教材原值呈现，包括胃中草屑、贝壳和沙砾；不能把所有检出物都解释成主动选择的营养食物。观察日志用非干扰行为记录，自己的记录从空白开始。土壤采样体积由圆柱尺寸算出；诱虫器利用热与干燥响应，有检测偏差。小动物身份通过网孔、漏斗和容器保持不变。吸虫器示意改用手动气源，出气管有纱网，动物不进入气源。这里只识别宽泛类群和待鉴定组，不把它们冒称已确定物种。演替参数是教学简化，没有把所有地点规定成森林或统一年限。',
                'Bird values reproduce the textbook, including plant fragments, shells and grit; detected material is not automatically selected nutritional food. Personal non-disturbing observation notes begin blank. Soil-core volume follows cylinder dimensions. Heat and drying extraction has detection bias. Animal identities follow actual mesh, funnel and collector geometry. A hand pump replaces mouth suction; a screen protects the air outlet. Broad groups and unresolved specimens are not claimed as known species. Succession parameters are illustrative, with neither an inevitable forest nor a universal timetable.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
