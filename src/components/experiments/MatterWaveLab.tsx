import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  electronWavelengthPM,
  planeIntensity,
  powderRadii,
  laueSpots,
  interferenceHits,
  electronInterference,
  braggPaths,
  planeSum,
  crystalPoint,
  matterDirector,
  finite,
  SELECTED_LAUE,
  type MatterShot,
  type MatterView,
  type Point2,
} from '../../models/matter-wave-lab';
import '../../styles/matter-wave-lab.css';
const ink = '#405e52',
  green = '#779c8c',
  copper = '#b18360',
  line = '#bdcdc1',
  dark = '#304b42';
const path = (ps: Point2[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
function Text({
  x,
  y,
  children,
  anchor = 'middle',
  color = ink,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'middle' | 'start' | 'end';
  color?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={16}>
      {children}
    </text>
  );
}
function Arrow({ a, b, color = ink }: { a: Point2; b: Point2; color?: string }) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l = Math.hypot(dx, dy),
    u = { x: dx / (l || 1), y: dy / (l || 1) };
  return (
    <>
      <path d={path([a, b])} fill="none" stroke={color} strokeWidth={2} />
      {l > 3 && (
        <path
          d={path([
            { x: b.x - 5 * u.x + 2.5 * u.y, y: b.y - 5 * u.y - 2.5 * u.x },
            b,
            { x: b.x - 5 * u.x - 2.5 * u.y, y: b.y - 5 * u.y + 2.5 * u.x },
          ])}
          stroke={color}
          fill="none"
          strokeWidth={1.5}
        />
      )}
    </>
  );
}
function Planes({ s, w, en }: { s: MatterShot; w: number; en: boolean }) {
  const g = braggPaths(s.theta, s.d, s.lambda),
    ps = [...g.upper, ...g.lower],
    xs = ps.map((p) => p.x),
    ys = ps.map((p) => p.y),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    scale = Math.min((w - 40) / (maxX - minX), 82 / (maxY - minY)),
    X = (p: Point2) => ({
      x: w / 2 + (p.x - (maxX + minX) / 2) * scale,
      y: 44 + (p.y - minY) * scale,
    }),
    O = X(g.O),
    A = X(g.A),
    B = X(g.B),
    C = X(g.C),
    clock = s.clock * 2 * Math.PI;
  const wave = (j: number) =>
    Array.from({ length: 121 }, (_, i) => {
      const t = (i / 120) * 4 * Math.PI - clock,
        a = Math.cos(t),
        b = Math.cos(t - g.phase);
      return {
        x: 30 + ((w - 44) * i) / 120,
        y: [193, 215, 240][j]! - 6 * (j === 0 ? a : j === 1 ? b : a + b),
      };
    });
  return (
    <>
      <desc>
        {en
          ? 'AO and OC are equal-phase incoming and outgoing wavefronts. AB and BC are the extra travel distances.'
          : 'AO和OC分别是同相入射与出射波面，AB和BC是多出的路程。'}
      </desc>
      <Text x={w / 2} y={19}>
        d = {s.d.toFixed(1)} pm · λ = {s.lambda.toFixed(1)} pm
      </Text>
      {[O.y, B.y].map((y, j) => (
        <g key={j}>
          <path d={`M16 ${y}H${w - 16}`} stroke={line} />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={22 + ((w - 44) * i) / 8} cy={y} r={2.5} fill={green} />
          ))}
        </g>
      ))}
      <path
        data-matter-route="upper"
        d={path(g.upper.map(X))}
        fill="none"
        stroke={green}
        strokeWidth={2.5}
      />
      <path
        data-matter-route="lower"
        d={path(g.lower.map(X))}
        fill="none"
        stroke={copper}
        strokeWidth={2.5}
      />
      <path data-matter-wavefront="incident" d={path([O, A])} stroke={ink} strokeDasharray="3 3" />
      <path data-matter-wavefront="outgoing" d={path([O, C])} stroke={ink} strokeDasharray="3 3" />
      <path
        data-extra-route="AB"
        data-length-pm={g.incoming}
        d={path([A, B])}
        stroke="#9b6441"
        strokeWidth={4}
      />
      <path
        data-extra-route="BC"
        data-length-pm={g.outgoing}
        d={path([B, C])}
        stroke="#477b65"
        strokeWidth={4}
      />
      {(
        [
          [O, 'O', 0, -8],
          [A, 'A', -20, 3],
          [C, 'C', 20, 3],
        ] as const
      ).map(([p, t, dx, dy]) => (
        <Text key={t} x={p.x + dx} y={p.y + dy}>
          {t}
        </Text>
      ))}
      <path d={`M${w - 16} ${O.y}h-4M${w - 18} ${O.y}V${B.y}M${w - 16} ${B.y}h-4`} stroke={line} />
      <circle data-matter-point="B" cx={B.x} cy={B.y} r={3} fill={ink} />
      <g data-matter-label="B">
        <Text x={B.x} y={B.y + 21}>
          B
        </Text>
      </g>
      <path
        d={`M${O.x - 20} ${O.y}A20 20 0 0 1 ${O.x - 20 * Math.cos(g.theta)} ${O.y - 20 * Math.sin(g.theta)}`}
        stroke={ink}
        fill="none"
      />
      <Text x={O.x - 48} y={O.y + 20}>
        θ
      </Text>
      <Text x={w / 2} y={172}>
        AB + BC = 2d sin θ = {g.delta.toFixed(1)} pm
      </Text>
      {[0, 1, 2].map((j) => (
        <g key={j}>
          <Text x={13} y={[198, 220, 245][j]!}>
            {j === 2 ? 'Σ' : j + 1}
          </Text>
          <path
            data-matter-field={j}
            data-wave-phase={g.phase}
            d={path(wave(j))}
            fill="none"
            stroke={[green, copper, ink][j]}
            strokeWidth={j === 2 ? 2.2 : 1.8}
          />
        </g>
      ))}
    </>
  );
}
function Reflection({ s, w, en }: { s: MatterShot; w: number; en: boolean }) {
  const theta = (s.theta * Math.PI) / 180,
    i = planeIntensity(theta, s.lambda, s.d),
    cx = w / 2,
    cy = 104,
    L = Math.min(118, w * 0.38),
    input = { x: cx - L * Math.cos(theta), y: cy - L * Math.sin(theta) },
    out = { x: cx + L * Math.cos(theta), y: cy - L * Math.sin(theta) },
    curve = Array.from({ length: 181 }, (_, j) => ({
      x: 25 + ((w - 50) * j) / 180,
      y: 218 - 61 * planeIntensity(((8 + (27 * j) / 180) * Math.PI) / 180, s.lambda, s.d),
    }));
  return (
    <>
      <Text x={w / 2} y={19}>
        {en ? 'Calculated angular signal · 100 V' : '计算角分布 · 100 V'}
      </Text>
      <rect
        x={input.x - 18}
        y={input.y - 9}
        width={30}
        height={18}
        rx={7}
        fill={green}
        transform={`rotate(${s.theta} ${input.x} ${input.y})`}
      />
      <Arrow a={input} b={{ x: cx, y: cy }} color={green} />
      <path
        data-scattered-ray
        d={path([{ x: cx, y: cy }, out])}
        stroke={copper}
        strokeWidth={2 + 2 * i}
      />
      <rect
        data-detector
        x={out.x - 5}
        y={out.y - 13}
        width={10}
        height={26}
        rx={3}
        fill={ink}
        transform={`rotate(${-s.theta} ${out.x} ${out.y})`}
      />
      {Array.from({ length: 8 }, (_, j) => (
        <path key={j} d={`M${cx - 43} ${cy + j * 4}h86`} stroke={line} />
      ))}
      <Text x={w / 2} y={149}>
        θ = {s.theta.toFixed(1)}° · I/Imax = {i.toFixed(2)}
      </Text>
      <path d={`M25 157V218H${w - 25}`} stroke={line} fill="none" />
      <path d={path(curve)} fill="none" stroke={green} strokeWidth={2} />
      <circle
        data-angle-signal
        data-theta={s.theta}
        data-intensity={i}
        cx={25 + ((w - 50) * (s.theta - 8)) / 27}
        cy={218 - 61 * i}
        r={4}
        fill={copper}
      />
      <Text x={25} y={244} anchor="start">
        8°
      </Text>
      <Text x={w - 25} y={244} anchor="end">
        35°
      </Text>
      <Text x={w / 2} y={244}>
        {en ? 'Teaching model' : '教学模型'}
      </Text>
    </>
  );
}
function Phasors({ s, w, en }: { s: MatterShot; w: number; en: boolean }) {
  const a = planeSum(s.theta, s.lambda, s.d, 8),
    points = [{ x: 0, y: 0 }, ...a.vectors.map((v) => v.end)],
    loX = Math.min(...points.map((p) => p.x)),
    hiX = Math.max(...points.map((p) => p.x)),
    loY = Math.min(...points.map((p) => p.y)),
    hiY = Math.max(...points.map((p) => p.y)),
    scale = Math.min((w - 55) / Math.max(hiX - loX, 1), 54 / Math.max(hiY - loY, 1), 25),
    P = (p: Point2) => ({
      x: w / 2 + (p.x - (loX + hiX) / 2) * scale,
      y: 96 - (p.y - (loY + hiY) / 2) * scale,
    }),
    clock = s.clock * 2 * Math.PI;
  return (
    <>
      <Text x={w / 2} y={19}>
        {en ? 'Eight equal contributions' : '八个等距晶面的贡献'}
      </Text>
      <Text x={w / 2} y={44}>
        Δ/λ = {a.cycles.toFixed(3)} · θ = {s.theta.toFixed(1)}°
      </Text>
      {a.vectors.map((v) => (
        <g key={v.id} data-plane-vector={v.id}>
          <Arrow a={P(v.start)} b={P(v.end)} color={v.id % 2 ? copper : green} />
        </g>
      ))}
      <Text x={w / 2} y={139}>
        {en ? 'Head-to-tail phase vectors' : '相位箭头首尾相加'}
      </Text>
      <path d={`M20 194H${w - 20}`} stroke={line} />
      <path
        data-eight-plane-sum
        d={path(
          Array.from({ length: 161 }, (_, j) => {
            const p = (4 * Math.PI * j) / 160 - clock;
            return {
              x: 20 + ((w - 40) * j) / 160,
              y: 194 - 4 * (a.re * Math.cos(p) + a.im * Math.sin(p)),
            };
          }),
        )}
        stroke={ink}
        fill="none"
        strokeWidth={2.5}
      />
      <Text x={w / 2} y={245}>
        λ = {s.lambda.toFixed(1)} pm · I/Imax = {a.intensity.toFixed(2)}
      </Text>
    </>
  );
}
function Rings({ s, w, en }: { s: MatterShot; w: number; en: boolean }) {
  const rs = powderRadii(s.voltage),
    baseline = powderRadii(2000),
    cx = w < 400 ? w * 0.67 : w * 0.64,
    cy = 176,
    mag = 2.45,
    foil = w * 0.47,
    screen = w - 35,
    axis = 65,
    projection = (screen - foil) / 100;
  return (
    <>
      <Text x={w / 2} y={19}>
        {s.question
          ? en
            ? '5000 V: wider or narrower?'
            : '升至5000 V，环会怎样？'
          : en
            ? 'Many grain orientations → cones'
            : '多种晶粒方向 → 衍射圆锥'}
      </Text>
      <rect x={20} y={axis - 13} width={43} height={26} rx={9} fill={green} />
      <path d={`M63 ${axis}H${foil}`} stroke={copper} strokeWidth={2} />
      <path d={`M${foil} ${axis - 23}v46`} stroke={ink} strokeWidth={3} />
      <path d={`M${screen} ${axis - 27}v54`} stroke={green} strokeWidth={5} />
      {rs.map((r, j) => (
        <path
          key={j}
          data-powder-cone={j}
          d={`M${foil} ${axis}L${screen} ${axis - r * projection}M${foil} ${axis}L${screen} ${axis + r * projection}`}
          fill="none"
          stroke={j ? copper : green}
          strokeWidth={1.6}
        />
      ))}
      <Text x={(foil + screen) / 2} y={108}>
        L = 100 mm
      </Text>
      <circle cx={cx} cy={cy} r={59} fill={dark} />
      {baseline.map((r, j) => (
        <circle
          key={j}
          data-ring-reference={j}
          cx={cx}
          cy={cy}
          r={r * mag}
          fill="none"
          stroke={line}
          strokeDasharray="3 4"
          opacity={s.voltage > 2001 ? 0.55 : 0}
        />
      ))}
      {rs.map((r, j) => (
        <circle
          key={j}
          data-powder-ring={j}
          data-radius-mm={r}
          cx={cx}
          cy={cy}
          r={r * mag}
          fill="none"
          stroke={j ? '#dcc5a6' : '#cae0c7'}
          strokeWidth={2}
        />
      ))}
      <circle cx={cx} cy={cy} r={2} fill="#dce6bf" />
      <Text x={18} y={145} anchor="start">
        {s.voltage.toFixed(0)} V
      </Text>
      <Text x={18} y={169} anchor="start">
        λ {electronWavelengthPM(s.voltage).toFixed(1)} pm
      </Text>
      <Text x={18} y={199} anchor="start">
        r₁ {rs[0]!.toFixed(2)} mm
      </Text>
      <Text x={18} y={223} anchor="start">
        r₂ {rs[1]!.toFixed(2)} mm
      </Text>
      <Text x={w / 2} y={254}>
        {en ? 'Screen enlarged · model, not a record' : '屏面放大 · 教学计算，非实测记录'}
      </Text>
    </>
  );
}
function Events({ s, w, en }: { s: MatterShot; w: number; en: boolean }) {
  const all = useMemo(() => interferenceHits(s.voltage, 350), [s.voltage]);
  return (
    <>
      <Text x={w / 2} y={19}>
        {en ? 'Localized counts → probability fringes' : '局域探测 → 概率条纹'}
      </Text>
      <rect x={22} y={40} width={40} height={24} rx={8} fill={green} />
      <path d={`M62 52H${w * 0.44}`} stroke={line} />
      <path d={`M${w * 0.43} 32h35M${w * 0.43} 72h35`} stroke={green} strokeWidth={3} />
      <circle cx={w * 0.48} cy={52} r={2.5} fill={copper} />
      <Text x={w * 0.7} y={57}>
        {en ? 'Biprism' : '电子双棱镜'}
      </Text>
      <rect x={18} y={95} width={w - 36} height={102} rx={10} fill={dark} />
      {all.slice(0, s.count).map((h) => (
        <circle
          key={h.id}
          data-hit-id={h.id}
          cx={w / 2 + (h.x * (w - 55)) / 10}
          cy={146 + h.y * 43}
          r={1.4}
          fill="#d6e7c6"
        />
      ))}
      <path
        d={path(
          Array.from({ length: 181 }, (_, i) => ({
            x: 25 + ((w - 50) * i) / 180,
            y: 231 - 26 * electronInterference(-5 + (10 * i) / 180, s.voltage),
          })),
        )}
        stroke={green}
        strokeWidth={2}
        fill="none"
      />
      <Text x={w / 2} y={254}>
        {en ? 'Deterministic model samples' : '确定性教学采样'} · {s.count}
      </Text>
    </>
  );
}
function Laue({ s, w, en }: { s: MatterShot; w: number; en: boolean }) {
  const spots = useMemo(() => laueSpots(s.rotation), [s.rotation]),
    selected = spots.find((p) => p.h === 2 && p.k === 1 && p.l === -1),
    base = w * 0.43,
    project = (p: { x: number; y: number; z: number }) => ({
      x: base + 19 * p.z + 12 * p.x,
      y: 76 + 6 * p.y - 5 * p.z,
    }),
    source = project({ x: 0, y: 0, z: -3 }),
    center = project({ x: 0, y: 0, z: 0 }),
    screen = ([-1, 1] as const).flatMap((x) =>
      ([-1, 1] as const).map((y) => ({ x: x * 4.6, y: y * 4.6, z: 4 })),
    ),
    square = [screen[0]!, screen[2]!, screen[3]!, screen[1]!, screen[0]!],
    crystal = Array.from({ length: 27 }, (_, i) =>
      crystalPoint((i % 3) - 1, (Math.floor(i / 3) % 3) - 1, Math.floor(i / 9) - 1, s.rotation),
    ).sort((a, b) => a.z - b.z),
    cx = w < 400 ? w * 0.66 : w * 0.63,
    cy = 175,
    scale = 45;
  return (
    <>
      <Text x={w / 2} y={19}>
        {s.question
          ? en
            ? 'Same spectrum: rotate the crystal?'
            : '光谱不变，转动会改变什么？'
          : en
            ? '3D simple-cubic calculation'
            : '三维简单立方计算'}
      </Text>
      <path d={path(square.map(project))} fill="#e3ece4" stroke={line} />
      <rect x={source.x - 20} y={source.y - 9} width={32} height={18} rx={6} fill={green} />
      <path data-laue-incident d={path([source, center])} stroke={copper} strokeWidth={2} />
      {spots
        .filter((_, i) => i % 5 === 0)
        .slice(0, 9)
        .map((p) => (
          <path
            key={`${p.h},${p.k},${p.l}`}
            d={path([center, project({ x: 4 * p.x, y: 4 * p.y, z: 4 })])}
            fill="none"
            stroke={line}
            opacity={0.75}
          />
        ))}
      {selected && (
        <path
          data-laue-selected-ray
          d={path([center, project({ x: 4 * selected.x, y: 4 * selected.y, z: 4 })])}
          stroke={copper}
          strokeWidth={2}
        />
      )}{' '}
      {crystal.map((p, i) => (
        <circle
          key={i}
          data-crystal-atom={i}
          cx={project(p).x}
          cy={project(p).y}
          r={2.7}
          fill={green}
          stroke="#f2f4eb"
          strokeWidth={0.5}
        />
      ))}
      <rect x={cx - 58} y={cy - 58} width={116} height={116} rx={9} fill={dark} />
      {spots.map((p) => (
        <circle
          key={`${p.h},${p.k},${p.l}`}
          data-laue-hkl={`${p.h},${p.k},${p.l}`}
          data-laue-x={p.x}
          data-laue-y={p.y}
          data-laue-wavelength={p.wavelengthPM}
          cx={cx + p.x * scale}
          cy={cy + p.y * scale}
          r={2.1}
          fill="#e4e5bb"
        />
      ))}
      {selected && (
        <circle
          data-selected-family
          cx={cx + selected.x * scale}
          cy={cy + selected.y * scale}
          r={5.3}
          stroke={copper}
          strokeWidth={1.5}
          fill="none"
        />
      )}
      <circle cx={cx} cy={cy} r={4} fill="#24392f" stroke={green} />
      <Text x={15} y={144} anchor="start">
        40–220 pm
      </Text>
      <Text x={15} y={168} anchor="start">
        {en ? 'Fixed band' : '波段不变'}
      </Text>
      <Text x={15} y={200} anchor="start">
        {((s.rotation * 180) / Math.PI).toFixed(1)}°
      </Text>
      <Text x={15} y={225} anchor="start">
        {spots.length} {en ? 'spots' : '个斑点'}
      </Text>
      <Text x={w / 2} y={254}>
        {selected
          ? '(2, 1, −1) · λ ' + selected.wavelengthPM.toFixed(1) + ' pm'
          : en
            ? 'Calculated positions only'
            : '允许位置，不表示实测强度'}
      </Text>
    </>
  );
}
export function MatterWaveArtwork({
  mode = 0,
  value = 0.6,
  progress = 0.6,
  shot,
  width = 340,
  locale,
}: {
  mode?: number;
  value?: number;
  progress?: number;
  shot?: MatterShot;
  width?: number;
  locale?: 'zh' | 'en';
}) {
  const w = finite(width, 260, 740, 340),
    en = (locale ?? browserLocale()) === 'en',
    legacy = matterDirector([0, 2, 3, 4, 5][mode] ?? 0, finite(progress, 0, 1, 0.6) * 28),
    s = shot ?? {
      ...legacy,
      theta: 12 + finite(value, 0, 1, 0.6) * 23,
      voltage: 2000 + 5000 * finite(value, 0, 1, 0.6),
      rotation: (finite(value, 0, 1, 0.6) - 0.5) * 1.2,
    },
    height = 260;
  return (
    <svg
      className="mw19-art"
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      role="img"
      aria-label={
        en ? 'Calculated crystal paths, phase and diffraction' : '由晶面光路、相位与晶格计算的衍射'
      }
      data-matter-view={s.view}
      data-matter-theta={s.theta}
      data-matter-voltage={s.voltage}
      data-matter-rotation={s.rotation}
      data-matter-count={s.count}
      data-matter-question={s.question}
      data-matter-d={s.d}
      data-matter-lambda={s.lambda}
    >
      {s.view === 'planes' ? (
        <Planes s={s} w={w} en={en} />
      ) : s.view === 'reflection' ? (
        <Reflection s={s} w={w} en={en} />
      ) : s.view === 'phasors' ? (
        <Phasors s={s} w={w} en={en} />
      ) : s.view === 'rings' ? (
        <Rings s={s} w={w} en={en} />
      ) : s.view === 'events' ? (
        <Events s={s} w={w} en={en} />
      ) : (
        <Laue s={s} w={w} en={en} />
      )}
    </svg>
  );
}
export default function MatterWaveLab() {
  const film = useShowcase(),
    locale = browserLocale(),
    en = locale === 'en',
    say = (zh: string, english: string) => (en ? english : zh),
    authored = matterDirector(film.chapter, film.chapterTime, locale),
    [over, setOver] = useState<Partial<MatterShot>>({}),
    [width, setWidth] = useState(340),
    host = useRef<HTMLDivElement>(null),
    s = film.watch ? authored : { ...authored, ...over },
    patch = (p: Partial<MatterShot>) => setOver({ ...s, ...p });
  useEffect(() => {
    if (typeof window === 'undefined' || !host.current) return;
    const el = host.current,
      update = () => setWidth(finite(el.clientWidth, 260, 740, 340));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(update);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  const views: { value: MatterView; label: string }[] = [
    { value: 'reflection', label: say('晶体反射', 'Crystal reflection') },
    { value: 'phasors', label: say('八面叠加', 'Eight-plane sum') },
    { value: 'rings', label: say('衍射圆环', 'Diffraction rings') },
    { value: 'events', label: say('探测积累', 'Detection events') },
    { value: 'laue', label: say('三维劳厄', '3D Laue') },
    { value: 'planes', label: say('晶面光路', 'Plane paths') },
  ];
  return (
    <div className="mw19-lab" ref={host} data-watch={film.watch}>
      <MatterWaveArtwork shot={s} width={width} locale={locale} />
      {!film.watch && (
        <div className="mw19-controls">
          <Segments
            label={say('物质波视图', 'Matter-wave view')}
            value={s.view}
            options={views}
            onChange={(v) =>
              patch({
                view: v as MatterView,
                question: false,
                ...(v === 'reflection' || v === 'phasors'
                  ? { theta: 16.7, d: 213, lambda: electronWavelengthPM(100) }
                  : v === 'planes'
                    ? {
                        theta: SELECTED_LAUE.theta,
                        d: SELECTED_LAUE.d,
                        lambda: SELECTED_LAUE.lambda,
                      }
                    : v === 'events'
                      ? { voltage: 2000 }
                      : {}),
              })
            }
          />
          {(s.view === 'reflection' || s.view === 'phasors' || s.view === 'planes') && (
            <Range
              label={say('掠射角 / °', 'Grazing angle / °')}
              value={s.theta}
              min={s.view === 'planes' ? 5 : 8}
              max={s.view === 'planes' ? 65 : 35}
              step={0.1}
              onChange={(theta) => patch({ theta })}
            />
          )}{' '}
          {s.view === 'planes' && (
            <>
              <Range
                label={say('晶面间距 / pm', 'Plane spacing / pm')}
                value={s.d}
                min={100}
                max={300}
                step={0.1}
                onChange={(d) => patch({ d })}
              />
              <Range
                label={say('波长 / pm', 'Wavelength / pm')}
                value={s.lambda}
                min={40}
                max={250}
                step={0.1}
                onChange={(lambda) => patch({ lambda })}
              />
            </>
          )}
          {s.view === 'rings' && (
            <>
              <Range
                label={say('加速电压 / V', 'Accelerating voltage / V')}
                value={s.voltage}
                min={2000}
                max={7000}
                step={100}
                onChange={(voltage) => patch({ voltage, question: false })}
              />
              {s.question && (
                <button onClick={() => patch({ voltage: 5000, question: false })}>
                  {say('检验5000 V', 'Test 5000 V')}
                </button>
              )}
            </>
          )}
          {s.view === 'events' && (
            <Range
              label={say('已积累事件', 'Accumulated events')}
              value={s.count}
              min={0}
              max={350}
              step={1}
              onChange={(count) => patch({ count })}
            />
          )}{' '}
          {s.view === 'laue' && (
            <>
              <Range
                label={say('晶体转角 / °', 'Crystal rotation / °')}
                value={(s.rotation * 180) / Math.PI}
                min={-34}
                max={34}
                step={0.1}
                onChange={(v) => patch({ rotation: (v * Math.PI) / 180, question: false })}
              />
              {s.question && (
                <button onClick={() => patch({ rotation: 0.22, question: false })}>
                  {say('转动检验', 'Test rotation')}
                </button>
              )}
            </>
          )}
          <details>
            <summary>{say('模型与记录的区别', 'Model and record')}</summary>
            <p>
              {say(
                '这些图是计算，不是历史照片的描点。晶面反射忽略多重散射；圆环使用两组示例间距；劳厄只算简单立方允许位置。电子光点是固定教学采样，不是粒子在仪器中的轨道。',
                'These figures are calculations, not digitized historical observations. Plane reflection omits multiple scattering; rings use two example spacings; Laue predicts simple-cubic allowed positions. Electron dots are fixed teaching samples, not trajectories through the apparatus.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
