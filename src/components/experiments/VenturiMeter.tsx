import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  venturi,
  venturiProfile,
  venturiMarker,
  venturiPressure,
  venturiShot,
} from '../../models/venturi-meter';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/venturi-meter.css';
export default function VenturiMeter() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [flow, setFlow] = useState(0.8),
    [throat, setThroat] = useState(25),
    [phase, setPhase] = useState(0),
    [energy, setEnergy] = useState(false);
  const shot = film.watch
      ? venturiShot(film.chapter, film.chapterProgress)
      : { flow: flow / 1000, throat: throat / 1000, energy },
    s = venturi(shot),
    profile = useMemo(() => venturiProfile(shot.throat), [shot.throat]),
    W = phone ? 340 : 760,
    H = phone ? 270 : 340,
    xScale = phone ? 430 : 950,
    rScale = phone ? 900 : 1500,
    axis = phone ? 65 : 85,
    x = (v: number) => (phone ? 30 : 70) + v * xScale,
    outline =
      profile.samples.map((a) => `${x(a.x)},${axis - a.radius * rScale}`).join(' ') +
      ' ' +
      profile.samples
        .toReversed()
        .map((a) => `${x(a.x)},${axis + a.radius * rScale}`)
        .join(' '),
    x1 = x(0.07),
    x2 = x(0.3),
    base = phone ? 170 : 210,
    levelScale = phone ? 2100 : 3000,
    left = base + (s.height * levelScale) / 2,
    right = base - (s.height * levelScale) / 2,
    uBottom = H - 20,
    physicalTime = film.watch ? film.chapterTime * 0.1 : phase,
    transportTime =
      film.watch && film.chapter === 5
        ? film.chapterProgress < 0.5
          ? physicalTime
          : physicalTime / film.chapterProgress - physicalTime
        : physicalTime,
    markerFlow = film.watch && film.chapter === 5 ? 0.0008 : s.flow;
  return (
    <section className="venturi-study">
      <header>
        {t(shot.energy ? '理想扩散段恢复静压，喉部压差不是永久损耗' : '两处静压口，反推流量大小')}
      </header>
      <svg
        className="venturi-apparatus"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('同一面积模型的文丘里剖面、实际体积坐标流动与连续连接的双液差压管')}
      >
        <defs>
          <clipPath id={`${id}pipe`}>
            <polygon points={outline} />
          </clipPath>
        </defs>
        <polygon
          points={outline}
          fill="#31525d"
          stroke="#9ab5ad"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${id}pipe)`}>
          {profile.samples
            .filter((_, i) => i % 5 === 0)
            .map((a, i) => {
              const p = venturiPressure(a.x, shot).pressure;
              return (
                <rect
                  key={i}
                  x={x(a.x)}
                  y={axis - a.radius * rScale}
                  width={0.005 * xScale + 1}
                  height={2 * a.radius * rScale}
                  fill="#9ebeb4"
                  opacity={0.12 + (0.3 * p) / 6000}
                />
              );
            })}
          {[-0.7, -0.35, 0, 0.35, 0.7].flatMap((lane, j) =>
            Array.from({ length: 12 }, (_, i) => {
              const m = venturiMarker(
                  profile,
                  markerFlow,
                  transportTime,
                  (i + 0.13 * j) / 12,
                  lane,
                ),
                gold = j === 2 && i === 5;
              return (
                <circle
                  key={`${j}-${i}`}
                  cx={x(m.x)}
                  cy={axis - m.y * rScale}
                  r={gold ? 3.5 : 1.8}
                  fill={gold ? '#e3bf7e' : '#b8d2c6'}
                  opacity={gold ? 1 : 0.65}
                />
              );
            }),
          )}
        </g>
        {[x1, x2].map((q, i) => (
          <g key={i}>
            <circle cx={q} cy={axis} r="5" fill="#243f4a" stroke="#c2d0bb" strokeWidth="2" />
            <text
              x={q}
              y={axis - (phone ? 35 : 50)}
              fill="#dce2ce"
              fontSize={phone ? 26 : 20}
              textAnchor="middle"
            >
              {i + 1}
            </text>
          </g>
        ))}
        {shot.energy ? (
          <>
            {[0.07, 0.3, 0.6].map((a, i) => {
              const p = venturiPressure(a, shot),
                k = phone ? 0.018 : 0.023,
                bottom = H - 24,
                w = phone ? 25 : 40;
              return (
                <g key={i}>
                  <path
                    d={`M${x(a)} ${axis + 34}V${bottom - s.total * k - 8}`}
                    stroke="#71948f"
                    strokeDasharray="3 4"
                  />
                  <rect
                    x={x(a) - w / 2}
                    y={bottom - p.pressure * k}
                    width={w}
                    height={p.pressure * k}
                    rx="3"
                    fill="#86b4b3"
                  />
                  <rect
                    x={x(a) - w / 2}
                    y={bottom - s.total * k}
                    width={w}
                    height={p.kinetic * k}
                    rx="2"
                    fill="#e3bf7e"
                  />
                </g>
              );
            })}
          </>
        ) : (
          <>
            <path
              d={`M${x1} ${axis}V${uBottom - 9}Q${x1} ${uBottom} ${x1 + 9} ${uBottom}H${x2 - 9}Q${x2} ${uBottom} ${x2} ${uBottom - 9}V${axis}`}
              stroke="#8fa9a0"
              strokeWidth="11"
              fill="none"
            />
            <path
              d={`M${x1} ${axis}V${left}M${x2} ${axis}V${right}`}
              stroke="#a3c9c6"
              strokeWidth="6"
              fill="none"
            />
            <path
              d={`M${x1} ${left}V${uBottom - 9}Q${x1} ${uBottom} ${x1 + 9} ${uBottom}H${x2 - 9}Q${x2} ${uBottom} ${x2} ${uBottom - 9}V${right}`}
              stroke="#d4ac68"
              strokeWidth="6"
              fill="none"
            />
            <path
              d={`M${x1 - 9} ${left}H${x2 + 22}M${x2 - 9} ${right}H${x2 + 22}M${x2 + 18} ${right}V${left}`}
              stroke="#d4ac68"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="3 4"
            />
          </>
        )}
      </svg>
      <div className="venturi-legend">
        <span>{t(shot.energy ? '蓝：静压 · 金：动能密度' : '金：高密度测压液，液位差放大')}</span>
        <span>{t(s.flow === 0 ? '流体静止' : s.flow > 0 ? '流向右' : '流向左')}</span>
      </div>
      <div className="venturi-measured">
        <b>{(s.measured * 1000).toFixed(2)} L/s</b>
        <span>
          {t('压差反推的流量大小')}
          <br />
          Δp {s.difference.toFixed(0)} Pa · Δh {(s.height * 1000).toFixed(1)} mm
        </span>
      </div>
      <div className="venturi-speeds">
        <span>1 · {Math.abs(s.velocity1).toFixed(2)} m/s</span>
        <span>2 · {Math.abs(s.velocity2).toFixed(2)} m/s</span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('静压取样、比例与标定')}</summary>
          <p>
            {t(
              '水平、充满液体、准稳态一维平均流；密度1000kg/m³，忽略损耗，流出系数取1。50mm宽段静表压固定6000Pa，两孔在侧壁相同中心高度取静压，不是迎流皮托口。双液管取测压液密度13600kg/m³，仅示意密度差，不提供实物实验操作。管径竖向与液位差分别放大，流动标记慢放10倍并由体积坐标推进。参数变化比较规定稳态，反向章不模拟换向瞬态。真实仪表须按几何、雷诺数和取压位置标定；仅凭这两个静压口无法确定流向。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="venturi-controls">
          <Range
            label={t('规定的有向流量')}
            value={flow}
            min={-1}
            max={1}
            step={0.01}
            unit="L/s"
            onChange={setFlow}
          />
          <Range
            label={t('喉部直径')}
            value={throat}
            min={20}
            max={40}
            unit="mm"
            onChange={setThroat}
          />
          <Range
            label={t('稳态轨迹时间')}
            value={phase}
            min={0}
            max={2}
            step={0.01}
            unit="s"
            onChange={setPhase}
          />
          <button type="button" aria-pressed={energy} onClick={() => setEnergy(!energy)}>
            {t(energy ? '看双液差压管' : '看机械能密度')}
          </button>
        </div>
      )}
    </section>
  );
}
