import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  reservationInvariant,
  reservationLesson,
  type ReservationMode,
} from '../../models/database-transactions';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/database-transactions.css';
const rollback = reservationLesson('rollback'),
  unsafe = reservationLesson('overlap', 'unchecked'),
  safe = reservationLesson(),
  retried = reservationLesson('overlap', 'validate', 1, true);
const statuses = {
  active: '执行中',
  staged: '待提交',
  committed: '已提交',
  aborted: '校验失败',
  'rolled-back': '已回滚',
  rejected: '无余票',
} as const;
export default function DatabaseTransactions() {
  const d = useShowcase(),
    id = useId(),
    [mode, setMode] = useState<ReservationMode>('validate'),
    [schedule, setSchedule] = useState<'overlap' | 'serial'>('overlap'),
    [stock, setStock] = useState(1),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1,
    q = d.watch
      ? c <= 2
        ? rollback
        : c === 3
          ? unsafe
          : c === 4
            ? safe
            : retried
      : reservationLesson(schedule, mode, stock),
    index = d.watch
      ? c === 0
        ? 0
        : c === 1
          ? 3
          : c === 2
            ? 4
            : c === 3
              ? p < 0.3
                ? 4
                : p < 0.6
                  ? 7
                  : 8
              : c === 4
                ? p < 0.3
                  ? 6
                  : p < 0.6
                    ? 7
                    : 8
                : Math.min(q.frames.length - 1, 9 + Math.floor(p * 4))
      : Math.min(step, q.frames.length - 1),
    frame = q.frames[index],
    s = frame.state,
    valid = reservationInvariant(s),
    keys = ['T1', s.transactions['T2′'] ? 'T2′' : 'T2'];
  return (
    <section className="tx-study" data-watch={d.watch} aria-label={t('数据库事务与并发预订实验')}>
      <header>
        <span>TRANSACTIONS / VISIBILITY</span>
        <b>{t('已提交的公共状态')}</b>
      </header>
      <div className="tx-store" data-valid={valid}>
        <div>
          <span>{t('余票')}</span>
          <strong>{s.remaining}</strong>
        </div>
        <div>
          <span>{t('成功订单')}</span>
          <strong>{s.orders.length}</strong>
        </div>
        <p>
          {t('初始容量')} {s.initial}
          <span>
            {s.remaining} + {s.orders.length} {valid ? '=' : '≠'} {s.initial}
          </span>
        </p>
      </div>
      <div className="tx-lanes">
        {keys.map((key) => {
          const tx = s.transactions[key];
          return (
            <article key={key} data-status={tx?.status ?? 'idle'}>
              <h3>
                {key}
                <span>{t(tx ? statuses[tx.status] : '未开始')}</span>
              </h3>
              <div>
                <span>{t('读值')}</span>
                <b>{tx?.read ?? '—'}</b>
              </div>
              <div>
                <span>{t('拟写')}</span>
                <b>{tx?.proposed ?? '—'}</b>
              </div>
            </article>
          );
        })}
      </div>
      {((d.watch && c === 4) || !d.watch) && (
        <p className="tx-version">
          <span>
            {t('当前版本')} <b>v{s.version}</b>
          </span>
          <span>
            {t('T2 读取版本')}{' '}
            <b>
              {s.transactions.T2?.version === null || !s.transactions.T2
                ? '—'
                : `v${s.transactions.T2.version}`}
            </b>
          </span>
        </p>
      )}
      {frame.event && (
        <p className="tx-event">
          {frame.event.tx} · {frame.event.action.toUpperCase()}
          {frame.event.action === 'read' && <> · v{s.transactions[frame.event.tx].version}</>}
        </p>
      )}
      {!d.watch && (
        <div className="tx-controls">
          <label htmlFor={`${id}-mode`}>{t('提交策略')}</label>
          <select
            id={`${id}-mode`}
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as ReservationMode);
              setStep(0);
            }}
          >
            <option value="unchecked">{t('直接写回旧读数')}</option>
            <option value="validate">{t('提交前校验读取版本')}</option>
          </select>
          <label htmlFor={`${id}-schedule`}>{t('执行顺序')}</label>
          <select
            id={`${id}-schedule`}
            value={schedule}
            onChange={(e) => {
              setSchedule(e.target.value as 'overlap' | 'serial');
              setStep(0);
            }}
          >
            <option value="overlap">{t('两者先读，再提交')}</option>
            <option value="serial">{t('第一笔完成，再开始第二笔')}</option>
          </select>
          <label htmlFor={`${id}-stock`}>
            {t('初始容量')} · {stock}
          </label>
          <input
            id={`${id}-stock`}
            type="range"
            min="1"
            max="3"
            value={stock}
            onChange={(e) => {
              setStock(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('事务事件')} · {index}/{q.frames.length - 1}
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
        <summary>{t('原子提交，不等于自动防止旧读数覆盖')}</summary>
        <p>
          {t(
            '每笔事务把余票与订单一起提交，但并发读到的旧值仍可能导致错误。校验模式使用教学乐观版本检查，失败则整笔中止并从新读取重试；它不是 PostgreSQL 的 SSI 实现。原子性、隔离性与持久性是不同保证；掉电恢复另见预写日志。',
          )}
        </p>
      </details>
    </section>
  );
}
