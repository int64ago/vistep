import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  grating,
  gratingShot,
  gratingOrders,
  gratingIntensity,
} from '../../models/diffraction-grating';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/diffraction-grating.css';
export default function DiffractionGrating() {
  const film = useShowcase(),
    phone = useCompact();
  const [N, setN] = useState(12),
    [d, setD] = useState(3000),
    [a, setA] = useState(500),
    [u, setU] = useState(550 / 3000);
  const s = film.watch
    ? gratingShot(film.chapter, film.chapterProgress)
    : { slits: N, spacing: d, width: Math.min(a, d), wavelength: 550, sine: u, white: false };
  const selected = grating(s.sine, s),
    W = phone ? 340 : 760,
    H = phone ? 190 : 220;
  const patterns = useMemo(() => {
    const options = {
      slits: s.slits,
      spacing: s.spacing,
      width: s.width,
      wavelength: s.wavelength,
    };
    const curves = (s.white ? [450, 550, 650] : [550]).map((lambda) =>
      Array.from(
        { length: 801 },
        (_, j) =>
          `${20 + (j / 800) * (W - 40)},${H - 25 - gratingIntensity(j / 400 - 1, { ...options, wavelength: lambda }).normalized * (H - 50)}`,
      ).join(' '),
    );
    const envelope = Array.from(
      { length: 401 },
      (_, j) =>
        `${20 + (j / 400) * (W - 40)},${H - 25 - gratingIntensity(j / 200 - 1, options).envelope * (H - 50)}`,
    ).join(' ');
    const exposure = Array.from({ length: 321 }, (_, j) =>
      Math.sqrt(gratingIntensity(j / 160 - 1, options).normalized),
    );
    return { curves, envelope, exposure };
  }, [s.slits, s.spacing, s.width, s.wavelength, s.white, W, H]);
  const phaseView = film.watch && (film.chapter === 2 || film.chapter === 3);
  // A fixed scale within each composition preserves vector lengths. Center the
  // actual chain so the closed polygon remains large enough to inspect.
  const phaseScale = phone ? 220 : 300,
    phaseX =
      W / 2 -
      ((Math.min(...selected.phasors.map((p) => p.x)) +
        Math.max(...selected.phasors.map((p) => p.x))) *
        phaseScale) /
        2,
    phaseY =
      H / 2 +
      ((Math.min(...selected.phasors.map((p) => p.y)) +
        Math.max(...selected.phasors.map((p) => p.y))) *
        phaseScale) /
        2;
  const points = selected.phasors
    .map((p) => `${phaseX + p.x * phaseScale},${phaseY - p.y * phaseScale}`)
    .join(' ');
  return (
    <section className="grating-study" data-watch={film.watch}>
      <header>
        <span>{t('许多条缝，筛出少数方向')}</span>
        <b>N = {s.slits}</b>
      </header>
      <div
        className="grating-object"
        style={{ width: `${s.slits * s.spacing * (phone ? 0.0025 : 0.005)}px` }}
        aria-label={t('均匀间隔的有限宽度狭缝')}
      >
        {Array.from({ length: s.slits }, (_, j) => (
          <i
            key={j}
            style={{
              width: `${((s.width / s.spacing) * 100) / s.slits}%`,
              left: `${((j + 0.5) / s.slits) * 100}%`,
            }}
          />
        ))}
      </div>
      {phaseView ? (
        <div className="grating-phase">
          <span>{t('每条缝贡献一个相量')}</span>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('同一观察方向上的多缝相量求和')}>
            <polyline points={points} stroke="#d4c28a" strokeWidth="2.5" fill="none" />
            {selected.phasors.map((p, j) => (
              <circle
                key={j}
                cx={phaseX + p.x * phaseScale}
                cy={phaseY - p.y * phaseScale}
                r="3"
                fill="#d4c28a"
              />
            ))}
            <path
              d={`M${phaseX} ${phaseY}L${phaseX + selected.phasors.at(-1)!.x * phaseScale} ${phaseY - selected.phasors.at(-1)!.y * phaseScale}`}
              stroke="#91b7b9"
              strokeWidth="4"
            />
          </svg>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('按sinθ排列的归一化多缝强度')}>
          <path d={`M20 ${H - 25}H${W - 20}`} stroke="#b8c6c455" />
          {(s.white ? [450, 550, 650] : [550]).map((lambda, j) => (
            <polyline
              key={lambda}
              points={patterns.curves[j]}
              stroke={s.white ? ['#8daacb', '#b2c980', '#d99576'][j] : '#d4c28a'}
              strokeWidth="2"
              fill="none"
            />
          ))}
          {film.watch && film.chapter === 6 && (
            <polyline
              points={patterns.envelope}
              stroke="#8ba7ab"
              strokeDasharray="4 5"
              fill="none"
            />
          )}
          <path
            d={`M${20 + ((s.sine + 1) / 2) * (W - 40)} 14V${H - 25}`}
            stroke="#e6e5cf"
            strokeDasharray="3 5"
            opacity=".65"
          />
        </svg>
      )}
      {!phaseView && (
        <div className="grating-axis">
          <span>sinθ = −1</span>
          <span>0</span>
          <span>+1</span>
        </div>
      )}
      <div className="grating-exposure">
        {patterns.exposure.map((opacity, j) => (
          <i key={j} style={{ opacity }} />
        ))}
        <b style={{ left: `${((s.sine + 1) / 2) * 100}%` }} />
      </div>
      <div className="grating-readings">
        <span>
          {t('跟踪角度')}
          <b>{((Math.asin(s.sine) * 180) / Math.PI).toFixed(2)}°</b>
        </span>
        <span>
          {t(film.watch && film.chapter === 5 ? '最高级次 |m|' : '强度 / 中心峰')}
          <b>
            {film.watch && film.chapter === 5
              ? Math.floor(s.spacing / s.wavelength)
              : selected.normalized.toFixed(3)}
          </b>
        </span>
      </div>
      <p className="grating-dimensions">
        d {(s.spacing / 1000).toFixed(1)} µm · a {(s.width / 1000).toFixed(1)} µm · λ 550 nm
      </p>
      <details>
        <summary>{t('归一化与远场条件')}</summary>
        <p>
          {t(
            '各缝相干、等振幅、均匀照明，矩形缝的标量夫琅禾费近似。曲线除以各自中心峰N²，颜色条用平方根显示强弱，不是固定曝光照片。有限缝宽的衍射包络可能消去某些干涉级次。',
          )}
        </p>
        <p>
          {t('可传播级次')}：
          {gratingOrders(s.spacing, s.wavelength)
            .map((v) => v.order)
            .join(' · ')}
        </p>
      </details>
      {!film.watch && (
        <div className="grating-controls">
          <Range label={t('狭缝数量')} value={N} min={2} max={24} onChange={setN} />
          <Range
            label={t('缝中心间距')}
            value={d}
            min={1500}
            max={4000}
            step={100}
            unit="nm"
            onChange={setD}
          />
          <Range
            label={t('单缝宽度')}
            value={a}
            min={100}
            max={1500}
            step={100}
            unit="nm"
            onChange={setA}
          />
          <Range
            label={t('观察方向sinθ')}
            value={u}
            min={-0.95}
            max={0.95}
            step={0.001}
            onChange={setU}
          />
        </div>
      )}
    </section>
  );
}
