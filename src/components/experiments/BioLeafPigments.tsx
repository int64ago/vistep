import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  chromatography,
  pigmentTransmission,
  pigmentBands,
  spectralColor,
  type PigmentKey,
} from '../../models/bio-leaf-pigments';
import '../../styles/bio-leaf-pigments.css';
type Mode = 'extract' | 'origin' | 'separate' | 'spectrum' | 'compare';
const modes: Mode[] = ['extract', 'origin', 'separate', 'spectrum', 'compare'];
const names = ['破碎与提取', '起点与液面', '纸层析', '吸收与透过', '比较三种光谱'];
export default function BioLeafPigments() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Mode>(f.variant === 'spectrum' ? 'spectrum' : 'extract'),
    [progress, setProgress] = useState(0.7),
    [immersed, setImmersed] = useState(false),
    [lineWidth, setLineWidth] = useState(1),
    [pigment, setPigment] = useState<PigmentKey>('a'),
    [wavelength, setWavelength] = useState(550),
    [concentration, setConcentration] = useState(5);
  const m = f.watch ? modes[Math.min(f.chapter, 4)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.85)) : progress,
    key = f.watch ? (m === 'compare' ? 'carotene' : 'a') : pigment,
    nm = f.watch ? 400 + 300 * p : wavelength,
    c = f.watch ? 5 : concentration,
    s = chromatography(
      m === 'origin' ? 0.02 : p,
      f.watch ? false : immersed,
      f.watch ? 1 : lineWidth,
    ),
    trans = pigmentTransmission(key, nm, c);
  const curve = Array.from({ length: 61 }, (_, i) => {
    const a = pigmentTransmission(key, 400 + i * 5, c).absorbed;
    return `${i ? 'L' : 'M'}${30 + i * 5} ${144 - a * 112}`;
  }).join(' ');
  return (
    <section className="bio-pigments">
      <p className="bio-pigments-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'extract' ? (
        <>
          <svg
            className="bio-pigments-extract"
            viewBox="0 0 370 260"
            role="img"
            aria-label={t('叶片研磨释放色素，过滤后得到绿色提取液')}
          >
            <path
              d="M24 137H174Q163 216 100 218Q35 211 24 137Z"
              fill="#d2c5a5"
              stroke="#b0a182"
              strokeWidth="3"
            />
            <ellipse cx="99" cy="137" rx="75" ry="20" fill="#e0d7bb" stroke="#b0a182" />
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={`M${51 + ((i * 27) % 92)} ${128 + ((i * 13) % 22)}q14-12 17 2q-12 12-17-2Z`}
                fill="#748e50"
                opacity={1 - p * 0.75}
              />
            ))}
            <path
              d="M97 152L135 51Q143 39 154 50Q160 55 153 68L113 158Z"
              fill="#bdaf8f"
              stroke="#a79878"
              strokeWidth="2"
              transform={`rotate(${Math.sin(p * Math.PI * 6) * 8} 110 155)`}
            />
            <path d="M204 72H303L270 124H256V167" fill="#cad8b1" stroke="#92a47c" strokeWidth="2" />
            <path d="M216 92H291" stroke="#9d9d7c" strokeWidth="3" />
            <path d="M232 162L220 229H299L288 162" fill="none" stroke="#94a27f" strokeWidth="2" />
            <path d={`M225 ${225 - p * 45}H294L297 227H222Z`} fill="#829d59" opacity={p} />
            {p > 0.3 && (
              <path d="M262 132V159" stroke="#7c9956" strokeWidth="3" strokeDasharray="4 8" />
            )}
          </svg>
          <div className="bio-pigments-steps">
            <span>{t('叶片 + 乙醇')}</span>
            <span>{t('研磨与保护色素')}</span>
            <span>{t('过滤取液')}</span>
          </div>
        </>
      ) : m === 'spectrum' || m === 'compare' ? (
        <>
          <svg
            className="bio-pigments-optics"
            viewBox="0 0 370 180"
            role="img"
            aria-label={t('分光后比较色素溶液前后的光强')}
          >
            <path d="M13 83H75" stroke="#e5d4a4" strokeWidth="13" />
            <path
              d="M76 42L124 122H27Z"
              fill="#c5d5ce"
              fillOpacity=".65"
              stroke="#8faba3"
              strokeWidth="2"
            />
            {Array.from({ length: 31 }, (_, i) => {
              const w = 400 + i * 10,
                y = 20 + i * 4.5,
                light = pigmentTransmission(key, w, c);
              return (
                <g key={w}>
                  <path
                    d={`M103 88L181 ${y}H215`}
                    stroke={spectralColor(w)}
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d={`M260 ${y}H352`}
                    stroke={spectralColor(w)}
                    strokeWidth="3"
                    opacity={light.transmitted}
                  />
                </g>
              );
            })}
            <rect
              x="215"
              y="12"
              width="45"
              height="153"
              rx="5"
              fill={key === 'carotene' ? '#cfb457' : '#83a278'}
              fillOpacity=".55"
              stroke="#91a68e"
              strokeWidth="2"
            />
            <path
              d={`M262 ${20 + ((nm - 400) / 300) * 135}H356`}
              stroke="#4e6450"
              strokeWidth="2"
              strokeDasharray="3 4"
            />
          </svg>
          <div className="bio-pigments-light">
            <span>{t('入射')} 100%</span>
            <span>{Math.round(nm)} nm</span>
            <span>
              {t('透过')} {Math.round(trans.transmitted * 100)}%
            </span>
          </div>
          <svg
            className="bio-pigments-graph"
            viewBox="0 0 360 170"
            role="img"
            aria-label={t('实测光谱系数计算的吸收比例曲线')}
          >
            <path d="M30 25V145H330" fill="none" stroke="#a0ae94" />
            {[0, 0.5, 1].map((v) => (
              <path key={v} d={`M30 ${144 - v * 112}H330`} stroke="#cbd2bc" strokeDasharray="3 5" />
            ))}
            {m === 'compare' ? (
              (['a', 'b', 'carotene'] as const).map((which, i) => (
                <path
                  key={which}
                  d={Array.from(
                    { length: 61 },
                    (_, j) =>
                      `${j ? 'L' : 'M'}${30 + j * 5} ${144 - pigmentTransmission(which, 400 + j * 5, c).absorbed * 112}`,
                  ).join(' ')}
                  fill="none"
                  stroke={['#4b8c7a', '#96a44d', '#c4913c'][i]}
                  strokeWidth="3"
                  strokeDasharray={i === 1 ? '5 3' : i === 2 ? '2 3' : undefined}
                />
              ))
            ) : (
              <path
                d={curve}
                fill="none"
                stroke={key === 'a' ? '#4b8c7a' : key === 'b' ? '#96a44d' : '#c4913c'}
                strokeWidth="3"
              />
            )}
            <path d={`M${30 + nm - 400} 25V145`} stroke="#a3ad89" />
            <circle cx={30 + nm - 400} cy={144 - trans.absorbed * 112} r="5" fill="#b07c4b" />
          </svg>
          <div className="bio-pigments-axis">
            <span>400 nm</span>
            <span>
              {t('吸收')} {Math.round(trans.absorbed * 100)}%
            </span>
            <span>700 nm</span>
          </div>
          {m === 'compare' && (
            <p className="bio-pigments-note">
              {t('实线：叶绿素a · 长虚线：叶绿素b · 短虚线：胡萝卜素')}
            </p>
          )}
        </>
      ) : (
        <div className="bio-pigments-chromatography">
          <svg
            viewBox="40 10 160 270"
            role="img"
            aria-label={t('色素起点高于层析液，四条色带落后于溶剂前沿')}
          >
            <defs>
              <linearGradient id={`${uid}-paper`}>
                <stop stopColor="#f2edd9" />
                <stop offset="1" stopColor="#e1ddc4" />
              </linearGradient>
            </defs>
            <path
              d="M51 24V248Q51 275 78 275H162Q189 275 189 248V24"
              fill="#d8e0cc"
              fillOpacity=".4"
              stroke="#91a589"
              strokeWidth="2"
            />
            <rect x="47" y="15" width="146" height="12" rx="5" fill="#b9b69d" />
            <path
              d="M91 40H149V248L143 257H97L91 248Z"
              fill={`url(#${uid}-paper)`}
              stroke="#d1cbb1"
            />
            <path
              d={`M53 ${f.watch || !immersed ? 246 : 221}H187V249Q187 273 163 273H77Q53 273 53 249Z`}
              fill={s.dissolved > 0.2 ? '#b2be8f' : '#bacbb2'}
              fillOpacity=".6"
            />
            <path d={`M93 ${231 - s.front}H147`} stroke="#b4bda2" strokeDasharray="4 3" />
            {s.bands.map((b) => (
              <rect
                key={b.id}
                x="95"
                y={231 - b.distance - b.width / 2}
                width="50"
                height={b.width}
                rx="2"
                fill={b.color}
                opacity={b.retained}
              />
            ))}
            <path d="M84 231H156" stroke="#8b907b" strokeDasharray="2 4" />
            <path d={`M151 ${231 - s.front}H177`} stroke="#8b9e79" />
            <path d="M151 231H178" stroke="#8b9e79" />
          </svg>
          <div className="bio-pigments-bands">
            {pigmentBands.map((b, i) => (
              <div key={b.id}>
                <i style={{ background: b.color }} />
                <span>
                  {i + 1}. {t(b.name)}
                </span>
              </div>
            ))}
            <p>{t(s.valid ? '起点在液面上方' : '起点浸入液体：色素溶入槽液')}</p>
          </div>
        </div>
      )}
      {!f.watch && (
        <div className="bio-pigments-controls">
          <Segments
            label={t('观察步骤')}
            value={mode}
            onChange={setMode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          {m === 'spectrum' || m === 'compare' ? (
            <>
              <Segments
                label={t('色素样品')}
                value={pigment}
                onChange={setPigment}
                options={[
                  { value: 'a', label: t('叶绿素a') },
                  { value: 'b', label: t('叶绿素b') },
                  { value: 'carotene', label: t('胡萝卜素') },
                ]}
              />
              <Range
                label={t('波长')}
                value={wavelength}
                min={400}
                max={700}
                unit="nm"
                onChange={setWavelength}
              />
              <Range
                label={t('浓度')}
                value={concentration}
                min={0}
                max={15}
                step={0.5}
                unit="µM"
                onChange={setConcentration}
              />
            </>
          ) : (
            <>
              <Range
                label={t('过程进度')}
                value={progress}
                min={0}
                max={1}
                step={0.01}
                onChange={setProgress}
              />
              {m !== 'extract' && (
                <>
                  <Range
                    label={t('起始色素线宽')}
                    value={lineWidth}
                    min={1}
                    max={8}
                    onChange={setLineWidth}
                  />
                  <button
                    type="button"
                    aria-pressed={immersed}
                    onClick={() => setImmersed(!immersed)}
                  >
                    {t(immersed ? '液面高于起点' : '液面低于起点')}
                  </button>
                </>
              )}
            </>
          )}
          <p>{t('谱线来自溶液测量；色带迁移系数为该教学模型的示意值。')}</p>
        </div>
      )}
    </section>
  );
}
