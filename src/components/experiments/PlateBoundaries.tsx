import { useId, useState } from 'react';
import { t } from '../../i18n';
import { plateKinematics, plateSlab } from '../../models/plate-boundaries';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/plate-boundaries.css';
export default function PlateBoundaries() {
  const d = useShowcase(),
    id = useId().replace(/:/g, ''),
    [ln, setLn] = useState(-1),
    [lt, setLt] = useState(0),
    [rn, setRn] = useState(1),
    [rt, setRt] = useState(0),
    [time, setTime] = useState(6),
    [subductable, setSubductable] = useState(true),
    c = d.watch ? Math.min(5, d.chapter) : 1,
    p = d.watch ? d.chapterProgress : 1;
  const left = d.watch
      ? c === 0
        ? { normal: 1, tangent: 0 }
        : c === 1
          ? { normal: -1, tangent: 0 }
          : c === 3
            ? { normal: 0, tangent: -1 }
            : c === 4
              ? { normal: 1, tangent: -1 }
              : { normal: 2, tangent: 0 }
      : { normal: ln, tangent: lt },
    right = d.watch
      ? c === 0
        ? { normal: 1, tangent: 0 }
        : c === 1
          ? { normal: 1, tangent: 0 }
          : c === 3
            ? { normal: 0, tangent: 1 }
            : c === 4
              ? { normal: 0, tangent: 1 }
              : { normal: -2, tangent: 0 }
      : { normal: rn, tangent: rt },
    elapsed = d.watch ? Math.min(8, (p / 0.8) * 8) : time,
    canSubduct = d.watch ? c !== 5 : subductable,
    q = plateKinematics(left, right, elapsed),
    edge = 180 - q.opening * 1.2;
  const kind =
      q.kind === 'none'
        ? t('无相对运动')
        : q.kind === 'divergent'
          ? t('张裂边界')
          : q.kind === 'convergent'
            ? t('汇聚边界')
            : q.kind === 'transform'
              ? t('转换边界')
              : q.kind === 'oblique-convergent'
                ? t('斜向汇聚')
                : t('斜向张开'),
    slab = Array.from({ length: 91 }, (_, i) => plateSlab(-100 + i * 2)),
    project = (point: { x: number; z: number }) => ({
      x: 150 + point.x * 1.3,
      y: 20 + point.z * 1.3,
    }),
    outline = [
      ...slab.map((s) => s.upper),
      ...slab
        .slice()
        .reverse()
        .map((s) => s.lower),
    ],
    line = (points: typeof outline) =>
      points
        .map((v, i) => {
          const s = project(v);
          return `${i ? 'L' : 'M'}${s.x} ${s.y}`;
        })
        .join(' '),
    points = [-65, -45, -25, -5].map((s) => plateSlab(s + q.consumed));
  return (
    <section
      className="plates-study"
      data-watch={d.watch}
      aria-label={t('板块边界相对速度与俯冲前提实验')}
    >
      <header>
        <span>PLATES / RELATIVE MOTION</span>
        <b>{t('以右板为参照')}</b>
      </header>
      <div
        className="plates-plan"
        role="img"
        aria-label={t('俯视图的张开量与切向错动来自相对速度')}
      >
        <svg viewBox="0 0 360 170">
          <defs>
            <clipPath id={`${id}-left`}>
              <rect x="20" y="20" width={edge - 20} height="130" rx="15" />
            </clipPath>
            <marker
              id={`${id}-arrow`}
              markerUnits="userSpaceOnUse"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="#8e7151" />
            </marker>
          </defs>
          <rect className="plates-right" x="180" y="20" width="160" height="130" rx="15" />
          {q.opening > 0 && (
            <rect className="plates-new" x={edge} y="20" width={180 - edge} height="130" />
          )}
          <rect className="plates-left" x="20" y="20" width={edge - 20} height="130" rx="15" />
          <g clipPath={`url(#${id}-left)`}>
            {[-90, -65, -40, -15].map((x, i) => (
              <circle
                key={i}
                className="plates-grain"
                cx={180 + (x - (q.normal < 0 && !canSubduct ? 0 : q.normal * elapsed)) * 1.2}
                cy={85 - ([-35, -10, 20, 45][i] + q.offset)}
                r="5"
              />
            ))}
            <path className="plates-landmark" d={`M20 ${100 - q.offset}H${edge}`} />
          </g>
          <path className="plates-landmark" d="M180 100H340" />
          <path
            className="plates-boundary"
            d={`M${q.normal > 0 ? (edge + 180) / 2 : 180} 18V152`}
          />
          {Math.abs(q.normal) + Math.abs(q.tangent) > 1e-9 && (
            <path
              className="plates-vector"
              markerEnd={`url(#${id}-arrow)`}
              d={`M105 62L${105 - q.normal * 16} ${62 + q.tangent * 16}`}
            />
          )}
          {(c === 4 || !d.watch) && (
            <path
              className="plates-components"
              d={`M105 62H${105 - q.normal * 16}V${62 + q.tangent * 16}`}
            />
          )}
        </svg>
        <span className="plates-label-a">A</span>
        <span className="plates-label-b">B</span>
      </div>
      {q.normal < 0 && (
        <div
          className="plates-depth"
          role="img"
          aria-label={
            canSubduct
              ? t('给定左板俯冲前提下的连续等弧长物质路径')
              : t('大陆接触后刚体模型不预测变形')
          }
        >
          <span>{canSubduct ? t('剖面：假设左板可俯冲') : t('剖面：大陆接触，需变形模型')}</span>
          <svg viewBox="0 0 360 130">
            {canSubduct ? (
              <>
                <path className="plates-mantle" d="M20 24H338V123H20Z" />
                <path className="plates-continental" d="M171 16H325V37H182Z" />
                <path className="plates-slab" d={`${line(outline)}Z`} />
                {points.map((point, i) => {
                  const s = project(point);
                  return <circle className="plates-parcel" key={i} cx={s.x} cy={s.y} r="4" />;
                })}
              </>
            ) : (
              <>
                <rect
                  className="plates-collision-left"
                  x="25"
                  y="28"
                  width="150"
                  height="40"
                  rx="7"
                />
                <rect
                  className="plates-collision-right"
                  x="175"
                  y="28"
                  width="150"
                  height="40"
                  rx="7"
                />
                <path className="plates-contact" d="M175 20V78" />
              </>
            )}
          </svg>
        </div>
      )}
      <div className="plates-readout">
        <span>
          {t('法向相对速度')}
          <b>{q.normal.toFixed(1)}</b>
        </span>
        <span>
          {t('切向相对速度')}
          <b>{q.tangent.toFixed(1)}</b>
        </span>
      </div>
      <p className="plates-kind">
        {kind} · t = {elapsed.toFixed(1)}
      </p>
      {d.watch && c === 0 && (
        <p className="plates-note">{t('两板速度都为 (1,0)，相对速度为零。')}</p>
      )}
      {q.normal > 0 && (
        <p className="plates-note">
          {t('新生宽度')} = {q.opening.toFixed(1)}
        </p>
      )}
      {!d.watch && (
        <div className="plates-controls">
          {(
            [
              { key: 'ln', label: t('左板法向速度'), value: ln, set: setLn },
              { key: 'lt', label: t('左板切向速度'), value: lt, set: setLt },
              { key: 'rn', label: t('右板法向速度'), value: rn, set: setRn },
              { key: 'rt', label: t('右板切向速度'), value: rt, set: setRt },
            ] as const
          ).map((control) => (
            <label key={control.key} htmlFor={`${id}-${control.key}`}>
              {control.label} · {control.value}
              <input
                id={`${id}-${control.key}`}
                type="range"
                min="-2"
                max="2"
                step=".1"
                value={control.value}
                onChange={(e) => control.set(+e.target.value)}
              />
            </label>
          ))}
          <label htmlFor={`${id}-time`}>
            {t('归一化时间')} · {time}
            <input
              id={`${id}-time`}
              type="range"
              min="0"
              max="8"
              step=".1"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          {q.normal < 0 && (
            <button aria-pressed={subductable} onClick={() => setSubductable(!subductable)}>
              {t('切换左板可俯冲的前提')}
            </button>
          )}
        </div>
      )}
      <details>
        <summary>{t('边界类型是运动学，不是完整地球动力学')}</summary>
        <p>
          {t(
            '固定直边界，以右板为参照，法向为从左到右，切向向上；相对速度定义为右减左。箭头是速度而非力。正法向张开，负法向汇聚，纯切向错动；斜向运动可同时具备两项。张开区的新生宽度等于正法向速度乘时间。剖面先给定左板可俯冲，再按等弧长、连续切线与固定厚度路径运送物质，不解密度、摩擦、温度、力或真实沉降角。大陆接触不假造穿透或定量造山。所有长度与时间归一化，俯视/剖面分别缩放；不是地震或板块速度预测。',
          )}
        </p>
      </details>
    </section>
  );
}
