import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import ElectricTransformerStudio from '../three/ElectricTransformerStudio';
import {
  ELECTRIC_TRANSFORMER as C,
  electricAC,
  electricDC,
  electricDefaults,
  electricInstant,
  electricShot,
  type ElectricShot,
} from '../../models/transformer-electric';
import '../../styles/transformer-electric.css';

const number = (n: number, digits = 2) =>
  (Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n).toFixed(digits);

function ElectricTraces({
  shot,
  width,
  manual,
}: {
  shot: ElectricShot;
  width: number;
  manual: boolean;
}) {
  const { ac, instant: s, dc } = shot;
  const inset = 12,
    plotWidth = Math.max(228, width - 2 * inset);
  const viewWidth = plotWidth + 2 * inset,
    end = dc ? (8 * C.magnetizingInductance) / C.dcSeriesResistance : 1 / ac.input.frequency;
  const fluxLimit = 1e-3,
    voltageLimit = manual || shot.chapter === 2 || shot.chapter === 4 ? 12 : 3;
  const rows = useMemo(() => {
    const samples = Array.from({ length: 181 }, (_, i) =>
      dc
        ? electricDC((i / 180) * end, ac.input.secondaryTurns)
        : electricInstant(ac, (i / 180) * 2 * Math.PI),
    );
    return [samples.map((p) => p.flux), samples.map((p) => p.v2)];
  }, [dc, end, ac]);
  const cursor = dc
    ? Math.max(0, Math.min(1, shot.dcTime / end))
    : (((shot.phase / (Math.PI * 2)) % 1) + 1) % 1;
  const labels = [
      t(!manual && width < 320 ? '磁通 Φ' : '共用磁通 Φ'),
      t(!manual && width < 320 ? '端电压 v₂' : '次级端电压 v₂'),
    ],
    units = ['mWb', 'V'];
  return (
    <div className="electric-traces" aria-label={t('磁通与电压共用同一物理时间轴')}>
      {[0, 1].map((row) => {
        const limit = row ? voltageLimit : fluxLimit,
          value = row ? s.v2 : s.flux * 1000;
        const path = rows[row]
          .map(
            (v, i) =>
              `${i ? 'L' : 'M'}${(inset + (i / 180) * plotWidth).toFixed(2)},${(51 - (v / limit) * 37).toFixed(2)}`,
          )
          .join(' ');
        const currentY = 51 - ((row ? s.v2 : s.flux) / limit) * 37;
        return (
          <div className={`electric-trace electric-trace-${row}`} key={row}>
            <div className="electric-trace-heading">
              <span>{labels[row]}</span>
              <strong>
                {number(value, row ? 2 : 3)} <small>{units[row]}</small>
              </strong>
            </div>
            <svg
              viewBox={`0 0 ${viewWidth} 101`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${labels[row]}: ${number(value, 3)} ${units[row]}`}
            >
              {[14, 51, 88].map((y) => (
                <path
                  key={y}
                  d={`M${inset} ${y}H${inset + plotWidth}`}
                  className={y === 51 ? 'electric-zero' : 'electric-grid'}
                />
              ))}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <path key={p} d={`M${inset + p * plotWidth} 10V93`} className="electric-grid" />
              ))}
              <path d={path} className="electric-wave" />
              {(!dc || shot.dcTime >= 0) && (
                <>
                  <path d={`M${inset + cursor * plotWidth} 8V94`} className="electric-cursor" />
                  <circle
                    cx={inset + cursor * plotWidth}
                    cy={currentY}
                    r="4.5"
                    className="electric-trace-dot"
                  />
                </>
              )}
            </svg>
            <div className="electric-axis">
              <span>
                ±{row ? voltageLimit : '1.0'} {units[row]}
              </span>
              <span>0 → {number(end * 1000, 1)} ms</span>
            </div>
          </div>
        );
      })}
      <div className="electric-relation">
        <span>
          {shot.input.losses && shot.input.connected ? 'v₂ + i₂R₂ = N₂ · dΦ/dt' : 'v₂ = N₂ · dΦ/dt'}
        </span>
        <span>
          {dc
            ? t('静态磁通不持续感应电压')
            : Math.abs(s.v2) < ac.secondaryVoltageRms * 0.015
              ? t('磁通在峰顶，斜率为零')
              : Math.abs(s.flux) < ac.fluxPeak * 0.015
                ? t('磁通过零，变化最快')
                : t('看斜率，而不只看高度')}
        </span>
      </div>
    </div>
  );
}

function ElectricPower({ shot }: { shot: ElectricShot }) {
  const a = shot.ac,
    total = a.inputWatts || 1;
  return (
    <div className="electric-power">
      <div className="electric-power-head">
        <span>{t('周期平均有功功率')}</span>
        <strong>
          {number(a.inputWatts, 3)} W → {number(a.outputWatts, 3)} W
        </strong>
      </div>
      <div
        className="electric-power-ribbon"
        role="img"
        aria-label={t('输入功率等于负载功率、铜损和铁损之和')}
      >
        <i style={{ flexGrow: a.outputWatts / total }} />
        <i style={{ flexGrow: a.copperWatts / total }} />
        <i style={{ flexGrow: a.coreWatts / total }} />
      </div>
      <div className="electric-power-legend">
        <span>
          <i />
          {t('电阻负载')} {number(a.outputWatts, 3)} W
        </span>
        <span>
          <i />
          {t('绕组铜损')} {number(a.copperWatts, 3)} W
        </span>
        <span>
          <i />
          {t('铁芯损耗')} {number(a.coreWatts, 3)} W
        </span>
      </div>
    </div>
  );
}

export default function ElectricTransformer() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    id = useId();
  const [viewVersion, setViewVersion] = useState(0);
  const [width, setWidth] = useState(760),
    [turns, setTurns] = useState(12),
    [frequency, setFrequency] = useState(50);
  const [load, setLoad] = useState(12),
    [connected, setConnected] = useState(true),
    [losses, setLosses] = useState(false);
  const [dc, setDC] = useState(false),
    [phase, setPhase] = useState(0.125),
    [dcTime, setDCTime] = useState(0);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // Exploration is deliberately hand-scrubbed: no second clock runs behind the player.
  const automatic = electricShot(film.chapter, film.chapterProgress);
  const manualInput = {
    ...electricDefaults,
    secondaryTurns: turns,
    frequency,
    loadOhms: load,
    connected: connected && !dc,
    losses: losses && !dc,
  };
  const manualAC = electricAC(manualInput);
  const shot: ElectricShot = film.watch
    ? automatic
    : {
        ...automatic,
        input: manualInput,
        ac: manualAC,
        phase: phase * 2 * Math.PI,
        dc,
        dcTime,
        instant: dc ? electricDC(dcTime, turns) : electricInstant(manualAC, phase * 2 * Math.PI),
        coilOpacity: 1,
        fieldFocus: 0,
        laminationFocus: 0,
        showPower: !dc,
        showLosses: losses && !dc,
      };
  const narrow = width < 600,
    a = shot.ac;
  return (
    <div
      className="electric-transformer"
      ref={host}
      data-dc={shot.dc}
      data-losses={shot.showLosses}
      data-side={width >= 760}
      data-watch={film.watch}
      data-power={shot.showPower}
      data-load-focus={film.watch && shot.chapter === 3}
    >
      <div className="electric-kicker">
        <span>{t('一个磁路 · 两个电路')}</span>
        <span>
          {shot.dc
            ? t('直流接通瞬态')
            : `${number(shot.input.frequency, 0)} Hz · ${t('慢动作观察')}`}
        </span>
      </div>
      <div className="electric-visuals">
        <div className="electric-object">
          <ElectricTransformerStudio
            key={`${narrow}-${film.run}-${viewVersion}`}
            shot={shot}
            narrow={narrow}
          />
        </div>
        {narrow && film.watch && shot.chapter === 3 && (
          <div className="electric-load-current" aria-label={t('输入电流')}>
            <span>
              I₁ <b>{number(a.primaryRms * 1000, 1)}</b>
            </span>
            <span>
              I₂ <b>{number(a.secondaryRms * 1000, 1)}</b>
            </span>
            <span>mA RMS</span>
          </div>
        )}
        <div className="electric-terminals">
          <div>
            <span>
              {!(narrow && film.watch) && <>{t('初级绕组')} · </>}N₁ = {C.primaryTurns}
            </span>
            <strong>
              {shot.dc
                ? `${number(shot.instant.v1)} V DC`
                : `${number(shot.input.voltageRms)} V RMS`}
            </strong>
            <small>
              {shot.dc
                ? `${t('串联限流')} 128 Ω`
                : `${narrow && film.watch ? 'I₁' : t('输入电流')} ${number(a.primaryRms, 3)} A RMS`}
            </small>
          </div>
          <div>
            <span>
              {!(narrow && film.watch) && <>{t('次级绕组')} · </>}N₂ = {shot.input.secondaryTurns}
            </span>
            <strong>
              {shot.dc
                ? `${number(shot.instant.v2, 3)} V`
                : `${number(a.secondaryVoltageRms)} V RMS`}
            </strong>
            <small>
              {shot.input.connected && !shot.dc
                ? narrow && film.watch
                  ? `I₂ ${number(a.secondaryRms, 3)} A RMS · ${number(shot.input.loadOhms, 0)} Ω`
                  : `${t('电阻负载')} ${number(shot.input.loadOhms, 0)} Ω · ${number(a.secondaryRms, 3)} A RMS`
                : t(narrow && film.watch ? '开路 · I₂ = 0' : '次级开路，负载电流为零')}
            </small>
          </div>
        </div>
        {(!narrow || !film.watch || !shot.showPower) && (
          <ElectricTraces
            shot={shot}
            width={width >= 760 ? width / 2.35 - 40 : width - (narrow ? 24 : 48)}
            manual={!film.watch}
          />
        )}
      </div>
      {shot.showPower && <ElectricPower shot={shot} />}
      {!film.watch && (
        <div className="electric-explore">
          <fieldset>
            <legend>{t('供电方式')}</legend>
            <div className="electric-segments">
              <button aria-pressed={!dc} onClick={() => setDC(false)}>
                {t('持续交流')}
              </button>
              <button
                aria-pressed={dc}
                onClick={() => {
                  setDC(true);
                  setDCTime(0);
                }}
              >
                {t('接通直流')}
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>{t('次级匝数')}</legend>
            <div className="electric-segments">
              {[12, 24, 48].map((n) => (
                <button key={n} aria-pressed={turns === n} onClick={() => setTurns(n)}>
                  {n} {t('匝')}
                </button>
              ))}
            </div>
          </fieldset>
          {dc ? (
            <label className="electric-range" htmlFor={`${id}-dc`}>
              <span>
                {t('接通后的物理时间')} <output>{number(dcTime * 1000, 1)} ms</output>
              </span>
              <input
                id={`${id}-dc`}
                type="range"
                min="0"
                max={(8 * C.magnetizingInductance) / C.dcSeriesResistance}
                step="0.0001"
                value={dcTime}
                onChange={(e) => setDCTime(Number(e.target.value))}
              />
            </label>
          ) : (
            <>
              <label className="electric-range" htmlFor={`${id}-phase`}>
                <span>
                  {t('沿一个周期观察')} <output>{number(phase * 360, 0)}°</output>
                </span>
                <input
                  id={`${id}-phase`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.0025"
                  value={phase}
                  onChange={(e) => setPhase(Number(e.target.value))}
                />
              </label>
              <label className="electric-range" htmlFor={`${id}-frequency`}>
                <span>
                  {t('交流频率')} <output>{frequency} Hz</output>
                </span>
                <input
                  id={`${id}-frequency`}
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                />
              </label>
              <label className="electric-range" htmlFor={`${id}-load`}>
                <span>
                  {t('负载电阻')} <output>{load} Ω</output>
                </span>
                <input
                  id={`${id}-load`}
                  type="range"
                  min="4"
                  max="192"
                  step="1"
                  value={load}
                  onChange={(e) => setLoad(Number(e.target.value))}
                />
              </label>
              <div className="electric-options">
                <button aria-pressed={connected} onClick={() => setConnected(!connected)}>
                  {t(connected ? '断开负载' : '接通负载')}
                </button>
                <button aria-pressed={losses} onClick={() => setLosses(!losses)}>
                  {t(losses ? '已计入铜损与铁损' : '加入铜损与铁损')}
                </button>
              </div>
            </>
          )}
          <button
            className="electric-reset"
            onClick={() => {
              setViewVersion((v) => v + 1);
              setTurns(12);
              setFrequency(50);
              setLoad(12);
              setConnected(true);
              setLosses(false);
              setDC(false);
              setPhase(0.125);
              setDCTime(0);
            }}
          >
            {t('重置变压器实验')}
          </button>
        </div>
      )}
      <details className="electric-notes">
        <summary>{t('极性、时间与模型边界')}</summary>
        {shot.showLosses && (
          <p>{t('叠片抑制涡流；磁滞与铜损仍然存在。颜色表示损耗位置，不是温度。')}</p>
        )}
        <p>
          {t(
            '黑点是同名端。端电压从黑点量向另一端；初级电流流入黑点，次级负载电流流出黑点。沿绕线方向的感应电动势 e = −N dΦ/dt。',
          )}
        </p>
        <p>
          {t(
            '曲线横轴是物理毫秒，影片放慢观察。调整匝数、频率或负载展示一组稳态，不模拟这些调整过程的暂态。直流段单独求解限流 RL 暂态。',
          )}
        </p>
        <p>
          {t(
            '理想功率对照忽略励磁与损耗；其余交流段保留励磁电感。铁损用等效电阻合并表示，不计算材料磁滞回线、饱和、漏磁或温升。',
          )}
        </p>
        <div className="electric-equations">
          <span>E₂ / E₁ = N₂ / N₁</span>
          <span>N₁I₁,load = N₂I₂</span>
          <span>Pᵢₙ = Pload + Pcu + Pcore</span>
          <span>
            {shot.dc ? 'B' : 'Bpeak'} = {number(shot.dc ? shot.instant.b : a.bPeak, 3)} T
          </span>
        </div>
        {shot.dc && (
          <p>
            {t(
              '直流实验的 128 Ω 是外加限流电阻与绕组电阻之和；次级保持开路。它不预测未经限流的真实变压器接直流后的饱和与过热。',
            )}
          </p>
        )}
      </details>
    </div>
  );
}
