import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  opticalLever,
  beamDeflection,
  type OpticalPoint,
} from '../../models/small-deformation-lab';
import '../../styles/small-deformation-lab.css';
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
export default function SmallDeformationLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [load, setLoad] = useState(60),
    [distance, setDistance] = useState(2.3);
  const c = film.watch ? film.chapter : 2,
    p = film.chapterProgress;
  const force = film.watch
    ? c === 0
      ? 0
      : c === 1
        ? 60 * smooth(p * 2)
        : c === 2
          ? 60
          : 60 * (1 - smooth(p * 2))
    : load;
  const wallX = film.watch ? (c === 2 ? 2.3 + 1.7 * smooth(p * 1.5) : 2.3) : distance,
    s = opticalLever(force, wallX);
  const project = (v: OpticalPoint) => ({ x: 65 + 240 * v.x, y: 220 - 240 * v.y });
  const line = (a: OpticalPoint, b: OpticalPoint) => {
    const u = project(a),
      v = project(b);
    return `M${u.x} ${u.y}L${v.x} ${v.y}`;
  };
  const exit = { x: 1.18, y: s.p2.y + ((1.18 - s.p2.x) * s.d2.y) / s.d2.x };
  const shiftMM = s.shift * 1000,
    spotY = 95 - shiftMM * 14;
  return (
    <section className="deform-lab">
      <header>
        <p>
          {t(
            c === 0
              ? '先记下没有按压时的光点位置'
              : c === 1
                ? '桌面略微弯曲，光点离开原位'
                : c === 2
                  ? '把墙移远，光点变化更明显'
                  : '松开压力，光点回到原位',
          )}
        </p>
        <span>{t('双镜光路 · 微小形变')}</span>
      </header>
      <div className="deform-composition">
        <div className="deform-bench">
          <svg
            viewBox="0 0 360 280"
            role="img"
            aria-label={t('同一束光先到右镜，再到左镜，最后射向远处墙面')}
          >
            <defs>
              <linearGradient id={`${id}table`}>
                <stop stopColor="#dbc8ac" />
                <stop offset="1" stopColor="#c0ad91" />
              </linearGradient>
              <marker
                id={`${id}arrow`}
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <path d="M0 0L7 3.5L0 7Z" fill="#ad8061" />
              </marker>
            </defs>
            <path
              d="M65 228V265M305 228V265"
              stroke="#bfac8d"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path d="M52 220H318V231H52Z" fill={`url(#${id}table)`} />
            {[s.m, s.n].map((mirror, i) => {
              const a = {
                  x: mirror.center.x - 0.075 * Math.cos(mirror.angle),
                  y: mirror.center.y - 0.075 * Math.sin(mirror.angle),
                },
                b = {
                  x: mirror.center.x + 0.075 * Math.cos(mirror.angle),
                  y: mirror.center.y + 0.075 * Math.sin(mirror.angle),
                };
              return (
                <g key={i}>
                  <path d={line(mirror.base, mirror.center)} stroke="#a5b1aa" strokeWidth="5" />
                  <path d={line(a, b)} stroke="#76949a" strokeWidth="4" />
                  <path d={line(a, b)} stroke="#d3e0dd" strokeWidth="1" />
                </g>
              );
            })}
            <path
              d={`${line(s.source, s.p1)}${line(s.p1, s.p2)}${line(s.p2, exit)}`}
              stroke="#b98265"
              strokeWidth="1.6"
              fill="none"
            />
            <circle cx={project(s.p1).x} cy={project(s.p1).y} r="3" fill="#dbb695" />
            <circle cx={project(s.p2).x} cy={project(s.p2).y} r="3" fill="#dbb695" />
            <g
              transform={`translate(${project(s.source).x - 10} ${project(s.source).y - 6}) rotate(-1.2)`}
            >
              <rect width="21" height="12" rx="4" fill="#84988b" />
              <path d="M18 2V10" stroke="#c5d2bc" strokeWidth="2" />
            </g>
            {force > 0 && (
              <path
                d={`M185 ${185 - force * 0.25}V214`}
                stroke="#ad8061"
                strokeWidth="2.5"
                markerEnd={`url(#${id}arrow)`}
              />
            )}
            <path d="M340 144L349 150L340 156" fill="none" stroke="#b98265" strokeWidth="1.6" />
          </svg>
          <div className="deform-apparatus-caption">
            <span>
              {t('按压力')} {force.toFixed(0)} N
            </span>
            <span>{t('连续光路通向墙面')} →</span>
          </div>
        </div>
        <div className="deform-wall">
          <p>{t('墙上光点 · 局部放大')}</p>
          <svg viewBox="0 0 180 210" aria-label={t('光点相对未受力零位的毫米位移')} role="img">
            <defs>
              <radialGradient id={`${id}spot`}>
                <stop stopColor="#b66f45" stopOpacity=".8" />
                <stop offset="1" stopColor="#b66f45" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M70 14V190" stroke="#c6cdbb" />
            {[-6, -4, -2, 0, 2, 4].map((mm) => (
              <g key={mm}>
                <path d={`M66 ${95 - mm * 14}H79`} stroke="#a5b397" />
                <text x="58" y={101 - mm * 14} textAnchor="end" fill="#71845f" fontSize="16">
                  {mm}
                </text>
              </g>
            ))}
            <path d="M85 95H151" stroke="#b4bca8" strokeDasharray="3 4" />
            <circle cx="116" cy="95" r="5" fill="none" stroke="#9aa98c" />
            <circle cx="116" cy={spotY} r="14" fill={`url(#${id}spot)`} />
            <circle cx="116" cy={spotY} r="3" fill="#af754e" />
            <text x="115" y="205" textAnchor="middle" fill="#71845f" fontSize="16">
              mm
            </text>
          </svg>
          <output>{shiftMM.toFixed(2)} mm</output>
          <span>
            {t('墙的位置')} {wallX.toFixed(1)} m
          </span>
        </div>
      </div>
      <div className="deform-profile">
        <p>{t('桌面形变剖面 · 纵向放大500倍')}</p>
        <svg viewBox="0 0 320 64" aria-hidden="true">
          <path d="M15 19H305" stroke="#bdc6b0" strokeDasharray="4 5" />
          <path
            d={Array.from({ length: 41 }, (_, i) => {
              const x = i / 40;
              return `${i ? 'L' : 'M'}${15 + x * 290} ${19 + beamDeflection(x, force).down * 500 * 290}`;
            }).join(' ')}
            fill="none"
            stroke="#ad8968"
            strokeWidth="2.4"
          />
          <path d="M15 22L8 34H22ZM305 22L298 34H312Z" fill="#adba9d" />
        </svg>
        <span>
          {t('中央下沉')} {(s.deflection * 1000).toFixed(3)} mm
        </span>
      </div>
      <p className="deform-cause">
        {t(
          force < 1
            ? '零位记录未受力状态；看不出变化不等于不会变形。'
            : '微小转角改变反射方向，长光程把角度变化变成可见位移。',
        )}
      </p>
      {!film.watch && (
        <div className="deform-controls">
          <Range label={t('按压力')} value={load} min={0} max={80} unit="N" onChange={setLoad} />
          <Range
            label={t('墙的位置')}
            value={distance}
            min={1.2}
            max={4}
            step={0.1}
            unit="m"
            onChange={setDistance}
          />
        </div>
      )}
      <p className="deform-note">
        {t('桌面简化为中央受力的弹性梁；镜面与光线按同一几何求交，数值为教学设定。')}
      </p>
    </section>
  );
}
