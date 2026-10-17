import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  logisticRate,
  logisticSwitched,
  logisticTrace,
  logisticValue,
} from '../../models/growth-logistic';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/growth-logistic.css';
const short = (v: number) => Number(v.toFixed(2)).toString();
export default function GrowthLogistic() {
  const d = useShowcase(),
    id = useId(),
    [initial, setInitial] = useState(10),
    [rate, setRate] = useState(0.6),
    [capacity, setCapacity] = useState(100),
    [time, setTime] = useState(8),
    [switched, setSwitched] = useState(false),
    [nextCapacity, setNextCapacity] = useState(60),
    [switchAt, setSwitchAt] = useState(6);
  const c = d.watch ? Math.min(6, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1,
    first = d.watch ? (c === 0 ? 2 : c === 4 ? 140 : c === 6 && p < 0.5 ? 0 : 10) : initial,
    r = d.watch ? (c === 6 && p >= 0.5 ? 0 : 0.6) : rate,
    k = d.watch ? 100 : capacity,
    newK = d.watch ? 60 : nextCapacity,
    at = d.watch ? 6 : switchAt,
    hasSwitch = d.watch ? c === 5 : switched;
  const peakTime = (value: number) => Math.log(9 / (100 / value - 1)) / 0.6;
  const now = d.watch
    ? c === 0
      ? p * 3
      : c === 1
        ? 2 + p * 4
        : c === 2
          ? peakTime(p < 0.25 ? 25 : p < 0.75 ? 50 : 75)
          : c === 3
            ? 7 + p * 7
            : c === 4
              ? p * 10
              : c === 5
                ? 6 + p * 8
                : p * 14
    : time;
  const until = d.watch && c === 0 ? 3 : 14,
    currentK = hasSwitch && now >= at ? newK : k,
    value = hasSwitch
      ? logisticSwitched(now, first, r, k, newK, at)
      : logisticValue(now, first, r, k),
    growth = logisticRate(value, r, currentK),
    factor = 1 - value / currentK;
  const trace = logisticTrace(first, r, k, until, hasSwitch ? newK : null, at),
    top =
      d.watch && c === 0
        ? first * Math.exp(r * 3) * 1.15
        : Math.max(first, k, hasSwitch ? newK : 0) * 1.12,
    tx = (v: number) => 12 + (v / until) * 336,
    ty = (v: number) => 142 - (v / top) * 128;
  const line = (items: { time: number; value: number }[]) =>
      items.map((v, i) => `${i ? 'L' : 'M'}${tx(v.time)} ${ty(v.value)}`).join(' '),
    prefix = [...trace.filter((v) => v.time < now), { time: now, value }];
  const phaseMax = Math.max(currentK * 1.25, value * 1.1),
    phase = Array.from({ length: 81 }, (_, i) => {
      const n = (phaseMax * i) / 80;
      return { n, growth: logisticRate(n, r, currentK) };
    }),
    upper = Math.max(0.1, (r * currentK) / 4) * 1.2,
    lower = Math.min(-0.02, phase.at(-1)!.growth) * 1.1,
    px = (v: number) => 12 + (v / phaseMax) * 336,
    py = (v: number) => 112 - ((v - lower) / (upper - lower)) * 100;
  return (
    <section
      className="logistic-study"
      data-watch={d.watch}
      data-shot={c}
      aria-label={t('逻辑斯谛增长与承载量实验')}
    >
      <header>
        <span>LOGISTIC / CONTINUOUS</span>
        <b>
          r = {r} · K = {currentK}
        </b>
      </header>
      {!(d.watch && c === 0) && (
        <div
          className="logistic-phase"
          role="img"
          aria-label={t('当前数量与增速关系，点表示实际状态')}
        >
          <span>{t('增速 dN/dt')}</span>
          <svg viewBox="0 0 360 125" preserveAspectRatio="none">
            <path className="logistic-zero" d={`M12 ${py(0)}H348`} />
            <path className="logistic-guide" d={`M${px(currentK)} 12V112`} />
            <path
              className="logistic-flow"
              d={phase.map((v, i) => `${i ? 'L' : 'M'}${px(v.n)} ${py(v.growth)}`).join(' ')}
            />
            <circle cx={px(value)} cy={py(growth)} r="5" />
            {c === 2 && (
              <circle
                className="logistic-peak"
                cx={px(currentK / 2)}
                cy={py((r * currentK) / 4)}
                r="7"
              />
            )}
          </svg>
          <div>
            <span>N = 0</span>
            <span>N = {short(phaseMax)}</span>
          </div>
        </div>
      )}
      <div className="logistic-time" role="img" aria-label={t('连续数量曲线与承载量变化')}>
        <span>
          {d.watch && c === 0 ? t('早期局部放大，指数增长为对照') : t('数量 N 随时间变化')}
        </span>
        <svg viewBox="0 0 360 155" preserveAspectRatio="none">
          {!(d.watch && c === 0) && (
            <path
              className="logistic-capacity"
              d={hasSwitch ? `M12 ${ty(k)}H${tx(at)}V${ty(newK)}H348` : `M12 ${ty(k)}H348`}
            />
          )}
          <path className="logistic-future" d={line(trace)} />
          <path className="logistic-actual" d={line(prefix)} />
          {d.watch && c === 0 && (
            <path
              className="logistic-exponential"
              d={line(trace.map((v) => ({ time: v.time, value: first * Math.exp(r * v.time) })))}
            />
          )}
          <circle cx={tx(now)} cy={ty(value)} r="5" />
        </svg>
        <div>
          <span>t = 0</span>
          <span>t = {until}</span>
        </div>
      </div>
      <div className="logistic-readout">
        <span>
          N<b>{short(value)}</b>
        </span>
        <span>
          dN/dt<b>{short(growth)}</b>
        </span>
        <span>
          1−N/K<b>{short(factor)}</b>
        </span>
      </div>
      {c === 2 && <p className="logistic-note">{t('总增速最大处：N = K/2。')}</p>}
      {hasSwitch && (
        <p className="logistic-note">{t('t = {0} 时，K 从 {1} 改为 {2}。', at, k, newK)}</p>
      )}
      {d.watch && c === 6 && (
        <p className="logistic-note">
          {first === 0 ? t('无迁入：N₀ = 0 始终为零。') : t('r = 0：任意初值都保持。')}
        </p>
      )}
      {!d.watch && (
        <div className="logistic-controls">
          {(
            [
              {
                key: 'initial',
                label: t('初始数量'),
                min: 0,
                max: 160,
                step: 1,
                value: initial,
                set: setInitial,
              },
              {
                key: 'rate',
                label: t('内禀增长率'),
                min: 0,
                max: 1.2,
                step: 0.1,
                value: rate,
                set: setRate,
              },
              {
                key: 'capacity',
                label: t('初始承载量'),
                min: 20,
                max: 140,
                step: 10,
                value: capacity,
                set: setCapacity,
              },
              {
                key: 'time',
                label: t('观察时间'),
                min: 0,
                max: 14,
                step: 0.1,
                value: time,
                set: setTime,
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
          <button aria-pressed={switched} onClick={() => setSwitched(!switched)}>
            {t('改变中途承载量')}
          </button>
          {switched && (
            <>
              <label htmlFor={`${id}-new`}>
                {t('新承载量')} · {nextCapacity}
                <input
                  id={`${id}-new`}
                  type="range"
                  min="20"
                  max="140"
                  step="10"
                  value={nextCapacity}
                  onChange={(e) => setNextCapacity(+e.target.value)}
                />
              </label>
              <label htmlFor={`${id}-switch`}>
                {t('改变时刻')} · {switchAt}
                <input
                  id={`${id}-switch`}
                  type="range"
                  min="1"
                  max="12"
                  value={switchAt}
                  onChange={(e) => setSwitchAt(+e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      )}
      <details>
        <summary>{t('这是连续增长模型，不是离散混沌映射')}</summary>
        <p>
          {t(
            'dN/dt=rN(1−N/K)，N 是连续的归一化种群量，时间为任意一致单位。固定 r≥0、K>0，无迁入、时滞、随机性或捕食；不拟合真实生态。总增速在 K/2 最大，人均增速 r(1−N/K) 则持续下降。N>K 时下降，有限正初值不会凭空越过平衡点。K 改变时数量连续、斜率可跳变；不是把历史按新 K 重写。浅线为整段预测，深线为已观察段。',
          )}
        </p>
      </details>
    </section>
  );
}
