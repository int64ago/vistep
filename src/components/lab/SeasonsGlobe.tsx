import { useId } from 'react';
import { t } from '../../i18n';
import {
  seasonLightPath,
  seasonPortrait,
  seasonSurface,
  type SeasonsState,
} from '../../models/seasons';

function latitudePaths(latitude: number) {
  let front = '',
    back = '',
    lastFront: boolean | null = null;
  for (let i = 0; i <= 144; i++) {
    const p = seasonPortrait(seasonSurface(latitude, i / 6));
    const visible = p.z >= 0;
    const command = lastFront === visible ? 'L' : 'M';
    const point = `${(150 + p.x * 108).toFixed(2)},${(150 - p.y * 108).toFixed(2)}`;
    if (visible) front += command + point;
    else back += command + point;
    lastFront = visible;
  }
  return { front, back };
}
function longitudePath(hour: number) {
  let path = '',
    last = false;
  for (let latitude = -90; latitude <= 90; latitude += 2) {
    const p = seasonPortrait(seasonSurface(latitude, hour));
    if (p.z >= 0) path += `${last ? 'L' : 'M'}${150 + p.x * 108},${150 - p.y * 108}`;
    last = p.z >= 0;
  }
  return path;
}
export default function SeasonsGlobe({ state: s }: { state: SeasonsState }) {
  const id = useId().replace(/:/g, '');
  const delta = (s.declination * Math.PI) / 180;
  const sun = seasonPortrait({ x: 0, y: Math.sin(delta), z: Math.cos(delta) });
  const site = seasonPortrait(seasonSurface(s.latitude, s.hour));
  const north = seasonPortrait({ x: 0, y: 1, z: 0 });
  const ring = latitudePaths(s.latitude),
    opposite = latitudePaths(-s.latitude);
  return (
    <div className="seasons-globe">
      <svg viewBox="0 0 300 300" role="img" aria-label={t('地球上的昼夜分界、观测纬圈与当前地点')}>
        <defs>
          <radialGradient id={`${id}-night`} cx="35%" cy="30%" r="75%">
            <stop stopColor="#23474b" />
            <stop offset="1" stopColor="#091d29" />
          </radialGradient>
          <radialGradient
            id={`${id}-day`}
            cx={`${50 + sun.x * 27}%`}
            cy={`${50 - sun.y * 27}%`}
            r="90%"
          >
            <stop stopColor="#acd7c3" />
            <stop offset=".58" stopColor="#477f7d" />
            <stop offset="1" stopColor="#203e4a" />
          </radialGradient>
          <radialGradient id={`${id}-rim`}>
            <stop offset=".7" stopColor="#061822" stopOpacity="0" />
            <stop offset="1" stopColor="#061822" stopOpacity=".48" />
          </radialGradient>
        </defs>
        <ellipse
          cx="150"
          cy="150"
          rx="130"
          ry="119"
          fill="none"
          stroke="#b59f74"
          strokeOpacity=".18"
          transform="rotate(-27 150 150)"
        />
        <path
          d={`M${150 - north.x * 137} ${150 + north.y * 137}L${150 + north.x * 137} ${150 - north.y * 137}`}
          stroke="#c1b38e"
          strokeWidth="2"
        />
        <circle cx="150" cy="150" r="108" fill={`url(#${id}-night)`} />
        <path
          d={seasonLightPath(sun)}
          transform="translate(150 150) scale(108)"
          fill={`url(#${id}-day)`}
        />
        <circle cx="150" cy="150" r="108" fill={`url(#${id}-rim)`} />
        {[-66.56, -30, 0, 30, 66.56].map((latitude) => (
          <path
            key={latitude}
            d={latitudePaths(latitude).front}
            fill="none"
            stroke="#d4e9dc"
            strokeOpacity={latitude === 0 ? 0.55 : 0.2}
            strokeWidth={latitude === 0 ? 1.15 : 0.75}
            strokeDasharray={Math.abs(latitude) > 60 ? '2 4' : undefined}
          />
        ))}
        {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
          <path
            key={hour}
            d={longitudePath(hour)}
            fill="none"
            stroke="#d4e9dc"
            strokeOpacity=".16"
            strokeWidth=".75"
          />
        ))}
        <path d={opposite.front} fill="none" stroke="#91ccd8" strokeWidth="2" />
        <path
          d={opposite.back}
          fill="none"
          stroke="#91ccd8"
          strokeOpacity=".22"
          strokeDasharray="3 5"
        />
        <path d={ring.front} fill="none" stroke="#f1cf8b" strokeWidth="2.7" />
        <path d={ring.back} fill="none" stroke="#f1cf8b" strokeOpacity=".3" strokeDasharray="3 5" />
        <circle
          cx={150 + site.x * 108}
          cy={150 - site.y * 108}
          r="6.5"
          fill={site.z >= 0 ? '#f4d492' : '#102e39'}
          stroke="#fff1c1"
          strokeWidth="2"
          strokeDasharray={site.z < 0 ? '2 2' : undefined}
        />
        <text x="150" y="19" textAnchor="middle">
          N
        </text>
        <text x="150" y="295" textAnchor="middle">
          S
        </text>
      </svg>
      <p className="seasons-globe-key">
        <i />
        {t('观测纬圈')}{' '}
        <b>
          {Math.abs(s.latitude).toFixed(0)}° {s.latitude < 0 ? 'S' : 'N'}
        </b>
      </p>
      <p className="seasons-globe-note">{t('地球近景随日照方向转向')}</p>
    </div>
  );
}
