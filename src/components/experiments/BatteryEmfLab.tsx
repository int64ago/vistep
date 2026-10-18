import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  CHARGE_DATA,
  ORANGE_DATA,
  bankSamples,
  drySamples,
  fitSource,
  fruitResistance,
  fruitSamples,
  loadedSource,
  parallelLamps,
  regulatedBank,
  type SourceSample,
} from '../../models/battery-emf-lab';
import '../../styles/battery-emf-lab.css';
type Mode = 'lamps' | 'dry' | 'fruit' | 'orange' | 'bank';
const smooth = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
function Meter({
  x,
  y,
  label,
  fraction,
}: {
  x: number;
  y: number;
  label: string;
  fraction: number;
}) {
  const a = -1 + 2 * Math.max(0, Math.min(1, fraction));
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="23" fill="#edf0df" stroke="#acbc9f" />
      <path d="M-15-6Q0-22 15-6" fill="none" stroke="#bbc4a6" />
      <path
        d={`M0 4L${17 * Math.sin(a)} ${4 - 17 * Math.cos(a)}`}
        stroke="#aa8c60"
        strokeWidth="2"
      />
      <text textAnchor="middle" y="20">
        {label}
      </text>
    </g>
  );
}
function Lamps({ count, internal }: { count: number; internal: number }) {
  const s = parallelLamps(count, internal);
  return (
    <>
      <svg
        viewBox="0 0 400 275"
        className="emf-apparatus"
        role="img"
        aria-label={t('同一电池连接一到四只并联灯泡')}
      >
        <path
          d="M62 58H338M62 170H338M62 58V231H159M241 231H338V170"
          stroke="#a7b79b"
          strokeWidth="2.4"
          fill="none"
        />
        {Array.from({ length: 4 }, (_, i) => {
          const x = 82 + i * 78,
            on = i < count;
          return (
            <g key={i} opacity={on ? 1 : 0.2}>
              <path
                d={on ? `M${x} 58V86M${x} 144V170` : `M${x} 58V66l9 9M${x} 83V86M${x} 144V170`}
                stroke="#9cac8c"
                strokeWidth="2.4"
              />
              <circle cx={x} cy="115" r="29" fill="#e6e8ce" stroke="#b5c2a1" />
              <circle
                cx={x}
                cy="115"
                r="24"
                fill="#efd48a"
                opacity={on ? s.lampPower / 1.5 : 0.1}
              />
              <path
                d={`M${x} 86v13l-8 7 16 7-16 7 8 7v17`}
                stroke="#a4966d"
                strokeWidth="1.5"
                fill="none"
              />
            </g>
          );
        })}
        <rect x="159" y="209" width="82" height="44" rx="13" fill="#bdcbaa" stroke="#9eaf8d" />
        <text x="174" y="239">
          +
        </text>
        <text x="221" y="239">
          −
        </text>
        <text x="200" y="201" textAnchor="middle">
          3 V
        </text>
      </svg>
      <div className="emf-readings">
        <span>
          I <b>{s.current.toFixed(3)} A</b>
        </span>
        <span>
          U <b>{s.voltage.toFixed(3)} V</b>
        </span>
      </div>
      <div className="emf-drop">
        <span>{t('电动势')} 3.00 V</span>
        <div>
          <i style={{ width: `${(s.voltage / 3) * 100}%` }} />
          <i style={{ width: `${(s.internalDrop / 3) * 100}%` }} />
        </div>
        <span>
          U = 3.00 − {s.internalDrop.toFixed(2)} V · r = {internal.toFixed(1)} Ω
        </span>
      </div>
    </>
  );
}
function Bench({
  mode,
  current,
  voltage,
  load,
  depth,
  gap,
  charge,
}: {
  mode: Exclude<Mode, 'lamps'>;
  current: number;
  voltage: number;
  load: number;
  depth: number;
  gap: number;
  charge: number;
}) {
  const fruit = mode === 'fruit',
    orange = mode === 'orange',
    bank = mode === 'bank',
    left = fruit ? 200 - 25 * gap : 160,
    right = fruit ? 200 + 25 * gap : 240,
    sliderX = 170 + 60 * Math.max(0, Math.min(1, bank ? (load - 0.5) / 29.5 : load / 20));
  return (
    <svg
      viewBox="0 0 400 315"
      className="emf-apparatus"
      role="img"
      aria-label={t(
        fruit
          ? '铜锌电极插入梨，电阻箱和电压表接入电路'
          : orange
            ? '橙汁中的铜锌电极、电阻箱与串联微安表'
            : bank
              ? '充电宝、串联保护电阻与可变负载，电压表跨接输出端'
              : '干电池、串联电流表、滑动变阻器与并联电压表',
      )}
    >
      <path
        d={`M${left} 220H50V${fruit ? 40 : 143}${fruit ? '' : 'M50 97V40'}H${bank ? 120 : 165}M${fruit || orange ? '235 40' : `${sliderX} 9`}H350V220H${right}`}
        stroke="#a8b99b"
        strokeWidth="2.4"
        fill="none"
      />
      {!orange && (
        <>
          <path
            d="M50 180H105V135H177M223 135H295V180H350"
            stroke="#b6b992"
            strokeWidth="2"
            fill="none"
          />
          <Meter
            x={200}
            y={135}
            label="V"
            fraction={voltage / (bank ? 6 : mode === 'dry' ? 1.6 : 1)}
          />
        </>
      )}
      {!fruit && (
        <Meter
          x={50}
          y={120}
          label={orange ? 'µA' : 'A'}
          fraction={current / (orange ? 0.0003 : bank ? 2.5 : 0.4)}
        />
      )}
      {fruit || orange ? (
        <g>
          <rect x="165" y="18" width="70" height="44" rx="12" fill="#c4cba9" stroke="#acb990" />
          {[177, 193, 209, 225].map((x) => (
            <circle key={x} cx={x} cy="41" r="5" fill="#8d9d79" />
          ))}
          <text x="200" y="90" textAnchor="middle">
            {(load / 1000).toFixed(1)} kΩ
          </text>
        </g>
      ) : (
        <g>
          {bank && (
            <>
              <rect x="120" y="33" width="27" height="14" rx="5" fill="#c8ba94" />
              <path d="M147 40H165" stroke="#a8b99b" strokeWidth="2.4" />
              <text x="132" y="80" textAnchor="middle">
                R₀
              </text>
            </>
          )}
          <rect x="165" y="31" width="70" height="18" rx="7" fill="#c6b996" stroke="#b09e78" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M${171 + i * 5} 32v16`} stroke="#a69872" />
          ))}
          <path d={`M${sliderX} 9v22m-5-5 5 5 5-5`} stroke="#9b8b60" strokeWidth="2" fill="none" />
          <text x="200" y="88" textAnchor="middle">
            {load.toFixed(1)} Ω
          </text>
        </g>
      )}
      {fruit ? (
        <g>
          <path
            d="M200 211C184 215 190 238 172 248C131 278 157 309 200 309C243 309 268 278 228 248C210 238 217 216 200 211Z"
            fill="#d1d1a2"
            stroke="#b4bb8e"
          />
          <path d="M200 216q-5-14 4-21" stroke="#9c9b6c" strokeWidth="3" />
          <path d={`M${left} 220v${32 + depth * 12}`} stroke="#b58f68" strokeWidth="12" />
          <path d={`M${right} 220v${32 + depth * 12}`} stroke="#a8b8a6" strokeWidth="12" />
          <text x={left - 12} y="207">
            Cu
          </text>
          <text x={right - 14} y="207">
            Zn
          </text>
        </g>
      ) : orange ? (
        <g>
          <path d="M145 232h110l-9 73h-92z" fill="#e9e7cc" stroke="#b9c5a9" />
          <path d="M150 251h100l-6 50h-88z" fill="#dfbf8a" />
          <path d="M160 220l8 65" stroke="#b58f68" strokeWidth="11" />
          <path d="M240 220l-8 65" stroke="#a8b8a6" strokeWidth="11" />
          <text x="149" y="207">
            Cu
          </text>
          <text x="225" y="207">
            Zn
          </text>
        </g>
      ) : bank ? (
        <g>
          <rect x="124" y="209" width="152" height="89" rx="23" fill="#d3dbc3" stroke="#a7b998" />
          <rect x="145" y="237" width="35" height="34" rx="8" fill="#aabf99" />
          <rect x="215" y="239" width="39" height="29" rx="5" fill="#b8bd91" />
          <path d="M180 253h35m-6-5 6 5-6 5" fill="none" stroke="#96a781" />
          <path d="M160 220v17m80-17v19" stroke="#8da37c" strokeWidth="3" />
          <text x="200" y="289" textAnchor="middle">
            {charge}%
          </text>
        </g>
      ) : (
        <g>
          <rect x="160" y="199" width="80" height="44" rx="13" fill="#c0cfac" stroke="#a2b78f" />
          <path d="M170 200v43" stroke="#dfdfbf" strokeWidth="9" />
          <text x="178" y="229">
            +
          </text>
          <text x="219" y="229">
            −
          </text>
          <text x="200" y="275" textAnchor="middle">
            1.5 V
          </text>
        </g>
      )}
    </svg>
  );
}
function UIPlot({
  samples,
  current,
  voltage,
  emf,
  internal,
  bank = false,
  fruit = false,
  zoom = false,
  count = 99,
  line = true,
  limited = false,
}: {
  samples: SourceSample[];
  current: number;
  voltage: number;
  emf: number;
  internal: number;
  bank?: boolean;
  fruit?: boolean;
  zoom?: boolean;
  count?: number;
  line?: boolean;
  limited?: boolean;
}) {
  const xmax = bank ? 2.15 : fruit ? 0.00032 : 0.4,
    ymax = bank ? 5.3 : fruit ? 1.02 : 1.55,
    ymin = zoom
      ? Math.max(
          0,
          Math.min(
            bank ? 4.6 : fruit ? 0.25 : 1.1,
            Math.floor(Math.min(voltage, ...samples.map((s) => s.voltage)) * 10) / 10,
          ),
        )
      : 0,
    px = (i: number) => 45 + (i / xmax) * 310,
    py = (u: number) => 172 - ((u - ymin) / (ymax - ymin)) * 142;
  return (
    <svg
      viewBox="0 0 400 245"
      className="emf-plot"
      role="img"
      aria-label={t('电压对电流图像，点的位置与电表共用同一计算')}
    >
      <path d="M45 20V172H365" fill="none" stroke="#adba9c" />
      <text x="62" y="22">
        U/V
      </text>
      <text x="309" y="239">
        {fruit ? 'I/mA' : 'I/A'}
      </text>
      {[0, 0.5, 1].map((f, i) => (
        <g key={f}>
          <text x={px(f * xmax)} y="194" textAnchor="middle">
            {(f * xmax * (fruit ? 1000 : 1)).toFixed(fruit ? 2 : 1)}
          </text>
          <text x="36" y={py(ymin + f * (ymax - ymin)) + 5} textAnchor="end">
            {(ymin + f * (ymax - ymin)).toFixed(1)}
          </text>
        </g>
      ))}
      {zoom && <path d="M40 160l10-4-10-4 10-4" stroke="#869b78" strokeWidth="1.5" fill="none" />}
      {line && (
        <path
          d={`M${px(0)} ${py(emf)}L${px(Math.min(xmax, (emf - ymin) / internal))} ${py(Math.max(ymin, emf - internal * xmax))}`}
          stroke="#a7b38f"
          strokeWidth="2"
          strokeDasharray="5 5"
          fill="none"
        />
      )}
      {samples.slice(0, count).map((s, i) => (
        <circle key={i} cx={px(s.current)} cy={py(s.voltage)} r="4" fill="#b99a67" />
      ))}
      {limited && (
        <path
          d={`M${px(2)} ${py(emf - internal * 2)}V${py(voltage)}`}
          stroke="#bd9670"
          strokeWidth="2"
        />
      )}
      <circle
        cx={px(current)}
        cy={py(voltage)}
        r="6"
        fill="#829f79"
        stroke="#eef0de"
        strokeWidth="2"
      />
    </svg>
  );
}
function ChargePlot() {
  const px = (q: number) => 50 + ((100 - q) / 95) * 300,
    py = (e: number) => 170 - ((e - 3.4) / 2) * 140;
  return (
    <div className="emf-charge">
      <svg
        viewBox="0 0 400 220"
        role="img"
        aria-label={t('教材样例的充电宝输出端与内部锂电池电动势随电量变化')}
      >
        <path d="M50 22V170H360" fill="none" stroke="#a9b899" />
        <text x="10" y="20">
          E/V
        </text>
        {[3.5, 4, 4.5, 5].map((e) => (
          <text key={e} x="40" y={py(e) + 6} textAnchor="end">
            {e}
          </text>
        ))}
        {(['bankE', 'cellE'] as const).map((key, j) => (
          <g key={key}>
            <path
              d={CHARGE_DATA.map((s, i) => `${i ? 'L' : 'M'}${px(s.charge)} ${py(s[key])}`).join(
                ' ',
              )}
              fill="none"
              stroke={j ? '#aaa887' : '#9aaa80'}
              strokeWidth="2.4"
            />
            {CHARGE_DATA.map((s) => (
              <circle
                key={s.charge}
                cx={px(s.charge)}
                cy={py(s[key])}
                r="4"
                fill={j ? '#b79b70' : '#849b73'}
              />
            ))}
          </g>
        ))}
        {CHARGE_DATA.map((s) => (
          <text key={s.charge} x={px(s.charge)} y="195" textAnchor="middle">
            {s.charge}
          </text>
        ))}
        <text x="326" y="217">
          %
        </text>
      </svg>
      <p>
        <span>{t('充电宝输出端')}</span> · <span>{t('锂电池')}</span>
      </p>
    </div>
  );
}
export default function BatteryEmfLab() {
  const film = useShowcase(),
    initial: Mode =
      film.variant === 'r3-dry-cell-emf'
        ? 'dry'
        : film.variant === 'r3-fruit-cell-emf'
          ? 'fruit'
          : film.variant === 'r3-power-bank-research'
            ? 'bank'
            : 'lamps',
    [mode, setMode] = useState<Mode>(initial),
    [count, setCount] = useState(1),
    [r, setR] = useState(1.2),
    [load, setLoad] = useState(10),
    [depth, setDepth] = useState(3),
    [gap, setGap] = useState(1),
    [zoom, setZoom] = useState(false),
    [charge, setCharge] = useState('0'),
    [bankView, setBankView] = useState<'load' | 'charge' | 'limit'>('load');
  const c = film.chapter,
    p = film.chapterProgress,
    active: Mode = film.watch
      ? c < 2
        ? 'lamps'
        : c < 4
          ? 'dry'
          : c < 6
            ? 'fruit'
            : c === 6
              ? 'orange'
              : 'bank'
      : mode,
    n = film.watch ? (c === 0 ? Math.min(4, 1 + Math.floor(p * 4)) : 4) : count,
    ri = film.watch ? (c === 1 ? 1.2 * smooth((p - 0.25) / 0.5) : 1.2) : r,
    immersion = film.watch ? (c === 4 ? 0.6 + 2.4 * smooth(p / 0.65) : 3) : depth,
    rf = fruitResistance(film.watch ? 1 : gap, immersion),
    q = film.watch ? (c === 8 ? Math.min(5, Math.floor(p * 6)) : 0) : Number(charge),
    view = film.watch ? (c === 8 ? 'charge' : c === 9 ? 'limit' : 'load') : bankView,
    resistance = film.watch
      ? active === 'dry'
        ? 20 - 16.5 * smooth(p / 0.75)
        : active === 'fruit'
          ? c === 4
            ? 6000
            : 10000 - 8000 * smooth(p / 0.75)
          : active === 'orange'
            ? 9000 - 6000 * smooth(p / 0.75)
            : c === 9
              ? 15 - 14.2 * smooth(p / 0.75)
              : 30 - 27.5 * smooth(p / 0.75)
      : active === 'fruit' || active === 'orange'
        ? load * 1000
        : load,
    state =
      active === 'bank'
        ? regulatedBank(resistance, q)
        : active === 'fruit'
          ? loadedSource(0.95, rf, resistance, 1e7)
          : active === 'orange'
            ? loadedSource(0.95, 1200, resistance, Infinity, 100)
            : loadedSource(1.5, 1, resistance, 10000, 0.1),
    samples =
      active === 'bank'
        ? bankSamples(q)
        : active === 'orange'
          ? ORANGE_DATA
          : active === 'fruit'
            ? fruitSamples(rf)
            : drySamples(),
    fit = fitSource(samples),
    plottedVoltage = active === 'orange' ? state.loadVoltage : state.voltage,
    showZoom = film.watch ? (c === 3 ? p > 0.45 : c === 7) : zoom,
    subtitle =
      active === 'lamps'
        ? c === 1 && film.watch
          ? '内阻为零的理想电源，不会出现同样的变暗'
          : '增加并联支路，每只灯泡的路端电压反而下降'
        : active === 'dry'
          ? c === 3
            ? '直线截距给出电动势，斜率大小给出内阻'
            : '改变外电阻，同步记录电压和电流'
          : active === 'fruit'
            ? '铜锌电极组成电源，用已知电阻推得电流'
            : active === 'orange'
              ? '只有微安表：用 I × R 算电阻箱两端电压'
              : view === 'charge'
                ? '教材样例：稳压输出与内部电芯变化不同'
                : view === 'limit'
                  ? '超出拟合范围，稳压和限流会改变输出曲线'
                  : '先研究输出端的 U–I 关系，再谈等效参数';
  return (
    <section
      className="emf-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
      data-focus={
        film.watch && ([3, 5, 7, 8, 9].includes(c) || (c === 6 && p > 0.55)) ? 'plot' : 'apparatus'
      }
    >
      <p className="emf-kicker">{t(subtitle)}</p>
      {active === 'lamps' ? (
        <Lamps count={n} internal={ri} />
      ) : (
        <>
          <Bench
            mode={active}
            current={state.current}
            voltage={state.voltage}
            load={resistance}
            depth={immersion}
            gap={film.watch ? 1 : gap}
            charge={CHARGE_DATA[q].charge}
          />
          <div className="emf-readings">
            <span>
              {active === 'fruit' ? 'U/R' : 'I'}{' '}
              <b>
                {(state.current * (active === 'fruit' || active === 'orange' ? 1e6 : 1)).toFixed(
                  active === 'fruit' || active === 'orange' ? 1 : 3,
                )}{' '}
                {active === 'fruit' || active === 'orange' ? 'µA' : 'A'}
              </b>
            </span>
            <span>
              {active === 'orange' ? 'IR' : 'U'} <b>{plottedVoltage.toFixed(3)} V</b>
            </span>
          </div>
          {active === 'bank' && view === 'charge' ? (
            <ChargePlot />
          ) : (
            <>
              <UIPlot
                samples={samples}
                current={state.current}
                voltage={plottedVoltage}
                emf={fit.emf}
                internal={fit.internal}
                bank={active === 'bank'}
                fruit={active === 'fruit' || active === 'orange'}
                zoom={active === 'bank' && view === 'limit' ? false : showZoom}
                count={
                  film.watch && (c === 2 || c === 5 || c === 7)
                    ? Math.min(samples.length, 1 + Math.floor(p * samples.length))
                    : 99
                }
                line={!(film.watch && c === 2)}
                limited={active === 'bank' && view === 'limit'}
              />
              <div className="emf-fit">
                <span>E ≈ {fit.emf.toFixed(3)} V</span>
                <span>
                  {active === 'orange' ? 'r + Rₐ' : 'r'} ≈{' '}
                  {fit.internal.toFixed(active === 'fruit' || active === 'orange' ? 0 : 3)} Ω
                </span>
              </div>
              {active === 'orange' && (
                <p className="emf-note">{t('微安表内阻 100 Ω；斜率大小还包含它。')}</p>
              )}
            </>
          )}
          <p className="emf-note">
            {t(
              active === 'bank'
                ? q < 3
                  ? '金色点为教材样例数据；绿色点为示意模型，不能外推为所有产品。'
                  : '此电量曲线由教材参数重建，图点不是原始测量记录。'
                : active === 'orange'
                  ? '金色点为教材橙汁电池数据；绿色点为近似模型。'
                  : '图点和表读数来自教学模型，不是实测记录。',
            )}
          </p>
        </>
      )}
      {!film.watch && (
        <div className="emf-controls">
          <Segments
            label={t('选择电源实验')}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setLoad(m === 'fruit' || m === 'orange' ? 6 : 10);
              setZoom(false);
            }}
            options={[
              { value: 'lamps', label: t('并联灯泡') },
              { value: 'dry', label: t('干电池') },
              { value: 'fruit', label: t('梨电池') },
              { value: 'orange', label: t('橙汁电池') },
              { value: 'bank', label: t('充电宝') },
            ]}
          />
          {active === 'lamps' ? (
            <>
              <Range label={t('并联灯泡数')} value={count} min={1} max={4} onChange={setCount} />
              <Range
                label={t('电源内阻')}
                value={r}
                min={0}
                max={2}
                step={0.1}
                unit="Ω"
                onChange={setR}
              />
            </>
          ) : (
            <>
              <Range
                label={t('外部负载电阻')}
                value={load}
                min={active === 'fruit' || active === 'orange' ? 2 : active === 'bank' ? 0.8 : 3.5}
                max={active === 'fruit' || active === 'orange' ? 10 : active === 'bank' ? 30 : 20}
                step={active === 'fruit' || active === 'orange' ? 0.5 : 0.1}
                unit={active === 'fruit' || active === 'orange' ? 'kΩ' : 'Ω'}
                onChange={setLoad}
              />
              {active === 'fruit' && (
                <>
                  <Range
                    label={t('电极插入深度')}
                    value={depth}
                    min={0.5}
                    max={3}
                    step={0.1}
                    unit="cm"
                    onChange={setDepth}
                  />
                  <Range
                    label={t('电极间距模型')}
                    value={gap}
                    min={0.6}
                    max={2}
                    step={0.1}
                    unit="cm"
                    onChange={setGap}
                  />
                </>
              )}
              {active === 'bank' && (
                <>
                  <Segments
                    label={t('研究视角')}
                    value={bankView}
                    onChange={setBankView}
                    options={[
                      { value: 'load', label: t('负载曲线') },
                      { value: 'charge', label: t('电量对比') },
                      { value: 'limit', label: t('拟合边界') },
                    ]}
                  />
                  <Segments
                    label={t('教材电量状态')}
                    value={charge}
                    onChange={setCharge}
                    options={CHARGE_DATA.map((x, i) => ({
                      value: String(i),
                      label: `${x.charge}%`,
                    }))}
                  />
                </>
              )}
              {!(active === 'bank' && view !== 'load') && (
                <button type="button" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
                  {t(zoom ? '恢复纵轴零点' : '放大电压变化')}
                </button>
              )}
            </>
          )}
        </div>
      )}
      <details className="emf-details">
        <summary>{t('电源模型与测量边界')}</summary>
        <p>
          {t(
            '干电池采用 E − Ir 模型，计入 10 kΩ 电压表和 0.1 Ω 电流表；梨电池电压表取 10 MΩ。水果几何只用间距除以插入深度表示内阻趋势，不拟合真实电化学过程。橙汁方案的 U 是电阻箱电压，斜率包含 100 Ω 微安表内阻。金色样例点转录自教材；充电宝在限流区采用另行标明的示意模型，输出端的拟合参数不等于内部锂电池参数。',
          )}
        </p>
      </details>
    </section>
  );
}
