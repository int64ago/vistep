import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { BALLOON_DATA, balloonVideo, balloonFit } from '../../models/balloon-drag-lab';
import '../../styles/balloon-drag-lab.css';
export default function BalloonDragLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [trial, setTrial] = useState(2),
    [frame, setFrame] = useState(3),
    [mode, setMode] = useState('terminal'),
    [power, setPower] = useState('linear'),
    [buoyancy, setBuoyancy] = useState(0),
    c = film.chapter,
    p = film.chapterProgress,
    load = film.watch ? (c === 2 ? Math.min(6, Math.floor(p * 7)) : 2) : trial,
    n = film.watch
      ? c === 0
        ? 0
        : c === 2
          ? (Math.min(6.999, p * 7) - Math.floor(Math.min(6.999, p * 7))) * 6
          : Math.min(6, (p / 0.75) * 6)
      : frame,
    accelerating = !film.watch && mode === 'accelerating',
    B = film.watch ? (c === 4 && p > 0.5 ? 0.012 : 0) : buoyancy,
    s = balloonVideo(load, n, accelerating),
    linear = balloonFit(1, B),
    quadratic = balloonFit(2, B),
    fit = !film.watch && power === 'quadratic' ? quadratic : linear,
    plot = film.watch ? c >= 3 : mode === 'fit',
    visible = film.watch && c === 2 ? load + Number(n >= 5) : 7,
    weightY = 98 + s.positionCm * 1.1,
    bodyY = weightY - 64,
    height = 6 + load * 1.3;
  const path = (pow: 1 | 2) =>
    Array.from({ length: 71 }, (_, i) => {
      const x = i * 0.5,
        y = (pow === 1 ? linear : quadratic).coefficient * x ** pow;
      return `${i ? 'L' : 'M'}${45 + (x / 35) * 280} ${205 - (y / 0.12) * 175}`;
    }).join(' ');
  return (
    <section className="balloon-drag-lab">
      <header>
        <p>
          {t(
            plot
              ? c === 4 && film.watch
                ? '先检查测量条件，再扩大结论'
                : '这七组数据更接近哪一种关系？'
              : c === 2 && film.watch
                ? '同一个气球，只改变悬挂重物'
                : '先确认等时间里的位移近似相同',
          )}
        </p>
        <span>{t('教材研究样例 · 数据重建')}</span>
      </header>
      {!plot ? (
        <div className="balloon-drag-observation">
          <svg
            viewBox="0 0 350 345"
            role="img"
            aria-label={t('同一个球形气球挂铁丝和重物，旁边刻度尺记录重物下沿位置')}
          >
            <defs>
              <radialGradient id={`${id}skin`} cx="32%" cy="25%" r="75%">
                <stop stopColor="#eedfc0" stopOpacity=".72" />
                <stop offset=".6" stopColor="#dfc79c" stopOpacity=".75" />
                <stop offset="1" stopColor="#bfb78a" stopOpacity=".85" />
              </radialGradient>
            </defs>
            <rect x="197" y="84" width="21" height="243" rx="3" fill="#e7e3ce" />
            {Array.from({ length: 23 }, (_, i) => (
              <path
                key={i}
                d={`M198 ${98 + i * 10 * 1.1}h${i % 5 === 0 ? 16 : 8}`}
                stroke="#aeb995"
              />
            ))}
            {s.positions.map((pos, i) => (
              <g key={i} opacity={0.3 + (0.65 * i) / Math.max(1, s.positions.length - 1)}>
                <path d={`M169 ${98 + pos * 1.1}H195`} stroke="#a1946c" />
                <circle cx="177" cy={98 + pos * 1.1} r="2.5" fill="#a1946c" />
              </g>
            ))}
            <g transform={`translate(0 ${bodyY})`}>
              <ellipse cx="112" cy="0" rx="34" ry="34" fill={`url(#${id}skin)`} stroke="#c4b68a" />
              <path
                d="M89-18Q94-27 107-28"
                stroke="#f6f0db"
                strokeWidth="3"
                strokeLinecap="round"
                opacity=".8"
              />
              <path d="M109 33l3 6 3-6" fill="#bdad7b" />
              <path d={`M112 39V${64 - height}`} stroke="#8fa083" strokeWidth="1.5" />
              <rect
                x="104"
                y={64 - height}
                width="16"
                height={height}
                rx="2"
                fill="#a3b397"
                stroke="#829b7a"
              />
              <path d="M121 64H165" stroke="#aa9470" strokeDasharray="3 4" />
            </g>
            <path
              d="M291 164v97m0-56-20 58m20-58 20 58"
              stroke="#b3bea7"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect x="270" y="143" width="42" height="25" rx="5" fill="#becaaf" stroke="#a2b392" />
            <path d="M270 150l-10-4v20l10-4Z" fill="#a3b797" />
            <circle cx="302" cy="151" r="3" fill="#d7dfc8" />
          </svg>
          <div className="balloon-drag-readings">
            <p>{t(accelerating ? '加速段示意，不能作为终端数据' : '按教材终端段数据重建')}</p>
            <span>
              {t('总重力')} <b>{(s.weight * 100).toFixed(1)} ×10⁻² N</b>
            </span>
            <span>
              {t('已记录间隔')} <b>{s.spacings.length} T₀</b>
            </span>
            <span>
              {t('平均每帧位移')} <b>{s.average === null ? '—' : s.average.toFixed(1)} cm</b>
            </span>
            <div className="balloon-drag-intervals">
              {s.spacings.map((d, i) => (
                <div key={i}>
                  <i style={{ width: `${(d / 35) * 100}%` }} />
                  <span>{d.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <p>
              {t(
                accelerating ? '间距仍在变大：速度还没有稳定' : '间距近似相等，才可选择这个测量段',
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="balloon-drag-plot">
          <p>{t(B ? '假设浮力校正：F阻 = G − B' : '按教材近似：F阻 ≈ G')}</p>
          <svg
            viewBox="0 0 370 260"
            role="img"
            aria-label={t('教材七组点与过原点线性、平方关系拟合')}
          >
            <defs>
              <clipPath id={`${id}plot`}>
                <rect x="45" y="18" width="280" height="187" />
              </clipPath>
            </defs>
            <path d="M45 20V205H329" stroke="#b6c4a3" fill="none" />
            {[0, 4, 8, 12].map((v) => (
              <g key={v}>
                <path d={`M45 ${205 - (v / 12) * 175}H325`} stroke="#e3e7d6" />
                <text x="36" y={211 - (v / 12) * 175} textAnchor="end" fontSize="20" fill="#819574">
                  {v}
                </text>
              </g>
            ))}
            <g clipPath={`url(#${id}plot)`}>
              <path
                d={path(2)}
                fill="none"
                stroke="#bda883"
                strokeDasharray="5 5"
                strokeWidth="2"
                opacity={film.watch && c === 3 && p < 0.42 ? 0.15 : 1}
              />
              <path d={path(1)} fill="none" stroke="#91a77d" strokeWidth="2.5" />
              {!film.watch &&
                fit.points.map((q, i) => (
                  <path
                    key={`residual-${i}`}
                    d={`M${45 + (q.speed / 35) * 280} ${205 - (q.drag / 0.12) * 175}V${205 - ((fit.coefficient * q.speed ** fit.power) / 0.12) * 175}`}
                    stroke="#ad8e65"
                    strokeWidth="1.5"
                  />
                ))}
              {fit.points.map((q, i) => (
                <circle
                  key={i}
                  cx={45 + (q.speed / 35) * 280}
                  cy={205 - (q.drag / 0.12) * 175}
                  r="4"
                  fill="#9a8b64"
                />
              ))}
            </g>
            {[0, 10, 20, 30].map((v) => (
              <text
                key={v}
                x={45 + (v / 35) * 280}
                y="230"
                textAnchor="middle"
                fontSize="20"
                fill="#819574"
              >
                {v}
              </text>
            ))}
            <text x="47" y="18" fontSize="20" fill="#819574">
              F / (10⁻² N)
            </text>
            <text x="325" y="257" textAnchor="end" fontSize="20" fill="#819574">
              v / (cm · T₀⁻¹)
            </text>
          </svg>
          <div className="balloon-drag-fits">
            <span>
              {t('线性拟合误差')} <b>{(linear.rmse * 100).toFixed(3)} ×10⁻² N</b>
            </span>
            <span>
              {t('平方拟合误差')} <b>{(quadratic.rmse * 100).toFixed(3)} ×10⁻² N</b>
            </span>
          </div>
        </div>
      )}
      {(!film.watch || (c >= 2 && visible > 0)) && (
        <div className="balloon-drag-table">
          <table>
            <caption>
              {film.watch && c === 2
                ? n >= 5
                  ? browserLocale() === 'en'
                    ? 'Current trial complete'
                    : '本组记录已完成'
                  : browserLocale() === 'en'
                    ? 'Previous completed trial'
                    : '上一组已完成记录'
                : t('教材原始表格 · 必修一118页')}
            </caption>
            <thead>
              <tr>
                <th>G / (10⁻² N)</th>
                <th>l / cm</th>
              </tr>
            </thead>
            <tbody>
              {BALLOON_DATA.slice(0, visible).map((q, i) => (
                <tr key={i} data-active={!plot && i === load}>
                  <td>{(q.weight * 100).toFixed(1)}</td>
                  <td>{q.stepCm.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="balloon-drag-cause">
        {t(
          c === 4 && film.watch
            ? '这是这组数据在有限范围内的经验关系，不能直接推广到所有球形物体。'
            : 'T₀是相邻视频帧的时间；教材未给帧率，保留cm/T₀，不能擅自换成m/s。',
        )}
      </p>
      {!film.watch && (
        <div className="balloon-drag-controls">
          <Segments
            label={t('研究步骤')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'terminal', label: t('终端帧') },
              { value: 'accelerating', label: t('加速反例') },
              { value: 'fit', label: t('数据拟合') },
            ]}
          />
          {plot ? (
            <>
              <Segments
                label={t('拟合形式')}
                value={power}
                onChange={setPower}
                options={[
                  { value: 'linear', label: t('线性') },
                  { value: 'quadratic', label: t('平方') },
                ]}
              />
              <Range
                label={t('假设浮力')}
                value={buoyancy}
                min={0}
                max={0.03}
                step={0.001}
                unit="N"
                onChange={setBuoyancy}
              />
            </>
          ) : (
            <>
              <Range
                label={t('教材数据组')}
                value={trial + 1}
                min={1}
                max={7}
                step={1}
                onChange={(v) => setTrial(v - 1)}
              />
              <Range
                label={t('视频帧序号')}
                value={frame}
                min={0}
                max={6}
                step={0.01}
                onChange={setFrame}
              />
            </>
          )}
        </div>
      )}
      <p className="balloon-drag-note">
        {t(
          '画面是数据的可视化重建，不是原始录像。气球体积固定；拟合与浮力校正只处理这些点，不将结论预设为普遍定律。',
        )}
      </p>
    </section>
  );
}
