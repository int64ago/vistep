import { useState, type CSSProperties } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  chlorineBleaching,
  bleachColour,
  bleachingDirector,
  type BleachSpecimen,
} from '../../models/chem-chlorine-bleaching';
import '../../styles/chem-chlorine-bleaching.css';
export default function ChemChlorineBleaching() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [chosenView, setView] = useState<string | null>(null),
    [chosenExtent, setExtent] = useState<number | null>(null),
    [water, setWater] = useState(true),
    [gas, setGas] = useState(true);
  const directed = bleachingDirector(
    film.chapter,
    film.chapterProgress,
    film.chapterTime,
    en ? 'en' : 'zh',
  );
  const view = chosenView ?? ['paper', 'flower', 'micro'][Math.max(0, Math.min(2, film.chapter))],
    extent = chosenExtent ?? directed.extent;
  const d = film.watch
    ? directed
    : { flower: view === 'flower', micro: view === 'micro', extent, water, gas };
  const jar = (specimen: BleachSpecimen) => {
    const m = chlorineBleaching(specimen, d.extent, d.gas);
    return (
      <svg
        viewBox="0 0 260 300"
        role="img"
        aria-label={say(
          specimen === 'flower'
            ? '鲜花在氯气中褪色'
            : specimen === 'dry-paper'
              ? '干纸条保留颜色'
              : '湿纸条褪色',
          specimen === 'flower'
            ? 'Fresh flower fades in chlorine'
            : specimen === 'dry-paper'
              ? 'Dry paper retains colour'
              : 'Damp paper fades',
        )}
      >
        <path
          d="M68 51V75L45 90V260Q45 277 63 277H197Q215 277 215 260V90L192 75V51"
          fill="#c5d09b22"
          stroke="#91a184"
          strokeWidth="2"
        />
        <path
          d="M53 104H207V258Q207 269 195 269H65Q53 269 53 258Z"
          fill="#c3cd79"
          opacity={d.gas ? 0.15 : 0}
        />
        <ellipse cx="130" cy="51" rx="62" ry="8" fill="#d6ddcf" stroke="#8d9d80" />
        {specimen === 'flower' ? (
          <>
            <path d="M130 254Q145 215 129 170" stroke="#809774" strokeWidth="4" fill="none" />
            <path
              d="M137 225Q177 199 183 223Q158 244 137 225M133 240Q96 214 86 233Q110 254 133 240"
              fill="#91a47e"
            />
            {Array.from({ length: 7 }, (_, i) => (
              <ellipse
                key={i}
                cx="130"
                cy="147"
                rx="17"
                ry="34"
                transform={`rotate(${(i * 360) / 7} 130 176)`}
                fill={bleachColour(m.colourRemaining)}
                stroke="#c5b3a4"
                strokeWidth=".6"
              />
            ))}
            <circle cx="130" cy="176" r="13" fill="#c7b67d" />
          </>
        ) : (
          <>
            <path d="M130 61V111" stroke="#8a8f78" />
            <path
              d="M104 107Q130 112 156 107V241Q130 236 104 241Z"
              fill={bleachColour(m.colourRemaining)}
              stroke="#b6b09a"
            />
            {specimen === 'wet-paper' &&
              [0, 1, 2].map((i) => (
                <path
                  key={i}
                  d={`M${115 + i * 12} ${128 + i * 26}q-7 8 0 12q7-4 0-12`}
                  fill="#d5e8df"
                  opacity=".7"
                />
              ))}
          </>
        )}
      </svg>
    );
  };
  return (
    <section
      className="chem-chlorine-bleaching"
      data-watch={film.watch}
      data-view={d.micro ? 'micro' : d.flower ? 'flower' : 'paper'}
      data-water={d.water}
      data-gas={d.gas}
      data-extent={d.extent}
    >
      {d.micro ? (
        <div className="chem-bleach-micro">
          <div className="chem-bleach-water">
            <span>{d.gas ? 'Cl₂' : say('无氯气', 'No chlorine')}</span>
            <i>+</i>
            <span>{d.water ? 'H₂O' : say('干燥纸条', 'Dry paper')}</span>
            <i>{d.water && d.gas ? '⇌' : '→'}</i>
            <span>{d.water && d.gas ? 'HCl + HClO' : say('保留颜色', 'Colour retained')}</span>
          </div>
          <div className="chem-bleach-sites">
            {chlorineBleaching(d.water ? 'wet-paper' : 'dry-paper', d.extent, d.gas).units.map(
              (u) => (
                <div
                  key={u.index}
                  data-site-id={u.index}
                  data-change={u.change}
                  style={
                    {
                      '--bleach-change': u.change,
                      '--bleach-colour': bleachColour(1 - u.change),
                    } as CSSProperties
                  }
                >
                  <i />
                  <i />
                  <i />
                </div>
              ),
            )}
          </div>
          <div className="chem-bleach-key">
            <span>
              <i />
              {say('原着色结构', 'Original structure')}
            </span>
            <span>
              <i />
              {say('氧化后改变', 'Changed by oxidation')}
            </span>
          </div>
        </div>
      ) : (
        <div className={`chem-bleach-jars ${d.flower ? 'is-flower' : ''}`}>
          {d.flower ? (
            <figure>
              {jar('flower')}
              <figcaption>{say('鲜花本身含水', 'Fresh tissue contains water')}</figcaption>
            </figure>
          ) : (
            <>
              <figure>
                {jar('dry-paper')}
                <figcaption>{say('干燥纸条', 'Dry paper')}</figcaption>
              </figure>
              <figure>
                {jar(d.water ? 'wet-paper' : 'dry-paper')}
                <figcaption>
                  {d.water
                    ? say('湿润纸条', 'Damp paper')
                    : say('另一份干纸条', 'Another dry paper')}
                </figcaption>
              </figure>
            </>
          )}
          <div className="chem-bleach-gas">
            {d.gas
              ? say('相同的干燥氯气', 'Same dry chlorine')
              : say('对照：无氯气', 'Control: no chlorine')}
          </div>
        </div>
      )}
      {!film.watch && (
        <div className="chem-bleach-controls">
          <Segments
            label={say('观察对象', 'View')}
            value={view}
            options={[
              { value: 'paper', label: say('纸条对照', 'Paper pair') },
              { value: 'flower', label: say('鲜花', 'Flower') },
              { value: 'micro', label: say('水的作用', 'Water role') },
            ]}
            onChange={setView}
          />
          <Segments
            label={say('氯气条件', 'Chlorine')}
            value={gas ? 'present' : 'absent'}
            options={[
              { value: 'present', label: say('有氯气', 'Present') },
              { value: 'absent', label: say('无氯气', 'Absent') },
            ]}
            onChange={(v) => setGas(v === 'present')}
          />
          {view !== 'flower' && (
            <Segments
              label={say('比较样品的含水状态', 'Water in comparison specimen')}
              value={water ? 'wet' : 'dry'}
              options={[
                { value: 'wet', label: say('含水', 'Moist') },
                { value: 'dry', label: say('干燥', 'Dry') },
              ]}
              onChange={(v) => setWater(v === 'wet')}
            />
          )}
          <Range
            label={say('归一化漂白进程', 'Normalized bleaching progress')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          <p>
            {say(
              '该进程不是实测时间或剂量；着色结构为概念示意，不指定纸条或鲜花中某一种色素。',
              'Progress is not measured time or dose. Colour-bearing structures are schematic and do not specify a particular dye or flower pigment.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
