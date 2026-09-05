import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import {
  microscopeDefaults,
  microscopeField,
  microscopeShot,
  microscopeSystem,
  type MicroscopeFocus,
  type MicroscopeShot,
} from '../../models/microscope';
import {
  MicroscopeBench,
  MicroscopeSpecimen,
  MicroscopeProfile,
  MicroscopeFocusRail,
  MicroscopePupil,
} from '../lab/MicroscopeOptics';
import '../../styles/microscope.css';

const captions: Record<MicroscopeFocus, string> = {
  collect: '同一点发出的光，经过物镜后在真实中间像面重新相遇。',
  image: '标本点向一侧移动，中间像向相反方向移动，距离放大 19 倍。',
  ocular: '中间像位于目镜前焦面；改变目镜，改变的是出射角度。',
  focus: '移动载物台，把点像最集中的位置带回固定中间像面。',
  layers: '两个标本层相隔 20 µm；调焦让清晰的一层与模糊的一层交换。',
  aperture: '打开物镜孔径，点像收窄；同一对亮点之间出现低谷。',
  depth: '收小孔径，离焦容许范围扩大，但相邻亮点更难分开。',
  empty: '目镜把已有模糊一起放大；物镜没有分开的细节仍未分开。',
};
const initial = {
  coarse: 0,
  fine: 0,
  na: 0.2,
  ocular: 10,
  separation: 2.4,
  layers: false,
  marker: 40,
  view: 'specimen' as 'specimen' | 'optics',
};

export default function Microscope() {
  const director = useShowcase(),
    compact = useCompact();
  const [manual, setManual] = useState(initial);
  let shot: MicroscopeShot;
  if (director.watch) shot = microscopeShot(director.chapter, director.chapterProgress);
  else {
    const config = {
      ...microscopeDefaults,
      focus: manual.coarse + manual.fine,
      na: manual.na,
      ocular: manual.ocular,
      separation: manual.separation,
      layers: manual.layers,
    };
    shot = {
      config,
      system: microscopeSystem(config),
      marker: manual.marker / 1000,
      reveal: 1,
      progress: 1,
      focus: manual.view === 'optics' ? 'ocular' : manual.layers ? 'layers' : 'aperture',
    };
  }
  const optical = ['collect', 'image', 'ocular'].includes(shot.focus);
  const field = useMemo(
    () => (optical ? null : microscopeField(shot.config)),
    [
      optical,
      shot.config.focus,
      shot.config.na,
      shot.config.ocular,
      shot.config.separation,
      shot.config.layers,
    ],
  );
  const showRail = shot.focus === 'focus' || shot.focus === 'layers';
  const showProfile = shot.focus === 'aperture' || shot.focus === 'depth';
  return (
    <div className="microscope-scene" data-focus={shot.focus} data-watch={director.watch}>
      <div className="microscope-strip">
        <span>
          {t(compact ? (optical ? '近轴薄透镜' : '荧光点靶') : '有限共轭 · 薄透镜近轴模型')}
        </span>
        <span>
          {optical
            ? `${Math.abs(shot.system.planeMagnification).toFixed(1)} × ${shot.config.ocular.toFixed(1)}`
            : `${t('近轴 NA')} ${shot.system.na.toFixed(2)}`}
        </span>
      </div>
      <div className={`microscope-stage ${optical ? 'microscope-optical' : ''}`}>
        {optical ? (
          <MicroscopeBench shot={shot} compact={compact} />
        ) : (
          field && (
            <>
              <MicroscopeSpecimen field={field} compact={compact} />
              {(showRail || showProfile || !compact) && (
                <div className="microscope-instrument">
                  {!compact && (
                    <div className="microscope-aperture-readout">
                      <MicroscopePupil shot={shot} />
                      <div>
                        <span>{t('物镜孔径半径')}</span>
                        <strong>{shot.system.pupil.toFixed(2)} mm</strong>
                      </div>
                    </div>
                  )}
                  {showRail && <MicroscopeFocusRail shot={shot} compact={compact} />}
                  {showProfile && (
                    <MicroscopeProfile
                      shot={shot}
                      field={field}
                      compact={compact}
                      depth={shot.focus === 'depth'}
                    />
                  )}
                  {!compact && shot.focus === 'empty' && (
                    <div className="microscope-empty-readout">
                      <span>{t('物方 Rayleigh 间距')}</span>
                      <strong>{shot.system.rayleigh.toFixed(2)} µm</strong>
                      <p>{t('目镜变化，这个间距不变。')}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )
        )}
      </div>
      <div className="microscope-measure">
        {optical ? (
          <>
            <span>{t(shot.focus === 'ocular' ? '参考角放大率' : '物镜横向放大率')}</span>
            <strong>
              {shot.focus === 'ocular'
                ? Math.abs(shot.system.visualMagnification).toFixed(0)
                : shot.system.magnification.toFixed(1)}{' '}
              ×
            </strong>
          </>
        ) : showRail ? (
          <>
            <span>{t('载物台偏移')}</span>
            <strong>{shot.config.focus.toFixed(1)} µm</strong>
          </>
        ) : shot.focus === 'depth' ? (
          <>
            <span>{t('衍射景深尺度 λ/NA²')}</span>
            <strong>{shot.system.depthScale.toFixed(1)} µm</strong>
          </>
        ) : (
          <>
            <span>{t('物方 Rayleigh 间距')}</span>
            <strong>{shot.system.rayleigh.toFixed(2)} µm</strong>
          </>
        )}
      </div>
      <p className="microscope-caption">
        {t(
          director.watch
            ? captions[shot.focus]
            : '改变载物台、孔径或目镜，比较光路与点像各自怎样变化。',
        )}
      </p>
      {!optical && <p className="microscope-reference">{t('点像归一化')}</p>}
      {!director.watch && (
        <div className="microscope-explore">
          <div className="microscope-actions" role="group" aria-label={t('显微镜实验预设')}>
            <button type="button" onClick={() => setManual(initial)}>
              {t('重置实验')}
            </button>
            <button type="button" onClick={() => setManual({ ...initial, na: 0.24, layers: true })}>
              {t('观察两个深度')}
            </button>
            <button type="button" onClick={() => setManual({ ...initial, na: 0.08, ocular: 25 })}>
              {t('检查空放大')}
            </button>
          </div>
          <div className="microscope-actions" role="group" aria-label={t('显微镜显示方式')}>
            <button
              type="button"
              aria-pressed={manual.view === 'optics'}
              onClick={() => setManual((m) => ({ ...m, view: 'optics' }))}
            >
              {t('展开光路')}
            </button>
            <button
              type="button"
              aria-pressed={manual.view === 'specimen'}
              onClick={() => setManual((m) => ({ ...m, view: 'specimen' }))}
            >
              {t('观察点像')}
            </button>
          </div>
          <Range
            label={t('粗调焦偏移')}
            value={manual.coarse}
            min={-20}
            max={20}
            step={2}
            unit="µm"
            onChange={(coarse) => setManual((m) => ({ ...m, coarse }))}
          />
          <Range
            label={t('细调焦偏移')}
            value={manual.fine}
            min={-2}
            max={2}
            step={0.1}
            unit="µm"
            onChange={(fine) => setManual((m) => ({ ...m, fine }))}
            help={t('粗调与细调相加，改变的是同一个载物台位置。')}
          />
          <Range
            label={t('物镜近轴数值孔径')}
            value={manual.na}
            min={0.08}
            max={0.24}
            step={0.01}
            onChange={(na) => setManual((m) => ({ ...m, na }))}
          />
          <Range
            label={t('目镜参考放大倍数')}
            value={manual.ocular}
            min={10}
            max={25}
            step={1}
            unit="×"
            onChange={(ocular) => setManual((m) => ({ ...m, ocular }))}
          />
          {manual.view === 'specimen' ? (
            <>
              <Range
                label={t('荧光双点间距')}
                value={manual.separation}
                min={1}
                max={5}
                step={0.1}
                unit="µm"
                onChange={(separation) => setManual((m) => ({ ...m, separation }))}
              />
              <button
                type="button"
                aria-pressed={manual.layers}
                onClick={() => setManual((m) => ({ ...m, layers: !m.layers }))}
              >
                {t('加入相隔 20 µm 的第二层')}
              </button>
            </>
          ) : (
            <Range
              label={t('离轴示踪点高度')}
              value={manual.marker}
              min={-40}
              max={40}
              step={2}
              unit="µm"
              onChange={(marker) => setManual((m) => ({ ...m, marker }))}
            />
          )}
          <details>
            <summary>{t('光路、点像与适用范围')}</summary>
            <p>
              {t(
                '物镜焦距 8 mm，固定中间像面距物镜 160 mm；这里是光学主平面距离，不是商用镜筒的机械长度。目镜位置随焦距调整，使固定像面留在其前焦面。',
              )}
            </p>
            <p>
              {t(
                '镜片画作主平面符号，光线在该平面按薄透镜矩阵折转。轴向与横向使用不同显示比例；没有模拟真实镜组曲面、像差或眼睛调节。',
              )}
            </p>
            <p>
              {t(
                '采用空气中、低孔径的标量近轴模型：NA≈r/u，最高约 0.24。精确 NA 是 sin(arctan(r/u))；这一区间的差异小于 3%。不外推到高 NA 或油浸物镜。',
              )}
            </p>
            <p>
              {t(
                '荧光点彼此不相干，各点强度相加。点像由同一圆形孔径的 Fresnel 积分计算；亮度以清晰单点峰值为参考，不模拟通光量、噪声、荧光化学或部分相干照明。',
              )}
            </p>
            <p>
              {t(
                '0.61λ/NA 是双点的 Rayleigh 判据，λ/NA² 只是声明的景深尺度。实际可辨性还受对比度、探测器、像差与观察标准影响。标尺换算到标本空间，目镜放大时随之变化。',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
