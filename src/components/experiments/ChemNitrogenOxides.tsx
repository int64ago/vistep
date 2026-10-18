import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  nitrogenInitial,
  oxidizeNitrogen,
  absorbNitrogen,
  finishNitrogenAbsorption,
  nitrogenGasVolume,
  copperNitric,
  nitrogenDirector,
  syringeLiquidDepth,
} from '../../models/chem-nitrogen-oxides';
import '../../styles/chem-nitrogen-oxides.css';
export default function ChemNitrogenOxides() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    id = useId().replace(/:/g, '');
  const [view, setView] = useState(film.variant === 'nitric-copper' ? 'copper' : 'syringe'),
    [feed, setFeed] = useState(10),
    [pure, setPure] = useState(false),
    [oxidation, setOxidation] = useState(1),
    [absorption, setAbsorption] = useState(1),
    [water, setWater] = useState(true),
    [concentrated, setConcentrated] = useState(true),
    [extent, setExtent] = useState(0.6),
    [lift, setLift] = useState(0);
  const d = film.watch
    ? nitrogenDirector(film.chapter, film.chapterProgress)
    : {
        chapter: 0,
        progress: extent,
        view,
        concentrated,
        feed,
        oxidation,
        absorption,
        pureOxygen: pure,
        copperExtent: extent,
        lift,
      };
  const initial = nitrogenInitial(d.feed, d.pureOxygen),
    s = absorbNitrogen(oxidizeNitrogen(initial, d.oxidation), d.absorption, film.watch || water),
    gas = nitrogenGasVolume(s),
    liquid = film.watch || water ? 5 : 0,
    total = gas + liquid,
    piston = 68 + total * 3.5,
    depth = syringeLiquidDepth(total ? liquid / total : 0, 31),
    brown = 0.65 * Math.sqrt(s.no2 / 20),
    completed = finishNitrogenAbsorption(
      nitrogenInitial(d.pureOxygen ? 15 : 10, d.pureOxygen),
      true,
    ),
    cu = copperNitric(d.concentrated, d.copperExtent),
    airExample = oxidizeNitrogen(nitrogenInitial(1, true, 2), d.progress);
  const title =
    d.view === 'syringe'
      ? say('密闭注射器 · NO与水', 'Closed syringe · NO and water')
      : d.view === 'oxygen-budget'
        ? say('氧气是否足够', 'Is there enough oxygen?')
        : d.view === 'gas-comparison'
          ? say('生成NO以后 · 再接触O₂', 'After forming NO · contact O₂')
          : d.concentrated
            ? say('铜与浓硝酸', 'Copper + concentrated nitric acid')
            : say('铜与稀硝酸', 'Copper + dilute nitric acid');
  const coil = Array.from(
    { length: 44 },
    (_, i) =>
      `${i ? 'L' : 'M'}${77 + 11 * Math.sqrt(cu.copper) * Math.cos((i * Math.PI) / 7)} ${183 - d.lift * 80 + i * 0.45}`,
  ).join(' ');
  return (
    <section className="chem-nitrogen-oxides">
      <div className="chem-nox-title">{title}</div>
      {d.view === 'syringe' ? (
        <>
          <svg
            className="chem-nox-syringe"
            viewBox="0 35 320 185"
            role="img"
            aria-label={say(
              '液体深度与活塞位置由气体账本计算的注射器',
              'Syringe with liquid depth and piston position derived from the gas inventory',
            )}
          >
            <defs>
              <clipPath id={`${id}-barrel`}>
                <rect x="68" y="82" width={Math.max(0, piston - 68)} height="62" rx="3" />
              </clipPath>
            </defs>
            <path
              d="M28 103H51L64 94V132L51 123H28"
              fill="#dce5d9"
              stroke="#9fae96"
              strokeWidth="1.5"
            />
            <path d="M18 113H29" stroke="#aeb6a0" strokeWidth="5" />
            <path
              d="M19 103L25 123M25 103L19 123"
              stroke="#9a9c80"
              strokeWidth="2"
              opacity={film.watch && d.chapter === 1 && d.progress < 0.25 ? 0 : 1}
            />
            <rect
              x="64"
              y="78"
              width="184"
              height="70"
              rx="5"
              fill="#f8faf333"
              stroke="#97a98c"
              strokeWidth="2"
            />
            <g clipPath={`url(#${id}-barrel)`}>
              <rect
                x="68"
                y="82"
                width={Math.max(0, piston - 68)}
                height={62 - depth}
                fill="#a6673e"
                opacity={brown}
              />
              <rect
                x="68"
                y={144 - depth}
                width={Math.max(0, piston - 68)}
                height={depth}
                fill="#b8d6cc"
                opacity=".75"
              />
            </g>
            <path d={`M${piston + 5} 95H294V131H${piston + 5}`} fill="#e3e9dc" stroke="#a9b59a" />
            <rect x={piston - 2} y="80" width="7" height="66" rx="2" fill="#aebf9c" />
            <path
              d="M294 86V140M248 68V158"
              stroke="#94a681"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {[0, 10, 20, 30, 40, 50].map((v) => (
              <line key={v} x1={68 + v * 3.5} x2={68 + v * 3.5} y1="79" y2="68" stroke="#8b9b7e" />
            ))}
            {[10, 30, 50].map((v) => (
              <text
                key={v}
                x={68 + v * 3.5}
                y="58"
                textAnchor="middle"
                fontSize="22"
                fill="#637653"
              >
                {v}
              </text>
            ))}
            <text x="160" y="188" textAnchor="middle" fontSize="23" fill="#637653">
              {gas.toFixed(1)} mL + {liquid} mL
            </text>
          </svg>
          <div className="chem-nox-evidence">
            <span>{say('气相 / 水相（理想模型）', 'Gas / liquid (ideal model)')}</span>
            <span>
              NO: {s.no.toFixed(1)} · NO₂: {s.no2.toFixed(1)} mL
            </span>
          </div>
        </>
      ) : d.view === 'oxygen-budget' ? (
        <div className="chem-nox-budget">
          <div className="chem-nox-feed">
            {d.pureOxygen ? '15 mL O₂' : say('10 mL空气 → 2.1 mL O₂', '10 mL air → 2.1 mL O₂')}
          </div>
          <div className="chem-nox-nitrogen-bar">
            <span style={{ width: `${(completed.aqueousN / 20) * 100}%` }} />
          </div>
          <div className="chem-nox-budget-labels">
            <span>
              {say('进入液相的N', 'N entering solution')}
              <b>{((completed.aqueousN / 20) * 100).toFixed(0)}%</b>
            </span>
            <span>
              {say('仍为NO', 'NO remaining')}
              <b>{completed.no.toFixed(1)}</b>
            </span>
          </div>
          <div className="chem-nox-equation">
            4NO ＋ 3O₂ ＋ 2H₂O
            <br />→ 4HNO₃
          </div>
        </div>
      ) : d.view === 'gas-comparison' ? (
        <>
          <svg
            className="chem-nox-gas"
            viewBox="0 0 320 240"
            role="img"
            aria-label={say(
              'NO接触氧气以后形成红棕色NO2',
              'NO forms red-brown NO2 after oxygen contact',
            )}
          >
            <path
              d="M104 65V201Q104 219 120 219H200Q216 219 216 201V65"
              fill="#a6673e"
              opacity={(0.5 * airExample.no2) / 2}
            />
            <path
              d="M104 65V201Q104 219 120 219H200Q216 219 216 201V65"
              fill="none"
              stroke="#98aa8c"
              strokeWidth="2"
            />
            <ellipse cx="160" cy="65" rx="56" ry="7" fill="#eff2e7" stroke="#98aa8c" />
            <path d="M160 26V111l-6-9m6 9l6-9" stroke="#9aa57b" strokeWidth="2" fill="none" />
            <text x="201" y="35" fontSize="24" fill="#7b8b62">
              O₂
            </text>
            <text x="160" y="160" fontSize="25" textAnchor="middle" fill="#855f43">
              {airExample.no2 > 1 ? 'NO₂' : 'NO'}
            </text>
          </svg>
          <div className="chem-nox-equation">2NO ＋ O₂ → 2NO₂</div>
        </>
      ) : (
        <>
          <svg className="chem-nox-reactor" viewBox="0 0 320 280" role="img" aria-label={title}>
            <path d="M35 255V85H57M22 255H49" fill="none" stroke="#aeb79f" strokeWidth="3" />
            <path
              d="M56 65V220Q56 243 82 243Q108 243 108 220V65"
              fill="#e9ede033"
              stroke="#98a88b"
              strokeWidth="2"
            />
            <path
              d="M60 150H104V219Q104 239 82 239Q60 239 60 219Z"
              fill="#8cb8bf"
              opacity={0.2 + 0.55 * cu.copperII}
            />
            <rect
              x="60"
              y="77"
              width="44"
              height="73"
              fill="#a96a41"
              opacity={0.5 * Math.sqrt(cu.no2 / 2)}
            />
            <path d="M52 59H112L107 76H57Z" fill="#b8a68a" stroke="#9e8f76" />
            <path
              d={`M77 ${43 - d.lift * 20}V${183 - d.lift * 80}`}
              stroke="#b48c68"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d={coil}
              stroke="#b48c68"
              opacity={cu.copper > 1e-8 ? 1 : 0}
              strokeWidth={1.1 + Math.sqrt(cu.copper) * 1.5}
              fill="none"
            />
            <path
              d="M108 99H143V51H235V212"
              stroke="#a7b59a"
              strokeWidth="5"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M108 99H143V51H235V212"
              stroke="#e5ebdc"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d="M198 146V246Q198 258 211 258H265Q278 258 278 246V146"
              fill="#edf1e033"
              stroke="#98a88b"
              strokeWidth="2"
            />
            <path
              d="M202 186H274V245Q274 254 264 254H212Q202 254 202 245Z"
              fill="#c4d7bd"
              opacity=".6"
            />
            {d.lift < 0.7 &&
              d.copperExtent > 0 &&
              d.copperExtent < 1 &&
              [0, 1, 2, 3].map((i) => (
                <circle
                  key={i}
                  cx={235 + 4 * Math.sin(i)}
                  cy={209 - i * 12}
                  r="3"
                  fill="none"
                  stroke={d.concentrated ? '#b2865f' : '#a7b59a'}
                  opacity=".7"
                />
              ))}
            <text
              x="82"
              y="125"
              textAnchor="middle"
              fontSize="22"
              fill={d.concentrated ? '#8b5d38' : '#6a805a'}
            >
              {d.concentrated ? 'NO₂' : 'NO'}
            </text>
          </svg>
          <div className="chem-nox-reactor-labels">
            <span>{say('反应生成气体', 'Primary gas product')}</span>
            <span>{say('NaOH尾气处理示意', 'NaOH treatment schematic')}</span>
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-nox-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'syringe', label: say('注射器', 'Syringe') },
              { value: 'oxygen-budget', label: say('氧气账本', 'Oxygen budget') },
              { value: 'copper', label: say('铜与硝酸', 'Copper and nitric acid') },
              { value: 'gas-comparison', label: say('NO遇O₂', 'NO meets O₂') },
            ]}
          />
          {view === 'syringe' || view === 'oxygen-budget' ? (
            <>
              <Segments
                label={say('进入的气体', 'Gas feed')}
                value={pure ? 'oxygen' : 'air'}
                onChange={(v) => setPure(v === 'oxygen')}
                options={[
                  { value: 'air', label: say('空气', 'Air') },
                  { value: 'oxygen', label: 'O₂' },
                ]}
              />
              {view === 'syringe' && (
                <>
                  <Range
                    label={say('进入气体体积 /mL', 'Feed volume /mL')}
                    value={feed}
                    min={0}
                    max={25}
                    step={0.5}
                    onChange={setFeed}
                  />
                  <Range
                    label={say('NO氧化程度', 'NO oxidation extent')}
                    value={oxidation}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setOxidation}
                  />
                  <Range
                    label={say('NO₂与水作用程度', 'NO₂-water reaction extent')}
                    value={absorption}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setAbsorption}
                  />
                  <Segments
                    label={say('水', 'Water')}
                    value={water ? 'yes' : 'no'}
                    onChange={(v) => setWater(v === 'yes')}
                    options={[
                      { value: 'yes', label: say('有水', 'Present') },
                      { value: 'no', label: say('无水', 'Absent') },
                    ]}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <Range
                label={say('观察程度', 'Observation progress')}
                value={extent}
                min={0}
                max={1}
                step={0.01}
                onChange={setExtent}
              />
              {view === 'copper' && (
                <>
                  <Segments
                    label={say('教材浓度条件', 'Textbook acid condition')}
                    value={concentrated ? 'conc' : 'dilute'}
                    onChange={(v) => setConcentrated(v === 'conc')}
                    options={[
                      { value: 'conc', label: say('浓硝酸', 'Concentrated') },
                      { value: 'dilute', label: say('稀硝酸', 'Dilute') },
                    ]}
                  />
                  <Range
                    label={say('铜丝提起程度', 'Wire withdrawal')}
                    value={lift}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setLift}
                  />
                </>
              )}
            </>
          )}
          <details>
            <summary>{say('计算与限定', 'Calculation limits')}</summary>
            <p>
              {say(
                '气体量按同温同压的理想等效体积计算；水相体积近似不变，忽略活塞摩擦、蒸气压和NO₂/N₂O₄平衡。气体颜色是定性示意，铜与硝酸取教材两个浓度极限，不预测任意浓度下的产物比例。尾气管路仅保留教材处理装置，未声称NaOH可单独完全吸收NO。',
                'Gas amounts use ideal equal-temperature/pressure volume equivalents. Liquid volume is held approximately fixed; piston friction, vapour pressure and the NO₂/N₂O₄ equilibrium are omitted. Colour is qualitative. Copper uses the textbook’s two acid cases, not a concentration-to-yield prediction. The tail-gas schematic does not claim NaOH alone completely absorbs NO.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
