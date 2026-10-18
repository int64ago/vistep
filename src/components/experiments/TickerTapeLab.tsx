import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import { Range, Segments } from '../lab/Controls';
import {
  tapeDots,
  tapeMotion,
  tapeInterval,
  tapeAcceleration,
  tapeShot,
  tapeLimit,
  type TapePath,
} from '../../models/ticker-tape-lab';
import '../../styles/ticker-tape-lab.css';
export default function TickerTapeLab() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [path, setPath] = useState<TapePath>(() =>
      film.variant?.includes('free-fall-tape')
        ? 'fall'
        : film.variant?.includes('cart-velocity')
          ? 'cart'
          : film.variant?.includes('tape-speed')
            ? 'velocity'
            : 'timer',
    ),
    [time, setTime] = useState(0.7),
    [span, setSpan] = useState(0.2),
    [acceleration, setAcceleration] = useState(0.6),
    [instrument, setInstrument] = useState('magnetic');
  const shot = tapeShot(film.chapter, film.chapterProgress),
    mode = film.watch ? shot.mode : path,
    limit = tapeLimit(mode),
    now = film.watch ? shot.time : Math.min(time, limit),
    a = film.watch ? 0.6 : acceleration;
  const motion = tapeMotion(mode, now, a),
    dots = tapeDots(mode, now, 50, a),
    all = tapeDots(mode, limit, 50, a),
    max = tapeMotion(mode, limit, a).x;
  const begin = mode === 'fall' ? 0.1 : film.watch ? shot.start : 0.2,
    end = mode === 'fall' ? 0.4 : film.watch ? shot.end : Math.min(0.98, 0.2 + span),
    measure = tapeInterval(mode, begin, end, a),
    W = phone ? 320 : 620,
    px = (x: number) => 24 + (x / max) * (W - 48),
    showMeasure = mode !== 'timer';
  const title =
    mode === 'timer'
      ? '先让时间留下等间隔的点'
      : mode === 'velocity'
        ? '选一段纸带，读出这一段的平均速度'
        : mode === 'cart'
          ? '把纸带速度逐点放回时间轴'
          : '同样的计时器，换成竖直下落的重物';
  const fitted = mode === 'cart' || mode === 'fall';
  return (
    <section className="tape-lab">
      <header>
        <p>{t(title)}</p>
        <span>
          {t('每相邻两点')} <b>0.02 s</b>
        </span>
      </header>
      <svg
        className="tape-apparatus"
        viewBox={mode === 'fall' ? '0 0 320 210' : mode === 'cart' ? '0 0 620 270' : '0 0 620 210'}
        role="img"
        aria-label={t('计时器固定，纸带跟随小车或下落重物移动，按真实采样时刻留下点')}
      >
        <defs>
          <linearGradient id={`${id}metal`}>
            <stop stopColor="#819b93" />
            <stop offset=".4" stopColor="#dce4d6" />
            <stop offset="1" stopColor="#9db3a6" />
          </linearGradient>
        </defs>
        {mode === 'fall' ? (
          <>
            <path
              d="M96 190H230M115 188V24H177"
              stroke="#9aaba0"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <rect
              x="160"
              y="27"
              width="14"
              height={45 + (motion.x / 1.225) * 90}
              fill="#ece5d0"
              stroke="#d2cbb7"
            />
            {dots.map((d) => (
              <circle
                key={d.index}
                cx="167"
                cy={47 + ((motion.x - d.x) / 1.225) * 90}
                r="1.2"
                fill="#667f72"
              />
            ))}
            <rect x="140" y="30" width="53" height="27" rx="7" fill={`url(#${id}metal)`} />
            <path d="M140 43H193" stroke="#697f73" />
            <g transform={`translate(167 ${82 + (motion.x / 1.225) * 90})`}>
              <path d="M-5 -8V-18H5V-8" stroke="#657d72" fill="none" strokeWidth="2" />
              <rect x="-18" y="-9" width="36" height="27" rx="5" fill="#738b80" />
              <path d="M-13 -4H13" stroke="#c2cfc0" />
            </g>
          </>
        ) : (
          <>
            <path d="M32 167H588" stroke="#a7b9aa" strokeWidth="6" strokeLinecap="round" />
            <rect
              x="72"
              y="132"
              width={180 + (motion.x / max) * (mode === 'cart' ? 70 : 230)}
              height="12"
              fill="#eee7d3"
              stroke="#d5cdb8"
            />
            {dots.map((d) => (
              <circle
                key={d.index}
                cx={82 + ((motion.x - d.x) / max) * (mode === 'cart' ? 70 : 230)}
                cy="138"
                r="1.6"
                fill="#687f70"
              />
            ))}
            <rect x="53" y="96" width="68" height="43" rx="10" fill={`url(#${id}metal)`} />
            {instrument === 'spark' && !film.watch ? (
              <>
                <rect x="66" y="104" width="40" height="18" rx="4" fill="#c9d3c4" />
                <path
                  d="M73 111H84V132M99 111H91V144"
                  fill="none"
                  stroke="#6f8575"
                  strokeWidth="2"
                />
                <path d="M84 133l5 3-5 4" fill="none" stroke="#c7a566" strokeWidth="1.5" />
              </>
            ) : (
              <>
                <rect x="67" y="106" width="39" height="17" rx="5" fill="#bd9771" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <path key={i} d={`M${70 + i * 6} 107v15`} stroke="#8e6f50" strokeWidth="2" />
                ))}
                <path
                  d={`M85 103V${135 + Math.cos(now * 50 * Math.PI * 2) * 2}`}
                  stroke="#5f746b"
                  strokeWidth="2"
                />
              </>
            )}
            <g
              transform={`translate(${248 + (motion.x / max) * (mode === 'cart' ? 70 : 230)} 141)`}
            >
              <rect x="-20" y="-18" width="48" height="25" rx="7" fill="#8fa58c" />
              <circle cx="-8" cy="15" r="8" fill="#698173" />
              <circle cx="18" cy="15" r="8" fill="#698173" />
              <path d="M-12 -18v-9h33v9" fill="none" stroke="#a5b695" strokeWidth="3" />
            </g>
            {mode === 'cart' && (
              <>
                <path
                  d={`M${276 + (motion.x / max) * 70} 135H567Q580 135 580 148V${180 + (motion.x / max) * 70}`}
                  fill="none"
                  stroke="#9d967e"
                  strokeWidth="1.4"
                />
                <circle cx="568" cy="147" r="11" fill="none" stroke="#94a78f" strokeWidth="3" />
                <rect
                  x="573"
                  y={180 + (motion.x / max) * 70}
                  width="15"
                  height="20"
                  rx="3"
                  fill="#8e9e84"
                />
              </>
            )}
          </>
        )}
      </svg>
      <div className="tape-record">
        <div>
          <span>{t('取下的纸带 · 按时间排列')}</span>
          <span>{now.toFixed(2)} s</span>
        </div>
        <svg
          viewBox={`0 0 ${W} 94`}
          role="img"
          aria-label={t('按实际位移绘制的纸带点迹与所选时间区间')}
        >
          <rect x="12" y="24" width={W - 24} height="31" rx="3" fill="#eee7d5" />
          <path d={`M12 52H${W - 12}`} stroke="#d9d0ba" />
          {all.map((d) => (
            <circle
              key={d.index}
              cx={px(d.x)}
              cy="39"
              r={d.index % 5 === 0 ? 2.5 : 1.1}
              fill="#648072"
              opacity={d.t <= now ? 1 : 0}
            />
          ))}
          {showMeasure && now >= end && (
            <>
              <path
                d={`M${px(measure.start.x)} 20V65M${px(measure.end.x)} 20V65M${px(measure.start.x)} 66H${px(measure.end.x)}`}
                stroke="#b58c51"
                fill="none"
                strokeWidth="1.4"
              />
              <circle cx={px(measure.start.x)} cy="39" r="4" fill="#b58c51" />
              <circle cx={px(measure.end.x)} cy="39" r="4" fill="#b58c51" />
            </>
          )}
        </svg>
      </div>
      {showMeasure && (
        <div className="tape-measure">
          <span>
            Δx <b>{now >= end ? (measure.dx * 100).toFixed(2) : '—'} cm</b>
          </span>
          <span>
            Δt <b>{now >= end ? measure.dt.toFixed(2) : '—'} s</b>
          </span>
          <span>
            {t('平均速度')} <b>{now >= end ? measure.average.toFixed(3) : '—'} m/s</b>
          </span>
        </div>
      )}
      {fitted && (
        <div className="tape-fit">
          <svg
            viewBox="0 0 320 112"
            role="img"
            aria-label={t('由相邻采样间隔测得的速度与时间图像')}
          >
            <path d="M30 9V89H299" stroke="#c0cdb9" fill="none" />
            <path
              d={Array.from({ length: 9 }, (_, i) => {
                const q = ((i + 1) * limit) / 10,
                  v = tapeInterval(mode, q - limit / 20, q + limit / 20, a).average;
                return q + limit / 20 > now
                  ? ''
                  : `${i ? 'L' : 'M'}${30 + (q / limit) * 265} ${88 - (v / tapeMotion(mode, limit, a).v) * 72}`;
              }).join(' ')}
              stroke="#829d7a"
              fill="none"
              strokeWidth="2"
            />
            {Array.from({ length: 9 }, (_, i) => {
              const q = ((i + 1) * limit) / 10,
                v = tapeInterval(mode, q - limit / 20, q + limit / 20, a).average;
              return q + limit / 20 > now ? null : (
                <circle
                  key={i}
                  cx={30 + (q / limit) * 265}
                  cy={88 - (v / tapeMotion(mode, limit, a).v) * 72}
                  r="3.5"
                  fill="#829d7a"
                />
              );
            })}
          </svg>
          <p>
            {t('由点迹估计的加速度')}{' '}
            <b>
              {now >= limit * 0.6
                ? tapeAcceleration(mode, limit / 2, limit / 10, a).toFixed(2)
                : '—'}{' '}
              m/s²
            </b>
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="tape-controls">
          <Segments
            label={t('实验路径')}
            value={path}
            onChange={setPath}
            options={[
              { value: 'timer', label: t('使用计时器') },
              { value: 'velocity', label: t('测量速度') },
              { value: 'cart', label: t('小车加速') },
              { value: 'fall', label: t('自由落体') },
            ]}
          />
          <Range
            label={t('记录到的时刻')}
            value={Math.min(time, limit)}
            min={0}
            max={limit}
            step={0.02}
            unit="s"
            onChange={setTime}
          />
          {mode === 'velocity' && (
            <Range
              label={t('测速时间间隔')}
              value={span}
              min={0.02}
              max={0.7}
              step={0.02}
              unit="s"
              onChange={setSpan}
            />
          )}{' '}
          {mode === 'cart' && (
            <Range
              label={t('小车加速度')}
              value={acceleration}
              min={0.2}
              max={1.2}
              step={0.1}
              unit="m/s²"
              onChange={setAcceleration}
            />
          )}{' '}
          {mode === 'timer' && (
            <Segments
              label={t('计时器形式')}
              value={instrument}
              onChange={setInstrument}
              options={[
                { value: 'magnetic', label: t('电磁打点') },
                { value: 'spark', label: t('电火花打点') },
              ]}
            />
          )}
        </div>
      )}
      <p className="tape-condition">
        {t('点是计时记录，不是物体每一瞬间的位置。图示慢放；读数使用真实秒数。')}
      </p>
    </section>
  );
}
