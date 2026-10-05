import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import {
  ESIM_OBJECT,
  ESIM_SEGMENTS,
  esimPackageBits,
  esimShot,
  type EsimFault,
  type EsimProfileId,
  type EsimShot,
} from '../../models/esim';
import '../../styles/esim.css';

const ink = '#344c47',
  teal = '#237b75',
  gold = '#b68335',
  faded = '#9aa79e',
  red = '#a45649';
const profileName = (id: EsimProfileId) => t(id === 'home' ? '日常线路' : '旅行线路');
const errorLabel = (fault: EsimFault | 'order' | null) =>
  fault === 'server'
    ? '证书不可信，下载停止'
    : fault === 'recipient'
      ? '目标芯片不同，拒绝安装'
      : fault === 'integrity'
        ? '完整性校验失败，拒绝安装'
        : fault === 'offline'
          ? '没有互联网，尚未取件'
          : fault === 'order'
            ? '前置步骤未完成'
            : '';

function Lock({ x, y, color = gold }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-7 0V-6a7 7 0 0 1 14 0V0" fill="none" stroke={color} strokeWidth="2" />
      <rect x="-11" y="0" width="22" height="17" rx="4" fill={color} />
      <circle cy="7" r="2" fill="#fbf8ef" />
    </g>
  );
}
function Chip({
  x,
  y,
  scale = 1,
  glow = false,
}: {
  x: number;
  y: number;
  scale?: number;
  glow?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <path d={`M-7 ${6 + i * 6}H0M36 ${6 + i * 6}H43`} stroke={gold} strokeWidth="3" />
          <path d={`M${6 + i * 6} -7V0M${6 + i * 6} 36V43`} stroke={gold} strokeWidth="3" />
        </g>
      ))}
      <rect width="36" height="36" rx="5" fill={glow ? teal : '#36443f'} stroke="#82988b" />
      <rect x="5" y="5" width="26" height="26" rx="3" fill="#9d8a5c" opacity=".6" />
      <path d="M9 10H27M9 15H27M9 20H27M9 25H21" stroke="#f1dfac" opacity=".7" strokeWidth="1.2" />
    </g>
  );
}
function Phone({
  x,
  y,
  scale = 1,
  reveal,
}: {
  x: number;
  y: number;
  scale?: number;
  reveal: number;
}) {
  const o = ESIM_OBJECT;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect
        x="3"
        y="5"
        width={o.phoneWidth}
        height={o.phoneHeight}
        rx="23"
        fill="#b8beb7"
        opacity=".24"
      />
      <rect
        width={o.phoneWidth}
        height={o.phoneHeight}
        rx="23"
        fill="#c6cec6"
        stroke="#6c7d73"
        strokeWidth="1.5"
      />
      <rect x="6" y="7" width="138" height="264" rx="18" fill="#263e36" />
      <g opacity={reveal}>
        <rect
          {...{ x: o.board.x, y: o.board.y, width: o.board.w, height: o.board.h }}
          rx="9"
          fill="#486b53"
        />
        <path
          d="M20 30H55V38H96V30H130M27 51V102H75V164M115 85H93V145H96M48 62V125H112V182M28 176H66V190H111"
          fill="none"
          stroke="#98ae7c"
          strokeWidth="2"
        />
        <rect x="26" y="54" width="34" height="36" rx="6" fill="#b2b7a5" />
        {[38, 66].map((cy) => (
          <circle
            key={cy}
            cx="41"
            cy={cy + 31}
            r="10"
            fill="#263f40"
            stroke="#8caaa2"
            strokeWidth="2"
          />
        ))}
        <rect x="68" y="62" width="53" height="53" rx="6" fill="#a9b4a4" stroke="#d3d8c8" />
        <rect x="79" y="71" width="31" height="29" rx="3" fill="#63796c" />
        <rect x="23" y="209" width="104" height="43" rx="6" fill="#536155" stroke="#778679" />
        <path d="M73 212V195H95V191" fill="none" stroke="#cba765" strokeWidth="3" />
        <Chip x={o.chip.x} y={o.chip.y} scale={0.75} glow={reveal > 0.9} />
        <path d="M39 120V147H59V169" fill="none" stroke="#bfab71" strokeWidth="2" />
      </g>
      <rect
        x="6"
        y="7"
        width="138"
        height="264"
        rx="18"
        fill="#eef4eb"
        opacity={(1 - reveal) * 0.95}
      />
      <rect x="50" y="15" width="50" height="6" rx="3" fill="#344b43" opacity={1 - reveal * 0.7} />
      <path d="M150 56v29M150 108v48" stroke="#556a60" strokeWidth="3" />
    </g>
  );
}
function Hardware({ shot, width }: { shot: EsimShot; width: number }) {
  const narrow = width < 600,
    px = narrow ? 16 : width * 0.19 - 75,
    py = 31,
    scale = narrow ? 0.8 : 1;
  const chipX = narrow ? width - 146 : width * 0.65 - 45,
    chipY = 119;
  const anchorX = px + (ESIM_OBJECT.chip.x + ESIM_OBJECT.chip.w / 2) * scale,
    anchorY = py + (ESIM_OBJECT.chip.y + ESIM_OBJECT.chip.h / 2) * scale;
  return (
    <svg
      viewBox={`0 0 ${width} 342`}
      role="img"
      aria-label={t('手机切面显示焊在主板上的 eUICC 安全芯片，放大图与同一芯片相连')}
    >
      <Phone x={px} y={py} scale={scale} reveal={shot.reveal} />
      <path
        d={`M${anchorX} ${anchorY}H${chipX - 20}V${chipY + 30}H${chipX}`}
        fill="none"
        stroke={gold}
        strokeDasharray="4 5"
        opacity={shot.reveal}
      />
      <g opacity={shot.reveal}>
        <Chip x={chipX + 28} y={chipY} scale={2} glow />
        <text x={chipX + 64} y={chipY - 34} textAnchor="middle">
          eUICC
        </text>
        <text x={chipX + 64} y={chipY + 114} textAnchor="middle">
          {t('安全芯片仍在')}
        </text>
        <Lock x={chipX + 64} y={chipY + 137} color={teal} />
      </g>
      <text x={px + 75 * scale} y="321" textAnchor="middle">
        {t('示意切面')}
      </text>
    </svg>
  );
}
function Address({ shot }: { shot: EsimShot }) {
  const bits = esimPackageBits(49);
  return (
    <div className="esim-address">
      <div className="esim-code" aria-label={t('激活码示意，不可扫描')}>
        <svg viewBox="0 0 112 112" aria-hidden="true">
          <rect width="112" height="112" rx="12" fill="#fffaf1" />
          {bits.map(
            (b, i) =>
              b && (
                <rect
                  key={i}
                  x={13 + (i % 7) * 12}
                  y={13 + Math.floor(i / 7) * 12}
                  width="8"
                  height="8"
                  rx="2"
                  fill={ink}
                />
              ),
          )}
          <path d="M6 80L105 22" stroke="#f5ecd8" strokeWidth="14" />
        </svg>
        <span>{t('不可扫描的示意')}</span>
      </div>
      <div className="esim-address-fields">
        <div>
          <span>{t('去哪里取')}</span>
          <code>SM-DP+</code>
          <strong>profile.example.invalid</strong>
        </div>
        <div>
          <span>{t('取哪份订阅')}</span>
          <strong>{t('示意取件编号')}</strong>
        </div>
        <p data-ready={shot.state.located}>
          {t(shot.state.located ? 'LPA 找到准备好的 profile' : '扫码 → LPA 读取下载线索')}
        </p>
      </div>
      <p className="esim-separation">{t('激活码里没有 IMSI，也没有网络密钥 K')}</p>
    </div>
  );
}
function Trust({ shot, width }: { shot: EsimShot; width: number }) {
  const left = width < 600 ? 66 : width * 0.24,
    right = width < 600 ? width - 66 : width * 0.76;
  const state = shot.state;
  return (
    <svg
      viewBox={`0 0 ${width} 342`}
      role="img"
      aria-label={t('先验证服务器证书，再验证芯片；双方认证后才准备绑定封包')}
    >
      <text x={left} y="48" textAnchor="middle">
        SM-DP+
      </text>
      <text x={right} y="48" textAnchor="middle">
        eUICC A
      </text>
      <path d={`M${left} 64V270M${right} 64V270`} stroke="#ccd6cb" strokeWidth="2" />
      <rect x={width / 2 - 55} y="60" width="110" height="35" rx="17" fill="#e0e9df" />
      <text x={width / 2} y="83" textAnchor="middle">
        {t('信任根')}
      </text>
      <path
        d={`M${left + 4} 126H${right - 9}`}
        stroke={state.serverVerified ? teal : faded}
        strokeWidth="2"
      />
      <path
        d={`M${right - 17} 121l8 5-8 5`}
        stroke={state.serverVerified ? teal : faded}
        fill="none"
      />
      <text x={width / 2} y="117" textAnchor="middle">
        {t('证书 + 新鲜签名')}
      </text>
      <circle
        cx={right}
        cy="144"
        r="13"
        fill={state.serverVerified ? teal : state.error === 'server' ? red : '#dde4d9'}
      />
      <text x={right} y="150" textAnchor="middle" fill="white">
        {state.serverVerified ? '✓' : state.error === 'server' ? '×' : '·'}
      </text>
      <path
        d={`M${right - 4} 218H${left + 9}`}
        stroke={state.chipVerified ? teal : faded}
        strokeWidth="2"
      />
      <path
        d={`M${left + 17} 213l-8 5 8 5`}
        stroke={state.chipVerified ? teal : faded}
        fill="none"
      />
      <text x={width / 2} y="207" textAnchor="middle">
        {t('芯片证明')}
      </text>
      <circle cx={left} cy="236" r="13" fill={state.chipVerified ? teal : '#dde4d9'} />
      <text x={left} y="242" textAnchor="middle" fill="white">
        {state.chipVerified ? '✓' : '·'}
      </text>
      <text x={width / 2} y="302" textAnchor="middle" fill={state.error ? red : ink}>
        {t(
          state.error
            ? errorLabel(state.error)
            : state.chipVerified
              ? '双方认证完成'
              : state.serverVerified
                ? '再验证芯片'
                : '先验证服务器',
        )}
      </text>
    </svg>
  );
}
function Packet({ x, y, label = 'BPP' }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-29" y="-24" width="58" height="48" rx="10" fill="#f6e3b8" stroke={gold} />
      <Lock x={0} y={-8} />
      <text x="0" y="41" textAnchor="middle" fill={gold}>
        {label}
      </text>
    </g>
  );
}
function Delivery({ shot, width }: { shot: EsimShot; width: number }) {
  if (shot.copyProbe && !shot.state.error) {
    const middle = width / 2,
      left = width < 600 ? 57 : width * 0.27,
      right = width - left;
    return (
      <svg
        viewBox={`0 0 ${width} 342`}
        role="img"
        aria-label={t('加密且绑定芯片 A 的封包经过 LPA；复制到芯片 B 不能安装')}
      >
        <text x={middle} y="26" textAnchor="middle" fill={gold}>
          {t('同一份加密封包')}
        </text>
        <Packet x={middle} y={80} label="BPP · A" />
        <path
          d={`M${middle} 122V140Q${middle} 155 ${left} 176V187`}
          fill="none"
          stroke={teal}
          strokeWidth="2"
        />
        <path
          d={`M${middle} 122V140Q${middle} 155 ${right} 176V187`}
          fill="none"
          stroke={red}
          strokeWidth="2"
          strokeDasharray="4 5"
        />
        <path
          d={`M${left - 5} 181L${left} 187L${left + 5} 181M${right - 5} 181L${right} 187L${right + 5} 181`}
          fill="none"
          stroke={faded}
        />
        <Chip x={left - 18} y={201} glow />
        <Chip x={right - 18} y={201} />
        <text x={left} y="267" textAnchor="middle">
          eUICC A
        </text>
        <text x={right} y="267" textAnchor="middle">
          eUICC B
        </text>
        <path d={`M${left + 31} 219l5 5 9-12`} stroke={teal} strokeWidth="2" fill="none" />
        <path
          d={`M${right + 31} 215l10 10M${right + 41} 215l-10 10`}
          stroke={red}
          strokeWidth="2"
        />
        <text x={middle} y="304" textAnchor="middle" fill={red}>
          {t('复制给 B：拒绝')}
        </text>
        <text x={middle} y="328" textAnchor="middle" fill={red}>
          {t('绑定对象不同')}
        </text>
      </svg>
    );
  }
  const narrow = width < 600,
    left = narrow ? width / 2 : 90,
    middle = width / 2,
    right = narrow ? width / 2 : width - 90;
  const y1 = narrow ? 43 : 123,
    y2 = narrow ? 158 : 123,
    y3 = narrow ? 270 : 123;
  const transit = shot.transfer * 2,
    x = narrow
      ? middle
      : transit < 1
        ? left + (middle - left) * transit
        : middle + (right - middle) * (transit - 1),
    y = narrow ? (transit < 1 ? y1 + (y2 - y1) * transit : y2 + (y3 - y2) * (transit - 1)) : y1;
  const progress = shot.state.received / ESIM_SEGMENTS;
  return (
    <svg
      viewBox={`0 0 ${width} 342`}
      role="img"
      aria-label={t('加密且绑定芯片 A 的封包经过 LPA；复制到芯片 B 不能安装')}
    >
      <path
        d={`M${left} ${y1}L${middle} ${y2}L${right} ${y3}`}
        fill="none"
        stroke="#becbbc"
        strokeWidth="3"
      />
      <rect
        x={left - 42}
        y={y1 - 20}
        width="84"
        height="40"
        rx="9"
        fill="#e1e8dd"
        stroke="#adbba9"
      />
      <text x={left} y={y1 + 6} textAnchor="middle">
        SM-DP+
      </text>
      <rect
        x={middle - 29}
        y={y2 - 17}
        width="58"
        height="34"
        rx="16"
        fill="#e8ece4"
        stroke="#bdc8b6"
      />
      <text x={middle} y={y2 + 6} textAnchor="middle">
        LPA
      </text>
      <Chip x={right - 18} y={y3 - 18} glow={progress === 1 && !shot.state.error} />
      <text x={narrow ? right + 72 : right} y={narrow ? y3 + 6 : y3 + 63} textAnchor="middle">
        {narrow ? shot.recipient : `eUICC ${shot.recipient}`}
      </text>
      {shot.state.boundTo && progress < 1 && !shot.state.error && (
        <Packet x={x} y={y} label={narrow ? '→ A' : t('封包 → A')} />
      )}
      <text
        x={narrow ? 22 : middle}
        y={narrow ? 26 : 45}
        textAnchor={narrow ? 'start' : 'middle'}
        fill={gold}
      >
        {t('同一份加密封包')}
      </text>
      {!narrow && (
        <text x={middle} y="210" textAnchor="middle">
          {t('LPA 搬运，不解出 K')}
        </text>
      )}
      {narrow && (
        <text x={middle + 42} y={y2 + 6}>
          {t('搬运')}
        </text>
      )}
      <g>
        {Array.from({ length: ESIM_SEGMENTS }, (_, i) => (
          <rect
            key={i}
            x={middle - 74 + i * 19}
            y={narrow ? 322 : 238}
            width="15"
            height="7"
            rx="3"
            fill={i < shot.state.received ? teal : '#dce3d7'}
          />
        ))}
      </g>
      {shot.copyProbe && !shot.state.error && (
        <g>
          {!narrow && (
            <path
              d={`M${middle} 155Q${middle} 285 ${right - 14} 285`}
              fill="none"
              stroke={red}
              strokeDasharray="4 5"
            />
          )}
          <text
            x={narrow ? 22 : right}
            y={narrow ? 236 : 280}
            textAnchor={narrow ? 'start' : 'middle'}
            fill={red}
          >
            {t('复制给 B：拒绝')}
          </text>
          <text
            x={narrow ? 22 : right}
            y={narrow ? 258 : 305}
            textAnchor={narrow ? 'start' : 'middle'}
            fill={red}
          >
            {t('绑定对象不同')}
          </text>
        </g>
      )}
      {shot.state.error && (
        <text x={middle} y="302" textAnchor="middle" fill={red}>
          {t(errorLabel(shot.state.error))}
        </text>
      )}
    </svg>
  );
}
function Storage({ shot, width }: { shot: EsimShot; width: number }) {
  const x = 20,
    w = width - 40,
    state = shot.state;
  return (
    <svg
      viewBox={`0 0 ${width} 342`}
      role="img"
      aria-label={t('eUICC 的隔离 profile 存储；先完整安装，再单独启用')}
    >
      <rect
        x={x}
        y="40"
        width={w}
        height="242"
        rx="23"
        fill="#eff2e8"
        stroke="#8ea488"
        strokeWidth="2"
      />
      <text x={width / 2} y="26" textAnchor="middle">
        eUICC A
      </text>
      {(['home', 'travel'] as const).map((id, i) => {
        const installed = state.installed.includes(id),
          active = state.active === id,
          y = 61 + i * 108;
        return (
          <g key={id}>
            <rect
              x={x + 14}
              y={y}
              width={w - 28}
              height="88"
              rx="14"
              fill={installed ? (active ? '#dce9d7' : '#f9f5e9') : '#e6eade'}
              stroke={installed ? (active ? teal : gold) : '#c1cdb6'}
              strokeDasharray={installed ? undefined : '4 5'}
            />
            <text x={x + 30} y={y + 28}>
              {profileName(id)}
            </text>
            <text x={width - 48} y={y + 28} textAnchor="end" fill={active ? teal : faded}>
              {t(active ? '已启用' : installed ? '已停用' : '尚未安装')}
            </text>
            <text x={x + 30} y={y + 64} fill={installed ? ink : faded}>
              {installed ? 'IMSI  ·  USIM  ·' : t('等待完整封包')}
            </text>
            {installed && <Lock x={width - 61} y={y + 50} color={active ? teal : gold} />}
          </g>
        );
      })}
      <text x={width / 2} y="320" textAnchor="middle">
        {t(
          state.installed.includes('travel')
            ? state.active === 'travel'
              ? '原线路保留'
              : '已安装 ≠ 已启用'
            : '完整验证，再写入',
        )}
      </text>
    </svg>
  );
}
function Network({ shot, width }: { shot: EsimShot; width: number }) {
  const narrow = width < 600,
    x1 = narrow ? 57 : width * 0.24,
    x2 = narrow ? width - 57 : width * 0.76;
  const state = shot.state;
  return (
    <svg
      viewBox={`0 0 ${width} 342`}
      role="img"
      aria-label={t('已启用 profile 的 K 留在芯片里计算挑战应答，基带与天线完成无线通信')}
    >
      <Chip x={x1 - 18} y={53} glow />
      <text x={x1} y="122" textAnchor="middle">
        {profileName(state.active)}
      </text>
      <Lock x={x1} y={150} color={teal} />
      <path
        d={`M${x2 - 14} 90L${x2} 51L${x2 + 14} 90M${x2} 54V111M${x2 - 9} 77H${x2 + 9}`}
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
      />
      <path
        d={`M${x2 - 20} 49q-12 14 0 28M${x2 + 20} 49q12 14 0 28`}
        fill="none"
        stroke={teal}
        strokeWidth="2"
      />
      <text x={x2} y="122" textAnchor="middle">
        {t('移动网络')}
      </text>
      <path
        d={`M${x2 - 12} 194H${x1 + 12}`}
        stroke={shot.networkReady ? gold : faded}
        strokeWidth="2"
      />
      <path d={`M${x1 + 20} 189l-8 5 8 5`} fill="none" stroke={shot.networkReady ? gold : faded} />
      <text x={width / 2} y="183" textAnchor="middle">
        {t('随机挑战')}
      </text>
      <path
        d={`M${x1 + 12} 249H${x2 - 12}`}
        stroke={shot.reply >= 1 || state.networkAuthenticated ? teal : faded}
        strokeWidth="2"
      />
      <path
        d={`M${x2 - 20} 244l8 5-8 5`}
        fill="none"
        stroke={state.networkAuthenticated ? teal : faded}
      />
      <text x={width / 2} y="238" textAnchor="middle">
        {t('用 K 算出应答')}
      </text>
      <text
        x={width / 2}
        y="304"
        textAnchor="middle"
        fill={state.networkAuthenticated ? teal : ink}
      >
        {t(
          state.networkAuthenticated
            ? 'K 始终留在芯片'
            : shot.switching
              ? '换线路，重新认证'
              : '然后，网络认证',
        )}
      </text>
    </svg>
  );
}
const chapterLabels = [
  '芯片还在',
  '下载线索',
  '先证明身份',
  '封包只给 A',
  '安装与启用',
  '再向网络认证',
];
export default function Esim() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    id = useId();
  const [width, setWidth] = useState(700),
    [chapter, setChapter] = useState(3),
    [progress, setProgress] = useState(85),
    [fault, setFault] = useState<EsimFault>('none'),
    [profile, setProfile] = useState<EsimProfileId>('travel');
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const shot = esimShot(
    film.watch ? film.chapter : chapter,
    film.watch ? film.chapterProgress : progress / 100,
    film.watch ? 'none' : fault,
    !film.watch && chapter === 5 ? profile : undefined,
  );
  return (
    <div
      className="esim-scene"
      ref={host}
      data-esim-view={shot.view}
      data-esim-active={shot.state.active}
      data-esim-error={shot.state.error ?? 'none'}
    >
      <div className="esim-specimen">
        <div className="esim-specimen-heading">
          <span>eSIM</span>
          <span>{t('一份 profile 的旅程')}</span>
        </div>
        <div className="esim-art">
          {shot.view === 'hardware' && <Hardware shot={shot} width={width} />}
          {shot.view === 'address' && <Address shot={shot} />}
          {shot.view === 'trust' && <Trust shot={shot} width={width} />}
          {shot.view === 'delivery' && <Delivery shot={shot} width={width} />}
          {shot.view === 'storage' && <Storage shot={shot} width={width} />}
          {shot.view === 'network' && <Network shot={shot} width={width} />}
        </div>
      </div>
      {!film.watch && (
        <div className="esim-explore">
          <div className="esim-chapter-picker" role="group" aria-label={t('观察哪一步')}>
            {chapterLabels.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={chapter === i}
                onClick={() => {
                  setChapter(i);
                  setProgress(85);
                }}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <Range
            label={t('这一步的进度')}
            value={progress}
            min={0}
            max={100}
            unit="%"
            onChange={setProgress}
          />
          <label className="esim-fault">
            <span>{t('只改一个条件')}</span>
            <select
              id={`${id}-fault`}
              value={fault}
              onChange={(e) => setFault(e.target.value as EsimFault)}
            >
              <option value="none">{t('正常流程')}</option>
              <option value="server">{t('服务器证书不可信')}</option>
              <option value="recipient">{t('把封包给另一芯片')}</option>
              <option value="integrity">{t('封包被改动')}</option>
              <option value="offline">{t('下载前断开互联网')}</option>
            </select>
          </label>
          {chapter === 5 && shot.state.installed.includes('travel') && (
            <Segments
              value={profile}
              onChange={setProfile}
              label={t('选择启用的线路')}
              options={[
                { value: 'home', label: profileName('home') },
                { value: 'travel', label: profileName('travel') },
              ]}
            />
          )}
          <p
            className={shot.state.error ? 'esim-result esim-result-error' : 'esim-result'}
            role="status"
          >
            {shot.state.error
              ? t(errorLabel(shot.state.error))
              : t(
                  '当前启用：{0}；已存储 {1} 份 profile',
                  profileName(shot.state.active),
                  shot.state.installed.length,
                )}
          </p>
        </div>
      )}
      <details className="esim-notes">
        <summary>{t('模型范围与安全边界')}</summary>
        <p>
          {t(
            '演示消费类 GSMA RSP 的激活码路径与单启用端口。八格只表示分段传输，不是实际文件大小；证书与加密校验用协议状态表达，没有实现真实密码算法。',
          )}
        </p>
        <p>
          {t(
            '现代双 eSIM 或多启用 profile 设备可以同时使用更多线路，取决于端口、基带、系统与运营商支持。芯片隔离与网络认证仍然存在。',
          )}
        </p>
      </details>
    </div>
  );
}
