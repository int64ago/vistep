import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  opticalLever,
  beamDeflection,
  deformationDirector,
  type DeformationView,
  type OpticalPoint,
} from '../../models/small-deformation-lab';
import '../../styles/small-deformation-lab.css';

function Apparatus({
  state,
  force,
  width,
  full,
  id,
}: {
  state: ReturnType<typeof opticalLever>;
  force: number;
  width: number;
  full: boolean;
  id: string;
}) {
  const height = full ? 180 : 126,
    scale = full ? (width - 48) / 5.3 : Math.min((width - 38) / 1.4, 210);
  const project = (p: OpticalPoint) => ({
    x: (full ? 18 : (width - 1.4 * scale) / 2) + (p.x + 0.2) * scale,
    y: (full ? 116 : 96) - p.y * scale,
  });
  const path = (points: OpticalPoint[]) =>
    points
      .map((p, i) => {
        const q = project(p);
        return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
      })
      .join(' ');
  const exit = full
    ? state.wall
    : { x: 1.18, y: state.p2.y + ((1.18 - state.p2.x) * state.d2.y) / state.d2.x };
  const zero = project({ x: state.wall.x, y: state.baseline });
  return (
    <svg
      className="sd16-art"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('同一束光先到右镜，再到左镜，最后射向远处墙面')}
      data-optical-view={full ? 'path' : 'bench'}
    >
      <defs>
        <linearGradient id={`${id}wood`} gradientUnits="userSpaceOnUse" x1="0" x2={width}>
          <stop stopColor="#dfceb5" />
          <stop offset="1" stopColor="#bda98c" />
        </linearGradient>
      </defs>
      <path
        data-table-surface="beam"
        d={
          path([
            ...Array.from({ length: 31 }, (_, i) => ({
              x: i / 30,
              y: -beamDeflection(i / 30, force).down,
            })),
            ...Array.from({ length: 31 }, (_, i) => ({
              x: 1 - i / 30,
              y: -beamDeflection(1 - i / 30, force).down - 0.07,
            })),
          ]) + 'Z'
        }
        fill={`url(#${id}wood)`}
      />
      {[0, 1].map((x) => (
        <path
          key={x}
          d={path([
            { x, y: -0.07 },
            { x, y: full ? -0.25 : -0.13 },
          ])}
          stroke="#bca88b"
          strokeWidth={full ? 5 : 8}
          strokeLinecap="round"
        />
      ))}
      {force > 0.01 && (
        <g data-applied-force={force}>
          <path
            d={path([
              { x: 0.5, y: 0.5 },
              { x: 0.5, y: 0.06 },
            ])}
            stroke="#ab7959"
            strokeWidth="1.7"
          />
          <path
            d={path([
              { x: 0.46, y: 0.12 },
              { x: 0.5, y: 0.06 },
              { x: 0.54, y: 0.12 },
            ])}
            stroke="#ab7959"
            strokeWidth="1.7"
            fill="none"
          />
        </g>
      )}
      {[state.m, state.n].map((mirror, i) => {
        const a = {
            x: mirror.center.x - 0.075 * Math.cos(mirror.angle),
            y: mirror.center.y - 0.075 * Math.sin(mirror.angle),
          },
          b = {
            x: mirror.center.x + 0.075 * Math.cos(mirror.angle),
            y: mirror.center.y + 0.075 * Math.sin(mirror.angle),
          };
        const q = project(mirror.center);
        return (
          <g key={i} data-material-mirror={i === 0 ? 'M' : 'N'}>
            <path
              d={path([mirror.base, mirror.center])}
              stroke="#93a39b"
              strokeWidth={full ? 3 : 5}
            />
            <path
              data-mirror-line={i === 0 ? 'M' : 'N'}
              d={path([a, b])}
              stroke="#6b8e96"
              strokeWidth={full ? 3 : 5}
            />
            <path d={path([a, b])} stroke="#edf0e8" strokeWidth="1" />
            <text x={q.x} y={q.y - (full ? 16 : 24)} textAnchor="middle">
              {i === 0 ? 'M' : 'N'}
            </text>
          </g>
        );
      })}
      <path
        data-optical-route="source-M-N-wall"
        d={path([state.source, state.p1, state.p2, exit])}
        stroke="#ad7755"
        strokeWidth="1.7"
        fill="none"
      />
      <circle
        cx={project(state.source).x}
        cy={project(state.source).y}
        r={full ? 4 : 6}
        fill="#7d9483"
      />
      {full && (
        <>
          <path
            data-optical-wall="true"
            d={path([
              { x: state.wall.x, y: 0 },
              { x: state.wall.x, y: 0.72 },
            ])}
            stroke="#a7b698"
            strokeWidth="4"
          />
          <circle cx={zero.x} cy={zero.y} r="4" fill="none" stroke="#718762" />
          <circle cx={project(state.wall).x} cy={project(state.wall).y} r="2.5" fill="#ac7047" />
          <text x={width - 8} y="28" textAnchor="end">
            {t('墙的位置')} {state.wall.x.toFixed(1)} m
          </text>
          <path
            d={path([
              { x: 0, y: -0.42 },
              { x: state.wall.x, y: -0.42 },
            ])}
            stroke="#bec8b1"
            strokeDasharray="3 4"
          />
          <text x={width / 2} y="171" textAnchor="middle">
            {t('未放大角度的完整光路')}
          </text>
        </>
      )}
      {!full && (
        <path
          d={`M${width - 17} ${project(exit).y - 5}l7 5-7 5`}
          fill="none"
          stroke="#ad7755"
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
}
function MiniSpot({ state, width }: { state: ReturnType<typeof opticalLever>; width: number }) {
  const y = 52 - state.shift * 1000 * 18;
  return (
    <svg
      className="sd16-art"
      viewBox={`0 0 ${width} 126`}
      role="img"
      aria-label={t('墙上光点 · 局部放大')}
    >
      <text x={width / 2} y="18" textAnchor="middle">
        {t('光点')}
      </text>
      <path d={`M8 52H${width - 8}`} stroke="#b0bda2" strokeDasharray="3 3" />
      <circle cx={width / 2} cy="52" r="5" fill="none" stroke="#8fa17e" />
      <circle data-wall-spot="true" cx={width / 2} cy={y} r="3.5" fill="#b4794e" />
      <text x={width / 2} y="120" textAnchor="middle">
        {(Math.abs(state.shift) < 5e-7 ? 0 : state.shift * 1000).toFixed(2)} mm
      </text>
    </svg>
  );
}
function Profile({ force, width }: { force: number; width: number }) {
  const scale = width - 32,
    y = (x: number) => 28 + beamDeflection(x, force).down * 500 * scale;
  return (
    <svg
      className="sd16-art"
      viewBox={`0 0 ${width} 92`}
      role="img"
      aria-label={t('桌面形变剖面 · 纵向放大500倍')}
      data-deformation-profile="500"
    >
      <text x={width / 2} y="17" textAnchor="middle">
        {t('剖面：纵向 ×500')}
      </text>
      <path d={`M16 28H${width - 16}`} stroke="#afbea0" strokeDasharray="4 4" />
      <path
        d={Array.from(
          { length: 61 },
          (_, i) => `${i ? 'L' : 'M'}${16 + (i / 60) * scale} ${y(i / 60)}`,
        ).join(' ')}
        fill="none"
        stroke="#ad8060"
        strokeWidth="2.4"
      />
      <path d={`M16 29l-6 11h12ZM${width - 16} 29l-6 11h12Z`} fill="#a7b89a" />
      <text x={width / 2} y="78" textAnchor="middle">
        δ = {(beamDeflection(0.5, force).down * 1000).toFixed(3)} mm
      </text>
    </svg>
  );
}
function Spot({ state, width }: { state: ReturnType<typeof opticalLever>; width: number }) {
  const x = width * 0.55,
    zeroY = 87,
    spotY = zeroY - state.shift * 1000 * 22;
  return (
    <svg
      className="sd16-art"
      viewBox={`0 0 ${width} 212`}
      role="img"
      aria-label={t('光点相对未受力零位的毫米位移')}
      data-optical-view="spot"
    >
      <text x={width / 2} y="20" textAnchor="middle">
        {t('墙上光点 · 局部放大')}
      </text>
      <path d={`M${x - 52} 39V190`} stroke="#a9b79a" />
      {[-4, -2, 0, 2].map((mm) => (
        <g key={mm}>
          <path d={`M${x - 57} ${zeroY - mm * 22}h10`} stroke="#90a280" />
          <text x={x - 65} y={zeroY - mm * 22 + 5} textAnchor="end">
            {mm}
          </text>
        </g>
      ))}
      <path d={`M${x - 40} ${zeroY}H${x + 12}`} stroke="#a8b89b" strokeDasharray="4 5" />
      <circle data-spot-zero="true" cx={x} cy={zeroY} r="5" stroke="#8b9e7a" fill="none" />
      <circle data-wall-spot="true" cx={x} cy={spotY} r="12" fill="#b77e50" opacity=".12" />
      <circle cx={x} cy={spotY} r="3.5" fill="#ad754b" />
      <text x={x + 22} y={Math.min(184, Math.max(46, spotY + 5))}>
        {(Math.abs(state.shift) < 5e-7 ? 0 : state.shift * 1000).toFixed(2)}
      </text>
      <text x={width / 2} y="202" textAnchor="middle">
        {t('相对零位')} / mm
      </text>
    </svg>
  );
}
export default function SmallDeformationLab() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    id = useId().replaceAll(':', '');
  const authored = deformationDirector(
    film.chapter,
    film.chapterProgress,
    film.chapterTime,
    browserLocale(),
  );
  const [manual, setManual] = useState<{
    force: number;
    wallX: number;
    view: DeformationView;
  } | null>(null);
  const selected = film.watch ? authored : (manual ?? authored),
    state = opticalLever(selected.force, selected.wallX);
  const update = (changes: Partial<NonNullable<typeof manual>>) =>
    setManual({ ...selected, ...changes });
  const twin = selected.view === 'profile' || selected.view === 'bench';
  return (
    <section
      className="sd16-lab"
      ref={host}
      data-deform-force={selected.force}
      data-deform-wall={selected.wallX}
      data-deform-view={selected.view}
    >
      <div className="sd16-readout">
        <span>F = {selected.force.toFixed(0)} N</span>
        <span>
          {t('墙的位置')} {selected.wallX.toFixed(1)} m
        </span>
      </div>
      {twin ? (
        <div className="sd16-twin">
          <div className="sd16-bench-pair">
            <Apparatus
              state={state}
              force={selected.force}
              width={width * 0.65}
              full={false}
              id={id}
            />
            <MiniSpot state={state} width={width * 0.35} />
          </div>
          <Profile force={selected.force} width={width} />
        </div>
      ) : selected.view === 'path' ? (
        <Apparatus state={state} force={selected.force} width={width} full id={id} />
      ) : (
        <Spot state={state} width={width} />
      )}
      {!film.watch && (
        <div className="sd16-controls">
          <Segments
            label={t('观察视图')}
            value={selected.view}
            options={[
              { value: 'path', label: t('完整光路') },
              { value: 'profile', label: t('双镜与形变') },
              { value: 'spot', label: t('光点零位') },
            ]}
            onChange={(view) => update({ view })}
          />
          <Range
            label={t('按压力')}
            value={selected.force}
            min={0}
            max={80}
            unit="N"
            onChange={(force) => update({ force })}
          />
          <Range
            label={t('墙的位置')}
            value={selected.wallX}
            min={1.2}
            max={4.5}
            step={0.1}
            unit="m"
            onChange={(wallX) => update({ wallX })}
          />
          <p>{t('简支弹性梁教学模型；剖面只放大形变，真实光路不放大角度。')}</p>
        </div>
      )}
    </section>
  );
}
