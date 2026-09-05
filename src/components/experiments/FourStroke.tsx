import { useState } from 'react';
import { t } from '../../i18n';
import { ENGINE, engineCycle, engineShot } from '../../models/four-stroke';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import { useCompact } from '../lab/useCompact';
import { PressureVolume, strokeColors, strokeNames } from '../lab/EngineDiagram';
import EngineStudio from '../three/EngineStudio';
import '../../styles/engine.css';
export default function FourStroke() {
  const demo = useShowcase(),
    [manualAngle, setManualAngle] = useState(0),
    [epoch, setEpoch] = useState(0),
    compact = useCompact();
  const shot = engineShot(demo.chapter, demo.chapterProgress),
    angle = demo.watch ? shot.angle : (manualAngle * Math.PI) / 180,
    state = engineCycle(angle),
    showPV = demo.watch ? shot.pressureView : true;
  return (
    <div
      className="engine-study"
      data-watch={demo.watch}
      data-chapter={demo.chapter}
      data-stage={state.stage}
      data-chart={showPV}
    >
      <div className="engine-titleline">
        <span>INSIDE / FOUR STROKES</span>
        <span>
          {demo.watch && [1, 2, 3, 5].includes(demo.chapter)
            ? t('气门与燃烧室')
            : t('一个循环，两圈曲轴')}
        </span>
      </div>
      <div className="engine-scene" data-chart={showPV}>
        {!(compact && demo.watch && showPV) && (
          <EngineStudio key={epoch} angle={angle} leverage={demo.watch && shot.leverageView} />
        )}
        <div className="engine-inset" data-chart={showPV}>
          {showPV ? (
            <>
              <PressureVolume angle={angle} />
              <p>
                {t('理想循环净功')}
                <strong>
                  {state.netWork.toFixed(0)}
                  <small> J</small>
                </strong>
              </p>
            </>
          ) : (
            <>
              <svg className="engine-dial" viewBox="0 0 160 160" aria-hidden="true">
                {strokeColors.map((color, i) => {
                  const start = (i * Math.PI) / 2 - Math.PI / 2,
                    end = start + Math.PI / 2 - 0.04;
                  return (
                    <path
                      key={i}
                      d={`M${80 + 58 * Math.cos(start)} ${80 + 58 * Math.sin(start)}A58 58 0 0 1 ${80 + 58 * Math.cos(end)} ${80 + 58 * Math.sin(end)}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={i === state.stage ? 6 : 2}
                      opacity={i === state.stage ? 1 : 0.35}
                    />
                  );
                })}
                <text x="80" y="79" textAnchor="middle">
                  {Math.round((state.cycle * 180) / Math.PI)}°
                </text>
                <text x="80" y="100" textAnchor="middle" className="engine-cycle-label">
                  / 720°
                </text>
              </svg>
              <p className="engine-phase" style={{ color: strokeColors[state.stage] }}>
                {t(strokeNames[state.stage])}
                <b>{Math.round((state.cycle * 180) / Math.PI)}° / 720°</b>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="engine-stroke-strip">
        {strokeNames.map((name, i) => (
          <span
            key={name}
            data-active={state.stage === i}
            style={{ '--stroke-color': strokeColors[i] } as React.CSSProperties}
          >
            <i />
            {t(name)}
          </span>
        ))}
      </div>
      <div className="engine-measures">
        <span>
          {t('气缸容积')}
          <strong>
            {(state.volume * 1e6).toFixed(0)}
            <small> cm³</small>
          </strong>
        </span>
        <span>
          {t('绝对压力')}
          <strong>
            {(state.pressure / 1e6).toFixed(2)}
            <small> MPa</small>
          </strong>
        </span>
        <span>
          {t('净气体转矩')}
          <strong>
            {Math.round(state.torque)}
            <small> N·m</small>
          </strong>
        </span>
      </div>
      {!demo.watch && (
        <div className="engine-explore">
          <Range
            label={t('曲轴角度')}
            value={manualAngle}
            min={0}
            max={720}
            step={1}
            unit="°"
            onChange={setManualAngle}
          />
          <button
            className="btn"
            onClick={() => {
              setManualAngle(0);
              setEpoch((v) => v + 1);
            }}
          >
            {t('回到进气起点')}
          </button>
        </div>
      )}
      <p className="engine-note">
        {t('单缸慢放 · 理想奥托循环 · 压缩比')} {ENGINE.compression}:1
      </p>
    </div>
  );
}
