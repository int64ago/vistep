import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  methaneSubstitution,
  methaneDirector,
  methaneChain,
  methaneDistribution,
  methanePopulation,
  METHANE_IDS,
  METHANE_FORMULAS,
  type LightCondition,
} from '../../models/chem-methane-substitution';
import '../../styles/chem-methane-substitution.css';
export default function ChemMethaneSubstitution() {
  const film = useShowcase(),
    locale = browserLocale(),
    en = locale === 'en',
    say = (zh: string, enText: string) => (en ? enText : zh),
    { host, width } = useSignalWidth();
  const [chosen, setChosen] = useState<number | null>(null),
    [light, setLight] = useState<LightCondition | null>(null),
    [progress, setProgress] = useState<number | null>(null),
    [selectedStep, setStep] = useState<number | null>(null),
    [methane, setMethane] = useState(8),
    [chlorine, setChlorine] = useState(8);
  const mode = film.watch ? film.chapter : (chosen ?? film.chapter),
    d = methaneDirector(mode, film.chapterProgress, film.chapterTime, locale),
    condition = film.watch ? d.condition : (light ?? d.condition),
    p = film.watch ? d.event : (progress ?? d.event),
    step = film.watch ? d.step : (selectedStep ?? d.step),
    chain = methaneChain(step, p, width, condition),
    fresh = condition !== 'dark',
    m = methaneSubstitution(
      film.watch ? d.reactionProgress : (progress ?? d.reactionProgress),
      fresh,
      film.watch ? 8 : chlorine,
    );
  const chainView = mode === 3 || (mode === 1 && (!film.watch || d.shot !== 'fading')),
    showPrediction = mode === 4 && (film.watch ? d.ratioQuestion : false),
    reveal = film.watch ? d.ratioReveal : true,
    pop = methanePopulation(
      film.watch ? 8 : methane,
      film.watch ? 8 : chlorine,
      film.watch ? d.event : (progress ?? d.event),
      fresh,
    );
  const stepNames = [
    ['反应前', 'Before reaction'],
    ['光使Cl—Cl断裂', 'Light breaks Cl—Cl'],
    ['Cl·夺取一个H', 'Cl· takes one H'],
    ['碳自由基与Cl₂反应', 'Carbon radical meets Cl₂'],
    ['剩下的C—H再次参与', 'A remaining C—H reacts'],
    ['新的Cl·出现', 'A new Cl· appears'],
    ['两个Cl·结合，链终止', 'Two Cl· combine: termination'],
  ];
  return (
    <section
      className="mcs17"
      ref={host}
      data-mode={mode}
      data-chapter={METHANE_IDS[mode]}
      data-shot={d.shot}
      data-light={condition}
      data-step={step}
      data-reveal={reveal}
    >
      {mode < 3 && !chainView ? (
        <>
          <div className="mcs17-vessels">
            <Vessel m={methaneSubstitution(0, false, film.watch ? 8 : chlorine)} dark en={en} />
            <Vessel m={m} dark={false} en={en} />
          </div>
          <div className="mcs17-short">
            {mode === 2
              ? say('HCl → 水相 · 油滴≠CH₃Cl', 'HCl → water · droplets ≠ CH₃Cl')
              : say('相同CH₄/Cl₂ · 仅改变光照', 'Same CH₄/Cl₂ · change only light')}
          </div>
        </>
      ) : chainView ? (
        <>
          <div className="mcs17-title">{say(...(stepNames[chain.step] as [string, string]))}</div>
          <svg
            viewBox={`0 0 ${chain.width} 215`}
            role="img"
            aria-label={say(
              '同一组11个原子依次经历光引发、两轮链传播与终止；圆点表示未成对电子。',
              'The same eleven atoms pass through initiation, two propagation cycles and termination. Dots mark unpaired electrons.',
            )}
            data-chain-stage={chain.ledgerStage}
          >
            {chain.photonVisible ? (
              <path
                d={`M${chain.width * 0.6 - 60} 25q8-8 16 0t16 0t16 0`}
                stroke="#c29b57"
                strokeWidth="2"
                fill="none"
                opacity={1 - p}
              />
            ) : null}
            {chain.bonds.map((b) => {
              const a = chain.atoms.find((x) => x.id === b.a)!,
                z = chain.atoms.find((x) => x.id === b.b)!;
              return (
                <line
                  key={b.a + b.b}
                  x1={a.x}
                  y1={a.y}
                  x2={z.x}
                  y2={z.y}
                  stroke="#a5b69f"
                  strokeWidth="3"
                  opacity={b.opacity}
                />
              );
            })}
            {chain.atoms.map((a) => (
              <g key={a.id} data-atom-id={a.id} data-element={a.element} data-radical={a.radical}>
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={a.element === 'H' ? 12 : 17}
                  fill={a.element === 'C' ? '#8c9d82' : a.element === 'Cl' ? '#c1cc91' : '#eff0e8'}
                  stroke="#a5b69f"
                />
                <text
                  x={a.x}
                  y={a.y + 5.5}
                  textAnchor="middle"
                  fill={a.element === 'C' ? '#fff' : '#52694e'}
                  fontSize="16"
                >
                  {a.element}
                </text>
                {a.radical ? <circle cx={a.x + 17} cy={a.y - 15} r="3.2" fill="#aa784d" /> : null}
              </g>
            ))}
          </svg>
          <div className="mcs17-account">
            <span>C 1 · H 4 · Cl 6</span>
            <span>
              {chain.transition
                ? say('连接转场', 'Transition')
                : say(`自由基 ${chain.radicalCount}`, `Radicals ${chain.radicalCount}`)}
            </span>
          </div>
          <div className="mcs17-short" data-lamp-on={chain.lampOn}>
            {film.watch && mode === 1 && d.shot === 'dark-control' ? (
              <span
                data-control-sample="fresh-dark"
                aria-label={say(
                  '独立的新鲜暗样本：Cl—Cl仍连接，没有自由基',
                  'Separate fresh dark sample: Cl—Cl stays bonded, without radicals',
                )}
              >
                {say('另一个暗样本：Cl—Cl', 'Other dark sample: Cl—Cl')}
              </span>
            ) : condition === 'dark' ? (
              say('新鲜暗样本：尚无链载体', 'Fresh dark sample: no chain carriers')
            ) : chain.lampOn ? (
              say('启动光存在', 'Initiating light present')
            ) : (
              say('此后没有新光', 'No new light')
            )}
          </div>
        </>
      ) : (
        <>
          {!showPrediction ? (
            <>
              <div className="mcs17-title">
                {say('同一批碳，可能再次被选中', 'The same carbon can be selected again')}
              </div>
              <div className="mcs17-carbon-grid" data-completed={pop.completed}>
                {pop.carbons.map((c) => (
                  <div key={c.id} data-carbon-id={c.id} data-substitutions={c.count}>
                    <span>{METHANE_FORMULAS[c.count]}</span>
                    <div>
                      {c.sites.map((s) => (
                        <i key={s.id} data-site-id={s.id} data-replaced={s.replaced} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mcs17-account">
                <span>
                  {say('完成取代', 'Completed')} {pop.completed}
                </span>
                <span>
                  HCl {pop.hcl} · Cl₂ {pop.remainingChlorine}
                </span>
              </div>
              <div className="mcs17-short">
                {say('固定一次抽样 · 非实验产率', 'One fixed sample · not measured yield')}
              </div>
            </>
          ) : (
            <Prediction en={en} reveal={reveal} />
          )}
        </>
      )}
      {!film.watch ? (
        <div className="mcs17-controls">
          <Segments
            label={say('观察层次', 'View')}
            value={String(mode)}
            onChange={(s) => {
              setChosen(Number(s));
              setProgress(null);
              setStep(null);
            }}
            options={[
              [0, '装置', 'Apparatus'],
              [1, '光启动', 'Initiation'],
              [3, '链传播', 'Chain'],
              [4, '分布', 'Distribution'],
            ].map(([value, zh, english]) => ({
              value: String(value),
              label: say(String(zh), String(english)),
            }))}
          />
          <Segments
            label={say('光照条件', 'Light condition')}
            value={condition}
            onChange={(s) => setLight(s as LightCondition)}
            options={[
              { value: 'light', label: say('有光', 'Light') },
              { value: 'pulse', label: say('启动后无新光', 'Pulse then dark') },
              { value: 'dark', label: say('新鲜暗样本', 'Fresh dark sample') },
            ]}
          />
          {chainView ? (
            <Range
              label={say('选定链步骤', 'Selected chain step')}
              value={step}
              min={0}
              max={6}
              step={1}
              onChange={(s) => {
                setStep(s);
                setProgress(1);
              }}
            />
          ) : null}
          <Range
            label={say('镜头进度', 'Presentation progress')}
            value={progress ?? (chainView ? d.event : mode === 4 ? d.event : d.reactionProgress)}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {mode === 4 ? (
            <>
              <Range
                label={say('甲烷份数', 'Methane units')}
                value={methane}
                min={8}
                max={32}
                step={8}
                onChange={setMethane}
              />
              <Range
                label={say('Cl₂净取代份数', 'Cl₂ net substitution units')}
                value={chlorine}
                min={0}
                max={32}
                step={1}
                onChange={setChlorine}
              />
              <div className="mcs17-expectation">
                <span>{say('等概率模型平均多取代', 'Equal-site mean: multiply substituted')}</span>
                <strong>
                  {methaneDistribution(methane, fresh ? chlorine : 0).multiple.toFixed(2)}
                </strong>
              </div>
            </>
          ) : null}
          <details>
            <summary>{say('模型的边界', 'Model boundaries')}</summary>
            <p>
              {say(
                '原子位置是反应前后连接的转场，不是实测分子轨迹。一次光引发可以启动链，但影片不计算链长或停止用时。分布假设所有剩余C—H等概率；真实氯代物反应性不同，图示数值不是实验产率。',
                'Atom paths interpolate connectivity, not measured trajectories. Initiation can start a chain; its length and decay time are not calculated. The distribution assumes equally likely remaining C—H sites. Real reactivities differ, so these numbers are not experimental yields.',
              )}
            </p>
          </details>
        </div>
      ) : null}
    </section>
  );
}
function Prediction({ en, reveal }: { en: boolean; reveal: boolean }) {
  const a = methaneDistribution(8, 8),
    b = methaneDistribution(32, 8),
    say = (x: string, y: string) => (en ? y : x);
  return (
    <div className="mcs17-prediction">
      <div className="mcs17-title">
        {reveal
          ? say('同样8份Cl₂ · 多取代平均份数', 'Same 8 Cl₂ · multiply substituted')
          : say('Cl₂仍是8份，甲烷多4倍呢？', 'Same 8 Cl₂ units; four times the methane?')}
      </div>
      <div className="mcs17-compare">
        {[a, b].map((d) => (
          <div key={d.methane}>
            <span>{d.methane} CH₄</span>
            <strong data-multiple={reveal ? d.multiple.toFixed(2) : 'hidden'}>
              {reveal ? d.multiple.toFixed(2) : '?'}
            </strong>
          </div>
        ))}
      </div>
      <div className="mcs17-short">
        {reveal
          ? say('更多未取代位点，重复选中更少', 'More untouched sites; fewer repeat selections')
          : say('哪组会有更少的多取代分子？', 'Which has fewer multiply substituted molecules?')}
      </div>
      <div className="mcs17-short">
        {say('等概率模型的平均份数 · 非产率', 'Equal-site mean amounts · not yields')}
      </div>
    </div>
  );
}
function Vessel({
  m,
  dark,
  en,
}: {
  m: ReturnType<typeof methaneSubstitution>;
  dark: boolean;
  en: boolean;
}) {
  const level = 215 - m.levelRise * 120;
  return (
    <div className="chem-methane-vessel">
      <div>
        {dark
          ? en
            ? 'Dark · cutaway'
            : '遮光 · 剖开'
          : m.illuminated
            ? en
              ? 'Light'
              : '光照'
            : en
              ? 'Fresh dark sample'
              : '新遮光样本'}
      </div>
      <svg
        viewBox="0 0 155 280"
        role="img"
        aria-label={
          dark
            ? en
              ? 'Foil-covered inverted tube; cutaway shows unchanged yellow-green gas'
              : '铝箔遮光倒置试管，剖开示意内部黄绿色气体未变化'
            : en
              ? 'Illuminated inverted tube with decreasing chlorine, droplets and liquid rise'
              : '光照倒置试管中氯气颜色变浅，出现液滴和液面上升'
        }
      >
        <defs>
          <linearGradient id={dark ? 'methane-foil' : 'methane-glass'}>
            <stop stopColor={dark ? '#acb5a7' : '#e7ede6'} />
            <stop offset=".4" stopColor={dark ? '#e6e9df' : '#fafcf7'} />
            <stop offset="1" stopColor={dark ? '#b5bdae' : '#c3d0c2'} />
          </linearGradient>
        </defs>
        <path
          d="M18 191V261Q18 269 27 269H129Q138 269 138 260V191"
          fill="#f3f6ef"
          stroke="#b3c1af"
          strokeWidth="2"
        />
        <path d="M20 215H136V260Q136 267 128 267H28Q20 267 20 259Z" fill="#d3e4db" />
        <path
          d={`M44 235V47Q44 23 78 23T112 47V235`}
          fill={`url(#${dark ? 'methane-foil' : 'methane-glass'})`}
          stroke="#a9b8a1"
          strokeWidth="2"
        />
        <path
          d={`M48 ${level}V48Q48 28 78 28T108 48V${level}Z`}
          fill="#b2bb70"
          opacity={0.06 + 0.48 * m.colour}
        />
        <path d={`M47 ${level}H109V236H47Z`} fill="#c0d9ce" />
        <ellipse cx="78" cy={level} rx="31" ry="3" fill="#e6eee3" />
        {dark ? (
          <path d="M43 37L53 33V198L43 204ZM99 30L113 42V202L99 193Z" fill="#a8b29e" opacity=".6" />
        ) : null}
        {!dark && m.heavier > 0
          ? [0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${i % 2 ? 104 : 51} ${56 + i * 26}q-5 7 0 9 5-2 0-9Z`}
                fill="#c9d1a2"
                stroke="#a8b58c"
                opacity={Math.min(1, m.heavier / (i * 0.3 + 0.3))}
              />
            ))
          : null}
        <path d="M8 17V241M5 241H35M8 82H40" stroke="#9eaa95" strokeWidth="3" fill="none" />
        <path d="M38 73Q48 69 49 82T38 91" stroke="#929f88" strokeWidth="3" fill="none" />
        {!dark && m.illuminated ? (
          <path
            d="M132 52l-12 8m14 14-14 1m12 17-12-7"
            stroke="#d5bd86"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    </div>
  );
}
