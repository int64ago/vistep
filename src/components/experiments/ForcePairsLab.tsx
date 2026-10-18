import { useState, useId } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  pairedBalances,
  pairExperiment,
  pairFilmState,
  balanceScaleOffset,
} from '../../models/force-pairs-lab';
import { useSignalWidth } from '../lab/SignalFigure';
import { springWire } from '../../models/elasticity-lab';
import '../../styles/force-pairs-lab.css';
export default function ForcePairsLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const { host, compact } = useSignalWidth();
  const [instrument, setInstrument] = useState<'balances' | 'sensors' | null>(null),
    [gap, setGap] = useState(0.5),
    [ratio, setRatio] = useState(120),
    [shift, setShift] = useState(0);
  const kind = film.watch
    ? film.chapter < 2
      ? 'balances'
      : 'sensors'
    : (instrument ?? (film.chapter < 2 ? 'balances' : 'sensors'));
  const c = film.watch ? film.chapter : kind === 'balances' ? 1 : 3;
  const director = pairFilmState(c, film.chapterTime, browserLocale());
  const kB = film.watch ? director.rightStiffness : ratio;
  const s = film.watch
    ? pairExperiment(director.physicalTime, director.bothMoving, 80, kB)
    : pairedBalances(gap, shift, 80, kB);
  const X = (x: number) => 180 + x * 500,
    left = X(s.left),
    right = X(s.right),
    joint = X(s.joint),
    forceArrow = s.force * 7;
  const curve = (sign: number) =>
    Array.from({ length: 81 }, (_, i) => {
      const tm = (director.physicalTime * i) / 80,
        v = pairExperiment(tm, director.bothMoving, 80, kB);
      return `${i ? 'L' : 'M'}${40 + (tm / Math.max(4, director.physicalTime)) * 280} ${95 - sign * v.force * 10}`;
    }).join(' ');
  return (
    <section
      className="pair-lab"
      ref={host}
      data-kind={kind}
      data-physical-time={director.physicalTime}
    >
      <header>
        <p>
          {t(
            c === 0
              ? '慢慢拉开，两只表一起变化'
              : c === 1
                ? '弹簧伸长不同，力的大小仍相等'
                : c === 2
                  ? '给两个方向统一正负号'
                  : '改变两端位置，比较同一时刻的两个力',
          )}
        </p>
        <span>{t(kind === 'balances' ? '两只弹簧测力计' : '两只力传感器')}</span>
      </header>
      <svg
        className="pair-instruments"
        viewBox={compact ? '0 65 380 150' : '0 0 380 225'}
        role="img"
        aria-label={t('两个相连仪器在共同挂钩处相互作用，读数大小相等方向相反')}
      >
        <defs>
          <marker id={`${id}a`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#9d805c" />
          </marker>
          <marker id={`${id}b`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#718c81" />
          </marker>
        </defs>
        {[
          { side: 1, anchor: left, extension: s.leftExtension, stiffness: 80, color: '#a78c64' },
          { side: -1, anchor: right, extension: s.rightExtension, stiffness: kB, color: '#7b9687' },
        ].map((v, i) => {
          const end = v.anchor + v.side * (30 + balanceScaleOffset(s.force, v.stiffness));
          return (
            <g key={i}>
              <path d={`M${v.anchor} 124h${-v.side * 14}`} stroke={v.color} strokeWidth="3" />
              <rect
                x={v.side > 0 ? v.anchor : v.anchor - 90}
                y="104"
                width="90"
                height="40"
                rx="10"
                fill={kind === 'balances' ? '#eef0e5' : i ? '#ccdad2' : '#ddd1ba'}
                stroke={v.color}
              />
              {kind === 'balances' ? (
                <>
                  <path
                    d={springWire(20 + v.extension * 500, 8, 5)
                      .map(
                        (q, j) => `${j ? 'L' : 'M'}${v.anchor + v.side * (10 + q.y)} ${124 + q.x}`,
                      )
                      .join(' ')}
                    stroke={v.color}
                    fill="none"
                    strokeWidth="1.5"
                  />
                  {Array.from({ length: 8 }, (_, tick) => {
                    const x = v.anchor + v.side * (30 + balanceScaleOffset(tick, v.stiffness));
                    return (
                      <g
                        key={tick}
                        data-calibration-force={tick}
                        data-calibration-stiffness={v.stiffness}
                      >
                        <path d={`M${x} 105v${tick % 2 ? 5 : 8}`} stroke={v.color} />
                        {(tick === 0 || tick === 6) && (
                          <text
                            x={x}
                            y="99"
                            textAnchor="middle"
                            fill={v.color}
                            fontSize={compact ? 25 : 20}
                          >
                            {tick}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <path
                    data-pointer-force={s.force}
                    data-pointer-stiffness={v.stiffness}
                    d={`M${end} 115V134`}
                    stroke={v.color}
                    strokeWidth="2"
                  />
                </>
              ) : (
                <rect
                  x={v.side > 0 ? v.anchor + 20 : v.anchor - 65}
                  y="113"
                  width="45"
                  height="21"
                  rx="4"
                  fill="#f3f4e9"
                />
              )}
              <path
                d={`M${kind === 'balances' ? end : v.anchor + v.side * 90} 124H${joint - v.side * 5}`}
                stroke={v.color}
                strokeWidth="2"
              />
              <path
                d={`M${v.anchor - v.side * 14} 114q${-v.side * 12} -8 ${-v.side * 14} 3v19q${v.side * 7} 6 ${v.side * 14} -3`}
                fill="#d6bea1"
                stroke="#bca485"
              />
            </g>
          );
        })}
        <circle cx={joint} cy="124" r="6" fill="#f6f5e9" stroke="#9cae8c" strokeWidth="2" />
        {s.force > 0.05 && (
          <>
            <path
              d={`M${joint - 4} 78H${joint - 4 + forceArrow}`}
              stroke="#a18460"
              strokeWidth="2.2"
              markerEnd={`url(#${id}a)`}
            />
            <path
              d={`M${joint + 4} 171H${joint + 4 - forceArrow}`}
              stroke="#718c81"
              strokeWidth="2.2"
              markerEnd={`url(#${id}b)`}
            />
          </>
        )}
        <text x={left + 43} y="202" textAnchor="middle" fontSize="20" fill="#9a805b">
          A
        </text>
        <text x={right - 43} y="202" textAnchor="middle" fontSize="20" fill="#718b7d">
          B
        </text>
      </svg>
      <div className="pair-readings">
        <div>
          <span aria-label={t('B作用于A · 向右')}>
            {compact ? 'B → A · →' : t('B作用于A · 向右')}
          </span>
          <strong>+{s.force.toFixed(2)} N</strong>
        </div>
        <div>
          <span aria-label={t('A作用于B · 向左')}>
            {compact ? 'A → B · ←' : t('A作用于B · 向左')}
          </span>
          <strong>−{s.force.toFixed(2)} N</strong>
        </div>
      </div>
      {kind === 'sensors' ? (
        <div className="pair-traces">
          <p>{t('统一向右为正，同一时刻读取两条曲线')}</p>
          <svg
            viewBox={compact ? '0 -12 350 220' : '0 0 350 200'}
            role="img"
            aria-label={t('两个传感器的力曲线相对于零线镜像')}
          >
            <path d="M40 15V177M40 95H325" stroke="#b3bfa3" fill="none" />
            <path
              d={film.watch ? curve(1) : `M40 ${95 - s.force * 10}H320`}
              fill="none"
              stroke="#a18460"
              strokeWidth="2.2"
            />
            <path
              d={film.watch ? curve(-1) : `M40 ${95 + s.force * 10}H320`}
              fill="none"
              stroke="#718c81"
              strokeWidth="2.2"
            />
            <text x="26" y="101" textAnchor="end" fontSize="18" fill="#829172">
              0
            </text>
            <text x="45" y="16" fontSize="18" fill="#829172">
              F / N
            </text>
            <text x="320" y="195" fontSize="18" textAnchor="end" fill="#829172">
              t / s
            </text>
          </svg>
        </div>
      ) : (
        <p className="pair-extension">
          {t('A伸长')} {(s.leftExtension * 100).toFixed(1)} cm <span>·</span> {t('B伸长')}{' '}
          {(s.rightExtension * 100).toFixed(1)} cm
        </p>
      )}
      <p className="pair-cause">
        {t('这一对力作用在不同对象上，不能作为同一个物体的平衡力相互抵消。')}
      </p>
      {!film.watch && (
        <div className="pair-controls">
          <Segments
            label={t('测量仪器')}
            value={kind}
            onChange={setInstrument}
            options={[
              { value: 'balances', label: t('弹簧测力计') },
              { value: 'sensors', label: t('力传感器') },
            ]}
          />
          <Range
            label={t('两端距离')}
            value={gap}
            min={0.4}
            max={0.54}
            step={0.005}
            unit="m"
            onChange={setGap}
          />
          <Range
            label={t('B仪器等效劲度系数')}
            value={ratio}
            min={80}
            max={160}
            step={10}
            unit="N/m"
            onChange={setRatio}
          />
          <Range
            label={t('整体平移')}
            value={shift}
            min={-0.02}
            max={0.02}
            step={0.005}
            unit="m"
            onChange={setShift}
          />
        </div>
      )}
      <p className="pair-note">
        {t('仪器内部按准静态弹性模型，忽略仪器自重和惯性；相互作用力相等反向不依赖物体是否运动。')}
      </p>
    </section>
  );
}
