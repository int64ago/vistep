import { useId, useState } from 'react';
import { t } from '../../i18n';
import { heatRadiation, radiationShot, spectralExitance } from '../../models/heat-radiation';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/heat-radiation.css';
export default function HeatRadiation() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [temperature, setTemperature] = useState(400),
    [surroundings, setSurroundings] = useState(300),
    [emissivity, setEmissivity] = useState(0.9),
    [area, setArea] = useState(0.02),
    [spectrum, setSpectrum] = useState(false);
  const shot = film.watch
      ? radiationShot(film.chapter, film.chapterProgress)
      : { temperature, surroundings, emissivity, area, spectrum },
    s = heatRadiation(shot),
    W = phone ? 340 : 760,
    H = phone ? 245 : 300,
    cx = W / 2,
    cy = H / 2,
    R = phone ? 108 : 133,
    r = (phone ? 38 : 48) * Math.sqrt(s.area / 0.02),
    time = film.time,
    peak = s.peak * 1e6,
    x = (w: number) => 25 + ((w - 0.3) / 24.7) * (W - 50),
    y = (v: number) => H - 34 - v * (H - 60),
    trace = (T: number) => {
      const m = spectralExitance(0.002897771955 / T, T);
      return Array.from({ length: 360 }, (_, i) => {
        const w = 0.3 + (24.7 * i) / 359;
        return `${x(w)},${y(spectralExitance(w * 1e-6, T) / m)}`;
      }).join(' ');
    };
  return (
    <section className="radiation-study">
      <header>
        {t(shot.spectrum ? '峰的位置改变；每条曲线按自身峰值归一' : '真空里，辐射仍然双向交换')}
      </header>
      <svg
        className="radiation-chamber"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(
          shot.spectrum
            ? '按各自峰值归一的300K参考与当前温度红外光谱'
            : '均匀恒温黑腔中的灰体球面，金色发射与蓝色已吸收辐射方向',
        )}
      >
        <defs>
          <radialGradient id={`${id}sphere`} cx=".3" cy=".25">
            <stop stopColor="#bcb5a6" />
            <stop offset=".65" stopColor="#777d7b" />
            <stop offset="1" stopColor="#414b50" />
          </radialGradient>
          <marker
            id={`${id}out`}
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0 0L6 3.5L0 7" fill="none" stroke="#e4bb7e" />
          </marker>
          <marker id={`${id}in`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0 0L6 3.5L0 7" fill="none" stroke="#94b7c7" />
          </marker>
        </defs>
        {shot.spectrum ? (
          <>
            <path d={`M25 18V${H - 34}H${W - 20}`} fill="none" stroke="#8a9a9c" />
            <polyline
              points={trace(300)}
              fill="none"
              stroke="#98a7aa"
              strokeDasharray="5 5"
              strokeWidth="2"
            />
            <polyline points={trace(s.temperature)} fill="none" stroke="#e4bb7e" strokeWidth="3" />
            <path d={`M${x(peak)} ${y(1)}V${H - 34}`} stroke="#e4bb7e" strokeDasharray="3 4" />
            <circle cx={x(peak)} cy={y(1)} r="5" fill="#e4bb7e" />
            {[5, 15, 25].map((w) => (
              <g key={w}>
                <path d={`M${x(w)} ${H - 34}v5`} stroke="#a4b4b2" />
                <text
                  x={x(w)}
                  y={H - 5}
                  textAnchor="middle"
                  fill="#cbd4c9"
                  fontSize={phone ? 26 : 20}
                >
                  {w}
                </text>
              </g>
            ))}
          </>
        ) : (
          <>
            <circle cx={cx} cy={cy} r={R} fill="#111e29" stroke="#778b8d" strokeWidth="5" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4,
                b = a + Math.PI / 8,
                pt = (d: number, angle: number) =>
                  `${cx + d * Math.cos(angle)} ${cy + d * Math.sin(angle)}`;
              return (
                <g key={i}>
                  <path
                    d={`M${pt(r + 4, a)}L${pt(R - 12, a)}`}
                    stroke="#e4bb7e"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd={`url(#${id}out)`}
                    opacity={s.emissivity === 0 ? 0 : 0.9}
                  />
                  <path
                    d={`M${pt(R - 10, b)}L${pt(r + 8, b)}`}
                    stroke="#94b7c7"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd={`url(#${id}in)`}
                    opacity={s.emissivity === 0 ? 0 : 0.9}
                  />
                  <circle
                    cx={cx + (r + 8 + (R - r - 26) * ((time / 3 + i / 8) % 1)) * Math.cos(a)}
                    cy={cy + (r + 8 + (R - r - 26) * ((time / 3 + i / 8) % 1)) * Math.sin(a)}
                    r="2.5"
                    fill="#e4bb7e"
                    opacity={s.emissivity === 0 ? 0 : 0.9}
                  />
                </g>
              );
            })}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={`url(#${id}sphere)`}
              stroke="#b5b8a5"
              strokeWidth="1.5"
            />
            <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#c7c5ad" strokeOpacity=".15" />
          </>
        )}
      </svg>
      <div className="radiation-temperatures">
        <span>
          {t('辐射球')} {s.temperature.toFixed(0)} K
        </span>
        <span>
          {shot.spectrum ? (
            <>300 K · λ μm</>
          ) : (
            <>
              {t('黑腔')} {s.surroundings.toFixed(0)} K
            </>
          )}
        </span>
      </div>
      {shot.spectrum ? (
        <div className="radiation-result">
          <b>{peak.toFixed(2)} μm</b>
          <span>{t('当前谱峰，位于红外')}</span>
        </div>
      ) : (
        <div className="radiation-exchange">
          {[
            [t('球面发射'), s.emitted, '#e4bb7e'],
            [t('球面已吸收'), s.absorbed, '#94b7c7'],
          ].map(([label, value, color]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <b>{Number(value).toFixed(1)} W</b>
              <i>
                <em
                  style={{ width: `${(100 * Number(value)) / 230}%`, background: String(color) }}
                />
              </i>
            </div>
          ))}
        </div>
      )}
      <div className="radiation-net">
        <span>{t(s.netOut >= 0 ? '净向外' : '净向内')}</span>
        <b>{Math.abs(s.netOut).toFixed(1)} W</b>
        <span>ε {s.emissivity.toFixed(2)}</span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('黑腔、灰体和示意光路')}</summary>
          <p>
            {t(
              '小灰体球位于远大于自身的均匀恒温黑腔中。表面不透光、漫射，发射率与吸收率相同且不随波长变化。只计辐射，温度由外界维持，不计算升降温。蓝色箭头仅表示已经吸收的部分；未吸收辐射被反射。方向线不按功率加粗，数值与等比例条给出功率。图像不是可见发光或真实传播速度。谱线各自按峰值归一，只比较峰的位置。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="radiation-controls">
          <Range
            label={t('球面温度')}
            value={temperature}
            min={300}
            max={600}
            unit="K"
            onChange={setTemperature}
          />
          <Range
            label={t('黑腔温度')}
            value={surroundings}
            min={300}
            max={600}
            unit="K"
            onChange={setSurroundings}
          />
          <Range
            label={t('灰体发射率')}
            value={emissivity}
            min={0}
            max={1}
            step={0.01}
            onChange={setEmissivity}
          />
          <Range
            label={t('球面面积')}
            value={area}
            min={0.01}
            max={0.03}
            step={0.001}
            unit="m²"
            onChange={setArea}
          />
          <button type="button" aria-pressed={spectrum} onClick={() => setSpectrum(!spectrum)}>
            {t(spectrum ? '看双向交换' : '看归一化光谱')}
          </button>
        </div>
      )}
    </section>
  );
}
