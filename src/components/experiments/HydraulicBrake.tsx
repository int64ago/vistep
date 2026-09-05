import { useState } from 'react';
import { t } from '../../i18n';
import { brakeShot, brakeState } from '../../models/brake';
import { Range } from '../lab/Controls';
import { useCompact } from '../lab/useCompact';
import { useShowcase } from '../lab/Showcase';
import BrakeStudio from '../three/BrakeStudio';
import BrakeSection from '../lab/BrakeSection';
import '../../styles/brake.css';
export default function HydraulicBrake() {
  const demo = useShowcase(),
    [stroke, setStroke] = useState(0),
    [diameter, setDiameter] = useState(10),
    [air, setAir] = useState(0),
    [epoch, setEpoch] = useState(0),
    compact = useCompact();
  const auto = brakeShot(demo.chapter, demo.chapterProgress),
    shot = demo.watch
      ? auto
      : {
          ...auto,
          state: brakeState(stroke, { masterDiameter: diameter, bubbleVolume: air }),
          cutaway: 1,
          focus: air > 0 ? ('master' as const) : ('assembly' as const),
          rotation: 0,
          showEnergy: false,
          comparison: 'none' as const,
        },
    s = shot.state,
    phoneDetail = compact && demo.watch && [1, 2, 3, 4, 5].includes(demo.chapter),
    sectionVisible = !compact || !demo.watch || phoneDetail;
  return (
    <div
      className="brake-study"
      data-watch={demo.watch}
      data-chapter={demo.chapter}
      data-detail={phoneDetail}
    >
      <div className="brake-topline">
        <span>HYDRAULIC / TWO PISTONS</span>
        <span>
          {t(s.portOpen ? '油路通向储液腔' : s.contact ? '压力已经建立' : '消除刹车片间隙')}
        </span>
      </div>
      <div className="brake-apparatus">
        {!phoneDetail && <BrakeStudio key={epoch} shot={shot} />}
        <div className="brake-pressure">
          <span>{t('油路表压')}</span>
          <strong>
            {s.pressure.toFixed(2)}
            <small> MPa</small>
          </strong>
          <div>
            <i style={{ width: `${Math.min(100, (s.pressure / 8) * 100)}%` }} />
          </div>
          {shot.comparison === 'air' && (
            <p>
              {t('相同行程，无气泡')}
              <br />
              <b>{brakeState(s.stroke).pressure.toFixed(2)} MPa</b>
            </p>
          )}
        </div>
      </div>
      {shot.showEnergy ? (
        <div className="brake-energy">
          <div>
            <span>{t('速度')}</span>
            <strong>
              {(shot.stop.speed * 3.6).toFixed(1)} <small>km/h</small>
            </strong>
          </div>
          <div className="brake-energy-flow">
            <div>
              <i style={{ width: `${(shot.stop.kineticJoules / 1250) * 100}%` }} />
              <b style={{ width: `${(shot.stop.heatJoules / 1250) * 100}%` }} />
            </div>
            <p>
              <span>
                {t('动能')} {shot.stop.kineticJoules.toFixed(0)} J
              </span>
              <span>
                {t('制动转热')} {shot.stop.heatJoules.toFixed(0)} J
              </span>
            </p>
          </div>
          <small>
            {t('100 kg · 初速 18 km/h · 理想纯滚动')} · {shot.stop.seconds.toFixed(2)} s
          </small>
        </div>
      ) : (
        <div className="brake-evidence">
          <div className="brake-forces">
            <div>
              <span>{t('手力')}</span>
              <strong>
                {s.handForce.toFixed(0)} <small>N</small>
              </strong>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <span>{t('单侧刹车片力')}</span>
              <strong>
                {s.padForce.toFixed(0)} <small>N</small>
              </strong>
            </div>
            <div>
              <span>{t('主缸直径')}</span>
              <strong>
                {s.diameter.toFixed(1)} <small>mm</small>
              </strong>
            </div>
          </div>
          {sectionVisible && (
            <BrakeSection
              readouts={!(compact && demo.watch)}
              state={s}
              view={shot.focus === 'master' || shot.comparison === 'air' ? 'master' : 'caliper'}
            />
          )}
        </div>
      )}
      {!demo.watch && (
        <div className="brake-controls">
          <p className="brake-linkage-note">{t('推杆保持固定长度；手力采用理想 4:1 杠杆近似。')}</p>
          <Range
            label={t('主缸行程')}
            value={stroke}
            min={0}
            max={4}
            step={0.01}
            unit="mm"
            onChange={setStroke}
          />
          <Range
            label={t('主缸直径')}
            value={diameter}
            min={8}
            max={14}
            step={0.1}
            unit="mm"
            onChange={setDiameter}
          />
          <Range
            label={t('初始气泡体积')}
            value={air}
            min={0}
            max={100}
            step={1}
            unit="mm³"
            onChange={setAir}
          />
          <button
            className="btn"
            onClick={() => {
              setStroke(0);
              setDiameter(10);
              setAir(0);
              setEpoch((v) => v + 1);
            }}
          >
            {t('释放并重置刹车')}
          </button>
        </div>
      )}
    </div>
  );
}
