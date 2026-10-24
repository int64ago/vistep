import { useId, useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Segments, Range } from '../lab/Controls';
import {
  acFilmState,
  reactiveCircuitState,
  generatorLeds,
  lcOscillation,
  sinusoidalCircuit,
  type AcSceneState,
  type AcApparatus,
} from '../../models/ac-circuit-lab';
import '../../styles/ac-circuit-lab.css';
const fixed = (n: number, digits: number) =>
  (Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n).toFixed(digits);
const coil = (x: number, y: number, width: number) =>
  `M${x} ${y}` +
  Array.from({ length: 8 }, () => `c${-width / 18} -19 ${width / 5} -19 ${width / 8} 0`).join('');
function Arrow({
  x,
  y,
  dx,
  dy,
  amount,
  color = '#5d8a79',
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  amount: number;
  color?: string;
}) {
  if (Math.abs(amount) < 1e-6) return null;
  const sign = Math.sign(amount),
    X = dx * sign,
    Y = dy * sign,
    n = Math.hypot(dx, dy),
    a = x - X / 2,
    b = y - Y / 2,
    endX = x + X / 2,
    endY = y + Y / 2;
  return (
    <path
      data-current-arrow={sign}
      d={`M${a} ${b}l${X} ${Y}M${endX - (X * 5) / n + (Y * 3) / n} ${endY - (Y * 5) / n - (X * 3) / n}L${endX} ${endY}L${endX - (X * 5) / n - (Y * 3) / n} ${endY - (Y * 5) / n + (X * 3) / n}`}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={0.45 + 0.55 * Math.min(1, Math.abs(amount))}
    />
  );
}
function Charge({ x, y, signed }: { x: number; y: number; signed: number }) {
  if (Math.abs(signed) < 1e-6) return null;
  return (
    <g
      data-charge-sign={Math.sign(signed)}
      stroke={signed > 0 ? '#ac8056' : '#608b91'}
      strokeWidth="1.7"
      opacity={Math.min(1, Math.abs(signed))}
    >
      <path d={`M${x - 3} ${y}h6`} />
      {signed > 0 && <path d={`M${x} ${y - 3}v6`} />}
    </g>
  );
}
export default function AcCircuitLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (zh: string, english: string) => (en ? english : zh),
    authored = acFilmState(film.chapter, film.chapterProgress, en ? 'en' : 'zh');
  const [manual, setManual] = useState<AcSceneState | null>(null);
  const state = film.watch ? authored : (manual ?? authored),
    set = (patch: Partial<AcSceneState>) => setManual({ ...state, ...patch }),
    isLc = state.apparatus === 'lc',
    isReactive = state.apparatus === 'inductor' || state.apparatus === 'capacitor',
    kind = state.apparatus === 'inductor' ? 'inductor' : 'capacitor',
    circuit = reactiveCircuitState(
      kind,
      state.frequency,
      kind === 'inductor' ? state.inductance : state.capacitance,
      state.phase,
      state.dc,
      state.transientTime,
    ),
    led = generatorLeds(state.phase),
    period = 2 * Math.PI * Math.sqrt(0.2 * 0.001),
    lc = lcOscillation(state.cycles * period, 0.2, 0.001, state.resistance),
    energyExact = [lc.electric, lc.magnetic, lc.heat].map((energy) => (100 * energy) / lc.initial),
    energyPercent = energyExact.map(Math.floor),
    current = isLc
      ? lc.current
      : state.apparatus === 'led'
        ? led.forward - led.reverse
        : circuit.current,
    voltage = isLc ? lc.voltage : state.apparatus === 'led' ? led.voltage : circuit.voltage,
    componentCharge = isLc ? lc.q / 0.005 : circuit.charge / (state.capacitance * Math.SQRT2 * 3),
    field = isLc ? lc.current / Math.sqrt((2 * lc.initial) / 0.2) : circuit.current / 0.54,
    comparison = sinusoidalCircuit(
      kind,
      50,
      kind === 'inductor' ? state.inductance : state.capacitance,
    ),
    options: { value: AcApparatus; label: string }[] = [
      { value: 'scope', label: say('波形', 'Waveform') },
      { value: 'led', label: 'LED' },
      { value: 'inductor', label: say('电感', 'Inductor') },
      { value: 'capacitor', label: say('电容', 'Capacitor') },
      { value: 'lc', label: 'LC' },
    ],
    tracePeriods = state.chapter === 11 || !film.watch ? 10 : 1,
    trace = Array.from({ length: 241 }, (_, i) => {
      const u = state.charging
        ? 5
        : lcOscillation((i / 240) * tracePeriods * period, 0.2, 0.001, state.resistance).voltage;
      return `${i ? 'L' : 'M'}${12 + (i / 240) * 256} ${26 - u * 4}`;
    }).join(' ');
  // Distribute rounding remainders so the displayed conserved shares also sum to 100%.
  const remainderOrder = [0, 1, 2].sort(
    (a, b) => energyExact[b] - energyPercent[b] - (energyExact[a] - energyPercent[a]),
  );
  for (const index of remainderOrder.slice(
    0,
    100 - energyPercent.reduce((sum, share) => sum + share, 0),
  )) {
    energyPercent[index]++;
  }
  return (
    <section
      className="ac21"
      data-watch={film.watch}
      data-apparatus={state.apparatus}
      data-chapter={state.chapter}
      data-dc={state.dc}
      data-frequency={state.frequency}
      data-phase={state.phase}
      data-inductance={state.inductance}
      data-capacitance={state.capacitance}
      data-resistance={state.resistance}
      data-transient-time={state.transientTime}
      data-cycles={state.cycles}
      data-charging={state.charging}
      data-current={current}
      data-voltage={voltage}
      data-charge={isLc ? lc.q : circuit.charge}
      data-electric={isLc ? lc.electric : circuit.electric}
      data-magnetic={isLc ? lc.magnetic : circuit.magnetic}
      data-heat={isLc ? lc.heat : 0}
    >
      <header className="ac21-head">
        <span>
          {say(
            isLc
              ? '电场与磁场'
              : state.apparatus === 'inductor'
                ? 'L · 自感'
                : state.apparatus === 'capacitor'
                  ? 'C · 极板电荷'
                  : state.apparatus === 'scope'
                    ? '电压的正负'
                    : '电流的两个方向',
            isLc
              ? 'Electric ↔ magnetic'
              : state.apparatus === 'inductor'
                ? 'L · self-induction'
                : state.apparatus === 'capacitor'
                  ? 'C · plate charge'
                  : state.apparatus === 'scope'
                    ? 'Voltage polarity'
                    : 'Two current directions',
          )}
        </span>
        <strong>
          {isLc
            ? `R = ${state.resistance.toFixed(1)} Ω`
            : state.apparatus === 'led'
              ? 'G → LED'
              : state.dc
                ? 'DC · 3 V'
                : `3 V RMS · ${state.frequency.toFixed(0)} Hz`}
        </strong>
      </header>
      {!isReactive && !isLc && (
        <svg
          className="ac21-legacy"
          viewBox="0 20 360 240"
          role="img"
          aria-label={say(
            '同一相位驱动电压波形或反向并联LED',
            'Shared phase drives the voltage trace or antiparallel LEDs',
          )}
        >
          {state.apparatus === 'scope' && (
            <>
              <rect x="35" y="73" width="92" height="133" rx="14" fill="#dfe7d5" stroke="#b5c5a9" />
              <rect x="48" y="89" width="66" height="36" rx="5" fill="#f6f7ed" />
              <text x="81" y="114" textAnchor="middle">
                {state.dc ? '3 V' : '~ 3 V'}
              </text>
              <circle cx="60" cy="176" r="5" fill="#b69760" />
              <circle cx="102" cy="176" r="5" fill="#779573" />
              <path
                d="M60 176V240H247V208M102 176V224H279V208"
                fill="none"
                stroke="#879d7a"
                strokeWidth="2"
              />
              <rect
                x="169"
                y="79"
                width="164"
                height="129"
                rx="14"
                fill="#cbd9c1"
                stroke="#a9bda0"
              />
              <rect x="181" y="91" width="140" height="87" rx="7" fill="#f3f6e9" />
              <path d="M188 137H312M250 98V172" stroke="#d2dfc7" />
              <path
                d={Array.from(
                  { length: 121 },
                  (_, i) =>
                    `${i ? 'L' : 'M'}${188 + i} ${137 - (state.dc ? 3 : 3 * Math.SQRT2 * Math.sin((i / 120) * 0.04 * 2 * Math.PI * state.frequency - state.phase)) * 7}`,
                ).join(' ')}
                stroke="#7c9a71"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="196" cy="192" r="4" fill="#a0b393" />
              <circle cx="211" cy="192" r="4" fill="#a0b393" />
            </>
          )}
          {state.apparatus === 'led' && (
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
        </svg>
      )}
      {isReactive && (
        <svg
          className="ac21-circuit"
          viewBox="0 0 280 220"
          role="img"
          aria-label={say(
            '外电路电流、电容极板电荷或线圈磁场来自同一个瞬时状态',
            'External current, plate charge and coil field share one instantaneous state',
          )}
        >
          <defs>
            <radialGradient id={`${id}-lamp`}>
              <stop stopColor="#e7ba5e" stopOpacity=".7" />
              <stop offset="1" stopColor="#e7ba5e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M45 65H106M194 65H240V123M240 163V202H45V165M45 121V65"
            fill="none"
            stroke="#9cb1a0"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {kind === 'inductor' ? (
            <>
              {[21, 30, 39].map((r) => (
                <ellipse
                  key={r}
                  cx="150"
                  cy="60"
                  rx={48 + r / 3}
                  ry={r}
                  fill="none"
                  stroke="#7b9faf"
                  strokeWidth="1.2"
                  opacity={Math.min(0.65, Math.abs(field) * 0.8)}
                />
              ))}
              <path d={coil(106, 65, 88)} stroke="#a88956" strokeWidth="3" fill="none" />
              <Arrow x={150} y={70} dx={22} dy={0} amount={field} color="#6f97a8" />
              <text x="150" y="112" textAnchor="middle">
                B ∝ I
              </text>
            </>
          ) : (
            <>
              <path
                d="M106 65H143M157 65H194M143 42V88M157 42V88"
                stroke="#8eaaa0"
                strokeWidth="3"
                fill="none"
              />
              {[49, 65, 81].map((y) => (
                <g key={y}>
                  <Charge x={135} y={y} signed={componentCharge} />
                  <Charge x={165} y={y} signed={-componentCharge} />
                </g>
              ))}
              <text x="150" y="112" textAnchor="middle">
                q = CU
              </text>
            </>
          )}
          <circle cx="45" cy="143" r="22" fill="#f2f5ed" stroke="#a8b8a0" />
          <text x="45" y="149" textAnchor="middle">
            {state.dc ? '=' : '∿'}
          </text>
          <circle
            cx="240"
            cy="143"
            r="34"
            fill={`url(#${id}-lamp)`}
            opacity={Math.min(1, circuit.lampPower / 0.85)}
          />
          <circle
            cx="240"
            cy="143"
            r="20"
            fill="#f1e4bd"
            fillOpacity={0.1 + Math.min(0.8, circuit.lampPower)}
            stroke="#b7a27a"
          />
          <path d="M229 132l22 22m-22 0 22-22" stroke="#ac945e" strokeWidth="2" />
          <Arrow x={78} y={65} dx={18} dy={0} amount={current / 0.5} />
          <Arrow x={218} y={65} dx={18} dy={0} amount={current / 0.5} />
          <Arrow x={240} y={185} dx={0} dy={18} amount={current / 0.5} />
          <Arrow x={115} y={202} dx={-18} dy={0} amount={current / 0.5} />
          <Arrow x={45} y={94} dx={0} dy={-18} amount={current / 0.5} />
          {kind === 'inductor' && (
            <>
              <Arrow x={150} y={160} dx={32} dy={0} amount={circuit.backEmf / 3} color="#b58c59" />
              <text x="150" y="188" textAnchor="middle">
                εL = {fixed(circuit.backEmf, 2)} V
              </text>
            </>
          )}
          {kind === 'capacitor' && (
            <text x="150" y="170" textAnchor="middle">
              U꜀ = {fixed(circuit.componentVoltage, 2)} V
            </text>
          )}
        </svg>
      )}
      {isLc && (
        <>
          <svg
            className="ac21-circuit ac21-lc"
            viewBox="0 20 280 200"
            role="img"
            aria-label={say(
              '开关隔离电源；电容的电荷、闭回路电流和线圈磁场同步交换',
              'Switch isolates the supply; capacitor charge, loop current and coil field evolve together',
            )}
          >
            <path
              d="M98 45H54V102M54 178V202H236V157M236 129V45H186M142 70V113M142 133V202"
              stroke="#9bb0a0"
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round"
            />
            {[17, 24, 31].map((r) => (
              <ellipse
                key={r}
                cx="54"
                cy="140"
                rx={r}
                ry={44 + r / 5}
                fill="none"
                stroke="#7b9faf"
                strokeWidth="1.2"
                opacity={Math.min(0.65, Math.abs(field) * 0.65)}
              />
            ))}
            <path
              d={coil(0, 0, 76)}
              transform="translate(54 102) rotate(90)"
              stroke="#aa8b59"
              strokeWidth="3"
              fill="none"
            />
            <Arrow x={54} y={140} dx={0} dy={24} amount={field} color="#6f97a8" />
            <path d="M120 113H164M120 133H164" stroke="#8eaaa0" strokeWidth="3" />
            {[126, 142, 158].map((x) => (
              <g key={x}>
                <Charge x={x} y={106} signed={componentCharge} />
                <Charge x={x} y={140} signed={-componentCharge} />
              </g>
            ))}
            <path d="M224 129H248M230 157H242" stroke="#a5ac8f" strokeWidth="3" />
            <path
              d={state.charging ? 'M142 70L186 45' : 'M142 70L98 45'}
              stroke="#809c83"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {[98, 186].map((x) => (
              <circle key={x} cx={x} cy="45" r="3" fill="#819b80" />
            ))}
            <circle cx="142" cy="70" r="4" fill="#819b80" />
            <path d="M164 113H180M164 133H180" stroke="#b4c0b4" fill="none" />
            <circle cx="190" cy="123" r="14" fill="#f5f6ee" stroke="#b4c0b4" />
            <text x="190" y="129" textAnchor="middle">
              V
            </text>
            <text x="236" y="184" textAnchor="middle">
              5 V
            </text>
            {!state.charging && (
              <>
                <Arrow x={77} y={45} dx={-18} dy={0} amount={field} />
                <Arrow x={54} y={190} dx={0} dy={16} amount={field} />
                <Arrow x={96} y={202} dx={20} dy={0} amount={field} />
                <Arrow x={142} y={173} dx={0} dy={-22} amount={field} />
                <Arrow x={142} y={87} dx={0} dy={-16} amount={field} />
              </>
            )}
          </svg>
        </>
      )}
      <div className="ac21-readings">
        <span>
          {isLc ? 'U꜀' : 'U'} <b>{fixed(voltage, 2)} V</b>
        </span>
        {state.apparatus !== 'scope' && (
          <span>
            I <b>{fixed(current, 3)} A</b>
          </span>
        )}
      </div>
      {isReactive && (
        <div className="ac21-comparison">
          {state.dc ? (
            <span>
              {kind === 'inductor'
                ? say('接通：I增长，自感逐渐减弱', 'Turn-on: I rises; induced emf fades')
                : say('极板积累电荷，充电电流减小', 'Plate charge grows; current falls')}
            </span>
          ) : (
            <span>
              Iᵣₘₛ {state.frequency > 50.5 ? `${comparison.currentRms.toFixed(3)} → ` : ''}
              {circuit.currentRms.toFixed(3)} A ·{' '}
              {kind === 'inductor' ? 'Xᴸ = 2πfL' : 'Xᶜ = 1/(2πfC)'}
            </span>
          )}
        </div>
      )}
      {isLc && (
        <>
          <div
            className="ac21-energy"
            role="img"
            aria-label={say(
              '电场能、磁场能与累计热量，总量守恒',
              'Electric, magnetic and dissipated energy sum to the initial energy',
            )}
          >
            <div className="ac21-energy-band">
              {[
                ['electric', lc.electric],
                ['magnetic', lc.magnetic],
                ['heat', lc.heat],
              ].map(([name, value]) => (
                <span
                  key={name as string}
                  data-energy={name}
                  style={{ width: `${(Number(value) / lc.initial) * 100}%` }}
                />
              ))}
            </div>
            <div className="ac21-energy-key">
              <span>
                {say('电场', 'Electric')} <b>{energyPercent[0]}%</b>
              </span>
              <span>
                {say('磁场', 'Magnetic')} <b>{energyPercent[1]}%</b>
              </span>
              <span>
                {say('热', 'Heat')} <b>{energyPercent[2]}%</b>
              </span>
            </div>
          </div>
          <svg
            className="ac21-trace"
            viewBox="0 0 280 52"
            role="img"
            aria-label={say(
              '电容电压记录，标点对应当前电路状态',
              'Capacitor-voltage trace with a marker at the current circuit state',
            )}
          >
            <path d="M12 26H268" stroke="#cbd6cb" />
            <path d={trace} stroke="#6d947b" strokeWidth="1.8" fill="none" />
            <circle
              cx={12 + Math.min(1, state.cycles / tracePeriods) * 256}
              cy={26 - lc.voltage * 4}
              r="3.5"
              fill="#a78353"
            />
          </svg>
        </>
      )}
      {!film.watch && (
        <div className="ac21-controls">
          <Segments
            label={say('选择电路', 'Choose circuit')}
            value={state.apparatus}
            options={options}
            onChange={(apparatus) => set({ apparatus, charging: false })}
          />
          {!isLc && state.apparatus !== 'led' && (
            <Segments
              label={say('电源类型', 'Supply')}
              value={state.dc ? 'dc' : 'ac'}
              options={[
                { value: 'dc', label: 'DC' },
                { value: 'ac', label: 'AC' },
              ]}
              onChange={(source) => set({ dc: source === 'dc' })}
            />
          )}
          {!isLc && state.apparatus !== 'led' && !state.dc && (
            <Range
              label={say('信号频率', 'Frequency')}
              value={state.frequency}
              min={10}
              max={200}
              step={10}
              unit="Hz"
              onChange={(frequency) => set({ frequency })}
            />
          )}
          {state.apparatus === 'inductor' && (
            <Range
              label={say('线圈自感系数', 'Inductance')}
              value={state.inductance}
              min={0.01}
              max={0.1}
              step={0.01}
              unit="H"
              onChange={(inductance) => set({ inductance })}
            />
          )}
          {state.apparatus === 'capacitor' && (
            <Range
              label={say('电容量', 'Capacitance')}
              value={state.capacitance * 1e6}
              min={20}
              max={500}
              step={10}
              unit="μF"
              onChange={(capacitance) => set({ capacitance: capacitance * 1e-6 })}
            />
          )}
          {isLc ? (
            <>
              <Segments
                label={say('开关位置', 'Switch position')}
                value={state.charging ? 'source' : 'coil'}
                options={[
                  { value: 'source', label: say('已充电', 'Charged') },
                  { value: 'coil', label: say('接线圈', 'Coil') },
                ]}
                onChange={(value) =>
                  set({
                    charging: value === 'source',
                    cycles: value === 'source' ? 0 : state.cycles,
                  })
                }
              />
              <Range
                label={say('振荡经过的周期数', 'Elapsed natural periods')}
                value={state.cycles}
                min={0}
                max={10}
                step={0.01}
                unit="T₀"
                onChange={(cycles) => set({ cycles, charging: false })}
              />
              <Range
                label={say('振荡回路电阻', 'Loop resistance')}
                value={state.resistance}
                min={0}
                max={4}
                step={0.1}
                unit="Ω"
                onChange={(resistance) => set({ resistance })}
              />
            </>
          ) : isReactive && state.dc ? (
            <Range
              label={say('开关动作后的时间', 'Time after switching')}
              value={state.transientTime * 1000}
              min={0}
              max={60}
              step={0.05}
              unit="ms"
              onChange={(time) => set({ transientTime: time / 1000 })}
            />
          ) : (
            <Range
              label={say('信号相位', 'Signal phase')}
              value={state.phase / (2 * Math.PI)}
              min={0}
              max={3}
              step={0.01}
              unit="T"
              onChange={(phase) => set({ phase: phase * 2 * Math.PI })}
            />
          )}
        </div>
      )}
      {!film.watch && (
        <details className="ac21-note">
          <summary>{say('模型条件与电流约定', 'Model limits and current convention')}</summary>
          <p>
            {say(
              '箭头表示约定的正电流，不是电子轨迹。电容电流只画在导线上，不穿过介质；正向LC电流从上极板流出，I = −dq/dt。交流比较同为3 V有效值，灯泡用固定6 Ω电阻和平均功率；线圈另有2 Ω绕组电阻。接直流时分别计算RL和RC暂态。',
              'Arrows show conventional current, not electron trajectories. No conduction current is drawn across the dielectric. Positive LC current leaves the upper plate: I = −dq/dt. AC and DC share a 3 V RMS supply. The lamp is a fixed 6 Ω load, with AC brightness showing average power; the coil adds 2 Ω winding resistance. DC uses separate RL and RC transients.',
            )}
          </p>
          <p>
            {say(
              'LC用0.2 H和1000 μF，预先充至5 V。交换章节先取R=0，损耗章节取R=1 Ω；E电+E磁+Q热始终等于初始12.5 mJ。所有动作均为慢放示意，磁场轮廓不表示实测场线。',
              'The LC circuit uses 0.2 H and 1000 μF, initially charged to 5 V. The exchange chapter first uses R=0; the loss chapter uses R=1 Ω. Electric energy, magnetic energy and heat sum to 12.5 mJ. Motion is slowed; field contours are schematic rather than measured field lines.',
            )}
          </p>
        </details>
      )}
    </section>
  );
}
