import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { opAmpDefaults, opAmpSteady, opAmpStep, opAmpShot } from '../../models/op-amp-feedback';
import '../../styles/op-amp-feedback.css';
const errorText = (value: number) =>
  Math.abs(value) < 0.001 ? `${(value * 1e6).toFixed(1)} µV` : `${(value * 1000).toFixed(2)} mV`;
export default function OpAmpFeedback() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState('steady'),
    [input, setInput] = useState(0.5),
    [resistance, setResistance] = useState(90),
    [gain, setGain] = useState('100000'),
    [elapsed, setElapsed] = useState(10),
    c = film.watch ? film.chapter : -1,
    p = {
      ...opAmpDefaults(),
      feedback: mode !== 'open',
      feedbackResistance: resistance * 1000,
      gain: Number(gain),
    },
    manualInput = mode === 'open' ? input / 1000 : input,
    shot = film.watch
      ? opAmpShot(c, film.chapterProgress)
      : {
          state:
            mode === 'steady'
              ? opAmpSteady(p, manualInput)
              : opAmpStep(p, manualInput, elapsed * (mode === 'open' ? 1e-4 : 1e-6)),
          kind: mode === 'steady' ? 'steady' : 'step',
        },
    s = shot.state,
    step = shot.kind === 'step',
    duration = s.feedback ? 25e-6 : 0.003,
    x = (time: number) => 49 + (time / duration) * 268,
    y = (v: number) => (s.input >= 0 ? 98 - (v / 10) * 66 : 32 - (v / 10) * 66),
    curve = (v: number) =>
      Array.from({ length: 121 }, (_, j) => {
        const tm = (duration * j) / 120;
        return `${x(tm)},${y(opAmpStep(s, v, tm).output)}`;
      }).join(' '),
    barMax = c === 4 ? 1.5 : Math.max(0.6, Math.abs(s.input), Math.abs(s.minus)),
    bar = (v: number) => `${(100 * Math.abs(v)) / barMax}%`;
  return (
    <div className="opamp-film" data-watch={film.watch}>
      <p className="opamp-state">
        {!s.feedback
          ? t('开环：没有误差校正')
          : s.saturated
            ? t('输出饱和：误差仍然存在')
            : s.slewing && step
              ? t('转换速率受限')
              : t('负反馈：输出返回反相端')}
      </p>
      <svg
        className="opamp-circuit"
        viewBox="0 0 340 250"
        role="img"
        aria-label={t('非反相运放、输出反馈分压器和电源连接')}
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
            <path d="M0 0L10 5L0 10Z" fill="#90aa99" />
          </marker>
        </defs>
        <path
          d="M20 70H135M245 95H315M180 27V65M180 125V142"
          fill="none"
          stroke="#b0bba3"
          strokeWidth="2.2"
        />
        <path
          d="M135 45L245 95L135 145Z"
          fill="#e8ecdb"
          stroke="#a8b99b"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M144 70h12m-6 -6v12M144 120h12" stroke="#899a77" strokeWidth="2" />
        <text x="60" y="53" textAnchor="middle">
          V+
        </text>
        <text x="180" y="22" textAnchor="middle">
          +10 V
        </text>
        <text x="180" y="163" textAnchor="middle">
          −10 V
        </text>
        <text x="320" y="80" textAnchor="end">
          Vout
        </text>
        <circle cx="20" cy="70" r="4" fill="#a9956a" />
        <circle cx="315" cy="95" r="4" fill="#8ca793" />
        {s.feedback ? (
          <>
            <path
              d="M135 120H75V190M295 95V190H237l-5 -6 -8 12 -8 -12 -8 12 -8 -12 -8 12 -5 -6H75M75 190V200l-5 4 10 6 -10 6 5 4V238"
              stroke="#9eaf93"
              strokeWidth="2.2"
              fill="none"
            />
            <circle cx="75" cy="190" r="3" fill="#91a18a" />
            <circle cx="295" cy="95" r="3" fill="#91a18a" />
            <text x="215" y="218" textAnchor="middle">
              {(s.feedbackResistance / 1000).toFixed(0)} kΩ
            </text>
            <text x="112" y="235">
              10 kΩ
            </text>
            {Math.abs(s.output) > 1e-9 && (
              <path
                d={s.output > 0 ? 'M125 190H105' : 'M105 190H125'}
                stroke="#90aa99"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
          </>
        ) : (
          <>
            <path d="M135 120H75V238" stroke="#b8c4aa" strokeWidth="2.2" fill="none" />
            <text x="112" y="205">
              V− = 0
            </text>
          </>
        )}
        <path d="M65 238H85M69 243H81M72 247H78" stroke="#aab99d" strokeWidth="1.5" />
      </svg>
      {step ? (
        <svg
          className="opamp-curve"
          viewBox="0 0 340 126"
          role="img"
          aria-label={t('有限增益与转换速率决定的阶跃响应')}
        >
          <path d="M49 28V98H317" stroke="#c0cbb4" fill="none" />
          <text x="7" y="35">
            {s.input >= 0 ? '10' : '0'} V
          </text>
          <text x="7" y="102">
            {s.input >= 0 ? '0' : '−10'}
          </text>
          {c === 5 && (
            <polyline
              points={curve(0.2)}
              fill="none"
              stroke="#bdc5ad"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
          <polyline points={curve(s.input)} fill="none" stroke="#9e9268" strokeWidth="3" />
          <circle cx={x(Math.min(s.time, duration))} cy={y(s.output)} r="4" fill="#9e9268" />
          <text x="49" y="122">
            0
          </text>
          <text x="317" y="122" textAnchor="end">
            {s.feedback ? '25 µs' : '3 ms'}
          </text>
          {c === 5 && (
            <text x="173" y="21" textAnchor="middle">
              0.5 V/µs
            </text>
          )}
        </svg>
      ) : (
        <div className="opamp-comparison">
          <div>
            <span>V+</span>
            <i>
              <b style={{ width: bar(s.input), background: '#b7a06c' }} />
            </i>
            <strong>{s.input.toFixed(3)}</strong>
          </div>
          <div>
            <span>V−</span>
            <i>
              <b style={{ width: bar(s.minus), background: '#8eae99' }} />
            </i>
            <strong>{s.minus.toFixed(3)}</strong>
          </div>
          <p>
            {t('误差')} {errorText(s.error)} · A=
            {s.gain >= 1000 ? s.gain.toFixed(0) : s.gain.toFixed(1)}
          </p>
        </div>
      )}
      {c === 5 && <p className="opamp-reference">{t('实线：0.8 V阶跃；虚线：0.2 V')}</p>}
      <div className="opamp-readings">
        <span>
          V+ (V)<b>{s.input.toFixed(s.feedback ? 3 : 4)}</b>
        </span>
        <span>
          V− (V)<b>{s.minus.toFixed(3)}</b>
        </span>
        <span>
          Vout (V)<b>{s.output.toFixed(2)}</b>
        </span>
      </div>
      {!film.watch && (
        <div className="opamp-controls">
          <Segments
            label={t('反馈实验')}
            value={mode}
            options={[
              { value: 'steady', label: t('闭环稳态') },
              { value: 'step', label: t('闭环阶跃') },
              { value: 'open', label: t('开环') },
            ]}
            onChange={setMode}
          />
          <Range
            label={mode === 'open' ? t('差分输入') : t('输入电压')}
            value={input}
            min={-1.5}
            max={1.5}
            step={0.01}
            unit={mode === 'open' ? 'mV' : 'V'}
            onChange={setInput}
          />
          {mode !== 'open' && (
            <Range
              label={t('反馈电阻')}
              value={resistance}
              min={10}
              max={90}
              step={1}
              unit="kΩ"
              onChange={setResistance}
            />
          )}
          <Segments
            label={t('开环增益')}
            value={gain}
            options={[
              { value: '20', label: '20' },
              { value: '1000', label: '1000' },
              { value: '100000', label: '100000' },
            ]}
            onChange={setGain}
          />
          {mode !== 'steady' && (
            <Range
              label={t('经过时间')}
              value={elapsed}
              min={0}
              max={30}
              step={0.1}
              unit={mode === 'open' ? '×0.1 ms' : 'µs'}
              onChange={setElapsed}
            />
          )}
        </div>
      )}
      <details className="opamp-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '单主极点10 Hz，输出限于±10 V，转换速率0.5 V/µs。输入电流为零；忽略失调、负载限制、多极点稳定性和过载恢复。电压条比较大小，读数保留正负号。',
          )}
        </p>
      </details>
    </div>
  );
}
