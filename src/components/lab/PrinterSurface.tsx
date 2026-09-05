import { t } from '../../i18n';
/** A magnified explanatory section, locked to the same drum/paper progress as the 3D model. */
export default function PrinterSurface({ progress }: { progress: number }) {
  const stage = Math.min(5, Math.floor(progress)),
    q = progress - stage;
  const x = 112 + 376 * q;
  return (
    <div className="printer-surface">
      <svg viewBox="0 0 600 170" role="img" aria-label={t('放大观察同一个像素的表面变化')}>
        <defs>
          <linearGradient id="drum-surface" x2="0" y2="1">
            <stop stopColor="#b3c5a7" />
            <stop offset="1" stopColor="#809775" />
          </linearGradient>
        </defs>
        <text x="24" y="25" fill="#7d8c6e" fontSize="12">
          {stage < 3
            ? t('感光鼓表面')
            : stage === 3
              ? t('鼓面 → 纸张')
              : stage === 4
                ? t('加热与压力')
                : t('清洁并复位')}
        </text>
        <rect
          x="80"
          y="90"
          width="440"
          height="17"
          rx="3"
          fill="url(#drum-surface)"
          opacity={stage === 4 ? 0 : 1}
        />
        {stage < 3 &&
          Array.from({ length: 23 }, (_, i) => {
            const px = 91 + i * 19,
              exposed = stage > 0 && px > 245 && px < 355 && (stage === 2 || px < x);
            return (
              <path
                key={i}
                d={`M${px - 4} 80h8`}
                stroke={exposed ? '#c9915d' : '#637b56'}
                strokeWidth={exposed ? 1 : 3}
                opacity={stage === 0 && px > x ? 0.12 : 1}
              />
            );
          })}
        {stage === 0 && (
          <g transform={`translate(${x},0)`}>
            <rect x="-14" y="45" width="28" height="16" rx="8" fill="#829474" />
            <path d="M0 64v10" stroke="#809376" strokeDasharray="2 3" />
          </g>
        )}
        {stage === 1 && (
          <>
            <path d={`M${x - 28} 30L${x} 87`} stroke="#da8d53" strokeWidth="2" />
            <circle cx={x} cy="87" r="6" fill="#ecaf7066" />
          </>
        )}
        {stage === 2 &&
          Array.from({ length: 18 }, (_, i) => {
            const px = 254 + (i % 6) * 18,
              arrival = Math.max(0, Math.min(1, q * 2 - i * 0.035));
            return (
              <circle
                key={i}
                cx={px}
                cy={34 + (49 - (i % 3) * 2) * arrival}
                r="3"
                fill="#344b30"
                opacity={Math.min(1, q * 5)}
              />
            );
          })}
        {stage === 3 && (
          <>
            <path d="M80 133H520" stroke="#dbe1ca" strokeWidth="7" />
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i}>
                <circle
                  cx={266 + (i % 6) * 14}
                  cy={85 + 39 * Math.max(0, Math.min(1, q * 1.4 - i * 0.025))}
                  r="3"
                  fill={i === 3 ? '#df9554' : '#415b35'}
                />
                <path d={`M${263 + i * 6} 151h6m-3-3v6`} stroke="#8da273" />
              </g>
            ))}
          </>
        )}
        {stage === 4 && (
          <>
            <rect x="204" y="45" width="192" height="40" rx="20" fill="#b48151" />
            <rect x="204" y="100" width="192" height="36" rx="18" fill="#5a7046" />
            <path d="M80 93H520" stroke="#dbe1ca" strokeWidth="7" />
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse
                key={i}
                cx={150 + i * 17 + q * 170}
                cy="89"
                rx={2 + q * 2}
                ry={3 - q * 1.3}
                fill={i === 3 ? '#c08549' : '#53623a'}
              />
            ))}
            <path d="M300 60v16m-4-4 4 4 4-4" stroke="#efc999" strokeWidth="2" />
          </>
        )}
        {stage === 5 && (
          <>
            <path d={`M${x + 25} 39l-25 48h48`} stroke="#5c754b" strokeWidth="5" fill="none" />
            {Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                cx={100 + i * 32}
                cy={i / 12 > q ? 85 : 66 - q * 25}
                r="3"
                fill="#6e8058"
                opacity={i / 12 > q ? 1 : Math.max(0, 1 - q * 1.4)}
              />
            ))}
          </>
        )}
        {stage < 3 && (
          <circle cx="300" cy="88" r="7" fill="none" stroke="#d19053" strokeWidth="2" />
        )}
        <text x="300" y="166" textAnchor="middle" fontSize="11" fill="#92a080">
          {t('局部示意 · 橙色标记同一像素')}
        </text>
      </svg>
    </div>
  );
}
