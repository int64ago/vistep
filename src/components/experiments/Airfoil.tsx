import { useEffect, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  airfoilCirculation,
  airfoilForcePrefix,
  airfoilPair,
  airfoilShot,
  airfoilSurface,
  airfoilTrailingLimit,
  releaseAirfoilPaths,
  solveAirfoil,
  type AirfoilShot,
} from '../../models/airfoil';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import AirfoilTunnel from '../lab/AirfoilTunnel';
import '../../styles/airfoil.css';

const observations = [
  '对称翼型、零攻角：上下面压力相抵，升力为零。',
  '只改变攻角，边界条件选出的速度场与压力一起改变。',
  '两侧趋近同一有限尾缘速度；环量必须满足这个条件。',
  '沿整圈表面积分压力载荷，上下面都参与合力。',
  '同一时刻释放的相邻空气示踪点，不必同时经过翼尾。',
  '闭合路径上的速度积分给出环量，不是空气在绕圈。',
  '同一对称翼型，攻角变负，压力分布与升力翻转。',
  '攻角不变：风速翻倍，理想压力载荷与升力变成四倍。',
];
const format = (v: number, digits = 2) =>
  (Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits);
export default function Airfoil({ initialWidth = 840 }: { initialWidth?: number } = {}) {
  const film = useShowcase();
  useEffect(() => () => releaseAirfoilPaths(), []);
  const [angle, setAngle] = useState(6),
    [speed, setSpeed] = useState(25),
    [time, setTime] = useState(0),
    [probe, setProbe] = useState(0.25),
    [mode, setMode] = useState<'forces' | 'parcels' | 'circulation'>('forces');
  const manual = useMemo(() => solveAirfoil({ angle, speed }), [angle, speed]);
  const directed = useMemo(
    () => airfoilShot(film.chapter, film.chapterProgress),
    [film.chapter, film.chapterProgress],
  );
  const shot: AirfoilShot = film.watch
    ? directed
    : {
        chapter: 3,
        model: manual,
        reference: null,
        view: mode,
        progress: 1,
        physicalTime: time / 1000,
        delta: 0.035,
        steadyFamily: false,
      };
  const m = shot.model,
    p = m.parameters,
    forces = shot.view === 'forces',
    pair = shot.view === 'parcels' ? airfoilPair(p) : null;
  const prefix = airfoilForcePrefix(m, forces ? shot.progress : 1),
    upper = airfoilSurface(p, shot.delta),
    lower = airfoilSurface(p, -shot.delta),
    limit = airfoilTrailingLimit(p);
  const fraction = film.watch ? Math.max(0.005, Math.min(0.995, shot.progress)) : probe,
    selected = airfoilSurface(p, fraction * 2 * Math.PI);
  const reset = () => {
    setAngle(6);
    setSpeed(25);
    setTime(0);
    setProbe(0.25);
    setMode('forces');
  };
  const change = (fn: () => void) => {
    fn();
    setTime(0);
  };
  const note = film.watch
    ? observations[shot.chapter]
    : mode === 'parcels'
      ? observations[4]
      : mode === 'circulation'
        ? observations[5]
        : observations[3];
  return (
    <section className="airfoil-study" data-view={shot.view} data-watch={film.watch}>
      <div className="airfoil-kicker">
        <span>{t('机翼升力 / 先求流动，再算压力')}</span>
        <span>U∞ = {p.speed.toFixed(1)} m/s</span>
      </div>
      <p className="airfoil-observation">{t(note)}</p>
      <div className="airfoil-stage">
        <AirfoilTunnel shot={shot} probe={fraction} initialWidth={initialWidth} />
      </div>
      {shot.view === 'kutta' ? (
        <div className="airfoil-measures">
          <span>
            {t('上侧探针速度')}
            <b>{Math.hypot(upper.u, upper.v).toFixed(2)} m/s</b>
          </span>
          <span>
            {t('下侧探针速度')}
            <b>{Math.hypot(lower.u, lower.v).toFixed(2)} m/s</b>
          </span>
          <p>
            {t('共同的尾缘极限')} {limit.speed.toFixed(2)} m/s
          </p>
        </div>
      ) : pair ? (
        <div className="airfoil-measures airfoil-pair-times">
          {pair.map((line, i) => (
            <span key={i}>
              <i style={{ background: i ? '#d5b478' : '#88c6cf' }} />
              {t(i ? '下侧示踪点' : '上侧示踪点')}
              <b>
                {line.arrival !== null && shot.physicalTime >= line.arrival
                  ? `${(line.arrival * 1000).toFixed(2)} ms`
                  : t('尚未通过')}
              </b>
            </span>
          ))}
          <p>{t('到达时间来自同一速度场的轨迹积分。')}</p>
        </div>
      ) : shot.view === 'circulation' ? (
        <div className="airfoil-measures">
          <span>
            {t('逆时针计正的环量')}
            <b>Γ = {format(airfoilCirculation(p).gamma)} m²/s</b>
          </span>
          <span>
            {t('压力积分的升力')}
            <b>{format(m.lift, 1)} N/m</b>
          </span>
          <p>L′ = −ρU∞Γ = {format(m.predictedLift, 1)} N/m</p>
        </div>
      ) : shot.reference ? (
        <div className="airfoil-measures">
          <span>
            {t('同攻角基准')} · 15 m/s<b>{format(shot.reference.lift, 1)} N/m</b>
          </span>
          <span>
            {t('当前升力')}
            <b>{format(m.lift, 1)} N/m</b>
          </span>
          <p>
            {t('升力比')} {format(m.lift / shot.reference.lift)} · {t('压力系数分布保持不变')}
          </p>
        </div>
      ) : forces ? (
        <div className="airfoil-measures">
          <span>
            {t('累计水平载荷')}
            <b>{format(prefix.x, 1)} N/m</b>
          </span>
          <span>
            {t('累计竖直载荷')}
            <b>{format(prefix.y, 1)} N/m</b>
          </span>
          <p>
            {t('已计入表面')} {(shot.progress * 100).toFixed(0)}% · {t('完整一圈才是总合力')}
          </p>
        </div>
      ) : (
        <div className="airfoil-measures">
          <span>
            {t('整圈压力积分')}
            <b>{format(m.lift, 1)} N/m</b>
          </span>
          <span>
            {t('升力系数')}
            <b>Cₗ = {format(m.cl, 3)}</b>
          </span>
        </div>
      )}
      <p className="airfoil-convention">
        {t(
          shot.steadyFamily
            ? '各帧是独立稳态，不模拟转动或加速过程。'
            : pair
              ? '示踪运动已放慢；读数是实际物理时间。'
              : forces
                ? '箭头是相对环境的载荷；低压表示较少的向内推力。'
                : shot.view === 'circulation'
                  ? '虚线是数学积分路径，不是空气示踪轨迹。'
                  : '理想势流不包含边界层、分离、失速或黏性阻力。',
        )}
      </p>
      {!film.watch && (
        <div className="airfoil-explore">
          <div className="airfoil-modes" role="group" aria-label={t('机翼观察方式')}>
            {(['forces', 'parcels', 'circulation'] as const).map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={mode === v}
                onClick={() => {
                  setMode(v);
                  setTime(0);
                }}
              >
                {t(v === 'forces' ? '表面载荷' : v === 'parcels' ? '空气示踪' : '环量积分')}
              </button>
            ))}
          </div>
          <Range
            label={t('机翼攻角')}
            value={angle}
            min={-8}
            max={8}
            step={0.1}
            unit="°"
            onChange={(v) => change(() => setAngle(v))}
          />
          <Range
            label={t('来流速度')}
            value={speed}
            min={10}
            max={35}
            step={0.5}
            unit="m/s"
            onChange={(v) => change(() => setSpeed(v))}
          />
          <Range
            label={t('空气示踪物理时间')}
            value={time}
            min={0}
            max={180}
            step={0.5}
            unit="ms"
            onChange={(v) => {
              setMode('parcels');
              setTime(v);
            }}
          />
          <Range
            label={t('沿翼型表面测点')}
            value={probe}
            min={0.005}
            max={0.995}
            step={0.005}
            onChange={(v) => {
              setMode('forces');
              setProbe(v);
            }}
          />
          <div className="airfoil-probe">
            <span>
              {t('测点压力系数')} <b>{format(selected.cp, 3)}</b>
            </span>
            <span>
              {t('相对环境压差')} <b>{format(selected.pressure - p.pressure, 1)} Pa</b>
            </span>
            <span>
              {t('测点流速')} <b>{Math.hypot(selected.u, selected.v).toFixed(2)} m/s</b>
            </span>
          </div>
          <button type="button" className="airfoil-reset" onClick={reset}>
            {t('重置机翼实验')}
          </button>
        </div>
      )}
      <details className="airfoil-method">
        <summary>{t('模型条件与不可预测的现象')}</summary>
        <p>
          {t(
            '这是对称 Joukowski 翼型的二维、稳态、不可压缩势流。观察窗不是带实体壁面的风洞，来流区域在数学上无限延伸。',
          )}
        </p>
        <p>
          {t(
            '先满足远处来流、表面不穿透与 Kutta 尾缘条件，再由速度计算 Cp = 1 − (v/U∞)² 和压力。伯努利关系本身不能单独选出速度场。',
          )}
        </p>
        <p>
          {t(
            '弦长 1 m，空气密度 1.225 kg/m³，环境绝对压力 101325 Pa；升力单位 N/m 表示每单位翼展。只演示小攻角低速条件，不预测失速角、分离、摩擦阻力或有限翼展诱导阻力。',
          )}
        </p>
        <p>
          {t(
            '表面载荷减去了均匀环境压力；这一常量在闭合表面的总积分为零。蓝色低压表示较少的向内推力，载荷箭头是相对环境的增量。',
          )}
        </p>
        <p>
          {t(
            '环量由 Kutta 条件选定；真实流动建立这一环量涉及黏性和起动过程，本模型没有计算它们。理想二维压力阻力为零，不代表真实机翼没有阻力。',
          )}
        </p>
        <p>
          {t(
            '物体内部、映射极点和精确尾缘不直接求速度；尾缘另用解析极限检验。空气示踪以同一速度场做四阶积分，时间滑块可确定性重建。',
          )}
        </p>
      </details>
    </section>
  );
}
