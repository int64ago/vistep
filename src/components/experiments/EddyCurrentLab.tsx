import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Segments, Range } from '../lab/Controls';
import {
  meterDamping,
  springDamping,
  discBraking,
  frameDrive,
  tubeFall,
  dampingShot,
  type DampingApparatus,
} from '../../models/eddy-current-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const options = [
  { value: 'meter', label: '微安表的阻尼' },
  { value: 'frame', label: '旋转磁体驱动铝框' },
  { value: 'disc', label: '铜盘的磁制动' },
  { value: 'tube', label: '磁体穿过铝管' },
  { value: 'spring', label: '弹簧磁体与闭合线圈' },
] as const;
const initial = (v?: string): DampingApparatus =>
  v?.includes('frame')
    ? 'frame'
    : v?.includes('disc')
      ? 'disc'
      : v?.includes('tube')
        ? 'tube'
        : v?.includes('coil-damping')
          ? 'spring'
          : 'meter';
export default function EddyCurrentLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [apparatus, setApparatus] = useState<DampingApparatus>(() => initial(film.variant)),
    [enabled, setEnabled] = useState('on'),
    [time, setTime] = useState(0.4),
    [direction, setDirection] = useState('positive');
  const shot = film.watch
    ? dampingShot(film.chapter, film.chapterProgress)
    : { apparatus, enabled: enabled === 'on', time, direction: direction === 'positive' ? 1 : -1 };
  const meter = meterDamping(shot.time, shot.enabled),
    spring = springDamping(shot.time, shot.enabled),
    disc = discBraking(shot.time, shot.enabled ? 0.3 : 0),
    drive = frameDrive(shot.time, shot.direction * 1.6),
    fall = tubeFall(shot.time, shot.enabled);
  const setting =
    shot.apparatus === 'tube'
      ? shot.enabled
        ? '纵向开缝'
        : '完整铝管'
      : shot.apparatus === 'disc'
        ? shot.enabled
          ? '磁极靠近边缘'
          : '磁体移开'
        : shot.apparatus === 'frame'
          ? shot.direction > 0
            ? '磁体正向转动'
            : '磁体反向转动'
          : shot.enabled
            ? '回路闭合'
            : '回路断开';
  const magnet = (x: number, y: number, w = 30, h = 55) => (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx="4"
        fill="#a7c0af"
        stroke="#819b84"
      />
      <path d={`M${x - w / 2} ${y}h${w}v${h / 2 - 4}q0 4-4 4h${-w + 8}q-4 0-4-4Z`} fill="#c5a773" />
      <text className="em-small" x={x} y={y - 7} textAnchor="middle">
        S
      </text>
      <text className="em-small" x={x} y={y + 20} textAnchor="middle">
        N
      </text>
    </g>
  );
  const needle = meter.position;
  const line = (kind: 'meter' | 'spring', closed: boolean) =>
    Array.from({ length: 181 }, (_, i) => {
      const q = i / 180,
        s = kind === 'meter' ? meterDamping(q * 3, closed) : springDamping(q * 4, closed);
      return `${i ? 'L' : 'M'}${25 + q * 310} ${47 - s.position * (kind === 'meter' ? 60 : 700)}`;
    }).join(' ');
  return (
    <div className="textbook-em eddy-current-lab">
      <div className="textbook-em-state">
        <span>{t(options.find((x) => x.value === shot.apparatus)!.label)}</span>
        <span>{t(setting)}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 290"
        role="img"
        aria-label={t('由感应电流计算阻尼与驱动力的五种装置')}
      >
        <defs>
          <linearGradient id={`${id}-metal`}>
            <stop stopColor="#b9c9bb" />
            <stop offset=".4" stopColor="#e5eadc" />
            <stop offset="1" stopColor="#8fa58f" />
          </linearGradient>
          <radialGradient id={`${id}-copper`}>
            <stop stopColor="#e8cf9d" />
            <stop offset="1" stopColor="#b49156" />
          </radialGradient>
        </defs>
        {shot.apparatus === 'meter' && (
          <>
            <path
              d="M88 226V115Q88 50 180 50T272 115V226Z"
              fill="#e0e7d4"
              stroke="#b2c2a3"
              strokeWidth="2"
            />
            <path d="M107 186V115Q107 70 180 70T253 115V186Z" fill="#f6f7ed" stroke="#b8c7aa" />
            <path d="M118 143Q180 80 242 143" fill="none" stroke="#adbda0" strokeWidth="2" />
            {Array.from({ length: 9 }, (_, i) => {
              const a = -0.8 + i * 0.2;
              return (
                <path
                  key={i}
                  d={`M${180 + Math.sin(a) * 80} ${174 - Math.cos(a) * 80}l${Math.sin(a) * 8} ${-Math.cos(a) * 8}`}
                  stroke="#b0bfa2"
                />
              );
            })}
            <path
              d={`M180 174l${Math.sin(needle) * 86} ${-Math.cos(needle) * 86}`}
              stroke="#a58851"
              strokeWidth="2.5"
            />
            <circle cx="180" cy="174" r="6" fill="#b5c4a6" />
            <circle cx="126" cy="225" r="7" fill="#879d7a" />
            <circle cx="234" cy="225" r="7" fill="#b29667" />
            {shot.enabled && (
              <path
                d="M126 225V250Q180 269 234 250V225"
                fill="none"
                stroke="#80977a"
                strokeWidth="3"
              />
            )}
            <text x="180" y="210" textAnchor="middle">
              μA
            </text>
          </>
        )}
        {shot.apparatus === 'disc' && (
          <>
            <path
              d="M180 159V259M116 259H244"
              stroke="#a4b595"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="180" cy="139" r="92" fill={`url(#${id}-copper)`} stroke="#ab8951" />
            <g transform={`rotate(${(disc.angle * 180) / Math.PI} 180 139)`}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <path
                  key={a}
                  d="M180 139V64"
                  transform={`rotate(${a} 180 139)`}
                  stroke="#f0dbb1"
                  strokeWidth="2"
                />
              ))}
              <circle cx="180" cy="69" r="4" fill="#7e9d7d" />
            </g>
            <circle cx="180" cy="139" r="12" fill="#d8dfcb" stroke="#96aa8a" />
            <g transform={`translate(0 ${shot.enabled ? 0 : 95})`}>
              <path d="M258 98h39v78h-39v-21h18v-35h-18Z" fill="#a4bea8" stroke="#829d82" />
              <rect x="245" y="98" width="24" height="22" rx="3" fill="#a3bea8" />
              <rect x="245" y="155" width="24" height="21" rx="3" fill="#c6a571" />
            </g>
            {shot.enabled && (
              <>
                <ellipse
                  cx="248"
                  cy="135"
                  rx="11"
                  ry="22"
                  stroke="#8c784e"
                  strokeDasharray="4 3"
                  fill="none"
                  opacity={Math.min(0.8, disc.omega / 10)}
                />
              </>
            )}
          </>
        )}
        {shot.apparatus === 'frame' && (
          <>
            <path d="M180 38V251M120 251H240" stroke="#a8b79a" strokeWidth="4" />
            <g transform={`translate(180 147) rotate(${(drive.magnetAngle * 180) / Math.PI})`}>
              <path
                d="M-88 20V-20A88 88 0 0 1 88-20V20"
                fill="none"
                stroke="#a7bea7"
                strokeWidth="18"
              />
              <rect x="-99" y="-10" width="22" height="35" rx="4" fill="#a8c1ad" />
              <rect x="77" y="-10" width="22" height="35" rx="4" fill="#c4a675" />
            </g>
            <g transform={`translate(180 147) rotate(${(drive.angle * 180) / Math.PI})`}>
              <rect
                x="-43"
                y="-63"
                width="86"
                height="126"
                rx="7"
                fill="none"
                stroke={`url(#${id}-metal)`}
                strokeWidth="9"
              />
              <circle cx="0" cy="0" r="7" fill="#a2b797" />
            </g>
            <text x="180" y="284" textAnchor="middle">
              Ω − ω = {drive.slip.toFixed(2)} rad/s
            </text>
          </>
        )}
        {shot.apparatus === 'tube' && (
          <>
            <rect
              x="145"
              y="39"
              width="70"
              height="215"
              rx="14"
              fill={`url(#${id}-metal)`}
              opacity=".55"
              stroke="#91a78f"
              strokeWidth="2"
            />
            <ellipse cx="180" cy="42" rx="35" ry="9" fill="#cbd8c5" stroke="#96ac91" />
            {Array.from({ length: 6 }, (_, i) => (
              <ellipse
                key={i}
                cx="180"
                cy={76 + i * 28}
                rx="35"
                ry="8"
                fill="none"
                stroke="#9caf93"
                opacity={shot.enabled ? 0.15 : 0.5}
              />
            ))}
            {magnet(180, 56 + fall.position * 180, 27, 40)}
            <path d="M132 263h96" stroke="#a7b99b" strokeWidth="7" strokeLinecap="round" />
            {shot.enabled && <path d="M202 41V253" stroke="#f7f8ed" strokeWidth="6" />}
            <text x="246" y="151">
              1 m
            </text>
          </>
        )}
        {shot.apparatus === 'spring' && (
          <>
            <path d="M105 27H255" stroke="#acbba0" strokeWidth="6" strokeLinecap="round" />
            <path
              d={Array.from({ length: 121 }, (_, i) => {
                const q = i / 120;
                return `${i ? 'L' : 'M'}${180 + 10 * Math.sin(q * 16 * Math.PI)} ${29 + q * (96 + spring.position * 650)}`;
              }).join(' ')}
              fill="none"
              stroke="#a6b69b"
              strokeWidth="2.5"
            />
            {magnet(180, 153 + spring.position * 650)}
            <ellipse
              cx="180"
              cy="210"
              rx="60"
              ry="18"
              fill="none"
              stroke="#b3945e"
              strokeWidth="7"
            />
            <path
              d="M120 210H85V250H141M240 210H275V250H173"
              fill="none"
              stroke="#9baa8a"
              strokeWidth="2"
            />
            <path
              d={shot.enabled ? 'M141 250H173' : 'M141 250l29-17'}
              stroke="#9baa8a"
              strokeWidth="2.5"
            />
            <circle cx="141" cy="250" r="3" fill="#94a780" />
            <circle cx="173" cy="250" r="3" fill="#94a780" />
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {shot.apparatus === 'disc' ? t('磁极不接触铜盘') : null}
      </p>
      <div className="textbook-em-meters">
        <span>
          {shot.apparatus === 'disc'
            ? `ω = ${disc.omega.toFixed(2)} rad/s`
            : shot.apparatus === 'frame'
              ? `ω = ${drive.omega.toFixed(2)} rad/s`
              : shot.apparatus === 'tube'
                ? `v = ${fall.velocity.toFixed(2)} m/s`
                : shot.apparatus === 'meter'
                  ? `θ = ${meter.position.toFixed(3)} rad`
                  : `x = ${(spring.position * 1000).toFixed(1)} mm`}
        </span>
        <span>t = {shot.time.toFixed(2)} s</span>
      </div>
      {(shot.apparatus === 'meter' || shot.apparatus === 'spring') && (
        <svg
          className="textbook-em-chart"
          viewBox="0 0 360 92"
          role="img"
          aria-label={t('相同初始扰动下闭合与断开的振动比较')}
        >
          <path d="M25 47H335" stroke="#d6dfcd" />
          <path d={line(shot.apparatus, false)} stroke="#bec9ac" fill="none" strokeWidth="2" />
          <path d={line(shot.apparatus, true)} stroke="#739273" fill="none" strokeWidth="2.5" />
        </svg>
      )}
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择阻尼装置')}
            value={apparatus}
            onChange={setApparatus}
            options={options.map((x) => ({ value: x.value, label: t(x.label) }))}
          />
          {apparatus === 'frame' ? (
            <Segments
              label={t('转动方向')}
              value={direction}
              onChange={setDirection}
              options={[
                { value: 'positive', label: t('磁体正向转动') },
                { value: 'negative', label: t('磁体反向转动') },
              ]}
            />
          ) : (
            <Segments
              label={t('实验条件')}
              value={enabled}
              onChange={setEnabled}
              options={[
                {
                  value: 'off',
                  label: t(
                    apparatus === 'tube'
                      ? '完整铝管'
                      : apparatus === 'disc'
                        ? '磁体移开'
                        : '回路断开',
                  ),
                },
                {
                  value: 'on',
                  label: t(
                    apparatus === 'tube'
                      ? '纵向开缝'
                      : apparatus === 'disc'
                        ? '磁极靠近边缘'
                        : '回路闭合',
                  ),
                },
              ]}
            />
          )}
          <Range
            label={t('释放后的时间')}
            value={time}
            min={0}
            max={4}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('有效阻尼模型的范围')}</summary>
        <p>
          {t(
            '各装置分别求解自己的运动方程，采用低速近似的速度阻尼，不把磁吸力当作制动。参数用于说明机制，不拟合实测器材。铝管开缝保留少量局部涡流；弹簧在平衡位置附近线性化；铝框采用平均转矩与转差关系。图中电流环只示意可流通路径，不是场的精确数值解。',
          )}
        </p>
      </details>
    </div>
  );
}
