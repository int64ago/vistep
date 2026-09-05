import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import {
  INDUCTION_DEFAULT,
  INDUCTION_MATERIALS,
  inductionShot,
  inductionResponse,
  inductionInstant,
  inductionThermalProgram,
  inductionThermalAdvance,
  inductionThermalRate,
  type InductionView,
  type InductionMaterial,
  type InductionInput,
  type InductionShot,
} from '../../models/induction-cooktop';
import InductionCooktopStudio from '../three/InductionCooktopStudio';
import {
  InductionSkinPlot,
  InductionFluxReadout,
  InductionDutyPlot,
  InductionThermalView,
} from '../lab/InductionCooktopEvidence';
import '../../styles/induction-cooktop.css';
export default function InductionCooktop() {
  const film = useShowcase(),
    body = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(940),
    [manual, setManual] = useState({ ...INDUCTION_DEFAULT }),
    [phase, setPhase] = useState(0),
    [time, setTime] = useState(60),
    [view, setView] = useState<InductionView>('assembly'),
    [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!body.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, entry.contentRect.width)),
    );
    observer.observe(body.current);
    return () => observer.disconnect();
  }, []);
  let shot: InductionShot = inductionShot(film.chapter, film.chapterProgress);
  if (!film.watch) {
    const response = inductionResponse(manual),
      program = inductionThermalProgram(manual, time, response),
      cooling = view === 'cooling',
      thermal = cooling
        ? inductionThermalAdvance(manual, inductionThermalProgram(manual, 180, response), 0, time)
        : program,
      on = !cooling && program.on;
    shot = {
      view,
      input: manual,
      response,
      instant: inductionInstant(response, (phase * Math.PI) / 180, on),
      phase: (phase * Math.PI) / 180,
      time,
      on,
      thermal,
      heat: inductionThermalRate(manual, thermal, on ? response.panPower : 0),
    };
  }
  const compact = width < 680,
    thermal = shot.view === 'warming' || shot.view === 'cooling';
  const statements: Record<InductionView, string> = {
    assembly: '线圈接回电源，锅底形成自己的闭合电流。',
    flux: '变化的是磁通，感应电动势响应它的变化率。',
    skin: '频率升高，电流和电损耗更集中在入射表面。',
    spacing: '抬高同一口锅，耦合减弱，传入锅底的功率下降。',
    material: '材料改变电阻和集肤效应；非磁性不等于绝对不能感应加热。',
    duty: '开启时照常感应加热，停顿时电输入归零。',
    warming: '锅体先升温，玻璃通过接触传热逐渐变暖。',
    cooling: '电输入已经停止，余热仍会在锅和玻璃之间流动。',
  };
  const set = (key: keyof InductionInput, value: number | InductionMaterial) =>
    setManual((old) => ({ ...old, [key]: value }));
  const reset = () => {
    setManual({ ...INDUCTION_DEFAULT });
    setPhase(0);
    setTime(60);
    setView('assembly');
    setResetKey((k) => k + 1);
  };
  return (
    <section
      className="ic-study"
      data-compact={compact}
      data-watch={film.watch}
      data-ic-view={shot.view}
    >
      <div className="ic-heading">
        <span>{t('电磁炉 · 锅底就是热源')}</span>
        <span>{t('交流慢放 · 热过程加速')}</span>
      </div>
      <p className="ic-current">{t(statements[shot.view])}</p>
      <div className="ic-body" ref={body}>
        {!thermal && (
          <InductionCooktopStudio
            key={`${compact}-${resetKey}`}
            shot={shot}
            compact={compact}
            width={width}
          />
        )}
        {shot.view === 'flux' ? (
          <InductionFluxReadout shot={shot} width={width} />
        ) : shot.view === 'skin' ? (
          <InductionSkinPlot shot={shot} width={width} />
        ) : shot.view === 'duty' ? (
          <InductionDutyPlot shot={shot} width={width} />
        ) : thermal ? (
          <InductionThermalView shot={shot} width={width} />
        ) : null}
        {!thermal && shot.view !== 'flux' && (
          <div className="ic-readings">
            <span>
              {t('锅底电损耗')}
              <b>{(shot.on ? shot.response.panPower : 0).toFixed(1)} W</b>
            </span>
            <span>
              {shot.view === 'spacing'
                ? t('额外间距')
                : shot.view === 'material'
                  ? t('集肤深度')
                  : shot.view === 'duty'
                    ? t('时间平均')
                    : t('线圈损耗')}
              <b>
                {shot.view === 'spacing'
                  ? `${(shot.input.lift * 1000).toFixed(1)} mm`
                  : shot.view === 'material'
                    ? `${(shot.response.skin.depth * 1000).toFixed(3)} mm`
                    : `${(shot.view === 'duty' ? shot.response.averagePan : shot.on ? shot.response.coilPower : 0).toFixed(1)} W`}
              </b>
            </span>
          </div>
        )}
        {shot.view === 'material' && (
          <p className="ic-material-name">{t(INDUCTION_MATERIALS[shot.input.material].name)}</p>
        )}
        {thermal && (
          <div className="ic-thermal-input">
            <span>
              {shot.view === 'cooling' ? t('断电后') : t('加热时间')} {shot.time.toFixed(0)} s
            </span>
            <span>
              {t('锅底输入')} <b>{(shot.on ? shot.response.panPower : 0).toFixed(1)} W</b>
            </span>
          </div>
        )}
        <p className="ic-key">
          {t(
            thermal
              ? '温度是两个均匀热节点的结果。'
              : shot.view === 'skin'
                ? '曲线为归一化周期平均电损耗，颜色不是发光。'
                : '前半透明剖开观察；蓝色回路代表闭合涡流的等效模式。',
          )}
        </p>
      </div>
      {!film.watch && (
        <div className="ic-explore">
          <div className="ic-choices" role="group" aria-label={t('选择锅具材料')}>
            {(['steel', 'stainless', 'aluminum'] as const).map((material) => (
              <button
                key={material}
                aria-pressed={manual.material === material}
                onClick={() => set('material', material)}
              >
                {t(INDUCTION_MATERIALS[material].name)}
              </button>
            ))}
          </div>
          <div className="ic-choices" role="group" aria-label={t('选择电磁炉观察内容')}>
            {(
              [
                ['assembly', '结构与功率'],
                ['flux', '磁通与感应'],
                ['skin', '集肤效应'],
                ['duty', '通断包络'],
                ['warming', '升温'],
                ['cooling', '断电冷却'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>
                {t(label)}
              </button>
            ))}
          </div>
          <Range
            label={t('线圈有效值电流')}
            value={manual.current}
            min={0}
            max={50}
            step={1}
            unit="A"
            onChange={(v) => set('current', v)}
          />
          <Range
            label={t('交流频率')}
            value={manual.frequency / 1000}
            min={15}
            max={60}
            step={1}
            unit="kHz"
            onChange={(v) => set('frequency', v * 1000)}
          />
          <Range
            label={t('锅底额外抬升')}
            value={manual.lift * 1000}
            min={0}
            max={15}
            step={0.5}
            unit="mm"
            onChange={(v) => set('lift', v / 1000)}
          />
          <Range
            label={t('通电时间比例')}
            value={manual.duty * 100}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => set('duty', v / 100)}
          />
          <Range
            label={t('交流周期相位')}
            value={phase}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={setPhase}
          />
          <Range
            label={t('热过程时间')}
            value={time}
            min={0}
            max={240}
            step={1}
            unit="s"
            onChange={setTime}
          />
          <button className="ic-reset" onClick={reset}>
            {t('恢复电磁炉初始状态')}
          </button>
          <p className="ic-key">
            {t('参数变化会从同一室温初态重建；冷却从该设置加热 180 秒后的状态开始。')}
          </p>
        </div>
      )}
      <details className="ic-notes">
        <summary>{t('等效模型与真实锅具')}</summary>
        <div>
          <p>
            {t(
              '高频电源规定线圈的有效值电流；图中源内支路闭合回路。省略逆变器、谐振补偿、检测保护与硬件实现。所有数值是教学参数，不是烹饪设置。',
            )}
          </p>
          <p>
            {t(
              '把分布涡流缩减为一个短路等效环。互感由完整线圈与回流几何的空气中 Neumann 积分得到；磁性只在本模型的线性表面阻抗中体现，不求完整磁场集中。',
            )}
          </p>
          <p>
            {t(
              '集肤模型使用单侧受激有限厚导电平板的表面阻抗。恒定电导率和实数磁导率，计算电阻损耗；省略磁滞、饱和与材料参数随温度变化。',
            )}
          </p>
          <p>
            δ = 1 / √(πfμσ)
            <br />
            I₂ = −jωMI₁ / Z₂
            <br />P = R₁I₁² + R₂|I₂|²
          </p>
          <p>
            {t(
              '材料比较使用相同几何、频率和线圈电流，没有替设备调整匹配或检测策略。非磁性导体也能被感应加热；某口锅能否用于某台炉具仍取决于设计与制造商规格。',
            )}
          </p>
          <p>
            {t(
              '热模型把金属锅体和玻璃各视作一个均匀温度节点，没有食物、沸腾或空间温度场。锅底电损耗进入锅体；线圈损耗在该热域之外。锅与玻璃互相传热，二者都向室温环境散热。',
            )}
          </p>
          <p>
            {t(
              '通断采用四秒教学包络，段内使用周期平均电功率，忽略极短开关瞬态。载波与热过程分别慢放和加速，但都由共享章节进度直接重建。',
            )}
          </p>
        </div>
      </details>
    </section>
  );
}
