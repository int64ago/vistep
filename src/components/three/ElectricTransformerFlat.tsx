import { useId } from 'react';
import { t } from '../../i18n';
import {
  ELECTRIC_TRANSFORMER as C,
  electricCircuitGeometry,
  electricFluxPoint,
  electricWindingPoint,
  type ElectricPoint,
  type ElectricShot,
} from '../../models/transformer-electric';

/** Front section: the same conductor paths and open/closed switch as the 3D view. */
export default function ElectricTransformerFlat({
  shot,
  narrow,
}: {
  shot: ElectricShot;
  narrow: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    g = C.geometry;
  const scale = narrow ? 47 : 57,
    width = narrow ? 300 : 500,
    height = narrow ? 360 : 300;
  const xy = ([x, y]: ElectricPoint) => [width / 2 + x * scale, (narrow ? 232 : 267) - y * scale];
  const path = (points: ElectricPoint[]) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${xy(p).join(',')}`).join(' ');
  const flux = Array.from({ length: 161 }, (_, i) => electricFluxPoint(i / 160));
  const zero = shot.instant.flux < 0;
  return (
    <svg
      className="electric-transformer-flat"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('变压器二维剖面：两条铜线互不相接，同一个闭合磁通穿过它们')}
    >
      <defs>
        <marker
          id={`${id}-arrow`}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto-start-reverse"
        >
          <path d="M0 0L6 3L0 6" fill="none" stroke="#328b7a" strokeWidth="1.5" />
        </marker>
      </defs>
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={path([
            [-g.limbX, g.bottom + g.limb / 2, 0],
            [-g.limbX, g.top - g.limb / 2, 0],
            [g.limbX, g.top - g.limb / 2, 0],
            [g.limbX, g.bottom + g.limb / 2, 0],
            [-g.limbX, g.bottom + g.limb / 2, 0],
          ])}
          fill="none"
          stroke={i % 2 ? '#687773' : '#81908b'}
          strokeWidth={g.limb * scale - i * 2}
        />
      ))}
      <path
        d={path(flux)}
        fill="none"
        stroke="#3b8c80"
        strokeWidth="2.5"
        opacity={0.15 + Math.min(0.8, Math.abs(shot.instant.b))}
      />
      {Math.abs(shot.instant.b) > 0.015 &&
        [0.1, 0.32, 0.59, 0.82].map((f) => (
          <path
            key={f}
            d={path([
              electricFluxPoint(f + (zero ? 0.016 : -0.016)),
              electricFluxPoint(f + (zero ? -0.016 : 0.016)),
            ])}
            stroke="#328b7a"
            strokeWidth="2.5"
            markerEnd={`url(#${id}-arrow)`}
          />
        ))}
      {(['primary', 'secondary'] as const).map((side) => {
        const turns = side === 'primary' ? C.primaryTurns : shot.input.secondaryTurns;
        const points = Array.from({ length: turns * 48 + 1 }, (_, i) =>
          electricWindingPoint(side, turns, i / (turns * 48)),
        );
        return (
          <g key={side} opacity={side === 'secondary' ? shot.coilOpacity : 1}>
            <path
              d={path(points)}
              fill="none"
              stroke="#b87649"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {[0, 1].map((p) => {
              const [x, y] = xy(electricWindingPoint(side, turns, p));
              return (
                <circle key={p} cx={x} cy={y} r={p ? 3.3 : 2.3} fill={p ? '#273f37' : '#b87649'} />
              );
            })}
          </g>
        );
      })}
      {electricCircuitGeometry(narrow).map((circuit) => {
        const { x, y, z, side } = circuit,
          [cx, cy] = xy([x, y, z]);
        return (
          <g key={side} strokeLinecap="round" strokeLinejoin="round">
            <path d={path(circuit.upper)} fill="none" stroke="#b87649" strokeWidth="2.5" />
            <path d={path(circuit.lower)} fill="none" stroke="#b87649" strokeWidth="2.5" />
            <path
              d={path([
                circuit.switchBottom,
                side === 'primary' || (shot.input.connected && !shot.dc)
                  ? circuit.switchTop
                  : [x + 0.27, y + 0.78, z],
              ])}
              stroke="#8a7754"
              strokeWidth="2.5"
            />
            {side === 'primary' ? (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={0.44 * scale}
                  stroke="#9b8f77"
                  strokeWidth="2"
                  fill="#eee6d7"
                />
                {shot.dc ? (
                  <path
                    d={`M${cx - 10} ${cy - 4}h20M${cx - 6} ${cy + 4}h12`}
                    stroke="#44685f"
                    strokeWidth="2"
                  />
                ) : (
                  <path
                    d={`M${cx - 13} ${cy}q6 -15 13 0t13 0`}
                    fill="none"
                    stroke="#44685f"
                    strokeWidth="2"
                  />
                )}
              </>
            ) : (
              <rect
                x={cx - 0.18 * scale}
                y={cy - 0.44 * scale}
                width={0.36 * scale}
                height={0.88 * scale}
                rx="5"
                fill="#e2d0ab"
                stroke="#9b8f77"
                strokeWidth="2"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
