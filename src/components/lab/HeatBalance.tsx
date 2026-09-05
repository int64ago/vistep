import { t } from '../../i18n';
import { useCompact } from './useCompact';
export default function HeatBalance({
  power,
  cop,
  openDoor,
  progress,
}: {
  power: number;
  cop: number;
  openDoor: boolean;
  progress: number;
}) {
  const compact = useCompact();
  const cold = power * cop,
    hot = cold + power;
  const coldPath = compact
    ? 'M45 87H125Q165 87 165 132V162Q165 193 208 193H305'
    : 'M95 92H295Q330 92 348 116L405 150H545';
  const workPath = compact
    ? 'M45 283H125Q165 283 165 248V224Q165 193 208 193H305'
    : 'M210 207H294Q326 207 348 183L405 150H545';
  return (
    <div className="heat-balance">
      {openDoor && (
        <p>
          {t('房间净增热量')} <span style={{ whiteSpace: 'nowrap' }}>{power} W</span>
        </p>
      )}
      <svg
        viewBox={compact ? '0 0 360 340' : '0 0 640 270'}
        role="img"
        aria-label={t('从箱内取出的热，加上电功，全部进入房间')}
      >
        {openDoor && (
          <rect
            x={compact ? 15 : 34}
            y="25"
            width={compact ? 330 : 572}
            height={compact ? 299 : 230}
            rx="24"
            fill="#c8a87f12"
            stroke="#baaa8c"
            strokeDasharray="5 6"
          />
        )}
        <path d={coldPath} fill="none" stroke="#91b3b4" strokeWidth={cold / 10} opacity=".65" />
        <path d={workPath} fill="none" stroke="#cbad79" strokeWidth={power / 10} opacity=".8" />
        <path
          d={compact ? 'M208 193H305' : 'M409 150H545'}
          stroke="#bf9470"
          strokeWidth={hot / 10}
          opacity=".85"
        />
        {[coldPath, workPath].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#f1f5eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 42"
            strokeDashoffset={-progress * 420}
          />
        ))}
        <g fontFamily="inherit" fontSize={compact ? 16 : 18} fill="#627d70">
          <text x={compact ? 42 : 85} y={compact ? 60 : 52}>
            {t('箱内吸热')} {cold.toFixed(0)} W
          </text>
          <text x={compact ? 42 : 182} y={compact ? 309 : 248}>
            {t('输入电功')} {power} W
          </text>
          <text x={compact ? 185 : 410} y={compact ? 151 : 100}>
            {t('房间放热')}
          </text>
          <text x={compact ? 222 : 456} y={compact ? 174 : 125}>
            {hot.toFixed(0)} W
          </text>
        </g>
      </svg>
    </div>
  );
}
