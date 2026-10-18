import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  tofuBalance,
  tofuDirector,
  tofuNodes,
  soyBeanRadius,
} from '../../models/chem-tofu-coagulation';
import '../../styles/chem-tofu-coagulation.css';
export default function ChemTofuCoagulation() {
  const bowlClip = useId();
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('network'),
    [heat, setHeat] = useState(1),
    [dose, setDose] = useState(0.8),
    [press, setPress] = useState(0.4);
  const d = film.watch
    ? tofuDirector(film.chapter, film.chapterProgress)
    : { ...tofuDirector(view === 'network' ? 4 : 5, 1), heat, dose, press };
  const m = tofuBalance(d.heat, d.dose, d.press);
  const curdHeight = (100 * m.curdMass) / 708.22,
    curdTop = 202 - curdHeight;
  const labels = [
    say('泡豆：水进入豆粒', 'Soak: water enters the beans'),
    say('磨豆：释放分散物', 'Grind: release dispersed material'),
    say('过滤：豆渣与豆浆分开', 'Filter: separate okara and milk'),
    say('煮浆：蛋白质结构改变', 'Heat: protein structure changes'),
    say('点卤：形成凝胶网络', 'Coagulate: form a gel network'),
    say('压制：排出部分水分', 'Press: release some water'),
    say('成形：网络保留水与固形物', 'Shape: a hydrated protein network'),
  ];
  return (
    <section className="chem-tofu">
      <div className="chem-tofu-title">{labels[d.chapter]}</div>
      <svg
        className="chem-tofu-svg"
        viewBox="0 0 320 270"
        role="img"
        aria-label={labels[d.chapter]}
      >
        <defs>
          <clipPath id={bowlClip}>
            <path d="M30 77Q35 240 160 240T290 77Z" />
          </clipPath>
        </defs>
        {d.chapter < 2 ? (
          <>
            <path
              d="M30 77Q35 240 160 240T290 77"
              fill="#ece4c9"
              stroke="#b4a789"
              strokeWidth="3"
            />
            <ellipse
              cx="160"
              cy="77"
              rx="130"
              ry="24"
              fill={d.chapter === 0 ? '#d8e6df' : '#efe6ca'}
              stroke="#b4a789"
              strokeWidth="2"
            />
            <g clipPath={`url(#${bowlClip})`}>
              {Array.from({ length: 13 }, (_, i) => {
                const x = 70 + (i % 5) * 44,
                  y = 115 + Math.floor(i / 5) * 36;
                return (
                  <g key={i} opacity={d.chapter === 1 ? 1 - d.grind : 1}>
                    <ellipse
                      cx={x}
                      cy={y}
                      rx={soyBeanRadius(d.soak) * 1.2}
                      ry={soyBeanRadius(d.soak)}
                      fill="#cfbb79"
                      stroke="#ac995d"
                    />
                    <path d={`M${x - 2} ${y - 4}q5 5 0 9`} fill="none" stroke="#8f804e" />
                  </g>
                );
              })}
            </g>
            {d.chapter === 1 ? (
              <>
                <path
                  d={`M${155 + 18 * Math.sin(d.p * 12)} 15l-28 159q9 14 29 5l28-157Z`}
                  fill="#b0a292"
                  stroke="#827c70"
                  strokeWidth="2"
                />
                {tofuNodes.map((n) => (
                  <circle
                    key={n.id}
                    cx={n.x * 0.7 + 50}
                    cy={n.y * 0.55 + 90}
                    r={3 + 5 * d.grind}
                    fill="#faf4dc"
                    opacity={d.grind}
                  />
                ))}
              </>
            ) : (
              Array.from({ length: 6 }, (_, i) => (
                <path
                  key={i}
                  d={`M${90 + i * 25} 55v24m-4-5 4 5 4-5`}
                  fill="none"
                  stroke="#76a6a8"
                  strokeWidth="2"
                  opacity={d.soak}
                />
              ))
            )}
          </>
        ) : null}
        {d.chapter === 2 ? (
          <>
            <path
              d="M42 235V35H278V235M25 235H60M260 235H295M70 35V40M250 35V40"
              fill="none"
              stroke="#a9ad9a"
              strokeWidth="2"
            />
            <path
              d="M70 40Q160 140 250 40L222 111Q160 155 98 111Z"
              fill="#eee9da"
              stroke="#aba18d"
              strokeWidth="2"
            />
            <path d="M80 44Q160 110 240 44" fill="#c9bd92" stroke="#a89a74" strokeWidth="2" />
            {Array.from({ length: 14 }, (_, i) => (
              <circle
                key={i}
                cx={105 + (i % 7) * 18}
                cy={66 + Math.floor(i / 7) * 18}
                r="5"
                fill="#baa87a"
                opacity={d.filter}
              />
            ))}
            <path
              d="M94 153V219Q94 242 117 242H203Q226 242 226 219V153"
              fill="#e7eadf"
              stroke="#a6b2a6"
              strokeWidth="2"
            />
            <path
              d={`M97 ${224 - d.filter * 58}H223V219Q223 239 203 239H117Q97 239 97 219Z`}
              fill="#f1e9cb"
            />
            {Array.from({ length: 5 }, (_, i) => (
              <path
                key={i}
                d={`M${130 + i * 15} ${129 + ((d.p * 50 + i * 9) % 38)}v8`}
                stroke="#dfcfaa"
                strokeWidth="3"
                opacity={d.filter > 0 ? 1 : 0}
              />
            ))}
            <text x="160" y="28" textAnchor="middle" fontSize="20" fill="#8f805e">
              {say('豆渣', 'Okara')}
            </text>
          </>
        ) : null}
        {d.chapter === 3 || d.chapter === 4 ? (
          <>
            <rect x="20" y="30" width="280" height="210" rx="45" fill="#f5edda" />
            {d.chapter === 4
              ? m.network.edges.map((e, i) => {
                  const a = tofuNodes[e.a],
                    b = tofuNodes[e.b];
                  return (
                    <path
                      key={i}
                      d={`M${a.x} ${a.y}Q${(a.x + b.x) / 2 + 5} ${(a.y + b.y) / 2 - 6} ${b.x} ${b.y}`}
                      stroke="#a28d5a"
                      strokeWidth="4"
                      fill="none"
                      opacity={e.weight}
                    />
                  );
                })
              : null}
            {tofuNodes.map((n) => (
              <path
                key={n.id}
                d={Array.from({ length: 14 }, (_, i) => {
                  const t = (i / 13) * 6.28;
                  const x = n.x + Math.cos(t) * (10 - 6 * d.heat) + (i / 13 - 0.5) * 22 * d.heat,
                    y = n.y + Math.sin(t) * (8 - 3 * d.heat);
                  return `${i ? 'L' : 'M'}${x} ${y}`;
                }).join(' ')}
                stroke="#ac955f"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            ))}
            {d.chapter === 3 ? (
              <>
                <path
                  d="M80 253q20-20 40 0t40 0 40 0 40 0"
                  stroke="#c99c75"
                  strokeWidth="4"
                  fill="none"
                  opacity={d.heat}
                />
              </>
            ) : (
              Array.from({ length: 6 }, (_, i) => (
                <circle key={i} cx={50 + i * 44} cy="16" r="5" fill="#7f9ca0" opacity={d.dose} />
              ))
            )}
          </>
        ) : null}
        {d.chapter === 5 ? (
          <>
            <path d="M50 83V211H270V83" fill="#d8c298" stroke="#b3986d" strokeWidth="3" />
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={`M${65 + i * 27} 90V203`} stroke="#bea274" strokeWidth="4" />
            ))}
            <path
              d={`M60 ${curdTop}H260V202H60Z`}
              fill="#eee6cc"
              stroke="#c8bb94"
              strokeWidth="2"
            />
            {tofuNodes.map((n) => (
              <path
                key={n.id}
                d={`M${55 + n.x * 0.66} ${curdTop + 5 + ((n.y - 65) * curdHeight) / 160}q10-5 18 0t18 0`}
                fill="none"
                stroke="#c1b389"
                strokeWidth="1.5"
                opacity={m.network.gel * 0.7}
              />
            ))}
            <path d={`M43 ${curdTop - 13}H277V${curdTop}H43Z`} fill="#ae9470" />
            <path
              d={`M125 ${curdTop - 52}H195V${curdTop - 14}H125Z`}
              fill="#7c8e85"
              stroke="#66796e"
              strokeWidth="2"
            />
            <path d="M30 237Q160 282 290 237" fill="#d6e3d9" stroke="#a8b9ad" strokeWidth="2" />
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                d={`M${65 + i * 31} ${214 + ((d.p * 20 + i * 4) % 23)}v5`}
                stroke="#a2c0b4"
                strokeWidth="3"
                opacity={d.press * m.network.gel}
              />
            ))}
          </>
        ) : null}
        {d.chapter === 6 ? (
          <>
            <path
              d="M36 68L75 39H282V202L244 232H36Z"
              fill="#ded2ad"
              stroke="#b7a77d"
              strokeWidth="2"
            />
            <path d="M36 68H244V232H36Z" fill="#f3ebd3" />
            {Array.from({ length: 28 }, (_, i) => (
              <circle
                key={i}
                cx={51 + (i % 7) * 29}
                cy={82 + Math.floor(i / 7) * 45}
                r={4 + (2 * m.curd.water) / m.curdMass}
                fill="#95b9b9"
                opacity=".65"
              />
            ))}
            {m.network.edges.map((e, i) => (
              <line
                key={i}
                x1={37 + tofuNodes[e.a].x * 0.67}
                y1={35 + tofuNodes[e.a].y * 0.82}
                x2={37 + tofuNodes[e.b].x * 0.67}
                y2={35 + tofuNodes[e.b].y * 0.82}
                stroke="#ac955f"
                strokeWidth="3"
                opacity={e.weight}
              />
            ))}
            <path d="M36 68L75 39M244 68L282 39M244 232L282 202" stroke="#b7a77d" strokeWidth="2" />
          </>
        ) : null}
      </svg>
      <div className="chem-tofu-evidence">
        {d.chapter === 0
          ? say('吸水膨胀', 'Hydration and swelling')
          : d.chapter === 1
            ? say('同一批豆粒被磨碎', 'The same beans are disrupted')
            : d.chapter === 2
              ? say('蛋白质仍分散在豆浆中', 'Protein remains dispersed in the milk')
              : d.chapter === 3
                ? say('蛋白质形状示意', 'Symbolic protein conformations')
                : d.chapter === 4
                  ? 'Ca²⁺ / Mg²⁺'
                  : d.chapter === 5
                    ? say('水减少，蛋白质不会凭空增加', 'Less water; no new protein')
                    : say('凝胶中仍含水', 'Water remains within the gel')}
      </div>
      {!film.watch ? (
        <div className="chem-tofu-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'network', label: say('凝胶网络', 'Gel network') },
              { value: 'press', label: say('压制成形', 'Pressing') },
            ]}
          />
          <Range
            label={say('热处理程度（示意）', 'Thermal preparation (model)')}
            value={heat}
            onChange={setHeat}
            min={0}
            max={1}
            step={0.01}
          />
          <Range
            label={say('离子促凝作用（示意）', 'Ion-driven association (model)')}
            value={dose}
            onChange={setDose}
            min={0}
            max={1}
            step={0.01}
          />
          {view === 'press' ? (
            <Range
              label={say('压制程度', 'Pressing fraction')}
              value={press}
              onChange={setPress}
              min={0}
              max={1}
              step={0.01}
            />
          ) : null}
          <div>
            {say('示意豆腐中的蛋白质 / 初始蛋白质', 'Model curd protein / initial protein')}:{' '}
            {(m.proteinRecovery * 100).toFixed(0)}%
          </div>
        </div>
      ) : null}
    </section>
  );
}
