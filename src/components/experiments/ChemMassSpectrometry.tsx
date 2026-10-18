import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  sector,
  sectorPoint,
  collectorR,
  SCALE,
  fieldForMass,
  spectra,
  isotopeRelative,
  formulaEvidence,
  ionization,
  hydrogenFragment,
} from '../../models/chem-mass-spectrometry';
import '../../styles/chem-mass-spectrometry.css';
const modes = [
  'ionize',
  'sector',
  'fragments',
  'toluene',
  'formula',
  'isotopes',
  'structure',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '电子电离',
  '磁场分离与收集',
  '碎片与中性部分',
  '最高峰与分子离子',
  '由实验式得到分子式',
  '最右峰也未必是分子离子',
  '分子式仍不能确定连接',
];
const path = (a: { x: number; y: number }[]) =>
  a.map((v, i) => `${i ? 'L' : 'M'}${v.x} ${v.y}`).join(' ');
function Ion({ p, fragment }: { p: number; fragment: boolean }) {
  const e = ionization(p),
    h = hydrogenFragment(fragment ? p : 0);
  return (
    <>
      <svg
        className="cms-ion"
        viewBox="0 0 320 230"
        role="img"
        aria-label={
          fragment
            ? t('带电的九十一质量片段与中性氢分别保留')
            : t('电子电离留下分子正离子和两个离开电子')
        }
      >
        <ellipse cx="160" cy="126" rx="112" ry="63" fill="#dfe6d1" fillOpacity=".7" />
        <polygon
          points="84,100 120,80 156,100 156,140 120,160 84,140"
          fill="none"
          stroke="#879d83"
          strokeWidth="3"
        />
        <circle cx="120" cy="120" r="23" fill="none" stroke="#879d83" strokeWidth="2" />
        <path d="M156 120 H186" stroke="#879d83" strokeWidth="3" />
        <text x="210" y="128">
          CH₂
        </text>
        <path
          d={`M232 125 L${h.x - 9} ${h.y}`}
          stroke="#b09169"
          strokeWidth="2"
          opacity={fragment ? 1 - p : 1}
        />
        <text x={h.x} y={h.y + 7}>
          H{fragment && p > 0.4 ? '·' : ''}
        </text>
        <text x="244" y="88" opacity={fragment ? 1 : e.charged ? 1 : 0}>
          {fragment ? '+' : '+·'}
        </text>
        {!fragment && (
          <>
            <path d="M20 84 H136" stroke="#a1aca0" strokeDasharray="3 6" opacity=".5" />
            <circle
              cx={e.incoming.x}
              cy={e.incoming.y}
              r="5"
              fill="#829eac"
              opacity={e.charged ? 0 : 1}
            />
            {e.outgoing.map((a, i) => (
              <circle key={i} cx={a.x} cy={a.y} r="5" fill="#829eac" opacity={e.charged ? 1 : 0} />
            ))}
          </>
        )}
        <text x="160" y="215">
          {fragment ? '92 → 91⁺ + 1' : 'M + e⁻ → M⁺· + 2e⁻'}
        </text>
      </svg>
      <p className="cms-sub">
        {fragment
          ? t('保留电荷的片段可被检测；中性部分不产生同样的离子信号')
          : t('骨架尚未改变，先形成带正电的分子离子')}
      </p>
    </>
  );
}
function Sector({
  p,
  mass,
  z,
  voltage,
  field,
}: {
  p: number;
  mass: number;
  z: number;
  voltage: number;
  field: number;
}) {
  const a = sector(mass, z, voltage, field),
    q = sectorPoint(a.radius, a.stop * p),
    target = 60 + 2 * collectorR * SCALE;
  return (
    <>
      <svg
        className="cms-sector"
        viewBox="0 0 360 280"
        role="img"
        aria-label={t('离子加速后在出纸面的磁场中向右弯曲，只有窄范围轨迹进入收集狭缝')}
      >
        <rect
          x="38"
          y="20"
          width="292"
          height="180"
          rx="14"
          fill="#d8e4dc"
          stroke="#93aa9b"
          strokeWidth="2"
        />
        {Array.from({ length: 35 }, (_, i) => (
          <circle
            key={i}
            cx={60 + (i % 7) * 40}
            cy={40 + Math.floor(i / 7) * 34}
            r="1.7"
            fill="#9ab3a5"
          />
        ))}
        <rect x="48" y="198" width="24" height="63" fill="#e6ead8" />
        <path
          d="M30 215 H51 M69 215 H89 M30 240 H51 M69 240 H89"
          stroke="#91a18a"
          strokeWidth="4"
        />
        <text x="17" y="221">
          −
        </text>
        <text x="17" y="246">
          +
        </text>
        <path d="M60 259 V200" stroke="#a79063" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="40" y="259" width="40" height="16" rx="6" fill="#b5bea8" />
        <path d={path(a.points)} stroke="#b08b55" strokeWidth="2" fill="none" opacity=".4" />
        <path
          d={path(a.points.slice(0, Math.max(1, Math.floor(p * 120) + 1)))}
          stroke="#ac7d48"
          strokeWidth="3"
          fill="none"
        />
        <circle cx={q.x} cy={q.y} r="5" fill="#aa7c4d" />
        <rect x={target - 2} y="197" width="4" height="8" fill="#e2e9d7" />
        <path
          d={`M${target - 25} 202 H${target - 1} M${target + 1} 202 H${target + 25}`}
          stroke="#829b8b"
          strokeWidth="6"
        />
        <path
          d={`M${target} 204 V231`}
          stroke={a.hit && p > 0.96 ? '#b18b4d' : '#aebaa1'}
          strokeWidth="3"
        />
        <rect
          x={target - 28}
          y="232"
          width="56"
          height="29"
          rx="10"
          fill={a.hit && p > 0.96 ? '#ddc98d' : '#c8d2bd'}
        />
        <text x="203" y="39">
          B ⊙
        </text>
        {a.hitWall && p > 0.98 && (
          <circle cx={q.x} cy={q.y} r="9" fill="none" stroke="#b47a5b" strokeWidth="2" />
        )}
      </svg>
      <div className="cms-sector-readout">
        <span>m/z {mass / z}</span>
        <span>
          {field.toFixed(3)} T · {voltage} V
        </span>
        <b>{a.hitWall ? t('轨迹到达腔壁') : a.hit ? t('进入收集狭缝') : t('偏离收集狭缝')}</b>
      </div>
      <div className="cms-offset-track" aria-hidden="true">
        <i />
        <b style={{ left: `${50 + Math.max(-2.4, Math.min(2.4, a.deltaMillimetres)) * 20}%` }} />
      </div>
      <div className="cms-offset">
        <span>{t('半径偏差')}</span>
        <strong>{a.deltaMillimetres.toFixed(2)} mm</strong>
        <span>{t('允许 ±0.25 mm')}</span>
      </div>
    </>
  );
}
function Spectrum({
  sample,
  p,
  selected,
  isotopes = false,
}: {
  sample: 'toluene' | 'ethanol';
  p: number;
  selected: number;
  isotopes?: boolean;
}) {
  const peaks: {
      mz: number;
      height: number;
      role: 'base' | 'molecular' | 'fragment' | 'isotope';
    }[] = [...spectra[sample].map((v) => ({ ...v, mz: Number(v.mz), height: Number(v.height) }))],
    m = sample === 'toluene' ? 92 : 46,
    iso = isotopeRelative(sample === 'toluene' ? 7 : 2);
  if (isotopes)
    peaks.push(
      { mz: m + 1, height: iso.M1 * (sample === 'toluene' ? 60 : 16), role: 'isotope' },
      { mz: m + 2, height: iso.M2 * (sample === 'toluene' ? 60 : 16), role: 'isotope' },
    );
  const max = sample === 'toluene' ? 105 : 60,
    min = sample === 'toluene' ? 40 : 15,
    x = (mz: number) => 45 + ((mz - min) / (max - min)) * 310;
  return (
    <>
      <svg
        className="cms-spectrum"
        viewBox="0 0 380 210"
        role="img"
        aria-label={t('质谱横轴是质荷比，最高峰归一化为百分之一百')}
      >
        <path d="M45 21 V165 H359" stroke="#93a58b" strokeWidth="2" fill="none" />
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <path d={`M45 ${165 - v * 1.3} H359`} stroke="#c5cdb6" strokeDasharray="3 6" />
            <text x="23" y={173 - v * 1.3}>
              {v}
            </text>
          </g>
        ))}
        {[
          sample === 'toluene' ? 50 : 20,
          sample === 'toluene' ? 70 : 40,
          sample === 'toluene' ? 90 : 60,
        ].map((v) => (
          <text key={v} x={x(v)} y="193">
            {v}
          </text>
        ))}
        {peaks.map((v) => (
          <path
            key={v.mz}
            d={`M${x(v.mz)} 165 V${165 - v.height * 1.3 * Math.min(1, p * 1.5)}`}
            stroke={v.mz === selected ? '#ac7a48' : v.role === 'isotope' ? '#739ca4' : '#9daa8b'}
            strokeWidth={v.mz === selected ? 4 : 2.4}
          />
        ))}
        <text x="340" y="22">
          m/z
        </text>
      </svg>
      <div className="cms-peak-note">
        {selected === m
          ? t('分子离子峰')
          : selected === (sample === 'toluene' ? 91 : 31)
            ? t('基峰：相对丰度 100%')
            : t('碎片峰或同位素峰')}{' '}
        · m/z {selected}
      </div>
      {isotopes && (
        <div className="cms-isotope">
          <span>
            M <b>{sample === 'toluene' ? 60 : 16}%</b>
          </span>
          <span>
            M+1 <b>{(iso.M1 * (sample === 'toluene' ? 60 : 16)).toFixed(1)}%</b>
          </span>
          <span>
            M+2 <b>{(iso.M2 * (sample === 'toluene' ? 60 : 16)).toFixed(2)}%</b>
          </span>
        </div>
      )}
    </>
  );
}
function Formula({ peak, z }: { peak: number; z: number }) {
  const a = formulaEvidence(peak, z);
  return (
    <div className="cms-formula">
      <p>
        {t('燃烧分析的实验式')} <b>C₂H₆O</b>
      </p>
      <div className="cms-formula-ratio">
        <span>
          {peak} × {z}
        </span>
        <i />
        <span>46</span>
      </div>
      <strong>n = {a.ratio.toFixed(3)}</strong>
      <p>
        {a.integral && a.ordinaryNeutralValence ? (
          <>
            {t('符合该候选')} <b>C₂H₆O</b>
          </>
        ) : (
          t('不支持该中性分子式；复核峰归属与电荷')
        )}
      </p>
    </div>
  );
}
function Structure({ p }: { p: number }) {
  return (
    <div className="cms-structures">
      <b>C₂H₆O · Mᵣ ≈ 46</b>
      <svg viewBox="0 0 320 200" role="img" aria-label={t('同一分子式分别连接为乙醇或二甲醚')}>
        <path
          d="M76 61 L113 80 M157 80 L206 55 L265 82"
          fill="none"
          stroke="#8fa186"
          strokeWidth="3"
        />
        <text x="51" y="61">
          CH₃
        </text>
        <text x="135" y="99">
          CH₂
        </text>
        <circle cx="206" cy="55" r="17" fill="#e8dec0" />
        <text x="206" y="63">
          O
        </text>
        <text x="279" y="92">
          H
        </text>
        <g opacity={ease(ramp(p, 0, 0.5))}>
          <path d="M106 163 L160 129 L215 164" fill="none" stroke="#8fa186" strokeWidth="3" />
          <text x="83" y="179">
            CH₃
          </text>
          <circle cx="160" cy="129" r="17" fill="#e8dec0" />
          <text x="160" y="137">
            O
          </text>
          <text x="238" y="179">
            CH₃
          </text>
        </g>
      </svg>
      <p>{t('还需要红外、氢谱等结构证据')}</p>
    </div>
  );
}
export default function ChemMassSpectrometry({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(variant === 'formula' ? 'formula' : 'ionize'),
    [progress, setProgress] = useState(0.7),
    [mass, setMass] = useState('92'),
    [charge, setCharge] = useState('1'),
    [voltage, setVoltage] = useState(1000),
    [field, setField] = useState(0.3),
    [peak, setPeak] = useState('46');
  const m = f.watch ? modes[Math.min(6, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.1, 0.85)) : progress,
    mass0 = f.watch ? [65, 91, 92][Math.min(2, Math.floor(p * 3))] : Number(mass),
    V = f.watch ? 1000 : voltage,
    B = f.watch ? 0.3 : field,
    z = f.watch ? 1 : Number(charge),
    sel = f.watch
      ? m === 'toluene'
        ? p < 0.5
          ? 91
          : 92
        : m === 'isotopes'
          ? p < 0.5
            ? 92
            : 93
          : m === 'formula'
            ? p < 0.3
              ? 31
              : p < 0.6
                ? 45
                : 46
            : 46
      : Number(peak);
  return (
    <div className={`cms ${f.watch ? 'is-watch' : ''}`}>
      <div className="cms-stage">
        {m === 'ionize' || m === 'fragments' ? (
          <Ion p={p} fragment={m === 'fragments'} />
        ) : m === 'sector' ? (
          <Sector
            p={f.watch ? p * 3 - Math.min(2, Math.floor(p * 3)) : p}
            mass={mass0}
            z={z}
            voltage={V}
            field={B}
          />
        ) : m === 'toluene' ? (
          <Spectrum sample="toluene" p={p} selected={f.watch ? sel : Number(mass)} />
        ) : m === 'formula' ? (
          <>
            <Spectrum sample="ethanol" p={1} selected={sel} />
            <Formula peak={sel} z={z} />
          </>
        ) : m === 'isotopes' ? (
          <>
            <Spectrum sample="toluene" p={1} selected={sel < 90 ? 92 : sel} isotopes />
            <p className="cms-sub">{t('同位素峰可能在分子离子峰右侧')}</p>
          </>
        ) : (
          <Structure p={p} />
        )}
      </div>
      {!f.watch && (
        <div className="cms-controls">
          <Segments
            label={t('从离子到分子式')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => {
              setMode(v as Mode);
              setPeak(v === 'isotopes' ? '92' : '46');
              if (v === 'toluene') setMass('92');
            }}
          />
          <Range
            label={t('教学进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {(m === 'sector' || m === 'toluene') && (
            <Segments
              label={t('离子相对质量')}
              value={mass}
              options={(m === 'toluene' ? ['65', '91', '92'] : ['31', '46', '65', '91', '92']).map(
                (value) => ({ value, label: value }),
              )}
              onChange={setMass}
            />
          )}{' '}
          {(m === 'formula' || m === 'isotopes') && (
            <Segments
              label={t('采用哪个峰推断')}
              value={peak}
              options={(m === 'isotopes' ? ['91', '92', '93', '94'] : ['31', '45', '46', '47']).map(
                (value) => ({ value, label: value }),
              )}
              onChange={setPeak}
            />
          )}{' '}
          {(m === 'sector' || m === 'formula') && (
            <Segments
              label={t('假设电荷数')}
              value={charge}
              options={[
                { value: '1', label: 'z = 1' },
                { value: '2', label: 'z = 2' },
              ]}
              onChange={setCharge}
            />
          )}{' '}
          {m === 'sector' && (
            <>
              <Range
                label={t('加速电压（V）')}
                value={voltage}
                min={500}
                max={1500}
                step={50}
                onChange={setVoltage}
              />
              <Range
                label={t('磁感应强度（T）')}
                value={field}
                min={0.08}
                max={0.45}
                step={0.001}
                onChange={setField}
              />
              <button
                className="cms-tune"
                onClick={() => setField(fieldForMass(Number(mass), Number(charge), voltage))}
              >
                {t('调到所选 m/z 的收集条件')}
              </button>
            </>
          )}
        </div>
      )}
      <small className="cms-note">
        {t('理想磁扇形与教学谱峰；峰高、时间、狭缝视觉宽度为示意。')}
      </small>
    </div>
  );
}
