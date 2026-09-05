import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import DiffusionStrip from '../lab/DiffusionStrip';
import {
  diffusionDiagnostics,
  diffusionField,
  diffusionFlux,
  diffusionGradient,
  diffusionIntegral,
  diffusionShot,
  diffusionValue,
  type DiffusionKind,
  type DiffusionOptions,
  type DiffusionView,
} from '../../models/diffusion';
import '../../styles/diffusion.css';
const num = (v: number, d = 4) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
export default function Diffusion() {
  const film = useShowcase(),
    [D, setD] = useState(0.015),
    [length, setLength] = useState(1),
    [time, setTime] = useState(0),
    [kind, setKind] = useState<DiffusionKind>('pulse'),
    [section, setSection] = useState(0.67),
    [comparison, setComparison] = useState<'none' | 'D' | 'length'>('none'),
    [instrument, setInstrument] = useState<'flux' | 'budget' | 'variance'>('flux');
  const shot = diffusionShot(
    Math.max(0, Math.min(7, film.chapter)),
    Math.max(0, Math.min(1, film.chapterProgress)),
  );
  const options: DiffusionOptions = film.watch ? shot.options : { D, length, kind };
  const other: DiffusionOptions | null = film.watch
    ? shot.comparison
    : comparison === 'D'
      ? { ...options, D: Math.min(0.1, D * 2) }
      : comparison === 'length'
        ? { ...options, length: Math.min(2, length * 2) }
        : null;
  const modelTime = film.watch ? shot.time : time,
    view: DiffusionView = film.watch
      ? shot.view
      : kind === 'mix'
        ? 'mix'
        : kind === 'reservoir'
          ? 'reservoir'
          : comparison !== 'none'
            ? comparison
            : instrument,
    probe = film.watch ? shot.section : section;
  const key = JSON.stringify(options),
    otherKey = JSON.stringify(other);
  const field = useMemo(() => diffusionField(options, modelTime), [key, modelTime]),
    second = useMemo(
      () => (other ? diffusionField(other, modelTime) : null),
      [otherKey, modelTime],
    ),
    d = useMemo(() => diffusionDiagnostics(field), [field]);
  const secondD = second ? diffusionDiagnostics(second) : null,
    region = shot.region,
    localMass = diffusionIntegral(field, region[0] * field.p.length, region[1] * field.p.length),
    net =
      diffusionFlux(field, region[0] * field.p.length) -
      diffusionFlux(field, region[1] * field.p.length),
    mixB = field.p.kind === 'mix' ? diffusionField(field.p, modelTime, 'B') : null;
  const reset = () => {
    setD(0.015);
    setLength(1);
    setTime(0);
    setKind('pulse');
    setSection(0.67);
    setComparison('none');
    setInstrument('flux');
  };
  const note =
    field.p.kind === 'reservoir'
      ? '新边界实验：端点浓度固定，介质仍无整体流动。'
      : view === 'length'
        ? '等比例初态、各自总量为 1；长度与浓度共用标尺。'
        : view === 'D'
          ? '相同初态、质量、长度和时刻；只改变 D。'
          : view === 'variance'
            ? '虚线是均匀极限；短斜线为早期 2Dt 参照。'
            : view === 'mix'
              ? 'A 与 B 分别守恒；颜色仅为浓度的示意映射。'
              : view === 'budget'
                ? '选区为 0.55L–0.85L；净增加率 = 左端通量 − 右端通量。'
                : view === 'flux'
                  ? '箭头仅示净通量方向，不是分子轨迹或流体速度。'
                  : '虚线保留初始曲线；颜色带是横截面均匀的一维浓度。';
  const values =
    view === 'variance'
      ? [
          ['分布方差', num(d.variance)],
          ['均匀极限', num(d.equilibriumVariance)],
        ]
      : view === 'flux'
        ? [
            ['局部浓度梯度', num(diffusionGradient(field, probe * field.p.length), 3)],
            ['截面净通量 J', num(diffusionFlux(field, probe * field.p.length))],
          ]
        : view === 'budget'
          ? [
              ['选区内的量', num(localMass)],
              ['选区净增加率', num(net)],
            ]
          : secondD
            ? [
                ['基准 Dt/L²', num(d.dimensionlessTime)],
                ['对照 Dt/L²', num(secondD.dimensionlessTime)],
              ]
            : mixB
              ? [
                  ['标记 A 总量', num(d.mass, 3)],
                  ['标记 B 总量', num(diffusionIntegral(mixB), 3)],
                ]
              : view === 'reservoir'
                ? [
                    ['带内总量', num(d.mass)],
                    ['边界累计净输入', num(d.budget.change)],
                  ]
                : [
                    ['封闭总量', num(d.mass, 3)],
                    ['中央浓度', num(diffusionValue(field, field.p.length / 2), 3)],
                  ];
  return (
    <section className="diffusion-study" data-view={view} data-watch={film.watch}>
      <header className="diffusion-heading">
        <span>{t(film.watch ? '扩散' : '扩散 / 没有水流的展开')}</span>
        <span>t* {num(modelTime, 1)}</span>
      </header>
      {!film.watch && (
        <p className="diffusion-manual-intro">
          {t('移动时间或改变条件，查看同一初态的浓度解。这里没有整体平流。')}
        </p>
      )}
      <DiffusionStrip field={field} second={second} view={view} section={probe} region={region} />
      <div className="diffusion-key">
        <span>
          <i />
          {t(
            second
              ? '基准'
              : view === 'variance'
                ? '分布方差'
                : view === 'mix'
                  ? '标记 A'
                  : '浓度曲线',
          )}
        </span>
        {(second || view === 'mix') && (
          <span>
            <i className="diffusion-amber" />
            {t(view === 'mix' ? '标记 B' : '对照曲线')}
          </span>
        )}
        {view === 'mix' && (
          <span>
            <i className="diffusion-sum" />
            {t('A+B 总浓度')}
          </span>
        )}
        <span>{t('无量纲模型')}</span>
      </div>
      <div className="diffusion-ledger">
        {values.map(([label, value]) => (
          <div key={label}>
            <span>{t(label)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="diffusion-note">{t(note)}</p>
      {!film.watch && (
        <div className="diffusion-explore">
          <div className="diffusion-choices" role="group" aria-label={t('扩散初态与边界')}>
            {(
              [
                ['pulse', '封闭脉冲'],
                ['mix', '双标记混合'],
                ['reservoir', '固定浓度端点'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value);
                  setComparison('none');
                }}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <Range
            label={t('扩散模型时间')}
            value={time}
            min={0}
            max={40}
            step={0.1}
            onChange={setTime}
          />
          <Range
            label={t('扩散系数 D')}
            value={D}
            min={0}
            max={0.04}
            step={0.005}
            onChange={setD}
          />
          <Range
            label={t('浓度带长度 L')}
            value={length}
            min={0.5}
            max={2}
            step={0.1}
            onChange={setLength}
          />
          {kind === 'pulse' && (
            <>
              <Range
                label={t('观察截面 x/L')}
                value={section}
                min={0.1}
                max={0.9}
                step={0.01}
                onChange={setSection}
              />
              <div className="diffusion-choices" role="group" aria-label={t('浓度观察仪器')}>
                {(
                  [
                    ['flux', '截面通量'],
                    ['budget', '选区收支'],
                    ['variance', '分布方差'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={instrument === value && comparison === 'none'}
                    onClick={() => {
                      setInstrument(value);
                      setComparison('none');
                    }}
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
              <div
                className="diffusion-choices diffusion-comparisons"
                role="group"
                aria-label={t('受控扩散比较')}
              >
                <button
                  type="button"
                  aria-pressed={comparison === 'D'}
                  onClick={() => setComparison(comparison === 'D' ? 'none' : 'D')}
                >
                  {t('比较两倍 D')}
                </button>
                <button
                  type="button"
                  aria-pressed={comparison === 'length'}
                  onClick={() => setComparison(comparison === 'length' ? 'none' : 'length')}
                >
                  {t('比较两倍长度（上限 2）')}
                </button>
              </div>
            </>
          )}
          <button type="button" className="diffusion-reset" onClick={reset}>
            {t('重置扩散实验')}
          </button>
        </div>
      )}
      <details className="diffusion-details">
        <summary>{t('边界、公式与数值表')}</summary>
        <p className="diffusion-current-scope">{t(note)}</p>
        <p>
          {t(
            '介质静止，截面积取 1，浓度在横截面内均匀。求解 ∂c/∂t = D∂²c/∂x² 与 J = −D∂c/∂x，没有平流、反应或单分子轨迹。',
          )}
        </p>
        <p>
          {t(
            '封闭端点满足零梯度、零通量。初始脉冲是归一化的 sin⁸(πx/L)，用四个余弦模态精确演化；不是裁断方波或时间步积分。',
          )}
        </p>
        <p>
          {t(
            '混合采用两种不反应、扩散系数相同的稀标记：初态分别为 (1 ± 0.95cos(πx/L))/L，各自总量为 1。颜色混合不是物质消失。',
          )}
        </p>
        <p>
          {t(
            '固定浓度实验重新从 1 − x/L − 0.2sin(πx/L) 开始，左端始终为 1，右端始终为 0；储库可以交换物质，带内总量不必守恒。',
          )}
        </p>
        <p>
          {t(
            'D、长度、时间和浓度均为无量纲教学参数。图像亮度来自浓度的示意吸收映射，不是实际染料光谱。比较长度时初态也按长度同比缩放，但总量保持相同。',
          )}
        </p>
        <p>
          {t(
            '方差的早期增加接近 2Dt，封闭边界逐渐改变这条关系，最终趋于 L²/12。宏观起伏衰减不表示分子变慢或停止。模型不求解可逆的微观动力学。',
          )}
        </p>
        <p>
          {t(
            '任意时刻直接由初态的指数衰减模态重建；没有累积帧历史。共享播放器负责暂停、重播、离屏、后台与减少动态效果。',
          )}
        </p>
        <p>
          {t('总量账本残差')}：{Math.abs(d.massResidual).toExponential(2)} · {t('宏观起伏平方积分')}
          ：{d.smoothingEnergy.toExponential(3)}
        </p>
        <div className="diffusion-table-wrap">
          <table>
            <caption>{t('当前截面数值（图像的同一模型）')}</caption>
            <thead>
              <tr>
                <th>x/L</th>
                <th>c A</th>
                {mixB && <th>c B</th>}
                <th>J A</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, i) => {
                const x = (field.p.length * i) / 5;
                return (
                  <tr key={i}>
                    <td>{num(i / 5, 1)}</td>
                    <td>{num(diffusionValue(field, x), 3)}</td>
                    {mixB && <td>{num(diffusionValue(mixB, x), 3)}</td>}
                    <td>{num(diffusionFlux(field, x))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
