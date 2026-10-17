import { useId, useState } from 'react';
import { t } from '../../i18n';
import { gasProcess, compressionShot, type GasProcess } from '../../models/adiabatic-compression';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/adiabatic-compression.css';
export default function AdiabaticCompression() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [ratio, setRatio] = useState(0.5),
    [gamma, setGamma] = useState(1.4),
    [process, setProcess] = useState<GasProcess>('adiabatic'),
    [plot, setPlot] = useState(false);
  const shot = film.watch
      ? compressionShot(film.chapter, film.chapterProgress)
      : {
          ratio,
          gamma,
          process,
          temperature0: 300,
          pressure0: 1e5,
          volume0: 0.001,
          focus:
            process === 'free' ? ('free' as const) : plot ? ('plot' as const) : ('piston' as const),
        },
    s = gasProcess(shot),
    W = phone ? 340 : 760,
    H = phone ? 260 : 320,
    plotOnly = phone && shot.focus === 'plot',
    showPlot = shot.focus !== 'free' && (!phone || plotOnly),
    showPiston = shot.focus !== 'free' && !plotOnly,
    centre = phone ? 128 : 210,
    bottom = phone ? 225 : 280,
    scale = phone ? 1200 : 1550,
    gasTop = bottom - (s.volume / 0.01) * scale,
    half = 0.056419 * scale,
    chartLeft = phone ? 50 : 430,
    chartRight = W - 25,
    chartTop = phone ? 30 : 50,
    chartBottom = H - 35,
    x = (volume: number) => chartLeft + (volume / 0.0015) * (chartRight - chartLeft),
    y = (pressure: number) => chartBottom - (pressure / 500000) * (chartBottom - chartTop),
    curve = (mode: GasProcess) =>
      Array.from({ length: 181 }, (_, i) => {
        const v = 0.0002 + (0.0013 * i) / 180,
          p = gasProcess({ ...shot, ratio: v / shot.volume0, process: mode }).pressure;
        return `${x(v)},${y(p)}`;
      }).join(' '),
    shade = Array.from({ length: 101 }, (_, i) => {
      const v = s.volume0 + ((s.volume - s.volume0) * i) / 100,
        p = gasProcess({ ...shot, ratio: v / s.volume0 }).pressure;
      return `${x(v)},${y(p)}`;
    }).join(' '),
    tempMix = Math.max(0, Math.min(1, (s.temperature - 250) / 250)),
    gasColour = `rgb(${Math.round(142 + 70 * tempMix)},${Math.round(174 - 20 * tempMix)},${Math.round(173 - 60 * tempMix)})`;
  return (
    <section className="compression-study">
      <header>
        {t(
          shot.focus === 'free'
            ? '只比较初态与末态：向真空自由膨胀'
            : s.process === 'isothermal'
              ? s.heatIn > 0
                ? '保持同温，膨胀输出的功由热量补入'
                : '保持同温，压缩输入的功以热量流出'
              : '隔热并不等于内能不变',
        )}
      </header>
      <svg
        className="compression-machine"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('隔热活塞的真实容积、热边界、压强体积功图或自由膨胀的两个平衡端态')}
      >
        <defs>
          <pattern id={`${id}insulate`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 10L10 0" stroke="#9d947e" strokeWidth="1" />
          </pattern>
          <linearGradient id={`${id}piston`}>
            <stop stopColor="#818e8d" />
            <stop offset=".45" stopColor="#d6d7c3" />
            <stop offset="1" stopColor="#778b8c" />
          </linearGradient>
          <clipPath id={`${id}plot`}>
            <rect
              x={chartLeft}
              y={chartTop - 5}
              width={chartRight - chartLeft + 5}
              height={chartBottom - chartTop + 5}
            />
          </clipPath>
        </defs>
        {shot.focus === 'free' ? (
          <>
            <rect
              x={phone ? 35 : 160}
              y={phone ? 70 : 85}
              width={phone ? 270 : 440}
              height={phone ? 130 : 150}
              rx="10"
              fill="#e1e3d6"
              stroke="#9a9e8e"
              strokeWidth="12"
            />
            <rect
              x={phone ? 41 : 166}
              y={phone ? 76 : 91}
              width={s.ratio === 1 ? (phone ? 129 : 214) : phone ? 258 : 428}
              height={phone ? 118 : 138}
              rx="5"
              fill={gasColour}
            />
            {s.ratio === 1 && (
              <path
                d={`M${W / 2} ${phone ? 72 : 87}V${phone ? 198 : 233}`}
                stroke="#777f77"
                strokeWidth="7"
              />
            )}
            {s.ratio !== 1 && (
              <path
                d={`M${W / 2} ${phone ? 72 : 87}V${phone ? 198 : 233}`}
                stroke="#777f77"
                strokeDasharray="4 5"
                opacity=".35"
              />
            )}
          </>
        ) : (
          <>
            {showPiston && (
              <>
                <rect
                  x={centre - half - 13}
                  y="35"
                  width="13"
                  height={bottom - 29}
                  fill={s.process === 'adiabatic' ? `url(#${id}insulate)` : '#879f9a'}
                />
                <rect
                  x={centre + half}
                  y="35"
                  width="13"
                  height={bottom - 29}
                  fill={s.process === 'adiabatic' ? `url(#${id}insulate)` : '#879f9a'}
                />
                <rect
                  x={centre - half - 13}
                  y={bottom}
                  width={2 * half + 26}
                  height="12"
                  fill={s.process === 'adiabatic' ? `url(#${id}insulate)` : '#879f9a'}
                />
                <rect
                  x={centre - half}
                  y={gasTop}
                  width={2 * half}
                  height={bottom - gasTop}
                  fill={gasColour}
                />
                <path
                  d={`M${centre - half} 35V${bottom}H${centre + half}V35`}
                  fill="none"
                  stroke="#81958f"
                  strokeWidth="2"
                />
                <path
                  d={`M${centre} 25V${gasTop - 9}`}
                  stroke={`url(#${id}piston)`}
                  strokeWidth="12"
                />
                <rect x={centre - 40} y="10" width="80" height="20" rx="8" fill="#a4afa0" />
                <rect
                  x={centre - half - 1}
                  y={gasTop - 14}
                  width={2 * half + 2}
                  height="14"
                  rx="4"
                  fill={`url(#${id}piston)`}
                  stroke="#768b85"
                />
                {Math.abs(s.workOn) > 0.01 && (
                  <path
                    d={
                      s.workOn > 0
                        ? `M${centre + half + 30} ${bottom - 100}v45m-5 -7l5 7l5 -7`
                        : `M${centre + half + 30} ${bottom - 55}v-45m-5 7l5 -7l5 7`
                    }
                    stroke="#a57d47"
                    strokeWidth="2.5"
                    fill="none"
                  />
                )}
                {s.process === 'isothermal' && Math.abs(s.heatIn) > 0.01 && (
                  <g fill="none" stroke="#69999b" strokeWidth="2.5">
                    <path
                      d={
                        s.heatIn > 0
                          ? `M${centre - half - 38} ${bottom - 30}H${centre - half}m-7 -5l7 5l-7 5`
                          : `M${centre - half} ${bottom - 30}H${centre - half - 38}m7 -5l-7 5l7 5`
                      }
                    />
                    <path d={`M${centre - half - 43} ${bottom - 57}v55m-7 -48v40`} opacity=".6" />
                  </g>
                )}
              </>
            )}
            {showPlot && (
              <>
                {!phone && (
                  <text x={chartLeft} y={chartTop - 20} fontSize="19" fill="#5a6e60">
                    {t('p：kPa · V：L')}
                  </text>
                )}
                <path
                  d={`M${chartLeft} ${chartTop}V${chartBottom}H${chartRight}`}
                  stroke="#8e9a8b"
                  fill="none"
                />
                <g clipPath={`url(#${id}plot)`}>
                  <polyline
                    points={curve('isothermal')}
                    stroke="#7ca1a4"
                    strokeDasharray="5 5"
                    strokeWidth="2"
                    fill="none"
                  />
                  <polyline
                    points={curve('adiabatic')}
                    stroke="#b48b54"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <polygon
                    points={`${x(s.volume0)},${chartBottom} ${shade} ${x(s.volume)},${chartBottom}`}
                    fill={s.process === 'isothermal' ? '#7ca1a4' : '#b48b54'}
                    opacity=".2"
                  />
                  <circle
                    cx={x(s.volume)}
                    cy={y(s.pressure)}
                    r="5"
                    fill={s.process === 'isothermal' ? '#7ca1a4' : '#b48b54'}
                  />
                </g>
                {[0.0005, 0.001, 0.0015].map((v) => (
                  <text
                    key={v}
                    x={x(v)}
                    y={H - 5}
                    fontSize={phone ? 26 : 19}
                    textAnchor="middle"
                    fill="#5a6e60"
                  >
                    {(v * 1000).toFixed(1)}
                  </text>
                ))}
                {[100000, 300000, 500000].map((p) => (
                  <text
                    key={p}
                    x={chartLeft - 8}
                    y={y(p) + 7}
                    fontSize={phone ? 26 : 19}
                    textAnchor="end"
                    fill="#5a6e60"
                  >
                    {p / 1000}
                  </text>
                ))}
              </>
            )}
          </>
        )}
      </svg>
      <div className="compression-legend">
        <span>
          {t(
            shot.focus === 'free'
              ? s.ratio === 1
                ? '初态：另一腔为真空'
                : '末态：气体占据两腔'
              : plotOnly
                ? 'p：kPa · V：L'
                : s.process === 'isothermal'
                  ? '导热壁连接恒温热库'
                  : '绝热壁，Q = 0',
          )}
        </span>
        <span>γ {s.gamma.toFixed(2)}</span>
      </div>
      <div className="compression-state">
        <b>{s.temperature.toFixed(1)} K</b>
        <span>
          {(s.volume * 1000).toFixed(2)} L · {(s.pressure / 1000).toFixed(1)} kPa
        </span>
      </div>
      <div className="compression-ledger">
        <div>
          <span>{t('功输入')}</span>
          <b>{s.workOn.toFixed(1)} J</b>
        </div>
        <div>
          <span>{t('热输入')}</span>
          <b>{s.heatIn.toFixed(1)} J</b>
        </div>
        <div>
          <span>ΔU</span>
          <b>{s.deltaU.toFixed(1)} J</b>
        </div>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('准静态过程与自由膨胀边界')}</summary>
          <p>
            {t(
              '活塞无摩擦，气体理想、热容恒定、过程准静态；绝热取Q=0，等温由恒温热库移走压缩功。输入功为正，第一定律ΔU=Q输入+W输入。pV曲线下面积为功的大小，1kPa·L=1J。向真空自由膨胀只给两个平衡端态，不给非平衡中途指派统一温度或压强；它不可套用pV的γ次方不变。填色表示温度状态，不是可见发光。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="compression-controls">
          {process !== 'free' && (
            <Range
              label={t('终态与初态体积比')}
              value={ratio}
              min={0.4}
              max={1.5}
              step={0.01}
              onChange={setRatio}
            />
          )}{' '}
          {process !== 'free' && (
            <Range
              label={t('恒定热容比')}
              value={gamma}
              min={1.2}
              max={1.67}
              step={0.01}
              onChange={setGamma}
            />
          )}{' '}
          {process === 'free' && (
            <button type="button" onClick={() => setRatio(ratio === 2 ? 1 : 2)}>
              {t(ratio === 2 ? '看自由膨胀初态' : '看自由膨胀末态')}
            </button>
          )}{' '}
          <div className="compression-modes">
            {(['adiabatic', 'isothermal', 'free'] as const).map((p) => (
              <button
                type="button"
                key={p}
                aria-pressed={process === p}
                onClick={() => {
                  setProcess(p);
                  setRatio(p === 'free' ? 2 : 0.5);
                }}
              >
                {t(
                  p === 'adiabatic' ? '绝热活塞' : p === 'isothermal' ? '等温活塞' : '真空自由膨胀',
                )}
              </button>
            ))}
          </div>
          {process !== 'free' && (
            <button type="button" aria-pressed={plot} onClick={() => setPlot(!plot)}>
              {t(plot ? '看活塞剖面' : '看功的pV面积')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
