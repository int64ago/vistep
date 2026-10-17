import { useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  rollingPixel,
  rollingPosition,
  rollingShot,
  rowWindow,
  ROLLING_DEFAULT,
  type RollingInput,
} from '../../models/rolling-shutter';
import '../../styles/signal-studies.css';
function Photo({
  s,
  x,
  y,
  width,
  height,
  global = false,
  reveal = 1,
}: {
  s: RollingInput;
  x: number;
  y: number;
  width: number;
  height: number;
  global?: boolean;
  reveal?: number;
}) {
  const nx = 72,
    ny = 40;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx="12" fill="#203b4b" />
      {Array.from({ length: ny }, (_, j) => {
        const row = j / (ny - 1);
        if (row > reveal) return null;
        return Array.from({ length: nx }, (_, i) => {
          const v = rollingPixel((i + 0.5) / nx, row, s, global);
          const occupancy = s.flash ? (v.light > 0 ? v.litOccupancy / v.light : 0) : v.occupancy;
          const background = [96, 132, 146],
            object = [214, 233, 232];
          const color = background.map((value, channel) =>
            Math.round(value + (object[channel] - value) * occupancy),
          );
          return (
            <rect
              key={`${j}-${i}`}
              x={x + (i * width) / nx}
              y={y + (j * height) / ny}
              width={width / nx + 0.2}
              height={height / ny + 0.2}
              fill={`rgb(${color.join(' ')})`}
              opacity={
                s.flash ? 0.12 + 0.88 * v.light : occupancy > 0.001 ? 0.2 + 0.8 * occupancy : 0.14
              }
            />
          );
        });
      })}
      {reveal < 1 && (
        <path d={`M${x} ${y + height * reveal}H${x + width}`} stroke="#f2d89c" strokeWidth="2" />
      )}
      <path
        d={`M${x + width * 0.5} ${y + 8}V${y + height - 8}`}
        stroke="#f2d89c"
        strokeDasharray="3 6"
        opacity=".3"
      />
    </g>
  );
}
export default function RollingShutter() {
  const d = useShowcase(),
    { host, width: w } = useSignalWidth(),
    [manual, setManual] = useState(ROLLING_DEFAULT),
    shot = rollingShot(d.chapter, d.chapterProgress),
    s = d.watch ? shot.input : manual,
    c = d.watch ? shot.view : 2,
    reveal = d.watch ? shot.reveal : 1,
    timing = c === 1 || c === 4;
  const photoY = timing ? 165 : 44,
    ph = timing ? 155 : 240;
  return (
    <div className="signal-study rolling-study" ref={host}>
      <div className="signal-head">
        <span>
          {t('全幅扫描')} {(s.readout * 1000).toFixed(1)} ms
        </span>
        <strong>
          {t('单行曝光')} {(s.exposure * 1000).toFixed(1)} ms
        </strong>
      </div>
      {c !== 3 && (
        <p className="signal-note">{t(c === 7 ? '短闪光只照亮部分行' : '同一根直杆的记录')}</p>
      )}
      <svg
        viewBox={`0 0 ${w} ${timing ? 330 : 300}`}
        role="img"
        aria-label={t('逐行曝光与运动竖杆的成像')}
      >
        {timing && (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map((row, j) => {
              const a = rowWindow(row, s),
                scale = (w - 76) / 0.04;
              return (
                <g key={row}>
                  <text x="14" y={27 + j * 23}>
                    {j + 1}
                  </text>
                  <rect
                    x={48 + a.start * scale}
                    y={14 + j * 23}
                    width={Math.max(3, s.exposure * scale)}
                    height="12"
                    rx="6"
                    fill="#9bd5e4"
                    opacity={0.4 + 0.6 * (row < reveal ? 1 : 0)}
                  />
                </g>
              );
            })}
            <text x={w - 16} y="144" textAnchor="end">
              {t('时间')} →
            </text>
          </>
        )}
        {c === 3 ? (
          <>
            <text x="16" y="25">
              {t('卷帘')}
            </text>
            <text x={w / 2 + 8} y="25">
              {t('全局')}
            </text>
            <Photo s={s} x={12} y={44} width={(w - 40) / 2} height={240} />
            <Photo s={s} x={w / 2 + 8} y={44} width={(w - 40) / 2} height={240} global />
          </>
        ) : (
          <>
            <Photo s={s} x={12} y={photoY} width={w - 24} height={ph} reveal={reveal} />
            {c === 1 && (
              <circle
                cx={12 + rollingPosition(shot.time, s) * (w - 24)}
                cy={photoY + ph * reveal}
                r="5"
                fill="#f2d89c"
              />
            )}
          </>
        )}
      </svg>
      <p className="signal-note">{t('上行较早，下行较晚')}</p>
      <div className="signal-legend">
        <span>
          <i />
          {t('逐行积累的亮度')}
        </span>
        <span>
          <i style={{ background: '#f2d89c' }} />
          {t('静止时的中心线')}
        </span>
      </div>
      {!d.watch && (
        <>
          <div className="signal-explore">
            <Range
              label={t('全幅扫描时间')}
              value={s.readout * 1000}
              min={0}
              max={40}
              step={1}
              unit="ms"
              onChange={(v) => setManual((m) => ({ ...m, readout: v / 1000 }))}
            />
            <Range
              label={t('每行曝光时间')}
              value={s.exposure * 1000}
              min={0.5}
              max={12}
              step={0.5}
              unit="ms"
              onChange={(v) => setManual((m) => ({ ...m, exposure: v / 1000 }))}
            />
            <Range
              label={t('横向运动速度')}
              value={s.velocity}
              min={-12}
              max={12}
              step={1}
              onChange={(velocity) => setManual((m) => ({ ...m, velocity }))}
            />
          </div>
          <div className="signal-buttons">
            <button
              aria-pressed={s.flash}
              onClick={() => setManual((m) => ({ ...m, flash: !m.flash }))}
            >
              {t('比较短闪光')}
            </button>
            <button onClick={() => setManual(ROLLING_DEFAULT)}>{t('恢复运动竖杆')}</button>
          </div>
        </>
      )}
      <details>
        <summary>{t('曝光与读出不是同一个时间')}</summary>
        <p>
          {t(
            '每行对匀速移动竖杆做精确时间积分。单行曝光决定运动模糊，全幅行间延迟决定倾斜；全局对照让所有行共享中间行的曝光窗口。短闪光假定均匀照明，不模拟真实传感器噪声与动态范围。',
          )}
        </p>
      </details>
    </div>
  );
}
