import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import {
  bloomBuild,
  bloomQuery,
  bloomFind,
  bloomPositions,
  bloomDeleteWitness,
  bloomApprox,
  BLOOM_WORDS,
} from '../../models/bloom-filter';
import '../../styles/bloom-filter.css';
const EXTRA = Array.from({ length: 13 }, (_, i) => `fruit${i}`);
export default function BloomFilter() {
  const d = useShowcase(),
    id = useId(),
    [input, setInput] = useState('apple, pear, plum'),
    [query, setQuery] = useState('apple'),
    [size, setSize] = useState(32),
    [hashes, setHashes] = useState(3);
  const c = d.watch ? Math.min(7, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1;
  const words = d.watch
    ? c === 0
      ? []
      : c === 1
        ? BLOOM_WORDS.slice(0, 1)
        : c === 2
          ? BLOOM_WORDS.slice(0, 2)
          : c === 6
            ? [...BLOOM_WORDS, ...EXTRA.slice(0, 5)]
            : c === 7
              ? [...BLOOM_WORDS, ...EXTRA.slice(0, Math.floor(p * 14))]
              : BLOOM_WORDS
    : input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 32);
  const key = words.join('\0'),
    filter = useMemo(
      () => bloomBuild(words, d.watch ? 32 : size, d.watch ? 3 : hashes),
      [key, d.watch, size, hashes],
    );
  const witness = c === 6 ? bloomDeleteWitness(filter) : undefined,
    visible = c === 6 && witness && p > 0.45 ? witness.broken : filter;
  const word = d.watch
    ? c <= 1
      ? 'apple'
      : c === 2
        ? 'pear'
        : c === 3
          ? 'apple'
          : c === 4
            ? bloomFind(filter, false)
            : c === 5
              ? bloomFind(filter, true)
              : c === 6
                ? (witness?.victim ?? 'apple')
                : 'item-0'
    : query;
  const result = bloomQuery(visible, word),
    positions = bloomPositions(word, filter.m, filter.k),
    revealed = c === 1 ? Math.min(3, Math.floor(p * 4)) : 3;
  const bits =
    c === 1
      ? filter.bits.map((b, i) => (positions.slice(0, revealed).includes(i) ? b : 0))
      : visible.bits;
  return (
    <section className="bloom-study" aria-label={t('布隆过滤器实验')} data-chapter={c}>
      <header>
        <span>BLOOM FILTER</span>
        <span>
          {filter.m} bit · {filter.k} hash
        </span>
      </header>
      <div className="bloom-key">
        <span>{t(c === 0 ? '空集合' : c === 6 ? '共享位的删除实验' : '当前键')}</span>
        <strong>{c === 0 ? '∅' : word}</strong>
        {c === 6 && witness && (
          <small>
            {t(p > 0.45 ? '已直接清除 {0} 的位' : '准备清除 {0} 的位', witness.removed)}
          </small>
        )}
      </div>
      <div className="bloom-hashes">
        {positions.map((pos, i) => (
          <div key={i} data-lit={c !== 0 && (c !== 1 || i < revealed)}>
            <span>h{i + 1}</span>
            <b>{pos}</b>
            <i>↓</i>
          </div>
        ))}
      </div>
      <div
        className="bloom-memory"
        style={{ gridTemplateColumns: 'repeat(8,minmax(0,1fr))' }}
        role="img"
        aria-label={t('按地址排列的真实位阵列')}
      >
        {bits.map((bit, i) => (
          <div
            key={i}
            data-on={!!bit}
            data-query={c !== 0 && positions.includes(i)}
            data-missing={c >= 4 && positions.includes(i) && !bit}
          >
            <b>{bit}</b>
            <small>{i}</small>
          </div>
        ))}
      </div>
      {c >= 3 && c <= 6 ? (
        <div className="bloom-verdict" data-negative={!result.maybe}>
          <b>{t(result.maybe ? '可能存在' : '确定不存在')}</b>
          <span>
            {t(
              c === 5
                ? '实际集合里没有这个键。'
                : c === 6 && p > 0.45
                  ? '清位误伤了另一个仍在集合里的键。'
                  : result.maybe
                    ? '所有检查位置都是 1。'
                    : '至少一个检查位置是 0。',
            )}
          </span>
        </div>
      ) : c === 7 ? (
        <div className="bloom-fill">
          <b>
            {filter.occupied} / {filter.m}
          </b>
          <span>{t('被置为 1 的位')}</span>
          <small>
            {t('独立均匀哈希近似误报率')} ≈{' '}
            {(bloomApprox(filter.m, filter.k, filter.items.length) * 100).toFixed(1)}%
          </small>
        </div>
      ) : (
        <p>
          {t(
            c === 0
              ? '位阵列不保存键的原文。'
              : c === 1
                ? '三个地址置 1；重复命中只留一个 1。'
                : '不同的键可以共享同一个位。',
          )}
        </p>
      )}
      {!d.watch && (
        <div className="bloom-controls">
          <label htmlFor={id}>{t('插入的键，用英文逗号分隔')}</label>
          <input id={id} value={input} maxLength={240} onChange={(e) => setInput(e.target.value)} />
          <label htmlFor={`${id}-query`}>{t('查询键')}</label>
          <input
            id={`${id}-query`}
            value={query}
            maxLength={40}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="bloom-buttons">
            <button onClick={() => setQuery(bloomFind(filter, true))}>
              {t('寻找一个真实误报')}
            </button>
            <button onClick={() => setQuery(bloomFind(filter, false))}>
              {t('寻找一个否定样例')}
            </button>
          </div>
          <label htmlFor={`${id}-size`}>
            {t('位阵列长度')} · {size}
          </label>
          <input
            type="range"
            id={`${id}-size`}
            min="16"
            max="64"
            step="8"
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          />
          <label htmlFor={`${id}-hashes`}>
            {t('哈希函数数量')} · {hashes}
          </label>
          <input
            type="range"
            id={`${id}-hashes`}
            min="1"
            max="5"
            value={hashes}
            onChange={(e) => setHashes(+e.target.value)}
          />
          <p>{t(result.actual ? '真实集合确认：键存在。' : '真实集合确认：键不存在。')}</p>
        </div>
      )}
      <footer>
        <details>
          <summary>{t('模型边界')}</summary>
          <p>{t('固定种子的教学哈希；基础布隆过滤器不支持直接清位删除。')}</p>
        </details>
      </footer>
    </section>
  );
}
