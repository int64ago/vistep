import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  trialHistogram,
  binomialProbabilities,
  bernoulliTrial,
  galtonBall,
  beansOnScale,
} from '../../models/statistical-motion-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function StatisticalMotionLab() {
  const film = useShowcase();
  const [mode, setMode] = useState(
      film.variant?.includes('coin')
        ? 'coins'
        : film.variant?.includes('beans')
          ? 'beans'
          : 'galton',
    ),
    [count, setCount] = useState(40),
    [progress, setProgress] = useState(0.6),
    [height, setHeight] = useState(0.2),
    [rate, setRate] = useState(20);
  const stage = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    kind = film.watch ? (stage < 2 ? 'galton' : stage < 4 ? 'coins' : 'beans') : mode;
  const n = film.watch
    ? stage === 0
      ? 0
      : stage === 1
        ? Math.floor(p * 200)
        : stage === 2
          ? Math.floor(p * 10)
          : Math.floor(p * 400)
    : count;
  const histogram = trialHistogram(n, kind === 'coins' ? 4 : 8),
    ball = galtonBall(stage === 0 ? 0 : n, stage === 0 ? p : (p * 200) % 1),
    coins = bernoulliTrial(n, 4),
    h = film.watch ? (stage === 6 ? 0.5 : 0.2) : height,
    beanCount = film.watch && stage === 4 ? 1 : 100,
    beanTime = p * 6,
    effectiveRate = film.watch ? 20 : rate,
    bean = beansOnScale(beanTime, { height: h, rate: effectiveRate, count: beanCount });
  return (
    <div className="textbook-em statistical-motion-lab">
      <div className="textbook-em-state">
        <span>
          {t(kind === 'galton' ? '伽尔顿板' : kind === 'coins' ? '四枚硬币的统计' : '豆粒撞击台秤')}
        </span>
        <span>{kind === 'beans' ? `h = ${h.toFixed(2)} m` : `N = ${n}`}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 315"
        role="img"
        aria-label={t('小球、四枚硬币和落豆三种统计实验')}
      >
        {kind === 'galton' && (
          <>
            <path d="M87 38V290H273V38" fill="#edf2e4" stroke="#bed0b0" strokeWidth="3" />
            {Array.from({ length: 8 }, (_, row) =>
              Array.from({ length: row + 1 }, (_, j) => (
                <circle
                  key={`${row}-${j}`}
                  cx={180 + (2 * j - row) * 9}
                  cy={58 + row * 17}
                  r="2"
                  fill="#9eb18c"
                />
              )),
            )}
            {Array.from({ length: 10 }, (_, j) => (
              <path key={j} d={`M${99 + j * 18} 190V286`} stroke="#afc1a0" strokeWidth="1.5" />
            ))}
            {histogram.flatMap((amount, bin) =>
              Array.from({ length: amount }, (_, i) => (
                <circle
                  key={`${bin}-${i}`}
                  cx={108 + bin * 18 + ((i % 3) - 1) * 4.8}
                  cy={282 - Math.floor(i / 3) * 4.8}
                  r="2.2"
                  fill="#b39960"
                />
              )),
            )}
            <circle cx={ball.x} cy={ball.y} r="2.5" fill="#b08d4e" />
            <path d="M169 20l11 18 11-18" stroke="#a2b68f" fill="none" strokeWidth="2" />
          </>
        )}
        {kind === 'coins' && (
          <>
            {coins.map((head, i) => (
              <g key={i}>
                <circle
                  cx={78 + i * 68}
                  cy="71"
                  r="27"
                  fill={head ? '#d2b779' : '#c1d0b1'}
                  stroke={head ? '#af9258' : '#93aa82'}
                  strokeWidth="2"
                />
                <circle cx={78 + i * 68} cy="71" r="21" fill="none" stroke="#f2e8c9" />
                <text x={78 + i * 68} y="78" textAnchor="middle">
                  {t(head ? '正' : '反')}
                </text>
              </g>
            ))}
            <path d="M45 248H320" stroke="#bed0ae" />
            {histogram.map((amount, i) => {
              const bar = (amount / Math.max(1, n)) * 130;
              return (
                <g key={i}>
                  <rect
                    x={53 + i * 54}
                    y={248 - bar}
                    width="35"
                    height={bar}
                    rx="5"
                    fill="#a2bc94"
                  />
                  <text x={70 + i * 54} y="275" textAnchor="middle">
                    {i}
                  </text>
                  <text className="em-small" x={70 + i * 54} y={235 - bar} textAnchor="middle">
                    {amount}
                  </text>
                </g>
              );
            })}
            {binomialProbabilities(4).map((q, i) => (
              <path
                key={i}
                d={`M${50 + i * 54} ${248 - q * 130}h41`}
                stroke="#b99d66"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            ))}
          </>
        )}
        {kind === 'beans' && (
          <>
            <path d="M99 240H257" stroke="#a4b89b" strokeWidth="8" strokeLinecap="round" />
            <path d="M126 242L142 270H218L234 242" fill="#d6e1cb" stroke="#a6bc97" />
            <circle cx="180" cy="278" r="24" fill="#f2f5e8" stroke="#a9bd9b" />
            <path
              d={`M180 286l${Math.sin(Math.min(1.2, bean.reading * 2.4)) * 19} ${-Math.cos(Math.min(1.2, bean.reading * 2.4)) * 22}`}
              stroke="#ac8e55"
              strokeWidth="2"
            />
            <path
              d={`M126 ${235 - h * 390 - 20}H218l-34 20h-24Z`}
              fill="#d8c597"
              stroke="#b49d66"
            />
            {Array.from({ length: beanCount }, (_, i) => {
              const age = beanTime - i / effectiveRate;
              if (age < 0) return null;
              const x = 170 + ((i * 31) % 17),
                y =
                  age < bean.flight
                    ? 235 - h * 390 + 0.5 * 9.8 * age * age * 390
                    : 235 - Math.floor(i / 26) * 4;
              return (
                <ellipse
                  key={i}
                  cx={age < bean.flight ? x : 122 + (i % 26) * 4.5}
                  cy={y}
                  rx="2.7"
                  ry="1.9"
                  fill="#baa16e"
                />
              );
            })}
            <path
              d={`M276 ${235 - h * 390}V235m-5-${h * 390}h10m-10 ${h * 390}h10`}
              stroke="#a8bc98"
              fill="none"
            />
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">{kind === 'coins' ? t('正面朝上的枚数') : null}</p>
      <div className="textbook-em-meters">
        {kind === 'beans' ? (
          <>
            <span>
              {t('撞击贡献')} <b>{bean.impact.toFixed(3)} N</b>
            </span>
            <span>
              {t('积累重量')} <b>{bean.weight.toFixed(3)} N</b>
            </span>
          </>
        ) : (
          <span>
            {t(
              kind === 'galton' ? '一次去向随机，多次出现稳定分布' : '虚线是四枚公平硬币的理论比例',
            )}
          </span>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择统计实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'galton', label: t('伽尔顿板') },
              { value: 'coins', label: t('四枚硬币的统计') },
              { value: 'beans', label: t('豆粒撞击台秤') },
            ]}
          />
          {kind !== 'beans' && (
            <Range
              label={t('累计试验次数')}
              value={count}
              min={1}
              max={kind === 'galton' ? 200 : 1000}
              step={1}
              onChange={setCount}
            />
          )}
          {kind !== 'coins' && (
            <Range
              label={t('观察进度')}
              value={progress}
              min={0}
              max={1}
              step={0.001}
              onChange={setProgress}
            />
          )}
          {kind === 'beans' && (
            <>
              <Range
                label={t('落豆高度')}
                value={height}
                min={0.1}
                max={0.5}
                step={0.01}
                unit="m"
                onChange={setHeight}
              />
              <Range
                label={t('每秒落下豆粒数')}
                value={rate}
                min={1}
                max={40}
                step={1}
                onChange={setRate}
              />
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('统计模型与类比边界')}</summary>
        <p>
          {t(
            '伽尔顿板每层采用等概率左右选择，描绘绕过钉子的路径，不求解真实碰撞；硬币也使用独立公平试验。固定种子保证暂停与跳转一致。豆粒落下后停在秤盘，冲量取mv，另计积累重量，台秤响应时间取0.08秒。它说明多次撞击的平均效应，但不等同于气体分子弹性反弹的2mv冲量。',
          )}
        </p>
      </details>
    </div>
  );
}
