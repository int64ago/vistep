import { useState } from 'react';
import { t } from '../../i18n';
import {
  cornerTrace,
  cornerShot,
  cornerProjection,
  cornerAim,
  cornerPulse,
  type CornerVector,
} from '../../models/retroreflector';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/retroreflector.css';
const O: CornerVector = [0, 0, 0],
  X: CornerVector = [1, 0, 0],
  Y: CornerVector = [0, 1, 0],
  Z: CornerVector = [0, 0, 1];
export default function Retroreflector() {
  const film = useShowcase(),
    phone = useCompact();
  const [aim, setAim] = useState(0),
    [entry, setEntry] = useState(0.15);
  const options = film.watch
    ? cornerShot(film.chapter, film.chapterProgress)
    : {
        entry: [entry, 0.45, 0.55 - entry] as CornerVector,
        direction: cornerAim(aim),
        mirrors: [true, true, true] as [boolean, boolean, boolean],
      };
  const s = cornerTrace(options.entry, options.direction, options.mirrors),
    W = phone ? 340 : 760,
    H = phone ? 240 : 340,
    scale = phone ? 120 : 160,
    xy = (p: CornerVector) => {
      const q = cornerProjection(p);
      return `${W * 0.68 + q.x * scale},${H * 0.54 - q.y * scale}`;
    };
  const bounceEvents = s.events.filter((e) => e.kind === 'mirror');
  return (
    <section className={`retro-study ${film.watch ? 'is-watching' : ''}`}>
      <header>
        <span>{t('三个方向，逐一反转')}</span>
        <b>
          {s.reflections} {t('次反射')}
        </b>
      </header>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('三面有限直角镜中的实际入射与返回光路')}
      >
        {[
          [O, Y, Z],
          [O, Z, X],
          [O, X, Y],
        ].map((face, i) => (
          <polygon
            key={i}
            points={face.map(xy).join(' ')}
            fill={options.mirrors[i] ? ['#456e70', '#557d76', '#6a8a79'][i] : '#c3c9bc0a'}
            stroke="#d6dfcd"
            strokeOpacity=".6"
            strokeWidth="1.3"
          />
        ))}
        <polygon
          points={[X, Y, Z].map(xy).join(' ')}
          fill="none"
          stroke="#e0d9b6"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {s.points.slice(0, -1).map((p, i) => {
          const a = xy(p).split(',').map(Number),
            b = xy(s.points[i + 1])
              .split(',')
              .map(Number),
            angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
            cx = a[0] + 0.62 * (b[0] - a[0]),
            cy = a[1] + 0.62 * (b[1] - a[1]),
            color = i === 0 ? '#ffbe6d' : i === s.points.length - 2 ? '#77e0ef' : '#fff2c4';
          return (
            <g key={i}>
              <path
                d={`M${a}L${b}`}
                stroke={color}
                strokeWidth={i === 0 || i === s.points.length - 2 ? 3 : 2}
                fill="none"
              />
              {(i === 0 || i === s.points.length - 2) && (
                <path
                  d="M-7 -4L0 0L-7 4"
                  transform={`translate(${cx} ${cy}) rotate(${(angle * 180) / Math.PI})`}
                  stroke={color}
                  strokeWidth="2"
                  fill="none"
                />
              )}
            </g>
          );
        })}
        {bounceEvents.map((e, i) => (
          <g key={i}>
            <path
              d={`M${xy(e.point)}L${W - 42} ${H * 0.3 + i * 36 - 7}`}
              stroke="#91aaa0"
              strokeWidth="1"
              strokeDasharray="2 4"
              fill="none"
            />
            <circle
              cx={Number(xy(e.point).split(',')[0])}
              cy={Number(xy(e.point).split(',')[1])}
              r="5"
              fill="#efdfaa"
              stroke="#466a66"
            />
            <text
              x={W - 32}
              y={H * 0.3 + i * 36}
              fill="#fff4cc"
              stroke="#284b4d"
              strokeWidth="3"
              paintOrder="stroke"
              fontSize={phone ? 26 : 18}
            >
              {i + 1}
            </text>
          </g>
        ))}
        <circle
          cx={Number(xy(cornerPulse(s.points, (film.chapterTime / 6) % 1)).split(',')[0])}
          cy={Number(xy(cornerPulse(s.points, (film.chapterTime / 6) % 1)).split(',')[1])}
          r="5"
          fill="#fff4cc"
          stroke="#315653"
        />
        <circle
          cx={Number(xy(s.entry).split(',')[0])}
          cy={Number(xy(s.entry).split(',')[1])}
          r="4"
          fill="#dfb775"
        />
        <circle
          cx={Number(xy(s.exit).split(',')[0])}
          cy={Number(xy(s.exit).split(',')[1])}
          r="4"
          fill="#a9d1d7"
        />
      </svg>
      <div className="retro-sequence">
        {s.events
          .filter((e) => e.kind === 'mirror')
          .map((e, i) => (
            <span key={i}>
              {i + 1} · {e.axes.map((j) => ['x', 'y', 'z'][j]).join('+')}
            </span>
          ))}
      </div>
      <div className="retro-readings">
        <span>
          {t('回归误差')}
          <b>{s.error.toFixed(2)}°</b>
        </span>
        <span>
          {t('光路间隔')}
          <b>{s.offset.toFixed(3)} L</b>
        </span>
      </div>
      <details>
        <summary>{t('有限镜面与投影说明')}</summary>
        <p>
          {t(
            '三片理想反射镜互相垂直，入口为x+y+z=L。仅当光实际依次遇到三面时，三个方向分量才全部反转。浅蓝返回光通常与入射光反向平行，不保证重走同一条直线。图为固定三维正交投影，不含玻璃折射或衍射。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="retro-controls">
          <Range label={t('绕z轴转向')} value={aim} min={-15} max={15} unit="°" onChange={setAim} />
          <Range
            label={t('入口x / L')}
            value={entry}
            min={0.15}
            max={0.5}
            step={0.01}
            onChange={setEntry}
          />
        </div>
      )}
    </section>
  );
}
