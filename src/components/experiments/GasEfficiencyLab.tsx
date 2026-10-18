import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  coolingMinutes,
  coolingCelsius,
  coolingReading,
  lowTemperatureTrials,
  boilingTrials,
  usefulWaterHeat,
  measuredEfficiency,
  fuelSaving,
  heaterFlowPoint,
  heaterRoute,
} from '../../models/gas-efficiency-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/gas-efficiency-lab.css';
const modes = ['能量去向', '冷却记录', '低温加热', '烧开策略', '热水器测量'];
const plans = ['始终大火', '始终中火', '先中火后大火'];
export default function GasEfficiencyLab() {
  const film = useShowcase(),
    [mode, setMode] = useState(film.variant === 'e3-gas-water-heater-efficiency' ? 4 : 0),
    [progress, setProgress] = useState(1),
    [choice, setChoice] = useState(0),
    [mass, setMass] = useState(10),
    [inlet, setInlet] = useState(20),
    [calorific, setCalorific] = useState(35),
    [v38, setV38] = useState(''),
    [v50, setV50] = useState(''),
    stage = film.watch ? film.chapter : mode,
    p = film.watch ? film.chapterProgress : progress,
    heater = stage >= 4,
    collectionProgress = stage === 6 ? 1 : p,
    caseIndex = film.watch
      ? stage === 2
        ? Math.min(1, Math.floor(p * 2))
        : stage === 3
          ? Math.min(2, Math.floor(p * 3))
          : stage === 4
            ? 0
            : 1
      : choice,
    local = film.watch
      ? stage === 2
        ? p * 2 - caseIndex
        : stage === 3
          ? p * 3 - caseIndex
          : p
      : p,
    trial =
      stage === 2
        ? lowTemperatureTrials[Math.min(1, caseIndex)]
        : boilingTrials[Math.min(2, caseIndex)],
    large =
      stage === 0 ||
      (stage === 2 && caseIndex === 0) ||
      (stage === 3 && (caseIndex === 0 || (caseIndex === 2 && local > 0.5))),
    outlet = film.watch ? (stage === 4 ? 38 : 50) : caseIndex === 0 ? 38 : 50,
    heatMass = film.watch ? 10 : mass,
    cold = film.watch ? 20 : inlet,
    reading = coolingReading(p * 300),
    temp =
      stage === 1
        ? reading.temperature
        : stage === 2
          ? 26 + 24 * local
          : stage === 3
            ? 26 + 74 * local
            : 75,
    toValue = (v: string) => (v.trim() ? Number(v) : null),
    e38 = measuredEfficiency(mass, inlet, 38, toValue(v38), calorific),
    e50 = measuredEfficiency(mass, inlet, 50, toValue(v50), calorific);
  return (
    <div className="textbook-em gas-efficiency-lab">
      <div className="textbook-em-state">
        <span>{t(heater ? '热水器的对比测量' : modes[stage])}</span>
        <span>{heater ? t('示例条件，耗气待测') : t('教材原始数据')}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('燃气灶的量热、冷却数据与热水器的等水量对比')}
      >
        {heater ? (
          <>
            <rect
              x="67"
              y="44"
              width="211"
              height="181"
              rx="16"
              fill="#e9ebde"
              stroke="#a7b69b"
              strokeWidth="2"
            />
            <path d="M160 44V22H200V44" fill="#c7d1bc" stroke="#a7b69b" strokeWidth="2" />
            <path d="M100 195H245" stroke="#a6b194" strokeWidth="7" strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path
                key={i}
                d={`M${113 + i * 22} 190q-6-10 0-22q7 12 0 22Z`}
                fill={outlet === 50 ? '#ba9b66' : '#c3b37b'}
              />
            ))}
            {heaterRoute.slice(1).map((b, i) => (
              <path
                key={i}
                d={`M${heaterRoute[i][0]} ${heaterRoute[i][1]}L${b[0]} ${b[1]}`}
                stroke={i < 2 ? '#a1c2bf' : i < 5 ? '#b4c7a4' : '#c3a771'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
            ))}
            {Array.from({ length: 14 }, (_, i) => {
              const point = heaterFlowPoint((i / 14 + collectionProgress * 1.5) % 1);
              return <circle key={i} cx={point.x} cy={point.y} r="2.5" fill="#f2f3df" />;
            })}
            <rect x="12" y="232" width="84" height="31" rx="6" fill="#e3e8d4" stroke="#a6b994" />
            <text x="54" y="252" textAnchor="middle" className="em-small">
              ΔV = ?
            </text>
            <path d="M96 247H152V195" stroke="#baa773" strokeWidth="4" fill="none" />
            <path
              d="M211 251V296Q243 305 275 296V251"
              fill="#eef2e5"
              stroke="#a6bba5"
              strokeWidth="2"
            />
            <path
              d={`M213 ${295 - 35 * collectionProgress}Q243 ${302 - 35 * collectionProgress} 273 ${295 - 35 * collectionProgress}V294Q243 303 213 294Z`}
              fill="#bed6c8"
            />
            <path d="M245 251V265" stroke="#c7dacb" strokeWidth="3" />
            <text x="320" y="308" textAnchor="middle" className="em-small">
              {cold}°C
            </text>
            <text x="292" y="228" textAnchor="middle" className="em-small">
              {outlet}°C
            </text>
            <text x="54" y="285" textAnchor="middle" className="em-small">
              {t('燃气表')}
            </text>
            <text x="243" y="318" textAnchor="middle" className="em-small">
              {(heatMass * collectionProgress).toFixed(1)} kg
            </text>
          </>
        ) : (
          <>
            <g transform={stage === 1 ? 'translate(80 -2) scale(.57)' : ''}>
              <path
                d="M97 88H248V175Q175 194 97 175Z"
                fill="#cbd4c0"
                stroke="#95a88b"
                strokeWidth="3"
              />
              <path d="M100 108H245V172Q174 190 100 172Z" fill="#b9d5c7" />
              <path
                d="M105 88q68-19 136 0M163 76V66H183V76"
                fill="#d8deca"
                stroke="#9dae93"
                strokeWidth="3"
              />
              <path
                d="M98 112L58 94L65 125L98 152M248 101q49 1 30 47h-30"
                fill="none"
                stroke="#9dad92"
                strokeWidth="7"
              />
              <path d="M214 60V154" stroke="#f2f2e3" strokeWidth="6" />
              <path d={`M214 ${154 - (temp - 20) * 0.9}V155`} stroke="#b4816b" strokeWidth="3" />
              <circle cx="214" cy="157" r="5" fill="#b4816b" />
              {stage !== 1 && (
                <>
                  {Array.from({ length: large ? 9 : 6 }, (_, i) => {
                    const x = large ? 80 + i * 23 : 111 + i * 23;
                    return (
                      <path
                        key={i}
                        d={`M${x} 218q-8-${large ? 18 : 14} 0-${large ? 37 : 29}q8 17 0 ${large ? 37 : 29}Z`}
                        fill="#bba06a"
                        opacity=".85"
                      />
                    );
                  })}
                  <path
                    d="M100 222H251M110 194V222M238 194V222"
                    stroke="#a6b193"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>
            {stage === 1 ? (
              <>
                <path d="M46 173V285H328" stroke="#a4b397" fill="none" />
                {[40, 70, 100].map((v) => (
                  <g key={v}>
                    <path d={`M46 ${285 - (v - 20) * 1.05}H326`} stroke="#d9e1ca" />
                    <text x="38" y={290 - (v - 20) * 1.05} textAnchor="end" className="em-small">
                      {v}
                    </text>
                  </g>
                ))}
                <polyline
                  points={coolingMinutes
                    .map((m, i) => `${46 + m * 0.9},${285 - (coolingCelsius[i] - 20) * 1.05}`)
                    .join(' ')}
                  fill="none"
                  stroke="#a88d65"
                  strokeWidth="2"
                />
                {coolingMinutes.map((m, i) => (
                  <circle
                    key={m}
                    cx={46 + m * 0.9}
                    cy={285 - (coolingCelsius[i] - 20) * 1.05}
                    r="2.7"
                    fill="#aa9068"
                  />
                ))}
                <circle
                  cx={46 + p * 270}
                  cy={285 - (temp - 20) * 1.05}
                  r="5"
                  fill="#839f76"
                  stroke="#f2f2df"
                  strokeWidth="2"
                />
                <text x="46" y="307" className="em-small">
                  0
                </text>
                <text x="326" y="307" textAnchor="end" className="em-small">
                  300 min
                </text>
                <text x="20" y="169" className="em-small">
                  °C
                </text>
                <text x="180" y="153" textAnchor="middle">
                  {t('4.0 kg，室温26°C')}
                </text>
              </>
            ) : stage === 0 ? (
              <>
                <path d="M176 195V132m-5 6 5-6 5 6" stroke="#9daa6f" strokeWidth="3" fill="none" />
                <text x="166" y="148" textAnchor="end">
                  ΔU
                </text>
                <circle cx="176" cy={195 - 63 * ((p * 3) % 1)} r="3" fill="#90a16d" />
                <path
                  d="M137 66q-25-17-24-38m-4 6 4-6 4 6"
                  stroke="#b3a56d"
                  fill="none"
                  strokeWidth="2"
                />
                <text x="93" y="32">
                  Q₁
                </text>
                <path
                  d="M275 195q35-30 34-66m-4 6 4-6 4 6"
                  stroke="#b3a56d"
                  fill="none"
                  strokeWidth="2"
                />
                <text x="307" y="114">
                  Q₂
                </text>
                <text x="180" y="280" textAnchor="middle">
                  Q = ΔU + Q₁ + Q₂
                </text>
              </>
            ) : (
              <>
                <rect
                  x="26"
                  y="250"
                  width="135"
                  height="35"
                  rx="6"
                  fill="#e7ebd8"
                  stroke="#b2c19d"
                />
                <text x="94" y="273" textAnchor="middle">
                  {(trial.before + (trial.after - trial.before) * local).toFixed(4)}
                </text>
                <text x="171" y="273" className="em-small">
                  m³
                </text>

                <text x="260" y="273" textAnchor="middle">
                  {stage === 2 ? `${temp.toFixed(0)}°C` : t('终点：沸腾')}
                </text>
              </>
            )}
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {stage === 2
          ? t(caseIndex === 0 ? '大火加热到50°C' : '中火加热到50°C')
          : stage === 3
            ? t(plans[caseIndex])
            : null}
      </p>
      <div className="textbook-em-meters">
        {heater ? (
          <>
            <span>
              {t('收集同样水量')} <b>{heatMass} kg</b>
            </span>
            <span>
              ΔU{' '}
              <b>
                {(usefulWaterHeat(heatMass * collectionProgress, cold, outlet) / 1000).toFixed(1)}{' '}
                kJ
              </b>
            </span>
            <span>
              η <b>{t('待实测耗气量')}</b>
            </span>
          </>
        ) : stage === 1 ? (
          <>
            <span>
              t <b>{(p * 300).toFixed(0)} min</b>
            </span>
            <span>
              T <b>{temp.toFixed(1)} °C</b>
            </span>
          </>
        ) : stage === 2 ? (
          <>
            <span>
              {t('大火耗气')} <b>0.0453 m³</b>
            </span>
            <span>
              {t('中火耗气')} <b>0.0278 m³</b>
            </span>
          </>
        ) : stage === 3 ? (
          <>
            <span>
              {t('三种方案耗气')} <b>0.0883 / 0.0845 / 0.0784 m³</b>
            </span>
            <span>
              {t('比全程大火少用')} <b>{(fuelSaving(0.0883, 0.0784) * 100).toFixed(1)}%</b>
            </span>
          </>
        ) : (
          <span>{t('流向示意，箭头不表示能量比例')}</span>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="textbook-em-tabs">
            {modes.map((z, i) => (
              <button
                key={z}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setChoice(0);
                }}
              >
                {t(z)}
              </button>
            ))}
          </div>
          {mode === 2 || mode === 3 || mode === 4 ? (
            <div className="textbook-em-tabs">
              {(mode === 2 ? ['大火', '中火'] : mode === 3 ? plans : ['38°C', '50°C']).map(
                (z, i) => (
                  <button key={z} aria-pressed={choice === i} onClick={() => setChoice(i)}>
                    {t(z)}
                  </button>
                ),
              )}
            </div>
          ) : null}
          {mode !== 0 && (
            <Range
              label={t(mode === 1 ? '冷却过程进度' : '过程进度')}
              min={0}
              max={1}
              step={0.005}
              value={progress}
              onChange={setProgress}
            />
          )}{' '}
          {heater && (
            <>
              <Range
                label={t('收集水的质量')}
                min={2}
                max={20}
                step={0.5}
                value={mass}
                onChange={setMass}
              />
              <Range
                label={t('进水温度')}
                min={5}
                max={30}
                step={1}
                value={inlet}
                onChange={setInlet}
              />
              <Range
                label={t('燃气热值，示例初值35 MJ/m³')}
                min={15}
                max={45}
                step={0.1}
                value={calorific}
                onChange={setCalorific}
              />
              <div className="gas-efficiency-inputs">
                <label>
                  {t('38°C实测耗气量')}
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={v38}
                    onChange={(e) => setV38(e.target.value)}
                    placeholder="m³"
                  />
                </label>
                <label>
                  {t('50°C实测耗气量')}
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={v50}
                    onChange={(e) => setV50(e.target.value)}
                    placeholder="m³"
                  />
                </label>
              </div>
              <p className="gas-efficiency-result" aria-live="polite">
                η₃₈ = {e38 === null ? '—' : `${(e38 * 100).toFixed(1)}%`} · η₅₀ ={' '}
                {e50 === null ? '—' : `${(e50 * 100).toFixed(1)}%`}
                {e38 !== null && e50 !== null ? ` · η₅₀/η₃₈ = ${(e50 / e38).toFixed(3)}` : ''}
              </p>
              {(e38 ?? 0) > 1 || (e50 ?? 0) > 1 ? (
                <p>{t('结果超过100%，请核对水量、温差、燃气体积及热值的单位与测量。')}</p>
              ) : null}
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('原始数据与可推断范围')}</summary>
        <p>
          {t(
            '燃气灶的冷却点、燃气表读数与耗气量来自教材第133—134页。101.9°C保留为原记录，不擅自校正；连线与表盘动画只帮助读表，不是连续实测曲线。锅具吸热按教材忽略。热水器第135页仅提出研究方法，没有实测结果；默认10千克、20°C为可更改示例，耗气量留空，热值须按当地燃气资料填写。',
          )}
        </p>
      </details>
    </div>
  );
}
