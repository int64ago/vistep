import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  colloidDirector,
  colloidObservation,
  colloidOptics,
  dipoleField,
  dipoleRadiation,
  incidentField,
  observedRoute,
  type ColloidShot,
} from '../../models/chem-colloid-light';
import '../../styles/chem-colloid-light.css';

type Say = (zh: string, en: string) => string;
const gain = (power: number) => -Math.expm1(-power * 36);
const percent = (n: number) => `${(100 * n).toFixed(1)}%`;
const ray = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  `M${a.x} ${a.y}L${b.x} ${b.y}`;
function Eye({
  x,
  y,
  light = 0,
  color = '#ffb18c',
}: {
  x: number;
  y: number;
  light?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-21 0Q0-19 21 0Q0 19-21 0" fill="#d8e1d4" stroke="#adc5b7" />
      <circle r="7" fill="#19463f" />
      <circle r="3.8" fill="#081e1d" />
      <circle r="6" fill={color} opacity={gain(light * 70)} />
    </g>
  );
}
function BeamSource({
  x,
  y,
  on = true,
  color = '#ffb18c',
}: {
  x: number;
  y: number;
  on?: boolean;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-18" y="-12" width="31" height="24" rx="6" fill="#65897e" stroke="#b3c8ba" />
      <path d="M-9-11V11M-3-11V11" stroke="#315c52" />
      <rect x="12" y="-7" width="5" height="14" rx="2" fill={on ? color : '#263f39'} />
    </g>
  );
}

function Samples({
  width,
  compact,
  say,
  uid,
}: {
  width: number;
  compact: boolean;
  say: Say;
  uid: string;
}) {
  const sw = compact ? width : (width - 24) / 2;
  const height = compact ? 127 : 215;
  const y = compact ? 66 : 112;
  const left = sw * 0.25,
    right = sw * 0.73,
    top = compact ? 19 : 24,
    bottom = height - 14;
  return (
    <div className="colloid-samples">
      {[false, true].map((colloid) => (
        <figure key={String(colloid)}>
          <figcaption>
            {say(
              colloid ? '氢氧化铁胶体' : '氯化钠溶液',
              colloid ? 'Iron hydroxide colloid' : 'Sodium chloride solution',
            )}
          </figcaption>
          <svg
            viewBox={`0 0 ${sw} ${height}`}
            role="img"
            aria-label={say(
              colloid ? '胶体侧面光路明显，后方光屏也亮' : '盐溶液侧面光路不明显，但后方光屏亮',
              colloid
                ? 'The colloid reveals the beam from the side; its rear screen is also lit'
                : 'The solution has no obvious side beam, but its rear screen is lit',
            )}
          >
            <defs>
              <linearGradient id={`${uid}-glass-${colloid}`}>
                <stop stopColor="#dce9dc" stopOpacity=".21" />
                <stop offset=".4" stopColor="#b9d7c8" stopOpacity=".035" />
                <stop offset="1" stopColor="#e4eadd" stopOpacity=".18" />
              </linearGradient>
              <radialGradient id={`${uid}-spot-${colloid}`}>
                <stop stopColor="#ffe4ba" />
                <stop offset=".3" stopColor="#ffc59e" stopOpacity=".9" />
                <stop offset="1" stopColor="#fb9a7b" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse
              cx={(left + right) / 2}
              cy={bottom + 5}
              rx={(right - left) * 0.6}
              ry="7"
              fill="#061c19"
              opacity=".35"
            />
            <path
              d={`M${left} ${top}V${bottom - 9}Q${left} ${bottom} ${(left + right) / 2} ${bottom}T${right} ${bottom - 9}V${top}`}
              fill={`url(#${uid}-glass-${colloid})`}
              stroke="#a8c5b5"
              strokeWidth="1.5"
            />
            <path
              d={`M${left + 2} ${y - 23}H${right - 2}V${bottom - 9}Q${right - 2} ${bottom - 2} ${(left + right) / 2} ${bottom - 2}T${left + 2} ${bottom - 9}Z`}
              fill={colloid ? '#a2693e' : '#bbdfd0'}
              opacity={colloid ? 0.24 : 0.08}
            />
            <ellipse
              cx={(left + right) / 2}
              cy={y - 23}
              rx={(right - left) / 2 - 2}
              ry="5"
              fill="none"
              stroke={colloid ? '#be9567' : '#b0d0be'}
              opacity=".4"
            />
            <path
              d={`M${left + 7} ${top + 9}V${bottom - 13}`}
              stroke="#e4eddf"
              opacity=".22"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {colloid && (
              <>
                <path
                  d={`M${left + 2} ${y}H${right - 2}`}
                  stroke="#f9aa82"
                  strokeWidth="14"
                  opacity=".09"
                />
                <path
                  d={`M${left + 2} ${y}H${right - 2}`}
                  stroke="#ffbd93"
                  strokeWidth="4"
                  opacity=".78"
                />
                {Array.from({ length: 13 }, (_, i) => (
                  <circle
                    key={i}
                    cx={left + 6 + ((right - left - 12) * i) / 12}
                    cy={y + Math.sin(i * 7) * 2}
                    r="1.4"
                    fill="#ffe6bb"
                    opacity=".85"
                  />
                ))}
              </>
            )}
            <BeamSource x={22} y={y} />
            <path
              d={`M${sw - 29} ${y - 30}v60`}
              stroke="#8baa98"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <ellipse cx={sw - 29} cy={y} rx="13" ry="22" fill={`url(#${uid}-spot-${colloid})`} />
            <circle cx={sw - 29} cy={y} r="3" fill="#ffe4bd" />
            <text x={sw - 1} y={height - 1} textAnchor="end">
              {say('光屏', 'Screen')}
            </text>
          </svg>
        </figure>
      ))}
    </div>
  );
}

function PathShot({
  width,
  blocked,
  insertion,
  progress,
  say,
}: {
  width: number;
  blocked: boolean;
  insertion: number;
  progress: number;
  say: Say;
}) {
  const g = observedRoute(width, blocked);
  const blockerX = g.blocker.x - 92 * (1 - insertion);
  const s = colloidObservation({ blocked });
  const incoming = Math.min(1, progress * 2),
    outgoing = Math.max(0, Math.min(1, (progress - 0.5) * 2));
  const a = { x: g.source.x + (g.particle.x - g.source.x) * incoming, y: g.particle.y };
  const b = { x: g.particle.x, y: g.particle.y + (g.outgoingEnd.y - g.particle.y) * outgoing };
  return (
    <svg
      viewBox={`0 0 ${width} ${g.height}`}
      role="img"
      aria-label={say(
        blocked
          ? '遮挡片只挡住微粒到眼睛的路径，眼睛变暗，透射光屏保持明亮'
          : '光源到微粒，再由微粒散射进入侧面的眼睛，透射光继续到光屏',
        blocked
          ? 'The blocker intercepts only the particle-to-eye path. The eye is dark; the rear screen stays bright'
          : 'Light reaches the particle and is scattered to the side eye; unscattered light continues to the screen',
      )}
    >
      <text x="0" y="21" className="colloid-muted">
        {say('俯视 · 放大的光路', 'Top view · enlarged light paths')}
      </text>
      <rect
        x={g.particle.x - 42}
        y={g.particle.y - 42}
        width="84"
        height="84"
        rx="22"
        fill="#a47b4b"
        fillOpacity=".1"
        stroke="#a9c5b2"
        strokeOpacity=".55"
      />
      <path
        d={ray(g.source, g.screen)}
        stroke="#adccbb"
        strokeOpacity=".17"
        strokeDasharray="3 6"
      />
      <path d={ray(g.source, a)} stroke="#f7b38e" strokeWidth="3" strokeLinecap="round" />
      {incoming === 1 && (
        <path d={ray(g.particle, g.screen)} stroke="#f7b38e" strokeWidth="2" strokeOpacity=".7" />
      )}
      <path d={ray(g.particle, b)} stroke="#f7b38e" strokeWidth="3" strokeLinecap="round" />
      <circle
        cx={g.particle.x}
        cy={g.particle.y}
        r="9"
        fill="#d4ba83"
        stroke="#fff1c1"
        strokeWidth="2"
      />
      <circle cx={a.x} cy={a.y} r="4" fill="#ffe3b9" />
      {outgoing > 0 && <circle cx={b.x} cy={b.y} r="4" fill="#ffe3b9" />}
      <BeamSource x={g.source.x} y={g.source.y} />
      <path
        d={`M${g.screen.x} ${g.screen.y - 28}v56`}
        stroke="#91ac9b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse
        cx={g.screen.x}
        cy={g.screen.y}
        rx="9"
        ry="14"
        fill="#ffcf9c"
        opacity={incoming === 1 ? 0.9 : 0}
      />
      <text x={g.screen.x + 14} y={g.screen.y + 53} textAnchor="end">
        {say(incoming === 1 ? '光屏仍亮' : '光屏', incoming === 1 ? 'Screen lit' : 'Screen')}
      </text>
      <text x={g.particle.x} y={g.particle.y - 55} textAnchor="middle">
        {say('微粒', 'Particle')}
      </text>
      <g transform={`translate(${blockerX} ${g.blocker.y})`}>
        <rect x="-23" y="-7" width="46" height="14" rx="4" fill="#44544e" stroke="#c0c6b2" />
        <path d="M-15-4l-7 8m20-8l-7 8m20-8l-7 8m20-8l-7 8" stroke="#b3beaa" strokeOpacity=".35" />
      </g>
      <text
        x={blocked ? g.blocker.x + 33 : blockerX}
        y={blocked ? g.blocker.y + 5 : g.blocker.y + 32}
        textAnchor={blocked ? 'start' : 'middle'}
      >
        {say('遮挡片', 'Blocker')}
      </text>
      <Eye x={g.eye.x} y={g.eye.y} light={outgoing === 1 ? s.eyePower : 0} />
      <text x={g.eye.x} y={g.eye.y + 35} textAnchor="middle">
        {say(
          blocked ? '眼睛：收不到' : outgoing === 1 ? '眼睛：收到散射光' : '等待光到达',
          blocked ? 'Eye: no light' : outgoing === 1 ? 'Eye: scattered light' : 'Waiting for light',
        )}
      </text>
    </svg>
  );
}

function DipoleShot({ width, time, say }: { width: number; time: number; say: Say }) {
  const compact = width < 560,
    cx = width * 0.52,
    cy = compact ? 122 : 150;
  const height = compact ? 320 : 350,
    reach = compact ? 89 : 148;
  const response = dipoleField(time),
    received = dipoleField(time, 2.3);
  const fieldPath = Array.from({ length: 76 }, (_, i) => {
    const f = i / 75,
      x = 20 + (cx - 20) * f;
    const state = incidentField(time, f * 1.5);
    const previous = incidentField(time, Math.max(0, (i - 1) / 75) * 1.5);
    return state.envelope > 0
      ? `${i && previous.envelope ? 'L' : 'M'}${x} ${cy - 15 * state.field}`
      : '';
  }).join(' ');
  const eye = { x: cx + reach * 0.52, y: cy + reach * 0.8 };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={say(
        response.envelope
          ? '入射电场使微粒内正负电荷分布相对移动，散射波向外传播，其中一路到眼睛'
          : time > 8
            ? '入射光已关闭，电荷响应停止；最后的散射波离开后眼睛变暗'
            : '入射光正在到达微粒，尚未形成电荷响应',
        response.envelope
          ? 'The incident electric field displaces positive and negative charge distributions; outgoing scattered waves reach the eye'
          : time > 8
            ? 'The light is off and the charge response has stopped; the eye darkens after the final wave passes'
            : 'The incoming field is approaching; the charge response has not begun',
      )}
    >
      <text x="0" y="21" className="colloid-muted">
        {say('微观近景 · 慢动作示意', 'Microscopic view · slowed down')}
      </text>
      <path d={`M20 ${cy}H${cx - 29}`} stroke="#9ebdae" strokeOpacity=".22" strokeDasharray="3 5" />
      <path d={fieldPath} fill="none" stroke="#f4bb8e" strokeWidth="2.5" />
      <text x="2" y={cy - 33}>
        {say('入射电场', 'Incident field')}
      </text>
      <circle
        cx={cx}
        cy={cy}
        r="30"
        fill="#c6bf87"
        fillOpacity=".09"
        stroke="#ccc49c"
        strokeOpacity=".6"
      />
      <ellipse
        cx={cx}
        cy={cy + 8 * response.field}
        rx="20"
        ry="14"
        fill="#f1b186"
        fillOpacity=".52"
      />
      <ellipse
        cx={cx}
        cy={cy - 8 * response.field}
        rx="18"
        ry="13"
        fill="#9cc4d2"
        fillOpacity=".59"
      />
      <text x={cx - 9} y={cy + 8 * response.field + 5} textAnchor="middle" fill="#ffe4c2">
        +
      </text>
      <text x={cx + 9} y={cy - 8 * response.field + 5} textAnchor="middle" fill="#d8eff7">
        −
      </text>
      <path d={`M${cx} ${cy - 49}v-25m-4 6l4-6 4 6`} fill="none" stroke="#96b4a5" />
      <text x={compact ? width - 2 : cx + 60} y={cy - 65} textAnchor={compact ? 'end' : 'start'}>
        {say('电荷响应', 'Charge response')}
      </text>
      {[-150, -90, -35, 45, 90, 150].map((angle, index) => {
        const a = (angle * Math.PI) / 180;
        // These rays all lie in the x-y plane, perpendicular to the displayed z dipole.
        const vx = Math.cos(a),
          vy = Math.sin(a);
        const dx = vx + 0.52 * vy,
          dy = 0.8 * vy;
        const strength = dipoleRadiation([vx, vy, 0]);
        const path = Array.from({ length: 61 }, (_, i) => {
          const f = i / 60,
            r = 32 + (reach - 32) * f;
          const outgoing = dipoleField(time, (r / reach) * 2.3);
          const prevR = 32 + (reach - 32) * Math.max(0, (i - 1) / 60);
          const previous = dipoleField(time, (prevR / reach) * 2.3);
          return outgoing.envelope > 0
            ? `${i && previous.envelope ? 'L' : 'M'}${cx + dx * r} ${cy + dy * r - 8 * outgoing.field * strength}`
            : '';
        }).join(' ');
        return (
          <g key={index}>
            <path
              d={`M${cx + dx * 32} ${cy + dy * 32}l${dx * (reach - 32)} ${dy * (reach - 32)}`}
              stroke="#8eac9d"
              strokeOpacity=".15"
              strokeDasharray="2 6"
            />
            <path
              d={path}
              fill="none"
              stroke="#f4bb8e"
              strokeWidth="1.8"
              data-light="scattered-field"
            />
          </g>
        );
      })}
      <Eye x={eye.x} y={eye.y} light={received.envelope * 0.002} />
      <text x={eye.x} y={eye.y + 33} textAnchor="middle">
        {say(
          received.envelope ? '收到散射光' : '侧面眼睛',
          received.envelope ? 'Scattered light' : 'Side observer',
        )}
      </text>
      <g transform={`translate(0 ${height - 35})`}>
        <circle
          cx="8"
          cy="-5"
          r="5"
          fill={incidentField(time, 0).envelope ? '#edbb8e' : '#6b8477'}
        />
        <text x="23" y="0">
          {say(
            incidentField(time, 0).envelope ? '光源开' : '光源关',
            incidentField(time, 0).envelope ? 'Source on' : 'Source off',
          )}
        </text>
        <text x={width} y="0" textAnchor="end">
          {say(
            response.envelope ? '有响应' : time > 8 ? '响应停止' : '等待入射光',
            response.envelope ? 'Driven response' : time > 8 ? 'Response stops' : 'Awaiting light',
          )}
        </text>
      </g>
    </svg>
  );
}

function ModelSample({
  width,
  volumePpm,
  wavelength,
  say,
  id,
  short = false,
}: {
  width: number;
  volumePpm: number;
  wavelength: number;
  say: Say;
  id: string;
  short?: boolean;
}) {
  const s = colloidObservation({ volumePpm, wavelengthNm: wavelength });
  const color = wavelength < 500 ? '#9ac5ff' : '#ffbb94';
  const y = short ? 47 : 91,
    cx = width * 0.5,
    left = width * 0.23,
    right = width * 0.76;
  const count = Math.round((volumePpm / 120) * 28);
  return (
    <svg
      viewBox={`0 0 ${width} ${short ? 126 : 202}`}
      role="img"
      aria-label={say(
        `类比模型：${volumePpm.toFixed(0)} ppm，透射${percent(s.forwardPower)}，散射${percent(s.scattered)}`,
        `Analogy: ${volumePpm.toFixed(0)} ppm, ${percent(s.forwardPower)} unscattered, ${percent(s.scattered)} scattered`,
      )}
    >
      <defs>
        <linearGradient id={`${id}-sample`}>
          <stop stopColor="#e8e7c9" stopOpacity=".17" />
          <stop offset=".5" stopColor="#b6d4b8" stopOpacity=".04" />
          <stop offset="1" stopColor="#e8e7c9" stopOpacity=".17" />
        </linearGradient>
      </defs>
      <rect
        x={left}
        y={short ? 20 : 29}
        width={right - left}
        height={short ? 61 : 101}
        rx="16"
        fill={`url(#${id}-sample)`}
        stroke="#b2c6ac"
        strokeOpacity=".5"
      />
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={left + 9 + (((i * 47) % 101) / 101) * (right - left - 18)}
          cy={short ? 28 + ((i * 31) % 44) : 44 + ((i * 31) % 71)}
          r="2.3"
          fill="#d4d6b1"
          opacity=".75"
        />
      ))}
      <path
        d={`M${left + 2} ${y}H${right - 2}`}
        stroke={color}
        strokeWidth="8"
        opacity={gain(s.scattered) * 0.5}
      />
      <path
        d={`M${cx} ${y}V${short ? 88 : 159}`}
        stroke={color}
        strokeWidth="2"
        opacity={gain(s.eyePower * 70)}
      />
      <BeamSource x={22} y={y} color={color} />
      <path
        d={`M${width - 20} ${y - 23}v46`}
        stroke="#8eab98"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse
        cx={width - 20}
        cy={y}
        rx="8"
        ry={16 * Math.sqrt(s.forwardPower)}
        fill={color}
        opacity={s.forwardPower}
      />
      <Eye x={cx} y={short ? 99 : 170} light={s.eyePower} color={color} />
      <text x={cx} y={short ? 125 : 199} textAnchor="middle">
        {say('侧面接收', 'Side collection')}
      </text>
      <text x={width - 5} y="21" textAnchor="end" fill="#c5d7bf">
        {percent(s.forwardPower)} →
      </text>
    </svg>
  );
}

function Prediction({
  width,
  compact,
  volumePpm,
  wavelength,
  shot,
  say,
  uid,
}: {
  width: number;
  compact: boolean;
  volumePpm: number;
  wavelength: number;
  shot: ColloidShot;
  say: Say;
  uid: string;
}) {
  const blue = colloidOptics(18, 30, 450),
    red = colloidOptics(18, 30, 633);
  if (shot === 'wavelength')
    return (
      <>
        <div className="colloid-wavelength-comparison">
          {[633, 450].map((lambda) => (
            <figure key={lambda}>
              <figcaption>{lambda} nm</figcaption>
              <ModelSample
                width={compact ? width : (width - 24) / 2}
                volumePpm={30}
                wavelength={lambda}
                say={say}
                id={`${uid}-${lambda}`}
                short={compact}
              />
            </figure>
          ))}
        </div>
        <p className="colloid-evidence">
          {say(
            `等功率 · 侧向接收：蓝≈${(blue.scattered / red.scattered).toFixed(1)}×红`,
            `Equal power · blue side signal ≈ ${(blue.scattered / red.scattered).toFixed(1)}× red`,
          )}
        </p>
      </>
    );
  const s = colloidOptics(18, volumePpm, wavelength);
  return (
    <div className="colloid-dilution">
      <div className="colloid-model-badge">
        {say('透明小球类比', 'Transparent-sphere analogy')} · {Math.round(volumePpm)} ppm
      </div>
      <ModelSample width={width} volumePpm={volumePpm} wavelength={wavelength} say={say} id={uid} />
      <div
        className="colloid-energy"
        aria-label={say('入射能量的去向', 'Where incident energy goes')}
      >
        <div className="colloid-energy-track">
          <span style={{ width: `${s.transmitted * 100}%` }} />
          <i style={{ width: `${s.scattered * 100}%` }} />
        </div>
        <p>
          <span>
            {say('直穿', 'Unscattered')} {percent(s.transmitted)}
          </span>
          <span>
            {say('转向各处', 'Scattered')} {percent(s.scattered)}
          </span>
        </p>
      </div>
    </div>
  );
}

function Transfer({ width, say, uid }: { width: number; say: Say; uid: string }) {
  const compact = width < 560,
    height = compact ? 300 : 330;
  const eye = { x: width * 0.75, y: height * 0.72 },
    dust = { x: width * 0.5, y: height * 0.39 };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={say(
        '窗外光经过尘埃，部分光转向屋内眼睛，因此看见光柱；大尘粒不套用瑞利小球的数值',
        'Window light is scattered by airborne dust toward the eye. This explains a visible shaft, but large dust grains do not use Rayleigh-sphere numbers',
      )}
    >
      <defs>
        <linearGradient id={`${uid}-window`}>
          <stop stopColor="#f3dab0" stopOpacity=".23" />
          <stop offset="1" stopColor="#d8d5ad" stopOpacity=".01" />
        </linearGradient>
      </defs>
      <path
        d={`M20 35V${height - 45}H${width - 10}`}
        stroke="#9fb9a5"
        strokeOpacity=".25"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={`M20 55H43V127H20`}
        fill="#e3d9ac"
        fillOpacity=".3"
        stroke="#b8c8ad"
        strokeWidth="3"
      />
      <path d={`M43 58L${width - 15} 137V215L43 123Z`} fill={`url(#${uid}-window)`} />
      {Array.from({ length: 32 }, (_, i) => {
        const f = ((i * 41) % 97) / 97,
          x = 49 + f * (width - 77),
          y = 66 + f * 78 + ((i * 29) % 48);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 5 === 0 ? 2 : 1.1}
            fill="#f1d5a4"
            opacity={0.22 + (0.4 * ((i * 13) % 7)) / 7}
          />
        );
      })}
      <path
        d={ray({ x: 43, y: 87 }, dust) + ray(dust, eye)}
        fill="none"
        stroke="#f8d2a0"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <circle cx={dust.x} cy={dust.y} r="4.5" fill="#ffe0ad" />
      <Eye {...eye} light={0.0014} color="#f6d6a3" />
      <text x="0" y="22">
        {say('迁移：暗室里的光柱', 'Transfer: a sunbeam in a room')}
      </text>
      <text x={dust.x + 10} y={dust.y - 14}>
        {say('尘埃', 'Dust')}
      </text>
      <text x={width * 0.5} y={height - 8} textAnchor="middle" className="colloid-muted">
        {say('转向眼睛的光，让路径显现', 'Scattered light reveals the path')}
      </text>
    </svg>
  );
}

export default function ChemColloidLight() {
  const film = useShowcase(),
    uid = useId().replace(/:/g, '');
  const { host, width, compact } = useSignalWidth();
  const en = browserLocale() === 'en',
    say: Say = (zh, english) => (en ? english : zh);
  const [view, setView] = useState<ColloidShot>('samples');
  const [blocked, setBlocked] = useState(false),
    [volumePpm, setVolume] = useState(60);
  const [wavelength, setWavelength] = useState('633'),
    [microTime, setMicroTime] = useState(4.8);
  const d = colloidDirector(film.chapter, film.chapterProgress);
  const shot = film.watch ? d.shot : view;
  return (
    <section
      className="chem-colloid-light"
      data-watch={film.watch}
      data-shot={shot}
      data-compact={compact}
    >
      <div ref={host} className="colloid-canvas">
        {shot === 'samples' && <Samples width={width} compact={compact} say={say} uid={uid} />}
        {shot === 'path' && (
          <PathShot
            width={width}
            blocked={film.watch ? d.blocked : blocked}
            insertion={film.watch ? d.blockerInsertion : blocked ? 1 : 0}
            progress={film.watch ? d.routeProgress : 1}
            say={say}
          />
        )}
        {shot === 'dipole' && (
          <DipoleShot width={width} time={film.watch ? d.microTime : microTime} say={say} />
        )}
        {(shot === 'dilution' || shot === 'wavelength') && (
          <Prediction
            width={width}
            compact={compact}
            volumePpm={film.watch ? d.volumePpm : volumePpm}
            wavelength={film.watch ? 633 : Number(wavelength)}
            shot={shot}
            say={say}
            uid={uid}
          />
        )}
        {shot === 'transfer' && <Transfer width={width} say={say} uid={uid} />}
      </div>
      {!film.watch && (
        <div className="colloid-explore">
          <Segments
            label={say('观察什么', 'Choose an observation')}
            value={view}
            onChange={setView}
            options={[
              { value: 'samples', label: say('教材对照', 'Samples') },
              { value: 'path', label: say('挡住哪一路', 'Block a path') },
              { value: 'dipole', label: say('光为何转向', 'Why it scatters') },
              { value: 'dilution', label: say('检验预测', 'Test a prediction') },
            ]}
          />
          {view === 'path' && (
            <button
              type="button"
              className="colloid-block-toggle"
              aria-pressed={blocked}
              onClick={() => setBlocked(!blocked)}
            >
              {say(
                blocked ? '移开遮挡片' : '挡住微粒到眼睛的光',
                blocked ? 'Remove the blocker' : 'Block particle-to-eye light',
              )}
            </button>
          )}
          {view === 'dipole' && (
            <Range
              label={say('慢动作时间', 'Slow-motion time')}
              value={microTime}
              min={0}
              max={12}
              step={0.1}
              onChange={setMicroTime}
              unit={say('示意秒', 'illustrative s')}
            />
          )}
          {view === 'dilution' && (
            <>
              <Range
                label={say('颗粒体积分数', 'Particle volume fraction')}
                value={volumePpm}
                min={0}
                max={60}
                step={1}
                onChange={setVolume}
                unit="ppm"
              />
              <Segments
                label={say('等入射功率的波长', 'Wavelength at equal incident power')}
                value={wavelength}
                onChange={setWavelength}
                options={[
                  { value: '633', label: say('红光 633 nm', 'Red · 633 nm') },
                  { value: '450', label: say('蓝光 450 nm', 'Blue · 450 nm') },
                ]}
              />
            </>
          )}
        </div>
      )}
      <details className="colloid-limits">
        <summary>{say('模型与边界', 'Model and limits')}</summary>
        <p>
          {say(
            '教材样品与透明小球类比分开：数值不是氢氧化铁测量值。光路与电场已放慢、放大；微观镜头只画一种偏振，电荷分布在响应，不是整颗胶粒上下运动。路径线表示传播方向，不表示光在洁净空气中本来可见。',
            'The textbook samples and transparent-sphere analogy are separate; the numbers are not measurements of iron hydroxide. Paths and electric fields are slowed and enlarged. The microscopic shot shows one polarization and a responding charge distribution, not a bobbing whole particle. Path lines are guides, not normally visible beams in clean air.',
          )}
        </p>
        <p>
          {say(
            '数值模型采用非吸收小球、非偏振光与一次散射；半径固定18 nm。探索范围保持光学厚度低于0.13。眼睛只收集侧面8°半角锥内的一小部分，亮度放大显示。普通溶液也有微弱散射；大尘粒、雾滴及多次散射不能套用这里的蓝红比值。',
            'Numbers use nonabsorbing 18 nm spheres, unpolarized light and one scattering event. Exploration stays below optical depth 0.13. Only a small fraction enters an 8° half-angle side collection cone; its displayed brightness is amplified. Solutions also scatter weakly. The blue/red ratio does not apply to large dust, fog droplets or multiple scattering.',
          )}
        </p>
      </details>
    </section>
  );
}
