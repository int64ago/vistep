import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { LZ_TEXT, lzEncode, lzDecode, lzFrame, type LzToken } from '../../models/lz77';
import '../../styles/lz77.css';
const shown = (s: string) => (s === '_' ? '␣' : s);
const tokenText = (x: LzToken) =>
  x.kind === 'literal' ? shown(x.value) : `⟨${x.distance}, ${x.length}⟩`;
export default function Lz77() {
  const d = useShowcase(),
    id = useId(),
    [text, setText] = useState(LZ_TEXT),
    [window, setWindow] = useState(12),
    [selected, setSelected] = useState(0);
  const c = d.watch ? Math.min(7, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1;
  const run = useMemo(
    () =>
      lzEncode(
        d.watch ? (c === 5 ? 'ABABABABABAB' : LZ_TEXT) : text,
        d.watch ? (c === 6 ? 4 : 12) : window,
      ),
    [d.watch, c, text, window],
  );
  const firstMatch = run.tokens.findIndex((x) => x.kind === 'match'),
    index = d.watch
      ? c === 2 || c === 3
        ? Math.max(0, firstMatch)
        : c === 5
          ? 2
          : Math.min(run.tokens.length - 1, Math.floor(p * run.tokens.length))
      : Math.min(selected, run.tokens.length - 1);
  const token = run.tokens[Math.max(0, index)],
    copied = token ? Math.floor(p * (token.length + 1)) : 0,
    frame = lzFrame(run, Math.max(0, index), c === 4 || c === 5 ? copied : 0),
    at = token?.at ?? 0;
  const start = Math.max(0, at - run.window),
    end = Math.min(run.chars.length, at + Math.max(8, token?.length ?? 1));
  return (
    <section className="lz-study" aria-label={t('LZ77 滑动窗口实验')} data-chapter={c}>
      <header>
        <span>LZ77</span>
        <span>{t('向后找，逐字回抄')}</span>
      </header>
      {c === 7 ? (
        <div className="lz-summary">
          <div className="lz-summary-message">{run.chars.map(shown).join('')}</div>
          <div className="lz-summary-tokens">
            {run.tokens.map((x, i) => (
              <code key={i} data-match={x.kind === 'match'}>
                {tokenText(x)}
              </code>
            ))}
          </div>
          <div className="lz-count">
            <b>
              {run.chars.length}
              <small>{t('个原字符')}</small>
            </b>
            <i>→</i>
            <b>
              {run.tokens.length}
              <small>{t('个令牌')}</small>
            </b>
          </div>
          <p>{t('令牌长度不同；更少令牌不等于同样比例的文件大小。')}</p>
        </div>
      ) : (
        <>
          <div className="lz-window-key">
            <span>
              {t('已出现的历史')}
              <b>{c === 0 ? '—' : `${start}…${Math.max(start, at - 1)}`}</b>
            </span>
            <span>
              {t('待编码')}
              <b>{at}…</b>
            </span>
          </div>
          <div className="lz-tape" role="img" aria-label={t('字符位置与滑动窗口')}>
            {(c === 0 ? run.chars : run.chars.slice(start, end)).map((ch, j) => {
              const i = c === 0 ? j : j + start;
              return (
                <div
                  key={i}
                  data-history={i < at}
                  data-current={i === at}
                  data-source={
                    token?.kind === 'match' &&
                    i >= at - token.distance &&
                    i < at - token.distance + token.length
                  }
                  data-target={token?.kind === 'match' && i >= at && i < at + token.length}
                >
                  <small>{i}</small>
                  <b>{shown(ch)}</b>
                </div>
              );
            })}
          </div>
          {(c === 2 || c === 3 || c === 5) && token?.kind === 'match' && (
            <div className="lz-reference">
              <div>
                <span>{t('向后距离')}</span>
                <b>{token.distance}</b>
              </div>
              <i>↶</i>
              <div>
                <span>{t('复制长度')}</span>
                <b>{token.length}</b>
              </div>
            </div>
          )}
          {c === 1 && (
            <div className="lz-window-rule">
              <strong>{run.window}</strong>
              <span>{t('字符的历史窗口；指针只向后引用。')}</span>
            </div>
          )}
          {c === 3 && (
            <div className="lz-issued">
              <span>{t('输出引用')}</span>
              <code>{token ? tokenText(token) : '∅'}</code>
              <p>{t('二元组顺序：距离、长度；字符不再逐个发出。')}</p>
            </div>
          )}
          {(c === 4 || c === 5) && (
            <div className="lz-copy">
              <div className="lz-copy-heading">
                <span>{t('解码器已经写下')}</span>
                <b>
                  {Array.from(frame.history).length} / {run.chars.length}
                </b>
              </div>
              <div className="lz-output">
                {Array.from(frame.history).map((s, i) => (
                  <span key={i} data-new={i >= at} data-source={i === frame.source}>
                    {shown(s)}
                  </span>
                ))}
              </div>
              <p>
                {t(
                  c === 5
                    ? '新写出的字符，马上也能成为下一次回抄的来源。'
                    : '解码器从已有输出取字，不需要看到未来的原文。',
                )}
              </p>
            </div>
          )}
          {c === 6 && (
            <div className="lz-expired">
              <b>{t('窗口缩到 4 字符')}</b>
              <div>
                {lzEncode(LZ_TEXT, 4).tokens.map((x, i) => (
                  <code key={i} data-match={x.kind === 'match'}>
                    {tokenText(x)}
                  </code>
                ))}
              </div>
              <p>{t('太远的重复已经滑出窗口，只能重新写。')}</p>
            </div>
          )}
          {c === 0 && <p>{t('ABRA 重新出现时，必须再写一遍吗？')}</p>}
          {c === 2 && <p>{t('匹配必须逐字相同；从所有合法距离选最长匹配。')}</p>}
        </>
      )}
      {!d.watch && (
        <div className="lz-controls">
          <label htmlFor={id}>{t('要压缩的消息')}</label>
          <input
            id={id}
            maxLength={60}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSelected(0);
            }}
          />
          <label htmlFor={`${id}-window`}>
            {t('历史窗口长度')} · {window}
          </label>
          <input
            id={`${id}-window`}
            type="range"
            min="1"
            max="32"
            value={window}
            onChange={(e) => {
              setWindow(+e.target.value);
              setSelected(0);
            }}
          />
          <label htmlFor={`${id}-token`}>{t('查看哪个令牌')}</label>
          <input
            id={`${id}-token`}
            type="range"
            min="0"
            max={Math.max(0, run.tokens.length - 1)}
            value={Math.max(0, index)}
            onChange={(e) => setSelected(+e.target.value)}
          />
          <div className="lz-manual-tokens">
            {run.tokens.map((x, i) => (
              <button key={i} aria-pressed={i === index} onClick={() => setSelected(i)}>
                {tokenText(x)}
              </button>
            ))}
          </div>
          <p>
            {t('真实还原')}：{lzDecode(run.tokens).replaceAll('_', '␣') || '∅'}
          </p>
        </div>
      )}
      <footer>
        <details>
          <summary>{t('模型边界')}</summary>
          <p>{t('教学令牌流；最短匹配 3，最长 18。不是完整 DEFLATE 文件。')}</p>
        </details>
      </footer>
    </section>
  );
}
