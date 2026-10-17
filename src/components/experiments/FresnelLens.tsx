import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  fresnelDesign,
  fresnelRay,
  fresnelProfile,
  fresnelVolume,
  fresnelShot,
  fresnelConstant,
} from '../../models/fresnel-lens';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/fresnel-lens.css';
export default function FresnelLens() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [focal, setFocal] = useState(100),
    [pitch, setPitch] = useState(3),
    [radius, setRadius] = useState(22.5),
    [close, setClose] = useState(false),
    [matched, setMatched] = useState(false);
  const shot = film.watch
    ? fresnelShot(film.chapter, film.chapterProgress)
    : {
        focal,
        pitch,
        radius,
        close,
        continuous: false,
        compare: false,
        phase: false,
        outsideIndex: matched ? 1.49 : 1,
      };
  const s = fresnelDesign({ focal: shot.focal, pitch: shot.pitch }),
    probe = fresnelRay(shot.radius, s, shot.continuous, shot.outsideIndex),
    thin = fresnelVolume(s),
    full = fresnelVolume(s, true),
    W = phone ? 340 : 760,
    H = phone ? 220 : 300,
    minZ = shot.close ? 0 : -12,
    maxZ = shot.close ? 7 : s.F + 18,
    centerR = shot.close ? shot.radius : 0,
    spanR = shot.close ? 11 : 70,
    scale = Math.min((W - 40) / (maxZ - minZ), (H - 40) / spanR),
    x = (z: number) => W / 2 + (z - (minZ + maxZ) / 2) * scale,
    y = (r: number) => H / 2 - (r - centerR) * scale,
    point = (p: { z: number; r: number }) => `${x(p.z)},${y(p.r)}`,
    path = (continuous: boolean) =>
      `M${x(0)} ${y(-s.R)}L${fresnelProfile(s, continuous).map(point).join('L')}L${x(0)} ${y(s.R)}Z`,
    rayEnd = (r: number) => {
      const ray = fresnelRay(r, s, shot.continuous, shot.outsideIndex);
      return {
        ray,
        output: ray.outgoing
          ? { z: maxZ, r: r + ((maxZ - ray.surface.z) * ray.outgoing.r) / ray.outgoing.z }
          : ray.surface,
      };
    },
    incidence = (Math.acos(probe.normal.z) * 180) / Math.PI,
    refraction = probe.outgoing
      ? (Math.acos(
          Math.max(
            -1,
            Math.min(1, probe.outgoing.z * probe.normal.z + probe.outgoing.r * probe.normal.r),
          ),
        ) *
          180) /
        Math.PI
      : null;
  return (
    <section className="fresnel-study" data-watch={film.watch}>
      <header>
        <span>
          {t(
            shot.close
              ? '局部：法线决定折射方向'
              : shot.continuous
                ? '厚透镜的连续曲面'
                : '把聚光曲面分到各个环带',
          )}
        </span>
        <b>{t('折射式')}</b>
      </header>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(
          shot.close
            ? '真实环带曲面法线与折射光的等比例局部图'
            : '菲涅耳环带剖面与由各自法线计算的会聚光线',
        )}
      >
        <defs>
          <clipPath id={`${id}crop`}>
            <rect x="10" y="18" width={W - 20} height={H - 36} rx="8" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}crop)`}>
          {!shot.close && (
            <path d={`M15 ${y(0)}H${W - 15}`} stroke="#b3aca0" strokeDasharray="3 5" />
          )}
          {shot.compare && (
            <path
              d={path(true)}
              fill="#d0c1a62b"
              stroke="#ae9676"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}
          <path
            d={path(shot.continuous)}
            fill="#b8c8bd99"
            stroke="#647d72"
            strokeWidth={shot.close ? 2 : 1.5}
          />
          {(shot.close ? [shot.radius] : [-27, -19.5, -10.5, 10.5, 19.5, 27]).map((r) => {
            const { ray, output } = rayEnd(r);
            return (
              <polyline
                key={r}
                points={[{ z: minZ, r }, { z: 0, r }, ray.surface, output].map(point).join(' ')}
                fill="none"
                stroke="#ba7143"
                strokeWidth={shot.close ? 3 : 1.5}
                opacity={shot.close ? 1 : 0.8}
              />
            );
          })}
          {shot.close && (
            <>
              <path
                d={`M${point({ z: probe.surface.z - 3 * probe.normal.z, r: shot.radius - 3 * probe.normal.r })}L${point({ z: probe.surface.z + 3 * probe.normal.z, r: shot.radius + 3 * probe.normal.r })}`}
                stroke="#4d777b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx={x(probe.surface.z)} cy={y(shot.radius)} r="5" fill="#ba7143" />
            </>
          )}
          {!shot.close && shot.outsideIndex === 1 && (
            <circle cx={x(s.F)} cy={y(0)} r="4" fill="#ba7143" />
          )}
        </g>
        {!shot.close && (
          <text x={x(s.F)} y={H - 3} textAnchor="end" fontSize={phone ? 26 : 18} fill="#66543f">
            {t('设计焦点')} {s.F} mm
          </text>
        )}
      </svg>
      {shot.close ? (
        <div className="fresnel-comparison">
          <span>
            {t('入射角')} <b>{incidence.toFixed(1)}°</b>
          </span>
          <span>
            {t('折射角')} <b>{refraction?.toFixed(1)}°</b>
          </span>
        </div>
      ) : (
        <div className="fresnel-comparison">
          <span>
            {t('周围折射率')} <b>{shot.outsideIndex.toFixed(2)}</b>
          </span>
          <span>
            {t('环带数')} <b>{s.rings}</b>
          </span>
        </div>
      )}
      {shot.compare && (
        <div className="fresnel-volumes">
          <span>
            {t('连续曲面')} · {full.toFixed(2)} cm³
            <i style={{ width: '100%', background: '#b49a76' }} />
          </span>
          <span>
            {t('分环曲面')} · {thin.toFixed(2)} cm³
            <i style={{ width: `${(thin / full) * 100}%`, background: '#668576' }} />
          </span>
        </div>
      )}
      {shot.phase && (
        <div className="fresnel-phase">
          <span>{t('各环相对相位（550nm）')}</span>
          <div>
            {Array.from({ length: s.rings }, (_, j) => {
              const phase = ((fresnelConstant(j, s) - fresnelConstant(0, s)) / 0.00055) % 1;
              return (
                <i
                  key={j}
                  style={{ height: `${3 + phase * 35}px` }}
                  title={`${j + 1}: ${(phase * 360).toFixed(0)}°`}
                />
              );
            })}
          </div>
          <p>0 → 2π · {t('光程模一个波长')}</p>
        </div>
      )}
      <details>
        <summary>{t('曲面、体积与波动边界')}</summary>
        <p>
          {t(
            '环带为理想弯曲折射面，各环分别按共同轴上焦点重新设计；不是把旧曲面直接平移。入射面为平面，光沿轴进入。表面、法线、折射光和旋转体积共用同一几何，图中纵横比例相同。忽略环壁损失、色散与衍射；各环光程不相等，同一几何焦点不保证相干成像质量。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="fresnel-controls">
          <Range
            label={t('设计焦距')}
            value={focal}
            min={80}
            max={160}
            unit="mm"
            onChange={setFocal}
          />
          <Range
            label={t('环带节距')}
            value={pitch}
            min={1}
            max={5}
            step={0.25}
            unit="mm"
            onChange={setPitch}
          />
          <Range
            label={t('局部跟踪半径')}
            value={radius}
            min={5}
            max={27}
            step={0.1}
            unit="mm"
            onChange={setRadius}
          />
          <button type="button" aria-pressed={close} onClick={() => setClose(!close)}>
            {t(close ? '看完整聚光剖面' : '放大真实环带')}
          </button>
          <button type="button" aria-pressed={matched} onClick={() => setMatched(!matched)}>
            {t(matched ? '恢复空气环境' : '使周围折射率相同')}
          </button>
        </div>
      )}
    </section>
  );
}
