import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import CmosCircuit, { CmosCascadeCircuit } from '../lab/CmosCircuit';
import {
  CMOS_THRESHOLDS,
  cmosCascade,
  cmosCrossings,
  cmosManualDefaults,
  cmosManualTrace,
  cmosReset,
  cmosSample,
  cmosShot,
  type CmosBit,
  type CmosKind,
  type CmosShot,
} from '../../models/logic-gates';
import '../../styles/logic-gates.css';

const titles = [
  '低输入接通上拉路径',
  '高输入接通下拉路径',
  '与非门：下拉必须串通',
  '或非门：一条下拉就够',
  '电压要穿过中间区域',
  '更大的负载需要更久',
  '变化沿两级电路传播',
  '一次翻转，能量去了哪里',
];
const names: Record<CmosKind, string> = { inverter: '反相器', nand: '与非门', nor: '或非门' };
const fmt = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
function VoltageProof({ shot }: { shot: CmosShot }) {
  const { trace, sample, second } = shot,
    p = trace.parameters;
  const values = useMemo(
    () =>
      Array.from({ length: 241 }, (_, i) => {
        const time = (i * trace.duration) / 240;
        return {
          time,
          first: cmosSample(trace, time).voltage,
          second: second ? cmosSample(second, time).voltage : 0,
        };
      }),
    [trace, second],
  );
  const x = (time: number) => 8 + (time / trace.duration) * 284,
    y = (v: number) => 105 - (v / p.vdd) * 96;
  const path = (which: 'first' | 'second') =>
    values.map((v, i) => `${i ? 'L' : 'M'}${x(v.time)},${y(v[which])}`).join(' ');
  return (
    <div className="cmos-proof">
      <div className="cmos-proof-legend">
        <span>
          {second ? 'Y₁' : 'Y'} · {t('实际输出电压')}
        </span>
        <span className="cmos-unknown">X · {t('未保证的逻辑区域')}</span>
        {second && <span className="cmos-second">Y₂</span>}
      </div>
      <svg
        viewBox="0 0 300 118"
        role="img"
        aria-label={t('输出电压穿过低电平、未定义区域和高电平；曲线来自同一个 RC 模型')}
      >
        <rect
          x="8"
          y={y(p.vdd * CMOS_THRESHOLDS.high)}
          width="284"
          height={96 * (CMOS_THRESHOLDS.high - CMOS_THRESHOLDS.low)}
          rx="3"
          fill="#eee4cd"
        />
        {[0, 0.3, 0.7, 1].map((v) => (
          <path
            key={v}
            d={`M8 ${y(p.vdd * v)}H292`}
            stroke="#b8c7c9"
            strokeDasharray={v && v !== 1 ? '3 4' : undefined}
          />
        ))}
        {trace.events.slice(1).map((e) => (
          <path key={e.at} d={`M${x(e.at)} 5V110`} stroke="#c7cec9" strokeDasharray="3 5" />
        ))}
        {(shot.focus === 'threshold' || second) &&
          cmosCrossings(trace).map((c) => (
            <circle key={c.at} cx={x(c.at)} cy={y(p.vdd / 2)} r="4" fill="#9e774b" />
          ))}
        <path d={path('first')} fill="none" stroke="#4c8795" strokeWidth="2.7" />
        {second && <path d={path('second')} fill="none" stroke="#9273a7" strokeWidth="2.7" />}
        <path d={`M${x(sample.time)} 4V111`} stroke="#5a7179" strokeWidth="1.3" />
        <circle cx={x(sample.time)} cy={y(sample.voltage)} r="3.5" fill="#4c8795" />
        {shot.secondSample && (
          <circle cx={x(sample.time)} cy={y(shot.secondSample.voltage)} r="3.5" fill="#9273a7" />
        )}
      </svg>
      <div className="cmos-axis">
        <span>0 … {p.vdd} V</span>
        <span>0 … {fmt(trace.duration * 1e12, 0)} ps</span>
      </div>
    </div>
  );
}
function CmosEvidence({ shot }: { shot: CmosShot }) {
  const s = shot.sample,
    p = shot.trace.parameters;
  if (shot.focus === 'energy') {
    const total = p.capacitance * p.vdd ** 2;
    return (
      <div className="cmos-energy">
        <div>
          {t('本次电源供能')} <b>{fmt(s.sourceEnergy * 1e15)} fJ</b>
        </div>
        <div className="cmos-energy-bar">
          <span style={{ width: `${(s.energy / total) * 100}%`, background: '#a591b6' }} />
          <span style={{ width: `${(s.heatEnergy / total) * 100}%`, background: '#bc956a' }} />
        </div>
        <div className="cmos-energy-key">
          <span>
            {t('电容储能')} {fmt(s.energy * 1e15)} fJ
          </span>
          <span>
            {t('沟道热耗')} {fmt(s.heatEnergy * 1e15)} fJ
          </span>
        </div>
      </div>
    );
  }
  if (shot.secondSample)
    return (
      <div className="cmos-cascade-values">
        <span>
          Y₁ {fmt(s.voltage)} V · <b>{s.level}</b>
        </span>
        <span>
          Y₂ {fmt(shot.secondSample.voltage)} V · <b>{shot.secondSample.level}</b>
        </span>
        <span>
          {t('模型切换界线')} {fmt(p.vdd * 0.5)} V
        </span>
      </div>
    );
  const crossing = cmosCrossings(shot.trace)[0];
  return (
    <div className="cmos-evidence">
      <span>
        R<sub>eq</sub> {fmt(s.network.resistance / 1000, 1)} kΩ · C {fmt(p.capacitance * 1e15, 0)}{' '}
        fF
      </span>
      <strong>
        {shot.focus === 'threshold' || shot.focus === 'load'
          ? crossing
            ? `${fmt(crossing.at * 1e12, 1)} ps`
            : t('窗口内未跨越')
          : `${fmt(Math.abs(s.network.current) * 1e6, 1)} µA`}
      </strong>
      <span>
        {t(
          shot.focus === 'threshold' || shot.focus === 'load'
            ? '跨过一半电源电压的时间'
            : '当前输出充放电电流',
        )}
      </span>
    </div>
  );
}
export default function LogicGates() {
  const showcase = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [manual, setManual] = useState(cmosManualDefaults);
  const manualTrace = useMemo(
    () => cmosManualTrace(manual),
    [manual.kind, manual.parameters, manual.before, manual.after],
  );
  const nextTrace = useMemo(
    () => (manual.cascade ? cmosCascade(manualTrace) : undefined),
    [manualTrace, manual.cascade],
  );
  const directed = useMemo(
    () => cmosShot(showcase.chapter, showcase.chapterProgress),
    [showcase.chapter, showcase.chapterProgress],
  );
  const shot: CmosShot = showcase.watch
    ? directed
    : {
        focus: manual.cascade ? 'cascade' : 'threshold',
        trace: manualTrace,
        sample: cmosSample(manualTrace, manual.time * manualTrace.duration),
        second: nextTrace,
        secondSample: nextTrace
          ? cmosSample(nextTrace, manual.time * manualTrace.duration)
          : undefined,
        variant: 0,
      };
  const s = shot.sample,
    chapter = Math.max(0, Math.min(7, showcase.chapter));
  const toggle = (when: 'before' | 'after', index: 0 | 1) =>
    setManual((v) => {
      const next = [...v[when]] as [CmosBit, CmosBit];
      next[index] = next[index] ? 0 : 1;
      return { ...v, [when]: next };
    });
  return (
    <section
      className="cmos-scene"
      data-watch={showcase.watch}
      aria-label={t('从晶体管通路到逻辑电平的 CMOS 电路')}
    >
      <div className="cmos-film">
        <div className="cmos-heading">
          <h2>{t(showcase.watch ? titles[chapter] : '检查输入变化后的电压')}</h2>
          <span className="cmos-desktop-only">CMOS · {t('过程慢放')}</span>
        </div>
        <div className="cmos-state">
          <span>
            {t(names[shot.trace.kind])} · A {s.inputs[0]}
            {shot.trace.kind !== 'inverter' ? ` · B ${s.inputs[1]}` : ''}
          </span>
          <span>
            Y {fmt(s.voltage)} V <b className={s.level === 'X' ? 'is-unknown' : ''}>{s.level}</b>
          </span>
        </div>
        <div className="cmos-device-types">
          <span>{t('pMOS 上拉')}</span>
          <span>{t('nMOS 下拉')}</span>
        </div>
        {shot.second ? (
          <CmosCascadeCircuit shot={shot} compact={compact} />
        ) : (
          <CmosCircuit shot={shot} compact={compact} />
        )}
        <div className="cmos-instruments">
          <VoltageProof shot={shot} />
          <CmosEvidence shot={shot} />
        </div>
        <div className="cmos-note">
          <span>{t('沟道实线表示接通，栅极与沟道绝缘')}</span>
          <span>{t('模型：互补开关与 RC')}</span>
        </div>
      </div>
      {!showcase.watch && (
        <div className="cmos-explore">
          <p>
            {t(
              '先设定起始和切换后的输入，再拖动时间。逻辑目标会改变，电容电压保持连续；X 区域不应当作可靠的 0 或 1。',
            )}
          </p>
          <div className="cmos-buttons">
            {(['inverter', 'nand', 'nor'] as const).map((kind) => (
              <button
                type="button"
                key={kind}
                aria-pressed={manual.kind === kind}
                onClick={() => setManual((v) => ({ ...v, kind, cascade: false }))}
              >
                {t(names[kind])}
              </button>
            ))}
          </div>
          <div className="cmos-input-pairs">
            {(['before', 'after'] as const).map((when) => (
              <div key={when}>
                <span>{t(when === 'before' ? '起始输入' : '切换后的输入')}</span>
                <div className="cmos-buttons">
                  {([0, 1] as const).map((index) => (
                    <button
                      type="button"
                      key={index}
                      disabled={index === 1 && manual.kind === 'inverter'}
                      aria-pressed={manual[when][index] === 1}
                      aria-label={`${t(when === 'before' ? '起始输入' : '切换后的输入')} ${index ? 'B' : 'A'}`}
                      onClick={() => toggle(when, index)}
                    >
                      {index ? 'B' : 'A'} {manual[when][index]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="cmos-controls">
            <div>
              <div>
                <label htmlFor={`${id}-time`}>{t('CMOS 取样时间')}</label>
                <output>{fmt(manual.time * manualTrace.duration * 1e12, 0)} ps</output>
              </div>
              <input
                id={`${id}-time`}
                aria-label={t('CMOS 取样时间')}
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={manual.time}
                onChange={(e) => setManual((v) => ({ ...v, time: Number(e.target.value) }))}
              />
            </div>
            <div>
              <div>
                <label htmlFor={`${id}-cap`}>{t('输出负载电容')}</label>
                <output>{fmt(manual.parameters.capacitance * 1e15, 0)} fF</output>
              </div>
              <input
                id={`${id}-cap`}
                aria-label={t('输出负载电容')}
                type="range"
                min="5"
                max="80"
                step="5"
                value={manual.parameters.capacitance * 1e15}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    parameters: { ...v.parameters, capacitance: Number(e.target.value) * 1e-15 },
                  }))
                }
              />
            </div>
            <div>
              <div>
                <label htmlFor={`${id}-resistance`}>{t('每只接通沟道的电阻')}</label>
                <output>{fmt(manual.parameters.resistanceN / 1000, 1)} kΩ</output>
              </div>
              <input
                id={`${id}-resistance`}
                aria-label={t('每只接通沟道的电阻')}
                type="range"
                min="2"
                max="20"
                step="0.5"
                value={manual.parameters.resistanceN / 1000}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    parameters: {
                      ...v.parameters,
                      resistanceP: Number(e.target.value) * 1000,
                      resistanceN: Number(e.target.value) * 1000,
                    },
                  }))
                }
              />
            </div>
            <div>
              <div>
                <label htmlFor={`${id}-supply`}>{t('CMOS 电源电压')}</label>
                <output>{fmt(manual.parameters.vdd, 1)} V</output>
              </div>
              <input
                id={`${id}-supply`}
                aria-label={t('CMOS 电源电压')}
                type="range"
                min="0.8"
                max="1.8"
                step="0.1"
                value={manual.parameters.vdd}
                onChange={(e) =>
                  setManual((v) => ({
                    ...v,
                    parameters: { ...v.parameters, vdd: Number(e.target.value) },
                  }))
                }
              />
            </div>
          </div>
          <div className="cmos-buttons">
            <button
              type="button"
              disabled={manual.kind !== 'inverter'}
              aria-pressed={manual.cascade}
              onClick={() => setManual((v) => ({ ...v, cascade: !v.cascade }))}
            >
              {t('连接下一级反相器')}
            </button>
            <button type="button" onClick={() => setManual(cmosReset())}>
              {t('重置 CMOS 实验')}
            </button>
          </div>
          <p>
            {t(
              '真实 MOSFET 取决于栅源电压与器件曲线。这里把它们简化成互补开关，省略漏电、导通重叠和内部节点电容；0.5 VDD 是模型切换界线，不是通用器件阈值。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
