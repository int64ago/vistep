import { useId } from 'react';
import { t } from '../../i18n';
import {
  BEARING as B,
  bearingContactComparison,
  bearingRaceProfile,
  type BearingShot,
  type BearingState,
} from '../../models/ball-bearing';
import BallBearingDiagram from './BallBearingDiagram';

const titles = {
  assembly: '一条连续的支撑路径',
  contact: '两处接触，同时对上速度',
  cage: '球心前进，球身反转',
  sliding: '同样前进，接触处却不同',
  load: '承载区不跟着球转',
  patch: '放大一个接触点',
  losses: '滚动也有能量损失',
  return: '支撑转轴，允许转动',
};
function Section() {
  const section = (side: 'inner' | 'outer') => {
    const rear = bearingRaceProfile(side, false),
      front = bearingRaceProfile(side, true);
    return [rear, front].map((points, i) => (
      <path
        key={i}
        d={
          points.map((p, j) => `${j ? 'L' : 'M'}${150 + p.z * 185} ${338 - p.r * 115}`).join(' ') +
          'Z'
        }
        fill={side === 'inner' ? '#a6bac3' : '#75919f'}
        stroke="#d3dfe2"
        strokeWidth=".8"
      />
    ));
  };
  return (
    <svg viewBox="0 0 300 270" aria-label={t('轴向剖面：滚道是圆弧，球面与内外圈相切')} role="img">
      <path d="M18 234H282V260H18Z" fill="#405c67" />
      <path d={`M40 30H260V${338 - B.outside * 115}H40Z`} fill="#294a56" stroke="#597683" />
      {section('outer')}
      {section('inner')}
      <circle cx="150" cy={338 - B.pitch * 115} r={B.ball * 115} fill="#d9ba80" stroke="#f7e5b7" />
      <circle cx="150" cy={338 - (B.pitch + B.ball) * 115} r="3.5" fill="#ffe2a6" />
      <circle cx="150" cy={338 - (B.pitch - B.ball) * 115} r="3.5" fill="#ffe2a6" />
      <path d="M150 13v32m0 192v22" stroke="#d3b27b" strokeWidth="2" />
      <path d="m146 39 4 6 4-6m-8 214 4 6 4-6" fill="none" stroke="#d3b27b" strokeWidth="2" />
    </svg>
  );
}
function Contact({ state, slipping = false }: { state: BearingState; slipping?: boolean }) {
  const id = useId().replace(/:/g, ''),
    v = bearingContactComparison(slipping ? 0 : 1);
  // Local axes: horizontal tangent, vertical outward radial; the two arcs retain their true curvature.
  const scale = 128,
    centerY = 140 + B.pitch * scale,
    inner = (B.pitch - B.ball) * scale,
    outer = (B.pitch + B.ball) * scale;
  const rel = state.balls[0].spin - state.balls[0].angle;
  const arrow = (x: number, y: number, length: number, color: string) =>
    Math.abs(length) > 0.01 ? (
      <g stroke={color} strokeWidth="2" fill="none">
        <path d={`M${x} ${y}h${length}`} />
        <path
          d={`M${x + length - 5 * Math.sign(length)} ${y - 4}L${x + length} ${y}L${x + length - 5 * Math.sign(length)} ${y + 4}`}
        />
      </g>
    ) : (
      <circle cx={x} cy={y} r="3" fill={color} />
    );
  return (
    <svg
      viewBox="0 0 300 275"
      role="img"
      aria-label={
        slipping
          ? t('禁用自转的对照：两处接触都产生滑动')
          : t('跟随球心的局部视图；速度箭头仍以固定外圈为参考')
      }
    >
      <defs>
        <clipPath id={id}>
          <rect x="12" y="48" width="276" height="177" rx="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <circle cx="150" cy={centerY} r={outer + 30} fill="#506b79" />
        <circle cx="150" cy={centerY} r={outer} fill="#102b37" stroke="#b4c7cf" />
        <circle cx="150" cy={centerY} r={inner} fill="#6a8793" stroke="#b4c7cf" />
        <circle cx="150" cy="140" r={B.ball * scale} fill="#dec28b" stroke="#f5e3b9" />
        <line
          x1="150"
          y1="140"
          x2={150 + Math.sin(slipping ? -state.balls[0].angle : rel) * B.ball * scale * 0.84}
          y2={140 - Math.cos(slipping ? -state.balls[0].angle : rel) * B.ball * scale * 0.84}
          stroke="#263d47"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {[140 - B.ball * scale, 140 + B.ball * scale].map((y) => (
          <circle key={y} cx="150" cy={y} r="3" fill={slipping ? '#eea78b' : '#f9edd0'} />
        ))}
        {arrow(165, 140, 62 * v.center, '#f8e4b9')}
        {arrow(165, 140 - B.ball * scale, 62 * v.outerBall, '#f8e4b9')}
        {arrow(165, 140 + B.ball * scale, 62 * v.innerBall, '#f8e4b9')}
        {arrow(165, 207, 62, '#bfd6de')}
        {slipping && (
          <>
            {arrow(96, 140 - B.ball * scale - 9, 50 * v.outerSlip, '#efa489')}
            {arrow(121, 140 + B.ball * scale + 9, 50 * v.innerSlip, '#efa489')}
          </>
        )}
      </g>
      <text x="16" y="29">
        {t('外圈固定')} · 0
      </text>
      <text x="16" y="254">
        {t('内圈表面')} · v
      </text>
      <text x="20" y="145" className="bb-svg-muted">
        v/2
      </text>
    </svg>
  );
}
function Patch({ progress, lossIndex }: { progress: number; lossIndex: number }) {
  const a = 9 + 45 * progress,
    height = 5 + 16 * progress;
  if (lossIndex === 3)
    return (
      <svg viewBox="0 0 300 230" role="img" aria-label={t('接触式密封剖面示意，主装配未安装密封')}>
        <path d="M20 156H280V187H20Z" fill="#89a4af" />
        <path
          d="M45 25H114V75L163 148Q158 157 147 156L83 96H45Z"
          fill="#435f69"
          stroke="#78939d"
          strokeWidth="2"
        />
        <path d="M147 156h20" stroke="#e8b374" strokeWidth="4" />
        <path d="M185 173h62m-7-5 7 5-7 5" fill="none" stroke="#e9d0a2" strokeWidth="2" />
        <text x="18" y="216">
          {t('可选密封 · 主装配未安装')}
        </text>
      </svg>
    );
  return (
    <svg viewBox="0 0 300 230" role="img" aria-label={t('接触斑与润滑膜的定性放大图，不按比例')}>
      <path d="M20 157Q90 142 150 147T280 157V190H20Z" fill="#5f7e8a" />
      <path
        d="M42 20H258Q251 112 196 137Q150 148 104 137Q49 112 42 20Z"
        fill="#cdb480"
        stroke="#eddaad"
      />
      <path
        d="M65 143Q150 159 235 143"
        fill="none"
        stroke="#8acacb"
        strokeWidth={lossIndex === 2 ? 7 : 3}
      />
      <ellipse cx="150" cy="149" rx={a} ry={height} fill="#f1ae68" opacity=".50" />
      <ellipse cx="150" cy="149" rx={a * 0.62} ry={height * 0.62} fill="#ffcc8d" opacity=".62" />
      {lossIndex === 1 &&
        [-1, 1].map((sign) => (
          <path
            key={sign}
            d={`M${150 + sign * 20} 141h${sign * 23}m${-sign * 5} -4 ${sign * 5} 4 ${-sign * 5} 4`}
            stroke="#ed947b"
            strokeWidth="2"
            fill="none"
          />
        ))}
      {lossIndex === 2 &&
        [0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${40 + i * 24} ${112 + i * 9}q18 24 40 30`}
            stroke="#8acacb"
            fill="none"
            strokeWidth="2"
          />
        ))}
      <text x="150" y="219" textAnchor="middle">
        {t('形变与膜厚均夸大')}
      </text>
    </svg>
  );
}
const losses = ['材料的加载与卸载', '接触斑里的微滑', '润滑剂的剪切与搅动', '接触式密封的摩擦'];
const lossNotes = [
  '弹性形变本身不等于全部损耗；真实材料和接触过程可能耗散能量。',
  '有限接触斑内，名义滚动仍可伴随局部滑动。',
  '润滑有助于分隔表面，同时也产生流动阻力。',
  '若装有接触式密封，密封唇与旋转表面之间也有滑动。',
];
export default function BallBearingInspection({
  state,
  shot,
}: {
  state: BearingState;
  shot: BearingShot;
}) {
  const focus = shot.focus,
    ball = state.balls[0];
  return (
    <aside className="bb-inspection" data-focus={focus} aria-label={t('机械观察窗')}>
      <p className="bb-eyebrow">
        {t('机械观察窗')} <span>{String(shot.chapter + 1).padStart(2, '0')}</span>
      </p>
      <h3>{t(titles[focus])}</h3>
      <div className="bb-inspection-image">
        {(focus === 'assembly' || focus === 'return') && <Section />}
        {focus === 'contact' && <Contact state={state} />}
        {focus === 'sliding' && (
          <div className="bb-contact-pair">
            <div>
              <p>{t('理想滚动')}</p>
              <Contact state={state} />
            </div>
            <div>
              <p>{t('假设球不自转')}</p>
              <Contact state={state} slipping />
            </div>
          </div>
        )}
        {(focus === 'cage' || focus === 'load') && (
          <BallBearingDiagram state={state} loadVisible={focus === 'load'} />
        )}
        {(focus === 'patch' || focus === 'losses') && (
          <Patch progress={shot.patchProgress} lossIndex={shot.lossIndex} />
        )}
      </div>
      {(focus === 'assembly' || focus === 'return') && (
        <ol className="bb-path">
          <li>{t('轴')}</li>
          <li>{t('内圈')}</li>
          <li>{t('滚珠')}</li>
          <li>{t('外圈')}</li>
          <li>{t('支座')}</li>
        </ol>
      )}
      {focus === 'contact' && (
        <p className="bb-observation">{t('外侧：v/2 − v/2 = 0。内侧：v/2 + v/2 = v。')}</p>
      )}
      {focus === 'cage' && (
        <div className="bb-speed-pair">
          <p>
            <span>{t('保持架 / 内圈')}</span>
            <strong>{state.speeds.cage.toFixed(3)}</strong>
          </p>
          <p>
            <span>{t('球自转 / 内圈')}</span>
            <strong>{state.speeds.spin.toFixed(3)}</strong>
          </p>
          <p className="bb-fine">{t('固定支座参考系；正负表示方向。')}</p>
        </div>
      )}
      {focus === 'sliding' && (
        <p className="bb-observation">
          {t('球心都以 v/2 前进；禁止自转时，两边都对不上表面速度。')}
        </p>
      )}
      {focus === 'load' && (
        <>
          <div className="bb-load-strip">
            <span>{t('标记球的相对承载')}</span>
            <i>
              <b style={{ width: `${ball.loadWeight * 100}%` }} />
            </i>
          </div>
          <p className="bb-fine">{t('教学假设：载荷方向固定，亮度仅表示相对权重，不是牛顿值。')}</p>
        </>
      )}
      {focus === 'patch' && (
        <p className="bb-observation">
          {t('几何接触点，承载后成为有限接触斑。此处只示意，不计算接触应力。')}
        </p>
      )}
      {focus === 'losses' && (
        <div className="bb-losses">
          <ol>
            {losses.map((v, i) => (
              <li key={v} data-active={i === shot.lossIndex}>
                {t(v)}
              </li>
            ))}
          </ol>
          <p className="bb-fine">{t(lossNotes[Math.max(0, shot.lossIndex)])}</p>
        </div>
      )}
    </aside>
  );
}
