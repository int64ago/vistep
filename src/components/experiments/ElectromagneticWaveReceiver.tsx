import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { EM_C, sparkPacket, receiverIndication } from '../../models/electromagnetic-wave-receiver';
import '../../styles/electromagnetic-wave-receiver.css';
export default function ElectromagneticWaveReceiver() {
  const film = useShowcase(),
    [distance, setDistance] = useState(8),
    [time, setTime] = useState(90),
    [enabled, setEnabled] = useState(true),
    c = film.chapter,
    p = film.chapterProgress,
    r = film.watch ? (c === 1 ? 4 + 8 * p : 8) : distance,
    clock = film.watch
      ? c === 0
        ? 240 * p
        : c === 1
          ? (r / EM_C) * 1e9 + 65
          : 120 + 200 * p
      : time,
    on = film.watch ? true : enabled,
    s = receiverIndication(clock, r, on),
    source = sparkPacket(clock),
    ry = 235 + 7 * (r - 4),
    meter = Math.min(1, s.response / 0.65),
    angle = -0.85 + meter * 1.7,
    label = film.watch
      ? c === 0
        ? '发射变化先发生，接收响应要等待传播'
        : c === 1
          ? '对齐同一脉冲时刻，距离越远响应越弱'
          : '源停止放电后，已发出的波仍继续传播'
      : '改变距离或观察时刻，追踪同一个发射脉冲';
  return (
    <section className="er-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="er-kicker">{t(label)}</p>
      <svg
        viewBox="0 0 400 370"
        className="er-apparatus"
        role="img"
        aria-label={t('两组平行铜管组成发射和接收天线，接收表含整流检波示意')}
      >
        <rect x="155" y="5" width="90" height="37" rx="12" fill="#c6cfb2" />
        <text x="200" y="31" textAnchor="middle">
          G
        </text>
        <path d="M175 42v20h9v18M225 42v20h-9v18" stroke="#9eaf91" strokeWidth="2" fill="none" />
        <path d="M40 80H190M210 80H360" stroke="#bca16f" strokeWidth="8" strokeLinecap="round" />
        <circle cx="190" cy="80" r="6" fill="#b5a17b" />
        <circle cx="210" cy="80" r="6" fill="#b5a17b" />
        <path
          d="M85 85v30M315 85v30M69 118h32M299 118h32"
          stroke="#b7c7a9"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {on && source.envelope > 0 && (
          <>
            <ellipse
              cx="200"
              cy="80"
              rx="18"
              ry="10"
              fill="#d4bd87"
              opacity={source.envelope * 0.4}
            />
            <path
              d="M191 80l5-3 5 6 5-6 4 3"
              stroke="#d5bc7f"
              strokeWidth="2"
              fill="none"
              opacity={source.envelope}
            />
          </>
        )}
        <text x="50" y="65">
          A
        </text>
        <text x="340" y="65">
          B
        </text>
        {Array.from({ length: 18 }, (_, i) => {
          const d = (r * (i + 1)) / 19,
            y = 112 + ((ry - 148) * (i + 1)) / 19,
            e = on ? sparkPacket(clock - (d / EM_C) * 1e9).field : 0;
          return (
            <path
              key={i}
              d={`M${200 - 35 * e} ${y}h${70 * e}`}
              stroke="#9dae8d"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={Math.abs(e) * 0.8}
            />
          );
        })}
        <path d={`M374 82h8v${ry - 82}h-8`} fill="none" stroke="#b3c0a1" strokeWidth="1.2" />
        <path
          d={`M40 ${ry}H172M228 ${ry}H360`}
          stroke="#bca16f"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M85 ${ry + 5}v32m-16 3h32M315 ${ry + 5}v32m-16 3h32`}
          stroke="#b7c7a9"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="200" cy={ry} r="28" fill="#edf1df" stroke="#b0bea0" />
        <path d={`M179 ${ry - 5}Q200 ${ry - 28} 221 ${ry - 5}`} stroke="#c0caad" fill="none" />
        <path
          d={`M200 ${ry + 8}L${200 + 23 * Math.sin(angle)} ${ry + 8 - 23 * Math.cos(angle)}`}
          stroke="#aa9164"
          strokeWidth="2.2"
        />
        <circle cx="200" cy={ry + 8} r="2.5" fill="#aa9164" />
        <text x="200" y={ry + 25} textAnchor="middle">
          RF
        </text>
        <text x="50" y={ry - 17}>
          C
        </text>
        <text x="340" y={ry - 17}>
          D
        </text>
      </svg>
      <div className="er-readings">
        <span>r = {r.toFixed(1)} m</span>
        <span>
          {t('传播延迟')} {s.delay.toFixed(1)} ns
        </span>
        <span>
          {t('检波相对示数')} {s.response.toFixed(3)}
        </span>
      </div>
      <p className="er-subtitle">
        {t('时间放慢；铜管与间距分别放大。场线段显示极性与到达，不按真实振幅缩放。')}
      </p>
      {!film.watch && (
        <div className="er-controls">
          <Range
            label={t('两天线距离')}
            value={distance}
            min={4}
            max={12}
            step={0.5}
            unit="m"
            onChange={setDistance}
          />
          <Range
            label={t('发射后的观察时刻')}
            value={time}
            min={0}
            max={360}
            step={1}
            unit="ns"
            onChange={setTime}
          />
          <Segments
            label={t('是否发射这个脉冲')}
            value={enabled ? 'yes' : 'no'}
            onChange={(v) => setEnabled(v === 'yes')}
            options={[
              { value: 'yes', label: t('发射脉冲') },
              { value: 'no', label: t('无发射对照') },
            ]}
          />
        </div>
      )}
      <details className="er-details">
        <summary>{t('接收仪表与远场模型')}</summary>
        <p>
          {t(
            '教材没有给出电流表内部结构。这里用平方律检波与平滑响应解释相对示数，不能把裸直流表当成能直接读出高频交变电流的仪器。保持两天线平行，只在理想辐射远场比较 E 随 1/r、检波示数随 1/r² 的变化；忽略近场、反射、多径、频率响应和天线失谐。火花用有限时长的示意射频波包代替，不声称复原赫兹的历史仪器。',
          )}
        </p>
      </details>
    </section>
  );
}
