import { useState, useId } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { frictionPull, frictionSteady } from '../../models/friction-lab';
import { springWire } from '../../models/elasticity-lab';
import '../../styles/friction-lab.css';
export default function FrictionLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [path, setPath] = useState<'steady' | 'static' | 'sensor' | 'hand'>(
      film.variant === 'required-1-static-friction' ? 'static' : 'steady',
    ),
    [load, setLoad] = useState(0.5),
    [pressure, setPressure] = useState(10),
    [time, setTime] = useState(2.5);
  const c = film.watch ? film.chapter : 0,
    p = film.chapterProgress,
    mode = film.watch
      ? c === 2
        ? 'hand'
        : c === 3
          ? 'static'
          : c === 4
            ? 'sensor'
            : 'steady'
      : path;
  const mass = film.watch ? (c === 1 ? 1 : 0.5) : load,
    normalExtra = mode === 'hand' ? (film.watch ? 5 + 15 * Math.min(1, p * 1.5) : pressure) : 0;
  const seconds = film.watch ? (mode === 'static' || mode === 'sensor' ? p * 4.4 : p * 4) : time;
  const s =
    mode === 'static' || mode === 'sensor'
      ? frictionPull(seconds, mass)
      : frictionSteady(seconds, mass, normalExtra);
  const moving = s.velocity > 0.001,
    railShift = (s.position * 400) % 36,
    fixed = 270 + s.pull * 4,
    zero = fixed - 90,
    peak = fixed - 90 - s.peak * 4;
  const point = (a: number, b: number) => ({ x: 45 + (a / 4.4) * 285, y: 152 - (b / 6) * 120 });
  const trace = Array.from({ length: 101 }, (_, i) => {
    const tm = (seconds * i) / 100,
      q = point(tm, frictionPull(tm, mass).pull);
    return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
  }).join(' ');
  return (
    <section className="friction-lab">
      <header>
        <p>
          {t(
            mode === 'hand'
              ? '用更大的压力，比较滑动时的阻碍'
              : mode === 'steady'
                ? '保持匀速，再比较不同压力'
                : !s.sliding
                  ? '拉力增大，木块还没有滑动'
                  : '刚开始滑动后，读数降向滑动摩擦力',
          )}
        </p>
        <span>
          {t(
            mode === 'hand'
              ? '手压桌面 · 示意体验'
              : mode === 'sensor'
                ? '力传感器 · 连续记录'
                : mode === 'static'
                  ? '弹簧测力计 · 纸团留峰值'
                  : '木块与砝码 · 匀速拖动',
          )}
        </span>
      </header>
      <div className="friction-bench">
        <svg
          viewBox="0 0 360 230"
          role="img"
          aria-label={t('接触面、木块或手、拉力测量装置随模型状态变化')}
        >
          <defs>
            <clipPath id={`${id}floor`}>
              <rect x="12" y="166" width="336" height="34" />
            </clipPath>
            <linearGradient id={`${id}wood`}>
              <stop stopColor="#d3ba91" />
              <stop offset="1" stopColor="#b89b75" />
            </linearGradient>
          </defs>
          <rect x="12" y="166" width="336" height="13" rx="4" fill="#d9d1b9" />
          <g clipPath={`url(#${id}floor)`}>
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={`M${i * 36 - railShift} 169l-12 14`}
                stroke="#b9bca3"
                strokeWidth="1.3"
              />
            ))}
          </g>
          {mode === 'hand' ? (
            <>
              <path
                d="M48 130Q70 115 90 132L109 146L159 150Q170 158 160 165H100Q84 166 73 153L43 147Z"
                fill="#d1b595"
                stroke="#b89c7b"
                strokeWidth="1.5"
              />
              <path
                d="M91 142L130 153M101 139L142 153M113 140L154 154"
                stroke="#b59a7b"
                fill="none"
              />
              <path
                d={`M107 ${102 - normalExtra}V126M102 119L107 126L112 119`}
                fill="none"
                stroke="#9e7f5b"
                strokeWidth="2"
              />
              <path
                d="M180 153H255M248 148L255 153L248 158"
                fill="none"
                stroke="#8a9f78"
                strokeWidth="2"
              />
            </>
          ) : (
            <>
              <rect x="40" y="119" width="76" height="47" rx="5" fill={`url(#${id}wood)`} />
              <path d="M48 129H108M50 151H100" stroke="#c3a47d" fill="none" />
              {mass > 0.5 && (
                <g>
                  <rect x="53" y="106" width="49" height="13" rx="3" fill="#9baa91" />
                  <path d="M66 106V101H90V106" stroke="#8a9c7f" strokeWidth="3" fill="none" />
                </g>
              )}
              <path d="M116 143H180" stroke="#9aab8b" strokeWidth="1.8" />
              {mode === 'sensor' ? (
                <g>
                  <rect
                    x="166"
                    y="121"
                    width="126"
                    height="43"
                    rx="10"
                    fill="#d6dfcf"
                    stroke="#a7b69b"
                  />
                  <rect x="182" y="132" width="46" height="20" rx="4" fill="#f4f4e9" />
                  <text x="205" y="148" textAnchor="middle" fontSize="16" fill="#6c805e">
                    {s.pull.toFixed(2)}
                  </text>
                  <path d="M292 143H330" stroke="#8d9d80" strokeWidth="3" />
                  <path d="M257 122Q269 82 320 90" stroke="#a4b49a" strokeWidth="2" fill="none" />
                </g>
              ) : (
                <g>
                  <rect
                    x={fixed - 140}
                    y="122"
                    width="151"
                    height="42"
                    rx="10"
                    fill="#edf0e4"
                    fillOpacity=".8"
                    stroke="#a6b49c"
                  />
                  <path
                    d={springWire(fixed - 180, 10, 5)
                      .map((q, i) => `${i ? 'L' : 'M'}${180 + q.y} ${143 + q.x}`)
                      .join(' ')}
                    fill="none"
                    stroke="#8c9c80"
                    strokeWidth="1.5"
                  />
                  {Array.from({ length: 13 }, (_, i) => (
                    <path key={i} d={`M${zero - i * 4} 125v${i % 3 ? 4 : 7}`} stroke="#a1aa8f" />
                  ))}
                  <path d="M180 132V151" stroke="#9b7755" strokeWidth="2" />
                  {mode === 'static' && (
                    <path
                      d={`M${peak - 3} 118L${peak + 4} 120L${peak + 3} 130L${peak - 3} 129Z`}
                      fill="#c5aa86"
                      stroke="#a48863"
                    />
                  )}
                  <path d={`M${fixed + 11} 143H${fixed + 30}`} stroke="#8b9e7d" strokeWidth="3" />
                  <path
                    d={`M${fixed + 26} 135q12-10 17 0v18q-7 8-17-1`}
                    fill="#d6bea0"
                    stroke="#bba486"
                  />
                </g>
              )}
            </>
          )}
          <path
            d={`M55 209H${55 + (moving ? 80 : 0)}${moving ? 'm-7-5l7 5-7 5' : ''}`}
            fill="none"
            stroke="#92a57e"
            strokeWidth="2"
          />
        </svg>
        <div className="friction-live">
          <span>
            {t('正压力')} <strong>{s.normal.toFixed(2)} N</strong>
          </span>
          <span>
            {t(mode === 'hand' ? '滑动摩擦力' : '拉力读数')} <strong>{s.pull.toFixed(2)} N</strong>
          </span>
          <span>{t(moving ? '正在滑动' : '保持静止')}</span>
        </div>
      </div>
      {mode === 'static' || mode === 'sensor' ? (
        <div className="friction-record">
          <p>
            {t(
              mode === 'static'
                ? '纸团留下最大读数，指针可以回落'
                : '同一过程，传感器保留整个力—时间曲线',
            )}
          </p>
          <svg
            viewBox="0 0 350 190"
            role="img"
            aria-label={t('拉力先增加到静摩擦上限，滑动后逐渐降向滑动摩擦力')}
          >
            <path d="M45 20V152H335" stroke="#a6b593" fill="none" />
            {[0, 2, 4, 6].map((f) => (
              <g key={f}>
                <path d={`M45 ${point(0, f).y}H330`} stroke="#e4e8db" />
                <text x="35" y={point(0, f).y + 6} textAnchor="end" fontSize="18" fill="#738663">
                  {f}
                </text>
              </g>
            ))}
            <path d={trace} stroke="#9d805d" strokeWidth="2.4" fill="none" />
            <path d={`M45 ${point(0, s.peak).y}H330`} stroke="#b4a080" strokeDasharray="4 5" />
            {[0, 1, 2, 3, 4].map((tm) => (
              <text
                key={tm}
                x={point(tm, 0).x}
                y="177"
                textAnchor="middle"
                fontSize="18"
                fill="#738663"
              >
                {tm}
              </text>
            ))}
            <text x="45" y="17" fontSize="18" fill="#738663">
              F / N
            </text>
            <text x="332" y="189" textAnchor="end" fontSize="18" fill="#738663">
              t / s
            </text>
          </svg>
          <span>
            {t('最大记录')} {s.peak.toFixed(2)} N
          </span>
        </div>
      ) : (
        <p className="friction-comparison">
          {t(
            mode === 'hand'
              ? '手压得更紧，接触面的正压力增加，滑动阻碍随之增大。'
              : '匀速时合力为零，所以测力计读数等于滑动摩擦力。',
          )}
        </p>
      )}
      <p className="friction-observation">
        {t(
          mode === 'static' || mode === 'sensor'
            ? s.sliding
              ? '刚滑动时有加速度，瞬时拉力并不立即等于滑动摩擦力。'
              : '静摩擦力随拉力调整；没有滑动时不应总写成最大值。'
            : '接触材料相同，在此模型中滑动摩擦力与正压力成正比。',
        )}
      </p>
      {!film.watch && (
        <div className="friction-controls">
          <Segments
            label={t('实验路径')}
            value={path}
            onChange={setPath}
            options={[
              { value: 'steady', label: t('匀速木块') },
              { value: 'hand', label: t('手压体验') },
              { value: 'static', label: t('纸团记峰值') },
              { value: 'sensor', label: t('力传感器') },
            ]}
          />
          {mode === 'hand' ? (
            <Range
              label={t('附加按压力')}
              value={pressure}
              min={0}
              max={20}
              unit="N"
              onChange={setPressure}
            />
          ) : (
            <Range
              label={t('木块与砝码总质量')}
              value={load}
              min={0.5}
              max={1}
              step={0.1}
              unit="kg"
              onChange={setLoad}
            />
          )}
          <Range
            label={t('实验时刻')}
            value={time}
            min={0}
            max={4.4}
            step={0.05}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="friction-note">
        {t('镜头跟随接触物体；滑动时桌纹向后移动。静、动摩擦因数取0.45和0.30，忽略材料速度效应。')}
      </p>
    </section>
  );
}
