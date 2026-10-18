import { useId, useMemo, useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  capacitorSharing,
  capacitorFilmState,
  dischargeState,
  sensorSamples,
} from '../../models/capacitor-current-lab';
import '../../styles/capacitor-current-lab.css';
function Capacitor({
  x,
  y,
  id,
  label,
  voltage,
}: {
  x: number;
  y: number;
  id: string;
  label: string;
  voltage: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-12 41V65M12 41V65" stroke="#99a398" strokeWidth="3" />
      <path d="M-27 -28V36A27 8 0 0 0 27 36V-28" fill={`url(#${id}-can)`} stroke="#80908b" />
      <ellipse cy="-28" rx="27" ry="8" fill="#bcc7b7" stroke="#8b9e93" />
      <path d="M12 -28V39" stroke="#d3d8b7" strokeWidth="8" opacity=".8" />
      <path d="M-18 51h10m-5-5v10M8 51h10" stroke="#a29160" strokeWidth="1.4" />
      <text x="-10" y="11" textAnchor="middle">
        {label}
      </text>
      <path
        d="M-22 -15V25"
        stroke="#f0d184"
        strokeWidth="3"
        strokeLinecap="round"
        opacity={voltage / 6}
      />
    </g>
  );
}
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-can`}>
        <stop stopColor="#859f96" />
        <stop offset=".4" stopColor="#b9c9b4" />
        <stop offset="1" stopColor="#7e978e" />
      </linearGradient>
    </defs>
  );
}
function SensorCircuit({
  id,
  time,
  capacitance,
  resistance,
  closed = true,
}: {
  id: string;
  time: number;
  capacitance: number;
  resistance: number;
  closed?: boolean;
}) {
  const s = dischargeState(time, capacitance, resistance);
  return (
    <>
      <svg
        className="capcurrent-apparatus"
        viewBox="0 0 440 210"
        role="img"
        aria-label={t('已充电的电容器经过开关、电流传感器与电阻放电')}
        data-switch={closed ? 'closed' : 'open'}
      >
        <Defs id={id} />
        <ellipse cx="216" cy="188" rx="181" ry="10" fill="#6f8d7c" opacity=".07" />
        <path
          d="M88 175H45V40H159M190 40H250M310 40H350V77M350 123V175H112"
          fill="none"
          stroke="#94a897"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="159" cy="40" r="3" fill="#819783" />
        <circle cx="190" cy="40" r="3" fill="#819783" />
        <path
          d={closed ? 'M159 40H190' : 'M159 40L184 25'}
          fill="none"
          stroke="#a5986e"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Capacitor x={100} y={110} id={id} label="C" voltage={s.voltage} />
        <rect x="250" y="18" width="60" height="44" rx="12" fill="#e1e9d6" stroke="#9eaf94" />
        <circle cx="280" cy="40" r="15" fill="#f3f3df" />
        <text x="280" y="47" textAnchor="middle">
          I
        </text>
        <rect x="342" y="77" width="16" height="46" rx="5" fill="#d1c69f" stroke="#9e9d7b" />
        <path d="M342 86H358M342 113H358" stroke="#b19468" strokeWidth="3" />
        {closed && (
          <path
            d="M215 35l8 5-8 5"
            fill="none"
            stroke="#a99a6f"
            strokeWidth="2"
            opacity={Math.max(0.15, s.current / 0.003)}
          />
        )}
      </svg>
      <div className="capcurrent-readout">
        <span>
          {t('传感器电流')} <b>{((closed ? s.current : 0) * 1000).toFixed(2)} mA</b>
        </span>
        <span>
          U <b>{s.voltage.toFixed(2)} V</b>
        </span>
      </div>
    </>
  );
}
function CurrentPlot({
  time,
  capacitance,
  resistance,
  showArea,
}: {
  time: number;
  capacitance: number;
  resistance: number;
  showArea: boolean;
}) {
  const data = useMemo(
      () => sensorSamples(time, capacitance, resistance),
      [time, capacitance, resistance],
    ),
    points = data.samples
      .map((s) => `${48 + (s.time / 8) * 350},${166 - (s.current / 0.006) * 128}`)
      .join(' '),
    last = data.samples[data.samples.length - 1],
    cursor = 48 + (time / 8) * 350;
  return (
    <div className="capcurrent-plot">
      <div className="capcurrent-axis-title">I / mA</div>
      <svg
        viewBox="0 0 440 210"
        role="img"
        aria-label={t('电流随时间下降的曲线，阴影面积等于释放的电荷')}
      >
        <path d="M48 28V166H405" fill="none" stroke="#aebaa4" strokeWidth="1.5" />
        {[0, 3, 6].map((v) => (
          <g key={v}>
            <path
              d={`M48 ${166 - (v / 0.006 / 1000) * 128}H404`}
              stroke="#dce3d0"
              strokeWidth="1"
            />
            <text x="33" y={172 - (v / 6) * 128} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {[0, 4, 8].map((v) => (
          <text key={v} x={48 + (v / 8) * 350} y="193" textAnchor="middle">
            {v}
          </text>
        ))}
        {showArea && (
          <polygon points={`48,166 ${points} ${cursor},166`} fill="#d8c99c" opacity=".45" />
        )}
        <polyline
          points={points}
          fill="none"
          stroke="#839e8c"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d={`M${cursor} ${166 - (last.current / 0.006) * 128}V166`}
          stroke="#b5ab84"
          strokeWidth="1.4"
          strokeDasharray="4 4"
        />
        <circle cx={cursor} cy={166 - (last.current / 0.006) * 128} r="4" fill="#a99161" />
        <text x="433" y="193" textAnchor="end">
          s
        </text>
      </svg>
      {showArea && (
        <div className="capcurrent-integral">
          <span className="capcurrent-area-label">{t('曲线下面积')}</span>
          <strong>∫I dt = {(data.integrated * 1000).toFixed(2)} mC</strong>
          <span>
            {t('仍留在电容器中')} {(last.remainingCharge * 1000).toFixed(2)} mC
          </span>
        </div>
      )}
    </div>
  );
}
function Sharing({ id, progress, round }: { id: string; progress: number; round: 1 | 2 }) {
  const s = capacitorSharing(progress, round);
  return (
    <>
      <svg
        className="capcurrent-apparatus"
        viewBox="0 0 440 260"
        role="img"
        aria-label={t('两个相同电容器通过开关并联分电，第二次换入新的空电容器')}
      >
        <Defs id={id} />
        <path
          d="M103 165H66V40H190M225 40H276V165H303M127 165V190H327V165"
          fill="none"
          stroke="#94a897"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="190" cy="40" r="3" fill="#819783" />
        <circle cx="225" cy="40" r="3" fill="#819783" />
        <path
          d={s.connected ? 'M190 40H225' : 'M190 40L219 23'}
          fill="none"
          stroke="#a5986e"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Capacitor x={115} y={100} id={id} label="A" voltage={s.a} />
        <Capacitor x={315} y={100} id={id} label={round === 1 ? 'B' : 'C'} voltage={s.b} />
        <text x="115" y="226" textAnchor="middle">
          {s.a.toFixed(2)} V
        </text>
        <text x="315" y="226" textAnchor="middle">
          {s.b.toFixed(2)} V
        </text>
      </svg>
      <div className="capcurrent-charge">
        <span>
          Qₐ <b>{(s.chargeA * 1000).toFixed(2)} mC</b>
        </span>
        <span>
          {round === 1 ? 'Qᵦ' : 'Q꜀'} <b>{(s.chargeB * 1000).toFixed(2)} mC</b>
        </span>
      </div>
      <div className="capcurrent-sharing-state">
        {t(s.connected ? '开关闭合，电荷重新分配' : '开关断开，各自保留电荷')}
      </div>
      {round === 2 && (
        <div className="capcurrent-previous">
          <span>{t('上一只 B 已移走')}</span>
          <b>3.00 V · 3.00 mC</b>
          <span>{t('这次接入新的空电容器 C')}</span>
        </div>
      )}
    </>
  );
}
export default function CapacitorCurrentLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState<string | null>(null),
    [time, setTime] = useState(3),
    [capacitance, setCapacitance] = useState(1000),
    [resistance, setResistance] = useState(2000),
    [area, setArea] = useState(true),
    [round, setRound] = useState<string | null>(null),
    [progress, setProgress] = useState(0);
  const c = film.chapter,
    director = capacitorFilmState(c, film.chapterTime, browserLocale()),
    exploreMode = mode ?? (c < 2 ? 'sensor' : 'sharing'),
    exploreRound = round ?? (c === 3 ? '2' : '1'),
    active = film.watch ? (c < 2 ? 'sensor' : 'sharing') : exploreMode,
    timer = film.watch ? director.physicalTime : time,
    cap = film.watch ? 0.001 : capacitance / 1e6,
    r = film.watch ? 2000 : resistance,
    showArea = film.watch ? c === 1 : area,
    shareProgress = film.watch ? director.sharingProgress : progress,
    shareRound = (film.watch ? director.sharingRound : Number(exploreRound)) as 1 | 2;
  return (
    <section
      className="capcurrent-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
      data-plot-view={director.plotView}
    >
      <p className="capcurrent-kicker">
        {t(
          active === 'sensor'
            ? showArea
              ? '每一小条电流面积，都是流过的一小份电荷'
              : '开关闭合后，跟踪同一次放电'
            : '把同一只电容器，依次接到新的空电容器上',
        )}
      </p>
      {active === 'sensor' ? (
        <div className="capcurrent-sensor">
          <div className="capcurrent-circuit">
            <SensorCircuit
              id={id}
              time={timer}
              capacitance={cap}
              resistance={r}
              closed={!film.watch || director.dischargeClosed}
            />
          </div>
          <CurrentPlot time={timer} capacitance={cap} resistance={r} showArea={showArea} />
        </div>
      ) : (
        <Sharing id={id} progress={shareProgress} round={shareRound} />
      )}
      <div className="capcurrent-note">
        {t(
          active === 'sensor'
            ? '有限时间后仍有电荷留下；曲线尾部继续趋近零。'
            : '两个电容器相同；电荷守恒，但电场能不守恒。',
        )}
      </div>
      {!film.watch && (
        <div className="capcurrent-controls">
          <Segments
            label={t('选择电容测量实验')}
            value={exploreMode}
            onChange={setMode}
            options={[
              { value: 'sensor', label: t('电流与面积') },
              { value: 'sharing', label: t('依次分电') },
            ]}
          />
          {exploreMode === 'sensor' ? (
            <>
              <Range
                label={t('放电时间')}
                value={time}
                min={0}
                max={8}
                step={0.05}
                unit="s"
                onChange={setTime}
              />
              <Range
                label={t('电容')}
                value={capacitance}
                min={500}
                max={2000}
                step={100}
                unit="μF"
                onChange={setCapacitance}
              />
              <Range
                label={t('放电电阻')}
                value={resistance}
                min={1000}
                max={5000}
                step={100}
                unit="Ω"
                onChange={setResistance}
              />
              <button type="button" aria-pressed={area} onClick={() => setArea(!area)}>
                {t('显示电流积分面积')}
              </button>
            </>
          ) : (
            <>
              <Segments
                label={t('分电轮次')}
                value={exploreRound}
                onChange={(v) => {
                  setRound(v);
                  setProgress(0);
                }}
                options={[
                  { value: '1', label: t('第一次：A 接 B') },
                  { value: '2', label: t('第二次：A 接 C') },
                ]}
              />
              <Range
                label={t('闭合 → 平衡 → 断开')}
                value={progress * 100}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => setProgress(v / 100)}
              />
            </>
          )}
        </div>
      )}
      <details className="capcurrent-details">
        <summary>{t('传感器、积分和分电的条件')}</summary>
        <p>
          {t(
            '放电采用理想 RC 指数模型，传感器内阻忽略。面积用每 0.05 秒采样的梯形积分计算，并与 CΔU 独立对照。分电使用相同电容器和微小连接电阻，最后电压相同；少掉的电场能转为连接过程中的热等能量。色带与示数是模型辅助，忽略漏电、介质吸收和仪器误差。',
          )}
        </p>
      </details>
    </section>
  );
}
