import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { inclineDefaults, inclineShot, inclineState } from '../../models/inclined-plane';
import '../../styles/inclined-plane.css';
export default function InclinedPlane() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [manual, setManual] = useState(inclineDefaults()),
    p = film.watch ? inclineShot(film.chapter, film.chapterProgress) : manual,
    s = inclineState(p),
    c = film.watch ? film.chapter : 5;
  const render = (phone: boolean) => {
    const width = phone ? 340 : 760,
      height = phone ? 255 : 340,
      scale = phone ? 57 : 122,
      ox = phone ? 34 : 70,
      oy = phone ? 201 : 276,
      box = phone ? 26 : 45,
      x = ox + s.position.x * scale,
      y = oy - s.position.y * scale;
    return (
      <svg
        className={phone ? 'incline-phone' : 'incline-wide'}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('同一高度的斜面、负载与沿斜面拉力')}
      >
        <defs>
          <pattern id={`${id}-grain-${phone}`} patternUnits="userSpaceOnUse" width="15" height="15">
            <path d="M0 15L15 0" stroke="#c8c4b0" strokeWidth="1" />
          </pattern>
        </defs>
        <path
          d={`M${ox} ${oy}L${ox + s.run * scale} ${oy - p.height * scale}V${oy}Z`}
          fill="#e7e4d6"
        />
        <path
          d={`M${ox} ${oy}L${ox + s.run * scale} ${oy - p.height * scale}V${oy}Z`}
          fill={`url(#${id}-grain-${phone})`}
          opacity={(p.friction / 0.3) * 0.45}
        />
        <path
          d={`M${ox} ${oy}L${ox + s.run * scale} ${oy - p.height * scale}`}
          stroke="#9eaa95"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d={`M16 ${oy + 4}H${width - 12}`} stroke="#d5d9c8" strokeWidth="2" />
        <g transform={`translate(${x} ${y}) rotate(${-p.angle})`}>
          <rect x={-box / 2} y={-box} width={box} height={box} rx="4" fill="#a77a4e" />
          <path
            d={`M${-box / 2 + 5} ${-box + 5}L${box / 2 - 5} -5M${box / 2 - 5} ${-box + 5}L${-box / 2 + 5} -5`}
            stroke="#d8b58a"
            strokeWidth="2"
          />
          <path
            d={`M${p.progress > 0.5 ? -Math.min(phone ? 64 : 110, 20 + s.pull * 0.45) : 0} ${-box / 2}H${p.progress > 0.5 ? 0 : Math.min(phone ? 64 : 110, 20 + s.pull * 0.45)}m-8-5 8 5-8 5`}
            fill="none"
            stroke="#598d83"
            strokeWidth="3"
          />
          {p.friction > 0 && (
            <path
              d={`M0 ${-box - 9}H-${20 + s.frictionForce * 0.3}m8-5-8 5 8 5`}
              fill="none"
              stroke="#b98057"
              strokeWidth="3"
            />
          )}
        </g>
        <path
          d={`M${ox + s.run * scale + 16} ${oy}h6V${oy - p.height * scale}h-6`}
          fill="none"
          stroke="#8e90a5"
          strokeWidth="2"
        />
        <text
          x={Math.min(width - 32, ox + s.run * scale + 38)}
          y={oy - (p.height * scale) / 2 + 7}
          textAnchor="middle"
        >
          1 m
        </text>
        <text x={width / 2} y="35" textAnchor="middle" fill="#4d8177">
          {t('匀速上拉')} {s.pull.toFixed(1)} N
        </text>
        <text x={width / 2} y="66" textAnchor="middle">
          {t('路径长度')} {s.length.toFixed(2)} m
        </text>
        <text x={width / 2} y={height - 14} textAnchor="middle">
          θ = {p.angle.toFixed(0)}° · μ = {p.friction.toFixed(2)}
        </text>
      </svg>
    );
  };
  return (
    <div className="incline-film">
      <div className="incline-stage">
        {render(false)}
        {render(true)}
      </div>
      <div className="incline-ledger">
        <div>
          <span>{t('提升重力势能')}</span>
          <i style={{ width: `${(s.potential / 300) * 100}%` }} />
          <b>{s.potential.toFixed(1)} J</b>
        </div>
        {c >= 4 && (
          <div>
            <span>{t('克服滑动摩擦')}</span>
            <i style={{ width: `${(s.heat / 300) * 100}%` }} />
            <b>{s.heat.toFixed(1)} J</b>
          </div>
        )}
        <p>
          {t('输入功')} <strong>{s.inputWork.toFixed(1)} J</strong>
        </p>
      </div>
      {!film.watch && (
        <div className="incline-controls">
          <Range
            label={t('斜面倾角')}
            value={p.angle}
            min={12}
            max={60}
            unit="°"
            onChange={(angle) => setManual({ ...manual, angle })}
          />
          <Range
            label={t('滑动摩擦系数')}
            value={p.friction}
            min={0}
            max={0.4}
            step={0.01}
            onChange={(friction) => setManual({ ...manual, friction })}
          />
          <Range
            label={t('沿斜面的位置')}
            value={p.progress}
            min={0}
            max={1}
            step={0.01}
            onChange={(progress) => setManual({ ...manual, progress })}
          />
        </div>
      )}
      <details className="incline-limit">
        <summary>{t('模型条件')}</summary>
        <p>{t('120 N 负载 · 上拉方向平行斜面 · 匀速滑动，不是启动阈值')}</p>
      </details>
    </div>
  );
}
