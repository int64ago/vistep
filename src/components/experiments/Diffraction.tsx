import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import {
  DIFFRACTION_DEFAULT,
  DIFFRACTION_SIDE_PEAK_BETA,
  diffractionPositionForBeta,
  diffractionProfile,
  diffractionShot,
  diffractionState,
} from '../../models/diffraction';
import {
  DiffractionAperture,
  DiffractionDistance,
  DiffractionLimits,
  DiffractionPhasors,
  DiffractionScreen,
} from '../lab/DiffractionOptics';
import '../../styles/diffraction.css';

export default function Diffraction() {
  const demo = useShowcase(),
    root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960),
    [parameters, setParameters] = useState({ ...DIFFRACTION_DEFAULT }),
    [probe, setProbe] = useState(0);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(220, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const shot = diffractionShot(demo.chapter, demo.chapterProgress);
  const state = demo.watch ? shot.state : diffractionState(parameters, probe);
  const view = demo.watch ? shot.view : 'sum';
  const compact = width < 720;
  const showPhasors = ['sum', 'cancel', 'square'].includes(view);
  const showDistance = view === 'distance' || !state.validity.usable;
  const paired = showPhasors || showDistance;
  const showAperture = !(demo.watch && compact && paired);
  const panelWidth = paired && !compact ? (width - 28) / 2 : width;
  const profile = useMemo(
    () => diffractionProfile(state),
    [state.parameters.slitUm, state.parameters.wavelengthNm, state.parameters.distanceM],
  );
  const time = demo.watch ? demo.time : 0;
  const first = state.firstMinimum;
  const sidePeak = diffractionPositionForBeta(parameters, DIFFRACTION_SIDE_PEAK_BETA);
  const set = (key: keyof typeof parameters, value: number) =>
    setParameters((old) => ({ ...old, [key]: value }));
  return (
    <div
      className="diffraction-study"
      data-diffraction-view={view}
      data-compact={compact}
      data-watch={demo.watch}
    >
      <div className="diffraction-heading">
        <span>{t('衍射 · 一道狭缝的合奏')}</span>
        <span>{t('单色光 · 单缝 · 远场')}</span>
      </div>
      {view !== 'limits' && (
        <div className="diffraction-parameters">
          <span>
            <i>
              <span className="diffraction-parameter-name">{t('缝宽')} </span>a
            </i>
            <b>{state.parameters.slitUm.toFixed(1)} μm</b>
          </span>
          <span>
            <i>
              <span className="diffraction-parameter-name">{t('波长')} </span>λ
            </i>
            <b>{state.parameters.wavelengthNm.toFixed(0)} nm</b>
          </span>
          <span>
            <i>
              <span className="diffraction-parameter-name">{t('屏距')} </span>L
            </i>
            <b>{state.parameters.distanceM.toFixed(3)} m</b>
          </span>
        </div>
      )}
      <div className="diffraction-body" ref={root}>
        {view === 'limits' && shot.mathematicalRatio !== null ? (
          <DiffractionLimits ratio={shot.mathematicalRatio} width={Math.min(width, 760)} />
        ) : (
          <>
            <div className="diffraction-causality" data-paired={paired && showAperture}>
              {showAperture && (
                <div className="diffraction-aperture-panel">
                  <p>{t('同一狭缝，同一观察点')}</p>
                  <DiffractionAperture
                    state={state}
                    width={panelWidth}
                    compact={compact}
                    time={time}
                    activePair={demo.watch ? shot.activePair : -1}
                  />
                  <span className="diffraction-scale-note">
                    {t('路径示意：孔径放大，屏距压缩。')}
                  </span>
                </div>
              )}
              {paired && (
                <div className="diffraction-sum-panel">
                  <p>
                    {t(
                      showDistance
                        ? '远场近似的条件'
                        : view === 'cancel'
                          ? '每一段，都有相反的搭档'
                          : '先把电场贡献相加',
                    )}
                  </p>
                  {showDistance ? (
                    <DiffractionDistance state={state} width={panelWidth} />
                  ) : (
                    <DiffractionPhasors
                      state={state}
                      width={panelWidth}
                      reveal={demo.watch ? shot.reveal : 1}
                      activePair={demo.watch ? shot.activePair : -1}
                      view={view}
                      compact={compact}
                    />
                  )}
                  <span className="diffraction-scale-note">
                    {t(
                      showDistance
                        ? 'N ≤ 0.1 是本演示的保守阈值。'
                        : '箭头表示分段积分，不是光子的路径。',
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="diffraction-screen-heading">
              <span>{t('展开接收屏')}</span>
              <span>
                {view === 'square' ? (
                  <>
                    <i className="diffraction-field-key" /> E/E₀{' '}
                    <i className="diffraction-intensity-key" /> I/I₀
                  </>
                ) : (
                  'I / I₀'
                )}
              </span>
            </div>
            {state.validity.usable ? (
              <DiffractionScreen
                state={state}
                profile={profile}
                width={width}
                field={view === 'square'}
              />
            ) : (
              <div className="diffraction-withheld">
                <strong>{t('此处不显示远场预测')}</strong>
                <p>
                  {t(
                    !state.validity.scalar
                      ? '狭缝已接近波长，需要电磁边界模型。'
                      : '屏幕太近，需要保留孔径上的二次相位。',
                  )}
                </p>
              </div>
            )}
            <div className="diffraction-observation">
              <div>
                <span>{t('当前观察点')}</span>
                <b>y = {state.sample.yMm.toFixed(2)} mm</b>
              </div>
              <div>
                <span>{t('相对中央峰')}</span>
                <b>
                  {state.validity.usable
                    ? `${(state.sample.intensity * 100).toFixed(2)}%`
                    : t('未预测')}
                </b>
              </div>
            </div>
            {(view === 'width' || view === 'wavelength') && first && (
              <div className="diffraction-minimum">
                <span>{t('第一暗纹到中心')}</span>
                <strong>{first.yMm.toFixed(2)} mm</strong>
                <span>sin θ₁ = λ / a</span>
              </div>
            )}
            <p className="diffraction-normalization">
              {t('每个图样按自己的中央峰归一化；不能据此比较总透光量。')}
            </p>
          </>
        )}
      </div>
      {!demo.watch && (
        <div className="diffraction-explore">
          <div className="diffraction-presets" role="group" aria-label={t('选择衍射观察点')}>
            <button onClick={() => setProbe(0)}>{t('中央峰')}</button>
            <button
              disabled={!first || first.yMm > state.spanMm || !state.validity.usable}
              title={first && first.yMm > state.spanMm ? t('观察点在当前屏幕范围外') : undefined}
              onClick={() => setProbe(first?.yMm ?? 0)}
            >
              {t('第一暗纹')}
            </button>
            <button
              disabled={sidePeak === null || sidePeak > state.spanMm || !state.validity.usable}
              title={
                sidePeak !== null && sidePeak > state.spanMm
                  ? t('观察点在当前屏幕范围外')
                  : undefined
              }
              onClick={() => setProbe(sidePeak ?? 0)}
            >
              {t('第一侧峰')}
            </button>
          </div>
          <Range
            label={t('狭缝宽度')}
            value={parameters.slitUm}
            min={20}
            max={160}
            step={1}
            unit="μm"
            onChange={(value) => set('slitUm', value)}
          />
          <Range
            label={t('真空波长（空气近似）')}
            value={parameters.wavelengthNm}
            min={450}
            max={650}
            step={1}
            unit="nm"
            onChange={(value) => set('wavelengthNm', value)}
          />
          <Range
            label={t('狭缝到屏幕')}
            value={parameters.distanceM}
            min={0.005}
            max={2}
            step={0.005}
            unit="m"
            onChange={(value) => set('distanceM', value)}
          />
          <label className="diffraction-probe">
            <span>
              {t('沿屏幕移动探针')}
              <output>{state.sample.yMm.toFixed(2)} mm</output>
            </span>
            <input
              type="range"
              min={-state.spanMm}
              max={state.spanMm}
              step={0.01}
              value={state.sample.yMm}
              aria-label={t('沿屏幕移动探针')}
              aria-valuetext={`${state.sample.yMm.toFixed(2)} mm`}
              onChange={(event) => setProbe(Number(event.target.value))}
            />
          </label>
          <button
            onClick={() => {
              setParameters({ ...DIFFRACTION_DEFAULT });
              setProbe(0);
            }}
          >
            {t('恢复远场设置')}
          </button>
        </div>
      )}
      <details className="diffraction-notes">
        <summary>{t('这幅图怎样计算？')}</summary>
        <p>
          {t(
            '均匀照亮的理想单缝给出 E/E₀ = sin β / β，I/I₀ = (sin β / β)²；β = πa sinθ / λ，中央用极限值 1。',
          )}
        </p>
        <p>
          {t(
            '波形与箭头表达经典标量电场，不是量子粒子模拟。各小段先对电场做积分，再取合成场的模平方。',
          )}
        </p>
        <p>
          {t(
            'N 使用完整缝宽：N = a²/(λL)。本演示在 N > 0.1 或 a < 20λ 时暂停屏幕预测；这两个数是保守教学护栏，不是突变的物理边界。',
          )}
        </p>
        <p>
          {t(
            '图中各轴使用不同示意尺度，波动已放慢。屏幕亮度做幂次映射来显露弱侧峰；光强曲线和百分比保持线性。最后一章只检验零点方程，不预测亚波长孔径的场。',
          )}
        </p>
      </details>
    </div>
  );
}
