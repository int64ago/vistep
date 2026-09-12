import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import {
  HELICOPTER_HOVER_PITCH,
  helicopterShot,
  helicopterSolve,
  type HelicopterView,
} from '../../models/helicopter';
import { helicopterElement, HELICOPTER } from '../../models/helicopter';
import HelicopterLocator from '../three/HelicopterLocator';
import HelicopterStudio from '../three/HelicopterStudio';
import { HelicopterTorque, HelicopterTrace } from '../lab/HelicopterInstruments';
import '../../styles/helicopter.css';
const views = [
  { value: 'aircraft', label: '整机' },
  { value: 'section', label: '剖面' },
  { value: 'cyclic', label: '桨距' },
  { value: 'vector', label: '受力' },
  { value: 'torque', label: '扭矩' },
] as const;
export default function Helicopter() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(640),
    [collective, setCollective] = useState(HELICOPTER_HOVER_PITCH),
    [cyclic, setCyclic] = useState(0),
    [tilt, setTilt] = useState(0),
    [tailBalance, setTailBalance] = useState(1),
    [manualView, setManualView] = useState<HelicopterView>('aircraft'),
    [azimuth, setAzimuth] = useState(30);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const shot = helicopterShot(film.chapter, film.chapterProgress, film.time),
    input = film.watch
      ? shot
      : { collectiveDeg: collective, cyclicDeg: cyclic, diskTiltDeg: tilt, tailBalance },
    state = useMemo(
      () => helicopterSolve(input),
      [input.collectiveDeg, input.cyclicDeg, input.diskTiltDeg, input.tailBalance],
    ),
    view = film.watch ? shot.view : manualView,
    phase = film.watch ? shot.phase : manualView === 'section' ? 0 : (azimuth * Math.PI) / 180,
    physical = true,
    instrumentWidth = Math.min(width, view === 'torque' ? 650 : view === 'section' ? 600 : 480),
    caption =
      view === 'section'
        ? '固定转速；剖面升力由迎角计算。'
        : view === 'collective'
          ? '转速不变，比较瞬时受力。'
          : view === 'cyclic'
            ? '这是桨距波形；不模拟桨叶挥舞。'
            : view === 'vector' || view === 'balance'
              ? '旋翼盘受力示意；倾角为给定状态。'
              : view === 'torque'
                ? '比较绕主轴的力矩；未模拟偏航轨迹。'
                : '旋转已放慢；模型转速保持不变。';
  return (
    <section className="helicopter-study" data-view={view} data-watch={film.watch}>
      <header className="helicopter-heading">
        <span>ROTORCRAFT</span>
        <b>
          {t(
            physical
              ? '旋转的机翼'
              : view === 'cyclic' || view === 'collective'
                ? '跟着一片桨叶看'
                : '让力量可见',
          )}
        </b>
      </header>
      <div className="helicopter-main" ref={host}>
        {physical && (
          <div
            className={`helicopter-apparatus ${['torque', 'section', 'cyclic'].includes(view) ? 'helicopter-apparatus-short' : ''}`}
          >
            <HelicopterStudio
              visual={{
                phase,
                collectiveDeg: state.collectiveDeg,
                cyclicDeg: state.cyclicDeg,
                diskTiltDeg: state.diskTiltDeg,
                view,
                tailBalance: state.tailBalance,
                torque: view === 'torque',
                tailForce: state.tailForce,
                rotorTorque: state.rotorTorque,
                thrust: state.thrust,
                weight: state.weight,
              }}
            />
            {['section', 'cyclic', 'collective'].includes(view) && (
              <HelicopterLocator section={view === 'section'} />
            )}
            {view === 'section' && (
              <div className="helicopter-object-key">
                <i />
                {t('剖面升力')}
                <span>·</span>
                {t('相对气流')}
              </div>
            )}
            {view !== 'torque' &&
              view !== 'section' &&
              view !== 'cyclic' &&
              view !== 'collective' && (
                <div className="helicopter-object-key">
                  <i />T <span>·</span>
                  <i className="helicopter-weight-key" />
                  mg
                </div>
              )}
            {view === 'torque' && (
              <div className="helicopter-object-key">
                <i />
                {t('尾桨侧推力')}
              </div>
            )}
          </div>
        )}
        <div className="helicopter-instrument" style={{ maxWidth: instrumentWidth }}>
          {view === 'section' && (
            <div className="helicopter-inline-values">
              <span>
                {t('桨距 θ')} {state.collectiveDeg.toFixed(1)}°
              </span>
              <span>
                {t('迎角 α')}{' '}
                {(
                  (helicopterElement(state.collectiveDeg, state.induced, HELICOPTER.radius * 0.75)
                    .alpha *
                    180) /
                  Math.PI
                ).toFixed(1)}
                °
              </span>
            </div>
          )}
          {view === 'cyclic' && (
            <HelicopterTrace state={state} phase={phase} width={instrumentWidth} />
          )}
          {(view === 'vector' || view === 'balance') && (
            <div className="helicopter-pair">
              <span>
                {t('垂直推力')}
                <b>{(state.vertical / 1000).toFixed(2)} kN</b>
              </span>
              <span>
                {t('水平推力')}
                <b>{(state.horizontal / 1000).toFixed(2)} kN</b>
              </span>
            </div>
          )}
          {view === 'torque' && <HelicopterTorque state={state} width={instrumentWidth} />}
        </div>
        {(view === 'aircraft' || view === 'collective') && (
          <div className="helicopter-pair helicopter-main-readings">
            <span>
              {t('主旋翼推力')}
              <b>{(state.thrust / 1000).toFixed(2)} kN</b>
            </span>
            <span>
              {t('机身重量')}
              <b>{(state.weight / 1000).toFixed(2)} kN</b>
            </span>
          </div>
        )}
        {view === 'collective' && (
          <div className="helicopter-pitch-value">
            {t('主旋翼总距')} {state.collectiveDeg.toFixed(1)}°
          </div>
        )}
        {view === 'collective' && (
          <div className="helicopter-result">
            {t(
              Math.abs(state.verticalAcceleration) < 0.02
                ? '推力与重力平衡'
                : state.verticalAcceleration > 0
                  ? '获得向上的加速度'
                  : '获得向下的加速度',
            )}
          </div>
        )}
        {view === 'balance' && (
          <div className="helicopter-result">
            {t(
              Math.abs(state.verticalAcceleration) < 0.015
                ? '垂直重新平衡，水平分量仍在'
                : '推力倾斜后，垂直分量变少',
            )}
          </div>
        )}
      </div>
      <p className="helicopter-context">{t(caption)}</p>
      {!film.watch && (
        <div className="helicopter-controls">
          <Segments
            label={t('直升机观察方式')}
            value={manualView}
            onChange={setManualView}
            options={views.map((v) => ({ value: v.value, label: t(v.label) }))}
          />
          <Range
            label={t('主旋翼总距')}
            value={collective}
            min={4}
            max={13}
            step={0.1}
            unit="°"
            onChange={setCollective}
          />
          {(manualView === 'aircraft' || manualView === 'cyclic') && (
            <Range
              label={t('周期变距幅度')}
              value={cyclic}
              min={0}
              max={3}
              step={0.1}
              unit="°"
              onChange={setCyclic}
            />
          )}
          {(manualView === 'aircraft' || manualView === 'cyclic' || manualView === 'torque') && (
            <Range
              label={t('慢动作方位角')}
              value={azimuth}
              min={0}
              max={360}
              step={1}
              unit="°"
              onChange={setAzimuth}
            />
          )}
          {manualView === 'vector' && (
            <Range
              label={t('旋翼盘倾角')}
              value={tilt}
              min={0}
              max={25}
              step={1}
              unit="°"
              onChange={setTilt}
            />
          )}
          {manualView === 'torque' && (
            <Range
              label={t('尾桨补偿比例')}
              value={tailBalance}
              min={0}
              max={1.4}
              step={0.05}
              onChange={setTailBalance}
            />
          )}
          <div className="helicopter-pair">
            <span>
              {t('旋翼盘诱导速度')}
              <b>{state.induced.toFixed(2)} m/s</b>
            </span>
            <span>
              {t('理想诱导功率')}
              <b>{(state.inducedPower / 1000).toFixed(1)} kW</b>
            </span>
          </div>
          <button
            className="helicopter-reset"
            onClick={() => {
              setCollective(HELICOPTER_HOVER_PITCH);
              setCyclic(0);
              setTilt(0);
              setTailBalance(1);
              setAzimuth(30);
              setManualView('aircraft');
            }}
          >
            {t('恢复直升机初始状态')}
          </button>
          <details>
            <summary>{t('直升机模型的边界')}</summary>
            <p>
              {t(
                '近悬停教学模型：均匀入流、线性升力、固定转速。桨距与倾盘受力分别展示；不解旋翼挥舞、失速、传动损耗、地面效应或完整飞行轨迹。尾桨仅比较偏航力矩；真实直升机还需平衡其侧向力。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
