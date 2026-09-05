import { useState } from 'react';
import { t } from '../../i18n';
import {
  acceptance,
  criticalAngle,
  dielectric,
  FIBER,
  fiberShot,
  traceFiber,
} from '../../models/fiber';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { FiberDrawing, InterfaceDrawing, PulseDrawing } from '../lab/FiberDrawing';
import '../../styles/fiber.css';
export default function Fiber() {
  const demo = useShowcase(),
    [medium, setMedium] = useState<'fiber' | 'interface' | 'pulse'>('fiber'),
    [angle, setAngle] = useState(9),
    [cladding, setCladding] = useState(FIBER.cladding),
    [incidence, setIncidence] = useState(35);
  const shot = fiberShot(demo.chapter, demo.chapterProgress),
    view = demo.watch ? shot.medium : medium,
    currentAngle = demo.watch ? shot.angle : angle,
    currentClad = demo.watch ? shot.cladding : cladding,
    currentIncidence = demo.watch ? shot.interfaceAngle : incidence;
  const boundary = dielectric(1.5, 1, (currentIncidence * Math.PI) / 180),
    ray = traceFiber(currentAngle, currentClad),
    cone = acceptance(FIBER.core, currentClad);
  return (
    <div className="fiber-study">
      <div className="fiber-heading">
        <span>LIGHT / GUIDED</span>
        <span>
          {t(view === 'interface' ? '放大边界' : view === 'pulse' ? '路径与时间' : '阶跃型光纤')}
        </span>
      </div>
      {view === 'fiber' && (
        <>
          <div className="fiber-materials">
            <span>
              <i />
              {t('纤芯')} <b>1.480</b>
            </span>
            <span>
              <i />
              {t('包层')} <b>{currentClad.toFixed(3)}</b>
            </span>
          </div>
          <FiberDrawing
            angle={currentAngle}
            cladding={currentClad}
            time={demo.watch ? (demo.chapter === 7 ? shot.packetTime : demo.time) : 0}
            reveal={demo.watch ? shot.layerReveal : 1}
            digital={demo.watch && demo.chapter === 7}
          />
          <div className="fiber-result">
            <strong>{t(ray.tir ? '光留在纤芯内' : '一部分光进入包层')}</strong>
            <span>
              {t('接收半角')} ≤ {((cone.angle * 180) / Math.PI).toFixed(1)}°<br />
              {t('当前入射方向')} {currentAngle.toFixed(1)}°
            </span>
          </div>
        </>
      )}
      {view === 'interface' && (
        <>
          <InterfaceDrawing degrees={currentIncidence} time={demo.watch ? demo.time : 0} />
          <div className="fiber-result">
            <strong>{t(boundary.tir ? '全反射' : '同时反射与折射')}</strong>
            <span>
              {t('临界角')} {((criticalAngle(1.5, 1)! * 180) / Math.PI).toFixed(1)}°<br />
              {t('反射光量')} {(boundary.reflectance * 100).toFixed(1)}%
            </span>
          </div>
        </>
      )}
      {view === 'pulse' && <PulseDrawing progress={demo.watch ? demo.chapterProgress : 1} />}
      {!demo.watch && (
        <div className="fiber-controls">
          <Segments
            value={medium}
            options={[
              { value: 'fiber', label: t('纤芯与包层') },
              { value: 'interface', label: t('单个边界') },
              { value: 'pulse', label: t('脉冲时间') },
            ]}
            label={t('光学实验')}
            onChange={setMedium}
          />
          {medium === 'fiber' && (
            <>
              <Range
                label={t('空气中的入射方向')}
                value={angle}
                min={0}
                max={35}
                step={0.1}
                unit="°"
                onChange={setAngle}
              />
              <Range
                label={t('包层折射率')}
                value={cladding}
                min={1.44}
                max={1.48}
                step={0.001}
                onChange={setCladding}
              />
            </>
          )}
          {medium === 'interface' && (
            <Range
              label={t('相对法线的入射角')}
              value={incidence}
              min={0}
              max={75}
              step={0.1}
              unit="°"
              onChange={setIncidence}
            />
          )}
          <button
            className="btn"
            onClick={() => {
              setAngle(9);
              setCladding(FIBER.cladding);
              setIncidence(35);
              setMedium('fiber');
            }}
          >
            {t('重置光路')}
          </button>
        </div>
      )}
    </div>
  );
}
