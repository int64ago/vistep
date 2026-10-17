import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { rleDecode, rleEncode, rleHex, rlePattern } from '../../models/run-length-encoding';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/run-length-encoding.css';
const colors = ['#e8dfbd', '#577879', '#bd8a5c', '#85966d'];
const boundaries = [127, 128].map((count) => ({
  count,
  encoded: rleEncode(new Uint8Array(count)),
}));
export default function RunLengthEncoding() {
  const d = useShowcase(),
    id = useId(),
    [pattern, setPattern] = useState<'bands' | 'vertical' | 'checker' | 'flat'>('bands'),
    [x, setX] = useState(3),
    [y, setY] = useState(3),
    [flipped, setFlipped] = useState(false);
  const c = d.watch ? Math.min(5, d.chapter) : 2,
    p = d.watch ? d.chapterProgress : 1,
    name = d.watch ? (c === 4 ? 'vertical' : 'bands') : pattern,
    pixels = useMemo(() => {
      const data = rlePattern(name);
      if (!d.watch && flipped) data[y * 8 + x] = (data[y * 8 + x] + 1) % 4;
      return data;
    }, [name, d.watch, flipped, x, y]),
    q = useMemo(() => rleEncode(pixels), [pixels]),
    scan = Math.min(63, Math.floor(p * 64)),
    active = q.runs.find((run) => scan >= run.start && scan < run.end)!,
    decodedRuns = Math.min(q.runs.length, 1 + Math.floor(p * q.runs.length)),
    decoded =
      d.watch && c === 3
        ? rleDecode(
            q.bytes.slice(0, q.runs[decodedRuns - 1].offset + q.runs[decodedRuns - 1].bytes.length),
          )
        : pixels;
  return (
    <section
      className="rle-study"
      data-watch={d.watch}
      aria-label={t('游程编码与真实字节格式实验')}
    >
      <header>
        <span>RLE / BYTE RUNS</span>
        <b>{t('自定义 R1 字节格式')}</b>
      </header>
      {d.watch && c === 5 ? (
        <div className="rle-boundary">
          {boundaries.map(({ count, encoded }) => (
            <article key={count}>
              <h3>
                {count} {t('个相同字节')}
              </h3>
              <code>{rleHex(encoded.bytes)}</code>
              <p>
                {t('实际编码')} <strong>{encoded.bytes.length}</strong> B
              </p>
            </article>
          ))}
          <p>{t('计数从 7f 变为 80 01，多用一个字节。')}</p>
        </div>
      ) : (
        <>
          <div className="rle-work">
            <div className="rle-bitmap" role="img" aria-label={t('八乘八字节像素，按行遍历')}>
              {Array.from({ length: 64 }, (_, i) => (
                <i
                  key={i}
                  style={{ background: decoded[i] === undefined ? '#d7d1bf' : colors[decoded[i]] }}
                  data-active={d.watch && c === 1 && i === scan}
                  data-read={d.watch && c === 1 && i <= scan}
                />
              ))}
            </div>
            {d.watch && c === 1 ? (
              <div className="rle-scan">
                <span>
                  {t('当前位置')} {scan + 1}/64
                </span>
                <b>
                  {t('字节值')} {active.value}
                </b>
                <strong>
                  {t('连续计数')} {scan - active.start + 1}
                </strong>
              </div>
            ) : c >= 2 || !d.watch ? (
              <div className="rle-packets">
                <span>{t('次数 × 字节值')}</span>
                <div>
                  {q.runs.slice(0, d.watch && c === 4 ? 2 : 4).map((run, i) => (
                    <b key={run.start} data-decoded={d.watch && c === 3 && i < decodedRuns}>
                      <i style={{ background: colors[run.value] }} />
                      {run.count} × {run.value}
                    </b>
                  ))}
                </div>
                {q.runs.length > 4 && (
                  <p>{t('另有 {0} 段', q.runs.length - (d.watch && c === 4 ? 2 : 4))}</p>
                )}
                {c === 3 && d.watch && (
                  <p>
                    {t('已展开')} {decoded.length}/64
                  </p>
                )}
              </div>
            ) : (
              <p className="rle-first">{t('每像素一个字节，共 64 字节。')}</p>
            )}
          </div>
          <div className="rle-size">
            <span>
              {t('原始字节')} <b>{pixels.length}</b> B
            </span>
            {(c >= 2 || !d.watch) && (
              <span data-expanded={q.bytes.length > pixels.length}>
                {t('R1 编码')} <b>{q.bytes.length}</b> B
              </span>
            )}
          </div>
          {(c >= 2 || !d.watch) && (
            <p className="rle-header-note">{t('2 字节头 +（变长计数，1 字节值）')}</p>
          )}
        </>
      )}
      {!d.watch && (
        <div className="rle-controls">
          <label htmlFor={`${id}-pattern`}>{t('像素排列')}</label>
          <select
            id={`${id}-pattern`}
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value as typeof pattern);
              setFlipped(false);
            }}
          >
            <option value="bands">{t('四块长色带')}</option>
            <option value="vertical">{t('细竖纹')}</option>
            <option value="checker">{t('棋盘格')}</option>
            <option value="flat">{t('单色')}</option>
          </select>
          <label htmlFor={`${id}-x`}>x · {x}</label>
          <input
            id={`${id}-x`}
            type="range"
            min="0"
            max="7"
            value={x}
            onChange={(e) => setX(+e.target.value)}
          />
          <label htmlFor={`${id}-y`}>y · {y}</label>
          <input
            id={`${id}-y`}
            type="range"
            min="0"
            max="7"
            value={y}
            onChange={(e) => setY(+e.target.value)}
          />
          <button aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
            {t('切换所选单格扰动')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('这里的字节数，不是 PNG 或 BMP 文件大小')}</summary>
        <p>
          {t(
            'R1 由 52 31 格式头和若干“无符号 LEB128 正计数、单字节值”组成，要求最短计数编码。基础表示每像素 1 字节，未做位打包；调色板与图像尺寸由双方事先约定。这里精确比较该表示，不声称最优压缩或标准图片格式大小。按字节而非 Unicode 字符计数，完整解码限制 4096 字节，也不提供校验和。',
          )}
        </p>
        <code className="rle-full">{rleHex(q.bytes)}</code>
      </details>
    </section>
  );
}
