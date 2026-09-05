import { useId } from 'react';
import { t } from '../../i18n';
import {
  GENERATOR as G,
  generatorConductorPoint,
  generatorRotorLeads,
  generatorContacts,
  generatorExternalCircuit,
  rotateGeneratorPoint,
  type GeneratorPoint,
  type GeneratorShot,
} from '../../models/electric-generator';
export default function ElectricGeneratorFlat({
  shot,
  narrow,
}: {
  shot: GeneratorShot;
  narrow: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    w = narrow ? 330 : 650,
    h = narrow ? 340 : 330,
    scale = narrow ? 42 : 58;
  const project = ([x, y, z]: GeneratorPoint) =>
    narrow
      ? [w / 2 + (x - 0.2 * z) * scale, 112 - y * scale + z * 29]
      : [226 + (x + 0.65 * z) * scale, 140 - y * scale + z * 19];
  const path = (points: GeneratorPoint[], rotating = false) =>
    points
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${project(rotating ? rotateGeneratorPoint(p, shot.state.theta) : p).join(',')}`,
      )
      .join(' ');
  const circuit = generatorExternalCircuit(narrow);
  return (
    <svg
      className="generator-flat"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('发电机二维轴测图：旋转铜环、完整滑环与固定电刷保持连接')}
    >
      <defs>
        <marker id={`${id}-field`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6" fill="none" stroke="#8fb8c4" strokeWidth="1.2" />
        </marker>
      </defs>
      {[-1, 1].map((sign) => {
        const [x, y] = project([sign * 1.87, 0, 0]);
        return (
          <g key={sign}>
            <path
              d={
                path([
                  [sign * 1.87, -1.3, -1.8],
                  [sign * 1.87, 1.3, -1.8],
                  [sign * 1.87, 1.3, 1.9],
                  [sign * 1.87, -1.3, 1.9],
                ]) + 'Z'
              }
              fill={sign < 0 ? '#a96f64' : '#6395af'}
              opacity=".42"
            />
            <text x={x} y={y - 35} textAnchor="middle" fill="#f1e5cf" fontSize="22">
              {sign < 0 ? 'N' : 'S'}
            </text>
          </g>
        );
      })}
      {[-0.65, 0, 0.65].map((y) => (
        <path
          key={y}
          d={path([
            [-1.45, y, -0.2],
            [1.45, y, -0.2],
          ])}
          stroke="#8fb8c4"
          strokeWidth="1.7"
          markerEnd={`url(#${id}-field)`}
          opacity={shot.input.field ? '.8' : '0'}
        />
      ))}
      <path
        d={path([
          [0, 0, 0],
          [0, 0, 5.1],
        ])}
        stroke="#bac7c8"
        strokeWidth="5"
      />
      <path
        d={path(
          Array.from({ length: 321 }, (_, i) => generatorConductorPoint(i / 320)),
          true,
        )}
        fill={shot.showArea ? '#e9b57c33' : 'none'}
        stroke="#e9b57c"
        strokeWidth="3.3"
        strokeLinejoin="round"
      />
      {generatorRotorLeads().map((points, i) => (
        <path key={i} d={path(points, true)} stroke="#e9b57c" strokeWidth="2.2" fill="none" />
      ))}
      {shot.showForces &&
        Math.abs(shot.state.current) > 1e-5 &&
        [-1, 1].map((side) => {
          const p = rotateGeneratorPoint([0, side * G.halfWidth, 0], shot.state.theta);
          const direction = side * Math.sign(shot.state.current * shot.input.field);
          return (
            <path
              key={side}
              d={path([p, [p[0], p[1] + direction * 0.5, p[2]]])}
              stroke="#f0bd85"
              strokeWidth="3"
              markerEnd={`url(#${id}-field)`}
            />
          );
        })}
      {G.ringZ.map((z, i) => (
        <g key={z}>
          <path
            d={path(
              Array.from(
                { length: 65 },
                (_, k) =>
                  [
                    G.ringRadius * Math.cos((k / 64) * 2 * Math.PI),
                    G.ringRadius * Math.sin((k / 64) * 2 * Math.PI),
                    z,
                  ] as GeneratorPoint,
              ),
            )}
            fill="none"
            stroke="#cbbb8c"
            strokeWidth="5"
          />
          <path
            d={path([generatorContacts()[i].touch, generatorContacts()[i].lead])}
            stroke="#b1c3ca"
            strokeWidth="7"
          />
        </g>
      ))}
      <path d={path(circuit.feed)} fill="none" stroke="#d9a46c" strokeWidth="2.5" />
      <path d={path(circuit.return)} fill="none" stroke="#d9a46c" strokeWidth="2.5" />
      <path
        d={path([
          circuit.switchBottom,
          shot.input.connected
            ? circuit.switchTop
            : [circuit.switchTop[0] + 0.3, circuit.switchTop[1] - 0.12, circuit.switchTop[2]],
        ])}
        stroke="#cbbb8c"
        strokeWidth="2.5"
      />
      <path
        d={path([
          [circuit.loadPosition[0], circuit.loadPosition[1] - 0.42, circuit.loadPosition[2]],
          [circuit.loadPosition[0], circuit.loadPosition[1] + 0.42, circuit.loadPosition[2]],
        ])}
        stroke="#e0d8bb"
        strokeWidth="12"
      />
      <path
        d={path(
          [
            [0, 0, 5.1],
            [0, 1, 5.1],
            [0, 1, 5.6],
          ],
          true,
        )}
        stroke="#9fb3bd"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
