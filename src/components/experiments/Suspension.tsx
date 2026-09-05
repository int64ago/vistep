import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  SUSPENSION,
  SUSPENSION_GEOMETRY as G,
  suspensionShot,
  simulateSuspension,
  sampleSuspensionPair,
  suspensionInitial,
  suspensionEnergy,
  suspensionForces,
  type SuspensionRoad,
} from '../../models/suspension';
import { useShowcase } from '../lab/Showcase';
import SuspensionStudio from '../three/SuspensionStudio';
import SuspensionDiagram from '../lab/SuspensionDiagram';
import SuspensionTrace from '../lab/SuspensionTrace';
import SuspensionContact from '../lab/SuspensionContact';
import '../../styles/suspension.css';

const headings = [
  '路面先到轮胎，再到车身',
  '弹簧把能量存起来，也会还回来',
  '更软，仍然会振荡',
  '让同一个凸起通过两次',
  '减振器把运动能量耗散掉',
  '阻尼更大，也会传递更大的力',
  '轮胎不能把路面往上拉',
  '隔振、行程、接地，要一起看',
];
const titlesA = [
  '一角车身与一个车轮',
  '无阻尼的理想对照',
  '较软弹簧',
  '无阻尼',
  '释放后自由衰减',
  '适中阻尼',
  '起伏路面的接触边界',
  '回到完整悬架',
];
const titlesB = { 2: '较硬弹簧', 3: '加入阻尼', 5: '较大阻尼' } as Record<number, string>;

export default function Suspension() {
  const film = useShowcase();
  const [stiffness, setStiffness] = useState(18000),
    [damping, setDamping] = useState(1400),
    [amplitude, setAmplitude] = useState(0.035),
    [roadKind, setRoadKind] = useState<SuspensionRoad['kind']>('bump'),
    [frequency, setFrequency] = useState(10.4),
    [time, setTime] = useState(0),
    [compare, setCompare] = useState(false),
    [resetKey, setResetKey] = useState(0);
  const directed = suspensionShot(film.chapter, film.chapterProgress);
  const chapter = film.watch
    ? directed.chapter
    : roadKind === 'ripple'
      ? 6
      : roadKind === 'flat'
        ? 4
        : 0;
  const parameters = film.watch ? directed.parameters : { ...SUSPENSION, stiffness, damping };
  const road = film.watch ? directed.road : { kind: roadKind, amplitude, frequency };
  const comparison = film.watch ? directed.comparison : compare ? SUSPENSION : null;
  const initialBody = film.watch ? directed.initialBody : roadKind === 'flat' ? 0.04 : 0;
  const a = useMemo(
    () => simulateSuspension(parameters, road, 8, suspensionInitial(initialBody)),
    [
      parameters.stiffness,
      parameters.damping,
      road.kind,
      road.amplitude,
      road.frequency,
      initialBody,
    ],
  );
  const b = useMemo(
    () =>
      comparison ? simulateSuspension(comparison, road, 8, suspensionInitial(initialBody)) : null,
    [
      comparison?.stiffness,
      comparison?.damping,
      road.kind,
      road.amplitude,
      road.frequency,
      initialBody,
    ],
  );
  const requested = film.watch
    ? chapter === 6
      ? (film.chapterProgress / 0.84) * (a.contactLimit ?? 8)
      : directed.modelTime
    : time;
  const pair = sampleSuspensionPair(a, b, requested);
  const va = { state: pair.a, parameters: a.parameters, road: a.road },
    vb = b && pair.b ? { state: pair.b, parameters: b.parameters, road: b.road } : null;
  const force = suspensionForces(pair.a, a.parameters, a.road),
    energy = suspensionEnergy(pair.a, a.parameters, a.road);
  const focus = film.watch
    ? directed.focus
    : chapter === 6
      ? 'contact'
      : chapter === 4
        ? 'energy'
        : 'path';
  const titleA = film.watch ? titlesA[chapter] : '当前设置',
    titleB = film.watch ? titlesB[chapter] : '默认悬架';
  const info = (label: string, v: typeof va, isB = false) => (
    <div className="susp-specimen" data-alternate={isB}>
      <h3>
        <i />
        <span>{t(label)}</span>
      </h3>
      <p className="susp-parameters">
        <span className="susp-k">k = {(v.parameters.stiffness / 1000).toFixed(0)} kN/m</span>
        <span className="susp-c">c = {(v.parameters.damping / 1000).toFixed(1)} kN·s/m</span>
      </p>
      {chapter === 2 && (
        <p className="susp-sag">
          <span className="susp-sag-full">{t('静态弹簧压缩')}</span>
          <span className="susp-sag-short">{t('静压缩')}</span>{' '}
          {(((v.parameters.sprungMass * 9.81) / v.parameters.stiffness) * 1000).toFixed(0)} mm
        </p>
      )}
    </div>
  );
  return (
    <div
      className="susp-experiment"
      data-mode={film.watch ? 'watch' : 'explore'}
      data-focus={focus}
      data-comparison={Boolean(b)}
    >
      <div className="susp-opening">
        <span>{t('汽车悬架')}</span>
        <h2>{t(headings[chapter])}</h2>
        <p>{chapter === 4 ? t('固定路面 · 从 40 mm 释放') : t('四分之一车 · 垂直激振试验')}</p>
      </div>
      <div className="susp-specimens">
        {info(titleA, va)}
        {vb && info(titleB, vb, true)}
      </div>
      <div className="susp-stage">
        <SuspensionStudio
          key={resetKey}
          a={va}
          b={vb}
          chapter={chapter}
          progress={film.watch ? film.chapterProgress : chapter === 4 ? 0.5 : 0}
        />
      </div>
      {focus === 'contact' && <SuspensionContact visual={va} />}
      {vb && (
        <div className="susp-phone-comparison">
          <div>
            {info(titleA, va)}
            <SuspensionDiagram visual={va} />
          </div>
          <div>
            {info(titleB, vb, true)}
            <SuspensionDiagram visual={vb} />
          </div>
        </div>
      )}
      <div className="susp-under-object">
        <span>{t('弹簧与减振器并联，连接同一对端点。')}</span>
        <span>
          {chapter === 4 ? t('减振器剖面 · 轮胎透明观察') : t('导轨只约束竖直运动，不是汽车摆臂。')}
        </span>
      </div>
      {pair.limited && (
        <p className="susp-boundary" role="status">
          {t('到达 N = 0：线性轮胎接触模型在这里停止。两组对照停在同一时刻。')}
        </p>
      )}
      {focus === 'energy' ? (
        <div className="susp-energy">
          <div className="susp-energy-line">
            <span>
              {t(film.watch ? '机械能' : '仍在运动与弹性中')}{' '}
              <strong>{energy.mechanical.toFixed(2)} J</strong>
            </span>
            <span>
              {t(film.watch ? '累计耗散' : '已由减振器耗散')}{' '}
              <strong>{energy.dissipated.toFixed(2)} J</strong>
            </span>
          </div>
          <div className="susp-energy-track" aria-label={t('相对平衡位置的能量分配')}>
            <i
              style={{ width: `${(100 * energy.mechanical) / Math.max(0.001, a.initialEnergy)}%` }}
            />
            <b
              style={{ width: `${(100 * energy.dissipated) / Math.max(0.001, a.initialEnergy)}%` }}
            />
          </div>
          <p>
            {t('瞬时耗散功率')} <strong>{force.damperPower.toFixed(1)} W</strong>{' '}
            <span>c(vₛ − vᵤ)² ≥ 0</span>
          </p>
          <p className="susp-note">
            {t('从 40 mm 车身位移释放，路面固定。能量相对静态平衡计算，不是油温。')}
          </p>
        </div>
      ) : (
        <SuspensionTrace a={a} b={b} time={pair.time} focus={focus} />
      )}
      <div className="susp-observation">
        <p>
          <span>{t('模型时间')}</span>
          <strong>{pair.time.toFixed(2)} s</strong>
        </p>
        <p>
          <span>{focus === 'contact' ? t('轮胎法向载荷') : t('悬架相对行程')}</span>
          <strong>
            {focus === 'contact'
              ? (force.normalLoad / 1000).toFixed(2)
              : (force.travel * 1000).toFixed(1)}{' '}
            <small>{focus === 'contact' ? 'kN' : 'mm'}</small>
          </strong>
        </p>
        <p>
          <span>{t('车身加速度')}</span>
          <strong>
            {force.bodyAcceleration.toFixed(2)} <small>m/s²</small>
          </strong>
        </p>
      </div>
      {!film.watch && (
        <div className="susp-exploration">
          <h3>{t('让同一条路面，检验不同设置')}</h3>
          <div className="susp-options" role="group" aria-label={t('选择路面试验')}>
            {(['bump', 'ripple', 'flat'] as const).map((v, i) => (
              <button
                key={v}
                aria-pressed={roadKind === v}
                onClick={() => {
                  setRoadKind(v);
                  if (v === 'ripple') setAmplitude(Math.min(amplitude, G.rippleAmplitudeLimit));
                  setTime(0);
                }}
              >
                {t(['一个平滑凸起', '连续起伏', '释放后衰减'][i])}
              </button>
            ))}
          </div>
          <label>
            <span>
              {t('观察时刻')}
              <output>{time.toFixed(2)} s</output>
            </span>
            <input
              type="range"
              min="0"
              max="8"
              step=".01"
              value={time}
              aria-label={t('观察时刻')}
              onChange={(e) => setTime(Number(e.target.value))}
            />
          </label>
          <div className="susp-adjust">
            <label>
              <span>
                {t('悬架刚度')}
                <output>{stiffness / 1000} kN/m</output>
              </span>
              <input
                type="range"
                min="12000"
                max="30000"
                step="1000"
                value={stiffness}
                aria-label={t('悬架刚度')}
                onChange={(e) => setStiffness(Number(e.target.value))}
              />
            </label>
            <label>
              <span>
                {t('减振器阻尼')}
                <output>{(damping / 1000).toFixed(2)} kN·s/m</output>
              </span>
              <input
                type="range"
                min="0"
                max="6500"
                step="100"
                value={damping}
                aria-label={t('减振器阻尼')}
                onChange={(e) => setDamping(Number(e.target.value))}
              />
            </label>
          </div>
          {roadKind !== 'flat' && (
            <label>
              <span>
                {t('路面幅度')}
                <output>{(amplitude * 1000).toFixed(0)} mm</output>
              </span>
              <input
                type="range"
                min=".005"
                max={roadKind === 'ripple' ? G.rippleAmplitudeLimit : 0.045}
                step=".001"
                value={amplitude}
                aria-label={t('路面幅度')}
                onChange={(e) => setAmplitude(Number(e.target.value))}
              />
            </label>
          )}
          {roadKind === 'ripple' && (
            <label>
              <span>
                {t('路面起伏频率')}
                <output>{frequency.toFixed(1)} Hz</output>
              </span>
              <input
                type="range"
                min="1"
                max="14"
                step=".1"
                value={frequency}
                aria-label={t('路面起伏频率')}
                onChange={(e) => setFrequency(Number(e.target.value))}
              />
            </label>
          )}
          <button
            className="susp-compare"
            aria-pressed={compare}
            onClick={() => setCompare(!compare)}
          >
            {compare ? t('收起默认悬架对照') : t('与默认悬架比较')}
          </button>
          <button
            className="susp-compare"
            type="button"
            onClick={() => {
              setStiffness(18000);
              setDamping(1400);
              setAmplitude(0.035);
              setRoadKind('bump');
              setFrequency(10.4);
              setTime(0);
              setCompare(false);
              setResetKey((key) => key + 1);
            }}
          >
            {t('重置悬架实验')}
          </button>
          <p className="susp-note">
            {t('调参会从同一初始状态重算整段响应；时间滑块可前后拖动，不累积播放误差。')}
          </p>
        </div>
      )}
      <details className="susp-assumptions">
        <summary>{t('试验假设与单位')}</summary>
        <p>
          {t(
            '车身簧载质量 300 kg，轮组非簧载质量 45 kg，线性轮胎刚度 180 kN/m。只计算相对静态平衡的竖直运动；忽略俯仰、侧倾、摩擦、轮胎阻尼与悬架限位。',
          )}
        </p>
        <p>
          {t(
            '弹簧自由长度固定为 640 mm，改变刚度会改变静态下沉。螺旋外观只标识线性弹簧，不从线径反推刚度。几何长度随两个质量的位置变化，阻尼不改变零件尺寸。',
          )}
        </p>
        <p>
          {t(
            '轮胎只在法向载荷为正时使用线性模型；到零就停止，不模拟离地、碰撞或重新接触。能量以平衡位置为零点；路面做功与减振器耗散分别积分。此演示不预测制动距离或安全车速。',
          )}
        </p>
      </details>
    </div>
  );
}
