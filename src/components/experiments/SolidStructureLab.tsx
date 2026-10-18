import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { waxContour, exfoliation, honeycomb } from '../../models/solid-structure-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const lattice = honeycomb();
export default function SolidStructureLab() {
  const film = useShowcase();
  const [mode, setMode] = useState(
      film.variant?.includes('anisotropy')
        ? 'wax'
        : film.variant?.includes('graphene')
          ? 'tape'
          : 'grains',
    ),
    [progress, setProgress] = useState(0.65),
    [ratio, setRatio] = useState(3.2),
    [round, setRound] = useState(1);
  const stage = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    kind = film.watch ? (stage < 2 ? 'grains' : stage < 4 ? 'wax' : 'tape') : mode,
    heatTime = film.watch ? (stage === 2 ? p * 30 : 30) : p * 30;
  const contours = useMemo(
    () => [
      waxContour(heatTime, 0.4, 0.4),
      waxContour(heatTime, 0.25 * (film.watch ? 3.2 : ratio), 0.25),
    ],
    [heatTime, ratio, film.watch],
  );
  const peelRound = film.watch ? Math.min(2, Math.floor(p * 3)) : round,
    peel = film.watch ? (p * 3) % 1 : p,
    stack = exfoliation(peelRound),
    atoms = film.watch ? stage === 5 : round === 3;
  return (
    <div className="textbook-em solid-structure-lab">
      <div className="textbook-em-state">
        <span>
          {t(kind === 'grains' ? '食盐与松香' : kind === 'wax' ? '石蜡熔化区域' : '胶带剥离石墨')}
        </span>
        <span>
          {kind === 'wax'
            ? `${heatTime.toFixed(1)} s`
            : kind === 'tape'
              ? `${atoms ? 1 : stack.before} ${t('层')}`
              : t('外形与内部排列')}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 315"
        role="img"
        aria-label={t('盐晶体、热传导石蜡与胶带剥离三个固体实验')}
      >
        {kind === 'grains' && (
          <>
            <ellipse cx="92" cy="179" rx="69" ry="28" fill="#eef2e4" stroke="#bdcba9" />
            <ellipse cx="267" cy="179" rx="69" ry="28" fill="#eef2e4" stroke="#bdcba9" />
            {[
              { x: 59, y: 124, s: 32 },
              { x: 101, y: 146, s: 25 },
              { x: 73, y: 165, s: 22 },
            ].map((q, i) => (
              <g key={i}>
                <path
                  d={`M${q.x} ${q.y}l${q.s} -12 15 8-${q.s} 12Z`}
                  fill="#e3ead6"
                  stroke="#b1c3a0"
                />
                <path d={`M${q.x} ${q.y}l15 8v${q.s}l-15-8Z`} fill="#c2d1b0" stroke="#9eb68e" />
                <path
                  d={`M${q.x + 15} ${q.y + 8}l${q.s}-12v${q.s}l-${q.s} 12Z`}
                  fill="#d4e0c4"
                  stroke="#a5bd95"
                />
              </g>
            ))}
            {[
              { x: 230, y: 130 },
              { x: 281, y: 157 },
              { x: 245, y: 174 },
            ].map((q, i) => (
              <path
                key={i}
                d={`M${q.x - 20} ${q.y}l13-24 24 7 12 22-18 13-25-8Z`}
                fill={i === 1 ? '#c9a777' : '#d9bc88'}
                stroke="#b59b68"
              />
            ))}
            <text x="92" y="226" textAnchor="middle">
              {t('食盐')}
            </text>
            <text x="267" y="226" textAnchor="middle">
              {t('松香')}
            </text>
            {(!film.watch || stage === 1) && (
              <>
                {Array.from({ length: 20 }, (_, i) => (
                  <circle
                    key={i}
                    cx={52 + (i % 5) * 19}
                    cy={255 + Math.floor(i / 5) * 14}
                    r={i % 2 ? 3 : 4.5}
                    fill={i % 2 ? '#b5cba1' : '#8fa878'}
                  />
                ))}
                {Array.from({ length: 20 }, (_, i) => (
                  <circle
                    key={i}
                    cx={226 + ((i * 29) % 81)}
                    cy={252 + ((i * 23) % 48)}
                    r="3.7"
                    fill="#bba171"
                  />
                ))}
              </>
            )}
          </>
        )}
        {kind === 'wax' && (
          <>
            {[95, 265].map((cx, i) => (
              <g key={i}>
                <rect
                  x={cx - 68}
                  y="85"
                  width="136"
                  height="170"
                  rx="8"
                  fill="#e1e6d0"
                  stroke="#b1c0a1"
                  strokeWidth="2"
                />
                <path
                  d={
                    contours[i]
                      .map((q, j) => `${j ? 'L' : 'M'}${cx + q.x * 5.5} ${169 + q.y * 5.5}`)
                      .join(' ') + 'Z'
                  }
                  fill="#b5c8a0"
                  stroke="#93af7c"
                  strokeWidth="1.6"
                />
                {stage === 3 && (
                  <path
                    d={`M${cx - contours[i][0].x * 5.5} 169H${cx + contours[i][0].x * 5.5}M${cx} ${169 - contours[i][16].y * 5.5}V${169 + contours[i][16].y * 5.5}`}
                    fill="none"
                    stroke="#6d8960"
                    strokeWidth="1.4"
                    strokeDasharray="4 3"
                  />
                )}
                <path d={`M${cx} 169l43 81`} stroke="#8f9d80" strokeWidth="5" />
                <path
                  d={`M${cx + 43} 250l12 24`}
                  stroke="#b8a47d"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <circle cx={cx} cy="169" r="3" fill="#ca9d63" />
                <text x={cx} y="57" textAnchor="middle">
                  {t(i ? '云母' : '玻璃')}
                </text>
              </g>
            ))}
          </>
        )}
        {kind === 'tape' && !atoms && (
          <>
            <path d="M53 247H307" stroke="#acbd9b" strokeWidth="4" />
            {Array.from({ length: stack.remaining }, (_, i) => (
              <path key={i} d={`M91 ${222 - i * 5}H268`} stroke="#839374" strokeWidth="3" />
            ))}
            <g
              transform={`translate(0 ${-peel * 80}) rotate(${-peel * 20} 91 ${222 - stack.remaining * 5})`}
            >
              {Array.from({ length: stack.removed }, (_, i) => (
                <path
                  key={i}
                  d={`M91 ${222 - (stack.remaining + i) * 5}H268`}
                  stroke="#91a281"
                  strokeWidth="3"
                />
              ))}
              <path
                d={`M64 ${216 - (stack.before - 1) * 5}H290q18-8 25-21l8 6q-10 19-29 25H64Z`}
                fill="#d8dfc2"
                fillOpacity=".8"
                stroke="#b5c49e"
              />
            </g>
          </>
        )}
        {kind === 'tape' && atoms && (
          <>
            <path d="M31 238l31-137h244l25 137Z" fill="#e5ead8" stroke="#bacba7" />
            {lattice.edges.map(([a, b], i) => (
              <path
                key={i}
                d={`M${61 + lattice.points[a].x * 25} ${104 + lattice.points[a].y * 25}L${61 + lattice.points[b].x * 25} ${104 + lattice.points[b].y * 25}`}
                stroke="#93aa81"
                strokeWidth="2"
              />
            ))}
            {lattice.points.map((q, i) => (
              <circle key={i} cx={61 + q.x * 25} cy={104 + q.y * 25} r="3.6" fill="#91a77f" />
            ))}
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {kind === 'tape' ? t(atoms ? '单层蜂窝结构' : '层间分离，保留片层内部结构') : null}
      </p>
      <div className="textbook-em-meters">
        <span>
          {t(
            kind === 'grains'
              ? '规则外形是线索，内部周期排列才是晶体特征'
              : kind === 'wax'
                ? '同一熔点勾出热传播的方向差别'
                : atoms
                  ? '单层厚度约0.335纳米，图中尺度已放大'
                  : '示意追踪选中的薄片，实际每次剥离并非等分',
          )}
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择固体实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'grains', label: t('食盐与松香') },
              { value: 'wax', label: t('石蜡熔化区域') },
              { value: 'tape', label: t('胶带剥离石墨') },
            ]}
          />
          {kind !== 'grains' && !(kind === 'tape' && atoms) && (
            <Range
              label={t(kind === 'wax' ? '加热进度' : '剥离进度')}
              value={progress}
              min={0}
              max={1}
              step={0.005}
              onChange={setProgress}
            />
          )}
          {kind === 'wax' && (
            <Range
              label={t('两主方向热扩散率之比')}
              value={ratio}
              min={1}
              max={4}
              step={0.1}
              onChange={setRatio}
            />
          )}
          {kind === 'tape' && (
            <Range
              label={t('已完成剥离次数')}
              value={round}
              min={0}
              max={3}
              step={1}
              onChange={setRound}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('晶体与模型的边界')}</summary>
        <p>
          {t(
            '热图由二维连续点热源的热扩散核积分得到，以50摄氏度等温线代表石蜡熔化边界；热扩散率取教学示例值，不是云母实测常数，忽略边缘散热和熔化潜热。晶体形状及原子排列为结构示意，非显微照片。胶带追踪一个理想化等分薄片，实际还需筛选、转移和鉴定单层。',
          )}
        </p>
      </details>
    </div>
  );
}
