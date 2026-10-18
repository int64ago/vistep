import { useId, useState, type ReactNode } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  salts,
  copper,
  silver,
  copperLigands,
  silverLigands,
  ironComparison,
  rotate,
  add,
  mul,
  unit,
  type V,
  type Ligand,
} from '../../models/chem-coordination-colors';
import '../../styles/chem-coordination-colors.css';
const modes = [
  'salts',
  'precipitate',
  'ammine',
  'ligands',
  'crystallize',
  'silver-solid',
  'silver-complex',
  'iron',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '六种盐的溶解对照',
  '少量氨水生成沉淀',
  '过量氨水使沉淀溶解',
  '配体改变，中心铜保留',
  '乙醇使配合物析晶',
  '生成白色氯化银',
  '氨配合使银盐溶解',
  '简单离子与配离子',
];
const blend = (a: number[], b: number[], q: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * q)).join(' ')})`;
function Tube({
  color,
  solid = 0,
  solidColor = '#c0d7e0',
  crystal = false,
  level = 130,
  drop = -1,
  rod = 0,
  small = false,
}: {
  color: string;
  solid?: number;
  solidColor?: string;
  crystal?: boolean;
  level?: number;
  drop?: number;
  rod?: number;
  small?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const rodOffset =
    -230 * (1 - ease(ramp(rod, 0, 0.45))) +
    3 * Math.sin(rod * 8 * Math.PI) * ease(ramp(rod, 0.45, 0.6));
  return (
    <svg
      viewBox={small ? '90 -5 150 260' : '0 0 320 270'}
      role="img"
      aria-label={t('试管中的溶液与固相')}
    >
      <defs>
        <clipPath id={uid}>
          <path d="M120 51 V218 Q120 244 160 244 Q200 244 200 218 V51Z" />
        </clipPath>
        <linearGradient id={`${uid}-glass`}>
          <stop stopColor="#f8fbf3" stopOpacity=".62" />
          <stop offset=".32" stopColor="#d0e0dc" stopOpacity=".15" />
          <stop offset="1" stopColor="#87a49e" stopOpacity=".18" />
        </linearGradient>
      </defs>
      {!small && (
        <g>
          <ellipse cx="238" cy="257" rx="42" ry="7" fill="#b1b8a4" />
          <path d="M239 256 V98 H203 M205 91 V107" fill="none" stroke="#9eaa9a" strokeWidth="5" />
        </g>
      )}
      <g clipPath={`url(#${uid})`}>
        <path d={`M117 ${level} H203 V250 H117Z`} fill={color} />
        <ellipse
          cx="160"
          cy={level}
          rx="40"
          ry="5"
          fill={color}
          stroke="#7b9d9e"
          strokeOpacity=".4"
        />
        {Array.from({ length: 32 }, (_, i) => {
          const x = 130 + ((i * 37) % 62),
            y = 220 + ((i * 19) % 18),
            r = (crystal ? 5 : 5.5) * Math.cbrt(Math.max(0, solid));
          return crystal ? (
            <path
              key={i}
              d={`M${x - r} ${y} L${x} ${y - r * 1.8} L${x + r} ${y} L${x} ${y + r * 0.6}Z`}
              fill={solidColor}
              stroke="#264d7a"
              strokeWidth={solid > 0.01 ? 0.5 : 0}
            />
          ) : (
            <g key={i} opacity={solid > 0.001 ? 1 : 0}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.7} fill={solidColor} />
              <ellipse cx={x + 2} cy={y - 2} rx={r * 0.6} ry={r * 0.5} fill={solidColor} />
            </g>
          );
        })}
      </g>
      {rod > 0 && (
        <path
          d={`M180 ${23 + rodOffset} L198 ${213 + rodOffset}`}
          fill="none"
          stroke="#c6ddda"
          strokeWidth="5"
        />
      )}
      <path
        d="M116 49 V217 Q116 248 160 248 Q204 248 204 217 V49"
        fill={`url(#${uid}-glass)`}
        stroke="#94afa5"
        strokeWidth="1.7"
      />
      <ellipse cx="160" cy="49" rx="44" ry="5" fill="none" stroke="#94afa5" strokeWidth="1.7" />
      <path d="M124 64 V211" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="3" />
      {drop >= 0 && (
        <g>
          <path d="M151 8 V27 L160 37 L169 27 V8" fill="#d6e5df" stroke="#8fa79c" />
          <rect x="148" y="0" width="24" height="13" rx="8" fill="#728e84" />
          {[0, 0.33, 0.66].map((offset, i) => {
            const q = (drop + offset) % 1;
            return (
              <path
                key={i}
                d={`M160 ${39 + q * Math.max(8, level - 52)} Q154 ${47 + q * Math.max(8, level - 52)} 160 ${49 + q * Math.max(8, level - 52)} Q166 ${47 + q * Math.max(8, level - 52)} 160 ${39 + q * Math.max(8, level - 52)}Z`}
                fill="#bdcfd1"
                opacity={(drop > 0 && drop < 1 ? 1 : 0) * Math.sin(Math.PI * q)}
              />
            );
          })}
        </g>
      )}
    </svg>
  );
}
function SaltComparison({ progress }: { progress: number }) {
  const q = ease(ramp(progress, 0.15, 0.9));
  return (
    <div className="ccol-salts">
      {salts.map((s) => (
        <div key={s.formula}>
          <Tube
            small
            color={s.copper ? blend([229, 238, 232], [112, 180, 210], q) : '#e3ede5'}
            solid={1 - q}
            solidColor={s.solid}
            level={205 - 94 * ease(ramp(progress, 0, 0.3))}
          />
          <strong>
            {s.formula.split('·').map((part, i) => (
              <span className="ccol-formula-part" key={part}>
                {i > 0 ? '·' : ''}
                {part}
              </span>
            ))}
          </strong>
          <span>{t(s.copper ? '含铜盐' : '对照盐')}</span>
        </div>
      ))}
    </div>
  );
}
function Complex({ progress, silverMode = false }: { progress: number; silverMode?: boolean }) {
  const lig = silverMode ? silverLigands() : copperLigands(progress),
    uid = useId().replace(/:/g, ''),
    scale = silverMode ? 34 : 23;
  const P = (p: V) => {
    const v = rotate(p, 0.48, 0.55);
    return { x: 160 + v.x * scale, y: 137 - v.y * scale, z: v.z };
  };
  const items: { z: number; key: string; el: ReactNode }[] = [];
  const addBall = (key: string, p: V, r: number, color: string, opacity = 1) => {
    const A = P(p);
    items.push({
      z: A.z,
      key,
      el: (
        <g opacity={opacity}>
          <circle cx={A.x} cy={A.y} r={r} fill={color} stroke="#4e6562" strokeWidth=".55" />
          <circle cx={A.x - r * 0.25} cy={A.y - r * 0.3} r={r * 0.3} fill="#fffdf1" opacity=".7" />
        </g>
      ),
    });
  };
  const bond = (key: string, a: V, b: V, color: string, opacity = 1, dashed = false) => {
    const A = P(a),
      B = P(b);
    items.push({
      z: (A.z + B.z) / 2,
      key,
      el: (
        <path
          d={`M${A.x} ${A.y} L${B.x} ${B.y}`}
          fill="none"
          stroke={color}
          strokeWidth={dashed ? 1.4 : 2}
          strokeDasharray={dashed ? '3 3' : undefined}
          opacity={opacity}
        />
      ),
    });
  };
  for (const l of lig) {
    const external = l.bound < 0.001 && !l.axial,
      opacity = l.axial ? 0.4 : external ? 0.3 : 0.85;
    bond(
      `${l.id}-coord`,
      { x: 0, y: 0, z: 0 },
      l.center,
      '#9d9c6b',
      l.bound * (l.axial ? 0.35 : 0.8),
      l.axial,
    );
    for (const [h, hp] of l.hydrogens.entries()) {
      bond(`${l.id}-h${h}`, l.center, hp, '#a4b5aa', opacity);
      addBall(`${l.id}-hb${h}`, hp, 3.6, '#fff7df', opacity);
    }
    addBall(
      l.id,
      l.center,
      l.element === 'O' ? 6.7 : 7,
      l.element === 'O' ? '#bd8477' : '#7d95b0',
      opacity,
    );
    if (l.element === 'N' && l.bound > 0.1) {
      const inward = mul(unit(l.center), -0.45),
        e = P(add(l.center, inward));
      items.push({
        z: e.z + 0.1,
        key: `electrons-${l.id}`,
        el: (
          <g fill="#ad8c47" opacity={l.bound}>
            <circle cx={e.x - 2} cy={e.y} r="1.5" />
            <circle cx={e.x + 2} cy={e.y} r="1.5" />
          </g>
        ),
      });
    }
  }
  addBall('center', { x: 0, y: 0, z: 0 }, 10.5, silverMode ? '#c5cbc4' : '#8facb1');
  items.sort((a, b) => a.z - b.z);
  return (
    <svg
      viewBox="0 0 320 280"
      role="img"
      aria-label={t(
        silverMode ? '线形二氨合银离子' : '四个赤道配体依次由水换成氨，轴向水另画为淡色',
      )}
    >
      <defs>
        <marker id={uid} markerWidth="4" markerHeight="4" refX="2" refY="2">
          <circle cx="2" cy="2" r="1" fill="#ad8c47" />
        </marker>
      </defs>
      {items.map((i) => (
        <g key={i.key}>{i.el}</g>
      ))}
      <circle cx="160" cy="137" r="14" fill="none" stroke="#c0934b" strokeWidth="1.4" />
    </svg>
  );
}
function Iron({ p, reagent }: { p: number; reagent: boolean }) {
  const s = ironComparison(p, reagent);
  return (
    <div className="ccol-iron">
      <div>
        <Tube
          small
          color={blend([225, 209, 144], [158, 57, 47], s.freeIronRed)}
          drop={p > 0 && p < 1 ? p : 0}
          level={130 - 12 * p}
        />
        <strong>FeCl₃</strong>
        <span>{t(s.freeIronRed > 0.01 ? '可与 SCN⁻ 显色' : '尚无明显红色')}</span>
      </div>
      <div>
        <Tube small color="#d8cf91" drop={p > 0 && p < 1 ? p : 0} level={130 - 12 * p} />
        <strong>K₃[Fe(CN)₆]</strong>
        <span>{t('同条件下无明显红色')}</span>
      </div>
    </div>
  );
}
export default function ChemCoordinationColors() {
  const f = useShowcase(),
    initial =
      f.variant === 'silver-ammonia'
        ? 'silver-solid'
        : f.variant === 'copper-ammonia' || f.variant === 'complex-practice'
          ? 'precipitate'
          : 'salts';
  const [mode, setMode] = useState<Mode>(initial),
    [progress, setProgress] = useState(0.7),
    [reagent, setReagent] = useState('active'),
    [ammonia, setAmmonia] = useState(0.3),
    [chloride, setChloride] = useState(0.05);
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.9)) : progress,
    active = f.watch || reagent === 'active',
    s = m === 'precipitate' || m === 'ammine' || m === 'crystallize' ? copper(m, p, active) : null;
  const ag = silver(active ? (f.watch ? 0.3 * p : ammonia) : 0, 0.003, f.watch ? 0.05 : chloride);
  const heading =
    m === 'salts'
      ? '相同处理：少量固体 + 足量水'
      : m === 'ligands'
        ? '铜中心保留 · 四个赤道配体替换'
        : m === 'iron'
          ? '相同条件：加入硫氰化钾'
          : m === 'crystallize'
            ? '加入乙醇，并摩擦管壁'
            : m === 'silver-solid'
              ? 'NaCl 溶液 + AgNO₃'
              : m === 'silver-complex'
                ? '加入氨水，降低游离 Ag⁺'
                : m === 'precipitate'
                  ? '先滴加少量氨水'
                  : '继续加氨水并混匀';
  return (
    <div className={`ccol ${f.watch ? 'is-watch' : ''}`}>
      <div className={`ccol-stage ccol-mode-${m}`}>
        <div className="ccol-heading">
          {t(!active && !['salts', 'ligands', 'silver-solid'].includes(m) ? '加水对照' : heading)}
        </div>
        {m === 'salts' ? (
          <SaltComparison progress={p} />
        ) : m === 'ligands' ? (
          <>
            <Complex progress={p} />
            <div className="ccol-formula">{p > 0.98 ? '[Cu(NH₃)₄]²⁺' : 'Cu²⁺ · H₂O ⇢ NH₃'}</div>
            <p className="ccol-note">{t('教材简写；淡色表示额外轴向水配位。')}</p>
            <div className="ccol-key">
              <span>{t('红：O')}</span>
              <span>{t('蓝：N')}</span>
              <span>{t('浅：H')}</span>
            </div>
          </>
        ) : m === 'iron' ? (
          <Iron p={p} reagent={active} />
        ) : m === 'silver-complex' ? (
          <div className="ccol-silver">
            <div>
              <Tube
                small
                color="#e2ece5"
                solid={ag.solid / ag.totalAg}
                solidColor="#f4f1e3"
                drop={p > 0 && p < 1 ? p : 0}
                level={128 - 15 * p}
              />
              <strong>
                {t('固体保留')} {((100 * ag.solid) / ag.totalAg).toFixed(0)}%
              </strong>
            </div>
            <div>
              <div style={{ opacity: Math.min(1, ag.fraction * 5) }}>
                <Complex silverMode progress={1} />
              </div>
              <strong>{ag.fraction > 0.01 ? '[Ag(NH₃)₂]⁺' : 'AgCl(s)'}</strong>
            </div>
            <p>
              {t(
                ag.fraction > 0.99
                  ? '配位后仍在溶液中；不是银消失了。'
                  : ag.fraction > 0.01
                    ? '固态与溶解态银共存；总银守恒。'
                    : '氨不足时，氯化银主要保留为固体。',
              )}
            </p>
          </div>
        ) : (
          <>
            <Tube
              color={
                s
                  ? `rgb(${[229, 238, 232].map((v, i) => Math.round(v + ([147, 196, 214][i] - v) * s.aqua + ([62, 93, 176][i] - v) * s.complex)).join(' ')})`
                  : '#e4ece5'
              }
              solid={s ? (m === 'crystallize' ? s.crystal : s.hydroxide) : p}
              solidColor={
                m === 'crystallize' ? '#385b9b' : m === 'silver-solid' ? '#f4f1e3' : '#a5cbdc'
              }
              crystal={m === 'crystallize'}
              rod={m === 'crystallize' ? ease(ramp(p, 0.15, 0.85)) : 0}
              drop={p > 0 && p < 0.95 ? p : 0}
              level={m === 'crystallize' ? 128 - 50 * p : 138 - 20 * p}
            />
            <div className="ccol-formula">
              {m === 'precipitate'
                ? s!.hydroxide > 0.001
                  ? 'Cu(OH)₂ ↓'
                  : '[Cu(H₂O)₆]²⁺'
                : m === 'ammine'
                  ? s!.hydroxide < 0.001
                    ? '[Cu(NH₃)₄]²⁺'
                    : s!.complex > 0.001
                      ? t('沉淀逐渐转入深蓝溶液')
                      : 'Cu(OH)₂ ↓'
                  : m === 'crystallize'
                    ? s!.crystal > 0.001
                      ? '[Cu(NH₃)₄]SO₄·H₂O ↓'
                      : '[Cu(NH₃)₄]²⁺'
                    : p > 0
                      ? 'AgCl ↓'
                      : 'Ag⁺ + Cl⁻'}
            </div>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="ccol-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m !== 'silver-complex' && (
            <Range
              label={t('演示进度')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {!['salts', 'ligands', 'silver-solid'].includes(m) && (
            <Segments
              label={t('加入物对照')}
              value={reagent}
              options={[
                { value: 'active', label: t('指定试剂') },
                { value: 'water', label: t('蒸馏水') },
              ]}
              onChange={setReagent}
            />
          )}
          {m === 'silver-complex' && (
            <>
              <Range
                label={t('游离氨浓度（mol/L）')}
                value={ammonia}
                min={0}
                max={0.5}
                step={0.01}
                onChange={setAmmonia}
              />
              <Range
                label={t('背景氯离子浓度（mol/L）')}
                value={chloride}
                min={0.01}
                max={0.2}
                step={0.01}
                onChange={setChloride}
              />
            </>
          )}
          <p>
            {t(
              '铜和铁为定性观察过程；银为固定体积、给定游离氨的理想平衡模型。进度不是滴数或真实时间。',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
