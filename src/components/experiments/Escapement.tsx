import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { escapementInitial, escapementPose, escapementShot } from '../../models/escapement';
import EscapementStudio from '../three/EscapementStudio';
import { EscapementDiagram, EscapementEnergy, EscapementPeriod } from '../three/EscapementDiagram';
import '../../styles/escapement.css';
const titles = [
  '轮子想转，摆在把关',
  '锁住轮子，摆仍在走',
  '齿尖滑过冲量面',
  '出口瓦接住下一步',
  '一次往返，恰好一个齿距',
  '补回损失，摆幅才留得住',
  '摆变长，放行的节拍变慢',
  '重锤供能，钟摆定拍',
];
export default function Escapement() {
  const film = useShowcase(),
    id = useId(),
    [input, setInput] = useState(escapementInitial),
    [epoch, setEpoch] = useState(0),
    compact = useCompact();
  const shot = escapementShot(film.chapter, film.chapterProgress),
    pose = film.watch ? shot.pose : escapementPose(input.cycles, input.amplitude, input.length);
  const focus = film.watch
    ? shot.focus
    : input.view === 'contact'
      ? pose.side
        ? 'exit'
        : 'entry'
      : input.view === 'mechanism'
        ? 'overview'
        : input.view;
  const time = film.watch ? shot.time : input.time,
    length = film.watch ? (focus === 'period' ? shot.length : 1) : input.length;
  const state =
    pose.kind === 'drop'
      ? '短暂跌落：两边都未接触'
      : pose.kind === 'impulse'
        ? pose.side
          ? '出口瓦给予冲量'
          : '入口瓦给予冲量'
        : pose.side
          ? '出口瓦锁定'
          : '入口瓦锁定';
  const ranges = [
    ['cycles', '检查往返相位', 0, 4, 0.001, input.cycles.toFixed(3)],
    ['amplitude', '规定半摆幅', 3, 5, 0.1, input.amplitude.toFixed(1) + '°'],
    ['length', '有效摆长', 0.7, 1.2, 0.01, input.length.toFixed(2) + ' m'],
    ['time', '对照经过时间', 0, 26, 0.05, input.time.toFixed(1) + ' s'],
    ['drive', '每次补能倍率', 0, 1.5, 0.05, input.drive.toFixed(2) + '×'],
  ] as const;
  return (
    <section className="escapement-scene" data-focus={focus} data-watch={film.watch}>
      <header className="escapement-heading">
        <span>{t('格雷厄姆 · 静止式擒纵')}</span>
        <h2>{t(film.watch ? titles[shot.chapter] : '亲手检查锁定、冲量与节拍')}</h2>
      </header>
      {focus === 'energy' ? (
        <div className="escapement-instrument">
          <EscapementEnergy time={time} drive={film.watch ? 1 : input.drive} length={length} />
        </div>
      ) : focus === 'period' ? (
        <div className="escapement-instrument">
          <EscapementPeriod time={time} length={length} />
        </div>
      ) : (
        <div className="escapement-visual">
          {!(compact && ['entry', 'exit', 'lock'].includes(focus)) && (
            <div className="escapement-object">
              {(focus === 'entry' || focus === 'exit' || focus === 'lock') && (
                <span className="escapement-cut-label">{t('局部剖面')}</span>
              )}
              <EscapementStudio key={epoch} pose={pose} focus={focus} progress={shot.progress} />
            </div>
          )}
          {(focus === 'entry' || focus === 'exit' || focus === 'lock') && (
            <div className="escapement-contact">
              <EscapementDiagram pose={pose} focus={focus} />
            </div>
          )}
        </div>
      )}
      <div className="escapement-state">
        {focus === 'energy' ? (
          <>
            <span>{t('相同初始能量与阻尼')}</span>
            <b>{time.toFixed(1)} s</b>
          </>
        ) : focus === 'period' ? (
          <>
            <span>{t('相同时间，比较累计放行')}</span>
            <b>{time.toFixed(1)} s</b>
          </>
        ) : (
          <>
            <span>{t(state)}</span>
            <b>
              {focus === 'count'
                ? `${pose.countedSteps} ${t('次放行')}`
                : `${((pose.localWheel * 180) / Math.PI).toFixed(1)}°`}
            </b>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="escapement-controls">
          <p>{t('沿同一几何检查相位；能量与摆长对照使用相同起点、相同经过时间。')}</p>
          <div className="escapement-options" role="group" aria-label={t('选择擒纵观察方式')}>
            {(['mechanism', 'contact', 'energy', 'period'] as const).map((v, i) => (
              <button
                key={v}
                aria-pressed={input.view === v}
                onClick={() => setInput((p) => ({ ...p, view: v }))}
              >
                {t(['完整机构', '接触剖面', '能量对照', '摆长对照'][i])}
              </button>
            ))}
          </div>
          {ranges
            .filter(([key]) =>
              focus === 'energy'
                ? ['time', 'drive', 'length'].includes(key)
                : focus === 'period'
                  ? ['time', 'length'].includes(key)
                  : ['cycles', 'amplitude', 'length'].includes(key),
            )
            .map(([key, label, min, max, step, readout]) => (
              <div className="escapement-range" key={key}>
                <label htmlFor={id + key}>{t(label)}</label>
                <output htmlFor={id + key}>{readout}</output>
                <input
                  id={id + key}
                  aria-label={t(label)}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={input[key]}
                  onChange={(e) => setInput((p) => ({ ...p, [key]: +e.target.value }))}
                />
              </div>
            ))}
          <button
            onClick={() => {
              setInput(escapementInitial());
              setEpoch((v) => v + 1);
            }}
          >
            {t('重置全部擒纵实验')}
          </button>
        </div>
      )}
      <details className="escapement-limits">
        <summary>{t('接触几何与能量模型的边界')}</summary>
        <p>
          {t(
            '30 齿、7.5 齿距跨距；两侧锁面以锚轴为圆心，冲量面连接同一齿尖圆上的释放端点。齿形、锁定、冲量与跌落都由这套几何决定。',
          )}
        </p>
        <p>
          {t(
            '主机构规定小角摆的运动；跌落采用有限时长的加速曲线，不求解轮系惯量、冲击或摩擦。重锤直接连到示范卷筒，真实钟的轮系未展示。',
          )}
        </p>
        <p>
          {t(
            '能量对照另用线性小角摆：质量 0.20 kg，阻尼系数 γ = 0.025 s⁻¹；在过中点时加入规定能量。它解释补偿损失，不预测这副擒纵的力矩、效率或走时误差。',
          )}
        </p>
        <p>
          {t(
            '机构尺寸以展示单位 u 表示，摆长以 m 表示。模型的摆杆按有效摆长同步改变；这是教学比例，不是钟表制造尺寸。',
          )}
        </p>
      </details>
    </section>
  );
}
