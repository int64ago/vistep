import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  bariumSulfate,
  magnesiumAcid,
  silverExchange,
  magnesiumIron,
  precipitationDirector,
  type PrecipitationMode,
} from '../../models/chem-precipitation-paths';
import '../../styles/chem-precipitation-paths.css';
export default function ChemPrecipitationPaths() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState<PrecipitationMode>(
      (['barium', 'acid', 'silver', 'iron'] as string[]).includes(film.variant || '')
        ? (film.variant as PrecipitationMode)
        : 'barium',
    ),
    [dose, setDose] = useState(1),
    [acid, setAcid] = useState(0.015),
    [iodide, setIodide] = useState(1),
    [sulfide, setSulfide] = useState(0),
    [iron, setIron] = useState(0.4),
    [freeOH, setFreeOH] = useState(0);
  const d = film.watch
      ? precipitationDirector(film.chapter, film.chapterProgress)
      : {
          mode,
          dose,
          acid,
          iodide,
          sulfide,
          iron,
          freeOH,
          spectators: true,
          silverAmount: 1,
          magnesiumAmount: 1,
        },
    ba = bariumSulfate(d.dose),
    mg = magnesiumAcid(d.acid),
    ag = silverExchange(d.iodide, d.sulfide, d.silverAmount),
    fe = magnesiumIron(d.iron, d.freeOH, d.magnesiumAmount);
  const barium = d.mode === 'barium',
    acidMode = d.mode === 'acid',
    silver = d.mode === 'silver';
  const solids = barium
    ? [{ amount: ba.precipitate, color: '#eee9d3', name: 'BaSO₄' }]
    : acidMode
      ? [{ amount: mg.solid / 0.01, color: '#e9eadb', name: 'Mg(OH)₂' }]
      : silver
        ? [
            { amount: ag.agCl, color: '#efead6', name: 'AgCl' },
            { amount: ag.agI, color: '#dece7c', name: 'AgI' },
            { amount: ag.ag2S * 2, color: '#4e655c', name: 'Ag₂S' },
          ]
        : [
            { amount: fe.magnesiumHydroxide, color: '#e8e9d8', name: 'Mg(OH)₂' },
            { amount: fe.ironHydroxide * 1.5, color: '#ae7556', name: 'Fe(OH)₃' },
          ];
  const formula = barium
    ? 'Ba²⁺ + SO₄²⁻ → BaSO₄↓'
    : acidMode
      ? d.acid > 0
        ? 'Mg(OH)₂ + 2H⁺ → Mg²⁺ + 2H₂O'
        : 'Mg(OH)₂ ⇌ Mg²⁺ + 2OH⁻'
      : silver
        ? d.sulfide > 0
          ? '2AgI + S²⁻ → Ag₂S↓ + 2I⁻'
          : d.iodide > 0
            ? 'AgCl + I⁻ → AgI↓ + Cl⁻'
            : 'Ag⁺ + Cl⁻ → AgCl↓'
        : d.iron > 0
          ? '3Mg(OH)₂ + 2Fe³⁺ → 2Fe(OH)₃↓ + 3Mg²⁺'
          : 'Mg²⁺ + 2OH⁻ → Mg(OH)₂↓';
  const reagent = barium
    ? 'BaCl₂'
    : acidMode
      ? d.acid
        ? 'HCl'
        : 'H₂O'
      : silver
        ? d.sulfide > 0
          ? 'Na₂S'
          : d.iodide > 0
            ? 'KI'
            : 'AgNO₃'
        : d.iron
          ? 'FeCl₃'
          : 'NaOH';
  const particleColour = barium ? '#819f8b' : acidMode ? '#bda17b' : silver ? '#829f8e' : '#b77f5d';
  const tube = (control = false) => (
    <svg
      viewBox="78 12 132 286"
      role="img"
      aria-label={say(
        control ? '同一沉淀加蒸馏水的对照' : '试管内沉淀组成随试剂改变',
        control
          ? 'Water control with the same precipitate'
          : 'Precipitate composition changes with added reagent',
      )}
    >
      <defs>
        <clipPath id={`${id}-${control ? 'control' : 'sample'}`}>
          <path d="M91 69V240A53 53 0 0 0 197 240V69Z" />
        </clipPath>
      </defs>
      <path
        d="M89 68V240A55 55 0 0 0 199 240V68"
        fill="#b8d0ba22"
        stroke="#9cb49e"
        strokeWidth="2"
      />
      <ellipse cx="144" cy="68" rx="55" ry="9" fill="none" stroke="#9cb49e" />
      <path d="M91 151V240A53 53 0 0 0 197 240V151Z" fill="#b1cdbb" opacity=".2" />
      <ellipse cx="144" cy="151" rx="53" ry="9" fill="#b1cdbb" opacity=".15" />
      <g clipPath={`url(#${id}-${control ? 'control' : 'sample'})`}>
        {(control
          ? [{ amount: magnesiumAcid(0).solid / 0.01, color: '#e9eadb', name: 'Mg(OH)₂' }]
          : solids
        ).map((solid, j) =>
          Array.from(
            { length: 24 },
            (_, i) =>
              i / 24 < solid.amount && (
                <ellipse
                  key={`${j}-${i}`}
                  cx={104 + (i % 6) * 15 + j * 2}
                  cy={260 + Math.floor(i / 6) * 6 - j * 6}
                  rx={7}
                  ry={4}
                  fill={solid.color}
                  stroke="#a0ad9255"
                />
              ),
          ),
        )}
        {Array.from({ length: 12 }, (_, i) => (
          <circle
            key={i}
            cx={105 + ((i * 31) % 79)}
            cy={177 + ((i * 37) % 65)}
            r={barium ? 3 : 2.5}
            fill={particleColour}
            opacity={
              control ? 0.15 : barium ? 0.45 : acidMode ? 0.15 + (mg.dissolved / 0.01) * 0.6 : 0.35
            }
          />
        ))}
      </g>
      {!control && (
        <>
          <path d="M135 19V42Q144 61 153 42V19" fill="#c6d7c344" stroke="#9fb49e" />
          <circle cx="144" cy="91" r="4" fill="#a2c2b2" />
        </>
      )}
    </svg>
  );
  return (
    <section
      className="chem-precipitation-paths"
      data-watch={film.watch}
      data-spectators={barium && d.spectators}
    >
      <header>
        <p>
          {say(
            barium
              ? '形成沉淀后，哪些离子还在水里？'
              : acidMode
                ? '移去一种离子，沉淀就能继续溶解'
                : silver
                  ? '白色、黄色、黑色：同一份银的去向'
                  : '褐色出现，需要分清氢氧根来自哪里',
            barium
              ? 'Which ions remain after precipitation?'
              : acidMode
                ? 'Removing one ion can drive more solid to dissolve'
                : silver
                  ? 'White, yellow, black: follow the same silver'
                  : 'Where did the hydroxide for the brown solid come from?',
          )}
        </p>
        <span>{reagent}</span>
      </header>
      <div className={`chem-precip-vessels ${acidMode ? 'has-control' : ''}`}>
        <figure>
          {tube()}
          <figcaption>
            {acidMode
              ? d.acid
                ? say('加入酸', 'Acid added')
                : say('加酸前', 'Before acid')
              : reagent}
          </figcaption>
        </figure>
        {acidMode && (
          <figure>
            {tube(true)}
            <figcaption>{say('蒸馏水对照', 'Distilled-water control')}</figcaption>
          </figure>
        )}
        {barium && d.spectators && (
          <div className="chem-precip-ionledger">
            <span>{say('仍在溶液中', 'Still dissolved')}</span>
            <div>
              <b>Na⁺</b>
              <i style={{ width: `${(ba.sodium / 4) * 100}%` }} />
              <strong>{ba.sodium.toFixed(2)} mmol</strong>
            </div>
            <div>
              <b>Cl⁻</b>
              <i style={{ width: `${(ba.chloride / 4) * 100}%` }} />
              <strong>{ba.chloride.toFixed(2)} mmol</strong>
            </div>
            <p>
              {say(
                'Na⁺与Cl⁻不写入净离子方程式。',
                'Na⁺ and Cl⁻ are absent from the net ionic equation.',
              )}
            </p>
          </div>
        )}
      </div>
      <p className="chem-precip-formula">{formula}</p>
      {silver && (
        <div className="chem-precip-solid-track">
          {solids.map((s) => (
            <span key={s.name}>
              <i style={{ background: s.color, width: `${s.amount * 80}px` }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      {!barium && !acidMode && !silver && !film.watch && (
        <div className="chem-precip-fe">
          <span>
            {say('来自游离OH⁻', 'From free OH⁻')} {fe.direct.toFixed(2)} mmol
          </span>
          <span>
            {say('涉及Mg(OH)₂的转化', 'From Mg(OH)₂ conversion')} {fe.exchange.toFixed(2)} mmol
          </span>
        </div>
      )}
      {!film.watch && (
        <div className="chem-precip-controls">
          <Segments
            label={say('研究过程', 'Process')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'barium', label: say('生成沉淀', 'Formation') },
              { value: 'acid', label: say('酸使沉淀溶解', 'Acid dissolution') },
              { value: 'silver', label: say('银盐转化', 'Silver exchange') },
              { value: 'iron', label: say('氢氧化物转化', 'Hydroxide exchange') },
            ]}
          />
          {barium ? (
            <Range
              label={say('BaCl₂加入量', 'Added BaCl₂')}
              value={dose}
              min={0}
              max={2}
              step={0.05}
              unit="mmol"
              onChange={setDose}
            />
          ) : acidMode ? (
            <Range
              label={say('模型加入的酸浓度', 'Model added acid concentration')}
              value={acid}
              min={0}
              max={0.04}
              step={0.001}
              unit="mol/L"
              onChange={setAcid}
            />
          ) : silver ? (
            <>
              <Range
                label={say('加入I⁻', 'Added I⁻')}
                value={iodide}
                min={0}
                max={1}
                step={0.05}
                unit="mmol"
                onChange={setIodide}
              />
              <Range
                label={say('随后加入S²⁻', 'Subsequent S²⁻')}
                value={sulfide}
                min={0}
                max={0.5}
                step={0.025}
                unit="mmol"
                onChange={setSulfide}
              />
            </>
          ) : (
            <>
              <Range
                label={say('加入Fe³⁺', 'Added Fe³⁺')}
                value={iron}
                min={0}
                max={0.66}
                step={0.02}
                unit="mmol"
                onChange={setIron}
              />
              <Range
                label={say('原先游离OH⁻', 'Initial free OH⁻')}
                value={freeOH}
                min={0}
                max={2}
                step={0.1}
                unit="mmol"
                onChange={setFreeOH}
              />
            </>
          )}
        </div>
      )}
      <details>
        <summary>{say('平衡与计量的边界', 'Equilibrium and model limits')}</summary>
        <p>
          {say(
            'BaSO₄与Mg(OH)₂用25°C浓度近似平衡求解，难溶不等于离子完全归零。银盐转化按教材顺序采用近乎完全反应的计量近似，硫化银式量含两个银。氢氧化铁模型区分游离OH⁻直接沉淀与消耗Mg(OH)₂的路径；只看颜色不能证明全部来自沉淀转化。体积、用量为机制模型，不是教材滴数的精确换算。',
            'BaSO₄ and Mg(OH)₂ use ideal concentration equilibria at 25°C; sparing solubility does not mean zero ions. Silver exchange uses a near-complete stoichiometric approximation in textbook reagent order, with two silver atoms per Ag₂S. The iron model separates precipitation by free OH⁻ from Mg(OH)₂ conversion; colour alone cannot distinguish their contributions. Model amounts are not precise conversions of textbook drop counts.',
          )}
        </p>
      </details>
    </section>
  );
}
