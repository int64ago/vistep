import { useEffect, useRef, useState } from 'react';
import { landmineExteriorArt } from '../../models/landmine-art';
import type { LandmineVisual } from './LandmineStudio';
import { t } from '../../i18n';
export default function LandmineFlat({ visual }: { visual: LandmineVisual }) {
  const host = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 300, height: 330 });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([e]) =>
      setSize({
        width: Math.max(180, e.contentRect.width),
        height: Math.max(220, e.contentRect.height),
      }),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const art = landmineExteriorArt(
    size.width,
    size.height,
    visual.reveal,
    visual.season,
    visual.closeup,
  );
  return (
    <div ref={host} style={{ width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={t('完整地雷外壳与同一土层切面的二维外观视图')}
        style={{ width: '100%', height: '100%' }}
      >
        {art.paths.map(({ d, fill, stroke, width, opacity, part }, i) => (
          <path
            key={i}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={width}
            opacity={opacity}
            data-landmine-part={part}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
