import { t } from '../../i18n';
import { useState } from 'react';
import { useShowcase } from '../lab/Showcase';
import HeatBalance from '../lab/HeatBalance';
import RefrigeratorStudio from '../three/RefrigeratorStudio';
import { Metric, Range } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import { refrigeratorShot } from '../../models/direction';
const parts = [
  {
    name: t('压缩机'),
    state: t('低压蒸气 → 高压高温蒸气'),
    text: t(
      '外界提供电能，压缩机对蒸气做功。压力上升，温度也上升，制冷剂才能把热交给较冷的室内空气。',
    ),
    color: '#d9775d',
  },
  {
    name: t('冷凝器'),
    state: t('高压蒸气 → 高压液体'),
    text: t('制冷剂在冰箱背后的管路中向房间放热，并逐渐冷凝成液体。所以冰箱背面会热。'),
    color: '#dc9f52',
  },
  {
    name: t('节流装置'),
    state: t('高压液体 → 低压液汽混合物'),
    text: t(
      '制冷剂经过狭窄通道，压力骤降，部分液体闪蒸。理想节流过程近似等焓，而不是“冷气被挤出来”。',
    ),
    color: '#698bc1',
  },
  {
    name: t('蒸发器'),
    state: t('低压液汽混合物 → 低压蒸气'),
    text: t('低压制冷剂在箱内管路中沸腾，从食物与空气吸热。随后蒸气回到压缩机，循环继续。'),
    color: '#3599b5',
  },
];
export default function Refrigerator() {
  const demo = useShowcase();
  const [part, setPart] = useState(0),
    [manualPhase, setPhase] = useState(0),
    [manualRunning, setRunning] = useState(false),
    [manualCop, setCop] = useState(2.5),
    [manualPower, setPower] = useState(80),
    [manualCutaway, setCutaway] = useState(true);
  const shot = demo.watch ? refrigeratorShot(demo) : null;
  const cop = shot?.cop ?? manualCop,
    power = shot?.power ?? manualPower;
  const phase = shot?.phase ?? manualPhase;
  const running = demo.watch ? demo.playing : manualRunning,
    cutaway = shot?.cutaway ?? manualCutaway;
  const host = useSimulation((dt) => setPhase((p) => (p + dt * 0.14) % 4), running && !demo.watch);
  const active = demo.watch || running ? Math.floor(phase) : part;
  const selected = parts[active];
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>{t('冷的那一面，连着热的那一面。')}</h2>
        <div className="lab-actions">
          <button
            className="btn primary"
            onClick={() => {
              if (running) setPart(Math.floor(phase));
              setRunning(!running && !demo.watch);
            }}
          >
            {running ? t('Ⅱ 停住观察') : t('▷ 跟随制冷剂')}
          </button>
          <button
            className="btn"
            onClick={() => {
              setRunning(false);
              setPhase(0);
              setPart(0);
              setCop(2.5);
              setPower(80);
              setCutaway(true);
            }}
          >
            {t('↻ 重置')}
          </button>
        </div>
      </div>
      <div className="component-picks" role="group" aria-label={t('循环部件')}>
        {parts.map((p, i) => (
          <button
            className={`btn small ${active === i ? 'active' : ''}`}
            key={p.name}
            onClick={() => {
              setPart(i);
              setPhase(i);
              setRunning(false);
            }}
          >
            {String(i + 1).padStart(2, '0')} {p.name}
          </button>
        ))}
      </div>
      <div className="lab-grid">
        <div className="lab-scene">
          {demo.watch && demo.chapter >= 7 && demo.chapter <= 9 ? (
            <HeatBalance
              power={power}
              cop={cop}
              openDoor={demo.chapter === 9}
              progress={demo.chapterProgress}
            />
          ) : (
            <>
              <div className="refrigerator-object">
                <RefrigeratorStudio phase={phase} cutaway={cutaway} />
              </div>
              <span className="refrigerator-cold">{t('箱内 · 吸热')}</span>
              <span className="refrigerator-hot">{t('室内 · 放热')}</span>
              <div className="pressure-badge">{selected.state}</div>
            </>
          )}
        </div>
        <div className="lab-controls">
          <label className="checkline">
            <input
              type="checkbox"
              checked={cutaway}
              onChange={(e) => setCutaway(e.target.checked)}
            />
            {t('打开冰箱剖面')}
          </label>
          <div className="lab-callout">
            <strong>{selected.name}</strong>
            <p>{selected.text}</p>
          </div>
          <Range
            label={t('输入电功率')}
            value={power}
            min={30}
            max={150}
            unit="W"
            onChange={setPower}
          />
          <Range
            label={t('假设制冷系数 COP')}
            value={cop}
            min={1}
            max={4}
            step={0.1}
            onChange={setCop}
            help={t('每消耗 1 份电能，搬走几份热量。')}
          />
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('从箱内搬出的热流')} value={(power * cop).toFixed(0)} unit="W" />
        <Metric label={t('输入电功率')} value={power} unit="W" />
        <Metric label={t('向房间释放的热流')} value={(power * (cop + 1)).toFixed(0)} unit="W" />
      </div>
      <p className="lab-caption">
        <strong>{t('能量账本：')}</strong>
        {t(
          '向房间放出的热 = 从箱内吸走的热 + 输入电功。COP 是自行设定的教学参数，数值不预测某台冰箱的真实性能；流动动画不代表分子的实际速度。',
        )}
      </p>
    </div>
  );
}
