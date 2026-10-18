import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  peroxideReaction,
  enzymeConversion,
  amylaseSpecificity,
  cellFreeFermentation,
  cagedMeat,
  type PeroxideCondition,
} from '../../models/bio-enzyme-investigations';
import '../../styles/bio-enzyme-investigations.css';
type Case =
  | 'stomach'
  | 'peroxide'
  | 'cell-free'
  | 'urease'
  | 'specificity'
  | 'temperature'
  | 'ph'
  | 'recovery';
const keys: Case[] = [
  'stomach',
  'peroxide',
  'cell-free',
  'urease',
  'specificity',
  'temperature',
  'ph',
  'recovery',
];
const names = [
  '胃液与肉块',
  '过氧化氢分解',
  '无细胞发酵',
  '脲酶结晶',
  '淀粉酶专一性',
  '温度条件',
  'pH条件',
  '恢复温度',
];
function ReactionTube({
  fraction,
  time,
  color = '#d8d8b8',
  bath = false,
  bubbles = true,
  id,
}: {
  fraction: number;
  time: number;
  color?: string;
  bath?: boolean;
  bubbles?: boolean;
  id: string;
}) {
  return (
    <svg viewBox="0 0 110 220" role="img" aria-label={t('试管中相同初始样液与反应进程')}>
      <defs>
        <clipPath id={id}>
          <path d="M33 24H77V170Q77 192 55 192Q33 192 33 170Z" />
        </clipPath>
      </defs>
      {bath && (
        <path d="M12 95V205H98V95M14 130H96" fill="#c8deda" fillOpacity=".5" stroke="#9fb4ac" />
      )}
      <g clipPath={`url(#${id})`}>
        <rect x="33" y="94" width="44" height="100" fill={color} />
        {bubbles &&
          Array.from({ length: 16 }, (_, i) => {
            const phase = (time * 0.15 + i * 0.271) % 1;
            return (
              <circle
                key={i}
                cx={39 + ((i * 17) % 31)}
                cy={185 - phase * 100}
                r={1.5 + (i % 3) * 0.7}
                fill="#eff2e5"
                stroke="#adbca7"
                opacity={Math.max(0, Math.min(1, fraction * 16 - i)) * Math.sin(phase * Math.PI)}
              />
            );
          })}
      </g>
      <path
        d="M30 22H80M33 24V170Q33 192 55 192Q77 192 77 170V24"
        stroke="#8da49b"
        strokeWidth="2"
        fill="none"
      />
      <path d="M39 36V86" stroke="#fff" strokeWidth="3" opacity=".6" />
    </svg>
  );
}
export default function BioEnzymeInvestigations() {
  const f = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Case>(
      keys.includes(f.variant as Case) ? (f.variant as Case) : 'peroxide',
    ),
    [progress, setProgress] = useState(0.6),
    [temperature, setTemperature] = useState(25),
    [ph, setPh] = useState(7),
    [active, setActive] = useState(true);
  const m = f.watch ? keys[Math.min(f.chapter, 7)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.85)) : progress,
    time = 12 * p;
  return (
    <section className="bio-enzyme">
      <p className="bio-enzyme-kind">{t(names[keys.indexOf(m)])}</p>
      {m === 'stomach' ? (
        <svg
          className="bio-enzyme-main"
          viewBox="0 0 350 250"
          role="img"
          aria-label={t('胃液进入金属笼，机械挤压不能直接触及肉块')}
        >
          <path
            d="M145 20V73Q89 74 81 119Q67 193 141 216Q242 246 269 175Q303 89 223 78V22"
            fill="#d9bda9"
            stroke="#b19780"
            strokeWidth="5"
          />
          <path d="M98 131Q155 115 265 132Q264 225 175 216Q97 209 98 131Z" fill="#ddc892" />
          <rect
            x="126"
            y="115"
            width="94"
            height="73"
            rx="13"
            fill="none"
            stroke="#89978d"
            strokeWidth="4"
          />
          <path
            d="M138 116V187M154 116V187M170 116V187M186 116V187M202 116V187M126 137H220M126 160H220"
            stroke="#9ba69b"
            strokeWidth="2"
          />
          <path
            d="M161 141q14-14 29 2l-4 26-30-4Z"
            fill="#b78475"
            transform={`translate(175 155) scale(${Math.cbrt(cagedMeat(p, f.watch ? true : active).fraction)}) translate(-175 -155)`}
          />
        </svg>
      ) : m === 'peroxide' ? (
        <div className="bio-enzyme-tubes">
          {(['blank', 'heated', 'iron', 'catalase'] as PeroxideCondition[]).map((condition, i) => {
            const state = peroxideReaction(time, condition);
            return (
              <div key={condition}>
                <ReactionTube
                  id={`${id}-${i}`}
                  fraction={Math.min(1, state.rate / 0.15)}
                  time={time}
                  bath={i === 1}
                  color={i === 2 ? '#dacb92' : i === 3 ? '#c6b8a0' : '#d5e0c6'}
                />
                <p>{t(['室温空白', '约90 ℃水浴', 'FeCl₃', '肝脏研磨液'][i])}</p>
                <p>O₂ {Math.round(state.oxygen * 200)}%</p>
              </div>
            );
          })}
        </div>
      ) : m === 'cell-free' ? (
        <>
          <svg
            className="bio-enzyme-main"
            viewBox="0 0 350 250"
            role="img"
            aria-label={t('酵母研磨过滤后，滤液中的催化体系仍可发酵')}
          >
            <path d="M35 55H135L105 115H90V161" fill="#d6d7bb" stroke="#98a18e" strokeWidth="2" />
            <path d="M51 75H120" stroke="#aaa483" strokeWidth="4" />
            {Array.from({ length: 9 }, (_, i) => (
              <ellipse
                key={i}
                cx={60 + ((i * 31) % 52)}
                cy={62 + ((i * 7) % 15)}
                rx="5"
                ry="3"
                fill="#b4ad8f"
              />
            ))}
            <path d="M61 155L53 218H145L135 155" fill="#d8dcb9" stroke="#99a590" strokeWidth="2" />
            <path d="M146 186H219" stroke="#a8ac8d" strokeWidth="2" strokeDasharray="4 5" />
            <path
              d="M237 48H281V108L310 209Q312 221 299 221H220Q208 221 211 209L237 108Z"
              fill="#e0e2c5"
              stroke="#96a58e"
              strokeWidth="2"
            />
            {Array.from({ length: 16 }, (_, i) => (
              <circle
                key={i}
                cx={231 + ((i * 19) % 57)}
                cy={200 - ((p * 2 + i * 0.13) % 1) * 75}
                r="3"
                fill="#f3f1d8"
                stroke="#aeb79b"
                opacity={cellFreeFermentation(time, f.watch ? true : active).carbonDioxide / 2}
              />
            ))}
          </svg>
          <div className="bio-enzyme-ledger">
            <span>{t('细胞留在滤渣')}</span>
            <span>{t('滤液 + 葡萄糖')}</span>
            <span>{t('酒精与CO₂')}</span>
          </div>
        </>
      ) : m === 'urease' ? (
        <>
          <svg
            className="bio-enzyme-main"
            viewBox="0 0 350 250"
            role="img"
            aria-label={t('脲酶结晶分离后，分别检验蛋白性质与催化活性')}
          >
            <ellipse cx="70" cy="125" rx="49" ry="30" fill="#d8debf" stroke="#9da98c" />
            {Array.from({ length: 6 }, (_, i) => (
              <path
                key={i}
                d={`M${38 + ((i * 23) % 60)} ${112 + ((i * 17) % 25)}l8-5 9 8-8 6Z`}
                fill="#ece5be"
                stroke="#bab48c"
              />
            ))}
            <path
              d="M125 125H143L165 75M143 125L165 180"
              stroke="#a6b08f"
              fill="none"
              strokeWidth="2"
            />
            <path
              d="M180 35V96Q180 115 197 115Q214 115 214 96V35"
              fill="#d9debb"
              stroke="#95a38b"
              strokeWidth="2"
            />
            <path d="M183 74V96Q183 112 197 112Q211 112 211 96V74Z" fill="#aa95b8" opacity={p} />
            <path
              d="M180 145V206Q180 225 197 225Q214 225 214 206V145"
              fill="#d9debb"
              stroke="#95a38b"
              strokeWidth="2"
            />
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                cx={188 + ((i * 13) % 19)}
                cy={205 - ((p + i * 0.17) % 1) * 45}
                r="2"
                fill="#6b8066"
                opacity={p}
              />
            ))}
            <text x="228" y="73" fontSize="24" fill="currentColor">
              {browserLocale() === 'en' ? (
                <>
                  <tspan x="228">Protein</tspan>
                  <tspan x="228" dy="29">
                    assay
                  </tspan>
                </>
              ) : (
                t('蛋白鉴定')
              )}
            </text>
            <text x="228" y="180" fontSize="24" fill="currentColor">
              <tspan x="228">NH₃ +</tspan>
              <tspan x="228" dy="29">
                CO₂
              </tspan>
            </text>
          </svg>
          <div className="bio-enzyme-ledger">
            <span>{t('结晶分离')}</span>
            <span>{t('两份样品，两种检验')}</span>
          </div>
        </>
      ) : m === 'specificity' ? (
        <div className="bio-enzyme-specificity">
          {(['starch', 'sucrose'] as const).map((substrate, i) => {
            const state = amylaseSpecificity(substrate, time);
            return (
              <div key={substrate}>
                <svg
                  viewBox="0 0 170 180"
                  role="img"
                  aria-label={t('同一种淀粉酶对淀粉与蔗糖的不同作用')}
                >
                  <path
                    d="M34 109Q20 58 65 49L84 69L103 49Q151 65 134 109Q84 150 34 109Z"
                    fill="#a69ab2"
                  />
                  {Array.from({ length: substrate === 'starch' ? 7 : 2 }, (_, j) => (
                    <path
                      key={j}
                      d={`M${36 + j * 15 + (i === 0 ? state.converted * (j - 3) * 5 : 0)} ${29 - (i === 0 ? state.converted * 12 : 0)}l6-4 7 4v7l-7 4-6-4Z`}
                      fill={i === 0 ? '#b9b77d' : '#b99176'}
                    />
                  ))}
                  <path
                    d="M65 148H107"
                    stroke={state.positive ? '#b66e4c' : '#8ab0b5'}
                    strokeWidth="17"
                    strokeLinecap="round"
                  />
                </svg>
                <p>{t(i === 0 ? '淀粉 + 淀粉酶' : '蔗糖 + 淀粉酶')}</p>
                <p>{t(state.positive ? '后续斐林检测：阳性' : '后续斐林检测：阴性')}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="bio-enzyme-conditions">
            {[0, 1, 2].map((i) => {
              const baseTemp = m === 'ph' || m === 'recovery' ? 25 : [5, 40, 80][i],
                temp = !f.watch && i === 1 && m === 'temperature' ? temperature : baseTemp,
                preheat =
                  m === 'recovery' ? (!f.watch && i === 1 ? temperature : [5, 25, 85][i]) : temp,
                acidity = m === 'ph' ? (!f.watch && i === 1 ? ph : [3, 7, 11][i]) : 7;
              const st = enzymeConversion(time, temp, acidity, preheat);
              return (
                <div key={i}>
                  <ReactionTube
                    id={`${id}-condition-${i}`}
                    fraction={Math.min(1, st.rate / 0.15)}
                    time={time}
                    bubbles={m === 'ph'}
                    color={
                      m === 'ph'
                        ? '#d0d8b6'
                        : `rgb(${Math.round(89 + st.converted * 115)},${Math.round(88 + st.converted * 123)},${Math.round(109 + st.converted * 71)})`
                    }
                  />
                  <p>
                    {m === 'ph'
                      ? `pH ${acidity}`
                      : m === 'recovery'
                        ? `${preheat} → 25 ℃`
                        : `${temp} ℃`}
                  </p>
                  <p>
                    {t('剩余底物')} {Math.round(st.remaining * 100)}%
                  </p>
                </div>
              );
            })}
          </div>
          <p className="bio-enzyme-assay">
            {t(m === 'ph' ? '过氧化氢酶：观察放氧速率' : '淀粉酶：等时取样后用碘液比较剩余淀粉')}
          </p>
        </>
      )}
      {!f.watch && (
        <div className="bio-enzyme-controls">
          <Segments
            value={mode}
            onChange={setMode}
            label={t('实验与研究')}
            options={keys.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('反应进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {['temperature', 'recovery'].includes(mode) && (
            <Range
              label={t(mode === 'recovery' ? '中间组预处理温度' : '中间组温度')}
              value={temperature}
              min={5}
              max={85}
              unit="℃"
              onChange={setTemperature}
            />
          )}
          {mode === 'ph' && (
            <Range label={t('中间组pH')} value={ph} min={2} max={12} step={0.5} onChange={setPh} />
          )}
          {(m === 'cell-free' || m === 'stomach') && (
            <button type="button" aria-pressed={active} onClick={() => setActive(!active)}>
              {t(active ? '有效催化成分：有' : '有效催化成分：无')}
            </button>
          )}
          <p>{t('速率、颜色与百分比为教学模型；不同来源酶的最适条件不同。')}</p>
        </div>
      )}
    </section>
  );
}
