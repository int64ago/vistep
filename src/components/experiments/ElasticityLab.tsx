import { useState, useId } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  springExtension,
  rubberResponse,
  springWire,
  RUBBER_MAX_EXTENSION,
} from '../../models/elasticity-lab';
import '../../styles/elasticity-lab.css';
export default function ElasticityLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState<'spring' | 'rubber'>(
      film.variant === 'required-1-rubber-elasticity' ? 'rubber' : 'spring',
    ),
    [mass, setMass] = useState(0.2),
    [extension, setExtension] = useState(0.08),
    [branch, setBranch] = useState<'loading' | 'unloading'>('loading'),
    [cycles, setCycles] = useState(0);
  const c = film.watch ? film.chapter : mode === 'spring' ? 2 : 4,
    p = film.chapterProgress;
  const kind = film.watch ? (c < 3 ? 'spring' : 'rubber') : mode;
  const n = film.watch
    ? c === 0
      ? 0
      : c === 1
        ? Math.min(6, Math.floor(p * 7))
        : 6
    : Math.round(mass / 0.05);
  const cycle = film.watch ? (c === 5 ? Math.min(4, 1 + Math.floor(p * 4)) : 0) : cycles;
  const direction = film.watch ? (c === 4 ? 'unloading' : 'loading') : branch;
  const x = film.watch
    ? c === 3
      ? 0.12 * Math.min(1, p * 1.3)
      : c === 4
        ? 0.12 * (1 - Math.min(1, p * 1.3))
        : 0.12
    : extension;
  const state =
    kind === 'spring'
      ? springExtension(film.watch ? n * 0.05 : mass)
      : rubberResponse(x, direction, cycle);
  const length = state.length * 560,
    top = 44,
    bottom = top + length,
    plot = (x: number, f: number) => ({ x: 44 + (x / 0.12) * 231, y: 204 - (f / 8) * 172 });
  const poly = (points: { x: number; y: number }[]) =>
    points.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  const loadingMax = film.watch && c === 3 ? x : 0.12;
  const loadingCurve = Array.from({ length: 61 }, (_, i) => {
    const a = (loadingMax * i) / 60;
    return plot(a, rubberResponse(a, 'loading', cycle).force);
  });
  const unloadingMin = film.watch && c === 4 ? x : 0;
  const unloadingCurve = Array.from({ length: 61 }, (_, i) => {
    const a = 0.12 - ((0.12 - unloadingMin) * i) / 60;
    return plot(a, rubberResponse(a, 'unloading', cycle).force);
  });
  const current = plot(state.extension, state.force),
    naturalY = top + 0.16 * 560;
  return (
    <section className="elastic-lab">
      <header>
        <p>
          {t(
            kind === 'spring'
              ? c === 0
                ? '先测原长，再读伸长量'
                : '每次加砝码，等停稳后记录长度'
              : c === 3
                ? '橡皮筋的曲线不必是一条直线'
                : c === 5
                  ? '重复加载，检查曲线是否保持不变'
                  : '同一伸长量，加载与卸载可能不同',
          )}
        </p>
        <span>{t(kind === 'spring' ? '弹簧 · 弹性范围内' : '橡皮筋 · 示意本构关系')}</span>
      </header>
      <div className="elastic-workbench">
        <div className="elastic-apparatus">
          <svg
            viewBox="0 0 280 300"
            role="img"
            aria-label={t('固定支架上悬挂弹性物体和载荷，尺子以原长位置为伸长零点')}
          >
            <defs>
              <linearGradient id={`${id}metal`}>
                <stop stopColor="#8c9c8b" />
                <stop offset=".5" stopColor="#cbd3bf" />
                <stop offset="1" stopColor="#879a86" />
              </linearGradient>
            </defs>
            <path
              d="M35 284H225M54 284V27H143V44"
              stroke="#a8b497"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            {kind === 'spring' ? (
              <path
                d={poly(springWire(length).map((v) => ({ x: 143 + v.x, y: top + v.y })))}
                fill="none"
                stroke={`url(#${id}metal)`}
                strokeWidth="3"
              />
            ) : (
              <path
                d={`M143 ${top}C${143 - 12 / Math.sqrt(state.length / 0.16)} ${top + 8} ${143 - 12 / Math.sqrt(state.length / 0.16)} ${bottom - 8} 143 ${bottom}C${143 + 12 / Math.sqrt(state.length / 0.16)} ${bottom - 8} ${143 + 12 / Math.sqrt(state.length / 0.16)} ${top + 8} 143 ${top}Z`}
                fill="#c7a981"
                fillOpacity=".15"
                stroke="#b38d61"
                strokeWidth="3"
              />
            )}
            <path
              d={`M143 ${bottom}v9q0 5-5 5H119v4H167v-4H143`}
              fill="none"
              stroke="#8c9c87"
              strokeWidth="2"
            />
            {kind === 'spring' ? (
              state.force > 0.01 &&
              Array.from({ length: Math.max(1, n) }, (_, i) => (
                <rect
                  key={i}
                  x="123"
                  y={bottom + 19 + i * 7}
                  width="40"
                  height="7"
                  rx="2"
                  fill={i % 2 ? '#a7b49a' : '#b9c4aa'}
                  stroke="#8fa184"
                  strokeWidth=".5"
                />
              ))
            ) : (
              <g>
                <path
                  d={`M124 ${bottom + 17}V${bottom + 64}Q143 ${bottom + 70} 162 ${bottom + 64}V${bottom + 17}`}
                  fill="#d3dfd5"
                  fillOpacity=".3"
                  stroke="#9aaa93"
                  strokeWidth="1.5"
                />
                <rect
                  x="126"
                  y={bottom + 63 - (state.force / 8) * 40}
                  width="34"
                  height={(state.force / 8) * 40}
                  rx="2"
                  fill="#adc3b4"
                />
                <path
                  d={`M124 ${bottom + 17}L143 ${bottom + 12}L162 ${bottom + 17}`}
                  stroke="#9aaa93"
                  fill="none"
                />
              </g>
            )}
            <rect x="211" y="35" width="20" height="207" rx="3" fill="#f0eadb" />
            {Array.from({ length: 36 }, (_, i) => (
              <path key={i} d={`M211 ${top + i * 5.6}h${i % 5 === 0 ? 13 : 7}`} stroke="#a8aa8f" />
            ))}
            <path d={`M165 ${naturalY}H232`} stroke="#afbaa0" strokeDasharray="4 4" />
            <path d={`M169 ${bottom}H235`} stroke="#9b7857" strokeWidth="1.3" />
            <path
              d={`M195 ${naturalY}V${bottom}M191 ${naturalY}H199M191 ${bottom}H199`}
              stroke="#9b7857"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <div className="elastic-readings">
            <span>
              {t('伸长量')} <strong>{(state.extension * 100).toFixed(1)} cm</strong>
            </span>
            <span>
              {t('弹力')} <strong>{state.force.toFixed(2)} N</strong>
            </span>
          </div>
        </div>
        <div className="elastic-graph">
          <p>{t('记录点组成力—伸长图像')}</p>
          <svg
            viewBox="0 0 300 250"
            role="img"
            aria-label={t('弹力与伸长量图像，标记当前实验状态')}
          >
            {[0, 2, 4, 6, 8].map((f) => (
              <g key={f}>
                <path d={`M44 ${plot(0, f).y}H275`} stroke="#e1e6d9" />
                <text x="33" y={plot(0, f).y + 6} textAnchor="end" fontSize="18" fill="#748563">
                  {f}
                </text>
              </g>
            ))}
            <path d="M44 20V204H284" fill="none" stroke="#a5b495" />
            {[0, 4, 8, 12].map((a) => (
              <text
                key={a}
                x={plot(a / 100, 0).x}
                y="229"
                textAnchor="middle"
                fontSize="18"
                fill="#748563"
              >
                {a}
              </text>
            ))}
            <text x="45" y="17" fontSize="18" fill="#748563">
              F / N
            </text>
            <text x="267" y="249" textAnchor="end" fontSize="18" fill="#748563">
              x / cm
            </text>
            {kind === 'spring' ? (
              <>
                {c >= 2 && (
                  <path
                    d={`M44 204L${plot(0.1, 3).x} ${plot(0.1, 3).y}`}
                    stroke="#93a27f"
                    strokeWidth="1.5"
                  />
                )}
                {Array.from({ length: n + 1 }, (_, i) => {
                  const a = springExtension(i * 0.05),
                    q = plot(a.extension, a.force);
                  return <circle key={i} cx={q.x} cy={q.y} r="4" fill="#83956d" />;
                })}
              </>
            ) : (
              <>
                <path d={poly(loadingCurve)} stroke="#a7855f" strokeWidth="2" fill="none" />
                {(c >= 4 || !film.watch) && (
                  <path d={poly(unloadingCurve)} stroke="#718f84" strokeWidth="2" fill="none" />
                )}
                {c === 5 && (
                  <path
                    d={poly(
                      Array.from({ length: 61 }, (_, i) => {
                        const a = (0.12 * i) / 60;
                        return plot(a, rubberResponse(a, 'loading', 0).force);
                      }),
                    )}
                    stroke="#bcb79d"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                )}
              </>
            )}
            <circle cx={current.x} cy={current.y} r="7" fill="none" stroke="#92714e" />
            <circle cx={current.x} cy={current.y} r="3" fill="#92714e" />
          </svg>
          {kind === 'rubber' && (
            <div className="elastic-legend">
              <span>{t('棕：加载')}</span>
              <span>{t('绿：卸载')}</span>
              <span>
                {t('循环次数')} {cycle + 1}
              </span>
            </div>
          )}
        </div>
      </div>
      <p className="elastic-observation">
        {t(
          kind === 'spring'
            ? '伸长量从原长算起，不是弹簧总长度。'
            : cycle > 0
              ? '重复曲线有变化，是需要测量的现象，不能预先当成常数。'
              : '卸载曲线不重合时，不能用一个固定劲度系数概括全过程。',
        )}
      </p>
      {!film.watch && (
        <div className="elastic-controls">
          <Segments
            label={t('实验材料')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'spring', label: t('弹簧') },
              { value: 'rubber', label: t('橡皮筋') },
            ]}
          />
          {kind === 'spring' ? (
            <Range
              label={t('砝码总质量')}
              value={mass}
              min={0}
              max={0.3}
              step={0.05}
              unit="kg"
              onChange={setMass}
            />
          ) : (
            <>
              <Range
                label={t('伸长量')}
                value={extension}
                min={0}
                max={RUBBER_MAX_EXTENSION}
                step={0.005}
                unit="m"
                onChange={setExtension}
              />
              <Segments
                label={t('加载路径')}
                value={branch}
                onChange={setBranch}
                options={[
                  { value: 'loading', label: t('加载') },
                  { value: 'unloading', label: t('卸载') },
                ]}
              />
              <Range label={t('已完成循环')} value={cycles} min={0} max={5} onChange={setCycles} />
            </>
          )}
        </div>
      )}
      <p className="elastic-note">
        {t(
          kind === 'spring'
            ? '静止时用砝码重力代表弹力；忽略弹簧自重，不模拟超出弹性限度。'
            : '橡皮筋采用非线性、滞回与循环软化的示意模型；并非所有橡胶的实测规律。',
        )}
      </p>
    </section>
  );
}
