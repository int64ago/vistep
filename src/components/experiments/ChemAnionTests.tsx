import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { anionEvidence, anionDirector, type AnionTest } from '../../models/chem-anion-tests';
import '../../styles/chem-anion-tests.css';
export default function ChemAnionTests() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [test, setTest] = useState<AnionTest>(film.variant === 'sulfate' ? 'sulfate' : 'chloride'),
    [metal, setMetal] = useState(2),
    [acid, setAcid] = useState(0);
  const d = film.watch
    ? anionDirector(film.chapter, film.chapterProgress)
    : { test, metal, acid, ledger: true, pulse: 0 };
  const m = anionEvidence(d.test, d.metal, d.acid),
    chloride = d.test === 'chloride';
  const labels = chloride ? ['HCl', 'NaCl', 'Na₂CO₃'] : ['H₂SO₄', 'Na₂SO₄', 'Na₂CO₃'];
  return (
    <section className="chem-anion-tests" data-watch={film.watch}>
      <div className="chem-anion-reagents">
        <span>{m.reagent}</span>
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
            <figure key={label} data-control={carbonate}>
              <figcaption>
                <strong>{label}</strong>
                <span>
                  {carbonate ? say('干扰对照', 'Control') : say('待比较溶液', 'Comparison sample')}
                </span>
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
                {d.metal > 0 && (
                  <circle
                    cx="95"
                    cy={d.acid > 0 ? 72 : 80}
                    r="3"
                    fill={d.acid > 0 ? '#c9ba91' : '#a7c2af'}
                  />
                )}
                {carbonate &&
                  m.carbonDioxide > 0 &&
                  Array.from({ length: 8 }, (_, k) => (
                    <circle
                      key={k}
                      cx={77 + ((k * 19) % 35)}
                      cy={200 - ((k * 23 + d.pulse * 80) % 103)}
                      r={2 + (k % 3)}
                      fill="none"
                      stroke="#9fb7aa"
                      opacity={m.carbonDioxide * 0.8}
                    />
                  ))}
              </svg>
              <div className="chem-anion-result">
                <b>
                  {solid > 0.001
                    ? carbonate
                      ? m.carbonate
                      : m.target
                    : d.metal === 0
                      ? '—'
                      : say('已溶解', 'Dissolved')}
                </b>
                <span>
                  {carbonate && d.acid > 0
                    ? `CO₂ ↑`
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
          <span>{chloride ? 'Ag⁺ + Cl⁻ → AgCl↓' : 'Ba²⁺ + SO₄²⁻ → BaSO₄↓'}</span>
          <span>CO₃²⁻ + 2H⁺ → CO₂↑ + H₂O</span>
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
            label={say('后加 H⁺ / mmol', 'Subsequent H⁺ / mmol')}
            value={acid}
            min={0}
            max={2}
            step={0.05}
            onChange={setAcid}
          />
          <p>
            {say(
              '教学计量：每管起始目标阴离子均为1 mmol，忽略微量溶解；不是任意混合物的完整鉴定方案。',
              'Teaching stoichiometry: each tube starts with 1 mmol of the relevant anion; small equilibrium solubility is omitted. This is not a complete scheme for arbitrary mixtures.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
