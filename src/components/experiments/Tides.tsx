import { useState } from 'react';
import { t } from '../../i18n';
import {
  tidesDefaults,
  tidesShot,
  tidesState,
  type TidesConfig,
  type TidesFocus,
} from '../../models/tides';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import TidesGlobe from '../three/TidesGlobe';
import {
  TidesVectorInset,
  TidesProfile,
  TidesDistanceGraph,
  TidesAlignment,
} from '../lab/TidesInstruments';
import '../../styles/tides.css';

const captions: Record<TidesFocus, string> = {
  gravity: '近侧、地心、远侧都向月球加速，但加速度不一样。',
  subtract: '减去地心加速度后，近侧相对向月，远侧相对背月；两边都远离地心。',
  equilibrium: '形变逐渐放大：同一潮汐势让理想海面在近、远两端隆起。',
  distance: '潮汐的主导项随距离的三次方衰减，比整体引力更敏感。',
  solar: '太阳也贡献潮汐项；日月同向时，两者的形变增强。',
  alignment: '日月成直线时，赤道平衡潮差较大；成直角时较小。',
  rotation: '在固定月球方向的平衡模型里，赤道观测点转过一圈，经过两个高度峰值。',
  latitude: '纬度可以让理想峰值不等高，甚至只剩一个；真实海岸还取决于海盆动力学。',
};
type View = 'ocean' | 'forces' | 'alignment' | 'latitude';
const initial = {
  config: { ...tidesDefaults },
  view: 'ocean' as View,
  absolute: false,
  gain: 2,
  flat: false,
  advanced: false,
};
export default function Tides() {
  const director = useShowcase(),
    compact = useCompact(),
    [manual, setManual] = useState(initial),
    [rendererRun, setRendererRun] = useState(0);
  const change = (patch: Partial<TidesConfig>) =>
    setManual((s) => ({ ...s, config: { ...s.config, ...patch } }));
  const manualFocus: TidesFocus =
    manual.view === 'forces'
      ? manual.absolute
        ? 'gravity'
        : 'subtract'
      : manual.view === 'alignment'
        ? 'alignment'
        : manual.view === 'latitude'
          ? 'latitude'
          : 'equilibrium';
  const s = director.watch
    ? tidesShot(director.chapter, director.chapterProgress)
    : tidesState(manual.config, manualFocus, 1, manual.view === 'forces' ? 0 : manual.gain * 1e6);
  const forces = ['gravity', 'subtract'].includes(s.focus),
    alignment = ['solar', 'alignment'].includes(s.focus),
    rotation = ['rotation', 'latitude'].includes(s.focus);
  const stateLabel =
    s.focus === 'gravity'
      ? t('比较外部引力')
      : s.focus === 'subtract'
        ? t('跟地心一起自由落体')
        : s.focus === 'distance'
          ? t('距离改变引力梯度')
          : alignment
            ? t('叠加日月潮汐势')
            : rotation
              ? t('理想观测点与纬圈')
              : t('从潮汐势到平衡海面');
  const reset = () => {
    setManual({ ...initial, config: { ...tidesDefaults } });
    setRendererRun((n) => n + 1);
  };
  const setView = (view: View) => setManual((s) => ({ ...s, view }));
  return (
    <div className="tides-scene" data-watch={director.watch} data-focus={s.focus}>
      <div className="tides-strip">
        <span>{stateLabel}</span>
        <span>{forces ? t('参考球上的加速度') : t('瞬时平衡海洋')}</span>
      </div>
      <div className={`tides-stage ${forces ? 'tides-stage-forces' : ''}`}>
        <TidesGlobe
          key={rendererRun}
          state={s}
          compact={compact}
          flat={manual.flat}
          onFlat={() => setManual((old) => ({ ...old, flat: !old.flat }))}
        />
        <div className="tides-instrument">
          {forces ? (
            <TidesVectorInset state={s} />
          ) : s.focus === 'distance' ? (
            <>
              <TidesDistanceGraph state={s} />
              <p className="tides-instrument-key">{t('实线：潮汐项 · 虚线：整体引力')}</p>
            </>
          ) : alignment ? (
            <>
              <TidesAlignment state={s} />
              {!compact && <TidesProfile state={s} compact={false} />}
            </>
          ) : (
            <>
              <TidesProfile state={s} compact={compact} />
              <p className="tides-instrument-key">
                {s.focus === 'latitude'
                  ? t('虚线：赤道、零赤纬')
                  : rotation
                    ? t('横轴：相对月球方向的转角')
                    : t('横轴：所选纬圈的方位角')}
              </p>
            </>
          )}
          {!compact && !forces && (
            <div className="tides-reference-note">
              <span>
                {t('近侧平衡高度')} <b>{s.near.toFixed(3)} m</b>
              </span>
              <span>
                {t('远侧平衡高度')} <b>{s.far.toFixed(3)} m</b>
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="tides-measure">
        {forces ? (
          <>
            <span>{t('地心为参照，不加额外远侧推力')}</span>
            <strong>Δa = a(r) − a(0)</strong>
          </>
        ) : s.focus === 'distance' ? (
          <>
            <span>D / D₀ = {s.config.moonDistance.toFixed(2)}</span>
            <strong>
              {t('主导潮汐强度')} ×{s.strengthRatio.toFixed(2)}
            </strong>
          </>
        ) : s.focus === 'solar' ? (
          <>
            <span>{t('太阳 / 月球潮汐强度')}</span>
            <strong>{(s.solarStrength / s.lunarStrength).toFixed(2)} ×</strong>
          </>
        ) : alignment ? (
          <>
            <span>
              {t('实际日月夹角')} {s.separation.toFixed(0)}°
            </span>
            <strong>
              {t('所选纬圈平衡潮差')} {s.profile.range.toFixed(3)} m
            </strong>
          </>
        ) : rotation ? (
          <>
            <span>
              φ = {s.config.latitude.toFixed(0)}° · δ = {s.config.declination.toFixed(0)}°
            </span>
            <strong>h = {s.surface.height.toFixed(3)} m</strong>
          </>
        ) : (
          <>
            <span>
              {t('海面形变放大')} ×{(s.gain / 1e6).toFixed(2)}M
            </span>
            <strong>h = W/g</strong>
          </>
        )}
      </div>
      <p className="tides-scope-note">{t('全球海洋近似 · 不作沿岸预报')}</p>
      {!director.watch && (
        <p className="tides-explanation">
          {s.config.moon === 0 && s.config.sun === 0
            ? t('所有天体项已关闭；差分引力与平衡形变都为零。')
            : manual.view === 'forces'
              ? t('箭头比较朝月球的分量；实际加速度由所有启用的天体项相加。')
              : t(captions[s.focus])}
        </p>
      )}
      {!director.watch && (
        <div className="tides-explore">
          <div className="tides-buttons" role="group" aria-label={t('潮汐观察方式')}>
            {(
              [
                ['ocean', '平衡海面'],
                ['forces', '比较引力'],
                ['alignment', '日月叠加'],
                ['latitude', '观测纬圈'],
              ] as const
            ).map(([view, label]) => (
              <button
                type="button"
                key={view}
                aria-pressed={manual.view === view}
                onClick={() => setView(view)}
              >
                {t(label)}
              </button>
            ))}
            <button type="button" onClick={reset}>
              {t('重置实验')}
            </button>
          </div>
          {manual.view === 'forces' && (
            <div className="tides-buttons" role="group" aria-label={t('引力参照系')}>
              <button
                type="button"
                aria-pressed={manual.absolute}
                onClick={() => setManual((s) => ({ ...s, absolute: true }))}
              >
                {t('原引力加速度')}
              </button>
              <button
                type="button"
                aria-pressed={!manual.absolute}
                onClick={() => setManual((s) => ({ ...s, absolute: false }))}
              >
                {t('减去地心加速度')}
              </button>
            </div>
          )}
          <Range
            label={t('月地距离倍率')}
            value={s.config.moonDistance}
            min={0.8}
            max={1.4}
            step={0.01}
            unit="D₀"
            onChange={(moonDistance) => change({ moonDistance })}
          />
          <div className="tides-buttons" role="group" aria-label={t('参与计算的天体引力项')}>
            <button
              type="button"
              aria-pressed={s.config.moon > 0}
              onClick={() => change({ moon: s.config.moon ? 0 : 1 })}
            >
              {t('月球项')}
            </button>
            <button
              type="button"
              aria-pressed={s.config.sun > 0}
              onClick={() => change({ sun: s.config.sun ? 0 : 1 })}
            >
              {t('太阳项')}
            </button>
          </div>
          {s.config.sun > 0 && (
            <Range
              label={t('太阳在赤道面的方位角')}
              value={s.config.alignment}
              min={0}
              max={180}
              step={1}
              unit="°"
              onChange={(alignment) => change({ alignment })}
            />
          )}
          {(manual.view === 'forces' || manual.view === 'latitude') && (
            <>
              <Range
                label={t('观测纬度')}
                value={s.config.latitude}
                min={-80}
                max={80}
                step={1}
                unit="°"
                onChange={(latitude) => change({ latitude })}
              />
              <Range
                label={t('相对月球的转角')}
                value={s.config.rotation}
                min={0}
                max={360}
                step={1}
                unit="°"
                onChange={(rotation) => change({ rotation })}
              />
            </>
          )}
          <details
            open={manual.advanced}
            onToggle={(event) => {
              const advanced = event.currentTarget.open;
              setManual((s) => (s.advanced === advanced ? s : { ...s, advanced }));
            }}
          >
            <summary>{t('展开赤纬、形变与模型范围')}</summary>
            <Range
              label={t('月球赤纬')}
              value={s.config.declination}
              min={-30}
              max={30}
              step={1}
              unit="°"
              onChange={(declination) => change({ declination })}
            />
            <Range
              label={t('海面形变放大倍率')}
              value={manual.gain}
              min={0}
              max={2}
              step={0.05}
              unit="×10⁶"
              onChange={(gain) => setManual((s) => ({ ...s, gain }))}
            />
            <p>
              {t(
                '球面代表无陆地的参考地球。海面高度由 W/g 计算；形变可放大两百万倍，天体间距压缩，月球指示大小不用于计算。',
              )}
            </p>
            <p>
              {t(
                '模型省略海盆、摩擦、科里奥利力、海水自引力与固体地球弹性。转角是几何参数，不是当地钟表时间。',
              )}
            </p>
            <p>{t('太阳固定在赤道平面。月球有赤纬时，投影方位角与实际空间夹角分别计算。')}</p>
            <p>
              {t(
                '0.8 至 1.4 倍距离是受控思想实验，不是月球真实历表；关闭天体项只表示从计算中移除这一项。',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
