import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  diodeOhmmeter,
  faultProbeState,
  lampMeter,
  ohmmeterState,
  type CircuitFault,
  type FaultProbe,
  type ResistanceSpecimen,
} from '../../models/multimeter-lab';
import '../../styles/multimeter-lab.css';
type Mode = 'voltage' | 'current' | 'resistance' | 'fault';
const smooth = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
const point = (f: number, r: number) => [
  200 + r * Math.sin(((-70 + 140 * f) * Math.PI) / 180),
  152 - r * Math.cos(((-70 + 140 * f) * Math.PI) / 180),
];
const resistanceText = (r: number) =>
  r < 0
    ? '—'
    : !Number.isFinite(r) || r > 1e8
      ? '∞'
      : r >= 1000
        ? `${(r / 1000).toFixed(1)} kΩ`
        : `${r.toFixed(1)} Ω`;
function MeterFace({ fraction, mode, gain }: { fraction: number; mode: Mode; gain: number }) {
  const needle = point(Math.max(-0.055, Math.min(1.055, fraction)), 100),
    angle = mode === 'voltage' || mode === 'fault' ? -90 : mode === 'current' ? 0 : 90;
  return (
    <g>
      <rect x="12" y="8" width="376" height="237" rx="35" fill="#e1e7d2" stroke="#c0cdb1" />
      <rect x="24" y="20" width="352" height="139" rx="25" fill="#f5f1db" />
      <path d={`M${point(0, 112)}A112 112 0 0 1 ${point(1, 112)}`} stroke="#acb996" fill="none" />
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((f, i) => {
        const a = point(f, 109),
          b = point(f, i % 2 === 0 ? 100 : 105),
          v = point(f, 84);
        return (
          <g key={f}>
            <path d={`M${a}L${b}`} stroke="#8d9d78" />
            {i % 2 === 0 && (
              <text
                x={v[0]}
                y={v[1] + 7}
                textAnchor="middle"
                opacity={mode === 'resistance' ? 0.35 : 1}
              >
                {i}
              </text>
            )}
          </g>
        );
      })}
      {[0, 5, 10, 20, 50, 100, Infinity].map((r, i) => {
        const f = 20 / (20 + r),
          a = point(f, 115),
          b = point(f, 121),
          v = point(f, 139);
        return (
          <g key={i} opacity={mode === 'resistance' ? 1 : 0.4}>
            <path d={`M${a}L${b}`} stroke="#ad9565" />
            {[0, 20, Infinity].includes(r) && (
              <text x={v[0]} y={v[1] + 6} textAnchor="middle">
                {r === Infinity ? '∞' : r}
              </text>
            )}
          </g>
        );
      })}
      <text x="200" y="135" textAnchor="middle" className="mm-scale-unit">
        {mode === 'resistance' ? 'Ω' : mode === 'current' ? 'A' : 'V'}
      </text>
      <path d={`M200 152L${needle}`} stroke="#a67656" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="200" cy="152" r="6" fill="#a67656" />
      <circle cx="200" cy="197" r="24" fill="#b3c09f" stroke="#94a782" />
      <path
        d="M200 197v-17"
        transform={`rotate(${angle} 200 197)`}
        stroke="#f7f3dd"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text x="147" y="205">
        V
      </text>
      <text x="193" y="165">
        A
      </text>
      <text x="239" y="205">
        Ω
      </text>
      <circle cx="313" cy="196" r="13" fill="#c3b993" />
      <path
        d="M313 196v-10"
        transform={`rotate(${(gain - 0.7) * 180 - 30} 313 196)`}
        stroke="#f7f3dd"
        strokeWidth="2"
      />
      <text x="313" y="175" textAnchor="middle" className="mm-scale-unit">
        Ω 0
      </text>
      <circle cx="75" cy="224" r="8" fill="#b9775d" />
      <circle cx="325" cy="224" r="8" fill="#64766a" />
      <text x="75" y="208" textAnchor="middle">
        +
      </text>
      <text x="325" y="231" textAnchor="middle" fill="#ecead3">
        −
      </text>
    </g>
  );
}
function Leads({ red, black }: { red: [number, number]; black: [number, number] }) {
  return (
    <g fill="none" strokeWidth="2.8" strokeLinecap="round">
      <path d={`M75 224C25 260 24 ${red[1] - 25} ${red[0]} ${red[1]}`} stroke="#b87960" />
      <path d={`M325 224C375 260 376 ${black[1] - 25} ${black[0]} ${black[1]}`} stroke="#718375" />
      <path d={`M${red[0]} ${red[1] - 10}v10`} stroke="#aa6d52" strokeWidth="7" />
      <path d={`M${black[0]} ${black[1] - 10}v10`} stroke="#5f7267" strokeWidth="7" />
    </g>
  );
}
function Bulb({ x, y, brightness = 0 }: { x: number; y: number; brightness?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="29" fill={brightness > 0 ? '#ece3b6' : '#e5ead8'} stroke="#b2be9f" />
      <circle r="23" fill="#f5df8e" opacity={Math.max(0, Math.min(0.8, brightness))} />
      <path d="M-28 0h12l7-8 6 16 6-16 7 8h18" fill="none" stroke="#9b9c73" strokeWidth="2" />
      <path d="M-16 27h32m-28 5h24" stroke="#a4ad8e" strokeWidth="3" />
    </g>
  );
}
export default function MultimeterLab() {
  const film = useShowcase(),
    [mode, setMode] = useState<Mode>(film.variant === 'r3-multimeter-faults' ? 'fault' : 'voltage'),
    [specimen, setSpecimen] = useState<ResistanceSpecimen>('resistor'),
    [multiplier, setMultiplier] = useState('10'),
    [gain, setGain] = useState(1),
    [short, setShort] = useState(false),
    [forward, setForward] = useState(true),
    [human, setHuman] = useState(50),
    [vRange, setVRange] = useState('5'),
    [aRange, setARange] = useState('0.5'),
    [reversed, setReversed] = useState(false),
    [fault, setFault] = useState<CircuitFault>('switch'),
    [probe, setProbe] = useState<FaultProbe>('battery');
  const c = film.chapter,
    p = film.chapterProgress,
    active: Mode = film.watch
      ? c === 0
        ? 'voltage'
        : c === 1
          ? 'current'
          : c < 7
            ? 'resistance'
            : 'fault'
      : mode,
    target: ResistanceSpecimen = film.watch
      ? c === 4
        ? 'lamp'
        : c === 5
          ? 'human'
          : c === 6
            ? 'diode'
            : 'resistor'
      : specimen,
    isShort = film.watch ? c === 2 : short,
    calibration = film.watch ? (c === 2 ? 0.86 + 0.14 * smooth((p - 0.25) / 0.4) : 1) : gain,
    rangeMult = film.watch ? (c === 4 ? 1 : c === 5 ? 1000 : 10) : Number(multiplier),
    direction = film.watch ? p < 0.5 : forward,
    selectedFault: CircuitFault = film.watch
      ? c === 7
        ? p < 0.45
          ? 'battery'
          : 'switch'
        : c === 8
          ? p < 0.5
            ? 'switch'
            : 'wire'
          : 'socket'
      : fault,
    selectedProbe: FaultProbe = film.watch
      ? c === 7
        ? 'battery'
        : c === 8
          ? p < 0.5
            ? 'switch'
            : 'wire'
          : p < 0.4
            ? 'switch'
            : 'lamp'
      : probe,
    range =
      active === 'fault'
        ? 2.5
        : active === 'current'
          ? film.watch
            ? 0.5
            : Number(aRange)
          : film.watch
            ? 5
            : Number(vRange),
    isReversed = film.watch ? false : reversed,
    ohm =
      target === 'diode' && !isShort
        ? diodeOhmmeter(direction, rangeMult, calibration)
        : ohmmeterState(
            isShort
              ? 0
              : target === 'lamp'
                ? 15
                : target === 'human'
                  ? film.watch
                    ? 50000
                    : human * 1000
                  : 470,
            rangeMult,
            calibration,
          ),
    dc = lampMeter(active === 'current' ? 'current' : 'voltage', range, isReversed),
    diagnostic = faultProbeState(selectedFault, selectedProbe),
    fraction =
      active === 'resistance'
        ? ohm.deflection
        : active === 'fault'
          ? diagnostic.deflection
          : dc.deflection;
  let red: [number, number] = [222, 326],
    black: [number, number] = [280, 326];
  if (active === 'current') {
    red = [128, 326];
    black = [166, 326];
  }
  if (active === 'resistance') {
    red = isShort ? [200, 360] : [120, 360];
    black = isShort ? [200, 360] : [280, 360];
    if (target === 'human' && !isShort) {
      red = [130, 382];
      black = [270, 382];
    }
    if (target === 'diode' && !isShort && direction) {
      red = [280, 360];
      black = [120, 360];
    }
  }
  if (active === 'fault') {
    const nodes: Record<FaultProbe, [[number, number], [number, number]]> = {
      battery: [
        [151, 432],
        [201, 432],
      ],
      wire: [
        [50, 432],
        [50, 326],
      ],
      switch: [
        [128, 326],
        [166, 326],
      ],
      lamp: [
        [222, 326],
        [280, 326],
      ],
    };
    [red, black] = nodes[selectedProbe];
  }
  if (isReversed && (active === 'voltage' || active === 'current')) [red, black] = [black, red];
  const subtitle =
    active === 'voltage'
      ? '测电压：表笔跨接小灯泡两端'
      : active === 'current'
        ? '测电流：断开一处，把电表串入电路'
        : active === 'fault'
          ? '灯不亮，沿真实接线寻找电压降'
          : isShort
            ? '先短接表笔，把指针调到右侧零欧姆'
            : target === 'diode'
              ? '本示例的模拟式欧姆挡：黑表笔为内部正极'
              : target === 'human'
                ? '手部接触与皮肤条件改变测得电阻'
                : target === 'lamp'
                  ? '断电后的冷灯丝，与发光时电阻不同'
                  : '从非均匀欧姆刻度读数，再乘挡位倍率';
  return (
    <section className="mm-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="mm-kicker">{t(subtitle)}</p>
      <svg
        viewBox="0 0 400 470"
        className="mm-apparatus"
        role="img"
        aria-label={t('指针式多用电表、表笔与实际测量接线')}
      >
        {active !== 'resistance' ? (
          <g>
            <path
              d="M50 326V432H151M201 432H350V326H280M50 326H128M166 326H222"
              fill="none"
              stroke="#9aaa8a"
              strokeWidth="2.5"
            />
            {active !== 'current' && (
              <path
                d={active === 'fault' ? 'M128 326L166 326' : 'M128 326H166'}
                stroke="#9aaa8a"
                strokeWidth="2.5"
              />
            )}
            {active === 'fault' && (
              <>
                <circle cx="128" cy="326" r="4" fill="#a48a5b" />
                <circle cx="166" cy="326" r="4" fill="#a48a5b" />
                <text x="145" y="303" textAnchor="middle">
                  S
                </text>
              </>
            )}
            <Bulb
              x={251}
              y={326}
              brightness={
                active === 'fault' ? diagnostic.lampPower / 0.22 : (dc.current ** 2 * 20) / 0.45
              }
            />
            <rect x="151" y="416" width="50" height="32" rx="7" fill="#c6cfaf" stroke="#a7b790" />
            <text x="161" y="439">
              +
            </text>
            <text x="183" y="439">
              −
            </text>
            <text x="176" y="399" textAnchor="middle">
              {active === 'fault' ? '1.5 V' : '3 V'}
            </text>
          </g>
        ) : (
          <g>
            {isShort ? (
              <circle cx="200" cy="360" r="6" fill="#b3ad82" />
            ) : target === 'human' ? (
              <g>
                <circle cx="200" cy="306" r="22" fill="#d8d0af" />
                <path
                  d="M177 442V359Q150 341 130 382M223 442V359Q250 341 270 382M177 359Q200 345 223 359"
                  stroke="#b9c5a5"
                  strokeWidth="15"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="130" cy="382" r="9" fill="#d8d0af" />
                <circle cx="270" cy="382" r="9" fill="#d8d0af" />
              </g>
            ) : (
              <>
                <path d="M120 360H173M227 360H280" stroke="#aab797" strokeWidth="2.5" />
                {target === 'lamp' ? (
                  <Bulb x={200} y={360} />
                ) : target === 'diode' ? (
                  <>
                    <rect x="173" y="348" width="54" height="24" rx="9" fill="#667a6c" />
                    <path d="M215 349v22" stroke="#d7d9bc" strokeWidth="5" />
                    <text x="156" y="406">
                      A
                    </text>
                    <text x="228" y="406">
                      K
                    </text>
                  </>
                ) : (
                  <>
                    <rect x="173" y="350" width="54" height="20" rx="8" fill="#c4b98c" />
                    <path d="M184 350v20m10-20v20m10-20v20" stroke="#93815a" strokeWidth="4" />
                  </>
                )}
              </>
            )}
          </g>
        )}
        <Leads red={red} black={black} />
        <MeterFace fraction={fraction} mode={active} gain={calibration} />
      </svg>
      <div className="mm-reading">
        {active === 'resistance' ? (
          <>
            <span>Ω × {rangeMult}</span>
            <strong>{resistanceText(ohm.indicated)}</strong>
            <span>{t(ohm.calibrated ? '已短接调零' : '先短接调零，当前读数有偏差')}</span>
          </>
        ) : (
          <>
            <span>
              {t('量程')} {range} {active === 'current' ? 'A' : 'V'}
            </span>
            <strong>
              {active === 'fault' ? diagnostic.voltage.toFixed(3) : dc.value.toFixed(3)}{' '}
              {active === 'current' ? 'A' : 'V'}
            </strong>
            {active !== 'fault' && (dc.overRange || dc.value < 0) && (
              <span>{t(dc.overRange ? '超过量程：换用更大挡位' : '反向偏转：交换两表笔')}</span>
            )}
          </>
        )}
      </div>
      {active === 'fault' && (
        <p className="mm-status">
          {t('被检部位')} ·{' '}
          {t(
            (
              {
                battery: '电池两端',
                wire: '导线两端',
                switch: '开关两端',
                lamp: '灯座外侧两端',
              } as const
            )[selectedProbe],
          )}
        </p>
      )}
      {!film.watch && (
        <div className="mm-controls">
          <Segments
            label={t('选择测量')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'voltage', label: t('电压') },
              { value: 'current', label: t('电流') },
              { value: 'resistance', label: t('电阻') },
              { value: 'fault', label: t('故障定位') },
            ]}
          />
          {active === 'resistance' ? (
            <>
              <Segments
                label={t('待测物')}
                value={specimen}
                onChange={setSpecimen}
                options={[
                  { value: 'resistor', label: t('定值电阻') },
                  { value: 'lamp', label: t('冷灯丝') },
                  { value: 'human', label: t('手部接触') },
                  { value: 'diode', label: t('二极管') },
                ]}
              />
              <Segments
                label={t('欧姆倍率')}
                value={multiplier}
                onChange={(v) => {
                  setMultiplier(v);
                  setGain(0.86);
                }}
                options={['1', '10', '100', '1000'].map((v) => ({ value: v, label: `× ${v}` }))}
              />
              <button type="button" aria-pressed={short} onClick={() => setShort(!short)}>
                {t(short ? '接回待测物' : '短接两表笔')}
              </button>
              <Range
                label={t('欧姆调零')}
                value={gain}
                min={0.7}
                max={1.1}
                step={0.01}
                onChange={setGain}
              />
              {target === 'human' && (
                <Range
                  label={t('接触电阻模型')}
                  value={human}
                  min={20}
                  max={200}
                  step={5}
                  unit="kΩ"
                  onChange={setHuman}
                />
              )}
              {target === 'diode' && (
                <button type="button" onClick={() => setForward(!forward)}>
                  {t('交换两表笔')}
                </button>
              )}
            </>
          ) : active === 'fault' ? (
            <>
              <Segments
                label={t('模拟故障')}
                value={fault}
                onChange={setFault}
                options={[
                  { value: 'battery', label: t('电池耗尽') },
                  { value: 'wire', label: t('导线断路') },
                  { value: 'switch', label: t('开关接触不良') },
                  { value: 'socket', label: t('灯座接触不良') },
                ]}
              />
              <Segments
                label={t('表笔测哪里')}
                value={probe}
                onChange={setProbe}
                options={[
                  { value: 'battery', label: t('电池') },
                  { value: 'wire', label: t('导线') },
                  { value: 'switch', label: t('开关') },
                  { value: 'lamp', label: t('灯座') },
                ]}
              />
            </>
          ) : (
            <>
              <Segments
                label={t('量程')}
                value={active === 'current' ? aRange : vRange}
                onChange={active === 'current' ? setARange : setVRange}
                options={(active === 'current' ? ['0.1', '0.5'] : ['2.5', '5', '10']).map((v) => ({
                  value: v,
                  label: `${v} ${active === 'current' ? 'A' : 'V'}`,
                }))}
              />
              <button type="button" onClick={() => setReversed(!reversed)}>
                {t('交换两表笔')}
              </button>
            </>
          )}
        </div>
      )}
      <details className="mm-details">
        <summary>{t('电表模型与诊断范围')}</summary>
        <p>
          {t(
            '模拟式电表采用 20 kΩ/V 的电压灵敏度，欧姆挡含 1.5 V 内部电源；黑表笔的内部正极约定来自所引仪表说明书，不代表所有电表。电阻测量对象已与外部电源分离。人体只用可变接触电阻表示，二极管采用理想指数结模型。故障模式只比较给定四种单一故障，不能据此排除灯丝断裂等其他原因。读数来自模型，不是实测数据。',
          )}
        </p>
      </details>
    </section>
  );
}
