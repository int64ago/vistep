import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import PacketRoutingMap, { PacketRoutingOutput } from '../lab/PacketRoutingMap';
import { routingBufferComparison } from '../lab/packetRoutingPresentation';
import {
  ROUTING_ROUTERS,
  routingBudget,
  routingReset,
  routingScenario,
  routingShot,
  routingSnapshot,
  type RoutingPhaseKind,
  type RoutingDrop,
  type RoutingRun,
  type RoutingSnapshot,
  type RoutingRouter,
  type RoutingMode,
} from '../../models/packet-routing';
import '../../styles/packet-routing.css';

const titles = [
  '分组只选择下一跳',
  '最短的是路由代价',
  '先排队，再逐位发送',
  'TTL 限制转发次数',
  '故障先被邻居发现',
  '更新传播后，路由才收敛',
  '队列满了，分组会被丢弃',
  '先到达，不一定先交付',
];
const phaseNames: Record<RoutingPhaseKind, string> = {
  unborn: '尚未发出',
  processing: '查表处理',
  waiting: '等待发送',
  transmitting: '正在串行发送',
  propagating: '链路上传播',
  received: '已到达 R',
  dropped: '已丢弃',
};
const reasons: Record<RoutingDrop, string> = {
  ttl: 'TTL 已耗尽',
  queue: '等待队列已满',
  link: '链路中断',
  route: '没有可用路由',
};
const ms = (n: number) => (n * 1000).toFixed(1);
function RouteTable({
  state,
  selected,
  compact = false,
  single = false,
}: {
  state: RoutingSnapshot;
  selected: RoutingRouter;
  compact?: boolean;
  single?: boolean;
}) {
  return (
    <div className="routing-table" data-compact={compact}>
      <div className="routing-instrument-title">
        {!compact && <>{t('各自的路由表')} · </>}
        {t('目的地 R')}
      </div>
      <table>
        <thead>
          <tr>
            <th>{t('路由器')}</th>
            <th>{t('下一跳')}</th>
            <th>{t('代价')}</th>
            <th>{t('版本')}</th>
          </tr>
        </thead>
        <tbody>
          {(single ? [selected] : ROUTING_ROUTERS).map((r) => (
            <tr key={r} className={r === selected ? 'is-selected' : ''}>
              <th>{r}</th>
              <td>{state.tables[r].next ?? '—'}</td>
              <td>{state.tables[r].cost}</td>
              <td>v{state.tables[r].version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function PacketBudget({
  run,
  state,
  selected,
  compact = false,
}: {
  run: RoutingRun;
  state: RoutingSnapshot;
  selected: number;
  compact?: boolean;
}) {
  const packet = state.packets[selected - 1],
    b = routingBudget(packet, state.at),
    scale = Math.max(
      0.001,
      Object.values(b).reduce((sum, value) => sum + value, 0),
    );
  const keys = ['processing', 'waiting', 'transmitting', 'propagating'] as const;
  const labels = {
    processing: '处理',
    waiting: '排队',
    transmitting: '串行化',
    propagating: '传播',
  };
  const colors = {
    processing: '#b2a0d0',
    waiting: '#b6a075',
    transmitting: '#73b5c3',
    propagating: '#8ecbb6',
  };
  return (
    <div className="routing-budget">
      <div className="routing-instrument-title">
        {!compact && <>P{selected} · </>}
        {t('时延来自这些过程')}
      </div>
      <div className="routing-budget-line">
        {keys.map((k) => (
          <span key={k} style={{ width: `${(b[k] / scale) * 100}%`, background: colors[k] }} />
        ))}
      </div>
      <div className="routing-budget-legend">
        {keys.map((k) => (
          <span key={k}>
            <i style={{ background: colors[k] }} />
            {t(labels[k])} {ms(b[k])} ms
          </span>
        ))}
      </div>
      <div className="routing-quiet">
        {run.config.bytes} B · {t('存储后转发')}
      </div>
    </div>
  );
}
function QueueDetail({ run, state }: { run: RoutingRun; state: RoutingSnapshot }) {
  const waiting = state.packets
    .filter((p) => p.phase.kind === 'waiting' && p.phase.link === 'BR')
    .sort((a, b) => a.phase.start - b.phase.start || a.id - b.id);
  const busy = state.packets.find((p) => p.phase.kind === 'transmitting' && p.phase.link === 'BR');
  const dropped = state.packets.filter((p) => p.phase.kind === 'dropped');
  return (
    <div className="routing-queue">
      <div className="routing-instrument-title">
        B → R · {(run.config.brRate / 1e6).toFixed(1)} Mbit/s · {t('等待位')} {run.config.capacity}
      </div>
      <div className="routing-queue-line">
        <span>{t('发送中')}</span>
        <b>{busy ? `P${busy.id}` : '—'}</b>
        <span>
          {ms((run.config.bytes * 8) / run.config.brRate)} ms / {t('分组')}
        </span>
      </div>
      <div className="routing-serialization" aria-label={t('正在串行发送')}>
        <i
          style={{
            width: `${busy ? Math.max(0, Math.min(1, (state.at - busy.phase.start) / (busy.phase.end - busy.phase.start))) * 100 : 0}%`,
          }}
        />
      </div>
      <div className="routing-slots">
        {Array.from({ length: run.config.capacity }, (_, i) => (
          <span key={i} className={waiting[i] ? 'is-waiting' : ''}>
            {waiting[i] ? `P${waiting[i].id}` : '·'}
          </span>
        ))}
        {run.config.capacity === 0 && <span className="routing-no-slots">{t('没有等待位')}</span>}
      </div>
      <div className="routing-loss-list">
        {t('丢弃记录')} · {dropped.length ? dropped.map((p) => `P${p.id}`).join(' · ') : '—'}
      </div>
    </div>
  );
}
function Updates({ run, state }: { run: RoutingRun; state: RoutingSnapshot }) {
  return (
    <div className="routing-updates">
      <div className="routing-instrument-title">
        {t('拓扑更新 v1')} · B–R {t(state.brUp ? '可用' : '中断')}
      </div>
      {ROUTING_ROUTERS.map((r) => {
        const row = state.tables[r],
          pending = state.control.find((c) => c.to === r && c.arrive <= state.at),
          processing = pending
            ? (state.at - pending.arrive) / (pending.applyAt - pending.arrive)
            : 0;
        return (
          <div className="routing-update" key={r}>
            <b>{r}</b>
            <span className="routing-update-bar">
              <i style={{ width: `${row.version ? 100 : processing * 100}%` }} />
            </span>
            <span>{t(row.version ? '已安装' : pending ? '处理中' : '尚未知晓')}</span>
          </div>
        );
      })}
      <div className="routing-quiet">
        80 B / 64 kbit/s + {t('传播')} + {ms(run.config.controlProcessing)} ms {t('处理')}
      </div>
    </div>
  );
}
function Receiver({ state }: { state: RoutingSnapshot }) {
  const arrivals = state.packets
    .filter((p) => p.phase.kind === 'received')
    .sort((a, b) => a.receivedAt! - b.receivedAt! || a.id - b.id);
  return (
    <div className="routing-receiver">
      <div className="routing-instrument-title">R · {t('到达顺序')}</div>
      <div className="routing-receive-order">
        {Array.from({ length: state.packets.length }, (_, i) => (
          <span key={i} className={arrivals[i] ? 'has-arrived' : ''}>
            {arrivals[i] ? `P${arrivals[i].id}` : '·'}
          </span>
        ))}
      </div>
      <div className="routing-instrument-title">{t('按序交付的应用示例')}</div>
      <div className="routing-receive-order">
        {state.packets.map((p) => (
          <span
            key={p.id}
            className={p.released ? 'is-released' : p.phase.kind === 'received' ? 'is-held' : ''}
          >
            P{p.id}
          </span>
        ))}
      </div>
      <div className="routing-receiver-key">
        <span>{t('紫色：等待缺口')}</span>
        <span>{t('绿色：可交付')}</span>
      </div>
    </div>
  );
}
export default function PacketRouting() {
  const showcase = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [manual, setManual] = useState(routingReset);
  const comparison = useMemo(() => routingBufferComparison(manual.config), [manual.config]);
  const manualRun = manual.compare ? comparison.expanded : comparison.baseline;
  const directed = useMemo(
    () => routingShot(showcase.chapter, showcase.chapterProgress),
    [showcase.chapter, showcase.chapterProgress],
  );
  const run = showcase.watch ? directed.run : manualRun,
    duration = showcase.watch ? directed.duration : comparison.duration,
    state = showcase.watch ? directed.state : routingSnapshot(run, manual.time * duration);
  const selected = showcase.watch ? directed.selected : Math.min(manual.selected, run.config.count),
    packet = state.packets[selected - 1];
  const chapter = showcase.watch
    ? directed.chapter
    : manual.mode === 'failure'
      ? 5
      : manual.mode === 'reorder'
        ? 7
        : 2;
  const decisions = packet.decisions.filter((d) => d.at <= state.at),
    last = decisions.at(-1);
  const router = showcase.watch
    ? ROUTING_ROUTERS.includes(packet.phase.node as RoutingRouter)
      ? (packet.phase.node as RoutingRouter)
      : (last?.node ?? 'A')
    : manual.router;
  const trail = [
    'S',
    ...decisions.map((d) => d.node),
    ...(packet.phase.kind === 'received' ? ['R'] : []),
  ].join(' → ');
  const phoneTrail =
    decisions.length > 3
      ? `… → ${decisions
          .slice(-3)
          .map((d) => d.node)
          .join(' → ')}${packet.phase.kind === 'received' ? ' → R' : ''}`
      : trail;
  const changeMode = (mode: RoutingMode) =>
    setManual((v) => ({
      ...v,
      mode,
      config: routingScenario(mode),
      selected: 1,
      time: 0,
      compare: false,
    }));
  return (
    <section
      className="routing-scene"
      data-watch={showcase.watch}
      data-chapter={chapter}
      data-phone-film={showcase.watch && compact}
      aria-label={t('可追踪的链路状态分组路由网络')}
    >
      <div className="routing-film">
        <div className="routing-heading">
          <h2>{t(showcase.watch ? titles[chapter] : '跟随一个分组')}</h2>
          <span>{ms(state.at)} ms</span>
        </div>
        <div className="routing-packet-strip">
          <b>P{selected}</b>
          <span className="routing-endpoints">S → R</span>
          {showcase.watch && compact && <time>{ms(state.at)} ms</time>}
          <span>TTL {packet.phase.ttl}</span>
          <span className={packet.phase.kind === 'dropped' ? 'routing-dropped' : ''}>
            {t(packet.phase.reason ? reasons[packet.phase.reason] : phaseNames[packet.phase.kind])}
          </span>
        </div>
        {showcase.watch && compact && (chapter === 2 || chapter === 6) ? (
          <PacketRoutingOutput run={run} state={state} selected={selected} />
        ) : showcase.watch && compact && (chapter === 3 || chapter === 7) ? (
          <div className="routing-phone-journey">
            <span>
              P{selected} · {trail}
            </span>
            <b>
              {packet.phase.link ? packet.phase.link.split('').join(' → ') : packet.phase.node}
              <span>{t('目的地 R')}</span>
            </b>
          </div>
        ) : (
          <>
            <PacketRoutingMap
              run={run}
              state={state}
              selected={selected}
              router={router}
              compact={compact}
              costs={chapter === 1 || !showcase.watch}
            />
            <div className="routing-map-key">
              <span>{t('S 发送端 · R 接收端')}</span>
              <span>
                {t(
                  chapter === 1
                    ? '线旁数字是代价'
                    : chapter === 4 || chapter === 5 || chapter === 7
                      ? '紫色：拓扑更新'
                      : '亮线：当前本地路由',
                )}
              </span>
            </div>
          </>
        )}
        <div className="routing-instrument">
          {chapter === 0 && (
            <PacketBudget
              run={run}
              state={state}
              selected={selected}
              compact={showcase.watch && compact}
            />
          )}
          {(chapter === 1 || chapter === 5) && (
            <>
              <RouteTable
                state={state}
                selected={router}
                compact={showcase.watch && compact}
                single={showcase.watch && compact && chapter === 1}
              />
              <div className="routing-trail" aria-label={`P${selected} · ${trail}`}>
                P{selected} · {showcase.watch && compact ? phoneTrail : trail}
              </div>
            </>
          )}
          {(chapter === 2 || chapter === 6) && <QueueDetail run={run} state={state} />}
          {chapter === 3 && (
            <div className="routing-ttl">
              <div className="routing-instrument-title">{t('每次转发，TTL 减一')}</div>
              <div className="routing-ttl-steps">
                <span>S · {run.config.ttl}</span>
                {decisions.map((d, i) => (
                  <span className={d.ttlAfter === 0 ? 'is-expired' : ''} key={i}>
                    {d.node} · {d.ttlBefore} → {d.ttlAfter}
                  </span>
                ))}
              </div>
              <div className="routing-quiet">{t('到零就丢弃；目的主机不再转发')}</div>
            </div>
          )}
          {chapter === 4 && <Updates run={run} state={state} />}
          {chapter === 7 && <Receiver state={state} />}
        </div>
        <div className="routing-ledger">
          <span>
            <span>{t('在途')}</span>
            <b>{state.counts.active}</b>
          </span>
          <span>
            <span>{t('到达')}</span>
            <b>{state.counts.received}</b>
          </span>
          <span>
            <span>{t('丢弃')}</span>
            <b>{state.counts.dropped}</b>
          </span>
          <span>
            <span>{t('未发')}</span>
            <b>{state.counts.unborn}</b>
          </span>
        </div>
      </div>
      {!showcase.watch && (
        <div className="routing-explore">
          <p>
            {t(
              '拖动取样时间，检查同一批分组的下一跳、队列和接收顺序。数据分组为 1200 字节；图上的位置表示分组状态，不是按比例绘制的地理距离。',
            )}
          </p>
          <div className="routing-buttons">
            {(['normal', 'failure', 'reorder'] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                aria-pressed={manual.mode === mode}
                onClick={() => changeMode(mode)}
              >
                {t(
                  mode === 'normal'
                    ? '稳定网络'
                    : mode === 'failure'
                      ? 'B–R 故障'
                      : '恢复链路与重排',
                )}
              </button>
            ))}
          </div>
          <div className="routing-controls">
            <div>
              <label htmlFor={`${id}-time`}>
                {t('路由取样时间')} <output>{ms(manual.time * duration)} ms</output>
              </label>
              <input
                id={`${id}-time`}
                type="range"
                aria-label={t('路由取样时间')}
                min="0"
                max="1"
                step=".001"
                value={manual.time}
                onChange={(e) => setManual((v) => ({ ...v, time: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label htmlFor={`${id}-count`}>
                {t('数据分组数量')} <output>{manual.config.count}</output>
              </label>
              <input
                id={`${id}-count`}
                type="range"
                aria-label={t('数据分组数量')}
                min="1"
                max="12"
                step="1"
                value={manual.config.count}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    selected: 1,
                    config: { ...v.config, count: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor={`${id}-interval`}>
                {t('源端发送间隔')} <output>{ms(manual.config.interval)} ms</output>
              </label>
              <input
                id={`${id}-interval`}
                type="range"
                aria-label={t('源端发送间隔')}
                min="4"
                max="80"
                step="1"
                value={manual.config.interval * 1000}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    config: { ...v.config, interval: Number(e.target.value) / 1000 },
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor={`${id}-rate`}>
                {t('B–R 数据速率')}{' '}
                <output>{(manual.config.brRate / 1e6).toFixed(1)} Mbit/s</output>
              </label>
              <input
                id={`${id}-rate`}
                type="range"
                aria-label={t('B–R 数据速率')}
                min=".2"
                max="2"
                step=".1"
                value={manual.config.brRate / 1e6}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    config: { ...v.config, brRate: Number(e.target.value) * 1e6 },
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor={`${id}-queue`}>
                {t('每个出口的等待位')} <output>{run.config.capacity}</output>
              </label>
              <input
                id={`${id}-queue`}
                type="range"
                aria-label={t('每个出口的等待位')}
                min="0"
                max="10"
                step="1"
                value={run.config.capacity}
                disabled={manual.compare}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    config: { ...v.config, capacity: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor={`${id}-ttl`}>
                {t('初始 TTL')} <output>{manual.config.ttl}</output>
              </label>
              <input
                id={`${id}-ttl`}
                type="range"
                aria-label={t('初始 TTL')}
                min="1"
                max="16"
                step="1"
                value={manual.config.ttl}
                onChange={(e) =>
                  setManual((v) => ({ ...v, config: { ...v.config, ttl: Number(e.target.value) } }))
                }
              />
            </div>
          </div>
          <div className="routing-buttons">
            <button
              type="button"
              aria-pressed={manual.compare}
              onClick={() => setManual((v) => ({ ...v, compare: !v.compare }))}
            >
              {t('对比 8 个等待位')}
            </button>
            <button type="button" onClick={() => setManual(routingReset())}>
              {t('重置分组网络')}
            </button>
          </div>
          <div className="routing-selection">
            <span>{t('跟随分组')}</span>
            <div className="routing-buttons">
              {run.packets.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  aria-label={`${t('跟随分组')} P${p.id}`}
                  aria-pressed={selected === p.id}
                  onClick={() => setManual((v) => ({ ...v, selected: p.id }))}
                >
                  P{p.id}
                </button>
              ))}
            </div>
          </div>
          <div className="routing-selection">
            <span>{t('检查本地路由表')}</span>
            <div className="routing-buttons">
              {ROUTING_ROUTERS.map((r) => (
                <button
                  type="button"
                  key={r}
                  aria-label={`${t('检查本地路由表')} ${r}`}
                  aria-pressed={manual.router === r}
                  onClick={() => setManual((v) => ({ ...v, router: r }))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <RouteTable state={state} selected={router} />
          <PacketBudget run={run} state={state} selected={selected} />
          <p>
            {t(
              '这是单域链路状态教学模型：确定性最短路径、FIFO、逐跳 TTL 与有限速率控制消息。省略完整 OSPF、ICMP、重传和 TCP 拥塞控制；接收顺序槽只演示应用按序交付。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
