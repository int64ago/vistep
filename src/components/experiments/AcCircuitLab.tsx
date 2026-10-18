import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Segments, Range } from '../lab/Controls';
import {
  sinusoidalCircuit,
  capacitorCharging,
  generatorLeds,
  lcOscillation,
  acShot,
  type AcApparatus,
} from '../../models/ac-circuit-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/ac-circuit-lab.css';
const options = [
  { value: 'scope', label: '电源与示波器' },
  { value: 'led', label: '手摇发电机与双色LED' },
  { value: 'inductor', label: '线圈与交流灯泡' },
  { value: 'capacitor', label: '电容与交流灯泡' },
  { value: 'lc', label: 'LC振荡与电压传感器' },
] as const;
const initial = (v?: string): AcApparatus =>
  v?.includes('led')
    ? 'led'
    : v?.includes('inductive')
      ? 'inductor'
      : v?.includes('capacitive')
        ? 'capacitor'
        : v?.includes('lc-')
          ? 'lc'
          : 'scope';
const coil = (x: number, y: number, w: number, h: number) =>
  Array.from({ length: 241 }, (_, i) => {
    const q = i / 240;
    return `${i ? 'L' : 'M'}${x + w * q + 4 * Math.cos(q * 16 * Math.PI)} ${y + h * Math.sin(q * 16 * Math.PI)}`;
  }).join(' ');
export default function AcCircuitLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [apparatus, setApparatus] = useState<AcApparatus>(() => initial(film.variant)),
    [source, setSource] = useState('ac'),
    [frequency, setFrequency] = useState(50),
    [phase, setPhase] = useState(0.2),
    [L, setL] = useState(0.04),
    [C, setC] = useState(100),
    [lcPhase, setLcPhase] = useState(0.2),
    [loss, setLoss] = useState(1),
    [chargingTime, setChargingTime] = useState(0.0008);
  const inductance = film.watch ? 0.04 : L,
    capacitance = (film.watch ? 100 : C) * 1e-6,
    resistance = film.watch ? 1 : loss;
  const shot = film.watch
    ? acShot(film.chapter, film.chapterProgress)
    : {
        apparatus,
        dc: source === 'dc',
        frequency,
        phase: phase * 2 * Math.PI,
        charging: false,
        lcTime: lcPhase * 2 * Math.PI * Math.sqrt(0.2 * 0.001),
        stage: -1,
      };
  const kind = shot.apparatus === 'inductor' ? 'inductor' : 'capacitor',
    circuit = sinusoidalCircuit(
      kind,
      shot.frequency,
      kind === 'inductor' ? inductance : capacitance,
      shot.phase,
      shot.dc,
    ),
    led = generatorLeds(shot.phase),
    lc = lcOscillation(shot.lcTime, 0.2, 0.001, resistance),
    charge = capacitorCharging(
      film.watch ? (shot.phase / (6 * Math.PI)) * 36 * capacitance : chargingTime,
      capacitance,
    );
  const isLc = shot.apparatus === 'lc',
    isReactive = shot.apparatus === 'inductor' || shot.apparatus === 'capacitor';
  const voltage = isLc
    ? lc.voltage
    : shot.apparatus === 'led'
      ? led.voltage
      : shot.dc
        ? 3
        : 3 * Math.SQRT2 * Math.sin(shot.phase);
  const current = isLc
    ? lc.current
    : shot.apparatus === 'led'
      ? led.forward - led.reverse
      : shot.apparatus === 'capacitor' && shot.dc
        ? charge.current
        : circuit.current;
  const power = shot.apparatus === 'capacitor' && shot.dc ? charge.lampPower : circuit.lampPower;
  const trace = Array.from({ length: 181 }, (_, i) => {
    const q = i / 180,
      v = isLc
        ? shot.charging
          ? 5
          : lcOscillation(q * (shot.stage === 11 ? 10 : 3) * lc.period, 0.2, 0.001, resistance)
              .voltage
        : shot.dc
          ? 3
          : 3 * Math.SQRT2 * Math.sin(q * 0.06 * 2 * Math.PI * shot.frequency);
    return `${i ? 'L' : 'M'}${27 + q * 306} ${62 - v * 9}`;
  }).join(' ');
  return (
    <div className="textbook-em ac-circuit-lab" data-watch={film.watch}>
      <div className="textbook-em-state">
        <span>{t(options.find((x) => x.value === shot.apparatus)!.label)}</span>
        <span>
          {isLc
            ? `T₀ = ${(lc.period * 1000).toFixed(1)} ms`
            : shot.apparatus === 'led'
              ? t('两个方向分别发光')
              : shot.dc
                ? 'DC · 3 V'
                : `AC · 3 V RMS · ${shot.frequency} Hz`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox={isLc ? '0 66 360 184' : '0 20 360 240'}
        role="img"
        aria-label={t('电源、元件和测量电路与同一波形同步')}
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#e9c566" />
            <stop offset="1" stopColor="#e9c566" stopOpacity="0" />
          </radialGradient>
        </defs>
        {shot.apparatus === 'scope' && (
          <>
            <rect x="35" y="73" width="92" height="133" rx="14" fill="#dfe7d5" stroke="#b5c5a9" />
            <rect x="48" y="89" width="66" height="36" rx="5" fill="#f6f7ed" />
            <text x="81" y="114" textAnchor="middle">
              {shot.dc ? '3 V' : '~ 3 V'}
            </text>
            <circle cx="60" cy="176" r="5" fill="#b69760" />
            <circle cx="102" cy="176" r="5" fill="#779573" />
            <path
              d="M60 176V240H247V208M102 176V224H279V208"
              fill="none"
              stroke="#879d7a"
              strokeWidth="2"
            />
            <rect x="169" y="79" width="164" height="129" rx="14" fill="#cbd9c1" stroke="#a9bda0" />
            <rect x="181" y="91" width="140" height="87" rx="7" fill="#f3f6e9" />
            <path d="M188 137H312M250 98V172" stroke="#d2dfc7" />
            <path
              d={Array.from(
                { length: 121 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${188 + i} ${137 - (shot.dc ? 3 : 3 * Math.SQRT2 * Math.sin((i / 120) * 0.04 * 2 * Math.PI * shot.frequency - shot.phase)) * 7}`,
              ).join(' ')}
              stroke="#7c9a71"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="196" cy="192" r="4" fill="#a0b393" />
            <circle cx="211" cy="192" r="4" fill="#a0b393" />
          </>
        )}
        {shot.apparatus === 'led' && (
          <>
            <rect x="55" y="58" width="32" height="91" rx="8" fill="#9bbca7" />
            <rect x="157" y="58" width="32" height="91" rx="8" fill="#c5a26b" />
            <g transform={`translate(122 103) scale(${Math.cos(led.angle)} 1)`}>
              <path
                d="M-6 41H-30V-41H30V41H6M-6 41V63H0M6 41V77H0"
                fill="none"
                stroke="#b4945e"
                strokeWidth="3"
              />
            </g>
            <path d="M122 64V38H145M122 144V181" stroke="#849e7b" strokeWidth="3" />
            <ellipse
              cx="122"
              cy="166"
              rx="17"
              ry="5"
              stroke="#b19661"
              strokeWidth="3"
              fill="none"
            />
            <ellipse
              cx="122"
              cy="180"
              rx="17"
              ry="5"
              stroke="#b19661"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M139 166H230V99H264M139 180H211V232H304V99H292M230 166H264M292 166H304"
              stroke="#8da180"
              fill="none"
              strokeWidth="2"
            />
            <circle
              cx="278"
              cy="99"
              r="25"
              fill="#d7aa6b"
              opacity={Math.min(0.8, led.forward * 36)}
            />
            <circle
              cx="278"
              cy="166"
              r="25"
              fill="#7fa17b"
              opacity={Math.min(0.8, led.reverse * 36)}
            />
            <path
              d="M264 88l25 11-25 11Zm28 0v22M292 155l-25 11 25 11Zm-28 0v22"
              stroke="#8fa07f"
              fill="#dce5cf"
              strokeWidth="2"
            />
            <text x="122" y="226" textAnchor="middle">
              G
            </text>
          </>
        )}
        {isReactive && (
          <>
            <path
              d="M55 101H99M199 101H252V211H181M139 211H55V101"
              stroke="#92a681"
              strokeWidth="2.5"
              fill="none"
            />
            {kind === 'inductor' ? (
              <path d={coil(95, 101, 100, 21)} stroke="#b09055" strokeWidth="3" fill="none" />
            ) : (
              <>
                <path
                  d="M99 101H141M159 101H199M141 72V130M159 72V130"
                  stroke="#8fa685"
                  strokeWidth="4"
                />
                <text x="150" y="56" textAnchor="middle">
                  C
                </text>
              </>
            )}
            <circle
              cx="252"
              cy="157"
              r="33"
              fill={`url(#${id}-glow)`}
              opacity={Math.min(0.9, power / 1.8)}
            />
            <circle
              cx="252"
              cy="157"
              r="20"
              fill="#f2e4b5"
              fillOpacity={Math.min(1, 0.1 + power)}
              stroke="#b6a373"
            />
            <path d="M241 146l22 22m-22 0 22-22" stroke="#b3975e" strokeWidth="2" />
            <circle cx="160" cy="211" r="21" fill="#edf1e3" stroke="#9bae90" />
            <text x="160" y="217" textAnchor="middle">
              {shot.dc ? '=' : '~'}
            </text>
          </>
        )}
        {isLc && (
          <>
            <path
              d="M140 90H80V126M80 178V230H280V164M280 144V90H220M180 120V176M180 192V230"
              fill="none"
              stroke="#8fa783"
              strokeWidth="2.5"
            />
            <path
              d={coil(50, 152, 52, 17)}
              transform="rotate(90 80 152)"
              stroke="#b49355"
              strokeWidth="3"
              fill="none"
            />
            <path d="M155 176H205M155 192H205" stroke="#91a984" strokeWidth="4" />
            <path
              d={shot.charging ? 'M180 120L220 90' : 'M180 120L140 90'}
              stroke="#8ca27e"
              strokeWidth="2.5"
            />
            <circle cx="180" cy="120" r="4" fill="#8ca27e" />
            <circle cx="140" cy="90" r="3" fill="#8ca27e" />
            <circle cx="220" cy="90" r="3" fill="#8ca27e" />
            <path d="M268 145H292M273 163H287" stroke="#9ea982" strokeWidth="3" />
            <path d="M205 176H318V196M205 192H245V235H318V230" stroke="#acb99b" fill="none" />
            <circle cx="318" cy="213" r="17" fill="#e7eddb" stroke="#afc09e" />
            <text x="318" y="219" textAnchor="middle">
              V
            </text>
            <text x="222" y="173" textAnchor="middle">
              {lc.q >= 0 ? '+' : '−'}
            </text>
            <text x="222" y="209" textAnchor="middle">
              {lc.q >= 0 ? '−' : '+'}
            </text>
          </>
        )}
      </svg>
      {(!film.watch || !isLc) && (isLc || isReactive || shot.apparatus === 'led') && (
        <p className="ac-apparatus-caption">
          {isLc
            ? t(shot.charging ? '电源给电容充电' : '切至线圈，电源退出振荡')
            : isReactive
              ? shot.dc && kind === 'capacitor'
                ? t('充电结束后，电流趋于零')
                : `Irms = ${circuit.currentRms.toFixed(3)} A`
              : t('滑环保持两端独立连接')}
        </p>
      )}
      <div className="textbook-em-meters">
        <span>
          U <b>{voltage.toFixed(2)} V</b>
        </span>
        {shot.apparatus !== 'scope' && (
          <span>
            I <b>{current.toFixed(3)} A</b>
          </span>
        )}
        {isLc && (
          <span>
            {t('剩余电磁能')}{' '}
            <b>{(((lc.electric + lc.magnetic) / lc.initial) * 100).toFixed(0)}%</b>
          </span>
        )}
      </div>
      {(isLc || shot.apparatus === 'scope') && (
        <svg
          className="textbook-em-chart"
          viewBox="0 0 360 122"
          role="img"
          aria-label={t('有正负刻度的电压波形')}
        >
          <path d="M27 62H333" stroke="#cbd8be" />
          <text x="5" y="22">
            U
          </text>
          <path d={trace} stroke="#789b74" strokeWidth="2.5" fill="none" />
          <text x="331" y="117" textAnchor="end">
            {isLc ? 't' : '60 ms'}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择交流实验')}
            value={apparatus}
            onChange={setApparatus}
            options={options.map((x) => ({ value: x.value, label: t(x.label) }))}
          />
          {!isLc && apparatus !== 'led' && (
            <>
              <Segments
                label={t('电源类型')}
                value={source}
                onChange={setSource}
                options={[
                  { value: 'dc', label: 'DC' },
                  { value: 'ac', label: 'AC' },
                ]}
              />
              {source !== 'dc' && (
                <Range
                  label={t('信号频率')}
                  value={frequency}
                  min={10}
                  max={200}
                  step={10}
                  unit="Hz"
                  onChange={setFrequency}
                />
              )}
            </>
          )}
          {apparatus === 'inductor' && (
            <Range
              label={t('线圈自感系数')}
              value={L}
              min={0.01}
              max={0.1}
              step={0.01}
              unit="H"
              onChange={setL}
            />
          )}{' '}
          {apparatus === 'capacitor' && (
            <Range
              label={t('电容量')}
              value={C}
              min={20}
              max={500}
              step={10}
              unit="μF"
              onChange={setC}
            />
          )}{' '}
          {isLc ? (
            <>
              <Range
                label={t('振荡经过的周期数')}
                value={lcPhase}
                min={0}
                max={10}
                step={0.01}
                onChange={setLcPhase}
              />
              <Range
                label={t('振荡回路电阻')}
                value={loss}
                min={0}
                max={4}
                step={0.1}
                unit="Ω"
                onChange={setLoss}
              />
            </>
          ) : apparatus === 'capacitor' && source === 'dc' ? (
            <Range
              label={t('开关动作后的时间')}
              value={chargingTime * 1000}
              min={0}
              max={20}
              step={0.05}
              unit="ms"
              onChange={(v) => setChargingTime(v / 1000)}
            />
          ) : source !== 'dc' || apparatus === 'led' ? (
            <Range
              label={t('信号相位')}
              value={phase}
              min={0}
              max={3}
              step={0.01}
              unit="T"
              onChange={setPhase}
            />
          ) : null}
        </div>
      )}
      {!film.watch && (
        <details className="textbook-em-note">
          <summary>{t('有效值、瞬态与慢放')}</summary>
          <p>
            {t(
              '交流与直流比较使用相同3伏有效值。灯泡是固定6欧电阻，交流亮度采用平均功率；感抗含2欧绕组电阻，电容直流模式单独显示充电暂态。LED使用1.8伏阈值与100欧限流，滑环不是换向器。LC用0.2亨、1000微法和可调串联损耗解析求解；图示慢放，不是实际示波器采样。',
            )}
          </p>
        </details>
      )}
    </div>
  );
}
