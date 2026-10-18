import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  phonePower,
  phoneEnergy,
  changedPhoneFactors,
  type PhoneTrial,
  type PhoneTask,
} from '../../models/phone-energy-research';
import '../../styles/phone-energy-research.css';
const base: PhoneTrial = { task: 'video', brightness: 0.3, volume: 0.2, radioFactor: 1 };
const tasks: [PhoneTask, string][] = [
  ['browse', '上网浏览'],
  ['chat', '网络聊天'],
  ['call', '主叫电话'],
  ['video', '视频播放'],
  ['audio', '录音重放'],
  ['game', '网络游戏'],
];
export default function PhoneEnergyResearch() {
  const film = useShowcase(),
    [task, setTask] = useState<PhoneTask>('video'),
    [brightness, setBrightness] = useState(0.8),
    [volume, setVolume] = useState(0.2),
    [radioFactor, setRadioFactor] = useState(1),
    [seconds, setSeconds] = useState(300),
    [records, setRecords] = useState<{ trial: PhoneTrial; seconds: number; delta: number }[]>([]),
    c = film.chapter,
    p = film.chapterProgress,
    a: PhoneTrial = film.watch && c === 2 ? { ...base, task: 'browse' } : base,
    b: PhoneTrial = film.watch
      ? c === 0
        ? { ...base, brightness: 0.8 }
        : c === 1
          ? { ...base, volume: 1 }
          : c === 2
            ? { ...base, task: 'game' }
            : { ...base, brightness: 0.8, radioFactor: 3 }
      : { task, brightness, volume, radioFactor },
    duration = film.watch ? (c === 3 ? 10 + 290 * p : 300 * p) : seconds,
    ea = phoneEnergy(a, duration),
    eb = phoneEnergy(b, duration),
    power = phonePower(b, duration),
    factors = changedPhoneFactors(a, b),
    caption = film.watch
      ? c === 0
        ? '只改变屏幕亮度，保持内容与时间相同'
        : c === 1
          ? '音量对照需要相同的有声内容'
          : c === 2
            ? '比较应用任务时，固定亮度、音量和网络条件'
            : '亮度和网络同时改变，差异不能只归因于亮度'
      : '先检查改变了几个因素，再解释能量差';
  return (
    <section className="pe-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="pe-kicker">{t(caption)}</p>
      <p className="pe-synthetic">{t('合成教学数据 · 不代表任何实际手机')}</p>
      <svg
        viewBox="0 0 400 365"
        className="pe-apparatus"
        role="img"
        aria-label={t('同一部模型手机的组件分解：屏幕、处理器、无线电、扬声器和电池')}
      >
        <rect
          x="101"
          y="11"
          width="198"
          height="341"
          rx="30"
          fill="#d7dfc8"
          stroke="#aebf9c"
          strokeWidth="2"
        />
        <rect x="113" y="26" width="174" height="158" rx="17" fill="#a3b58f" />
        <rect
          x="119"
          y="32"
          width="162"
          height="146"
          rx="13"
          fill="#ecedd7"
          opacity={0.25 + 0.75 * b.brightness}
        />
        <path d="M178 34h44" stroke="#8fa180" strokeWidth="5" strokeLinecap="round" />
        {b.task === 'video' || b.task === 'game' ? (
          <>
            <rect x="130" y="61" width="140" height="83" rx="9" fill="#b9c8a7" />
            <path
              d={b.task === 'video' ? 'M187 81l27 21-27 21Z' : 'M147 115l26-33 29 25 27-18 25 30'}
              fill={b.task === 'video' ? '#e0e6ca' : 'none'}
              stroke="#dce3c5"
              strokeWidth="4"
            />
          </>
        ) : b.task === 'audio' || b.task === 'call' ? (
          <path
            d={`M135 105${Array.from({ length: 12 }, (_, i) => `l5 ${Math.sin(i * 1.5) * 18} 5 ${-Math.sin(i * 1.5) * 18}`).join('')}`}
            stroke="#aab991"
            strokeWidth="3"
            fill="none"
          />
        ) : (
          <>
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={132 + (i % 2) * 15}
                y={65 + i * 26}
                width={100 - i * 10}
                height="15"
                rx="7"
                fill="#b4c39f"
              />
            ))}
          </>
        )}
        <rect x="128" y="207" width="90" height="108" rx="13" fill="#bccba8" />
        <path d="M160 207v-5h26v5" fill="#acbd96" />
        <rect
          x="137"
          y="222"
          width="72"
          height={Math.max(0, Math.min(1, eb.remaining / 100)) * 80}
          rx="8"
          fill="#d8e2c4"
        />
        <text x="173" y="279" textAnchor="middle">
          {eb.percentDisplay}%
        </text>
        <rect x="240" y="211" width="31" height="40" rx="5" fill="#9dad88" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M235 ${218 + i * 8}h5m31 0h5`} stroke="#bba777" strokeWidth="2" />
        ))}
        <path
          d="M242 276q13-17 27 0m-23 7q9-11 19 0m-14 7q4-4 9 0"
          stroke="#9eaf8b"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M165 333h70"
          stroke="#9cac89"
          strokeWidth="7"
          strokeDasharray="2 4"
          strokeLinecap="round"
        />
        <path
          d="M218 233h22M218 272h12v10h12M173 315v15M128 235h-8v-39h80v-12"
          stroke="#b39c6b"
          strokeWidth="2"
          fill="none"
        />
        {[
          { x: 228, y: 233, value: power.cpu },
          { x: 232, y: 282, value: power.radio },
          { x: 173, y: 325, value: power.audio },
          { x: 200, y: 190, value: power.display },
        ].map((q, i) => (
          <circle
            key={i}
            cx={q.x}
            cy={q.y}
            r={2 + 3 * Math.sqrt(q.value / 3)}
            fill="#c6aa6d"
            opacity={0.25 + Math.min(0.6, q.value / 3)}
          />
        ))}
      </svg>
      <div className="pe-power">
        <span>
          {t('屏幕')} {power.display.toFixed(2)} W
        </span>
        <span>
          {t('处理器')} {power.cpu.toFixed(2)} W
        </span>
        <span>
          {t('无线电')} {power.radio.toFixed(2)} W
        </span>
        <span>
          {t('声音')} {power.audio.toFixed(2)} W
        </span>
      </div>
      <div className="pe-comparison">
        <div>
          <b>A</b>
          <span>{t(tasks.find((x) => x[0] === a.task)![1])}</span>
          <strong>{ea.wattHours.toFixed(3)} Wh</strong>
          <small>
            {Math.round(a.brightness * 100)}% · {Math.round(a.volume * 100)}% ·{' '}
            {a.radioFactor.toFixed(1)}×
          </small>
        </div>
        <div>
          <b>B</b>
          <span>{t(tasks.find((x) => x[0] === b.task)![1])}</span>
          <strong>{eb.wattHours.toFixed(3)} Wh</strong>
          <small>
            {Math.round(b.brightness * 100)}% · {Math.round(b.volume * 100)}% ·{' '}
            {b.radioFactor.toFixed(1)}×
          </small>
        </div>
      </div>
      <p className="pe-caption">
        {t('依次为亮度、音量、网络负载倍率；同一手机、同一时长')} {duration.toFixed(0)} s
      </p>
      <p className="pe-conclusion">
        {t('改变因素数')} {factors.length} · ΔE = {(eb.joules - ea.joules).toFixed(1)} J
      </p>
      {!film.watch && (
        <div className="pe-controls">
          <Segments
            label={t('B 次实验任务')}
            value={task}
            onChange={setTask}
            options={tasks.map(([value, label]) => ({ value, label: t(label) }))}
          />
          <Range
            label={t('B 次屏幕亮度')}
            value={brightness}
            min={0}
            max={1}
            step={0.1}
            unit=""
            onChange={setBrightness}
          />
          <Range
            label={t('B 次音量')}
            value={volume}
            min={0}
            max={1}
            step={0.1}
            unit=""
            onChange={setVolume}
          />
          <Range
            label={t('B 次网络负载倍率')}
            value={radioFactor}
            min={1}
            max={3}
            step={0.5}
            unit="×"
            onChange={setRadioFactor}
          />
          <Range
            label={t('两次相同测量时长')}
            value={seconds}
            min={0}
            max={900}
            step={10}
            unit="s"
            onChange={setSeconds}
          />
          <button
            type="button"
            onClick={() =>
              setRecords([
                ...records.slice(-4),
                { trial: { ...b }, seconds, delta: eb.joules - ea.joules },
              ])
            }
          >
            {t('记录这次合成对照')}
          </button>
        </div>
      )}
      {records.length > 0 && !film.watch && (
        <ol className="pe-records">
          {records.map((record, i) => (
            <li key={i}>
              {i + 1}. {t(tasks.find((x) => x[0] === record.trial.task)![1])} · {record.seconds} s ·
              ΔE = {record.delta.toFixed(1)} J<br />
              {t('亮度 / 音量 / 网络')} {record.trial.brightness.toFixed(1)} /{' '}
              {record.trial.volume.toFixed(1)} / {record.trial.radioFactor.toFixed(1)}
            </li>
          ))}
        </ol>
      )}
      <details className="pe-details">
        <summary>{t('从演示转成真实研究')}</summary>
        <p>
          {t(
            '本片功率档案全部为合成教学参数，应用任务不是实测耗电排名。真实研究应固定同一设备、相同内容与时长、网络和起始状态，分次只改变一个因素，再重复比较；耗能由功率随时间积分。整数电量百分比会掩盖小差异，不能把它当作精确能量计。处理器与无线电用周期性负载示意，容量取 15 Wh，组件布局不是某型号拆机图。',
          )}
        </p>
      </details>
    </section>
  );
}
