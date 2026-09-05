import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  microscopeRay,
  microscopeSystem,
  microscopeAxialPeak,
  microscopeIntensity,
  microscopeImage,
  type MicroscopeField,
  type MicroscopeShot,
} from '../../models/microscope';

const gold = '#e0c185',
  mint = '#a7d7c7',
  coral = '#dfaa99';

export function MicroscopeBench({ shot, compact }: { shot: MicroscopeShot; compact: boolean }) {
  const { system, config } = shot;
  const w = compact ? 320 : 920,
    h = compact ? 430 : 390;
  const xy = (z: number, height: number) =>
    compact
      ? { x: 151 + height * 35, y: 400 - (z + system.u) * 1.72 }
      : { x: 42 + (z + 15) * 3.65, y: 190 - height * 48 };
  const point = (z: number, height: number) => {
    const p = xy(z, height);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  };
  const throughEye = shot.focus === 'ocular' || shot.focus === 'empty';
  const endZ = throughEye ? system.eyeZ + 26 : 160;
  const stop = -system.u + (endZ + system.u) * shot.reveal;
  const rays = [-1, -0.5, 0, 0.5, 1].map((fraction) =>
    microscopeRay(config, shot.marker, fraction),
  );
  const rayPath = (ray: (typeof rays)[number], end: number) => {
    const pts = ray.points.filter((p) => p.z <= end);
    const next = ray.points.find((p) => p.z > end),
      previous = pts.at(-1);
    if (next && previous)
      pts.push({
        z: end,
        h: previous.h + ((next.h - previous.h) * (end - previous.z)) / (next.z - previous.z),
      });
    return pts.map((p, i) => `${i ? 'L' : 'M'}${point(p.z, p.h)}`).join(' ');
  };
  const lens = (z: number, radius: number, isEye: boolean) => {
    const p = xy(z, 0),
      r = radius * (compact ? 35 : 48);
    return (
      <g key={z} transform={`translate(${p.x} ${p.y})${compact ? ' rotate(90)' : ''}`}>
        <path
          d={`M0 ${-r} Q-11 0 0 ${r} Q11 0 0 ${-r}`}
          fill={isEye ? '#b9c8de' : '#add5cb'}
          fillOpacity=".2"
          stroke={isEye ? '#aebbcf' : mint}
          strokeWidth="1.3"
        />
        <path
          d={`M0 ${-r} V${r}`}
          stroke={isEye ? '#cfdaeb' : '#bedbd0'}
          strokeOpacity=".5"
          strokeDasharray="3 4"
        />
        <path
          d={`M-12 ${-r - 8} H12 M-12 ${r + 8} H12`}
          stroke="#6d798a"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    );
  };
  const object = xy(-system.u, shot.marker),
    real = xy(system.imageDistance, (-system.imageDistance / system.u) * shot.marker);
  return (
    <svg
      className="microscope-bench"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('追踪标本、物镜、固定像面与目镜之间的近轴光线。')}
    >
      <path
        d={`M${point(-system.u - 2, 0)} L${point(system.eyeZ + 26, 0)}`}
        stroke="#7a879d"
        strokeOpacity=".5"
        strokeDasharray="3 6"
      />
      <path
        d={`M${point(160, -1.3)} L${point(160, 1.3)}`}
        stroke={coral}
        strokeWidth="9"
        strokeOpacity=".13"
      />
      <path d={`M${point(160, -1.3)} L${point(160, 1.3)}`} stroke={coral} strokeWidth="1.1" />
      {rays.map((ray, i) => (
        <g key={ray.pupilFraction}>
          <path
            d={rayPath(ray, endZ)}
            stroke={i % 2 ? mint : gold}
            strokeOpacity=".09"
            fill="none"
          />
          <path
            d={rayPath(ray, stop)}
            stroke={i % 2 ? mint : gold}
            strokeOpacity={i === 2 ? 0.85 : 0.6}
            strokeWidth={i === 2 ? 1.8 : 1.25}
            fill="none"
          />
        </g>
      ))}
      {lens(0, system.pupil, false)}
      {lens(system.eyeZ, 2.5, true)}
      <circle cx={object.x} cy={object.y} r="4" fill={gold} />
      {shot.reveal > 0.98 && <circle cx={real.x} cy={real.y} r="4" fill={coral} />}
      <path
        d={`M${point(-system.u, -0.12)} L${point(-system.u, 0.12)}`}
        stroke={gold}
        strokeWidth="2"
      />
      {!compact && (
        <>
          <text x="22" y="47" fill={gold} fontSize="22">
            {t('标本点')}
          </text>
          <path
            d={`M53 58 V155 L${point(-system.u, shot.marker)}`}
            stroke={gold}
            opacity=".35"
            fill="none"
          />
          <text x={xy(0, 0).x + 20} y="340" fill={mint} fontSize="22">
            {t('物镜')} · f = 8 mm
          </text>
          <text x={xy(160, 0).x - 18} y="69" textAnchor="end" fill={coral} fontSize="22">
            {t('固定中间像面')}
          </text>
          <text x={xy(system.eyeZ, 0).x + 20} y="340" fill="#cbd5e4" fontSize="22">
            {t('目镜')}
          </text>
          <path d={`M${point(0, -2.55)} L${point(160, -2.55)}`} stroke="#7b8697" />
          <text
            x={(xy(0, 0).x + xy(160, 0).x) / 2}
            y="337"
            textAnchor="middle"
            fill="#9daabd"
            fontSize="22"
          >
            v = 160 mm
          </text>
          <text x="460" y="380" textAnchor="middle" fill="#99a8bc" fontSize="21">
            {t('轴向与横向比例不同 · 折转发生在薄透镜主平面')}
          </text>
        </>
      )}
      {compact && (
        <>
          <text x="20" y="421" fill={gold} fontSize="20">
            {t('标本点')}
          </text>
          <text x="225" y={xy(0, 0).y - 13} fill={mint} fontSize="20">
            {t('物镜')}
          </text>
          <text x="18" y={xy(160, 0).y - 12} fill={coral} fontSize="20">
            {t('中间像面')}
          </text>
          <text x="247" y={xy(system.eyeZ, 0).y + 6} fill="#cbd5e4" fontSize="20">
            {t('目镜')}
          </text>
          <text
            x="303"
            y="252"
            transform="rotate(-90 303 252)"
            textAnchor="middle"
            fill="#9daabd"
            fontSize="20"
          >
            v = 160 mm
          </text>
        </>
      )}
    </svg>
  );
}

export function MicroscopeSpecimen({
  field,
  compact,
}: {
  field: MicroscopeField;
  compact: boolean;
}) {
  const raster = useMemo(() => microscopeImage(field), [field]);
  const canvas = useRef<HTMLCanvasElement>(null),
    id = useId().replaceAll(':', '');
  const [fallback, setFallback] = useState(true);
  useEffect(() => {
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.current?.getContext('2d') ?? null;
      if (!context) {
        setFallback(true);
        return;
      }
      context.putImageData(
        new ImageData(new Uint8ClampedArray(raster.pixels), raster.size, raster.size),
        0,
        0,
      );
      setFallback(false);
    } catch {
      setFallback(true);
    }
    return () => context?.clearRect(0, 0, raster.size, raster.size);
  }, [raster]);
  const runs = useMemo(() => {
    if (!fallback) return [];
    const result: { x: number; y: number; length: number; r: number; g: number; b: number }[] = [];
    for (let y = 0; y < raster.size; y++) {
      let x = 0;
      while (x < raster.size) {
        const at = (y * raster.size + x) * 4,
          r = raster.pixels[at],
          g = raster.pixels[at + 1],
          b = raster.pixels[at + 2];
        let length = 1;
        while (
          x + length < raster.size &&
          raster.pixels[at + length * 4] === r &&
          raster.pixels[at + length * 4 + 1] === g &&
          raster.pixels[at + length * 4 + 2] === b
        )
          length++;
        result.push({ x, y, length, r, g, b });
        x += length;
      }
    }
    return result;
  }, [raster, fallback]);
  const bar = field.span > 10 ? 4 : 2,
    scale = 280 / field.span;
  return (
    <div className="microscope-specimen">
      <canvas ref={canvas} width={raster.size} height={raster.size} aria-hidden="true" />
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label={t('荧光点标本的计算图像：位置、大小与离焦均来自同一圆形孔径模型。')}
      >
        <defs>
          <clipPath id={`${id}-field`}>
            <circle cx="160" cy="160" r="138" />
          </clipPath>
        </defs>
        {fallback && (
          <g clipPath={`url(#${id}-field)`} shapeRendering="crispEdges">
            {runs.map((run, i) => (
              <rect
                key={i}
                x={20 + (run.x / raster.size) * 280}
                y={20 + (run.y / raster.size) * 280}
                width={(run.length / raster.size) * 280 + 0.03}
                height={280 / raster.size + 0.03}
                fill={`rgb(${run.r},${run.g},${run.b})`}
              />
            ))}
          </g>
        )}
        <circle
          cx="160"
          cy="160"
          r="141"
          stroke="#839391"
          strokeOpacity=".45"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M13 160h10 M297 160h10 M160 13v10 M160 297v10"
          stroke="#b4c1c8"
          strokeOpacity=".5"
        />
        <path d={`M30 297 h${bar * scale}`} stroke={gold} strokeWidth="2.5" />
        <text x="30" y="282" fontSize={compact ? 20 : 19} fill={gold}>
          {bar} µm
        </text>
      </svg>
    </div>
  );
}

export function MicroscopeProfile({
  shot,
  field,
  depth,
  compact,
}: {
  shot: MicroscopeShot;
  field: MicroscopeField;
  depth?: boolean;
  compact: boolean;
}) {
  const w = compact ? 320 : 430,
    h = compact ? 143 : 218;
  const left = 30,
    right = w - 20,
    top = compact ? 34 : 60,
    bottom = h - 35;
  const samples = Array.from({ length: 241 }, (_, i) => {
    const x = (i / 240 - 0.5) * (depth ? 80 : 12);
    const value = depth
      ? microscopeAxialPeak(microscopeSystem({ ...shot.config, focus: x }, 0).beta)
      : microscopeIntensity(field, x, 0);
    return { x, value };
  });
  const max = depth ? 1 : Math.max(1, ...samples.map((s) => s.value));
  const path = samples
    .map(
      (s, i) =>
        `${i ? 'L' : 'M'}${left + (i / 240) * (right - left)},${bottom - (s.value / max) * (bottom - top)}`,
    )
    .join(' ');
  return (
    <svg
      className="microscope-profile"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t(
        depth
          ? '轴向峰值曲线：相同圆形孔径的离焦响应，横轴为标本偏离焦点的距离。'
          : '双点强度剖面：两点的衍射强度相加，高孔径时中间出现低谷。',
      )}
    >
      <text x={left} y={compact ? 23 : 31} fill="#b9c5d5" fontSize={compact ? 20 : 22}>
        {t(depth ? '轴向点像峰值' : '双点强度剖面')}
      </text>
      <path d={`M${left} ${bottom} H${right}`} stroke="#67738b" />
      {depth && (
        <path
          d={`M${left} ${(bottom + top) / 2} H${right}`}
          stroke="#6d7287"
          strokeDasharray="3 5"
        />
      )}
      <path d={path} stroke={gold} strokeWidth="2" fill="none" />
      {(depth ? [-40, 0, 40] : [-6, 0, 6]).map((value, index) => {
        const x = left + (index / 2) * (right - left);
        return (
          <text
            key={value}
            x={x}
            y={h - 10}
            textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'}
            fill="#aab7c9"
            fontSize={compact ? 20 : 21}
          >
            {value}
            {index === 2 ? ' µm' : ''}
          </text>
        );
      })}
    </svg>
  );
}

export function MicroscopeFocusRail({ shot, compact }: { shot: MicroscopeShot; compact: boolean }) {
  const w = compact ? 320 : 430,
    h = compact ? 108 : 190;
  const from = 35,
    to = w - 30,
    y = compact ? 56 : 105;
  const position = (value: number) => from + ((value + 24) / 48) * (to - from);
  return (
    <svg
      className="microscope-focus-rail"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('载物台调焦尺：两个标本层相隔 20 µm，调焦改变它们与物镜的距离。')}
    >
      <text x={from} y={compact ? 24 : 37} fill="#bec8d9" fontSize={compact ? 20 : 22}>
        {t('载物台调焦')}
      </text>
      <text
        x={to}
        y={compact ? 24 : 37}
        textAnchor="end"
        fill="#aab8cb"
        fontSize={compact ? 20 : 21}
      >
        µm
      </text>
      <path d={`M${from} ${y}H${to}`} stroke="#6d7890" strokeWidth="4" strokeLinecap="round" />
      {[-20, 0, 20].map((value) => (
        <g key={value}>
          <path d={`M${position(value)} ${y - 6}v12`} stroke="#9aa7be" />
          <text
            x={position(value)}
            y={y + 31}
            textAnchor="middle"
            fill="#aab8cb"
            fontSize={compact ? 20 : 21}
          >
            {value}
          </text>
        </g>
      ))}
      {shot.config.layers &&
        [0, 20].map((value) => (
          <circle
            key={value}
            cx={position(value)}
            cy={y}
            r="6"
            fill="none"
            stroke={coral}
            strokeWidth="2"
          />
        ))}
      <path d={`M${position(shot.config.focus) - 7} ${y - 23} l7 10 7-10Z`} fill={gold} />
    </svg>
  );
}

export function MicroscopePupil({ shot }: { shot: MicroscopeShot }) {
  const radius =
    (shot.system.pupil / (0.24 * microscopeSystem({ ...shot.config, focus: 0 }).u)) * 42;
  return (
    <svg
      className="microscope-pupil"
      viewBox="0 0 120 120"
      aria-label={t('物镜圆形孔径，开口半径与光路中的通光半径一致。')}
      role="img"
    >
      <circle cx="60" cy="60" r="51" fill="#283347" stroke="#6e7e93" />
      <circle cx="60" cy="60" r={radius} fill="#afc9c4" fillOpacity=".6" stroke={mint} />
      <path d={`M60 60h${radius}`} stroke={gold} strokeWidth="2" />
      <circle cx="60" cy="60" r="2" fill={gold} />
    </svg>
  );
}
