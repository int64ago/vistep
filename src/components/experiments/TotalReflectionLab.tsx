import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  interfacePower,
  curvedRod,
  waterJet,
  corkIndex,
  type GuideStep,
} from '../../models/total-reflection-lab';
import '../../styles/modern-labs.css';
import '../../styles/total-reflection-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const path = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
function GuideRays({
  steps,
  project,
  progress = 1,
}: {
  steps: GuideStep[];
  project: (p: { x: number; y: number }) => { x: number; y: number };
  progress?: number;
}) {
  return (
    <>
      {steps.map((step, j) => {
        const a = project(step.from),
          b = project(step.to),
          leak = step.leak ? project(step.leak.to) : null,
          dx = leak ? leak.x - b.x : 0,
          dy = leak ? leak.y - b.y : 0,
          len = Math.hypot(dx, dy) || 1,
          shown = Math.min(1, Math.max(0, progress * (steps.length + 1) - j));
        return (
          <g key={j}>
            <path
              d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
              stroke="#b68c52"
              strokeWidth="2"
              opacity={Math.max(0.07, step.power)}
              fill="none"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - shown}
            />
            {leak && shown > 0.98 && (
              <path
                d={`M${b.x} ${b.y}l${(dx / len) * 26} ${(dy / len) * 26}`}
                stroke="#bb9574"
                strokeWidth="2"
                opacity={Math.max(0.05, step.leak!.power)}
                fill="none"
              />
            )}
          </g>
        );
      })}
    </>
  );
}
export function TotalReflectionArtwork({
  mode = 0,
  phase = 0,
  value = 1,
  angle = 45,
  radius = 1.5,
  speed = 2,
  depth = 20,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  angle?: number;
  radius?: number;
  speed?: number;
  depth?: number;
}) {
  const i = (angle * Math.PI) / 180,
    f = interfacePower(i),
    rod = useMemo(() => curvedRod(radius), [radius]),
    jet = useMemo(() => waterJet(speed), [speed]),
    cork = corkIndex(depth),
    scale = 168 / (rod.R + 0.15),
    rp = (p: { x: number; y: number }) => ({ x: 72 + p.x * scale, y: 241 + p.y * scale }),
    maxY = jet.center(0.35).y,
    js = Math.min(470, 250 / (0.5 + Math.max(0.08, maxY))),
    jp = (p: { x: number; y: number }) => ({
      x: 170 - 0.05 * js + p.x * js,
      y: 30 + 0.5 * js + p.y * js,
    }),
    level = (-speed * speed) / (2 * 9.81);
  return (
    <svg
      className="reflection-art"
      viewBox="0 0 340 310"
      role="img"
      aria-label={tr(
        '半圆玻璃块、曲棒、水流与软木塞的全反射',
        'Total reflection in a semicircle, curved rod, water jet and cork experiment',
      )}
    >
      {mode === 0 && (
        <>
          <path d="M55 126A115 115 0 0 0 285 126Z" fill="#d9e6df" stroke="#91aa9a" />
          <path d="M170 30V259" stroke="#98ab9b" strokeDasharray="4 4" />
          <path
            d={`M${170 - 139 * Math.sin(i)} ${126 + 139 * Math.cos(i)}L170 126`}
            stroke="#ba8c53"
            strokeWidth="2"
          />
          {f.T > 0 && (
            <path
              d={`M170 126L${170 + 135 * Math.sin(f.transmitted!)} ${126 - 135 * Math.cos(f.transmitted!)}`}
              stroke="#ba8c53"
              opacity={f.T}
              strokeWidth="2"
            />
          )}
          <path
            d={`M170 126L${170 + 139 * Math.sin(i)} ${126 + 139 * Math.cos(i)}`}
            stroke="#ba8c53"
            opacity={Math.max(0.05, f.R)}
            strokeWidth="2.5"
          />
          <circle cx={170 - 139 * Math.sin(i)} cy={126 + 139 * Math.cos(i)} r="8" fill="#8d9f8f" />
          <text x="170" y="287" textAnchor="middle" fontSize="20" fill="#617b67">
            R = {(f.R * 100).toFixed(1)}% · T = {(f.T * 100).toFixed(1)}%
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <path
            d={path(rod.polygon.map(rp)) + 'Z'}
            fill="#d5e4db"
            stroke="#91aa9a"
            strokeWidth="1.5"
          />
          <path d={`M24 ${rp(rod.start).y}H${rp(rod.start).x}`} stroke="#bd945b" strokeWidth="2" />
          <rect x="17" y={rp(rod.start).y - 8} width="24" height="16" rx="5" fill="#8d9f8f" />
          <GuideRays steps={rod.steps} project={rp} progress={phase === 0 ? value : 1} />
          <text x="170" y="291" textAnchor="middle" fontSize="20" fill="#617b67">
            {tr('每一处法线，都取自棒的边界', 'Each normal follows the boundary')}
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <path
            d={path(
              [
                { x: -0.12, y: -0.5 },
                { x: -0.12, y: 0.08 },
                { x: 0, y: 0.08 },
                { x: 0, y: 0.012 },
              ].map(jp),
            )}
            fill="none"
            stroke="#8fa99a"
            strokeWidth="2"
          />
          <path
            d={path(
              [
                { x: 0, y: -0.012 },
                { x: 0, y: -0.5 },
              ].map(jp),
            )}
            fill="none"
            stroke="#8fa99a"
            strokeWidth="2"
          />
          <path
            d={
              path(
                [
                  { x: -0.118, y: level },
                  { x: -0.118, y: 0.078 },
                  { x: -0.002, y: 0.078 },
                  { x: -0.002, y: level },
                ].map(jp),
              ) + 'Z'
            }
            fill="#d7e7de"
          />
          <path d={path(jet.polygon.map(jp)) + 'Z'} fill="#d7e7de" stroke="#a4bbae" />
          <path
            d={path(
              [
                { x: -0.24, y: 0 },
                { x: 0, y: 0 },
              ].map(jp),
            )}
            stroke="#b98c54"
            strokeWidth="2"
          />
          <rect
            x={jp({ x: -0.24, y: 0 }).x - 18}
            y={jp({ x: -0.24, y: 0 }).y - 7}
            width="18"
            height="14"
            rx="4"
            fill="#8b9f8f"
          />
          <GuideRays steps={jet.steps} project={jp} />
          <text x="170" y="304" textAnchor="middle" fontSize="18" fill="#617b67">
            {tr('水头、流速和水流曲线相互对应', 'Head, speed and jet shape are linked')}
          </text>
        </>
      )}
      {mode === 3 && (
        <>
          <path
            d="M27 55V265Q27 281 43 281H297Q313 281 313 265V55"
            fill="#e8efe7"
            stroke="#94ac9c"
            strokeWidth="2"
          />
          <path d="M29 128H311V265Q311 279 296 279H44Q29 279 29 265Z" fill="#d7e7de" />
          <rect x="110" y="116" width="120" height="19" rx="5" fill="#baa27b" />
          <path d={`M170 128V${128 + depth * 3}`} stroke="#798c79" strokeWidth="2" />
          <circle cx="170" cy={128 + depth * 3} r="3" fill="#748b77" />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path
                d={`M170 ${128 + depth * 3}L${170 + s * 60} 128`}
                stroke="#b78d56"
                strokeWidth="1.5"
              />
              {cork.ray.T > 0 ? (
                <path
                  d={`M${170 + s * 60} 128l${s * 80 * Math.sin(cork.ray.transmitted!)} ${-80 * Math.cos(cork.ray.transmitted!)}`}
                  stroke="#b78d56"
                  strokeWidth="2"
                  opacity={cork.ray.T}
                />
              ) : (
                <path
                  d={`M${170 + s * 60} 128l${s * 52 * Math.sin(cork.angle)} ${52 * Math.cos(cork.angle)}`}
                  stroke="#b78d56"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}
          <path d="M170 96H230M170 91V101M230 91V101" stroke="#9d8a69" />
          <text x="200" y="83" textAnchor="middle" fontSize="20" fill="#657a65">
            r
          </text>
          <text x="185" y={128 + depth * 1.5} fontSize="20" fill="#657a65">
            h
          </text>
          <text x="170" y="306" textAnchor="middle" fontSize="20" fill="#617b67">
            {cork.hidden
              ? tr('从液面外侧看不到针尖', 'Tip hidden from above')
              : tr('部分光能从塞外射出', 'Light escapes beyond the cork')}
          </text>
        </>
      )}
    </svg>
  );
}
const ids = [
  'e1-semicircle-total-reflection',
  'e1-curved-acrylic-guide',
  'e1-water-jet-light',
  'e1-liquid-index-total-reflection',
];
export default function TotalReflectionLab() {
  const film = useShowcase(),
    [selected, setSelected] = useState(Math.max(0, ids.indexOf(film.variant ?? ''))),
    [angle, setAngle] = useState(42),
    [radius, setRadius] = useState(1.5),
    [speed, setSpeed] = useState(2),
    [depth, setDepth] = useState(20);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : 1,
    p = film.watch ? film.chapterProgress : 1,
    i = film.watch ? (phase === 0 ? 20 + 20 * p : 40 + 20 * p) : angle,
    R = film.watch ? (phase === 0 ? 1.5 : 1.5 - 1.22 * p) : radius,
    v = film.watch ? (phase === 0 ? 2 : 0.8 + 1.7 * p) : speed,
    h = film.watch ? (phase === 0 ? 32 - 8 * p : 24 + (corkIndex().boundaryDepth - 24) * p) : depth,
    cork = corkIndex(h),
    names = [
      ['半圆玻璃块', 'Semicircular block'],
      ['弯曲有机玻璃', 'Curved acrylic rod'],
      ['水流导光', 'Water-jet guide'],
      ['软木塞测量', 'Floating cork'],
    ];
  return (
    <div className="modern-lab reflection-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button type="button" key={j} aria-pressed={mode === j} onClick={() => setSelected(j)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `i = ${i.toFixed(1)}° · C = 41.81°`
          : mode === 1
            ? `R/w = ${(R / 0.3).toFixed(2)} · n = 1.49`
            : mode === 2
              ? `v₀ = ${v.toFixed(2)} m/s · h = ${(((v * v) / (2 * 9.81)) * 100).toFixed(1)} cm`
              : `h = ${h.toFixed(2)} mm · ${tr('临界时试算n', 'n if at threshold')} = ${cork.inferredAtBoundary.toFixed(3)}`}
      </div>
      <TotalReflectionArtwork
        mode={mode}
        phase={phase}
        value={p}
        angle={i}
        radius={R}
        speed={v}
        depth={h}
      />
      <p className="modern-key">
        {
          [
            tr(
              '从光密介质射向空气，超过临界角后透射光消失。',
              'From a higher-index medium into air, transmission vanishes beyond the critical angle.',
            ),
            tr(
              '光在界面之间直线传播，边界处按局部法线反射或漏出。',
              'Light travels straight between boundaries and reflects or escapes according to each local normal.',
            ),
            tr(
              '水流弯曲由重力决定，光的转向来自一次次界面反射。',
              'Gravity bends the jet; successive boundary reflections turn the light.',
            ),
            tr(
              '塞子挡住小角度光，其余光全部反射时，针尖刚好消失。',
              'The cork blocks small-angle rays; the tip disappears when all remaining rays reflect internally.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          {mode === 0 ? (
            <Range
              label={tr('内部入射角 / °', 'Internal incidence / °')}
              value={angle}
              min={0}
              max={75}
              step={0.2}
              onChange={setAngle}
            />
          ) : mode === 1 ? (
            <Range
              label={tr('曲率半径 / 任意长度单位', 'Bend radius / arbitrary length unit')}
              value={radius}
              min={0.28}
              max={2.5}
              step={0.01}
              onChange={setRadius}
            />
          ) : mode === 2 ? (
            <Range
              label={tr('孔口水平流速 / m/s', 'Horizontal outlet speed / m/s')}
              value={speed}
              min={0.8}
              max={2.5}
              step={0.02}
              onChange={setSpeed}
            />
          ) : (
            <Range
              label={tr('针尖水下深度h / mm', 'Submerged tip depth h / mm')}
              value={depth}
              min={8}
              max={40}
              step={0.05}
              onChange={setDepth}
            />
          )}
        </div>
      )}
    </div>
  );
}
