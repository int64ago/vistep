import { useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  rateClamp as clamp,
  peroxide,
  marble,
  turbidity,
  zincGas,
  observedRate,
  collision,
  energyProfile,
  syringeGeometry,
  RATE_IDS,
  rateFilm,
  thermalTrials,
  encounterWindow,
  opticalCriterion,
  ratePrediction,
} from '../../models/chem-reaction-rates';
import '../../styles/chem-reaction-rates.css';
type Say = (zh: string, en: string) => string;
const names = [
  ['温度', 'Temperature'],
  ['浓度与表面', 'Concentration / surface'],
  ['稀释', 'Dilution'],
  ['温度与浑浊', 'Temperature / cloudiness'],
  ['催化剂', 'Catalysts'],
  ['相同标准', 'Same criterion'],
  ['气体终点', 'Gas endpoint'],
  ['曲线与漏气', 'Curves / leaks'],
  ['能量条件', 'Energy'],
  ['取向条件', 'Orientation'],
  ['反应路径', 'Pathway'],
];
const palette = ['#688f85', '#bb835e', '#8e7d9c'];
function Label({
  x,
  y,
  children,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text x={x} y={y} textAnchor={anchor}>
      {children}
    </text>
  );
}
function Tubes({
  w,
  ch,
  p,
  temp,
  surface,
  stockMl,
  say,
}: {
  w: number;
  ch: number;
  p: number;
  temp: number;
  surface: number;
  stockMl: number;
  say: Say;
}) {
  const n = ch === 4 ? 3 : 2,
    dilution = ch === 2 || ch === 5,
    thio = ch === 2 || ch === 3 || ch === 5,
    seconds = p * 24;
  return (
    <g data-view="apparatus">
      {Array.from({ length: n }, (_, i) => {
        const x = ((i + 0.5) * w) / n,
          t = ch === 0 || ch === 3 ? (i ? temp : 20) : 25,
          stock = (ch === 2 || ch === 5) && i ? stockMl : 2,
          catalyst = ch === 4 ? (['none', 'Mn', 'Fe'] as const)[i] : 'Fe',
          h = peroxide(seconds, t, catalyst, ch === 4 ? 10 : 5),
          m = marble(seconds, i ? 1 : 0.1, surface),
          a = turbidity(seconds, stock, t),
          flux = ch === 1 ? m.rate : h.rate,
          bubbles = Math.min(9, Math.ceil(flux * 120000));
        const top =
          ch === 4
            ? ['—', 'MnO₂', 'FeCl₃'][i]
            : ch === 1
              ? `${i ? 1 : 0.1} M`
              : dilution
                ? `${stock} mL ${say('原液', 'stock')}`
                : `${t} °C`;
        return (
          <g key={i} data-sample={i}>
            <Label x={x} y={22}>
              {top}
            </Label>
            {dilution && (
              <Label x={x} y={45}>
                {2 - stock} mL H₂O
              </Label>
            )}
            {(ch === 0 || ch === 3) && (
              <path
                d={`M${x - 38} 94V178Q${x - 38} 185 ${x - 30} 185H${x + 30}Q${x + 38} 185 ${x + 38} 178V94`}
                fill={t > 30 ? '#efd5ba' : '#d1e4e7'}
                stroke="#b1c4bd"
              />
            )}
            <path
              d={`M${x - 21} ${dilution ? 59 : 44}V158Q${x - 21} 178 ${x} 178Q${x + 21} 178 ${x + 21} 158V${dilution ? 59 : 44}`}
              fill="#f7f8ef"
              stroke="#a6b8ac"
              strokeWidth="2"
            />
            {thio && (
              <path
                d={`M${x - 10} 123l20 20m0-20l-20 20`}
                stroke="#52736b"
                strokeWidth="4"
                opacity={a.transmission}
              />
            )}
            <path
              d={`M${x - 19} 87V158Q${x - 19} 176 ${x} 176Q${x + 19} 176 ${x + 19} 158V87Z`}
              fill={thio ? '#eee3b0' : catalyst === 'Fe' && ch !== 1 ? '#dfd4a1' : '#c5dcd4'}
              opacity={thio ? 1 - a.transmission : 0.62}
            />
            <path d={`M${x - 19} 87Q${x} 91 ${x + 19} 87`} fill="none" stroke="#9fb6aa" />
            {ch === 1
              ? Array.from({ length: surface === 1 ? 1 : 8 }, (_, j) => {
                  const r = (surface === 1 ? 11 : 5.5) * Math.cbrt(m.solidLeft / 0.001);
                  return (
                    <circle
                      key={j}
                      cx={x + (surface === 1 ? 0 : ((j % 4) - 1.5) * 8)}
                      cy={164 - (surface === 1 ? 0 : Math.floor(j / 4) * 8)}
                      r={r}
                      fill="#d1cdb9"
                      stroke="#b7b09d"
                    />
                  );
                })
              : ch === 4 && i === 1
                ? Array.from({ length: 6 }, (_, j) => (
                    <circle
                      key={j}
                      cx={x - 12 + j * 5}
                      cy={169 - (j % 2) * 2}
                      r="3"
                      fill="#77786b"
                    />
                  ))
                : null}
            {!thio &&
              Array.from({ length: bubbles }, (_, j) => {
                const q = (seconds * 0.16 + j / bubbles) % 1;
                return (
                  <circle
                    key={j}
                    cx={x - 12 + ((j * 7) % 24)}
                    cy={161 - q * 70}
                    r={2 + q * 1.8}
                    fill="#f8fbf2"
                    stroke="#a9beb2"
                    opacity={1 - clamp((q - 0.8) / 0.2)}
                  />
                );
              })}
            <Label x={x} y={208}>
              {thio
                ? `${Math.round(a.transmission * 100)}% ${say('透光', 'light')}`
                : ch === 4
                  ? i
                    ? say('有催化', 'catalyst')
                    : say('空白', 'blank')
                  : `${(ch === 1 ? m.volume : h.oxygenMl).toFixed(1)} mL`}
            </Label>
          </g>
        );
      })}
      <Label x={w / 2} y={238}>
        {dilution
          ? say('模型 · 均加入2mL酸', 'Model · +2mL acid each')
          : say('示例计算 · 非实测记录', 'Illustration · not measurements')}
      </Label>
    </g>
  );
}
function Thermal({ w, temp, p, say }: { w: number; temp: number; p: number; say: Say }) {
  const trials = thermalTrials(temp, p),
    x = (e: number) => 52 + ((e - 27) * (w - 70)) / 17,
    barrier = x(35);
  return (
    <g data-view="thermal">
      <Label x={w / 2} y={20}>
        20 → {(20 + (temp - 20) * p).toFixed(0)} °C
      </Label>
      <Label x={barrier} y={42}>
        35 kJ/mol
      </Label>
      <path d={`M${barrier} 48V207`} stroke="#bc8362" strokeDasharray="4 4" />
      {trials.map((a, i) => (
        <g key={a.id} data-trial={a.id} data-eligible={a.eligible} data-energy={a.energy}>
          <Label x={12} y={63 + i * 20} anchor="start">
            {a.id}
          </Label>
          <path
            d={`M${x(29 + i)} ${58 + i * 20}H${x(a.energy)}`}
            stroke={a.eligible ? '#719a86' : '#b7b7a0'}
            strokeWidth="4"
          />
          <circle
            cx={x(a.energy)}
            cy={58 + i * 20}
            r="6"
            fill={a.eligible ? '#729b85' : '#c4c6b6'}
            stroke="#f7f8ee"
          />
          {a.id === 'E6' && (
            <circle cx={x(a.energy)} cy={58 + i * 20} r="10" fill="none" stroke="#be8d63" />
          )}
        </g>
      ))}
      <Label x={w / 2} y={237}>
        {say('选取近门槛个案 · 机制示意', 'Selected near-threshold cases')}
      </Label>
    </g>
  );
}
function Encounters({ w, p, say }: { w: number; p: number; say: Say }) {
  return (
    <g data-view="encounters">
      <Label x={w / 2} y={20}>
        {say('同样时间、同样判据', 'Same interval, same criterion')}
      </Label>
      {[1, 2].map((c, i) => {
        const a = encounterWindow(c as 1 | 2, p),
          y = 58 + i * 95;
        return (
          <g key={c} data-encounter-lane={c} data-effective={a.effective}>
            <Label x={12} y={y} anchor="start">
              {c}×
            </Label>
            <path
              d={`M42 ${y + 22}H${w - 15}`}
              stroke="#e0e5d7"
              strokeWidth="29"
              strokeLinecap="round"
            />
            <path d={`M${w - 65} ${y + 3}v38`} stroke="#9cae9c" strokeDasharray="4 3" />
            {a.events.map((e, j) => {
              const x =
                44 +
                (w - 65 - 44) * Math.min(e.phase * 2, 1) +
                (e.phase > 0.5 ? (e.eligible ? 1 : -1) * (e.phase - 0.5) * 55 : 0);
              return (
                <circle
                  key={e.id}
                  data-event={`${c}-${e.id}`}
                  cx={x}
                  cy={y + 22 + ((j % 3) - 1) * 7}
                  r="4"
                  fill={e.arrived ? (e.eligible ? '#709985' : '#b4b6a4') : '#acbba9'}
                  stroke={j === 0 ? '#b47e53' : 'none'}
                  strokeWidth={j === 0 ? 2 : 0}
                  opacity={e.phase === 0 ? 0.15 : 1}
                />
              );
            })}
            <Label x={w - 12} y={y + 61} anchor="end">
              {a.effective} / {a.arrived} {say('有效', 'effective')}
            </Label>
          </g>
        );
      })}
      <Label x={w / 2} y={239}>
        {say('代表性相遇 · 不推定反应级数', 'Generic encounter model')}
      </Label>
    </g>
  );
}
function Pathway({ w, p, say }: { w: number; p: number; say: Say }) {
  const y = (e: number) => 157 - e * 1.6,
    x = (q: number) => 32 + q * (w - 62);
  return (
    <g data-view="pathway">
      <Label x={w / 2} y={21}>
        {say('改变路径，不移动起终点', 'New pathway; same endpoints')}
      </Label>
      <text x={w * 0.25} y={45} textAnchor="middle" style={{ fill: palette[0] }}>
        {say('无催化', 'Uncatalyzed')}
      </text>
      <text x={w * 0.75} y={45} textAnchor="middle" style={{ fill: palette[1] }}>
        {say('有催化', 'Catalyzed')}
      </text>
      <path d={`M28 44V198H${w - 18}`} fill="none" stroke="#a9baad" />
      {[false, true].map((c, i) => (
        <g key={i}>
          <polyline
            points={Array.from(
              { length: 81 },
              (_, j) => `${x(j / 80)},${y(energyProfile(j / 80, c))}`,
            ).join(' ')}
            fill="none"
            stroke={palette[i]}
            strokeWidth="3"
          />
          <circle cx={x(p)} cy={y(energyProfile(p, c))} r="6" fill={palette[i]} />
        </g>
      ))}
      <Label x={33} y={180} anchor="start">
        R
      </Label>
      <Label x={w - 27} y={216} anchor="end">
        P
      </Label>
      <Label x={w / 2} y={238}>
        {say('通用能量图 · 同一 ΔH', 'Generic energy profile · same ΔH')}
      </Label>
    </g>
  );
}
function Prediction({ w, ch, reveal, say }: { w: number; ch: number; reveal: boolean; say: Say }) {
  const result = ratePrediction(ch),
    questions = [
      say('更热，最终氧气也更多吗？', 'Warmer: more final oxygen?'),
      say('磨碎后，最终气量会增加吗？', 'Crush it: more final gas?'),
      say('再稀十倍，还会遮住靶吗？', 'Tenfold dilution: will it obscure?'),
      say('升温需要降低门槛吗？', 'Must warming lower the barrier?'),
      say('催化后，氧气总量更多吗？', 'Catalyst: more final oxygen?'),
    ],
    answer = [
      say('相同初始量，极限产量相同', 'Same starting amount; same limit'),
      say('面积改变快慢，不增加物料', 'More area, no extra reactant'),
      say('硫的上限不足以达到阈值', 'Too little sulfur for this threshold'),
      say('门槛不动，更多个案越过', 'Same barrier; more cases cross'),
      say('改变路径，不增加氧原子', 'New pathway, no extra oxygen'),
    ];
  return (
    <g data-view="prediction" data-revealed={reveal}>
      <foreignObject x="8" y="8" width={w - 16} height="58">
        <div className="crr16-question">{questions[ch]}</div>
      </foreignObject>
      {ch === 2 ? (
        <>
          <path d={`M36 170H${w - 30}`} stroke="#bcc8b7" />
          <path d={`M36 150H${w - 30}`} stroke="#bc8564" strokeDasharray="5 4" />
          <Label x={w / 2} y={138}>
            {say('共同遮光阈值', 'Common optical threshold')}
          </Label>
          {reveal && (
            <>
              <rect x={w / 2 - 22} y="164" width="44" height="6" fill="#c5b878" />
              <Label x={w / 2} y={197}>
                {'maximum' in result ? result.maximum.toFixed(4) : '—'} &lt;{' '}
                {'target' in result ? result.target.toFixed(4) : '—'} M
              </Label>
            </>
          )}
        </>
      ) : ch === 3 ? (
        <>
          <path d={`M${w / 2} 75V178`} stroke="#bb8565" strokeWidth="3" />
          <circle cx={w / 2 - 40} cy="110" r="10" fill="#b4c3b5" />
          <circle cx={reveal ? w / 2 + 40 : w / 2 - 40} cy="155" r="10" fill="#739784" />
          <Label x={w / 2} y={207}>
            {reveal ? 'Eₐ = Eₐ' : '?'}
          </Label>
        </>
      ) : (
        <>
          {[0, 1].map((i) => (
            <g key={i}>
              <rect
                x={w * (i ? 0.7 : 0.3) - 24}
                y={reveal ? 110 : 149}
                width="48"
                height={reveal ? 65 : 26}
                rx="9"
                fill={palette[i]}
                opacity={reveal ? 0.75 : 0.18}
              />
              <Label x={w * (i ? 0.7 : 0.3)} y={203}>
                {reveal && 'a' in result ? `${result[i ? 'b' : 'a']!.toFixed(1)} mL` : '?'}
              </Label>
            </g>
          ))}
        </>
      )}
      {reveal && (
        <foreignObject x="6" y="213" width={w - 12} height="42">
          <div className="crr16-answer">{answer[ch]}</div>
        </foreignObject>
      )}
    </g>
  );
}
function Syringe({
  w,
  p,
  acid,
  leak,
  say,
}: {
  w: number;
  p: number;
  acid: number;
  leak: number;
  say: Say;
}) {
  const endpoint = zincGas(0, acid, leak).endpoint,
    time = (endpoint ?? 30) * p,
    a = zincGas(time, acid, leak),
    g = syringeGeometry(w, a.volumeMl),
    cx = w / 2;
  return (
    <g data-view="syringe" data-volume={a.volumeMl}>
      <Label x={cx} y={20}>
        {acid} M H₂SO₄ · 40 mL
      </Label>
      <rect x={g.x0} y="49" width="90" height="22" rx="3" fill="#eff4e7" stroke="#9eb5aa" />
      <rect x={g.x0} y="51" width={g.piston - g.x0} height="18" fill="#d4dfbb" />
      <path d={`M${g.piston} 49V71m0-11h44m0-9v18`} stroke="#78978a" strokeWidth="3" />
      {[0, 10, 20].map((v) => (
        <g key={v}>
          <path d={`M${g.x0 + v * 4.5} 48V43`} stroke="#8b9f91" />
          <Label x={g.x0 + v * 4.5} y={39}>
            {v}
          </Label>
        </g>
      ))}
      <path
        d={`M${g.x0} 60H${g.x0 - 15}V99H${cx - 9}V128`}
        fill="none"
        stroke="#a9bdb2"
        strokeWidth="7"
      />
      <path
        d={`M${g.x0} 60H${g.x0 - 15}V99H${cx - 9}V128`}
        fill="none"
        stroke="#eef5e5"
        strokeWidth="3"
      />
      <path
        d={`M${cx - 17} 111V137L${cx - 56} 191Q${cx - 60} 201 ${cx - 50} 201H${cx + 50}Q${cx + 60} 201 ${cx + 56} 191L${cx + 17} 137V111Z`}
        fill="#f0f5e9"
        stroke="#a1b7ac"
        strokeWidth="2"
      />
      <path
        d={`M${cx - 36} 167L${cx - 53} 194Q${cx - 55} 198 ${cx - 48} 198H${cx + 48}Q${cx + 55} 198 ${cx + 53} 194L${cx + 36} 167Z`}
        fill="#c4dbcd"
      />
      <rect x={cx - 18} y="109" width="36" height="9" rx="3" fill="#b5a487" />
      <path
        d={`M${cx + 1} 82H${cx + 23}L${cx + 10} 97V134`}
        fill="#f4f6eb"
        stroke="#a1b5a7"
        strokeWidth="2"
      />
      <path d={`M${cx + 3} 103h14`} stroke="#809b8c" strokeWidth="3" />
      {Array.from({ length: 6 }, (_, j) => (
        <ellipse key={j} cx={cx - 23 + j * 9} cy={194 - (j % 2) * 2} rx="4" ry="3" fill="#93a6a0" />
      ))}
      <Label x={cx} y={157}>
        Zn · 2 g
      </Label>
      <Label x={cx} y={226}>
        {a.volumeMl.toFixed(1)} mL · {time.toFixed(1)} s
      </Label>
      <Label x={cx} y={247}>
        {say('模型时钟，非教材实测', 'Model clock, not book data')}
      </Label>
    </g>
  );
}
function Curves({ w, p, leak, say }: { w: number; p: number; leak: number; say: Say }) {
  const xx = (t: number) => 35 + (t * (w - 62)) / 30,
    yy = (v: number) => 185 - v * 3.5;
  return (
    <g data-view="curves">
      <Label x={w / 2} y={21}>
        {say('生成量 ≠ 收集量', 'Produced ≠ collected')}
      </Label>
      <path d={`M35 42V185H${w - 18}`} fill="none" stroke="#a7b6a4" />
      {[10, 20, 30, 40].map((v) => (
        <g key={v}>
          <path
            d={`M35 ${yy(v)}H${w - 18}`}
            stroke="#d6dece"
            strokeDasharray={v === 10 ? '5 4' : undefined}
          />
          <Label x={29} y={yy(v) + 5} anchor="end">
            {v}
          </Label>
        </g>
      ))}
      {[1, 4].map((acid, i) => (
        <g key={acid}>
          {[0, leak].map((l, j) => (
            <polyline
              key={j}
              data-curve={`${acid}-${j}`}
              points={Array.from({ length: 61 }, (_, k) => {
                const t = (p * 30 * k) / 60;
                return `${xx(t)},${yy(Math.min(40, zincGas(t, acid, l).volumeMl))}`;
              }).join(' ')}
              fill="none"
              stroke={palette[i]}
              strokeWidth="2.5"
              strokeDasharray={j ? '5 4' : undefined}
            />
          ))}
          <Label x={w * (i ? 0.75 : 0.25)} y={216}>
            {acid} M
          </Label>
        </g>
      ))}
      <Label x={w - 19} y={201} anchor="end">
        30 s
      </Label>
      <Label x={w / 2} y={244}>
        {say('实线生成 · 虚线收集', 'Solid: produced · dash: collected')}
      </Label>
    </g>
  );
}
function Collision({
  w,
  p,
  enough,
  orientation,
  say,
}: {
  w: number;
  p: number;
  enough: boolean;
  orientation: boolean;
  say: Say;
}) {
  const c = collision(w, p, enough, orientation);
  return (
    <g data-view="collision">
      <Label x={w / 2} y={21}>
        {enough ? say('E ≥ 门槛', 'E ≥ threshold') : say('E < 门槛', 'E < threshold')}
      </Label>
      <Label x={w / 2} y={45}>
        {orientation
          ? say('氢端相向', 'H ends facing')
          : say('取向不合适', 'Unfavorable orientation')}
      </Label>
      {(
        [
          [0, 1, c.hi],
          [2, 3, c.hi],
          [0, 2, c.hh],
          [1, 3, c.ii],
        ] as [number, number, boolean][]
      ).map(
        ([a, b, show], i) =>
          show && (
            <line
              key={i}
              x1={c.atoms[a].x}
              y1={c.atoms[a].y}
              x2={c.atoms[b].x}
              y2={c.atoms[b].y}
              stroke="#a29e9d"
              strokeWidth="4"
            />
          ),
      )}
      {c.atoms.map((a) => (
        <g key={a.id} data-atom={a.id}>
          <circle
            cx={a.x}
            cy={a.y}
            r={a.r}
            fill={a.element === 'H' ? '#dbd6b3' : '#a591b5'}
            stroke="#9d9b9a"
          />
          {a.element === 'I' && (
            <Label x={a.x} y={a.y + 6}>
              I
            </Label>
          )}
        </g>
      ))}
      <Label x={w / 2} y={221}>
        {c.hi ? '2 HI' : c.ii ? 'H₂ + I₂' : 'H₂ + 2 I·'}
      </Label>
      <Label x={w / 2} y={246}>
        {say('教材两步示意 · 保留四原子', 'Book pathway · four stable atoms')}
      </Label>
    </g>
  );
}
export default function ChemReactionRates() {
  const f = useShowcase(),
    { host, width } = useSignalWidth(),
    w = clamp(width, 240, 800),
    locale = browserLocale() === 'en' ? 'en' : 'zh',
    say: Say = (z, e) => (locale === 'en' ? e : z);
  type Exploration = {
    chapter: number;
    p: number;
    shot: string;
    reveal: boolean;
    temp: number;
    surface: number;
    stock: number;
    acid: number;
    leak: number;
    enough: boolean;
    orientation: boolean;
  };
  const auto = rateFilm(f.chapter, f.chapterTime, locale);
  const watchState: Exploration = {
    chapter: auto.chapter,
    p: auto.shot === 'collision' ? auto.trialProgress : auto.progress,
    shot: auto.shot,
    reveal: auto.reveal,
    temp: 50,
    surface: 1,
    stock: 1,
    acid: auto.shot === 'syringe' ? auto.syringeAcid : 1,
    leak: auto.shot === 'leak' ? auto.progress * 0.5 : 0,
    enough: auto.chapter !== 8 || auto.trial === 1,
    orientation: auto.chapter !== 9 || auto.trial === 1,
  };
  const lastWatch = useRef(watchState);
  if (f.watch) lastWatch.current = watchState;
  const [manual, setManual] = useState<Exploration | null>(null),
    [time1, setTime1] = useState(''),
    [time4, setTime4] = useState('');
  const state = f.watch ? watchState : (manual ?? lastWatch.current);
  const change = (patch: Partial<Exploration>) => setManual({ ...state, ...patch });
  const { chapter, p, shot, reveal, temp, surface, stock, acid, leak, enough, orientation } = state;
  const q = p,
    t = temp,
    sp = surface,
    cp = p,
    energy = enough,
    orient = orientation,
    mechanism = ['thermal', 'encounters', 'pathway'].includes(shot);
  const setP = (p: number) => change({ p }),
    setTemp = (temp: number) => change({ temp }),
    setStock = (stock: number) => change({ stock }),
    setLeak = (leak: number) => change({ leak });
  const titles: { [key: string]: string } = {
    observation: say('看同一段时间', 'Compare the same interval'),
    thermal: say('追踪能量改变', 'Track the energy change'),
    encounters: say('相遇变多，判据不变', 'More encounters, same rule'),
    prediction: say('先预测，再揭晓', 'Predict, then reveal'),
    design: say('把观察标准固定', 'Fix the viewing criterion'),
    syringe: say('同一气体体积', 'The same gas volume'),
    curves: say('读曲线，不数气泡', 'Read the curve'),
    leak: say('气体去了哪里？', 'Where did the gas go?'),
    collision: say('追踪同样四个原子', 'Track the same four atoms'),
    pathway: say('同一起点和终点', 'Same start and finish'),
  };
  const questionVisible = shot === 'prediction',
    isRevealed = reveal;
  const range = (
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    on: (v: number) => void,
  ) => (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => on(+e.target.value)}
      />
    </label>
  );
  return (
    <div
      className="crr16"
      ref={host}
      data-chapter={RATE_IDS[chapter]}
      data-watch={f.watch}
      data-shot={shot}
      data-reveal={isRevealed}
      data-progress={q}
      data-enough={energy}
      data-orientation={orient}
    >
      <div className="crr16-head">{titles[shot]}</div>
      <svg viewBox={`0 0 ${w} 255`} role="img" aria-label={titles[shot]}>
        {shot === 'observation' || shot === 'design' ? (
          <Tubes w={w} ch={chapter} p={q} temp={t} surface={sp} stockMl={stock} say={say} />
        ) : shot === 'thermal' ? (
          <Thermal w={w} temp={t} p={q} say={say} />
        ) : shot === 'encounters' ? (
          <Encounters w={w} p={q} say={say} />
        ) : questionVisible ? (
          <Prediction w={w} ch={chapter} reveal={isRevealed} say={say} />
        ) : shot === 'pathway' ? (
          <Pathway w={w} p={q} say={say} />
        ) : shot === 'syringe' ? (
          <Syringe w={w} p={q} acid={acid} leak={leak} say={say} />
        ) : shot === 'curves' || shot === 'leak' ? (
          <Curves w={w} p={shot === 'leak' ? 1 : q} leak={leak} say={say} />
        ) : (
          <Collision w={w} p={cp} enough={energy} orientation={orient} say={say} />
        )}
      </svg>
      {!f.watch && (
        <div className="crr16-controls">
          <label htmlFor="crr16-scene">
            {say('学习位置', 'Learning view')}
            <select
              id="crr16-scene"
              aria-label={say('学习位置', 'Learning view')}
              value={chapter}
              onChange={(e) => {
                const chapter = +e.target.value;
                change({
                  chapter,
                  p: 0.75,
                  reveal: false,
                  temp: 50,
                  surface: 1,
                  stock: 1,
                  acid: 1,
                  leak: 0,
                  enough: true,
                  orientation: true,
                  shot:
                    chapter < 5
                      ? 'observation'
                      : chapter === 5
                        ? 'design'
                        : chapter === 6
                          ? 'syringe'
                          : chapter === 7
                            ? 'curves'
                            : chapter < 10
                              ? 'collision'
                              : 'pathway',
                });
              }}
            >
              {names.map(([z, e], i) => (
                <option key={i} value={i}>
                  {say(z, e)}
                </option>
              ))}
            </select>
          </label>
          {range('crr16-progress', say('过程进度', 'Event progress'), p, 0, 1, 0.005, setP)}
          {chapter < 5 && (
            <div className="crr16-buttons">
              <button
                aria-pressed={shot === 'observation'}
                onClick={() => {
                  change({ shot: 'observation', reveal: false });
                }}
              >
                {say('观察', 'Observation')}
              </button>
              <button
                aria-pressed={mechanism}
                onClick={() => {
                  change({
                    shot: ['thermal', 'encounters', 'encounters', 'thermal', 'pathway'][chapter],
                    reveal: false,
                  });
                }}
              >
                {say('机制', 'Mechanism')}
              </button>
              <button
                aria-pressed={reveal}
                onClick={() =>
                  change({ shot: 'prediction', reveal: shot === 'prediction' ? !reveal : true })
                }
              >
                {say('检验预测', 'Test prediction')}
              </button>
            </div>
          )}
          {(chapter === 0 || chapter === 3) &&
            range(
              'crr16-temperature',
              `${say('第二组温度', 'Second temperature')} / °C`,
              temp,
              20,
              60,
              5,
              setTemp,
            )}
          {chapter === 1 && (
            <button
              aria-pressed={surface === 2}
              onClick={() => change({ surface: surface === 1 ? 2 : 1 })}
            >
              {say('同量固体磨碎', 'Crush equal solid')}: {surface}×
            </button>
          )}
          {(chapter === 2 || chapter === 5) && (
            <>
              {range(
                'crr16-stock',
                `${say('原液体积', 'Stock volume')} / mL`,
                stock,
                0.1,
                2,
                0.1,
                setStock,
              )}
              <p data-optical-reachable={opticalCriterion(stock, 25).reachable}>
                {say('固定光程下，模型到半透光', 'Model time to half transmission')}:{' '}
                {opticalCriterion(stock, 25).time?.toFixed(1) ?? say('达不到', 'unreachable')}{' '}
                {opticalCriterion(stock, 25).time !== null ? 's' : ''}
              </p>
            </>
          )}
          {(chapter === 6 || chapter === 7) && (
            <>
              <label htmlFor="crr16-acid">
                {say('硫酸浓度', 'Sulfuric acid concentration')}
                <select
                  id="crr16-acid"
                  value={acid}
                  onChange={(e) => change({ acid: +e.target.value })}
                >
                  <option value="1">1 M</option>
                  <option value="4">4 M</option>
                </select>
              </label>
              {range('crr16-leak', say('漏气比例', 'Leak fraction'), leak, 0, 1, 0.1, setLeak)}
              <p>
                {say('模型至10mL', 'Model time to 10mL')}:{' '}
                {zincGas(0, acid, leak).endpoint?.toFixed(1) ?? say('达不到', 'unreachable')}
              </p>
              {[time1, time4].map((v, i) => (
                <label key={i} htmlFor={`crr16-time${i}`}>
                  {say('自己的实测秒数', 'Your measured seconds')} · {i ? 4 : 1} M
                  <input
                    id={`crr16-time${i}`}
                    inputMode="decimal"
                    value={v}
                    onChange={(e) => (i ? setTime4 : setTime1)(e.target.value)}
                  />
                </label>
              ))}
              <p>
                {observedRate(time1)?.toFixed(3) ?? '—'} / {observedRate(time4)?.toFixed(3) ?? '—'}{' '}
                mL/s
              </p>
            </>
          )}
          {(chapter === 8 || chapter === 9) && (
            <div className="crr16-buttons">
              <button aria-pressed={enough} onClick={() => change({ enough: !enough })}>
                {say('达到能量条件', 'Enough energy')}
              </button>
              <button
                aria-pressed={orientation}
                onClick={() => change({ orientation: !orientation })}
              >
                {say('有利取向', 'Favorable orientation')}
              </button>
            </div>
          )}
          <details>
            <summary>{say('模型与教材证据', 'Model and textbook evidence')}</summary>
            <p>
              {say(
                '教材给出配方与定性结论，原始时间格为空。曲线、秒数和能量个案是教学构造，不是实测。选取近门槛个案只展示可能跨过门槛，不代表总体分子计数，也不据此拟合宏观速率。',
                'The book supplies recipes and qualitative conclusions; its time cells are blank. Curves, times and selected energy cases are teaching constructions. Near-threshold cases do not represent population counts or fit macroscopic rates.',
              )}
            </p>
            <p>
              {say(
                '通用相遇图不冒充过氧化氢或酸化硫代硫酸盐的完整机理。气泡仅提示通量。两种催化剂使用相同示意常数，不建立真实效率排名。',
                'The generic encounter view is not a complete peroxide or acidified-thiosulfate mechanism. Bubbles indicate flux. Equal illustrative catalyst constants do not rank their real efficiencies.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
