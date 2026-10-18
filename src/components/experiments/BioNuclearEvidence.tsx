import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  nuclearTransfer,
  constrictedEmbryo,
  amoebaFragment,
  algaRegeneration,
  macaqueOutcomes,
  cleavageRegions,
  amoebaOutline,
  type NuclearCase,
} from '../../models/bio-nuclear-evidence';
import '../../styles/bio-nuclear-evidence.css';
const keys: NuclearCase[] = ['cow', 'axolotl', 'constriction', 'amoeba', 'alga', 'monkey', 'frog'];
const names = ['克隆牛', '美西螈', '蝾螈横缢', '变形虫', '伞藻', '克隆猴', '爪蟾'];
function Alga({
  x,
  nucleus,
  stem,
  cap,
  scale = 1,
}: {
  x: number;
  nucleus: 'umbrella' | 'daisy' | null;
  stem: 'umbrella' | 'daisy';
  cap: 'umbrella' | 'daisy' | null;
  scale?: number;
}) {
  const color = stem === 'umbrella' ? '#6a9b88' : '#bd917e';
  return (
    <g transform={`translate(${x} 185)`}>
      <path
        d="M0 0Q9-65 0-125M0 0l-18 15M0 0l15 13M0 0v21"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {nucleus && <circle cy="-1" r="7" fill={nucleus === 'umbrella' ? '#497e70' : '#a16f64'} />}
      {cap && (
        <g transform={`translate(0 -125) scale(${scale})`}>
          {cap === 'umbrella' ? (
            <path d="M-35-8Q0-30 35-8L0 12Z" fill="#6a9b88" />
          ) : (
            Array.from({ length: 10 }, (_, i) => (
              <ellipse
                key={i}
                cy="-15"
                rx="5"
                ry="18"
                fill="#bd917e"
                transform={`rotate(${i * 36})`}
              />
            ))
          )}
        </g>
      )}
    </g>
  );
}
function Animal({
  kind,
  color = '#8a775f',
  x = 265,
  y = 194,
  scale = 1,
}: {
  kind: NuclearCase;
  color?: string;
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {kind === 'cow' ? (
        <>
          <path
            d="M-37-22H17L29-39L42-31L43-11L24-3L21 20H11L8 1H-17L-22 20H-31L-28-1L-39-6Z"
            fill={color}
          />
          <path d="M-37-18l-12-9m77-9-4-10m10 12 6-7" stroke={color} strokeWidth="3" />
          <circle cx="35" cy="-24" r="2" fill="#eae7d5" />
        </>
      ) : kind === 'axolotl' ? (
        <>
          <path d="M-37-4Q-10-28 18-10Q42-8 43 5Q22 20-12 9L-48 18L-37-4Z" fill={color} />
          <path
            d="M18-9l-1-17m3 18 9-17m-7 20 18-7M-12 4l-10 17M8 7l6 17"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="32" cy="-2" r="2" fill="#e8e5d7" />
        </>
      ) : (
        <>
          <ellipse cx="-10" cy="-5" rx="25" ry="18" fill="#7c9a73" />
          <path d="M8-14Q32-30 44-3Q30-15 12 6" fill="#7c9a73" />
          <circle cx="-24" cy="-10" r="3" fill="#354b40" />
        </>
      )}
    </g>
  );
}
export default function BioNuclearEvidence() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [mode, setMode] = useState<NuclearCase>(
      keys.includes(f.variant as NuclearCase) ? (f.variant as NuclearCase) : 'alga',
    ),
    [progress, setProgress] = useState(0.9),
    [restore, setRestore] = useState(true),
    [donor, setDonor] = useState<'umbrella' | 'daisy'>('daisy');
  const m = f.watch ? keys[Math.min(f.chapter, 6)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.85)) : progress,
    enabled = f.watch || restore,
    transfer = nuclearTransfer(p, enabled),
    embryo = constrictedEmbryo(p, enabled),
    algaSource = f.watch ? 'daisy' : donor,
    alga = algaRegeneration(p, algaSource, 'umbrella'),
    algaTravel = ease(Math.min(1, p / 0.55));
  return (
    <section className="bio-nuclear">
      <p className="bio-nuclear-kind">
        {!f.watch && <>{t('历史研究重建')} · </>}
        {t(names[keys.indexOf(m)])}
      </p>
      {m === 'constriction' ? (
        <>
          <svg
            className="bio-nuclear-stage"
            viewBox="0 0 350 250"
            role="img"
            aria-label={t('横缢受精卵的有核半边先分裂，移入细胞核后另一半开始分裂')}
          >
            <defs>
              {[106, 238].map((cx, i) => (
                <clipPath key={cx} id={`${uid}-half-${i}`}>
                  <circle cx={cx} cy="126" r="54" />
                </clipPath>
              ))}
            </defs>
            <path
              d="M174 116C155 52 43 48 40 126C38 203 153 211 174 136C195 211 309 203 310 126C311 49 192 50 174 116Z"
              fill="#dec797"
              stroke="#ae9870"
              strokeWidth="3"
            />
            <path
              d="M175 65Q169 98 175 116M175 136Q180 167 175 193"
              fill="none"
              stroke="#9a705c"
              strokeWidth="3"
            />
            {[embryo.leftCells, embryo.rightCells].map((count, side) => {
              const regions = cleavageRegions(count, side ? 238 : 106, 126);
              return (
                <g key={side} clipPath={`url(#${uid}-half-${side})`}>
                  {regions.map((cell) => (
                    <g key={cell.id}>
                      <rect
                        x={cell.x}
                        y={cell.y}
                        width={cell.width}
                        height={cell.height}
                        fill="#e7d2a7"
                        stroke="#ba9c71"
                        strokeWidth="1.6"
                      />
                      {(side ? embryo.rightNucleus : !(embryo.sourceVacated && cell.id === 7)) && (
                        <circle cx={cell.nucleus.x} cy={cell.nucleus.y} r="4.3" fill="#97758b" />
                      )}
                    </g>
                  ))}
                </g>
              );
            })}
            {embryo.movingNucleus && (
              <circle
                cx={embryo.nucleusPoint.x}
                cy={embryo.nucleusPoint.y}
                r="4.3"
                fill="#97758b"
                stroke="#eee0bb"
                strokeWidth="1"
              />
            )}
          </svg>
          <div className="bio-nuclear-ledger">
            <span>
              {t('最初有核')} {embryo.leftCells}
            </span>
            <span>
              {t('最初无核')} {embryo.rightCells}
            </span>
          </div>
        </>
      ) : m === 'amoeba' ? (
        <div className="bio-amoeba-pair">
          {[true, false].map((n, i) => {
            const state = amoebaFragment(p, n, enabled);
            return (
              <div key={i}>
                <svg
                  viewBox="0 0 170 220"
                  role="img"
                  aria-label={t('变形虫碎片的细胞核、残留食物泡与持续生命活动')}
                >
                  <g transform={`translate(85 110) scale(${state.maintenance})`}>
                    <path
                      d={amoebaOutline(state.activity)}
                      fill="#c6d5b0"
                      stroke="#93a17b"
                      strokeWidth="2"
                    />
                    {n && <ellipse cx="-9" cy="-6" rx="13" ry="11" fill="#9c89a5" />}
                    <circle cx="24" cy="18" r={4 + state.digestionRemaining * 12} fill="#bfa071" />
                    <circle cx="-27" cy="15" r="9" fill="#e7e7c5" />
                  </g>
                  {state.rescueVisible && (
                    <g opacity={Math.min(1, (p - 0.38) / 0.04)}>
                      <path
                        d={`M${state.nucleusPosition.x + 5} ${state.nucleusPosition.y - 2}l17-24`}
                        stroke="#b2a88a"
                        strokeWidth="2"
                        opacity={1 - state.rescueProgress}
                      />
                      <ellipse
                        cx={state.nucleusPosition.x}
                        cy={state.nucleusPosition.y}
                        rx={13 * state.maintenance}
                        ry={11 * state.maintenance}
                        fill="#9c89a5"
                        stroke="#ece9d6"
                        strokeWidth="1"
                      />
                    </g>
                  )}
                </svg>
                <p>
                  {t(
                    n
                      ? '有核片段'
                      : state.rescued
                        ? '补核后片段'
                        : state.rescueProgress > 0
                          ? '正在补入细胞核'
                          : '去核片段',
                  )}
                </p>
                <p>{t(state.active ? '维持摄食与生长' : '只能短暂处理已有物质')}</p>
              </div>
            );
          })}
        </div>
      ) : m === 'alga' ? (
        <>
          <svg
            className="bio-nuclear-stage"
            viewBox="0 0 350 240"
            role="img"
            aria-label={t('伞藻基部的细胞核来源决定新生帽形，柄来源保持不同')}
          >
            <Alga x={85} nucleus={null} stem={algaSource} cap={algaSource} />
            <path
              d="M85 184Q170 94 255 184"
              stroke="#ac8f72"
              strokeWidth="2"
              strokeDasharray="4 5"
              fill="none"
            />
            <Alga x={255} nucleus={null} stem="umbrella" cap={alga.cap} scale={alga.regrowth} />
            <circle
              cx={85 + 170 * algaTravel}
              cy={184 - 45 * Math.sin(Math.PI * algaTravel)}
              r="7"
              fill={algaSource === 'umbrella' ? '#497e70' : '#a16f64'}
            />
          </svg>
          <div className="bio-nuclear-alga-labels">
            <span>{t(algaSource === 'umbrella' ? '供核伞形假根' : '供核菊花形假根')}</span>
            <span>{t('伞形藻柄，帽形随供核来源')}</span>
          </div>
        </>
      ) : m === 'monkey' ? (
        <>
          <div className="bio-monkey-path">
            <span className={p > 0.15 ? 'is-seen' : ''}>{t('去除核遗传物质')}</span>
            <span className={p > 0.4 ? 'is-seen' : ''}>{t('合适激活时机')}</span>
            <span className={p > 0.65 ? 'is-seen' : ''}>{t('重编程与发育')}</span>
          </div>
          <svg
            className="bio-nuclear-stage bio-monkey-chart"
            viewBox="0 0 350 180"
            role="img"
            aria-label={t('原研究胎儿成纤维细胞组：21只代孕母猴、6例妊娠、2只健康幼猴')}
          >
            <path d="M25 150H325" stroke="#adb79b" />
            {[
              macaqueOutcomes.surrogates,
              macaqueOutcomes.pregnancies,
              macaqueOutcomes.healthyInfants,
            ].map((n, i) => (
              <rect
                key={i}
                x={50 + i * 100}
                y={150 - n * 5 * Math.min(1, p * 1.4)}
                width="45"
                height={n * 5 * Math.min(1, p * 1.4)}
                rx="7"
                fill={['#c0b59a', '#a4b696', '#879f81'][i]}
              />
            ))}
          </svg>
          <div className="bio-nuclear-ledger">
            <span>21 {t('代孕母猴')}</span>
            <span>6 {t('妊娠')}</span>
            <span>2 {t('健康幼猴')}</span>
          </div>
        </>
      ) : (
        <div className="bio-nuclear-transfer">
          <div className="bio-nuclear-source-labels">
            <span>
              {t(
                m === 'frog'
                  ? '蝌蚪肠上皮细胞核'
                  : m === 'axolotl'
                    ? '黑色个体：胚胎核'
                    : '体细胞核供体',
              )}
            </span>
            <span>{t(m === 'axolotl' ? '白色个体：卵细胞' : '卵细胞供体')}</span>
          </div>
          <svg
            className="bio-nuclear-transfer-top"
            viewBox="0 0 350 142"
            role="img"
            aria-label={t('细胞核供体、卵细胞供体与发育结果分开追踪')}
          >
            <path
              d="M49 54Q65 27 91 50L102 83Q75 109 48 84Z"
              fill={m === 'axolotl' ? '#b6b6a8' : '#c9b4b4'}
              stroke="#a78a91"
              strokeWidth="2"
            />
            <ellipse
              cx="260"
              cy="70"
              rx="46"
              ry="42"
              fill="#ded1a4"
              stroke="#b7a678"
              strokeWidth="2"
            />
            <path d="M236 79q7-9 15 0m9 11q7-9 15 0" fill="none" stroke="#b8ad81" strokeWidth="3" />
            {enabled && (
              <circle
                cx={transfer.nucleusPosition.x}
                cy={transfer.nucleusPosition.y}
                r="10"
                fill="#99778e"
                stroke="#f0e2ce"
                strokeWidth="1"
              />
            )}
            <path d="M260 113V142" stroke="#a1ae8e" strokeWidth="2" fill="none" />
          </svg>
          <svg className="bio-nuclear-transfer-bottom" viewBox="0 0 350 112" aria-hidden="true">
            {m === 'cow' ? (
              <>
                <path d="M260 0V13H75V44M119 72H211" stroke="#a1ae8e" strokeWidth="2" fill="none" />
                <path d="M204 67l8 5-8 5" fill="none" stroke="#a1ae8e" strokeWidth="2" />
                <Animal kind="cow" x={75} y={76} color="#b2a487" />
                <ellipse cx="68" cy="69" rx="14" ry="9" fill="#dfd7b9" />
                <g opacity={transfer.outcomeProgress}>
                  <Animal kind="cow" x={265} y={80} scale={0.78} />
                </g>
              </>
            ) : (
              <>
                <path d="M260 0V14H175V48" stroke="#a1ae8e" strokeWidth="2" fill="none" />
                <g opacity={transfer.outcomeProgress}>
                  <Animal kind={m} x={175} y={78} color={m === 'axolotl' ? '#5f645a' : '#8a775f'} />
                </g>
              </>
            )}
          </svg>
          <div
            className={
              m === 'cow' ? 'bio-nuclear-result-labels' : 'bio-nuclear-result-labels single'
            }
          >
            {m === 'cow' && <span>{t('代孕母体')}</span>}
            <span>
              {t(
                m === 'cow'
                  ? '克隆后代'
                  : m === 'axolotl'
                    ? '黑色美西螈后代'
                    : '部分重构卵发育为蝌蚪',
              )}
            </span>
          </div>
        </div>
      )}
      {!f.watch && (
        <div className="bio-nuclear-controls">
          <Segments
            value={mode}
            onChange={setMode}
            label={t('研究案例')}
            options={keys.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('研究过程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {mode !== 'monkey' && mode !== 'alga' && (
            <button type="button" aria-pressed={restore} onClick={() => setRestore(!restore)}>
              {t(restore ? '移入细胞核：是' : '移入细胞核：否')}
            </button>
          )}
          {mode === 'alga' && (
            <Segments
              value={donor}
              onChange={setDonor}
              label={t('基部核来源')}
              options={[
                { value: 'umbrella', label: t('伞形') },
                { value: 'daisy', label: t('菊花形') },
              ]}
            />
          )}
          <p>{t('经典证据的结构与结果重建，不是克隆成功率预测或实验操作指南。')}</p>
        </div>
      )}
    </section>
  );
}
