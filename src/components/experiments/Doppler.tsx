import { useState } from 'react';
import { t } from '../../i18n';
import {
  dopplerExperiment,
  dopplerFrame,
  dopplerShot,
  type DopplerFocus,
} from '../../models/doppler';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { DopplerArrivalRuler, DopplerField, dopplerVelocityLabel } from '../lab/DopplerField';
import '../../styles/doppler.css';

const explanations: Record<DopplerFocus, string> = {
  equal: '发射没有加快，到达也保持原来的节拍。',
  centers: '小圆点是发射位置；旧波圈不会跟着声源走。',
  front: '前方波峰更密，接收者等下一峰的时间更短。',
  rear: '后方波峰更疏，到达间隔拉长，频率降低。',
  receiver: '波长没有变；接收者迎着波峰走，到达更频繁。',
  together: '两者同速移动，前方波长缩短，到达间隔仍为一周期。',
  bearing: '金线回到发射点 P；正在到达的声音来自过去的位置。',
  limit: '越接近声速，前方越拥挤；本实验停在声速以下。',
};
const initial = { source: 0.55, observer: 0, offset: 1.5, time: 4 };

export default function Doppler() {
  const director = useShowcase();
  const compact = useCompact();
  const [manual, setManual] = useState(initial);
  const shot = dopplerShot(director.chapter, director.chapterProgress);
  const focus = director.watch ? shot.focus : 'bearing';
  const frame = director.watch
    ? shot.frame
    : dopplerFrame(dopplerExperiment(manual.source, manual.observer, manual.offset), manual.time);
  const speed = dopplerVelocityLabel(frame);
  return (
    <div className="doppler-scene" data-focus={focus}>
      <div className="doppler-frequency" aria-label={t('发射与接收节拍')}>
        <div>
          <span>
            <i className="doppler-source-dot" />
            {t('声源 S')}
          </span>
          <strong>
            1.00 <small>f₀</small>
          </strong>
        </div>
        <span className="doppler-frequency-link">→</span>
        <div>
          <span>
            <i className="doppler-observer-dot" />
            {t('接收者 O')}
          </span>
          <strong>
            {frame.averageRatio.toFixed(2)} <small>f₀</small>
          </strong>
        </div>
      </div>
      <div className="doppler-field-wrap">
        <span className="doppler-medium">{t('静止空气 · 慢放波峰')}</span>
        <DopplerField frame={frame} focus={focus} compact={compact} />
      </div>
      <div className="doppler-arrivals">
        <div className="doppler-ruler-label">
          <span>{t('发射 → 到达')}</span>
          <span>
            {t('间隔')} <b>{(frame.interval / frame.config.period).toFixed(2)} T₀</b>
          </span>
        </div>
        <DopplerArrivalRuler frame={frame} compact={compact} />
      </div>
      <p className="doppler-explanation">{t(explanations[focus])}</p>
      <div className="doppler-footnote">
        {['front', 'rear', 'limit', 'together'].includes(focus) ? (
          <span>
            {t(focus === 'rear' ? '后方波长' : '前方波长')}{' '}
            <b>
              {(focus === 'rear' ? frame.rearWavelength : frame.frontWavelength).toFixed(2)} cT₀
            </b>
          </span>
        ) : (
          <span>
            {t('声源速度')} <b>{speed.source} c</b>
          </span>
        )}
        <span>
          {t('接收者速度')} <b>{speed.observer} c</b>
        </span>
      </div>
      {!director.watch && (
        <div className="doppler-explore">
          <p>{t('改变速度或偏移，再拖动时间，看同一波峰在哪里相遇。')}</p>
          <div className="doppler-presets" role="group" aria-label={t('声波实验预设')}>
            <button type="button" onClick={() => setManual(initial)}>
              {t('重置实验')}
            </button>
            <button
              type="button"
              onClick={() => setManual({ ...initial, source: 0, observer: -0.4 })}
            >
              {t('迎着波峰走')}
            </button>
            <button
              type="button"
              onClick={() => setManual({ ...initial, source: 0.35, observer: 0.35 })}
            >
              {t('两者同速')}
            </button>
          </div>
          <Range
            label={t('声源速度（向右为正）')}
            min={-0.9}
            max={0.9}
            step={0.05}
            value={manual.source}
            unit="c"
            onChange={(source) => setManual((m) => ({ ...m, source }))}
          />
          <Range
            label={t('接收者速度（向右为正）')}
            min={-0.8}
            max={0.8}
            step={0.05}
            value={manual.observer}
            unit="c"
            onChange={(observer) => setManual((m) => ({ ...m, observer }))}
          />
          <Range
            label={t('横向距离')}
            min={0.6}
            max={3.5}
            step={0.1}
            value={manual.offset}
            unit="cT₀"
            onChange={(offset) => setManual((m) => ({ ...m, offset }))}
          />
          <Range
            label={t('传播时间')}
            min={0}
            max={12}
            step={0.05}
            value={manual.time}
            unit="T₀"
            onChange={(time) => setManual((m) => ({ ...m, time }))}
            help={t('方向键细调；Home 和 End 跳到范围两端。')}
          />
          <button
            type="button"
            className="doppler-step"
            onClick={() => setManual((m) => ({ ...m, time: Math.min(12, m.time + 0.25) }))}
          >
            {t('向前四分之一周期')}
          </button>
          <details>
            <summary>{t('时间、几何与适用范围')}</summary>
            <p>
              {t(
                '每圈代表一个波峰；时间单位为发射周期 T₀，距离单位为 cT₀。这里只画三维球面波的平面截面，不模拟声压、响度或空气粒子的位移。',
              )}
            </p>
            <p>
              {t(
                'S、O 的速度都相对静止空气。第 k 圈从 S(kT₀) 发出，半径为 c(t−kT₀)。到达时刻满足 |O(t)−S(kT₀)|=c(t−kT₀)。',
              )}
            </p>
            <p>
              {t(
                '读数是相邻两次到达的平均频率。离轴经过时，接连几段间隔会逐渐改变；金线对应此刻抵达的相位，指向较早的发射位置。',
              )}
            </p>
            <p>
              {t(
                '速度保持恒定，空气均匀且无风；忽略反射、吸收和色散。控制范围低于声速；恰好达到声速或超声速时，本模型拒绝计算，不延伸成激波或光的多普勒效应。',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
