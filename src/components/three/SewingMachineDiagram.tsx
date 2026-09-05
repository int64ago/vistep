import { useId, useMemo } from 'react';
import { t } from '../../i18n';
import {
  SEWING as S,
  SEWING_NEEDLE_WINDOW,
  sewingPose,
  type SewingPose,
  type SewingPoint,
} from '../../models/sewing-machine';
/** Geometry scales inside SVG; authored labels stay in CSS pixels outside its viewBox. */
export function SewingMachineDiagram({ pose: p, focus }: { pose: SewingPose; focus: string }) {
  const id = useId().replaceAll(':', '');
  if (focus === 'takeup') return <SewingTakeupSection pose={p} />;
  const stitch = focus === 'stitch',
    whole = focus === 'overview' || focus === 'takeup',
    eye = focus === 'eye' || focus === 'pickup',
    feed = focus === 'feed';
  const view = stitch ? 'stitch' : whole ? 'whole' : eye ? 'eye' : feed ? 'feed' : 'case';
  // A 280 CSS-unit phone canvas, never the desktop viewBox squeezed into a phone.
  const scale = whole ? 32 : stitch ? 124 : eye ? 123 : feed ? 100 : 102;
  const center: SewingPoint = whole
    ? [0.3, 0.7, 0]
    : stitch
      ? [-p.pitch - 0.04, 0.05, 0.62]
      : eye
        ? [0.1, -0.48, 0.62]
        : feed
          ? [-0.4, 0.05, 0.62]
          : [0, -1.55, 0];
  const project = (v: SewingPoint): [number, number] =>
    stitch
      ? [140 + (v[0] - center[0]) * scale + (v[2] - 0.62) * 100, 170 - (v[1] - center[1]) * scale]
      : [
          140 + (v[0] - center[0]) * scale + (view === 'case' ? v[2] * 26 : 0),
          whole ? 180 - (v[1] - center[1]) * scale : 170 - (v[1] - center[1]) * scale,
        ];
  const path = (points: SewingPoint[]) =>
    points
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${project(v)
            .map((n) => n.toFixed(2))
            .join(' ')}`,
      )
      .join(' ');
  const line = (a: SewingPoint, b: SewingPoint, color: string, width = 2) => (
    <path
      key={a.join(',') + b.join(',')}
      d={path([a, b])}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
  const needle = project([0, p.needle.eye, 0.62]),
    base = project([0, S.caseY, 0]),
    tip = project([0, p.needle.tip, 0.62]);
  const hook = Array.from({ length: 65 }, (_, i): SewingPoint => {
    const a = p.hook.angle + 0.32 + ((Math.PI * 2 - 0.6) * i) / 64;
    return [1.15 * Math.sin(a), S.caseY + 1.15 * Math.cos(a), 0.35];
  });
  const visibleUpper = whole ? p.upper : p.upper.slice(64),
    visibleLower = stitch ? p.lower.slice(-3) : p.lower;
  return (
    <div className="sewing-diagram" role="img" aria-label={t('同一模型的线迹剖面')}>
      <div className="sewing-diagram-title">
        {t(
          stitch
            ? '织物内的交锁'
            : whole
              ? '从线轴追到针眼'
              : eye
                ? '针眼与梭尖'
                : feed
                  ? '针离布，布才走'
                  : '旋梭前后两条线腿',
        )}
      </div>
      <svg viewBox="0 30 280 270" aria-hidden="true">
        <defs>
          <clipPath id={id + 'clip'}>
            <rect x="4" y="30" width="272" height="270" rx="14" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}clip)`}>
          {!stitch && (
            <>
              <circle
                cx={base[0]}
                cy={base[1]}
                r={S.caseRadius * scale}
                fill="#d8d2bd"
                stroke="#778b8e"
                strokeWidth="2"
              />
              <circle
                cx={base[0]}
                cy={base[1]}
                r={0.54 * scale}
                fill="#75aaa4"
                opacity=".40"
                stroke="#27837d"
              />
              <circle cx={base[0]} cy={base[1]} r={0.13 * scale} fill="#bda781" />
              <path
                d={path(hook)}
                fill="none"
                stroke="#52666a"
                strokeWidth={0.075 * scale}
                strokeLinecap="round"
              />
              {line(p.hook.throat, p.hook.tip, '#ac8050', Math.max(4, scale * 0.04))}
            </>
          )}
          {/* Longitudinal teaching section removes fabric above the seam, exposing the interlock. */}
          <path
            d={path([
              [-5, 0.04, 0.62],
              [3, 0.04, 0.62],
            ])}
            stroke="#bdcdd0"
            strokeWidth={stitch ? 32 : 12}
            opacity=".65"
          />
          {!stitch && (
            <>
              <path
                d={path([
                  [0, p.needle.eye + 0.65, 0.62],
                  [0, p.needle.eye - 0.07, 0.62],
                  [0, p.needle.tip, 0.62],
                ])}
                fill="none"
                stroke="#829599"
                strokeWidth={Math.max(6, 0.12 * scale)}
              />
              <ellipse
                cx={needle[0]}
                cy={needle[1]}
                rx={Math.max(2, 0.028 * scale)}
                ry={Math.max(4, 0.058 * scale)}
                fill="#f2efe7"
              />
              {whole && (
                <>
                  {line([0, S.shaftY, 0.62], p.needle.crankPin, '#aa885a', 5)}
                  {line(p.needle.crankPin, p.needle.joint, '#8d9ea1', 4)}
                  {line(p.takeUpPivot, p.takeUpEye, '#819297', 5)}
                  <circle
                    cx={project(p.takeUpEye)[0]}
                    cy={project(p.takeUpEye)[1]}
                    r="3.5"
                    fill="#ece5d2"
                    stroke="#a48250"
                  />
                </>
              )}
            </>
          )}
          <path
            d={path(visibleLower)}
            fill="none"
            stroke="#268a83"
            strokeWidth={stitch ? 3.4 : 2.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={path(visibleUpper)}
            fill="none"
            stroke="#bd583e"
            strokeWidth={stitch ? 3.4 : 2.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {(feed || whole) && (
            <>
              <path
                d={path([
                  [-0.55 + p.dogX, p.dogTop - 0.05, 0.62],
                  [0.55 + p.dogX, p.dogTop - 0.05, 0.62],
                ])}
                stroke="#657f83"
                strokeWidth="8"
              />
              {Array.from({ length: 10 }, (_, i) =>
                line(
                  [p.dogX - 0.48 + i * 0.1, p.dogTop - 0.05, 0.62],
                  [p.dogX - 0.46 + i * 0.1, p.dogTop, 0.62],
                  '#657f83',
                  3,
                ),
              )}
              {line([0.35 + p.dogX, p.dogTop - 0.08, 0.62], [0.35, -0.8, 0.62], '#a0acac', 5)}
              {[-1, 0, 1, 2].map((n) => (
                <path
                  key={n}
                  d={path([
                    [n * p.pitch - p.feed, 0.23, 0.62],
                    [n * p.pitch - p.feed, 0.37, 0.62],
                  ])}
                  stroke="#9b8262"
                  strokeWidth="2"
                />
              ))}
            </>
          )}
          {eye && (
            <circle
              cx={project(p.hook.throat)[0]}
              cy={project(p.hook.throat)[1]}
              r="8"
              fill="none"
              stroke="#ab8753"
              strokeWidth="1.5"
            />
          )}
          {feed && (
            <path
              d={`M${tip[0] + 14} ${tip[1]}v${Math.max(0, project([0, S.fabricTop, 0.62])[1] - tip[1])}`}
              stroke="#51947e"
              strokeWidth="2"
            />
          )}
        </g>
      </svg>
      <div className="sewing-thread-key">
        <span>
          <i />
          {t('上线')}
        </span>
        <span>
          <i />
          {t('底线')}
        </span>
      </div>
    </div>
  );
}
export function SewingTiming({ pose: p }: { pose: SewingPose }) {
  return (
    <div className="sewing-timing" aria-label={t('同一周期内的动作区间')}>
      {[
        ['针在布内', ...SEWING_NEEDLE_WINDOW],
        ['旋梭携环', S.capture, S.release],
        ['挑线收紧', S.clearCase, S.tight],
        ['送布', S.feedStart, S.feedEnd],
      ].map(([label, a, b]) => (
        <div key={label as string}>
          <span>{t(label as string)}</span>
          <i>
            <b
              style={{ left: `${Number(a) * 100}%`, width: `${(Number(b) - Number(a)) * 100}%` }}
            />
            <em style={{ left: `${p.phase * 100}%` }} />
          </i>
        </div>
      ))}
    </div>
  );
}
const stitchStrands = (p: SewingPose) => ({
  upper: p.upper.slice(p.upper.indexOf(p.core[0])),
  lower: p.lower.slice(-2),
});
const stitchX = (v: SewingPoint) => v[0] + (v[2] - S.needleZ) * (90 / 78);

/** After tightening, the stitched points translate monotonically by -feed. The two
 * endpoint poses therefore bound the entire feed stroke, including the fixed lower lead.
 * Fit both specimens and their moving material margins once, not once per film frame. */
export function sewingComparisonLayout(pitches: readonly number[]) {
  const material = pitches.map((pitch) => {
    const points = [S.tight, 1].flatMap((phase) => {
      const p = sewingPose(phase, pitch),
        strands = stitchStrands(p);
      return [...strands.upper, ...strands.lower].map((v) => ({ x: stitchX(v) + p.feed, y: v[1] }));
    });
    return {
      left: Math.min(...points.map((v) => v.x)) - 0.12,
      right: Math.max(...points.map((v) => v.x)) + 0.12,
      bottom: Math.min(...points.map((v) => v.y)) - 0.08,
      top: Math.max(...points.map((v) => v.y)) + 0.08,
      pitch,
    };
  });
  const bounds = {
    left: Math.min(...material.map((m) => m.left - sewingPose(1, m.pitch).feed)),
    right: Math.max(...material.map((m) => m.right - sewingPose(S.tight, m.pitch).feed)),
    bottom: Math.min(...material.map((m) => m.bottom)),
    top: Math.max(...material.map((m) => m.top)),
  };
  const scaleX = 244 / (bounds.right - bounds.left),
    scaleY = Math.min(150, 68 / (bounds.top - bounds.bottom)),
    top = (100 - (bounds.top - bounds.bottom) * scaleY) / 2;
  const x = (value: number) => 18 + (value - bounds.left) * scaleX,
    y = (value: number) => top + (bounds.top - value) * scaleY;
  return { material, bounds, x, y, project: (v: SewingPoint) => [x(stitchX(v)), y(v[1])] };
}

/** Two independently reconstructed specimens at the same phase; no stretching a sewn sample. */
export function SewingStitchComparison({
  pose,
  reference,
}: {
  pose: SewingPose;
  reference: SewingPose;
}) {
  const layout = useMemo(
    () => sewingComparisonLayout([pose.pitch, reference.pitch]),
    [pose.pitch, reference.pitch],
  );
  return (
    <div
      className="sewing-comparison"
      role="img"
      aria-label={t('同一周期、两种送布距离的线迹比较')}
    >
      {[pose, reference].map((p, row) => {
        const material = layout.material[row],
          strands = stitchStrands(p);
        const route = (v: SewingPoint[]) =>
          v.map((a, i) => `${i ? 'L' : 'M'}${layout.project(a).join(' ')}`).join(' ');
        return (
          <figure className="sewing-specimen" key={row}>
            <figcaption>
              {t('送布距离')} {p.pitch.toFixed(2)} u
            </figcaption>
            <svg viewBox="0 0 280 100" aria-hidden="true">
              <rect
                x={layout.x(material.left - p.feed)}
                y={layout.y(material.top)}
                width={layout.x(material.right) - layout.x(material.left)}
                height={layout.y(material.bottom) - layout.y(material.top)}
                rx="10"
                fill="#b2c6c6"
                opacity=".45"
              />
              <path d={route(strands.lower)} fill="none" stroke="#258d85" strokeWidth="3" />
              <path
                d={route(strands.upper)}
                fill="none"
                stroke="#bd583e"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </svg>
            <p>{row === 0 ? t('相同针与旋梭相位') : t('只增加送布行程')}</p>
          </figure>
        );
      })}
    </div>
  );
}
/** Two aligned detail windows replace the phone overview for the tightening beat. */
function SewingTakeupSection({ pose: p }: { pose: SewingPose }) {
  const upper = (v: SewingPoint) => [150 + (v[0] - 0.7) * 105, 95 - (v[1] - 2.45) * 105];
  const scale = 44 + 70 * p.tightening,
    center = -0.8 + 0.84 * p.tightening;
  const lower = (v: SewingPoint) => [
    140 + v[0] * scale + (v[2] - 0.62) * 70 * p.tightening,
    244 - (v[1] - center) * scale,
  ];
  const route = (v: SewingPoint[], map: typeof upper) =>
    v.map((a, i) => `${i ? 'L' : 'M'}${map(a).join(' ')}`).join(' ');
  const pivot = upper(p.takeUpPivot),
    eye = upper(p.takeUpEye),
    fabricY = lower([0, 0.04, 0.62])[1];
  return (
    <div
      className="sewing-diagram sewing-takeup"
      role="img"
      aria-label={t('挑线杆与线环的同相位近看')}
    >
      <div className="sewing-takeup-window">
        <div className="sewing-diagram-title">{t('挑线杆')}</div>
        <svg viewBox="0 10 280 156" aria-hidden="true">
          <path d={route([p.takeUpPivot, p.takeUpEye], upper)} stroke="#8c9c9b" strokeWidth="7" />
          <circle cx={pivot[0]} cy={pivot[1]} r="7" fill="#b9a16f" />
          <circle cx={eye[0]} cy={eye[1]} r="5" fill="#eee7d8" stroke="#af8e60" strokeWidth="2" />
          <path
            d={route([[1.22, 2.65, 1.13], p.takeUpEye, [0, 1.9, 0.76]], upper)}
            fill="none"
            stroke="#b84f36"
            strokeWidth="2.8"
          />
        </svg>
      </div>
      <div className="sewing-takeup-window">
        <div className="sewing-diagram-title">{t(p.complete ? '织物内的交锁' : '线环收紧')}</div>
        <svg viewBox="0 195 280 155" aria-hidden="true">
          <path d={`M12 ${fabricY}H268`} stroke="#a7bfc1" strokeWidth="11" opacity=".65" />
          <path
            d={route(p.lower.slice(-3), lower)}
            fill="none"
            stroke="#268a83"
            strokeWidth="2.7"
          />
          <path
            d={route([...p.core, p.returnLip, p.clothReturn], lower)}
            fill="none"
            stroke="#b84f36"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
