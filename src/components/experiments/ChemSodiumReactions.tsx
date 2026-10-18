import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  alkaliWater,
  peroxideWater,
  immersedSphere,
  sodiumDirector,
  type SodiumView,
} from '../../models/chem-sodium-reactions';
import '../../styles/chem-sodium-reactions.css';
export default function ChemSodiumReactions() {
  const film = useShowcase(),
    { host, compact } = useSignalWidth(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState<SodiumView>(
      (
        ['surface', 'air', 'water', 'peroxide', 'potassium-air', 'potassium-water'] as string[]
      ).includes(film.variant || '')
        ? (film.variant as SodiumView)
        : 'surface',
    ),
    [extent, setExtent] = useState(0.65);
  const d = film.watch
    ? sodiumDirector(film.chapter, film.chapterProgress)
    : {
        view,
        progress: extent,
        extent,
        evidence: extent > 0.65,
        cut: Math.min(1, extent * 3),
        oxidation: Math.max(0, (extent - 0.4) / 0.6),
        melt: Math.min(1, extent * 3),
      };
  const potassium = d.view.startsWith('potassium'),
    water = d.view.endsWith('water'),
    air = d.view === 'air' || d.view === 'potassium-air',
    peroxide = d.view === 'peroxide';
  const s = alkaliWater(d.extent, potassium ? 'K' : 'Na'),
    q = peroxideWater(d.extent);
  const radius = 23 * s.radiusFraction,
    cx = 220 + Math.sin(d.progress * 9) * 38 * d.extent,
    cy = 154 + radius * (immersedSphere(s.density) * 2 - 1);
  const flame = potassium ? '#c7a2d6' : '#e4bc70';
  const title = water
    ? say(
        potassium ? '钾与水：同类性质，更强烈的现象' : '钠与水：位置、形状、颜色分别提供证据',
        potassium
          ? 'Potassium and water: a stronger response'
          : 'Sodium and water: position, shape and colour are separate clues',
      )
    : peroxide
      ? say('同样遇水，气体却不同', 'Water again, but a different gas')
      : air
        ? say('加热改变反应现象与产物', 'Heating changes the observation and product')
        : say('新切面先明亮，再逐渐变暗', 'A fresh surface shines, then tarnishes');
  return (
    <section ref={host} className="chem-sodium-reactions" data-watch={film.watch}>
      <header>
        <p>{title}</p>
        <span>{say('教材现象重建', 'Textbook observation reconstruction')}</span>
      </header>
      <div className="chem-sodium-object">
        <svg
          viewBox={
            compact
              ? water
                ? '45 100 390 200'
                : peroxide
                  ? '160 40 155 250'
                  : air
                    ? '110 20 260 300'
                    : '90 30 290 250'
              : '0 0 480 330'
          }
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={`${id}metal`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ecebd5" />
              <stop offset=".45" stopColor="#acbcb0" />
              <stop offset=".55" stopColor="#dae3d7" />
              <stop offset="1" stopColor="#8c9f93" />
            </linearGradient>
            <radialGradient id={`${id}glow`}>
              <stop stopColor={flame} stopOpacity=".4" />
              <stop offset="1" stopColor={flame} stopOpacity="0" />
            </radialGradient>
          </defs>
          {d.view === 'surface' && (
            <g>
              <ellipse cx="236" cy="260" rx="136" ry="12" fill="#aeb796" opacity=".25" />
              <path
                d="M122 132L287 104L352 152L181 191Z"
                fill={`url(#${id}metal)`}
                stroke="#a3b09b"
              />
              <path d="M122 132V214L181 251V191Z" fill="#9baa9c" />
              <path d="M181 191L352 152V229L181 251Z" fill={`url(#${id}metal)`} />
              <path d="M181 191L352 152V229L181 251Z" fill="#929b88" opacity={d.oxidation * 0.85} />
              <path
                d={`M${190 + d.cut * 22} ${55 + d.cut * 100}l91-20 11 25-93 23Z`}
                fill="#c2cbbb"
                stroke="#a1af9b"
              />
              <path
                d={`M${283 + d.cut * 22} ${35 + d.cut * 100}l53-11 6 25-50 11Z`}
                fill="#a68e70"
              />
              <path
                d="M197 202L327 175"
                stroke="#f9f5dc"
                strokeWidth="3"
                opacity={(1 - d.oxidation) * d.cut}
              />
            </g>
          )}
          {air && (
            <g>
              <path
                d="M151 218L140 291M329 218L340 291M151 218H329"
                fill="none"
                stroke="#8d9c85"
                strokeWidth="4"
              />
              <path d="M229 282Q219 266 239 241Q236 261 249 270Q257 282 246 286Z" fill="#d6aa6b" />
              <rect x="225" y="285" width="31" height="18" rx="5" fill="#a3b18d" />
              <ellipse cx="241" cy="244" rx="112" ry="12" fill="#acb49a" opacity=".25" />
              <path
                d="M131 144Q142 240 240 243Q338 240 349 144Z"
                fill="#d5ccb0"
                stroke="#b7b59a"
                strokeWidth="2"
              />
              <ellipse
                cx="240"
                cy="144"
                rx="109"
                ry="27"
                fill="#b8b59b"
                stroke="#d8d6b8"
                strokeWidth="3"
              />
              <ellipse cx="240" cy="151" rx="88" ry="18" fill="#a2a78e" />
              <ellipse
                cx="240"
                cy="150"
                rx={22 + d.melt * 10}
                ry={15 - d.melt * 6}
                fill={`url(#${id}metal)`}
              />
              <ellipse
                cx="240"
                cy="155"
                rx="33"
                ry="9"
                fill="#d9cc8e"
                opacity={Math.max(0, (d.progress - 0.3) / 0.7)}
              />
              {d.progress > 0.3 && d.progress < 0.94 && (
                <>
                  <ellipse cx="240" cy="108" rx="75" ry="80" fill={`url(#${id}glow)`} />
                  <path
                    d="M220 151Q202 115 236 61Q235 100 255 111Q278 137 251 155Z"
                    fill={flame}
                    opacity=".8"
                  />
                  <path d="M230 152Q226 128 241 108Q240 134 250 152Z" fill="#f6e2ab" />
                </>
              )}
            </g>
          )}
          {water && (
            <g>
              <path
                d="M67 143V240Q67 279 240 279T413 240V143"
                stroke="#a0b7a5"
                strokeWidth="2"
                fill="#bad1bd22"
              />
              <ellipse cx="240" cy="143" rx="173" ry="31" fill="#b7d4c1" opacity=".32" />
              <path
                d="M69 154V240Q69 277 240 277T411 240V154Z"
                fill="#c780a0"
                opacity={0.02 + 0.25 * d.extent}
              />
              {s.remainingMoles > 0 && (
                <>
                  <rect
                    x={cx - radius}
                    y={cy - radius}
                    width={radius * 2}
                    height={radius * 2}
                    rx={3 + (radius - 3) * d.melt}
                    fill={`url(#${id}metal)`}
                  />
                  <path
                    d={`M${cx - radius - 16} 154q${radius + 16} 6 ${2 * radius + 32} 0`}
                    fill="none"
                    stroke="#91b4a0"
                    opacity=".65"
                  />
                </>
              )}
              {d.extent > 0 &&
                d.extent < 1 &&
                Array.from({ length: 10 }, (_, i) => (
                  <circle
                    key={i}
                    cx={cx + Math.sin(i * 3) * 20}
                    cy={160 - ((d.progress * 160 + i * 11) % 72)}
                    r={2 + (i % 3)}
                    fill="none"
                    stroke="#a3bca6"
                    opacity=".7"
                  />
                ))}
              {potassium && d.extent > 0.15 && d.extent < 0.85 && (
                <path
                  d={`M${cx - 12} 149q-10-25 10-45q0 20 13 25q8 12-2 20Z`}
                  fill={flame}
                  opacity=".8"
                />
              )}
              <path d="M69 156Q240 190 411 156" fill="none" stroke="#b3c9b4" />
              <path d="M81 168V235" stroke="#e3e8cf" strokeWidth="3" opacity=".5" />
            </g>
          )}
          {peroxide && (
            <g>
              <path
                d="M174 80V242A42 42 0 0 0 258 242V80"
                fill="#bfd4c122"
                stroke="#9fb69f"
                strokeWidth="2"
              />
              <ellipse cx="216" cy="80" rx="42" ry="8" fill="none" stroke="#9fb69f" />
              <path d="M176 205V242A40 40 0 0 0 256 242V205Z" fill="#b8cfb4" opacity=".3" />
              <path
                d="M185 261Q213 243 246 263L233 278H200Z"
                fill="#d8cf96"
                opacity={1 - q.extent}
              />
              {q.extent > 0 &&
                Array.from({ length: 9 }, (_, i) => (
                  <circle
                    key={i}
                    cx={199 + (i % 3) * 16}
                    cy={240 - ((d.progress * 150 + i * 17) % 110)}
                    r={2 + (i % 3)}
                    fill="none"
                    stroke="#a3b79c"
                    opacity={q.extent}
                  />
                ))}
              <path d="M211 28V116" stroke="#a88b65" strokeWidth="7" strokeLinecap="round" />
              <circle cx="211" cy="118" r={3 + q.extent * 4} fill="#cb9c6a" />
              {q.extent > 0.2 && (
                <path
                  d="M204 122q-10-21 7-42q-3 16 9 25q5 12-4 18Z"
                  fill="#e0b679"
                  opacity={q.extent}
                />
              )}
              <path
                d="M293 219v-45m-6 7 6-7 6 7"
                stroke="#bb9868"
                strokeWidth="2"
                opacity={q.extent}
              />
              {d.evidence && (
                <>
                  <rect x="328" y="173" width="27" height="76" rx="3" fill="#c2b692" />
                  <rect x="328" y="216" width="27" height="33" rx="3" fill="#7d9da4" />
                </>
              )}
            </g>
          )}
        </svg>
      </div>
      <div className="chem-sodium-evidence">
        {water ? (
          <>
            <span>{potassium ? '2K + 2H₂O → 2KOH + H₂' : '2Na + 2H₂O → 2NaOH + H₂'}</span>
            {d.evidence && (
              <span>{say('酚酞变色：溶液呈碱性', 'Indicator colour: alkaline solution')}</span>
            )}
          </>
        ) : peroxide ? (
          <>
            <span>2Na₂O₂ + 2H₂O → 4NaOH + O₂</span>
            <span>
              {say(
                d.evidence ? '试纸显示碱性；同时观察到放热' : '带火星木条复燃，支持氧气判断',
                d.evidence
                  ? 'Alkaline test paper; heat is also released'
                  : 'A glowing splint relights, supporting oxygen identification',
              )}
            </span>
          </>
        ) : air ? (
          <span>
            {potassium
              ? say(
                  '观察：紫色火焰；本段不指定单一氧化产物',
                  'Observation: lilac flame; no unique oxide product assigned here',
                )
              : '2Na + O₂ → Na₂O₂'}
          </span>
        ) : (
          <span>
            {say(
              '教材用 Na₂O 表示常温初期表面氧化产物',
              'The textbook represents initial surface oxidation as Na₂O',
            )}
          </span>
        )}
      </div>
      {!film.watch && (
        <div className="chem-sodium-controls">
          <Segments
            label={say('观察对象', 'Observation')}
            value={view}
            onChange={setView}
            options={[
              { value: 'surface', label: say('新切面', 'Fresh surface') },
              { value: 'air', label: say('钠受热', 'Heated sodium') },
              { value: 'water', label: say('钠与水', 'Sodium and water') },
              { value: 'peroxide', label: say('过氧化钠', 'Sodium peroxide') },
              { value: 'potassium-air', label: say('钾受热', 'Heated potassium') },
              { value: 'potassium-water', label: say('钾与水', 'Potassium and water') },
            ]}
          />
          <Range
            label={say('现象与反应进度', 'Observation and reaction progress')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
        </div>
      )}
      <details>
        <summary>{say('哪些是证据，哪些是简化', 'Evidence and simplifications')}</summary>
        <p>
          {say(
            '本片用于观察教师演示中的证据，不提供家庭操作步骤。反应进度不是实测速率；运动、温度和火焰形状定性呈现。浮力模型只用金属与水的密度比，未计气泡支撑和表面张力。钠块的体积随剩余量减小，气体与碱的量按方程式计算。长期空气氧化与钾的氧化产物可更复杂。',
            'This scene explains evidence from teacher demonstrations, without home-operation instructions. Progress is not a measured rate; motion, temperature and flames are qualitative. Buoyancy uses density ratio alone, omitting gas support and surface tension. Metal volume follows the remaining amount, while gas and alkali follow stoichiometry. Long air exposure and potassium oxidation can involve more complex products.',
          )}
        </p>
      </details>
    </section>
  );
}
