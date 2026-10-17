import { useState } from 'react';
import { t } from '../../i18n';
import { latentHeat, latentShot, heatingAt } from '../../models/latent-heat';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/latent-heat.css';
export default function LatentHeat() {
  const film = useShowcase(),
    phone = useCompact();
  const [seconds, setSeconds] = useState(200),
    [power, setPower] = useState(100),
    [mass, setMass] = useState(0.1);
  const shot = latentShot(film.chapter, film.chapterProgress);
  const s = film.watch ? latentHeat(shot.energy) : heatingAt(seconds, power, mass);
  const P = film.watch ? shot.power : power;
  const phaseLabel =
    P === 0
      ? '无供热，状态不变'
      : P < 0
        ? '凝固放热'
        : s.phase === 'ice'
          ? '冰升温'
          : s.phase === 'mixture'
            ? '融化吸热'
            : '水升温';
  const W = phone ? 340 : 700,
    H = phone ? 260 : 300;
  const graphWidth = W - 70,
    Qmax = s.warmIce + s.melt + s.mass * 4186 * 90;
  const point = (Q: number) => {
    const q = latentHeat(Q, s.mass);
    return `${35 + (Q / Qmax) * graphWidth},${H - 32 - ((q.temperature + 20) / 120) * (H - 65)}`;
  };
  const chunks = 48,
    liquid = s.fraction * chunks;
  return (
    <section className="latent-study">
      <header>
        <span>{t(phaseLabel)}</span>
        <b>{s.temperature.toFixed(1)}°C</b>
      </header>
      <div className="latent-sample" aria-label={t('冰与水的质量比例')}>
        <div className="latent-mosaic">
          {Array.from({ length: chunks }, (_, i) => (
            <i
              key={i}
              className={i < liquid ? 'is-liquid' : ''}
              style={{
                opacity:
                  i < Math.floor(liquid)
                    ? 1
                    : liquid % 1 > 0 && i === Math.floor(liquid)
                      ? 0.4 + 0.6 * (liquid % 1)
                      : 1,
              }}
            />
          ))}
        </div>
        <div className="latent-mass">
          <span>{t('液态质量比例')}</span>
          <b>{(s.fraction * 100).toFixed(0)}%</b>
        </div>
      </div>
      <div className="latent-power">
        <span>
          {t(P < 0 ? '移出能量' : '持续供热')} <b>{Math.abs(P)} W</b>
        </span>
        {P > 0 && (
          <span>
            {t('供热时间')} <b>{(s.energy / P).toFixed(0)} s</b>
          </span>
        )}
      </div>
      <div className="latent-energy" aria-label={t('累计能量账本')}>
        <div>
          <span style={{ width: `${(Math.max(0, s.iceEnergy) / Math.max(1, s.energy)) * 100}%` }} />
          <span style={{ width: `${(s.phaseEnergy / Math.max(1, s.energy)) * 100}%` }} />
          <span style={{ width: `${(s.liquidEnergy / Math.max(1, s.energy)) * 100}%` }} />
        </div>
        <p>
          {film.watch ? (
            <span>{t(phaseLabel)}</span>
          ) : (
            <>
              <span>{t('冰升温')}</span>
              <span>{t('相变')}</span>
              <span>{t('水升温')}</span>
            </>
          )}
          <b>{(s.energy / 1000).toFixed(1)} kJ</b>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('温度随累计供热的变化，融化阶段保持零度')}
      >
        <path d={`M35 25V${H - 32}H${W - 20}`} stroke="#74857f" opacity=".5" fill="none" />
        <polyline
          points={[0, s.warmIce, s.warmIce + s.melt, Qmax].map(point).join(' ')}
          stroke="#8c9f9b"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d={`M${35 + (s.warmIce / Qmax) * graphWidth} ${H - 32 - (20 / 120) * (H - 65)}h${(s.melt / Qmax) * graphWidth}`}
          stroke="#c88f55"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle
          cx={Number(point(s.energy).split(',')[0])}
          cy={Number(point(s.energy).split(',')[1])}
          r="7"
          fill="#c88f55"
          stroke="#fff9ef"
          strokeWidth="2"
        />
      </svg>
      <div className="latent-axes">
        <span>{t('温度')} (°C)</span>
        <span>{t('净供热')} (kJ)</span>
      </div>
      <details className="latent-note">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '纯水近常压、准静态且无散热；格子表示相态质量比例，不表示实际体积。平台适用于固液共存。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="latent-controls">
          <Range
            label={t('供热时间')}
            value={seconds}
            min={0}
            max={500}
            unit="s"
            onChange={setSeconds}
          />
          <Range
            label={t('加热功率')}
            value={power}
            min={0}
            max={150}
            step={10}
            unit="W"
            onChange={setPower}
          />
          <Range
            label={t('样品质量')}
            value={mass}
            min={0.1}
            max={0.2}
            step={0.01}
            unit="kg"
            onChange={setMass}
          />
        </div>
      )}
    </section>
  );
}
