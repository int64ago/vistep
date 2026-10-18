import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  wireForceFactors,
  wireForceProjection as P,
  type WireContacts,
} from '../../models/wire-force-factors-lab';
import '../../styles/wire-force-factors-lab.css';
const ease = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
function Box({
  x,
  y,
  z,
  w,
  h,
  d,
  color,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
}) {
  const a = P(x - w / 2, y - h / 2, z - d / 2),
    b = P(x + w / 2, y - h / 2, z - d / 2),
    c = P(x + w / 2, y + h / 2, z - d / 2),
    e = P(x - w / 2, y + h / 2, z - d / 2),
    f = P(x - w / 2, y - h / 2, z + d / 2),
    g = P(x + w / 2, y - h / 2, z + d / 2),
    j = P(x + w / 2, y + h / 2, z + d / 2),
    k = P(x - w / 2, y + h / 2, z + d / 2);
  return (
    <g stroke="#9aaa8f" strokeWidth=".8" strokeLinejoin="round">
      <polygon points={[e, c, j, k].map((p) => p.join(',')).join(' ')} fill={color} />
      <polygon
        points={[b, g, j, c].map((p) => p.join(',')).join(' ')}
        fill={color}
        style={{ filter: 'brightness(.94)' }}
      />
      <polygon
        points={[f, g, j, k].map((p) => p.join(',')).join(' ')}
        fill={color}
        style={{ filter: 'brightness(.98)' }}
      />
      <path d={`M${a}L${b}`} opacity=".3" />
    </g>
  );
}
export default function WireForceFactorsLab() {
  const film = useShowcase(),
    [contacts, setContacts] = useState<WireContacts>('outer'),
    [current, setCurrent] = useState(2),
    [offset, setOffset] = useState(0),
    [field, setField] = useState(0.08);
  const c = film.chapter,
    p = film.chapterProgress,
    I = film.watch ? (c === 0 ? 0.5 + 1.5 * ease(p / 0.7) : 2) : current,
    chosen: WireContacts = film.watch ? (c === 1 && p < 0.5 ? 'inner' : 'outer') : contacts,
    shift = film.watch ? (c === 2 ? 0.08 * ease(p / 0.7) : 0) : offset,
    B = film.watch ? (c === 3 ? 0.04 + 0.04 * ease(p / 0.65) : 0.08) : field,
    s = wireForceFactors(I, B, chosen, shift),
    left = P(-0.24 + shift, s.rise, s.z),
    right = P(0.24 + shift, s.rise, s.z),
    a = P(s.start, s.rise, s.z),
    b = P(s.end, s.rise, s.z),
    mid = P(shift, s.rise, s.z),
    bracketA = P(s.left, s.rise, s.z + 0.055),
    bracketB = P(s.right, s.rise, s.z + 0.055),
    forceEnd = P(shift, s.rise, s.z + (s.force >= 0 ? 0.1 : -0.1)),
    label = film.watch
      ? c === 0
        ? '接点不变，只增加电流'
        : c === 1
          ? '同一磁场，接点 2–3 改为 1–4'
          : c === 2
            ? '把部分通电导线移出磁区，有效长度减小'
            : '磁场改变时，相同 Iℓ 产生不同受力'
      : '只计入通电且位于磁区内的导线';
  return (
    <section className="wf-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="wf-kicker">{t(label)}</p>
      <svg
        viewBox="0 0 400 365"
        className="wf-apparatus"
        role="img"
        aria-label={t('三个并排蹄形磁体、悬挂直导线、四个可切换接点和闭合供电线路')}
      >
        <path
          d="M30 274V40H370V274M15 278h30M355 278h30"
          stroke="#bcc7ad"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[-0.08, 0, 0.08].map((x) => (
          <g key={x}>
            <Box x={x} y={0} z={-0.13} w={0.068} h={0.13} d={0.03} color="#b2c3a8" />
            <Box x={x} y={-0.04} z={0.01} w={0.068} h={0.025} d={0.3} color="#c0aa7d" />
            <Box x={x} y={0.04} z={0.01} w={0.068} h={0.025} d={0.3} color="#a5bca8" />
            <text x={P(x, 0.04, 0.162)[0]} y={P(x, 0.04, 0.162)[1] + 6} textAnchor="middle">
              S
            </text>
            <text x={P(x, -0.04, 0.162)[0]} y={P(x, -0.04, 0.162)[1] + 6} textAnchor="middle">
              N
            </text>
            <path
              d={`M${P(x, -0.02, 0)}L${P(x, 0.02, 0)}m-4 6 4-6 4 6`}
              fill="none"
              stroke="#8eaa94"
              strokeWidth="1.7"
            />
          </g>
        ))}
        <path
          d={`M${P(-0.24 + shift, 0.25, 0)}L${left}M${P(0.24 + shift, 0.25, 0)}L${right}`}
          stroke="#a4b795"
          strokeWidth="1.7"
        />
        <path d={`M${left}L${right}`} stroke="#a6b49a" strokeWidth="4.3" strokeLinecap="round" />
        <path d={`M${a}L${b}`} stroke="#b89e6a" strokeWidth="4.3" strokeLinecap="round" />
        {s.effective > 0 && (
          <path
            d={`M${P(s.left, s.rise, s.z)}L${P(s.right, s.rise, s.z)}`}
            stroke="#cba464"
            strokeWidth="5.4"
            strokeLinecap="round"
          />
        )}
        {[-0.12, -0.04, 0.04, 0.12].map((x, i) => {
          const at = P(x + shift, s.rise, s.z);
          return (
            <g key={i}>
              <circle
                cx={at[0]}
                cy={at[1]}
                r="5"
                fill={
                  (chosen === 'inner' ? i === 1 || i === 2 : i === 0 || i === 3)
                    ? '#a68b5d'
                    : '#d4d8bd'
                }
              />
              <text x={at[0]} y={at[1] - 12} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          );
        })}
        <path
          d={`M150 323C170 291 ${a[0] - 12} 286 ${a}M100 323H83M37 323C20 297 ${b[0] + 40} 291 ${b}`}
          fill="none"
          stroke="#a1b59b"
          strokeWidth="2.2"
        />
        <rect x="100" y="307" width="50" height="32" rx="9" fill="#c5cfae" stroke="#a4b58f" />
        <text x="110" y="330">
          {I < 0 ? '+' : '−'}
        </text>
        <text x="133" y="330">
          {I < 0 ? '−' : '+'}
        </text>
        <circle cx="60" cy="323" r="23" fill="#e7edd9" stroke="#afbea0" />
        <path
          d={`M60 324L${60 + 17 * Math.sin((I / 3) * 0.9)} ${324 - 17 * Math.cos((I / 3) * 0.9)}`}
          stroke="#a78c5f"
          strokeWidth="2"
        />
        <text x="60" y="342" textAnchor="middle">
          A
        </text>
        {s.effective > 0 && (
          <path
            d={`M${P(s.left, s.rise, s.z)}L${bracketA}L${bracketB}L${P(s.right, s.rise, s.z)}`}
            fill="none"
            stroke="#a6b38e"
            strokeWidth="1.3"
            strokeDasharray="3 3"
          />
        )}
        {s.force !== 0 && (
          <g>
            <path d={`M${mid}L${forceEnd}`} stroke="#8ba28a" strokeWidth="2.2" />
            <circle cx={forceEnd[0]} cy={forceEnd[1]} r="3" fill="#8ba28a" />
            <text x={forceEnd[0] + 13} y={forceEnd[1] + 7}>
              F
            </text>
          </g>
        )}
      </svg>
      <div className="wf-readings">
        <span>I = {I.toFixed(1)} A</span>
        <span>ℓ = {(s.effective * 100).toFixed(1)} cm</span>
        <span>F = {(s.force * 1000).toFixed(1)} mN</span>
      </div>
      <p className="wf-relation">
        F / (Iℓ) = {I === 0 || s.effective === 0 ? '—' : B.toFixed(3)} T
      </p>
      {!film.watch && (
        <div className="wf-controls">
          <Segments
            label={t('导线接点')}
            value={contacts}
            onChange={setContacts}
            options={[
              { value: 'inner', label: t('接点 2–3') },
              { value: 'outer', label: t('接点 1–4') },
            ]}
          />
          <Range
            label={t('导线电流')}
            value={current}
            min={-3}
            max={3}
            step={0.1}
            unit="A"
            onChange={setCurrent}
          />
          <Range
            label={t('导线横向偏移')}
            value={offset}
            min={-0.08}
            max={0.08}
            step={0.01}
            unit="m"
            onChange={setOffset}
          />
          <Range
            label={t('相同磁体的磁感应强度')}
            value={field}
            min={0.02}
            max={0.08}
            step={0.01}
            unit="T"
            onChange={setField}
          />
        </div>
      )}
      <details className="wf-details">
        <summary>{t('有效长度与悬线模型')}</summary>
        <p>
          {t(
            '三个相同磁体在导线处近似提供同一匀强场；改变接点不改变 B。有效长度取通电区间与固定磁区的交集，受力按 IℓB 计算。悬线平衡满足 tanθ = F/(mg)，位置由同一悬线长度推导。忽略边缘场、供电软线受力和过渡振荡。改变 B 的对照表示换用另一组场强，不能误认为增加磁体数会提高同一位置的 B。',
          )}
        </p>
      </details>
    </section>
  );
}
