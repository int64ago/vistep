import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  environments,
  hydrogenGeometry,
  sampledSpectrum,
  fid,
  type Molecule,
  type Environment,
} from '../../models/chem-nmr-hydrogen';
import '../../styles/chem-nmr-hydrogen.css';
const modes = [
  'instrument',
  'environments',
  'integrals',
  'ether',
  'splitting',
  'exchange',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '把样品放进磁场',
  '给六个氢分组',
  '读峰面积，别数峰高',
  '另一种连接只有一组氢',
  '一组信号可以分裂',
  '羟基峰不是固定指纹',
];
const labels = { methyl: '甲基氢', methylene: '亚甲基氢', hydroxyl: '羟基氢', ether: '等效甲基氢' };
function MoleculeView({
  m,
  selected,
  exchange = 0,
}: {
  m: Molecule;
  selected: string;
  exchange?: number;
}) {
  const s = hydrogenGeometry(m),
    groups = environments(m);
  return (
    <svg
      className="chem-nmr-molecule"
      viewBox="0 0 340 230"
      role="img"
      aria-label={t(m === 'ethanol' ? '乙醇六个氢的环境分组' : '二甲醚六个等效氢')}
    >
      {s.edges.map(([a, b], i) => (
        <path
          key={i}
          d={`M${s.atoms[a].x} ${s.atoms[a].y}L${s.atoms[b].x} ${s.atoms[b].y}`}
          stroke="#a0aaa0"
          strokeWidth="3"
        />
      ))}
      {s.atoms.map((a) => {
        const group = groups.find((g) => g.hydrogens.includes(a.id)),
          active = !group || !selected || group.id === selected;
        return (
          <g key={a.id} opacity={active ? 1 : 0.25}>
            <circle
              cx={a.x}
              cy={a.y}
              r={a.element === 'H' ? 19 : 18}
              fill={group ? group.color : '#f0f1e6'}
              fillOpacity={group ? 0.2 : 1}
              stroke={group?.color || '#d6dbca'}
              strokeWidth="1.5"
            />
            <text
              x={a.x}
              y={a.y + 7}
              textAnchor="middle"
              fontSize="23"
              fontWeight={group ? 600 : 400}
              fill={group?.color || (a.element === 'O' ? '#b77c75' : '#637463')}
            >
              {a.id === 'H6' && m === 'ethanol' && exchange > 0.9 ? 'D' : a.element}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function Spectrum({
  groups,
  selected = '',
  integrate = false,
  reveal = 1,
  zoom = false,
}: {
  groups: Environment[];
  selected?: string;
  integrate?: boolean;
  reveal?: number;
  zoom?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    lo = zoom ? groups[0].shift - 0.065 : 0,
    hi = zoom ? groups[0].shift + 0.065 : 6,
    points = sampledSpectrum(groups, lo, hi, 1200),
    max = Math.max(...points.map((x) => x.value), 0.1),
    w = 540,
    h = 210,
    px = (d: number) => 50 + ((hi - d) / (hi - lo)) * 450,
    py = (v: number) => 165 - (v / max) * 125,
    total = groups.reduce((a, g) => a + g.area, 0);
  return (
    <svg
      className="chem-nmr-spectrum"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('由同一谱线模型计算的氢谱和积分曲线')}
    >
      <defs>
        <clipPath id={id}>
          <rect x="20" y="10" width={500 * reveal} height="170" />
        </clipPath>
      </defs>
      <path d="M50 25V165H510" fill="none" stroke="#aebaa5" strokeWidth="1.5" />
      {(zoom ? [0, 1.5, 3, 4.5, 6] : [0, 1, 2, 3, 4, 5, 6]).map((i) => {
        const delta = hi - ((hi - lo) * i) / 6;
        return (
          <g key={i}>
            <path d={`M${px(delta)} 165v5`} stroke="#aebaa5" />
            <text x={px(delta)} y="194" textAnchor="middle" fontSize="22" fill="#738069">
              {zoom ? delta.toFixed(2) : delta.toFixed(0)}
            </text>
          </g>
        );
      })}
      <g clipPath={`url(#${id})`}>
        {groups.map((g) => {
          const pp = sampledSpectrum([g], lo, hi, 1200),
            d = pp.map((x, i) => `${i ? 'L' : 'M'}${px(x.delta)} ${py(x.value)}`).join(' ');
          return (
            <path
              key={g.id}
              d={d}
              fill="none"
              stroke={g.color}
              strokeWidth="2.4"
              opacity={!selected || g.id === selected ? 1 : 0.2}
            />
          );
        })}
        {integrate && (
          <path
            d={points
              .map(
                (x, i) =>
                  `${i ? 'L' : 'M'}${px(x.delta)} ${145 - (x.integral / Math.max(1, total)) * 100}`,
              )
              .join(' ')}
            fill="none"
            stroke="#768969"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        )}
      </g>
      <text x="505" y="25" textAnchor="end" fontSize="20" fill="#738069">
        δ / ppm
      </text>
    </svg>
  );
}
function Instrument({ p }: { p: number }) {
  const groups = environments('ethanol'),
    tubeY = -50 + 90 * ease(ramp(p, 0, 0.35)),
    rf = ramp(p, 0.35, 0.45) * (1 - ramp(p, 0.47, 0.54)),
    fraction = ramp(p, 0.5, 1),
    points = Array.from({ length: 360 }, (_, i) => {
      const x = (i / 359) * 0.08,
        q = fid(x, groups);
      return `${i ? 'L' : 'M'}${20 + (i / 359) * 290} ${70 - (q.real / 6) * 46}`;
    }).join(' ');
  return (
    <div className="chem-nmr-instrument">
      <svg viewBox="0 0 340 285" role="img" aria-label={t('样品管进入磁体中央的探头线圈区域')}>
        <defs>
          <linearGradient id="chem-nmr-metal">
            <stop stopColor="#cdd9cf" />
            <stop offset=".45" stopColor="#f7f8ec" />
            <stop offset="1" stopColor="#acbeb0" />
          </linearGradient>
        </defs>
        <path
          d="M75 80V230Q75 258 170 258T265 230V80"
          fill="url(#chem-nmr-metal)"
          stroke="#a5b7a5"
          strokeWidth="2"
        />
        <ellipse cx="170" cy="80" rx="95" ry="28" fill="#e0e7d9" stroke="#a5b7a5" strokeWidth="2" />
        <ellipse cx="170" cy="80" rx="28" ry="12" fill="#9fae9c" />
        <path d="M142 80V240Q170 251 198 240V80" fill="#f3f4e7" fillOpacity=".8" stroke="#b4c2ad" />
        <g transform={`translate(0 ${tubeY})`}>
          <path
            d="M160 14V159Q170 170 180 159V14"
            fill="#ebf4ec"
            fillOpacity=".5"
            stroke="#7fa28e"
            strokeWidth="2"
          />
          <path d="M162 103H178V159Q170 167 162 159Z" fill="#adbaa0" fillOpacity=".65" />
          <rect x="158" y="9" width="24" height="12" rx="4" fill="#9f9b83" />
        </g>
        <g stroke="#b49a6c" strokeWidth="3" fill="none">
          <path d="M143 162Q137 167 143 172V211Q137 219 143 224M197 162Q203 167 197 172V211Q203 219 197 224M143 162Q170 155 197 162M143 224Q170 231 197 224" />
          <path d="M143 224L118 246H46M197 224L222 246H290" />
        </g>
        <path d="M118 220V130l-5 9M118 130l5 9" stroke="#799b8c" strokeWidth="2" fill="none" />
        <text x="104" y="180" textAnchor="end" fontSize="22" fill="#688473">
          B₀
        </text>
        <path
          d="M142 190H198l-7 -5M198 190l-7 5"
          stroke="#b59664"
          strokeWidth="3"
          opacity={rf}
          fill="none"
        />
        <circle cx="46" cy="246" r="5" fill="#b49a6c" />
        <circle cx="290" cy="246" r="5" fill="#b49a6c" />
      </svg>
      <div className="chem-nmr-fid">
        <b>{t('接收信号的实部')}</b>
        <svg viewBox="0 0 330 115" role="img" aria-label={t('由相同氢环境参数计算的衰减信号')}>
          <path d="M20 70H310" stroke="#d3dac5" />
          <path
            d={points}
            fill="none"
            stroke="#7a9570"
            strokeWidth="1.5"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - fraction}
          />
          <text x="20" y="108" fontSize="20" fill="#74866a">
            0
          </text>
          <text x="310" y="108" textAnchor="end" fontSize="20" fill="#74866a">
            80 ms
          </text>
        </svg>
        <span>{t('旋转参考系中的模型信号')}</span>
      </div>
    </div>
  );
}
function Legend({ groups, selected }: { groups: Environment[]; selected: string }) {
  return (
    <div className="chem-nmr-legend">
      {groups.map((g) => (
        <div key={g.id} style={{ opacity: !selected || selected === g.id ? 1 : 0.4 }}>
          <i style={{ background: g.color }} />
          <span>{t(labels[g.id as keyof typeof labels])}</span>
          <b>{g.area.toFixed(g.area % 1 ? 1 : 0)} H</b>
        </div>
      ))}
    </div>
  );
}
export default function ChemNmrHydrogen({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(variant as Mode) ? (variant as Mode) : 'instrument',
    ),
    [molecule, setMolecule] = useState<Molecule>(variant === 'ether' ? 'ether' : 'ethanol'),
    [chosen, setChosen] = useState(''),
    [shift, setShift] = useState(2.2),
    [exchange, setExchange] = useState(0),
    [resolved, setResolved] = useState(false),
    [coupling, setCoupling] = useState(7);
  const m = f.watch ? modes[Math.min(5, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : 1,
    mol =
      m === 'splitting' ? 'ethanol' : f.watch ? (m === 'ether' ? 'ether' : 'ethanol') : molecule;
  const ex = f.watch ? (m === 'exchange' ? ramp(p, 0.6, 0.95) : 0) : exchange,
    oh = f.watch ? (m === 'exchange' ? 2.2 + 2 * ease(ramp(p, 0.05, 0.5)) : 2.2) : shift,
    groups = environments(
      mol,
      oh,
      ex,
      m === 'splitting' || (!f.watch && resolved),
      f.watch ? 7 : coupling,
    ),
    selected = f.watch
      ? m === 'environments'
        ? ['methyl', 'methylene', 'hydroxyl'][Math.min(2, Math.floor(p * 3))]
        : ''
      : chosen;
  return (
    <div className={`chem-nmr ${f.watch ? 'is-watch' : ''}`}>
      <div className="chem-nmr-stage">
        {m === 'instrument' ? (
          <Instrument p={p} />
        ) : m === 'splitting' ? (
          <div className="chem-nmr-zooms">
            {groups.slice(0, mol === 'ethanol' ? 2 : 1).map((g) => (
              <div key={g.id}>
                <b>
                  {t(labels[g.id as keyof typeof labels])} · {g.area} H
                </b>
                <Spectrum groups={[g]} zoom reveal={ease(ramp(p, 0, 0.3))} />
              </div>
            ))}
            <small>
              400 MHz · J = {f.watch ? 7 : coupling} Hz · {t('OH快交换时不计其耦合。')}
            </small>
          </div>
        ) : (
          <>
            <div className="chem-nmr-evidence">
              <MoleculeView m={mol} selected={selected} exchange={ex} />
              <div className="chem-nmr-chart">
                <Spectrum
                  groups={groups}
                  selected={selected}
                  integrate={m === 'integrals'}
                  reveal={m === 'integrals' ? ease(ramp(p, 0, 0.6)) : 1}
                />
                <b>{mol === 'ethanol' ? 'CH₃CH₂OH' : 'CH₃OCH₃'}</b>
              </div>
            </div>
            <Legend groups={groups} selected={selected} />
            {m === 'exchange' && (
              <p className="chem-nmr-exchange">
                {t(
                  ex > 0.9
                    ? '交换后O—D不在常规¹H窗口产生该信号。'
                    : 'OH的位置和可见性随条件而变，不能只凭固定峰位识别。',
                )}
              </p>
            )}
          </>
        )}
      </div>
      {!f.watch && (
        <div className="chem-nmr-controls">
          <Segments
            label={t('观察内容')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m === 'splitting' && (
            <Range
              label={t('模型耦合常数')}
              value={coupling}
              min={3}
              max={12}
              step={0.5}
              unit="Hz"
              onChange={setCoupling}
            />
          )}
          {m !== 'instrument' && m !== 'splitting' && (
            <>
              <Segments
                label={t('候选分子')}
                value={molecule}
                options={[
                  { value: 'ethanol', label: t('乙醇') },
                  { value: 'ether', label: t('二甲醚') },
                ]}
                onChange={(v) => {
                  setMolecule(v as Molecule);
                  setChosen('');
                }}
              />
              <Segments
                label={t('跟踪氢环境')}
                value={chosen}
                options={[
                  { value: '', label: t('全部') },
                  ...groups.map((g) => ({
                    value: g.id,
                    label: t(labels[g.id as keyof typeof labels]),
                  })),
                ]}
                onChange={setChosen}
              />
              {mol === 'ethanol' && (
                <>
                  <Range
                    label={t('OH模型化学位移')}
                    value={shift}
                    min={0.5}
                    max={5.2}
                    step={0.05}
                    unit="ppm"
                    onChange={setShift}
                  />
                  <Range
                    label={t('OH氢氘交换比例')}
                    value={exchange}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setExchange}
                  />
                </>
              )}
              <Segments
                label={t('谱线分辨')}
                value={resolved ? 'high' : 'grouped'}
                options={[
                  { value: 'grouped', label: t('先看信号组') },
                  { value: 'high', label: t('显示一阶耦合') },
                ]}
                onChange={(v) => setResolved(v === 'high')}
              />
            </>
          )}
        </div>
      )}
      <small className="chem-nmr-note">
        {t('合成教学谱，非实测；化学位移、线宽和耦合条件均为说明性预设。')}
      </small>
    </div>
  );
}
