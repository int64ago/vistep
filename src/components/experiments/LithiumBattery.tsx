import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import { lithiumShot, lithiumManual, type LithiumView } from '../../models/lithium-battery';
import LithiumBatteryStudio from '../three/LithiumBatteryStudio';
import {
  LithiumBatteryFlat,
  LithiumInventory,
  LithiumPower,
  LithiumRest,
  LithiumLedger,
} from '../lab/LithiumBatteryEvidence';
import '../../styles/lithium-battery.css';
export default function LithiumBattery() {
  const film = useShowcase(),
    body = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(900),
    [initialSoc, setSoc] = useState(85),
    [rate, setRate] = useState(1),
    [time, setTime] = useState(600),
    [mode, setMode] = useState<'discharge' | 'charge' | 'rest'>('discharge'),
    [view, setView] = useState<LithiumView>('paths'),
    [resetKey, resetKeySet] = useState(0);
  useEffect(() => {
    if (!body.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, entry.contentRect.width)),
    );
    observer.observe(body.current);
    return () => observer.disconnect();
  }, []);
  const compact = width < 680,
    shot = film.watch
      ? lithiumShot(film.chapter, film.chapterProgress)
      : lithiumManual(initialSoc / 100, rate, time, mode, view),
    v = shot.values,
    onlyEvidence =
      shot.view === 'rest' ||
      shot.view === 'limit' ||
      (compact && ['separator', 'inventory', 'power'].includes(shot.view));
  const statements: Record<LithiumView, string> = {
    layers: '石墨与 LFP 储存锂；湿润的隔膜把两极分开。',
    paths: '放电时，锂离子走内部，电子绕过隔膜走外部。',
    separator: '同一对示踪点走两条路，电子不穿过隔膜。',
    inventory: '每转移一份锂，就有匹配的电荷经过外部电路。',
    power: '电流增大，内阻压降立刻增加，极化随后累积。',
    rest: '电压回升了，SOC 没有增加；极化储能正在散为热。',
    charge: '充电源提供能量，同一组示踪点沿原路返回。',
    limit: '到达可用容量端点，模型控制器断流，停止继续充入。',
  };
  const reset = () => {
    setSoc(85);
    setRate(1);
    setTime(600);
    setMode('discharge');
    setView('paths');
    resetKeySet((k) => k + 1);
  };
  return (
    <section
      className="lb-study"
      data-watch={film.watch}
      data-compact={compact}
      data-lb-view={shot.view}
    >
      <div className="lb-heading">{t('石墨 / LFP · 1 Ah 教学电芯')}</div>
      {!film.watch && (
        <p className="lb-statement">
          {t(
            !film.watch && shot.view === 'limit'
              ? '电能在储存、外部功和内部热之间结算。'
              : statements[shot.view],
          )}
        </p>
      )}
      <div className="lb-body" ref={body}>
        {!onlyEvidence && (
          <>
            <div className="lb-device-label">
              {t(
                shot.state.current < 0
                  ? '充电源'
                  : shot.state.current > 0
                    ? '外部负载'
                    : '外部电流为零',
              )}
            </div>
            <LithiumBatteryStudio
              key={`${compact}-${resetKey}`}
              shot={shot}
              width={width}
              compact={compact}
            />
            <div className="lb-layer-labels">
              <span>{t('石墨负极')}</span>
              <span>{t('隔膜')}</span>
              <span>{t('LFP 正极')}</span>
            </div>
          </>
        )}
        {compact && shot.view === 'separator' && (
          <LithiumBatteryFlat shot={shot} width={width} detail />
        )}
        {shot.view === 'inventory' ? (
          <LithiumInventory shot={shot} width={width} />
        ) : shot.view === 'power' ? (
          <LithiumPower shot={shot} width={width} />
        ) : shot.view === 'rest' ? (
          <LithiumRest shot={shot} width={width} />
        ) : shot.view === 'limit' ? (
          <>
            <div className="lb-cutoff">
              <b>{(shot.state.soc * 100).toFixed(1)}% SOC</b>
              <span>
                {t(
                  shot.state.cutoff
                    ? '模型控制器已断流'
                    : shot.state.current < 0
                      ? '仍在充入'
                      : shot.state.current > 0
                        ? '仍在输出'
                        : '外部电流为零',
                )}
              </span>
            </div>
            <LithiumLedger
              shot={shot}
              width={width}
              initialSoc={film.watch ? 0.85 : initialSoc / 100}
            />
          </>
        ) : null}
        {shot.view !== 'limit' &&
          shot.view !== 'rest' &&
          (!film.watch || !['layers', 'separator'].includes(shot.view)) && (
            <div className="lb-readings">
              <span>
                {t(shot.view === 'power' ? '端口功率' : '荷电状态')}
                <b>
                  {shot.view === 'power'
                    ? `${v.terminalPower.toFixed(2)} W`
                    : `${(shot.state.soc * 100).toFixed(1)}%`}
                </b>
              </span>
              <span>
                {t(shot.view === 'power' ? '内部发热' : '端电压')}
                <b>
                  {shot.view === 'power'
                    ? `${v.heatPower.toFixed(3)} W`
                    : `${v.voltage.toFixed(3)} V`}
                </b>
              </span>
            </div>
          )}
        {!film.watch && (
          <p className="lb-key">
            {t(
              shot.view === 'rest'
                ? '虚线是同一 SOC 的开路近似。没有凭空补回电量。'
                : shot.view === 'limit'
                  ? 'Wh 是能量，Ah 是电荷容量。这里都从同一状态积分。'
                  : '金色 Li⁺，蓝色 e⁻；示踪点不表示真实粒子数量或速度。',
            )}
          </p>
        )}
      </div>
      {!film.watch && (
        <div className="lb-explore">
          <div className="lb-options" role="group" aria-label={t('选择电芯过程')}>
            {(
              [
                ['discharge', '放电'],
                ['charge', '充电'],
                ['rest', '负载后休息'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={mode === id}
                onClick={() => {
                  setMode(id);
                  setTime(id === 'rest' ? 120 : 600);
                }}
              >
                {t(label)}
              </button>
            ))}
          </div>
          {mode !== 'rest' && (
            <div className="lb-options" role="group" aria-label={t('选择电芯观察内容')}>
              {(
                [
                  ['paths', '载流路径'],
                  ['inventory', '锂的库存'],
                  ['power', '压降与热'],
                  ['limit', '能量账目'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>
                  {t(label)}
                </button>
              ))}
            </div>
          )}
          <Range
            label={t('初始荷电状态')}
            value={initialSoc}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={setSoc}
          />
          <Range
            label={t('电流大小')}
            value={rate}
            min={0}
            max={2.5}
            step={0.25}
            unit="A"
            onChange={setRate}
          />
          <Range
            label={t(mode === 'rest' ? '休息时间' : '过程时间')}
            value={time}
            min={0}
            max={mode === 'rest' ? 300 : 3600}
            step={1}
            unit="s"
            onChange={setTime}
          />
          <button className="lb-reset" onClick={reset}>
            {t('恢复电芯初始状态')}
          </button>
          <p className="lb-key">
            {t('每次改动都从所选初态重建。休息模式先施加 120 秒放电，再断流。')}
          </p>
        </div>
      )}
      <details className="lb-notes">
        <summary>{t('电芯模型与真实电池')}</summary>
        <div>
          <p>
            {t(
              '采用石墨 / 磷酸铁锂体系：负极 LiₓC₆，正极 LiᵧFePO₄。平均化学计量取 x = 0.05 + 0.9 SOC，y = 0.95 − 0.9 SOC，两个宿主容量匹配。',
            )}
          </p>
          <p>
            {t(
              'SOC 的零点和满点是本模型的可用窗口；零点仍有锂。正常石墨储锂是嵌入宿主，不是把负极画成金属锂。',
            )}
          </p>
          <p>
            {t(
              '电解液与隔膜孔道传导离子，电子经电极导电网络、铜和铝集流体及外部装置传输。局部电中性、盐阴离子运动和电解液库存被平均处理。示踪路径是可逆的教学映射，不是分子轨迹、浓度场或电子漂移速度计算。',
            )}
          </p>
          <p>
            {t(
              '用一个随 SOC 变化的教学开路电压源、串联内阻和一个被动 RC 支路表示端口行为。开路曲线不是商用电芯拟合；RC 是等效极化状态，不是电芯里真的装了一只电容。',
            )}
          </p>
          <p>
            V = U(SOC) − IR₀ − p<br />
            dSOC/dt = −I/Q
            <br />
            dp/dt = (I − p/Rₚ)/Cₚ
          </p>
          <p>
            {t(
              '可逆储能由 Q∫U dSOC 计算；暂存项为 Cₚp²/2，内部热功率为 I²R₀ + p²/Rₚ。温度固定，热量计入环境；省略熵热、老化、副反应、锂析出、相变与空间扩散。',
            )}
          </p>
          <p>
            {t(
              '示例使用 1 Ah、R₀ = 0.04 Ω、Rₚ = 0.03 Ω、时间常数 45 秒。控制器在 SOC 端点或示例电压边界断流；没有模拟真实恒流恒压充电策略，也不提供充电参数建议。',
            )}
          </p>
          <p>
            {t(
              '电芯厚度、孔和粒子被放大以便观察，结构不是制造图。影片加速物理时间，所有章与拖动位置都由共享进度直接重建。',
            )}
          </p>
        </div>
      </details>
    </section>
  );
}
