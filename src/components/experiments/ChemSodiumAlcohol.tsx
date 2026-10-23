import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  sodiumProtic,
  compareSodium,
  hydrogenProductTest,
  alcoholFilmState,
  protonExchange,
  protonExchangeGeometry,
  DMSO_ACIDITY,
} from '../../models/chem-sodium-alcohol';
import '../../styles/chem-sodium-alcohol.css';
export default function ChemSodiumAlcohol() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [selected, setSelected] = useState<string | null>(null),
    [selectedProgress, setProgress] = useState<number | null>(null),
    [sodium, setSodium] = useState(2),
    [donors, setDonors] = useState(2),
    [water, setWater] = useState<number | null>(null),
    [answer, setAnswer] = useState<boolean | null>(null);
  const current = alcoholFilmState(film.chapter, film.chapterTime, en ? 'en' : 'zh');
  const mode = selected === null ? current.chapter : Number(selected);
  const progress = selectedProgress ?? current.progress;
  const explore = alcoholFilmState(
    mode,
    progress * [25, 29, 26, 30, 29, 64][mode],
    en ? 'en' : 'zh',
  );
  const d = film.watch
    ? current
    : {
        ...explore,
        question: answer === null ? explore.question : !answer,
        reveal: answer === null ? explore.reveal : answer,
        addedWater: water ?? explore.addedWater,
        reverse: water === null ? explore.reverse : false,
      };
  const view = d.chapter;
  const m = sodiumProtic(
      'ethanol',
      d.reactionProgress,
      film.watch || view === 3 ? 2 : sodium,
      film.watch || view === 3 ? 2 : donors,
    ),
    comparison = compareSodium(d.compareTime, film.watch ? 2 : sodium, film.watch ? 2 : donors),
    burn = hydrogenProductTest(m.hydrogen, d.burnProgress);
  const titles = [
    ['乙醇中也能产生气体', 'Gas also forms in ethanol'],
    ['燃烧产物留下水滴', 'Combustion leaves water droplets'],
    ['石灰水保持澄清', 'Limewater remains clear'],
    ['氢来自羟基', 'The hydrogen comes from O—H'],
    ['相同钠样，比较两种液体', 'Compare equal sodium samples'],
    ['独立质子交换 · DMSO', 'Proton exchange · DMSO'],
  ];
  return (
    <section
      className="chem-na-alcohol"
      data-alcohol-chapter={d.chapter}
      data-watch={film.watch}
      data-hydrogen={m.hydrogen}
      data-sodium-left={m.sodiumRemaining}
      data-water-hydrogen={comparison.water.hydrogen}
      data-ethanol-hydrogen={comparison.ethanol.hydrogen}
    >
      <div className="chem-na-heading">{say(titles[d.chapter][0], titles[d.chapter][1])}</div>
      {d.chapter === 0 || d.chapter === 1 ? (
        <>
          <AlcoholTube model={m} burn={burn} collecting={d.chapter === 1} p={d.progress} en={en} />
          <div className="chem-na-label">
            {d.chapter === 0 ? 'C₂H₅OH + Na' : say('燃烧生成的水', 'Water formed by combustion')}
          </div>
          <div className="chem-na-note">
            {d.chapter === 0
              ? say('气体经导管离开', 'Gas leaves through the outlet')
              : say('教材先检验气体纯度', 'Gas purity is checked first in the textbook')}
          </div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <svg
            className="chem-na-lime"
            viewBox="0 0 320 235"
            role="img"
            aria-label={say(
              '收集燃烧产物的小烧杯已经倒转，加入澄清石灰水，液体保持透明',
              'The collector has been turned upright; added limewater remains clear',
            )}
          >
            <path
              d="M83 47V192Q83 207 99 207H221Q237 207 237 192V47"
              fill="#eef2e8"
              fillOpacity=".5"
              stroke="#b6c4ac"
              strokeWidth="2"
            />
            <path
              d="M86 142H234V192Q234 204 220 204H100Q86 204 86 192Z"
              fill="#d5e5d9"
              opacity=".6"
            />
            <ellipse cx="160" cy="142" rx="74" ry="4" fill="#e7eee0" />
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${i % 2 ? 229 : 91} ${75 + i * 20}q-4 6 0 8 4-2 0-8Z`}
                fill="#c2d5c5"
              />
            ))}
            <text x="160" y="182" fontSize="23" textAnchor="middle" fill="#879b7a">
              Ca(OH)₂(aq)
            </text>
          </svg>
          <div className="chem-na-label">{say('没有出现CaCO₃浑浊', 'No CaCO₃ cloudiness')}</div>
          <div className="chem-na-note">
            {say('与水滴证据合看', 'Interpret alongside the water droplets')}
          </div>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <HydroxylHydrogens p={d.progress} en={en} />
          <div className="chem-na-equation">
            2C₂H₅OH + 2Na
            <br />→ 2C₂H₅ONa + H₂↑
          </div>
          <div className="chem-na-note">
            {say('EtO⁻与Na⁺ · 离子产物', 'EtO⁻ + Na⁺ · ionic products')}
          </div>
        </>
      ) : null}
      {d.chapter === 4 ? (
        <>
          <div className="chem-na-comparison">
            <div>
              <ReactionBeaker model={comparison.water} p={d.compareTime} en={en} />
              <span>H₂O</span>
            </div>
            <div>
              <ReactionBeaker model={comparison.ethanol} p={d.compareTime} en={en} />
              <span>C₂H₅OH</span>
            </div>
          </div>
          <div className="chem-na-two">
            <div>
              <span>H₂</span>
              <b>{comparison.water.hydrogen.toFixed(2)}</b>
            </div>
            <div>
              <span>H₂</span>
              <b>{comparison.ethanol.hydrogen.toFixed(2)}</b>
            </div>
          </div>
          <div className="chem-na-note">
            {say('模型份数 · 快慢仅作定性', 'Model units · qualitative timing')}
          </div>
        </>
      ) : null}
      {d.chapter === 5 ? <ProtonExchangeView d={d} en={en} watch={film.watch} /> : null}
      {!film.watch ? (
        <div className="chem-na-controls">
          <Segments
            label={say('观察', 'View')}
            value={String(mode)}
            onChange={setSelected}
            options={titles.map((pair, index) => ({
              value: String(index),
              label: say(pair[0], pair[1]),
            }))}
          />
          <Range
            label={say('过程进度', 'Progress')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {view === 0 || view === 4 ? (
            <>
              <Range
                label={say('起始Na示意份数', 'Initial Na model units')}
                value={sodium}
                min={0}
                max={4}
                step={0.2}
                onChange={setSodium}
              />
              <Range
                label={say('可反应O—H示意份数', 'Available O—H donor units')}
                value={donors}
                min={0}
                max={4}
                step={0.2}
                onChange={setDonors}
              />
              {view === 0 ? (
                <div className="chem-na-label">
                  H₂: {m.hydrogen.toFixed(2)} · Na{say('剩余', ' left')}:{' '}
                  {m.sodiumRemaining.toFixed(2)}
                </div>
              ) : null}
            </>
          ) : null}
          {view === 5 ? (
            <>
              <Range
                label={say('加入产物水的份数', 'Added product-water units')}
                value={water ?? d.addedWater}
                min={0}
                max={8}
                step={1}
                onChange={setWater}
              />
              <button className="chem-na-reveal" onClick={() => setAnswer((v) => !(v ?? d.reveal))}>
                {(answer ?? d.reveal)
                  ? say('重新预测', 'Predict again')
                  : say('检验预测', 'Test the prediction')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
function AlcoholTube({
  model: m,
  burn,
  collecting,
  p,
  en,
}: {
  model: ReturnType<typeof sodiumProtic>;
  burn: ReturnType<typeof hydrogenProductTest>;
  collecting: boolean;
  p: number;
  en: boolean;
}) {
  const radius = m.initialSodium ? 10 * Math.cbrt(m.sodiumRemaining / 2) : 0;
  return (
    <svg
      className="chem-na-tube"
      viewBox="0 0 320 280"
      role="img"
      aria-label={
        collecting
          ? en
            ? 'Hydrogen from sodium and ethanol burns at the outlet; an inverted collector receives water droplets'
            : '钠与乙醇生成的氢气在出口燃烧，倒扣的收集杯内出现水滴'
          : en
            ? 'Sodium at the bottom of an ethanol tube releases gas through a stopper and glass nozzle'
            : '试管底部的钠与乙醇反应，气体经过塞子和玻璃导管排出'
      }
    >
      <path
        d="M125 126V242Q125 263 160 263T195 242V126"
        fill="#edf2e7"
        stroke="#b1c0a8"
        strokeWidth="2"
      />
      <path d="M128 187H192V242Q192 260 160 260T128 242Z" fill="#d9e4d3" opacity=".8" />
      <rect x="121" y="118" width="78" height="17" rx="4" fill="#aeb89f" />
      <path d="M157 146V84l3-9 3 9v62" stroke="#a4b69b" fill="#edf3e4" strokeWidth="2" />
      <rect
        x={160 - radius}
        y={247 - radius}
        width={radius * 2}
        height={radius * 1.4}
        rx="2"
        fill="#a3ae98"
      />
      {m.extent > 0 && m.sodiumRemaining > 0
        ? [0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={159 + Math.sin(i + p * 4) * 8}
              cy={236 - ((p * 4 + i * 0.2) % 1) * 44}
              r="3"
              fill="#f5f9ec"
              stroke="#c2d2b6"
            />
          ))
        : null}
      <path d="M67 115V269M58 269H109M67 155H122" fill="none" stroke="#a7b49b" strokeWidth="3" />
      <path d="M121 145q12-2 12 10t-12 10" stroke="#9fad91" fill="none" strokeWidth="3" />
      {collecting ? (
        <>
          <path
            d="M91 96V20Q91 12 102 12H218Q229 12 229 20V96"
            fill="#f5f8ef"
            fillOpacity=".25"
            stroke="#bcc9b3"
            strokeWidth="2"
          />
          {burn.burnt > 0 ? (
            <path d="M160 75q-13-17 1-37 1 13 9 20 5 12-10 17Z" fill="#b5c9d0" opacity=".8" />
          ) : null}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${103 + i * 21} ${25 + (i % 2) * 9}q-3 6 0 8 3-2 0-8Z`}
              fill="#bfd4c4"
              opacity={Math.max(0, Math.min(1, burn.water * 2 - i * 0.12))}
            />
          ))}
        </>
      ) : (
        <path
          d="M155 62l5-8 5 8"
          stroke="#c4d0b9"
          fill="none"
          strokeWidth="2"
          opacity={m.extent > 0 ? 1 : 0}
        />
      )}
    </svg>
  );
}
function ReactionBeaker({
  model: m,
  p,
  en,
}: {
  model: ReturnType<typeof sodiumProtic>;
  p: number;
  en: boolean;
}) {
  const r = 10 * Math.cbrt(m.sodiumRemaining / 2),
    x = 80 + (m.floats ? Math.sin(p * 18) * 24 : 0),
    y = m.floats ? 107 : 192;
  return (
    <svg
      viewBox="0 34 155 181"
      role="img"
      aria-label={
        m.floats
          ? en
            ? 'Sodium floats at the water surface and reacts faster in this qualitative comparison'
            : '钠浮在水面，本定性比较中反应较快'
          : en
            ? 'Sodium lies below the ethanol surface and reacts more slowly in this qualitative comparison'
            : '钠位于乙醇液面下，本定性比较中反应较慢'
      }
    >
      <path
        d="M21 40V192Q21 210 39 210H119Q136 210 136 192V40"
        fill="#eff3e9"
        stroke="#b5c3ab"
        strokeWidth="2"
      />
      <path d="M24 107H133V190Q133 207 119 207H39Q24 207 24 190Z" fill="#dbe6d5" />
      <ellipse cx="78" cy="107" rx="54" ry="4" fill="#edf2e5" />
      {m.floats ? (
        <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill="#a9b59f" />
      ) : (
        <rect x={x - r} y={y - r} width={2 * r} height={r * 1.5} rx="2" fill="#a9b59f" />
      )}
      {m.extent > 0 && m.sodiumRemaining > 0
        ? Array.from({ length: m.floats ? 8 : 4 }, (_, i) => (
            <circle
              key={i}
              cx={x + Math.sin(i * 2 + p * 15) * 16}
              cy={y - 5 - ((p * 5 + i * 0.13) % 1) * (m.floats ? 20 : 72)}
              r={2.4 + (i % 3) * 0.4}
              fill="#f7faef"
              stroke="#bfd1b3"
            />
          ))
        : null}
    </svg>
  );
}
function HydroxylHydrogens({ p, en }: { p: number; en: boolean }) {
  const q = Math.max(0, Math.min(1, (p - 0.1) / 0.75));
  return (
    <svg
      className="chem-na-atoms"
      viewBox="0 0 320 240"
      role="img"
      aria-label={
        en
          ? 'Two hydroxyl hydrogens form H2; ethanol carbon-hydrogen groups remain unchanged; sodium gives Na+ counterions'
          : '两个羟基氢组成氢气，乙基中的碳氢连接保持不变，钠成为平衡电荷的钠离子'
      }
    >
      {[55, 155].map((y, i) => {
        const hx = 220 + (263 - 220) * q,
          hy = y + ((i ? 122 : 89) - y) * q;
        return (
          <g key={i}>
            <text x="65" y={y + 6} textAnchor="middle" fontSize="23" fill="#91a17f">
              C₂H₅
            </text>
            <path d={`M101 ${y}H148`} stroke="#b5c5aa" strokeWidth="4" />
            <path d={`M168 ${y}L${hx} ${hy}`} stroke="#b5c5aa" strokeWidth="4" opacity={1 - q} />
            <circle cx="160" cy={y} r="20" fill="#c7b19c" />
            <text x="160" y={y + 7} textAnchor="middle" fontSize="21" fill="#8c7763">
              O
            </text>
            <text x="178" y={y - 18} fontSize="22" fill="#9b9f87" opacity={q}>
              −
            </text>
            <circle cx={hx} cy={hy} r="15" fill="#e0e9d5" />
            <text x={hx} y={hy + 6} textAnchor="middle" fontSize="21" fill="#879b75">
              H
            </text>
            <text x="210" y={y + 7} textAnchor="middle" fontSize="20" fill="#a8b294" opacity={q}>
              Na⁺
            </text>
          </g>
        );
      })}
      <path d="M263 104V107" stroke="#aebf9f" strokeWidth="4" opacity={q} />
      <text x="263" y="184" textAnchor="middle" fontSize="20" fill="#8b9f78" opacity={q}>
        H₂
      </text>
      <text x="160" y="230" textAnchor="middle" fontSize="20" fill="#95a286">
        2Na → 2Na⁺ + 2e⁻
      </text>
    </svg>
  );
}

function ProtonExchangeView({
  d,
  en,
  watch,
}: {
  d: ReturnType<typeof alcoholFilmState>;
  en: boolean;
  watch: boolean;
}) {
  const say = (zh: string, english: string) => (en ? english : zh);
  const reversed = Boolean(d.reverse && d.reveal);
  const geometry = protonExchangeGeometry(reversed ? (d.reverseProgress ?? 1) : d.exchangeProgress);
  const m = protonExchange(d.addedWater),
    baseline = protonExchange(0);
  const molecules = !d.showRecords || reversed;
  return (
    <div
      className="chem-na-exchange"
      data-proton-phase={geometry.transfer}
      data-question={d.question}
      data-added-water={m.water0}
      data-reversed={reversed}
    >
      {d.showStructures ? (
        <div className="chem-na-environments" data-proton-view="structures">
          {[
            ['H', 'H₂O'],
            ['C₂H₅', 'C₂H₅OH'],
          ].map(([group, label]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                <i>{group}</i>—O—<em>H</em>
              </strong>
            </div>
          ))}
          <p>{say('同一类O—H，不同的邻居', 'An O—H group, a different neighbour')}</p>
        </div>
      ) : null}
      <div hidden={Boolean(d.showStructures || !molecules)}>
        <svg
          viewBox="0 0 320 176"
          className="chem-na-transfer"
          role="img"
          aria-label={say(
            '独立质子交换：旧电子对留在乙醇氧，受体电子对组成新键；氢仍为正一价',
            'Separate proton exchange: the old pair stays with ethanol oxygen, the receiving pair forms the new bond; hydrogen stays plus one',
          )}
        >
          <path d="M48 88H72" stroke="#9f9c8d" strokeWidth="3" />
          <text x="31" y="94" fontSize="20" textAnchor="middle" fill="#667d6c">
            C₂H₅
          </text>
          <line
            x1={geometry.atoms[0].x}
            y1={88}
            x2={geometry.atoms[2].x}
            y2={geometry.atoms[2].y}
            stroke="#aaac9e"
            strokeWidth="3"
            opacity={geometry.donorBond}
          />
          <line
            x1={geometry.atoms[1].x}
            y1={88}
            x2={geometry.atoms[2].x}
            y2={geometry.atoms[2].y}
            stroke="#aaac9e"
            strokeWidth="3"
            opacity={geometry.acceptorBond}
          />
          <line
            x1={geometry.atoms[1].x}
            y1={88}
            x2={geometry.atoms[3].x}
            y2={140}
            stroke="#aaac9e"
            strokeWidth="3"
          />
          {geometry.atoms.map((a) => (
            <g key={a.id} data-proton-atom={a.id} data-formal-charge={a.charge}>
              <circle
                cx={a.x}
                cy={a.y}
                r={a.element === 'O' ? 20 : 15}
                fill={a.element === 'O' ? '#c5ab99' : '#d8e5d5'}
              />
              <text x={a.x} y={a.y + 7} fontSize="21" textAnchor="middle" fill="#4c6555">
                {a.element}
              </text>
              {a.charge !== 0 ? (
                <text x={a.x + 19} y={a.y - 17} fontSize="20" fill="#4d7060">
                  {a.charge > 0 ? '+' : '−'}
                </text>
              ) : null}
            </g>
          ))}
          {geometry.pairs.map((pair, index) => (
            <g
              key={pair.id}
              data-electron-pair={pair.id}
              data-pair-focus={d.pairFocus === (index ? 'new' : 'old')}
              fill={index ? '#6b7db5' : '#b47c40'}
            >
              {d.pairFocus === (index ? 'new' : 'old') && (
                <circle
                  cx={pair.x}
                  cy={pair.y}
                  r="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  opacity=".65"
                />
              )}
              <circle cx={pair.x - 3} cy={pair.y} r="3" />
              <circle cx={pair.x + 3} cy={pair.y} r="3" />
            </g>
          ))}
          <text x="90" y="174" fontSize="19" textAnchor="middle" fill="#657360">
            {say('原电子对留下', 'Old pair stays')}
          </text>
          <text x="245" y="174" fontSize="19" textAnchor="middle" fill="#657360">
            {say('新键用受体电子', 'Receiver’s pair')}
          </text>
        </svg>
        <div className="chem-na-pair-key">
          <span>● {say('原O—H电子对', 'Original O—H pair')}</span>
          <span>● {say('受体电子对', 'Receiving pair')}</span>
        </div>
        <div className="chem-na-short-evidence">
          {reversed
            ? say('反向成键记账', 'Reverse bond account')
            : say('形式记账 · 没有H₂', 'Formal account · no H₂')}
        </div>
      </div>
      <div hidden={Boolean(d.showStructures || molecules)}>
        <div className="chem-na-records" data-fixed-record="DMSO-1980">
          <div>
            <span>C₂H₅OH</span>
            <b>{DMSO_ACIDITY.ethanol.toFixed(1)}</b>
          </div>
          <div>
            <span>H₂O</span>
            <b>{DMSO_ACIDITY.water.toFixed(1)}</b>
          </div>
        </div>
        <div className="chem-na-record-label">
          {say('1980记录 · 同介质pKₐ', '1980 records · same-medium pKₐ')}
        </div>
        <div className="chem-na-record-label">
          {say('pKₐ更小，酸性更强', 'Lower pKₐ: stronger acid')}
        </div>
        {d.showBalance ? (
          <div className="chem-na-balance" data-ethoxide={d.question ? 'hidden' : m.ethoxide}>
            <div className="chem-na-net">EtOH + OH⁻ ⇌ EtO⁻ + H₂O</div>
            {d.question ? (
              <div className="chem-na-prediction">
                {say('补入产物水，会往哪边？', 'Add product water. Which way?')}
              </div>
            ) : (
              <>
                <div className="chem-na-share">
                  <i style={{ width: `${m.ethoxide * 100}%` }} />
                  <span>EtO⁻ {m.ethoxide.toFixed(2)}</span>
                </div>
                <div className="chem-na-record-label">
                  {d.reveal
                    ? m.water0 === 0
                      ? say('未补水，平衡不变', 'No added water; no shift')
                      : say('乙氧根变少，乙醇变多', 'Less ethoxide, more ethanol')
                    : say('每份初始乙醇 · 模型份额', 'Per initial ethanol unit')}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      {!watch && d.reveal ? (
        <div
          className="chem-na-controls-result"
          data-baseline={baseline.ethoxide}
          data-equilibrium={m.ethoxide}
        >
          EtO⁻ {baseline.ethoxide.toFixed(2)} → {m.ethoxide.toFixed(2)} ·{' '}
          {say('理想稀溶液', 'Ideal dilute model')}
        </div>
      ) : null}
      <details className="chem-na-boundary">
        <summary>{say('模型的适用范围', 'Model limits')}</summary>
        <p>
          {say(
            '共同溶剂DMSO中的独立酸碱比较，不是钠的反应机理。原子和负电荷守恒；一对电子仍随各自的氧。平衡数值采用理想稀溶液近似，不用于预测金属钠的反应速度。',
            'A separate acid–base comparison in DMSO, not the mechanism of sodium reaction. Atoms and negative charge balance; each electron pair stays with its oxygen. Ideal dilute equilibrium amounts do not predict the rate of reaction with sodium metal.',
          )}
        </p>
      </details>
    </div>
  );
}
