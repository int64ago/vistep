import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { coexistenceSchedule, summarizeRepeated } from '../../models/wireless-interference-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/wireless-interference-lab.css';
export default function WirelessInterferenceLab() {
  const film = useShowcase();
  const [scenario, setScenario] = useState('overlap'),
    [duty, setDuty] = useState(0.7),
    [measurements, setMeasurements] = useState('');
  const selected = film.watch
    ? ['baseline', 'overlap', 'adaptive', 'five', 'study'][Math.min(4, film.chapter)]
    : scenario;
  const schedule = coexistenceSchedule({
    bluetooth: selected !== 'baseline',
    adaptive: selected === 'adaptive',
    wifi5: selected === 'five',
    duty: film.watch ? 0.7 : duty,
    slots: film.watch ? Math.max(4, Math.floor(film.chapterProgress * 156) + 4) : 160,
  });
  const samples = measurements.trim()
      ? measurements
          .split(/[,，\s]+/)
          .map(Number)
          .filter(Number.isFinite)
      : [],
    summary = summarizeRepeated(samples);
  const names = {
    baseline: '蓝牙无传输',
    overlap: '共享2.4GHz',
    adaptive: '自适应跳频',
    five: 'Wi-Fi改用5GHz',
    study: '记录实际测量',
  };
  return (
    <div className="textbook-em wireless-interference-lab">
      <div className="textbook-em-state">
        <span>{t(names[selected as keyof typeof names])}</span>
        {selected !== 'study' && <span>{t('示意调度，不是网速测量')}</span>}
      </div>
      {selected === 'study' ? (
        <div className="wireless-study">
          <svg viewBox="0 0 360 122" role="img" aria-label={t('记录实际测量')}>
            <path d="M36 83H324" stroke="#dde3cf" fill="none" />
            <rect
              x="143"
              y="4"
              width="74"
              height="111"
              rx="12"
              fill="#cbd5bc"
              stroke="#8fa27e"
              strokeWidth="2"
            />
            <rect x="149" y="11" width="62" height="93" rx="7" fill="#f3f4e8" />
            <path
              d="M171 16H189M173 108H187"
              stroke="#abb99b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M166 45Q180 33 194 45M171 52Q180 44 189 52M176 59Q180 55 184 59"
              stroke="#8ca67a"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="180" cy="65" r="2.2" fill="#8ca67a" />
            <path d="M161 88H199" stroke="#ccd5ba" strokeWidth="2" strokeDasharray="4 4" />
            <path
              d="M64 57H117M243 57H296M68 51L62 57L68 63M292 51L298 57L292 63"
              stroke="#b29e6e"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div className="wireless-trials">
            <div>
              <span>{t('蓝牙无传输')}</span>
              <i />
              <i />
              <i />
            </div>
            <div>
              <span>{t('共享2.4GHz')}</span>
              <i />
              <i />
              <i />
            </div>
          </div>
          <p>
            {film.watch || !summary.count
              ? t('尚未输入实测数据')
              : `${t('均值')} ${summary.mean.toFixed(2)}`}
          </p>
        </div>
      ) : (
        <>
          <svg
            className="textbook-em-apparatus"
            viewBox="0 0 360 300"
            role="img"
            aria-label={t('Wi-Fi宽信道与蓝牙跳频在时间和频率上的交叠')}
          >
            <rect x="47" y="42" width="266" height="220" rx="11" fill="#f3f6e9" stroke="#d6e0ca" />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M47 ${42 + i * 55}H313`} stroke="#e0e7d7" />
            ))}
            {selected !== 'five' && (
              <rect
                x={47 + ((2427 - 2402) / 78) * 266}
                y="42"
                width={(20 / 78) * 266}
                height="220"
                fill="#c4d5b8"
                opacity=".4"
              />
            )}
            {schedule.events.map((e) => (
              <g key={e.slot}>
                {e.wifi && e.slot % 4 === 0 && (
                  <rect
                    x={selected === 'five' ? 320 : 47 + ((2427 - 2402) / 78) * 266}
                    y={43 + (e.slot / 160) * 216}
                    width={selected === 'five' ? 20 : (20 / 78) * 266}
                    height="2.7"
                    rx="1"
                    fill="#9dbb91"
                    opacity=".6"
                  />
                )}
                {e.active && (
                  <rect
                    x={47 + ((e.frequency - 2402) / 78) * 266 - 1.6}
                    y={43 + (e.slot / 160) * 216}
                    width="3.2"
                    height="2.5"
                    rx="1"
                    fill={e.collision ? '#b08b51' : '#819c87'}
                  />
                )}
              </g>
            ))}
            <text x="47" y="285">
              2402
            </text>
            <text x="267" y="285">
              2480
            </text>
            <text x="180" y="22" textAnchor="middle">
              MHz · {t('时间向下')}
            </text>
            {selected === 'five' && (
              <text className="em-small" x="330" y="36" textAnchor="middle">
                5G
              </text>
            )}
          </svg>
          <div className="textbook-em-meters">
            <span>
              {t('已模拟数据包')} <b>{schedule.packets.length}</b>
            </span>
            <span>
              {t('需重传')} <b>{schedule.lost}</b>
            </span>
            <span>
              {t('首次送达')} <b>{(schedule.relativeDelivery * 100).toFixed(0)}%</b>
            </span>
          </div>
        </>
      )}
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择无线对照')}
            value={scenario}
            onChange={setScenario}
            options={[
              { value: 'baseline', label: t('蓝牙无传输') },
              { value: 'overlap', label: t('共享2.4GHz') },
              { value: 'adaptive', label: t('自适应跳频') },
              { value: 'five', label: t('Wi-Fi改用5GHz') },
              { value: 'study', label: t('记录实际测量') },
            ]}
          />
          {scenario !== 'baseline' && scenario !== 'study' && (
            <Range
              label={t('蓝牙占用时隙比例')}
              value={duty}
              min={0}
              max={1}
              step={0.05}
              onChange={setDuty}
            />
          )}
          {scenario === 'study' && (
            <label className="control">
              <span className="control-top">{t('输入实际重复测速值，以逗号分隔')}</span>
              <input
                type="text"
                inputMode="decimal"
                value={measurements}
                onChange={(e) => setMeasurements(e.target.value)}
                style={{
                  minHeight: 44,
                  fontSize: 16,
                  padding: '10px',
                  border: '1px solid #c7d4bc',
                  borderRadius: 10,
                  background: '#f7f8ef',
                }}
              />
              <span>
                {summary.count
                  ? `${t('均值')} ${summary.mean.toFixed(2)} · ${t('样本标准差')} ${summary.spread.toFixed(2)}`
                  : t('尚未输入实测数据')}
              </span>
            </label>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('这项实验能说明什么')}</summary>
        {selected === 'study' && (
          <p>
            {t(
              '同地点、同服务器、相近时段，交替测量蓝牙传输前后；保留多次结果，检查平均值与波动。',
            )}
          </p>
        )}
        <p>
          {t(
            '这是确定性时频调度示意，采用经典蓝牙式79个1兆赫信道和20兆赫Wi-Fi信道，不完整模拟协议、射频功率或重传吞吐。标出的首次送达率不是设备网速预测。自适应跳频与设备共存机制可以减轻干扰；5GHz仅消除这里画出的同频碰撞。真实测速还受服务器、信号、负载和设备实现影响，单次差异不能直接证明因果。',
          )}
        </p>
      </details>
    </div>
  );
}
