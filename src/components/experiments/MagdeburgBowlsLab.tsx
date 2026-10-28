import { useEffect, useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  sealedBowls,
  bowlsShot,
  bowlsTrial,
  bowlPressureArrow,
  type BowlsState,
} from '../../models/magdeburg-bowls-lab';
import '../../styles/magdeburg-bowls-lab.css';
export default function MagdeburgBowlsLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    authored = bowlsShot(film.chapter, film.chapterProgress, film.chapterTime);
  const [manual, setManual] = useState<BowlsState | null>(null),
    s = film.watch ? authored : (manual ?? authored);
  useEffect(() => {
    if (!film.watch) setManual((previous) => previous ?? authored);
  }, [film.watch, authored]);
  const showContact = s.chapter === 2 || !film.watch;
  const set = (patch: Partial<Pick<BowlsState, 'temperature' | 'pull' | 'exchange'>>) =>
    setManual(bowlsTrial(s, patch));
  const state = sealedBowls(s.temperature, undefined, 0.1, s.pull, s.exchange),
    reference = sealedBowls(s.temperature, undefined, 0.1, s.pull);
  const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, width = 1.8) => {
    const a = Math.atan2(y2 - y1, x2 - x1),
      len = Math.hypot(x2 - x1, y2 - y1);
    return len > 0.05 ? (
      <path
        d={`M${x1} ${y1}L${x2} ${y2}m${-4 * Math.cos(a - 0.5)} ${-4 * Math.sin(a - 0.5)}L${x2} ${y2}l${-4 * Math.cos(a + 0.5)} ${-4 * Math.sin(a + 0.5)}`}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null;
  };
  return (
    <div
      className="bowls-lab"
      data-watch={film.watch}
      data-state={JSON.stringify(s)}
      data-pressure={state.inside}
      data-holding={state.holding}
      data-pull={state.pull}
      data-contact={state.contact}
      data-exchange={state.exchange}
    >
      <div className="bowls-heading">
        <span>{t('钢碗剖面 · 口径20厘米')}</span>
        <strong>{s.temperature.toFixed(1)} °C</strong>
      </div>
      <div className="bowls-pressure-key">
        <span className="bowls-outside">{t('外压')} 100 kPa</span>
        <span className="bowls-inside">
          {t('内压')} {(state.inside / 1000).toFixed(1)} kPa
        </span>
      </div>
      <svg
        className="bowls-figure"
        viewBox="0 0 280 175"
        role="img"
        aria-label={t('两半球内外压力沿表面法线作用，气体合力向内，拉力向外；开缝后空气进入')}
      >
        <defs>
          <linearGradient id={`${id}steel`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f8faf4" />
            <stop offset=".35" stopColor="#b8c3b6" />
            <stop offset=".6" stopColor="#e1e7dd" />
            <stop offset="1" stopColor="#899d8f" />
          </linearGradient>
          <radialGradient id={`${id}gas`}>
            <stop stopColor="#fbf7df" />
            <stop offset="1" stopColor="#e4e8d8" />
          </radialGradient>
        </defs>
        {([-1, 1] as const).map((side) => {
          const x = 140 + (side * s.gap) / 2;
          return (
            <g key={side}>
              <path
                d={`M${x} 25A53 53 0 0 ${side === 1 ? 1 : 0} ${x} 131L${x} 25`}
                fill={`url(#${id}steel)`}
                stroke="#84968a"
                strokeWidth="1.5"
              />
              <path
                d={`M${x - side * 2} 30A48 48 0 0 ${side === 1 ? 1 : 0} ${x - side * 2} 126Z`}
                fill={`url(#${id}gas)`}
                stroke="#acb7a2"
              />
              <path d={`M${x} 25V131`} stroke="#728577" strokeWidth="2.5" />
              <path
                d={`M${x + side * 53} 70q${side * 13} 0 ${side * 13} 8t${-side * 13} 8`}
                fill="none"
                stroke="#889c8b"
                strokeWidth="2.5"
              />
              <path
                d={`M${x + side * 66} 78H${side === 1 ? 270 : 10}`}
                stroke="#baa277"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {Array.from({ length: 10 }, (_, i) => (
                <circle
                  key={i}
                  cx={x + side * (12 + ((i * 13) % 28))}
                  cy={43 + ((i * 19) % 69)}
                  r="1.7"
                  fill="#b4b69c"
                  opacity=".7"
                />
              ))}
              {[-1.15, -0.65, 0.65, 1.15].map((a) => (
                <g key={a}>
                  {[false, true].map((inside) => {
                    const v = bowlPressureArrow(
                      side,
                      a,
                      s.gap,
                      inside ? state.inside : state.ambient,
                      inside,
                    );
                    return (
                      <g key={String(inside)} data-pressure-arrow={inside ? 'inside' : 'outside'}>
                        {arrow(v.x1, v.y1, v.x2, v.y2, inside ? '#b77f4d' : '#5e8c78')}
                      </g>
                    );
                  })}
                </g>
              ))}
              {arrow(x + side * 70, 92, x + side * (70 + state.pull / 32), 92, '#98717b', 2.4)}
              {arrow(
                x + side * 53,
                150,
                x + side * 53 - (side * state.holding) / 32,
                150,
                '#557e69',
                3,
              )}
              {showContact &&
                arrow(x + side * 4, 163, x + side * (4 + state.contact / 32), 163, '#b19153', 2.4)}
            </g>
          );
        })}
        {s.hotSetup && (
          <path d="M100 109q-8-12 1-21q0 7 5 8q-1-9 5-15q8 15 0 28Z" fill="#d0a268" opacity=".8" />
        )}
        {s.cooling &&
          s.phase < 0.62 &&
          [0, 1, 2].map((i) => (
            <g key={i}>
              {[-1, 1].map((side) => (
                <path
                  key={side}
                  d={`M${140 + side * (57 + i * 5)} ${15 + ((s.phase * 80 + i * 12) % 35)}q-3 7 0 9q3-2 0-9Z`}
                  fill="#92b7ad"
                />
              ))}
            </g>
          ))}
        {s.gap > 0 && s.exchange > 0 && state.inside < state.ambient - 0.1 && (
          <g data-airflow="inward">
            <path
              d="M140 2V43M140 154V112"
              fill="none"
              stroke="#6c9d8e"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
            {arrow(140, 27, 140, 44, '#6c9d8e')}
            {arrow(140, 129, 140, 112, '#6c9d8e')}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <circle cx="140" cy={3 + ((s.phase * 100 + i * 13) % 38)} r="2.2" fill="#6c9d8e" />
                <circle
                  cx="140"
                  cy={153 - ((s.phase * 100 + i * 13) % 38)}
                  r="2.2"
                  fill="#6c9d8e"
                />
              </g>
            ))}
          </g>
        )}
        {s.gap === 0 && (
          <path
            d="M135 28Q130 78 135 128"
            fill="none"
            stroke="#b9a875"
            strokeDasharray="3 4"
            strokeWidth="1.2"
          />
        )}
      </svg>
      <div className="bowls-force-readout" data-contact={showContact}>
        <span>
          {t(showContact ? '气体／碗' : '气体合力／每碗')}
          <strong>
            {state.holding.toFixed(0)} N <i>→ ←</i>
          </strong>
        </span>
        <span>
          {t(showContact ? '拉力／侧' : '拉力／每侧')}
          <strong>
            {state.pull.toFixed(0)} N <i>← →</i>
          </strong>
        </span>
        {showContact && (
          <span className="bowls-contact">
            {t('接触／碗')}
            <strong>
              {state.contact.toFixed(0)} N <i>← →</i>
            </strong>
          </span>
        )}
      </div>
      <p className="bowls-equation">
        {s.prediction ? (
          <>
            {t('密封')} {reference.holding.toFixed(0)} N → {t('当前')} {state.holding.toFixed(0)} N
          </>
        ) : showContact ? (
          t(state.opens ? '接触归零，开始分开' : '气体 = 拉力 + 接触力')
        ) : (
          t('气体合力 = (外压 − 内压) × πr²')
        )}
      </p>
      {!film.watch && (
        <div className="bowls-controls">
          <Range
            label={t('密封后气体温度')}
            value={s.temperature}
            min={15}
            max={149.5}
            step={0.5}
            unit="°C"
            onChange={(temperature) => set({ temperature })}
          />
          <Range
            label={t('每侧拉力')}
            value={s.pull}
            min={0}
            max={1400}
            step={20}
            unit="N"
            onChange={(pull) => set({ pull })}
          />
          <Range
            label={t('压力均衡进度')}
            value={s.exchange}
            min={0}
            max={1}
            step={0.01}
            onChange={(exchange) => set({ exchange })}
          />
          <div className="bowls-actions">
            <button type="button" onClick={() => set({ exchange: 0 })}>
              {t('重新密封对照')}
            </button>
            <button type="button" onClick={() => set({ exchange: 1 })}>
              {t('让空气进入')}
            </button>
          </div>
          <p>{t('改值建立同条件的新试验；均衡进度不是时间，也不是阀门开度。')}</p>
        </div>
      )}
      <details className="bowls-notes">
        <summary>{t('受力与教学近似')}</summary>
        <p>
          {t(
            '箭头示意表面压力。外压与内压沿曲面法线作用，横向分量合成为压强差乘碗口投影面积；相反的竖直分量抵消。闭合时碗口接触力平衡剩余压力，图中绿色合力只合计两侧气体。',
          )}
        </p>
        <p>
          {t(
            '按教材固定密封气体量和体积，忽略燃烧成分与冷凝。开缝后气体量增加，内压用准静态均衡进度示意；缝宽与气流不作定量预测。每侧五人各200牛是每侧1000牛，不能合成2000牛。',
          )}
        </p>
      </details>
    </div>
  );
}
