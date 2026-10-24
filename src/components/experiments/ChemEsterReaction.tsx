import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  esterPreparation,
  esterHydrolysis,
  esterFilmState,
  esterAtomMap,
  closedEsterHydrolysis,
  UNCATALYSED_ESTER_RATE,
  ethanolBurn,
  aceticCarbonate,
  type HydrolysisMedium,
} from '../../models/chem-ester-reaction';
import { copperAlcoholCycle } from '../../models/chem-alcohol-oxidation';
import '../../styles/chem-ester-reaction.css';
export default function ChemEsterReaction() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  type ManualState = {
    chapter: number;
    progress: number;
    temperature: number;
    base: number;
    heat: string;
    catalyst: string;
    medium: HydrolysisMedium;
    water: number;
    answer: boolean | null;
  };
  const fromFilm = (): ManualState => ({
    chapter: film.chapter,
    progress: film.chapterProgress,
    temperature: 75,
    base: 1.2,
    heat: 'yes',
    catalyst: 'yes',
    medium: 'acid',
    water: 10,
    answer: null,
  });
  const [manual, setManual] = useState<ManualState | null>(null);
  const [wasWatching, setWasWatching] = useState(film.watch);
  // Capture the entire first exploration before Watch can reset its director.
  // Subsequent Watch/Explore toggles retain the learner's own scene and inputs.
  if (wasWatching !== film.watch) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(fromFilm());
  }
  const state = film.watch ? fromFilm() : (manual ?? fromFilm());
  const { chapter, progress, temperature, base, heat, catalyst, medium, water, answer } = state;
  const change = (patch: Partial<ManualState>) => setManual({ ...state, ...patch });
  const automatic = esterFilmState(chapter, progress, en ? 'en' : 'zh');
  const d =
    film.watch || answer === null
      ? automatic
      : {
          ...automatic,
          question: !answer,
          revealed: answer,
          atomBeat: 'result',
          shot: chapter === 3 ? 'atoms' : chapter === 7 ? 'closed-comparison' : automatic.shot,
          atomProgress: chapter === 3 ? (answer ? 1 : 0) : automatic.atomProgress,
          closedTime: chapter === 7 ? (answer ? 16 : 4) : automatic.closedTime,
        };
  const prep = esterPreparation(
    chapter === 3 ? 1 : d.preparation,
    heat === 'yes',
    catalyst === 'yes',
  );
  const baseAccount = esterHydrolysis(d.progress, 'base', 75, base);
  const titles = [
    ['燃烧后验证两种产物', 'Verify two combustion products'],
    ['再看铜丝的循环', 'Revisit the copper cycle'],
    ['用现象判断乙酸的酸性', 'Observe ethanoic acid acidity'],
    ['酯中的氧，来自哪里？', 'Follow the ester oxygen'],
    ['沿导管追踪混合蒸气', 'Follow the mixed vapour'],
    ['静置后出现上层酯液', 'The ester forms an upper layer'],
    ['相同起点，改变介质', 'Same start, different medium'],
    ['更快，会改变终点吗？', 'Faster: a new endpoint?'],
    ['碱被消耗，羧酸盐留下', 'Base is consumed'],
    ['只改变温度再比较', 'Change temperature alone'],
  ];
  const label = (m: HydrolysisMedium) =>
    m === 'neutral'
      ? say('中性', 'Neutral')
      : m === 'acid'
        ? say('酸性', 'Acid')
        : say('碱性', 'Base');
  return (
    <section
      className="chem-ester"
      data-ester-chapter={d.chapter}
      data-ester-shot={d.shot}
      data-ester-progress={d.progress}
      data-question={d.question}
      data-revealed={d.revealed}
    >
      <div className="chem-ester-title">{say(titles[d.chapter][0], titles[d.chapter][1])}</div>
      {d.chapter === 0 ? (
        <>
          <BurnEvidence p={d.progress} />
          <div className="chem-ester-equation">
            C₂H₅OH + 3O₂
            <br />→ 2CO₂ + 3H₂O
          </div>
        </>
      ) : null}
      {d.chapter === 1 ? (
        <>
          <CopperRecap p={d.progress} />
          <div className="chem-ester-equation">
            Cu ⇄ CuO
            <br />
            C₂H₅OH → CH₃CHO
          </div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <AcidEvidence p={d.progress} />
          <div className="chem-ester-two">
            <span>{say('石蕊变红', 'Litmus turns red')}</span>
            <span>{say('碳酸盐放出CO₂', 'Carbonate releases CO₂')}</span>
          </div>
          <div className="chem-ester-note">{say('活动设计示例', 'An activity design example')}</div>
        </>
      ) : null}
      {d.chapter === 3 || d.chapter === 4 ? (
        d.chapter === 3 && d.shot === 'atoms' ? (
          <EsterAtoms
            progress={d.atomProgress}
            en={en}
            question={d.question}
            reverse={false}
            revealed={d.revealed}
            beat={d.atomBeat}
          />
        ) : (
          <>
            {d.chapter === 3 ? (
              <ReceiverDetail model={prep} />
            ) : (
              <PreparationBench p={d.progress} model={prep} />
            )}
            <div className="chem-ester-key">
              {d.chapter === 3 ? (
                <span>{say('上层现象 → 原子去向', 'Upper layer → atom destinations')}</span>
              ) : (
                <>
                  <span>
                    <i style={{ background: '#b8b386' }} /> {say('酯', 'Ester')}
                  </span>
                  <span>
                    <i style={{ background: '#bd9b8e' }} /> {say('酸', 'Acid')}
                  </span>
                  <span>
                    <i style={{ background: '#8da8a4' }} /> {say('醇与水', 'Alcohol + water')}
                  </span>
                </>
              )}
            </div>
          </>
        )
      ) : null}
      {d.chapter === 5 ? (
        <>
          <ReceiverDetail model={prep} />
          <div className="chem-ester-two">
            <span>{say('上层：酯较多', 'Upper: ester-rich')}</span>
            <span>{say('水层：醇与乙酸盐', 'Water: alcohol + acetate')}</span>
          </div>
          <div className="chem-ester-note">
            {say('分层不等于纯品', 'Two layers do not mean purity')}
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <div className="chem-ester-bath-label">
            {film.watch ? '75' : temperature.toFixed(0)} °C · {say('同一水浴', 'One water bath')}
          </div>
          <HydrolysisBath
            states={(['neutral', 'acid', 'base'] as HydrolysisMedium[]).map((m) =>
              esterHydrolysis(
                d.hydrolysis,
                m,
                film.watch ? 75 : temperature,
                film.watch ? 1.2 : base,
              ),
            )}
          />
          <div className="chem-ester-three">
            {(['neutral', 'acid', 'base'] as HydrolysisMedium[]).map((m) => (
              <span key={m}>
                {label(m)}
                <b>
                  {(
                    esterHydrolysis(
                      d.hydrolysis,
                      m,
                      film.watch ? 75 : temperature,
                      film.watch ? 1.2 : base,
                    ).ester * 100
                  ).toFixed(0)}
                  %
                </b>
              </span>
            ))}
          </div>
          <div className="chem-ester-note">
            {say('剩余酯 · 示意计算', 'Ester remaining · illustrative')}
          </div>
        </>
      ) : null}
      {d.chapter === 7 ? (
        d.shot === 'reverse-atoms' ? (
          <EsterAtoms
            progress={d.atomProgress}
            en={en}
            question={false}
            reverse={true}
            revealed={true}
          />
        ) : (
          <ClosedComparison
            time={d.closedTime}
            water={film.watch ? 10 : water}
            catalyst={film.watch || catalyst === 'yes'}
            en={en}
            question={d.question}
            revealed={d.revealed}
          />
        )
      ) : null}
      {d.chapter === 8 ? (
        <>
          <div className="chem-ester-molecules">
            <div>CH₃COOC₂H₅ + OH⁻</div>
            <span>↓</span>
            <div>CH₃COO⁻ + C₂H₅OH</div>
          </div>
          <div
            className="chem-ester-salt"
            data-base-initial={baseAccount.initialBase}
            data-hydroxide-left={baseAccount.hydroxide}
            data-acetate={baseAccount.acetate}
            data-ester-left={baseAccount.ester}
          >
            <span>OH⁻</span>
            <div>
              <i
                style={{
                  width: `${(100 * baseAccount.hydroxide) / 3}%`,
                }}
              />
            </div>
            <span>CH₃COO⁻</span>
            <div>
              <i
                style={{
                  width: `${(100 * baseAccount.acetate) / 3}%`,
                  background: '#bca98b',
                }}
              />
            </div>
            <span>EtOAc</span>
            <div
              aria-label={`${say('酯剩余', 'Ester remaining')}: ${baseAccount.ester.toFixed(3)}`}
            >
              <i style={{ width: `${(100 * baseAccount.ester) / 3}%`, background: '#c9bd88' }} />
            </div>
          </div>
          <div className="chem-ester-note">
            {say('每水解1份酯，消耗1份OH⁻', 'One OH⁻ consumed per ester hydrolysed')}
          </div>
        </>
      ) : null}
      {d.chapter === 9 ? (
        <>
          <div className="chem-ester-bath-label">{label(film.watch ? 'acid' : medium)}</div>
          <HydrolysisBath
            states={[
              esterHydrolysis(
                d.hydrolysis,
                film.watch ? 'acid' : medium,
                25,
                film.watch ? 1.2 : base,
              ),
              esterHydrolysis(
                d.hydrolysis,
                film.watch ? 'acid' : medium,
                75,
                film.watch ? 1.2 : base,
              ),
            ]}
          />
          <div className="chem-ester-two">
            <span>25 °C</span>
            <span>75 °C</span>
          </div>
          <div className="chem-ester-note">
            {say('量、介质与示意时长相同', 'Same amounts, medium and model duration')}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-ester-controls">
          <label>
            {say('观察章节', 'Chapter')}
            <select
              aria-label={say('观察章节', 'Chapter')}
              value={chapter}
              onChange={(e) => change({ chapter: +e.target.value, answer: null })}
            >
              {titles.map((pair, i) => (
                <option key={i} value={i}>
                  {i + 1}. {say(pair[0], pair[1])}
                </option>
              ))}
            </select>
          </label>
          <Range
            label={say('过程进度', 'Progress')}
            value={progress}
            onChange={(v) => change({ progress: v, answer: null })}
            min={0}
            max={1}
            step={0.01}
          />
          {(chapter === 3 || chapter === 7) && (
            <button
              className="chem-ester-reveal"
              onClick={() => change({ answer: !(answer ?? d.revealed) })}
            >
              {(answer ?? d.revealed)
                ? say('重新预测', 'Predict again')
                : say('检验预测', 'Test prediction')}
            </button>
          )}
          {[4, 5, 7].includes(chapter) && (
            <>
              {chapter !== 7 && (
                <Segments
                  label={say('加热', 'Heating')}
                  value={heat}
                  onChange={(heat) => change({ heat })}
                  options={[
                    { value: 'yes', label: say('有', 'On') },
                    { value: 'no', label: say('无', 'Off') },
                  ]}
                />
              )}
              <Segments
                label={say('酸催化剂', 'Acid catalyst')}
                value={catalyst}
                onChange={(catalyst) =>
                  change({ catalyst, ...(chapter === 7 ? { answer: false } : {}) })
                }
                options={[
                  { value: 'yes', label: say('有', 'Present') },
                  { value: 'no', label: say('无', 'Absent') },
                ]}
              />
              {chapter === 7 ? (
                <Range
                  label={say('初始水示意份数', 'Initial water model units')}
                  value={water}
                  onChange={(water) => change({ water, answer: false })}
                  min={0}
                  max={20}
                  step={0.5}
                />
              ) : (
                <output>
                  {say('累计收集酯', 'Ester collected')}: {prep.receiver.ester.toFixed(3)}{' '}
                  {say('示意份', 'model units')}
                </output>
              )}
            </>
          )}
          {[6, 8, 9].includes(chapter) && (
            <>
              {(chapter !== 9 || medium === 'base') && (
                <Range
                  label={say('初始OH⁻示意份数', 'Initial OH⁻ model units')}
                  value={base}
                  onChange={(base) => change({ base })}
                  min={0}
                  max={3}
                  step={0.1}
                />
              )}
              {chapter === 6 ? (
                <Range
                  label={say('水浴温度', 'Bath temperature')}
                  value={temperature}
                  onChange={(temperature) => change({ temperature })}
                  min={25}
                  max={80}
                  step={1}
                />
              ) : chapter === 9 ? (
                <Segments
                  label={say('保持相同介质', 'Keep the medium fixed')}
                  value={medium}
                  onChange={(v) => change({ medium: v as HydrolysisMedium })}
                  options={(['neutral', 'acid', 'base'] as HydrolysisMedium[]).map((m) => ({
                    value: m,
                    label: label(m),
                  }))}
                />
              ) : null}
            </>
          )}
          <details>
            <summary>{say('这幅图证明到哪一步？', 'What does this diagram establish?')}</summary>
            <p>
              {say(
                '同位素结论来自教材，动画展示净原子对应。真实酸催化经过多步加成、质子转移和消除；不把移动路线当作微观录像。闭系对照同温、同初态，只让正逆速率一起改变。',
                'The isotope result comes from the textbook; motion displays net atom correspondence. Actual acid catalysis involves addition, proton transfer and elimination. The closed comparison holds temperature and starting amounts fixed while changing both rates together.',
              )}
            </p>
          </details>
        </div>
      ) : null}
    </section>
  );
}

function EsterAtoms({
  progress,
  en,
  question,
  reverse,
  revealed,
  beat = 'result',
}: {
  progress: number;
  en: boolean;
  question: boolean;
  reverse: boolean;
  revealed: boolean;
  beat?: string;
}) {
  const m = esterAtomMap(progress),
    say = (zh: string, english: string) => (en ? english : zh);
  const explanations: Record<string, [string, string]> = {
    result: ['同一个¹⁸O，留在酯的连接里', 'The same ¹⁸O stays in the ester'],
    bond: ['沿着同一个氧，C—O连接保留', 'Follow the oxygen: C—O stays'],
    net: ['按净反应，核对原子去向', 'Account for the same atoms'],
    water: ['酸羟基和醇氢 → 水', 'Acid OH + alcohol H → water'],
    ester: ['其余基团 → 酯连接', 'Remaining groups → ester bond'],
    limit: ['原子去向，不是一步碰撞', 'Atom mapping, not one collision'],
    catalyst: ['酸再生，反应仍可逆', 'Acid returns; reaction reversible'],
    collection: ['再看混合产物的收集', 'Next: collect the mixed products'],
  };
  const explanation = explanations[beat] ?? explanations.result;
  return (
    <div
      className="chem-ester-atom-panel"
      data-atom-beat={beat}
      data-net-progress={m.progress}
      data-isotope-result={question ? 'hidden' : revealed ? 'ester' : 'unrevealed'}
    >
      <div className="chem-ester-atom-context">
        {reverse
          ? say('水解 · 同一组原子返回', 'Hydrolysis · the same atoms return')
          : say('教材¹⁸O示踪 · 净连接对照', 'Textbook ¹⁸O · net mapping')}
      </div>
      <svg
        className="chem-ester-atom-svg"
        viewBox="0 0 300 225"
        role="img"
        aria-label={say(
          '连续追踪三个氧与两段碳骨架；酯键形成和水分子按净反应配平',
          'Track three oxygens and both carbon groups; ester and water connections balance the net reaction',
        )}
      >
        {m.bonds.map((b) => {
          const a = m.atoms.find((a) => a.id === b.a)!,
            z = m.atoms.find((a) => a.id === b.b)!;
          return (
            <g
              key={b.id}
              data-ester-bond={b.id}
              opacity={b.opacity}
              stroke={b.id === 'ester-link' ? '#507b77' : '#b0b9a5'}
              strokeWidth={b.id === 'ester-link' ? 3 : 2}
            >
              <line x1={a.x} y1={a.y} x2={z.x} y2={z.y} />
              {b.order === 2 && <line x1={a.x + 6} y1={a.y} x2={z.x + 6} y2={z.y} />}
            </g>
          );
        })}
        {m.atoms.map((a) => (
          <g
            key={a.id}
            data-ester-atom={a.id}
            data-carbon={a.atoms[0]}
            data-hydrogen={a.atoms[1]}
            data-oxygen={a.atoms[2]}
            data-net-product={a.product}
          >
            <rect
              x={a.x - (a.label === 'H' ? 12 : a.label.length > 2 ? 31 : 22)}
              y={a.y - 15}
              width={a.label === 'H' ? 24 : a.label.length > 2 ? 62 : 44}
              height={30}
              rx={14}
              fill={a.id === m.isotope ? '#d9ebe7' : a.id === 'acid-oxygen' ? '#f2e0d4' : '#f8f9f1'}
            />
            <text
              x={a.x}
              y={a.y + 7}
              fontSize={22}
              textAnchor="middle"
              fill={a.id === m.isotope ? '#3c726b' : '#596b54'}
            >
              {a.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="chem-ester-atom-question">
        {question
          ? say('标记氧会在酯中，还是水中？', 'Label in ester or water?')
          : reverse
            ? say('切开酯连接，醇的C—O仍保留', 'Alcohol C—O stays intact')
            : revealed
              ? say(...explanation)
              : say('认准乙醇中的这个氧', 'Follow this oxygen in ethanol')}
      </div>
      <div className="chem-ester-net-limit">
        {say('净原子记账，非一步机理', 'Net account, not a mechanism')}
      </div>
    </div>
  );
}

function ClosedComparison({
  time,
  water,
  catalyst,
  en,
  question,
  revealed,
}: {
  time: number;
  water: number;
  catalyst: boolean;
  en: boolean;
  question: boolean;
  revealed: boolean;
}) {
  const say = (zh: string, english: string) => (en ? english : zh);
  const rates = [UNCATALYSED_ESTER_RATE, catalyst ? 1 : UNCATALYSED_ESTER_RATE],
    states = rates.map((r) => closedEsterHydrolysis(time, r, water));
  const path = (rate: number) =>
    Array.from({ length: 81 }, (_, i) => {
      const t = (time * i) / 80,
        m = closedEsterHydrolysis(t, rate, water);
      return `${i ? 'L' : 'M'}${28 + (t / 16) * 245},${90 - m.extent * 60}`;
    }).join('');
  return (
    <div
      className="chem-ester-closed"
      data-closed-time={time}
      data-closed-water={water}
      data-equilibrium={revealed ? states[0].equilibrium : 'hidden'}
    >
      <div className="chem-ester-atom-context">
        {say('同温 · 同初态 · 封闭体系', 'Closed · same temperature/start')}
      </div>
      <svg
        viewBox="0 0 300 124"
        className="chem-ester-atom-svg"
        role="img"
        aria-label={say(
          '同一水解反应的快慢对照，酸催化只改变达到共同平衡的速率',
          'Rate comparison for the same hydrolysis; acid catalysis changes the approach to one equilibrium',
        )}
      >
        <path d="M28 18V90H282" stroke="#bac4ac" strokeWidth="1.5" fill="none" />
        <text x="28" y="20" fontSize="19" fill="#63765b">
          {say('水解份额', 'Hydrolysed')}
        </text>
        <text x="280" y="119" textAnchor="end" fontSize="19" fill="#63765b">
          {say('模型时间', 'Model time')}
        </text>
        {rates.map((r, i) => (
          <path
            key={i}
            data-rate-path={i}
            d={path(r)}
            stroke={i ? '#518c82' : '#b8976d'}
            strokeWidth="3"
            fill="none"
            strokeDasharray={i ? undefined : '7 4'}
          />
        ))}
        {revealed && (
          <path
            data-common-equilibrium="true"
            d={`M28 ${90 - states[0].equilibrium * 60}H278`}
            stroke="#879b79"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
        )}
      </svg>
      <div className="chem-ester-rate-key">
        <span>{say('未加酸催化剂', 'No acid catalyst')}</span>
        <span>
          {catalyst ? say('加酸催化剂', 'Acid catalyst') : say('同样未加', 'Also no catalyst')}
        </span>
      </div>
      <div className="chem-ester-closed-result">
        {question
          ? water === 0
            ? say('没有水，水解能开始吗？', 'No water: can hydrolysis start?')
            : !catalyst
              ? say('条件相同，曲线会不同吗？', 'Same conditions: same curve?')
              : say('更快的一组，会多水解吗？', 'Faster: a different final amount?')
          : revealed
            ? water === 0
              ? say('没有水，水解不发生', 'No water: no hydrolysis')
              : !catalyst
                ? say('条件相同，两条曲线重合', 'Same conditions; matching curves')
                : say('同一平衡终点，达到时间不同', 'One equilibrium; different speeds')
            : say('两向速率一起改变', 'Both reaction rates change together')}
      </div>
      <ReactionArrows p={time / 16} active={water > 0} />
      <div className="chem-ester-net-limit">
        {catalyst
          ? say('H⁺参与并再生 · 选择的理想模型', 'H⁺ returns · ideal model')
          : say('未加酸催化剂 · 相同初态', 'No added acid · same start')}
      </div>
    </div>
  );
}

function Flame({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-18 24Q-24 37-15 40H15Q24 37 18 24Z" fill="#d7c39b" />
      <path d="M0 24V9" stroke="#aaa184" strokeWidth="4" />
      <path d="M0 12Q-19-3 0-34Q-1-11 10-4Q17 8 0 12" fill="#a6bbc1" />
    </g>
  );
}
function BurnEvidence({ p }: { p: number }) {
  const m = ethanolBurn(p),
    q = Math.max(0, (p - 0.35) / 0.65);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 245"
      role="img"
      aria-label="Ethanol combustion produces water droplets in a dry collector; a separate limewater test becomes cloudy with carbon dioxide."
    >
      <Flame x={80} y={175} />
      <path
        d="M30 141V59Q30 50 41 50H119Q130 50 130 61V141"
        stroke="#b4c0ac"
        fill="none"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M${43 + i * 14} ${65 + (i % 2) * 15}q-5 9 0 10 5-1 0-10Z`}
          fill="#a7c1bb"
          opacity={Math.min(1, m.water * 3)}
        />
      ))}
      <path
        d="M203 62V190Q203 222 235 222T267 190V62"
        stroke="#b6c2ad"
        fill="#f5f6ef"
        strokeWidth="2"
      />
      <path d="M206 143H264V190Q264 219 235 219T206 190Z" fill="#d6e4d9" />
      <path d="M206 143H264V190Q264 219 235 219T206 190Z" fill="#f5f2e8" opacity={q} />
      <text x="80" y="32" fontSize="21" textAnchor="middle" fill="#879b8c">
        H₂O
      </text>
      <text x="235" y="32" fontSize="21" textAnchor="middle" fill="#879b8c">
        CO₂
      </text>
      <text x="235" y="180" fontSize="20" textAnchor="middle" fill="#9da78e">
        CaCO₃
      </text>
    </svg>
  );
}
function CopperRecap({ p }: { p: number }) {
  const m = copperAlcoholCycle(0.15 + 1.85 * p),
    col = `rgb(${[178, 120, 91].map((v, i) => Math.round(v + ([80, 80, 70][i] - v) * m.oxide)).join(',')})`;
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 240"
      role="img"
      aria-label="The same copper coil alternates between air heating and ethanol contact; black oxide is repeatedly formed and reduced."
    >
      <Flame x={80} y={180} />
      <path
        d="M191 87V204Q191 231 220 231T249 204V87"
        stroke="#b3c0aa"
        fill="#f3f5ec"
        strokeWidth="2"
      />
      <path d="M194 145H246V204Q246 228 220 228T194 204Z" fill="#d6e3d1" />
      <g transform={`translate(${m.x} ${m.y - 20})`}>
        <path d="M0-70V-20" stroke="#b28563" strokeWidth="4" />
        <path
          d="M0-20c-22 0-22 8 0 8s22 8 0 8-22 8 0 8 22 8 0 8-22 8 0 8"
          stroke={col}
          strokeWidth="5"
          fill="none"
        />
      </g>
      <path
        d="M275 60V230M260 230H290M275 105H251q-7 7 0 14H275"
        fill="none"
        stroke="#a5b29a"
        strokeWidth="2"
      />
      <text x="220" y="218" textAnchor="middle" fontSize="20" fill="#8b9a7c">
        EtOH
      </text>
      <text x="80" y="32" textAnchor="middle" fontSize="21" fill="#8b9a7c">
        O₂
      </text>
    </svg>
  );
}
function AcidEvidence({ p }: { p: number }) {
  const m = aceticCarbonate(p);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 220"
      role="img"
      aria-label="Designed examples: ethanoic acid turns litmus red and reacts with carbonate to release carbon dioxide."
    >
      {[83, 237].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x - 30} 24V170Q${x - 30} 204 ${x} 204T${x + 30} 170V24`}
            stroke="#b6c2ad"
            strokeWidth="2"
            fill="#f3f5ec"
          />
          <path
            d={`M${x - 27} 115H${x + 27}V170Q${x + 27} 201 ${x} 201T${x - 27} 170Z`}
            fill={
              i
                ? '#dce6d6'
                : `rgb(${Math.round(151 + 38 * p)},${Math.round(151 - 26 * p)},${Math.round(180 - 38 * p)})`
            }
          />
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <circle
          key={i}
          cx={222 + (i % 3) * 13}
          cy={183 - ((p * 100 + i * 12) % 110)}
          r="3"
          fill="none"
          stroke="#afc0a7"
          opacity={m.extent > 0 ? 0.7 : 0}
        />
      ))}
      <text x="83" y="75" fontSize="20" textAnchor="middle" fill="#9b8b91">
        H⁺
      </text>
      <text x="237" y="75" fontSize="20" textAnchor="middle" fill="#8c9e7e">
        CO₂↑
      </text>
    </svg>
  );
}
function PreparationBench({
  p,
  model: m,
}: {
  p: number;
  model: ReturnType<typeof esterPreparation>;
}) {
  const paths = [
      [65, 175],
      [155, 100],
      [175, 85],
      [238, 85],
      [245, 92],
      [245, 165],
    ],
    lens = paths.slice(1).map((a, i) => Math.hypot(a[0] - paths[i][0], a[1] - paths[i][1])),
    total = lens.reduce((a, b) => a + b, 0);
  const point = (q: number) => {
    let d = q * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i])
        return [
          paths[i][0] + ((paths[i + 1][0] - paths[i][0]) * d) / lens[i],
          paths[i][1] + ((paths[i + 1][1] - paths[i][1]) * d) / lens[i],
        ];
      d -= lens[i];
    }
    return paths.at(-1)!;
  };
  const oil = Math.min(30, m.washed.oil * 70);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 275"
      role="img"
      aria-label="An inclined heated reaction tube feeds one continuous delivery tube into a receiver. The delivery tip remains above the carbonate solution; an ester-rich layer accumulates above it."
    >
      <path
        d="M18 263H304M119 24V263M101 263H138M119 124L135 113"
        stroke="#a8b29a"
        strokeWidth="2"
        fill="none"
      />
      <g transform="translate(155 95) rotate(55)">
        <path
          d="M-17 8V145Q-17 163 0 163T17 145V8"
          fill="#f0efe3"
          stroke="#b9bba4"
          strokeWidth="2"
        />
        <path d="M-14 106H14V144Q14 160 0 160T-14 144Z" fill="#d9dab8" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${-8 + i * 7} ${145 + (i % 2) * 7}l5-2 1 5-5 2Z`} fill="#c1baa1" />
        ))}
        <rect x="-22" y="-3" width="44" height="14" rx="3" fill="#b5ae92" />
      </g>
      <path
        d="M107 111L138 133M111 105L142 127"
        fill="none"
        stroke="#98a486"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Flame x={33} y={222} />
      <path
        d="M155 100L175 85H238Q245 85 245 92V165"
        stroke="#b0b9a1"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M155 100L175 85H238Q245 85 245 92V165"
        stroke="#eff2e7"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M218 106V232Q218 257 245 257T272 232V106"
        fill="#f3f4e9"
        fillOpacity=".3"
        stroke="#b9c0aa"
        strokeWidth="2"
      />
      <path d="M221 200H269V232Q269 254 245 254T221 232Z" fill="#d2dfce" />
      <rect x="221" y={200 - oil} width="48" height={oil} fill="#d8d5a9" opacity=".85" />
      {m.extent > 0 && p < 0.99
        ? Array.from({ length: 8 }, (_, i) => {
            const [x, y] = point((p * 0.8 + i / 8) % 1);
            return (
              <circle key={i} cx={x} cy={y} r="3" fill={['#b8b386', '#bd9b8e', '#8da8a4'][i % 3]} />
            );
          })
        : null}
      <path
        d="M295 93V257M284 257H306M295 118H274q-7 7 0 13H295"
        stroke="#a7b399"
        fill="none"
        strokeWidth="2"
      />
      <text x="245" y="239" fontSize="20" textAnchor="middle" fill="#8b9d80">
        CO₃²⁻
      </text>
      <text x="78" y="30" fontSize="20" fill="#a09375">
        H⁺, Δ
      </text>
    </svg>
  );
}
function ReceiverDetail({ model: m }: { model: ReturnType<typeof esterPreparation> }) {
  const oil = Math.min(45, m.washed.oil * 90);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 235"
      role="img"
      aria-label="The upper layer is ester-rich. Ethanol enters the aqueous layer and acid is neutralised by carbonate; the separation is not a purity test."
    >
      <path
        d="M67 28V188Q67 222 104 222T141 188V28"
        fill="#f6f5e8"
        stroke="#b7c1a6"
        strokeWidth="2"
      />
      <path d="M70 128H138V188Q138 219 104 219T70 188Z" fill="#d3dfc9" />
      <rect x="70" y={128 - oil} width="68" height={oil} fill="#d4cda0" />
      <path d={`M145 ${128 - oil / 2}H174M145 174H174`} stroke="#bdc2ad" />
      <text x="183" y={135 - oil / 2} fontSize="21" fill="#a19a73">
        EtOAc
      </text>
      <text x="183" y="166" fontSize="20" fill="#94a285">
        EtOH
      </text>
      <text x="183" y="195" fontSize="20" fill="#94a285">
        CH₃COO⁻
      </text>
    </svg>
  );
}
function HydrolysisBath({ states }: { states: ReturnType<typeof esterHydrolysis>[] }) {
  const n = states.length;
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 215"
      role="img"
      aria-label="Equal initial ester amounts in separate labelled test tubes. The illustrative upper ester layer shrinks as hydrolysis proceeds."
    >
      <path
        d={n === 3 ? 'M20 90V198H300V90' : 'M20 90V198H150V90M170 90V198H300V90'}
        stroke="#bac8b4"
        fill="#e2ece0"
        fillOpacity=".6"
        strokeWidth="2"
      />
      {states.map((m, i) => {
        const x = n === 3 ? 65 + i * 95 : 85 + i * 150,
          layer = 33 * m.oilLayer;
        return (
          <g key={i}>
            <path
              d={`M${x - 25} 12V156Q${x - 25} 183 ${x} 183T${x + 25} 156V12`}
              fill="#f2f4e9"
              stroke="#b5bfa6"
              strokeWidth="2"
            />
            <path
              d={`M${x - 22} 103H${x + 22}V156Q${x + 22} 180 ${x} 180T${x - 22} 156Z`}
              fill="#d2dfc8"
            />
            <rect x={x - 22} y={103 - layer} width="44" height={layer} fill="#d9cfa2" />
            {layer > 0.1 ? (
              <path d={`M${x - 22} ${103 - layer}H${x + 22}`} stroke="#c2b98d" />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
function ReactionArrows({ p, active = true }: { p: number; active?: boolean }) {
  const positions = active ? [0, 1, 2].map((i) => (p + i / 3) % 1) : [];
  return (
    <svg
      className="chem-ester-flux"
      viewBox="0 0 320 80"
      aria-label="Two reaction directions remain available in acid catalysis"
    >
      <path d="M45 25H275l-10-6M275 55H45l10 6" stroke="#b2bca1" strokeWidth="2" fill="none" />
      {positions.map((q, i) => (
        <g key={i}>
          <circle cx={45 + 230 * q} cy="25" r="4" fill="#c1b08b" />
          <circle cx={275 - 230 * q} cy="55" r="4" fill="#9db3a2" />
        </g>
      ))}
    </svg>
  );
}
