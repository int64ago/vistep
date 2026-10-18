import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  benzoicSolubility,
  benzoicBatch,
  heatingState,
  benzoicDirector,
} from '../../models/chem-benzoic-recrystallization';
import '../../styles/chem-benzoic-recrystallization.css';
export default function ChemBenzoicRecrystallization() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('cool'),
    [water, setWater] = useState(50),
    [temperature, setTemperature] = useState(25),
    [filterTemp, setFilterTemp] = useState(75),
    [wash, setWash] = useState(5);
  const d = film.watch
    ? benzoicDirector(film.chapter, film.chapterProgress)
    : {
        ...benzoicDirector(
          view === 'filter' ? 2 : view === 'wash' ? 5 : view === 'test' ? 7 : 3,
          1,
        ),
        water,
        temperature,
        filterTemperature: filterTemp,
        wash,
      };
  const m = benzoicBatch(d.water, d.filterTemperature, d.temperature, d.wash),
    h = heatingState(d.temperature, d.water),
    names = [
      say('同一粗品，三种去向', 'One crude sample, three destinations'),
      say('升温提高溶解容量', 'Heating increases dissolution capacity'),
      say('趁热滤去不溶物', 'Remove insoluble material while hot'),
      say('冷却让晶体析出', 'Cooling allows crystals to form'),
      say('晶体与母液分开', 'Separate crystals and mother liquor'),
      say('洗去母液，也会损失产品', 'Washing removes liquor and some product'),
      say('干燥后再计算收率', 'Calculate recovery after drying'),
      say('检验剩余的氯离子', 'Test for remaining chloride'),
    ];
  const crystal =
    d.chapter === 0 ? 0.9 : d.chapter === 1 ? h.solid : d.chapter >= 4 ? m.crystals : m.crystals;
  return (
    <section className="chem-benzoic">
      <div className="chem-benzoic-title">{names[d.chapter]}</div>
      {d.chapter === 0 ? (
        <div className="chem-benzoic-mixture">
          <svg viewBox="0 0 320 175" role="img" aria-label={names[0]}>
            <ellipse cx="160" cy="116" rx="121" ry="40" fill="#e4e8d7" />
            <Needles amount={0.9} cx={160} cy={103} spread={110} />
            {Array.from({ length: 14 }, (_, i) => (
              <circle
                key={i}
                cx={70 + i * 13}
                cy={121 + Math.sin(i * 4) * 13}
                r={i % 3 === 0 ? 4 : 2.3}
                fill={i % 3 === 0 ? '#aa9983' : '#a8bc9b'}
              />
            ))}
          </svg>
          <div className="chem-benzoic-tags">
            <span>{say('苯甲酸', 'Benzoic acid')}</span>
            <span>NaCl</span>
            <span>{say('泥沙', 'Sand')}</span>
          </div>
        </div>
      ) : null}
      {d.chapter === 1 || d.chapter === 3 ? (
        <>
          <Beaker
            crystals={crystal}
            salt={0.07}
            sand={d.chapter === 1 ? 0.03 : 0}
            temperature={d.chapter === 3 ? m.Tc : d.temperature}
            dissolved={d.chapter === 1 ? h.dissolved : m.dissolved}
            stir={d.chapter === 1 ? d.p : undefined}
          />
          <div className="chem-benzoic-data">
            <span>
              {say('固体苯甲酸', 'Solid acid')}
              <b>{crystal.toFixed(3)} g</b>
            </span>
            <span>
              {say('溶解苯甲酸', 'Dissolved acid')}
              <b>{(d.chapter === 1 ? h.dissolved : m.dissolved).toFixed(3)} g</b>
            </span>
          </div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <FilterStage hot progress={d.p} crystals={m.hotCakeAcid * d.p} sand={0.03} />
          <div className="chem-benzoic-data">
            <span>
              {say('留在滤纸的苯甲酸', 'Acid on filter')}
              <b>{(m.hotCakeAcid * d.p).toFixed(3)} g</b>
            </span>
            <span>
              {say('进入滤液', 'Acid in filtrate')}
              <b>{(m.filteredAcid * d.p).toFixed(3)} g</b>
            </span>
          </div>
        </>
      ) : null}
      {d.chapter === 4 || d.chapter === 5 ? (
        <>
          <FilterStage
            progress={d.p}
            crystals={d.chapter === 5 ? m.productAcid : m.crystals * d.p}
            sand={0}
            washing={d.chapter === 5}
          />
          <div className="chem-benzoic-data">
            <span>
              {d.chapter === 5 ? say('残留NaCl', 'Retained NaCl') : say('晶体', 'Crystals')}
              <b>
                {d.chapter === 5
                  ? (m.productSalt * 1000).toFixed(2) + ' mg'
                  : (m.crystals * d.p).toFixed(3) + ' g'}
              </b>
            </span>
            <span>
              {d.chapter === 5
                ? say('洗去的苯甲酸', 'Acid in wash')
                : say('母液中苯甲酸', 'Acid in mother liquor')}
              <b>{(d.chapter === 5 ? m.washAcid : m.motherAcid * d.p).toFixed(3)} g</b>
            </span>
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <svg className="chem-benzoic-dry" viewBox="0 0 320 205" role="img" aria-label={names[6]}>
            <path
              d="M45 90Q160 119 275 90Q255 133 160 140Q65 133 45 90"
              fill="#e0e5d1"
              stroke="#a5b49a"
              strokeWidth="2"
            />
            <Needles amount={m.productAcid} cx={160} cy={108} spread={105} />
            <path d="M74 146H246V185H74Z" fill="#d9e0ce" />
            <rect x="107" y="155" width="106" height="25" rx="5" fill="#f5f7eb" />
            <text x="160" y="175" textAnchor="middle" fontSize="21" fill="#71876c">
              {m.productMass.toFixed(4)} g
            </text>
          </svg>
          <div className="chem-benzoic-data">
            <span>
              {say('教材质量收率', 'Mass recovery')}
              <b>{(100 * m.recovery).toFixed(1)}%</b>
            </span>
            <span>
              {say('模型苯甲酸纯度', 'Model acid purity')}
              <b>{(100 * m.purity).toFixed(2)}%</b>
            </span>
          </div>
        </>
      ) : null}
      {d.chapter === 7 ? (
        <>
          <svg className="chem-benzoic-test" viewBox="0 0 320 220" role="img" aria-label={names[7]}>
            <path
              d="M107 30V177Q107 205 135 205Q163 205 163 177V30"
              fill="#e7ecdd"
              stroke="#a3b49d"
              strokeWidth="2"
            />
            <path d="M110 110H160V177Q160 202 135 202Q110 202 110 177Z" fill="#c4d4bb" />
            {Array.from({ length: 28 }, (_, i) => (
              <circle
                key={i}
                cx={116 + (i % 6) * 7}
                cy={130 + Math.floor(i / 6) * 13}
                r="2.5"
                fill="#f7f8ee"
                opacity={Math.min(0.9, m.chloridePrecipitate * 130) * d.p}
              />
            ))}
            <path d="M215 20L169 90" stroke="#98ad9c" strokeWidth="8" />
            <path d="M215 20L169 90" stroke="#f2f5e8" strokeWidth="3" />
            <path d="M165 99L160 108" stroke="#a4bda3" strokeWidth="3" />
            <text x="215" y="135" textAnchor="middle" fontSize="21" fill="#809575">
              AgNO₃
            </text>
          </svg>
          <div className="chem-benzoic-note">
            {say('稀硝酸酸化样品', 'Dilute-HNO₃-acidified sample')}
          </div>
          <div className="chem-benzoic-note">Ag⁺ + Cl⁻ → AgCl↓</div>
          <div className="chem-benzoic-note">
            {say('看不见沉淀 ≠ 氯离子绝对为零', 'No visible solid ≠ exactly zero chloride')}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-benzoic-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'cool', label: say('冷却', 'Cooling') },
              { value: 'filter', label: say('热过滤', 'Hot filter') },
              { value: 'wash', label: say('洗涤', 'Washing') },
              { value: 'test', label: say('检验', 'Testing') },
            ]}
          />
          <Range
            label={say('模型水量 / mL', 'Model water / mL')}
            min={20}
            max={120}
            step={1}
            value={water}
            onChange={setWater}
          />
          <Range
            label={say('过滤温度 / °C', 'Filter temperature / °C')}
            min={25}
            max={75}
            step={1}
            value={filterTemp}
            onChange={setFilterTemp}
          />
          <Range
            label={say('冷却温度 / °C', 'Cooling temperature / °C')}
            min={25}
            max={filterTemp}
            step={1}
            value={Math.min(temperature, filterTemp)}
            onChange={setTemperature}
          />
          <Range
            label={say('冷水洗涤量 / mL', 'Cold wash water / mL')}
            min={0}
            max={20}
            step={0.5}
            value={wash}
            onChange={setWash}
          />
          <div>
            {say('所示参数用于模型比较', 'Parameters belong to the teaching model')}
            <br />
            {say('溶解度', 'Solubility')}:{' '}
            {benzoicSolubility(Math.min(temperature, filterTemp)).toFixed(2)} g / 100 g H₂O
          </div>
        </div>
      ) : null}
    </section>
  );
}
function Needles({
  amount,
  cx,
  cy,
  spread,
}: {
  amount: number;
  cx: number;
  cy: number;
  spread: number;
}) {
  return (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const scale = Math.max(0, Math.min(1, amount / 0.8)),
          x = cx + Math.sin(i * 5.7) * spread * 0.7,
          y = cy + Math.cos(i * 3.1) * 15;
        return (
          <path
            key={i}
            d="M-17 0L-11-2H17L11 2Z"
            transform={`translate(${x} ${y}) rotate(${(i * 47) % 180}) scale(${scale})`}
            fill="#f8f7eb"
            stroke="#9db194"
            strokeWidth=".8"
          />
        );
      })}
    </g>
  );
}
function Beaker({
  crystals,
  salt,
  sand,
  temperature,
  dissolved,
  stir,
}: {
  crystals: number;
  salt: number;
  sand: number;
  temperature: number;
  dissolved: number;
  stir?: number;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="chem-benzoic-beaker"
      viewBox="0 0 320 240"
      role="img"
      aria-label="Benzoic acid solid and solution"
    >
      <defs>
        <clipPath id={id}>
          <path d="M61 45V211Q61 221 71 221H249Q259 221 259 211V45Z" />
        </clipPath>
      </defs>
      <path
        d="M59 45V211Q59 223 71 223H249Q261 223 261 211V45"
        fill="#ebeedf"
        stroke="#a6b49b"
        strokeWidth="2"
      />
      <g clipPath={`url(#${id})`}>
        <path d="M62 91H258V212Q258 220 249 220H71Q62 220 62 212Z" fill="#c6d7bc" />
        {Array.from({ length: 18 }, (_, i) => (
          <circle
            key={i}
            cx={78 + (i % 6) * 31}
            cy={108 + Math.floor(i / 6) * 27}
            r="2.3"
            fill="#9cb78d"
            opacity={salt > 0 ? 0.8 : 0}
          />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <circle
            key={i}
            cx={79 + (i % 6) * 31}
            cy={117 + Math.floor(i / 6) * 24}
            r="2"
            fill="#f4f3e6"
            opacity={dissolved / 0.9}
          />
        ))}
        <Needles amount={crystals} cx={160} cy={198} spread={115} />
        {sand > 0
          ? Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={78 + i * 23} cy={213 - Math.sin(i) * 3} r="3" fill="#a9957a" />
            ))
          : null}
      </g>
      {stir !== undefined ? (
        <path
          d={`M${205 + Math.sin(stir * 10) * 5} 25L${155 + Math.sin(stir * 10) * 10} 205`}
          stroke="#9fb6a2"
          strokeWidth="5"
        />
      ) : null}
      <text x="160" y="73" textAnchor="middle" fontSize="22" fill="#7c976b">
        {temperature.toFixed(0)}°C
      </text>
    </svg>
  );
}
function FilterStage({
  hot = false,
  progress,
  crystals,
  sand,
  washing = false,
}: {
  hot?: boolean;
  progress: number;
  crystals: number;
  sand: number;
  washing?: boolean;
}) {
  const filterId = useId().replace(/:/g, '');
  return (
    <svg
      className="chem-benzoic-filter"
      viewBox="0 0 320 270"
      role="img"
      aria-label={hot ? 'Hot filtration' : 'Collect and wash crystals'}
    >
      <defs>
        <clipPath id={filterId}>
          <path d="M111 82L160 140L209 82Z" />
        </clipPath>
      </defs>
      <path
        d="M55 52V257M30 258H83M55 94H113"
        stroke="#a0aa91"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="160" cy="94" rx="54" ry="7" fill="none" stroke="#9ba88e" strokeWidth="3" />
      <path
        d="M104 80L153 148V188H167V148L216 80"
        fill="#e8edde"
        stroke="#a2b39c"
        strokeWidth="2"
      />
      <path d="M111 82L160 140L209 82Z" fill="#f5f3df" stroke="#c3c8ae" />
      <g clipPath={`url(#${filterId})`}>
        <Needles amount={crystals} cx={160} cy={104} spread={38} />
        {sand > 0
          ? Array.from({ length: 9 }, (_, i) => (
              <circle
                key={i}
                cx={139 + (i % 3) * 14}
                cy={110 + Math.floor(i / 3) * 6}
                r="3"
                fill="#a8977a"
              />
            ))
          : null}
      </g>
      <path
        d="M114 202V253Q114 261 122 261H198Q206 261 206 253V202"
        fill="#ebefdf"
        stroke="#a4b59c"
        strokeWidth="2"
      />
      <path
        d={`M117 ${256 - 43 * progress}H203V255Q203 258 198 258H122Q117 258 117 255Z`}
        fill="#c7d9be"
      />
      <path d={`M160 188V${256 - 43 * progress}`} stroke="#b2cbaa" strokeWidth="3" />
      {hot || washing ? (
        <>
          <path d="M103 18L145 81" stroke="#a0b59d" strokeWidth="4" />
          <path d="M89 20L125 73L142 62L106 9" fill="#dce5ce" stroke="#a4b49b" strokeWidth="2" />
          <path d="M138 68L151 88" stroke="#b6cba8" strokeWidth="3" />
        </>
      ) : null}
    </svg>
  );
}
