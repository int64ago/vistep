import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  metalRoutes,
  metalExtraction,
  metalAtomMap,
  metalPrincipleDirector,
  metalReductionEnergy,
  extractionTemperatures,
  routes,
  type MetalExploration,
  type ExtractionTemperature,
  type MetalRoute,
} from '../../models/chem-metal-extraction';
import '../../styles/chem-metal-extraction.css';
const atomColor: Record<string, string> = {
  Fe: '#b39373',
  O: '#bb7f76',
  C: '#79857c',
  Al: '#9dabb3',
  Na: '#b5a3bd',
  Mg: '#a4ad80',
  Cl: '#91aa8f',
  Hg: '#9baeb2',
};
export default function ChemMetalExtraction() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const authored = () =>
    metalPrincipleDirector(film.chapter, film.chapterProgress, film.chapterTime, en ? 'en' : 'zh');
  const [manual, setManual] = useState<MetalExploration | null>(null),
    [wasWatching, setWasWatching] = useState(film.watch);
  if (wasWatching !== film.watch) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(authored());
  }
  const d = film.watch ? authored() : (manual ?? authored()),
    update = (patch: Partial<MetalExploration>) => setManual({ ...d, ...patch }),
    m = metalExtraction(d.route, d.progress, d),
    energy = metalReductionEnergy(d.temperature, d.gasRatio),
    comparing = d.view === 'co-comparison' || d.view === 'aluminium-energy';
  const titles = [
    say('同样的 CO，能还原所有氧化物吗？', 'Why does the same CO differ?'),
    say('热分解：氧化汞', 'Mercury oxide decomposes'),
    say('还原剂：一氧化碳', 'Oxygen transfer to CO'),
    say('还原剂：铝', 'Oxygen transfer to aluminium'),
    say('熔盐电解：钠', 'Electrolysing molten NaCl'),
    say('熔盐电解：镁', 'Electrolysing molten MgCl₂'),
    say('工业电解：碳阳极消耗', 'Carbon anodes are consumed'),
  ];
  return (
    <section
      className="chem-metal"
      data-metal-state={JSON.stringify(d)}
      data-metal-view={d.view}
      data-metal-chapter={d.chapter}
    >
      <div className="chem-metal-title">
        {comparing
          ? d.view === 'aluminium-energy'
            ? d.reverse
              ? say('倒过来，铁能从氧化铝夺氧吗？', 'Can iron take oxygen from alumina?')
              : say('氧转给铝，为什么有利？', 'Why transfer oxygen to aluminium?')
            : energy.iron > 0
              ? say('CO₂ 变多，铁的净反应也会反转', 'More CO₂ can reverse the net tendency')
              : titles[0]
          : titles[d.chapter]}
      </div>
      {d.view === 'co-comparison' ? (
        <EnergyComparison model={energy} />
      ) : d.view === 'aluminium-energy' ? (
        <AluminiumEnergy model={energy} reverse={d.reverse} />
      ) : !m.electrolytic ? (
        <>
          <svg
            className="chem-metal-svg"
            viewBox="0 0 320 280"
            role="img"
            aria-label={say(
              '原子身份守恒的反应计量示意',
              'Reaction stoichiometry with preserved atom identities',
            )}
          >
            {metalAtomMap(d.route, m.extent).map((a) => (
              <g key={a.id} data-atom-id={a.id} data-element={a.element}>
                <circle cx={a.x} cy={a.y} r="16" fill={atomColor[a.element]} opacity=".88" />
                <text x={a.x} y={a.y + 7} fontSize="23" textAnchor="middle" fill="#26332a">
                  {a.element}
                </text>
              </g>
            ))}
          </svg>
          <div className="chem-metal-phase">
            {m.extent < 0.1
              ? say('起始计量单元', 'Starting formula units')
              : m.extent > 0.85
                ? say('产物计量单元', 'Product formula units')
                : say('原子去向示意', 'Tracking atom destinations')}
          </div>
        </>
      ) : (
        <ElectrolyticLedger m={m} />
      )}
      {!comparing ? (
        <>
          <div className="chem-metal-equation">
            {d.chapter === 0 ? 'Fe(+III) + 3e⁻ → Fe(0)' : m.equation}
          </div>
          <div className="chem-metal-electrons">
            {d.chapter === 0
              ? say('还原，必须伴随氧化', 'Reduction is coupled to oxidation')
              : m.donor}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-metal-controls">
          <div className="chem-metal-control-label">{say('还原路线', 'Reduction route')}</div>
          <Segments
            label={say('还原路线', 'Reduction route')}
            value={d.route}
            onChange={(v) =>
              update({
                route: v as MetalRoute,
                chapter: metalRoutes.indexOf(v as MetalRoute) + 1,
                view: routes[v as MetalRoute].electrolytic ? 'electrolysis' : 'atoms',
              })
            }
            options={metalRoutes.map((v, i) => ({ value: v, label: titles[i + 1] }))}
          />
          {d.route === 'carbon-monoxide' ||
          d.route === 'aluminium-reduction' ||
          d.route === 'aluminium-electrolysis' ? (
            <>
              <div className="chem-metal-control-label">
                {say('观察证据', 'Inspect the evidence')}
              </div>
              <Segments
                label={say('观察证据', 'Inspect the evidence')}
                value={d.view}
                onChange={(v) => update({ view: v as MetalExploration['view'] })}
                options={[
                  {
                    value: m.electrolytic ? 'electrolysis' : 'atoms',
                    label: say('物质去向', 'Material account'),
                  },
                  {
                    value: d.route === 'aluminium-reduction' ? 'aluminium-energy' : 'co-comparison',
                    label: say('自由能比较', 'Free-energy comparison'),
                  },
                ]}
              />
            </>
          ) : null}
          {comparing ? (
            <>
              <div className="chem-metal-control-label">
                {say('比较温度（表中数据）', 'Temperature (tabulated data)')}
              </div>
              <Segments
                label={say('比较温度（表中数据）', 'Temperature (tabulated data)')}
                value={String(d.temperature)}
                onChange={(v) => update({ temperature: Number(v) as ExtractionTemperature })}
                options={extractionTemperatures.map((v) => ({ value: String(v), label: v + ' K' }))}
              />
              {d.view === 'aluminium-energy' ? (
                <>
                  <div className="chem-metal-control-label">
                    {say('反应方向', 'Reaction direction')}
                  </div>
                  <Segments
                    label={say('反应方向', 'Reaction direction')}
                    value={d.reverse ? 'reverse' : 'forward'}
                    onChange={(v) => update({ reverse: v === 'reverse' })}
                    options={[
                      { value: 'forward', label: say('氧转给铝', 'Oxygen to aluminium') },
                      { value: 'reverse', label: say('氧转给铁', 'Oxygen to iron') },
                    ]}
                  />
                </>
              ) : null}
              {d.view === 'co-comparison' ? (
                <Range
                  label={say('CO₂ / CO 分压比', 'CO₂ / CO pressure ratio')}
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={d.gasRatio}
                  onChange={(v) => update({ gasRatio: v })}
                />
              ) : null}
              <p>
                {say(
                  '纯凝聚相活度为 1；理想气体。只比较净反应方向，不预测速率、产率或工厂能耗。',
                  'Pure condensed phases; ideal gases. This tests the net tendency, not rate, yield or plant energy use.',
                )}
              </p>
            </>
          ) : (
            <>
              <Range
                label={say('反应进度（示意）', 'Reaction extent (model)')}
                min={0}
                max={1}
                step={0.01}
                value={d.progress}
                onChange={(v) => update({ progress: v })}
              />
              {m.electrolytic ? (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={d.power}
                      onChange={(e) => update({ power: e.target.checked })}
                    />
                    {say('外接电源', 'External power')}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={d.molten}
                      onChange={(e) => update({ molten: e.target.checked })}
                    />
                    {say('离子处于可迁移的熔体', 'Mobile ions in a melt')}
                  </label>
                </>
              ) : (
                <label>
                  <input
                    type="checkbox"
                    checked={d.heat}
                    onChange={(e) => update({ heat: e.target.checked })}
                  />
                  {say('满足热条件', 'Thermal condition supplied')}
                </label>
              )}
              <div>
                {say('受电子 / 失电子', 'Accepted / released electrons')}:{' '}
                {m.electronsAccepted.toFixed(1)} / {m.electronsReleased.toFixed(1)}{' '}
                {say('计量单位', 'stoichiometric units')}
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
const signed = (v: number) =>
  Math.abs(v) < 0.5 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(0);
function EnergyComparison({ model: m }: { model: ReturnType<typeof metalReductionEnergy> }) {
  const en = browserLocale() === 'en',
    say = (z: string, e: string) => (en ? e : z);
  const entries = [
    { key: 'co', label: '3CO + 1½O₂ → 3CO₂', value: m.coChange, color: '#718d7c' },
    { key: 'iron', label: 'Fe₂O₃ → 2Fe + 1½O₂', value: m.ironRemoval, color: '#af8d71' },
    { key: 'aluminium', label: 'Al₂O₃ → 2Al + 1½O₂', value: m.aluminiumRemoval, color: '#9ca9b3' },
  ];
  return (
    <div
      className="chem-metal-energy"
      data-iron-dg={m.iron}
      data-aluminium-dg={m.aluminium}
      data-gas-ratio={m.ratio}
    >
      <p className="chem-metal-conditions">
        {m.kelvin} K · CO₂/CO = {m.ratio.toFixed(1)}
      </p>
      <div
        className="chem-metal-budget"
        role="img"
        aria-label={say(
          '把三摩尔CO的氧化与一摩尔氧化物的逆生成自由能相加；条长使用共同刻度，不是反应路径。',
          'Add oxidation of three moles of CO to reverse formation of one mole of oxide. Common bar scale; not a reaction pathway.',
        )}
      >
        {entries.map((e) => (
          <div className="chem-metal-energy-row" key={e.key}>
            <div>
              <span>{e.label}</span>
              <span>{signed(e.value)}</span>
            </div>
            <div className="chem-metal-bar-track">
              <span
                style={{ width: `${(Math.abs(e.value) / 1500) * 100}%`, background: e.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="chem-metal-net">
        <div data-direction={m.iron < 0 ? 'favourable' : 'unfavourable'}>
          <span>Fe₂O₃ + 3CO</span>
          <strong>ΔG {signed(m.iron)}</strong>
        </div>
        <div data-direction={m.aluminium < 0 ? 'favourable' : 'unfavourable'}>
          <span>Al₂O₃ + 3CO</span>
          <strong>ΔG {signed(m.aluminium)}</strong>
        </div>
      </div>
      <p className="chem-metal-note">
        {say(
          'kJ / mol 氧化物 · 负值：净还原有利',
          'kJ / mol oxide · negative favours net reduction',
        )}
      </p>
    </div>
  );
}
function AluminiumEnergy({
  model: m,
  reverse,
}: {
  model: ReturnType<typeof metalReductionEnergy>;
  reverse: boolean;
}) {
  const en = browserLocale() === 'en',
    say = (z: string, e: string) => (en ? e : z),
    drop = -m.aluminothermic / 10;
  return (
    <div
      className="chem-metal-al-energy"
      data-aluminothermic-dg={reverse ? m.reverseAluminothermic : m.aluminothermic}
    >
      <p className="chem-metal-conditions">
        {m.kelvin} K · {say('纯凝聚相', 'Pure condensed phases')}
      </p>
      <div className="chem-metal-energy-equation">
        {reverse ? '2Fe + Al₂O₃ → Fe₂O₃ + 2Al' : 'Fe₂O₃ + 2Al → 2Fe + Al₂O₃'}
      </div>
      <div className="chem-metal-energy-descent">
        <span>Fe₂O₃ + 2Al</span>
        <svg
          viewBox="0 0 260 110"
          role="img"
          aria-label={say(
            '净自由能差；每竖向单位对应10千焦，不是反应路径。',
            'Net free-energy difference; ten kilojoules per vertical unit, not a reaction pathway.',
          )}
        >
          <path
            d={`M12 15H105M155 ${15 + drop}H248`}
            fill="none"
            stroke="#7f9881"
            strokeWidth="4"
          />
          <path
            d={reverse ? `M130 ${15 + drop}V15m-7 9 7-9 7 9` : `M130 15V${15 + drop}m-7-9 7 9 7-9`}
            fill="none"
            stroke="#9ca88f"
            strokeWidth="2"
          />
        </svg>
        <span style={{ top: `${((15 + drop) / 110) * 100}%`, bottom: 'auto' }}>2Fe + Al₂O₃</span>
      </div>
      <div
        className="chem-metal-energy-number"
        data-direction={reverse ? 'unfavourable' : 'favourable'}
      >
        ΔG° {signed(reverse ? m.reverseAluminothermic : m.aluminothermic)} kJ
      </div>
      <p className="chem-metal-note">
        {say('净自由能差，不是反应路径。', 'Net free-energy difference, not a reaction pathway.')}
      </p>
    </div>
  );
}
function ElectrolyticLedger({ m }: { m: ReturnType<typeof metalExtraction> }) {
  const en = browserLocale() === 'en',
    al = m.route === 'aluminium-electrolysis',
    p = m.extent;
  return (
    <svg
      className="chem-metal-svg"
      viewBox="0 0 320 280"
      role="img"
      aria-label={
        en
          ? 'Separate oxidation and reduction interfaces with connected external power; not a factory blueprint'
          : '连接电源的氧化、还原界面；非工业装置施工图'
      }
    >
      <path d="M45 110V247H275V110" fill="#e8dec7" stroke="#b1a17d" strokeWidth="2" />
      <path d="M48 154H272V244H48Z" fill="#d9cfaf" />
      <path d="M90 126V35H133M187 35H230V126" fill="none" stroke="#84958b" strokeWidth="3" />
      <rect x="133" y="17" width="54" height="36" rx="10" fill="#e0e6da" stroke="#95a58f" />
      <text x="160" y="42" textAnchor="middle" fontSize="23" fill="#627b67">
        DC
      </text>
      <text x="90" y="90" textAnchor="middle" fontSize="25" fill="#758793">
        −
      </text>
      <text x="230" y="90" textAnchor="middle" fontSize="25" fill="#a27c6d">
        +
      </text>
      <path d="M81 111H99V209H81Z" fill="#91a0a4" />
      <path d={`M220 111H240V${209 - (al ? 34 * p : 0)}H220Z`} fill="#71847a" />
      <path d="M158 114V244" stroke="#c1b6a1" strokeWidth="2" strokeDasharray="3 5" />
      {Array.from({ length: m.products.filter((s) => s.name === m.metal).length }, (_, i) => (
        <circle
          key={i}
          cx={90 + 35 * (1 - p)}
          cy={163 + i * 17}
          r="9"
          fill={atomColor[m.metal]}
          opacity={1 - p}
        />
      ))}
      {Array.from({ length: al ? 3 : 1 }, (_, i) => (
        <circle
          key={i}
          cx={225 + i * 5}
          cy={185 - 75 * ((p * 2 + i / 3) % 1)}
          r={5 + 2 * p}
          fill={al ? '#b7b9a2' : '#b3c69a'}
          opacity={p}
        />
      ))}
      {!m.molten
        ? Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M48 ${163 + i * 14}H272`} stroke="#b4aa90" strokeWidth="2" />
          ))
        : null}
      <path
        d={`M56 ${(al ? 242 : 155) - 16 * p}H142V${al ? 242 : 155}H56Z`}
        fill="#a2afb1"
        opacity={p}
      />
      <text x="92" y="272" textAnchor="middle" fontSize="23" fill="#7a8e91">
        {m.metal === 'Na' ? '2Na' : m.metal === 'Al' ? '4Al' : 'Mg'}
      </text>
      <text x="232" y="272" textAnchor="middle" fontSize="23" fill="#829078">
        {al ? 'CO₂' : 'Cl₂'}
      </text>
      {Array.from({ length: 4 }, (_, i) => (
        <circle
          key={i}
          cx={90}
          cy={44 + ((p * 125 + i * 26) % 70)}
          r="3"
          fill="#b8a46d"
          opacity={p > 0 ? 1 : 0}
        />
      ))}
      <text x="160" y="139" textAnchor="middle" fontSize="22" fill="#998d6e">
        {m.molten ? (en ? 'melt' : '熔体') : en ? 'solid' : '固体'}
      </text>
    </svg>
  );
}
