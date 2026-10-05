import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  EAR_CALIBRATION,
  EAR_DEFAULT,
  EAR_IR,
  earBandRadiance,
  earMeasure,
  earShot,
  type EarFrame,
  type EarView,
} from '../../models/ear-thermometer';
import {
  EAR_ADC,
  EAR_CANAL_PATH,
  EAR_GEOMETRY,
  EAR_GUIDE_PATH,
  EAR_PROBE_ANCHORS,
  EAR_REFERENCE_ROUTES,
  EAR_SENSOR_PACKAGE,
  EAR_SIGNAL_ROUTES,
  EAR_THERMOPILE_JUNCTIONS,
  earCalibrationPath,
  earLocalPoint,
  earPointOnPath,
  earPolyline,
} from '../../models/ear-thermometer-geometry';
import { useShowcase } from '../lab/Showcase';
import '../../styles/ear-thermometer.css';

const rayColor = (region: 'drum' | 'wall') => (region === 'drum' ? '#cf764b' : '#a99871');
function Section({
  frame,
  pulse,
  reveal,
  compact = false,
  emission = false,
}: {
  frame: EarFrame;
  pulse: number;
  reveal: number;
  compact?: boolean;
  emission?: boolean;
}) {
  const id = useId().replaceAll(':', ''),
    rays = frame.rays.filter((_, i) => i % 10 === 0),
    transform = `translate(${EAR_GEOMETRY.tip.x} 0) rotate(${frame.angleDeg})`;
  return (
    <div className={`ear-section ${compact ? 'ear-section-compact' : ''}`}>
      <svg viewBox="-12 -15 43 30" role="img" aria-label={t('耳廓、耳道、鼓膜与探头接受路径剖面')}>
        <defs>
          <linearGradient id={`${id}-tissue`} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#d8bca6" />
            <stop offset=".65" stopColor="#ce987f" />
            <stop offset="1" stopColor="#dfb29b" />
          </linearGradient>
          <linearGradient id={`${id}-canal`}>
            <stop stopColor="#a88771" />
            <stop offset=".4" stopColor="#886553" />
            <stop offset="1" stopColor="#674739" />
          </linearGradient>
          <linearGradient id={`${id}-probe`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f8faf7" />
            <stop offset=".52" stopColor="#e1e8e4" />
            <stop offset="1" stopColor="#a9b8b2" />
          </linearGradient>
          <linearGradient id={`${id}-foil`}>
            <stop stopColor="#927b57" />
            <stop offset=".48" stopColor="#ded6bc" />
            <stop offset="1" stopColor="#a89c75" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy=".3"
              stdDeviation=".35"
              floodColor="#45382b"
              floodOpacity=".18"
            />
          </filter>
        </defs>
        <g transform="scale(1 -1)">
          <path
            d={EAR_GEOMETRY.tissueOutline}
            fill={`url(#${id}-tissue)`}
            stroke="#af8772"
            strokeWidth=".12"
          />
          <path
            d={EAR_GEOMETRY.pinnaFold}
            fill="none"
            stroke="#976f5d"
            strokeWidth=".5"
            strokeLinecap="round"
          />
          <path
            d="M-2 -8Q1 -7 0 -3Q-1 -1 0 1Q3 4 1 7"
            fill="none"
            stroke="#f0d9c4"
            strokeWidth=".55"
            strokeLinecap="round"
          />
          <path d={EAR_CANAL_PATH} fill={`url(#${id}-canal)`} stroke="#f1c7a8" strokeWidth=".35" />
          <path
            d={earPolyline(EAR_GEOMETRY.upper)}
            fill="none"
            stroke="#bd775f"
            strokeWidth=".13"
          />
          <path
            d={earPolyline(EAR_GEOMETRY.lower)}
            fill="none"
            stroke="#bd775f"
            strokeWidth=".13"
          />
          <path d="M26.5 -7Q28 -3 27.4 1Q27 6 25 7" fill="none" stroke="#b48873" strokeWidth=".2" />
          <path
            d="M26.9 1.4L27.6 3.4L28.4 3.8"
            fill="none"
            stroke="#e5d1b5"
            strokeWidth=".55"
            strokeLinecap="round"
          />
          <path d="M25 3.5L26 -3.5" stroke="#e6ad74" strokeWidth=".32" />
          <path d="M25.2 3.2L25.6 0L26 -3.2" stroke="#f4d9b1" strokeWidth=".09" />
          <path d="M25.4 2.7L25.8 .4" stroke="#97634b" strokeWidth=".18" />
          {!emission && reveal > 0 && (
            <path
              d={earPolyline([rays[0].points[2], ...rays.map((r) => r.points[0])], true)}
              fill="#e7b785"
              fillOpacity={0.13 * reveal}
            />
          )}
          <g
            transform={transform}
            filter={`url(#${id}-shadow)`}
            opacity={emission ? 0.3 + 0.7 * reveal : 1}
          >
            <path
              d={EAR_GEOMETRY.probeOutline}
              fill={`url(#${id}-probe)`}
              stroke="#90a59c"
              strokeWidth=".12"
            />
            <path d="M-14.1 -.1L-7 -.1" stroke="#c3ccc5" strokeWidth=".09" />
            <rect
              x="-12.5"
              y="-1.8"
              width="3.7"
              height="3.6"
              rx=".6"
              fill="#657b73"
              stroke="#a1b2a8"
              strokeWidth=".16"
            />
            <path
              d="M-12 -.8H-9.3M-12 0H-10.5M-12 .8H-9.9"
              stroke="#c3ddd0"
              strokeWidth=".25"
              strokeLinecap="round"
            />
            <ellipse cx="-7.7" cy="1.7" rx=".6" ry=".4" fill="#b0c4b9" />
            <path d={EAR_GUIDE_PATH} fill="#48534b" stroke={`url(#${id}-foil)`} strokeWidth=".12" />
            <path d="M.04 -.82L.04 .82" stroke="#b0cfce" strokeWidth=".13" opacity=".85" />
            <rect {...EAR_SENSOR_PACKAGE} rx=".18" fill="#aaad96" />
            <rect {...EAR_ADC} rx=".1" fill="#4a5c4e" />
            <rect x="-5.05" y="-.24" width=".1" height=".48" fill="#38342a" />
            {EAR_SIGNAL_ROUTES.map((points, i) => (
              <path
                key={i}
                d={earPolyline(points)}
                stroke="#ab8c5c"
                strokeWidth=".07"
                fill="none"
              />
            ))}
          </g>
          {rays.map((ray, i) => {
            const position = earPointOnPath(ray.points, (pulse + i * 0.137) % 1);
            return (
              <g key={i} opacity={Math.max(0.25, reveal)}>
                <path
                  data-emission-path={ray.region}
                  d={earPolyline(ray.points)}
                  fill="none"
                  stroke={rayColor(ray.region)}
                  strokeWidth=".07"
                  strokeOpacity={emission ? 0.2 : 0.6}
                />
                <circle cx={position.x} cy={position.y} r=".12" fill={rayColor(ray.region)} />
                <circle
                  cx={ray.points[0].x}
                  cy={ray.points[0].y}
                  r=".15"
                  fill={rayColor(ray.region)}
                />
                {emission && (
                  <circle
                    cx={ray.points[0].x}
                    cy={ray.points[0].y}
                    r={0.18 + 0.65 * ((pulse + 0.2 * i) % 1)}
                    stroke={rayColor(ray.region)}
                    strokeWidth=".045"
                    fill="none"
                    opacity={1 - ((pulse + 0.2 * i) % 1)}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {!compact && (
        <div className="ear-anatomy-labels">
          <span>{t('耳道')}</span>
          <span>
            {t('鼓膜')} <b>{frame.drumC.toFixed(1)}°C</b>
          </span>
        </div>
      )}
    </div>
  );
}
function ProbeDetail({
  frame,
  pulse,
  reference,
  showNote,
}: {
  frame: EarFrame;
  pulse: number;
  reference: boolean;
  showNote: boolean;
}) {
  const id = useId().replaceAll(':', ''),
    rays = frame.rays.filter((_, i) => i % 15 === 0),
    anchors = reference
      ? EAR_PROBE_ANCHORS.filter((anchor) => anchor.number === 2 || anchor.number === 3)
      : EAR_PROBE_ANCHORS;
  return (
    <div className="ear-probe-detail">
      <div className="ear-detail-title">
        <span>{t('同一探头 · 内部剖面')}</span>
        <span>{t('被动接收')}</span>
      </div>
      <div className="ear-probe-figure">
        <svg
          viewBox="-9.2 -2.2 11.2 4.4"
          role="img"
          aria-label={t('红外窗口、窄口波导、热电堆和封装温度参考')}
        >
          <defs>
            <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#ece1c1" />
              <stop offset=".45" stopColor="#a79771" />
              <stop offset="1" stopColor="#e1d6b3" />
            </linearGradient>
          </defs>
          <g transform="scale(1 -1)">
            <path
              d={EAR_GEOMETRY.probeOutline}
              fill="#e4e9df"
              stroke="#a8b6a6"
              strokeWidth=".045"
            />
            <path
              d={EAR_GUIDE_PATH}
              fill="#e5dfc9"
              stroke={`url(#${id}-metal)`}
              strokeWidth=".15"
            />
            <path d="M.04 -.82L.04 .82" stroke="#98bfc3" strokeWidth=".13" />
            <path d="M.18 -.9L.18 .9" stroke="#cee0d5" strokeWidth=".06" />
            <rect
              {...EAR_SENSOR_PACKAGE}
              rx=".18"
              fill="#b6b8a6"
              stroke="#858d7f"
              strokeWidth=".05"
            />
            <rect x="-6.08" y="-.88" width=".83" height="1.76" rx=".08" fill="#666b59" />
            <path d="M-5.05 -.27L-5.05 .27" stroke="#4b4134" strokeWidth=".18" />
            <path d="M-5.15 -.3L-5.15 .3" stroke="#b3a37a" strokeWidth=".05" />
            {EAR_THERMOPILE_JUNCTIONS.slice(1).map((point, i) => (
              <path
                key={i}
                d={earPolyline([EAR_THERMOPILE_JUNCTIONS[i], point])}
                stroke={i % 2 ? '#c5c6b5' : '#b9975b'}
                strokeWidth=".045"
                fill="none"
              />
            ))}
            <rect x="-6.26" y="1.08" width=".34" height=".35" rx=".06" fill="#6297a2" />
            <rect {...EAR_ADC} rx=".1" fill="#3f5148" />
            {EAR_REFERENCE_ROUTES.map((points, i) => (
              <path
                key={i}
                d={earPolyline(points)}
                stroke="#6695a0"
                strokeWidth=".05"
                fill="none"
              />
            ))}
            {EAR_SIGNAL_ROUTES.map((points, i) => (
              <path
                key={i}
                d={earPolyline(points)}
                stroke="#c17e4f"
                strokeWidth=".05"
                fill="none"
              />
            ))}
            <path d="M-8.52 0H-8.8" stroke="#927e53" strokeWidth=".08" />
            {rays.map((ray, i) => {
              const entry = earLocalPoint(ray.points[1], frame.angleDeg),
                detector = earLocalPoint(ray.points[2], frame.angleDeg),
                incoming = {
                  x: 1.5,
                  y: entry.y + 1.5 * Math.tan((ray.relativeAngleDeg * Math.PI) / 180),
                },
                points = [incoming, entry, detector],
                marker = earPointOnPath(points, (pulse + 0.16 * i) % 1);
              return (
                <g key={i}>
                  <path
                    d={earPolyline(points)}
                    fill="none"
                    stroke={rayColor(ray.region)}
                    strokeWidth=".025"
                    strokeOpacity=".8"
                  />
                  <circle cx={marker.x} cy={marker.y} r=".05" fill={rayColor(ray.region)} />
                </g>
              );
            })}
            {anchors.map((anchor) => (
              <path
                key={anchor.number}
                d={earPolyline([anchor.part, anchor.label])}
                fill="none"
                stroke={anchor.color}
                strokeWidth=".025"
                strokeDasharray=".06 .05"
              />
            ))}
          </g>
        </svg>
        {anchors.map((anchor) => (
          <span
            key={anchor.number}
            className="ear-part-anchor"
            aria-hidden="true"
            style={{
              left: `${((anchor.label.x + 9.2) / 11.2) * 100}%`,
              top: `${((2.2 - anchor.label.y) / 4.4) * 100}%`,
              color: '#58674f',
              borderColor: anchor.color,
            }}
          >
            {anchor.number}
          </span>
        ))}
      </div>
      {!reference && (
        <div className="ear-probe-labels">
          {['放大与转换', '冷端与参考', '吸收膜', '窄口与窗口'].map((label, i) => (
            <span key={label}>
              <i style={{ color: '#58674f', borderColor: EAR_PROBE_ANCHORS[i].color }}>{i + 1}</i>
              <span>{t(label)}</span>
            </span>
          ))}
        </div>
      )}
      {reference ? (
        <div className="ear-reference-channels">
          <div className="ear-channel ear-channel-net">
            <span className="ear-channel-title">
              <em className="ear-channel-number">3</em>
              <span>{t('热电堆 · 净红外信号')}</span>
            </span>
            <b>
              {frame.signalMv.toFixed(2)} <small>mV</small>
            </b>
            <i
              style={{
                width: `${Math.max(0, Math.min(1, frame.signalMv / DEFAULT_SIGNAL)) * 100}%`,
              }}
            />
          </div>
          <div className="ear-channel ear-channel-ref">
            <span className="ear-channel-title">
              <em className="ear-channel-number">2</em>
              <span>{t('参考通道 · 封装温度')}</span>
            </span>
            <b>
              {frame.sensorC.toFixed(1)} <small>°C</small>
            </b>
            <i style={{ width: `${((frame.sensorC - 15) / 20) * 100}%` }} />
          </div>
          {showNote && <p>{t('两路共同反演，组织温度保持不变')}</p>}
        </div>
      ) : (
        showNote && (
          <p className="ear-detail-note">
            {t('红外被吸收后加热薄膜；串联热电偶把温差变成电信号。')}
          </p>
        )
      )}
    </div>
  );
}
const DEFAULT_SIGNAL = earMeasure().signalMv;
function Calibration({ temperatureC, pulse }: { temperatureC: number; pulse: number }) {
  const id = useId().replaceAll(':', '');
  const signalMv = EAR_IR.gainMvPerRadiance * (earBandRadiance(temperatureC) - earBandRadiance(22)),
    x = (c: number) => 24 + (c - 33) * 31,
    y = (v: number) => 142 - (v / DEFAULT_SIGNAL) * 76;
  return (
    <div className="ear-calibration">
      <div className="ear-calibration-object">
        <svg viewBox="-15 -6 45 12" role="img" aria-label={t('同一探头观察已知温度的黑体腔')}>
          <defs>
            <linearGradient id={`${id}-cavity-depth`}>
              <stop stopColor="#514539" />
              <stop offset="1" stopColor="#171f1b" />
            </linearGradient>
          </defs>
          <g transform="scale(1 -1)">
            <path
              d="M10 -4.2H27V4.2H10V1.3L21 0L10 -1.3Z"
              fill="#bbb59d"
              stroke="#888d78"
              strokeWidth=".12"
            />
            <path d="M10 -1.3L21 0L10 1.3Z" fill={`url(#${id}-cavity-depth)`} />
            <path
              d={EAR_GEOMETRY.probeOutline}
              transform="translate(4 0)"
              fill="#dbe4dc"
              stroke="#95a49b"
              strokeWidth=".1"
            />
            <g transform={`translate(${EAR_GEOMETRY.tip.x} 0)`}>
              <path d={EAR_GUIDE_PATH} fill="#4d5142" stroke="#b1a17c" strokeWidth=".12" />
              <path d="M.04 -.82L.04 .82" stroke="#a7cbcb" strokeWidth=".13" />
              <rect {...EAR_SENSOR_PACKAGE} rx=".18" fill="#aeaf94" />
              <rect {...EAR_ADC} rx=".1" fill="#4a5c4e" />
            </g>
            {[-0.6, 0, 0.6].map((offset, i) => {
              const points = earCalibrationPath(offset),
                p = earPointOnPath(points, (pulse + i * 0.2) % 1);
              return (
                <g key={i}>
                  <path d={earPolyline(points)} fill="none" stroke="#c6804e" strokeWidth=".07" />
                  <circle cx={p.x} cy={p.y} r=".13" fill="#c6804e" />
                </g>
              );
            })}
          </g>
        </svg>
        <span>
          {t('已知温度的黑体腔')} <b>{temperatureC.toFixed(1)}°C</b>
        </span>
      </div>
      <div className="ear-calibration-curve">
        <div className="ear-chart-axes">
          <span>{t('净信号')}</span>
          <span>{t('校准参考为 22°C')}</span>
        </div>
        <svg viewBox="0 0 275 160" role="img" aria-label={t('已知温度与净信号的标定关系')}>
          <path d="M24 12V142H252" fill="none" stroke="#abb7a8" />
          <path
            d={
              'M' +
              Array.from({ length: 61 }, (_, i) => {
                const c = 33 + (i * 8) / 60;
                return `${x(c)},${y(EAR_IR.gainMvPerRadiance * (earBandRadiance(c) - earBandRadiance(22)))}`;
              }).join('L')
            }
            fill="none"
            stroke="#ba8654"
            strokeWidth="2"
          />
          {EAR_CALIBRATION.map((point) => (
            <circle
              key={point.temperatureC}
              cx={x(point.temperatureC)}
              cy={y(point.signalMv)}
              r="3.5"
              fill="#697f69"
            />
          ))}
          <path
            d={`M${x(temperatureC)} 142V${y(signalMv)}H24`}
            fill="none"
            stroke="#c0915c"
            strokeDasharray="3 4"
          />
          <circle cx={x(temperatureC)} cy={y(signalMv)} r="5" fill="#d39058" />
        </svg>
        <div className="ear-chart-ticks">
          <span>34°C</span>
          <span>37°C</span>
          <span>40°C</span>
        </div>
      </div>
      <p className="ear-scope">
        {t('理想 8–14 μm 带通与示例增益；真实仪器另有光学响应和校准参数。')}
      </p>
    </div>
  );
}
export default function EarThermometer() {
  const film = useShowcase(),
    id = useId(),
    [angleDeg, setAngle] = useState(0),
    [sensorC, setSensor] = useState(22),
    [drumC, setDrum] = useState(37),
    [equalWall, setEqualWall] = useState(false),
    [view, setView] = useState<EarView>('ear');
  const directed = earShot(film.chapter, film.chapterProgress),
    input = film.watch
      ? directed.input
      : {
          ...EAR_DEFAULT,
          angleDeg,
          sensorC,
          drumC,
          ...(equalWall ? { outerWallC: drumC, innerWallC: drumC } : {}),
        },
    frame = useMemo(
      () => earMeasure(input),
      [input.angleDeg, input.sensorC, input.drumC, input.outerWallC, input.innerWallC],
    ),
    mode = film.watch ? directed.view : view,
    pulse = film.watch ? directed.pulse : 0.6,
    close = mode === 'probe' || mode === 'reference',
    calibrationC = film.watch ? directed.calibrationC : drumC;
  return (
    <section
      className="ear-study"
      data-view={mode}
      data-watch={film.watch}
      data-angle={frame.angleDeg}
    >
      <header className="ear-heading">
        <span>THERMAL RADIATION</span>
        <b>{t('探头看见的温度')}</b>
      </header>
      {mode === 'calibration' ? (
        <Calibration temperatureC={calibrationC} pulse={pulse} />
      ) : (
        <>
          <Section
            frame={frame}
            pulse={pulse}
            reveal={film.watch ? directed.reveal : 1}
            compact={close}
            emission={mode === 'emission'}
          />
          {close ? (
            <ProbeDetail
              frame={frame}
              pulse={pulse}
              reference={mode === 'reference'}
              showNote={!film.watch}
            />
          ) : (
            <div className="ear-source-strip">
              <span className="ear-source-drum">
                <i />
                {t('鼓膜信号')} <b>{Math.round(frame.drumSignalFraction * 100)}%</b>
              </span>
              <span className="ear-source-wall">
                <i />
                {t('耳道壁信号')} <b>{Math.round((1 - frame.drumSignalFraction) * 100)}%</b>
              </span>
            </div>
          )}
          <div className="ear-readout">
            <span>{t('教学模型读数')}</span>
            <output>
              {frame.compensatedC.toFixed(1)}
              <small>°C</small>
            </output>
            <span>{mode === 'reference' ? t('参考补偿后') : t('组织 → 探头')}</span>
          </div>
          {mode === 'mix' && (
            <p className="ear-mix-note">{t('组织温度没变；偏转改变了视场中的信号比例。')}</p>
          )}
        </>
      )}
      {!film.watch && (
        <div className="ear-explore">
          <div className="ear-view-choice" role="group" aria-label={t('耳温枪观察方式')}>
            {(
              [
                ['ear', '看视场'],
                ['probe', '看探头内部'],
                ['reference', '看参考补偿'],
                ['calibration', '看黑体标定'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-angle`}>
            {t('探头偏转')}
            <output>{angleDeg.toFixed(0)}°</output>
          </label>
          <input
            id={`${id}-angle`}
            type="range"
            min="-24"
            max="24"
            step="1"
            value={angleDeg}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
          <div className="ear-input-pair">
            <div>
              <label htmlFor={`${id}-reference`}>
                {t('封装参考温度')}
                <output>{sensorC.toFixed(0)}°C</output>
              </label>
              <input
                id={`${id}-reference`}
                type="range"
                min="15"
                max="35"
                step="1"
                value={sensorC}
                onChange={(e) => setSensor(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor={`${id}-drum`}>
                {t('鼓膜示例温度')}
                <output>{drumC.toFixed(1)}°C</output>
              </label>
              <input
                id={`${id}-drum`}
                type="range"
                min="34"
                max="40"
                step=".1"
                value={drumC}
                onChange={(e) => setDrum(Number(e.target.value))}
              />
            </div>
          </div>
          <label className="ear-uniform">
            <input
              type="checkbox"
              checked={equalWall}
              onChange={(e) => setEqualWall(e.target.checked)}
            />
            {t('把所有可见组织设为同温')}
          </label>
          <p className="ear-scope">
            {t('二维直达光路、黑表面、稳态封装与理想带通；不预测真实体温。')}
          </p>
        </div>
      )}
    </section>
  );
}
