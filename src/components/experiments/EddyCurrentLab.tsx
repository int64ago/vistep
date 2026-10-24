import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  eddyDirector,
  oscillatorAccount,
  meterDamping,
  springDamping,
  discBraking,
  discLoop,
  frameDrive,
  frameFlux,
  tubeFall,
  tubeRing,
  type EddyShot,
  type DampingApparatus,
  type EddyView,
} from '../../models/eddy-current-lab';
import '../../styles/eddy-current-lab.css';
const names = {
  meter: ['微安表', 'Moving-coil meter'],
  frame: ['铝框与旋转磁体', 'Frame and rotating magnet'],
  disc: ['铜盘', 'Copper disc'],
  tube: ['完整与开缝铝管', 'Intact and slit tubes'],
  spring: ['弹簧磁体与线圈', 'Spring magnet and coil'],
} as const;
const views = {
  apparatus: ['追踪物体', 'Track motion'],
  loop: ['电流近看', 'Follow current'],
  energy: ['能量去向', 'Follow energy'],
  compare: ['相同初态', 'Same initial state'],
} as const;
function useNarrow() {
  const [n, set] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = window.matchMedia('(max-width: 640px)');
    const update = () => set(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  return n;
}
type Say = (zh: string, en: string) => string;
const tubeReference = (z: number) => Math.min(1, Math.max(0, (Math.floor(z / 0.04) + 1) * 0.04));
const round = (x: number, n = 2) => (Math.abs(x) < 0.5 * 10 ** -n ? 0 : x).toFixed(n);
function Magnet({
  x,
  y,
  width = 26,
  height = 44,
  polarity = 1,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  polarity?: number;
}) {
  return (
    <g data-part="magnet" data-center-y={y}>
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx="4"
        fill="#aec7bd"
        stroke="#648d81"
      />
      <path
        d={`M${x - width / 2} ${y}h${width}v${height / 2 - 4}q0 4 -4 4h${-width + 8}q-4 0 -4 -4Z`}
        fill="#d6aa8a"
      />
      <text x={x} y={y - 7} textAnchor="middle">
        {polarity > 0 ? 'S' : 'N'}
      </text>
      <text x={x} y={y + 18} textAnchor="middle">
        {polarity > 0 ? 'N' : 'S'}
      </text>
    </g>
  );
}
function Arrow({
  x,
  y,
  dx,
  dy,
  color = '#687f87',
  label,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  label?: string;
}) {
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return null;
  const ux = dx / len,
    uy = dy / len;
  return (
    <g data-vector={label}>
      <path
        d={`M${x} ${y}l${dx} ${dy}m${-8 * ux + 4 * uy} ${-8 * uy - 4 * ux}l${8 * ux - 4 * uy} ${8 * uy + 4 * ux}l${-8 * ux - 4 * uy} ${-8 * uy + 4 * ux}`}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {label && (
        <text x={x + dx / 2 - uy * 13} y={y + dy / 2 + ux * 13} textAnchor="middle" fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}
function LoopArrow({
  x,
  y,
  rx = 30,
  ry = 13,
  current,
  open = false,
}: {
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  current: number;
  open?: boolean;
}) {
  const active = Math.abs(current) > 1e-10;
  return (
    <g data-loop-current={current} data-loop-closed={!open}>
      <path
        d={
          open
            ? `M${x + rx * 0.65} ${y + ry * 0.76}A${rx} ${ry} 0 1 0 ${x - rx * 0.65} ${y + ry * 0.76}`
            : `M${x + rx} ${y}A${rx} ${ry} 0 1 1 ${x - rx} ${y}A${rx} ${ry} 0 1 1 ${x + rx} ${y}`
        }
        fill="none"
        stroke={active ? '#ad7659' : '#bdc6bd'}
        strokeWidth={active ? 3 : 2}
      />
      {active && !open && (
        <Arrow
          x={x + (current > 0 ? 10 : -10)}
          y={y + ry}
          dx={current > 0 ? -20 : 20}
          dy={0}
          color="#ad7659"
        />
      )}
    </g>
  );
}
function Meter({
  shot,
  cx,
  cy,
  id,
  loop = false,
}: {
  shot: EddyShot;
  cx: number;
  cy: number;
  id: string;
  loop?: boolean;
}) {
  const s = oscillatorAccount('meter', shot.time, shot.enabled),
    angle = s.position;
  return (
    <g data-object="meter" data-position={angle} data-current={s.current}>
      <path
        d={`M${cx - 90} ${cy + 70}V${cy - 37}Q${cx - 90} ${cy - 100} ${cx} ${cy - 100}T${cx + 90} ${cy - 37}V${cy + 70}Z`}
        fill={`url(#${id}-case)`}
        stroke="#b6c5ba"
      />
      <path
        d={`M${cx - 70} ${cy - 6}Q${cx} ${cy - 79} ${cx + 70} ${cy - 6}`}
        fill="none"
        stroke="#a6b9ad"
        strokeWidth="3"
      />
      {[-0.6, -0.3, 0, 0.3, 0.6].map((a) => (
        <path
          key={a}
          d={`M${cx + Math.sin(a) * 80} ${cy + 28 - Math.cos(a) * 80}l${Math.sin(a) * 8} ${-Math.cos(a) * 8}`}
          stroke="#6a8477"
        />
      ))}
      <path
        data-meter-pointer="true"
        d={`M${cx} ${cy + 28}l${Math.sin(angle) * 84} ${-Math.cos(angle) * 84}`}
        stroke="#9b7656"
        strokeWidth="3"
      />
      <circle cx={cx} cy={cy + 28} r="5" fill="#789688" />
      {loop ? (
        <>
          <rect x={cx - 64} y={cy - 7} width="23" height="45" rx="7" fill="#aec7bd" />
          <rect x={cx + 41} y={cy - 7} width="23" height="45" rx="7" fill="#d6aa8a" />
          <text x={cx - 53} y={cy + 20} textAnchor="middle">
            N
          </text>
          <text x={cx + 53} y={cy + 20} textAnchor="middle">
            S
          </text>
          <path
            data-coil="meter"
            d={`M${cx - 28 * Math.cos(angle)} ${cy - 3}V${cy + 39}H${cx + 28 * Math.cos(angle)}V${cy - 3}Z`}
            fill="#eaf0e4bb"
            stroke="#aa805f"
            strokeWidth="3"
          />
          <path
            data-terminal-wires="meter"
            d={`M${cx - 28 * Math.cos(angle)} ${cy + 39}L${cx - 43} ${cy + 62}V${cy + 92}H${cx - 16}M${cx + 28 * Math.cos(angle)} ${cy + 39}L${cx + 43} ${cy + 62}V${cy + 92}H${cx + 16}`}
            fill="none"
            stroke="#8d9e89"
            strokeWidth="2.5"
          />
          {Math.abs(s.current) > 1e-7 && (
            <Arrow
              x={cx - 28 * Math.cos(angle)}
              y={cy + 18}
              dx={0}
              dy={s.current > 0 ? 15 : -15}
              color="#ad7659"
            />
          )}
        </>
      ) : (
        <>
          <text x={cx} y={cy + 55} textAnchor="middle">
            μA
          </text>
          <path
            d={`M${cx - 43} ${cy + 62}V${cy + 92}H${cx - 16}M${cx + 43} ${cy + 62}V${cy + 92}H${cx + 16}`}
            fill="none"
            stroke="#8d9e89"
            strokeWidth="2.5"
          />
        </>
      )}
      <circle cx={cx - 43} cy={cy + 62} r="5" fill="#95b2a0" />
      <circle cx={cx + 43} cy={cy + 62} r="5" fill="#bb916b" />
      <path
        data-switch="meter"
        data-closed={shot.enabled}
        d={`M${cx - 16} ${cy + 92}L${cx + 16} ${cy + (shot.enabled ? 92 : 76)}`}
        stroke="#6d8a78"
        strokeWidth="3"
      />
    </g>
  );
}
function Frame({
  shot,
  cx,
  cy,
  id,
  loop = false,
}: {
  shot: EddyShot;
  cx: number;
  cy: number;
  id: string;
  loop?: boolean;
}) {
  const d = frameDrive(shot.time, shot.direction * 1.6),
    angle = shot.held ? d.magnetAngle - 0.65 : d.angle,
    slip = shot.held ? 0 : d.slip,
    f = frameFlux(d.magnetAngle - angle, slip),
    ma = d.magnetAngle;
  // Oblique projection of a vertical frame turning about z. Its normal and B share the horizontal plane.
  const P = (x: number, y: number, z: number) => [cx + x, cy + 0.42 * y - 0.75 * z] as const;
  const pole = (side: number, z: number) =>
    P(side * 87 * Math.cos(ma), side * 87 * Math.sin(ma), z);
  const corner = (u: number, z: number) => P(-u * Math.sin(angle), u * Math.cos(angle), z);
  const a = pole(-1, 0),
    b = pole(1, 0),
    at = pole(-1, 72),
    bt = pole(1, 72),
    top = P(0, 0, 115);
  const v = [corner(-38, -53), corner(38, -53), corner(38, 53), corner(-38, 53)],
    normal = P(48 * Math.cos(angle), 48 * Math.sin(angle), 0);
  return (
    <g
      data-object="frame"
      data-slip={slip}
      data-current={f.current}
      data-flux={f.flux}
      data-relative-angle={ma - angle}
    >
      <path
        d={`M${cx} ${cy - 105}V${cy + 91}M${cx - 45} ${cy + 91}H${cx + 45}`}
        stroke="#9aafa0"
        strokeWidth="4"
      />
      <path
        d={`M${a.join(' ')}L${at.join(' ')}Q${top.join(' ')} ${bt.join(' ')}L${b.join(' ')}`}
        fill="none"
        stroke="#adc2b3"
        strokeWidth="13"
      />
      <rect x={a[0] - 11} y={a[1] - 15} width="22" height="30" rx="5" fill="#8aaea0" />
      <rect x={b[0] - 11} y={b[1] - 15} width="22" height="30" rx="5" fill="#d2ac89" />
      <text x={a[0]} y={a[1] + 6} textAnchor="middle">
        N
      </text>
      <text x={b[0]} y={b[1] + 6} textAnchor="middle">
        S
      </text>
      <path
        data-frame-normal-x={Math.cos(angle)}
        data-frame-normal-y={Math.sin(angle)}
        data-rotor-angle={angle}
        d={v.map((p, i) => `${i ? 'L' : 'M'}${p.join(' ')}`).join(' ') + 'Z'}
        fill="none"
        stroke={`url(#${id}-case)`}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      {loop && (
        <>
          <Arrow
            x={cx - 35 * Math.cos(ma)}
            y={cy - 0.42 * 35 * Math.sin(ma)}
            dx={70 * Math.cos(ma)}
            dy={0.42 * 70 * Math.sin(ma)}
            color="#658f7b"
            label="B"
          />
          <path d={`M${cx} ${cy}L${normal.join(' ')}`} stroke="#ad8060" strokeDasharray="3 3" />
          {Math.abs(f.current) > 1e-8 && (
            <Arrow
              x={v[1][0]}
              y={v[1][1] - 20}
              dx={0}
              dy={f.current > 0 ? -22 : 22}
              color="#a67352"
            />
          )}
        </>
      )}
      <circle cx={cx} cy={cy} r="5" fill="#6f8e80" />
    </g>
  );
}
function Disc({ shot, cx, cy, id }: { shot: EddyShot; cx: number; cy: number; id: string }) {
  const d = discBraking(shot.time, shot.field),
    radius = 84,
    ry = 47;
  return (
    <g data-object="disc" data-omega={d.omega} data-em-torque={d.emTorque}>
      <path
        d={`M${cx} ${cy}V${cy + 100}M${cx - 45} ${cy + 100}H${cx + 45}`}
        stroke="#93a796"
        strokeWidth="6"
      />
      <ellipse cx={cx} cy={cy + 6} rx={radius} ry={ry} fill="#b28d66" />
      <ellipse cx={cx} cy={cy} rx={radius} ry={ry} fill={`url(#${id}-copper)`} stroke="#ac875f" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = d.angle + (i * Math.PI) / 3;
        return (
          <path
            key={i}
            d={`M${cx} ${cy}L${cx + radius * 0.88 * Math.cos(a)} ${cy + ry * 0.88 * Math.sin(a)}`}
            stroke="#e8d3b2"
            strokeWidth="2"
          />
        );
      })}
      <circle
        cx={cx + radius * 0.8 * Math.cos(d.angle)}
        cy={cy + ry * 0.8 * Math.sin(d.angle)}
        r="4"
        fill="#507f70"
      />
      <g transform={`translate(0 ${shot.field === 0 ? 70 : 0})`}>
        <path
          d={`M${cx + 64} ${cy - 23}H${cx + 113}V${cy + 25}H${cx + 64}V${cy + 15}H${cx + 98}V${cy - 13}H${cx + 64}Z`}
          fill="#aec2b2"
          stroke="#819b87"
        />
        <rect
          x={cx + 61}
          y={cy - 23}
          width="30"
          height="10"
          rx="3"
          fill={shot.field >= 0 ? '#8caf9c' : '#d1aa87'}
        />
        <rect
          x={cx + 61}
          y={cy + 15}
          width="30"
          height="10"
          rx="3"
          fill={shot.field >= 0 ? '#d1aa87' : '#8caf9c'}
        />
      </g>
    </g>
  );
}
function DiscDetail({ shot, w, say }: { shot: EddyShot; w: number; say: Say }) {
  const omega = shot.held ? 0 : discBraking(shot.time, shot.field).omega,
    a = discLoop(omega, shot.field, 1),
    b = discLoop(omega, shot.field, -1),
    cx = w / 2;
  return (
    <>
      <rect x={cx - 116} y="38" width="232" height="132" rx="23" fill="#d9bc90" />
      <rect x={cx - 35} y="38" width="70" height="132" fill="#a8c4b4" fillOpacity=".38" />
      {shot.field !== 0 &&
        [-20, 0, 20].flatMap((x) =>
          [62, 100, 138].map((y) => (
            <g key={x + ':' + y} data-field-mark="true">
              {shot.field >= 0 ? (
                <>
                  <circle cx={cx + x} cy={y} r="6" fill="none" stroke="#759884" />
                  <circle cx={cx + x} cy={y} r="1.5" fill="#759884" />
                </>
              ) : (
                <path d={`M${cx + x - 4} ${y - 4}l8 8m0 -8 -8 8`} stroke="#759884" />
              )}
            </g>
          )),
        )}
      {[
        { x: cx - 48, s: a, name: 'A' },
        { x: cx + 48, s: b, name: 'B' },
      ].map(({ x, s, name }) => (
        <g
          key={name}
          data-edge={s.edge}
          data-current={s.current}
          data-flux-rate={s.fluxRate}
          data-torque={s.force}
        >
          <rect
            x={x - 27}
            y="67"
            width="54"
            height="64"
            rx="13"
            fill="none"
            stroke="#a67252"
            strokeWidth="3"
          />
          {Math.abs(s.current) > 1e-9 && (
            <Arrow x={x} y={67} dx={s.current > 0 ? -20 : 20} dy={0} color="#a67252" />
          )}
          <text x={x} y="157" textAnchor="middle">
            {name} · {s.fluxRate > 0 ? 'Φ↑' : s.fluxRate < 0 ? 'Φ↓' : 'Φ →'}
          </text>
        </g>
      ))}
      <Arrow x={cx - 30} y={22} dx={omega > 0 ? 60 : 0} dy={0} label="v" />
      <Arrow
        x={cx + 30}
        y={195}
        dx={omega > 0 && shot.field !== 0 ? -60 : 0}
        dy={0}
        color="#718b9d"
        label="F"
      />
      <text x={cx} y="235" textAnchor="middle">
        {say('局部等效环 · 同一盘面', 'Equivalent loops · one surface')}
      </text>
    </>
  );
}
function Tube({
  shot,
  cx,
  cy,
  id,
  loop = false,
  w,
  say,
}: {
  shot: EddyShot;
  cx: number;
  cy: number;
  id: string;
  loop?: boolean;
  w: number;
  say: Say;
}) {
  const f = tubeFall(shot.time, shot.enabled),
    z = shot.held ? 0.5 : f.position,
    v = shot.held ? 0 : f.velocity,
    scale = loop ? 650 : 170,
    center = loop ? cy : cy - 80 + z * 170,
    top = loop ? 25 : cy - 80,
    bottom = loop ? 215 : cy + 90,
    rx = loop ? 60 : 33;
  const rings = Array.from({ length: 26 }, (_, i) => {
    const ringZ = i * 0.04,
      y = loop ? cy + (ringZ - z) * scale : cy - 80 + ringZ * scale;
    return { ringZ, y, s: tubeRing(ringZ, z, v, 1, !shot.enabled, 0.04) };
  }).filter((x) => x.y > top + 10 && x.y < bottom - 10);
  return (
    <g data-object="tube" data-position={z} data-velocity={v} data-slit={shot.enabled}>
      <rect
        x={cx - rx}
        y={top}
        width={rx * 2}
        height={bottom - top}
        rx="12"
        fill={`url(#${id}-case)`}
        fillOpacity=".45"
        stroke="#a0b7a6"
      />
      {rings.map(({ ringZ, y, s }) => (
        <g
          key={ringZ}
          data-ring-z={ringZ}
          data-reference-ring={Math.abs(ringZ - tubeReference(z)) < 1e-8}
          data-flux={s.flux}
          data-current={s.current}
        >
          <g opacity={0.3 + 0.7 * Math.min(1, Math.abs(s.current) / 5)}>
            <LoopArrow
              x={cx}
              y={y}
              rx={rx}
              ry={loop ? 14 : 8}
              current={s.current}
              open={shot.enabled}
            />
          </g>
          {loop && !shot.enabled && Math.abs(ringZ - tubeReference(z)) < 1e-8 && (
            <text x={cx + rx + 12} y={y + 6}>
              A
            </text>
          )}
        </g>
      ))}
      {shot.held && (
        <path
          data-external-holder="true"
          d={`M${cx - 22} ${top}h44M${cx} ${top}V${center - (loop ? 26 : 16)}`}
          stroke="#7f9686"
          strokeWidth="2"
        />
      )}
      <Magnet x={cx} y={center} width={loop ? 30 : 20} height={loop ? 52 : 32} />
      {shot.enabled && (
        <path d={`M${cx + rx * 0.6} ${top + 3}V${bottom - 3}`} stroke="#fafaf4" strokeWidth="7" />
      )}
      {loop ? (
        <>
          {f.landed && !shot.held && (
            <path
              data-catch-support="true"
              d={`M${cx - 42} ${cy + 29}h84`}
              stroke="#b7ab8b"
              strokeWidth="6"
              strokeLinecap="round"
            />
          )}
          <Arrow x={cx + rx + 35} y={cy - 32} dx={0} dy={v > 0 ? 50 : 0} label="v" />
          <Arrow
            x={cx - rx - 21}
            y={cy + 28}
            dx={0}
            dy={v > 0 ? -48 : 0}
            label="F"
            color="#ad7659"
          />
          {shot.enabled && (
            <>
              <g data-residual-loop="qualitative" opacity={v > 0 ? 1 : 0.3}>
                <path
                  d={`M${cx - rx + 16} ${cy + 41}c-15 0 -15 38 0 38c15 0 15 -38 0 -38`}
                  stroke="#b18b6d"
                  strokeWidth="2"
                  fill="none"
                />
                {v > 0 && <Arrow x={cx - rx + 5} y={cy + 59} dx={0} dy={12} color="#b18b6d" />}
              </g>
              <text x={w / 2} y="239" textAnchor="middle">
                {say('缝两侧仍可有局部回流', 'Local returns can remain')}
              </text>
            </>
          )}
        </>
      ) : (
        <>
          <path
            d={`M${cx - 42} ${cy + 109}h84`}
            stroke="#b7ab8b"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <text x={cx + 55} y={cy + 8}>
            1 m
          </text>
        </>
      )}
    </g>
  );
}
function Spring({
  shot,
  cx,
  cy,
  id,
  loop = false,
}: {
  shot: EddyShot;
  cx: number;
  cy: number;
  id: string;
  loop?: boolean;
}) {
  const s = oscillatorAccount('spring', shot.time, shot.enabled),
    center = cy + s.position * 500,
    top = center - 24,
    plane = cy + 39;
  return (
    <g data-object="spring" data-position={s.position} data-current={s.current}>
      <path
        d={`M${cx - 56} 20H${cx + 56}`}
        stroke="#9bafa0"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        data-spring-bottom={top}
        d={Array.from({ length: 121 }, (_, i) => {
          const q = i / 120;
          return `${i ? 'L' : 'M'}${cx + Math.sin(q * 16 * Math.PI) * 9} ${22 + q * (top - 22)}`;
        }).join(' ')}
        fill="none"
        stroke="#8fa596"
        strokeWidth="2.5"
      />
      <Magnet x={cx} y={center} width={27} height={48} />
      <path
        data-winding="spring"
        d={`M${cx - 32} ${plane + 10}A50 13 0 1 1 ${cx + 32} ${plane + 10}`}
        fill="none"
        stroke="#b58a62"
        strokeWidth="5"
      />
      <path
        data-coil-leads="spring"
        d={`M${cx - 32} ${plane + 10}L${cx - 72} ${plane + 26}V${plane + 43}H${cx - 15}M${cx + 32} ${plane + 10}L${cx + 72} ${plane + 26}V${plane + 43}H${cx + 15}`}
        fill="none"
        stroke="#8c9d8a"
        strokeWidth="2.5"
      />
      <path
        data-switch="spring"
        data-closed={shot.enabled}
        d={`M${cx - 15} ${plane + 43}L${cx + 15} ${plane + (shot.enabled ? 43 : 28)}`}
        stroke="#78917d"
        strokeWidth="3"
      />
      {loop && Math.abs(s.current) > 1e-8 && (
        <Arrow x={cx - 72} y={plane + 29} dx={0} dy={s.current > 0 ? 12 : -12} color="#a67352" />
      )}
    </g>
  );
}
function Energy({ shot, say }: { shot: EddyShot; say: Say }) {
  let rows: { label: string; value: number; color: string }[],
    total: number,
    unit = 'mJ';
  if (shot.held)
    return (
      <div className="ec20-energy" data-static-test="true">
        <p>
          {shot.apparatus === 'frame'
            ? say('同速瞬间：没有感应驱动', 'Equal-speed instant: no induced drive')
            : say('外部固定：磁通不再变化', 'Externally held: flux stops changing')}
        </p>
        <p>I = 0</p>
        <p>Pⱼ = 0 W</p>
        <p>
          {shot.apparatus === 'frame'
            ? 'τₑₘ = 0 N·m'
            : say('支持力平衡重力', 'Support balances gravity')}
        </p>
      </div>
    );
  if (shot.apparatus === 'frame') {
    const s = frameDrive(shot.time, shot.direction * 1.6),
      sync = shot.held;
    rows = [
      { label: say('外部输入', 'Drive input'), value: sync ? 0 : s.inputPower, color: '#9daf94' },
      {
        label: say('机械功率', 'Mechanical power'),
        value: sync ? 0 : s.mechanicalPower,
        color: '#7b9a91',
      },
      { label: say('焦耳热', 'Joule heat'), value: sync ? 0 : s.joulePower, color: '#c19a77' },
    ];
    total = 0.01024;
    unit = 'mW';
  } else if (shot.apparatus === 'tube') {
    const s = tubeFall(shot.time, shot.enabled);
    rows = [
      { label: say('重力释放', 'Gravity released'), value: s.gravityReleased, color: '#9daf94' },
      { label: say('磁体动能', 'Kinetic energy'), value: s.energy, color: '#7b9a91' },
      { label: say('焦耳热', 'Joule heat'), value: s.jouleHeat, color: '#c19a77' },
      { label: say('接收盘耗散', 'Catch dissipation'), value: s.catchHeat, color: '#a8a6a1' },
    ];
    total = 0.245;
  } else {
    const s =
      shot.apparatus === 'disc'
        ? discBraking(shot.time, shot.field)
        : oscillatorAccount(
            shot.apparatus === 'meter' ? 'meter' : 'spring',
            shot.time,
            shot.enabled,
          );
    rows = [
      { label: say('剩余机械能', 'Mechanical energy'), value: s.energy, color: '#7b9a91' },
      { label: say('焦耳热', 'Joule heat'), value: s.jouleHeat, color: '#c19a77' },
      { label: say('其他耗散', 'Other dissipation'), value: s.otherHeat, color: '#a8a6a1' },
    ];
    total = s.initialEnergy;
  }
  return (
    <div className="ec20-energy" data-energy-unit={unit}>
      {shot.apparatus === 'frame' && <p>{say('周期平均功率', 'Cycle-averaged power')}</p>}
      {rows.map((r) => (
        <div className="ec20-energy-row" key={r.label} data-energy-value={r.value}>
          <span>{r.label}</span>
          <strong>
            {round(r.value * 1000, shot.apparatus === 'meter' ? 3 : 2)} {unit}
          </strong>
          <div>
            <i
              style={{
                width: `${Math.max(0, Math.min(100, (r.value / total) * 100))}%`,
                background: r.color,
              }}
            />
          </div>
        </div>
      ))}
      <p className="ec20-balance">
        {shot.apparatus === 'frame'
          ? 'Pᵢₙ = Pₘₑ꜀ₕ + I²R'
          : shot.apparatus === 'tube'
            ? 'mgy = Eₖ + Q + E꜀ₐₜ꜀ₕ'
            : 'E₀ = Eₘₑ꜀ₕ + Q + Eₒₜₕₑᵣ'}
      </p>
    </div>
  );
}
function Comparison({ shot, w, say }: { shot: EddyShot; w: number; say: Say }) {
  const x0 = 30,
    x1 = w - 24,
    y0 = 45,
    height = 132,
    maxT =
      shot.apparatus === 'meter'
        ? 3
        : shot.apparatus === 'spring' || shot.apparatus === 'frame'
          ? 4
          : shot.apparatus === 'tube'
            ? 1.8
            : 3;
  const value = (t: number, altered: boolean) =>
    shot.apparatus === 'frame'
      ? altered
        ? frameDrive(t, shot.direction * 1.6).omega / 1.6
        : shot.direction
      : shot.apparatus === 'meter'
        ? meterDamping(t, altered).position / 0.5
        : shot.apparatus === 'spring'
          ? springDamping(t, altered).position / 0.045
          : shot.apparatus === 'tube'
            ? tubeFall(t, altered).position
            : discBraking(t, altered ? 0.3 : 0).omega / 15;
  const yy = (v: number) =>
    shot.apparatus === 'meter' || shot.apparatus === 'spring' || shot.apparatus === 'frame'
      ? y0 + height / 2 - (v * height) / 2
      : y0 + height - v * height;
  return (
    <>
      <path d={`M${x0} ${y0}V${y0 + height}H${x1}`} fill="none" stroke="#c2cbbf" />
      {[false, true].map((a) => {
        if (a && shot.question) return null;
        return (
          <path
            key={String(a)}
            data-compared-apparatus={shot.apparatus}
            data-comparison={a ? 'changed' : 'reference'}
            d={Array.from({ length: 121 }, (_, i) => {
              const t = (i / 120) * maxT;
              return `${i ? 'L' : 'M'}${x0 + ((x1 - x0) * i) / 120} ${yy(value(t, a))}`;
            }).join(' ')}
            fill="none"
            stroke={a ? '#648b79' : '#c4b79e'}
            strokeWidth="2.5"
          />
        );
      })}
      <path
        d={`M${x0 + ((x1 - x0) * Math.min(maxT, shot.time)) / maxT} ${y0}V${y0 + height}`}
        stroke="#9aa99c"
        strokeDasharray="4 4"
      />
      {[false, true].map((a) =>
        !a || !shot.question ? (
          <circle
            key={String(a)}
            cx={x0 + ((x1 - x0) * Math.min(maxT, shot.time)) / maxT}
            cy={yy(value(Math.min(maxT, shot.time), a))}
            r="4"
            fill={a ? '#648b79' : '#b6a184'}
          />
        ) : null,
      )}
      <text x={x0} y="22">
        {shot.apparatus === 'tube'
          ? 'y / m'
          : shot.apparatus === 'frame'
            ? 'ω / |Ω|'
            : shot.apparatus === 'disc'
              ? 'ω / ω₀'
              : say('位移 / 初始值', 'Displacement / initial')}
      </text>
      <text x={x1} y={y0 + height + 25} textAnchor="end">
        t / s
      </text>
      <text x={w / 2} y="233" textAnchor="middle">
        {shot.question ? (
          say('先预测，再显示另一条曲线', 'Predict before revealing the test')
        ) : (
          <>
            <tspan fill="#a18c71">
              {shot.apparatus === 'frame'
                ? say('磁体', 'Magnet')
                : shot.apparatus === 'tube'
                  ? say('完整管', 'Intact')
                  : shot.apparatus === 'disc'
                    ? 'B = 0'
                    : say('断路', 'Open')}
            </tspan>
            {' · '}
            <tspan fill="#648b79">
              {shot.apparatus === 'frame'
                ? say('铝框', 'Frame')
                : shot.apparatus === 'tube'
                  ? say('开缝管', 'Slit')
                  : shot.apparatus === 'disc'
                    ? '|B| = 0.3 T'
                    : say('闭合', 'Closed')}
            </tspan>
          </>
        )}
      </text>
    </>
  );
}
export function EddyArtwork({ shot, narrow, say }: { shot: EddyShot; narrow: boolean; say: Say }) {
  const id = useId().replace(/:/g, ''),
    w = narrow ? 280 : 640,
    h = narrow ? 252 : 275,
    cx = w / 2,
    cy = narrow ? 125 : 137;
  if (shot.view === 'energy') return <Energy shot={shot} say={say} />;
  return (
    <svg
      className="ec20-art"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={say(
        '从运动、感应电流到力与能量的同一模型',
        'One model links motion, induced current, force and energy',
      )}
    >
      <defs>
        <linearGradient id={`${id}-case`}>
          <stop stopColor="#a9bfb1" />
          <stop offset=".45" stopColor="#e1e9db" />
          <stop offset="1" stopColor="#9bb3a0" />
        </linearGradient>
        <radialGradient id={`${id}-copper`}>
          <stop stopColor="#ead6b2" />
          <stop offset="1" stopColor="#c7a271" />
        </radialGradient>
      </defs>
      {shot.view === 'compare' ? (
        <Comparison shot={shot} w={w} say={say} />
      ) : shot.apparatus === 'disc' && shot.view === 'loop' ? (
        <DiscDetail shot={shot} w={w} say={say} />
      ) : shot.apparatus === 'meter' ? (
        <Meter shot={shot} cx={cx} cy={cy} id={id} loop={shot.view === 'loop'} />
      ) : shot.apparatus === 'frame' ? (
        <Frame shot={shot} cx={cx} cy={cy} id={id} loop={shot.view === 'loop'} />
      ) : shot.apparatus === 'disc' ? (
        <Disc shot={shot} cx={cx - 13} cy={cy - 13} id={id} />
      ) : shot.apparatus === 'tube' ? (
        <Tube shot={shot} cx={cx} cy={cy} id={id} loop={shot.view === 'loop'} w={w} say={say} />
      ) : (
        <Spring shot={shot} cx={cx} cy={narrow ? 140 : 150} id={id} loop={shot.view === 'loop'} />
      )}
    </svg>
  );
}
export default function EddyCurrentLab() {
  const film = useShowcase(),
    narrow = useNarrow(),
    locale = browserLocale(),
    say: Say = (zh, en) => (locale === 'en' ? en : zh),
    directed = eddyDirector(film.chapter, film.chapterTime, locale),
    [manual, setManual] = useState<EddyShot | null>(null);
  const shot = film.watch ? directed : (manual ?? directed),
    patch = (p: Partial<EddyShot>) => setManual({ ...shot, ...p });
  const circuit =
    shot.apparatus === 'tube'
      ? shot.enabled
        ? say('纵向开缝', 'Longitudinal slit')
        : say('完整管壁', 'Intact wall')
      : shot.apparatus === 'frame'
        ? shot.held
          ? say('假设无转差', 'Zero-slip counterfactual')
          : say('外部转动磁体', 'Externally driven magnet')
        : shot.apparatus === 'disc'
          ? shot.field === 0
            ? say('磁体移开', 'Magnet removed')
            : say('磁极不接触铜盘', 'No pole contact')
          : shot.enabled
            ? say('回路闭合', 'Circuit closed')
            : say('回路断开', 'Circuit open');
  let readout = '',
    local = '';
  if (shot.apparatus === 'meter' || shot.apparatus === 'spring') {
    const s = oscillatorAccount(shot.apparatus, shot.time, shot.enabled);
    readout = `${shot.apparatus === 'meter' ? 'θ' : 'x'} = ${round(s.position * (shot.apparatus === 'spring' ? 1000 : 1), 3)} ${shot.apparatus === 'meter' ? 'rad' : 'mm'}`;
    local = `ε = ${round(s.emf * 1000, 2)} mV · I = ${round(s.current * 1000, 3)} mA`;
  }
  if (shot.apparatus === 'disc') {
    const s = discBraking(shot.time, shot.field);
    readout = `ω = ${round(s.omega)} rad/s`;
    local = `B = ${round(shot.field)} T · τ = ${round(s.emTorque * 1000)} mN·m`;
  }
  if (shot.apparatus === 'frame') {
    const s = frameDrive(shot.time, shot.direction * 1.6);
    readout = `Ω − ω = ${round(shot.held ? 0 : s.slip)} rad/s`;
    const f = frameFlux(s.magnetAngle - s.angle, shot.held ? 0 : s.slip);
    local = `ε = ${round(f.emf * 1000)} mV · I = ${round(f.current * 1000)} mA`;
  }
  if (shot.apparatus === 'tube') {
    const s = tubeFall(shot.time, shot.enabled),
      v = shot.held ? 0 : s.velocity,
      z = shot.held ? 0.5 : s.position,
      ring = tubeRing(tubeReference(z), z, v, 1, !shot.enabled, 0.04);
    readout = `v = ${round(v)} m/s`;
    local = shot.held
      ? say('磁通仍在 · ε = 0 · I = 0', 'Flux remains · ε = 0 · I = 0')
      : shot.enabled
        ? say('整圈中断 · 局部残流另计', 'Full loop cut · local loss remains')
        : `A · Φ̇ = ${round(ring.fluxRate * 1000)} mWb/s · I = ${round(ring.current)} A`;
  }
  const question =
    shot.apparatus === 'disc'
      ? shot.field === 0
        ? say('靠近磁极，转速会怎样？', 'Bring the poles closer: what changes?')
        : say('反转磁场，会变成加速吗？', 'Reverse B: will it accelerate?')
      : shot.apparatus === 'tube'
        ? shot.view === 'compare'
          ? say('切断整圈，落得更快吗？', 'Cut the large loop: faster fall?')
          : say('把磁体停住，还持续发热吗？', 'Hold the magnet: does heating continue?')
        : say('没有转差，还能持续驱动吗？', 'With no slip, can torque continue?');
  return (
    <div
      className="ec20"
      data-watch={film.watch}
      data-apparatus={shot.apparatus}
      data-view={shot.view}
      data-time={shot.time}
      data-enabled={shot.enabled}
      data-field={shot.field}
      data-direction={shot.direction}
      data-held={shot.held}
      data-question={shot.question}
    >
      <div className="ec20-head">
        <span>{say(names[shot.apparatus][0], names[shot.apparatus][1])}</span>
        <strong>{shot.question ? '?' : readout}</strong>
      </div>
      <div className="ec20-stage">
        <EddyArtwork shot={shot} narrow={narrow} say={say} />
      </div>
      <p className="ec20-state">
        {shot.question ? question : shot.view === 'loop' ? local : circuit}
      </p>
      {!film.watch && (
        <div className="ec20-controls">
          <Segments
            label={say('选择阻尼装置', 'Choose apparatus')}
            value={shot.apparatus}
            onChange={(a) =>
              patch({
                ...eddyDirector(
                  ({ meter: 0, frame: 2, disc: 5, tube: 6, spring: 9 } as const)[a],
                  6,
                  locale,
                ),
                apparatus: a,
                question: false,
                reveal: true,
              })
            }
            options={(Object.keys(names) as DampingApparatus[]).map((value) => ({
              value,
              label: say(names[value][0], names[value][1]),
            }))}
          />
          <Segments
            label={say('观察镜头', 'View')}
            value={shot.view}
            onChange={(view) => patch({ view })}
            options={(Object.keys(views) as EddyView[]).map((value) => ({
              value,
              label: say(views[value][0], views[value][1]),
            }))}
          />
          {shot.apparatus === 'frame' ? (
            <>
              <Segments
                label={say('驱动方向', 'Drive direction')}
                value={shot.direction > 0 ? 'positive' : 'negative'}
                onChange={(v) => patch({ direction: v === 'positive' ? 1 : -1 })}
                options={[
                  { value: 'positive', label: say('正转', 'Forward') },
                  { value: 'negative', label: say('反转', 'Reverse') },
                ]}
              />
              <Segments
                label={say('相对运动', 'Relative motion')}
                value={shot.held ? 'sync' : 'slip'}
                onChange={(v) => patch({ held: v === 'sync' })}
                options={[
                  { value: 'slip', label: say('允许转差', 'Allow slip') },
                  { value: 'sync', label: say('假设无转差', 'Assume zero slip') },
                ]}
              />
            </>
          ) : shot.apparatus === 'disc' ? (
            <Range
              label={say('垂直磁场', 'Normal magnetic field')}
              value={shot.field}
              min={-0.6}
              max={0.6}
              step={0.01}
              unit="T"
              onChange={(field) => patch({ field, question: false, reveal: true })}
            />
          ) : (
            <Segments
              label={say('导电路径', 'Conducting path')}
              value={shot.enabled ? 'on' : 'off'}
              onChange={(s) => patch({ enabled: s === 'on' })}
              options={[
                {
                  value: 'off',
                  label:
                    shot.apparatus === 'tube'
                      ? say('完整管壁', 'Intact wall')
                      : say('回路断开', 'Circuit open'),
                },
                {
                  value: 'on',
                  label:
                    shot.apparatus === 'tube'
                      ? say('纵向开缝', 'Longitudinal slit')
                      : say('回路闭合', 'Circuit closed'),
                },
              ]}
            />
          )}
          {shot.apparatus === 'tube' && (
            <Segments
              label={say('磁体状态', 'Magnet state')}
              value={shot.held ? 'held' : 'free'}
              onChange={(s) => patch({ held: s === 'held', view: 'loop' })}
              options={[
                { value: 'free', label: say('自由下落', 'Falling') },
                { value: 'held', label: say('固定在管内', 'Held inside tube') },
              ]}
            />
          )}
          <Range
            label={say('释放后的时间', 'Time since release')}
            value={shot.time}
            min={0}
            max={4}
            step={0.01}
            unit="s"
            onChange={(time) => patch({ time })}
          />
          {shot.question && (
            <button
              className="ec20-reveal"
              onClick={() =>
                patch({
                  question: false,
                  reveal: true,
                  ...(shot.apparatus === 'disc'
                    ? { field: shot.field === 0 ? 0.3 : -shot.field }
                    : shot.apparatus === 'tube' && shot.view === 'compare'
                      ? { enabled: true, time: 0.65 }
                      : { held: true }),
                })
              }
            >
              {say('检验预测', 'Test prediction')}
            </button>
          )}
        </div>
      )}
      <details className="ec20-notes">
        <summary>{say('这是什么近似？', 'What is approximated?')}</summary>
        <p>
          {say(
            '低速、准静态电阻模型，忽略自感暂态。图中箭头表示常规电流，不是电子飞行速度。铜盘为两个局部等效环；铝框运动与能量使用周期平均，无转差是受约束的瞬间反事实；管壁以长薄管偶极模型说明方向，磁体符号放大；少数环并非完整离散网格。各系数用于机制比较，不是教材测量数据。',
            'Low-speed resistive, quasistatic models omit self-inductance transients. Arrows show conventional current, not electron speed. Disc loops are local equivalents; frame motion and power use cycle averages. Zero slip is a constrained instantaneous counterfactual, not sustained motion against friction. The enlarged magnet symbol and selected tube rings illustrate a long, thin, dipole-field model, not a complete mesh. Coefficients are explanatory, not textbook measurements.',
          )}
        </p>
        <p>
          {say(
            '磁体到达接收盘后的动能损失单列为接收耗散，不算电阻热。开缝后的局部回流仅由残余有效阻尼表示；完整环路不跨越裂缝。',
            'Energy lost at the catch is recorded separately from electrical heating. Residual slit-pipe eddies use an effective loss coefficient; no complete current loop crosses the slit.',
          )}
        </p>
      </details>
    </div>
  );
}
