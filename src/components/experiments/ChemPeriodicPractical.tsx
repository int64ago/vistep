import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  HALOGEN_COLOURS,
  HALOGEN_RECORDS,
  PERIOD_RECORDS,
  PERIODIC_CHAPTER_IDS,
  halogenDisplacement,
  halogenEvent,
  magnesiumNet,
  magnesiumWater,
  ammoniaProton,
  periodHydroxide,
  hydroxideNet,
  periodicDirector,
  type Halogen,
  type HydroxideMetal,
  type TestMedium,
  type NetAtom,
} from '../../models/chem-periodic-practical';
import '../../styles/chem-periodic-practical.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#53655c',
  pale = '#e7eddf';
const colour = (e: string) =>
  e === 'O'
    ? '#bc7966'
    : e === 'H'
      ? '#e8d7a9'
      : e === 'Al'
        ? '#9aaea6'
        : e === 'Mg'
          ? '#91a889'
          : (HALOGEN_COLOURS[e as Halogen] ?? '#b3c2aa');
function Atoms({ atoms }: { atoms: NetAtom[] }) {
  return (
    <>
      {atoms.map((a) => (
        <g
          key={a.id}
          data-atom-id={a.id}
          data-element={a.element}
          data-phase={a.phase}
          data-oxidation={a.charge}
          transform={`translate(${a.x} ${a.y})`}
        >
          <circle
            r={a.element === 'H' ? 10 : 17}
            fill={colour(a.element)}
            stroke="#f8faf2"
            strokeWidth="1.5"
          />
          <text textAnchor="middle" dy=".34em" fill={ink}>
            {a.element}
          </text>
        </g>
      ))}
    </>
  );
}
function Bonds({ atoms, pairs }: { atoms: NetAtom[]; pairs: [string, string][] }) {
  return (
    <>
      {pairs.map(([a, b]) => {
        const x = atoms.find((p) => p.id === a),
          y = atoms.find((p) => p.id === b);
        return x && y ? (
          <line
            key={`${a}-${b}`}
            x1={x.x}
            y1={x.y}
            x2={y.x}
            y2={y.y}
            stroke="#a99d7e"
            strokeWidth="2.5"
          />
        ) : null;
      })}
    </>
  );
}
function Title({ zh, en }: { zh: string; en: string }) {
  return <div className="cpp13-label">{say(zh, en)}</div>;
}
function Tube({
  x,
  y = 24,
  fill,
  opacity = 0.6,
  solid = 0,
  plate = false,
}: {
  x: number;
  y?: number;
  fill: string;
  opacity?: number;
  solid?: number;
  plate?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {plate ? (
        <>
          <ellipse cx="0" cy="69" rx="53" ry="49" fill="#cbd6c5" stroke="#9cac99" />
          <ellipse cx="0" cy="69" rx="46" ry="42" fill={fill} opacity={opacity} />
          <path d="M-33 48q12-18 34-15" fill="none" stroke="#fffdf3" strokeWidth="4" opacity=".8" />
        </>
      ) : (
        <>
          <path
            d="M-31 0V116a31 31 0 0 0 62 0V0"
            fill="#d7e3d744"
            stroke="#94a79a"
            strokeWidth="2"
          />
          <path d="M-28 48H28V116a28 28 0 0 1-56 0Z" fill={fill} opacity={opacity} />
          <path
            d="M-23 14V111q0 20 15 24"
            fill="none"
            stroke="#fffef7"
            strokeWidth="3"
            opacity=".75"
          />
          <ellipse cy="0" rx="31" ry="4" fill="none" stroke="#94a79a" />
        </>
      )}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse
          key={i}
          cx={-21 + ((i * 17) % 43)}
          cy={98 + ((i * 11) % 35)}
          rx="6"
          ry="3"
          fill="#fffdf2"
          stroke="#b7c4ad"
          strokeWidth=".6"
          opacity={Math.max(0, Math.min(1, (solid - i / 16) * 16))}
        />
      ))}
    </g>
  );
}
function HalogenSamples({
  width: w,
  oxidant,
  halide,
  p,
  available,
  plate,
  sequence = false,
}: {
  width: number;
  oxidant: Halogen;
  halide: Halogen;
  p: number;
  available: number;
  plate: boolean;
  sequence?: boolean;
}) {
  const h = halogenDisplacement(oxidant, halide, p, available),
    product = h.product > 0;
  const br = halogenDisplacement('Cl', 'Br', halide === 'Br' ? p : 1, available);
  const iod = halogenDisplacement('Cl', 'I', p, halide === 'Br' ? 0 : available);
  const appearance = (v: ReturnType<typeof halogenDisplacement>) => ({
    colour: HALOGEN_COLOURS[v.product > 0 ? v.halide : v.oxidant],
    alpha: Math.max(v.product, v.oxidantLeft) * 2,
  });
  const plateRows =
    sequence && oxidant === 'Cl'
      ? [
          { label: 'NaBr + Cl₂', ...appearance(br) },
          { label: halide === 'Br' ? 'NaI' : 'NaI + Cl₂', ...appearance(iod) },
          {
            label: 'Cl₂ ' + say('参照', 'reference'),
            colour: HALOGEN_COLOURS.Cl,
            alpha: available * 2,
          },
        ]
      : [
          { label: `Na${halide} + ${oxidant}₂`, ...appearance(h) },
          {
            label: oxidant + '₂ ' + say('参照', 'reference'),
            colour: HALOGEN_COLOURS[oxidant],
            alpha: available * 2,
          },
        ];
  return (
    <div data-evidence="halogen-samples">
      <Title
        zh={plate ? '白色点滴板 · 保留参照' : '水溶液 · 保留参照'}
        en={plate ? 'Spot plate · retain a reference' : 'Aqueous samples · retain a reference'}
      />
      <svg
        width={w}
        height="197"
        viewBox={`0 0 ${w} 197`}
        role="img"
        aria-label={say(
          '加入卤离子的样品与原卤素水参照',
          'Halide sample and original halogen-water reference',
        )}
      >
        {plate ? (
          <>
            <rect
              x="14"
              y="4"
              width={w - 28}
              height="184"
              rx="26"
              fill="#ebeee2"
              stroke="#d0d9c7"
            />
            {plateRows.map((r, i) => {
              const y = 35 + i * 59,
                x = w * 0.77;
              return (
                <g key={r.label} data-plate-well={i}>
                  <text x="30" y={y + 6}>
                    {r.label}
                  </text>
                  <ellipse cx={x} cy={y} rx="34" ry="25" fill="#cbd6c5" stroke="#a8b7a0" />
                  <ellipse cx={x} cy={y} rx="29" ry="21" fill={r.colour} opacity={r.alpha * 0.7} />
                  <path
                    d={`M${x - 21} ${y - 7}q6-8 20-7`}
                    fill="none"
                    stroke="#fffdf3"
                    strokeWidth="3"
                  />
                </g>
              );
            })}
          </>
        ) : (
          <>
            <Tube
              x={w * 0.28}
              fill={product ? HALOGEN_COLOURS[halide] : HALOGEN_COLOURS[oxidant]}
              opacity={Math.max(h.product, h.oxidantLeft) * 1.4}
            />
            <Tube x={w * 0.74} fill={HALOGEN_COLOURS[oxidant]} opacity={available * 1.4} />
            <text x={w * 0.28} y="189" textAnchor="middle">{`${oxidant}₂ + K${halide}`}</text>
            <text
              x={w * 0.74}
              y="189"
              textAnchor="middle"
            >{`${oxidant}₂ ${say('参照', 'reference')}`}</text>
          </>
        )}
      </svg>
      <div className="cpp13-readout" data-product={h.product}>
        {product
          ? `${halide === 'I' ? say('碘当量', 'Iodine equivalents') : halide + '₂'} ${h.product.toFixed(2)}`
          : say('尚无置换产物', 'No displacement product')}
        <span>{say('示例量 · mmol', 'Example amounts · mmol')}</span>
      </div>
    </div>
  );
}
function ElectronExchange({
  width: w,
  oxidant,
  halide,
  p,
}: {
  width: number;
  oxidant: Halogen;
  halide: Halogen;
  p: number;
}) {
  const m = halogenEvent(oxidant, halide, p, w),
    a = m.atoms;
  return (
    <div data-evidence="halogen-electrons">
      <Title zh="一组净电子账" en="One net electron account" />
      <svg
        width={w}
        height="190"
        viewBox={`0 0 ${w} 190`}
        role="img"
        aria-label={say(
          '两个卤离子各失去一个电子，卤素接受两个电子',
          'Two halide ions each lose one electron; the halogen accepts both',
        )}
      >
        <path
          d={`M${w * 0.2 + 20} 65Q${w * 0.5} 15 ${w * 0.78 - 20} 65M${w * 0.2 + 20} 130Q${w * 0.5} 180 ${w * 0.78 - 20} 130`}
          fill="none"
          stroke="#c3b38b"
          strokeDasharray="3 5"
        />
        {!m.departed && <Bonds atoms={a} pairs={[['acceptor-0', 'acceptor-1']]} />}
        {m.arrived && <Bonds atoms={a} pairs={[['donor-0', 'donor-1']]} />}
        <Atoms atoms={a} />
        {m.electrons.map((e) => (
          <g
            key={e.id}
            data-electron-id={e.id}
            data-phase={e.phase}
            transform={`translate(${e.x} ${e.y})`}
          >
            <circle r="10" fill="#8a9fbc" />
            <text textAnchor="middle" dy=".35em" fill="#fff">
              −
            </text>
          </g>
        ))}
        <text x={w * 0.2} y="22" textAnchor="middle">
          {m.departed ? '2 × 0' : '2 × −1'}
        </text>
        <text x={w * 0.78} y="22" textAnchor="middle">
          {m.arrived ? '2 × −1' : '2 × 0'}
        </text>
        <text x={w / 2} y="186" textAnchor="middle">
          {m.departed && !m.arrived
            ? say('在途电子账：−2', 'Transfer credits: −2')
            : say('含电子账：总电荷 −2', 'Including credits: total charge −2')}
        </text>
      </svg>
      <div className="cpp13-net-equation">
        {oxidant}₂ + 2{halide}⁻ → 2{oxidant}⁻ + {halide}₂
      </div>
    </div>
  );
}
function HalogenEvidence({
  count,
  prediction,
  answer,
  width: w,
}: {
  count: number;
  prediction: boolean;
  answer: boolean;
  width: number;
}) {
  return (
    <div data-evidence="fixed-comparisons" data-prediction={prediction && !answer}>
      <Title
        zh={prediction ? '反向比较 · 先预测' : '教材观察 · 固定记录'}
        en={
          prediction
            ? 'Reverse comparison · predict first'
            : 'Textbook observations · fixed records'
        }
      />
      <div className="cpp13-relations">
        {HALOGEN_RECORDS.slice(0, count).map((r, i) => (
          <div key={i} data-record-id={i}>
            <span>
              {r.oxidant}₂ + {r.halide}⁻
            </span>
            <span>→ {r.product}₂</span>
          </div>
        ))}
      </div>
      {prediction ? (
        <div className="cpp13-prediction">
          <strong>I₂ + 2Br⁻ → ?</strong>
          {answer ? (
            <>
              <span data-answer="reverse">
                {say('无明显反向置换', 'No appreciable reverse displacement')}
              </span>
              <span>{say('原有碘色仍可保留', 'The original iodine colour can remain')}</span>
            </>
          ) : (
            <span>{say('先用刚建成的次序判断', 'Use the ordering before revealing')}</span>
          )}
        </div>
      ) : (
        <svg
          width={w}
          height="85"
          viewBox={`0 0 ${w} 85`}
          aria-label={say('由观察建立氧化能力次序', 'Oxidizing ability inferred from observations')}
        >
          {count === 3 ? (
            <>
              <path d={`M45 47H${w - 40}`} stroke="#b4c1a5" strokeWidth="3" />
              <text x={w * 0.18} y="38" textAnchor="middle">
                Cl₂
              </text>
              <text x={w * 0.5} y="38" textAnchor="middle">
                Br₂
              </text>
              <text x={w * 0.82} y="38" textAnchor="middle">
                I₂
              </text>
            </>
          ) : (
            <text x={w / 2} y="38" textAnchor="middle">
              {count === 1 ? 'Cl₂ > Br₂' : 'Br₂ ? I₂'}
            </text>
          )}
          <text x={w / 2} y="77" textAnchor="middle">
            {count === 3
              ? say('氧化能力：Cl₂ > Br₂ > I₂', 'Oxidizing ability: Cl₂ > Br₂ > I₂')
              : say('完整次序仍待比较', 'The ordering is still incomplete')}
          </text>
        </svg>
      )}
    </div>
  );
}
function MagnesiumVessel({
  width: w,
  hot,
  surface,
  predict,
}: {
  width: number;
  hot: boolean;
  surface: boolean;
  predict: boolean;
}) {
  const mg = magnesiumWater(hot, 1),
    x = w / 2;
  return (
    <div
      data-evidence={
        surface ? 'magnesium-surface' : predict ? 'warming-prediction' : 'magnesium-observation'
      }
    >
      <Title
        zh={hot ? '同一份镁和水 · 加热后' : '镁与冷水 · 短时观察'}
        en={
          hot ? 'Same magnesium and water · heated' : 'Magnesium in cold water · short observation'
        }
      />
      <svg
        width={w}
        height="209"
        viewBox={`0 0 ${w} 209`}
        role="img"
        aria-label={say(
          '镁条与水的宏观观察，表面层放大为定性解释',
          'Magnesium and water, with a qualitative surface-layer enlargement',
        )}
      >
        {surface ? (
          <>
            <path
              d={`M25 139Q${w * 0.27} 126 ${w * 0.5} 137T${w - 25} 133V176H25Z`}
              fill="#91a58e"
            />
            <path
              d={`M25 132Q${w * 0.27} 119 ${w * 0.5} 130T${w - 25} 126`}
              fill="none"
              stroke="#c9cab0"
              strokeWidth="9"
            />
            <text x={w / 2} y="166" textAnchor="middle">
              Mg
            </text>
            {[0.25, 0.5, 0.75].map((v, i) => (
              <g key={i}>
                <circle cx={w * v} cy="69" r="17" fill="#c48a77" />
                <text x={w * v} y="75" textAnchor="middle">
                  O
                </text>
                <circle cx={w * v - 16} cy="49" r="10" fill="#ead9b0" />
                <circle cx={w * v + 16} cy="49" r="10" fill="#ead9b0" />
                <path d={`M${w * v} 90v25`} stroke="#b9c6bd" strokeDasharray="3 4" />
              </g>
            ))}
            <text x={w / 2} y="199" textAnchor="middle">
              {say('表面层与反应过程共同限制', 'Surface layers and reaction barriers')}
            </text>
          </>
        ) : (
          <>
            <Tube x={x} fill={mg.pink ? '#ca87a6' : '#d0dfdc'} opacity={mg.pink ? 0.3 : 0.4} />
            <path d={`M${x - 17} 151l26-63 10 4-26 63Z`} fill="#9ba99e" stroke="#718a7d" />
            {hot &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <circle
                  key={i}
                  cx={x - 13 + ((i * 13) % 38)}
                  cy={69 + ((i * 17) % 70)}
                  r={3 + (i % 3)}
                  fill="#eff4ee"
                  stroke="#a5b8b0"
                />
              ))}
            <text x={x} y="199" textAnchor="middle">
              {hot
                ? say('气泡 · 碱性变明显', 'Bubbles · alkalinity becomes visible')
                : say('不明显 ≠ 永远为零', 'Not obvious ≠ always zero')}
            </text>
          </>
        )}
      </svg>
      {predict && (
        <div className="cpp13-readout" data-prediction="warming">
          {say('保持样品，升温会怎样？', 'Keep the sample. What will heating change?')}
        </div>
      )}
    </div>
  );
}
function MagnesiumAccount({ width: w, p, end }: { width: number; p: number; end: boolean }) {
  const m = magnesiumNet(end ? 1 : p, w),
    a = m.atoms,
    pairs: [string, string][] = [
      ['O0', 'H0-stay'],
      ['O1', 'H1-stay'],
    ];
  if (p < 0.18 && !end) pairs.push(['O0', 'H0-gas'], ['O1', 'H1-gas']);
  if (m.hydrogenReady) pairs.push(['H0-gas', 'H1-gas']);
  return (
    <div data-evidence="magnesium-net">
      <Title zh="跟住同一组原子 · 净分配" en="Track the same atoms · net allocation" />
      <svg
        width={w}
        height="217"
        viewBox={`0 0 ${w} 217`}
        role="img"
        aria-label={say(
          '七个原子连续组成氢气和氢氧化镁，电子收支保持一致',
          'Seven persistent atoms form hydrogen and magnesium hydroxide with consistent electron accounting',
        )}
      >
        {m.solidReady && (
          <rect
            x={w * 0.22 - 56}
            y="76"
            width="112"
            height="99"
            rx="22"
            fill="#f2f0de77"
            stroke="#b3bca8"
            strokeDasharray="4 4"
          />
        )}
        <Bonds atoms={a} pairs={pairs} />
        <Atoms atoms={a} />
        {!m.hydrogenReady &&
          p >= 0.2 &&
          m.electrons.map((e) => (
            <g
              key={e.id}
              data-electron-id={e.id}
              data-phase={e.phase}
              transform={`translate(${e.x} ${e.y})`}
            >
              <circle r="9" fill="#8a9fbc" />
              <text textAnchor="middle" dy=".35em" fill="#fff">
                −
              </text>
            </g>
          ))}
        <text x={w * 0.22} y="201" textAnchor="middle">
          {p >= 0.2 || end ? 'Mg: 0 → +2' : 'Mg: 0'}
        </text>
        <text x={w * 0.74} y="201" textAnchor="middle">
          {m.hydrogenReady ? 'H: +1 → 0' : 'H: +1'}
        </text>
      </svg>
      <div className="cpp13-net-equation">Mg + 2H₂O → Mg(OH)₂ + H₂</div>
    </div>
  );
}
function PrecipitatePair({
  width: w,
  medium,
  amount,
  prepared = 1,
}: {
  width: number;
  medium: TestMedium;
  amount: number;
  prepared?: number;
}) {
  const states = (['Mg', 'Al'] as HydroxideMetal[]).map((m) =>
    periodHydroxide(m, medium, amount, prepared),
  );
  return (
    <div data-evidence="hydroxide-pair">
      <Title
        zh={
          medium === 'acid'
            ? '新取两份沉淀 · 加酸'
            : medium === 'base'
              ? '另取两份沉淀 · 加强碱'
              : '氨水制得的两份白色沉淀'
        }
        en={
          medium === 'acid'
            ? 'Fresh portions · add acid'
            : medium === 'base'
              ? 'Separate portions · add strong base'
              : 'Two white precipitates from ammonia'
        }
      />
      <svg
        width={w}
        height="195"
        viewBox={`0 0 ${w} 195`}
        role="img"
        aria-label={say(
          '两种沉淀在相同净试剂量下的对照',
          'Two precipitates compared at the same net reagent amount',
        )}
      >
        {states.map((s, i) => (
          <g key={s.metal} data-metal={s.metal} data-solid={s.solid} data-dissolved={s.dissolved}>
            <Tube x={w * (i ? 0.74 : 0.27)} fill="#ceded9" opacity={0.35} solid={s.solid} />
            <text x={w * (i ? 0.74 : 0.27)} y="190" textAnchor="middle">
              {s.metal}(OH){s.metal === 'Al' ? '₃' : '₂'}
            </text>
          </g>
        ))}
      </svg>
      <div className="cpp13-two-values">
        {states.map((s) => (
          <span key={s.metal}>
            {s.metal}: {say('固体', 'solid')} {s.solid.toFixed(2)}
          </span>
        ))}
      </div>
      {medium !== 'none' && (
        <div className="cpp13-small">
          {say('每份1 mmol固体 · 净试剂', '1 mmol of each solid · net reagent')} {amount.toFixed(1)}{' '}
          mmol
        </div>
      )}
    </div>
  );
}
function Ammonia({ width: w, p }: { width: number; p: number }) {
  const m = ammoniaProton(p, w);
  return (
    <div data-evidence="ammonia-proton">
      <Title zh="氢氧根从哪里来？" en="Where does hydroxide come from?" />
      <svg
        width={w}
        height="205"
        viewBox={`0 0 ${w} 205`}
        role="img"
        aria-label={say(
          '同一个氢从水转给氨，产生氢氧根和铵离子',
          'The same proton transfers from water to ammonia, producing hydroxide and ammonium',
        )}
      >
        <line x1={w * 0.25} y1="113" x2={w * 0.25 - 17} y2="94" stroke="#b7a384" strokeWidth="3" />
        {!m.transferred && p < 0.15 && (
          <line x1={w * 0.25} y1="113" x2={m.x} y2={m.y} stroke="#b7a384" strokeWidth="3" />
        )}
        <circle cx={w * 0.25} cy="113" r="20" fill="#c38570" />
        <text x={w * 0.25} y="119" textAnchor="middle">
          O
        </text>
        <circle cx={w * 0.25 - 17} cy="94" r="10" fill="#ead8ab" />
        <text x={w * 0.25 - 17} y="100" textAnchor="middle">
          H
        </text>
        <circle cx={w * 0.73} cy="113" r="28" fill="#a0b5bf" />
        <text x={w * 0.73} y="119" textAnchor="middle">
          NH₃
        </text>
        <circle data-atom-id="water-H-transfer" cx={m.x} cy={m.y} r="10" fill="#ead8ab" />
        <text x={m.x} y={m.y + 6} textAnchor="middle">
          H
        </text>
        <text x={w * 0.25} y="171" textAnchor="middle">
          {m.transferred ? 'OH⁻' : 'H₂O'}
        </text>
        <text x={w * 0.73} y="171" textAnchor="middle">
          {m.transferred ? 'NH₄⁺' : 'NH₃'}
        </text>
        <text x={w / 2} y="25" textAnchor="middle">
          {say('质子转移 · 非电子转移', 'Proton transfer · no redox')}
        </text>
      </svg>
      <div className="cpp13-net-equation">NH₃ + H₂O ⇌ NH₄⁺ + OH⁻</div>
    </div>
  );
}
function Stocks({ width: w }: { width: number }) {
  return (
    <div data-evidence="precipitate-composition">
      <Title zh="白色相似，净组成不同" en="Similar colour, different net composition" />
      <svg
        width={w}
        height="202"
        viewBox={`0 0 ${w} 202`}
        role="img"
        aria-label={say(
          '镁与两个氢氧根，铝与三个氢氧根组成中性固相',
          'Magnesium with two hydroxides and aluminium with three form neutral solid compositions',
        )}
      >
        {(['Mg', 'Al'] as const).map((m, i) => {
          const x = w * (i ? 0.75 : 0.25),
            z = i ? 3 : 2;
          return (
            <g key={m}>
              <rect
                x={x - 56}
                y="14"
                width="112"
                height="168"
                rx="25"
                fill="#f1f0e0"
                stroke="#b9c3af"
                strokeDasharray="4 4"
              />
              <circle cx={x} cy="51" r="23" fill={colour(m)} />
              <text x={x} y="57" textAnchor="middle">
                {m}
                {i ? '³⁺' : '²⁺'}
              </text>
              {Array.from({ length: z }, (_, j) => (
                <text key={j} x={x} y={95 + j * 28} textAnchor="middle">
                  OH⁻
                </text>
              ))}
            </g>
          );
        })}
        <text x={w / 2} y="201" textAnchor="middle">
          {say('固体组成比，不是分子', 'Solid ratios, not molecules')}
        </text>
      </svg>
      <div className="cpp13-two-values">
        <span>+2 − 2 = 0</span>
        <span>+3 − 3 = 0</span>
      </div>
    </div>
  );
}
function HydroxideAtoms({
  width: w,
  metal,
  medium,
  p,
}: {
  width: number;
  metal: HydroxideMetal;
  medium: 'acid' | 'base';
  p: number;
}) {
  const m = hydroxideNet(metal, medium, p, w),
    a = m.atoms,
    pairs: [string, string][] = [];
  for (let i = 0; i < m.z; i++) {
    pairs.push([`O${i}`, `H${i}-solid`]);
    if (m.finished && medium === 'acid') pairs.push([`O${i}`, `H${i}-acid`]);
  }
  if (medium === 'base') pairs.push(['O-added', 'H-added']);
  if (m.finished && medium === 'base' && metal === 'Al')
    for (const id of ['O0', 'O1', 'O2', 'O-added']) pairs.push([metal, id]);
  const metalAtom = a[0];
  return (
    <div data-evidence="hydroxide-net" data-metal={metal} data-medium={medium}>
      <Title
        zh={medium === 'acid' ? `${metal}固相 → 水与水合离子` : '铝 +3 不变 · 配离子 −1'}
        en={
          medium === 'acid'
            ? `${metal} solid → water and hydrated ions`
            : 'Al stays +3 · complex becomes −1'
        }
      />
      <svg
        width={w}
        height="222"
        viewBox={`0 0 ${w} 222`}
        role="img"
        aria-label={say(
          '追踪同一批氧和氢的净组成变化',
          'Track the same oxygen and hydrogen atoms through a net composition change',
        )}
      >
        {!m.finished && (
          <rect
            x={w * 0.26 - 61}
            y="20"
            width="113"
            height="153"
            rx="22"
            fill="#eeeddb66"
            stroke="#b8c1ad"
            strokeDasharray="4 4"
          />
        )}
        {m.finished && medium === 'base' && metal === 'Al' && (
          <>
            <rect
              x={w * 0.73 - 61}
              y="22"
              width="124"
              height="153"
              rx="28"
              fill="#d4e7de55"
              stroke="#7aa290"
            />
            <text x={w * 0.73 + 50} y="42" textAnchor="end">
              −
            </text>
          </>
        )}
        <Bonds atoms={a} pairs={pairs} />
        <Atoms atoms={a} />
        {m.finished && medium === 'acid' && (
          <text x={metalAtom.x + 25} y={metalAtom.y + 6}>
            {m.z === 3 ? '+3' : '+2'}
          </text>
        )}
        <text x={w / 2} y="218" textAnchor="middle">
          {m.finished
            ? m.formula
            : medium === 'acid'
              ? say('H⁺接近原来的氧', 'H⁺ approaches the original oxygens')
              : say('新增OH⁻进入可溶组成', 'Added OH⁻ joins the soluble composition')}
        </text>
      </svg>
    </div>
  );
}
function PeriodRow({ width: w }: { width: number }) {
  return (
    <div data-evidence="period-evidence">
      <Title zh="把证据放回第三周期" en="Return the evidence to period three" />
      <svg
        width={w}
        height="196"
        viewBox={`0 0 ${w} 196`}
        role="img"
        aria-label={say(
          '教材钠镁铝半径记录与氢氧化物性质并列',
          'Fixed textbook radius records beside sodium, magnesium and aluminium hydroxide behaviour',
        )}
      >
        {PERIOD_RECORDS.map((r, i) => {
          const x = w * (0.17 + 0.33 * i);
          return (
            <g key={r.symbol} data-period-record={r.symbol}>
              <circle cx={x} cy="75" r={r.radiusPm * 0.19} fill={pale} stroke="#97ad95" />
              <circle cx={x} cy="75" r="12" fill="#b5c4aa" />
              <text x={x} y="26" textAnchor="middle">
                {r.symbol}
              </text>
              <text x={x} y="81" textAnchor="middle">
                +{r.Z}
              </text>
              <text x={x} y="132" textAnchor="middle">
                {r.radiusPm} pm
              </text>
              <text x={x} y="169" textAnchor="middle">
                {i === 0 ? 'NaOH' : i === 1 ? 'Mg(OH)₂' : 'Al(OH)₃'}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="cpp13-readout">
        {say('同为第三层：强碱 → 两性', 'Same outer shell: strongly basic → amphoteric')}
      </div>
    </div>
  );
}
export default function ChemPeriodicPractical() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    w = Math.max(260, Math.min(760, width));
  const [mode, setMode] = useState(film.variant === 'period-comparison' ? 'magnesium' : 'halogen'),
    [oxidant, setOxidant] = useState<Halogen>('Cl'),
    [halide, setHalide] = useState<Halogen>('Br'),
    [p, setP] = useState(1),
    [available, setAvailable] = useState(0.5),
    [hot, setHot] = useState(false),
    [medium, setMedium] = useState<TestMedium>('base'),
    [dose, setDose] = useState(1),
    [focus, setFocus] = useState<HydroxideMetal>('Al'),
    [view, setView] = useState('sample');
  const d = periodicDirector(film.chapter, film.chapterProgress, film.chapterTime, browserLocale()),
    plate = film.variant === 'chapter-practical';
  let content;
  if (!film.watch) {
    if (mode === 'halogen')
      content =
        view === 'sample' ? (
          <HalogenSamples
            width={w}
            oxidant={oxidant}
            halide={halide}
            p={p}
            available={available}
            plate={plate}
          />
        ) : (
          <ElectronExchange width={w} oxidant={oxidant} halide={halide} p={p} />
        );
    else if (mode === 'magnesium')
      content =
        view === 'sample' ? (
          <MagnesiumVessel width={w} hot={hot} surface={false} predict={false} />
        ) : (
          <MagnesiumAccount width={w} p={p} end={false} />
        );
    else
      content =
        view === 'sample' || medium === 'none' ? (
          <PrecipitatePair width={w} medium={medium} amount={dose} />
        ) : (
          <HydroxideAtoms width={w} metal={focus} medium={medium as 'acid' | 'base'} p={p} />
        );
  } else {
    const s = d.shot;
    if (s === 'sample')
      content = (
        <HalogenSamples
          width={w}
          oxidant={d.oxidant}
          halide={d.halide}
          p={d.progress}
          available={0.5}
          plate={plate}
          sequence
        />
      );
    else if (s === 'electrons')
      content = <ElectronExchange width={w} oxidant={d.oxidant} halide={d.halide} p={d.event} />;
    else if (['evidence', 'rank', 'reverse-question', 'reverse-answer'].includes(s))
      content = (
        <HalogenEvidence
          width={w}
          count={Math.min(3, d.chapter + 1)}
          prediction={s.startsWith('reverse')}
          answer={d.reveal}
        />
      );
    else if (['cold', 'surface', 'warm-question', 'warm'].includes(s))
      content = (
        <MagnesiumVessel
          width={w}
          hot={s === 'warm'}
          surface={s === 'surface'}
          predict={s === 'warm-question'}
        />
      );
    else if (s.startsWith('magnesium-'))
      content = <MagnesiumAccount width={w} p={d.event} end={s === 'magnesium-account'} />;
    else if (s === 'ammonia') content = <Ammonia width={w} p={d.event} />;
    else if (s === 'stocks') content = <Stocks width={w} />;
    else if (s === 'acid-net')
      content = <HydroxideAtoms width={w} metal={d.focus} medium="acid" p={d.event} />;
    else if (s === 'base-net')
      content = <HydroxideAtoms width={w} metal="Al" medium="base" p={d.event} />;
    else if (s === 'period') content = <PeriodRow width={w} />;
    else if (s === 'acid-question')
      content = (
        <div className="cpp13-prediction cpp13-large-question" data-prediction="equal-acid">
          <strong>{say('Mg、Al各1份沉淀', 'One unit of each solid')}</strong>
          <span>{say('各加2份净H⁺', 'Add 2 net H⁺ units to each')}</span>
          <span>{say('谁会剩下？', 'Which solid remains?')}</span>
        </div>
      );
    else if (s === 'base-question')
      content = (
        <div className="cpp13-prediction cpp13-large-question" data-prediction="half-dose">
          <strong>{say('1份铝沉淀 + ½份OH⁻', '1 unit of solid + ½ unit of OH⁻')}</strong>
          <span>{say('会全部消失吗？', 'Will all of it dissolve?')}</span>
        </div>
      );
    else
      content = (
        <PrecipitatePair
          width={w}
          medium={s === 'precipitate' ? 'none' : s.startsWith('acid') ? 'acid' : 'base'}
          amount={s === 'acid-limit' ? 2 : s === 'base-answer' ? 0.5 : s.startsWith('acid') ? 3 : 1}
          prepared={s === 'precipitate' ? d.prepared : 1}
        />
      );
  }
  return (
    <section
      className="cpp13"
      data-watch={film.watch}
      data-chapter-id={PERIODIC_CHAPTER_IDS[d.chapter]}
      data-shot={film.watch ? d.shot : 'explore'}
    >
      <div ref={host} className="cpp13-stage">
        {content}
      </div>
      {!film.watch && (
        <div className="cpp13-controls">
          <Segments
            label={say('比较主题', 'Comparison')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'halogen', label: say('卤素', 'Halogens') },
              { value: 'magnesium', label: say('镁与水', 'Mg + water') },
              { value: 'hydroxide', label: say('沉淀', 'Solids') },
            ]}
          />
          <Segments
            label={say('观察层级', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'sample', label: say('样品', 'Samples') },
              { value: 'net', label: say('一组净账', 'One net event') },
            ]}
          />
          {mode === 'halogen' ? (
            <>
              <Segments
                label={say('加入的单质', 'Added halogen')}
                value={oxidant}
                onChange={setOxidant}
                options={(['Cl', 'Br', 'I'] as const).map((v) => ({ value: v, label: v + '₂' }))}
              />
              <Segments
                label={say('初始卤离子', 'Initial halide')}
                value={halide}
                onChange={setHalide}
                options={(['Cl', 'Br', 'I'] as const).map((v) => ({ value: v, label: v + '⁻' }))}
              />
              {view === 'sample' && (
                <Range
                  label={say('卤素示例量', 'Example halogen amount')}
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={available}
                  onChange={setAvailable}
                  unit="mmol"
                />
              )}
            </>
          ) : mode === 'magnesium' ? (
            view === 'sample' ? (
              <Segments
                label={say('观察条件', 'Observation conditions')}
                value={hot ? 'hot' : 'cold'}
                onChange={(v) => setHot(v === 'hot')}
                options={[
                  { value: 'cold', label: say('冷水', 'Cold water') },
                  { value: 'hot', label: say('加热后', 'After heating') },
                ]}
              />
            ) : null
          ) : (
            <>
              <Segments
                label={say('净加入试剂', 'Net reagent')}
                value={medium}
                onChange={setMedium}
                options={[
                  { value: 'none', label: say('未加', 'None') },
                  { value: 'acid', label: 'H⁺' },
                  { value: 'base', label: 'OH⁻' },
                ]}
              />
              {view === 'sample' && (
                <Range
                  label={say('扣除背景后的净量', 'Net amount after background')}
                  min={0}
                  max={3}
                  step={0.25}
                  value={dose}
                  onChange={setDose}
                  unit="mmol"
                />
              )}
              {view === 'net' && (
                <Segments
                  label={say('跟踪金属', 'Tracked metal')}
                  value={focus}
                  onChange={setFocus}
                  options={[
                    { value: 'Mg', label: 'Mg' },
                    { value: 'Al', label: 'Al' },
                  ]}
                />
              )}
            </>
          )}
          {view === 'net' || mode === 'halogen' ? (
            <Range
              label={say('净事件进程', 'Net event progress')}
              min={0}
              max={1}
              step={0.01}
              value={p}
              onChange={setP}
            />
          ) : null}
        </div>
      )}
      <details className="cpp13-details">
        <summary>{say('比较条件与模型范围', 'Conditions and model limits')}</summary>
        <p>
          {say(
            '微观图追踪一组净组成，不表示速率或逐步机理；固相框不是孤立分子。卤素颜色不是定量光谱，含碘体系按I₂当量记账。冷水镁是短时不明显，不是永远不反应。',
            'Microscopic views track one net composition, not rates or elementary mechanisms. Solid boxes are not molecules. Colours are not quantitative spectra; iodine is counted in I₂ equivalents. Cold-water magnesium is inconspicuous over a short window, not permanently unreactive.',
          )}
        </p>
        <p>
          {say(
            '沉淀控制使用扣除NH₃/NH₄⁺等背景反应后的净试剂量，不是实际滴数；微量溶解、完整配位与活度平衡省略。净事件视图展示一份完整反应的组成，具体可反应总量请看样品视图。',
            'Precipitate controls use net reagent after NH₃/NH₄⁺ and other background reactions, not laboratory drop counts. Trace solubility and full speciation are omitted. The event view shows one complete net composition; the sample view gives the total permitted extent.',
          )}
        </p>
      </details>
    </section>
  );
}
