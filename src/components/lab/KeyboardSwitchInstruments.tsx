import { t } from '../../i18n';

export type SwitchCurve = {
  name: string;
  color: string;
  down: { travelMm: number; forceCn: number }[];
  up?: { travelMm: number; forceCn: number }[];
};

/** Actual model samples; the curve is a teaching fit, not a measured force trace. */
export function SwitchForcePlot({
  curves,
  travelMm,
  forceCn,
  color,
  width,
  comparison,
}: {
  curves: SwitchCurve[];
  travelMm: number;
  forceCn: number;
  color: string;
  width: number;
  comparison?: { forceCn: number; color: string };
}) {
  const w = Math.max(210, Math.min(620, width));
  const h = 128,
    left = 35,
    right = w - 38,
    top = 20,
    bottom = 101;
  const x = (mm: number) => left + (mm / 4.2) * (right - left);
  const y = (cn: number) => bottom - (Math.max(0, Math.min(100, cn)) / 100) * (bottom - top);
  const path = (samples: SwitchCurve['down']) =>
    samples
      .map((p, i) => `${i ? 'L' : 'M'}${x(p.travelMm).toFixed(2)},${y(p.forceCn).toFixed(2)}`)
      .join(' ');
  return (
    <div className="ks-force-instrument">
      <div className="ks-instrument-heading">
        <span>
          {t('按压力')} <b>{forceCn.toFixed(0)} cN</b>
        </span>
        <span>{t('教学拟合')}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={t('按压力随行程变化；实线下压，虚线回程。')}
      >
        {[0, 50, 100].map((n) => (
          <g key={n}>
            <line x1={left} y1={y(n)} x2={right} y2={y(n)} className="ks-grid" />
            <text x={left - 8} y={y(n) + 5} textAnchor="end">
              {n}
            </text>
          </g>
        ))}
        {[0, 2, 4].map((n) => (
          <text key={n} x={x(n)} y={123} textAnchor="middle">
            {n}
          </text>
        ))}
        <text x={w - 2} y={123} textAnchor="end">
          mm
        </text>
        {curves.map((curve) => (
          <g key={curve.name} fill="none" stroke={curve.color} strokeWidth={2.4}>
            {curve.up && <path d={path(curve.up)} strokeDasharray="4 5" opacity={0.48} />}
            <path d={path(curve.down)} />
          </g>
        ))}
        <line x1={x(travelMm)} x2={x(travelMm)} y1={top} y2={bottom} className="ks-cursor" />
        {comparison && (
          <circle
            cx={x(travelMm)}
            cy={y(comparison.forceCn)}
            r={5}
            fill={comparison.color}
            stroke="#faf7f0"
            strokeWidth={2}
          />
        )}
        <circle
          cx={x(travelMm)}
          cy={y(forceCn)}
          r={5}
          fill={color}
          stroke="#faf7f0"
          strokeWidth={2}
        />
      </svg>
      <div className="ks-curve-key">
        {curves.length > 1 &&
          curves.map((curve) => (
            <span key={curve.name}>
              <i style={{ background: curve.color }} />
              {t(curve.name)}
              {comparison &&
                ` ${(curve.color === color ? forceCn : comparison.forceCn).toFixed(0)} cN`}
            </span>
          ))}
        {curves.length === 1 && <span>{t('实线下压 · 虚线回程')}</span>}
      </div>
    </div>
  );
}

export function SwitchTravel({
  travelMm,
  totalMm,
  actuationMm,
  releaseMm,
  active,
  direction,
}: {
  travelMm: number;
  totalMm: number;
  actuationMm: number;
  releaseMm: number;
  active: boolean;
  direction: string;
}) {
  return (
    <div className="ks-travel-instrument">
      <div className="ks-instrument-heading">
        <span>
          {t('轴心行程')} <b>{travelMm.toFixed(2)} mm</b>
        </span>
        <span>{t(direction)}</span>
      </div>
      <div className="ks-travel-track" data-active={active}>
        <span className="ks-travel-fill" style={{ width: `${(travelMm / totalMm) * 100}%` }} />
        <i className="ks-travel-release" style={{ left: `${(releaseMm / totalMm) * 100}%` }} />
        <i className="ks-travel-trigger" style={{ left: `${(actuationMm / totalMm) * 100}%` }} />
        <b className="ks-travel-head" style={{ left: `${(travelMm / totalMm) * 100}%` }} />
      </div>
      <div className="ks-travel-key">
        <span>
          <span>{t('复位')}</span>
          <b>{releaseMm.toFixed(2)}</b>
        </span>
        <span>
          <span>{t('触发')}</span>
          <b>{actuationMm.toFixed(1)}</b>
        </span>
        <span>
          <span>{t('触底')}</span>
          <b>{totalMm.toFixed(1)} mm</b>
        </span>
      </div>
    </div>
  );
}

export function SwitchDetection({
  signal,
  fixed,
  rapid,
  travelMm,
}: {
  signal: number;
  fixed: boolean;
  rapid: boolean;
  travelMm: number;
}) {
  return (
    <div className="ks-detection-instrument">
      <div className="ks-instrument-heading">
        <span>
          {t('位置')} <b>{travelMm.toFixed(2)} mm</b>
        </span>
        <span>{t('相对磁信号')}</span>
      </div>
      <div className="ks-signal-track">
        <span style={{ width: `${Math.max(0, Math.min(1, signal)) * 100}%` }} />
      </div>
      <div className="ks-detection-states">
        <span data-on={fixed}>
          <i />
          {t('固定点')} <b>{t(fixed ? '按下' : '松开')}</b>
        </span>
        <span data-on={rapid}>
          <i />
          {t('快速触发')} <b>{t(rapid ? '按下' : '松开')}</b>
        </span>
      </div>
    </div>
  );
}

export function SwitchTravelComparison({
  rows,
}: {
  rows: { name: string; travelMm: number; totalMm: number; actuationMm: number; active: boolean }[];
}) {
  return (
    <div className="ks-travel-comparison">
      <div className="ks-instrument-heading">
        <span>
          {t('轴心行程')} <b>{rows[0].travelMm.toFixed(2)} mm</b>
        </span>
        <span>{t('触发标记')}</span>
      </div>
      {rows.map((row) => (
        <div className="ks-comparison-row" key={row.name}>
          <span>{t(row.name)}</span>
          <div className="ks-comparison-rail">
            <div className="ks-comparison-track" style={{ width: `${(row.totalMm / 4) * 100}%` }} />
            <div
              className="ks-comparison-filled"
              data-on={row.active}
              style={{ width: `${(row.travelMm / 4) * 100}%` }}
            />
            <i style={{ left: `${(row.actuationMm / 4) * 100}%` }} />
            <b style={{ left: `${(row.travelMm / 4) * 100}%` }} />
            <small style={{ left: `${(row.actuationMm / 4) * 100}%` }}>
              {row.actuationMm.toFixed(1)} mm
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
