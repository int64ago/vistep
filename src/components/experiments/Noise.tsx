import { t } from '../../i18n';
import { useEffect, useRef, useState } from 'react';
import { Range, Metric } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import { useShowcase } from '../lab/Showcase';
import { effectivePhase, residualAmplitude } from '../../models/noise';
import { noiseShot } from '../../models/direction';
export default function Noise() {
  const demo = useShowcase();
  const [manualFrequency, setFrequency] = useState(160),
    [manualAmplitude, setAmplitude] = useState(1),
    [manualPhase, setPhase] = useState(180),
    [manualDelay, setDelay] = useState(0),
    [listening, setListening] = useState(false),
    [manualAnimated, setAnimated] = useState(false),
    [error, setError] = useState('');
  const shot = demo.watch ? noiseShot(demo) : null;
  const frequency = shot?.frequency ?? manualFrequency;
  const amplitude = shot?.amplitude ?? manualAmplitude;
  const phase = shot?.phase ?? manualPhase;
  const delay = shot?.delay ?? manualDelay;
  const animated = demo.watch ? demo.playing : manualAnimated;
  const canvas = useRef<HTMLCanvasElement>(null),
    audio = useRef<{
      context: AudioContext;
      a: OscillatorNode;
      b: OscillatorNode;
      gain: GainNode;
      master: GainNode;
    } | null>(null),
    time = useRef(0);
  const phi = effectivePhase(phase, frequency, delay),
    residual = residualAmplitude(amplitude, phi);
  const draw = () => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const w = el.clientWidth,
      h = el.clientHeight,
      dpr = Math.min(devicePixelRatio, 2);
    if (el.width !== w * dpr || el.height !== h * dpr) {
      el.width = w * dpr;
      el.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const rows = [
      { name: t('环境声'), color: '#72b9df', fn: (a: number) => Math.sin(a) },
      {
        name: t('抵消声'),
        color: '#eab187',
        fn: (a: number) => amplitude * Math.sin(a + phi),
      },
      {
        name: t('耳边的叠加结果'),
        color: '#81d8bd',
        fn: (a: number) => Math.sin(a) + amplitude * Math.sin(a + phi),
      },
    ];
    const rowHeight = h / rows.length;
    const scale = Math.min(26, rowHeight * 0.18);
    rows.forEach((row, j) => {
      const y = (j + 0.62) * rowHeight;
      ctx.strokeStyle = '#31414c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillStyle = '#819eac';
      ctx.font = '12px sans-serif';
      ctx.fillText(row.name, 5, j * rowHeight + 14);
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const a = (x / w) * frequency * Math.PI * 2 * 0.02 + time.current,
          yy = y - row.fn(a) * scale;
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.strokeStyle = row.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    });
  };
  const host = useSimulation((dt) => {
    if (demo.watch) time.current = demo.time * 1.5;
    else if (animated) time.current += dt * 1.5;
    draw();
  }, true);
  useEffect(() => {
    time.current = 0;
    draw();
  }, [demo.run, demo.watch]);
  useEffect(draw, [frequency, amplitude, phase, delay]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.a.frequency.setTargetAtTime(frequency, a.context.currentTime, 0.04);
    a.b.frequency.setTargetAtTime(frequency, a.context.currentTime, 0.04);
    a.gain.gain.setTargetAtTime(amplitude, a.context.currentTime, 0.04);
    const real = new Float32Array([0, Math.sin(phi)]),
      imag = new Float32Array([0, Math.cos(phi)]);
    a.b.setPeriodicWave(a.context.createPeriodicWave(real, imag, { disableNormalization: true }));
  }, [frequency, amplitude, phase, delay]);
  useEffect(() => {
    let inView = true;
    const update = () => {
      const a = audio.current;
      if (!a) return;
      a.master.gain.setTargetAtTime(demo.narrating ? 0.008 : 0.035, a.context.currentTime, 0.15);
      if (listening && inView && !document.hidden && (!demo.watch || demo.playing))
        void a.context.resume();
      else void a.context.suspend();
    };
    document.addEventListener('visibilitychange', update);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    });
    if (host.current) io.observe(host.current);
    update();
    return () => {
      document.removeEventListener('visibilitychange', update);
      io.disconnect();
    };
  }, [listening, demo.watch, demo.playing, demo.narrating]);
  useEffect(
    () => () => {
      audio.current?.context.close();
    },
    [],
  );
  const toggle = async () => {
    if (listening) {
      await audio.current?.context.suspend();
      setListening(false);
      return;
    }
    try {
      if (!audio.current) {
        const context = new AudioContext();
        const a = context.createOscillator(),
          b = context.createOscillator(),
          gain = context.createGain(),
          master = context.createGain();
        a.frequency.value = frequency;
        b.frequency.value = frequency;
        gain.gain.value = amplitude;
        master.gain.value = 0.035;
        b.setPeriodicWave(
          context.createPeriodicWave(
            new Float32Array([0, Math.sin(phi)]),
            new Float32Array([0, Math.cos(phi)]),
            { disableNormalization: true },
          ),
        );
        a.connect(master);
        b.connect(gain).connect(master);
        master.connect(context.destination);
        const start = context.currentTime + 0.06;
        a.start(start);
        b.start(start);
        audio.current = { context, a, b, gain, master };
      }
      await audio.current.context.resume();
      setListening(true);
      setError('');
    } catch {
      setError(t('当前浏览器无法播放声音，波形实验仍可完整使用。'));
    }
  };
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>{t('用一段声音，抵消另一段声音。')}</h2>
        <div className="lab-actions">
          <button className="btn primary" onClick={toggle}>
            {listening ? t('◼ 关闭试听') : t('♫ 开启轻声试听')}
          </button>
          <button className="btn" onClick={() => setAnimated(!animated)}>
            {animated ? t('Ⅱ 停住波形') : t('▷ 慢放波形')}
          </button>
          <button
            className="btn"
            onClick={() => {
              setFrequency(160);
              setAmplitude(1);
              setPhase(180);
              setDelay(0);
              setAnimated(false);
              audio.current?.context.suspend();
              setListening(false);
            }}
          >
            {t('↻ 重置')}
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <div className="lab-scene dark">
          <div className="wave-scene">
            <canvas
              className="wave-canvas"
              ref={canvas}
              role="img"
              aria-label={t(
                '环境声与抵消声的叠加。残余振幅为原声的{0}%。',
                (residual * 100).toFixed(0),
              )}
            />
          </div>
          <div className="wave-status">
            <span>{t('同频率 · 单点处的声压叠加')}</span>
            <span>
              {residual < 0.001
                ? t('理想相消')
                : Math.abs(residual - 1) < 0.001
                  ? t('声压保持不变')
                  : residual > 1
                    ? t('此时反而更响')
                    : t('声压减小了')}
            </span>
          </div>
          {error && (
            <p role="status" className="lab-caption">
              {error}
            </p>
          )}
        </div>
        <div className="lab-controls">
          <Range
            label={t('声音频率')}
            value={frequency}
            min={80}
            max={800}
            step={10}
            unit="Hz"
            onChange={setFrequency}
          />
          <Range
            label={t('抵消声相对幅度')}
            value={amplitude}
            min={0}
            max={1.5}
            step={0.05}
            onChange={setAmplitude}
          />
          <Range
            label={t('抵消声相位')}
            value={phase}
            min={0}
            max={360}
            unit="°"
            onChange={setPhase}
          />
          <Range
            label={t('额外延迟')}
            value={delay}
            min={0}
            max={2}
            step={0.05}
            unit="ms"
            onChange={setDelay}
          />
          <div className="lab-callout">
            {t('先保持 180°，再加入一点延迟。提高频率后，相同的延迟会造成更大的相位偏差。')}
          </div>
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('残余振幅 / 原振幅')} value={residual.toFixed(2)} />
        <Metric
          label={t('相对声压级变化')}
          value={residual < 0.0001 ? t('理想 −∞') : (20 * Math.log10(residual)).toFixed(1)}
          unit={residual < 0.0001 ? undefined : 'dB'}
        />
        <Metric label={t('额外相位偏差')} value={(frequency * delay * 0.36).toFixed(1)} unit="°" />
      </div>
      <p className="lab-caption">
        {t('试听是低音量的合成纯音，展示同一点的声压叠加，')}
        <strong>{t('不会消除你房间里的真实噪声')}</strong>
        {t('。真实降噪还受麦克风位置、声学路径、算法与佩戴方式影响。')}
      </p>
    </div>
  );
}
