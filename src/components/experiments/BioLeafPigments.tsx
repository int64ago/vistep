import { useId, useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  chromatography,
  filterTracer,
  partitionTracer,
  pigmentBands,
  pigmentTransmission,
  spectralColor,
  pigmentDirector,
  originImmersion,
  type PigmentKey,
} from '../../models/bio-leaf-pigments';
import '../../styles/bio-leaf-pigments.css';
type Mode = 'extract' | 'origin' | 'separate' | 'spectrum' | 'compare';
const modes: Mode[] = ['extract', 'origin', 'separate', 'spectrum', 'compare'];
const names = ['绿色混合物', '共同起点', '分配与迁移', '吸收与透过', '光谱与预测'];
function Marker({
  x,
  y,
  kind = 0,
  label,
  opacity = 1,
}: {
  x: number;
  y: number;
  kind?: number;
  label?: string;
  opacity?: number;
}) {
  const color = pigmentBands[kind % 4].color;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      {kind % 2 ? <path d="M0-7L7 0L0 7L-7 0Z" fill={color} /> : <circle r="7" fill={color} />}
      {label && (
        <text x="11" y="7">
          {label}
        </text>
      )}
    </g>
  );
}
function Extract({ shot, p, uid }: { shot: string; p: number; uid: string }) {
  return (
    <div className="blp11-visual">
      <svg viewBox="0 0 300 265" role="img" aria-label={t('跟踪色素从叶绿体到仍然混合的滤液')}>
        <defs>
          <linearGradient id={`${uid}-green`} x2="0" y2="1">
            <stop stopColor="#91a96b" />
            <stop offset="1" stopColor="#4b8067" />
          </linearGradient>
        </defs>
        {shot === 'sample' ? (
          <>
            <path
              d="M80 30V225Q80 243 100 243H200Q220 243 220 225V30"
              fill="#e5ebe0"
              stroke="#9eafa0"
              strokeWidth="2"
            />
            <path
              d="M83 116H217V224Q217 239 199 239H101Q83 239 83 224Z"
              fill={`url(#${uid}-green)`}
            />
            <ellipse cx="150" cy="116" rx="67" ry="9" fill="#a4b982" />
            <text x="150" y="72" textAnchor="middle">
              {t('一种可见颜色')}
            </text>
          </>
        ) : shot === 'release' ? (
          <>
            <rect x="17" y="20" width="266" height="223" rx="26" fill="#eff0df" />
            <g opacity={1 - p * 0.8}>
              <ellipse
                cx="150"
                cy="131"
                rx="111"
                ry="78"
                fill="#e0e7c9"
                stroke="#839b70"
                strokeWidth="3"
              />
              <ellipse cx="150" cy="131" rx="105" ry="71" fill="none" stroke="#9eaf86" />
              {[80, 142, 204].map((x) => (
                <g key={x}>
                  {[109, 122, 135, 148].map((y) => (
                    <rect
                      key={y}
                      x={x - 22}
                      y={y}
                      width="44"
                      height="8"
                      rx="4"
                      fill="#8ca56c"
                      stroke="#738f58"
                    />
                  ))}
                  <path d={`M${x + 22} 126h18`} stroke="#8da471" fill="none" />
                </g>
              ))}
            </g>
            {Array.from({ length: 8 }, (_, i) => {
              const sx = 64 + (i % 4) * 54,
                sy = 105 + Math.floor(i / 4) * 42,
                ex = 50 + (i % 4) * 61,
                ey = 63 + Math.floor(i / 4) * 133;
              return (
                <Marker
                  key={i}
                  x={sx + (ex - sx) * p}
                  y={sy + (ey - sy) * p}
                  kind={i}
                  label={i === 2 ? 'A' : i === 3 ? 'B' : undefined}
                />
              );
            })}
            <text x="150" y="250" textAnchor="middle">
              {t(p < 0.5 ? '叶绿体内部' : '溶剂中的类型标记')}
            </text>
          </>
        ) : (
          <>
            <path
              d="M39 65H261L171 158V199H129V158Z"
              fill="#dce5d5"
              fillOpacity=".55"
              stroke="#91a38a"
              strokeWidth="2"
            />
            <path d="M51 70H249L168 148H132Z" fill="#eee9d5" stroke="#c3bda3" />
            <path d="M91 195V242H209V195" fill="#e3e9dc" stroke="#97a88b" strokeWidth="2" />
            <path d="M94 216H206V239H94Z" fill={`url(#${uid}-green)`} />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${77 + i * 42} 89l12-7 10 9-14 8Z`} fill="#858f68" />
            ))}
            {Array.from({ length: 8 }, (_, i) => {
              const point = filterTracer(i, p);
              return <Marker key={point.id} kind={i} x={point.x} y={point.y} />;
            })}
            <text x="150" y="34" textAnchor="middle">
              {t('残渣留下，色素仍混合')}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
function Paper({
  progress,
  immersed,
  width,
  coelute,
  uid,
}: {
  progress: number;
  immersed: boolean;
  width: number;
  coelute: boolean;
  uid: string;
}) {
  const wash = originImmersion(progress, width),
    s = immersed ? wash : chromatography(progress, false, width, coelute);
  return (
    <div className="blp11-paper">
      <svg
        viewBox="0 0 300 270"
        role="img"
        aria-label={t('色带由同一分配模型计算，液面与起点分别可见')}
      >
        <defs>
          <linearGradient id={`${uid}-paper`}>
            <stop stopColor="#f4efd9" />
            <stop offset="1" stopColor="#e6dfc1" />
          </linearGradient>
          <clipPath id={`${uid}-paper-clip`}>
            <rect x="98" y="35" width="72" height="211" />
          </clipPath>
          {s.bands.map((b) => (
            <linearGradient
              key={b.id}
              id={`${uid}-density-${b.id}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1="245"
              y2="25"
            >
              {Array.from({ length: 56 }, (_, i) => {
                const cell = i - 5,
                  mass = b.distribution.bins.reduce(
                    (sum, v) => sum + v.mass * Math.max(0, 1 - Math.abs(v.cell - cell)),
                    0,
                  );
                return (
                  <stop
                    key={i}
                    offset={i / 55}
                    stopColor={b.color}
                    stopOpacity={Math.min(1, mass * 8) * b.retained}
                  />
                );
              })}
            </linearGradient>
          ))}
        </defs>
        <path
          d="M54 26V244Q54 262 72 262H218Q236 262 236 244V26"
          fill="#d8e3d7"
          fillOpacity=".35"
          stroke="#95a792"
          strokeWidth="2"
        />
        <rect x="48" y="17" width="194" height="11" rx="5" fill="#b8b79d" />
        <path d="M96 33H172V244L165 252H103L96 244Z" fill={`url(#${uid}-paper)`} stroke="#cec8ad" />
        <path
          d={`M57 ${immersed ? wash.liquidY : 240}H233V244Q233 259 216 259H74Q57 259 57 244Z`}
          fill={immersed ? '#a0b587' : '#b9cbb5'}
          fillOpacity=".65"
        />
        <g clipPath={`url(#${uid}-paper-clip)`}>
          {s.bands.map((b) => (
            <rect
              key={b.id}
              data-pigment={b.id}
              data-paper-mass={b.paperMass}
              data-reservoir-mass={b.reservoirMass}
              x="100"
              y="35"
              width="68"
              height="211"
              fill={`url(#${uid}-density-${b.id})`}
            />
          ))}
        </g>
        <path d={`M97 ${225 - s.front}H171`} stroke="#7f9276" strokeDasharray="4 4" />
        <path d="M88 225H180" stroke="#7d806b" strokeDasharray="2 4" />
        <text x="188" y="230">
          {t('原点')}
        </text>
        <text x="10" y={Math.max(48, 230 - s.front)}>
          {t('前沿')}
        </text>
        {immersed &&
          [0, 1, 2, 3].map((i) => (
            <Marker
              key={i}
              x={123 + i * 7 + (78 + i * 43 - 123 - i * 7) * wash.reservoir}
              y={225 + (19 + (i % 2) * 7) * wash.reservoir}
              kind={i}
              opacity={0.6}
            />
          ))}
      </svg>
      <div className="blp11-legend">
        {pigmentBands.map((b) => (
          <span key={b.id}>
            <i style={{ background: b.color }} />
            {t(b.name)}
          </span>
        ))}
      </div>
    </div>
  );
}
function OriginWidths() {
  const uid = useId().replace(/:/g, '');
  return (
    <div className="blp11-widths">
      <svg viewBox="0 0 300 270" role="img" aria-label={t('同一迁移条件下比较窄起点和宽起点')}>
        {[1, 8].map((width, index) => {
          const s = chromatography(0.65, false, width),
            x = 42 + index * 149;
          return (
            <g key={width}>
              <text x={x + 34} y="25" textAnchor="middle">
                {t(index ? '宽区域' : '细线')}
              </text>
              <rect x={x - 4} y="42" width="76" height="197" rx="5" fill="#eee8d2" />
              <defs>
                {s.bands.map((b) => (
                  <linearGradient
                    key={b.id}
                    id={`${uid}-${width}-${b.id}`}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    x2="0"
                    y1="239"
                    y2="19"
                  >
                    {Array.from({ length: 56 }, (_, i) => {
                      const mass = b.distribution.bins.reduce(
                        (sum, v) => sum + v.mass * Math.max(0, 1 - Math.abs(v.cell - (i - 5))),
                        0,
                      );
                      return (
                        <stop
                          key={i}
                          offset={i / 55}
                          stopColor={b.color}
                          stopOpacity={Math.min(1, mass * 8)}
                        />
                      );
                    })}
                  </linearGradient>
                ))}
              </defs>
              {s.bands.map((b) => (
                <rect
                  key={b.id}
                  x={x}
                  y="42"
                  width="68"
                  height="197"
                  fill={`url(#${uid}-${width}-${b.id})`}
                />
              ))}
              <path d={`M${x - 9} 219h86`} stroke="#8b9479" strokeDasharray="3 4" />
            </g>
          );
        })}
        <text x="150" y="264" textAnchor="middle">
          {t('其余条件相同')}
        </text>
      </svg>
    </div>
  );
}
function Exchange({ progress, same }: { progress: number; same: boolean }) {
  const steps = 8 * progress,
    fs = [0.45, same ? 0.45 : 0.26],
    states = fs.map((f, i) => partitionTracer(i ? 21 : 15, f, steps));
  return (
    <div className="blp11-exchange">
      <svg viewBox="0 0 300 245" role="img" aria-label={t('同一标记在流动相和固定环境间反复交换')}>
        <rect x="8" y="34" width="284" height="77" rx="19" fill="#dbe8e2" />
        <rect x="8" y="125" width="284" height="72" rx="19" fill="#ebe4ce" />
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${17 + i * 28} 140q-9 10 3 18t-2 22`} stroke="#d3c9a7" fill="none" />
        ))}
        <path d="M192 20H279m-8-6 8 6-8 6" stroke="#829f97" fill="none" strokeWidth="2" />
        <text x="13" y="23">
          {t('流动相')}
        </text>
        <text x="13" y="222">
          {t('固定环境')}
        </text>
        {states.map((s, i) => (
          <g key={s.id} data-tracer-id={s.id} data-position={s.position} data-phase={s.phase}>
            <Marker
              x={19 + s.position * 29}
              y={162 - s.phaseBlend * 89 + (i ? 7 : -7)}
              kind={i ? 3 : 2}
              label={i ? 'B' : 'A'}
            />
          </g>
        ))}
      </svg>
      <div className="blp11-partition">
        <span>
          <b>A</b> {Math.round(fs[0] * 100)}%
        </span>
        <span>{t('分配到流动相')}</span>
        <span>
          <b>B</b> {Math.round(fs[1] * 100)}%
        </span>
      </div>
    </div>
  );
}
function Spectrum({
  shot,
  nm,
  keyName,
  c,
  progress,
  compare,
}: {
  shot: string;
  nm: number;
  keyName: PigmentKey;
  c: number;
  progress: number;
  compare: boolean;
}) {
  const double = compare && shot !== 'curves',
    sample = pigmentTransmission(keyName, nm, c),
    second = pigmentTransmission(keyName, nm, c * 2),
    x = 34 + (nm - 400) * 0.78;
  const curve = (key: PigmentKey) =>
    Array.from(
      { length: 61 },
      (_, j) =>
        `${j ? 'L' : 'M'}${34 + j * 3.9} ${222 - (shot === 'blank' ? 0 : pigmentTransmission(key, 400 + j * 5, c).absorbed) * 83}`,
    ).join(' ');
  return (
    <div className="blp11-spectrum">
      <svg
        viewBox="0 0 300 273"
        role="img"
        data-transmission={sample.transmitted}
        data-double-transmission={second.transmitted}
        aria-label={t('同一波长的空白、样品和透过比例；下方为实测系数计算的曲线')}
      >
        {shot === 'remaining' ? (
          <>
            {[430, 550, 660].map((wave, i) => {
              const light = pigmentTransmission(keyName, wave, c),
                y = 58 + i * 72;
              return (
                <g key={wave}>
                  <text x="12" y={y - 17}>
                    {wave} nm
                  </text>
                  <path d={`M12 ${y}H115`} stroke={spectralColor(wave)} strokeWidth="11" />
                  <path
                    d={`M165 ${y}H287`}
                    stroke={spectralColor(wave)}
                    strokeWidth="11"
                    opacity={light.transmitted}
                  />
                  <text x="287" y={y + 27} textAnchor="end">
                    {(light.transmitted * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}
            <rect
              x="119"
              y="30"
              width="42"
              height="194"
              rx="7"
              fill="#9fb58a"
              fillOpacity=".55"
              stroke="#91a582"
            />
            <text x="150" y="264" textAnchor="middle">
              {t('绿色区域透过较多')}
            </text>
          </>
        ) : !double ? (
          <>
            <text x="12" y="22">
              {shot === 'blank' ? t('空白溶剂') : t('同一波长')}
            </text>
            <text x="288" y="22" textAnchor="end">
              {Math.round(nm)} nm
            </text>
            <path d="M12 55H94" stroke={spectralColor(nm)} strokeWidth="12" />
            <rect
              x="96"
              y="33"
              width="49"
              height="45"
              rx="5"
              fill={shot === 'blank' ? '#e6ece5' : '#a6bb8d'}
              fillOpacity=".65"
              stroke="#9cad95"
            />
            <path
              d="M147 55H286"
              stroke={spectralColor(nm)}
              strokeWidth="12"
              opacity={shot === 'blank' ? 1 : sample.transmitted}
            />
            <text x="12" y="106">
              I₀ = 100%
            </text>
            <text x="288" y="106" textAnchor="end">
              I = {((shot === 'blank' ? 1 : sample.transmitted) * 100).toFixed(1)}%
            </text>
            <path d="M34 136V222H269" fill="none" stroke="#a4b197" />
            <text x="34" y="130">
              {t('吸收比例')}
            </text>
            <text x="7" y="151">
              1
            </text>
            <text x="7" y="225">
              0
            </text>
            {(compare ? (['a', 'b', 'carotene'] as const) : [keyName]).map((key, i) => (
              <path
                key={key}
                d={curve(key)}
                fill="none"
                stroke={key === 'a' ? '#4b8c7a' : key === 'b' ? '#96a44d' : '#c4913c'}
                strokeWidth="2.8"
                strokeDasharray={i === 1 ? '7 4' : i === 2 ? '2 4' : undefined}
              />
            ))}
            <path d={`M${x} 137V222`} stroke="#aab69b" strokeDasharray="3 4" />
            <circle
              cx={x}
              cy={222 - (shot === 'blank' ? 0 : sample.absorbed) * 83}
              r="4"
              fill="#9b7854"
            />
            <text x="34" y="251">
              400
            </text>
            <text x="268" y="251" textAnchor="end">
              700
            </text>
            <text x="152" y="263" textAnchor="middle">
              nm
            </text>
          </>
        ) : (
          <>
            <text x="150" y="25" textAnchor="middle">
              {t('同一种色素，同一波长')}
            </text>
            <path d="M18 65H280" stroke="#dde3d6" strokeWidth="13" />
            <path d={`M18 65H${18 + 262 * sample.transmitted}`} stroke="#85a375" strokeWidth="13" />
            <rect x="103" y="43" width="30" height="44" rx="4" fill="#b0c09a" stroke="#91a182" />
            <text x="18" y="117">
              c
            </text>
            <text x="282" y="117" textAnchor="end">
              T = {(sample.transmitted * 100).toFixed(1)}%
            </text>
            <path d="M18 163H280" stroke="#dde3d6" strokeWidth="13" />
            <path
              d={`M18 163H${18 + 262 * pigmentTransmission(keyName, nm, c * (1 + progress)).transmitted}`}
              stroke="#648e6a"
              strokeWidth="13"
            />
            <rect x="103" y="141" width="30" height="44" rx="4" fill="#b0c09a" stroke="#91a182" />
            <rect
              x="141"
              y="141"
              width="30"
              height="44"
              rx="4"
              fill="#b0c09a"
              stroke="#91a182"
              opacity={progress}
            />
            <text x="18" y="216">
              {progress < 1 ? 'c → 2c' : '2c'}
            </text>
            <text x="282" y="216" textAnchor="end">
              {shot === 'reveal' ? `${(second.transmitted * 100).toFixed(1)}%` : t('先预测')}
            </text>
            <text x="150" y="260" textAnchor="middle">
              {shot === 'reveal' ? 'T × T = T²' : t('等效为两份吸收作用')}
            </text>
          </>
        )}
      </svg>
      {compare && shot === 'curves' ? (
        <div className="blp11-legend blp11-spectra-legend">
          {pigmentBands
            .filter((b) => b.id !== 'xanthophyll')
            .map((b) => (
              <span key={b.id}>
                <i style={{ background: b.color }} />
                {t(b.id === 'a' ? '叶绿素a谱' : b.id === 'b' ? '叶绿素b谱' : '胡萝卜素谱')}
              </span>
            ))}
        </div>
      ) : (
        <p className="blp11-short">
          {double ? `${c} µM → ${2 * c} µM · 1 cm · ${nm} nm` : `${c} µM · 1 cm`}
        </p>
      )}
    </div>
  );
}
export default function BioLeafPigments() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [chosen, setChosen] = useState<Mode | null>(null),
    [p, setP] = useState(0.7),
    [immersed, setImmersed] = useState(false),
    [width, setWidth] = useState(1),
    [same, setSame] = useState(false),
    [key, setKey] = useState<PigmentKey>('a'),
    [nm, setNm] = useState(550),
    [c, setC] = useState(5),
    [exchangeDetail, setExchangeDetail] = useState(false),
    [doublePrediction, setDoublePrediction] = useState(false);
  const m = f.watch ? modes[Math.min(f.chapter, 4)] : (chosen ?? modes[Math.min(f.chapter, 4)]),
    detail = m === 'compare' ? doublePrediction : exchangeDetail,
    d = pigmentDirector(modes.indexOf(m), f.chapterTime, browserLocale()),
    progress = f.watch ? d.progress : m === 'compare' ? 1 : p,
    shot = f.watch
      ? d.shot
      : m === 'extract'
        ? 'filter'
        : m === 'separate'
          ? detail
            ? 'exchange'
            : same
              ? 'coelute'
              : 'resolved'
          : m === 'origin'
            ? immersed
              ? 'immersed'
              : 'origin'
            : m === 'compare'
              ? detail
                ? 'reveal'
                : 'curves'
              : 'selected',
    activeSame = f.watch ? shot === 'coelute' : same;
  const note =
    shot === 'sample'
      ? '绿色能证明只有一种色素吗？'
      : shot === 'release'
        ? '提取让溶剂接触原有色素'
        : shot === 'filter'
          ? '过滤没有把溶解的色素分开'
          : shot === 'immersed'
            ? '共同起点流失到槽液'
            : shot === 'restore'
              ? '新样品：起点在液面上方'
              : shot === 'width'
                ? '宽起点增加色带重叠'
                : shot === 'exchange'
                  ? '交换累积成迁移差异'
                  : shot === 'coelute'
                    ? '新条件：两类分配相同'
                    : shot === 'bands'
                      ? '色带从同一起点分离'
                      : shot === 'resolved'
                        ? '位置来自分配，不是大小排名'
                        : m === 'origin'
                          ? '同一份样品，从细线出发'
                          : shot === 'remaining'
                            ? '绿色透过较多，吸收并非零'
                            : shot === 'blank'
                              ? '先确定同一波长的参考光'
                              : shot === 'double'
                                ? '第二份作用于剩余光'
                                : shot === 'reveal'
                                  ? '透过率乘起来'
                                  : m === 'compare'
                                    ? '指定溶剂中的实测光谱'
                                    : '比较进入与离开的光';
  return (
    <section className="blp11" data-mode={m} data-shot={shot}>
      <p className="blp11-kicker">{t(note)}</p>
      {m === 'extract' ? (
        <Extract shot={shot} p={progress} uid={uid} />
      ) : m === 'separate' && shot === 'exchange' ? (
        <Exchange progress={progress} same={activeSame} />
      ) : m === 'origin' && shot === 'width' ? (
        <OriginWidths />
      ) : m === 'origin' || m === 'separate' ? (
        <Paper
          progress={
            m === 'origin' && f.watch
              ? shot === 'width'
                ? 0.65
                : shot === 'immersed'
                  ? progress
                  : 0
              : progress
          }
          immersed={f.watch ? shot === 'immersed' : immersed}
          width={f.watch ? (shot === 'width' ? 7 : 1) : width}
          coelute={activeSame}
          uid={uid}
        />
      ) : (
        <Spectrum
          shot={shot}
          nm={f.watch ? d.nm : nm}
          keyName={f.watch ? 'a' : key}
          c={f.watch ? 5 : c}
          progress={progress}
          compare={m === 'compare'}
        />
      )}
      {!f.watch && (
        <div className="blp11-controls">
          <Segments<Mode>
            label={t('观察主题')}
            value={m}
            onChange={setChosen}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          {m === 'spectrum' || m === 'compare' ? (
            <>
              <Segments<PigmentKey>
                label={t('色素样品')}
                value={key}
                onChange={setKey}
                options={(['a', 'b', 'carotene'] as const).map((value) => ({
                  value,
                  label: t(pigmentBands.find((b) => b.id === value)!.name),
                }))}
              />
              <Range label={t('波长')} value={nm} min={400} max={700} unit="nm" onChange={setNm} />
              <Range
                label={t('浓度')}
                value={c}
                min={0}
                max={15}
                step={0.5}
                unit="µM"
                onChange={setC}
              />
              {m === 'compare' && (
                <button
                  type="button"
                  aria-pressed={detail}
                  onClick={() => setDoublePrediction(!detail)}
                >
                  {t(detail ? '返回实测曲线' : '浓度加倍预测')}
                </button>
              )}
            </>
          ) : (
            <>
              <Range label={t('过程位置')} value={p} min={0} max={1} step={0.01} onChange={setP} />
              {m !== 'extract' && (
                <>
                  {!(m === 'separate' && detail) && (
                    <>
                      <Range
                        label={t('初始区域宽度')}
                        value={width}
                        min={1}
                        max={8}
                        onChange={setWidth}
                      />
                      <button
                        type="button"
                        aria-pressed={immersed}
                        onClick={() => setImmersed(!immersed)}
                      >
                        {t(immersed ? '起点浸没' : '起点在液面上方')}
                      </button>
                    </>
                  )}
                  {m === 'separate' && (
                    <>
                      {(!immersed || detail) && (
                        <button type="button" aria-pressed={same} onClick={() => setSame(!same)}>
                          {t(same ? '两类分配相同' : '两类分配不同')}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-pressed={detail}
                        onClick={() => setExchangeDetail(!detail)}
                      >
                        {t(detail ? '回到整张纸' : '查看交换模型')}
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          )}
          <p>
            {t(
              m === 'spectrum' || m === 'compare'
                ? '吸收使用实测系数；忽略散射、反射与荧光。'
                : '分配与类型标记是教学模型，不是微观录像或标准迁移系数。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
