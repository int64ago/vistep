import { useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  BUZZER_DEFAULT,
  buzzerObservation,
  buzzerFronts,
  buzzerArrival,
  queueDoppler,
} from '../../models/doppler-lab';
import { useLabTone } from './useLabTone';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/doppler-lab.css';
function Walker({
  x,
  y,
  phase,
  observer = false,
}: {
  x: number;
  y: number;
  phase: number;
  observer?: boolean;
}) {
  const leg = Math.sin(phase) * 6;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle
        cy="-25"
        r="6"
        fill={observer ? '#e5c99d' : '#c0cdb1'}
        stroke={observer ? '#ab8b5e' : '#839b74'}
      />
      <path
        d={`M0-17V0M-7-11L0-16L7-10M0 0L${-5 - leg} 15M0 0L${5 + leg} 15`}
        stroke={observer ? '#b39265' : '#8da67c'}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-5-16H5V-1H-5Z" fill={observer ? '#d4b581' : '#a9bd97'} />
    </g>
  );
}
export default function DopplerLab() {
  const film = useShowcase(),
    root = useRef<HTMLDivElement>(null),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<'buzzer' | 'queue'>(() =>
      film.variant === 'e1-queue-doppler' ? 'queue' : 'buzzer',
    ),
    [rotation, setRotation] = useState(2),
    [radius, setRadius] = useState(1.2),
    [time, setTime] = useState(0),
    [observerSpeed, setObserverSpeed] = useState(0),
    stage = film.chapter,
    p = film.chapterProgress,
    currentMode = film.watch ? (stage < 3 ? 'buzzer' : 'queue') : mode,
    rotating = film.watch ? (stage === 0 ? 0 : 2) : rotation,
    simTime = film.watch
      ? stage === 0
        ? p * 0.03
        : stage < 3
          ? (stage - 1 + p) * 0.5
          : p * 6
      : time,
    parameters = { ...BUZZER_DEFAULT, turnsPerSecond: rotating, radius: film.watch ? 1.2 : radius },
    sound = buzzerObservation(simTime, parameters),
    fronts = buzzerFronts(simTime, parameters),
    speed = film.watch ? (stage === 4 ? -0.5 : stage === 5 ? 0.5 : 0) : observerSpeed,
    queue = queueDoppler(simTime, speed),
    tone = useLabTone(root, sound.frequency, 0.035, !film.watch && currentMode === 'buzzer'),
    showArrivals = film.watch ? stage === 2 : true,
    firstCrest = sound.crestId - 9,
    firstArrival = buzzerArrival(firstCrest / 600, parameters),
    sx = (x: number) => 105 + 40 * x,
    sy = (y: number) => 145 + 40 * y,
    qx = (x: number) => 180 + 30 * x;
  return (
    <div ref={root} className="textbook-em doppler-lab">
      <div className="textbook-em-state">
        <span>
          {t(currentMode === 'buzzer' ? '竹竿端的蜂鸣器 · 俯视' : '队列中的人代表传播的波峰')}
        </span>
        <span>{currentMode === 'buzzer' ? t('运动放慢显示') : `${simTime.toFixed(1)} s`}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 330"
        role="img"
        aria-label={t(
          currentMode === 'buzzer'
            ? '举过头顶旋转的竹竿、杆端蜂鸣器、固定听者与波峰到达记录'
            : '匀速行进的人群与静止、逆行或同向行走的观察者',
        )}
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="19" y="44" width="322" height="194" rx="16" />
          </clipPath>
          <clipPath id={`${id}-queue`}>
            <rect x="18" y="80" width="324" height="206" rx="12" />
          </clipPath>
          <marker
            id={`${id}-arrow`}
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <path d="M0 0L5 3L0 6" fill="none" stroke="#a18a60" />
          </marker>
        </defs>
        {currentMode === 'buzzer' ? (
          <>
            <rect x="19" y="44" width="322" height="194" rx="16" fill="#edf0df" />
            <g clipPath={`url(#${id}-clip)`}>
              {fronts.map((f) => (
                <circle
                  key={f.id}
                  cx={sx(f.x)}
                  cy={sy(f.y)}
                  r={40 * f.radius}
                  fill="none"
                  stroke={f.id === sound.crestId ? '#a8915e' : '#a0b38b'}
                  strokeWidth={f.id === sound.crestId ? 1.7 : 1}
                  opacity={f.id === sound.crestId ? 0.8 : 0.4}
                />
              ))}
              <circle
                cx="105"
                cy="145"
                r={parameters.radius * 40}
                fill="none"
                stroke="#bcc6aa"
                strokeDasharray="3 5"
              />
              <path d="M89 146q0-16 16-16t16 16q-10 11-32 0" fill="#d4ddc4" stroke="#9cad89" />
              <circle cx="105" cy="143" r="7" fill="#b6c6a2" stroke="#91a77d" />
              <path
                d={`M105 145L${sx(sound.current.x)} ${sy(sound.current.y)}`}
                stroke="#ac9566"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {[0.3, 0.6, 0.88].map((r) => (
                <circle
                  key={r}
                  cx={sx(sound.current.x * r)}
                  cy={sy(sound.current.y * r)}
                  r="2.7"
                  fill="#8f825a"
                />
              ))}
              <g
                transform={`translate(${sx(sound.current.x)} ${sy(sound.current.y)}) rotate(${(sound.current.angle * 180) / Math.PI})`}
              >
                <rect
                  x="-16"
                  y="-7"
                  width="14"
                  height="14"
                  rx="3"
                  fill="#c7bc97"
                  stroke="#978964"
                />
                <path d="M-13-2h7m-3-3v6M-9 7v3H3V5" stroke="#8b7d5e" fill="none" />
                <circle r="7" fill="#91aa7b" stroke="#6c895c" strokeWidth="1.5" />
                <circle r="3" fill="#cdd9bd" />
              </g>
              <path
                d={`M${sx(sound.source.x)} ${sy(sound.source.y)}L305 145`}
                stroke="#b5a177"
                strokeDasharray="3 4"
                opacity=".65"
              />
              <circle cx={sx(sound.source.x)} cy={sy(sound.source.y)} r="3" fill="#b29966" />
              <g transform="translate(305 145)">
                <path
                  d="M-11 17q11-8 22 0"
                  stroke="#b19b75"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle r="8" fill="#ead9b5" stroke="#ae976e" />
                <path d="M-7-3q-6 5 0 8" stroke="#957b54" fill="none" strokeWidth="2" />
              </g>
            </g>
            <text x="105" y="31" textAnchor="middle">
              {t('杆端声源')}
            </text>
            <text x="305" y="31" textAnchor="middle">
              {t('听者')}
            </text>
            {showArrivals ? (
              <>
                <text x="28" y="267" className="em-small">
                  {t('发出')}
                </text>
                <text x="28" y="302" className="em-small">
                  {t('到达')}
                </text>
                <path d="M120 264H330M120 299H330" stroke="#d0d9bf" />
                {Array.from({ length: 10 }, (_, i) => (
                  <g key={i}>
                    <path
                      d={`M${120 + (i / 600) * 13000} 257v14`}
                      stroke="#91aa79"
                      strokeWidth="2"
                    />
                    <path
                      d={`M${120 + (buzzerArrival((firstCrest + i) / 600, parameters) - firstArrival) * 13000} 292v14`}
                      stroke="#b29a67"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </>
            ) : null}
          </>
        ) : (
          <>
            <path d="M22 183H338M22 283H338" stroke="#d1dac1" strokeWidth="2" />
            <path d="M32 195H328" stroke="#dbe1cf" strokeDasharray="5 7" />
            {Array.from({ length: 11 }, (_, i) => (
              <path key={i} d={`M${qx(i - 5)} 183v5M${qx(i - 5)} 283v5`} stroke="#becbad" />
            ))}

            <path
              d="M149 62H211"
              stroke="#99b080"
              strokeWidth="2"
              markerEnd={`url(#${id}-arrow)`}
            />
            <g clipPath={`url(#${id}-queue)`}>
              {queue.people.map((person) => (
                <Walker
                  key={person.id}
                  x={qx(person.x)}
                  y={167}
                  phase={simTime * 7 + person.id * 0.4}
                />
              ))}
              <path
                d={`M${qx(queue.observerX)} 91V281`}
                stroke="#bca778"
                strokeDasharray="3 5"
                opacity=".65"
              />
              <Walker
                x={qx(queue.observerX)}
                y={264}
                phase={speed === 0 ? 0 : simTime * Math.abs(speed) * 7}
                observer
              />
              {speed !== 0 && (
                <path
                  d={`M${qx(queue.observerX)} 210h${speed > 0 ? 30 : -30}`}
                  stroke="#a18a60"
                  strokeWidth="2"
                  markerEnd={`url(#${id}-arrow)`}
                />
              )}
              <circle
                cx={qx(queue.observerX)}
                cy="143"
                r={queue.sinceLastEncounter < 0.16 && simTime > 0 ? 14 : 0}
                fill="none"
                stroke="#bea66b"
                strokeWidth="2"
              />
            </g>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {currentMode === 'buzzer'
          ? showArrivals
            ? null
            : t(
                sound.radialSpeed > 0.1
                  ? '向听者靠近：到达更密'
                  : sound.radialSpeed < -0.1
                    ? '离听者远去：到达更疏'
                    : '声源频率始终不变',
              )
          : t(
              speed < 0
                ? '观察者逆着队伍行走'
                : speed > 0
                  ? '观察者顺着队伍慢行'
                  : '观察者站在路旁不动',
            )}
      </p>
      {currentMode === 'queue' && (
        <p className="lab-apparatus-caption">{t('队伍：1 m/s · 相邻间隔2 m')}</p>
      )}
      <div className="textbook-em-meters">
        {currentMode === 'buzzer' ? (
          <>
            <span>
              {t('发声')} <b>600 Hz</b>
            </span>
            <span>
              {t('收到')} <b>{sound.frequency.toFixed(1)} Hz</b>
            </span>
            <span>
              Δt <b>{(sound.interval * 1000).toFixed(3)} ms</b>
            </span>
          </>
        ) : (
          <>
            <span>
              {t('过人频率')}{' '}
              <b>
                {queue.perMinute.toFixed(0)} {t('人/分')}
              </b>
            </span>
            <span>
              {t('本次已遇到')}{' '}
              <b>
                {queue.encounters} {t('人')}
              </b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="segmented">
            {(['buzzer', 'queue'] as const).map((m) => (
              <button
                key={m}
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  setTime(0);
                }}
              >
                {t(m === 'buzzer' ? '旋转蜂鸣器' : '行进队列')}
              </button>
            ))}
          </div>
          {mode === 'buzzer' ? (
            <>
              <Range
                label={t('每秒转数')}
                min={0}
                max={2}
                step={0.1}
                value={rotation}
                onChange={setRotation}
                unit="s⁻¹"
              />
              <Range
                label={t('旋转半径')}
                min={0.8}
                max={1.5}
                step={0.1}
                value={radius}
                onChange={setRadius}
                unit="m"
              />
              <Range
                label={t('观察时刻')}
                min={0}
                max={1}
                step={0.001}
                value={time}
                onChange={setTime}
                unit="s"
              />
              <div className="segmented">
                <button aria-pressed={tone.on} onClick={tone.toggle}>
                  {t(tone.on ? '停止音调试听' : '试听当前接收音调')}
                </button>
              </div>
              {tone.unavailable && <p>{t('声音不可用，波峰与频率读数仍可观察。')}</p>}
            </>
          ) : (
            <>
              <div className="segmented">
                {[
                  [0, '站立'],
                  [-0.5, '逆行'],
                  [0.5, '同向慢行'],
                ].map(([v, label]) => (
                  <button
                    key={v}
                    aria-pressed={observerSpeed === v}
                    onClick={() => {
                      setObserverSpeed(Number(v));
                      setTime(0);
                    }}
                  >
                    {t(String(label))}
                  </button>
                ))}
              </div>
              <Range
                label={t('观察者速度')}
                min={-0.8}
                max={0.8}
                step={0.1}
                value={observerSpeed}
                onChange={setObserverSpeed}
                unit="m/s"
              />
              <Range
                label={t('队列经过时间')}
                min={0}
                max={6}
                step={0.02}
                value={time}
                onChange={setTime}
                unit="s"
              />
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('波峰身份与计时约定')}</summary>
        <p>
          {t(
            '圆形线是三维声波波面的水平截面，每个圆心保留在发出位置。空气静止，声速340米每秒；听者距转轴5米。接收频率使用迟滞发出时刻的径向速度，屏幕运动放慢；到达刻度比较同一批连续波峰，并分别对齐首个刻度。可选纯音是当前频率的合成试听。队列的人只代表波峰，间隔2米、速度1米每秒；从计时开始之后计数，初始相齐者不重复算入。顺行观察者始终慢于队伍。',
          )}
        </p>
      </details>
    </div>
  );
}
