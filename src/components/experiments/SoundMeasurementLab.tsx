import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  syntheticSound,
  estimateSoundFrequency,
  waveformWindow,
  equalTimeCycles,
  lakeSoundMeasurement,
  type SoundClip,
} from '../../models/sound-measurement-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function SoundMeasurementLab() {
  const film = useShowcase(),
    uid = useId().replace(/:/g, ''),
    root = useRef<HTMLDivElement>(null),
    [mode, setMode] = useState(film.variant === 'e1-geneva-lake-sound' ? 1 : 0),
    [a, setA] = useState<SoundClip>(() => syntheticSound(264)),
    [b, setB] = useState<SoundClip>(() => syntheticSound(396)),
    [cycles, setCycles] = useState(10),
    [distance, setDistance] = useState(14),
    [delay, setDelay] = useState(10),
    [elapsed, setElapsed] = useState(6),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false),
    resources = useRef<{
      stream?: MediaStream;
      context?: AudioContext;
      timer?: ReturnType<typeof setTimeout>;
    }>({}),
    generation = useRef(0),
    stage = film.watch ? film.chapter : mode === 0 ? 2 : 5,
    p = film.chapterProgress,
    lake = stage >= 3,
    defaultA = useMemo(() => syntheticSound(264), []),
    defaultB = useMemo(() => syntheticSound(396), []),
    first = film.watch ? defaultA : a,
    second = film.watch ? defaultB : b,
    count = film.watch ? (stage === 2 ? 10 : 5) : cycles,
    comparison = equalTimeCycles(first.frequency ?? 264, second.frequency ?? 396, count),
    duration = Math.min(
      comparison.seconds,
      (first.samples.length - 1) / first.sampleRate,
      (second.samples.length - 1) / second.sampleRate,
    ),
    lineA = useMemo(() => waveformWindow(first, duration), [first, duration]),
    lineB = useMemo(() => waveformWindow(second, duration), [second, duration]),
    measurement = lakeSoundMeasurement(
      film.watch ? 14000 : distance * 1000,
      film.watch ? 10 : delay,
    ),
    time = film.watch ? (stage === 3 ? p * 0.5 : stage === 4 ? 0.5 + p * 9.5 : 10) : elapsed,
    front = Math.min(1.15, (time + measurement.lightTime) / measurement.soundTime),
    arrived = time >= measurement.delay;
  const stop = () => {
    generation.current++;
    if (resources.current.timer) clearTimeout(resources.current.timer);
    resources.current.stream?.getTracks().forEach((track) => track.stop());
    void resources.current.context?.close().catch(() => {});
    resources.current = {};
  };
  useEffect(() => () => stop(), []);
  useEffect(() => {
    const halt = () => {
      stop();
      setBusy(false);
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) halt();
    });
    if (root.current) observer.observe(root.current);
    const visibility = () => {
      if (document.hidden) halt();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    stop();
    setBusy(false);
    setStatus('');
  }, [film.watch, mode]);
  const capture = async (which: 'a' | 'b') => {
    stop();
    const token = generation.current;
    setBusy(true);
    setStatus('等待麦克风，随后采集短片段');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unavailable');
      const context = new AudioContext();
      resources.current.context = context;
      await context.resume();
      if (token !== generation.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      if (token !== generation.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      resources.current.stream = stream;
      const node = context.createMediaStreamSource(stream),
        analyser = context.createAnalyser();
      analyser.fftSize = 16384;
      node.connect(analyser);
      setStatus('正在采集，请保持一个音');
      resources.current.timer = setTimeout(() => {
        if (token !== generation.current) return;
        const samples = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(samples);
        const estimate = estimateSoundFrequency(samples, context.sampleRate),
          clip: SoundClip = {
            samples,
            sampleRate: context.sampleRate,
            source: 'microphone',
            frequency: estimate?.frequency ?? null,
          };
        (which === 'a' ? setA : setB)(clip);
        stop();
        setBusy(false);
        setStatus(estimate ? '采集完成，波形保存在本页' : '未识别稳定音高，仍可观察实际波形');
      }, 650);
    } catch {
      if (token === generation.current) {
        stop();
        setBusy(false);
        setStatus('麦克风不可用，可继续使用合成示例');
      }
    }
  };
  const listen = async (clip: SoundClip) => {
    stop();
    try {
      const context = new AudioContext();
      resources.current.context = context;
      await context.resume();
      const buffer = context.createBuffer(1, clip.samples.length, clip.sampleRate);
      buffer.copyToChannel(Float32Array.from(clip.samples), 0);
      const source = context.createBufferSource(),
        gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0.15;
      source.connect(gain);
      gain.connect(context.destination);
      source.start();
      resources.current.timer = setTimeout(() => stop(), 900);
    } catch {
      setStatus('声音播放不可用，波形仍可观察');
    }
  };
  return (
    <div ref={root} className="textbook-em sound-measurement-lab">
      <div className="textbook-em-state">
        <span>{t(lake ? '湖上闪光与水下钟声' : '同一时间窗比较两段声音')}</span>
        <span>
          {t(
            lake
              ? '教材模拟：14千米、10秒'
              : first.source === 'synthetic' && second.source === 'synthetic'
                ? '合成do、sol示例'
                : '麦克风采集与示例',
          )}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 330"
        role="img"
        aria-label={t('计算机显示等时长声音波形，或两船用闪光和水下钟声计时')}
      >
        {!lake ? (
          <>
            <rect
              x="35"
              y="55"
              width="290"
              height="195"
              rx="14"
              fill="#cbd5bd"
              stroke="#95ab8c"
              strokeWidth="3"
            />
            <rect x="47" y="67" width="266" height="168" rx="7" fill="#f1f3e6" />
            <path
              d="M166 251V273H194V251M140 281H220"
              stroke="#a1b18f"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <rect
              x="54"
              y="82"
              width="251"
              height="143"
              fill="#dfe8ce"
              opacity={stage === 2 ? 0.7 : 0.25}
            />
            {[0, 1].map((row) => (
              <g key={row}>
                <path d={`M55 ${116 + row * 75}H305`} stroke="#c4d2b4" />
                <text x="55" y={81 + row * 75} className="em-small">
                  {row === 0 ? 'do / A' : 'sol / B'}
                </text>
              </g>
            ))}
            <polyline
              points={lineA.map((v, i) => `${55 + (i / 600) * 250},${116 - v * 25}`).join(' ')}
              stroke="#9f8c5b"
              strokeWidth="1.5"
              fill="none"
            />
            {(stage !== 0 || !film.watch) && (
              <polyline
                points={lineB.map((v, i) => `${55 + (i / 600) * 250},${191 - v * 25}`).join(' ')}
                stroke="#789e90"
                strokeWidth="1.5"
                fill="none"
              />
            )}
            {stage === 2 &&
              [first, second].map((clip, row) => {
                const frequency = clip.frequency;
                return frequency
                  ? Array.from({ length: Math.floor(duration * frequency) + 1 }, (_, i) => (
                      <path
                        key={`${row}-${i}`}
                        d={`M${55 + (i / frequency / duration) * 250} ${138 + row * 75}v6`}
                        stroke={row === 0 ? '#a18e5e' : '#88a394'}
                      />
                    ))
                  : null;
              })}

            <path
              d="M23 218v27q0 10 12 10M23 239q-11 0-11-12v-17q0-9 11-9t11 9v17q0 12-11 12Z"
              fill="#bbc8af"
              stroke="#92a487"
              strokeWidth="2"
            />
            <path d="M35 255q-7 32 20 32h25" stroke="#a4b092" fill="none" strokeWidth="2" />
          </>
        ) : (
          <>
            <rect x="18" y="148" width="324" height="130" rx="8" fill="#dcebe1" />
            <path
              d="M18 148q18-4 36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0"
              stroke="#a6c3b2"
              fill="none"
            />
            <path
              d="M27 133H115L100 151H42ZM241 133H332L317 151H256Z"
              fill="#c7b18a"
              stroke="#a89472"
              strokeWidth="2"
            />
            {[65, 287].map((x) => (
              <g key={x}>
                <circle cx={x} cy="104" r="8" fill="#cfb58d" />
                <path d={`M${x} 115V132`} stroke="#93a986" strokeWidth="10" strokeLinecap="round" />
              </g>
            ))}
            <path
              d="M65 119L38 112M65 119L94 124L95 204"
              stroke="#b3a17f"
              strokeWidth="3"
              fill="none"
            />
            <path d="M36 121V87" stroke="#aa9369" strokeWidth="4" />
            <path
              d="M31 89q-7-13 4-25q2 10 7 13q3 9-4 12Z"
              fill="#d5b56d"
              opacity={time < 0.25 ? 1 : 0.2}
            />
            <path
              d="M78 150V196M69 197Q78 184 87 197L92 219H64Z"
              fill="#b6aa78"
              stroke="#9d986e"
              strokeWidth="2"
            />
            <circle cx="78" cy="223" r="3" fill="#a39464" />
            <path d={`M95 204L${time < 0.25 ? 89 : 101} 211`} stroke="#8e9b7b" strokeWidth="4" />
            <path
              d="M252 197L273 210V220L252 233Z"
              fill="#c2b98e"
              stroke="#a29e75"
              strokeWidth="2"
            />
            <path d="M273 215H286V111" stroke="#a9a37a" strokeWidth="5" fill="none" />
            <defs>
              <clipPath id={uid + 'water'}>
                <rect x="18" y="151" width="324" height="127" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}water)`}>
              {[0, 0.07, 0.14].map(
                (d, i) =>
                  front > d && (
                    <circle
                      key={i}
                      cx="78"
                      cy="215"
                      r={(front - d) * 174}
                      fill="none"
                      stroke="#81a897"
                      strokeWidth={i === 0 ? 2.5 : 1.2}
                      opacity={1 - i * 0.25}
                    />
                  ),
              )}
            </g>
            {time < 0.25 && (
              <path d="M38 80L279 105" stroke="#ccb370" strokeWidth="2" strokeDasharray="6 6" />
            )}
            <circle cx="180" cy="91" r="28" fill="#f0f1df" stroke="#9fae8d" strokeWidth="2" />
            <path d="M173 61V55H187V61" stroke="#9fae8d" fill="none" strokeWidth="3" />
            <text x="180" y="97" textAnchor="middle">
              {Math.min(time, measurement.delay).toFixed(1)}s
            </text>
            {arrived && (
              <circle cx="252" cy="215" r="21" fill="none" stroke="#b7a164" strokeWidth="3" />
            )}
            <path d="M78 296H252m-6-4 6 4-6 4M84 292l-6 4 6 4" stroke="#a5b599" fill="none" />
            <text x="165" y="321" textAnchor="middle">
              {(measurement.distance / 1000).toFixed(1)} km
            </text>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {lake
          ? t(arrived ? '听到水下钟声，停止计时' : '看到闪光，开始计时')
          : `${(duration * 1000).toFixed(2)} ms · ${t('共同时间窗')}`}
      </p>
      <div className="textbook-em-meters">
        {lake ? (
          <>
            <span>
              Δt <b>{measurement.delay.toFixed(1)} s</b>
            </span>
            <span>
              v ≈ <b>{arrived ? measurement.neglectLight.toFixed(0) : '—'} m/s</b>
            </span>
          </>
        ) : (
          <>
            <span>
              A <b>{first.frequency?.toFixed(1) ?? '—'} Hz</b>
            </span>
            <span>
              B <b>{second.frequency?.toFixed(1) ?? '—'} Hz</b>
            </span>
            <span>
              {t('同窗周期数')}{' '}
              <b>
                {first.frequency ? (first.frequency * duration).toFixed(1) : '—'} :{' '}
                {second.frequency ? (second.frequency * duration).toFixed(1) : '—'}
              </b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="segmented">
            {['声音波形比较', '水中声速测量'].map((z, i) => (
              <button key={z} aria-pressed={mode === i} onClick={() => setMode(i)}>
                {t(z)}
              </button>
            ))}
          </div>
          {mode === 0 ? (
            <>
              <Range
                label={t(first.frequency ? '第一段包含的周期数' : '时间窗缩放')}
                min={3}
                max={12}
                step={1}
                value={cycles}
                onChange={setCycles}
              />
              <div className="segmented">
                <button disabled={busy} onClick={() => capture('a')}>
                  {t('采集声音A')}
                </button>
                <button disabled={busy} onClick={() => capture('b')}>
                  {t('采集声音B')}
                </button>
                <button disabled={busy} onClick={() => listen(a)}>
                  {t('试听A')}
                </button>
                <button disabled={busy} onClick={() => listen(b)}>
                  {t('试听B')}
                </button>
                <button
                  onClick={() => {
                    stop();
                    setBusy(false);
                    setA(defaultA);
                    setB(defaultB);
                    setStatus('');
                  }}
                >
                  {t('恢复教材合成示例')}
                </button>
              </div>
              <p aria-live="polite">
                {t(status || '点击后才请求麦克风；短片段仅保存在当前页面。')}
              </p>
            </>
          ) : (
            <>
              <Range
                label={t('船间距离')}
                min={5}
                max={20}
                step={0.5}
                unit="km"
                value={distance}
                onChange={setDistance}
              />
              <Range
                label={t('看到光后等候声音')}
                min={4}
                max={15}
                step={0.1}
                unit="s"
                value={delay}
                onChange={setDelay}
              />
              <Range
                label={t('计时进度')}
                min={0}
                max={15}
                step={0.1}
                unit="s"
                value={elapsed}
                onChange={setElapsed}
              />
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('示例、实测与历史数据')}</summary>
        <p>
          {t(
            '波形示例使用教材某乐律中的264与396赫兹，频率比为3比2；它们是合成信号，不是假称录音。麦克风片段以自相关估计80至1000赫兹的稳定基频，无稳定周期时不填写频率。湖上14千米、10秒来自教材模拟题，并非原历史实测记录；装置与横纵比例为示意。光传播时间约47微秒，对本题近似可忽略。',
          )}
        </p>
      </details>
    </div>
  );
}
