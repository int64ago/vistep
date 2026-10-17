import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  MERGE_VALUES,
  mergeSortTrace,
  mergeUnsortedWitness,
  type MergeItem,
} from '../../models/merge-sort';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/merge-sort.css';
export default function MergeSort() {
  const d = useShowcase(),
    id = useId(),
    [pattern, setPattern] = useState('mixed'),
    [pass, setPass] = useState(2),
    [merge, setMerge] = useState(0),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1;
  const values =
    d.watch || pattern === 'mixed'
      ? MERGE_VALUES
      : pattern === 'reverse'
        ? [8, 7, 6, 5, 4, 3, 2, 1]
        : [3, 3, 2, 3, 1, 2, 1, 3];
  const trace = mergeSortTrace(values),
    passIndex = d.watch ? (c === 2 ? 0 : c === 3 ? 1 : 2) : pass,
    chosenPass = trace.passes[passIndex];
  const invalid = d.watch && c === 5;
  const mergeIndex =
    d.watch && c === 2
      ? Math.min(chosenPass.merges.length - 1, Math.floor(p * chosenPass.merges.length))
      : Math.min(merge, chosenPass.merges.length - 1);
  const run = invalid ? mergeUnsortedWitness() : chosenPass.merges[mergeIndex];
  const local = d.watch && c === 2 ? (p >= 0.999999 ? 1 : (p * chosenPass.merges.length) % 1) : p;
  const frameIndex = d.watch
      ? c === 3
        ? p < 0.28
          ? 0
          : p < 0.78
            ? 1
            : 2
        : Math.min(run.frames.length - 1, Math.floor(local * run.frames.length))
      : Math.min(step, run.frames.length - 1),
    frame = run.frames[frameIndex];
  const leftIds = new Set(run.left.map((x) => x.id));
  const item = (x: MergeItem, head = false) => (
    <div
      key={x.id}
      className="merge-ticket"
      data-left={leftIds.has(x.id)}
      data-head={head}
      data-picked={frame.picked === x.id}
    >
      <strong>{x.value}</strong>
      <span>#{x.origin + 1}</span>
    </div>
  );
  return (
    <section className="merge-study" data-watch={d.watch} aria-label={t('稳定归并实验')}>
      <header>
        <span>MERGE / IDENTITY</span>
        <b>
          {t(
            c < 2 && d.watch
              ? '先拆成已排序的小段'
              : invalid
                ? '故意破坏有序前提'
                : '只比较两段的头部',
          )}
        </b>
      </header>
      {c < 2 && d.watch ? (
        <div className="merge-seed" data-singletons={c === 1}>
          {trace.input.map((x) => (
            <div key={x.id}>
              <strong>{x.value}</strong>
              <span>#{x.origin + 1}</span>
              {c === 1 && <i>{t('一项段')}</i>}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="merge-sources">
            <div>
              <h3>{t(invalid ? '左段已经乱序' : '左有序段')}</h3>
              <div className="merge-queue">
                {frame.left.length ? (
                  frame.left.map((x, i) => item(x, i === 0))
                ) : (
                  <span className="merge-empty">∅</span>
                )}
              </div>
              {frame.left.length > 2 && (
                <span className="merge-tail-count">
                  + {frame.left.length - 2} {t('随后露出')}
                </span>
              )}
            </div>
            <div>
              <h3>{t('右有序段')}</h3>
              <div className="merge-queue">
                {frame.right.length ? (
                  frame.right.map((x, i) => item(x, i === 0))
                ) : (
                  <span className="merge-empty">∅</span>
                )}
              </div>
              {frame.right.length > 2 && (
                <span className="merge-tail-count">
                  + {frame.right.length - 2} {t('随后露出')}
                </span>
              )}
            </div>
          </div>
          <div className="merge-flow">
            <span>↓</span>
            {t(
              invalid
                ? '只演示失效后果'
                : frame.side === 'left'
                  ? '本次取左段头部'
                  : frame.side === 'right'
                    ? '本次取右段头部'
                    : '先比较两个头部',
            )}
            <span>↓</span>
          </div>
          <div className="merge-output" aria-label={t('当前输出，编号保持原始身份')}>
            {frame.output.map((x) => item(x))}
            {Array.from({ length: run.result.length - frame.output.length }, (_, i) => (
              <div className="merge-empty-slot" key={`empty-${i}`} />
            ))}
          </div>
          <div className="merge-counter">
            <span>
              {t('本次头部比较')} {frame.comparisons}
            </span>
            <span>
              {t('输出')} {frame.output.length}/{run.result.length}
            </span>
          </div>
        </>
      )}
      {!d.watch && (
        <div className="merge-controls">
          <label htmlFor={`${id}-pattern`}>{t('输入顺序')}</label>
          <select
            id={`${id}-pattern`}
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setStep(0);
            }}
          >
            <option value="mixed">{t('混合与重复键')}</option>
            <option value="reverse">{t('倒序')}</option>
            <option value="duplicates">{t('更多重复键')}</option>
          </select>
          <label htmlFor={`${id}-pass`}>
            {t('待合并段长')} · {chosenPass.width}
          </label>
          <input
            id={`${id}-pass`}
            type="range"
            min="0"
            max="2"
            value={pass}
            onChange={(e) => {
              setPass(+e.target.value);
              setMerge(0);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-merge`}>
            {t('这一轮的合并')} · {mergeIndex + 1}/{chosenPass.merges.length}
          </label>
          <input
            id={`${id}-merge`}
            type="range"
            min="0"
            max={chosenPass.merges.length - 1}
            value={mergeIndex}
            onChange={(e) => {
              setMerge(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('逐项输出')} · {frameIndex}/{run.frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={run.frames.length - 1}
            value={frameIndex}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
      )}
      <details>
        <summary>{t('为什么只看头部？')}</summary>
        <p>
          {t(
            '每一段内部已经有序，所以两段中尚未输出的最小值必在某个头部。键相等时取左段，保持原始编号的先后；本模型用额外输出数组，不冒充原地归并。乱序反例被正式接口拒绝。',
          )}
        </p>
      </details>
    </section>
  );
}
