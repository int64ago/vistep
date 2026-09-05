import { t } from '../../i18n';
import {
  PLANETARY,
  planetaryOutlines,
  planetaryState,
  type PlanetaryMode,
} from '../../models/planetary';
import { TAU, type Point2 } from '../../models/mechanisms';
export const gearNames = { sun: '太阳轮', ring: '内齿圈', carrier: '行星架' };
export const constraintNames: Record<PlanetaryMode, string> = {
  'ring-fixed': '固定内齿圈',
  'sun-fixed': '固定太阳轮',
  'carrier-fixed': '固定行星架',
  locked: '锁成整体',
};
const outlines = planetaryOutlines();
const path = (points: Point2[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + 'Z';
export const gearPaths = {
  sun: path(outlines.sun),
  planet: path(outlines.planet),
  ring: `M1.55 0A1.55 1.55 0 1 0 -1.55 0A1.55 1.55 0 1 0 1.55 0Z${path(outlines.ring)}`,
};
export default function PlanetaryDiagram({ angle, mode }: { angle: number; mode: PlanetaryMode }) {
  const state = planetaryState(angle, mode),
    orbit = ((PLANETARY.sun + PLANETARY.planet) * PLANETARY.module) / 2;
  return (
    <svg
      viewBox="0 0 360 360"
      className="planetary-diagram"
      role="img"
      aria-label={t('行星轮同时与太阳轮和内齿圈啮合；二维视图与三维装配共用齿廓和相位')}
    >
      <g transform="translate(180 180) scale(100 -100)">
        <circle r="1.68" fill="none" stroke="#729098" strokeWidth=".05" opacity=".4" />
        <g
          transform={`rotate(${(state.carrier * 180) / Math.PI})`}
          stroke="#559e92"
          strokeWidth=".14"
          strokeLinecap="round"
        >
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${Math.cos((i * TAU) / 3) * 0.18} ${Math.sin((i * TAU) / 3) * 0.18}L${Math.cos((i * TAU) / 3) * orbit} ${Math.sin((i * TAU) / 3) * orbit}`}
            />
          ))}
        </g>
        <path
          d={gearPaths.ring}
          transform={`rotate(${(state.ring * 180) / Math.PI})`}
          fill="#839ba8"
          fillRule="evenodd"
        />
        <g transform={`rotate(${(state.sun * 180) / Math.PI})`}>
          <path d={gearPaths.sun} fill="#c4a264" />
          <circle r=".12" fill="#142b37" />
          <circle cx=".31" r=".034" fill="#fff0bb" />
        </g>
        {state.planets.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${(p.angle * 180) / Math.PI})`}>
            <path d={gearPaths.planet} fill={i === 0 ? '#7cbbb0' : '#a3b9bb'} />
            <circle r=".095" fill="#263f4b" stroke="#a5c2b9" strokeWidth=".025" />
            <circle cx=".25" r=".04" fill={i === 0 ? '#f3d797' : '#789999'} />
          </g>
        ))}
      </g>
    </svg>
  );
}
