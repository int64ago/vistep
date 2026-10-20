import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  anionEvidence,
  anionDirector,
  anionCarbonRoute,
  type AnionTest,
} from '../../models/chem-anion-tests';
import '../../styles/chem-anion-tests.css';
export default function ChemAnionTests() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [chosenTest, setTest] = useState<AnionTest | null>(null),
    [chosenMetal, setMetal] = useState<number | null>(null),
    [chosenAcid, setAcid] = useState<number | null>(null);
  const directed = anionDirector(
    film.chapter,
    film.chapterProgress,
    film.chapterTime,
    en ? 'en' : 'zh',
  );
  const test = chosenTest ?? directed.test,
    metal = chosenMetal ?? directed.metal,
    acid = chosenAcid ?? directed.acid;
  const d = film.watch ? directed : { test, metal, acid, ledger: true, pulse: 0 };
  const m = anionEvidence(d.test, d.metal, d.acid),
    chloride = d.test === 'chloride';
  const labels = chloride ? ['HCl', 'NaCl', 'Na₂CO₃'] : ['H₂SO₄', 'Na₂SO₄', 'Na₂CO₃'];
  return (
    <section
      className="chem-anion-tests"
      data-watch={film.watch}
      data-ledger={d.ledger}
      data-test={d.test}
      data-metal={d.metal}
      data-acid={d.acid}
      data-carbon-total={m.carbonTotal}
    >
      <div className="chem-anion-reagents">
        <span className={d.metal > 0 ? 'active' : ''}>{m.reagent}</span>
        <b>→</b>
        <span className={d.acid > 0 ? 'active' : ''}>
          {say('再加', 'then')} {m.acidName}
        </span>
      </div>
      <div className="chem-anion-rack">
        {labels.map((label, i) => {
          const carbonate = i === 2,
            solid = carbonate ? m.carbonateSolid : m.targetSolid;
          return (
            <figure key={label} data-control={carbonate} data-solid={solid}>
              <figcaption>
                <strong>{label}</strong>
                <span>{carbonate ? say('干扰对照', 'Control') : say('待比较溶液', 'Sample')}</span>
              </figcaption>
              <svg
                viewBox="45 0 100 250"
                role="img"
                aria-label={say(
                  `${label}中${carbonate ? m.carbonate : m.target}沉淀的保留程度`,
                  `${carbonate ? m.carbonate : m.target} precipitate remaining in ${label}`,
                )}
              >
                <defs>
                  <clipPath id={`${id}-${i}`}>
                    <path d="M57 51V206a38 38 0 0 0 76 0V51Z" />
                  </clipPath>
                </defs>
                <path
                  d="M55 50V206a40 40 0 0 0 80 0V50"
                  fill="#c9d6cc18"
                  stroke="#8da294"
                  strokeWidth="2"
                />
                <ellipse cx="95" cy="50" rx="40" ry="7" fill="none" stroke="#8da294" />
                <path d="M57 112V206a38 38 0 0 0 76 0V112Z" fill="#c8ddd0" opacity=".18" />
                <ellipse cx="95" cy="112" rx="38" ry="6" fill="#c8ddd0" opacity=".2" />
                <g clipPath={`url(#${id}-${i})`}>
                  {Array.from({ length: 38 }, (_, k) => (
                    <ellipse
                      key={k}
                      cx={66 + ((k * 17) % 57)}
                      cy={222 + ((k * 13) % 17) - solid * 14}
                      rx={5}
                      ry={3}
                      fill={carbonate && chloride ? '#e7e1c6' : '#efeee2'}
                      opacity={Math.max(0, Math.min(1, solid * 38 - k))}
                    />
                  ))}
                </g>
                <path d="M90 5V28L95 38L100 28V5" fill="#ced9cd66" stroke="#8da294" />
                {((d.metal > 0 && d.metal < 2) || (d.acid > 0 && d.acid < 2)) && (
                  <circle
                    cx="95"
                    cy={d.acid > 0 ? 72 : 80}
                    r="3"
                    fill={d.acid > 0 ? '#c9ba91' : '#a7c2af'}
                  />
                )}
                {carbonate &&
                  Array.from({ length: 8 }, (_, k) => {
                    const route = anionCarbonRoute(k, d.acid / 2);
                    return (
                      <circle
                        key={route.id}
                        data-carbon-id={route.id}
                        data-phase={route.phase}
                        cx={route.x}
                        cy={route.y}
                        r={3 + (k % 2)}
                        fill={route.phase === 'carbonate' ? '#d6cc99' : 'none'}
                        stroke="#829b89"
                        opacity={route.progress > 0 ? 0.8 : 0}
                      />
                    );
                  })}
              </svg>
              <div className="chem-anion-result">
                <b>
                  {solid > 0.001
                    ? carbonate
                      ? m.carbonate
                      : m.target
                    : d.metal === 0
                      ? say('无沉淀', 'No solid')
                      : say('已溶解', 'Dissolved')}
                </b>
                <span>
                  {carbonate && d.acid > 0
                    ? 'CO₂ ↑'
                    : solid <= 0.001
                      ? say('未形成', 'Not formed')
                      : d.acid > 0
                        ? say('酸中保留', 'Persists')
                        : say('形成沉淀', 'Forms')}
                </span>
              </div>
            </figure>
          );
        })}
      </div>
      {d.ledger && (
        <div className="chem-anion-reason">
          <small>{say('净计量示意', 'Net allocation')}</small>
          <span>{chloride ? 'Ag⁺ + Cl⁻ → AgCl↓' : 'Ba²⁺ + SO₄²⁻ → BaSO₄↓'}</span>
          <span className="chem-anion-carbon-equation">
            <span>{chloride ? 'Ag₂CO₃' : 'BaCO₃'} + 2H⁺ →</span>
            <span>{chloride ? '2Ag⁺' : 'Ba²⁺'} + CO₂↑ + H₂O</span>
          </span>
          <p>
            {say(
              '判断依据：生成沉淀，再观察它对稀酸的响应。',
              'Evidence: a precipitate forms, then its response to dilute acid is observed.',
            )}
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="chem-anion-controls">
          <Segments
            label={say('检验组', 'Test group')}
            value={test}
            options={[
              { value: 'chloride', label: say('氯离子', 'Chloride') },
              { value: 'sulfate', label: say('硫酸根', 'Sulfate') },
            ]}
            onChange={(v) => {
              setTest(v as AnionTest);
              setAcid(0);
            }}
          />
          <Range
            label={say('沉淀试剂 / mmol', 'Precipitating ions / mmol')}
            value={metal}
            min={0}
            max={2}
            step={0.05}
            onChange={setMetal}
          />
          <Range
            label={say('净 H⁺ 预算 / mmol', 'Net H⁺ budget / mmol')}
            value={acid}
            min={0}
            max={2}
            step={0.05}
            onChange={setAcid}
          />
          <output
            className="chem-anion-budget"
            aria-label={say('碳酸盐管的净分配', 'Carbonate-tube net allocation')}
          >
            CO₂: {m.carbonDioxide.toFixed(2)} mmol · {chloride ? 'Ag⁺' : 'Ba²⁺'}(aq):{' '}
            {m.carbonateDissolvedMetal.toFixed(2)} mmol
          </output>
          <p>
            {say(
              '每管起始阴离子 1 mmol。滑块分配完全转化所需的净 H⁺，并非逐滴酸碱平衡；未计算 HCO₃⁻、pH 和微量溶解。不是任意混合物的完整鉴定。',
              'Each tube starts with 1 mmol of anion. The slider allocates a net H⁺ budget to complete conversions, not a titration equilibrium. HCO₃⁻, pH and small solubilities are not calculated. This is not a complete analysis of arbitrary mixtures.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
