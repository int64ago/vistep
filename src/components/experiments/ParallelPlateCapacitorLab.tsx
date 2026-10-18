import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  plateCapacitor,
  plateProjection,
  PLATE_SIDE,
  PLATE_REFERENCE_CHARGE,
} from '../../models/parallel-plate-capacitor-lab';
import '../../styles/parallel-plate-capacitor-lab.css';
const ease = (p: number) => {
  const v = Math.max(0, Math.min(1, p));
  return v * v * (3 - 2 * v);
};
const poly = (normal: number, z0: number, z1: number) =>
  [
    [normal, 0, z0],
    [normal, PLATE_SIDE, z0],
    [normal, PLATE_SIDE, z1],
    [normal, 0, z1],
  ]
    .map((p) => {
      const q = plateProjection(...(p as [number, number, number]));
      return `${q.x},${q.y}`;
    })
    .join(' ');
export default function ParallelPlateCapacitorLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [gap, setGap] = useState(10),
    [overlap, setOverlap] = useState(100),
    [dielectric, setDielectric] = useState('1'),
    [insertion, setInsertion] = useState(100),
    [connected, setConnected] = useState(false),
    [held, setHeld] = useState(PLATE_REFERENCE_CHARGE);
  const c = film.chapter,
    p = ease((film.chapterProgress - 0.13) / 0.7),
    d = film.watch ? (c === 1 ? 0.01 - 0.005 * p : 0.01) : gap / 1000,
    area = film.watch ? (c === 2 ? 1 - 0.5 * p : 1) : overlap / 100,
    k = film.watch ? (c === 3 ? 3 : 1) : Number(dielectric),
    f = film.watch ? (c === 3 ? p : 0) : insertion / 100,
    closed = film.watch ? c === 0 && p < 0.4 : connected,
    s = plateCapacitor(d, area, k, f, closed, film.watch ? PLATE_REFERENCE_CHARGE : held),
    positive = plateProjection(-d / 2, 0, PLATE_SIDE + s.shift),
    negative = plateProjection(d / 2, PLATE_SIDE, 0),
    needle = Math.min(1.13, s.meterAngle),
    sheetBottom = PLATE_SIDE * (1 - f);
  return (
    <section
      className="platecap-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
    >
      <p className="platecap-kicker">
        {t(closed ? '接着电源，电压由电源维持' : '断开电源，先保持同一份电荷')}
      </p>
      <svg
        viewBox="0 0 440 370"
        role="img"
        aria-label={t('可调平行板电容器与静电计，电源通过开关接入')}
      >
        <defs>
          <linearGradient id={`${id}-metal`}>
            <stop stopColor="#b9bfb0" />
            <stop offset=".45" stopColor="#e8e9d2" />
            <stop offset="1" stopColor="#9eac99" />
          </linearGradient>
          <linearGradient id={`${id}-sheet`}>
            <stop stopColor="#9dbcb9" stopOpacity=".65" />
            <stop offset="1" stopColor="#b8d0c6" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <ellipse cx="215" cy="354" rx="184" ry="10" fill="#839475" opacity=".08" />
        <path
          d={`M${positive.x} ${positive.y}H100V330H330V315M${negative.x} ${negative.y}H390V340H360V315M390 340V350H55V282M55 246V218M55 199V${positive.y}H${positive.x}`}
          fill="none"
          stroke="#97aa91"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d={closed ? 'M55 218V199' : 'M55 218L43 201'}
          fill="none"
          stroke="#9d9576"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="55" cy="199" r="3" fill="#7a8f74" />
        <rect x="39" y="246" width="32" height="36" rx="7" fill="#c8c8a6" stroke="#a3ad8e" />
        <path d="M47 254H63M55 250V258M48 273H62" stroke="#879576" strokeWidth="1.5" />
        <path d="M190 299V338M167 342H214" stroke="#a9b99e" strokeWidth="8" strokeLinecap="round" />
        <polygon
          points={poly(d / 2, 0, PLATE_SIDE)}
          fill={`url(#${id}-metal)`}
          stroke="#849a83"
          strokeWidth="2"
        />
        {k > 1 && (
          <polygon
            points={poly(0, sheetBottom, sheetBottom + PLATE_SIDE)}
            fill={`url(#${id}-sheet)`}
            stroke="#88aaa5"
            strokeWidth="1.5"
          />
        )}
        <polygon
          points={poly(-d / 2, s.shift, PLATE_SIDE + s.shift)}
          fill={`url(#${id}-metal)`}
          fillOpacity=".78"
          stroke="#8d9f85"
          strokeWidth="2"
        />
        <path
          d={`M${plateProjection(-d / 2, 0, s.shift).x} ${plateProjection(-d / 2, 0, s.shift).y + 12}h${d * 2800}`}
          stroke="#aa9970"
          strokeWidth="1.5"
        />
        <g transform="translate(345 266)">
          <circle r="50" fill="#e7ead9" stroke="#aebca1" strokeWidth="2" />
          <circle r="43" fill="#f5f4df" />
          {Array.from({ length: 7 }, (_, i) => {
            const a = i * 0.18;
            return (
              <path
                key={i}
                d={`M${35 * Math.sin(a)} ${-35 * Math.cos(a)}L${39 * Math.sin(a)} ${-39 * Math.cos(a)}`}
                stroke="#b1b69c"
                strokeWidth="1.3"
              />
            );
          })}
          <path
            d={`M0 0L${33 * Math.sin(needle)} ${-33 * Math.cos(needle)}`}
            stroke="#a48b56"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle r="4" fill="#a7b08d" />
          <path d="M-17 50V65H17V50" fill="#b4c0a5" stroke="#9caf91" />
        </g>
      </svg>
      <div className="platecap-condition">
        <span data-connected={closed}>{t(closed ? '电源已接通' : '电源已隔离')}</span>
        <b>Q = {(s.charge * 1e9).toFixed(2)} nC</b>
      </div>
      <div className="platecap-readout">
        <span>
          C <b>{(s.capacitance * 1e12).toFixed(1)} pF</b>
        </span>
        <span>
          U <b>{s.voltage.toFixed(1)} V</b>
        </span>
      </div>
      {s.meterAngle > 1.13 && (
        <p className="platecap-overrange">{t('指针已超量程；电压为模型计算值。')}</p>
      )}
      <div className="platecap-geometry">
        <span>d = {(d * 1000).toFixed(1)} mm</span>
        <span>S = {(s.area * 1e4).toFixed(0)} cm²</span>
        {k > 1 && <span>εᵣ = {k.toFixed(0)}</span>}
      </div>
      {!film.watch && (
        <div className="platecap-controls">
          <button
            className="platecap-switch"
            type="button"
            onClick={() => {
              if (connected) setHeld(s.charge);
              setConnected(!connected);
            }}
          >
            {t(connected ? '断开电源，保留当前电荷' : '接回电源，保持 100 V')}
          </button>
          <Range
            label={t('极板距离')}
            value={gap}
            min={5}
            max={15}
            step={0.5}
            unit="mm"
            onChange={setGap}
          />
          <Range
            label={t('正对面积比例')}
            value={overlap}
            min={50}
            max={100}
            step={1}
            unit="%"
            onChange={setOverlap}
          />
          <Segments
            label={t('插入介质')}
            value={dielectric}
            onChange={setDielectric}
            options={[
              { value: '1', label: t('空气') },
              { value: '2', label: 'εᵣ = 2' },
              { value: '3', label: 'εᵣ = 3' },
            ]}
          />
          {dielectric !== '1' && (
            <Range
              label={t('介质插入比例')}
              value={insertion}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={setInsertion}
            />
          )}
        </div>
      )}
      <details className="platecap-details">
        <summary>{t('固定电荷与静电计的近似')}</summary>
        <p>
          {t(
            '极板距离、正对面积与介质共同决定电容。隔离后 Q 保持不变，U = Q/C；接电源时 U 不变而 Q 改变。静电计采用高输入阻抗与可忽略附加电容近似，指针表示随电压平方变化的静电力矩。忽略漏电、边缘场和介质损耗。间距方向为观察而放大，数值仍按模型计算。',
          )}
        </p>
      </details>
    </section>
  );
}
