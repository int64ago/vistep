import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  hangingCollision,
  cartCollisionRun,
  cartRunDuration,
  springSeparation,
  textbookSticky,
  TEXTBOOK_STICKY,
  type CartMode,
} from '../../models/momentum-collision-lab';
import '../../styles/momentum-collision-lab.css';
type Mode = 'hanging' | CartMode;
const X = (x: number) => 30 + 140 * x;
function Hanging({ progress, ratio, id }: { progress: number; ratio: number; id: string }) {
  const s = hangingCollision(progress, ratio),
    ax = 182 + 200 * Math.sin(s.a.angle),
    ay = 42 + 200 * Math.cos(s.a.angle),
    bx = 218 + 200 * Math.sin(s.b.angle),
    by = 42 + 200 * Math.cos(s.b.angle);
  return (
    <>
      <svg
        viewBox="0 0 400 305"
        className="mc-apparatus"
        role="img"
        aria-label={t('等长悬线上的同大小球体，左球质量可改变，碰后摆起高度可比较')}
      >
        <defs>
          <radialGradient id={`${id}-ball`} cx="32%" cy="24%">
            <stop stopColor="#edf0d9" />
            <stop offset=".5" stopColor="#bac6a7" />
            <stop offset="1" stopColor="#92a686" />
          </radialGradient>
        </defs>
        <path
          d="M62 41h277M75 41V280m-17 4h34M326 41V280m-17 4h34"
          stroke="#b9c6a9"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d={`M182 42L${ax} ${ay}M218 42L${bx} ${by}`} stroke="#9fb18f" strokeWidth="1.6" />
        <path
          d={`M64 ${242 - 400 * s.initialHeight}H365`}
          stroke="#bba578"
          strokeDasharray="4 5"
          opacity=".55"
        />
        <circle cx={ax} cy={ay} r="18" fill={`url(#${id}-ball)`} />
        <circle cx={bx} cy={by} r="18" fill={`url(#${id}-ball)`} />
        {ratio > 1 && (
          <circle cx={ax} cy={ay} r="13" fill="none" stroke="#b59b6e" strokeWidth="2" />
        )}
        <text x={ax} y={ay + 40} textAnchor="middle">
          {ratio === 1 ? 'm' : '2m'}
        </text>
        <text x={bx} y={by + 40} textAnchor="middle">
          m
        </text>
      </svg>
      <div className="mc-readings">
        <span>
          {t('左球释放高度')} {(s.initialHeight * 100).toFixed(1)} cm
        </span>
        <span>
          {t('右球最大高度')} {(s.height2 * 100).toFixed(1)} cm
        </span>
      </div>
      <p className="mc-note">
        {t('虚线是左球释放高度；比较碰撞紧邻前后的速度，不把整个摆动当作水平动量守恒。')}
      </p>
    </>
  );
}
function Cart({
  position,
  side,
  mode,
  mass,
}: {
  position: number;
  side: 1 | 2;
  mode: CartMode;
  mass: number;
}) {
  const x = X(position),
    air = mode !== 'textbook' && mode !== 'tape',
    face = side === 1 ? 1 : -1;
  return (
    <g>
      <path
        d={`M${x - 11} 179h22v24h-22Z`}
        fill={side === 1 ? '#b7c7a7' : '#c5b58e'}
        stroke="#a8b797"
      />
      <rect x={x - 8} y="172" width="16" height="7" rx="2" fill="#a6b893" />
      {mass > 0.6 && <rect x={x - 8} y="165" width="16" height="7" rx="2" fill="#b5c3a0" />}
      <path d={`M${x} 172V151`} stroke="#9aab88" strokeWidth="1.5" />
      <rect x={x - 1.4} y="142" width="2.8" height="22" fill="#889c7d" />
      {!air && [-7, 7].map((dx) => <circle key={dx} cx={x + dx} cy="207" r="4" fill="#a0b08e" />)}
      {mode === 'elastic' ? (
        <path
          d={`M${x + face * 11} 183l${face * 3} 3v11l${-face * 3} 3`}
          stroke="#a39472"
          strokeWidth="2"
          fill="none"
        />
      ) : mode === 'release' ? (
        <path d={`M${x + face * 11} 183v17`} stroke="#a39472" strokeWidth="2" />
      ) : side === 1 ? (
        <path d={`M${x + 11} 191h3`} stroke="#8b9d7d" strokeWidth="3" />
      ) : (
        <rect x={x - 14} y="183" width="4" height="17" rx="2" fill="#ad9273" />
      )}
    </g>
  );
}
function Gate({ position, blocked }: { position: number; blocked: boolean }) {
  const x = X(position);
  return (
    <g>
      <path
        d={`M${x - 10} 215V137l20-7v77`}
        stroke="#b3c3a1"
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d={`M${x - 7} 161l14-7`}
        stroke={blocked ? '#b8a16d' : '#b6c9a3'}
        strokeWidth={blocked ? 3 : 1.4}
        opacity={blocked ? 1 : 0.5}
      />
      <circle cx={x - 8} cy="164" r="3" fill={blocked ? '#b6a374' : '#c7d3b8'} />
    </g>
  );
}
function Track({
  mode,
  progress,
  speed,
  row,
  energy,
}: {
  mode: CartMode;
  progress: number;
  speed: number;
  row: number;
  energy: boolean;
}) {
  const time = progress * cartRunDuration(mode, speed, row),
    s = cartCollisionRun(mode, time, speed, row),
    release = mode === 'release' ? springSeparation(time) : null,
    detachedState = release ? springSeparation(release.release) : null,
    one = release?.x1 ?? s.x1,
    two = release?.x2 ?? s.x2,
    gates = release ? [0.5, 1.6] : [0.88, 1.45],
    after1 = release?.gate1 ?? s.afterGate1,
    after2 = release?.gate2 ?? s.afterGate2,
    done1 = after1 && time >= after1.exit,
    done2 = after2 && time >= after2.exit,
    done = Boolean(done1 && done2),
    v1 = release?.v1 ?? s.v1,
    v2 = release?.v2 ?? s.v2,
    pBefore = release ? 0 : s.pBefore,
    pAfter = release ? release.p : s.pAfter,
    kBefore = release ? 0 : s.kBefore,
    kAfter = release ? release.kinetic : s.kAfter,
    read = (v: number, ready: boolean) => (ready ? v.toFixed(3) : '—'),
    flagWidth = 0.02,
    springLeft = X((release?.detached ? detachedState!.x1 : one) + 0.1),
    springRight = X((release?.detached ? detachedState!.x2 : two) - 0.1),
    springY = release?.detached
      ? 191 + Math.min(25, 0.5 * 9.81 * (time - release.release) ** 2 * 140)
      : 191,
    tapeDone = mode === 'tape' && time >= s.impact + 0.4;
  return (
    <>
      <svg
        viewBox="0 0 400 295"
        className="mc-apparatus"
        role="img"
        aria-label={t('水平导轨上的两滑块、真实碰撞附件、遮光片与两个光电门')}
      >
        <path d="M20 217h365v12H20Z" fill="#c9d4b8" />
        {mode !== 'textbook' &&
          mode !== 'tape' &&
          Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx={27 + i * 15} cy="221" r="1.5" fill="#9fb18c" />
          ))}
        <path d="M53 229v34m-12 4h24M349 229v34m-12 4h24" stroke="#b4c2a0" strokeWidth="4" />
        {mode !== 'tape' &&
          gates.map((g) => (
            <Gate
              key={g}
              position={g}
              blocked={Math.abs(one - g) < flagWidth / 2 || Math.abs(two - g) < flagWidth / 2}
            />
          ))}
        {release && (
          <>
            <path
              d={`M${springLeft} ${springY}${Array.from({ length: 12 }, (_, i) => `L${springLeft + ((springRight - springLeft) * (i + 1)) / 12} ${springY + (i % 2 ? 4 : -4)}`).join('')}`}
              stroke="#b9a373"
              strokeWidth="1.8"
              fill="none"
              opacity={release.detached ? 0.65 : 1}
            />
            {time < 0.02 && (
              <path d={`M${X(one)} 201H${X(two)}`} stroke="#b2bd9d" strokeDasharray="3 3" />
            )}
          </>
        )}
        {mode === 'tape' && (
          <>
            <path d={`M${X(one)} 196H12`} stroke="#e4e7cf" strokeWidth="9" />
            <rect x="4" y="180" width="24" height="30" rx="6" fill="#b5c5a1" />
            <path d="M15 186v17" stroke="#9cab88" strokeWidth="2" />
          </>
        )}
        <Cart position={one} side={1} mode={mode} mass={s.m1} />
        <Cart position={two} side={2} mode={mode} mass={s.m2} />
        <text x="104" y="79" textAnchor="middle">
          m₁ = {s.m1.toFixed(3)} kg
        </text>
        <text x="296" y="79" textAnchor="middle">
          m₂ = {s.m2.toFixed(3)} kg
        </text>
        <path d="M143 276h105" stroke="#b6c1a3" />
        <path d="M242 272l6 4-6 4" stroke="#b6c1a3" fill="none" />
        <text x="264" y="284">
          +
        </text>
      </svg>
      {mode === 'textbook' ? (
        <>
          <p className="mc-note">{t('教材原始表格；保留实验偏差，不改成完美守恒数据')}</p>
          <table className="mc-table">
            <thead>
              <tr>
                <th>m₁ / kg</th>
                <th>m₂ / kg</th>
                <th>v / m·s⁻¹</th>
                <th>v′ / m·s⁻¹</th>
              </tr>
            </thead>
            <tbody>
              {TEXTBOOK_STICKY.map((d, i) => (
                <tr key={i} className={i === row ? 'is-active' : ''}>
                  <td>{d.m1}</td>
                  <td>{d.m2}</td>
                  <td>{d.u}</td>
                  <td>{d.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mc-readings">Δp / p = {(textbookSticky(row).residual * 100).toFixed(2)}%</p>
        </>
      ) : mode === 'tape' ? (
        <>
          <p className="mc-note">{t('展开纸带的两段：每五次打点取一计数点，间隔 0.10 s')}</p>
          <svg viewBox="0 0 400 100" className="mc-apparatus" aria-hidden="true">
            <rect x="30" y="10" width="340" height="26" rx="9" fill="#e6ead5" />
            <rect x="30" y="62" width="340" height="26" rx="9" fill="#e6ead5" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <circle
                  cx={40 + i * speed * 0.1 * 1000}
                  cy="23"
                  r="2.8"
                  fill="#a5b48e"
                  opacity={time >= 0.1 + i * 0.1 ? 1 : 0}
                />
                <circle
                  cx={40 + i * s.v1 * 0.1 * 1000}
                  cy="75"
                  r="2.8"
                  fill="#b3a077"
                  opacity={time >= s.impact + 0.1 + i * 0.1 ? 1 : 0}
                />
              </g>
            ))}
          </svg>
          <div className="mc-readings">
            <span>
              {t('碰前')} Δx = {(speed * 0.1 * 100).toFixed(1)} cm
            </span>
            <span>
              {t('碰后')} Δx = {(s.v1 * 0.1 * 100).toFixed(1)} cm
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="mc-note">
            {t('遮光片宽 20 mm；速度大小由宽度除以遮光时间，正负由运动方向判断')}
          </p>
          <div className="mc-readings">
            <span>Δt₁ = {done1 ? ((after1?.duration ?? 0) * 1000).toFixed(1) : '—'} ms</span>
            <span>Δt₂ = {done2 ? ((after2?.duration ?? 0) * 1000).toFixed(1) : '—'} ms</span>
          </div>
        </>
      )}
      <div className="mc-readings">
        <span>v₁′ = {read(v1, done || mode === 'textbook' || tapeDone)} m/s</span>
        <span>v₂′ = {read(v2, done || mode === 'textbook' || tapeDone)} m/s</span>
      </div>
      <div className="mc-audit">
        <span>
          p: {pBefore.toFixed(3)} → {read(pAfter, done || mode === 'textbook' || tapeDone)} kg·m/s
        </span>
        {(energy || mode === 'textbook' || release) && (
          <span>
            K: {kBefore.toFixed(3)} → {read(kAfter, done || mode === 'textbook')} J
          </span>
        )}
        {release && <span>Uₛ + K = {release.totalEnergy.toFixed(4)} J</span>}
      </div>
    </>
  );
}
export default function MomentumCollisionLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Mode>(
      film.variant === 'e1-hanging-ball-collision'
        ? 'hanging'
        : film.variant === 'e1-sticky-cart-invariant'
          ? 'textbook'
          : 'elastic',
    ),
    [progress, setProgress] = useState(0.9),
    [ratio, setRatio] = useState('equal'),
    [speed, setSpeed] = useState(0.6),
    [row, setRow] = useState('0'),
    c = film.chapter,
    p = film.watch ? Math.min(1, film.chapterProgress / 0.82) : progress,
    selected: Mode = film.watch
      ? c < 2
        ? 'hanging'
        : c === 2
          ? 'textbook'
          : c === 3 || c === 7
            ? 'elastic'
            : c === 4 || c === 8
              ? 'sticky'
              : c === 5
                ? 'release'
                : 'tape'
      : mode,
    energy = film.watch ? c >= 7 : true,
    label =
      selected === 'hanging'
        ? (film.watch ? c === 0 : ratio === 'equal')
          ? '等质量时交换速度，还不能推广到所有碰撞'
          : '同样大小但质量不同，速度之和不再守恒'
        : selected === 'textbook'
          ? '从教材实测数据比较不同的候选量'
          : selected === 'release'
            ? '弹簧弹性势能转为动能，两个滑块动量方向相反'
            : selected === 'tape'
              ? '选稳定运动的纸带段，避开碰撞发生区间'
              : energy
                ? '动量与动能要分别核对'
                : '先读遮光时间，再带方向计算动量';
  return (
    <section className="mc-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="mc-kicker">{t(label)}</p>
      {selected === 'hanging' ? (
        <Hanging
          progress={p}
          ratio={film.watch ? (c === 0 ? 1 : 2) : ratio === 'equal' ? 1 : 2}
          id={id}
        />
      ) : (
        <Track
          mode={selected}
          progress={p}
          speed={film.watch ? 0.6 : speed}
          row={film.watch ? 0 : Number(row)}
          energy={energy}
        />
      )}
      {!film.watch && (
        <div className="mc-controls">
          <Segments
            label={t('选择碰撞装置与路径')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'hanging', label: t('悬球') },
              { value: 'textbook', label: t('教材小车数据') },
              { value: 'elastic', label: t('弹性碰撞架') },
              { value: 'sticky', label: t('撞针与橡皮泥') },
              { value: 'release', label: t('压缩弹簧分离') },
              { value: 'tape', label: t('纸带测速') },
            ]}
          />
          {selected === 'hanging' ? (
            <Segments
              label={t('左球与右球质量')}
              value={ratio}
              onChange={setRatio}
              options={[
                { value: 'equal', label: t('相同质量') },
                { value: 'heavy', label: t('左球两倍质量') },
              ]}
            />
          ) : selected === 'textbook' ? (
            <Segments
              label={t('教材数据组')}
              value={row}
              onChange={setRow}
              options={[
                { value: '0', label: '1' },
                { value: '1', label: '2' },
                { value: '2', label: '3' },
              ]}
            />
          ) : (
            selected !== 'release' && (
              <Range
                label={t('入射速度')}
                value={speed}
                min={0.4}
                max={0.8}
                step={0.05}
                unit="m/s"
                onChange={setSpeed}
              />
            )
          )}
          <Range
            label={t('逐帧观察实验')}
            value={progress}
            min={0}
            max={1}
            step={0.005}
            unit=""
            onChange={setProgress}
          />
        </div>
      )}
      <details className="mc-details">
        <summary>{t('碰撞边界与测量模型')}</summary>
        <p>
          {t(
            '理想导轨忽略外力冲量；弹性与粘连按同一动量方程和不同恢复系数计算。碰撞视为瞬时，不虚构碰撞力曲线。光电门只在遮光片完整通过后显示计时；方向来自可见运动。悬球用非线性单摆方程求轨迹，但只在碰撞紧邻前后比较水平动量。教材三组数据保留原始误差；弹簧分离核对弹性势能与动能总量。',
          )}
        </p>
      </details>
    </section>
  );
}
