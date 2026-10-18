import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  photoResistance,
  ntcResistance,
  reedSensor,
  lightControl,
  bimetalState,
  pressureResistance,
  PRESSURE_DATA,
  sensorShot,
  type SensorApparatus,
} from '../../models/sensor-control-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const options = [
  { value: 'reed', label: '磁控干簧管' },
  { value: 'light', label: '光敏电阻测量' },
  { value: 'temperature', label: '热敏电阻与水浴' },
  { value: 'alarm', label: '门窗报警继电器' },
  { value: 'control', label: '光控晶体管与继电器' },
  { value: 'bimetal', label: '双金属温度开关' },
  { value: 'pressure', label: '薄膜压力传感器研究' },
] as const;
const initial = (v?: string): SensorApparatus =>
  v?.includes('photoresistor')
    ? 'light'
    : v?.includes('thermistor')
      ? 'temperature'
      : v?.includes('alarm')
        ? 'alarm'
        : v?.includes('light-controlled')
          ? 'control'
          : v?.includes('bimetal')
            ? 'bimetal'
            : v?.includes('pressure')
              ? 'pressure'
              : 'reed';
export default function SensorControlLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [apparatus, setApparatus] = useState<SensorApparatus>(() => initial(film.variant)),
    [distance, setDistance] = useState(0.02),
    [lux, setLux] = useState(100),
    [temperature, setTemperature] = useState(25),
    [force, setForce] = useState(1),
    [resistor, setResistor] = useState('sensitive'),
    [output, setOutput] = useState('led'),
    [r1, setR1] = useState(10);
  const s = film.watch
    ? sensorShot(film.chapter, film.chapterProgress)
    : {
        apparatus,
        distance,
        lux,
        temperature,
        force,
        ordinary: resistor === 'ordinary',
        water: true,
        relay: output === 'relay',
        sort: false,
        stage: -1,
        progress: 0,
      };
  const reed = reedSensor(s.distance),
    light = lightControl(s.lux, (film.watch ? 10 : r1) * 1000, s.relay),
    metal = bimetalState(s.temperature),
    pressure = pressureResistance(s.force);
  const tipY =
    132 -
    (Math.min(metal.deflection, bimetalState(60).deflection) * 39) / bimetalState(60).deflection;
  const resistance =
    s.apparatus === 'temperature'
      ? ntcResistance(s.temperature)
      : s.apparatus === 'pressure'
        ? pressure.resistance
        : photoResistance(s.lux, s.ordinary);
  const meter = (x: number, y: number, value: number) => (
    <g>
      <rect x={x} y={y} width="90" height="120" rx="13" fill="#d6e1cb" stroke="#aec29f" />
      <rect x={x + 9} y={y + 12} width="72" height="31" rx="4" fill="#f5f7ec" />
      <text x={x + 45} y={y + 34} textAnchor="middle">
        {(value / 1000).toFixed(2)}
      </text>
      <circle cx={x + 45} cy={y + 73} r="18" fill="#b6c9a7" stroke="#9fb58e" />
      <path d={`M${x + 45} ${y + 73}l12-9`} stroke="#6f8d64" strokeWidth="3" />
      <text x={x + 45} y={y + 110} textAnchor="middle">
        kΩ
      </text>
    </g>
  );
  const ldr = (x: number, y: number, ordinary = false) => (
    <g>
      {ordinary ? (
        <rect x={x - 26} y={y - 12} width="52" height="24" rx="5" fill="#d9c49a" stroke="#b6a071" />
      ) : (
        <>
          <circle cx={x} cy={y} r="25" fill="#d9bd83" stroke="#b59c68" />
          <path
            d={`M${x - 15} ${y - 15}h28v7h-28v7h28v7h-28v7h28`}
            fill="none"
            stroke="#a98a54"
            strokeWidth="2.5"
          />
        </>
      )}
    </g>
  );
  const lamp = (x: number, y: number, on: boolean, label = '') => (
    <g>
      <circle cx={x} cy={y} r="28" fill="#eed68b" opacity={on ? 0.35 : 0} />
      <circle cx={x} cy={y} r="17" fill={on ? '#f0d887' : '#e3e9d8'} stroke="#b1a979" />
      <path d={`M${x - 9} ${y - 9}l18 18m-18 0 18-18`} stroke="#ac975d" strokeWidth="2" />
      {label && (
        <text x={x} y={y + 42} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
  return (
    <div className="textbook-em sensor-control-lab">
      <div className="textbook-em-state">
        <span>{t(options.find((x) => x.value === s.apparatus)!.label)}</span>
        <span>
          {s.apparatus === 'pressure'
            ? `F = ${s.force.toFixed(1)} N`
            : s.apparatus === 'temperature' || s.apparatus === 'bimetal'
              ? `T = ${s.temperature.toFixed(1)} °C`
              : s.apparatus === 'light' || s.apparatus === 'control'
                ? `${s.lux.toFixed(0)} lx`
                : `d = ${(s.distance * 1000).toFixed(0)} mm`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 325"
        role="img"
        aria-label={t('从敏感元件到电表、放大器与执行装置的实际连接')}
      >
        <defs>
          <linearGradient id={`${id}-glass`}>
            <stop stopColor="#edf5e7" stopOpacity=".5" />
            <stop offset="1" stopColor="#b7cdb1" stopOpacity=".15" />
          </linearGradient>
        </defs>
        {(s.apparatus === 'reed' || s.apparatus === 'alarm') && (
          <>
            {s.apparatus === 'alarm' && (
              <>
                <path d="M32 30H200V123" fill="none" stroke="#b6c5a7" strokeWidth="10" />
                <path
                  d={`M44 40H${194 - s.distance * 1400}V119H44Z`}
                  fill="#e0e8d5"
                  stroke="#bac9ac"
                />
              </>
            )}
            <g transform={`translate(0 ${s.apparatus === 'alarm' ? 80 : 20})`}>
              <rect
                x="65"
                y="73"
                width="121"
                height="30"
                rx="15"
                fill={`url(#${id}-glass)`}
                stroke="#b0c7a4"
              />
              <path
                d={`M35 88H119L137 ${reed.closed ? 88 : 82}M214 88H144L126 ${reed.closed ? 88 : 94}`}
                stroke="#9eae90"
                strokeWidth="3"
                fill="none"
              />
              <g transform={`translate(0 ${-s.distance * 900})`}>
                <rect x="101" y="43" width="66" height="20" rx="3" fill="#a3c0ab" />
                <path d="M134 43h30q3 0 3 3v14q0 3-3 3h-30Z" fill="#c3a26b" />
                <text className="em-small" x="117" y="58">
                  N
                </text>
                <text className="em-small" x="148" y="58">
                  S
                </text>
              </g>
              {s.apparatus === 'reed' ? (
                <>
                  <path
                    d="M35 88V212H143M162 212H278V88H214"
                    stroke="#8fa381"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path d="M143 200v24m8-19v14m0-7h11" stroke="#a29468" strokeWidth="3" />
                  {lamp(278, 148, reed.closed)}
                </>
              ) : (
                <>
                  <path
                    d="M35 88V156H93M112 156H214V88"
                    fill="none"
                    stroke="#90a483"
                    strokeWidth="2"
                  />
                  <path d="M93 145v22m8-18v14m0-7h11" stroke="#a29468" strokeWidth="3" />
                  <rect
                    x="197"
                    y="107"
                    width="34"
                    height="28"
                    rx="6"
                    fill={reed.closed ? '#bed3b1' : '#dce5d0'}
                    stroke="#93ac83"
                  />
                  <text x="214" y="127" textAnchor="middle">
                    K
                  </text>
                </>
              )}
            </g>
            {s.apparatus === 'alarm' && (
              <>
                <path d="M214 201H246" stroke="#c4d0b7" strokeDasharray="4 4" />
                <path
                  d="M214 236H251V201M280 160H298V159M298 125H335V270H35V236M314 234H335M280 234H285"
                  stroke="#95aa84"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="280" cy="160" r="3" fill="#8ea47c" />
                <circle cx="280" cy="234" r="3" fill="#8ea47c" />
                <path
                  d={reed.closed ? 'M251 201L280 160' : 'M251 201L280 234'}
                  stroke="#8ea47c"
                  strokeWidth="3"
                />
                {lamp(298, 142, reed.closed, 'LED')}
                <path
                  d="M285 223H299L314 213V252L299 242H285Z"
                  fill={reed.closed ? '#dce5d1' : '#bdcda9'}
                  stroke="#8fa47f"
                />
              </>
            )}
          </>
        )}
        {(s.apparatus === 'light' || s.apparatus === 'temperature') && (
          <>
            {meter(232, 89, resistance)}
            <path
              d="M251 209V258H105V178M302 209V277H137V178"
              fill="none"
              stroke="#b28e59"
              strokeWidth="2"
            />
            {s.apparatus === 'light' ? (
              <>
                {ldr(121, 157, s.ordinary)}
                <path
                  d="M45 53l40 65M87 37l26 77M131 34l3 76"
                  stroke="#cbb777"
                  strokeWidth="3"
                  opacity={Math.min(0.85, s.lux / 500)}
                />
                {s.lux < 10 && (
                  <path d="M46 103Q84 83 156 91l20 22q-56-13-125 12Z" fill="#b5c5a9" opacity=".8" />
                )}
              </>
            ) : (
              <>
                {(s.water || s.temperature < 22) && (
                  <>
                    <path
                      d="M56 108V223Q56 235 69 235H168Q181 235 181 223V108"
                      fill={`url(#${id}-glass)`}
                      stroke="#adc4a2"
                      strokeWidth="2"
                    />
                    <path
                      d="M57 153H180V222Q180 234 168 234H69Q57 234 57 222Z"
                      fill="#c9dfcf"
                      opacity=".65"
                    />
                  </>
                )}
                {!s.water && s.temperature >= 22 && (
                  <path
                    d="M63 169q15-23 40-18l32 9 15 24-18 25-23 3-25-15Z"
                    fill="#d7c9a5"
                    opacity=".75"
                  />
                )}
                <path d="M105 178l11 10M137 178l-11 10" stroke="#9daf94" strokeWidth="2" />
                <circle cx="121" cy="190" r="7" fill="#b69b60" />
                <path d="M146 67V202" stroke="#d3ddc9" strokeWidth="10" strokeLinecap="round" />
                <path
                  d={`M146 201V${195 - s.temperature * 1.35}`}
                  stroke="#b7955e"
                  strokeWidth="4"
                />
                <circle cx="146" cy="206" r="7" fill="#b7955e" />
              </>
            )}
          </>
        )}
        {s.apparatus === 'control' && (
          <>
            <path
              d="M55 51H248M55 51V85M55 121V178M55 222V263H248V229M55 148H172M215 168V118M215 75V51"
              fill="none"
              stroke="#94aa85"
              strokeWidth="2"
            />
            <rect x="43" y="85" width="24" height="36" rx="4" fill="#d3ddc5" stroke="#a5b794" />
            <text x="82" y="108">
              R₁
            </text>
            {ldr(55, 200)}
            <path d="M19 157l18 15m-12-2 12 2-4-11" stroke="#bea568" strokeWidth="2" />
            <path
              d="M172 128V189M172 148l43-28M172 163l43 32V229H248M204 188l11 7-4-12"
              stroke="#869f79"
              strokeWidth="2.5"
              fill="none"
            />
            {s.relay ? (
              <>
                <rect
                  x="199"
                  y="75"
                  width="32"
                  height="43"
                  rx="7"
                  fill={light.on ? '#b5cfa5' : '#dce5d0'}
                  stroke="#8ea77e"
                />
                <text x="215" y="102" textAnchor="middle">
                  K
                </text>
                <path
                  d="M215 75H268V118H215M258 100l10-12 10 12Zm0-12h20"
                  stroke="#a4b794"
                  fill="none"
                  strokeWidth="2"
                />
                <path d="M55 51H305V93M305 128V263H248" stroke="#91a881" strokeWidth="2" />
                <path
                  d={light.on ? 'M305 93V128' : 'M305 93l19 29'}
                  stroke="#8b9f7b"
                  strokeWidth="2.5"
                />
                {lamp(305, 201, light.on)}
              </>
            ) : (
              <>
                <rect
                  x="207"
                  y="53"
                  width="16"
                  height="20"
                  rx="3"
                  fill="#c4d3b5"
                  stroke="#a5b994"
                />
                <circle cx="215" cy="95" r="23" fill="#e5c77b" opacity={light.on ? 0.5 : 0} />
                <path
                  d="M204 84l22 11-22 11Zm24 0v22"
                  fill="#cddcbd"
                  stroke="#91a37f"
                  strokeWidth="2"
                />
                <text x="264" y="97">
                  LED
                </text>
              </>
            )}
            <text x="55" y="35">
              +6 V
            </text>
            <text x="55" y="287">
              0 V
            </text>
            <text x="137" y="225">
              VT
            </text>
          </>
        )}
        {s.apparatus === 'bimetal' && (
          <>
            <path d="M50 68V170M50 168H227" stroke="#acbc9b" strokeWidth="5" />
            <path
              d={`M55 129Q119 129 183 ${tipY - 3}`}
              fill="none"
              stroke="#b69760"
              strokeWidth="9"
            />
            <path
              d={`M55 135Q119 135 183 ${tipY + 3}`}
              fill="none"
              stroke="#a3baa1"
              strokeWidth="6"
            />
            <path
              d="M183 93H233V130M233 167V205H40V195M40 175V132H55"
              stroke="#9ab08b"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="183" cy="93" r="4" fill="#98ad88" />
            <circle cx="183" cy={tipY} r="4" fill="#b49b65" />
            <rect
              x="219"
              y="130"
              width="29"
              height="37"
              rx="5"
              fill={metal.contact ? '#bad0ac' : '#e0e7d5'}
              stroke="#9db28e"
            />
            <text x="233" y="155" textAnchor="middle">
              K
            </text>
            <path d="M30 175H50M34 195H46" stroke="#a28f62" strokeWidth="3" />
            <path
              d="M65 237H51V280H170M190 280H315V237M197 237H285"
              fill="none"
              stroke="#9aad8c"
              strokeWidth="2"
            />
            <path d="M170 270V290M180 274V286M180 280H190" stroke="#a28f62" strokeWidth="3" />
            <path
              d={metal.heater ? 'M285 237H315' : 'M285 237l26-18'}
              stroke="#8ca17d"
              strokeWidth="3"
            />
            <path d="M233 164L300 222" stroke="#b3c2a4" strokeDasharray="4 4" />
            <rect
              x="65"
              y="216"
              width="132"
              height="43"
              rx="9"
              fill={metal.heater ? '#e9d4a0' : '#e2e9d8'}
              stroke="#b9b88b"
            />
            <path
              d="M79 235h12v11h12v-11h12v11h12v-11h12v11h12v-11h12v11h12"
              stroke="#b09b64"
              fill="none"
              strokeWidth="2"
            />
          </>
        )}
        {s.apparatus === 'pressure' && !s.sort && (
          <>
            <path
              d="M110 165H185M180 165V271M152 271H210"
              stroke="#acbc9a"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <ellipse cx="147" cy="154" rx="23" ry="6" fill="#b99e68" />
            <path d="M124 148H171" stroke="#91ad84" strokeWidth="6" />
            <rect x="128" y="115" width="38" height="30" rx="4" fill="#c7d1b9" stroke="#a5b396" />
            <path
              d="M90 115H205V218H90V115M147 218V232"
              fill="none"
              stroke="#96a98b"
              strokeWidth="4"
            />
            {Array.from(
              { length: Math.max(0, Math.min(15, Math.round(s.force / 0.5) - 1)) },
              (_, i) => (
                <rect
                  key={i}
                  x="126"
                  y={230 + i * 3}
                  width="42"
                  height="3"
                  rx="2"
                  fill="#bdcab0"
                  stroke="#9fb390"
                />
              ),
            )}
            <path
              d="M171 155H244V211M168 160H305V211"
              stroke="#b18e58"
              fill="none"
              strokeWidth="2"
            />
            {meter(231, 91, resistance)}
          </>
        )}
        {s.apparatus === 'pressure' && s.sort && (
          <>
            <path
              d="M25 140H180L298 140M180 140L298 222"
              stroke="#b0c09f"
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <path
              d="M65 167H180M102 167l-12 16h24Z"
              fill="#bac9ac"
              stroke="#93aa86"
              strokeWidth="3"
            />
            <ellipse cx="162" cy="177" rx="18" ry="5" fill="#b89a60" />
            <path
              d={s.force >= 1 ? 'M180 140l51 35' : 'M180 140h63'}
              stroke="#819f76"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <g
              transform={`translate(${40 + (s.progress % 0.5) * 2 * 250} ${s.force >= 1 && s.progress % 0.5 > 0.28 ? 140 + (((s.progress % 0.5) - 0.28) / 0.22) * 80 : 118})`}
            >
              <circle r={s.force >= 1 ? 19 : 14} fill="#bcbd7f" />
              <path d="M0-16q5-13 11-9" stroke="#7c956d" strokeWidth="3" />
            </g>
            <path d="M162 181V235H235" stroke="#9eaf8b" fill="none" />
            <rect x="235" y="218" width="73" height="36" rx="7" fill="#d8e3ca" stroke="#a8bc98" />
            <text x="271" y="241" textAnchor="middle">
              K
            </text>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {s.apparatus === 'alarm'
          ? t(reed.closed ? '门关闭' : '门开启：报警')
          : s.apparatus === 'light'
            ? t(s.ordinary ? '普通电阻对照' : '梳状电极光敏面')
            : s.apparatus === 'temperature'
              ? t(s.water ? '绝缘探头水浴测量' : '冷水与手温的对照')
              : s.apparatus === 'bimetal'
                ? t(metal.heater ? '常闭触点给加热器供电' : '达到60℃，继电器切断加热')
                : s.apparatus === 'pressure'
                  ? t(
                      s.sort
                        ? s.force >= 1
                          ? '大苹果进入下通道'
                          : '小苹果进入上通道'
                        : '均匀加载到敏感面',
                    )
                  : null}
      </p>
      <div className="textbook-em-meters">
        {s.stage === 10 && (
          <span>|ΔR/ΔF| = {(Math.abs(pressure.slope) / 1000).toFixed(2)} kΩ/N</span>
        )}
        <span>
          {s.apparatus === 'reed' || s.apparatus === 'alarm'
            ? `${t('磁场')} ${(reed.field * 1000).toFixed(1)} mT`
            : s.apparatus === 'bimetal'
              ? t(metal.contact ? '感温触点闭合' : '感温触点断开')
              : s.apparatus === 'control'
                ? `IB = ${(light.baseCurrent * 1e6).toFixed(1)} μA · IC = ${(light.collectorCurrent * 1000).toFixed(1)} mA`
                : `R = ${(resistance / 1000).toFixed(2)} kΩ`}
        </span>
      </div>
      {((s.apparatus === 'temperature' && s.water) || (s.apparatus === 'pressure' && !s.sort)) && (
        <svg
          className="textbook-em-chart"
          viewBox="0 0 360 120"
          role="img"
          aria-label={t('传感器特性曲线与当前工作点')}
        >
          <path d="M30 12V96H333" fill="none" stroke="#c5d4b8" />
          {s.apparatus === 'pressure' ? (
            <>
              {PRESSURE_DATA.map((p) => (
                <circle
                  key={p.force}
                  cx={30 + (p.force / 8) * 300}
                  cy={96 - (p.resistance / 60000) * 77}
                  r="3"
                  fill="#a8b995"
                />
              ))}
              <circle
                cx={30 + (s.force / 8) * 300}
                cy={96 - (pressure.resistance / 60000) * 77}
                r="5"
                fill="#b19155"
              />
              <text x="280" y="118">
                F / N
              </text>
            </>
          ) : (
            <>
              <path
                d={Array.from(
                  { length: 91 },
                  (_, i) =>
                    `${i ? 'L' : 'M'}${30 + (i / 90) * 300} ${96 - (ntcResistance(i) / 35000) * 77}`,
                ).join(' ')}
                stroke="#88a87b"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx={30 + (s.temperature / 90) * 300}
                cy={96 - (ntcResistance(s.temperature) / 35000) * 77}
                r="4"
                fill="#b19155"
              />
              <text x="280" y="118">
                T / °C
              </text>
            </>
          )}
          <text x="7" y="15">
            R
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择传感器实验')}
            value={apparatus}
            onChange={setApparatus}
            options={options.map((x) => ({ value: x.value, label: t(x.label) }))}
          />
          {(apparatus === 'reed' || apparatus === 'alarm') && (
            <Range
              label={t('磁体与干簧管距离')}
              value={distance}
              min={0.001}
              max={0.05}
              step={0.001}
              unit="m"
              onChange={setDistance}
            />
          )}{' '}
          {(apparatus === 'light' || apparatus === 'control') && (
            <Range
              label={t('照度')}
              value={lux}
              min={1}
              max={1000}
              step={1}
              unit="lx"
              onChange={setLux}
            />
          )}{' '}
          {apparatus === 'light' && (
            <Segments
              label={t('元件对照')}
              value={resistor}
              onChange={setResistor}
              options={[
                { value: 'sensitive', label: t('光敏电阻') },
                { value: 'ordinary', label: t('普通电阻对照') },
              ]}
            />
          )}{' '}
          {apparatus === 'control' && (
            <>
              <Segments
                label={t('执行装置')}
                value={output}
                onChange={setOutput}
                options={[
                  { value: 'led', label: 'LED' },
                  { value: 'relay', label: t('继电器与灯泡') },
                ]}
              />
              <Range
                label={t('分压上臂电阻')}
                value={r1}
                min={5}
                max={51}
                step={1}
                unit="kΩ"
                onChange={setR1}
              />
            </>
          )}
          {(apparatus === 'temperature' || apparatus === 'bimetal') && (
            <Range
              label={t('温度')}
              value={temperature}
              min={0}
              max={90}
              step={1}
              unit="°C"
              onChange={setTemperature}
            />
          )}{' '}
          {apparatus === 'pressure' && (
            <Range
              label={t('包括框架的总压力')}
              value={force}
              min={0.5}
              max={8}
              step={0.5}
              unit="N"
              onChange={setForce}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('参数与数据来源')}</summary>
        <p>
          {t(
            '光敏电阻用照度的幂律近似，普通电阻保持不变；NTC采用25℃时10千欧、B值3950开尔文的模型，不代表所有热敏电阻。干簧管使用简化阈值，忽略回差。光控电路计入基极负载、晶体管电流放大与输出限流；双金属形变放大显示，60℃感温触点驱动常闭加热回路。压力图的16个点来自教材第112页，点间线性插值，只比较相邻区间斜率，不冒充新测量。',
          )}
        </p>
      </details>
    </div>
  );
}
