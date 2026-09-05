import { useId } from 'react';
import { t } from '../../i18n';
import {
  dopplerLength,
  type DopplerFocus,
  type DopplerFrame,
  type DopplerVector,
} from '../../models/doppler';

const ink = '#345b75',
  coral = '#ad533d',
  teal = '#176d68',
  gold = '#a36d1e';
export const dopplerPulseColor = (id: number) =>
  ['#345b75', '#a36d1e', '#647c92', '#7b6655'][((id % 4) + 4) % 4];

export function DopplerField({
  frame,
  focus,
  compact = false,
}: {
  frame: DopplerFrame;
  focus: DopplerFocus;
  compact?: boolean;
}) {
  const id = useId().replaceAll(':', '');
  const width = compact ? 320 : 900,
    height = compact ? 306 : 370;
  const halfWidth = Math.max(
    5.3,
    Math.abs(frame.source.x) + 1.2,
    Math.abs(frame.observer.x) + 1.2,
    (Math.abs(frame.observer.y) * width) / height + 1.2,
  );
  const scale = width / (2 * halfWidth),
    cx = width / 2,
    cy = height * (focus === 'bearing' ? 0.65 : 0.54);
  const project = (v: DopplerVector) => ({ x: cx + v.x * scale, y: cy - v.y * scale });
  const s = project(frame.source),
    o = project(frame.observer),
    past = project(frame.retarded.center);
  const minY = (cy - height) / scale,
    maxY = cy / scale;
  const visible = frame.wavefronts.filter((wave) => {
    const nearX = Math.max(-halfWidth, Math.min(halfWidth, wave.center.x));
    const nearY = Math.max(minY, Math.min(maxY, wave.center.y));
    const minDistance = Math.hypot(nearX - wave.center.x, nearY - wave.center.y);
    const maxDistance = Math.hypot(
      Math.max(Math.abs(-halfWidth - wave.center.x), Math.abs(halfWidth - wave.center.x)),
      Math.max(Math.abs(minY - wave.center.y), Math.abs(maxY - wave.center.y)),
    );
    return wave.radius >= minDistance && wave.radius <= maxDistance;
  });
  const sourceSpeed = frame.config.source.velocity.x,
    observerSpeed = frame.config.observer.velocity.x;
  const pair = frame.wavefronts.slice(-3, -1);
  const showSpacing = ['front', 'rear', 'limit', 'together'].includes(focus);
  const direction = sourceSpeed < 0 ? -1 : 1;
  const side = focus === 'rear' ? -direction : direction;
  const edge = pair.map((wave) =>
    project({ x: wave.center.x + side * wave.radius, y: wave.center.y }),
  );
  const spacingY = cy + (compact ? 58 : 70);
  const velocityArrow = (p: DopplerVector, speed: number, color: string) =>
    Math.abs(speed) > 0.001 && (
      <g stroke={color} fill="none" strokeWidth="1.7" strokeLinecap="round">
        <path
          d={`M ${p.x - Math.sign(speed) * 16} ${p.y - 25} h ${Math.sign(speed) * (24 + 25 * Math.abs(speed))}`}
        />
        <path
          d={`M ${p.x + Math.sign(speed) * (8 + 25 * Math.abs(speed))} ${p.y - 25} l ${-Math.sign(speed) * 6} -4 m ${Math.sign(speed) * 6} 4 l ${-Math.sign(speed) * 6} 4`}
        />
      </g>
    );
  return (
    <svg
      className="doppler-field"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('波圈以各自发射点为圆心，接收者与波圈相交时收到波峰。')}
    >
      <defs>
        <clipPath id={`${id}-crop`}>
          <rect x="0" y="0" width={width} height={height} rx="18" />
        </clipPath>
        <radialGradient id={`${id}-paper`}>
          <stop stopColor="#fffefa" />
          <stop offset="1" stopColor="#edf1ed" />
        </radialGradient>
      </defs>
      <rect width={width} height={height} rx="18" fill={`url(#${id}-paper)`} />
      <g clipPath={`url(#${id}-crop)`}>
        {Array.from(
          { length: Math.ceil(halfWidth) * 2 + 1 },
          (_, i) => i - Math.ceil(halfWidth),
        ).map((x) => (
          <path
            key={x}
            d={`M ${cx + x * scale} 0 V ${height}`}
            stroke="#547480"
            strokeOpacity=".075"
          />
        ))}
        <path
          d={`M 0 ${cy} H ${width}`}
          stroke="#547480"
          strokeOpacity=".28"
          strokeDasharray="3 6"
        />
        {observerSpeed !== 0 && frame.observer.y !== frame.source.y && (
          <path
            d={`M 0 ${o.y} H ${width}`}
            stroke={teal}
            strokeOpacity=".18"
            strokeDasharray="3 6"
          />
        )}
        {visible.map((wave) => {
          const center = project(wave.center);
          const active = wave.id === frame.previous.id || wave.id === frame.next.id;
          return (
            <g key={wave.id}>
              <circle
                cx={center.x}
                cy={center.y}
                r={wave.radius * scale}
                fill="none"
                stroke={active ? dopplerPulseColor(wave.id) : ink}
                strokeOpacity={active ? 0.82 : 0.21}
                strokeWidth={active ? 2.2 : 1.1}
              />
              {focus === 'centers' && wave.radius < 8 && (
                <g>
                  <circle cx={center.x} cy={center.y} r="3.5" fill={dopplerPulseColor(wave.id)} />
                  <path d={`M ${center.x} ${center.y + 7} v 10`} stroke={ink} strokeOpacity=".3" />
                </g>
              )}
            </g>
          );
        })}
        {focus === 'bearing' && (
          <g>
            <path
              d={`M ${s.x} ${s.y} L ${o.x} ${o.y}`}
              stroke={coral}
              strokeDasharray="3 6"
              strokeOpacity=".45"
            />
            <path d={`M ${past.x} ${past.y} L ${o.x} ${o.y}`} stroke={gold} strokeWidth="2.4" />
            <circle cx={past.x} cy={past.y} r="5" fill="#fff8e9" stroke={gold} strokeWidth="2" />
            <text
              x={Math.max(12, Math.min(width - 12, past.x - 5))}
              y={past.y + (past.x < 12 || past.x > width - 12 ? 64 : 34)}
              textAnchor={past.x > width - 12 ? 'end' : 'start'}
              fill={gold}
              fontSize={compact ? 23 : 22}
            >
              {past.x < 12 ? '← P' : past.x > width - 12 ? 'P →' : 'P'}
            </text>
          </g>
        )}
        {showSpacing &&
          edge.length === 2 &&
          Math.min(...edge.map((p) => p.x)) > 8 &&
          Math.max(...edge.map((p) => p.x)) < width - 8 && (
            <g stroke={gold} fill="none" strokeWidth="1.4">
              <path
                d={`M ${edge[0].x} ${cy + 10} V ${spacingY + 6} M ${edge[1].x} ${cy + 10} V ${spacingY + 6} M ${edge[0].x} ${spacingY} H ${edge[1].x}`}
              />
              <text
                x={(edge[0].x + edge[1].x) / 2}
                y={spacingY + 28}
                textAnchor="middle"
                fill={gold}
                stroke="none"
                fontSize={compact ? 23 : 22}
              >
                λ
              </text>
            </g>
          )}
        {velocityArrow(s, sourceSpeed, coral)}
        {velocityArrow(o, observerSpeed, teal)}
        <circle
          cx={s.x}
          cy={s.y}
          r={13 + frame.sourcePulse * 9}
          fill="none"
          stroke={coral}
          strokeOpacity={0.18 + frame.sourcePulse * 0.2}
        />
        <circle cx={s.x} cy={s.y} r="12" fill="#fff5ec" stroke={coral} strokeWidth="2" />
        <circle cx={s.x} cy={s.y} r={3.5 + frame.sourcePulse * 2} fill={coral} />
        <text
          x={s.x}
          y={s.y + (compact ? 34 : 37)}
          textAnchor="middle"
          fill={coral}
          fontSize={compact ? 23 : 22}
        >
          S
        </text>
        <circle
          cx={o.x}
          cy={o.y}
          r={14 + frame.arrivalPulse * 9}
          fill={teal}
          fillOpacity={frame.arrivalPulse * 0.1}
          stroke={teal}
          strokeOpacity={0.12 + frame.arrivalPulse * 0.2}
        />
        <path
          d={`M ${o.x} ${o.y - 12} l 12 12 -12 12 -12 -12 Z`}
          fill="#f6fffc"
          stroke={teal}
          strokeWidth="2"
        />
        <circle cx={o.x} cy={o.y} r={2.5 + frame.arrivalPulse * 3} fill={teal} />
        <text
          x={o.x}
          y={o.y + (compact ? 35 : 37)}
          textAnchor="middle"
          fill={teal}
          fontSize={compact ? 23 : 22}
        >
          O
        </text>
      </g>
      <g fill="#607478" fontSize={compact ? 22 : 19}>
        <path
          d={`M ${width - 26 - scale} ${height - 27} h ${scale} m 0 -4 v 8 m ${-scale} -8 v 8`}
          stroke="#7a8c8f"
          fill="none"
        />
        <text x={width - 26 - scale / 2} y={height - 39} textAnchor="middle">
          cT₀
        </text>
      </g>
    </svg>
  );
}

export function DopplerArrivalRuler({
  frame,
  compact = false,
}: {
  frame: DopplerFrame;
  compact?: boolean;
}) {
  const width = compact ? 320 : 900,
    height = compact ? 133 : 124;
  const left = compact ? 34 : 45,
    right = width - 12;
  const x = (time: number) =>
    left + ((time - frame.rulerStart) / (frame.rulerEnd - frame.rulerStart)) * (right - left);
  const now = x(frame.time);
  const inRange = (time: number) => time >= frame.rulerStart && time <= frame.rulerEnd;
  const lastEmission = Math.floor(frame.time / frame.config.period);
  const bracketStart = lastEmission - 2;
  return (
    <svg
      className="doppler-ruler"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('共用时间轴：上排等间隔发射，下排按真实传播时间记录到达。')}
    >
      <rect
        x={now}
        y="12"
        width={right - now}
        height={height - 23}
        rx="9"
        fill="#dde6e4"
        fillOpacity=".45"
      />
      <path
        d={`M ${left} 47 H ${right} M ${left} 98 H ${right}`}
        stroke="#9aa9a9"
        strokeWidth="1"
      />
      <text x="4" y="54" fill={coral} fontSize={compact ? 23 : 22}>
        S
      </text>
      <text x="4" y="105" fill={teal} fontSize={compact ? 23 : 22}>
        O
      </text>
      <path d={`M ${now} 13 V 114`} stroke={ink} strokeWidth="1.4" />
      <text x={now + 5} y="26" fill={ink} fontSize={compact ? 22 : 19}>
        t
      </text>
      <path
        d={`M ${x(bracketStart)} 26 v 6 m 0 -3 H ${x(bracketStart + 1)} m 0 -3 v 6`}
        stroke={coral}
        strokeWidth="1.3"
        fill="none"
      />
      <text
        x={(x(bracketStart) + x(bracketStart + 1)) / 2}
        y="20"
        textAnchor="middle"
        fill={coral}
        fontSize={compact ? 22 : 19}
      >
        T₀
      </text>
      {frame.events.map((event) => {
        const selected = event.id === frame.previous.id || event.id === frame.next.id;
        return (
          <g key={event.id}>
            {selected && inRange(event.emitted) && inRange(event.arrived) && (
              <path
                d={`M ${x(event.emitted)} 53 L ${x(event.arrived)} 92`}
                stroke={dopplerPulseColor(event.id)}
                strokeOpacity=".28"
                strokeWidth="1.3"
              />
            )}
            {inRange(event.emitted) && (
              <path
                d={`M ${x(event.emitted)} 40 v 14`}
                stroke={coral}
                strokeWidth="2"
                opacity={event.emitted > frame.time ? 0.5 : 1}
              />
            )}
            {inRange(event.arrived) && (
              <path
                d={`M ${x(event.arrived)} ${selected ? 86 : 91} V ${selected ? 110 : 105}`}
                stroke={selected ? dopplerPulseColor(event.id) : teal}
                strokeWidth={selected ? 2.8 : 1.5}
                opacity={event.arrived > frame.time ? 0.5 : 1}
              />
            )}
          </g>
        );
      })}
      <circle
        cx={now}
        cy="47"
        r={3 + 2 * frame.sourcePulse}
        fill={coral}
        fillOpacity={0.2 + frame.sourcePulse * 0.8}
      />
      <circle
        cx={now}
        cy="98"
        r={3 + 2 * frame.arrivalPulse}
        fill={teal}
        fillOpacity={0.2 + frame.arrivalPulse * 0.8}
      />
    </svg>
  );
}

export function dopplerVelocityLabel(frame: DopplerFrame) {
  return {
    source: (dopplerLength(frame.config.source.velocity) / frame.config.c).toFixed(2),
    observer: (dopplerLength(frame.config.observer.velocity) / frame.config.c).toFixed(2),
  };
}
