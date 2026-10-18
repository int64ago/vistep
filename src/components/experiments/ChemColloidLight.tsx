import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  colloidDirector,
  colloidOptics,
  rayleighSideIntensity,
} from '../../models/chem-colloid-light';
import '../../styles/chem-colloid-light.css';
export default function ChemColloidLight() {
  const film = useShowcase(),
    uid = useId().replace(/:/g, '');
  const en = browserLocale() === 'en',
    say = (zh: string, english: string) => (en ? english : zh);
  const [concentration, setConcentration] = useState(120),
    [radius, setRadius] = useState(18),
    [wavelength, setWavelength] = useState('633'),
    [view, setView] = useState('bench');
  const d = film.watch
    ? colloidDirector(film.chapter, film.chapterProgress)
    : {
        prepared: 1,
        light: true,
        microscopic: view === 'particles',
        radiusNm: radius,
        volumePpm: concentration,
        wavelengthNm: Number(wavelength),
      };
  const s = colloidOptics(d.radiusNm, d.volumePpm, d.wavelengthNm);
  const beam = d.wavelengthNm < 500 ? '#97b9ff' : '#fa9a7e';
  // Perceptual gain keeps a small, physically computed side fraction visible on a phone.
  const visible = -Math.expm1(-s.scattered * 20);
  const scatterTime = film.watch ? film.chapterProgress : 1;
  const incident = Math.min(1, scatterTime / 0.3);
  const outgoing = Math.max(0, Math.min(1, (scatterTime - 0.3) / 0.55));
  return (
    <section className="chem-colloid-light" data-watch={film.watch} data-micro={d.microscopic}>
      <header>
        <p>
          {say(
            d.microscopic
              ? '侧面看见的光，来自颗粒的散射'
              : film.watch && film.chapter === 0
                ? '先得到红褐色胶体，再比较光路'
                : '同一束光，为什么只照亮一条路径？',
            d.microscopic
              ? 'Light seen from the side has been scattered'
              : film.watch && film.chapter === 0
                ? 'Form the red-brown colloid, then compare light paths'
                : 'Why does one sample reveal the beam?',
          )}
        </p>
        <span>{say('胶体 · 丁达尔效应', 'Colloids · Tyndall effect')}</span>
      </header>
      <div className="chem-colloid-bench">
        {[false, true].map((colloid) => (
          <figure key={String(colloid)}>
            <figcaption>
              {say(
                colloid ? '氢氧化铁胶体' : '氯化钠溶液',
                colloid ? 'Iron(III) hydroxide colloid' : 'Sodium chloride solution',
              )}
            </figcaption>
            <svg
              viewBox="0 0 360 340"
              role="img"
              aria-label={say(
                colloid ? '红褐色胶体中的光路向侧面散射' : '盐溶液中没有明显的侧向光路',
                colloid
                  ? 'A red-brown colloid scatters the beam toward a side observer'
                  : 'No obvious sideways beam in the salt solution',
              )}
            >
              <defs>
                <linearGradient id={`${uid}-glass-${colloid}`}>
                  <stop stopColor="#d5e5dc" stopOpacity=".12" />
                  <stop offset=".45" stopColor="#ecf0e4" stopOpacity=".04" />
                  <stop offset="1" stopColor="#c8ded1" stopOpacity=".2" />
                </linearGradient>
                <linearGradient
                  id={`${uid}-beam-${colloid}`}
                  gradientUnits="userSpaceOnUse"
                  x1="105"
                  y1="201"
                  x2="276"
                  y2="201"
                >
                  <stop stopColor={beam} stopOpacity={colloid ? visible : 0.008} />
                  <stop
                    offset="1"
                    stopColor={beam}
                    stopOpacity={colloid ? visible * s.transmitted : 0.008}
                  />
                </linearGradient>
              </defs>
              <ellipse cx="190" cy="276" rx="98" ry="10" fill="#081919" opacity=".2" />
              <path
                d="M103 84V253Q103 274 190 274T277 253V84"
                fill={`url(#${uid}-glass-${colloid})`}
                stroke="#a9c7bd"
                strokeWidth="2"
              />
              <path
                d="M105 151V251Q105 271 190 271T275 251V151Z"
                fill={colloid ? '#aa6944' : '#b4d4c6'}
                opacity={colloid ? 0.08 + d.prepared * 0.22 : 0.1}
              />
              <ellipse
                cx="190"
                cy="151"
                rx="85"
                ry="12"
                fill={colloid ? '#bb8055' : '#bedccc'}
                opacity={colloid ? 0.12 + d.prepared * 0.13 : 0.13}
              />
              <ellipse
                cx="190"
                cy="84"
                rx="87"
                ry="13"
                stroke="#aec9c0"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M116 103V242"
                stroke="#dce9dd"
                opacity=".32"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect x="20" y="191" width="47" height="21" rx="8" fill="#789a91" />
              <path
                d="M67 201H105M276 201H323"
                stroke={beam}
                strokeWidth="2"
                opacity={d.light ? 0.85 : 0}
              />
              <path
                d="M105 201H276"
                stroke={`url(#${uid}-beam-${colloid})`}
                strokeWidth="10"
                opacity={d.light ? d.prepared : 0}
              />
              <path
                d="M105 201H276"
                stroke={beam}
                strokeWidth="2"
                opacity={d.light ? (colloid ? visible * 0.7 : 0.01) : 0}
              />
              <rect x="323" y="173" width="7" height="56" rx="3" fill="#d7d8bc" />
              <ellipse
                cx="325"
                cy="201"
                rx="3"
                ry="5"
                fill={beam}
                opacity={d.light ? (colloid ? s.transmitted : 1) : 0}
              />
              {colloid &&
                d.light &&
                Array.from({ length: 12 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${120 + i * 12} 201L${175 + i * 3} 296`}
                    stroke={beam}
                    opacity={visible * 0.13}
                    strokeWidth="1"
                  />
                ))}
              <path d="M174 309Q190 291 206 309Q190 323 174 309Z" stroke="#bfd0c2" fill="none" />
              <circle cx="190" cy="308" r="4" fill="#bfd0c2" />
              {!d.light && colloid && (
                <>
                  <path
                    d="M130 134q-8-12 0-24t0-24M242 132q8-12 0-24t0-24"
                    stroke="#d1dbce"
                    opacity=".4"
                  />
                  <rect x="129" y="278" width="122" height="12" rx="6" fill="#69877b" />
                  <path d="M155 285h70" stroke="#d5ad74" strokeWidth="2" />
                  <path
                    d="M170 28V62Q178 80 186 62V28"
                    stroke="#c1cfc1"
                    fill="#b49768"
                    fillOpacity=".25"
                  />
                  <circle
                    cx="178"
                    cy={90 + d.prepared * 48}
                    r="4"
                    fill="#bc9761"
                    opacity={d.prepared < 0.99 ? 0.8 : 0}
                  />
                </>
              )}
            </svg>
            <p>
              {say(
                colloid ? '从垂直光束的方向观察' : '光仍然到达后方光屏',
                colloid
                  ? 'Observe perpendicular to the incident beam'
                  : 'Light still reaches the screen behind it',
              )}
            </p>
          </figure>
        ))}
      </div>
      {d.microscopic && (
        <div className="chem-colloid-micro">
          <svg
            viewBox="0 0 380 155"
            role="img"
            aria-label={say(
              '放大的单颗粒把入射光散向不同方向',
              'Magnified particle redirects incident light',
            )}
          >
            <path d={`M15 78H${15 + 159 * incident}`} stroke={beam} strokeWidth="4" />
            <circle cx="190" cy="78" r={d.radiusNm * 0.65} fill="#b17c55" stroke="#d3aa79" />
            {[-75, -40, 0, 40, 75, 135, 180, 225].map((a) => (
              <path
                key={a}
                d={`M${190 + Math.cos((a * Math.PI) / 180) * 22} ${78 + Math.sin((a * Math.PI) / 180) * 22}L${190 + Math.cos((a * Math.PI) / 180) * (22 + 49 * outgoing)} ${78 + Math.sin((a * Math.PI) / 180) * (22 + 49 * outgoing)}`}
                stroke={beam}
                strokeWidth="2"
                opacity={outgoing * rayleighSideIntensity(a) * 0.8}
              />
            ))}
          </svg>
          <span className="chem-colloid-wavelength">λ {d.wavelengthNm} nm</span>
          <p>
            {say(
              '颗粒被放大；散射不会让颗粒自己发光。',
              'Particles are enlarged; scattering does not make them light sources.',
            )}
          </p>
        </div>
      )}
      <p className="chem-colloid-cause">
        {say(
          film.watch && film.chapter === 3
            ? '稀释减少单位体积内的颗粒，侧向光路逐渐减弱。'
            : '看见光路 ≠ 光走得更远，而是有一部分光转向了眼睛。',
          film.watch && film.chapter === 3
            ? 'Dilution reduces particle number per volume and weakens the side beam.'
            : 'A visible beam means some light has been redirected toward your eye.',
        )}
      </p>
      {!film.watch && (
        <div className="chem-colloid-controls">
          <Segments
            label={say('观察层次', 'Observation')}
            value={view}
            onChange={setView}
            options={[
              { value: 'bench', label: say('光路', 'Light path') },
              { value: 'particles', label: say('颗粒机制', 'Particle mechanism') },
            ]}
          />
          <Range
            label={say('模型颗粒体积分数', 'Model particle volume fraction')}
            value={concentration}
            min={0}
            max={500}
            step={10}
            unit="ppm"
            onChange={setConcentration}
          />
          <Range
            label={say('模型颗粒半径', 'Model particle radius')}
            value={radius}
            min={4}
            max={24}
            step={1}
            unit="nm"
            onChange={setRadius}
          />
          <Segments
            label={say('模型光源', 'Model light source')}
            value={wavelength}
            onChange={setWavelength}
            options={[
              { value: '633', label: say('红光', 'Red') },
              { value: '450', label: say('蓝光', 'Blue') },
            ]}
          />
        </div>
      )}
      <details>
        <summary>{say('模型边界与光能核对', 'Model limits and energy balance')}</summary>
        <p>
          {say(
            '装置重建教材现象。调参使用透明小球的瑞利散射类比，不是氢氧化铁的粒径、颜色或实测强度；溶液也有微弱散射，图中仅降低其可见度。',
            'The apparatus reconstructs the textbook observation. Controls use a nonabsorbing small-sphere Rayleigh analogy, not measured iron-hydroxide size, colour or intensity. Solutions also scatter weakly; the display reduces that visibility.',
          )}
        </p>
        <p>
          {say('模型透射', 'Model transmitted')} {(s.transmitted * 100).toFixed(1)}% ·{' '}
          {say('总散射', 'Total scattered')} {(s.scattered * 100).toFixed(1)}%
        </p>
      </details>
    </section>
  );
}
