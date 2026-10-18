import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  metalRoutes,
  metalExtraction,
  metalAtomMap,
  metalDirector,
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
  const [route, setRoute] = useState<MetalRoute>('carbon-monoxide'),
    [progress, setProgress] = useState(0.7),
    [heat, setHeat] = useState(true),
    [power, setPower] = useState(true),
    [molten, setMolten] = useState(true);
  const d = film.watch
      ? metalDirector(film.chapter, film.chapterProgress)
      : { chapter: metalRoutes.indexOf(route) + 1, route, progress },
    m = metalExtraction(d.route, d.progress, film.watch ? {} : { heat, power, molten });
  const titles = [
    say('金属元素回到零价', 'Return the metal to oxidation state zero'),
    say('热分解：氧化汞', 'Thermal decomposition: mercury oxide'),
    say('还原剂：一氧化碳', 'Reducing agent: carbon monoxide'),
    say('还原剂：铝', 'Reducing agent: aluminium'),
    say('熔盐电解：钠', 'Molten-salt electrolysis: sodium'),
    say('熔盐电解：镁', 'Molten-salt electrolysis: magnesium'),
    say('工业电解：碳阳极消耗', 'Industrial electrolysis consumes carbon'),
  ];
  return (
    <section className="chem-metal">
      <div className="chem-metal-title">{titles[d.chapter]}</div>
      {!m.electrolytic ? (
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
              <g key={a.id}>
                <circle cx={a.x} cy={a.y} r="16" fill={atomColor[a.element]} opacity=".88" />
                <text x={a.x} y={a.y + 7} fontSize="21" textAnchor="middle" fill="#26332a">
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
      <div className="chem-metal-equation">
        {d.chapter === 0 ? 'Fe(+III) + 3e⁻ → Fe(0)' : m.equation}
      </div>
      <div className="chem-metal-electrons">
        {d.chapter === 0 ? say('还原，必须伴随氧化', 'Reduction is coupled to oxidation') : m.donor}
      </div>
      {!film.watch ? (
        <div className="chem-metal-controls">
          <Segments
            label={say('还原路线', 'Reduction route')}
            value={route}
            onChange={(v) => setRoute(v as MetalRoute)}
            options={metalRoutes.map((v, i) => ({ value: v, label: titles[i + 1] }))}
          />
          <Range
            label={say('反应进度（示意）', 'Reaction extent (model)')}
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={setProgress}
          />
          {m.electrolytic ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={power}
                  onChange={(e) => setPower(e.target.checked)}
                />
                {say('外接电源', 'External power')}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={molten}
                  onChange={(e) => setMolten(e.target.checked)}
                />
                {say('离子处于可迁移的熔体', 'Mobile ions in a melt')}
              </label>
            </>
          ) : (
            <label>
              <input type="checkbox" checked={heat} onChange={(e) => setHeat(e.target.checked)} />
              {say('满足热条件', 'Thermal condition supplied')}
            </label>
          )}
          <div>
            {say('受电子 / 失电子', 'Accepted / released electrons')}:{' '}
            {m.electronsAccepted.toFixed(1)} / {m.electronsReleased.toFixed(1)}{' '}
            {say('计量单位', 'stoichiometric units')}
          </div>
        </div>
      ) : null}
    </section>
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
      <text x="160" y="42" textAnchor="middle" fontSize="21" fill="#627b67">
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
      <text x="92" y="272" textAnchor="middle" fontSize="21" fill="#7a8e91">
        {m.metal === 'Na' ? '2Na' : m.metal === 'Al' ? '4Al' : 'Mg'}
      </text>
      <text x="232" y="272" textAnchor="middle" fontSize="21" fill="#829078">
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
      <text x="160" y="139" textAnchor="middle" fontSize="20" fill="#998d6e">
        {m.molten ? (en ? 'melt' : '熔体') : en ? 'solid' : '固体'}
      </text>
    </svg>
  );
}
