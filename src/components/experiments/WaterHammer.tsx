import { useEffect, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  cachedWaterHammer,
  sampleWaterHammer,
  waterHammerShot,
  releaseWaterHammerRuns,
  type HammerShot,
} from '../../models/water-hammer';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import WaterHammerBench, {
  WaterHammerElastic,
  WaterHammerComparison,
  WaterHammerHistory,
} from '../lab/WaterHammerBench';
import '../../styles/water-hammer.css';

const observations = {
  closing: '阀口先减速，远处的水还不知道。',
  travel: '压力变化以波速传播，水并没有同时停下。',
  elastic: '水的压缩与管壁的扩张，共同储存弹性能。',
  reservoir: '恒压水库把压力扰动反号送回。',
  valve: '关闭的阀门保持零流速，压力波再次反射。',
  closure: '同一根管、同一初速，只改变关闭所用时间。',
  material: '同一初速下，较软管壁让波更慢、首个峰值更低。',
  limit: '相同关闭动作，较低初压留下更少压力余量。',
};
export default function WaterHammer({ initialWidth = 880 }: { initialWidth?: number } = {}) {
  const demo = useShowcase();
  useEffect(() => () => releaseWaterHammerRuns(), []);
  const [closure, setClosure] = useState(0.02),
    [young, setYoung] = useState(200),
    [speed, setSpeed] = useState(1),
    [pressure, setPressure] = useState(1.8),
    [time, setTime] = useState(0),
    [probe, setProbe] = useState(0.72);
  const manualRun = useMemo(
    () => cachedWaterHammer({ closure, young: young * 1e9, speed, pressure: pressure * 1e6 }),
    [closure, young, speed, pressure],
  );
  const manual = useMemo(() => sampleWaterHammer(manualRun, time, probe), [manualRun, time, probe]);
  const shot: HammerShot = demo.watch
    ? waterHammerShot(demo.chapter, demo.chapterProgress)
    : {
        state: manual,
        run: manualRun,
        reference: null,
        referenceRun: null,
        view: manual.failure ? 'limit' : 'pipe',
        chapter: 0,
        probe,
        annotation: 'travel',
      };
  const s = shot.state,
    p = s.parameters,
    pressureRise = shot.view === 'elastic' ? s.probePressure - p.pressure : s.valveRise,
    paired = !!shot.reference,
    reset = (fn: () => void) => {
      fn();
      setTime(0);
    };
  return (
    <section
      className="water-hammer-study"
      data-view={shot.view}
      data-chapter={shot.chapter}
      data-watch={demo.watch}
    >
      <div className="water-hammer-heading">
        <span>{t('水锤 / 停下也需要时间')}</span>
        <span>
          {t('物理时间')} <b>{s.time.toFixed(3)} s</b>
        </span>
      </div>
      <div className="water-hammer-reading">
        <div>
          <span>{t(shot.view === 'elastic' ? '测点压力增量' : '阀前压力增量')}</span>
          <strong>
            {pressureRise >= 0 ? '+' : '−'}
            {Math.abs(pressureRise / 1e6).toFixed(3)} <small>MPa</small>
          </strong>
        </div>
        <div>
          <span>{t('波速')}</span>
          <b>{p.waveSpeed.toFixed(0)} m/s</b>
          <span>
            {t('单程')} {p.transit.toFixed(3)} s
          </span>
        </div>
      </div>
      {shot.view === 'elastic' ? (
        <WaterHammerElastic state={s} initialWidth={initialWidth} />
      ) : paired ? (
        <WaterHammerComparison shot={shot} initialWidth={initialWidth} />
      ) : (
        <WaterHammerBench shot={shot} initialWidth={initialWidth} />
      )}
      <p className="water-hammer-observation" role="status">
        {t(s.failure ? '绝对压力触及蒸气压，单相计算到此停止。' : observations[shot.annotation])}
      </p>
      {s.failure && (
        <div className="water-hammer-failure">
          <span>
            {t('最低绝对压力')} <b>{(s.minPressure / 1000).toFixed(3)} kPa</b>
          </span>
          <span>
            {t('模型停在')} x = {s.failure.x.toFixed(1)} m · t = {s.failure.time.toFixed(3)} s
          </span>
          <p>{t('没有继续模拟汽腔，也没有预测液柱重新撞合后的峰值。')}</p>
        </div>
      )}
      {shot.view !== 'elastic' && (
        <WaterHammerHistory
          initialWidth={initialWidth}
          run={shot.run}
          referenceRun={shot.referenceRun}
          time={s.time}
          span={
            !demo.watch
              ? 1.6
              : shot.view === 'closure'
                ? 1.2
                : shot.view === 'material'
                  ? shot.run.parameters.transit * 1.35
                  : shot.view === 'limit'
                    ? p.transit * 3.2
                    : p.transit * 4.5
          }
        />
      )}
      {paired && (
        <div className="water-hammer-pair-key">
          <span>{t(shot.view === 'closure' ? '灰线：快速关闭' : '灰线：较硬管壁')}</span>
          <span>{t(shot.view === 'closure' ? '金线：缓慢关闭' : '金线：较软管壁')}</span>
        </div>
      )}
      <div className="water-hammer-clock">
        <span>
          {t('一次往返')} <b>2L/a = {p.roundTrip.toFixed(3)} s</b>
        </span>
        <span>
          {t('关闭用时')} <b>T꜀ = {p.closure.toFixed(2)} s</b>
        </span>
      </div>
      {!demo.watch && (
        <div className="water-hammer-explore">
          <p>{t('改变管道或关闭条件会重开同一初态的实验；时间滑块可前后重建整条压力波。')}</p>
          <div className="water-hammer-controls">
            <Range
              label={t('阀门关闭用时')}
              value={closure}
              min={0}
              max={1.2}
              step={0.01}
              unit="s"
              onChange={(v) => reset(() => setClosure(v))}
            />
            <Range
              label={t('管壁弹性模量')}
              value={young}
              min={20}
              max={200}
              step={5}
              unit="GPa"
              onChange={(v) => reset(() => setYoung(v))}
            />
            <Range
              label={t('初始水流速度')}
              value={speed}
              min={0}
              max={1.5}
              step={0.05}
              unit="m/s"
              onChange={(v) => reset(() => setSpeed(v))}
            />
            <Range
              label={t('初始绝对压力')}
              value={pressure}
              min={0.3}
              max={2.4}
              step={0.05}
              unit="MPa"
              onChange={(v) => reset(() => setPressure(v))}
            />
            <Range
              label={t('沿管测点位置')}
              value={probe}
              min={0}
              max={1}
              step={0.01}
              onChange={setProbe}
            />
            <Range
              label={t('压力波实验时间')}
              value={time}
              min={0}
              max={1.6}
              step={0.001}
              unit="s"
              onChange={setTime}
            />
          </div>
          <div className="water-hammer-probe">
            <span>
              {t('测点绝对压力')} {(s.probePressure / 1e6).toFixed(3)} MPa
            </span>
            <span>
              {t('测点流速')} {s.probeVelocity.toFixed(3)} m/s
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setClosure(0.02);
              setYoung(200);
              setSpeed(1);
              setPressure(1.8);
              setTime(0);
              setProbe(0.72);
            }}
          >
            {t('重置水锤实验')}
          </button>
        </div>
      )}
      <details className="water-hammer-method">
        <summary>{t('方程、阀门与适用边界')}</summary>
        <p>
          {t(
            '这是水平、充满水的单根弹性管；固定上游压力，末端为指定开度规律的孔口阀。不是通用管网或阀门设计软件。',
          )}
        </p>
        <p className="water-hammer-equation">
          ∂p′/∂t + ρa² ∂u/∂x = 0<br />
          ∂u/∂t + (1/ρ) ∂p′/∂x = 0<br />
          a⁻² = ρ(1/K + D/Ee)
        </p>
        <p>
          {t(
            '作者设定：管长 120 m，内径 80 mm，壁厚 4 mm；水体积模量 2.2 GPa，密度 998.2 kg/m³，支承系数取 1。',
          )}
        </p>
        <p>
          {t(
            '忽略管摩阻、对流项、支架运动、黏弹性和气体；特征线网格满足 aΔt/Δx = 1。阀门流量同时取决于有效开度和压差。',
          )}
        </p>
        <p>{t('主图管壁位移放大 500 倍，局部形变放大 800 倍；压力颜色和流向箭头保留模型数值。')}</p>
        <p>
          {t(
            '无损模型中的振荡不会自行衰减。能量条只计线性模型的动能和增量弹性能，不代表完整装置的热量账本。',
          )}
        </p>
        <p>
          {t('蒸气压取 20 °C 时约 2.338 kPa。达到该边界即冻结最后有效状态，需两相模型才能继续。')}
        </p>
        <a
          href="https://www.hec.usace.army.mil/confluence/rasdocs/ras1dtechref/6.5/overview-of-optional-capabilities/pressurized-pipe-flow"
          target="_blank"
          rel="noreferrer"
        >
          USACE HEC · {t('弹性管中的压力波')}
        </a>
      </details>
    </section>
  );
}
