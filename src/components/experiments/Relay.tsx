import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { relayAt, relayConstants, relayTrace } from '../../models/relay';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/relay.css';
export default function Relay() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [voltage, setVoltage] = useState(5),
    [turns, setTurns] = useState(800),
    [loadVoltage, setLoadVoltage] = useState(5),
    [time, setTime] = useState(20),
    [history, setHistory] = useState<'steady' | 'hold' | 'release'>('steady'),
    [blocked, setBlocked] = useState(false);
  const c = film.watch ? Math.min(6, film.chapter) : 2,
    p = film.watch ? film.chapterProgress : 1;
  const V = film.watch ? (c === 0 ? 0 : c === 3 ? 2 : 5) : voltage,
    after = film.watch
      ? c === 4
        ? 2
        : c === 5
          ? 0
          : V
      : history === 'hold'
        ? 2
        : history === 'release'
          ? 0
          : V;
  const changeAt = film.watch ? (c === 4 ? 0.03 : 0.04) : history === 'hold' ? 0.03 : 0.04,
    loadV = film.watch ? (c === 2 && p >= 0.5 ? 12 : 5) : loadVoltage,
    stuck = film.watch ? c === 6 : blocked,
    N = film.watch ? 800 : turns;
  const trace = useMemo(
    () =>
      relayTrace({
        voltage: V,
        afterVoltage: after,
        switchAt: changeAt,
        turns: N,
        loadVoltage: loadV,
        loadResistance: 100,
        blocked: stuck,
      }),
    [V, after, changeAt, N, loadV, stuck],
  );
  const sampleTime = film.watch
      ? c === 1
        ? p < 0.3
          ? (0.001 * p) / 0.3
          : 0.001 + 0.024 * Math.min(1, (p - 0.3) / 0.45)
        : c === 4
          ? 0.08
          : c === 5
            ? p < 0.45
              ? 0.04 + (0.0005 * p) / 0.45
              : 0.0405 + 0.0115 * Math.min(1, (p - 0.45) / 0.4)
            : 0.04
      : time / 1000,
    q = relayAt(trace, sampleTime);
  const stroke = (q.closure / relayConstants.travel) * 30,
    bridgeY = 96 + stroke,
    plungerY = 75 + stroke;
  const spring = Array.from({ length: 9 }, (_, n) => [
    100 + (n === 0 || n === 8 ? 0 : n % 2 ? 6 : -6),
    50 + ((plungerY - 50) * n) / 8,
  ]);
  const windings = Array.from({ length: 14 }, (_, half) =>
    Array.from({ length: 17 }, (_, n) => {
      const u = (half + n / 16) / 14,
        angle = Math.PI + u * 14 * Math.PI;
      return `${n ? 'L' : 'M'}${100 + 40 * Math.cos(angle)} ${130 + 70 * u + 5 * Math.sin(angle)}`;
    }).join(' '),
  );
  return (
    <section
      className="relay-study"
      data-watch={film.watch}
      aria-label={t('常开单稳态直流柱塞继电器')}
    >
      <header>
        <span>RELAY / ELECTROMAGNET</span>
        <b>{t('线圈施力，触点接通另一电源')}</b>
      </header>
      <div
        className="relay-cutaway"
        role="img"
        aria-label={t('柱塞与绝缘推杆共同移动，铜桥同时接触两端，线圈与负载不导通')}
      >
        <svg viewBox="0 0 360 250">
          <defs>
            <linearGradient id={`${id}-steel`} x1="0" x2="1">
              <stop stopColor="#b4c1c7" />
              <stop offset=".5" stopColor="#d5dfe0" />
              <stop offset="1" stopColor="#9cabb5" />
            </linearGradient>
          </defs>
          <path d="M27 170V130H60M60 200V228H27V200" fill="none" stroke="#8ba3b0" strokeWidth="2" />
          {q.source === 0 && <path d="M27 145V160" stroke="#e9eef0" strokeWidth="7" />}
          {q.source === 0 && <path d="M27 145L39 157" stroke="#8ba3b0" strokeWidth="2" />}
          <circle cx="27" cy="185" r="15" fill="#d8e4e7" stroke="#a0b6bd" />
          <path d="M23 181H31M27 177V185M23 191H31" stroke="#7f96a3" strokeWidth="1.5" />
          <path
            d="M60 130H46V212H60V200"
            fill="none"
            stroke={q.diodeConducting ? '#8b735c' : '#b6c4c5'}
            strokeWidth="2"
          />
          <path
            d="M41 164L46 154L51 164ZM40 151H52"
            stroke="#8b9fa4"
            strokeWidth="1.5"
            fill="none"
          />
          <path d="M65 119H135V205H65Z" fill="#d5e0e1" stroke="#b2c2c6" />
          {windings
            .filter((_, n) => n % 2 === 0)
            .map((path, n) => (
              <path
                key={`back-${n}`}
                d={path}
                fill="none"
                stroke="#ba9a80"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          <rect x="80" y="175" width="40" height="24" rx="4" fill={`url(#${id}-steel)`} />
          <rect x="90" y={plungerY} width="20" height="50" rx="4" fill={`url(#${id}-steel)`} />
          {windings
            .filter((_, n) => n % 2 === 1)
            .map((path, n) => (
              <path
                key={`front-${n}`}
                d={path}
                fill="none"
                stroke="#b48c6e"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          <path
            d={`M${spring.map((point) => point.join(' ')).join('L')}`}
            fill="none"
            stroke="#8a9da4"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M84 50H116" stroke="#aab8bd" strokeWidth="3" strokeLinecap="round" />
          <path
            d={`M100 ${plungerY}H260V${bridgeY}`}
            fill="none"
            stroke="#c5c8b2"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <path d={`M220 ${bridgeY}H300`} stroke="#ae8467" strokeWidth="5" strokeLinecap="round" />
          {[220, 300].map((x) => (
            <g key={x}>
              <circle cx={x} cy={bridgeY} r="4" fill="#9a765d" />
              <path d={`M${x} 134V210`} stroke="#a99479" strokeWidth="2" />
              <circle cx={x} cy="134" r="4" fill="#ae9574" />
            </g>
          ))}
          <path d="M220 210H300" stroke="#a99479" strokeWidth="2" />
          <circle cx="240" cy="210" r="12" fill="#ece4d6" stroke="#b4a17f" />
          <circle
            cx="280"
            cy="210"
            r="12"
            fill={q.loadPower > 0 ? '#dfcca0' : '#e4e2d7'}
            stroke="#b4a17f"
          />
          <path d="M274 204L286 216M286 204L274 216" stroke="#a38b61" strokeWidth="1.5" />
          {stuck && <rect x="85" y="125" width="30" height="6" rx="2" fill="#9d7d6b" />}
        </svg>
        <span className="relay-insulator">{t('绝缘推杆')}</span>
        <span className="relay-coil">
          {t('线圈')} {q.source.toFixed(1)} V
        </span>
        <span className="relay-load">
          {t('负载电源')} {loadV} V
        </span>
        {q.diodeConducting && <span className="relay-diode">{t('线圈续流')}</span>}
        {stuck && <span className="relay-blocked">{t('柱塞卡住')}</span>}
      </div>
      <div className="relay-readings">
        <span>
          {t('线圈电流')}
          <b>{(q.current * 1000).toFixed(1)} mA</b>
        </span>
        <span>
          {t('磁气隙')}
          <b>{((relayConstants.gap - q.closure) * 1000).toFixed(2)} mm</b>
        </span>
        <span>
          {t('负载功率')}
          <b>{q.loadPower.toFixed(2)} W</b>
        </span>
      </div>
      <p className="relay-contact" data-closed={q.closed}>
        {q.closed ? t('常开触点已闭合') : t('常开触点断开')} · t = {(sampleTime * 1000).toFixed(1)}{' '}
        ms
      </p>
      <p className="relay-force">
        {t('磁吸力')} {(q.magneticForce * 1000).toFixed(1)} mN · {t('弹簧力')}{' '}
        {(q.springForce * 1000).toFixed(1)} mN
      </p>
      {!film.watch && (
        <div className="relay-controls">
          <div className="relay-modes">
            {(['steady', 'hold', 'release'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={history === value}
                onClick={() => setHistory(value)}
              >
                {value === 'steady'
                  ? t('恒定线圈电压')
                  : value === 'hold'
                    ? t('30 ms 后降到 2 V')
                    : t('40 ms 后断电')}
              </button>
            ))}
          </div>
          {[
            {
              key: 'V',
              label: t('初始线圈电压，V'),
              value: voltage,
              min: 0,
              max: 6,
              step: 0.1,
              set: setVoltage,
            },
            {
              key: 'N',
              label: t('线圈匝数'),
              value: turns,
              min: 500,
              max: 1000,
              step: 50,
              set: setTurns,
            },
            {
              key: 'load',
              label: t('独立负载电压，V'),
              value: loadVoltage,
              min: 0,
              max: 12,
              step: 1,
              set: setLoadVoltage,
            },
            {
              key: 'time',
              label: t('观察时刻，ms'),
              value: time,
              min: 0,
              max: 100,
              step: 0.1,
              set: setTime,
            },
          ].map((control) => (
            <label key={control.key} htmlFor={`${id}-${control.key}`}>
              {control.label} · {control.value}
              <input
                id={`${id}-${control.key}`}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(e) => control.set(+e.target.value)}
              />
            </label>
          ))}
          <button aria-pressed={blocked} onClick={() => setBlocked(!blocked)}>
            {t('阻止柱塞移动')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('吸合、保持与电气隔离的教学边界')}</summary>
        <p>
          {t(
            '本片为常开、单稳态直流柱塞继电器。柱塞克服回位弹簧后经绝缘件推动铜桥；达到行程端才接通负载，接触几何与模型行程一致。线圈不向负载供电，负载有自己的电源。变气隙电感 L=Lleak+μ₀N²A/(g−x)，磁力为 I²(dL/dx)/2，电路保留运动反电动势 I(dL/dx)dx/dt。弹簧、质量与阻尼共同决定运动，非按钮直接改变触点。',
          )}
        </p>
        <p>
          {t(
            '尺寸与匝线纹理作放大剖示，参数不代表具体产品；省略磁饱和、涡流、剩磁、接触弹跳、弹性超程、磨损和电弧。默认断电后经理想 0.7 V 二极管续流，再释放回位；不是无续流时尖峰电压模型。保持与吸合电压不同由变气隙磁力产生，不宣称厂家门槛。隔离不等于任意安全电压或无限触点容量。教学模型不提供接线、带电维修或器件选型指导。',
          )}
        </p>
      </details>
    </section>
  );
}
