import { t } from '../../i18n';
import {
  CH_LADDER,
  CH_NODES,
  chPacketAt,
  type ChLadderRun,
  type ChNode,
} from '../../models/cell-handover-ladder';

const pathColor = { source: '#8cc4ea', forwarded: '#eed17f', direct: '#b1d895' } as const;

/** Vertical layout of the ladder, shared with the stage so both views keep one height. */
const textW = (text: string) =>
  [...text].reduce((w, ch) => w + (/[\u2e80-\uffff]/.test(ch) ? 16.5 : 8.6), 0);
const legendKeys = ['经源基站', '转发', '新路径'];
const legendWidths = () =>
  legendKeys.map(
    (k) => [...t(k)].reduce((w, ch) => w + (/[\u2e80-\uffff]/.test(ch) ? 16.5 : 8.6), 0) + 30,
  );
/** Ladder legend fits one row only if its entries fit between the timeline margins. */
const legendRows = (compact: boolean, width: number) =>
  legendWidths().reduce((a, b) => a + b, 0) > width - (compact ? 24 : 140) ? 2 : 1;

export function chLadderLayout(compact: boolean, rowCount: number, width = 1000) {
  const rowH = compact ? 28 : 31,
    headH = 50,
    trayH = 46,
    top = headH + trayH + 12;
  const timelineTop = top + rowCount * rowH + 12;
  const extra = legendRows(compact, width) === 2 ? 24 : 0;
  return { rowH, headH, trayH, top, timelineTop, height: timelineTop + 142 + extra };
}

/**
 * The handover as a message ladder (logical order, evenly spaced rows) above a to-scale timeline of
 * what the handset actually receives. Packets keep their numbers from the core to the handset.
 */
export default function CellHandoverLadder({
  ladder,
  ms,
  width,
  compact,
  sourceLabel,
  targetLabel,
}: {
  ladder: ChLadderRun;
  ms: number;
  width: number;
  compact: boolean;
  sourceLabel: string;
  targetLabel: string;
}) {
  const side = compact ? 34 : 70;
  const colX = (n: ChNode) => side + (n / 3) * (width - 2 * side);
  const { rowH, headH, trayH, top, timelineTop, height } = chLadderLayout(
    compact,
    ladder.messages.length,
    width,
  );
  const twoRows = legendRows(compact, width) === 2;
  const rows = ladder.messages;
  const ladderH = rows.length * rowH;
  const narrow = width < 340;
  const names = (narrow ? ['手机', '源站', '目标站', '核心网'] : CH_NODES).map((n) => t(n));
  // The core both signals (MME/AMF) and carries the user plane (S-GW/UPF) that sends the end marker.
  const sub = ['', sourceLabel, targetLabel, compact ? 'S-GW·UPF' : 'MME·S-GW / AMF·UPF'];
  const current = rows.reduce((k, m, i) => (ms >= m.send ? i : k), -1);
  // Packets currently at or between nodes.
  const held: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [] };
  const moving: { id: number; x: number; color: string }[] = [];
  for (const p of ladder.packets) {
    const s = chPacketAt(ladder, p, ms);
    if (s.state === 'held') held[s.at].push(p.id);
    if (s.state === 'moving')
      moving.push({
        id: p.id,
        x: colX(s.from) + (colX(s.to) - colX(s.from)) * s.u,
        color: pathColor[p.path],
      });
  }
  const trayY = headH + 2;
  // To-scale receive timeline.
  const t0 = CH_LADDER.startMs,
    t1 = CH_LADDER.endMs,
    tl = compact ? 12 : 70,
    tr = width - (compact ? 12 : 70);
  const tx = (v: number) => tl + ((v - t0) / (t1 - t0)) * (tr - tl);
  const delivered = ladder.packets.filter((p) => p.delivered <= ms);
  // Ticks narrow enough that 1 ms apart still reads as separate packets at phone scale.
  const tickW = Math.max(1.4, Math.min(4, ((tr - tl) / (t1 - t0)) * 0.55));
  const forwarded = ladder.packets.filter((p) => p.path === 'forwarded');
  const numbered = [forwarded[0], forwarded[forwarded.length - 1]];
  const legendWidth = legendWidths();
  const gapShown = ms >= ladder.firstNew;
  const gapOpen = ms > ladder.lastOld && !gapShown;
  return (
    <svg
      className="ch-ladder"
      viewBox={`0 0 ${width} ${height}`}
      style={{ height }}
      role="img"
      aria-label={t('切换信令顺序与手机收到的数据包')}
    >
      {([0, 1, 2, 3] as ChNode[]).map((n) => (
        <g key={n}>
          <path
            d={`M${colX(n)} ${headH + 2}V${top + ladderH}`}
            stroke="#8d99ad"
            strokeOpacity=".35"
            strokeDasharray={n ? '0' : '3 5'}
          />
          <text x={colX(n)} y="20" textAnchor="middle" className="ch-ladder-node">
            {names[n]}
          </text>
          {sub[n] && (
            <text
              x={n === 3 ? Math.min(colX(n), width - 2 - textW(sub[n]) / 2) : colX(n)}
              y="42"
              textAnchor="middle"
              className="ch-ladder-sub"
            >
              {sub[n]}
            </text>
          )}
        </g>
      ))}
      {/* Trays: which packets each node is holding right now. */}
      <rect
        x={colX(0) - (compact ? 30 : 46)}
        y={trayY}
        width={colX(3) - colX(0) + (compact ? 60 : 92)}
        height={trayH}
        rx="20"
        fill="#8d99ad14"
      />
      {([0, 1, 2, 3] as ChNode[]).map((n) => {
        const list = held[n];
        if (!list.length) return null;
        const max = compact ? 1 : 2;
        const shown = list.slice(0, max);
        return (
          <g key={n}>
            {shown.map((id, k) => {
              const x = colX(n) + (k - (shown.length - 1) / 2) * 40 - (list.length > max ? 10 : 0);
              return (
                <g key={id}>
                  <rect
                    x={x - 19}
                    y={trayY + 3}
                    width="38"
                    height="26"
                    rx="13"
                    fill="#2b3447"
                    stroke={n === 2 ? pathColor.forwarded : '#8d99ad'}
                  />
                  <text x={x} y={trayY + 21.5} textAnchor="middle" className="ch-packet">
                    {id}
                  </text>
                </g>
              );
            })}
            {list.length > max && (
              <text
                x={colX(n) + (shown.length / 2) * 40 - 4}
                y={trayY + 22}
                className="ch-packet-more"
              >
                +{list.length - max}
              </text>
            )}
          </g>
        );
      })}
      {moving.map((m) => (
        <circle key={m.id} cx={m.x} cy={trayY + 38} r="4.5" fill={m.color} />
      ))}
      {rows.map((m, i) => {
        if (ms < m.send) return null;
        // Each message owns a row: its label sits above its own arrow, clear of the shaft.
        const y = top + (i + 1) * rowH - 5;
        const a = colX(m.from),
          b = colX(m.to);
        const u = Math.min(1, (ms - m.send) / Math.max(0.5, m.arrive - m.send));
        const head = a + (b - a) * u,
          dir = Math.sign(b - a);
        const recent = i === current;
        return (
          <g key={m.id} className="ch-ladder-row" opacity={recent ? 1 : 0.62}>
            <path
              d={`M${a} ${y}H${head}`}
              stroke={recent ? '#f6e7c8' : '#c5ccd6'}
              strokeWidth={recent ? 2.2 : 1.5}
            />
            <path d={`M${head} ${y}l${-7 * dir} -4.5v9Z`} fill={recent ? '#f6e7c8' : '#c5ccd6'} />
            <text x={(a + b) / 2} y={y - 7} textAnchor="middle" className="ch-ladder-label">
              {t(m.label)}
            </text>
          </g>
        );
      })}
      {/* The handset's radio gap, on the same logical rows. */}
      {ms >= ladder.detachAt && (
        <rect
          x={colX(0) - 5}
          y={top + (rows.findIndex((m) => m.id === 'command') + 1) * rowH - 5}
          width="10"
          height={
            (rows.findIndex((m) => m.id === 'complete') -
              rows.findIndex((m) => m.id === 'command')) *
            rowH
          }
          rx="5"
          fill="#e0786c"
          opacity={ms >= ladder.attachAt ? 0.45 : 0.8}
        />
      )}
      <g className="ch-ladder-timeline">
        <text x={tl} y={timelineTop + 14} className="ch-ladder-sub">
          {t(compact ? '收到的数据包（毫秒）' : '手机收到的数据包 · 按真实毫秒')}
        </text>
        <path d={`M${tl} ${timelineTop + 56}H${tr}`} stroke="#8d99ad" strokeOpacity=".4" />
        {[0, 20, 40, 60, 80].map((v) => (
          <text key={v} x={tx(v)} y={timelineTop + 106} textAnchor="middle" className="ch-axis">
            {v === 80 ? '80 ms' : v}
          </text>
        ))}
        {(['source', 'forwarded', 'direct'] as const).map((k, n) => {
          const label = t(k === 'source' ? '经源基站' : k === 'forwarded' ? '转发' : '新路径');
          const row = twoRows && n === 2 ? 1 : 0;
          const x = tl + (row ? 0 : [0, 1, 2].slice(0, n).reduce((w, m) => w + legendWidth[m], 0));
          const y = timelineTop + 120 + row * 24;
          return (
            <g key={k}>
              <rect x={x} y={y} width="4" height="14" rx="2" fill={pathColor[k]} />
              <text x={x + 10} y={y + 12} className="ch-ladder-sub">
                {label}
              </text>
            </g>
          );
        })}
        {delivered.map((p) => (
          <rect
            key={p.id}
            x={tx(p.delivered) - tickW / 2}
            y={timelineTop + 46}
            width={tickW}
            height="20"
            rx={tickW / 2}
            fill={pathColor[p.path]}
          />
        ))}
        {numbered
          .filter((p) => p.delivered <= ms)
          .map((p, k) => (
            <text
              key={p.id}
              x={tx(p.delivered) + (k === 0 ? 2 : -2)}
              y={timelineTop + 84}
              textAnchor={k === 0 ? 'end' : 'start'}
              className="ch-packet-id"
              style={{ fill: pathColor[p.path] }}
            >
              #{p.id}
            </text>
          ))}
        {(gapOpen || gapShown) && (
          <g>
            <rect
              x={tx(ladder.lastOld) + 3}
              y={timelineTop + 49}
              width={Math.max(0, tx(gapShown ? ladder.firstNew : ms) - tx(ladder.lastOld) - 6)}
              height="14"
              rx="7"
              fill="#e0786c"
              opacity=".35"
            />
            {gapShown && (
              <text
                x={Math.max(
                  tl + textW(t('下行空档 {0} ms', ladder.gapMs)) / 2,
                  (tx(ladder.lastOld) + tx(ladder.firstNew)) / 2,
                )}
                y={timelineTop + 38}
                textAnchor="middle"
                className="ch-gap-label"
              >
                {t('下行空档 {0} ms', ladder.gapMs)}
              </text>
            )}
          </g>
        )}
        <path
          d={`M${tx(Math.min(t1, Math.max(t0, ms)))} ${timelineTop + 42}V${timelineTop + 70}`}
          stroke="#f6e7c8"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

export const CH_PATH_COLORS = pathColor;
