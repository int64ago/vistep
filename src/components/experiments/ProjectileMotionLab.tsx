import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import {
  PROJECTILE_G,
  PROJECTILE_RADIUS,
  PROJECTILE_RECORDS,
  PROJECTILE_RULER,
  horizontalProjectile,
  rollingLaunch,
  rollingState,
  rollingSupport,
  projectileRanges,
  recoverFromRanges,
  coordinateTime,
  rulerPrediction,
  projectileVelocity,
  projectileCandidate,
  projectileShot,
  projectileSpeechProgress,
  projectileInitialMode,
  type ProjectileMode,
} from '../../models/projectile-motion-lab';
import '../../styles/projectile-motion-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#35534e',
  blue = '#367f91',
  gold = '#b16b36',
  soft = '#8b9c8c',
  pale = '#dce4d6';
const line = (points: { x: number; y: number }[]) =>
  points.map((q, i) => `${i ? 'L' : 'M'} ${q.x} ${q.y}`).join(' ');
function Text({
  x,
  y,
  children,
  color = ink,
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text x={x} y={y} fontSize="16" textAnchor={anchor} fill={color}>
      {children}
    </text>
  );
}
function Arrow({
  x,
  y,
  dx,
  dy,
  color = blue,
  width = 2,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  width?: number;
}) {
  const a = Math.atan2(dy, dx),
    n = Math.hypot(dx, dy);
  if (n < 0.01) return null;
  const k = Math.min(7, n * 0.4),
    ex = x + dx,
    ey = y + dy;
  return (
    <g>
      <path d={`M ${x} ${y} L ${ex} ${ey}`} stroke={color} strokeWidth={width} fill="none" />
      <path
        d={`M ${ex - k * Math.cos(a - 0.45)} ${ey - k * Math.sin(a - 0.45)} L ${ex} ${ey} L ${ex - k * Math.cos(a + 0.45)} ${ey - k * Math.sin(a + 0.45)}`}
        stroke={color}
        strokeWidth={width}
        fill="none"
      />
    </g>
  );
}
function Ball({ x, y, r = 5, color = gold }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g data-projectile-ball>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x - r * 0.26} cy={y - r * 0.32} r={r * 0.28} fill="#fff9e9" opacity=".7" />
    </g>
  );
}
function Tag({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <Text x={x} y={y} anchor="middle" color={soft}>
      {children}
    </Text>
  );
}
function World({
  w,
  h,
  time,
  speed,
  drop,
  kind,
  prediction = false,
  result = false,
  recordMarks = 0,
  previousContact,
  knownClock = true,
  rampTime,
  manual = false,
}: {
  w: number;
  h: number;
  time: number;
  speed: number;
  drop: number;
  kind: 'board' | 'wall' | 'speed' | 'carbon';
  prediction?: boolean;
  result?: boolean;
  recordMarks?: number;
  previousContact?: Readonly<{ x: number; y: number }>;
  knownClock?: boolean;
  rampTime?: number;
  manual?: boolean;
}) {
  const narrow = w < 560,
    radius = PROJECTILE_RADIUS,
    floor = 0.85,
    rise = (7 * speed * speed) / (10 * PROJECTILE_G),
    scale = Math.min(
      (w - 110) / Math.max(0.95, speed * coordinateTime(drop) + 0.08),
      (h - 45) / (floor + rise + radius),
    ),
    ox = narrow ? 82 : w * 0.28,
    oy = Math.max(36, 12 + rise * scale),
    X = (x: number) => ox + x * scale,
    Y = (y: number) => oy + y * scale,
    ramp = useMemo(() => rollingLaunch(rise), [rise]),
    q =
      rampTime === undefined
        ? horizontalProjectile(time, speed, drop)
        : rollingState(rampTime, ramp, drop),
    final = horizontalProjectile(100, speed, drop),
    R = radius * scale,
    wall = kind === 'wall',
    surfaceX = final.x + radius,
    rampPts = Array.from({ length: 41 }, (_, i) => {
      const k = rollingSupport(-0.35 + (0.35 * i) / 40, rise, 0.35, radius, 0.009);
      return { x: X(k.stroke.x), y: Y(k.stroke.y) };
    }),
    visibleTime = Math.max(0, rampTime === undefined ? q.time : q.time - ramp.duration),
    trace = Array.from({ length: 51 }, (_, i) =>
      horizontalProjectile((visibleTime * i) / 50, speed, drop),
    ).map((k) => ({ x: X(k.x), y: Y(k.y) }));
  return (
    <g
      data-projectile-world
      data-contact={wall ? 'wall' : 'horizontal'}
      data-center-x={q.x}
      data-center-y={q.y}
      data-radius={radius}
      data-surface={wall ? surfaceX : drop + radius}
      data-known-clock={knownClock}
    >
      <path
        d={`M ${X(-0.35)} ${Y(radius)} H ${X(0)} V ${Y(radius + 0.022)} H ${X(-0.35)} Z`}
        fill="#d8c8a7"
      />
      <path
        d={`M ${X(-0.28)} ${Y(radius + 0.022)} V ${Y(floor)} M ${X(-0.08)} ${Y(radius + 0.022)} V ${Y(floor)}`}
        stroke="#bcad8a"
        strokeWidth="4"
      />
      <path d={line(rampPts)} stroke="#8caaa0" strokeWidth={0.009 * scale} fill="none" />
      <path d={`M ${X(-0.4)} ${Y(floor)} H ${w - 14}`} stroke={pale} strokeWidth="2" />
      <path d={`M ${X(0)} ${Y(0)} V ${Y(floor)}`} stroke={pale} strokeDasharray="3 5" />
      {wall ? (
        <g>
          <path
            data-contact-surface
            d={`M ${X(surfaceX) + 0.5} ${Y(-0.03)} V ${Y(floor)}`}
            stroke="#a2a68f"
            strokeWidth="1"
          />
          <path
            d={`M ${X(surfaceX) + 0.5} ${Y(-0.03)} H ${X(surfaceX) + 8} V ${Y(floor)} H ${X(surfaceX) + 0.5} Z`}
            fill="#e5dfcc"
          />
        </g>
      ) : (
        <g>
          <path
            data-contact-surface
            d={`M ${X(0.02)} ${Y(drop + radius) + 0.5} H ${Math.min(w - 13, X(final.x + 0.14))}`}
            stroke="#b1a17f"
            strokeWidth="1"
          />
          <path
            d={`M ${X(0.02)} ${Y(drop + radius) + 0.5} H ${Math.min(w - 13, X(final.x + 0.14))} V ${Y(drop + radius) + 6} H ${X(0.02)} Z`}
            fill="#d9cbae"
          />
        </g>
      )}
      {recordMarks > 0 &&
        PROJECTILE_RECORDS.slice(1, recordMarks + 1).map((r) => (
          <circle
            key={r.id}
            data-fixed-record={r.id}
            cx={X(r.x)}
            cy={Y(r.y)}
            r="3"
            fill={gold}
            opacity=".8"
          />
        ))}
      {previousContact && (
        <g data-previous-contact data-x={previousContact.x} data-y={previousContact.y}>
          <path
            d={`M ${X(previousContact.x) - 4} ${Y(previousContact.y)} H ${X(previousContact.x) + 4} M ${X(previousContact.x)} ${Y(previousContact.y) - 4} V ${Y(previousContact.y) + 4}`}
            stroke={soft}
            strokeWidth="1.5"
          />
          <Text
            x={X(previousContact.x) + 10}
            y={Y(previousContact.y) - 13}
            anchor="start"
            color={soft}
          >
            {tr('旧记录', 'Earlier mark')}
          </Text>
        </g>
      )}
      {visibleTime > 0 && <path d={line(trace)} stroke={blue} strokeWidth="1.5" fill="none" />}
      {prediction && (
        <g data-predicted-contact>
          <circle
            cx={X(final.x)}
            cy={Y(final.y)}
            r="8"
            fill="none"
            stroke={blue}
            strokeDasharray="3 3"
          />
          <Text
            x={Math.min(w - 14, Math.max(80, X(final.x)))}
            y={Math.max(22, Y(final.y) - 15)}
            anchor="middle"
            color={blue}
          >
            {wall ? `y = ${final.y.toFixed(3)} m` : `x = ${final.x.toFixed(2)} m`}
          </Text>
        </g>
      )}
      <Ball x={X(q.x)} y={Y(q.y)} r={R} />
      {result && (
        <circle
          data-contact-result
          cx={X(final.x)}
          cy={Y(final.y)}
          r={R + 3}
          fill="none"
          stroke={gold}
        />
      )}
      {kind === 'speed' && q.arrived && drop === PROJECTILE_RULER.drop && (
        <g>
          <path
            d={`M ${X(0) - 13} ${Y(0)} V ${Y(drop)} M ${X(0) - 17} ${Y(0)} H ${X(0) - 9} M ${X(0) - 17} ${Y(drop)} H ${X(0) - 9}`}
            stroke={blue}
          />
          <path
            d={`M ${X(0)} ${Y(drop) + 20} H ${X(final.x)} M ${X(0)} ${Y(drop) + 16} V ${Y(drop) + 24} M ${X(final.x)} ${Y(drop) + 16} V ${Y(drop) + 24}`}
            stroke={blue}
          />
          <Text x={X(0) - 20} y={Y(drop / 2)} anchor="end">
            0.80 m
          </Text>
          <Text x={(X(0) + X(final.x)) / 2} y={Math.min(h - 12, Y(drop) + 42)} anchor="middle">
            0.56 m
          </Text>
        </g>
      )}
      {!narrow && (
        <g>
          {knownClock && (
            <>
              <Text x={w * 0.78} y={82} anchor="middle" color={blue}>
                v₀ = {speed.toFixed(3)} m/s
              </Text>
              <Text x={w * 0.78} y={124} anchor="middle">
                t = {visibleTime.toFixed(3)} s
              </Text>
            </>
          )}
          <Text x={w * 0.78} y={166} anchor="middle">
            x = {Math.max(0, q.x).toFixed(3)} m
          </Text>
          <Text x={w * 0.78} y={208} anchor="middle" color={gold}>
            y = {Math.max(0, q.y).toFixed(3)} m
          </Text>
        </g>
      )}
      {kind !== 'speed' && (
        <Tag x={w / 2} y={h - 8}>
          {wall
            ? tr('墙面距离按球心校正', 'Wall distance: centre corrected')
            : manual
              ? tr('首次接触即停帧', 'Freeze at first contact')
              : tr('同一初速度 · 改变接球位置', 'Same launch · move the catcher')}
        </Tag>
      )}
    </g>
  );
}
function Strobe({
  w,
  h,
  time,
  projections,
  speed,
  drop,
}: {
  w: number;
  h: number;
  time: number;
  projections: boolean;
  speed: number;
  drop: number;
}) {
  const scale = Math.min(
      (w - 78) / Math.max(0.65, speed * coordinateTime(drop)),
      (h - 70) / Math.max(0.85, drop),
    ),
    X = (x: number) => 42 + x * scale,
    Y = (y: number) => 30 + y * scale,
    q = horizontalProjectile(time, speed, drop),
    dots = Array.from({ length: Math.floor(q.time / 0.05 + 1e-8) + 1 }, (_, i) =>
      horizontalProjectile(i * 0.05, speed, drop),
    );
  return (
    <g>
      <path d={`M 42 22 V ${h - 30} M 34 30 H ${w - 12}`} stroke={soft} />
      {dots.map((p, i) => (
        <g key={i} data-strobe-record={i}>
          <path
            d={`M ${X(p.x)} ${Y(p.y)} V 30 M 42 ${Y(p.y)} H ${X(p.x)}`}
            stroke={pale}
            strokeDasharray="3 5"
          />
          <circle cx={X(p.x)} cy={Y(p.y)} r="3.5" fill={gold} />
          {projections && i > 0 && (
            <>
              <path
                d={`M ${X(dots[i - 1].x) + 1} 19 H ${X(p.x) - 1}`}
                stroke={blue}
                strokeWidth="3"
              />
              <path
                d={`M 29 ${Y(dots[i - 1].y) + 1} V ${Y(p.y) - 1}`}
                stroke={gold}
                strokeWidth="3"
              />
            </>
          )}
        </g>
      ))}
      <Ball x={X(q.x)} y={Y(q.y)} r={5} />
      <Text x={w - 15} y={h - 9} anchor="end">
        Δt = 0.05 s
      </Text>
      {projections && (
        <Text x={w - 15} y={52} anchor="end" color={blue}>
          {tr('水平等距', 'Equal x steps')}
        </Text>
      )}
    </g>
  );
}
function Pair({
  w,
  h,
  time,
  speed,
  drop,
}: {
  w: number;
  h: number;
  time: number;
  speed: number;
  drop: number;
}) {
  const scale = Math.min(
      (w - 95) / Math.max(1.12, speed * coordinateTime(drop)),
      (h - 70) / Math.max(0.8, drop),
    ),
    oy = 37,
    ox = w < 560 ? 71 : w * 0.29,
    droppedX = ox - 28,
    q = horizontalProjectile(time, speed, drop),
    y = oy + q.y * scale,
    R = PROJECTILE_RADIUS * scale;
  return (
    <g data-pair-time={q.time} data-pair-y={q.y}>
      <path d={`M 26 ${oy + drop * scale + R + 0.5} H ${w - 12}`} stroke={soft} strokeWidth="1" />
      <path
        d={`M 30 ${oy + drop * scale + R + 1} H ${w - 12} V ${oy + drop * scale + R + 5} H 30 Z`}
        fill={pale}
      />
      <path
        data-release-frame
        d={`M ${droppedX - 9} ${oy - R - 7} V ${oy - R - 18} H ${ox - R - 3}`}
        stroke="#a2b8a9"
        strokeWidth="3"
        fill="none"
      />
      <path
        data-spring-strip
        d={`M ${ox - R - 3} ${oy - R - 18} Q ${ox - R - 9 + 6 * Math.exp(-q.time * 40)} ${oy - R - 7} ${ox - R - 1} ${oy}`}
        stroke={gold}
        strokeWidth="2"
        fill="none"
      />
      <path d={`M ${droppedX} ${y} H ${ox + q.x * scale}`} stroke={blue} strokeDasharray="3 4" />
      <Ball x={droppedX} y={y} r={R} color={blue} />
      <Ball x={ox + q.x * scale} y={y} r={R} />
      <Text x={droppedX - 3} y={21} anchor="middle" color={blue}>
        0
      </Text>
      <Text x={Math.max(105, w * 0.59)} y={21} anchor="middle">
        vₓ = {speed.toFixed(1)} m/s
      </Text>
      <Text x={w / 2} y={h - 13} anchor="middle">
        {q.arrived ? tr('同时接触地面', 'Same contact time') : `y₁ = y₂ = ${q.y.toFixed(3)} m`}
      </Text>
    </g>
  );
}
function Coordinates({
  w,
  h,
  revealed,
  inference,
}: {
  w: number;
  h: number;
  revealed: number;
  inference: boolean;
}) {
  const x1 = w * 0.15,
    x2 = w * 0.5,
    x3 = w * 0.85;
  return (
    <g data-coordinate-records={revealed}>
      <Text x={x1} y={23} anchor="middle" color={gold}>
        y / m
      </Text>
      <Text x={x2} y={23} anchor="middle" color={blue}>
        {inference ? 't / s' : '√(2y/g)'}
      </Text>
      <Text x={x3} y={23} anchor="middle">
        x / m
      </Text>
      {PROJECTILE_RECORDS.slice(1, revealed + 1).map((r, i) => (
        <g key={r.id} data-fixed-record={r.id}>
          <path d={`M 16 ${40 + i * 33} H ${w - 16}`} stroke={pale} />
          <Text x={x1} y={61 + i * 33} anchor="middle" color={gold}>
            {r.y.toFixed(3)}
          </Text>
          <Text x={x2} y={61 + i * 33} anchor="middle" color={blue}>
            {r.time.toFixed(1)}
          </Text>
          <Text x={x3} y={61 + i * 33} anchor="middle">
            {r.x.toFixed(2)}
          </Text>
        </g>
      ))}
      {inference && (
        <Text x={w / 2} y={h - 9} anchor="middle">
          Δx / Δt = 0.14 / 0.1 = 1.4 m/s
        </Text>
      )}
    </g>
  );
}
function Forces({
  w,
  h,
  time,
  onlyForce = false,
  speed,
}: {
  w: number;
  h: number;
  time: number;
  onlyForce?: boolean;
  speed: number;
}) {
  const q = projectileVelocity(time, speed),
    cx = w < 560 ? w * 0.3 : w * 0.42,
    cy = 42,
    // Reserve a text band below the longest velocity vector in both layouts.
    k = Math.min((w * 0.55 - 18) / Math.max(speed, 1.4), (h - 110) / 3.92),
    dx = q.vx * k,
    dy = q.vy * k;
  return (
    <g data-vx={q.vx} data-vy={q.vy} data-force-y={q.fy}>
      <path d={`M ${cx - 24} ${cy} H ${w - 20}`} stroke={pale} strokeDasharray="4 5" />
      <Ball x={cx} y={cy} r={10} />
      {onlyForce ? (
        <>
          <Arrow x={cx} y={cy + 13} dx={0} dy={67} color={gold} width={3} />
          <Text x={cx + 17} y={cy + 62} color={gold}>
            mg
          </Text>
          <Text x={w * 0.72} y={80} anchor="middle">
            Fₓ = 0
          </Text>
          <Text x={w * 0.72} y={113} anchor="middle">
            aₓ = 0
          </Text>
          <Text x={w * 0.72} y={146} anchor="middle">
            aᵧ = g
          </Text>
        </>
      ) : (
        <>
          <Arrow x={cx} y={cy} dx={dx} dy={0} color={blue} />
          <Arrow x={cx + dx} y={cy} dx={0} dy={dy} color={gold} />
          <Arrow x={cx} y={cy} dx={dx} dy={dy} color={ink} width={2.5} />
          <Text x={cx + dx / 2} y={cy - 13} color={blue} anchor="middle">
            vₓ
          </Text>
          <Text x={cx + dx + 12} y={cy + Math.max(26, dy / 2)} color={gold}>
            vᵧ
          </Text>
          <Text x={w / 2} y={h - 35} anchor="middle" color={blue}>
            vₓ = {q.vx.toFixed(2)} m/s
          </Text>
          <Text x={w / 2} y={h - 10} anchor="middle" color={gold}>
            vᵧ = gt = {q.vy.toFixed(2)} m/s
          </Text>
        </>
      )}
    </g>
  );
}
function Parabola({
  w,
  h,
  phase,
  reveal,
  prediction,
  candidate,
}: {
  w: number;
  h: number;
  phase: string;
  reveal: boolean;
  prediction: boolean;
  candidate: 'linear' | 'quadratic';
}) {
  if (phase === 'records')
    return (
      <g>
        <Text x={w * 0.3} y={26} anchor="middle">
          x / m
        </Text>
        <Text x={w * 0.7} y={26} anchor="middle" color={gold}>
          y / m
        </Text>
        {PROJECTILE_RECORDS.slice(1, 4).map((r, i) => (
          <g key={r.id} data-fixed-record={r.id}>
            <path d={`M 24 ${49 + i * 43} H ${w - 24}`} stroke={pale} />
            <Text x={w * 0.3} y={77 + i * 43} anchor="middle">
              {r.x.toFixed(2)}
            </Text>
            <Text x={w * 0.7} y={77 + i * 43} anchor="middle" color={gold}>
              {r.y.toFixed(3)}
            </Text>
          </g>
        ))}
        <Tag x={w / 2} y={h - 9}>
          {tr('原点：抛出时的球心', 'Origin: launch centre')}
        </Tag>
      </g>
    );
  if (phase === 'mechanism')
    return (
      <g>
        <Text x={w / 2} y={47} anchor="middle" color={blue}>
          x = v₀t
        </Text>
        <Text x={w / 2} y={88} anchor="middle" color={gold}>
          y = ½gt²
        </Text>
        <Text x={w / 2} y={129} anchor="middle">
          t = x / v₀
        </Text>
        <Text x={w / 2} y={177} anchor="middle">
          y = [g / (2v₀²)] x²
        </Text>
      </g>
    );
  const sx = (w - 88) / 0.6,
    sy = (h - 65) / 0.9,
    X = (x: number) => 51 + x * sx,
    Y = (y: number) => 28 + y * sy,
    limit = prediction ? 0.56 : 0.42;
  return (
    <g data-parabola-records={reveal ? 4 : 3} data-candidate={candidate}>
      <path d={`M 51 22 V ${h - 32} M 45 28 H ${w - 15}`} stroke={soft} />
      <Text x={7} y={20}>
        x / m
      </Text>
      {[0.14, 0.28, 0.42, ...(prediction ? [0.56] : [])].map((v) => (
        <Text key={v} x={X(v)} y={20} anchor="middle">
          {v.toFixed(2)}
        </Text>
      ))}
      <Text x={7} y={h - 16}>
        y / m
      </Text>
      {[0.2, 0.4, 0.6, 0.8].map((a) => (
        <g key={a}>
          <path d={`M 47 ${Y(a)} H ${w - 18}`} stroke={pale} />
          <Text x={43} y={Y(a) + 5} anchor="end">
            {a.toFixed(1)}
          </Text>
        </g>
      ))}
      {phase !== 'records' && (
        <path
          d={line(
            Array.from({ length: 41 }, (_, i) => {
              const x = (limit * i) / 40;
              return { x: X(x), y: Y(projectileCandidate(x, candidate)) };
            }),
          )}
          fill="none"
          stroke={blue}
          strokeWidth="2"
        />
      )}
      {PROJECTILE_RECORDS.slice(1, reveal ? 5 : 4).map((r) => (
        <circle key={r.id} data-fixed-record={r.id} cx={X(r.x)} cy={Y(r.y)} r="4" fill={gold} />
      ))}
      {prediction && (
        <circle
          data-predicted-point
          cx={X(0.56)}
          cy={Y(projectileCandidate(0.56, candidate))}
          r="8"
          fill="none"
          stroke={blue}
          strokeDasharray="3 3"
        />
      )}
      <Text x={w - 17} y={h - 10} anchor="end">
        {phase === 'records'
          ? tr('固定教学坐标', 'Fixed teaching points')
          : candidate === 'linear'
            ? 'y = 0.35x'
            : 'y = 2.50x²'}
      </Text>
    </g>
  );
}
function Sensor({
  w,
  h,
  time,
  speed,
  drop,
}: {
  w: number;
  h: number;
  time: number;
  speed: number;
  drop: number;
}) {
  // Each pulse is a snapshot at its emission time. Two fixed circles localize that same source event.
  const q = horizontalProjectile(time, speed, drop),
    r = projectileRanges(q.x, q.y),
    c = recoverFromRanges(r.r1, r.r2)!,
    span = Math.max(r.r1, r.r2, 0.7),
    lo = Math.min(r.y1 - r.r1, r.y2 - r.r2),
    hi = Math.max(r.y1 + r.r1, r.y2 + r.r2),
    scale = Math.min((w - 28) / (2 * span), (h - 56) / (hi - lo)),
    cx = w / 2,
    cy = (h + 8) / 2,
    X = (x: number) => cx + (x - r.bx) * scale,
    Y = (y: number) => cy + (y - (lo + hi) / 2) * scale;
  return (
    <g>
      <path d={`M ${X(r.bx)} ${Y(r.y1)} V ${Y(r.y2)}`} stroke={soft} strokeWidth="4" />
      {[
        { y: r.y1, r: r.r1 },
        { y: r.y2, r: r.r2 },
      ].map((z, i) => (
        <g key={i}>
          <circle
            cx={X(r.bx)}
            cy={Y(z.y)}
            r={z.r * scale}
            fill="none"
            stroke={i ? gold : blue}
            strokeWidth="1.5"
          />
          <circle cx={X(r.bx)} cy={Y(z.y)} r="4" fill={i ? gold : blue} />
        </g>
      ))}
      <circle cx={X(c.left.x)} cy={Y(c.left.y)} r="5" fill="none" stroke={soft} />
      <Ball x={X(c.right.x)} y={Y(c.right.y)} r={5} />
      <Text x={12} y={20}>
        d₁ = {r.r1.toFixed(3)} m
      </Text>
      <Text x={w - 12} y={h - 8} anchor="end">
        d₂ = {r.r2.toFixed(3)} m
      </Text>
    </g>
  );
}
function Buttons<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string, string][];
  label: string;
}) {
  return (
    <div className="projectile-cause-buttons" role="group" aria-label={label}>
      {options.map(([v, zh, en]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
          {tr(zh, en)}
        </button>
      ))}
    </div>
  );
}
export default function ProjectileMotionLab() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    [short, setShort] = useState(false),
    [mode, setMode] = useState<ProjectileMode>(() => projectileInitialMode(film.variant)),
    [speed, setSpeed] = useState(1.4),
    [drop, setDrop] = useState(0.784),
    [progress, setProgress] = useState(0.65),
    [candidate, setCandidate] = useState<'linear' | 'quadratic'>('quadratic'),
    [manualView, setManualView] = useState<'apparatus' | 'analysis'>('apparatus'),
    [newDrop, setNewDrop] = useState(0.2),
    [wall, setWall] = useState(0.28);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-height:700px)');
    const f = () => setShort(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  const h = w < 560 ? (short ? 220 : 260) : 320,
    shot = projectileShot(
      film.chapter,
      projectileSpeechProgress(
        film.chapter,
        film.chapterTime,
        browserLocale() === 'en' ? 'en' : 'zh',
      ),
    ),
    watch = film.watch,
    active = watch ? shot.mode : mode,
    physicalSpeed = watch ? shot.speed : active === 'speed' ? rulerPrediction().speed : speed,
    manualDrop =
      active === 'wall'
        ? (PROJECTILE_G / 2) * (wall / physicalSpeed) ** 2
        : active === 'speed'
          ? manualView === 'analysis'
            ? newDrop
            : 0.8
          : drop,
    currentDrop = watch ? shot.drop : manualDrop,
    time = watch ? shot.time : progress * coordinateTime(currentDrop),
    phase = watch
      ? shot.phase
      : active === 'forces'
        ? manualView === 'apparatus'
          ? 'force'
          : 'velocity'
        : manualView === 'analysis'
          ? 'inference'
          : 'motion',
    prediction = watch
      ? shot.showPrediction
      : active === 'board' || active === 'wall' || active === 'speed',
    reveal = watch ? shot.showResult : progress >= 1,
    ramp = useMemo(
      () => rollingLaunch((7 * physicalSpeed * physicalSpeed) / (10 * PROJECTILE_G)),
      [physicalSpeed],
    ),
    q = horizontalProjectile(time, physicalSpeed, currentDrop),
    ruler = rulerPrediction(0.8, 0.56, watch ? 0.2 : newDrop);
  let header: ReactNode,
    footer: ReactNode = tr('理想模型 · 忽略空气阻力', 'Ideal model · no air resistance');
  if (active === 'strobe') header = tr('盯住同一串等时点', 'Follow the same timed dots');
  else if (active === 'pair') header = `t = ${q.time.toFixed(3)} s`;
  else if (active === 'carbon') {
    header = tr('从下落量恢复同一时钟', 'Recover time from the drop');
    footer = tr('理想教学值', 'Ideal teaching values');
  } else if (active === 'forces')
    header =
      phase === 'force'
        ? tr('离手后，只剩重力', 'After release: gravity only')
        : tr('同一时钟，两分量速度', 'One clock, two velocity components');
  else if (active === 'board' || active === 'wall')
    header =
      phase === 'predict'
        ? tr('先预测，再释放', 'Predict before release')
        : phase === 'locked'
          ? tr('空心标记：预测', 'Outline: prediction')
          : active === 'wall'
            ? `x = ${(physicalSpeed * coordinateTime(currentDrop)).toFixed(2)} m`
            : `h = ${currentDrop.toFixed(3)} m`;
  else if (active === 'parabola') {
    header =
      phase === 'predict'
        ? tr('下一点在哪里？', 'Where is the next point?')
        : phase === 'reveal'
          ? tr('新点与预测相合', 'New point meets prediction')
          : tr('弯曲外形还不够', 'A curve alone is not enough');
    footer = tr('理想教学值', 'Ideal teaching values');
  } else if (active === 'sensor') {
    header = tr('一次发射，两条距离约束', 'One emission, two ranges');
    footer = tr('已知运动区在右侧', 'Known region: right of the receivers');
  } else
    header =
      phase === 'predict'
        ? `H = ${currentDrop.toFixed(2)} m · ?`
        : tr('刻度尺能给出初速度吗？', 'Can a ruler reveal launch speed?');
  const showInference = active === 'speed' && watch && phase === 'infer';
  return (
    <section className="projectile-cause-lab">
      <div
        className="projectile-cause-art"
        ref={host}
        data-projectile-mode={active}
        data-projectile-phase={phase}
        data-prediction={prediction}
        data-result={reveal}
        data-time={q.time}
        data-speed={physicalSpeed}
      >
        <div className="projectile-cause-header">{header}</div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
          role="img"
          aria-label={tr(
            '平抛的同一时钟、分量速度和新落点预测',
            'A shared clock, velocity components and a new landing prediction',
          )}
        >
          {active === 'strobe' && (
            <Strobe
              w={w}
              h={h}
              time={time}
              projections={watch ? phase === 'projections' : manualView === 'analysis'}
              speed={physicalSpeed}
              drop={currentDrop}
            />
          )}
          {active === 'pair' && (
            <Pair w={w} h={h} time={time} speed={physicalSpeed} drop={currentDrop} />
          )}
          {active === 'carbon' &&
            ((watch && phase !== 'marks') || (!watch && manualView === 'analysis') ? (
              <Coordinates w={w} h={h} revealed={4} inference={!watch || phase === 'inference'} />
            ) : (
              <World
                w={w}
                h={h}
                time={time}
                speed={physicalSpeed}
                drop={currentDrop}
                kind="carbon"
                rampTime={
                  watch ? undefined : progress * (ramp.duration + coordinateTime(currentDrop))
                }
                recordMarks={watch ? shot.revealed : 0}
                manual={!watch}
              />
            ))}
          {active === 'forces' && (
            <Forces
              w={w}
              h={h}
              time={time}
              speed={physicalSpeed}
              onlyForce={watch ? phase === 'force' : manualView === 'apparatus'}
            />
          )}
          {(active === 'board' || active === 'wall') && (
            <World
              w={w}
              h={h}
              time={time}
              speed={physicalSpeed}
              drop={currentDrop}
              kind={active}
              previousContact={watch ? shot.previousContact : undefined}
              prediction={prediction}
              result={reveal}
              manual={!watch}
            />
          )}
          {active === 'sensor' && (
            <Sensor w={w} h={h} time={time} speed={physicalSpeed} drop={currentDrop} />
          )}
          {active === 'parabola' && (
            <Parabola
              w={w}
              h={h}
              phase={watch ? phase : manualView === 'analysis' ? 'mechanism' : 'candidates'}
              reveal={watch ? reveal : progress >= 0.83}
              prediction={watch ? prediction : progress >= 0.66}
              candidate={
                watch
                  ? phase === 'candidates' && shot.progress < 0.34
                    ? 'linear'
                    : 'quadratic'
                  : candidate
              }
            />
          )}
          {active === 'speed' &&
            (showInference ? (
              <g>
                <Text x={w / 2} y={38} anchor="middle">
                  H = 0.80 m · L = 0.56 m
                </Text>
                <Text x={w / 2} y={82} anchor="middle" color={gold}>
                  t = √(2H/g) = {ruler.time.toFixed(3)} s
                </Text>
                {shot.progress >= 0.4 && (
                  <Text x={w / 2} y={126} anchor="middle" color={blue}>
                    v₀ = L/t = {ruler.speed.toFixed(3)} m/s
                  </Text>
                )}
                <Text x={w / 2} y={178} anchor="middle">
                  {tr('只用飞行数据', 'From flight measurements alone')}
                </Text>
              </g>
            ) : (
              <World
                w={w}
                h={h}
                time={time}
                speed={physicalSpeed}
                drop={currentDrop}
                kind="speed"
                knownClock={!watch || phase !== 'measure'}
                prediction={prediction}
                result={reveal}
                manual={!watch}
              />
            ))}
        </svg>
        <div className="projectile-cause-footer">{footer}</div>
      </div>
      {!watch && (
        <div className="projectile-cause-controls">
          <Buttons
            value={mode}
            onChange={(v) => {
              setMode(v);
              setProgress(0.65);
              setManualView('apparatus');
            }}
            label={tr('观察方式', 'View')}
            options={[
              ['strobe', '等时位置', 'Timed dots'],
              ['pair', '同时释放', 'Paired release'],
              ['forces', '受力与速度', 'Force and velocity'],
              ['carbon', '描点推断', 'Mark inference'],
              ['sensor', '双接收器', 'Two receivers'],
              ['board', '改变高度', 'Change height'],
              ['wall', '改变墙距', 'Move wall'],
              ['parabola', '检验抛物线', 'Test a parabola'],
              ['speed', '测初速度', 'Infer launch speed'],
            ]}
          />
          {['strobe', 'carbon', 'forces', 'parabola', 'speed'].includes(active) && (
            <Buttons
              value={manualView}
              onChange={setManualView}
              label={tr('观察层次', 'Detail')}
              options={[
                ['apparatus', '观察记录', 'Observe'],
                ['analysis', '解释与预测', 'Explain / predict'],
              ]}
            />
          )}
          {active !== 'parabola' &&
            active !== 'speed' &&
            !(active === 'carbon' && manualView === 'analysis') &&
            !(active === 'forces' && manualView === 'apparatus') && (
              <Range
                label={tr('水平初速度', 'Horizontal launch speed')}
                value={speed}
                min={0.7}
                max={2.8}
                step={0.1}
                unit="m/s"
                onChange={setSpeed}
              />
            )}
          {!['parabola', 'speed', 'wall', 'forces'].includes(active) &&
            !(active === 'carbon' && manualView === 'analysis') &&
            !(active === 'forces' && manualView === 'apparatus') && (
              <Range
                label={tr('球心下降量', 'Centre drop')}
                value={drop}
                min={0.196}
                max={0.8}
                step={0.001}
                unit="m"
                onChange={setDrop}
              />
            )}
          {active === 'wall' && (
            <Range
              label={tr('到墙前的球心位移', 'Centre travel to wall')}
              value={wall}
              min={0.1}
              max={Math.min(0.5, speed * coordinateTime(0.8))}
              step={0.01}
              unit="m"
              onChange={setWall}
            />
          )}
          {active === 'parabola' && manualView === 'apparatus' && (
            <Buttons
              value={candidate}
              onChange={setCandidate}
              label={tr('候选关系', 'Candidate relation')}
              options={[
                ['linear', '线性关系', 'Linear'],
                ['quadratic', '二次关系', 'Quadratic'],
              ]}
            />
          )}
          {active === 'speed' && manualView === 'analysis' && (
            <Range
              label={tr('预测用的新下降量', 'New drop for prediction')}
              value={newDrop}
              min={0.1}
              max={0.8}
              step={0.05}
              unit="m"
              onChange={setNewDrop}
            />
          )}
          {!(
            (active === 'forces' && manualView === 'apparatus') ||
            (['carbon', 'parabola'].includes(active) && manualView === 'analysis')
          ) && (
            <Range
              label={tr('演示进度', 'Demonstration progress')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          <p>
            {active === 'sensor'
              ? tr(
                  '圆对应同一次脉冲的发射位置；超声是单程测距，已知运动区域才排除镜像点。',
                  'Both circles refer to the same emission event. Ultrasound travels one way; the known region excludes the mirror point.',
                )
              : tr(
                  '理想模型不含空气阻力；在首次接触时停止，不模拟碰撞后的运动。球心是各坐标的共同基准。',
                  'This ideal model omits air resistance and stops at first contact. All coordinates refer to the ball centre; post-impact motion is not modeled.',
                )}
          </p>
        </div>
      )}
    </section>
  );
}

/** Catalog/social cover keeps the same clock and landing geometry as the film. */
export function ProjectileCoverArtwork() {
  return (
    <svg viewBox="0 0 400 230" fill="none" aria-hidden="true">
      <Pair w={400} h={230} time={0.27} speed={2.8} drop={0.784} />
    </svg>
  );
}
