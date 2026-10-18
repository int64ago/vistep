import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  cupCalorimetry,
  repeatedCups,
  iceCalorimetry,
  calorimetryDirector,
} from '../../models/chem-calorimetry';
import '../../styles/chem-calorimetry.css';
export default function ChemCalorimetry() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState(film.variant === 'ice-history' ? 'ice' : 'cup'),
    [time, setTime] = useState(120),
    [k, setK] = useState(1.5),
    [capacity, setCapacity] = useState(25),
    [carbon, setCarbon] = useState(0.04),
    [ambient, setAmbient] = useState(800),
    [iceProgress, setIceProgress] = useState(1);
  const d = film.watch
    ? calorimetryDirector(film.chapter, film.chapterProgress)
    : { chapter: mode === 'cup' ? 3 : 6, progress: 1, cupTime: time, iceProgress };
  const c = cupCalorimetry(d.cupTime, {
      conductance: film.watch ? 1.5 : k,
      vesselCapacity: film.watch ? 25 : capacity,
    }),
    repeated = repeatedCups(film.watch ? 1.5 : k, film.watch ? 25 : capacity),
    ice = iceCalorimetry(d.iceProgress, film.watch ? 0.04 : carbon, film.watch ? 800 : ambient);
  const names = [
    ['先分别量温度', 'Measure the starting temperatures'],
    ['记录最高温度', 'Record the temperature peak'],
    ['重复三次，再算热量', 'Repeat, then calculate heat'],
    ['量热器也在吸热', 'The vessel also takes heat'],
    ['三层空间，两条排水', 'Three chambers, separate drains'],
    ['用融冰质量计量', 'Measure the melted ice'],
    ['只称测量层的融水', 'Weigh the measurement melt only'],
  ];
  const plot = (points: { time: number; temperature: number }[]) =>
    points
      .map((p, i) => `${i ? 'L' : 'M'}${34 + p.time * 2.1},${128 - (p.temperature - 20.2) * 25}`)
      .join(' ');
  const ideal = cupCalorimetry(120, { conductance: 0, vesselCapacity: 0 });
  const field = cupCalorimetry(120, {
    conductance: film.watch ? 1.5 : k,
    vesselCapacity: film.watch ? 25 : capacity,
  });
  const showCurve = d.chapter === 1 || d.chapter === 3;
  return (
    <section className="chem-calorimetry">
      <div className="chem-cal-heading">{say(names[d.chapter][0], names[d.chapter][1])}</div>
      {d.chapter === 0 ? (
        <>
          <div className="chem-cal-start">
            <div>
              <strong>HCl</strong>
              <span>50 mL · 0.50 M</span>
              <b>20.0 °C</b>
            </div>
            <div>
              <strong>NaOH</strong>
              <span>50 mL · 0.55 M</span>
              <b>20.4 °C</b>
            </div>
          </div>
          <Cup temperature={20} p={0} en={en} />
          <div className="chem-cal-result">t₁ = (20.0 + 20.4) / 2 = 20.2 °C</div>
        </>
      ) : null}
      {d.chapter === 1 ? (
        <>
          <Cup temperature={c.temperature} p={c.progress} en={en} />
          <div className="chem-cal-result">t₂ = {c.peak.toFixed(2)} °C</div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <div className="chem-cal-trials">
            <div>
              <span>{say('次数', 'Trial')}</span>
              <span>t₁ / °C</span>
              <span>t₂ / °C</span>
              <span>Δt / °C</span>
            </div>
            {repeated.rows.map((r, i) => (
              <div key={i} style={{ opacity: d.progress * 4 >= i ? 1 : 0.2 }}>
                <span>{i + 1}</span>
                <span>{r.initial.toFixed(2)}</span>
                <span>{r.peak.toFixed(2)}</span>
                <b>{r.rise.toFixed(2)}</b>
              </div>
            ))}
          </div>
          <div className="chem-cal-equation">
            <span>
              {say('平均温差', 'Mean Δt')} = {repeated.meanRise.toFixed(2)} °C
            </span>
            <span>Q ≈ 100 × 4.18 × {repeated.meanRise.toFixed(2)}</span>
            <b>≈ {(repeated.heat / 1000).toFixed(3)} kJ</b>
            <span>n(H₂O) = 0.025 mol</span>
            <b>ΔH ≈ {repeated.enthalpy.toFixed(1)} kJ/mol</b>
          </div>
        </>
      ) : null}
      {showCurve ? (
        <>
          <svg
            viewBox="0 0 320 165"
            className="chem-cal-plot"
            role="img"
            aria-label={say(
              '反应开始后温度上升，再随散热下降的计算轨迹',
              'Calculated temperature rises after mixing, then falls as heat escapes',
            )}
          >
            <path d="M34 18V130H292" fill="none" stroke="#d6dacf" />
            {d.chapter === 3 ? (
              <path
                d={plot(ideal.points)}
                fill="none"
                stroke="#b4c2b3"
                strokeWidth="3"
                strokeDasharray="5 4"
              />
            ) : null}
            <path
              d={plot(d.chapter === 3 ? field.points : c.points)}
              fill="none"
              stroke="#bba587"
              strokeWidth="3"
            />
            {[0, 60, 120].map((t) => (
              <text
                key={t}
                x={34 + t * 2.1}
                y="157"
                fontSize="20"
                fill="#84917b"
                textAnchor="middle"
              >
                {t}
              </text>
            ))}
            <text x="12" y="19" fontSize="20" fill="#84917b">
              °C
            </text>
            <text x="302" y="157" fontSize="20" fill="#84917b">
              s
            </text>
            <circle
              cx={34 + c.time * 2.1}
              cy={128 - (c.temperature - 20.2) * 25}
              r="4"
              fill="#aa9476"
            />
          </svg>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <div className="chem-cal-terms">
            <div>
              <span>{say('溶液储热', 'In solution')}</span>
              <b>{(c.solutionCapacity * (c.temperature - c.initial)).toFixed(0)} J</b>
            </div>
            <div>
              <span>{say('杯体储热', 'In vessel')}</span>
              <b>{(c.vesselCapacity * (c.temperature - c.initial)).toFixed(0)} J</b>
            </div>
            <div>
              <span>{say('流向环境', 'To surroundings')}</span>
              <b>{(-c.environment).toFixed(0)} J</b>
            </div>
          </div>
          <div className="chem-cal-result">
            {say('三项合计', 'Total')} = {c.released.toFixed(0)} J
          </div>
          <div className="chem-cal-key">
            <i />
            {say('有热损失', 'With heat loss')}
            <i className="ideal" />
            {say('理想绝热', 'Ideal insulation')}
          </div>
        </>
      ) : null}
      {d.chapter >= 4 && d.chapter <= 5 ? (
        <>
          <IceChambers p={d.iceProgress} ice={ice} en={en} />
          <div className="chem-cal-two">
            <div>
              <span>{say('测量层融水', 'Measurement melt')}</span>
              <b>{ice.middleMelt.toFixed(2)} g</b>
            </div>
            <div>
              <span>{say('防护层融水', 'Guard melt')}</span>
              <b>{ice.guardMelt.toFixed(2)} g</b>
            </div>
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <div className="chem-cal-melt">
            <div className="chem-cal-cylinder">
              <div style={{ height: `${Math.min(90, (ice.middleMelt / 10) * 90)}%` }} />
              <strong>{ice.middleMelt.toFixed(2)} g</strong>
            </div>
            <span>{say('测量层 · 独立收集', 'Measurement layer · separate collection')}</span>
          </div>
          <div className="chem-cal-equation">
            <span>
              Q = m<sub>{say('融冰', 'melt')}</sub> × L
            </span>
            <span>= {ice.middleMelt.toFixed(2)} × 333.5</span>
            <b>= {ice.measuredHeat.toFixed(0)} J</b>
          </div>
          <div className="chem-cal-guard">
            {say('外围融水另计', 'Guard melt kept separate')}: {ice.guardMelt.toFixed(2)} g
          </div>
          {!ice.guardIntact ? (
            <p>
              {say(
                '防护冰已耗尽：读数混入环境热。',
                'Guard ice exhausted: environmental heat contaminates the reading.',
              )}
            </p>
          ) : null}
        </>
      ) : null}
      <div className="chem-cal-note">
        {say('计算示例 · 非实测记录', 'Calculated example · not measured data')}
      </div>
      {!film.watch ? (
        <div className="chem-cal-controls">
          <Segments
            label={say('量热方法', 'Method')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'cup', label: say('温差', 'Temperature rise') },
              { value: 'ice', label: say('融冰', 'Melting ice') },
            ]}
          />
          {mode === 'cup' ? (
            <>
              <Range
                label={say('演示时间 / s', 'Model time / s')}
                value={time}
                min={0}
                max={120}
                step={1}
                onChange={setTime}
              />
              <Range
                label={say('量热器热容 / J·K⁻¹', 'Vessel capacity / J·K⁻¹')}
                value={capacity}
                min={0}
                max={100}
                step={5}
                onChange={setCapacity}
              />
              <Range
                label={say('向环境传热系数 / W·K⁻¹', 'Ambient conductance / W·K⁻¹')}
                value={k}
                min={0}
                max={10}
                step={0.5}
                onChange={setK}
              />
            </>
          ) : (
            <>
              <Range
                label={say('石墨模型质量 / g', 'Model graphite mass / g')}
                value={carbon}
                min={0}
                max={0.1}
                step={0.01}
                onChange={setCarbon}
              />
              <Range
                label={say('燃烧进度', 'Combustion progress')}
                value={iceProgress}
                min={0}
                max={1}
                step={0.01}
                onChange={setIceProgress}
              />
              <Range
                label={say('外界输入热量 / J', 'External heat / J')}
                value={ambient}
                min={0}
                max={10000}
                step={200}
                onChange={setAmbient}
              />
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function Cup({ temperature, p, en }: { temperature: number; p: number; en: boolean }) {
  return (
    <svg
      className="chem-cal-cup"
      viewBox="0 0 320 230"
      role="img"
      aria-label={
        en
          ? 'Nested calorimeter with insulation, cover, immersed thermometer and glass stirrer'
          : '有外壳、隔热层、内筒和杯盖的量热器，温度计与玻璃搅拌器浸入液体'
      }
    >
      <defs>
        <linearGradient id="chem-cal-glass">
          <stop stopColor="#e9eeed" stopOpacity=".7" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".15" />
          <stop offset="1" stopColor="#a7b8b1" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <path
        d="M73 64V205Q73 214 84 214H235Q246 214 246 205V64Z"
        fill="#e6e5d8"
        stroke="#bec3b4"
        strokeWidth="2"
      />
      <path
        d="M93 64V190Q93 200 104 200H216Q227 200 227 190V64Z"
        fill="url(#chem-cal-glass)"
        stroke="#a9b8ad"
        strokeWidth="2"
      />
      <path
        d="M95 133Q160 129 225 133V189Q225 198 215 198H105Q95 198 95 188Z"
        fill="#b7d4cf"
        opacity=".65"
      />
      <ellipse cx="160" cy="133" rx="64" ry="4" fill="#dae6df" />
      <path d="M68 60H251V70H68Z" fill="#adaf9b" stroke="#989f8a" />
      <path d="M135 17V172" stroke="#a6b8ac" strokeWidth="9" strokeLinecap="round" />
      <path d={`M135 172V${139 - (temperature - 20) * 11}`} stroke="#b69b83" strokeWidth="3" />
      <circle cx="135" cy="176" r="6" fill="#b69b83" />
      {[40, 60, 80, 100, 120].map((y) => (
        <path key={y} d={`M139 ${y}h6`} stroke="#8e9c8b" />
      ))}
      <path
        d={`M191 22V170q${10 * Math.cos(p * 12)} 12 -12 12h-11`}
        fill="none"
        stroke="#acbbb4"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text x="209" y="33" fill="#819079" fontSize="20">
        {temperature.toFixed(2)}°C
      </text>
      <path d="M75 113H31" stroke="#a7af9c" />
      <text x="12" y="103" fill="#87937e" fontSize="20">
        {en ? 'Insulation' : '隔热层'}
      </text>
    </svg>
  );
}
function IceChambers({
  p,
  ice,
  en,
}: {
  p: number;
  ice: ReturnType<typeof iceCalorimetry>;
  en: boolean;
}) {
  return (
    <svg
      className="chem-cal-ice"
      viewBox="0 0 320 275"
      role="img"
      aria-label={
        en
          ? 'Section through an ice calorimeter: central carbon chamber, measurement ice, outer guard ice; independent drains and inlet and outlet gas tubes'
          : '冰量热计剖面：中央碳燃烧室、测量冰层、外围防护冰层；两层融水独立排出，并有进气和出气管'
      }
    >
      <path
        d="M31 46Q31 37 43 37H278Q289 37 289 46V172L257 202H62L31 172Z"
        fill="#e5ece6"
        stroke="#a9b9aa"
        strokeWidth="2"
      />
      <path
        d="M62 59H258V164L215 184H105L62 164Z"
        fill="#d1e1de"
        stroke="#92ada5"
        strokeWidth="2"
      />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={i}
          d={`M${i % 2 === 0 ? 72 : 225} ${76 + Math.floor(i / 2) * 18}l12-6 10 10-12 5Z`}
          fill="#f2f8f4"
          stroke="#b8cfca"
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={`M${i % 2 === 0 ? 37 : 265} ${68 + Math.floor(i / 2) * 31}l9-5 10 11-11 5Z`}
          fill="#f4f6eb"
          stroke="#c6d4c3"
        />
      ))}
      <path
        d="M112 78H207V142L197 151H122L112 142Z"
        fill="#f6f4eb"
        stroke="#a4afa0"
        strokeWidth="2"
      />
      {[122, 140, 160, 180, 198].map((x) => (
        <path key={x} d={`M${x} 144v10`} stroke="#8e9c86" />
      ))}
      <path d="M119 6V101M200 101H241V76H219V14" stroke="#f9faf3" strokeWidth="8" fill="none" />
      <path d="M119 6V101M200 101H241V76H219V14" stroke="#aabbb0" strokeWidth="2" fill="none" />
      <path d="M114 28l5 7 5-7M214 29l5-7 5 7" stroke="#8ba6a0" strokeWidth="2" fill="none" />
      <text x="67" y="22" fill="#8b9c82" fontSize="20">
        {en ? 'Air' : '空气'}
      </text>
      <ellipse
        cx="160"
        cy="136"
        rx={17 * (1 - p)}
        ry={8 * (1 - p)}
        fill={p > 0 && p < 1 ? '#ac7c58' : '#70796d'}
      />
      {p > 0 && p < 1 ? (
        <path d="M152 128q-7-14 7-28-1 13 10 18 2 9-8 13" fill="#ceae7c" opacity=".75" />
      ) : null}
      <path d="M160 184V231M289 162H304V231" stroke="#a2b7ae" strokeWidth="5" fill="none" />
      <path d="M160 184V231M289 162H304V231" stroke="#e9f0e9" strokeWidth="2" fill="none" />
      {p > 0 ? (
        <>
          <circle cx="160" cy="238" r="3" fill="#9dbdb6" />
          <circle cx="304" cy="238" r="3" fill="#b9c9ab" />
        </>
      ) : null}
      <path
        d="M129 231V260Q160 269 190 260V231M277 231V260Q295 269 315 260V231"
        fill="#f1f4ed"
        stroke="#b2c0b2"
        strokeWidth="2"
      />
      <path
        d={`M131 ${260 - Math.min(22, ice.middleMelt * 4)}H188V259Q160 266 131 259Z`}
        fill="#bdd4cd"
      />
      <path
        d={`M279 ${260 - Math.min(22, ice.guardMelt * 4)}H313V259Q295 265 279 259Z`}
        fill="#d6dfc7"
      />
      <text x="160" y="118" textAnchor="middle" fontSize="20" fill="#84917a">
        C
      </text>
    </svg>
  );
}
