import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  bernoulliAt,
  bernoulliShot,
  solveBernoulli,
  type BernoulliShot,
} from '../../models/bernoulli';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import BernoulliTube, { BernoulliHeads } from '../lab/BernoulliTube';
import '../../styles/bernoulli.css';

const observations = [
  '同一条水路：喉部更窄，水柱却更低。',
  '追踪同一份水：体积不变，经过喉部时拉长。',
  '沿同一流线，压力水头减少，速度水头增加。',
  '出口重新变宽，理想无损流的压力随之恢复。',
  '截面相同、速度相同；抬高出口，压力仍会降低。',
  '流量为零时，水柱液面等高，局部压力仍随高程改变。',
  '加入明确计算的沿程损失，出口不能恢复全部压力。',
  '降低入口绝对压力，观察液态模型还有多少余量。',
];
export default function Bernoulli({ initialWidth = 840 }: { initialWidth?: number } = {}) {
  const demo = useShowcase();
  const [flow, setFlow] = useState(4),
    [ratio, setRatio] = useState(0.36),
    [rise, setRise] = useState(0),
    [pressure, setPressure] = useState(113.1),
    [friction, setFriction] = useState(0),
    [time, setTime] = useState(0),
    [probe, setProbe] = useState(0.45);
  const manual = useMemo(
    () =>
      solveBernoulli({
        flow: flow / 1000,
        areaRatio: ratio,
        rise,
        inletPressure: pressure * 1000,
        friction,
      }),
    [flow, ratio, rise, pressure, friction],
  );
  const directed = useMemo(
    () => bernoulliShot(demo.chapter, demo.chapterProgress),
    [demo.chapter, demo.chapterProgress],
  );
  const shot: BernoulliShot = demo.watch
    ? directed
    : {
        chapter: 0,
        run: manual,
        reference: null,
        probe: probe * manual.parameters.length,
        physicalTime: time,
        view: manual.status === 'valid' ? 'tube' : 'limit',
        comparingSteadyStates: false,
      };
  const run = shot.run,
    p = run.parameters,
    s = bernoulliAt(run, shot.probe),
    boundary = run.status === 'vapor-boundary';
  const account = shot.view === 'heads' || shot.view === 'loss',
    a = bernoulliAt(run, 0),
    b = bernoulliAt(run, p.length * 0.45),
    c = bernoulliAt(run, p.length);
  const reset = () => {
    setFlow(4);
    setRatio(0.36);
    setRise(0);
    setPressure(113.1);
    setFriction(0);
    setTime(0);
    setProbe(0.45);
  };
  const change = (fn: () => void) => {
    fn();
    setTime(0);
  };
  const note = boundary
    ? '所请求稳态已触及蒸气压；画面停在液态边界。'
    : observations[demo.watch ? shot.chapter : 0];
  return (
    <section className="bernoulli-study" data-view={shot.view} data-watch={demo.watch}>
      <div className="bernoulli-kicker">
        <span>{t('流速与压强 / 沿一条水路')}</span>
        <span>{`Q = ${(p.flow * 1000).toFixed(1)} L/s`}</span>
      </div>
      <p className="bernoulli-observation">{t(note)}</p>
      <div className="bernoulli-stage">
        {account ? (
          <BernoulliHeads shot={shot} initialWidth={initialWidth} />
        ) : (
          <BernoulliTube shot={shot} initialWidth={initialWidth} />
        )}
      </div>
      {boundary || shot.view === 'limit' ? (
        <div className="bernoulli-boundary" role="status">
          <strong>
            {t('最低绝对压力')} {run.minimumPressure.toFixed(0)} Pa
          </strong>
          <span>
            {t('请求入口压力')} {(p.inletPressure / 1000).toFixed(2)} kPa · {t('边界入口压力')}{' '}
            {(run.limitingInletPressure / 1000).toFixed(2)} kPa
          </span>
          <p>{t('不继续外推汽化、气泡或两相流。')}</p>
        </div>
      ) : (
        !account && (
          <div className="bernoulli-reading">
            {shot.view === 'static' || shot.view === 'recovery' ? (
              <>
                <span>
                  {t('测点绝对压力')}
                  <b>{(s.pressure / 1000).toFixed(2)} kPa</b>
                </span>
                <span>
                  {shot.view === 'static' ? t('测点高程') : t('测点流速')}
                  <b>
                    {shot.view === 'static'
                      ? `${s.z.toFixed(2)} m`
                      : `${s.velocity.toFixed(2)} m/s`}
                  </b>
                </span>
              </>
            ) : shot.view === 'elevation' ? (
              <>
                <span>
                  {t('入口 / 出口流速')}
                  <b>
                    {a.velocity.toFixed(2)} / {c.velocity.toFixed(2)} m/s
                  </b>
                </span>
                <span>
                  {t('出口升高')}
                  <b>{p.rise.toFixed(2)} m</b>
                </span>
              </>
            ) : shot.view === 'parcel' ? (
              <>
                <span>
                  {t('截面积比')}
                  <b>
                    A<sub>B</sub> / A<sub>A</sub> = {p.areaRatio.toFixed(2)}
                  </b>
                </span>
                <span>
                  {t('流速比')}
                  <b>
                    v<sub>B</sub> / v<sub>A</sub> = {(1 / p.areaRatio).toFixed(2)}
                  </b>
                </span>
              </>
            ) : (
              <>
                <span>
                  {t('入口 / 喉部流速')}
                  <b>
                    {a.velocity.toFixed(2)} / {b.velocity.toFixed(2)} m/s
                  </b>
                </span>
                <span>
                  {t('入口与喉部压差')}
                  <b>{((a.pressure - b.pressure) / 1000).toFixed(2)} kPa</b>
                </span>
              </>
            )}
          </div>
        )
      )}
      <p className="bernoulli-convention">
        {t(
          account
            ? '水头以米为单位，压力相对大气压。'
            : shot.comparingSteadyStates
              ? '各帧为独立稳态，不模拟改变装置的瞬态。'
              : shot.view === 'parcel'
                ? '同一水体只进出这段管道，不在两端瞬移循环。'
                : '主图管径放大示意，水柱与高程共用高度标尺。',
        )}
        {!account && p.flow > 0 && !shot.comparingSteadyStates && (
          <span>
            {t('物理时间')} {shot.physicalTime.toFixed(3)} s · {t('运动已放慢')}
          </span>
        )}
      </p>
      {!demo.watch && (
        <div className="bernoulli-explore">
          <Range
            label={t('规定体积流量')}
            value={flow}
            min={0}
            max={6}
            step={0.1}
            unit="L/s"
            onChange={(v) => change(() => setFlow(v))}
          />
          <Range
            label={t('喉部与入口面积比')}
            value={ratio}
            min={0.25}
            max={1}
            step={0.01}
            onChange={(v) => change(() => setRatio(v))}
          />
          <Range
            label={t('出口相对入口高程')}
            value={rise}
            min={-0.45}
            max={0.45}
            step={0.01}
            unit="m"
            onChange={(v) => change(() => setRise(v))}
          />
          <Range
            label={t('入口绝对压力')}
            value={pressure}
            min={3}
            max={150}
            step={0.1}
            unit="kPa"
            onChange={(v) => change(() => setPressure(v))}
          />
          <Range
            label={t('作者指定达西摩阻系数')}
            value={friction}
            min={0}
            max={0.06}
            step={0.005}
            onChange={(v) => change(() => setFriction(v))}
          />
          <Range
            label={t('水体运动的物理时间')}
            value={time}
            min={0}
            max={3}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Range
            label={t('沿管测点位置')}
            value={probe}
            min={0}
            max={1}
            step={0.01}
            onChange={setProbe}
          />
          <div className="bernoulli-probe">
            <span>
              {t('测点绝对压力')} <b>{(s.pressure / 1000).toFixed(2)} kPa</b>
            </span>
            <span>
              {t('测点流速')} <b>{s.velocity.toFixed(2)} m/s</b>
            </span>
            <span>
              {t('累计损失')} <b>{s.loss.toFixed(3)} m</b>
            </span>
          </div>
          <button type="button" onClick={reset}>
            {t('重置文丘里实验')}
          </button>
          <BernoulliHeads shot={shot} initialWidth={initialWidth} />
        </div>
      )}
      <details className="bernoulli-method">
        <summary>{t('适用条件与仪器读数')}</summary>
        <p>
          {t(
            '稳态、不可压缩、单根圆管；截面平均速度，动能修正系数取 1。入口流量与绝对压力由外部装置规定，出口压力由模型求出。',
          )}
        </p>
        <p>
          {t(
            '无损时沿同一流线：p/ρg + v²/2g + z = H。损失对照使用 hL = ∫ f v²/(2gD) ds，f 是作者指定参数，不是测量值或自动湍流预测。',
          )}
        </p>
        <p>
          {t(
            '管长 1.8 m，入口内径 60 mm，默认面积比 0.36；水密度 998.2 kg/m³。忽略流动分离、局部损失、径向速度剖面、测压管储量和液面振荡。',
          )}
        </p>
        <p>
          {t(
            '水柱液面表示压力水头加高程，读数折算到管轴。液面过低或在放大管径示意中难以辨认时，改用密闭绝对压力表。水头账本使用表压。',
          )}
        </p>
        <p>{t('水体运动按规定流量计算，再放慢播放；物理时间读数保持真实单位。')}</p>
        <p>
          {t(
            '只接受非负规定流量；反向流、空管和两相流不在模型内。20 °C 蒸气压取 2338 Pa，触及边界后显示最后可用的稳态，不继续运动。',
          )}
        </p>
      </details>
    </section>
  );
}
