import { t } from '../../i18n';
import {
  WIRELESS as W,
  wirelessCoilPoint,
  wirelessWires,
  wirelessPorts,
  wirelessReceiverOffset,
  wirelessFluxPoint,
  type WCPoint,
  type WirelessShot,
} from '../../models/wireless-charging';
export default function WirelessChargingFlat({
  shot,
  narrow,
}: {
  shot: WirelessShot;
  narrow: boolean;
}) {
  const w = narrow ? 300 : 680,
    h = narrow ? 330 : 370,
    scale = narrow ? 3900 : 5000;
  const project = ([x, y, z]: WCPoint) => [
    w * (narrow ? 0.51 : 0.4) + (x + 0.2 * z) * scale,
    h * 0.62 - y * scale * 0.85 + z * scale * 0.4,
  ];
  const path = (points: WCPoint[], shift: WCPoint = [0, 0, 0]) =>
    points
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${project([p[0] + shift[0], p[1] + shift[1], p[2] + shift[2]]).join(',')}`,
      )
      .join(' ');
  const circle = (r: number, y: number) =>
    Array.from(
      { length: 97 },
      (_, i) => [r * Math.cos((i * Math.PI) / 48), y, r * Math.sin((i * Math.PI) / 48)] as WCPoint,
    );
  return (
    <svg
      className="wireless-flat"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('二维剖视保留八匝连续绕组、绝缘跨线、电容、开关与接收负载')}
    >
      {[false, true].map((receiver) => {
        const shift = receiver
            ? wirelessReceiverOffset(shot.input, narrow)
            : ([0, 0, 0] as WCPoint),
          wire = wirelessWires(receiver),
          color = receiver ? '#c18b56' : '#a77445';
        return (
          <g key={String(receiver)}>
            {shot.input.ferrite && (
              <path
                d={path(circle(0.0234, receiver ? 0.003 : -0.003), shift) + 'Z'}
                fill="#59636b"
                opacity={receiver ? 0.2 : 0.85}
              />
            )}
            <path
              d={path(circle(0.0245, -0.0042), shift)}
              fill="none"
              stroke="#b4c8bd"
              strokeWidth="2"
            />
            <path d={path(wire.inner, shift)} fill="none" stroke="#f8f0de" strokeWidth="5" />
            <path d={path(wire.inner, shift)} fill="none" stroke={color} strokeWidth="2" />
            <path
              d={path(
                Array.from({ length: 1025 }, (_, i) => wirelessCoilPoint(i / 1024)),
                shift,
              )}
              fill="none"
              stroke={color}
              strokeWidth="2.2"
            />
            <path d={path(wire.outer, shift)} fill="none" stroke={color} strokeWidth="2" />
            <path
              d={path([wirelessPorts.capLeft, wirelessPorts.capRight], shift)}
              stroke="#687d8e"
              strokeWidth="7"
            />
            <path
              d={path([wirelessPorts.deviceLeft, wirelessPorts.deviceRight], shift)}
              stroke={receiver ? '#b79d74' : '#2f5067'}
              strokeWidth="11"
            />
            <path
              d={path(
                [
                  wirelessPorts.capRight,
                  receiver && !shot.input.connected
                    ? [-0.0042, 0.0032, 0.029]
                    : wirelessPorts.deviceLeft,
                ],
                shift,
              )}
              fill="none"
              stroke={color}
              strokeWidth="2.3"
            />
            <circle
              cx={project([W.innerRadius + shift[0], shift[1], shift[2]])[0]}
              cy={project([W.innerRadius + shift[0], shift[1], shift[2]])[1]}
              r="3.3"
              fill="#314d62"
            />
          </g>
        );
      })}
      {shot.showFlux &&
        [-Math.PI / 2, Math.PI / 2].map((a) => (
          <path
            key={a}
            d={path(
              Array.from({ length: 193 }, (_, i) =>
                wirelessFluxPoint(shot.input, a, i / 192, narrow),
              ),
            )}
            fill="none"
            stroke={shot.state.instantFlux >= 0 ? '#377e95' : '#9b7959'}
            strokeWidth="1.6"
            strokeDasharray="5 5"
            opacity={Math.min(0.85, Math.abs(shot.state.instantFlux) * 3e5)}
          />
        ))}
    </svg>
  );
}
