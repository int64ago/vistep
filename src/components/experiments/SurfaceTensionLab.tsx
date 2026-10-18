import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  fullGlass,
  tautThread,
  threadLoop,
  sessileDrop,
  floatingNeedle,
} from '../../models/surface-tension-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function SurfaceTensionLab() {
  const film = useShowcase();
  const [mode, setMode] = useState(
      film.variant?.includes('soap')
        ? 'film'
        : film.variant?.includes('wetting')
          ? 'wetting'
          : film.variant?.includes('needle')
            ? 'needle'
            : 'glass',
    ),
    [progress, setProgress] = useState(0.7),
    [count, setCount] = useState(20),
    [gamma] = useState(0.072),
    [threadType, setThreadType] = useState('chord'),
    [puncture, setPuncture] = useState('open'),
    [angle, setAngle] = useState(110);
  const stage = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    kind = film.watch
      ? stage < 2
        ? 'glass'
        : stage < 6
          ? 'film'
          : stage < 8
            ? 'wetting'
            : 'needle'
      : mode,
    n = film.watch ? Math.floor((stage === 0 ? 20 : 60) * p) : count,
    glass = fullGlass(n, gamma);
  const loop = film.watch ? stage >= 4 : threadType === 'loop',
    open = film.watch ? stage === 3 || stage === 5 : puncture === 'open',
    threadP = open ? p : 0,
    thread = useMemo(() => tautThread(threadP), [threadP]),
    ring = useMemo(() => threadLoop(threadP), [threadP]);
  const thetaA = film.watch ? (stage === 6 ? 90 - 55 * p : 35) : 35,
    thetaB = film.watch ? (stage === 7 ? 90 + 20 * p : 90) : angle,
    broken = film.watch ? stage === 9 && p > 0.15 : puncture === 'open',
    needle = floatingNeedle(gamma, broken, film.watch ? Math.max(0, p - 0.15) * 0.5 : p * 0.5),
    needleY = needle.stable
      ? 136 + needle.depression * 22000
      : Math.min(255, 165 + needle.sink * 230),
    wet = film.watch ? stage === 8 : p < 0.5;
  const stringPath = thread.map((q, i) => `${i ? 'L' : 'M'}${180 + q.x} ${169 + q.y}`).join(' '),
    loopPath = ring.map((q, i) => `${i ? 'L' : 'M'}${180 + q.x} ${169 + q.y}`).join(' ') + 'Z';
  const meniscus = Array.from({ length: 81 }, (_, i) => {
    const r = -glass.radius + (2 * glass.radius * i) / 80;
    return { x: 180 + r * 4000, z: glass.profile(r) };
  });
  return (
    <div className="textbook-em surface-tension-lab">
      <div className="textbook-em-state">
        <span>
          {t(
            kind === 'glass'
              ? '满杯水与曲别针'
              : kind === 'film'
                ? '肥皂膜与棉线'
                : kind === 'wetting'
                  ? '玻璃与蜡面上的水滴'
                  : '浮在水面的缝衣针',
          )}
        </span>
        <span>
          {kind === 'glass'
            ? `${n} ${t('枚')}`
            : kind === 'film'
              ? t(loop ? '闭合线圈' : '两端固定的线')
              : kind === 'wetting'
                ? 'V = 5 μL'
                : `${(gamma * 1000).toFixed(0)} mN/m`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('水面隆起、肥皂膜、浸润与浮针四种表面张力实验')}
      >
        {kind === 'glass' && (
          <>
            <path
              d="M90 106V239Q90 249 100 249H260Q270 249 270 239V106"
              fill="#edf2e5"
              stroke="#a9bc9c"
              strokeWidth="3"
            />
            <path
              d={
                meniscus.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${110 - q.z * 4000}`).join(' ') +
                'L268 241H92Z'
              }
              fill="#c0d8cd"
              stroke="#87ad9d"
              strokeWidth="1.5"
            />
            {Array.from({ length: n }, (_, i) => (
              <path
                key={i}
                d={`M${108 + (i % 10) * 14} ${film.watch && i === n - 1 ? 120 + (115 - Math.floor(i / 10) * 10) * Math.min(1, ((p * (stage === 0 ? 20 : 60)) % 1) * 2) : 235 - Math.floor(i / 10) * 10}q-4-6 1-8q5-1 5 4l-1 5q-1 3-3 1l1-5`}
                fill="none"
                stroke="#9b9d88"
                strokeWidth="1"
              />
            ))}
            {glass.overflow > 0 && (
              <>
                <path d="M269 110q17 13 9 47" fill="none" stroke="#8db6a7" strokeWidth="3" />
                {[0, 1, 2].map((i) => (
                  <ellipse
                    key={i}
                    cx={281 + i * 3}
                    cy={170 + ((p * 90 + i * 30) % 75)}
                    rx="2.5"
                    ry="4"
                    fill="#99bfb0"
                  />
                ))}
              </>
            )}
            <path d="M92 288H268" stroke="#b7c7a8" strokeDasharray="3 4" />
            <path
              d={meniscus.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${288 - q.z * 22000}`).join(' ')}
              fill="none"
              stroke="#87ac9b"
              strokeWidth="2.5"
            />
          </>
        )}
        {kind === 'film' && (
          <>
            {!open && <circle cx="180" cy="169" r="100" fill="#dce8d0" />}
            {open && !loop && <path d={`${stringPath}A100 100 0 0 1 80 169Z`} fill="#d2e2c5" />}
            {open && loop && (
              <path
                d={`M80 169a100 100 0 1 0 200 0a100 100 0 1 0-200 0Z${loopPath}`}
                fill="#d2e2c5"
                fillRule="evenodd"
              />
            )}
            <circle cx="180" cy="169" r="100" stroke="#9cad88" strokeWidth="4" fill="none" />
            {loop ? (
              <>
                <path d={loopPath} stroke="#b39c68" strokeWidth="2.5" fill="none" />
                <path d={`M180 69V${169 + ring[72].y}`} stroke="#b39c68" strokeWidth="1.5" />
              </>
            ) : (
              <path d={stringPath} stroke="#b39c68" strokeWidth="2.5" fill="none" />
            )}
            {open && (
              <>
                <path
                  d={loop ? 'M180 168l30-35' : 'M180 102l30-35'}
                  stroke="#a7aaa0"
                  strokeWidth="2"
                />
                <circle cx="180" cy={loop ? 168 : 102} r="3" fill="#f1f3e7" />
                {loop ? (
                  [0, 1, 2, 3].map((i) => {
                    const a = (i * Math.PI) / 2;
                    return (
                      <path
                        key={i}
                        d={`M${180 + Math.cos(a) * 45} ${169 + Math.sin(a) * 45}l${Math.cos(a) * 18} ${Math.sin(a) * 18}`}
                        stroke="#84a272"
                        strokeWidth="2"
                      />
                    );
                  })
                ) : (
                  <path
                    d={`M180 ${169 + thread[50].y + 8}v22m-4-6 4 6 4-6`}
                    stroke="#84a272"
                    strokeWidth="2"
                    fill="none"
                  />
                )}
              </>
            )}
          </>
        )}
        {kind === 'wetting' &&
          [95, 265].map((cx, i) => {
            const d = sessileDrop(i ? thetaB : thetaA),
              R = d.radius * 35000,
              a = d.base * 35000;
            return (
              <g key={i}>
                <rect
                  x={cx - 76}
                  y="212"
                  width="152"
                  height="10"
                  rx="4"
                  fill={i ? '#d2bd8e' : '#ceddce'}
                  stroke={i ? '#bba36f' : '#a6beab'}
                />
                <path
                  d={`M${cx - a} 211A${R} ${R} 0 ${(i ? thetaB : thetaA) > 90 ? 1 : 0} 1 ${cx + a} 211Z`}
                  fill="#b8d3c7"
                  stroke="#85ac9c"
                  strokeWidth="1.6"
                />
                <text x={cx} y="261" textAnchor="middle">
                  {t(i ? '涂蜡玻璃' : '洁净玻璃')}
                </text>
                <text
                  x={cx}
                  y="291"
                  textAnchor="middle"
                >{`${(i ? thetaB : thetaA).toFixed(0)}°`}</text>
              </g>
            );
          })}
        {kind === 'needle' && (
          <>
            <path d="M37 105V265H323V105" fill="#eef3e6" stroke="#a7bc98" strokeWidth="3" />
            <path
              d={
                needle.stable
                  ? `M39 136H105C140 136 157 ${needleY} 172 ${needleY}H188C203 ${needleY} 220 136 255 136H321V263H39Z`
                  : 'M39 136H321V263H39Z'
              }
              fill="#c5dcd0"
              stroke="#92b6a7"
              strokeWidth="1.5"
            />
            {wet && (
              <path
                d={`M142 ${needleY + 8 + p * 70}q20 10 37 0t39 2`}
                stroke="#e5e8d7"
                strokeWidth="4"
                fill="none"
                opacity={Math.max(0.15, 1 - p)}
              />
            )}
            <circle cx="180" cy={needleY} r="8" fill="#a3aa9b" stroke="#7d8b78" strokeWidth="2" />
            {needle.stable && (
              <>
                <path
                  d={`M168 ${needleY - 2}l-23-13m8 0-8 0 4 7M192 ${needleY - 2}l23-13m-8 0 8 0-4 7`}
                  stroke="#7f9c6c"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d={`M180 ${needleY + 10}v30m-4-6 4 6 4-6`}
                  stroke="#b49966"
                  strokeWidth="2"
                  fill="none"
                />
              </>
            )}
            {film.watch && stage === 9 && p < 0.4 && (
              <path
                d={`M180 66V${Math.min(needleY - 10, 160)}`}
                stroke="#b9a57e"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {kind === 'glass'
          ? t('水面近景：纵向放大')
          : kind === 'film'
            ? t(open ? '剩余薄膜牵拉棉线' : '两侧薄膜作用相互平衡')
            : kind === 'needle'
              ? t('针的横截面示意，尺度放大')
              : null}
      </p>
      <div className="textbook-em-meters">
        {kind === 'glass' ? (
          <>
            <span>
              {t('水面最高隆起')} <b>{(glass.centerHeight * 1000).toFixed(2)} mm</b>
            </span>
            <span>
              {t('已溢出体积')} <b>{(glass.overflow * 1e6).toFixed(2)} mL</b>
            </span>
          </>
        ) : kind === 'film' ? (
          <span>{t('棉线总长度保持不变')}</span>
        ) : kind === 'wetting' ? (
          <span>{t('相同水滴体积，不同接触角')}</span>
        ) : (
          <span>
            {t(needle.stable ? '界面张力的竖直分量支持针' : '完全没入水后，浮力小于重力')}
          </span>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择液体实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'glass', label: t('满杯水与曲别针') },
              { value: 'film', label: t('肥皂膜与棉线') },
              { value: 'wetting', label: t('玻璃与蜡面上的水滴') },
              { value: 'needle', label: t('浮在水面的缝衣针') },
            ]}
          />
          {kind === 'glass' ? (
            <Range
              label={t('沉入水中的曲别针数')}
              value={count}
              min={0}
              max={60}
              step={1}
              onChange={setCount}
            />
          ) : kind === 'wetting' ? (
            <Range
              label={t('蜡面接触角')}
              value={angle}
              min={70}
              max={140}
              step={1}
              onChange={setAngle}
            />
          ) : (
            <>
              <Range
                label={t('观察进度')}
                value={progress}
                min={0}
                max={1}
                step={0.005}
                onChange={setProgress}
              />
              <Segments
                label={t(kind === 'film' ? '薄膜状态' : '针与界面')}
                value={puncture}
                onChange={setPuncture}
                options={[
                  { value: 'closed', label: t(kind === 'film' ? '完整薄膜' : '停在水面') },
                  { value: 'open', label: t(kind === 'film' ? '刺破一侧' : '按入水下') },
                ]}
              />
            </>
          )}
          {kind === 'film' && (
            <Segments
              label={t('棉线形式')}
              value={threadType}
              onChange={setThreadType}
              options={[
                { value: 'chord', label: t('两端固定的线') },
                { value: 'loop', label: t('闭合线圈') },
              ]}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('表面张力模型与边界')}</summary>
        <p>
          {t(
            '杯口采用小斜率轴对称毛细方程，边缘固定，示例脱钉角20度；杯子材质、清洁度与振动会改变真实极限。棉线形变保持长度，但不求解流体瞬态。水滴用忽略重力的小球冠近似。浮针模型突出表面张力，浮在界面时忽略较小浮力；完全没入后另算浮力和阻尼下沉，不能把两种状态混用。',
          )}
        </p>
      </details>
    </div>
  );
}
