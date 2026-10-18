import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  saltPurification,
  saltIonLabels,
  saltSolidLabels,
  sulfateCompletionProbe,
  saltDirector,
  type SaltRoute,
  type SaltIon,
  type SaltSolid,
} from '../../models/chem-salt-purification';
import '../../styles/chem-salt-purification.css';
export default function ChemSaltPurification() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (zh: string, eng: string) => (en ? eng : zh);
  const [step, setStep] = useState(4),
    [fraction, setFraction] = useState(0.8),
    [route, setRoute] = useState<SaltRoute>('textbook');
  const d = film.watch
    ? saltDirector(film.chapter, film.chapterProgress)
    : { chapter: step, progress: fraction };
  const s = saltPurification(d.chapter, d.progress, film.watch ? 'textbook' : route),
    bad = saltPurification(5, d.progress, 'acid-first');
  const labels = [
    ['溶解后的去向', 'After dissolution'],
    ['BaCl₂ → BaSO₄', 'BaCl₂ → BaSO₄'],
    ['上层清液的检验', 'Test the clear supernatant'],
    ['NaOH → Mg(OH)₂', 'NaOH → Mg(OH)₂'],
    ['Na₂CO₃ · 两种去向', 'Na₂CO₃ · two targets'],
    ['留下固体，收集滤液', 'Retain solids, collect filtrate'],
    ['过滤与加酸的先后', 'Filter first or acid first?'],
    ['蒸发只带走水', 'Evaporation removes water'],
  ];
  const ionKeys: SaltIon[] =
    d.chapter === 0
      ? ['Ca', 'Mg', 'SO4']
      : d.chapter === 1 || d.chapter === 2
        ? ['SO4', 'Ba']
        : d.chapter === 3
          ? ['Mg', 'OH']
          : d.chapter === 4
            ? ['Ca', 'Ba', 'CO3']
            : d.chapter === 5
              ? ['Na', 'Cl', 'OH', 'CO3']
              : ['Ca', 'Mg', 'Ba', 'SO4'];
  const solidKeys = (Object.keys(s.solids) as SaltSolid[]).filter(
    (k) => k !== 'sand' && s.solids[k] + s.removed[k] > 1e-5,
  );
  const filterShot =
    (d.chapter === 5 && (film.watch || route !== 'acid-first')) ||
    (!film.watch && d.chapter === 6 && route === 'acid-first');
  const comparison = d.chapter === 6 && film.watch;
  return (
    <section className="chem-salt-purification">
      <div className="chem-salt-heading">{say(labels[d.chapter][0], labels[d.chapter][1])}</div>
      {d.chapter === 2 ? (
        <>
          <svg
            className="chem-salt-apparatus"
            viewBox="0 0 320 200"
            aria-label={say(
              '对上层清液分别滴加氯化钡，比较硫酸根已除尽与未除尽',
              'Barium chloride probes clear supernatants with and without residual sulfate',
            )}
            role="img"
          >
            {[false, true].map((low, i) => {
              const x = 86 + 148 * i,
                a = saltPurification(2, 1, low ? 'too-little-barium' : 'textbook'),
                newSolid = sulfateCompletionProbe(a.ions.SO4) * d.progress;
              return (
                <g key={i}>
                  <path
                    d={`M${x - 28} 60V153Q${x - 28} 183 ${x} 183Q${x + 28} 183 ${x + 28} 153V60`}
                    stroke="#9cacb0"
                    fill="#e3efed55"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 25} 106H${x + 25}V153Q${x + 25} 179 ${x} 179Q${x - 25} 179 ${x - 25} 153Z`}
                    fill="#c4d6d033"
                  />
                  {Array.from({ length: 30 }, (_, k) => (
                    <circle
                      key={k}
                      cx={x - 20 + ((k * 19) % 41)}
                      cy={113 + ((k * 13) % 59)}
                      r="3"
                      fill="#fbfcf4"
                      opacity={newSolid / 0.08}
                    />
                  ))}
                  <path
                    d={`M${x - 5} 10H${x + 5}V38L${x} 48L${x - 5} 38Z`}
                    fill="#d5e0dc"
                    stroke="#9cacb0"
                  />
                  <circle
                    cx={x}
                    cy={54 + 40 * ((d.progress * 4) % 1)}
                    r="3"
                    fill="#a3c2b5"
                    opacity={d.progress > 0 && d.progress < 1 ? 1 : 0}
                  />
                </g>
              );
            })}
          </svg>
          <div className="chem-salt-pairlabels">
            <span>{say('未出现新浑浊', 'No new cloudiness')}</span>
            <span>{say('出现新浑浊', 'New cloudiness')}</span>
          </div>
        </>
      ) : comparison ? (
        <div className="chem-salt-comparison">
          {[
            { a: s, ok: true },
            { a: bad, ok: false },
          ].map(({ a, ok }) => (
            <div className="chem-salt-compare" key={String(ok)}>
              <div>{ok ? say('过滤 → 加酸', 'Filter → acid') : say('先加酸', 'Acid first')}</div>
              <svg
                viewBox="0 0 160 140"
                role="img"
                aria-label={
                  ok
                    ? say('已过滤的溶液', 'Filtered solution')
                    : say('沉淀重新溶解后的溶液', 'Solution after precipitate redissolves')
                }
              >
                <path
                  d="M30 20V111Q30 126 45 126H115Q130 126 130 111V20"
                  fill="#ecf2ec55"
                  stroke="#9cacb0"
                  strokeWidth="2"
                />
                <path d="M34 66H126V110Q126 122 112 122H48Q34 122 34 110Z" fill="#bfd4c444" />
                {Array.from({ length: 12 }, (_, i) => (
                  <circle
                    key={i}
                    cx={44 + ((i * 23) % 70)}
                    cy={77 + ((i * 17) % 35)}
                    r="3.4"
                    fill={i % 2 ? '#a6b9c0' : '#b9ad90'}
                    opacity={ok ? 0 : a.contamination / 2.2}
                  />
                ))}
                {Array.from({ length: 8 }, (_, i) => (
                  <circle
                    key={i}
                    cx={47 + ((i * 19) % 66)}
                    cy={60 - i * 4}
                    r="2.5"
                    stroke="#b5c9bc"
                    fill="none"
                    opacity={a.CO2 > 0 && d.progress < 0.95 ? 0.6 : 0}
                  />
                ))}
              </svg>
              <strong>
                {say('杂质离子', 'Impurity ions')} {a.contamination.toFixed(2)}
              </strong>
            </div>
          ))}
        </div>
      ) : filterShot ? (
        <svg
          className="chem-salt-apparatus chem-salt-filter"
          viewBox="0 0 320 245"
          role="img"
          aria-label={say(
            '混合液沿玻璃棒进入滤纸，沉淀留在滤纸，滤液沿漏斗流入烧杯',
            'Suspension follows a glass rod into filter paper; solids stay on the paper and filtrate flows into a beaker',
          )}
        >
          <path
            d="M270 35V240M246 240H296M177 82H270"
            stroke="#a7b6ab"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <ellipse cx="135" cy="82" rx="42" ry="8" fill="none" stroke="#a7b6ab" strokeWidth="3" />
          <g transform="translate(38 40) rotate(28)">
            <path
              d="M0 0V53Q0 59 7 59H51Q58 59 58 52V0L66-3"
              fill="#e5eee455"
              stroke="#9cacb0"
              strokeWidth="2"
            />
            <path
              d={`M4 ${15 + 30 * s.filtration}H54V51Q54 55 49 55H9Q4 55 4 51Z`}
              fill="#c1d1bf77"
            />
          </g>
          <path d="M83 29L123 87" stroke="#b2c3bd" strokeWidth="4" strokeLinecap="round" />
          <path
            d="M97.7 68.3Q104 67 110 68.2L123 87"
            stroke="#b6cfc4"
            strokeWidth="3"
            opacity={s.filtration > 0 && s.filtration < 1 ? 0.85 : 0}
            fill="none"
          />
          <path
            d="M90 72L130 126V185H141V126L180 72Z"
            stroke="#a1b4b3"
            strokeWidth="2"
            fill="#e5efeb44"
          />
          <path d="M99 78L135 122L171 78" fill="#f4f1df" stroke="#cec9b5" strokeWidth="1.5" />
          {Array.from({ length: 22 }, (_, i) => (
            <circle
              key={i}
              cx={111 + ((i * 13) % 47)}
              cy={85 + ((i * 7) % 14)}
              r="2.8"
              fill={i % 5 ? '#fcfbed' : '#b9ad90'}
              opacity={s.filtration}
            />
          ))}
          <path
            d="M136 152V225Q136 234 146 234H225Q235 234 235 225V151"
            fill="#e7efea44"
            stroke="#9cacb0"
            strokeWidth="2"
          />
          <path
            d={`M140 ${228 - 44 * s.filtration}H231V224Q231 230 224 230H147Q140 230 140 224Z`}
            fill="#bfd5c777"
          />
          <path
            d="M140 185V223"
            stroke="#acc9ba"
            strokeWidth="2"
            opacity={s.filtration > 0 && s.filtration < 1 ? 0.8 : 0}
          />
          <path d="M132 126V183H140" stroke="#a3b9b1" strokeWidth="2" fill="none" />
        </svg>
      ) : d.chapter === 7 ? (
        <>
          <svg
            className="chem-salt-apparatus"
            viewBox="0 0 320 225"
            role="img"
            aria-label={say(
              '蒸发皿中水减少，剩余盐留在皿内',
              'Water decreases in an evaporating dish while salt stays behind',
            )}
          >
            <path d="M45 97Q160 194 275 97" fill="#e5e5d5" stroke="#b4bba7" strokeWidth="2" />
            <ellipse
              cx="160"
              cy="97"
              rx="115"
              ry="27"
              fill="#e9eee0"
              stroke="#b4bba7"
              strokeWidth="2"
            />
            <ellipse
              cx="160"
              cy="100"
              rx={96 * Math.sqrt(s.waterRemaining)}
              ry={19 * Math.sqrt(s.waterRemaining)}
              fill="#bdd0c2"
              opacity=".7"
            />
            {Array.from({ length: 42 }, (_, i) => {
              const a = i * 2.4,
                r = 15 + ((i * 29) % 80),
                x = 160 + Math.cos(a) * r,
                y = 99 + Math.sin(a) * r * 0.21;
              return (
                <rect
                  key={i}
                  x={x - 3}
                  y={y - 3}
                  width="6"
                  height="6"
                  rx=".7"
                  transform={`rotate(${i * 17} ${x} ${y})`}
                  fill="#fafbef"
                  stroke="#bcc5ae"
                  opacity={clampOpacity((1 - s.waterRemaining) * 1.3 - i / 60)}
                />
              );
            })}
            {Array.from({ length: 4 }, (_, i) => (
              <path
                key={i}
                d={`M${110 + i * 31} 69q-10-15 0-28q10-12 0-25`}
                fill="none"
                stroke="#c4d3c7"
                opacity={d.progress > 0 && d.progress < 0.8 ? 0.6 : 0}
              />
            ))}
            <path d="M68 141H252M87 141L78 194M233 141L242 194" stroke="#a1b09e" strokeWidth="3" />
            <rect x="140" y="194" width="40" height="22" rx="8" fill="#d4ddc955" stroke="#b0bca7" />
            <ellipse cx="160" cy="194" rx="20" ry="5" fill="#bbc2a9" />
            {d.progress < 0.8 && (
              <path d="M155 190Q133 172 163 150Q154 170 173 175Q182 189 155 190" fill="#d9bd83" />
            )}
          </svg>
          <div className="chem-salt-readout">
            {s.pureSaltEligible
              ? say('Na⁺ 与 Cl⁻ 留下', 'Na⁺ and Cl⁻ remain')
              : say('杂质也留下', 'Impurities remain too')}
          </div>
        </>
      ) : (
        <svg
          className="chem-salt-apparatus"
          viewBox="0 0 320 215"
          role="img"
          aria-label={say(
            '烧杯中的离子转移到沉淀，符号与颜色仅作追踪',
            'Ions move from solution into precipitate; symbols and colours are tracers',
          )}
        >
          <path
            d="M68 34L77 38V184Q77 202 94 202H226Q243 202 243 184V34"
            stroke="#9cacb0"
            strokeWidth="2.4"
            fill="#e8f0e755"
          />
          <path d="M82 98H238V184Q238 197 222 197H98Q82 197 82 184Z" fill="#c0d6c133" />
          {[
            ['Ca', 108, 122],
            ['Mg', 191, 140],
            ['SO4', 133, 165],
            ['Ba', 209, 110],
          ].map(([key, x, y]) => {
            const k = key as SaltIon,
              n = s.ions[k],
              v = d.chapter === 0 ? d.progress : 1;
            return (
              <g key={k} opacity={Math.min(1, n) * v}>
                <circle
                  cx={Number(x)}
                  cy={Number(y)}
                  r={k === 'SO4' ? 22 : 14}
                  fill="#e0e6d566"
                  stroke={k === 'Ba' ? '#b6a587' : '#9aafa0'}
                />
                <text
                  x={Number(x)}
                  y={Number(y) + 5}
                  textAnchor="middle"
                  fill="#657a69"
                  fontSize="20"
                >
                  {k === 'SO4' ? 'SO₄' : k}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 34 }, (_, i) => {
            const total = Object.values(s.solids).reduce((a, b) => a + b, 0),
              on = d.chapter === 0 ? 1 - d.progress : Math.min(1, total / 3);
            return (
              <circle
                key={i}
                cx={91 + ((i * 31) % 137)}
                cy={187 + ((i * 13) % 8)}
                r={i % 3 ? 3 : 4}
                fill={i % 9 ? '#f9faed' : '#b4aa92'}
                opacity={on}
              />
            );
          })}
          <path d="M160 4V49" stroke="#9fb3ab" strokeWidth="3" />
          <path d="M153 4H167V31L160 49L153 31Z" fill="#c3d3cb" stroke="#9fb3ab" />
          {d.chapter > 0 && d.progress > 0 && d.progress < 1 && (
            <circle cx="160" cy={57 + 32 * ((d.progress * 5) % 1)} r="3.5" fill="#aac6b6" />
          )}
        </svg>
      )}
      {d.chapter !== 2 && d.chapter !== 6 && d.chapter !== 7 && (
        <div className="chem-salt-ledger">
          {ionKeys.map((k) => (
            <span key={k}>
              <b>{saltIonLabels[k]}</b>
              <em>{s.ions[k].toFixed(2)}</em>
            </span>
          ))}
        </div>
      )}
      {d.chapter === 5 && (
        <div className="chem-salt-solids">
          {solidKeys.map((k) => (
            <span key={k}>{saltSolidLabels[k]}</span>
          ))}
        </div>
      )}
      {d.chapter === 6 && (
        <div className="chem-salt-equations">
          <span>OH⁻ ＋ H⁺ → H₂O</span>
          <span>CO₃²⁻ ＋ 2H⁺ → CO₂ ＋ H₂O</span>
        </div>
      )}
      <div className="chem-salt-key">{say('示意份数 · 追踪标记', 'Model units · tracers')}</div>
      {!film.watch && (
        <div className="chem-salt-controls">
          <Segments
            label={say('步骤对照', 'Process route')}
            value={route}
            onChange={(v) => setRoute(v as SaltRoute)}
            options={[
              { value: 'textbook', label: say('教材顺序', 'Textbook order') },
              { value: 'acid-first', label: say('先加酸', 'Acid first') },
              { value: 'no-carbonate', label: say('漏加碳酸钠', 'Omit carbonate') },
              { value: 'too-little-barium', label: say('钡盐不足', 'Too little barium') },
            ]}
          />
          <Range
            label={say('学习步骤', 'Learning step')}
            value={step}
            min={0}
            max={7}
            step={1}
            onChange={setStep}
          />
          <Range
            label={say('本步进度', 'Step progress')}
            value={fraction}
            min={0}
            max={1}
            step={0.01}
            onChange={setFraction}
          />
          <details>
            <summary>{say('模型边界', 'Model boundaries')}</summary>
            <p>
              {say(
                '任意物质的量份数用于化学计量；沉淀视为完全反应，未求解溶度积、共沉淀或回收率。蒸发画面只说明水与不挥发物的去向。',
                'Arbitrary molar units show stoichiometry. Precipitation is idealised as complete; solubility products, coprecipitation and recovery are not solved. Evaporation only tracks water and nonvolatile material.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
function clampOpacity(x: number) {
  return Math.max(0, Math.min(1, x));
}
