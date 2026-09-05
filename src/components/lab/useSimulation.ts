import { useEffect, useRef } from 'react';

/** A single clock per scene. Resume without integrating hidden wall-clock time. */
export function useSimulation(frame: (dt: number, time: number) => void, running = true) {
  const host = useRef<HTMLDivElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    if (!running) return;
    let id = 0,
      last = 0,
      elapsed = 0,
      visible = true;
    const tick = (now: number) => {
      if (visible && !document.hidden) {
        const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
        elapsed += dt;
        frameRef.current(dt, elapsed);
      }
      last = visible && !document.hidden ? now : 0;
      id = requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = 0;
    });
    if (host.current) obs.observe(host.current);
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      obs.disconnect();
    };
  }, [running]);
  return host;
}
