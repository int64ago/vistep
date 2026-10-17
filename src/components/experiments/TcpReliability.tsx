import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { tcpSimulate, tcpDefaults, tcpAt, tcpSeq } from '../../models/tcp-reliability';
import '../../styles/tcp-reliability.css';
export default function TcpReliability() {
  const d = useShowcase(),
    id = useId(),
    [drop, setDrop] = useState(1),
    [window, setWindow] = useState(4),
    [at, setAt] = useState(0);
  const c = d.watch ? Math.min(7, d.chapter) : 7,
    p = d.watch ? d.chapterProgress : 1;
  const run = useMemo(
    () =>
      tcpSimulate({
        ...tcpDefaults(),
        count: c === 5 ? 1 : 6,
        window: d.watch ? (c === 6 ? 2 : c === 5 ? 1 : 4) : window,
        drop: d.watch ? ([0, 1, 2, 5, 6].includes(c) ? -1 : 1) : drop,
        reorder: c === 2,
        loseAck: c === 5,
      }),
    [c, d.watch, drop, window],
  );
  const time = d.watch
      ? c === 0
        ? 0
        : c === 3
          ? Math.min(run.end, 2.1) * p
          : c === 4
            ? 2.1 + (run.end - 2.1) * p
            : run.end * p
      : Math.min(at, run.end),
    state = tcpAt(run, time);
  const diagramEnd = Math.max(3, run.end),
    y = (n: number) => 30 + (n / diagramEnd) * 240;
  const active = run.transmissions.filter((tx) => tx.sent <= time),
    acks = run.acks.filter((a) => a.at <= time);
  return (
    <section className="tcp-study" aria-label={t('TCP 可靠传输实验')} data-chapter={c}>
      <header>
        <span>TCP · BYTE STREAM</span>
        <span>{t('序号按字节计数')}</span>
      </header>
      {c === 0 ? (
        <div className="tcp-bytes">
          <span>{t('同一条应用字节流')}</span>
          <div>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}>
                <b>{String.fromCharCode(65 + i)}</b>
                <small>
                  {tcpSeq(i)}…{tcpSeq(i + 1) - 1}
                </small>
                <i>100 B</i>
              </div>
            ))}
          </div>
          <p>{t('切成六段，顺序属于字节流，不属于到达时间。')}</p>
        </div>
      ) : (
        <>
          <div className="tcp-endpoints">
            <span>
              {t('发送端')}
              <b>{tcpSeq(state.base)}</b>
            </span>
            <span>
              {t('接收端下一期待')}
              <b>{tcpSeq(state.next)}</b>
            </span>
          </div>
          <div className="tcp-sequence">
            <svg viewBox="0 0 320 290" preserveAspectRatio="none" aria-hidden="true">
              <path d="M38 12V279M282 12V279" className="tcp-lifeline" />
              {active.map((tx) => {
                const progress = Math.min(1, (time - tx.sent) / (tx.arrives - tx.sent)),
                  end = tx.lost ? Math.min(0.48, progress) : progress;
                return (
                  <g key={tx.id}>
                    <path
                      d={`M38 ${y(tx.sent)}L${38 + 244 * end} ${y(tx.sent + (tx.arrives - tx.sent) * end)}`}
                      className={tx.retransmit ? 'tcp-retry' : tx.lost ? 'tcp-lost' : 'tcp-data'}
                    />
                    {tx.lost && progress > 0.48 && (
                      <path
                        d={`m150 ${y(tx.sent + 0.24) - 5} 10 10m-10 0 10-10`}
                        className="tcp-lost"
                      />
                    )}
                  </g>
                );
              })}
              {acks.map((a, i) => {
                const progress = Math.min(1, (time - a.at) / 0.5),
                  end = a.lost ? Math.min(0.45, progress) : progress;
                return (
                  <path
                    key={i}
                    d={`M282 ${y(a.at)}L${282 - 244 * end} ${y(a.at + 0.5 * end)}`}
                    className={a.lost ? 'tcp-lost' : 'tcp-ack'}
                  />
                );
              })}
              <path d={`M19 ${y(time)}H301`} className="tcp-now" />
            </svg>
            <div className="tcp-segment-labels">
              {active
                .filter((tx) => tx.segment === (c === 5 ? 0 : 1))
                .map((tx) => (
                  <span
                    key={tx.id}
                    style={{ top: `${(y(tx.sent) / 290) * 100}%` }}
                    data-retry={tx.retransmit}
                  >
                    {tx.retransmit ? '↻ ' : ''}
                    {tcpSeq(tx.segment)}
                  </span>
                ))}
            </div>
            <div className="tcp-ack-labels">
              {acks.slice(-1).map((a, i) => (
                <span key={i} style={{ top: `${(y(a.at) / 290) * 100}%` }}>
                  ACK {tcpSeq(a.next)}
                  {a.lost ? ' ×' : ''}
                </span>
              ))}
            </div>
          </div>
          <div className="tcp-receiver">
            <div>
              <span>{t('已按序交付')}</span>
              <div>
                {Array.from({ length: run.config.count }, (_, i) => (
                  <b key={i} data-delivered={state.delivered.includes(i)}>
                    {String.fromCharCode(65 + i)}
                  </b>
                ))}
              </div>
            </div>
            <div>
              <span>{t('等待缺口的缓存')}</span>
              <div>
                {state.buffer.length ? (
                  state.buffer.map((i) => (
                    <b key={i} data-buffered="true">
                      {String.fromCharCode(65 + i)}
                    </b>
                  ))
                ) : (
                  <i>∅</i>
                )}
              </div>
            </div>
          </div>
          <p>
            {t(
              c === 1
                ? 'ACK 指向下一期待字节，已经确认更早的整段连续数据。'
                : c === 2
                  ? '后到的 B 补齐缺口，缓存里的 C、D 才能一起交付。'
                  : c === 3
                    ? 'B 丢失；C、D 即使到达，也不能越过缺口交给应用。'
                    : c === 4
                      ? '超时重发使用原来的序号；缺口补齐后，累计确认向前跳。'
                      : c === 5
                        ? '确认丢了，数据会重来；相同序号不会再交付一次。'
                        : c === 6
                          ? '窗口限制尚未确认的字节，确认到来才继续发。'
                          : '抵达可以乱序，交付仍是同一条完整、有序字节流。',
            )}
          </p>
        </>
      )}
      {!d.watch && (
        <div className="tcp-controls">
          <label htmlFor={`${id}-loss`}>{t('丢失哪一段的首次传输')}</label>
          <select
            id={`${id}-loss`}
            value={drop}
            onChange={(e) => {
              setDrop(+e.target.value);
              setAt(0);
            }}
          >
            <option value="-1">{t('不丢失')}</option>
            {Array.from({ length: 6 }, (_, i) => (
              <option value={i} key={i}>
                {String.fromCharCode(65 + i)} · {tcpSeq(i)}
              </option>
            ))}
          </select>
          <label htmlFor={`${id}-window`}>
            {t('教学发送窗口')} · {window} × 100 B
          </label>
          <input
            id={`${id}-window`}
            type="range"
            min="1"
            max="6"
            value={window}
            onChange={(e) => {
              setWindow(+e.target.value);
              setAt(0);
            }}
          />
          <label htmlFor={`${id}-time`}>
            {t('重建网络时刻')} · {time.toFixed(2)} s
          </label>
          <input
            id={`${id}-time`}
            type="range"
            min="0"
            max={run.end}
            step=".01"
            value={time}
            onChange={(e) => setAt(+e.target.value)}
          />
        </div>
      )}
      <footer>
        <details>
          <summary>{t('模型边界')}</summary>
          <p>{t('教学时序：固定单程延迟 0.5 s、RTO 2 s；省略握手、SACK 与序号回绕。')}</p>
        </details>
      </footer>
    </section>
  );
}
