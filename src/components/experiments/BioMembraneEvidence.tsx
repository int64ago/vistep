import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase, ramp, ease } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  membraneUptake,
  lipidArrangement,
  membraneTracer,
  electronContrast,
  interfacePressure,
  bilayerLipids,
} from '../../models/bio-membrane-evidence';
import '../../styles/bio-membrane-evidence.css';
type Evidence = 'permeability' | 'monolayer' | 'tension' | 'em' | 'fusion' | 'mosaic' | 'build';
const keys: Evidence[] = [
  'permeability',
  'monolayer',
  'tension',
  'em',
  'fusion',
  'mosaic',
  'build',
];
const names = ['通透性', '脂质铺展', '表面张力', '电镜暗纹', '细胞融合', '流动镶嵌', '结构模型'];
function Lipid({
  x,
  y,
  dir = 1,
  angle,
  color = '#91ae7b',
}: {
  x: number;
  y: number;
  dir?: number;
  angle?: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle ?? (dir < 0 ? 180 : 0)})`}>
      <path d="M-2 3L-3 24M2 3L4 24" stroke="#b8aa77" strokeWidth="1.7" />
      <circle r="4.6" fill={color} />
    </g>
  );
}
export default function BioMembraneEvidence() {
  const f = useShowcase(),
    [mode, setMode] = useState<Evidence>(
      keys.includes(f.variant as Evidence) ? (f.variant as Evidence) : 'fusion',
    ),
    [progress, setProgress] = useState(0.8),
    [mobile, setMobile] = useState(true),
    [resolution, setResolution] = useState(0.7);
  const m = f.watch ? keys[Math.min(f.chapter, 6)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.82)) : progress,
    minutes = p * 40,
    mob = f.watch ? true : mobile,
    blur = f.watch ? 0.7 : resolution;
  const tracers = Array.from({ length: 48 }, (_, i) => membraneTracer(i, minutes, mob));
  return (
    <section className="bio-membrane">
      <p className="bio-membrane-type">
        {t('证据重建')} · {t(names[keys.indexOf(m)])}
      </p>
      {m === 'permeability' ? (
        <div className="bio-permeability">
          {[true, false].map((sol, i) => {
            const uptake = membraneUptake(minutes, sol);
            return (
              <div key={i}>
                <h3>{t(sol ? '脂溶性分子' : '不易溶于脂质的分子')}</h3>
                <svg
                  viewBox="0 0 350 95"
                  role="img"
                  aria-label={t('相同初始条件下，分子进入细胞的进程')}
                >
                  <rect x="160" y="8" width="18" height="75" rx="6" fill="#9eb68b" />
                  <path d="M175 48H323" stroke="#ccdcc2" strokeWidth="25" />
                  <path
                    d={`M175 48H${175 + 148 * uptake}`}
                    stroke={sol ? '#b68f50' : '#8b9faa'}
                    strokeWidth="25"
                  />
                  {Array.from({ length: 8 }, (_, j) => {
                    const x = 28 + j * 14 + 160 * uptake;
                    return sol ? (
                      <path
                        key={j}
                        d={`M${x} 42l6-4 6 4v7l-6 4-6-4Z`}
                        fill="none"
                        stroke="#a37e43"
                        strokeWidth="2"
                      />
                    ) : (
                      <path key={j} d={`M${x} 40l7 7-7 7-7-7Z`} fill="#849aa2" />
                    );
                  })}
                </svg>
                <p>
                  {t('胞内相对积累')} {Math.round(uptake * 100)}%
                </p>
              </div>
            );
          })}
        </div>
      ) : m === 'monolayer' ? (
        <>
          <svg
            className="bio-membrane-diagram"
            viewBox="0 0 350 250"
            role="img"
            aria-label={t('保持四十个脂质身份，将双层展开为单层')}
          >
            <path d="M20 118H330" stroke="#a1bec0" />
            <rect x="20" y="118" width="310" height="75" fill="#c8dddd" opacity=".55" />
            <g transform="translate(175 115)">
              {Array.from({ length: 40 }, (_, i) => {
                const q = lipidArrangement(i, p);
                return (
                  <Lipid
                    key={i}
                    x={q.x}
                    y={q.y}
                    dir={q.direction}
                    angle={q.angle}
                    color={i === 5 ? '#bb8656' : '#91ae7b'}
                  />
                );
              })}
            </g>
            <path d="M100 212H240M30 232H310" stroke="#8e9a72" strokeWidth="6" />
            <path d="M100 205V219M240 205V219M30 225V239M310 225V239" stroke="#8e9a72" />
          </svg>
          <div className="bio-membrane-measure">
            <span>{t('原膜面积')} A</span>
            <span>{t('单分子层面积')} 2A</span>
          </div>
        </>
      ) : m === 'tension' ? (
        <div className="bio-tension">
          {[1, 1 - 0.6 * p].map((gamma, i) => (
            <div key={i}>
              <svg viewBox="0 0 165 190" role="img" aria-label={t('表面吸附的蛋白质改变界面张力')}>
                <rect x="8" y="8" width="149" height="174" rx="20" fill="#d4e2d5" />
                <circle cx="82" cy="95" r="52" fill="#dcc18b" stroke="#c0ac7f" strokeWidth="2" />
                {i === 1 &&
                  Array.from({ length: 16 }, (_, j) => {
                    const a = (j * Math.PI) / 8;
                    return (
                      <rect
                        key={j}
                        x={82 + 52 * Math.cos(a) - 4}
                        y={95 + 52 * Math.sin(a) - 4}
                        width="8"
                        height="8"
                        rx="3"
                        fill="#817f9b"
                        opacity={p}
                      />
                    );
                  })}
                <path
                  d={`M82 95h${35 * gamma}m-5-4 5 4-5 4M82 95h${-35 * gamma}m5-4-5 4 5 4`}
                  stroke="#a17e4d"
                  strokeWidth="2"
                />
              </svg>
              <p>{t(i === 0 ? '油—水界面' : '蛋白质吸附后')}</p>
              <p>γ / γ₀ = {gamma.toFixed(2)}</p>
              <p>ΔP = {interfacePressure(gamma, 1).toFixed(2)}</p>
            </div>
          ))}
        </div>
      ) : m === 'em' ? (
        <>
          <svg
            className="bio-membrane-diagram"
            viewBox="0 0 350 250"
            role="img"
            aria-label={t('电镜明暗带与强度剖面，不能直接识别成分')}
          >
            <rect x="20" y="20" width="310" height="90" fill="#e8e9e2" />
            {Array.from({ length: 120 }, (_, i) => {
              const x = (i - 60) / 9;
              return (
                <rect
                  key={i}
                  x={20 + (i * 310) / 120}
                  y="20"
                  width="3"
                  height="90"
                  fill="#414d47"
                  opacity={Math.min(1, electronContrast(x, blur))}
                />
              );
            })}
            <path d="M20 215H330M20 130V215" stroke="#809386" />
            <path
              d={Array.from(
                { length: 120 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${20 + (i * 310) / 120} ${210 - electronContrast((i - 60) / 9, blur) * 80}`,
              ).join(' ')}
              fill="none"
              stroke="#8a9275"
              strokeWidth="2.5"
            />
          </svg>
          {!f.watch && (
            <p className="bio-membrane-key">{t('暗—亮—暗是成像证据，不是分子成分的直接标签。')}</p>
          )}
        </>
      ) : m === 'fusion' ? (
        <>
          <svg
            className="bio-membrane-diagram"
            viewBox="0 0 350 270"
            role="img"
            aria-label={t('带有固定来源标记的膜蛋白在膜表面扩散')}
          >
            <circle cx="175" cy="134" r="103" fill="#d6dfc3" stroke="#a8b28e" strokeWidth="3" />
            <ellipse cx="145" cy="130" rx="22" ry="28" fill="#b8bcaa" />
            <ellipse cx="207" cy="143" rx="24" ry="29" fill="#aeb6ab" />
            {tracers.map((q) => (
              <g key={q.id} transform={`translate(${175 + 99 * q.x} ${134 + 99 * q.y})`}>
                {q.origin === 'mouse' ? (
                  <circle r="4.5" fill="#5b8c58" />
                ) : (
                  <path d="M0-6 5 0 0 6-5 0Z" fill="#b56e5b" />
                )}
                {q.id === 3 && <circle r="9" stroke="#8c744a" strokeWidth="2" fill="none" />}
              </g>
            ))}
          </svg>
          <div className="bio-membrane-measure">
            <span style={{ color: '#416d42' }}>{t('小鼠来源')} ●</span>
            <span style={{ color: '#984f40' }}>{t('人来源')} ◆</span>
            <span>37 ℃ · {Math.round(minutes)} min</span>
          </div>
        </>
      ) : (
        <>
          <svg
            className="bio-membrane-diagram"
            viewBox="0 0 350 250"
            role="img"
            aria-label={t('亲水头朝向水，疏水尾向内，蛋白质嵌入磷脂双层')}
          >
            <rect x="8" y="30" width="334" height="190" rx="30" fill="#d9e6db" />
            <rect x="12" y="112" width="326" height="46" fill="#d8cda5" />
            {bilayerLipids(m === 'mosaic' ? minutes : 0).map((q) => (
              <Lipid
                key={q.id}
                x={q.x}
                y={m === 'build' ? q.y + (q.id < 24 ? -1 : 1) * 55 * (1 - p) : q.y}
                dir={q.direction}
              />
            ))}
            <g
              opacity={m === 'build' ? ramp(p, 0.5, 0.9) : 1}
              transform={`translate(${m === 'mosaic' ? Math.sin(minutes * 0.16) * 18 : 0} 0)`}
            >
              <path
                d="M126 91Q113 95 118 128Q106 150 126 175H150Q163 160 154 138Q167 110 149 90Z"
                fill="#9d92aa"
                stroke="#81778e"
                strokeWidth="2"
              />
              <path
                d="M136 91V68l-13-12m13 12 15-12"
                fill="none"
                stroke="#a78b5d"
                strokeWidth="3"
              />
              <circle cx="123" cy="55" r="5" fill="#b6a16b" />
              <circle cx="151" cy="55" r="5" fill="#b6a16b" />
              <path d="M259 113Q246 94 234 111Q240 124 259 119" fill="#9d92aa" />
            </g>
          </svg>
          <div className="bio-membrane-measure">
            <span>{t('外侧：糖链')}</span>
            <span>{t('内侧：细胞质')}</span>
          </div>
        </>
      )}
      {!f.watch && (
        <div className="bio-membrane-controls">
          <Segments
            label={t('选择证据')}
            value={mode}
            onChange={setMode}
            options={keys.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('观察进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {mode === 'fusion' && (
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(!mobile)}>
              {t(mobile ? '膜蛋白：可侧向移动' : '膜蛋白：固定对照')}
            </button>
          )}
          {mode === 'em' && (
            <Range
              label={t('成像展宽')}
              value={resolution}
              min={0.3}
              max={2}
              step={0.1}
              onChange={setResolution}
            />
          )}
          <p>{t('曲线与比例为解释模型；不代表历史实验的原始测量数据。')}</p>
        </div>
      )}
    </section>
  );
}
