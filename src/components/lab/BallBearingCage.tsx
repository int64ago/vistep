import { useId } from 'react';
import { t } from '../../i18n';
import {
  BEARING as B,
  BEARING_TAU as TAU,
  bearingPocketPoint,
  type BearingState,
} from '../../models/ball-bearing';

/** A section through the ball equator, using the same spherical pocket as the 3D cage. */
export function bearingCageSection(side: number) {
  const arc = (outside: boolean) =>
    Array.from({ length: 19 }, (_, i) => {
      const point = bearingPocketPoint(
        Math.PI / 2,
        ((55 + (70 * i) / 18) * Math.PI) / 180 + side,
        outside,
      );
      return { x: point.x, y: point.y };
    });
  return [...arc(false), ...arc(true).reverse()];
}
const sections = [0, Math.PI].map(
  (side) =>
    bearingCageSection(side)
      .map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`)
      .join(' ') + 'Z',
);

/** Only races, cage and balls: the phone chapter keeps the concave fingers large enough to follow. */
export default function BallBearingCage({ state }: { state: BearingState }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="bb-cage-section"
      viewBox="0 0 300 300"
      role="img"
      aria-label={t('保持架兜孔剖面：环带在后，兜孔随球心公转，黑点显示球身自转')}
    >
      <defs>
        <radialGradient id={`${id}-ball`} cx="30%" cy="25%">
          <stop stopColor="#eef0e7" />
          <stop offset=".55" stopColor="#99b1bc" />
          <stop offset="1" stopColor="#456474" />
        </radialGradient>
      </defs>
      <g transform="translate(150 150) scale(54 -54)">
        <circle
          r={(B.outside + B.pitch + B.ball) / 2}
          strokeWidth={B.outside - B.pitch - B.ball}
          stroke="#6b8796"
          fill="none"
        />
        <circle
          r={(B.bore + B.pitch - B.ball) / 2}
          strokeWidth={B.pitch - B.ball - B.bore}
          stroke="#89a1ab"
          fill="none"
        />
        <g transform={`rotate(${(state.innerAngle * 180) / Math.PI})`}>
          <path d={`M${B.bore + 0.08} 0h.18`} stroke="#dbe4df" strokeWidth=".045" />
        </g>
        {/* The rear band is behind the balls; the equatorial fingers sit on either side. */}
        <g
          data-cage-angle={state.cageAngle}
          transform={`rotate(${(state.cageAngle * 180) / Math.PI})`}
        >
          <circle r={B.pitch} strokeWidth=".22" stroke="#77684b" fill="none" />
          {state.balls.map((ball) => {
            const a = -Math.PI / 2 + (ball.id * TAU) / B.count;
            return (
              <g
                key={ball.id}
                data-pocket-id={ball.id}
                transform={`translate(${B.pitch * Math.cos(a)} ${B.pitch * Math.sin(a)}) rotate(${(a * 180) / Math.PI})`}
              >
                {sections.map((d, i) => (
                  <path key={i} d={d} fill="#e0bd7e" stroke="#f4dca4" strokeWidth=".009" />
                ))}
              </g>
            );
          })}
        </g>
        {state.balls.map((ball) => (
          <g key={ball.id} data-ball-id={ball.id} transform={`translate(${ball.x} ${ball.y})`}>
            <circle r={B.ball} fill={ball.id === 0 ? '#e5c589' : `url(#${id}-ball)`} />
            {ball.id === 0 && (
              <circle
                cx={B.ball * 0.76 * Math.cos(ball.spin)}
                cy={B.ball * 0.76 * Math.sin(ball.spin)}
                r=".055"
                fill="#203b47"
              />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
