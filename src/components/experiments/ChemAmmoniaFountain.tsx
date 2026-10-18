import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ammoniaFountain,
  fountainLiquidHeight,
  fountainDirector,
  FOUNTAIN,
} from '../../models/chem-ammonia-fountain';
import '../../styles/chem-ammonia-fountain.css';
export default function ChemAmmoniaFountain() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    id = useId().replace(/:/g, '');
  const [time, setTime] = useState(20),
    [air, setAir] = useState(0.03),
    [trigger, setTrigger] = useState(true),
    [open, setOpen] = useState(true),
    [view, setView] = useState('apparatus');
  const d = film.watch
    ? fountainDirector(film.chapter, film.chapterProgress)
    : { chapter: 0, progress: time / 120, time, trigger, open, airFraction: air, view };
  const quantized = Math.round(d.time * 10) / 10,
    s = useMemo(
      () =>
        ammoniaFountain(quantized, {
          airFraction: d.airFraction,
          trigger: d.trigger,
          open: d.open,
        }),
      [quantized, d.airFraction, d.trigger, d.open],
    );
  const endPure = useMemo(() => ammoniaFountain(120), []),
    endAir = useMemo(() => ammoniaFountain(120, { airFraction: 0.4 }), []);
  const r = 66,
    waterY = 166 - fountainLiquidHeight(s.water, r),
    sourceY = 284 + s.water * 35,
    jetApex = Math.max(40, 100 - s.jetHeight * 1060),
    pink = s.dissolvedAmmonia > 0.01 && s.water > 0.00201,
    active = s.flow > 0.0001;
  return (
    <section className="chem-ammonia-fountain">
      <div className="chem-ammonia-heading">
        {say(
          d.view === 'solution'
            ? '进入水相的氨'
            : d.view === 'comparison'
              ? '残余空气改变终点'
              : '氨溶解，水进入烧瓶',
          d.view === 'solution'
            ? 'Ammonia in the water'
            : d.view === 'comparison'
              ? 'Residual air changes the endpoint'
              : 'Ammonia dissolves; water enters',
        )}
      </div>
      {d.view === 'comparison' ? (
        <div className="chem-ammonia-comparison">
          {[
            { s: endPure, zh: '3%初始空气', en: '3% initial air' },
            { s: endAir, zh: '40%初始空气', en: '40% initial air' },
          ].map((v, i) => (
            <div key={i}>
              <div className="chem-ammonia-comparison-label">{say(v.zh, v.en)}</div>
              <svg
                viewBox="0 0 140 160"
                role="img"
                aria-label={say(
                  '球形容器中计算的最终液体体积',
                  'Computed final liquid volume in a spherical vessel',
                )}
              >
                <defs>
                  <clipPath id={`${id}-sphere-${i}`}>
                    <circle cx="70" cy="67" r="55" />
                  </clipPath>
                </defs>
                <circle cx="70" cy="67" r="55" fill="#f5f1ef" stroke="#a9b19d" />
                <rect
                  x="15"
                  y={122 - fountainLiquidHeight(v.s.water, 55)}
                  width="110"
                  height="110"
                  clipPath={`url(#${id}-sphere-${i})`}
                  fill="#cba7bc"
                  opacity=".65"
                />
                <text x="70" y="151" textAnchor="middle" fontSize="23" fill="#657c5b">
                  {(v.s.water * 100).toFixed(0)}%
                </text>
              </svg>
            </div>
          ))}
          <p>{say('液体体积分数 · 模型终态', 'Liquid volume fraction · model endpoint')}</p>
        </div>
      ) : (
        <>
          <svg
            className="chem-ammonia-apparatus"
            viewBox="0 15 320 325"
            role="img"
            aria-label={say(
              '倒置充氨烧瓶与含酚酞水相连，液面和喷流由压力及流量模型计算',
              'Inverted ammonia flask connected to indicator water, with levels and jet driven by one pressure-flow model',
            )}
          >
            <defs>
              <clipPath id={`${id}-flask`}>
                <circle cx="155" cy="100" r="66" />
                <path d="M141 150H169V195H141Z" />
              </clipPath>
              <linearGradient id={`${id}-glass`}>
                <stop stopColor="#e6eee033" />
                <stop offset=".5" stopColor="#ffffff99" />
                <stop offset="1" stopColor="#e5eadd44" />
              </linearGradient>
            </defs>
            <path
              d="M37 329V71H88M20 330H67"
              fill="none"
              stroke="#a6b396"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="155"
              cy="100"
              r="66"
              fill={`url(#${id}-glass)`}
              stroke="#a4b296"
              strokeWidth="1.7"
            />
            <path d="M141 164V198H169V164" fill="#eff2e988" stroke="#a4b296" strokeWidth="1.7" />
            <g clipPath={`url(#${id}-flask)`}>
              <rect
                x="86"
                y={waterY}
                width="140"
                height="180"
                fill={pink ? '#cba7bc' : '#bed8d0'}
                opacity=".65"
              />
              {d.trigger &&
                d.chapter === 1 &&
                [0, 1, 2].map((i) => (
                  <ellipse
                    key={i}
                    cx="171"
                    cy={128 + i * 13 + d.progress * 20}
                    rx="2.3"
                    ry="3.5"
                    fill="#a7c7c1"
                  />
                ))}
              {active && waterY > 100 && (
                <>
                  <path
                    d={`M155 100Q155 ${jetApex} 145 ${jetApex}Q119 ${jetApex + 10} 114 ${Math.max(waterY, jetApex + 35)}`}
                    fill="none"
                    stroke="#c8a8ba"
                    strokeWidth="3.2"
                    opacity=".85"
                  />
                  <path
                    d={`M155 100Q155 ${jetApex} 165 ${jetApex + 4}Q190 ${jetApex + 20} 193 ${Math.max(waterY, jetApex + 48)}`}
                    fill="none"
                    stroke="#c8a8ba"
                    strokeWidth="2"
                    opacity=".7"
                  />
                </>
              )}
              {d.view !== 'solution' &&
                Array.from({ length: 18 }, (_, i) => {
                  const x = 106 + ((i * 29) % 97),
                    y = 49 + ((i * 43) % 100);
                  return y < waterY && Math.hypot(x - 155, y - 100) < 56 ? (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2.6"
                      fill="none"
                      stroke="#9bad90"
                      opacity={Math.max(0.15, s.gasAmmonia / 0.97)}
                    />
                  ) : null;
                })}
            </g>
            <path d="M137 193H173L170 207H140Z" fill="#bba78e" stroke="#a29278" />
            <path d="M155 100V325" stroke="#a5b69c" strokeWidth="6" fill="none" />
            <path
              d="M155 100V325"
              stroke={active ? '#cab2c3' : '#edf2e7'}
              strokeWidth="2.6"
              fill="none"
            />
            <path d="M171 129V219" stroke="#a5b69c" strokeWidth="4" />
            <ellipse cx="171" cy="225" rx="8" ry="15" fill="#bba5aa" />
            <path
              d="M145 248H164M145 241L164 255"
              stroke="#a3aa8c"
              strokeWidth="2.5"
              opacity={d.open ? 0.3 : 1}
            />
            <path
              d="M55 263V327Q55 336 66 336H258Q269 336 269 327V263"
              fill="#eff3e333"
              stroke="#a3b396"
              strokeWidth="1.6"
            />
            <path
              d={`M59 ${sourceY}H265V326Q265 332 257 332H67Q59 332 59 326Z`}
              fill="#bed8d0"
              opacity=".5"
            />
            {active && (
              <path
                d={`M155 ${sourceY - 10}V${sourceY - 35}l-4 7m4-7l4 7`}
                fill="none"
                stroke="#9aaa8b"
                strokeWidth="1.8"
              />
            )}
            {d.view === 'solution' && (
              <g>
                <rect
                  x="211"
                  y="69"
                  width="99"
                  height="110"
                  rx="17"
                  fill="#f8f7f2"
                  stroke="#d6d9cb"
                />
                <text x="261" y="104" textAnchor="middle" fontSize="23" fill="#718567">
                  NH₄⁺
                </text>
                <text x="261" y="143" textAnchor="middle" fontSize="23" fill="#ad859f">
                  OH⁻
                </text>
                <path d="M202 126L220 119" stroke="#b8bea6" />
              </g>
            )}
          </svg>
          <div className="chem-ammonia-readings">
            <span>
              {say('瓶内压强', 'Inside')}
              <b>{(s.pressure / 1000).toFixed(1)} kPa</b>
            </span>
            <span>
              {say('外界压强', 'Outside')}
              <b>{(FOUNTAIN.pressure / 1000).toFixed(1)} kPa</b>
            </span>
          </div>
          {d.view === 'solution' && (
            <div className="chem-ammonia-equation">NH₃ ＋ H₂O ⇌ NH₄⁺ ＋ OH⁻</div>
          )}
        </>
      )}
      {!film.watch && (
        <div className="chem-ammonia-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'apparatus', label: say('喷泉装置', 'Fountain') },
              { value: 'solution', label: say('溶液', 'Solution') },
              { value: 'comparison', label: say('残余空气', 'Residual air') },
            ]}
          />
          {view !== 'comparison' && (
            <>
              <Range
                label={say('模型时间 /s', 'Model time /s')}
                value={time}
                min={0}
                max={120}
                step={0.5}
                onChange={setTime}
              />
              <Range
                label={say('初始空气比例', 'Initial air fraction')}
                value={air}
                min={0}
                max={0.8}
                step={0.01}
                onChange={setAir}
              />
              <Segments
                label={say('最初一滴水', 'Initial water drop')}
                value={trigger ? 'yes' : 'no'}
                onChange={(v) => setTrigger(v === 'yes')}
                options={[
                  { value: 'yes', label: say('进入', 'Present') },
                  { value: 'no', label: say('未进入', 'Absent') },
                ]}
              />
              <Segments
                label={say('水路', 'Water path')}
                value={open ? 'open' : 'closed'}
                onChange={(v) => setOpen(v === 'open')}
                options={[
                  { value: 'open', label: say('连通', 'Open') },
                  { value: 'closed', label: say('夹闭', 'Closed') },
                ]}
              />
            </>
          )}
          <details>
            <summary>{say('模型限定', 'Model limits')}</summary>
            <p>
              {say(
                '1L球形容器为教学参照。有效溶解分配与传质速度用于重现因果关系，未拟合氨水热力学或实验秒数。理想气体压力和压差水流相互耦合，计算残余空气与水位；粉红色仅示意酚酞遇碱，不给出精密pH。',
                'A 1 L spherical vessel is a teaching reference. Effective partition and mass-transfer parameters illustrate causality, not fitted ammonia thermodynamics or measured timing. Ideal gas pressure and pressure-driven flow are coupled. Pink indicates an alkaline indicator response, not a precise pH.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
