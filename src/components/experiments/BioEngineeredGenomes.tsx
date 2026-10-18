import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ramp, ease } from '../lab/FilmContext';
import {
  continuousFusion,
  genomeAssembly,
  genomeViability,
  genomeSegmentPoints,
  hypotheticalBudding,
  yeastBudOutline,
  yeastChromosomePoints,
} from '../../models/bio-engineered-genomes';
import '../../styles/bio-engineered-genomes.css';
const colors = [
  '#8cae91',
  '#c4aa72',
  '#aa95ac',
  '#81a8b0',
  '#b78677',
  '#a3b980',
  '#bc9b91',
  '#8c9aaf',
];
const line = (points: { x: number; y: number }[]) =>
  points.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
function YeastChromosome({ essential = true }: { essential?: boolean }) {
  return (
    <g>
      {Array.from({ length: 16 }, (_, id) => (
        <path
          key={id}
          d={line(yeastChromosomePoints(id))}
          stroke={colors[id % 8]}
          strokeWidth="2.7"
          opacity={!essential && id === 3 ? 0.12 : 1}
          fill="none"
        />
      ))}
      <circle cx="-15" cy="0" r="1.8" fill="#70617f" />
    </g>
  );
}
function ConditionalGrowth({
  progress,
  recipient,
  essential,
}: {
  progress: number;
  recipient: boolean;
  essential: boolean;
}) {
  const s = hypotheticalBudding(progress, { assembled: true, recipient, essential });
  return (
    <svg
      viewBox="0 0 220 105"
      aria-label={t('单染色体酵母的出芽仅表示条件逻辑，不预测真实成功率')}
      role="img"
    >
      <g transform="translate(61 51)">
        {s.hasCell && (
          <path
            d={yeastBudOutline(s.radius, s.distance)}
            fill="#d4ddbf"
            stroke="#91a27f"
            strokeWidth="2"
          />
        )}
        {s.hasCell && <ellipse rx="20" ry="16" fill="#c3cbae" stroke="#a5b193" />}
        <YeastChromosome essential={essential} />
        {s.radius > 1 && (
          <g
            transform={`translate(${s.distance * s.nucleus} 0)`}
            opacity={Math.min(1, s.nucleus * 4)}
          >
            <ellipse rx="18" ry="15" fill="#c3cbae" stroke="#a5b193" />
            <g transform="scale(.85)">
              <YeastChromosome />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
export default function BioEngineeredGenomes() {
  const f = useShowcase(),
    [fusion, setFusion] = useState(15),
    [recipient, setRecipient] = useState(true),
    [essential, setEssential] = useState(true),
    [view, setView] = useState<'fusion' | 'function'>('fusion'),
    [progress, setProgress] = useState(0.8);
  const p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.85)) : progress,
    chapter = f.watch ? f.chapter : view === 'fusion' ? 2 : 3,
    steps = chapter === 3 ? 15 : f.watch ? p * 15 : fusion,
    frame = continuousFusion(steps),
    assembly = genomeAssembly(chapter === 0 ? p : 1),
    viable = genomeViability(assembly.complete, f.watch || recipient, f.watch || essential);
  return (
    <section className="bio-genomes">
      {chapter < 2 ? (
        <>
          <svg
            className="bio-genome-stage"
            viewBox="0 0 350 260"
            role="img"
            aria-label={t('分段合成的基因组装配成环，并进入已有的受体细胞')}
          >
            {chapter === 1 && (
              <>
                <path
                  d="M215 65C305 35 330 97 317 175C302 239 209 229 188 167C173 125 176 82 215 65Z"
                  fill="#d8dfbf"
                  stroke="#91a77e"
                  strokeWidth="3"
                />
                {Array.from({ length: 22 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${199 + ((i * 31) % 102)} ${83 + ((i * 41) % 117)}l4-2 3 4-5 3Z`}
                    fill="#8e9d7b"
                    opacity=".65"
                  />
                ))}
              </>
            )}
            {Array.from({ length: 12 }, (_, id) => (
              <path
                key={id}
                d={line(genomeSegmentPoints(id, chapter === 0 ? p : 1, chapter === 1 ? p : 0))}
                stroke={colors[id % 8]}
                strokeWidth="7"
                fill="none"
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <p className="bio-genome-summary">
            {t(chapter === 0 ? '2010：化学合成并装配基因组' : '受体细胞提供已有的细胞质与膜系统')}
          </p>
        </>
      ) : chapter === 2 ? (
        <>
          <svg
            className="bio-genome-stage"
            viewBox="0 0 350 245"
            role="img"
            aria-label={t('十六条酵母染色体连续融合，基因块保留而多余着丝粒删除')}
          >
            <rect
              x="12"
              y="46"
              width="326"
              height="146"
              rx="48"
              fill="#dbdfca"
              stroke="#a1a68d"
              strokeWidth="2"
            />
            {frame.blocks.map((b, i) => (
              <g key={b.id}>
                {i < 15 && (
                  <path
                    d={`M${b.x + 14} 119H${frame.blocks[i + 1].x}`}
                    stroke="#7c8f77"
                    strokeWidth="3"
                    opacity={
                      i < Math.floor(steps)
                        ? 1
                        : i === Math.floor(steps)
                          ? (frame.joining?.progress ?? 0)
                          : 0
                    }
                  />
                )}
                <path d={`M${b.x} 119H${b.x + 14}`} stroke="#7c8f77" strokeWidth="3" />
                <rect x={b.x + 1} y="99" width="12" height="40" rx="5" fill={colors[b.id % 8]} />
                <ellipse
                  cx={b.x + 7}
                  cy="119"
                  rx="3"
                  ry="7"
                  fill="#746886"
                  opacity={b.centromereOpacity}
                />
                {[0, 14].map((dx) => (
                  <path
                    key={dx}
                    d={`M${b.x + dx} 109V129`}
                    stroke="#657a67"
                    strokeWidth="2"
                    opacity={
                      dx === 0
                        ? i === 0
                          ? 1
                          : b.centromereOpacity
                        : i === 15
                          ? 1
                          : frame.blocks[i + 1].centromereOpacity
                    }
                  />
                ))}
              </g>
            ))}
          </svg>
          <div className="bio-genome-summary">
            <span>
              {t('染色体')} {frame.chromosomes}
            </span>
            <span>{t('保留的示意基因块')} 16</span>
            <span>
              {t('着丝粒')} {frame.chromosomes}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="bio-genome-function-head">
            <span>{t('染色体')} 1</span>
            <span>{t('保留的示意基因块')} 16</span>
          </div>
          <div className="bio-genome-function">
            <div>
              <p>{t('必要条件齐全')}</p>
              <ConditionalGrowth progress={p} recipient essential />
            </div>
            <div>
              <p>
                {t(
                  f.watch
                    ? '必需功能：破坏'
                    : !recipient
                      ? '受体细胞：缺失'
                      : !essential
                        ? '必需功能：破坏'
                        : '必要条件齐全',
                )}
              </p>
              <ConditionalGrowth
                progress={p}
                recipient={f.watch ? true : recipient}
                essential={f.watch ? false : essential}
              />
            </div>
          </div>
          <p className="bio-genome-evidence">{t('条件逻辑示意；真实活性仍须实验验证。')}</p>
        </>
      )}
      {!f.watch && (
        <div className="bio-genome-controls">
          <Segments
            label={t('观察对象')}
            value={view}
            onChange={setView}
            options={[
              { value: 'fusion', label: t('染色体重排') },
              { value: 'function', label: t('功能条件对照') },
            ]}
          />
          {view === 'fusion' ? (
            <Range
              label={t('连续融合次数')}
              value={fusion}
              min={0}
              max={15}
              step={0.01}
              onChange={setFusion}
            />
          ) : (
            <>
              <Range
                label={t('过程进度')}
                value={progress}
                min={0}
                max={1}
                step={0.01}
                onChange={setProgress}
              />
              <button
                type="button"
                aria-pressed={recipient}
                onClick={() => setRecipient(!recipient)}
              >
                {t(recipient ? '受体细胞：具备' : '受体细胞：缺失')}
              </button>
              <button
                type="button"
                aria-pressed={essential}
                onClick={() => setEssential(!essential)}
              >
                {t(essential ? '必需功能：保留' : '必需功能：破坏')}
              </button>
              <p>
                {t(
                  viable.supportsGrowth
                    ? '模型必要条件具备；真实活性仍须实验验证。'
                    : '模型必要条件不全，不能从DNA存在推出细胞存活。',
                )}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
