import { t } from '../../i18n';
import {
  printerDrive as drive,
  printerMotion,
  involuteOutline,
  meshedAngle,
} from '../../models/mechanisms';
import type { PrinterVisualState } from './printerModel';
export default function PrinterFlat(props: PrinterVisualState) {
  const { theta, rotation, paperX, selectedRow } = printerMotion(props.progress, props.selected);
  const px =
    theta > -Math.PI / 2
      ? drive.drum.x + 0.652 * Math.cos(theta)
      : paperX + (selectedRow - 3.5) * 0.18;
  const py = theta > -Math.PI / 2 ? drive.drum.y + 0.652 * Math.sin(theta) : 0.66;
  return (
    <svg
      viewBox="0 0 700 380"
      role="img"
      aria-label={t('打印机二维剖面，橙色像素沿鼓面转移到纸上')}
    >
      <g transform="translate(300,305) scale(65,-65)">
        <path d="M-3.7 .61H4.8" stroke="#b6b5af" strokeWidth=".03" />
        <rect
          x={paperX - 0.89}
          y=".635"
          width="1.78"
          height=".024"
          fill="#fcfcf5"
          stroke="#b3beb6"
          strokeWidth=".012"
        />
        {props.pattern.map((row, i) =>
          row.includes('1') && paperX + (i - 3.5) * 0.18 >= drive.drum.x ? (
            <path
              key={i}
              d={`M${paperX + (i - 3.5) * 0.18 - 0.065} .667h.13`}
              stroke="#3b4641"
              strokeWidth=".028"
            />
          ) : null,
        )}
        {[
          [drive.drum, '#287f77'],
          [drive.charge, '#3e4d49'],
          [drive.developer, '#3e4d49'],
          [drive.fuser, '#ba7950'],
        ].map(([wheel, color], i) => {
          const w = wheel as typeof drive.drum;
          return (
            <g key={i}>
              <circle cx={w.x} cy={w.y} r={w.radius} fill={color as string} />
              {i < 3 && (
                <path
                  d={
                    involuteOutline(drive.module, w.teeth)
                      .map((p, j) => `${j ? 'L' : 'M'}${p.x} ${p.y}`)
                      .join('') + 'Z'
                  }
                  transform={`translate(${w.x},${w.y}) rotate(${((i ? meshedAngle(rotation, drive.drum.teeth, w.teeth, Math.atan2(w.y - drive.drum.y, w.x - drive.drum.x)) : rotation) * 180) / Math.PI})`}
                  fill="none"
                  stroke="#d6dbcc"
                  strokeWidth=".012"
                />
              )}
              <circle cx={w.x} cy={w.y} r=".045" fill="#cad2ca" />
            </g>
          );
        })}
        <circle cx={drive.drum.x} cy=".441" r=".2" fill="#3b4944" />
        <circle cx={drive.fuser.x} cy=".391" r=".25" fill="#3b4944" />
        <rect x=".2" y="1.85" width=".9" height=".65" rx=".1" fill="#3b4944" />
        <path
          d="M-2.65 2.88H-.65V1.93"
          stroke="#de6940"
          strokeWidth=".018"
          fill="none"
          opacity={props.progress >= 1 && props.progress < 2 ? 1 : 0.12}
        />
        <circle cx={px} cy={py} r=".048" fill="#e96f3a" />
        <circle cx={px} cy={py} r=".105" fill="none" stroke="#e96f3a" strokeWidth=".013" />
      </g>
      <g fill="#6f7c70" fontSize="13" textAnchor="middle">
        <text x="170" y="93">
          {t('激光扫描')}
        </text>
        <text x="310" y="147">
          {t('显影')}
        </text>
        <text x="263" y="250">
          {t('转印')}
        </text>
        <text x="439" y="218">
          {t('定影')}
        </text>
      </g>
    </svg>
  );
}
