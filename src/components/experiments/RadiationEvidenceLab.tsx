import { useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  radiationTrack,
  plateExposure,
  expansionChamber,
  xrayTransmission,
  xrayCutoffPM,
} from '../../models/radiation-evidence';
import '../../styles/modern-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function RadiationArtwork({
  mode = 0,
  value = 0.7,
  phase = 1,
  sun = false,
  sample = true,
  progress = 0.5,
}: {
  mode?: number;
  value?: number;
  phase?: number;
  sun?: boolean;
  sample?: boolean;
  progress?: number;
}) {
  const chamber = expansionChamber(1 + 0.25 * value),
    exposure = plateExposure(value * 3, sample),
    rays = ['alpha', 'beta', 'gamma'] as const;
  return (
    <svg
      className="modern-apparatus"
      viewBox="0 0 340 276"
      role="img"
      aria-label={tr(
        '放射性证据的实验装置与可观察信号',
        'Radiation apparatus and observable evidence',
      )}
    >
      {mode === 0 && (
        <>
          {sun && (
            <g fill="#d0bc75" stroke="#c3ad6e">
              <circle cx="292" cy="35" r="15" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
                <path
                  key={j}
                  d={`M${292 + 21 * Math.cos((j * Math.PI) / 4)} ${35 + 21 * Math.sin((j * Math.PI) / 4)}l${6 * Math.cos((j * Math.PI) / 4)} ${6 * Math.sin((j * Math.PI) / 4)}`}
                />
              ))}
            </g>
          )}
          <path d="M56 65L246 52L284 111L89 126Z" fill="#758679" />
          {sample && (
            <path d="M134 69L155 48L183 59L179 83L150 91Z" fill="#b6b486" stroke="#8b947b" />
          )}
          <path d="M54 101L246 91L284 150L88 163Z" fill="#39473f" />
          <path d="M65 117L247 107L271 143L88 153Z" fill="#5d6b61" />
          <path
            d="M149 102L169 100L175 111L197 109L204 121L182 123L189 135L168 137L162 125L139 127L132 115L155 113Z"
            fill="#bca484"
          />
          <rect x="84" y="186" width="190" height="67" rx="8" fill="#e3dfcd" />
          <rect x="88" y="190" width="182" height="59" rx="5" fill="#535951" opacity={exposure} />
          <path
            d="M165 194H184V210H210V227H184V243H165V227H139V210H165Z"
            fill="#ded9c7"
            opacity={exposure * 0.8}
          />
          <text x="38" y="177" fontSize="18" fill="#687b70">
            {tr('显影后的感光板', 'Developed plate')}
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <path d="M39 38H114L100 85Q76 109 52 85Z" fill="#d6ddd0" stroke="#8c9e8e" />
          <path d="M53 68H101L92 89H61Z" fill="#a2a686" />
          <path
            d="M78 103V127M78 127H42M78 127H134M42 127V150M134 127V150"
            fill="none"
            stroke="#a6b5a5"
            strokeWidth="2"
          />
          {[42, 134].map((x, j) => (
            <g key={x}>
              <rect
                x={x - 22}
                y="150"
                width="44"
                height="42"
                rx="9"
                fill={j ? '#b1b8a3' : '#d8decf'}
              />
              <path d={`M${x - 18} 179H${x + 18}`} stroke="#7d907d" strokeWidth="3" />
            </g>
          ))}
          <rect x="199" y="42" width="100" height="103" rx="14" fill="#e8ece3" stroke="#a9b7a6" />
          <path d="M212 69H286M212 119H286" stroke="#8b9e89" strokeWidth="5" />
          {Array.from({ length: 12 }, (_, j) => (
            <circle
              key={j}
              cx={220 + (j % 4) * 18}
              cy={81 + Math.floor(j / 4) * 13}
              r="2.5"
              fill={j % 2 ? '#a98572' : '#819d96'}
            />
          ))}
          <path
            d="M286 69H320V198H274M212 119H186V198H224"
            fill="none"
            stroke="#8fa18d"
            strokeWidth="2"
          />
          <circle cx="249" cy="198" r="26" fill="#f0f0e8" stroke="#849880" />
          <path
            d={`M249 202L${249 + (value * 1.5 - 0.65) * 21} 182`}
            stroke="#9f7f67"
            strokeWidth="3"
          />
          <path d="M134 173H182" fill="none" stroke="#acbaaa" strokeDasharray="4 4" />
          <text x="35" y="245" fontSize="18" fill="#687b70">
            {tr('分离 → 比较单位质量的电离信号', 'Separate → compare activity per mass')}
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <rect x="20" y="96" width="36" height="48" rx="8" fill="#7d8f83" />
          <path d="M40 120H55" stroke="#d9c4a0" strokeWidth="6" />
          <rect x="60" y="20" width="264" height="210" rx="18" fill="#e7ede7" />
          {Array.from({ length: 20 }, (_, j) => (
            <g
              key={j}
              opacity={Math.min(1, Math.abs(value - 0.5) * 4)}
              transform={`translate(${82 + (j % 5) * 50} ${46 + Math.floor(j / 5) * 50})`}
            >
              <circle r="7" fill="none" stroke="#b8c7bd" />
              {value >= 0.5 ? (
                <circle r="1.8" fill="#9eb3a4" />
              ) : (
                <path d="M-3 -3L3 3M-3 3L3 -3" stroke="#9eb3a4" />
              )}
            </g>
          ))}
          {rays.map((kind, j) => {
            const ps = radiationTrack(kind, (value - 0.5) * 0.6).points;
            const head = ps[Math.min(ps.length - 1, Math.floor(progress * ps.length))];
            return (
              <g key={kind}>
                <path
                  d={ps
                    .map((p, i) => `${i ? 'L' : 'M'}${60 + p.x * 850} ${120 - p.y * 850}`)
                    .join(' ')}
                  fill="none"
                  stroke={['#bc9672', '#7197a4', '#95a77b'][j]}
                  strokeWidth={j === 0 ? 3 : 2}
                />
                <circle
                  cx={60 + head.x * 850}
                  cy={120 - head.y * 850}
                  r="4"
                  fill={['#bc9672', '#7197a4', '#95a77b'][j]}
                />
              </g>
            );
          })}
          <text x="22" y="266" fontSize="18" fill="#a58765">
            α
          </text>
          <text x="117" y="266" fontSize="18" fill="#7197a4">
            β⁻
          </text>
          <text x="230" y="266" fontSize="18" fill="#7f9467">
            γ
          </text>
        </>
      )}
      {mode === 3 && (
        <>
          <path d="M48 43Q48 30 62 30H278Q292 30 292 43V212H48Z" fill="#e0e8df" stroke="#a0b4a2" />
          <rect x="52" y={170 + value * 35} width="236" height="15" rx="5" fill="#81937f" />
          <path d={`M170 ${185 + value * 35}V257`} stroke="#93a28a" strokeWidth="12" />
          <path d="M30 93L55 90" stroke="#cdb68b" strokeWidth="4" />
          <g opacity={chamber.visibility}>
            {Array.from({ length: 42 }, (_, j) => (
              <circle
                key={j}
                cx={60 + j * 4.6}
                cy={95 + j * 0.3 + Math.sin(j * 1.3) * 1.2}
                r={1.8 + j * 0.025}
                fill="#ad9c77"
              />
            ))}
            {Array.from({ length: 37 }, (_, j) => (
              <circle
                key={j}
                cx={72 + j * 4.6}
                cy={142 - Math.sin(j * 0.11) * 27 + Math.sin(j * 1.9) * 3}
                r="1.2"
                fill="#829f9b"
              />
            ))}
          </g>
          <text x="64" y="64" fontSize="18" fill="#677c6b">
            {tr('膨胀 · 过饱和 · 凝结', 'Expand · supersaturate · condense')}
          </text>
        </>
      )}
      {mode === 4 && (
        <>
          <rect x="18" y="33" width="146" height="89" rx="39" fill="#e4ebe5" stroke="#a0b4a6" />
          <path d="M41 56V96M58 75H128" stroke="#8ca694" strokeWidth="4" />
          <path d="M126 51L149 99" stroke="#9e8e7a" strokeWidth="7" />
          <path d="M137 77L302 140M137 77L269 217" stroke="#c3b58a" strokeWidth="2" fill="none" />
          <path
            d="M223 123Q213 115 211 127L217 153L191 139Q181 137 183 148L215 170Q207 186 223 196L245 206L269 177L248 161L237 122Q232 112 227 122L232 150Z"
            fill="#c6cbb8"
          />
          <path
            d="M220 137L233 170L253 184M198 148L223 169"
            stroke="#efeee0"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path d="M286 119L322 140V253L286 230Z" fill="#576f61" />
          <rect
            x="25"
            y="169"
            width="110"
            height="87"
            rx="10"
            fill="#34483e"
            opacity={0.5 + 0.5 * xrayTransmission(12 + value * 32, false)}
          />
          <path
            d="M54 191L77 223L112 234M42 213L77 223"
            stroke="#d6ddc7"
            strokeWidth="9"
            strokeLinecap="round"
            opacity={1 - xrayTransmission(12 + value * 32, true)}
          />
        </>
      )}
    </svg>
  );
}
const variants = [
  'e3-becquerel-radioactivity',
  'e3-curie-radium-polonium',
  'e3-radioactive-ray-deflection',
  'e3-wilson-cloud-chamber',
  'e3-rontgen-xrays',
];
export default function RadiationEvidenceLab() {
  const film = useShowcase(),
    [selected, setSelected] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [manual, setManual] = useState(0.7),
    [sun, setSun] = useState(false),
    [sample, setSample] = useState(true);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.chapter % 2;
  const value = film.watch
    ? mode === 2
      ? phase === 0
        ? 0.8
        : 0.2
      : mode === 3
        ? phase === 0
          ? film.chapterProgress * 0.6
          : 0.6 + 0.4 * film.chapterProgress
        : film.chapterProgress
    : manual;
  const names = [
    ['感光板', 'Photographic plate'],
    ['电离测量', 'Ionization measurement'],
    ['射线偏转', 'Ray deflection'],
    ['膨胀云室', 'Expansion chamber'],
    ['X射线', 'X-rays'],
  ];
  const chamber = expansionChamber(1 + 0.25 * value);
  const readout =
    mode === 0
      ? tr(
          '遮光纸隔开可见光，感光信号仍能出现',
          'Opaque paper blocks visible light; a signal can still develop',
        )
      : mode === 1
        ? `${tr('示例单位质量活度', 'Example activity per mass')} ${(1 + value * 9).toFixed(1)} ×`
        : mode === 2
          ? `B = ${((value - 0.5) * 0.6).toFixed(2)} T · α 5 MeV / β⁻ 2 MeV`
          : mode === 3
            ? `T = ${chamber.temperature.toFixed(1)} K · S = ${chamber.supersaturation.toFixed(2)}`
            : `λmin = ${xrayCutoffPM(12 + value * 32).toFixed(1)} pm`;
  return (
    <div className="modern-series modern-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button key={j} type="button" aria-pressed={mode === j} onClick={() => setSelected(j)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">{readout}</div>
      <RadiationArtwork
        mode={mode}
        phase={phase}
        value={value}
        sun={film.watch ? phase === 0 : sun}
        sample={film.watch || sample}
        progress={film.watch ? film.chapterProgress : 0.75}
      />
      <p className="modern-key">
        {
          [
            tr(
              '有无日照，不能决定铀盐是否发出射线。',
              'Sunlight does not determine whether uranium emits radiation.',
            ),
            tr(
              '化学分离与电离测量共同定位活性成分。',
              'Chemical separation and ionization measurements locate active constituents.',
            ),
            tr(
              '带电射线弯曲，γ射线不受磁场偏转。',
              'Charged rays curve; gamma rays are not magnetically deflected.',
            ),
            tr(
              '看见的是沿电离路径凝结的小液滴。',
              'Visible droplets condense along the ionization path.',
            ),
            tr(
              '物质对X射线的衰减不同，留下透射对比。',
              'Different attenuation produces transmission contrast.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          {mode === 0 && (
            <div className="modern-paths">
              <button type="button" aria-pressed={sun} onClick={() => setSun(!sun)}>
                {sun ? tr('日照开启', 'Sunlight on') : tr('日照关闭', 'Sunlight off')}
              </button>
              <button type="button" aria-pressed={sample} onClick={() => setSample(!sample)}>
                {sample ? tr('铀盐在场', 'Uranium present') : tr('对照空白', 'Blank control')}
              </button>
            </div>
          )}
          <Range
            label={
              [
                tr('曝光时间', 'Exposure time'),
                tr('比较富集程度', 'Compare enrichment'),
                tr('磁场方向与强度', 'Magnetic field'),
                tr('气体膨胀量', 'Gas expansion'),
                tr('示例管电压', 'Example tube voltage'),
              ][mode]
            }
            value={manual}
            min={0}
            max={1}
            step={0.01}
            onChange={setManual}
          />
        </div>
      )}
    </div>
  );
}
