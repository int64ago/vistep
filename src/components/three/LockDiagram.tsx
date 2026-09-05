import { useId } from 'react';
import { t } from '../../i18n';
import { LOCK as L, lockSpring, type LockPose } from '../../models/lock';
const lower = '#b08851',
  upper = '#7e9298',
  focus = '#b46747';
function keyPath(m: LockPose, x: (v: number) => number, y: (v: number) => number) {
  return (
    `M${x(m.offset)} ${y(L.keyBottom)}L${x(m.offset + L.keyTip)} ${y(L.keyBottom)} ` +
    [...m.profile]
      .reverse()
      .map(([a, b]) => `L${x(a + m.offset)} ${y(b)}`)
      .join(' ') +
    'Z'
  );
}
export function LockStackStates({
  pose: m,
  selected,
  onSelect,
}: {
  pose: LockPose;
  selected: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <div
      className="lock-stack-states"
      role={onSelect ? 'group' : undefined}
      aria-label={t('六组弹子的边界状态')}
    >
      {m.stacks.map((s, i) =>
        onSelect ? (
          <button
            key={i}
            aria-label={t('查看第 {0} 组弹子', i + 1)}
            aria-pressed={i === selected}
            data-clear={s.clear}
            onClick={() => onSelect(i)}
          >
            {i + 1}
            <span>{s.clear ? t('对齐') : t('阻挡')}</span>
          </button>
        ) : (
          <div
            key={i}
            aria-label={t('第 {0} 组：{1}', i + 1, t(s.clear ? '对齐' : '阻挡'))}
            data-active={i === selected}
            data-clear={s.clear}
          >
            <b>{i + 1}</b>
            <span>{s.clear ? t('对齐') : t('阻挡')}</span>
          </div>
        ),
      )}
    </div>
  );
}
export function LockSection({ pose: m, selected }: { pose: LockPose; selected: number }) {
  const id = useId().replace(/:/g, '');
  if (m.angle > 0) return <LockEndView pose={m} selected={selected} />;
  const s = m.stacks[selected],
    cx = 112,
    scale = 82,
    x = (a: number) => cx + (a - s.x) * scale,
    y = (a: number) => 320 - a * scale,
    r = L.pinRadius * scale;
  const spring = Array.from({ length: 113 }, (_, i) => {
    const p = lockSpring(s, i / 112);
    return `${i ? 'L' : 'M'}${x(p[0])} ${y(p[1])}`;
  }).join(' ');
  return (
    <svg
      className="lock-section"
      viewBox="0 0 300 390"
      role="img"
      aria-label={t('第 {0} 组的钥匙接触、两段弹子与弹簧剖面', selected + 1)}
    >
      <defs>
        <clipPath id={id}>
          <rect x="12" y="24" width="276" height="353" rx="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path
          d={`M${cx - 31} 60V${y(L.radius)}M${cx + 31} 60V${y(L.radius)}`}
          stroke="#7a919733"
          strokeWidth="17"
        />
        <path
          d={`M${cx - 31} ${y(L.radius)}V${y(L.keywayTop)}M${cx + 31} ${y(L.radius)}V${y(L.keywayTop)}`}
          stroke="#b18e5933"
          strokeWidth="17"
        />
        <path
          d={`M${cx - 43} ${y(L.springSeat)}H${cx + 43}`}
          stroke="#5d747d"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d={spring} fill="none" stroke="#637b85" strokeWidth="3.5" strokeLinecap="round" />
        <rect
          x={cx - r}
          y={y(s.driverTop)}
          width={2 * r}
          height={L.driverLength * scale}
          rx="1.5"
          fill={upper}
        />
        <path
          d={`M${cx - r} ${y(s.interfaceY)}H${cx + r}V${y(s.centerY)}A${r} ${r} 0 0 1 ${cx - r} ${y(s.centerY)}Z`}
          fill={focus}
        />
        <path d={`M12 ${y(L.radius)}H281`} stroke="#528879" strokeWidth="2" strokeDasharray="5 5" />
        <path d={keyPath(m, x, y)} fill="#cab68d" stroke="#9b865e" strokeWidth="1.5" />
        <path d={`M12 ${y(L.keyFloor)}H288`} stroke="#a9b2af" strokeWidth="7" />
        {s.supportedByKey && (
          <circle cx={x(s.contact[0])} cy={y(s.contact[1])} r="4.5" fill="#99492e" />
        )}
      </g>
      <text x="160" y="90" fontSize="20" fill="#5c7076">
        {t('弹簧')}
      </text>
      <text
        x="160"
        y={Math.max(130, Math.min(208, y(s.interfaceY + L.driverLength / 2)))}
        fontSize="20"
        fill="#5c7076"
      >
        {t('上弹子')}
      </text>
      <text x="160" y={y(L.radius) - 9} fontSize="20" fill="#347b69">
        {t('剪切边界')}
      </text>
      <text x="160" y={y((s.tip + s.interfaceY) / 2) + 7} fontSize="20" fill="#995b40">
        {t('下弹子')}
      </text>
      <text x="18" y="385" fontSize="20" fill="#65777b">
        {t('纵向剖面示意')}
      </text>
    </svg>
  );
}
export function LockEndView({ pose: m, selected }: { pose: LockPose; selected: number }) {
  const r = L.radius * 79,
    cy = 256,
    cx = 150,
    s = m.stacks[selected],
    a = (m.angle * 180) / Math.PI;
  return (
    <svg
      className="lock-end"
      viewBox="0 0 300 390"
      role="img"
      aria-label={t('锁芯端面：钥匙和下弹子转动，上弹子留在外壳中')}
    >
      <rect x="125" y="40" width="50" height="150" rx="8" fill="#8ea0a43b" />
      <path d="M122 41H178" stroke="#5b7580" strokeWidth="9" strokeLinecap="round" />
      <path
        d="M143 44l14 8-14 8 14 8-14 8 14 8-14 8 14 8"
        fill="none"
        stroke="#6b838c"
        strokeWidth="3"
      />
      <circle cx={cx} cy={cy} r={L.housingRadius * 79} fill="#66808a" />
      <circle cx={cx} cy={cy} r={r + L.runningGap * 79} fill="#e7ece6" />
      <circle cx={cx} cy={cy} r={r} fill="#c9aa79" />
      <path
        transform={`translate(${cx} ${cy})`}
        d={`M${-L.pinRadius * 79} ${-(L.radius + L.driverLength) * 79}H${L.pinRadius * 79}V${-Math.sqrt(L.radius ** 2 - L.pinRadius ** 2) * 79}A${r} ${r} 0 0 0 ${-L.pinRadius * 79} ${-Math.sqrt(L.radius ** 2 - L.pinRadius ** 2) * 79}Z`}
        fill={upper}
      />
      <g transform={`translate(${cx} ${cy}) rotate(${a})`}>
        <rect
          x={-L.keywayHalfWidth * 79}
          y={-L.keywayTop * 79}
          width={L.keywayHalfWidth * 158}
          height={(L.keywayTop - L.keyFloor) * 79}
          fill="#45545a"
          rx="3"
        />
        <rect
          x={-L.keyHalfWidth * 79}
          y={-L.cuts[selected] * 79}
          width={L.keyHalfWidth * 158}
          height={(L.cuts[selected] - L.keyBottom) * 79}
          fill="#e0ceb1"
        />
        <path
          d={`M${-L.pinRadius * 79} ${-Math.sqrt(L.radius ** 2 - L.pinRadius ** 2) * 79}A${r} ${r} 0 0 1 ${L.pinRadius * 79} ${-Math.sqrt(L.radius ** 2 - L.pinRadius ** 2) * 79}V${-s.centerY * 79}a${L.pinRadius * 79} ${L.pinRadius * 79} 0 0 1 ${-2 * L.pinRadius * 79} 0Z`}
          fill={focus}
        />
        <circle cx="0" cy={r * 0.79} r="5" fill="#5d7974" />
      </g>
      <text x="150" y="374" textAnchor="middle" fontSize="20" fill="#536e75">
        {t('端面运动示意')}
      </text>
    </svg>
  );
}
export function LockComparison({ pose: m, reference }: { pose: LockPose; reference: LockPose }) {
  const id = useId().replace(/:/g, '');
  return (
    <div className="lock-comparison">
      {[reference, m].map((p, k) => {
        const s = p.stacks[2],
          x = (a: number) => 70 + (a - s.x) * 90,
          y = (a: number) => 220 - a * 75,
          clip = id + k;
        return (
          <div key={k}>
            <h3>
              {t(
                k === 0
                  ? '匹配钥匙'
                  : p.key === 'matching'
                    ? '当前匹配钥匙'
                    : p.key === 'low'
                      ? '单处偏低的钥匙'
                      : '单处偏高的钥匙',
              )}
            </h3>
            <svg
              viewBox="0 0 140 278"
              role="img"
              aria-label={t(s.clear ? '第三组界面与剪切边界对齐' : '第三组界面偏离剪切边界')}
            >
              <defs>
                <clipPath id={clip}>
                  <rect width="140" height="278" rx="8" />
                </clipPath>
              </defs>
              <g clipPath={`url(#${clip})`}>
                <rect
                  x="57"
                  y={y(s.driverTop)}
                  width="26"
                  height={L.driverLength * 75}
                  fill={upper}
                  rx="2"
                />
                <path
                  d={`M57 ${y(s.interfaceY)}H83V${y(s.centerY)}A13 9 0 0 1 57 ${y(s.centerY)}Z`}
                  fill={lower}
                />
                <path d={keyPath(p, x, y)} fill="#c6ae83" stroke="#a48755" />
                <path
                  d={`M5 ${y(L.radius)}H135`}
                  stroke="#518573"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                />
                <circle cx="70" cy={y(s.interfaceY)} r="5" fill={s.clear ? '#43826d' : '#b65c3c'} />
              </g>
            </svg>
            <p>
              {p.clearCount === 6
                ? t('六组全部对齐')
                : p.clearCount === 5
                  ? t('仍有一组阻挡')
                  : t('{0} 组仍在阻挡', 6 - p.clearCount)}
            </p>
            <strong>{t(p.canTurn ? '可以转动' : '不能转动')}</strong>
          </div>
        );
      })}
      <p className="lock-comparison-note">
        {t(
          m.key === 'matching'
            ? '当前选择与匹配基准相同。'
            : '同一插入深度、同一转角请求；只有第三处齿形不同。',
        )}
      </p>
    </div>
  );
}
