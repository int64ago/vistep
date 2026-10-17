import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  CONV_KERNEL,
  convolutionInput,
  convolutionTerms,
  correlationWindow,
  discreteConvolution,
  type ConvMode,
} from '../../models/convolution';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/convolution.css';
const fmt = (v: number) => String(Math.round(v * 1e4) / 1e4),
  short = (v: number) => fmt(v).replace(/^0\./, '.');
export default function Convolution() {
  const d = useShowcase(),
    id = useId(),
    [pattern, setPattern] = useState<'pulse' | 'impulse' | 'edge'>('pulse'),
    [decay, setDecay] = useState(0.5),
    [mode, setMode] = useState<ConvMode>('full'),
    [cursor, setCursor] = useState(3);
  const c = d.watch ? Math.min(6, d.chapter) : 2,
    p = d.watch ? d.chapterProgress : 1,
    input = convolutionInput(d.watch ? (c === 0 ? 'impulse' : c >= 5 ? 'edge' : 'pulse') : pattern),
    kernel = d.watch ? CONV_KERNEL : [1, decay, decay * decay],
    full = discreteConvolution(input, kernel),
    corr = correlationWindow(input, kernel),
    out = discreteConvolution(input, kernel, d.watch ? (c === 6 ? 'circular' : 'full') : mode),
    n = d.watch
      ? c === 0
        ? Math.min(4, 2 + Math.floor(p * 3))
        : c === 1
          ? 2
          : c === 2
            ? 3
            : c === 3
              ? Math.min(8, Math.floor(p * 9))
              : c === 4
                ? 2
                : c === 5
                  ? p < 0.5
                    ? 7
                    : 8
                  : p < 0.5
                    ? 0
                    : 1
      : Math.min(cursor, out.length - 1),
    terms = convolutionTerms(
      input,
      kernel,
      n,
      (!d.watch && mode === 'circular') || (d.watch && c === 6),
    ),
    scale = Math.max(3, ...full, ...corr),
    flipped = !d.watch || c !== 1 || p >= 0.35;
  const bars = (
    values: readonly number[],
    which: 'input' | 'output' | 'correlation',
    crop = false,
  ) => (
    <div
      className="conv-samples"
      style={{ gridTemplateColumns: `repeat(${values.length},minmax(0,1fr))` }}
    >
      {values.map((value, i) => (
        <div
          key={i}
          data-active={which === 'input' ? terms.terms.some((term) => term.index === i) : i === n}
          data-cropped={crop && i >= input.length}
        >
          <div>
            <i
              style={{ height: `${(Math.max(0, value) / scale) * 76}px` }}
              data-hidden={d.watch && c === 3 && which === 'output' && i > n}
            />
          </div>
          <span>{i}</span>
        </div>
      ))}
    </div>
  );
  return (
    <section
      className="conv-study"
      data-watch={d.watch}
      data-playing={d.playing}
      aria-label={t('离散卷积的翻转、相乘与相加')}
    >
      <header>
        <span>CONVOLUTION / ALIGN</span>
        <b>
          h = [1, {short(kernel[1])}, {short(kernel[2])}]
        </b>
      </header>
      <div className="conv-input">
        <span>{t('输入')} x[i]</span>
        {bars(input, 'input')}
        {(c === 1 || c === 2 || !d.watch) && (
          <div className="conv-kernel">
            {terms.terms
              .filter((term) => term.index !== null)
              .map((term) => (
                <div
                  key={term.k}
                  style={{
                    left: `${(((flipped ? term.index! : term.k) + 0.5) / input.length) * 100}%`,
                  }}
                >
                  <b>{short(term.weight)}</b>
                  <span>k={term.k}</span>
                </div>
              ))}
          </div>
        )}
      </div>
      {c === 1 && d.watch ? (
        <p className="conv-alignment">
          {t(flipped ? '翻转后，按 n−k 对齐输入。' : '先看原核 k=0、1、2 的顺序。')}
        </p>
      ) : c === 2 || !d.watch ? (
        <>
          <div className="conv-products">
            {terms.terms.map((term) => (
              <div key={term.k}>
                <span>{term.index === null ? t('界外补零') : `x[${term.index}]`}</span>
                <b>
                  {fmt(term.value)} × {short(term.weight)}
                </b>
                <strong>{fmt(term.product)}</strong>
              </div>
            ))}
          </div>
          <p className="conv-sum">
            y[{n}] = <b>{fmt(terms.sum)}</b>
          </p>
        </>
      ) : null}
      {d.watch && c === 4 ? (
        <div className="conv-contrast">
          <p>
            {t('卷积')} · y[2]={fmt(full[2])}
          </p>
          {bars(full.slice(0, input.length), 'output')}
          <p>
            {t('前向相关')} · r[2]={fmt(corr[2])}
          </p>
          {bars(corr, 'correlation')}
        </div>
      ) : !d.watch || c === 0 || c === 3 || c >= 5 ? (
        <div className="conv-output">
          <p>
            {t(
              c === 6 || (!d.watch && mode === 'circular')
                ? '循环边界'
                : !d.watch && mode === 'causal-same'
                  ? '前 N 项输出'
                  : '完整输出',
            )}{' '}
            · y[{n}]={fmt(out[n])}
          </p>
          {bars(out, 'output', c === 5)}
          {c === 5 && <p>{t('只保留前 7 项，会舍弃尾部 0.5、0.25。')}</p>}
          {c === 6 && <p>y[7] → y[0] · y[8] → y[1]</p>}
        </div>
      ) : null}
      {!d.watch && (
        <div className="conv-controls">
          <label htmlFor={`${id}-pattern`}>{t('输入形状')}</label>
          <select
            id={`${id}-pattern`}
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value as typeof pattern);
              setCursor(3);
            }}
          >
            <option value="pulse">{t('组合脉冲')}</option>
            <option value="impulse">{t('单个单位脉冲')}</option>
            <option value="edge">{t('末端单位脉冲')}</option>
          </select>
          <label htmlFor={`${id}-decay`}>
            {t('响应衰减')} · {decay}
          </label>
          <input
            id={`${id}-decay`}
            type="range"
            min="0.1"
            max="0.9"
            step="0.1"
            value={decay}
            onChange={(e) => setDecay(+e.target.value)}
          />
          <label htmlFor={`${id}-mode`}>{t('边界与截取')}</label>
          <select
            id={`${id}-mode`}
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as ConvMode);
              setCursor(0);
            }}
          >
            <option value="full">{t('完整零延拓')}</option>
            <option value="causal-same">{t('零延拓后取前 N 项')}</option>
            <option value="circular">{t('周期循环')}</option>
          </select>
          <label htmlFor={`${id}-n`}>
            {t('输出索引')} · {n}
          </label>
          <input
            id={`${id}-n`}
            type="range"
            min="0"
            max={out.length - 1}
            value={n}
            onChange={(e) => setCursor(+e.target.value)}
          />
        </div>
      )}
      <details>
        <summary>{t('非对称核能看出卷积与相关的区别')}</summary>
        <p>
          {t(
            '卷积 y[n]=Σh[k]x[n−k]；这里的实值前向相关 r[n]=Σh[k]x[n+k]。核不对称，所以两者不同。响应未做归一化，直流增益为权重和；只展示非负输入和核。完整零延拓长度 N+M−1，“前 N 项”是明确的因果截取，循环边界假设输入周期延拓，三者不能混称同一种 same。',
          )}
        </p>
      </details>
    </section>
  );
}
