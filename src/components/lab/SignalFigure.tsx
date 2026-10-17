import { useEffect, useRef, useState } from 'react';
/** SVG units match measured CSS pixels, preserving labels at narrow widths. */
export function useSignalWidth() {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) => setWidth(Math.max(240, e.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { host, width, compact: width < 560 };
}
export function signalPath(
  fn: (t: number) => number,
  x: (t: number) => number,
  y: (v: number) => number,
  end = 1,
  count = 361,
) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i * end) / (count - 1);
    return `${i ? 'L' : 'M'}${x(t).toFixed(2)},${y(fn(t)).toFixed(2)}`;
  }).join(' ');
}
