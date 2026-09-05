import { t } from '../../i18n';
import {
  QR_FORMAT_A,
  QR_FORMAT_B,
  qrTracked,
  type QrEncoding,
  type QrPoint,
} from '../../models/qr-code';

export default function QrCodeMatrix({
  qr,
  chapter = 7,
  structure = 2,
  placed = 208,
  mask = qr.mask,
  copy = 0,
  clean = false,
  inspect = false,
  byteIndex = 8,
  bitIndex = 1,
}: {
  qr: QrEncoding;
  chapter?: number;
  structure?: number;
  placed?: number;
  mask?: number;
  copy?: number;
  clean?: boolean;
  inspect?: boolean;
  byteIndex?: number;
  bitIndex?: number;
}) {
  const tracker = qrTracked(
    { ...qr, mask, modules: qr.candidates[mask].modules },
    byteIndex,
    bitIndex,
  );
  const pathIndex = new Map(qr.path.map(([x, y], i) => [`${x},${y}`, i]));
  const cursor = chapter === 4 ? qr.path[Math.max(0, placed - 1)] : null;
  const formatCopy: readonly QrPoint[] = copy === 0 ? QR_FORMAT_A : QR_FORMAT_B;
  return (
    <svg
      className="qr-matrix"
      viewBox="0 0 29 29"
      role="img"
      aria-label={t(clean ? '完整二维码，四边各有四格静区' : '二维码编码过程的教学视图')}
      shapeRendering="crispEdges"
    >
      <rect width="29" height="29" fill="#fff" />
      {qr.base.map((row, y) =>
        row.map((base, x) => {
          const role = qr.roles[y][x],
            index = pathIndex.get(`${x},${y}`);
          let value = qr.candidates[mask].modules[y][x],
            fill = '#141b1b',
            opacity = 1;
          if (chapter === 3) {
            value = base;
            if (role === 'data') return null;
            if (role === 'timing' && structure < 1) return null;
            if (['format', 'dark'].includes(role) && structure < 2) return null;
            if (role === 'format') {
              value = 1;
              fill = '#d3ad6b';
              opacity = 0.3;
            }
          }
          if (chapter === 4) {
            value = role === 'data' ? qr.unmasked[y][x] : base;
            if (role === 'data' && index! >= placed) return null;
            if (role === 'format') {
              value = 1;
              fill = '#d3ad6b';
              opacity = 0.25;
            }
          }
          if (!value) return null;
          if (!clean && chapter === 3 && role === 'timing') fill = '#47838a';
          if (!clean && chapter === 4 && index !== undefined && index >= 152) fill = '#8b6d93';
          return (
            <rect
              key={`${x}-${y}`}
              x={x + 4}
              y={y + 4}
              width="1"
              height="1"
              fill={fill}
              opacity={opacity}
            />
          );
        }),
      )}
      {!clean &&
        chapter === 6 &&
        formatCopy.map(([x, y], i) => (
          <rect
            key={i}
            x={x + 3.9}
            y={y + 3.9}
            width="1.2"
            height="1.2"
            fill="none"
            stroke="#b16b37"
            strokeWidth=".16"
          />
        ))}
      {cursor && !clean && (
        <rect
          x={cursor[0] + 3.88}
          y={cursor[1] + 3.88}
          width="1.24"
          height="1.24"
          fill="none"
          stroke="#c28c3b"
          strokeWidth=".2"
        />
      )}
      {tracker && !clean && (inspect || chapter === 7) && (
        <rect
          x={tracker.x + 3.75}
          y={tracker.y + 3.75}
          width="1.5"
          height="1.5"
          fill="none"
          stroke="#c28c3b"
          strokeWidth=".2"
        />
      )}
    </svg>
  );
}
