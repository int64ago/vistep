import type { ReactNode } from 'react';
import { t } from '../../i18n';
import { MR_COLORS as C, type MrLayout } from './MobileRoamingMap';
import {
  MR_IMSI,
  MR_HOME,
  MR_MSRN,
  MR_RECORD_BEFORE,
  mrHomeRealm,
  plmnCode,
  type AkaRun,
  type DataRoute,
  type Selection,
  type VisitedOperator,
  type Caller,
} from '../../models/mobile-roaming';
import { mrHex, type Bytes } from '../../models/mobile-roaming-milenage';

const fade = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const p = fade(v);
  return p * p * (3 - 2 * p);
};
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const LANES_ZH = ['手机', '当地网络', 'IPX', '归属网络'];

/** Lane heads shared by the map and every ladder: the same four places, top to bottom. */
export function MrLaneHeads({ layout }: { layout: MrLayout }) {
  return (
    <svg className="mr-lanes" viewBox={`0 0 ${layout.W} 30`} aria-hidden="true">
      {layout.lanes.map((x, i) => (
        <text key={i} x={x} y="21" textAnchor="middle" fill={i === 2 ? C.ipx : C.ink}>
          {t(LANES_ZH[i])}
        </text>
      ))}
    </svg>
  );
}

export type LadderRow = {
  key: string;
  from: number | 'right';
  to: number;
  label: string;
  sub?: string;
  p: number;
  color?: string;
  tag?: { text: string; p: number; color: string };
};

export function Ladder({
  layout,
  rows,
  rowH,
  top = 6,
  height,
  pillH = 34,
}: {
  layout: MrLayout;
  rows: LadderRow[];
  rowH: number;
  top?: number;
  height: number;
  pillH?: number;
}) {
  const { W, lanes } = layout;
  return (
    <g className="mr-ladder">
      {lanes.map((x, i) => (
        <path
          key={i}
          d={`M${x} 0V${height}`}
          stroke={i === 2 ? '#9fc0bf' : '#c9cfc6'}
          strokeWidth="1.2"
          strokeDasharray="2 5"
        />
      ))}
      {rows.map((r, i) => {
        const y = top + i * rowH + rowH * 0.56;
        const color = r.color ?? C.ink;
        const show = fade(r.p * 4);
        if (r.p <= 0) return null;
        if (r.from === r.to) {
          const w = Math.min(W - 12, layout.narrow ? 176 : 250);
          const cx = Math.min(W - w / 2 - 6, Math.max(w / 2 + 6, lanes[r.to]));
          return (
            <g key={r.key} opacity={show}>
              <rect
                x={cx - w / 2}
                y={y - pillH * 0.62}
                width={w}
                height={pillH}
                rx="12"
                fill="#fff8ea"
                stroke={color}
                strokeWidth="1.2"
              />
              <text x={cx} y={y + pillH * 0.38 - 12} textAnchor="middle" fill={color}>
                {r.label}
              </text>
            </g>
          );
        }
        const x1 = r.from === 'right' ? W - 6 : lanes[r.from],
          x2 = lanes[r.to];
        const tip = lerp(x1, x2, smooth(r.p));
        const dir = Math.sign(x2 - x1);
        const mid = (x1 + x2) / 2;
        return (
          <g key={r.key}>
            <path d={`M${x1} ${y}H${tip}`} stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path
              d={`M${tip - dir * 8} ${y - 5}L${tip} ${y}L${tip - dir * 8} ${y + 5}`}
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={x1} cy={y} r="3" fill={color} />
            <text
              x={r.from === 'right' ? W - 4 : mid}
              y={y - 9}
              textAnchor={r.from === 'right' ? 'end' : 'middle'}
              fill={color}
              opacity={show}
            >
              {r.label}
            </text>
            {r.sub && (
              <text
                x={mid}
                y={y + 21}
                textAnchor="middle"
                className="mr-sub"
                opacity={fade(r.p * 2 - 0.6)}
              >
                {r.sub}
              </text>
            )}
            {r.tag && r.tag.p > 0 && (
              <g opacity={fade(r.tag.p * 2)}>
                <rect
                  x={lanes[2] - 54}
                  y={y + 7}
                  width="108"
                  height="26"
                  rx="13"
                  fill="#eef6f3"
                  stroke={r.tag.color}
                  strokeWidth="1"
                />
                <text x={lanes[2]} y={y + 26} textAnchor="middle" fill={r.tag.color}>
                  {r.tag.text}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------- chapter 1
function Bars({ x, y, dbm, color }: { x: number; y: number; dbm: number; color: string }) {
  const lit = dbm >= -80 ? 4 : dbm >= -90 ? 3 : dbm >= -100 ? 2 : 1;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={x + i * 7}
          y={y - 4 - i * 4}
          width="5"
          height={6 + i * 4}
          rx="1.5"
          fill={i < lit ? color : '#d3d8cf'}
        />
      ))}
    </g>
  );
}
const statusText = (r: 'accepted' | 'no-agreement' | 'roaming-barred' | undefined) =>
  r === 'accepted'
    ? '注册成功'
    : r === 'no-agreement'
      ? '拒绝：无协议'
      : r === 'roaming-barred'
        ? '家里未开漫游'
        : '未尝试';

export function MrSelectPanel({
  layout,
  b,
  selection,
  watch,
  height,
}: {
  layout: MrLayout;
  b: Record<string, number>;
  selection: Selection;
  watch: boolean;
  height: number;
}) {
  const { W, narrow } = layout;
  const ops = selection.candidates.map((c) => c.operator);
  const bySignal = [...ops].sort((a, z) => z.rsrpDbm - a.rsrpDbm);
  const rowH = narrow ? 64 : 50,
    top = narrow ? 70 : 46;
  const m = smooth(b.match);
  const rank = (o: VisitedOperator) => {
    const c = selection.candidates.find((x) => x.operator === o);
    return c?.reason === 'preferred' ? c.rank : undefined;
  };
  const x = narrow
    ? { chip: 18, code: 38, bars: 104, dbm: -1, rank: 152, status: W - 6 }
    : { chip: 30, code: 56, bars: 160, dbm: 206, rank: W * 0.62, status: W - 24 };
  const chosen = selection.registered;
  return (
    <svg
      className="mr-panel"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={t('手机搜到的网络与 SIM 优选名单')}
    >
      <text x={x.chip - 12} y={narrow ? 30 : 24} className="mr-head">
        {t(m > 0.5 ? '按 SIM 名单排序' : '按信号强弱排序')}
      </text>
      {!narrow && (
        <text x={x.rank} y={24} textAnchor="middle" className="mr-head">
          {t('名单')}
        </text>
      )}
      {bySignal.map((o, si) => {
        const qi = ops.indexOf(o);
        // The home row sits first: the phone looks for home before it scans local networks.
        const y = top + (1 + lerp(si, qi, m)) * rowH;
        const appear = watch ? fade(b.scan * 3.2 - si * 0.9) : 1;
        const isChosen = chosen?.id === o.id;
        const attempt = selection.attempts.find((a) => a.operator.id === o.id);
        const r = rank(o);
        const chooseShow = watch ? fade(b.choose * 2) : 1;
        const status = watch
          ? isChosen
            ? '选中'
            : r
              ? '备选'
              : '不在名单'
          : statusText(attempt?.result);
        const statusColor = watch
          ? isChosen
            ? C.ok
            : C.muted
          : attempt?.result === 'accepted'
            ? C.ok
            : attempt
              ? C.bad
              : C.muted;
        return (
          <g key={o.id} opacity={appear} transform={`translate(0 ${y})`}>
            {isChosen && (
              <rect
                x={x.chip - 16}
                y={-19}
                width={W - x.chip + 16 - (narrow ? 2 : 12)}
                height="38"
                rx="14"
                fill="#e6f1e8"
                opacity={chooseShow}
              />
            )}
            <circle cx={x.chip} cy="0" r="12" fill={C.op[o.id]} />
            <text x={x.chip} y="5.5" textAnchor="middle" className="mr-chip">
              {o.id}
            </text>
            <text x={x.code} y="5.5" className="mr-code">
              <tspan fill={C.mcc}>{o.plmn.mcc}</tspan>-<tspan fill={C.mnc}>{o.plmn.mnc}</tspan>
            </text>
            <Bars x={x.bars} y={9} dbm={o.rsrpDbm} color={C.op[o.id]} />
            {x.dbm > 0 && (
              <text x={x.dbm} y="5.5" className="mr-num">
                {o.rsrpDbm} dBm
              </text>
            )}
            <text
              x={x.rank}
              y="5.5"
              textAnchor="middle"
              className="mr-num"
              fill={r ? C.ink : C.muted}
              opacity={watch ? fade(b.match * 3) : 1}
            >
              {r ? `#${r}` : '—'}
            </text>
            <text x={x.status} y="5.5" textAnchor="end" fill={statusColor} opacity={chooseShow}>
              {t(status)}
            </text>
          </g>
        );
      })}
      <g opacity={watch ? fade(b.home * 2) : 1} transform={`translate(0 ${top})`}>
        <circle
          cx={x.chip}
          cy="0"
          r="12"
          fill="none"
          stroke="#a79a86"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        <text x={x.code} y="5.5" className="mr-code" fill={C.muted}>
          <tspan fill={C.mcc}>{MR_HOME.mcc}</tspan>-<tspan fill={C.mnc}>{MR_HOME.mnc}</tspan>
        </text>
        <text x={narrow ? x.bars : x.bars} y="5.5" fill={C.muted}>
          {t(narrow ? '家乡网络：无信号' : '家乡网络：这里收不到')}
        </text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------- chapter 2
export function MrIdentityPanel({
  layout,
  b,
  height,
}: {
  layout: MrLayout;
  b: Record<string, number>;
  height: number;
}) {
  const { W, narrow } = layout;
  const digits = [...MR_IMSI];
  const cell = narrow ? Math.min(21, (W - 16) / 15) : 30;
  const card = narrow ? { x: 8, y: 6, w: 104, h: 68 } : { x: 24, y: 26, w: 176, h: 112 };
  const dx = narrow ? (W - cell * 15) / 2 : card.x + card.w + 56;
  const dy = narrow ? 176 : 76;
  const readN = b.read * 15;
  const split = smooth(b.split);
  const group = (i: number) => (i < 3 ? 0 : i < 5 ? 1 : 2);
  const colors = [C.mcc, C.mnc, C.msin];
  const gap = narrow ? 5 : 10;
  const xOf = (i: number) => dx + i * cell + split * gap * group(i);
  const names = [
    ['MCC', '国家'],
    ['MNC', '运营商'],
    ['MSIN', '用户编号'],
  ];
  const ranges = [
    [0, 2],
    [3, 4],
    [5, 14],
  ];
  const realm = mrHomeRealm(MR_HOME);
  const realmY = narrow ? 322 : 224;
  const rs = smooth(b.realm);
  // The key sentence: K is on the card too, and never read out.
  const keyGlow = smooth((b.key ?? 0) * 2.5);
  const realmParts = [
    { s: 'epc.mnc', c: C.muted },
    { s: '0', c: C.muted },
    { s: MR_HOME.mnc, c: C.mnc },
    { s: '.mcc', c: C.muted },
    { s: MR_HOME.mcc, c: C.mcc },
    { s: '.3gppnetwork.org', c: C.muted },
  ];
  // Chip contact geometry: an ISO/IEC 7816 style 2×4 pad.
  const chip = {
    x: card.x + card.w * 0.12,
    y: card.y + card.h * 0.3,
    w: card.w * 0.3,
    h: card.h * 0.42,
  };
  return (
    <svg
      className="mr-panel"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={t('SIM 卡中的 IMSI 被拆成国家码、运营商码和用户编号')}
    >
      <g className="mr-sim">
        <path
          d={`M${card.x + 12} ${card.y}H${card.x + card.w - 22}L${card.x + card.w} ${card.y + 22}V${card.y + card.h - 12}Q${card.x + card.w} ${card.y + card.h} ${card.x + card.w - 12} ${card.y + card.h}H${card.x + 12}Q${card.x} ${card.y + card.h} ${card.x} ${card.y + card.h - 12}V${card.y + 12}Q${card.x} ${card.y} ${card.x + 12} ${card.y}Z`}
          fill="#f7f4ec"
          stroke="#b9b3a3"
          strokeWidth="1.4"
        />
        <rect
          x={chip.x}
          y={chip.y}
          width={chip.w}
          height={chip.h}
          rx="6"
          fill="#e3c77f"
          stroke="#b08c35"
          strokeWidth="1.2"
        />
        <path
          d={`M${chip.x + chip.w / 2} ${chip.y}V${chip.y + chip.h}M${chip.x} ${chip.y + chip.h / 4}H${chip.x + chip.w * 0.36}M${chip.x} ${chip.y + chip.h / 2}H${chip.x + chip.w}M${chip.x} ${chip.y + (chip.h * 3) / 4}H${chip.x + chip.w * 0.36}M${chip.x + chip.w * 0.64} ${chip.y + chip.h / 4}H${chip.x + chip.w}M${chip.x + chip.w * 0.64} ${chip.y + (chip.h * 3) / 4}H${chip.x + chip.w}`}
          stroke="#a8812c"
          strokeWidth="1"
        />
        <g transform={`translate(${card.x + card.w * 0.66} ${card.y + card.h * 0.5})`}>
          {keyGlow > 0 && (
            <rect
              x={-18 - 8 * keyGlow}
              y={-13 - 8 * keyGlow}
              width={40 + 16 * keyGlow}
              height={26 + 16 * keyGlow}
              rx="14"
              fill={C.key}
              opacity={0.16 * keyGlow}
            />
          )}
          <rect
            x={-18}
            y={-13}
            width="40"
            height="26"
            rx="8"
            fill="#fbf1d9"
            stroke={C.key}
            strokeWidth="1.2"
          />
          <circle cx={-6} cy="0" r="4.2" fill="none" stroke={C.key} strokeWidth="1.8" />
          <path
            d="M-1.6 0H12M9 0V4M12 0V3"
            stroke={C.key}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      </g>
      <text
        x={card.x}
        y={card.y + card.h + (narrow ? 26 : 30)}
        fill={C.key}
        fontWeight={keyGlow > 0.5 ? 600 : undefined}
      >
        {t('密钥 K 留在卡里')}
      </text>
      <text x={card.x} y={card.y + card.h + (narrow ? 50 : 54)} className="mr-sub">
        {t('卡里还写着 IMSI')}
      </text>
      {digits.map((d, i) => {
        const on = fade(readN - i);
        const g = group(i);
        return (
          <g key={i} opacity={0.12 + 0.88 * on}>
            <rect
              x={xOf(i) + 1}
              y={dy - 24}
              width={cell - 2}
              height="34"
              rx="7"
              fill={split > 0 ? '#ffffff' : '#f6f3ea'}
              stroke={split > 0 ? colors[g] : '#d9d4c6'}
              strokeOpacity={0.35 + 0.4 * split}
            />
            <text
              x={xOf(i) + cell / 2}
              y={dy}
              textAnchor="middle"
              className="mr-digit"
              fill={split > 0.3 ? colors[g] : C.ink}
            >
              {d}
            </text>
          </g>
        );
      })}
      {names.map(([code, zh], gi) => {
        const [a, z] = ranges[gi];
        const x1 = xOf(a) + 2,
          x2 = xOf(z) + cell - 2;
        const y = dy + 22;
        return (
          <g key={code} opacity={split}>
            <path d={`M${x1} ${y}v6H${x2}v-6`} stroke={colors[gi]} strokeWidth="1.5" fill="none" />
            <text
              x={(x1 + x2) / 2}
              y={y + 26}
              textAnchor="middle"
              fill={colors[gi]}
              className="mr-code"
            >
              {code}
            </text>
            <text
              x={(x1 + x2) / 2}
              y={y + (cell < 20 && gi === 1 ? 70 : 48)}
              textAnchor="middle"
              className="mr-sub"
            >
              {t(zh)}
            </text>
          </g>
        );
      })}
      <g opacity={rs}>
        <text
          x={narrow ? W / 2 : dx}
          y={realmY - 30}
          textAnchor={narrow ? 'middle' : 'start'}
          className="mr-sub"
        >
          {t(narrow ? '当地网络据此找到你家' : '当地网络据此拼出你家的地址')}
        </text>
        <text
          x={narrow ? W / 2 : dx}
          y={realmY}
          textAnchor={narrow ? 'middle' : 'start'}
          className="mr-realm"
        >
          {realmParts.map((p, i) => (
            <tspan
              key={i}
              fill={p.c}
              opacity={i === 1 ? 0.55 : 1}
              x={narrow && i === realmParts.length - 1 ? W / 2 : undefined}
              dy={narrow && i === realmParts.length - 1 ? 24 : undefined}
            >
              {p.s}
            </tspan>
          ))}
        </text>
      </g>
      <title>{realm}</title>
    </svg>
  );
}

// ---------------------------------------------------------------- chapter 4
type Mark = 'bad' | 'good' | null;
function ByteRow({
  x,
  y,
  bytes,
  cell,
  perRow,
  reveal = 1,
  color,
  fill = '#fffdf7',
  mark,
  dim = false,
  gaps = [],
  gap = 10,
  pitch = 32,
}: {
  x: number;
  y: number;
  bytes: Bytes;
  cell: number;
  perRow: number;
  reveal?: number;
  color: string;
  fill?: string;
  mark?: (i: number) => Mark;
  dim?: boolean;
  /** Indices before which an extra gap separates fields (e.g. SQN⊕AK | AMF | MAC). */
  gaps?: number[];
  gap?: number;
  pitch?: number;
}) {
  const hex = mrHex(bytes);
  return (
    <g>
      {Array.from(bytes, (_, i) => {
        const col = i % perRow;
        const extra = gaps.filter((g) => g <= col && g > 0).length * gap;
        const cx = x + col * cell + extra,
          cy = y + Math.floor(i / perRow) * pitch;
        const on = fade(reveal * bytes.length - i);
        const m = mark?.(i) ?? null;
        const stroke = m === 'bad' ? C.bad : m === 'good' ? C.ok : '#d9d5c8';
        return (
          <g key={i} opacity={0.08 + 0.92 * on}>
            <rect
              x={cx + 1.5}
              y={cy}
              width={cell - 3}
              height="28"
              rx="7"
              fill={m === 'bad' ? '#f7dfd6' : m === 'good' ? '#e4f0e6' : fill}
              stroke={stroke}
              strokeWidth={m ? 1.5 : 1}
            />
            <text
              x={cx + cell / 2}
              y={cy + 20}
              textAnchor="middle"
              className="mr-hex"
              fill={m === 'bad' ? C.bad : color}
              opacity={dim ? 0.6 : 1}
            >
              {hex.slice(i * 2, i * 2 + 2)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

type ProveRow = {
  key: string;
  label: string;
  sub?: string;
  labelColor: string;
  bytes: Bytes;
  color: string;
  fill?: string;
  reveal?: number;
  opacity?: number;
  mark?: (i: number) => Mark;
  dim?: boolean;
  gaps?: number[];
  /** Desktop: first cell column (0–15) so XMAC sits exactly under AUTN's MAC field. */
  col?: number;
  /** Desktop: text drawn right-aligned in the free space before the cells. */
  aside?: { text: string; color: string; opacity?: number };
  /** Desktop: extra cells drawn after "≤" on the same row. */
  pair?: Bytes;
};

/**
 * AKA seen as data. The film follows the narration: RAND and AUTN arrive, the SIM recomputes the
 * MAC with K (XMAC) and matches it against AUTN, then derives RES, which the visited network
 * compares with the XRES it has held from the start. A flipped key bit is shown as a hypothesis.
 */
export function MrProvePanel({
  layout,
  b,
  run,
  flipped,
  watch,
  height,
}: {
  layout: MrLayout;
  b: Record<string, number>;
  run: AkaRun;
  flipped: AkaRun;
  watch: boolean;
  height: number;
}) {
  const { W, narrow } = layout;
  const flipOn = watch && b.flip > 0.5;
  const shown = flipOn ? flipped : run;
  const stale = !watch && shown.outcome === 'sync-failure';
  const macFail = watch ? flipOn : !shown.sim.macOk;
  const macSeen = watch ? fade(b.mac * 1.6) : 1;
  const macDone = watch ? b.mac >= 1 : true;
  const compared = watch ? b.compare >= 1 || flipOn : true;
  const cell = narrow ? Math.min(40, (W - 8) / 8) : Math.min(40, (W - 236) / 16);
  const x0 = narrow ? (W - cell * 8) / 2 : 196;
  const autnGaps = [6, 8];
  const gapPx = 10;
  const keyByte = flipOn
    ? flipped.keyBit >> 3
    : !watch && shown.tamper === 'key'
      ? shown.keyBit >> 3
      : -1;
  const macMark = (i: number): Mark =>
    !macDone
      ? null
      : shown.sim.macOk
        ? 'good'
        : shown.sim.mac[i] !== shown.sim.xmac[i]
          ? 'bad'
          : null;
  const resMark = (i: number): Mark =>
    !compared || stale
      ? null
      : shown.resMatches
        ? 'good'
        : (!watch || b.diff > 0) && shown.sim.res[i] !== shown.vector.xres[i]
          ? 'bad'
          : null;
  const macVerdict = !macDone
    ? ''
    : macFail
      ? t(watch ? '假如 K 错一位：XMAC ≠ MAC，SIM 拒绝' : 'XMAC ≠ MAC：SIM 拒绝这次挑战')
      : t('XMAC = MAC：请求确实来自家里');
  const resVerdict = stale
    ? t('SIM 不发 RES，改发 AUTS')
    : shown.resMatches
      ? t('RES = XRES，认证通过')
      : watch && b.diff <= 0
        ? ''
        : t('64 位里有 {0} 位不同', shown.resBitDistance);
  const resSub = stale
    ? '家里据此重新同步序号'
    : shown.resMatches
      ? '只比较结果，从不比较 K'
      : shown.tamper === 'rand'
        ? '挑战被改，应答也全变了'
        : '密钥差一位，应答面目全非';
  const resLabel = flipOn
    ? 'RES′（假如 K 错一位）'
    : !watch && !shown.sim.macOk
      ? 'RES′（SIM 不会发出）'
      : 'RES 手机的应答';
  const mac = shown.vector.autn.slice(8, 16);
  const forward = watch ? fade(b.forward * 1.4) : 1;

  const rand: ProveRow = {
    key: 'rand',
    label: t('RAND 随机挑战'),
    labelColor: C.mnc,
    bytes: shown.received.rand,
    color: C.mnc,
    reveal: forward,
    mark: (i) =>
      !watch && shown.tamper === 'rand' && shown.received.rand[i] !== shown.vector.rand[i]
        ? 'bad'
        : null,
  };
  const key: ProveRow = {
    key: 'k',
    label: t(narrow ? 'SIM 里的 K（不发送）' : 'K 密钥（不发送）'),
    labelColor: C.key,
    bytes: shown.simKey,
    color: C.key,
    fill: '#fbf4e1',
    dim: true,
    mark: (i) => (i === keyByte ? 'bad' : null),
  };
  const autn: ProveRow = {
    key: 'autn',
    label: t('AUTN 校验码'),
    sub: 'SQN⊕AK · AMF · MAC',
    labelColor: C.mnc,
    bytes: shown.vector.autn,
    color: C.mnc,
    reveal: forward,
    gaps: autnGaps,
    // AUTN is genuine: its MAC turns green on a match; a mismatch is marked on XMAC instead.
    mark: (i) => (i >= 8 && macMark(i - 8) === 'good' ? 'good' : null),
  };
  const macRow: ProveRow = {
    key: 'mac',
    label: t('AUTN 里的 MAC（末 8 字节）'),
    labelColor: C.mnc,
    bytes: mac,
    color: C.mnc,
    reveal: forward,
    mark: (i) => (macMark(i) === 'good' ? 'good' : null),
  };
  const xmac: ProveRow = {
    key: 'xmac',
    label: narrow ? (macDone ? macVerdict : t('XMAC：SIM 用 K 重算')) : 'XMAC',
    sub: t('SIM 用 K 重算'),
    labelColor: macDone ? (macFail ? C.bad : C.ok) : C.ink,
    bytes: shown.sim.xmac,
    color: C.ink,
    reveal: macSeen,
    col: 8,
    mark: macMark,
    aside: { text: macVerdict, color: macFail ? C.bad : C.ok, opacity: macDone ? 1 : 0 },
  };
  const res: ProveRow = {
    key: 'res',
    label: t(resLabel),
    labelColor: flipOn || (!watch && !shown.sim.macOk) ? C.bad : C.ok,
    bytes: shown.sim.res,
    color: C.ok,
    reveal: watch ? fade(b.res) : 1,
    mark: resMark,
  };
  const xres: ProveRow = {
    key: 'xres',
    label: narrow ? t('XRES 当地网络保管') : 'XRES',
    sub: narrow ? undefined : t('当地网络保管'),
    labelColor: C.ink,
    bytes: shown.vector.xres,
    color: C.ink,
    opacity: watch ? 0.35 + 0.65 * fade(b.compare * 2) : 1,
    mark: (i) => (resMark(i) === 'good' ? 'good' : null),
  };
  const sqn: ProveRow = {
    key: 'sqn',
    label: narrow ? t('SQN：收到的序号') : 'SQN ≤ SQN_MS',
    sub: narrow ? undefined : t('收到的序号已用过'),
    labelColor: C.bad,
    bytes: shown.sim.sqn,
    color: C.ink,
    mark: () => 'bad',
    pair: narrow ? undefined : shown.sim.sqnMs,
  };
  const sqnMs: ProveRow = {
    key: 'sqnms',
    label: t('SQN_MS：SIM 记下的最大序号'),
    labelColor: C.ink,
    bytes: shown.sim.sqnMs,
    color: C.ink,
  };
  const auts: ProveRow = {
    key: 'auts',
    label: t('AUTS 重新同步'),
    labelColor: C.bad,
    bytes: shown.sim.auts ?? new Uint8Array(14),
    color: C.bad,
  };

  // Which rows exist, and where.
  let rows: ProveRow[];
  if (!narrow)
    rows = stale ? [rand, key, autn, xmac, sqn, auts] : [rand, key, autn, xmac, res, xres];
  else if (!watch)
    rows = stale
      ? [rand, key, macRow, xmac, sqn, sqnMs, auts]
      : [rand, key, macRow, xmac, res, xres];
  else {
    // Phone film keeps one stable height: slot B shows the MAC check, then RES in XMAC's place.
    const resPhase = b.res > 0 || flipOn;
    rows = resPhase ? [rand, key, macRow, res, xres] : [rand, key, macRow, xmac, xres];
    if (resPhase && !flipOn) macRow.label = t('AUTN 的 MAC 已核对 ✓');
    if (flipOn) {
      macRow.label = t('假如 K 错一位：XMAC′ ≠ MAC');
      macRow.labelColor = C.bad;
      macRow.bytes = shown.sim.xmac;
      macRow.color = C.bad;
      macRow.mark = macMark;
    }
  }

  const out: ReactNode[] = [];
  let y = narrow ? 22 : 8;
  const rowGap = narrow ? 24 : 10;
  let verdictY = 0;
  for (const r of rows) {
    const perRow = narrow ? 8 : 16;
    const lines = Math.ceil(r.bytes.length / perRow);
    const colOffset = !narrow && r.col ? r.col * cell + autnGaps.length * gapPx : 0;
    const cellsX = x0 + colOffset;
    out.push(
      <g key={r.key} opacity={r.opacity ?? 1}>
        <text
          x={narrow ? x0 + 2 : 20}
          y={narrow ? y - 8 : y + (r.sub ? 12 : 20)}
          className="mr-head"
          fill={r.labelColor}
        >
          {r.label}
        </text>
        {!narrow && r.sub && (
          <text x={20} y={y + 32} className="mr-sub">
            {r.sub}
          </text>
        )}
        {!narrow && r.aside && r.aside.text && (
          <text
            x={cellsX - 14}
            y={y + 20}
            textAnchor="end"
            fill={r.aside.color}
            opacity={r.aside.opacity ?? 1}
            className="mr-verdict"
          >
            {r.aside.text}
          </text>
        )}
        <ByteRow
          x={cellsX}
          y={y}
          bytes={r.bytes}
          cell={cell}
          perRow={perRow}
          reveal={r.reveal}
          color={r.color}
          fill={r.fill}
          mark={r.mark}
          dim={r.dim}
          gaps={r.gaps}
          gap={gapPx}
        />
        {r.pair && (
          <>
            <text x={cellsX + r.bytes.length * cell + 16} y={y + 20} textAnchor="middle">
              ≤
            </text>
            <ByteRow
              x={cellsX + r.bytes.length * cell + 32}
              y={y}
              bytes={r.pair}
              cell={cell}
              perRow={perRow}
              color={C.ink}
            />
          </>
        )}
      </g>,
    );
    if (r.key === 'xres' || r.key === 'sqn') verdictY = y;
    y += lines * 32 + (narrow ? rowGap : r.sub ? 16 : 10);
  }
  const verdictRight = !narrow;
  const vx = verdictRight ? x0 + (stale ? 12 * cell + 44 : 8 * cell) + 24 : W / 2;
  return (
    <svg
      className="mr-panel"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={t('SIM 用密钥和随机数计算应答并与期望值比较')}
    >
      {out}
      <g opacity={watch ? (flipOn ? fade(b.diff * 3) : fade(b.compare * 2)) : 1}>
        <text
          x={vx}
          y={verdictRight ? verdictY + (stale ? 20 : 14) : y + 2}
          textAnchor={verdictRight ? 'start' : 'middle'}
          fill={shown.resMatches && !stale ? C.ok : C.bad}
          className="mr-verdict"
        >
          {resVerdict}
        </text>
        {verdictRight && !stale && (
          <text x={vx} y={verdictY + 38} className="mr-sub">
            {t(resSub)}
          </text>
        )}
      </g>
    </svg>
  );
}

export function MrRecordCard({
  layout,
  b,
  y,
  accepted = true,
  serving,
}: {
  layout: MrLayout;
  b: Record<string, number>;
  y: number;
  accepted?: boolean;
  serving: VisitedOperator | null;
}) {
  const { W, narrow } = layout;
  const w = narrow ? W - 8 : Math.min(620, W - 80);
  const x = (W - w) / 2;
  const write = accepted ? smooth(b.write) : 0;
  const pad = narrow ? 14 : 22;
  const col = narrow ? 88 : 132;
  const plmn = serving ? plmnCode(serving.plmn) : '—';
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={narrow ? 124 : 108} rx="18" fill="#fffaf0" stroke="#d8c7a6" />
      <text x={pad} y="28" className="mr-head" fill="#8a6a3a">
        {t('归属网络里的用户记录')}
      </text>
      <text x={w - pad} y="28" textAnchor="end" className="mr-sub">
        HSS
      </text>
      <text x={pad} y={narrow ? 62 : 58} className="mr-sub">
        {t('你在哪')}
      </text>
      {/* Swap, never overlap: the old entry fades out before the new one fades in. */}
      <g opacity={fade(1 - write * 2)}>
        <text x={pad + col} y={narrow ? 62 : 58} className="mr-code">
          {plmnCode(MR_RECORD_BEFORE.servingPlmn)} {t('家乡')}
        </text>
      </g>
      <g opacity={fade(write * 2 - 1)}>
        <text x={pad + col} y={narrow ? 62 : 58} className="mr-code" fill={C.ok}>
          {plmn} {t('当地 {0}', serving?.id ?? '')}
        </text>
      </g>
      <text x={pad} y={narrow ? 96 : 88} className="mr-sub">
        {t('允许')}
      </text>
      <text
        x={pad + col}
        y={narrow ? 96 : 88}
        opacity={accepted ? fade(b.ula * 2) : 1}
        fill={accepted ? C.ink : C.bad}
      >
        {accepted
          ? t(narrow ? '数据漫游 ✓ 语音 ✓' : '数据漫游 ✓ · 语音 ✓ · APN internet')
          : t('未开通国际漫游')}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------- chapter 6
const legColor: Record<string, string> = {
  radio: '#9aa59e',
  ipx: C.ipx,
  'internet-abroad': C.internet,
  domestic: C.ok,
};
export function MrDataPanel({
  layout,
  routes,
  reveal,
  destination,
  height,
  scaleMs,
}: {
  layout: MrLayout;
  routes: DataRoute[];
  reveal: number[];
  destination: 'local' | 'home';
  height: number;
  scaleMs: number;
}) {
  const { W, narrow } = layout;
  const x0 = narrow ? 8 : 230,
    x1 = W - (narrow ? 8 : 110);
  const rowY = narrow ? [92, 226] : [62, 150];
  const names = { 'home-routed': '绕回家再出去', 'local-breakout': '在当地出去' };
  return (
    <svg
      className="mr-panel"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={t('同一个请求在两种漫游数据路径下的往返时间')}
    >
      <text x={narrow ? 8 : 20} y={narrow ? 40 : 24} className="mr-head">
        {t(
          narrow
            ? destination === 'local'
              ? '同一请求：当地网站'
              : '同一请求：家乡网站'
            : destination === 'local'
              ? '同一个请求：打开当地的网站'
              : '同一个请求：打开家乡的网站',
        )}
      </text>
      {routes.map((r, i) => {
        const y = rowY[i];
        const f = smooth(reveal[i]);
        let cursor = x0;
        const total = r.rttMs;
        return (
          <g key={r.breakout} opacity={0.15 + 0.85 * fade(reveal[i] * 3)}>
            <text
              x={narrow ? 8 : 20}
              y={narrow ? y - 12 : y + 5}
              fill={r.breakout === 'home-routed' ? C.ipx : C.ok}
              className="mr-head"
            >
              {t(names[r.breakout])}
            </text>
            {!narrow && (
              <text x={20} y={y + 29} className="mr-sub">
                {r.breakout}
              </text>
            )}
            <rect x={x0} y={y - 10} width={x1 - x0} height="20" rx="10" fill="#eceee6" />
            {[...r.legs, { id: 'nodes', rttMs: r.nodes.length * 2, km: 0 }].map((leg) => {
              const w = (leg.rttMs / scaleMs) * (x1 - x0) * f;
              const seg = (
                <rect
                  key={leg.id}
                  x={cursor}
                  y={y - 10}
                  width={Math.max(0, w)}
                  height="20"
                  fill={legColor[leg.id] ?? '#c3c7bd'}
                />
              );
              cursor += w;
              return seg;
            })}
            <text
              x={narrow ? x1 : x1 + 14}
              y={narrow ? y - 12 : y + 6}
              textAnchor={narrow ? 'end' : 'start'}
              className="mr-num-big"
              opacity={fade(reveal[i] * 2 - 0.4)}
            >
              {Math.round(total * f)} ms
            </text>
            <text x={x0} y={y + 36} className="mr-sub" opacity={fade(reveal[i] * 2 - 0.6)}>
              {t('网站看到的地址')}
              {narrow ? '' : ' '}
              <tspan
                className="mr-code"
                fill={C.ink}
                x={narrow ? x0 : undefined}
                dy={narrow ? 24 : undefined}
              >
                {r.publicAddress}
              </tspan>{' '}
              · {t(r.addressCountry === 'home' ? '家乡' : '旅行地')}
            </text>
          </g>
        );
      })}
      <g
        transform={`translate(${narrow ? 8 : x0} ${narrow ? 334 : height - 30})`}
        className="mr-legend"
      >
        {(
          [
            ['radio', '无线'],
            ['ipx', 'IPX'],
            ['internet-abroad', '跨国互联网'],
            ['domestic', '本国线路'],
          ] as const
        ).map(([id, label], i) => {
          const pos = narrow ? [(i % 2) * 150, Math.floor(i / 2) * 26] : [i * 150, 0];
          return (
            <g key={id} transform={`translate(${pos[0]} ${pos[1]})`}>
              <rect x="0" y="-11" width="14" height="14" rx="4" fill={legColor[id]} />
              <text x="22" y="1">
                {t(label)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const mrCallLabels = (caller: Caller, narrow: boolean) => ({
  dial:
    caller === 'home'
      ? narrow
        ? '家人拨号'
        : '家人拨你的号码'
      : narrow
        ? '朋友拨号'
        : '当地朋友拨你的号码',
  sri: narrow ? 'HLR：在 002-01' : '查记录：你在 002-01',
  prn: narrow ? '要漫游号码' : '要一个临时漫游号码',
  msrn: `MSRN ${MR_MSRN}`,
  route: narrow ? '接通（跨国）' : '按 MSRN 接通（跨国）',
  page: narrow ? '寻呼·响铃' : '寻呼 · 响铃',
});
