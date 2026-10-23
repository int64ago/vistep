import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  BALLOON_DATA,
  balloonVideo,
  balloonFit,
  balloonBalance,
  balloonFilm,
  type BalloonView,
} from '../../models/balloon-drag-lab';
import '../../styles/balloon-drag-lab.css';
function Balloon({ x, y, load, id }: { x: number; y: number; load: number; id: string }) {
  const height = 7 + load * 1.3;
  return (
    <g transform={`translate(${x} ${y})`} data-balloon-position={y}>
      <circle cy={-57} r={27} fill={`url(#${id})`} stroke="#bbae86" />
      <path
        d="M-17-72Q-10-80 0-79"
        stroke="#f4ebcf"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-3-31 0-25 3-31" fill="#b9a77d" />
      <path d={`M0-25V${-height}`} stroke="#8da081" strokeWidth="2" data-balloon-wire="true" />
      <rect x={-8} y={-height} width={16} height={height} rx="2" fill="#a8b99b" stroke="#809375" />
      <circle cy="0" r="3" fill="#9c8054" data-tracked-load="true" />
    </g>
  );
}
function Observation({
  width,
  trial,
  frame,
  accelerating,
  apparatus,
}: {
  width: number;
  trial: number;
  frame: number;
  accelerating: boolean;
  apparatus: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    s = balloonVideo(trial, frame, accelerating),
    scale = 0.57,
    base = 87,
    datum = base + s.positionCm * scale,
    bx = width * 0.21,
    rx = width * 0.44;
  return (
    <svg
      viewBox={`0 0 ${width} 219`}
      style={{ height: 219 }}
      role="img"
      aria-label={t('同一重物下沿与固定刻度尺')}
    >
      <defs>
        <radialGradient id={id} cx="30%" cy="22%" r="80%">
          <stop stopColor="#f3e4c5" />
          <stop offset="1" stopColor="#c8bb91" />
        </radialGradient>
      </defs>
      <rect x={rx} y={base - 5} width={18} height={124} rx="3" fill="#e7e4d2" />
      {Array.from({ length: 21 }, (_, i) => (
        <path key={i} d={`M${rx} ${base + i * 10 * scale}h${i % 5 ? 7 : 14}`} stroke="#a9b792" />
      ))}
      {s.positions.map((pos, i) => (
        <g key={i} data-frame={i}>
          <path
            d={`M${bx + 16} ${base + pos * scale}H${rx}`}
            stroke="#b09a71"
            strokeDasharray="3 3"
          />
          <circle cx={bx + 20} cy={base + pos * scale} r="2.5" fill="#ad956c" />
        </g>
      ))}
      <Balloon x={bx} y={datum} load={trial} id={id} />
      <path d={`M${bx + 10} ${datum}H${rx}`} stroke="#8c9878" />
      {apparatus ? (
        <g transform={`translate(${width * 0.78} 104)`}>
          <rect x="-20" y="-12" width="38" height="24" rx="5" fill="#b9c8ac" />
          <path d="M-20-5-30-11V10l10-5" fill="#a2b492" />
          <path d="M0 12v65m0-35-18 35m18-35 18 35" stroke="#a9b99b" strokeWidth="2" />
          <text y="105" textAnchor="middle">
            {t('固定相机')}
          </text>
        </g>
      ) : (
        <>
          <text x={width - 12} y={21} textAnchor="end">
            {accelerating ? t('加速反例') : t('终端段重建')}
          </text>
          <text x={width - 12} y={48} textAnchor="end">
            n = {Math.floor(s.frame)}
          </text>
          {s.spacings.slice(-3).map((d, i) => (
            <text key={i} x={width - 12} y={90 + i * 28} textAnchor="end">
              Δl = {d.toFixed(1)} cm
            </text>
          ))}
        </>
      )}
    </svg>
  );
}
function Plot({
  width,
  B,
  power,
  showFits,
  showQuadratic,
  reveal,
}: {
  width: number;
  B: number;
  power: 1 | 2;
  showFits: boolean;
  showQuadratic: boolean;
  reveal: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    linear = balloonFit(1, B),
    quadratic = balloonFit(2, B),
    x = (v: number) => 38 + (v / 35) * (width - 54),
    y = (f: number) => 148 - (f / 0.12) * 110;
  const curve = (p: 1 | 2) =>
    Array.from({ length: 71 }, (_, i) => {
      const v = i * 0.5;
      return `${i ? 'L' : 'M'}${x(v)} ${y((p === 1 ? linear : quadratic).coefficient * v ** p)}`;
    }).join(' ');
  return (
    <>
      <svg
        viewBox={`0 0 ${width} 204`}
        style={{ height: 204 }}
        aria-label={t('七个固定观测点与两个候选拟合')}
        role="img"
      >
        <defs>
          <clipPath id={id}>
            <rect x="38" y="31" width={width - 50} height="117" />
          </clipPath>
        </defs>
        <text x="38" y="18">
          F / (10⁻² N)
        </text>
        <path d={`M38 31V148H${width - 12}`} stroke="#b7c5ab" fill="none" />
        {[0, 4, 8, 12].map((v) => (
          <g key={v}>
            <path d={`M38 ${y(v / 100)}H${width - 12}`} stroke="#e2e7d9" />
            <text x="29" y={y(v / 100) + 5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <g clipPath={`url(#${id})`}>
          {showFits && (
            <path d={curve(1)} fill="none" stroke="#7f9b7f" strokeWidth={power === 1 ? 2.5 : 1.5} />
          )}
          {showFits && showQuadratic && (
            <path
              d={curve(2)}
              fill="none"
              stroke="#ae9064"
              strokeDasharray="5 4"
              strokeWidth={power === 2 ? 2.5 : 1.5}
            />
          )}
          {linear.points.map((q, i) => (
            <g key={i}>
              <circle data-fixed-record={i} cx={x(q.speed)} cy={y(q.drag)} r="4" fill="#9d8359" />
              {reveal && (
                <path
                  d={`M${x(q.speed)} ${y(q.drag)}V${y((power === 1 ? linear : quadratic).coefficient * q.speed ** power)}`}
                  stroke="#b6a17b"
                />
              )}
            </g>
          ))}
        </g>
        {[0, 10, 20, 30].map((v) => (
          <text key={v} x={x(v)} y="171" textAnchor="middle">
            {v}
          </text>
        ))}
        <text x={width - 12} y="198" textAnchor="end">
          v / (cm · T₀⁻¹)
        </text>
      </svg>
      <div className="balloon-drag-fit-summary">
        {reveal ? (
          <>
            {t('线性')} {(linear.rmse * 1000).toFixed(2)} · {t('平方')}{' '}
            {(quadratic.rmse * 1000).toFixed(2)} mN
          </>
        ) : (
          t('哪条关系更贴近这些点？')
        )}
      </div>
    </>
  );
}
function Balance({
  width,
  trial,
  B,
  accelerating,
}: {
  width: number;
  trial: number;
  B: number;
  accelerating: boolean;
}) {
  const q = BALLOON_DATA[trial],
    id = useId().replace(/:/g, ''),
    a = accelerating ? 2 : 0,
    F = balloonBalance(q.weight, B, a).drag,
    x = width * 0.35,
    y = 133,
    scale = 650;
  return (
    <svg viewBox={`0 0 ${width} 214`} role="img" aria-label={t('重力减去浮力和阻力等于合力')}>
      <defs>
        <radialGradient id={id}>
          <stop stopColor="#eee0bc" />
          <stop offset="1" stopColor="#c4b88e" />
        </radialGradient>
      </defs>
      <Balloon x={x} y={y} load={trial} id={id} />
      <path
        data-force="weight"
        d={`M${x - 37} ${y - 35}v${q.weight * scale}m-4-6 4 6 4-6`}
        stroke="#ac8962"
        strokeWidth="2"
        fill="none"
      />
      <path
        data-force="drag"
        d={`M${x + 40} ${y - 35}v${-F * scale}m-4 6 4-6 4 6`}
        stroke="#749478"
        strokeWidth="2"
        fill="none"
      />
      {B > 0 && (
        <path
          data-force="buoyancy"
          d={`M${x + 66} ${y - 35}v${-B * scale}m-4 6 4-6 4 6`}
          stroke="#a0b996"
          strokeWidth="2"
          fill="none"
        />
      )}
      <text x={18} y={197}>
        G − B − F = ma
      </text>
      <text x={width - 12} y={24} textAnchor="end">
        {accelerating ? 'a = 2 m/s²' : 'a = 0'}
      </text>
      <text x={width - 12} y={56} textAnchor="end">
        G = {(q.weight * 1000).toFixed(0)} mN
      </text>
      <text x={width - 12} y={79} textAnchor="end">
        B = {(B * 1000).toFixed(0)} mN
      </text>
      <text x={width - 12} y={153} textAnchor="end">
        F = {(F * 1000).toFixed(1)} mN
      </text>
    </svg>
  );
}
export default function BalloonDragLab() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    authored = balloonFilm(film.chapter, film.chapterTime, browserLocale()),
    [manual, setManual] = useState<Partial<typeof authored>>({});
  const state = film.watch ? authored : { ...authored, ...manual },
    view = state.view,
    s = balloonVideo(state.trial, state.frame, state.accelerating),
    set = <K extends keyof typeof authored>(key: K, value: (typeof authored)[K]) =>
      setManual((p) => ({ ...p, [key]: value }));
  const labels: Record<BalloonView, string> = {
    apparatus: '装置与读数点',
    frames: '等时帧',
    records: '七组原始记录',
    fit: '比较关系',
    balance: '受力条件',
  };
  return (
    <section
      className="balloon-drag-lab"
      data-balloon-view={view}
      data-trial={state.trial}
      data-frame={state.frame}
      data-buoyancy={state.buoyancy}
      data-accelerating={state.accelerating}
      data-power={state.power}
      data-reveal={state.reveal}
    >
      <div className="balloon-drag-stage" ref={host}>
        {view === 'apparatus' || view === 'frames' ? (
          <>
            <div className="balloon-drag-kicker">
              G = {(s.weight * 1000).toFixed(0)} mN · {t('同一个气球')}
            </div>
            <Observation
              width={width}
              trial={state.trial}
              frame={state.frame}
              accelerating={state.accelerating}
              apparatus={view === 'apparatus'}
            />
          </>
        ) : null}
        {view === 'records' ? (
          <>
            <div className="balloon-drag-kicker">{t('教材原表 · 帧间隔未知')}</div>
            <table className="balloon-drag-records">
              <thead>
                <tr>
                  <th>G / (10⁻² N)</th>
                  <th>l / cm</th>
                </tr>
              </thead>
              <tbody>
                {BALLOON_DATA.slice(0, state.visible).map((q, i) => (
                  <tr key={i} data-active={i === state.trial}>
                    <td>{(q.weight * 100).toFixed(1)}</td>
                    <td>{q.stepCm.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
        {view === 'fit' ? (
          <>
            <div className="balloon-drag-kicker">
              {state.buoyancy
                ? `${t('假设')} B = ${(state.buoyancy * 1000).toFixed(0)} mN`
                : 'F ≈ G'}
            </div>
            <Plot
              width={width}
              B={state.buoyancy}
              power={state.power}
              showFits={state.showFits}
              showQuadratic={state.showQuadratic}
              reveal={state.reveal}
            />
          </>
        ) : null}
        {view === 'balance' ? (
          <>
            <div className="balloon-drag-kicker">
              {state.accelerating ? t('仍在加速，不能令阻力等于重力') : t('匀速时再写受力平衡')}
            </div>
            <Balance
              width={width}
              trial={state.trial}
              B={state.buoyancy}
              accelerating={state.accelerating}
            />
          </>
        ) : null}
      </div>
      {!film.watch && (
        <div className="balloon-drag-controls">
          <Segments
            label={t('研究步骤')}
            value={view}
            options={(Object.keys(labels) as BalloonView[]).map((value) => ({
              value,
              label: t(labels[value]),
            }))}
            onChange={(v) => set('view', v)}
          />
          <Range
            label={t('教材数据组')}
            value={state.trial + 1}
            min={1}
            max={7}
            step={1}
            onChange={(v) => set('trial', v - 1)}
          />
          {view === 'frames' || view === 'apparatus' ? (
            <>
              <Range
                label={t('视频帧序号')}
                value={state.frame}
                min={0}
                max={6}
                step={0.01}
                onChange={(v) => set('frame', v)}
              />
              <Segments
                label={t('运动状态')}
                value={state.accelerating ? 'accelerating' : 'terminal'}
                options={[
                  { value: 'terminal', label: t('终端段') },
                  { value: 'accelerating', label: t('加速反例') },
                ]}
                onChange={(v) => set('accelerating', v === 'accelerating')}
              />
            </>
          ) : null}
          {view === 'fit' || view === 'balance' ? (
            <>
              <Range
                label={t('假设浮力')}
                value={state.buoyancy}
                min={0}
                max={0.03}
                step={0.001}
                unit="N"
                onChange={(v) => set('buoyancy', v)}
              />
              {view === 'fit' ? (
                <>
                  <Segments
                    label={t('拟合形式')}
                    value={String(state.power)}
                    options={[
                      { value: '1', label: t('线性') },
                      { value: '2', label: t('平方') },
                    ]}
                    onChange={(v) =>
                      setManual((p) => ({
                        ...p,
                        power: v === '1' ? 1 : 2,
                        showFits: true,
                        showQuadratic: true,
                        reveal: true,
                      }))
                    }
                  />
                  {!state.reveal && (
                    <button
                      onClick={() =>
                        setManual((p) => ({
                          ...p,
                          showFits: true,
                          showQuadratic: true,
                          reveal: true,
                        }))
                      }
                    >
                      {t('揭晓比较')}
                    </button>
                  )}
                </>
              ) : (
                <Segments
                  label={t('运动状态')}
                  value={state.accelerating ? 'accelerating' : 'terminal'}
                  options={[
                    { value: 'terminal', label: t('终端段') },
                    { value: 'accelerating', label: t('加速反例') },
                  ]}
                  onChange={(v) => set('accelerating', v === 'accelerating')}
                />
              )}
            </>
          ) : null}
          <details>
            <summary>{t('数据与模型范围')}</summary>
            <p>{t('七组数字来自教材。终端帧为数据重建，加速反例和浮力均为假设，不是原始录像。')}</p>
            <p>{t('T₀未给定，不能把cm/T₀直接写成m/s。拟合误差用mN，不是测量不确定度。')}</p>
          </details>
        </div>
      )}
    </section>
  );
}
