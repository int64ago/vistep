import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  QR_MESSAGE,
  qrBits,
  qrEncode,
  qrHex,
  qrShot,
  qrSvg,
  qrTracked,
  type QrEncoding,
} from '../../models/qr-code';
import { useShowcase } from '../lab/Showcase';
import QrCodeMatrix from '../lab/QrCodeMatrix';
import '../../styles/qr-code.css';

const titles = [
  '从网址，追踪一个 v',
  '先告诉读者怎样读',
  '再算七个校验码字',
  '先留出方向与尺度',
  '两列一组，把位放进去',
  '八种掩码，逐一比较',
  '把解码说明写在两处',
  '现在，它可以被扫描',
];
const fieldNames: Record<string, string> = {
  'eci-mode': 'ECI 模式',
  eci: 'UTF-8 声明',
  'byte-mode': '字节模式',
  count: '字节数',
  payload: '消息内容',
  terminator: '终止',
  align: '校正图形',
  pad: '填充',
};
function currentLine(chapter: number, p: number) {
  if (chapter === 0)
    return p < 0.4
      ? t('网址中的 v，变成字节 118，再拆成八个位。')
      : t('始终跟随 v 的第二个高位：它的原始值是 1。');
  if (chapter === 1)
    return p < 0.55
      ? t('0100 声明字节模式；长度字段写的是 17 个字节。')
      : t('网址正好填满容量；短消息才需要交替补入 EC、11。');
  if (chapter === 2) return t('19 个数据码字参与 GF(256) 运算，得到 7 个 RS 校验码字。');
  if (chapter === 3)
    return p < 1 / 3
      ? t('三个定位图形给出方向；外侧白色隔离带不放数据。')
      : p < 2 / 3
        ? t('交替的时序格建立网格尺度；第一版没有校正图形。')
        : t('格式信息提前留位；总共还剩 208 格放数据与校验。');
  if (chapter === 4) return t('从右下开始上下折返；跳过功能格，每个位置只放一位。');
  if (chapter === 5) return t('只对数据区做可逆异或；比较连串、方块、仿定位纹与明暗比例。');
  if (chapter === 6) return t('L 等级与掩码编号加上 BCH 校验，写成两份 15 位格式信息。');
  return p < 0.38
    ? t('读出掩码后可还原这一位；白格也可能来自原始的 1。')
    : t('保留黑白对比和四格静区；扫码读到 https://vistep.ai。');
}
function CodewordStrip({
  qr,
  current = -1,
  trackedByte = 8,
}: {
  qr: QrEncoding;
  current?: number;
  trackedByte?: number;
}) {
  return (
    <div className="qr-codeword-strip">
      {qr.stream.codewords.map((v, i) => (
        <span
          key={i}
          data-active={i === current}
          data-tracked={
            i ===
              Math.floor(
                (qr.stream.payloadStart + Math.min(trackedByte, qr.payload.length - 1) * 8) / 8,
              ) ||
            i ===
              Math.floor(
                (qr.stream.payloadStart + Math.min(trackedByte, qr.payload.length - 1) * 8 + 7) / 8,
              )
          }
        >
          <small>{i + 1}</small>
          <b>{qrHex(v)}</b>
        </span>
      ))}
    </div>
  );
}
function ByteOrigin({ qr, p }: { qr: QrEncoding; p: number }) {
  const index = 8,
    value = qr.payload[index],
    reveal = Math.min(8, Math.floor(p * 14));
  return (
    <div className="qr-origin">
      <div className="qr-url-type">
        https://<mark>v</mark>istep.ai
      </div>
      <div className="qr-byte-portrait">
        <span>v</span>
        <div>
          <b>{value}</b>
          <span>{t('十进制字节值')}</span>
          <code>0x{qrHex(value)}</code>
        </div>
      </div>
      <div className="qr-eight-bits">
        {qrBits(value).map((b, i) => (
          <span key={i} data-tracked={i === 1} data-revealed={i < reveal}>
            <small>b{7 - i}</small>
            <b>{i < reveal ? b : '·'}</b>
          </span>
        ))}
      </div>
      <div className="qr-origin-note">
        <span>{t('字节 9 · 位 b6')}</span>
        <strong>
          v → 0x76 → <mark>1</mark>
        </strong>
      </div>
    </div>
  );
}
function StreamSheet({ qr, p }: { qr: QrEncoding; p: number }) {
  const short = useMemo(() => qrEncode('vistep.ai'), []),
    visible = Math.min(4, 1 + Math.floor(p * 5));
  const parts = [
    qr.stream.fields[0],
    qr.stream.fields[1],
    null,
    qr.stream.fields.find((f) => f.kind === 'terminator')!,
  ];
  return (
    <div className="qr-stream-sheet">
      <div className="qr-stream-fields">
        {parts.map((field, i) => (
          <div key={i} data-revealed={i < visible}>
            <span>{t(field ? fieldNames[field.kind] : '消息内容')}</span>
            <code>{i >= visible ? '·' : field ? field.bits.join('') : '17 × 8'}</code>
            <small>
              {i === 0 ? '4' : i === 1 ? '8' : i === 2 ? '136' : '4'} {t('位')}
            </small>
          </div>
        ))}
      </div>
      <div className="qr-stream-total">
        <b>152 {t('位')}</b>
        <span>19 × 8</span>
      </div>
      <CodewordStrip qr={qr} current={9} />
      <div className="qr-padding-compare" data-revealed={p >= 0.55}>
        <span>{t('短消息对照')}</span>
        <code>vistep.ai</code>
        <div>
          {short.stream.fields
            .filter((f) => f.kind === 'pad')
            .map((field, i) => (
              <b key={i}>{qrHex(parseInt(field.bits.join(''), 2))}</b>
            ))}
        </div>
        <p>{t('补齐容量的填充，不是网址的一部分。')}</p>
      </div>
    </div>
  );
}
function RsSheet({ qr, step }: { qr: QrEncoding; step: number }) {
  const state = qr.rs.steps[step];
  return (
    <div className="qr-rs-sheet">
      <div className="qr-rs-heading">
        <span>{t('逐个处理数据码字')}</span>
        <b>{step + 1} / 19</b>
      </div>
      <CodewordStrip qr={qr} current={step} />
      <div className="qr-polynomial">
        <span>{qrHex(state.input)}</span>
        <div>
          <b>GF(256)</b>
          <code>x⁸ + x⁴ + x³ + x² + 1</code>
        </div>
        <span>↘</span>
      </div>
      <p>{t(step === 18 ? '最终 RS 校验码字' : '处理到此处的七字节余数')}</p>
      <div className="qr-remainders">
        {state.remainder.map((v, i) => (
          <span key={i}>
            <small>R{i + 1}</small>
            <b>{qrHex(v)}</b>
          </span>
        ))}
      </div>
      <div className="qr-rs-contract">
        <b>19 + 7 = 26</b>
        <span>{t('一个纠错块，共 208 位')}</span>
      </div>
      <p className="qr-quiet-copy">{t('这些是整块数据算出的关系，不是某个字节的备份。')}</p>
    </div>
  );
}
function MaskChoices({ qr, current }: { qr: QrEncoding; current: number }) {
  const scores = qr.candidates[current].penalty;
  return (
    <div className="qr-mask-reason">
      <div className="qr-mask-options">
        {qr.candidates.map((c) => (
          <div key={c.mask} data-current={c.mask === current} data-best={c.mask === qr.best}>
            <span>M{c.mask}</span>
            <b>{c.penalty.total}</b>
            {c.mask === qr.best && <i aria-label={t('最低评分')}>✓</i>}
          </div>
        ))}
      </div>
      <p>
        <span>{t('当前评分')}</span>
        <b>
          {scores.runs} + {scores.blocks} + {scores.finders} + {scores.balance} = {scores.total}
        </b>
      </p>
    </div>
  );
}
function BitReceipt({
  qr,
  byteIndex = 8,
  bitIndex = 1,
}: {
  qr: QrEncoding;
  byteIndex?: number;
  bitIndex?: number;
}) {
  const bit = qrTracked(qr, byteIndex, bitIndex)!;
  return (
    <div className="qr-bit-receipt">
      <span>{t('字节 {0} · 位 b{1}', bit.byteIndex + 1, 7 - bit.bitIndex)}</span>
      <code>
        {t('原始')} {bit.raw} ⊕ {t('掩码')} {bit.mask} = {t('印出')} {bit.printed}
      </code>
      <span>
        {t('模块坐标')} ({bit.x}, {bit.y})
      </span>
    </div>
  );
}

export default function QrCode() {
  const director = useShowcase(),
    id = useId();
  const [text, setText] = useState(QR_MESSAGE),
    [mask, setMask] = useState(-1),
    [byteIndex, setByteIndex] = useState(8),
    [bitIndex, setBitIndex] = useState(1),
    [inspect, setInspect] = useState(false);
  const film = useMemo(() => qrEncode(QR_MESSAGE), []);
  const manual = useMemo(() => {
    try {
      return qrEncode(text, mask);
    } catch {
      return null;
    }
  }, [text, mask]);
  const qr = director.watch ? film : manual;
  const shot = qrShot(director.chapter, director.chapterProgress);
  const chapter = director.watch ? shot.chapter : 7;
  const candidate =
    chapter === 5 ? (shot.maskSettled ? (qr?.best ?? 0) : shot.mask) : (qr?.mask ?? 0);
  const shown = qr ? { ...qr, mask: candidate, modules: qr.candidates[candidate].modules } : null;
  const clean = director.watch ? shot.clean : !inspect;
  const reset = () => {
    setText(QR_MESSAGE);
    setMask(-1);
    setByteIndex(8);
    setBitIndex(1);
    setInspect(false);
  };
  const measuredBytes = new TextEncoder().encode(text).length;
  return (
    <section
      className="qr-study"
      data-watch={director.watch}
      data-chapter={chapter}
      data-playing={director.playing}
      aria-label={t('二维码编码实验')}
    >
      <header className="qr-heading">
        <span>QR · VERSION 1 · L</span>
        <span>
          {director.watch || qr
            ? `21 × 21 · ${qr?.payload.length ?? 17} ${t('字节')}`
            : t('输入待调整')}
        </span>
      </header>
      <div className="qr-intro">
        <h3>{t(director.watch ? titles[chapter] : '让你的文字变成二维码')}</h3>
        <p>
          {director.watch
            ? currentLine(chapter, shot.progress)
            : t('选择文字和掩码，计算完整二维码；展开追踪可查看真实位值。')}
        </p>
      </div>
      {qr && shown ? (
        <>
          <div className="qr-film-surface">
            {chapter === 0 ? (
              <ByteOrigin qr={qr} p={shot.progress} />
            ) : chapter === 1 ? (
              <StreamSheet qr={qr} p={shot.progress} />
            ) : chapter === 2 ? (
              <RsSheet qr={qr} step={shot.rsStep} />
            ) : (
              <>
                <div className="qr-paper">
                  <QrCodeMatrix
                    qr={qr}
                    chapter={chapter}
                    structure={shot.structure}
                    placed={shot.placed}
                    mask={candidate}
                    copy={shot.formatCopy}
                    clean={clean}
                    inspect={
                      inspect ||
                      (chapter === 4 && shot.placed > qrTracked(qr)!.index) ||
                      chapter === 5
                    }
                    byteIndex={director.watch ? 8 : byteIndex}
                    bitIndex={director.watch ? 1 : bitIndex}
                  />
                </div>
                {chapter === 3 && (
                  <div className="qr-reserved-legend">
                    <span data-active={shot.structure === 0}>{t('定位 + 隔离')}</span>
                    <span data-active={shot.structure === 1}>{t('时序')}</span>
                    <span data-active={shot.structure === 2}>{t('格式留位')}</span>
                  </div>
                )}
                {chapter === 4 && (
                  <div className="qr-placement-note">
                    <b>{shot.placed} / 208</b>
                    <span>{t('已放入的位')}</span>
                    <code>
                      {shot.placed
                        ? `(${qr.path[shot.placed - 1][0]}, ${qr.path[shot.placed - 1][1]})`
                        : '—'}
                    </code>
                  </div>
                )}
                {chapter === 5 && (
                  <>
                    <MaskChoices qr={qr} current={candidate} />
                    <BitReceipt qr={shown} />
                  </>
                )}
                {chapter === 4 && shot.placed > qrTracked(qr)!.index && (
                  <div className="qr-bit-receipt">
                    <span>{t('这就是 v 的位 b6')}</span>
                    <code>
                      {qrTracked(qr)!.raw} → ({qrTracked(qr)!.x}, {qrTracked(qr)!.y})
                    </code>
                  </div>
                )}
                {chapter === 6 && (
                  <div className="qr-format-note">
                    <span>{t('等级 + 掩码')}</span>
                    <code>01 · {qrBits(qr.mask, 3).join('')}</code>
                    <span>{t('BCH 余数')}</span>
                    <code>{qrBits(qr.candidates[qr.mask].format.remainder, 10).join('')}</code>
                    <span>{t('最终格式字')}</span>
                    <code>0x{qr.candidates[qr.mask].format.value.toString(16).toUpperCase()}</code>
                    <p>{t('再与固定的 0x5412 异或；两份格式信息完全相同。')}</p>
                  </div>
                )}
                {chapter === 7 &&
                  (clean ? (
                    <div className="qr-final-receipt">
                      <b>{qr.text}</b>
                      <span>{t('四格静区 · 黑白模块')}</span>
                      <span>
                        {t('掩码')} {qr.mask} · 19 + 7 {t('码字')}
                      </span>
                    </div>
                  ) : (
                    <BitReceipt
                      qr={shown}
                      byteIndex={director.watch ? 8 : byteIndex}
                      bitIndex={director.watch ? 1 : bitIndex}
                    />
                  ))}
              </>
            )}
          </div>
          {director.watch && (
            <p className="qr-film-note">
              {t(
                chapter === 7 && clean
                  ? '可扫描成品；二维码保存的是文字，操作由读码软件决定。'
                  : chapter === 2
                    ? 'RS 按字节纠错；遮住多少面积不能直接换算成恢复保证。'
                    : '教学过程视图；最后一章显示完整可扫描成品。',
              )}
            </p>
          )}
        </>
      ) : (
        <div className="qr-invalid" role="status">
          <b>{t('此输入超出本篇范围')}</b>
          <p>{t('请输入 1–17 个 ASCII 字节；非 ASCII 使用 UTF-8 ECI，限 16 字节。')}</p>
          <span>
            {measuredBytes} {t('UTF-8 字节')}
          </span>
        </div>
      )}
      {!director.watch && (
        <div className="qr-explore">
          <label htmlFor={`${id}-text`}>{t('编码文字')}</label>
          <input
            id={`${id}-text`}
            type="text"
            value={text}
            aria-describedby={`${id}-scope`}
            aria-invalid={!qr}
            onChange={(e) => {
              setText(e.target.value);
              setByteIndex(0);
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <p id={`${id}-scope`}>
            {t('ASCII 最多 17 字节；其他文字按 UTF-8 编码并加入 ECI，最多 16 字节。')}
          </p>
          <label htmlFor={`${id}-mask`}>{t('选择掩码')}</label>
          <select id={`${id}-mask`} value={mask} onChange={(e) => setMask(Number(e.target.value))}>
            <option value={-1}>{t('自动选择最低评分')}</option>
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i} value={i}>
                {t('掩码')} {i}
              </option>
            ))}
          </select>
          <div className="qr-explore-actions">
            <button type="button" aria-pressed={inspect} onClick={() => setInspect((v) => !v)}>
              {t('追踪一个位')}
            </button>
            <button type="button" onClick={reset}>
              {t('重置全部')}
            </button>
            {qr && (
              <a
                href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(qr.modules))}`}
                download="vistep-qr.svg"
              >
                {t('下载二维码 SVG')}
              </a>
            )}
          </div>
          {inspect && qr && (
            <div className="qr-trace-controls">
              <label htmlFor={`${id}-byte`}>
                {t('跟随哪个字节')}
                <select
                  id={`${id}-byte`}
                  value={Math.min(byteIndex, qr.payload.length - 1)}
                  onChange={(e) => setByteIndex(Number(e.target.value))}
                >
                  {qr.payload.map((v, i) => (
                    <option key={i} value={i}>
                      {i + 1} · 0x{qrHex(v)}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={`${id}-bit`}>
                {t('跟随哪个位')}
                <select
                  id={`${id}-bit`}
                  value={bitIndex}
                  onChange={(e) => setBitIndex(Number(e.target.value))}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i} value={i}>
                      b{7 - i}
                    </option>
                  ))}
                </select>
              </label>
              <BitReceipt qr={qr} byteIndex={byteIndex} bitIndex={bitIndex} />
            </div>
          )}
          {qr && (
            <details className="qr-calculation">
              <summary>{t('查看这次编码的计算结果')}</summary>
              <p>
                {qr.stream.eci ? 'ECI 26 + UTF-8' : 'ASCII'} · {qr.payload.length} {t('字节')}
              </p>
              <CodewordStrip qr={qr} trackedByte={byteIndex} />
              <p>RS: {qr.rs.parity.map(qrHex).join(' ')}</p>
              <MaskChoices qr={qr} current={qr.mask} />
            </details>
          )}
          <p className="qr-no-damage">
            {t('本篇不模拟污损恢复；没有宣称任意遮挡或放置标志后仍能解码。')}
          </p>
        </div>
      )}
    </section>
  );
}
