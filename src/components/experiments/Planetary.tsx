import { useState } from 'react';
import { t } from '../../i18n';
import {
  planetaryDrive,
  planetaryShot,
  planetaryState,
  type PlanetaryMode,
} from '../../models/planetary';
import { TAU } from '../../models/mechanisms';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { constraintNames, gearNames } from '../lab/PlanetaryDiagram';
import PlanetaryStudio from '../three/PlanetaryStudio';
import '../../styles/planetary.css';
export default function Planetary() {
  const demo = useShowcase(),
    [manualMode, setMode] = useState<PlanetaryMode>('ring-fixed'),
    [manualAngle, setAngle] = useState(0);
  const shot = planetaryShot(demo.chapter, demo.chapterProgress),
    mode = demo.watch ? shot.mode : manualMode,
    angle = demo.watch ? shot.inputAngle : (manualAngle * Math.PI) / 180,
    assembly = demo.watch ? shot.assembly : 0;
  const state = planetaryState(angle, mode),
    drive = planetaryDrive(mode),
    inputTurns = state[drive.input] / TAU,
    outputTurns = state[drive.output] / TAU;
  return (
    <div
      className="planetary-study"
      data-mode={demo.watch ? 'watch' : 'explore'}
      data-chapter={demo.chapter}
      data-work={demo.watch && shot.showWork}
    >
      <div className="planetary-topline">
        <span>EPICYCLIC / 24 · 18 · 60</span>
        <span>{assembly > 0.001 ? t('沿轴向装配') : t(constraintNames[mode])}</span>
      </div>
      <div className="planetary-main">
        <PlanetaryStudio angle={angle} mode={mode} assembly={assembly} />
      </div>
      {demo.watch && shot.showWork && (
        <div className="planetary-work">
          <span>{t('理想输出转矩')}</span>
          <strong>{Math.abs(drive.outputTorque).toFixed(1)} ×</strong>
          <small>{t('同样的功，换一种速度')}</small>
        </div>
      )}
      <div className="planetary-key">
        <span>
          <i className="sun" />
          {t('太阳轮')} 24
        </span>
        <span>
          <i className="planet" />
          {t('行星轮')} 18 × 3
        </span>
        <span>
          <i className="ring" />
          {t('内齿圈')} 60
        </span>
        <span>
          <i className="carrier" />
          {t('行星架')}
        </span>
      </div>
      <div className="planetary-turns">
        <div>
          <span>
            {t('输入')} · {t(gearNames[drive.input])}
          </span>
          <strong>
            {inputTurns.toFixed(2)}
            <small> {t('圈')}</small>
          </strong>
        </div>
        <div className="planetary-ratio">
          <span aria-hidden="true">→</span>
          <strong>{drive.ratio.toFixed(1)} : 1</strong>
          <small>{t('输入 / 输出')}</small>
        </div>
        <div>
          <span>
            {t('输出')} · {t(gearNames[drive.output])}
          </span>
          <strong>
            {(Math.abs(outputTurns) < 0.005 ? 0 : outputTurns).toFixed(2)}
            <small> {t('圈')}</small>
          </strong>
        </div>
      </div>
      {!demo.watch && (
        <div className="planetary-explore">
          <Segments
            value={manualMode}
            label={t('固定哪一部分')}
            options={(Object.keys(constraintNames) as PlanetaryMode[]).map((value) => ({
              value,
              label: t(constraintNames[value]),
            }))}
            onChange={(value) => {
              setMode(value);
              setAngle(0);
            }}
          />
          <Range
            label={t('输入转角')}
            value={manualAngle}
            min={0}
            max={1260}
            step={1}
            unit="°"
            onChange={setAngle}
          />
          <button
            className="btn"
            onClick={() => {
              setAngle(0);
              setMode('ring-fixed');
            }}
          >
            {t('重置轮系')}
          </button>
        </div>
      )}
      {!demo.watch && <p className="planetary-note">{t('同模数 · 20° 渐开线 · 理想运动约束')}</p>}
    </div>
  );
}
