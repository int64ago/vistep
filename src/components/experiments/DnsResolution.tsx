import { useId, useState } from 'react';
import { t } from '../../i18n';
import { dnsRemaining, dnsResolve, type DnsNode } from '../../models/dns-resolution';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/dns-resolution.css';
const levels: { node: DnsNode; title: string; zone: string }[] = [
  { node: 'root', title: '根服务器', zone: '.' },
  { node: 'tld', title: '顶级域服务器', zone: 'test' },
  { node: 'authority', title: '权威服务器', zone: 'orchid.test' },
];
export default function DnsResolution() {
  const d = useShowcase(),
    id = useId();
  const [age, setAge] = useState(20),
    [ttl, setTtl] = useState(60),
    [changed, setChanged] = useState(false),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 5,
    p = d.watch ? d.chapterProgress : 1;
  const cold = dnsResolve({ ttl: d.watch ? 60 : ttl });
  const now = d.watch ? (c === 4 ? 20 : c === 5 ? 65 : 0) : age;
  const run =
    c < 4 && d.watch
      ? cold
      : dnsResolve({
          now,
          cache: cold.cache,
          ttl: d.watch ? 60 : ttl,
          address: changed || (d.watch && c === 5) ? '203.0.113.9' : '203.0.113.7',
        });
  const index = !d.watch
    ? Math.min(step, run.events.length - 1)
    : c === 0
      ? 0
      : c === 1
        ? 1 + Math.min(1, Math.floor(p * 2))
        : c === 2
          ? 3 + Math.min(1, Math.floor(p * 2))
          : c === 3
            ? 5 + Math.min(2, Math.floor(p * 3))
            : Math.min(run.events.length - 1, Math.floor(p * run.events.length));
  const event = run.events[index],
    server = event.from === 'resolver' ? event.to : event.from;
  const parts = c === 1 || c === 2 ? 2 : c === 3 ? 3 : run.events.length;
  const travel = d.watch ? (p >= 0.999 ? 1 : (p * parts) % 1) : 1;
  const shown =
    c < 4 && d.watch
      ? run.events.slice(0, index + 1).flatMap((e) => (e.record ? [e.record] : []))
      : run.hit || index < run.events.length - 2
        ? cold.cache
        : run.cache;
  const records = [...new Map(shown.map((r) => [r.key, r])).values()];
  const y = server === 'root' ? 18 : server === 'tld' ? 50 : 82;
  const reply = event.from !== 'resolver';
  return (
    <section
      className="dns-study"
      data-chapter={c}
      data-watch={d.watch}
      aria-label={t('DNS 分层查找实验')}
    >
      <header>
        <span>DNS / A</span>
        <span>{t('虚构 .test 教学域')}</span>
      </header>
      <div className="dns-name">
        <span>www.</span>
        <b>orchid.</b>
        <span>test.</span>
      </div>
      <div className="dns-client">
        <span>{t('应用')}</span>
        <i>⇄</i>
        <span>{t('递归解析器')}</span>
        <b hidden={d.watch}>RD = 1</b>
      </div>
      <div className="dns-atlas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M24 50L77 18 M24 50H77 M24 50L77 82" className="dns-roads" />
          {server !== 'client' && server !== 'resolver' && (
            <>
              <path d={`M24 50L77 ${y}`} className="dns-active-road" />
              <circle
                cx={24 + (reply ? 1 - travel : travel) * 53}
                cy={50 + (y - 50) * (reply ? 1 - travel : travel)}
                r="1.5"
              />
            </>
          )}
        </svg>
        <div className="dns-resolver">
          <span>{t('解析器')}</span>
          <b>{run.hit ? t('缓存命中') : t('继续查找')}</b>
          <small>{t('由它追踪转介')}</small>
        </div>
        <div className="dns-levels">
          {levels.map((level) => (
            <div className="dns-level" key={level.node} data-active={server === level.node}>
              <span>{t(level.title)}</span>
              <b>{level.zone}</b>
            </div>
          ))}
        </div>
      </div>
      {d.watch && c >= 3 && !run.hit && (
        <p className="dns-cache-source">
          {t('解析器')} ⇄ {t('权威服务器')}
        </p>
      )}
      <div className="dns-message" data-kind={event.kind}>
        <span>
          {event.recursive
            ? t('递归请求')
            : event.kind === 'query'
              ? t('迭代查询 · RD = 0')
              : event.kind === 'referral'
                ? t('返回转介')
                : t('返回地址')}
        </span>
        <strong>{event.text}</strong>
      </div>
      <div className="dns-cache">
        <div>
          <b>{t('解析器缓存')}</b>
          <span>t = {now} s</span>
        </div>
        {records.length ? (
          records.map((record) => (
            <p key={record.key} data-expired={dnsRemaining(record, now) === 0}>
              <code>{record.key}</code>
              <span>{dnsRemaining(record, now)} s</span>
            </p>
          ))
        ) : (
          <p>{t('尚无记录')}</p>
        )}
      </div>
      {!d.watch && (
        <div className="dns-controls">
          <label htmlFor={`${id}-age`}>
            {t('首次查询后经过')} · {age} s
          </label>
          <input
            id={`${id}-age`}
            type="range"
            min="0"
            max="120"
            value={age}
            onChange={(e) => {
              setAge(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-ttl`}>
            {t('地址记录 TTL')} · {ttl} s
          </label>
          <input
            id={`${id}-ttl`}
            type="range"
            min="0"
            max="120"
            step="10"
            value={ttl}
            onChange={(e) => {
              setTtl(+e.target.value);
              setStep(0);
            }}
          />
          <button aria-pressed={changed} onClick={() => setChanged(!changed)}>
            {t(changed ? '权威地址已改为 .9' : '把权威地址改为 .9')}
          </button>
          <label htmlFor={`${id}-step`}>
            {t('观察本次查询的消息')} · {Math.min(step + 1, run.events.length)} /{' '}
            {run.events.length}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={run.events.length - 1}
            value={Math.min(step, run.events.length - 1)}
            onChange={(e) => setStep(+e.target.value)}
          />
          <p>
            {t('上游查询数')}：{run.upstreamQueries} · {t('本次返回')} {run.address}
          </p>
        </div>
      )}
      <details>
        <summary>{t('模型边界')}</summary>
        <p>
          {t(
            '虚构域与文档地址；省略传输耗时、glue 地址查找、CNAME、负缓存、DNSSEC 与重试。TTL 是可缓存时限，不保证各缓存同时更新。',
          )}
        </p>
      </details>
    </section>
  );
}
