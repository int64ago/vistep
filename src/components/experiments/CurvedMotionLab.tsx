import { useEffect, useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  arcExit,
  magneticRolling,
  dartFlight,
  curvedFilmState,
  type CurvedState,
} from '../../models/curved-motion-lab';
import '../../styles/curved-motion-lab.css';
function useNarrow() {
  const [n, set] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const m = window.matchMedia('(max-width:640px)'),
      u = () => set(m.matches);
    u();
    m.addEventListener('change', u);
    return () => m.removeEventListener('change', u);
  }, []);
  return n;
}
export default function CurvedMotionLab() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    narrow = useNarrow(),
    w = narrow ? 280 : 560,
    h = 230,
    id = useId().replace(/:/g, ''),
    authored = curvedFilmState(film.chapter, film.chapterTime, en ? 'en' : 'zh');
  const [manual, setManual] = useState<Partial<CurvedState>>({});
  const s = film.watch ? authored : { ...authored, ...manual };
  const mag = useMemo(
      () => (s.kind === 'magnet' ? magneticRolling(s.time, s.side, s.strength) : null),
      [s.kind, s.time, s.side, s.strength],
    ),
    arc = arcExit(Math.min(3.15, s.time), s.exitAngle),
    dart = dartFlight(s.time, s.angle),
    time = s.kind === 'track' ? arc.time : s.kind === 'magnet' ? mag!.time : dart.time;
  const set = (v: Partial<CurvedState>) => setManual({ ...s, time, ...v }),
    maxTime = useMemo(
      () =>
        s.kind === 'track'
          ? 3.15
          : s.kind === 'magnet'
            ? magneticRolling(1.65, s.side, s.strength).time
            : dart.duration,
      [s.kind, s.side, s.strength, dart.duration],
    );
  const sc =
      s.kind === 'track'
        ? narrow
          ? 90
          : 100
        : s.kind === 'magnet'
          ? narrow
            ? 165
            : 275
          : narrow
            ? 75
            : 110,
    ox =
      s.kind === 'track'
        ? narrow
          ? 78
          : 180
        : s.kind === 'magnet'
          ? narrow
            ? 27
            : 90
          : narrow
            ? 27
            : 75,
    oy = s.kind === 'track' ? 125 : s.kind === 'magnet' ? 166 : 205,
    X = (x: number) => ox + x * sc,
    Y = (y: number) => oy - y * sc;
  const track = (radius: number, end: number, start = -Math.PI / 2) =>
      Array.from({ length: 61 }, (_, i) => {
        const a = start + ((end - start) * i) / 60;
        return `${i ? 'L' : 'M'}${X(radius * Math.cos(a))} ${Y(radius * Math.sin(a))}`;
      }).join(' '),
    arcTrace = (end: number, t: number) =>
      Array.from({ length: 81 }, (_, i) => {
        const a = arcExit((t * i) / 80, end);
        return `${i ? 'L' : 'M'}${X(a.x)} ${Y(a.y)}`;
      }).join(' '),
    dartTrace = (angle: number, t: number) =>
      Array.from({ length: 81 }, (_, i) => {
        const a = dartFlight((t * i) / 80, angle);
        return `${i ? 'L' : 'M'}${X(a.x)} ${Y(a.y)}`;
      }).join(' ');
  const Arrow = ({
    x,
    y,
    vx,
    vy,
    length,
    color,
    label,
  }: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    length: number;
    color: string;
    label?: string;
  }) => {
    const n = Math.hypot(vx, vy);
    if (n < 1e-12) return null;
    const dx = (vx / n) * length,
      dy = (-vy / n) * length;
    return (
      <g data-vector={label}>
        <path d={`M${x} ${y} l${dx} ${dy}`} stroke={color} strokeWidth="2.5" />
        <path
          d={`M${x + dx - (5 * dx) / length - (3 * dy) / length} ${y + dy - (5 * dy) / length + (3 * dx) / length} L${x + dx} ${y + dy} L${x + dx - (5 * dx) / length + (3 * dy) / length} ${y + dy - (5 * dy) / length - (3 * dx) / length}`}
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
      </g>
    );
  };
  return (
    <section
      className="cv20"
      data-watch={film.watch}
      data-kind={s.kind}
      data-time={time}
      data-requested-time={s.time}
      data-exit={s.exitAngle}
      data-side={s.side}
      data-angle={s.angle}
      data-strength={s.strength}
      data-view={s.view}
    >
      <header className="cv20-head">
        <span>
          {say(
            s.kind === 'track' ? '出口与切线' : s.kind === 'magnet' ? '力与速度' : '飞镖与切线',
            s.kind === 'track'
              ? 'Exit and tangent'
              : s.kind === 'magnet'
                ? 'Force and velocity'
                : 'Dart and tangent',
          )}
        </span>
        <strong>t = {time.toFixed(2)} s</strong>
      </header>
      <svg
        className="cv20-art"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={say(
          '同一物体的轨迹、瞬时速度与约束或合力方向',
          'One object: trajectory, velocity, constraint and force',
        )}
      >
        <defs>
          <radialGradient id={id + 'steel'} cx="28%" cy="25%">
            <stop stopColor="#edf1e5" />
            <stop offset=".45" stopColor="#b6c8b0" />
            <stop offset="1" stopColor="#7c9c87" />
          </radialGradient>
        </defs>
        {s.kind === 'track' && (
          <>
            <rect x="12" y="13" width={w - 24} height="199" rx="18" fill="#f0eee2" opacity=".65" />
            {s.compare && (
              <path
                d={arcTrace(0, 3.15)}
                stroke="#c4cabc"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5 5"
              />
            )}
            <path
              d={track(0.7, s.exitAngle)}
              stroke="#c8d4bd"
              strokeWidth={0.13 * sc}
              fill="none"
            />
            {[0.635, 0.765].map((r) => (
              <path
                key={r}
                d={track(r, s.exitAngle)}
                stroke="#93ac8b"
                strokeWidth="1.5"
                fill="none"
              />
            ))}
            {[1, 2]
              .filter((i) => s.exitAngle === 0 || i === 1)
              .map((i) => {
                const a = -Math.PI / 2 + (i * Math.PI) / 6;
                return (
                  <path
                    key={i}
                    d={`M${X(0.635 * Math.cos(a))} ${Y(0.635 * Math.sin(a))} L${X(0.765 * Math.cos(a))} ${Y(0.765 * Math.sin(a))}`}
                    stroke="#edf0e5"
                    strokeWidth="2"
                  />
                );
              })}
            <path d={arcTrace(s.exitAngle, time)} stroke="#b98d77" strokeWidth="2" fill="none" />
            <circle data-ball cx={X(arc.x)} cy={Y(arc.y)} r={0.05 * sc} fill={`url(#${id}steel)`} />
            <Arrow
              x={X(arc.x)}
              y={Y(arc.y)}
              vx={arc.vx}
              vy={arc.vy}
              length={33}
              color="#78986f"
              label="v"
            />
            {s.view === 'vectors' && (
              <path
                d={`M${X(0.7 * Math.cos(s.exitAngle))} ${Y(0.7 * Math.sin(s.exitAngle))} L${X(0)} ${Y(0)}`}
                stroke="#b8c5ad"
                strokeDasharray="3 5"
              />
            )}
            <text x={X(0.7 * Math.cos(s.exitAngle)) + 13} y={Y(0.7 * Math.sin(s.exitAngle)) + 17}>
              {s.exitAngle === 0 ? 'A' : 'B'}
            </text>
            {s.compare && (
              <text x="20" y="35">
                {say('虚线：原记录 A', 'Dashed: prior A')}
              </text>
            )}
            <text x={w - 18} y="221" textAnchor="end">
              {arc.released
                ? say('离轨后直行', 'Straight after exit')
                : say('轨道改变方向', 'Track turns velocity')}
            </text>
          </>
        )}
        {s.kind === 'magnet' && mag && (
          <>
            <rect x="12" y="15" width={w - 24} height="184" rx="18" fill="#eef1e5" />
            <path d={`M${ox} ${oy} H${w - 22}`} stroke="#cbd6be" strokeDasharray="4 6" />
            <g transform={`translate(${X(mag.magnet.x)} ${Y(mag.magnet.y)})`}>
              <path d="M-18 -9 H0 V9 H-18 Q-22 9 -22 5 V-5 Q-22 -9 -18 -9Z" fill="#c2a287" />
              <path d="M0 -9 H18 Q22 -9 22 -5 V5 Q22 9 18 9 H0Z" fill="#9fb495" />
              <circle r={0.27 * sc} stroke="#c5ceb8" strokeDasharray="3 6" fill="none" />
            </g>
            <path
              d={mag.trace.map((a, i) => `${i ? 'L' : 'M'}${X(a.x)} ${Y(a.y)}`).join(' ')}
              stroke="#b29872"
              strokeWidth="2"
              fill="none"
            />
            <circle data-ball cx={X(mag.x)} cy={Y(mag.y)} r="5" fill={`url(#${id}steel)`} />
            <Arrow
              x={X(mag.x)}
              y={Y(mag.y)}
              vx={mag.vx}
              vy={mag.vy}
              length={34}
              color="#78986f"
              label="v"
            />
            <Arrow
              x={X(mag.x)}
              y={Y(mag.y)}
              vx={mag.ax}
              vy={mag.ay}
              length={27}
              color="#ae8e60"
              label="F"
            />
            <text x={w / 2} y="221" textAnchor="middle">
              {s.strength === 0
                ? 'F = 0'
                : mag.stopped
                  ? say('远场边界 · 停止记录', 'Far-field limit · hold')
                  : say(
                      s.side ? '力与速度不共线' : '力与速度共线',
                      s.side ? 'F and v not collinear' : 'F and v collinear',
                    )}
            </text>
          </>
        )}
        {s.kind === 'dart' && (
          <>
            <path d={`M12 ${oy + 1} H${w - 12} V223 H12 Z`} fill="#ded9c0" />
            <path data-ground d={`M12 ${oy + 1} H${w - 12}`} stroke="#b4b58f" strokeWidth="2" />
            {s.compare && (
              <path
                d={dartTrace((25 * Math.PI) / 180, dartFlight(0, (25 * Math.PI) / 180).duration)}
                stroke="#c9d0bc"
                strokeWidth="1.5"
                strokeDasharray="5 5"
                fill="none"
              />
            )}
            <path d={dartTrace(s.angle, time)} stroke="#b4c5a4" strokeWidth="2" fill="none" />
            {[0.2, 0.4, 0.6, 0.8]
              .filter((f) => f * dart.duration < time)
              .map((f) => {
                const a = dartFlight(f * dart.duration, s.angle),
                  len = (a.length * sc) / 2;
                return (
                  <path
                    key={f}
                    d={`M${X(a.x) - len * Math.cos(a.heading)} ${Y(a.y) + len * Math.sin(a.heading)} L${X(a.x) + len * Math.cos(a.heading)} ${Y(a.y) - len * Math.sin(a.heading)}`}
                    stroke="#b3a07a"
                    strokeWidth="2"
                    opacity=".35"
                  />
                );
              })}
            <g
              data-dart
              transform={`translate(${X(dart.x)} ${Y(dart.y)}) rotate(${(-dart.heading * 180) / Math.PI})`}
            >
              <path
                d={`M${(-dart.length * sc) / 2} 0 H${(dart.length * sc) / 2 - 3}`}
                stroke="#ab966b"
                strokeWidth="2.8"
              />
              <path
                data-tip
                d={`M${(dart.length * sc) / 2 - 4} -1.5 L${(dart.length * sc) / 2} 0 L${(dart.length * sc) / 2 - 4} 1.5 Z`}
                fill="#809a86"
              />
              <path
                d={`M${(-dart.length * sc) / 2} 0 l-2 -6 9 6 -9 6Z`}
                fill="#b6c6a4"
                stroke="#92ab89"
              />
            </g>
            {s.view === 'vectors' && !dart.landed && (
              <>
                <Arrow
                  x={X(dart.x)}
                  y={Y(dart.y)}
                  vx={dart.vx}
                  vy={dart.vy}
                  length={32}
                  color="#78986f"
                  label="v"
                />
                <Arrow
                  x={X(dart.x)}
                  y={Y(dart.y)}
                  vx={0}
                  vy={-1}
                  length={29}
                  color="#ae8e60"
                  label="F"
                />
              </>
            )}
            <text x="18" y="28">
              α = {((s.angle * 180) / Math.PI).toFixed(0)}°
            </text>
            {s.compare && (
              <text x={w - 17} y="28" textAnchor="end">
                {say('虚线：25°', 'Dashed:25°')}
              </text>
            )}
          </>
        )}
      </svg>
      <div className="cv20-readout">
        <span>
          <i />
          {say('速度 v', 'Velocity v')}
        </span>
        {s.kind !== 'track' && (
          <span>
            <i className="cv20-force" />
            {say('合力 F', 'Net force F')}
          </span>
        )}
      </div>
      {!film.watch && (
        <div className="cv20-controls">
          <Segments
            label={say('实验路径', 'Experimental path')}
            value={s.kind}
            onChange={(v) =>
              set({
                kind: v,
                time: Math.min(
                  s.time,
                  v === 'track' ? 3.15 : v === 'magnet' ? 1.65 : dart.duration,
                ),
              })
            }
            options={[
              { value: 'track', label: say('弧形轨道', 'Arc track') },
              { value: 'magnet', label: say('磁铁与钢球', 'Magnet and ball') },
              { value: 'dart', label: say('飞镖', 'Dart') },
            ]}
          />
          {s.kind === 'track' ? (
            <Segments
              label={say('轨道出口', 'Track exit')}
              value={s.exitAngle === 0 ? 'A' : 'B'}
              onChange={(v) => set({ exitAngle: v === 'A' ? 0 : -Math.PI / 6, compare: v === 'B' })}
              options={[
                { value: 'A', label: say('完整轨道', 'Complete track') },
                { value: 'B', label: say('拆去末段', 'Remove last segment') },
              ]}
            />
          ) : s.kind === 'magnet' ? (
            <>
              <Segments
                label={say('磁铁位置', 'Magnet position')}
                value={s.side ? 'side' : 'front'}
                onChange={(v) => set({ side: v === 'side' })}
                options={[
                  { value: 'front', label: say('正前方', 'Directly ahead') },
                  { value: 'side', label: say('侧面', 'To the side') },
                ]}
              />
              <Range
                label={say('磁作用示例强度', 'Example magnetic strength')}
                value={s.strength / 0.00004}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => set({ strength: v * 0.00004 })}
              />
            </>
          ) : (
            <Range
              label={say('投射角', 'Launch angle')}
              value={Number(((s.angle * 180) / Math.PI).toFixed(3))}
              min={15}
              max={65}
              step={1}
              unit="°"
              onChange={(v) => set({ angle: (v * Math.PI) / 180 })}
            />
          )}
          <Range
            label={say('模型时间', 'Model time')}
            value={time}
            min={0}
            max={maxTime}
            step={0.01}
            unit="s"
            onChange={(v) => set({ time: v })}
          />
          <Segments
            label={say('局部矢量', 'Local vectors')}
            value={s.view}
            onChange={(v) => set({ view: v })}
            options={[
              { value: 'scene', label: say('轨迹', 'Trajectory') },
              { value: 'vectors', label: say('方向比较', 'Compare directions') },
            ]}
          />
        </div>
      )}
      <details className="cv20-note">
        <summary>{say('模型与记录的范围', 'Models and record limits')}</summary>
        <p>
          {say(
            '轨道出口的坐标和速度连续，水平面忽略滚动阻力。虚线是同一模型的对照，不是另一次实测。磁力从诱导偶极远场势能求梯度，并计入实心球滚动惯量；接近磁铁时停止记录，不模拟吸附。飞镖平动忽略气阻，尾翼方向迅速对齐速度是教学近似；尖端首次接地时停止。',
            'Track position and velocity are continuous at release; horizontal rolling resistance is omitted. Dashed traces are model comparisons, not measurements. Magnetic motion integrates an induced-dipole potential gradient with solid-sphere rolling inertia and stops before near-field capture. The dart ignores drag and assumes rapid tail alignment; motion stops at first tip contact.',
          )}
        </p>
      </details>
    </section>
  );
}
