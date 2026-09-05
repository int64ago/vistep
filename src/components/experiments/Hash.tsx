import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  HASH_LONG,
  HASH_MAX_BYTES,
  HASH_MESSAGE,
  hashAt,
  hashBits,
  hashCompare,
  hashHex,
  hashRun,
  hashShot,
  hashSmall0,
  hashSmall1,
  hashUtf8,
  type HashBlock,
  type HashRun,
} from '../../models/hash';
import { useShowcase } from '../lab/Showcase';
import HashWords from '../lab/HashWords';
import '../../styles/hash.css';

const titles = [
  '先把文字交给字节',
  '给消息一个准确的结尾',
  '十六个字，展开成六十四个',
  '放慢看一轮',
  '八个状态字，接力六十四轮',
  '别忘了加回起点',
  '消息可以长，摘要长度不变',
  '只改一位，再算一次',
];
const captions = [
  'abc 编成三个 UTF-8 字节；跟住 a 的最低位 b0。',
  '补入 1、零与原始位数；每块恰好 512 位。',
  '四个较早的字经过旋转、移位和加法，生成新的 W。',
  'W 与固定常量进入 T1；两条计算支路更新 a 与 e。',
  '上一轮输出成为下一轮输入；每轮使用自己的 W 和 K。',
  '工作状态加回块输入，才得到这一块的链值。',
  '56 字节示例需要两块；前块链值完整传给后块。',
  '两份输入只差一位；金色短线标出真实计算中的差异。',
];
const hexes = (values: readonly number[]) => values.map((v) => hashHex(v)).join(' ');
function BytesView({ run, p }: { run: HashRun; p: number }) {
  return (
    <div className="hash-bytes-view">
      <div className="hash-type-message">
        <em>a</em>bc
      </div>
      <div className="hash-byte-row">
        {Array.from(run.payload, (v, i) => (
          <div key={i} data-focus={i === 0}>
            <span>{String.fromCharCode(v)}</span>
            <code>{hashHex(v, 2)}</code>
            <small>{v}</small>
          </div>
        ))}
      </div>
      <div className="hash-bit-eight">
        {hashBits(run.payload[0], 8).map((b, i) => (
          <div key={i} data-focus={i === 7}>
            <span>b{7 - i}</span>
            <b>{p >= 0.25 ? b : '·'}</b>
          </div>
        ))}
      </div>
      <p>{t('第 1 字节 · b0 = 1')}</p>
      <div className="hash-word-arrival">
        <span>W[0]</span>
        <code>
          <mark>{hashHex(run.blocks[0].schedule[0]).slice(0, 2)}</mark>
          {hashHex(run.blocks[0].schedule[0]).slice(2)}
        </code>
      </div>
      <p>{t('大端装字：这位成为 W[0] 的第 24 位。')}</p>
    </div>
  );
}
function PaddingView({ run, phase }: { run: HashRun; phase: number }) {
  const parts = [
    {
      label: '消息',
      value: Array.from(run.payload, (v) => hashHex(v, 2)).join(' '),
      size: run.payload.length,
    },
    { label: '一位 1', value: hashHex(run.pad.bytes[run.payload.length], 2), size: 1 },
    { label: '零填充', value: `00 × ${run.pad.zeroBytes}`, size: run.pad.zeroBytes },
    {
      label: '原始位数',
      value: [...run.pad.lengthBytes].map((v) => hashHex(v, 2)).join(''),
      size: 8,
    },
  ];
  return (
    <div className="hash-padding-view">
      <div className="hash-byte-tape" aria-hidden="true">
        {Array.from(run.pad.bytes, (v, i) => (
          <i
            key={i}
            data-kind={
              i < run.payload.length
                ? 'message'
                : i === run.payload.length
                  ? 'one'
                  : i >= run.pad.bytes.length - 8
                    ? 'length'
                    : 'zero'
            }
            data-visible={
              i < run.payload.length ||
              (i === run.payload.length && phase >= 1) ||
              (i > run.payload.length && i < run.pad.bytes.length - 8 && phase >= 2) ||
              (i >= run.pad.bytes.length - 8 && phase >= 3)
            }
            data-set={v !== 0}
          />
        ))}
      </div>
      <div className="hash-pad-parts">
        {parts.map((part, i) => (
          <div key={i} data-revealed={i <= phase}>
            <span>{t(part.label)}</span>
            <code>{i <= phase ? part.value : '—'}</code>
            <small>
              {part.size} {t('字节')}
            </small>
          </div>
        ))}
      </div>
      <div className="hash-equation">
        {run.payload.length * 8} + 1 + {run.pad.zeroBytes * 8 + 7} + 64 = {run.pad.bytes.length * 8}
      </div>
      <p>{t('长度字段记录原消息的 24 位，不包含填充。')}</p>
    </div>
  );
}
function ScheduleView({ block, index }: { block: HashBlock; index: number }) {
  const w = block.schedule,
    terms = [
      { label: `σ₁(W[${index - 2}])`, value: hashSmall1(w[index - 2]) },
      { label: `W[${index - 7}]`, value: w[index - 7] },
      { label: `σ₀(W[${index - 15}])`, value: hashSmall0(w[index - 15]) },
      { label: `W[${index - 16}]`, value: w[index - 16] },
    ];
  return (
    <div className="hash-schedule-view">
      <div className="hash-spread-index">
        <span>W[0…15]</span>
        <span>→</span>
        <b>W[0…63]</b>
      </div>
      <div className="hash-schedule-terms">
        {terms.map((term, i) => (
          <div key={i} data-tracked={index === 16 && i === 3}>
            <span>{term.label}</span>
            <code>{hashHex(term.value)}</code>
            {i < 3 && <i aria-hidden="true">+</i>}
          </div>
        ))}
      </div>
      <div className="hash-sum-bridge" aria-hidden="true" />
      <div className="hash-schedule-result">
        <span>W[{index}]</span>
        <code>{hashHex(w[index])}</code>
      </div>
      <p>{t('加法只保留低 32 位；σ 包含循环右旋与右移。')}</p>
    </div>
  );
}
function RoundView({
  block,
  index,
  phase = 2,
  expanded = false,
}: {
  block: HashBlock;
  index: number;
  phase?: number;
  expanded?: boolean;
}) {
  const r = block.rounds[index];
  return (
    <div className="hash-round-view">
      <div className="hash-round-feeds">
        <span>
          W[{index}] <code>{hashHex(r.w)}</code>
        </span>
        <span>
          K[{index}] <code>{hashHex(r.k)}</code>
        </span>
      </div>
      <div className="hash-two-streams">
        <div>
          <span>T1</span>
          <code>{hashHex(r.t1)}</code>
          <small>h + Σ₁(e) + Ch(e,f,g) + K + W</small>
        </div>
        <div>
          <span>T2</span>
          <code>{phase >= 1 ? hashHex(r.t2) : '—'}</code>
          <small>Σ₀(a) + Maj(a,b,c)</small>
        </div>
      </div>
      <div className="hash-merge-lines" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="hash-two-results">
        <div>
          <span>a′ = T1 + T2</span>
          <code>{phase >= 2 ? hashHex(r.after[0]) : '—'}</code>
        </div>
        <div>
          <span>e′ = d + T1</span>
          <code>{phase >= 2 ? hashHex(r.after[4]) : '—'}</code>
        </div>
      </div>
      <p>{t('b′=a，c′=b，d′=c；f′=e，g′=f，h′=g。')}</p>
      {expanded && (
        <div className="hash-op-terms">
          {[
            ['Σ₁(e)', r.sigma1],
            ['Ch(e,f,g)', r.ch],
            ['Σ₀(a)', r.sigma0],
            ['Maj(a,b,c)', r.maj],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <code>{hashHex(Number(value))}</code>
            </div>
          ))}
        </div>
      )}
      <p className="hash-small-note">
        {t('Σ 是循环右旋组合；Ch 逐位选择，Maj 逐位取多数。所有加法模 2³²。')}
      </p>
    </div>
  );
}
function FeedView({ block, word }: { block: HashBlock; word: number }) {
  return (
    <div className="hash-feed-view">
      <div className="hash-feed-loop">
        <span>{t('块输入')}</span>
        <code>{hashHex(block.input[word])}</code>
        <b>+</b>
        <span>{t('第 64 轮工作字')}</span>
        <code>{hashHex(block.working[word])}</code>
        <b>=</b>
        <span>H{word}</span>
        <code className="hash-feed-output">{hashHex(block.output[word])}</code>
      </div>
      <HashWords words={block.output} digest />
      <p>{t('按 H0 到 H7 顺序拼接：256 位，即 64 个十六进制字符。')}</p>
    </div>
  );
}
function LongView({ run, index }: { run: HashRun; index: number }) {
  const block = run.blocks[index];
  return (
    <div className="hash-long-view">
      <code className="hash-long-message">{HASH_LONG}</code>
      <div className="hash-block-chain">
        <span data-active={index === 0}>{t('块 1')}</span>
        <i>→</i>
        <span data-active={index === 1}>{t('块 2')}</span>
        <b>256 {t('位')}</b>
      </div>
      <div className="hash-chain-detail">
        <span>{t(index === 0 ? '块 1 输入 · 标准初值' : '块 2 输入 · 块 1 的输出')}</span>
        <code>{hexes(block.input.slice(0, 2))}</code>
        <small>{t('显示前两个状态字；实际传递全部八个。')}</small>
      </div>
      <HashWords words={block.output} digest />
      <p>
        {t(
          index === 0
            ? '块 1 的链值还不是整条消息的摘要。'
            : '最后一块完成后，输出长度仍然是 256 位。',
        )}
      </p>
    </div>
  );
}
function ComparisonView({
  comparison,
  block,
  step,
}: {
  comparison: ReturnType<typeof hashCompare>;
  block: number;
  step: number;
}) {
  const a = hashAt(comparison.original, block, step),
    b = hashAt(comparison.altered, block, step),
    count = comparison.history[block][step];
  return (
    <div className="hash-comparison-view">
      <div className="hash-comparison-count">
        <b>
          {count}
          <small> / 256</small>
        </b>
        <span>{t('此刻不同的位')}</span>
      </div>
      <div className="hash-comparison-key">
        <span>{t('原输入')}</span>
        <span>{t('翻转后')}</span>
      </div>
      <HashWords words={a} other={b} digest={step === 65} />
      <div className="hash-diff-history" aria-hidden="true">
        {comparison.history[block].map((value, i) => (
          <i
            key={i}
            style={{ height: `${Math.max(2, (value / 256) * 52)}px` }}
            data-current={i === step}
            data-past={i <= step}
          />
        ))}
      </div>
      <p>
        {step === 65
          ? t('实测差异，不保证恰好一半，也不证明安全性。')
          : t('比较同一块、同一轮；差异数可以上升，也可以下降。')}
      </p>
    </div>
  );
}
export default function Hash() {
  const director = useShowcase(),
    id = useId();
  const [text, setText] = useState(HASH_MESSAGE),
    [byteIndex, setByteIndex] = useState(0),
    [bit, setBit] = useState(0),
    [flip, setFlip] = useState(true),
    [blockIndex, setBlock] = useState(0),
    [step, setStep] = useState(65),
    [detail, setDetail] = useState(false);
  const film = useMemo(() => hashCompare(hashUtf8(HASH_MESSAGE)), []),
    long = useMemo(() => hashRun(hashUtf8(HASH_LONG)), []);
  const manual = useMemo(() => {
    try {
      const payload = hashUtf8(text);
      if (payload.length > HASH_MAX_BYTES) return null;
      return hashCompare(payload, Math.min(byteIndex, Math.max(0, payload.length - 1)), bit, flip);
    } catch {
      return null;
    }
  }, [text, byteIndex, bit, flip]);
  const shot = hashShot(director.chapter, director.chapterProgress),
    chapter = director.watch ? shot.chapter : 7,
    comparison = director.watch ? film : manual;
  const run = comparison?.original,
    selectedBlock = director.watch ? 0 : Math.min(blockIndex, (run?.blocks.length ?? 1) - 1),
    selectedStep = director.watch ? shot.comparisonStep : step;
  const reset = () => {
    setText(HASH_MESSAGE);
    setByteIndex(0);
    setBit(0);
    setFlip(true);
    setBlock(0);
    setStep(65);
    setDetail(false);
  };
  const changeText = (value: string) => {
    setText(value);
    setByteIndex(0);
    setBlock(0);
    setStep(65);
  };
  return (
    <section
      className="hash-study"
      data-watch={director.watch}
      data-chapter={chapter}
      data-playing={director.playing}
      aria-label={t('SHA-256 哈希实验')}
    >
      <header className="hash-heading">
        <span>SHA–256</span>
        <span>{t('真实计算 · 十六进制显示')}</span>
      </header>
      <div className="hash-intro">
        <h3>{t(director.watch ? titles[chapter] : '同一条消息，只动一个位')}</h3>
        <p>
          {t(
            director.watch
              ? captions[chapter]
              : '输入文字后，比较原始字节与一次可选翻转；选择块与运算位置。',
          )}
        </p>
      </div>
      {run && comparison ? (
        <div className="hash-film-surface">
          {chapter === 0 ? (
            <BytesView run={run} p={shot.progress} />
          ) : chapter === 1 ? (
            <PaddingView run={run} phase={shot.padding} />
          ) : chapter === 2 ? (
            <ScheduleView block={run.blocks[0]} index={shot.schedule} />
          ) : chapter === 3 ? (
            <RoundView block={run.blocks[0]} index={0} phase={shot.roundPhase} />
          ) : chapter === 4 ? (
            <div className="hash-rounds-view">
              <div className="hash-round-number">
                <span>{t('完成轮数')}</span>
                <b>
                  {shot.round + 1}
                  <small> / 64</small>
                </b>
              </div>
              <HashWords words={run.blocks[0].rounds[shot.round].after} />
              <div className="hash-round-ticks" aria-hidden="true">
                {Array.from({ length: 64 }, (_, i) => (
                  <i key={i} data-done={i <= shot.round} />
                ))}
              </div>
              <div className="hash-current-operands">
                <span>
                  W[{shot.round}] <code>{hashHex(run.blocks[0].schedule[shot.round])}</code>
                </span>
                <span>
                  K[{shot.round}] <code>{hashHex(run.blocks[0].rounds[shot.round].k)}</code>
                </span>
              </div>
            </div>
          ) : chapter === 5 ? (
            <FeedView block={run.blocks[0]} word={shot.feedWord} />
          ) : chapter === 6 ? (
            <LongView run={long} index={shot.longBlock} />
          ) : (
            <>
              <div className="hash-input-difference">
                <span>{t('输入差异：{0} 位', comparison.changed ? 1 : 0)}</span>
                <code>
                  {comparison.changed
                    ? `${hashHex(run.payload[director.watch ? 0 : Math.min(byteIndex, run.payload.length - 1)], 2)} → ${hashHex(comparison.altered.payload[director.watch ? 0 : Math.min(byteIndex, run.payload.length - 1)], 2)}`
                    : '='}
                </code>
                <b>
                  {selectedStep === 0
                    ? t('块输入')
                    : selectedStep === 65
                      ? t('加回后的链值')
                      : t('第 {0} 轮之后', selectedStep)}
                </b>
              </div>
              <ComparisonView comparison={comparison} block={selectedBlock} step={selectedStep} />
            </>
          )}
        </div>
      ) : (
        <div className="hash-invalid" role="status">
          <b>{t('输入超出本篇范围')}</b>
          <p>{t('请输入至多 1024 个 UTF-8 字节；不要使用不完整的 Unicode 代理项。')}</p>
        </div>
      )}
      {director.watch && (
        <p className="hash-film-note">
          {t(
            chapter === 7
              ? '哈希不是加密，也不是可逆编码；固定长度必然允许碰撞存在。'
              : '每个字为 32 位；图中顺序表示算法步骤，不表示硬件耗时。',
          )}
        </p>
      )}
      {!director.watch && (
        <div className="hash-explore">
          <label htmlFor={`${id}-message`}>{t('要计算的文字')}</label>
          <textarea
            id={`${id}-message`}
            value={text}
            aria-invalid={!run}
            aria-describedby={`${id}-scope`}
            onChange={(e) => changeText(e.target.value)}
            spellCheck={false}
          />
          <p id={`${id}-scope`}>
            {t('教学上限 1024 个 UTF-8 字节；空消息有效，不做 Unicode 规范化。')}
          </p>
          <div className="hash-explore-buttons">
            <button onClick={() => changeText(HASH_LONG)}>{t('载入双块示例')}</button>
            <button onClick={reset}>{t('重置全部')}</button>
          </div>
          {run && (
            <>
              <div className="hash-input-summary">
                {run.payload.length} {t('字节')} · {run.pad.blocks} {t('块')} · 256 {t('位')}
              </div>
              <button
                className="hash-flip-toggle"
                aria-pressed={flip}
                disabled={!run.payload.length}
                onClick={() => setFlip((v) => !v)}
              >
                {t(flip ? '一位翻转已开启' : '一位翻转已关闭')}
              </button>
              <div className="hash-manual-fields">
                <label htmlFor={`${id}-byte`}>{t('翻转哪个字节')}</label>
                <select
                  id={`${id}-byte`}
                  value={Math.min(byteIndex, Math.max(0, run.payload.length - 1))}
                  disabled={!run.payload.length}
                  onChange={(e) => setByteIndex(Number(e.target.value))}
                >
                  {run.payload.length ? (
                    Array.from(run.payload, (v, i) => (
                      <option key={i} value={i}>
                        {i + 1} · 0x{hashHex(v, 2)}
                      </option>
                    ))
                  ) : (
                    <option value={0}>{t('空消息')}</option>
                  )}
                </select>
                <label htmlFor={`${id}-bit`}>{t('翻转哪个位')}</label>
                <select
                  id={`${id}-bit`}
                  value={bit}
                  disabled={!run.payload.length}
                  onChange={(e) => setBit(Number(e.target.value))}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i} value={i}>
                      b{i}
                    </option>
                  ))}
                </select>
                <label htmlFor={`${id}-block`}>{t('查看哪个块')}</label>
                <select
                  id={`${id}-block`}
                  value={selectedBlock}
                  onChange={(e) => setBlock(Number(e.target.value))}
                >
                  {run.blocks.map((_, i) => (
                    <option key={i} value={i}>
                      {i + 1} / {run.pad.blocks}
                    </option>
                  ))}
                </select>
              </div>
              <label htmlFor={`${id}-step`}>{t('压缩与加回进度')}</label>
              <input
                id={`${id}-step`}
                type="range"
                min="0"
                max="65"
                step="1"
                value={step}
                aria-label={t('压缩与加回进度')}
                aria-valuetext={
                  step === 0
                    ? t('块输入')
                    : step === 65
                      ? t('加回后的链值')
                      : t('第 {0} 轮之后', step)
                }
                onChange={(e) => setStep(Number(e.target.value))}
              />
              <div className="hash-step-actions">
                <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  {t('上一步')}
                </button>
                <button disabled={step === 65} onClick={() => setStep((s) => Math.min(65, s + 1))}>
                  {t('下一步')}
                </button>
              </div>
              <details open={detail} onToggle={(e) => setDetail(e.currentTarget.open)}>
                <summary>{t('查看完整摘要与当前轮计算')}</summary>
                <span>{t('原输入的完整摘要')}</span>
                <code className="hash-full-digest">{run.digest}</code>
                <span>{t('对照输入的完整摘要')}</span>
                <code className="hash-full-digest">{comparison?.altered.digest}</code>
                <RoundView
                  block={run.blocks[selectedBlock]}
                  index={Math.max(0, Math.min(63, step - 1))}
                  expanded
                />
              </details>
            </>
          )}
          <p className="hash-manual-limit">
            {t(
              '翻转直接作用于字节，结果未必是有效 UTF-8；两边均按实际字节计算。未演示解密、碰撞搜索或密码强度测试。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
