import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  switchOn,
  switchOff,
  sensorRise,
  selfInductionShot,
} from '../../models/self-induction-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const coilPath = Array.from({ length: 241 }, (_, i) => {
  const q = i / 240;
  return `${i ? 'L' : 'M'}${89 + 74 * q + 4 * Math.cos(q * 16 * Math.PI)} ${104 + 19 * Math.sin(q * 16 * Math.PI)}`;
}).join(' ');
export default function SelfInductionLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [mode, setMode] = useState(film.variant?.includes('switch-off') ? 'off' : 'on'),
    [resistance, setResistance] = useState(2),
    [time, setTime] = useState(0.2),
    [inductance, setInductance] = useState(6),
    [sensor, setSensor] = useState('lamp');
  const initialMode = film.variant?.includes('switch-off') ? 'off' : 'on';
  const selected = film.watch ? initialMode : mode;
  const shot = film.watch
    ? selfInductionShot(film.chapter, film.chapterProgress)
    : { mode: selected, sensor: sensor === 'sensor', resistance, time, stage: -1 };
  const effectiveInductance = film.watch ? 6 : inductance;
  const on = switchOn(shot.time, effectiveInductance),
    off = switchOff(shot.time, shot.resistance, effectiveInductance);
  const isOn = shot.mode === 'on',
    closed = isOn || off.closed;
  const lamp = (x: number, y: number, power: number, label: string) => (
    <g>
      <circle cx={x} cy={y} r="29" fill={`url(#${id}-glow)`} opacity={Math.min(0.85, power / 10)} />
      <circle cx={x} cy={y} r="18" fill={power > 0.03 ? '#f5e8b5' : '#ebeee1'} stroke="#b7ab7b" />
      <path d={`M${x - 9} ${y + 9}l18-18m-18 0 18 18`} stroke="#b49b63" strokeWidth="2" />
      <text x={x + 37} y={y + 6}>
        {label}
      </text>
    </g>
  );
  const sensorGlyph = (x: number, y: number) => (
    <g>
      <circle cx={x} cy={y} r="18" fill="#edf1e4" stroke="#8ea782" />
      <text x={x} y={y + 6} textAnchor="middle">
        A
      </text>
    </g>
  );
  const graph = Array.from({ length: 181 }, (_, i) => {
    const q = i / 180,
      time = q * 4;
    const value = isOn
      ? sensorRise(time, effectiveInductance)
      : switchOff(time - 0.4, shot.resistance, effectiveInductance).iLoad;
    return `${i ? 'L' : 'M'}${28 + q * 304} ${isOn ? 95 - value * 85 : 40 - value * 22}`;
  }).join(' ');
  return (
    <div className="textbook-em self-induction-lab">
      <div className="textbook-em-state">
        <span>{t(isOn ? '通电时的两灯对照' : '断电后的闭合回路')}</span>
        <span>{isOn ? 'L = ' + effectiveInductance + ' H' : `rL = ${shot.resistance} Ω`}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 275"
        role="img"
        aria-label={t('自感线圈与灯泡的真实连接和电流方向')}
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#e8c96c" stopOpacity=".85" />
            <stop offset="1" stopColor="#e8c96c" stopOpacity="0" />
          </radialGradient>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8Z" fill="#7e9b73" />
          </marker>
        </defs>
        {isOn && !shot.sensor ? (
          <>
            <path
              d="M45 104H93M167 104H222M258 104H305V226H183M151 226H45V104M45 169H90M165 169H222M258 169H305"
              fill="none"
              stroke="#95a688"
              strokeWidth="2.5"
            />
            <path d={coilPath} stroke="#b28c51" strokeWidth="3" fill="none" />
            <rect x="92" y="157" width="73" height="24" rx="5" fill="#d9dfc9" stroke="#a1b08d" />
            <text x="128" y="174" textAnchor="middle">
              R
            </text>
            {lamp(240, 104, on.pCoil, 'A₁')}
            {lamp(240, 169, on.pControl, 'A₂')}
            <path d="M151 216v20M159 219v14M159 226H183" stroke="#9b9469" strokeWidth="3" />
            <rect x="231" y="217" width="40" height="18" rx="4" fill="#d9dfc9" stroke="#a1b08d" />
            <text x="128" y="65" textAnchor="middle">
              L
            </text>
            <text x="180" y="264" textAnchor="middle">
              E = 6 V · R₁ = 1 Ω
            </text>
          </>
        ) : isOn ? (
          <>
            <path
              d="M45 104H93M167 104H230V213H197M163 213H45V104"
              stroke="#95a688"
              strokeWidth="2.5"
              fill="none"
            />
            <path d={coilPath} stroke="#b28c51" strokeWidth="3" fill="none" />
            <rect x="217" y="135" width="26" height="48" rx="4" fill="#d9dfc9" stroke="#a1b08d" />
            {sensorGlyph(180, 213)}
            <path d="M35 150h20m-16 8h12" stroke="#9b9469" strokeWidth="3" />
            <text x="128" y="65" textAnchor="middle">
              L
            </text>
            <text x="180" y="264" textAnchor="middle">
              I = {sensorRise(shot.time, effectiveInductance).toFixed(3)} A
            </text>
          </>
        ) : (
          <>
            <path
              d="M44 104H93M167 104H305V168H243M207 168H44V104M44 168V234H151M183 234H246M278 234H305V168"
              fill="none"
              stroke="#95a688"
              strokeWidth="2.5"
            />
            <path d={coilPath} stroke="#b28c51" strokeWidth="3" fill="none" />
            {shot.sensor ? (
              <>
                <rect
                  x="200"
                  y="153"
                  width="50"
                  height="29"
                  rx="4"
                  fill="#d9dfc9"
                  stroke="#a1b08d"
                />
                <text x="225" y="173" textAnchor="middle">
                  R
                </text>
                {sensorGlyph(103, 168)}
              </>
            ) : (
              lamp(225, 168, off.loadPower, 'A')
            )}
            <path d="M151 223v22M159 227v14M159 234H183" stroke="#9b9469" strokeWidth="3" />
            <path
              d={closed ? 'M246 234H278' : 'M246 234l27-17'}
              stroke="#8d9d7c"
              strokeWidth="2.5"
            />
            <circle cx="246" cy="234" r="3" fill="#8d9d7c" />
            <circle cx="278" cy="234" r="3" fill="#8d9d7c" />
            <path
              d={closed ? 'M140 168h30' : 'M170 168h-30'}
              stroke="#7e9b73"
              strokeWidth="2.5"
              markerEnd={`url(#${id}-arrow)`}
              opacity={Math.min(1, Math.abs(off.iLoad) * 2)}
            />
            <path
              d="M180 104h29"
              stroke="#7e9b73"
              strokeWidth="2.5"
              markerEnd={`url(#${id}-arrow)`}
              opacity={Math.min(1, off.iCoil * 2)}
            />
            <text x="128" y="65" textAnchor="middle">
              L
            </text>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {!isOn ? t(closed ? '电源接通，电流已稳定' : '电源断开，线圈与灯泡仍闭合') : null}
      </p>
      <div className="textbook-em-meters">
        <span>
          {isOn ? 'I₁' : 'IL'}{' '}
          <b>
            {(isOn
              ? shot.sensor
                ? sensorRise(shot.time, effectiveInductance)
                : on.iCoil
              : off.iCoil
            ).toFixed(3)}{' '}
            A
          </b>
        </span>
        <span>
          {isOn ? 'I₂' : 'IA'}{' '}
          <b>{(isOn ? (shot.sensor ? 0.75 : on.iControl) : off.iLoad).toFixed(3)} A</b>
        </span>
      </div>
      {shot.sensor && (
        <svg
          className="textbook-em-chart"
          viewBox="0 0 360 125"
          role="img"
          aria-label={t('电流传感器的有符号测量曲线')}
        >
          <path d={`M28 ${isOn ? 95 : 40}H332`} stroke="#d4ddc8" />
          {isOn && <path d="M28 31.25H332" stroke="#b2bd9f" strokeDasharray="5 5" />}
          <path d={graph} stroke="#729575" strokeWidth="2.5" fill="none" />
          <path
            d={`M${28 + ((isOn ? Math.max(0, shot.time) : Math.max(0, shot.time + 0.4)) / 4) * 304} 10v100`}
            stroke="#adba9d"
            strokeDasharray="3 4"
          />
          <text x="10" y="20">
            I
          </text>
          <text x="330" y="120">
            t
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择自感电路')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'on', label: t('通电时的两灯对照') },
              { value: 'off', label: t('断电后的闭合回路') },
            ]}
          />
          <Segments
            label={t('观察方式')}
            value={sensor}
            onChange={setSensor}
            options={[
              { value: 'lamp', label: t('观察灯泡') },
              { value: 'sensor', label: t('电流传感器') },
            ]}
          />
          <Range
            label={t('开关动作后的时间')}
            value={time}
            min={mode === 'off' ? -0.2 : 0}
            max={4}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Range
            label={t('线圈自感系数')}
            value={inductance}
            min={0.5}
            max={10}
            step={0.5}
            unit="H"
            onChange={setInductance}
          />
          {mode === 'off' && (
            <Range
              label={t('线圈直流电阻')}
              value={resistance}
              min={1}
              max={12}
              step={0.5}
              unit="Ω"
              onChange={setResistance}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('灯泡简化与能量去向')}</summary>
        <p>
          {t(
            '灯泡以6欧固定电阻近似，亮度由电功率映射，不模拟灯丝温度滞后。通电对照的线圈电阻与可调电阻均为2欧，公共电阻1欧，已调至稳态等亮。断电电路中线圈电流连续，灯泡电流反向；只有线圈电阻足够小时才会闪亮。储存的磁场能最终耗散在线圈和灯泡中。',
          )}
        </p>
      </details>
    </div>
  );
}
