import { useState } from 'react';
import { t } from '../../i18n';
import { thinFilm, filmShot, filmSwatch } from '../../models/thin-film-interference';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/thin-film-interference.css';
export default function ThinFilmInterference() {
  const film = useShowcase(),
    compact = useCompact();
  const [manualD, setD] = useState(103),
    [manualW, setW] = useState(550),
    [glass, setGlass] = useState(false);
  const shot = filmShot(film.chapter, film.chapterProgress);
  const d = film.watch ? shot.thickness : manualD,
    substrate = film.watch ? shot.substrate : glass ? 1.5 : 1;
  const wavelength = film.watch ? 550 : manualW,
    model = thinFilm(d, wavelength, 1.33, substrate);
  const width = compact ? 340 : 720,
    waveWidth = width - 60;
  const layerHeight = d * 0.2,
    sectionWidth = compact ? 340 : 480,
    bottom = 52 + layerHeight;
  const upperX = sectionWidth * 0.2,
    lowerX = sectionWidth * 0.65;
  const wave = (phase: number, baseline: number, amplitude = 22) =>
    Array.from(
      { length: 121 },
      (_, i) =>
        `${30 + (i * waveWidth) / 120},${baseline - amplitude * Math.sin((i * Math.PI) / 15 + phase)}`,
    ).join(' ');
  return (
    <section className="thinfilm-study">
      <div className="thinfilm-heading">
        <span>{t('两次反射，一次相遇')}</span>
        <b>{d.toFixed(0)} nm</b>
      </div>
      {film.watch && shot.white ? (
        <div className="thinfilm-wedge" aria-label={t('厚度渐变薄膜的三波长反射示意')}>
          {Array.from({ length: 120 }, (_, i) => (
            <i
              key={i}
              style={{ background: filmSwatch(i * 6, substrate), height: `${45 + i * 0.8}px` }}
            />
          ))}
          <b className="thinfilm-probe" style={{ left: `${(d / 720) * 100}%` }} />
          <span>{t('薄 → 厚')}</span>
        </div>
      ) : (
        <div className="thinfilm-section" style={{ height: `${bottom + 53}px` }}>
          <div className="thinfilm-air">{t('空气')} · n = 1</div>
          <div
            className="thinfilm-layer"
            style={{
              top: '52px',
              height: `${layerHeight}px`,
              background: `linear-gradient(130deg,${filmSwatch(d, substrate)},#699eab55)`,
            }}
          >
            {d > 30 && <span>n = 1.33</span>}
            {d > 30 && <b>d</b>}
          </div>
          <div className="thinfilm-base" style={{ top: `${bottom}px` }}>
            {t(substrate === 1 ? '空气' : '玻璃')} · n = {substrate}
          </div>
          <svg
            className="thinfilm-rays"
            preserveAspectRatio="none"
            viewBox={`0 0 ${sectionWidth} ${bottom + 53}`}
            aria-label={t('分列的正入射光路，第二束在膜底反射后返回')}
          >
            <path
              d={`M${upperX} 8V52H${upperX + 22}V8`}
              stroke="#d4e8dc"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d={`M${lowerX} 8V${bottom}H${lowerX + 22}V8`}
              stroke="#e3ba77"
              strokeWidth="2.5"
              fill="none"
            />
            {[upperX, lowerX].map((x) => (
              <path
                key={x}
                d={`M${x - 4} 30l4 6l4 -6M${x + 18} 26l4 -6l4 6`}
                stroke={x === upperX ? '#d4e8dc' : '#e3ba77'}
                fill="none"
                strokeWidth="2"
              />
            ))}
            <circle cx={upperX + 11} cy="52" r="4" fill="#d4e8dc" />
            <circle cx={lowerX + 11} cy={bottom} r="4" fill="#e3ba77" />
          </svg>
        </div>
      )}
      <div className="thinfilm-phase">
        <div>
          <span>{t('往返光程')}</span>
          <b>2nd = {model.opticalPath.toFixed(0)} nm</b>
        </div>
        <div>
          <span>{t('反射率')}</span>
          <b>{(model.reflectance * 100).toFixed(1)}%</b>
        </div>
      </div>
      <div className="thinfilm-waves" aria-label={t('两束反射光的相位与叠加')}>
        {[
          [t('表面反射'), '#d4e8dc'],
          [t('底面返回'), '#e3ba77'],
          [t('合成'), '#b3cfba'],
        ].map(([label, color], i) => (
          <div key={i}>
            <span>{label}</span>
            <svg viewBox={`0 0 ${width} 54`} aria-hidden="true">
              <path d={`M24 27H${width - 24}`} stroke="#fff" opacity=".1" />
              <polyline
                points={wave(
                  Math.atan2(model.fields[i].imaginary, model.fields[i].real),
                  27,
                  (11 / Math.abs(model.r01)) *
                    Math.hypot(model.fields[i].real, model.fields[i].imaginary),
                )}
                fill="none"
                stroke={String(color)}
                strokeWidth={i === 2 ? 3 : 2}
              />
            </svg>
          </div>
        ))}
      </div>
      <details className="thinfilm-note">
        <summary>{t('模型与光路说明')}</summary>
        <p>
          {t(
            '波形与反射率来自同一个含多次反射的菲涅耳模型；底面返回包括膜内所有返回贡献。光路横向分列，正入射实际重合。膜厚在图中放大，三波长色带不是色度学还原。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="thinfilm-controls">
          <Range label={t('膜厚')} value={manualD} min={0} max={700} unit="nm" onChange={setD} />
          <Range
            label={t('真空波长')}
            value={manualW}
            min={400}
            max={700}
            unit="nm"
            onChange={setW}
          />
          <button type="button" aria-pressed={glass} onClick={() => setGlass(!glass)}>
            {t(glass ? '改为空气背面' : '改为玻璃背面')}
          </button>
        </div>
      )}
    </section>
  );
}
