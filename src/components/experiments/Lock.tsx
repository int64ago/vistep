import { useId, useState } from 'react';
import { t } from '../../i18n';
import { lockInitial, lockPose, lockCommand, lockShot, type LockKey } from '../../models/lock';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import LockStudio from '../three/LockStudio';
import { LockSection, LockStackStates, LockComparison } from '../three/LockDiagram';
import '../../styles/lock.css';
const titles = [
  '先看挡住转动的那一组',
  '钥匙沿着同一条通道推进',
  '圆头沿齿形连续抬升',
  '不同长度，抵达同一边界',
  '只差一处，仍然转不动',
  '边界清空，锁芯才能转动',
  '先回正，再退出',
  '钥匙退出，弹子重新跨界',
];
const captions = [
  '上弹子跨在固定外壳与锁芯之间。',
  '钥匙先接触圆头，再把整组弹子推高。',
  '抬升来自实际接触；弹簧的两端始终有支承。',
  '匹配的齿高与下弹子长度互相补足。',
  '比较同一时刻：一个错误高度仍会阻挡锁芯。',
  '钥匙和下弹子随锁芯转，上弹子留在外壳里。',
  '转动时钥匙保持就位；回到入口位置后才能退出。',
  '齿面离开后，弹簧使上弹子重新进入锁芯。',
];
export default function Lock() {
  const film = useShowcase(),
    compact = useCompact(),
    id = useId(),
    [input, setInput] = useState(lockInitial),
    [selected, setSelected] = useState(0),
    [resetCount, setResetCount] = useState(0),
    [view, setView] = useState<'mechanism' | 'section' | 'compare'>('mechanism');
  const shot = lockShot(film.chapter, film.chapterProgress),
    pose = film.watch ? shot.pose : lockPose(input),
    current = film.watch ? shot.selected : selected;
  const focus = film.watch
    ? shot.focus
    : view === 'compare'
      ? 'compare'
      : view === 'section'
        ? 'contact'
        : pose.angle > 0
          ? 'turn'
          : 'overview';
  const reference = film.watch ? shot.reference : lockPose({ ...input, key: 'matching' });
  const show3D = film.watch
    ? !compact || focus === 'turn' || focus === 'return'
    : view === 'mechanism';
  const manualTitle =
    pose.angle > 0
      ? '钥匙与锁芯一起转动'
      : pose.canTurn
        ? '六组界面全部对齐'
        : pose.seated
          ? '仍有弹子跨过边界'
          : '观察钥匙与圆头的接触';
  const command = (a: Parameters<typeof lockCommand>[1]) => setInput((p) => lockCommand(p, a));
  const reset = () => {
    setInput(lockInitial());
    setSelected(0);
    setView('mechanism');
    setResetCount((n) => n + 1);
  };
  const range = (
    key: string,
    label: string,
    value: number,
    max: number,
    step: number,
    change: (n: number) => void,
    disabled = false,
    unit = '',
  ) => (
    <div className="lock-range">
      <label htmlFor={id + key}>{t(label)}</label>
      <output htmlFor={id + key}>
        {value.toFixed(step < 1 ? 2 : 0)}
        {unit}
      </output>
      <input
        id={id + key}
        type="range"
        min="0"
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => change(+e.target.value)}
      />
    </div>
  );
  return (
    <section className="lock-scene" data-focus={focus} data-watch={film.watch}>
      <header className="lock-heading">
        <span>{t('弹子锁 · 正常钥匙操作')}</span>
        <h2>{t(film.watch ? titles[shot.chapter] : manualTitle)}</h2>
        <p>{t(film.watch ? captions[shot.chapter] : '改变插入深度与转角请求，检查同一个机构。')}</p>
      </header>
      {focus === 'compare' ? (
        <LockComparison pose={pose} reference={reference} />
      ) : (
        <>
          {show3D && (
            <div className="lock-object">
              <LockStudio
                key={`${resetCount}-${film.run}`}
                pose={pose}
                selected={current}
                focus={focus}
                progress={film.chapterProgress}
              />
            </div>
          )}
          <div className="lock-phone-section">
            <div className="lock-section-title">{t('追踪第 {0} 组', current + 1)}</div>
            <LockSection pose={pose} selected={current} />
          </div>
          <LockStackStates
            pose={pose}
            selected={current}
            onSelect={film.watch ? undefined : setSelected}
          />
        </>
      )}
      <div className="lock-status" aria-live={film.watch ? undefined : 'polite'}>
        <span>
          {t('插入')} <b>{(pose.insertion * 100).toFixed(0)}%</b>
        </span>
        <span>
          {t('锁芯转角')} <b>{((pose.angle * 180) / Math.PI).toFixed(0)}°</b>
        </span>
        <strong data-ready={pose.canTurn}>
          {t(
            pose.angle > 0
              ? '转动中，钥匙保持就位'
              : pose.canTurn
                ? '可以转动'
                : pose.blocked
                  ? '转角请求被阻挡'
                  : '尚未允许转动',
          )}
        </strong>
      </div>
      {film.watch && shot.withdrawalRequested && (
        <p className="lock-retained">{t('此刻要求退出，位置保持不变。')}</p>
      )}
      {!film.watch && (
        <div className="lock-controls">
          <h3>{t('用完整钥匙检查匹配关系')}</h3>
          <div className="lock-options" role="group" aria-label={t('选择锁芯视图')}>
            {(['mechanism', 'section', 'compare'] as const).map((v, i) => (
              <button
                key={v}
                disabled={v === 'compare' && pose.angle > 0}
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  if (v === 'compare') setInput((p) => ({ ...p, requestedAngle: 0 }));
                }}
              >
                {t(['三维机构', '弹子剖面', '钥匙比较'][i])}
              </button>
            ))}
          </div>
          <div className="lock-options" role="group" aria-label={t('选择教学钥匙')}>
            {(['matching', 'high', 'low'] as LockKey[]).map((key, i) => (
              <button
                key={key}
                disabled={pose.insertion > 0}
                aria-pressed={input.key === key}
                onClick={() => command({ type: 'key', key })}
              >
                {t(['匹配钥匙', '第三处偏高', '第三处偏低'][i])}
              </button>
            ))}
          </div>
          <p>{t('完全退出后才能换钥匙；锁芯转动时不能沿通道抽出。')}</p>
          {range(
            'insert',
            '钥匙插入比例',
            input.insertion,
            1,
            0.01,
            (n) => command({ type: 'insert', value: n }),
            !pose.canWithdraw,
          )}
          {range(
            'angle',
            '请求转角',
            (input.requestedAngle * 180) / Math.PI,
            75,
            1,
            (n) => command({ type: 'turn', value: (n * Math.PI) / 180 }),
            view === 'compare',
            '°',
          )}
          <button className="lock-reset" onClick={reset}>
            {t('重置整个钥匙试验')}
          </button>
        </div>
      )}
      <details className="lock-assumptions">
        <summary>{t('模型与剖面约定')}</summary>
        <p>
          {t(
            '六组弹子的身份和长度固定；钥匙使用连续折线齿形和圆头接触。所有长度为展示单位，不是商品钥匙编码或加工尺寸。',
          )}
        </p>
        <p>
          {t(
            '剪切端面按锁芯的圆柱边界理想化，使转动时上下弹子连续分离、上弹子落在锁芯表面。实际锁具通常使用近似平端与倒角；本图不表达生产公差。',
          )}
        </p>
        <p>
          {t(
            '仅演示匹配钥匙的正常插入、转动、回正和退出。忽略摩擦、弹性变形及快速碰撞；弹簧只表示有支承的准静态压缩，不计算开锁力。',
          )}
        </p>
        <p>
          {t(
            '前侧材料作剖切显示；固定外壳、弹簧座和锁芯的后侧材料保留。尾部拨片与锁芯刚性连接，门闩机构省略。',
          )}
        </p>
      </details>
    </section>
  );
}
