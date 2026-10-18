import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  chargeSharing,
  clampCoulomb,
  suspendedCharge,
  torsionState,
} from '../../models/coulomb-torsion';
import '../../styles/coulomb-torsion.css';
const smooth = (v: number) => {
  const p = clampCoulomb(v);
  return p * p * (3 - 2 * p);
};
function Ball({
  x,
  y,
  r = 13,
  letter,
  id,
  charged = true,
}: {
  x: number;
  y: number;
  r?: number;
  letter: string;
  id: string;
  charged?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={`url(#${id}-metal)`} stroke="#8d9782" strokeWidth="1" />
      <path
        d={`M${-r * 0.55} ${-r * 0.35}q${r * 0.35} ${-r * 0.5} ${r * 0.8} ${-r * 0.1}`}
        fill="none"
        stroke="#fffef3"
        strokeWidth="2"
        opacity=".8"
      />
      {charged && <path d="M-4 1H4M0 -3V5" stroke="#9f7147" strokeWidth="1.5" />}
      <text y={r + 24} textAnchor="middle">
        {letter}
      </text>
    </g>
  );
}
function Hanging({ distance, fraction, id }: { distance: number; fraction: number; id: string }) {
  const s = suspendedCharge(distance, fraction),
    scale = 1200,
    cx = 94,
    cy = 191,
    px = cx + distance * scale,
    py = cy - s.length * scale,
    bx = cx + s.x * scale,
    by = cy + s.y * scale;
  return (
    <>
      <svg
        viewBox="0 0 440 280"
        role="img"
        aria-label={t('带电球与丝线悬挂的小球，偏角由静电力和重力共同决定')}
      >
        <defs>
          <radialGradient id={`${id}-metal`} cx=".3" cy=".2">
            <stop stopColor="#f2e8c9" />
            <stop offset="1" stopColor="#a9ad92" />
          </radialGradient>
        </defs>
        <ellipse cx="233" cy="262" rx="170" ry="9" fill="#5d6655" opacity=".07" />
        <path
          d={`M${px} ${py}H354V253H${px - 20}`}
          fill="none"
          stroke="#a9b5a4"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path d={`M${px} ${py}V${cy}`} stroke="#c2c8b8" strokeWidth="1.5" strokeDasharray="4 5" />
        <path d={`M${px} ${py}L${bx} ${by}`} stroke="#787b68" strokeWidth="1.5" />
        <path
          d={`M${cx} ${cy + 14}V240h-25h50`}
          fill="none"
          stroke="#b4bca5"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Ball x={cx} y={cy} letter="C" id={id} />
        <Ball x={bx} y={by} letter="A" id={id} charged={fraction > 0} />
        <path d={`M${cx} 242H${bx}`} stroke="#c1b48d" strokeWidth="1.2" />
        <circle cx={px} cy={py} r="4" fill="#727c6b" />
      </svg>
      <div className="coulomb-readout">
        <span>
          {t('球心距离')} <b>{(s.r * 100).toFixed(1)} cm</b>
        </span>
        <span>
          {t('悬线偏角')} <b>{((s.angle * 180) / Math.PI).toFixed(1)}°</b>
        </span>
      </div>
    </>
  );
}
function Balance({
  distance,
  fraction,
  nulling,
  share,
  id,
}: {
  distance: number;
  fraction: number;
  nulling: number;
  share: number | null;
  id: string;
}) {
  const q = share === null ? fraction : chargeSharing(share).a / 3e-9,
    s = torsionState(distance, q, nulling),
    cx = 212,
    cy = 196,
    sx = 850,
    sy = 410,
    ax = cx + s.x * sx,
    ay = cy - s.y * sy,
    bx = cx - s.x * sx * 0.7,
    by = cy + s.y * sy * 0.7,
    cxBall = cx + 0.08 * sx,
    cyBall = cy - distance * sy,
    phi = s.topAngle,
    probe = share === null ? null : chargeSharing(share),
    probeX = ax + 26 + (1 - (probe?.approach ?? 0)) * 90;
  return (
    <>
      <svg
        viewBox="0 0 440 310"
        role="img"
        aria-label={t('透明罩内的扭秤，旋转上端旋钮使带电小球回到参考位置')}
      >
        <defs>
          <radialGradient id={`${id}-metal`} cx=".3" cy=".2">
            <stop stopColor="#f2e8c9" />
            <stop offset="1" stopColor="#a9ad92" />
          </radialGradient>
          <linearGradient id={`${id}-glass`}>
            <stop stopColor="#d7e1d0" stopOpacity=".5" />
            <stop offset=".5" stopColor="#fafcf1" stopOpacity=".08" />
            <stop offset="1" stopColor="#bdcbb7" stopOpacity=".38" />
          </linearGradient>
        </defs>
        <ellipse cx={cx} cy="281" rx="151" ry="22" fill="#b0bfa9" opacity=".2" />
        <path
          d="M61 110V275Q212 320 363 275V110"
          fill={`url(#${id}-glass)`}
          stroke="#b1bfa9"
          strokeWidth="1.3"
        />
        <ellipse
          cx={cx}
          cy="110"
          rx="151"
          ry="26"
          fill="#e4eadb"
          fillOpacity=".35"
          stroke="#b1bfa9"
        />
        <path d="M75 134V255" stroke="#fffdf0" strokeWidth="4" opacity=".8" />
        <path d={`M${cx} 64V${cy}`} stroke="#879684" strokeWidth="1.2" />
        <path d={`M${cxBall} ${cyBall + 14}V255`} stroke="#b9c8ac" strokeWidth="8" />
        <path d={`M${cxBall - 17} 258h34`} stroke="#93a283" strokeWidth="7" strokeLinecap="round" />
        <path
          d={`M${cx - 62} ${cy}H${cx + 90}`}
          stroke="#b6baa6"
          strokeWidth="1.4"
          strokeDasharray="4 5"
        />
        <path
          d={`M${bx} ${by}L${ax} ${ay}`}
          stroke="#938f70"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={bx} cy={by} r="10" fill="#a5a891" stroke="#90977e" />
        <circle cx={cx} cy={cy} r="4" fill="#7b856d" />
        <Ball x={ax} y={ay} id={id} letter="A" />
        <Ball x={cxBall} y={cyBall} id={id} letter="C" />
        <path d={`M${cxBall + 23} ${cyBall}V${cy}`} stroke="#b8ab80" strokeWidth="1" />
        <path
          d={`M${cxBall + 19} ${cyBall}h8M${cxBall + 19} ${cy}h8`}
          stroke="#b8ab80"
          strokeWidth="1.5"
        />
        <g transform={`translate(${cx} 48)`}>
          <circle r="24" fill="#ede9d6" stroke="#abb498" />
          <circle r="18" fill="#d6d6b9" />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              transform={`rotate(${i * 30})`}
              d="M0 -20V-23"
              stroke="#9a9d81"
              strokeWidth="1"
            />
          ))}
          <path
            d={`M0 0L${17 * Math.sin(phi)} ${-17 * Math.cos(phi)}`}
            stroke="#8f704d"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle r="4" fill="#aa9572" />
        </g>
        {probe && (
          <g opacity={share === null ? 0 : 1}>
            <path d={`M${probeX + 13} ${ay}H${probeX + 38}`} stroke="#bccbb0" strokeWidth="6" />
            <Ball x={probeX} y={ay} id={id} letter="D" charged={probe.probe > 1e-11} />
          </g>
        )}
      </svg>
      <div className="coulomb-readout">
        <span>
          r <b>{(s.r * 100).toFixed(1)} cm</b>
        </span>
        <span>
          F <b>{(Math.hypot(s.fx, s.fy) * 1e6).toFixed(2)} μN</b>
        </span>
        <span>
          {t('上端扭角')} <b>{((phi * 180) / Math.PI).toFixed(1)}°</b>
        </span>
      </div>
      <div className="coulomb-condition">
        <i data-null={Math.abs(s.angle) < 0.001} />
        {t(Math.abs(s.angle) < 0.001 ? 'A 已回到参考线，可比较扭角' : '先调上端，让 A 回到参考线')}
        {probe && <span>Qₐ = {(probe.a * 1e9).toFixed(2)} nC</span>}
      </div>
    </>
  );
}
export default function CoulombTorsion() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState(
      film.variant === 'r3-charge-force-comparison' ? 'hanging' : 'balance',
    ),
    [distance, setDistance] = useState(0.09),
    [fraction, setFraction] = useState('1'),
    [nulling, setNulling] = useState(1),
    [share, setShare] = useState(0);
  const c = film.chapter,
    p = smooth((film.chapterProgress - 0.12) / 0.7),
    active = film.watch ? (c === 0 ? 'hanging' : 'balance') : mode,
    d = film.watch ? (c === 0 ? 0.14 - 0.07 * p : c === 2 ? 0.12 - 0.06 * p : 0.08) : distance,
    f = film.watch ? 1 : Number(fraction),
    n = film.watch ? (c === 1 ? p : 1) : nulling,
    sharing = film.watch ? (c === 3 ? p : null) : mode === 'sharing' ? share : null;
  return (
    <section
      className="coulomb-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
    >
      <p className="coulomb-kicker">
        {t(active === 'hanging' ? '先看偏角，再问力由什么决定' : '把小球调回原位，距离才得到控制')}
      </p>
      {active === 'hanging' ? (
        <Hanging distance={d} fraction={f} id={id} />
      ) : (
        <Balance distance={d} fraction={f} nulling={n} share={sharing} id={id} />
      )}
      <div className="coulomb-model-note">{t('球体为便于观察放大；距离按球心计算。')}</div>
      {!film.watch && (
        <div className="coulomb-controls">
          <Segments
            label={t('选择带电小球实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'hanging', label: t('悬球比较') },
              { value: 'balance', label: t('扭秤测力') },
              { value: 'sharing', label: t('接触分电') },
            ]}
          />
          <Range
            label={t('未偏转时的球心距离')}
            value={distance * 100}
            min={4}
            max={16}
            step={0.5}
            unit="cm"
            onChange={(v) => setDistance(v / 100)}
          />
          {mode === 'sharing' ? (
            <Range
              label={t('相同小球靠近 → 接触 → 分开')}
              value={share * 100}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(v) => setShare(v / 100)}
            />
          ) : (
            <Segments
              label={t('A 球电荷')}
              value={fraction}
              onChange={setFraction}
              options={[
                { value: '1', label: 'Q' },
                { value: '.5', label: 'Q / 2' },
                { value: '.25', label: 'Q / 4' },
                { value: '0', label: '0' },
              ]}
            />
          )}{' '}
          {mode !== 'hanging' && (
            <Range
              label={t('上端回零调节')}
              value={nulling * 100}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(v) => setNulling(v / 100)}
            />
          )}
        </div>
      )}
      <details className="coulomb-details">
        <summary>{t('扭秤模型与实验条件')}</summary>
        <p>
          {t(
            '球心间库仑力、悬线回复力矩与摆臂几何共同决定平衡。回零后 κφ = LF；不回零时，距离和力臂都已改变。小球近似点电荷，忽略漏电、空气阻力与导体表面电荷重排。接触分电用两个相同孤立小球的理想等分近似；演示调节的是准静态平衡，不表示真实振动速度。',
          )}
        </p>
      </details>
    </section>
  );
}
