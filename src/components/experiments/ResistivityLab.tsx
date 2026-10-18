import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  fitWireSamples,
  heatedFilament,
  inferResistivity,
  seriesWireComparison,
  wireMeasurement,
  wireState,
  type MeterConnection,
  type WireMaterial,
} from '../../models/resistivity-lab';
import '../../styles/resistivity-lab.css';
const smooth = (v: number) => {
  const p = Math.max(0, Math.min(1, v));
  return p * p * (3 - 2 * p);
};
function Meter({
  x,
  y,
  value,
  maximum,
  label,
  radius = 23,
}: {
  x: number;
  y: number;
  value: number;
  maximum: number;
  label: string;
  radius?: number;
}) {
  const a = -0.95 + 1.9 * Math.min(1, value / maximum);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={radius} fill="#e7eddb" stroke="#a8bba0" strokeWidth="1.3" />
      <path
        d={`M${-radius * 0.75} ${-radius * 0.2}Q0 ${-radius * 1.2} ${radius * 0.75} ${-radius * 0.2}`}
        fill="none"
        stroke="#c1cbb2"
      />
      <path
        d={`M0 2L${radius * 0.68 * Math.sin(a)} ${2 - radius * 0.68 * Math.cos(a)}`}
        stroke="#a78d59"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <text y={radius * 0.74} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
function WireBench({
  source,
  connection,
  material,
  finite,
  id,
}: {
  source: number;
  connection: MeterConnection;
  material: WireMaterial;
  finite: boolean;
  id: string;
}) {
  const w = wireState(0.5, 0.2, material),
    s = wireMeasurement(w, source, 10, connection, finite ? 0.2 : 0, finite ? 1000 : 1e12),
    end = 200;
  return (
    <>
      <svg
        className="rho-apparatus"
        viewBox="0 0 440 265"
        role="img"
        aria-label={t('有效电阻丝、串联电流表、并联电压表与滑动变阻器')}
      >
        <defs>
          <linearGradient id={`${id}-wire`}>
            <stop stopColor="#c4ccb5" />
            <stop offset=".5" stopColor="#f2ecd0" />
            <stop offset="1" stopColor="#a8b29e" />
          </linearGradient>
        </defs>
        <path
          d={`M60 100V137M60 183V230H150M205 230H265M319 230H390V174H${end}V100`}
          fill="none"
          stroke="#95aa92"
          strokeWidth="2.4"
        />
        <path
          d={
            connection === 'external'
              ? `M60 100V40H197M243 40H${end + 42}V100H${end}`
              : `M60 230H30V40H197M243 40H${end + 42}V100H${end}`
          }
          fill="none"
          stroke="#b4b58d"
          strokeWidth="2"
        />
        <rect x="50" y="91" width="302" height="18" rx="6" fill="#e7e9d4" />
        <path d="M60 100H340" stroke={`url(#${id}-wire)`} strokeWidth="4" />
        <path d={`M60 100H${end}`} stroke="#9c9f7b" strokeWidth="4" />
        <path
          d={`M60 92V108M${end} 92V108`}
          stroke="#a98f60"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect x="51" y="119" width="300" height="24" rx="4" fill="#eee8ce" />
        {Array.from({ length: 21 }, (_, i) => (
          <path
            key={i}
            d={`M${60 + i * 14} 119v${i % 5 === 0 ? 14 : 7}`}
            stroke="#b4ab8b"
            strokeWidth="1"
          />
        ))}
        <path d={`M60 152H${end}`} stroke="#b2a578" strokeWidth="1.2" />
        <Meter x={60} y={160} value={s.ammeterCurrent} maximum={0.3} label="A" />
        <Meter x={220} y={40} value={s.voltage} maximum={3} label="V" />
        <rect x="150" y="215" width="55" height="30" rx="8" fill="#c4ceb0" stroke="#9db18f" />
        <path d="M160 230h9m-4-4v8M188 230h9" stroke="#8a9d7d" strokeWidth="1.5" />
        <rect x="265" y="222" width="54" height="16" rx="5" fill="#cbbf98" stroke="#a89e7a" />
        <path d="M292 206V221m-5-5 5 5 5-5" fill="none" stroke="#9e946b" strokeWidth="2" />
      </svg>
      <div className="rho-readout">
        <span>
          I <b>{(s.ammeterCurrent * 1000).toFixed(1)} mA</b>
        </span>
        <span>
          U <b>{s.voltage.toFixed(3)} V</b>
        </span>
        <span>
          U/I <b>{s.apparentResistance.toFixed(3)} Ω</b>
        </span>
      </div>
    </>
  );
}
function UIPlot({
  source,
  material,
  connection,
  finite,
}: {
  source: number;
  material: WireMaterial;
  connection: MeterConnection;
  finite: boolean;
}) {
  const w = wireState(0.5, 0.2, material),
    fit = fitWireSamples(w, connection, finite ? 0.2 : 0, finite ? 1000 : 1e12),
    s = wireMeasurement(w, source, 10, connection, finite ? 0.2 : 0, finite ? 1000 : 1e12),
    px = (i: number) => 48 + (i / 0.3) * 340,
    py = (u: number) => 162 - (u / 3) * 128;
  return (
    <div className="rho-plot">
      <span>U / V</span>
      <svg
        viewBox="0 0 440 210"
        role="img"
        aria-label={t('U–I 图像的斜率给出由电表示数求得的电阻')}
      >
        <path d="M48 25V162H398" fill="none" stroke="#b2bea8" strokeWidth="1.5" />
        {[0, 1, 2, 3].map((u) => (
          <g key={u}>
            <path d={`M48 ${py(u)}H398`} stroke="#e0e6d5" />
            <text x="34" y={py(u) + 6} textAnchor="end">
              {u}
            </text>
          </g>
        ))}
        {[0, 100, 200, 300].map((i) => (
          <text key={i} x={px(i / 1000)} y="191" textAnchor="middle">
            {i}
          </text>
        ))}
        <path
          d={`M48 162L${px(s.ammeterCurrent)} ${py(s.voltage)}`}
          stroke="#8ba385"
          strokeWidth="2.5"
        />
        {fit.samples
          .filter((v) => v.sourceVoltage <= source)
          .map((v, i) => (
            <circle key={i} cx={px(v.ammeterCurrent)} cy={py(v.voltage)} r="4" fill="#b89f67" />
          ))}
        <circle cx={px(s.ammeterCurrent)} cy={py(s.voltage)} r="5" fill="#819e80" />
      </svg>
      <div className="rho-plot-unit">I / mA</div>
    </div>
  );
}
function Factors({ selected }: { selected: number }) {
  const s = seriesWireComparison(),
    parts = [
      [40, 90],
      [100, 200],
      [210, 260],
      [270, 320],
    ],
    names = ['a', 'b', 'c', 'd'];
  return (
    <>
      <svg
        className="rho-apparatus"
        viewBox="0 0 440 245"
        role="img"
        aria-label={t('四段导体串联，各段并联电压表；每次只改变一种因素')}
      >
        <path
          d="M40 100V205H176M215 205H273M318 205H359V100H320M90 100H100M200 100H210M260 100H270"
          fill="none"
          stroke="#93a98f"
          strokeWidth="2.3"
        />
        {parts.map(([a, b], i) => (
          <g key={i} opacity={i === 0 || i === selected ? 1 : 0.42}>
            <path
              d={`M${a} 100V43H${(a + b) / 2 - 17}M${(a + b) / 2 + 17} 43H${b}V100`}
              fill="none"
              stroke="#b2b78d"
              strokeWidth="1.8"
            />
            <Meter
              x={(a + b) / 2}
              y={43}
              radius={17}
              value={s.wires[i].voltage}
              maximum={2}
              label="V"
            />
            <path
              d={`M${a} 100H${b}`}
              stroke={i === 3 ? '#829c98' : '#adae8d'}
              strokeWidth={i === 2 ? 5.66 : 4}
              strokeLinecap="butt"
            />
            <text x={(a + b) / 2} y="135" textAnchor="middle">
              {names[i]}
            </text>
          </g>
        ))}
        <rect x="176" y="191" width="39" height="28" rx="7" fill="#c8d1b2" stroke="#a6b997" />
        <path d="M183 205h7m-3.5-3.5v7M202 205h7" stroke="#889e7a" strokeWidth="1.2" />
        <rect x="273" y="197" width="45" height="16" rx="5" fill="#d2c49a" stroke="#aaa078" />
        <path d="M297 181V196m-5-5 5 5 5-5" fill="none" stroke="#a0956e" strokeWidth="1.5" />
      </svg>
      <div className="rho-comparison">
        <span>
          a <b>{s.wires[0].voltage.toFixed(3)} V</b>
        </span>
        <span>
          {names[selected]} <b>{s.wires[selected].voltage.toFixed(3)} V</b>
        </span>
        <strong>
          U{names[selected]} / Uₐ = {(s.wires[selected].voltage / s.wires[0].voltage).toFixed(2)}
        </strong>
      </div>
      <div className="rho-condition">
        {t(
          selected === 1
            ? 'b 只有长度加倍，横截面积和材料相同'
            : selected === 2
              ? 'c 只有横截面积加倍，长度和材料相同'
              : 'd 只有材料不同，长度和横截面积相同',
        )}
      </div>
      <div className="rho-condition">
        {t('四段电流相同')}：{(s.current * 1000).toFixed(1)} mA
      </div>
    </>
  );
}
function Temperature({ temperature, id }: { temperature: number; id: string }) {
  const s = heatedFilament(temperature),
    heat = (temperature - 20) / 280,
    coil = Array.from(
      { length: 81 },
      (_, i) => `${i ? 'L' : 'M'}${94 + i * 1.35} ${94 + Math.sin((i * Math.PI) / 4) * 5}`,
    ).join(' ');
  return (
    <>
      <svg
        className="rho-apparatus"
        viewBox="0 0 440 265"
        role="img"
        aria-label={t('酒精灯加热一段灯丝，与它串联的小灯泡变暗')}
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#eed896" stopOpacity={s.relativeLampPower * 0.8} />
            <stop offset="1" stopColor="#eed896" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M94 94H54V224H165M205 224H370V94H332M202 94H272"
          fill="none"
          stroke="#94a88d"
          strokeWidth="2.4"
        />
        <path d={coil} fill="none" stroke="#9b9c82" strokeWidth="2.5" />
        <circle cx="302" cy="94" r="54" fill={`url(#${id}-glow)`} />
        <circle cx="302" cy="94" r="30" fill="#f4edcd" fillOpacity=".45" stroke="#c3c9a7" />
        <path
          d="M272 94H285l5-6 6 12 6-12 6 12 6-6H332"
          fill="none"
          stroke="#bd9a58"
          strokeWidth={1.5 + s.relativeLampPower * 1.5}
        />
        <path d="M128 192Q126 161 153 160Q180 161 178 192Z" fill="#c0cdbc" stroke="#9db29f" />
        <rect x="147" y="149" width="12" height="14" rx="3" fill="#bcaa82" />
        {heat > 0 && (
          <path
            d="M153 149Q131 137 153 104Q174 135 153 149"
            fill="#e2bd76"
            opacity={0.3 + 0.5 * heat}
          />
        )}
        <rect x="165" y="210" width="40" height="28" rx="7" fill="#c4cfae" stroke="#a4b894" />
        <path d="M172 224h7m-3.5-3.5v7M192 224h7" stroke="#8b9e7e" strokeWidth="1.3" />
      </svg>
      <div className="rho-readout">
        <span>
          {t('被加热灯丝')} <b>{temperature.toFixed(0)} °C</b>
        </span>
        <span>
          I <b>{(s.current * 1000).toFixed(1)} mA</b>
        </span>
      </div>
      <div className="rho-condition">
        {t('指示灯相对电功率')}：{(s.relativeLampPower * 100).toFixed(0)}%
      </div>
    </>
  );
}
export default function ResistivityLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState(
      film.variant === 'r3-resistance-factors'
        ? 'factors'
        : film.variant === 'r3-resistivity-temperature'
          ? 'temperature'
          : film.variant === 'r3-wire-resistivity'
            ? 'measurement'
            : 'ohm',
    ),
    [source, setSource] = useState(2),
    [material, setMaterial] = useState<WireMaterial>('nickel-copper'),
    [selected, setSelected] = useState('1'),
    [temperature, setTemperature] = useState(20),
    [connection, setConnection] = useState<MeterConnection>('external'),
    [measuredLength, setMeasuredLength] = useState(0.5),
    [measuredDiameter, setMeasuredDiameter] = useState(0.2);
  const c = film.chapter,
    p = smooth((film.chapterProgress - 0.12) / 0.7),
    active = film.watch
      ? c === 0
        ? 'ohm'
        : c <= 3
          ? 'factors'
          : c === 4
            ? 'temperature'
            : 'measurement'
      : mode,
    e = film.watch ? (c === 0 || c === 5 ? 0.3 + 2.7 * p : 3) : source,
    mat = film.watch ? 'nickel-copper' : material,
    conn = film.watch ? (c === 6 && p > 0.5 ? 'internal' : 'external') : connection,
    finite = active === 'measurement',
    fit = fitWireSamples(wireState(0.5, 0.2, mat), conn, finite ? 0.2 : 0, finite ? 1000 : 1e12),
    rho = inferResistivity(
      fit.slope,
      film.watch ? 0.5 : measuredLength,
      film.watch ? 0.2 : measuredDiameter,
    );
  return (
    <section className="rho-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="rho-kicker">
        {t(
          active === 'ohm'
            ? '温度不变时，改变的是电流与电压'
            : active === 'factors'
              ? '让四段导体流过同一电流'
              : active === 'temperature'
                ? '只加热串联灯丝，观察另一只灯泡'
                : '先测电阻，再加入有效长度与直径',
        )}
      </p>
      {active === 'factors' ? (
        <Factors selected={film.watch ? c : Number(selected)} />
      ) : active === 'temperature' ? (
        <Temperature temperature={film.watch ? 20 + 280 * p : temperature} id={id} />
      ) : (
        <>
          <WireBench source={e} connection={conn} material={mat} finite={finite} id={id} />
          <UIPlot source={e} material={mat} connection={conn} finite={finite} />
          {active === 'measurement' && (
            <div className="rho-inference">
              <span>
                l = {(film.watch ? 0.5 : measuredLength).toFixed(2)} m · d ={' '}
                {(film.watch ? 0.2 : measuredDiameter).toFixed(3)} mm
              </span>
              <strong>ρ = {(rho * 1e7).toFixed(3)} × 10⁻⁷ Ω·m</strong>
              <span>
                {t(
                  conn === 'external'
                    ? '外接：电流表包含电压表支路电流'
                    : '内接：电压表包含电流表两端电压',
                )}
              </span>
            </div>
          )}
        </>
      )}
      <div className="rho-note">{t('读数与图点来自教学模型；不是实测数据。')}</div>
      {!film.watch && (
        <div className="rho-controls">
          <Segments
            label={t('选择电阻实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'ohm', label: t('电压与电流') },
              { value: 'factors', label: t('控制变量') },
              { value: 'temperature', label: t('温度影响') },
              { value: 'measurement', label: t('测电阻率') },
            ]}
          />
          {mode === 'factors' ? (
            <Segments
              label={t('比较哪一段')}
              value={selected}
              onChange={setSelected}
              options={[
                { value: '1', label: t('长度 b') },
                { value: '2', label: t('面积 c') },
                { value: '3', label: t('材料 d') },
              ]}
            />
          ) : mode === 'temperature' ? (
            <Range
              label={t('加热灯丝温度')}
              value={temperature}
              min={20}
              max={300}
              step={5}
              unit="°C"
              onChange={setTemperature}
            />
          ) : (
            <>
              <Range
                label={t('电源电压')}
                value={source}
                min={0.3}
                max={3}
                step={0.1}
                unit="V"
                onChange={setSource}
              />
              <Segments
                label={t('导体材料')}
                value={material}
                onChange={setMaterial}
                options={[
                  { value: 'copper', label: t('铜') },
                  { value: 'nickel-copper', label: t('镍铜合金') },
                  { value: 'nichrome', label: t('镍铬合金') },
                ]}
              />
              {mode === 'measurement' && (
                <>
                  <Segments
                    label={t('电流表接法')}
                    value={connection}
                    onChange={setConnection}
                    options={[
                      { value: 'external', label: t('外接') },
                      { value: 'internal', label: t('内接') },
                    ]}
                  />
                  <Range
                    label={t('录入的有效长度')}
                    value={measuredLength}
                    min={0.4}
                    max={0.6}
                    step={0.01}
                    unit="m"
                    onChange={setMeasuredLength}
                  />
                  <Range
                    label={t('录入的直径')}
                    value={measuredDiameter}
                    min={0.18}
                    max={0.22}
                    step={0.001}
                    unit="mm"
                    onChange={setMeasuredDiameter}
                  />
                  <p>{t('改变录入值只改变分析结果，不会改变正在测量的导线。')}</p>
                </>
              )}
            </>
          )}
        </div>
      )}
      <details className="rho-details">
        <summary>{t('电阻率模型与电表误差')}</summary>
        <p>
          {t(
            '均匀导线采用 R = ρl/S，材料值取教材 20 °C 近似。控制变量实验的电压表视为理想；测电阻率模式计入电流表 0.2 Ω、电压表 1 kΩ 的负载。加热灯丝用线性温度系数的定性模型，指示灯用电功率显示相对明暗，不声称计算真实光谱或灯丝温度。忽略接触电阻和被测导线自热。',
          )}
        </p>
      </details>
    </section>
  );
}
