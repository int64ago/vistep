import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { gyroscopeDefaults, gyroscopeState, gyroscopeShot } from '../../models/gyroscope';
import GyroscopeStudio from '../three/GyroscopeStudio';
import '../../styles/gyroscope.css';
export default function Gyroscope() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [spin, setSpin] = useState(120),
    [time, setTime] = useState(1),
    [gravity, setGravity] = useState(true),
    [mode, setMode] = useState('momentum'),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? gyroscopeShot(c, film.chapterProgress)
      : gyroscopeState({ ...gyroscopeDefaults(), spin, gravity: gravity ? 9.81 : 0 }, time),
    kind = film.watch
      ? c === 1
        ? 'forces'
        : c === 0
          ? 'plain'
          : 'momentum'
      : (mode as 'forces' | 'momentum'),
    showDiagram = kind === 'momentum',
    x = 170 + s.spinMomentum * 18 * s.axis.x,
    y = 78 + s.spinMomentum * 18 * s.axis.z,
    project = (x: number, y: number, z: number) => ({
      x: 155 + 250 * (0.85 * x - 0.55 * z),
      y: 100 + 250 * (0.28 * x + 0.44 * z - y),
    }),
    center = project(s.center.x, 0, s.center.z),
    rim = Array.from({ length: 81 }, (_, i) => {
      const a = (i / 80) * Math.PI * 2;
      const v = project(
        s.center.x + s.radius * Math.sin(a) * s.tangent.x,
        s.radius * Math.cos(a),
        s.center.z + s.radius * Math.sin(a) * s.tangent.z,
      );
      return `${v.x},${v.y}`;
    }).join(' '),
    tip = project((s.arm + 0.07) * s.axis.x, 0, (s.arm + 0.07) * s.axis.z),
    stripe = project(
      s.center.x - s.radius * 0.85 * Math.sin(s.spinAngle) * s.tangent.x,
      s.radius * 0.85 * Math.cos(s.spinAngle),
      s.center.z - s.radius * 0.85 * Math.sin(s.spinAngle) * s.tangent.z,
    ),
    fallbackArrow = (
      origin: { x: number; y: number },
      end: { x: number; y: number },
      color: string,
      key: string,
    ) => (
      <g key={key}>
        <defs>
          <marker
            id={`${id}-flat-${key}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill={color} />
          </marker>
        </defs>
        <path
          d={`M${origin.x} ${origin.y}L${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth="3"
          markerEnd={`url(#${id}-flat-${key})`}
        />
      </g>
    ),
    fallback = (
      <svg viewBox="0 0 340 220" aria-label={t('陀螺同模型斜视投影')}>
        <ellipse cx="155" cy="160" rx="25" ry="8" fill="#9caf98" />
        <path d="M155 160V100" stroke="#a8b7ac" strokeWidth="7" />
        <path d={`M155 100L${tip.x} ${tip.y}`} stroke="#95a7a8" strokeWidth="5" />
        <polygon points={rim} fill="#b9c8c1" stroke="#88a19e" strokeWidth="2" />
        <path
          d={`M${center.x} ${center.y}L${stripe.x} ${stripe.y}`}
          stroke="#bba16e"
          strokeWidth="3"
        />
        <circle cx={center.x} cy={center.y} r="5" fill="#b69c69" />
        <circle cx="155" cy="100" r="5" fill="#b69c69" />
        {kind === 'forces' && s.gravity > 0 && (
          <>
            {fallbackArrow(center, project(s.center.x, -0.15, s.center.z), '#ba8a56', 'weight')}
            {fallbackArrow(
              { x: 155, y: 100 },
              project(s.reaction.x * 0.015, s.reaction.y * 0.015, s.reaction.z * 0.015),
              '#799586',
              'reaction',
            )}
          </>
        )}
        {kind === 'momentum' &&
          fallbackArrow(
            { x: 155, y: 100 },
            project(s.spinMomentum * s.axis.x * 0.07, 0, s.spinMomentum * s.axis.z * 0.07),
            '#6c92a0',
            'momentum',
          )}
        {kind !== 'plain' &&
          s.gravity > 0 &&
          fallbackArrow(
            { x: 155, y: 100 },
            project(s.torque.x * 0.07, 0, s.torque.z * 0.07),
            '#b1775f',
            'torque',
          )}
      </svg>
    );
  return (
    <div className="gyro-film" data-watch={film.watch}>
      <p className="gyro-condition">
        {c === 5 || (!gravity && !film.watch)
          ? t('无重力矩，保留固定支点')
          : t('预先建立的水平匀速进动')}
      </p>
      <div className="gyro-object">
        <GyroscopeStudio state={s} kind={kind} fallback={fallback} />
      </div>
      {kind === 'forces' && (
        <p className="gyro-legend">
          <span className="gyro-weight">{t('重力')}</span>
          <span className="gyro-support">{t('支点反力')}</span>
          <span className="gyro-torque">{t('重力矩')}</span>
        </p>
      )}
      {showDiagram && (
        <div className="gyro-direction">
          <svg
            viewBox="0 0 340 174"
            role="img"
            aria-label={t('俯视水平角动量，重力矩指向轨迹切线')}
          >
            <defs>
              <marker
                id={`${id}-l`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10Z" fill="#6c92a0" />
              </marker>
              <marker
                id={`${id}-t`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10Z" fill="#b1775f" />
              </marker>
            </defs>
            <ellipse
              cx="170"
              cy="78"
              rx={Math.abs(s.spinMomentum) * 18}
              ry={Math.abs(s.spinMomentum) * 18}
              fill="none"
              stroke="#c3cec2"
              strokeDasharray="4 5"
            />
            <path
              d={`M170 78L${x} ${y}`}
              stroke="#6c92a0"
              strokeWidth="3"
              markerEnd={`url(#${id}-l)`}
            />
            {s.gravity > 0 && (
              <path
                d={`M${x} ${y}l${s.tangent.x * 28} ${s.tangent.z * 28}`}
                stroke="#b1775f"
                strokeWidth="3"
                markerEnd={`url(#${id}-t)`}
              />
            )}
            <circle cx="170" cy="78" r="4" fill="#829784" />
            <text x="324" y="169" textAnchor="end">
              |Lₕ| = {Math.abs(s.spinMomentum).toFixed(2)} kg·m²/s
            </text>
          </svg>
          <p className="gyro-legend">
            <span className="gyro-momentum">Lₕ</span>
            <span className="gyro-torque">τ</span>
            <span>{t('箭头各用独立比例')}</span>
          </p>
        </div>
      )}
      <div className="gyro-values">
        <span>
          {t('自转')}
          <b>{s.spin.toFixed(0)} rad/s</b>
        </span>
        <span>
          {t('进动')}
          <b>{s.precession.toFixed(2)} rad/s</b>
        </span>
      </div>
      {!film.watch && (
        <div className="gyro-controls">
          <Range
            label={t('自转角速度')}
            value={Math.abs(spin)}
            min={60}
            max={240}
            step={10}
            unit="rad/s"
            onChange={(v) => setSpin(Math.sign(spin) * v)}
          />
          <Range
            label={t('观察时刻')}
            value={time}
            min={0}
            max={6}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Segments
            label={t('自转方向')}
            value={spin > 0 ? 'positive' : 'negative'}
            options={[
              { value: 'positive', label: t('正向') },
              { value: 'negative', label: t('反向') },
            ]}
            onChange={(v) => setSpin(Math.abs(spin) * (v === 'positive' ? 1 : -1))}
          />
          <Segments
            label={t('重力场')}
            value={gravity ? 'on' : 'off'}
            options={[
              { value: 'on', label: t('有重力') },
              { value: 'off', label: t('无重力') },
            ]}
            onChange={(v) => setGravity(v === 'on')}
          />
          <Segments
            label={t('观察量')}
            value={mode}
            options={[
              { value: 'momentum', label: t('角动量方向') },
              { value: 'forces', label: t('力与力矩') },
            ]}
            onChange={setMode}
          />
        </div>
      )}
      <details className="gyro-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '理想薄盘与轻轴，支点固定。每组参数先建立对应的水平匀速进动；不模拟直接松手的章动。图中Lₕ只表示水平角动量，完整模型还包含恒定竖直分量。',
          )}
        </p>
      </details>
    </div>
  );
}
