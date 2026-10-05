import { useId, useState } from 'react';
import { t } from '../../i18n';
import { cameraPose, cameraShot, type CameraMode } from '../../models/slr-mirrorless';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import SlrMirrorlessStudio from '../three/SlrMirrorlessStudio';
import '../../styles/slr-mirrorless.css';
const cameraNames = {
  dslr: '单反 · 光学取景',
  'live-view': '单反 · 实时取景',
  mirrorless: '无反 · 电子取景',
};
function Viewfinder({
  optical,
  live,
  brightness,
}: {
  optical: boolean;
  live: boolean;
  brightness: number;
}) {
  return (
    <div className="slr-finder" aria-label={t('当前取景图像')} data-blackout={!optical && !live}>
      <svg
        viewBox="0 0 144 84"
        aria-hidden="true"
        style={{
          opacity: optical || live ? 1 : 0,
          filter: `brightness(${optical ? 1 : brightness})`,
        }}
      >
        <rect width="144" height="84" fill="#aec6c0" />
        <path d="M0 68L43 31 72 61 107 23 144 68V84H0Z" fill="#607e73" />
        <circle cx="36" cy="22" r="8" fill="#eee2bd" />
        <path d="M66 32h12v20H66Z" fill="none" stroke="#e0e7cf" />
        <path d="M60 37v-8h8M76 29h8v8M84 47v8h-8M68 55h-8v-8" fill="none" stroke="#edf1dc" />
      </svg>
      {!optical && !live && <span>{t('取景中断')}</span>}
      {live && <span className="slr-finder-live">LIVE</span>}
    </div>
  );
}
export default function SlrMirrorless() {
  const film = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [mode, setMode] = useState<CameraMode>('dslr'),
    [phase, setPhase] = useState(0),
    [compensation, setCompensation] = useState(0);
  const shot = cameraShot(film.chapter, film.chapterProgress);
  const manual = cameraPose(mode, phase, compensation);
  const dslr = film.watch
    ? shot.dslr
    : mode === 'mirrorless'
      ? cameraPose('dslr', 0, compensation)
      : manual;
  const mirrorless = film.watch
    ? shot.mirrorless
    : mode === 'mirrorless'
      ? manual
      : cameraPose('mirrorless', 0, compensation);
  const active = film.watch
    ? compact
      ? shot.phone
      : shot.active
    : mode === 'mirrorless'
      ? 'mirrorless'
      : 'dslr';
  const current = active === 'mirrorless' ? mirrorless : dslr;
  const both = active === 'both';
  const status = (pose: typeof current) =>
    pose.optical
      ? '光学图像直达眼睛'
      : pose.live
        ? pose.mode === 'live-view'
          ? '传感器 → 处理器 → 后屏'
          : '传感器 → 处理器 → 电子取景器'
        : pose.curtains.open > 0
          ? '快门开启，传感器积分'
          : '取景中断，快门遮光';
  return (
    <section className="slr-scene" data-active={active} data-watch={film.watch}>
      <div className="slr-camera-title">
        <span>{t(both ? '同一镜头，两条取景路径' : cameraNames[current.mode])}</span>
        <span className="slr-ray-key">
          <i />
          {t('光')}
          <i />
          {t('电信号')}
        </span>
      </div>
      <div className="slr-cutaway">
        <SlrMirrorlessStudio
          key={`${active}-${compact}-${film.run}`}
          dslr={dslr}
          mirrorless={mirrorless}
          active={active}
          trace={film.watch ? shot.trace : 1}
          compact={compact}
        />
      </div>
      <div className={'slr-viewing ' + (both ? 'is-pair' : '')}>
        {(both || active === 'dslr') && (
          <div className="slr-viewing-item">
            <div>
              <strong>{t(cameraNames[dslr.mode])}</strong>
              <span>{t(status(dslr))}</span>
            </div>
            <Viewfinder optical={dslr.optical} live={dslr.live} brightness={dslr.brightness} />
          </div>
        )}
        {(both || active === 'mirrorless') && (
          <div className="slr-viewing-item">
            <div>
              <strong>{t(cameraNames.mirrorless)}</strong>
              <span>{t(status(mirrorless))}</span>
            </div>
            <Viewfinder optical={false} live={mirrorless.live} brightness={mirrorless.brightness} />
          </div>
        )}
      </div>
      {film.watch && [2, 5].includes(shot.chapter) && (
        <div className="slr-exposure-strip">
          <span>{t('反光镜')}</span>
          <b>
            {t(
              current.mode === 'mirrorless'
                ? '没有反光镜'
                : current.mirror.angle < 0.01
                  ? '已抬起'
                  : Math.abs(current.mirror.angle - Math.PI / 4) < 0.001
                    ? '已落下'
                    : '正在移动',
            )}
          </b>
          <span>{t('快门开口')}</span>
          <b>{Math.round(current.curtains.open * 100)}%</b>
        </div>
      )}
      {!film.watch && (
        <div className="slr-exploration">
          <div className="slr-mode-control" role="group" aria-label={t('选择取景路径')}>
            {(['dslr', 'live-view', 'mirrorless'] as const).map((v) => (
              <button
                key={v}
                className="btn"
                aria-pressed={mode === v}
                onClick={() => {
                  setMode(v);
                  setPhase(0);
                }}
              >
                {t(cameraNames[v])}
              </button>
            ))}
          </div>
          <div className="slr-manual-range">
            <label htmlFor={id + 'phase'}>{t('慢放一次拍摄')}</label>
            <output htmlFor={id + 'phase'}>{Math.round(phase * 100)}%</output>
            <input
              id={id + 'phase'}
              type="range"
              min="0"
              max="1"
              step=".005"
              value={phase}
              disabled={mode === 'live-view'}
              onChange={(e) => setPhase(+e.target.value)}
            />
          </div>
          <div className="slr-manual-range">
            <label htmlFor={id + 'ev'}>{t('曝光预览补偿')}</label>
            <output htmlFor={id + 'ev'}>
              {compensation > 0 ? '+' : ''}
              {compensation.toFixed(1)} EV
            </output>
            <input
              id={id + 'ev'}
              type="range"
              min="-2"
              max="2"
              step=".1"
              value={compensation}
              onChange={(e) => setCompensation(+e.target.value)}
            />
          </div>
          <p>{t('补偿改变电子预览的亮度；光学取景光路不会读取这个数值。')}</p>
          <button
            className="btn"
            onClick={() => {
              setMode('dslr');
              setPhase(0);
              setCompensation(0);
            }}
          >
            {t('重置相机')}
          </button>
        </div>
      )}
      <details className="slr-model-details">
        <summary>{t('模型与播放节奏')}</summary>
        <p className="slr-model-note">{t('代表性纵切面 · 两帘机械快门慢放 · 光点不是实际光速')}</p>
      </details>
    </section>
  );
}
