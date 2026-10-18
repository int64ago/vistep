import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  aluminiumFilm,
  aluminiumDirector,
  type AluminiumMedium,
} from '../../models/chem-aluminium-film';
import '../../styles/chem-aluminium-film.css';
export default function ChemAluminiumFilm() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [medium, setMedium] = useState<AluminiumMedium>('base'),
    [progress, setProgress] = useState(0.4),
    [oxide, setOxide] = useState(0.1),
    [reagent, setReagent] = useState(1.2);
  const d = film.watch
    ? aluminiumDirector(film.chapter, film.chapterProgress, film.variant)
    : { medium, progress, film: oxide, reagent, compare: true, species: false };
  const m = aluminiumFilm(d.medium, d.film, d.reagent, d.progress),
    bare = aluminiumFilm(d.medium, 0, d.reagent, d.progress);
  const plate = (state: typeof m, label: string) => {
    const left = 30,
      right = 270,
      metalTop = 180,
      metalHeight = 60 * state.metalLeft,
      oxideHeight = 24 * state.oxideFraction;
    return (
      <div className="chem-al-film-specimen">
        <div className="chem-al-film-label">{label}</div>
        <svg
          viewBox="0 0 300 275"
          role="img"
          aria-label={say(
            '氧化膜去除后金属铝开始产氢的放大剖面',
            'Magnified cross section showing hydrogen after oxide removal',
          )}
        >
          <path
            d="M15 55V245q0 15 15 15h240q15 0 15-15V55"
            fill="#d2ded12a"
            stroke="#97a68d"
            strokeWidth="2"
          />
          <path d="M18 85H282V245q0 12-12 12H30q-12 0-12-12Z" fill="#c8d9d533" />
          <rect
            x={left}
            y={metalTop + 60 - metalHeight}
            width={right - left}
            height={metalHeight}
            fill="#a7b0ab"
          />
          <path
            d={`M${left} ${metalTop + 60 - metalHeight + 3}H${right}`}
            stroke="#e3e7de"
            strokeWidth="3"
          />
          {oxideHeight > 0 && (
            <rect
              x={left}
              y={metalTop + 60 - metalHeight - oxideHeight}
              width={right - left}
              height={oxideHeight}
              fill="#c9c9b3"
              stroke="#a4aa92"
            />
          )}
          {state.hydrogen > 0 &&
            Array.from({ length: 10 }, (_, i) => (
              <circle
                key={i}
                cx={left + 15 + ((i * 43) % (right - left - 30))}
                cy={105 + ((i * 31) % 65)}
                r={4 + (i % 3)}
                fill="#ecf0e133"
                stroke="#9eb8ba"
                opacity={0.35 + 0.5 * Math.min(1, state.hydrogen)}
              />
            ))}
          {state.oxideConsumed > 0 &&
            state.hydrogen === 0 &&
            Array.from({ length: 5 }, (_, i) => (
              <circle key={i} cx={60 + i * 45} cy={120 + (i % 2) * 20} r="4" fill="#b7bda4" />
            ))}
        </svg>
        <div className="chem-al-film-phase">
          {state.oxideLeft > 1e-9
            ? say('膜仍覆盖 · H₂ = 0', 'Film remains · H₂ = 0')
            : state.hydrogen === 0
              ? say('未生成H₂', 'No H₂ formed')
              : state.metalLeft > 1e-9
                ? say('裸露铝 · 生成H₂', 'Exposed Al · H₂ forms')
                : say('示例铝已反应完', 'Illustrative Al consumed')}
        </div>
      </div>
    );
  };
  return (
    <section className="chem-aluminium-film">
      <div className="chem-al-film-solution">
        {d.species ? 'Al₂O₃' : d.medium === 'acid' ? 'HCl(aq)' : 'NaOH(aq)'}
      </div>
      {d.species ? (
        <div className="chem-al-film-species">
          <div>
            <div className="chem-al-ion acid">Al³⁺</div>
            <span>{say('酸性溶液', 'Acidic solution')}</span>
          </div>
          <div>
            <svg viewBox="0 0 220 220" role="img" aria-label="Al(OH)₄⁻ coordination schematic">
              <circle cx="110" cy="110" r="26" fill="#a7b0ab" />
              {[0, 1, 2, 3].map((i) => {
                const x = 110 + 70 * Math.cos((i * Math.PI) / 2 - 0.5),
                  y = 110 + 70 * Math.sin((i * Math.PI) / 2 - 0.5);
                return (
                  <g key={i}>
                    <path d={`M110 110L${x} ${y}`} stroke="#a6b3a1" strokeWidth="3" />
                    <circle cx={x} cy={y} r="21" fill="#c1d1b9" />
                    <text x={x} y={y + 6} textAnchor="middle" fontSize="24" fill="#50614a">
                      OH
                    </text>
                  </g>
                );
              })}
              <circle cx="110" cy="110" r="26" fill="#a7b0ab" />
              <text x="110" y="117" textAnchor="middle" fontSize="24" fill="#f7f8ee">
                Al
              </text>
              <path
                d="M15 20H5V200H15M205 20h10V200H205"
                fill="none"
                stroke="#8b9e82"
                strokeWidth="2"
              />
              <text x="195" y="18" fontSize="24" fill="#50614a">
                −
              </text>
            </svg>
            <span>[Al(OH)₄]⁻</span>
          </div>
        </div>
      ) : (
        <div className={`chem-al-film-plates ${d.compare ? 'pair' : ''}`}>
          {plate(m, say('有表面氧化膜', 'With an oxide film'))}
          {d.compare && plate(bare, say('已去膜对照', 'Film removed'))}
        </div>
      )}
      <div className="chem-al-film-legend">
        <span>
          <i style={{ background: '#c9c9b3' }} />
          Al₂O₃
        </span>
        <span>
          <i style={{ background: '#a7b0ab' }} />
          Al
        </span>
        {d.species && (
          <span>{say('配位数示意，非空间构型', 'Coordination count, not spatial geometry')}</span>
        )}
      </div>
      {!film.watch && (
        <div className="chem-al-film-controls">
          <Segments
            label={say('溶液', 'Solution')}
            value={medium}
            options={[
              { value: 'acid', label: say('盐酸', 'Hydrochloric acid') },
              { value: 'base', label: say('氢氧化钠', 'Sodium hydroxide') },
            ]}
            onChange={(v) => {
              setMedium(v as AluminiumMedium);
              setReagent(v === 'acid' ? 3.6 : 1.2);
            }}
          />
          <Range
            label={say('反应过程进度', 'Reaction coordinate')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          <Range
            label={say('初始氧化膜示例量', 'Illustrative initial oxide amount')}
            value={oxide}
            min={0}
            max={0.3}
            step={0.01}
            unit="mmol"
            onChange={setOxide}
          />
          <Range
            label={medium === 'acid' ? 'H⁺' : 'OH⁻'}
            value={reagent}
            min={0}
            max={medium === 'acid' ? 5 : 2}
            step={0.1}
            unit="mmol"
            onChange={setReagent}
          />
          <p>
            H₂: {m.hydrogen.toFixed(2)} mmol · {say('溶解的Al', 'Dissolved Al')}:{' '}
            {m.dissolvedAl.toFixed(2)} mmol
          </p>
          <p>
            {say(
              '初始金属铝1 mmol；膜厚夸大，顺序模型不预测等待时间或实际反应速率。',
              'Initially 1 mmol of metallic Al. Film thickness is exaggerated; the sequential model predicts neither induction time nor reaction rate.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
