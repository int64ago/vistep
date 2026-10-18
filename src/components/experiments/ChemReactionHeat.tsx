import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { reactionHeat, heatDirector } from '../../models/chem-reaction-heat';
import '../../styles/chem-reaction-heat.css';
export default function ChemReactionHeat() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [kind, setKind] = useState<'magnesium' | 'crystals'>(
      film.variant === 'crystal-cooling' ? 'crystals' : 'magnesium',
    ),
    [seconds, setSeconds] = useState(30),
    [amount, setAmount] = useState(1),
    [wet, setWet] = useState(true),
    [coupling, setCoupling] = useState(0.06);
  const d = film.watch
    ? heatDirector(film.chapter, film.chapterProgress)
    : { chapter: kind === 'magnesium' ? 1 : 5, progress: 1, kind, seconds, lift: 30 };
  const state = reactionHeat(d.kind, d.seconds, {
      amount: film.watch ? 1 : amount,
      coupling: film.watch ? 0.06 : coupling,
      waterMass: film.watch || wet ? 0.0005 : 0,
    }),
    dry = reactionHeat('crystals', d.seconds, {
      waterMass: 0,
      amount: film.watch ? 1 : amount,
      coupling: film.watch ? 0.06 : coupling,
    });
  const names = [
    ['先记录温度', 'Record the starting temperature'],
    ['镁减少，溶液升温', 'Magnesium reacts, solution warms'],
    ['反应停下，传热继续', 'Reaction stops, heat transfer continues'],
    ['两种晶体，温度下降', 'Two crystals, falling temperature'],
    ['杯底水层发生了什么', 'What happened beneath the beaker?'],
    ['结冰把烧杯与木片连起来', 'Ice connects the beaker to the wood'],
  ];
  const frost = state.iceFraction,
    woodY = state.attached ? -d.lift : 0;
  return (
    <section className="chem-reaction-heat" data-chapter={d.chapter}>
      <div className="chem-heat-heading">{say(names[d.chapter][0], names[d.chapter][1])}</div>
      {d.kind === 'magnesium' ? (
        <>
          <svg
            className="chem-heat-tube"
            viewBox="0 0 320 235"
            aria-label={say(
              '镁条在盐酸中消耗，气泡与温度计读数来自同一反应进度',
              'Magnesium ribbon is consumed in acid; bubbles and temperature follow the same reaction extent',
            )}
            role="img"
          >
            <path
              d="M53 30V222M25 222H106"
              stroke="#a7b3a2"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M53 92H141" stroke="#a7b3a2" strokeWidth="4" />
            <ellipse
              cx="158"
              cy="92"
              rx="29"
              ry="10"
              stroke="#a3b79c"
              fill="#b5c8a555"
              strokeWidth="3"
            />
            <path
              d="M132 34V189Q132 218 158 218Q184 218 184 189V34"
              stroke="#9daeb0"
              strokeWidth="2"
              fill="#e5eee633"
            />
            <path d="M136 145H180V189Q180 213 158 213Q136 213 136 189Z" fill="#c3d5c044" />
            <rect x="155" y="8" width="9" height="187" rx="4.5" fill="#eef0e3" stroke="#b0b8a8" />
            <circle cx="159.5" cy="191" r="6" fill="#bda28d" />
            <path
              d={`M159.5 190V${169 - state.temperature * 3.3}`}
              stroke="#bda28d"
              strokeWidth="3"
            />
            {[0, 5, 10, 15, 20, 25, 30, 35].map((v) => (
              <path
                key={v}
                d={`M164 ${169 - v * 3.3}h${v % 10 ? 4 : 7}`}
                stroke="#abb69f"
                strokeWidth="1"
              />
            ))}
            {state.extent < 0.999 && (
              <path
                d={
                  d.chapter === 0 ? 'M203 55q14 7 0 16q-13 9 0 18' : 'M145 174q13 6 0 15q-11 9 1 17'
                }
                fill="none"
                stroke="#a7b5b8"
                strokeWidth={Math.max(1, 4 * (1 - state.extent))}
                opacity={1 - state.extent}
              />
            )}
            {state.extent > 0 &&
              state.extent < 1 &&
              Array.from({ length: 8 }, (_, i) => (
                <circle
                  key={i}
                  cx={143 + ((i * 11) % 30)}
                  cy={204 - ((i * 13 + d.seconds * 7) % 63)}
                  r={2 + (i % 2)}
                  fill="none"
                  stroke="#9db9ae"
                />
              ))}
            {d.chapter === 2 &&
              [0, 1, 2].map((i) => (
                <g key={i} transform={`translate(204 ${137 + i * 23})`}>
                  <path
                    d="M0 0H48m-9-5 9 5-9 5"
                    fill="none"
                    stroke="#c5ad89"
                    strokeWidth="2"
                    opacity={Math.min(1, Math.abs(state.heatFlowIntoMixture) * 2)}
                  />
                </g>
              ))}
          </svg>
          <div className="chem-heat-value">
            {state.temperature.toFixed(1)}°C <span>{say('模型温度', 'Model temperature')}</span>
          </div>
          <div className="chem-heat-formula">Mg ＋ 2H⁺ → Mg²⁺ ＋ H₂</div>
        </>
      ) : (
        <>
          <svg
            className="chem-heat-beaker"
            viewBox="0 0 320 250"
            role="img"
            aria-label={say(
              '晶体反应吸热，烧杯下的水在能量条件满足时结冰并粘住木片',
              'The crystal reaction absorbs heat; the water under the beaker freezes and attaches the wood when the energy condition is met',
            )}
          >
            {d.chapter === 4 ? (
              <>
                <path
                  d="M53 18V90Q53 109 74 109H246Q267 109 267 90V18"
                  fill="#e5eee833"
                  stroke="#9cacb0"
                  strokeWidth="3"
                />
                <path
                  d="M60 22H260V89Q260 102 243 102H77Q60 102 60 89Z"
                  fill="#d6dfca"
                  opacity=".65"
                />
                <rect x="75" y="111" width="170" height="14" rx="3" fill="#bfd7cf" />
                <rect x="75" y="111" width={170 * frost} height="14" rx="3" fill="#d7e6ed" />
                {Array.from({ length: 18 }, (_, i) =>
                  i / 18 < frost ? (
                    <path
                      key={i}
                      d={`M${78 + i * 9} 123l5-9 4 7`}
                      fill="none"
                      stroke="#a9c5d1"
                      strokeWidth="1.5"
                    />
                  ) : null,
                )}
                <path d="M38 127H282V179H38Z" fill="#d9ccb0" stroke="#b8aa8b" strokeWidth="2" />
                <path
                  d="M46 141q50-12 105 0t122 0M48 157q47-10 102 0t120 0M54 171q55-10 103 0t108 0"
                  stroke="#bbad8f"
                  fill="none"
                  opacity=".55"
                />
                <path
                  d="M26 120V62m-6 12 6-12 6 12M294 120V62m-6 12 6-12 6 12"
                  stroke="#9fb9be"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M246 118L288 210H225" fill="none" stroke="#acc2bf" strokeDasharray="4 4" />
                <text x="160" y="219" fontSize="20" textAnchor="middle" fill="#7c99a1">
                  {say('水层 → 冰层', 'Water layer → ice')}
                </text>
              </>
            ) : d.chapter === 5 ? (
              <>
                <path d="M12 224H308" stroke="#d1d7c8" strokeWidth="2" />
                {[state, dry].map((sample, i) => {
                  const x = 80 + i * 160,
                    dy = sample.attached ? -d.lift : 0;
                  return (
                    <g key={i}>
                      <g transform={`translate(0 ${dy})`}>
                        <rect
                          x={x - 58}
                          y="201"
                          width="116"
                          height="18"
                          rx="2"
                          fill="#d9ccb0"
                          stroke="#b8aa8b"
                        />
                        <path d={`M${x - 52} 208q26-5 52 0t52 0`} stroke="#bbad8f" fill="none" />
                        {sample.waterMass > 0 && (
                          <ellipse
                            cx={x}
                            cy="199"
                            rx="38"
                            ry="4"
                            fill={sample.iceFraction > 0 ? '#d2e0e1' : '#b9d0ca'}
                          />
                        )}
                      </g>
                      <g transform={`translate(0 ${-d.lift})`}>
                        <path
                          d={`M${x - 43} 82V185Q${x - 43} 198 ${x - 30} 198H${x + 30}Q${x + 43} 198 ${x + 43} 185V82`}
                          fill="#e5eee833"
                          stroke="#9cacb0"
                          strokeWidth="2"
                        />
                        <path
                          d={`M${x - 39} ${182 - 35 * sample.extent}H${x + 39}V184Q${x + 39} 194 ${x + 28} 194H${x - 28}Q${x - 39} 194 ${x - 39} 184Z`}
                          fill="#d6dfca"
                          opacity=".7"
                        />
                        <path
                          d={`M${x - 50} 80H${x + 50}V84H${x - 50}Z`}
                          fill="#d0dfd055"
                          stroke="#a1b4a6"
                        />
                        {sample.iceFraction > 0 && (
                          <path
                            d={`M${x - 35} 200h70`}
                            stroke="#c4d9de"
                            strokeWidth="3"
                            fill="none"
                          />
                        )}
                      </g>
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                <path d="M30 239H290" stroke="#d1d7c8" strokeWidth="2" />
                <g transform={`translate(0 ${woodY})`}>
                  <path d="M69 219H251V236H69Z" fill="#d9ccb0" stroke="#b8aa8b" />
                  <path
                    d="M74 224Q127 217 180 225T247 225M78 232Q123 225 167 231T243 231"
                    stroke="#bbad8f"
                    fill="none"
                    opacity=".5"
                  />
                  {state.waterMass > 0 && (
                    <ellipse
                      cx="160"
                      cy="216"
                      rx="48"
                      ry="4"
                      fill={frost > 0 ? '#d2e0e1' : '#b9d0ca'}
                      opacity=".8"
                    />
                  )}
                </g>
                <g transform={`translate(0 ${-d.lift})`}>
                  <path
                    d="M85 46L96 50V196Q96 213 111 213H209Q224 213 224 196V46"
                    stroke="#9cacb0"
                    strokeWidth="2.2"
                    fill="#e5eee833"
                  />
                  <path
                    d={`M101 ${190 - 48 * state.extent}H219V195Q219 208 205 208H115Q101 208 101 195Z`}
                    fill="#d6dfca"
                    opacity=".65"
                  />
                  {Array.from({ length: 48 }, (_, i) => (
                    <path
                      key={i}
                      d={`M${110 + ((i * 29) % 98)} ${184 + ((i * 13) % 18)}l4-3 4 4-5 4Z`}
                      fill={i % 2 ? '#e7e6d3' : '#f4f0df'}
                      opacity={0.12 + 0.88 * (1 - state.extent)}
                    />
                  ))}
                  {d.chapter === 3 && (
                    <path
                      d={`M${150 + Math.sin(d.seconds) * 9} 26L${174 + Math.sin(d.seconds) * 9} 190`}
                      stroke="#a7bdb1"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  )}
                  {d.chapter !== 3 && (
                    <path d="M83 44H237V48H83Z" fill="#d0dfd055" stroke="#a1b4a6" />
                  )}
                </g>
                {d.chapter === 4 && (
                  <>
                    <path
                      d="M52 177L88 187m-10-8 10 8-12 1M270 177L234 187m10-8-10 8 12 1"
                      stroke="#9fb9be"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M111 215L58 184M210 215L263 184"
                      stroke="#adc2bf"
                      strokeDasharray="3 4"
                      fill="none"
                    />
                  </>
                )}
              </>
            )}
          </svg>
          {d.chapter !== 5 && (
            <div className="chem-heat-value">
              {state.temperature.toFixed(1)}°C <span>{say('模型温度', 'Model temperature')}</span>
            </div>
          )}
          {d.chapter === 4 ? (
            <div className="chem-heat-interface">
              <span>{say('界面水的固态份额', 'Interface water frozen')}</span>
              <b>{Math.round(frost * 100)}%</b>
            </div>
          ) : d.chapter === 5 ? (
            <div className="chem-heat-attachment">
              <span>
                {state.attached
                  ? say('湿木片跟随', 'Wet wood follows')
                  : say('木片留在桌面', 'Wood stays on the bench')}
                <i>{state.temperature.toFixed(1)}°C</i>
              </span>
              <span>
                {say('干木片留下', 'Dry wood stays')}
                <i>{dry.temperature.toFixed(1)}°C</i>
              </span>
              <span style={{ gridColumn: '1 / -1', color: '#8b9a82' }}>
                {say('模型对照', 'Model comparison')}
              </span>
            </div>
          ) : (
            <div className="chem-heat-formula">Ba(OH)₂·8H₂O ＋ NH₄Cl</div>
          )}
        </>
      )}
      {!film.watch && (
        <div className="chem-heat-controls">
          <Segments
            label={say('反应', 'Reaction')}
            value={kind}
            onChange={(v) => setKind(v as 'magnesium' | 'crystals')}
            options={[
              { value: 'magnesium', label: say('镁与盐酸', 'Magnesium + acid') },
              { value: 'crystals', label: say('晶体吸热', 'Crystal cooling') },
            ]}
          />
          <Range
            label={say('模型过程时间', 'Model process time')}
            value={seconds}
            min={0}
            max={90}
            step={1}
            onChange={setSeconds}
          />
          <Range
            label={say('最终反应程度', 'Final reaction extent')}
            value={amount}
            min={0}
            max={1}
            step={0.01}
            onChange={setAmount}
          />
          <Range
            label={say('与环境的传热系数', 'Heat exchange with surroundings')}
            value={coupling}
            min={0}
            max={0.5}
            step={0.01}
            onChange={setCoupling}
          />
          {kind === 'crystals' && (
            <Segments
              label={say('木片界面', 'Wood interface')}
              value={String(wet)}
              onChange={(v) => setWet(v === 'true')}
              options={[
                { value: 'true', label: say('有水层', 'Wet') },
                { value: 'false', label: say('干燥', 'Dry') },
              ]}
            />
          )}
          <details>
            <summary>{say('热模型的限定', 'Thermal model limits')}</summary>
            <p>
              {say(
                '温度、时间、热容及热量均为教学模型设定，不是教材实测数据或指定用量的预测。杯底水与反应混合物按理想良好热接触处理，冻结使用水的相变潜热；粘接判据只表示存在足够冰层，不计算机械强度。',
                'Temperatures, times, capacities and reaction heat budgets are teaching fixtures, not textbook measurements or predictions for specified quantities. Interface water and the reaction mixture share ideal thermal contact; freezing uses water latent heat. Attachment indicates sufficient ice in the model, not a mechanical-strength calculation.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
