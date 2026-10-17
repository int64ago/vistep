import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { diodeJunction, junctionDefaults, junctionShot } from '../../models/diode-junction';
import '../../styles/diode-junction.css';
const formatCurrent = (a: number) =>
  Math.abs(a) < 1e-9
    ? `${(a * 1e12).toFixed(1)} pA`
    : Math.abs(a) < 1e-3
      ? `${(a * 1e6).toFixed(1)} µA`
      : `${(a * 1e3).toFixed(2)} mA`;
export default function DiodeJunction() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [bias, setBias] = useState(0),
    [load, setLoad] = useState('0'),
    [view, setView] = useState('potential'),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? junctionShot(c, film.chapterProgress)
      : diodeJunction({
          ...junctionDefaults(),
          applied: Math.min(bias, load === '0' ? 0.6 : 1),
          seriesResistance: Number(load),
        }),
    graph = film.watch
      ? c === 1
        ? 'charge'
        : c === 3
          ? 'current'
          : c === 5
            ? 'load'
            : 'potential'
      : load === '100' && view === 'current'
        ? 'load'
        : view,
    scale = 4e8,
    left = 220 - s.pWidth * scale,
    right = 220 + s.nWidth * scale,
    vMax = c === 4 || (!film.watch && s.applied < 0) ? 2 : 0.8,
    points = Array.from({ length: 161 }, (_, j) => {
      const px = 10 + j * 2;
      return `${px},${92 - (s.potential((px - 220) / scale) / vMax) * 65}`;
    }).join(' '),
    currentPath = Array.from({ length: 101 }, (_, j) => {
      const v = 0.3 + (0.3 * j) / 100,
        q = diodeJunction({ ...junctionDefaults(), applied: v });
      return `${92 + j * 2.26},${91 - ((Math.log10(q.current) + 7) / 5.2) * 65}`;
    }).join(' '),
    ion = (x: number, y: number, positive: boolean, key: string) => (
      <g key={key}>
        <rect
          x={x - 4}
          y={y - 4}
          width="8"
          height="8"
          rx="1"
          fill={positive ? '#c6ac76' : '#89a99b'}
        />
        <path
          d={`M${x - 2.5} ${y}h5${positive ? `M${x} ${y - 2.5}v5` : ''}`}
          stroke="#fffced"
          strokeWidth="1.3"
        />
      </g>
    );
  return (
    <div className="junction-film" data-watch={film.watch}>
      <p className="junction-bias">
        {s.applied === 0
          ? t('热平衡：端电流为零')
          : s.applied > 0
            ? t('正向：p端电势更高')
            : t('反向：p端电势更低')}
      </p>
      <svg
        className="junction-slice"
        viewBox="0 0 340 220"
        role="img"
        aria-label={t('突变PN结的固定离子、耗尽区和电场方向')}
      >
        <defs>
          <linearGradient id={`${id}-p`} x1="0" x2="1">
            <stop stopColor="#e6ebda" />
            <stop offset="1" stopColor="#dce5d1" />
          </linearGradient>
          <linearGradient id={`${id}-n`}>
            <stop stopColor="#e9e4cd" />
            <stop offset="1" stopColor="#efebdb" />
          </linearGradient>
        </defs>
        <rect x="10" y="35" width="210" height="105" rx="8" fill={`url(#${id}-p)`} />
        <rect x="220" y="35" width="110" height="105" rx="8" fill={`url(#${id}-n)`} />
        <rect x={left} y="35" width={right - left} height="105" fill="#f6f3e4" stroke="#c6cbb1" />
        <path d="M220 30V145" stroke="#bfc5ac" strokeDasharray="2 4" />
        <text x="25" y="23">
          p
        </text>
        <text x="315" y="23" textAnchor="end">
          n
        </text>
        <text x="170" y="23" textAnchor="middle">
          {t('耗尽区')}
        </text>
        {[
          ...Array.from({ length: 9 }, (_, j) => 208 - 24 * j),
          ...Array.from({ length: 13 }, (_, j) => 224 + 8 * j),
        ].flatMap((px) =>
          [55, 87, 119].map((py) => {
            const depleted = px > left && px < right;
            return (
              <g key={`${px}-${py}`}>
                <g opacity={depleted ? 1 : 0.45}>{ion(px, py, px > 220, 'fixed')}</g>
                {!depleted && (
                  <circle
                    cx={px}
                    cy={py + 11}
                    r="3"
                    fill={px > 220 ? '#88a99c' : '#faf7e9'}
                    stroke={px > 220 ? '#88a99c' : '#ad9868'}
                    strokeWidth="1.2"
                  />
                )}
              </g>
            );
          }),
        )}
        <path
          d={`M${right - 5} 154H${left + 5}l6 -4m-6 4 6 4`}
          fill="none"
          stroke="#8a9b78"
          strokeWidth="2"
        />
        <text x={(left + right) / 2} y="178" textAnchor="middle">
          E
        </text>
        <path d={`M${left} 185v8m0 -4H${right}m0 -4v8`} stroke="#b9c3a9" fill="none" />
        <text x="18" y="215">
          x
        </text>
        <text x="328" y="215" textAnchor="end">
          {(s.width * 1e9).toFixed(0)} nm
        </text>
      </svg>
      <p className="junction-key">
        ○ {t('可动载流子')} · ▪ {t('固定离子')}
      </p>
      {graph === 'load' ? (
        <div className="junction-load">
          <svg viewBox="0 0 340 57" aria-label={t('串联电阻与PN结共同分配外加电压')} role="img">
            <path
              d="M15 35H52l6 -7 10 14 10 -14 10 14 10 -14 10 14 6 -7H205M267 35H325"
              stroke="#a38e62"
              strokeWidth="2"
              fill="none"
            />
            <rect x="205" y="21" width="62" height="28" rx="4" fill="#e7e9d4" stroke="#a7b595" />
            <text x="236" y="41" textAnchor="middle">
              PN
            </text>
            <text x="85" y="19" textAnchor="middle">
              100 Ω
            </text>
          </svg>
          <div className="junction-voltage-bar">
            <i style={{ width: `${Math.abs(s.junctionVoltage) * 100}%`, background: '#86a99b' }} />
            <i style={{ width: `${Math.abs(s.resistorVoltage) * 100}%`, background: '#b7a16f' }} />
          </div>
          <p>
            Vj {s.junctionVoltage.toFixed(2)} + IR{' '}
            {(Math.abs(s.resistorVoltage) < 1e-8 ? 0 : s.resistorVoltage).toFixed(2)} ={' '}
            {s.applied.toFixed(2)} V
          </p>
        </div>
      ) : (
        <svg
          className="junction-graph"
          viewBox="0 0 340 120"
          role="img"
          aria-label={
            graph === 'charge'
              ? t('空间电荷密度，正负面积相等')
              : graph === 'current'
                ? t('正向电流的对数坐标曲线')
                : t('沿结横坐标的连续电势剖面')
          }
        >
          {graph === 'charge' ? (
            <>
              <path d="M10 65H330" stroke="#c0c9b0" />
              <path d={`M${left} 65V83H220V65Z`} fill="#a7c0a5" />
              <path d={`M220 65V11H${right}V65Z`} fill="#d0bd88" />
              <text x="14" y="26">
                ρ / (qNₐ)
              </text>
              <text x="322" y="26" textAnchor="end">
                +3
              </text>
              <text x="322" y="73" textAnchor="end">
                0
              </text>
              <text x={(left + 220) / 2} y="107" textAnchor="middle">
                −1
              </text>
            </>
          ) : graph === 'current' ? (
            <>
              <path d="M92 20V91H318M87 28.5H318M87 91H92" fill="none" stroke="#bdc8b0" />
              <polyline points={currentPath} fill="none" stroke="#a98f60" strokeWidth="3" />
              {s.junctionVoltage >= 0.3 && s.junctionVoltage <= 0.6 && (
                <circle
                  cx={92 + ((s.junctionVoltage - 0.3) / 0.3) * 226}
                  cy={91 - ((Math.log10(s.current) + 7) / 5.2) * 65}
                  r="4"
                  fill="#a98f60"
                />
              )}
              <text x="83" y="35" textAnchor="end">
                10 mA
              </text>
              <text x="83" y="98" textAnchor="end">
                0.1 µA
              </text>
              <text x="205" y="18" textAnchor="middle">
                log I
              </text>
              <text x="92" y="115">
                0.3
              </text>
              <text x="318" y="115" textAnchor="end">
                0.6 V
              </text>
            </>
          ) : (
            <>
              <path d="M10 92H330" stroke="#c1cbb4" />
              <path d={`M${left} 25V92M${right} 25V92`} stroke="#d0d7bf" strokeDasharray="3 4" />
              <polyline points={points} fill="none" stroke="#a48c60" strokeWidth="3" />
              <text x="14" y="21">
                φ (V)
              </text>
              <text x="14" y="84">
                0
              </text>
              <text x="326" y="21" textAnchor="end">
                Δφ {s.barrier.toFixed(2)} V
              </text>
              <text x="220" y="115" textAnchor="middle">
                x = 0
              </text>
            </>
          )}
        </svg>
      )}
      <div className="junction-readings">
        <span>
          Vj (V)<b>{s.junctionVoltage.toFixed(2)}</b>
        </span>
        <span>
          I<b>{formatCurrent(s.current)}</b>
        </span>
      </div>
      {!film.watch && (
        <div className="junction-controls">
          <Segments
            label={t('串联电阻')}
            value={load}
            options={[
              { value: '0', label: t('无串联电阻') },
              { value: '100', label: '100 Ω' },
            ]}
            onChange={setLoad}
          />
          <Range
            label={t('外加电压')}
            value={Math.min(bias, load === '0' ? 0.6 : 1)}
            min={-1}
            max={load === '0' ? 0.6 : 1}
            step={0.01}
            unit="V"
            onChange={setBias}
          />
          <Segments
            label={t('观察剖面')}
            value={view}
            options={[
              { value: 'potential', label: t('电势') },
              { value: 'charge', label: t('空间电荷') },
              { value: 'current', label: load === '100' ? t('电压分配') : 'I–V' },
            ]}
            onChange={setView}
          />
        </div>
      )}
      <details className="junction-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '300 K硅突变结；p侧掺杂为n侧的三分之一。耗尽近似与理想扩散电流，饱和电流1 pA。忽略击穿、高注入、自热与开关储存效应；符号只区分电荷类型，未模拟单个载流子轨迹。',
          )}
        </p>
      </details>
    </div>
  );
}
