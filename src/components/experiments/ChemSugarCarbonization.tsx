import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  sugarCarbonization,
  sugarColour,
  carbonColumnOutline,
  SUGAR_GRAINS,
  sugarDirector,
} from '../../models/chem-sugar-carbonization';
import '../../styles/chem-sugar-carbonization.css';
export default function ChemSugarCarbonization() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    id = useId().replace(/:/g, '');
  const [view, setView] = useState('column'),
    [dehydration, setDehydration] = useState(1),
    [oxidized, setOxidized] = useState(0),
    [porosity, setPorosity] = useState(0.8);
  const d = film.watch
    ? sugarDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'ledger' ? 1 : view === 'oxidation' ? 3 : 4,
        progress: 1,
        view,
        dehydration,
        oxidizedFraction: oxidized,
        porosity,
        showGas: false,
        showAcid: false,
      };
  const m = sugarCarbonization(d.dehydration, d.oxidizedFraction, d.porosity),
    height = 50 * m.bulkVolume,
    path = carbonColumnOutline(height),
    colour = sugarColour(d.dehydration),
    pairFocus = Math.min(10, Math.floor(d.progress * 11));
  return (
    <section className="chem-sugar-carbonization">
      <div className="chem-sugar-title">
        {d.view === 'ledger'
          ? say('脱水 · 元素去向', 'Dehydration · atom inventory')
          : d.view === 'oxidation'
            ? say('副反应 · 硫酸也作氧化剂', 'Side reaction · acid as oxidant')
            : d.chapter === 4
              ? say('固定固体量 · 改变孔隙', 'Fixed solid amount · changing pores')
              : say('蔗糖与浓硫酸', 'Sucrose and concentrated sulfuric acid')}
      </div>
      {d.view === 'ledger' ? (
        <div className="chem-sugar-ledger">
          <div className="chem-sugar-formula">C₁₂H₂₂O₁₁</div>
          <div className="chem-sugar-atom-row">
            <span>C</span>
            <div>
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} className="carbon" />
              ))}
            </div>
            <b>12</b>
          </div>
          <div className="chem-sugar-atom-row">
            <span>H</span>
            <div>
              {Array.from({ length: 22 }, (_, i) => (
                <i
                  key={i}
                  className="hydrogen"
                  style={{
                    outline: Math.floor(i / 2) === pairFocus ? '2px solid #b28c5f' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
            <b>22</b>
          </div>
          <div className="chem-sugar-atom-row">
            <span>O</span>
            <div>
              {Array.from({ length: 11 }, (_, i) => (
                <i
                  key={i}
                  className="oxygen"
                  style={{
                    outline: i === pairFocus ? '2px solid #b28c5f' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
            <b>11</b>
          </div>
          <div className="chem-sugar-products">
            <span>12C</span>
            <span>＋</span>
            <span>11H₂O</span>
          </div>
          <div className="chem-sugar-small">
            {say('元素账本 · 非分子结构图', 'Atom inventory · not molecular structure')}
          </div>
        </div>
      ) : d.view === 'oxidation' ? (
        <div className="chem-sugar-oxidation">
          <div className="chem-sugar-oxidation-path">
            <span>C</span>
            <i>→</i>
            <span>CO₂</span>
          </div>
          <div className="chem-sugar-valence">
            <span>0</span>
            <i>−4e⁻</i>
            <span>+4</span>
          </div>
          <div className="chem-sugar-oxidation-path">
            <span>H₂SO₄</span>
            <i>→</i>
            <span>SO₂</span>
          </div>
          <div className="chem-sugar-valence">
            <span>S: +6</span>
            <i>＋2e⁻</i>
            <span>S: +4</span>
          </div>
          <div className="chem-sugar-equation">
            C ＋ 2H₂SO₄ →<br />
            CO₂ ＋ 2SO₂ ＋ 2H₂O
          </div>
        </div>
      ) : (
        <svg
          className="chem-sugar-stage"
          viewBox="0 0 320 280"
          role="img"
          aria-label={say(
            '蔗糖变黑与多孔黑色柱体膨胀的剖示',
            'Cutaway of darkening sucrose and expansion of porous black material',
          )}
        >
          <defs>
            <clipPath id={`${id}-column`}>
              <path d={path} />
            </clipPath>
            <linearGradient id={`${id}-mass`}>
              <stop stopColor={colour} />
              <stop offset=".42" stopColor={colour} />
              <stop offset="1" stopColor={d.dehydration > 0.6 ? '#282c27' : colour} />
            </linearGradient>
            <linearGradient id={`${id}-glass`}>
              <stop stopColor="#d9e1da" stopOpacity=".15" />
              <stop offset=".8" stopColor="#faf9ef" stopOpacity=".02" />
              <stop offset="1" stopColor="#a9b7a4" stopOpacity=".22" />
            </linearGradient>
          </defs>
          <ellipse cx="160" cy="257" rx="76" ry="8" fill="#b1b8a6" opacity=".13" />
          <path
            d="M99 143V245Q99 255 110 255H210Q221 255 221 245V143"
            fill={`url(#${id}-glass)`}
            stroke="#a2ad98"
            strokeWidth="2"
          />
          <path d={path} fill={`url(#${id}-mass)`} />
          <g clipPath={`url(#${id}-column)`}>
            {SUGAR_GRAINS.map((g) => (
              <ellipse
                key={g.id}
                cx={110 + g.x * 100}
                cy={246 - g.y * height}
                rx={d.dehydration > 0.5 ? 1.4 + m.porosity * g.r * 2.3 : g.r}
                ry={d.dehydration > 0.5 ? 1 + m.porosity * g.r * 1.5 : g.r * 0.7}
                fill={d.dehydration > 0.5 ? '#242b25' : '#faf5dd'}
                stroke={d.dehydration > 0.5 ? '#909885' : 'none'}
                strokeWidth={0.7}
                opacity={d.dehydration > 0.5 ? m.porosity * 0.7 : 0.8}
              />
            ))}
          </g>
          <ellipse
            cx="160"
            cy={246 - height + 5}
            rx="46"
            ry="8"
            fill={colour}
            opacity={height > 0 ? 0.65 : 0}
          />
          {d.showGas &&
            [0, 1, 2, 3].map((n) => (
              <path
                key={n}
                d={`M${131 + n * 20} ${Math.max(36, 245 - height)}q-7-10 0-20q7-10 0-20`}
                fill="none"
                stroke="#b1baa8"
                strokeWidth="2"
                opacity=".45"
              />
            ))}
          <path
            d="M99 143V245Q99 255 110 255H210Q221 255 221 245V143M99 143Q160 151 221 143"
            fill="none"
            stroke="#a2ad98"
            strokeWidth="2"
          />
          <path d="M105 153V236" stroke="#fff" opacity=".55" strokeWidth="3" />
          {d.showAcid && (
            <g>
              <path d="M224 65l18 6-20 48-17-6Z" fill="#d9e0d4" stroke="#a6b19d" />
              <path
                d="M209 115L196 191"
                fill="none"
                stroke="#c2c7a3"
                strokeWidth="3"
                opacity=".75"
              />
            </g>
          )}
        </svg>
      )}
      {d.chapter === 4 && d.view === 'column' && (
        <div className="chem-sugar-evidence">
          <span>
            {say('模型孔隙率', 'Model porosity')} {Math.round(m.porosity * 100)}%
          </span>
          <span>V = Vₛ / (1 − φ)</span>
        </div>
      )}
      {!film.watch && (
        <div className="chem-sugar-controls">
          <Segments
            label={say('观察层', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'column', label: say('变黑与膨胀', 'Darkening and expansion') },
              { value: 'ledger', label: say('脱水账本', 'Dehydration inventory') },
              { value: 'oxidation', label: say('氧化副反应', 'Oxidation side path') },
            ]}
          />
          {view === 'column' && (
            <>
              <Range
                label={say('脱水程度', 'Dehydration extent')}
                value={dehydration}
                min={0}
                max={1}
                step={0.01}
                onChange={setDehydration}
              />
              <Range
                label={say('碳相孔隙率（模型）', 'Carbon-phase porosity (model)')}
                value={porosity}
                min={0}
                max={0.88}
                step={0.01}
                onChange={setPorosity}
              />
              <Range
                label={say('碳被继续氧化的比例', 'Fraction of carbon further oxidized')}
                value={oxidized}
                min={0}
                max={0.3}
                step={0.01}
                onChange={setOxidized}
              />
            </>
          )}
          <details>
            <summary>{say('模型范围', 'Model limits')}</summary>
            <p>
              {say(
                '方程式核算选定反应的元素守恒，不代表实测产率。孔隙决定几何体积，未模拟气泡流动、真实密度或反应热；黑色柱体不是纯净碳制品。此处呈现教师演示的机制，不提供家庭配方。',
                'Equations balance selected pathways, not measured yields. Porosity determines geometric volume without simulating bubble flow, true density or reaction heat. The black column is not a pure carbon product. This explains a teacher demonstration, not a home recipe.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
