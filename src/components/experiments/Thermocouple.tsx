import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  thermocouple,
  thermocoupleDefaults,
  thermocoupleShot,
  thermocoupleSegments,
  thermocoupleProfile,
} from '../../models/thermocouple';
import '../../styles/thermocouple.css';
const tint = (temp: number) => `hsl(${90 - (temp / 600) * 65} 25% ${84 - (temp / 600) * 16}%)`;
export default function Thermocouple() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [hot, setHot] = useState(400),
    [cold, setCold] = useState(25),
    [error, setError] = useState(0),
    [profile, setProfile] = useState(0),
    [bridge, setBridge] = useState('off'),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? thermocoupleShot(c, film.chapterProgress)
      : thermocouple({
          ...thermocoupleDefaults(),
          hot,
          cold,
          sensedCold: Math.max(0, Math.min(120, cold + error)),
          profile,
          bridge: bridge === 'on',
        }),
    segments = thermocoupleSegments(s),
    corrected = c === 3 || c === 5 || c === 4 || !film.watch;
  return (
    <div className="thermocouple-film" data-watch={film.watch}>
      <p className="thermocouple-context">
        {c === 5
          ? t('温度梯度换位置，端点温度不变')
          : s.bridge
            ? t('等温连接件：两处新接点同温')
            : t('K型热电偶：两根合金线，一个测量回路')}
      </p>
      <svg
        className="thermocouple-body"
        viewBox="0 0 340 251"
        role="img"
        aria-label={t('K型合金线、等温接线端与高阻电压表的完整连接')}
      >
        <defs>
          <linearGradient id={`${id}-heat`} x1="0" x2="1" y1="0" y2="0">
            {segments.map((q, i) => (
              <stop key={i} offset={q.x0} stopColor={tint(q.t0)} />
            ))}
            <stop offset="1" stopColor={tint(s.hot)} />
          </linearGradient>
        </defs>
        <rect x="32" y="43" width="74" height="120" rx="13" fill={tint(s.cold)} opacity=".8" />
        <circle cx="285" cy="100" r="32" fill={tint(s.hot)} opacity=".7" />
        <path
          d="M66 65H235Q285 65 285 100M66 135H235Q285 135 285 100"
          fill="none"
          stroke={`url(#${id}-heat)`}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path d="M66 65H235Q285 65 285 100" fill="none" stroke="#9d936a" strokeWidth="3.5" />
        <path d="M66 135H235Q285 135 285 100" fill="none" stroke="#859b91" strokeWidth="3.5" />
        <path d="M66 65H18V201H112M66 135V228H112" stroke="#b19778" strokeWidth="2.5" fill="none" />
        <circle cx="66" cy="65" r="5" fill="#b19778" />
        <circle cx="66" cy="135" r="5" fill="#b19778" />
        {s.bridge ? (
          <>
            <path d="M285 91V109" stroke="#c5ac7d" strokeWidth="9" />
            <circle cx="285" cy="91" r="3.5" fill="#9d936a" />
            <circle cx="285" cy="109" r="3.5" fill="#859b91" />
            <text x="311" y="108">
              M
            </text>
          </>
        ) : (
          <circle cx="285" cy="100" r="5" fill="#aca67c" />
        )}
        <text x="68" y="25" textAnchor="middle">
          Tc {s.cold.toFixed(0)}°C
        </text>
        <text x="265" y="25" textAnchor="middle">
          Th {s.hot.toFixed(0)}°C
        </text>
        <text x="150" y="53">
          K+
        </text>
        <text x="150" y="160">
          K−
        </text>
        <text x="28" y="188">
          Cu
        </text>
        <rect x="112" y="180" width="211" height="64" rx="12" fill="#e2e7da" stroke="#c1cbb5" />
        <text x="122" y="207">
          +
        </text>
        <text x="122" y="235">
          −
        </text>
        <text className="thermocouple-voltage" x="228" y="221" textAnchor="middle">
          {s.measured.toFixed(3)} mV
        </text>
        <circle cx="66" cy="100" r="10" stroke="#9baa8c" fill="none" />
        <text x="66" y="106" textAnchor="middle">
          T
        </text>
      </svg>
      {c === 5 ? (
        <div className="thermocouple-gradient">
          <svg viewBox="0 0 340 124" role="img" aria-label={t('沿导线的温度分布与同端点积分')}>
            <path d="M38 12V95H321" stroke="#c6ceba" fill="none" />
            <path
              d={`M38 ${95 - (s.cold / 450) * 85}L321 ${95 - (s.hot / 450) * 85}`}
              stroke="#c2b894"
              strokeDasharray="4 4"
              fill="none"
            />
            <path
              d={Array.from(
                { length: 65 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${38 + (i / 64) * 283} ${95 - (thermocoupleProfile(i / 64, s) / 450) * 85}`,
              ).join(' ')}
              stroke="#899b78"
              strokeWidth="2.8"
              fill="none"
            />
            <text x="3" y="27">
              °C
            </text>
            <text x="38" y="119">
              Tc
            </text>
            <text x="320" y="119" textAnchor="end">
              Th
            </text>
          </svg>
          <p>∫ S(T)dT = {segments.reduce((v, q) => v + q.emf, 0).toFixed(3)} mV</p>
        </div>
      ) : (
        <div className="thermocouple-compute">
          <div>
            <span>{t('假定冷端0°C')}</span>
            <b>{s.naive.toFixed(1)}°C</b>
          </div>
          {corrected && (
            <div>
              <span>{t('补偿后')}</span>
              <b>{s.indicated.toFixed(1)}°C</b>
            </div>
          )}
        </div>
      )}
      {corrected && c !== 5 && (
        <p className="thermocouple-equation">
          {s.measured.toFixed(3)} + {s.correction.toFixed(3)} = {s.corrected.toFixed(3)} mV
        </p>
      )}
      {s.bridge && (
        <p className="thermocouple-equation">
          M: {s.hot.toFixed(0)}°C → {s.hot.toFixed(0)}°C · ΔV = 0
        </p>
      )}
      {!film.watch && (
        <div className="thermocouple-controls">
          <Range
            label={t('测量端温度')}
            value={hot}
            min={0}
            max={600}
            step={5}
            unit="°C"
            onChange={setHot}
          />
          <Range
            label={t('接线端温度')}
            value={cold}
            min={10}
            max={100}
            step={1}
            unit="°C"
            onChange={setCold}
          />
          <Range
            label={t('冷端传感器偏差')}
            value={error}
            min={-10}
            max={10}
            step={0.5}
            unit="°C"
            onChange={setError}
          />
          <Range
            label={t('温度梯度集中程度')}
            value={profile}
            min={0}
            max={1}
            step={0.01}
            onChange={setProfile}
          />
          <Segments
            label={t('热端连接')}
            value={bridge}
            options={[
              { value: 'off', label: t('直接焊点') },
              { value: 'on', label: t('等温金属M') },
            ]}
            onChange={setBridge}
          />
        </div>
      )}
      <details className="thermocouple-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '均匀K型合金，NIST ITS-90参考函数；高阻开路读数，铜接线点同温。温度剖面为规定的稳态分布，不模拟导热时间、接触热阻或材料老化。',
          )}
        </p>
      </details>
    </div>
  );
}
