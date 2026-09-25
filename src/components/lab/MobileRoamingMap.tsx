import { useId } from 'react';
import { t } from '../../i18n';
import type { MrView } from '../../models/mobile-roaming-film';
import {
  MR_VISITED,
  type Breakout,
  type Caller,
  type VisitedOperator,
} from '../../models/mobile-roaming';

export const MR_COLORS = {
  ink: '#33403d',
  muted: '#76807a',
  mcc: '#b0583a',
  mnc: '#2b6b8c',
  msin: '#4b5854',
  key: '#a2761a',
  ipx: '#2f7474',
  internet: '#b98b5c',
  ok: '#3b7f5c',
  bad: '#b2503f',
  visitedLand: '#e3e9dc',
  homeLand: '#f0e5d2',
  sea: '#dfe9ec',
  op: { A: '#3b8069', B: '#6d78b3', C: '#c0843f' } as Record<VisitedOperator['id'], string>,
};

type P = [number, number];
export type MrLayout = {
  W: number;
  H: number;
  narrow: boolean;
  lanes: [number, number, number, number];
  coast: [number, number];
  phone: P;
  core: P;
  ipx: P;
  hss: P;
  gw: P;
  ipxData: P;
  homeGw: P;
  localServer: P;
  oldMme: P;
  mom: P;
  friend: P;
  towers: Record<VisitedOperator['id'], P>;
};

/** Desktop and phone maps are composed separately; lane x positions are shared with the panels. */
export function mrLayout(W: number): MrLayout {
  const narrow = W < 600;
  if (narrow) {
    const H = 192,
      lanes: MrLayout['lanes'] = [W * 0.09, W * 0.34, W * 0.565, W * 0.83];
    return {
      W,
      H,
      narrow,
      lanes,
      coast: [W * 0.44, W * 0.67],
      phone: [lanes[0], 118],
      core: [lanes[1], 88],
      ipx: [lanes[2], 88],
      hss: [lanes[3], 88],
      gw: [lanes[1], 146],
      ipxData: [lanes[2], 146],
      homeGw: [lanes[3], 146],
      localServer: [W * 0.2, 164],
      oldMme: [lanes[3], 146],
      mom: [lanes[3], 150],
      friend: [W * 0.2, 162],
      towers: { B: [W * 0.05, 40], A: [W * 0.165, 32], C: [W * 0.28, 40] },
    };
  }
  const H = 214,
    lanes: MrLayout['lanes'] = [W * 0.085, W * 0.29, W * 0.5, W * 0.72];
  return {
    W,
    H,
    narrow,
    lanes,
    coast: [W * 0.405, W * 0.598],
    phone: [lanes[0], 124],
    core: [lanes[1], 84],
    ipx: [lanes[2], 84],
    hss: [lanes[3], 84],
    gw: [lanes[1], 160],
    ipxData: [lanes[2], 160],
    homeGw: [lanes[3], 160],
    localServer: [W * 0.19, 170],
    oldMme: [W * 0.87, 150],
    mom: [W * 0.885, 92],
    friend: [W * 0.185, 172],
    towers: { B: [W * 0.04, 46], A: [W * 0.12, 36], C: [W * 0.2, 46] },
  };
}

const pathOf = (pts: P[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
/** Point at fraction s along a polyline, by length. */
export function along(pts: P[], s: number): P {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let d = Math.max(0, Math.min(1, s)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 0;
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      ];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}
/** Quadratic arc sampled as a polyline so capsules and trails can follow it by length. */
export function arc(p0: P, c: P, p2: P, n = 28): P[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n,
      u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1],
    ];
  });
}
const fade = (v: number) => Math.max(0, Math.min(1, v));
/** Rise then fall inside [0,1] so a capsule only exists while its message travels. */
const traveling = (v: number) => v > 0 && v < 1;

function Tower({ at, color, dim, label }: { at: P; color: string; dim: number; label: string }) {
  const [x, y] = at;
  return (
    <g opacity={dim} className="mr-glyph">
      <path
        d={`M${x - 7} ${y + 26}L${x} ${y}L${x + 7} ${y + 26}M${x - 4.6} ${y + 17}H${x + 4.6}M${x - 2.4} ${y + 9}H${x + 2.4}`}
        stroke="#5d6a65"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx={x} cy={y - 2} r="4" fill={color} />
      <text x={x + 9} y={y + 4} className="mr-map-label mr-halo" fill={color}>
        {label}
      </text>
    </g>
  );
}
function Phone({ at, glow }: { at: P; glow: number }) {
  const [x, y] = at;
  return (
    <g className="mr-glyph">
      {glow > 0 && (
        <circle cx={x} cy={y} r={20 + glow * 5} fill={MR_COLORS.ok} opacity={0.12 * glow} />
      )}
      <ellipse cx={x} cy={y + 20} rx="12" ry="3" fill="#33403d" opacity=".1" />
      <rect x={x - 10} y={y - 17} width="20" height="34" rx="5" fill="#2e3a38" />
      <rect x={x - 7.5} y={y - 13.5} width="15" height="25" rx="2.4" fill="#e6efe9" />
      <rect x={x - 4} y={y + 2} width="8" height="6" rx="1.2" fill={MR_COLORS.key} opacity=".85" />
    </g>
  );
}
function Server({
  at,
  fill = '#fffaf1',
  stroke = '#8a948d',
  w = 36,
  label,
  labelDx = 0,
}: {
  at: P;
  fill?: string;
  stroke?: string;
  w?: number;
  label?: string;
  labelDx?: number;
}) {
  const [x, y] = at;
  const h = w * 0.8;
  return (
    <g className="mr-glyph">
      <ellipse cx={x} cy={y + h / 2 + 3} rx={w * 0.55} ry="3.5" fill="#33403d" opacity=".08" />
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx="7"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
      />
      {[-0.22, 0.02, 0.26].map((f, i) => (
        <g key={f}>
          <path
            d={`M${x - w / 2 + 7} ${y + f * h}H${x + w / 2 - 13}`}
            stroke={stroke}
            strokeWidth="1.2"
            opacity=".6"
          />
          <circle
            cx={x + w / 2 - 8}
            cy={y + f * h}
            r="1.6"
            fill={i === 0 ? MR_COLORS.ok : stroke}
            opacity=".8"
          />
        </g>
      ))}
      {label && (
        <text x={x + labelDx} y={y + h / 2 + 22} textAnchor="middle" className="mr-map-node">
          {label}
        </text>
      )}
    </g>
  );
}
function Key({ at, glow = 0 }: { at: P; glow?: number }) {
  const [x, y] = at;
  return (
    <g className="mr-key">
      {glow > 0 && <circle cx={x} cy={y} r={12} fill={MR_COLORS.key} opacity={0.22 * glow} />}
      <circle cx={x - 3.5} cy={y} r="3.6" fill="none" stroke={MR_COLORS.key} strokeWidth="1.8" />
      <path
        d={`M${x} ${y}H${x + 7}M${x + 5} ${y}V${y + 3}M${x + 7} ${y}V${y + 2.4}`}
        stroke={MR_COLORS.key}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
  );
}
function Person({ at, color, label }: { at: P; color: string; label?: string }) {
  const [x, y] = at;
  return (
    <g className="mr-glyph">
      {label && (
        <text x={x} y={y + 30} textAnchor="middle" className="mr-map-node">
          {label}
        </text>
      )}
      <circle cx={x} cy={y - 8} r="5.5" fill={color} />
      <path
        d={`M${x - 9} ${y + 10}Q${x - 9} ${y} ${x} ${y}Q${x + 9} ${y} ${x + 9} ${y + 10}Z`}
        fill={color}
      />
    </g>
  );
}
function Capsule({ pts, s, label, color }: { pts: P[]; s: number; label?: string; color: string }) {
  if (!traveling(s)) return null;
  const [x, y] = along(pts, s);
  return (
    <g className="mr-capsule">
      <circle cx={x} cy={y} r="9" fill={color} opacity=".18" />
      <circle cx={x} cy={y} r="4.5" fill={color} />
      {label && (
        <text x={x} y={y - 14} textAnchor="middle" className="mr-map-label" fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}
function Trail({
  pts,
  s,
  color,
  dash,
  width = 2,
}: {
  pts: P[];
  s: number;
  color: string;
  dash?: string;
  width?: number;
}) {
  if (s <= 0) return null;
  const total = pts
    .slice(1)
    .reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  return (
    <path
      d={pathOf(pts)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash ?? `${total * fade(s)} ${total + 10}`}
      opacity={dash ? fade(s) : 1}
    />
  );
}

export type MrMapState = {
  view: MrView;
  b: Record<string, number>;
  time: number;
  chosen: VisitedOperator | null;
  scanReveal: number;
  keyGlowSim: number;
  keyGlowHome: number;
  breakout?: Breakout;
  caller?: Caller;
  /** Exploration: show one data route or both. */
  dataRoutes?: Breakout[];
};

export default function MobileRoamingMap({
  layout,
  state,
}: {
  layout: MrLayout;
  state: MrMapState;
}) {
  const L = layout,
    { W, H, narrow } = L,
    { view, b } = state;
  const [c0, c1] = L.coast;
  const uid = 'mr' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const lift = narrow ? 10 : 12;
  // Signalling route across the sea: visited core → IPX → home core.
  const signal: P[] = [L.core, L.ipx, L.hss];
  // Data view: gateways sit on one tunnel line through a small IPX mark; the public Internet
  // leg is its own arc across the sea and never touches the IPX node.
  const dataY = narrow ? 128 : 148;
  const gw: P = [L.lanes[1], dataY],
    ipxData: P = [L.lanes[2], dataY],
    homeGw: P = [L.lanes[3], dataY],
    localServer: P = narrow ? [W * 0.2, 164] : [W * 0.19, 186];
  const hrRoute: P[] = [L.phone, gw, ipxData, homeGw];
  const internetBack = arc(homeGw, [W * 0.47, narrow ? 200 : 214], localServer);
  const lboRoute: P[] = [
    [L.phone[0] + 4, L.phone[1] + 8],
    [gw[0], gw[1] + 7],
    [localServer[0] + 6, localServer[1] + 4],
  ];
  const towerLink = state.chosen ? L.towers[state.chosen.id] : null;
  const show = {
    data: view === 'data',
    call: view === 'call',
    record: view === 'record',
  };
  const dataRoutes = state.dataRoutes ?? ['home-routed', 'local-breakout'];
  const rings = view === 'select' ? state.scanReveal : 0;
  return (
    <svg
      className="mr-map"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={t('旅行地与家乡两国的网络位置示意')}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width={W} height={H} rx="18" />
        </clipPath>
        <linearGradient id={`${uid}-sea`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e7f0f1" />
          <stop offset="1" stopColor="#d3e2e6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="18" fill={`url(#${uid}-sea)`} />
      {[0.26, 0.5, 0.74].map((f) => (
        <path
          key={f}
          d={`M${c0 + 8} ${H * f}q${(c1 - c0) / 8} -5 ${(c1 - c0) / 4} 0t${(c1 - c0) / 4} 0t${(c1 - c0) / 4} 0`}
          stroke="#b9ced3"
          strokeWidth="1.2"
          fill="none"
          opacity=".7"
        />
      ))}
      <g clipPath={`url(#${uid}-clip)`}>
        {[0, 1, 2].map((k) => {
          // Coastlines with two soft inland contours, drawn from the same curve.
          const v = c0 - k * 13,
            h = c1 + k * 13;
          const vCoast = `M${v - 10} 0C${v + 14} ${H * 0.2} ${v - 16} ${H * 0.42} ${v + 6} ${H * 0.6}S${v - 4} ${H * 0.92} ${v - 14} ${H}`;
          const hCoast = `M${h + 12} 0C${h - 12} ${H * 0.18} ${h + 14} ${H * 0.4} ${h - 4} ${H * 0.62}S${h + 8} ${H * 0.9} ${h + 16} ${H}`;
          return (
            <g key={k}>
              {k === 0 && (
                <>
                  <path d={`${vCoast}H-2V0Z`} fill={MR_COLORS.visitedLand} />
                  <path d={`${hCoast}H${W + 2}V0Z`} fill={MR_COLORS.homeLand} />
                </>
              )}
              <path
                d={vCoast}
                fill="none"
                stroke="#b3c2a8"
                strokeWidth={k ? 1 : 1.5}
                opacity={k ? 0.5 - k * 0.14 : 0.9}
              />
              <path
                d={hCoast}
                fill="none"
                stroke="#d2bb94"
                strokeWidth={k ? 1 : 1.5}
                opacity={k ? 0.55 - k * 0.14 : 0.9}
              />
            </g>
          );
        })}
      </g>
      {!['data', 'call', 'record'].includes(view) && (
        <>
          <text x={narrow ? 10 : 18} y={H - (narrow ? 10 : 14)} className="mr-map-title">
            {t('旅行地')} <tspan fill={MR_COLORS.mcc}>002</tspan>
          </text>
          <text
            x={W - (narrow ? 10 : 18)}
            y={H - (narrow ? 10 : 14)}
            textAnchor="end"
            className="mr-map-title"
          >
            {t('家乡')} <tspan fill={MR_COLORS.mcc}>001</tspan>
          </text>
        </>
      )}

      {/* The signalling route exists throughout; it is emphasised while messages cross it. */}
      <g opacity={view === 'data' ? 0.3 : 1}>
        <path
          d={pathOf(signal)}
          stroke={MR_COLORS.ipx}
          strokeWidth="1.5"
          strokeDasharray="2 6"
          strokeLinecap="round"
          fill="none"
          opacity=".55"
        />
        <g className="mr-glyph">
          <circle
            cx={L.ipx[0]}
            cy={L.ipx[1]}
            r="12"
            fill="#f4f8f7"
            stroke={MR_COLORS.ipx}
            strokeWidth="1.5"
          />
          <circle cx={L.ipx[0]} cy={L.ipx[1]} r="4" fill={MR_COLORS.ipx} />
        </g>
        <text
          x={L.ipx[0]}
          y={L.ipx[1] + 34}
          textAnchor="middle"
          className="mr-map-node"
          fill={MR_COLORS.ipx}
        >
          {narrow ? '' : t('漫游专网')}
        </text>
      </g>

      {MR_VISITED.map((o) => (
        <Tower
          key={o.id}
          at={L.towers[o.id]}
          color={MR_COLORS.op[o.id]}
          label={o.id}
          dim={view === 'select' ? 1 : state.chosen?.id === o.id ? 0.9 : 0.4}
        />
      ))}
      {rings > 0 &&
        MR_VISITED.map((o) => {
          // Ring opacity follows the modelled received power (dBm → linear share of the strongest).
          const strength = 10 ** ((o.rsrpDbm - -79) / 20);
          const phase = (((state.time * 0.55 + o.rsrpDbm / 37) % 1) + 1) % 1;
          const [x, y] = L.towers[o.id];
          return (
            <circle
              key={o.id}
              cx={x}
              cy={y - 2}
              r={8 + phase * (narrow ? 24 : 52)}
              fill="none"
              stroke={MR_COLORS.op[o.id]}
              strokeWidth="1.4"
              opacity={(1 - phase) * 0.8 * Math.max(0.25, strength) * fade(rings * 3)}
            />
          );
        })}
      {towerLink && (
        <path
          d={`M${L.phone[0]} ${L.phone[1] - 16}L${towerLink[0]} ${towerLink[1] + 26}`}
          stroke={MR_COLORS.op[state.chosen!.id]}
          strokeWidth="2"
          strokeDasharray="3 4"
          opacity={view === 'select' ? fade(b.choose * 1.4) : 0.8}
        />
      )}

      <g opacity={view === 'data' || view === 'call' ? 0.45 : 1}>
        <Server at={L.core} w={narrow ? 30 : 40} label={narrow ? undefined : 'MME'} />
      </g>
      <Server
        at={L.hss}
        w={narrow ? 30 : 40}
        fill="#fff6e6"
        stroke="#a48454"
        label={narrow ? undefined : 'HSS'}
      />
      <Key
        at={[L.hss[0] + (narrow ? 3 : 32), L.hss[1] - (narrow ? 24 : 0)]}
        glow={state.keyGlowHome}
      />
      <Phone at={L.phone} glow={view === 'record' ? fade(b.accept * 2) : 0} />
      <Key at={[L.phone[0] + 20, L.phone[1] - 12]} glow={state.keyGlowSim} />

      {/* Data view: gateways, servers, two candidate paths for the same request. */}
      {show.data && (
        <g>
          <Server
            at={gw}
            w={narrow ? 26 : 32}
            fill="#f3f7f1"
            label={narrow ? undefined : t('当地网关')}
            labelDx={narrow ? 0 : 34}
          />
          <Server
            at={homeGw}
            w={narrow ? 26 : 32}
            fill="#fbf2e3"
            stroke="#a48454"
            label={narrow ? undefined : t('家乡网关')}
          />
          {/* The home-routed tunnel crosses the sea through IPX; the Internet leg is a separate arc. */}
          <circle
            cx={ipxData[0]}
            cy={ipxData[1]}
            r="10"
            fill="#f4f8f7"
            stroke={MR_COLORS.ipx}
            strokeWidth="1.5"
          />
          <circle cx={ipxData[0]} cy={ipxData[1]} r="3.5" fill={MR_COLORS.ipx} />
          <text
            x={ipxData[0]}
            y={ipxData[1] + (narrow ? 26 : 30)}
            textAnchor="middle"
            className="mr-map-node"
            fill={MR_COLORS.ipx}
          >
            IPX
          </text>
          <text
            x={narrow ? W * 0.72 : W * 0.6}
            y={narrow ? 184 : 207}
            textAnchor="middle"
            className="mr-map-node"
            fill={MR_COLORS.internet}
          >
            {t(narrow ? '互联网' : '公共互联网')}
          </text>
          <g className="mr-glyph">
            <circle
              cx={localServer[0]}
              cy={localServer[1]}
              r="11"
              fill="#f9f7ef"
              stroke={MR_COLORS.ink}
              strokeWidth="1.3"
            />
            <path
              d={`M${localServer[0] - 11} ${localServer[1]}H${localServer[0] + 11}M${localServer[0]} ${localServer[1] - 11}C${localServer[0] - 6} ${localServer[1] - 4} ${localServer[0] - 6} ${localServer[1] + 4} ${localServer[0]} ${localServer[1] + 11}C${localServer[0] + 6} ${localServer[1] + 4} ${localServer[0] + 6} ${localServer[1] - 4} ${localServer[0]} ${localServer[1] - 11}`}
              stroke={MR_COLORS.ink}
              strokeWidth="1"
              fill="none"
            />
          </g>
          {dataRoutes.includes('home-routed') && (
            <>
              <Trail pts={hrRoute} s={b.hr * 1.6} color={MR_COLORS.ipx} width={2.4} />
              <Trail
                pts={internetBack}
                s={b.hr * 1.6 - 0.6}
                color={MR_COLORS.internet}
                width={2.4}
              />
              <Capsule
                pts={[...hrRoute, ...internetBack.slice(1)]}
                s={b.hr}
                color={MR_COLORS.ipx}
              />
            </>
          )}
          {dataRoutes.includes('local-breakout') && (
            <>
              <Trail pts={lboRoute} s={b.lbo * 1.4} color={MR_COLORS.ok} width={2.4} />
              <Capsule pts={lboRoute} s={b.lbo} color={MR_COLORS.ok} />
            </>
          )}
        </g>
      )}

      {view === 'identity' && (
        <>
          <Trail pts={signal} s={b.route} color={MR_COLORS.mnc} dash="4 5" width={2} />
          {b.route > 0.6 && (
            <text
              x={(L.core[0] + L.ipx[0]) / 2}
              y={L.core[1] - lift - 6}
              textAnchor="middle"
              className="mr-map-label"
              fill={MR_COLORS.mnc}
            >
              {narrow ? '001-01?' : t('去问 001-01')}
            </text>
          )}
        </>
      )}
      {view === 'ask' && (
        <>
          <Capsule pts={[L.phone, L.core]} s={b.attach} color={MR_COLORS.mcc} />
          <Trail pts={signal} s={b.air} color={MR_COLORS.ipx} width={2.4} />
          <Capsule pts={signal} s={b.air} color={MR_COLORS.ipx} />
          <Capsule pts={[...signal].reverse()} s={b.aia} color={MR_COLORS.key} />
        </>
      )}
      {view === 'prove' && (
        <>
          <Capsule
            pts={[L.core, L.phone]}
            s={b.forward}
            color={MR_COLORS.mnc}
            label={narrow ? undefined : 'RAND · AUTN'}
          />
          <Capsule
            pts={[L.phone, L.core]}
            s={b.back}
            color={MR_COLORS.ok}
            label={narrow ? undefined : 'RES'}
          />
        </>
      )}
      {show.record && (
        <>
          <Server
            at={L.oldMme}
            w={narrow ? 26 : 32}
            fill="#fbf2e3"
            stroke="#a48454"
            label={narrow ? undefined : t('旧 MME')}
          />
          <path
            d={`M${L.oldMme[0] - 14} ${L.oldMme[1] - 15}L${L.oldMme[0] + 14} ${L.oldMme[1] + 15}`}
            stroke={MR_COLORS.bad}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={fade(b.cancel * 2 - 1)}
          />
          <Trail pts={signal} s={b.ulr} color={MR_COLORS.ipx} width={2.4} />
          <Capsule pts={signal} s={b.ulr} color={MR_COLORS.ipx} />
          <Capsule pts={[L.hss, L.oldMme]} s={b.cancel} color={MR_COLORS.bad} />
          <Capsule pts={[...signal].reverse()} s={b.ula} color={MR_COLORS.key} />
          <Capsule pts={[L.core, L.phone]} s={b.accept} color={MR_COLORS.ok} />
        </>
      )}
      {show.call && <CallRoutes layout={L} b={b} caller={state.caller} />}
    </svg>
  );
}

function CallRoutes({
  layout: L,
  b,
  caller,
}: {
  layout: MrLayout;
  b: Record<string, number>;
  caller?: Caller;
}) {
  // Calls are switched by voice switches: home gateway MSC (GMSC) and the visited MSC/VLR.
  // The HSS/HLR is only queried; the MME is not on the voice path.
  const { W, narrow, lanes } = L;
  const y = narrow ? 146 : 150;
  const msc: P = [lanes[1], y],
    gmsc: P = [lanes[3], y];
  const mom: P = narrow ? [W * 0.935, y + 4] : [W * 0.885, y];
  const friend: P = narrow ? [W * 0.2, 172] : [W * 0.185, 184];
  const lower = arc(gmsc, [lanes[2], narrow ? 188 : 196], msc);
  const upper = arc(msc, [lanes[2], narrow ? 118 : 128], gmsc);
  const dial: P[] = [mom, gmsc];
  const query: P[] = [
    [gmsc[0] - (narrow ? 10 : 20), gmsc[1] - 12],
    [L.hss[0] - (narrow ? 10 : 26), L.hss[1] + 14],
  ];
  const toVlr: P[] = [L.hss, L.ipx, msc];
  const last: P[] = [msc, [L.phone[0] + 10, L.phone[1] + 4]];
  const forward: P[] = [...lower, ...last.slice(1)];
  const showFriend = caller ? caller === 'visited' : b.local > 0;
  const showHome = caller ? caller === 'home' : true;
  const f = caller ? 1 : b.local;
  const ring = (v: number) => (v * 3) % 1;
  const sriLine = caller ? 1 : Math.min(1, b.sri * 2);
  return (
    <g>
      <Server at={msc} w={narrow ? 26 : 32} fill="#f3f7f1" label={narrow ? undefined : 'MSC/VLR'} />
      <Server
        at={gmsc}
        w={narrow ? 26 : 32}
        fill="#fbf2e3"
        stroke="#a48454"
        label={narrow ? undefined : 'GMSC'}
      />
      {!narrow && (
        <text x={lanes[2]} y={164} textAnchor="middle" className="mr-map-node" fill={MR_COLORS.mcc}>
          {t('国际话路')}
        </text>
      )}
      <path
        d={pathOf(query)}
        stroke={MR_COLORS.muted}
        strokeWidth="1.4"
        strokeDasharray="2 4"
        opacity={sriLine}
      />
      <Capsule pts={query} s={b.sri} color={MR_COLORS.muted} />
      <Capsule pts={toVlr} s={b.prn} color={MR_COLORS.mnc} />
      <Capsule pts={[...toVlr].reverse()} s={b.msrn} color={MR_COLORS.key} />
      {showHome && (
        <g opacity={caller ? 1 : 1 - 0.6 * f}>
          <Person at={mom} color="#a06a4c" label={narrow ? undefined : t('家人')} />
          <Trail pts={dial} s={b.dial * 1.2} color={MR_COLORS.mcc} width={2.4} />
          <Capsule pts={dial} s={b.dial} color={MR_COLORS.mcc} />
          <Trail pts={forward} s={caller ? 1 : b.route * 1.1} color={MR_COLORS.mcc} width={2.4} />
          <Capsule pts={forward} s={b.route} color={MR_COLORS.mcc} />
        </g>
      )}
      {b.page > 0 && b.page < 1 && (
        <circle
          cx={L.phone[0]}
          cy={L.phone[1]}
          r={18 + 16 * ring(b.page)}
          fill="none"
          stroke={MR_COLORS.ok}
          strokeWidth="1.6"
          opacity={1 - ring(b.page)}
        />
      )}
      {showFriend && (
        <g opacity={f}>
          <Person at={friend} color="#4f7f6a" label={narrow ? undefined : t('当地朋友')} />
          <Trail
            pts={[friend, msc, ...upper.slice(1)]}
            s={caller ? 1 : f * 1.3}
            color={MR_COLORS.bad}
            width={2.2}
            dash={undefined}
          />
          <Trail pts={forward} s={caller ? 1 : f * 1.3 - 0.3} color={MR_COLORS.bad} width={2.2} />
        </g>
      )}
    </g>
  );
}
