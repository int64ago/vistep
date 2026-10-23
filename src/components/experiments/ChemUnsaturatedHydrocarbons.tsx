import { useEffect, useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  bromineAddition,
  ethynePreparation,
  permanganateEvidence,
  hydrocarbonFilmState,
  acidicManganeseBudget,
  permanganateNetGeometry,
  brominationOxidationAccount,
  type UnsaturatedGas,
  type OxidationShot,
} from '../../models/chem-unsaturated-hydrocarbons';
import '../../styles/chem-unsaturated-hydrocarbons.css';
type ViewState = ReturnType<typeof hydrocarbonFilmState> & { bromine: number; copper: number };
export default function ChemUnsaturatedHydrocarbons() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const watching: ViewState = {
    ...hydrocarbonFilmState(film.chapter, film.chapterTime, en ? 'en' : 'zh'),
    bromine: film.chapter < 4 ? 1 : 2,
    copper: 0.12,
  };
  const lastWatch = useRef(watching);
  if (film.watch) lastWatch.current = watching;
  const [manual, setManual] = useState<ViewState | null>(null),
    d = film.watch ? watching : (manual ?? lastWatch.current);
  const change = (patch: Partial<ViewState>) => setManual({ ...d, ...patch });
  const actualGas = d.chapter === 4 || d.chapter === 5 ? 'ethyne' : d.gas;
  const b = bromineAddition(actualGas, d.bromine, d.exposure),
    prep = ethynePreparation(d.exposure, d.copper),
    red = permanganateEvidence(d.exposure, actualGas === 'ethyne' ? prep.outletImpurity * 2 : 0);
  const names = [
    ['火焰与黑烟', 'Flame and soot'],
    ['紫色消失，锰去了哪里？', 'Where does manganese go?'],
    ['溴的颜色逐渐消失', 'Bromine colour disappears'],
    ['碳链保留，双键发生加成', 'Addition retains the carbon skeleton'],
    ['沿装置追踪乙炔', 'Follow ethyne through the apparatus'],
    ['先排除杂质干扰', 'Remove interfering impurities'],
    ['分别观察两种试剂', 'Test the reagents separately'],
    ['净化后的气体再作燃烧观察', 'Combustion after purification'],
  ];
  return (
    <section
      className="chem-unsat"
      data-chapter={d.chapter}
      data-shot={d.shot}
      data-net-progress={d.net}
      data-exposure={d.exposure}
      data-electrons={d.electrons}
      data-revealed={d.reveal}
    >
      <div className="chem-unsat-heading">
        {d.chapter === 3 && actualGas === 'ethyne'
          ? say('三键可以分两步加成', 'A triple bond can add in two stages')
          : say(names[d.chapter][0], names[d.chapter][1])}
      </div>
      {d.chapter === 1 ? (
        <Oxidation
          shot={d.shot}
          net={d.net}
          netElectrons={d.netElectrons}
          p={d.exposure}
          electrons={d.electrons}
          reveal={d.reveal}
          budgetProgress={d.budgetProgress}
          en={en}
        />
      ) : null}
      {d.chapter === 0 || d.chapter === 7 ? (
        <>
          <Flame p={d.exposure} ethyne={actualGas === 'ethyne'} />
          <div className="chem-unsat-formula">{actualGas === 'ethene' ? 'C₂H₄' : 'C₂H₂'}</div>
          <div className="chem-unsat-note">
            {say('教材定性观察 · 非流场计算', 'Textbook observation · qualitative')}
          </div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <div className="chem-unsat-single">
            <TestTube
              colour="amber"
              remaining={b.available ? b.remaining / b.available : 0}
              p={d.exposure}
            />
          </div>
          <div className="chem-unsat-formula">{say('Br₂ / CCl₄溶液', 'Br₂ in CCl₄')}</div>
          <div className="chem-unsat-note">
            {say(
              'Br₂被消耗；颜色不是产物鉴定',
              'Br₂ is consumed; colour does not identify products',
            )}
          </div>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <Addition gas={actualGas} first={b.first} second={b.second} />
          <div className="chem-unsat-equation">
            {actualGas === 'ethene' ? 'CH₂=CH₂ + Br₂' : 'HC≡CH + 2Br₂'}
            <br />→ {actualGas === 'ethene' ? 'CH₂Br—CH₂Br' : 'CHBr₂—CHBr₂'}
          </div>
          <div className="chem-unsat-note">
            {say('净连接：C、H保留', 'Net connectivity: C and H retained')}
          </div>
        </>
      ) : null}
      {d.chapter === 4 || d.chapter === 5 ? (
        <>
          <Preparation p={d.exposure} prep={prep} zoom={d.chapter === 5} />
          {d.chapter === 4 ? (
            <div className="chem-unsat-equation">
              CaC₂ + 2H₂O
              <br />→ Ca(OH)₂ + C₂H₂↑
            </div>
          ) : (
            <>
              <div className="chem-unsat-equation">Cu²⁺ + H₂S → CuS↓ + 2H⁺</div>
              <div className="chem-unsat-purity">
                <span>{say('出口H₂S示意余量', 'Outlet H₂S model units')}</span>
                <b>{prep.outletImpurity.toFixed(3)}</b>
              </div>
            </>
          )}
          <div className="chem-unsat-note">
            {say('发生 → 净化 → 独立检验', 'Generate → purify → separate tests')}
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <div className="chem-unsat-tests">
            <div>
              <TestTube colour="purple" remaining={red.remaining} p={d.exposure} />
              <span>{say('酸性KMnO₄', 'Acidic KMnO₄')}</span>
            </div>
            <div>
              <TestTube
                colour="amber"
                remaining={b.available ? b.remaining / b.available : 0}
                p={d.exposure}
              />
              <span>Br₂ / CCl₄</span>
            </div>
          </div>
          <div className="chem-unsat-equation">
            HC≡CH + 2Br₂
            <br />→ CHBr₂—CHBr₂
          </div>
          <div className="chem-unsat-note">
            {say('两份样品，分别检验', 'Two samples, tested separately')}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-unsat-controls">
          <Segments
            label={say('观察', 'View')}
            value={String(d.chapter)}
            onChange={(v) => {
              const c = Number(v),
                next = hydrocarbonFilmState(c, 0, en ? 'en' : 'zh');
              change({
                ...next,
                exposure: 0.75,
                net: 0.75,
                netElectrons: 0.75,
                bromine: c < 4 ? 1 : 2,
              });
            }}
            options={names.map((n, i) => ({ value: String(i), label: say(n[0], n[1]) }))}
          />
          {d.chapter === 1 ? (
            <>
              <Segments
                label={say('解释层次', 'Explanation')}
                value={d.shot}
                onChange={(v) =>
                  change({ shot: v as OxidationShot, reveal: v === 'budget', budgetProgress: 1 })
                }
                options={[
                  { value: 'observation', label: say('观察', 'Observation') },
                  { value: 'net', label: say('净收支', 'Net account') },
                  { value: 'budget', label: say('电子预算', 'Electron budget') },
                  { value: 'contrast', label: say('两种褪色', 'Two colour changes') },
                ]}
              />
              {d.shot === 'net' ? (
                <Range
                  label={say('净账转场', 'Net-account transition')}
                  min={0}
                  max={1}
                  step={0.01}
                  value={d.net}
                  onChange={(v) => change({ net: v, netElectrons: v })}
                />
              ) : null}
              {d.shot === 'budget' || d.shot === 'question' ? (
                <>
                  <Range
                    label={say('电子当量 / mmol', 'Electron equivalents / mmol')}
                    min={0}
                    max={10}
                    step={0.1}
                    value={d.electrons}
                    onChange={(v) => change({ electrons: v })}
                  />
                  {!d.reveal ? (
                    <button
                      className="chem-unsat-reveal"
                      onClick={() => change({ reveal: true, shot: 'budget', budgetProgress: 1 })}
                    >
                      {say('检验预测', 'Test prediction')}
                    </button>
                  ) : null}
                </>
              ) : null}
              <p>
                {say(
                  '电子供给是指定的净预算，不能换算成乙烯体积。8 mmol H⁺保证此账的酸量足够；并不预测pH、产率或动力学。',
                  'Electron supply is an assigned net budget, not an ethene volume. The account has 8 mmol H⁺ available; it predicts neither pH, yield nor kinetics.',
                )}
              </p>
            </>
          ) : (
            <>
              <Range
                label={say('示意进度', 'Illustrative progress')}
                value={d.exposure}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => change({ exposure: v })}
              />
              {d.chapter === 3 ? (
                <>
                  <Segments
                    label={say('气体', 'Gas')}
                    value={actualGas}
                    onChange={(v) => change({ gas: v as UnsaturatedGas })}
                    options={[
                      { value: 'ethene', label: 'C₂H₄' },
                      { value: 'ethyne', label: 'C₂H₂' },
                    ]}
                  />
                  <Range
                    label={say('每份烃的Br₂份数', 'Br₂ units per hydrocarbon unit')}
                    value={d.bromine}
                    min={0}
                    max={3}
                    step={0.1}
                    onChange={(v) => change({ bromine: v })}
                  />
                  <div>
                    {say('剩余Br₂份数', 'Br₂ remaining')}: {b.remaining.toFixed(2)}
                  </div>
                </>
              ) : null}
              {d.chapter === 4 || d.chapter === 5 ? (
                <Range
                  label={say('Cu²⁺可用份数', 'Available Cu²⁺ model units')}
                  value={d.copper}
                  min={0}
                  max={0.2}
                  step={0.01}
                  onChange={(v) => change({ copper: v })}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function Oxidation({
  shot,
  net,
  netElectrons,
  p,
  electrons,
  reveal,
  budgetProgress,
  en,
}: {
  shot: OxidationShot;
  net: number;
  netElectrons: number;
  p: number;
  electrons: number;
  reveal: boolean;
  budgetProgress: number;
  en: boolean;
}) {
  const say = (a: string, b: string) => (en ? b : a);
  if (shot === 'observation')
    return (
      <div className="chem-unsat-observation">
        <div className="chem-unsat-single">
          <TestTube colour="purple" remaining={1 - Math.min(1, p * 12)} p={Math.min(1, p * 12)} />
        </div>
        <div className="chem-unsat-note">
          {say('P67观察：紫色变浅', 'P67 observation: purple fades')}
        </div>
      </div>
    );
  if (shot === 'net') return <NetAccount progress={net} electronProgress={netElectrons} en={en} />;
  if (shot === 'contrast') {
    const ox = brominationOxidationAccount();
    return (
      <div className="chem-unsat-contrast">
        <div className="chem-unsat-comparison-row">
          <span>MnO₄⁻ → Mn²⁺</span>
          <b>5 e⁻</b>
        </div>
        <svg
          viewBox="0 0 280 140"
          role="img"
          aria-label={say(
            '同一碳骨架和四个氢保留，两个溴接入。碳与溴的氧化数也发生变化。',
            'The carbon skeleton and four hydrogens remain as two bromines join. Carbon and bromine oxidation states also change.',
          )}
        >
          <path
            d="M90 61H190M90 61L65 30M90 61L65 94M190 61L215 30M190 61L215 94M90 61V117M190 61V117"
            stroke="#a3af95"
            strokeWidth="3"
          />
          {[
            [90, 61, 'C'],
            [190, 61, 'C'],
            [65, 30, 'H'],
            [65, 94, 'H'],
            [215, 30, 'H'],
            [215, 94, 'H'],
            [90, 117, 'Br'],
            [190, 117, 'Br'],
          ].map(([x, y, l], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={l === 'H' ? 12 : 16}
                fill={l === 'Br' ? '#bf9775' : l === 'C' ? '#90a88f' : '#e1e7d9'}
              />
              <text x={x} y={Number(y) + 5} textAnchor="middle" fontSize="16" fill="#3f4d3e">
                {l}
              </text>
            </g>
          ))}
        </svg>
        <div className="chem-unsat-comparison-row">
          <span>
            C {ox.carbonBefore[0]} → {ox.carbonAfter[0]}
          </span>
          <span>Br 0 → −1</span>
        </div>
        <p>{say('加成也可发生氧化还原', 'Addition can also be redox')}</p>
      </div>
    );
  }
  const m = acidicManganeseBudget(electrons, reveal ? budgetProgress : 0);
  return (
    <div className="chem-unsat-budget" data-budget={JSON.stringify(m)}>
      <div className="chem-unsat-budget-input">
        <span>
          MnO₄⁻<b>1 mmol</b>
        </span>
        <span>
          {say('电子当量', 'Electron equivalents')}
          <b>{electrons.toFixed(1)} mmol</b>
        </span>
      </div>
      {!reveal ? (
        <div className="chem-unsat-question">
          {say('5 e⁻ / MnO₄⁻', '5 e⁻ / MnO₄⁻')}
          <strong>{say('能够全部转化吗？', 'Can all of it react?')}</strong>
        </div>
      ) : (
        <>
          <div
            className="chem-unsat-amount-bar"
            role="img"
            aria-label={say(
              `高锰酸根剩余${m.permanganate.toFixed(2)}毫摩尔，二价锰${m.manganeseII.toFixed(2)}毫摩尔`,
              `Permanganate remaining ${m.permanganate.toFixed(2)} mmol; manganese two ${m.manganeseII.toFixed(2)} mmol`,
            )}
          >
            <span style={{ flex: m.permanganate, background: '#947298' }} />
            <span style={{ flex: m.manganeseII, background: '#d3decd' }} />
          </div>
          <div className="chem-unsat-budget-result">
            <span>
              MnO₄⁻<b data-result="remaining">{m.permanganate.toFixed(2)} mmol</b>
            </span>
            <span>
              Mn²⁺<b data-result="reduced">{m.manganeseII.toFixed(2)} mmol</b>
            </span>
          </div>
          <div className="chem-unsat-note">
            {say('物质的量份额，不是分数原子', 'Amounts, not fractions of atoms')}
          </div>
        </>
      )}
      <p>{say('指定预算 · 酸足量', 'Assigned budget · sufficient acid')}</p>
    </div>
  );
}
function NetAccount({
  progress,
  electronProgress,
  en,
}: {
  progress: number;
  electronProgress: number;
  en: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(280);
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current,
      update = () => setWidth(Math.max(260, Math.min(620, node.clientWidth)));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const r = new ResizeObserver(update);
    r.observe(node);
    return () => r.disconnect();
  }, []);
  const m = permanganateNetGeometry(progress, width, electronProgress),
    say = (a: string, b: string) => (en ? b : a);
  const credit = m.credits[2];
  return (
    <div className="chem-unsat-net" ref={ref} data-net-phase={m.phase}>
      <div className="chem-unsat-net-head">
        <span>Mn(VII) → Mn(II)</span>
        <span>{say('净收支', 'Net account')}</span>
      </div>
      <svg
        viewBox={`0 0 ${m.width} ${m.height}`}
        role="img"
        aria-label={say(
          '同一Mn、4个O、8个H的净去向；五份电子当量不是自由电子轨迹。',
          'Net destinations of the same Mn, four O and eight H; five electron equivalents are not free-electron trajectories.',
        )}
      >
        <defs>
          <radialGradient id="unsat-mn">
            <stop stopColor="#bda6c2" />
            <stop offset="1" stopColor="#93719b" />
          </radialGradient>
        </defs>
        <path
          d={`M${m.mn.x - 53} 16Q${m.mn.x} 7 ${m.mn.x + 53} 16V111Q${m.mn.x} 124 ${m.mn.x - 53} 111Z`}
          fill="#d8d0df"
          opacity={m.manganeseReduced ? 0 : 0.2 * (1 - m.atomMove)}
        />
        {m.atoms
          .filter((a) => a.element === 'O')
          .map((a) => (
            <line
              key={'old' + a.id}
              x1={m.mn.x}
              y1={m.mn.y}
              x2={a.x}
              y2={a.y}
              stroke="#aa8cb2"
              strokeWidth="2"
              opacity={m.manganeseReduced || a.group === 'water' ? 0 : 1 - m.atomMove}
            />
          ))}
        {m.waters.map((w, i) => (
          <g
            key={i}
            opacity={m.atoms.find((a) => a.id === `O-${i + 1}`)?.group === 'water' ? 1 : 0}
          >
            <line x1={w.x} y1={w.y} x2={w.x - 18} y2={w.y + 17} stroke="#adb9a4" strokeWidth="2" />
            <line x1={w.x} y1={w.y} x2={w.x + 18} y2={w.y + 17} stroke="#adb9a4" strokeWidth="2" />
          </g>
        ))}
        {m.phase !== 'acceptor' ? (
          <g data-credit-group="5" transform={`translate(${credit.x} ${credit.y})`}>
            <rect x="-28" y="-14" width="56" height="28" rx="14" fill="#e6dfc7" />
            <text textAnchor="middle" y="5" fontSize="16" fill="#776744">
              5 e⁻
            </text>
          </g>
        ) : null}
        {m.credits.map((e) => (
          <g key={e.id} data-electron-id={e.id} data-phase={e.phase} />
        ))}
        {m.atoms.map((a) => (
          <g key={a.id} data-atom-id={a.id} data-element={a.element} data-group={a.group}>
            <circle
              cx={a.x}
              cy={a.y}
              r={a.element === 'Mn' ? 23 : a.element === 'O' ? 14 : 13}
              fill={
                a.element === 'Mn'
                  ? m.manganeseReduced
                    ? '#d1ddca'
                    : 'url(#unsat-mn)'
                  : a.element === 'O'
                    ? '#c6b8b5'
                    : '#e4eadc'
              }
              stroke="#f7f7ef"
              strokeWidth="1"
            />
            <text x={a.x} y={a.y + 5} textAnchor="middle" fontSize="16" fill="#40503c">
              {a.element === 'Mn'
                ? m.manganeseReduced
                  ? 'Mn²⁺'
                  : 'Mn'
                : a.element === 'H' && a.group === 'proton'
                  ? 'H⁺'
                  : a.element}
            </text>
          </g>
        ))}
        {m.manganeseReduced ? (
          <text x={m.mn.x} y="112" textAnchor="middle" fontSize="16" fill="#718069">
            {say('已接受5 e⁻', '5 e⁻ received')}
          </text>
        ) : null}
      </svg>
      <div className="chem-unsat-net-equation">
        MnO₄⁻ + 8H⁺ + 5e⁻
        <br />→ Mn²⁺ + 4H₂O
      </div>
    </div>
  );
}
function TestTube({
  colour,
  remaining,
  p,
}: {
  colour: 'purple' | 'amber';
  remaining: number;
  p: number;
}) {
  return (
    <svg
      viewBox="0 0 155 235"
      role="img"
      aria-label={
        colour === 'purple'
          ? 'Acidic permanganate test tube with a submerged gas inlet'
          : 'Bromine in carbon tetrachloride with a submerged gas inlet'
      }
    >
      <path
        d="M51 29V194Q51 219 80 219T109 194V29"
        fill="#edf1e7"
        fillOpacity=".5"
        stroke="#b2c0aa"
        strokeWidth="2"
      />
      <path
        d="M54 120H106V193Q106 215 80 215T54 193Z"
        fill={colour === 'purple' ? '#96779b' : '#c99b68'}
        opacity={0.04 + 0.55 * remaining}
      />
      <ellipse cx="80" cy="120" rx="26" ry="3" fill="#d8dfce" opacity=".4" />
      <path d="M4 64H69V189" stroke="#a9baa5" strokeWidth="6" strokeLinejoin="round" fill="none" />
      <path d="M4 64H69V189" stroke="#f8faf3" strokeWidth="2" fill="none" />
      {p > 0 && p < 1
        ? [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={71 + Math.sin(i + p * 3) * 5}
              cy={185 - ((p * 3 + i * 0.28) % 1) * 61}
              r={3 + i * 0.6}
              stroke="#b8c8b0"
              fill="#f9fbf5"
              fillOpacity=".4"
            />
          ))
        : null}
      <path d="M130 32V226M128 226H148M130 71H112" stroke="#a4b298" strokeWidth="3" />
      <path d="M111 62Q101 61 102 72T112 82" stroke="#a4b298" fill="none" strokeWidth="3" />
    </svg>
  );
}
function Flame({ p, ethyne }: { p: number; ethyne: boolean }) {
  return (
    <svg
      className="chem-unsat-flame"
      viewBox="0 0 320 255"
      role="img"
      aria-label={
        ethyne
          ? 'A bright ethyne flame with visible soot above the nozzle'
          : 'A bright ethene flame with soot above the nozzle'
      }
    >
      <path
        d="M67 244H153V191L160 178L167 191V244"
        fill="#d5dfd1"
        stroke="#a2b29a"
        strokeWidth="2"
      />
      {p > 0 ? (
        <>
          <path
            d={`M160 188C${128 + 5 * Math.sin(p * 12)} 164 143 117 164 81c-5 35 25 45 21 70-1 21-16 35-25 37Z`}
            fill="#d4b97c"
            opacity=".8"
          />
          <path d="M160 184c-14-18-9-37 1-49 4 17 14 27 12 34-1 7-5 12-13 15Z" fill="#f0df9d" />
          <path d="M160 185q-8-8 0-18 9 11 0 18Z" fill="#a5bac1" />
          {Array.from({ length: ethyne ? 14 : 8 }, (_, i) => {
            const q = (p * 2 + i * 0.071) % 1;
            return (
              <circle
                key={i}
                cx={160 + Math.sin(i * 2.3 + q * 4) * (7 + q * 19)}
                cy={77 - q * 70}
                r={2 + q * 3}
                fill="#7b8174"
                opacity={0.45 * (1 - q)}
              />
            );
          })}
        </>
      ) : null}
    </svg>
  );
}
function Preparation({
  p,
  prep,
  zoom,
}: {
  p: number;
  prep: ReturnType<typeof ethynePreparation>;
  zoom: boolean;
}) {
  return (
    <svg
      className={zoom ? 'chem-unsat-prep zoom' : 'chem-unsat-prep'}
      viewBox={zoom ? '175 62 145 181' : '0 19 320 227'}
      role="img"
      aria-label={
        zoom
          ? 'Close-up of CuSO4 scrubber: gas enters below liquid, leaves above it, and CuS accumulates'
          : 'Dropping funnel and calcium carbide flask connected to a copper sulfate gas scrubber with submerged inlet and short outlet'
      }
    >
      <path d="M47 105V133a46 46 0 1 0 38 0V105Z" fill="#eef2e9" stroke="#b0bfaa" strokeWidth="2" />
      <path d="M27 177Q65 166 105 177a40 40 0 0 1-78 0Z" fill="#dbe3d2" />
      <path d="M35 198l13-10 12 8 8-10 16 14Z" fill="#929d87" opacity={1 - p} />
      <rect x="42" y="102" width="48" height="12" rx="3" fill="#acb298" />
      <path
        d="M57 20v11q-19 9-16 26 1 9 15 23v62h5V80q15-23 15-27 1-15-15-22V20Z"
        fill="#e9eee1"
        stroke="#b5c3ad"
        strokeWidth="2"
      />
      <path d="M44 54H72L59 76Z" fill="#cfdfcf" />
      <path d="M49 99H69" stroke="#9baf91" strokeWidth="3" />
      {p > 0 && p < 1 ? (
        <circle cx="59" cy={148 + ((p * 5) % 1) * 19} r="3" fill="#b5ccbb" />
      ) : null}
      <path
        d="M78 109V77H229V206"
        fill="none"
        stroke="#abbba4"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M78 109V77H229V206" fill="none" stroke="#f5f8ee" strokeWidth="2" />
      <path
        d="M199 122V223Q199 240 237 240T275 223V122Z"
        fill="#edf1e6"
        stroke="#b0c0a8"
        strokeWidth="2"
      />
      <path
        d="M202 173H272V223Q272 236 237 236T202 223Z"
        fill="#8cbdc6"
        opacity={0.12 + 0.45 * (prep.copperInitial ? prep.copperRemaining / prep.copperInitial : 0)}
      />
      <rect x="195" y="117" width="84" height="13" rx="4" fill="#adb69e" />
      <path d="M229 77V206" fill="none" stroke="#abbba4" strokeWidth="6" />
      <path d="M229 77V206" fill="none" stroke="#f5f8ee" strokeWidth="2" />
      <path d="M254 143V101H313" stroke="#a9bba4" fill="none" strokeWidth="6" />
      <path d="M254 143V101H313" stroke="#f4f7ed" fill="none" strokeWidth="2" />
      <path d="M302 96l9 5-9 5" stroke="#8fa584" fill="none" strokeWidth="2" />
      {p > 0 && p < 1
        ? [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={230 + i * 4}
              cy={205 - ((p * 4 + i * 0.3) % 1) * 33}
              r="3"
              stroke="#c5d5bf"
              fill="#f6faf0"
            />
          ))
        : null}
      <path
        d={`M206 ${234 - prep.precipitate * 100}Q237 ${229 - prep.precipitate * 100} 269 ${234 - prep.precipitate * 100}V231Q237 239 206 231Z`}
        fill="#6f776b"
        opacity={Math.min(1, prep.precipitate * 20)}
      />
      <path d="M18 98V242M12 242H115M18 124H43" stroke="#a9b69d" strokeWidth="3" fill="none" />
      <path d="M42 116q13 0 13 8t-13 8" stroke="#9caa91" strokeWidth="3" fill="none" />
    </svg>
  );
}
function Addition({ gas, first, second }: { gas: UnsaturatedGas; first: number; second: number }) {
  const ethene = gas === 'ethene';
  const bond = (x1: number, y1: number, x2: number, y2: number, opacity = 1) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#afbea4" strokeWidth="4" opacity={opacity} />
  );
  const atom = (x: number, y: number, label: string, opacity = 1) => (
    <g opacity={opacity}>
      <circle
        cx={x}
        cy={y}
        r={label === 'H' ? 14 : 20}
        fill={label === 'C' ? '#a9bba1' : label === 'H' ? '#e4ebda' : '#c5aa83'}
      />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        fontSize="20"
        fill={label === 'C' ? '#f6f8ef' : '#819075'}
      >
        {label}
      </text>
    </g>
  );
  return (
    <svg
      className="chem-unsat-addition"
      viewBox="0 0 320 220"
      role="img"
      aria-label="Net bromine addition shown as changing connectivity, not an elementary mechanism"
    >
      {bond(115, 110, 205, 110)}
      {bond(115, 101, 205, 101, 1 - first)}
      {!ethene ? bond(115, 119, 205, 119, 1 - second) : null}
      {(ethene
        ? [
            [75, 63, 115, 110],
            [75, 157, 115, 110],
            [245, 63, 205, 110],
            [245, 157, 205, 110],
          ]
        : [
            [58, 110, 115, 110],
            [262, 110, 205, 110],
          ]
      ).map(([x, y, cx, cy], i) => (
        <g key={i}>
          {bond(x, y, cx, cy)}
          {atom(x, y, 'H')}
        </g>
      ))}
      {bond(115, 110, 115, 30, first)}
      {bond(205, 110, 205, 190, first)}
      {atom(115, 30, 'Br', first)}
      {atom(205, 190, 'Br', first)}
      {!ethene ? (
        <>
          {bond(115, 110, 115, 190, second)}
          {bond(205, 110, 205, 30, second)}
          {atom(115, 190, 'Br', second)}
          {atom(205, 30, 'Br', second)}
        </>
      ) : null}
      {atom(115, 110, 'C')}
      {atom(205, 110, 'C')}
    </svg>
  );
}
