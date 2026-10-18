import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
/** An optional illustrative tone. It never starts without a direct button click. */
export function useLabTone(
  root: RefObject<HTMLDivElement | null>,
  frequency: number,
  gain: number,
  allowed: boolean,
) {
  const [on, setOn] = useState(false),
    [unavailable, setUnavailable] = useState(false),
    audio = useRef<{ context: AudioContext; oscillator: OscillatorNode; gain: GainNode } | null>(
      null,
    ),
    generation = useRef(0);
  const stop = useCallback(() => {
    generation.current++;
    const a = audio.current;
    audio.current = null;
    if (a) {
      try {
        a.oscillator.stop();
      } catch {}
      void a.context.close().catch(() => {});
    }
    setOn(false);
  }, []);
  const toggle = async () => {
    if (audio.current) {
      stop();
      return;
    }
    if (!allowed) return;
    const token = ++generation.current;
    try {
      const context = new AudioContext(),
        oscillator = context.createOscillator(),
        gainNode = context.createGain();
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      audio.current = { context, oscillator, gain: gainNode };
      await context.resume();
      if (token !== generation.current) return;
      oscillator.start();
      gainNode.gain.setTargetAtTime(Math.min(0.06, Math.max(0, gain)), context.currentTime, 0.025);
      setUnavailable(false);
      setOn(true);
    } catch {
      stop();
      setUnavailable(true);
    }
  };
  useEffect(() => {
    const a = audio.current;
    if (a) {
      a.oscillator.frequency.setTargetAtTime(frequency, a.context.currentTime, 0.025);
      a.gain.gain.setTargetAtTime(Math.min(0.06, Math.max(0, gain)), a.context.currentTime, 0.025);
    }
  }, [frequency, gain]);
  useEffect(() => {
    if (!allowed) stop();
  }, [allowed, stop]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) stop();
    });
    if (root.current) observer.observe(root.current);
    const visibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      stop();
    };
  }, [root, stop]);
  return { on, toggle, unavailable };
}
