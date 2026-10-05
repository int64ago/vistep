import { useId } from 'react';
import { t } from '../../i18n';
import { IC, icPaperPoint, type IcShot } from '../../models/instant-camera';
export default function InstantCameraDiagram({ shot, width }: { shot: IcShot; width: number }) {
  const id = useId().replace(/:/g, ''),
    detail = shot.view === 'rollers',
    height = 318;
  const bounds = detail ? [-31, 38, 8, 48] : [-161, 124, 0, 128];
  const scale = Math.min(
    (width - 32) / (bounds[1] - bounds[0]),
    (height - 44) / (bounds[3] - bounds[2]),
  );
  const x = (v: number) => 16 + (v - bounds[0]) * scale,
    y = (v: number) => height - 22 - (v - bounds[2]) * scale;
  const f = shot.transport,
    lead = icPaperPoint(shot.feedMm, 0, 0).x,
    trail = icPaperPoint(shot.feedMm, IC.length, 0).x;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('同一张相纸连续经过两根相切滚轮；侧剖面与三维模型使用相同位置和转角')}
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d5d5c8" />
          <stop offset=".46" stopColor="#a2ada3" />
          <stop offset="1" stopColor="#596d68" />
        </linearGradient>
      </defs>
      {!detail && (
        <g>
          <path
            d={`M${x(-155)} ${y(8)}V${y(113)}Q${x(-155)} ${y(124)} ${x(-143)} ${y(124)}H${x(-90)}L${x(8)} ${y(101)}V${y(53)}H${x(-8)}V${y(8)}Z`}
            fill="#e3dcc9"
            stroke="#b0a691"
            strokeWidth="1.5"
          />
          <path
            d={`M${x(-143)} ${y(39)}V${y(107)}H${x(-90)}L${x(0)} ${y(89)}V${y(52)}`}
            fill="#2d413e"
            opacity=".8"
          />
          <rect
            x={x(-133)}
            y={y(23)}
            width={117 * scale}
            height={13 * scale}
            rx="4"
            fill="#526761"
          />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${x(-128)} ${y(24 - i * 2)}H${x(-19)}`}
              stroke="#f2ead9"
              strokeWidth="1.3"
            />
          ))}
          <path
            d={`M${x(IC.mirror.x - 17)} ${y(IC.mirror.y - 17)}L${x(IC.mirror.x + 17)} ${y(IC.mirror.y + 17)}`}
            stroke="#c5d6d1"
            strokeWidth="3"
          />
          <rect
            x={x(8)}
            y={y(99)}
            width={29 * scale}
            height={32 * scale}
            rx="5"
            fill="#304540"
            stroke="#768a7f"
          />
          <path d={`M${x(25)} ${y(97)}V${y(69)}`} stroke="#a5c2bf" strokeWidth="3" />
          {shot.shutterOpen && (
            <path
              d={`M${x(45)} ${y(83)}H${x(IC.mirror.x)}V${y(IC.plane)}`}
              fill="none"
              stroke="#b67d2d"
              strokeWidth="2"
            />
          )}
        </g>
      )}
      <path
        d={`M${x(Math.max(trail, bounds[0]))} ${y(IC.plane)}H${x(Math.min(lead, bounds[1]))}`}
        stroke="#e9debb"
        strokeWidth={Math.max(3, IC.thickness * scale)}
      />
      <path
        d={`M${x(Math.max(trail, bounds[0]))} ${y(IC.plane) + 2}H${x(Math.min(lead, bounds[1]))}`}
        stroke="#34433e"
        strokeWidth="1"
      />
      {!detail && (
        <path
          d={`M${x(f.pickerX - 3)} ${y(IC.plane - 4)}H${x(f.pickerX)}V${y(IC.plane)}`}
          stroke="#b2945b"
          strokeWidth="3"
          fill="none"
        />
      )}
      {[f.topCenter, f.bottomCenter].map((c, i) => (
        <g key={i}>
          <circle
            cx={x(c.x)}
            cy={y(c.y)}
            r={IC.rollerRadius * scale}
            fill={`url(#${id}-metal)`}
            stroke="#4d625b"
            strokeWidth="1.3"
          />
          <circle cx={x(c.x)} cy={y(c.y)} r={1.5 * scale} fill="#394d47" />
          <path
            d={`M${x(c.x + Math.cos(i ? f.bottomAngle : f.topAngle) * IC.rollerRadius * 0.8)} ${y(c.y + Math.sin(i ? f.bottomAngle : f.topAngle) * IC.rollerRadius * 0.8)}L${x(c.x + Math.cos(i ? f.bottomAngle : f.topAngle) * IC.rollerRadius * 0.48)} ${y(c.y + Math.sin(i ? f.bottomAngle : f.topAngle) * IC.rollerRadius * 0.48)}`}
            stroke="#e5ddc6"
            strokeWidth="2"
          />
        </g>
      ))}
      {Math.abs(f.podX) < bounds[1] && (
        <path
          d={`M${x(f.podX - IC.podHalfLength)} ${y(IC.plane + IC.thickness / 2)}L${x(f.podX + IC.podHalfLength)} ${y(IC.plane + IC.thickness / 2)}${[
            ...f.podProfile,
          ]
            .reverse()
            .map(
              ({ x: worldX, height }) => `L${x(worldX)} ${y(IC.plane + IC.thickness / 2 + height)}`,
            )
            .join('')}Z`}
          fill={f.ruptured ? '#a29b86' : '#c7ae72'}
        />
      )}
      {detail && (
        <>
          <path d={`M${x(12)} ${y(27)}H${x(29)}`} stroke="#ac773d" strokeWidth="1.5" />
          <text x={x(30)} y={y(27) + 6} fontSize="16">
            →
          </text>
        </>
      )}
    </svg>
  );
}
