import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  layout,
  absorbed,
  combustion,
  inferComposition,
  atomicMass,
} from '../../models/chem-elemental-analysis';
import '../../styles/chem-elemental-analysis.css';
const modes = ['weigh', 'burn', 'capture', 'ratio', 'limits'] as const;
type Mode = (typeof modes)[number];
const names = [
  '先称样品',
  '让碳氢变成可收集的产物',
  '分别收集，分别称量',
  '由质量求原子比',
  '结论能到哪一步',
];
function Balance({ mass, label, small = false }: { mass: number; label: string; small?: boolean }) {
  return (
    <div className={`chem-ea-balance ${small ? 'small' : ''}`}>
      <svg viewBox="0 0 300 150" role="img" aria-label={t('质量测量示意')}>
        <path d="M55 67H245L263 122H37Z" fill="#deded2" stroke="#a9b5a7" strokeWidth="2" />
        <path
          d="M68 67V25H232V67"
          fill="#f8fbf5"
          fillOpacity=".35"
          stroke="#a6b9aa"
          strokeWidth="2"
        />
        <path
          d="M150 31V61M106 31H194M106 31L91 48H121ZM194 31L179 48H209Z"
          fill="none"
          stroke="#8b9d87"
          strokeWidth="2"
        />
        <rect x="90" y="85" width="120" height="27" rx="5" fill="#eef0dc" />
        <text x="150" y="105" textAnchor="middle" fontSize="20" fill="#536650">
          {mass.toFixed(5)} g
        </text>
      </svg>
      <b>{label}</b>
    </div>
  );
}
function Apparatus({ narrow, time, dryer }: { narrow: boolean; time: number; dryer: boolean }) {
  const uid = useId().replace(/:/g, ''),
    l = layout(narrow),
    state = absorbed(0.46068, time, narrow, dryer),
    dy = l.dryPoint.y,
    dx = l.dryPoint.x,
    gasPath = l.path.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' '),
    heat = ease(ramp(time, 0, 0.2));
  return (
    <svg
      className={narrow ? 'chem-ea-phone' : 'chem-ea-desktop'}
      viewBox={narrow ? '0 0 310 365' : '0 0 690 240'}
      role="img"
      aria-label={t('燃烧管、先除水的氯化钙管和后吸收二氧化碳的碱液球管')}
    >
      <defs>
        <linearGradient id={uid + 'glass'} x2="0" y2="1">
          <stop stopColor="#fcfdf9" stopOpacity=".5" />
          <stop offset=".5" stopColor="#b4ccc1" stopOpacity=".15" />
          <stop offset="1" stopColor="#90ad9e" stopOpacity=".4" />
        </linearGradient>
        {l.bulbs.map((b, i) => (
          <clipPath key={i} id={uid + 'bulb' + i}>
            <circle cx={b.x} cy={b.y} r={b.r - 2} />
          </clipPath>
        ))}
      </defs>
      <path d={gasPath} stroke="#a5b9ac" strokeWidth="13" fill="none" strokeLinejoin="round" />
      <path d={gasPath} stroke="#f4f8ed" strokeWidth="9" fill="none" strokeLinejoin="round" />
      <rect
        x={l.furnace.x + 6}
        y={l.furnace.y + 17}
        width={l.furnace.width - 12}
        height="31"
        rx="7"
        fill="#cfc6ae"
        stroke="#aeaa93"
      />
      {Array.from({ length: 5 }, (_, i) => (
        <path
          key={i}
          d={`M${l.furnace.x + 22 + (i * (l.furnace.width - 44)) / 4} ${l.furnace.y + 26}q-7 -8 0 -18q8 9 0 18Z`}
          fill="#d5a567"
          opacity={0.2 + 0.6 * heat}
        />
      ))}
      <rect
        x={l.furnace.x}
        y={l.furnace.y - 18}
        width={l.furnace.width}
        height="36"
        rx="17"
        fill={`url(#${uid}glass)`}
        stroke="#9fb4a5"
        strokeWidth="2"
      />
      <path d={`M${l.furnace.x + 15} ${l.furnace.y + 7}h34l-4 6h-26Z`} fill="#b5ab8c" />
      {Array.from({ length: 23 }, (_, i) => (
        <circle
          key={i}
          cx={l.furnace.x + 57 + ((i * 17) % (l.furnace.width - 75))}
          cy={l.furnace.y + 5 + (i % 3) * 3}
          r="3"
          fill={time > 0.3 + i * 0.015 ? '#ae8066' : '#4d5950'}
        />
      ))}
      <rect
        x={dx - 44}
        y={dy - 17}
        width="88"
        height="34"
        rx="15"
        fill={`url(#${uid}glass)`}
        stroke="#9fb4a5"
        strokeWidth="2"
      />
      {dryer &&
        Array.from({ length: 29 }, (_, i) => (
          <path
            key={i}
            d={`M${dx - 35 + ((i * 13) % 68)} ${dy - 9 + ((i * 7) % 19)}l4 -1 3 4 -5 2Z`}
            fill="#e5e1cc"
            stroke="#babca6"
            strokeWidth=".7"
          />
        ))}
      {l.bulbs.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill={`url(#${uid}glass)`}
            stroke="#9fb4a5"
            strokeWidth="2"
          />
          {i > 0 && i < 4 && (
            <g clipPath={`url(#${uid}bulb${i})`}>
              <rect
                x={b.x - b.r}
                y={b.y - 3}
                width={b.r * 2}
                height={b.r + 6}
                fill="#b4c7ad"
                opacity=".6"
              />
              <path
                d={`M${b.x - b.r} ${b.y - 3}Q${b.x} ${b.y + 1} ${b.x + b.r} ${b.y - 3}`}
                stroke="#8fa58a"
                fill="none"
              />
            </g>
          )}
        </g>
      ))}
      {state.state.map((a, i) => {
        const visible = ramp(time - i * 0.035, 0, 0.04) * (1 - a.capture);
        return (
          <g key={a.id} transform={`translate(${a.point.x} ${a.point.y})`} opacity={visible}>
            {a.species === 'water' ? (
              <g>
                <path d="M-7 6L0 0L7 6" stroke="#b6ad83" strokeWidth="2" />
                <circle r="4.5" fill="#6b9fa7" />
                <circle cx="-7" cy="6" r="2.8" fill="#ede1ad" />
                <circle cx="7" cy="6" r="2.8" fill="#ede1ad" />
              </g>
            ) : (
              <g>
                <path d="M-9 0H9" stroke="#a7917c" strokeWidth="2" />
                <circle r="3.5" fill="#727a65" />
                <circle cx="-9" r="4" fill="#ba8170" />
                <circle cx="9" r="4" fill="#ba8170" />
              </g>
            )}
          </g>
        );
      })}
      <text
        x={l.furnace.x + l.furnace.width / 2}
        y={l.furnace.y - 30}
        textAnchor="middle"
        fontSize={narrow ? 21 : 22}
        fill="#68775e"
      >
        CuO
      </text>
      <text x={dx} y={dy - 30} textAnchor="middle" fontSize={narrow ? 21 : 22} fill="#68775e">
        {dryer ? 'CaCl₂' : '∅'}
      </text>
      <text
        x={l.capturePoint.x}
        y={l.capturePoint.y + 36}
        textAnchor="middle"
        fontSize={narrow ? 21 : 22}
        fill="#68775e"
      >
        KOH
      </text>
    </svg>
  );
}
function Ratios({ p }: { p: number }) {
  const product = combustion(0.46068),
    r = inferComposition(0.46068, product.water, product.co2),
    m = [r.carbon, r.hydrogen, r.oxygen!].map((x) => (x / 0.46068) * 100),
    a = [atomicMass.C, atomicMass.H, atomicMass.O];
  return (
    <div className="chem-ea-ratio">
      <div className="chem-ea-ratio-head">
        <span>{t('质量分数')}</span>
        <span>{t('除以原子量')}</span>
        <span>{t('最简比')}</span>
      </div>
      {['C', 'H', 'O'].map((x, i) => (
        <div className="chem-ea-ratio-row" key={x}>
          <b>{x}</b>
          <span>{m[i].toFixed(2)}%</span>
          <span style={{ opacity: ramp(p, 0.1, 0.35) }}>÷ {a[i]}</span>
          <strong style={{ opacity: ramp(p, 0.45, 0.8) }}>{r.integerRatio![i]}</strong>
        </div>
      ))}
      <div className="chem-ea-formula" style={{ opacity: ramp(p, 0.5, 0.85) }}>
        C₂H₆O
      </div>
      <p>{t('氧含量由差量得到，前提是样品只含C、H、O。')}</p>
    </div>
  );
}
export default function ChemElementalAnalysis({ variant }: { variant?: string }) {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>(
    modes.includes(variant as Mode) ? (variant as Mode) : 'weigh',
  );
  const [mass, setMass] = useState(0.46068);
  const [progress, setProgress] = useState(1);
  const [dryer, setDryer] = useState(true);
  const [cho, setCho] = useState(true);
  const m = f.watch ? modes[Math.min(4, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : 1,
    amount = f.watch ? 0.46068 : mass,
    hasDryer = f.watch ? true : dryer;
  const time = f.watch
    ? m === 'burn'
      ? p * 0.4
      : m === 'capture'
        ? 0.4 + 0.6 * p
        : 1
    : m === 'limits'
      ? 1
      : progress;
  const gain = absorbed(amount, time, false, hasDryer),
    inferred = inferComposition(amount, gain.water, gain.co2, f.watch || cho);
  return (
    <div className={`chem-ea ${f.watch ? 'is-watch' : ''}`}>
      <div className="chem-ea-stage">
        {m === 'weigh' && (
          <>
            <Balance mass={amount} label={t('未知有机样品')} />
            <div className="chem-ea-sample-ledger">
              <span>{t('已知只含')}</span>
              <b>C · H · O</b>
              <span>{t('先记录样品质量，再开始转化。')}</span>
            </div>
          </>
        )}
        {(m === 'burn' || m === 'capture') && (
          <>
            <Apparatus narrow={false} time={time} dryer={hasDryer} />
            <Apparatus narrow time={time} dryer={hasDryer} />
            <div className="chem-ea-legend">
              <span>
                <i className="water" />
                H₂O → {hasDryer ? 'CaCl₂' : 'KOH'}
              </span>
              <span>
                <i className="co2" />
                CO₂ → KOH
              </span>
            </div>
            <div className="chem-ea-gains">
              <div>
                <b>{t('除水管增重')}</b>
                <output>{gain.water.toFixed(5)} g</output>
              </div>
              <div>
                <b>{t('碱液管增重')}</b>
                <output>{gain.co2.toFixed(5)} g</output>
              </div>
            </div>
          </>
        )}
        {m === 'ratio' && <Ratios p={p} />}
        {m === 'limits' && (
          <div className="chem-ea-limits">
            <div className="chem-ea-element-ledger">
              {[
                ['C', inferred.carbon],
                ['H', inferred.hydrogen],
                ['O', inferred.oxygen],
              ].map(([a, n]) => (
                <div key={a}>
                  <b>{a}</b>
                  <span>{n === null ? '?' : ((Number(n) / amount) * 100).toFixed(1) + '%'}</span>
                </div>
              ))}
            </div>
            <div className="chem-ea-identities">
              <div>
                <b>CH₃—CH₂—OH</b>
                <span>{t('乙醇')}</span>
              </div>
              <div>
                <b>CH₃—O—CH₃</b>
                <span>{t('二甲醚')}</span>
              </div>
            </div>
            <p>{t('相同组成不确定连接；还需要结构证据。')}</p>
            {!f.watch && !dryer && <p>{t('未先除水，碱液管会把水也计入，碳含量被高估。')}</p>}
            {!f.watch && !cho && <p>{t('若还有其他元素，剩余质量不能直接归为氧。')}</p>}
          </div>
        )}
      </div>
      {!f.watch && (
        <div className="chem-ea-controls">
          <Segments
            label={t('观察内容')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m !== 'ratio' && (
            <Range
              label={t('样品质量')}
              value={mass}
              min={0.1}
              max={1}
              step={0.00001}
              unit="g"
              onChange={setMass}
            />
          )}
          {(m === 'burn' || m === 'capture' || m === 'limits') && (
            <>
              {m !== 'limits' && (
                <Range
                  label={t('实验进程')}
                  value={progress}
                  min={0}
                  max={1}
                  step={0.005}
                  onChange={setProgress}
                />
              )}
              <Segments
                label={t('先除水')}
                value={dryer ? 'yes' : 'no'}
                options={[
                  { value: 'yes', label: t('装入无水氯化钙') },
                  { value: 'no', label: t('空管反例') },
                ]}
                onChange={(v) => setDryer(v === 'yes')}
              />
            </>
          )}
          {m === 'limits' && (
            <Segments
              label={t('样品元素范围')}
              value={cho ? 'cho' : 'unknown'}
              options={[
                { value: 'cho', label: 'C / H / O' },
                { value: 'unknown', label: t('可能还有其他元素') },
              ]}
              onChange={(v) => setCho(v === 'cho')}
            />
          )}
        </div>
      )}
      <small className="chem-ea-note">
        {t(
          '原理装置与理想称量示意，非原始实验记录；微观标记放大，样品默认组成用于生成可核算数据。',
        )}
      </small>
    </div>
  );
}
