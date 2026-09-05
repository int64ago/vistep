import { t } from '../../i18n';
import { useState } from 'react';
import { useShowcase } from '../lab/Showcase';
import BicycleStudio from '../three/BicycleStudio';
import { Metric, Range, Segments } from '../lab/Controls';
import { bicycleModel } from '../../models/bicycle';
export default function Bicycle() {
  const demo = useShowcase();
  const [manualFront, setFront] = useState(34),
    [manualRear, setRear] = useState(24),
    [manualCadence, setCadence] = useState(60),
    [manualSlope, setSlope] = useState(4),
    [manualPlaying, setPlaying] = useState(false);
  const front = demo.watch ? 34 : manualFront,
    rear = demo.watch ? (demo.time < 17 ? 24 : demo.time < 26 ? 12 : 32) : manualRear;
  const cadence = demo.watch ? 45 : manualCadence,
    slope = demo.watch ? 4 : manualSlope,
    playing = demo.watch ? demo.playing : manualPlaying;
  const cut = demo.watch
    ? Math.min(...[17, 26].map((t) => Math.min(1, Math.abs(demo.time - t) / 0.55)))
    : 1;
  const model = bicycleModel(front, rear, cadence, slope);
  return (
    <div>
      <div className="lab-toolbar">
        <h2>{t('同样的踏频，不同的齿轮。')}</h2>
        <div className="lab-actions">
          <button className="btn primary" onClick={() => setPlaying(!playing)}>
            {playing ? t('Ⅱ 停下踏板') : t('▷ 转动踏板')}
          </button>
          <button
            className="btn"
            onClick={() => {
              setFront(34);
              setRear(24);
              setCadence(60);
              setSlope(4);
              setPlaying(false);
            }}
          >
            {t('↻ 重置')}
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <div className="lab-scene">
          <span className="scene-label">{t('CHAIN DRIVE / 链传动')}</span>
          <div className="bike-canvas" style={{ opacity: cut }}>
            <BicycleStudio
              key={demo.watch ? `film-${demo.run}` : 'manual'}
              front={front}
              rear={rear}
              cadence={cadence}
              playing={playing}
              closeup={demo.watch && demo.time >= 9 && demo.time < 16}
            />
          </div>
          <p className="bike-scene-note">{t('同一踏频 · 金色链节追踪')}</p>
        </div>
        <div className="lab-controls">
          <div>
            <p className="lab-subtitle">{t('前链盘')}</p>
            <Segments
              label={t('前链盘齿数')}
              value={String(front)}
              options={[
                { value: '34', label: t('34 齿') },
                { value: '50', label: t('50 齿') },
              ]}
              onChange={(v) => setFront(Number(v))}
            />
          </div>
          <Range
            label={t('后飞轮齿数')}
            value={rear}
            min={11}
            max={34}
            unit={t('齿')}
            onChange={setRear}
          />
          <Range
            label={t('踏频')}
            value={cadence}
            min={20}
            max={100}
            unit="rpm"
            onChange={setCadence}
          />
          <Range
            label={t('道路坡度')}
            value={slope}
            min={0}
            max={12}
            unit="%"
            onChange={setSlope}
          />
          <div className="lab-callout">
            {t('试着增大后飞轮：同样的踏频下，速度下降，所需的平均踏板力也下降。')}
          </div>
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('前 / 后传动比')} value={model.ratio.toFixed(2)} />
        <Metric label={t('对应稳态速度')} value={model.speedKmh.toFixed(1)} unit="km/h" />
        <Metric label={t('所需等效踏板力')} value={model.pedalForce.toFixed(0)} unit="N" />
      </div>
      <div className="bike-mini">
        <span>{t('维持这个速度所需功率')}</span>
        <strong>{model.power.toFixed(0)} W</strong>
        <span>{t('质量 80 kg · 轮半径 0.34 m')}</span>
      </div>
      <p className="lab-caption">
        {t('模型计算')}
        <strong>{t('维持所选踏频所需的力')}</strong>
        {t(
          '，并不假设人能无限输出功率。包含坡度、滚阻与空气阻力；忽略换挡瞬间，采用 96% 传动效率。三维展示两轴链传动试验架，换挡前后分别展示已张紧的链条；不模拟拨链器。踏板力是等效切向平均值。',
        )}
      </p>
    </div>
  );
}
