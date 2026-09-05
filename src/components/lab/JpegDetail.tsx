import { useCompact } from './useCompact';
import { t } from '../../i18n';
import { jpegZigzag, chroma420, type compressBlock } from '../../models/jpeg';
/** Close views use the same coefficients and reconstruction as the main workbench. */
export default function JpegDetail({
  chapter,
  progress,
  block,
  result,
}: {
  chapter: number;
  progress: number;
  block: number[];
  result: ReturnType<typeof compressBlock>;
}) {
  const compact = useCompact();
  const tile = compact ? 140 : 160;
  const position = (k: number) =>
    compact
      ? [
          [20, 46],
          [200, 46],
          [110, 258],
        ][k]
      : [42 + k * 210, 50];
  const selected = Math.min(63, Math.floor(progress * 64));
  const chroma = chroma420();
  const scan = jpegZigzag.map((i) => result.quantized[i]);
  const lastNonzero = scan.findLastIndex((v) => v !== 0);
  return (
    <div className="jpeg-detail" data-view={chapter}>
      <svg
        viewBox={compact ? `0 0 380 ${chapter === 10 ? 420 : 470}` : '0 0 640 290'}
        role="img"
        aria-label={
          chapter === 8
            ? t('逐像素重建误差')
            : chapter === 9
              ? t('亮度保持，色度每四点取平均')
              : t('之字扫描与连续零系数')
        }
      >
        {chapter === 8 ? (
          <>
            {[t('原始'), t('重建'), t('差值 × 4')].map((label, k) => (
              <text key={k} x={position(k)[0]} y={position(k)[1] - 15}>
                {label}
              </text>
            ))}
            {[
              block,
              result.reconstructed,
              result.reconstructed.map((v, i) => Math.min(255, Math.abs(v - block[i]) * 4)),
            ].map((values, k) => (
              <g key={k} transform={`translate(${position(k).join(',')}) scale(${tile / 160})`}>
                {values.map((v, i) => (
                  <rect
                    key={i}
                    x={(i % 8) * 20}
                    y={Math.floor(i / 8) * 20}
                    width="20"
                    height="20"
                    fill={`rgb(${v},${v},${v})`}
                  />
                ))}
                <rect
                  x={(selected % 8) * 20}
                  y={Math.floor(selected / 8) * 20}
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#d58956"
                  strokeWidth="2"
                />
              </g>
            ))}
            <text x={compact ? 190 : 320} y={compact ? 448 : 257} textAnchor="middle">
              {block[selected]} → {result.reconstructed[selected]} · Δ ={' '}
              {result.reconstructed[selected] - block[selected]}
            </text>
          </>
        ) : chapter === 9 ? (
          <>
            {['Y · 4 × 4', 'Cb · 4 × 4', 'Cb · 2 × 2'].map((label, k) => (
              <text key={k} x={position(k)[0]} y={position(k)[1] - 15}>
                {label}
              </text>
            ))}
            {[chroma.y, chroma.cb, chroma.sampled].map((values, k) => (
              <g key={k} transform={`translate(${position(k).join(',')}) scale(${tile / 160})`}>
                {values.map((v, i) => {
                  const n = k === 2 ? 2 : 4,
                    size = 160 / n;
                  return (
                    <rect
                      key={i}
                      x={(i % n) * size}
                      y={Math.floor(i / n) * size}
                      width={size}
                      height={size}
                      fill={
                        k === 0
                          ? `rgb(${v},${v},${v})`
                          : `hsl(${v > 128 ? 220 : 38} 40% ${78 - Math.abs(v - 128) * 0.3}%)`
                      }
                    />
                  );
                })}
                <rect
                  x={(Math.min(3, Math.floor(progress * 4)) % 2) * 80}
                  y={Math.floor(Math.min(3, Math.floor(progress * 4)) / 2) * 80}
                  width="80"
                  height="80"
                  stroke="#ae6a45"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            ))}
            <text x={compact ? 190 : 320} y={compact ? 448 : 258} textAnchor="middle">
              {t('保留亮度；每组 2 × 2 色度取平均。')}
            </text>
          </>
        ) : (
          <>
            <g transform={compact ? 'translate(98,20)' : 'translate(42,44)'}>
              {result.quantized.map((v, i) => (
                <g key={i}>
                  <rect
                    x={(i % 8) * 23}
                    y={Math.floor(i / 8) * 23}
                    width="22"
                    height="22"
                    rx="3"
                    fill={v === 0 ? '#e4e9e6' : '#d3b2be'}
                  />
                  <text
                    x={(i % 8) * 23 + 11}
                    y={Math.floor(i / 8) * 23 + 15}
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {v}
                  </text>
                </g>
              ))}
              <polyline
                points={jpegZigzag
                  .slice(0, selected + 1)
                  .map((i) => `${(i % 8) * 23 + 11},${Math.floor(i / 8) * 23 + 11}`)
                  .join(' ')}
                fill="none"
                stroke="#9d637b"
                strokeWidth="1.8"
              />
            </g>
            <text x={compact ? 42 : 270} y={compact ? 252 : 70}>
              {t('扫描顺序')}
            </text>
            {scan.slice(Math.max(0, selected - 7), selected + 1).map((v, i) => (
              <text
                key={i}
                x={(compact ? 48 : 278) + (i % 4) * 74}
                y={(compact ? 288 : 112) + Math.floor(i / 4) * 35}
                fill={v === 0 ? '#93a19c' : '#6c4862'}
              >
                {v}
              </text>
            ))}
            <text x={compact ? 42 : 270} y={compact ? 363 : 218}>
              {t('末尾连续零')}: {63 - lastNonzero}
            </text>
            <text x={compact ? 190 : 320} y={compact ? 400 : 270} textAnchor="middle">
              {t('排列与计数演示；尚未执行熵编码。')}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
