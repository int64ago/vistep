import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import {
  SPEAKER_DEFAULT,
  SPEAKER_PARAMETERS,
  speakerFrequencyCurve,
  speakerResponse,
  speakerShot,
  speakerSine,
  type SpeakerView,
} from '../../models/speaker';
import {
  SpeakerAir,
  SpeakerCutaway,
  SpeakerPower,
  SpeakerResponsePlot,
  SpeakerSignal,
} from '../lab/SpeakerCutaway';
import '../../styles/speaker.css';

export default function Speaker() {
  const film = useShowcase(),
    root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(940),
    [manual, setManual] = useState({ ...SPEAKER_DEFAULT }),
    [inspection, setInspection] = useState<SpeakerView>('assembly');
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([e]) => setWidth(Math.max(180, e.contentRect.width)));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const shot = speakerShot(film.chapter, film.chapterProgress),
    parameters = film.watch ? shot.parameters : { ...SPEAKER_PARAMETERS, damping: manual.damping };
  const frequency = film.watch ? shot.frequency : manual.frequency,
    voltage = film.watch ? shot.voltage : manual.voltage,
    phase = film.watch ? shot.phase : (manual.phase * Math.PI) / 180;
  const state = film.watch ? shot.state : speakerSine(parameters, frequency, voltage, phase),
    view = film.watch ? shot.view : inspection,
    compact = width < 690;
  const response = speakerResponse(parameters, frequency, voltage);
  const curve = useMemo(() => speakerFrequencyCurve(parameters), [parameters.damping]);
  const compare = view === 'response' || view === 'damping',
    air = view === 'air';
  const cutaway = !(compare || air || view === 'power');
  const statement =
    view === 'assembly'
      ? '线圈先受力，带着整个振动组件动起来。'
      : view === 'gap'
        ? '磁场方向不变，电流反向，推力也反向。'
        : view === 'suspension'
          ? '音圈与锥盆一起走，折环和弹波连续弯曲。'
          : view === 'generator'
            ? '电压归零而回路闭合，运动仍会产生反电动势。'
            : view === 'power'
              ? '输入功率，一部分耗散，一部分改变储能。'
              : view === 'response'
                ? '保持输入电压，比较每个频率的稳态行程。'
                : view === 'damping'
                  ? '增加机械阻尼，稳态行程峰变矮。'
                  : '空气质点留在附近，向外传的是压缩。';
  const set = (key: keyof typeof manual, value: number) =>
    setManual((old) => ({ ...old, [key]: value }));
  const reset = () => {
    setManual({ ...SPEAKER_DEFAULT });
    setInspection('assembly');
  };
  return (
    <section
      className="speaker-study"
      data-compact={compact}
      data-watch={film.watch}
      data-speaker-view={view}
    >
      <div className="speaker-heading">
        <span>{t('扬声器 · 从电流到空气')}</span>
        <span>{t('小信号模型 · 慢动作剖面')}</span>
      </div>
      <p className="speaker-current">{t(statement)}</p>
      <div className="speaker-body" ref={root}>
        {cutaway && <SpeakerCutaway state={state} width={width} compact={compact} view={view} />}
        {(view === 'assembly' || view === 'gap') && (
          <SpeakerSignal state={state} width={width} kind="force" />
        )}
        {view === 'suspension' && <SpeakerSignal state={state} width={width} kind="motion" />}
        {view === 'generator' && (
          <>
            <SpeakerSignal state={state} width={width} kind="emf" />
            <p className="speaker-quiet">{t('端电压 0 V；线圈通过电阻保持闭合。')}</p>
          </>
        )}
        {view === 'power' && (
          <>
            <div className="speaker-equation">ui = Ri² + Dv² + dE/dt</div>
            <SpeakerPower state={state} width={width} />
            <div className="speaker-power-transfer">
              <span>{t('同一电机转换功率')}</span>
              <b>Bl · i · v = {(state.motorPower * 1000).toFixed(2)} mW</b>
            </div>
          </>
        )}
        {compare && (
          <>
            <div className="speaker-comparison">
              <span>{t('每点均为稳态比较')}</span>
              <b>
                {voltage.toFixed(2)} V {t('峰值')}
              </b>
            </div>
            <SpeakerResponsePlot
              curve={curve}
              width={width}
              frequency={frequency}
              voltage={voltage}
              amplitude={response.amplitude}
            />
            <div className="speaker-response-readout">
              {(!film.watch || !compact || view !== 'damping') && (
                <span data-speaker-reading="frequency">
                  f<b>{frequency.toFixed(1)} Hz</b>
                </span>
              )}
              {(!film.watch || !compact || view === 'damping') && (
                <span data-speaker-reading="impedance">
                  |Z|<b>{response.impedance.toFixed(2)} Ω</b>
                </span>
              )}
              <span data-speaker-reading="damping">
                D<b>{parameters.damping.toFixed(2)} N·s/m</b>
              </span>
            </div>
            <p className="speaker-quiet">{t('显示位移响应，不是声压级曲线。')}</p>
          </>
        )}
        {air && (
          <>
            <SpeakerAir
              parameters={parameters}
              frequency={frequency}
              voltage={voltage}
              phase={phase}
              width={width}
              compact={compact}
            />
            <p className="speaker-quiet">
              {t('只示意平面波的相位与压缩，不预测真实扬声器的声压级。')}
            </p>
          </>
        )}
        {cutaway && (
          <div className="speaker-status">
            <span>
              {t('实际位移')}
              <b>{(state.position * 1000).toFixed(3)} mm</b>
            </span>
            {view === 'generator' && <span className="speaker-terminal">{t('端电压')} · 0 V</span>}
            <span>{t('剖面行程放大 8 倍')}</span>
          </div>
        )}
      </div>
      {!film.watch && (
        <div className="speaker-explore">
          <div className="speaker-modes" role="group" aria-label={t('选择扬声器观察部位')}>
            <button
              aria-pressed={inspection === 'assembly'}
              onClick={() => setInspection('assembly')}
            >
              {t('完整剖面')}
            </button>
            <button aria-pressed={inspection === 'gap'} onClick={() => setInspection('gap')}>
              {t('磁隙近看')}
            </button>
            <button
              aria-pressed={inspection === 'suspension'}
              onClick={() => setInspection('suspension')}
            >
              {t('悬挂连接')}
            </button>
            <button
              aria-pressed={inspection === 'response'}
              onClick={() => setInspection('response')}
            >
              {t('稳态响应')}
            </button>
            <button aria-pressed={inspection === 'power'} onClick={() => setInspection('power')}>
              {t('功率收支')}
            </button>
            <button aria-pressed={inspection === 'air'} onClick={() => setInspection('air')}>
              {t('空气质点')}
            </button>
          </div>
          <Range
            label={t('输入电压峰值')}
            value={manual.voltage}
            min={0}
            max={0.4}
            step={0.01}
            unit="V"
            onChange={(v) => set('voltage', v)}
          />
          <Range
            label={t('驱动频率')}
            value={manual.frequency}
            min={20}
            max={400}
            step={1}
            unit="Hz"
            onChange={(v) => set('frequency', v)}
          />
          <Range
            label={t('周期相位')}
            value={manual.phase}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={(v) => set('phase', v)}
          />
          <Range
            label={t('机械阻尼')}
            value={manual.damping}
            min={0.3}
            max={2.5}
            step={0.05}
            unit="N·s/m"
            onChange={(v) => set('damping', v)}
          />
          <div className="speaker-buttons">
            <button onClick={() => set('phase', (manual.phase + 180) % 360)}>
              {t('反转半个周期')}
            </button>
            <button onClick={reset}>{t('恢复扬声器初始状态')}</button>
          </div>
          <p className="speaker-quiet">{t('自由探索是稳态快照；相位滑块可来回检查一个周期。')}</p>
        </div>
      )}
      <details className="speaker-notes">
        <summary>{t('结构、刻度与近似')}</summary>
        <div>
          <p>
            {t(
              '永久磁体、导磁轭、中心极柱和上夹板固定；音圈绕在线圈骨架上，并与锥盆、防尘帽刚性连接。弹波、折环和柔性引线的移动端跟随同一位移，固定端留在盆架。',
            )}
          </p>
          <p>
            {t(
              '剖面为轴对称结构的平面切片。磁路虚线只表示闭合拓扑，不是磁场有限元结果；绕组截面作分组示意。实际行程放大 8 倍，数值仍用真实单位。',
            )}
          </p>
          <p>
            R = 6 Ω · L = 0.5 mH · Bl = 4 N/A
            <br />M = 12 g · K = 1200 N/m · D = {parameters.damping.toFixed(2)} N·s/m
          </p>
          <p>
            u = Ri + L di/dt + Bl v<br />M dv/dt = Bl i − Kx − Dv
            <br />E = ½Li² + ½Mv² + ½Kx²
          </p>
          <p>
            {t(
              '这是恒参数的小信号集总模型。忽略非线性磁路、线圈升温、锥盆分割振动、箱体和空间声场；机械耗散不等于全部辐射声功率。',
            )}
          </p>
          <p>
            {t(
              '空气图是单向驱动的一维平面波运动学说明，使用锥盆的延迟位移和速度；未把声负载反馈到驱动器。质点位移另行放大，颜色按压缩相位归一化，不能读作 CFD、声压级或距离衰减。',
            )}
          </p>
          <p>
            {t(
              '改变频率或阻尼是在比较不同设置的稳态，不是扫频瞬态。演示的切断电压段从同一初态直接重建，回路保持闭合。',
            )}
          </p>
        </div>
      </details>
    </section>
  );
}
