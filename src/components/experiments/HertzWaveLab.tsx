import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  LIGHT_SPEED,
  hertzPulse,
  standingField,
  snellAngle,
  slitIntensity,
  hertzFilmState,
  hertzProjection,
  type HertzState,
} from '../../models/hertz-wave-lab';
import '../../styles/hertz-wave-lab.css';
const names = [
  ['发射', 'Emission'],
  ['接收', 'Reception'],
  ['反射', 'Reflection'],
  ['折射', 'Refraction'],
  ['偏振', 'Polarization'],
  ['衍射', 'Diffraction'],
];
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
export default function HertzWaveLab() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (zh: string, english: string) => (en ? english : zh),
    narrow = useNarrow(),
    w = narrow ? 280 : 560,
    h = 230,
    id = useId().replace(/:/g, ''),
    authored = hertzFilmState(film.chapter, film.chapterTime, en ? 'en' : 'zh');
  const [manual, setManual] = useState<Partial<HertzState>>({});
  const s = film.watch ? authored : { ...authored, ...manual };
  const set = (v: Partial<HertzState>) => setManual({ ...s, ...v });
  const pulse = hertzPulse(s.time, 3, s.mode === 4 ? s.angle : 0),
    ref = snellAngle(s.incident),
    projection = hertzProjection(s.angle, s.time),
    tx = narrow ? 48 : 100,
    rx = w - (narrow ? 48 : 100),
    cy = 106,
    scale = (rx - tx) / 3,
    signalMax = Math.max(40, s.time * 1e9);
  const curve = (
    fn: (v: number) => number,
    x0: number,
    x1: number,
    y0: number,
    gain: number,
    n = 160,
  ) =>
    Array.from(
      { length: n + 1 },
      (_, i) => `${i ? 'L' : 'M'}${x0 + ((x1 - x0) * i) / n} ${y0 - gain * fn(i / n)}`,
    ).join(' ');
  const Loop = ({ cx, y, r, angle = 0 }: { cx: number; y: number; r: number; angle?: number }) => (
    <g
      transform={`translate(${cx} ${y}) scale(${Math.max(0.025, Math.cos(angle))} 1)`}
      data-loop-normal-angle={angle}
    >
      <path
        d={`M8 ${Math.sqrt(r * r - 64)} A${r} ${r} 0 1 0 -8 ${Math.sqrt(r * r - 64)}`}
        fill="none"
        stroke="#ad9467"
        strokeWidth="4"
      />
      <circle cx="-8" cy={Math.sqrt(r * r - 64)} r="4" fill="#c1ae7d" />
      <circle cx="8" cy={Math.sqrt(r * r - 64)} r="4" fill="#c1ae7d" />
      <path
        d={`M-4 ${Math.sqrt(r * r - 64)} l4 -3 1 6 4 -3`}
        stroke="#d6b156"
        strokeWidth="3"
        fill="none"
        opacity={Math.min(1, Math.abs(pulse.received) * 8)}
      />
    </g>
  );
  return (
    <section
      className="hz20"
      data-watch={film.watch}
      data-mode={s.mode}
      data-view={s.view}
      data-time={s.time}
      data-angle={s.angle}
      data-width={s.width}
      data-incident={s.incident}
      data-response={pulse.received}
    >
      <header className="hz20-head">
        <span>{names[s.mode][en ? 1 : 0]}</span>
        <strong>
          {s.mode === 4
            ? `θ = ${((s.angle * 180) / Math.PI).toFixed(0)}°`
            : s.mode === 5
              ? `a/λ = ${s.width.toFixed(1)}`
              : s.mode === 3
                ? `θ₁ = ${((s.incident * 180) / Math.PI).toFixed(0)}°`
                : `t = ${(s.time * 1e9).toFixed(1)} ns`}
        </strong>
      </header>
      <svg
        className="hz20-art"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={say(
          '从有限传播、接收磁通到电磁波的多种证据',
          'Finite propagation, linked flux and independent wave properties',
        )}
      >
        <defs>
          <clipPath id={id + 'field'}>
            <rect x={tx + 22} y="25" width={rx - tx - 62} height="150" />
          </clipPath>
        </defs>
        {s.mode < 2 && s.view === 'apparatus' && (
          <>
            <path
              d={`M${tx} 23 V91 M${tx} 121 V188`}
              stroke="#9aac92"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx={tx} cy="96" r="8" fill="#c6b07f" />
            <circle cx={tx} cy="116" r="8" fill="#c6b07f" />
            <path
              d={`M${tx - 3} 102 l6 5 -6 4 5 5`}
              stroke="#d2ad53"
              strokeWidth="3"
              fill="none"
              opacity={Math.min(1, Math.abs(pulse.source) * 2)}
            />
            <path
              d={`M${tx - 27} 72 H${tx} M${tx - 27} 146 H${tx} M${tx - 27} 72 V146`}
              fill="none"
              stroke="#9aae91"
              strokeWidth="2"
            />
            <rect
              x={tx - 38}
              y="91"
              width="22"
              height="29"
              rx="5"
              fill="#d5dfc9"
              stroke="#a2b599"
            />
            <g clipPath={`url(#${id}field)`}>
              {Array.from({ length: 8 }, (_, i) => {
                const r = LIGHT_SPEED * (s.time - i / 1e8) * scale;
                return r > 0 ? (
                  <circle
                    key={i}
                    cx={tx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#a5bda0"
                    strokeWidth="2"
                    opacity={0.7 * Math.exp(-i * 0.4)}
                  />
                ) : null;
              })}
            </g>
            <Loop cx={rx} y={cy} r={narrow ? 34 : 48} />
            <text x={tx} y="216" textAnchor="middle">
              {say('发射', 'Source')}
            </text>
            <text x={rx} y="216" textAnchor="middle">
              {say('接收环', 'Loop')}
            </text>
          </>
        )}
        {s.mode === 1 && s.view === 'signal' && (
          <>
            <text x="24" y="22">
              {say('同一波包 · 延后响应', 'Same packet · delayed')}
            </text>
            {[80, 151].map((y, j) => (
              <g key={j}>
                <path d={`M24 ${y} H${w - 18}`} stroke="#d3ddca" />
                <path
                  d={curve(
                    (f) => hertzPulse(f * signalMax * 1e-9, j ? 3 : 0).received,
                    24,
                    w - 18,
                    y,
                    j ? 88 : 22,
                  )}
                  stroke={j ? '#b49367' : '#819f78'}
                  strokeWidth="2.5"
                  fill="none"
                />
                <text x="28" y={y - 34}>
                  {j ? 'R × 4' : 'S'}
                </text>
                <circle
                  cx={24 + ((s.time * 1e9) / signalMax) * (w - 42)}
                  cy={y - (j ? pulse.received * 88 : hertzPulse(s.time, 0).received * 22)}
                  r="4"
                  fill={j ? '#b49367' : '#819f78'}
                />
              </g>
            ))}
            <path
              d={`M24 185 V194 H${24 + (10.0069 / signalMax) * (w - 42)} V185`}
              stroke="#9aa98b"
              fill="none"
            />
            <text x="24" y="220">
              Δt = r/c = 10.01 ns
            </text>
          </>
        )}
        {s.mode === 2 && (
          <>
            <text x={w / 2} y="24" textAnchor="middle">
              E = Eᵢ + Eᵣ
            </text>
            {[1, -1].map((sign, j) => (
              <path
                key={j}
                data-wave-component={j ? 'reflected' : 'incident'}
                d={curve(
                  (f) =>
                    sign *
                    Math.sin(
                      2 * Math.PI * 1e8 * s.time +
                        (((j ? 1 : -1) * 2 * Math.PI * 1e8) / LIGHT_SPEED) * f * 6 -
                        (j ? ((2 * 2 * Math.PI * 1e8) / LIGHT_SPEED) * 6 : 0),
                    ),
                  24,
                  w - 26,
                  106,
                  30,
                )}
                stroke={j ? '#c7b78e' : '#bbccb0'}
                strokeWidth="1.5"
                fill="none"
              />
            ))}
            <path d={`M${w - 26} 34 V176`} stroke="#a2b497" strokeWidth="8" />
            <path d={`M24 106 H${w - 26}`} stroke="#d3ddca" />
            <path
              d={curve((f) => standingField(f * 6, s.time), 24, w - 26, 106, 30)}
              stroke="#809e75"
              strokeWidth="2.5"
              fill="none"
            />
            {Array.from({ length: 5 }, (_, i) => {
              const x = w - 26 - (i * (LIGHT_SPEED / 1e8 / 2) * (w - 50)) / 6;
              return x >= 24 ? (
                <g key={i}>
                  <path d={`M${x} 44 V171`} stroke="#c0cfb4" strokeDasharray="3 5" />
                  <circle cx={x} cy="106" r="3" fill="#97aa8e" />
                </g>
              ) : null;
            })}
            {s.measure && (
              <>
                <path
                  d={`M${w - 26 - ((LIGHT_SPEED / 1e8 / 2) * (w - 50)) / 6} 184 V192 H${w - 26} V184`}
                  stroke="#9aab8e"
                  fill="none"
                />
                <text x={w / 2} y="220" textAnchor="middle">
                  λ/2 = 1.50 m
                </text>
              </>
            )}
          </>
        )}
        {s.mode === 3 && (
          <>
            <path d={`M24 112 H${w - 24} V199 H24 Z`} fill="#dce6d3" />
            <path
              d={`M24 112 H${w - 24} M${w / 2} 22 V199`}
              stroke="#a9bd9d"
              strokeDasharray="4 5"
            />
            <path
              d={`M${w / 2 - 85 * Math.sin(s.incident)} ${112 - 85 * Math.cos(s.incident)} L${w / 2} 112 L${w / 2 + 85 * Math.sin(ref)} ${112 + 85 * Math.cos(ref)}`}
              stroke="#ac925b"
              strokeWidth="3"
              fill="none"
            />
            {[1, 2, 3].flatMap((j) =>
              [0, 1].map((k) => {
                const a = k ? ref : s.incident,
                  step = k ? 22 / 1.5 : 22,
                  sign = k ? 1 : -1,
                  cx = w / 2 + sign * j * step * Math.sin(a),
                  y = 112 + sign * j * step * Math.cos(a);
                return (
                  <path
                    key={`${j}-${k}`}
                    d={`M${cx - 10 * Math.cos(a)} ${y + 10 * Math.sin(a)} L${cx + 10 * Math.cos(a)} ${y - 10 * Math.sin(a)}`}
                    stroke="#9aad8d"
                    strokeWidth="1.5"
                  />
                );
              }),
            )}
            <text x={w - 25} y="56" textAnchor="end">
              n = 1
            </text>
            <text x="29" y="184">
              n = 1.5
            </text>
            <text x={w / 2} y="222" textAnchor="middle">
              sin θ₁ = 1.5 sin θ₂
            </text>
          </>
        )}
        {s.mode === 4 && (
          <>
            <text x={w / 2} y="25" textAnchor="middle">
              {say('沿磁场方向看接收环', 'View the loop along B')}
            </text>
            <ellipse
              cx={w / 2}
              cy="105"
              rx={60 * Math.abs(Math.cos(s.angle))}
              ry="60"
              fill="#d8e2c8"
              opacity=".65"
            />
            <Loop cx={w / 2} y={105} r={60} angle={s.angle} />
            <circle cx={w / 2 + 88} cy="88" r="10" stroke="#91ac8a" fill="none" />
            <circle cx={w / 2 + 88} cy="88" r="2.5" fill="#91ac8a" />
            <text x={w / 2 + 88} y="121" textAnchor="middle">
              B
            </text>
            <text x={w / 2} y="197" textAnchor="middle">
              A⊥ = A cos θ
            </text>
            <text x={w / 2} y="222" textAnchor="middle">
              {say('同一波包时刻', 'Same packet instant')}
            </text>
          </>
        )}
        {s.mode === 5 && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${21 + i * 14} 43 V169`} stroke="#b6c9ac" strokeWidth="1.5" />
            ))}
            <path
              d={`M82 30 V${106 - s.width * 18} M82 ${106 + s.width * 18} V182`}
              stroke="#acbba0"
              strokeWidth="7"
            />
            {Array.from({ length: 25 }, (_, i) => {
              const a = (i / 24 - 0.5) * Math.PI * 0.85,
                int = slitIntensity(a, s.width),
                r = narrow ? 90 : 110;
              return (
                <path
                  key={i}
                  d={`M88 106 L${88 + r * Math.cos(a)} ${106 + r * Math.sin(a)}`}
                  stroke="#9eb890"
                  strokeWidth="1.8"
                  opacity={int * 0.65}
                />
              );
            })}
            <path d={`M${w - 72} 32 V180`} stroke="#d0dac7" />
            <path
              d={Array.from({ length: 141 }, (_, i) => {
                const a = (i / 140 - 0.5) * Math.PI * 0.85;
                return `${i ? 'L' : 'M'}${w - 72 + slitIntensity(a, s.width) * 55} ${32 + (i / 140) * 148}`;
              }).join(' ')}
              stroke="#7e9d70"
              strokeWidth="2.5"
              fill="none"
            />
            <text x={w / 2} y="211" textAnchor="middle">
              {say('归一化接收强度', 'Normalized intensity')}
            </text>
          </>
        )}
      </svg>
      <p className="hz20-readout">
        {s.mode === 4
          ? `${say('相对功率', 'Relative power')} ${(projection.power * 100).toFixed(0)}%`
          : s.mode === 3
            ? `f = 100 MHz · λ₂/λ₁ = 0.667`
            : s.mode === 5
              ? 'I(0) = 1'
              : s.mode === 2
                ? say('固定节点 · 振幅随位置变', 'Fixed nodes · varying amplitude')
                : `r = 3 m · Δt = ${(pulse.delay * 1e9).toFixed(2)} ns`}
      </p>
      {!film.watch && (
        <div className="hz20-controls">
          <Segments
            label={say('选择电磁波证据', 'Choose wave evidence')}
            value={String(s.mode)}
            onChange={(v) => set({ mode: Number(v), view: 'apparatus' })}
            options={names.map((n, i) => ({ value: String(i), label: n[en ? 1 : 0] }))}
          />
          {s.mode === 1 && (
            <Segments
              label={say('接收视图', 'Reception view')}
              value={s.view}
              onChange={(v) => set({ view: v })}
              options={[
                { value: 'apparatus', label: say('装置', 'Apparatus') },
                { value: 'signal', label: say('延迟波形', 'Delayed signal') },
              ]}
            />
          )}
          {s.mode !== 3 && s.mode !== 5 && (
            <Range
              label={say('传播时间', 'Propagation time')}
              value={Number((s.time * 1e9).toFixed(3))}
              min={0}
              max={120}
              step={0.1}
              unit="ns"
              onChange={(v) => set({ time: v * 1e-9 })}
            />
          )}
          {s.mode === 4 && (
            <Range
              label={say('接收环法线与磁场夹角', 'Loop normal–field angle')}
              value={Number(((s.angle * 180) / Math.PI).toFixed(3))}
              min={0}
              max={90}
              step={1}
              unit="°"
              onChange={(v) => set({ angle: (v * Math.PI) / 180 })}
            />
          )}{' '}
          {s.mode === 3 && (
            <Range
              label={say('入射角', 'Incidence angle')}
              value={Number(((s.incident * 180) / Math.PI).toFixed(3))}
              min={0}
              max={65}
              step={1}
              unit="°"
              onChange={(v) => set({ incident: (v * Math.PI) / 180 })}
            />
          )}{' '}
          {s.mode === 5 && (
            <Range
              label={say('狭缝宽度与波长之比', 'Slit width / wavelength')}
              value={s.width}
              min={0.4}
              max={3}
              step={0.1}
              onChange={(v) => set({ width: v })}
            />
          )}
        </div>
      )}
      <details className="hz20-note">
        <summary>{say('历史装置与模型范围', 'Historical apparatus and model limits')}</summary>
        <p>
          {say(
            '100兆赫阻尼波包、距离衰减与传播延迟是教学模型，不是历史实测曲线。环的响应使用磁通方向投影；转动比较固定同一波包时刻，排除自然衰减。亮度不计算空气击穿。反射、折射、衍射是各自理想化模型；衍射曲线归一化不代表不同开口透过的总功率相同。',
            'The damped 100 MHz packet, attenuation and delay are explanatory models, not historic records. Loop response uses directional flux projection. Rotation holds one packet instant to exclude natural decay. Brightness does not solve breakdown. Reflection, refraction and diffraction use separate idealizations; normalized slit profiles do not imply equal transmitted total power.',
          )}
        </p>
      </details>
    </section>
  );
}
