import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  collisionDefaults,
  elasticCollision,
  elasticCollisionShot,
} from '../../models/elastic-collision';
import '../../styles/elastic-collision.css';
export default function ElasticCollision() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [m1, setM1] = useState(1),
    [m2, setM2] = useState(1),
    [progress, setProgress] = useState(0),
    [frame, setFrame] = useState('lab'),
    c = film.watch ? film.chapter : -1,
    p = { ...collisionDefaults(), m1, m2 },
    bounds = elasticCollision(p, 0),
    shot = elasticCollisionShot(c, film.chapterProgress),
    s = film.watch ? shot.state : elasticCollision(p, progress * (bounds.releaseAt + 0.5)),
    centerFrame = film.watch ? shot.frame === 'center' : frame === 'center',
    shift = centerFrame ? s.center : 0,
    X = (x: number) => (centerFrame ? 170 : 125) + (x - shift) * 120,
    v1 = s.v1 - (centerFrame ? s.centerSpeed : 0),
    v2 = s.v2 - (centerFrame ? s.centerSpeed : 0),
    K = 0.5 * s.m1 * v1 * v1 + 0.5 * s.m2 * v2 * v2,
    E = K + s.springEnergy,
    contact =
      c === 1 || c === 2 || (!film.watch && (s.phase === 'compression' || s.phase === 'release')),
    len = s.bumperLength - s.compression / 2,
    leftTip = s.x1 + s.bodyHalf + len,
    rightTip = s.x2 - s.bodyHalf - len,
    coil = (x1: number, x2: number, y: number, amplitude: number) =>
      Array.from(
        { length: 13 },
        (_, i) =>
          `${x1 + ((x2 - x1) * i) / 12},${y + (i === 0 || i === 12 ? 0 : i % 2 ? -amplitude : amplitude)}`,
      ).join(' '),
    cart = (side: 1 | 2) => {
      const x = side === 1 ? s.x1 : s.x2,
        m = side === 1 ? s.m1 : s.m2,
        cx = X(x),
        color = side === 1 ? '#90ac9d' : '#c0a776',
        edge = X(x + (side === 1 ? 1 : -1) * s.bodyHalf),
        tip = X(side === 1 ? leftTip : rightTip),
        v = side === 1 ? v1 : v2;
      return (
        <g>
          <rect
            x={cx - s.bodyHalf * 120}
            y="72"
            width={s.bodyHalf * 240}
            height="28"
            rx="5"
            fill={color}
            stroke={side === 1 ? '#6c8e7b' : '#a68c5d'}
          />
          {Array.from({ length: Math.round(m) }, (_, i) => (
            <rect
              key={i}
              x={cx - 17}
              y={64 - i * 9}
              width="34"
              height="8"
              rx="2"
              fill={color}
              stroke="#f4f3e8"
              strokeWidth="1"
            />
          ))}
          {[-1, 1].map((a) => (
            <circle
              key={a}
              cx={cx + a * 15}
              cy="103"
              r="7"
              fill="#d4dccc"
              stroke="#94a28e"
              strokeWidth="2"
            />
          ))}
          <polyline
            points={coil(edge, tip, 85, 4)}
            fill="none"
            stroke="#8b9985"
            strokeWidth="1.5"
          />
          <path d={`M${tip} 77V93`} stroke="#8b9985" strokeWidth="2.5" />
          <text x={cx} y="24" textAnchor="middle">
            {m} kg
          </text>
          {Math.abs(v) > 0.02 && (
            <path
              d={`M${cx} 132h${v * 27}`}
              stroke={color}
              strokeWidth="3"
              markerEnd={`url(#${id}-${side})`}
            />
          )}
        </g>
      );
    };
  return (
    <div className="collision-film" data-watch={film.watch}>
      <p className="collision-frame">
        {centerFrame ? t('质心参考系 · 向右为正') : t('实验室参考系 · 向右为正')}
      </p>
      <svg
        className="collision-track"
        viewBox="0 0 340 151"
        role="img"
        aria-label={t('带弹簧缓冲器的两辆小车')}
      >
        <defs>
          {[1, 2].map((v) => (
            <marker
              key={v}
              id={`${id}-${v}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" fill={v === 1 ? '#90ac9d' : '#c0a776'} />
            </marker>
          ))}
        </defs>
        <path d="M5 111H335" stroke="#c3cfba" strokeWidth="3" />
        {centerFrame && <path d="M170 30V144" stroke="#b7bca5" strokeDasharray="4 5" />}
        {cart(1)}
        {cart(2)}
      </svg>
      {contact && (
        <div className="collision-contact">
          <p>
            {t('接触放大')} <span>F = {s.force.toFixed(1)} N</span>
          </p>
          <svg viewBox="0 0 340 83" role="img" aria-label={t('两个串联弹簧压缩与回弹的局部')}>
            <rect x="16" y="4" width="308" height="73" rx="16" fill="#f1f3e9" />
            <rect x="16" y="18" width={154 - len * 800} height="40" rx="5" fill="#a8beac" />
            <rect
              x={170 + len * 800}
              y="18"
              width={154 - len * 800}
              height="40"
              rx="5"
              fill="#d0bb91"
            />
            <polyline
              points={coil(170 - len * 800, 170, 38, 10)}
              fill="none"
              stroke="#8e9a83"
              strokeWidth="2.5"
            />
            <polyline
              points={coil(170, 170 + len * 800, 38, 10)}
              fill="none"
              stroke="#8e9a83"
              strokeWidth="2.5"
            />
            <path d="M168 22V54M172 22V54" stroke="#8e9a83" strokeWidth="3" />
            {s.force > 0.01 && (
              <>
                <path
                  d={`M150 67h${-s.force * 2}`}
                  stroke="#90ac9d"
                  strokeWidth="3"
                  markerEnd={`url(#${id}-1)`}
                />
                <path
                  d={`M190 67h${s.force * 2}`}
                  stroke="#c0a776"
                  strokeWidth="3"
                  markerEnd={`url(#${id}-2)`}
                />
              </>
            )}
          </svg>
        </div>
      )}
      <div className="collision-values">
        <span>
          {centerFrame ? 'p₁ (kg·m/s)' : 'v₁ (m/s)'}
          <b>{(centerFrame ? s.m1 * v1 : v1).toFixed(2)}</b>
        </span>
        <span>
          {centerFrame ? 'p₂ (kg·m/s)' : 'v₂ (m/s)'}
          <b>{(centerFrame ? s.m2 * v2 : v2).toFixed(2)}</b>
        </span>
      </div>
      <div className="collision-energy">
        <div className="collision-energy-label">
          <span>
            {t('运动动能')} {K.toFixed(2)} J
          </span>
          <span>
            {t('弹簧')} {s.springEnergy.toFixed(2)} J
          </span>
        </div>
        <div className="collision-energy-bar">
          <i style={{ width: `${(K / E) * 100}%` }} />
          <b style={{ width: `${(s.springEnergy / E) * 100}%` }} />
        </div>
        <p>
          {t('总能量')} {E.toFixed(2)} J{' '}
          <span>
            · {t('总动量')}{' '}
            {(Math.abs(s.m1 * v1 + s.m2 * v2) < 1e-10 ? 0 : s.m1 * v1 + s.m2 * v2).toFixed(2)}{' '}
            kg·m/s
          </span>
        </p>
      </div>
      {!film.watch && (
        <div className="collision-controls">
          <Segments
            label={t('左车质量')}
            value={String(m1)}
            options={[
              { value: '1', label: '1 kg' },
              { value: '3', label: '3 kg' },
            ]}
            onChange={(v) => setM1(Number(v))}
          />
          <Segments
            label={t('右车质量')}
            value={String(m2)}
            options={[
              { value: '1', label: '1 kg' },
              { value: '3', label: '3 kg' },
            ]}
            onChange={(v) => setM2(Number(v))}
          />
          <Range
            label={t('碰撞过程')}
            value={progress}
            min={0}
            max={1}
            step={0.001}
            onChange={setProgress}
          />
          <Segments
            label={t('参考系')}
            value={frame}
            options={[
              { value: 'lab', label: t('实验室') },
              { value: 'center', label: t('质心') },
            ]}
            onChange={setFrame}
          />
        </div>
      )}
      <details className="collision-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '一维无摩擦运动，质量可忽略的线性弹簧；接触时先储存后释放能量。不计算声、热、转动或真实材料变形。弹性指分离后动能恢复，接触期间要计入弹簧能量。',
          )}
        </p>
      </details>
    </div>
  );
}
