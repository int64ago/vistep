import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import {
  DOUBLE_SLIT_DEFAULT,
  doubleSlitAt,
  doubleSlitProfile,
  doubleSlitFringeSpacing,
  doubleSlitDistribution,
  doubleSlitDetection,
  doubleSlitUnitRandom,
  type DoubleSlitParameters,
} from '../../models/double-slit';
import { doubleSlitShot, type DoubleSlitView } from '../../models/double-slit-film';
import '../../styles/double-slit.css';

/** Display hue is illustrative; this is not a colorimetric/spectral renderer. */
function lightColor(nm: number) {
  return `hsl(${230 - (nm - 450) * 1.05} 76% 72%)`;
}
const HALF = 0.01;

export function DoubleSlitInstrument({
  parameters: q,
  probeM,
  view,
  width,
  time,
  detections,
}: {
  parameters: DoubleSlitParameters;
  probeM: number;
  view: DoubleSlitView;
  width: number;
  time: number;
  detections: number;
}) {
  const gradientId = useId();
  const compact = width < 600,
    height = compact ? 336 : 420,
    pad = compact ? 20 : 42;
  const x = (y: number) => pad + ((y + HALF) / (2 * HALF)) * (width - 2 * pad);
  const profile = useMemo(
    () => doubleSlitProfile(q, 481, HALF),
    [q.wavelengthM, q.slitWidthM, q.separationM, q.distanceM, q.slit, q.coherence],
  );
  const distribution = useMemo(
    () => doubleSlitDistribution(q, HALF),
    [q.wavelengthM, q.slitWidthM, q.separationM, q.distanceM, q.slit, q.coherence],
  );
  const point = doubleSlitAt(q, probeM),
    color = lightColor(q.wavelengthM * 1e9);
  const graphBase = height - 42,
    graphTop = height - (compact ? 112 : 140),
    stripY = height - (compact ? 177 : 205),
    stripH = 34;
  const graphY = (v: number) => graphBase - (v / 4) * (graphBase - graphTop);
  const path = (envelope = false) =>
    profile
      .map(
        (s, i) =>
          `${i ? 'L' : 'M'}${x(s.yM)},${graphY(envelope ? (q.slit === 'one' ? 1 : 4) * s.envelope : s.intensity)}`,
      )
      .join('');
  const px = x(probeM);
  const phase = view === 'phase',
    dots = view === 'detections',
    graphOnly = ['spacing', 'wavelength', 'width'].includes(view);
  const arm = (cx: number, cy: number, dx: number, dy: number, stroke: string, dashed = false) => {
    const len = Math.hypot(dx, dy);
    if (len < 0.1) return <circle cx={cx} cy={cy} r="3" fill={stroke} />;
    const ux = dx / len,
      uy = dy / len,
      ex = cx + dx,
      ey = cy + dy;
    return (
      <path
        d={`M${cx},${cy}L${ex},${ey}m${-ux * 7 - uy * 4},${-uy * 7 + ux * 4}L${ex},${ey}l${-ux * 7 + uy * 4},${-uy * 7 - ux * 4}`}
        stroke={stroke}
        fill="none"
        strokeWidth="2.4"
        strokeDasharray={dashed ? '4 5' : undefined}
      />
    );
  };
  const bench = () => {
    const mx = compact ? 57 : width * 0.22,
      sx = width - pad - 17,
      mid = compact ? 88 : 100,
      apertureScale = compact ? 0.3 : 0.34,
      gap = (q.separationM * 1e6 * apertureScale) / 2,
      opening = (q.slitWidthM * 1e6 * apertureScale) / 2;
    const py = mid - (probeM / HALF) * (compact ? 59 : 77),
      a = mid - gap,
      b = mid + gap;
    return (
      <g>
        <text x={pad} y="18">
          {t(q.slit === 'one' ? '只开一缝' : '两缝同时打开')}
        </text>
        <text x={width - pad} y="18" textAnchor="end">
          {t('接收屏')}
        </text>
        <path
          d={`M${pad},${a - opening - 3}H${mx - 5}V${b + opening + 3}H${pad}Z`}
          fill={color}
          opacity=".1"
        />
        {[a, mid, b].map((lineY) => (
          <path
            key={lineY}
            d={`M${pad},${lineY}H${mx - 5}`}
            stroke={color}
            strokeWidth="1.5"
            opacity=".45"
          />
        ))}
        <path
          d={`M${mx},${mid - 65}V${a - opening}M${mx},${a + opening}V${b - opening}M${mx},${b + opening}V${mid + 65}`}
          stroke="#778d99"
          strokeWidth="9"
          strokeLinecap="butt"
        />
        {q.slit === 'one' && (
          <path d={`M${mx},${b - opening}V${b + opening}`} stroke="#bccbd0" strokeWidth="9" />
        )}
        <path d={`M${mx + 5},${a}L${sx},${py}`} stroke="#8de4d2" strokeWidth="1.7" />
        {q.slit === 'both' && (
          <path d={`M${mx + 5},${b}L${sx},${py}`} stroke="#c7b5f2" strokeWidth="1.7" />
        )}
        <text x={mx - 10} y={a + 5} textAnchor="end" fill="#8de4d2">
          S₁
        </text>
        <text x={mx - 10} y={b + 5} textAnchor="end" fill="#c7b5f2">
          S₂
        </text>
        <path d={`M${mx + 5},${mid}H${sx}`} stroke="#7894a2" strokeDasharray="3 6" opacity=".3" />
        {profile
          .filter((_, i) => i % 4 === 0)
          .map((s, i) => (
            <rect
              key={i}
              x={sx}
              y={mid - (s.yM / HALF) * (compact ? 59 : 77)}
              width="10"
              height={compact ? 1.2 : 1.5}
              fill={color}
              opacity={s.intensity / 4}
            />
          ))}
        <circle cx={sx + 5} cy={py} r="5" fill="#f3d18c" stroke="#102530" strokeWidth="2" />
        <text x={sx - 10} y={py + 5} textAnchor="end" fill="#f3d18c">
          P
        </text>
        {!compact && (
          <text x={(mx + sx) / 2} y={mid + 55} textAnchor="middle">
            L = 1 m
          </text>
        )}
      </g>
    );
  };
  const phasors = () => {
    const cy = compact ? 82 : 108,
      cx = width / 2,
      r = compact ? 28 : 40;
    const angle = time * 0.65,
      amplitude = Math.sqrt(point.envelope);
    const a = { x: r * amplitude * Math.cos(angle), y: -r * amplitude * Math.sin(angle) };
    const b =
      q.slit === 'both'
        ? {
            x: r * amplitude * Math.cos(angle - point.phaseDifference),
            y: -r * amplitude * Math.sin(angle - point.phaseDifference),
          }
        : { x: 0, y: 0 };
    return (
      <g>
        <text x={pad} y="18" fill="#8de4d2">
          E₁
        </text>
        {q.slit === 'both' && (
          <text x={pad + 36} y="18" fill="#c7b5f2">
            E₂
          </text>
        )}
        <text x={width - pad} y="18" textAnchor="end">
          {t(q.slit === 'one' ? 'P 处的单缝场' : 'P 处的场相加')}
        </text>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#7a929e"
          opacity=".3"
          fill="none"
          strokeDasharray="3 6"
        />
        <circle cx={cx} cy={cy} r="3" fill="#a4bac4" />
        <g data-field="first">{arm(cx, cy, a.x, a.y, '#8de4d2')}</g>
        {q.slit === 'both' && (
          <g data-field="second">{arm(cx + a.x, cy + a.y, b.x, b.y, '#c7b5f2')}</g>
        )}
        <g data-field="sum">{arm(cx, cy, a.x + b.x, a.y + b.y, '#fff0cb', true)}</g>
      </g>
    );
  };
  const comparison = () => {
    const spacing = doubleSlitFringeSpacing(q),
      left = x(0),
      right = x(spacing),
      apertureScale = 0.23e6,
      halfSeparation = (q.separationM * apertureScale) / 2;
    const label =
      view === 'spacing'
        ? `${t('缝距')} d = ${(q.separationM * 1e6).toFixed(0)} μm`
        : view === 'wavelength'
          ? `${t('波长')} λ = ${(q.wavelengthM * 1e9).toFixed(0)} nm`
          : `${t('缝宽')} a = ${(q.slitWidthM * 1e6).toFixed(0)} μm`;
    return (
      <g>
        <text x={width / 2} y="28" textAnchor="middle">
          {label}
        </text>
        <g transform={`translate(${width / 2},48)`}>
          {([-1, 1] as const).map((side) => {
            const open = side === -1 || q.slit === 'both';
            return (
              <g key={side}>
                <path
                  data-slit={side === -1 ? 'first' : 'second'}
                  data-open={open ? 'true' : 'false'}
                  d={`M${side * halfSeparation},0v24`}
                  stroke={open ? color : '#607783'}
                  strokeWidth={q.slitWidthM * apertureScale}
                  strokeLinecap="round"
                />
                {!open && (
                  <text x={side * halfSeparation + 14} y="16" textAnchor="start">
                    {t('封闭')}
                  </text>
                )}
              </g>
            );
          })}
          <path d={`M${-halfSeparation},32H${halfSeparation}`} stroke="#a3b8c2" />
          <text x="0" y="52" textAnchor="middle">
            d
          </text>
        </g>
        {q.slit === 'both' && (
          <g data-fringe-spacing="true">
            <path d={`M${left},${stripY - 15}v-8H${right}v8`} stroke="#f3d18c" fill="none" />
            <text x={(left + right) / 2} y={stripY - 31} textAnchor="middle" fill="#f3d18c">
              {(spacing * 1000).toFixed(2)} mm
            </text>
          </g>
        )}
      </g>
    );
  };
  const detection = () => (
    <g>
      <text x={pad} y="20">
        {t('逐次探测')}
      </text>
      <text x={width - pad} y="20" textAnchor="end">
        {detections} / 1200
      </text>
      <rect
        x={pad}
        y="37"
        width={width - 2 * pad}
        height={compact ? 118 : 146}
        rx="8"
        fill="#06121c"
        stroke="#29414f"
      />
      {Array.from({ length: detections }, (_, i) => {
        const event = doubleSlitDetection(distribution, i);
        // The model fixes the horizontal detection. The orthogonal spread only separates plotted marks.
        const row = doubleSlitUnitRandom(i, undefined, 1);
        return (
          <circle
            key={i}
            data-detection={i}
            cx={x(event.yM)}
            cy={43 + row * (compact ? 106 : 134)}
            r={compact ? 0.95 : 1.1}
            fill={color}
            opacity=".76"
          />
        );
      })}
    </g>
  );
  return (
    <svg
      className="ds-instrument"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('双缝光程、相位与同一屏幕的干涉条纹')}
      data-view={view}
    >
      {phase ? phasors() : dots ? detection() : graphOnly ? comparison() : bench()}
      <rect x={pad} y={stripY} width={width - 2 * pad} height={stripH} fill="#07131b" rx="5" />
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          {profile.map((s, i) => (
            <stop
              key={i}
              offset={i / (profile.length - 1)}
              stopColor={color}
              stopOpacity={s.intensity / 4}
            />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={pad}
        y={stripY + 3}
        width={width - 2 * pad}
        height={stripH - 6}
        fill={`url(#${gradientId})`}
      />
      {!dots && !graphOnly && (
        <g>
          <path d={`M${px},${stripY - 3}v${stripH + 6}`} stroke="#f3d18c" />
          <text x={px} y={stripY - 10} textAnchor="middle" fill="#f3d18c">
            P
          </text>
        </g>
      )}
      <path d={`M${pad},${graphBase}H${width - pad}`} stroke="#567181" opacity=".6" />
      <text x={pad} y={graphTop - 7} className="ds-muted">
        I/I₀
      </text>
      <text x={pad - 5} y={graphTop + 7} textAnchor="end" className="ds-muted">
        4
      </text>
      {view === 'width' && (
        <path d={path(true)} stroke="#c7b5f2" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
      )}
      <path d={`${path()}L${x(HALF)},${graphBase}H${x(-HALF)}Z`} fill={color} fillOpacity=".08" />
      <path d={path()} stroke={color} strokeWidth="1.8" fill="none" />
      {!graphOnly && !dots && <circle cx={px} cy={graphY(point.intensity)} r="4" fill="#f3d18c" />}
      {[-10, 0, 10].map((v) => (
        <g key={v}>
          <path d={`M${x(v / 1000)},${graphBase}v5`} stroke="#7b94a2" />
          <text
            x={x(v / 1000)}
            y={graphBase + 25}
            textAnchor={v === -10 ? 'start' : v === 10 ? 'end' : 'middle'}
            className="ds-muted"
          >
            {v > 0 ? '+' : ''}
            {v}
            {v === 10 ? ' mm' : ''}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function DoubleSlit() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800),
    [manual, setManual] = useState<DoubleSlitParameters>({ ...DOUBLE_SLIT_DEFAULT }),
    [probe, setProbe] = useState(0),
    [mode, setMode] = useState('paths');
  useEffect(() => {
    if (!host.current) return;
    const obs = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    obs.observe(host.current);
    return () => obs.disconnect();
  }, []);
  const shot = doubleSlitShot(film.chapter, film.chapterProgress),
    q = film.watch ? shot.parameters : manual;
  const view: DoubleSlitView = film.watch ? shot.view : (mode as DoubleSlitView),
    probeM = film.watch ? shot.probeM : probe / 1000;
  const point = doubleSlitAt(q, probeM);
  const set = (key: keyof DoubleSlitParameters, value: number) =>
    setManual((v) => ({ ...v, [key]: value }));
  return (
    <section className="ds-study" data-watch={film.watch}>
      <div className="ds-heading">
        <span>YOUNG’S EXPERIMENT</span>
        <b>{t('两条缝，一个屏幕')}</b>
      </div>
      <div className="ds-optics" ref={host}>
        <DoubleSlitInstrument
          parameters={q}
          probeM={probeM}
          view={view}
          width={width}
          time={film.watch ? film.time : 0}
          detections={film.watch ? shot.detections : 1200}
        />
      </div>
      <div className="ds-reading">
        {['paths', 'opening', 'phase'].includes(view) ? (
          <>
            <span>
              {q.slit === 'both' ? (
                <>
                  {t('光程差')} <b>Δ ≈ {(point.pathDifferenceM / q.wavelengthM).toFixed(2)} λ</b>
                </>
              ) : (
                <>
                  {t('开放的狭缝')}
                  <b>S₁</b>
                </>
              )}
            </span>
            <span>
              {t('P 处相对光强')} <b>{point.intensity.toFixed(2)} I₀</b>
            </span>
          </>
        ) : (
          <span>
            {t(
              view === 'width'
                ? '峰值归一化，只比较形状。'
                : view === 'detections'
                  ? '同一概率分布，逐点显现。'
                  : '近轴条纹间距',
            )}{' '}
            {['spacing', 'wavelength'].includes(view) && (
              <b>Δy ≈ {(doubleSlitFringeSpacing(q) * 1000).toFixed(2)} mm</b>
            )}
          </span>
        )}
      </div>
      <p className="ds-scale ds-context">
        {t(
          view === 'phase'
            ? '相量慢动作'
            : view === 'detections'
              ? '点迹不代表光子轨迹'
              : ['opening', 'paths'].includes(view)
                ? '光程示意，不按比例'
                : view === 'width'
                  ? '虚线：单缝衍射包络'
                  : '每次只改变一个条件',
        )}
      </p>
      <p className="ds-scale">{t('I₀ = 当前单缝中央')}</p>
      {!film.watch && (
        <div className="ds-controls">
          <Segments
            label={t('双缝观察方式')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'paths', label: t('光程') },
              { value: 'phase', label: t('相位') },
              { value: 'width', label: t('条纹') },
              { value: 'detections', label: t('探测') },
            ]}
          />
          <Segments
            label={t('开放的狭缝')}
            value={q.slit}
            onChange={(slit) => setManual((v) => ({ ...v, slit }))}
            options={[
              { value: 'one', label: t('一道缝') },
              { value: 'both', label: t('两道缝') },
            ]}
          />
          <Range
            label={t('波长')}
            value={Math.round(q.wavelengthM * 1e9)}
            min={450}
            max={650}
            step={5}
            unit="nm"
            onChange={(v) => set('wavelengthM', v * 1e-9)}
          />
          <Range
            label={t('双缝中心距')}
            value={Math.round(q.separationM * 1e6)}
            min={120}
            max={300}
            step={5}
            unit="μm"
            onChange={(v) => set('separationM', v * 1e-6)}
          />
          <Range
            label={t('每道缝的宽度')}
            value={Math.round(q.slitWidthM * 1e6)}
            min={20}
            max={70}
            step={1}
            unit="μm"
            onChange={(v) => set('slitWidthM', v * 1e-6)}
          />
          <Range
            label={t('屏幕观察点 P')}
            value={probe}
            min={-8}
            max={8}
            step={0.1}
            unit="mm"
            onChange={setProbe}
          />
          <button
            className="ds-reset"
            onClick={() => {
              setManual({ ...DOUBLE_SLIT_DEFAULT });
              setProbe(0);
              setMode('paths');
            }}
          >
            {t('恢复初始双缝')}
          </button>
          <details className="ds-notes">
            <summary>{t('双缝模型边界')}</summary>
            <p>
              {t(
                '均匀单色光、相同矩形缝、标量远场近似；L 固定为 1 m。缝距和缝宽独立，几何光路只作示意。',
              )}
            </p>
            <p>
              {t(
                'I₀ 随缝宽和波长改变，归一化图不比较总功率。探测点按当前屏内强度分布抽样，不能预测单个光子的路径；纵向散布仅为分开显示点迹。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
