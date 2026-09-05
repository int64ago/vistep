import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { SIPHON, siphonShot, siphonTrial, type SiphonStatus } from '../../models/siphon';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import SiphonApparatus from '../lab/SiphonApparatus';
import '../../styles/siphon.css';

const statusLabels: Record<SiphonStatus, string> = {
  air: '顶部仍有空气，虹吸尚未建立。',
  priming: '预充在排出空气，还需要外部做功。',
  flow: '水柱连通，落差正在驱动流动。',
  level: '出口不低于水面，持续流量归零。',
  vented: '顶部进气，连续液柱已经断开。',
  vapor: '沿管最低压已触及汽化边界。',
  uncovered: '入口露出水面，空气进入管路。',
};
export default function Siphon() {
  const demo = useShowcase();
  const [angle, setAngle] = useState(0),
    [top, setTop] = useState(1.9);
  const [atmosphere, setAtmosphere] = useState(101.325),
    [temperature, setTemperature] = useState(20);
  const [seconds, setSeconds] = useState(0),
    [primed, setPrimed] = useState(true),
    [vented, setVented] = useState(false),
    [flat, setFlat] = useState(false);
  const manual = useMemo(
    () =>
      siphonTrial({
        angle: (angle * Math.PI) / 180,
        top,
        atmosphere: atmosphere * 1000,
        temperature,
        seconds,
        primed,
        vented,
      }),
    [angle, top, atmosphere, temperature, seconds, primed, vented],
  );
  const shot = demo.watch
    ? siphonShot(demo.chapter, demo.chapterProgress)
    : {
        state: manual,
        view: top > 2 ? ('height' as const) : ('apparatus' as const),
        focus: 0,
        comparison: top > 2,
      };
  const s = shot.state,
    showPressure = shot.view === 'pressure' || shot.view === 'height';
  const resetTrial = (apply: () => void) => {
    apply();
    setSeconds(0);
  };
  return (
    <section className="siphon-study" data-view={shot.view} data-watch={demo.watch}>
      <div className="siphon-heading">
        <span>{t('虹吸')}</span>
        <button type="button" aria-pressed={flat} onClick={() => setFlat(!flat)}>
          {t(flat ? '立体剖视' : '线稿剖视')}
        </button>
      </div>
      <div className="siphon-reading">
        <div>
          <span>
            {t(showPressure ? (s.pressureValid ? '弯顶压力' : '弯顶压力（假设液柱）') : '瞬时流量')}
          </span>
          <strong>
            {showPressure ? (s.crestPressure / 1000).toFixed(3) : (s.flow * 1000).toFixed(3)}
            <small>{showPressure ? 'kPa' : 'L/s'}</small>
          </strong>
        </div>
        {showPressure && (
          <div className="siphon-boundary">
            <span>{t(s.pressureValid ? '沿管最低压' : '最低压（假设液柱）')}</span>
            <b>{(s.minimumPressure / 1000).toFixed(3)} kPa</b>
          </div>
        )}
        {!showPressure && (
          <span className="siphon-condition">
            {t(
              s.status === 'air' || s.status === 'priming'
                ? '先把空气排出去'
                : s.status === 'vented'
                  ? '落差还在，水柱已断'
                  : s.head <= 0.001
                    ? '落差消失'
                    : '低处的出口提供落差',
            )}
          </span>
        )}
      </div>
      <SiphonApparatus shot={shot} flat={flat} compact={demo.watch} />
      {(!demo.watch || s.status === 'vapor') && (
        <p className="siphon-observation" role="status">
          {t(statusLabels[s.status])}
        </p>
      )}
      {shot.view === 'height' && (
        <div className="siphon-limit">
          <p>
            {t('瞬时流量')} <b>{(s.flow * 1000).toFixed(3)} L/s</b>
          </p>
          <div className="siphon-limit-track">
            <i
              style={{
                width: `${Math.max(0, Math.min(100, ((s.minimumPressure - s.vaporPressure) / (s.atmosphere - s.vaporPressure)) * 100))}%`,
              }}
            />
          </div>
          <p>
            {t('汽化边界')} <b>{(s.vaporPressure / 1000).toFixed(3)} kPa</b>
          </p>
          {!demo.watch && (
            <p>
              {t('最低压余量')}{' '}
              <b>{((s.minimumPressure - s.vaporPressure) / 1000).toFixed(3)} kPa</b>
              {' · '}
              {s.temperature.toFixed(0)} °C · {t('环境')} {(s.atmosphere / 1000).toFixed(3)} kPa
            </p>
          )}
          {!demo.watch && (
            <p>
              {t('最低压位置：距入口')} {s.minimumPressureAt.toFixed(3)} m{' · '}
              {t('弯顶位置')} {s.geometry.crestAt.toFixed(3)} m
            </p>
          )}
        </div>
      )}
      <div className="siphon-volume">
        <span>{t('总水量守恒')}</span>
        <div aria-hidden="true">
          <i style={{ width: `${(s.sourceVolume / s.totalVolume) * 100}%` }} />
          <i style={{ width: `${(s.tubeVolume / s.totalVolume) * 100}%` }} />
          <i style={{ width: `${(s.receiverVolume / s.totalVolume) * 100}%` }} />
        </div>
        <b>{(s.totalVolume * 1000).toFixed(1)} L</b>
      </div>
      {!demo.watch && (
        <div className="siphon-explore">
          <p>{t('改变条件会从同一总水量重算一次实验。拖动实验时间，观察真实排水与水位变化。')}</p>
          <div className="siphon-controls">
            <Range
              label={t('抬高出口：绕入口转动')}
              value={angle}
              min={0}
              max={42}
              step={1}
              unit="°"
              help={t('转动出口会换回短管装置。')}
              onChange={(v) =>
                resetTrial(() => {
                  setAngle(v);
                  setTop(1.9);
                })
              }
            />
            <Range
              label={t('直立管顶高度')}
              value={top}
              min={1.9}
              max={11.5}
              step={0.1}
              unit="m"
              onChange={(v) =>
                resetTrial(() => {
                  setTop(v);
                  setAngle(0);
                })
              }
            />
            <Range
              label={t('环境绝对压力')}
              value={atmosphere}
              min={70}
              max={101.325}
              step={0.025}
              unit="kPa"
              onChange={(v) => resetTrial(() => setAtmosphere(v))}
            />
            <Range
              label={t('水温')}
              value={temperature}
              min={5}
              max={29}
              step={1}
              unit="°C"
              onChange={(v) => resetTrial(() => setTemperature(v))}
            />
            <Range
              label={t('实验经过时间')}
              value={seconds}
              min={0}
              max={300}
              step={1}
              unit="s"
              onChange={setSeconds}
            />
          </div>
          <div className="siphon-actions">
            <button
              type="button"
              aria-pressed={primed && !vented}
              onClick={() =>
                resetTrial(() => {
                  setPrimed(true);
                  setVented(false);
                })
              }
            >
              {t('排气并预充')}
            </button>
            <button
              type="button"
              aria-pressed={vented}
              onClick={() =>
                resetTrial(() => {
                  setPrimed(true);
                  setVented(true);
                })
              }
            >
              {t('打开顶部进气口')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAngle(0);
                setTop(1.9);
                setAtmosphere(101.325);
                setTemperature(20);
                setSeconds(0);
                setPrimed(false);
                setVented(false);
                setFlat(false);
              }}
            >
              {t('空管重新开始')}
            </button>
          </div>
        </div>
      )}
      <details className="siphon-assumptions">
        <summary>{t('这套流体模型怎样计算？')}</summary>
        <p>{t('各高度重新预充；气泡只标记模型失效，不模拟两相流。')}</p>
        <p>{t('自由出流、等截面、准稳态；不预测启动惯性、水锤或气泡动力学。水面速度忽略。')}</p>
        <p className="siphon-equation">
          v² = 2gΔh / (1 + K + fL/D)
          <br />
          p꜀ = pₐ + ρg(zₛ − z꜀ − v²/2g − hₗ,ᵤ)
        </p>
        <p>
          {t(
            '弯顶压力是最高点的独立读数。沿程损失可让最低压出现在弯顶下游；单相有效性与余量均用沿管最低压判断。',
          )}
        </p>
        <p>
          {t(
            '所有压力均为绝对压力。模型失效后，读数只表示假设液柱仍连通所需的压力；不代表真实汽化后的压力或流量。',
          )}
        </p>
        <p>
          {t(
            '作者设定：内径 12 mm，达西摩阻系数 0.03，入口损失 0.5，弯管损失 0.4。管径在画面中放大。',
          )}
        </p>
        <p>
          {t(
            '预充和进气排空采用指定的教学进度，分段水量仍逐项守恒；汽化后不再把单相流量当作真实结果。',
          )}
        </p>
        <p>
          {t('管内亮点是减速显示的示踪标记；间距表示同一截面的连续流动，不是水分子的真实间距。')}
        </p>
        <p>
          {t('水源截面积')} {SIPHON.sourceArea} m² · {t('接水容器截面积')} {SIPHON.receiverArea} m²
        </p>
        <a
          href="https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_14.html"
          target="_blank"
          rel="noreferrer"
        >
          USBR · {t('自由出口与淹没出口的水头不同')}
        </a>
      </details>
    </section>
  );
}
