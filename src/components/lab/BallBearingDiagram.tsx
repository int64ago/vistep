import { useId } from 'react';
import { t } from '../../i18n';
import { BEARING as B, type BearingState } from '../../models/ball-bearing';

/** Complete front section, preserving exact contacts and individual ball identity without WebGL. */
export default function BallBearingDiagram({
  state,
  loadVisible = true,
}: {
  state: BearingState;
  loadVisible?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    scale = 49;
  return (
    <svg
      className="bb-flat"
      viewBox="0 0 300 320"
      role="img"
      aria-label={t('二维轴承剖面：金色球沿同心滚道公转，同时反向自转')}
    >
      <defs>
        <radialGradient id={`${id}-ball`} cx="30%" cy="25%">
          <stop stopColor="#f8f2de" />
          <stop offset=".4" stopColor="#b7c6cc" />
          <stop offset="1" stopColor="#354e58" />
        </radialGradient>
      </defs>
      <g transform="translate(150 151)">
        <path
          d="M-108 75V135H108V75"
          fill="none"
          stroke="#33545f"
          strokeWidth="13"
          strokeLinejoin="round"
        />
        <circle
          r={((B.housingOutside + B.outside) / 2) * scale}
          stroke="#385461"
          strokeWidth={(B.housingOutside - B.outside) * scale}
          fill="none"
        />
        <circle
          r={((B.outside + B.pitch + B.ball) / 2) * scale}
          stroke="#9baeb7"
          strokeWidth={(B.outside - B.pitch - B.ball) * scale}
          fill="none"
        />
        <circle
          r={((B.bore + B.pitch - B.ball) / 2) * scale}
          stroke="#a7bac3"
          strokeWidth={(B.pitch - B.ball - B.bore) * scale}
          fill="none"
        />
        <circle r={B.bore * scale} fill="#253c46" />
        <circle
          r={B.pitch * scale}
          fill="none"
          stroke="#b39766"
          strokeWidth="2"
          strokeDasharray="3 6"
        />
        <g transform={`rotate(${(-state.innerAngle * 180) / Math.PI})`}>
          <path d={`M${B.bore * scale + 6} 0h13`} stroke="#f1c479" strokeWidth="4" />
        </g>
        {state.balls.map((ball) => (
          <g key={ball.id}>
            {loadVisible && ball.loadWeight > 0.01 && (
              <line
                x1={ball.innerContact.x * scale}
                y1={-ball.innerContact.y * scale}
                x2={ball.outerContact.x * scale}
                y2={-ball.outerContact.y * scale}
                stroke="#e9aa60"
                strokeWidth={3 + ball.loadWeight * 7}
                opacity={ball.loadWeight * 0.55}
              />
            )}
            <circle
              cx={ball.x * scale}
              cy={-ball.y * scale}
              r={B.ball * scale}
              fill={ball.id ? `url(#${id}-ball)` : '#e2bd7b'}
              stroke={ball.id ? '#a1b5bd' : '#fff0c9'}
              strokeWidth=".7"
            />
            {ball.id === 0 && (
              <circle
                cx={(ball.x + B.ball * 0.76 * Math.cos(ball.spin)) * scale}
                cy={-(ball.y + B.ball * 0.76 * Math.sin(ball.spin)) * scale}
                r="2.8"
                fill="#233c47"
              />
            )}
            {loadVisible && ball.loadWeight > 0.01 && (
              <>
                {[ball.innerContact, ball.outerContact].map((p, i) => (
                  <circle key={i} cx={p.x * scale} cy={-p.y * scale} r="2.5" fill="#ffdc98" />
                ))}
              </>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
