import { useState } from 'react';
import { t } from '../../i18n';
import { cameraShot, lensRay, thinLens } from '../../models/optics';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import LensStudio from '../three/LensStudio';
import LensDiagram from '../lab/LensDiagram';
import '../../styles/optics.css';
export default function CameraLens() {
  const demo = useShowcase();
  const [object, setObject] = useState(200),
    [focal, setFocal] = useState(50),
    [sensor, setSensor] = useState(66.7);
  const state = demo.watch
    ? cameraShot(demo.chapter, demo.chapterProgress)
    : { object, focal, sensor, height: 18, aperture: 34 };
  const result = thinLens(state.focal, state.object);
  const blur = Math.abs(
    lensRay(state.focal, state.object, 18, 17).at(state.sensor) -
      lensRay(state.focal, state.object, 18, -17).at(state.sensor),
  );
  const diagramOnly = demo.watch
    ? [1, 3, 7].includes(demo.chapter)
    : !result.real || result.image === null || blur > 50;
  return (
    <div className="optical-bench">
      <div className="optics-eyebrow">
        <span>LIGHT / IMAGE</span>
        <span>{t('追踪同一个物点')}</span>
      </div>
      <div className="lens-views">
        <div className="lens-object" hidden={diagramOnly}>
          <LensStudio state={state} />
        </div>
        <div className="lens-plan" hidden={!diagramOnly}>
          <LensDiagram state={state} time={demo.time} />
        </div>
      </div>
      <div className="lens-observations">
        <span>
          {t('物距')}
          <strong>
            {state.object.toFixed(0)}
            <small> mm</small>
          </strong>
        </span>
        <span>
          {t('像距')}
          <strong>
            {result.image === null ? '∞' : result.image.toFixed(1)}
            <small> mm</small>
          </strong>
        </span>
        <span>
          {result.real ? t('屏上的弥散直径') : t('正立虚像')}
          <strong>
            {result.real ? blur.toFixed(1) : result.magnification?.toFixed(1)}
            <small>{result.real ? ' mm' : ' ×'}</small>
          </strong>
        </span>
      </div>
      {!demo.watch && !diagramOnly && <LensDiagram state={state} time={demo.time} />}
      {!demo.watch && (
        <div className="optics-explore">
          <Range
            label={t('物体到透镜')}
            value={object}
            min={25}
            max={220}
            unit="mm"
            onChange={setObject}
          />
          <Range label={t('焦距')} value={focal} min={30} max={75} unit="mm" onChange={setFocal} />
          <Range
            label={t('成像屏位置')}
            value={sensor}
            min={25}
            max={120}
            step={0.1}
            unit="mm"
            onChange={setSensor}
          />
          <button
            className="btn"
            onClick={() => {
              const v = thinLens(focal, object).image;
              if (v !== null && v > 0)
                setSensor(Math.round(Math.max(25, Math.min(120, v)) * 10) / 10);
            }}
            disabled={
              !result.real || result.image === null || result.image > 120 || result.image < 25
            }
          >
            {t('把屏移到像面')}
          </button>
        </div>
      )}
      <p className="optics-model-note">{t('理想薄透镜 · 近轴光学')}</p>
    </div>
  );
}
