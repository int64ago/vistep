import { useEffect, useRef } from 'react';

/** A single clock per scene. Resume without integrating hidden wall-clock time. */
export function useSimulation(frame: (dt: number, time: number) => void, running = true) {
  const host = useRef<HTMLDivElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    if (!running) return;
    let id = 0,
      elapsed = 0,
      visible = !host.current,
      disposed = false;
    let last: number | null = null;
    const schedule = () => {
      if (!disposed && !id && visible && !document.hidden) id = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(id);
      id = 0;
      last = null;
    };
    const tick = (now: number) => {
      id = 0;
      if (disposed || !visible || document.hidden) {
        last = null;
        return;
      }
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.04);
      elapsed += dt;
      last = now;
      frameRef.current(dt, elapsed);
      schedule();
    };
    const update = () => {
      if (visible && !document.hidden) schedule();
      else stop();
    };
    const obs = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = null;
      update();
    });
    document.addEventListener('visibilitychange', update);
    if (host.current) obs.observe(host.current);
    update();
    return () => {
      disposed = true;
      stop();
      obs.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [running]);
  return host;
}
