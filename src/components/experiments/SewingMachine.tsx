import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { sewingInitial, sewingPose, sewingShot } from '../../models/sewing-machine';
import SewingMachineStudio from '../three/SewingMachineStudio';
import {
  SewingMachineDiagram,
  SewingTiming,
  SewingStitchComparison,
} from '../three/SewingMachineDiagram';
import '../../styles/sewing-machine.css';
const titles = [
  '一根针，怎样留下两根线？',
  '针回升，线环才出现',
  '梭尖进入针后的线环',
  '上线绕过整只梭心套',
  '线环脱离旋梭，走向前侧',
  '挑线杆把大环收成一针',
  '针已经离布，送布牙再推进',
  '针距改变，交锁关系不变',
];
const captions = [
  '铜红色上线穿过针眼；青绿色底线来自下方梭心。',
  '针先到底，再稍稍抬起：针后留出可供梭尖进入的线环。',
  '旋梭连续转动，梭尖在针回升时接住上线。',
  '两条线腿分到梭心套前后，底线被包含在线环之内。',
  '上线从梭心套外缘绕到前面；旋梭继续空转。',
  '挑线杆上升，外侧线环缩小，在布内与底线交锁。',
  '本模型先收紧，再送布；针仍在布内时，织物保持不动。',
  '改变送布距离，两针之间的跨度改变，两根线仍在布内相扣。',
];
export default function SewingMachine() {
  const film = useShowcase(),
    compact = useCompact(),
    id = useId(),
    [input, setInput] = useState(sewingInitial),
    [resetEpoch, setResetEpoch] = useState(0);
  const shot = sewingShot(film.chapter, film.chapterProgress),
    pose = film.watch ? shot.pose : sewingPose(input.phase, input.pitch);
  const focus = film.watch
    ? shot.focus
    : input.view === 'section'
      ? pose.complete
        ? 'stitch'
        : pose.phase > 0.5
          ? 'case'
          : 'eye'
      : 'overview';
  const states = {
    descend: '针向下',
    form: '针回升，线环形成',
    carry: '梭尖携带上线',
    release: '线环离开梭心套',
    tighten: '挑线杆收紧',
    feed: '送布牙推进',
    complete: '这一针已留下',
  };
  const show3D = film.watch
    ? !compact || focus === 'case' || focus === 'release'
    : input.view === 'cutaway';
  return (
    <section className="sewing-scene" data-focus={focus} data-watch={film.watch}>
      <header className="sewing-heading">
        <span>{t('缝纫机 · 锁式线迹')}</span>
        <h2>{t(film.watch ? titles[shot.chapter] : '沿一个缝纫周期检查线迹')}</h2>
        <p>
          {t(
            film.watch
              ? captions[shot.chapter]
              : '移动周期滑块，查看同一时刻的针、旋梭、挑线杆和送布牙。',
          )}
        </p>
      </header>
      {film.watch && focus === 'stitch' ? (
        <div className="sewing-comparison-wrap">
          <SewingStitchComparison pose={pose} reference={shot.reference} />
        </div>
      ) : (
        <div className="sewing-visual">
          {show3D && (
            <div className="sewing-object">
              {focus !== 'overview' && focus !== 'takeup' && (
                <span className="sewing-closeup-label">{t('局部剖面')}</span>
              )}
              <SewingMachineStudio
                key={resetEpoch}
                pose={pose}
                focus={focus}
                progress={shot.progress}
              />
            </div>
          )}
          <div className="sewing-section">
            <SewingMachineDiagram pose={pose} focus={focus} />
          </div>
        </div>
      )}
      <div className="sewing-status">
        <span>{t(states[pose.step as keyof typeof states])}</span>
        <span>
          {t('周期')} <b>{(pose.phase * 100).toFixed(0)}%</b>
        </span>
      </div>
      <div className="sewing-secondary">
        <SewingTiming pose={pose} />
      </div>
      {!film.watch && (
        <div className="sewing-controls">
          <div className="sewing-options" role="group" aria-label={t('选择线迹视图')}>
            {(['cutaway', 'section'] as const).map((view, i) => (
              <button
                key={view}
                aria-pressed={input.view === view}
                onClick={() => setInput((p) => ({ ...p, view }))}
              >
                {t(['三维剖切', '线迹剖面'][i])}
              </button>
            ))}
          </div>
          <div className="sewing-range">
            <label htmlFor={id + 'phase'}>{t('缝纫周期位置')}</label>
            <output htmlFor={id + 'phase'}>{(input.phase * 100).toFixed(1)}%</output>
            <input
              id={id + 'phase'}
              aria-label={t('缝纫周期位置')}
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={input.phase}
              onChange={(e) => setInput((p) => ({ ...p, phase: +e.target.value }))}
            />
          </div>
          <div className="sewing-range">
            <label htmlFor={id + 'pitch'}>{t('每针送布距离')}</label>
            <output htmlFor={id + 'pitch'}>{input.pitch.toFixed(2)} u</output>
            <input
              id={id + 'pitch'}
              aria-label={t('每针送布距离')}
              type="range"
              min="0.35"
              max="0.85"
              step="0.01"
              value={input.pitch}
              onChange={(e) => setInput((p) => ({ ...p, pitch: +e.target.value }))}
            />
          </div>
          <p>{t('u 为展示长度单位。针距只改变送布行程；针与旋梭的几何和相位保持一致。')}</p>
          <button
            onClick={() => {
              setInput(sewingInitial());
              setResetEpoch((n) => n + 1);
            }}
          >
            {t('重置整个缝纫周期')}
          </button>
        </div>
      )}
      <details className="sewing-assumptions">
        <summary>{t('剖切与柔性线模型')}</summary>
        <p>
          {t(
            '采用水平轴旋梭的双线锁式线迹。旋梭每个针周期转两圈；针杆使用曲柄连杆，挑线与四运动送布采用同相位的规定运动。',
          )}
        </p>
        <p>
          {t(
            '线从线轴或梭心连续延伸到已有线迹。线环使用连续空间包络，示意形成、携带、脱环与收紧；不求解线的张力、摩擦、伸长或布料接触。',
          )}
        </p>
        <p>
          {t(
            '机壳、梭心套及布料沿观察方向剖开；缝线通道特意露出。尺寸与间隙为教学几何，不代表任何机型的维修参数，也不是全机无碰撞证明。',
          )}
        </p>
        <p>
          {t(
            '送布安排在本模型收紧后的针离布区间。真实机器的挑线、送布与张力配合可有重叠，取决于机构与缝料。',
          )}
        </p>
      </details>
    </section>
  );
}
