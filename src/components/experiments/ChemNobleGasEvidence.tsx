import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  heliumLine,
  sodiumLines,
  spectrum,
  densityEvidence,
  separation,
  separationPath,
  onPath,
  xenonMarker,
  xenonObservation,
  ionizationEV,
  xenonVessel,
} from '../../models/chem-noble-gas-evidence';
import '../../styles/chem-noble-gas-evidence.css';
const modes = ['sun', 'mineral', 'density', 'separation', 'xenon', 'boundary'] as const;
type Mode = (typeof modes)[number];
const names = [
  '太阳中的未知谱线',
  '矿物气体与谱线比对',
  '氮气密度的微小差别',
  '选择性除去已知组分',
  '打开密封，观察新产物',
  '修正惰性判断的范围',
];
function Spectrum({
  mineral,
  p,
  width,
  offset,
}: {
  mineral: boolean;
  p: number;
  width: number;
  offset: number;
}) {
  const rows = mineral ? [t('太阳边缘'), t('矿物气体'), t('钠参照')] : [t('太阳边缘'), t('钠参照')],
    sets = mineral ? [[heliumLine], [heliumLine], sodiumLines] : [[heliumLine], sodiumLines];
  return (
    <div className="cnge-spectroscopy">
      <div className="cnge-source">
        <svg
          viewBox="0 0 320 110"
          role="img"
          aria-label={t('光经过狭缝与分光器，谱线位置在共同波长轴上比较')}
        >
          <circle cx="47" cy="54" r="29" fill="#d8ba6b" />
          <circle cx="47" cy="54" r="24" fill="#e8d596" />
          <path d="M72 40 Q87 39 86 55 Q84 65 74 66" stroke="#bc9157" strokeWidth="4" fill="none" />
          <path d="M77 54 H166" stroke="#d8b871" strokeWidth="3" />
          <path d="M113 31 V49 M113 59 V78" stroke="#788b8c" strokeWidth="8" />
          <polygon points="172,28 153,79 196,79" fill="#c1d7d5" fillOpacity=".8" stroke="#8ca7a7" />
          <path
            d="M178 55 L272 30 M178 57 L272 55 M178 59 L272 80"
            stroke="#b7a071"
            strokeWidth="2"
          />
          <path d="M277 18 V91" stroke="#879b96" strokeWidth="4" />
          {mineral && (
            <g opacity={p}>
              <rect x="23" y="19" width="48" height="70" rx="18" fill="#d3c6b3" />
              <path d="M35 24 V84 M59 24 V84" stroke="#8e7e72" strokeWidth="2" />
              <path d="M47 29 V79" stroke="#d1aa6a" strokeWidth="4" />
            </g>
          )}
        </svg>
      </div>
      <div className="cnge-spectrum-rows">
        {sets.map((lines, i) => (
          <div className="cnge-spectrum-row" key={i}>
            <span>{rows[i]}</span>
            <svg viewBox="0 0 320 58" preserveAspectRatio="none" role="img" aria-label={rows[i]}>
              <rect x="0" y="0" width="320" height="58" rx="10" fill="#253f44" />
              {Array.from({ length: 320 }, (_, j) => {
                const lambda = 584 + (j / 319) * 8,
                  intensity = Math.min(
                    1,
                    spectrum(lambda, lines, width, mineral && i === 1 ? offset : 0),
                  );
                return (
                  <path
                    key={j}
                    d={`M${j} 9 V49`}
                    stroke={i === sets.length - 1 ? '#e0b966' : '#f0ca72'}
                    opacity={intensity * (i === 0 ? p : 1)}
                    strokeWidth="1.1"
                  />
                );
              })}
              <path
                d={`M${((heliumLine - 584) / 8) * 320} 0 V58`}
                stroke="#e7e9c8"
                strokeDasharray="3 4"
                opacity={mineral ? 0.5 : 0}
              />
            </svg>
          </div>
        ))}
        <div className="cnge-axis">
          <span>584</span>
          <span>588</span>
          <span>592 nm</span>
        </div>
      </div>
      <div className="cnge-line-key">
        He 587.56 nm <span>Na 589.00 / 589.59 nm</span>
      </div>
    </div>
  );
}
function Bulb({ air }: { air: boolean }) {
  return (
    <svg viewBox="0 0 160 180" role="img" aria-label={t('相同容积、密封的气体称量球')}>
      <ellipse
        cx="80"
        cy="112"
        rx="59"
        ry="57"
        fill="#d8e6df"
        fillOpacity=".65"
        stroke="#90aaa1"
        strokeWidth="2"
      />
      <path d="M69 56 V25 H91 V56" fill="#e2e8da" stroke="#90aaa1" strokeWidth="2" />
      <path d="M65 25 H95" stroke="#7c8d7e" strokeWidth="7" />
      <path d="M80 21 V9 M69 12 H91" stroke="#8a967e" strokeWidth="3" />
      {Array.from({ length: 14 }, (_, i) => (
        <g key={i} transform={`translate(${42 + ((i * 23) % 76)} ${82 + ((i * 29) % 64)})`}>
          <circle r="3" fill="#869e91" />
          {!(air && i === 4) && <circle cx="5" r="3" fill="#869e91" />}
          {air && i === 4 && <circle r="4.5" fill="#b4935a" />}
        </g>
      ))}
    </svg>
  );
}
function Density({ volume, temp, p }: { volume: number; temp: number; p: number }) {
  const a = densityEvidence(volume, temp);
  return (
    <>
      <div className="cnge-bulbs">
        <div>
          <b>{t('化学来源的氮气')}</b>
          <Bulb air={false} />
          <strong>{a.chemicalMass.toFixed(4)} g</strong>
        </div>
        <div style={{ opacity: ease(ramp(p, 0, 0.3)) }}>
          <b>{t('空气来源的气样')}</b>
          <Bulb air />
          <strong>{a.airMass.toFixed(4)} g</strong>
        </div>
      </div>
      <div className="cnge-difference" style={{ opacity: ease(ramp(p, 0.3, 0.55)) }}>
        <span>
          {t('相同气样体积')} {volume.toFixed(2)} L
        </span>
        <b>Δm = {a.differenceMg.toFixed(2)} mg</b>
      </div>
      <div className="cnge-meter" style={{ opacity: ease(ramp(p, 0.3, 0.55)) }}>
        <i style={{ left: `${50 + Math.max(-18, Math.min(18, a.differenceMg)) * 2.4}%` }} />
        <span>−18 mg</span>
        <span>0</span>
        <span>+18 mg</span>
      </div>
    </>
  );
}
function Separation({ p }: { p: number }) {
  const a = separation(p),
    path = separationPath.map((v, i) => `${i ? 'L' : 'M'}${v.x} ${v.y}`).join(' '),
    ar = onPath(separationPath, p),
    o = onPath(separationPath, Math.min(p, 0.235)),
    n = onPath(separationPath, Math.min(p, 0.765));
  return (
    <>
      <svg
        className="cnge-separation"
        viewBox="0 0 320 285"
        role="img"
        aria-label={t('密封循环示意中氧与氮被移走，氩标记仍留在气相')}
      >
        <path d={path} stroke="#92aaa0" strokeWidth="20" fill="none" strokeLinejoin="round" />
        <path d={path} stroke="#e8eedf" strokeWidth="15" fill="none" strokeLinejoin="round" />
        <rect
          x="28"
          y="119"
          width="54"
          height="82"
          rx="20"
          fill="#dae5d5"
          stroke="#8ea79a"
          strokeWidth="2"
        />
        <rect x="25" y="121" width="60" height="9" rx="3" fill="#b1b8a1" />
        <rect x="25" y="191" width="60" height="9" rx="3" fill="#b1b8a1" />
        <rect
          x="109"
          y="87"
          width="87"
          height="36"
          rx="17"
          fill="#e8d9ba"
          stroke="#a79978"
          strokeWidth="2"
        />
        <rect
          x="109"
          y="197"
          width="87"
          height="36"
          rx="17"
          fill="#d3dcc9"
          stroke="#91a189"
          strokeWidth="2"
        />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <rect
              x={118 + i * 10}
              y="99"
              width="6"
              height="13"
              rx="2"
              fill={i < a.oxygenRemoved * 7 ? '#5c6257' : '#ae825f'}
            />
            <rect
              x={118 + i * 10}
              y="209"
              width="6"
              height="13"
              rx="2"
              fill={i < a.nitrogenRemoved * 7 ? '#9c9269' : '#c0c1a8'}
            />
          </g>
        ))}
        <circle cx="265" cy="160" r="19" fill="#d0d8c7" stroke="#92a494" />
        <path
          d="M256 160 H273 L267 154 M273 160 L267 166"
          stroke="#7b927d"
          strokeWidth="2"
          fill="none"
        />
        <circle cx={ar.x} cy={ar.y} r="6" fill="#ba995a" />
        <circle cx={o.x} cy={o.y} r="5" fill="#ba8474" opacity={1 - a.oxygenRemoved} />
        <circle cx={n.x} cy={n.y} r="5" fill="#799998" opacity={1 - a.nitrogenRemoved} />
        <text x="153" y="65">
          {t('除去氧')}
        </text>
        <text x="153" y="265">
          {t('除去氮')}
        </text>
      </svg>
      <div className="cnge-ledger">
        <span>O₂ {Math.round(21 * (1 - a.oxygenRemoved))}</span>
        <span>N₂ {Math.round(78 * (1 - a.nitrogenRemoved))}</span>
        <span>Ar {a.argon}</span>
      </div>
      <p className="cnge-sub">{t('示意初始 100 份；移走的组分进入反应产物')}</p>
    </>
  );
}
function Xenon({ p, open }: { p: number; open: boolean }) {
  const a = xenonObservation(p, open),
    id = useId().replace(/:/g, '');
  return (
    <>
      <svg
        className="cnge-xenon"
        viewBox="0 0 360 225"
        role="img"
        aria-label={t('密封双容器连通后，红色气体减少并出现橙黄色固体')}
      >
        <defs>
          <clipPath id={id}>
            <circle cx="100" cy="125" r="55" />
            <circle cx="260" cy="125" r="55" />
            <rect x="145" y="115" width="70" height="20" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <rect x="45" y="70" width="110" height="110" fill="#c2856b" opacity={0.7 * a.redVapor} />
          <rect
            x="145"
            y="115"
            width="70"
            height="20"
            fill="#d8b38d"
            opacity={a.contact * (1 - a.contact)}
          />
          <path
            d="M50 158 Q72 145 97 156 Q120 148 151 158 V183 H50 Z"
            fill="#d7ae4f"
            opacity={a.orangeSolid}
          />
          {Array.from({ length: 6 }, (_, i) => {
            const q = xenonMarker(i, p, open);
            return <path key={i} d={`M${q.x} ${q.y - 5} l5 5 l-5 5 l-5 -5 Z`} fill="#7b879b" />;
          })}
        </g>
        <path
          d={`M${xenonVessel.leftJoin} 115 H${xenonVessel.rightJoin} M${xenonVessel.leftJoin} 135 H${xenonVessel.rightJoin} M${xenonVessel.leftJoin} 115 A55 55 0 1 0 ${xenonVessel.leftJoin} 135 M${xenonVessel.rightJoin} 115 A55 55 0 1 1 ${xenonVessel.rightJoin} 135`}
          stroke="#8da69e"
          fill="none"
          strokeWidth="2.7"
        />
        <path
          d={`M180 109 V${open ? 109 + 26 * (1 - ease(ramp(p, 0, 0.18))) : 141}`}
          stroke="#9f8b72"
          strokeWidth="6"
        />
        <text x="100" y="48">
          PtF₆
        </text>
        <text x="260" y="48">
          Xe
        </text>
        <path d="M101 54 V65 M260 54 V65" stroke="#9ba995" />
        <text x="180" y="218">
          {a.orangeSolid > 0.1 ? t('橙黄色固体形成') : t('两份气体先隔离')}
        </text>
      </svg>
      <div className="cnge-ionization">
        <span>O₂ {ionizationEV.oxygenMolecule.toFixed(2)} eV</span>
        <span>Xe {ionizationEV.xenonAtom.toFixed(2)} eV</span>
      </div>
    </>
  );
}
function Boundary({ p }: { p: number }) {
  return (
    <div className="cnge-boundary">
      <svg
        style={{ opacity: 0.25 + 0.75 * ease(ramp(p, 0, 0.4)) }}
        viewBox="0 0 320 215"
        role="img"
        aria-label={t('后续确认的二氟化氙具有线型分子结构')}
      >
        <path d="M85 105 H235" stroke="#98aa91" strokeWidth="7" />
        <circle cx="160" cy="105" r="35" fill="#b4b8b8" stroke="#929da4" strokeWidth="2" />
        <circle cx="75" cy="105" r="23" fill="#b8cca9" />
        <circle cx="245" cy="105" r="23" fill="#b8cca9" />
        <text x="160" y="114">
          Xe
        </text>
        <text x="75" y="113">
          F
        </text>
        <text x="245" y="113">
          F
        </text>
        <path d="M92 166 H228" stroke="#a5b59a" strokeWidth="2" />
        <text x="160" y="196">
          XeF₂ · 180°
        </text>
      </svg>
      <p>{p < 0.5 ? t('已证实的化合物否定“绝不反应”') : t('能形成化合物，仍需要具体条件')}</p>
    </div>
  );
}
export default function ChemNobleGasEvidence({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      variant === 'argon' ? 'density' : variant === 'xenon' ? 'xenon' : 'sun',
    ),
    [progress, setProgress] = useState(0.6),
    [width, setWidth] = useState(0.15),
    [offset, setOffset] = useState(0),
    [volume, setVolume] = useState(1),
    [temperature, setTemperature] = useState(0),
    [seal, setSeal] = useState('open');
  const m = f.watch ? modes[Math.min(5, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.1, 0.82)) : progress;
  return (
    <div className={`cnge ${f.watch ? 'is-watch' : ''}`}>
      <div className="cnge-stage">
        {m === 'sun' || m === 'mineral' ? (
          <Spectrum
            mineral={m === 'mineral'}
            p={p}
            width={f.watch ? 0.15 : width}
            offset={f.watch ? 0 : offset}
          />
        ) : m === 'density' ? (
          <Density volume={f.watch ? 1 : volume} temp={f.watch ? 0 : temperature} p={p} />
        ) : m === 'separation' ? (
          <Separation p={p} />
        ) : m === 'xenon' ? (
          <Xenon p={p} open={f.watch || seal === 'open'} />
        ) : (
          <Boundary p={p} />
        )}
      </div>
      {!f.watch && (
        <div className="cnge-controls">
          <Segments
            label={t('发现链与证据')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          <Range
            label={t('教学进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {(m === 'sun' || m === 'mineral') && (
            <>
              <Range
                label={t('谱线宽度（nm）')}
                value={width}
                min={0.1}
                max={2}
                step={0.05}
                onChange={setWidth}
              />
              {m === 'mineral' && (
                <Range
                  label={t('矿物气样标尺偏移（nm）')}
                  value={offset}
                  min={-2}
                  max={2}
                  step={0.05}
                  onChange={setOffset}
                />
              )}
            </>
          )}
          {m === 'density' && (
            <>
              <Range
                label={t('相同气样体积（L）')}
                value={volume}
                min={0.25}
                max={2}
                step={0.25}
                onChange={setVolume}
              />
              <Range
                label={t('空气气样假设温差（K）')}
                value={temperature}
                min={-3}
                max={3}
                step={0.1}
                onChange={setTemperature}
              />
            </>
          )}
          {m === 'xenon' && (
            <Segments
              label={t('容器之间的密封')}
              value={seal}
              options={[
                { value: 'open', label: t('打开') },
                { value: 'closed', label: t('保持关闭') },
              ]}
              onChange={setSeal}
            />
          )}
        </div>
      )}
      <small className="cnge-note">
        {t('历史证据的教学重构；谱线形状、气体标记与分离份数为示意。')}
      </small>
    </div>
  );
}
