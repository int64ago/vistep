import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  aberrationSetup,
  aberrationSurface,
  aberrationRay,
  aberrationSpot,
  aberrationBestScreen,
  aberrationShot,
} from '../../models/spherical-aberration';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/spherical-aberration.css';
export default function SphericalAberration() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [aperture, setAperture] = useState(40),
    [screen, setScreen] = useState(-50),
    [correction, setCorrection] = useState(0),
    [angle, setAngle] = useState(0),
    [close, setClose] = useState(false);
  const shot = film.watch
      ? aberrationShot(film.chapter, film.chapterProgress)
      : { aperture, screen, correction, angle, close },
    s = aberrationSetup(shot),
    spot = aberrationSpot(shot.screen, shot),
    spotHalfSpan = film.watch && film.chapter === 5 ? 2 : 10,
    W = phone ? 340 : 760,
    H = phone ? 200 : 300,
    minZ = shot.close ? -57 : -74,
    maxZ = shot.close ? -40 : 6,
    centerX = shot.close ? spot.chief.x : 0,
    span = shot.close ? 12 : 92,
    scale = Math.min((W - 36) / (maxZ - minZ), (H - 30) / span),
    x = (z: number) => W / 2 + (z - (minZ + maxZ) / 2) * scale,
    y = (h: number) => H / 2 - (h - centerX) * scale,
    profile = Array.from({ length: 101 }, (_, i) => {
      const p = aberrationSurface(-s.A + (2 * s.A * i) / 100, shot);
      return `${x(p.z)},${y(p.r)}`;
    }).join(' '),
    meridians = [-1, -0.85, -0.65, -0.4, -0.12, 0.12, 0.4, 0.65, 0.85, 1].map((q) =>
      aberrationRay(Math.abs(q) * s.A, q < 0 ? Math.PI : 0, shot),
    ),
    marginal = aberrationRay(s.A, 0, { ...shot, angle: 0 }).axisAt,
    delta = aberrationSurface(s.A, shot).z - aberrationSurface(s.A, { ...shot, correction: 0 }).z;
  return (
    <section className="aberration-study" data-watch={film.watch} data-chapter={film.chapter}>
      <header>
        <span>{t(shot.close ? '局部：接收面切过同一束反射光' : '不同高度，不同轴上交点')}</span>
        <b>{t(s.correction === 0 ? '球面' : s.correction === 1 ? '抛物面' : '连续改变面形')}</b>
      </header>
      <svg
        className="aberration-rays"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(
          shot.close
            ? '同尺度焦区局部，接收面与实际三维反射光的截面'
            : '球面反射镜的连续入射反射光路，不同孔径高度给出不同交点',
        )}
      >
        <defs>
          <clipPath id={`${id}crop`}>
            <rect x="12" y="12" width={W - 24} height={H - 24} rx="10" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}crop)`}>
          <path d={`M12 ${y(0)}H${W - 12}`} stroke="#74877f" strokeDasharray="3 5" />
          {!shot.close && (
            <>
              <polyline
                points={Array.from({ length: 101 }, (_, i) => {
                  const p = aberrationSurface(-40 + 0.8 * i, { ...shot, aperture: 40 });
                  return `${x(p.z)},${y(p.r)}`;
                }).join(' ')}
                fill="none"
                stroke="#6b7775"
                strokeWidth="8"
              />
              <polyline points={profile} fill="none" stroke="#d5dfd5" strokeWidth="3" />
            </>
          )}
          {meridians.map((ray, i) => {
            const end = ray.at(minZ),
              incomingX = ray.hit.x + (minZ - ray.hit.z) * Math.tan((s.angle * Math.PI) / 180),
              color = i === 0 || i === meridians.length - 1 ? '#e5b274' : '#b9d2c0';
            return (
              <polyline
                key={i}
                points={
                  shot.close
                    ? `${x(minZ)},${y(end.x)} ${x(maxZ)},${y(ray.at(maxZ).x)}`
                    : `${x(minZ)},${y(incomingX)} ${x(ray.hit.z)},${y(ray.hit.x)} ${x(minZ)},${y(end.x)}`
                }
                fill="none"
                stroke={color}
                strokeWidth={i === 0 || i === meridians.length - 1 ? 2 : 1.25}
                opacity={i === 0 || i === meridians.length - 1 ? 1 : 0.65}
              />
            );
          })}
          <path d={`M${x(shot.screen)} 12V${H - 12}`} stroke="#edd9ad" strokeWidth="2" />
          {shot.close && s.angle === 0 && (
            <>
              {[-s.focal, marginal].map(
                (z, i) =>
                  z !== null && (
                    <circle
                      key={i}
                      cx={x(z)}
                      cy={y(0)}
                      r="4"
                      fill={i === 0 ? '#b9d2c0' : '#e5b274'}
                    />
                  ),
              )}
            </>
          )}
        </g>
      </svg>
      <div className="aberration-screen-position">
        {t('接收面距顶点')} {(-shot.screen).toFixed(2)} mm ·{' '}
        {t(shot.close ? '焦区局部，纵横同尺度' : '完整剖面，纵横同尺度')}
      </div>
      {film.watch && film.chapter === 4 && (
        <div className="aberration-profile-change">
          <span>
            {t('相对球面的形变量（纵向放大）')} · {delta.toFixed(3)} mm
          </span>
          <svg viewBox="0 0 340 48" aria-hidden="true">
            <path d="M15 42H325" stroke="#70867a" />
            <polyline
              points={Array.from({ length: 81 }, (_, i) => {
                const r = -s.A + (2 * s.A * i) / 80,
                  z =
                    aberrationSurface(r, shot).z -
                    aberrationSurface(r, { ...shot, correction: 0 }).z;
                return `${15 + (i * 310) / 80},${42 - z * 100}`;
              }).join(' ')}
              fill="none"
              stroke="#d5c69c"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
      <div className="aberration-observation">
        <figure>
          <svg
            viewBox="0 0 120 120"
            role="img"
            aria-label={t('同一接收面上的三维反射光斑，固定尺度跟随主光线')}
          >
            <circle cx="60" cy="60" r="50" fill="#213b3f" stroke="#8fa79955" />
            {spot.points.map((p, i) => (
              <circle
                key={i}
                cx={60 + ((p.x - spot.chief.x) * 50) / spotHalfSpan}
                cy={60 + ((p.y - spot.chief.y) * 50) / spotHalfSpan}
                r=".85"
                fill="#efdbac"
                opacity=".6"
              />
            ))}
            <path d="M56 60h8M60 56v8" stroke="#8fa799" />
          </svg>
          <figcaption>
            {t('光斑半径范围')} ±{spotHalfSpan} mm
          </figcaption>
        </figure>
        <div className="aberration-values">
          <span>
            {t('几何RMS半径')}
            <b>{spot.rms.toFixed(3)} mm</b>
          </span>
          <span>
            {t('有效口径面积')}
            <b>{(100 * spot.throughput).toFixed(1)}%</b>
          </span>
        </div>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('反射、光斑与波动边界')}</summary>
          <p>
            {t(
              '镜面顶点z=0，反射返回负z；球面曲率半径100mm，抛物面近轴焦距同为50mm。反射使用真实三维法线，光斑按圆孔径等面积取样；RMS绕光斑质心计算，显示窗跟随主光线。接收面仅作诊断，不遮挡入射光。未计衍射、粗糙度、镀膜与探测器响应；零几何光斑不表示真实无限分辨率。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="aberration-controls">
          <Range
            label={t('口径半径')}
            value={aperture}
            min={5}
            max={40}
            unit="mm"
            onChange={setAperture}
          />
          <Range
            label={t('接收面距顶点')}
            value={-screen}
            min={44}
            max={51}
            step={0.05}
            unit="mm"
            onChange={(v) => setScreen(-v)}
          />
          <Range
            label={t('面形校正比例')}
            value={correction}
            min={0}
            max={1}
            step={0.01}
            onChange={setCorrection}
          />
          <Range
            label={t('离轴入射角')}
            value={angle}
            min={0}
            max={5}
            step={0.1}
            unit="°"
            onChange={setAngle}
          />
          <button type="button" onClick={() => setScreen(aberrationBestScreen(shot))}>
            {t('放到轴上最小RMS面')}
          </button>
          <button type="button" aria-pressed={close} onClick={() => setClose(!close)}>
            {t(close ? '看完整反射镜' : '放大焦区')}
          </button>
        </div>
      )}
    </section>
  );
}
