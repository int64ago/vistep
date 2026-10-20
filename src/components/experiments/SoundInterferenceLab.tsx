import { useMemo, useRef, useState, type ReactNode } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import { useLabTone } from './useLabTone';
import {
  soundInterferencePoint,
  soundPressureAt,
  soundPathPressure,
  soundDirector,
  SOUND_OLD_FLAGS,
  type SoundPoint,
  type SoundView,
} from '../../models/sound-interference-lab';
import '../../styles/sound-interference-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const colors = ['#508c94', '#bd7957', '#59734f'] as const;
const trace = (fn: (p: number) => [number, number], n = 180) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const [x, y] = fn(i / n);
    return `${i ? 'L' : 'M'} ${x.toFixed(3)} ${y.toFixed(3)}`;
  }).join(' ');
function Label({
  x,
  y,
  children,
  anchor = 'start',
  color = '#3b4c49',
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize="16">
      {children}
    </text>
  );
}
function Speaker({
  x,
  y,
  right,
  phase,
  on = true,
}: {
  x: number;
  y: number;
  right: boolean;
  phase: number;
  on?: boolean;
}) {
  const def = on ? Math.sin(phase) * 1.7 : 0;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${right ? -1 : 1} 1)`}
      opacity={on ? 1 : 0.35}
      data-sound-speaker={right ? '2' : '1'}
    >
      <rect x="-18" y="-27" width="20" height="54" rx="6" fill="#728780" stroke="#536c65" />
      <path d={`M-10 -16 L${6 + def} -22 V22 L-10 16Z`} fill="#c9d6cc" stroke="#536c65" />
      <ellipse cx={6 + def} cy="0" rx="4" ry="22" fill="#afc2b6" stroke="#627b73" />
      <path d="M-12 28 V36 H5" stroke="#81968c" strokeWidth="3" fill="none" />
    </g>
  );
}
function Receiver({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} data-sound-receiver>
      <circle r="9" fill="#f3e2b9" stroke="#9f8150" strokeWidth="1.8" />
      <path d="M-3 -4 C4 -8 7 2 1 3 Q-2 3 0 7" stroke="#9f8150" fill="none" />
    </g>
  );
}
function Field({
  w,
  h,
  point,
  cycles,
  flags,
  search,
  selected,
  question,
  changed,
}: {
  w: number;
  h: number;
  point: SoundPoint;
  cycles: number;
  flags: boolean;
  search: number;
  selected: number | null;
  question: boolean;
  changed: boolean;
}) {
  const span = w - 70,
    px = (x: number) => w / 2 + (x * span) / 4,
    cy = 91,
    ys = w < 450 ? 45 : 52,
    py = (y: number) => cy + y * ys;
  const cells = useMemo(
    () =>
      Array.from({ length: 51 * 27 }, (_, i) => {
        const col = i % 51,
          row = Math.floor(i / 51),
          x = -1.6 + ((col + 0.5) * 3.2) / 51,
          y = -1.15 + ((row + 0.5) * 2.3) / 27,
          s = soundInterferencePoint(x, y, point.frequency, point.sourcePhase, point.secondOn);
        return { i, x, y, a: Math.min(0.65, Math.sqrt(s.meanSquare) * 0.52) };
      }),
    [point.frequency, point.sourcePhase, point.secondOn],
  );
  return (
    <>
      <g aria-hidden="true">
        {cells.map((c) => (
          <rect
            key={c.i}
            x={px(c.x) - (span * 0.8) / 51}
            y={py(c.y) - (ys * 1.15) / 27}
            width={((span * 0.8) / 51) * 2 + 0.2}
            height={(ys * 2.3) / 27 + 0.2}
            fill="#98ad85"
            opacity={c.a}
          />
        ))}{' '}
      </g>
      <rect x={w / 2 - 43} y="8" width="86" height="29" rx="8" fill="#e3e8d7" stroke="#b6c4ad" />
      <Label x={w / 2} y={28} anchor="middle">
        {point.frequency.toFixed(0)} Hz
      </Label>
      <path
        d={`M${w / 2 - 43} 22 H${px(-2) - 10} V${cy - 27} M${w / 2 + 43} 22 H${px(2) + 10} V${cy - 27}`}
        fill="none"
        stroke="#9aada0"
        strokeWidth="1.7"
      />
      <Speaker x={px(-2)} y={cy} right={false} phase={cycles * 2 * Math.PI} />
      <Speaker
        x={px(2)}
        y={cy}
        right
        phase={cycles * 2 * Math.PI + point.sourcePhase}
        on={point.secondOn}
      />
      {!flags && (
        <>
          <path
            d={`M${px(-2)} ${cy} L${px(point.x)} ${py(point.y)} L${px(2)} ${cy}`}
            fill="none"
            stroke="#a08d64"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <Label x={w * 0.29} y={cy + 47} anchor="middle">
            r₁ {point.r1.toFixed(3)} m
          </Label>
          <Label x={w * 0.71} y={cy + 69} anchor="middle">
            r₂ {point.r2.toFixed(3)} m
          </Label>
        </>
      )}
      {flags &&
        SOUND_OLD_FLAGS.map((f) => {
          const x = px(f.x0 + (f.target - f.x0) * search),
            y = py(f.y),
            raised = search >= 0.999;
          return (
            <g
              key={f.id}
              data-sound-flag={f.id}
              data-fixed-x={f.target}
              data-current-value={
                soundInterferencePoint(
                  f.target,
                  f.y,
                  point.frequency,
                  point.sourcePhase,
                  point.secondOn,
                ).meanSquare
              }
            >
              <circle cx={x} cy={y} r="3.5" fill="#889a85" />
              <path
                d={`M${x - 4} ${y + 6} Q${x} ${y + 3} ${x + 4} ${y + 6}`}
                fill="none"
                stroke="#889a85"
                strokeWidth="2"
              />
              <path
                d={`M${x + 4} ${y + 5} V${y - (raised ? 17 : 2)}`}
                stroke="#9b987e"
                strokeWidth="1.3"
              />
              {raised && (
                <path
                  d={`M${x + 4} ${y - 17} h8 v7 h-8Z`}
                  fill={f.group === 'loud' ? '#fffef5' : '#46584d'}
                  stroke="#72806c"
                />
              )}
              {selected === f.id && (
                <circle cx={x} cy={y} r="15" fill="none" stroke="#b78d4f" strokeWidth="1.8" />
              )}
            </g>
          );
        })}
      {flags ? (
        <circle
          cx={px(point.x)}
          cy={py(point.y)}
          r="10"
          fill="#f5e4ba"
          fillOpacity=".35"
          stroke="#a7854c"
          strokeWidth="1.7"
          data-sound-receiver
        />
      ) : (
        <Receiver x={px(point.x)} y={py(point.y)} />
      )}
      <Label x={w / 2} y={h - 30} anchor="middle">
        {selected !== null
          ? `Δr / λ = ${(point.pathDifference / point.wavelength).toFixed(2)}`
          : flags
            ? tr('白旗较强 · 黑旗较弱', 'White: louder · Dark: quieter')
            : tr('两个传播路程', 'Two propagation paths')}
      </Label>
      <Label x={w / 2} y={h - 7} anchor="middle">
        {question
          ? tr('频率减半，旧弱点还弱吗？', 'Half the frequency: still quiet?')
          : flags
            ? changed
              ? tr('旧旗不动，当前声场已变', 'Old flags stay; the field changes')
              : tr('模型寻位，非实测记录', 'Model search, not measured data')
            : tr('声压分布模型', 'Modelled pressure field')}
      </Label>
    </>
  );
}
function Paths({
  w,
  h,
  point,
  cycles,
}: {
  w: number;
  h: number;
  point: SoundPoint;
  cycles: number;
}) {
  const left = 32,
    right = w - 22,
    scale = (right - left) / (Math.max(2.6, point.r1, point.r2) + 0.15),
    base = [59, 132],
    end = [point.r1, point.r2],
    amps = [point.a, point.b];
  return (
    <>
      <Label x={w / 2} y={20} anchor="middle">
        {tr('同一时刻 · 同一米尺', 'One instant · one distance scale')}
      </Label>
      {base.map((y, i) => {
        const r = end[i]!,
          a = amps[i]!,
          phi = i === 0 ? 0 : point.sourcePhase,
          on = i === 0 || point.secondOn;
        return (
          <g key={i} data-sound-ray={i + 1} data-distance={r}>
            <path d={`M${left} ${y} H${right}`} stroke="#ccd4c8" strokeWidth="1" />
            {on && (
              <path
                d={trace((u) => {
                  const d = r * u;
                  return [
                    left + d * scale,
                    y - 18 * soundPathPressure(d, point.frequency, cycles, phi),
                  ];
                })}
                fill="none"
                stroke={colors[i]}
                strokeWidth="2.2"
              />
            )}
            <circle
              cx={left + r * scale}
              cy={y - (on ? 18 * soundPathPressure(r, point.frequency, cycles, phi) : 0)}
              r="5"
              fill={colors[i]}
            />
            <path
              d={`M${left + r * scale} ${y - 27} V${y + 27}`}
              stroke="#b59a65"
              strokeDasharray="3 3"
            />
            <Label x={10} y={y + 5} color={colors[i]}>
              {i === 0 ? 'S₁' : 'S₂'}
            </Label>
            <Label x={right} y={y + 33} anchor="end">
              r{i === 0 ? '₁' : '₂'} = {r.toFixed(3)} m
            </Label>
            <Label x={left} y={y + 33}>
              A{i === 0 ? '₁' : '₂'} = {a.toFixed(3)}
            </Label>
          </g>
        );
      })}
      <Label x={w / 2} y={h - 8} anchor="middle">
        Δr / λ = {(point.pathDifference / point.wavelength).toFixed(2)}
      </Label>
    </>
  );
}
function Pressure({
  w,
  h,
  point,
  cycles,
}: {
  w: number;
  h: number;
  point: SoundPoint;
  cycles: number;
}) {
  const left = 45,
    right = w > 500 ? w * 0.65 : w - 18,
    span = right - left,
    ys = [45, 97, 156],
    cursor = ((cycles % 1) + 1) % 1,
    scale = 21 / Math.max(1, point.a + point.b),
    at = soundPressureAt(point, cursor);
  return (
    <>
      <Label x={w / 2} y={18} anchor="middle">
        {tr('同一接收点 · 同一时钟', 'One receiver · one clock')}
      </Label>
      {ys.map((y, i) => (
        <g key={i} data-pressure-trace={i}>
          <path d={`M${left} ${y} H${right}`} stroke="#d1d8cb" />
          <path
            d={trace((u) => {
              const s = soundPressureAt(point, u);
              return [left + u * span, y - (i === 0 ? s.p1 : i === 1 ? s.p2 : s.sum) * scale];
            })}
            fill="none"
            stroke={colors[i]}
            strokeWidth={i === 2 ? 2.6 : 2}
          />
          <Label x={10} y={y + 5} color={colors[i]}>
            {i === 0 ? 'p₁' : i === 1 ? 'p₂' : 'p'}
          </Label>
          <circle
            cx={left + cursor * span}
            cy={y - (i === 0 ? at.p1 : i === 1 ? at.p2 : at.sum) * scale}
            r="4.5"
            fill={colors[i]}
          />
        </g>
      ))}
      <Label x={right} y={132} anchor="end">
        p = p₁ + p₂
      </Label>
      <path d={`M${left + cursor * span} 30 V177`} stroke="#8c9983" strokeDasharray="3 4" />
      {w > 500 && (
        <g data-pressure-addition>
          <Label x={w * 0.81} y={48} anchor="middle">
            {tr('这一刻的声压', 'Pressure now')}
          </Label>
          {[at.p1, at.p2, at.sum].map((p, i) => (
            <g key={i}>
              <path d={`M${w * 0.72} ${76 + i * 39} H${w - 16}`} stroke="#d1d8cb" />
              <path
                d={`M${w * 0.81} ${76 + i * 39} h${(p * 54) / Math.max(1, point.a + point.b)}`}
                stroke={colors[i]}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <Label x={w - 16} y={94 + i * 39} anchor="end" color={colors[i]}>
                {i === 0 ? 'p₁' : i === 1 ? 'p₂' : 'p'}{' '}
                {Math.abs(p) < 0.0005 ? '0.000' : p.toFixed(3)}
              </Label>
            </g>
          ))}
        </g>
      )}
      <Label x={left} y={h - 8}>
        0
      </Label>
      <Label x={right} y={h - 8} anchor="end">
        {tr('1周期（慢放）', '1 cycle (slowed)')}
      </Label>
    </>
  );
}
export function SoundInterferenceArtwork({
  width = 640,
  height = 204,
  view = 'field',
  point = soundInterferencePoint(0.125, 0),
  cycles = 0,
  flags = false,
  search = 1,
  selected = null,
  question = false,
  changed = false,
}: {
  width?: number;
  height?: number;
  view?: SoundView;
  point?: SoundPoint;
  cycles?: number;
  flags?: boolean;
  search?: number;
  selected?: number | null;
  question?: boolean;
  changed?: boolean;
}) {
  return (
    <svg
      className="sil-art"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '同源双声压的传播与叠加',
        'Propagation and addition of two coherent pressures',
      )}
      data-sound-view={view}
      data-frequency={point.frequency}
      data-receiver-x={point.x}
      data-receiver-y={point.y}
      data-mean-square={point.meanSquare}
      data-source-phase={point.sourcePhase}
      data-second-on={point.secondOn}
      data-question={question}
      data-search={search}
      data-changed={changed}
      data-cycle={cycles}
    >
      {view === 'field' ? (
        <Field
          w={width}
          h={height}
          point={point}
          cycles={cycles}
          flags={flags}
          search={search}
          selected={selected}
          question={question}
          changed={changed}
        />
      ) : view === 'paths' ? (
        <Paths w={width} h={height} point={point} cycles={cycles} />
      ) : (
        <Pressure w={width} h={height} point={point} cycles={cycles} />
      )}
    </svg>
  );
}
export default function SoundInterferenceLab() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    root = useRef<HTMLDivElement>(null),
    d = soundDirector(film.chapter, film.chapterTime, browserLocale()),
    [view, setView] = useState<SoundView | null>(null),
    [frequency, setFrequency] = useState<number | null>(null),
    [x, setX] = useState<number | null>(null),
    [y, setY] = useState<number | null>(null),
    [cycles, setCycles] = useState<number | null>(null),
    [phase, setPhase] = useState(0),
    [secondOn, setSecondOn] = useState<boolean | null>(null),
    [flags, setFlags] = useState<boolean | null>(null),
    [search, setSearch] = useState<number | null>(null);
  const v = film.watch ? d.view : (view ?? d.view),
    f = film.watch ? d.frequency : (frequency ?? d.frequency),
    xx = film.watch ? d.x : (x ?? d.x),
    yy = film.watch ? d.y : (y ?? d.y),
    sourceOn = film.watch ? d.secondOn : (secondOn ?? d.secondOn),
    point = soundInterferencePoint(xx, yy, f, film.watch ? 0 : phase, sourceOn),
    clock = film.watch ? d.cycles : (cycles ?? d.cycles),
    showFlags = film.watch ? d.showFlags : (flags ?? d.showFlags),
    tone = useLabTone(root, point.frequency, 0.04 * point.amplitude, !film.watch),
    question = film.watch
      ? d.question
      : d.question && frequency === null && x === null && y === null && phase === 0 && sourceOn,
    selected =
      d.selectedFlag !== null &&
      Math.abs(xx - SOUND_OLD_FLAGS[d.selectedFlag]!.target) < 1e-8 &&
      Math.abs(yy - SOUND_OLD_FLAGS[d.selectedFlag]!.y) < 1e-8
        ? d.selectedFlag
        : null,
    meanLabel = tr('相对声压均方', 'Mean-square pressure');
  return (
    <div className="sil-lab" ref={root} data-sil-watch={film.watch}>
      <div className="sil-heading">
        <strong>
          {d.chapter === 0 && v === 'field'
            ? sourceOn
              ? tr('稳态比较：加入第二只', 'Steady fields: add source two')
              : tr('稳态比较：只开第一只', 'Steady field: source one only')
            : v === 'pressure'
              ? tr('两路声压，逐时相加', 'Two pressures add at each instant')
              : v === 'paths'
                ? tr('路程改变到达相位', 'Path length changes arrival phase')
                : tr('同一声场，强弱相间', 'One field, alternating loud and quiet')}
        </strong>
      </div>
      <div ref={host} className="sil-stage">
        <SoundInterferenceArtwork
          width={width}
          height={204}
          view={v}
          point={point}
          cycles={clock}
          flags={showFlags}
          search={film.watch ? d.search : (search ?? d.search)}
          selected={selected}
          question={question}
          changed={
            film.watch || frequency === null
              ? d.changed
              : d.chapter === 3 && Math.abs(f - 680) > 0.1
          }
        />
      </div>
      <div className="sil-reading" data-sound-readout>
        <span>{meanLabel}</span>
        <b>{point.meanSquare.toFixed(3)}</b>
        <div className="sil-bar" aria-hidden="true">
          <i style={{ width: `${Math.min(1, point.meanSquare / 1.5) * 100}%` }} />
        </div>
      </div>
      {!film.watch && (
        <div className="sil-controls">
          {question && (
            <div className="sil-segments">
              <button onClick={() => setFrequency(340)}>{tr('检验340Hz', 'Test 340 Hz')}</button>
            </div>
          )}
          <div className="sil-segments" role="group" aria-label={tr('声波视图', 'Sound views')}>
            {(['field', 'paths', 'pressure'] as const).map((a, i) => (
              <button key={a} aria-pressed={a === v} onClick={() => setView(a)}>
                {[tr('声场', 'Field'), tr('传播路程', 'Paths'), tr('声压相加', 'Pressure sum')][i]}
              </button>
            ))}
          </div>
          <Range
            label={tr('同源频率', 'Shared frequency')}
            min={340}
            max={1000}
            step={10}
            unit="Hz"
            value={f}
            onChange={setFrequency}
          />
          <Range
            label={tr('接收点横向位置', 'Receiver x')}
            min={-1.2}
            max={1.2}
            step={0.005}
            unit="m"
            value={xx}
            onChange={setX}
          />
          <Range
            label={tr('接收点纵向位置', 'Receiver y')}
            min={-1}
            max={1}
            step={0.01}
            unit="m"
            value={yy}
            onChange={setY}
          />
          <Range
            label={tr('慢放周期位置', 'Slowed cycle position')}
            min={0}
            max={1}
            step={0.01}
            value={cycles ?? ((clock % 1) + 1) % 1}
            onChange={setCycles}
          />
          <div className="sil-segments">
            <button aria-pressed={sourceOn} onClick={() => setSecondOn(!sourceOn)}>
              {tr('第二扬声器', 'Second speaker')}: {sourceOn ? tr('开', 'On') : tr('关', 'Off')}
            </button>
            <button
              aria-pressed={phase === Math.PI}
              onClick={() => setPhase(phase === 0 ? Math.PI : 0)}
            >
              {tr('第二源反相', 'Reverse source 2')}
            </button>
            <button
              aria-pressed={showFlags}
              onClick={() => {
                setFlags(!showFlags);
                if (!showFlags) setSearch(1);
              }}
            >
              {tr('保留680Hz旗位', 'Keep 680 Hz flags')}
            </button>
            <button aria-pressed={tone.on} onClick={tone.toggle}>
              {tone.on
                ? tr('停止模型试听', 'Stop model tone')
                : tr('试听模型接收点', 'Hear model receiver')}
            </button>
          </div>
          {tone.unavailable && (
            <p role="status">
              {tr(
                '声音不可用，声压与图像仍可观察。',
                'Audio unavailable; pressure and images still work.',
              )}
            </p>
          )}
          <details className="sil-note">
            <summary>{tr('模型与试听的边界', 'Model and audio limits')}</summary>
            <p>
              {tr(
                '相距4米的理想相干点声源，声速340米每秒，振幅按1/r变化。曲线是同一接收点的声压，不是空气沿横波起伏。声压均方以同相中点为1；它不是分贝、主观响度或对向声场的净能流。忽略墙壁反射与扬声器方向性，近源区不作预测。旗位来自680Hz模型的局部搜索；开关或调频不会改写这些旧位置。试听为合成幅度，非实测录音；改变频率也改变听觉敏感度，不能按响度反求图中数值。',
                'Ideal coherent point sources are 4 m apart, with sound speed 340 m/s and amplitude proportional to 1/r. Curves show pressure at one receiver, not transverse air motion. Mean-square pressure is normalized to the in-phase midpoint. It is not decibels, perceived loudness or net energy flux. Reflections, directivity and the near-source region are excluded. Old flags come from a local search at 680 Hz and stay fixed under the controls. The optional tone synthesizes amplitude, not a recording; hearing sensitivity also varies with frequency.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

/** The cover uses the very same receiver pressure samples, not decorative waves. */
export function SoundInterferenceCoverArtwork() {
  const point = soundInterferencePoint(0.125, 0),
    cy = [70, 130, 204],
    cur = soundPressureAt(point, 0.3);
  return (
    <svg viewBox="0 0 380 260" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="368" height="248" rx="24" fill="#f0f3e6" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M34 ${cy[i]} H346`} stroke="#ced9c2" />
          <path
            d={trace((u) => {
              const p = soundPressureAt(point, u);
              return [34 + 312 * u, cy[i]! - (i === 0 ? p.p1 : i === 1 ? p.p2 : p.sum) * 45];
            })}
            stroke={colors[i]}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle
            cx={34 + 312 * 0.3}
            cy={cy[i]! - (i === 0 ? cur.p1 : i === 1 ? cur.p2 : cur.sum) * 45}
            r="5"
            fill={colors[i]}
          />
        </g>
      ))}
      <path d="M127.6 31 V233" stroke="#a99f80" strokeWidth="1.5" strokeDasharray="4 5" />
      <path
        d="M304 91 V109 M295 100 H313 M295 166 H313 M295 177 H313"
        stroke="#99aa88"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
