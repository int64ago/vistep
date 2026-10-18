import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  conditioningEvidence,
  motorMapping,
  languageEvidence,
  lateralBrainOutline,
  type MotorSite,
  type LanguageCase,
} from '../../models/bio-neural-evidence';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-neural-evidence.css';
export default function BioNeuralEvidence() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const [chosen, setChosen] = useState(
      film.variant === 'bio-elective-1-034-1' ? 1 : film.variant === 'bio-elective-1-037-1' ? 2 : 0,
    ),
    [train, setTrain] = useState(12),
    [ext, setExt] = useState(0),
    [paired, setPaired] = useState(true),
    [foodTest, setFoodTest] = useState(false),
    [site, setSite] = useState<MotorSite>('hand'),
    [side, setSide] = useState<'left' | 'right'>('left'),
    [caseId, setCaseId] = useState<LanguageCase>('S');
  const mode = film.watch ? (film.chapter < 3 ? 0 : film.chapter < 5 ? 1 : 2) : chosen,
    p = film.chapterProgress;
  const c = conditioningEvidence(
    film.watch ? (film.chapter === 0 ? 0 : film.chapter === 1 ? Math.floor(p * 12) : 12) : train,
    film.watch ? (film.chapter === 2 ? Math.floor(p * 12) : 0) : ext,
    film.watch ? true : paired,
  );
  const motor = motorMapping(
      film.watch ? (film.chapter === 3 ? 'leg' : 'hand') : site,
      film.watch ? 'left' : side,
    ),
    lang = languageEvidence(film.watch ? (film.chapter === 5 ? 'S' : 'H') : caseId);
  const testFood = film.watch ? film.chapter === 0 && p < 0.5 : foodTest,
    response = testFood ? c.foodResponse : c.soundResponse,
    activation = film.watch ? Math.max(0, Math.min(1, (p - 0.15) / 0.3)) : 1;
  const brainWidth = compact ? w - 44 : w * 0.55,
    scale = brainWidth / 300,
    brainX = 22,
    brainY = compact ? 45 : 50,
    bodyX = compact ? w / 2 : w * 0.8,
    bodyY = compact ? 240 : 103;
  const names = [
    s('声音怎样获得意义', 'How a sound gains predictive meaning'),
    s('皮层位置与运动部位', 'Cortical position and body movement'),
    s('从病例拆开语言功能', 'Separate language functions through cases'),
  ];
  const brain = (
    <g transform={`translate(${brainX} ${brainY}) scale(${scale})`}>
      <path d={lateralBrainOutline} fill="#dedccf" stroke="#aaa995" strokeWidth="2" />
      {[
        'M62 53q-24 29-5 48t-8 39',
        'M92 34q-14 25 7 44t-5 41',
        'M132 32q21 35 1 52t2 56',
        'M180 33q-19 31 9 52t-5 49',
        'M224 44q-22 27 4 43t-1 46',
        'M267 76q-28 0-19 27t-13 41',
        'M61 152q25-26 53-3t48 3q29-32 65 2',
      ].map((d) => (
        <path key={d} d={d} stroke="#bdbbaa" strokeWidth="2" fill="none" />
      ))}
    </g>
  );
  return (
    <div ref={host} className="bio-neural-evidence" data-watch={film.watch}>
      <div className="bio-neural-heading">{names[mode]}</div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} 385`} role="img" aria-label={names[0]}>
          <path
            d={`M${w * 0.19 - 17} 58q0-32 17-32t17 32l7 8h-48Z`}
            fill="#c8b38c"
            stroke="#a18d68"
          />
          <circle cx={w * 0.19} cy="69" r="4" fill="#9c8863" />
          <path
            d={`M${w * 0.19 + 31} 33q13 11 0 23m10-32q23 20 0 41`}
            stroke="#b7b794"
            fill="none"
            opacity={testFood ? 0.15 : 0.7}
          />
          <text x={w * 0.19} y="100" textAnchor="middle">
            {s('声音', 'Sound')}
          </text>
          <path d={`M${w * 0.77 - 26} 60q26 20 52 0Z`} fill="#d1d5c3" stroke="#a9b498" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={w * 0.77 - 13 + i * 12}
              cy="57"
              r="7"
              fill="#ae9272"
              opacity={testFood ? 1 : 0.15}
            />
          ))}
          <text x={w * 0.77} y="100" textAnchor="middle">
            {c.extinction > 0 ? s('不再给食物', 'Food omitted') : s('食物', 'Food')}
          </text>
          <g transform={`translate(${w * 0.44} 167)`}>
            <path
              d="M-31 27q-20-35-6-60q20-18 40-4l24 28 38 9q10 10-8 16l-29 7-8 23Z"
              fill="#c3b7a0"
              stroke="#978c78"
              strokeWidth="2"
            />
            <path d="M-21-35q-33-14-28 23t27 17Z" fill="#aa9d86" />
            <circle cx="14" cy="-16" r="3" fill="#544f43" />
            <circle cx="61" cy="3" r="5" fill="#71685c" />
          </g>
          <path
            d={`M${w * 0.44 + 53} 180v25H${w * 0.77}v10`}
            fill="none"
            stroke="#9cadb1"
            strokeWidth="2"
          />
          <path
            d={`M${w * 0.77 - 18} 212v40q0 5 5 5h26q5 0 5-5v-40`}
            fill="#f7f8f2"
            stroke="#a7b9b5"
          />
          <rect
            x={w * 0.77 - 15}
            y={253 - response * 32}
            width="30"
            height={response * 32}
            fill="#b5cace"
            opacity=".7"
          />
          <text x="24" y="248">
            {testFood
              ? s('食物单独测试', 'Food-alone test')
              : s('声音单独测试', 'Sound-alone test')}
          </text>
          <path
            d={c.records
              .map(
                (r, i) =>
                  `${i ? 'L' : 'M'}${28 + ((w - 56) * r.trial) / 24},${339 - r.association * 58}`,
              )
              .join(' ')}
            fill="none"
            stroke="#829b90"
            strokeWidth="3"
          />
          <text x="28" y="374">
            {s('训练', 'Training')} {c.training} · {s('未强化', 'Unreinforced')} {c.extinction}
          </text>
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} ${compact ? 405 : Math.max(350, brainY + 205 * scale + 30)}`}
          role="img"
          aria-label={names[1]}
        >
          {brain}
          <g transform={`translate(${brainX} ${brainY}) scale(${scale})`}>
            {(['leg', 'hand', 'face'] as const).map((k) => {
              const m = motorMapping(k);
              return (
                <ellipse
                  key={k}
                  cx={m.cortex.x}
                  cy={m.cortex.y}
                  rx={m.cortex.r * 0.45}
                  ry={m.cortex.r}
                  fill={k === motor.site ? '#b68c68' : '#b8c3a4'}
                  opacity={k === motor.site ? 0.2 + 0.8 * activation : 0.25}
                />
              );
            })}
          </g>
          <text x={w / 2} y="25" textAnchor="middle">
            {motor.hemisphere === 'left'
              ? s('左侧皮层 → 右侧躯体', 'Left cortex → right body')
              : s('右侧皮层 → 左侧躯体', 'Right cortex → left body')}
          </text>
          <g transform={`translate(${bodyX} ${bodyY}) scale(${compact ? 0.75 : 1})`}>
            <circle cx="0" cy="0" r="20" fill="#e1d7c5" stroke="#aea38d" />
            <path
              d="M-19 27h38l16 58-15 3-9-31v56l12 67H9L0 124-9 180h-14l12-67V57l-9 31-15-3Z"
              fill="#e1d7c5"
              stroke="#aea38d"
            />
            <path
              d={
                motor.site === 'leg'
                  ? `M${motor.bodySide === 'right' ? -8 : 8} 115l${motor.bodySide === 'right' ? -10 : 10} 61`
                  : motor.site === 'hand'
                    ? `M${motor.bodySide === 'right' ? -31 : 31} 79v12`
                    : `M${motor.bodySide === 'right' ? -10 : 10} -5v14`
              }
              stroke="#b58b6c"
              opacity={activation}
              strokeWidth={motor.site === 'hand' ? 15 : 9}
              strokeLinecap="round"
            />
          </g>
          <text x={compact ? w / 2 : bodyX} y={compact ? 394 : 321} textAnchor="middle">
            {
              { leg: s('腿部', 'Leg'), hand: s('手部', 'Hand'), face: s('面部', 'Face') }[
                motor.site
              ]
            }
          </text>
        </svg>
      )}
      {mode === 2 && (
        <>
          <svg viewBox={`0 0 ${w} ${brainY + 205 * scale + 15}`} role="img" aria-label={names[2]}>
            {brain}
            <circle
              cx={brainX + lang.lesion.x * scale}
              cy={brainY + lang.lesion.y * scale}
              r="13"
              fill="#b98978"
              opacity=".8"
            />
            <text
              x={brainX + lang.lesion.x * scale}
              y={brainY + lang.lesion.y * scale + 5}
              textAnchor="middle"
              fill="white"
            >
              {lang.caseId}
            </text>
            <text x={w - 20} y="27" textAnchor="end">
              {s('病例证据', 'Case evidence')}
            </text>
          </svg>
          <table>
            <tbody>
              {[
                [s('听觉', 'Hearing'), true],
                [s('发音器官', 'Vocal organs'), true],
                [s('流畅表达', 'Fluent speech'), lang.fluentProduction],
                [s('理解话语', 'Speech comprehension'), lang.spokenComprehension],
              ].map(([label, ok]) => (
                <tr key={String(label)}>
                  <th>{label}</th>
                  <td>{ok ? s('保留', 'Preserved') : s('受损', 'Impaired')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {!film.watch && (
        <div className="bio-neural-controls">
          <div className="bio-neural-buttons">
            {names.map((name, i) => (
              <button key={i} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {name}
              </button>
            ))}
          </div>
          {mode === 0 ? (
            <>
              <label htmlFor={`${id}-train`}>
                {s('配对训练次数', 'Paired training trials')} {train}
                <input
                  id={`${id}-train`}
                  type="range"
                  min="0"
                  max="24"
                  value={train}
                  onChange={(e) => setTrain(+e.target.value)}
                />
              </label>
              <label htmlFor={`${id}-ext`}>
                {s('声音不再配食物的次数', 'Sound trials without food')} {ext}
                <input
                  id={`${id}-ext`}
                  type="range"
                  min="0"
                  max="24"
                  value={ext}
                  onChange={(e) => setExt(+e.target.value)}
                />
              </label>
              <button aria-pressed={paired} onClick={() => setPaired(!paired)}>
                {s('训练阶段声音先于食物', 'Sound predicts food during training')}
              </button>
              <button aria-pressed={foodTest} onClick={() => setFoodTest(!foodTest)}>
                {s('单独测试食物反应', 'Test food alone')}
              </button>
            </>
          ) : mode === 1 ? (
            <div className="bio-neural-buttons">
              {(['leg', 'hand', 'face'] as const).map((k) => (
                <button key={k} aria-pressed={site === k} onClick={() => setSite(k)}>
                  {
                    {
                      leg: s('上部：腿', 'Upper: leg'),
                      hand: s('中部：手', 'Middle: hand'),
                      face: s('下部：面', 'Lower: face'),
                    }[k]
                  }
                </button>
              ))}
              <button onClick={() => setSide(side === 'left' ? 'right' : 'left')}>
                {s('切换刺激侧', 'Switch stimulated side')}
              </button>
            </div>
          ) : (
            <div className="bio-neural-buttons">
              {(['S', 'H'] as const).map((k) => (
                <button key={k} aria-pressed={caseId === k} onClick={() => setCaseId(k)}>
                  {s('病例', 'Case')} {k}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <details>
        <summary>{s('证据与模型', 'Evidence and model')}</summary>
        <p>
          {s(
            '条件学习以明确的误差修正规则示意，曲线不是唾液实测量；食物的非条件反应与声音的条件反应分开。皮层和躯体是示意定位，手区较大不表示手的体积较大，实际映射并非硬边界。病例比较基于教材所列功能与损伤关联，不是对人进行的损伤实验；语言由相互联系的网络参与，S和H不能当作独立的单一语言开关。',
            'Conditioning follows a declared error-correction rule, not measured salivary volumes. Food and learned sound responses are distinct. Cortical locations are schematic and not sharply bounded; map size does not represent body-part size. The cases compare reported functional deficits and lesions, not experimental injury to people. Language involves connected networks rather than isolated S and H switches.',
          )}
        </p>
      </details>
    </div>
  );
}
