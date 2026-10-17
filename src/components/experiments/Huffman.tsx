import { useMemo, useState, useId, useRef, useEffect } from 'react';
import { t } from '../../i18n';
import { huffman, huffmanLayout, HUFFMAN_TEXT, type HuffmanNode } from '../../models/huffman';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/huffman.css';
export default function Huffman() {
  const d = useShowcase(),
    id = useId(),
    [input, setInput] = useState(HUFFMAN_TEXT),
    [step, setStep] = useState(0),
    treeViewport = useRef<HTMLDivElement>(null);
  const run = useMemo(() => huffman(d.watch ? HUFFMAN_TEXT : input), [d.watch, input]);
  const c = d.watch ? Math.min(7, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1;
  const merge = Math.min(run.merges.length - 1, Math.floor(p * run.merges.length));
  const current = run.merges[Math.max(0, merge)],
    layout = huffmanLayout(run.root);
  const bitCount =
    c === 5 ? Math.min(run.bits.length, Math.floor(p * (run.bits.length + 1))) : run.bits.length;
  let node: HuffmanNode | undefined = run.root,
    decoded = '',
    path = '';
  for (const bit of run.bits.slice(0, bitCount)) {
    path += bit;
    if (node?.symbol === undefined) node = bit === '0' ? node?.left : node?.right;
    if (node?.symbol !== undefined) {
      decoded += node.symbol;
      node = run.root;
      path = '';
    }
  }
  const focus =
    c === 3
      ? 'A'
      : c === 5
        ? undefined
        : run.symbols[
            Math.min(run.symbols.length - 1, d.watch ? Math.floor(p * run.symbols.length) : step)
          ];
  const focusPath = c === 5 ? path : (run.codes[focus ?? ''] ?? '');
  const expanded = run.leaves.length > 6,
    treeDepth = Math.max(0, ...Object.values(run.codes).map((code) => code.length));
  useEffect(() => {
    const viewport = treeViewport.current;
    if (!viewport || !expanded) return;
    const leaf = viewport.querySelector<HTMLElement>('[data-tracked="true"]');
    if (!leaf) return;
    const view = viewport.getBoundingClientRect(),
      item = leaf.getBoundingClientRect();
    viewport.scrollLeft += item.left - view.left - view.width / 2 + item.width / 2;
  }, [focus, expanded, input]);
  return (
    <section className="huff-study" aria-label={t('哈夫曼编码实验')} data-chapter={c}>
      <header>
        <span>HUFFMAN</span>
        <span>{t('同一消息 · 无损还原')}</span>
      </header>
      {c === 0 || c === 1 || c === 7 ? (
        <div className="huff-frequency">
          <div className="huff-message">
            {run.symbols.map((s, i) => (
              <span key={i} data-active={s === 'A' && (c !== 0 || i <= p * run.symbols.length)}>
                {s === '_' ? '␣' : s}
              </span>
            ))}
          </div>
          <div className="huff-bars">
            {run.leaves.map((n) => (
              <div key={n.id}>
                <b>{n.symbol === '_' ? '␣' : n.symbol}</b>
                <i style={{ height: `${(n.weight / run.symbols.length) * 210 + 16}px` }} />
                <span>{n.weight}</span>
                <code>{c === 7 ? run.codes[n.symbol!] : ''}</code>
              </div>
            ))}
          </div>
          <p>
            {t(
              c === 0
                ? '同一个字母，每次都占三位？'
                : c === 1
                  ? '出现越多，缩短一位就省得越多。'
                  : '频数变了，最合适的码树也会改变。',
            )}
          </p>
        </div>
      ) : c === 2 ? (
        <div className="huff-merge">
          <span>{t('每次取出最轻的两个')}</span>
          <div className="huff-forest">
            {current?.forest.map((n) => (
              <div key={n.id} data-active={n.id === current.left || n.id === current.right}>
                <strong>{n.symbol ?? '∑'}</strong>
                <b>{n.weight}</b>
              </div>
            ))}
          </div>
          {current && (
            <div className="huff-add">
              {current.parent.left!.weight} + {current.parent.right!.weight}
              <i>↓</i>
              <strong>{current.parent.weight}</strong>
            </div>
          )}
          <div className="huff-merge-dots">
            {run.merges.map((_, i) => (
              <i key={i} data-active={i <= merge} />
            ))}
          </div>
        </div>
      ) : c === 6 ? (
        <div className="huff-account">
          <p>{t('只比较消息本体的位数')}</p>
          <div>
            <span>{t('等长编码')}</span>
            <i style={{ width: '100%' }} />
            <b>{run.fixedBits} bit</b>
          </div>
          <div>
            <span>Huffman</span>
            <i style={{ width: `${(run.bits.length / Math.max(1, run.fixedBits)) * 100}%` }} />
            <b>{run.bits.length} bit</b>
          </div>
          <p>{t('还要传码表、边界与格式；这不是完整文件大小。')}</p>
        </div>
      ) : (
        <>
          <div
            className="huff-tree-scroll"
            ref={treeViewport}
            tabIndex={expanded ? 0 : undefined}
            aria-label={expanded ? t('哈夫曼编码实验') : undefined}
          >
            <div
              className="huff-tree"
              style={
                expanded
                  ? {
                      width: `${run.leaves.length * 80}px`,
                      height: `${Math.max(285, treeDepth * 72)}px`,
                    }
                  : undefined
              }
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {layout
                  .filter((n) => n.path)
                  .map((n) => {
                    const parent = layout.find((a) => a.path === n.path.slice(0, -1))!;
                    return (
                      <path
                        key={n.node.id}
                        d={`M${parent.x} ${parent.y} L${n.x} ${n.y}`}
                        data-active={focusPath.startsWith(n.path)}
                      />
                    );
                  })}
              </svg>
              {layout.map((n) => (
                <div
                  className="huff-node"
                  key={n.node.id}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  data-leaf={n.node.symbol !== undefined}
                  data-tracked={n.node.symbol !== undefined && n.node.symbol === focus}
                  data-active={focusPath.startsWith(n.path)}
                >
                  <b>
                    {n.node.symbol === undefined
                      ? n.node.weight
                      : n.node.symbol === '_'
                        ? '␣'
                        : n.node.symbol}
                  </b>
                  {n.node.symbol !== undefined && <code>{run.codes[n.node.symbol]}</code>}
                  {n.path && <em>{n.path.at(-1)}</em>}
                </div>
              ))}
            </div>
          </div>
          <div className="huff-code-tape">
            {c === 5 ? (
              <>
                <code>
                  {run.bits.slice(0, bitCount)}
                  <mark>{run.bits[bitCount] ?? ''}</mark>
                </code>
                <strong>{decoded.replaceAll('_', '␣') || '·'}</strong>
              </>
            ) : (
              <>
                <b>{focus === '_' ? '␣' : focus}</b>
                <i>→</i>
                <code>{run.codes[focus ?? '']}</code>
              </>
            )}
          </div>
          <p>
            {t(
              c === 3
                ? '左边写 0，右边写 1；A 只需走一步。'
                : c === 4
                  ? '叶子才是字母，任何码字都不是另一个的开头。'
                  : '每走到叶子，输出字母，再回根继续。',
            )}
          </p>
        </>
      )}
      {!d.watch && (
        <div className="huff-controls">
          <label htmlFor={id}>{t('输入消息，重新构造码树')}</label>
          <input
            id={id}
            value={input}
            maxLength={40}
            onChange={(e) => {
              setInput(e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-symbol`}>{t('追踪第几个字符')}</label>
          <input
            id={`${id}-symbol`}
            type="range"
            min="0"
            max={Math.max(0, run.symbols.length - 1)}
            value={Math.min(step, Math.max(0, run.symbols.length - 1))}
            onChange={(e) => setStep(+e.target.value)}
          />
          <p>{t('按 Unicode 字符计数；不含码表开销，单一字符使用码字 0。')}</p>
        </div>
      )}
    </section>
  );
}
