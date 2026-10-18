import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ammoniumLiberation,
  litmusEvidence,
  solidAmmoniaPreparation,
  ammoniaCollection,
  ammoniaAbsorber,
  ammoniumDirector,
  type AmmoniumSalt,
} from '../../models/chem-ammonium-cycle';
import '../../styles/chem-ammonium-cycle.css';
export default function ChemAmmoniumCycle() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(
      film.variant === 'ammonia-preparation' ? 'collection' : 'three-tests',
    ),
    [extent, setExtent] = useState(0.7),
    [release, setRelease] = useState(0.8),
    [base, setBase] = useState(2),
    [moist, setMoist] = useState(true),
    [touch, setTouch] = useState(false),
    [q, setQ] = useState(1.4),
    [demand, setDemand] = useState(20),
    [shallow, setShallow] = useState(true);
  const d = film.watch
    ? ammoniumDirector(film.chapter, film.chapterProgress)
    : {
        chapter: 0,
        progress: extent,
        view,
        extent,
        release,
        collection: q,
        wet: moist,
        alkaliContact: touch,
        demand,
      };
  const salts: AmmoniumSalt[] = ['chloride', 'nitrate', 'sulfate'],
    formula = ['NH₄Cl', 'NH₄NO₃', '(NH₄)₂SO₄'];
  const collection = ammoniaCollection(d.collection),
    gen = solidAmmoniaPreparation(2, 1, d.collection / 2),
    abs = ammoniaAbsorber(d.demand, film.watch || shallow),
    waterY = 200 - abs.rimDepth * 2800 + abs.reservoirDrop * 2800,
    insideY = 200 - abs.waterHeight * 2800;
  const title =
    d.view === 'three-tests'
      ? say('三种铵盐，同一个检验', 'Three ammonium salts, one test')
      : d.view === 'litmus-conditions'
        ? say('试纸蓝色来自哪里', 'What made the paper blue?')
        : d.view === 'absorber'
          ? say('吸收路径 · 漏斗口的空气间隙', 'Absorption path · air at the funnel rim')
          : say('生成氨，排出空气', 'Form ammonia and displace air');
  return (
    <section className="chem-ammonium-cycle">
      <div className="chem-ammonium-heading">{title}</div>
      {d.view === 'three-tests' ? (
        <>
          <svg
            className="chem-ammonium-tests"
            viewBox="0 0 320 245"
            role="img"
            aria-label={say(
              '三个铵盐试管加碱后释放氨，以湿润红色石蕊试纸检验',
              'Three ammonium-salt tubes release ammonia after base addition; moist red litmus tests the gas',
            )}
          >
            {salts.map((salt, i) => {
              const s = ammoniumLiberation(salt, film.watch ? 2 : base, d.extent, d.release),
                x = 61 + i * 99,
                ev = litmusEvidence(s.ammoniaGas, film.watch || moist, film.watch ? false : touch);
              return (
                <g key={salt}>
                  <path
                    d={`M${x - 23} 69V183Q${x - 23} 205 ${x} 205Q${x + 23} 205 ${x + 23} 183V69`}
                    fill="#eff3e633"
                    stroke="#9eae90"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 19} 145H${x + 19}V182Q${x + 19} 201 ${x} 201Q${x - 19} 201 ${x - 19} 182Z`}
                    fill="#c8d7c0"
                    opacity=".55"
                  />
                  {Array.from({ length: 6 }, (_, k) =>
                    s.ammoniaGas > k * 0.06 ? (
                      <circle
                        key={k}
                        cx={x + 6 * Math.sin(k * 2)}
                        cy={137 - k * 12}
                        r="2.5"
                        fill="none"
                        stroke="#a5b394"
                      />
                    ) : null,
                  )}
                  <rect
                    x={x - 21}
                    y="43"
                    width="42"
                    height="11"
                    rx="2"
                    fill={ev.blue ? '#9cacc6' : '#c29d9c'}
                  />
                  <path
                    d={`M${x + 8} 40L${x + 25} 24M${x + 15} 42L${x + 29} 29`}
                    stroke="#9aa68d"
                    fill="none"
                    strokeWidth="2"
                  />
                  {d.extent > 0 && (
                    <g>
                      <rect x={x - 12} y="234" width="24" height="9" rx="3" fill="#bbc5ab" />
                      <path
                        d={`M${x - 10} 234Q${x - 17} 219 ${x} 209Q${x - 3} 218 ${x + 8} 222Q${x + 16} 231 ${x - 10} 234`}
                        fill="#d6bb86"
                        opacity=".8"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="chem-ammonium-saltlabels">
            {formula.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <div className="chem-ammonium-equation">NH₄⁺ ＋ OH⁻ → NH₃ ＋ H₂O</div>
        </>
      ) : d.view === 'litmus-conditions' ? (
        <div className="chem-ammonium-papers">
          {[
            {
              zh: '湿润试纸，只接触气体',
              en: 'Damp paper, gas contact',
              gas: 1,
              wet: true,
              touch: false,
            },
            {
              zh: '干燥试纸，未形成水相',
              en: 'Dry paper, no aqueous layer',
              gas: 1,
              wet: false,
              touch: false,
            },
            {
              zh: '沾到碱液，证据不成立',
              en: 'Alkali contact: inconclusive',
              gas: 0,
              wet: true,
              touch: true,
            },
          ].map((v, i) => {
            const e = litmusEvidence(v.gas, v.wet, v.touch);
            return (
              <div className="chem-ammonium-paper" key={i}>
                <span
                  className="chem-ammonium-strip"
                  style={{ background: e.blue ? '#9cacc6' : '#c29d9c' }}
                />
                <span>{say(v.zh, v.en)}</span>
              </div>
            );
          })}
        </div>
      ) : d.view === 'absorber' ? (
        <>
          <svg
            className="chem-ammonium-absorber"
            viewBox="0 0 320 280"
            role="img"
            aria-label={say(
              '倒置漏斗与水槽的几何示意；水位下降后浅浸的漏斗口出现空气间隙',
              'Geometric model of an inverted funnel; reservoir lowering exposes air at a shallow rim',
            )}
          >
            <path
              d="M31 30H160V116L230 200M160 116L90 200"
              fill="none"
              stroke="#9faf92"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M31 30H160V116" stroke="#edf2e7" strokeWidth="2" fill="none" />
            <path
              d={`M${90 + ((200 - insideY) * 70) / 84} ${insideY}H${230 - ((200 - insideY) * 70) / 84}L230 200H90Z`}
              fill="#adc9c3"
              opacity=".65"
            />
            <path
              d="M21 179V257Q21 270 35 270H285Q299 270 299 257V179"
              stroke="#a4b296"
              fill="#eff2e633"
              strokeWidth="2"
            />
            <path
              d={`M25 ${waterY}H295V256Q295 266 284 266H36Q25 266 25 256Z`}
              fill="#bcd4cb"
              opacity=".5"
            />
            {abs.airAdmitted && (
              <>
                <path
                  d="M59 184Q74 179 94 191l-9-1m9 1l-4-7M261 184Q246 179 226 191l9-1m-9 1l4-7"
                  stroke="#9aa987"
                  strokeWidth="2"
                  fill="none"
                />
                <text x="237" y="91" textAnchor="middle" fontSize="23" fill="#718367">
                  {say('空气进入', 'Air enters')}
                </text>
              </>
            )}
            {abs.stemReached && <path d="M160 116V52" stroke="#9ebeb8" strokeWidth="3" />}
            <text x="45" y="60" fontSize="22" fill="#718367">
              NH₃
            </text>
          </svg>
          <div className="chem-ammonium-note">
            {say('模型几何 · 吸收处理的讨论示意', 'Geometric model · absorption discussion')}
          </div>
        </>
      ) : (
        <>
          <svg
            className="chem-ammonium-preparation"
            viewBox="0 0 320 280"
            role="img"
            aria-label={say(
              '略向下倾的发生试管经导管通向倒置收集管，氨进入上部并向下排出空气',
              'A slightly downward-sloping generating tube feeds an inverted collection tube; ammonia enters high and air leaves below',
            )}
          >
            <path
              d="M136 267V114M121 266H158M136 180H120"
              fill="none"
              stroke="#a8b59c"
              strokeWidth="3"
            />
            <g transform="translate(35 165) rotate(8)">
              <path
                d="M0-16H135V16H0Q-16 16-16 0Q-16-16 0-16Z"
                fill="#eef2e533"
                stroke="#9eae92"
                strokeWidth="2"
              />
              {Array.from({ length: 24 }, (_, i) =>
                i < (gen.ammoniumChloride + gen.calciumHydroxide + gen.calciumChloride) * 8 ? (
                  <circle
                    key={i}
                    cx={1 + ((i * 13) % 60)}
                    cy={3 + ((i * 7) % 10)}
                    r={2 + (i % 2)}
                    fill="#c8c5ac"
                  />
                ) : null,
              )}
              <path d="M130-19H142V19H130Z" fill="#bba98d" stroke="#a3947c" />
            </g>
            <ellipse
              cx="133"
              cy="179"
              rx="5"
              ry="22"
              transform="rotate(8 133 179)"
              fill="none"
              stroke="#a8b59c"
              strokeWidth="2.5"
            />
            <path
              d="M174 185L184 190H222V80"
              stroke="#a5b49a"
              strokeWidth="5"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M174 185L184 190H222V80"
              stroke="#edf1e5"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M202 232V78Q202 50 224 50Q246 50 246 78V232"
              fill="#edf2e633"
              stroke="#a0b091"
              strokeWidth="2"
            />
            {Array.from(collection.cells, (v, i) => (
              <g key={i}>
                <circle
                  cx={211 + (i % 3) * 9}
                  cy={68 + i * 7.4}
                  r="2.5"
                  fill="none"
                  stroke="#9caf8c"
                  opacity={v * 0.9}
                />
                <circle
                  cx={239 - (i % 2) * 8}
                  cy={71 + i * 7.4}
                  r="2"
                  fill="#c9bea0"
                  opacity={(1 - v) * 0.7}
                />
              </g>
            ))}
            <path
              d="M203 225Q211 218 217 225Q224 216 230 224Q239 217 245 226"
              fill="none"
              stroke="#e5e4d3"
              strokeWidth="6"
            />
            {d.collection > 0 && (
              <>
                <path
                  d="M222 148V119l-4 7m4-7l4 7M239 236V254l-4-7m4 7l4-7"
                  stroke="#9cad8d"
                  strokeWidth="1.8"
                  fill="none"
                />
              </>
            )}
            <path d="M45 253H72V238H45Z" fill="#bdc4a9" />
            <path
              d="M51 237Q41 220 59 197Q54 216 65 221Q75 236 51 237"
              fill="#d5ba84"
              opacity={gen.ammonia > 0 ? 0.85 : 0.2}
            />
            {d.chapter === 5 || !film.watch ? (
              <rect
                x="255"
                y="230"
                width="36"
                height="10"
                rx="2"
                fill={litmusEvidence(collection.mouthFraction).blue ? '#9cacc6' : '#c29d9c'}
              />
            ) : null}
            {d.view === 'generator' ? (
              <text x="75" y="132" textAnchor="middle" fontSize="22" fill="#75876a">
                NH₄Cl
              </text>
            ) : (
              <text x="224" y="35" textAnchor="middle" fontSize="23" fill="#75876a">
                NH₃
              </text>
            )}
          </svg>
          <div className="chem-ammonium-preparation-labels">
            <span>
              {d.chapter === 5
                ? say(
                    `模型余留空气 ${(collection.airRemaining * 100).toFixed(0)}%`,
                    `Model air remaining ${(collection.airRemaining * 100).toFixed(0)}%`,
                  )
                : 'NH₄Cl + Ca(OH)₂'}
            </span>
            <span>
              {d.chapter === 5
                ? say('管口检验 ≠ 纯度读数', 'Mouth test ≠ purity reading')
                : say('向下排空气', 'Air exits downward')}
            </span>
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-ammonium-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'three-tests', label: say('铵根检验', 'Ammonium test') },
              { value: 'litmus-conditions', label: say('试纸条件', 'Paper conditions') },
              { value: 'collection', label: say('制取收集', 'Preparation') },
              { value: 'absorber', label: say('吸收讨论', 'Absorption') },
            ]}
          />
          {view === 'three-tests' ? (
            <>
              <Range
                label={say('反应程度', 'Reaction extent')}
                value={extent}
                min={0}
                max={1}
                step={0.01}
                onChange={setExtent}
              />
              <Range
                label={say('已生成氨的逸出份额', 'Fraction of formed ammonia released')}
                value={release}
                min={0}
                max={1}
                step={0.01}
                onChange={setRelease}
              />
              <Range
                label={say('OH⁻相对份数', 'Relative OH⁻ amount')}
                value={base}
                min={0}
                max={3}
                step={0.1}
                onChange={setBase}
              />
              <Segments
                label={say('试纸', 'Paper')}
                value={moist ? 'wet' : 'dry'}
                onChange={(v) => setMoist(v === 'wet')}
                options={[
                  { value: 'wet', label: say('湿润', 'Damp') },
                  { value: 'dry', label: say('干燥', 'Dry') },
                ]}
              />
              <Segments
                label={say('试纸接触', 'Paper contact')}
                value={touch ? 'liquid' : 'gas'}
                onChange={(v) => setTouch(v === 'liquid')}
                options={[
                  { value: 'gas', label: say('仅气体', 'Gas only') },
                  { value: 'liquid', label: say('沾到碱液', 'Alkali liquid') },
                ]}
              />
            </>
          ) : view === 'collection' ? (
            <Range
              label={say('已送入气体 /相对容积', 'Gas introduced /relative vessel volumes')}
              value={q}
              min={0}
              max={2}
              step={0.02}
              onChange={setQ}
            />
          ) : view === 'absorber' ? (
            <>
              <Range
                label={say('压差要求吸入的水量 /模型mL', 'Requested water uptake /model mL')}
                value={demand}
                min={0}
                max={30}
                step={0.5}
                onChange={setDemand}
              />
              <Segments
                label={say('漏斗口', 'Funnel rim')}
                value={shallow ? 'shallow' : 'deep'}
                onChange={(v) => setShallow(v === 'shallow')}
                options={[
                  { value: 'shallow', label: say('浅浸', 'Shallow') },
                  { value: 'deep', label: say('较深', 'Deeper') },
                ]}
              />
            </>
          ) : null}
          <details>
            <summary>{say('模型限定', 'Model limits')}</summary>
            <p>
              {say(
                '反应份数与氨逸出份额分开；加热有利于逸出，不表示常温加入强碱绝无反应。收集管使用一维有限体积混合示意，湿润试纸是定性气体证据，不给出纯度。漏斗对照只用几何体积说明空气间隙，未预测瞬态流体或给出操作配方。',
                'Reaction amount and gas release are separate: warming helps release but cold strong base can still react. Collection uses one-dimensional finite-volume mixing. Damp paper is qualitative gas evidence, not a purity measurement. The funnel comparison illustrates an air gap geometrically without predicting transient fluids or prescribing a procedure.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
