import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  bayerChannel,
  bayerCss,
  bayerNeighbors,
  bayerRaw,
  bayerShot,
  bayerSource,
  demosaicPixel,
  BAYER_DEFAULT,
  BAYER_SIZE,
  type RGB,
} from '../../models/bayer-sensor';
import '../../styles/signal-studies.css';
export default function BayerSensor() {
  const d = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    [manual, setManual] = useState(BAYER_DEFAULT),
    shot = bayerShot(d.chapter, d.chapterProgress),
    s = d.watch ? shot.input : manual,
    c = d.watch ? shot.view : 7,
    raw = useMemo(() => bayerRaw(s), [s.frequency, s.shift, s.stripes]),
    n = BAYER_SIZE,
    size = Math.min(w - 24, compact ? 270 : 330),
    left = (w - size) / 2,
    top = 35,
    zoom = c === 3 || c === 4;
  const ix = 8,
    iy = 10,
    channel = c === 3 ? 1 : 2,
    neighbors = bayerNeighbors(ix, iy, channel),
    rgb = demosaicPixel(raw, ix, iy),
    channelNames = ['R', 'G', 'B'],
    inks = ['#ee9f99', '#a8d3a4', '#96bde9'];
  return (
    <div className="signal-study bayer-study" ref={host}>
      <div className="signal-head">
        <span>{t(zoom ? '补出同一个像素' : '单片传感器 · RGGB')}</span>
        <strong>
          {zoom
            ? `${channelNames[channel]} = ${rgb[channel].toFixed(2)}`
            : s.stripes
              ? `${s.frequency.toFixed(1)} ${t('条纹周期')}`
              : 'R · G · G · B'}
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${w} ${size + 44}`}
        role="img"
        aria-label={t('拜耳采样、邻域插值与重建图像')}
      >
        {zoom ? (
          <>
            {Array.from({ length: 25 }, (_, j) => {
              const a = (j % 5) - 2,
                b = Math.floor(j / 5) - 2,
                x = ix + a,
                y = iy + b,
                ch = bayerChannel(x, y),
                val: RGB = [0, 0, 0];
              val[ch] = raw[y * n + x];
              const cell = size / 5;
              return (
                <g key={j}>
                  <rect
                    x={left + (a + 2) * cell + 2}
                    y={top + (b + 2) * cell + 2}
                    width={cell - 4}
                    height={cell - 4}
                    rx="7"
                    fill={bayerCss(val)}
                    opacity={a === 0 && b === 0 ? 1 : 0.75}
                  />
                  <text
                    x={left + (a + 2.5) * cell}
                    y={top + (b + 2.5) * cell + 5}
                    textAnchor="middle"
                    fill="#fff"
                  >
                    {channelNames[ch]}
                  </text>
                </g>
              );
            })}
            {neighbors.map((p) => (
              <path
                key={`${p.x}-${p.y}`}
                d={`M${left + ((p.x - ix + 2.5) * size) / 5} ${top + ((p.y - iy + 2.5) * size) / 5}L${left + size / 2} ${top + size / 2}`}
                stroke={inks[channel]}
                strokeWidth="2.5"
                strokeDasharray="4 5"
              />
            ))}
            <rect
              x={left + (size * 2) / 5 + 2}
              y={top + (size * 2) / 5 + 2}
              width={size / 5 - 4}
              height={size / 5 - 4}
              rx="7"
              fill={bayerCss(
                c === 3
                  ? [rgb[0], rgb[1] * shot.reveal, 0]
                  : [rgb[0], rgb[1], rgb[2] * shot.reveal],
              )}
              stroke="#f2d89c"
              strokeWidth="2"
            />
          </>
        ) : (
          Array.from({ length: n * n }, (_, i) => {
            const x = i % n,
              y = Math.floor(i / n),
              ch = bayerChannel(x, y),
              source = bayerSource((x + 0.5) / n, (y + 0.5) / n, s),
              value: RGB = [0, 0, 0];
            value[ch] = raw[i];
            let color = source;
            if (c === 1) {
              color = [0, 0, 0];
              color[ch] = 0.7;
            } else if (c === 2) color = value;
            else if (c === 5) color = x / n < shot.reveal ? demosaicPixel(raw, x, y) : value;
            else if (c >= 6) color = x / n < 0.5 ? source : demosaicPixel(raw, x, y);
            return (
              <rect
                key={i}
                x={left + (x * size) / n}
                y={top + (y * size) / n}
                width={size / n + 0.1}
                height={size / n + 0.1}
                fill={bayerCss(color)}
              />
            );
          })
        )}
        {c >= 6 && (
          <>
            <path d={`M${w / 2} ${top - 6}V${top + size + 6}`} stroke="#f2d89c" strokeWidth="1.5" />
            <text x={left} y={top - 13}>
              {t('原图')}
            </text>
            <text x={left + size} y={top - 13} textAnchor="end">
              {t('重建')}
            </text>
          </>
        )}
      </svg>
      <p className="signal-note">
        {t(
          zoom
            ? c === 3
              ? '绿色取十字邻居平均'
              : '蓝色取对角邻居平均'
            : c === 1
              ? '每四格：一红、两绿、一蓝'
              : c === 2
                ? '每格只测一个通道'
                : c >= 6 && s.stripes
                  ? '无彩色条纹也可能出现假色'
                  : '同一个测试图，逐步恢复颜色',
        )}
      </p>
      {!d.watch && (
        <>
          <div className="signal-buttons">
            <button
              aria-pressed={!s.stripes}
              onClick={() => setManual((m) => ({ ...m, stripes: false }))}
            >
              {t('彩色测试图')}
            </button>
            <button
              aria-pressed={s.stripes}
              onClick={() => setManual((m) => ({ ...m, stripes: true }))}
            >
              {t('无彩色细条纹')}
            </button>
          </div>
          <div className="signal-explore">
            <Range
              label={t('条纹空间频率')}
              value={s.frequency}
              min={1}
              max={10}
              step={0.25}
              unit={t('周期/画幅')}
              onChange={(frequency) => setManual((m) => ({ ...m, frequency, stripes: true }))}
            />
            <Range
              label={t('亚像素平移')}
              value={s.shift}
              min={0}
              max={1}
              step={0.05}
              unit={t('像素')}
              onChange={(shift) => setManual((m) => ({ ...m, shift, stripes: true }))}
            />
          </div>
        </>
      )}
      <details>
        <summary>{t('实测与推断的区别')}</summary>
        <p>
          {t(
            '理想红绿蓝滤片各测一个线性颜色通道，缺失值用相邻同色采样做双线性插值；原始实测通道保持不变。图像显示采用 sRGB 编码。省略光谱响应重叠、微透镜、光学低通、噪声与现代去马赛克优化。',
          )}
        </p>
      </details>
    </div>
  );
}
