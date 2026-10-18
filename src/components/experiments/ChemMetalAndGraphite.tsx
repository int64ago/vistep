import { useId, useMemo, useState, type ReactNode } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  metalLayers,
  drude,
  thermalResponse,
  velocityDensity,
  graphite,
  graphiteBase,
  orbitalRing,
  orbitalContour,
  conductivity,
  rotate,
  CC,
  type V,
} from '../../models/chem-metal-and-graphite';
import '../../styles/chem-metal-and-graphite.css';
const modes = ['shared', 'slip', 'drift', 'scatter', 'layers', 'orbitals', 'anisotropy'] as const;
type Mode = (typeof modes)[number];
const names = [
  '遍布金属的价电子',
  '原子层连续滑移',
  '电场建立漂移',
  '散射削弱平均漂移',
  '石墨层内与层间',
  '平行的 p 轨道',
  '方向改变电导',
];
function Metal({ progress, slip }: { progress: number; slip: boolean }) {
  const s = metalLayers(slip ? progress : 0),
    id = useId().replace(/:/g, ''),
    X = (x: number) => 148 + 32 * x,
    Y = (y: number) => 132 + 32 * y;
  const upper = s.atoms.filter((a) => a.row < 3),
    lower = s.atoms.filter((a) => a.row >= 3);
  const sheet = (as: typeof upper) => {
    const xs = as.map((a) => X(a.p.x)),
      ys = as.map((a) => Y(a.p.y));
    return {
      x: Math.min(...xs) - 18,
      y: Math.min(...ys) - 18,
      w: Math.max(...xs) - Math.min(...xs) + 36,
      h: Math.max(...ys) - Math.min(...ys) + 36,
    };
  };
  return (
    <svg
      viewBox="0 0 320 265"
      role="img"
      aria-label={t(slip ? '原子层连续滑移' : '遍布金属的价电子')}
    >
      <defs>
        <radialGradient id={`${id}-core`} cx="30%" cy="25%" r="75%">
          <stop stopColor="#fcf1d1" />
          <stop offset=".45" stopColor="#c5b58e" />
          <stop offset="1" stopColor="#a89978" />
        </radialGradient>
        <linearGradient id={`${id}-sea`} x2="0" y2="1">
          <stop stopColor="#82aca9" stopOpacity=".15" />
          <stop offset=".5" stopColor="#779ea2" stopOpacity=".42" />
          <stop offset="1" stopColor="#82aca9" stopOpacity=".15" />
        </linearGradient>
      </defs>
      <rect
        x="15"
        y="34"
        width="290"
        height="202"
        rx="35"
        fill={`url(#${id}-sea)`}
        opacity={slip ? 1 : 0.25 + 0.75 * progress}
      />
      {[upper, lower].map((a, i) => {
        const b = sheet(a);
        return (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="23"
            fill="#86a8a6"
            fillOpacity=".12"
            stroke="#a3b8ad"
            strokeOpacity=".5"
          />
        );
      })}
      {s.atoms.map((a) => (
        <g key={a.id}>
          <circle
            cx={X(a.p.x)}
            cy={Y(a.p.y)}
            r="14.8"
            fill={`url(#${id}-core)`}
            stroke="#8e957e"
            strokeWidth=".7"
          />
          {a.id === '2:3' && (
            <circle
              cx={X(a.p.x)}
              cy={Y(a.p.y)}
              r="17"
              fill="none"
              stroke="#b98142"
              strokeWidth="1.3"
            />
          )}
        </g>
      ))}
      {slip && (
        <g stroke="#b38a52" strokeWidth="2.2" fill="none">
          <path d="M74 24 H174 L167 19 M174 24 L167 29" />
          <path d="M247 247 H147 L154 242 M147 247 L154 252" />
        </g>
      )}
    </svg>
  );
}
function Distribution({
  time,
  field,
  T,
  scatter,
}: {
  time: number;
  field: number;
  T: number;
  scatter: boolean;
}) {
  const state = scatter
    ? thermalResponse(T, time, field)
    : { ...drude(time, field, 1), width: 1.3, tau: 1 };
  const base = scatter ? thermalResponse(1, time, field) : { velocity: 0, width: 1.3 };
  const X = (v: number) => 160 + v * 17,
    Y = (p: number) => 163 - p * 300;
  const path = (mean: number, width: number) =>
    Array.from({ length: 201 }, (_, i) => {
      const v = -8 + i * 0.08;
      return `${i ? 'L' : 'M'}${X(v)} ${Y(velocityDensity(v, mean, width))}`;
    }).join(' ');
  const current = state.current;
  return (
    <div className="cmg-distribution">
      <div className="cmg-flow">
        <span>
          {t('电场与常规电流')} <b>{field === 0 ? '0' : field > 0 ? '→' : '←'}</b>
        </span>
        <span>
          {t('电子平均漂移')} <b>{field === 0 ? '0' : field > 0 ? '←' : '→'}</b>
        </span>
      </div>
      <svg viewBox="0 0 320 210" role="img" aria-label={t('经典电子速度分布与平均漂移')}>
        <path d="M24 163 H296 M160 35 V168" fill="none" stroke="#a4b0a0" strokeWidth="1.2" />
        <path
          d={`${path(base.velocity, base.width)} L296 163 H24Z`}
          fill="#bdc9b5"
          fillOpacity=".32"
          stroke="#a4b497"
          strokeWidth="1.6"
        />
        <path
          d={`${path(state.velocity, state.width)} L296 163 H24Z`}
          fill={scatter ? '#c7ab83' : '#86aaa8'}
          fillOpacity=".35"
          stroke={scatter ? '#ad8c5e' : '#648c8b'}
          strokeWidth="2.2"
        />
        <path
          d={`M${X(state.velocity)} 162 V${Y(velocityDensity(state.velocity, state.velocity, state.width)) - 8}`}
          fill="none"
          stroke="#7b8e6b"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        {[-4, 0, 4].map((v) => (
          <text key={v} x={X(v)} y="193" textAnchor="middle">
            {v > 0 ? '+' : ''}
            {v}
          </text>
        ))}
      </svg>
      <div className="cmg-axis">{t('速度 / 参考速度')}</div>
      <div className="cmg-evidence">
        <span>
          τ / τ₀ <b>{state.tau.toFixed(2)}</b>
        </span>
        <span>
          j / j₀ <b>{current.toFixed(2)}</b>
        </span>
      </div>
      <p className="cmg-note">
        {t(scatter ? '归一化高温散射模型；浅绿为初始分布。' : '经典分布示意；竖虚线是平均速度。')}
      </p>
    </div>
  );
}
function Graphite({
  mode,
  progress,
  angle,
}: {
  mode: 'layers' | 'orbitals' | 'anisotropy';
  progress: number;
  angle: number;
}) {
  const uid = useId().replace(/:/g, ''),
    shift = mode === 'layers' ? CC * Math.sqrt(3) * progress : 0;
  const g = useMemo(() => graphite(shift), [shift]),
    ring = new Set(orbitalRing),
    rs = graphiteBase.atoms.filter((a) => ring.has(a.id)),
    center =
      mode === 'orbitals'
        ? rs.reduce((p, a) => ({ x: p.x + a.p.x / rs.length, y: p.y + a.p.y / rs.length, z: 0 }), {
            x: 0,
            y: 0,
            z: 0,
          })
        : { x: 0, y: 0.6, z: 0 };
  const keep =
    mode === 'orbitals'
      ? g.atoms.filter(
          (a) =>
            a.layer === 0 &&
            (ring.has(a.id) ||
              g.bonds.some(
                (b) => (b.a === a.id && ring.has(b.b)) || (b.b === a.id && ring.has(b.a)),
              )),
        )
      : g.atoms;
  const ids = new Set(keep.map((a) => a.id));
  const scale = mode === 'orbitals' ? 29 : 18;
  const P = (v: V) => {
    const r = rotate(
      { x: v.x - center.x, y: v.y - center.y, z: v.z },
      mode === 'orbitals' ? 0.16 : 0.18,
      mode === 'orbitals' ? 1.03 : 1.13,
    );
    return { x: 160 + r.x * scale, y: 133 - r.y * scale, z: r.z };
  };
  const shapes: { z: number; key: string; el: ReactNode }[] = [];
  const fade = (layer: number) =>
    mode === 'layers' && layer !== 0 ? 0.15 + 0.85 * ease(ramp(progress, 0, 0.25)) : 1;
  for (const [i, b] of g.bonds.entries()) {
    if (!ids.has(b.a) || !ids.has(b.b)) continue;
    const a = keep.find((a) => a.id === b.a)!,
      c = keep.find((a) => a.id === b.b)!,
      A = P(a.p),
      B = P(c.p);
    shapes.push({
      z: (A.z + B.z) / 2,
      key: `bond${i}`,
      el: (
        <path
          d={`M${A.x} ${A.y} L${B.x} ${B.y}`}
          fill="none"
          stroke="#718782"
          strokeWidth="2.5"
          opacity={fade(a.layer)}
        />
      ),
    });
  }
  if (mode === 'orbitals')
    for (const a of rs)
      for (const sign of [1, -1] as const) {
        const contour = orbitalContour(sign).map((v) =>
          P({ x: a.p.x + v.x, y: a.p.y, z: a.p.z + v.z }),
        );
        shapes.push({
          z: contour.reduce((s, v) => s + v.z, 0) / contour.length,
          key: `orb${a.id}:${sign}`,
          el: (
            <polygon
              points={contour.map((v) => `${v.x},${v.y}`).join(' ')}
              fill={sign === 1 ? '#7da3b0' : '#b7a36d'}
              stroke={sign === 1 ? '#648c9a' : '#aa9055'}
              strokeWidth=".65"
              fillOpacity={0.1 + 0.28 * progress}
              strokeOpacity={0.3 + 0.5 * progress}
            />
          ),
        });
      }
  for (const a of keep) {
    const p = P(a.p);
    shapes.push({
      z: p.z,
      key: a.id,
      el: (
        <g opacity={fade(a.layer)}>
          <circle cx={p.x} cy={p.y} r={mode === 'orbitals' ? 4.8 : 3.9} fill={`url(#${uid})`} />
          {a.id === (mode === 'layers' ? '1:0:0:0' : '0:0:0:0') && (
            <circle cx={p.x} cy={p.y} r="7.3" fill="none" stroke="#ba9455" strokeWidth="1.2" />
          )}
        </g>
      ),
    });
  }
  shapes.sort((a, b) => a.z - b.z);
  const c = conductivity(angle),
    arrow = (v: V, start: V, color: string) => {
      const A = P(start),
        B = P({ x: start.x + v.x * 4.2, y: start.y + v.y * 4.2, z: start.z + v.z * 4.2 });
      const len = Math.hypot(B.x - A.x, B.y - A.y),
        ux = (B.x - A.x) / len,
        uy = (B.y - A.y) / len;
      return (
        <g fill="none" stroke={color} strokeWidth="2.5">
          <path
            d={`M${A.x} ${A.y} L${B.x} ${B.y} M${B.x - ux * 7 - uy * 4} ${B.y - uy * 7 + ux * 4} L${B.x} ${B.y} L${B.x - ux * 7 + uy * 4} ${B.y - uy * 7 - ux * 4}`}
          />
        </g>
      );
    };
  return (
    <div className={`cmg-graphite cmg-graphite-${mode}`}>
      <svg
        viewBox="0 0 320 265"
        role="img"
        aria-label={t(
          mode === 'layers'
            ? '石墨层内与层间'
            : mode === 'orbitals'
              ? '平行的 p 轨道'
              : '方向改变电导',
        )}
      >
        <defs>
          <radialGradient id={uid} cx="30%" cy="25%">
            <stop stopColor="#d8e2d9" />
            <stop offset=".6" stopColor="#5e7975" />
            <stop offset="1" stopColor="#536963" />
          </radialGradient>
        </defs>
        {shapes.map((s) => (
          <g key={s.key}>{s.el}</g>
        ))}
        {mode === 'anisotropy' && (
          <>
            {arrow(c.E, { x: -2, y: -5.2, z: -1 }, '#ac7962')}
            {arrow(c.direction, { x: -2, y: -4, z: -1 }, '#7b9362')}
          </>
        )}
      </svg>
      {mode === 'layers' ? (
        <div className="cmg-evidence">
          <span>
            {t('层内')} <b>142 pm</b>
          </span>
          <span>
            {t('层间')} <b>335 pm</b>
          </span>
        </div>
      ) : mode === 'orbitals' ? (
        <div className="cmg-orbital-key">
          <span>
            <i />
            {t('相位一')}
          </span>
          <span>
            <i />
            {t('相反相位')}
          </span>
          <p>{t('两种颜色不是正、负电荷。')}</p>
        </div>
      ) : (
        <>
          <div className="cmg-evidence">
            <span>
              θ <b>{angle.toFixed(0)}°</b>
            </span>
            <span>
              σ(θ) / σ∥ <b>{c.longitudinal.toFixed(3)}</b>
            </span>
          </div>
          <div className="cmg-direction-key">
            <span>{t('电场 E')}</span>
            <span>{t('电流 J')}</span>
          </div>
          <p className="cmg-note">{t('箭头仅表示方向；教学参数 σ⊥/σ∥ = 0.02。')}</p>
        </>
      )}
    </div>
  );
}
export default function ChemMetalAndGraphite() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(f.variant === 'graphite-bonding' ? 'layers' : 'shared'),
    [progress, setProgress] = useState(0.7),
    [field, setField] = useState(1.7),
    [temperature, setTemperature] = useState(2),
    [angle, setAngle] = useState(0);
  const m = f.watch ? modes[Math.min(6, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.9)) : progress,
    E = f.watch ? 1.7 : field,
    T = f.watch ? 1 + 2 * p : temperature,
    a = f.watch ? 90 * p : angle;
  return (
    <div className={`cmg ${f.watch ? 'is-watch' : ''}`}>
      <div className={`cmg-stage cmg-mode-${m}`}>
        <div className="cmg-heading">
          {t(
            m === 'shared' || m === 'slip'
              ? '金属正离子实与共有电子'
              : m === 'drift' || m === 'scatter'
                ? '由无规则运动到平均漂移'
                : m === 'layers'
                  ? 'AB 堆垛 · 保留同一层的原子'
                  : m === 'orbitals'
                    ? 'π 电子结构 · p 轨道截面'
                    : '石墨的各向异性电导',
          )}
        </div>
        {m === 'shared' || m === 'slip' ? (
          <>
            <Metal progress={p} slip={m === 'slip'} />
            <div className="cmg-key">
              <span>
                <i />
                {t('正离子实')}
              </span>
              <span>
                <i />
                {t('离域电子的示意区域')}
              </span>
            </div>
          </>
        ) : m === 'drift' || m === 'scatter' ? (
          <Distribution
            time={m === 'drift' ? 6 * p : 8}
            field={E}
            T={T}
            scatter={m === 'scatter'}
          />
        ) : (
          <Graphite mode={m} progress={p} angle={a} />
        )}
      </div>
      {!f.watch && (
        <div className="cmg-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m !== 'scatter' && m !== 'anisotropy' && (
            <Range
              label={t('演示进度')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {(m === 'drift' || m === 'scatter') && (
            <Range
              label={t('归一化电场')}
              value={field}
              min={-2}
              max={2}
              step={0.1}
              onChange={setField}
            />
          )}
          {m === 'scatter' && (
            <Range
              label={t('相对温度 T/T₀')}
              value={temperature}
              min={1}
              max={3}
              step={0.05}
              onChange={setTemperature}
            />
          )}
          {m === 'anisotropy' && (
            <Range
              label={t('电场与层面的夹角（°）')}
              value={angle}
              min={0}
              max={90}
              onChange={setAngle}
            />
          )}
          <p>{t('运动、电子分布和电导参数均为标明的教学模型，不是材料强度或电阻率测量。')}</p>
        </div>
      )}
    </div>
  );
}
