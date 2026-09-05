import { useId } from 'react';
import { t } from '../../i18n';
import {
  FIBER_BITS,
  bitSignal,
  dielectric,
  flightTime,
  pulse,
  traceFiber,
  type RayPoint,
} from '../../models/fiber';
import { useCompact } from './useCompact';
export function FiberDrawing({
  angle,
  cladding,
  time,
  reveal,
  digital,
}: {
  angle: number;
  cladding: number;
  time: number;
  reveal: number;
  digital: boolean;
}) {
  const compact = useCompact(),
    id = useId().replace(/:/g, ''),
    width = compact ? 320 : 840;
  const length = compact ? 450 : 1200,
    ray = traceFiber(angle, cladding, length),
    scale = (width - 70) / length;
  const center = compact ? 115 : 135,
    map = (p: RayPoint) => ({ x: 35 + p.x * scale, y: center - p.y * scale });
  const path = (a: RayPoint, b: RayPoint) => {
    const p = map(a),
      q = map(b);
    return `M${p.x} ${p.y}L${q.x} ${q.y}`;
  };
  const head = ((time * 0.24) % 1) * ray.distance;
  return (
    <div className="fiber-drawing">
      <svg
        viewBox={`0 0 ${width} ${compact ? 260 : 300}`}
        role="img"
        aria-label={t('光线在纤芯边界反射或进入包层，位置和强度由折射模型计算')}
      >
        <defs>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#c1d4e5" stopOpacity=".3" />
            <stop offset=".5" stopColor="#8293bd" stopOpacity=".09" />
            <stop offset="1" stopColor="#c1d4e5" stopOpacity=".24" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        <rect
          x="35"
          y={center - 125 * scale}
          width={width - 70}
          height={250 * scale}
          rx="3"
          fill="#7b80a0"
          opacity={0.08 + (1 - reveal) * 0.62}
        />
        <rect
          x="35"
          y={center - 62.5 * scale}
          width={width - 70}
          height={125 * scale}
          fill={`url(#${id}-glass)`}
          stroke="#a1adc5"
          strokeOpacity=".27"
        />
        <rect
          x="35"
          y={center - 25 * scale}
          width={width - 70}
          height={50 * scale}
          fill="#a9d0dc"
          fillOpacity=".15"
          stroke="#c9e5e9"
          strokeOpacity=".7"
        />
        <path
          d={`M14 ${center + 21 * Math.tan((angle * Math.PI) / 180)}L35 ${center}`}
          stroke={digital && !bitSignal(time) ? '#556680' : '#edc485'}
          strokeWidth="2"
        />
        {ray.segments.map((s, i) => (
          <g key={i} opacity={Math.min(1, Math.sqrt(s.power))}>
            <path
              d={path(s.a, s.b)}
              stroke={digital ? '#667b97' : s.escaped ? '#de9b9c' : '#ead09f'}
              strokeWidth={s.escaped ? 1.4 : 2}
              fill="none"
              opacity={digital ? 0.4 : 0.75}
            />
            {!digital && head >= s.start && head <= s.end && (
              <circle
                cx={
                  map({
                    x: s.a.x + ((s.b.x - s.a.x) * (head - s.start)) / (s.end - s.start),
                    y: s.a.y + ((s.b.y - s.a.y) * (head - s.start)) / (s.end - s.start),
                  }).x
                }
                cy={
                  map({
                    x: s.a.x + ((s.b.x - s.a.x) * (head - s.start)) / (s.end - s.start),
                    y: s.a.y + ((s.b.y - s.a.y) * (head - s.start)) / (s.end - s.start),
                  }).y
                }
                r="3.5"
                fill="#fff0bf"
              />
            )}
            {digital &&
              !s.escaped &&
              Array.from({ length: Math.max(1, Math.ceil((s.end - s.start) / 10)) }, (_, j) => {
                const fraction = (j + 0.5) / Math.max(1, Math.ceil((s.end - s.start) / 10)),
                  distance = s.start + (s.end - s.start) * fraction;
                if (!bitSignal(time, (2 * distance) / ray.distance)) return null;
                const p = map({
                  x: s.a.x + (s.b.x - s.a.x) * fraction,
                  y: s.a.y + (s.b.y - s.a.y) * fraction,
                });
                return <circle key={j} cx={p.x} cy={p.y} r="2.4" fill="#ffe7ae" />;
              })}
          </g>
        ))}
        {ray.hits.map((p, i) => (
          <circle
            key={i}
            cx={map(p).x}
            cy={map(p).y}
            r="5"
            fill={p.tir ? '#ffe4b0' : '#dba0ae'}
            opacity={0.15 * Math.sqrt(p.power)}
            filter={`url(#${id}-glow)`}
          />
        ))}
        <path
          d={`M35 ${center + 125 * scale + 22}H${width - 35}`}
          stroke="#6f7894"
          strokeWidth="1"
        />
        <text
          x={width / 2}
          y={center + 125 * scale + 43}
          fill="#9aa7bd"
          textAnchor="middle"
          fontSize="13"
        >
          {compact ? '450 μm' : '1.2 mm'} · {t('轴向剖面')}
        </text>
      </svg>
      {digital && (
        <div className="fiber-bits">
          {[0, 2].map((delay) => (
            <div key={delay}>
              <span>{delay === 0 ? t('发出') : t('收到')}</span>
              <div aria-label={delay === 0 ? t('发送比特序列') : t('已接收的比特')}>
                {FIBER_BITS.map((bit, i) => (
                  <b
                    key={i}
                    data-arrived={time - delay >= i}
                    data-active={time - delay >= i && time - delay < i + 1}
                  >
                    {time - delay >= i ? bit : '·'}
                  </b>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function InterfaceDrawing({ degrees, time }: { degrees: number; time: number }) {
  const compact = useCompact(),
    width = compact ? 320 : 840,
    height = 340,
    cx = width / 2,
    cy = 155,
    length = compact ? 125 : 155;
  const angle = (degrees * Math.PI) / 180,
    state = dielectric(1.5, 1, angle);
  const incoming = { x: cx - length * Math.sin(angle), y: cy + length * Math.cos(angle) },
    reflected = { x: cx + length * Math.sin(angle), y: cy + length * Math.cos(angle) };
  const transmitted =
    state.transmitted === null
      ? null
      : {
          x: cx + length * Math.sin(state.transmitted),
          y: cy - length * Math.cos(state.transmitted),
        };
  const phase = (time / 3) % 1;
  const marker = (end: RayPoint, power: number) => (
    <circle
      cx={cx + (end.x - cx) * Math.max(0, phase * 2 - 1)}
      cy={cy + (end.y - cy) * Math.max(0, phase * 2 - 1)}
      r="3.5"
      fill="#fff1ce"
      opacity={Math.sqrt(power)}
    />
  );
  return (
    <svg
      className="fiber-interface"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('玻璃到空气的反射与折射，角度相对法线测量')}
    >
      <rect width={width} height={height} fill="#17223b" />
      <rect y={cy} width={width} height={height - cy} fill="#8199b0" fillOpacity=".17" />
      <path d={`M0 ${cy}H${width}`} stroke="#c5d5e1" strokeOpacity=".5" />
      <path d={`M${cx} 20V${height - 20}`} stroke="#8593ad" strokeDasharray="3 5" />
      <text x="18" y="29" fill="#9aaac1" fontSize="14">
        {t('空气')} · n = 1.00
      </text>
      <text x="18" y={height - 18} fill="#adbdce" fontSize="14">
        {t('玻璃')} · n = 1.50
      </text>
      <path d={`M${incoming.x} ${incoming.y}L${cx} ${cy}`} stroke="#e9c18d" strokeWidth="3" />
      <path
        d={`M${cx} ${cy}L${reflected.x} ${reflected.y}`}
        stroke="#f3d7a3"
        strokeWidth="3"
        opacity={Math.sqrt(state.reflectance)}
      />
      {transmitted && (
        <path
          d={`M${cx} ${cy}L${transmitted.x} ${transmitted.y}`}
          stroke="#a4d4dd"
          strokeWidth="3"
          opacity={Math.sqrt(state.transmittance)}
        />
      )}
      <path
        d={`M${cx} ${cy + 40}A40 40 0 0 1 ${cx - 40 * Math.sin(angle)} ${cy + 40 * Math.cos(angle)}`}
        fill="none"
        stroke="#dcc59f"
      />
      <circle cx={cx} cy={cy} r="4" fill="#f4e0b9" />
      {phase < 0.5 ? (
        <circle
          cx={incoming.x + (cx - incoming.x) * phase * 2}
          cy={incoming.y + (cy - incoming.y) * phase * 2}
          r="3.5"
          fill="#fff1ce"
        />
      ) : (
        <>
          {marker(reflected, state.reflectance)}
          {transmitted && marker(transmitted, state.transmittance)}
        </>
      )}
      <text x={cx + 10} y={cy + 62} fill="#e1d4b5" fontSize="17">
        {degrees.toFixed(1)}°
      </text>
    </svg>
  );
}
export function PulseDrawing({ progress }: { progress: number }) {
  const compact = useCompact(),
    width = compact ? 320 : 840,
    left = compact ? 34 : 60,
    right = width - 24;
  const amount = Math.max(0, Math.min(1, (progress - 0.12) / 0.65)),
    distance = 1000 * amount * amount * (3 - 2 * amount);
  const delays = [0, 4, 8].map((a) => (flightTime(distance, a) - flightTime(distance, 0)) * 1e9),
    map = (ns: number) => left + ((ns + 25) / 115) * (right - left);
  const curve = (fn: (t: number) => number, base: number, gain: number) =>
    Array.from({ length: 241 }, (_, i) => {
      const ns = -25 + (i * 115) / 240;
      return `${i ? 'L' : 'M'}${map(ns)} ${base - gain * fn(ns)}`;
    }).join(' ');
  return (
    <div className="fiber-pulses">
      <div className="fiber-pulse-heading">
        <span>
          {t('传播距离')}
          <br />
          {(distance / 1000).toFixed(2)} km
        </span>
        <strong>
          {(flightTime(distance, 0) * 1e6).toFixed(2)} μs <small>{t('起抵')}</small>
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${width} 300`}
        role="img"
        aria-label={t('三条路径的到达时间不同，叠加后的脉冲变宽')}
      >
        <text x={left} y="25" fill="#879bb6" fontSize="14">
          {t('入射脉冲')}
        </text>
        <path d={`M${left} 105H${right}`} stroke="#7890ac" strokeOpacity=".3" />
        <path
          d={curve((ns) => pulse(ns, 0, 6), 105, 60)}
          stroke="#b8d4e0"
          strokeWidth="2"
          fill="none"
        />
        <text x={left} y="146" fill="#879bb6" fontSize="14">
          {t('不同路径的叠加')}
        </text>
        <path d={`M${left} 244H${right}`} stroke="#7890ac" strokeOpacity=".3" />
        {delays.map((d, i) => (
          <path
            key={i}
            d={curve((ns) => pulse(ns, d, 6) / 3, 244, 60)}
            stroke={['#9ecfc8', '#baa5d4', '#d6b181'][i]}
            strokeWidth="1.6"
            opacity=".65"
            fill="none"
          />
        ))}
        <path
          d={curve((ns) => delays.reduce((v, d) => v + pulse(ns, d, 6) / 3, 0), 244, 60)}
          stroke="#ecd0a0"
          strokeWidth="2.5"
          fill="none"
        />
        {[0, 25, 50, 75].map((ns) => (
          <g key={ns}>
            <path d={`M${map(ns)} 244v5`} stroke="#71849b" />
            <text x={map(ns)} y="271" textAnchor="middle" fill="#9eafc2" fontSize="13">
              {ns}
            </text>
          </g>
        ))}
        <text x={right} y="294" textAnchor="end" fill="#9eafc2" fontSize="13">
          {t('相对最早到达')} / ns
        </text>
      </svg>
      <p>{t('同一束脉冲，三条几何路径')} · 0° / 4° / 8°</p>
    </div>
  );
}
