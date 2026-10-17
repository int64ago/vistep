import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { bjtDefaults, bjtPoint, bjtBias, bjtShot } from '../../models/bjt-amplifier';
import '../../styles/bjt-amplifier.css';
export default function BjtAmplifier() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [resistance, setResistance] = useState('0'),
    [amplitude, setAmplitude] = useState(8),
    [offset, setOffset] = useState(0),
    [angle, setAngle] = useState(45),
    c = film.watch ? film.chapter : -1,
    R = film.watch ? (c === 4 ? 100 : 0) : Number(resistance),
    parameters = useMemo(() => ({ ...bjtDefaults(), emitterResistance: R }), [R]),
    center = useMemo(() => bjtBias(parameters), [parameters]),
    manualBias = center + offset / 1000,
    shot = film.watch
      ? bjtShot(c, film.chapterProgress)
      : {
          parameters,
          bias: manualBias,
          amplitude: amplitude / 1000,
          phase: (angle * Math.PI) / 180,
          state: bjtPoint(
            parameters,
            manualBias + (amplitude / 1000) * Math.sin((angle * Math.PI) / 180),
          ),
        },
    s = shot.state,
    a = shot.amplitude,
    bias = shot.bias,
    phase = shot.phase,
    graph = c < 2 && c >= 0 ? 'transfer' : c === 5 ? 'power' : 'wave',
    referenceBias = useMemo(() => bjtBias(bjtDefaults()), []),
    wave = useMemo(
      () =>
        Array.from({ length: 161 }, (_, j) => {
          const ph = (j / 160) * 4 * Math.PI,
            base = bias + a * Math.sin(ph);
          return {
            phase: ph,
            input: base - bias,
            output: bjtPoint(parameters, base).collectorVoltage,
            reference: R
              ? bjtPoint(bjtDefaults(), referenceBias + a * Math.sin(ph)).collectorVoltage
              : 0,
          };
        }),
      [parameters, bias, a, R, referenceBias],
    ),
    transfer = useMemo(
      () =>
        Array.from({ length: 101 }, (_, j) => {
          const v = 0.5 + j * 0.0025;
          return `${72 + j * 2.5},${116 - (bjtPoint(bjtDefaults(), v).collectorVoltage / 5) * 80}`;
        }).join(' '),
      [],
    ),
    xx = (ph: number) => 100 + (ph / (4 * Math.PI)) * 222,
    inputPath = wave.map((q) => `${xx(q.phase)},${40 - (q.input / a) * 17}`).join(' '),
    outputPath = wave.map((q) => `${xx(q.phase)},${151 - (q.output / 5) * 70}`).join(' '),
    referencePath = wave.map((q) => `${xx(q.phase)},${151 - (q.reference / 5) * 70}`).join(' '),
    totalPower = s.collectorPower + s.basePower;
  return (
    <div className="bjt-film" data-watch={film.watch}>
      <p className="bjt-region">
        {s.region === 'saturation'
          ? t('饱和：基集结也正向偏置')
          : s.region === 'near-cutoff'
            ? t('接近截止：集电极电流很小')
            : t('放大区：输出取自集电极')}
      </p>
      <svg
        className="bjt-circuit"
        viewBox="0 0 340 235"
        role="img"
        aria-label={t('共射极放大电路，基极驱动与集电极电源共用回线')}
      >
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#9d8b60" />
          </marker>
        </defs>
        <path
          d="M215 27V34l-7 5 14 7 -14 7 14 7 -14 7 7 5V92M215 92H315M85 122H167M65 142V220H215"
          fill="none"
          stroke="#acb79b"
          strokeWidth="2.2"
        />
        <circle cx="215" cy="27" r="3.5" fill="#aa9465" />
        <text x="215" y="20" textAnchor="middle">
          5 V
        </text>
        <text x="273" y="58" textAnchor="middle">
          2.2 kΩ
        </text>
        <circle cx="187" cy="126" r="38" fill="#edf0e0" stroke="#b9c3a5" strokeWidth="1.5" />
        <path
          d="M140 122H167M167 105V146M167 115L215 92M167 136L215 164"
          fill="none"
          stroke="#9c9c78"
          strokeWidth="3"
        />
        <path
          d="M194 152L210 161"
          fill="none"
          stroke="#9d8b60"
          strokeWidth="2"
          markerEnd={`url(#${id}-arrow)`}
        />
        <path
          d={R ? 'M215 164V174l-7 5 14 7 -14 7 14 7 -7 5V220' : 'M215 164V220'}
          fill="none"
          stroke="#9eae90"
          strokeWidth="2.2"
        />
        {R > 0 && (
          <text x="273" y="197" textAnchor="middle">
            100 Ω
          </text>
        )}
        <circle cx="65" cy="122" r="20" fill="#eef0e3" stroke="#9db49c" strokeWidth="2" />
        <path d="M51 122q7 -15 14 0t14 0" fill="none" stroke="#86a48e" strokeWidth="1.8" />
        <text x="65" y="91" textAnchor="middle">
          Vb
        </text>
        <text x="143" y="114">
          B
        </text>
        <text x="228" y="93">
          C
        </text>
        <text x="228" y="168">
          E
        </text>
        <circle cx="315" cy="92" r="4" fill="#ac956a" />
        <text x="320" y="119" textAnchor="end">
          Vout
        </text>
        <path
          d="M215 79v10M109 122h20"
          stroke="#9d8b60"
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#${id}-arrow)`}
        />
        <path d="M215 220v6M205 226H225M209 231H221" stroke="#b2bea3" strokeWidth="1.5" />
      </svg>
      {graph === 'power' ? (
        <div className="bjt-power">
          <p>{t('输入功率')}</p>
          <div className="bjt-power-bar">
            <i
              style={{ width: `${(s.collectorPower / totalPower) * 100}%`, background: '#ac9467' }}
            />
            <i style={{ width: `${(s.basePower / totalPower) * 100}%`, background: '#8eae98' }} />
          </div>
          <div>
            <span>5 V: {(s.collectorPower * 1000).toFixed(2)} mW</span>
            <span>Vb: {(s.basePower * 1000).toFixed(3)} mW</span>
          </div>
          <p>
            {t('电阻热')} {(s.resistorPower * 1000).toFixed(2)} + {t('管内热')}{' '}
            {(s.transistorPower * 1000).toFixed(2)} mW
          </p>
        </div>
      ) : (
        <svg
          className="bjt-scope"
          viewBox={graph === 'transfer' ? '0 0 340 144' : '0 0 340 174'}
          role="img"
          aria-label={
            graph === 'transfer'
              ? t('基极电压增加时，集电极输出降低的传输曲线')
              : t('同一时刻的基极交流输入和集电极输出波形')
          }
        >
          {graph === 'transfer' ? (
            <>
              <path d="M72 28V116H322" fill="none" stroke="#c2cbb4" />
              <text x="16" y="41">
                5 V
              </text>
              <text x="36" y="121">
                0
              </text>
              <polyline points={transfer} stroke="#a89065" strokeWidth="3" fill="none" />
              <circle
                cx={72 + ((s.baseVoltage - 0.5) / 0.25) * 250}
                cy={116 - (s.collectorVoltage / 5) * 80}
                r="4"
                fill="#a89065"
              />
              <text x="72" y="139">
                0.50
              </text>
              <text x="322" y="139" textAnchor="end">
                0.75 Vb
              </text>
            </>
          ) : (
            <>
              <path d="M100 40H322M100 81V151H322" fill="none" stroke="#c0ccb3" />
              <text x="7" y="17">
                Vin
              </text>
              <text x="4" y="43">
                ±{(a * 1000).toFixed(0)} mV
              </text>
              <text x="14" y="89">
                5 V
              </text>
              <text x="35" y="156">
                0
              </text>
              <polyline points={inputPath} fill="none" stroke="#84a791" strokeWidth="2.2" />
              {R > 0 && (
                <polyline
                  points={referencePath}
                  fill="none"
                  stroke="#c0b596"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}
              <polyline points={outputPath} fill="none" stroke="#aa9060" strokeWidth="3" />
              <path d={`M${xx(phase)} 21V151`} stroke="#b9c6aa" strokeDasharray="3 4" />
              <circle
                cx={xx(phase)}
                cy={40 - ((s.baseVoltage - bias) / a) * 17}
                r="3"
                fill="#84a791"
              />
              <circle
                cx={xx(phase)}
                cy={151 - (s.collectorVoltage / 5) * 70}
                r="4"
                fill="#aa9060"
              />
              <text x="100" y="171">
                0
              </text>
              <text x="322" y="171" textAnchor="end">
                2T
              </text>
            </>
          )}
        </svg>
      )}
      {R > 0 && <p className="bjt-comparison">{t('虚线：相同输入，无发射极电阻')}</p>}
      <div className="bjt-readings">
        <span>
          Vb (V)<b>{s.baseVoltage.toFixed(3)}</b>
        </span>
        <span>
          Vout (V)<b>{s.collectorVoltage.toFixed(2)}</b>
        </span>
        <span>
          {R ? 'Ve (V)' : 'Ic (mA)'}
          <b>{(R ? s.emitterVoltage : s.collectorCurrent * 1000).toFixed(2)}</b>
        </span>
      </div>
      {!film.watch && (
        <div className="bjt-controls">
          <Segments
            label={t('发射极电阻')}
            value={resistance}
            options={[
              { value: '0', label: '0 Ω' },
              { value: '100', label: '100 Ω' },
            ]}
            onChange={setResistance}
          />
          <Range
            label={t('输入峰值幅度')}
            value={amplitude}
            min={1}
            max={80}
            step={1}
            unit="mV"
            onChange={setAmplitude}
          />
          <Range
            label={t('偏置微调')}
            value={offset}
            min={-80}
            max={80}
            step={1}
            unit="mV"
            onChange={setOffset}
          />
          <Range
            label={t('输入相位')}
            value={angle}
            min={0}
            max={720}
            step={2}
            unit="°"
            onChange={setAngle}
          />
        </div>
      )}
      <details className="bjt-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '理想低频Ebers–Moll模型，β正向=100，反向=1。输出为高阻测量，无外接负载；忽略寄生电容、早期效应和自热。改变发射极电阻时重新设定中点偏置，微调量另行叠加。',
          )}
        </p>
      </details>
    </div>
  );
}
