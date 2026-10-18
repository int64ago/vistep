import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  filingAngle,
  oerstedCompass,
  surveyField,
  surveyInsideSource,
  type FieldPattern,
} from '../../models/magnetic-field-survey';
import '../../styles/magnetic-field-survey.css';
const smooth = (x: number) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
function Needle({
  x,
  y,
  angle,
  size = 24,
}: {
  x: number;
  y: number;
  angle: number;
  size?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${(-angle * 180) / Math.PI})`}>
      <path d={`M${-size} 0L0 -5V5Z`} fill="#9cb59f" />
      <path d={`M${size} 0L0 -5V5Z`} fill="#bb9671" />
      <circle r="3" fill="#d7d4b5" />
    </g>
  );
}
function Oersted({ current, height }: { current: number; height: number }) {
  const s = oerstedCompass(current, height),
    a = Math.PI / 2 - s.angle;
  return (
    <>
      <svg
        viewBox="0 0 400 355"
        className="ms-apparatus"
        role="img"
        aria-label={t('南北方向导线位于磁针上方，通断或反转电流改变磁针方向')}
      >
        <path
          d="M200 52H72V75M72 100V310H113M163 310H200"
          fill="none"
          stroke="#a1b193"
          strokeWidth="2.4"
        />
        <path d={current === 0 ? 'M72 75l15 20' : 'M72 75v25'} stroke="#a1b193" strokeWidth="2.4" />
        <rect x="113" y="293" width="50" height="33" rx="9" fill="#c3ceac" stroke="#a4b492" />
        <text x="122" y="317">
          {current < 0 ? '+' : '−'}
        </text>
        <text x="145" y="317">
          {current < 0 ? '−' : '+'}
        </text>
        <circle cx="200" cy="194" r="68" fill="#e9edda" stroke="#b4c2a2" />
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i * Math.PI) / 12;
          return (
            <path
              key={i}
              d={`M${200 + 60 * Math.cos(angle)} ${194 + 60 * Math.sin(angle)}l${-4 * Math.cos(angle)} ${-4 * Math.sin(angle)}`}
              stroke="#bac5a5"
            />
          );
        })}
        <text x="200" y="115" textAnchor="middle">
          N
        </text>
        <text x="200" y="286" textAnchor="middle">
          S
        </text>
        <Needle x={200} y={194} angle={a} size={49} />
        <path d="M207 58V305" stroke="#b9c4aa" strokeWidth="7" opacity=".23" />
        <path d="M200 52V310" stroke="#b09a71" strokeWidth="4.2" strokeLinecap="round" />
        {current !== 0 && (
          <path
            d={current > 0 ? 'M200 87v-23m-5 6 5-6 5 6' : 'M200 64v23m-5-6 5 6 5-6'}
            fill="none"
            stroke="#8c8964"
            strokeWidth="2.5"
          />
        )}
        <g transform="translate(283 43)">
          <path d="M0 64h75" stroke="#b1bea0" />
          <path d={`M9 ${64 - height * 1000}H67`} stroke="#b09a71" strokeWidth="3" />
          <path d={`M73 64V${64 - height * 1000}`} stroke="#b6c3a8" strokeDasharray="3 3" />
          <text x="40" y="91" textAnchor="middle">
            {(height * 100).toFixed(1)} cm
          </text>
        </g>
      </svg>
      <div className="ms-readout">
        <span>I = {current.toFixed(1)} A</span>
        <span>
          {t('磁针偏角')} {((s.angle * 180) / Math.PI).toFixed(1)}°
        </span>
      </div>
    </>
  );
}
function Survey({
  pattern,
  current,
  settle,
  probe,
}: {
  pattern: FieldPattern;
  current: number;
  settle: number;
  probe: string;
}) {
  const filings = useMemo(
    () =>
      Array.from({ length: 15 * 12 }, (_, id) => {
        const col = id % 15,
          row = Math.floor(id / 15),
          x = -0.255 + col * 0.036 + Math.sin(id * 5.1) * 0.004,
          y = -0.19 + row * 0.035 + Math.cos(id * 3.7) * 0.004,
          b = surveyField(pattern, x, y, 1);
        return {
          id,
          x,
          y,
          b,
          initial: (id * 1.937) % Math.PI,
          visible: !surveyInsideSource(pattern, x, y),
        };
      }),
    [pattern],
  );
  const scale = 620,
    px = (x: number) => 200 + x * scale,
    py = (y: number) => 164 - y * scale,
    probePosition = probe === 'left' ? [-0.2, 0.1] : probe === 'top' ? [0, 0.17] : [0.2, 0.1],
    b = surveyField(pattern, probePosition[0], probePosition[1], current),
    angle = Math.atan2(b.by, b.bx),
    magnet = pattern === 'bar' || pattern === 'horseshoe',
    r = pattern === 'loop' ? 0.075 : 0.06;
  return (
    <>
      <svg
        viewBox="0 0 400 330"
        className="ms-apparatus"
        role="img"
        aria-label={t('玻璃观察平面上的铁屑按计算磁场排列，小磁针显示方向')}
      >
        <rect
          x="22"
          y="25"
          width="356"
          height="280"
          rx="26"
          fill="#e9eee0"
          fillOpacity=".35"
          stroke="#c3cfb9"
        />
        {filings
          .filter((f) => f.visible)
          .map((f) => {
            const a = filingAngle(
                f.initial,
                f.b.bx * (magnet ? 1 : current),
                f.b.by * (magnet ? 1 : current),
                settle,
              ),
              x = px(f.x),
              y = py(f.y),
              l =
                4 +
                2 *
                  Math.min(1, (Math.hypot(f.b.bx, f.b.by) * Math.abs(magnet ? 1 : current)) / 1e-4);
            return (
              <path
                key={f.id}
                d={`M${x - l * Math.cos(a)} ${y + l * Math.sin(a)}L${x + l * Math.cos(a)} ${y - l * Math.sin(a)}`}
                stroke="#8d9d87"
                strokeWidth="1.65"
                strokeLinecap="round"
                opacity=".66"
              />
            );
          })}
        {pattern === 'bar' ? (
          <>
            <rect x={px(-0.1)} y={py(0.02)} width="124" height="25" rx="7" fill="#b9cbb4" />
            <path d={`M200 ${py(0.02)}h55q7 0 7 7v11q0 7-7 7h-55Z`} fill="#c2ab83" />
            <text x="153" y="171" textAnchor="middle">
              S
            </text>
            <text x="247" y="171" textAnchor="middle">
              N
            </text>
          </>
        ) : pattern === 'horseshoe' ? (
          <>
            <path
              d={`M${px(0.09)} ${py(-0.07)}H${px(-0.09)}V${py(0.07)}H${px(0.09)}`}
              fill="none"
              stroke="#afbea4"
              strokeWidth="25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={`M${px(0.05)} ${py(0.07)}H${px(0.09)}`}
              stroke="#bea27a"
              strokeWidth="25"
              strokeLinecap="round"
            />
            <text x={px(0.09)} y={py(0.07) + 8} textAnchor="middle">
              N
            </text>
            <text x={px(0.09)} y={py(-0.07) + 8} textAnchor="middle">
              S
            </text>
          </>
        ) : pattern === 'straight' ? (
          <>
            <circle cx="200" cy="164" r="11" fill="#c5b891" stroke="#a89970" />
            {current > 0 ? (
              <circle cx="200" cy="164" r="3.4" fill="#849578" />
            ) : current < 0 ? (
              <path d="M195 159l10 10m0-10-10 10" stroke="#849578" strokeWidth="2" />
            ) : null}
          </>
        ) : (
          <>
            {pattern === 'loop' ? (
              <ellipse
                cx="200"
                cy="164"
                rx="10"
                ry={r * scale}
                fill="none"
                stroke="#b49d72"
                strokeWidth="2"
              />
            ) : (
              <path
                d={Array.from({ length: 281 }, (_, i) => {
                  const a = (i / 280) * 14 * Math.PI,
                    x = -0.105 + (0.21 * i) / 280 + 0.016 * Math.sin(a),
                    y = r * Math.cos(a);
                  return `${i ? 'L' : 'M'}${px(x)} ${py(y)}`;
                }).join(' ')}
                fill="none"
                stroke="#b49d72"
                strokeWidth="2"
              />
            )}
            {(pattern === 'loop'
              ? [0]
              : [-0.105, -0.075, -0.045, -0.015, 0.015, 0.045, 0.075, 0.105]
            ).map((x, i) => (
              <circle key={`t${i}`} cx={px(x)} cy={py(r)} r="4.5" fill="#e3ddbc" stroke="#a59166" />
            ))}
            {(pattern === 'loop' ? [0] : [-0.09, -0.06, -0.03, 0, 0.03, 0.06, 0.09]).map((x, i) => (
              <circle
                key={`b${i}`}
                cx={px(x)}
                cy={py(-r)}
                r="4.5"
                fill="#e3ddbc"
                stroke="#a59166"
              />
            ))}
            {current !== 0 &&
              (pattern === 'loop' ? [0] : [-0.09, -0.06, -0.03, 0, 0.03, 0.06, 0.09]).map(
                (x, i) => (
                  <g key={i}>
                    {current > 0 ? (
                      <>
                        <circle
                          cx={px(pattern === 'loop' ? 0 : x - 0.015)}
                          cy={py(r)}
                          r="1.7"
                          fill="#819475"
                        />
                        <path
                          d={`M${px(x) - 2.5} ${py(-r) - 2.5}l5 5m0-5-5 5`}
                          stroke="#819475"
                          strokeWidth="1.2"
                        />
                      </>
                    ) : (
                      <>
                        <circle cx={px(x)} cy={py(-r)} r="1.7" fill="#819475" />
                        <path
                          d={`M${px(pattern === 'loop' ? 0 : x - 0.015) - 2.5} ${py(r) - 2.5}l5 5m0-5-5 5`}
                          stroke="#819475"
                          strokeWidth="1.2"
                        />
                      </>
                    )}
                  </g>
                ),
              )}
          </>
        )}
        <circle
          cx={px(probePosition[0])}
          cy={py(probePosition[1])}
          r="23"
          fill="#f0eed7"
          fillOpacity=".94"
          stroke="#bdc6a9"
        />
        <g opacity={Math.hypot(b.bx, b.by) > 1e-14 ? 1 : 0.18}>
          <Needle
            x={px(probePosition[0])}
            y={py(probePosition[1])}
            angle={Math.hypot(b.bx, b.by) > 1e-14 ? angle : Math.PI / 2}
            size={18}
          />
        </g>
      </svg>
      <p className="ms-view">
        {t(
          magnet
            ? '观察平面位于磁体外；棕色端表示小磁针 N 极'
            : pattern === 'straight'
              ? '导线垂直穿过观察平面；圆点向外，叉号向内'
              : '观察平面经过线圈轴线；圆点向外，叉号向内',
        )}
      </p>
      <div className="ms-readout">
        <span>{magnet ? t('永磁体示意模型') : `I = ${current.toFixed(1)} A`}</span>
        <span>
          {t('探针处')} |B| = {(Math.hypot(b.bx, b.by) * 1e6).toFixed(1)} µT
        </span>
      </div>
    </>
  );
}
export default function MagneticFieldSurvey() {
  const film = useShowcase(),
    [mode, setMode] = useState<'oersted' | 'survey'>(
      film.variant === 'r3-magnetic-field-patterns' ? 'survey' : 'oersted',
    ),
    [pattern, setPattern] = useState<FieldPattern>('bar'),
    [current, setCurrent] = useState(2),
    [height, setHeight] = useState(2),
    [settle, setSettle] = useState(1),
    [probe, setProbe] = useState('right');
  const c = film.chapter,
    p = film.chapterProgress,
    active = film.watch ? (c < 2 ? 'oersted' : 'survey') : mode,
    kind: FieldPattern = film.watch
      ? ((['bar', 'horseshoe', 'straight', 'loop', 'solenoid'] as const)[Math.max(0, c - 2)] ??
        'bar')
      : pattern,
    I = film.watch
      ? c === 0
        ? 2 * smooth((p - 0.18) / 0.18)
        : c === 1
          ? p < 0.32
            ? 2 * (1 - smooth((p - 0.15) / 0.15))
            : -2 * smooth((p - 0.64) / 0.18)
          : c === 4
            ? 5 - 10 * smooth((p - 0.4) / 0.2)
            : 5
      : current,
    aligned = film.watch ? Math.min(1, p * 3) : settle,
    label =
      active === 'oersted'
        ? '磁针跟随导线磁场与地磁场的合场'
        : kind === 'bar'
          ? '轻敲后铁屑排列；小磁针补上方向信息'
          : kind === 'horseshoe'
            ? '蹄形磁体的两极之间，磁场从 N 指向 S'
            : kind === 'straight'
              ? '反向电流改变磁针方向，不改变铁屑排列轴线'
              : kind === 'loop'
                ? '环形电流的轴向磁场，由同一电流几何决定'
                : '多匝环形电流叠加，形成螺线管磁场';
  return (
    <section className="ms-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="ms-kicker">{t(label)}</p>
      {active === 'oersted' ? (
        <Oersted current={I} height={film.watch ? 0.02 : height / 100} />
      ) : (
        <Survey pattern={kind} current={I} settle={aligned} probe={probe} />
      )}
      {!film.watch && (
        <div className="ms-controls">
          <Segments
            label={t('选择磁场实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'oersted', label: t('奥斯特实验') },
              { value: 'survey', label: t('磁场分布') },
            ]}
          />
          {active === 'survey' && (
            <Segments
              label={t('磁场来源')}
              value={pattern}
              onChange={setPattern}
              options={[
                { value: 'bar', label: t('条形磁体') },
                { value: 'horseshoe', label: t('蹄形磁体') },
                { value: 'straight', label: t('直导线') },
                { value: 'loop', label: t('环形电流') },
                { value: 'solenoid', label: t('螺线管') },
              ]}
            />
          )}{' '}
          {(active === 'oersted' || !['bar', 'horseshoe'].includes(pattern)) && (
            <Range
              label={t('电流及方向')}
              value={current}
              min={-5}
              max={5}
              step={0.5}
              unit="A"
              onChange={setCurrent}
            />
          )}{' '}
          {active === 'oersted' ? (
            <Range
              label={t('导线距磁针高度')}
              value={height}
              min={1}
              max={5}
              step={0.5}
              unit="cm"
              onChange={setHeight}
            />
          ) : (
            <>
              <Range
                label={t('轻敲后的排列进度')}
                value={settle}
                min={0}
                max={1}
                step={0.05}
                onChange={setSettle}
              />
              <Segments
                label={t('移动小磁针')}
                value={probe}
                onChange={setProbe}
                options={[
                  { value: 'left', label: t('磁源左上方') },
                  { value: 'top', label: t('磁源上方') },
                  { value: 'right', label: t('磁源右上方') },
                ]}
              />
            </>
          )}
        </div>
      )}
      <details className="ms-details">
        <summary>{t('磁场和铁屑模型的范围')}</summary>
        <p>
          {t(
            '奥斯特装置把导线近似为长直导线，并叠加 25 µT 的水平地磁场；针位给出静态平衡，不模拟真实阻尼振荡。磁场观察图省略地磁场，突出磁源本身。线圈按毕奥—萨伐尔积分，螺线管由七个环叠加；永磁体用沿磁化方向分布的磁偶极近似，不能据此标定实物强度。铁屑只显示轴线，小磁针棕色 N 极显示有向磁场；线圈供电回路不在观察切面中显示。',
          )}
        </p>
      </details>
    </section>
  );
}
