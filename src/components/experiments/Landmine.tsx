import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import { landmineShot, type LandmineView } from '../../models/landmine';
import LandmineStudio from '../three/LandmineStudio';
import '../../styles/landmine.css';

export default function Landmine() {
  const film = useShowcase();
  const [mode, setMode] = useState<LandmineView>('hidden'),
    [position, setPosition] = useState(70),
    [layer, setLayer] = useState<'surface' | 'section'>('section');
  const views: LandmineView[] = ['hidden', 'cause', 'energy', 'weather', 'time', 'unknown', 'care'];
  const shot = landmineShot(
    film.watch ? film.chapter : views.indexOf(mode),
    film.watch ? film.chapterProgress : position / 100,
  );
  const view = shot.view;
  const { closeup, season, angle } = shot;
  const reveal = film.watch ? shot.reveal : layer === 'surface' ? 0 : 1;
  const manualExterior = !film.watch && mode === 'unknown';
  return (
    <section className="landmine-study" data-view={view} data-watch={film.watch}>
      <header className="landmine-heading">
        <span>{t('地雷 · 外观与遗留风险')}</span>
        <span>{t('完整外壳')}</span>
      </header>
      <div className="landmine-main">
        {view === 'time' && (
          <div className="landmine-epochs" aria-label={t('示意时间阶段')}>
            {['当时', '后来', '多年后', '仍需核查'].map((label, i) => (
              <span key={label} data-active={i <= shot.epoch}>
                {t(label)}
              </span>
            ))}
          </div>
        )}
        <div className="landmine-object-stage">
          <LandmineStudio
            visual={{
              reveal,
              season,
              closeup: manualExterior ? 1 : closeup,
              angle,
              watch: film.watch,
            }}
          />
        </div>
        <div className="landmine-observation">
          {view === 'hidden' ? (
            <>
              <span>{t(reveal < 0.25 ? '普通地表' : '教学地层切面')}</span>
              <b>{t('同一枚地雷，位置不变')}</b>
            </>
          ) : view === 'energy' ? (
            <>
              <span>{t('储存的能量')}</span>
              <b>{t('可能被触发释放')}</b>
            </>
          ) : view === 'cause' ? (
            <>
              <span>{t('外壳、覆盖件、把手')}</span>
              <b>{t('只观察外部')}</b>
            </>
          ) : (
            <>
              <span>
                {t(
                  view === 'weather'
                    ? '植被与落叶在改变'
                    : view === 'time'
                      ? '时间继续前进'
                      : '外观可见',
                )}
              </span>
              <b>{t('安全状态：未知')}</b>
            </>
          )}
        </div>
        {view === 'care' ? (
          <p className="landmine-care-line">{t('不靠近、不触碰，联系当地专业机构。')}</p>
        ) : (
          <p className="landmine-note">
            {t(
              view === 'hidden' || view === 'weather' || view === 'time'
                ? '切面是教学镜头，不是挖掘或处置步骤。'
                : view === 'energy'
                  ? '外部作用可能引发快速释放；画面不模拟爆炸。'
                  : '完整外观不能证明安全。',
            )}
          </p>
        )}
      </div>
      {!film.watch && (
        <div className="landmine-explore">
          <Segments
            label={t('地雷外观观察')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'unknown', label: t('实物外观') },
              { value: 'hidden', label: t('地层观察') },
              { value: 'weather', label: t('植被变化') },
              { value: 'time', label: t('时间变化') },
            ]}
          />
          {mode !== 'unknown' && (
            <Segments
              label={t('地表观察层')}
              value={layer}
              onChange={setLayer}
              options={[
                { value: 'surface', label: t('只看表面') },
                { value: 'section', label: t('教学切面') },
              ]}
            />
          )}
          {(mode === 'weather' || mode === 'time') && (
            <Range
              label={t('教学回看位置')}
              value={position}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={setPosition}
            />
          )}
          <button
            className="landmine-reset"
            type="button"
            onClick={() => {
              setMode('hidden');
              setPosition(70);
              setLayer('section');
            }}
          >
            {t('重置观察')}
          </button>
        </div>
      )}
      <details className="landmine-method">
        <summary>{t('外观参考与演示边界')}</summary>
        <p>
          {t(
            '圆盘形外壳参考 Smithsonian 的 Model 43 Tellermine 馆藏完整外观，采用原创程序化重建。涂层、磨损和土壤细节用于真实感，不用于判断型号、状态或安全。',
          )}
        </p>
        <p>
          {t(
            '内部始终封闭，不显示引信、具体触发条件或处置方法。地雷并非都以同一种方式触发；本片只解释外部事件、储能释放与长期遗留风险的关系，不计算爆炸动力学或伤害范围。',
          )}
        </p>
        <p>
          {t(
            '地层切面只改变教学可见性。地雷位置固定，土块与植被使用同一观察切面；时间经过不自动给出安全结论。发现可疑物，不靠近、不触碰，并联系当地主管部门或专业排雷机构。',
          )}
        </p>
      </details>
    </section>
  );
}
