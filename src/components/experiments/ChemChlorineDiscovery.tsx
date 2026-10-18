import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  chlorineGasTrain,
  pipePosition,
  chlorineFilm,
  chlorineTrainGeometry,
  oxygenSourceAccount,
  oxygenSourceAtoms,
  hydrogenChlorineAtoms,
  chlorineHistoryClaim,
} from '../../models/chem-chlorine-discovery';
import '../../styles/chem-chlorine-discovery.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const colours = { O: '#c68959', H: '#f5ecd9', Cl: '#aab77d', Pb: '#9da7a3' };
function Atom({
  atom,
  radius = 16,
}: {
  atom: { id: string; element: string; x: number; y: number };
  radius?: number;
}) {
  return (
    <g data-atom={atom.id} data-element={atom.element} transform={`translate(${atom.x},${atom.y})`}>
      {atom.id === 'oxygen-oxide-0' && (
        <circle r={radius + 5} fill="none" stroke="#c68959" opacity=".35" />
      )}
      <circle r={radius} fill={colours[atom.element as keyof typeof colours]} stroke="#787f7040" />
      <text y="5.5" textAnchor="middle" className="ccd-atom-letter">
        {atom.element}
      </text>
    </g>
  );
}
function HistoricalGas({ x, y, opacity = 0.5 }: { x: number; y: number; opacity?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path
        d="M-21 0v22l-20 17v73q0 8 8 8h66q8 0 8-8V39L21 22V0"
        fill="#c4cd8d"
        fillOpacity={opacity}
        stroke="#a1ad86"
        strokeWidth="1.6"
      />
      <ellipse cy="0" rx="21" ry="4" fill="#f2f0de" stroke="#a1ad86" />
      <path d="M-32 45v61q0 5 7 5" fill="none" stroke="#fffdf0" strokeWidth="3" opacity=".65" />
    </g>
  );
}
function HistoryObservation({
  width,
  beat,
  alternative,
}: {
  width: number;
  beat: string;
  alternative: boolean;
}) {
  const claim = chlorineHistoryClaim(alternative ? 'alternative' : 'transferable-oxygen'),
    tested = beat === 'record' || beat === 'limit',
    showClaim = beat !== 'gas';
  return (
    <div
      data-records={claim.records.map((r) => r.id).join('|')}
      data-evidence="fixed"
      data-shot={beat}
    >
      <div className="ccd-kicker">{say('1774 → 1810 · 观察', '1774 → 1810 · evidence')}</div>
      <svg
        viewBox={`0 0 ${width} 191`}
        role="img"
        aria-label={say(
          '固定的黄绿色气体观察与炭检验，虚线氧标记只表示待检验假说',
          'Fixed gas observation and carbon test; the dashed oxygen marker denotes a hypothesis',
        )}
      >
        <HistoricalGas x={width * 0.23} y={26} />
        <text x={width * 0.23} y="176" textAnchor="middle">
          {say('黄绿色气体', 'Observed gas')}
        </text>
        {showClaim && (
          <g>
            <path
              d={`M${width * 0.7 - 35} 134q35 10 70 0`}
              fill="none"
              stroke="#b2a48d"
              strokeWidth="2"
            />
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                d={`M${width * 0.7 - 27 + i * 8} ${125 - (i % 3) * 5}l8-9 9 7-5 9Z`}
                fill={i % 2 ? '#6f7368' : '#525c50'}
              />
            ))}
            <text x={width * 0.7} y="176" textAnchor="middle">
              {say('预处理炭', 'Treated carbon')}
            </text>
            <path
              d={`M${width * 0.32} 65Q${width * 0.5} 5 ${width * 0.68} 65`}
              stroke="#b28d62"
              strokeWidth="1.6"
              fill="none"
              strokeDasharray="4 5"
              opacity={claim.expectsCarbonTransfer ? 1 : 0.2}
            />
            <circle
              cx={width * 0.5}
              cy="45"
              r="22"
              fill="#faf5e5"
              stroke="#b28d62"
              strokeDasharray="3 4"
            />
            <text x={width * 0.5} y="51" textAnchor="middle">
              O?
            </text>
            {tested && (
              <path d={`M${width * 0.5 - 16} 30l32 30`} stroke="#a77f62" strokeWidth="2" />
            )}
            <text x={width * 0.7} y="103" textAnchor="middle">
              {tested
                ? say('未见预期变化', 'No expected change')
                : say('能转移氧吗？', 'O transfer?')}
            </text>
          </g>
        )}
      </svg>
      <p className="ccd-line">
        {beat === 'gas'
          ? say('颜色不能给出组成。', 'Colour does not identify composition.')
          : beat === 'claim'
            ? say('虚线：后来的含氧假说。', 'Dashed mark: a later oxygen claim.')
            : beat === 'record'
              ? say('记录：未见预期变化。', 'Recorded: no expected change.')
              : tested
                ? say(
                    '一次未反应，不能单独证明元素。',
                    'One failed reaction is not proof of an element.',
                  )
                : say('先保留预测，再看记录。', 'Keep the prediction separate from the record.')}
      </p>
    </div>
  );
}
export function ChlorineOxygenAccount({
  width,
  progress,
  oxide = true,
  externalWater = false,
  reveal = true,
}: {
  width: number;
  progress: number;
  oxide?: boolean;
  externalWater?: boolean;
  reveal?: boolean;
}) {
  const atoms = oxygenSourceAtoms(progress, width, oxide, externalWater),
    m = oxygenSourceAccount(oxide ? 1 : 0, 2, externalWater ? 1 : 0, progress),
    completed = progress >= 0.99 && oxide,
    initial = progress < 0.01 || !oxide,
    pairs = initial
      ? [
          ['hydrogen-acid-0', 'chlorine-acid-0'],
          ['hydrogen-acid-1', 'chlorine-acid-1'],
        ]
      : completed
        ? [
            ['oxygen-oxide-0', 'hydrogen-acid-0'],
            ['oxygen-oxide-0', 'hydrogen-acid-1'],
          ]
        : [],
    saltAtoms =
      oxide && (initial || completed)
        ? atoms.filter((a) =>
            completed
              ? ['lead-0', 'chlorine-acid-0', 'chlorine-acid-1'].includes(a.id)
              : a.origin === 'oxide',
          )
        : [],
    saltBounds = saltAtoms.length
      ? {
          x: Math.min(...saltAtoms.map((a) => a.x)) - 21,
          y: Math.min(...saltAtoms.map((a) => a.y)) - 21,
          width:
            Math.max(...saltAtoms.map((a) => a.x)) - Math.min(...saltAtoms.map((a) => a.x)) + 42,
          height:
            Math.max(...saltAtoms.map((a) => a.y)) - Math.min(...saltAtoms.map((a) => a.y)) + 42,
        }
      : undefined;
  return (
    <div
      data-shot="oxygen-account"
      data-oxide={oxide}
      data-water-new={m.netNewWater}
      data-water-initial={m.species.preexistingWater}
    >
      <div className="ccd-kicker">
        {oxide
          ? say('现代原子账本', 'Modern atom ledger')
          : say('新模型对照 · 无PbO', 'New model trial · no PbO')}
      </div>
      <svg
        viewBox={`0 0 ${width} ${externalWater ? 264 : 186}`}
        role="img"
        aria-label={
          oxide
            ? say(
                '氧原子的身份从氧化铅保持到新生成的水，外来水单独记录',
                'The same oxygen moves from lead oxide to newly formed water; initial water is recorded separately',
              )
            : reveal
              ? say(
                  '无氧化铅时没有新水；任何原有水仍单独记账',
                  'Without lead oxide no new water forms; any initial water remains separate',
                )
              : say(
                  '独立模型对照：只留HCl，能生成新水吗？',
                  'Separate model trial: with only HCl, can new water form?',
                )
        }
      >
        {saltBounds && (
          <rect
            data-composition-group={completed ? 'PbCl2' : 'PbO'}
            {...saltBounds}
            rx="18"
            fill="#a3a7920b"
            stroke="#a3a792"
            strokeWidth="1.4"
            strokeDasharray="3 5"
          />
        )}
        {pairs.map(([a, b]) => {
          const x = atoms.find((t) => t.id === a),
            y = atoms.find((t) => t.id === b);
          return x && y ? (
            <path
              key={a + b}
              data-covalent-pair={`${a}/${b}`}
              d={`M${x.x} ${x.y}L${y.x} ${y.y}`}
              stroke="#a3a792"
              strokeWidth="2"
            />
          ) : null;
        })}
        {!oxide && (
          <text x={width * 0.24} y="80" textAnchor="middle">
            {say('无氧化铅', 'No PbO')}
          </text>
        )}
        {atoms.map((a) => (
          <Atom key={a.id} atom={a} />
        ))}
        {externalWater && (
          <text x={width * 0.55} y={oxide ? 224 : 190}>
            {say('原有水', 'Initial water')}
          </text>
        )}
        {!externalWater && (initial || completed) && (
          <>
            <text x={width * 0.24} y="178" textAnchor="middle">
              {!oxide
                ? reveal
                  ? 'O = 0'
                  : 'O ?'
                : completed
                  ? 'PbCl₂'
                  : initial
                    ? 'PbO'
                    : say('同一批原子', 'Same atoms')}
            </text>
            <text x={width * 0.74} y="178" textAnchor="middle">
              {completed ? 'H₂O' : initial ? '2 HCl' : say('重新分配', 'Reallocation')}
            </text>
          </>
        )}
      </svg>
      <div className="ccd-atom-count" aria-label={say('守恒的原子数', 'Conserved atom counts')}>
        Pb {m.atoms.Pb} · O {reveal ? m.atoms.O : '?'} · H {m.atoms.H} · Cl {m.atoms.Cl}
      </div>
      <p className="ccd-line ccd-oxygen-conclusion">
        {!reveal
          ? say('还能新生成水吗？', 'Can new water form?')
          : !oxide
            ? say(
                `新水 0 · 原有水 ${externalWater ? 1 : 0}`,
                `New water 0 · initial water ${externalWater ? 1 : 0}`,
              )
            : completed
              ? say('这个水中的氧来自氧化铅。', 'This water’s oxygen came from PbO.')
              : say('跟踪棕色的氧，不增加原子。', 'Track the amber oxygen; add no atoms.')}
      </p>
    </div>
  );
}
function OxygenEvidence({ width }: { width: number }) {
  return (
    <div data-shot="water-record">
      <div className="ccd-kicker">{say('1810 · 水的观察', '1810 · water observed')}</div>
      <svg
        viewBox={`0 0 ${width} 191`}
        role="img"
        aria-label={say(
          '氯化氢接触氧化铅出现水的历史观察，尚不判定氧的来源',
          'Historical water observation after hydrogen chloride contacts lead oxide; oxygen source remains undecided',
        )}
      >
        <path d={`M${width * 0.1} 79H${width * 0.83}`} stroke="#9baa98" strokeWidth="3" />
        <path
          d={`M${width * 0.1} 53H${width * 0.83}q28 13 0 26`}
          stroke="#9baa98"
          fill="#edf0e052"
          strokeWidth="1.6"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${width * 0.37 + i * 9} 76l6-10 9 10Z`} fill="#b6a879" />
        ))}
        <text x={width * 0.13} y="37">
          HCl
        </text>
        <text x={width * 0.47} y="114" textAnchor="middle">
          PbO
        </text>
        <path d={`M${width * 0.82} 91q-18 24 0 28q18-4 0-28Z`} fill="#a8c7c6" stroke="#849fa3" />
        <text x={width * 0.82} y="146" textAnchor="middle">
          {say('水', 'Water')}
        </text>
        <text x={width * 0.5} y="179" textAnchor="middle">
          {say('氧原来在哪里？', 'Where was its oxygen?')}
        </text>
      </svg>
      <p className="ccd-line">
        {say('观察保持不变，来源解释待检验。', 'Keep the water observation; test its source.')}
      </p>
    </div>
  );
}
function EvidenceConvergence({
  width,
  time,
  progress,
}: {
  width: number;
  time: number;
  progress: number;
}) {
  const d = chlorineFilm(2, time, browserLocale() === 'en' ? 'en' : 'zh'),
    modern = d.interpretationBeat === 'modern',
    atoms = hydrogenChlorineAtoms(progress, width);
  return (
    <div data-shot={d.interpretationBeat}>
      <div className="ccd-kicker">
        {modern
          ? say('现代分子净账本', 'Modern molecular account')
          : say('同一个解释，容纳多条证据', 'One explanation, several observations')}
      </div>
      {modern ? (
        <>
          <svg
            viewBox={`0 0 ${width} 186`}
            role="img"
            aria-label={say(
              '同一批两个氢原子和两个氯原子组成两份氯化氢，未加入氧',
              'The same two hydrogen and two chlorine atoms form two hydrogen chlorides, with no added oxygen',
            )}
          >
            {(progress < 0.05
              ? [
                  ['hydrogen-0', 'hydrogen-1'],
                  ['chlorine-0', 'chlorine-1'],
                ]
              : progress > 0.95
                ? [
                    ['hydrogen-0', 'chlorine-0'],
                    ['hydrogen-1', 'chlorine-1'],
                  ]
                : []
            ).map(([one, two]) => {
              const a = atoms.find((x) => x.id === one)!,
                b = atoms.find((x) => x.id === two)!;
              return (
                <path
                  key={one + two}
                  d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                  stroke="#9ca98d"
                  strokeWidth="2"
                />
              );
            })}
            {atoms.map((a) => (
              <Atom key={a.id} atom={a} />
            ))}
            <text x={width / 2} y="170" textAnchor="middle">
              H₂ + Cl₂ → 2 HCl
            </text>
          </svg>
          <div className="ccd-atom-count">H 2 · Cl 2 · O 0</div>
          <p className="ccd-line">
            {say(
              '现代模型不等于当年的直接观察。',
              'A modern model is not a historical observation.',
            )}
          </p>
        </>
      ) : (
        <>
          <div className="ccd-evidence-ribbon">
            <div>
              <i className="ccd-charcoal-mark" />
              <span>{say('炭检验', 'Carbon test')}</span>
              <b>{say('未取出预期的氧', 'No expected O transfer')}</b>
            </div>
            <div style={{ opacity: d.evidenceCount >= 2 ? 1 : 0.08 }}>
              <i className="ccd-water-mark" />
              <span>{say('生成水', 'Water formed')}</span>
              <b>{say('氧可由PbO提供', 'PbO can supply O')}</b>
            </div>
            <div style={{ opacity: d.evidenceCount >= 3 ? 1 : 0.08 }}>
              <i className="ccd-combination-mark" />
              <span>{say('氢结合', 'Hydrogen combines')}</span>
              <b>{say('生成氯化氢', 'Hydrogen chloride forms')}</b>
            </div>
          </div>
          <p className="ccd-judgment">
            {d.interpretationBeat === 'judgment'
              ? say('1810 · 戴维主张：视为元素', '1810 · Davy argues: treat it as an element')
              : say('没有一条证据单独定案。', 'No single result settles the question.')}
          </p>
        </>
      )}
    </div>
  );
}
export function ChlorineTrain({
  width,
  throughput,
  hydroxide,
  progress,
  ledger,
}: {
  width: number;
  throughput: number;
  hydroxide: number;
  progress: number;
  ledger: boolean;
}) {
  const geometry = chlorineTrainGeometry(width),
    [a, b, c] = geometry.centres,
    m = chlorineGasTrain(throughput, hydroxide),
    compactLedger = ledger && width < 560,
    artScaleY = compactLedger ? 0.73 : 1,
    id = useId().replace(/:/g, '');
  return (
    <div
      data-shot={ledger ? 'absorption' : 'connected-path'}
      data-throughput={m.generated}
      data-unabsorbed={m.unabsorbed}
    >
      <div className="ccd-kicker">{say('现代装置', 'Modern apparatus')}</div>
      <svg
        viewBox={`0 0 ${width} ${compactLedger ? 137 : 186}`}
        role="img"
        aria-label={say(
          '发生瓶导管深入收集瓶下部，收集瓶上部出口接入吸收液；追踪点与管路共用几何',
          'The long inlet enters the collector bottom; its upper outlet leads into absorber liquid. Tracers use the same tube geometry',
        )}
      >
        <g transform={`scale(1,${artScaleY})`}>
          <defs>
            <linearGradient id={`${id}glass`} x1="0" x2="1">
              <stop stopColor="#edf4e3" stopOpacity=".4" />
              <stop offset=".4" stopColor="#fffdf0" stopOpacity=".8" />
              <stop offset="1" stopColor="#bdcbb0" stopOpacity=".35" />
            </linearGradient>
          </defs>
          <path
            d={`M${a - 14} 70v32a30 30 0 1 0 28 0V70`}
            fill={`url(#${id}glass)`}
            stroke="#8c9d87"
            strokeWidth="1.7"
          />
          <path d={`M${a - 25} 135q25 13 50 0q-25 32-50 0Z`} fill="#c8cea2" opacity=".65" />
          <path
            d={`M${b - 23} 70v18l-8 10v58q0 5 5 5h52q5 0 5-5V98l-8-10V70`}
            fill={`url(#${id}glass)`}
            stroke="#8c9d87"
            strokeWidth="1.7"
          />
          <path d={`M${b - 28} 101h56v54h-56Z`} fill="#b8c875" opacity={m.collected * 0.6} />
          <path
            d={`M${c - 31} 96v60q0 5 5 5h52q5 0 5-5V96`}
            fill={`url(#${id}glass)`}
            stroke="#8c9d87"
            strokeWidth="1.7"
          />
          <path d={`M${c - 28} 119h56v35q0 4-4 4h-48q-4 0-4-4Z`} fill="#b0cfc0" opacity=".6" />
          <path d={`M${a - 16} 70h32v10h-32Z M${b - 25} 70h50v10h-50Z`} fill="#bac3a8" />
          {[geometry.generatorPath, geometry.tailPath].map((p, i) => (
            <path
              key={i}
              d={p}
              stroke="#8ea18c"
              fill="none"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          ))}
          {m.generated > 0 &&
            [geometry.generator, geometry.tail].map((points, path) =>
              Array.from({ length: 4 }, (_, i) => {
                const q = pipePosition(points, (i / 4 + progress * 0.75) % 1);
                return (
                  <circle
                    key={`${path}-${i}`}
                    cx={q.x}
                    cy={q.y}
                    r="3"
                    fill="#a7b85e"
                    opacity={path ? Math.min(1, m.tail) : 1}
                  />
                );
              }),
            )}
          {m.tail > 0.01 &&
            Array.from({ length: 3 }, (_, i) => {
              const p = (progress * 2 + i / 3) % 1;
              return (
                <circle
                  key={i}
                  cx={c + 5 + i * 5}
                  cy={142 - p * 23}
                  r="2.6"
                  stroke="#8fae9b"
                  fill="none"
                  opacity={Math.sin(p * Math.PI)}
                />
              );
            })}
        </g>
        <text x={a} y={compactLedger ? 134 : 182} textAnchor="middle">
          {say('发生', 'Source')}
        </text>
        <text x={b} y={compactLedger ? 134 : 182} textAnchor="middle">
          {say('收集', 'Collector')}
        </text>
        <text x={c} y={compactLedger ? 134 : 182} textAnchor="middle">
          NaOH
        </text>
      </svg>
      {ledger ? (
        <>
          <div className="ccd-net">
            <span>Cl₂ + 2OH⁻ →</span>
            <span>Cl⁻ + ClO⁻ + H₂O</span>
          </div>
          <div className="ccd-gas-ledger">
            <span>
              {say('瓶内', 'Retained')}
              <b>{m.collected.toFixed(2)}</b>
            </span>
            <span>
              {say('已吸收', 'Absorbed')}
              <b>{m.absorbed.toFixed(2)}</b>
            </span>
            <span>
              {say('未吸收', 'Unabsorbed')}
              <b>{m.unabsorbed.toFixed(2)}</b>
            </span>
          </div>
          <div className="ccd-unit">
            {say('相对Cl₂量 · 理想混合', 'Relative Cl₂ · ideal mixing')}
          </div>
        </>
      ) : (
        <p className="ccd-line">
          {say('流入', 'Input')} {m.generated.toFixed(2)} = {say('瓶内', 'retained')}{' '}
          {m.collected.toFixed(2)} + {say('流出', 'out')} {m.tail.toFixed(2)}
        </p>
      )}
    </div>
  );
}
export default function ChemChlorineDiscovery() {
  const film = useShowcase(),
    { host, width: measured } = useSignalWidth(),
    width = Math.min(720, measured),
    en = browserLocale() === 'en',
    [view, setView] = useState(film.variant === 'history' ? 'source' : 'train'),
    [throughput, setThroughput] = useState(2),
    [hydroxide, setHydroxide] = useState(8),
    [oxide, setOxide] = useState('present'),
    [external, setExternal] = useState('dry'),
    [progress, setProgress] = useState(1),
    [claim, setClaim] = useState('transferable-oxygen');
  const d = chlorineFilm(film.chapter, film.chapterTime, en ? 'en' : 'zh'),
    current = film.watch
      ? d.chapter === 0
        ? 'record'
        : d.chapter === 1
          ? 'source'
          : d.chapter === 2
            ? 'converge'
            : 'train'
      : view,
    predict = film.watch && d.chapter === 1 && ['predict', 'reveal'].includes(d.oxygenBeat),
    oxygen = film.watch ? !predict : oxide === 'present';
  return (
    <section className="ccd" data-watch={film.watch} data-view={current}>
      <div className="ccd-stage" ref={host}>
        {current === 'record' && (
          <HistoryObservation
            width={width}
            beat={film.watch ? d.observationBeat : 'record'}
            alternative={!film.watch && claim === 'alternative'}
          />
        )}
        {current === 'source' &&
          (film.watch && d.oxygenBeat === 'record' ? (
            <OxygenEvidence width={width} />
          ) : (
            <ChlorineOxygenAccount
              width={width}
              progress={film.watch ? (predict ? 0 : d.oxygenProgress) : progress}
              oxide={oxygen}
              externalWater={!film.watch && external === 'water'}
              reveal={!film.watch || d.oxygenBeat !== 'predict'}
            />
          ))}
        {current === 'converge' && (
          <EvidenceConvergence
            width={width}
            time={film.watch ? d.time : 36}
            progress={film.watch ? d.hydrogenProgress : progress}
          />
        )}
        {current === 'train' && (
          <ChlorineTrain
            width={width}
            throughput={film.watch ? d.throughput : throughput}
            hydroxide={film.watch ? d.hydroxide : hydroxide}
            progress={film.watch ? d.flowProgress : throughput / 4}
            ledger={!film.watch || d.ledger}
          />
        )}
      </div>
      {!film.watch && (
        <div className="ccd-controls">
          <Segments
            label={say('探索视角', 'Explore')}
            value={view}
            options={[
              { value: 'record', label: say('固定证据', 'Fixed record') },
              { value: 'source', label: say('氧的来源', 'Oxygen source') },
              { value: 'converge', label: say('现代分子', 'Modern molecules') },
              { value: 'train', label: say('气体路径', 'Gas path') },
            ]}
            onChange={setView}
          />
          {current === 'record' && (
            <Segments
              label={say('待检验解释', 'Explanation to test')}
              value={claim}
              options={[
                { value: 'transferable-oxygen', label: say('可转移的氧', 'Transferable oxygen') },
                { value: 'alternative', label: say('另寻氧来源', 'Another oxygen source') },
              ]}
              onChange={setClaim}
            />
          )}
          {current === 'source' && (
            <>
              <Segments
                label={say('氧化铅输入', 'Lead oxide input')}
                value={oxide}
                options={[
                  { value: 'present', label: say('有PbO', 'PbO present') },
                  { value: 'absent', label: say('无PbO', 'No PbO') },
                ]}
                onChange={setOxide}
              />
              <Segments
                label={say('外来水', 'External water')}
                value={external}
                options={[
                  { value: 'dry', label: say('没有', 'None') },
                  { value: 'water', label: say('原有1份水', 'One initial water') },
                ]}
                onChange={setExternal}
              />
            </>
          )}
          {['source', 'converge'].includes(current) && (
            <Range
              label={say('净分配进度（非反应时间）', 'Net allocation progress (not reaction time)')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {current === 'train' && (
            <>
              <Range
                label={say('累计通过量（相对单位）', 'Total throughput (relative units)')}
                value={throughput}
                min={0}
                max={4}
                step={0.05}
                onChange={setThroughput}
              />
              <Range
                label={say('吸收液OH⁻容量（相对单位）', 'Absorber OH⁻ capacity (relative units)')}
                value={hydroxide}
                min={0}
                max={8}
                step={0.1}
                onChange={setHydroxide}
              />
            </>
          )}
          <details>
            <summary>{say('证据与模型的边界', 'Evidence and model limits')}</summary>
            <p>
              {say(
                '历史记录不随控件改变。戴维的气体结合实验仍报告少量凝结物，并随杂质减少而减少；这里没有把它改写成“测得零水”。原子轨迹只表示现代净物料分配，不是历史原子影像、同位素检验或反应机理。原有水与新生成的水分开记账。',
                'Controls do not alter the historical record. Davy still reported a little condensation in gas-combination tests, decreasing with impurities; this is not rewritten as measured zero water. Atom paths show a modern net allocation, not historical imaging, isotope tracing or a reaction mechanism. Initial and newly formed water are separate.',
              )}
            </p>
            <p>
              {say(
                '收集瓶采用单位容量的理想混合模型，吸收反应按1份Cl₂消耗2份OH⁻计。它不预测真实收集效率、传质或反应条件。',
                'Collection uses an ideal well-mixed unit-capacity model; one Cl₂ consumes two OH⁻ in the absorption account. It does not predict actual efficiency, mass transfer or reaction conditions.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
