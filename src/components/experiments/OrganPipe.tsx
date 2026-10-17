import { useId, useState } from 'react';
import { t } from '../../i18n';
import { organPipe, organField, organNodes, organShot } from '../../models/organ-pipe';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/organ-pipe.css';
export default function OrganPipe() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [length, setLength] = useState(0.6),
    [radius, setRadius] = useState(0.025),
    [stopped, setStopped] = useState(false),
    [mode, setMode] = useState(1),
    [end, setEnd] = useState(false),
    [phase, setPhase] = useState(0),
    [close, setClose] = useState(false);
  const shot = film.watch
      ? organShot(film.chapter, film.chapterProgress, film.chapterTime)
      : { length, radius, stopped, mode, endFactor: end ? 0.61 : 0, phase, close, arrows: true },
    s = organPipe(shot),
    W = phone ? 340 : 760,
    H = phone ? 270 : 370,
    low = shot.close ? -0.04 : -0.1,
    high = shot.close ? 0.08 : 0.95,
    y = (v: number) => H - 22 - ((v - low) / (high - low)) * (H - 44),
    cx = phone ? 110 : 270,
    half = ((phone ? 35 : 48) * s.radius) / 0.025,
    px = phone ? 235 : 500,
    amp = phone ? 40 : 65,
    trace = Array.from({ length: 241 }, (_, i) => {
      const x = -s.e + (s.effectiveLength * i) / 240;
      return `${px + organField(x, shot.phase, shot).pressure * amp},${y(x)}`;
    }).join(' '),
    nodes = organNodes(shot),
    visible = (v: number) => v >= low && v <= high;
  return (
    <section className="organ-study" data-watch={film.watch}>
      <header>
        <span>
          {t(shot.close ? '开放端的压力节点略在管口之外' : '同一根管，边界决定允许的波长')}
        </span>
        <b>{t(s.stopped ? '顶端塞闭' : '两端开放')}</b>
      </header>
      <svg
        className="organ-column"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('风琴管等效声柱剖面，真实纵向粒子位移与相同状态的压力曲线')}
      >
        <defs>
          <linearGradient id={`${id}metal`}>
            <stop stopColor="#819b91" />
            <stop offset=".5" stopColor="#d0d5b9" />
            <stop offset="1" stopColor="#7f998e" />
          </linearGradient>
          <clipPath id={`${id}crop`}>
            <rect x="20" y="15" width={W - 40} height={H - 30} rx="10" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}crop)`}>
          <rect x={cx - half} y={y(s.L)} width={2 * half} height={y(0) - y(s.L)} fill="#152c32" />
          {Array.from({ length: 60 }, (_, i) => {
            const x = (s.L * i) / 60,
              p = organField(x, shot.phase, shot).pressure;
            return (
              <rect
                key={i}
                x={cx - half + 3}
                y={y(x + s.L / 60)}
                width={2 * half - 6}
                height={((H - 44) * s.L) / 60 / (high - low) + 0.3}
                fill={p >= 0 ? '#86b7cb' : '#d6a26d'}
                opacity={Math.abs(p) * 0.42}
              />
            );
          })}
          <path
            d={`M${cx - half} ${y(0)}V${y(s.L)}M${cx + half} ${y(0)}V${y(s.L)}`}
            stroke={`url(#${id}metal)`}
            strokeWidth="6"
          />
          {s.stopped && (
            <rect
              x={cx - half - 5}
              y={y(s.L) - 5}
              width={2 * half + 10}
              height="10"
              rx="5"
              fill="#b2bfa6"
            />
          )}
          {[0, s.L].map((rim, i) => (
            <path
              key={i}
              d={`M${cx - half - 6} ${y(rim)}h12M${cx + half - 6} ${y(rim)}h12`}
              stroke="#c2cdb3"
              strokeWidth="4"
            />
          ))}
          {Array.from({ length: 25 }, (_, j) => {
            const mean = (s.L * j) / 24,
              p = organField(mean, shot.phase, shot),
              position = mean + p.displacement * 20000;
            return [-0.55, 0, 0.55].map((q, k) => (
              <circle
                key={`${j}-${k}`}
                cx={cx + q * half}
                cy={y(position)}
                r={phone ? 2.5 : 3}
                fill="#e3e6cd"
              />
            ));
          })}
          <path
            d={`M${px} ${y(-s.e)}V${y(s.L + s.topExtension)}`}
            stroke="#8ba59b"
            strokeDasharray="3 4"
          />
          <polyline points={trace} fill="none" stroke="#a3cbd4" strokeWidth="2.5" />
          {nodes.filter(visible).map((n, i) => (
            <g key={i}>
              <circle cx={px} cy={y(n)} r="5" fill="#1d3438" stroke="#a3cbd4" strokeWidth="2" />
              {shot.close && (
                <path
                  d={`M${cx - half - 8} ${y(n)}H${px + amp}`}
                  stroke="#a3cbd4"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          ))}
          {shot.arrows &&
            [0, 0.25, 0.5, 0.75, 1].map((q, i) => {
              const pos = q * s.L,
                v = organField(pos, shot.phase, shot).velocity * s.Z,
                dy = -v * 20;
              return (
                <g key={i}>
                  <path d={`M${cx + half + 14} ${y(pos)}v${dy}`} stroke="#e2c58e" strokeWidth="2" />
                  {Math.abs(dy) > 2 && (
                    <path
                      d={`M-3 ${dy > 0 ? -5 : 5}L0 0L3 ${dy > 0 ? -5 : 5}`}
                      transform={`translate(${cx + half + 14} ${y(pos) + dy})`}
                      stroke="#e2c58e"
                      strokeWidth="2"
                      fill="none"
                    />
                  )}
                </g>
              );
            })}
        </g>
      </svg>
      <div className="organ-legend">
        <span>
          <i style={{ background: '#e3e6cd' }} />
          {t('粒子位移放大')}
        </span>
        <span>
          <i style={{ background: '#a3cbd4' }} />
          {t('压力剖面与节点')}
        </span>
      </div>
      <div className="organ-frequency">
        <b>{s.frequency.toFixed(1)} Hz</b>
        <span>
          L {s.L.toFixed(2)} m · {t('有效长')} {s.effectiveLength.toFixed(3)} m
        </span>
      </div>
      <div className="organ-harmonics" aria-label={t('允许的理想谐波，条高不表示音量')}>
        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
          <span
            key={n}
            className={`${s.stopped && n % 2 === 0 ? 'is-absent' : ''} ${n === s.harmonic ? 'is-current' : ''}`}
          >
            <i />
            {n}×
          </span>
        ))}
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('声柱、开放端与慢放')}</summary>
          <p>
            {t(
              '理想等截面圆柱声柱，以管口附近的等效开放边界为下端，不包含风口气流的自激过程。压力节点与位移节点不同；粒子纵向位移放大20000倍，相位慢放，频率读数保持物理值。可选开放端修正每端0.61倍半径，仅为低频无凸缘近似，不预测真实风琴音色、辐射损耗与高阶横向模态。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="organ-controls">
          <Range
            label={t('声柱几何长度')}
            value={length}
            min={0.4}
            max={0.8}
            step={0.01}
            unit="m"
            onChange={setLength}
          />
          <Range
            label={t('管半径')}
            value={radius}
            min={0.01}
            max={0.03}
            step={0.001}
            unit="m"
            onChange={setRadius}
          />
          <Range label={t('允许模态序号')} value={mode} min={1} max={3} onChange={setMode} />
          <Range
            label={t('周期相位')}
            value={phase / (2 * Math.PI)}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setPhase(v * 2 * Math.PI)}
          />
          <button type="button" aria-pressed={stopped} onClick={() => setStopped(!stopped)}>
            {t(stopped ? '开放顶端' : '塞闭顶端')}
          </button>
          <button type="button" aria-pressed={end} onClick={() => setEnd(!end)}>
            {t(end ? '使用理想端点' : '加入开放端修正')}
          </button>
          <button type="button" aria-pressed={close} onClick={() => setClose(!close)}>
            {t(close ? '看完整声柱' : '看下端局部')}
          </button>
        </div>
      )}
    </section>
  );
}
