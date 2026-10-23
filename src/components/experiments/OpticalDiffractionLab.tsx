import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  diffractionDirector,
  slitProfile,
  diffractionDisplayColor,
  diffractionDisplayLevel,
  SLIT_EXPOSURE,
  slitContributions,
  bandPathDifference,
  slitPrediction,
  fresnelCircle,
  diskAxisGeometry,
  bounded,
  type DiffractionShot,
  type DiffractionView,
} from '../../models/optical-diffraction-lab';
import '../../styles/optical-diffraction-lab.css';
const ink = '#40594e',
  green = '#769784',
  amber = '#b98958',
  line = '#b9c6b8',
  dark = '#19291f';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
function T({
  x,
  y,
  children,
  anchor = 'middle',
  color = ink,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={16}>
      {children}
    </text>
  );
}
const path = (ps: { x: number; y: number }[]) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
function ApertureObject({ s, w }: { s: DiffractionShot; w: number }) {
  const cx = w / 2,
    gap = 8 + s.width * 0.045,
    cy = 66;
  if (s.view === 'pencils')
    return (
      <g data-apparatus="pencils">
        <path
          d={`M24 ${cy - gap / 2 - 19}H${w - 24}L${w - 10} ${cy - gap / 2 - 9}L${w - 24} ${cy - gap / 2}H24Z`}
          fill="#c4aa7f"
          stroke="#8a775c"
        />
        <path
          d={`M24 ${cy + gap / 2}H${w - 24}L${w - 10} ${cy + gap / 2 + 9}L${w - 24} ${cy + gap / 2 + 19}H24Z`}
          fill="#bda17a"
          stroke="#8a775c"
        />
        <path
          d={`M24 ${cy - gap / 2}H${w - 24}M24 ${cy + gap / 2}H${w - 24}`}
          stroke={dark}
          strokeWidth={2}
        />
      </g>
    );
  if (s.view === 'calipers')
    return (
      <g data-apparatus="calipers">
        <path d={`M24 40H${w - 24}V49H24Z`} fill="#b1beb6" />
        <path
          d={`M${cx - gap / 2 - 11} 40V93H${cx - gap / 2}V58H${cx - gap / 2 - 3}V40ZM${cx + gap / 2 + 11} 40V93H${cx + gap / 2}V58H${cx + gap / 2 + 3}V40Z`}
          fill="#91a99a"
          stroke={ink}
        />
        <path d={`M${cx - gap / 2} 66H${cx + gap / 2}`} stroke={amber} strokeWidth={2} />
      </g>
    );
  return (
    <g data-apparatus="slit">
      <path d={`M20 66H${cx - 13}`} stroke={green} strokeWidth={2} />
      <path
        d={`M${cx - 5} 37V${cy - gap / 2}M${cx - 5} ${cy + gap / 2}V94`}
        stroke={ink}
        strokeWidth={10}
      />
      <path
        d={`M${cx + 4} ${cy - gap / 2}L${w - 24} 48M${cx + 4} ${cy + gap / 2}L${w - 24} 84`}
        fill="none"
        stroke={green}
        strokeDasharray="3 4"
      />
      <path d={`M${w - 24} 38V94`} stroke={line} strokeWidth={4} />
      <T x={w - 27} y={31} anchor="end">
        z = 1 m
      </T>
    </g>
  );
}
function SlitScreen({ s, w }: { s: DiffractionShot; w: number }) {
  const profiles = useMemo(
    () => slitProfile(s.width, s.white, s.wavelength),
    [s.width, s.white, s.wavelength],
  );
  const baseline = useMemo(() => slitProfile(100, false, 550), []),
    X = (x: number) => 16 + ((x + 15) / 30) * (w - 32),
    curve = (ps: typeof profiles) =>
      path(
        ps.map((p) => ({
          x: X(p.x),
          y:
            230 -
            55 *
              diffractionDisplayLevel(
                p.values.reduce((a, b) => a + b, 0) / p.values.length,
                SLIT_EXPOSURE,
              ),
        })),
      ),
    pred = slitPrediction(s.width, s.wavelength),
    basePred = slitPrediction(100, 550),
    changed = s.view === 'prediction' || s.view === 'pencils' || s.view === 'calipers';
  return (
    <g data-view={s.view} data-width={s.width} data-reveal={s.reveal}>
      <T x={w / 2} y={20}>
        a = {s.width} μm · λ = {s.wavelength} nm
      </T>
      <ApertureObject s={s} w={w} />
      <rect x={16} y={101} width={w - 32} height={47} rx={6} fill={dark} />
      {s.reveal ? (
        profiles.map((p, j) => (
          <rect
            key={j}
            data-screen-x={p.x}
            shapeRendering="crispEdges"
            data-intensity={p.values[0]}
            x={X(p.x)}
            y={103}
            width={(w - 32) / 300 + 0.2}
            height={43}
            fill={diffractionDisplayColor(p.values, SLIT_EXPOSURE, s.wavelength)}
          />
        ))
      ) : (
        <T x={w / 2} y={131} color="#d1dbcc">
          {say('先预测，再揭晓', 'Predict, then reveal')}
        </T>
      )}
      <path d={`M16 230H${w - 16}`} stroke={line} />
      {changed && (
        <path d={curve(baseline)} fill="none" stroke={line} strokeWidth={2} strokeDasharray="4 3" />
      )}
      {s.reveal && <path d={curve(profiles)} fill="none" stroke={green} strokeWidth={2} />}
      {changed && (
        <>
          <path d={`M${X(basePred.firstMm)} 185V233`} stroke={line} strokeDasharray="2 3" />
          {s.reveal && (
            <path
              data-first-prediction={pred.firstMm}
              d={`M${X(pred.firstMm)} 185V233`}
              stroke={amber}
              strokeDasharray="3 3"
            />
          )}
        </>
      )}
      <T x={16} y={249} anchor="start">
        −15 mm
      </T>
      <T x={w - 16} y={249} anchor="end">
        15 mm
      </T>
      <T x={w / 2} y={175}>
        {changed
          ? s.reveal
            ? `${say('首暗近似', 'First dark ≈')} ${pred.firstMm.toFixed(1)} mm`
            : say('新暗纹移向哪里？', 'Where is the new dark band?')
          : say('固定曝光 · 强度图', 'Fixed exposure · intensity')}
      </T>
    </g>
  );
}
function Contributions({ s, w }: { s: DiffractionShot; w: number }) {
  const data = slitContributions(s.x, s.width, s.wavelength),
    xx = 96,
    span = w - 112,
    clock = s.clock * Math.PI * 2;
  const wave = (id: number, y: number, paired = false) =>
    path(
      Array.from({ length: 73 }, (_, j) => {
        const first = data.relative[id]!,
          second = paired ? data.relative[id + 4]! : { re: 0, im: 0 },
          b = { re: first.re + second.re, im: first.im + second.im },
          p = (j / 72) * Math.PI * 3 - clock;
        return { x: xx + (j / 72) * span, y: y - 70 * (b.re * Math.cos(p) - b.im * Math.sin(p)) };
      }),
    );
  return (
    <g data-view="contributions" data-sample-x={s.x}>
      <T x={w / 2} y={20}>
        {say('同一屏点', 'One screen point')} x = {s.x.toFixed(1)} mm
      </T>
      <T x={w / 2} y={45}>
        Δ ≈ {data.pairPathNm.toFixed(0)} nm = {(data.pairPathNm / s.wavelength).toFixed(2)} λ
      </T>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} data-band-id={i}>
          <rect x={18} y={61 + i * 17} width={17} height={16} rx={2} fill={i < 4 ? green : amber} />
          <T x={43} y={74 + i * 17} anchor="start">
            {i + 1}
          </T>
        </g>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <T x={80} y={78 + i * 36}>
            {i + 1}+{i + 5}
          </T>
          <path d={wave(i, 74 + i * 36)} stroke={green} strokeWidth={2} fill="none" />
          <path d={wave(i + 4, 74 + i * 36)} stroke={amber} strokeWidth={2} fill="none" />
          <path
            data-pair-sum={i}
            d={wave(i, 74 + i * 36, true)}
            stroke={ink}
            strokeWidth={1.4}
            strokeDasharray="3 2"
            fill="none"
          />
        </g>
      ))}
      <T x={w / 2} y={225}>
        {say('八带合场', 'Eight-band sum')}: I / I₀ = {data.intensity.toExponential(2)}
      </T>
      <T x={w / 2} y={249}>
        {say('绿场 + 棕场 → 虚线合场', 'Green + amber → dashed sum')}
      </T>
    </g>
  );
}
function PathDifference({ s, w }: { s: DiffractionShot; w: number }) {
  const d = bandPathDifference(s.x, s.width, s.wavelength),
    range = Math.max(1, Math.ceil(Math.abs(d.cycles))),
    start = 65,
    span = w - 95,
    end = start + (span * Math.abs(d.cycles)) / range;
  return (
    <g data-view="paths" data-path-delta={d.delta}>
      <T x={w / 2} y={20}>
        {say('1、5带中心的路径差', 'Paths from band centers 1 and 5')}
      </T>
      <T x={w / 2} y={46}>
        {say('扣去共同路程后', 'Common path removed')}
      </T>
      <T x={28} y={95}>
        1
      </T>
      <T x={28} y={145}>
        5
      </T>
      <path d={`M${start} 66V163`} stroke={line} strokeDasharray="3 3" />
      <path d={`M${start} 89H${end}`} stroke={green} strokeWidth={7} />
      <circle cx={start} cy={139} r={4} fill={amber} />
      <path d={`M${start} 175H${start + span}`} stroke={line} />
      {Array.from({ length: range * 2 + 1 }, (_, i) => (
        <path key={i} d={`M${start + (span * i) / (range * 2)} 171V180`} stroke={line} />
      ))}
      <T x={start} y={199}>
        0
      </T>
      <T x={start + span / 2} y={199}>
        {range / 2}λ
      </T>
      <T x={start + span} y={199}>
        {range}λ
      </T>
      <T x={w / 2} y={230}>
        Δ ≈ {(d.delta * 1e9).toFixed(1)} nm
      </T>
      <T x={w / 2} y={247}>
        {say('傍轴路径；每条带仍积分', 'Path centers; bands are integrated')}
      </T>
    </g>
  );
}
function Colors({ s, w }: { s: DiffractionShot; w: number }) {
  const profiles = useMemo(() => slitProfile(s.width, true), [s.width]),
    X = (x: number) => 16 + ((x + 15) / 30) * (w - 32),
    colors = ['#bd8268', '#85a57c', '#738fb4'];
  return (
    <g data-view="colors">
      <T x={w / 2} y={20}>
        {say('各色强度相加，不相位相加', 'Add intensities across colors')}
      </T>
      {[650, 530, 460].map((wl, i) => (
        <g key={wl}>
          <T x={16} y={48 + i * 46} anchor="start" color={colors[i]}>
            {wl} nm
          </T>
          <rect x={88} y={33 + i * 46} width={w - 104} height={28} rx={3} fill={dark} />
          {profiles.map((p, j) => (
            <rect
              key={j}
              shapeRendering="crispEdges"
              x={88 + (j / 300) * (w - 104)}
              y={35 + i * 46}
              width={(w - 104) / 300 + 0.2}
              height={24}
              fill={`rgb(${[25, 41, 31]
                .map((background, channel) => {
                  const foreground = [
                    [189, 130, 104],
                    [133, 165, 124],
                    [115, 143, 180],
                  ][i]![channel]!;
                  return Math.round(
                    background +
                      (foreground - background) *
                        diffractionDisplayLevel(p.values[i]!, SLIT_EXPOSURE),
                  );
                })
                .join(',')})`}
            />
          ))}
        </g>
      ))}
      <rect x={16} y={180} width={w - 32} height={44} rx={5} fill={dark} />
      {profiles.map((p, j) => (
        <rect
          key={j}
          shapeRendering="crispEdges"
          x={X(p.x)}
          y={182}
          width={(w - 32) / 300 + 0.2}
          height={40}
          fill={diffractionDisplayColor(p.values, SLIT_EXPOSURE, s.wavelength)}
        />
      ))}
      <T x={w / 2} y={248}>
        {say('三波长示意 · 非实测光谱', 'Three wavelength samples')}
      </T>
    </g>
  );
}
function CircleScreen({ s, w }: { s: DiffractionShot; w: number }) {
  const disk = s.mode === 1,
    exposure = disk ? 2.5 : SLIT_EXPOSURE,
    radial = useMemo(
      () =>
        Array.from({ length: 181 }, (_, i) => ({
          r: (i / 180) * 2.3,
          I: fresnelCircle((i / 180) * 2.3, s.radius, s.wavelength, 1, disk),
        })),
      [s.radius, s.wavelength, disk],
    ),
    cx = w * 0.31,
    cy = 128,
    R = Math.min(76, w * 0.26),
    right = w * 0.68,
    pw = w * 0.26;
  return (
    <g data-view={disk ? 'disk' : 'aperture'} data-radius={s.radius}>
      <T x={w / 2} y={20}>
        {disk ? say('不透明圆盘', 'Opaque disk') : say('圆形开口', 'Circular aperture')}: a ={' '}
        {s.radius.toFixed(2)} mm
      </T>
      <circle cx={cx} cy={cy} r={R + 2} fill={dark} />
      {[...radial].reverse().map((p, i) => (
        <circle
          key={i}
          data-r={p.r}
          data-radial-intensity={p.I}
          cx={cx}
          cy={cy}
          r={Math.max(0.3, (p.r / 2.3) * R)}
          fill={diffractionDisplayColor([p.I], exposure, s.wavelength)}
        />
      ))}
      {disk && (
        <circle
          data-geometric-shadow={s.radius}
          cx={cx}
          cy={cy}
          r={(s.radius / 2.3) * R}
          fill="none"
          stroke="#e8d4a7"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      <T x={right + pw / 2} y={73}>
        I(0) / I₀
      </T>
      <T x={right + pw / 2} y={99}>
        {radial[0]!.I.toFixed(3)}
      </T>
      <path d={`M${right} 192H${right + pw}M${right} 124V192`} stroke={line} fill="none" />
      <path
        d={path(
          radial.map((p) => ({
            x: right + (p.r / 2.3) * pw,
            y: 192 - 54 * diffractionDisplayLevel(p.I, exposure),
          })),
        )}
        stroke={green}
        strokeWidth={2}
        fill="none"
      />
      <T x={right + pw} y={215} anchor="end">
        2.3 mm
      </T>
      <T x={w / 2} y={247}>
        {disk
          ? say('完整互补场 · 固定曝光', 'Full field · fixed exposure')
          : say('圆孔积分，非旋转单缝曲线', 'Circular-aperture integral')}
      </T>
    </g>
  );
}
function DiskRim({ s, w }: { s: DiffractionShot; w: number }) {
  const d = diskAxisGeometry(s.radius, s.wavelength),
    cx = w * 0.28,
    cy = 119,
    rx = 23,
    ry = 57,
    P = { x: w - 35, y: 119 },
    points = d.points.map((p) => ({
      id: p.id,
      x: cx + (rx * p.x) / d.radius,
      y: cy + (ry * p.y) / d.radius,
      front: p.x >= 0,
    }));
  const rays = (front: boolean) =>
    points
      .filter((p) => p.front === front)
      .map((p) => (
        <path
          key={p.id}
          data-rim-id={p.id}
          data-path-length={d.path}
          d={`M${p.x} ${p.y}L${P.x} ${P.y}`}
          stroke={green}
          strokeWidth={1.4}
          opacity={front ? 0.8 : 0.35}
        />
      ));
  return (
    <g data-view="rim">
      <T x={w / 2} y={20}>
        {say('圆周到轴点：等程', 'Rim to axial point: equal paths')}
      </T>
      {rays(false)}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#60796a" stroke={ink} />
      {rays(true)}
      <circle cx={P.x} cy={P.y} r={4} fill={amber} />
      <T x={P.x} y={146}>
        P
      </T>
      {[0, 4, 8].map((id, j) => {
        const point = points[id]!;
        const y = 190 + j * 24;
        return (
          <g key={id} data-rim-phase={d.phase}>
            <T x={point.x + (point.front ? 12 : -12)} y={point.y + 4}>
              {['A', 'B', 'C'][j]}
            </T>
            <T x={38} y={y + 4}>
              {['A', 'B', 'C'][j]}
            </T>
            <path
              d={path(
                Array.from({ length: 81 }, (_, k) => ({
                  x: 62 + (k / 80) * (w - 80),
                  y: y - 7 * Math.cos((k / 80) * Math.PI * 4 - d.phase - s.clock * Math.PI * 2),
                })),
              )}
              fill="none"
              stroke={j === 1 ? amber : green}
              strokeWidth={1.7}
            />
          </g>
        );
      })}
    </g>
  );
}
function Shadow({ s, w }: { s: DiffractionShot; w: number }) {
  return (
    <g data-view="shadow">
      <T x={w / 2} y={20}>
        {say('光被圆盘挡住，中央一定暗？', 'Must the shadow center be dark?')}
      </T>
      <path d={`M24 62H${w - 24}M24 190H${w - 24}`} stroke={green} strokeWidth={2} />
      <ellipse cx={w * 0.3} cy={125} rx={16} ry={65} fill="#526c5d" />
      <path d={`M${w * 0.3} 60H${w - 28}V190H${w * 0.3}`} fill="#cbd4c4" opacity={0.5} />
      <path d={`M${w - 28} 50V200`} stroke={line} strokeWidth={5} />
      <T x={w * 0.7} y={133}>
        {say('几何阴影', 'Geometric shadow')}
      </T>
      <T x={w / 2} y={242}>
        {say('先保留这个预测', 'Keep this prediction for comparison')}
      </T>
    </g>
  );
}
export function OpticalDiffractionArtwork({
  mode = 0,
  phase = 0,
  width = 100,
  radius = 0.6,
  wavelength = 550,
  white = false,
  progress = 1,
  shot,
  viewportWidth = 340,
}: {
  mode?: number;
  phase?: number;
  width?: number;
  radius?: number;
  wavelength?: number;
  white?: boolean;
  progress?: number;
  shot?: DiffractionShot;
  viewportWidth?: number;
}) {
  const w = bounded(viewportWidth, 260, 700, 340),
    base = diffractionDirector(mode === 1 ? 6 : 0, 42),
    s =
      shot ??
      ({
        ...base,
        mode: mode === 1 ? 1 : 0,
        view:
          mode === 1
            ? 'disk'
            : phase === 3
              ? 'aperture'
              : phase === 4
                ? 'pencils'
                : phase === 5
                  ? 'calipers'
                  : white
                    ? 'colors'
                    : 'screen',
        width,
        radius,
        wavelength,
        white,
        reveal: true,
        clock: progress,
      } as DiffractionShot);
  return (
    <svg
      className="od18-art"
      data-shot={JSON.stringify(s)}
      data-mode={s.mode}
      data-view={s.view}
      viewBox={`0 0 ${w} 256`}
      role="img"
      aria-label={say(
        '同一开口的波场贡献、衍射屏和预测',
        'Field contributions, diffraction screen and predictions from the same opening',
      )}
    >
      <g>
        {s.view === 'paths' ? (
          <PathDifference s={s} w={w} />
        ) : s.view === 'contributions' ? (
          <Contributions s={s} w={w} />
        ) : s.view === 'colors' ? (
          <Colors s={s} w={w} />
        ) : s.view === 'rim' ? (
          <DiskRim s={s} w={w} />
        ) : s.view === 'shadow' ? (
          <Shadow s={s} w={w} />
        ) : s.view === 'aperture' || s.view === 'disk' ? (
          <CircleScreen s={s} w={w} />
        ) : (
          <SlitScreen s={s} w={w} />
        )}
      </g>
    </svg>
  );
}
export default function OpticalDiffractionLab() {
  const f = useShowcase(),
    ref = useRef<HTMLDivElement>(null),
    [w, setW] = useState(288),
    [override, setOverride] = useState<Partial<Omit<DiffractionShot, 'radius'>> | null>(null),
    [radii, setRadii] = useState<Partial<Record<'disk' | 'aperture', number>>>({});
  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined' || !ref.current)
      return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setW(Math.min(700, Math.max(260, e.contentRect.width)));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const authored = diffractionDirector(f.chapter, f.chapterTime, browserLocale()),
    mixed = f.watch ? authored : { ...authored, ...override },
    circle = mixed.mode === 1 ? 'disk' : mixed.view === 'aperture' ? 'aperture' : null,
    s = !f.watch && circle ? { ...mixed, radius: radii[circle] ?? mixed.radius } : mixed;
  const set = (part: Partial<Omit<DiffractionShot, 'radius'>>) =>
    setOverride((old) => ({ ...old, ...part }));
  const rememberCircle = (nextMode: 0 | 1, nextView: DiffractionView) => {
    const next = nextMode === 1 ? 'disk' : nextView === 'aperture' ? 'aperture' : null;
    setRadii((old) => {
      const saved = { ...old, ...(circle ? { [circle]: s.radius } : {}) };
      if (next && saved[next] === undefined) {
        const sameAuthored =
          nextMode === authored.mode && (next === 'disk' || authored.view === 'aperture');
        saved[next] = sameAuthored ? authored.radius : next === 'disk' ? 0.6 : 0.2;
      }
      return saved;
    });
  };
  const views: DiffractionView[] = s.mode
    ? ['shadow', 'rim', 'disk']
    : [
        'screen',
        'contributions',
        'paths',
        'prediction',
        'colors',
        'aperture',
        'pencils',
        'calipers',
      ];
  const labels: Record<DiffractionView, string> = {
    screen: say('看屏图', 'Screen'),
    contributions: say('开口贡献', 'Contributions'),
    paths: say('路径差量尺', 'Path difference'),
    prediction: say('暗纹预测', 'Predict a minimum'),
    colors: say('不同波长', 'Wavelengths'),
    aperture: say('圆孔', 'Round aperture'),
    pencils: say('铅笔', 'Pencils'),
    calipers: say('卡尺', 'Calipers'),
    shadow: say('几何预测', 'Geometric prediction'),
    rim: say('圆周等程', 'Equal rim paths'),
    disk: say('波场结果', 'Field result'),
  };
  return (
    <div className="od18-lab" ref={ref} data-active-view={s.view} data-watch={f.watch}>
      <OpticalDiffractionArtwork shot={s} viewportWidth={w} />
      {!f.watch && (
        <div className="od18-controls">
          <Segments
            label={say('观察装置', 'Apparatus')}
            value={String(s.mode)}
            options={[
              { value: '0', label: say('狭缝与圆孔', 'Slits and apertures') },
              { value: '1', label: say('圆盘', 'Disk') },
            ]}
            onChange={(v) => {
              rememberCircle(v === '1' ? 1 : 0, v === '1' ? 'shadow' : 'screen');
              set({
                mode: v === '1' ? 1 : 0,
                view: v === '1' ? 'shadow' : 'screen',
                question: v === '1',
                reveal: v !== '1',
              });
            }}
          />
          <Segments
            label={say('局部观察', 'Close view')}
            value={s.view}
            options={views.map((v) => ({ value: v, label: labels[v] }))}
            onChange={(v) => {
              const view = v;
              rememberCircle(s.mode, view);
              set({
                view,
                white: view === 'colors',
                reveal: !['prediction', 'shadow'].includes(view),
                question: ['prediction', 'shadow'].includes(view),
                ...(['contributions', 'paths'].includes(view)
                  ? {
                      width: 100,
                      x: ['contributions', 'paths'].includes(authored.view) ? authored.x : 0,
                    }
                  : {}),
                ...(['prediction', 'pencils', 'calipers'].includes(view)
                  ? { width: bounded(s.width, 50, 150, 100) }
                  : {}),
              });
            }}
          />
          {s.mode === 0 && s.view !== 'aperture' ? (
            <Range
              label={say('缝宽 / μm', 'Slit width / μm')}
              min={['prediction', 'pencils', 'calipers'].includes(s.view) ? 50 : 30}
              max={
                ['contributions', 'paths', 'prediction', 'pencils', 'calipers'].includes(s.view)
                  ? 150
                  : 800
              }
              step={2}
              value={s.width}
              onChange={(width) =>
                set({
                  width,
                  ...(['prediction', 'pencils', 'calipers'].includes(s.view)
                    ? { reveal: false, question: true }
                    : {}),
                })
              }
            />
          ) : (
            <Range
              label={say('半径 / mm', 'Radius / mm')}
              min={0.1}
              max={s.mode ? 1 : 0.4}
              step={0.01}
              value={s.radius}
              onChange={(radius) => {
                const key = s.mode ? 'disk' : 'aperture';
                setRadii((old) => ({
                  ...old,
                  [key]: bounded(radius, 0.1, key === 'disk' ? 1 : 0.4, s.radius),
                }));
              }}
            />
          )}
          {['contributions', 'paths'].includes(s.view) && (
            <Range
              label={say('屏点 x / mm', 'Screen x / mm')}
              min={0}
              max={12}
              step={0.05}
              value={s.x}
              onChange={(x) => set({ x })}
            />
          )}
          {s.view !== 'colors' && (
            <Range
              label={say('波长 / nm', 'Wavelength / nm')}
              min={450}
              max={650}
              step={5}
              value={s.wavelength}
              onChange={(wavelength) =>
                set({
                  wavelength,
                  ...(['prediction', 'calipers'].includes(s.view)
                    ? { reveal: false, question: true }
                    : {}),
                })
              }
            />
          )}
          {!s.reveal && s.view !== 'rim' && (
            <button
              type="button"
              className="od18-reveal"
              onClick={() =>
                set({
                  reveal: true,
                  question: false,
                  ...(s.view === 'shadow' ? { view: 'disk' } : {}),
                })
              }
            >
              {say('揭晓波场结果', 'Reveal the field result')}
            </button>
          )}
          <details>
            <summary>{say('模型与器材说明', 'Model and apparatus')}</summary>
            <p>
              {say(
                '单缝分区相加使用同一有限距离积分。首暗关系是远场近似，并非有限距离严格零。圆周等程图只解释对称性，屏图仍由完整圆孔互补场计算。单色显示色随波长变化；白光取三波长强度相加，均非精确色度还原。',
                'The slit bands use the same finite-distance integral. The first-minimum relation is a far-field approximation, not an exact finite-distance zero. Equal rim paths explain symmetry; the screen uses the full complementary aperture field. Monochromatic display hue follows wavelength; white light uses three intensity channels. Neither is calibrated colorimetry.',
              )}
            </p>
            <p>
              {say(
                '铅笔和卡脚保留理想直边，眼睛的角分布用一米等效屏展开。开口及传播角为便于观察放大，不表示真实光速。',
                'Pencils and jaws retain ideal straight edges; a one-meter equivalent screen unfolds the angular view. Openings and angles are enlarged, and timing does not represent the speed of light.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
