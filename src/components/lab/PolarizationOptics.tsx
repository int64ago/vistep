import { useId } from 'react';
import { t } from '../../i18n';
import {
  polarizationAxis,
  polarizationField,
  polarizationLayout,
  polarizationPath,
  polarizationSetup,
  malusTransmission,
  projectPolarizationField,
  type PolarizationState,
  type PolarizationView,
} from '../../models/polarization';

export const polarizationColors = { A: '#88c9c3', M: '#bcade1', B: '#e8c588' };
const percent = (value: number) => `${(100 * value).toFixed(1)}%`;

export function PolarizationOptics({
  state,
  time,
  width,
  view,
  middleVisibility = 1,
}: {
  state: PolarizationState;
  time: number;
  width: number;
  view: PolarizationView;
  middleVisibility?: number;
}) {
  const id = useId().replace(/:/g, '');
  const layout = polarizationLayout(width);
  const { project, ring, phone, height, radius } = layout;
  const beamBreaks = [0, ...state.stages.map((s) => s.x), 1];
  const begin = project(0),
    end = project(1);
  const waveScale = phone ? 23 : 30;
  const marker = project(0.13);
  const sample = polarizationField(state, 0.13, time);
  const fieldTip = project(0.13, sample.y * waveScale, sample.z * waveScale);
  return (
    <svg
      className="polarization-optics"
      width={layout.width}
      height={height}
      viewBox={`0 0 ${layout.width} ${height}`}
      role="img"
      aria-label={t(
        '光沿同一条轴传播，电场在垂直于光路的平面内振动。输出光强为入射的 {0}。',
        percent(state.output.intensity),
      )}
    >
      <defs>
        <marker
          id={`${id}-travel`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M1 1L9 5L1 9" fill="none" stroke="#9baeb6" strokeWidth="1.5" />
        </marker>
        <radialGradient id={`${id}-detector`}>
          <stop stopColor="#ffebbb" />
          <stop offset="1" stopColor="#e8c588" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line
        x1={begin.x}
        y1={begin.y}
        x2={end.x}
        y2={end.y}
        stroke="#8195a5"
        strokeOpacity=".28"
        strokeDasharray="3 7"
      />
      {beamBreaks.slice(0, -1).map((from, i) => {
        const to = beamBreaks[i + 1];
        const beam = i ? state.stages[i - 1].after : state.input;
        const color = i ? polarizationColors[state.stages[i - 1].id] : '#b8c9d3';
        const count = Math.max(30, Math.ceil((to - from) * 420));
        const points = Array.from({ length: count }, (_, n) => {
          const x = from + ((to - from) * n) / (count - 1);
          const field = polarizationField(state, Math.max(from, x - (x === to ? 1e-8 : 0)), time);
          return project(x, field.y * waveScale, field.z * waveScale);
        });
        return (
          <g key={from}>
            {beam.intensity > 0 && (
              <>
                <path
                  d={polarizationPath(points)}
                  fill="none"
                  stroke={color}
                  strokeWidth="7"
                  strokeOpacity=".055"
                  strokeLinejoin="round"
                />
                <path
                  d={polarizationPath(points)}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.65"
                  strokeLinejoin="round"
                />
              </>
            )}
            {Array.from({ length: 7 }, (_, n) => {
              const x = from + ((to - from) * (n + 0.5)) / 7;
              const f = polarizationField(state, x, time);
              const base = project(x),
                tip = project(x, f.y * waveScale, f.z * waveScale);
              return (
                <line
                  key={n}
                  x1={base.x}
                  y1={base.y}
                  x2={tip.x}
                  y2={tip.y}
                  stroke={color}
                  strokeOpacity=".28"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        );
      })}
      {state.stages.map((stage) => {
        const center = project(stage.x),
          axis = polarizationAxis(stage.angle);
        const tipA = project(stage.x, axis.y * radius, axis.z * radius);
        const tipB = project(stage.x, -axis.y * radius, -axis.z * radius);
        const labelY = phone ? center.y - 27 : 235;
        return (
          <g key={stage.id} opacity={stage.id === 'M' ? middleVisibility : 1}>
            <path
              d={polarizationPath(ring(stage.x), true)}
              fill="#172c3a"
              fillOpacity=".72"
              stroke={polarizationColors[stage.id]}
              strokeWidth="2.3"
              strokeOpacity=".65"
            />
            <path
              d={polarizationPath(ring(stage.x, radius - 5), true)}
              fill="none"
              stroke={polarizationColors[stage.id]}
              strokeWidth=".8"
              strokeOpacity=".3"
            />
            <line
              x1={tipA.x}
              y1={tipA.y}
              x2={tipB.x}
              y2={tipB.y}
              stroke={polarizationColors[stage.id]}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx={tipA.x} cy={tipA.y} r="4" fill={polarizationColors[stage.id]} />
            <text
              x={phone ? 10 : center.x}
              y={labelY}
              textAnchor={phone ? 'start' : 'middle'}
              fill={polarizationColors[stage.id]}
            >
              {stage.id} · {Math.round(stage.angle)}°
            </text>
            <text
              x={phone ? layout.width - 10 : center.x}
              y={phone ? labelY : labelY + 26}
              textAnchor={phone ? 'end' : 'middle'}
              className="polarization-svg-number"
            >
              {percent(stage.after.intensity)}
            </text>
          </g>
        );
      })}
      <path
        d={polarizationPath(ring(1, 21), true)}
        fill="#0e202c"
        stroke="#647b87"
        strokeWidth="1"
      />
      <path
        d={polarizationPath(ring(1, 21), true)}
        fill={`url(#${id}-detector)`}
        opacity={Math.sqrt(state.output.intensity)}
      />
      {view === 'direction' && (
        <>
          <line
            x1={marker.x}
            y1={marker.y}
            x2={fieldTip.x}
            y2={fieldTip.y}
            stroke="#eed098"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx={fieldTip.x} cy={fieldTip.y} r="4" fill="#eed098" />
          <text x={phone ? 12 : marker.x} y={phone ? marker.y - 25 : 50} fill="#eed098">
            E
          </text>
        </>
      )}
      {phone ? (
        <>
          <path
            d={`M${layout.width - 20} 36v28`}
            stroke="#9baeb6"
            fill="none"
            markerEnd={`url(#${id}-travel)`}
          />
          <text x="10" y="22" className="polarization-svg-muted">
            {t('传播方向')}
          </text>
          <text
            x={layout.width / 2}
            y={height - 8}
            textAnchor="middle"
            className="polarization-svg-muted"
          >
            {t('接收屏')}
          </text>
        </>
      ) : (
        <>
          <path
            d={`M${width / 2 - 40} 29h80`}
            stroke="#9baeb6"
            fill="none"
            markerEnd={`url(#${id}-travel)`}
          />
          <text x={width / 2} y="59" textAnchor="middle" className="polarization-svg-muted">
            {t('传播方向')}
          </text>
          <text x={end.x} y="190" textAnchor="middle" className="polarization-svg-muted">
            {t('接收屏')}
          </text>
        </>
      )}
    </svg>
  );
}

/** End-on vectors use RMS amplitudes. The dotted segment is the removed
 * perpendicular component; it terminates on the actual projected vector.
 */
function ProjectionFace({
  state,
  view,
  time,
}: {
  state: PolarizationState;
  view: PolarizationView;
  time: number;
}) {
  const focus =
    view === 'first'
      ? state.stages[0]
      : view === 'middle' || view === 'sweep'
        ? state.stages.find((s) => s.id === 'M')
        : state.stages.at(-1);
  const incoming = focus?.before ?? state.input;
  const outgoing = focus?.after ?? state.output;
  const radius = 53,
    center = 70;
  const point = (angle: number, amplitude: number) => {
    const u = polarizationAxis(angle);
    return { x: center + u.z * radius * amplitude, y: center - u.y * radius * amplitude };
  };
  const inputTip = point(incoming.axis ?? 0, Math.sqrt(incoming.intensity));
  const signedOutput =
    focus && incoming.axis !== null
      ? projectPolarizationField(
          {
            y: polarizationAxis(incoming.axis).y * Math.sqrt(incoming.intensity),
            z: polarizationAxis(incoming.axis).z * Math.sqrt(incoming.intensity),
          },
          focus.angle,
        )
      : null;
  const outputTip = signedOutput
    ? { x: center + signedOutput.z * radius, y: center - signedOutput.y * radius }
    : point(outgoing.axis ?? 0, Math.sqrt(outgoing.intensity));
  const axisTip = point(focus?.angle ?? 0, 1.12),
    axisBottom = point((focus?.angle ?? 0) + 180, 1.12);
  const field = polarizationField(state, 0.12, time);
  return (
    <svg viewBox="0 0 140 140" className="polarization-face" aria-hidden="true">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="#102632"
        stroke="#728998"
        strokeOpacity=".36"
      />
      <path d="M70 12V128M12 70H128" stroke="#617d8e" strokeOpacity=".18" />
      {incoming.axis === null &&
        Array.from({ length: 12 }, (_, i) => {
          const p = point(i * 15, Math.sqrt(incoming.intensity));
          const q = point(i * 15 + 180, Math.sqrt(incoming.intensity));
          return (
            <line
              key={i}
              x1={q.x}
              y1={q.y}
              x2={p.x}
              y2={p.y}
              stroke="#bbcad3"
              strokeOpacity=".3"
              strokeWidth="1.3"
            />
          );
        })}
      {focus && (
        <line
          x1={axisTip.x}
          y1={axisTip.y}
          x2={axisBottom.x}
          y2={axisBottom.y}
          stroke={polarizationColors[focus.id]}
          strokeDasharray="3 4"
          strokeOpacity=".7"
        />
      )}
      {incoming.axis !== null && (
        <line
          x1={center}
          y1={center}
          x2={inputTip.x}
          y2={inputTip.y}
          stroke="#c9d5da"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {focus && incoming.axis !== null && (
        <line
          x1={inputTip.x}
          y1={inputTip.y}
          x2={outputTip.x}
          y2={outputTip.y}
          stroke="#c9d5da"
          strokeOpacity=".4"
          strokeDasharray="3 4"
        />
      )}
      {(focus || incoming.axis !== null) && outgoing.intensity > 0 && (
        <>
          <line
            x1={center}
            y1={center}
            x2={outputTip.x}
            y2={outputTip.y}
            stroke={focus ? polarizationColors[focus.id] : '#eed098'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle
            cx={outputTip.x}
            cy={outputTip.y}
            r="4"
            fill={focus ? polarizationColors[focus.id] : '#eed098'}
          />
        </>
      )}
      {view === 'ensemble' && (
        <line
          x1={center}
          y1={center}
          x2={center + field.z * 29}
          y2={center - field.y * 29}
          stroke="#eed098"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      <circle cx={center} cy={center} r="3" fill="#cdd9de" />
    </svg>
  );
}

function PolarizationCurve({ state, middle }: { state: PolarizationState; middle: boolean }) {
  const a = state.stages[0]?.angle ?? 0;
  const beta = state.stages.find((s) => s.id === 'M')?.angle ?? 0;
  const theta = (state.stages.at(-1)?.angle ?? 0) - a;
  const value = middle ? state.output.intensity : (state.stages.at(-1)?.relativeTransmission ?? 1);
  const points = Array.from({ length: 91 }, (_, degree) => {
    const y = middle
      ? polarizationSetup(0, degree, 90).output.intensity / 0.125
      : malusTransmission(degree);
    return { x: 20 + (degree / 90) * 180, y: 78 - y * 62 };
  });
  return (
    <svg
      className="polarization-curve"
      viewBox="0 0 228 118"
      role="img"
      aria-label={t(
        middle
          ? '交叉外片之间，中间轴为 45° 时透光最多。'
          : '马吕斯曲线：相对透过率等于夹角余弦的平方。',
      )}
    >
      <path d="M20 12V78H205" fill="none" stroke="#6b8596" strokeOpacity=".5" />
      <path d={polarizationPath(points)} fill="none" stroke="#7facae" strokeWidth="2" />
      <line
        x1={20 + ((middle ? beta : Math.min(90, Math.abs(theta))) / 90) * 180}
        x2={20 + ((middle ? beta : Math.min(90, Math.abs(theta))) / 90) * 180}
        y1="78"
        y2={78 - (value / (middle ? 0.125 : 1)) * 62}
        stroke="#e8c588"
        strokeDasharray="2 4"
      />
      <circle
        cx={20 + ((middle ? beta : Math.min(90, Math.abs(theta))) / 90) * 180}
        cy={78 - (value / (middle ? 0.125 : 1)) * 62}
        r="4"
        fill="#e8c588"
      />
      <text x="4" y="14">
        {middle ? '⅛' : '1'}
      </text>
      <text x="3" y="84">
        0
      </text>
      <text x="20" y="108" textAnchor="middle">
        0°
      </text>
      <text x="110" y="108" textAnchor="middle">
        45°
      </text>
      <text x="200" y="108" textAnchor="middle">
        90°
      </text>
    </svg>
  );
}

export function PolarizationDetail({
  state,
  view,
  time,
  energyStep,
}: {
  state: PolarizationState;
  view: PolarizationView;
  time: number;
  energyStep: number;
}) {
  if (view === 'energy') {
    const ledger = [
      ...state.stages.map((s) => ({
        id: s.id,
        value: s.absorbed,
        label: t('{0} 吸收', s.id),
        color: polarizationColors[s.id],
      })),
      { id: 'out', value: state.output.intensity, label: t('继续传播'), color: '#dce6d6' },
    ];
    return (
      <div className="polarization-energy">
        <div className="polarization-energy-heading">
          <span>{t('同一份入射能量')}</span>
          <b>100%</b>
        </div>
        <div className="polarization-energy-bar" aria-hidden="true">
          {ledger.map((item) => (
            <span key={item.id} style={{ width: `${item.value * 100}%`, background: item.color }} />
          ))}
        </div>
        <div className="polarization-energy-labels">
          {ledger.map((item, i) => (
            <div key={item.id} data-active={energyStep === i}>
              <span>{item.label}</span>
              <strong>{percent(item.value)}</strong>
            </div>
          ))}
        </div>
        <p>{t('透过 + 各片吸收 = 入射')}</p>
      </div>
    );
  }
  const middle = view === 'sweep';
  const graph = middle || view === 'malus' || view === 'crossed';
  return (
    <div className="polarization-detail">
      <div className="polarization-end-on">
        <ProjectionFace state={state} view={view} time={time} />
        <span>{t('迎着光看')}</span>
      </div>
      <div className="polarization-detail-copy">
        <span>
          {t(
            view === 'direction'
              ? '电场方向 ⟂ 传播方向'
              : view === 'ensemble'
                ? '时间平均：无优先方向'
                : view === 'first'
                  ? '第一片后的光强'
                  : view === 'middle'
                    ? '两次投影'
                    : middle
                      ? '中间轴角度 β'
                      : '相邻两轴夹角 θ',
          )}
        </span>
        {graph ? (
          <>
            <b>{middle ? 'I / I₀ = ⅛ sin²(2β)' : 'I₂ / I₁ = cos²θ'}</b>
            <PolarizationCurve state={state} middle={middle} />
          </>
        ) : (
          <b>
            {view === 'direction'
              ? 'E ⟂ k'
              : view === 'ensemble'
                ? '⟨Ey²⟩ = ⟨Ez²⟩'
                : view === 'first'
                  ? 'I₁ / I₀ = ½'
                  : 'I / I₀ = ½ cos²β sin²β'}
          </b>
        )}
        {view === 'middle' && <span>{t('每片都只留下当前电场的投影。')}</span>}
      </div>
    </div>
  );
}
