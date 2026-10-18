import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { arcExit, magneticRolling, dartFlight } from '../../models/curved-motion-lab';
import '../../styles/curved-motion-lab.css';
export default function CurvedMotionLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState(
      film.variant?.includes('magnetic')
        ? 'magnet'
        : film.variant?.includes('dart')
          ? 'dart'
          : 'track',
    ),
    [time, setTime] = useState(1),
    [exit, setExit] = useState('A'),
    [side, setSide] = useState('side'),
    [angle, setAngle] = useState(36),
    c = film.chapter,
    p = film.chapterProgress,
    kind = film.watch ? (c < 2 ? 'track' : c < 4 ? 'magnet' : 'dart') : mode,
    exitAngle = (film.watch ? c === 1 : exit === 'B') ? -Math.PI / 6 : 0,
    lateral = film.watch ? c === 3 : side === 'side',
    dartAngle = ((film.watch ? (c === 5 ? 55 : 25) : angle) * Math.PI) / 180,
    physical = film.watch
      ? kind === 'track'
        ? Math.min(1, p / 0.78) * 3.15
        : kind === 'magnet'
          ? Math.min(1, p / 0.8) * 1.65
          : Math.min(1, p / 0.8) * dartFlight(0, dartAngle).duration
      : time,
    arc = arcExit(physical, exitAngle),
    mag = kind === 'magnet' ? magneticRolling(physical, lateral) : null,
    dart = dartFlight(physical, dartAngle);
  const track = (radius: number, end: number) =>
    Array.from({ length: 41 }, (_, i) => {
      const a = -Math.PI / 2 + ((end + Math.PI / 2) * i) / 40;
      return `${i ? 'L' : 'M'}${105 + radius * Math.cos(a) * 105} ${176 - radius * Math.sin(a) * 105}`;
    }).join(' ');
  const ap = { x: 105 + arc.x * 105, y: 176 - arc.y * 105 },
    dp = { x: 40 + dart.x * 92, y: 270 - dart.y * 92 };
  return (
    <section className="curved-motion-lab">
      <header>
        <p>
          {t(
            kind === 'track'
              ? arc.released
                ? '离开轨道后，印迹沿出口切线延伸'
                : '让沾有印泥的钢球沿弧形轨道滚动'
              : kind === 'magnet'
                ? lateral
                  ? '把磁铁移到侧面，速度方向也发生变化'
                  : '磁铁在正前方，球加速却仍沿直线'
                : '飞镖的指向帮助追踪瞬时速度方向',
          )}
        </p>
        <span>
          {t(
            kind === 'track'
              ? '水平俯视 · 印迹实验'
              : kind === 'magnet'
                ? '水平俯视 · 磁铁与钢球'
                : '侧视 · 带尾翼飞镖',
          )}
        </span>
      </header>
      <div className="curved-motion-stage">
        <svg
          viewBox="0 0 360 315"
          role="img"
          aria-label={t(
            kind === 'track'
              ? '分段弧形轨道约束钢球，出口外的红色印迹沿切线'
              : kind === 'magnet'
                ? '磁铁位置改变钢球受力方向，轨迹由力学模型积分'
                : '带纸翼的飞镖沿抛物线飞行，杆轴随速度方向转动',
          )}
        >
          <defs>
            <radialGradient id={`${id}steel`} cx="30%" cy="25%">
              <stop stopColor="#e4eadc" />
              <stop offset=".45" stopColor="#b5c8b1" />
              <stop offset="1" stopColor="#7d9e88" />
            </radialGradient>
          </defs>
          {kind === 'track' ? (
            <>
              <rect
                x="20"
                y="15"
                width="320"
                height="286"
                rx="18"
                fill="#f2f0e5"
                fillOpacity=".65"
              />
              <path d={track(0.7, 0)} stroke="#d7dfcc" strokeWidth="12" fill="none" opacity=".35" />
              {[0, 1, 2]
                .filter((i) => exitAngle === 0 || i < 2)
                .map((i) => {
                  const a0 = -Math.PI / 2 + (i * Math.PI) / 6 + 0.008,
                    a1 = -Math.PI / 2 + ((i + 1) * Math.PI) / 6 - 0.008;
                  return (
                    <path
                      key={i}
                      d={Array.from({ length: 17 }, (_, j) => {
                        const a = a0 + ((a1 - a0) * j) / 16;
                        return `${j ? 'L' : 'M'}${105 + 0.7 * Math.cos(a) * 105} ${176 - 0.7 * Math.sin(a) * 105}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#bac9b0"
                      strokeWidth="13"
                    />
                  );
                })}
              <path d={track(0.65, exitAngle)} stroke="#95ad91" fill="none" strokeWidth="1.5" />
              <path d={track(0.75, exitAngle)} stroke="#95ad91" fill="none" strokeWidth="1.5" />
              <path
                d={Array.from({ length: 75 }, (_, i) => arcExit((physical * i) / 74, exitAngle))
                  .map((s, i) => `${i ? 'L' : 'M'}${105 + s.x * 105} ${176 - s.y * 105}`)
                  .join(' ')}
                stroke="#c59983"
                strokeWidth="2"
                fill="none"
              />
              <circle cx={ap.x} cy={ap.y} r="5.2" fill={`url(#${id}steel)`} />
              {arc.released && (
                <path
                  d={`M${ap.x + (arc.vx / 0.6) * 10} ${ap.y - (arc.vy / 0.6) * 10}l${(arc.vx / 0.6) * 35} ${(-arc.vy / 0.6) * 35}`}
                  stroke="#8da980"
                  strokeWidth="2"
                />
              )}
              <circle
                cx={105 + 0.7 * Math.cos(exitAngle) * 105}
                cy={176 - 0.7 * Math.sin(exitAngle) * 105}
                r="10"
                stroke="#c2b48c"
                fill="none"
                strokeDasharray="3 4"
              />
            </>
          ) : kind === 'magnet' && mag ? (
            <>
              <rect
                x="20"
                y="28"
                width="320"
                height="252"
                rx="19"
                fill="#eff1e7"
                fillOpacity=".7"
              />
              <path d="M40 213H313" stroke="#d6dfc9" strokeDasharray="4 6" />
              <g transform={`translate(${40 + mag.magnet.x * 210} ${213 - mag.magnet.y * 210})`}>
                <path d="M-20-11H0V11H-20Q-24 11-24 6V-6Q-24-11-20-11Z" fill="#c5a386" />
                <path d="M0-11H20Q24-11 24-6V6Q24 11 20 11H0Z" fill="#9fb79d" />
                <circle
                  r={0.27 * 210}
                  stroke="#c7ceb8"
                  strokeDasharray="2 6"
                  fill="none"
                  opacity=".55"
                />
              </g>
              <path
                d={mag.trace
                  .map((q, i) => `${i ? 'L' : 'M'}${40 + q.x * 210} ${213 - q.y * 210}`)
                  .join(' ')}
                fill="none"
                stroke="#b69877"
                strokeWidth="2"
              />
              <circle
                cx={40 + mag.x * 210}
                cy={213 - mag.y * 210}
                r="5.5"
                fill={`url(#${id}steel)`}
              />
              <path
                d={`M${40 + mag.x * 210} ${213 - mag.y * 210}l${(mag.vx / Math.hypot(mag.vx, mag.vy)) * 36} ${(-mag.vy / Math.hypot(mag.vx, mag.vy)) * 36}`}
                stroke="#8ca77f"
                strokeWidth="2"
              />
              <path
                d={`M${40 + mag.x * 210} ${213 - mag.y * 210}l${(mag.ax / Math.hypot(mag.ax, mag.ay)) * 28} ${(-mag.ay / Math.hypot(mag.ax, mag.ay)) * 28}`}
                stroke="#b8996e"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            </>
          ) : (
            <>
              <path d="M20 271H340V293H20Z" fill="#d9d3b7" />
              <path d="M20 271H340" stroke="#b9b891" strokeWidth="2" />
              <path
                d={Array.from({ length: 65 }, (_, i) => dartFlight((dart.time * i) / 64, dartAngle))
                  .map((q, i) => `${i ? 'L' : 'M'}${40 + q.x * 92} ${270 - q.y * 92}`)
                  .join(' ')}
                fill="none"
                stroke="#bbc9aa"
                strokeWidth="1.8"
              />
              {[0.15, 0.35, 0.55, 0.75].map((f, i) =>
                f * dart.duration < dart.time ? (
                  <g
                    key={i}
                    transform={`translate(${40 + dartFlight(f * dart.duration, dartAngle).x * 92} ${270 - dartFlight(f * dart.duration, dartAngle).y * 92}) rotate(${(-dartFlight(f * dart.duration, dartAngle).heading * 180) / Math.PI})`}
                    opacity=".23"
                  >
                    <path d="M-12 0H12M-11-5l6 5-6 5" stroke="#a59b76" strokeWidth="1.5" />
                  </g>
                ) : null,
              )}
              <g
                transform={`translate(${dp.x} ${dp.y}) rotate(${(-dart.heading * 180) / Math.PI})`}
              >
                <path d="M-12 0H9" stroke="#b6a27b" strokeWidth="2.7" />
                <path d="M9-1.5l4 1.5-4 1.5" fill="#8a9f8c" />
                <path d="M-12 0l-2-7 10 7-10 7Z" fill="#b6c4a3" stroke="#95ab8c" strokeWidth=".7" />
              </g>
            </>
          )}
        </svg>
      </div>
      <div className="curved-motion-legend">
        <span>
          <i />
          {t('速度方向')}
        </span>
        {kind === 'magnet' && (
          <span>
            <i />
            {t('合力方向')}
          </span>
        )}
        <span>
          {t('模型时间')}{' '}
          {(kind === 'magnet' ? mag!.time : kind === 'dart' ? dart.time : physical).toFixed(2)} s
        </span>
      </div>
      <p className="curved-motion-cause">
        {t(
          kind === 'track'
            ? '更换出口，飞出的方向随该点的切线改变。'
            : kind === 'magnet'
              ? '合力与速度不共线时，速度的方向才会改变。'
              : '理想尾翼迅速对齐速度，杆轴近似沿轨迹切线；不是沿着合力方向。',
        )}
      </p>
      {!film.watch && (
        <div className="curved-motion-controls">
          <Segments
            label={t('实验路径')}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setTime(0.4);
            }}
            options={[
              { value: 'track', label: t('弧形轨道') },
              { value: 'magnet', label: t('磁铁与钢球') },
              { value: 'dart', label: t('飞镖') },
            ]}
          />
          {kind === 'track' ? (
            <Segments
              label={t('轨道出口')}
              value={exit}
              onChange={setExit}
              options={[
                { value: 'A', label: t('完整轨道') },
                { value: 'B', label: t('拆去末段') },
              ]}
            />
          ) : kind === 'magnet' ? (
            <Segments
              label={t('磁铁位置')}
              value={side}
              onChange={setSide}
              options={[
                { value: 'front', label: t('正前方') },
                { value: 'side', label: t('侧面') },
              ]}
            />
          ) : (
            <Range
              label={t('投射角')}
              value={angle}
              min={15}
              max={65}
              step={1}
              unit="°"
              onChange={setAngle}
            />
          )}
          <Range
            label={t('模型时间')}
            value={Math.min(
              time,
              kind === 'track' ? 3.15 : kind === 'magnet' ? 1.65 : dart.duration,
            )}
            min={0}
            max={kind === 'track' ? 3.15 : kind === 'magnet' ? 1.65 : dart.duration}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="curved-motion-note">
        {t(
          kind === 'magnet'
            ? '磁力采用诱导偶极远场示意，接近磁铁时停止记录；不模拟吸附碰撞，也不把力线当轨迹。'
            : kind === 'dart'
              ? '飞镖平动忽略气阻，方向采用尾翼快速稳定的教学近似；不模拟真实转动滞后。'
              : '水平面上忽略滚动阻力，出口位置与瞬时速度连续；印迹由真实计算轨迹生成。',
        )}
      </p>
    </section>
  );
}
