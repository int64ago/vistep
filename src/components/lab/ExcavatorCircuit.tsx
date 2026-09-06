import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { EXCAVATOR, type Hydraulics, type Valve } from '../../models/excavator';

/**
 * The boom section of the hydraulic circuit, live from the same model state as
 * the machine: tank, engine-driven pump, main relief valve, one spool section
 * of the main control valve, and the boom cylinder. The joystick moves the
 * spool; the spool uncovers ports; dashes travel along the lines at a rate set
 * by the metered flow. Geometry is fixed; only state changes.
 */
export default function ExcavatorCircuit({
  h,
  joystick,
  valve,
  flow,
  stroke,
  pascal,
  running,
  variant,
}: {
  h: Hydraulics;
  joystick: number;
  valve: Valve;
  flow: number;
  /** Boom cylinder stroke fraction, 0 retracted. */
  stroke: number;
  pascal: boolean;
  running: boolean;
  variant: 'overlay' | 'stacked';
}) {
  // Dash offset integrates the flow so the oil never jumps when the valve changes.
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0),
    lastRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    const tick = (now: number) => {
      id = requestAnimationFrame(tick);
      if (document.hidden) {
        lastRef.current = 0;
        return;
      }
      const dt = lastRef.current ? Math.min((now - lastRef.current) / 1000, 0.05) : 0;
      lastRef.current = now;
      if (flow > 0 || h.relief) {
        offsetRef.current += dt * (14 + flow * 0.45);
        setOffset(offsetRef.current);
      }
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      lastRef.current = 0;
    };
  }, [running, flow, h.relief]);

  const x = Math.max(-1, Math.min(1, joystick));
  // Spool travel: 8 px of land overlap, then up to 14 px of port opening.
  const shift = x === 0 ? 0 : -Math.sign(x) * (8 + 14 * Math.abs(x));
  const opening = Math.max(0, Math.abs(shift) - 8);
  const lift = valve === 'lift' && flow > 0 && !h.relief,
    lower = valve === 'lower' && flow > 0,
    relief = h.relief,
    pumping = lift || lower || relief;
  const pressureT = Math.min(1, h.pressure / EXCAVATOR.relief);
  const amber = `rgba(217, 138, 58, ${0.55 + 0.45 * pressureT})`;
  const pale = '#9fbfcb';
  const idle = '#c9cfc7';
  const pistonX = 318 + stroke * 150;
  const dash = (on: boolean, color: string, rate = 1) => ({
    stroke: on ? color : 'none',
    strokeDasharray: '5 11',
    strokeDashoffset: -offset * rate,
  });
  const forceArrow = (x0: number, y: number, length: number, color: string) =>
    `M${x0} ${y}H${x0 + length}M${x0 + length - 7} ${y - 6}L${x0 + length} ${y}L${x0 + length - 7} ${y + 6}`;
  const mpa = (h.pressure / 1e6).toFixed(1);
  return (
    <div className="excavator-circuit" data-variant={variant} data-pascal={pascal}>
      <div className="circuit-figure">
        <svg
          viewBox="0 0 560 330"
          role="img"
          aria-label={t('动臂油路：油箱、泵、溢流阀、主控制阀阀芯与动臂缸')}
        >
          {/* Base lines */}
          <g fill="none" stroke={idle} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M395 297C360 297 300 297 268 287" />
            <path d="M250 267V230" />
            <path d="M215 172V100H318" />
            <path d="M285 172V128H500V100" />
            <path d="M310 230V300H380" />
            <path d="M190 230V300H380" />
            <path d="M250 255H332M362 255H380V300" />
          </g>
          {/* Tank */}
          <rect
            x="380"
            y="268"
            width="90"
            height="42"
            rx="6"
            fill="#e6ebe6"
            stroke="#8a959b"
            strokeWidth="2"
          />
          <rect x="384" y="284" width="82" height="22" rx="4" fill="rgba(217,138,58,0.35)" />
          {/* Engine and pump */}
          <rect x="128" y="268" width="66" height="40" rx="7" fill="#4c565c" />
          {[140, 152, 164, 176].map((sx) => (
            <rect key={sx} x={sx} y="276" width="4" height="24" rx="1" fill="#2f363a" />
          ))}
          <path d="M194 288H232" stroke="#7f8b91" strokeWidth="6" strokeLinecap="round" />
          <circle cx="250" cy="288" r="20" fill="#f4f1e6" stroke="#4c565c" strokeWidth="3" />
          <path d="M244 296L250 274L256 296Z" fill={pumping ? '#d98a3a' : '#9fa8a3'} />
          {/* Relief valve */}
          <rect
            x="332"
            y="243"
            width="30"
            height="24"
            rx="4"
            fill="#f4f1e6"
            stroke="#4c565c"
            strokeWidth="2"
          />
          <path
            d={relief ? 'M338 255H356' : 'M338 261L347 249L356 261'}
            stroke={relief ? '#cf6d2a' : '#4c565c'}
            strokeWidth="2.5"
            fill="none"
          />
          <path d="M362 249c4 0 4 12 8 12s4-12 8-12" stroke="#7f8b91" strokeWidth="2" fill="none" />
          {/* Main control valve, boom section */}
          <rect
            x="170"
            y="172"
            width="160"
            height="58"
            rx="8"
            fill="#e9ece7"
            stroke="#4c565c"
            strokeWidth="2"
          />
          <rect x="170" y="186" width="160" height="30" fill="#d7ddd6" />
          {/* Port openings in the body wall */}
          <rect x="208" y="172" width="14" height="14" fill="#d7ddd6" />
          <rect x="278" y="172" width="14" height="14" fill="#d7ddd6" />
          <rect x="243" y="216" width="14" height="14" fill="#d7ddd6" />
          <rect x="183" y="216" width="14" height="14" fill="#d7ddd6" />
          <rect x="303" y="216" width="14" height="14" fill="#d7ddd6" />
          {/* Open passages, width follows the uncovered port */}
          {lift && opening > 0 && (
            <g fill="none" strokeLinecap="round" strokeWidth={4 + opening * 0.6}>
              <path d="M250 228V201H215V174" stroke={amber} opacity="0.9" />
              <path d="M285 174V201H310V228" stroke={pale} opacity="0.9" />
            </g>
          )}
          {lower && opening > 0 && (
            <g fill="none" strokeLinecap="round" strokeWidth={4 + opening * 0.6}>
              <path d="M250 228V201H285V174" stroke={amber} opacity="0.9" />
              <path d="M215 174V201H190V228" stroke={pale} opacity="0.9" />
            </g>
          )}
          {/* Spool: rod with three lands, sliding in the bore */}
          <g transform={`translate(${shift} 0)`}>
            <rect x="150" y="197" width="200" height="8" rx="4" fill="#8a959b" />
            {[
              [200, 30],
              [270, 30],
              [156, 14],
              [330, 14],
            ].map(([lx, w]) => (
              <rect key={lx} x={lx} y="188" width={w} height="26" rx="3" fill="#3f4a4f" />
            ))}
          </g>
          {/* Pilot link from the joystick to the spool */}
          <path
            d={`M92 118C130 118 140 200 ${152 + shift} 200`}
            stroke="#8a959b"
            strokeWidth="1.5"
            strokeDasharray="3 5"
            fill="none"
          />
          {/* Joystick */}
          <path d="M46 132H98" stroke="#4c565c" strokeWidth="6" strokeLinecap="round" />
          <g transform={`rotate(${-x * 28} 72 126)`}>
            <path d="M72 126V72" stroke="#3f4a4f" strokeWidth="6" strokeLinecap="round" />
            <circle cx="72" cy="66" r="10" fill="#d9952c" stroke="#3f4a4f" strokeWidth="2" />
          </g>
          <circle cx="72" cy="126" r="7" fill="#8a959b" />
          {/* Cylinder */}
          <rect x="300" y="42" width="220" height="58" rx="7" fill="#5a666c" />
          <rect x="308" y="50" width={Math.max(2, pistonX - 6 - 308)} height="42" fill={amber} />
          <rect
            x={pistonX + 6}
            y="50"
            width={Math.max(2, 508 - pistonX - 6)}
            height="42"
            fill={pale}
            opacity="0.55"
          />
          <rect x={pistonX + 6} y="65" width={560 - pistonX} height="12" rx="2" fill="#d3d9db" />
          <rect x={pistonX - 6} y="48" width="12" height="46" rx="2" fill="#2f363a" />
          <rect x="508" y="46" width="12" height="50" rx="3" fill="#4c565c" />
          {pascal && (
            <path
              d={forceArrow(pistonX + 10, 71, 24 + 100 * pressureT, '#cf6d2a')}
              stroke="#cf6d2a"
              strokeWidth="4"
              fill="none"
            />
          )}
          {/* Pascal: one of the pump pistons beside the boom piston, same pressure */}
          {pascal && (
            <g>
              <rect x="34" y="158" width="60" height="18" rx="3" fill="#5a666c" />
              <rect x="38" y="162" width="26" height="10" fill={amber} />
              <rect x="60" y="160" width="6" height="14" rx="1" fill="#2f363a" />
              <rect x="66" y="165" width="34" height="4" rx="1" fill="#d3d9db" />
              <path
                d={forceArrow(70, 167, 22, '#cf6d2a')}
                stroke="#cf6d2a"
                strokeWidth="3"
                fill="none"
              />
              <rect x="34" y="190" width="60" height="56" rx="4" fill="#5a666c" />
              <rect x="38" y="194" width="26" height="48" fill={amber} />
              <rect x="60" y="192" width="6" height="52" rx="1" fill="#2f363a" />
              <rect x="66" y="212" width="34" height="12" rx="2" fill="#d3d9db" />
              <path
                d={forceArrow(70, 218, 24 + 100 * pressureT, '#cf6d2a')}
                stroke="#cf6d2a"
                strokeWidth="4"
                fill="none"
              />
            </g>
          )}
          {/* Moving oil */}
          <g fill="none" strokeWidth="5" strokeLinecap="round">
            <path d="M395 297C360 297 300 297 268 287" {...dash(pumping, '#c9b58a', 0.8)} />
            <path d="M250 267V230" {...dash(pumping, amber)} />
            <path d="M215 172V100H318" {...dash(lift, amber)} />
            <path d="M285 172V128H500V100" {...dash(lower, amber)} />
            <path d="M500 100V128H285V172" {...dash(lift, pale)} />
            <path d="M318 100H215V172" {...dash(lower, pale)} />
            <path d="M310 230V300H380" {...dash(lift, pale)} />
            <path d="M190 230V300H380" {...dash(lower, pale)} />
            <path d="M250 255H332M362 255H380V300" {...dash(relief, '#cf6d2a', 1.4)} />
          </g>
          <g fontSize="13" fill="#5f6d66" fontFamily="inherit">
            <text x="215" y="166" textAnchor="middle">
              A
            </text>
            <text x="285" y="166" textAnchor="middle">
              B
            </text>
            <text x="250" y="244" textAnchor="middle">
              P
            </text>
            <text x="190" y="244" textAnchor="middle">
              T
            </text>
            <text x="310" y="244" textAnchor="middle">
              T
            </text>
          </g>
        </svg>
        <span className="circuit-label" style={{ left: '2%', top: '1%' }}>
          {t('右操作杆')} ·{' '}
          {x > 0.02
            ? t('后拉 {0}%', Math.round(x * 100))
            : x < -0.02
              ? t('前推 {0}%', Math.round(-x * 100))
              : t('中位')}
        </span>
        <span className="circuit-label" data-phone="hide" style={{ left: '56%', top: '1%' }}>
          {t('动臂缸')} · {stroke > 0 ? `${Math.round(stroke * 100)}%` : ''}
        </span>
        {!pascal && (
          <span className="circuit-label" data-phone="hide" style={{ left: '31%', top: '42%' }}>
            {t('主控制阀 · 动臂联')}
          </span>
        )}
        <span className="circuit-label" style={{ right: '3%', top: '66%' }} data-live={relief}>
          {t('溢流阀')} {(EXCAVATOR.relief / 1e6).toFixed(1)} MPa
        </span>
        <span className="circuit-label" data-phone="hide" style={{ left: '20%', top: '95%' }}>
          {t('发动机')} → {t('泵')}
        </span>
        <span className="circuit-label" data-phone="hide" style={{ left: '70%', top: '95%' }}>
          {t('油箱')}
        </span>
        {pascal && variant === 'overlay' && (
          <>
            <span className="circuit-label circuit-pascal" style={{ left: '2%', top: '41%' }}>
              {t('泵活塞 Ø20 mm')} · {mpa} MPa → {(h.pumpForce / 1e3).toFixed(1)} kN
            </span>
            <span className="circuit-label circuit-pascal" style={{ left: '2%', top: '76%' }}>
              {t('动臂活塞 Ø120 mm')} · {mpa} MPa → {(h.force / 1e3).toFixed(0)} kN
            </span>
          </>
        )}
      </div>
      {pascal && variant === 'stacked' && (
        <p className="circuit-legend circuit-pascal">
          {t('泵活塞 Ø20 mm')} · {mpa} MPa → {(h.pumpForce / 1e3).toFixed(1)} kN ·{' '}
          {t('动臂活塞 Ø120 mm')} · {mpa} MPa → {(h.force / 1e3).toFixed(0)} kN
        </p>
      )}
      <p className="circuit-legend">
        {t('P 泵 · T 油箱 · A 无杆腔 · B 有杆腔')} ·{' '}
        {valve === 'hold'
          ? t('阀芯中位，A、B 封闭')
          : relief
            ? t('活塞走不动，油经溢流阀回油箱')
            : valve === 'lift'
              ? t('P→A 进油，B→T 回油')
              : t('P→B 进油，A→T 回油')}
      </p>
    </div>
  );
}
