import { useEffect, useId, useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ironSteam,
  ironSteamAtoms,
  ironSteamMassFrame,
  ironSteamPrediction,
  ironSteamFilm,
  steamPoint,
} from '../../models/chem-iron-steam';
import '../../styles/chem-iron-steam.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const colour = { Fe: '#697572', O: '#b67e54', H: '#b9bfa0' };
export function SteamApparatus({
  width,
  progress = 1,
  hot = true,
  water = 0.5,
}: {
  width: number;
  progress?: number;
  hot?: boolean;
  water?: number;
}) {
  const m = ironSteam(1, water, 1, hot),
    w = width,
    narrow = w < 500,
    end = w * 0.67,
    cotton = w * 0.16,
    iron = w * 0.47,
    cup = w * 0.85,
    path: [number, number][] = [
      [cotton + 12, 82],
      [iron, 82],
      [end, 82],
      [cup, 82],
      [cup, 154],
    ],
    point = steamPoint(
      [
        [cotton + 12, 82],
        [iron, 82],
      ],
      Math.min(1, progress / 0.6),
    ),
    hydrogenPoint = steamPoint(path.slice(1), Math.max(0, (progress - 0.6) / 0.4)),
    uid = useId().replaceAll(':', '');
  return (
    <>
      <div className="ist-kicker">
        {hot && water > 0
          ? say('教材：黑色固体与可燃气体', 'Textbook: black solid, combustible gas')
          : say('条件对照', 'Condition comparison')}
      </div>
      <svg
        viewBox={`0 0 ${w} 207`}
        style={{ height: 207 }}
        role="img"
        aria-label={say(
          '教材装置：水蒸气经过热铁，导出的气体通向肥皂液；仅跟踪选定反应物和产物',
          'Textbook apparatus: steam reaches hot iron; the outlet leads to soap solution. Markers track selected material, not gas purity.',
        )}
      >
        <defs>
          <linearGradient id={uid + 'glass'}>
            <stop stopColor="#b4c3b8" stopOpacity=".3" />
            <stop offset=".35" stopColor="#fffced" stopOpacity=".6" />
            <stop offset="1" stopColor="#829a88" stopOpacity=".2" />
          </linearGradient>
        </defs>
        <path
          d={`M${end} 61H${w * 0.08}q-18 0-18 21t18 21H${end}`}
          fill={`url(#${uid}glass)`}
          stroke="#8fa393"
          strokeWidth="2"
        />
        {Array.from({ length: 9 }, (_, i) => (
          <ellipse
            key={i}
            cx={cotton - 8 + (i % 3) * 8}
            cy={74 + Math.floor(i / 3) * 9}
            rx="7"
            ry="5"
            fill="#e4e7d7"
            stroke="#b6c2aa"
          />
        ))}
        <ellipse
          cx={iron}
          cy="101"
          rx={narrow ? 29 : 50}
          ry="5"
          fill={hot ? '#c98d5c' : '#a5b29c'}
          opacity=".3"
        />
        {Array.from({ length: 20 }, (_, i) => (
          <ellipse
            key={i}
            cx={iron - (narrow ? 23 : 42) + (i % 7) * (narrow ? 7 : 13)}
            cy={91 + Math.floor(i / 7) * 4}
            rx="4"
            ry="3"
            fill={i / 20 < m.convertedFraction ? '#414e49' : '#8c9992'}
          />
        ))}
        <path d={`M${end - 4} 60v45h13V60Z`} fill="#c1c5ac" stroke="#899b86" />
        <path
          d={`M${end - 4} 82H${cup}V154`}
          fill="none"
          stroke="#859b8e"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d={`M${end - 4} 82H${cup}V154`}
          fill="none"
          stroke="#e2e9dc"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {[cotton, iron].map((x, i) => (
          <g key={i} opacity={i === 0 ? (water > 0 ? 1 : 0.25) : hot ? 1 : 0.25}>
            <path d={`M${x - 15} 145q15-7 30 0l-5 17h-20Z`} fill="#b5c4b6" />
            <path d={`M${x} 145v-12`} stroke="#8e9a89" strokeWidth="3" />
            <path d={`M${x} 134q-12-16 0-27q12 15 0 27`} fill="#d6a664" opacity=".75" />
          </g>
        ))}
        <path
          d={`M${cup - 28} 119v60q0 8 8 8h40q8 0 8-8v-60`}
          fill={`url(#${uid}glass)`}
          stroke="#8fa393"
          strokeWidth="2"
        />
        <path d={`M${cup - 25} 143h50v34q0 7-7 7h-36q-7 0-7-7Z`} fill="#abc5b9" opacity=".55" />
        {m.hydrogen > 0 &&
          [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={cup - 16 + i * 14}
              cy={138 - (i % 2) * 8}
              r={8}
              stroke="#97b0a0"
              fill="#edf0dd"
              fillOpacity=".6"
            />
          ))}
        {water > 0 && (
          <g data-tracked-path="selected-water-oxygen">
            <circle cx={point.x} cy={point.y} r="7" fill="#b67e54" />
            <circle cx={point.x} cy={point.y} r="11" fill="none" stroke="#b67e54" opacity=".35" />
          </g>
        )}
        {m.hydrogen > 0 && progress > 0.6 && (
          <circle
            data-tracked-path="selected-product-hydrogen"
            cx={hydrogenPoint.x}
            cy={hydrogenPoint.y}
            r="5"
            fill="#d3d9b7"
            stroke="#9aa88d"
          />
        )}
        <text x={cotton} y="40" textAnchor="middle">
          H₂O
        </text>
        <text x={iron} y="40" textAnchor="middle">
          {m.convertedFraction > 0 ? 'Fe → Fe₃O₄' : 'Fe'}
        </text>
        <text x={cup} y="205" textAnchor="middle">
          {say('气体', 'Gas')}
        </text>
      </svg>
    </>
  );
}
export function SteamAtoms({
  width,
  progress,
  pairing,
}: {
  width: number;
  progress: number;
  pairing?: number;
}) {
  const a = ironSteamAtoms(progress, width, pairing),
    uid = useId().replaceAll(':', '');
  return (
    <>
      <div className="ist-kicker">
        {say('净原子分配 · 非反应机理', 'Net atom account · not a mechanism')}
      </div>
      <svg
        viewBox={`0 0 ${a.width} 208`}
        style={{ height: 208 }}
        role="img"
        aria-label={say(
          '同一批三个铁、四个氧、八个氢持续保留；氧进入固体，氢配对成气体',
          'The same three iron, four oxygen and eight hydrogen atoms persist. Oxygen joins the solid; hydrogens pair into gas.',
        )}
      >
        <defs>
          {(['Fe', 'O', 'H'] as const).map((e) => (
            <radialGradient key={e} id={uid + e} cx="30%" cy="25%">
              <stop stopColor="#f5f1dc" />
              <stop offset=".5" stopColor={colour[e]} stopOpacity=".65" />
              <stop offset="1" stopColor={colour[e]} />
            </radialGradient>
          ))}
        </defs>
        <path
          d={`M18 170Q${a.solidRight / 2} 184 ${a.solidRight} 170`}
          fill="none"
          stroke="#8d9e91"
          strokeWidth="3"
        />
        {a.complete && (
          <rect
            x="15"
            y="23"
            width={a.solidRight - 9}
            height="149"
            rx="24"
            fill="#889b8820"
            stroke="#899b8680"
            strokeDasharray="3 6"
          />
        )}
        {a.bonds.map((b) => {
          const x = a.atoms.find((x) => x.id === b.from)!,
            y = a.atoms.find((x) => x.id === b.to)!;
          return (
            <path
              key={b.from + b.to}
              d={`M${x.x} ${x.y}L${y.x} ${y.y}`}
              stroke="#a5b298"
              strokeWidth="5"
              opacity={b.opacity}
            />
          );
        })}
        {a.atoms.map((x) => (
          <g
            key={x.id}
            data-steam-atom={x.id}
            data-element={x.element}
            transform={`translate(${x.x} ${x.y})`}
          >
            {x.highlighted && (
              <circle r="17" fill="none" stroke="#bf8c54" strokeWidth="2" opacity=".7" />
            )}
            <circle
              r={x.r}
              fill={`url(#${uid + x.element})`}
              stroke={colour[x.element]}
              strokeWidth="1.2"
            />
            <text y="5.3" textAnchor="middle" className={x.element === 'Fe' ? 'ist-fe-text' : ''}>
              {x.element}
            </text>
          </g>
        ))}
        <text x={a.solidRight / 2 + 8} y="202" textAnchor="middle">
          {a.complete ? 'Fe₃O₄' : 'Fe'}
        </text>
        <text x={width * 0.77} y="202" textAnchor="middle">
          {a.complete ? '4 H₂' : a.progress === 0 ? '4 H₂O' : '8 H'}
        </text>
      </svg>
      <div className="ist-atom-ledger">
        Fe 3 <span>O 4</span> H 8
      </div>
    </>
  );
}
export function SteamMass({
  width,
  progress,
  water = 0.5,
  hot = true,
  focus = '',
}: {
  width: number;
  progress: number;
  water?: number;
  hot?: boolean;
  focus?: string;
}) {
  const s = ironSteamMassFrame(progress, water, hot),
    w = width,
    source = { x: w * 0.22, y: 31 },
    solid = { x: w * 0.43 + (w * 0.23 * s.model.oxygenInSolidGrams) / 2, y: 68 },
    gas = { x: w * 0.82, y: 31 },
    at = (end: { x: number; y: number }) => ({
      x: source.x + (end.x - source.x) * s.move,
      y: source.y + (end.y - source.y) * s.move,
    });
  return (
    <div data-mass-phase={s.moving ? 'transfer' : s.arrived ? 'arrived' : 'initial'}>
      <div className="ist-kicker">
        {say('1 g 铁 · 理想计量算例', '1 g iron · ideal calculation')}
      </div>
      <svg
        viewBox={`0 0 ${w} 139`}
        style={{ height: 139 }}
        role="img"
        aria-label={say(
          '固体、水、氢气及转移中的物料始终一起守恒',
          'Solid, water, hydrogen and material in transfer remain in the complete mass account',
        )}
      >
        <path d={`M${source.x - 30} 10v45q30 13 60 0V10`} fill="#c5d8cc55" stroke="#94ae9c" />
        <path d={`M${source.x - 27} 55h54v${-36 * s.liquid}h-54Z`} fill="#aac7bb" opacity=".75" />
        <path
          d={`M${w * 0.18} 115q${w * 0.21} 15 ${w * 0.42} 0`}
          fill="none"
          stroke="#8c9e90"
          strokeWidth="3"
        />
        <rect
          x={w * 0.2}
          y="85"
          width={w * 0.23}
          height="27"
          rx="8"
          fill={s.arrived ? '#45554a' : '#697572'}
        />
        {s.arrived && s.model.oxygenInSolidGrams > 0 && (
          <rect
            x={w * 0.43}
            y="85"
            width={w * 0.23 * s.model.oxygenInSolidGrams}
            height="27"
            rx="5"
            fill="#b67e54"
          />
        )}
        <text x={w * 0.31} y="104" textAnchor="middle" className="ist-fe-text">
          Fe
        </text>
        <circle
          cx={gas.x}
          cy={gas.y}
          r="25"
          fill="#e2e5cf55"
          stroke="#b4bda5"
          strokeDasharray="3 5"
        />
        {!s.moving && (
          <text x={source.x} y="32" textAnchor="middle">
            H₂O
          </text>
        )}
        {(s.moving || s.arrived) &&
          s.model.reactedWaterGrams > 0 &&
          (['O', 'H₂'] as const).map((e) => {
            const c = at(e === 'O' ? solid : gas);
            return (
              <g key={e} data-mass-parcel={e} transform={`translate(${c.x} ${c.y})`}>
                <circle
                  r="17"
                  fill={e === 'O' ? '#d3ac7e' : '#d6dbc0'}
                  stroke={e === 'O' ? '#b67e54' : '#a3af91'}
                />
                <text y="5" textAnchor="middle">
                  {e}
                </text>
              </g>
            );
          })}
        <text x={w * 0.43} y="136" textAnchor="middle">
          {s.arrived
            ? `+ ${s.model.oxygenInSolidGrams.toFixed(3)} g O`
            : say('固体范围', 'Solid only')}
        </text>
      </svg>
      <div className="ist-mass-ledger">
        {[
          [say('固体', 'Solid'), s.solid, 'solid'],
          [say('水', 'Water'), s.liquid, 'water'],
          ['H₂', s.gas, 'gas'],
          [say('转移中', 'In transfer'), s.transfer, 'transfer'],
        ].map(([name, value, key]) => (
          <span
            key={name}
            data-mass-pool={name}
            data-highlight={focus === key || focus === 'total'}
          >
            <span>{name}</span>
            <b>{Number(value).toFixed(3)} g</b>
          </span>
        ))}
      </div>
      <div className="ist-total" data-highlight={focus === 'total'}>
        {say('总计', 'Total')} {s.total.toFixed(3)} g
      </div>
    </div>
  );
}
export function SteamEvidence({ width, phase = 'combined' }: { width: number; phase?: string }) {
  const combined = phase === 'combined',
    burn = phase !== 'bubble';
  return (
    <>
      <div className="ist-kicker">
        {combined
          ? say('颜色不是唯一鉴定', 'Colour is not a unique identification')
          : say('气泡只说明有气体经过', 'A bubble shows gas passage')}
      </div>
      <svg
        viewBox={`0 0 ${width} 186`}
        style={{ height: 186 }}
        role="img"
        aria-label={
          combined
            ? say(
                '氧化亚铁和四氧化三铁都可呈黑色；需结合反应条件与其他证据',
                'Both iron(II) oxide and magnetite may look black; conditions and other evidence are needed',
              )
            : say(
                '独立空气对照也有气泡；教材产物还有可燃性证据',
                'An independent conceptual air comparison also has bubbles; the textbook product has combustibility evidence',
              )
        }
      >
        {[0, 1].map((i) => {
          const x = width * (i === 0 ? 0.27 : 0.73);
          return (
            <g key={i}>
              {combined ? (
                <>
                  <ellipse cx={x} cy="95" rx="35" ry="16" fill="#46554d" />
                  {Array.from({ length: 11 }, (_, j) => (
                    <ellipse
                      key={j}
                      cx={x - 26 + (j % 5) * 12}
                      cy={83 + Math.floor(j / 5) * 8}
                      rx="6"
                      ry="4"
                      fill={i === 0 ? '#555f57' : '#3f4d47'}
                    />
                  ))}
                </>
              ) : (
                <>
                  <path d={`M${x - 32} 55v79q32 10 64 0V55`} fill="#c4d8c450" stroke="#98ab9b" />
                  <path d={`M${x - 29} 102h58v28q-29 9-58 0Z`} fill="#b4cebd" opacity=".55" />
                  {[0, 1, 2].map((j) => (
                    <circle
                      key={j}
                      cx={x - 16 + j * 15}
                      cy={95 - (j % 2) * 12}
                      r="10"
                      fill="#edf0d6"
                      stroke="#99b3a1"
                    />
                  ))}
                </>
              )}
              <text x={x} y="158" textAnchor="middle">
                {combined
                  ? i === 0
                    ? 'FeO'
                    : 'Fe₃O₄'
                  : i === 0
                    ? say('空气对照', 'Air control')
                    : say('教材气体', 'Textbook gas')}
              </text>
              {burn && !combined && i === 1 && (
                <path d={`M${x} 64q-15-22 0-38q15 23 0 38`} fill="#d7af6b" opacity=".8" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="ist-evidence-note">
        {combined
          ? say('结合反应物、产物与检验', 'Combine reactants, products and tests')
          : burn
            ? say('教材另有可燃性检验', 'Textbook: combustible gas')
            : say('概念对照 · 非新增教材实验', 'Conceptual comparison')}
      </div>
    </>
  );
}
export function SteamPrediction({
  width,
  progress = 0,
  reveal = false,
  waterB = 0.6,
  secondProgress = progress,
}: {
  width: number;
  progress?: number;
  reveal?: boolean;
  waterB?: number;
  secondProgress?: number;
}) {
  const s = ironSteamPrediction(progress, 0.3, waterB, reveal, secondProgress);
  return (
    <div data-prediction-revealed={reveal}>
      <div className="ist-kicker">
        {say('相同 1 g 铁 · 比较水量', 'Same 1 g iron · vary the water')}
      </div>
      <svg
        viewBox={`0 0 ${width} 162`}
        style={{ height: 162 }}
        role="img"
        aria-label={
          reveal
            ? say(
                'A水先用完，B按当前模型显示哪种反应物耗尽及剩余物料',
                'The model shows which reactant runs out and the remaining inventories for A and B',
              )
            : say(
                '两份相同质量铁、不同水量的预测；产氢答案尚未揭晓',
                'Predict with equal iron masses and different water amounts; hydrogen answers are not yet revealed',
              )
        }
      >
        {[s.A, s.B].map((m, i) => {
          const x = width * (i === 0 ? 0.27 : 0.73),
            initialWater = i === 0 ? 0.3 : waterB,
            ironH = m.ironLeftGrams * 30,
            oxideH = m.oxideGrams * 30,
            waterH = m.waterLeftGrams * 35;
          return (
            <g key={i} data-prediction-sample={i === 0 ? 'A' : 'B'}>
              <text x={x} y="19" textAnchor="middle">
                {i === 0 ? 'A' : 'B'} · {initialWater.toFixed(1)} g H₂O
              </text>
              <path d={`M${x - 37} 40v99q37 12 74 0V40`} fill="#c6d7c522" stroke="#9aac98" />
              <rect x={x - 33} y={136 - ironH} width="66" height={ironH} rx="3" fill="#8b9992" />
              <rect
                x={x - 33}
                y={136 - ironH - oxideH}
                width="66"
                height={oxideH}
                rx="3"
                fill="#45554a"
              />
              <rect x={x - 33} y={71 - waterH} width="66" height={waterH} rx="3" fill="#a5c9bb" />
              <text x={x} y="160" textAnchor="middle">
                {(i === 0 ? s.progress : s.secondProgress) > 0.99
                  ? m.limitingReactant === 'water'
                    ? say('余铁', 'Iron left')
                    : m.limitingReactant === 'iron'
                      ? say('余水', 'Water left')
                      : say('同时用完', 'Both used')
                  : say('物料数量', 'Amounts')}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="ist-prediction-values">
        {[s.A, s.B].map((m, i) => (
          <span key={i}>
            <b>{reveal ? (m.hydrogen * 1000).toFixed(2) : '?'}</b>
            <span>{reveal ? 'mmol H₂' : say('产氢量', 'Hydrogen')}</span>
          </span>
        ))}
      </div>
      <div className="ist-evidence-note">
        {reveal
          ? say('谁先用完，谁限制产量。', 'The reactant that runs out limits yield.')
          : say('先预测，再揭晓。', 'Predict before revealing.')}
      </div>
    </div>
  );
}
export default function ChemIronSteam() {
  const film = useShowcase(),
    ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(258),
    [view, setView] = useState('atoms'),
    [progress, setProgress] = useState(1),
    [hot, setHot] = useState(true),
    [water, setWater] = useState(0.5),
    [waterB, setWaterB] = useState(0.6),
    [reveal, setReveal] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([e]) =>
      setWidth(Math.max(250, Math.min(760, Math.floor(e.contentRect.width)))),
    );
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  const d = ironSteamFilm(film.chapter, film.chapterTime, browserLocale()),
    phase = film.watch ? d.phase : view,
    p = film.watch
      ? phase === 'atoms'
        ? d.atoms
        : phase === 'mass'
          ? d.mass
          : phase === 'prediction'
            ? d.prediction
            : d.route
      : progress;
  return (
    <section className="ist" data-watch={film.watch} data-iron-steam-phase={phase}>
      <div className="ist-stage" ref={ref}>
        {phase === 'path' ? (
          <SteamApparatus
            width={width}
            progress={p}
            hot={film.watch || hot}
            water={film.watch ? 0.5 : water}
          />
        ) : phase === 'atoms' ? (
          <SteamAtoms width={width} progress={p} pairing={film.watch ? d.pairing : undefined} />
        ) : phase === 'mass' ? (
          <SteamMass
            width={width}
            progress={p}
            hot={film.watch || hot}
            water={film.watch ? 0.5 : water}
            focus={film.watch ? d.massFocus : ''}
          />
        ) : phase === 'evidence' ? (
          <SteamEvidence width={width} phase={film.watch ? d.evidence : 'combined'} />
        ) : (
          <SteamPrediction
            width={width}
            progress={p}
            reveal={film.watch ? d.reveal : reveal}
            waterB={film.watch ? 0.6 : waterB}
            secondProgress={film.watch ? d.predictionB : p}
          />
        )}
      </div>
      {!film.watch && (
        <div className="ist-controls">
          <Segments
            label={say('观察镜头', 'View')}
            value={view}
            options={['path', 'atoms', 'mass', 'evidence', 'prediction'].map((value, i) => ({
              value,
              label: [
                say('装置', 'Apparatus'),
                say('原子', 'Atoms'),
                say('质量', 'Mass'),
                say('证据', 'Evidence'),
                say('预测', 'Prediction'),
              ][i],
            }))}
            onChange={setView}
          />
          {view !== 'evidence' && (
            <Range
              label={say('教学进程', 'Teaching progress')}
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={setProgress}
            />
          )}
          {(view === 'path' || view === 'mass') && (
            <>
              <Segments
                label={say('铁的条件', 'Iron condition')}
                value={hot ? 'hot' : 'cold'}
                options={[
                  { value: 'hot', label: say('教材红热条件', 'Textbook hot condition') },
                  { value: 'cold', label: say('未加热对照', 'Unheated comparison') },
                ]}
                onChange={(v) => setHot(v === 'hot')}
              />
              <Range
                label={say('可用水的示例质量', 'Illustrative water mass')}
                min={0}
                max={1}
                step={0.01}
                value={water}
                onChange={setWater}
                unit="g"
              />
            </>
          )}
          {view === 'prediction' && (
            <>
              <Range
                label={say('B 中水的质量', 'Water mass in B')}
                min={0}
                max={1}
                step={0.1}
                value={waterB}
                onChange={(v) => {
                  setWaterB(v);
                  setReveal(false);
                }}
                unit="g"
              />
              <button className="ist-reveal" onClick={() => setReveal(!reveal)}>
                {reveal ? say('隐藏答案', 'Hide answer') : say('揭晓答案', 'Reveal answer')}
              </button>
            </>
          )}
          <details>
            <summary>{say('模型说明', 'Model boundaries')}</summary>
            <p>
              {say(
                '原子与质量路径是净分配，不是微观反应机理或速率。选用教材 Fe₃O₄ 终态，不预测温度决定的相组成。热/冷是演示时间尺度对照，气流标记不表示气体纯度。所有数量均为理想算例。',
                'Atom and mass paths show net allocation, not an elementary mechanism or reaction rate. The textbook Fe₃O₄ endpoint is selected, not predicted from temperature. Hot/cold compares the demonstration timescale; gas markers do not imply purity. All quantities are ideal illustrative calculations.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
