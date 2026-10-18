import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  approachMagnet,
  coilInduction,
  discGenerator,
  fallingMagnet,
  inductionShot,
  type InductionExperiment,
} from '../../models/induction-coil-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const options = [
  { value: 'coil', label: '磁体与线圈' },
  { value: 'ring', label: '闭合与断开铝环' },
  { value: 'fall', label: '落磁电压测量' },
  { value: 'disc', label: '圆盘发电机' },
] as const;
const initial = (v?: string): InductionExperiment =>
  v?.includes('aluminium-ring')
    ? 'ring'
    : v?.includes('falling-magnet')
      ? 'fall'
      : v?.includes('faraday-disc')
        ? 'disc'
        : 'coil';
export default function InductionCoilLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [experiment, setExperiment] = useState<InductionExperiment>(() => initial(film.variant)),
    [position, setPosition] = useState(0.04),
    [velocity, setVelocity] = useState(-0.2),
    [polarity, setPolarity] = useState('north'),
    [closed, setClosed] = useState('closed'),
    [height, setHeight] = useState(0.18),
    [turns, setTurns] = useState(80),
    [time, setTime] = useState(0.15),
    [omega, setOmega] = useState(20);
  const shot = film.watch
    ? inductionShot(film.chapter, film.chapterProgress)
    : {
        experiment,
        progress: time / 0.34,
        polarity: experiment === 'fall' || polarity === 'north' ? 1 : -1,
        closed: experiment !== 'ring' || closed === 'closed',
        stationary: false,
        height,
        turns,
        omega,
        time,
      };
  const moving = approachMagnet(shot.progress, shot.polarity),
    base = film.watch
      ? shot.stationary
        ? coilInduction({ z: 0.06, velocity: 0 })
        : moving
      : coilInduction({
          z: position,
          velocity,
          moment: -0.03 * shot.polarity,
          closed: shot.closed,
        });
  const state =
    shot.experiment === 'fall'
      ? fallingMagnet(shot.time, shot.height, shot.turns)
      : shot.experiment === 'ring'
        ? coilInduction({
            z: base.z,
            velocity: base.velocity,
            moment: -0.03 * shot.polarity,
            turns: 1,
            resistance: 0.003,
            closed: shot.closed,
          })
        : base;
  const disc = discGenerator(shot.omega),
    my = 160 - state.z * 420,
    needle = Math.max(
      -0.8,
      Math.min(0.8, shot.experiment === 'fall' ? state.emf * 70 : state.current * 150),
    ),
    ringShift = 28 * Math.tanh(state.magnetForce * 3e7);
  const magnet = (x: number, y: number, vertical = true) => (
    <g transform={`translate(${x} ${y}) ${vertical ? '' : 'rotate(-90)'}`}>
      <rect x="-13" y="-30" width="26" height="60" rx="4" fill="#a4bfb1" stroke="#789683" />
      <path d="M-13 0h26v26q0 4-4 4H-9q-4 0-4-4Z" fill="#c1a16c" />
      <text x="0" y="-8" textAnchor="middle" className="em-small">
        {shot.polarity > 0 ? 'S' : 'N'}
      </text>
      <text x="0" y="22" textAnchor="middle" className="em-small">
        {shot.polarity > 0 ? 'N' : 'S'}
      </text>
    </g>
  );
  return (
    <div className="textbook-em induction-coil-lab" data-watch={film.watch}>
      <div className="textbook-em-state">
        <span>{t(options.find((x) => x.value === shot.experiment)!.label)}</span>
        <span>
          {shot.experiment === 'disc'
            ? `ω = ${shot.omega.toFixed(0)} rad/s`
            : shot.experiment === 'ring'
              ? t(shot.closed ? '铝环闭合' : '铝环断开')
              : shot.experiment === 'fall'
                ? `N = ${shot.turns} · h = ${shot.height.toFixed(2)} m`
                : 'N = 80'}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 300"
        role="img"
        aria-label={t('磁通变化、感应电流方向与真实装置位置')}
      >
        <defs>
          <linearGradient id={`${id}-copper`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#d8b77c" />
            <stop offset=".5" stopColor="#a77d45" />
            <stop offset="1" stopColor="#e6c994" />
          </linearGradient>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="3"
            markerHeight="3"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
          </marker>
        </defs>
        {(shot.experiment === 'coil' || shot.experiment === 'fall') && (
          <>
            <path
              d="M85 255H225M104 255V184M207 255V184"
              stroke="#b5c2ac"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="99" y="124" width="113" height="71" rx="15" fill="#e3e9dc" stroke="#b5c5ab" />
            {magnet(155, my)}
            <path
              d={Array.from({ length: 481 }, (_, i) => {
                const p = i / 480;
                return `${i ? 'L' : 'M'}${155 + 51 * Math.cos(p * 2 * Math.PI * 12)} ${129 + 58 * p + 10 * Math.sin(p * 2 * Math.PI * 12)}`;
              }).join(' ')}
              stroke={`url(#${id}-copper)`}
              strokeWidth="2.4"
              fill="none"
            />
            <path
              d="M206 129H290V183M206 187H255V225H290"
              stroke="#81927a"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="290" cy="204" r="25" fill="#f4f5eb" stroke="#b4c4a8" strokeWidth="2" />
            <path d="M273 210Q290 179 307 210" stroke="#c4ceba" fill="none" />
            <path
              d={`M290 216l${Math.sin(needle) * 20} ${-Math.cos(needle) * 22}`}
              stroke="#a78951"
              strokeWidth="2"
            />
            <circle cx="290" cy="216" r="2.5" fill="#8c9a82" />
            <text x="290" y="259" textAnchor="middle">
              {shot.experiment === 'fall' ? 'V' : 'G'}
            </text>
            {state.velocity !== 0 && (
              <path
                d={`M81 ${my}v${-Math.sign(state.velocity) * 27}`}
                stroke="#7b9a83"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
          </>
        )}
        {shot.experiment === 'ring' && (
          <>
            <path d="M185 35H280M239 35V75" stroke="#afbea4" strokeWidth="4" fill="none" />
            <path d={`M239 75L${239 + ringShift} 116`} stroke="#83947c" strokeWidth="1.8" />
            <g transform={`translate(${ringShift} 0)`}>
              <ellipse
                cx="239"
                cy="164"
                rx="28"
                ry="51"
                fill="none"
                stroke="#a8b9ac"
                strokeWidth="8"
              />
              {!shot.closed && <path d="M259 200l-9 10" stroke="#f7f8ef" strokeWidth="12" />}
              {shot.closed && state.current !== 0 && (
                <path
                  d={state.current > 0 ? 'M251 200Q271 164 251 128' : 'M251 128Q271 164 251 200'}
                  fill="none"
                  stroke="#b2965f"
                  strokeWidth="2"
                  markerEnd={`url(#${id}-arrow)`}
                />
              )}
            </g>
            {magnet(239 - state.z * 1400, 164, false)}
            {state.velocity !== 0 && (
              <path
                d={`M${239 - state.z * 1400} 219h${-Math.sign(state.velocity) * 30}`}
                stroke="#7b9a83"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
          </>
        )}
        {shot.experiment === 'disc' && (
          <>
            <circle
              cx="172"
              cy="145"
              r="87"
              fill={`url(#${id}-copper)`}
              stroke="#a78e5e"
              strokeWidth="2"
            />
            <circle cx="172" cy="145" r="76" fill="none" stroke="#e5cfa2" opacity=".65" />
            <g transform={`rotate(${-shot.progress * shot.omega * 20} 172 145)`}>
              {[0, 60, 120].map((a) => (
                <path
                  key={a}
                  d="M100 145H244"
                  transform={`rotate(${a} 172 145)`}
                  stroke="#b68e58"
                  strokeWidth="1.2"
                  opacity=".65"
                />
              ))}
            </g>
            {[
              [140, 105],
              [205, 105],
              [140, 185],
              [205, 185],
            ].map(([x, y]) => (
              <g key={x + ':' + y}>
                <circle cx={x} cy={y} r="5" fill="none" stroke="#668b73" />
                <circle cx={x} cy={y} r="1.5" fill="#668b73" />
              </g>
            ))}
            <circle cx="172" cy="145" r="9" fill="#839888" stroke="#5e7b65" />
            <path
              d="M172 145H303V193M259 146H282V254H303V223"
              stroke="#748b74"
              strokeWidth="3"
              fill="none"
            />
            <rect x="294" y="193" width="18" height="30" rx="3" fill="#e0e6d4" stroke="#859c78" />
            <rect x="250" y="139" width="18" height="14" rx="3" fill="#9ba994" />
            <text x="320" y="216">
              R
            </text>
            {shot.omega !== 0 && (
              <path
                d={shot.omega > 0 ? 'M231 72Q172 26 113 72' : 'M113 72Q172 26 231 72'}
                fill="none"
                stroke="#6b8d72"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {shot.experiment === 'disc'
          ? t('轴与边缘电刷接通外电路')
          : shot.experiment === 'ring'
            ? t(shot.closed ? '闭合电流阻碍相对运动' : '断口切断电流，阻尼消失')
            : t(state.velocity === 0 ? '磁体不动：电动势为零' : '改变的是穿过线圈的磁通')}
      </p>
      <div className="textbook-em-readout">
        <span>
          {t(
            shot.experiment === 'disc'
              ? '轴到边缘电动势'
              : shot.experiment === 'ring'
                ? '环内感应电流'
                : '感应电动势',
          )}
        </span>
        <strong>
          {(shot.experiment === 'disc'
            ? disc.emf * 1000
            : shot.experiment === 'ring'
              ? state.current * 1000
              : state.emf * 1000
          ).toFixed(2)}{' '}
          {shot.experiment === 'ring' ? 'mA' : 'mV'}
        </strong>
      </div>
      {shot.experiment === 'fall' && (
        <svg
          className="textbook-em-chart"
          viewBox="0 0 360 105"
          aria-label={t('同一次下落的电压脉冲，浅线为80匝对照')}
        >
          <path d="M26 52H339M26 12V92" stroke="#b7c6aa" fill="none" />
          {[80, shot.turns].map((n, i) => (
            <path
              key={i}
              d={Array.from({ length: 181 }, (_, j) => {
                const p = j / 180,
                  e = fallingMagnet(p * 0.34, shot.height, n).emf;
                return `${j ? 'L' : 'M'}${26 + 300 * p} ${52 - Math.max(-39, Math.min(39, e * 1500))}`;
              }).join(' ')}
              stroke={i ? '#668e75' : '#c7b186'}
              strokeWidth="2"
              fill="none"
            />
          ))}
          <path
            d={`M${26 + (300 * shot.time) / 0.34} 14V91`}
            stroke="#9cae93"
            strokeDasharray="3 4"
          />
          <text x="339" y="100" textAnchor="end">
            t
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择感应实验')}
            value={experiment}
            options={options.map((x) => ({ ...x, label: t(x.label) }))}
            onChange={setExperiment}
          />
          {(experiment === 'coil' || experiment === 'ring') && (
            <>
              <Range
                label={t('磁体到线圈的轴向距离')}
                value={position}
                min={0.01}
                max={0.12}
                step={0.005}
                unit="m"
                onChange={setPosition}
              />
              <Range
                label={t('磁体轴向速度')}
                value={velocity}
                min={-0.4}
                max={0.4}
                step={0.02}
                unit="m/s"
                onChange={setVelocity}
              />
              <Segments
                label={t('磁极朝向')}
                value={polarity}
                options={[
                  { value: 'north', label: t('北极朝向线圈') },
                  { value: 'south', label: t('南极朝向线圈') },
                ]}
                onChange={setPolarity}
              />
              {experiment === 'ring' && (
                <Segments
                  label={t('铝环连接')}
                  value={closed}
                  options={[
                    { value: 'closed', label: t('闭合') },
                    { value: 'open', label: t('断开') },
                  ]}
                  onChange={setClosed}
                />
              )}
            </>
          )}
          {experiment === 'fall' && (
            <>
              <Range
                label={t('释放高度')}
                value={height}
                min={0.08}
                max={0.26}
                step={0.01}
                unit="m"
                onChange={setHeight}
              />
              <Range
                label={t('线圈匝数')}
                value={turns}
                min={40}
                max={160}
                step={20}
                onChange={setTurns}
              />
              <Range
                label={t('下落时间')}
                value={time}
                min={0}
                max={0.34}
                step={0.001}
                unit="s"
                onChange={setTime}
              />
            </>
          )}
          {experiment === 'disc' && (
            <Range
              label={t('圆盘角速度')}
              value={omega}
              min={-30}
              max={30}
              step={1}
              unit="rad/s"
              onChange={setOmega}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('磁通模型与测量边界')}</summary>
        <p>
          {t(
            '条形磁体用轴向点磁偶极近似，感应电动势由同一磁通函数的时间导数计算。铝环用纯电阻闭合回路，位移放大且忽略其反馈与自感。落磁测量采用高输入阻抗电压传感器，忽略反作用制动；图中绕线只展示代表匝，读数使用标示总匝数。圆盘以轴—边缘的运动电动势计算，电刷视为理想接触。',
          )}
        </p>
      </details>
    </div>
  );
}
