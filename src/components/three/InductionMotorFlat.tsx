import { useId, useMemo } from 'react';
import { t } from '../../i18n';
import {
  motorRoundedConductor,
  motorWindingCurve,
  sampleMotorConductor,
} from './motor-conductor-geometry';
import {
  MOTOR as M,
  MOTOR_GEOMETRY as D,
  motorWindingLead,
  motorSupplyLead,
  motorTerminal,
  motorBarPoint,
  motorRingPoint,
  type MotorPoint,
  type MotorShot,
} from '../../models/induction-motor';
export default function InductionMotorFlat({ shot, narrow }: { shot: MotorShot; narrow: boolean }) {
  const id = useId().replace(/:/g, ''),
    w = narrow ? 300 : 600,
    h = narrow ? 290 : 360;
  const windings = useMemo(
    () => [0, 1, 2].map((phase) => sampleMotorConductor(motorWindingCurve(phase), 900)),
    [],
  );
  const leads = useMemo(
    () =>
      [0, 1, 2].flatMap((phase) =>
        [0, 1].map((end) => ({
          phase,
          points: sampleMotorConductor(motorRoundedConductor(motorWindingLead(phase, end)), 400),
        })),
      ),
    [],
  );
  const supplies = useMemo(
    () =>
      [0, 1, 2].map((phase) =>
        sampleMotorConductor(motorRoundedConductor(motorSupplyLead(phase)), 60),
      ),
    [],
  );
  const baseY = D.baseTop - M.axisY - D.axisLift;
  const baseCorners: MotorPoint[] = [-2.495, 2.055].flatMap((x) =>
    [baseY - 0.22, baseY].flatMap((y) => [-2.3, 2.3].map((z) => [x, y, z] as MotorPoint)),
  );
  const raw = ([x, y, z]: MotorPoint) => [x + 0.36 * z, -y + 0.18 * z];
  const boundPoints = [
    ...windings.flat(),
    ...leads.flatMap((l) => l.points),
    ...supplies.flat(),
    ...baseCorners,
    [0, 0, -2.7] as MotorPoint,
    [0, 0, 2.7] as MotorPoint,
  ].map(raw);
  const minX = Math.min(...boundPoints.map((p) => p[0])),
    maxX = Math.max(...boundPoints.map((p) => p[0]));
  const minY = Math.min(...boundPoints.map((p) => p[1])),
    maxY = Math.max(...boundPoints.map((p) => p[1]));
  const fit = Math.min((w - 28) / (maxX - minX), (h - 28) / (maxY - minY));
  const project = (p: MotorPoint) => {
    const [x, y] = raw(p);
    return [w / 2 + (x - (minX + maxX) / 2) * fit, h / 2 + (y - (minY + maxY) / 2) * fit];
  };
  const path = (points: MotorPoint[]) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${project(p).join(',')}`).join(' ');
  const ring = (r: number, z: number, a = 0, b = Math.PI * 2) =>
    Array.from(
      { length: 101 },
      (_, k) =>
        [
          r * Math.cos(a + ((b - a) * k) / 100),
          r * Math.sin(a + ((b - a) * k) / 100),
          z,
        ] as MotorPoint,
    );
  const shaft = path([
    [0, 0, -2.7],
    [0, 0, 2.7],
  ]);
  return (
    <svg
      className="indmotor-flat"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('二维剖视：闭合端环连接全部导条，磁场箭头与铜笼转角分别由模型计算')}
    >
      <defs>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 6 6"
          refX="5"
          refY="3"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0L6 3L0 6" fill="none" stroke="#a3d0c6" strokeWidth="1.4" />
        </marker>
      </defs>
      <path
        d={
          path([
            [-2.495, baseY, 2.3],
            [2.055, baseY, 2.3],
            [2.055, baseY, -2.3],
            [-2.495, baseY, -2.3],
          ]) + 'Z'
        }
        fill="#27454b"
        stroke="#496168"
      />
      {[-2.05, 2.05].map((z) => (
        <path
          key={z}
          d={path([
            [0, baseY, z],
            [0, -0.26, z],
          ])}
          stroke="#536b70"
          strokeWidth={0.56 * fit}
        />
      ))}
      {leads.map((lead, i) => (
        <path
          key={`lead-${i}`}
          d={path(lead.points)}
          stroke={['#d68a64', '#6fb0a7', '#9a97d3'][lead.phase]}
          strokeWidth="1.6"
          fill="none"
        />
      ))}
      {supplies.map((points, i) => (
        <path
          key={`supply-${i}`}
          d={path(points)}
          stroke={['#d68a64', '#6fb0a7', '#9a97d3'][i]}
          strokeWidth="1.6"
          fill="none"
        />
      ))}
      <path
        d={path([motorTerminal(0, 1), motorTerminal(1, 1), motorTerminal(2, 1)])}
        stroke="#dbb78a"
        fill="none"
        strokeWidth="2"
      />
      <path
        d={path(ring(1.5, -0.9, 0.62 * Math.PI, 2.08 * Math.PI))}
        fill="none"
        stroke="#566b71"
        strokeWidth={fit * 0.35}
      />
      <path d={shaft} stroke="#aeb9b5" strokeWidth={fit * 0.3} />
      <path d={path(ring(0.85, -0.96)) + 'Z'} fill="#5a6d73" />
      {Array.from({ length: M.bars }, (_, i) => {
        const v = shot.state.cage.bars[i];
        return (
          <path
            key={i}
            d={path([
              motorBarPoint(i, -M.ringZ, shot.state.rotorAngle),
              motorBarPoint(i, M.ringZ, shot.state.rotorAngle),
            ])}
            stroke={
              shot.showBarCurrent && Math.abs(v) > 0.1 ? (v > 0 ? '#edb786' : '#81b9c9') : '#b68e6c'
            }
            strokeWidth="3"
          />
        );
      })}
      {[-1, 1].map((sign) => (
        <path
          key={sign}
          d={path(Array.from({ length: 97 }, (_, i) => motorRingPoint(i / 96, sign * M.ringZ)))}
          fill="none"
          stroke="#dbb78a"
          strokeWidth="7"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={path(windings[i])}
          fill="none"
          stroke={['#d68a64', '#6fb0a7', '#9a97d3'][i]}
          strokeWidth="1.5"
          opacity=".7"
        />
      ))}
      <path
        d={path(ring(1.5, 0.9, 0.62 * Math.PI, 2.08 * Math.PI))}
        fill="none"
        stroke="#738487"
        strokeWidth={fit * 0.3}
        opacity=".75"
      />
      <path
        d={path([
          [0, 0, 1.35],
          [0.8 * Math.cos(shot.state.fieldAngle), 0.8 * Math.sin(shot.state.fieldAngle), 1.35],
        ])}
        stroke="#a3d0c6"
        strokeWidth="3.5"
        markerEnd={`url(#${id}-arrow)`}
      />
      <path
        d={path([
          [0, 0, 2.3],
          [0.22 * Math.cos(shot.state.rotorAngle), 0.22 * Math.sin(shot.state.rotorAngle), 2.3],
        ])}
        stroke="#efbe7f"
        strokeWidth="5"
      />
    </svg>
  );
}
