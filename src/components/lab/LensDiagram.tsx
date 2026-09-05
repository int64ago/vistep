import { t } from '../../i18n';
import { lensRay, thinLens } from '../../models/optics';
import { useCompact } from './useCompact';
export type LensState = {
  object: number;
  focal: number;
  sensor: number;
  height: number;
  aperture: number;
};
export default function LensDiagram({ state, time = 0 }: { state: LensState; time?: number }) {
  const compact = useCompact(),
    width = compact ? 320 : 720;
  const result = thinLens(state.focal, state.object);
  const left =
    Math.min(
      -state.object,
      -state.focal,
      result.image !== null && !result.real ? Math.max(-260, result.image) : 0,
    ) - 25;
  const right =
    Math.max(
      state.sensor,
      state.focal,
      result.real && result.image !== null && result.image < 350 ? result.image : 0,
    ) + 25;
  const scale = (width - 80) / (right - left),
    x = (v: number) => 40 + (v - left) * scale;
  const rays = [-0.5, 0, 0.5].map((v) => {
    const h = v * state.aperture;
    return { h, ray: lensRay(state.focal, state.object, state.height, h) };
  });
  const virtualEnd = Math.max(left + 10, result.image ?? 0);
  const verticalExtent = Math.max(
    35,
    ...rays.map(({ ray }) => Math.abs(ray.at(state.sensor))),
    ...(!result.real ? rays.map(({ ray }) => Math.abs(ray.at(virtualEnd))) : []),
    result.image !== null && result.image > left && result.image < right
      ? Math.abs(result.magnification! * state.height)
      : 0,
  );
  const y = (v: number) => 142 - v * Math.min(2.2, 95 / verticalExtent);
  return (
    <svg
      className="lens-diagram"
      viewBox={`0 0 ${width} 280`}
      role="img"
      aria-label={t('来自同一物点的光线，在透镜后相交；虚线表示反向延长线')}
    >
      <path d={`M35 142H${width - 35}`} stroke="#97a695" strokeDasharray="4 7" opacity=".45" />
      <path
        d={`M${x(0)} 65 Q${x(0) - (compact ? 8 : 19)} 142 ${x(0)} 219 Q${x(0) + (compact ? 8 : 19)} 142 ${x(0)} 65`}
        fill="#adc9c2"
        fillOpacity=".25"
        stroke="#86a99b"
      />
      <path d={`M${x(state.sensor)} 45V235`} stroke="#36574e" strokeWidth="4" />
      <path
        d={`M${x(-state.object)} ${y(-18)}V${y(18)}m-6 9 6-9 6 9`}
        fill="none"
        stroke="#b2884f"
        strokeWidth="3"
      />
      {[-1, 1].map((sign) => (
        <g key={sign}>
          <circle cx={x(state.focal * sign)} cy="142" r="3" fill="#86a99b" />
          <text x={x(state.focal * sign)} y="164" textAnchor="middle">
            F
          </text>
        </g>
      ))}
      {rays.map(({ h, ray }, i) => {
        const points = [
          [-state.object, state.height],
          [0, h],
          [state.sensor, ray.at(state.sensor)],
        ];
        const phase = (time * 0.24 + i / 3) % 1,
          leg = phase < 0.6 ? 0 : 1,
          p = leg === 0 ? phase / 0.6 : (phase - 0.6) / 0.4;
        const a = points[leg],
          b = points[leg + 1];
        return (
          <g key={i}>
            <polyline
              points={points.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')}
              stroke="#bd8b42"
              strokeWidth="1.6"
              opacity=".78"
              fill="none"
            />
            {!result.real && result.image !== null && (
              <path
                d={`M${x(0)} ${y(h)}L${x(virtualEnd)} ${y(ray.at(virtualEnd))}`}
                stroke="#aa9370"
                fill="none"
                strokeDasharray="5 5"
              />
            )}
            <circle
              cx={x(a[0] + (b[0] - a[0]) * p)}
              cy={y(a[1] + (b[1] - a[1]) * p)}
              r="3.5"
              fill="#d8af64"
            />
            <circle cx={x(state.sensor)} cy={y(ray.at(state.sensor))} r="3" fill="#d8af64" />
          </g>
        );
      })}
      {result.image !== null && result.image > left && result.image < right && (
        <circle
          cx={x(result.image)}
          cy={y(result.magnification! * state.height)}
          r="4"
          fill={result.real ? '#669782' : '#a98eaf'}
        />
      )}
      <text
        x={x(-state.object)}
        y={compact && x(0) - x(-state.object) < 48 ? 230 : 259}
        textAnchor="middle"
      >
        {t('物体')}
      </text>
      <text x={x(0)} y="259" textAnchor="middle">
        {t('透镜')}
      </text>
      <text x={x(state.sensor)} y="259" textAnchor="middle">
        {t('成像屏')}
      </text>
    </svg>
  );
}
