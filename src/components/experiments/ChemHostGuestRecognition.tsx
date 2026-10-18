import { useState, type ReactNode } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  C60,
  C70,
  host,
  add,
  mul,
  sub,
  norm,
  unit,
  rotate,
  competition,
  release,
  crownFit,
  ions,
  crownCavities,
  guestPosition,
  releasedGuestPosition,
  type V,
  type Molecule,
  type Ion,
} from '../../models/chem-host-guest-recognition';
import '../../styles/chem-host-guest-recognition.css';
const modes = ['cages', 'host', 'filter', 'release', 'crown', 'compare'] as const;
type Mode = (typeof modes)[number];
const names = [
  '两种真实碳笼',
  '杯酚的选择性结合',
  '甲苯中的固液分离',
  '改变溶剂，释放客体',
  '冠醚与中心离子',
  '不同空腔的对照',
];
type Instance = {
  molecule: Molecule;
  position: V;
  color: string;
  opacity?: number;
  scale?: number;
  mark?: boolean;
};
function Molecules({
  instances,
  yaw = 0.45,
  pitch = 0.75,
  scale = 14,
  cy = 151,
  viewHeight = 280,
  ion,
  cavity,
}: {
  instances: Instance[];
  yaw?: number;
  pitch?: number;
  scale?: number;
  cy?: number;
  viewHeight?: number;
  ion?: { p: V; r: number };
  cavity?: number;
}) {
  const P = (p: V) => {
    const v = rotate(p, yaw, pitch);
    return { x: 160 + v.x * scale, y: cy + v.y * scale, z: v.z };
  };
  const objects: { z: number; key: string; el: ReactNode }[] = [];
  if (cavity) {
    const pts = Array.from({ length: 65 }, (_, i) =>
      P({
        x: cavity * Math.cos((i * Math.PI) / 32),
        y: cavity * Math.sin((i * Math.PI) / 32),
        z: 0,
      }),
    );
    objects.push({
      z: 0,
      key: 'cavity',
      el: (
        <path
          d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')}
          fill="#8ea77d"
          fillOpacity=".1"
          stroke="#96a27b"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
      ),
    });
  }
  instances.forEach((it, instance) => {
    const pts = it.molecule.atoms.map((a) => ({
      a,
      world: add(it.position, mul(a.p, it.scale ?? 1)),
      p: P(add(it.position, mul(a.p, it.scale ?? 1))),
    }));
    for (const [i, [a, b]] of it.molecule.bonds.entries()) {
      const A = pts[a].p,
        B = pts[b].p;
      for (let j = 0; j < 4; j++) {
        const q = j / 4,
          r = (j + 1) / 4;
        objects.push({
          z: A.z + ((B.z - A.z) * (q + r)) / 2,
          key: `${instance}:b${i}:${j}`,
          el: (
            <path
              d={`M${A.x + (B.x - A.x) * q} ${A.y + (B.y - A.y) * q} L${A.x + (B.x - A.x) * r} ${A.y + (B.y - A.y) * r}`}
              fill="none"
              stroke={it.color}
              strokeWidth={scale > 20 ? 2.8 : 1.7}
              opacity={it.opacity ?? 1}
            />
          ),
        });
      }
    }
    for (const [i, { a, p }] of pts.entries()) {
      const radius = a.element === 'O' ? (scale > 20 ? 6 : 3.5) : scale > 20 ? 3.4 : 1.7;
      objects.push({
        z: p.z,
        key: `${instance}:a${i}`,
        el: (
          <g opacity={it.opacity ?? 1}>
            <circle cx={p.x} cy={p.y} r={radius} fill={a.element === 'O' ? '#b98371' : it.color} />
            {it.mark && i === 0 && (
              <circle
                cx={p.x}
                cy={p.y}
                r={radius + 3}
                fill="none"
                stroke="#c39a51"
                strokeWidth="1.3"
              />
            )}
          </g>
        ),
      });
    }
    if (ion)
      for (const { a, world } of pts.filter((v) => v.a.element === 'O')) {
        const distance = norm(sub(ion.p, world)),
          direction = unit(sub(ion.p, world)),
          end = add(ion.p, mul(direction, -ion.r)),
          A = P(world),
          B = P(end);
        objects.push({
          z: (A.z + B.z) / 2,
          key: `ion-${a.id}`,
          el: (
            <path
              d={`M${A.x} ${A.y} L${B.x} ${B.y}`}
              fill="none"
              stroke="#a3a16f"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              opacity={Math.max(0.08, 1 - distance / 8)}
            />
          ),
        });
      }
  });
  if (ion) {
    const p = P(ion.p),
      r = ion.r * scale;
    objects.push({
      z: p.z,
      key: 'ion',
      el: (
        <g>
          <circle
            cx={p.x}
            cy={p.y}
            r={r}
            fill="#a8b989"
            fillOpacity=".8"
            stroke="#849866"
            strokeWidth="1.3"
          />
          <circle
            cx={p.x - r * 0.25}
            cy={p.y - r * 0.25}
            r={r * 0.28}
            fill="#fff6cf"
            fillOpacity=".35"
          />
          <path
            d={`M${p.x - 4} ${p.y} H${p.x + 4} M${p.x} ${p.y - 4} V${p.y + 4}`}
            fill="none"
            stroke="#5f754f"
            strokeWidth="1.3"
          />
        </g>
      ),
    });
  }
  objects.sort((a, b) => a.z - b.z);
  return (
    <svg
      width="320"
      height={viewHeight}
      viewBox={`0 0 320 ${viewHeight}`}
      role="img"
      aria-label={t('根据同一套原子坐标和连接表绘制的主客体结构')}
    >
      {objects.map((o) => (
        <g key={o.key}>{o.el}</g>
      ))}
    </svg>
  );
}
function Cages({ p }: { p: number }) {
  return (
    <div className="chgr-cages">
      {[C60, C70].map((m, i) => (
        <div key={i}>
          <Molecules
            instances={[
              {
                molecule: m,
                position: { x: 0, y: 0, z: 0 },
                color: i ? '#a78a66' : '#6f8e85',
                mark: true,
              },
            ]}
            scale={29}
            yaw={0.2 + 0.9 * p}
            pitch={0.35}
            cy={130}
          />
          <strong>{i ? 'C₇₀' : 'C₆₀'}</strong>
          <span>{i ? t('70 个碳 · 105 条连接') : t('60 个碳 · 90 条连接')}</span>
        </div>
      ))}
    </div>
  );
}
function Binding({ p, releaseMode = false }: { p: number; releaseMode?: boolean }) {
  const pos = releaseMode ? releasedGuestPosition(p) : guestPosition(p);
  return (
    <Molecules
      instances={[
        {
          molecule: host,
          position: { x: releaseMode ? -5 * p : 0, y: 0, z: 0 },
          color: '#b19b6f',
          opacity: 0.9,
        },
        { molecule: C60, position: pos, color: '#66887c', mark: true },
      ]}
      scale={11.4}
      cy={193}
      yaw={0}
      pitch={0.86}
    />
  );
}
function Filtration({ p, purity }: { p: number; purity: number }) {
  const t1 = ease(ramp(p, 0.08, 0.85)),
    y = 85 + 147 * t1,
    x = y < 150 ? 185 - 25 * ease((y - 85) / 65) : y < 205 ? 160 : 160 + 12 * ease((y - 205) / 27);
  return (
    <div className="chgr-filter">
      <svg
        viewBox="0 0 320 270"
        role="img"
        aria-label={t('杯酚配合物留在滤纸上，游离客体随甲苯进入滤液')}
      >
        <path
          d="M81 65 L146 167 V203 H174 V167 L239 65"
          fill="#d8e5df"
          fillOpacity=".2"
          stroke="#8ea69c"
          strokeWidth="2"
        />
        <path
          d="M90 66 L160 156 L230 66"
          fill="#eee7cf"
          fillOpacity=".65"
          stroke="#b1ab8f"
          strokeWidth="1.2"
        />
        <ellipse cx="160" cy="66" rx="79" ry="10" fill="none" stroke="#8ea69c" strokeWidth="1.7" />
        <path
          d="M109 211 V246 Q109 258 122 258 H198 Q211 258 211 246 V211"
          fill="#dae6e0"
          fillOpacity=".25"
          stroke="#92a99e"
          strokeWidth="1.7"
        />
        <path
          d={`M112 ${250 - 25 * t1} H208 V245 Q208 255 197 255 H123 Q112 255 112 245Z`}
          fill="#c7b58a"
          fillOpacity=".38"
        />
        <path
          d="M150 201 V224 M170 201 V224"
          fill="none"
          stroke="#c7b58a"
          strokeOpacity={0.2 + 0.4 * Math.sin(Math.PI * t1)}
          strokeWidth="3"
        />
        <ellipse cx="160" cy="117" rx="28" ry="11" fill="#9b9672" fillOpacity=".4" />
        <g transform="translate(120 75) scale(.25)">
          <Molecules
            instances={[
              { molecule: host, position: { x: 0, y: 0, z: 0 }, color: '#9c895e' },
              { molecule: C60, position: { x: 0, y: 0, z: 2 }, color: '#658478' },
            ]}
            scale={11}
            cy={145}
          />
        </g>
        <g transform={`translate(${x - 24} ${y - 22}) scale(.15)`}>
          <Molecules
            instances={[
              { molecule: C70, position: { x: 0, y: 0, z: 0 }, color: '#a18159', mark: true },
            ]}
            scale={22}
            cy={145}
          />
        </g>
      </svg>
      <div className="chgr-pools">
        <span>
          {t('保留相中 C₆₀')} <b>{(purity * 100).toFixed(1)}%</b>
        </span>
        <span>
          {t('仍含 C₇₀')} <b>{((1 - purity) * 100).toFixed(1)}%</b>
        </span>
      </div>
      <p className="chgr-note">{t('标记为放大示踪；选择性不等于完全排斥。')}</p>
    </div>
  );
}
function Crown({
  m,
  ion,
  p = 1,
  compact = false,
}: {
  m: 4 | 5 | 6 | 7;
  ion: Ion;
  p?: number;
  compact?: boolean;
}) {
  const f = crownFit(m, ion, p);
  return (
    <div className="chgr-crown">
      <Molecules
        instances={[{ molecule: f, position: { x: 0, y: 0, z: 0 }, color: '#81928b' }]}
        ion={{ p: f.ionPosition, r: f.ionRadius }}
        cavity={f.holeRadius}
        scale={compact ? 28 : 29}
        cy={compact ? 135 : 165}
        yaw={0}
        pitch={0.65}
        viewHeight={compact ? 270 : 290}
      />
      <div className="chgr-crown-label">
        <strong>
          {3 * m}-{t('冠')}-{m}
        </strong>
        <span>
          {ion}⁺ · {ions[ion]} pm
        </span>
      </div>
      <p>
        {crownCavities[m][0]}–{crownCavities[m][1]} pm
      </p>
    </div>
  );
}
export default function ChemHostGuestRecognition() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>('cages'),
    [progress, setProgress] = useState(0.7),
    [ratio, setRatio] = useState(10),
    [size, setSize] = useState<4 | 5 | 6 | 7>(6),
    [ion, setIon] = useState<Ion>('K');
  const m = f.watch ? modes[Math.min(5, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.92)) : progress;
  const s = competition(f.watch ? 30 : 3 * ratio, 3),
    r = release(p, f.watch ? 30 : 3 * ratio, 3);
  return (
    <div className={`chgr ${f.watch ? 'is-watch' : ''}`}>
      <div className={`chgr-stage chgr-mode-${m}`}>
        <div className="chgr-heading">
          {t(
            m === 'cages'
              ? '原子数不同，碳笼形状也不同'
              : m === 'host'
                ? '杯酚骨架示意 · 同一 C₆₀ 客体'
                : m === 'filter'
                  ? '甲苯体系 · 配合物与游离客体分开'
                  : m === 'release'
                    ? '改变溶剂 · 客体释放，主体回收'
                    : m === 'crown'
                      ? '冠醚的氧原子朝向中心离子'
                      : '空腔范围是近似值，不是硬质筛孔',
          )}
        </div>
        {m === 'cages' ? (
          <Cages p={p} />
        ) : m === 'host' ? (
          <>
            <Binding p={p} />
            <p className="chgr-note">{t('代表性结合构图；C₇₀ 也能形成配合物。')}</p>
          </>
        ) : m === 'filter' ? (
          <Filtration p={p} purity={s.purity} />
        ) : m === 'release' ? (
          <>
            <Binding p={p} releaseMode />
            <div className="chgr-pools">
              <span>
                {t('客体释放进度')}{' '}
                <b>{((100 * (r.released60 + r.released70)) / (r.b60 + r.b70)).toFixed(0)}%</b>
              </span>
              <span>
                {t('保留相总份额')} <b>{(r.retained60 + r.retained70).toFixed(3)}</b>
              </span>
            </div>
            <p className="chgr-note">{t('释放的是富集样品，不保证一次得到纯 C₆₀。')}</p>
          </>
        ) : m === 'crown' ? (
          <>
            <Crown m={f.watch ? 6 : size} ion={f.watch ? 'K' : ion} p={p} />
            <div className="chgr-key">
              <span>{t('红色：醚氧')}</span>
              <span>{t('绿色：阳离子')}</span>
            </div>
          </>
        ) : (
          <div className="chgr-comparison">
            {(
              [
                [4, 'Li'],
                [5, 'Na'],
                [6, 'K'],
                [7, 'Cs'],
              ] as const
            ).map(([m, ion]) => (
              <Crown key={m} m={m} ion={ion} compact />
            ))}
          </div>
        )}
      </div>
      {!f.watch && (
        <div className="chgr-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m !== 'compare' && (
            <Range
              label={t('演示进度')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {(m === 'filter' || m === 'release') && (
            <Range
              label={t('教学结合常数比 K₆₀/K₇₀')}
              value={ratio}
              min={1}
              max={20}
              step={0.5}
              onChange={setRatio}
            />
          )}
          {m === 'crown' && (
            <>
              <Segments
                label={t('冠醚环')}
                value={String(size)}
                options={([4, 5, 6, 7] as const).map((v) => ({
                  value: String(v),
                  label: `${3 * v}-${t('冠')}-${v}`,
                }))}
                onChange={(v) => setSize(Number(v) as 4 | 5 | 6 | 7)}
              />
              <Segments
                label={t('离子')}
                value={ion}
                options={(Object.keys(ions) as Ion[]).map((value) => ({
                  value,
                  label: `${value}⁺`,
                }))}
                onChange={(v) => setIon(v as Ion)}
              />
            </>
          )}
          <p>
            {t(
              '分子骨架保留连接关系；结合常数与分离份额是教学模型，构象和路径不等于结构测定或真实动力学。',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
