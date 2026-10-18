import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { methaneSubstitution, methaneDirector } from '../../models/chem-methane-substitution';
import '../../styles/chem-methane-substitution.css';
export default function ChemMethaneSubstitution() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('vessels'),
    [light, setLight] = useState('light'),
    [progress, setProgress] = useState(1),
    [chlorine, setChlorine] = useState(8);
  const d = film.watch
    ? methaneDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'vessels' ? 2 : 4,
        progress,
        reactionProgress: progress,
        replacement: 0,
        substitutionPhase: 0,
      };
  const m = methaneSubstitution(
    d.reactionProgress,
    film.watch || light === 'light',
    film.watch ? 8 : chlorine,
  );
  const names = [
    ['相同气体，只改变光照', 'Same gases, different light'],
    ['颜色在光照侧变浅', 'The illuminated gas fades'],
    ['液滴与上升的液面', 'Droplets and a rising liquid level'],
    ['一个氢被一个氯替代', 'One chlorine replaces one hydrogen'],
    ['取代还可以继续', 'Substitution can continue'],
  ];
  const formulas = ['CH₄', 'CH₃Cl', 'CH₂Cl₂', 'CHCl₃', 'CCl₄'];
  return (
    <section className="chem-methane">
      <div className="chem-methane-heading">{say(names[d.chapter][0], names[d.chapter][1])}</div>
      {d.chapter < 3 ? (
        <>
          <div className="chem-methane-pair">
            <Vessel m={methaneSubstitution(0, false, film.watch ? 8 : chlorine)} dark en={en} />
            <Vessel m={m} dark={false} en={en} />
          </div>
          <div className="chem-methane-reservoir">
            {say('饱和NaCl溶液', 'Saturated NaCl solution')}
          </div>
          {d.chapter === 2 ? (
            <div className="chem-methane-evidence">
              <span>{say('HCl → 水相', 'HCl → aqueous phase')}</span>
            </div>
          ) : (
            <div className="chem-methane-initial">CH₄ + Cl₂</div>
          )}
          <div className="chem-methane-note">
            {say('液面与液滴仅示趋势', 'Qualitative levels and drops')}
          </div>
        </>
      ) : d.chapter === 3 ? (
        <>
          <MolecularStep replacement={d.replacement} phase={d.substitutionPhase} en={en} />
          <div className="chem-methane-equation">
            {formulas[d.replacement]} + Cl₂
            <br />→ {formulas[d.replacement + 1]} + HCl
          </div>
          <div className="chem-methane-note">{say('净反应记账', 'Net reaction account')}</div>
        </>
      ) : (
        <>
          <div className="chem-methane-products">
            {formulas.map((f, i) => (
              <div key={f}>
                <strong>{f}</strong>
                <div>
                  <i style={{ width: `${(m.products[i] / 8) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="chem-methane-note">
            {say('示例分布 · 非产率', 'Illustrative mix · not yield')}
          </div>
        </>
      )}
      {!film.watch ? (
        <div className="chem-methane-controls">
          <Segments
            label={say('观察层次', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'vessels', label: say('装置现象', 'Apparatus') },
              { value: 'products', label: say('产物类别', 'Products') },
            ]}
          />
          <Segments
            label={say('新一组对照', 'Fresh comparison')}
            value={light}
            onChange={setLight}
            options={[
              { value: 'light', label: say('光照组', 'Illuminated') },
              { value: 'dark', label: say('遮光组', 'Dark') },
            ]}
          />
          <Range
            label={say('过程进度', 'Progress')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          <Range
            label={say('每8份甲烷的Cl₂示意份数', 'Cl₂ units per 8 methane units')}
            value={chlorine}
            min={0}
            max={32}
            step={1}
            onChange={setChlorine}
          />
        </div>
      ) : null}
    </section>
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
function MolecularStep({
  replacement,
  phase,
  en,
}: {
  replacement: number;
  phase: number;
  en: boolean;
}) {
  const targets = [
      [135, 38],
      [205, 110],
      [135, 182],
      [65, 110],
    ],
    q = Math.max(0, Math.min(1, (phase - 0.15) / 0.7));
  const mix = (a: number, b: number) => a + (b - a) * q,
    chosen = targets[replacement];
  const h = [mix(chosen[0], 244), mix(chosen[1], 205)],
    incoming = [mix(267, chosen[0]), mix(53, chosen[1])],
    partner = [mix(267, 285), mix(109, 205)];
  const atom = (x: number, y: number, element: string, key: string) => (
    <g key={key}>
      <circle
        cx={x}
        cy={y}
        r={element === 'H' ? 15 : 20}
        fill={element === 'H' ? '#e2e9da' : '#b9c99f'}
      />
      <text x={x} y={y + 6} textAnchor="middle" fontSize="20" fill="#77896a">
        {element}
      </text>
    </g>
  );
  return (
    <svg
      className="chem-methane-molecule"
      viewBox="0 0 320 245"
      role="img"
      aria-label={
        en
          ? 'The same hydrogen atom moves to HCl; one chlorine bonds to carbon and the second to that hydrogen. Net substitution bookkeeping, not an elementary reaction.'
          : '同一个氢原子移到HCl；一个氯连到碳，另一个连到这个氢。净取代反应记账，并非基元反应。'
      }
    >
      {targets.map(([x, y], i) =>
        i !== replacement ? (
          <g key={i}>
            <path d={`M135 110L${x} ${y}`} stroke="#b3c1ac" strokeWidth="4" strokeLinecap="round" />
            {atom(x, y, i < replacement ? 'Cl' : 'H', String(i))}
          </g>
        ) : null,
      )}
      <path d={`M135 110L${h[0]} ${h[1]}`} stroke="#b3c1ac" strokeWidth="4" opacity={1 - q} />
      <path
        d={`M135 110L${incoming[0]} ${incoming[1]}`}
        stroke="#b3c1ac"
        strokeWidth="4"
        opacity={q}
      />
      <path
        d={`M${incoming[0]} ${incoming[1]}L${partner[0]} ${partner[1]}`}
        stroke="#b3c1ac"
        strokeWidth="4"
        opacity={1 - q}
      />
      <path
        d={`M${h[0]} ${h[1]}L${partner[0]} ${partner[1]}`}
        stroke="#b3c1ac"
        strokeWidth="4"
        opacity={q}
      />
      <circle cx="135" cy="110" r="23" fill="#a9b9a0" />
      <text x="135" y="117" textAnchor="middle" fontSize="21" fill="#f6f7ef">
        C
      </text>
      {atom(h[0], h[1], 'H', 'tracked-h')}
      {atom(incoming[0], incoming[1], 'Cl', 'incoming-cl')}
      {atom(partner[0], partner[1], 'Cl', 'partner-cl')}
    </svg>
  );
}
