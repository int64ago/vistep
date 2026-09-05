import { useId, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import {
  EC_CHECK_POSITIONS,
  EC_WEAVE_NODES,
  EC_WEAVE_LOOPS,
  EC_WEAVE_RADIUS,
  EC_DATA_POSITIONS,
  EC_GROUPS,
  ecCase,
  ecData,
  ecDecode,
  ecShot,
  type EcBit,
  type EcCase,
  type EcMode,
  type EcShot,
} from '../../models/error-correction';
import { useShowcase } from '../lab/Showcase';
import '../../styles/error-correction.css';

const colors = ['#397f79', '#a07832', '#956685'];
const titles = [
  '把四位数据织进七个位',
  '重叠，才有不同的指纹',
  '同一编号，数值被翻转',
  '把三次校验读成一个位置',
  '只翻回被定位的那一位',
  '两处错误，伪装成另一处',
  '再加一位，识别双错',
  '能修一位，能拦两位',
];

function explanation(shot: EcShot) {
  const { chapter: c, sample: s, corrected, built, revealed } = shot;
  if (c === 0)
    return built < 3
      ? t('数据保留在 3、5、6、7 位；依次补齐三个偶校验位。')
      : t('每条彩线覆盖的四个位，异或结果都等于零。');
  if (c === 1) return t('每个位参加的校验组合不同；这就是单错的位置指纹。');
  if (c === 2)
    return s.flips.length
      ? t('信道只翻转第 6 位；校验位也随数据一起传输。')
      : t('发送和接收按相同位编号对齐，先观察没有错误的情况。');
  if (c === 3)
    return revealed < 3
      ? t('接收端重新检查：偶数个 1 得 0，奇数个 1 得 1。')
      : t('C4、C2、C1 得到 110₂ = 6；假定只有单错，位置就是 6。');
  if (c === 4)
    return corrected
      ? t('翻回第 6 位，三项校验归零；提取原来的四个数据位置。')
      : t('综合征定位 6；纠错前先保留接收到的码字。');
  if (c === 5 && !s.flips.length) return t('先保留发送码字，接下来同时翻转第 3、5 位。');
  if (c === 5)
    return corrected
      ? t('误翻第 6 位后，校验全通过，数据却错了。普通解码器无法分辨。')
      : t('第 3、5 位同时翻转，也给出 110₂；它与单错 6 的指纹相同。');
  if (c === 6)
    return s.flips.length
      ? t('相同双错：综合征非零，总奇偶仍为偶。报警，并且不交付数据。')
      : t('第 8 位检查全部八个位，使整字中 1 的数量为偶数。');
  return t('以下判断以最多两位翻转为前提；三位及以上可能误纠或漏检。');
}

function Word({
  word,
  flips = [],
  correction = null,
  label,
  className = '',
}: {
  word: readonly EcBit[];
  flips?: readonly number[];
  correction?: number | null;
  label: string;
  className?: string;
}) {
  return (
    <div className={`ec-word ${className}`}>
      <span>{label}</span>
      <div className="ec-word-bits" style={{ '--ec-n': word.length } as CSSProperties}>
        {word.map((b, i) => (
          <div key={i} data-flip={flips.includes(i + 1)} data-correct={correction === i + 1}>
            <small>{i + 1}</small>
            <b>{b}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParityWeave({ shot }: { shot: EcShot }) {
  const { sample: s, chapter, built, focus, corrected, revealed } = shot;
  const word = corrected && s.decoded.corrected ? s.decoded.corrected : s.received;
  const checked = ecDecode(word, s.mode).checks;
  const active = focus < 0 ? -1 : focus;
  const groups = EC_GROUPS;
  return (
    <div className="ec-loom">
      <svg
        className="ec-weave"
        viewBox="0 0 300 300"
        role="img"
        aria-label={t('三条彩线分别检查 1、3、5、7 位；2、3、6、7 位；4、5、6、7 位。')}
      >
        {s.mode === 'extended' && (
          <g className="ec-overall-loop">
            <circle
              cx="150"
              cy="150"
              r="144"
              fill="none"
              stroke="#7e8c79"
              strokeWidth="1.3"
              strokeDasharray="2 5"
            />
            <text x="150" y="24" textAnchor="middle" fontSize="20" fill="#667562">
              q
            </text>
          </g>
        )}
        {EC_WEAVE_LOOPS.map(([cx, cy], i) => (
          <g key={i} data-dim={active !== -1 && active !== i}>
            <circle
              cx={cx}
              cy={cy}
              r={EC_WEAVE_RADIUS}
              fill={colors[i]}
              fillOpacity=".055"
              stroke={colors[i]}
              strokeWidth={active === i ? 3 : 1.7}
              strokeOpacity=".72"
            />
            <path
              d={
                i === 0
                  ? 'M30 129 Q13 128 16 109'
                  : i === 1
                    ? 'M270 129 Q287 128 284 109'
                    : 'M133 262 Q132 282 149 284'
              }
              fill="none"
              stroke={colors[i]}
            />
            <text
              x={i === 0 ? 16 : i === 1 ? 284 : 168}
              y={i === 2 ? 289 : 100}
              textAnchor="middle"
              fill={colors[i]}
              fontSize="18"
            >
              C{EC_CHECK_POSITIONS[i]}
            </text>
          </g>
        ))}
        {EC_WEAVE_NODES.slice(0, word.length).map(([x, y], i) => {
          const pos = i + 1,
            parity = EC_CHECK_POSITIONS.indexOf(pos as 1 | 2 | 4),
            data = EC_DATA_POSITIONS.includes(pos as 3 | 5 | 6 | 7);
          const pending = chapter === 0 && parity >= built && parity >= 0;
          const selected = active < 0 || (groups[active] as readonly number[]).includes(pos);
          const bad = s.flips.includes(pos) && !(corrected && s.decoded.correction === pos);
          const repaired = corrected && s.decoded.correction === pos;
          return (
            <g
              key={pos}
              className="ec-node"
              data-dim={!selected}
              data-bad={bad}
              data-repaired={repaired}
            >
              <circle
                cx={x}
                cy={y}
                r="18"
                fill={data ? '#fcf9f2' : '#eee9df'}
                stroke={bad ? '#ac5349' : repaired ? '#397f79' : '#c9c6bb'}
                strokeWidth={bad || repaired ? 2.5 : 1}
              />
              <text x={x} y={y + 8} textAnchor="middle" fontSize="25" fill="#363d3b">
                {pending ? '?' : word[i]}
              </text>
              <text x={x - 24} y={y - 18} textAnchor="middle" fontSize="18" fill="#59645e">
                {pos}
              </text>
              {bad && (
                <path
                  d={`M${x - 6} ${y + 25}h12`}
                  stroke="#ac5349"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              {repaired && (
                <path
                  d={`m${x - 5} ${y + 25} 4 4 7-8`}
                  stroke="#397f79"
                  strokeWidth="2"
                  fill="none"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="ec-checks" aria-label={t('三个分组校验')}>
        {groups.map((group, i) => (
          <div
            key={i}
            style={{ '--ec-group': colors[i] } as CSSProperties}
            data-active={active === i}
          >
            <span>C{EC_CHECK_POSITIONS[i]}</span>
            <b>{chapter === 0 && built <= i ? '?' : i < revealed ? checked[i] : '·'}</b>
            <small>{group.join(' · ')}</small>
          </div>
        ))}
      </div>
      <div className="ec-loom-note">
        {active >= 0 ? (
          <>
            <span>C{EC_CHECK_POSITIONS[active]}</span>
            <code>
              {chapter === 0 ? (
                <>
                  {groups[active]
                    .filter((pos) => pos !== EC_CHECK_POSITIONS[active])
                    .map((pos) => s.encoded[pos - 1])
                    .join(' ⊕ ')}{' '}
                  = P{EC_CHECK_POSITIONS[active]} = {s.encoded[EC_CHECK_POSITIONS[active] - 1]}
                </>
              ) : (
                <>
                  {groups[active].map((pos) => word[pos - 1]).join(' ⊕ ')} = {checked[active]}
                </>
              )}
            </code>
          </>
        ) : (
          <>
            <span>{t(corrected && s.decoded.corrected ? '纠错后的码字' : '接收端的码字')}</span>
            <span>{t('0 偶 · 1 奇')}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Decision({ sample: s }: { sample: EcCase }) {
  const status = s.decoded.status;
  return (
    <div className="ec-decisions">
      <p>{t('最多两位翻转时')}</p>
      {(
        [
          ['accepted', 's = 0, q = 0', '未检出错误'],
          ['corrected', 's ≠ 0, q = 1', '翻回位置 s'],
          ['overall-corrected', 's = 0, q = 1', '只翻回第 8 位'],
          ['detected', 's ≠ 0, q = 0', '检出双错，不纠正'],
        ] as const
      ).map(([key, rule, label]) => (
        <div key={key} data-active={key === status}>
          <code>{rule}</code>
          <span>{t(label)}</span>
        </div>
      ))}
    </div>
  );
}

function Reasoning({ shot }: { shot: EcShot }) {
  const { chapter: c, sample: s, corrected, decision, revealed } = shot;
  const showPayload = corrected || c >= 6;
  const output = corrected ? s.decoded.payload : null;
  return (
    <div className="ec-reasoning">
      {(c === 0 || c === 1) && (
        <div className="ec-construction">
          <p>{t(c === 0 ? '数据位置保留原值' : '每条线只数自己的四个位')}</p>
          <div className="ec-data-map">
            {s.data.map((bit, i) => (
              <div key={i}>
                <b>{bit}</b>
                <span>
                  d{i + 1} → {EC_DATA_POSITIONS[i]}
                </span>
              </div>
            ))}
          </div>
          <p>
            {t(c === 0 ? 'P1、P2、P4 补足偶数个 1。' : '参加 C2 和 C4，但不参加 C1：只有位置 6。')}
          </p>
          <div className="ec-position-fingerprint">
            <span>C4</span>
            <span>C2</span>
            <span>C1</span>
            <b>1</b>
            <b>1</b>
            <b>0</b>
          </div>
        </div>
      )}
      {c >= 2 && (
        <>
          <Word word={s.encoded} label={t('发送')} className="ec-sent" />
          <Word word={s.received} flips={s.flips} label={t('接收')} className="ec-received" />
          <div className="ec-channel">
            <span>{t('信道翻转')}</span>
            <b>{s.flips.length ? s.flips.join(' + ') : t('无翻转')}</b>
          </div>
        </>
      )}
      {c >= 3 && (
        <div className="ec-syndrome">
          <div>
            <span>
              {t('接收综合征')} <i>s</i>
            </span>
            <strong>
              {revealed === 3 ? [...s.decoded.checks].reverse().join('') : '···'}
              <sub>2</sub> = {revealed === 3 ? s.decoded.syndrome : '?'}
            </strong>
            <small>C4 · C2 · C1</small>
          </div>
          {s.mode === 'extended' && (
            <div>
              <span>
                {t('接收总奇偶')} <i>q</i>
              </span>
              <strong>{s.decoded.overall}</strong>
              <small>{t(s.decoded.overall ? '奇数个 1' : '偶数个 1')}</small>
            </div>
          )}
        </div>
      )}
      {c === 5 && (
        <div className="ec-alias">
          <span>{t('相同综合征，两个解释')}</span>
          <code>
            6 → 110
            <br />3 ⊕ 5 → 110
          </code>
        </div>
      )}
      {decision && c !== 7 && (
        <div
          className="ec-verdict"
          data-warning={s.decoded.status === 'detected' || (corrected && !s.recovered)}
        >
          {s.decoded.status === 'detected'
            ? t('检出双错，停止纠正')
            : s.decoded.correction
              ? t('解码器选择翻转第 {0} 位', s.decoded.correction)
              : t('未检出错误')}
        </div>
      )}
      {showPayload && c !== 7 && (
        <div className="ec-payload" data-warning={output && !s.recovered}>
          <span>{t('提取数据')}</span>
          <b>{output ? output.join('') : s.decoded.status === 'detected' ? t('不交付') : '—'}</b>
          <span>
            {output ? t(s.recovered ? '与原数据相同' : '与原数据不同') : t('等待可靠结果')}
          </span>
        </div>
      )}
      {c === 7 && s.mode === 'extended' && <Decision sample={s} />}
      {c === 7 && s.mode === 'hamming' && (
        <div className="ec-verdict">
          {s.decoded.correction
            ? t('解码器选择翻转第 {0} 位', s.decoded.correction)
            : t('未检出错误')}
        </div>
      )}
    </div>
  );
}

export default function ErrorCorrection() {
  const director = useShowcase(),
    id = useId();
  const [value, setValue] = useState(11),
    [mode, setMode] = useState<EcMode>('extended'),
    [flips, setFlips] = useState<number[]>([6]);
  const film = ecShot(director.chapter, director.chapterProgress);
  const sample = director.watch ? film.sample : ecCase(value, mode, flips);
  const shot: EcShot = director.watch
    ? film
    : {
        chapter: 7,
        progress: 1,
        sample,
        focus: -1,
        built: 3,
        revealed: 3,
        corrected: true,
        decision: true,
      };
  const toggle = (p: number) =>
    setFlips((old) =>
      old.includes(p) ? old.filter((v) => v !== p) : [...old, p].sort((a, b) => a - b),
    );
  const reset = () => {
    setValue(11);
    setMode('extended');
    setFlips([6]);
  };
  return (
    <section
      className="ec-study"
      data-chapter={shot.chapter}
      data-watch={director.watch}
      data-moving={director.playing}
      aria-label={t('纠错编码实验')}
    >
      <header className="ec-heading">
        <span>{sample.mode === 'extended' ? 'Hamming (8,4) · SECDED' : 'Hamming (7,4)'}</span>
        <span>{t('偶校验 · 教学模型')}</span>
      </header>
      <div className="ec-intro">
        <h3>{t(director.watch ? titles[shot.chapter] : '亲手翻转，同一套解码规则')}</h3>
        <p>
          {director.watch ? explanation(shot) : t('选择数据与位编号；解码器只能看到接收码字。')}
        </p>
      </div>
      <div className="ec-original">
        <span>{t('原数据')}</span>
        <b>{sample.data.join('')}</b>
        <span>d1 d2 d3 d4</span>
      </div>
      <div className="ec-composition">
        <ParityWeave shot={shot} />
        <Reasoning shot={shot} />
      </div>
      {!director.watch && (
        <div className="ec-explore">
          <div className="ec-explore-settings">
            <label htmlFor={`${id}-data`}>
              {t('四位消息')}
              <select
                id={`${id}-data`}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              >
                {Array.from({ length: 16 }, (_, i) => (
                  <option key={i} value={i}>
                    {ecData(i).join('')}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-mode`}>
              {t('编码方式')}
              <select
                id={`${id}-mode`}
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as EcMode);
                  setFlips((old) => old.filter((p) => p < 8));
                }}
              >
                <option value="hamming">Hamming (7,4)</option>
                <option value="extended">Hamming (8,4)</option>
              </select>
            </label>
          </div>
          <fieldset>
            <legend>{t('按位翻转信道数据')}</legend>
            <div className="ec-flip-buttons">
              {sample.encoded.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={flips.includes(i + 1)}
                  aria-label={t('翻转第 {0} 位', i + 1)}
                  onClick={() => toggle(i + 1)}
                >
                  <span>{i + 1}</span>
                  <b>{sample.received[i]}</b>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="ec-presets">
            <button type="button" onClick={() => setFlips([])}>
              {t('无翻转')}
            </button>
            <button type="button" onClick={() => setFlips([6])}>
              {t('单错 6')}
            </button>
            <button type="button" onClick={() => setFlips([3, 5])}>
              {t('双错 3 + 5')}
            </button>
            <button type="button" onClick={reset}>
              {t('重置')}
            </button>
          </div>
          {flips.length > 2 && (
            <p className="ec-limit">
              {t('已超出两位错误的保证范围；此时接受或纠正都可能得到错误数据。')}
            </p>
          )}
          {mode === 'hamming' && (
            <p className="ec-limit">
              {t('普通 Hamming 直接按非零综合征翻位；无法同时纠正单错并识别双错。')}
            </p>
          )}
          <Word
            word={sample.decoded.corrected ?? sample.received}
            correction={sample.decoded.correction}
            label={t(sample.decoded.corrected ? '解码器输出码字' : '保留接收码字，不纠正')}
          />
          <p className="ec-explore-result">
            {t('提取数据')} <b>{sample.decoded.payload?.join('') ?? t('不交付')}</b> ·{' '}
            {t(
              sample.recovered
                ? '与原数据相同'
                : sample.decoded.payload
                  ? '与原数据不同'
                  : '等待可靠结果',
            )}
          </p>
        </div>
      )}
      {director.watch && (
        <p className="ec-footnote">
          {t(
            shot.chapter < 5
              ? '位编号标明位置；格内的 0、1 才是数据值。'
              : '单错可纠正，双错须扩展码检测；更多错误不保证。',
          )}
        </p>
      )}
    </section>
  );
}
