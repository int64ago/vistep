import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  differentialShot,
  differentialMotion,
  differentialTraction,
  type DifferentialMode,
} from '../../models/differential';
import { useCompact } from '../lab/useCompact';
import { useShowcase } from '../lab/Showcase';
import DifferentialStudio from '../three/DifferentialStudio';
import {
  DifferentialRoad,
  DifferentialReadouts,
  DifferentialMean,
  DifferentialTorque,
} from '../three/DifferentialDiagram';
import '../../styles/differential.css';
const headlines = [
  '同一根车轴，走两条不同的弧',
  '直行时，行星齿轮只随壳体公转',
  '转弯时，行星齿轮还会绕自己的轴转',
  '平均转速由壳体决定',
  '固定一侧，另一侧转得更快',
  '分开看：转速与扭矩',
  '弱侧的上限，会限制两侧',
  '允许差速，保留机械联系',
];
const captions = [
  '外侧车轮路程更长，需要转得更快。',
  '两只半轴齿轮同速，行星齿轮相对壳体不自转。',
  '同一个锥顶、相交的轴线，保持齿面接触。',
  '一侧减少的转速，恰好由另一侧增加。',
  '这是固定一只车轮的试验，不是锁止差速器。',
  '理想、无损且忽略齿轮惯性时，两侧扭矩相等。',
  '这里只计算可维持的扭矩上限，不预测打滑后的车速。',
  '道路要求不同转速，齿轮约束它们的平均值。',
];
export default function Differential() {
  const film = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [mode, setMode] = useState<DifferentialMode>('turn'),
    [radius, setRadius] = useState(2),
    [turn, setTurn] = useState(1),
    [input, setInput] = useState(0.9),
    [time, setTime] = useState(0),
    [view, setView] = useState('mechanism'),
    [requested, setRequested] = useState(400),
    [leftCap, setLeftCap] = useState(60),
    [rightCap, setRightCap] = useState(300);
  const shot = differentialShot(film.chapter, film.chapterProgress),
    m = film.watch ? shot.motion : differentialMotion(mode, input, time, radius, turn),
    focus = film.watch
      ? shot.focus
      : view === 'paths'
        ? 'paths'
        : view === 'torque'
          ? 'traction'
          : mode === 'left-held'
            ? 'held'
            : mode === 'straight'
              ? 'straight'
              : mode === 'carrier-held'
                ? 'mean'
                : 'spiders',
    chapter = film.watch
      ? shot.chapter
      : focus === 'paths'
        ? mode === 'straight'
          ? 1
          : mode === 'left-held'
            ? 4
            : mode === 'carrier-held'
              ? 3
              : 0
        : focus === 'traction'
          ? 6
          : focus === 'held'
            ? 4
            : focus === 'straight'
              ? 1
              : focus === 'mean'
                ? 3
                : 2;
  const caption =
    !film.watch && focus !== 'traction' && mode === 'carrier-held'
      ? '固定壳体，左右半轴以相反方向等速转动。'
      : !film.watch && focus === 'paths' && mode === 'straight'
        ? '直行时，两侧路程相同。'
        : captions[chapter];
  const load = film.watch ? shot.load : differentialTraction(requested, leftCap, rightCap),
    reference = film.watch ? shot.reference : differentialTraction(requested, 300, 300);
  const reset = () => {
    setMode('turn');
    setRadius(2);
    setTurn(1);
    setInput(0.9);
    setTime(0);
    setView('mechanism');
    setRequested(400);
    setLeftCap(60);
    setRightCap(300);
  };
  const range = (
    key: string,
    label: string,
    value: number,
    onChange: (n: number) => void,
    min: number,
    max: number,
    step: number,
    unit: string,
    digits = 0,
  ) => (
    <div className="diff-range">
      <label htmlFor={id + key}>{t(label)}</label>
      <output htmlFor={id + key}>
        {value.toFixed(digits)} {unit}
      </output>
      <input
        id={id + key}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
  return (
    <section className="diff-scene" data-focus={focus} data-mode={film.watch ? 'watch' : 'explore'}>
      <header className="diff-heading">
        <span>{t('汽车差速器')}</span>
        <h2>
          {t(film.watch && compact && focus === 'spiders' ? '齿轮组特写' : headlines[chapter])}
        </h2>
        {!film.watch && <p>{t(caption)}</p>}
      </header>
      {(!film.watch || ['straight', 'spiders', 'held', 'return'].includes(focus)) && (
        <div className="diff-object">
          <DifferentialStudio
            motion={m}
            focus={focus}
            progress={film.watch ? film.chapterProgress : 0.5}
          />
          <span className="diff-close-label">{t('齿轮组特写；半轴继续连接两侧车轮。')}</span>
        </div>
      )}
      {focus === 'paths' && <DifferentialRoad motion={m} />}
      {focus === 'mean' && <DifferentialMean motion={m} />}
      {(focus === 'torque' || focus === 'traction') && (
        <DifferentialTorque
          motion={m}
          load={load}
          reference={reference}
          compare={focus === 'traction'}
        />
      )}
      {focus !== 'paths' && focus !== 'torque' && focus !== 'traction' && (
        <DifferentialReadouts motion={m} />
      )}
      {focus === 'spiders' && (
        <p className="diff-pinion-rate">
          {t('行星齿轮相对壳体的自转')} <strong>{m.pinionRate.toFixed(2)} rad/s</strong>
        </p>
      )}
      {!film.watch && (
        <div className="diff-controls">
          <h3>{t('在同一时刻检查约束')}</h3>
          <div className="diff-choices" role="group" aria-label={t('选择观察方式')}>
            {['mechanism', 'paths', 'torque'].map((v, i) => (
              <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                {t(['检查机构', '比较轮迹', '检查扭矩上限'][i])}
              </button>
            ))}
          </div>
          <div className="diff-choices" role="group" aria-label={t('设置车轮约束')}>
            {(['straight', 'turn', 'left-held', 'carrier-held'] as const).map((v, i) => (
              <button
                key={v}
                aria-pressed={mode === v}
                onClick={() => {
                  setMode(v);
                  setTime(0);
                }}
              >
                {t(['直行', '转弯', '固定左轮', '固定壳体'][i])}
              </button>
            ))}
          </div>
          {range('time', '观察时刻', time, setTime, 0, 8, 0.01, 's', 2)}
          {range(
            'rate',
            mode === 'carrier-held' ? '右侧输入角速度' : '壳体输入角速度',
            input,
            setInput,
            0,
            2,
            0.05,
            'rad/s',
            2,
          )}
          {mode === 'turn' && (
            <>
              {range('radius', '车轴中心转弯半径', radius, setRadius, 0.8, 10, 0.1, 'm', 1)}
              <div className="diff-choices" role="group" aria-label={t('转弯方向')}>
                <button aria-pressed={turn === 1} onClick={() => setTurn(1)}>
                  {t('向左转')}
                </button>
                <button aria-pressed={turn === -1} onClick={() => setTurn(-1)}>
                  {t('向右转')}
                </button>
              </div>
            </>
          )}
          {view === 'torque' && (
            <>
              {range('request', '请求的壳体扭矩', requested, setRequested, 0, 600, 10, 'N·m')}
              {range('leftcap', '左侧反作用扭矩上限', leftCap, setLeftCap, 0, 400, 10, 'N·m')}
              {range('rightcap', '右侧反作用扭矩上限', rightCap, setRightCap, 0, 400, 10, 'N·m')}
            </>
          )}
          <button className="diff-reset" onClick={reset}>
            {t('重置差速器试验')}
          </button>
          <p>{t('所有位置由参数和观察时刻重建；滑块支持方向键。')}</p>
        </div>
      )}
      <details className="diff-assumptions">
        <summary>{t('模型、支承与单位')}</summary>
        <p>
          {t(
            '等大半轴齿轮各 24 齿，行星齿轮各 16 齿。节锥角由齿数比决定，所有节锥共顶点；25° 压力角的理想球面渐开线齿面沿锥距缩放。齿轮与试验架尺寸为展示单位，不是商品加工图。',
          )}
        </p>
        <p>
          {t(
            '壳体通过四根桥和中央支承环连接十字轴。半轴插入各自齿轮的孔内，在交叉轴之前终止；试验架采用滑动轴承。输入直接施加到壳体，主减速器与真实车桥外壳被省略。',
          )}
        </p>
        <p>
          {t(
            '轮迹模型给定 1.6 m 轮距与 0.31 m 轮胎滚动半径，假设无侧滑。机构动画规定转速；扭矩模型另给轮胎反作用上限，忽略摩擦、惯性和损耗，不从扭矩条推算打滑速度。没有锁止、限滑或电子制动控制。',
          )}
        </p>
        <p>
          {t(
            '观察时刻使用模型秒；自动演示放慢观察，不代表真实道路车速。齿面亮点来自共轭接触计算。',
          )}
        </p>
      </details>
    </section>
  );
}
