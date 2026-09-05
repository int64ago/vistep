import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  BEARING_TAU,
  bearingShot,
  bearingState,
  bearingFocus,
  type BearingFocus,
} from '../../models/ball-bearing';
import { useCompact } from '../lab/useCompact';
import { useShowcase } from '../lab/Showcase';
import BallBearingStudio from '../three/BallBearingStudio';
import BallBearingInspection from '../lab/BallBearingInspection';
import '../../styles/ball-bearing.css';

export default function BallBearing() {
  const film = useShowcase(),
    compact = useCompact();
  const controlId = useId();
  const [turns, setTurns] = useState(0),
    [focus, setFocus] = useState<BearingFocus>('contact'),
    [direction, setDirection] = useState(-90),
    [load, setLoad] = useState(1),
    [cut, setCut] = useState(true),
    [patch, setPatch] = useState(0.65),
    [loss, setLoss] = useState(0);
  const shot = film.watch
    ? bearingShot(film.chapter, film.chapterProgress)
    : {
        ...bearingShot(bearingFocus.indexOf(focus), 0.5),
        focus,
        innerAngle: turns * BEARING_TAU,
        cutaway: cut ? 1 : 0,
        cageOpacity: focus === 'cage' ? 1 : 0.36,
        load,
        loadAngle: (direction * Math.PI) / 180,
        patchProgress: patch,
        lossIndex: loss,
      };
  const state = bearingState(shot.innerAngle, shot.loadAngle, shot.load),
    phoneFilm = compact && film.watch,
    overview = shot.focus === 'assembly' || shot.focus === 'return';
  return (
    <div
      className="bb-experiment"
      data-mode={film.watch ? 'watch' : 'explore'}
      data-focus={shot.focus}
    >
      <div className="bb-heading">
        <span>{t('滚珠轴承')}</span>
        {!film.watch && <p>{t('跟住一颗球，看清两处接触。')}</p>}
        <span className="bb-fixed">{t('外圈固定')}</span>
      </div>
      <div className="bb-layout">
        {(!phoneFilm || overview) && (
          <div className="bb-object">
            <BallBearingStudio state={state} shot={shot} />
            <div className="bb-object-legend">
              <span>
                <i />
                {t('标记球')}
              </span>
              <span>{shot.cutaway > 0.5 ? t('观察剖面') : t('完整装配')}</span>
            </div>
          </div>
        )}
        {phoneFilm && overview && (
          <ol className="bb-path bb-watch-path">
            {['轴', '内圈', '滚珠', '外圈', '支座'].map((label) => (
              <li key={label}>{t(label)}</li>
            ))}
          </ol>
        )}
        {(!phoneFilm || !overview) && (
          <BallBearingInspection state={state} shot={shot} compact={phoneFilm} />
        )}
      </div>
      {!film.watch && (
        <div className="bb-explore">
          <div className="bb-explore-head">
            <h3>{t('转一圈，停在任意接触位置')}</h3>
            <button className="btn" aria-pressed={cut} onClick={() => setCut(!cut)}>
              {cut ? t('合上剖面') : t('打开剖面')}
            </button>
          </div>
          <label className="bb-range" htmlFor={`${controlId}-angle`}>
            <span>
              {t('内圈转角')}{' '}
              <output>
                {turns.toFixed(2)} {t('圈')}
              </output>
            </span>
            <input
              id={`${controlId}-angle`}
              type="range"
              min="-3"
              max="8"
              step=".01"
              value={turns}
              onChange={(e) => setTurns(Number(e.target.value))}
            />
          </label>
          <div className="bb-choices" role="group" aria-label={t('选择观察内容')}>
            {(['contact', 'cage', 'sliding', 'load', 'patch', 'losses'] as const).map(
              (value, i) => (
                <button key={value} aria-pressed={focus === value} onClick={() => setFocus(value)}>
                  {t(['接触速度', '保持架与自转', '滑动对照', '承载区', '接触斑', '损耗来源'][i])}
                </button>
              ),
            )}
          </div>
          {focus === 'load' && (
            <div className="bb-load-controls">
              <label className="bb-range" htmlFor={`${controlId}-load`}>
                <span>
                  {t('载荷方向')}
                  <output>{direction}°</output>
                </span>
                <input
                  id={`${controlId}-load`}
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={direction}
                  onChange={(e) => setDirection(Number(e.target.value))}
                />
              </label>
              <button className="btn" aria-pressed={load > 0} onClick={() => setLoad(load ? 0 : 1)}>
                {load ? t('移除示意载荷') : t('施加示意载荷')}
              </button>
            </div>
          )}
          {focus === 'patch' && (
            <label className="bb-range" htmlFor={`${controlId}-patch`}>
              <span>
                {t('接触斑示意放大')}
                <output>{t('不对应真实载荷')}</output>
              </span>
              <input
                id={`${controlId}-patch`}
                type="range"
                min="0"
                max="1"
                step=".01"
                value={patch}
                onChange={(e) => setPatch(Number(e.target.value))}
              />
            </label>
          )}
          {focus === 'losses' && (
            <div className="bb-choices" role="group" aria-label={t('观察损耗来源')}>
              {['加载与卸载', '微滑', '润滑剂', '接触式密封'].map((v, i) => (
                <button key={v} aria-pressed={loss === i} onClick={() => setLoss(i)}>
                  {t(v)}
                </button>
              ))}
            </div>
          )}
          <button
            className="btn"
            onClick={() => {
              setTurns(0);
              setFocus('contact');
              setDirection(-90);
              setLoad(1);
              setCut(true);
              setPatch(0.65);
              setLoss(0);
            }}
          >
            {t('重置轴承实验')}
          </button>
        </div>
      )}
      <details className="bb-assumptions">
        <summary>{t('这个模型说明什么？')}</summary>
        <p>
          {t(
            '单列径向轴承，接触角为零；内圈驱动、外圈固定。宏观几何采用刚性球、理想无滑动和零径向游隙。球与滚道的圆弧相切，保持架兜孔留有间隙。',
          )}
        </p>
        <p>
          {t(
            '承载亮度采用 max(0, cos θ)^(3/2) 的教学权重；θ 是球相对载荷方向的角度。它不求解真实的接触力平衡。',
          )}
        </p>
        <p>
          {t(
            '真实轴承有弹性、游隙、润滑和局部滑动。接触斑与润滑膜被夸大；本演示不预测摩擦系数、温升、寿命或承载能力。保持架是简化的球引导冠形结构。',
          )}
        </p>
      </details>
    </div>
  );
}
