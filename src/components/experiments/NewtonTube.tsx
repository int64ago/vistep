import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  newtonPair,
  newtonFilmState,
  NEWTON_HEIGHT,
  NEWTON_AIR_DENSITY,
  NEWTON_FEATHER_PATH,
  NEWTON_FEATHER_SHAFT,
  NEWTON_FEATHER_BARBS,
} from '../../models/newton-tube';
import '../../styles/newton-tube.css';

function Specimen({
  kind,
  x,
  y,
  faded = false,
}: {
  kind: 'iron' | 'feather';
  x: number;
  y: number;
  faded?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={faded ? 0.55 : 1}>
      {kind === 'feather' ? (
        <>
          <path d={NEWTON_FEATHER_PATH} fill="#d8bd85" stroke="#a78c58" strokeWidth="0.8" />
          <path d={NEWTON_FEATHER_SHAFT} fill="none" stroke="#806d4e" strokeWidth="1.15" />
          {NEWTON_FEATHER_BARBS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#f6e7c6" strokeWidth="0.8" opacity=".85" />
          ))}
        </>
      ) : (
        <>
          <path d="M-7 -19H7V19H-7Z" fill="#607982" stroke="#425b64" strokeWidth=".8" />
          <path d="M-5 -17H5V17H-5Z" fill="#91a3a8" />
          <path d="M-4 -16V15M3 -14V16" stroke="#c4ced0" strokeWidth=".8" opacity=".7" />
        </>
      )}
    </g>
  );
}
function Tube({
  id,
  time,
  density,
  ghost,
  pumping,
  dormant,
}: {
  id: string;
  time: number;
  density: number;
  ghost: boolean;
  pumping: boolean;
  dormant: boolean;
}) {
  const pair = newtonPair(time, density),
    top = 66,
    travel = 219;
  const py = (distance: number) => top + (distance / NEWTON_HEIGHT) * travel;
  const densityRatio = density / NEWTON_AIR_DENSITY;
  return (
    <svg
      className="newton-apparatus"
      viewBox="0 0 160 348"
      role="img"
      aria-label={t('同一释放线下的铁片和羽毛，玻璃管下端为共同接触面')}
    >
      <defs>
        <linearGradient id={`${id}-glass`}>
          <stop stopColor="#d8e3de" stopOpacity=".65" />
          <stop offset=".18" stopColor="#fbfcf8" stopOpacity=".5" />
          <stop offset=".55" stopColor="#e5eae1" stopOpacity=".06" />
          <stop offset=".87" stopColor="#c5d6d0" stopOpacity=".22" />
          <stop offset="1" stopColor="#a4bfb5" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" x2="1" y1="0" y2=".25">
          <stop stopColor="#778e87" />
          <stop offset=".27" stopColor="#e0e5d9" />
          <stop offset=".52" stopColor="#bac8bd" />
          <stop offset="1" stopColor="#82988d" />
        </linearGradient>
        <radialGradient id={`${id}-air`}>
          <stop stopColor="#dcc9a5" stopOpacity=".3" />
          <stop offset="1" stopColor="#dcc9a5" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-.5" y="-1" width="2" height="3">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <ellipse
        cx="80"
        cy="331"
        rx="58"
        ry="5"
        fill="#5f7463"
        opacity=".1"
        filter={`url(#${id}-shadow)`}
      />
      <path
        d="M31 29Q80 19 129 29V306Q80 318 31 306Z"
        fill={`url(#${id}-glass)`}
        stroke="#9eb7ac"
        strokeWidth="1.2"
      />
      <path d="M38 43V295" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      <path d="M123 43V295" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".8" />
      <ellipse cx="80" cy="171" rx="42" ry="130" fill={`url(#${id}-air)`} opacity={densityRatio} />
      {Array.from({ length: 28 }, (_, i) => {
        const x = 41 + ((i * 37) % 79),
          y = 48 + ((i * 53) % 244);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 1.4 : 0.85}
            fill="#aa9a79"
            opacity={densityRatio * 0.35}
          />
        );
      })}
      <path
        d={`M35 ${top + 19}H125`}
        stroke="#a9b8ad"
        strokeWidth="1"
        strokeDasharray="3 4"
        opacity=".8"
      />
      <path d={`M36 ${top + travel + 19}H124`} stroke="#82978b" strokeWidth="1.5" />
      <path
        d={`M54 ${top}V${py(pair.iron.distance)}M103 ${top}V${py(pair.feather.distance)}`}
        stroke="#b1bcb1"
        strokeWidth="1"
        strokeDasharray="2 5"
        opacity=".7"
      />
      {ghost &&
        [0.12, 0.24, 0.36, 0.48]
          .filter((q) => q < time)
          .map((q) => {
            const s = newtonPair(q, density);
            return (
              <g key={q}>
                <circle cx="54" cy={py(s.iron.distance)} r="3" fill="#607982" opacity=".5" />
                <circle cx="103" cy={py(s.feather.distance)} r="3" fill="#bd9c61" opacity=".6" />
              </g>
            );
          })}
      {ghost && (
        <path
          d={`M47 ${py(pair.iron.distance)}H112`}
          stroke="#718c7b"
          strokeDasharray="3 3"
          opacity=".4"
        />
      )}
      <Specimen kind="iron" x={54} y={py(pair.iron.distance)} faded={dormant} />
      <Specimen kind="feather" x={103} y={py(pair.feather.distance)} faded={dormant} />
      <path d="M28 26Q80 18 132 26V40Q80 47 28 40Z" fill={`url(#${id}-metal)`} stroke="#91a69a" />
      <ellipse cx="80" cy="26" rx="52" ry="7" fill="#dce3d9" stroke="#a8b8aa" />
      <path
        d="M31 304Q80 312 129 304V319Q80 330 31 319Z"
        fill={`url(#${id}-metal)`}
        stroke="#93a79a"
      />
      <path d="M36 310Q80 318 124 310" fill="none" stroke="#eef1e8" opacity=".8" />
      <path d="M80 19V9H143" fill="none" stroke="#8a9f92" strokeWidth="5" strokeLinejoin="round" />
      <path d="M80 18V9H143" fill="none" stroke="#d4ddd2" strokeWidth="2" />
      <path
        d="M109 4V14"
        stroke="#597969"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform={pumping ? 'rotate(90 109 9)' : undefined}
      />
      <circle cx="109" cy="9" r="3" fill="#6f8979" />
      {pumping && <path d="M133 4l6 5-6 5" fill="none" stroke="#718c7b" strokeWidth="1.4" />}
      {pair.iron.landed && !dormant && (
        <ellipse cx="54" cy="305" rx="12" ry="2" fill="#607982" opacity=".14" />
      )}
      {pair.feather.landed && !dormant && (
        <ellipse cx="103" cy="305" rx="15" ry="2" fill="#bd9c61" opacity=".15" />
      )}
    </svg>
  );
}
export default function NewtonTube() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [air, setAir] = useState('vacuum'),
    [density, setDensity] = useState(0),
    [time, setTime] = useState(0.38);
  const c = film.watch ? film.chapter : 4;
  const shot = film.watch
    ? newtonFilmState(c, film.chapterTime, browserLocale())
    : { airTime: time, vacuumTime: time, density, pumping: false, comparison: true, ghost: true };
  const currentTime = c < 2 ? shot.airTime : shot.vacuumTime;
  const left = newtonPair(shot.airTime),
    right = newtonPair(shot.vacuumTime, shot.density);
  return (
    <section className="newton-film" data-chapter={c} data-watch={film.watch}>
      <div className="newton-intro">
        <p>
          {t(
            c === 0
              ? '同一支管，两次实验'
              : c === 1
                ? '先保留空气'
                : c === 2
                  ? '只改变管内的空气'
                  : c === 3
                    ? '再让两者同时下落'
                    : '相同的时刻，比较两次下落',
          )}
        </p>
        <span>
          {c === 0 ? (
            t('同高 · 静止释放')
          ) : c === 2 ? (
            t('重力和物体保持不变')
          ) : (
            <>
              {t('实验时间')} <b>{currentTime.toFixed(2)} s</b>
            </>
          )}
        </span>
      </div>
      <div className="newton-trials">
        <figure className="newton-trial">
          <figcaption>
            <i className="newton-air-dot" />
            {t('有空气')}
          </figcaption>
          <Tube
            id={`${id}-air`}
            time={shot.airTime}
            density={NEWTON_AIR_DENSITY}
            ghost={shot.ghost}
            pumping={false}
            dormant={false}
          />
          <div className="newton-observation">
            {t(
              shot.airTime === 0
                ? '从相同高度开始'
                : left.feather.landed
                  ? '铁片先到，羽毛后到'
                  : left.iron.distance - left.feather.distance < 0.02
                    ? '两者开始下落'
                    : !left.iron.landed
                      ? '铁片逐渐领先'
                      : '羽毛明显落后',
            )}
          </div>
        </figure>
        <figure className="newton-trial" data-dormant={film.watch && c < 2}>
          <figcaption>
            <i className="newton-vacuum-dot" />
            {t(
              film.watch && c < 2
                ? '抽气后的对照'
                : shot.density === 0
                  ? '理想真空'
                  : c === 2
                    ? '正在抽气'
                    : shot.density === NEWTON_AIR_DENSITY
                      ? '有空气'
                      : '减少空气',
            )}
          </figcaption>
          <Tube
            id={`${id}-vacuum`}
            time={shot.vacuumTime}
            density={shot.density}
            ghost={shot.ghost}
            pumping={shot.pumping}
            dormant={film.watch && c < 2}
          />
          <div className="newton-observation">
            {t(
              film.watch && c < 2
                ? '保持同一组物体'
                : c === 2
                  ? '空气减少，重力仍在'
                  : right.iron.landed && right.feather.landed && shot.density === 0
                    ? '同时到达'
                    : shot.density === 0
                      ? '始终保持齐平'
                      : '比较羽毛的下落',
            )}
          </div>
        </figure>
      </div>
      <div className="newton-legend">
        <span>
          <i className="newton-iron-swatch" />
          {t('铁片')}
        </span>
        <span>
          <i className="newton-feather-swatch" />
          {t('羽毛')}
        </span>
        <span className="newton-speed">
          {film.watch && c !== 0 && c !== 2 ? <>{t('慢放，读数为物理时间')}</> : t('示意尺寸')}
        </span>
      </div>
      {!film.watch && (
        <p className="newton-takeaway">
          {t('空气阻力可以改变下落；忽略阻力时，两者的重力加速度相同。')}
        </p>
      )}
      {!film.watch && (
        <div className="newton-controls">
          <Segments
            label={t('第二次实验的条件')}
            value={air}
            options={[
              { value: 'vacuum', label: t('理想真空') },
              { value: 'air', label: t('保留空气') },
              { value: 'custom', label: t('自己调整') },
            ]}
            onChange={(v) => {
              setAir(v);
              setDensity(v === 'air' ? NEWTON_AIR_DENSITY : v === 'vacuum' ? 0 : density);
            }}
          />
          {air === 'custom' && (
            <Range
              label={t('相对空气密度')}
              value={(density / NEWTON_AIR_DENSITY) * 100}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(v) => setDensity((v / 100) * NEWTON_AIR_DENSITY)}
            />
          )}
          <Range
            label={t('从释放开始的时间')}
            value={time}
            min={0}
            max={1.7}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <p>{t('两次实验共用这一时刻。把空气减到零，再逐帧比较两个物体的位置。')}</p>
        </div>
      )}
      <details className="newton-model">
        <summary>{t('这段演示作了哪些简化？')}</summary>
        <p>
          {t(
            '用同一片铁片和羽毛、同一释放高度与零初速度作对照。画面是管内运动的正视示意，画面为解释过程慢放，读数使用物理时间；抽气过程用空气密度淡出表示，不模拟泵。理想真空令阻力为零。空气中用固定迎风面积和阻力系数近似羽毛，忽略翻滚、浮力及管壁影响；参数用于解释现象，不能代替真实测量。',
          )}
        </p>
      </details>
    </section>
  );
}
