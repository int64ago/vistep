import { useCompact } from './useCompact';
import { useMemo } from 'react';
import { t } from '../../i18n';
import { distance, locate } from '../../models/gps';
const target = [150, 110];
const configurations = [
  [
    [30, 30],
    [265, 30],
    [265, 195],
    [30, 195],
  ],
  [
    [35, 25],
    [65, 20],
    [100, 25],
    [140, 20],
  ],
];
export default function GpsGeometry({ progress }: { progress: number }) {
  const compact = useCompact();
  const solutions = useMemo(
    () =>
      configurations.map((sats) =>
        Array.from({ length: 36 }, (_, j) => {
          const ranges = sats.map(
            (s, i) => distance(s, target) + Math.sin((j + 1) * (i + 1) * 2.399) * 0.8,
          );
          return locate(sats, ranges, 2, false, [151, 111])?.position ?? target;
        }),
      ),
    [],
  );
  return (
    <div className="gps-geometry">
      <svg
        viewBox={compact ? '0 0 340 610' : '0 0 640 350'}
        role="img"
        aria-label={t('同等测距误差下，分散与集中信号源的定位结果')}
      >
        {configurations.map((sats, k) => (
          <g
            key={k}
            transform={compact ? `translate(20,${45 + k * 280})` : `translate(${20 + k * 310},45)`}
          >
            <text x="150" y="-17" textAnchor="middle" fill="#97b1c4" fontSize="16">
              {k === 0 ? t('分散分布') : t('集中分布')}
            </text>
            {sats.map((s, i) => (
              <g key={i}>
                <line
                  x1={s[0]}
                  y1={s[1]}
                  x2="150"
                  y2="110"
                  stroke="#657e9b"
                  strokeWidth="1"
                  opacity=".4"
                />
                <circle cx={s[0]} cy={s[1]} r="5" fill="#a2b7d2" />
              </g>
            ))}
            <circle cx="150" cy="110" r="4" fill="#d5e3ed" />
            {solutions[k].slice(0, Math.min(36, 1 + Math.floor(progress * 36))).map((p, i) => (
              <circle
                key={i}
                cx={150 + (p[0] - 150) * 12}
                cy={110 + (p[1] - 110) * 12}
                r="2.5"
                fill="#e5b782"
                opacity=".7"
              />
            ))}
            <text x="150" y="225" textAnchor="middle" fill="#afc1ce" fontSize="13">
              RMS ={' '}
              {Math.sqrt(
                solutions[k].reduce((n, p) => n + distance(p, target) ** 2, 0) / 36,
              ).toFixed(2)}
            </text>
          </g>
        ))}
        <text
          x={compact ? 170 : 320}
          y={compact ? 596 : 329}
          fill="#839cb6"
          textAnchor="middle"
          fontSize="12"
        >
          {t('相同误差样本 · 位置偏差放大 12 倍')}
        </text>
      </svg>
    </div>
  );
}
