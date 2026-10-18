import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  cutString,
  sandbagCone,
  centripetalRig,
  funnelOrbit,
} from '../../models/centripetal-force-lab';
import { pulleyLoop, TAU } from '../../models/mechanisms';
import '../../styles/centripetal-force-lab.css';
const P = (x: number, y: number, z: number) => ({
  x: 220 + x * 160 + y * 70,
  y: 262 + y * 45 - z * 220,
});
function Rig({ time, comparison }: { time: number; comparison: string }) {
  const a = centripetalRig(),
    b = centripetalRig(
      comparison === 'mass' ? 0.08 : 0.04,
      comparison === 'radius' ? 0.3 : 0.15,
      comparison === 'speed' ? 12 : 6,
    ),
    fast = comparison === 'speed',
    ra = fast ? 0.1 : 0.075,
    rb = fast ? 0.05 : 0.075,
    bz = fast ? 0.07 : 0.1,
    loop = pulleyLoop({ x: -0.52, y: 0 }, { x: 0.52, y: 0 }, ra, rb),
    points = Array.from({ length: 120 }, (_, i) =>
      loop.sample((i / 120) * loop.length + time * 6 * ra),
    );
  const poly = (q: { x: number; y: number; z: number }[], close = false) =>
    q
      .map((v, i) => {
        const p = P(v.x, v.y, v.z);
        return `${i ? 'L' : 'M'}${p.x} ${p.y}`;
      })
      .join(' ') + (close ? 'Z' : '');
  const circle = (cx: number, z: number, r: number) =>
    poly(
      Array.from({ length: 49 }, (_, i) => ({
        x: cx + r * Math.cos((i / 48) * TAU),
        y: r * Math.sin((i / 48) * TAU),
        z,
      })),
    );
  return (
    <svg
      viewBox="0 0 440 320"
      role="img"
      aria-label={t('变速塔轮带动两个旋转槽，球压挡板，经杠杆拉动弹簧测力套筒')}
    >
      <path
        d={poly(
          [
            { x: -0.85, y: -0.3, z: 0.015 },
            { x: 0.85, y: -0.3, z: 0.015 },
            { x: 0.85, y: 0.3, z: 0.015 },
            { x: -0.85, y: 0.3, z: 0.015 },
          ],
          true,
        )}
        fill="#d7dfcb"
        stroke="#b3c3a5"
      />
      {[-0.75, 0.75].map((x) => (
        <path
          key={x}
          d={poly([
            { x, y: 0.24, z: 0 },
            { x, y: 0.24, z: -0.15 },
          ])}
          stroke="#a4b59a"
          strokeWidth="5"
        />
      ))}
      {[-0.52, 0.52].map((cx, i) => (
        <g key={i}>
          {[0.07, 0.1, 0.13].map((z, j) => (
            <path
              key={j}
              d={circle(cx, z, (i ? [0.05, 0.075, 0.1] : [0.1, 0.075, 0.05])[j])}
              fill="#c2ceb4"
              stroke="#9eb18c"
              strokeWidth="3"
            />
          ))}
          <path
            d={poly([
              { x: cx, y: 0, z: 0.02 },
              { x: cx, y: 0, z: 0.8 },
            ])}
            stroke="#9bb18e"
            strokeWidth="5"
          />
        </g>
      ))}
      <path
        d={poly(
          points.map((q) => ({ ...q, z: bz })),
          true,
        )}
        stroke="#9eab8c"
        strokeWidth="2.3"
        fill="none"
      />
      {[0, 30, 60, 90].map((i) => {
        const q = P(points[i].x, points[i].y, bz);
        return <circle key={i} cx={q.x} cy={q.y} r="2" fill="#bda574" />;
      })}
      {[a, b].map((s, i) => {
        const cx = i ? 0.52 : -0.52,
          theta = s.omega * time + (i ? Math.PI : 0),
          R = (r: number, z: number, offset = 0) => ({
            x: cx + r * Math.cos(theta) - offset * Math.sin(theta),
            y: r * Math.sin(theta) + offset * Math.cos(theta),
            z: 0.24 + z,
          }),
          l = s.lever,
          ball = P(
            ...([R(s.radius, 0.025).x, R(s.radius, 0.025).y, R(s.radius, 0.025).z] as [
              number,
              number,
              number,
            ]),
          ),
          collarTop = P(cx, 0, 0.24 + l.endZ),
          collarBottom = P(cx, 0, 0.24 + l.endZ - 0.17);
        return (
          <g key={i}>
            <path
              d={poly(
                [R(-0.04, 0, -0.035), R(0.45, 0, -0.035), R(0.45, 0, 0.035), R(-0.04, 0, 0.035)],
                true,
              )}
              fill="#c5d2b7"
              stroke="#98b18d"
            />
            <path d={poly([R(-0.03, 0.005), R(0.44, 0.005)])} stroke="#a9ba9a" strokeWidth="2" />
            {Array.from({ length: 12 }, (_, j) => {
              const q = P(cx, 0, 0.24 + 0.32 - j * 0.008);
              return (
                <path
                  key={j}
                  d={`M${q.x - 3} ${q.y}h6`}
                  stroke={j % 2 ? '#e9ecd9' : '#c09a7b'}
                  strokeWidth="1.8"
                />
              );
            })}
            <path
              d={`M${collarTop.x} ${collarTop.y}L${collarBottom.x} ${collarBottom.y}`}
              stroke="#8ba282"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path d={poly([R(l.pivot, 0.02), R(l.pivot, l.zp)])} stroke="#91a685" strokeWidth="4" />
            <path
              d={poly([R(l.stopX, l.stopZ), R(l.pivot, l.zp), R(l.endX, l.endZ)])}
              stroke="#a3b28e"
              strokeWidth="4"
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d={poly([R(l.endX, l.endZ), { x: cx, y: 0, z: 0.24 + l.endZ }])}
              stroke="#a3b28e"
              strokeWidth="3"
            />
            <path
              d={poly([R(s.radius + 0.025, 0.014), R(s.radius + 0.025, 0.071)])}
              stroke="#8da780"
              strokeWidth="5"
            />
            <path
              d={poly([R(s.radius + 0.025, l.stopZ), R(l.stopX, l.stopZ)])}
              stroke="#a3b28e"
              strokeWidth="2"
            />
            <circle
              cx={ball.x}
              cy={ball.y}
              r={i && comparison === 'mass' ? 7 : 5.5}
              fill="#b7c7aa"
              stroke="#8fa784"
            />
            <path
              d={poly([R(s.radius, 0.025), R(s.radius - 0.075, 0.025)])}
              stroke="#b3986b"
              strokeWidth="2"
            />
          </g>
        );
      })}
      <path
        d={poly([
          { x: -0.52, y: 0, z: -0.025 },
          { x: -0.52 + 0.11 * Math.cos(time * 6), y: 0.11 * Math.sin(time * 6), z: -0.025 },
          { x: -0.52 + 0.11 * Math.cos(time * 6), y: 0.11 * Math.sin(time * 6), z: -0.11 },
        ])}
        stroke="#9aae91"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}
export default function CentripetalForceLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState(
      film.variant?.includes('sandbag')
        ? 'bag'
        : film.variant?.includes('funnel')
          ? 'funnel'
          : film.variant?.includes('cut-string')
            ? 'cut'
            : 'rig',
    ),
    [time, setTime] = useState(0.5),
    [comparison, setComparison] = useState('mass'),
    [omega, setOmega] = useState(4.5),
    [length, setLength] = useState(0.8),
    [radius, setRadius] = useState(0.2),
    c = film.chapter,
    p = film.chapterProgress,
    kind = film.watch ? (c === 0 ? 'cut' : c === 1 ? 'bag' : c < 6 ? 'rig' : 'funnel') : mode,
    compare = film.watch
      ? c === 3
        ? 'mass'
        : c === 4
          ? 'radius'
          : c === 5
            ? 'speed'
            : 'same'
      : comparison,
    physical = film.watch ? Math.min(1, p / 0.84) * (kind === 'cut' ? 1.25 : 2) : time,
    cut = cutString(physical),
    bag = sandbagCone(physical, 0.08, length, omega),
    funnel = funnelOrbit(physical, radius),
    rigA = centripetalRig(),
    rigB = centripetalRig(
      compare === 'mass' ? 0.08 : 0.04,
      compare === 'radius' ? 0.3 : 0.15,
      compare === 'speed' ? 12 : 6,
    );
  const Q = (x: number, y: number, z: number) => ({
      x: 205 + x * 220 + y * 85,
      y: 255 + y * 60 - z * 215,
    }),
    F = (x: number, y: number, z: number) => ({
      x: 195 + x * 165 + y * 75,
      y: 265 + y * 40 - z * 205,
    });
  const bp = F(bag.x, bag.y, 0.95 - bag.vertical),
    hand = F(0, 0, 0.95),
    fp = Q(funnel.x, funnel.y, funnel.height),
    circle = (r: number, z: number) =>
      Array.from({ length: 65 }, (_, i) => {
        const q = Q(r * Math.cos((i / 64) * TAU), r * Math.sin((i / 64) * TAU), z);
        return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
      }).join(' ');
  return (
    <section className="centripetal-force-lab">
      <header>
        <p>
          {t(
            kind === 'cut'
              ? '剪断绳子，球沿切线离开'
              : kind === 'bag'
                ? '手感受到的是绳张力，它还要托住重力'
                : kind === 'funnel'
                  ? '漏斗壁的支持力与重力合成向心力'
                  : compare === 'mass'
                    ? '只改变质量，比较两球向心力'
                    : compare === 'radius'
                      ? '角速度相同，改变轨道半径'
                      : compare === 'speed'
                        ? '角速度加倍，向心力怎样变化？'
                        : '先看清挡板、杠杆与测力套筒的传力路径',
          )}
        </p>
        <span>
          {t(
            kind === 'rig'
              ? '双球向心力演示器'
              : kind === 'bag'
                ? '水平圆周 · 绳子实际倾斜'
                : kind === 'cut'
                  ? '光滑水平桌面'
                  : '光滑漏斗 · 水平圆周',
          )}
        </span>
      </header>
      <div className="centripetal-force-stage">
        {kind === 'rig' ? (
          <Rig time={physical} comparison={compare} />
        ) : (
          <svg
            viewBox="0 0 410 325"
            role="img"
            aria-label={t(
              kind === 'cut'
                ? '光滑桌面圆周运动的小球在剪断绳后沿切线运动'
                : kind === 'bag'
                  ? '倾斜绳悬挂的沙袋沿水平圆周转动，张力有向上与向心分量'
                  : '小球在透明漏斗内作水平圆周运动，斜向支持力与重力的合力水平向内',
            )}
          >
            <defs>
              <linearGradient id={`${id}glass`}>
                <stop stopColor="#d9e9db" stopOpacity=".2" />
                <stop offset=".5" stopColor="#edf2e5" stopOpacity=".4" />
                <stop offset="1" stopColor="#b9d1bb" stopOpacity=".35" />
              </linearGradient>
            </defs>
            {kind === 'cut' ? (
              <>
                <rect x="22" y="18" width="366" height="280" rx="20" fill="#eef0e4" />
                <circle
                  cx="205"
                  cy="165"
                  r="80"
                  fill="none"
                  stroke="#c8d4b8"
                  strokeDasharray="3 6"
                />
                {!cut.cut && (
                  <path
                    d={`M205 165L${205 + cut.x * 160} ${165 - cut.y * 160}`}
                    stroke="#a5946f"
                    strokeWidth="1.6"
                  />
                )}
                <circle cx="205" cy="165" r="4" fill="#93aa84" />
                <path
                  d={Array.from({ length: 70 }, (_, i) => cutString((physical * i) / 69))
                    .map((s, i) => `${i ? 'L' : 'M'}${205 + s.x * 160} ${165 - s.y * 160}`)
                    .join(' ')}
                  fill="none"
                  stroke="#afc39a"
                  strokeWidth="1.6"
                />
                <circle cx={205 + cut.x * 160} cy={165 - cut.y * 160} r="6" fill="#abc19e" />
                {physical > 0.55 && (
                  <g transform="translate(232 135) rotate(-40)">
                    <ellipse
                      cx="-10"
                      cy="-6"
                      rx="7"
                      ry="4"
                      stroke="#b0b8a0"
                      fill="none"
                      strokeWidth="2"
                    />
                    <ellipse
                      cx="-10"
                      cy="6"
                      rx="7"
                      ry="4"
                      stroke="#b0b8a0"
                      fill="none"
                      strokeWidth="2"
                    />
                    <path
                      d={`M-5-4L${cut.cut ? 12 : 9} ${cut.cut ? 2 : 10}M-5 4L${cut.cut ? 12 : 9} ${cut.cut ? -2 : -10}`}
                      stroke="#8da48a"
                      strokeWidth="2"
                    />
                    <circle r="2" fill="#94a98a" />
                  </g>
                )}
              </>
            ) : kind === 'bag' ? (
              <>
                <path
                  d={Array.from({ length: 65 }, (_, i) => {
                    const q = F(
                      bag.radius * Math.cos((i / 64) * TAU),
                      bag.radius * Math.sin((i / 64) * TAU),
                      0.95 - bag.vertical,
                    );
                    return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#c5d1b5"
                  strokeDasharray="4 5"
                />
                <path
                  d={`M${hand.x + 22} ${hand.y + 63}L${hand.x + 9} ${hand.y + 22}L${hand.x} ${hand.y + 3}`}
                  stroke="#d1bb9d"
                  strokeWidth="13"
                  fill="none"
                  strokeLinecap="round"
                />
                <ellipse cx={hand.x} cy={hand.y} rx="10" ry="7" fill="#d7c4a8" />
                <path
                  d={`M${hand.x} ${hand.y}L${bp.x} ${bp.y}`}
                  stroke="#a5926d"
                  strokeWidth="1.5"
                />
                <path
                  d={`M${bp.x - 10} ${bp.y - 11}Q${bp.x - 15} ${bp.y + 12} ${bp.x} ${bp.y + 14}Q${bp.x + 15} ${bp.y + 12} ${bp.x + 10} ${bp.y - 11}Z`}
                  fill="#c4b68c"
                  stroke="#a69e77"
                />
                <path d={`M${bp.x - 9} ${bp.y - 10}h18`} stroke="#9b9773" strokeWidth="2" />
              </>
            ) : (
              <>
                <path
                  d={
                    circle(0.36, 0.36) +
                    'L' +
                    Q(0.035, 0, 0.035).x +
                    ' ' +
                    Q(0.035, 0, 0.035).y +
                    'Z'
                  }
                  fill={`url(#${id}glass)`}
                  stroke="#adc5ae"
                  strokeWidth="1.2"
                />
                {[0, Math.PI].map((a, i) => {
                  const q = Q(0.36 * Math.cos(a), 0.36 * Math.sin(a), 0.36),
                    b = Q(0.035 * Math.cos(a), 0.035 * Math.sin(a), 0.035);
                  return (
                    <path
                      key={i}
                      d={`M${q.x} ${q.y}L${b.x} ${b.y}V294`}
                      stroke="#abc3ad"
                      fill="none"
                      strokeWidth="1.5"
                    />
                  );
                })}
                <path
                  d={circle(funnel.radius, funnel.height)}
                  fill="none"
                  stroke="#b0c5a6"
                  strokeDasharray="3 5"
                />
                <circle cx={fp.x} cy={fp.y} r="5" fill="#b4c5a6" stroke="#8ca283" />
                {(c === 7 || !film.watch) && (
                  <>
                    <path d={`M${fp.x} ${fp.y}v38`} stroke="#b79c70" strokeWidth="2" />
                    <path
                      d={`M${fp.x} ${fp.y}L${Q(funnel.x - 0.16 * Math.cos(funnel.angle), funnel.y - 0.16 * Math.sin(funnel.angle), funnel.height + 0.16).x} ${Q(funnel.x - 0.16 * Math.cos(funnel.angle), funnel.y - 0.16 * Math.sin(funnel.angle), funnel.height + 0.16).y}`}
                      stroke="#8eaa80"
                      strokeWidth="2"
                    />
                    <path
                      d={`M${fp.x} ${fp.y}L${Q(funnel.x - 0.16 * Math.cos(funnel.angle), funnel.y - 0.16 * Math.sin(funnel.angle), funnel.height).x} ${Q(funnel.x - 0.16 * Math.cos(funnel.angle), funnel.y - 0.16 * Math.sin(funnel.angle), funnel.height).y}`}
                      stroke="#a9b891"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  </>
                )}
              </>
            )}
          </svg>
        )}
      </div>
      <div className="centripetal-force-readings">
        {kind === 'rig' ? (
          <>
            <span>
              F₁ <b>{rigA.force.toFixed(3)} N</b>
            </span>
            <span>
              F₂ <b>{rigB.force.toFixed(3)} N</b>
            </span>
            <span>
              {t('力之比')} <b>1 : {(rigB.force / rigA.force).toFixed(1)}</b>
            </span>
          </>
        ) : kind === 'bag' ? (
          <>
            <span>
              {t('绳张力')} <b>{bag.tension.toFixed(3)} N</b>
            </span>
            <span>
              {t('向心合力')} <b>{bag.force.toFixed(3)} N</b>
            </span>
            <span>
              {t('圆周半径')} <b>{bag.radius.toFixed(3)} m</b>
            </span>
          </>
        ) : kind === 'funnel' ? (
          <>
            <span>
              {t('支持力')} <b>{funnel.normal.toFixed(3)} N</b>
            </span>
            <span>
              {t('重力')} <b>{funnel.gravity.toFixed(3)} N</b>
            </span>
            <span>
              {t('向心合力')} <b>{funnel.force.toFixed(3)} N</b>
            </span>
          </>
        ) : (
          <span>
            {t('绳张力')} <b>{cut.tension.toFixed(3)} N</b>
          </span>
        )}
      </div>
      {kind === 'rig' && (
        <p className="centripetal-force-conditions">
          m₂/m₁ = {rigB.mass / rigA.mass} <span>·</span> r₂/r₁ = {rigB.radius / rigA.radius}{' '}
          <span>·</span> ω₂/ω₁ = {rigB.omega / rigA.omega}
        </p>
      )}
      <p className="centripetal-force-cause">
        {t(
          kind === 'cut'
            ? '拉力消失后保留瞬时速度；向心力不是把球向外甩的力。'
            : kind === 'bag'
              ? '张力的竖直分量平衡重力，水平分量才提供向心力。'
              : kind === 'funnel'
                ? '向心力是合力的作用效果，不是在重力和支持力之外再增加一个力。'
                : '一次只改变一个量，标尺经杠杆与弹簧校准后比较作用力。',
        )}
      </p>
      {!film.watch && (
        <div className="centripetal-force-controls">
          <Segments
            label={t('实验路径')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'cut', label: t('剪断细绳') },
              { value: 'bag', label: t('旋转沙袋') },
              { value: 'rig', label: t('向心力仪') },
              { value: 'funnel', label: t('玻璃漏斗') },
            ]}
          />
          {kind === 'rig' ? (
            <Segments
              label={t('控制变量')}
              value={comparison}
              onChange={setComparison}
              options={[
                { value: 'same', label: t('完全相同') },
                { value: 'mass', label: t('质量加倍') },
                { value: 'radius', label: t('半径加倍') },
                { value: 'speed', label: t('角速度加倍') },
              ]}
            />
          ) : kind === 'bag' ? (
            <>
              <Range
                label={t('绳长')}
                value={length}
                min={0.65}
                max={1}
                step={0.05}
                unit="m"
                onChange={setLength}
              />
              <Range
                label={t('角速度')}
                value={omega}
                min={4}
                max={6}
                step={0.1}
                unit="rad/s"
                onChange={setOmega}
              />
            </>
          ) : kind === 'funnel' ? (
            <Range
              label={t('圆周半径')}
              value={radius}
              min={0.12}
              max={0.26}
              step={0.01}
              unit="m"
              onChange={setRadius}
            />
          ) : null}
          <Range
            label={t('模型时间')}
            value={Math.min(time, kind === 'cut' ? 1.25 : 3)}
            min={0}
            max={kind === 'cut' ? 1.25 : 3}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="centripetal-force-note">
        {t(
          kind === 'rig'
            ? '仪器按传力路径重建，刚性杠杆与滑动接头保持连接；套筒按弹簧与力矩平衡校准，不冒充具体型号的尺寸。'
            : '水平圆周为理想稳态，忽略空气阻力和摩擦；沙袋绳倾角与漏斗角速度由受力条件求得。',
        )}
      </p>
    </section>
  );
}
