import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  harmonicMode,
  drivenMode,
  transmission,
  infraredTrace,
  beamWave,
  waveX,
  type IRSample,
  type Mode as Vibrator,
} from '../../models/chem-infrared-structure';
import '../../styles/chem-infrared-structure.css';
const modes = ['instrument', 'vibration', 'scan', 'functional', 'compare'] as const;
type Mode = (typeof modes)[number];
const names = [
  '光穿过样品',
  '频率与振动选择',
  '扫描得到透过率谱',
  '羟基提供结构线索',
  '同分异构体与干扰',
];
const path = (a: { x: number; y: number }[]) =>
  a.map((v, i) => `${i ? 'L' : 'M'}${v.x} ${v.y}`).join(' ');
function Instrument({ wn, T, phase, p }: { wn: number; T: number; phase: number; p: number }) {
  return (
    <>
      <svg
        className="cis-instrument"
        viewBox="0 0 320 130"
        role="img"
        aria-label={t('入射场与透射场通过同一个样品池，强度之比形成透过率')}
      >
        <rect x="8" y="35" width="44" height="70" rx="14" fill="#b5bcaa" />
        <path d="M22 48 Q39 52 22 57 T22 75 T22 93" fill="none" stroke="#b5855e" strokeWidth="3" />
        <path d="M58 45 V63 M58 77 V101" stroke="#8c9c8b" strokeWidth="5" />
        <rect
          x="142"
          y="34"
          width="34"
          height="73"
          rx="8"
          fill="#d1dfcf"
          stroke="#99ac95"
          strokeWidth="2"
        />
        <path d="M147 38 V103 M171 38 V103" stroke="#bdc9b0" strokeWidth="3" />
        <path d={path(beamWave(T, phase, p))} stroke="#b98b59" strokeWidth="2.5" fill="none" />
        <path d="M285 37 V104 H306 V37 Z" fill="#9cab98" />
        <path d="M292 44 V97" stroke="#dbe2c9" strokeWidth="5" />
        <text x="97" y="124">
          I₀
        </text>
        <text x="236" y="124">
          I
        </text>
      </svg>
      <div className="cis-readout">
        <span>{wn.toFixed(0)} cm⁻¹</span>
        <b>T = {(T * 100).toFixed(1)}%</b>
      </div>
    </>
  );
}
function Vibration({ kind, wn, phase }: { kind: Vibrator; wn: number; phase: number }) {
  const a = drivenMode(kind, wn, phase),
    isN = kind === 'nitrogen';
  return (
    <>
      <svg
        className="cis-vibration"
        viewBox="0 0 320 240"
        role="img"
        aria-label={t('键长改变时保持质心，氮分子仍可振动但该模式不吸收红外光')}
      >
        <path d="M20 50 H300" stroke="#d6d3b9" strokeWidth="2" />
        <path
          d={path(
            Array.from({ length: 280 }, (_, i) => ({
              x: 20 + i,
              y: 50 + 12 * Math.sin(i / 12 - phase),
            })),
          )}
          stroke="#bd9964"
          strokeWidth="2"
          fill="none"
        />
        <path d={`M${a.left} 135 H${a.right}`} stroke="#879c88" strokeWidth="5" />
        {isN && (
          <path
            d={`M${a.left} 127 H${a.right} M${a.left} 143 H${a.right}`}
            stroke="#879c88"
            strokeWidth="2"
          />
        )}
        <circle cx={a.left} cy="135" r={isN ? 23 : 27} fill={isN ? '#97b0b3' : '#bc8f7d'} />
        <circle cx={a.right} cy="135" r={isN ? 23 : 16} fill={isN ? '#97b0b3' : '#e9e4c9'} />
        <text x={a.left} y="143">
          {isN ? 'N' : 'O'}
        </text>
        <text x={a.right} y="143">
          {isN ? 'N' : kind === 'od' ? 'D' : 'H'}
        </text>
        <path d="M150 179 V191 M225 179 V191" stroke="#a1af98" strokeWidth="2" />
        <path d="M150 185 H225" stroke="#a1af98" strokeWidth="2" strokeDasharray="3 5" />
        <text x="160" y="225">
          {isN ? 'N₂' : kind === 'od' ? 'O–D' : 'O–H'} · {a.wavenumber.toFixed(0)} cm⁻¹
        </text>
      </svg>
      <div className="cis-vibration-state">
        {isN ? t('仍在振动；偶极矩不变，此模式不吸收') : t('偶极矩随振动改变；接近共振时吸收增强')}
      </div>
    </>
  );
}
function Plot({
  sample,
  column,
  water,
  scan = 500,
  compare = false,
  highlight = false,
}: {
  sample: IRSample;
  column: number;
  water: number;
  scan?: number;
  compare?: boolean;
  highlight?: boolean;
}) {
  return (
    <svg
      className="cis-plot"
      viewBox="0 0 380 205"
      role="img"
      aria-label={t('横轴波数从高到低，向下的透过率谷表示吸收')}
    >
      {highlight && (
        <rect
          x={waveX(3650)}
          y="25"
          width={waveX(3150) - waveX(3650)}
          height="125"
          rx="10"
          fill="#d9b983"
          opacity=".28"
        />
      )}
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <path
            d={`M48 ${150 - v * 1.25} H358`}
            stroke="#c6ceb6"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
          <text x="24" y={157 - v * 1.25}>
            {v}
          </text>
        </g>
      ))}
      <path d="M48 17 V151 H358" stroke="#97a68b" strokeWidth="2" fill="none" />
      {[4000, 3000, 2000, 1000].map((v) => (
        <g key={v}>
          <path d={`M${waveX(v)} 151 V158`} stroke="#97a68b" />
          <text x={waveX(v)} y="182">
            {v}
          </text>
        </g>
      ))}
      {compare && (
        <path
          d={path(infraredTrace('ether', column, water, scan))}
          stroke="#729c9e"
          strokeWidth="3"
          strokeDasharray="7 5"
          fill="none"
        />
      )}
      <path
        d={path(infraredTrace(sample, column, water, scan))}
        stroke="#aa7950"
        strokeWidth="3"
        fill="none"
      />
      {scan > 500 && (
        <path
          d={`M${waveX(scan)} 20 V154`}
          stroke="#bd9160"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}
function Molecule({ sample, p }: { sample: IRSample; p: number }) {
  const ethanol = sample === 'ethanol',
    h = { x: 270 + 7 * Math.sin(p * 6 * Math.PI), y: 40 - 5 * Math.sin(p * 6 * Math.PI) };
  return (
    <svg
      className="cis-molecule"
      viewBox="0 0 320 160"
      role="img"
      aria-label={ethanol ? t('乙醇包含羟基') : t('二甲醚不包含羟基')}
    >
      {ethanol ? (
        <>
          <path d="M76 71 L116 94 M159 94 L210 65" fill="none" stroke="#8e9e89" strokeWidth="4" />
          <path d={`M210 65 L${h.x} ${h.y}`} stroke="#b98d5b" strokeWidth="4" />
          <circle cx="210" cy="65" r="23" fill="#d7b09a" />
          <circle cx={h.x} cy={h.y} r="16" fill="#f0e7c8" />
          <text x="49" y="72">
            CH₃
          </text>
          <text x="138" y="114">
            CH₂
          </text>
          <text x="210" y="73">
            O
          </text>
          <text x={h.x} y={h.y + 8}>
            H
          </text>
        </>
      ) : (
        <>
          <path d="M112 102 L160 70 L209 103" fill="none" stroke="#8e9e89" strokeWidth="4" />
          <circle cx="160" cy="70" r="23" fill="#d7b09a" />
          <text x="90" y="120">
            CH₃
          </text>
          <text x="160" y="78">
            O
          </text>
          <text x="230" y="120">
            CH₃
          </text>
        </>
      )}
    </svg>
  );
}
export default function ChemInfraredStructure({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(variant === 'organic' ? 'functional' : 'instrument'),
    [sample, setSample] = useState<IRSample>('ethanol'),
    [kind, setKind] = useState<Vibrator>('oh'),
    [progress, setProgress] = useState(0.6),
    [wn, setWn] = useState(3350),
    [column, setColumn] = useState(1),
    [water, setWater] = useState(0);
  const m = f.watch ? modes[Math.min(4, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.1, 0.85)) : progress,
    phase = f.watch ? f.chapterTime * 3.5 : p * Math.PI * 8,
    k = f.watch ? (m === 'vibration' && p > 0.72 ? 'nitrogen' : 'oh') : kind,
    s = f.watch ? 'ethanol' : sample,
    wavenumber = f.watch
      ? m === 'vibration'
        ? k === 'nitrogen'
          ? harmonicMode(k).wavenumber
          : 2600 + 1200 * ramp(p, 0, 0.65)
        : m === 'scan'
          ? 4000 - 3500 * p
          : 3350
      : m === 'scan'
        ? 4000 - 3500 * p
        : wn,
    col = f.watch ? 1 : column,
    w = f.watch ? (m === 'compare' ? ease(ramp(p, 0.5, 1)) * 0.65 : 0) : water,
    T = transmission(s, wavenumber, col, w).T;
  return (
    <div className={`cis ${f.watch ? 'is-watch' : ''}`}>
      <div className="cis-stage">
        {m === 'instrument' ? (
          <>
            <Instrument wn={wavenumber} T={T} phase={phase} p={p} />
            <div className="cis-energy">
              <span>I₀ = 1</span>
              <div>
                <i style={{ width: `${100 * T}%` }} />
              </div>
              <span>I = {T.toFixed(3)}</span>
            </div>
            <p className="cis-short">{t('样品吸收的频段，透过光变弱')}</p>
          </>
        ) : m === 'vibration' ? (
          <>
            <Vibration kind={k} wn={wavenumber} phase={phase} />
            <div className="cis-readout">
              {t('入射波数')} {wavenumber.toFixed(0)} cm⁻¹
            </div>
          </>
        ) : m === 'scan' ? (
          <>
            <Instrument wn={wavenumber} T={T} phase={phase} p={1} />
            <Plot sample={s} column={col} water={w} scan={f.watch ? wavenumber : 4000 - 3500 * p} />
            <div className="cis-axes-label">
              {t('透过率 %')} · {t('波数 cm⁻¹')}
            </div>
          </>
        ) : m === 'functional' ? (
          <>
            <Molecule sample={s} p={p} />
            <Plot
              sample={s}
              column={col}
              water={w}
              scan={f.watch ? 4000 - 3500 * p : 500}
              highlight={s === 'ethanol' || w > 0}
            />
            <div className="cis-band-key">
              {(s === 'ethanol' || w > 0) && <span>O–H</span>}
              <span>C–H</span>
              <span>C–O</span>
            </div>
          </>
        ) : (
          <>
            <div className="cis-candidates">
              <span className="ethanol">CH₃CH₂OH</span>
              <span className="ether">CH₃OCH₃</span>
            </div>
            <Plot sample="ethanol" column={col} water={w} compare highlight />
            <div className="cis-band-key">
              <span>{t('实线：乙醇')}</span>
              <span>{t('虚线：二甲醚')}</span>
            </div>
            <p className="cis-short">
              {w > 0.1 ? t('水的吸收会干扰羟基判断') : t('C₂H₆O 候选中，羟基证据支持乙醇')}
            </p>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="cis-controls">
          <Segments
            label={t('从光路到结构')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          <Range
            label={t('教学进程或振动相位')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'vibration' ? (
            <Segments
              label={t('振动模型')}
              value={kind}
              options={[
                { value: 'oh', label: 'O–H' },
                { value: 'od', label: 'O–D' },
                { value: 'nitrogen', label: 'N₂' },
              ]}
              onChange={(v) => setKind(v as Vibrator)}
            />
          ) : (
            m !== 'compare' && (
              <Segments
                label={t('样品')}
                value={sample}
                options={[
                  { value: 'ethanol', label: t('乙醇') },
                  { value: 'ether', label: t('二甲醚') },
                ]}
                onChange={(v) => setSample(v as IRSample)}
              />
            )
          )}{' '}
          {(m === 'instrument' || m === 'vibration') && (
            <Range
              label={t('入射波数（cm⁻¹）')}
              value={wn}
              min={500}
              max={4000}
              step={10}
              onChange={setWn}
            />
          )}{' '}
          {m !== 'vibration' && (
            <>
              <Range
                label={t('相对浓度 × 光程')}
                value={column}
                min={0}
                max={2}
                step={0.05}
                onChange={setColumn}
              />
              <Range
                label={t('未扣除的水吸收背景')}
                value={water}
                min={0}
                max={1}
                step={0.05}
                onChange={setWater}
              />
            </>
          )}
        </div>
      )}
      <small className="cis-note">
        {t('独立谐振子与合成谱带模型；时间、位移放大，谱图不是原始实验数据。')}
      </small>
    </div>
  );
}
