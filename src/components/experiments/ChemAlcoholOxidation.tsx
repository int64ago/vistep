import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  copperAlcoholCycle,
  dichromateAlcohol,
  alcoholOxidationDirector,
  ethanolAtomAccount,
} from '../../models/chem-alcohol-oxidation';
import '../../styles/chem-alcohol-oxidation.css';
type Direction = ReturnType<typeof alcoholOxidationDirector>;
type Say = (zh: string, en: string) => string;
export default function ChemAlcoholOxidation() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say: Say = (a, b) => (en ? b : a);
  const auto = alcoholOxidationDirector(film.chapter, film.chapterProgress, en ? 'en' : 'zh');
  const [manual, setManual] = useState<Direction | null>(null);
  const d = film.watch ? auto : (manual ?? auto);
  const change = (patch: Partial<Direction>) => setManual({ ...d, ...patch });
  const cu = copperAlcoholCycle(d.cycleTime, d.air, true, d.initialOxide, d.ethanolUnits);
  const cr = dichromateAlcohol(d.oxidationProgress, d.ethanol, d.oxidant, d.acid);
  const hidden = d.shot === 'prediction' && !d.answer;
  const titles = [
    ['铜在空气中变黑', 'Copper blackens in air'],
    ['氧化铜变回铜', 'CuO becomes copper'],
    ['铜循环，氧会用完', 'Copper cycles; oxygen runs out'],
    ['原子与电子的账', 'Atoms and electrons'],
    ['铬接受了电子', 'Chromium accepts electrons'],
    ['继续氧化到乙酸', 'Oxidation to ethanoic acid'],
  ];
  return (
    <section
      className="chem-alcox"
      data-alcox-chapter={d.chapter}
      data-shot={d.shot}
      data-answer={hidden ? 'hidden' : 'visible'}
    >
      <div className="chem-alcox-title">{say(...(titles[d.chapter] as [string, string]))}</div>
      {d.chapter < 3 && (
        <div className="chem-alcox-copper-layout">
          <div className="chem-alcox-apparatus">
            {d.chapter === 2 && d.shot === 'prediction' ? (
              <CopperInventory m={cu} say={say} />
            ) : (
              <CopperBench m={cu} en={en} />
            )}
            <div className="chem-alcox-note">
              {d.chapter === 2 && d.shot === 'prediction'
                ? `${say('起始CuO', 'Initial CuO')}: ${d.initialOxide.toFixed(2)} · ${d.air ? say('补入空气', 'Fresh air') : say('切断空气', 'No fresh air')}`
                : d.chapter === 0
                  ? say('空气：氧 · 灯焰：热', 'Air: oxygen · Flame: heat')
                  : d.chapter === 1
                    ? say('气味是辅助观察', 'Odour: supporting evidence')
                    : say('同一份铜反复使用', 'The same copper cycles')}
            </div>
          </div>
          <div className="chem-alcox-account">
            {d.chapter === 0 && <div className="chem-alcox-equation">2Cu + O₂ → 2CuO</div>}
            {d.chapter === 1 && (
              <div className="chem-alcox-equation">
                <span>CH₃CH₂OH + CuO</span>
                <span>→ CH₃CHO + Cu + H₂O</span>
              </div>
            )}
            {d.chapter === 2 && d.shot === 'cancel' && (
              <CycleLedger cancel={d.ledgerCancelled} say={say} />
            )}
            {d.chapter === 2 && d.shot === 'cycle' && (
              <div className="chem-alcox-equation">Cu ⇄ CuO</div>
            )}
            {d.chapter === 2 && d.shot === 'prediction' && (
              <>
                <div className="chem-alcox-question">
                  {say(
                    '这份氧库存，能支持多少乙醛？',
                    'How much ethanal can this oxygen supply support?',
                  )}
                </div>
                {!hidden && (
                  <div className="chem-alcox-result" data-copper-yield={cu.aldehyde}>
                    <span>
                      {say('乙醛累计', 'Ethanal formed')} <b>{cu.aldehyde.toFixed(2)}</b>
                    </span>
                    <span>
                      {say('CuO剩余', 'CuO left')} <b>{cu.oxide.toFixed(2)}</b>
                    </span>
                  </div>
                )}
                <div className="chem-alcox-note">
                  {hidden
                    ? say('先预测，再看氧的库存', 'Predict first. Then follow the stored oxygen.')
                    : cu.ethanolRemaining < 0.001
                      ? say('乙醇用完，产物不再增加', 'Ethanol exhausted; no further product')
                      : d.air
                        ? say('补入氧，可再生氧化层', 'Fresh oxygen can restore the oxide')
                        : cu.oxide < 0.001
                          ? say('Cu/CuO路径：氧已耗尽', 'Cu/CuO oxygen: exhausted')
                          : say('氧化层里的氧仍可反应', 'Stored oxide oxygen reacts')}
                </div>
              </>
            )}
            {!film.watch && !hidden && d.chapter < 2 && (
              <div className="chem-alcox-surface" data-copper={cu.copper} data-oxide={cu.oxide}>
                <span>Cu {cu.copper.toFixed(2)}</span>
                <span>CuO {cu.oxide.toFixed(2)}</span>
              </div>
            )}
            {d.chapter === 2 && d.shot !== 'prediction' && (
              <div className="chem-alcox-result" data-copper-yield={cu.aldehyde}>
                <span>
                  {say('铜元素', 'Copper total')} <b>1.00</b>
                </span>
                <span>
                  {say('乙醛累计', 'Ethanal formed')} <b>{cu.aldehyde.toFixed(2)}</b>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {d.chapter === 3 && (
        <div className="chem-alcox-atom-layout">
          {d.shot === 'atoms' && <AlcoholAtoms p={d.atomProgress} say={say} />}
          {d.shot === 'electrons' && (
            <div className="chem-alcox-electron-account" data-electron-equivalents="2">
              <div>
                <span>CH₃CH₂OH → CH₃CHO</span>
                <strong>C: −I → +I</strong>
              </div>
              <div
                className="chem-alcox-electron-path"
                aria-label={say(
                  '两份电子当量从乙醇计入铜的还原',
                  'Two electron equivalents link ethanol oxidation to copper reduction',
                )}
              >
                <i />
                <i />
                <span>2e⁻ ↓</span>
              </div>
              <div>
                <span>CuO → Cu</span>
                <strong>Cu: +II → 0</strong>
              </div>
            </div>
          )}
          <div className="chem-alcox-note">
            {d.shot === 'electrons'
              ? say(
                  '形式氧化数 · 非微观路径',
                  'Formal oxidation numbers · not a microscopic pathway',
                )
              : say('净原子对应 · 非反应路径', 'Net atom mapping · not a reaction pathway')}
          </div>
        </div>
      )}
      {d.chapter === 4 && (
        <div className="chem-alcox-chromium-layout">
          <ChromiumTube color={cr.color} p={d.oxidationProgress} en={en} />
          <div className="chem-alcox-account">
            <div
              className="chem-alcox-cr-count"
              data-chromium-total={2 * cr.dichromate + cr.chromiumIII}
            >
              <span>
                Cr(VI)<b>{(2 * cr.dichromate).toFixed(2)}</b>
              </span>
              <span>
                Cr(III)<b>{cr.chromiumIII.toFixed(2)}</b>
              </span>
            </div>
            <div className="chem-alcox-note">
              {say('总量4份 · 每个Cr接受3e⁻', 'Total: 4 Cr · 3e⁻ per Cr')}
            </div>
            <div className="chem-alcox-note">
              {say('颜色不能单独鉴定乙酸', 'Colour alone cannot identify the acid')}
            </div>
          </div>
        </div>
      )}
      {d.chapter === 5 && (
        <>
          {d.shot !== 'prediction' && (
            <div className="chem-alcox-ladder">
              {[
                ['CH₃CH₂OH', '−I'],
                ['CH₃CHO', '+I'],
                ['CH₃COOH', '+III'],
              ].map(([formula, ox], i) => (
                <div className="chem-alcox-rung" key={formula} data-organic-stage={i}>
                  {i > 0 && (
                    <span className="chem-alcox-step">{i === 1 ? '−2H' : '＋O'} · −2e⁻</span>
                  )}
                  <strong>{formula}</strong>
                  <span>C: {ox}</span>
                </div>
              ))}
            </div>
          )}
          {d.shot !== 'prediction' ? (
            <div
              className="chem-alcox-match"
              data-total-electrons={d.matchVisible ? '12' : undefined}
            >
              {d.matchVisible ? (
                <>
                  <span>
                    3 EtOH × 4e⁻ = <b>12e⁻</b>
                  </span>
                  <span>
                    2 Cr₂O₇²⁻ × 6e⁻ = <b>12e⁻</b>
                  </span>
                </>
              ) : (
                <>
                  {d.ethanolEquivalentsVisible && (
                    <span data-unit-electrons="ethanol">EtOH → {say('给出', 'supplies')} 4e⁻</span>
                  )}
                  {d.dichromateEquivalentsVisible && (
                    <span data-unit-electrons="dichromate">
                      Cr₂O₇²⁻ → {say('接受', 'accepts')} 6e⁻
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="chem-alcox-acid-prediction">
              <div className="chem-alcox-note" data-initial-account="acid">
                EtOH {d.ethanol.toFixed(2)} · Cr₂O₇²⁻ {d.oxidant.toFixed(2)} · H⁺{' '}
                {d.acid.toFixed(0)}
              </div>
              <div className="chem-alcox-question">
                {d.ethanol === 6 && d.oxidant === 2 && d.acid === 16
                  ? say(
                      '乙醇加倍，氧化剂与酸不变。乙酸也加倍吗？',
                      'Double the ethanol, keeping oxidant and acid fixed. Twice as much acid product?',
                    )
                  : say(
                      '谁先用完，限制乙酸的总量？',
                      'Which reactant runs out and limits the acid product?',
                    )}
              </div>
              {hidden ? (
                <div className="chem-alcox-note">
                  {say('先用电子配比预测', 'Predict from the electron ratio')}
                </div>
              ) : (
                <div className="chem-alcox-result" data-acid-yield={cr.aceticAcid}>
                  <span>
                    {say('乙酸', 'Acid product')} <b>{cr.aceticAcid.toFixed(2)}</b>
                  </span>
                  <span>
                    {say('剩余乙醇', 'Ethanol left')} <b>{cr.ethanol.toFixed(2)}</b>
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="chem-alcox-note">{say('净反应模型终点', 'Net reaction endpoint')}</div>
        </>
      )}
      {!film.watch && (
        <div className="chem-alcox-controls">
          <Segments
            label={say('观察', 'View')}
            value={String(d.chapter)}
            onChange={(v) => setManual(alcoholOxidationDirector(Number(v), 0.5, en ? 'en' : 'zh'))}
            options={[
              { value: '2', label: say('铜循环', 'Copper cycle') },
              { value: '3', label: say('原子与电子', 'Atoms and electrons') },
              { value: '4', label: say('铬的颜色', 'Chromium colour') },
              { value: '5', label: say('氧化终点', 'Oxidation endpoint') },
            ]}
          />
          {d.chapter < 3 ? (
            <>
              <Range
                label={say('循环进度', 'Cycle progress')}
                value={d.cycleTime}
                min={0}
                max={4}
                step={0.01}
                onChange={(v) => change({ cycleTime: v, answer: true })}
              />
              <Segments
                label={say('空气补氧', 'Fresh air')}
                value={d.air ? 'yes' : 'no'}
                onChange={(v) =>
                  change({
                    chapter: 2,
                    shot: 'prediction',
                    air: v === 'yes',
                    answer: false,
                    cycleTime: 0,
                  })
                }
                options={[
                  { value: 'yes', label: say('补入', 'Supplied') },
                  { value: 'no', label: say('切断', 'Cut off') },
                ]}
              />
              <Range
                label={say('起始CuO份数', 'Initial CuO units')}
                value={d.initialOxide}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) =>
                  change({
                    chapter: 2,
                    shot: 'prediction',
                    initialOxide: v,
                    answer: false,
                    cycleTime: 0,
                  })
                }
              />
              <Range
                label={say('可用乙醇份数', 'Available ethanol units')}
                value={d.ethanolUnits}
                min={0}
                max={4}
                step={0.25}
                onChange={(v) =>
                  change({
                    chapter: 2,
                    shot: 'prediction',
                    ethanolUnits: v,
                    answer: false,
                    cycleTime: 0,
                  })
                }
              />
            </>
          ) : d.chapter === 3 ? (
            <Range
              label={say('原子对应进度', 'Atom correspondence')}
              value={d.atomProgress}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => change({ atomProgress: v, shot: 'atoms' })}
            />
          ) : (
            <>
              <Range
                label={say('净反应进度', 'Net reaction progress')}
                value={d.oxidationProgress}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => change({ oxidationProgress: v, answer: true })}
              />
              <Range
                label={say('起始乙醇份数', 'Initial ethanol units')}
                value={d.ethanol}
                min={0}
                max={6}
                step={0.25}
                onChange={(v) =>
                  change({
                    ethanol: v,
                    answer: false,
                    oxidationProgress: 0,
                    shot: 'prediction',
                    chapter: 5,
                  })
                }
              />
              <Range
                label={say('重铬酸根份数', 'Dichromate units')}
                value={d.oxidant}
                min={0}
                max={4}
                step={0.25}
                onChange={(v) =>
                  change({
                    oxidant: v,
                    answer: false,
                    oxidationProgress: 0,
                    shot: 'prediction',
                    chapter: 5,
                  })
                }
              />
              <Range
                label={say('氢离子份数', 'Hydrogen ion units')}
                value={d.acid}
                min={0}
                max={32}
                step={1}
                onChange={(v) =>
                  change({
                    acid: v,
                    answer: false,
                    oxidationProgress: 0,
                    shot: 'prediction',
                    chapter: 5,
                  })
                }
              />
            </>
          )}
          {d.shot === 'prediction' && (
            <button
              className="chem-alcox-reveal"
              onClick={() =>
                change({
                  answer: !d.answer,
                  cycleTime: d.answer ? 0 : 4,
                  oxidationProgress: d.answer ? 0 : 1,
                })
              }
            >
              {d.answer ? say('重新预测', 'Predict again') : say('检验预测', 'Test the prediction')}
            </button>
          )}
          <details className="chem-alcox-limits">
            <summary>{say('这份模型说明什么', 'What this model represents')}</summary>
            <p>
              {say(
                '反应进度是导演安排，不是速率或实际产率。铜与氧库存守恒；断空气只检验这条Cu/CuO供氧路径。原子路径与电子当量是净记账，不是基元机理。酸性氧化预设完全到乙酸的总反应；颜色仅定性，不能据此判断瞬时有机产物。',
                'Progress is directed, not a rate or measured yield. Copper and oxygen inventories balance; cutting off air tests only this Cu/CuO oxygen route. Atom paths and electron equivalents are net accounts, not elementary steps. Acid oxidation assumes the full ethanoic-acid endpoint. Colour is qualitative and cannot identify the instantaneous organic mixture.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
function CopperInventory({ m, say }: { m: ReturnType<typeof copperAlcoholCycle>; say: Say }) {
  return (
    <svg
      className="chem-alcox-inventory"
      viewBox="0 0 280 105"
      role="img"
      aria-label={say(
        '同一根铜丝的氧化层库存近看',
        'Close view of the oxide inventory on the same coil',
      )}
    >
      <path
        d="M140 5V20c-43 0-43 16 0 16s43 16 0 16-43 16 0 16 43 16 0 16"
        fill="none"
        stroke="#b4805c"
        strokeWidth="9"
        strokeLinecap="round"
        data-copper-id="Cu-coil"
      />
      <path
        d="M140 20c-43 0-43 16 0 16s43 16 0 16-43 16 0 16 43 16 0 16"
        fill="none"
        stroke="#505046"
        strokeWidth="9"
        strokeLinecap="round"
        opacity={m.oxide}
        data-oxide-fraction={m.oxide}
      />
      <text x="55" y="54" fontSize="19" textAnchor="middle" fill="#a56944">
        Cu
      </text>
      <text x="225" y="54" fontSize="19" textAnchor="middle" fill="#55554a">
        CuO
      </text>
    </svg>
  );
}
function CycleLedger({ cancel, say }: { cancel: boolean; say: Say }) {
  return (
    <div className={`chem-alcox-ledger ${cancel ? 'is-cancelled' : ''}`} data-cancelled={cancel}>
      <div>
        <em>Cu</em> + ½O₂ → <em>CuO</em>
      </div>
      <div>
        CH₃CH₂OH + <em>CuO</em>
        <br />→ CH₃CHO + <em>Cu</em> + H₂O
      </div>
      <div className="chem-alcox-net" style={{ opacity: cancel ? 1 : 0 }}>
        CH₃CH₂OH + ½O₂
        <br />→ CH₃CHO + H₂O
      </div>
      <span>
        {cancel
          ? say('约去往返的铜与氧化铜', 'Cancel copper and oxide from both sides')
          : say('先把两步相加', 'First add the two steps')}
      </span>
    </div>
  );
}
function AlcoholAtoms({ p, say }: { p: number; say: Say }) {
  const m = ethanolAtomAccount(p),
    q = m.progress;
  const atom = (id: string) => m.atoms.find((a) => a.id === id)!;
  const h1 = atom('H-alpha-removed'),
    h2 = atom('H-hydroxyl'),
    o = atom('O-oxide');
  return (
    <svg
      className="chem-alcox-atoms"
      viewBox="0 0 280 240"
      role="img"
      aria-label={say(
        '乙醇氧保留在羰基。两个选定的氢与氧化铜的氧计入水。',
        'Ethanol oxygen stays in the carbonyl. Two selected hydrogens join oxide oxygen in the water account.',
      )}
    >
      <g stroke="#a69d8c" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M69 84H96M134 84H172M115 104V123" />
        <path d="M115 43V65M210 84H238" opacity={1 - q} data-bond="departing-H" />
        <path d="M134 76H172" opacity={q} data-bond="carbonyl" />
        <path
          d={`M${o.x} ${o.y}L${h1.x} ${h1.y}M${o.x} ${o.y}L${h2.x} ${h2.y}`}
          opacity={q}
          data-bond="water"
        />
      </g>
      {m.atoms.map((a) => (
        <g
          key={a.id}
          data-atom-id={a.id}
          data-origin={a.origin}
          transform={`translate(${a.x} ${a.y})`}
        >
          {a.element !== 'CH₃' && (
            <circle
              r={a.element === 'H' ? 16 : 19}
              fill={
                a.origin === 'oxide'
                  ? '#bdd5d8'
                  : a.element === 'O'
                    ? '#e8b698'
                    : a.element === 'C'
                      ? '#cfc8b7'
                      : '#e9e8df'
              }
              stroke={a.origin === 'oxide' ? '#50858e' : '#d0c5b6'}
            />
          )}
          <text y="6" textAnchor="middle" fontSize="19" fill="#514c43">
            {a.element}
          </text>
          {a.id === 'O-ethanol' && <circle r="22" stroke="#a96640" strokeWidth="1.5" fill="none" />}
        </g>
      ))}
      <text x="65" y="216" textAnchor="middle" fontSize="19" fill="#537e86">
        {say('CuO的氧', 'O from CuO')}
      </text>
    </svg>
  );
}
function CopperBench({ m, en }: { m: ReturnType<typeof copperAlcoholCycle>; en: boolean }) {
  const copper = [178, 120, 91],
    oxide = [80, 80, 70],
    color = `rgb(${copper.map((c, i) => Math.round(c + (oxide[i] - c) * m.oxide)).join(',')})`;
  return (
    <svg
      data-copper-surface={m.oxide}
      className="chem-alcox-bench"
      viewBox="0 0 320 270"
      role="img"
      aria-label={
        en
          ? 'One copper coil moves between heating in air and ethanol; its surface follows the conserved oxide inventory.'
          : '同一根铜丝在空气加热与乙醇之间移动，表面随守恒的氧化层库存变化。'
      }
    >
      <path d="M35 253H284" stroke="#d4cbbf" />
      <path
        d="M58 225Q47 231 48 245Q80 261 112 245Q113 231 102 225V210H58Z"
        fill="#e8d6b6"
        stroke="#bfad8e"
        strokeWidth="2"
      />
      <path d="M65 210H95V216H65Z" fill="#bcae96" />
      <path d="M77 208V188H83V208" fill="#8d8271" />
      <path d="M80 190Q54 169 78 132Q76 153 92 165Q103 182 80 190" fill="#aebdc4" opacity=".8" />
      <path d="M80 184Q71 169 81 158Q89 176 80 184" fill="#d9e6d8" />
      <path
        d="M191 103V224Q191 251 220 251T249 224V103"
        fill="#f1f1e9"
        fillOpacity=".4"
        stroke="#b7c2b2"
        strokeWidth="2"
      />
      <path d="M194 165H246V224Q246 248 220 248T194 224Z" fill="#d6e3d3" opacity=".7" />
      <path
        d="M276 78V251M260 251H292M276 125H251q-7 7 0 14H276"
        fill="none"
        stroke="#a7b59c"
        strokeWidth="2"
      />
      <g data-copper-id="Cu-coil" transform={`translate(${m.x} ${m.y})`}>
        <path d="M0-65V-20" stroke="#ad795c" strokeWidth="4" />
        <path
          d="M0-20c-22 0-22 8 0 8s22 8 0 8-22 8 0 8 22 8 0 8-22 8 0 8"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M-5-65H5" stroke="#8e8b7c" strokeWidth="3" />
      </g>
      <text x="80" y="32" fontSize="26" textAnchor="middle" fill="#918f7e">
        O₂
      </text>

      <text x="220" y="237" textAnchor="middle" fontSize="26" fill="#86967c">
        EtOH
      </text>
    </svg>
  );
}
function ChromiumTube({ color, p, en }: { color: string; p: number; en: boolean }) {
  return (
    <svg
      className="chem-alcox-chromium"
      viewBox="0 0 320 240"
      role="img"
      aria-label={
        en
          ? 'Acid dichromate changes from orange towards green as chromium six is reduced to chromium three.'
          : '酸性重铬酸根的铬从六价还原到三价，橙色定性转向绿色。'
      }
    >
      <path
        d="M125 87V193Q125 227 160 227T195 193V87"
        fill="#f4f0e7"
        stroke="#bdc1ad"
        strokeWidth="2"
      />
      <path d="M128 135H192V193Q192 224 160 224T128 193Z" fill={color} opacity=".8" />
      <ellipse cx="160" cy="135" rx="32" ry="4" fill={color} />
      <path d="M154 13H166V54L162 69H158L154 54Z" fill="#e7ecdf" stroke="#b4bfab" strokeWidth="2" />
      <path d="M154 13V4H166V13" stroke="#9cab91" strokeWidth="4" />
      {p < 0.7 ? (
        <path d={`M160 ${78 + 37 * ((p / 0.7) % 1)}q-7 12 0 13 7-1 0-13Z`} fill="#d0ddc3" />
      ) : null}
      <path
        d="M226 107V227M212 227H244M226 103H197q-8 7 0 13H226"
        fill="none"
        stroke="#a9b69d"
        strokeWidth="2"
      />
      <text x="112" y="35" textAnchor="end" fontSize="26" fill="#899778">
        EtOH
      </text>
    </svg>
  );
}
