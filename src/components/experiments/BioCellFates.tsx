import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  carrotCulture,
  cultureRemaining,
  textbookNuclearSwap,
  wormCellFates,
  illustrativeLineage,
  nuclearEvidenceLimits,
} from '../../models/bio-cell-fates';
import '../../styles/bio-cell-fates.css';
type Mode = 'culture' | 'age' | 'nuclear' | 'limits' | 'lineage' | 'genes';
const modes: Mode[] = ['culture', 'age', 'nuclear', 'limits', 'lineage', 'genes'],
  names = [
    '胡萝卜培养',
    '增殖代数比较',
    '核质交换：教材结果',
    '核质交换：研究边界',
    '追踪细胞谱系',
    '凋亡调控基因',
  ];
function Fibroblast({
  x,
  y,
  color,
  nucleus,
  scale = 1,
}: {
  x: number;
  y: number;
  color: string;
  nucleus?: string;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-59 16Q-17-10-9-19Q17-39 58-21Q19 0 12 15Q-9 38-59 16Z"
        fill={color}
        stroke="#999b89"
        strokeWidth="2"
      />
      {nucleus && <ellipse rx="14" ry="9" fill={nucleus} stroke="#f2eddf" />}
    </g>
  );
}
export default function BioCellFates() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'culture',
    ),
    [progress, setProgress] = useState(0.7),
    [suitable, setSuitable] = useState(true),
    [passages, setPassages] = useState(0),
    [ced3, setCed3] = useState(true),
    [ced4, setCed4] = useState(true);
  const m = f.watch ? modes[Math.min(f.chapter, 5)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.88)) : progress,
    plant = carrotCulture(p, f.watch || suitable),
    age = cultureRemaining(f.watch ? 0 : passages),
    worm = wormCellFates(p, f.watch || ced3, f.watch || ced4),
    point = (id: number) => {
      const node = illustrativeLineage[id],
        first = 2 ** node.level - 1,
        index = id - first,
        count = 2 ** node.level;
      return { x: 30 + ((index + 0.5) / count) * 300, y: 30 + node.level * 48 };
    };
  return (
    <section className="bio-fates" data-watch={f.watch} data-mode={m}>
      <p className="bio-fates-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'culture' ? (
        <>
          <svg
            className="bio-fates-culture"
            viewBox="0 0 370 270"
            role="img"
            aria-label={t('胡萝卜韧皮部细胞经培养增殖，适宜条件下形成根茎叶')}
          >
            <path d="M45 78Q43 170 74 220Q101 162 91 78Z" fill="#c29663" stroke="#a77f55" />
            <path d="M68 82Q32 51 44 33Q69 54 71 75Q84 43 104 41Q99 68 74 83" fill="#8fa56c" />
            <path d="M87 128H138" stroke="#afad8c" strokeWidth="2" />
            <ellipse cx="182" cy="188" rx="49" ry="22" fill="#d5ddbc" stroke="#a0ad88" />
            {Array.from({ length: 16 }, (_, i) => {
              const a = i * 2.399,
                r = Math.sqrt(i) * 7;
              return (
                <g key={i} opacity={Math.min(1, Math.max(0, plant.proliferation * 16 - i))}>
                  <rect
                    x={177 + Math.cos(a) * r}
                    y={180 + Math.sin(a) * r * 0.55}
                    width="11"
                    height="9"
                    rx="3"
                    fill="#b5c391"
                    stroke="#91a270"
                  />
                  <circle
                    cx={182 + Math.cos(a) * r}
                    cy={184 + Math.sin(a) * r * 0.55}
                    r="2"
                    fill="#8d9780"
                  />
                </g>
              );
            })}
            <path d="M234 175H263" stroke="#afad8c" strokeWidth="2" />
            <path
              d={`M297 193Q${290 - plant.root * 15} ${193 + plant.root * 18} ${291 - plant.root * 7} ${193 + plant.root * 47}M297 193Q${307 + plant.root * 12} ${193 + plant.root * 17} ${305 + plant.root * 6} ${193 + plant.root * 39}`}
              fill="none"
              stroke="#bca77e"
              strokeWidth="3"
            />
            <path d={`M297 193V${193 - plant.shoot * 116}`} stroke="#8a9e68" strokeWidth="5" />
            {[-1, 1].map((side) => (
              <path
                key={side}
                d={`M297 ${193 - plant.shoot * 70}Q${297 + side * plant.shoot * 65} ${193 - plant.shoot * 125} ${297 + side * plant.shoot * 42} ${193 - plant.shoot * 61}Q${297 + side * plant.shoot * 15} ${193 - plant.shoot * 45} 297 ${193 - plant.shoot * 70}`}
                fill="#91a86e"
              />
            ))}
            <path d="M269 212H329L321 256H278Z" fill="#c2a486" opacity={plant.shoot} />
          </svg>
          <div className="bio-fates-legend">
            <span>{t('韧皮部细胞')}</span>
            <span>{t('细胞团块')}</span>
            <span>{t('根、茎、叶')}</span>
          </div>
          {!plant.conditional && (
            <p className="bio-fates-note">{t('培养条件未满足，不能据此演示完整再生')}</p>
          )}
        </>
      ) : m === 'age' ? (
        <>
          <div className="bio-fates-age">
            {age.map((row, i) => (
              <div key={row.source}>
                <span>{t(['胎儿来源', '中年来源', '老年来源'][i])}</span>
                <div className="bio-fates-bar">
                  <i
                    style={{
                      width: `${(row.max / 50) * 100}%`,
                      opacity: f.watch ? 0.25 + 0.75 * p : 1,
                    }}
                  />
                  <b style={{ left: `${(row.min / 50) * 100}%` }} />
                </div>
                <strong>{row.min === row.max ? row.max : `${row.min}–${row.max}`}</strong>
              </div>
            ))}
          </div>
          <p className="bio-fates-note">
            {t('教材P125：相同条件培养的增殖代数；不是寿命或年龄预测')}
          </p>
          {!f.watch && (
            <div className="bio-fates-remaining">
              {age.map((r, i) => (
                <span key={i}>
                  {t(['胎儿来源', '中年来源', '老年来源'][i])}:{' '}
                  {r.remainingMin === r.remainingMax
                    ? r.remainingMax
                    : `${r.remainingMin}–${r.remainingMax}`}
                </span>
              ))}
            </div>
          )}
        </>
      ) : m === 'nuclear' ? (
        <div className="bio-fates-swap">
          {[false, true].map((young, i) => {
            const result = textbookNuclearSwap(young, !young),
              color = young ? '#9d92b0' : '#b1a58d',
              transfer = Math.min(1, p / 0.6),
              division = young ? Math.max(0, (p - 0.65) / 0.35) : 0;
            return (
              <div key={i}>
                <svg
                  viewBox="0 0 340 175"
                  role="img"
                  aria-label={t('分别追踪细胞核与细胞质的年龄来源')}
                >
                  <Fibroblast x={70} y={90} color={young ? '#c5d6b1' : '#d6c9b2'} />
                  <Fibroblast
                    x={267}
                    y={90 - division * 28}
                    scale={1 - division * 0.2}
                    color={young ? '#d6c9b2' : '#c5d6b1'}
                  />
                  <g opacity={division}>
                    <Fibroblast
                      x={267}
                      y={90 + division * 28}
                      scale={1 - division * 0.2}
                      color={young ? '#d6c9b2' : '#c5d6b1'}
                      nucleus={color}
                    />
                  </g>
                  <path d="M129 90H209" stroke="#a9b18c" strokeWidth="2" strokeDasharray="4 5" />
                  <ellipse
                    cx={70 + transfer * 197}
                    cy={90 - 30 * Math.sin(transfer * Math.PI) - division * 28}
                    rx="14"
                    ry="9"
                    fill={color}
                    stroke="#f3efdf"
                  />
                  <path d="M251 49H281" stroke="#acb494" strokeWidth="2" opacity={1 - p} />
                </svg>
                <p>{t(young ? '年轻核 + 老年质' : '老年核 + 年轻质')}</p>
                <p>
                  {t(
                    result.textbookProliferation === 'vigorous'
                      ? '教材描述：分裂旺盛'
                      : '教材描述：不分裂',
                  )}
                </p>
              </div>
            );
          })}
        </div>
      ) : m === 'limits' ? (
        <div className="bio-fates-limits">
          <div>
            <strong>1976</strong>
            <FibroblastPanel />
            <p>{t('年轻核与老龄培养物细胞质重组，多数仅有限分裂')}</p>
          </div>
          <div>
            <strong>1983</strong>
            <svg
              viewBox="0 0 220 120"
              role="img"
              aria-label={t('衰老细胞质可抑制年轻细胞的DNA合成')}
            >
              <path d="M30 20V100H197" fill="none" stroke="#aab294" />
              <path
                d={`M67 99V26M150 99V${99 - 73 * (1 - nuclearEvidenceLimits[1].minimumInhibition)}`}
                stroke="#a2b384"
                strokeWidth="32"
              />
              <path d="M107 25V56" stroke="#b38863" strokeWidth="2" />
            </svg>
            <p>{t('该研究：衰老细胞质融合组DNA合成抑制至少40%')}</p>
          </div>
          <p className="bio-fates-note">{t('不同研究条件不能混算；核与质都可能影响增殖')}</p>
        </div>
      ) : (
        <>
          <svg
            className="bio-fates-worm"
            viewBox="0 0 370 145"
            role="img"
            aria-label={t('透明线虫结构示意，可连续追踪体细胞命运')}
          >
            <path
              d="M22 66Q55 29 139 49Q215 80 316 59Q343 55 355 68Q337 87 300 90Q206 112 125 82Q56 61 22 66Z"
              fill="#d6ddbd"
              fillOpacity=".75"
              stroke="#9aaa83"
              strokeWidth="2"
            />
            <path
              d="M39 65Q55 52 71 62Q84 73 94 65M95 65Q177 91 236 82Q289 73 332 72"
              fill="none"
              stroke="#a9ad8b"
              strokeWidth="7"
            />
            <path
              d="M153 62Q195 46 239 74Q210 99 172 77"
              fill="none"
              stroke="#b7b19c"
              strokeWidth="5"
            />
          </svg>
          <svg
            className="bio-fates-lineage"
            viewBox="0 0 360 200"
            role="img"
            aria-label={t('谱系树结构示意：分裂产生的细胞中，指定分支按程序结束')}
          >
            {illustrativeLineage.map((node) => {
              const q = point(node.id),
                parent = node.parent === null ? null : point(node.parent),
                dead = node.scheduledDeath && worm.execution,
                fade = dead ? Math.max(0.15, 1 - p) : 1;
              return (
                <g key={node.id}>
                  {parent && (
                    <path
                      d={`M${parent.x} ${parent.y}V${q.y - 22}H${q.x}V${q.y}`}
                      fill="none"
                      stroke="#b2bc97"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={q.x}
                    cy={q.y}
                    r={dead ? 7 * (1 - 0.65 * p) : 7}
                    fill={dead ? '#b29b91' : '#94ad77'}
                    opacity={fade}
                  />
                  {dead && p > 0.7 && (
                    <path
                      d={`M${q.x - 5} ${q.y - 5}l10 10m0-10-10 10`}
                      stroke="#aa8376"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="bio-fates-legend">
            <span>{t('产生')} 1090</span>
            <span>
              {t('凋亡')} {worm.dead}
            </span>
            <span>
              {t('保留')} {worm.retained}
            </span>
          </div>
          <p className="bio-fates-note">
            {t('标准雌雄同体体细胞谱系计数；上方为局部分支结构示意')}
          </p>
          {m === 'genes' && (
            <div className="bio-fates-comparison">
              <span>{t('正常执行')}</span>
              <span>
                {t('保留')} {wormCellFates(p).retained}
              </span>
              <span>{t('CED-3缺失对照')}</span>
              <span>
                {t('保留')} {wormCellFates(p, false).retained}
              </span>
            </div>
          )}
          {m === 'genes' && (
            <div className="bio-fates-genechain">
              <span>CED-4</span>
              <span>→</span>
              <span>CED-3</span>
              <span>→</span>
              <span>{t(worm.execution ? '执行凋亡' : '执行受阻')}</span>
            </div>
          )}
        </>
      )}
      {!f.watch && (
        <div className="bio-fates-controls">
          <Segments
            label={t('研究案例')}
            value={mode}
            onChange={setMode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'culture' && (
            <button type="button" aria-pressed={suitable} onClick={() => setSuitable(!suitable)}>
              {t(suitable ? '适宜培养条件：有' : '适宜培养条件：缺失')}
            </button>
          )}
          {m === 'age' && (
            <Range
              label={t('已消耗的增殖代数')}
              value={passages}
              min={0}
              max={50}
              step={1}
              onChange={setPassages}
            />
          )}{' '}
          {(m === 'genes' || m === 'lineage') && (
            <>
              <button type="button" aria-pressed={ced3} onClick={() => setCed3(!ced3)}>
                {t(ced3 ? 'CED-3功能正常' : 'CED-3功能缺失')}
              </button>
              <button type="button" aria-pressed={ced4} onClick={() => setCed4(!ced4)}>
                {t(ced4 ? 'CED-4功能正常' : 'CED-4功能缺失')}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
function FibroblastPanel() {
  return (
    <svg viewBox="0 0 220 120" aria-hidden="true">
      <Fibroblast x={65} y={65} color="#d6c9b2" nucleus="#9d92b0" scale={0.65} />
      <Fibroblast x={154} y={65} color="#d6c9b2" nucleus="#9d92b0" scale={0.65} />
      <path d="M105 65H117" stroke="#acb38d" strokeWidth="2" />
    </svg>
  );
}
