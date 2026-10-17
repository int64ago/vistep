import { useId, useState } from 'react';
import { t } from '../../i18n';
import { walScenario } from '../../models/write-ahead-log';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/write-ahead-log.css';
const lesson = walScenario(),
  uncommitted = walScenario('update-only'),
  unacknowledged = walScenario('commit-no-ack');
export default function WriteAheadLog() {
  const d = useShowcase(),
    id = useId(),
    [point, setPoint] = useState<Parameters<typeof walScenario>[0]>('ack'),
    [value, setValue] = useState(11),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 0,
    q = d.watch ? lesson : walScenario(point, value),
    index = d.watch
      ? c === 0
        ? 1
        : c === 1
          ? 2
          : c === 2
            ? 4
            : c === 3
              ? 5
              : 6
      : Math.min(step, q.frames.length - 1),
    s = q.frames[index].state,
    phase = q.frames[index].action;
  const compare = d.watch && c === 5;
  const record = (kind: 'set' | 'commit', newValue: number) =>
    kind === 'commit' ? 'COMMIT' : `SET ${newValue}`;
  return (
    <section className="wal-study" data-watch={d.watch} aria-label={t('预写日志与崩溃恢复实验')}>
      <header>
        <span>WRITE / AHEAD</span>
        <strong>
          {compare ? t('无确认不等于未提交') : s.acknowledged ? t('已确认成功') : t('尚未确认')}
        </strong>
      </header>
      {compare ? (
        <div className="wal-boundaries">
          {[
            { q: uncommitted, title: '只有修改记录持久' },
            { q: unacknowledged, title: '提交持久，确认丢失' },
          ].map(({ q, title }) => (
            <article key={title}>
              <h3>{t(title)}</h3>
              <div>
                {q.state.records.slice(0, q.state.durable).map((r) => (
                  <code key={r.lsn}>{record(r.kind, r.value ?? 11)}</code>
                ))}
              </div>
              <span>{t('恢复结果')}</span>
              <strong>{q.state.page.value}</strong>
            </article>
          ))}
        </div>
      ) : (
        <div className="wal-tracks">
          <div className="wal-memory">
            <h3>{t('内存页')}</h3>
            <div>
              <b>{s.memory?.value ?? '∅'}</b>
              <span>{s.memory ? t('易失状态') : t('断电丢失')}</span>
            </div>
          </div>
          <div className="wal-tape">
            <h3>{t('日志顺序')}</h3>
            <div>
              {s.records.map((r, i) => (
                <article key={r.lsn} data-durable={i < s.durable}>
                  <span>LSN {r.lsn}</span>
                  <code>{record(r.kind, r.value ?? value)}</code>
                  <b>{t(i < s.durable ? '已持久' : '仅缓存')}</b>
                </article>
              ))}
            </div>
          </div>
          <div className="wal-page">
            <h3>{t('持久数据页')}</h3>
            <div>
              <b>{s.page.value}</b>
              <span>pageLSN {s.page.lsn}</span>
            </div>
          </div>
        </div>
      )}
      {!compare && (
        <p className="wal-order">
          {phase === 'recover'
            ? t('按持久日志重放已提交变化。')
            : phase === 'crash'
              ? t('内存清空，持久日志与旧页留下。')
              : s.acknowledged
                ? t('日志已先持久，数据页可以稍后更新。')
                : t('未持久的提交记录，不能确认成功。')}
        </p>
      )}
      {!d.watch && (
        <div className="wal-controls">
          <label htmlFor={`${id}-point`}>{t('崩溃边界')}</label>
          <select
            id={`${id}-point`}
            value={point}
            onChange={(e) => {
              setPoint(e.target.value as typeof point);
              setStep(0);
            }}
          >
            <option value="buffer">{t('只有缓存')}</option>
            <option value="update-only">{t('只有修改日志持久')}</option>
            <option value="commit-no-ack">{t('提交持久但尚未确认')}</option>
            <option value="ack">{t('已确认，旧数据页')}</option>
            <option value="page">{t('数据页也已写入')}</option>
          </select>
          <label htmlFor={`${id}-value`}>
            {t('新页值')} · {value}
          </label>
          <input
            id={`${id}-value`}
            type="range"
            min="8"
            max="15"
            value={value}
            onChange={(e) => {
              setValue(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('持久化步骤')} · {index}/{q.frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={q.frames.length - 1}
            value={index}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
      )}
      <details>
        <summary>{t('先写日志，不等于只写日志')}</summary>
        <p>
          {t(
            '这是单页、单事务、禁止未提交页落盘的 no-steal 逻辑重放模型。持久化修改日志必须先于对应数据页；确认成功还要等待提交记录持久。恢复只公布本模型中有持久提交标记的修改。真实 PostgreSQL 的物理重放、MVCC 可见性、检查点与撕裂页修复更复杂；存储必须兑现持久写保证。',
          )}
        </p>
      </details>
    </section>
  );
}
