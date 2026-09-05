import { useState } from 'react';
import { t } from '../../i18n';
import { LUNAR, SYNODIC_DAYS, lunarState, moonShot, phaseDiskPath } from '../../models/moon';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import LunarPortrait from '../three/LunarPortrait';
import LunarGeometry from '../lab/LunarGeometry';
import '../../styles/moon.css';
const names = ['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
const initialDay = Math.round((SYNODIC_DAYS / 4) * 100) / 100;
export default function MoonPhases() {
  const demo = useShowcase(),
    [day, setDay] = useState(initialDay),
    [tilt, setTilt] = useState(LUNAR.inclination);
  const shot = moonShot(demo.chapter, demo.chapterProgress),
    s = demo.watch ? shot.state : lunarState(day, tilt);
  const view = demo.watch ? shot.view : 'orbit',
    geometry = view !== 'portrait';
  return (
    <div className="lunar-study" data-view={view}>
      <div className="lunar-topline">
        <span>THE MOON / A CHANGE OF VIEW</span>
        <span>{t('圆轨道教学模型')}</span>
      </div>
      <div className="lunar-body">
        <LunarPortrait state={s} marker={view === 'spin'} />
        {geometry && <LunarGeometry state={s} view={view} />}
      </div>
      <div className="lunar-observation">
        <span>
          <small>{t('几何日照比例')}</small>
          <b>
            {(s.illuminated * 100).toFixed(1)}
            <i>%</i>
          </b>
        </span>
        <div className="lunar-progress">
          <div>
            <i style={{ width: `${s.illuminated * 100}%` }} />
          </div>
          <p>
            {t(
              view === 'shadow'
                ? '日照比例未扣除地球遮挡。'
                : view === 'spin'
                  ? '金色标记始终指向地球。'
                  : s.umbraFraction > 0
                    ? '正在经过地球本影。'
                    : '当前未进入地球本影。',
            )}
          </p>
        </div>
        <span>
          <small>{t('模型经过天数')}</small>
          <b>
            {s.days.toFixed(1)}
            <i>d</i>
          </b>
        </span>
      </div>
      {view === 'portrait' && (
        <div className="lunar-phase-strip" aria-label={t('一轮月相的八个观察点')}>
          {names.map((name, i) => (
            <div key={name} data-near={s.phaseIndex === i}>
              <svg viewBox="-1.18 -1.18 2.36 2.36" aria-hidden="true">
                <circle r="1" fill="#10192b" stroke="#57667b" strokeWidth=".03" />
                <path
                  d={phaseDiskPath(-Math.cos((i * Math.PI) / 4))}
                  transform={i > 4 ? 'rotate(180)' : ''}
                  fill="#dbd8cb"
                />
              </svg>
              <span>{t(name)}</span>
            </div>
          ))}
        </div>
      )}
      {!demo.watch && (
        <div className="lunar-controls">
          <Range
            label={t('月相进度')}
            value={day}
            min={0}
            max={Math.round(SYNODIC_DAYS * 100) / 100}
            step={0.01}
            unit="d"
            onChange={setDay}
          />
          <Range
            label={t('轨道倾角')}
            value={tilt}
            min={0}
            max={10}
            step={0.005}
            unit="°"
            onChange={setTilt}
          />
          <button
            className="btn"
            onClick={() => {
              setDay(initialDay);
              setTilt(LUNAR.inclination);
            }}
          >
            {t('回到上弦附近')}
          </button>
        </div>
      )}
      <a
        className="lunar-credit"
        href="https://svs.gsfc.nasa.gov/4720/"
        target="_blank"
        rel="noreferrer"
      >
        {t('月面纹理')} NASA SVS · LROC / LOLA
      </a>
    </div>
  );
}
