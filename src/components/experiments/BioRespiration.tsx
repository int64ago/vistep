import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  atpCoupling,
  respirationBalance,
  yeastAssay,
  type RespirationRoute,
} from '../../models/bio-respiration';
import '../../styles/bio-respiration.css';
type Mode = 'atp' | 'air' | 'sealed' | 'assay' | 'glycolysis' | 'aerobic' | 'fermentation';
const modes: Mode[] = ['atp', 'air', 'sealed', 'assay', 'glycolysis', 'aerobic', 'fermentation'];
const names = [
  'ATP与能量转换',
  '有氧气路',
  '无氧条件',
  '产物检测',
  '糖酵解',
  '有氧路径',
  '发酵路径',
];
function Flask({
  x,
  kind,
  cloud,
  p,
  id,
}: {
  x: number;
  kind: 'scrub' | 'yeast' | 'detector';
  cloud: number;
  p: number;
  id: string;
}) {
  return (
    <g transform={`translate(${x} 40)`}>
      <defs>
        <clipPath id={id}>
          <path d="M-16 0H16V35L40 130Q43 141 31 141H-31Q-43 141-40 130L-16 35Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect
          x="-45"
          y="80"
          width="90"
          height="70"
          fill={kind === 'yeast' ? '#c9bd8d' : '#d4ded0'}
        />
        {kind === 'detector' && (
          <rect x="-45" y="80" width="90" height="70" fill="#f7f4e6" opacity={cloud} />
        )}{' '}
        {kind === 'yeast' &&
          Array.from({ length: 22 }, (_, i) => (
            <ellipse
              key={i}
              cx={-25 + ((i * 29) % 51)}
              cy={92 + ((i * 13) % 40)}
              rx="2.5"
              ry="4"
              fill="#9e916a"
            />
          ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            cx={-9 + ((i * 11) % 18)}
            cy={128 - ((p * 3 + i * 0.17) % 1) * 46}
            r="2"
            fill="#edf2df"
            stroke="#adbda7"
            opacity={p > 0 ? 0.7 : 0}
          />
        ))}
      </g>
      <path
        d="M-16 0H16V35L40 130Q43 141 31 141H-31Q-43 141-40 130L-16 35Z"
        fill="none"
        stroke="#8d9d88"
        strokeWidth="2"
      />
      <rect x="-19" y="-5" width="38" height="9" rx="3" fill="#b2aa8d" />
    </g>
  );
}
function Apparatus({
  aerobic,
  p,
  scrubber,
  waited,
  id,
}: {
  aerobic: boolean;
  p: number;
  scrubber: boolean;
  waited: boolean;
  id: string;
}) {
  const connected = aerobic || (waited && p >= 0.3),
    reactionProgress = aerobic ? p : connected ? (p - 0.3) / 0.7 : 0,
    s = yeastAssay(reactionProgress, aerobic, scrubber, waited),
    xs = aerobic ? [65, 180, 295] : [110, 265];
  return (
    <div className="bio-respiration-apparatus">
      <svg
        viewBox="0 0 360 200"
        role="img"
        aria-label={t(
          aerobic
            ? '空气先去除二氧化碳，再经酵母培养液和检测液'
            : '封口耗尽残余氧后，酵母瓶连接二氧化碳检测瓶',
        )}
      >
        {xs.map((x, i) => (
          <Flask
            key={i}
            x={x}
            kind={aerobic && i === 0 ? 'scrub' : i === xs.length - 1 ? 'detector' : 'yeast'}
            cloud={s.cloudiness}
            p={aerobic || i === 0 || connected ? reactionProgress : 0}
            id={`${id}-${i}`}
          />
        ))}
        {aerobic && (
          <path
            d="M8 80V18Q8 12 14 12H57V158"
            fill="none"
            stroke={scrubber ? '#879d89' : '#c08868'}
            strokeWidth="4"
          />
        )}
        {connected &&
          xs
            .slice(0, -1)
            .map((x, i) => (
              <path
                key={i}
                d={`M${x + 8} 57V15Q${x + 8} 9 ${x + 14} 9H${xs[i + 1] - 14}Q${xs[i + 1] - 8} 9 ${xs[i + 1] - 8} 15V158`}
                fill="none"
                stroke="#879d89"
                strokeWidth="4"
              />
            ))}
        <path d={`M${xs.at(-1)! + 8} 57V19H345`} fill="none" stroke="#879d89" strokeWidth="4" />
        {aerobic && <path d="M18 14l7-4v8Z" fill="#668578" />}
        {connected && <path d={`M${aerobic ? 230 : 187} 9l-7-4v8Z`} fill="#668578" />}
      </svg>
      <div className={`bio-respiration-labels ${aerobic ? 'three' : ''}`}>
        {aerobic && <span>{t(scrubber ? 'NaOH除去空气CO₂' : '去除CO₂装置失效')}</span>}
        <span>{t('酵母培养液')}</span>
        <span>{t('澄清石灰水')}</span>
      </div>
    </div>
  );
}
export default function BioRespiration() {
  const f = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Mode>(
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'air',
    ),
    [progress, setProgress] = useState(0.7),
    [scrubber, setScrubber] = useState(true),
    [waited, setWaited] = useState(true),
    [route, setRoute] = useState<RespirationRoute>('ethanol');
  const m = f.watch ? modes[Math.min(f.chapter, 6)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.88)) : progress,
    r = m === 'aerobic' ? 'aerobic' : f.watch ? 'ethanol' : route,
    balance = respirationBalance(r),
    atp = atpCoupling(p);
  return (
    <section className="bio-respiration">
      <p className="bio-respiration-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'air' || m === 'sealed' ? (
        <>
          <Apparatus
            aerobic={m === 'air'}
            p={p}
            scrubber={f.watch || scrubber}
            waited={f.watch || waited}
            id={id}
          />
          {m === 'sealed' && (
            <p className="bio-respiration-note">
              {t(
                (f.watch || waited) && p >= 0.3
                  ? '先封口消耗残余氧，再连接检测瓶'
                  : '尚未排除残余氧，不能判定为无氧',
              )}
            </p>
          )}
        </>
      ) : m === 'assay' ? (
        <div className="bio-respiration-assays">
          {[true, false].map((o, i) => {
            const s = yeastAssay(p, o);
            return (
              <div key={i}>
                <p>{t(o ? '有氧组' : '无氧组')}</p>
                <svg
                  viewBox="0 0 170 190"
                  aria-label={t('同组分别取样检测二氧化碳与酒精')}
                  role="img"
                >
                  <path
                    d="M20 12V140Q20 160 42 160Q64 160 64 140V12M104 12V140Q104 160 126 160Q148 160 148 140V12"
                    fill="none"
                    stroke="#8f9f86"
                    strokeWidth="2"
                  />
                  <path d="M23 75H61V140Q61 157 42 157Q23 157 23 140Z" fill="#d7dfcc" />
                  <path
                    d="M23 75H61V140Q61 157 42 157Q23 157 23 140Z"
                    fill="#faf6e8"
                    opacity={s.cloudiness}
                  />
                  <path
                    d="M107 75H145V140Q145 157 126 157Q107 157 107 140Z"
                    fill={s.ethanolColorValid && o ? '#d2a25b' : '#a5a68a'}
                  />
                </svg>
                <div className="bio-respiration-labels">
                  <span>CO₂</span>
                  <span>{t('酒精检测')}</span>
                </div>
                <p>
                  {t(
                    s.ethanolColorValid
                      ? o
                        ? '本理想组无酒精'
                        : '检出酒精'
                      : '残余葡萄糖也干扰显色',
                  )}
                </p>
              </div>
            );
          })}
        </div>
      ) : m === 'atp' ? (
        <>
          <svg
            className="bio-respiration-molecule"
            viewBox="0 0 370 220"
            role="img"
            aria-label={t('ATP末端磷酸基团转移，ADP与无机磷酸仍保持物质守恒')}
          >
            <path
              d="M22 80L39 60L62 68L66 95L43 109L22 96ZM64 72L85 68L97 84L85 103L66 95"
              fill="#b8b995"
              stroke="#839478"
              strokeWidth="2"
            />
            <path
              d="M86 121L113 110L131 132L120 156L94 156Z"
              fill="#c6ad83"
              stroke="#a18d6b"
              strokeWidth="2"
            />
            <path d="M82 102L95 119M130 133H158M187 133H211" stroke="#849a82" strokeWidth="3" />
            <path
              d={`M241 133L${269 + p * 37} ${133 - p * 43}`}
              stroke="#849a82"
              strokeWidth="3"
              opacity={1 - p}
            />
            {[0, 1, 2].map((i) => (
              <g
                key={i}
                transform={`translate(${172 + i * 55 + (i === 2 ? p * 37 : 0)} ${133 - (i === 2 ? p * 43 : 0)})`}
              >
                <circle r="16" fill={i === 2 ? '#b2a15f' : '#b7c29e'} stroke="#8b9e7a" />
                <text y="6" textAnchor="middle" fontSize="26" fill="#4e654d">
                  P
                </text>
              </g>
            ))}
            <text x="184" y="195" textAnchor="middle" fontSize="26" fill="currentColor">
              ATP + H₂O → ADP + Pi
            </text>
          </svg>
          <p className="bio-respiration-note">
            {t('净反应释放可耦合的自由能，不是断键本身释放能量')}
          </p>
          <p className="bio-respiration-count">
            {t('磷酸基团总数')} {atp.boundPhosphates + atp.freePhosphate}
          </p>
        </>
      ) : (
        <>
          <svg
            className="bio-respiration-path"
            viewBox="0 0 390 350"
            role="img"
            aria-label={t('六个碳原子通过丙酮酸进入不同产物，颜色与编号保持一致')}
          >
            {m === 'aerobic' && (
              <>
                <path
                  d="M35 185Q24 146 85 140H307Q375 150 365 231Q359 288 293 287H92Q25 282 35 145Z"
                  fill="#e3d8c0"
                  stroke="#b3a488"
                  strokeWidth="3"
                />
                <path
                  d="M55 190Q50 164 83 162L103 194L123 162L143 194L163 162L183 194L203 162L223 194L243 162L263 194L283 162Q345 164 344 231L319 212L299 251L279 212L259 251L239 212L219 251L199 212L179 251L159 212L139 251L119 212L99 251Q51 257 55 190Z"
                  fill="none"
                  stroke="#b79b72"
                  strokeWidth="3"
                />
              </>
            )}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const startX = 100 + i * 36,
                startY = 42,
                pyX = 110 + Math.floor(i / 3) * 170 + ((i % 3) - 1) * 34,
                pyY = 115,
                endX =
                  r === 'aerobic'
                    ? 75 + i * 48
                    : r === 'ethanol'
                      ? i % 3 === 2
                        ? 168 + Math.floor(i / 3) * 150
                        : 78 + Math.floor(i / 3) * 150 + (i % 3) * 38
                      : 78 + Math.floor(i / 3) * 150 + (i % 3) * 38,
                endY = r === 'ethanol' && i % 3 === 2 ? 238 : 210,
                k = m === 'glycolysis' ? p : Math.min(1, p * 2),
                q = m === 'glycolysis' ? 0 : Math.max(0, p * 2 - 1),
                x = startX + (pyX - startX) * k + (endX - pyX) * q,
                y = startY + (pyY - startY) * k + (endY - pyY) * q;
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <circle r="17" fill={i < 3 ? '#ae8264' : '#718f7e'} />
                  <text y="8" textAnchor="middle" fontSize="25" fill="#fff">
                    {i + 1}
                  </text>
                </g>
              );
            })}
            <text x="195" y="23" textAnchor="middle" fontSize="26" fill="currentColor">
              {t('葡萄糖：6个碳')}
            </text>
            <text x="195" y="76" textAnchor="middle" fontSize="26" fill="currentColor">
              {t('2个丙酮酸')}
            </text>
            <text x="195" y="305" textAnchor="middle" fontSize="26" fill="currentColor">
              {m === 'glycolysis' ? (
                t('细胞质基质')
              ) : r === 'aerobic' ? (
                browserLocale() === 'en' ? (
                  <>
                    <tspan x="195">Mitochondrion: matrix</tspan>
                    <tspan x="195" dy="30">
                      and inner membrane
                    </tspan>
                  </>
                ) : (
                  t('线粒体：基质与内膜')
                )
              ) : (
                t('细胞质基质')
              )}
            </text>
          </svg>
          <div className="bio-respiration-products">
            {m === 'glycolysis' ? (
              <span>{t('净生成2 ATP；不直接需要O₂')}</span>
            ) : (
              <>
                <span>CO₂ × {balance.carbonDioxide}</span>
                <span>
                  {r === 'aerobic'
                    ? 'O₂ × 6 → H₂O'
                    : r === 'ethanol'
                      ? t('酒精 × 2')
                      : t('乳酸 × 2')}
                </span>
                <span>
                  {t(r === 'aerobic' ? '内膜上生成大量ATP' : '发酵再生NAD⁺，这一步不再产ATP')}
                </span>
              </>
            )}
          </div>
        </>
      )}
      {!f.watch && (
        <div className="bio-respiration-controls">
          <Segments
            value={mode}
            onChange={setMode}
            label={t('观察层次')}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'air' && (
            <button type="button" aria-pressed={scrubber} onClick={() => setScrubber(!scrubber)}>
              {t(scrubber ? '空气CO₂已去除' : '空气CO₂未去除')}
            </button>
          )}
          {m === 'sealed' && (
            <button type="button" aria-pressed={waited} onClick={() => setWaited(!waited)}>
              {t(waited ? '已等待耗尽残余氧' : '未等待耗尽残余氧')}
            </button>
          )}
          {m === 'fermentation' && (
            <Segments
              value={route}
              onChange={setRoute}
              label={t('发酵产物')}
              options={[
                { value: 'ethanol', label: t('酒精发酵') },
                { value: 'lactate', label: t('乳酸发酵') },
              ]}
            />
          )}
          <p>{t('培养量与显色为理想条件示意；高糖酵母可能在有氧时也发酵。')}</p>
        </div>
      )}
    </section>
  );
}
