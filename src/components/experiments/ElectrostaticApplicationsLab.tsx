import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  cageField,
  cageSurfaceDensity,
  shieldingState,
  smokeState,
  type CageMaterial,
} from '../../models/electrostatic-applications-lab';
import '../../styles/electrostatic-applications-lab.css';
const ease = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
function Shield({
  distance,
  material,
  charge,
  fields,
  id,
}: {
  distance: number;
  material: CageMaterial;
  charge: number;
  fields: boolean;
  id: string;
}) {
  const s = shieldingState(distance, charge, material),
    cx = 260,
    cy = 185,
    scale = 600,
    a = 23 * Math.sin(s.angle),
    b = 23 * Math.cos(s.angle);
  return (
    <>
      <svg
        className="ea-apparatus"
        viewBox="0 0 400 310"
        role="img"
        aria-label={t('带电球靠近验电器；比较无遮罩、金属网罩与绝缘网罩')}
      >
        <defs>
          <radialGradient id={`${id}-sphere`} cx=".3" cy=".25">
            <stop stopColor="#ece8ca" />
            <stop offset="1" stopColor="#b5b58e" />
          </radialGradient>
        </defs>
        {fields &&
          Array.from({ length: 7 }, (_, j) =>
            Array.from({ length: 9 }, (_, i) => {
              const x = 35 + i * 40,
                y = 55 + j * 35,
                worldX = (x - cx) / scale,
                worldY = (y - cy) / scale;
              if (Math.hypot(x - (cx - distance * scale), y - cy) < 30) return null;
              const f = cageField(worldX, worldY, charge, distance, material),
                m = Math.hypot(f.ex, f.ey),
                l = 17 * Math.tanh(m / 2500);
              if (m < 1e-8) return null;
              const dx = (f.ex / m) * l,
                dy = (f.ey / m) * l;
              return (
                <g
                  key={`${i}-${j}`}
                  opacity=".45"
                  transform={`translate(${x} ${y}) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`}
                >
                  <path
                    d={`M0 0H${l}m-4-3 4 3-4 3`}
                    stroke="#9cb197"
                    strokeWidth="1.4"
                    fill="none"
                  />
                </g>
              );
            }),
          )}
        <path d={`M${cx - distance * scale - 2} ${cy + 16}v87`} stroke="#c0b58f" strokeWidth="8" />
        <circle
          cx={cx - distance * scale}
          cy={cy}
          r="19"
          fill={`url(#${id}-sphere)`}
          stroke="#a7af88"
        />
        <text x={cx - distance * scale} y={cy + 8} textAnchor="middle">
          {charge === 0 ? '0' : charge > 0 ? '+' : '−'}
        </text>
        <rect
          x="230"
          y="196"
          width="60"
          height="70"
          rx="17"
          fill="#e7eddd"
          fillOpacity=".8"
          stroke="#bdcbae"
        />
        <path d="M260 167v54" stroke="#a8a17c" strokeWidth="3" />
        <circle cx="260" cy="167" r="10" fill="#bfc5a3" />
        <path
          d={`M260 221l${-a} ${b}M260 221l${a} ${b}`}
          stroke="#b2a071"
          strokeWidth="3.3"
          strokeLinecap="round"
        />
        <path d="M220 275h80" stroke="#c9ceb7" strokeWidth="5" strokeLinecap="round" />
        {material !== 'none' && (
          <g stroke={material === 'metal' ? '#92ab94' : '#c1b7a1'} fill="none">
            <circle cx={cx} cy={cy} r="90" strokeWidth="2" />
            {[18, 36, 54, 72].map((rx) => (
              <ellipse key={rx} cx={cx} cy={cy} rx={rx} ry="90" opacity=".42" />
            ))}
            {[-72, -54, -36, -18, 0, 18, 36, 54, 72].map((dy) => {
              const h = Math.sqrt(90 ** 2 - dy ** 2);
              return <path key={dy} d={`M${cx - h} ${cy + dy}H${cx + h}`} opacity=".42" />;
            })}
          </g>
        )}
        {material === 'metal' &&
          charge !== 0 &&
          Array.from({ length: 16 }, (_, i) => {
            const angle = (i * Math.PI) / 8,
              density = cageSurfaceDensity(angle, charge, distance);
            return (
              <text
                key={i}
                x={cx + 101 * Math.cos(angle)}
                y={cy + 101 * Math.sin(angle) + 7}
                textAnchor="middle"
                className={density < 0 ? 'ea-negative' : 'ea-positive'}
                opacity={Math.min(1, 0.4 + Math.abs(density) * 6e6)}
              >
                {density < 0 ? '−' : '+'}
              </text>
            );
          })}
      </svg>
      <p className="ea-result">
        {t(
          material === 'metal'
            ? '金属表面重新分布电荷，内部指示器保持闭合'
            : material === 'plastic'
              ? '同样形状的绝缘网，不能提供相同的自由电荷重排'
              : '没有网罩，外部电场使验电器的箔片张开',
        )}
      </p>
    </>
  );
}
function Smoke({
  time,
  voltage,
  charging,
  fields,
}: {
  time: number;
  voltage: number;
  charging: boolean;
  fields: boolean;
}) {
  const s = smokeState(time, voltage, charging),
    plate = 285,
    yy = (y: number) => 280 - (y / 0.2) * 210;
  return (
    <>
      <svg
        className="ea-apparatus"
        viewBox="0 0 400 340"
        role="img"
        aria-label={t('无底塑料瓶内的负锯齿电极、正收集片与烟粒迁移')}
      >
        <path
          d="M186 25h58v24q61 12 62 55v177M186 25v24q-65 12-65 55v177"
          fill="#e6eee2"
          fillOpacity=".28"
          stroke="#b5c9b3"
          strokeWidth="2"
        />
        <path d="M121 281q92 10 185 0" fill="none" stroke="#c5d2bd" strokeDasharray="4 6" />
        <path
          d="M147 74H55V201M285 265H330V311H95V240"
          stroke="#9bae98"
          strokeWidth="2.2"
          fill="none"
        />
        <path
          d={`M147 70V263H156${Array.from({ length: 15 }, (_, i) => `L${i % 2 ? 148 : 160} ${259 - i * 13}`).join(' ')}L147 70Z`}
          fill="#a1aea0"
          stroke="#829887"
        />
        <rect x="281" y="72" width="8" height="194" rx="3" fill="#b8b890" />
        <text x="144" y="61" textAnchor="middle">
          −
        </text>
        <text x="285" y="61" textAnchor="middle">
          +
        </text>
        {fields &&
          s.on &&
          [100, 145, 190, 235].map((y) => (
            <path
              key={y}
              d={`M270 ${y}H181m5-4-5 4 5 4`}
              stroke="#bbc39a"
              strokeWidth="1.3"
              fill="none"
            />
          ))}
        {s.particles
          .filter((p) => !p.exited)
          .map((p) => (
            <g key={p.id}>
              {!p.collected && (
                <circle
                  cx={160 + (p.x / 0.1) * 125}
                  cy={yy(p.y)}
                  r="8"
                  fill="#97a497"
                  opacity=".07"
                />
              )}
              <circle
                cx={160 + (p.x / 0.1) * 125}
                cy={yy(p.y)}
                r={p.collected ? 2.4 : 2.1}
                fill={p.collected ? '#a58c64' : p.charge < 0 ? '#89a28b' : '#9da79b'}
                opacity={p.collected ? 0.9 : 0.7}
              />
            </g>
          ))}
        {s.on &&
          charging &&
          [88, 126, 164, 202, 240].map((y, i) => (
            <circle
              key={y}
              cx={164 + ((time * 16 + i * 7) % 35)}
              cy={y}
              r="1.7"
              fill="#b7c8a6"
              opacity=".7"
            />
          ))}
        <rect x="15" y="201" width="80" height="58" rx="18" fill="#d8dfc8" stroke="#b5c4a7" />
        <circle cx="55" cy="230" r="18" stroke="#a2b491" fill="#c5d1b5" />
        <path
          d="M55 230h27v11"
          transform={`rotate(${s.on ? time * 120 : 0} 55 230)`}
          stroke="#9aaa87"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="55" cy="201" r="4" fill="#7f9381" />
        <circle cx="95" cy="240" r="4" fill="#ac9870" />
        <path
          d="M176 319c-20-25 70-34 72-6c2 24-57 28-55 8c1-14 38-15 38-3c0 8-20 9-19 0"
          fill="none"
          stroke="#a4a786"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M210 313q-13-20 3-29" fill="none" stroke="#b8c4af" strokeWidth="2" opacity=".7" />
      </svg>
      <div className="ea-counts">
        <span>
          {t('悬浮')} <b>{s.suspended}</b>
        </span>
        <span>
          {t('已收集')} <b>{s.collected}</b>
        </span>
      </div>
      <p className="ea-result">
        {t(
          s.on
            ? charging
              ? '烟粒带负电，向正收集片迁移'
              : '只有电场，未荷电烟粒不发生本模型的电迁移'
            : time < 8
              ? '起电前，烟粒随空气进入瓶内并悬浮'
              : '停止起电后，新烟粒继续进入；已收集烟粒仍留在片上',
        )}
      </p>
    </>
  );
}
export default function ElectrostaticApplicationsLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    c = film.chapter,
    p = film.chapterProgress,
    authored = {
      mode: c < 3 ? 'shield' : 'smoke',
      material: (c === 0
        ? 'none'
        : c === 1
          ? 'metal'
          : p < 0.5
            ? 'plastic'
            : 'metal') as CageMaterial,
      distance: c === 0 ? 0.37 - 0.14 * ease(p / 0.75) : 0.23,
      charge: 20,
      fields: (c === 1 && p > 0.45) || c === 4,
      phase: c === 3 ? 'fill' : c === 4 ? 'collect' : 'stop',
      time: p * 10,
      voltage: 5,
      charging: true,
    },
    [manual, setManual] = useState<typeof authored | null>(null),
    [wasWatching, setWasWatching] = useState(film.watch);
  if (film.watch !== wasWatching) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(authored);
  }
  const state = film.watch || !manual ? authored : manual,
    change = (patch: Partial<typeof authored>) => setManual({ ...state, ...patch }),
    { mode, material, distance, charge, fields, phase, time, voltage, charging } = state,
    active = mode,
    m = material,
    d = distance,
    showFields = fields,
    elapsed = phase === 'fill' ? time * 0.8 : phase === 'collect' ? 8 + time * 1.2 : 20 + time,
    label =
      active === 'shield'
        ? '同一带电球、同一验电器，只改变罩的材料'
        : '烟没有消失：烟粒从空气转移到收集片';
  return (
    <section
      className="ea-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
      data-mode={mode}
      data-material={material}
      data-distance={distance}
      data-charge={charge}
      data-fields={fields}
      data-phase={phase}
      data-time={time}
      data-voltage={voltage}
      data-charging={charging}
    >
      <p className="ea-kicker">{t(label)}</p>
      {active === 'shield' ? (
        <Shield distance={d} material={m} charge={charge * 1e-9} fields={showFields} id={id} />
      ) : (
        <Smoke time={elapsed} voltage={voltage * 1000} charging={charging} fields={showFields} />
      )}
      {!film.watch && (
        <div className="ea-controls">
          <Segments
            label={t('选择静电应用')}
            value={mode}
            onChange={(mode) => change({ mode })}
            options={[
              { value: 'shield', label: t('静电屏蔽') },
              { value: 'smoke', label: t('静电除尘') },
            ]}
          />
          {active === 'shield' ? (
            <>
              <Segments
                label={t('网罩材料')}
                value={material}
                onChange={(material) => change({ material })}
                options={[
                  { value: 'none', label: t('无遮罩') },
                  { value: 'metal', label: t('金属网') },
                  { value: 'plastic', label: t('绝缘网') },
                ]}
              />
              <Range
                label={t('带电球距罩中心')}
                value={distance}
                min={0.23}
                max={0.37}
                step={0.01}
                unit="m"
                onChange={(distance) => change({ distance })}
              />
              <Range
                label={t('带电球电荷')}
                value={charge}
                min={-20}
                max={20}
                step={2}
                unit="nC"
                onChange={(charge) => change({ charge })}
              />
            </>
          ) : (
            <>
              <Segments
                label={t('起电阶段')}
                value={phase}
                onChange={(v) => {
                  change({ phase: v, time: 5 });
                }}
                options={[
                  { value: 'fill', label: t('通电前') },
                  { value: 'collect', label: t('起电收集') },
                  { value: 'stop', label: t('停止起电') },
                ]}
              />
              <Range
                label={t('该阶段进度')}
                value={time}
                min={0}
                max={10}
                step={0.1}
                onChange={(time) => change({ time })}
              />
              <Range
                label={t('示意电压')}
                value={voltage}
                min={0}
                max={5}
                step={0.5}
                unit="kV"
                onChange={(voltage) => change({ voltage })}
              />
              <button
                type="button"
                aria-pressed={charging}
                onClick={() => change({ charging: !charging })}
              >
                {t(charging ? '对照：关闭烟粒荷电' : '恢复烟粒荷电')}
              </button>
            </>
          )}
          <button type="button" aria-pressed={fields} onClick={() => change({ fields: !fields })}>
            {t(fields ? '隐藏电场箭头' : '显示电场箭头')}
          </button>
        </div>
      )}
      <details className="ea-details">
        <summary>{t('屏蔽与除尘模型的近似')}</summary>
        <p>
          {t(
            '金属网近似为闭合、孤立、中性的球形导体壳，忽略网孔附近漏场；外部球用点电荷近似，表面电荷由镜像解计算。绝缘网不发生自由电荷重排，本模型忽略其介电极化。除尘图采用代表性放大烟粒：荷电随时间趋近饱和，电场力与黏滞阻力平衡，收集后保留粒子位置。尖端放电以荷电开关表示，不计算电离雪崩、空间电荷与真实收集效率。',
          )}
        </p>
      </details>
    </section>
  );
}
