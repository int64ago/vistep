import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  halogenDisplacement,
  HALOGEN_COLOURS,
  magnesiumWater,
  periodHydroxide,
  periodicDirector,
  type Halogen,
  type TestMedium,
} from '../../models/chem-periodic-practical';
import '../../styles/chem-periodic-practical.css';
export default function ChemPeriodicPractical() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    periodComparison = film.variant === 'period-comparison';
  const [mode, setMode] = useState(periodComparison ? 'magnesium' : 'halogen'),
    [oxidant, setOxidant] = useState<Halogen>('Cl'),
    [halide, setHalide] = useState<Halogen>('Br'),
    [progress, setProgress] = useState(1),
    [hot, setHot] = useState(!periodComparison),
    [medium, setMedium] = useState<TestMedium>('base'),
    [amount, setAmount] = useState(1),
    [available, setAvailable] = useState(0.5),
    [plate, setPlate] = useState(film.variant === 'chapter-practical');
  const d = film.watch
    ? periodicDirector(film.chapter, film.chapterProgress)
    : { mode, oxidant, halide, progress, hot, medium, amount, prepared: 1, available, chapter: 0 };
  const usePlate = film.watch ? film.variant === 'chapter-practical' : plate;
  const h = halogenDisplacement(d.oxidant, d.halide, d.progress, d.available),
    mg = magnesiumWater(d.hot, d.progress),
    al = periodHydroxide('Al', d.medium, d.amount, d.prepared),
    mh = periodHydroxide('Mg', d.medium, d.amount, d.prepared);
  const halogenSample = (reference: boolean, other?: Halogen, otherProgress?: number) => {
    const pending = otherProgress === -1,
      species = other ?? d.halide,
      hh = halogenDisplacement(
        d.oxidant,
        species,
        otherProgress ?? d.progress,
        pending ? 0 : d.available,
      );
    const a = reference ? d.available : hh.oxidantLeft,
      b = reference ? 0 : hh.product;
    return (
      <div className="chem-periodic-sample">
        <div className="chem-periodic-object-label">
          {reference
            ? `${d.oxidant}₂ ${say('参照', 'reference')}`
            : pending
              ? `Na${species}`
              : `${usePlate ? 'Na' : 'K'}${species} + ${d.oxidant}₂`}
        </div>
        <svg
          viewBox={usePlate ? '0 0 200 180' : '0 0 160 250'}
          role="img"
          aria-label={reference ? 'Original halogen reference' : 'Halogen displacement sample'}
        >
          {usePlate ? (
            <>
              <rect x="10" y="10" width="180" height="160" rx="24" fill="#e5e8dc" />
              <ellipse cx="100" cy="90" rx="65" ry="57" fill="#d1d8c8" stroke="#b2c0a7" />
              <ellipse
                cx="100"
                cy="90"
                rx="56"
                ry="48"
                fill={HALOGEN_COLOURS[d.oxidant]}
                opacity={a * 1.5}
              />
              <ellipse
                cx="100"
                cy="90"
                rx="56"
                ry="48"
                fill={HALOGEN_COLOURS[species]}
                opacity={b * 1.6}
              />
              <path
                d="M57 73q10-24 38-26"
                stroke="#fafcf2"
                fill="none"
                strokeWidth="5"
                opacity=".65"
              />
            </>
          ) : (
            <>
              <path
                d="M42 20V190a38 38 0 0 0 76 0V20"
                fill="#cbd8c822"
                stroke="#93a28c"
                strokeWidth="2"
              />
              <path
                d="M45 90H115V190a35 35 0 0 1-70 0Z"
                fill={HALOGEN_COLOURS[d.oxidant]}
                opacity={a * 1.5}
              />
              <path
                d="M45 90H115V190a35 35 0 0 1-70 0Z"
                fill={HALOGEN_COLOURS[species]}
                opacity={b * 1.6}
              />
              <path
                d="M50 38V185q0 26 20 31"
                fill="none"
                stroke="white"
                strokeWidth="4"
                opacity=".5"
              />
            </>
          )}
        </svg>
        <div className="chem-periodic-observed">
          {reference
            ? `${d.oxidant}₂(aq)`
            : pending
              ? say('待比较样品', 'Next sample')
              : hh.product > 0
                ? `${species}₂ ${say('生成', 'formed')}`
                : say('尚无置换产物', 'No displacement product')}
        </div>
      </div>
    );
  };
  const precipitate = (state: typeof al) => (
    <div className="chem-periodic-sample">
      <div className="chem-periodic-object-label">
        {state.metal === 'Al' ? 'Al(OH)₃' : 'Mg(OH)₂'}
      </div>
      <svg
        viewBox="0 0 160 240"
        role="img"
        aria-label={`${state.metal} hydroxide with ${state.medium}`}
      >
        <path
          d="M42 20V185a38 38 0 0 0 76 0V20"
          fill="#cbd8c822"
          stroke="#93a28c"
          strokeWidth="2"
        />
        <path d="M45 90H115V185a35 35 0 0 1-70 0Z" fill="#d8e1d1" opacity=".4" />
        {Array.from({ length: 28 }, (_, i) => (
          <ellipse
            key={i}
            cx={54 + ((i * 13) % 52)}
            cy={145 + ((i * 17) % 52)}
            rx="6"
            ry="4"
            fill="#f3f1df"
            stroke="#bac3a9"
            strokeWidth=".5"
            opacity={i / 28 < state.solid ? 0.85 : 0}
          />
        ))}
        {state.dissolved > 0 &&
          Array.from({ length: 10 }, (_, i) => (
            <circle
              key={i}
              cx={55 + ((i * 17) % 50)}
              cy={100 + ((i * 13) % 85)}
              r="2.5"
              fill="#a7b49a"
              opacity={state.dissolved * 0.8}
            />
          ))}
        <path d="M50 35V180q0 26 20 31" fill="none" stroke="white" strokeWidth="4" opacity=".5" />
      </svg>
      <div className="chem-periodic-observed">
        {state.solid < 1e-6
          ? state.product
          : state.solid < 0.999
            ? say('沉淀减少', 'Less precipitate')
            : say('白色沉淀', 'White precipitate')}
      </div>
    </div>
  );
  return (
    <section className="chem-periodic-practical">
      {d.mode === 'halogen' ? (
        <>
          <div className={`chem-periodic-pair ${usePlate ? 'plate' : ''}`}>
            {usePlate && film.watch && d.chapter < 2 ? (
              <>
                {halogenSample(false, 'Br', d.chapter === 0 ? d.progress : 1)}
                {halogenSample(false, 'I', d.chapter === 0 ? -1 : d.progress)}
                {halogenSample(true)}
              </>
            ) : (
              <>
                {halogenSample(false)}
                {halogenSample(true)}
              </>
            )}
          </div>
          <div className="chem-periodic-equation">
            {h.product > 0
              ? `${d.oxidant}₂ + 2${d.halide}⁻ → 2${d.oxidant}⁻ + ${d.halide}₂`
              : say('先与加入的卤素水比较', 'Compare with the halogen water added')}
          </div>
        </>
      ) : d.mode === 'magnesium' ? (
        <>
          <div className="chem-periodic-object-label">
            {d.hot
              ? say('镁 · 热水', 'Magnesium · hot water')
              : say('镁 · 冷水', 'Magnesium · cold water')}
          </div>
          <svg
            className="chem-periodic-magnesium"
            viewBox="0 0 330 330"
            role="img"
            aria-label={say(
              '镁条在冷水与加热后水中的不同明显现象',
              'Magnesium ribbon in cold water and after heating',
            )}
          >
            <path
              d="M90 20V210a75 45 0 0 0 150 0V20"
              fill="#cbd8c822"
              stroke="#93a28c"
              strokeWidth="2"
            />
            <path d="M94 95H236V210a71 41 0 0 1-142 0Z" fill="#d7dfca" opacity=".35" />
            <path d="M94 95H236V210a71 41 0 0 1-142 0Z" fill="#c85e8e" opacity={mg.pink * 0.4} />
            <path
              d={`M135 205l30-100 15 5-28 100Z`}
              fill="#a5afa8"
              stroke="#899990"
              opacity={mg.metal}
            />
            {mg.hydrogen > 0 &&
              Array.from({ length: 12 }, (_, i) => (
                <circle
                  key={i}
                  cx={130 + ((i * 19) % 55)}
                  cy={100 + ((i * 17) % 95)}
                  r={3 + (i % 3)}
                  fill="none"
                  stroke="#9db7aa"
                  opacity={Math.min(1, mg.hydrogen * 3)}
                />
              ))}
            {Array.from({ length: 18 }, (_, i) => (
              <ellipse
                key={i}
                cx={115 + ((i * 23) % 105)}
                cy={216 + ((i * 7) % 20)}
                rx="5"
                ry="3"
                fill="#f3f0dd"
                opacity={i / 18 < mg.hydroxide ? 0.85 : 0}
              />
            ))}
            <g fill="none" stroke="#95a28d" strokeWidth="3" strokeLinecap="round">
              <path d="M36 317V35M18 320H76M36 67H91" />
              <path d="M88 58H99M88 75H99M88 58V75" />
            </g>
            <path d="M140 302h50l-8 21h-34Z" fill="#bfccaf" stroke="#96a489" />
            {d.hot && <path d="M165 300q-18-20 0-40q18 24 0 40" fill="#dfbc7d" opacity=".8" />}
          </svg>
          <div className="chem-periodic-equation">Mg + 2H₂O → Mg(OH)₂ + H₂</div>
        </>
      ) : (
        <>
          <div className="chem-periodic-object-label">
            {d.medium === 'none'
              ? say('氨水制得沉淀', 'Precipitate prepared with aqueous ammonia')
              : d.medium === 'acid'
                ? say('分样后加入盐酸', 'Separate portions + HCl')
                : say('另取样加入NaOH', 'Separate portions + NaOH')}
          </div>
          <div className="chem-periodic-pair">
            {precipitate(al)}
            {precipitate(mh)}
          </div>
          <div className="chem-periodic-equation">
            {d.medium === 'base'
              ? 'Al(OH)₃ + OH⁻ → [Al(OH)₄]⁻'
              : d.medium === 'acid'
                ? say('Al(OH)₃与Mg(OH)₂都能与酸反应', 'Both Al(OH)₃ and Mg(OH)₂ react with acid')
                : say('分别比较两种白色沉淀', 'Compare the two white precipitates')}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-periodic-controls">
          <Segments
            label={say('观察实验', 'Experiment')}
            value={mode}
            options={[
              { value: 'halogen', label: say('卤素置换', 'Halogens') },
              { value: 'magnesium', label: say('镁与水', 'Magnesium') },
              { value: 'hydroxide', label: say('氢氧化物', 'Hydroxides') },
            ]}
            onChange={setMode}
          />
          {mode === 'halogen' ? (
            <>
              <Segments
                label={say('加入的单质', 'Element added')}
                value={oxidant}
                options={(['Cl', 'Br', 'I'] as const).map((value) => ({
                  value,
                  label: `${value}₂`,
                }))}
                onChange={(v) => setOxidant(v as Halogen)}
              />
              <Segments
                label={say('原溶液阴离子', 'Initial halide')}
                value={halide}
                options={(['Cl', 'Br', 'I'] as const).map((value) => ({
                  value,
                  label: `${value}⁻`,
                }))}
                onChange={(v) => setHalide(v as Halogen)}
              />
              <Range
                label={say('卤素单质示例量', 'Illustrative halogen amount')}
                value={available}
                min={0}
                max={0.5}
                step={0.05}
                onChange={setAvailable}
              />
              <Segments
                label={say('教材装置', 'Textbook apparatus')}
                value={plate ? 'plate' : 'tube'}
                options={[
                  { value: 'tube', label: say('正文试管', 'Test tubes') },
                  { value: 'plate', label: say('活动点滴板', 'Spotting tile') },
                ]}
                onChange={(v) => setPlate(v === 'plate')}
              />
            </>
          ) : mode === 'magnesium' ? (
            <Segments
              label={say('比较条件', 'Comparison')}
              value={hot ? 'hot' : 'cold'}
              options={[
                { value: 'cold', label: say('冷水', 'Cold water') },
                { value: 'hot', label: say('加热', 'Heated') },
              ]}
              onChange={(v) => setHot(v === 'hot')}
            />
          ) : (
            <>
              <Segments
                label={say('加入的试剂', 'Reagent added')}
                value={medium}
                options={[
                  { value: 'none', label: say('未加入', 'None') },
                  { value: 'acid', label: say('盐酸', 'Acid') },
                  { value: 'base', label: say('NaOH', 'Base') },
                ]}
                onChange={(v) => setMedium(v as TestMedium)}
              />
              <Range
                label={say('酸或碱的相对量', 'Relative acid/base amount')}
                value={amount}
                min={0}
                max={4}
                step={0.1}
                onChange={setAmount}
              />
            </>
          )}
          {mode !== 'hydroxide' && (
            <Range
              label={say('反应完成比例', 'Reaction extent')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          <p>
            {say(
              '各实验均为独立样品。颜色与过程为定性教学示意，未预测真实速率、温度或颜色光谱；冷水表示本演示尺度内无明显反应。',
              'Each experiment uses separate samples. Colours and progress are qualitative; rates, temperatures and spectra are not predicted. Cold water represents no appreciable reaction on this demonstration timescale.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
