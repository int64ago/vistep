import { useState } from 'react';
import { t } from '../../i18n';
import {
  solarCellDefaults,
  solarCellBudget,
  solarCellCurve,
  solarCellMaximum,
  solarCellEpisode,
  solarCellThreshold,
  solarCellPhotonEnergy,
  solarCellShot,
  type SolarCellConfig,
  type SolarCellShot,
  type SolarCellFocus,
} from '../../models/solar-cell';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import {
  SolarCellThresholdView,
  SolarCellJunction,
  SolarCellIV,
  SolarCellLedger,
  SolarCellEquivalent,
} from '../lab/SolarCellBench';
import '../../styles/solar-cell.css';

const captions: Record<SolarCellFocus, string> = {
  threshold: '越过带隙才可能激发电荷对；多出来的光子能量先变成热。',
  pair: '一对等量异号电荷同时出现；结区电场让电子与空穴向相反方向移动。',
  circuit: '电子沿接点、导线与负载返回；空穴留在电池内，闭合路径才持续输出。',
  load: '负载直线与 I–V 曲线的交点，决定真实电流、电压与输出功率。',
  limits: '开路有电压却没有外电流；短路有电流却没有负载电压。两者输出都为零。',
  light: '增加照度提高光生电流；暗态的被动负载没有可用输出。',
  temperature: '这组硅电池参数中，升温略增短路电流，却降低开路电压与最大功率。',
  losses: '先减少被收集的电荷，再增大串联电阻：复合与发热是不同损失。',
};
type View = 'junction' | 'curve' | 'energy' | 'spectrum';
const initial = {
  config: { ...solarCellDefaults },
  view: 'curve' as View,
  time: 0.68,
  route: 'external' as 'external' | 'recombine',
  advanced: false,
};
export default function SolarCell() {
  const director = useShowcase(),
    compact = useCompact();
  const [manual, setManual] = useState(initial);
  const change = (patch: Partial<SolarCellConfig>) =>
    setManual((s) => ({ ...s, config: { ...s.config, ...patch } }));
  let shot: SolarCellShot;
  if (director.watch) shot = solarCellShot(director.chapter, director.chapterProgress);
  else {
    const b = solarCellBudget(manual.config),
      focus: SolarCellFocus =
        manual.view === 'junction'
          ? 'circuit'
          : manual.view === 'energy'
            ? 'losses'
            : manual.view === 'spectrum'
              ? 'threshold'
              : 'load';
    shot = {
      ...b,
      config: manual.config,
      focus,
      progress: manual.time,
      curve: solarCellCurve(b.p),
      maximum: solarCellMaximum(b.p),
      episode: solarCellEpisode(manual.time, manual.route),
      threshold: (manual.config.spectrum === 'mono'
        ? [solarCellPhotonEnergy(manual.config.wavelength)]
        : [0.9, 1.55, 2.55]
      ).map((e) => solarCellThreshold(e, manual.time, manual.config.temperature)),
    };
  }
  const { focus, config, point } = shot,
    carrier = ['pair', 'circuit'].includes(focus);
  const view = (v: View) =>
    setManual((s) => ({
      ...s,
      view: v,
      config: v === 'junction' ? { ...solarCellDefaults } : s.config,
      time: v === 'spectrum' ? 1 : s.time,
    }));
  const stateLabel =
    focus === 'threshold'
      ? t('每个光子，单独记账')
      : carrier
        ? t('结区与闭合路径')
        : focus === 'limits'
          ? config.mode === 'open'
            ? t('开路：电流为零')
            : t('短路：电压为零')
          : focus === 'light'
            ? t('从暗态到日照')
            : focus === 'temperature'
              ? t('只改变电池温度')
              : focus === 'losses'
                ? t('追踪同一份入射能量')
                : t('寻找负载工作点');
  return (
    <div className="solar-cell-scene" data-watch={director.watch} data-focus={focus}>
      <div className="solar-cell-strip">
        <span>{stateLabel}</span>
        <span>
          {config.temperature.toFixed(0)}°C · {config.irradiance.toFixed(0)} W/m²
        </span>
      </div>
      <div className={`solar-cell-stage ${focus === 'threshold' ? 'solar-cell-stage-single' : ''}`}>
        {focus === 'threshold' ? (
          <SolarCellThresholdView shot={shot} compact={compact} />
        ) : carrier ? (
          <>
            <SolarCellJunction shot={shot} compact={compact} />
            {!compact && (
              <div className="solar-cell-carrier-note">
                <span>{t('一对电荷的慢放示意')}</span>
                <strong>
                  {shot.episode.complete
                    ? t('在同一位置复合')
                    : shot.episode.absorbed
                      ? '−e + e = 0'
                      : t('800 nm 入射光子')}
                </strong>
                <p>{t('标记数量不是电流大小。稳态电流由下方的单二极管模型计算。')}</p>
                <SolarCellEquivalent shot={shot} />
              </div>
            )}
          </>
        ) : focus === 'losses' ? (
          <>
            {!compact && <SolarCellIV shot={shot} compact={false} />}
            <SolarCellLedger shot={shot} />
          </>
        ) : (
          <>
            <SolarCellIV shot={shot} compact={compact} />
            {!compact && (
              <div className="solar-cell-circuit-panel">
                <SolarCellEquivalent shot={shot} />
                <p>
                  {t('最大功率')} <strong>{shot.maximum.power.toFixed(2)} W</strong>
                </p>
                <p>
                  {t('光生电流')} <strong>{shot.p.il.toFixed(2)} A</strong>
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="solar-cell-measure">
        {focus === 'threshold' ? (
          config.spectrum === 'mono' ? (
            <>
              <span>
                {t('入射光功率')} {shot.incident.toFixed(2)} W
              </span>
              <strong>
                {t('光生电流')} {shot.p.il.toFixed(2)} A
              </strong>
            </>
          ) : (
            <>
              <span>{t('入射光不等于电流')}</span>
              <strong>{t('反射、透过、复合均计入')}</strong>
            </>
          )
        ) : carrier ? (
          <>
            <span>{shot.episode.complete ? t('一对电荷的路径已闭合') : t('电场只画在结区')}</span>
            <strong>
              {t('电子')} − · {t('空穴')} +
            </strong>
          </>
        ) : focus === 'losses' ? (
          <>
            <span>
              {t('收集倍率')} {config.collection.toFixed(2)}
            </span>
            <strong>Rₛ = {(shot.p.rs * 1000).toFixed(1)} mΩ</strong>
          </>
        ) : (
          <>
            <span>
              {point.voltage.toFixed(3)} V × {point.current.toFixed(2)} A
            </span>
            <strong>{point.power.toFixed(2)} W</strong>
          </>
        )}
      </div>
      {!director.watch && (
        <p className="solar-cell-explanation">
          {manual.view === 'junction' && manual.route === 'recombine'
            ? t('在电池内复合')
            : t(captions[focus])}
        </p>
      )}
      {!director.watch && (
        <div className="solar-cell-explore">
          <div className="solar-cell-buttons" role="group" aria-label={t('太阳能电池观察方式')}>
            {(
              [
                ['curve', '电路工作点'],
                ['junction', '跟踪一对电荷'],
                ['energy', '能量账本'],
                ['spectrum', '单色光门槛'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={manual.view === v}
                onClick={() => view(v)}
              >
                {t(label)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setManual({ ...initial, config: { ...solarCellDefaults } })}
            >
              {t('重置实验')}
            </button>
          </div>
          {manual.view === 'junction' ? (
            <>
              <Range
                label={t('选定光子与电荷对的进程')}
                value={manual.time}
                min={0}
                max={1}
                step={0.01}
                onChange={(time) => setManual((s) => ({ ...s, time }))}
              />
              <div className="solar-cell-buttons" role="group" aria-label={t('选定电荷对的去向')}>
                <button
                  type="button"
                  aria-pressed={manual.route === 'external'}
                  onClick={() => setManual((s) => ({ ...s, route: 'external', time: 0 }))}
                >
                  {t('经外电路返回')}
                </button>
                <button
                  type="button"
                  aria-pressed={manual.route === 'recombine'}
                  onClick={() => setManual((s) => ({ ...s, route: 'recombine', time: 0 }))}
                >
                  {t('在电池内复合')}
                </button>
              </div>
              <p>
                {t(
                  '固定 800 nm 的一次吸收事件。路径按阶段慢放，不表示微观输运速度或全部光子的命运。',
                )}
              </p>
            </>
          ) : (
            <>
              {manual.view === 'spectrum' && (
                <>
                  <div className="solar-cell-buttons" role="group" aria-label={t('入射光谱模型')}>
                    <button
                      type="button"
                      aria-pressed={config.spectrum === 'sun'}
                      onClick={() => change({ spectrum: 'sun' })}
                    >
                      {t('三能段教学光谱')}
                    </button>
                    <button
                      type="button"
                      aria-pressed={config.spectrum === 'mono'}
                      onClick={() => change({ spectrum: 'mono' })}
                    >
                      {t('单色入射')}
                    </button>
                  </div>
                  <Range
                    label={t('单色光波长')}
                    value={config.wavelength}
                    min={350}
                    max={1400}
                    step={5}
                    unit="nm"
                    onChange={(wavelength) => change({ wavelength, spectrum: 'mono' })}
                  />
                  <p>
                    {t(
                      '同样的入射瓦数，不等于同样的光子数。这里只显示能否激发一对电荷；实际吸收与收集比例仍由能量账本核算。',
                    )}
                  </p>
                </>
              )}
              <Range
                label={t('电池辐照度')}
                value={config.irradiance}
                min={0}
                max={1200}
                step={10}
                unit="W/m²"
                onChange={(irradiance) => change({ irradiance })}
              />
              <Range
                label={t('电池温度')}
                value={config.temperature}
                min={-10}
                max={75}
                step={1}
                unit="°C"
                onChange={(temperature) => change({ temperature })}
              />
              <div className="solar-cell-buttons" role="group" aria-label={t('电池端口连接')}>
                {(['load', 'open', 'short'] as const).map((mode, i) => (
                  <button
                    type="button"
                    key={mode}
                    aria-pressed={config.mode === mode}
                    onClick={() => change({ mode })}
                  >
                    {t(['接入负载', '开路', '短路'][i])}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={shot.maximum.resistance > 10}
                  title={t('支持的负载范围为 0 至 10 Ω')}
                  onClick={() => change({ mode: 'load', resistance: shot.maximum.resistance })}
                >
                  {t('匹配最大功率负载')}
                </button>
              </div>
              {config.mode === 'load' && (
                <Range
                  label={t('外部负载电阻')}
                  value={config.resistance}
                  min={0}
                  max={10}
                  step={0.0001}
                  unit="Ω"
                  onChange={(resistance) => change({ resistance })}
                />
              )}
              <details
                open={manual.advanced}
                onToggle={(e) => {
                  const advanced = e.currentTarget.open;
                  setManual((s) => (s.advanced === advanced ? s : { ...s, advanced }));
                }}
              >
                <summary>{t('展开损失与模型范围')}</summary>
                <Range
                  label={t('电荷收集倍率')}
                  value={config.collection}
                  min={0.5}
                  max={1}
                  step={0.01}
                  onChange={(collection) => change({ collection })}
                />
                <Range
                  label={t('串联电阻倍率')}
                  value={config.series}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={(series) => change({ series })}
                />
                <p>
                  {t(
                    '96 个相同串联电池的公开拟合参数，换算为一个等效电池。三能段光谱、4% 反射和 90% 带上吸收是教学假设，不是光谱实测。',
                  )}
                </p>
                <p>
                  {t(
                    '结电压能量差是带边能量与结电压自由能之间的剩余项，不是实测热分布。模型不包含反向击穿、旁路二极管或整板局部遮挡。',
                  )}
                </p>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
