import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  phytochromeState,
  vernalizationState,
  annualRingLayers,
  statolithPositions,
  tropicGrowth,
  type PlantLight,
} from '../../models/bio-plant-environment';
import { signalPathPoint } from '../../models/bio-chemical-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-plant-environment.css';
export default function BioPlantEnvironment() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [chosen, setChosen] = useState(film.variant === 'bio-elective-1-108-1' ? 5 : 0),
    [time, setTime] = useState(0.9),
    [light, setLight] = useState<PlantLight>('red'),
    [cold, setCold] = useState(1),
    [gravity, setGravity] = useState(true),
    [injured, setInjured] = useState(false);
  const mode = film.watch ? (film.chapter < 2 ? 0 : Math.min(5, film.chapter - 1)) : chosen,
    p = film.watch ? film.chapterProgress : time;
  const selectedLight = film.watch ? 'red' : light,
    photo = phytochromeState(
      film.watch ? (film.chapter === 0 ? p * 0.45 : 0.45 + p * 0.55) : p,
      selectedLight,
      selectedLight === 'far-red' ? 0.9 : 0.1,
    ),
    response = photo.downstream;
  const hurt = film.watch ? film.chapter === 8 : injured,
    grav = film.watch || gravity;
  const labels = [
    s('光先成为信号', 'Light becomes a signal'),
    s('低温经历留下影响', 'Cold history matters'),
    s('年轮中的细胞差别', 'Cell differences within annual rings'),
    s('根冠中的沉降', 'Sedimentation within the root cap'),
    s('同一重力，不同弯曲', 'One gravity vector, opposite bends'),
    s('根冠实验的因果对照', 'Causal controls for the root cap'),
  ];
  const nucleusX = w * 0.68,
    receptorX = w * 0.25;
  const wheat = (x: number, history: number) => {
    const f = vernalizationState(history, p),
      top = 245 - 65 * f.flowering;
    return (
      <g key={x}>
        <path d={`M${x - 37} 280h74l-7 28h-60Z`} fill="#c7b99d" stroke="#ad9e83" />
        <path d={`M${x} 280V${top}`} stroke="#899e6b" strokeWidth="4" />
        {[0, 1, 2, 3].map((i) => {
          const y = 270 - i * 9,
            side = i % 2 ? -1 : 1;
          return (
            <path
              key={i}
              d={`M${x} ${y}q${side * 30}-75 ${side * 34}-70q${-side * 9} 51 ${-side * 34} 70`}
              fill="#aabf87"
              stroke="#8ca66d"
            />
          );
        })}
        {f.flowering > 0 && (
          <g opacity={f.flowering}>
            {Array.from({ length: 6 }, (_, i) => (
              <path
                key={i}
                d={`M${x} ${top - i * 7}q${i % 2 ? 15 : -15}-11 ${i % 2 ? 11 : -11}-17Q${x} ${top - i * 7 - 11} ${x} ${top - i * 7}`}
                fill="#c8ba79"
                stroke="#a49a65"
              />
            ))}
          </g>
        )}
        <text x={x} y="77" textAnchor="middle">
          {history > 0 ? s('经历低温', 'Cold history') : s('未经低温', 'No cold history')}
        </text>
        <path d={`M${x - 38} 102h76`} stroke="#e0e4d6" strokeWidth="7" strokeLinecap="round" />
        <path
          d={`M${x - 38} 102h${f.memory * 76}`}
          stroke="#a3b6b2"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>
    );
  };
  const organ = (
    x: number,
    y: number,
    kind: 'root' | 'shoot',
    cap = true,
    healthy = true,
    progress = p,
  ) => {
    const f = tropicGrowth(progress, kind, cap, healthy, mode === 4 ? grav : true),
      end = f.point(1);
    return (
      <g transform={`translate(${x} ${y})`}>
        <ellipse cx="-10" cy="0" rx="15" ry="11" fill="#ceb47c" stroke="#ae9465" />
        <path
          d={f.outline()}
          fill={kind === 'root' ? '#e0d6ba' : '#b3c895'}
          stroke={kind === 'root' ? '#b1a383' : '#91aa75'}
          strokeWidth="2"
        />
        {[0.2, 0.4, 0.6, 0.8].map((t) => {
          const a = f.point(t, 1),
            b = f.point(t, -1);
          return (
            <path
              key={t}
              d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
              stroke={kind === 'root' ? '#c5b99b' : '#9ab281'}
            />
          );
        })}
        {[1, -1].flatMap((side) =>
          [0.2, 0.4, 0.6, 0.8].map((u, i) => {
            const pos = f.point(u, side * 0.5);
            return (
              <circle
                key={`${side}-${i}`}
                cx={pos.x}
                cy={pos.y}
                r="2"
                fill="#a98750"
                opacity={(side === 1 ? f.upperAuxin : f.lowerAuxin) * progress}
              />
            );
          }),
        )}
        {cap && kind === 'root' && (
          <path
            d="M0-7Q14 0 0 7Z"
            transform={`translate(${end.x} ${end.y}) rotate(${(end.angle * 180) / Math.PI})`}
            fill="#bdc1a5"
            stroke="#9fa786"
          />
        )}
        {kind === 'shoot' && (
          <path
            d="M0 0q14-20 25-8Q16 4 0 0"
            transform={`translate(${end.x} ${end.y}) rotate(${(end.angle * 180) / Math.PI})`}
            fill="#9fbb7e"
            stroke="#839f68"
          />
        )}
      </g>
    );
  };
  return (
    <div ref={host} className="bio-environment" data-watch={film.watch}>
      <div className="bio-environment-head">{labels[mode]}</div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} 365`} role="img" aria-label={labels[0]}>
          <ellipse
            cx={w / 2}
            cy="141"
            rx={w * 0.45}
            ry="89"
            fill="#edf0df"
            stroke="#b2c39a"
            strokeWidth="2"
          />
          <circle cx={nucleusX} cy="137" r="44" fill="#d8dfc6" />
          <path
            d={`M${nucleusX - 38} 159A44 44 0 1 1 ${nucleusX - 43} 146`}
            fill="none"
            stroke="#a1b18a"
            strokeWidth="3"
          />
          <path
            d={`M${receptorX - 10} 142q-16-13 0-26q16 13 0 26M${receptorX + 10} 142q${photo.active * 25 + 3} -13 0-26q-16 13 0 26`}
            fill="#b6be91"
            stroke="#909d6e"
            strokeWidth="2"
          />
          <path
            d={`M${receptorX - 18} 45l18 53m-7-6 7 6 1-9`}
            stroke={selectedLight === 'far-red' ? '#987784' : '#bb8e6b'}
            strokeWidth="3"
            fill="none"
            opacity={selectedLight === 'dark' ? 0 : 1}
          />
          <text x={receptorX} y="28" textAnchor="middle">
            {selectedLight === 'red'
              ? s('红光', 'Red')
              : selectedLight === 'far-red'
                ? s('远红光', 'Far-red')
                : s('黑暗', 'Dark')}
          </text>
          <text x={receptorX} y="180" textAnchor="middle">
            {s('光敏色素', 'Phytochrome')}
          </text>
          <text x={nucleusX} y="80" textAnchor="middle">
            {s('细胞核', 'Nucleus')}
          </text>
          {[0, 1].map((i) => (
            <path
              key={i}
              d={`M${nucleusX - 18} ${119 + i * 14}q9-14 18 0t18 0`}
              stroke={response > 0.1 ? '#aa8b63' : '#aeb69e'}
              fill="none"
              strokeWidth="3"
            />
          ))}
          <path
            d={`M${receptorX + 24} 130H${nucleusX - 49}m-6-5 6 5-6 5`}
            stroke="#a8ad84"
            strokeWidth="2"
            fill="none"
            opacity={photo.active}
          />
          {Array.from({ length: 5 }, (_, i) => {
            const q = Math.max(0, Math.min(1, (response - i * 0.07) / 0.65)),
              pos = signalPathPoint(
                [
                  { x: nucleusX - 10, y: 137 },
                  { x: nucleusX - 40, y: 155 },
                  { x: w * 0.44, y: 195 },
                ],
                q,
              );
            return (
              <path
                key={i}
                d={`M${pos.x - 5} ${pos.y}q3-4 6 0t6 0`}
                stroke="#ae9268"
                strokeWidth="2"
                fill="none"
                opacity={q > 0 ? 1 : 0}
              />
            );
          })}
          <text x={w / 2} y="219" textAnchor="middle">
            {s('表达响应', 'Expression response')} {response.toFixed(2)}
          </text>
          <path d={`M${w / 2} 240v16m-4-5 4 5 4-5`} fill="none" stroke="#a8b38e" />
          <path d={`M${w / 2} 335V${290 - 20 * response}`} stroke="#a4b57e" strokeWidth="4" />
          <path
            d={`M${w / 2} 302q-45-${17 + response * 15}-38-${23 + response * 15}q28-9 38 ${23 + response * 15}q45-${17 + response * 15} 38-${23 + response * 15}q-28-9-38 ${23 + response * 15}`}
            fill={`rgb(${Math.round(192 - 40 * response)},${Math.round(194 - 18 * response)},${Math.round(131 - 22 * response)})`}
            stroke="#9aaf7d"
          />
          <path d={`M${w / 2} 335l-8 14m8-14 8 14`} stroke="#c5b694" strokeWidth="2" />
        </svg>
      )}
      {mode === 1 && (
        <svg viewBox={`0 0 ${w} 350`} role="img" aria-label={labels[1]}>
          <text x={w / 2} y="29" textAnchor="middle">
            {s('冬性类型 · 随后条件相同', 'Winter type · later warmth')}
          </text>
          {wheat(w * 0.26, 0)}
          {wheat(w * 0.74, film.watch ? 1 : cold)}
          <text x={w / 2} y="338" textAnchor="middle">
            {s('低温经历 ≠ 当前温度', 'Cold history ≠ current temperature')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg viewBox={`0 0 ${w} 350`} role="img" aria-label={labels[2]}>
          <circle cx={w / 2} cy="176" r="23" fill="#d1bf97" />
          {annualRingLayers(3, p).flatMap((layer) =>
            [0, 1].flatMap((season) => {
              const inner = season ? layer.springOuter : layer.inner,
                outer = season ? layer.outer : layer.springOuter,
                thickness = outer - inner,
                n = Math.ceil((2 * Math.PI * Math.max(inner, 1)) / (season ? 8 : 16));
              return Array.from({ length: n }, (_, i) => {
                const a = (i / n) * 2 * Math.PI,
                  b = ((i + 1) / n) * 2 * Math.PI,
                  point = (r: number, t: number) =>
                    `${w / 2 + r * Math.cos(t)} ${176 + r * Math.sin(t)}`;
                return (
                  <path
                    key={`${layer.year}-${season}-${i}`}
                    d={`M${point(inner, a)}A${inner} ${inner} 0 0 1 ${point(inner, b)}L${point(outer, b)}A${outer} ${outer} 0 0 0 ${point(outer, a)}Z`}
                    fill={season ? '#b7a47f' : '#e2d3af'}
                    stroke="#c1b08b"
                    strokeWidth={thickness > 0.1 ? 1.2 : 0}
                  />
                );
              });
            }),
          )}
          <text x={w / 2} y="30" textAnchor="middle">
            {s('原创木质部截面示意', 'Original xylem cross-section')}
          </text>
          <text x={w / 2} y="315" textAnchor="middle">
            {s('早材较疏大 · 晚材较致密', 'Large earlywood · dense latewood')}
          </text>
        </svg>
      )}
      {mode === 3 && (
        <svg viewBox={`0 0 ${w} 320`} role="img" aria-label={labels[3]}>
          <rect
            x={w / 2 - 95}
            y="91"
            width="190"
            height="106"
            rx="19"
            fill="#e6eccc"
            stroke="#a9bb8c"
            strokeWidth="3"
          />
          <rect
            x={w / 2 - 88}
            y="98"
            width="176"
            height="92"
            rx="15"
            fill="#f1f2dd"
            stroke="#c7d1a8"
          />
          {statolithPositions(p, grav).map((m) => (
            <circle
              key={m.id}
              cx={w / 2 + m.x}
              cy={144 + m.y}
              r="7"
              fill="#c1b27e"
              stroke="#a69b6b"
            />
          ))}
          <path
            d={`M${w / 2 + 115} 111v58m-5-7 5 7 5-7`}
            stroke="#a49a7c"
            strokeWidth="2"
            fill="none"
            opacity={grav ? 1 : 0}
          />
          <text x={w / 2} y="39" textAnchor="middle">
            {s('横放后的平衡石细胞', 'A reoriented statocyte')}
          </text>
          <text x={w / 2} y="237" textAnchor="middle">
            {grav
              ? s('淀粉体沿重力沉降', 'Amyloplasts settle downward')
              : s('没有定向沉降', 'No directed sedimentation')}
          </text>
          <text x={w / 2} y="279" textAnchor="middle">
            {s('沉降后才形成下游响应', 'Sedimentation precedes response')}
          </text>
        </svg>
      )}
      {mode === 4 && (
        <svg viewBox={`0 0 ${w} ${compact ? 350 : 310}`} role="img" aria-label={labels[4]}>
          <text x={w / 2} y="22" textAnchor="middle">
            {s('棕色：生长素相对分布', 'Brown: relative auxin distribution')}
          </text>
          {(['root', 'shoot'] as const).map((kind, i) => {
            const x = compact ? 45 : (w * (i + 0.5)) / 2 - 45,
              y = compact ? 100 + i * 150 : 150;
            return (
              <g key={kind}>
                <text
                  x={compact ? 190 : (w * (i + 0.5)) / 2}
                  y={compact ? y - 55 : 66}
                  textAnchor="middle"
                >
                  {kind === 'root' ? s('根', 'Root') : s('茎', 'Shoot')}
                </text>
                {organ(x, y, kind, true, true, p)}
                <path
                  d={`M${compact ? w - 38 : x + 139} ${y - 24}v48m-4-6 4 6 4-6`}
                  stroke="#a59a7a"
                  strokeWidth="2"
                  fill="none"
                />
                <text
                  x={compact ? 195 : (w * (i + 0.5)) / 2}
                  y={compact ? y + 55 : 256}
                  textAnchor="middle"
                >
                  {kind === 'root'
                    ? s('下侧伸长较少', 'Less growth below')
                    : s('下侧伸长较多', 'More growth below')}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {mode === 5 && (
        <svg viewBox={`0 0 ${w} ${compact ? 350 : 305}`} role="img" aria-label={labels[5]}>
          <text x={w / 2} y="23" textAnchor="middle">
            {s('横放 · 重力向下', 'Horizontal · gravity downward')}
          </text>
          {[0, 1, 2].map((i) => {
            const x = compact ? 30 : (w * (i + 0.5)) / 3 - 43,
              y = compact ? 65 + i * 93 : 158,
              cap = i !== 1,
              healthy = !(hurt && i === 2),
              f = tropicGrowth(
                film.watch ? (film.chapter === 6 ? p * 0.12 : 0.12 + p * 0.88) : p,
                'root',
                cap,
                healthy,
              ),
              name =
                i === 0
                  ? s('完整根', 'Intact')
                  : i === 1
                    ? s('去根冠', 'Cap removed')
                    : hurt
                      ? s('伤及生长区', 'Growth zone injured')
                      : s('假处理', 'Sham');
            return (
              <g key={i}>
                {organ(
                  x,
                  y,
                  'root',
                  cap,
                  healthy,
                  film.watch ? (film.chapter === 6 ? p * 0.12 : 0.12 + p * 0.88) : p,
                )}
                <text
                  x={compact ? w * 0.7 : (w * (i + 0.5)) / 3}
                  y={compact ? y - 2 : 73}
                  textAnchor="middle"
                >
                  {name}
                </text>
                <text
                  x={compact ? w * 0.7 : (w * (i + 0.5)) / 3}
                  y={compact ? y + 25 : 251}
                  textAnchor="middle"
                >
                  {s('伸长', 'Elongation')} {(f.relativeElongation * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
          <text x={w / 2} y={compact ? 345 : 292} textAnchor="middle">
            {s('比较弯曲，也比较能否继续生长', 'Check bending and growth')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-environment-controls">
          <div className="bio-environment-buttons">
            {labels.map((x, i) => (
              <button key={i} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {x}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-time`}>
            {s('过程时刻', 'Sequence time')}
            <input
              id={`${id}-time`}
              type="range"
              min="0"
              max="1"
              step=".01"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          {mode === 0 && (
            <div className="bio-environment-buttons">
              {(['red', 'far-red', 'dark'] as const).map((key) => (
                <button key={key} aria-pressed={light === key} onClick={() => setLight(key)}>
                  {key === 'red'
                    ? s('红光', 'Red')
                    : key === 'far-red'
                      ? s('远红光', 'Far-red')
                      : s('黑暗', 'Dark')}
                </button>
              ))}
            </div>
          )}
          {mode === 1 && (
            <label htmlFor={`${id}-cold`}>
              {s('相对低温经历', 'Relative cold exposure')}
              <input
                id={`${id}-cold`}
                type="range"
                min="0"
                max="1"
                step=".02"
                value={cold}
                onChange={(e) => setCold(+e.target.value)}
              />
            </label>
          )}
          {(mode === 3 || mode === 4) && (
            <button aria-pressed={gravity} onClick={() => setGravity(!gravity)}>
              {s('有方向的重力信号', 'Directional gravity signal')}
            </button>
          )}
          {mode === 5 && (
            <button aria-pressed={injured} onClick={() => setInjured(!injured)}>
              {s('用受伤组替换假处理', 'Replace sham with growth injury')}
            </button>
          )}
        </div>
      )}
      <details>
        <summary>{s('证据与简化边界', 'Evidence and model')}</summary>
        <p>
          {s(
            '光敏色素为细胞内光受体，画面以选定通路解释光信号与基因表达，不把光只当作能量输入。春化只选冬性类型；年轮还受水分等条件影响。淀粉体沉降为重力感知的重要机制，不等同于已解释全部感知过程。根和茎在同一生长素差异下具有不同伸长响应；曲线由两侧实际长度推导。去根冠模型保留少量残余弯曲，并要求继续伸长，不能把严重损伤后的停长当作感受部位证据。',
            'Phytochrome is an intracellular photoreceptor; the selected pathway links a light signal to gene expression. Vernalization refers to a selected winter type, while annual rings also depend on water and other conditions. Statolith sedimentation is an important mechanism, not a complete account of gravity perception. Root and shoot elongation respond differently to the same auxin asymmetry, and edge lengths determine curvature. Decapping retains a small illustrative residual response and requires continued growth; injury-induced growth arrest cannot locate the sensor.',
          )}
        </p>
      </details>
    </div>
  );
}
