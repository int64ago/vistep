import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { t } from '../../i18n';
import {
  polarizationShot,
  polarizationSetup,
  type PolarizationSource,
} from '../../models/polarization';
import { useShowcase } from '../lab/Showcase';
import {
  PolarizationDetail,
  PolarizationFocus,
  PolarizationOptics,
  polarizationColors,
} from '../lab/PolarizationOptics';
import '../../styles/polarization.css';

function AngleDial({
  angle,
  label,
  onChange,
}: {
  angle: number;
  label: string;
  onChange: (angle: number) => void;
}) {
  const pointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - bounds.left - bounds.width / 2;
    const dy = event.clientY - bounds.top - bounds.height / 2;
    if (Math.hypot(dx, dy) < 14) return;
    // A transmission axis is unoriented: a half-turn is the same axis.
    const degrees = ((Math.atan2(dx, -dy) * 180) / Math.PI + 180) % 180;
    onChange(Math.round(degrees));
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? angle + step
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? angle - step
          : event.key === 'PageUp'
            ? angle + 10
            : event.key === 'PageDown'
              ? angle - 10
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? 180
                  : null;
    if (next === null) return;
    event.preventDefault();
    onChange(Math.max(0, Math.min(180, next)));
  };
  return (
    <div className="polarization-dial-wrap">
      <div
        className="polarization-dial"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={180}
        aria-valuenow={angle}
        aria-valuetext={`${angle}°`}
        onKeyDown={key}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointer(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pointer(e);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <span className="polarization-dial-axis" style={{ transform: `rotate(${angle}deg)` }}>
          <i />
        </span>
        <span className="polarization-dial-origin" aria-hidden="true">
          0°
        </span>
      </div>
      <div>
        <span>{label}</span>
        <output>{angle}°</output>
        <small>{t('拖动圆环，或用方向键微调。')}</small>
      </div>
    </div>
  );
}

export default function Polarization() {
  const demo = useShowcase();
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [first, setFirst] = useState(0),
    [middle, setMiddle] = useState(45),
    [last, setLast] = useState(90);
  const [withMiddle, setWithMiddle] = useState(true),
    [withLast, setWithLast] = useState(true);
  const [source, setSource] = useState<PolarizationSource>('unpolarized');
  const [selected, setSelected] = useState<'A' | 'M' | 'B'>('M');
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(200, entry.contentRect.width)),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const shot = polarizationShot(demo.chapter, demo.chapterProgress);
  const state = demo.watch
    ? shot.state
    : polarizationSetup(first, withMiddle ? middle : null, withLast ? last : null, source);
  // No private clock. A seek, a pause, a hidden tab and reduced motion all use
  // the shared director. Exploration is a static field sample updated by input.
  const time = demo.watch ? demo.time : 3.6;
  const phoneFilm = demo.watch && width < 620;
  const angle = selected === 'A' ? first : selected === 'M' ? middle : last;
  const updateAngle = selected === 'A' ? setFirst : selected === 'M' ? setMiddle : setLast;
  const label =
    selected === 'A'
      ? t('第一片 A 的透光轴')
      : selected === 'M'
        ? t('中间片 M 的透光轴')
        : t('末片 B 的透光轴');
  const preset = (insert: boolean) => {
    setSource('unpolarized');
    setFirst(0);
    setMiddle(45);
    setLast(90);
    setWithMiddle(insert);
    setWithLast(true);
    setSelected(insert ? 'M' : 'B');
  };
  return (
    <div
      ref={root}
      className="polarization-installation"
      data-phone-film={phoneFilm}
      data-polarization-view={demo.watch ? shot.view : 'explore'}
    >
      {phoneFilm ? (
        <PolarizationFocus
          state={state}
          time={time}
          width={width}
          view={shot.view}
          energyStep={shot.energyStep}
        />
      ) : (
        <>
          <div className="polarization-header">
            <span>{t('偏振 · 电场的方向')}</span>
            <span>{t('理想吸收型偏振片')}</span>
          </div>
          <div className="polarization-source-line">
            <span>
              <i className="polarization-source-dot" />
              {t(state.source === 'unpolarized' ? '非偏振入射' : '线偏振入射')}
            </span>
            <span>I₀ = 100%</span>
          </div>
          <div className="polarization-optics-host">
            <PolarizationOptics
              state={state}
              time={time}
              width={width}
              view={demo.watch ? shot.view : 'energy'}
              middleVisibility={demo.watch ? shot.middleVisibility : 1}
            />
          </div>
          <div className="polarization-readout">
            <span>{t('最终透过')}</span>
            <div className="polarization-ruler" aria-hidden="true">
              <i style={{ width: `${state.output.intensity * 100}%` }} />
            </div>
            <output>
              {(state.output.intensity * 100).toFixed(1)}
              <small>%</small>
            </output>
          </div>
          <PolarizationDetail
            state={state}
            view={demo.watch ? shot.view : 'energy'}
            time={time}
            energyStep={demo.watch ? shot.energyStep : -1}
          />
        </>
      )}
      {!demo.watch && (
        <div className="polarization-explore">
          <div className="polarization-presets" role="group" aria-label={t('偏振实验设置')}>
            <button onClick={() => preset(false)}>{t('交叉两片')}</button>
            <button onClick={() => preset(true)}>{t('插入 45° 中间片')}</button>
          </div>
          <div className="polarization-toggles">
            <label>
              <input
                type="checkbox"
                checked={withMiddle}
                onChange={(e) => {
                  setWithMiddle(e.target.checked);
                  if (!e.target.checked && selected === 'M') setSelected('A');
                }}
              />
              {t('放入中间片 M')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={withLast}
                onChange={(e) => {
                  setWithLast(e.target.checked);
                  if (!e.target.checked && selected === 'B') setSelected('A');
                }}
              />
              {t('放入末片 B')}
            </label>
          </div>
          <div className="polarization-select" role="group" aria-label={t('选择要旋转的偏振片')}>
            {(['A', 'M', 'B'] as const).map((id) => (
              <button
                key={id}
                aria-pressed={selected === id}
                disabled={(id === 'M' && !withMiddle) || (id === 'B' && !withLast)}
                style={{ color: polarizationColors[id] }}
                onClick={() => setSelected(id)}
              >
                {id} · {id === 'A' ? first : id === 'M' ? middle : last}°
              </button>
            ))}
          </div>
          <AngleDial angle={angle} label={label} onChange={updateAngle} />
          <label className="polarization-source-select">
            {t('入射光类型')}
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PolarizationSource)}
            >
              <option value="unpolarized">{t('非偏振光')}</option>
              <option value="linear">{t('线偏振光 · 0°')}</option>
            </select>
          </label>
        </div>
      )}
      <details className="polarization-note">
        <summary>{t('图中波线是什么？')}</summary>
        <p>
          {t(
            '波线是电场示意，不是光的弯曲路线。光始终沿中心轴前进；振动和传播都已放慢，磁场省略。',
          )}
        </p>
        <p>
          {t(
            '迎光圆图显示横向电场：非偏振时的多条轴表示时间统计，固定长度的箭头表示均方根振幅。光强取时间平均，正比于电场振幅的平方。',
          )}
        </p>
        <p>
          {t(
            '本模型使用理想、完全覆盖光束的吸收型偏振片；未透过的能量计入吸收。真实滤片还会有反射、漏光和额外损耗。',
          )}
        </p>
      </details>
    </div>
  );
}
