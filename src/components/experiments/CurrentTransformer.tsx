import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ctDefaults,
  currentTransformer,
  ctShot,
  ctWinding,
} from '../../models/current-transformer';
import '../../styles/current-transformer.css';
export default function CurrentTransformer() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [primary, setPrimary] = useState(100),
    [burden, setBurden] = useState(1),
    [turns, setTurns] = useState('100'),
    [mode, setMode] = useState('ac'),
    [phase, setPhase] = useState(45),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? ctShot(c, film.chapterProgress)
      : currentTransformer(
          {
            ...ctDefaults(),
            primaryRms: primary,
            burden,
            secondaryTurns: Number(turns),
            open: mode === 'open',
            waveform: mode === 'dc' ? 'dc' : 'ac',
          },
          (phase * Math.PI) / 180,
        ),
    winding = useMemo(() => ctWinding(s.secondaryTurns), [s.secondaryTurns]),
    curve = useMemo(
      () => Array.from({ length: 161 }, (_, i) => currentTransformer(s, (i / 160) * 2 * Math.PI)),
      [s.primaryRms, s.burden, s.secondaryTurns, s.open, s.waveform],
    ),
    end1 = [103 + 67 * Math.cos(-0.75), 104 + 67 * Math.sin(-0.75)],
    end2 = [103 + 67 * Math.cos(0.75), 104 + 67 * Math.sin(0.75)],
    scale = s.open ? (((80 * s.primaryRms) / 100) * s.secondaryTurns) / 100 : 2.3,
    py = (v: number) => 66 - (v / scale) * 44,
    px = (a: number) => 43 + (a / (2 * Math.PI)) * 278;
  return (
    <div className="ct-film" data-watch={film.watch}>
      <p className="ct-context">
        {s.open
          ? t('二次开路模型：电流消失，端电压升高')
          : s.waveform === 'dc'
            ? t('直流稳态：有磁通，没有感应电流')
            : s.burden > 2
              ? t('负担增大：磁芯非线性使比例失真')
              : t('一次穿心，二次电流抵消大部分安匝')}
      </p>
      <svg
        className="ct-body"
        viewBox="0 0 340 222"
        role="img"
        aria-label={t('穿心一次导体、环形磁芯、真实匝数的二次绕组与负担回路')}
      >
        <defs>
          <radialGradient id={`${id}-core`}>
            <stop offset=".5" stopColor="#d8e0cb" />
            <stop offset=".72" stopColor="#bac9ad" />
            <stop offset="1" stopColor={Math.abs(s.b) > s.knee ? '#c1b38b' : '#a7b89a'} />
          </radialGradient>
        </defs>
        <circle cx="103" cy="104" r="66" fill={`url(#${id}-core)`} />
        <circle cx="103" cy="104" r="35" fill="var(--paper,#f4f5eb)" />
        <circle cx="103" cy="104" r="59" fill="none" stroke="#a8b89a" opacity=".4" />
        <circle cx="103" cy="104" r="42" fill="none" stroke="#dce5d0" />
        {winding.map((points, i) => (
          <path
            key={i}
            d={points.map(([x, y], j) => `${j ? 'L' : 'M'}${x} ${y}`).join(' ')}
            fill="none"
            stroke="#ad9672"
            strokeWidth={s.secondaryTurns === 100 ? 0.65 : 0.4}
            strokeLinecap="round"
          />
        ))}
        <circle cx="103" cy="104" r="13" fill="#d0b993" stroke="#ae966e" strokeWidth="2" />
        {Math.abs(s.primary) > 1e-8 &&
          (s.primary >= 0 ? (
            <circle cx="103" cy="104" r="3" fill="#8e7754" />
          ) : (
            <path d="M98 99l10 10m-10 0 10 -10" stroke="#8e7754" strokeWidth="2" />
          ))}
        {[2.1, 3.1, 4.1].map((a, i) =>
          Math.abs(s.b) > 1e-8 ? (
            <path
              key={i}
              d="M-4 -3L1 0L-4 3"
              fill="none"
              stroke="#728e76"
              strokeWidth="2"
              transform={`translate(${103 + 51 * Math.cos(a)} ${104 + 51 * Math.sin(a)}) rotate(${(a * 180) / Math.PI + (s.b > 0 ? -90 : 90)})`}
            />
          ) : null,
        )}
        <text x="103" y="23" textAnchor="middle">
          Np = 1
        </text>
        <text x="103" y="187" textAnchor="middle">
          Ns = {s.secondaryTurns}
        </text>
        <path
          d={`M${end1[0]} ${end1[1]}H279V84M${end2[0]} ${end2[1]}H279V122`}
          fill="none"
          stroke="#ab9675"
          strokeWidth="2"
        />
        {s.open ? (
          <>
            <circle cx="279" cy="84" r="3" fill="#b29a75" />
            <circle cx="279" cy="122" r="3" fill="#b29a75" />
            <path d="M279 84l20 27" stroke="#b29a75" strokeWidth="2" />
            <text x="279" y="175" textAnchor="middle">
              {t('开路')}
            </text>
          </>
        ) : (
          <>
            <rect x="270" y="84" width="18" height="38" rx="3" fill="#dde4d1" stroke="#a7b494" />
            <text x="279" y="175" textAnchor="middle">
              {s.burden.toFixed(1)} Ω
            </text>
          </>
        )}
        <text x="230" y={end1[1] - 7}>
          {s.voltage >= 0 ? '−' : '+'}
        </text>
        <text x="202" y={end2[1] - 7}>
          {s.voltage >= 0 ? '+' : '−'}
        </text>
        <text x="252" y="32" textAnchor="middle">
          Ip {s.primary.toFixed(0)} A
        </text>
        {Math.abs(s.secondary) > 1e-8 && (
          <path
            d={s.secondary >= 0 ? `M221 ${end1[1] - 5}l-7 5 7 5` : `M214 ${end1[1] - 5}l7 5 -7 5`}
            fill="none"
            stroke="#8e9c7a"
            strokeWidth="2"
          />
        )}
        <text x="170" y="213" textAnchor="middle">
          {s.waveform === 'dc' ? t('直流已达稳态') : t('50 Hz · 每章慢放40 ms')}
        </text>
      </svg>
      <div className="ct-readings">
        <span>
          Is<b>{s.secondary.toFixed(2)} A</b>
        </span>
        <span>
          B<b>{s.b.toFixed(2)} T</b>
        </span>
        <span>
          Vs<b>{s.voltage.toFixed(1)} V</b>
        </span>
      </div>
      {c === 1 ? (
        <div className="ct-balance">
          <p>{t('安匝平衡')}</p>
          <b>
            {(s.primaryTurns * s.primary).toFixed(1)} −{' '}
            {(s.secondaryTurns * s.secondary).toFixed(1)} = {s.excitingMMF.toFixed(1)}
          </b>
          <p>Np·Ip − Ns·Is = H(B)·ℓ</p>
        </div>
      ) : (
        <div className="ct-wave">
          <svg
            viewBox="0 0 340 139"
            role="img"
            aria-label={
              s.open ? t('开路二次电压的尖峰波形') : t('实际二次电流与理想匝数比电流的对照')
            }
          >
            <path d="M43 14V113M43 66H321" fill="none" stroke="#c5ceb8" />
            <text x="5" y="18">
              {s.open ? 'V' : 'A'}
            </text>
            <text x="3" y="35">
              {s.open ? scale.toFixed(0) : '2'}
            </text>
            <text x="10" y="72">
              0
            </text>
            <text x="2" y="112">
              {s.open ? `−${scale.toFixed(0)}` : '−2'}
            </text>
            <text x="43" y="137">
              0
            </text>
            <text x="320" y="137" textAnchor="end">
              20 ms
            </text>
            {!s.open && (
              <path
                d={curve
                  .map((q, i) => `${i ? 'L' : 'M'}${43 + (i / 160) * 278} ${py(q.idealSecondary)}`)
                  .join(' ')}
                stroke="#bba67d"
                strokeDasharray="4 4"
                strokeWidth="2"
                fill="none"
              />
            )}
            <path
              d={curve
                .map(
                  (q, i) =>
                    `${i ? 'L' : 'M'}${43 + (i / 160) * 278} ${py(s.open ? q.voltage : q.secondary)}`,
                )
                .join(' ')}
              stroke="#7f9c7e"
              strokeWidth="2.6"
              fill="none"
            />
            <circle
              cx={px(s.theta)}
              cy={py(s.open ? s.voltage : s.secondary)}
              r="4"
              fill="#7f9c7e"
            />
          </svg>
          <p>
            {s.open ? t('带电CT二次侧不得开路；这里仅作模型对照。') : t('虚线：Np·Ip/Ns；实线：Is')}
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="ct-controls">
          <Segments
            label={t('运行条件')}
            value={mode}
            options={[
              { value: 'ac', label: t('交流闭合') },
              { value: 'open', label: t('开路模型') },
              { value: 'dc', label: t('直流稳态') },
            ]}
            onChange={setMode}
          />
          <Range
            label={t('一次电流有效值或直流值')}
            value={primary}
            min={20}
            max={150}
            step={5}
            unit="A"
            onChange={setPrimary}
          />
          <Range
            label={t('二次负担')}
            value={burden}
            min={0.2}
            max={8}
            step={0.2}
            unit="Ω"
            onChange={setBurden}
          />
          <Segments
            label={t('二次匝数')}
            value={turns}
            options={[
              { value: '100', label: '100' },
              { value: '200', label: '200' },
            ]}
            onChange={setTurns}
          />
          <Range
            label={t('电周期位置')}
            value={phase}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={setPhase}
          />
        </div>
      )}
      <details className="ct-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '规定一次电流的非线性磁路；芯截面2 cm²，磁路16 cm，单值B–H曲线，无磁滞、漏感、线圈电阻或寄生电容。波形为周期稳态，开路电压不是实物额定值。',
          )}
        </p>
      </details>
    </div>
  );
}
