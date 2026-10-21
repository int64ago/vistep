import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  filmOptics,
  fieldAt,
  filmRayGeometry,
  soapThickness,
  soapContour,
  wedgeThickness,
  wedgeSpacing,
  filmColor,
  thinFilmDirector,
  type FilmShot,
  type FilmView,
  type Point,
} from '../../models/thin-film-lab';
import '../../styles/thin-film-lab.css';
const ink = '#405d50',
  green = '#7b9f8c',
  copper = '#b3825e',
  line = '#b7c7b8',
  paper = '#e2eadf';
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
    <text x={x} y={y} textAnchor={anchor} fontSize={16} fill={color}>
      {children}
    </text>
  );
}
const path = (ps: Point[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
function RayArrow({ from, to, color }: { from: Point; to: Point; color: string }) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    l = Math.hypot(dx, dy);
  if (l < 18) return null;
  const u = { x: dx / l, y: dy / l },
    q = { x: from.x + dx * 0.6, y: from.y + dy * 0.6 };
  return (
    <path
      d={path([
        { x: q.x - u.x * 6 - u.y * 3, y: q.y - u.y * 6 + u.x * 3 },
        q,
        { x: q.x - u.x * 6 + u.y * 3, y: q.y - u.y * 6 - u.x * 3 },
      ])}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
    />
  );
}
function FilmCircle({
  s,
  cx,
  cy,
  r,
  id,
  mark = true,
  local = false,
}: {
  s: FilmShot;
  cx: number;
  cy: number;
  r: number;
  id: string;
  mark?: boolean;
  local?: boolean;
}) {
  const contour = local ? 0.5 : (soapContour(s.trackOrder, s.drain, s.wavelength, s.angle) ?? -1),
    y = cy - r + 2 * r * contour;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r + 3} fill="#344137" stroke={green} strokeWidth={4} />
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: 144 }, (_, j) => (
          <rect
            key={j}
            x={cx - r}
            y={cy - r + (2 * r * j) / 144}
            width={2 * r}
            height={(2 * r) / 144 + 0.3}
            fill={filmColor(
              local
                ? Math.max(0, s.thickness + 650 * (j / 143 - 0.5))
                : soapThickness(j / 143, s.drain),
              s.white,
              s.wavelength,
              1.333,
              1,
              s.angle,
            )}
          />
        ))}
      </g>
      {mark && contour >= 0 && contour <= 1 && (
        <>
          <path
            data-film-contour={s.trackOrder}
            data-contour-y={contour}
            data-selected-thickness={local ? s.thickness : undefined}
            d={`M${cx - r - 5} ${y}H${cx + r + 5}`}
            stroke="#f0e8ca"
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <circle cx={cx + r + 5} cy={y} r={3} fill={copper} />
        </>
      )}
      <path d={`M${cx} ${cy + r + 5}v15`} stroke={green} strokeWidth={4} />
    </g>
  );
}
function Observation({ s, w, en, id }: { s: FilmShot; w: number; en: boolean; id: string }) {
  const r = w < 400 ? 73 : 83,
    cx = w < 400 ? w * 0.66 : w * 0.6,
    cy = 114,
    ly = 138,
    lx = w < 400 ? 43 : w * 0.22;
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'One wavelength, alternating bands' : '同一束黄光，为什么有明暗？'}
      </Text>
      <FilmCircle s={s} cx={cx} cy={cy} r={r} id={id} />
      <path d={`M${lx - 21} ${ly + 18}q0 20 21 20q21 0 21-20Z`} fill="#b4c6b9" stroke={green} />
      <path d={`M${lx - 6} ${ly + 18}v-14h12v14`} fill={copper} />
      <path
        d={`M${lx} ${ly + 4}q-17-10-3-36q-1 14 9 19q12 14-6 17`}
        fill={s.white ? '#e0dabe' : '#d5b367'}
      />
      <path
        d={`M${lx + 5} ${ly - 7}L${cx - r} ${cy - 25}M${lx + 5} ${ly - 7}L${cx - r} ${cy + 28}`}
        stroke="#c4ad77"
        opacity={0.5}
      />
      <Text x={lx} y={ly + 62}>
        {s.wavelength.toFixed(0)} nm
      </Text>
      <Text x={w / 2} y={232}>
        {en ? 'Follow one bright contour' : '追踪同一条亮纹'}
      </Text>
    </>
  );
}
function Paths({ s, w, en }: { s: FilmShot; w: number; en: boolean }) {
  const n = s.mode ? 1 : 1.333,
    n0 = s.mode ? 1.5 : 1,
    a = filmOptics(s.thickness, s.wavelength, n, n0, s.angle)!,
    g = filmRayGeometry(s.thickness, n, n0, s.angle, w, 168)!;
  const dy = 32,
    pt = (p: Point) => ({ x: p.x, y: p.y + dy }),
    A = pt(g.A),
    B = pt(g.B),
    C = pt(g.C),
    D = pt(g.D),
    input = pt(g.incoming),
    e1 = pt(g.end1),
    e2 = pt(g.end2);
  return (
    <>
      <Text x={w / 2} y={18}>
        {s.mode
          ? en
            ? 'Glass → air → glass'
            : '玻璃 → 空气 → 玻璃'
          : en
            ? 'Air → film → air'
            : '空气 → 膜 → 空气'}
      </Text>
      <rect
        x={13}
        y={g.top + dy}
        width={w - 26}
        height={Math.max(0, g.bottom - g.top)}
        fill={paper}
        opacity={0.8}
      />
      <path
        d={`M13 ${g.top + dy}H${w - 13}M13 ${g.bottom + dy}H${w - 13}`}
        stroke={line}
        strokeWidth={1.5}
      />
      <path
        d={path([input, A])}
        stroke="#afae83"
        strokeWidth={2.4}
        fill="none"
        data-optical-route="incident"
      />
      <path
        d={path([A, e1])}
        stroke={green}
        strokeWidth={2.8}
        fill="none"
        data-optical-route="front"
      />
      {s.pathStep >= 1 && (
        <path
          d={path([A, B, C, e2])}
          stroke={copper}
          strokeWidth={2.8}
          fill="none"
          data-optical-route="internal"
        />
      )}
      {s.pathStep >= 4 && (
        <path
          d={path([D, C])}
          stroke={ink}
          strokeWidth={1.2}
          strokeDasharray="4 4"
          data-optical-reference="same-wavefront"
        />
      )}
      <RayArrow from={input} to={A} color="#afae83" />
      <RayArrow from={A} to={e1} color={green} />
      {s.pathStep >= 1 && (
        <>
          <RayArrow from={A} to={B} color={copper} />
          <RayArrow from={B} to={C} color={copper} />
          <RayArrow from={C} to={e2} color={copper} />
        </>
      )}
      <circle cx={A.x} cy={A.y} r={4} fill={green} />
      {s.pathStep >= 1 && <circle cx={B.x} cy={B.y} r={4} fill={copper} />}
      {s.thickness > 2 && (
        <>
          {s.pathStep >= 2 && (
            <g data-phase-boundary="front">
              <Text x={A.x - 18} y={A.y - 8} color={green}>
                {a.frontFlip ? 'π' : '0'}
              </Text>
            </g>
          )}
          {s.pathStep >= 3 && (
            <g data-phase-boundary="back">
              <Text x={B.x - 18} y={B.y - 8} color={copper}>
                {a.backFlip ? 'π' : '0'}
              </Text>
            </g>
          )}
        </>
      )}
      <Text x={w - 10} y={211} anchor="end">
        d = {s.thickness.toFixed(0)} nm · θ₀ = {s.angle.toFixed(0)}°
      </Text>
      {s.pathStep >= 4 && (
        <Text x={w / 2} y={240}>
          {en ? 'OPD' : '光程差'} = 2nd cos θ₁ = {a.opd.toFixed(0)} nm
        </Text>
      )}
    </>
  );
}
function Sum({ s, w, en }: { s: FilmShot; w: number; en: boolean }) {
  const a = filmOptics(s.thickness, s.wavelength, s.mode ? 1 : 1.333, s.mode ? 1.5 : 1, s.angle)!,
    scale = 12 / Math.max(0.05, Math.abs(a.r)),
    parts = [a.front, a.returned, a.total],
    ys = [62, 122, 193],
    colors = [green, copper, ink],
    cursorPhase = ((s.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    cursorX = 16 + ((w - 32) * cursorPhase) / (2 * Math.PI),
    labels = en
      ? ['Front boundary', 'All internal returns', 'Sum of the fields']
      : ['前界面反射', '膜内全部返回', '相加后的场'];
  return (
    <>
      <Text x={w / 2} y={19}>
        {s.stage === 1 && !s.reveal
          ? en
            ? 'd → 0: bright or dark?'
            : 'd → 0，会亮还是会暗？'
          : `d = ${s.thickness.toFixed(1)} nm`}
      </Text>
      <path
        data-field-clock={cursorPhase}
        d={`M${cursorX} 42V222`}
        stroke={line}
        strokeDasharray="3 4"
      />
      {parts.map((a, j) => (
        <g key={j}>
          <Text x={13} y={[42, 96, 160][j]!} anchor="start" color={colors[j]}>
            {labels[j]}
          </Text>
          <path d={`M15 ${ys[j]}H${w - 15}`} stroke={line} />
          <path
            data-field={j}
            d={Array.from(
              { length: 121 },
              (_, i) =>
                `${i ? 'L' : 'M'}${16 + ((w - 32) * i) / 120} ${ys[j]! - scale * fieldAt(a, (i / 120) * 2 * Math.PI)}`,
            ).join(' ')}
            fill="none"
            stroke={colors[j]}
            strokeWidth={j === 2 ? 2.7 : 2}
          />
          <circle
            data-field-sample={j}
            data-field-value={fieldAt(a, cursorPhase)}
            cx={cursorX}
            cy={ys[j]! - scale * fieldAt(a, cursorPhase)}
            r={3.5}
            fill={colors[j]}
          />
        </g>
      ))}
      <Text x={w / 2} y={244}>
        {en ? 'Reflected fraction' : '计算反射率'} R = {(a.R * 100).toFixed(2)}%
      </Text>
    </>
  );
}
function Colors({ s, w, en, id }: { s: FilmShot; w: number; en: boolean; id: string }) {
  const cx = w < 400 ? 79 : w * 0.3,
    cy = 111,
    r = 60,
    start = w < 400 ? 165 : w * 0.53,
    span = w - start - 18;
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'One thickness' : '同一厚度'} d = {s.thickness.toFixed(0)} nm
      </Text>
      <FilmCircle s={{ ...s, white: true, angle: 0 }} cx={cx} cy={cy} r={r} id={id} local />
      {[650, 530, 460].map((wave, j) => {
        const a = filmOptics(s.thickness, wave)!,
          y = 57 + j * 52;
        return (
          <g key={wave}>
            <Text x={start} y={y} anchor="start">
              {wave} nm
            </Text>
            <rect x={start} y={y + 9} width={span} height={12} rx={4} fill={paper} />
            <rect
              data-color-wave={wave}
              data-reflectance={a.R}
              x={start}
              y={y + 9}
              width={span * a.relative}
              height={12}
              rx={4}
              fill={filmColor(s.thickness, false, wave)}
            />
            <Text x={start + span} y={y + 39} anchor="end">
              R {(a.R * 100).toFixed(1)}%
            </Text>
          </g>
        );
      })}
      <Text x={w / 2} y={237}>
        {en ? 'Three-color model samples' : '三波长示意，并非实测光谱'}
      </Text>
    </>
  );
}
function Wedge({ s, w, en }: { s: FilmShot; w: number; en: boolean }) {
  const left = 22,
    L = w - 68,
    right = left + L,
    base = 205,
    paperHeight = 24,
    gap = paperHeight * s.sheets,
    slope = gap / L,
    spacing = wedgeSpacing(s.wavelength, s.sheets),
    count = s.sheets >= 1.999 ? 2 : 1;
  return (
    <>
      <Text x={w / 2} y={20}>
        {en ? 'First 4 mm from contact' : '从接触端起，前4 mm'}
      </Text>
      <rect x={left} y={38} width={w - 44} height={50} rx={5} fill="#334238" />
      {s.reveal ? (
        Array.from({ length: 240 }, (_, j) => (
          <rect
            key={j}
            x={left + ((w - 44) * j) / 240}
            y={38}
            width={(w - 44) / 240 + 0.2}
            height={50}
            fill={filmColor(wedgeThickness((4 * j) / 239, s.sheets), false, s.wavelength, 1, 1.5)}
          />
        ))
      ) : (
        <Text x={w / 2} y={69} color="#ecebda">
          {en ? 'Predict the new spacing' : '先预测新间距'}
        </Text>
      )}
      {s.reveal && (
        <g data-fringe-spacing={spacing}>
          <path
            d={`M${left + (spacing / 4) * (w - 44)} 88v8h${(spacing / 4) * (w - 44)}v-8`}
            fill="none"
            stroke={copper}
            strokeWidth={2}
          />
          {[1, 2].map((order) => (
            <circle
              key={order}
              cx={left + ((order * spacing) / 4) * (w - 44)}
              cy={63}
              r={3}
              fill="#efe5c8"
            />
          ))}
        </g>
      )}
      <path d={`M${left} 92v5H${w - left}v-5`} stroke={line} fill="none" />
      <Text x={left} y={118} anchor="start">
        0
      </Text>
      <Text x={w - left} y={118} anchor="end">
        4 mm
      </Text>
      <Text x={w / 2} y={137}>
        Δx = {s.reveal ? `${spacing.toFixed(3)} mm` : '?'}
      </Text>
      <path
        d={`M${left} ${base}H${right + 14}v9H${left}Z`}
        fill="#cbdace"
        stroke={green}
        data-wedge-part="lower"
      />
      <path
        d={`M${left} ${base}L${right + 14} ${base - slope * (L + 14)}v-9L${left} ${base - 9}Z`}
        fill="#d7e3d7"
        stroke={green}
        data-wedge-part="upper"
      />
      {Array.from({ length: count }, (_, j) => (
        <rect
          key={j}
          data-wedge-sheet={j}
          x={right + (j === 1 ? 20 * s.sheetWithdrawal : 0)}
          opacity={j === 1 ? 1 - s.sheetWithdrawal * 0.6 : 1}
          y={base - paperHeight * (j + 1)}
          width={14}
          height={paperHeight}
          fill="#c9ae7f"
          stroke="#aa946f"
          strokeWidth={0.7}
        />
      ))}
      <circle cx={left} cy={base} r={3} fill={ink} />
      <Text x={w / 2} y={244}>
        {en ? 'Gap angle enlarged · L = 80 mm' : '夹角放大 · L = 80 mm'}
      </Text>
    </>
  );
}
export function ThinFilmArtwork({
  mode = 0,
  phase = 0,
  progress = 1,
  drain = 1,
  sheets = 2,
  wavelength = 589,
  white = false,
  shot,
  width = 340,
  locale,
}: {
  mode?: number;
  phase?: number;
  progress?: number;
  drain?: number;
  sheets?: number;
  wavelength?: number;
  white?: boolean;
  shot?: FilmShot;
  width?: number;
  locale?: 'zh' | 'en';
}) {
  const id = useId().replaceAll(':', ''),
    w = Math.max(260, Math.min(680, width)),
    en = (locale ?? browserLocale()) === 'en',
    s = shot ?? {
      ...thinFilmDirector(mode === 0 ? phase : 3 + phase, progress, undefined, en ? 'en' : 'zh'),
      mode: (mode ? 1 : 0) as 0 | 1,
      view: (mode ? 'wedge' : 'observation') as FilmView,
      drain,
      sheets,
      wavelength,
      white,
    };
  return (
    <svg
      className="tf17-art"
      width={w}
      height={252}
      viewBox={`0 0 ${w} 252`}
      role="img"
      aria-label={en ? 'Film reflections, phase and interference' : '薄膜反射、相位与干涉'}
      data-film-view={s.view}
      data-film-mode={s.mode}
      data-film-reveal={s.reveal}
      data-film-thickness={s.thickness}
      data-film-angle={s.angle}
      data-film-path-step={s.pathStep}
      data-film-sheets={s.sheets}
      data-film-withdrawal={s.sheetWithdrawal}
    >
      {s.view === 'paths' ? (
        <Paths s={s} w={w} en={en} />
      ) : s.view === 'sum' ? (
        <Sum s={s} w={w} en={en} />
      ) : s.view === 'colors' ? (
        <Colors s={s} w={w} en={en} id={id} />
      ) : s.view === 'wedge' ? (
        <Wedge s={s} w={w} en={en} />
      ) : (
        <Observation s={s} w={w} en={en} id={id} />
      )}
    </svg>
  );
}
export default function ThinFilmLab() {
  const film = useShowcase(),
    locale = browserLocale(),
    en = locale === 'en',
    say = (zh: string, english: string) => (en ? english : zh),
    authored = thinFilmDirector(film.chapter, film.chapterProgress, film.chapterTime, locale);
  const [over, setOver] = useState<Partial<FilmShot>>({}),
    [width, setWidth] = useState(340),
    host = useRef<HTMLDivElement>(null),
    shot = film.watch ? authored : { ...authored, ...over };
  useEffect(() => {
    if (typeof window === 'undefined' || !host.current) return;
    const e = host.current,
      update = () => setWidth(Math.max(260, Math.min(680, e.clientWidth)));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(update);
    o.observe(e);
    return () => o.disconnect();
  }, []);
  const patch = (p: Partial<FilmShot>) =>
      setOver((o) => ({ ...o, pathStep: 4, reveal: true, ...p })),
    available: FilmView[] = shot.mode
      ? ['wedge', 'paths', 'sum']
      : ['observation', 'paths', 'sum', 'colors'],
    names: Record<FilmView, string> = {
      observation: say('追踪条纹', 'Follow fringes'),
      paths: say('两路反射', 'Two paths'),
      sum: say('相位相加', 'Add fields'),
      colors: say('三波长', 'Three wavelengths'),
      wedge: say('劈尖条纹', 'Wedge fringes'),
    };
  return (
    <div className="tf17-lab" data-watch={film.watch} ref={host}>
      <ThinFilmArtwork shot={shot} width={width} locale={locale} />
      {!film.watch && (
        <div className="tf17-controls">
          <Segments
            label={say('薄膜装置', 'Film apparatus')}
            value={String(shot.mode)}
            options={[
              { value: '0', label: say('肥皂膜', 'Soap film') },
              { value: '1', label: say('空气劈尖', 'Air wedge') },
            ]}
            onChange={(v) =>
              patch({
                mode: v === '1' ? 1 : 0,
                view: v === '1' ? 'wedge' : 'observation',
                angle: 0,
              })
            }
          />
          <Segments
            label={say('观察视图', 'Observation view')}
            value={shot.view}
            options={available.map((value) => ({ value, label: names[value] }))}
            onChange={(v) =>
              patch({
                view: v as FilmView,
                ...(v === 'wedge' || v === 'colors' || v === 'observation' ? { angle: 0 } : {}),
              })
            }
          />
          {shot.view === 'observation' && (
            <Range
              label={say('相对膜厚', 'Relative thickness')}
              value={shot.drain}
              min={0.15}
              max={1.2}
              step={0.01}
              onChange={(v) => patch({ drain: v })}
            />
          )}{' '}
          {(shot.view === 'paths' || shot.view === 'sum' || shot.view === 'colors') && (
            <Range
              label={say('局部膜厚 / nm', 'Local thickness / nm')}
              value={shot.thickness}
              min={0}
              max={650}
              step={1}
              onChange={(v) => patch({ thickness: v })}
            />
          )}{' '}
          {(shot.view === 'paths' || shot.view === 'sum') && (
            <Range
              label={say('入射角 / °', 'Incidence angle / °')}
              value={shot.angle}
              min={0}
              max={35}
              step={1}
              onChange={(v) => patch({ angle: v })}
            />
          )}{' '}
          {shot.view === 'wedge' && (
            <Segments
              label={say('支撑纸片', 'Spacer sheets')}
              value={String(Math.round(shot.sheets))}
              options={[
                { value: '2', label: say('两张', 'Two') },
                { value: '1', label: say('一张', 'One') },
              ]}
              onChange={(v) => patch({ sheets: Number(v), sheetWithdrawal: 0, reveal: false })}
            />
          )}{' '}
          {shot.view !== 'colors' && (
            <Range
              label={say('波长 / nm', 'Wavelength / nm')}
              value={shot.wavelength}
              min={450}
              max={650}
              step={1}
              onChange={(v) => patch({ wavelength: v })}
            />
          )}{' '}
          {shot.view === 'wedge' && !shot.reveal && (
            <button type="button" onClick={() => patch({ reveal: true })}>
              {say('揭晓条纹', 'Reveal fringes')}
            </button>
          )}
          <details>
            <summary>{say('计算范围', 'Model scope')}</summary>
            <p>
              {say(
                '无损对称膜；斜入射只计算s偏振。角度不进入全反射区。反射率包含全部内部返回，剖面只追踪最先两路。',
                'Lossless symmetric film; oblique incidence uses s polarization below total internal reflection. Reflectance includes every internal return; the section traces the first two paths.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
