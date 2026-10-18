import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  LAMINA_SHAPES,
  LAMINA_WEIGHT,
  suspensionState,
  suspensionHoles,
  suspensionMotion,
  suspensionTimedShot,
  recordPlumb,
  intersectRecords,
  polygonCentroid,
  type Point2,
  type PlumbRecord,
} from '../../models/suspension-center-of-gravity';
import '../../styles/suspension-center-of-gravity.css';
const GREEN = '#376f63',
  GOLD = '#ab693e',
  BLUE = '#537e96',
  INK = '#35564f';
type Shape = keyof typeof LAMINA_SHAPES;
export default function SuspensionCenterOfGravity() {
  const film = useShowcase(),
    id = useId().replaceAll(':', ''),
    { host, width, compact } = useSignalWidth(),
    en = browserLocale() === 'en';
  const say = (zh: string, english: string) => (en ? english : zh);
  const [shape, setShape] = useState<Shape>('irregular'),
    [pivot, setPivot] = useState(0),
    [mass, setMass] = useState(0),
    [seconds, setSeconds] = useState(10),
    [marks, setMarks] = useState<PlumbRecord[]>([]),
    [reveal, setReveal] = useState(false),
    [damping, setDamping] = useState(1.2);
  const directed = useMemo(
    () => suspensionTimedShot(film.chapter, film.chapterTime, en ? 'en' : 'zh'),
    [film.chapter, film.chapterTime, en],
  );
  const kind = film.watch ? directed.kind : shape,
    points = LAMINA_SHAPES[kind],
    chosen = film.watch ? directed.pivot : pivot,
    added = film.watch ? directed.mass : mass;
  const motion = film.watch
      ? directed.motion
      : suspensionMotion(points, chosen, seconds, added, undefined, damping),
    held = film.watch && directed.held;
  const records = film.watch ? directed.records : marks,
    plumb = film.watch ? directed.plumb : true,
    gravity = film.watch ? directed.gravity : true,
    medians = kind === 'triangle' && (film.watch ? directed.medians : true),
    showCenter = film.watch ? directed.showCenter : reveal,
    predict = film.watch && directed.predict,
    predictDirection = film.watch && directed.predictDirection;
  const shot = film.watch ? directed.shot : seconds < 9 ? 'turning' : 'explore',
    holes = suspensionHoles(points),
    centroid = polygonCentroid(points);
  const height = compact ? (film.watch ? 200 : 240) : 310,
    scale = compact
      ? film.watch && kind === 'triangle'
        ? Math.min(0.9, (width - 42) / 250)
        : Math.min(0.76, (width - 42) / 305)
      : 1.14,
    origin = { x: width * (compact ? 0.52 : 0.46), y: compact ? (film.watch ? 25 : 42) : 48 };
  const project = (p: Point2) => {
    const q = motion.transform(p);
    return { x: origin.x + q.x * scale, y: origin.y + q.y * scale };
  };
  const center = project(motion.center),
    oldCenter = project(centroid),
    forceLength = (compact ? 24 : 42) * (1 + added),
    forceEnd = center.y + forceLength;
  const currentRecords = records.filter((r) => Math.abs(r.massRatio - added) < 1e-9),
    crossing = intersectRecords(currentRecords),
    crossingWorld = crossing ? project(crossing) : null;
  const outline = points.map((p) => `${p.x},${p.y}`).join(' '),
    armY = origin.y + 21,
    arm = motion.leverArm;
  const candidates =
    shot === 'candidates'
      ? [0.34, 0.56, 0.78].map((f) => ({
          x: holes[0].x + (centroid.x - holes[0].x) * f * 1.5,
          y: holes[0].y + (centroid.y - holes[0].y) * f * 1.5,
        }))
      : [];
  const clampPoint = project(points[kind === 'triangle' ? 0 : 5]);
  let label =
    shot === 'held'
      ? say('夹住 · 尚未释放', 'Held · before release')
      : shot === 'turning'
        ? say('力臂随转动改变', 'Changing lever arm')
        : shot === 'balance'
          ? say('停稳：重心在悬点下方', 'Settled: weight below pin')
          : shot === 'vertical'
            ? say('先看竖直线', 'Vertical before ink')
            : shot === 'first-mark'
              ? say('第一条墨迹', 'First ink mark')
              : shot === 'candidates'
                ? say('一条线，多个候选点', 'Many points, one line')
                : shot === 'rehang'
                  ? say('换孔 C · 夹住后释放', 'Hole C · hold, then release')
                  : shot === 'old-ink-turns'
                    ? say('旧墨迹跟着薄板转', 'Old ink turns with the board')
                    : shot === 'second-mark'
                      ? say('第二条独立记录', 'A second independent mark')
                      : shot === 'intersection'
                        ? say('两线交点：一个位置', 'Intersection: one point')
                        : shot === 'median-test' || shot === 'median-predict'
                          ? say('中线预测，悬线检验', 'Medians predict; ink tests')
                          : shot === 'clamp'
                            ? say('先夹住，再装配重', 'Clamp first, then add the mass')
                            : shot === 'predict-load'
                              ? predictDirection
                                ? say('预测方向：朝配重', 'Prediction: toward the load')
                                : predict
                                  ? say('预测：向配重走 3/7', 'Predict: 3/7 toward the load')
                                  : say('配重 = ¾ 板质量', 'Added mass = ¾ board mass')
                              : shot === 'loaded-turn'
                                ? say('配重使薄板再次转动', 'Added mass turns the card')
                                : shot === 'new-first-mark'
                                  ? say('加配重后的第一条线', 'First mark after loading')
                                  : shot === 'loaded-rehang'
                                    ? say('保留旧墨迹，换孔复查', 'Keep ink; change the hole')
                                    : shot === 'new-intersection'
                                      ? say('新交点移，旧墨迹留', 'New point; permanent old ink')
                                      : say(
                                          '移动时间，记录真正停稳的姿态',
                                          'Move time; record a settled pose',
                                        );
  return (
    <section
      ref={host}
      className="suspension-cg-lab"
      data-shot={shot}
      data-held={held}
      data-settled={motion.settled}
      data-pivot={chosen}
      data-mass={added}
      data-time={film.watch ? directed.seconds : seconds}
      data-prediction={predict}
      data-prediction-direction={predictDirection}
      data-gravity-visible={gravity}
      data-angle={motion.angle}
      data-torque={motion.gravityTorque}
      data-record-count={records.length}
      data-old-records={JSON.stringify(records.filter((r) => r.massRatio === 0))}
    >
      <svg
        className="suspension-cg-object"
        viewBox={`0 0 ${width} ${height}`}
        style={{ height }}
        role="img"
        aria-label={say(
          '同一块薄板围绕悬点转动，保留板上墨迹并用新悬线检验重心',
          'One lamina turns about a pin; permanent ink and new plumb records test its centre of gravity',
        )}
      >
        <defs>
          <clipPath id={`${id}-board-clip`}>
            <polygon points={outline} />
          </clipPath>
          <linearGradient id={`${id}-board`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e8d8b9" />
            <stop offset=".45" stopColor="#e0cca4" />
            <stop offset="1" stopColor="#c8b385" />
          </linearGradient>
          <linearGradient id={`${id}-metal`}>
            <stop stopColor="#d6dbd5" />
            <stop offset=".4" stopColor="#93a899" />
            <stop offset="1" stopColor="#dce2d9" />
          </linearGradient>
        </defs>
        <path
          d={`M ${origin.x - 37} 16 H ${origin.x + 26} M ${origin.x} 16 V ${origin.y}`}
          stroke="#9eafa1"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <g
          transform={`translate(${origin.x} ${origin.y}) scale(${scale}) rotate(${(motion.angle * 180) / Math.PI}) translate(${-motion.pivot.x} ${-motion.pivot.y})`}
        >
          <polygon points={outline} transform="translate(1.5 2.5)" fill="#b6a179" />
          <polygon points={outline} fill={`url(#${id}-board)`} stroke="#b49c6d" strokeWidth="1.3" />
          <g clipPath={`url(#${id}-board-clip)`}>
            {medians &&
              points.map((p, i) => {
                const q = points[(i + 1) % 3],
                  r = points[(i + 2) % 3];
                return (
                  <path
                    key={i}
                    d={`M ${p.x} ${p.y} L ${(q.x + r.x) / 2} ${(q.y + r.y) / 2}`}
                    stroke="#897650"
                    strokeWidth="1.2"
                    strokeDasharray="4 5"
                    opacity=".8"
                  />
                );
              })}
            {records.map((r, i) => {
              const old = Math.abs(r.massRatio - added) > 1e-9,
                a = r.ends[0],
                b = r.ends[1],
                progress =
                  film.watch &&
                  i === records.length - 1 &&
                  ['first-mark', 'second-mark'].includes(shot)
                    ? directed.recordProgress
                    : 1;
              return (
                <path
                  key={`${r.massRatio}-${r.pivot.x}-${r.pivot.y}-${i}`}
                  data-record-mass={r.massRatio}
                  d={`M ${a.x} ${a.y} L ${a.x + (b.x - a.x) * progress} ${a.y + (b.y - a.y) * progress}`}
                  stroke={r.massRatio > 0 ? BLUE : i === 0 ? GOLD : GREEN}
                  strokeWidth={r.massRatio > 0 ? 2.7 : 2.1}
                  strokeDasharray={old ? '4 3' : undefined}
                  opacity={old ? 0.58 : 1}
                />
              );
            })}
          </g>
          {holes.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#faf4e6"
              stroke="#a18c64"
              strokeWidth="1"
            />
          ))}
          {added > 0 && (
            <g>
              <circle
                cx={LAMINA_WEIGHT.x}
                cy={LAMINA_WEIGHT.y}
                r={8 + added * 3}
                fill={`url(#${id}-metal)`}
                stroke="#60786a"
                strokeWidth="1.5"
              />
              <circle
                cx={LAMINA_WEIGHT.x}
                cy={LAMINA_WEIGHT.y}
                r="3"
                fill="#b49d71"
                stroke="#60786a"
              />
            </g>
          )}
        </g>
        {plumb && (
          <>
            <path
              d={`M ${origin.x} ${origin.y} V ${height - 18}`}
              stroke={BLUE}
              strokeWidth="1.4"
              opacity=".7"
            />
            <path d={`M ${origin.x} ${height - 26} l -4 8 h 8 Z`} fill={BLUE} />
          </>
        )}
        <circle
          cx={origin.x}
          cy={origin.y}
          r="5"
          fill={`url(#${id}-metal)`}
          stroke="#587365"
          strokeWidth="1.5"
        />
        <text x={origin.x + 11} y={origin.y - 1} fill={INK}>
          {String.fromCharCode(65 + chosen)}
        </text>
        {held && (
          <g data-holding-contact="true">
            <path
              d={`M ${clampPoint.x - 21} ${clampPoint.y - 7} H ${clampPoint.x + 4} V ${clampPoint.y + 8} H ${clampPoint.x - 21}`}
              fill="#c6d1c5"
              stroke="#718e7b"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d={`M ${clampPoint.x - 15} ${clampPoint.y + 1} H ${clampPoint.x - 33}`}
              stroke="#718e7b"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        )}
        {gravity && (
          <>
            <path
              d={`M ${center.x} ${origin.y} V ${forceEnd}`}
              stroke={GOLD}
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity=".65"
            />
            <circle cx={center.x} cy={center.y} r="4" fill={GOLD} />
            <path
              d={`M ${center.x} ${center.y} V ${forceEnd} m -4 -7 l 4 7 l 4 -7`}
              stroke={GOLD}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={center.x + (center.x > width - 45 ? -12 : 10)}
              y={forceEnd - 3}
              fill={GOLD}
              textAnchor={center.x > width - 45 ? 'end' : 'start'}
            >
              mg
            </text>
            {Math.abs(arm) > 0.002 && (
              <>
                <path
                  d={`M ${origin.x} ${armY - 4} V ${armY + 4} M ${origin.x} ${armY} H ${center.x} M ${center.x} ${armY - 4} V ${armY + 4}`}
                  stroke={GOLD}
                  strokeWidth="1.5"
                />
                <text x={(origin.x + center.x) / 2} y={armY + 19} textAnchor="middle" fill={GOLD}>
                  d
                </text>
              </>
            )}
            {motion.settled && !held && shot === 'balance' && (
              <path
                d={`M ${origin.x} ${origin.y} v ${-forceLength} m -4 7 l 4 -7 l 4 7`}
                stroke={GREEN}
                strokeWidth="2.5"
                fill="none"
              />
            )}
          </>
        )}
        {candidates.map((q, i) => {
          const p = project(q);
          return (
            <circle key={i} cx={p.x} cy={p.y} r="6" fill="#f7f0df" stroke={GOLD} strokeWidth="2" />
          );
        })}
        {medians && (
          <circle
            cx={oldCenter.x}
            cy={oldCenter.y}
            r="5"
            fill="#f3e5c4"
            stroke={GOLD}
            strokeWidth="2"
          />
        )}
        {(predict || predictDirection) && (
          <>
            <path
              d={`M ${oldCenter.x} ${oldCenter.y} L ${predict ? center.x : project(LAMINA_WEIGHT).x} ${predict ? center.y : project(LAMINA_WEIGHT).y}`}
              stroke={BLUE}
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            {predict && (
              <circle
                data-prediction-point="true"
                cx={center.x}
                cy={center.y}
                r="6"
                fill="none"
                stroke={BLUE}
                strokeWidth="2"
              />
            )}
          </>
        )}
        {showCenter && crossingWorld && (
          <>
            <circle
              cx={crossingWorld.x}
              cy={crossingWorld.y}
              r="5"
              fill={added > 0 ? BLUE : GREEN}
            />
            <circle
              cx={crossingWorld.x}
              cy={crossingWorld.y}
              r="10"
              fill="none"
              stroke={added > 0 ? BLUE : GREEN}
            />
          </>
        )}
        {!compact && (
          <g transform={`translate(${width - 215} 104)`}>
            <text fill={INK}>{say('同一块板', 'The same lamina')}</text>
            <path d="M 0 17 H 147" stroke="#d4dece" />
            <text y="43" fill={GOLD}>
              {say('旧墨迹：固定在板上', 'Old ink stays on the board')}
            </text>
            {added > 0 && (
              <text y="70" fill={BLUE}>
                {say('新记录：加配重后', 'New ink: after loading')}
              </text>
            )}
            {gravity && (
              <text y={added > 0 ? 101 : 72} fill={INK}>
                {say('力臂', 'Lever arm')} d = {(Math.abs(arm) * 100).toFixed(1)} cm
              </text>
            )}
          </g>
        )}
      </svg>
      <div className="suspension-cg-shot-label">{label}</div>
      {!film.watch && (
        <div className="suspension-cg-controls">
          <Segments
            label={say('薄板形状', 'Lamina shape')}
            value={shape}
            options={[
              { value: 'irregular', label: say('不规则薄板', 'Irregular lamina') },
              { value: 'triangle', label: say('三角形纸板', 'Triangular card') },
            ]}
            onChange={(v) => {
              setShape(v);
              setPivot(0);
              setMarks([]);
              setSeconds(10);
              setReveal(false);
            }}
          />
          <div
            className="suspension-cg-pin-controls"
            role="group"
            aria-label={say('悬挂孔', 'Suspension hole')}
          >
            {holes.map((_, i) => (
              <button
                type="button"
                key={i}
                aria-pressed={chosen === i}
                onClick={() => {
                  setPivot(i);
                  setSeconds(0);
                }}
              >
                {' '}
                {String.fromCharCode(65 + i)}{' '}
              </button>
            ))}
          </div>
          <Range
            label={say('释放后时间', 'Time after release')}
            value={seconds}
            min={0}
            max={10}
            step={0.05}
            unit="s"
            onChange={setSeconds}
          />
          <Range
            label={say('配重与板的质量比', 'Added mass / board mass')}
            value={mass}
            min={0}
            max={1.5}
            step={0.05}
            onChange={(v) => {
              setMass(v);
              setSeconds(0);
            }}
          />
          <div className="suspension-cg-actions">
            <button
              type="button"
              disabled={!motion.settled}
              onClick={() =>
                setMarks((previous) => [
                  ...previous.slice(-7),
                  recordPlumb(motion.pivot, motion.angle, mass),
                ])
              }
            >
              {say('停稳后留下墨迹', 'Record settled ink')}
            </button>
            <button type="button" onClick={() => setMarks([])}>
              {say('擦除墨迹', 'Clear ink')}
            </button>
            <button type="button" aria-pressed={reveal} onClick={() => setReveal((v) => !v)}>
              {say('显示两线交点', 'Show ink intersection')}
            </button>
          </div>
          <p>
            {motion.settled
              ? say('已停稳，可以画线。', 'Settled: ready to record.')
              : say(
                  '尚未停稳；转折点的速度为零，也不能立即画线。',
                  'Not settled. Zero speed at a turning point is not enough to record.',
                )}
          </p>
          <details>
            <summary>{say('模型条件与阻尼', 'Model conditions and damping')}</summary>
            <p>
              {say(
                '均匀薄板、均匀重力场和自由转动的固定销钉；配重视为点质量。演示以转动阻力表示能量耗散，不模拟真实气流。画面时间为教学慢放。墨迹来自模型姿态，不能代替真实测量。',
                'Uniform lamina and gravity, with a freely rotating fixed pin; added mass is a point mass. Viscous rotational drag represents energy loss, not actual airflow. Motion is presented on a teaching clock. Model-generated ink is not a real measurement.',
              )}
            </p>
            <Range
              label={say('阻尼率', 'Damping rate')}
              value={damping}
              min={0}
              max={3}
              step={0.1}
              unit="s⁻¹"
              onChange={setDamping}
            />
            <p>
              {say(
                '阻尼为零时会持续摆动；重心正好在悬点上方虽也零力矩，却是不稳定平衡。',
                'With zero damping the lamina keeps swinging. A centre exactly above the pin also gives zero torque, but that equilibrium is unstable.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
