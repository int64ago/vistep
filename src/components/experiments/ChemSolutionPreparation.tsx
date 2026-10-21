import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  solutionPreparation,
  flaskLevel,
  flaskProfile,
  mixingLayers,
  preparationDirector,
  preparationTracer,
  type PreparationMode,
} from '../../models/chem-solution-preparation';
import '../../styles/chem-solution-preparation.css';
export default function ChemSolutionPreparation() {
  const film = useShowcase(),
    { host, compact } = useSignalWidth(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState<PreparationMode | null>(null),
    [mass, setMass] = useState<number | null>(null),
    [recovery, setRecovery] = useState<number | null>(null),
    [volume, setVolume] = useState<number | null>(null),
    [stockMl, setStockMl] = useState<number | null>(null),
    [mixed, setMixed] = useState<number | null>(null);
  const base = preparationDirector(
    film.chapter,
    film.chapterProgress,
    film.chapterTime,
    en ? 'en' : 'zh',
  );
  const d = film.watch
    ? base
    : {
        ...base,
        mode: mode ?? base.mode,
        mass: mass ?? base.mass,
        recovery: recovery ?? base.recovery,
        volume: volume ?? base.volume,
        stockMl: stockMl ?? base.stockMl,
        mixed: mixed ?? base.mixed,
      };
  const dilution = d.mode === 'dilution',
    m = solutionPreparation(d.mass, d.recovery, d.volume, dilution ? d.stockMl : null),
    level = flaskLevel(d.volume),
    layers = mixingLayers(m.concentration, d.mixed),
    transfer = d.mode === 'transfer',
    weigh = d.mode === 'solid',
    tracer = preparationTracer(d.recovery, d.volume);
  const concentrationReady = !film.watch || ['meniscus', 'mixing', 'dilution'].includes(d.mode);
  return (
    <section
      ref={host}
      className="chem-solution-preparation"
      data-watch={film.watch}
      data-mode={d.mode}
      data-stage={d.stage}
      data-volume={d.volume}
      data-recovery={d.recovery}
      data-mixed={d.mixed}
      data-input-moles={m.inputMoles}
      data-delivered-moles={m.deliveredMoles}
      data-concentration={m.concentration}
    >
      <div className="chem-prep-ledger">
        <span>
          {dilution
            ? `${d.stockMl.toFixed(1)} mL × 1.00 mol/L`
            : `${d.mass.toFixed(2)} g ÷ 58.5 g/mol`}
        </span>
        <b>{m.inputMoles.toFixed(3)} mol</b>
      </div>
      <div className={`chem-prep-apparatus ${weigh ? 'is-weighing' : ''}`}>
        <figure className="chem-prep-main">
          <svg
            viewBox={
              compact
                ? d.mode === 'mixing'
                  ? '0 0 380 370'
                  : weigh
                    ? '40 95 310 215'
                    : transfer
                      ? '0 0 290 345'
                      : '100 0 180 345'
                : '0 0 380 370'
            }
            role="img"
            aria-label={say(
              '配制溶液时的溶质转移与容量瓶',
              'Solute transfer and volumetric flask during solution preparation',
            )}
          >
            <defs>
              <clipPath id={`${id}-flask`}>
                <path d={flaskProfile()} />
              </clipPath>
            </defs>
            {weigh ? (
              <>
                <path
                  d="M50 142V280Q50 291 64 291H177Q191 291 191 280V142L180 132H53"
                  fill="#afc5b526"
                  stroke="#8ba18d"
                  strokeWidth="2"
                />
                <path
                  d="M52 192H189V279Q189 289 177 289H65Q52 289 52 279Z"
                  fill="#b9cebc"
                  opacity=".3"
                />
                <path
                  d={`M153 107L${114 + 15 * Math.sin(d.progress * 12)} 263`}
                  stroke="#aec0b2"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {Array.from({ length: 25 }, (_, i) => (
                  <rect
                    key={i}
                    x={67 + ((i * 23) % 100)}
                    y={275 - (i % 3) * 5}
                    width="6"
                    height="6"
                    fill="#faf8e9"
                    opacity={1 - d.progress}
                  />
                ))}
                {Array.from({ length: 16 }, (_, i) => (
                  <circle
                    key={i}
                    cx={68 + ((i * 29) % 102)}
                    cy={208 + ((i * 19) % 60)}
                    r="3"
                    fill="#a69670"
                    opacity={d.progress * 0.65}
                  />
                ))}
                <path d="M238 235H332L344 282H226Z" fill="#b8c5b4" />
                <rect x="249" y="250" width="70" height="25" rx="4" fill="#eaf0e4" />
                <text x="284" y="269" textAnchor="middle" fontSize="20" fill="#425b47">
                  {d.mass.toFixed(2)} g
                </text>
                <path d="M232 218H338" stroke="#839986" strokeWidth="4" />
              </>
            ) : (
              <>
                <g
                  transform={
                    d.mode === 'mixing'
                      ? `rotate(${Math.sin(d.progress * Math.PI * 4) * 160 * Math.sin(Math.PI * d.progress)} 190 185)`
                      : undefined
                  }
                >
                  <path d={flaskProfile()} fill="#a8c1af1c" stroke="#8ba18d" strokeWidth="2" />
                  <g clipPath={`url(#${id}-flask)`}>
                    {layers.map((c, i) => {
                      const top = flaskLevel((d.volume * (10 - i)) / 10),
                        bottom = flaskLevel((d.volume * (9 - i)) / 10);
                      return (
                        <rect
                          key={i}
                          x="90"
                          y={top}
                          width="200"
                          height={Math.max(0, bottom - top + 0.5)}
                          fill="#a7c3b0"
                          opacity={0.13 + (0.19 * c) / Math.max(0.001, m.concentration)}
                        />
                      );
                    })}
                    <path
                      d={`M175 ${level - 5}Q190 ${level + 5} 205 ${level - 5}`}
                      stroke="#779985"
                      strokeWidth="2"
                      fill="none"
                    />
                    {Array.from({ length: 40 }, (_, i) => {
                      const y = 180 + ((i * 37) % 138);
                      return (
                        <circle
                          key={i}
                          cx={135 + ((i * 19) % 110)}
                          cy={y}
                          r="2.5"
                          fill="#ad986f"
                          opacity={i < 40 * d.recovery && y >= level ? 0.55 : 0}
                        />
                      );
                    })}
                  </g>
                  <line x1="171" y1="100" x2="209" y2="100" stroke="#9b7c59" strokeWidth="2" />
                  <text x="190" y="242" fontSize="34" textAnchor="middle" fill="#3e5a49">
                    100 mL
                  </text>
                  <text x="190" y="278" fontSize="34" textAnchor="middle" fill="#3e5a49">
                    20 °C
                  </text>
                  {d.mode === 'mixing' && (
                    <path d="M173 20H207L204 40H176Z" fill="#a9bfac" stroke="#8ba18d" />
                  )}
                </g>
                {transfer ? (
                  <>
                    <g transform="translate(56,-5) rotate(-25 60 70)">
                      <path d="M15 20V95H95V20" fill="#c2d1bf26" stroke="#8ba18d" strokeWidth="2" />
                      <path
                        d={`M17 ${60 + 33 * Math.min(1, d.recovery / 0.95)}H93V93H17Z`}
                        fill="#b1cbb9"
                        opacity=".3"
                      />
                      {Array.from({ length: 8 }, (_, i) => (
                        <circle
                          key={i}
                          cx={22 + i * 7}
                          cy={88 - (i % 2) * 5}
                          r="3"
                          fill="#a18c61"
                          opacity={(1 - d.recovery) * 20}
                        />
                      ))}
                      <path d="M95 20L112 25" stroke="#8ba18d" strokeWidth="2" />
                    </g>
                    <path
                      d="M144 3L188 70"
                      stroke="#b2c5b5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path d="M144 2L187 65V135" stroke="#87afa0" strokeWidth="2" fill="none" />
                    {d.stage === 'rinse' && (
                      <path
                        d="M20 20Q18 7 32 7H47V17H55L68 35"
                        stroke="#90a895"
                        fill="none"
                        strokeWidth="3"
                      />
                    )}
                  </>
                ) : (
                  <>
                    {(d.mode === 'meniscus' || dilution) && (
                      <>
                        <path d="M184 5V22L190 34L196 22V5" fill="#c5d4c366" stroke="#8ba18d" />
                        <circle cx="190" cy="49" r="3" fill="#9bb7a6" />
                      </>
                    )}
                    {d.mode === 'mixing' && (
                      <>
                        <path
                          d="M86 170Q31 215 86 271M294 271Q349 215 294 170"
                          stroke="#90a58c"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="5 6"
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}
            {transfer && (
              <circle
                data-tracer-id={tracer.id}
                data-tracer-phase={tracer.phase}
                cx={tracer.x}
                cy={tracer.y}
                r="5"
                fill="#9d7b3b"
                stroke="#fffaf0"
                strokeWidth="1.5"
              />
            )}
          </svg>
          <figcaption>
            {weigh
              ? say('称量 → 完全溶解', 'Weigh → dissolve completely')
              : transfer
                ? d.stage === 'rinse'
                  ? say('洗涤液也转入容量瓶', 'Transfer the rinsings as well')
                  : say('沿玻璃棒转移', 'Transfer along the glass rod')
                : dilution
                  ? say(
                      `取${d.stockMl.toFixed(1)} mL母液，再定容`,
                      `Take ${d.stockMl.toFixed(1)} mL of stock, then make up to volume`,
                    )
                  : say('容量瓶中的溶液', 'Solution in the volumetric flask')}
          </figcaption>
        </figure>
        <div className="chem-prep-detail" data-mode={d.mode}>
          {weigh ? (
            <div className="chem-prep-balance chem-prep-weighed">
              <span>
                {say('溶解前后，NaCl物质的量不变', 'Dissolving preserves the amount of NaCl')}
              </span>
              <strong>{(m.inputMoles * 1000).toFixed(1)} mmol</strong>
            </div>
          ) : d.mode === 'meniscus' ? (
            <>
              <svg
                viewBox="0 0 280 210"
                role="img"
                aria-label={say(
                  '凹液面最低点与刻度线的局部视图',
                  'Close view of the meniscus bottom and calibration line',
                )}
              >
                <path d="M80 20V190M180 20V190" stroke="#89a18c" strokeWidth="2" />
                <path
                  d={`M82 ${100 + (level - 100) * 1.4 - 12}Q130 ${100 + (level - 100) * 1.4 + 12} 178 ${100 + (level - 100) * 1.4 - 12}V190H82Z`}
                  fill="#bed4c5"
                  opacity=".5"
                />
                <line x1="65" x2="195" y1="100" y2="100" stroke="#947957" strokeWidth="2" />
                <path d="M217 100Q240 84 261 100Q240 116 217 100" fill="none" stroke="#657b65" />
                <circle cx="239" cy="100" r="5" fill="#657b65" />
                <path d="M215 100H135" stroke="#657b65" strokeDasharray="3 5" />
              </svg>
              <p>
                {film.watch && d.stage === 'high-volume-case'
                  ? say('另一份配液 · 偏高', 'Separate sample · too high')
                  : film.watch && d.stage === 'low-volume-case'
                    ? say('另一份配液 · 偏低', 'Separate sample · too low')
                    : '100 mL · 20 °C'}
              </p>
            </>
          ) : (
            <div className="chem-prep-balance">
              <div>
                <span>{say('进入容量瓶', 'In the flask')}</span>
                <strong>{(m.deliveredMoles * 1000).toFixed(1)} mmol</strong>
                <i style={{ width: `${d.recovery * 100}%` }} />
              </div>
              <div>
                <span>{say('仍留在原容器', 'Left in the source vessel')}</span>
                <strong>{(m.residueMoles * 1000).toFixed(1)} mmol</strong>
                <i style={{ width: `${(1 - d.recovery) * 100}%` }} />
              </div>
            </div>
          )}
          {concentrationReady && (
            <div className="chem-prep-concentration">
              <span>{m.volume.toFixed(2)} mL</span>
              <strong>{m.concentration.toFixed(3)} mol/L</strong>
            </div>
          )}
        </div>
      </div>
      {!film.watch && (
        <div className="chem-prep-controls">
          <Segments
            label={say('观察环节', 'Observe')}
            value={d.mode}
            options={[
              { value: 'solid', label: say('称量', 'Weigh') },
              { value: 'transfer', label: say('转移', 'Transfer') },
              { value: 'meniscus', label: say('定容', 'Volume') },
              { value: 'mixing', label: say('混匀', 'Mix') },
              { value: 'dilution', label: say('稀释', 'Dilute') },
            ]}
            onChange={(v) => {
              setMode(v as PreparationMode);
              setVolume(v === 'transfer' ? 40 : 100);
            }}
          />
          {dilution ? (
            <Range
              label={say('1.00 mol/L母液体积', 'Volume of 1.00 mol/L stock')}
              value={d.stockMl}
              min={10}
              max={90}
              step={1}
              unit="mL"
              onChange={setStockMl}
            />
          ) : (
            <Range
              label={say('称取NaCl质量', 'NaCl mass weighed')}
              value={d.mass}
              min={5.5}
              max={6.2}
              step={0.01}
              unit="g"
              onChange={setMass}
            />
          )}
          <Range
            label={say('溶质转移回收率', 'Solute recovery')}
            value={d.recovery * 100}
            min={0}
            max={100}
            step={0.1}
            unit="%"
            onChange={(v) => setRecovery(v / 100)}
          />
          <Range
            label={say('最终溶液体积', 'Final solution volume')}
            value={d.volume}
            min={d.mode === 'transfer' || d.mode === 'dilution' ? 1 : 98.8}
            max={101.2}
            step={0.02}
            unit="mL"
            onChange={setVolume}
          />
          {d.mode === 'mixing' && (
            <Range
              label={say('混匀程度', 'Mixing progress')}
              value={d.mixed}
              min={0}
              max={1}
              step={0.01}
              onChange={setMixed}
            />
          )}
          <p>
            {say(
              '金色点是溶质追踪标记，盐水本身无色；回收率、浓度分层与瓶形均为教学模型。',
              'Gold dots track solute; the actual solution is colourless. Recovery, concentration layers and flask shape are teaching models.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
