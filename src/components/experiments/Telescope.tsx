import { useState } from 'react';
import { t } from '../../i18n';
import { telescope, telescopeRay, telescopePupil, telescopeShot } from '../../models/telescope';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/telescope.css';
const fields = [-0.6, 0, 0.6],
  colors = ['#83afc5', '#c2cf9d', '#d8a36f'];
export default function Telescope() {
  const film = useShowcase(),
    phone = useCompact();
  const [fe, setFe] = useState(40),
    [D, setD] = useState(40),
    [eyeShift, setEyeShift] = useState(0),
    [offset, setOffset] = useState(0),
    [pupil, setPupil] = useState(false);
  const shot = telescopeShot(film.chapter, film.chapterProgress),
    s = telescope({
      eyepieceFocal: film.watch ? shot.eyepieceFocal : fe,
      aperture: film.watch ? 40 : D,
    }),
    eyeDistance = film.watch ? shot.eyeDistance : s.pupilDistance + eyeShift,
    eyeOffset = film.watch ? shot.eyeOffset : offset,
    viewPupil = film.watch ? shot.pupil : pupil,
    W = phone ? 340 : 760,
    H = phone ? 230 : 300;
  const min = phone && film.watch && film.chapter > 0 ? s.fo - 12 : -30,
    max =
      phone && film.watch && film.chapter === 0 ? s.fo + 20 : s.separation + s.pupilDistance + 35;
  const x = (v: number) => 20 + ((v - min) / (max - min)) * (W - 40),
    yscale = (H - 70) / Math.max(s.D, 40),
    y = (v: number) => H / 2 - v * yscale,
    visible = (v: number) => v >= min && v <= max;
  const coupling = fields.map((a) =>
    telescopePupil(a, eyeDistance, eyeOffset, { eyepieceFocal: s.fe, aperture: s.D }),
  );
  return (
    <section className="telescope-study">
      <header>
        <span>{t(viewPupil ? '把眼瞳放到出瞳处' : '先成实像，再改变视角')}</span>
        <b>{t('开普勒式')}</b>
      </header>
      {viewPupil ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('出瞳附近同一眼瞳平面上三个视场的光束截面')}
        >
          <path
            d={`M${W / 2 - 100} ${H / 2}h200M${W / 2} 15V${H - 15}`}
            stroke="#718c8655"
            strokeDasharray="3 5"
          />
          {coupling.map((c, i) => (
            <circle
              key={i}
              cx={W / 2}
              cy={H / 2 - c.center * (phone ? 12 : 20)}
              r={(s.pupilDiameter / 2) * (phone ? 12 : 20)}
              fill={colors[i]}
              fillOpacity=".12"
              stroke={colors[i]}
              strokeWidth="2"
            />
          ))}
          <circle
            cx={W / 2}
            cy={H / 2 - eyeOffset * (phone ? 12 : 20)}
            r={(s.eyeDiameter / 2) * (phone ? 12 : 20)}
            fill="#13293199"
            stroke="#f0e8cc"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('物镜中间实像目镜与出瞳的连贯近轴光路')}
        >
          <path d={`M20 ${H / 2}H${W - 20}`} stroke="#849a8b" opacity=".4" />
          {fields.map((field, j) =>
            [-s.D / 2, 0, s.D / 2].map((height, k) => {
              const ray = telescopeRay(height, field, { eyepieceFocal: s.fe, aperture: s.D }),
                xs = [min, 0, s.fo, s.separation, s.separation + s.pupilDistance, max].filter(
                  visible,
                );
              return (
                <polyline
                  key={`${j}-${k}`}
                  points={[...new Set(xs)]
                    .sort((a, b) => a - b)
                    .map((v) => `${x(v)},${y(ray.at(v))}`)
                    .join(' ')}
                  stroke={colors[j]}
                  strokeWidth={k === 1 ? 1.8 : 1.1}
                  opacity={k === 1 ? 0.9 : 0.5}
                  fill="none"
                />
              );
            }),
          )}
          {[
            [0, s.D, t('物镜')],
            [s.separation, 40, t('目镜')],
          ].map(
            ([position, diameter, label]) =>
              visible(Number(position)) && (
                <g key={String(label)}>
                  <path
                    d={`M${x(Number(position))} ${y(Number(diameter) / 2)}Q${x(Number(position)) + 10} ${H / 2} ${x(Number(position))} ${y(-Number(diameter) / 2)}Q${x(Number(position)) - 10} ${H / 2} ${x(Number(position))} ${y(Number(diameter) / 2)}`}
                    fill="#91b6b73a"
                    stroke="#c7d6c4"
                    strokeWidth="2"
                  />
                  <text
                    x={x(Number(position))}
                    y="22"
                    textAnchor={x(Number(position)) < W / 2 ? 'start' : 'end'}
                    fontSize={phone ? 24 : 18}
                    fill="#dce5d5"
                  >
                    {label}
                  </text>
                </g>
              ),
          )}
          {visible(s.fo) && (
            <g>
              <path
                d={`M${x(s.fo)} 40V${H - 38}`}
                stroke="#c2cf9d"
                strokeDasharray="3 5"
                opacity=".6"
              />
              {fields.map((a, i) => (
                <circle
                  key={i}
                  cx={x(s.fo)}
                  cy={y((s.fo * a * Math.PI) / 180)}
                  r="4"
                  fill={colors[i]}
                />
              ))}
              <text
                x={x(s.fo)}
                y={H - 8}
                textAnchor={x(s.fo) < W / 2 ? 'start' : 'end'}
                fontSize={phone ? 24 : 18}
                fill="#c2cf9d"
              >
                {t('中间实像')}
              </text>
            </g>
          )}
          {visible(s.separation + s.pupilDistance) && (
            <g>
              <path
                d={`M${x(s.separation + s.pupilDistance)} ${y(7)}V${y(-7)}`}
                stroke="#efdfb7"
                strokeDasharray="2 3"
              />
              <text
                x={x(s.separation + s.pupilDistance)}
                y={H - 50}
                textAnchor="end"
                fontSize={phone ? 24 : 18}
                fill="#efdfb7"
              >
                {t('出瞳')}
              </text>
            </g>
          )}
        </svg>
      )}
      {viewPupil && (
        <div className="telescope-field-power">
          {coupling.map((c, i) => (
            <span key={i}>
              <i style={{ background: colors[i] }} />
              {['A', 'B', 'C'][i]} · {(c.coupling * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      )}
      <div className="telescope-values">
        <span>
          {t('角放大率')}
          <b>{s.magnification.toFixed(1)}×</b>
        </span>
        <span>
          {t('出瞳直径')}
          <b>{s.pupilDiameter.toFixed(1)} mm</b>
        </span>
      </div>
      <p className="telescope-parameters">
        fO {s.fo} · fE {s.fe.toFixed(0)} · {t('出瞳距目镜')} {s.pupilDistance.toFixed(1)} mm
        {viewPupil && <> · Δz {(eyeDistance - s.pupilDistance).toFixed(0)} mm</>}
      </p>
      <details>
        <summary>{t('近轴与眼瞳条件')}</summary>
        <p>
          {t(
            '两片正薄透镜，间距自动保持fO+fE；物体在无穷远，最终虚像在无穷远。出瞳是物镜孔径经目镜所成的像，不是中间星像。颜色标识三个视场，不表示色散；入眼比例按均匀圆形光束与4毫米眼瞳的重叠面积计算。不含像差、衍射、眼睛调节或有限目镜视场光阑。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="telescope-controls">
          <button type="button" aria-pressed={pupil} onClick={() => setPupil(!pupil)}>
            {t(pupil ? '看完整成像光路' : '看眼瞳截面')}
          </button>
          <Range
            label={t('目镜焦距（同步调焦）')}
            value={fe}
            min={20}
            max={60}
            unit="mm"
            onChange={setFe}
          />
          <Range label={t('物镜口径')} value={D} min={20} max={60} unit="mm" onChange={setD} />
          <Range
            label={t('眼睛相对出瞳的前后位移')}
            value={eyeShift}
            min={-30}
            max={30}
            unit="mm"
            onChange={setEyeShift}
          />
          <Range
            label={t('眼瞳横向偏移')}
            value={offset}
            min={-4}
            max={4}
            step={0.1}
            unit="mm"
            onChange={setOffset}
          />
        </div>
      )}
    </section>
  );
}
