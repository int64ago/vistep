import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { congestionRun, congestionDefaults, congestionAt } from '../../models/congestion-control';
import '../../styles/congestion-control.css';
export default function CongestionControl() {
  const d = useShowcase(),
    id = useId(),
    [capacity, setCapacity] = useState(4),
    [buffer, setBuffer] = useState(8),
    [round, setRound] = useState(0),
    [responsive, setResponsive] = useState(true);
  const c = d.watch ? Math.min(7, d.chapter) : 7,
    p = d.watch ? d.chapterProgress : 1;
  const run = useMemo(
    () =>
      congestionRun({
        ...congestionDefaults(),
        capacity: d.watch ? 4 : capacity,
        buffer: d.watch
          ? c === 6
            ? 4 + Math.min(8, Math.floor(p * 9))
            : 8
          : Math.max(capacity, buffer),
        initial: d.watch ? (c <= 1 ? 12 : 1) : responsive ? 1 : 12,
        responsive: d.watch ? c > 1 : responsive,
      }),
    [d.watch, c, c === 6 ? Math.floor(p * 9) : 0, capacity, buffer, responsive],
  );
  const loss = run.history.findIndex((r) => r.phase === 'loss'),
    index = d.watch
      ? c === 0
        ? Math.floor(p * 4)
        : c === 1
          ? Math.min(4, Math.floor(p * 5))
          : c === 2
            ? Math.min(3, Math.floor(p * 4))
            : c === 3
              ? Math.max(0, loss)
              : c === 4
                ? Math.max(0, loss) + Math.min(4, Math.floor(p * 5))
                : c === 6
                  ? 12
                  : Math.min(27, Math.floor(p * 28))
      : round;
  const current = congestionAt(run, index),
    other = useMemo(
      () =>
        congestionRun({
          ...congestionDefaults(),
          capacity: run.config.capacity,
          buffer: run.config.buffer,
          initial: 12,
          responsive: false,
        }),
      [run.config.capacity, run.config.buffer],
    );
  const maxY = 32,
    points = run.history
      .slice(0, index + 1)
      .map((r, i) => `${15 + (i / 27) * 290},${150 - (r.before / maxY) * 135}`)
      .join(' ');
  const point = 15 + (index / 27) * 290,
    phase =
      current.phase === 'loss'
        ? '检测到丢包，回退'
        : current.phase === 'slow-start'
          ? '慢启动'
          : current.phase === 'avoidance'
            ? '拥塞避免'
            : '持续超额发送';
  return (
    <section className="cc-study" aria-label={t('拥塞控制实验')} data-chapter={c}>
      <header>
        <span>CONGESTION · AIMD</span>
        <span>{t('同一个瓶颈，有限的缓存')}</span>
      </header>
      <div className="cc-round">
        <span>{t('第 {0} 轮反馈', current.round + 1)}</span>
        <b>{t(phase)}</b>
      </div>
      <div className="cc-channel">
        <div className="cc-sender">
          <span>{t('本轮发出')}</span>
          <b>{current.sent.length}</b>
          <small>{t('个包')}</small>
        </div>
        <div className="cc-reservoir">
          <span>{t('反馈后的队列')}</span>
          <div className="cc-slots">
            {Array.from({ length: run.config.buffer }, (_, i) => (
              <i key={i} data-filled={i < current.queue.length}>
                <b>{i < current.queue.length ? current.queue[i] : '·'}</b>
              </i>
            ))}
          </div>
          <small>
            {current.queue.length} / {run.config.buffer}
          </small>
        </div>
        <div className="cc-bottleneck">
          <span>{t('每轮出口')}</span>
          <b>{run.config.capacity}</b>
          <small>{t('个包')}</small>
        </div>
      </div>
      {c <= 1 ? (
        <div className="cc-queue-cause">
          <strong>
            {current.dropped.length
              ? `${current.dropped.length} ×`
              : `${current.queue.length} / ${run.config.buffer}`}
          </strong>
          <p>
            {t(
              c === 0
                ? '出口每轮只能服务四个包；发送更多不会把出口变宽。'
                : '排队增加延迟；缓存满后，额外的包会被丢弃。',
            )}
          </p>
          <span>
            {t('此轮结束的排队等待')} ≈ {current.queueDelay.toFixed(2)} {t('个往返轮次')}
          </span>
        </div>
      ) : (
        <>
          <div className="cc-chart">
            <div className="cc-chart-label">
              <span>{t('拥塞窗口')} · MSS</span>
              <b>
                {current.before.toFixed(2)} → {current.after.toFixed(2)}
              </b>
            </div>
            <svg viewBox="0 0 320 165" preserveAspectRatio="none" aria-hidden="true">
              <path d="M15 15V150H306" className="cc-axis" />
              {[4, 8, 12, 16].map((y) => (
                <path key={y} d={`M15 ${150 - (y / maxY) * 135}H306`} className="cc-grid" />
              ))}
              <path
                d={`M15 ${150 - (current.threshold / maxY) * 135}H306`}
                className="cc-threshold"
              />
              <polyline points={points} className="cc-window-line" />
              <circle
                cx={point}
                cy={150 - (current.before / maxY) * 135}
                r="3"
                className="cc-cursor"
              />
              {run.history
                .filter((r, i) => i <= index && r.dropped.length)
                .map((r) => (
                  <circle
                    key={r.round}
                    cx={15 + (r.round / 27) * 290}
                    cy={150 - (r.before / maxY) * 135}
                    r="4"
                    className="cc-loss-dot"
                  />
                ))}
            </svg>
            <div className="cc-axis-labels">
              <span>1 RTT</span>
              <span>{t('丢包点')} ●</span>
              <span>28 RTT</span>
            </div>
          </div>
          {c === 7 ? (
            <div className="cc-compare">
              <div>
                <span>{t(d.watch || responsive ? '响应反馈' : '固定窗口 12')}</span>
                <b>
                  {run.history.slice(0, index + 1).reduce((n, r) => n + r.dropped.length, 0)}
                  <small>{t('个丢包')}</small>
                </b>
                <i>
                  {run.history.slice(0, index + 1).reduce((n, r) => n + r.served.length, 0)}{' '}
                  {t('个已服务')}
                </i>
              </div>
              <div>
                <span>{t('固定窗口 12')}</span>
                <b>
                  {other.history.slice(0, index + 1).reduce((n, r) => n + r.dropped.length, 0)}
                  <small>{t('个丢包')}</small>
                </b>
                <i>
                  {other.history.slice(0, index + 1).reduce((n, r) => n + r.served.length, 0)}{' '}
                  {t('个已服务')}
                </i>
              </div>
            </div>
          ) : (
            <p>
              {t(
                c === 2
                  ? '每个新确认增加一份 MSS；一个往返内可以接近翻倍。'
                  : c === 3
                    ? '本轮发生丢包：阈值取在途量的一半，窗口回退。'
                    : c === 4
                      ? '回退至阈值后，每个确认只加约 1/W。'
                      : c === 5
                        ? '逐确认的小增量，与丢包后的乘性回退，形成锯齿。'
                        : '出口容量与缓存大小是两件事；更大缓存也可能换来更长等待。',
              )}
            </p>
          )}
        </>
      )}
      {!d.watch && (
        <div className="cc-controls">
          <button
            aria-pressed={responsive}
            onClick={() => {
              setResponsive((v) => !v);
              setRound(0);
            }}
          >
            {t(responsive ? '响应反馈：开启' : '响应反馈：关闭')}
          </button>
          <label htmlFor={`${id}-capacity`}>
            {t('出口容量，每轮包数')} · {capacity}
          </label>
          <input
            id={`${id}-capacity`}
            type="range"
            min="1"
            max="8"
            value={capacity}
            onChange={(e) => {
              setCapacity(+e.target.value);
              setRound(0);
            }}
          />
          <label htmlFor={`${id}-buffer`}>
            {t('缓存上限，包数')} · {Math.max(capacity, buffer)}
          </label>
          <input
            id={`${id}-buffer`}
            type="range"
            min={capacity}
            max="24"
            value={Math.max(capacity, buffer)}
            onChange={(e) => {
              setBuffer(+e.target.value);
              setRound(0);
            }}
          />
          <label htmlFor={`${id}-round`}>{t('重建第几轮')}</label>
          <input
            id={`${id}-round`}
            type="range"
            min="0"
            max="27"
            value={round}
            onChange={(e) => setRound(+e.target.value)}
          />
        </div>
      )}
      <footer>
        <details>
          <summary>{t('模型边界')}</summary>
          <p>
            {t('按 RTT 分箱的 AIMD 教学模型：初始窗口 1 MSS，显示恢复后的窗口，省略快恢复瞬态。')}
          </p>
        </details>
      </footer>
    </section>
  );
}
