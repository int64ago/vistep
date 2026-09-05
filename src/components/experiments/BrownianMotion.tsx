import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import {
  BROWNIAN,
  brownianFilm,
  brownianShot,
  brownianTrack,
  brownianCoefficients,
  brownianSample,
  brownianStatistics,
  type BrownianView,
} from '../../models/brownian-motion';
import {
  BrownianLens,
  BrownianImpulsePanel,
  BrownianMemory,
  BrownianMSDPlot,
  brownianColors,
} from '../lab/BrownianMicroscope';
import '../../styles/brownian-motion.css';

export default function BrownianMotion() {
  const director = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(840);
  const [temperature, setTemperature] = useState(300),
    [viscosity, setViscosity] = useState(1),
    [radius, setRadius] = useState(0.5),
    [seed, setSeed] = useState<number>(BROWNIAN.seed),
    [elapsed, setElapsed] = useState(2),
    [microTime, setMicroTime] = useState(6),
    [view, setView] = useState<BrownianView>('trace');
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, entry.contentRect.width)),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const film = useMemo(() => brownianFilm(), []),
    shot = brownianShot(director.chapter, director.chapterProgress),
    active = director.watch ? shot.view : view;
  const parameters = useMemo(
    () => ({ temperature, viscosity: viscosity * 1e-3, radius: radius * 1e-6 }),
    [temperature, viscosity, radius],
  );
  const manual = useMemo(() => {
    if (director.watch) return null;
    const c = brownianCoefficients(parameters),
      micro = view === 'impulse',
      base = brownianTrack(parameters, seed, micro ? 12 * c.tau : 4, micro ? 384 : 512);
    return {
      base,
      ensemble:
        view === 'msd' || view === 'mean'
          ? [
              base,
              ...Array.from({ length: 63 }, (_, i) =>
                brownianTrack(parameters, seed + 104729 * (i + 1)),
              ),
            ]
          : [base],
    };
  }, [parameters, seed, director.watch, view]);
  const selected = useMemo(() => {
    if (manual) return active === 'msd' || active === 'mean' ? manual.ensemble : [manual.base];
    if (active === 'trace') return [film.opening];
    if (active === 'impulse') return [film.inertial];
    if (active === 'memory') return [film.cooling];
    if (active === 'temperature') return [film.base, film.hot];
    if (active === 'resistance') return [film.base, film.thick, film.large];
    if (active === 'msd' || active === 'mean') return film.ensemble;
    return [film.base];
  }, [manual, active, film]);
  const c = brownianCoefficients(selected[0].parameters),
    time = director.watch ? shot.time : active === 'impulse' ? microTime * c.tau : elapsed;
  const compact = width < 640,
    phoneFilm = director.watch && compact,
    centroid = active === 'impulse' || active === 'memory',
    ensemble = active === 'msd' || active === 'mean',
    compare = active === 'temperature' || active === 'resistance';
  const current = brownianSample(selected[0], time),
    stats = brownianStatistics(selected, time),
    lensHeight = compact ? (active === 'msd' ? 180 : centroid ? 170 : 270) : 400;
  const context =
    active === 'impulse'
      ? '热浴冲量 + 阻力冲量 = 动量变化；不是瞬时白噪声力。'
      : active === 'memory'
        ? 'T = 0 是经典模型极限；保留初速度，不代表液体能冷到零开尔文。'
        : active === 'overdamped'
          ? '金色：带惯性；蓝色虚线：同一热浴的过阻尼极限。'
          : active === 'mean'
            ? '深色菱形是平均位置，不是一颗真的粒子。'
            : active === 'msd'
              ? '64 次独立重复。圆圈是理论均方根尺度，不是围墙。'
              : compare
                ? 'D = kᴮT / (6πηa)'
                : '轨迹连接离散观测点；视野边缘不是物理边界。';
  const reset = () => {
    setTemperature(300);
    setViscosity(1);
    setRadius(0.5);
    setSeed(BROWNIAN.seed);
    setElapsed(2);
    setMicroTime(6);
    setView('trace');
  };
  return (
    <section
      className="bm-study"
      data-watch={director.watch}
      data-view={active}
      data-compact={compact}
      data-phone-film={phoneFilm}
    >
      <div className="bm-eyebrow">
        {t(
          centroid
            ? '惯性显微镜'
            : ensemble
              ? '同一初点 · 独立热浴样本'
              : compare
                ? '同一初点 · 参数对照'
                : '一颗球形示踪粒子',
        )}
        <span>
          {centroid
            ? `τ = ${(c.tau * 1e9).toFixed(0)} ns`
            : `#${director.watch ? BROWNIAN.seed : seed}`}
        </span>
      </div>
      <div className="bm-body" ref={host}>
        <BrownianLens
          tracks={selected}
          time={time}
          width={width}
          height={lensHeight}
          centroid={centroid}
          ensemble={ensemble}
          mean={active === 'mean'}
          overdamped={active === 'overdamped'}
        />
        {active === 'impulse' ? (
          <BrownianImpulsePanel track={selected[0]} time={time} width={width} compact={phoneFilm} />
        ) : active === 'memory' ? (
          <BrownianMemory track={selected[0]} time={time} width={width} compact={phoneFilm} />
        ) : active === 'msd' ? (
          <BrownianMSDPlot
            tracks={selected}
            time={time}
            width={width}
            horizon={director.watch ? 2 : 4}
            compact={phoneFilm}
          />
        ) : compare ? (
          <div className="bm-comparisons">
            {selected.map((tr, i) => (
              <div key={i}>
                <span style={{ color: brownianColors[i] }}>
                  <i style={{ background: brownianColors[i] }} />
                  {active === 'temperature'
                    ? `${tr.parameters.temperature} K`
                    : t(i === 0 ? '参考粒子' : i === 1 ? '黏度 × 3' : '半径 × 2')}
                </span>
                <b>{(brownianCoefficients(tr.parameters).diffusion * 1e12).toFixed(3)} µm²/s</b>
              </div>
            ))}
            <p className="bm-note">
              {t(
                active === 'temperature'
                  ? '固定黏度、半径；共用标准化噪声作对照。'
                  : '同一温度。黏度增大或球变大，长时间 D 都下降。',
              )}
            </p>
          </div>
        ) : active === 'mean' ? (
          <div className="bm-readings">
            <div>
              <span>{t('平均位置距原点')}</span>
              <b>{(Math.hypot(stats.x, stats.y) * 1e6).toFixed(2)} µm</b>
            </div>
            <div>
              <span>{t('均方根位移')}</span>
              <b>{(Math.sqrt(stats.msd) * 1e6).toFixed(2)} µm</b>
            </div>
          </div>
        ) : active === 'overdamped' ? (
          <div className="bm-readings">
            <div>
              <span>{t('两种描述的端点差')}</span>
              <b>
                {(Math.hypot(current.x - current.ox, current.y - current.oy) * 1e9).toFixed(2)} nm
              </b>
            </div>
            <div>
              <span>{t('长时间理论均方位移')}</span>
              <b>{(4 * c.diffusion * time * 1e12).toFixed(2)} µm²</b>
            </div>
          </div>
        ) : (
          <div className="bm-readings">
            <div>
              <span>{t('扩散系数 D')}</span>
              <b>{(c.diffusion * 1e12).toFixed(3)} µm²/s</b>
            </div>
            <div>
              <span>{t('这一条的位移')}</span>
              <b>{(Math.hypot(current.x, current.y) * 1e6).toFixed(2)} µm</b>
            </div>
          </div>
        )}
        {!phoneFilm && <p className="bm-note bm-context">{t(context)}</p>}
        {phoneFilm && active === 'overdamped' && (
          <div className="bm-path-key">
            <span>
              <i />
              {t('保留惯性')}
            </span>
            <span>
              <i className="bm-dashed-key" />
              {t('过阻尼')}
            </span>
          </div>
        )}
        {phoneFilm && active === 'mean' && <p className="bm-mean-key">◆ {t('平均位置')}</p>}
        {centroid && !(director.watch && compact) && (
          <p className="bm-note bm-scale-note">{t('只放大质心位移；圆点大小不代表粒子半径。')}</p>
        )}
        {!ensemble && !compare && !centroid && (
          <div className="bm-conditions">
            <span>{selected[0].parameters.temperature} K</span>
            <span>η = {(selected[0].parameters.viscosity * 1e3).toFixed(1)} mPa·s</span>
            <span>a = {(selected[0].parameters.radius * 1e6).toFixed(1)} µm</span>
          </div>
        )}
      </div>
      {!director.watch && (
        <div className="bm-explore">
          <div className="bm-options" role="group" aria-label={t('选择布朗观察尺度')}>
            {(
              [
                ['trace', '单条轨迹'],
                ['impulse', '热浴与惯性'],
                ['overdamped', '过阻尼对照'],
                ['msd', '均方位移'],
                ['mean', '平均与个体'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} aria-pressed={view === id}>
                {t(label)}
              </button>
            ))}
          </div>
          <Range
            label={t('热浴温度')}
            value={temperature}
            min={0}
            max={450}
            step={10}
            unit="K"
            onChange={setTemperature}
          />
          <Range
            label={t('流体动力黏度')}
            value={viscosity}
            min={0.5}
            max={5}
            step={0.1}
            unit="mPa·s"
            onChange={setViscosity}
          />
          <Range
            label={t('示踪球半径')}
            value={radius}
            min={0.2}
            max={1.5}
            step={0.1}
            unit="µm"
            onChange={setRadius}
          />
          {active === 'impulse' ? (
            <Range
              label={t('惯性观察时间')}
              value={microTime}
              min={0}
              max={12}
              step={0.1}
              unit="τ"
              onChange={setMicroTime}
            />
          ) : (
            <Range
              label={t('轨迹观察时间')}
              value={elapsed}
              min={0}
              max={4}
              step={0.01}
              unit="s"
              onChange={setElapsed}
            />
          )}
          <div className="bm-options">
            <button onClick={() => setSeed((s) => s + 1)}>{t('换一个热浴样本')}</button>
            <button onClick={reset}>{t('重置布朗实验')}</button>
          </div>
          <p className="bm-note">
            {t(
              '固定种子可重建同一轨迹；改变参数会重算整次实验。温度与黏度独立设置，不是某种液体的温度曲线。',
            )}
          </p>
        </div>
      )}
      <details className="bm-notes">
        <summary>{t('布朗模型的边界')}</summary>
        <div>
          {phoneFilm && <p>{t(context)}</p>}
          {phoneFilm && compare && (
            <p>
              {t(
                active === 'temperature'
                  ? '固定黏度、半径；共用标准化噪声作对照。'
                  : '同一温度。黏度增大或球变大，长时间 D 都下降。',
              )}
            </p>
          )}
          {centroid && director.watch && compact && (
            <p>{t('只放大质心位移；圆点大小不代表粒子半径。')}</p>
          )}
          <p>
            {t(
              '采用稀悬浮液中无滑移球体的经典、各向同性 Langevin 模型。流体无整体流动，无外力、墙壁或粒子间相互作用；画面是三维运动的两个坐标投影。',
            )}
          </p>
          <p>
            m dv = −γv dt + √(2γkᴮT) dW
            <br />γ = 6πηa · τ = m/γ · D = kᴮT/γ
          </p>
          <p>
            {t(
              '质量按密度 1050 kg/m³ 与球体体积计算。初速度取热平衡高斯分布；零温衰减章单独保留初速度。自由空间的位置没有可归一化的平衡分布，速度可以保持热平衡。',
            )}
          </p>
          <p>
            {t(
              '流体附加质量、流体记忆、有限分子碰撞时间和真实显微镜噪声均未模拟。纳秒镜头解释这一理想模型，不声称精确再现真实液体的极短时实验。',
            )}
          </p>
          <p>
            ⟨Δr²⟩ = 4D[t − τ(1 − exp(−t/τ))]
            <br />t ≪ τ: ⟨Δr²⟩ ≈ 2(kᴮT/m)t²
            <br />t ≫ τ: ⟨Δr²⟩ ≈ 4Dt
          </p>
          <p>
            {t(
              '采用位置与速度的联合高斯精确转移。噪声按种子与样本序号寻址，固定观测点之间直线插值；插值不是更细时间尺度的物理轨迹。白噪声只在积分或统计意义下使用。',
            )}
          </p>
          <p>
            {t(
              '参数对照共用标准化噪声，便于比较尺度；64 次统计使用独立种子。只平均所示 x、y 两个坐标，因此系数是 4，不是三维的 6。',
            )}
          </p>
        </div>
      </details>
    </section>
  );
}
