import { useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useSignalWidth, signalPath } from '../lab/SignalFigure';
import {
  radarApparentRange,
  radarDelay,
  radarEcho,
  radarLimits,
  radarPulseSegments,
  radarShot,
  RADAR_DEFAULT,
} from '../../models/radar-ranging';
import '../../styles/signal-studies.css';
export default function RadarRanging() {
  const d = useShowcase(),
    { host, width: w } = useSignalWidth(),
    [manual, setManual] = useState(RADAR_DEFAULT),
    shot = radarShot(d.chapter, d.chapterProgress),
    s = d.watch ? shot.input : manual,
    c = d.watch ? shot.view : 2,
    clock = d.watch ? shot.time : radarDelay(s.range),
    limits = radarLimits(s.pulse, s.pri),
    targets = [s.range, ...(s.second === null ? [] : [s.second])],
    timeEnd = Math.max(
      12e-6,
      Math.ceil((radarDelay(Math.max(...targets)) + s.pulse) / 2e-6) * 2e-6,
    ),
    x = (r: number) => 26 + (r / 1800) * (w - 52),
    tx = (sec: number) => 26 + (sec / timeEnd) * (w - 52);
  return (
    <div className="signal-study radar-study" ref={host}>
      <div className="signal-head">
        <span>{t('脉冲往返 · 光速传播')}</span>
        <strong>
          {(radarDelay(s.range) * 1e6).toFixed(2)} μs → {s.range.toFixed(0)} m
        </strong>
      </div>
      <div className="signal-legend" style={{ paddingTop: 0 }}>
        {targets.map((range, i) => (
          <span key={i}>
            <i style={{ background: i ? '#eda891' : '#d9e8e7' }} />
            {t('目标距离')} {i + 1}: {range.toFixed(0)} m
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} 160`} role="img" aria-label={t('脉冲雷达往返路径与回波计时')}>
        <text x="26" y="20">
          {t('去程')}
        </text>
        <text x="26" y="152">
          {t('回程')}
        </text>
        <path
          d={`M26 55H${x(Math.max(...targets))}V112H26`}
          stroke="#7895a6"
          strokeWidth="1.5"
          fill="none"
          opacity=".5"
        />
        {targets.map((range, i) => (
          <path
            key={i}
            d={`M${x(range)} 42V125`}
            stroke={i ? '#eda891' : '#d9e8e7'}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
        {radarPulseSegments(s.range, clock, s.pulse).map((pulse, i) => (
          <path
            key={i}
            d={`M${x(pulse.a)} ${pulse.returning ? 112 : 55}H${x(pulse.b)}`}
            stroke={pulse.returning ? '#eda891' : '#9bd5e4'}
            strokeWidth="9"
            strokeLinecap="round"
          />
        ))}
        <circle cx="26" cy="83" r="12" fill="#284658" stroke="#9bd5e4" />
      </svg>
      <p className="signal-note">{t('传播已慢放')}</p>
      <p className="signal-note">{t(c === 7 ? '前一次发射的回波' : '接收包络')}</p>
      <svg
        viewBox={`0 0 ${w} 140`}
        role="img"
        aria-label={t(c === 7 ? '前一次发射的回波' : '接收包络')}
      >
        <g transform="translate(0 -220)">
          {c === 6 && (
            <rect
              x={tx(0)}
              y="246"
              width={tx(s.pulse) - tx(0)}
              height="70"
              rx="5"
              fill="#eda891"
              opacity=".15"
            />
          )}
          <path d={`M26 313H${w - 26}`} stroke="#7a95a5" opacity=".5" />
          {c === 6 && (
            <path
              d={signalPath(
                (v) => radarEcho(v, s, false),
                tx,
                (v) => 313 - v * 46,
                timeEnd,
                1201,
              )}
              stroke="#eda891"
              opacity=".55"
              fill="none"
              strokeDasharray="4 4"
            />
          )}
          <path
            d={signalPath(
              (v) => radarEcho(v, s),
              tx,
              (v) => 313 - v * 46,
              timeEnd,
              1201,
            )}
            stroke="#f2d89c"
            strokeWidth="2.5"
            fill="none"
          />
          <path d={`M${tx(clock)} 243V321`} stroke="#9bd5e4" strokeWidth="1.5" />
          {[0, 1, 2, 3].map((i) => {
            const v = (i * timeEnd * 1e6) / 3;
            return (
              <text
                key={i}
                x={tx(v * 1e-6)}
                y="344"
                textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}
              >
                {Math.abs(v - Math.round(v)) < 1e-8 ? Math.round(v) : v.toFixed(1)}
                {i === 3 ? ' μs' : ''}
              </text>
            );
          })}
          {c === 7 && (
            <>
              <path d={`M${tx(s.pri)} 244V320`} stroke="#eda891" strokeDasharray="4 4" />
              <path
                d={`M${tx(s.pri)} 251H${tx(radarDelay(s.range))}`}
                stroke="#eda891"
                strokeWidth="3"
              />
            </>
          )}
        </g>
      </svg>
      <div className="signal-equation">
        {c === 7
          ? `${t('表观距离')} ${radarApparentRange(s.range, s.pri).toFixed(0)} m`
          : c === 4 || c === 5
            ? `ΔR ≈ cτ / 2 = ${limits.resolution.toFixed(0)} m`
            : 'R = cΔt / 2'}
      </div>
      {!d.watch && (
        <>
          <div className="signal-explore">
            <Range
              label={t('目标距离')}
              value={s.range}
              min={75}
              max={1600}
              step={25}
              unit="m"
              onChange={(range) =>
                setManual((m) => ({ ...m, range, second: m.second === null ? null : range + 90 }))
              }
            />
            <Range
              label={t('脉冲宽度')}
              value={s.pulse * 1e6}
              min={0.2}
              max={1.5}
              step={0.1}
              unit="μs"
              onChange={(v) => setManual((m) => ({ ...m, pulse: v * 1e-6 }))}
            />
            <Range
              label={t('重复间隔')}
              value={s.pri * 1e6}
              min={5}
              max={12}
              step={1}
              unit="μs"
              onChange={(v) => setManual((m) => ({ ...m, pri: v * 1e-6 }))}
            />
          </div>
          <div className="signal-buttons">
            <button
              aria-pressed={s.second !== null}
              onClick={() =>
                setManual((m) => ({ ...m, second: m.second === null ? m.range + 90 : null }))
              }
            >
              {t('加入相距九十米的目标')}
            </button>
            <button onClick={() => setManual(RADAR_DEFAULT)}>{t('恢复单目标')}</button>
          </div>
        </>
      )}
      <details>
        <summary>{t('范围、分辨率与接收遮挡')}</summary>
        <p>
          {t(
            '未调制矩形脉冲，理想一维静止目标；只计算传播延迟与归一化包络，不模拟天线增益、载波相位、散射强度、噪声或检测器。约 cτ/2 是这种波形的距离分辨尺度，不是测距精度。发射期间接收器关闭；重复间隔限制无歧义距离。',
          )}
        </p>
      </details>
    </div>
  );
}
