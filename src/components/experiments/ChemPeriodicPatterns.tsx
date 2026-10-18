import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  ELEMENT_SYMBOLS,
  PERIOD_3,
  GROUP_1,
  periodicCell,
  periodicDirector,
  orbitalOccupancy,
  trendData,
  configurationComparison,
  halogenPrediction,
  ionizationGeometry,
  PATTERN_IDS,
  type IonElement,
} from '../../models/chem-periodic-patterns';
import '../../styles/chem-periodic-patterns.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const colors = { s: '#ad976b', p: '#8fa77b', d: '#83a7a9', ds: '#749a92', f: '#b2a3b8' };
function Occupancy({ n, slots, label }: { n: number; slots: number; label: string }) {
  return (
    <div className="cpat-orbitals">
      <span>{label}</span>
      <div>
        {orbitalOccupancy(n, slots).map((k, i) => (
          <i key={i}>{k === 2 ? '↑↓' : k === 1 ? '↑' : ''}</i>
        ))}
      </div>
    </div>
  );
}
function Plot({
  group,
  metric,
  width,
  reveal = true,
  focus = [],
}: {
  group: 'period' | 'alkali' | 'halogen';
  metric: 'en' | 'ie';
  width: number;
  reveal?: boolean;
  focus?: string[];
}) {
  const data =
    group === 'halogen' && metric === 'en'
      ? halogenPrediction(reveal)
      : trendData(group, metric).map((e) => ({ ...e, hidden: false }));
  const top = 32,
    bottom = 128,
    max = metric === 'en' ? 4 : 1600,
    x = (i: number) => 25 + (i * (width - 50)) / (data.length - 1),
    y = (v: number) => bottom - (v / max) * (bottom - top);
  const points = data
    .filter((e) => !e.hidden && e.value !== null)
    .map((e) => {
      const i = data.indexOf(e);
      return `${x(i)},${y(e.value!)}`;
    })
    .join(' ');
  return (
    <svg
      className="cpat-plot"
      viewBox={`0 0 ${width} 166`}
      role="img"
      aria-label={
        metric === 'en'
          ? say(
              '教材固定电负性数据，空白不补零',
              'Fixed textbook electronegativity values; missing is not zero',
            )
          : say(
              'NIST第一电离能数据，保留两处下降',
              'NIST first-ionization data, preserving both dips',
            )
      }
    >
      <path d={`M25 ${bottom}H${width - 25}`} className="cpat-axis" />
      <polyline points={points} className="cpat-line" />
      {data.map((e, i) => (
        <g
          key={e.symbol}
          data-record={e.symbol}
          data-hidden={e.hidden}
          data-focused={focus.includes(e.symbol)}
        >
          {focus.includes(e.symbol) ? (
            <rect
              x={x(i) - 14}
              y="18"
              width="28"
              height="142"
              rx="12"
              fill="#dfdfbc"
              opacity="0.35"
            />
          ) : null}
          {e.value !== null && !e.hidden ? (
            <>
              <line x1={x(i)} x2={x(i)} y1={bottom} y2={y(e.value)} className="cpat-stem" />
              <circle
                cx={x(i)}
                cy={y(e.value)}
                r={4.5}
                fill={metric === 'ie' && (i === 2 || i === 5) ? '#a67458' : '#688260'}
              />
              {metric === 'en' ? (
                <text x={x(i)} y={y(e.value) - 10} textAnchor="middle">
                  {e.value.toFixed(1)}
                </text>
              ) : null}
            </>
          ) : (
            <text x={x(i)} y="88" textAnchor="middle">
              {e.hidden ? '?' : '—'}
            </text>
          )}
          <text x={x(i)} y="153" textAnchor="middle">
            {e.symbol}
          </text>
        </g>
      ))}
    </svg>
  );
}
function IonRow({
  symbol,
  energy,
  progress,
  width,
  hideAnswer,
}: {
  symbol: IonElement;
  energy: number;
  progress: number;
  width: number;
  hideAnswer?: boolean;
}) {
  const s = ionizationGeometry(symbol, energy, hideAnswer ? 0 : progress, width);
  return (
    <svg
      viewBox={`0 0 ${width} 116`}
      role="img"
      aria-label={`${symbol}: ${hideAnswer ? say('电离预测尚未揭晓', 'Ionization prediction not yet revealed') : s.allowed ? say('能量允许的选定电离事件', 'A selected energetically allowed ionization') : say('能量低于电离阈值', 'Energy below the ionization threshold')}`}
      data-ion={symbol}
      data-phase={s.phase}
    >
      <text x="8" y="22" className="cpat-symbol">
        {symbol}
        {s.phase === 'bound' ? '' : '⁺'}
      </text>
      <text x="60" y="22">
        {s.record.ie.toFixed(3)} eV
      </text>
      <circle cx={s.free.x} cy={s.free.y} r="19" className="cpat-destination" />
      <text
        x={s.free.x}
        y={s.free.y + 6}
        textAnchor="middle"
        opacity={s.phase === 'free' ? 0 : 0.5}
      >
        e⁻
      </text>
      <text x="52" y="107" textAnchor="middle">
        3s
      </text>
      <text x="146" y="107" textAnchor="middle">
        3p
      </text>
      <rect x="36" y="52" width="32" height="35" rx="9" className="cpat-box" />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={s.start + i * (s.slotWidth + s.gap)}
          y="52"
          width={s.slotWidth}
          height="35"
          rx="9"
          className="cpat-box"
        />
      ))}
      {s.electrons.map((e) => (
        <g
          key={e.id}
          data-electron-id={e.id}
          data-phase={e.phase}
          data-tracked={e.tracked}
          transform={`translate(${e.x} ${e.y})`}
        >
          {e.tracked ? (
            <ellipse
              rx={e.phase === 'bound' ? 8 : 14}
              ry={e.phase === 'bound' ? 14 : 10}
              fill="#dfcba4"
              opacity=".8"
            />
          ) : null}
          <text
            textAnchor="middle"
            dy=".32em"
            className="cpat-spin"
            style={e.tracked && e.phase !== 'bound' ? { fontSize: 16 } : undefined}
          >
            {e.tracked && e.phase !== 'bound' ? 'e⁻' : e.spin === 0 ? '↑' : '↓'}
          </text>
        </g>
      ))}
    </svg>
  );
}
export default function ChemPeriodicPatterns() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    w = Math.max(260, Math.min(680, width)),
    narrow = w < 480;
  // Follow the active lesson until the learner explicitly chooses an exploration topic.
  const [mode, setMode] = useState<number | null>(null),
    [z, setZ] = useState(11),
    [expanded, setExpanded] = useState(0),
    [group, setGroup] = useState<'period' | 'alkali' | 'halogen' | null>(null),
    [metric, setMetric] = useState<'en' | 'ie'>('en'),
    [exception, setException] = useState<'Cr' | 'Cu'>('Cr'),
    [reveal, setReveal] = useState(false),
    [pair, setPair] = useState('MgAl'),
    [energy, setEnergy] = useState(6.5),
    [event, setEvent] = useState(0);
  const d = periodicDirector(
    film.watch ? film.chapter : (mode ?? film.chapter),
    film.watch ? film.chapterProgress : 1,
    film.watch ? film.chapterTime : undefined,
    browserLocale(),
  );
  const c = d.chapter,
    cell = periodicCell(film.watch ? d.z : z, film.watch ? d.expanded : expanded),
    el = PERIOD_3[Math.max(0, Math.min(7, Math.round((film.watch ? d.z : z) - 11)))],
    ex = configurationComparison(film.watch ? d.exception : exception),
    g = film.watch ? d.group : (group ?? d.group),
    m = film.watch ? d.metric : metric;
  const ionPair = film.watch ? d.ionPair : pair,
    syms: IonElement[] = ionPair === 'PS' ? ['P', 'S'] : ['Mg', 'Al'],
    prediction = film.watch ? d.shot === 'energy-predict' : false,
    ionProgress = event;
  const ionE = film.watch ? (d.energy ?? (ionPair === 'PS' ? 11 : 8)) : energy;
  const sulfurPhase = ionizationGeometry(
    'S',
    ionE,
    film.watch ? d.ionProgressByElement.S : event,
    w,
  ).phase;
  return (
    <section
      className="cpat14"
      ref={host}
      data-chapter={PATTERN_IDS[c]}
      data-shot={d.shot}
      data-watch={film.watch}
    >
      {c < 2 ? (
        <>
          <div className="cpat-table-head">
            <strong>{cell.symbol}</strong>
            <span>
              Z = {cell.z} · {say('周期', 'Period')} {cell.period}
            </span>
            <b>{c === 0 && film.watch ? 'ns¹' : '118'}</b>
          </div>
          <svg
            viewBox={`0 0 ${w} ${narrow ? 150 : 175}`}
            className="cpat-map"
            aria-label={say(
              '同一118个元素的连续重排',
              'Continuous rearrangement of the same 118 elements',
            )}
            role="img"
          >
            {ELEMENT_SYMBOLS.map((_, i) => {
              const a = periodicCell(i + 1, film.watch ? d.expanded : expanded),
                size = (w - 16) / a.columns;
              return (
                <rect
                  key={i}
                  data-element-id={a.z}
                  x={8 + a.x * size}
                  y={5 + a.y * (narrow ? 13 : 16)}
                  width={Math.max(3, size - 1.5)}
                  height="12"
                  rx="2.5"
                  fill={colors[a.block]}
                  opacity={c === 0 && film.watch ? (a.x === 0 ? 1 : 0.35) : 0.8}
                  stroke={a.z === cell.z ? '#405b4c' : 'none'}
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="cpat-note">
            {c === 0 && film.watch ? (
              cell.z === 1 ? (
                say('H：位置相同，不能等同碱金属', 'H: same column, not an alkali metal')
              ) : (
                `${cell.period}s¹ · ${say('价层重复，能层不同', 'Same outer count, different shell')}`
              )
            ) : (
              <>
                {cell.columns === 18 ? '18' : cell.columns === 32 ? '32' : '18 → 32'}{' '}
                {say('列', 'columns')} · <span style={{ color: colors.f }}>14 + 14</span>{' '}
                {say('原有元素', 'existing elements')}
              </>
            )}
          </div>
        </>
      ) : c === 2 ? (
        <>
          <div className="cpat-table-head">
            <strong>{el.symbol}</strong>
            <span>Z = {el.z}</span>
            <b>[Ne]</b>
          </div>
          <Occupancy n={el.s} slots={1} label="3s" />
          <Occupancy n={el.p} slots={3} label="3p" />
          <div className="cpat-sequence">
            {PERIOD_3.map((e) => (
              <span key={e.z} data-active={el.z === e.z}>
                {e.symbol}
              </span>
            ))}
          </div>
          <div className="cpat-note">
            {say('占据与自旋，不是飞行轨迹', 'Occupancy and spin, not flight paths')}
          </div>
        </>
      ) : c === 3 ? (
        <>
          <div className="cpat-table-head">
            <strong>{ex.symbol}</strong>
            <span>[Ar] + {ex.total - 18} e⁻</span>
          </div>
          <div className="cpat-config">
            <span>{say('口诀外推', 'Mnemonic')}</span>
            <b>3d{ex.mnemonic.d === 4 ? '⁴' : '⁹'} 4s²</b>
            <span>{say('光谱约束', 'Spectroscopy')}</span>
            <b>3d{ex.observed.d === 5 ? '⁵' : '¹⁰'} 4s¹</b>
          </div>
          <Occupancy n={ex.observed.d} slots={5} label="3d" />
          <Occupancy n={1} slots={1} label="4s" />
          <div className="cpat-note" style={{ color: colors.ds }}>
            ds · Cu Ag Au / Zn Cd Hg
          </div>
        </>
      ) : c === 7 ? (
        <>
          {film.watch && d.shot === 'observed-dips' ? (
            <>
              <div className="cpat-unit">
                {say('独立数据 · NIST · kJ/mol', 'Independent data · NIST · kJ/mol')}
              </div>
              <Plot width={w} group="period" metric="ie" />
              <div className="cpat-pair-values">
                Mg 738 → Al 578
                <br />P 1012 → S 1000
              </div>
            </>
          ) : (
            <>
              <div className="cpat-unit">
                {prediction
                  ? say('同给6.5 eV，谁能失去一个电子？', 'The same 6.5 eV: which can ionize?')
                  : d.shot === 'paired-p'
                    ? sulfurPhase === 'free'
                      ? say('S：配对电子已移出', 'S: paired electron removed')
                      : sulfurPhase === 'transfer'
                        ? say('S：配对电子正在离开', 'S: paired electron departing')
                        : say('P单占，S有一对', 'P: unpaired; S: one pair')
                    : d.shot === 's-to-p'
                      ? say('给定能量：8 eV', 'Supplied energy: 8 eV')
                      : say('能量门槛，不是成功率', 'Threshold ≠ success rate')}
              </div>
              <div className="cpat-ion-pair" data-wide={!narrow}>
                {syms.map((s) => (
                  <IonRow
                    key={s}
                    symbol={s}
                    width={narrow ? w : (w - 16) / 2}
                    energy={ionE}
                    progress={film.watch ? d.ionProgressByElement[s] : ionProgress}
                    hideAnswer={prediction}
                  />
                ))}
              </div>
              <div className="cpat-note">
                {prediction
                  ? say('先预测，随后揭晓', 'Predict before the reveal')
                  : film.watch && d.shot === 'energy-answer'
                    ? say('Al可以；Mg还差1.146 eV', 'Al is allowed; Mg lacks 1.146 eV')
                    : ionPair === 'PS'
                      ? sulfurPhase === 'free'
                        ? 'S⁺: 3p³ + e⁻'
                        : sulfurPhase === 'transfer'
                          ? say('S⁺ + e⁻（转移中）', 'S⁺ + e⁻ (in transit)')
                          : say('P单占，S有一对', 'P: unpaired; S: one pair')
                      : say('Mg：3s；Al：3p', 'Mg: 3s; Al: 3p')}
              </div>
              {!film.watch ? (
                <div className="cpat-energy-ledger">
                  {syms.map((s) => {
                    const q = ionizationGeometry(s, energy, event, w);
                    return (
                      <span key={s}>
                        {s}:{' '}
                        {q.allowed
                          ? `${q.record.ie.toFixed(3)} + ${q.kineticEV!.toFixed(3)} = ${q.energy.toFixed(3)} eV`
                          : say('不足以电离', 'Below threshold')}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          <div className="cpat-unit">
            {m === 'en'
              ? say('教材固定电负性 · 相对标度', 'Fixed textbook values · relative scale')
              : say('NIST第一电离能 · kJ/mol', 'NIST first ionization · kJ/mol')}
          </div>
          <Plot
            width={w}
            group={g}
            metric={m}
            reveal={film.watch ? d.reveal : reveal}
            focus={film.watch ? d.recordFocus : []}
          />
          <div className="cpat-note">
            {m === 'ie'
              ? say('气态基态原子 · 固定测量阈值', 'Gaseous ground-state atoms · fixed thresholds')
              : g === 'period'
                ? say('Ar未列值 ≠ 0；Na到Cl同属第三周期', 'Ar missing ≠ 0; Na–Cl share period 3')
                : g === 'alkali'
                  ? say('K = Rb = 0.8，保留舍入后的相等', 'K = Rb = 0.8: retain the rounded tie')
                  : (film.watch ? d.reveal : reveal)
                    ? say('I：2.5，方向被保留', 'I: 2.5, consistent with the direction')
                    : say('I应比Br大，还是小？', 'I: higher or lower than Br?')}
          </div>
          {g === 'period' ? (
            <div className="cpat-structure">
              n = 3 <span>Na → Cl</span> Z = 11 → 17
            </div>
          ) : g === 'alkali' ? (
            <div className="cpat-structure">
              {GROUP_1.map((e, i) => (
                <span key={e.symbol}>{i + 2}s¹</span>
              ))}
            </div>
          ) : (
            <div className="cpat-structure">2p⁵ → 3p⁵ → 4p⁵ → 5p⁵</div>
          )}
        </>
      )}
      {!film.watch ? (
        <div className="cpat-controls">
          <Segments
            label={say('比较对象', 'Comparison')}
            value={String(c < 2 ? 0 : c >= 4 && c <= 6 ? 4 : c)}
            onChange={(v) => setMode(Number(v))}
            options={[
              { value: '0', label: say('周期表', 'Table') },
              { value: '2', label: say('占据', 'Occupancy') },
              { value: '3', label: 'Cr / Cu' },
              { value: '4', label: say('固定数据', 'Fixed data') },
              { value: '7', label: say('电离', 'Ionization') },
            ]}
          />
          {c < 2 ? (
            <>
              <Range
                label={say('原子序数', 'Atomic number')}
                min={1}
                max={118}
                step={1}
                value={z}
                onChange={setZ}
              />
              <Range
                label={say('展开原有f区', 'Unfold the existing f block')}
                min={0}
                max={1}
                step={0.01}
                value={expanded}
                onChange={setExpanded}
              />
            </>
          ) : c === 2 ? (
            <Range
              label={say('第三周期原子序数', 'Period 3 atomic number')}
              min={11}
              max={18}
              step={1}
              value={Math.max(11, Math.min(18, z))}
              onChange={setZ}
            />
          ) : c === 3 ? (
            <Segments
              label={say('元素', 'Element')}
              value={exception}
              onChange={(v) => setException(v as 'Cr' | 'Cu')}
              options={[
                { value: 'Cr', label: 'Cr' },
                { value: 'Cu', label: 'Cu' },
              ]}
            />
          ) : c === 7 ? (
            <>
              <Segments
                label={say('独立样本对', 'Separate atom pair')}
                value={pair}
                onChange={(v) => {
                  setPair(v);
                  setEvent(0);
                }}
                options={[
                  { value: 'MgAl', label: 'Mg / Al' },
                  { value: 'PS', label: 'P / S' },
                ]}
              />
              <Range
                label={say('给定能量 / eV', 'Supplied energy / eV')}
                min={0}
                max={12}
                step={0.01}
                value={energy}
                onChange={setEnergy}
              />
              <Range
                label={say('选定事件进程', 'Selected event progress')}
                min={0}
                max={1}
                step={0.01}
                value={event}
                onChange={setEvent}
              />
            </>
          ) : (
            <>
              <Segments
                label={say('固定资料', 'Fixed records')}
                value={g}
                onChange={(v) => {
                  setMode(4);
                  setGroup(v as NonNullable<typeof group>);
                }}
                options={[
                  { value: 'period', label: say('第三周期', 'Period 3') },
                  { value: 'alkali', label: say('碱金属', 'Alkali metals') },
                  { value: 'halogen', label: say('卤素', 'Halogens') },
                ]}
              />
              <Segments
                label={say('物理量', 'Quantity')}
                value={metric}
                onChange={(v) => setMetric(v as typeof metric)}
                options={[
                  { value: 'en', label: say('电负性', 'Electronegativity') },
                  { value: 'ie', label: say('电离能', 'Ionization energy') },
                ]}
              />
              {g === 'halogen' && metric === 'en' ? (
                <button type="button" onClick={() => setReveal((v) => !v)}>
                  {reveal
                    ? say('重新遮住I', 'Hide I again')
                    : say('揭晓教材I值', 'Reveal textbook I')}
                </button>
              ) : null}
            </>
          )}
          <details>
            <summary>{say('这幅模型没有计算什么', 'What this model does not calculate')}</summary>
            <p>
              {say(
                '固定电负性来自教材图1-23，电离能与基态占据来自NIST。轨道框图只作定性解释，不从箭头计算实测能量。电子的移动是计数转换，不是空间轨迹；选定电离事件忽略反冲，不计算吸收概率。',
                'Electronegativities come from textbook figure 1-23; ionization thresholds and ground configurations come from NIST. Occupancy is a qualitative explanation, not a calculation of measured energies. The moving electron is a counting transition, not a spatial path; the selected event neglects recoil and does not calculate absorption probability.',
              )}
            </p>
          </details>
        </div>
      ) : null}
    </section>
  );
}
