import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { sealedBowls } from '../../models/magdeburg-bowls-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function MagdeburgBowlsLab() {
  const film = useShowcase();
  const [temperature, setTemperature] = useState(15),
    [pull, setPull] = useState(800);
  const stage = film.chapter,
    p = film.chapterProgress,
    temp = film.watch ? (stage === 0 ? 149.5 : stage === 1 ? 149.5 - 134.5 * p : 15) : temperature,
    force = film.watch ? (stage === 2 ? Math.min(5, 1 + Math.floor(p * 6)) * 200 : 0) : pull,
    pre = sealedBowls(temp),
    opened = film.watch
      ? stage === 3 || (stage === 2 && force >= pre.holding)
      : force >= pre.holding && force > 0,
    gap = film.watch
      ? stage === 0
        ? 40 * (1 - p)
        : stage === 2 && opened
          ? 40 * Math.min(1, Math.max(0, (p - 2 / 3) * 6))
          : stage === 3
            ? 40
            : 0
      : opened
        ? 40
        : 0,
    state = sealedBowls(temp, 149.5, 0.1, force, opened || (film.watch && stage === 0));
  return (
    <div className="textbook-em magdeburg-bowls-lab">
      <div className="textbook-em-state">
        <span>{t('不锈钢碗的马德堡实验')}</span>
        <span>{`${temp.toFixed(1)} °C`}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 310"
        role="img"
        aria-label={t('密封热碗冷却后的内外压强与两侧拉力')}
      >
        {[-1, 1].map((side) => {
          const x = 180 + (side * gap) / 2;
          return (
            <g key={side}>
              <path
                d={`M${x} 88A80 80 0 0 ${side === 1 ? 1 : 0} ${x} 248Z`}
                fill="#c0c8b6"
                stroke="#879b7f"
                strokeWidth="3"
              />
              <path
                d={`M${x - side * 1} 97A71 71 0 0 ${side === 1 ? 1 : 0} ${x - side * 1} 239Z`}
                fill="#edf1e3"
                stroke="#aabb9a"
              />
              <path
                d={`M${x + side * 81} 158q${side * 15} 0 ${side * 15} 10t${-side * 15} 10`}
                fill="none"
                stroke="#92a484"
                strokeWidth="3"
              />
              <path
                d={`M${x + side * 97} 168H${side === 1 ? 347 : 13}`}
                stroke="#b7a277"
                strokeWidth="3"
              />
              {Array.from({ length: 10 }, (_, i) => (
                <circle
                  key={i}
                  cx={x + side * (16 + ((i * 17) % 42))}
                  cy={119 + ((i * 29) % 98)}
                  r="2.6"
                  fill="#bacba8"
                />
              ))}
              {force > 0 && (
                <path
                  d={`M${side === 1 ? 291 : 69} 192h${(side * force) / 40}M${(side === 1 ? 291 : 69) + (side * force) / 40 - side * 6} 188l${side * 6} 4 ${-side * 6} 4`}
                  fill="none"
                  stroke="#b1935c"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}
        {film.watch && stage === 0 && p < 0.5 && (
          <path
            d="M166 222q-12-17 1-31q0 9 8 12q-1-13 8-22q10 21 0 41Z"
            transform="translate(-55 0)"
            fill="#c8a068"
            opacity=".8"
          />
        )}
        {film.watch &&
          stage === 1 &&
          [0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path
                d={`M${94 + i * 7} ${60 + ((p * 140 + i * 27) % 90)}q-4 9 0 11q4-2 0-11Z`}
                fill="#aac9bd"
              />
              <path
                d={`M${245 + i * 7} ${60 + ((p * 140 + i * 27) % 90)}q-4 9 0 11q4-2 0-11Z`}
                fill="#aac9bd"
              />
            </g>
          ))}
      </svg>
      <p className="lab-apparatus-caption">
        {t(
          stage === 0 && film.watch
            ? '加热后合拢两只碗'
            : opened
              ? '空气进入，内外压强相同'
              : '冷却使内部气体压强下降',
        )}
      </p>
      <div className="textbook-em-meters">
        <span>
          p {t('内')} <b>{(state.inside / 1000).toFixed(1)} kPa</b>
        </span>
        <span>
          Δp·A <b>{state.holding.toFixed(0)} N</b>
        </span>
        <span>
          {t('每侧拉力')} <b>{force.toFixed(0)} N</b>
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Range
            label={t('密封后气体温度')}
            value={temperature}
            min={15}
            max={149.5}
            step={0.5}
            onChange={setTemperature}
          />
          <Range
            label={t('每侧拉力')}
            value={pull}
            min={0}
            max={1400}
            step={20}
            onChange={setPull}
          />
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('密封与估算条件')}</summary>
        <p>
          {t(
            '按教材假定密封后气体量与体积不变、不漏气，外压为100千帕，碗口直径20厘米。忽略燃烧改变成分及冷凝等影响。五人每人200牛是每一侧约1000牛，不把两侧相加为2000牛。自由探索每次改值表示一次重新密封的独立试验。',
          )}
        </p>
      </details>
    </div>
  );
}
