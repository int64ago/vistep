import { useState } from 'react';
import { t } from '../../i18n';
import {
  rainbowColor,
  rainbowShot,
  rainbowStationary,
  traceRainbow,
  type RainbowView,
} from '../../models/rainbow';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import {
  RainbowConcentration,
  RainbowDrop,
  RainbowObserver,
  RainbowSky,
  RainbowSpectrum,
} from '../lab/RainbowDrawing';
import '../../styles/rainbow.css';

const viewLabels: Record<RainbowView, string> = {
  drop: '水滴光路',
  concentration: '方向为何集中',
  dispersion: '不同颜色的方向',
  observer: '光怎样到达眼睛',
  sky: '为什么是一道弧',
};
export default function Rainbow() {
  const demo = useShowcase(),
    compact = useCompact();
  const [impact, setImpact] = useState(0.86),
    [wavelength, setWavelength] = useState(550),
    [sunAltitude, setSunAltitude] = useState(12),
    [twoDrops, setTwoDrops] = useState(false),
    [manualView, setManualView] = useState<RainbowView>('drop');
  const shot = rainbowShot(demo.chapter, demo.chapterProgress);
  const view = demo.watch ? shot.view : manualView,
    ray = demo.watch ? shot.ray : traceRainbow(impact, wavelength),
    altitude = demo.watch ? shot.sunAltitude : sunAltitude,
    both = demo.watch ? shot.twoDrops : twoDrops;
  const micro = view === 'drop' || view === 'concentration' || view === 'dispersion';
  const stage = demo.watch ? shot.normal : 0;
  return (
    <div className="rainbow-study" data-view={view} data-watch={demo.watch}>
      <div className="rainbow-heading">
        <span>{t('雨后的光学')}</span>
        <span>{t(viewLabels[view])}</span>
      </div>
      <div className="rainbow-visual">
        {micro ? (
          <>
            <RainbowDrop
              ray={ray}
              reveal={demo.watch ? shot.reveal : 4}
              normal={stage}
              fan={view === 'concentration'}
              spectrum={view === 'dispersion'}
              compact={compact}
            />
            {view === 'concentration' && <RainbowConcentration ray={ray} compact={compact} />}
            {view === 'dispersion' && (
              <RainbowSpectrum wavelength={ray.wavelengthNm} compact={compact} />
            )}
            {view === 'drop' && (
              <div className="rainbow-path-steps" aria-label={t('主虹光路的三个接触点')}>
                {['入水', '内反射', '出水'].map((label, i) => (
                  <span key={label} data-active={!demo.watch || stage === i + 1}>
                    <b>{i + 1}</b>
                    {t(label)}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : view === 'observer' ? (
          <>
            <RainbowObserver
              sunAltitude={altitude}
              twoDrops={both}
              revealSecond={demo.watch ? shot.revealSecond : 1}
              compact={compact}
            />
            <div className="rainbow-observer-key">
              <span>
                <i style={{ background: rainbowColor(700) }} />A · 700 nm
              </span>
              <span>
                <i style={{ background: rainbowColor(400) }} />
                {both ? 'B' : 'A'} · 400 nm
              </span>
            </div>
            <p className="rainbow-view-note">
              {t(
                both
                  ? '红光和紫光，来自不同位置的水滴。'
                  : '同一入射位置的紫光沿虚线离开，错过眼睛。',
              )}
            </p>
          </>
        ) : (
          <>
            <RainbowSky sunAltitude={altitude} compact={compact} />
            <div className="rainbow-sky-key">
              <span>{t('横线：地平线')}</span>
              <span>{t('十字：反太阳方向')}</span>
            </div>
            <p className="rainbow-view-note">
              {t(
                altitude > rainbowStationary(700).angle
                  ? '太阳太高，主虹落在地平线下。'
                  : '每个颜色占据不同的角度圆锥。',
              )}
            </p>
          </>
        )}
      </div>
      <div className="rainbow-readout">
        {micro ? (
          <>
            <span>
              <small>
                {t(
                  stage === 1
                    ? '入射角 / 折射角'
                    : stage === 2
                      ? '内部反射的部分'
                      : '当前光线偏离反向的角度',
                )}
              </small>
              <b>
                {stage === 1
                  ? `${ray.incidence.toFixed(1)}° / ${ray.refraction.toFixed(1)}°`
                  : stage === 2
                    ? `${((100 * ray.power.reflectedInside) / ray.power.entered).toFixed(1)}%`
                    : `${ray.angle.toFixed(2)}°`}
              </b>
            </span>
            <span>
              <small>
                {t(
                  view === 'concentration'
                    ? '最集中的入口 b/R'
                    : view === 'dispersion'
                      ? '水的折射率'
                      : '主虹支路 / 入射光',
                )}
              </small>
              <b>
                {view === 'concentration'
                  ? ray.stationary.impact.toFixed(4)
                  : view === 'dispersion'
                    ? ray.index.toFixed(5)
                    : `${(100 * ray.power.primary).toFixed(1)}%`}
              </b>
            </span>
          </>
        ) : (
          <>
            <span>
              <small>{t('太阳高度角')}</small>
              <b>{altitude.toFixed(1)}°</b>
            </span>
            <span>
              <small>{t(view === 'observer' ? '阳光来自身后' : '主虹角：紫到红')}</small>
              <b>
                {view === 'observer'
                  ? '☀ →'
                  : `${rainbowStationary(400).angle.toFixed(1)}°–${rainbowStationary(700).angle.toFixed(1)}°`}
              </b>
            </span>
          </>
        )}
      </div>
      {!demo.watch && (
        <div className="rainbow-explore">
          <div className="rainbow-view-switch" role="group" aria-label={t('选择彩虹观察方式')}>
            {(Object.keys(viewLabels) as RainbowView[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={manualView === v}
                onClick={() => setManualView(v)}
              >
                {t(viewLabels[v])}
              </button>
            ))}
          </div>
          <div className="rainbow-controls">
            {micro ? (
              <>
                <Range
                  label={t('入射偏移 b/R')}
                  value={impact}
                  min={0}
                  max={0.999}
                  step={0.001}
                  onChange={setImpact}
                />
                <Range
                  label={t('光的波长')}
                  value={wavelength}
                  min={400}
                  max={700}
                  unit="nm"
                  onChange={setWavelength}
                />
              </>
            ) : (
              <Range
                label={t('太阳高度角')}
                value={sunAltitude}
                min={0}
                max={55}
                unit="°"
                onChange={setSunAltitude}
              />
            )}
          </div>
          {micro ? (
            <button
              type="button"
              onClick={() => {
                setImpact(rainbowStationary(wavelength).impact);
                setManualView('concentration');
              }}
            >
              {t('追到最集中的入口')}
            </button>
          ) : view === 'observer' ? (
            <button type="button" onClick={() => setTwoDrops((v) => !v)}>
              {t(both ? '只留下同一滴水' : '让另一滴送来紫光')}
            </button>
          ) : (
            <button type="button" onClick={() => setSunAltitude(sunAltitude < 43 ? 50 : 12)}>
              {t(sunAltitude < 43 ? '把太阳升高' : '回到低太阳')}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setImpact(0.86);
              setWavelength(550);
              setSunAltitude(12);
              setTwoDrops(false);
              setManualView('drop');
            }}
          >
            {t('重置彩虹实验')}
          </button>
        </div>
      )}
      <details className="rainbow-method">
        <summary>{t('光路约定与模型边界')}</summary>
        <p>
          {t(
            '球形水滴、平行日光、空气折射率近似为 1。水折射率使用 IAPWS 公式，固定 20°C 与 998.2 kg/m³。',
          )}
        </p>
        <p>
          {t(
            '本片只追踪主虹的一次内部反射。接触处同时有透射分支；这里不是全反射。功率计算分别保留 s、p 偏振再求和。',
          )}
        </p>
        <p>
          {t(
            '角度分箱按相同入射截面积采样，不是相同高度等权相加，也不是天空亮度预报。几何光学的集中由有限角度分箱显示。',
          )}
        </p>
        <p>
          {t(
            '观察者图将距离缩短，仍从水滴表面精确求出到眼睛的光线。A、B 是不同位置的水滴，不是一滴水把整条色带投进眼睛。',
          )}
        </p>
        <p>
          {t(
            '画面线宽、颜色与亮度用于辨认光路，不代表真实光谱或光强。未模拟衍射、干涉、有限太阳圆面、非球形大雨滴或多次散射。',
          )}
        </p>
        <p>
          {t(
            '太阳太高时，平地观察者的主虹方向会落到地平线以下；飞机或高处向下看水滴，是不同的观察条件。',
          )}
        </p>
        <a
          href="https://iapws.org/documents/release/Rindex.download"
          target="_blank"
          rel="noreferrer"
        >
          IAPWS · {t('水的色散')}
        </a>
        <a
          href="https://www.physics.harvard.edu/sites/g/files/omnuum6476/files/physics/files/sol81.pdf"
          target="_blank"
          rel="noreferrer"
        >
          Harvard · {t('彩虹的驻值方向')}
        </a>
      </details>
    </div>
  );
}
