import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import {
  SwitchDetection,
  SwitchForcePlot,
  SwitchTravel,
  SwitchTravelComparison,
  type SwitchCurve,
} from '../lab/KeyboardSwitchInstruments';
import KeyboardSwitchStudio from '../three/KeyboardSwitchStudio';
import {
  KEYBOARD_SWITCH_SPECS,
  KEYBOARD_SWITCH_VARIANTS,
  keyboardSwitchForceCurve,
  keyboardSwitchShot,
  keyboardSwitchState,
  type KeyboardSwitchVariant,
} from '../../models/keyboard-switch';
import { switchStemColor } from '../../models/keyboard-switch-geometry';
import '../../styles/keyboard-switch.css';

const names: Record<KeyboardSwitchVariant, string> = {
  red: '红轴',
  black: '黑轴',
  brown: '茶轴',
  blue: '青轴',
  silver: '银轴',
  'silent-red': '静音红轴',
  hall: '磁轴',
  optical: '光轴',
};
const families = { linear: '线性', tactile: '段落', clicky: '有声段落' };
const detection = { contact: '接点检测', hall: '霍尔检测', optical: '光学检测' };
const detailChapter: Record<KeyboardSwitchVariant, number> = {
  red: 4,
  black: 4,
  brown: 2,
  blue: 3,
  silver: 5,
  'silent-red': 5,
  hall: 6,
  optical: 7,
};
const partNotes = [
  '键帽带动轴心，弹簧连接上下簧座。',
  '相同行程，比较两根弹簧的阻力。',
  '盯住轴心凸起与金色弹片相遇的位置。',
  '白色套件可以相对蓝色轴心移动。',
  '金色触点接通时，轴心还没有触底。',
  '短行程与缓冲，改变了不同的环节。',
  '磁体跟随轴心，传感器固定在电路板上。',
  '光穿过轴心开槽，到达另一侧接收器。',
  '同一颗轴体，分别看手感、声音和检测。',
];

export default function KeyboardSwitch() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300),
    [variant, setVariant] = useState<KeyboardSwitchVariant>('red');
  const [phase, setPhase] = useState(30),
    [threshold, setThreshold] = useState(2),
    [sensitivity, setSensitivity] = useState(0.3);
  const [close, setClose] = useState<'whole' | 'detail'>('whole');
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(180, Math.min(620, entry.contentRect.width))),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const shot = keyboardSwitchShot(film.chapter, film.chapterProgress);
  const state = film.watch
    ? shot.state
    : keyboardSwitchState(variant, phase / 100, {
        motion: variant === 'hall' ? 'rapid' : 'cycle',
        hallThresholdMm: threshold,
        rapidPressMm: sensitivity,
        rapidReleaseMm: sensitivity,
      });
  const current = state.variant,
    spec = KEYBOARD_SWITCH_SPECS[current];
  const chapter = film.watch ? film.chapter : close === 'detail' ? detailChapter[current] : 0;
  const color = switchStemColor(current),
    direction = state.direction === 'press' ? '下压' : '回程';
  const compareLinear = film.watch && film.chapter === 1;
  const showForce = film.watch
    ? [1, 2, 3].includes(film.chapter)
    : current !== 'hall' && current !== 'optical';
  const curves = useMemo<SwitchCurve[]>(
    () =>
      (compareLinear ? (['red', 'black'] as const) : [current]).map((key) => {
        const samples = keyboardSwitchForceCurve(key);
        return {
          name: names[key],
          color: switchStemColor(key),
          down: samples.map((p) => ({ travelMm: p.travelMm, forceCn: p.pressCn })),
          up: samples.map((p) => ({ travelMm: p.travelMm, forceCn: p.releaseCn })),
        };
      }),
    [compareLinear, current],
  );
  const partNote =
    current === 'blue' && state.click.event
      ? '套件快速跳移，碰撞产生点击。'
      : film.watch
        ? partNotes[film.chapter]
        : current === 'hall'
          ? partNotes[6]
          : current === 'optical'
            ? partNotes[7]
            : current === 'brown'
              ? partNotes[2]
              : current === 'blue'
                ? partNotes[3]
                : partNotes[0];
  return (
    <section
      className="keyboard-switch-study"
      data-variant={current}
      data-watch={film.watch}
      style={{ '--ks-accent': color } as CSSProperties}
    >
      <div className="ks-heading">
        <div className="ks-title">
          <i className="ks-variant-swatch" />
          <strong>{t(names[current])}</strong>
        </div>
        <span className="ks-direction">
          {t(direction)} <span aria-hidden="true">{state.direction === 'press' ? '↓' : '↑'}</span>
        </span>
        <small>
          {t(families[spec.family])} · {t(detection[spec.detection])}
        </small>
      </div>
      <div className="ks-stage" ref={host}>
        <KeyboardSwitchStudio
          state={state}
          chapter={chapter}
          chapterProgress={film.chapterProgress}
          active={film.playing}
          allowOrbit={!film.watch}
        />
      </div>
      <p className="ks-part-note">{t(partNote)}</p>
      <div className="ks-instruments">
        {film.watch && film.chapter === 8 ? (
          <div className="ks-summary-lines">
            <span>
              {t('手感')}
              <b>{t(families[spec.family])}</b>
            </span>
            <span>
              {t('声音')}
              <b>{t(current === 'blue' ? '点击与撞击' : '机械振动与撞击')}</b>
            </span>
            <span>
              {t('检测')}
              <b>{t(detection[spec.detection])}</b>
            </span>
          </div>
        ) : film.watch && shot.view === 'speed' && shot.compareState ? (
          <SwitchTravelComparison
            rows={[state, shot.compareState].map((s) => ({
              name: names[s.variant],
              travelMm: s.travelMm,
              totalMm: s.totalTravelMm,
              actuationMm: s.actuationMm,
              active: s.active,
            }))}
          />
        ) : current === 'hall' ? (
          <SwitchDetection
            signal={state.hall.signal}
            fixed={state.hall.fixedActive}
            rapid={state.hall.rapidActive}
            travelMm={state.travelMm}
          />
        ) : showForce ? (
          <SwitchForcePlot
            curves={curves}
            travelMm={state.travelMm}
            forceCn={state.forceCn}
            color={color}
            width={width}
            comparison={
              compareLinear && shot.compareState
                ? {
                    forceCn: shot.compareState.forceCn,
                    color: switchStemColor(shot.compareState.variant),
                  }
                : undefined
            }
          />
        ) : (
          <SwitchTravel
            travelMm={state.travelMm}
            totalMm={state.totalTravelMm}
            actuationMm={state.actuationMm}
            releaseMm={state.releaseMm}
            active={state.active}
            direction={current === 'optical' ? '教学行程' : '复位点示意'}
          />
        )}
      </div>
      {current !== 'hall' && (
        <div className="ks-state-line">
          <span className="ks-electrical-state" data-on={state.active}>
            <i />
            {t(
              spec.detection === 'contact'
                ? state.active
                  ? '触点闭合'
                  : '触点分开'
                : spec.detection === 'optical'
                  ? state.active
                    ? '光到达接收器'
                    : '光路被遮挡'
                  : state.active
                    ? '固定点：按下'
                    : '固定点：松开',
            )}
          </span>
          <span>
            {showForce
              ? `${state.travelMm.toFixed(2)} / ${state.totalTravelMm.toFixed(1)} mm`
              : t(state.travelMm >= state.totalTravelMm - 0.02 ? '已到触底位置' : '尚未触底')}
          </span>
        </div>
      )}
      {!film.watch && (
        <div className="ks-exploration">
          <Segments
            value={variant}
            onChange={setVariant}
            label={t('选一种轴体')}
            options={KEYBOARD_SWITCH_VARIANTS.map((value) => ({ value, label: t(names[value]) }))}
          />
          <Range
            label={t('观察进程')}
            value={phase}
            min={0}
            max={100}
            step={0.1}
            unit="%"
            onChange={setPhase}
            help={t('沿一次按下、松开移动；磁轴包含小幅往返。')}
          />
          <Segments
            value={close}
            onChange={setClose}
            label={t('轴体观察角度')}
            options={[
              { value: 'whole', label: t('整体结构') },
              { value: 'detail', label: t('机制近看') },
            ]}
          />
          {current === 'hall' && (
            <>
              <Range
                label={t('首次触发深度')}
                value={threshold}
                min={0.2}
                max={3.8}
                step={0.1}
                unit="mm"
                onChange={setThreshold}
              />
              <Range
                label={t('快速触发往返距离')}
                value={sensitivity}
                min={0.1}
                max={1}
                step={0.1}
                unit="mm"
                onChange={setSensitivity}
              />
            </>
          )}
          <details>
            <summary>{t('这些数字和结构如何理解？')}</summary>
            <p>
              {t(
                '六款接点轴的触发力、预行程和总行程取自 CHERRY MX2A 标称规格；力曲线、复位点和内部尺寸为教学拟合。',
              )}
            </p>
            <p>
              {t(
                '磁轴与光轴是代表原理，行程和阈值为教学设定；快速触发采用首次触发后的小幅往返判定。',
              )}
            </p>
            <p>
              {t('这里不播放实录轴音。声音还取决于键帽、定位板、外壳和桌面，不能从轴心颜色推断。')}
            </p>
            <p>{t('没有触点抖动，不等于整机零延迟。')}</p>
          </details>
        </div>
      )}
    </section>
  );
}
