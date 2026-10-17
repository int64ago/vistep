import { useId, useState } from 'react';
import { t } from '../../i18n';
import { buoyancy, buoyancyMotion, buoyancyShot } from '../../models/buoyancy';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/buoyancy.css';
export default function Buoyancy() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [mass, setMass] = useState(0.84),
    [fluidDensity, setFluidDensity] = useState(1000),
    [depth, setDepth] = useState(0.12),
    [release, setRelease] = useState(false),
    [phase, setPhase] = useState(0);
  const motion = release ? buoyancyMotion(phase * 0.5, { mass, fluidDensity }) : null,
    shot = film.watch
      ? buoyancyShot(film.chapter, film.chapterProgress)
      : {
          mass,
          fluidDensity,
          depth: motion?.depth ?? depth,
          velocity: motion?.velocity ?? 0,
          held: !release,
        },
    s = buoyancy(shot.depth, shot),
    W = phone ? 340 : 760,
    H = phone ? 310 : 400,
    scale = phone ? 650 : 850,
    water = phone ? 90 : 105,
    centre = phone ? 150 : 365,
    half = (Math.sqrt(s.area) * scale) / 2,
    top = water + (s.depth - s.height) * scale,
    bottom = water + s.depth * scale,
    forceScale = phone ? 4 : 5,
    pressureLength = (p: number) => (p / 2500) * (phone ? 26 : 36),
    arrow = (x: number, y: number, length: number, up: boolean, color: string) =>
      length < 0.2 ? null : (
        <path
          d={`M${x} ${y}v${up ? -length : length}m-4 ${up ? 6 : -6}l4 ${up ? -6 : 6}l4 ${up ? 6 : -6}`}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
      );
  return (
    <section className="buoy-study">
      <header>
        {t(shot.held ? '定位杆缓缓下放；读数来自浸没体积' : '浮与沉，都要比较浮力和重力')}
      </header>
      <svg
        className="buoy-tank"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('液面、真实浸没高度与排液体积，上下表面压力及浮力重力的同态剖面')}
      >
        <defs>
          <linearGradient id={`${id}water`} x2="0" y2="1">
            <stop stopColor="#adc9c4" stopOpacity=".5" />
            <stop offset="1" stopColor="#729e9e" stopOpacity=".7" />
          </linearGradient>
          <linearGradient id={`${id}block`}>
            <stop stopColor="#d8b88c" />
            <stop offset=".5" stopColor="#c09b6d" />
            <stop offset="1" stopColor="#e0bf8f" />
          </linearGradient>
        </defs>
        <rect x="20" y={water} width={W - 40} height={H - water} fill={`url(#${id}water)`} />
        <path d={`M20 ${water}H${W - 20}`} stroke="#7da4a1" strokeWidth="2" />
        {shot.held && <path d={`M${centre} 7V${top}`} stroke="#6c817c" strokeWidth="4" />}
        <rect
          x={centre - half}
          y={top}
          width={2 * half}
          height={s.height * scale}
          rx="5"
          fill={`url(#${id}block)`}
          stroke="#9e855e"
          strokeWidth="1.5"
        />
        {[0.2, 0.4, 0.6, 0.8].map((a, i) => (
          <path
            key={i}
            d={`M${centre - half + 5} ${top + s.height * scale * a}q${half} -4 ${2 * half - 10} 0`}
            stroke="#ad8e65"
            opacity=".6"
            fill="none"
          />
        ))}
        {s.immersed > 0 && (
          <path
            d={`M${centre - half - 35} ${Math.max(water, top)}h-7v${s.immersed * scale}h7`}
            fill="none"
            stroke="#457a7c"
            strokeWidth="2"
          />
        )}
        {s.mass > 0.9 && (
          <rect
            x={centre - half + 8}
            y={top + 8}
            width={2 * half - 16}
            height={((s.mass - 0.84) / 0.6) * 18}
            rx="3"
            fill="#6d7e7d"
            stroke="#d2d8c7"
          />
        )}
        {[-0.3, 0, 0.3].map((a, i) => (
          <g key={i}>
            {s.topPressure > 0 &&
              arrow(
                centre + a * half * 2,
                top - pressureLength(s.topPressure) - 6,
                pressureLength(s.topPressure),
                false,
                '#567e84',
              )}
            {s.bottomPressure > 0 &&
              arrow(
                centre + a * half * 2,
                bottom + pressureLength(s.bottomPressure) + 6,
                pressureLength(s.bottomPressure),
                true,
                '#567e84',
              )}
          </g>
        ))}
        {Array.from({ length: 6 }, (_, i) => {
          const d = s.depth - s.height + ((i + 0.5) * s.height) / 6,
            p = s.fluidDensity * 9.81 * Math.max(0, d),
            y = water + d * scale,
            n = pressureLength(p);
          return p > 0 ? (
            <g key={i} stroke="#567e84" strokeWidth="1.5" fill="none">
              <path d={`M${centre - half - n - 5} ${y}h${n}m-4 -3l4 3l-4 3`} />
              <path d={`M${centre + half + n + 5} ${y}h${-n}m4 -3l-4 3l4 3`} />
            </g>
          ) : null;
        })}
        {arrow(centre + half + 55, water + 55, s.force * forceScale, true, '#457a7c')}
        {arrow(centre + half + 80, water + 55, s.weight * forceScale, false, '#a27746')}
      </svg>
      <div className="buoy-forces">
        <span>
          <i />
          {t('浮力')} {s.force.toFixed(2)} N
        </span>
        <span>
          <i />
          {t('物体重力')} {s.weight.toFixed(2)} N
        </span>
      </div>
      <div className="buoy-volume">
        <b>{(s.displaced * 1000).toFixed(2)} L</b>
        <span>
          {t('排开液体体积')}
          <br />m {s.mass.toFixed(2)} kg · ρ {s.fluidDensity.toFixed(0)} kg/m³
        </span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('压力差、定位与放手模型')}</summary>
          <p>
            {t(
              '直立等截面棱柱，截面积0.01m²、高0.12m；大液槽液位视为不变，忽略空气浮力和表面张力。蓝色小箭头表示液体表压，左右抵消，上下合力才是浮力。定位杆可推也可拉。放手段积分重力、浮力和18N·s/m线性阻尼，阻尼只是教学近似，不预测真实入水阻力。加重与换液段比较静态平衡，不模拟装载瞬态。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="buoy-controls">
          <Range
            label={t('物体质量')}
            value={mass}
            min={0.6}
            max={1.44}
            step={0.01}
            unit="kg"
            onChange={setMass}
          />
          <Range
            label={t('液体密度')}
            value={fluidDensity}
            min={800}
            max={1200}
            step={10}
            unit="kg/m³"
            onChange={setFluidDensity}
          />
          {!release ? (
            <Range
              label={t('底面深度')}
              value={depth}
              min={0}
              max={0.24}
              step={0.002}
              unit="m"
              onChange={setDepth}
            />
          ) : (
            <Range
              label={t('放手后时间')}
              value={phase}
              min={0}
              max={1}
              step={0.01}
              unit="×0.5s"
              onChange={setPhase}
            />
          )}
          <button
            type="button"
            aria-pressed={release}
            onClick={() => {
              setRelease(!release);
              setPhase(0);
            }}
          >
            {t(release ? '用定位杆控制深度' : '从全浸没处放手')}
          </button>
        </div>
      )}
    </section>
  );
}
