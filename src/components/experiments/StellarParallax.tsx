import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { parallaxDistance, parallaxModel, parallaxState } from '../../models/stellar-parallax';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/stellar-parallax.css';
export default function StellarParallax() {
  const d = useShowcase(),
    id = useId(),
    [distance, setDistance] = useState(1),
    [baseline, setBaseline] = useState(1),
    [latitude, setLatitude] = useState(90),
    [motion, setMotion] = useState(0),
    [year, setYear] = useState(0.25),
    c = d.watch ? Math.min(5, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1;
  const dist = d.watch ? (c === 1 && p >= 0.5 ? 2 : 1) : distance,
    B = d.watch ? (c === 2 && p >= 0.5 ? 0.5 : c === 5 && p >= 0.4 ? 0 : 1) : baseline,
    beta = d.watch ? (c === 3 ? (p < 1 / 3 ? 0 : p < 2 / 3 ? 45 : 90) : 90) : latitude,
    mu = d.watch ? (c === 4 ? 0.35 : 0) : motion,
    epoch = d.watch
      ? c === 0
        ? p < 0.5
          ? 0.25
          : 0.75
        : c === 3
          ? 0.125 + p * 0.25
          : c === 4
            ? 2 * Math.min(1, p / 0.8)
            : 0.25
      : year;
  const model = useMemo(() => parallaxModel(dist, B, beta, mu), [dist, B, beta, mu]),
    state = parallaxState(epoch, model),
    path = useMemo(
      () => Array.from({ length: 161 }, (_, i) => parallaxState(i / 80, model)),
      [model],
    ),
    radius = 3,
    screen = (value: { x: number; y: number }) => ({
      x: 180 + (value.x / radius) * 110,
      y: 132 - (value.y / radius) * 110,
    }),
    point = screen(state),
    inferred = parallaxDistance(B, model.arcseconds),
    a = screen(parallaxState(0.25, model)),
    b = screen(parallaxState(0.75, model));
  const draw = (items: typeof path) =>
    items
      .map((v, i) => {
        const pos = screen(v);
        return `${i ? 'L' : 'M'}${pos.x} ${pos.y}`;
      })
      .join(' ');
  return (
    <section
      className="parallax-study"
      data-watch={d.watch}
      aria-label={t('恒星视差、基线与自行实验')}
    >
      <header>
        <span>PARALLAX / ANGULAR PLATE</span>
        <b>{t('天空局部放大，角秒坐标')}</b>
      </header>
      <div
        className="parallax-plate"
        role="img"
        aria-label={t('地球轨道与恒星相对固定参考的角位移')}
      >
        <svg viewBox="0 0 360 260">
          <path className="parallax-crosshair" d="M20 132H325M180 20V240" />
          {[
            { x: 46, y: 65 },
            { x: 283, y: 90 },
            { x: 85, y: 214 },
            { x: 297, y: 219 },
          ].map((ref, i) => (
            <path
              key={i}
              className="parallax-reference"
              d={`M${ref.x - 4} ${ref.y}H${ref.x + 4}M${ref.x} ${ref.y - 4}V${ref.y + 4}`}
            />
          ))}
          <g transform="translate(305 55)">
            <circle className="parallax-orbit" r={20 * B} />
            <circle className="parallax-sun" r="4" />
            <circle
              className="parallax-observer"
              cx={state.observer.x * 20}
              cy={-state.observer.y * 20}
              r="4"
            />
          </g>
          <path className="parallax-track" d={draw(path)} />
          {c === 0 && d.watch && (
            <>
              <path className="parallax-baseline" d={`M${a.x} ${a.y + 14}L${b.x} ${b.y + 14}`} />
              <circle className="parallax-ghost" cx={a.x} cy={a.y} r="5" />
              <circle className="parallax-ghost" cx={b.x} cy={b.y} r="5" />
            </>
          )}
          <circle className="parallax-target" cx={point.x} cy={point.y} r="5" />
        </svg>
        <span className="parallax-top">+{radius.toFixed(1)}″</span>
        <span className="parallax-bottom">−{radius.toFixed(1)}″</span>
        <b
          className="parallax-current"
          style={{ left: `${(point.x / 360) * 100}%`, top: `${(point.y / 260) * 100}%` }}
        >
          ★
        </b>
      </div>
      <p className="parallax-epoch">
        t = {epoch.toFixed(2)} {t('年')} · β = {beta}°
      </p>
      <div className="parallax-values">
        <span>
          p<b>{model.arcseconds.toFixed(3)}″</b>
        </span>
        <span>
          B<b>{B.toFixed(1)} AU</b>
        </span>
        <span>
          {t('由视差估距')}
          <b>{inferred === null ? '—' : `${inferred.toFixed(2)} pc`}</b>
        </span>
      </div>
      <p className="parallax-note">
        {c === 0 && d.watch
          ? t('半年两端位移为 2p；p 是半幅。')
          : c === 4
            ? t('同一季节一年后的额外漂移为 0.35″。')
            : B === 0
              ? t('B = 0 时没有视差，不能由它估距。')
              : t('固定参考十字；轨道小图与天空视图分别缩放。')}
      </p>
      {!d.watch && (
        <div className="parallax-controls">
          {(
            [
              {
                key: 'distance',
                label: t('距离 pc'),
                value: distance,
                min: 0.5,
                max: 10,
                step: 0.1,
                set: setDistance,
              },
              {
                key: 'baseline',
                label: t('轨道半径 B，AU'),
                value: baseline,
                min: 0,
                max: 1,
                step: 0.1,
                set: setBaseline,
              },
              {
                key: 'latitude',
                label: t('黄纬 β'),
                value: latitude,
                min: 0,
                max: 90,
                step: 1,
                set: setLatitude,
              },
              {
                key: 'motion',
                label: t('横向自行，角秒/年'),
                value: motion,
                min: -0.35,
                max: 0.35,
                step: 0.05,
                set: setMotion,
              },
              {
                key: 'epoch',
                label: t('观测历元，年'),
                value: year,
                min: 0,
                max: 2,
                step: 0.01,
                set: setYear,
              },
            ] as const
          ).map((control) => (
            <label key={control.key} htmlFor={`${id}-${control.key}`}>
              {control.label} · {control.value}
              <input
                id={`${id}-${control.key}`}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(e) => control.set(+e.target.value)}
              />
            </label>
          ))}
        </div>
      )}
      <details>
        <summary>{t('视差不等于所有的自行或摇摆')}</summary>
        <p>
          {t(
            '圆形观测轨道半径 B，以 AU 为单位，半年两端相距 2B。以固定远参考定义局部切平面，真实视线向量投影后取角；p 是半视差，p≈B/d，角秒与 pc 对应。黄纬改变投影形状，极点近圆、黄道近线；另加恒定横向自行，年后位置不完全重复。只演示已知量，不拟合真实测量，不含像差、消光、噪声、伴星或参考源有限视差。天空角度被明确放大，背景十字不是真实星表。B=0 无距离信息，不把零视差直接判为有限距离。',
          )}
        </p>
      </details>
    </section>
  );
}
