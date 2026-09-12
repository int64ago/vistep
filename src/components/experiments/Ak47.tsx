import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import { Ak47Energy } from '../lab/Ak47Mechanism';
import Ak47Studio from '../three/Ak47Studio';
import {
  AK47_MODEL,
  AK47_COMPARE_RANGE,
  ak47State,
  ak47Shot,
  ak47Compare,
  type Ak47View,
} from '../../models/ak47';
import '../../styles/ak47.css';

const labels: Record<Ak47View, string> = {
  object: '一件器物，一条能量线',
  drive: '能量从哪里来？',
  linked: '两部分，一起移动',
  store: '后移，把能量存起来',
  return: '弹簧把能量交回来',
  compare: '同一位置，不同方向',
  cycle: '位置回来了，能量呢？',
};
const notes: Record<Ak47View, string> = {
  object: '观察相连的活塞与枪机框。',
  drive: '导气支路只取走部分燃气能量。',
  linked: '活塞与枪机框保持连接。',
  store: '移动变慢，弹性储能增加。',
  return: '输入已停止，弹簧仍能做功。',
  compare: '位置相同，运动状态不同。',
  cycle: '回到起点，不会凭空获得下一次能量。',
};
export default function Ak47() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300),
    [phase, setPhase] = useState(50),
    [compare, setCompare] = useState(50);
  const [mode, setMode] = useState<'linked' | 'compare'>('linked');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, Math.min(760, entry.contentRect.width))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const shot = ak47Shot(film.chapter, film.chapterProgress),
    view = film.watch ? shot.view : mode;
  const progress = film.watch ? shot.progress : phase / 100;
  const state = ak47State(progress);
  const comparisonPosition = film.watch ? shot.comparePosition : compare / 100;
  const pair = useMemo(
    () => (view === 'compare' ? ak47Compare(comparisonPosition) : null),
    [view, comparisonPosition],
  );
  const narrow = width < 500,
    object = view === 'object';
  return (
    <section className="ak47-study" data-view={view} data-watch={film.watch}>
      <div className="ak47-heading">
        <span>AK–47</span>
        <strong>{t(labels[view])}</strong>
      </div>
      <div className="ak47-stage" ref={host}>
        <div
          className="ak47-object-frame"
          data-closeup={!object}
          data-comparison={view === 'compare'}
        >
          <Ak47Studio
            visual={{
              state: view === 'compare' ? pair!.outward : state,
              reveal: object ? shot.reveal : 1,
              closeup: !object,
              compare: view === 'compare' ? pair!.returning : undefined,
              input: view === 'drive',
              narrow,
            }}
          />
        </div>
        {object ? (
          <div className="ak47-object-key">
            <i />
            {t('导气活塞与枪机框')}
          </div>
        ) : view === 'compare' ? (
          <div className="ak47-compare" style={{ gridTemplateColumns: narrow ? '1fr' : '1fr 1fr' }}>
            {[
              { name: '后移', state: pair!.outward },
              { name: '返回', state: pair!.returning },
            ].map((row) => (
              <div className="ak47-comparison" key={row.name}>
                <div className="ak47-row-name">{t(row.name)}</div>
                <Ak47Energy state={row.state} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <Ak47Energy state={state} />
            <div className="ak47-phase-line">
              <span>
                {t(
                  state.complete
                    ? '一轮结束'
                    : state.drive > 0.02
                      ? '能量输入中'
                      : state.velocity < -0.008
                        ? '弹簧驱动回程'
                        : state.velocity > 0.008
                          ? '继续后移'
                          : '停留观察',
                )}
              </span>
              <span>
                {Math.round((state.x / AK47_MODEL.maximumX) * 100)}%<small> {t('相对位移')}</small>
              </span>
            </div>
          </>
        )}
      </div>
      <p className="ak47-note">{t(notes[view])}</p>
      {!film.watch && (
        <div className="ak47-exploration">
          <Segments<'linked' | 'compare'>
            value={mode}
            onChange={setMode}
            label={t('选择观察方式')}
            options={[
              { value: 'linked', label: t('沿过程观察') },
              { value: 'compare', label: t('比较去回') },
            ]}
          />
          {mode === 'linked' ? (
            <Range
              label={t('教学过程位置')}
              value={phase}
              min={0}
              max={100}
              unit="%"
              onChange={setPhase}
            />
          ) : (
            <Range
              label={t('比较位置')}
              value={compare}
              min={AK47_COMPARE_RANGE.min * 100}
              max={AK47_COMPARE_RANGE.max * 100}
              unit="%"
              onChange={setCompare}
            />
          )}
          <p className="ak47-explore-help">{t('拖动只改变观察时刻，不改变武器参数。')}</p>
          <details>
            <summary>{t('这个模型解释到哪里？')}</summary>
            <p>
              {t(
                '仅说明长行程导气的联动关系与能量转移。质量、弹性、阻尼和时间均为无量纲教学设定；不模拟真实枪械循环。',
              )}
            </p>
            <p>{t('省略供弹、击发、闭锁和弹道。图形不能用于操作、拆装或制造。')}</p>
          </details>
        </div>
      )}
    </section>
  );
}
