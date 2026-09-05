import { useId, useMemo, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import {
  CACHE_DEFAULT,
  CACHE_MEMORY,
  CACHE_TRACES,
  cacheGeometry,
  cachePhoneBases,
  cacheShot,
  cacheView,
  makeCacheStory,
  runCache,
  type CacheState,
  type CacheTraceName,
  type CacheView,
} from '../../models/memory-cache';
import { useShowcase } from '../lab/Showcase';
import '../../styles/memory-cache.css';

const colors = [
  '#547a80',
  '#a07845',
  '#766e97',
  '#9d684f',
  '#58816c',
  '#788251',
  '#936879',
  '#5f7d9c',
];
const ink = (base: number) =>
  ({ '--cache-ink': colors[Math.floor(base / 4) % colors.length] }) as CSSProperties;
const addressText = (a: number) => String(a).padStart(2, '0');
const hex = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');
const range = (base: number, length: number) =>
  length === 1 ? addressText(base) : `${addressText(base)}–${addressText(base + length - 1)}`;
const presetLabels: Record<CacheTraceName, string> = {
  spatial: '连续的八个地址',
  temporal: '反复读同一小片',
  conflict: '两个地址互相争位',
  replacement: '最近使用与替换',
  stride: '跨步读取四个远处地址',
};
const chapterNames = [
  '带回一整行邻居',
  '地址里藏着三个线索',
  '下一个就在旁边',
  '刚刚读过，还想再读',
  '有空位，也可能装不下',
  '同样大小，多一个选择',
  '谁最久没有被使用',
  '比较之前，先把容量对齐',
];

function AddressRibbon({ view, detailed }: { view: CacheView; detailed: boolean }) {
  const e = view.event;
  return (
    <div
      className="cache-address-ribbon"
      data-detailed={detailed}
      aria-label={t('地址拆分为标签、组号和行内偏移')}
    >
      <div className="cache-request">
        <span>{t('字节地址')}</span>
        <b>{e ? addressText(e.address) : '—'}</b>
      </div>
      <div className="cache-address-fields">
        {[
          [t('标签'), e?.tagBits, e?.tag],
          [t('组号'), e?.setBits, e?.set],
          [t('行内偏移'), e?.offsetBits, e?.offset],
        ].map(([label, bits, value], i) => (
          <div key={String(label)} data-field={i}>
            <span>{label}</span>
            <b>{bits === '' ? '—' : (bits ?? '—')}</b>
            <small>{bits === '' ? t('零位') : (value ?? '—')}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoryAtlas({ view }: { view: CacheView }) {
  const e = view.event,
    phoneBases = cachePhoneBases(e);
  return (
    <div className="cache-memory-atlas">
      <header>
        <h3>
          <span className="cache-label-wide">{t('主内存地址地图')}</span>
          <span className="cache-label-short">{t('内存')}</span>
        </h3>
        <span>64 B</span>
      </header>
      <div className="cache-atlas-grid">
        {Array.from({ length: 16 }, (_, block) => block * 4).map((base) => (
          <div
            className="cache-memory-tile"
            key={base}
            style={ink(base)}
            data-requested={!!e && e.address >= base && e.address < base + 4}
            data-phone={phoneBases.includes(base)}
            data-evicted={e?.evicted?.base === base}
          >
            <span className="cache-address-range">{range(base, 4)}</span>
            <div className="cache-byte-row">
              {CACHE_MEMORY.slice(base, base + 4).map((byte, j) => (
                <span
                  key={j}
                  data-byte-active={base + j === e?.address}
                  title={t('地址 {0}，字节值 {1}', base + j, hex(byte))}
                >
                  {hex(byte)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="cache-atlas-note">
        <span className="cache-note-desktop">{t('每小片四字节；数字是十六进制数据。')}</span>
        <span className="cache-note-phone">{t('相关地址窗口')}</span>
      </p>
    </div>
  );
}

function CacheCabinet({ view, recency = false }: { view: CacheView; recency?: boolean }) {
  const { state, event } = view,
    { lineBytes, ways, capacity } = state.config;
  return (
    <div className="cache-cabinet">
      <header>
        <h3>
          <span className="cache-label-wide">{t('缓存里的副本')}</span>
          <span className="cache-label-short">{t('缓存')}</span>
        </h3>
        <span>
          {capacity} B · {ways === 1 ? t('1 路') : t('{0} 路', ways)}
        </span>
      </header>
      <div className="cache-set-grid" data-ways={ways}>
        {state.sets.map((lines, set) => (
          <div className="cache-set" key={set} data-selected={event?.set === set}>
            <span className="cache-set-name">{t('组 {0}', set)}</span>
            <div
              className="cache-ways"
              style={{ '--cache-ways': Math.min(2, ways) } as CSSProperties}
            >
              {lines.map((line, way) => (
                <div
                  className="cache-line"
                  key={way}
                  data-target={event?.set === set && event?.way === way}
                  data-valid={line.valid}
                  style={ink((line.block ?? 0) * lineBytes)}
                >
                  <div className="cache-line-meta">
                    <span>V {Number(line.valid)}</span>
                    <span>T {line.tag}</span>
                    {ways > 1 && <span>W {way}</span>}
                  </div>
                  <b className="cache-line-range">
                    {line.valid ? range(line.block! * lineBytes, lineBytes) : '—'}
                  </b>
                  <div className="cache-byte-row">
                    {Array.from({ length: lineBytes }, (_, offset) => (
                      <span
                        key={offset}
                        data-byte-active={
                          line.valid && line.block === event?.block && offset === event.offset
                        }
                      >
                        {line.valid ? hex(line.bytes[offset]) : '··'}
                      </span>
                    ))}
                  </div>
                  {recency && (
                    <small className="cache-recency">
                      {t('最近一次：{0}', line.valid ? `#${line.lastUsed}` : '—')}
                    </small>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="cache-cabinet-legend">{t('V 有效位 · T 标签 · W 路号')}</p>
    </div>
  );
}

function ReadReceipt({ view }: { view: CacheView }) {
  const e = view.event;
  if (!e) return <div className="cache-read-receipt">{t('从空缓存开始。')}</div>;
  const resolved = view.phase !== 'lookup';
  const candidates = e.candidates.map((c) => `V${Number(c.valid)} T${c.tag}`).join(' / ');
  const title = !resolved
    ? '先选组，再检查有效位和标签'
    : e.hit
      ? '命中：这一个字节已经在缓存里'
      : e.evicted
        ? '未命中：替换这一组里的旧副本'
        : '未命中：把包含它的整行带回来';
  return (
    <div className="cache-read-receipt" data-result={!resolved ? 'lookup' : e.hit ? 'hit' : 'miss'}>
      <span className="cache-result-symbol" aria-hidden="true">
        {!resolved ? '?' : e.hit ? '✓' : '↓'}
      </span>
      <div>
        <strong>{t(title)}</strong>
        <p>
          {!resolved
            ? `${t('组 {0}', e.set)} · ${candidates} · ${t('寻找标签 {0}', e.tag)}`
            : e.hit
              ? `${t('地址 {0}', e.address)} → ${view.phase === 'return' ? hex(e.value) : t('读取行内偏移 {0}', e.offset)}`
              : `${e.evicted ? `${range(e.evicted.base, view.state.config.lineBytes)} → ` : ''}${range(e.base, view.state.config.lineBytes)} · ${t('放入组 {0} 的路 {1}', e.set, e.way)}`}
        </p>
      </div>
    </div>
  );
}

function TransferParcel({ view }: { view: CacheView }) {
  const e = view.event;
  return (
    <div className="cache-transfer-strip" data-phase={view.phase}>
      <span>
        {t(
          view.phase === 'lookup'
            ? '核对身份'
            : view.phase === 'transfer'
              ? '复制整行'
              : view.phase === 'hit'
                ? '直接读取'
                : '返回字节',
        )}
      </span>
      <div className="cache-parcel" style={ink(e?.base ?? 0)}>
        {e && (
          <>
            <b>
              {view.phase === 'return'
                ? `${addressText(e.address)} → ${hex(e.value)}`
                : range(e.base, view.state.config.lineBytes)}
            </b>
            {view.phase === 'transfer' && (
              <div
                className="cache-parcel-bytes"
                style={
                  {
                    '--cache-transfer': Math.max(0, Math.min(1, (view.progress - 0.23) / 0.49)),
                  } as CSSProperties
                }
              >
                {e.fetched.map((a) => (
                  <span key={a}>{hex(CACHE_MEMORY[a])}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <span className="cache-transfer-destination">{e ? t('组 {0}', e.set) : '—'}</span>
    </div>
  );
}

function AddressTrace({ frames, view }: { frames: CacheState[]; view: CacheView }) {
  const count = view.state.accesses;
  return (
    <div className="cache-trace" aria-label={t('相同身份的访问序列')}>
      {frames.slice(1).map((frame, i) => (
        <div
          key={i}
          style={ink(frame.event!.base)}
          data-current={i + 1 === view.event?.id}
          data-done={i < count}
        >
          <span>{addressText(frame.event!.address)}</span>
          <b>{i < count ? (frame.event!.hit ? 'H' : 'M') : '·'}</b>
        </div>
      ))}
    </div>
  );
}

function ReadLedger({ state }: { state: CacheState }) {
  return (
    <div className="cache-read-ledger">
      <span>
        {t('读取')} <b>{state.accesses}</b>
      </span>
      <span>
        H <b>{state.hits}</b>
      </span>
      <span>
        M <b>{state.misses}</b>
      </span>
      <span>
        {t('搬运')} <b>{state.fetchedBytes} B</b>
      </span>
    </div>
  );
}

function CacheComparison({
  first,
  second,
  firstFrames,
  secondFrames,
  kind,
}: {
  first: CacheView;
  second: CacheView;
  firstFrames: CacheState[];
  secondFrames: CacheState[];
  kind: 'associativity' | 'line-size';
}) {
  return (
    <div className="cache-comparison">
      <p className="cache-fairness">{t('相同地址序列 · 都从空缓存开始 · 都是 16 B 数据容量')}</p>
      <div className="cache-comparison-pair">
        {[second, first].map((view, i) => {
          const frames = i === 0 ? secondFrames : firstFrames,
            c = view.state.config;
          return (
            <section key={i} className="cache-comparison-side">
              <h3>
                <span className="cache-comparison-heading-long">
                  {kind === 'associativity'
                    ? t(i === 0 ? '直接映射：每组一个位置' : '二路相联：每组两个位置')
                    : t('每行 {0} B，共 {1} 行', c.lineBytes, cacheGeometry(c).lines)}
                </span>
                <span className="cache-comparison-heading-short">
                  {kind === 'associativity'
                    ? t(i === 0 ? '直接映射' : '二路相联')
                    : t('{0} B / 行', c.lineBytes)}
                </span>
              </h3>
              {kind === 'associativity' ? (
                <CacheCabinet view={view} />
              ) : (
                <div className="cache-line-example">
                  <span>{t('当前地址所在行')}</span>
                  <b>{view.event ? range(view.event.base, c.lineBytes) : '—'}</b>
                  <div className="cache-byte-row">
                    {view.event &&
                      CACHE_MEMORY.slice(view.event.base, view.event.end + 1).map((v, j) => (
                        <span key={j} data-byte-active={j === view.event?.offset}>
                          {hex(v)}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              <AddressTrace view={view} frames={frames} />
              <ReadLedger state={view.state} />
            </section>
          );
        })}
      </div>
      <p className="cache-comparison-result">
        {first.state.accesses === firstFrames.length - 1
          ? t(
              kind === 'associativity'
                ? '四条缓存行没有增加，只改变了允许放置的位置。'
                : '这次连续读取只缺两行；更大的行并不保证每种访问都更好。',
            )
          : t('两边逐个读取相同地址，只比较完成的访问。')}
      </p>
    </div>
  );
}

export default function MemoryCache() {
  const demo = useShowcase(),
    controlId = useId();
  const [preset, setPreset] = useState<CacheTraceName | 'custom'>('spatial'),
    [addresses, setAddresses] = useState<number[]>([...CACHE_TRACES.spatial]),
    [ways, setWays] = useState(1),
    [cursor, setCursor] = useState(0),
    [customAddress, setCustomAddress] = useState(18);
  const story = useMemo(makeCacheStory, []),
    manualFrames = useMemo(
      () => runCache(addresses, { ...CACHE_DEFAULT, ways }),
      [addresses, ways],
    );
  const shot = cacheShot(demo.chapter, demo.chapterProgress, story),
    view = demo.watch ? shot.view : cacheView(manualFrames, cursor, true),
    frames = demo.watch ? shot.frames : manualFrames;
  const comparison = demo.watch ? shot.compare : null;
  const reference = view.state.returned.every(
    (value, i) => value === CACHE_MEMORY[frames[i + 1].event!.address],
  );
  return (
    <section
      className="memory-cache-study"
      data-watch={demo.watch}
      data-chapter={shot.chapter}
      data-playing={demo.watch && demo.playing}
      data-phase={view.phase}
      aria-label={t('内存与缓存')}
    >
      <div className="cache-masthead">
        <span>THE ADDRESS ATLAS</span>
        <span>{t('64 B 内存 · 16 B 数据缓存')}</span>
      </div>
      <div className="cache-title-row">
        <h2>{t(demo.watch ? chapterNames[shot.chapter] : '按自己的地址寻找数据')}</h2>
        <span>{t('访问 #{0}', view.event?.id ?? 0)}</span>
      </div>
      {comparison && shot.comparison && shot.otherFrames ? (
        <CacheComparison
          first={view}
          second={shot.comparison}
          firstFrames={frames}
          secondFrames={shot.otherFrames}
          kind={comparison}
        />
      ) : (
        <>
          <AddressRibbon view={view} detailed={!demo.watch || shot.chapter === 1} />
          <div className="cache-spatial-board">
            <MemoryAtlas view={view} />
            <CacheCabinet view={view} recency={demo.watch ? shot.showRecency : ways > 1} />
          </div>
          <TransferParcel view={view} />
          <ReadReceipt view={view} />
          <AddressTrace frames={frames} view={view} />
          <ReadLedger state={view.state} />
        </>
      )}
      <p className="cache-notation">
        <span className="cache-notation-long">
          {t('H 命中 · M 未命中；动画速度不代表访存延迟。')}
        </span>
        <span className="cache-notation-short">{t('H 命中 · M 未命中 · 不计时')}</span>
      </p>
      {!demo.watch && (
        <div className="cache-explore">
          <div className="cache-explore-selectors">
            <label htmlFor={`${controlId}-trace`}>
              {t('访问模式')}
              <select
                id={`${controlId}-trace`}
                value={preset}
                onChange={(e) => {
                  const key = e.target.value as CacheTraceName;
                  setPreset(key);
                  setAddresses([...CACHE_TRACES[key]]);
                  setCursor(0);
                }}
              >
                {preset === 'custom' && (
                  <option value="custom" disabled>
                    {t('手动地址序列')}
                  </option>
                )}
                {Object.entries(presetLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${controlId}-ways`}>
              {t('每组可选位置')}
              <select
                id={`${controlId}-ways`}
                value={ways}
                onChange={(e) => {
                  setWays(Number(e.target.value));
                  setCursor(0);
                }}
              >
                <option value={1}>{t('1 路，4 组')}</option>
                <option value={2}>{t('2 路，2 组')}</option>
                <option value={4}>{t('4 路，1 组')}</option>
              </select>
            </label>
          </div>
          <div className="cache-step-buttons">
            <button
              disabled={view.state.accesses === 0}
              onClick={() => setCursor(Math.max(0, view.state.accesses - 1))}
            >
              {t('上一次读取')}
            </button>
            <button
              disabled={view.state.accesses >= addresses.length}
              onClick={() => setCursor(Math.min(addresses.length, view.state.accesses + 1))}
            >
              {t('下一次读取')}
            </button>
            <button onClick={() => setCursor(0)}>{t('重新从空缓存开始')}</button>
            <button onClick={() => setCursor(addresses.length)}>{t('读完整个序列')}</button>
            <button
              onClick={() => {
                setPreset('spatial');
                setAddresses([...CACHE_TRACES.spatial]);
                setWays(1);
                setCursor(0);
                setCustomAddress(18);
              }}
            >
              {t('恢复缓存默认设置')}
            </button>
          </div>
          <label className="cache-range" htmlFor={`${controlId}-progress`}>
            <span>
              {t('访问进度')}
              <output>
                {view.state.accesses} / {addresses.length}
              </output>
            </span>
            <input
              id={`${controlId}-progress`}
              type="range"
              min={0}
              max={addresses.length}
              step={0.05}
              value={cursor}
              aria-valuetext={`${view.state.accesses} / ${addresses.length}`}
              onChange={(e) => setCursor(Number(e.target.value))}
            />
          </label>
          <div className="cache-custom-read">
            <label htmlFor={`${controlId}-address`}>
              {t('下一次要读的地址')}
              <input
                id={`${controlId}-address`}
                type="number"
                min={0}
                max={63}
                value={customAddress}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 0 && n < 64) setCustomAddress(n);
                }}
              />
            </label>
            <button
              disabled={view.state.accesses >= 32}
              onClick={() => {
                const prefix = addresses.slice(0, view.state.accesses);
                setAddresses([...prefix, customAddress]);
                setCursor(prefix.length + 1);
                setPreset('custom');
              }}
            >
              {t('从当前状态读取它')}
            </button>
          </div>
          <p role="status">
            {t(reference ? '全部返回字节与主内存直接读取一致。' : '返回值不一致。')}{' '}
            {t('已替换 {0} 行。', view.state.evictions)}
          </p>
          <p>{t('手动读取会接在当前状态后，替换尚未执行的序列；最多保留 32 次访问。')}</p>
        </div>
      )}
      <details className="cache-assumptions">
        <summary>{t('查看模型边界与地址规则')}</summary>
        <p>
          {t('只读、冷启动、精确 LRU 替换；数据内存保持不变。未命中复制整行，替换只移除缓存副本。')}
        </p>
        <p>{t('数据容量不包含标签、有效位和替换记录；相同数据容量不等于相同硬件成本。')}</p>
        <p>{t('块号 = 地址整除行大小；组号 = 块号对组数取余；标签 = 块号整除组数。')}</p>
        <p>{t('不模拟写回、预取、多级缓存、一致性、虚拟地址或真实时间。')}</p>
      </details>
    </section>
  );
}
