import { useId } from 'react';
import { t } from '../../i18n';
import { useCompact } from '../lab/useCompact';
import {
  ZIP,
  ZIP_GUIDE,
  ZIP_STOP,
  zipperTransform,
  zipperTooth,
  zipperLoad,
  zipperComparison,
  zipperSection,
  zipperHeadOutline,
  zipperIntersection,
  zipRect,
  type ZipperPose,
  type ZipPoint,
} from '../../models/zipper';
const path = (points: ZipPoint[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ') + 'Z';
const colours = ['#d6c4a3', '#b88f53'];
export function ZipperDiagram({ pose, focus }: { pose: ZipperPose; focus: string }) {
  const compact = useCompact(),
    clip = useId(),
    w = compact ? 280 : 560,
    h = 360;
  const full = focus === 'whole' && !compact,
    anatomy = focus === 'tooth';
  const scale = full ? 19 : anatomy ? (compact ? 100 : 137) : compact ? 48 : 65,
    cx = anatomy ? -0.3 : 0,
    cy = full ? 6 : anatomy ? pose.marked.root[1] : pose.slider + 0.85;
  const to = ([x, y]: ZipPoint): ZipPoint => [w / 2 + (x - cx) * scale, h / 2 - (y - cy) * scale];
  if (anatomy) return <ZipperSection />;
  return (
    <svg
      className="zipper-diagram"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('由同一齿形与织带路径生成的二维剖面')}
    >
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="34" width={w} height="292" rx="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {([-1, 1] as const).map((side) => {
          const inner = Array.from({ length: 190 }, (_, i) =>
              zipperTransform([0, 0], -1.85 + (16.3 * i) / 189, pose.slider, side),
            ),
            outer = Array.from({ length: 190 }, (_, i) =>
              zipperTransform([-ZIP.tapeWidth, 0], -1.85 + (16.3 * i) / 189, pose.slider, side),
            );
          return (
            <g key={side}>
              <path d={path([...inner, ...outer.reverse()].map(to))} fill="#506b76" />
              <path
                d={inner.map((p, i) => `${i ? 'L' : 'M'}${to(p).join(' ')}`).join(' ')}
                stroke="#b2bcb3"
                strokeWidth="3"
                fill="none"
              />
            </g>
          );
        })}
        {pose.teeth.map((tooth) => (
          <g key={tooth.id}>
            <path
              d={path(tooth.outline.map(to))}
              fill={tooth.id === 'L7' ? '#41847c' : colours[tooth.side === -1 ? 0 : 1]}
              stroke="#6d624c"
              strokeWidth=".7"
            />
            {(anatomy || focus === 'capture') && tooth.id === 'L7' && (
              <text x={to(tooth.root)[0] - 12} y={to(tooth.root)[1] - 12} textAnchor="end">
                L7
              </text>
            )}
          </g>
        ))}
        {!anatomy && (
          <g fill="#c9d2d0" stroke="#6b8589" strokeWidth="1.2">
            <path
              d={path(ZIP_GUIDE.outline.map(([x, y]) => to([x, y + pose.slider])))}
              fill="none"
              strokeWidth="6"
            />
            <path d={path(ZIP_GUIDE.diamond.map(([x, y]) => to([x, y + pose.slider])))} />
          </g>
        )}
        {([-1, 1] as const).map((side) => (
          <path
            key={side}
            d={path(ZIP_STOP.map((p) => to(zipperTransform(p, ZIP.stopS, pose.slider, side))))}
            fill="#8b9d9c"
          />
        ))}
        <path
          d={path(
            [
              [-1.1, ZIP.bottomStopY - 0.14],
              [1.1, ZIP.bottomStopY - 0.14],
              [1.1, ZIP.bottomStopY + 0.14],
              [-1.1, ZIP.bottomStopY + 0.14],
            ].map((p) => to(p as ZipPoint)),
          )}
          fill="#8b9d9c"
        />
        {anatomy && (
          <>
            <path
              d={path(
                zipperIntersection(zipperHeadOutline(), zipRect(0.93, 1.18, -0.3, 0.3)).map((p) =>
                  to(zipperTransform(p as ZipPoint, pose.marked.s, pose.slider, -1)),
                ),
              )}
              fill="#f2f4e9"
              opacity=".65"
            />
            <path
              d={path(
                [
                  [0.68, -0.24],
                  [0.8, -0.24],
                  [0.8, 0.24],
                  [0.68, 0.24],
                ].map((p) => to(zipperTransform(p as ZipPoint, pose.marked.s, pose.slider, -1))),
              )}
              fill="#225951"
            />
            <line
              x1={to([0, pose.marked.s])[0]}
              y1={to([0, pose.marked.s])[1]}
              x2={w - 16}
              y2="74"
              stroke="#647e78"
            />
            <text x={w - 12} y="59" textAnchor="end">
              {t('齿头上唇剖开')}
            </text>
          </>
        )}
      </g>
      <text x="12" y="24">
        {t(full ? '连续织带 · 半齿距交错' : anatomy ? 'L7 · 薄翼进入齿窝' : '拉头局部 · Y 形导道')}
      </text>
      <text x="12" y="349">
        {t(anatomy ? '中层留有间隙' : full ? '上方分开，下方咬合' : '同一齿持续沿织带运动')}
      </text>
    </svg>
  );
}
export function ZipperLoad({ force }: { force: number }) {
  const compact = useCompact(),
    w = compact ? 280 : 560,
    h = 360,
    scale = compact ? 83 : 116,
    s = zipperLoad(force),
    arrow = useId();
  const to = ([x, y]: ZipPoint): ZipPoint => [w / 2 + x * scale, h / 2 - y * scale];
  const marked = zipperTooth(6, -1, 8),
    near = [zipperTooth(5, 1, 8), zipperTooth(6, 1, 8)];
  return (
    <svg
      className="zipper-diagram"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('一个齿的对称横向受力示意')}
    >
      <defs>
        <marker
          id={arrow}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10" fill="#467d76" />
        </marker>
      </defs>
      <text x="12" y="25">
        {t('刚体、无摩擦、对称受力')}
      </text>
      {[marked, ...near].map((o) => (
        <path
          key={o.id}
          d={path(o.outline.map(([x, y]) => to([x, y - 6])))}
          fill={o.side === -1 ? '#73a69a' : '#d3b783'}
          stroke="#877b60"
        />
      ))}
      <text x={w / 2 - 66} y={h / 2 + 6}>
        L7
      </text>
      {[-0.25, 0.25].map((y) => {
        const q = to([0, y]);
        return (
          <g key={y}>
            <circle cx={q[0]} cy={q[1]} r="4" fill="#32695f" />
            {s.force > 0 && (
              <line
                x1={q[0]}
                y1={q[1]}
                x2={q[0] + 52 * s.reactions[0]}
                y2={q[1]}
                stroke="#467d76"
                strokeWidth="2.5"
                markerEnd={`url(#${arrow})`}
              />
            )}
          </g>
        );
      })}
      {s.force > 0 && (
        <line
          x1={to([-0.72, 0])[0]}
          y1={h / 2}
          x2={to([-0.72, 0])[0] - 52 * s.force}
          y2={h / 2}
          stroke="#467d76"
          strokeWidth="2.5"
          markerEnd={`url(#${arrow})`}
        />
      )}
      <text x="14" y="102">
        F = {s.force.toFixed(2)}
      </text>
      <text x={w - 14} y="102" textAnchor="end">
        {t('每处反力')} {s.reactions[0].toFixed(2)}
      </text>
      <text x={w / 2} y="280" textAnchor="middle">
        {t('宽肩挡住横向退路')}
      </text>
      <text x={w / 2} y="310" textAnchor="middle">
        F/2 + F/2 = F
      </text>
      <text x={w / 2} y="348" textAnchor="middle">
        {t('归一化载荷 · 不预测强度')}
      </text>
    </svg>
  );
}
export function ZipperComparison({ trial }: { trial: number }) {
  const compact = useCompact(),
    w = compact ? 280 : 560,
    h = 360,
    scale = compact ? 58 : 78,
    c = zipperComparison(trial);
  return (
    <svg
      className="zipper-diagram"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('相同横向位移尝试的齿肩几何对照')}
    >
      <text x="12" y="25">
        {t('相同横向位移尝试')} {c.requested.toFixed(2)} u
      </text>
      {[true, false].map((shoulder, i) => {
        const cx = compact ? w / 2 : w * (i ? 0.75 : 0.25),
          cy = compact ? (i ? 260 : 120) : 192,
          shift = shoulder ? c.normal : c.withoutShoulder;
        const to = ([x, y]: ZipPoint): ZipPoint => [cx + x * scale, cy - (y - 6) * scale];
        return (
          <g key={String(shoulder)}>
            <text x={cx} y={cy - 59} textAnchor="middle">
              {t(shoulder ? '宽肩：不许横移' : '削去宽肩：可横移')}
            </text>
            {([-1, 1] as const).flatMap((side) =>
              (side === -1 ? [6] : [5, 6]).map((index) => {
                const tooth = zipperTooth(index, side, 8, shoulder);
                return (
                  <path
                    key={tooth.id}
                    d={path(tooth.outline.map(([x, y]) => to([x + side * shift, y])))}
                    fill={side === -1 ? '#73a69a' : '#d3b783'}
                    stroke="#877b60"
                  />
                );
              }),
            )}
          </g>
        );
      })}
      <text x={w / 2} y="347" textAnchor="middle">
        {t('假想齿形对照，不是强度试验')}
      </text>
    </svg>
  );
}

export function ZipperSection() {
  const compact = useCompact(),
    w = compact ? 280 : 370,
    h = 360,
    s = zipperSection(),
    to = ([x, y]: ZipPoint): ZipPoint => [w / 2 + x * 80, 108 - (y - 6) * 80],
    section = ([x, z]: ZipPoint): ZipPoint => [w / 2 + (x - 0.1) * 470, 270 - z * 470];
  return (
    <svg
      className="zipper-diagram"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('穿过实际薄翼的厚度截面')}
    >
      <text x="12" y="24">
        {t('L7 · 上唇剖开')}
      </text>
      {[zipperTooth(6, -1, 8), zipperTooth(5, 1, 8), zipperTooth(6, 1, 8)].map((tooth) => (
        <path
          key={tooth.id}
          d={path(tooth.outline.map(to))}
          fill={tooth.side === -1 ? '#73a69a' : '#d3b783'}
          stroke="#8a7c61"
        />
      ))}
      <line
        x1={to([-0.05, 6 + s.y])[0] - 23}
        y1={to([0, 6 + s.y])[1]}
        x2={to([0.25, 6 + s.y])[0] + 23}
        y2={to([0, 6 + s.y])[1]}
        stroke="#aa5d44"
        strokeDasharray="3 3"
        strokeWidth="2"
      />
      <text x={w - 16} y="184" textAnchor="end">
        {t('沿虚线看厚度')}
      </text>
      {[s.lower, s.web].map((poly, i) => (
        <path key={i} d={path(poly.map(section))} fill="#579388" stroke="#326b61" />
      ))}
      <path
        d={path(s.upper.map(section))}
        fill="#73a69a"
        fillOpacity=".10"
        stroke="#579388"
        strokeDasharray="4 3"
      />
      <path d={path(s.oppositeWing.map(section))} fill="#d3b783" stroke="#9b793e" />
      <text x="12" y="257">
        {t('齿窝')}
      </text>
      <text x={w - 12} y="297" textAnchor="end">
        {t('薄翼')}
      </text>
      <text x={w / 2} y="349" textAnchor="middle">
        {t('每侧间隙')} {s.clearance.toFixed(3)} u
      </text>
    </svg>
  );
}
