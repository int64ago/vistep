import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  distillationSpecies,
  distillationTrace,
  distillationAt,
  distillationDirector,
  fractions,
  total,
  vapourPath,
} from '../../models/chem-distillation';
import '../../styles/chem-distillation.css';
export default function ChemDistillation() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    id = useId().replace(/:/g, '');
  const [progress, setProgress] = useState(0.25),
    [feedChoice, setFeedChoice] = useState('mixture'),
    [cooling, setCooling] = useState('on');
  const feed =
    feedChoice === 'mixture' ? [0.45, 0.35, 0.2] : feedChoice === 'dcm' ? [1, 0, 0] : [0, 0, 1];
  const trace = useMemo(
    () => distillationTrace(film.watch ? [0.45, 0.35, 0.2] : feed),
    [film.watch, feedChoice],
  );
  const d = film.watch
    ? distillationDirector(film.chapter, film.chapterProgress)
    : { ...distillationDirector(5, 1), batch: progress, cooling: cooling === 'on', p: progress };
  const m = distillationAt(trace, d.batch, d.cooling),
    labels = [
      say('相同装置，不同挥发性', 'One apparatus, different volatility'),
      say('汽相先富集易挥发组分', 'Vapour is enriched in the volatile component'),
      say('一路追踪蒸气与液滴', 'Follow vapour into liquid drops'),
      say('测量蒸馏头的温度', 'Read the distillation-head temperature'),
      say('分段收集，组成有差别', 'Separate cuts have different compositions'),
      say('瓶内液体也在改变', 'The liquid in the flask changes too'),
      say('冷凝决定是否收集成液体', 'Condensation determines liquid collection'),
    ];
  const colors = distillationSpecies.map((s) => s.color);
  const collected = total(m.collected.map(total));
  return (
    <section className="chem-distill">
      <div className="chem-distill-title">{labels[d.chapter]}</div>
      {d.chapter === 0 ? (
        <div className="chem-distill-species">
          {distillationSpecies.map((s, i) => (
            <div key={s.formula}>
              <i style={{ background: s.color }} />
              <span>{s.formula}</span>
              <b>{[40, 62, 77][i]}°C</b>
            </div>
          ))}
          <div className="chem-distill-note">
            {say('教材近似常压沸点', 'Textbook normal boiling points')}
          </div>
        </div>
      ) : null}
      {d.chapter !== 0 && d.chapter !== 4 ? (
        <>
          <svg
            className="chem-distill-apparatus"
            viewBox="0 0 320 265"
            role="img"
            aria-label={say(
              '蒸馏烧瓶、蒸馏头、冷凝管与开放接收器连续连接',
              'Connected flask, distillation head, condenser and open receiver',
            )}
          >
            <defs>
              <clipPath id={`${id}flask`}>
                <path d="M79 116V161A47 47 0 1 0 103 161V116Z" />
              </clipPath>
              <clipPath id={`${id}receiver`}>
                <path d="M241 184V199L223 241Q220 248 229 248H293Q302 248 299 241L281 199V184Z" />
              </clipPath>
              <linearGradient id={`${id}glass`}>
                <stop stopColor="#f8faf4" />
                <stop offset=".45" stopColor="#e5ede7" />
                <stop offset=".7" stopColor="#fbfcf6" />
                <stop offset="1" stopColor="#d9e4df" />
              </linearGradient>
            </defs>
            <path
              d="M79 76V161A47 47 0 1 0 103 161V76"
              fill={`url(#${id}glass)`}
              stroke="#8caaa0"
              strokeWidth="2"
            />
            <rect
              x="42"
              y={245 - 77 * total(m.remaining)}
              width="100"
              height="90"
              fill="#c2d3b9"
              clipPath={`url(#${id}flask)`}
            />
            {Array.from({ length: 24 }, (_, i) => {
              const x = 51 + (i % 6) * 15,
                y = 189 + Math.floor(i / 6) * 15;
              const f = fractions(m.remaining),
                k = (i + 0.5) / 24 < f[0] ? 0 : (i + 0.5) / 24 < f[0] + f[1] ? 1 : 2;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={colors[k]}
                  clipPath={`url(#${id}flask)`}
                  opacity={y > 245 - 77 * total(m.remaining) ? 1 : 0}
                />
              );
            })}
            <path d="M91 117V76H115L261 151V184" fill="none" stroke="#8caaa0" strokeWidth="11" />
            <path d="M91 117V76H115L261 151V184" fill="none" stroke="#f7faf4" strokeWidth="7" />
            <g transform="translate(145 92) rotate(27.18)">
              <rect
                x="0"
                y="-14"
                width="108"
                height="28"
                rx="9"
                fill={d.cooling ? '#c3dfdb' : '#eef0e6'}
                fillOpacity=".7"
                stroke="#95b5ac"
                strokeWidth="2"
              />
              <path d="M14-14V-30M95 14V30" stroke="#95b5ac" strokeWidth="7" />
              <path d="M14-14V-30M95 14V30" stroke="#e1f0ea" strokeWidth="3" />
              <path d="M-6 0H115" stroke="#96aba0" strokeWidth="6" />
              <path d="M-6 0H115" stroke="#f7faf1" strokeWidth="3" />
              {d.cooling ? (
                <path d="M86 8H24m7-4-7 4 7 4" fill="none" stroke="#6ea9ae" strokeWidth="2" />
              ) : null}
            </g>
            <path
              d="M241 184V199L223 241Q220 248 229 248H293Q302 248 299 241L281 199V184"
              fill={`url(#${id}glass)`}
              stroke="#91aaa1"
              strokeWidth="2"
            />
            <path
              d={`M${225 + (collected < 0.05 ? 4 : 0)} ${245 - collected * 65}H${297 - (collected < 0.05 ? 4 : 0)}L295 245H228Z`}
              fill="#bbd5c4"
              clipPath={`url(#${id}receiver)`}
              opacity={collected ? 1 : 0}
            />
            <path d="M47 255H135" stroke="#b5a184" strokeWidth="8" strokeLinecap="round" />
            <rect x="77" y="69" width="28" height="10" rx="3" fill="#b6b79a" />
            <rect x="85" y="16" width="12" height="59" rx="6" fill="#e4eee6" stroke="#91a59a" />
            <path
              d={`M91 70V${70 - d.phase * (m.equilibrium.celsius - 20) * 0.7}`}
              stroke="#b18a72"
              strokeWidth="3"
            />
            <circle cx="91" cy="76" r="5" fill="#b18a72" />
            {d.chapter === 3 ? (
              <>
                <circle cx="91" cy="76" r="13" fill="none" stroke="#a98d64" strokeWidth="2" />
                <path d="M108 65L145 47" stroke="#a98d64" />
                <text x="148" y="46" fontSize="21" fill="#8f7651">
                  {m.equilibrium.celsius.toFixed(1)}°C
                </text>
              </>
            ) : null}
            {Array.from({ length: 9 }, (_, i) => {
              const q = (d.p * 1.2 + i / 9) % 1,
                pos = vapourPath(q),
                k =
                  (i + 0.5) / 9 < m.equilibrium.vapour[0]
                    ? 0
                    : (i + 0.5) / 9 < m.equilibrium.vapour[0] + m.equilibrium.vapour[1]
                      ? 1
                      : 2;
              return (
                <circle
                  key={i}
                  cx={pos.x}
                  cy={pos.y}
                  r={pos.condensing && d.cooling ? 3 : 2}
                  fill={colors[k]}
                  opacity={d.phase * 0.9}
                />
              );
            })}
            {!d.cooling ? (
              <path
                d="M261 183q20-12 36-5"
                fill="none"
                stroke="#a7b9ac"
                strokeWidth="3"
                strokeDasharray="3 4"
              />
            ) : null}
          </svg>
          {d.chapter === 1 ? (
            <div className="chem-distill-composition">
              <Composition label={say('液相', 'Liquid')} values={m.equilibrium.liquid} />
              <Composition label={say('汽相', 'Vapour')} values={m.equilibrium.vapour} />
            </div>
          ) : d.chapter === 3 ? (
            <div className="chem-distill-note">
              {say('感温部位位于蒸气出口高度', 'Sensor at the vapour-outlet height')}
            </div>
          ) : d.chapter === 6 ? (
            <div className="chem-distill-note">
              {say('液态收集量', 'Collected liquid')}: {(100 * collected).toFixed(1)}% ·{' '}
              {say('原料份额', 'of feed')}
            </div>
          ) : (
            <div className="chem-distill-composition">
              <Composition label={say('瓶内', 'Flask')} values={m.equilibrium.liquid} />
            </div>
          )}
        </>
      ) : null}
      {d.chapter === 4 ? (
        <div className="chem-distill-fractions">
          {m.collected.map((v, i) => (
            <div key={i}>
              <span>
                {say('馏分', 'Cut')} {i + 1}
              </span>
              <svg viewBox="0 0 100 120" role="img" aria-label={`${i + 1}`}>
                <path
                  d="M20 5V108Q20 115 28 115H72Q80 115 80 108V5"
                  fill="#edf2e8"
                  stroke="#a0b3a3"
                  strokeWidth="2"
                />
                {v.map((amount, k) => {
                  const top = 112 - 400 * total(v.slice(0, k + 1));
                  return (
                    <rect
                      key={k}
                      x="23"
                      y={top}
                      width="54"
                      height={400 * amount}
                      fill={colors[k]}
                    />
                  );
                })}
              </svg>
              <b>{(100 * total(v)).toFixed(1)}%</b>
            </div>
          ))}
          <div className="chem-distill-note">
            {say('各色高度表示组分的相对物质的量', 'Colour height represents component amount')}
          </div>
        </div>
      ) : null}
      <div className="chem-distill-legend">
        {distillationSpecies.map((s) => (
          <span key={s.formula}>
            <i style={{ background: s.color }} />
            {s.formula}
          </span>
        ))}
      </div>
      {!film.watch ? (
        <div className="chem-distill-controls">
          <Segments
            label={say('起始组成', 'Starting composition')}
            value={feedChoice}
            onChange={setFeedChoice}
            options={[
              { value: 'mixture', label: say('混合物', 'Mixture') },
              { value: 'dcm', label: 'CH₂Cl₂' },
              { value: 'ccl4', label: 'CCl₄' },
            ]}
          />
          <Range
            label={say('收集进度（相对模型终点）', 'Progress toward the model endpoint')}
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={setProgress}
          />
          <Segments
            label={say('独立冷凝条件对照', 'Separate condensation trial')}
            value={cooling}
            onChange={setCooling}
            options={[
              { value: 'on', label: say('有效冷凝', 'Effective cooling') },
              { value: 'off', label: say('无冷凝对照', 'No condensation') },
            ]}
          />
          <div>
            {say('平衡温度', 'Equilibrium temperature')}: {m.equilibrium.celsius.toFixed(1)}°C
            <br />
            {say('已收集原料份额', 'Collected feed fraction')}: {(100 * collected).toFixed(1)}%
          </div>
        </div>
      ) : null}
    </section>
  );
}
function Composition({ label, values }: { label: string; values: readonly number[] }) {
  return (
    <div className="chem-distill-composition-row">
      <span>{label}</span>
      <div>
        {values.map((v, i) => (
          <i key={i} style={{ width: `${100 * v}%`, background: distillationSpecies[i].color }} />
        ))}
      </div>
    </div>
  );
}
