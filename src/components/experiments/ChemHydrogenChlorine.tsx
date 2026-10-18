import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  hydrogenChlorine,
  hclAtoms,
  hydrogenChlorineFilmShot,
} from '../../models/chem-hydrogen-chlorine';
import '../../styles/chem-hydrogen-chlorine.css';
export default function ChemHydrogenChlorine() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [manualView, setView] = useState<string | null>(null),
    [manualExtent, setExtent] = useState<number | null>(null),
    [manualMoist, setMoist] = useState<boolean | null>(null);
  const authored = hydrogenChlorineFilmShot(film.chapter, film.chapterTime, browserLocale()),
    view = manualView ?? authored.view,
    extent = manualExtent ?? authored.extent,
    moist = manualMoist ?? authored.moist;
  const d = film.watch ? authored : { view, extent, moist, progress: extent },
    m = hydrogenChlorine(d.extent, d.moist),
    a = hclAtoms(d.extent);
  return (
    <section
      className="chem-hydrogen-chlorine"
      data-watch={film.watch}
      data-hcl-view={d.view}
      data-moist={d.moist}
      data-product={m.hydrogenChloride}
    >
      {d.view === 'molecules' ? (
        <div className="chem-hcl-molecules">
          <svg
            viewBox="0 0 400 210"
            role="img"
            aria-label={say(
              '一个氢分子和一个氯分子重组为两个氯化氢分子的计量示意',
              'Stoichiometric rearrangement of one hydrogen and one chlorine molecule into two hydrogen chloride molecules',
            )}
          >
            {[
              [0, 1, 1 - d.extent],
              [2, 3, 1 - d.extent],
              [0, 2, d.extent],
              [1, 3, d.extent],
            ].map(([i, j, opacity], k) => (
              <line
                key={k}
                x1={a[i].x}
                y1={a[i].y}
                x2={a[j].x}
                y2={a[j].y}
                stroke="#8b9b85"
                strokeWidth="5"
                opacity={opacity}
              />
            ))}
            {a.map((atom) => (
              <g key={atom.id} data-atom-id={atom.id}>
                <circle
                  cx={atom.x}
                  cy={atom.y}
                  r={atom.element === 'H' ? 17 : 25}
                  fill={atom.element === 'H' ? '#edf0e4' : '#b4c47c'}
                  stroke="#91a180"
                />
                <text x={atom.x} y={atom.y + 6} textAnchor="middle" fontSize="26" fill="#435b3f">
                  {atom.element}
                </text>
              </g>
            ))}
          </svg>
          <div className="chem-hcl-formula">H₂ + Cl₂ → 2HCl</div>
          <div className="chem-hcl-energy">
            <span>{say('标准反应焓 / 每1 mol H₂', 'Standard reaction enthalpy / 1 mol H₂')}</span>
            <strong>−184.62 kJ</strong>
          </div>
        </div>
      ) : (
        <div className={`chem-hcl-apparatus ${d.view === 'fog' ? 'with-closeup' : ''}`}>
          <figure>
            <svg
              viewBox="0 0 370 360"
              role="img"
              aria-label={say(
                '氢气导管端位于氯气集气瓶中，燃烧产生苍白色火焰',
                'Hydrogen inlet tip inside a chlorine jar with a pale flame',
              )}
            >
              <path
                d="M105 100V124L75 148V319Q75 334 90 334H280Q295 334 295 319V148L265 124V100"
                fill="#c1cc7c22"
                stroke="#91a180"
                strokeWidth="2"
              />
              <path
                d="M78 150H292V319Q292 331 279 331H91Q78 331 78 319Z"
                fill="#c4cd83"
                opacity={0.1 + 0.3 * m.chlorine}
              />
              <ellipse cx="185" cy="100" rx="80" ry="11" fill="none" stroke="#91a180" />
              <path
                d="M20 20H150Q169 20 169 41V220"
                fill="none"
                stroke="#a1b39b"
                strokeWidth="10"
              />
              <path d="M20 20H150Q169 20 169 41V220" fill="none" stroke="#dce4d4" strokeWidth="5" />
              {m.flame && (
                <>
                  <path
                    d={`M169 220Q${140 + 3 * Math.sin(d.progress * 5)} 185 169 155Q196 184 169 220`}
                    fill="#f2eed9"
                    stroke="#ddd9bc"
                    opacity=".9"
                  />
                  <path d="M169 220Q155 200 169 181Q182 201 169 220" fill="#fbf8ed" />
                </>
              )}
              {m.fog &&
                Array.from({ length: 22 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx={108 + ((i * 31) % 170)}
                    cy={75 - ((i * 17 + d.progress * 30) % 56)}
                    rx={9 + (i % 5)}
                    ry={5 + (i % 3)}
                    fill="#f7f7ec"
                    stroke="#d6decaaa"
                    opacity=".7"
                  />
                ))}
              <text x="40" y="53" fontSize="28" fill="#53694b">
                H₂
              </text>
              <text x="230" y="275" fontSize="28" fill="#667f4e">
                {m.chlorine > 0.01 ? 'Cl₂' : 'HCl'}
              </text>
            </svg>
            <figcaption>
              {d.view === 'fog'
                ? m.hydrogenChloride === 0
                  ? say('这份物质尚未生成产物', 'No product in this portion yet')
                  : d.moist
                    ? say('湿空气：出现酸雾', 'Moist air: acid mist')
                    : say('无水对照：气体仍存在', 'Dry air: gas remains')
                : say('苍白色火焰', 'Pale flame')}
            </figcaption>
          </figure>
          {d.view === 'fog' && (
            <div className="chem-hcl-fogdetail">
              <svg
                viewBox="0 0 135 140"
                role="img"
                aria-label={
                  m.hydrogenChloride === 0
                    ? say('尚未生成氯化氢', 'No hydrogen chloride has formed')
                    : d.moist
                      ? say(
                          '白雾来自含酸液滴，不是白色氯化氢分子',
                          'White mist consists of acid-containing droplets, not white hydrogen chloride molecules',
                        )
                      : say(
                          '干燥条件下的氯化氢分子示意',
                          'Hydrogen chloride molecule in dry conditions',
                        )
                }
              >
                {m.hydrogenChloride === 0 ? (
                  <text x="67.5" y="75" textAnchor="middle" fontSize="16" fill="#53684b">
                    {say('尚无HCl', 'No HCl yet')}
                  </text>
                ) : d.moist ? (
                  <>
                    <circle
                      cx="67.5"
                      cy="70"
                      r="60"
                      fill="#d2dfd0"
                      fillOpacity=".4"
                      stroke="#a1b49c"
                    />
                    {[
                      [41, 29],
                      [92, 37],
                      [23, 88],
                      [65, 113],
                      [114, 67],
                    ].map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill="#d0dace" />
                        <circle cx={x - 5} cy={y + 4} r="3" fill="#f7f8ef" stroke="#b1bdab" />
                        <circle cx={x + 5} cy={y + 4} r="3" fill="#f7f8ef" stroke="#b1bdab" />
                      </g>
                    ))}
                    <circle cx="45" cy="62" r="22" fill="#eef1e6" stroke="#b2c5b0" />
                    <circle cx="91" cy="87" r="18" fill="#b5c582" stroke="#9faf77" />
                    <text x="45" y="68" textAnchor="middle" fontSize="16" fill="#53684b">
                      H₃O⁺
                    </text>
                    <text x="91" y="93" textAnchor="middle" fontSize="17" fill="#465c3d">
                      Cl⁻
                    </text>
                  </>
                ) : (
                  <>
                    <path d="M45 70H90" stroke="#8b9b85" strokeWidth="4" />
                    <circle cx="45" cy="70" r="15" fill="#edf0e4" stroke="#91a180" />
                    <circle cx="90" cy="70" r="22" fill="#b4c47c" stroke="#91a180" />
                    <text x="45" y="76" textAnchor="middle" fontSize="17" fill="#435b3f">
                      H
                    </text>
                    <text x="90" y="76" textAnchor="middle" fontSize="17" fill="#435b3f">
                      Cl
                    </text>
                  </>
                )}
              </svg>
              <p>
                {m.hydrogenChloride === 0
                  ? say(
                      '反应进度为零，尚无产物或酸雾。',
                      'Zero conversion: no product or acid mist.',
                    )
                  : d.moist
                    ? say('含水合离子的酸雾液滴', 'Acid droplets containing hydrated ions')
                    : say('无水条件：产物气体仍存在', 'Dry conditions: product gas still exists')}
              </p>
            </div>
          )}
        </div>
      )}
      {!film.watch && (
        <div className="chem-hcl-controls">
          <Segments
            label={say('观察层次', 'View')}
            value={view}
            options={[
              { value: 'flame', label: say('火焰', 'Flame') },
              { value: 'fog', label: say('白雾', 'Mist') },
              { value: 'molecules', label: say('反应计量', 'Stoichiometry') },
            ]}
            onChange={setView}
          />
          <Range
            label={say('所跟踪份额的反应完成比例', 'Conversion of the tracked portion')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          {view === 'fog' && (
            <Segments
              label={say('产物周围环境', 'Product surroundings')}
              value={moist ? 'moist' : 'dry'}
              options={[
                { value: 'moist', label: say('湿空气', 'Moist air') },
                { value: 'dry', label: say('理想无水', 'Ideal dry') },
              ]}
              onChange={(v) => setMoist(v === 'moist')}
            />
          )}
          <p>
            {say(
              '分子重组、火焰和液滴均为教学示意；不模拟气相链反应、雾滴成核或火焰温度。',
              'Molecular rearrangement, flame and droplets are teaching diagrams; gas-phase chain kinetics, aerosol nucleation and flame temperature are not simulated.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
