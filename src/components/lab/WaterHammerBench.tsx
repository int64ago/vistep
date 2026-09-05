import { useId, useLayoutEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  hammerTrace,
  type HammerRun,
  type HammerSample,
  type HammerShot,
} from '../../models/water-hammer';

function useBenchWidth(initialWidth: number) {
  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(initialWidth);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([e]) => {
      if (e.contentRect.width > 0) setWidth(e.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
const blend = (a: number, b: number, f: number) => Math.round(a + (b - a) * f);
function pressureColor(ratio: number) {
  const a = [99, 132, 141],
    b = ratio >= 0 ? [219, 157, 100] : [103, 176, 194],
    f = Math.min(1, Math.abs(ratio));
  return `rgb(${a.map((v, i) => blend(v, b[i], f)).join(',')})`;
}
function Gate({
  x,
  y,
  vertical,
  opening,
}: {
  x: number;
  y: number;
  vertical: boolean;
  opening: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${vertical ? 90 : 0})`}>
      <path d="M-15,-37h32v74h-32Z" fill="#253844" stroke="#768892" strokeWidth="1.5" />
      <path d="M-14,-26H16V26H-14Z" fill="#7d9ca4" stroke="#a4b7b8" />
      <path d="M-12,-84h24v48h-24Z" fill="#40545e" stroke="#859993" />
      <path d={`M-7,${-78 + 52 * (1 - opening)}h14v52h-14Z`} fill="#c8bda1" stroke="#e1d8c2" />
      <path
        d={`M0,${-78 + 52 * (1 - opening)}V-97M-19,-97H19`}
        stroke="#c9b17c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M-22,-34v68M23,-34v68" stroke="#a6b5b1" strokeWidth="4" />
      {[-27, 27].map((d) => (
        <g key={d} fill="#8d9da0">
          <circle cx="-22" cy={d} r="3" />
          <circle cx="23" cy={d} r="3" />
        </g>
      ))}
    </g>
  );
}
export default function WaterHammerBench({
  shot,
  initialWidth = 880,
}: {
  shot: HammerShot;
  initialWidth?: number;
}) {
  const { ref, width } = useBenchWidth(initialWidth),
    id = useId().replace(/:/g, '');
  const s = shot.state,
    p = s.parameters,
    phone = width < 620,
    height = phone ? 290 : 360;
  const start = phone ? 76 : 154,
    end = phone ? 184 : width - 126,
    axis = phone ? width * 0.47 : 182;
  const point = (ratio: number) =>
    phone
      ? { x: axis, y: start + (end - start) * ratio }
      : { x: start + (end - start) * ratio, y: axis };
  const curve = (sign: number) =>
    Array.from({ length: p.cells + 1 }, (_, i) => {
      const q = point(i / p.cells),
        r = 25 * (1 + (500 * (s.pressure[i] - p.pressure) * p.wallCompliance) / 2);
      return `${i ? 'L' : 'M'}${phone ? q.x + sign * r : q.x},${phone ? q.y : q.y + sign * r}`;
    }).join(' ');
  const tap = point(s.probeIndex / p.cells),
    minIndex = s.pressure.indexOf(s.minPressure),
    minPoint = point(minIndex / p.cells);
  return (
    <div ref={ref} className="water-hammer-bench">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('恒压水库连接弹性管与末端阀门，压力颜色和流速箭头来自同一个特征线模型。')}
      >
        <defs>
          <linearGradient
            id={`${id}-metal`}
            x1="0"
            y1="0"
            x2={phone ? '1' : '0'}
            y2={phone ? '0' : '1'}
          >
            <stop stopColor="#7a8e96" />
            <stop offset=".2" stopColor="#c4cfc9" stopOpacity=".75" />
            <stop offset=".5" stopColor="#3d5968" />
            <stop offset="1" stopColor="#9da9a6" />
          </linearGradient>
        </defs>
        {phone ? (
          <>
            <path
              d={`M${axis - 58},8h116v68h-116Z`}
              fill="#2c4450"
              stroke="#8ea4a7"
              strokeWidth="1.4"
            />
            <path d={`M${axis - 55},37h110v36h-110Z`} fill="#547a86" />
            <path d={`M${axis - 58},8h116m-116,7h116`} stroke="#b7c5bf" strokeWidth="3" />
            <text x={axis} y={32} textAnchor="middle">
              {t('恒压上游')}
            </text>
            <text x={axis} y={62} textAnchor="middle">
              {(p.pressure / 1e6).toFixed(2)} MPa
            </text>
          </>
        ) : (
          <>
            <path d={`M30,91h124v180H30Z`} fill="#2c4450" stroke="#8ea4a7" strokeWidth="1.4" />
            <path d={`M34,147h116v120H34Z`} fill="#547a86" />
            <path d="M30 91h124m-124 8h124" stroke="#b7c5bf" strokeWidth="4" />
            <text x="92" y="124" textAnchor="middle">
              {t('恒压上游')}
            </text>
            <text x="92" y="295" textAnchor="middle">
              {(p.pressure / 1e6).toFixed(2)} MPa
            </text>
          </>
        )}
        <path
          d={phone ? `M${axis},${start}V${end + 55}` : `M${start},${axis}H${end + 82}`}
          stroke={`url(#${id}-metal)`}
          strokeWidth="60"
          fill="none"
        />
        <path
          d={phone ? `M${axis},${start}V${end + 55}` : `M${start},${axis}H${end + 82}`}
          stroke="#335261"
          strokeWidth="44"
          fill="none"
        />
        {Array.from({ length: p.cells }, (_, i) => {
          const a = point(i / p.cells),
            b = point((i + 1) / p.cells),
            ratio =
              ((s.pressure[i] + s.pressure[i + 1]) / 2 - p.pressure) / Math.max(1, p.joukowsky);
          return (
            <path
              key={i}
              d={`M${a.x},${a.y}L${b.x},${b.y}`}
              stroke={pressureColor(ratio)}
              strokeWidth="43"
              shapeRendering="crispEdges"
            />
          );
        })}
        <path d={curve(-1)} stroke="#d7dfd5" strokeOpacity=".75" strokeWidth="2" fill="none" />
        <path d={curve(1)} stroke="#b5c7c4" strokeWidth="2" fill="none" />
        {Array.from({ length: 9 }, (_, j) => {
          const i = Math.round(((j + 0.5) / 9) * p.cells),
            v = s.velocity[i];
          if (Math.abs(v) < 0.02) return null;
          const delta = (s.displacement[i] / p.length) * 0.8,
            q = point(Math.max(0.035, Math.min(0.965, i / p.cells + delta))),
            size = Math.min(14, 5 + Math.abs(v) * 8),
            sign = Math.sign(v);
          return (
            <g
              key={j}
              transform={`translate(${q.x},${q.y}) rotate(${phone ? 90 : 0})`}
              fill="none"
              stroke="#eff3e3"
              strokeWidth="1.6"
              opacity=".86"
            >
              <path
                d={`M${(-sign * size) / 2},0H${(sign * size) / 2}m${-sign * 4},-4l${sign * 4},4 ${-sign * 4},4`}
              />
            </g>
          );
        })}
        <Gate x={point(1).x} y={point(1).y} vertical={phone} opening={s.opening} />
        {phone ? (
          <>
            <text x={axis} y="262" textAnchor="middle">
              {t('末端阀门')} · {(s.opening * 100).toFixed(0)}%
            </text>
            <text x={width - 10} y="284" textAnchor="end">
              {t('下游')} {(p.downstream / 1e6).toFixed(3)} MPa
            </text>
            <path d={`M35,${start}V${end}m-4,0h8M31,${start}h8`} stroke="#5e7a87" />
            <text
              x="25"
              y={(start + end) / 2}
              transform={`rotate(-90 25 ${(start + end) / 2})`}
              textAnchor="middle"
            >
              x · {p.length} m
            </text>
            <circle cx={tap.x} cy={tap.y} r="5" fill="#f2d99d" />
            <path d={`M${tap.x + 6},${tap.y}H${width - 18}`} stroke="#d4c898" />
            <text x={width - 8} y={tap.y - 12} textAnchor="end">
              {t('测点')} {Math.round(shot.probe * p.length)} m
            </text>
          </>
        ) : (
          <>
            <path d={`M${start},238H${end}m0,-4v8M${start},234v8`} stroke="#5e7a87" />
            <text x={(start + end) / 2} y="264" textAnchor="middle">
              x · {p.length} m
            </text>
            <text x={end} y="307" textAnchor="middle">
              {t('末端阀门')} · {(s.opening * 100).toFixed(0)}%
            </text>
            <text x={width - 8} y="338" textAnchor="end">
              {t('下游')} {(p.downstream / 1e6).toFixed(3)} MPa
            </text>
            <circle cx={tap.x} cy={tap.y} r="5" fill="#f2d99d" />
            <path d={`M${tap.x},${tap.y - 6}v-42`} stroke="#d4c898" />
            <text x={tap.x} y={tap.y - 61} textAnchor="middle">
              {t('测点')} {Math.round(shot.probe * p.length)} m
            </text>
          </>
        )}
        {s.failure && (
          <g>
            <circle
              cx={minPoint.x}
              cy={minPoint.y}
              r="17"
              fill="#192c36"
              stroke="#e8c77f"
              strokeWidth="2"
            />
            <path
              d={`M${minPoint.x},${minPoint.y - 8}v10m0,4v1`}
              stroke="#e8c77f"
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>
      <div className="water-hammer-scale">
        <span>
          <i style={{ background: pressureColor(-1) }} />
          {t('压力降低')}
        </span>
        <span>
          <i style={{ background: pressureColor(0) }} />
          {t('初始压力')}
        </span>
        <span>
          <i style={{ background: pressureColor(1) }} />
          {t('压力升高')}
        </span>
      </div>
      {phone && <p className="water-hammer-orientation">{t('竖排距离轴 · 水平管模型')}</p>}
    </div>
  );
}

export function WaterHammerElastic({
  state: s,
  initialWidth = 880,
}: {
  state: HammerSample;
  initialWidth?: number;
}) {
  const { ref, width } = useBenchWidth(initialWidth),
    phone = width < 620,
    p = s.parameters;
  const magnification = 800,
    wall = 1 + s.hoopStrain * magnification;
  const contraction = 1 / (1 + s.densityStrain * magnification),
    radius = (phone ? 44 : 76) * wall;
  const centerX = phone ? width / 2 : width * 0.7,
    // 16px Manrope/Noto glyph bounds: leave ~8px between the two phone instruments.
    centerY = phone ? 213 : 156;
  const waterWidth = (phone ? 150 : 230) * contraction,
    waterX = phone ? (width - waterWidth) / 2 : width * 0.25 - waterWidth / 2;
  const waterY = phone ? 42 : 112,
    blockHeight = phone ? 40 : 92;
  const e = s.energy,
    denom = p.initialEnergy || 1;
  return (
    <div ref={ref} className="water-hammer-elastic">
      <div className="water-hammer-local-title">
        <span>{t('测点局部回放')}</span>
        <span>{t('形变放大')} ×800</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${phone ? 306 : 285}`}
        role="img"
        aria-label={t('同一压力增量让水微微压缩、管壁微微扩张；形变放大八百倍。')}
      >
        <g>
          <path
            d={`M${phone ? width / 2 - 75 : width * 0.25 - 115},${waterY}h${phone ? 150 : 230}v${blockHeight}h${phone ? -150 : -230}Z`}
            fill="none"
            stroke="#79929b"
            strokeDasharray="4 5"
          />
          <rect
            x={waterX}
            y={waterY}
            width={waterWidth}
            height={blockHeight}
            rx="7"
            fill="#ba9368"
            fillOpacity=".8"
            stroke="#e5c993"
          />
          {Array.from({ length: 24 }, (_, i) => (
            <circle
              key={i}
              cx={waterX + waterWidth * (0.08 + ((i % 8) / 7) * 0.84)}
              cy={waterY + blockHeight * (0.22 + Math.floor(i / 8) * 0.28)}
              r="2.3"
              fill="#f5e4b9"
            />
          ))}
          <text x={phone ? width / 2 : width * 0.25} y={waterY - 27} textAnchor="middle">
            {t('同一份水，体积缩小')}
          </text>
          <text
            x={phone ? width / 2 : width * 0.25}
            y={waterY + blockHeight + (phone ? 28 : 34)}
            textAnchor="middle"
          >
            Δρ/ρ · {(s.densityStrain * 100).toFixed(4)}%
          </text>
        </g>
        <g>
          <circle
            cx={centerX}
            cy={centerY}
            r={phone ? 44 : 76}
            fill="none"
            stroke="#a2b1b6"
            strokeDasharray="4 5"
          />
          <circle cx={centerX} cy={centerY} r={radius + 9} fill="#67818d" stroke="#acbec0" />
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="#314d5d"
            stroke="#e4c087"
            strokeWidth="2"
          />
          <path
            d={`M${centerX - radius + 6},${centerY}H${centerX + radius - 6}m-6,-4l6,4 -6,4M${centerX - radius + 12},${centerY - 4}l-6,4 6,4`}
            fill="none"
            stroke="#dcca9a"
          />
          <text x={centerX} y={centerY - radius - 32} textAnchor="middle">
            {t('同一管壁，管径增大')}
          </text>
          <text x={centerX} y={centerY + radius + (phone ? 30 : 38)} textAnchor="middle">
            ΔD/D · {(s.hoopStrain * 100).toFixed(4)}%
          </text>
        </g>
      </svg>
      <div className="water-hammer-energy">
        <div>
          <i style={{ width: `${(e.kinetic / denom) * 100}%` }} />
          <i style={{ width: `${(e.fluid / denom) * 100}%` }} />
          <i style={{ width: `${(e.wall / denom) * 100}%` }} />
        </div>
        <p>
          <span>
            {t('流动动能')} {e.kinetic.toFixed(0)} J
          </span>
          <span>
            {t('水的弹性能')} {e.fluid.toFixed(0)} J
          </span>
          <span>
            {t('管壁弹性能')} {e.wall.toFixed(0)} J
          </span>
        </p>
      </div>
    </div>
  );
}

export function WaterHammerComparison({
  shot,
  initialWidth = 880,
}: {
  shot: HammerShot;
  initialWidth?: number;
}) {
  const { ref, width } = useBenchWidth(initialWidth),
    phone = width < 620,
    a = shot.reference!,
    b = shot.state;
  const samples = [a, b],
    closing = shot.view === 'closure',
    names = closing ? ['快速关闭', '缓慢关闭'] : ['较硬管壁', '较软管壁'];
  return (
    <div ref={ref} className="water-hammer-comparison">
      <div className="water-hammer-pair-labels">
        {samples.map((s, j) => (
          <div key={j}>
            <b>{t(names[j])}</b>
            <span>
              {shot.view === 'closure'
                ? `T꜀ = ${s.parameters.closure.toFixed(2)} s`
                : `E = ${(s.parameters.young / 1e9).toFixed(0)} GPa`}
            </span>
            <span>Δp {(s.valveRise / 1e6).toFixed(3)} MPa</span>
            {shot.view === 'material' && (
              <span>
                {t('首波幅度')} {(s.parameters.joukowsky / 1e6).toFixed(3)} MPa
              </span>
            )}
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${phone ? (closing ? 174 : 268) : closing ? 150 : 220}`}
        role="img"
        aria-label={t('两次对照使用相同的初始流速、长度和管径，在同一物理时间观察。')}
      >
        {samples.map((s, j) => {
          const start = phone ? 32 : 52,
            end = phone ? (closing ? 106 : 200) : width - 52,
            axis = phone ? width * (j === 0 ? 0.28 : 0.72) : closing ? 38 + j * 60 : 61 + j * 108;
          const pos = (f: number) =>
            phone
              ? { x: axis, y: start + (end - start) * f }
              : { x: start + (end - start) * f, y: axis };
          const first = pos(0),
            last = pos(1),
            p = s.parameters;
          return (
            <g key={j}>
              <path
                d={`M${first.x},${first.y}L${last.x},${last.y}`}
                stroke="#90a5aa"
                strokeWidth="31"
              />
              {Array.from({ length: p.cells }, (_, i) => {
                const q = pos(i / p.cells),
                  r = pos((i + 1) / p.cells);
                return (
                  <path
                    key={i}
                    d={`M${q.x},${q.y}L${r.x},${r.y}`}
                    stroke={pressureColor((s.pressure[i] - p.pressure) / a.parameters.joukowsky)}
                    strokeWidth="25"
                    shapeRendering="crispEdges"
                  />
                );
              })}
              <rect
                x={first.x - 21}
                y={first.y - 15}
                width="42"
                height="30"
                rx="6"
                fill="#425e6a"
                stroke="#a4b3b3"
              />
              <text x={first.x} y={first.y + 5} textAnchor="middle">
                p₀
              </text>
              <g transform={`translate(${last.x} ${last.y}) rotate(${phone ? 90 : 0})`}>
                <path d="M-9,-21h18v42h-18Z" fill="#b7a27c" />
                <path d={`M-8,${-14 + 28 * (1 - s.opening)}h16V14H-8Z`} fill="#4a7889" />
              </g>
              <text
                x={phone ? axis : (start + end) / 2}
                y={phone ? (closing ? 137 : 231) : axis + 40}
                textAnchor="middle"
              >
                {phone ? '2L/a' : t('往返')} {!phone && `${p.roundTrip.toFixed(3)} s`}
              </text>
              {phone && (
                <text x={axis} y={closing ? 163 : 257} textAnchor="middle">
                  {p.roundTrip.toFixed(3)} s
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function WaterHammerHistory({
  run,
  referenceRun,
  time,
  span,
  initialWidth = 880,
}: {
  run: HammerRun;
  referenceRun?: HammerRun | null;
  time: number;
  span: number;
  initialWidth?: number;
}) {
  const { ref, width } = useBenchWidth(initialWidth),
    left = width < 620 ? 16 : 28,
    right = width - 24,
    top = 24,
    bottom = width < 620 ? 112 : 164;
  const p = referenceRun?.parameters ?? run.parameters,
    reference = p.joukowsky || 1,
    mid = (top + bottom) / 2,
    amplitude = width < 620 ? 38 : 58;
  const path = (r: HammerRun) =>
    hammerTrace(r, time, 240)
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${left + (right - left) * Math.min(1, v.time / span)},${mid - ((v.pressure - r.parameters.pressure) / reference) * amplitude}`,
      )
      .join(' ');
  return (
    <div ref={ref} className="water-hammer-history">
      <div>
        <span>{t('阀前压力的时间记录')}</span>
        <span>{t('相对初始值')} · MPa</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${width < 620 ? 160 : 206}`}
        role="img"
        aria-label={t('横轴为物理时间，纵轴为阀前压力增量；曲线只显示已经算到的时刻。')}
      >
        {[mid - amplitude, mid, mid + amplitude].map((y, i) => (
          <path
            key={i}
            d={`M${left},${y}H${right}`}
            stroke="#66808d"
            strokeOpacity={i === 1 ? 0.75 : 0.32}
            strokeDasharray={i === 1 ? '' : '3 5'}
          />
        ))}
        <text x={left + 3} y={top - 3}>
          +ρaU₀
        </text>
        <text x={left + 3} y={bottom + 18}>
          −ρaU₀
        </text>
        <path
          d={referenceRun ? path(referenceRun) : ''}
          fill="none"
          stroke="#b8bec5"
          strokeWidth="1.6"
        />
        <path d={path(run)} fill="none" stroke="#e1b176" strokeWidth="2.4" />
        {[
          0,
          span > p.roundTrip * 1.3 && span < p.roundTrip * 2.6 ? p.roundTrip : span / 2,
          span,
        ].map((at, i) => {
          const x = left + ((right - left) * at) / span;
          return (
            <g key={i}>
              <path d={`M${x},${top}V${bottom}`} stroke="#66808d" opacity=".25" />
              <text
                x={x}
                y={width < 620 ? 154 : 200}
                textAnchor={i === 0 ? 'start' : at === span ? 'end' : 'middle'}
              >
                {at.toFixed(2)} s
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
