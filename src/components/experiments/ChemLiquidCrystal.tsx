import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  historicalState,
  sampleCell,
  microscopic,
  order,
  fieldCell,
  type P,
} from '../../models/chem-liquid-crystal';
import '../../styles/chem-liquid-crystal.css';
const modes = ['melting', 'clearing', 'order', 'isotropic', 'field'] as const;
type Mode = (typeof modes)[number];
const names = [
  '第一次变化：熔化',
  '第二次变化：澄清',
  '流动与取向并存',
  '取向序消失',
  '电场改变取向',
];
const polygon = (p: P[]) => p.map((v) => `${v.x},${v.y}`).join(' ');
function Historic({ temperature, angle }: { temperature: number; angle: number }) {
  const s = historicalState(temperature),
    cell = sampleCell(angle),
    uid = useId().replace(/:/g, ''),
    tx = (n: number) => 50 + ((n + 0.35) / 1.7) * 220;
  return (
    <div className="clc-historic">
      <svg
        viewBox="0 0 320 250"
        className="clc-history-image"
        role="img"
        aria-label={t('同一份样品先熔化为浑浊流体，再变为澄清液体')}
      >
        <defs>
          <clipPath id={uid}>
            <polygon points={polygon(cell.fluid)} />
          </clipPath>
        </defs>
        <g stroke="#94aca0" strokeWidth="1.2" opacity=".6">
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${90 + i * 24} 65 V180`} fill="none" />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <path key={i} d={`M77 ${80 + i * 25} H244`} fill="none" />
          ))}
        </g>
        <polygon
          points={polygon(cell.boundary)}
          fill="#d4e3d6"
          fillOpacity=".2"
          stroke="#8eaa9b"
          strokeWidth="2.5"
        />
        <g opacity={1 - s.melted}>
          <polygon points={polygon(cell.solid)} fill="#d5dac3" stroke="#9eae94" />
          <path
            transform={`rotate(${angle} 160 122)`}
            d="M88 112 L119 157 L150 112 L188 157 L232 112 M88 145 L112 112 L146 157 L181 112 L213 157"
            fill="none"
            stroke="#a7b49b"
            strokeWidth="1.4"
          />
        </g>
        <g opacity={s.melted}>
          <polygon
            points={polygon(cell.fluid)}
            fill={s.clear > 0.8 ? '#c5daca' : '#e7e9d6'}
            fillOpacity={0.18 + 0.78 * (1 - s.clear)}
          />
          <g clipPath={`url(#${uid})`} opacity={s.cloudy}>
            {Array.from({ length: 30 }, (_, i) => (
              <ellipse
                key={i}
                cx={75 + ((i * 47) % 180)}
                cy={110 + ((i * 31) % 70)}
                rx={10 + (i % 3) * 3}
                ry="6"
                fill={i % 2 ? '#ccd7c0' : '#f3f1da'}
                opacity=".4"
              />
            ))}
          </g>
          <path
            d={`M${cell.fluid
              .filter((v) => Math.abs(v.y - cell.level) < 1e-7)
              .map((v) => `${v.x} ${v.y}`)
              .join(' L')}`}
            fill="none"
            stroke="#88aa99"
            strokeWidth="2"
          />
        </g>
        <rect x={tx(0)} y="209" width={tx(1) - tx(0)} height="8" rx="4" fill="#c6d3b3" />
        <path d="M50 213 H270" fill="none" stroke="#9bb194" strokeWidth="2" />
        <path d={`M${tx(0)} 205 V221 M${tx(1)} 205 V221`} fill="none" stroke="#859e87" />
        <circle cx={tx(temperature)} cy="213" r="6" fill="#b28b52" />
        <text x={tx(0)} y="246">
          T₁
        </text>
        <text x={tx(1)} y="246">
          T₂
        </text>
      </svg>
      <div className="clc-history-label">
        <strong>
          {s.phase === 'solid'
            ? t('固体')
            : s.phase === 'mesophase'
              ? t('浑浊的流体')
              : t('澄清液体')}
        </strong>
        <span>{t('历史样品：苯甲酸胆甾酯')}</span>
        <p>{t('T₁ 熔点 · T₂ 澄清点')}</p>
      </div>
    </div>
  );
}
function Micro({ time, disorder }: { time: number; disorder: number }) {
  const ps = microscopic(time, disorder),
    q = order(ps);
  return (
    <div className="clc-micro">
      <svg
        viewBox="0 0 320 250"
        className="clc-rods"
        role="img"
        aria-label={t('追踪同一条棒状单元，中心位置可以移动，长轴取向仍可保持一致')}
      >
        <rect x="9" y="9" width="302" height="232" rx="22" fill="#d7e2c9" stroke="#a5b99c" />
        {ps.map((a) => (
          <g key={a.id} transform={`translate(${a.x} ${a.y}) rotate(${(a.angle * 180) / Math.PI})`}>
            {a.id === 0 && (
              <circle r="17" fill="none" stroke="#a98848" strokeWidth="1.2" strokeDasharray="2 3" />
            )}
            <rect
              x="-12"
              y="-4"
              width="24"
              height="8"
              rx="4"
              fill={a.id === 0 ? '#b89b60' : '#86a58c'}
              stroke={a.id === 0 ? '#8d7745' : '#6f937a'}
              strokeWidth=".7"
            />
            <path d="M-8 -1 H7" fill="none" stroke="#eef0d1" strokeWidth=".9" opacity=".65" />
          </g>
        ))}
      </svg>
      <div className="clc-order">
        <strong>{t('二维向列相教学模型')}</strong>
        {[
          [t('原晶格印记'), q.position],
          [t('取向一致程度'), q.orientation],
        ].map(([label, n]) => (
          <div className="clc-order-line" key={label as string}>
            <span>{label}</span>
            <i>
              <b style={{ width: `${Number(n) * 100}%` }} />
            </i>
            <em>{Number(n).toFixed(2)}</em>
          </div>
        ))}
        <p>{t('环线追踪同一单元，读数来自当帧坐标')}</p>
      </div>
    </div>
  );
}
function Electric({ voltage }: { voltage: number }) {
  const a = useMemo(() => fieldCell(voltage), [voltage]);
  return (
    <div className="clc-field-layout">
      <svg
        className="clc-field-image"
        viewBox="0 0 320 250"
        role="img"
        aria-label={t('平面锚定的液晶层在电场下弯曲取向，两侧边界仍保持原方向')}
      >
        <rect x="29" y="33" width="252" height="201" rx="16" fill="#cfdfc9" stroke="#9db497" />
        <rect x="29" y="33" width="252" height="12" rx="6" fill="#a6bcaa" />
        <rect x="29" y="222" width="252" height="12" rx="6" fill="#a6bcaa" />
        {Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => {
            const theta = a.at(row / 8),
              x = 55 + col * 50,
              y = 54 + row * 19.5;
            return (
              <g
                key={`${row}-${col}`}
                transform={`translate(${x} ${y}) rotate(${(theta * 180) / Math.PI})`}
              >
                <path
                  d="M-7 0 H7"
                  fill="none"
                  stroke="#779c80"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path d="M-5 -1 H5" fill="none" stroke="#cddfbd" strokeWidth="1" />
              </g>
            );
          }),
        )}
        <path
          d="M17 84 V184 L12 175 M17 184 L22 175"
          fill="none"
          stroke="#b59550"
          strokeWidth="2"
          opacity={Math.min(1, voltage)}
        />
        <text x="305" y="44">
          +
        </text>
        <text x="305" y="233">
          −
        </text>
        <text x="15" y="70">
          E
        </text>
      </svg>
      <div className="clc-output">
        <div
          className="clc-pixel"
          style={{
            background: `rgb(${Math.round(37 + 190 * a.intensity)} ${Math.round(52 + 180 * a.intensity)} ${Math.round(44 + 150 * a.intensity)})`,
          }}
        >
          <i />
          <i />
        </div>
        <strong>
          {t('透射光')} {(a.intensity * 100).toFixed(0)}%
        </strong>
        <span>V/Vₜₕ = {voltage.toFixed(2)}</span>
        <p>{t('交叉偏振片之间的理想单色光')}</p>
      </div>
    </div>
  );
}
export default function ChemLiquidCrystal() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>('melting'),
    [temperature, setTemperature] = useState(0.5),
    [tilt, setTilt] = useState(12),
    [time, setTime] = useState(12),
    [disorder, setDisorder] = useState(0),
    [voltage, setVoltage] = useState(0);
  const m = f.watch ? modes[Math.min(4, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.92)) : 0,
    T = f.watch ? (m === 'melting' ? -0.3 + 0.6 * p : 0.7 + 0.6 * p) : temperature,
    angle = f.watch ? 12 * Math.sin(2 * Math.PI * p) : tilt,
    microTime = f.watch ? (m === 'order' ? 12 * p : 12 + 8 * p) : time,
    D = f.watch ? (m === 'isotropic' ? p : 0) : disorder,
    V = f.watch ? 3 * Math.sin(Math.PI * p) : voltage;
  return (
    <div className={`clc ${f.watch ? 'is-watch' : ''}`}>
      <div className="clc-stage">
        {m === 'melting' || m === 'clearing' ? (
          <Historic temperature={T} angle={angle} />
        ) : m === 'order' || m === 'isotropic' ? (
          <Micro time={microTime} disorder={D} />
        ) : (
          <Electric voltage={V} />
        )}
      </div>
      {!f.watch && (
        <div className="clc-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m === 'melting' || m === 'clearing' ? (
            <>
              <Range
                label={t('相对温度：T₁ = 0，T₂ = 1')}
                value={temperature}
                min={-0.35}
                max={1.35}
                step={0.01}
                onChange={setTemperature}
              />
              <Range
                label={t('倾斜观察角（°）')}
                value={tilt}
                min={-18}
                max={18}
                step={1}
                onChange={setTilt}
              />
            </>
          ) : m === 'order' || m === 'isotropic' ? (
            <>
              <Range
                label={t('移动进程')}
                value={time}
                min={0}
                max={20}
                step={0.05}
                onChange={setTime}
              />
              <Range
                label={t('取向无序程度')}
                value={disorder}
                min={0}
                max={1}
                step={0.01}
                onChange={setDisorder}
              />
            </>
          ) : (
            <Range
              label={t('电压 / 阈值电压')}
              value={voltage}
              min={0}
              max={3}
              step={0.01}
              onChange={setVoltage}
            />
          )}
          <p>{t('历史外观为定性重现；棒状模型与电场装置是分别标明的教学扩展。')}</p>
        </div>
      )}
    </div>
  );
}
