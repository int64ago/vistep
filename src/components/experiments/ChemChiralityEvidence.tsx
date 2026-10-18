import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  tetra,
  mirror,
  reflected,
  camera,
  matches,
  crystal,
  crystalAt,
  optical,
  selectiveConsumption,
  type V,
} from '../../models/chem-chirality-evidence';
import '../../styles/chem-chirality-evidence.css';
const modes = ['mirror', 'overlay', 'same', 'sort', 'solutions', 'mix', 'selective'] as const;
type Mode = (typeof modes)[number];
const titles = [
  '互为镜像',
  '旋转与重合',
  '相同基团的反例',
  '按晶面分选',
  '溶解后仍旋光',
  '等量混合抵消',
  '选择性利用',
];
const colors = ['#bc9658', '#6d9a9d', '#9b87a5', '#b67765'];
function Molecule({
  mirrored = false,
  angle = 0,
  overlay = false,
  identical = false,
}: {
  mirrored?: boolean;
  angle?: number;
  overlay?: boolean;
  identical?: boolean;
}) {
  const points = mirrored ? reflected(angle) : tetra,
    labels = identical ? ['A', 'B', 'C', 'C'] : ['A', 'B', 'C', 'D'];
  const project = (p: V) => {
    const v = camera(p, overlay ? 0.4 : 0, overlay ? 0.38 : 0.4);
    return {
      x: (overlay ? 160 : 80) + v.x * (overlay ? 62 : 35),
      y: (overlay ? 135 : 95) - v.y * (overlay ? 62 : 35),
      z: v.z,
    };
  };
  const origin = project({ x: 0, y: 0, z: 0 }),
    nodes = points.map((p, i) => ({ ...project(p), i })),
    refs = tetra.map(project);

  const segment = (p: { x: number; y: number }, radius: number) => {
    const dx = p.x - origin.x,
      dy = p.y - origin.y,
      l = Math.hypot(dx, dy) || 1,
      start = overlay ? 14 : 11;
    return {
      x1: origin.x + (dx * start) / l,
      y1: origin.y + (dy * start) / l,
      x2: p.x - (dx * radius) / l,
      y2: p.y - (dy * radius) / l,
    };
  };
  type Item = { z: number; i: number; bond: boolean };
  const draw: Item[] = nodes.flatMap((a) => [
    { z: a.z / 2, i: a.i, bond: true },
    { z: a.z, i: a.i, bond: false },
  ]);
  draw.push({ z: 0, i: -1, bond: false });
  draw.sort((a, b) => a.z - b.z);
  return (
    <svg
      className={`cce-molecule ${overlay ? 'cce-overlay' : ''}`}
      viewBox={overlay ? '0 0 320 280' : '0 0 160 190'}
      role="img"
      aria-label={t('同一四面体中心上的基团身份保留，镜像只通过三维旋转尝试重合')}
    >
      {overlay &&
        refs.map((p, i) => (
          <g key={i}>
            <line
              {...segment(p, 22)}
              stroke={colors[identical && i === 3 ? 2 : i]}
              strokeWidth="2"
              strokeDasharray="3 4"
              opacity=".4"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="22"
              fill="none"
              stroke={colors[identical && i === 3 ? 2 : i]}
              strokeWidth="2"
            />
            <text x={p.x} y={p.y - 29}>
              {labels[i]}
            </text>
          </g>
        ))}
      {draw.map((a, k) =>
        a.i === -1 ? (
          <circle key={k} cx={origin.x} cy={origin.y} r={overlay ? 14 : 11} fill="#677b72" />
        ) : a.bond ? (
          <line
            key={k}
            {...segment(nodes[a.i], overlay ? 15 : 16)}
            stroke="#a6ad96"
            strokeWidth={overlay ? 7 : 5}
          />
        ) : (
          <g key={k}>
            <circle
              cx={nodes[a.i].x}
              cy={nodes[a.i].y}
              r={overlay ? 15 : 16}
              fill={colors[identical && a.i === 3 ? 2 : a.i]}
              stroke="#f4f0dc"
              strokeWidth="1.5"
            />
            <text className="cce-letter" x={nodes[a.i].x} y={nodes[a.i].y + 6}>
              {labels[a.i]}
            </text>
          </g>
        ),
      )}
    </svg>
  );
}
export function Crystal({
  hand,
  x,
  y,
  scale = 12,
  opacity = 1,
}: {
  hand: 1 | -1;
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}) {
  const fs = crystal(hand)
    .map((f) => {
      const ps = f.points.map((p) => camera(p, 0.55 * hand, 0.2));
      return { ...f, ps, z: ps.reduce((s, p) => s + p.z, 0) / ps.length };
    })
    .sort((a, b) => a.z - b.z);
  return (
    <g opacity={opacity}>
      {fs.map((f, i) => (
        <polygon
          key={i}
          points={f.ps.map((p) => `${x + p.x * scale},${y - p.y * scale}`).join(' ')}
          fill={f.cap ? '#a17d4f' : f.z > 0 ? '#c9d9cf' : '#aec3bd'}
          fillOpacity={f.cap ? 1 : 0.94}
          stroke="#7e9b91"
          strokeWidth=".8"
        />
      ))}
    </g>
  );
}
function SortCrystals({ p }: { p: number }) {
  const phase = ease(ramp(p, 0.24, 0.35)),
    q = ramp(p, 0.35, 1);
  const a = Array.from({ length: 8 }, (_, i) => crystalAt(i, q)),
    active = a.find((v) => v.q > 0 && v.q < 1);
  return (
    <>
      <svg
        className="cce-sort"
        viewBox="0 0 320 295"
        role="img"
        aria-label={t('镊子逐个移动晶体，镜像晶面分入两个培养皿')}
      >
        <g opacity={1 - phase}>
          <Crystal hand={1} x={80} y={126} scale={44} />
          <Crystal hand={-1} x={240} y={126} scale={44} />
          <text x="80" y="244">
            {t('晶形甲')}
          </text>
          <text x="240" y="244">
            {t('晶形乙')}
          </text>
        </g>
        <g opacity={phase}>
          <ellipse cx="160" cy="100" rx="152" ry="75" fill="#d1dfd0" stroke="#9fb7a7" />
          <ellipse cx="82" cy="232" rx="69" ry="52" fill="#e4e8d3" stroke="#a2b6a3" />
          <ellipse cx="238" cy="232" rx="69" ry="52" fill="#e4e8d3" stroke="#a2b6a3" />
          {a
            .filter((c) => c !== active)
            .map((c) => (
              <Crystal key={c.id} hand={c.hand} x={c.point.x} y={c.point.y} scale={10} />
            ))}
          {active && (
            <>
              <Crystal hand={active.hand} x={active.point.x} y={active.point.y} scale={10} />
              <path
                d={`M${active.point.x - 4} ${active.point.y - 38} L${active.point.x - 9} ${active.point.y - 4} M${active.point.x + 4} ${active.point.y - 38} L${active.point.x + 9} ${active.point.y - 4}`}
                fill="none"
                stroke="#697e79"
                strokeWidth="2.2"
              />
            </>
          )}
        </g>
      </svg>
      <div className="cce-crystal-counts" style={{ opacity: phase }}>
        <span>
          {t('晶形甲')} {a.filter((v) => v.sorted && v.hand === 1).length}
        </span>
        <span>
          {t('晶形乙')} {a.filter((v) => v.sorted && v.hand === -1).length}
        </span>
      </div>
      <p className="cce-sub">{t('晶形放大示意：按晶面，保持各颗身份')}</p>
    </>
  );
}
function Dial({
  angle,
  beta = 45,
  intensity,
  label,
}: {
  angle: number;
  beta?: number;
  intensity: number;
  label: string;
}) {
  const vec = (a: number, r: number) => ({
      x: Math.sin((a * Math.PI) / 180) * r,
      y: -Math.cos((a * Math.PI) / 180) * r,
    }),
    a = vec(angle, 43),
    b = vec(beta, 49);
  return (
    <div className="cce-dial">
      <svg
        viewBox="0 0 160 140"
        role="img"
        aria-label={t('迎着入射光观察，偏振面角度与检偏器方向决定透射亮度')}
      >
        <circle cx="65" cy="66" r="51" fill="#edf0d9" stroke="#9fb6a4" />
        <path
          d="M65 10 V122"
          fill="none"
          stroke="#b8c7b0"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
        <line
          x1={65 - b.x}
          y1={66 - b.y}
          x2={65 + b.x}
          y2={66 + b.y}
          stroke="#a1a993"
          strokeWidth="7"
          strokeLinecap="round"
          opacity=".55"
        />
        <line
          x1={65 - a.x}
          y1={66 - a.y}
          x2={65 + a.x}
          y2={66 + a.y}
          stroke="#a67f4d"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle
          cx="140"
          cy="66"
          r="12"
          fill={`rgb(${Math.round(78 + intensity * 151)} ${Math.round(95 + intensity * 119)} ${Math.round(78 + intensity * 76)})`}
          stroke="#8c9f8a"
        />
        <text x="65" y="137">
          {angle > 0 ? '+' : ''}
          {angle.toFixed(0)}°
        </text>
      </svg>
      <span>{label}</span>
    </div>
  );
}
function Solutions({ p }: { p: number }) {
  const q = ease(ramp(p, 0, 0.7)),
    plus = optical(q, 0),
    minus = optical(0, q);
  return (
    <>
      <div className="cce-solutions">
        <svg
          viewBox="0 0 320 160"
          role="img"
          aria-label={t('分别溶解分出的两类晶体，比较澄清溶液的旋光')}
        >
          {[82, 238].map((x, i) => (
            <g key={i}>
              <path
                d={`M${x - 44} 25 V127 Q${x - 44} 136 ${x - 34} 136 H${x + 34} Q${x + 44} 136 ${x + 44} 127 V25`}
                fill="none"
                stroke="#9cb4a7"
                strokeWidth="2"
              />
              <rect
                x={x - 40}
                y="65"
                width="80"
                height="67"
                rx="4"
                fill="#b9d4c5"
                fillOpacity=".45"
              />
              <path d={`M${x - 40} 65 H${x + 40}`} fill="none" stroke="#8faf9f" />
              <Crystal
                hand={i === 0 ? 1 : -1}
                x={x}
                y={112 - 5 * q}
                scale={13 * (1 - q)}
                opacity={1 - q}
              />
              <text x={x} y="23">
                {i === 0 ? t('甲溶液') : t('乙溶液')}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="cce-dials">
        <Dial angle={plus.angle} intensity={plus.transmission} label={t('顺时针')} />
        <Dial angle={minus.angle} intensity={minus.transmission} label={t('逆时针')} />
      </div>
      <p className="cce-sub">{t('迎着光看；相同条件，角度为示意')}</p>
    </>
  );
}
function OpticalBench({
  plus,
  minus,
  beta,
  selective = false,
  p = 0,
}: {
  plus: number;
  minus: number;
  beta: number;
  selective?: boolean;
  p?: number;
}) {
  const a = optical(plus, minus, beta);
  return (
    <div className="cce-optics">
      <svg
        className="cce-bench"
        viewBox="0 0 320 160"
        role="img"
        aria-label={t('起偏器、样品管、检偏器与检测光强按同一角度模型连接')}
      >
        <g opacity={selective ? 0 : 1}>
          <path d="M20 86 H300" fill="none" stroke="#c8b26c" strokeWidth="5" opacity=".55" />
          <rect x="23" y="61" width="24" height="50" rx="9" fill="#b2baa0" />
          <ellipse
            cx="62"
            cy="86"
            rx="9"
            ry="42"
            fill="#a3b6a4"
            fillOpacity=".7"
            stroke="#759387"
          />
          <path d="M62 54 V118" fill="none" stroke="#f3ecd0" strokeWidth="2.5" />
          <rect
            x="102"
            y="60"
            width="112"
            height="52"
            rx="10"
            fill="#bdd5c8"
            fillOpacity=".75"
            stroke="#8eae9e"
          />
          <ellipse cx="104" cy="86" rx="7" ry="25" fill="#cadcd1" stroke="#8eae9e" />
          <ellipse cx="212" cy="86" rx="7" ry="25" fill="#cadcd1" stroke="#8eae9e" />
          <path d="M70 86 H96" fill="none" stroke="#b59152" strokeWidth="3" />
          <ellipse
            cx="249"
            cy="86"
            rx="9"
            ry="42"
            fill="#b2bba2"
            fillOpacity=".75"
            stroke="#839a87"
          />
          <path
            d={`M${249 - 6 * Math.sin((beta * Math.PI) / 180)} ${86 - 32 * Math.cos((beta * Math.PI) / 180)} L${249 + 6 * Math.sin((beta * Math.PI) / 180)} ${86 + 32 * Math.cos((beta * Math.PI) / 180)}`}
            fill="none"
            stroke="#f3ecd0"
            strokeWidth="2.5"
          />
          <path
            d="M259 86 H291"
            fill="none"
            stroke="#b59152"
            strokeWidth="4"
            opacity={a.transmission}
          />
          <rect x="290" y="65" width="16" height="43" rx="5" fill="#6f8576" />
          <rect
            x="291"
            y="69"
            width="8"
            height="35"
            rx="2"
            fill="#e4ce8c"
            opacity={a.transmission}
          />
          <text x="62" y="147">
            P
          </text>
          <text x="160" y="147">
            {t('样品')}
          </text>
          <text x="249" y="147">
            A
          </text>
        </g>
        {selective && (
          <g>
            <path
              d="M111 26 V124 Q111 135 122 135 H198 Q209 135 209 124 V26"
              fill="none"
              stroke="#93ad9d"
              strokeWidth="2"
            />
            <rect x="115" y="59" width="90" height="72" rx="4" fill="#bad2c1" fillOpacity=".6" />
            <path d="M115 59 H205" fill="none" stroke="#91ad99" />
            <text x="160" y="158">
              {t('培养液取样测定')}
            </text>
          </g>
        )}
        {selective && (
          <g stroke="#6e8b6c" strokeWidth={1.2 + p * 2} fill="none" opacity={Math.min(1, p * 4)}>
            <path d={`M145 108 Q${143 + 18 * p} ${90 - 20 * p} ${155 + 12 * p} ${88 - 20 * p}`} />
            <path
              d={`M151 99 Q${130 - 6 * p} ${88 - 16 * p} ${136 - 11 * p} ${94 - 20 * p} M153 96 Q${171 + 6 * p} ${97 - 17 * p} ${178 + 9 * p} ${93 - 20 * p}`}
            />
          </g>
        )}
      </svg>
      <div className="cce-optics-readout">
        <Dial angle={a.angle} beta={beta} intensity={a.transmission} label={t('迎着光看')} />
        <div className="cce-ledger">
          <span>{selective ? t('相对浓度，初值各 100') : t('比例，总量为 100')}</span>
          <div>
            <b>+</b>
            <i>
              <em style={{ width: `${plus * 100}%` }} />
            </i>
            <span>{(plus * 100).toFixed(0)}</span>
          </div>
          <div>
            <b>−</b>
            <i>
              <em style={{ width: `${minus * 100}%` }} />
            </i>
            <span>{(minus * 100).toFixed(0)}</span>
          </div>
          <strong>
            {t('透射光')} {(a.transmission * 100).toFixed(0)}%
          </strong>
        </div>
      </div>
      <p className="cce-sub">
        {selective
          ? t('剩余浓度的差决定旋光；菌丝为历史过程示意')
          : t('等量对映体仍然存在，旋光相互抵消')}
      </p>
    </div>
  );
}
export default function ChemChiralityEvidence({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(variant === 'pasteur' ? 'sort' : 'mirror'),
    [progress, setProgress] = useState(0.7),
    [angle, setAngle] = useState(Math.PI),
    [fraction, setFraction] = useState(0.5),
    [analyzer, setAnalyzer] = useState(45),
    [selectivity, setSelectivity] = useState(1);
  const m = f.watch ? modes[Math.min(6, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.88)) : progress,
    turn = f.watch ? Math.PI * p : angle;
  const ratio = f.watch ? 1 - 0.5 * p : fraction,
    cons = selectiveConsumption(p, f.watch ? 1 : selectivity),
    ok = matches(reflected(turn), m === 'same').filter(Boolean).length;
  return (
    <div className={`cce ${f.watch ? 'is-watch' : ''}`}>
      <div className={`cce-stage cce-mode-${m}`}>
        {m === 'mirror' ? (
          <>
            <div className="cce-mirror-pair">
              <div>
                <Molecule />
                <span>{t('原像')}</span>
              </div>
              <div>
                <Molecule mirrored />
                <span>{t('镜像')}</span>
              </div>
              <i />
            </div>
            <p className="cce-sub">{t('同样四种基团，空间排列互为镜像')}</p>
          </>
        ) : m === 'overlay' || m === 'same' ? (
          <>
            <Molecule mirrored angle={turn} overlay identical={m === 'same'} />
            <div className="cce-match">
              <strong>
                {ok}/4 {t('匹配')}
              </strong>
              <span>
                {m === 'same' ? t('两个 C 代表相同基团') : t('空心圈固定，实心球随镜像转动')}
              </span>
            </div>
          </>
        ) : m === 'sort' ? (
          <SortCrystals p={p} />
        ) : m === 'solutions' ? (
          <Solutions p={p} />
        ) : m === 'mix' ? (
          <OpticalBench plus={ratio} minus={1 - ratio} beta={f.watch ? 45 : analyzer} />
        ) : (
          <OpticalBench
            plus={cons.plus}
            minus={cons.minus}
            beta={f.watch ? 45 : analyzer}
            selective
            p={p}
          />
        )}
      </div>
      {!f.watch && (
        <div className="cce-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(titles[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {(m === 'overlay' || m === 'same') && (
            <>
              <Range
                label={t('绕固定空间轴旋转（°）')}
                value={(angle * 180) / Math.PI}
                min={0}
                max={360}
                step={1}
                onChange={(v) => setAngle((v * Math.PI) / 180)}
              />
              <button onClick={() => setAngle(Math.PI)}>{t('对齐 A 与 B')}</button>
            </>
          )}
          {(m === 'sort' || m === 'solutions' || m === 'selective') && (
            <Range
              label={t('演示进程')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {m === 'mix' && (
            <Range
              label={t('正旋光体的比例')}
              value={fraction}
              min={0}
              max={1}
              step={0.01}
              onChange={setFraction}
            />
          )}
          {(m === 'mix' || m === 'selective') && (
            <Range
              label={t('检偏器角度（°）')}
              value={analyzer}
              min={-90}
              max={90}
              step={1}
              onChange={setAnalyzer}
            />
          )}
          {m === 'selective' && (
            <Range
              label={t('利用的选择性')}
              value={selectivity}
              min={0}
              max={1}
              step={0.01}
              onChange={setSelectivity}
            />
          )}
          <p>{t('基团、晶形和角度用于解释证据；不据 R/S 直接推断旋光正负。')}</p>
        </div>
      )}
    </div>
  );
}
