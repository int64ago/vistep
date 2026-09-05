import { useEffect, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  convectionDiagnostics,
  convectionShot,
  type ConvectionOptions,
} from '../../models/convection';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { useConvection } from '../lab/useConvection';
import ConvectionCell from '../lab/ConvectionCell';
import '../../styles/convection.css';
const observations = [
  '没有流动，热也会扩散；完全对称的初态不会凭空长出涡旋。',
  '重置为导热温度层，加入相同的小扰动，看它能否长大。',
  '下热上冷时，温度扰动与浮力耦合，逐渐形成上升暖流。',
  '上升必须有回流；亮点和染料由同一个封闭速度场搬运。',
  '保留相同温差，去掉浮力耦合：传导仍在，携热流动消失。',
  '只交换冷热板，扰动不再长大；热从上方主要靠传导向下走。',
  '把两板调到同温，余热与惯性不会瞬间消失，流动逐步衰减。',
  '加密网格仍得到对流，但数值会变化；本演示不测量临界阈值。',
];
const number = (v: number, d = 4) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
export default function Convection() {
  const film = useShowcase(),
    phoneFilm = useCompact() && film.watch,
    [heating, setHeating] = useState<'below' | 'above'>('below'),
    [buoyancy, setBuoyancy] = useState(1),
    [viscosity, setViscosity] = useState(0.02),
    [seed, setSeed] = useState(0.02),
    [time, setTime] = useState(0),
    [dye, setDye] = useState(false),
    [compare, setCompare] = useState(false),
    [focus, setFocus] = useState(false);
  const shot = convectionShot(film.chapter, film.chapterProgress);
  const options: ConvectionOptions = film.watch
    ? shot.primary
    : { heating, buoyancy, viscosity, seed };
  const second = film.watch
    ? shot.comparison
    : compare
      ? ({ ...options, heating: heating === 'below' ? 'above' : 'below' } as ConvectionOptions)
      : null;
  const modelTime = film.watch ? shot.time : time,
    view = film.watch ? shot.view : dye ? 'dye' : 'plume';
  const a = useConvection(options, modelTime),
    b = useConvection(second ?? {}, modelTime, !!second);
  const da = useMemo(() => convectionDiagnostics(a.state), [a.state]),
    db = useMemo(() => convectionDiagnostics(b.state), [b.state]);
  const pending = a.pending || (!!second && b.pending),
    error = a.error || (!!second && b.error),
    grid = view === 'grid';
  const [showPending, setShowPending] = useState(false);
  useEffect(() => {
    if (!pending) {
      setShowPending(false);
      return;
    }
    const timer = setTimeout(() => setShowPending(true), 200);
    return () => clearTimeout(timer);
  }, [pending]);
  const titleA =
    a.state.p.offAt !== null && da.time >= a.state.p.offAt
      ? '两板同温'
      : grid
        ? '标准网格 30 × 20'
        : a.state.p.heating === 'below'
          ? '下方加热'
          : '上方加热';
  const titleB = grid
    ? '较细网格 42 × 28'
    : view === 'transport'
      ? '浮力耦合关闭'
      : b.state.p.heating === 'below'
        ? '下方加热'
        : '上方加热';
  const note = error
    ? '计算已停止，请重置实验。'
    : pending
      ? '正在重建所选时刻；画面读数对应当前已完成的计算。'
      : film.watch
        ? observations[shot.chapter]
        : heating === 'above'
          ? observations[5]
          : dye
            ? observations[3]
            : '改变一个条件，在相同模型时间比较流动与携热。';
  const convention = grid
    ? '网格和迎风格式带来数值耗散；读数不是实验测量。'
    : view === 'seed'
      ? '人为指定的小温度扰动幅度为 0.02，没有随机种子。'
      : view === 'cooldown'
        ? 't* = 24 起，两块恒温板均设为 0.5。'
        : view === 'conduction'
          ? '本章无横向扰动；接下来从导热温度层重新开始。'
          : '四壁不穿透、自由滑移；侧壁绝热，温度与时间均无量纲。';
  const reset = () => {
    setHeating('below');
    setBuoyancy(1);
    setViscosity(0.02);
    setSeed(0.02);
    setTime(0);
    setDye(false);
    setCompare(false);
    setFocus(false);
  };
  return (
    <section
      className="convection-study"
      data-view={view}
      data-watch={film.watch}
      data-phone-film={phoneFilm}
      data-focus={film.watch ? film.chapterProgress >= 0.52 : focus}
      aria-busy={pending}
    >
      <div className="convection-kicker">
        <span>{t('对流 / 热开始搬家')}</span>
        <span>{t('无量纲二维模型')}</span>
        {(showPending || error) && (
          <span role="status" className="convection-status" title={t(note)}>
            {t(error ? '计算停止' : '重建中')}
          </span>
        )}
      </div>
      {!film.watch && <p className="convection-observation">{t(note)}</p>}
      <div className={`convection-cells${second ? ' convection-compare' : ''}`}>
        <ConvectionCell state={a.state} title={t(titleA)} view={view} compact={!!second} />
        {second && (
          <ConvectionCell
            state={b.state}
            title={t(titleB)}
            view={grid ? 'grid' : 'transport'}
            compact
          />
        )}
      </div>
      {second && !film.watch && (
        <button type="button" className="convection-phone-focus" onClick={() => setFocus(!focus)}>
          {t(focus ? '查看基准格子' : '查看对照格子')}
        </button>
      )}
      <div className="convection-temperature-key">
        <span>
          <i />
          {t('冷')} · 0
        </span>
        <span>{t(view === 'dye' ? '染料浓度以紫色叠加' : '相对温度 T*')}</span>
        <span>
          1 · {t('暖')}
          <i />
        </span>
      </div>
      {second ? (
        <div className="convection-readouts convection-pair-readouts">
          <div>
            <span>
              {t(
                phoneFilm
                  ? titleA
                  : grid
                    ? '标准网格携热'
                    : view === 'transport'
                      ? '浮力开启的携热'
                      : a.state.p.heating === 'below'
                        ? '下方加热的携热'
                        : '上方加热的携热',
              )}
            </span>
            <b>{number(da.convective)}</b>
          </div>
          <div>
            <span>
              {t(
                phoneFilm
                  ? titleB
                  : grid
                    ? '较细网格携热'
                    : view === 'transport'
                      ? '浮力关闭的携热'
                      : b.state.p.heating === 'below'
                        ? '下方加热的携热'
                        : '上方加热的携热',
              )}
            </span>
            <b>{number(db.convective)}</b>
          </div>
          <p>{t(phoneFilm ? '向上携热' : '中截面平均的向上携热通量；负号表示向下。')}</p>
        </div>
      ) : view === 'conduction' ? (
        <div className="convection-readouts">
          <div>
            <span>{t('最大流速')}</span>
            <b>{number(da.maxSpeed)}</b>
          </div>
          <div>
            <span>{t(phoneFilm ? '传导通量' : '中截面传导通量')}</span>
            <b>{number(da.conductive)}</b>
          </div>
        </div>
      ) : view === 'cooldown' ? (
        <div className="convection-readouts">
          <div>
            <span>{t('动能积分')}</span>
            <b>{da.energy < 1e-5 ? da.energy.toExponential(2) : number(da.energy, 5)}</b>
          </div>
          <div>
            <span>{t('温度分布跨度')}</span>
            <b>{number(da.maxTemperature - da.minTemperature)}</b>
          </div>
        </div>
      ) : (
        <div className="convection-readouts">
          <div>
            <span>{t('最大流速')}</span>
            <b>{number(da.maxSpeed)}</b>
          </div>
          <div>
            <span>{t(phoneFilm ? '携热通量' : '中截面携热通量')}</span>
            <b>{number(da.convective)}</b>
          </div>
        </div>
      )}
      {!phoneFilm && <p className="convection-convention">{t(convention)}</p>}
      {!film.watch && (
        <div className="convection-explore">
          <div className="convection-switches" role="group" aria-label={t('恒温板配置')}>
            <button
              type="button"
              aria-pressed={heating === 'below'}
              onClick={() => setHeating('below')}
            >
              {t('下方加热')}
            </button>
            <button
              type="button"
              aria-pressed={heating === 'above'}
              onClick={() => setHeating('above')}
            >
              {t('上方加热')}
            </button>
          </div>
          <Range
            label={t('模型时间（无量纲）')}
            value={time}
            min={0}
            max={52}
            step={0.25}
            unit="t*"
            onChange={setTime}
          />
          <Range
            label={t('浮力耦合强度')}
            value={buoyancy}
            min={0}
            max={1.5}
            step={0.1}
            onChange={setBuoyancy}
          />
          <Range
            label={t('动量扩散系数')}
            value={viscosity}
            min={0.015}
            max={0.06}
            step={0.005}
            onChange={setViscosity}
          />
          <Range
            label={t('初始温度扰动幅度')}
            value={seed}
            min={0}
            max={0.04}
            step={0.005}
            onChange={setSeed}
          />
          <div className="convection-switches convection-options">
            <button type="button" aria-pressed={dye} onClick={() => setDye(!dye)}>
              {t('显示染料')}
            </button>
            <button type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}>
              {t('比较反向温差')}
            </button>
          </div>
          <button type="button" className="convection-reset" onClick={reset}>
            {t('重置对流实验')}
          </button>
        </div>
      )}
      <details className="convection-method">
        <summary>{t('边界、数值与模型限制')}</summary>
        {phoneFilm && <p>{t(convention)}</p>}
        {phoneFilm && <p>{t('中截面平均的向上携热通量；负号表示向下。')}</p>}
        <p>
          {t(
            '这是闭合二维 Boussinesq 教学网格：密度变化只进入浮力项。玻璃外观是示意，速度边界为自由滑移，不是真实玻璃壁的无滑移条件。',
          )}
        </p>
        <p>
          {t(
            '单元内热量和染料由同一无散度面速度输运。温度板固定，侧壁绝热；流函数在四壁为零。亮点按计算速度前进，没有预设圆形轨道。',
          )}
        </p>
        <p>
          {t(
            '宽高比 1.5；标准网格 30 × 20，热扩散系数 0.01，动量扩散系数默认 0.02。时间和读数均无量纲，不对应某杯水的秒数、摄氏温度或瓦数。',
          )}
        </p>
        <p>
          {t(
            '一阶迎风输运会产生额外数值扩散；物理黏性与数值耗散不可混为一谈。模型不测量临界 Rayleigh 数，不预测真实三维湍流、沸腾或自由液面。',
          )}
        </p>
        <dl>
          <div>
            <dt>{t('最大离散散度')}</dt>
            <dd>{da.divergence.toExponential(2)}</dd>
          </div>
          <div>
            <dt>{t('累计热量账本残差')}</dt>
            <dd>{Math.abs(da.heatResidual).toExponential(2)}</dd>
          </div>
          <div>
            <dt>{t('染料总量残差')}</dt>
            <dd>{Math.abs(da.dyeResidual).toExponential(2)}</dd>
          </div>
          <div>
            <dt>{t('最大输运 Courant 数')}</dt>
            <dd>{a.state.maxCourant.toFixed(3)}</dd>
          </div>
        </dl>
        {(a.fallback || (!!second && b.fallback)) && (
          <p>{t('Worker 不可用，正在分块重建同一模型；不是另一个预设动画。')}</p>
        )}
        <p>
          {t(
            '重播与跳转从固定初态和时间步重建；后台与离屏由共用播放器暂停。Canvas 不可用时，以同一计算场绘制 SVG。',
          )}
        </p>
      </details>
    </section>
  );
}
