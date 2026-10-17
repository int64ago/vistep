import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { greenhouseEquilibrium, greenhouseTrace } from '../../models/greenhouse-effect';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/greenhouse-effect.css';
export default function GreenhouseEffect() {
  const d = useShowcase(),
    id = useId().replace(/:/g, ''),
    [epsilon, setEpsilon] = useState(0.8),
    [albedo, setAlbedo] = useState(0.3),
    [solar, setSolar] = useState(1361),
    [transient, setTransient] = useState(false),
    [time, setTime] = useState(2),
    c = d.watch ? Math.min(6, d.chapter) : 1,
    p = d.watch ? d.chapterProgress : 1;
  const e = d.watch ? (c === 0 ? 0 : c === 6 ? 1 : 0.8) : epsilon,
    a = d.watch ? (c === 5 && p >= 0.5 ? 0.6 : 0.3) : albedo,
    S = d.watch ? 1361 : solar,
    isTransient = d.watch ? c === 2 || c === 3 : transient,
    trace = useMemo(() => greenhouseTrace(e, S, a), [e, S, a]),
    elapsed = d.watch ? (c === 2 ? 0 : c === 3 ? 5 * Math.min(1, p / 0.8) : 0) : time,
    index = Math.min(400, Math.round((elapsed / 5) * 400)),
    q = isTransient ? trace[index] : greenhouseEquilibrium(e, S, a),
    stored = isTransient ? trace[index].stored : 0;
  const arrows = [
    { key: 'solar', flux: q.incoming, path: 'M50 22V205', color: '#c1a06c' },
    { key: 'absorbed', flux: q.absorbed, path: 'M220 205V145', color: '#a57e63' },
    { key: 'direct', flux: q.direct, path: 'M320 205V22', color: '#a57e63' },
    { key: 'up', flux: q.up, path: 'M260 100V22', color: '#779896' },
    { key: 'down', flux: q.down, path: 'M125 145V205', color: '#779896' },
  ];
  return (
    <section
      className="greenhouse-study"
      data-watch={d.watch}
      aria-label={t('单层温室效应与能量守恒实验')}
    >
      <header>
        <span>GREENHOUSE / ENERGY</span>
        <b>{t('通量 W/m²，单层灰体')}</b>
      </header>
      <div
        className="greenhouse-flux"
        role="img"
        aria-label={t('同一能量预算驱动太阳输入与长波吸收、逸出和双向发射')}
      >
        <svg viewBox="0 0 360 255">
          <defs>
            {arrows.map((arrow) => (
              <marker
                id={`${id}-${arrow.key}`}
                key={arrow.key}
                markerUnits="userSpaceOnUse"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0 0L8 4L0 8Z" fill={arrow.color} />
              </marker>
            ))}
          </defs>
          <rect
            className="greenhouse-air"
            data-inactive={e === 0}
            x="90"
            y="100"
            width="210"
            height="45"
            rx="16"
          />
          <rect className="greenhouse-surface" x="20" y="205" width="320" height="38" rx="12" />
          {arrows
            .filter((arrow) => arrow.flux > 1e-8)
            .map((arrow) => (
              <path
                key={arrow.key}
                d={arrow.path}
                stroke={arrow.color}
                strokeWidth={arrow.flux / 75}
                markerEnd={`url(#${id}-${arrow.key})`}
                fill="none"
              />
            ))}
        </svg>
        <span className="greenhouse-air-label">
          {e === 0 ? t('灰层不参与辐射') : `${t('大气')} ${q.atmosphere!.toFixed(1)} K`}
        </span>
        <span className="greenhouse-surface-label">
          {t('表面')} {q.surface.toFixed(1)} K
        </span>
        <b className="greenhouse-in">{Math.round(q.incoming)}</b>
        <b className="greenhouse-absorbed">{Math.round(q.absorbed)}</b>
        <b className="greenhouse-direct">{Math.round(q.direct)}</b>
        <b className="greenhouse-up">{Math.round(q.up)}</b>
        <b className="greenhouse-down">{Math.round(q.down)}</b>
      </div>
      <div className="greenhouse-key">
        <span>{t('吸收太阳')}</span>
        <span>{t('表面长波')}</span>
        <span>{t('灰层发射')}</span>
      </div>
      <div className="greenhouse-budget">
        <span>
          {t('吸收太阳')}
          <b>{q.incoming.toFixed(1)}</b>
        </span>
        <span>
          {t('逸出长波')}
          <b>{q.outgoing.toFixed(1)}</b>
        </span>
        <span>
          {t('净储热率')}
          <b>{Math.abs(q.net) < 0.0001 ? '0.0' : q.net.toFixed(1)}</b>
        </span>
      </div>
      {isTransient && (
        <p className="greenhouse-stored">
          t = {elapsed.toFixed(2)} {t('年')} · {t('储热')} {(stored / 1e6).toFixed(1)} MJ/m²
        </p>
      )}
      {!d.watch && (
        <div className="greenhouse-controls">
          {(
            [
              {
                key: 'e',
                label: t('长波吸收率/发射率 ε'),
                value: epsilon,
                min: 0,
                max: 1,
                step: 0.05,
                set: setEpsilon,
              },
              {
                key: 'a',
                label: t('行星反照率 α'),
                value: albedo,
                min: 0,
                max: 0.8,
                step: 0.05,
                set: setAlbedo,
              },
              {
                key: 'S',
                label: t('太阳常数 S，W/m²'),
                value: solar,
                min: 800,
                max: 1600,
                step: 10,
                set: setSolar,
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
          <button aria-pressed={transient} onClick={() => setTransient(!transient)}>
            {t('切换从 ε=0.4 平衡开始的响应')}
          </button>
          {transient && (
            <label htmlFor={`${id}-time`}>
              {t('经过时间，年')} · {time}
              <input
                id={`${id}-time`}
                type="range"
                min="0"
                max="5"
                step=".01"
                value={time}
                onChange={(e) => setTime(+e.target.value)}
              />
            </label>
          )}
        </div>
      )}
      <details>
        <summary>{t('不是热量永远关在里面，也不是额外创造能量')}</summary>
        <p>
          {t(
            '全球平均吸收太阳 I=S(1−α)/4；表面是长波黑体，灰层对太阳短波透明，长波吸收率等于发射率 ε，向上/向下各发 εσTa⁴。表面发射 σTs⁴，逸出为 (1−ε)σTs⁴+εσTa⁴。平衡时逸出仍等于 I，表面可更暖。两层正热容方程保留瞬态储热，ε 改变不让温度瞬跳。参数是灰体教学抽象，非 CO₂浓度；无云、对流、潜热、反馈或真实气候预测。ε=0 时灰层辐射温度不定义，ε=1 仍有大气长波逸出。',
          )}
        </p>
      </details>
    </section>
  );
}
