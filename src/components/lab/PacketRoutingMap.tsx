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
        S: { x: 40, y: 32 },
        A: { x: 140, y: 32 },
        B: { x: 45, y: 114 },
        C: { x: 235, y: 114 },
        R: { x: 140, y: 189 },
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
      inset = Math.min(
        compact ? 0.45 : 0.33,
        (compact ? 50 : 33) / Math.hypot(b.x - a.x, b.y - a.y),
      );
    const u = inset + (1 - 2 * inset) * Math.max(0, Math.min(1, progress));
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };
  const route = state.tables[router].path;
  const chosen = (a: RoutingNode, b: RoutingNode) =>
    route.some((n, i) => (n === a && route[i + 1] === b) || (n === b && route[i + 1] === a));
  return (
    <svg
      className="routing-map"
      viewBox={`0 0 ${compact ? 280 : 720} ${compact ? 218 : 350}`}
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
          if (compact)
            Object.assign(
              label,
              (
                {
                  SA: { x: 90, y: 18 },
                  AB: { x: 20, y: 83 },
                  AC: { x: 259, y: 83 },
                  BC: { x: 140, y: 103 },
                  BR: { x: 36, y: 178 },
                  CR: { x: 244, y: 178 },
                } as Record<string, Point>
              )[link.id],
            );
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
        const badge = {
          x: p.x + (compact && node === 'A' ? 34 : 24),
          y: p.y + (compact && node === 'A' ? -14 : 20),
        };
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
                <circle cx={badge.x} cy={badge.y} r="13" fill="#bea783" />
                <text x={badge.x} y={badge.y + 7} textAnchor="middle" fontSize="20" fill="#192634">
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
              : {
                  x: n.x,
                  y: n.y + (phase.node === 'S' || (compact && phase.node === 'A') ? 39 : -38),
                };
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

/** Isolated B–R output: only packets actually serializing/propagating on this link appear. */
export function PacketRoutingOutput({
  run,
  state,
  selected,
}: {
  run: RoutingRun;
  state: RoutingSnapshot;
  selected: number;
}) {
  const link = run.links.find((l) => l.id === 'BR')!;
  return (
    <svg
      className="routing-output-map"
      viewBox="0 0 280 106"
      role="img"
      aria-label={t('B–R 出口：发送与传播分开显示')}
    >
      <path
        d="M48 54H232"
        stroke={state.brUp ? '#526578' : '#b37372'}
        strokeWidth="2"
        strokeDasharray={state.brUp ? undefined : '3 7'}
      />
      <path d="M229 48l9 6-9 6" fill="none" stroke="#80c5b8" strokeWidth="2" />
      {[
        ['B', 28],
        ['R', 252],
      ].map(([id, x]) => (
        <g key={id}>
          <circle cx={x} cy="54" r="20" fill="#192a3b" stroke="#8db8bc" />
          <text x={x} y="62" fontSize="24" fill="#e1e9e9" textAnchor="middle">
            {id}
          </text>
        </g>
      ))}
      {state.packets
        .filter(
          (p) => p.phase.link === 'BR' && ['transmitting', 'propagating'].includes(p.phase.kind),
        )
        .map((p) => {
          const phase = p.phase,
            u =
              phase.kind === 'transmitting'
                ? 0
                : Math.max(0, Math.min(1, (state.at - phase.start) / link.propagation)),
            x = 68 + 144 * u;
          return p.id === selected ? (
            <g key={p.id}>
              <rect x={x - 18} y="41" width="36" height="26" rx="8" fill="#89d4bf" />
              <text x={x} y="61" textAnchor="middle" fontSize="21" fill="#142c32">
                P{p.id}
              </text>
            </g>
          ) : (
            <circle key={p.id} cx={x} cy="54" r="5" fill="#89d4bf" />
          );
        })}
      <text x="140" y="96" textAnchor="middle" fontSize="20" fill="#afc1ca">
        {t('传播')} · {(link.propagation * 1000).toFixed(1)} ms
      </text>
    </svg>
  );
}
