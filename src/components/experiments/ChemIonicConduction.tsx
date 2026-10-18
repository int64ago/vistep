import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ionicConduction,
  ionicFilmShot,
  ionicParticle,
  type IonicSample,
} from '../../models/chem-ionic-conduction';
import '../../styles/chem-ionic-conduction.css';
export default function ChemIonicConduction() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (zh: string, english: string) => (en ? english : zh);
  const [manualSample, setSample] = useState<IonicSample | null>(null),
    [concentration, setConcentration] = useState(1),
    [manualField, setField] = useState<string | null>(null),
    [progress, setProgress] = useState(0.8);
  const authored = ionicFilmShot(film.chapter, film.chapterTime, browserLocale()),
    sample =
      manualSample ?? (film.variant === 'ions' && film.chapter < 2 ? 'nacl' : authored.sample),
    field = manualField ?? (authored.connected ? 'on' : 'off');
  const d = film.watch
    ? authored
    : {
        sample,
        dissolved: sample.endsWith('solid') ? 0 : 1,
        drift: field === 'on' ? progress : 0,
        connected: field === 'on',
      };
  const s = ionicConduction(
    d.sample,
    (film.watch ? 1 : concentration) * d.dissolved,
    3,
    d.connected,
  );
  const microscopic = film.watch ? authored.microscopic : d.sample !== 'water';
  const label =
    d.sample === 'water'
      ? say('蒸馏水', 'Distilled water')
      : d.sample === 'nacl-solid'
        ? say('干燥氯化钠', 'Dry sodium chloride')
        : d.sample === 'kno3-solid'
          ? say('干燥硝酸钾', 'Dry potassium nitrate')
          : d.sample === 'nacl'
            ? say('氯化钠溶液', 'Sodium chloride solution')
            : say('硝酸钾溶液', 'Potassium nitrate solution');
  const note =
    d.sample === 'water'
      ? say(
          '检测灯不亮，也不等于电流严格为零。',
          'An unlit detector does not prove exactly zero current.',
        )
      : s.solid
        ? say(
            '晶体中已有离子，但它们不能自由移动。',
            'Ions already exist in the crystal, but cannot move freely.',
          )
        : !d.connected
          ? say(
              '溶解已经产生可移动离子，通电并不是电离的原因。',
              'Dissolution frees ions before the circuit is connected.',
            )
          : say(
              '阳离子与阴离子反向移动，共同传递电荷。',
              'Opposite ion motions both carry electric current.',
            );
  return (
    <section
      className="chem-ionic-conduction"
      data-watch={film.watch}
      data-micro={microscopic}
      data-sample={d.sample}
      data-connected={d.connected}
      data-current={s.currentMicroAmp}
    >
      <header>
        <p>{say('有离子，还要能够移动', 'Ions must also be mobile')}</p>
        <span>{label}</span>
      </header>
      <div className="chem-ionic-apparatus">
        <svg
          viewBox="0 0 460 310"
          role="img"
          aria-label={say(
            '电源、检测器和两根石墨电极组成闭合导电检测电路',
            'A power supply, detector and two graphite electrodes form a conductivity circuit',
          )}
        >
          <path
            d="M115 186V120M115 106V58H197M258 58H350V186"
            fill="none"
            stroke="#809588"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="228" cy="58" r="30" fill="#f7f1d7" stroke="#a1ad8e" strokeWidth="2" />
          <path d="M211 70Q228 43 245 70" stroke="#afbd9d" fill="none" />
          <path
            d={`M228 72L${228 + Math.sin(((-60 + Math.min(1, Math.abs(s.currentMicroAmp) / 450) * 120) * Math.PI) / 180) * 23} ${72 - Math.cos(((-60 + Math.min(1, Math.abs(s.currentMicroAmp) / 450) * 120) * Math.PI) / 180) * 23}`}
            stroke="#816c51"
            strokeWidth="2"
          />
          <circle cx="228" cy="72" r="3" fill="#816c51" />
          <path d="M109 106H121M103 120H127" stroke="#6c8a7e" strokeWidth="3" />
          <path d="M340 111H360" stroke="#6c8a7e" strokeWidth="3" />
          <rect x="105" y="158" width="20" height="92" rx="5" fill="#526e65" />
          <rect x="340" y="158" width="20" height="92" rx="5" fill="#526e65" />
          <path
            d="M77 170V263Q77 282 232 282T387 263V170"
            fill="#bed6c031"
            stroke="#a3bba8"
            strokeWidth="2"
          />
          {!s.solid && (
            <>
              <path d="M79 204V264Q79 280 232 280T385 264V204Z" fill="#a9d4c4" opacity=".28" />
              <ellipse cx="232" cy="204" rx="153" ry="13" fill="#b9dac7" opacity=".25" />
            </>
          )}
          {s.solid &&
            Array.from({ length: 35 }, (_, i) => (
              <rect
                key={i}
                x={98 + (i % 12) * 23}
                y={249 + Math.floor(i / 12) * 7}
                width="13"
                height="9"
                rx="1"
                fill="#e3e3cd"
                stroke="#cad1b9"
                transform={`rotate(${(i % 3) * 9} ${105 + (i % 12) * 23} ${254 + Math.floor(i / 12) * 7})`}
              />
            ))}
          <circle
            cx="285"
            cy="58"
            r="8"
            fill={s.detected ? '#d3b668' : '#b7bda8'}
            opacity={s.detected ? 1 : 0.4}
          />
          {!d.connected && (
            <>
              <path d="M311 58H329" stroke="#edf1df" strokeWidth="8" />
              <path d="M310 58L327 43" stroke="#809588" strokeWidth="3" />
            </>
          )}
        </svg>
        <div className="chem-ionic-reading">
          <strong>
            {s.detected
              ? say('检测到导电', 'Conduction detected')
              : say('低于灯的显示阈值', 'Below light indication threshold')}
          </strong>
          <span>
            {say('理想检测模型', 'Ideal detector model')} ·{' '}
            {Math.abs(s.currentMicroAmp).toFixed(d.sample === 'water' ? 3 : 1)} µA
          </span>
          <p>
            {say(
              '正负极通过溶液与外电路相连；图示为短时响应。',
              'The solution completes the external circuit; the picture represents a short-time response.',
            )}
          </p>
        </div>
      </div>
      {microscopic && (
        <div className="chem-ionic-closeup">
          <div className="chem-ionic-field-state">
            {say(
              d.connected ? '电路闭合' : '电路断开',
              d.connected ? 'Circuit closed' : 'Circuit open',
            )}
            <span>{Math.abs(s.currentMicroAmp).toFixed(1)} µA</span>
          </div>
          <svg
            viewBox="0 0 360 224"
            role="img"
            aria-label={say(
              '晶格离子解离后，正负离子在电场中向相反方向偏移',
              'After lattice dissociation, positive and negative ions drift in opposite directions',
            )}
          >
            <rect x="24" y="22" width="10" height="163" rx="4" fill="#6d897c" />
            <rect x="326" y="22" width="10" height="163" rx="4" fill="#6d897c" />
            <text x="29" y="207" textAnchor="middle" fill="#5e7a6d" fontSize="26">
              +
            </text>
            <text x="331" y="207" textAnchor="middle" fill="#5e7a6d" fontSize="26">
              −
            </text>
            {Array.from({ length: !s.solid && s.concentration === 0 ? 0 : 20 }, (_, i) => {
              const a = ionicParticle(i, d.dissolved, d.connected ? d.drift : 0);
              return (
                <g key={i} data-ion-id={i} data-charge={a.charge}>
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={a.charge > 0 ? 9 : 12}
                    fill={a.charge > 0 ? '#ba9470' : '#7daea3'}
                    stroke={a.charge > 0 ? '#9d7d5d' : '#5b8d81'}
                  />
                  <path
                    d={`M${a.x - 3} ${a.y}h6${a.charge > 0 ? `M${a.x} ${a.y - 3}v6` : ''}`}
                    stroke="#fff7de"
                    strokeWidth="1.5"
                  />
                  {d.dissolved > 0.8 && d.connected && (
                    <path
                      d={`M${a.x} ${a.y + 16}h${a.charge * 10}l${-a.charge * 3} -2m${a.charge * 3} 2l${-a.charge * 3} 2`}
                      stroke={a.charge > 0 ? '#a2805d' : '#5b8d81'}
                      opacity=".7"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          {!s.solid && s.concentration === 0 ? (
            <p className="chem-ionic-background">
              {say(
                '零盐浓度：只剩水的微弱电离背景。',
                'Zero salt: only water’s ionic background remains.',
              )}
            </p>
          ) : (
            <div className="chem-ionic-legend">
              <span>
                <i />
                {s.cation}
              </span>
              <span>
                <i />
                {s.anion}
              </span>
              <p>
                {say(
                  '局部短时间位移，未画出水分子和电极反应。',
                  'Local short-time displacement; water molecules and electrode reactions are omitted.',
                )}
              </p>
            </div>
          )}
        </div>
      )}
      {!film.watch && <p className="chem-ionic-cause">{note}</p>}
      {!film.watch && (
        <div className="chem-ionic-controls">
          <Segments
            label={say('检测样品', 'Test sample')}
            value={sample}
            onChange={setSample}
            options={[
              { value: 'nacl-solid', label: say('NaCl固体', 'NaCl solid') },
              { value: 'kno3-solid', label: say('KNO₃固体', 'KNO₃ solid') },
              { value: 'water', label: say('蒸馏水', 'Water') },
              { value: 'nacl', label: say('NaCl溶液', 'NaCl solution') },
              { value: 'kno3', label: say('KNO₃溶液', 'KNO₃ solution') },
            ]}
          />
          <Segments
            label={say('连接电路', 'Connect circuit')}
            value={field}
            onChange={setField}
            options={[
              { value: 'off', label: say('断开', 'Open') },
              { value: 'on', label: say('闭合', 'Closed') },
            ]}
          />
          {!s.solid && sample !== 'water' && (
            <>
              <Range
                label={say('模型盐浓度', 'Model salt concentration')}
                value={concentration}
                min={0}
                max={1}
                step={0.05}
                unit="mmol/L"
                onChange={setConcentration}
              />
              <Range
                label={say('微观观察进度', 'Microscopic observation progress')}
                value={progress}
                min={0}
                max={1}
                step={0.01}
                onChange={setProgress}
              />
            </>
          )}
        </div>
      )}
      <details>
        <summary>{say('电流数值意味着什么', 'What the current values mean')}</summary>
        <p>
          {say(
            '25°C无限稀释近似，电导池常数取1 cm⁻¹，电压3 V，检测阈值10 µA为教学设定。它不是教材灯泡的标定；真实读数受浓度、温度、电极极化和水样纯度影响。',
            'The model uses limiting ionic conductance at 25°C, cell constant 1 cm⁻¹ and 3 V. The 10 µA threshold is an illustrative detector setting, not calibration of the textbook bulb. Real measurements depend on concentration, temperature, polarization and water purity.',
          )}
        </p>
      </details>
    </section>
  );
}
