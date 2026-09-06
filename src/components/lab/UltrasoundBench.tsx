import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  ultrasoundBrightness,
  ultrasoundDepth,
  ultrasoundPulse,
  ultrasoundRegions,
  ultrasoundResolution,
  ultrasoundSignal,
  type UltrasoundImage,
  type UltrasoundShot,
} from '../../models/ultrasound';

const colors = {
  upper: '#dce3d5',
  middle: '#ccd8cd',
  lower: '#b9cac5',
  base: '#a7bbba',
  foil: '#b39169',
  insert: '#aab0aa',
};
const golden = '#d7b46e',
  teal = '#8ad1c5',
  coral = '#e1a28e';

export function UltrasoundPhantom({ shot, compact }: { shot: UltrasoundShot; compact: boolean }) {
  const id = useId().replaceAll(':', '');
  const w = compact ? 320 : 440,
    h = compact ? 277 : 365;
  const left = compact ? 35 : 40,
    right = w - 16,
    top = 70,
    bottom = h - 28;
  const x = (mm: number) => left + ((mm + 20) / 40) * (right - left);
  const y = (mm: number) => top + (mm / 64) * (bottom - top);
  const probe = x(shot.x),
    regions = ultrasoundRegions(shot.config);
  // Keep the arrowhead (4) and half-stroke (0.8) six units inside the
  // phantom. Only the annotation changes sides; pulse depth/width stay physical.
  const arrowInset = 4 + 0.8 + 6;
  const arrowX =
    probe + 24 <= right - arrowInset ? probe + 24 : Math.max(left + arrowInset, probe - 24);
  return (
    <svg
      className="ultrasound-phantom"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('已知体模与探头：脉冲按真实传播时刻经过界面并返回。')}
    >
      <defs>
        <clipPath id={`${id}-phantom`}>
          <rect x={left} y={top} width={right - left} height={bottom - top} rx="5" />
        </clipPath>
      </defs>
      <path d={`M ${left} 18 H ${right}`} stroke="#93a6a2" strokeWidth="2" />
      <path
        d={`M ${probe} 18 C ${probe - 15} 2 ${Math.max(12, probe - 36)} 2 ${Math.max(12, probe - 45)} 5`}
        stroke="#667f7c"
        strokeWidth="3"
        fill="none"
      />
      <rect x={probe - 4} y="17" width="8" height="9" rx="2" fill="#647f79" />
      <rect
        x={probe - 24}
        y="23"
        width="48"
        height="41"
        rx="9"
        fill="#eef3e9"
        stroke="#647f79"
        strokeWidth="1.5"
      />
      <rect x={probe - 18} y="29" width="36" height="17" rx="3" fill="#647776" />
      <rect x={probe - 18} y="48" width="36" height="7" rx="1" fill="#bfaa7a" />
      <rect x={probe - 18} y="57" width="36" height="6" rx="1" fill="#739e94" />
      <rect x={probe - 23} y="65" width="46" height="5" rx="2" fill="#a9d6d0" />
      <g clipPath={`url(#${id}-phantom)`}>
        {regions.map((region, i) => (
          <rect
            key={i}
            x={x(region.left)}
            y={y(region.top)}
            width={x(region.right) - x(region.left) + 0.1}
            height={y(region.bottom) - y(region.top)}
            fill={colors[region.kind]}
          />
        ))}
        <path
          d={`M ${probe} ${top} V ${bottom}`}
          stroke="#557c72"
          strokeOpacity=".32"
          strokeDasharray="3 5"
        />
        {shot.line.echoes.map((echo) => (
          <g key={echo.id}>
            <path
              d={`M ${probe - 12} ${y(echo.depth)} h 24`}
              stroke="#516c61"
              strokeOpacity=".55"
            />
            <circle cx={probe} cy={y(echo.depth)} r="2.5" fill="#48665f" />
          </g>
        ))}
        {shot.packets.map((packet) => {
          const color =
            packet.direction === 'down' ? '#b98536' : packet.amplitude < 0 ? '#466d84' : '#92765d';
          const opacity = 0.2 + (0.8 * ultrasoundBrightness(Math.abs(packet.amplitude), 1)) / 255;
          return (
            <g key={packet.id} opacity={opacity}>
              <rect
                x={probe - 16}
                y={y(packet.top)}
                width="32"
                height={Math.max(0, y(packet.bottom) - y(packet.top))}
                fill={color}
              />
              <path
                d={
                  packet.direction === 'down'
                    ? `M ${arrowX} ${y(packet.center) - 6} v 12 m -4 -4 4 4 4 -4`
                    : `M ${arrowX} ${y(packet.center) + 6} v -12 m -4 4 4 -4 4 4`
                }
                stroke={color}
                strokeWidth="1.6"
                fill="none"
              />
            </g>
          );
        })}
      </g>
      <path d={`M ${left} ${top} H ${right}`} stroke="#61857b" strokeWidth="1.4" />
      {[0, 20, 40, 60].map((depth) => (
        <g key={depth}>
          <path d={`M ${left - 5} ${y(depth)} h 5`} stroke="#77918a" />
          <text
            x={left - 8}
            y={y(depth) + 6}
            textAnchor="end"
            fontSize={compact ? 21 : 20}
            fill="#526f68"
          >
            {depth}
          </text>
        </g>
      ))}
      <text x={left} y={h - 2} textAnchor="end" fontSize={compact ? 20 : 18} fill="#526f68">
        mm
      </text>
      <text
        x={(left + right) / 2}
        y={h - 5}
        textAnchor="middle"
        fontSize={compact ? 20 : 18}
        fill="#526f68"
      >
        x = {shot.x.toFixed(1)} mm
      </text>
    </svg>
  );
}

function path(
  points: { time: number; real: number; envelope: number }[],
  mapX: (n: number) => number,
  baseline: number,
  gain: number,
  key: 'real' | 'envelope',
  limit = Infinity,
) {
  return points
    .filter((point) => point.time <= limit)
    .map(
      (point, i) =>
        `${i ? 'L' : 'M'}${mapX(point.time).toFixed(2)},${(baseline - point[key] * gain).toFixed(2)}`,
    )
    .join(' ');
}

export function UltrasoundScope({ shot, compact }: { shot: UltrasoundShot; compact: boolean }) {
  const w = compact ? 320 : 480,
    h = compact ? (shot.focus === 'split' ? 155 : 158) : 365;
  const pulse = shot.focus === 'pulse',
    split = shot.focus === 'split';
  const left = compact ? 18 : 34,
    right = w - 20;
  const echo = shot.line.echoes[0];
  if (split)
    return (
      <div className="ultrasound-energy" style={{ minHeight: compact ? h : 365 }}>
        <p>
          <span>{t('压强反射系数')}</span>
          <strong>r = {echo.r.toFixed(3)}</strong>
        </p>
        <div className="ultrasound-energy-row">
          <span>{t('反射能量')}</span>
          <b>{(echo.reflectedEnergy * 100).toFixed(2)}%</b>
          <i>
            <em style={{ width: `${echo.reflectedEnergy * 100}%` }} />
          </i>
        </div>
        <div className="ultrasound-energy-row">
          <span>{t('继续传播')}</span>
          <b>{(echo.transmittedEnergy * 100).toFixed(2)}%</b>
          <i>
            <em style={{ width: `${echo.transmittedEnergy * 100}%` }} />
          </i>
        </div>
        {!compact && (
          <div className="ultrasound-coefficients">
            <p>Z₁ = {echo.z1.toFixed(1)} MRayl</p>
            <p>Z₂ = {echo.z2.toFixed(1)} MRayl</p>
            <p>
              {t('压强透射系数')} {echo.forward.toFixed(3)}
            </p>
          </div>
        )}
      </div>
    );
  const start = pulse ? -1.1 : -1,
    end = pulse ? 1.1 : 84;
  const x = (time: number) => left + ((time - start) / (end - start)) * (right - left);
  const baseline = compact ? 93 : 193,
    gain = pulse ? (compact ? 34 : 90) : compact ? 180 : 430;
  const samples = pulse
    ? Array.from({ length: 600 }, (_, i) => {
        const time = start + ((end - start) * i) / 599;
        return { time, ...ultrasoundPulse(time, shot.config) };
      })
    : ultrasoundSignal(shot.line, start, end, 1801);
  const limit = Math.max(start, Math.min(end, shot.time));
  return (
    <svg
      className="ultrasound-scope"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t(
        pulse
          ? '发射的有限脉冲：载波位于一个有起止的包络内。'
          : 'A 线：按真实到达时刻排列的有符号 RF 回波。',
      )}
    >
      <rect width={w} height={h} rx="15" fill="#102c30" />
      {(pulse ? [-1, 0, 1] : [0, 20, 40, 60, 80]).map((time) => (
        <g key={time}>
          <path d={`M ${x(time)} 35 V ${h - 28}`} stroke="#5a8a88" strokeOpacity=".2" />
          <text
            x={x(time)}
            y={h - 9}
            textAnchor="middle"
            fill="#a9c4bf"
            fontSize={compact ? 20 : 19}
          >
            {time}
          </text>
        </g>
      ))}
      <path d={`M ${left} ${baseline} H ${right}`} stroke="#6c9691" strokeOpacity=".55" />
      <text x={left} y="25" fill={teal} fontSize={compact ? 21 : 20}>
        {pulse ? 'TX' : 'RF'}
      </text>
      <text x={right} y="25" textAnchor="end" fill="#a9c4bf" fontSize={compact ? 20 : 19}>
        µs
      </text>
      <path
        d={path(samples, x, baseline, gain, 'real', limit)}
        stroke={teal}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d={path(samples, x, baseline, gain, 'envelope', limit)}
        stroke={golden}
        strokeWidth="1.2"
        strokeOpacity=".75"
        fill="none"
      />
      <path d={`M ${x(limit)} 37 V ${h - 28}`} stroke={golden} strokeWidth="1" strokeOpacity=".6" />
      {!pulse &&
        shot.line.echoes.map((event, index) => (
          <g key={event.id} opacity={event.time <= shot.time ? 1 : 0.25}>
            <path
              d={`M ${x(event.time)} ${baseline + 16} v 8`}
              stroke={event.r < 0 ? coral : golden}
            />
            {!compact && (
              <text
                x={x(event.time)}
                y={baseline + 51}
                textAnchor="middle"
                fill="#a9c4bf"
                fontSize="18"
              >
                {index + 1}
              </text>
            )}
          </g>
        ))}
    </svg>
  );
}

export function UltrasoundPolarity({ shot, compact }: { shot: UltrasoundShot; compact: boolean }) {
  const w = compact ? 320 : 480,
    h = 365,
    left = 24,
    right = w - 22;
  const sampleTimes = Array.from({ length: 601 }, (_, i) => -0.55 + (1.1 * i) / 600);
  const x = (time: number) => left + ((time + 0.55) / 1.1) * (right - left);
  const limit = -0.55 + 1.1 * shot.progress;
  const pair = shot.line.echoes.slice(0, 2);
  return (
    <svg
      className="ultrasound-polarity"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('两次回波按中心对齐：RF 极性相反，包络都为非负。')}
    >
      <rect width={w} height={h} rx="15" fill="#102c30" />
      {pair.map((echo, i) => {
        const baseline = 119 + i * 150;
        const samples = sampleTimes.map((time) => {
          const sample = ultrasoundPulse(time, shot.config);
          return {
            time,
            real: echo.amplitude * sample.real,
            envelope: Math.abs(echo.amplitude) * sample.envelope,
          };
        });
        return (
          <g key={echo.id}>
            <text x={left} y={baseline - 65} fill="#c6d9d1" fontSize="21">
              {echo.depth} mm · r = {echo.r > 0 ? '+' : ''}
              {echo.r.toFixed(3)}
            </text>
            <path d={`M ${left} ${baseline} H ${right}`} stroke="#799b92" strokeOpacity=".5" />
            <path
              d={`M ${x(0)} ${baseline - 48} v 93`}
              stroke="#799b92"
              strokeDasharray="3 6"
              strokeOpacity=".4"
            />
            <path
              d={path(samples, x, baseline, 510, 'real', limit)}
              stroke={i ? coral : teal}
              strokeWidth="1.7"
              fill="none"
            />
            <path
              d={path(samples, x, baseline, 510, 'envelope', limit)}
              stroke={golden}
              strokeWidth="2.1"
              fill="none"
            />
          </g>
        );
      })}
      <text x={w / 2} y="349" textAnchor="middle" fill="#acc8bc" fontSize="20">
        {t('回波中心对齐')}
      </text>
    </svg>
  );
}

export function UltrasoundResolutionScope({
  shot,
  compact,
}: {
  shot: UltrasoundShot;
  compact: boolean;
}) {
  const w = compact ? 320 : 900,
    h = 365,
    left = compact ? 26 : 55,
    right = w - (compact ? 20 : 45);
  const current = ultrasoundResolution(shot.config),
    reference = ultrasoundResolution({ ...shot.config, cycles: 8 });
  const x = (time: number) =>
    left + ((time - current.start) / (current.end - current.start)) * (right - left);
  return (
    <svg
      className="ultrasound-resolution"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('同一薄片的长短脉冲回波：缩短包络，使相邻界面的两个峰分开。')}
    >
      <rect width={w} height={h} rx="15" fill="#102c30" />
      {[reference, current].map((result, i) => {
        const baseline = i ? 284 : 126;
        return (
          <g key={i}>
            <text x={left} y={baseline - 83} fill="#c6d9d1" fontSize={compact ? 21 : 22}>
              {i ? t('当前 {0} 周期', shot.config.cycles.toFixed(1)) : t('8 周期参照')}
            </text>
            <path d={`M ${left} ${baseline} H ${right}`} stroke="#678e81" strokeOpacity=".55" />
            {result.pair.map((echo) => (
              <path
                key={echo.id}
                d={`M ${x(echo.time)} ${baseline - 65} V ${baseline + 20}`}
                stroke="#b5c0a1"
                strokeDasharray="3 5"
                strokeOpacity=".35"
              />
            ))}
            <path
              d={path(result.samples, x, baseline, 365, 'real')}
              stroke={teal}
              strokeOpacity=".36"
              strokeWidth="1"
              fill="none"
            />
            <path
              d={path(result.samples, x, baseline, 365, 'envelope')}
              stroke={golden}
              strokeWidth="2.1"
              fill="none"
            />
            <text x={right} y={baseline + 52} textAnchor="end" fill="#b9cabe" fontSize="20">
              cτ/2 = {result.support.toFixed(2)} mm
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function UltrasoundBMode({
  image,
  shot,
  compact,
}: {
  image: UltrasoundImage;
  shot: UltrasoundShot;
  compact: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [fallback, setFallback] = useState(true);
  const w = compact ? 320 : 440,
    h = 365,
    left = 38,
    right = w - 15,
    top = 49,
    bottom = 332;
  const acquired = Math.min(image.width, shot.scanColumns);
  const x = (position: number) =>
    left + ((position - image.left) / (image.right - image.left)) * (right - left);
  const y = (depth: number) => top + (depth / 70) * (bottom - top);
  useEffect(() => {
    let context: CanvasRenderingContext2D | null | undefined;
    try {
      context = canvas.current?.getContext('2d');
      if (!context) {
        setFallback(true);
        return;
      }
      context.putImageData(
        new ImageData(new Uint8ClampedArray(image.pixels), image.width, image.height),
        0,
        0,
      );
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    return () => {
      context?.clearRect(0, 0, image.width, image.height);
    };
  }, [image]);
  const runs = useMemo(() => {
    if (!fallback) return [];
    const result: { column: number; row: number; rows: number; value: number }[] = [];
    for (let column = 0; column < image.width; column++) {
      let start = 0;
      while (start < image.height) {
        const value = image.pixels[(start * image.width + column) * 4];
        let end = start + 1;
        while (end < image.height && image.pixels[(end * image.width + column) * 4] === value)
          end++;
        if (value) result.push({ column, row: start, rows: end - start, value });
        start = end;
      }
    }
    return result;
  }, [image, fallback]);
  const deep = shot.line.echoes.find((echo) => echo.depth === 56)!;
  const estimated = ultrasoundDepth(deep.time, shot.config.assumedSpeed);
  return (
    <div className="ultrasound-image" style={{ aspectRatio: `${w}/${h}` }}>
      <canvas
        ref={canvas}
        width={image.width}
        height={image.height}
        aria-hidden="true"
        style={{
          left: `${(left / w) * 100}%`,
          top: `${(top / h) * 100}%`,
          width: `${((right - left) / w) * 100}%`,
          height: `${((bottom - top) / h) * 100}%`,
          visibility: fallback ? 'hidden' : 'visible',
        }}
      />
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={t('B 模式扫描：每列来自同一体模的一条回波记录，灰度由包络计算。')}
      >
        <path
          d={`M 0 0 H ${w} V ${h} H 0 Z M ${left} ${top} V ${bottom} H ${right} V ${top} Z`}
          fillRule="evenodd"
          fill="#102c30"
        />
        {fallback && (
          <g shapeRendering="crispEdges">
            <rect x={left} y={top} width={right - left} height={bottom - top} fill="#000" />
            {runs.map((run, i) => (
              <rect
                key={i}
                x={left + (run.column / image.width) * (right - left)}
                y={top + (run.row / image.height) * (bottom - top)}
                width={(right - left) / image.width + 0.01}
                height={(run.rows / image.height) * (bottom - top) + 0.01}
                fill={`rgb(${run.value},${run.value},${run.value})`}
              />
            ))}
          </g>
        )}
        <rect
          x={left + (acquired / image.width) * (right - left)}
          y={top}
          width={(1 - acquired / image.width) * (right - left)}
          height={bottom - top}
          fill="#163a3c"
        />
        <path d={`M ${left} 29 H ${right}`} stroke="#6f9690" strokeOpacity=".6" />
        <rect x={x(shot.x) - 10} y="20" width="20" height="17" rx="4" fill="#cfb57c" />
        <path
          d={`M ${x(shot.x)} ${top} V ${bottom}`}
          stroke={teal}
          strokeOpacity=".5"
          strokeWidth="1"
        />
        {[0, 20, 40, 60].map((depth) => (
          <g key={depth}>
            <path d={`M ${left - 5} ${y(depth)} h 5`} stroke="#739991" />
            <text
              x={left - 9}
              y={y(depth) + 6}
              textAnchor="end"
              fill="#c0d4cc"
              fontSize={compact ? 21 : 20}
            >
              {depth}
            </text>
          </g>
        ))}
        <text x={left - 2} y={h - 8} textAnchor="end" fill="#aac6bb" fontSize="20">
          mm
        </text>
        <text x={(left + right) / 2} y={h - 8} textAnchor="middle" fill="#aac6bb" fontSize="20">
          {acquired} / {image.width}
        </text>
        {shot.focus === 'speed' && (
          <g>
            <path
              d={`M ${left} ${y(56)} H ${right}`}
              stroke={golden}
              strokeDasharray="4 6"
              strokeWidth="1.4"
            />
            <path
              d={`M ${right - 16} ${y(estimated)} H ${right + 2}`}
              stroke={coral}
              strokeWidth="2"
            />
            <path
              d={`M ${right - 8} ${y(56)} V ${y(estimated)}`}
              stroke={coral}
              strokeWidth="1.8"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
