import { useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import {
  EXCAVATOR,
  excavatorHydraulics,
  excavatorPose,
  excavatorShot,
  type Valve,
} from '../../models/excavator';
import ExcavatorStudio, { type ExcavatorVisual } from '../three/ExcavatorStudio';
import ExcavatorInstruments from '../lab/ExcavatorInstruments';
import '../../styles/excavator.css';

/** Callout text and its pixel offset from the projected anchor. */
const LABELS: Record<string, [string, number, number]> = {
  boomCylinder: ['动臂缸', -48, -36],
  stickCylinder: ['斗杆缸', -40, -44],
  bucketCylinder: ['铲斗缸', 44, -40],
  piston: ['活塞', 84, 0],
  capEnd: ['无杆腔', 84, 40],
  rodEnd: ['有杆腔', 84, -44],
  pistonFace: ['活塞面积 A', 90, 6],
  pivot: ['动臂支点', -60, 66],
  leverArm: ['力臂 d', 76, -34],
  rocker: ['摇臂', -70, -36],
  link: ['连杆', 70, -14],
  bucketPin: ['铲斗销', -70, 40],
  relief: ['溢流阀', -30, 54],
};
const EMPHASIS = ['none', 'none', 'pressure', 'speed', 'arm', 'none', 'relief'] as const;
const deg = (r: number) => (r * 180) / Math.PI,
  rad = (d: number) => (d * Math.PI) / 180;

export default function Excavator() {
  const film = useShowcase();
  const [boom, setBoom] = useState(35),
    [stick, setStick] = useState(-92),
    [curl, setCurl] = useState(80),
    [payload, setPayload] = useState(1200),
    [flow, setFlow] = useState(60),
    [valve, setValve] = useState<Valve>('hold'),
    [cutaway, setCutaway] = useState(true),
    [showLabels, setShowLabels] = useState(true),
    [anchored, setAnchored] = useState(false);
  const labelHost = useRef<HTMLDivElement>(null);
  const chapterSeconds =
    (film.chapters[film.chapter + 1]?.at ?? film.duration) - (film.chapters[film.chapter]?.at ?? 0);
  const shot = film.watch
    ? excavatorShot({
        chapter: film.chapter,
        chapterProgress: film.chapterProgress,
        chapterTime: film.chapterTime,
        chapterSeconds,
      })
    : null;
  const state = shot ?? {
    pose: { boom: rad(boom), stick: rad(stick), curl: rad(curl) },
    payload,
    flow,
    valve,
    anchored,
    demand: 1,
    view: 'wide' as const,
    cutaway: cutaway ? 1 : 0,
    lever: showLabels,
    forceArrow: false,
    rock: anchored,
    labels: showLabels
      ? cutaway
        ? ['piston', 'capEnd', 'rodEnd', 'pivot', 'leverArm']
        : ['boomCylinder', 'stickCylinder', 'bucketCylinder', 'rocker']
      : [],
  };
  const pose = excavatorPose(state.pose);
  const h = excavatorHydraulics(
    pose,
    state.payload,
    state.flow,
    state.valve,
    state.anchored,
    state.demand,
  );
  const visual: ExcavatorVisual = {
    pose: state.pose,
    payload: state.payload,
    flow: state.flow,
    valve: state.valve,
    relief: h.relief,
    pressure: h.pressure / EXCAVATOR.relief,
    force: h.force,
    view: state.view,
    cutaway: state.cutaway,
    lever: state.lever,
    forceArrow: state.forceArrow,
    rock: state.rock,
    labels: state.labels,
  };
  const emphasis = film.watch ? EMPHASIS[film.chapter] : 'none';
  const showInstruments = !film.watch || (film.chapter !== 0 && film.chapter !== 5);
  return (
    <div className="excavator-study" data-view={state.view}>
      <div className="excavator-stage">
        <ExcavatorStudio visual={visual} labelHost={labelHost} />
        <div className="excavator-labels" ref={labelHost} aria-hidden="true">
          <svg>
            {state.labels.map((key) => (
              <g key={key} data-accent={key === 'leverArm' || key === 'relief'}>
                <line data-leader={key} />
                <circle data-dot={key} r="4" />
              </g>
            ))}
          </svg>
          {state.labels.map((key) => (
            <span
              key={key}
              data-label={key}
              data-dx={LABELS[key][1]}
              data-dy={LABELS[key][2]}
              data-accent={key === 'leverArm' || key === 'relief'}
            >
              {t(LABELS[key][0])}
            </span>
          ))}
        </div>
        <span className="excavator-tag">HYDRAULIC EXCAVATOR</span>
      </div>
      {showInstruments && (
        <ExcavatorInstruments
          h={h}
          payload={state.payload}
          flow={state.flow}
          valve={state.valve}
          anchored={state.anchored}
          emphasis={emphasis}
          watch={film.watch}
        />
      )}
      {!film.watch && (
        <div className="excavator-controls">
          <div className="excavator-control-group">
            <p className="excavator-control-title">{t('姿态')}</p>
            <Range
              label={t('动臂')}
              value={boom}
              onChange={setBoom}
              min={Math.ceil(deg(EXCAVATOR.limits.boom[0]))}
              max={Math.floor(deg(EXCAVATOR.limits.boom[1]))}
              unit="°"
            />
            <Range
              label={t('斗杆')}
              value={stick}
              onChange={setStick}
              min={Math.ceil(deg(EXCAVATOR.limits.stick[0]))}
              max={Math.floor(deg(EXCAVATOR.limits.stick[1]))}
              unit="°"
            />
            <Range
              label={t('铲斗收拢')}
              value={curl}
              onChange={setCurl}
              min={Math.ceil(deg(EXCAVATOR.limits.curl[0]))}
              max={Math.floor(deg(EXCAVATOR.limits.curl[1]))}
              unit="°"
            />
          </div>
          <div className="excavator-control-group">
            <p className="excavator-control-title">{t('液压')}</p>
            <Range
              label={t('斗内载荷')}
              value={payload}
              onChange={setPayload}
              min={0}
              max={EXCAVATOR.limits.payload[1]}
              step={50}
              unit="kg"
            />
            <Range
              label={t('动臂供油流量')}
              value={flow}
              onChange={setFlow}
              min={0}
              max={EXCAVATOR.limits.flow[1]}
              step={10}
              unit="L/min"
            />
            <Segments
              value={valve}
              onChange={setValve}
              label={t('动臂阀')}
              options={[
                { value: 'lift', label: t('举升') },
                { value: 'hold', label: t('保持') },
              ]}
            />
          </div>
          <div className="excavator-toggles">
            <button className="btn" aria-pressed={cutaway} onClick={() => setCutaway(!cutaway)}>
              {t('剖开动臂缸')}
            </button>
            <button
              className="btn"
              aria-pressed={showLabels}
              onClick={() => setShowLabels(!showLabels)}
            >
              {t('标注与力臂')}
            </button>
            <button className="btn" aria-pressed={anchored} onClick={() => setAnchored(!anchored)}>
              {t('斗齿卡在石头下')}
            </button>
          </div>
          <details className="excavator-limit">
            <summary>{t('模型边界')}</summary>
            <p>
              {t(
                '平面刚性机构与准静态液压模型：两支动臂缸均分流量，忽略摩擦、惯性、回油背压与土壤阻力；姿态滑块用于比较静态工况，不模拟操作手柄。37.3 MPa 是本篇的主溢流设定，不是任何机型的起重能力表。',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
