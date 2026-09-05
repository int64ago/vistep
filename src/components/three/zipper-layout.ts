import { useEffect, useRef, useState } from 'react';

/** SVG meet scaling uses the smaller axis, including a CSS max-height. */
export function zipperTextSize(
  width: number,
  height: number,
  drawnWidth: number,
  drawnHeight: number,
) {
  if (![width, height, drawnWidth, drawnHeight].every((v) => Number.isFinite(v) && v > 0))
    throw new RangeError('Positive SVG and drawing dimensions required');
  return 16 / Math.min(drawnWidth / width, drawnHeight / height);
}

export function useZipperSvg(width: number, height: number, compact: boolean) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const measure = () => {
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setDrawing((old) =>
        old && Math.abs(old.width - rect.width) < 0.1 && Math.abs(old.height - rect.height) < 0.1
          ? old
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [width, height]);
  const initialWidth = compact ? 254 : width;
  const fontSize = zipperTextSize(
    width,
    height,
    drawing?.width ?? initialWidth,
    drawing?.height ?? (initialWidth * height) / width,
  );
  return { ref, fontSize };
}

/** This annotation is drawn after the complete assembly, outside the guide. */
export function zipperMarkedLabel(
  width: number,
  fontSize: number,
  target: readonly [number, number],
) {
  const box = {
    x: 12,
    y: 42,
    width: Math.max(44, fontSize * 2.3),
    height: Math.max(28, fontSize * 1.6),
  };
  return {
    box,
    text: { x: box.x + box.width / 2, y: box.y + box.height / 2 + fontSize * 0.34 },
    leader: `M${box.x + box.width} ${box.y + box.height / 2}L${Math.min(width - 12, target[0] - 12)} ${target[1] - 12}L${target[0]} ${target[1]}`,
  };
}
