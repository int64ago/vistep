import { t } from '../../i18n';
import {
  ROUTING_NODES,
  ROUTING_ROUTERS,
  type RoutingNode,
  type RoutingRouter,
  type RoutingRun,
  type RoutingSnapshot,
} from '../../models/packet-routing';

type Point = { x: number; y: number };
export default function PacketRoutingMap({
  run,
  state,
  selected,
  router,
  compact,
  costs,
}: {
  run: RoutingRun;
  state: RoutingSnapshot;
  selected: number;
  router: RoutingRouter;
  compact: boolean;
  costs: boolean;
}) {
  const pos: Record<RoutingNode, Point> = compact
    ? {
        S: { x: 155, y: 30 },
        A: { x: 155, y: 94 },
        B: { x: 50, y: 175 },
        C: { x: 260, y: 175 },
        R: { x: 155, y: 263 },
      }
    : {
        S: { x: 50, y: 170 },
        A: { x: 190, y: 170 },
        B: { x: 400, y: 60 },
        C: { x: 400, y: 280 },
        R: { x: 660, y: 170 },
      };
  const along = (from: RoutingNode, to: RoutingNode, progress: number) => {
    const a = pos[from],
      b = pos[to],
      inset = Math.min(0.33, 33 / Math.hypot(b.x - a.x, b.y - a.y));
    const u = inset + (1 - 2 * inset) * Math.max(0, Math.min(1, progress));
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };
  const route = state.tables[router].path;
  const chosen = (a: RoutingNode, b: RoutingNode) =>
    route.some((n, i) => (n === a && route[i + 1] === b) || (n === b && route[i + 1] === a));
  return (
    <svg
      className="routing-map"
      viewBox={`0 0 ${compact ? 310 : 720} ${compact ? 292 : 350}`}
      role="img"
      aria-label={t('分组网络：S 经 A、B、C 路由到 R，实线是数据链路，紫色虚线标识拓扑更新')}
    >
      <g fill="none" strokeLinecap="round">
        {run.links.map((link) => {
          const a = pos[link.a],
            b = pos[link.b],
            down = link.id === 'BR' && !state.brUp,
            active = chosen(link.a, link.b);
          const length = Math.hypot(b.x - a.x, b.y - a.y),
            sign = (compact ? ['AC', 'CR', 'BC', 'SA'] : ['AB', 'BR', 'BC', 'SA']).includes(link.id)
              ? -1
              : 1;
          const label = {
            x: (a.x + b.x) / 2 - ((b.y - a.y) / length) * 40 * sign,
            y: (a.y + b.y) / 2 + ((b.x - a.x) / length) * 40 * sign + 7,
          };
          return (
            <g key={link.id}>
              <path
                d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                stroke={down ? '#b37372' : '#526578'}
                strokeWidth="2"
                strokeDasharray={down ? '3 8' : undefined}
              />
              {active && !down && (
                <path
                  d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                  stroke="#80c5b8"
                  strokeWidth="6"
                  opacity=".22"
                />
              )}
              {down && (
                <path
                  d={`M${(a.x + b.x) / 2 - 7} ${(a.y + b.y) / 2 - 7}l14 14m-14 0l14 -14`}
                  stroke="#f1a39a"
                  strokeWidth="3"
                />
              )}
              {costs && (
                <text x={label.x} y={label.y} textAnchor="middle" fill="#d0c4a5" fontSize="22">
                  {link.cost}
                </text>
              )}
            </g>
          );
        })}
        {state.control
          .filter((c) => state.at < c.arrive)
          .map((c, i) => {
            const a = pos[c.from],
              b = pos[c.to],
              q = along(c.from, c.to, (state.at - c.start) / (c.arrive - c.start));
            return (
              <g key={`${c.from}-${c.to}-${i}`}>
                <path
                  d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                  stroke="#b7a0e6"
                  strokeWidth="2.2"
                  strokeDasharray="3 7"
                />
                <path d={`M${q.x} ${q.y - 7}l7 7-7 7-7-7Z`} fill="#b7a0e6" stroke="#e0d7f7" />
              </g>
            );
          })}
      </g>
      {ROUTING_NODES.map((node) => {
        const p = pos[node],
          isRouter = ROUTING_ROUTERS.includes(node as RoutingRouter),
          row = isRouter ? state.tables[node as RoutingRouter] : undefined;
        const pending = state.control.find(
          (c) => c.to === node && c.arrive <= state.at && c.applyAt > state.at,
        );
        const queued = state.packets.filter(
          (p) => p.phase.node === node && p.phase.kind === 'waiting',
        ).length;
        return (
          <g key={node}>
            {pending && (
              <circle
                cx={p.x}
                cy={p.y}
                r="29"
                fill="none"
                stroke="#b7a0e6"
                strokeWidth="3"
                strokeDasharray={`${(182 * (state.at - pending.arrive)) / (pending.applyAt - pending.arrive)} 182`}
                transform={`rotate(-90 ${p.x} ${p.y})`}
              />
            )}
            {isRouter ? (
              <circle
                cx={p.x}
                cy={p.y}
                r="23"
                fill="#192a3b"
                stroke={node === router ? '#a9d3c7' : row?.version ? '#b7a0e6' : '#748b9b'}
                strokeWidth={node === router ? 2.5 : 1.5}
              />
            ) : (
              <rect
                x={p.x - 21}
                y={p.y - 18}
                width="42"
                height="36"
                rx="11"
                fill="#243743"
                stroke="#718f9d"
                strokeWidth="1.5"
              />
            )}
            <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize="25" fill="#e1e9e9">
              {node}
            </text>
            {queued > 0 && (
              <g>
                <circle cx={p.x + 24} cy={p.y + 20} r="13" fill="#bea783" />
                <text x={p.x + 24} y={p.y + 27} textAnchor="middle" fontSize="20" fill="#192634">
                  {queued}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {state.packets
        .filter(
          (p) =>
            p.phase.kind !== 'unborn' &&
            (p.id === selected ||
              p.phase.kind === 'transmitting' ||
              p.phase.kind === 'propagating'),
        )
        .sort((a, b) => Number(a.id === selected) - Number(b.id === selected))
        .map((packet) => {
          let phase = packet.phase,
            at = state.at;
          if (phase.kind === 'dropped' && phase.link) {
            const index = packet.phases.indexOf(phase);
            const previous = packet.phases[index - 1];
            if (previous?.kind === 'propagating') {
              at = phase.start;
              phase = previous;
            }
          }
          const link = run.links.find((l) => l.id === phase.link),
            n = pos[phase.node];
          const q =
            phase.from && phase.to && ['transmitting', 'propagating'].includes(phase.kind)
              ? along(
                  phase.from,
                  phase.to,
                  phase.kind === 'transmitting' ? 0 : (at - phase.start) / (link?.propagation ?? 1),
                )
              : { x: n.x, y: n.y + (phase.node === 'S' ? 39 : -38) };
          const color = packet.phase.kind === 'dropped' ? '#e69b91' : '#89d4bf';
          if (packet.id !== selected)
            return <circle key={packet.id} cx={q.x} cy={q.y} r="5" fill={color} opacity=".7" />;
          return (
            <g key={packet.id}>
              <rect
                x={q.x - 18}
                y={q.y - 13}
                width="36"
                height="26"
                rx="9"
                fill={color}
                stroke="#d5efdf"
                strokeWidth="1"
              />
              <text x={q.x} y={q.y + 7} textAnchor="middle" fontSize="21" fill="#142c32">
                P{packet.id}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
