import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  measurementPendulum,
  measuredPendulumPeriod,
  gravityMeasurement,
  inkDrop,
  rodGeometry,
  EFFECTIVE_DATA,
  effectiveDataFit,
} from '../../models/pendulum-measurement-lab';
import '../../styles/pendulum-measurement-lab.css';
const inkRecords = Array.from({ length: 43 }, (_, i) => inkDrop(i * 0.08));
type Mode = 'ink' | 'length' | 'gravity' | 'rod';
const proj = (p: number[]) => [175 + 330 * p[0] + 210 * p[1], 325 - 420 * p[2] + 80 * p[1]],
  line = (a: number[], b: number[]) => {
    const p = proj(a),
      q = proj(b);
    return `M${p[0]} ${p[1]}L${q[0]} ${q[1]}`;
  };
export default function PendulumMeasurementLab() {
  const film = useShowcase(),
    initial: Mode =
      film.variant === 'e1-ink-pendulum'
        ? 'ink'
        : film.variant === 'e1-pendulum-length-period'
          ? 'length'
          : film.variant === 'e1-effective-gravity-pendulum'
            ? 'rod'
            : 'gravity',
    [modeInput, setMode] = useState<Mode>(initial),
    [length, setLength] = useState(0.7),
    [angle, setAngle] = useState(5),
    [tilt, setTilt] = useState(19),
    [progress, setProgress] = useState(0),
    [includeRadius, setIncludeRadius] = useState('centre'),
    [timingError, setTimingError] = useState(0),
    [lengthError, setLengthError] = useState(0),
    [showData, setShowData] = useState(false),
    [records, setRecords] = useState<{ length: number; T: number }[]>([]),
    c = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    mode: Mode = film.watch
      ? c < 2
        ? 'ink'
        : c < 4
          ? 'length'
          : c < 7
            ? 'gravity'
            : 'rod'
      : modeInput,
    trial = Math.min(2, Math.floor(p * 3)),
    L = film.watch ? (c === 2 ? [0.4, 0.7, 1][trial] : 0.7) : length,
    A = film.watch ? 0.08 : (angle * Math.PI) / 180,
    theta = film.watch ? (c === 7 ? 30 * Math.min(1, p / 0.65) : 19) : tilt,
    gEff = 9.8 * Math.sin((theta * Math.PI) / 180),
    T =
      mode === 'rod'
        ? gEff > 0
          ? measuredPendulumPeriod(0.27, gEff, 0.1)
          : Infinity
        : measuredPendulumPeriod(L, 9.81, A),
    cycles = mode === 'length' ? 5 : 20,
    u = film.watch && c === 2 ? p * 3 - trial : p,
    time =
      mode === 'ink'
        ? 3.4 * Math.min(1, p / 0.9)
        : film.watch && c === 4
          ? 0
          : mode === 'rod' && (!Number.isFinite(T) || (film.watch && c === 7))
            ? 0
            : film.watch && c === 6
              ? cycles * T
              : cycles * T * Math.min(1, u / 0.88),
    s = measurementPendulum(mode === 'ink' ? time : time, L, 9.81, A),
    result = gravityMeasurement(
      L,
      A,
      cycles,
      film.watch ? (c === 6 ? 0.3 : 0) : timingError,
      film.watch ? 0 : lengthError,
      film.watch ? c !== 6 || p >= 0.5 : includeRadius === 'centre',
    ),
    complete = time >= cycles * T - 1e-8,
    plot = film.watch ? c === 1 || c === 3 || c === 9 : showData,
    caption =
      mode === 'ink'
        ? '滴墨摆沿一个方向摆动，木板沿垂直方向匀速移动'
        : mode === 'length'
          ? '改变摆长并累计计时，再比较 T² 与 L 的关系'
          : mode === 'gravity'
            ? '测支点至球心的距离；从同向过零开始数全振动'
            : '杆线摆绕倾斜转轴转动，等效重力为 g sin θ';
  const lengthRows = film.watch
    ? [0.4, 0.7, 1]
        .slice(0, c === 3 ? 3 : trial + (complete ? 1 : 0))
        .map((l) => ({ length: l, T: measuredPendulumPeriod(l) }))
    : records;
  const rodAngle = gEff > 0 ? measurementPendulum(time, 0.27, gEff, 0.1, false).angle : 0.1,
    rod = rodGeometry(theta, film.watch && c === 7 ? 0 : rodAngle),
    fit = effectiveDataFit(),
    active = Math.min(5, Math.floor(p * 6));
  return (
    <section className={`pm-film${film.watch ? ' pm-watch' : ''}`}>
      <p className="pm-caption">{t(caption)}</p>
      {mode === 'ink' && !plot ? (
        <svg
          viewBox="0 0 400 380"
          className="pm-apparatus"
          role="img"
          aria-label={t('装墨汁的注射器摆动，墨滴带着离开时的速度下落到匀速木板上')}
        >
          <path d="M145 30h110M200 30v55" stroke="#aebd9f" strokeWidth="6" strokeLinecap="round" />
          <polygon
            points={[
              [-0.17, -0.1],
              [0.17, -0.1],
              [0.17, 0.45],
              [-0.17, 0.45],
            ]
              .map(
                ([x, y]) =>
                  `${200 + 380 * x + 260 * (y - 0.1 * time)},${280 + 150 * (y - 0.1 * time)}`,
              )
              .join(' ')}
            fill="#dac8a4"
            opacity=".6"
          />
          {[0.02, 0.18, 0.34].map((y) => (
            <path
              key={y}
              d={`M${200 - 64.6 + 260 * (y - 0.1 * time)} ${280 + 150 * (y - 0.1 * time)}h129.2`}
              stroke="#c8b690"
              strokeWidth="1"
            />
          ))}
          {inkRecords
            .filter((d) => d.emitted <= time)
            .map((d, i) => {
              const age = time - d.emitted,
                landed = time >= d.impact,
                yBoard = landed ? 0.1 * (d.impact - time) : 0,
                x = landed ? d.landing : d.x + d.vx * age,
                z = landed ? 0 : d.z + d.vz * age - 0.5 * 9.81 * age * age;
              return (
                <circle
                  key={i}
                  cx={200 + 380 * x + 260 * yBoard}
                  cy={280 + 150 * yBoard - 300 * z}
                  r={landed ? 2 : 2.6}
                  fill="#778e7b"
                  opacity={landed ? 0.65 : 1}
                />
              );
            })}
          {(() => {
            const q = measurementPendulum(time, 0.55, 9.81, 0.17, false),
              a = q.angle,
              dx = 380 * Math.sin(a),
              dy = 300 * Math.cos(a),
              scale = Math.hypot(dx, dy),
              x = 200 + 0.55 * dx,
              y = 280 - 300 * 0.65 + 0.55 * dy;
            return (
              <g>
                <path
                  d={`M200 85L${x - 0.05 * dx} ${y - 0.05 * dy}`}
                  stroke="#91a385"
                  strokeWidth="2"
                />
                <g
                  transform={`translate(${x} ${y}) rotate(${(-Math.atan2(dx, dy) * 180) / Math.PI})`}
                >
                  <rect
                    x="-6"
                    y={-0.05 * scale}
                    width="12"
                    height={0.065 * scale}
                    rx="2"
                    fill="#c2d5c4"
                    stroke="#91a98f"
                  />
                  <rect x="-4" y={-0.02 * scale} width="8" height={0.03 * scale} fill="#8a9f89" />
                  <path
                    d={`M-10 ${-0.05 * scale}h20M0 ${0.015 * scale}V${0.035 * scale}`}
                    stroke="#8fa086"
                    strokeWidth="2"
                  />
                </g>
              </g>
            );
          })()}
          <path
            d="M270 352l-39-22m0 0 12 1m-12-1 7 10"
            stroke="#a79673"
            fill="none"
            strokeWidth="3"
          />
          <text x="200" y="375" textAnchor="middle">
            {t('木板速度 10 cm/s')}
          </text>
        </svg>
      ) : mode === 'ink' ? (
        <svg
          viewBox="0 0 400 250"
          className="pm-apparatus"
          role="img"
          aria-label={t('按实际落墨时刻标定时间的墨迹；包括落下延迟和切向初速度')}
        >
          <rect x="21" y="20" width="358" height="194" rx="12" fill="#ebe4d0" />
          <path d="M35 116H365M35 35V204" stroke="#bfb294" />
          {inkRecords.map((d, i) => {
            return d.impact <= time ? (
              <circle
                key={i}
                cx={35 + 95 * d.impact}
                cy={116 - 600 * d.landing}
                r="3"
                fill="#82967d"
              />
            ) : null;
          })}
          <text x="28" y="241">
            0
          </text>
          <text x="300" y="241">
            t / s
          </text>
          <text x="44" y="48">
            x
          </text>
        </svg>
      ) : mode === 'rod' && !plot ? (
        <svg
          viewBox="0 0 400 370"
          className="pm-apparatus"
          role="img"
          aria-label={t('倾斜立柱上有两个同轴转动连接，轻杆和细线把球约束在垂直于转轴的倾斜平面')}
        >
          <path d="M90 329H340" stroke="#c4cbb8" strokeWidth="2" />
          {(() => {
            const corners = [
              [-0.11, -0.06],
              [0.11, -0.06],
              [0.11, 0.06],
              [-0.11, 0.06],
            ].map(([x, y]) => proj(rod.base.map((v, i) => v + x * rod.u[i] + (i === 1 ? y : 0))));
            return (
              <>
                <polygon
                  points={[
                    corners[3],
                    corners[2],
                    proj(
                      rod.base.map((v, i) =>
                        i === 2 ? 0 : v + 0.11 * rod.u[i] + (i === 1 ? 0.06 : 0),
                      ),
                    ),
                    proj(
                      rod.base.map((v, i) =>
                        i === 2 ? 0 : v - 0.11 * rod.u[i] + (i === 1 ? 0.06 : 0),
                      ),
                    ),
                  ]
                    .map((q) => q.join(','))
                    .join(' ')}
                  fill="#d4bf95"
                />
                <polygon points={corners.map((q) => q.join(',')).join(' ')} fill="#b8c3a8" />
              </>
            );
          })()}
          <path
            d={line(
              rod.base,
              rod.upper.map((v, i) => v + 0.06 * rod.n[i]),
            )}
            stroke="#9fae8c"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={line(rod.upper, [rod.upper[0], rod.upper[1], 0.015])}
            stroke="#bca378"
            strokeDasharray="4 4"
          />
          <path
            d={line(rod.pivot, rod.bob)}
            stroke="#809575"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d={line(rod.upper, rod.bob)} stroke="#a8b696" strokeWidth="1.8" />
          {[rod.upper, rod.pivot].map((a, i) => (
            <circle key={i} cx={proj(a)[0]} cy={proj(a)[1]} r="5" fill="#bda272" />
          ))}
          <circle cx={proj(rod.bob)[0]} cy={proj(rod.bob)[1]} r="9" fill="#8a9f7b" />
          <path
            d={Array.from({ length: 41 }, (_, i) => {
              const q = proj(rodGeometry(theta, -0.25 + i * 0.0125).bob);
              return `${i ? 'L' : 'M'}${q[0]} ${q[1]}`;
            }).join(' ')}
            stroke="#b2c1a3"
            fill="none"
            strokeDasharray="3 5"
          />
          <text x="42" y="349">
            θ = {theta.toFixed(1)}°
          </text>
          <text x="220" y="349">
            β = {(90 - theta).toFixed(1)}°
          </text>
        </svg>
      ) : mode === 'rod' ? (
        <svg
          viewBox="0 0 400 275"
          className="pm-apparatus"
          role="img"
          aria-label={t('教材原始六组周期与等效重力数据，保留相对拟合直线的偏差')}
        >
          <path d="M45 25V224H370" stroke="#bac7ac" fill="none" />
          <path
            d={`M45 224L${45 + 390 * 0.78} ${224 - 65 * fit.slope * 0.78}`}
            stroke="#c0a77b"
            strokeWidth="2"
          />
          {EFFECTIVE_DATA.map((r, i) => (
            <circle
              key={i}
              cx={45 + 390 * r.inv}
              cy={224 - 65 * r.T}
              r={i === active ? 7 : 4}
              fill={i === active ? '#b29462' : '#8fa57a'}
            />
          ))}
          <text x="15" y="23">
            T/s
          </text>
          <text x="35" y="250">
            0
          </text>
          <text x="278" y="265">
            1/√a
          </text>
          <text x="354" y="249">
            0.8
          </text>
        </svg>
      ) : plot && mode === 'length' ? (
        <svg
          viewBox="0 0 400 275"
          className="pm-apparatus"
          role="img"
          aria-label={t('从多组累计计时得到的周期平方与摆长图像')}
        >
          <path d="M45 25V224H370" stroke="#bac7ac" fill="none" />
          <path
            d={`M45 224L${45 + 290} ${224 - 45 * measuredPendulumPeriod(1) ** 2}`}
            stroke="#c0aa7e"
            strokeWidth="2"
          />
          {lengthRows.map((r, i) => (
            <circle
              key={i}
              cx={45 + 290 * r.length}
              cy={224 - 45 * r.T * r.T}
              r="5"
              fill="#8da47a"
            />
          ))}
          <text x="4" y="23">
            T²/s²
          </text>
          <text x="34" y="249">
            0
          </text>
          <text x="315" y="263">
            L/m
          </text>
          <text x="329" y="248">
            1.0
          </text>
        </svg>
      ) : (
        <svg
          viewBox="0 0 400 390"
          className="pm-apparatus"
          role="img"
          aria-label={t('标尺从固定支点量至球心，旁边放大示意摆线长度加上小球半径')}
        >
          <path
            d="M320 358V28H190v22M302 358h38"
            stroke="#adbc9e"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path d="M70 50V350" stroke="#c4b28b" strokeWidth="11" />
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <path d={`M66 ${50 + i * 30}h${i % 5 === 0 ? 18 : 10}`} stroke="#a58e67" />
              {i % 5 === 0 && (
                <text x="38" y={57 + i * 30} textAnchor="end">
                  {(i / 10).toFixed(1)}
                </text>
              )}
            </g>
          ))}
          <text x="76" y="374">
            m
          </text>
          {(() => {
            const q = film.watch && (c === 4 || c === 6) ? measurementPendulum(0, L, 9.81, A) : s,
              px = 190 + 300 * L * Math.sin(q.angle),
              py = 50 + 300 * L * Math.cos(q.angle),
              r = 4.5;
            return (
              <>
                <path
                  d={`M190 50L${px - r * Math.sin(q.angle)} ${py - r * Math.cos(q.angle)}`}
                  stroke="#90a180"
                  strokeWidth="1.8"
                />
                <circle cx={px} cy={py} r={r} fill="#b1986b" />
                <path
                  d={`M90 50h91M90 ${50 + 300 * L}h91M102 50V${50 + 300 * L}`}
                  stroke="#b4bf9f"
                  strokeDasharray="3 5"
                />
                <circle cx="190" cy="50" r="4" fill="#a99470" />
              </>
            );
          })()}
          <g transform="translate(279 157)">
            <circle r="31" fill="#d7dfc9" stroke="#a7b69a" />
            <path d="M0-57V-31M-40 0H40M0 0V-31" stroke="#9bac8d" strokeWidth="2" />
            <circle r="2.5" fill="#8ca17a" />
            <text x="0" y="62" textAnchor="middle">
              r = 1.5 cm
            </text>
          </g>
        </svg>
      )}
      <div className="pm-readings">
        {mode === 'ink' ? (
          <span>
            {t('模型时间')} {time.toFixed(2)} s
          </span>
        ) : mode === 'rod' && plot ? (
          <>
            <span>{t('教材原始数据')}</span>
            <span>
              θ {EFFECTIVE_DATA[active].theta}° · T {EFFECTIVE_DATA[active].T.toFixed(2)} s
            </span>
          </>
        ) : mode === 'rod' ? (
          <>
            <span>a = {gEff.toFixed(2)} m/s²</span>
            {!(film.watch && c === 7) && (
              <span>
                T = {complete && Number.isFinite(T) ? T.toFixed(3) : '—'} s · n{' '}
                {Number.isFinite(T) ? Math.min(cycles, Math.floor(time / T + 1e-8)) : 0}/{cycles}
              </span>
            )}
          </>
        ) : (
          <>
            <span>L = {result.measuredLength.toFixed(3)} m</span>
            {!(film.watch && c === 4) && (
              <span>
                n {Math.min(cycles, Math.floor(time / T + 1e-8))}/{cycles} · t{' '}
                {Math.min(
                  result.elapsed,
                  time + (complete ? result.elapsed - cycles * T : 0),
                ).toFixed(2)}{' '}
                s
              </span>
            )}
            {complete && mode === 'length' && <span>T = {result.period.toFixed(3)} s</span>}
            {(complete || (film.watch && c === 6)) && mode === 'gravity' && (
              <span>g = {result.inferred.toFixed(3)} m/s²</span>
            )}
          </>
        )}
      </div>
      {mode === 'length' && !film.watch && (
        <table className="pm-table">
          <thead>
            <tr>
              <th>L/m</th>
              <th>T/s</th>
              <th>T²/s²</th>
            </tr>
          </thead>
          <tbody>
            {lengthRows.map((r, i) => (
              <tr key={i}>
                <td>{r.length.toFixed(2)}</td>
                <td>{r.T.toFixed(3)}</td>
                <td>{(r.T * r.T).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!film.watch && (
        <div className="pm-controls">
          <Segments
            label={t('选择单摆实验')}
            value={modeInput}
            options={(
              [
                ['ink', '滴墨记录'],
                ['length', '摆长与周期'],
                ['gravity', '测量重力加速度'],
                ['rod', '倾斜杆线摆'],
              ] as [Mode, string][]
            ).map(([value, label]) => ({ value, label: t(label) }))}
            onChange={(v) => {
              setMode(v as Mode);
              setProgress(0);
              setShowData(false);
            }}
          />
          {mode === 'length' || mode === 'gravity' ? (
            <>
              <Range
                label={t('真实摆长')}
                value={length}
                min={0.4}
                max={1}
                step={0.05}
                unit="m"
                onChange={setLength}
              />
              <Range
                label={t('初始偏角')}
                value={angle}
                min={2}
                max={25}
                step={1}
                unit="°"
                onChange={setAngle}
              />
            </>
          ) : mode === 'rod' ? (
            <Range
              label={t('平面倾角')}
              value={tilt}
              min={0}
              max={40}
              step={1}
              unit="°"
              onChange={setTilt}
            />
          ) : null}
          {mode === 'gravity' && (
            <>
              <Segments
                label={t('长度读到哪里')}
                value={includeRadius}
                options={[
                  { value: 'centre', label: t('支点到球心') },
                  { value: 'string', label: t('只量摆线') },
                ]}
                onChange={setIncludeRadius}
              />
              <Range
                label={t('长度读数误差')}
                value={lengthError}
                min={-0.02}
                max={0.02}
                step={0.001}
                unit="m"
                onChange={setLengthError}
              />
              <Range
                label={t('累计计时误差')}
                value={timingError}
                min={-0.5}
                max={0.5}
                step={0.05}
                unit="s"
                onChange={setTimingError}
              />
            </>
          )}
          <Range
            label={t('观察进度')}
            value={progress * 100}
            min={0}
            max={100}
            step={0.1}
            unit="%"
            onChange={(v) => setProgress(v / 100)}
          />
          {mode === 'length' && (
            <button
              type="button"
              disabled={!complete}
              onClick={() => setRecords((r) => [...r.slice(-5), { length: L, T: result.period }])}
            >
              {t('保存本次计时')}
            </button>
          )}
          {mode !== 'gravity' && (
            <button type="button" onClick={() => setShowData((x) => !x)}>
              {t(showData ? '回到装置' : '查看记录图像')}
            </button>
          )}
        </div>
      )}
      <details className="pm-details">
        <summary>{t('测量、原始数据与模型边界')}</summary>
        <p>
          {t(
            '普通单摆按非线性方程计算，因此大偏角会让小角度反演的重力值偏低。主装置按尺度画球，球径局部图另行放大。滴墨保留离开针尖时的切向速度和有限下落时间，墨迹不等于摆球空间路径。杆线摆用轻杆和细线保持固定几何，忽略轴承摩擦；平面水平时等效重力为零，不发生这种回复振动。',
          )}
        </p>
        <p>
          {t(
            '摆长研究表为模型计时数据；杆线摆的六组 θ、T、a、1/√a 是教材第119页原始数据，拟合保留偏差。模型装置的长度并不反推成教材未给出的实测长度。',
          )}
        </p>
        {mode === 'rod' && (
          <table className="pm-table">
            <thead>
              <tr>
                <th>θ/°</th>
                <th>T/s</th>
                <th>a</th>
                <th>1/√a</th>
              </tr>
            </thead>
            <tbody>
              {EFFECTIVE_DATA.map((r) => (
                <tr key={r.theta}>
                  <td>{r.theta}</td>
                  <td>{r.T.toFixed(2)}</td>
                  <td>{r.a.toFixed(2)}</td>
                  <td>{r.inv.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
    </section>
  );
}
