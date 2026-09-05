import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import {
  INTERFERENCE_DEFAULT,
  interferenceAt,
  interferenceEnergy,
  interferenceShot,
  samePointAmplitude,
  type InterferenceInput,
  type InterferenceMode,
  type InterferenceView,
} from '../../models/wave-interference';
import {
  WaveInterferenceEnergy,
  WaveInterferencePhase,
  WaveInterferencePoint,
  WaveInterferenceString,
  WaveInterferenceTrace,
} from '../lab/WaveInterferenceString';
import { WaveInterferencePhone } from '../lab/WaveInterferencePhone';
import '../../styles/wave-interference.css';

export default function WaveInterference() {
  const demo = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900),
    [manual, setManual] = useState<InterferenceInput>({ ...INTERFERENCE_DEFAULT });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, entry.contentRect.width)),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const shot = interferenceShot(demo.chapter, demo.chapterProgress),
    input = demo.watch ? shot.input : manual;
  const view: InterferenceView = demo.watch
    ? shot.view
    : input.mode === 'pulses'
      ? 'energy'
      : input.mode === 'phase'
        ? 'phase'
        : input.mode === 'trains'
          ? 'formation'
          : 'nodes';
  const compact = width < 660,
    phase = view === 'phase' || view === 'amplitude',
    energy = view === 'energy' || view === 'nodes';
  const point = interferenceAt(input, input.probe);
  const energySpan = compact && demo.watch && energy ? 0.8 : 1.6;
  const totals = useMemo(
    () => interferenceEnergy(input, -energySpan, energySpan),
    [input.mode, input.time, input.phase, input.ratio, energySpan],
  );
  const set = (key: keyof InterferenceInput, value: number) =>
    setManual((old) => ({ ...old, [key]: value }));
  const mode = (mode: InterferenceMode) =>
    setManual({
      ...INTERFERENCE_DEFAULT,
      mode,
      time: mode === 'pulses' ? -0.08 : mode === 'trains' ? 0.2 : 0,
      ratio: mode === 'pulses' ? -1 : 1,
      probe: mode === 'pulses' ? 0.2 : 0.4,
    });
  return (
    <section
      className="wi-study"
      data-watch={demo.watch}
      data-compact={compact}
      data-wave-view={view}
    >
      <div className="wi-heading">
        <span>{t(compact ? '波的干涉' : '波的干涉 · 一根绳，两列波')}</span>
        <span>{t('理想弦 · 慢动作')}</span>
      </div>
      {!demo.watch && <p className="wi-current">{t('调整时间和输入，观察同一模型。')}</p>}
      <div className="wi-body" ref={host}>
        {demo.watch && compact ? (
          <>
            <WaveInterferencePhone input={input} view={view} width={width} />
            {view === 'nodes' && <p className="wi-fact">{t('波节间距：0.8 m')}</p>}
          </>
        ) : (
          <>
            {!(demo.watch && compact && phase) && (
              <>
                <div className="wi-legend">
                  <span className="wi-key-a">A</span>
                  <span className="wi-key-b">B</span>
                  <span className="wi-key-sum">{t('实际绳形')}</span>
                  <span>{t('虚线：分量')}</span>
                </div>
                <WaveInterferenceString
                  input={input}
                  width={width}
                  compact={compact && demo.watch}
                  view={view}
                />
              </>
            )}
            <div className="wi-evidence">
              {(view === 'material' || view === 'pass') && (
                <WaveInterferenceTrace input={input} width={width} />
              )}
              {(view === 'cancel' || view === 'formation' || phase) && (
                <WaveInterferencePoint input={input} width={width} view={view} />
              )}
              {phase && compact && <WaveInterferencePhase input={input} width={width} />}
              {energy && (
                <>
                  <div className="wi-energy-key">
                    <span>{t('动能')}</span>
                    <span>{t('形变能')}</span>
                    <span>{t(compact ? '瞬时能流' : '箭头：瞬时能流')}</span>
                  </div>
                  <WaveInterferenceEnergy input={input} width={width} span={energySpan} />
                  <div className="wi-energy-totals">
                    <span>
                      {t('观察窗内')}
                      <b>{(totals.total * 1000).toFixed(3)} mJ</b>
                    </span>
                    <div className="wi-energy-bar" aria-label={t('动能与形变能所占比例')}>
                      <i
                        style={{
                          width: `${totals.total ? (totals.kinetic / totals.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span>
                      K {(totals.total ? (totals.kinetic / totals.total) * 100 : 0).toFixed(0)}% · U{' '}
                      {(totals.total ? (totals.potential / totals.total) * 100 : 0).toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="wi-readout">
              {phase ? (
                <>
                  <span>
                    Δφ <b>{((input.phase * 180) / Math.PI).toFixed(0)}°</b>
                  </span>
                  <span>
                    {t('合振幅')}{' '}
                    <b>{(samePointAmplitude(input.ratio, input.phase) * 1000).toFixed(2)} mm</b>
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {t('模型时间')} <b>{input.time.toFixed(3)} s</b>
                  </span>
                  <span>
                    P · y <b>{(point.y * 1000).toFixed(2)} mm</b>
                  </span>
                </>
              )}
            </div>
            {view === 'nodes' && (
              <p className="wi-fact">
                {t(
                  input.ratio !== 1
                    ? '振幅不等，没有始终静止的波节。'
                    : compact
                      ? '波节间距：0.8 m'
                      : '相邻波节相隔 λ/2 = 0.8 m；它们不是夹具。',
                )}
              </p>
            )}
            {phase && (
              <p className="wi-fact">{t('比较不同输入；调相位或振幅时不作能量守恒比较。')}</p>
            )}
          </>
        )}
      </div>
      {!demo.watch && (
        <div className="wi-explore">
          <div className="wi-modes" role="group" aria-label={t('选择绳波实验')}>
            <button aria-pressed={input.mode === 'pulses'} onClick={() => mode('pulses')}>
              {t('有限脉冲')}
            </button>
            <button aria-pressed={input.mode === 'phase'} onClick={() => mode('phase')}>
              {t('同向简谐波')}
            </button>
            <button aria-pressed={input.mode === 'trains'} onClick={() => mode('trains')}>
              {t('波列相遇')}
            </button>
            <button aria-pressed={input.mode === 'standing'} onClick={() => mode('standing')}>
              {t('驻波')}
            </button>
          </div>
          <Range
            label={t('模型时间')}
            value={input.time}
            min={input.mode === 'pulses' ? -0.1 : input.mode === 'trains' ? -0.02 : 0}
            max={input.mode === 'pulses' ? 0.1 : input.mode === 'trains' ? 0.36 : 0.16}
            step={0.001}
            unit="s"
            onChange={(v) => set('time', v)}
          />
          <Range
            label={t('第二列波的振幅比')}
            value={input.ratio}
            min={input.mode === 'pulses' ? -1 : 0}
            max={1}
            step={0.05}
            onChange={(v) => set('ratio', v)}
          />
          {input.mode === 'phase' && (
            <Range
              label={t('两列波的相位差')}
              value={Math.round((input.phase * 180) / Math.PI)}
              min={0}
              max={180}
              step={1}
              unit="°"
              onChange={(v) => set('phase', (v * Math.PI) / 180)}
            />
          )}
          <Range
            label={t('物质点 P 的位置')}
            value={input.probe}
            min={-0.6}
            max={0.6}
            step={0.05}
            unit="m"
            onChange={(v) => set('probe', v)}
          />
          <div className="wi-presets">
            {input.mode === 'pulses' && (
              <button onClick={() => setManual({ ...manual, time: 0 })}>{t('停在完全重叠')}</button>
            )}
            {input.mode === 'standing' && (
              <>
                <button onClick={() => set('probe', 0)}>{t('观察波节')}</button>
                <button onClick={() => set('probe', 0.4)}>{t('观察波腹')}</button>
              </>
            )}
            <button onClick={() => setManual({ ...INTERFERENCE_DEFAULT })}>
              {t('恢复初始绳波')}
            </button>
          </div>
        </div>
      )}
      <details className="wi-notes">
        <summary>{t('刻度与模型边界')}</summary>
        <div>
          <p>
            {t(
              '横向标尺以米计，位移以毫米计并放大显示。圆点是绳的物质点；虚线是数学分量，不是另外两根绳。',
            )}
          </p>
          <p>
            {t(
              '均匀绳，张力 1 N，线密度 0.01 kg/m，波速 10 m/s。无阻尼、无色散，忽略纵向运动，采用小斜率近似。',
            )}
          </p>
          <p>
            {t(
              '观察窗属于更长的绳，两侧不是固定端。脉冲完全留在窗内时总能量恒定；波列进入时必须计入边界能流。',
            )}
          </p>
          <p>
            y = y₁ + y₂
            <br />e = ½μ(∂y/∂t)² + ½T(∂y/∂x)²
            <br />S = −T(∂y/∂t)(∂y/∂x)
          </p>
          <p>
            {t(
              '驻波的平均净能流为零，瞬时能流一般不为零。速度箭头按真实时间导数绘制；慢动作播放不改变物理速度读数。',
            )}
          </p>
        </div>
      </details>
    </section>
  );
}
