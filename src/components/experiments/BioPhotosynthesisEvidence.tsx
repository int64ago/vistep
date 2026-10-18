import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  engelmannBacteria,
  hillReaction,
  oxygenIsotope,
  photophosphorylation,
  carbonTracer,
  photosynthesisCoupling,
  leafDiscs,
  type Illumination,
} from '../../models/bio-photosynthesis-evidence';
import { spectralColor } from '../../models/bio-leaf-pigments';
import '../../styles/bio-photosynthesis-evidence.css';
type Mode =
  'local' | 'spectrum' | 'hill' | 'isotope' | 'atp' | 'coupling' | 'carbon' | 'prepare' | 'discs';
const modes: Mode[] = [
  'local',
  'spectrum',
  'hill',
  'isotope',
  'atp',
  'coupling',
  'carbon',
  'prepare',
  'discs',
];
const names = [
  '局部照光',
  '分光照射',
  '希尔反应',
  '氧同位素',
  '光合磷酸化',
  '两个阶段的联系',
  '碳同位素',
  '叶片去气',
  '叶片上浮',
];
function Chloroplast({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse rx="42" ry="24" fill="#bfd0a0" stroke="#7e9a6d" strokeWidth="2" />
      <ellipse rx="37" ry="20" fill="none" stroke="#a7bc8c" />
      {[-23, 0, 23].map((cx, i) => (
        <g key={i}>
          {[-7, -1, 5].map((cy) => (
            <rect key={cy} x={cx - 9} y={cy} width="18" height="4" rx="2" fill="#829d66" />
          ))}
        </g>
      ))}
      <path d="M-15 2H15" stroke="#8aa36d" strokeWidth="2" />
    </g>
  );
}
export default function BioPhotosynthesisEvidence() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'local',
    ),
    [progress, setProgress] = useState(0.7),
    [illumination, setIllumination] = useState<Illumination>('spot'),
    [spot, setSpot] = useState(0.4),
    [light, setLight] = useState(true),
    [acceptor, setAcceptor] = useState(true),
    [cyclic, setCyclic] = useState(false),
    [infiltrated, setInfiltrated] = useState(true),
    [intensity, setIntensity] = useState(0.45),
    [co2, setCo2] = useState(true);
  const m = f.watch ? modes[Math.min(f.chapter, 8)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.88)) : progress,
    lighting = m === 'spectrum' ? 'spectrum' : f.watch ? 'spot' : illumination,
    expansion = f.watch && m === 'local' ? ease(ramp(p, 0.65, 0.95)) : lighting === 'full' ? 1 : 0,
    beams = f.watch ? 0.4 : spot,
    lit = f.watch || light,
    carbon = carbonTracer(p),
    couple = photosynthesisCoupling(15 * p, f.watch ? 7 : light ? Infinity : 0, f.watch || co2),
    fullBacteria = engelmannBacteria(1, 'full', beams),
    bacteria =
      f.watch && m === 'local'
        ? engelmannBacteria(Math.min(1, p / 0.65), 'spot', beams).map((b, i) => {
            const target = fullBacteria[i];
            return {
              ...b,
              x: b.x + (target.x - b.x) * expansion,
              y: b.y + (target.y - b.y) * expansion,
            };
          })
        : engelmannBacteria(p, lighting, beams);
  return (
    <section className="bio-photo">
      <p className="bio-photo-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'local' || m === 'spectrum' ? (
        <>
          <svg
            className="bio-photo-alga"
            viewBox="0 0 360 250"
            role="img"
            aria-label={t('螺旋叶绿体位于水绵细胞内部，需氧细菌聚集在受光部位外侧')}
          >
            <rect
              x="26"
              y="103"
              width="308"
              height="54"
              rx="12"
              fill="#d5dfb7"
              stroke="#8da87b"
              strokeWidth="2"
            />
            {[90, 150, 210, 270].map((x) => (
              <path key={x} d={`M${x} 104V156`} stroke="#99ad82" />
            ))}
            <path
              d={Array.from(
                { length: 151 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${30 + i * 2} ${130 + 17 * Math.sin((i / 150) * Math.PI * 10)}`,
              ).join(' ')}
              fill="none"
              stroke="#71965b"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {lighting === 'spectrum'
              ? Array.from({ length: 31 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${30 + i * 10} 26V157`}
                    stroke={spectralColor(400 + i * 10)}
                    strokeWidth="10"
                    opacity=".2"
                  />
                ))
              : lighting !== 'dark' && (
                  <rect
                    x={(30 + beams * 300 - 13) * (1 - expansion) + 26 * expansion}
                    y="26"
                    width={26 + 282 * expansion}
                    height="132"
                    fill="#ead897"
                    opacity=".45"
                  />
                )}
            {bacteria.map((b) => (
              <rect
                key={b.id}
                x={b.x - 3}
                y={b.y - 1.4}
                width="6"
                height="2.8"
                rx="1.4"
                fill="#717e62"
                transform={`rotate(${(b.id * 37) % 150} ${b.x} ${b.y})`}
              />
            ))}
            {m === 'spectrum' && (
              <>
                <text x="30" y="235" fontSize="26" fill="currentColor">
                  400 nm
                </text>
                <text x="330" y="235" fontSize="26" textAnchor="end" fill="currentColor">
                  700 nm
                </text>
              </>
            )}
          </svg>
          <div className="bio-photo-legend">
            <span>{t('带状叶绿体')}</span>
            <span>{t('短杆：需氧细菌')}</span>
            <span>{t('示意，非显微比例')}</span>
          </div>
        </>
      ) : m === 'hill' || m === 'atp' ? (
        <>
          <div className="bio-photo-vials">
            {[true, false].map((control, i) => {
              const oxygen =
                  m === 'hill'
                    ? hillReaction(p, control && lit, f.watch || acceptor).oxygen
                    : photophosphorylation(p, control && lit, true, true, f.watch ? false : cyclic)
                        .oxygen,
                amount = m === 'hill' ? oxygen : photophosphorylation(p, control && lit).atp;
              return (
                <div key={i}>
                  <svg
                    viewBox="0 0 170 230"
                    role="img"
                    aria-label={t('离体叶绿体悬液的光照组与黑暗对照')}
                  >
                    <path
                      d="M40 28V176Q40 205 85 205Q130 205 130 176V28"
                      fill="#dce3c6"
                      stroke="#8a9f7a"
                      strokeWidth="2"
                    />
                    <rect x="36" y="18" width="98" height="14" rx="4" fill="#b2b89b" />
                    {control && lit && (
                      <path d="M2 75L137 117L2 159Z" fill="#e4cc79" opacity=".3" />
                    )}
                    <Chloroplast x={85} y={152} scale={0.8} />
                    {Array.from({ length: 9 }, (_, j) => (
                      <circle
                        key={j}
                        cx={54 + ((j * 23) % 60)}
                        cy={110 - ((p + j * 0.13) % 1) * 55}
                        r="3"
                        fill="#f5f4db"
                        stroke="#a2b492"
                        opacity={oxygen}
                      />
                    ))}
                    <path d="M49 83H121" stroke="#b4c4a5" />
                  </svg>
                  <p>{t(control ? '有光' : '黑暗')}</p>
                  <p>
                    {m === 'hill'
                      ? `O₂ ${Math.round(amount * 100)}%`
                      : `ATP ${Math.round(amount * 100)}%`}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="bio-photo-note">
            {t(
              m === 'hill'
                ? '两组都无CO₂；加入适宜电子受体'
                : 'ADP + Pi → ATP；相对进程，非固定产量比',
            )}
          </p>
          {m === 'hill' && !f.watch && !acceptor && (
            <p className="bio-photo-note">{t('缺少适宜电子受体：持续放氧受限')}</p>
          )}
        </>
      ) : m === 'isotope' ? (
        <div className="bio-photo-isotopes">
          {[true, false].map((waterLabeled, i) => {
            const iso = oxygenIsotope(waterLabeled, !waterLabeled);
            return (
              <div key={i}>
                <p>{waterLabeled ? 'H₂¹⁸O + CO₂' : 'H₂O + C¹⁸O₂'}</p>
                <svg
                  viewBox="0 0 320 155"
                  role="img"
                  aria-label={t('释放氧气的两个氧原子来自水，标记始终保持')}
                >
                  <path d="M96 66H213" stroke="#aab695" strokeWidth="2" />
                  {iso.oxygenAtoms.map((a, j) => {
                    const x = 55 + (230 + j * 40 - 55) * p,
                      y = 45 + j * 65 + (78 - (45 + j * 65)) * p;
                    return (
                      <g key={a.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="19"
                          fill={a.mass === 18 ? '#bd8b5c' : '#8fa992'}
                          stroke="#f4f3dd"
                          strokeWidth="2"
                        />
                        <text x={x} y={y + 5} textAnchor="middle" fontSize="24" fill="#fff">
                          {a.mass}
                        </text>
                        {p < 0.6 && (
                          <>
                            <circle
                              cx={x - 17}
                              cy={y - 11}
                              r="5"
                              fill="#d4dac4"
                              opacity={1 - p / 0.6}
                            />
                            <circle
                              cx={x - 17}
                              cy={y + 11}
                              r="5"
                              fill="#d4dac4"
                              opacity={1 - p / 0.6}
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                  <path
                    d={`M${55 + (230 - 55) * p + 19} ${45 + (78 - 45) * p}L${55 + (270 - 55) * p - 19} ${110 + (78 - 110) * p}`}
                    stroke="#809879"
                    strokeWidth="2"
                    opacity={p}
                  />
                </svg>
                <p>
                  {t('放出的氧气')} {waterLabeled ? '¹⁸O₂' : 'O₂'}
                </p>
              </div>
            );
          })}
        </div>
      ) : m === 'coupling' ? (
        <>
          <svg
            className="bio-photo-coupling"
            viewBox="0 0 370 250"
            role="img"
            aria-label={t('类囊体膜提供ATP与NADPH，基质中的碳反应消耗它们')}
          >
            <ellipse
              cx="185"
              cy="124"
              rx="171"
              ry="105"
              fill="#d9e2b9"
              stroke="#8ea777"
              strokeWidth="3"
            />
            <ellipse cx="185" cy="124" rx="164" ry="98" fill="none" stroke="#bccb9c" />
            <g>
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <rect
                    x="49"
                    y={102 + i * 13}
                    width="72"
                    height="10"
                    rx="5"
                    fill="#9ab37a"
                    stroke="#7e9c65"
                    strokeWidth="2"
                  />
                  <path d={`M58 ${107 + i * 13}H112`} stroke="#c8d5a3" strokeWidth="2" />
                </g>
              ))}
            </g>
            {couple.light && (
              <path d="M47 8L80 82L103 13L115 91" fill="none" stroke="#d5b75e" strokeWidth="5" />
            )}
            <path
              d="M140 104Q185 55 229 99M229 161Q185 206 140 154"
              fill="none"
              stroke="#99ad76"
              strokeWidth="2"
            />
            <path d="M224 94l9 7-11 3M146 151l-10 3 7 8" fill="#99ad76" />
            <circle
              cx="275"
              cy="127"
              r="42"
              fill="#c3d2a0"
              stroke="#8b9f6b"
              strokeWidth="3"
              strokeDasharray="8 4"
            />
            <text x="185" y="78" textAnchor="middle" fontSize="24" fill="currentColor">
              ATP · NADPH
            </text>
            <text x="185" y="205" textAnchor="middle" fontSize="24" fill="currentColor">
              ADP + Pi · NADP⁺
            </text>
            <text x="275" y="118" textAnchor="middle" fontSize="24" fill="currentColor">
              <tspan x="275">CO₂</tspan>
              <tspan x="275" dy="29">
                ↓ C₃
              </tspan>
            </text>
          </svg>
          <div className="bio-photo-stores">
            <span>
              ATP <i style={{ width: `${(couple.atp / 18) * 80}px` }} />
            </span>
            <span>
              NADPH <i style={{ width: `${(couple.nadph / 12) * 80}px` }} />
            </span>
            <span>{t(couple.light ? '光照中' : '熄灯后：消耗存量')}</span>
          </div>
        </>
      ) : m === 'carbon' ? (
        <>
          <svg
            className="bio-photo-carbon"
            viewBox="0 0 370 160"
            role="img"
            aria-label={t('小球藻吸收碳标记，标记从CO₂进入C₃和后续糖类')}
          >
            <circle cx="185" cy="80" r="64" fill="#d6e2b5" stroke="#91a776" strokeWidth="3" />
            <path
              d="M141 64Q165 26 209 52Q239 72 224 112L199 96Q222 72 183 60Q158 65 155 92Z"
              fill="#87a26a"
            />
            <circle cx="174" cy="99" r="13" fill="#b6bda4" />
            <path d="M18 79H118M251 79H349" stroke="#a1ad89" strokeWidth="2" />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${32 + p * 290 - i * 36} 79)`}>
                <circle r="18" fill="#b48b59" />
                <text y="8" textAnchor="middle" fontSize="24" fill="#fff">
                  14
                </text>
              </g>
            ))}
          </svg>
          <div className="bio-photo-tracer">
            {(['co2', 'c3', 'sugar'] as const).map((key, i) => (
              <div key={key}>
                <p>{['¹⁴CO₂', 'C₃', t('后续糖类')][i]}</p>
                <div>
                  <i style={{ width: `${carbon[key] * 100}%` }} />
                </div>
                <p>{Math.round(carbon[key] * 100)}%</p>
              </div>
            ))}
          </div>
          <p className="bio-photo-note">{t('标记转移的教学模型，不是原实验色谱图或测量比例')}</p>
        </>
      ) : m === 'prepare' ? (
        <>
          <svg
            className="bio-photo-preparation"
            viewBox="0 0 370 250"
            role="img"
            aria-label={t('注射器抽去圆形叶片内的气体，水进入细胞间隙')}
          >
            <rect
              x="115"
              y="39"
              width="115"
              height="168"
              rx="9"
              fill="#dce7d0"
              stroke="#94aa88"
              strokeWidth="3"
            />
            <path
              d="M151 207V229H193V207M104 38H240M111 71H234"
              fill="none"
              stroke="#94aa88"
              strokeWidth="3"
            />
            <path
              d={`M126 ${65 - p * 25}H220M173 ${65 - p * 25}V${15 - p * 8}M141 ${15 - p * 8}H205`}
              stroke="#9eaa90"
              strokeWidth="8"
            />
            {Array.from({ length: 10 }, (_, i) => (
              <ellipse
                key={i}
                cx={132 + ((i * 29) % 77)}
                cy={100 + ((i * 17) % 75) + p * 25}
                rx="8"
                ry="3.5"
                fill="#8ca663"
              />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                cx={132 + ((i * 31) % 77)}
                cy={140 - p * 85 - i * 6}
                r={2 + p * 3}
                fill="none"
                stroke="#95ac88"
                opacity={Math.sin(p * Math.PI)}
              />
            ))}
            <path d="M23 179Q23 80 86 59Q110 141 23 179Z" fill="#91a66d" />
            <circle cx="63" cy="118" r="10" fill="#efefda" />
          </svg>
          <p className="bio-photo-note">{t('叶片圆片直径0.6 cm；去气后应先全部下沉')}</p>
        </>
      ) : (
        <>
          <div className="bio-photo-discgroups">
            {[1, f.watch ? 0.45 : intensity, 0.1].map((I, g) => {
              const st = leafDiscs(15 * p, I, f.watch || infiltrated, f.watch || co2 ? 1 : 0);
              return (
                <div key={g}>
                  <svg
                    viewBox="0 0 120 215"
                    role="img"
                    aria-label={t('三组各十片相同圆片，在不同光强下比较上浮')}
                  >
                    <path
                      d="M10 35V190Q10 201 20 201H100Q110 201 110 190V35"
                      fill="#d4e0c6"
                      stroke="#91a57e"
                      strokeWidth="2"
                    />
                    <path d="M12 65H108" stroke="#9bb08b" />
                    {st.discs.map((d) => (
                      <g key={d.id}>
                        <ellipse
                          cx={25 + ((d.id * 23) % 72)}
                          cy={185 - d.rise * (110 + (d.id % 3) * 5)}
                          rx="8"
                          ry="3"
                          fill="#88a55c"
                        />
                        <path
                          d={`M${20 + ((d.id * 23) % 72)} ${185 - d.rise * (110 + (d.id % 3) * 5)}h10`}
                          stroke="#acc181"
                        />
                      </g>
                    ))}
                    <path d="M30 7H90L60 39Z" fill="#e2cd82" opacity={0.15 + I * 0.65} />
                  </svg>
                  <p>{t(['强光', '中光', '弱光'][g])}</p>
                  <p>
                    {t('上浮')} {st.floating}/10
                  </p>
                </div>
              );
            })}
          </div>
          <p className="bio-photo-note">{t('上浮反映气体净积累，还受呼吸与去气程度影响')}</p>
        </>
      )}
      {!f.watch && (
        <div className="bio-photo-controls">
          <Segments
            label={t('研究与探究')}
            value={mode}
            onChange={setMode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'local' && (
            <>
              <Segments
                label={t('照明方式')}
                value={illumination}
                onChange={setIllumination}
                options={[
                  { value: 'spot', label: t('局部光') },
                  { value: 'full', label: t('全面照光') },
                  { value: 'dark', label: t('黑暗') },
                ]}
              />
              <Range
                label={t('光斑位置')}
                value={spot}
                min={0.1}
                max={0.9}
                step={0.01}
                onChange={setSpot}
              />
            </>
          )}
          {['hill', 'atp', 'coupling'].includes(m) && (
            <button type="button" aria-pressed={light} onClick={() => setLight(!light)}>
              {t(light ? '光源开启' : '光源关闭')}
            </button>
          )}
          {m === 'hill' && (
            <button type="button" aria-pressed={acceptor} onClick={() => setAcceptor(!acceptor)}>
              {t(acceptor ? '适宜电子受体：有' : '适宜电子受体：无')}
            </button>
          )}
          {m === 'atp' && (
            <button type="button" aria-pressed={cyclic} onClick={() => setCyclic(!cyclic)}>
              {t(cyclic ? '机制拓展：循环电子传递' : '教材重建：非循环电子传递')}
            </button>
          )}
          {m === 'discs' && (
            <>
              <Range
                label={t('中间组相对光强')}
                value={intensity}
                min={0}
                max={1}
                step={0.01}
                onChange={setIntensity}
              />
              <button
                type="button"
                aria-pressed={infiltrated}
                onClick={() => setInfiltrated(!infiltrated)}
              >
                {t(infiltrated ? '叶片已去气' : '叶片未去气')}
              </button>
            </>
          )}
          {(m === 'coupling' || m === 'discs') && (
            <button type="button" aria-pressed={co2} onClick={() => setCo2(!co2)}>
              {t(co2 ? 'CO₂供应：有' : 'CO₂供应：无')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
