import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  rainMeter,
  rainPaper,
  rainClassification,
  rainDirector,
  rainMeanExample,
  syntheticRainRecords,
  RAIN_REFERENCE_PH,
} from '../../models/chem-rainwater-ph';
import '../../styles/chem-rainwater-ph.css';
export default function ChemRainwaterPh() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('measurement'),
    [ph, setPH] = useState(5.55),
    [cal, setCal] = useState(true),
    [fraction, setFraction] = useState(0.1);
  const d = film.watch
    ? rainDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'average' ? 4 : view === 'records' ? 3 : 2,
        progress: 1,
        samplePH: ph,
        calibrated: cal,
        visibleEvents: 7,
        acidicFraction: fraction,
      };
  const meter = rainMeter(d.samplePH, d.calibrated),
    paper = rainPaper(d.samplePH),
    agg = rainMeanExample(d.acidicFraction),
    range = [meter.display - meter.uncertainty, meter.display + meter.uncertainty],
    result = rainClassification(range[0], range[1]);
  const names = [
    ['直接雨水与参照水', 'Direct rain and reference water'],
    ['同一样品，两种读数', 'One sample, two readings'],
    ['读数的边界', 'A reading has limits'],
    ['连续记录，保留缺测', 'Keep a record, retain gaps'],
    ['平均的是什么', 'What is being averaged?'],
  ];
  const xPH = (x: number) => 32 + (x - 4) * 85;
  return (
    <section className="chem-rainwater-ph">
      <div className="chem-rain-heading">{say(names[d.chapter][0], names[d.chapter][1])}</div>
      {d.chapter === 0 ? (
        <>
          <svg
            className="chem-rain-apparatus"
            viewBox="0 0 320 220"
            role="img"
            aria-label={say(
              '雨滴直接落入采样杯，与外观相同的参照水分开',
              'Rain falls directly into a sample cup, separate from reference water with the same appearance',
            )}
          >
            <path d="M18 25Q20 8 39 12Q52-8 74 8Q92 5 96 25Z" fill="#c9d8d455" />
            {Array.from({ length: 8 }, (_, i) => (
              <path
                key={i}
                d={`M${27 + i * 10} ${36 + ((i * 17 + d.progress * 90) % 66)}l-3 9`}
                stroke="#b5cbd1"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
            {[70, 235].map((x, i) => (
              <g key={i}>
                <path
                  d={`M${x - 39} 104V190Q${x - 39} 202 ${x - 27} 202H${x + 27}Q${x + 39} 202 ${x + 39} 190V104`}
                  fill="#e6f0eb44"
                  stroke="#9caca9"
                  strokeWidth="2"
                />
                <path
                  d={`M${x - 35} ${i ? 150 : 190 - 40 * d.progress}H${x + 35}V188Q${x + 35} 198 ${x + 25} 198H${x - 25}Q${x - 35} 198 ${x - 35} 188Z`}
                  fill="#c2d7cd55"
                />
              </g>
            ))}
            <path d="M196 108Q232 100 274 108" stroke="#9caca9" fill="none" strokeWidth="2" />
          </svg>
          <div className="chem-rain-pair">
            <span>{say('直接收集的雨水', 'Directly collected rain')}</span>
            <span>{say('参照水', 'Reference water')}</span>
          </div>
          <div className="chem-rain-note">
            {say('外观清澈 ≠ 酸度相同', 'Clear appearance ≠ same acidity')}
          </div>
        </>
      ) : d.chapter === 1 ? (
        <>
          <div className="chem-rain-instruments">
            <div className="chem-rain-paper">
              <span>{say('试纸', 'Paper')}</span>
              <div className="chem-rain-strip" style={{ background: paperColor(paper.display) }} />
              <strong>pH ≈ {paper.display}</strong>
            </div>
            <div className="chem-rain-device">
              <span>{say('校准后的仪表', 'Calibrated meter')}</span>
              <svg
                viewBox="0 0 150 190"
                role="img"
                aria-label={say('pH计探头浸入水样', 'pH electrode immersed in the sample')}
              >
                <path
                  d="M43 114V177Q43 185 51 185H112Q120 185 120 177V114"
                  fill="#e5eee633"
                  stroke="#a5b7ae"
                  strokeWidth="2"
                />
                <path d="M47 145H116V176Q116 181 108 181H55Q47 181 47 176Z" fill="#bfd4c166" />
                <rect
                  x="61"
                  y="10"
                  width="37"
                  height="116"
                  rx="8"
                  fill="#cbd5ad"
                  stroke="#a1ae8c"
                />
                <rect x="66" y="36" width="27" height="24" rx="3" fill="#e9edd8" />
                <path d="M72 126V163Q80 175 88 163V126" fill="#cbd7c355" stroke="#a1ae8c" />
              </svg>
              <strong>pH {meter.display.toFixed(2)}</strong>
            </div>
          </div>
          <div className="chem-rain-note">
            {say('显示位数不等于测量准确度', 'More digits do not guarantee accuracy')}
          </div>
        </>
      ) : d.chapter === 2 ? (
        <>
          <div className="chem-rain-calibration">
            <span className={d.calibrated ? 'active' : ''}>pH 4</span>
            <span className={d.calibrated ? 'active' : ''}>pH 7</span>
            <span>
              {d.calibrated
                ? say('两点校准', 'Two-point calibration')
                : say('未校准', 'Uncalibrated')}
            </span>
          </div>
          <div className="chem-rain-meter-value">
            pH {meter.display.toFixed(2)} <small>± {meter.uncertainty.toFixed(2)}</small>
          </div>
          <svg
            className="chem-rain-interval"
            viewBox="0 0 320 125"
            role="img"
            aria-label={say(
              '读数区间与教材5.6参考线比较',
              'Reading interval compared with the textbook reference of5.6',
            )}
          >
            <path d="M32 65H287" stroke="#bdcbb8" strokeWidth="2" />
            {[4, 5, 6, 7].map((v) => (
              <g key={v}>
                <path d={`M${xPH(v)} 61V70`} stroke="#a6b797" />
                <text x={xPH(v)} y="100" textAnchor="middle" fontSize="20" fill="#75876b">
                  {v}
                </text>
              </g>
            ))}
            <path
              d={`M${xPH(RAIN_REFERENCE_PH)} 8V77`}
              stroke="#bfa382"
              strokeWidth="2"
              strokeDasharray="4 5"
            />
            <text x={xPH(RAIN_REFERENCE_PH) + 9} y="25" fontSize="20" fill="#a98f70">
              5.6
            </text>
            <path
              d={`M${xPH(range[0])} 51H${xPH(range[1])}`}
              stroke="#9bb7ba"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx={xPH(meter.display)} cy="51" r="5" fill="#6c9297" />
          </svg>
          <div className="chem-rain-result">
            {result === 'unresolved'
              ? say('区间跨过参考线', 'Interval crosses the reference')
              : result === 'below'
                ? say('区间低于参考线', 'Interval below the reference')
                : say('区间未低于参考线', 'Interval not below the reference')}
          </div>
          <div className="chem-rain-note">
            {say('±0.15 为教学误差示例', '±0.15 is a teaching error example')}
          </div>
        </>
      ) : d.chapter === 3 ? (
        <>
          <div className="chem-rain-record-chart">
            <div className="chem-rain-ylabels">
              <span>6</span>
              <span>5</span>
              <span>4</span>
            </div>
            <div className="chem-rain-plot">
              <div className="chem-rain-threshold" style={{ top: 'calc(20% - 6.4px)' }} />
              <div className="chem-rain-grid" />
              <div className="chem-rain-events">
                {syntheticRainRecords.map((r, i) => (
                  <div className="chem-rain-event" key={i}>
                    <div className="chem-rain-event-line">
                      {i < d.visibleEvents &&
                        (r.ph === null ? (
                          <span className="chem-rain-missing">—</span>
                        ) : (
                          <span
                            className="chem-rain-dot"
                            style={{ top: `${((6 - r.ph) / 2) * 100}%` }}
                          >
                            <b>{r.ph.toFixed(1)}</b>
                          </span>
                        ))}
                    </div>
                    <span>{r.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chem-rain-note">
            {say('7个记录日 · 第3日无样品', '7 record days · no sample on day 3')}
          </div>
          <div className="chem-rain-note">
            {say('全部为教学合成数据', 'All values are synthetic teaching data')}
          </div>
        </>
      ) : (
        <>
          <div className="chem-rain-average-samples">
            {[
              { p: 4, f: d.acidicFraction },
              { p: 6, f: 1 - d.acidicFraction },
            ].map((a) => (
              <div key={a.p}>
                <span>pH {a.p}</span>
                <div className="chem-rain-volume">
                  <i style={{ height: `${a.f * 100}%` }} />
                </div>
                <span>{Math.round(a.f * 100)}%</span>
              </div>
            ))}
          </div>
          <div className="chem-rain-average">
            <span>
              {say('样品pH的算术均值', 'Arithmetic mean of sample pH')}
              <b>{agg.meanPH?.toFixed(2)}</b>
            </span>
            <span>
              {say('按水量加权H⁺后换算', 'Weight H⁺ by volume, then convert')}
              <b>{agg.weightedPH?.toFixed(2)}</b>
            </span>
          </div>
          <div className="chem-rain-note">
            {say('统计换算示例，非实际混水预测', 'Statistical example, not a mixing prediction')}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-rain-controls">
          <Segments
            label={say('探索视图', 'Explore')}
            value={view}
            onChange={setView}
            options={[
              { value: 'measurement', label: say('测量边界', 'Measurement') },
              { value: 'records', label: say('连续记录', 'Records') },
              { value: 'average', label: say('平均酸度', 'Average') },
            ]}
          />
          {view === 'measurement' && (
            <>
              <Range
                label={say('样品pH（模型真值）', 'Sample pH (model truth)')}
                value={ph}
                min={4}
                max={6.8}
                step={0.01}
                onChange={setPH}
              />
              <Segments
                label={say('仪表状态', 'Meter state')}
                value={String(cal)}
                onChange={(v) => setCal(v === 'true')}
                options={[
                  { value: 'true', label: say('已校准', 'Calibrated') },
                  { value: 'false', label: say('未校准', 'Uncalibrated') },
                ]}
              />
            </>
          )}
          {view === 'average' && (
            <Range
              label={say('pH4样品的水量比例', 'Volume fraction from pH 4 sample')}
              value={fraction}
              min={0}
              max={1}
              step={0.01}
              onChange={setFraction}
            />
          )}
          <details>
            <summary>{say('数据与模型限定', 'Data and model limits')}</summary>
            <p>
              {say(
                '样品、误差与时间序列均为教学设定。两点校准移除线性偏差，但真实低离子强度雨水仍有电极稳定性和污染问题。pH不能单独识别酸的种类或污染来源。',
                'Samples, errors and the time series are teaching fixtures. Two-point calibration removes affine bias, but real low-ionic-strength rain still poses electrode-stability and contamination problems. pH alone cannot identify an acid or pollutant source.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
function paperColor(ph: number) {
  return ph < 5 ? '#d4ac8d' : ph < 6 ? '#d8c58e' : ph < 7 ? '#b8c495' : '#94b6a0';
}
