import { useState, useId } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  carbonateHeating,
  carbonateDissolving,
  carbonateDirector,
  type CarbonateSalt,
} from '../../models/chem-carbonate-comparison';
import '../../styles/chem-carbonate-comparison.css';
export default function ChemCarbonateComparison() {
  const film = useShowcase(),
    { host, compact } = useSignalWidth(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState(film.variant === 'thermal' ? 'heat' : 'dissolve'),
    [salt, setSalt] = useState<CarbonateSalt>('bicarbonate'),
    [progress, setProgress] = useState(0.8),
    [mass, setMass] = useState(1);
  const d = film.watch
    ? carbonateDirector(film.chapter, film.chapterProgress)
    : { mode, stage: progress, indicator: progress > 0.8, salt, extent: progress, balance: true };
  const s = carbonateHeating(d.salt, film.watch ? 1 : mass, d.extent),
    heat = d.mode === 'heat';
  return (
    <section
      ref={host}
      className="chem-carbonate-comparison"
      data-watch={film.watch}
      data-balance={d.balance}
    >
      <header>
        <p>
          {say(
            heat ? '相似的白色固体，加热后走向不同' : '从加水到显色，保持相同观察步骤',
            heat
              ? 'Similar white solids respond differently to heat'
              : 'Compare the same sequence: water, then indicator',
          )}
        </p>
        <span>
          {heat
            ? d.salt === 'carbonate'
              ? 'Na₂CO₃'
              : 'NaHCO₃'
            : say('碳酸钠 / 碳酸氢钠', 'Carbonate / bicarbonate')}
        </span>
      </header>
      {!heat ? (
        <div className="chem-carbonate-tubes">
          {(['carbonate', 'bicarbonate'] as CarbonateSalt[]).map((material) => {
            const a = carbonateDissolving(material, d.stage),
              warm = a.heatDirection > 0;
            return (
              <figure key={material}>
                <figcaption>{material === 'carbonate' ? 'Na₂CO₃' : 'NaHCO₃'}</figcaption>
                <svg
                  viewBox="60 35 140 225"
                  role="img"
                  aria-label={say(
                    warm
                      ? '碳酸钠先水合结块放热，继续加水溶解，酚酞显红色'
                      : '碳酸氢钠溶解吸热，少量水不能使固体全部溶解，酚酞显浅色',
                    warm
                      ? 'Carbonate hydrates and warms, dissolves with more water, then colours the indicator'
                      : 'Bicarbonate cools while dissolving, retains excess solid, and gives a faint indicator colour',
                  )}
                >
                  <defs>
                    <clipPath id={`${id}-${material}`}>
                      <path d="M75 45V216A30 30 0 0 0 135 216V45Z" />
                    </clipPath>
                  </defs>
                  <path
                    d="M75 45V216A30 30 0 0 0 135 216V45"
                    stroke="#96ac9d"
                    strokeWidth="2"
                    fill="#bfd5c422"
                  />
                  <g clipPath={`url(#${id}-${material})`}>
                    <rect
                      x="75"
                      y={246 - a.waterGrams * 21}
                      width="60"
                      height={a.waterGrams * 21}
                      fill={d.indicator ? '#ca7198' : '#a9cbbb'}
                      opacity={d.indicator ? a.indicatorTone : 0.28}
                    />
                    {Array.from({ length: 18 }, (_, i) => {
                      const r = a.residualGrams;
                      return (
                        <rect
                          key={i}
                          x={79 + (i % 6) * 8}
                          y={224 + Math.floor(i / 6) * 7 - r * 5}
                          width={5 + a.hydration * 3}
                          height={5 + a.hydration * 3}
                          rx={a.hydration * 2}
                          fill="#e8e5d1"
                          stroke="#cbd0b9"
                          opacity={i / 18 < r ? 1 : 0}
                        />
                      );
                    })}
                  </g>
                  <ellipse cx="105" cy="45" rx="30" ry="6" stroke="#96ac9d" fill="none" />
                  <rect
                    x="160"
                    y="69"
                    width="9"
                    height="132"
                    rx="4"
                    stroke="#a0ad93"
                    fill="#f3f1dc"
                  />
                  <circle cx="164.5" cy="204" r="10" fill="#d2a379" />
                  <path
                    d={`M164.5 201V${145 - (warm ? 26 : -25) * Math.min(1, d.stage * 3)}`}
                    stroke="#bd9677"
                    strokeWidth="4"
                  />
                  <path
                    d={`M187 150v${warm ? -28 : 28}m-5 ${warm ? 5 : -5}l5 ${warm ? -5 : 5} 5 ${warm ? 5 : -5}`}
                    stroke={warm ? '#bf8c62' : '#7eaaaf'}
                    strokeWidth="2"
                    fill="none"
                    opacity={Math.min(1, d.stage * 3)}
                  />
                  {!d.indicator && (
                    <circle
                      cx="105"
                      cy={55 + d.stage * 80}
                      r="4"
                      fill="#a4c5b7"
                      opacity={d.stage < 0.95 ? 0.7 : 0}
                    />
                  )}
                </svg>
                {!d.indicator && (
                  <p>
                    {say(
                      warm ? '先结块、温度上升' : '溶解时温度下降',
                      warm
                        ? 'Initial clumping; temperature rises'
                        : 'Dissolution lowers temperature',
                    )}
                  </p>
                )}
                {d.indicator && (
                  <p>
                    {say(
                      warm ? '酚酞颜色较深' : '酚酞颜色较浅',
                      warm ? 'Deeper indicator colour' : 'Fainter indicator colour',
                    )}
                  </p>
                )}
              </figure>
            );
          })}
        </div>
      ) : (
        <>
          <div className="chem-carbonate-heating">
            <svg
              viewBox={compact ? '0 0 300 370' : '40 70 490 240'}
              role="img"
              aria-label={say(
                '受热试管经连续导气管连接澄清石灰水，碳酸氢钠释放二氧化碳',
                'A heated test tube connects through a continuous gas tube to limewater; bicarbonate releases carbon dioxide',
              )}
            >
              <g transform={compact ? 'scale(.8)' : undefined}>
                <path
                  d="M54 254H228M89 254V98M89 109H183"
                  stroke="#9cae94"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <g transform="rotate(8 104 125)">
                  <path
                    d="M286 98H110A25 25 0 0 0 110 148H286"
                    fill="#d2e1d033"
                    stroke="#a8bdab"
                    strokeWidth="2"
                  />
                  <path d="M102 137Q155 129 205 142L106 145Z" fill="#e2ddbf" stroke="#c7c7aa" />
                  <rect x="273" y="97" width="18" height="52" rx="4" fill="#ab9577" />
                  <path d="M280 121H350" stroke="#91aca1" strokeWidth="8" />
                  <path d="M280 121H350" stroke="#e5eddc" strokeWidth="4" />
                  {s.gasMoles > 0 &&
                    Array.from({ length: 6 }, (_, i) => (
                      <circle
                        key={i}
                        cx={150 + i * 28}
                        cy={111 + (i % 2) * 10}
                        r="2"
                        fill="#b0bbaa"
                        opacity={s.extent}
                      />
                    ))}
                </g>
              </g>
              <path
                d={compact ? 'M278.4 124H280V226H167V320' : 'M348 155H450Q464 155 464 170V260'}
                fill="none"
                stroke="#91aca1"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d={compact ? 'M278.4 124H280V226H167V320' : 'M348 155H450Q464 155 464 170V260'}
                fill="none"
                stroke="#e5eddc"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <g transform={compact ? 'translate(-297 60)' : undefined}>
                <path
                  d="M427 190V278Q427 294 470 294T513 278V190"
                  fill="#bdd2be22"
                  stroke="#9bb49e"
                  strokeWidth="2"
                />
                <path
                  d="M429 232V278Q429 292 470 292T511 278V232Z"
                  fill="#fffef1"
                  stroke="#c3c7aa"
                  strokeWidth="1"
                  opacity={0.12 + s.extent * 0.86}
                />
                {s.gasMoles > 0 &&
                  Array.from({ length: 7 }, (_, i) => (
                    <circle
                      key={i}
                      cx={464 + Math.sin(i * 2) * 6}
                      cy={260 - ((i * 8 + s.extent * 50) % 38)}
                      r={2 + (i % 2)}
                      fill="none"
                      stroke="#a6b9a0"
                      opacity={s.extent}
                    />
                  ))}
              </g>
              <g transform={compact ? 'scale(.8)' : undefined}>
                <path
                  d="M129 249Q113 226 139 193Q136 220 153 223Q157 244 145 249Z"
                  fill="#d7ab6a"
                  opacity=".8"
                />
                <path d="M130 248Q126 232 140 218Q136 237 144 248Z" fill="#edce91" />
                <rect x="122" y="250" width="31" height="31" rx="8" fill="#aebf9c" />
                <ellipse cx="138" cy="282" rx="33" ry="5" fill="#c6cdb0" />
                {s.waterGrams > 0 &&
                  [0, 1, 2].map((i) => (
                    <path
                      key={i}
                      d={`M${230 + i * 12} ${140 + i * 2}q-4 6 0 8q4-2 0-8`}
                      fill="#9abdb4"
                      opacity={s.extent}
                    />
                  ))}
              </g>
            </svg>
            <div className="chem-carbonate-apparatus-labels">
              <span>{say('受热固体', 'Heated solid')}</span>
              <span>
                {say(
                  s.gasMoles > 0 ? '石灰水逐渐浑浊' : '石灰水保持澄清',
                  s.gasMoles > 0 ? 'Limewater becomes cloudy' : 'Limewater stays clear',
                )}
              </span>
            </div>
          </div>
          {d.balance && (
            <div className="chem-carbonate-balance">
              <p>
                {d.salt === 'bicarbonate'
                  ? '2NaHCO₃ → Na₂CO₃ + H₂O + CO₂'
                  : say(
                      'Na₂CO₃：本实验条件下无明显分解',
                      'Na₂CO₃: no appreciable decomposition under lesson conditions',
                    )}
              </p>
              <div className="chem-carbonate-mass-track">
                <i
                  style={{
                    width: `${s.initialGrams ? (s.residueGrams / s.initialGrams) * 100 : 0}%`,
                  }}
                />
                <i
                  style={{
                    width: `${s.initialGrams ? (s.waterGrams / s.initialGrams) * 100 : 0}%`,
                  }}
                />
                <i
                  style={{
                    width: `${s.initialGrams ? (s.carbonDioxideGrams / s.initialGrams) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="chem-carbonate-mass-labels">
                <span>
                  {say('残留固体', 'Solid residue')} {s.residueGrams.toFixed(3)} g
                </span>
                <span>H₂O {s.waterGrams.toFixed(3)} g</span>
                <span>CO₂ {s.carbonDioxideGrams.toFixed(3)} g</span>
              </div>
            </div>
          )}
        </>
      )}
      {!film.watch && (
        <div className="chem-carbonate-controls">
          <Segments
            label={say('比较项目', 'Comparison')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'dissolve', label: say('加水与显色', 'Water and indicator') },
              { value: 'heat', label: say('受热分解', 'Thermal decomposition') },
            ]}
          />
          {heat && (
            <>
              <Segments
                label={say('固体种类', 'Solid')}
                value={salt}
                onChange={setSalt}
                options={[
                  { value: 'carbonate', label: 'Na₂CO₃' },
                  { value: 'bicarbonate', label: 'NaHCO₃' },
                ]}
              />
              <Range
                label={say('模型初始质量', 'Model initial mass')}
                value={mass}
                min={0.2}
                max={2}
                step={0.1}
                unit="g"
                onChange={setMass}
              />
            </>
          )}
          <Range
            label={say(
              heat ? '模型反应进度' : '观察进度',
              heat ? 'Model reaction extent' : 'Observation progress',
            )}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
        </div>
      )}
      <details>
        <summary>{say('定量模型与观察范围', 'Model and limits')}</summary>
        <p>
          {say(
            '温度计只显示升降方向，不虚构教材温度。溶解图采用室温终态近似，水合放热与吸热仅作定性观察。热分解进度由演示控制，不等同于加热秒数；质量由方程式守恒计算。碳酸钠不分解限于教材加热条件，石灰水只显示少量二氧化碳阶段。',
            'Thermometers show direction, not invented textbook temperatures. Dissolution uses a room-temperature endpoint approximation; heat effects are qualitative. Reaction extent is controlled, not a heating-time prediction; masses follow stoichiometry. Carbonate stability refers to the lesson conditions, and limewater shows only the early carbon-dioxide stage.',
          )}
        </p>
      </details>
    </section>
  );
}
