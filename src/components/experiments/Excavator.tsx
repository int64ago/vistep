import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import { EXCAVATOR_CYLINDERS, excavatorShot, excavatorHydraulics } from '../../models/excavator';
import ExcavatorStudio from '../three/ExcavatorStudio';
import ExcavatorCircuit from '../lab/ExcavatorCircuit';
import '../../styles/excavator.css';
export default function Excavator() {
  const film = useShowcase(),
    [boom, setBoom] = useState(43),
    [curl, setCurl] = useState(20),
    [load, setLoad] = useState(800),
    [flow, setFlow] = useState(40),
    [view, setView] = useState('machine');
  const chapterSeconds =
    (film.chapters[film.chapter + 1]?.at ?? film.duration) - (film.chapters[film.chapter]?.at ?? 0);
  const shot = excavatorShot(film.chapter, film.chapterProgress, chapterSeconds),
    b = film.watch ? shot.boom : (boom * Math.PI) / 180,
    c = film.watch ? shot.curl : (curl * Math.PI) / 180,
    stick = film.watch ? shot.stick : -1.55;
  const h = excavatorHydraulics(
    b,
    film.watch ? shot.payload : load,
    film.watch ? shot.flow : flow,
    100,
    stick,
    c,
  );
  const circuit = film.watch ? [1, 4, 5].includes(film.chapter) : view === 'circuit';
  return (
    <div className="excavator-study">
      <div className="excavator-heading">
        <span>HYDRAULICS / LINKAGE</span>
        <b>{t(circuit ? '从油流到直线运动' : '一台机器，三组关节')}</b>
      </div>
      <div className={`excavator-stage${circuit ? ' is-circuit' : ''}`}>
        {circuit ? (
          <ExcavatorCircuit
            piston={
              film.watch
                ? shot.piston
                : Math.max(
                    0,
                    Math.min(
                      1,
                      (h.strokeLength - EXCAVATOR_CYLINDERS[0].rod) /
                        EXCAVATOR_CYLINDERS[0].housing,
                    ),
                  )
            }
            valve={film.watch ? shot.valve : h.stalled ? 'relief' : 'extend'}
            flow={film.watch ? shot.flow : flow}
          />
        ) : (
          <ExcavatorStudio
            boom={b}
            stick={stick}
            curl={c}
            closeup={film.watch && film.chapter === 6}
          />
        )}
      </div>
      <div
        className="excavator-evidence"
        style={{ visibility: film.watch && film.chapter === 1 ? 'hidden' : undefined }}
        aria-hidden={film.watch && film.chapter === 1}
      >
        <div>
          <span>{t('所需压力')}</span>
          <strong>
            {(h.requiredPressure / 1e6).toFixed(1)} <small>MPa</small>
          </strong>
        </div>
        <div>
          <span>{t('理想举升伸出速度')}</span>
          <strong>
            {film.watch && shot.valve === 'hold' ? '0.0' : (h.velocity * 100).toFixed(1)}{' '}
            <small>cm/s</small>
          </strong>
        </div>
        {(!film.watch || [3, 4, 5].includes(film.chapter) || h.stalled) && (
          <div className="excavator-state">
            {film.watch && [3, 4, 5].includes(film.chapter) ? (
              <>
                <span>
                  {t(
                    film.chapter === 4
                      ? '总供油流量'
                      : film.chapter === 5
                        ? '教学限压'
                        : '铲斗等效载荷',
                  )}
                </span>
                <strong>
                  {film.chapter === 4
                    ? shot.flow.toFixed(0)
                    : film.chapter === 5
                      ? '24'
                      : shot.payload.toFixed(0)}{' '}
                  <small>{film.chapter === 4 ? 'L/min' : film.chapter === 5 ? 'MPa' : 'kg'}</small>
                </strong>
              </>
            ) : (
              t(h.stalled ? '超过 24 MPa，停止举升' : '力矩由油缸与支点共同决定')
            )}
          </div>
        )}
      </div>
      {!film.watch && (
        <div className="excavator-controls">
          <Segments
            value={view}
            onChange={setView}
            label={t('观察挖掘机')}
            options={[
              { value: 'machine', label: t('机构') },
              { value: 'circuit', label: t('油路') },
            ]}
          />
          <Range label={t('动臂角度')} value={boom} onChange={setBoom} min={35} max={60} unit="°" />
          <Range
            label={t('铲斗收拢角度')}
            value={curl}
            onChange={setCurl}
            min={3}
            max={34}
            unit="°"
          />
          <Range
            label={t('铲斗等效载荷')}
            value={load}
            onChange={setLoad}
            min={0}
            max={9000}
            step={100}
            unit="kg"
          />
          <Range
            label={t('总供油流量')}
            value={flow}
            onChange={setFlow}
            min={0}
            max={80}
            unit="L/min"
          />
        </div>
      )}
      {!film.watch && (
        <details className="excavator-limit">
          <summary>{t('模型边界')}</summary>
          <p>
            {t(
              '姿态用于准静态比较；剖面演示双缸均分总流量。理想举升忽略回油背压、摩擦和惯性；24 MPa 是教学限压，不是整机起重能力。',
            )}
          </p>
        </details>
      )}
    </div>
  );
}
