import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useCompact } from '../lab/useCompact';
import { useShowcase } from '../lab/Showcase';
import { zipperInitial, zipperPose, zipperShot } from '../../models/zipper';
import ZipperStudio from '../three/ZipperStudio';
import { ZipperLoad, ZipperComparison, ZipperSection } from '../three/ZipperDiagram';
import '../../styles/zipper.css';
const titles = [
  '拉头经过，齿留在身后',
  '宽齿头里藏着一道齿窝',
  'Y 形通道让两条带转弯',
  '跟着 L7 走进咬合',
  '横着拉，为什么分不开',
  '倒着走，同一颗齿退出',
  '上下止限定这段旅程',
  '去掉宽肩，结果就变了',
];
export default function Zipper() {
  const film = useShowcase(),
    compact = useCompact(),
    id = useId(),
    [input, setInput] = useState(zipperInitial),
    [epoch, setEpoch] = useState(0),
    shot = zipperShot(film.chapter, film.chapterProgress),
    pose = film.watch ? shot.pose : zipperPose(input.travel),
    focus = film.watch ? shot.focus : input.view;
  const force = film.watch ? shot.force : input.force,
    trial = film.watch ? shot.trial : input.trial;
  const state =
    focus === 'load'
      ? '对称刚体受力示意'
      : focus === 'comparison'
        ? '只改变齿肩，保持相同位移尝试'
        : pose.atTop
          ? '上止接住拉头'
          : pose.atBottom
            ? '下止接住拉头'
            : focus === 'tooth'
              ? 'L7 上唇剖开，露出中层齿窝'
              : pose.marked.locked
                ? 'L7 已进入平直咬合段'
                : 'L7 沿连续珠边转弯';
  return (
    <section className="zipper-scene" data-focus={focus} data-watch={film.watch}>
      <header className="zipper-heading">
        <span>{t('注塑蘑菇头齿 · 闭尾拉链')}</span>
        <h2>{t(film.watch ? titles[shot.chapter] : '沿同一条路径检查拉链')}</h2>
      </header>
      <div className="zipper-visual">
        {focus === 'tooth' && compact ? (
          <div className="zipper-instrument">
            <ZipperSection />
          </div>
        ) : focus === 'load' ? (
          <div className="zipper-instrument">
            <ZipperLoad force={force} />
          </div>
        ) : focus === 'comparison' ? (
          <div className="zipper-instrument">
            <ZipperComparison trial={trial} />
          </div>
        ) : (
          <div className="zipper-object">
            <span className="zipper-cut-label">
              {t(focus === 'tooth' ? 'L7 齿头剖切' : '拉头开窗剖面')}
              <span className="zipper-phone-label"> · {t('局部跟拍')}</span>
            </span>
            <ZipperStudio key={epoch} pose={pose} focus={focus} progress={shot.progress} />
            {focus === 'tooth' && (
              <div className="zipper-section">
                <ZipperSection />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="zipper-state">
        <span>{t(state)}</span>
        <b>
          {focus === 'load'
            ? `F = ${force.toFixed(2)}`
            : focus === 'comparison'
              ? `${trial.toFixed(2)} u`
              : focus === 'tooth'
                ? 'p / 2'
                : `${((pose.marked.angle * 180) / Math.PI).toFixed(1)}°`}
        </b>
      </div>
      {!film.watch && (
        <div className="zipper-controls">
          <p>{t('滑动拉头，检查同一颗 L7；横拉与齿形对照是独立的刚体教学实验。')}</p>
          <div className="zipper-options" role="group" aria-label={t('选择拉链观察方式')}>
            {(['whole', 'guide', 'tooth', 'load', 'comparison'] as const).map((v, i) => (
              <button
                key={v}
                aria-pressed={input.view === v}
                onClick={() =>
                  setInput((p) => ({ ...p, view: v, ...(v === 'tooth' ? { travel: 0.72 } : {}) }))
                }
              >
                {t(['整条织带', '拉头导道', '齿头剖面', '横向受力', '齿肩对照'][i])}
              </button>
            ))}
          </div>
          {focus !== 'load' && focus !== 'comparison' && (
            <div className="zipper-range">
              <label htmlFor={id + 'travel'}>{t('拉头行程')}</label>
              <output htmlFor={id + 'travel'}>{Math.round(input.travel * 100)}%</output>
              <input
                id={id + 'travel'}
                aria-label={t('拉头行程')}
                type="range"
                min="0"
                max="1"
                step=".001"
                value={input.travel}
                onChange={(e) => setInput((p) => ({ ...p, travel: +e.target.value }))}
              />
            </div>
          )}
          {focus === 'load' && (
            <div className="zipper-range">
              <label htmlFor={id + 'force'}>{t('归一化横向载荷')}</label>
              <output htmlFor={id + 'force'}>{input.force.toFixed(2)}</output>
              <input
                id={id + 'force'}
                aria-label={t('归一化横向载荷')}
                type="range"
                min="0"
                max="1"
                step=".01"
                value={input.force}
                onChange={(e) => setInput((p) => ({ ...p, force: +e.target.value }))}
              />
            </div>
          )}
          {focus === 'comparison' && (
            <div className="zipper-range">
              <label htmlFor={id + 'trial'}>{t('尝试横向位移')}</label>
              <output htmlFor={id + 'trial'}>{input.trial.toFixed(2)} u</output>
              <input
                id={id + 'trial'}
                aria-label={t('尝试横向位移')}
                type="range"
                min="0"
                max=".45"
                step=".005"
                value={input.trial}
                onChange={(e) => setInput((p) => ({ ...p, trial: +e.target.value }))}
              />
            </div>
          )}
          <button
            onClick={() => {
              setInput(zipperInitial());
              setEpoch((v) => v + 1);
            }}
          >
            {t('重置全部拉链实验')}
          </button>
        </div>
      )}
      <details className="zipper-limits">
        <summary>{t('这副教学齿形的边界')}</summary>
        <p>
          {t(
            '齿距 p = 1 u，两排错开 p/2。齿头宽 0.60 u，齿颈宽 0.24 u；薄翼与齿窝每侧留 0.012 u 间隙。尺寸为教学比例，不是制造公差。',
          )}
        </p>
        <p>
          {t(
            '规定珠边的连续弯曲路径，齿根沿其切线转动；不求解织带剪切、材料弹性、摩擦或拉头驱动力。拉头开窗、单齿切唇是明确剖切。',
          )}
        </p>
        <p>
          {t(
            '横拉画面采用单齿、对称、无摩擦刚体假设，两个肩面各承担 F/2；归一化 F 不代表牛顿或真实强度。削肩对照是假想几何。',
          )}
        </p>
        <p>
          {t(
            '这里选用非锁定拉头；齿的横向咬合不等于拉头自锁。上止阻挡拉头，下止连接两条带，顶部仍有齿留在导道内。',
          )}
        </p>
      </details>
    </section>
  );
}
