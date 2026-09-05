import { useLayoutEffect, useRef, useState } from 'react';

/** Native plot coordinates; SVG labels are never scaled to fit a smaller column. */
export function useSuspensionPlotWidth() {
  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(300);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const measure = () => setWidth(Math.max(180, ref.current!.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function useSuspensionDiagramSize() {
  const ref = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 300, height: 350 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const measure = () => {
      const rect = ref.current!.getBoundingClientRect();
      setSize({ width: Math.max(180, rect.width), height: Math.max(220, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
}
