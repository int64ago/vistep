import { useState } from 'react';
import { t } from '../../i18n';
import {
  osmosisDefault,
  osmosisFrame,
  osmosisShot,
  osmosisWaterTracers,
} from '../../models/osmosis';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import '../../styles/osmosis.css';
export default function Osmosis() {
  const d = useShowcase(),
    { host, width: w } = useSignalWidth();
  const [moles, setMoles] = useState(20),
    [external, setExternal] = useState(0),
    [time, setTime] = useState(20);
  const f = d.watch
      ? osmosisShot(d.chapter, d.chapterProgress)
      : osmosisFrame({ ...osmosisDefault, molesRight: moles * 1e-6, external }, time),
    mid = w / 2,
    bottom = 357,
    scale = 2700,
    leftY = bottom - f.heightLeft * scale,
    rightY = bottom - f.heightRight * scale;
  const tracers = osmosisWaterTracers(f.transfer),
    leftX = (i: number) => 42 + (((i * 37) % 101) / 101) * (mid - 80),
    rightX = (i: number) => mid + 38 + (((i * 43) % 103) / 103) * (mid - 80);
  const water = tracers.map((s) => {
    const start = s.fromLeft ? leftX(s.id) : rightX(s.id),
      end = s.fromLeft ? rightX(s.id) : leftX(s.id),
      h = s.fromLeft ? leftY : rightY,
      h2 = s.fromLeft ? rightY : leftY,
      y0 = h + 18 + (((s.id * 29) % 83) / 83) * (bottom - h - 30),
      y1 = h2 + 18 + (((s.id * 31) % 89) / 89) * (bottom - h2 - 30),
      p = s.travel,
      x = start + (end - start) * p,
      y = p < 0.5 ? y0 + (349 - y0) * p * 2 : 349 + (y1 - 349) * (p - 0.5) * 2;
    return { id: s.id, x, y };
  });
  const solutes = Array.from({ length: Math.round(f.config.molesRight * 1e6) }, (_, i) => ({
    x: rightX(i + 60),
    y: rightY + 20 + (((i * 41) % 97) / 97) * (bottom - rightY - 35),
  }));
  return (
    <div ref={host} className="osmosis-scene">
      <div className="osmosis-head">
        <span>{t('水可通过，溶质被保留')}</span>
        <b>
          {(f.transfer * 1e6).toFixed(1)} mL <small>{t('净转移')}</small>
        </b>
      </div>
      <svg viewBox={`0 0 ${w} 380`} role="img" aria-label={t('半透膜两侧液面与水的净流动')}>
        <text x={mid / 2} y="44" textAnchor="middle">
          {t('纯水侧')}
        </text>
        <text x={mid * 1.5} y="44" textAnchor="middle">
          {t('溶液侧')}
        </text>
        <rect
          x="26"
          y="75"
          width={w - 52}
          height="288"
          rx="18"
          fill="#f6fafa"
          stroke="#bbd1d0"
          strokeWidth="2"
        />
        <path d={`M30 ${leftY}H${mid - 6}V357H44Q30 357 30 343Z`} fill="#d6eae8" />
        <path
          d={`M${mid + 6} ${rightY}H${w - 30}V343Q${w - 30} 357 ${w - 44} 357H${mid + 6}Z`}
          fill="#d8e6db"
        />
        <path
          d={`M30 ${leftY}H${mid - 6}M${mid + 6} ${rightY}H${w - 30}`}
          stroke="#6daba9"
          strokeWidth="2"
        />
        {water.map((s) => (
          <circle key={s.id} cx={s.x} cy={s.y} r="3" fill="#5c9caa" opacity=".75" />
        ))}
        {solutes.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y})`}>
            <path d="M0-6 6-3 6 3 0 6-6 3-6-3Z" fill="#aa8b5f" stroke="#f0e7d2" />
          </g>
        ))}
        <rect x={mid - 6} y="76" width="12" height="281" rx="4" fill="#e5d9be" />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${mid - 6} ${99 + i * 25}h12`} stroke="#fafcf6" strokeWidth="8" />
        ))}
        <path
          d={`M${mid - 40} 349H${mid + 40}`}
          opacity={Math.min(1, Math.abs(f.flux) / 1e-6)}
          stroke={f.flux >= 0 ? '#3e8c8b' : '#b08955'}
          strokeWidth="2"
        />
        <path
          d={f.flux >= 0 ? `M${mid + 32} 344l8 5-8 5` : `M${mid - 32} 344l-8 5 8 5`}
          fill="none"
          opacity={Math.min(1, Math.abs(f.flux) / 1e-6)}
          stroke={f.flux >= 0 ? '#3e8c8b' : '#b08955'}
          strokeWidth="2"
        />
        {f.config.external > 0 && (
          <>
            <path
              d={`M${mid + mid / 2} 100v70m-7-10 7 10 7-10`}
              fill="none"
              stroke="#ae8a54"
              strokeWidth="3"
            />
            <text x={mid * 1.5} y="200" textAnchor="middle">
              {t('外加压力')}
            </text>
          </>
        )}
      </svg>
      <p className="osmosis-note">{t('透水膜 · 水点为示意')}</p>
      <div className="osmosis-balance">
        <span>
          {t('渗透压差')}
          <b>{f.osmotic.toFixed(0)} Pa</b>
        </span>
        <span>
          {t('液柱压差')}
          <b>{f.hydrostatic.toFixed(0)} Pa</b>
        </span>
        <span>
          {t('外加压力')}
          <b>{f.config.external.toFixed(0)} Pa</b>
        </span>
      </div>
      <details className="osmosis-model-note">
        <summary>{t('模型边界')}</summary>
        <p>{t('稀溶液、等温、溶质不透膜；水始终可双向交换，箭头表示净通量。')}</p>
      </details>
      {!d.watch && (
        <div className="osmosis-controls">
          <Range
            label={t('溶液侧溶质的量')}
            min={0}
            max={40}
            step={1}
            value={moles}
            unit="μmol"
            onChange={setMoles}
          />
          <Range
            label={t('施加在溶液侧的压力')}
            min={0}
            max={700}
            step={10}
            value={external}
            unit="Pa"
            onChange={setExternal}
          />
          <Range
            label={t('从等液面开始的时间')}
            min={0}
            max={120}
            step={0.1}
            value={time}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
    </div>
  );
}
