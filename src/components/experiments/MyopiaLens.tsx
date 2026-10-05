import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  MYOPIA_LENSLETS,
  MYOPIA_OPTICS,
  MYOPIA_SELECTED_LENSLET,
  MYOPIA_SLICE_LENSLET_MM,
  MYOPIA_TRIAL,
  myopiaOptics,
  myopiaShot,
  type MyopiaLensKind,
  type MyopiaPoint,
} from '../../models/myopia-lens';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import '../../styles/myopia-lens.css';
type OpticalState = ReturnType<typeof myopiaOptics>;
const path = (points: MyopiaPoint[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
const colors = { clear: '#368a9a', defocus: '#b5773f' };
function OpticalBench({ state, close = false }: { state: OpticalState; close?: boolean }) {
  const id = useId().replaceAll(':', '');
  const clear = state.foci[0],
    extra = state.foci[1];
  const nearY = (clear.point.y + (extra?.point.y ?? clear.point.y)) / 2;
  const viewBox = close ? `${state.retinaMm - 3.1} ${nearY - 1.1} 4.3 2.2` : '-20 -15 49 30';
  return (
    <div className={`myopia-bench ${close ? 'myopia-close' : ''}`}>
      <div className="myopia-plane-labels" aria-hidden="true">
        {close ? (
          <>
            <span>{t('附加成分会聚')}</span>
            <span>{t('清晰成分会聚')}</span>
          </>
        ) : (
          <>
            <span>{t('眼镜片')}</span>
            <span>{t('等效眼光学')}</span>
            <span>{t('视网膜面')}</span>
          </>
        )}
      </div>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={t(
          close ? '近看：两束光的焦点与同一视网膜面' : '眼镜、等效眼与同一远处光点的光路',
        )}
      >
        <defs>
          <linearGradient id={`${id}-eye`} x1="0" x2="1">
            <stop stopColor="#f1e4de" stopOpacity=".18" />
            <stop offset="1" stopColor="#dec4b8" stopOpacity=".5" />
          </linearGradient>
          <radialGradient id={`${id}-lens`}>
            <stop stopColor="#d3edf0" stopOpacity=".2" />
            <stop offset="1" stopColor="#72a6b5" stopOpacity=".4" />
          </radialGradient>
        </defs>
        {!close && (
          <>
            <path
              d={`M -1 -6 C 4 -13 ${state.retinaMm + 4} -14 ${state.retinaMm + 4} 0 C ${state.retinaMm + 4} 14 4 13 -1 6 Q -4 0 -1 -6Z`}
              fill={`url(#${id}-eye)`}
              stroke="#ccb1a5"
              strokeWidth="1.3"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M0 -3.5 Q-2.2 0 0 3.5 Q2.2 0 0 -3.5Z"
              fill={`url(#${id}-lens)`}
              stroke="#92b3b9"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M0 -6 L0 -3.5 M0 3.5L0 6"
              stroke="#7c716a"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M-19 0H28"
              stroke="#c9c9bd"
              strokeWidth="1"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
            {state.kind !== 'none' && (
              <path
                d="M-12.7 -8 Q-11.8 0 -12.7 8 L-11.3 8 Q-12.2 0 -11.3 -8Z"
                fill="#d5e5e5"
                fillOpacity=".8"
                stroke="#7eaaaa"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {state.kind === 'dims' && (
              <circle
                cx="-12"
                cy={MYOPIA_SLICE_LENSLET_MM}
                r={MYOPIA_OPTICS.lensletDiameterMm / 2}
                fill="#d7b17a"
                fillOpacity=".6"
                stroke="#ae783e"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </>
        )}
        <path
          d={`M${state.retinaMm} -11 V11`}
          stroke="#ab7771"
          strokeWidth={close ? '2' : '2.5'}
          vectorEffect="non-scaling-stroke"
        />
        {state.rays.map((ray, i) => (
          <path
            key={i}
            d={path(ray.points)}
            fill="none"
            stroke={colors[ray.kind]}
            strokeWidth={close ? '1.8' : '1.5'}
            vectorEffect="non-scaling-stroke"
            opacity={ray.admitted ? 0.65 : 0.3}
          />
        ))}
        {state.foci
          .filter((f) => f.admitted)
          .map((f) => (
            <g key={f.kind}>
              <circle
                cx={f.point.x}
                cy={f.point.y}
                r={close ? 0.105 : 0.45}
                fill={colors[f.kind]}
                fillOpacity=".16"
              />
              <circle
                cx={f.point.x}
                cy={f.point.y}
                r={close ? 0.038 : 0.12}
                fill={colors[f.kind]}
              />
            </g>
          ))}
        {close && extra?.admitted && (
          <path
            d={`M${extra.point.x} ${nearY + 0.75}H${state.retinaMm}`}
            stroke="#9c7949"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <div className="myopia-bench-footer">
        {close ? (
          <>
            <span>
              <i className="myopia-amber" />
              {t(state.addD === 0 ? '两个焦点重合' : '额外焦点在视网膜前')}
            </span>
            <strong>{state.defocusMm.toFixed(2)} mm</strong>
          </>
        ) : (
          <>
            <span>
              <i className="myopia-blue" />
              {t('矫正光路')}
              {state.kind === 'none' ? ` · ${t('未戴镜')}` : ''}
            </span>
            <span>
              {state.kind === 'dims' ? (
                <>
                  <i className="myopia-amber" />
                  {t(extra?.admitted ? '微透镜成分' : '这束微透镜光被瞳孔挡住')}
                </>
              ) : (
                <>{t('教学等效模型')}</>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
function LensSurface() {
  return (
    <div className="myopia-surface">
      <div className="myopia-lens-map">
        <svg viewBox="-18 -18 36 36" role="img" aria-label={t('中央矫正区与环绕的附加微透镜阵列')}>
          <circle r="17.3" fill="#e4eff0" stroke="#acc6c7" strokeWidth=".12" />
          <circle r="16.5" fill="#d5e3df" fillOpacity=".35" />
          {MYOPIA_LENSLETS.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={MYOPIA_OPTICS.lensletDiameterMm / 2}
              fill="#b99863"
              fillOpacity=".23"
              stroke="#aa8854"
              strokeWidth=".028"
            />
          ))}
          <circle r="4.5" fill="#f5faf7" stroke="#5d9aab" strokeWidth=".12" />
          <path
            d={`M0 0L${(MYOPIA_SELECTED_LENSLET.x / -MYOPIA_SLICE_LENSLET_MM) * 16.5} ${(MYOPIA_SELECTED_LENSLET.y / -MYOPIA_SLICE_LENSLET_MM) * 16.5}`}
            stroke="#758d86"
            strokeWidth=".07"
            strokeDasharray=".3 .3"
          />
          <circle
            cx={MYOPIA_SELECTED_LENSLET.x}
            cy={MYOPIA_SELECTED_LENSLET.y}
            r=".63"
            fill="#c38940"
            stroke="#805b30"
            strokeWidth=".06"
          />
        </svg>
        <div className="myopia-clear-label">
          <b>9 mm</b>
          <span>{t('中央矫正区')}</span>
        </div>
      </div>
      <div className="myopia-lens-detail">
        <span>{t('放大一枚微透镜')} · 1.03 mm</span>
        <svg viewBox="0 0 180 96" aria-hidden="true">
          <path d="M12 76Q92 48 168 76L168 91Q92 67 12 91Z" fill="#bfd9dd" stroke="#80a7af" />
          <path
            d="M62 63Q88 20 118 63"
            fill="#dfbd85"
            fillOpacity=".55"
            stroke="#b48746"
            strokeWidth="2"
          />
          <path d="M62 13V70M118 13V70M62 15H118" stroke="#b0b3a6" strokeDasharray="3 4" />
        </svg>
        <b>+3.50 D</b>
        <p>{t('附加光焦度叠在远用矫正上。')}</p>
      </div>
      <p className="myopia-map-note">{t('DIMS 示意 · 虚线为径向切面 · 抽样排布')}</p>
    </div>
  );
}
function TrialEvidence() {
  return (
    <div className="myopia-evidence">
      <span className="myopia-kicker">{t('光学模型之外，还要看临床试验')}</span>
      <h3>{t('两年后的平均眼轴增长')}</h3>
      <p>{t('香港 · 8–13 岁 · 160 位完成随访')}</p>
      {[
        ['single', t('普通单光镜片'), MYOPIA_TRIAL.single],
        ['dims', t('DIMS 镜片'), MYOPIA_TRIAL.dims],
      ].map(([key, label, group]) => {
        const data = group as typeof MYOPIA_TRIAL.single | typeof MYOPIA_TRIAL.dims;
        return (
          <div className={`myopia-trial-row myopia-trial-${key}`} key={String(key)}>
            <div>
              <span>{String(label)}</span>
              <b>+{data.axialMm.toFixed(2)} mm</b>
            </div>
            <div className="myopia-trial-track">
              <i style={{ width: `${(data.axialMm / 0.6) * 100}%` }} />
              <span
                style={{
                  left: `${((data.axialMm - data.axialSeMm) / 0.6) * 100}%`,
                  width: `${((2 * data.axialSeMm) / 0.6) * 100}%`,
                }}
              />
            </div>
            <small>
              n = {data.n} · {t('均值 ± 标准误')} {data.axialSeMm.toFixed(2)} mm
            </small>
          </div>
        );
      })}
      <p className="myopia-evidence-limit">
        {t('两组眼轴都仍在增长。组平均结果不能预测某个孩子。')}
      </p>
      <a href={MYOPIA_TRIAL.source} target="_blank" rel="noreferrer">
        {t('阅读原始随机试验')} ↗
      </a>
    </div>
  );
}
export default function MyopiaLens() {
  const demo = useShowcase(),
    shot = myopiaShot(demo.chapter, demo.chapterProgress);
  const [kind, setKind] = useState<MyopiaLensKind>('dims'),
    [myopiaD, setMyopiaD] = useState(3),
    [addD, setAddD] = useState(3.5),
    [angleDeg, setAngleDeg] = useState(18),
    [near, setNear] = useState(false);
  const state = demo.watch ? shot.optics : myopiaOptics({ kind, myopiaD, addD, angleDeg });
  const view = demo.watch ? shot.view : near && state.foci[1]?.admitted ? 'focus' : 'eye';
  return (
    <div className="myopia-installation" data-myopia-view={view}>
      {view === 'lens' ? (
        <LensSurface />
      ) : view === 'evidence' ? (
        <TrialEvidence />
      ) : (
        <>
          <div className="myopia-heading">
            <span>{t(view === 'focus' ? '近看两处会聚' : '跟踪同一个远处光点')}</span>
            <span>{t('旁轴光学示意')}</span>
          </div>
          <OpticalBench state={state} close={view === 'focus'} />
          <div className="myopia-prescription-line">
            <span>
              {t('远用矫正')} <b>{state.baseD.toFixed(2)} D</b>
            </span>
            {state.kind === 'dims' && (
              <span>
                {t('微透镜附加')} <b>+{state.addD.toFixed(2)} D</b>
              </span>
            )}
          </div>
        </>
      )}
      {!demo.watch && (
        <div className="myopia-explore">
          <Segments
            label={t('镜片结构')}
            value={kind}
            onChange={setKind}
            options={[
              { value: 'none', label: t('未戴镜') },
              { value: 'single', label: t('普通单光') },
              { value: 'dims', label: t('附加微透镜') },
            ]}
          />
          <div className="myopia-controls">
            <Range
              label={t('教学眼的屈光差')}
              value={myopiaD}
              min={1}
              max={5}
              step={0.5}
              unit="D"
              onChange={setMyopiaD}
            />
            <Range
              label={t('远处光点偏离中央')}
              value={angleDeg}
              min={0}
              max={20}
              step={1}
              unit="°"
              onChange={setAngleDeg}
            />
            {kind === 'dims' && (
              <Range
                label={t('微透镜附加光焦度')}
                value={addD}
                min={0}
                max={4}
                step={0.25}
                unit="D"
                onChange={setAddD}
              />
            )}
          </div>
          <div className="myopia-actions">
            <button
              type="button"
              disabled={kind !== 'dims' || !state.foci[1]?.admitted}
              onClick={() => setNear(!near)}
            >
              {t(near ? '回到整条光路' : '近看焦点')}
            </button>
            <button
              type="button"
              onClick={() => {
                setKind('dims');
                setMyopiaD(3);
                setAddD(3.5);
                setAngleDeg(18);
                setNear(false);
              }}
            >
              {t('恢复默认设置')}
            </button>
          </div>
          <p>{t('调参只改变教学光路，不给出验配处方或未来眼轴预测。')}</p>
          <details>
            <summary>{t('查看临床证据')}</summary>
            <TrialEvidence />
          </details>
        </div>
      )}
    </div>
  );
}
