import { useId } from 'react';
import { t } from '../../i18n';
import {
  MOTOR as M,
  motorBarPoint,
  motorRingPoint,
  motorWindingPoint,
  type MotorPoint,
  type MotorShot,
} from '../../models/induction-motor';
export default function InductionMotorFlat({ shot, narrow }: { shot: MotorShot; narrow: boolean }) {
  const id = useId().replace(/:/g, ''),
    w = narrow ? 300 : 600,
    h = narrow ? 290 : 360,
    scale = narrow ? 62 : 81;
  const project = ([x, y, z]: MotorPoint) => [
    w / 2 + (x + 0.36 * z) * scale,
    h / 2 - y * scale + 0.18 * z * scale,
  ];
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
        d={path(ring(1.5, -0.9, 0.62 * Math.PI, 2.08 * Math.PI))}
        fill="none"
        stroke="#566b71"
        strokeWidth={scale * 0.35}
      />
      <path d={shaft} stroke="#aeb9b5" strokeWidth={scale * 0.3} />
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
          d={path(Array.from({ length: 721 }, (_, k) => motorWindingPoint(i, k / 720)))}
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
        strokeWidth={scale * 0.3}
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
