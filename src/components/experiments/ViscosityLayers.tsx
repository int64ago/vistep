import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  viscosityLayers,
  layerVelocity,
  couetteStart,
  layersShot,
} from '../../models/viscosity-layers';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/viscosity-layers.css';
export default function ViscosityLayers() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [height, setHeight] = useState(10),
    [upperSpeed, setUpperSpeed] = useState(10),
    [mu, setMu] = useState(0.1),
    [muTop, setMuTop] = useState(0.4),
    [fraction, setFraction] = useState(0.5),
    [elapsed, setElapsed] = useState(0.5),
    [mode, setMode] = useState<'steady' | 'startup' | 'rigid'>('steady');
  const shot = film.watch
      ? layersShot(film.chapter, film.chapterProgress)
      : {
          height: height / 1000,
          lowerViscosity: mu,
          upperViscosity: mode === 'startup' ? mu : muTop,
          fraction,
          upperSpeed: upperSpeed / 1000,
          lowerSpeed: mode === 'rigid' ? upperSpeed / 1000 : 0,
          startup: mode === 'startup',
          elapsed,
          powerView: true,
          swapped: false,
        },
    s = viscosityLayers(shot),
    W = phone ? 340 : 760,
    H = phone ? 270 : 360,
    base = phone ? 215 : 290,
    vertical = phone ? 10000 : 16000,
    left = phone ? 25 : 70,
    width = phone ? 180 : 360,
    reference = phone ? 115 : 245,
    horizontal = phone ? 1800 : 3000,
    graph = phone ? 260 : 590,
    velocityScale = phone ? 2500 : 6000,
    y = (v: number) => base - v * vertical,
    state = (v: number) =>
      shot.startup
        ? couetteStart(v, shot.elapsed, s.height, s.upperSpeed, s.lowerViscosity)
        : {
            velocity: layerVelocity(v, shot),
            displacement: layerVelocity(v, shot) * shot.elapsed,
            topShear: s.shear,
            bottomShear: s.shear,
          },
    top = state(s.height),
    curve = Array.from({ length: 121 }, (_, i) => {
      const v = (s.height * i) / 120;
      return `${graph + state(v).velocity * velocityScale},${y(v)}`;
    }).join(' '),
    dye = Array.from({ length: 121 }, (_, i) => {
      const v = (s.height * i) / 120;
      return `${reference + state(v).displacement * horizontal},${y(v)}`;
    }).join(' '),
    shear = top.topShear,
    sameViscosity = s.lowerViscosity === s.upperViscosity,
    lowerColour = shot.swapped ? '#9db8ba' : '#b1c5a9',
    upperColour = sameViscosity ? lowerColour : shot.swapped ? '#b1c5a9' : '#9db8ba';
  return (
    <section className="layers-study">
      <header>
        {t(
          shot.startup
            ? '上板启动，动量向流体内部扩散'
            : s.upperSpeed === s.lowerSpeed
              ? '两板同速，流体移动却没有剪切'
              : '界面速度连续，斜率可以改变',
        )}
      </header>
      <svg
        className="layers-cell"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('平行板剪切流的真实层厚、启动动量扩散、连续材料标记线与同态速度剖面')}
      >
        <defs>
          <clipPath id={`${id}cell`}>
            <rect x={left} y={y(s.height) - 14} width={width} height={s.height * vertical + 28} />
          </clipPath>
          <linearGradient id={`${id}plate`} x2="0" y2="1">
            <stop stopColor="#a0ada0" />
            <stop offset=".5" stopColor="#d2d6c0" />
            <stop offset="1" stopColor="#7f948b" />
          </linearGradient>
        </defs>
        <rect x={left} y={y(s.h1)} width={width} height={s.h1 * vertical} fill={lowerColour} />
        <rect x={left} y={y(s.height)} width={width} height={s.h2 * vertical} fill={upperColour} />
        {!sameViscosity && (
          <path d={`M${left} ${y(s.h1)}H${left + width}`} stroke="#73928b" strokeWidth="1.5" />
        )}
        <path
          d={`M${reference} ${y(s.height)}V${base}`}
          stroke="#63897d"
          strokeDasharray="4 5"
          opacity=".5"
        />
        <g clipPath={`url(#${id}cell)`}>
          <polyline points={dye} stroke="#997a42" strokeWidth="2.5" fill="none" />
          {Array.from({ length: 11 }, (_, i) => {
            const v = (s.height * i) / 10,
              q = state(v);
            return (
              <circle
                key={i}
                cx={reference + q.displacement * horizontal}
                cy={y(v)}
                r="3"
                fill="#8d713f"
              />
            );
          })}
          <rect x={left} y={y(s.height) - 12} width={width} height="12" fill={`url(#${id}plate)`} />
          <rect x={left} y={base} width={width} height="12" fill={`url(#${id}plate)`} />
          {[0, 1].map((upper, j) => {
            const U = upper ? s.upperSpeed : s.lowerSpeed,
              offset = U * shot.elapsed * horizontal,
              py = upper ? y(s.height) - 6 : base + 6;
            return (
              <g key={j}>
                {Array.from({ length: 9 }, (_, i) => {
                  const tick = ((((i * width) / 8 + offset) % width) + width) % width;
                  return (
                    <path key={i} d={`M${left + tick} ${py - 4}v8`} stroke="#788f83" opacity=".6" />
                  );
                })}
              </g>
            );
          })}
        </g>
        <path d={`M${graph} ${y(s.height)}V${base}`} stroke="#859d8e" strokeDasharray="3 4" />
        <polyline points={curve} stroke="#4e7e7c" strokeWidth="2.8" fill="none" />
        {[0.2, 0.5, 0.8].map((q, i) => {
          const v = q * s.height,
            u = state(v).velocity,
            delta = u * velocityScale;
          return Math.abs(delta) > 0.4 ? (
            <path
              key={i}
              d={`M${graph} ${y(v)}h${delta}m${delta > 0 ? -5 : 5} -4l${delta > 0 ? 5 : -5} 4l${delta > 0 ? -5 : 5} 4`}
              stroke="#4e7e7c"
              strokeWidth="1.8"
              fill="none"
            />
          ) : null;
        })}
      </svg>
      <div className="layers-legend">
        <span>{t('金：同一标记线的位移')}</span>
        <span>{t('绿：速度剖面')}</span>
      </div>
      <div className="layers-result">
        <b>{shear === null ? '—' : `${shear.toFixed(3)} Pa`}</b>
        <span>
          {t('上板剪应力')}
          <br />h {(s.height * 1000).toFixed(1)} mm · t {shot.elapsed.toFixed(2)} s
        </span>
      </div>
      {shot.powerView && !shot.startup ? (
        <div className="layers-power">
          <span>
            {t('机械功率输入')} {s.power.toFixed(4)} W/m²
          </span>
          <span>
            {t('黏性耗散')} {s.power.toFixed(4)} W/m²
          </span>
        </div>
      ) : (
        <div className="layers-viscosities">
          <span>
            {t('下层')} μ {s.lowerViscosity.toFixed(2)}
          </span>
          <span>
            {t('上层')} μ {s.upperViscosity.toFixed(2)} Pa·s
          </span>
        </div>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('层间连续、参考标记与模型范围')}</summary>
          <p>
            {t(
              '无限平行板局部，零压强梯度、无滑移、牛顿流体。两层稳态的速度及切向应力在界面连续；同速平移时梯度与耗散为零。标记线表示每个规定稳态中从同一竖线出发的位移比较，改变层厚不模拟挤压瞬态。启动章单独使用均匀流体的动量扩散解，t=0的理想壁应力奇点不显示。忽略混合、界面变形、湍流和温升，耗散只给能量速率。图的横纵比例不同，读数保持物理单位。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="layers-controls">
          <Range
            label={t('板间距')}
            value={height}
            min={5}
            max={15}
            unit="mm"
            onChange={setHeight}
          />
          <Range
            label={t('上板速度')}
            value={upperSpeed}
            min={-20}
            max={20}
            unit="mm/s"
            onChange={setUpperSpeed}
          />
          <Range
            label={t('下层动力黏度')}
            value={mu}
            min={0.05}
            max={0.4}
            step={0.01}
            unit="Pa·s"
            onChange={setMu}
          />
          {mode !== 'startup' && (
            <Range
              label={t('下层厚度比例')}
              value={fraction}
              min={0.25}
              max={0.75}
              step={0.01}
              onChange={setFraction}
            />
          )}
          {mode !== 'startup' && (
            <Range
              label={t('上层动力黏度')}
              value={muTop}
              min={0.05}
              max={0.4}
              step={0.01}
              unit="Pa·s"
              onChange={setMuTop}
            />
          )}
          <Range
            label={t('观察时间')}
            value={elapsed}
            min={0.01}
            max={2}
            step={0.01}
            unit="s"
            onChange={setElapsed}
          />
          <div className="layers-modes">
            {(['steady', 'startup', 'rigid'] as const).map((m) => (
              <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {t(m === 'steady' ? '两层稳态' : m === 'startup' ? '均匀流体启动' : '两板同速平移')}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
