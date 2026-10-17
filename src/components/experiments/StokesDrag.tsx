import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { stokesDrag, stokesShot, stokesStreamline, stokesMarker } from '../../models/stokes-drag';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/stokes-drag.css';
export default function StokesDrag() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [radius, setRadius] = useState(0.3),
    [viscosity, setViscosity] = useState(0.1),
    [speed, setSpeed] = useState(0.5),
    [density, setDensity] = useState(2500),
    [terminal, setTerminal] = useState(false),
    [phase, setPhase] = useState(0);
  const shot = film.watch
      ? stokesShot(film.chapter, film.chapterProgress)
      : { radius: radius / 1000, viscosity, speed: speed / 1000, sphereDensity: density, terminal },
    s = stokesDrag(shot),
    lines = useMemo(
      () =>
        [-0.0009, -0.0005, -0.00015, -0.00005, 0.00005, 0.00015, 0.0005, 0.0009].map((b) =>
          stokesStreamline(b, s.radius),
        ),
      [s.radius],
    ),
    W = phone ? 340 : 760,
    H = phone ? 280 : 360,
    scale = phone ? 100000 : 130000,
    cx = W / 2,
    cy = H / 2,
    time = film.watch ? film.chapterTime * 0.2 : phase,
    point = (x: number, y: number) => `${cx + x * scale},${cy - y * scale}`,
    forceArrow = (x: number, length: number, up: boolean, color: string) =>
      length < 0.4 ? null : (
        <path
          d={`M${x} ${cy + 15}v${up ? -length : length}m-3 ${up ? Math.min(5, length / 2) : -Math.min(5, length / 2)}l3 ${up ? -Math.min(5, length / 2) : Math.min(5, length / 2)}l3 ${up ? Math.min(5, length / 2) : -Math.min(5, length / 2)}`}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
      ),
    reX = (re: number) => 30 + ((Math.log10(Math.max(1e-4, re)) + 4) / 7) * (W - 60),
    gaugeY = H - 65;
  return (
    <section className="stokes-study">
      <header>
        {t(
          !s.valid
            ? '试算Re已越界，停止外推低Re流场'
            : shot.terminal
              ? '随球观察：终端沉降的三个力平衡'
              : '固定球体，流体相对它缓缓流过',
        )}
      </header>
      <svg
        className="stokes-fluid"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('刚性球的真实三维轴对称斯托克斯流线、按速度积分的流动标记与适用条件')}
      >
        <defs>
          <radialGradient id={`${id}sphere`} cx=".3" cy=".25">
            <stop stopColor="#d2d6bc" />
            <stop offset=".6" stopColor="#8fa497" />
            <stop offset="1" stopColor="#526f6f" />
          </radialGradient>
        </defs>
        {s.valid ? (
          <>
            {Math.abs(s.speed) > 1e-12 &&
              lines.map((line, j) => (
                <g key={j}>
                  <polyline
                    points={line.points.map((p) => point(p.x, p.y)).join(' ')}
                    fill="none"
                    stroke="#8ca9a0"
                    strokeWidth="1.3"
                    opacity=".6"
                  />
                  {Array.from({ length: 4 }, (_, i) => {
                    const p = stokesMarker(line, s.speed, time, (i + j * 0.13) / 4);
                    return (
                      <circle
                        key={i}
                        cx={cx + p.x * scale}
                        cy={cy - p.y * scale}
                        r={j === 3 && i === 1 ? 3.5 : 2.3}
                        fill={j === 3 && i === 1 ? '#a57e43' : '#6c9692'}
                      />
                    );
                  })}
                </g>
              ))}
            <circle
              cx={cx}
              cy={cy}
              r={s.radius * scale}
              fill={`url(#${id}sphere)`}
              stroke="#688882"
            />
            {forceArrow(
              cx + s.radius * scale + 38,
              Math.abs(s.drag) * 1e6 * (phone ? 10 : 12),
              s.drag >= 0,
              '#ae8349',
            )}
            {shot.terminal && (
              <>
                {forceArrow(
                  cx + s.radius * scale + 60,
                  s.buoyancy * 1e6 * (phone ? 10 : 12),
                  true,
                  '#5e9194',
                )}
                {forceArrow(
                  cx + s.radius * scale + 82,
                  s.weight * 1e6 * (phone ? 10 : 12),
                  false,
                  '#738666',
                )}
              </>
            )}
          </>
        ) : (
          <>
            <circle
              cx={cx}
              cy="65"
              r={s.radius * scale}
              fill={`url(#${id}sphere)`}
              stroke="#688882"
            />
            <rect
              x={reX(0.1)}
              y={gaugeY - 18}
              width={W - 30 - reX(0.1)}
              height="36"
              rx="12"
              fill="#d0a07b"
              opacity=".28"
            />
            <path
              d={`M30 ${gaugeY}H${W - 30}M${reX(0.1)} ${gaugeY - 27}V${gaugeY + 27}`}
              stroke="#8e9b89"
              strokeWidth="2"
            />
            {[0.001, 0.1, 10].map((re) => (
              <text
                key={re}
                x={reX(re)}
                y={gaugeY + 54}
                textAnchor="middle"
                fill="#667c6b"
                fontSize={phone ? 28 : 20}
              >
                {re}
              </text>
            ))}
            <circle cx={reX(s.reynolds)} cy={gaugeY} r="6" fill="#b17d4e" />
          </>
        )}
      </svg>
      <div className="stokes-legend">
        <span>
          {t(
            s.valid
              ? shot.terminal
                ? '蓝：浮力 · 绿：重力 · 金：阻力'
                : '球面无滑移；流线为真实球体截面'
              : '标线Re = 0.1，右侧不再显示爬流预测',
          )}
        </span>
        <span>{t(s.speed === 0 ? '无相对流动' : s.speed > 0 ? '相对流向上' : '相对流向下')}</span>
      </div>
      <div className="stokes-force">
        <b>
          {s.valid ? `${(Math.abs(s.drag) * 1e6).toFixed(3)} μN` : `Re ${s.reynolds.toFixed(1)}`}
        </b>
        <span>
          {t(s.valid ? '斯托克斯阻力大小' : '低Re假设不自洽')}
          <br />
          {t(s.valid ? '相对速度' : '斯托克斯试算速度')} {(s.speed * 1000).toFixed(2)} mm/s
        </span>
      </div>
      <div className="stokes-condition">
        <span>μ {s.viscosity.toFixed(3)} Pa·s</span>
        <span>{s.valid ? `Re ${s.reynolds.toFixed(4)}` : t('不能视作真实终端速度')}</span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('刚性球、参考系与低Re近似')}</summary>
          <p>
            {t(
              '孤立刚性球，远离容器壁，牛顿不可压缩流体，表面无滑移。解析流场是三维轴对称解的经线截面；流线由流函数求根，标记由沿线速度积分，不是球外任意曲线。随球参考系中球保持不动；终端模式用重力减浮力与阻力平衡，不模拟起步惯性、附加质量或历史力。Re以直径计算，0.1只是保守教学显示界限，不是突然发生湍流的阈值。低Re解不适用于任意气泡、密集颗粒或高Re。自动运动慢放5倍。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="stokes-controls">
          <Range
            label={t('球半径')}
            value={radius}
            min={0.15}
            max={0.4}
            step={0.01}
            unit="mm"
            onChange={setRadius}
          />
          <Range
            label={t('动力黏度')}
            value={viscosity}
            min={0.1}
            max={0.4}
            step={0.01}
            unit="Pa·s"
            onChange={setViscosity}
          />
          {!terminal ? (
            <Range
              label={t('规定相对速度')}
              value={speed}
              min={-1}
              max={1}
              step={0.01}
              unit="mm/s"
              onChange={setSpeed}
            />
          ) : (
            <Range
              label={t('球密度')}
              value={density}
              min={800}
              max={3000}
              step={100}
              unit="kg/m³"
              onChange={setDensity}
            />
          )}
          <Range
            label={t('稳态流动时间')}
            value={phase}
            min={0}
            max={4}
            step={0.01}
            unit="s"
            onChange={setPhase}
          />
          <button type="button" aria-pressed={terminal} onClick={() => setTerminal(!terminal)}>
            {t(terminal ? '改为规定速度' : '求终端沉降状态')}
          </button>
        </div>
      )}
    </section>
  );
}
