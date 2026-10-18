import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  paperDrop,
  reactionDistance,
  reactionTime,
  tiedStoneArgument,
  fallActivityShot,
  type DropObject,
} from '../../models/free-fall-activities';
import '../../styles/free-fall-activities.css';
const objects: DropObject[] = ['sheet', 'paper-ball', 'eraser'];
function FallingObject({ kind, x, y }: { kind: DropObject; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {kind === 'sheet' ? (
        <>
          <path d="M-24 -8L19 -14 27 8-17 14Z" fill="#eee6d1" stroke="#c5b697" />
          <path d="M-15 -3L15 -7M-12 3L17 -2" stroke="#cfc3a7" strokeWidth=".8" />
        </>
      ) : kind === 'paper-ball' ? (
        <>
          <path d="M-13 -5L-7 -14 5 -13 14 -5 12 8 3 14-10 9Z" fill="#e4dac2" stroke="#b9a786" />
          <path
            d="M-7 -14L-2 -2 14 -5M-2 -2L3 14M-13 -5L-2 -2-10 9M-2 -2L12 8"
            stroke="#c2b18e"
            fill="none"
          />
        </>
      ) : (
        <>
          <path d="M-17 -9L9 -14 18 -6 18 10-9 14-17 7Z" fill="#91a29b" stroke="#6d857b" />
          <path d="M-17 -9L-9 -1 18 -6M-9 -1V14" stroke="#bcc9bc" fill="none" />
        </>
      )}
    </g>
  );
}
export default function FreeFallActivities() {
  const film = useShowcase();
  const [path, setPath] = useState(() =>
      film.variant?.includes('tied-stones')
        ? 'reasoning'
        : film.variant?.includes('reaction-ruler')
          ? 'ruler'
          : 'paper',
    ),
    [time, setTime] = useState(0.5),
    [air, setAir] = useState('air'),
    [reaction, setReaction] = useState(0.2),
    [step, setStep] = useState(2);
  const shot = fallActivityShot(film.chapter, film.chapterProgress),
    mode = film.watch ? shot.mode : path,
    now = film.watch ? shot.time : time,
    delay = film.watch ? shot.reaction : reaction,
    logic = tiedStoneArgument(film.watch ? shot.logicStage : step),
    rho = film.watch ? 1.225 : air === 'air' ? 1.225 : 0,
    fall = film.watch ? reactionDistance(delay) * shot.release : reactionDistance(delay),
    distance = Math.min(0.5, fall),
    caught = film.watch ? shot.release >= 1 : true,
    gripY = 254 - (distance / 0.5) * 224;
  return (
    <section className="fall-activities">
      <header>
        <p>
          {t(
            mode === 'paper'
              ? '纸的质量相同，形状不同'
              : mode === 'reasoning'
                ? '先检验“重的必定落得快”这个假设'
                : '把下落距离变成反应时间',
          )}
        </p>
        <span>
          {t(
            mode === 'paper'
              ? '同高、同时、从静止释放'
              : mode === 'reasoning'
                ? '思想推理，不是实验记录'
                : '镜头跟随尺子，手指相对尺面上移',
          )}
        </span>
      </header>
      {mode === 'paper' ? (
        <>
          <div className="fall-paper-columns">
            {objects.map((kind) => {
              const s = paperDrop(kind, now, rho);
              return (
                <figure key={kind}>
                  <figcaption>
                    {t(kind === 'sheet' ? '平纸片' : kind === 'paper-ball' ? '同质量纸团' : '橡皮')}
                  </figcaption>
                  <svg
                    viewBox="0 0 100 245"
                    role="img"
                    aria-label={t('由同一释放高度下落的纸或橡皮，接触基准一致')}
                  >
                    <path d="M15 34H85" stroke="#c4cbb9" strokeDasharray="3 4" />
                    <path d="M12 218H88" stroke="#a2b39b" strokeWidth="2" />
                    <path
                      d={`M50 20V${20 + (s.distance / 1.4) * 184}`}
                      stroke="#d3dac8"
                      strokeDasharray="2 6"
                    />
                    <FallingObject kind={kind} x={50} y={20 + (s.distance / 1.4) * 184} />
                    {s.landed && (
                      <ellipse cx="50" cy="221" rx="23" ry="3" fill="#9baf91" opacity=".15" />
                    )}
                  </svg>
                  <p>{kind === 'eraser' ? '20 g' : '5 g'}</p>
                </figure>
              );
            })}
          </div>
          <div className="fall-observation">
            <span>
              {t('实验时间')} {now.toFixed(2)} s
            </span>
            <b>
              {t(
                now === 0
                  ? '先保持同样的释放条件'
                  : rho === 0
                    ? '忽略空气阻力，三者保持齐平'
                    : '形状改变了空气阻力的影响',
              )}
            </b>
          </div>
        </>
      ) : mode === 'reasoning' ? (
        <div className="fall-reasoning">
          <svg
            viewBox="0 0 320 150"
            role="img"
            aria-label={t('轻石与重石捆绑为同一组合，分别推导出两种相互矛盾的结果')}
          >
            <path d="M72 46L99 30 127 41 134 73 109 91 81 80Z" fill="#a5b49b" stroke="#7f9877" />
            <path d="M172 58L191 47 211 59 214 79 193 91 173 78Z" fill="#cad1bb" stroke="#9cab8d" />
            <path d="M118 59C136 45 158 84 178 68" stroke="#baa47e" strokeWidth="2" fill="none" />
            <path
              d="M109 98V126l-5-8m5 8 5-8M193 98V115l-5-8m5 8 5-8"
              stroke="#8d9f80"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <div className="fall-logic-claims">
            <p data-visible={logic.stage >= 0}>{t('假设：重石比轻石落得快。')}</p>
            <p data-visible={logic.stage >= 1}>{t('轻石拖慢重石 → 组合应更慢。')}</p>
            <p data-visible={logic.stage >= 2}>{t('组合总质量更大 → 按原假设又应更快。')}</p>
          </div>
          <p className="fall-logic-result">
            {t(
              logic.contradiction
                ? '同一组合不可能既更慢又更快：原假设出了问题。'
                : '两条推理，必须应用在同一个组合上。',
            )}
          </p>
        </div>
      ) : (
        <div className="fall-ruler">
          <svg
            viewBox="0 0 320 278"
            role="img"
            aria-label={t('接尺时读取下落距离，并按平方根关系换算反应时间')}
          >
            <path d={`M38 ${gripY}H282`} stroke="#adbba0" strokeDasharray="4 5" />
            <g transform="translate(137 30)">
              <rect x="0" y="0" width="49" height="224" rx="4" fill="#e5d6b5" stroke="#c4ad7e" />
              {Array.from({ length: 26 }, (_, i) => (
                <path
                  key={i}
                  d={`M0 ${224 - (i / 25) * 224}h${i % 5 === 0 ? 13 : 7}`}
                  stroke="#aa946d"
                />
              ))}
              <path d="M0 224H49" stroke="#b49052" strokeWidth="2" />
              {[0.1, 0.15, 0.2, 0.25, 0.3].map((q) => (
                <path
                  key={q}
                  d={`M30 ${224 - (reactionDistance(q) / 0.5) * 224}H49`}
                  stroke="#6c8b70"
                  strokeWidth="2"
                />
              ))}
            </g>
            <g transform={`translate(0 ${gripY - 91})`}>
              <path
                d={
                  caught
                    ? 'M80 92Q115 76 138 95L151 102 181 97Q219 84 242 99L239 123H92Z'
                    : 'M80 92Q116 78 131 91L137 103M186 102L201 89Q226 83 244 96'
                }
                fill={caught ? '#d7bd98' : 'none'}
                stroke="#c1a27b"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          </svg>
          <div className="fall-ruler-readout">
            <span>
              {t('下落距离')} <b>{(distance * 100).toFixed(1)} cm</b>
            </span>
            <span>
              {t('换算时间')} <b>{(reactionTime(distance) * 1000).toFixed(0)} ms</b>
            </span>
          </div>
          <p>{t('较大的时间刻度间隔，对应更长的下落距离。')}</p>
        </div>
      )}
      {!film.watch && (
        <div className="fall-controls">
          <Segments
            label={t('实验路径')}
            value={path}
            onChange={setPath}
            options={[
              { value: 'paper', label: t('纸片与纸团') },
              { value: 'reasoning', label: t('两石反证') },
              { value: 'ruler', label: t('反应尺') },
            ]}
          />
          {mode === 'paper' ? (
            <>
              <Range
                label={t('下落时刻')}
                value={time}
                min={0}
                max={1.4}
                step={0.01}
                unit="s"
                onChange={setTime}
              />
              <Segments
                label={t('空气条件')}
                value={air}
                onChange={setAir}
                options={[
                  { value: 'air', label: t('有空气') },
                  { value: 'vacuum', label: t('忽略阻力') },
                ]}
              />
            </>
          ) : mode === 'reasoning' ? (
            <Range label={t('推理步骤')} value={step} min={0} max={2} onChange={setStep} />
          ) : (
            <Range
              label={t('接尺延迟')}
              value={reaction}
              min={0.1}
              max={0.3}
              step={0.01}
              unit="s"
              onChange={setReaction}
            />
          )}
        </div>
      )}
      <p className="fall-note">
        {t(
          mode === 'paper'
            ? '固定姿态和阻力系数的教学近似；真实纸片会翻滚，数字不是测量结果。'
            : mode === 'reasoning'
              ? '反证否定的是“只凭质量决定落速”的假设，不代替自由落体测量。'
              : '模拟标尺不测量屏幕前使用者的真实反应能力。',
        )}
      </p>
    </section>
  );
}
